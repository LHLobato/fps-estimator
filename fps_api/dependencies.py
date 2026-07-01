"""
Dependencies compartilhadas da API.
Fornece sessões de banco de dados e verificação de tokens JWT.
"""
from uuid import UUID

from fastapi import Depends, Header, HTTPException, status
from jose import JWTError, jwt
from sqlalchemy.engine.url import make_url
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker

from fps_api.auth_config import ALGORITHM, SECRET_KEY
from fps_api.build_db import DATABASE_URL

# asyncpg não aceita o parâmetro "sslmode" (sintaxe libpq/psycopg2) como kwarg de connect().
# Removemos da URL e passamos o equivalente via connect_args com o nome que o asyncpg espera: "ssl".
_url = make_url(DATABASE_URL)
_query = dict(_url.query)
_sslmode = _query.pop("sslmode", None)
_url = _url.set(query=_query)

_connect_args = {"statement_cache_size": 0}
if _sslmode:
    # asyncpg aceita os mesmos valores de sslmode ("require", "prefer", "verify-full", etc.)
    # no parâmetro "ssl".
    _connect_args["ssl"] = _sslmode

engine = create_async_engine(
    _url,
    connect_args=_connect_args,
)
AsyncSessionLocal = async_sessionmaker(bind=engine, expire_on_commit=False)


async def get_session():
    async with AsyncSessionLocal() as session:
        yield session


def get_token_from_header(authorization: str = Header(...)) -> str:
    """
    Extrai o token JWT do header Authorization.
    Formato esperado: "Bearer <token>"
    """
    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Formato de token inválido. Use: Bearer <token>",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return authorization.replace("Bearer ", "")


def verify_token(token: str = Depends(get_token_from_header)) -> dict:
    """
    Verifica e decodifica um token JWT.
    Retorna o payload se válido, lança exceção caso contrário.
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None or payload.get("typ") != "access":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token inválido",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expirado ou inválido",
            headers={"WWW-Authenticate": "Bearer"},
        )


def get_current_user_id(token_payload: dict = Depends(verify_token)) -> UUID:
    """
    Dependency para extrair o ID do usuário do token JWT.
    Usada em rotas protegidas que precisam do user_id.
    """
    return UUID(token_payload["sub"])