import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '../../src/auth/AuthContext';
import { ItemLista } from '../../src/components/ui/ItemLista';
import { Cabecalho } from '../../src/components/ui/Cabecalho';
import { useLocalizacao } from '../../src/localizacao/LocalizacaoContext';
import { cores } from '../../src/theme/cores';
import { raio, sombraForte } from '../../src/theme/estilo';
import { fonte } from '../../src/theme/fontes';
import { estilosLargura } from '../../src/theme/layout';

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
        <View style={styles.grupo}>
          <ItemLista icone="log-out-outline" titulo="Sair da conta" onPress={sair} perigo ultimo />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo },
  cartaoUsuario: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 18,
    borderRadius: raio.cartao,
    backgroundColor: cores.tinta,
    ...sombraForte,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: cores.sol,
  },
  iniciais: { fontFamily: fonte.titulo, fontSize: 26, color: cores.tinta },
  dados: { flex: 1, gap: 2 },
  nome: { fontFamily: fonte.subtitulo, fontSize: 22, color: cores.primariaTexto },
  email: { fontSize: 14, color: 'rgba(255, 255, 255, 0.75)' },
  tipo: {
    alignSelf: 'flex-start',
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: raio.pilula,
    overflow: 'hidden',
    fontSize: 12,
    fontWeight: '700',
    color: cores.primariaTexto,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
  },
  conteudo: { padding: 20, paddingTop: 8, gap: 16 },
  grupo: {
    borderRadius: raio.cartao,
    backgroundColor: cores.superficie,
    overflow: 'hidden',
  },
});
