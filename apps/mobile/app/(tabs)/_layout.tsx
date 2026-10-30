import { Redirect, router } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import { useEffect, useRef } from 'react';

import { useAuth } from '../../src/auth/AuthContext';
import { BarraAbas } from '../../src/components/BarraAbas';
import { cores } from '../../src/theme/cores';
import { useTema } from '../../src/theme/tema';

// Os três eixos de recomendação definidos no TGI: Onde Comer, Onde Ficar e O que Fazer.
// Cada tela desenha o próprio topo azul, então o cabeçalho padrão fica escondido.
export default function TabsLayout() {
  useTema();
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
      tabBar={(props) => <BarraAbas {...props} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: cores.fundo } }}
    >
      <Tabs.Screen name="index" options={{ title: 'Comer' }} />
      <Tabs.Screen name="ficar" options={{ title: 'Ficar' }} />
      <Tabs.Screen name="fazer" options={{ title: 'Fazer' }} />
      {/* Salvos é só do turista (RF14); para os outros perfis a aba fica escondida. */}
      <Tabs.Screen
        name="salvos"
        options={{
          title: 'Salvos',
          href: tipo === 'turista' ? undefined : null,
        }}
      />
      {/* Painel do comerciante (RF15 a RF17) e moderação (RF18), escondidos dos outros perfis. */}
      <Tabs.Screen
        name="meus-locais"
        options={{
          title: 'Meus locais',
          href: tipo === 'comerciante' ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="moderacao"
        options={{
          title: 'Moderação',
          href: tipo === 'administrador' ? undefined : null,
        }}
      />
      {/* Preferências, localização e sair ficam no Perfil, longe do cabeçalho. */}
      <Tabs.Screen name="perfil" options={{ title: 'Perfil' }} />
    </Tabs>
  );
}
