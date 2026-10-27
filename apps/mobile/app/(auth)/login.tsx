import { Link } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ApiError } from '../../src/api/client';
import { useAuth } from '../../src/auth/AuthContext';
import { Aviso } from '../../src/components/ui/Aviso';
import { Botao } from '../../src/components/ui/Botao';
import { Campo } from '../../src/components/ui/Campo';
import { Tela } from '../../src/components/ui/Tela';
import { cores } from '../../src/theme/cores';

export default function LoginScreen() {
  const { entrar } = useAuth();
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
    <Tela>
      <View style={styles.marca}>
        <Text style={styles.logo} accessibilityRole="header">
          TourLocal
        </Text>
        <Text style={styles.slogan}>Onde comer, ficar e o que fazer, perto de você.</Text>
      </View>

      <Campo
        rotulo="E-mail"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        textContentType="emailAddress"
      />
      <Campo
        rotulo="Senha"
        value={senha}
        onChangeText={setSenha}
        secureTextEntry
        autoComplete="current-password"
        textContentType="password"
        onSubmitEditing={aoEntrar}
      />
      <Aviso texto={erro} />
      <Botao titulo="Entrar" onPress={aoEntrar} carregando={enviando} />

      <Link href="/recuperar-senha" style={styles.link}>
        Esqueci minha senha
      </Link>
      <Link href="/cadastro" style={styles.link}>
        Ainda não tem conta? Cadastre-se
      </Link>
    </Tela>
  );
}

const styles = StyleSheet.create({
  marca: { alignItems: 'center', marginTop: 48, marginBottom: 24, gap: 8 },
  logo: { fontSize: 36, fontWeight: '800', color: cores.primaria },
  slogan: { fontSize: 16, color: cores.textoSecundario, textAlign: 'center' },
  link: {
    color: cores.primaria,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    paddingVertical: 10,
  },
});
