import { Stack } from 'expo-router';

import { opcoesCabecalho } from '../../src/theme/navegacao';

export default function AuthLayout() {
  return (
    <Stack screenOptions={opcoesCabecalho}>
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="cadastro" options={{ title: 'Criar conta' }} />
      <Stack.Screen name="recuperar-senha" options={{ title: 'Esqueci a senha' }} />
    </Stack>
  );
}
