import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text } from 'react-native';

import { listarFavoritos } from '../../src/api/estabelecimentos';
import type { Favorito } from '../../src/api/estabelecimentos';
import { Aviso } from '../../src/components/ui/Aviso';
import { cores } from '../../src/theme/cores';
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
    <ScrollView
      contentContainerStyle={styles.conteudo}
      refreshControl={<RefreshControl refreshing={carregando} onRefresh={carregar} />}
    >
      <Aviso texto={erro} />
      {favoritos?.length === 0 ? (
        <Text style={styles.vazio}>
          Você ainda não salvou nenhum local. Toque em ♡ nos detalhes de um lugar para guardá-lo
          aqui.
        </Text>
      ) : null}
      {favoritos?.map((f) => (
        <Pressable
          key={f.id_estab}
          style={({ pressed }) => [styles.cartao, pressed && { opacity: 0.7 }]}
          accessibilityRole="button"
          onPress={() => router.push(`/lugar/${f.id_estab}`)}
        >
          <Text style={styles.nome}>{f.nome}</Text>
          <Text style={styles.secundario}>
            {[
              f.categorias.join(', '),
              f.nota_media !== null ? `★ ${formatarNota(f.nota_media)}` : null,
            ]
              .filter(Boolean)
              .join(' · ')}
          </Text>
          <Text style={styles.secundario} numberOfLines={1}>
            {f.endereco}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  conteudo: { padding: 16, gap: 12 },
  vazio: { fontSize: 16, color: cores.textoSecundario, textAlign: 'center', paddingVertical: 24 },
  cartao: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E2E2',
    backgroundColor: cores.fundo,
    gap: 4,
  },
  nome: { fontSize: 17, fontWeight: '700', color: cores.texto },
  secundario: { fontSize: 14, color: cores.textoSecundario },
});
