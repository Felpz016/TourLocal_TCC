import { router } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';

import { useAuth } from '../../src/auth/AuthContext';
import { ItemLista } from '../../src/components/ui/ItemLista';
import { Segmentado } from '../../src/components/ui/Segmentado';
import { Cabecalho } from '../../src/components/ui/Cabecalho';
import { useLocalizacao } from '../../src/localizacao/LocalizacaoContext';
import { cores } from '../../src/theme/cores';
import { curva, raio, sombraForte } from '../../src/theme/estilo';
import { fonte, tamanho } from '../../src/theme/fontes';
import { estilosLargura } from '../../src/theme/layout';
import { criarEstilos, useTema } from '../../src/theme/tema';
import type { Aparencia } from '../../src/theme/tema';

const APARENCIAS = [
  { valor: 'sistema', rotulo: 'Automático', icone: 'phone-portrait-outline' },
  { valor: 'claro', rotulo: 'Claro', icone: 'sunny-outline' },
  { valor: 'escuro', rotulo: 'Escuro', icone: 'moon-outline' },
] as const satisfies readonly { valor: Aparencia; rotulo: string; icone: string }[];

const TIPOS = { turista: 'Turista', comerciante: 'Comerciante', administrador: 'Administrador' };

const iniciais = (nome: string) =>
  nome
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]!.toUpperCase())
    .join('');

// Conta do usuário: reúne preferências, localização e sair, que antes ficavam no cabeçalho.
export default function PerfilTela() {
  const styles = useEstilos();
  const { aparencia, escolherAparencia } = useTema();
  const { usuario, sair } = useAuth();
  const { posicao } = useLocalizacao();
  if (!usuario) return null;

  const local = !posicao
    ? 'Ainda não definida'
    : posicao.origem === 'gps'
      ? 'Perto de você (GPS)'
      : (posicao.endereco ?? 'Endereço informado');

  return (
    <View style={styles.tela}>
      <Cabecalho titulo="Perfil" />
      <ScrollView contentContainerStyle={[styles.conteudo, estilosLargura.conteudo]}>
        {/* Cartão no formato de passaporte, com as iniciais em destaque. */}
        <View style={styles.cartaoUsuario}>
          <View style={styles.avatar}>
            <Text style={styles.iniciais}>{iniciais(usuario.nome)}</Text>
          </View>
          <View style={styles.dados}>
            <Text style={styles.nome} numberOfLines={1}>
              {usuario.nome}
            </Text>
            <Text style={styles.email} numberOfLines={1}>
              {usuario.email}
            </Text>
            <Text style={styles.tipo}>{TIPOS[usuario.tipo]}</Text>
          </View>
        </View>

        <Text style={styles.rotuloGrupo} accessibilityRole="header">
          Conta
        </Text>
        <View style={styles.grupo}>
          {usuario.tipo === 'turista' ? (
            <ItemLista
              icone="options-outline"
              titulo="Minhas preferências"
              detalhe="Orçamento, dieta, tempo e distância"
              onPress={() => router.push('/preferencias')}
            />
          ) : null}
          <ItemLista
            icone="location-outline"
            titulo="Localização"
            detalhe={local}
            onPress={() => router.push('/localizacao')}
            ultimo
          />
        </View>
        {/* Modo escuro: segue o iPhone (Automático) ou fica sempre claro ou escuro. */}
        <Text style={styles.rotuloGrupo} accessibilityRole="header">
          Aparência
        </Text>
        <View style={[styles.grupo, styles.caixaAparencia]}>
          <Segmentado opcoes={APARENCIAS} valor={aparencia} onChange={escolherAparencia} />
          <Text style={styles.dica}>
            {aparencia === 'sistema'
              ? 'Segue o modo claro ou escuro do celular.'
              : `Sempre ${aparencia === 'claro' ? 'claro' : 'escuro'}, mesmo que o celular mude.`}
          </Text>
        </View>

        <View style={styles.grupo}>
          <ItemLista icone="log-out-outline" titulo="Sair da conta" onPress={sair} perigo ultimo />
        </View>
        <Text style={styles.rodape}>TourLocal 1.0 · TCC de ADS, Fatec Araraquara</Text>
      </ScrollView>
    </View>
  );
}

const useEstilos = criarEstilos(() => ({
  tela: { flex: 1, backgroundColor: cores.fundo },
  cartaoUsuario: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 18,
    borderRadius: raio.cartao,
    ...curva,
    backgroundColor: cores.tinta,
    ...sombraForte,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: raio.cartao,
    ...curva,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: cores.sol,
  },
  iniciais: { fontFamily: fonte.titulo, fontSize: tamanho.titulo, color: cores.tinta },
  dados: { flex: 1, gap: 2 },
  nome: { fontFamily: fonte.subtitulo, fontSize: tamanho.secao, color: cores.textoSobreTinta },
  email: { fontSize: tamanho.rotulo, color: 'rgba(255, 255, 255, 0.75)' },
  tipo: {
    alignSelf: 'flex-start',
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: raio.pilula,
    overflow: 'hidden',
    fontSize: tamanho.legenda,
    fontWeight: '700',
    color: cores.textoSobreTinta,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
  },
  conteudo: { padding: 20, paddingTop: 8, gap: 16 },
  rotuloGrupo: {
    marginLeft: 4,
    marginBottom: -8,
    fontSize: tamanho.mini,
    fontWeight: '600',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: cores.textoSecundario,
  },
  caixaAparencia: { gap: 10, padding: 12 },
  dica: { marginHorizontal: 4, fontSize: tamanho.apoio, color: cores.textoSecundario },
  rodape: {
    marginTop: 8,
    textAlign: 'center',
    fontSize: tamanho.legenda,
    color: cores.textoSecundario,
  },
  grupo: {
    borderRadius: raio.cartao,
    ...curva,
    backgroundColor: cores.superficie,
    overflow: 'hidden',
  },
}));
