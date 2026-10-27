import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Switch, Text, View } from 'react-native';

import * as authApi from '../src/api/auth';
import { ApiError } from '../src/api/client';
import type { FaixaPreco, Perfil } from '../src/api/tipos';
import { useAuth } from '../src/auth/AuthContext';
import { Aviso } from '../src/components/ui/Aviso';
import { Botao } from '../src/components/ui/Botao';
import { Opcao } from '../src/components/ui/Opcao';
import { Tela } from '../src/components/ui/Tela';
import { cores } from '../src/theme/cores';

const ORCAMENTOS: { valor: FaixaPreco; rotulo: string }[] = [
  { valor: 'economico', rotulo: '$ Econômico' },
  { valor: 'moderado', rotulo: '$$ Moderado' },
  { valor: 'alto', rotulo: '$$$ Sem limite' },
];

const RESTRICOES = [
  { valor: 'vegetariano', rotulo: 'Vegetariano' },
  { valor: 'vegano', rotulo: 'Vegano' },
  { valor: 'sem_gluten', rotulo: 'Sem glúten' },
  { valor: 'sem_lactose', rotulo: 'Sem lactose' },
];

const TEMPOS = [
  { valor: 60, rotulo: '1 hora' },
  { valor: 120, rotulo: '2 horas' },
  { valor: 240, rotulo: '4 horas' },
  { valor: 480, rotulo: 'O dia todo' },
];

// RN03: raio máximo de 20 km. RN09: 3 km é o padrão.
const RAIOS = ['1', '3', '5', '10', '20'];

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <View style={styles.secao}>
      <Text style={styles.tituloSecao} accessibilityRole="header">
        {titulo}
      </Text>
      <View style={styles.opcoes}>{children}</View>
    </View>
  );
}

export default function PreferenciasScreen() {
  const { primeiroAcesso, concluirPrimeiroAcesso } = useAuth();
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    authApi
      .buscarPerfil()
      .then(setPerfil)
      .catch((e) => setErro(e instanceof ApiError ? e.message : 'Erro ao carregar.'));
  }, []);

  if (!perfil) {
    return (
      <Tela>{erro ? <Aviso texto={erro} /> : <ActivityIndicator color={cores.primaria} />}</Tela>
    );
  }

  const atualizar = (mudancas: Partial<Perfil>) => setPerfil({ ...perfil, ...mudancas });

  function alternarRestricao(valor: string) {
    const atuais = perfil!.restricoes_alimentares;
    atualizar({
      restricoes_alimentares: atuais.includes(valor)
        ? atuais.filter((r) => r !== valor)
        : [...atuais, valor],
    });
  }

  async function aoSalvar() {
    setErro(null);
    setSalvando(true);
    try {
      await authApi.salvarPerfil(perfil!);
      concluirPrimeiroAcesso();
      if (router.canGoBack()) router.back();
      else router.replace('/');
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : 'Não foi possível salvar.');
    } finally {
      setSalvando(false);
    }
  }

  const raioAtual = String(Number(perfil.raio_busca_km));

  return (
    <Tela
      titulo={primeiroAcesso ? 'Conte um pouco sobre você' : undefined}
      subtitulo="Usamos isso para escolher as melhores recomendações. Dá para mudar quando quiser."
    >
      <Secao titulo="Orçamento">
        {ORCAMENTOS.map((o) => (
          <Opcao
            key={o.valor}
            rotulo={o.rotulo}
            selecionada={perfil.faixa_orcamento === o.valor}
            onPress={() =>
              atualizar({ faixa_orcamento: perfil.faixa_orcamento === o.valor ? null : o.valor })
            }
          />
        ))}
      </Secao>

      <Secao titulo="Restrições alimentares">
        {RESTRICOES.map((r) => (
          <Opcao
            key={r.valor}
            rotulo={r.rotulo}
            selecionada={perfil.restricoes_alimentares.includes(r.valor)}
            onPress={() => alternarRestricao(r.valor)}
          />
        ))}
      </Secao>

      <Secao titulo="Tempo disponível">
        {TEMPOS.map((t) => (
          <Opcao
            key={t.valor}
            rotulo={t.rotulo}
            selecionada={perfil.tempo_disponivel_min === t.valor}
            onPress={() =>
              atualizar({
                tempo_disponivel_min: perfil.tempo_disponivel_min === t.valor ? null : t.valor,
              })
            }
          />
        ))}
      </Secao>

      <Secao titulo="Distância máxima">
        {RAIOS.map((r) => (
          <Opcao
            key={r}
            rotulo={`${r} km`}
            selecionada={raioAtual === r}
            onPress={() => atualizar({ raio_busca_km: r })}
          />
        ))}
      </Secao>

      <View style={styles.acessibilidade}>
        <Text style={styles.tituloSecao}>Preciso de acessibilidade</Text>
        <Switch
          accessibilityLabel="Preciso de acessibilidade"
          value={perfil.necessita_acessibilidade}
          onValueChange={(v) => atualizar({ necessita_acessibilidade: v })}
          trackColor={{ true: cores.primaria }}
        />
      </View>

      <Aviso texto={erro} />
      <Botao titulo="Salvar preferências" onPress={aoSalvar} carregando={salvando} />
    </Tela>
  );
}

const styles = StyleSheet.create({
  secao: { gap: 10 },
  tituloSecao: { fontSize: 17, fontWeight: '700', color: cores.texto },
  opcoes: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  acessibilidade: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
});
