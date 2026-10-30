import { useMemo } from 'react';

import { cores } from './cores';
import { fonte, tamanho } from './fontes';
import { useTema } from './tema';

// Cabeçalho nativo sem linha, com o texto "Voltar" escondido como no iOS atual. É um hook
// para o cabeçalho trocar de cor junto com o modo escuro.
export function useOpcoesCabecalho() {
  const { esquema } = useTema();
  return useMemo(
    () => ({
      headerTintColor: cores.primaria,
      headerStyle: { backgroundColor: cores.fundo },
      headerShadowVisible: false,
      headerTitleStyle: {
        fontFamily: fonte.subtitulo,
        fontSize: tamanho.cabecalho,
        color: cores.texto,
      },
      headerBackButtonDisplayMode: 'minimal' as const,
      contentStyle: { backgroundColor: cores.fundo },
    }),
    [esquema],
  );
}
