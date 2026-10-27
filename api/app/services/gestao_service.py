"""Cadastro e edição pelo comerciante (UC10, UC11) e moderação pelo administrador (UC12)."""

from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.core.config import settings
from app.models import (
    Avaliacao,
    Categoria,
    Estabelecimento,
    Foto,
    HorarioFuncionamento,
    Usuario,
)
from app.models.enums import StatusAvaliacao
from app.schemas.gestao import (
    DenunciaOut,
    EstabelecimentoIn,
    MeuEstabelecimentoOut,
    PendenteOut,
)
from app.services import fotos
from app.services.estabelecimento_service import AcaoNaoPermitida, NaoEncontrado, pode_editar


class DadosInvalidos(Exception):
    pass


def _buscar(db: Session, id_estab: int) -> Estabelecimento:
    estab = db.scalar(
        select(Estabelecimento)
        .where(Estabelecimento.id_estab == id_estab)
        .options(selectinload(Estabelecimento.categorias), selectinload(Estabelecimento.fotos))
    )
    if estab is None:
        raise NaoEncontrado()
    return estab


def _buscar_editavel(db: Session, id_estab: int, usuario: Usuario) -> Estabelecimento:
    estab = _buscar(db, id_estab)
    if not pode_editar(estab, usuario):
        # Para quem não é o dono, o local "não existe": não revela cadastros pendentes.
        raise NaoEncontrado()
    return estab


def _categorias(db: Session, nomes: list[str]) -> list[Categoria]:
    encontradas = list(db.scalars(select(Categoria).where(Categoria.nome.in_(nomes))))
    faltando = set(nomes) - {c.nome for c in encontradas}
    if faltando:
        raise DadosInvalidos(f"Categoria desconhecida: {', '.join(sorted(faltando))}")
    return encontradas


def _aplicar(db: Session, estab: Estabelecimento, dados: EstabelecimentoIn) -> None:
    estab.nome = dados.nome
    estab.descricao = dados.descricao
    estab.endereco = dados.endereco
    estab.latitude = Decimal(str(round(dados.latitude, 6)))
    estab.longitude = Decimal(str(round(dados.longitude, 6)))
    estab.categorias = _categorias(db, dados.categorias)
    estab.faixa_preco = dados.faixa_preco
    estab.acessibilidade = dados.acessibilidade
    estab.opcoes_alimentares = ",".join(sorted(set(dados.opcoes_alimentares))) or None
    estab.telefone = dados.telefone
    estab.site = dados.site
    estab.fechado_temporariamente = dados.fechado_temporariamente
    estab.horarios = [
        HorarioFuncionamento(
            dia_semana=h.dia_semana,
            hora_abertura=h.hora_abertura,
            hora_fechamento=h.hora_fechamento,
        )
        for h in dados.horarios
    ]


def criar(db: Session, usuario: Usuario, dados: EstabelecimentoIn) -> Estabelecimento:
    """Novo cadastro fica pendente até um administrador verificar (RF15, RN01)."""
    estab = Estabelecimento(id_responsavel=usuario.id_usuario, verificado=False)
    _aplicar(db, estab, dados)
    db.add(estab)
    db.commit()
    return estab


def atualizar(
    db: Session, id_estab: int, usuario: Usuario, dados: EstabelecimentoIn
) -> Estabelecimento:
    """Edição pelo dono ou pelo administrador (RF16, RN07).

    Se o comerciante muda nome, endereço ou posição de um local já verificado, ele volta
    a ficar pendente, para que ninguém troque um cadastro aprovado por outro lugar.
    """
    estab = _buscar_editavel(db, id_estab, usuario)
    identidade_antes = (estab.nome, estab.endereco, float(estab.latitude), float(estab.longitude))
    _aplicar(db, estab, dados)
    identidade_depois = (estab.nome, estab.endereco, float(estab.latitude), float(estab.longitude))
    if usuario.id_usuario == estab.id_responsavel and identidade_antes != identidade_depois:
        estab.verificado = False
    db.commit()
    return estab


def listar_do_responsavel(db: Session, usuario: Usuario) -> list[MeuEstabelecimentoOut]:
    estabs = db.scalars(
        select(Estabelecimento)
        .where(Estabelecimento.id_responsavel == usuario.id_usuario)
        .options(selectinload(Estabelecimento.categorias), selectinload(Estabelecimento.fotos))
        .order_by(Estabelecimento.nome)
    )
    return [
        MeuEstabelecimentoOut(
            id_estab=e.id_estab,
            nome=e.nome,
            endereco=e.endereco,
            categorias=[c.nome for c in e.categorias],
            verificado=e.verificado,
            fechado_temporariamente=e.fechado_temporariamente,
            total_fotos=len(e.fotos),
        )
        for e in estabs
    ]


def adicionar_foto(
    db: Session, id_estab: int, usuario: Usuario, conteudo: bytes, legenda: str | None
) -> Foto:
    estab = _buscar_editavel(db, id_estab, usuario)
    if len(estab.fotos) >= settings.fotos_por_estabelecimento:
        raise DadosInvalidos(f"Limite de {settings.fotos_por_estabelecimento} fotos atingido")
    url = fotos.salvar(conteudo)
    foto = Foto(id_estab=id_estab, url=url, legenda=(legenda or "").strip()[:255] or None)
    db.add(foto)
    db.commit()
    return foto


def remover_foto(db: Session, id_foto: int, usuario: Usuario) -> None:
    foto = db.get(Foto, id_foto)
    if foto is None:
        raise NaoEncontrado()
    _buscar_editavel(db, foto.id_estab, usuario)
    db.delete(foto)
    db.commit()
    fotos.apagar(foto.url)


# --- Moderação (RF18) ---


def listar_pendentes(db: Session) -> list[PendenteOut]:
    linhas = db.execute(
        select(Estabelecimento, Usuario.nome, Usuario.email)
        .outerjoin(Usuario, Usuario.id_usuario == Estabelecimento.id_responsavel)
        .where(Estabelecimento.verificado.is_(False))
        .options(selectinload(Estabelecimento.categorias))
        .order_by(Estabelecimento.id_estab)
    )
    return [
        PendenteOut(
            id_estab=e.id_estab,
            nome=e.nome,
            endereco=e.endereco,
            categorias=[c.nome for c in e.categorias],
            responsavel=nome,
            email_responsavel=email,
        )
        for e, nome, email in linhas
    ]


def aprovar(db: Session, id_estab: int) -> None:
    estab = _buscar(db, id_estab)
    estab.verificado = True
    db.commit()


def rejeitar(db: Session, id_estab: int) -> None:
    """Recusa um cadastro pendente e apaga o registro e as fotos enviadas."""
    estab = _buscar(db, id_estab)
    if estab.verificado:
        raise AcaoNaoPermitida("Só cadastros pendentes podem ser rejeitados")
    urls = [f.url for f in estab.fotos]
    db.delete(estab)
    db.commit()
    for url in urls:
        fotos.apagar(url)


def listar_denunciadas(db: Session) -> list[DenunciaOut]:
    linhas = db.execute(
        select(Avaliacao, Estabelecimento.nome, Usuario.nome)
        .join(Estabelecimento, Estabelecimento.id_estab == Avaliacao.id_estab)
        .join(Usuario, Usuario.id_usuario == Avaliacao.id_usuario)
        .where(Avaliacao.status == StatusAvaliacao.DENUNCIADA)
        .order_by(Avaliacao.data_registro)
    )
    return [
        DenunciaOut(
            id_avaliacao=a.id_avaliacao,
            id_estab=a.id_estab,
            estabelecimento=estab,
            autor=autor,
            nota=a.nota,
            comentario=a.comentario,
            data_registro=a.data_registro,
        )
        for a, estab, autor in linhas
    ]


def decidir_denuncia(db: Session, id_avaliacao: int, manter: bool) -> None:
    """RN06: a avaliação denunciada volta a aparecer ou é removida de vez."""
    avaliacao = db.get(Avaliacao, id_avaliacao)
    if avaliacao is None or avaliacao.status != StatusAvaliacao.DENUNCIADA:
        raise NaoEncontrado()
    avaliacao.status = StatusAvaliacao.PUBLICADA if manter else StatusAvaliacao.REMOVIDA
    db.commit()
