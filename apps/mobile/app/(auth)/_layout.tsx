import { Stack } from 'expo-router';

import { cores } from '../../src/theme/cores';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerTintColor: cores.primaria }}>
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="cadastro" options={{ title: 'Criar conta' }} />
      <Stack.Screen name="recuperar-senha" options={{ title: 'Esqueci a senha' }} />
    </Stack>
  );
}
