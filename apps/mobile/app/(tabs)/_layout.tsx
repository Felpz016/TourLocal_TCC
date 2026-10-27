import { Tabs } from 'expo-router';
import { Text } from 'react-native';

function Icone({ emoji }: { emoji: string }) {
  return <Text style={{ fontSize: 20 }}>{emoji}</Text>;
}

// Os três eixos de recomendação definidos no TGI: Onde Comer, Onde Ficar e O que Fazer.
export default function TabsLayout() {
  return (
    <Tabs>
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
    </Tabs>
  );
}
