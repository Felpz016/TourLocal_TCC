import * as Location from 'expo-location';
import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

export type Posicao = {
  latitude: number;
  longitude: number;
  origem: 'gps' | 'manual';
  /** Endereço informado pelo usuário (só quando a origem é manual). */
  endereco?: string;
};

export type StatusLocalizacao = 'inicial' | 'obtendo' | 'ok' | 'negada' | 'indisponivel';

type LocalizacaoContextValor = {
  posicao: Posicao | null;
  status: StatusLocalizacao;
  /** Pede permissão (RF04) e lê o GPS. */
  usarGps: () => Promise<void>;
  /** Usa um endereço digitado quando o GPS não está disponível (RF05). */
  definirManual: (posicao: Omit<Posicao, 'origem'>) => void;
};

const LocalizacaoContext = createContext<LocalizacaoContextValor | null>(null);

// A posição fica só na memória do app durante o uso e nunca é enviada para ser gravada
// no servidor (RNF07 e RN10): ao fechar o app ou sair da conta, ela é descartada.
export function LocalizacaoProvider({ children }: { children: ReactNode }) {
  const [posicao, setPosicao] = useState<Posicao | null>(null);
  const [status, setStatus] = useState<StatusLocalizacao>('inicial');

  const usarGps = useCallback(async () => {
    setStatus('obtendo');
    try {
      const permissao = await Location.requestForegroundPermissionsAsync();
      if (permissao.status !== 'granted') {
        setStatus('negada');
        return;
      }
      const atual = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setPosicao({
        latitude: atual.coords.latitude,
        longitude: atual.coords.longitude,
        origem: 'gps',
      });
      setStatus('ok');
    } catch {
      // GPS desligado, sem sinal ou navegador sem suporte.
      setStatus('indisponivel');
    }
  }, []);

  const definirManual = useCallback((manual: Omit<Posicao, 'origem'>) => {
    setPosicao({ ...manual, origem: 'manual' });
    setStatus('ok');
  }, []);

  const valor = useMemo(
    () => ({ posicao, status, usarGps, definirManual }),
    [posicao, status, usarGps, definirManual],
  );
  return <LocalizacaoContext.Provider value={valor}>{children}</LocalizacaoContext.Provider>;
}

export function useLocalizacao() {
  const contexto = useContext(LocalizacaoContext);
  if (!contexto) throw new Error('useLocalizacao precisa estar dentro de <LocalizacaoProvider>');
  return contexto;
}
