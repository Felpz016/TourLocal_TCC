from datetime import datetime
from typing import Annotated, Literal

from pydantic import AfterValidator, BaseModel, ConfigDict, EmailStr, Field

from app.core.senha import validar_senha
from app.models.enums import TipoUsuario

# Senha nova (cadastro e troca): o login continua aceitando qualquer senha já salva.
SenhaForte = Annotated[str, Field(max_length=128), AfterValidator(validar_senha)]


class CadastroIn(BaseModel):
    nome: str = Field(min_length=2, max_length=120)
    email: EmailStr
    senha: SenhaForte
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
    nova_senha: SenhaForte
