from app.auth.jwt_handler import create_access_token

token = create_access_token({
    "email": "nirmal@gmail.com"
})

print(token)