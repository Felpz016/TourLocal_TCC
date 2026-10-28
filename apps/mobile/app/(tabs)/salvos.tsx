import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { listarFavoritos } from '../../src/api/estabelecimentos';
import type { Favorito } from '../../src/api/estabelecimentos';
import { Miniatura } from '../../src/components/Miniatura';
import { Aviso } from '../../src/components/ui/Aviso';
import { Cabecalho } from '../../src/components/ui/Cabecalho';
import { Icone } from '../../src/components/ui/Icone';
import { cores } from '../../src/theme/cores';
import { cartaoPlano, raio } from '../../src/theme/estilo';
import { fonte } from '../../src/theme/fontes';
import { estilosLargura } from '../../src/theme/layout';
import { formatarNota } from '../../src/util/formato';

// Locais salvos pelo turista (UC09, RF14). Recarrega sempre que a aba ganha foco,
// para refletir o que foi salvo ou removido na tela de detalhes.
export default function SalvosTela() {
  const [favoritos, setFavoritos] = useState<Favorito[] | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      setFavoritos(await listarFavoritos());
      setErro(null);
    } catch {
      setErro('Não foi possível carregar seus locais salvos.');
    } finally {
      setCarregando(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [carregar]),
  );

  return (
    <View style={styles.tela}>
      <Cabecalho
        titulo="Salvos"
        subtitulo={
          favoritos?.length
            ? `${favoritos.length} ${favoritos.length === 1 ? 'lugar guardado' : 'lugares guardados'} para depois`
            : undefined
        }
      />
      <ScrollView
        contentContainerStyle={[styles.conteudo, estilosLargura.conteudo]}
        refreshControl={<RefreshControl refreshing={carregando} onRefresh={carregar} />}
      >
        <Aviso texto={erro} />
        {favoritos?.length === 0 ? (
          <View style={styles.vazio}>
            <Icone nome="heart-outline" tamanho={32} cor={cores.favorito} />
            <Text style={styles.tituloVazio}>Sua lista está vazia</Text>
            <Text style={styles.textoVazio}>
              Toque no coração nos detalhes de um lugar para guardá-lo aqui.
            </Text>
          </View>
        ) : null}
        {favoritos?.map((f) => (
          <Pressable
            key={f.id_estab}
            style={({ pressed }) => [styles.cartao, pressed && { opacity: 0.85 }]}
            accessibilityRole="button"
            onPress={() => router.push(`/lugar/${f.id_estab}`)}
          >
            <Miniatura nome={f.nome} tamanho={60} />
            <View style={styles.info}>
              <Text style={styles.nome} numberOfLines={1}>
                {f.nome}
              </Text>
              <Text style={styles.secundario} numberOfLines={1}>
                {[
                  f.nota_media !== null ? `★ ${formatarNota(f.nota_media)}` : null,
                  f.categorias.join(', '),
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </Text>
              <Text style={styles.secundario} numberOfLines={1}>
                {f.endereco}
              </Text>
            </View>
            <Icone nome="heart" tamanho={22} cor={cores.favorito} />
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo },
  conteudo: { padding: 20, paddingTop: 8, gap: 12 },
  vazio: {
    alignItems: 'center',
    gap: 8,
    padding: 28,
    borderRadius: raio.cartao,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: cores.borda,
  },
  tituloVazio: { fontFamily: fonte.subtitulo, fontSize: 20, color: cores.texto },
  textoVazio: { fontSize: 15, color: cores.textoSecundario, textAlign: 'center' },
  cartao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: raio.cartao,
    ...cartaoPlano,
  },
  info: { flex: 1, gap: 2 },
  nome: { fontFamily: fonte.subtitulo, fontSize: 17, color: cores.texto },
  secundario: { fontSize: 13, color: cores.textoSecundario },
});
