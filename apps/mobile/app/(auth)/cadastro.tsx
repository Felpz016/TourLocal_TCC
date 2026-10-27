import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import * as authApi from '../../src/api/auth';
import { ApiError } from '../../src/api/client';
import { useAuth } from '../../src/auth/AuthContext';
import { Aviso } from '../../src/components/ui/Aviso';
import { Botao } from '../../src/components/ui/Botao';
import { Campo } from '../../src/components/ui/Campo';
import { Opcao } from '../../src/components/ui/Opcao';
import { Tela } from '../../src/components/ui/Tela';
import { cores } from '../../src/theme/cores';

type Tipo = 'turista' | 'comerciante';

const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function CadastroScreen() {
  const { entrar } = useAuth();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [tipo, setTipo] = useState<Tipo>('turista');
  const [erros, setErros] = useState<Record<string, string>>({});
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  function validar() {
    const novos: Record<string, string> = {};
    if (nome.trim().length < 2) novos.nome = 'Informe seu nome.';
    if (!EMAIL_VALIDO.test(email.trim())) novos.email = 'Informe um e-mail válido.';
    if (senha.length < 8) novos.senha = 'A senha precisa de pelo menos 8 caracteres.';
    if (confirmacao !== senha) novos.confirmacao = 'As senhas não são iguais.';
    setErros(novos);
    return Object.keys(novos).length === 0;
  }

  async function aoCadastrar() {
    if (!validar()) return;
    setErroGeral(null);
    setEnviando(true);
    try {
      await authApi.cadastrar({ nome: nome.trim(), email: email.trim(), senha, tipo });
      // Entra direto após o cadastro; o layout raiz leva o usuário para o app.
      await entrar(email.trim(), senha, { primeiroAcesso: true });
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        setErros({ email: 'Este e-mail já tem uma conta.' });
      } else {
        setErroGeral(e instanceof ApiError ? e.message : 'Não foi possível criar a conta.');
      }
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Tela titulo="Criar conta" subtitulo="Leva menos de um minuto.">
      <View style={styles.tipos}>
        <Text style={styles.rotulo}>Eu sou</Text>
        <View style={styles.linha}>
          <Opcao rotulo="Turista" selecionada={tipo === 'turista'} onPress={() => setTipo('turista')} />
          <Opcao
            rotulo="Dono de estabelecimento"
            selecionada={tipo === 'comerciante'}
            onPress={() => setTipo('comerciante')}
          />
        </View>
      </View>

      <Campo rotulo="Nome" value={nome} onChangeText={setNome} erro={erros.nome} autoComplete="name" />
      <Campo
        rotulo="E-mail"
        value={email}
        onChangeText={setEmail}
        erro={erros.email}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
      />
      <Campo
        rotulo="Senha"
        value={senha}
        onChangeText={setSenha}
        erro={erros.senha}
        secureTextEntry
        autoComplete="new-password"
      />
      <Campo
        rotulo="Confirme a senha"
        value={confirmacao}
        onChangeText={setConfirmacao}
        erro={erros.confirmacao}
        secureTextEntry
        autoComplete="new-password"
      />
      <Aviso texto={erroGeral} />
      <Botao titulo="Criar conta" onPress={aoCadastrar} carregando={enviando} />
    </Tela>
  );
}

const styles = StyleSheet.create({
  tipos: { gap: 8 },
  rotulo: { fontSize: 15, fontWeight: '600', color: cores.texto },
  linha: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
