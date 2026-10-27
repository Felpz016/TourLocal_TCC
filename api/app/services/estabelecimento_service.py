"""Detalhes, avaliações e favoritos de um estabelecimento (UC06, UC08, UC09)."""

from datetime import datetime
from zoneinfo import ZoneInfo

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.core.config import settings
from app.models import Avaliacao, Estabelecimento, Favorito, Usuario
from app.models.enums import StatusAvaliacao, TipoUsuario
from app.repositories import avaliacao_repository
from app.schemas.estabelecimento import (
    AvaliacaoOut,
    EstabelecimentoDetalheOut,
    FavoritoOut,
    FotoOut,
    HorarioOut,
)
from app.services import geo, pontuacao
from app.services.horario import esta_aberto


class NaoEncontrado(Exception):
    pass


class AcaoNaoPermitida(Exception):
    pass


def buscar_visivel(db: Session, id_estab: int, usuario: Usuario) -> Estabelecimento:
    """Estabelecimento verificado (RN01); o responsável e o administrador veem os pendentes."""
    estab = db.scalar(
        select(Estabelecimento)
        .where(Estabelecimento.id_estab == id_estab)
        .options(
            selectinload(Estabelecimento.categorias),
            selectinload(Estabelecimento.horarios),
            selectinload(Estabelecimento.fotos),
        )
    )
    if estab is None:
        raise NaoEncontrado()
    pode_ver_pendente = (
        usuario.tipo == TipoUsuario.ADMINISTRADOR or estab.id_responsavel == usuario.id_usuario
    )
    if not estab.verificado and not pode_ver_pendente:
        raise NaoEncontrado()
    return estab


def _avaliacao_out(avaliacao: Avaliacao, autor: str, id_usuario: int) -> AvaliacaoOut:
    return AvaliacaoOut(
        id_avaliacao=avaliacao.id_avaliacao,
        autor=autor.split()[0] if autor else "Visitante",
        nota=avaliacao.nota,
        comentario=avaliacao.comentario,
        data_registro=avaliacao.data_registro,
        minha=avaliacao.id_usuario == id_usuario,
    )


def detalhar(
    db: Session, id_estab: int, usuario: Usuario, lat: float | None, lng: float | None
) -> EstabelecimentoDetalheOut:
    estab = buscar_visivel(db, id_estab, usuario)
    media, total = avaliacao_repository.notas_medias(db, [id_estab]).get(id_estab, (None, 0))
    minha = avaliacao_repository.buscar_do_usuario(db, usuario.id_usuario, id_estab)
    favorito = db.get(Favorito, (usuario.id_usuario, id_estab)) is not None
    distancia = (
        geo.haversine_km(lat, lng, float(estab.latitude), float(estab.longitude))
        if lat is not None and lng is not None
        else None
    )
    agora = datetime.now(ZoneInfo(settings.fuso_horario))
    return EstabelecimentoDetalheOut(
        id_estab=estab.id_estab,
        nome=estab.nome,
        eixo=estab.categorias[0].eixo if estab.categorias else None,
        categorias=[c.nome for c in estab.categorias],
        descricao=estab.descricao,
        endereco=estab.endereco,
        latitude=float(estab.latitude),
        longitude=float(estab.longitude),
        telefone=estab.telefone,
        site=estab.site,
        faixa_preco=estab.faixa_preco,
        acessibilidade=estab.acessibilidade,
        opcoes_alimentares=sorted(pontuacao.opcoes(estab)),
        horarios=[
            HorarioOut(
                dia_semana=h.dia_semana,
                hora_abertura=h.hora_abertura,
                hora_fechamento=h.hora_fechamento,
            )
            for h in sorted(estab.horarios, key=lambda h: (h.dia_semana, h.hora_abertura))
        ],
        aberto_agora=esta_aberto(estab.horarios, agora),
        fotos=[FotoOut(url=f.url, legenda=f.legenda) for f in estab.fotos],
        nota_media=round(media, 1) if media is not None else None,
        total_avaliacoes=total,
        distancia_km=round(distancia, 2) if distancia is not None else None,
        favorito=favorito,
        minha_avaliacao=_avaliacao_out(minha, usuario.nome, usuario.id_usuario) if minha else None,
    )


def listar_avaliacoes(db: Session, id_estab: int, usuario: Usuario) -> list[AvaliacaoOut]:
    """Avaliações publicadas, mais recentes primeiro; denunciadas ficam ocultas (RN06)."""
    buscar_visivel(db, id_estab, usuario)
    linhas = db.execute(
        select(Avaliacao, Usuario.nome)
        .join(Usuario, Usuario.id_usuario == Avaliacao.id_usuario)
        .where(Avaliacao.id_estab == id_estab, Avaliacao.status == StatusAvaliacao.PUBLICADA)
        .order_by(Avaliacao.data_registro.desc(), Avaliacao.id_avaliacao.desc())
        .limit(100)
    )
    return [_avaliacao_out(a, nome, usuario.id_usuario) for a, nome in linhas]


def avaliar(
    db: Session, id_estab: int, usuario: Usuario, nota: int, comentario: str | None
) -> AvaliacaoOut:
    """Cria ou edita a avaliação do usuário: uma por estabelecimento (RN04).

    A média é calculada na hora a partir das avaliações publicadas, então ela já
    reflete a nova nota na próxima consulta (RN05).
    """
    buscar_visivel(db, id_estab, usuario)
    avaliacao = avaliacao_repository.buscar_do_usuario(db, usuario.id_usuario, id_estab)
    if avaliacao is None:
        avaliacao = Avaliacao(id_usuario=usuario.id_usuario, id_estab=id_estab)
        db.add(avaliacao)
    elif avaliacao.status == StatusAvaliacao.REMOVIDA:
        raise AcaoNaoPermitida("Sua avaliação foi removida pela moderação")
    avaliacao.nota = nota
    avaliacao.comentario = (comentario or "").strip() or None
    avaliacao.data_registro = datetime.now()
    db.commit()
    db.refresh(avaliacao)
    return _avaliacao_out(avaliacao, usuario.nome, usuario.id_usuario)


def excluir_avaliacao(db: Session, id_estab: int, usuario: Usuario) -> None:
    avaliacao = avaliacao_repository.buscar_do_usuario(db, usuario.id_usuario, id_estab)
    if avaliacao is None:
        raise NaoEncontrado()
    db.delete(avaliacao)
    db.commit()


def denunciar(db: Session, id_avaliacao: int, usuario: Usuario) -> None:
    """Esconde a avaliação até a moderação decidir (RN06)."""
    avaliacao = db.get(Avaliacao, id_avaliacao)
    if avaliacao is None or avaliacao.status == StatusAvaliacao.REMOVIDA:
        raise NaoEncontrado()
    if avaliacao.id_usuario == usuario.id_usuario:
        raise AcaoNaoPermitida("Você não pode denunciar a própria avaliação")
    avaliacao.status = StatusAvaliacao.DENUNCIADA
    db.commit()


def favoritar(db: Session, id_estab: int, usuario: Usuario) -> None:
    buscar_visivel(db, id_estab, usuario)
    if db.get(Favorito, (usuario.id_usuario, id_estab)) is None:
        db.add(Favorito(id_usuario=usuario.id_usuario, id_estab=id_estab))
        db.commit()


def desfavoritar(db: Session, id_estab: int, usuario: Usuario) -> None:
    favorito = db.get(Favorito, (usuario.id_usuario, id_estab))
    if favorito is not None:
        db.delete(favorito)
        db.commit()


def listar_favoritos(db: Session, usuario: Usuario) -> list[FavoritoOut]:
    linhas = db.execute(
        select(Estabelecimento, Favorito.data_inclusao)
        .join(Favorito, Favorito.id_estab == Estabelecimento.id_estab)
        .where(Favorito.id_usuario == usuario.id_usuario)
        .options(selectinload(Estabelecimento.categorias))
        .order_by(Favorito.data_inclusao.desc())
    ).all()
    notas = avaliacao_repository.notas_medias(db, [e.id_estab for e, _ in linhas])
    return [
        FavoritoOut(
            id_estab=e.id_estab,
            nome=e.nome,
            categorias=[c.nome for c in e.categorias],
            endereco=e.endereco,
            nota_media=round(notas[e.id_estab][0], 1) if e.id_estab in notas else None,
            data_inclusao=data,
        )
        for e, data in linhas
    ]
