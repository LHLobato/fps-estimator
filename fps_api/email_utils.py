"""
Utilitário para envio de emails via SMTP.
Usado para envio de códigos OTP de autenticação.
"""
import smtplib
from email.message import EmailMessage

from fps_api.auth_config import SMTP_FROM_EMAIL, SMTP_HOST, SMTP_PASS, SMTP_PORT, SMTP_USER

# Ajuste estes valores para bater exatamente com a expiração real configurada
# no fluxo de OTP (ex: se auth_config.py já tiver constantes como
# OTP_SIGNUP_EXPIRY_MINUTES, importe-as de lá em vez de manter aqui).
SIGNUP_EXPIRY_MINUTES = 15
LOGIN_EXPIRY_MINUTES = 5
RECOVERY_EXPIRY_MINUTES = 5

APP_NAME = "FPS-R"


def send_email(to_email: str, subject: str, text_body: str, html_body: str) -> bool:
    """
    Envia email via SMTP com corpo em texto puro (fallback) e HTML.
    Retorna True se enviado com sucesso, False caso contrário.
    """
    try:
        print(f"[EMAIL] Iniciando envio para {to_email}")
        msg = EmailMessage()
        msg["Subject"] = subject
        msg["From"] = SMTP_FROM_EMAIL
        msg["To"] = to_email
        msg.set_content(text_body)
        msg.add_alternative(html_body, subtype="html")

        print(f"[EMAIL] Conectando ao {SMTP_HOST}:{SMTP_PORT}")
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            print("[EMAIL] Iniciando TLS")
            server.starttls()
            print(f"[EMAIL] Fazendo login com {SMTP_USER}")
            server.login(SMTP_USER, SMTP_PASS)
            print("[EMAIL] Enviando mensagem")
            server.send_message(msg)

        print(f"[EMAIL] ✅ Email enviado com sucesso para {to_email}")
        return True
    except Exception as e:
        print(f"[EMAIL] ❌ Erro ao enviar email para {to_email}: {e}")
        import traceback
        traceback.print_exc()
        return False


def _format_expiry(minutes: int) -> str:
    if minutes == 1:
        return "1 minuto"
    return f"{minutes} minutos"


def _build_otp_bodies(
    heading: str,
    intro: str,
    code: str,
    expiry_minutes: int,
    accent_color: str,
    disclaimer: str,
) -> tuple[str, str]:
    """
    Monta o corpo em texto puro e HTML para emails de OTP,
    mantendo o tempo de expiração como fonte única de verdade.
    """
    expiry_text = _format_expiry(expiry_minutes)

    text_body = f"""{heading}

{intro}

Código: {code}

Este código expira em {expiry_text}.

{disclaimer}

— Equipe {APP_NAME}
"""

    html_body = f"""\
<!DOCTYPE html>
<html lang="pt-br">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  </head>
  <body style="margin:0; padding:0; background-color:#f4f5f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f5f7; padding: 32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.06);">
            <tr>
              <td style="background-color:{accent_color}; padding:24px 32px;">
                <p style="margin:0; color:#ffffff; font-size:14px; font-weight:600; letter-spacing:0.5px; text-transform:uppercase;">
                  {APP_NAME}
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <h1 style="margin:0 0 12px 0; font-size:20px; color:#1a1a1a;">
                  {heading}
                </h1>
                <p style="margin:0 0 24px 0; font-size:15px; line-height:1.5; color:#4a4a4a;">
                  {intro}
                </p>

                <div style="background-color:#f4f5f7; border-radius:8px; padding:20px; text-align:center; margin-bottom:24px;">
                  <span style="font-size:32px; font-weight:700; letter-spacing:8px; color:{accent_color};">
                    {code}
                  </span>
                </div>

                <p style="margin:0 0 24px 0; font-size:14px; color:#6b6b6b; text-align:center;">
                  Este código expira em <strong>{expiry_text}</strong>.
                </p>

                <hr style="border:none; border-top:1px solid #eaeaea; margin:24px 0;" />

                <p style="margin:0; font-size:13px; line-height:1.5; color:#9a9a9a;">
                  {disclaimer}
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px; background-color:#fafafa; text-align:center;">
                <p style="margin:0; font-size:12px; color:#b0b0b0;">
                  Equipe {APP_NAME}
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
"""
    return text_body, html_body


def send_email_signup(email: str, code: str) -> bool:
    """
    Envia email de verificação de conta com código OTP.
    """
    subject = f"Verifique seu email - {APP_NAME}"
    text_body, html_body = _build_otp_bodies(
        heading="Confirme seu cadastro",
        intro="Olá! Use o código abaixo para verificar seu email e concluir seu cadastro.",
        code=code,
        expiry_minutes=SIGNUP_EXPIRY_MINUTES,
        accent_color="#2563eb",
        disclaimer="Se você não solicitou esta verificação, pode ignorar este email com segurança.",
    )
    return send_email(email, subject, text_body, html_body)


def send_email_login(email: str, code: str) -> bool:
    """
    Envia email de login com código OTP (2FA).
    """
    subject = f"Código de verificação de login - {APP_NAME}"
    text_body, html_body = _build_otp_bodies(
        heading="Código de login",
        intro="Use o código abaixo para concluir seu login com verificação em duas etapas.",
        code=code,
        expiry_minutes=LOGIN_EXPIRY_MINUTES,
        accent_color="#2F8FFF",
        disclaimer="Se você não tentou fazer login, ignore este email e considere trocar sua senha por segurança.",
    )
    return send_email(email, subject, text_body, html_body)


def send_email_recovery(email: str, code: str) -> bool:
    """
    Envia email de recuperação de senha com código OTP (2FA).
    """
    subject = f"Código de verificação para troca de senha - {APP_NAME}"
    text_body, html_body = _build_otp_bodies(
        heading="Redefinição de senha",
        intro="Use o código abaixo para confirmar sua identidade e redefinir sua senha.",
        code=code,
        expiry_minutes=RECOVERY_EXPIRY_MINUTES,
        accent_color="#dc2626",
        disclaimer="Se você não tentou redefinir sua senha, ignore este email — sua conta continua segura.",
    )
    return send_email(email, subject, text_body, html_body)
