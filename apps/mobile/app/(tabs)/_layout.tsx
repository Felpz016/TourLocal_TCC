import { Redirect, router } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import type { ColorValue } from 'react-native';
import { useEffect, useRef } from 'react';

import { useAuth } from '../../src/auth/AuthContext';
import { Icone } from '../../src/components/ui/Icone';
import type { NomeIcone } from '../../src/components/ui/Icone';
import { cores } from '../../src/theme/cores';

// Ícone cheio na aba ativa e contornado nas outras, como nos apps do iOS.
const icone =
  (nome: string) =>
  ({ focused, color }: { focused: boolean; color: ColorValue }) => (
    <Icone
      nome={(focused ? nome : `${nome}-outline`) as NomeIcone}
      tamanho={24}
      cor={String(color)}
    />
  );

// Os três eixos de recomendação definidos no TGI: Onde Comer, Onde Ficar e O que Fazer.
// Cada tela desenha o próprio topo azul, então o cabeçalho padrão fica escondido.
export default function TabsLayout() {
  const { usuario, primeiroAcesso } = useAuth();

  const tipo = usuario?.tipo;
  const levouAoPainel = useRef(false);

  // Comerciante e administrador abrem direto no próprio painel; o turista, no eixo Comer.
  useEffect(() => {
    if (levouAoPainel.current || !tipo || tipo === 'turista') return;
    levouAoPainel.current = true;
    router.navigate(tipo === 'comerciante' ? '/meus-locais' : '/moderacao');
  }, [tipo]);

  // Logo após o cadastro, o turista define as preferências antes de ver as recomendações.
  if (primeiroAcesso) return <Redirect href="/preferencias" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: cores.primaria,
        tabBarInactiveTintColor: cores.textoSecundario,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarStyle: {
          backgroundColor: cores.superficie,
          borderTopColor: cores.divisoria,
        },
        sceneStyle: { backgroundColor: cores.fundo },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Comer', tabBarIcon: icone('restaurant') }} />
      <Tabs.Screen name="ficar" options={{ title: 'Ficar', tabBarIcon: icone('bed') }} />
      <Tabs.Screen name="fazer" options={{ title: 'Fazer', tabBarIcon: icone('compass') }} />
      {/* Salvos é só do turista (RF14); para os outros perfis a aba fica escondida. */}
      <Tabs.Screen
        name="salvos"
        options={{
          title: 'Salvos',
          tabBarIcon: icone('heart'),
          href: tipo === 'turista' ? undefined : null,
        }}
      />
      {/* Painel do comerciante (RF15 a RF17) e moderação (RF18), escondidos dos outros perfis. */}
      <Tabs.Screen
        name="meus-locais"
        options={{
          title: 'Meus locais',
          tabBarIcon: icone('storefront'),
          href: tipo === 'comerciante' ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="moderacao"
        options={{
          title: 'Moderação',
          tabBarIcon: icone('shield-checkmark'),
          href: tipo === 'administrador' ? undefined : null,
        }}
      />
      {/* Preferências, localização e sair ficam no Perfil, longe do cabeçalho. */}
      <Tabs.Screen name="perfil" options={{ title: 'Perfil', tabBarIcon: icone('person') }} />
    </Tabs>
  );
}
