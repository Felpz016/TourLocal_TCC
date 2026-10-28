import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { cores } from '../theme/cores';
import { raio, sombraForte } from '../theme/estilo';
import { Icone } from './ui/Icone';
import type { NomeIcone } from './ui/Icone';

const ICONES: Record<string, NomeIcone> = {
  index: 'restaurant',
  ficar: 'bed',
  fazer: 'compass',
  salvos: 'heart',
  'meus-locais': 'storefront',
  moderacao: 'shield-checkmark',
  perfil: 'person',
};

/**
 * Barra de abas flutuante em azul-marinho. A aba ativa vira uma pílula clara com o
 * nome; as outras mostram só o ícone. Fica acima do indicador de início do iPhone.
 */
export function BarraAbas({
  state,
  descriptors,
  emitter,
  navigateToTab,
  insets,
}: BottomTabBarProps) {
  // As abas com href nulo (de outros perfis) já chegam fora de `state.routes`.
  const visiveis = state.routes;

  return (
    <View style={[styles.area, { paddingBottom: Math.max(insets.bottom - 6, 12) }]}>
      <View style={styles.barra} accessibilityRole="tablist">
        {visiveis.map((rota) => {
          const ativa = state.routes[state.index]?.key === rota.key;
          const titulo = descriptors[rota.key]?.options.title ?? rota.name;
          const icone = ICONES[rota.name] ?? 'ellipse';
          return (
            <Pressable
              key={rota.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: ativa }}
              accessibilityLabel={titulo}
              onPress={() => {
                const evento = emitter.emit({
                  type: 'tabPress',
                  target: rota.key,
                  canPreventDefault: true,
                });
                if (!ativa && !evento.defaultPrevented) navigateToTab(rota.key);
              }}
              style={[styles.aba, ativa && styles.abaAtiva]}
            >
              <Icone
                nome={(ativa ? icone : `${icone}-outline`) as NomeIcone}
                tamanho={22}
                cor={ativa ? cores.tinta : 'rgba(255, 255, 255, 0.75)'}
              />
              {ativa ? <Text style={styles.rotulo}>{titulo}</Text> : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  area: { paddingHorizontal: 16, paddingTop: 8, backgroundColor: cores.fundo },
  barra: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 6,
    borderRadius: raio.pilula,
    backgroundColor: cores.tinta,
    ...sombraForte,
  },
  aba: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 52,
    minWidth: 52,
    paddingHorizontal: 14,
    borderRadius: raio.pilula,
  },
  abaAtiva: { backgroundColor: cores.sol, paddingHorizontal: 18 },
  rotulo: { fontSize: 14, fontWeight: '800', color: cores.tinta },
});
