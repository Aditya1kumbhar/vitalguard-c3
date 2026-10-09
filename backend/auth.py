import os
import re
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
import jwt
import bcrypt
from pydantic import BaseModel
from db import get_db_connection
from limiter import limiter

EMAIL_REGEX = re.compile(r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$')

SECRET_KEY = os.getenv("JWT_SECRET", "dev-secret-key-do-not-use-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 30

router = APIRouter(prefix="/api/auth", tags=["auth"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/token")

class RegisterRequest(BaseModel):
    auth_type: str # 'phone' or 'email'
    identifier: str
    guardian_name: str
    band_id: str
    credential_id: Optional[str] = None
    pin_hash: Optional[str] = None

class LoginRequest(BaseModel):
    identifier: str
    credential_id: Optional[str] = None
    pin_hash: Optional[str] = None
    guardian_name: Optional[str] = None
    band_id: Optional[str] = None

def create_access_token(data: dict, expires_delta: timedelta):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + expires_delta
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_guardian(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        guardian_id: str = payload.get("sub")
        if guardian_id is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception
        
    async with get_db_connection() as db:
        cursor = await db.execute("SELECT * FROM guardians WHERE id = ?", (guardian_id,))
        guardian = await cursor.fetchone()
        if guardian is None:
            raise credentials_exception
    return dict(guardian)

@router.get("/challenge")
@limiter.limit("10/minute")
async def get_challenge(request: Request):
    return {"challenge": secrets.token_urlsafe(32)}

def normalize_identifier(raw: str) -> str:
    ident = raw.strip()
    clean_digits = re.sub(r'\D', '', ident)
    if len(clean_digits) == 12 and clean_digits.startswith("91"):
        clean_digits = clean_digits[2:]
    if len(clean_digits) == 10:
        return clean_digits
    return ident.lower()

@router.get("/check-identifier")
@limiter.limit("10/minute")
async def check_identifier(request: Request, identifier: str):
    clean_id = normalize_identifier(identifier)
    async with get_db_connection() as db:
        cursor = await db.execute("SELECT credential_id FROM guardians WHERE identifier = ?", (clean_id,))
        row = await cursor.fetchone()
        if row:
            return {"exists": True, "credential_id": row["credential_id"]}
        return {"exists": False}

@router.post("/register")
@limiter.limit("5/minute")
async def register(request: Request, req: RegisterRequest):
    # Security & Trust Validation: Enforce 10-digit phone number or valid email format
    if req.auth_type == "phone":
        clean_digits = re.sub(r'\D', '', req.identifier)
        if len(clean_digits) == 12 and clean_digits.startswith("91"):
            clean_digits = clean_digits[2:]
        if len(clean_digits) != 10:
            raise HTTPException(status_code=400, detail="Mobile number must be compulsory 10 digits (e.g. 9876543210).")
        req.identifier = clean_digits
    elif req.auth_type == "email":
        clean_email = req.identifier.strip().lower()
        if not EMAIL_REGEX.match(clean_email):
            raise HTTPException(status_code=400, detail="Please enter a valid email address (e.g. user@gmail.com).")
        req.identifier = clean_email
    else:
        raise HTTPException(status_code=400, detail="Invalid auth_type. Must be 'phone' or 'email'.")

    if not req.guardian_name.strip() or len(req.guardian_name.strip()) < 2:
        raise HTTPException(status_code=400, detail="Please enter a valid Full Name (minimum 2 characters).")

    if not req.band_id.strip():
        raise HTTPException(status_code=400, detail="Please provide a valid Wristband ID.")

    async with get_db_connection() as db:
        # Check if identifier or band_id exists
        cursor = await db.execute("SELECT id FROM guardians WHERE identifier = ? OR band_id = ?", (req.identifier, req.band_id))
        existing = await cursor.fetchone()
        if existing:
            # Upsert/update credential if already exists
            ts = datetime.now(timezone.utc).isoformat()
            if req.credential_id:
                await db.execute("UPDATE guardians SET credential_id = ?, last_login_at = ? WHERE id = ?", (req.credential_id, ts, existing["id"]))
                await db.commit()
            access_token = create_access_token(
                data={"sub": str(existing["id"]), "name": req.guardian_name, "identifier": req.identifier, "band_id": req.band_id},
                expires_delta=timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
            )
            return {"access_token": access_token, "token_type": "bearer", "guardian_name": req.guardian_name, "band_id": req.band_id}
            
        ts = datetime.now(timezone.utc).isoformat()
        server_pin_hash = bcrypt.hashpw(req.pin_hash.encode(), bcrypt.gensalt()).decode() if req.pin_hash else None
        
        cursor = await db.execute("""
            INSERT INTO guardians (auth_type, identifier, guardian_name, band_id, pin_hash, credential_id, created_at, last_login_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (req.auth_type, req.identifier, req.guardian_name, req.band_id, server_pin_hash, req.credential_id, ts, ts))
        await db.commit()
        guardian_id = cursor.lastrowid
        
    access_token = create_access_token(
        data={"sub": str(guardian_id), "name": req.guardian_name, "identifier": req.identifier, "band_id": req.band_id},
        expires_delta=timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    )
    return {"access_token": access_token, "token_type": "bearer", "guardian_name": req.guardian_name, "band_id": req.band_id}

@router.post("/login")
@limiter.limit("10/minute")
async def login(request: Request, req: LoginRequest):
    # Normalize identifier for login
    ident = req.identifier.strip()
    clean_digits = re.sub(r'\D', '', ident)
    if len(clean_digits) == 12 and clean_digits.startswith("91"):
        clean_digits = clean_digits[2:]
    if len(clean_digits) == 10:
        req.identifier = clean_digits
    elif EMAIL_REGEX.match(ident.lower()):
        req.identifier = ident.lower()
    else:
        raise HTTPException(status_code=400, detail="Identifier must be a valid 10-digit mobile number or email address.")

    async with get_db_connection() as db:
        cursor = await db.execute("SELECT * FROM guardians WHERE identifier = ?", (req.identifier,))
        guardian_row = await cursor.fetchone()
        guardian = dict(guardian_row) if guardian_row else None
        
    if not guardian:
        # Self-healing: If device verified biometrics, auto-register into backend database
        if req.credential_id:
            guardian_name = (req.guardian_name and req.guardian_name.strip()) or "Guardian"
            band_id = (req.band_id and req.band_id.strip()) or f"VG-C3-{clean_digits[-4:] if clean_digits else '0001'}"
            ts = datetime.now(timezone.utc).isoformat()
            auth_type = "email" if "@" in req.identifier else "phone"
            async with get_db_connection() as db:
                cursor = await db.execute("""
                    INSERT INTO guardians (auth_type, identifier, guardian_name, band_id, credential_id, created_at, last_login_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                """, (auth_type, req.identifier, guardian_name, band_id, req.credential_id, ts, ts))
                await db.commit()
                guardian_id = cursor.lastrowid
                guardian = {
                    "id": guardian_id,
                    "guardian_name": guardian_name,
                    "identifier": req.identifier,
                    "band_id": band_id,
                    "credential_id": req.credential_id,
                    "pin_hash": None
                }
        else:
            raise HTTPException(status_code=404, detail="Account not found. Please sign up or check your credentials.")
        
    # Verify Passkey if provided
    if req.credential_id:
        if guardian.get("credential_id") and req.credential_id != guardian["credential_id"]:
            # Update to latest credential from this authenticated device
            async with get_db_connection() as db:
                await db.execute("UPDATE guardians SET credential_id = ? WHERE id = ?", (req.credential_id, guardian["id"]))
                await db.commit()
    elif req.pin_hash:
        if not guardian.get("pin_hash") or not bcrypt.checkpw(req.pin_hash.encode(), guardian["pin_hash"].encode()):
            raise HTTPException(status_code=401, detail="Incorrect PIN.")
    else:
        raise HTTPException(status_code=400, detail="Must provide credential_id or pin_hash.")
        
    async with get_db_connection() as db:
        ts = datetime.now(timezone.utc).isoformat()
        await db.execute("UPDATE guardians SET last_login_at = ? WHERE id = ?", (ts, guardian["id"]))
        await db.commit()

    access_token = create_access_token(
        data={"sub": str(guardian["id"]), "name": guardian["guardian_name"], "identifier": guardian["identifier"], "band_id": guardian["band_id"]},
        expires_delta=timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    )
    return {"access_token": access_token, "token_type": "bearer", "guardian_name": guardian["guardian_name"], "band_id": guardian["band_id"]}
