import os
from datetime import datetime

from dotenv import load_dotenv
from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    create_engine,
)

import uuid
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import declarative_base, relationship

load_dotenv()

DB_HOST = os.getenv("host")
DB_PORT = os.getenv("port")
DB_USER = os.getenv("user")
DB_PASS = os.getenv("pass")
DB_NAME = os.getenv("dbname")

DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

db = create_engine(DATABASE_URL)
Base = declarative_base()

"""
Still have to create GPU and CPU tables, then modifie user's CPU and GPU for maintaining ID instead of names (foreign key).
"""


class Users(Base):
    __tablename__ = "Users"
    id = Column("id", UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column("name", String)
    email = Column("email", String, nullable=False, unique=True, index=True)
    profile_photo = Column("profile_photo", String, nullable=True)
    gpu = Column("gpu", String)
    cpu = Column("cpu", String)
    ram = Column("ram", String)
    password = Column("password", String)
    otp_secret = Column("otp_secret", String)
    ativo = Column("ativo", Boolean, default=False)

    game_users = relationship("GameUser", back_populates="user", cascade="all, delete-orphan")

class Game(Base):
    __tablename__ = "Games"
    id = Column("id", UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column("name", String, nullable=False, index=True)

    game_users = relationship("GameUser", back_populates="game", cascade="all, delete-orphan")
    def __init__(self, name):
        self.name = name

class GameUser(Base):
    __tablename__ = "GameUser"
    id = Column("id", UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column("user_id", UUID(as_uuid=True), ForeignKey("Users.id"), nullable=False)
    game_id = Column("game_id", UUID(as_uuid=True), ForeignKey("Games.id"), nullable=False)
    avg_fps = Column("avg_fps", Integer)
    min_fps = Column("min_fps", Integer)
    max_fps = Column("max_fps", Integer)
    preset = Column("preset", String)
    resolution = Column("resolution", String)
    upscaling = Column("upscaling", String)

    user = relationship("Users", back_populates="game_users")
    game = relationship("Game", back_populates="game_users")

Base.metadata.create_all(bind=db)
