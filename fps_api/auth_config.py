"""
Configurações de autenticação e utilitários JWT.
Centraliza todas as configurações relacionadas a auth para facilitar manutenção.
"""

import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()

# ========================
# JWT Configuration
# ========================
SECRET_KEY = os.getenv("JWT_SECRET_KEY")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 7

# ========================
# Email Configuration
# ========================
SMTP_HOST = os.getenv("SMTP_HOST")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
SMTP_USER = os.getenv("SMTP_USER")
SMTP_PASS = os.getenv("SMTP_PASS")
SMTP_FROM_EMAIL = os.getenv("SMTP_FROM_EMAIL")

# ========================
# OTP Configuration
# ========================
OTP_LOGIN_INTERVAL = 60  # 1 minuto para login
OTP_SIGNUP_INTERVAL = 300  # 5 minutos para signup


def get_token_expires_minutes() -> int:
    """Retorna tempo de expiração do access token em minutos."""
    return ACCESS_TOKEN_EXPIRE_MINUTES


def get_refresh_token_expires() -> timedelta:
    """Retorna timedelta para refresh token."""
    return timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
