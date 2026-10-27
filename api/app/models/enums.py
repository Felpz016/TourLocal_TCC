import enum


class TipoUsuario(enum.StrEnum):
    TURISTA = "turista"
    COMERCIANTE = "comerciante"
    ADMINISTRADOR = "administrador"


class FaixaPreco(enum.StrEnum):
    ECONOMICO = "economico"
    MODERADO = "moderado"
    ALTO = "alto"


class Eixo(enum.StrEnum):
    COMER = "comer"
    FICAR = "ficar"
    FAZER = "fazer"


class StatusAvaliacao(enum.StrEnum):
    PUBLICADA = "publicada"
    DENUNCIADA = "denunciada"
    REMOVIDA = "removida"
