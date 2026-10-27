import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import * as authApi from '../api/auth';
import { definirAoExpirarSessao, definirToken } from '../api/client';
import type { Usuario } from '../api/tipos';
import { apagarToken, lerToken, salvarToken } from './armazenamento';

type AuthContextValor = {
  usuario: Usuario | null;
  carregando: boolean;
  entrar: (email: string, senha: string, opcoes?: { primeiroAcesso?: boolean }) => Promise<void>;
  sair: () => Promise<void>;
  /** Verdadeiro logo após o cadastro, para levar o turista às preferências (RF03). */
  primeiroAcesso: boolean;
  concluirPrimeiroAcesso: () => void;
};

const AuthContext = createContext<AuthContextValor | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [primeiroAcesso, setPrimeiroAcesso] = useState(false);

  const sair = useCallback(async () => {
    definirToken(null);
    setUsuario(null);
    await apagarToken();
  }, []);

  const entrar = useCallback(
    async (email: string, senha: string, opcoes?: { primeiroAcesso?: boolean }) => {
      const { access_token } = await authApi.login(email, senha);
      definirToken(access_token);
      const dados = await authApi.buscarUsuarioLogado();
      await salvarToken(access_token);
      setPrimeiroAcesso(!!opcoes?.primeiroAcesso && dados.tipo === 'turista');
      setUsuario(dados);
    },
    [],
  );

  const concluirPrimeiroAcesso = useCallback(() => setPrimeiroAcesso(false), []);

  // Ao abrir o app, recupera a sessão salva (se o token ainda for válido).
  useEffect(() => {
    definirAoExpirarSessao(() => void sair());
    (async () => {
      try {
        const token = await lerToken();
        if (token) {
          definirToken(token);
          setUsuario(await authApi.buscarUsuarioLogado());
        }
      } catch {
        await sair();
      } finally {
        setCarregando(false);
      }
    })();
    return () => definirAoExpirarSessao(null);
  }, [sair]);

  const valor = useMemo(
    () => ({ usuario, carregando, entrar, sair, primeiroAcesso, concluirPrimeiroAcesso }),
    [usuario, carregando, entrar, sair, primeiroAcesso, concluirPrimeiroAcesso],
  );
  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const contexto = useContext(AuthContext);
  if (!contexto) throw new Error('useAuth precisa estar dentro de <AuthProvider>');
  return contexto;
}
