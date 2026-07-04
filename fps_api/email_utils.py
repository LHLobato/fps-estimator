"""
Utilitário para envio de emails via SMTP.
Usado para envio de códigos OTP de autenticação.
"""

import smtplib
from email.message import EmailMessage
from fps_api.auth_config import SMTP_FROM_EMAIL, SMTP_HOST, SMTP_PASS, SMTP_PORT, SMTP_USER

def send_email(to_email: str, subject: str, body: str) -> bool:
    """
    Envia email via SMTP.
    Retorna True se enviado com sucesso, False caso contrário.
    """
    try:
        print(f"[EMAIL] Iniciando envio para {to_email}")
        msg = EmailMessage()
        msg["Subject"] = subject
        msg["From"] = SMTP_FROM_EMAIL
        msg["To"] = to_email
        msg.set_content(body)

        print(f"[EMAIL] Conectando ao {SMTP_HOST}:{SMTP_PORT}")
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            print(f"[EMAIL] Iniciando TLS")
            server.starttls()
            print(f"[EMAIL] Fazendo login com {SMTP_USER}")
            server.login(SMTP_USER, SMTP_PASS)
            print(f"[EMAIL] Enviando mensagem")
            server.send_message(msg)

        print(f"[EMAIL] ✅ Email enviado com sucesso para {to_email}")
        return True
    except Exception as e:
        print(f"[EMAIL] ❌ Erro ao enviar email para {to_email}: {e}")
        import traceback
        traceback.print_exc()
        return False


def send_email_signup(email: str, code: str) -> bool:
    """
    Envia email de verificação de conta com código OTP.
    """
    subject = "Verifique seu email - FPS-R API"
    body = f"""
    Olá! Seu código de verificação é: {code}

    Este código expira em 5 minutos.
    Se você não solicitou esta verificação, ignore este email.
    """
    return send_email(email, subject, body)


def send_email_login(email: str, code: str) -> bool:
    """
    Envia email de login com código OTP (2FA).
    """
    subject = "Código de verificação de login - FPS-R API"
    body = f"""
    Seu código de verificação de login é: {code}

    Este código expira em 1 minuto.
    Se você não tentou fazer login, ignore este email.
    """
    return send_email(email, subject, body)


def send_email_recovery(email: str, code: str) -> bool:
    """
    Envia email de recuperação de senha com código OTP (2FA).
    """
    subject = "Código de verificação para troca de senha - FPS-R API"
    body = f"""
    Seu código de verificação de identidade é: {code}
    Este código expira em 1 minuto.
    Se você não tentou redefinir sua senha, ignore este email.
    """
    return send_email(email, subject, body)
