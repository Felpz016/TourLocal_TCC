import { Link, Redirect, router } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '../../src/auth/AuthContext';
import { cores } from '../../src/theme/cores';

function Icone({ emoji }: { emoji: string }) {
  return <Text style={{ fontSize: 20 }}>{emoji}</Text>;
}

function AcoesCabecalho() {
  const { usuario, sair } = useAuth();
  return (
    <View style={styles.acoes}>
      {usuario?.tipo === 'turista' ? (
        <Link href="/preferencias" style={styles.acao} accessibilityLabel="Minhas preferências">
          Preferências
        </Link>
      ) : null}
      <Pressable accessibilityRole="button" onPress={sair} hitSlop={8}>
        <Text style={styles.acao}>Sair</Text>
      </Pressable>
    </View>
  );
}

// Os três eixos de recomendação definidos no TGI: Onde Comer, Onde Ficar e O que Fazer.
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
        tabBarActiveTintColor: cores.primaria,
        headerRight: () => <AcoesCabecalho />,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Comer', tabBarIcon: () => <Icone emoji="🍽️" /> }}
      />
      <Tabs.Screen
        name="ficar"
        options={{ title: 'Ficar', tabBarIcon: () => <Icone emoji="🛏️" /> }}
      />
      <Tabs.Screen
        name="fazer"
        options={{ title: 'Fazer', tabBarIcon: () => <Icone emoji="🗺️" /> }}
      />
      {/* Salvos é só do turista (RF14); para os outros perfis a aba fica escondida. */}
      <Tabs.Screen
        name="salvos"
        options={{
          title: 'Salvos',
          tabBarIcon: () => <Icone emoji="♥" />,
          href: tipo === 'turista' ? undefined : null,
        }}
      />
      {/* Painel do comerciante (RF15 a RF17) e moderação (RF18), escondidos dos outros perfis. */}
      <Tabs.Screen
        name="meus-locais"
        options={{
          title: 'Meus locais',
          tabBarIcon: () => <Icone emoji="🏪" />,
          href: tipo === 'comerciante' ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="moderacao"
        options={{
          title: 'Moderação',
          tabBarIcon: () => <Icone emoji="🛡️" />,
          href: tipo === 'administrador' ? undefined : null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  acoes: { flexDirection: 'row', gap: 16, marginRight: 16, alignItems: 'center' },
  acao: { color: cores.primaria, fontSize: 15, fontWeight: '600' },
});
