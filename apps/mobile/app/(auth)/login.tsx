import { Link, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ApiError } from '../../src/api/client';
import { useAuth } from '../../src/auth/AuthContext';
import { Aviso } from '../../src/components/ui/Aviso';
import { Botao } from '../../src/components/ui/Botao';
import { Campo } from '../../src/components/ui/Campo';
import { Icone } from '../../src/components/ui/Icone';
import { cores } from '../../src/theme/cores';
import { curva, raio, sombra } from '../../src/theme/estilo';
import { fonte, tamanho } from '../../src/theme/fontes';
import { estilosLargura } from '../../src/theme/layout';
import { vibrar } from '../../src/util/vibracao';

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
      vibrar.erro();
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
        {/* Topo azul-marinho com anéis de "raio de busca" em volta do ponto do usuário. */}
        <View style={[styles.topo, { paddingTop: top + 20 }]}>
          <View style={styles.aneis} pointerEvents="none">
            {[260, 190, 120].map((d) => (
              <View key={d} style={[styles.anel, { width: d, height: d, borderRadius: d / 2 }]} />
            ))}
            <View style={styles.ponto} />
          </View>
          <View style={styles.marcaLinha}>
            <View style={styles.logo}>
              <Icone nome="navigate" tamanho={18} cor={cores.tinta} />
            </View>
            <Text style={styles.marca}>TourLocal</Text>
          </View>
          <Text style={styles.manchete} accessibilityRole="header">
            O melhor da cidade,{'\n'}
            <Text style={styles.mancheteDestaque}>a poucos passos.</Text>
          </Text>
          <Text style={styles.slogan}>Onde comer, ficar e o que fazer, perto de você.</Text>
        </View>

        <View style={[styles.corpo, estilosLargura.conteudo]}>
          <View style={styles.cartao}>
            <Text style={styles.titulo}>Entrar na conta</Text>
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
          <Botao
            titulo="Criar conta"
            variante="secundario"
            onPress={() => router.push('/cadastro')}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo },
  rolagem: { flexGrow: 1 },
  topo: {
    gap: 14,
    paddingHorizontal: 24,
    paddingBottom: 72,
    backgroundColor: cores.tinta,
    overflow: 'hidden',
  },
  aneis: {
    position: 'absolute',
    right: -70,
    top: 10,
    width: 260,
    height: 260,
    alignItems: 'center',
    justifyContent: 'center',
  },
  anel: {
    position: 'absolute',
    borderWidth: 1.5,
    borderColor: 'rgba(36, 91, 255, 0.55)',
    borderStyle: 'dashed',
  },
  ponto: {
    width: 18,
    height: 18,
    borderRadius: raio.pilula,
    backgroundColor: cores.sol,
    borderWidth: 4,
    borderColor: 'rgba(255, 200, 61, 0.35)',
  },
  marcaLinha: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 28 },
  logo: {
    width: 34,
    height: 34,
    borderRadius: raio.icone,
    ...curva,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: cores.sol,
  },
  marca: { fontFamily: fonte.subtitulo, fontSize: tamanho.secao, color: cores.primariaTexto },
  manchete: {
    fontFamily: fonte.titulo,
    // Manchete da tela de entrada: o único texto em tamanho de cartaz, fora da escala.
    fontSize: 40,
    lineHeight: 44,
    color: cores.primariaTexto,
    letterSpacing: -1,
  },
  mancheteDestaque: { color: cores.sol },
  slogan: { fontSize: tamanho.campo, color: 'rgba(255, 255, 255, 0.75)' },
  corpo: { gap: 12, paddingHorizontal: 20, marginTop: -40 },
  cartao: {
    gap: 14,
    padding: 20,
    borderRadius: raio.folha,
    ...curva,
    backgroundColor: cores.superficie,
    ...sombra,
  },
  titulo: { fontFamily: fonte.subtitulo, fontSize: tamanho.titulo, color: cores.texto },
  esqueci: {
    alignSelf: 'flex-end',
    color: cores.primaria,
    fontSize: tamanho.rotulo,
    fontWeight: '700',
    paddingVertical: 6,
  },
  semConta: {
    textAlign: 'center',
    fontSize: tamanho.rotulo,
    color: cores.textoSecundario,
    marginTop: 8,
  },
});
