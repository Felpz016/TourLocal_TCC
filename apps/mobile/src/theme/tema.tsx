import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { StyleSheet, useColorScheme } from 'react-native';

import { definirEsquema } from './cores';
import type { Esquema } from './cores';

// Modo escuro: segue o sistema por padrão, mas o usuário pode fixar claro ou escuro no Perfil.
export type Aparencia = 'sistema' | 'claro' | 'escuro';

const CHAVE = 'tourlocal.aparencia';

type Tema = {
  esquema: Esquema;
  aparencia: Aparencia;
  escolherAparencia: (aparencia: Aparencia) => void;
};

const TemaContext = createContext<Tema>({
  esquema: 'claro',
  aparencia: 'sistema',
  escolherAparencia: () => {},
});

export function TemaProvider({ children }: { children: ReactNode }) {
  const sistema = useColorScheme();
  const [aparencia, setAparencia] = useState<Aparencia | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(CHAVE)
      .then((salva) => setAparencia(salva === 'claro' || salva === 'escuro' ? salva : 'sistema'))
      .catch(() => setAparencia('sistema'));
  }, []);

  const escolherAparencia = useCallback((nova: Aparencia) => {
    setAparencia(nova);
    AsyncStorage.setItem(CHAVE, nova).catch(() => {});
  }, []);

  const esquema: Esquema =
    aparencia === 'claro' || aparencia === 'escuro'
      ? aparencia
      : sistema === 'dark'
        ? 'escuro'
        : 'claro';
  // Troca a paleta antes de desenhar os filhos: assim `cores.*` já sai no esquema certo.
  definirEsquema(esquema);

  // Espera ler a preferência salva, para o app não abrir claro e piscar para o escuro.
  if (aparencia === null) return null;

  return (
    <TemaContext.Provider value={{ esquema, aparencia, escolherAparencia }}>
      {children}
    </TemaContext.Provider>
  );
}

export function useTema() {
  return useContext(TemaContext);
}

/**
 * Cria os estilos de uma tela a partir das cores atuais e devolve um hook que os entrega.
 * Os estilos de cada esquema são criados uma vez só e reaproveitados; quando o esquema muda,
 * o componente que chamou o hook é desenhado de novo com os estilos do outro esquema.
 *
 *   const useEstilos = criarEstilos(() => ({ tela: { backgroundColor: cores.fundo } }));
 *   function Tela() { const styles = useEstilos(); ... }
 */
type Estilos = Parameters<typeof StyleSheet.create>[0];

export function criarEstilos<S extends Estilos>(fabrica: () => S & Estilos) {
  const porEsquema = new Map<Esquema, Readonly<S>>();
  return function useEstilos(): Readonly<S> {
    const { esquema } = useTema();
    let estilos = porEsquema.get(esquema);
    if (!estilos) {
      estilos = StyleSheet.create<S>(fabrica());
      porEsquema.set(esquema, estilos);
    }
    return estilos;
  };
}
