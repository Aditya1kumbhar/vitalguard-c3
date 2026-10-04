import os
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
import jwt
import bcrypt
from pydantic import BaseModel
from db import get_db_connection

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
async def get_challenge():
    return {"challenge": secrets.token_urlsafe(32)}

@router.get("/check-identifier")
async def check_identifier(identifier: str):
    async with get_db_connection() as db:
        cursor = await db.execute("SELECT credential_id FROM guardians WHERE identifier = ?", (identifier,))
        row = await cursor.fetchone()
        if row:
            return {"exists": True, "credential_id": row["credential_id"]}
        return {"exists": False}

@router.post("/register")
async def register(req: RegisterRequest):
    async with get_db_connection() as db:
        # Check if identifier or band_id exists
        cursor = await db.execute("SELECT id FROM guardians WHERE identifier = ? OR band_id = ?", (req.identifier, req.band_id))
        if await cursor.fetchone():
            raise HTTPException(status_code=400, detail="Account with this identifier or Band ID already exists.")
            
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
async def login(req: LoginRequest):
    async with get_db_connection() as db:
        cursor = await db.execute("SELECT * FROM guardians WHERE identifier = ?", (req.identifier,))
        guardian = await cursor.fetchone()
        
    if not guardian:
        raise HTTPException(status_code=404, detail="Account not found.")
        
    # Verify Passkey if provided
    if req.credential_id:
        if req.credential_id != guardian["credential_id"]:
            raise HTTPException(status_code=401, detail="Invalid biometric credential.")
    elif req.pin_hash:
        if not guardian["pin_hash"] or not bcrypt.checkpw(req.pin_hash.encode(), guardian["pin_hash"].encode()):
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
