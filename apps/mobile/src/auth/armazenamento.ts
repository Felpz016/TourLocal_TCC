import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// O token dá acesso à conta, então no celular ele fica no armazenamento seguro do sistema
// (Keychain no iOS, Keystore no Android). Na web, onde isso não existe, usa o localStorage.
const CHAVE = 'tourlocal.token';

export async function lerToken(): Promise<string | null> {
  if (Platform.OS === 'web') return globalThis.localStorage?.getItem(CHAVE) ?? null;
  return SecureStore.getItemAsync(CHAVE);
}

export async function salvarToken(token: string): Promise<void> {
  if (Platform.OS === 'web') return globalThis.localStorage?.setItem(CHAVE, token);
  await SecureStore.setItemAsync(CHAVE, token);
}

export async function apagarToken(): Promise<void> {
  if (Platform.OS === 'web') return globalThis.localStorage?.removeItem(CHAVE);
  await SecureStore.deleteItemAsync(CHAVE);
}
