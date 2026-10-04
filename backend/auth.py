import os
import secrets
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
import jwt
import bcrypt
from pydantic import BaseModel
from db import get_db_connection

# JWT Configuration
SECRET_KEY = os.getenv("JWT_SECRET", "dev-secret-key-do-not-use-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 30

router = APIRouter(prefix="/api/auth", tags=["auth"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/token")

class PINSetup(BaseModel):
    guardian_name: str
    pin_hash: str # Note: In a real app this would be the raw PIN or client-side hash, we're accepting the offline hash to demonstrate offline/online PIN parity.

class PINLogin(BaseModel):
    pin_hash: str # Offline client hash to verify

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
    challenge = secrets.token_urlsafe(32)
    return {"challenge": challenge}

@router.post("/set-pin")
async def set_pin(setup: PINSetup):
    # Hash the client-side hash again with bcrypt for storage
    server_hash = bcrypt.hashpw(setup.pin_hash.encode(), bcrypt.gensalt()).decode()
    
    async with get_db_connection() as db:
        ts = datetime.now(timezone.utc).isoformat()
        cursor = await db.execute("""
            INSERT INTO guardians (guardian_name, pin_hash, created_at, last_login_at)
            VALUES (?, ?, ?, ?)
        """, (setup.guardian_name, server_hash, ts, ts))
        await db.commit()
        guardian_id = cursor.lastrowid
        
    access_token = create_access_token(
        data={"sub": str(guardian_id), "name": setup.guardian_name},
        expires_delta=timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/verify-pin")
async def verify_pin(login: PINLogin):
    async with get_db_connection() as db:
        # Assuming ID 1 for single guardian
        cursor = await db.execute("SELECT * FROM guardians WHERE id = 1")
        guardian = await cursor.fetchone()
        
    if not guardian:
        raise HTTPException(status_code=400, detail="Guardian not found")
        
    if not bcrypt.checkpw(login.pin_hash.encode(), guardian["pin_hash"].encode()):
        raise HTTPException(status_code=401, detail="Incorrect PIN")
        
    async with get_db_connection() as db:
        ts = datetime.now(timezone.utc).isoformat()
        await db.execute("UPDATE guardians SET last_login_at = ? WHERE id = 1", (ts,))
        await db.commit()

    access_token = create_access_token(
        data={"sub": str(guardian["id"]), "name": guardian["guardian_name"]},
        expires_delta=timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    )
    return {"access_token": access_token, "token_type": "bearer"}

class PasskeyRegister(BaseModel):
    guardian_name: str
    credential_id: str

class PasskeyLogin(BaseModel):
    credential_id: str
    guardian_id: int = 1

@router.post("/passkey-register")
async def passkey_register(reg: PasskeyRegister):
    async with get_db_connection() as db:
        ts = datetime.now(timezone.utc).isoformat()
        cursor = await db.execute("SELECT id FROM guardians WHERE id = 1")
        existing = await cursor.fetchone()
        if existing:
            await db.execute("""
                UPDATE guardians 
                SET guardian_name = ?, last_login_at = ?
                WHERE id = 1
            """, (reg.guardian_name, ts))
            guardian_id = 1
        else:
            cursor = await db.execute("""
                INSERT INTO guardians (guardian_name, created_at, last_login_at)
                VALUES (?, ?, ?)
            """, (reg.guardian_name, ts, ts))
            guardian_id = cursor.lastrowid
        await db.commit()

    access_token = create_access_token(
        data={"sub": str(guardian_id), "name": reg.guardian_name},
        expires_delta=timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/passkey-login")
async def passkey_login(login: PasskeyLogin):
    async with get_db_connection() as db:
        cursor = await db.execute("SELECT * FROM guardians ORDER BY id ASC LIMIT 1")
        guardian = await cursor.fetchone()
        
        if not guardian:
            ts = datetime.now(timezone.utc).isoformat()
            cursor = await db.execute("""
                INSERT INTO guardians (guardian_name, created_at, last_login_at)
                VALUES ('Guardian', ?, ?)
            """, (ts, ts))
            await db.commit()
            guardian_id = cursor.lastrowid
            guardian_name = 'Guardian'
        else:
            guardian_id = guardian["id"]
            guardian_name = guardian["guardian_name"]
            ts = datetime.now(timezone.utc).isoformat()
            await db.execute("UPDATE guardians SET last_login_at = ? WHERE id = ?", (ts, guardian_id))
            await db.commit()

    access_token = create_access_token(
        data={"sub": str(guardian_id), "name": guardian_name},
        expires_delta=timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    )
    return {"access_token": access_token, "token_type": "bearer", "guardian_name": guardian_name}

