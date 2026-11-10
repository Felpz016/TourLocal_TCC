"""Localização fora dos registros de acesso da API (RN10 e RNF07).

O app manda a posição do turista na própria URL das consultas, por exemplo
``/recomendacoes?eixo=comer&lat=-21.79&lng=-48.17``. O banco nunca grava esses valores, mas
o servidor (uvicorn) anota cada requisição no log de acesso, com o IP e a URL completa, e o
Docker guarda esse log. Sem este filtro, o log viraria um histórico de onde cada pessoa
esteve, que é justamente o que a LGPD e a RN10 pedem para não guardar.

O filtro troca o valor de ``lat``, ``lng`` e ``endereco`` por ``***`` antes de a linha ser
escrita. O resto da linha (rota, status, demais filtros) continua no log, para depuração.
"""

import logging
import re

PARAMETROS_DE_LOCALIZACAO = ("lat", "lng", "endereco")
OCULTO = "***"

_PARAMETRO = re.compile(r"([?&](?:" + "|".join(PARAMETROS_DE_LOCALIZACAO) + r")=)[^&\s]*")


def ocultar_localizacao(caminho: str) -> str:
    """``/recomendacoes?eixo=comer&lat=-21.7&lng=-48.1`` → ``...&lat=***&lng=***``."""
    return _PARAMETRO.sub(r"\g<1>" + OCULTO, caminho)


class FiltroDeLocalizacao(logging.Filter):
    """Filtro para o logger ``uvicorn.access``: esconde a localização da URL anotada."""

    def filter(self, record: logging.LogRecord) -> bool:
        # O uvicorn anota: (ip, método, caminho com a query, versão HTTP, status).
        if isinstance(record.args, tuple) and len(record.args) >= 3:
            args = list(record.args)
            if isinstance(args[2], str):
                args[2] = ocultar_localizacao(args[2])
                record.args = tuple(args)
        return True


def proteger_log_de_acesso() -> None:
    logger = logging.getLogger("uvicorn.access")
    if not any(isinstance(f, FiltroDeLocalizacao) for f in logger.filters):
        logger.addFilter(FiltroDeLocalizacao())
