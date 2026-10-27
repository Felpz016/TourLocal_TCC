from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models.enums import TipoUsuario


class CadastroIn(BaseModel):
    nome: str = Field(min_length=2, max_length=120)
    email: EmailStr
    senha: str = Field(min_length=8, max_length=128)
    # O administrador não se cadastra pelo app (RF01 distingue turista e comerciante).
    tipo: Literal[TipoUsuario.TURISTA, TipoUsuario.COMERCIANTE]


class UsuarioOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id_usuario: int
    nome: str
    email: EmailStr
    tipo: TipoUsuario
    criado_em: datetime


class LoginIn(BaseModel):
    email: EmailStr
    senha: str


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"


class RecuperarSenhaIn(BaseModel):
    email: EmailStr


class RedefinirSenhaIn(BaseModel):
    token: str
    nova_senha: str = Field(min_length=8, max_length=128)
