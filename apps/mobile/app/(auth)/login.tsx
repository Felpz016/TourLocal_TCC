import { LinearGradient } from 'expo-linear-gradient';
import { Link, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ApiError } from '../../src/api/client';
import { useAuth } from '../../src/auth/AuthContext';
import { Aviso } from '../../src/components/ui/Aviso';
import { Botao } from '../../src/components/ui/Botao';
import { Campo } from '../../src/components/ui/Campo';
import { Icone } from '../../src/components/ui/Icone';
import { cores, degrade } from '../../src/theme/cores';
import { sombra, sombraForte } from '../../src/theme/estilo';
import { estilosLargura } from '../../src/theme/layout';

export default function LoginScreen() {
  const { entrar } = useAuth();
  const { top, bottom } = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function aoEntrar() {
    if (!email.trim() || !senha) {
      setErro('Informe e-mail e senha.');
      return;
    }
    setErro(null);
    setEnviando(true);
    try {
      await entrar(email.trim(), senha);
      // Com o usuário logado, o layout raiz troca automaticamente para as abas.
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : 'Não foi possível entrar.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.tela}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={[styles.rolagem, { paddingBottom: bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Topo azul atrás da Dynamic Island, com a marca do app. */}
        <LinearGradient
          colors={degrade}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.topo, { paddingTop: top + 32 }]}
        >
          <View style={styles.logo}>
            <Icone nome="location" tamanho={36} cor={cores.primaria} />
          </View>
          <Text style={styles.marca} accessibilityRole="header">
            TourLocal
          </Text>
          <Text style={styles.slogan}>Onde comer, ficar e o que fazer, perto de você.</Text>
        </LinearGradient>

        <View style={[styles.corpo, estilosLargura.conteudo]}>
          <View style={styles.cartao}>
            <Text style={styles.titulo}>Entrar</Text>
            <Campo
              rotulo="E-mail"
              icone="mail-outline"
              placeholder="voce@email.com"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              textContentType="emailAddress"
            />
            <Campo
              rotulo="Senha"
              icone="lock-closed-outline"
              placeholder="Sua senha"
              value={senha}
              onChangeText={setSenha}
              secureTextEntry
              autoComplete="current-password"
              textContentType="password"
              onSubmitEditing={aoEntrar}
            />
            <Link href="/recuperar-senha" style={styles.esqueci}>
              Esqueci minha senha
            </Link>
            <Aviso texto={erro} />
            <Botao titulo="Entrar" onPress={aoEntrar} carregando={enviando} />
          </View>

          <Text style={styles.semConta}>Ainda não tem conta?</Text>
          <Botao titulo="Criar conta" variante="secundario" onPress={() => router.push('/cadastro')} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo },
  rolagem: { flexGrow: 1 },
  topo: {
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 24,
    paddingBottom: 72,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
  },
  logo: {
    width: 76,
    height: 76,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: cores.superficie,
    ...sombraForte,
  },
  marca: { fontSize: 34, fontWeight: '800', color: cores.primariaTexto, letterSpacing: -0.6 },
  slogan: { fontSize: 16, color: 'rgba(255, 255, 255, 0.85)', textAlign: 'center' },
  corpo: { gap: 12, paddingHorizontal: 20, marginTop: -44 },
  cartao: {
    gap: 14,
    padding: 20,
    borderRadius: 24,
    backgroundColor: cores.superficie,
    ...sombra,
  },
  titulo: { fontSize: 22, fontWeight: '800', color: cores.texto },
  esqueci: {
    alignSelf: 'flex-end',
    color: cores.primaria,
    fontSize: 14,
    fontWeight: '700',
    paddingVertical: 6,
  },
  semConta: { textAlign: 'center', fontSize: 14, color: cores.textoSecundario, marginTop: 8 },
});
