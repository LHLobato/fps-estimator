import os
from dotenv import load_dotenv
from sqlalchemy import (
    Boolean, Column, Float, ForeignKey,
    Integer, String, create_engine,
)
import uuid
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import declarative_base, relationship
from pgvector.sqlalchemy import Vector

load_dotenv()

DB_HOST = os.getenv("host")
DB_PORT = os.getenv("port")
DB_USER = os.getenv("user")
DB_PASS = os.getenv("pass")
DB_NAME = os.getenv("dbname")

DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
db = create_engine(DATABASE_URL)
Base = declarative_base()


class GPU(Base):
    __tablename__ = "gpus"
    id            = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    brand         = Column(String)
    name          = Column(String, nullable=False, index=True)
    shading_units = Column(Integer)
    boost_clock   = Column(String)
    game_clock    = Column(String)
    gpu_clock     = Column(String)
    fp32          = Column(String)
    mem_bandwidth = Column(String)
    vram          = Column(String)
    mem_type      = Column(String)
    mem_bus       = Column(String)
    rops          = Column(Integer)
    tmus          = Column(Integer)
    pixel_rate    = Column(String)
    texture_rate  = Column(String)
    architecture  = Column(String)
    process       = Column(String)
    release_date  = Column(String)
    tdp           = Column(String)
    rt_cores      = Column(Integer)
    tensor_cores  = Column(Integer)
    dx            = Column(String)
    vulkan        = Column(String)
    cuda          = Column(String)
    fp16          = Column(String)
    transistors   = Column(String)
    embedding = Column(Vector(384))

    users = relationship("Users", back_populates="gpu_rel")


class CPU(Base):
    __tablename__ = "cpus"
    id       = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name     = Column(String, nullable=False, index=True)
    date     = Column(String)
    socket   = Column(String)
    category = Column(String)
    speed    = Column(Float)
    turbo    = Column(Float)
    cores    = Column(Integer)
    threads  = Column(Integer)
    l1_cache = Column(Float)
    l2_cache = Column(Float)
    l3_cache = Column(Float)
    embedding = Column(Vector(384))

    users = relationship("Users", back_populates="cpu_rel")


class Users(Base):
    __tablename__ = "users"
    id            = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name          = Column(String)
    email         = Column(String, nullable=False, unique=True, index=True)
    profile_photo = Column(String, nullable=True)
    gpu_id        = Column(UUID(as_uuid=True), ForeignKey("gpus.id"), nullable=True)
    cpu_id        = Column(UUID(as_uuid=True), ForeignKey("cpus.id"), nullable=True)
    ram           = Column(String)
    password      = Column(String)
    otp_secret    = Column(String)
    ativo         = Column(Boolean, default=False)

    gpu_rel    = relationship("GPU", back_populates="users")
    cpu_rel    = relationship("CPU", back_populates="users")
    game_users = relationship("GameUser", back_populates="user", cascade="all, delete-orphan")

class Game(Base):
    __tablename__ = "games"
    id   = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False, index=True)
    embedding = Column(Vector(384))

    game_users = relationship("GameUser", back_populates="game", cascade="all, delete-orphan")


class GameUser(Base):
    __tablename__ = "game_users"
    id         = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id    = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    game_id    = Column(UUID(as_uuid=True), ForeignKey("games.id"), nullable=False)
    avg_fps    = Column(Integer)
    min_fps    = Column(Integer)
    max_fps    = Column(Integer)
    preset     = Column(String)
    resolution = Column(String)
    upscaling  = Column(String)

    user = relationship("Users", back_populates="game_users")
    game = relationship("Game", back_populates="game_users")


Base.metadata.create_all(bind=db)
