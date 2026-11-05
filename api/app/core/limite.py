"""Limite de tentativas em memória (contra força bruta no login e spam de e-mails).

Guarda, para cada chave (por exemplo "ip|e-mail"), os horários das tentativas dentro da
janela. Fica na memória do processo: basta para uma API com um processo só, como a do
TCC. Com vários processos ou servidores, o mesmo controle iria para um armazenamento
compartilhado (Redis, por exemplo), sem mudar quem o usa.
"""

import time
from collections import deque
from threading import Lock


class Limitador:
    def __init__(self, maximo: int, janela_s: float):
        self.maximo = maximo
        self.janela_s = janela_s
        self._tentativas: dict[str, deque[float]] = {}
        self._trava = Lock()

    def _recentes(self, chave: str, agora: float) -> deque[float]:
        fila = self._tentativas.setdefault(chave, deque())
        while fila and agora - fila[0] >= self.janela_s:
            fila.popleft()
        return fila

    def excedido(self, chave: str) -> bool:
        with self._trava:
            return len(self._recentes(chave, time.monotonic())) >= self.maximo

    def registrar(self, chave: str) -> None:
        with self._trava:
            agora = time.monotonic()
            self._recentes(chave, agora).append(agora)

    def esquecer(self, chave: str) -> None:
        with self._trava:
            self._tentativas.pop(chave, None)

    def limpar(self) -> None:
        with self._trava:
            self._tentativas.clear()
