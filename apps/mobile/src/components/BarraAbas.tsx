import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { cores } from '../theme/cores';
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
 * Barra de abas no padrão do iOS: ícone e nome em todas as abas, com a ativa em azul.
 * Fica colada embaixo e respeita o indicador de início do iPhone.
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
    <View
      style={[styles.barra, { paddingBottom: Math.max(insets.bottom, 8) }]}
      accessibilityRole="tablist"
    >
      {visiveis.map((rota) => {
        const ativa = state.routes[state.index]?.key === rota.key;
        const titulo = descriptors[rota.key]?.options.title ?? rota.name;
        const icone = ICONES[rota.name] ?? 'ellipse';
        const cor = ativa ? cores.primaria : cores.textoSecundario;
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
            style={styles.aba}
          >
            <Icone
              nome={(ativa ? icone : `${icone}-outline`) as NomeIcone}
              tamanho={24}
              cor={cor}
            />
            <Text
              style={[styles.rotulo, { color: cor }, ativa && styles.rotuloAtivo]}
              numberOfLines={1}
            >
              {titulo}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  barra: {
    flexDirection: 'row',
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: cores.borda,
    backgroundColor: cores.superficie,
  },
  aba: { flex: 1, alignItems: 'center', gap: 3, minHeight: 44 },
  rotulo: { fontSize: 11, fontWeight: '500' },
  rotuloAtivo: { fontWeight: '700' },
});
