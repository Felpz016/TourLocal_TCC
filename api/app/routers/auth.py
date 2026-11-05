from fastapi import APIRouter, HTTPException, Request, status

from app.core.deps import DbSession, UsuarioAtual
from app.schemas.usuario import (
    CadastroIn,
    LoginIn,
    RecuperarSenhaIn,
    RedefinirSenhaIn,
    TokenOut,
    UsuarioOut,
)
from app.services import auth_service

router = APIRouter(prefix="/auth", tags=["autenticação"])


@router.post("/cadastro", response_model=UsuarioOut, status_code=status.HTTP_201_CREATED)
def cadastrar(dados: CadastroIn, db: DbSession):
    try:
        return auth_service.cadastrar(db, dados)
    except auth_service.EmailJaCadastrado:
        raise HTTPException(status.HTTP_409_CONFLICT, "E-mail já cadastrado") from None


def _muitas_tentativas() -> HTTPException:
    return HTTPException(
        status.HTTP_429_TOO_MANY_REQUESTS,
        "Muitas tentativas. Espere alguns minutos e tente de novo.",
    )


@router.post("/login", response_model=TokenOut)
def login(dados: LoginIn, db: DbSession, request: Request):
    origem = request.client.host if request.client else ""
    try:
        token = auth_service.autenticar(db, dados.email, dados.senha, origem)
    except auth_service.CredenciaisInvalidas:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "E-mail ou senha incorretos") from None
    except auth_service.MuitasTentativas:
        raise _muitas_tentativas() from None
    return TokenOut(access_token=token)


@router.post("/recuperar-senha", status_code=status.HTTP_202_ACCEPTED)
def recuperar_senha(dados: RecuperarSenhaIn, db: DbSession) -> dict[str, str]:
    try:
        auth_service.solicitar_recuperacao(db, dados.email)
    except auth_service.MuitasTentativas:
        raise _muitas_tentativas() from None
    return {"detail": "Se o e-mail estiver cadastrado, enviaremos um link de redefinição."}


@router.post("/redefinir-senha", status_code=status.HTTP_204_NO_CONTENT)
def redefinir_senha(dados: RedefinirSenhaIn, db: DbSession) -> None:
    try:
        auth_service.redefinir_senha(db, dados.token, dados.nova_senha)
    except auth_service.TokenInvalido:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Link inválido ou expirado") from None


@router.get("/me", response_model=UsuarioOut)
def me(usuario: UsuarioAtual):
    return usuario
