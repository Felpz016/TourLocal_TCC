import { router } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';

import { useAuth } from '../../src/auth/AuthContext';
import { ItemLista } from '../../src/components/ui/ItemLista';
import { Opcao } from '../../src/components/ui/Opcao';
import { Cabecalho } from '../../src/components/ui/Cabecalho';
import { useLocalizacao } from '../../src/localizacao/LocalizacaoContext';
import { cores } from '../../src/theme/cores';
import { curva, raio, sombraForte } from '../../src/theme/estilo';
import { fonte, tamanho } from '../../src/theme/fontes';
import { estilosLargura } from '../../src/theme/layout';
import { criarEstilos, useTema } from '../../src/theme/tema';
import type { Aparencia } from '../../src/theme/tema';

const APARENCIAS: { valor: Aparencia; rotulo: string }[] = [
  { valor: 'sistema', rotulo: 'Automático' },
  { valor: 'claro', rotulo: 'Claro' },
  { valor: 'escuro', rotulo: 'Escuro' },
];

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
        <View style={styles.aparencia}>
          <Text style={styles.rotuloGrupo} accessibilityRole="header">
            Aparência
          </Text>
          <View style={styles.opcoes} accessibilityRole="radiogroup">
            {APARENCIAS.map((a) => (
              <Opcao
                key={a.valor}
                rotulo={a.rotulo}
                selecionada={aparencia === a.valor}
                unica
                onPress={() => escolherAparencia(a.valor)}
              />
            ))}
          </View>
        </View>
        <View style={styles.grupo}>
          <ItemLista icone="log-out-outline" titulo="Sair da conta" onPress={sair} perigo ultimo />
        </View>
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
  aparencia: { gap: 8 },
  rotuloGrupo: {
    marginLeft: 4,
    fontSize: tamanho.mini,
    fontWeight: '600',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: cores.textoSecundario,
  },
  opcoes: { flexDirection: 'row', gap: 8 },
  grupo: {
    borderRadius: raio.cartao,
    ...curva,
    backgroundColor: cores.superficie,
    overflow: 'hidden',
  },
}));
