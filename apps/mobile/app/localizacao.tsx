import { router } from 'expo-router';
import { useState } from 'react';

import { ApiError } from '../src/api/client';
import { geocodificar } from '../src/api/localizacao';
import { Aviso } from '../src/components/ui/Aviso';
import { Botao } from '../src/components/ui/Botao';
import { Campo } from '../src/components/ui/Campo';
import { Tela } from '../src/components/ui/Tela';
import { useLocalizacao } from '../src/localizacao/LocalizacaoContext';

// Endereço de referência quando o GPS está indisponível ou foi negado (RF05).
export default function LocalizacaoScreen() {
  const { definirManual, usarGps } = useLocalizacao();
  const [endereco, setEndereco] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [buscando, setBuscando] = useState(false);

  async function aoBuscar() {
    if (endereco.trim().length < 3) {
      setErro('Digite um endereço, bairro ou ponto de referência.');
      return;
    }
    setErro(null);
    setBuscando(true);
    try {
      const resultado = await geocodificar(endereco.trim());
      definirManual(resultado);
      router.back();
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) {
        setErro('Não encontramos esse endereço. Tente incluir a cidade.');
      } else {
        setErro(e instanceof ApiError ? e.message : 'Não foi possível buscar o endereço.');
      }
    } finally {
      setBuscando(false);
    }
  }

  async function aoUsarGps() {
    await usarGps();
    router.back();
  }

  return (
    <Tela
      titulo="Onde você está?"
      subtitulo="Usamos essa posição só para buscar lugares próximos. Ela não fica salva."
    >
      <Campo
        rotulo="Endereço ou ponto de referência"
        placeholder="Ex.: Praça da Matriz, Araraquara"
        value={endereco}
        onChangeText={setEndereco}
        onSubmitEditing={aoBuscar}
        returnKeyType="search"
      />
      <Aviso texto={erro} />
      <Botao titulo="Usar este endereço" onPress={aoBuscar} carregando={buscando} />
      <Botao titulo="Usar minha localização atual (GPS)" variante="link" onPress={aoUsarGps} />
    </Tela>
  );
}
