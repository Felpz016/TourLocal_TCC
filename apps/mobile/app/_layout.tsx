import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';

import { AuthProvider, useAuth } from '../src/auth/AuthContext';
import { LocalizacaoProvider } from '../src/localizacao/LocalizacaoContext';
import { cores } from '../src/theme/cores';
import { arquivosDeFonte } from '../src/theme/fontes';
import { opcoesCabecalho } from '../src/theme/navegacao';

function Navegacao() {
  const { usuario, carregando } = useAuth();
  // Se a fonte falhar, o app segue com a do sistema em vez de travar no carregamento.
  const [fontesProntas, erroFontes] = useFonts(arquivosDeFonte);

  if (carregando || (!fontesProntas && !erroFontes)) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: cores.fundo,
        }}
      >
        <ActivityIndicator size="large" color={cores.primaria} />
      </View>
    );
  }

  // Stack.Protected mostra cada grupo de telas só quando a condição é verdadeira:
  // sem login, apenas as telas de autenticação; com login, as abas e o perfil.
  // A chave troca a cada login, então a posição é descartada quando o usuário sai (RN10).
  return (
    <LocalizacaoProvider key={usuario?.id_usuario ?? 'anonimo'}>
      <Stack screenOptions={opcoesCabecalho}>
        <Stack.Protected guard={!!usuario} redirectTo="/login">
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="preferencias" options={{ title: 'Minhas preferências' }} />
          <Stack.Screen name="localizacao" options={{ title: 'Localização' }} />
          {/* O detalhe desenha o próprio topo, com a foto atrás da Dynamic Island. */}
          <Stack.Screen name="lugar/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="gestao/novo" options={{ title: 'Novo local' }} />
          <Stack.Screen name="gestao/[id]" options={{ title: 'Editar local' }} />
        </Stack.Protected>
        <Stack.Protected guard={!usuario} redirectTo="/">
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        </Stack.Protected>
        <Stack.Screen name="redefinir-senha" options={{ title: 'Nova senha' }} />
      </Stack>
    </LocalizacaoProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <Navegacao />
      <StatusBar style="dark" />
    </AuthProvider>
  );
}
