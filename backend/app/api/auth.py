from fastapi import APIRouter, HTTPException
from app.models.user import UserRegister, UserLogin
from app.database.mongodb import users
from app.auth.hash import hash_password, verify_password
from app.auth.jwt_handler import create_access_token

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)

@router.post("/register")
def register(user: UserRegister):

    # Check existing user
    existing_user = users.find_one({"email": user.email})

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already exists"
        )

    # First user is automatically Admin for convenience, otherwise use specified role or default to customer
    is_first = users.count_documents({}) == 0
    assigned_role = "admin" if is_first else (user.role or "customer")

    # Create user document
    new_user = {
        "name": user.name,
        "email": user.email,
        "password": hash_password(user.password),
        "role": assigned_role
    }

    users.insert_one(new_user)

    return {
        "success": True,
        "message": f"User Registered Successfully as {assigned_role}"
    }


@router.post("/login")
def login(user: UserLogin):

    db_user = users.find_one({"email": user.email})

    if not db_user:
        raise HTTPException(
            status_code=401,
            detail="Invalid Email"
        )

    if not verify_password(user.password, db_user["password"]):
        raise HTTPException(
            status_code=401,
            detail="Invalid Password"
        )

    role = db_user.get("role", "customer")

    token = create_access_token({
        "email": db_user["email"],
        "role": role
    })

    return {
        "success": True,
        "message": "Login Successful",
        "access_token": token,
        "token_type": "bearer",
        "name": db_user["name"],
        "email": db_user["email"],
        "role": role
    }