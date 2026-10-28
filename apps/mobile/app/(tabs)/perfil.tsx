import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '../../src/auth/AuthContext';
import { ItemLista } from '../../src/components/ui/ItemLista';
import { TopoGradiente } from '../../src/components/ui/TopoGradiente';
import { useLocalizacao } from '../../src/localizacao/LocalizacaoContext';
import { cores } from '../../src/theme/cores';
import { raio } from '../../src/theme/estilo';
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
      <TopoGradiente titulo="Perfil">
        <View style={styles.cartaoUsuario}>
          <View style={styles.avatar}>
            <Text style={styles.iniciais}>{iniciais(usuario.nome)}</Text>
          </View>
          <View style={styles.dados}>
            <Text style={styles.nome} numberOfLines={1}>
              {usuario.nome}
            </Text>
            <Text style={styles.email} numberOfLines={1}>
              {usuario.email} · {TIPOS[usuario.tipo]}
            </Text>
          </View>
        </View>
      </TopoGradiente>

      <ScrollView contentContainerStyle={[styles.conteudo, estilosLargura.conteudo]}>
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
    gap: 14,
    marginTop: 10,
    padding: 14,
    borderRadius: raio.cartao,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: cores.superficie,
  },
  iniciais: { fontSize: 20, fontWeight: '800', color: cores.primaria },
  dados: { flex: 1, gap: 2 },
  nome: { fontSize: 18, fontWeight: '700', color: cores.primariaTexto },
  email: { fontSize: 13, color: 'rgba(255, 255, 255, 0.85)' },
  conteudo: { padding: 20, gap: 16 },
  grupo: {
    borderRadius: raio.cartao,
    borderWidth: 1,
    borderColor: cores.divisoria,
    backgroundColor: cores.superficie,
    overflow: 'hidden',
  },
});
