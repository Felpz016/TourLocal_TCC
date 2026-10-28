import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import * as authApi from '../src/api/auth';
import { ApiError } from '../src/api/client';
import { Aviso } from '../src/components/ui/Aviso';
import { Botao } from '../src/components/ui/Botao';
import { Campo } from '../src/components/ui/Campo';
import { RequisitosSenha } from '../src/components/ui/RequisitosSenha';
import { Tela } from '../src/components/ui/Tela';
import { senhaForte } from '../src/util/senha';

// Aberta pelo link do e-mail: tourlocal://redefinir-senha?token=...
export default function RedefinirSenhaScreen() {
  const { token } = useLocalSearchParams<{ token?: string }>();
  const [senha, setSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [concluido, setConcluido] = useState(false);
  const [enviando, setEnviando] = useState(false);

  async function aoSalvar() {
    if (!senhaForte(senha)) return setErro('A senha ainda não atende a todos os requisitos.');
    if (senha !== confirmacao) return setErro('As senhas não são iguais.');
    if (!token) return setErro('Link inválido. Peça um novo na tela de login.');

    setErro(null);
    setEnviando(true);
    try {
      await authApi.redefinirSenha(token, senha);
      setConcluido(true);
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : 'Não foi possível trocar a senha.');
    } finally {
      setEnviando(false);
    }
  }

  if (concluido) {
    return (
      <Tela titulo="Senha alterada">
        <Aviso tipo="sucesso" texto="Pronto! Agora é só entrar com a nova senha." />
        <Botao titulo="Ir para o login" onPress={() => router.replace('/login')} />
      </Tela>
    );
  }

  return (
    <Tela titulo="Criar nova senha">
      <Campo
        rotulo="Nova senha"
        value={senha}
        onChangeText={setSenha}
        secureTextEntry
        autoComplete="new-password"
      />
      <RequisitosSenha senha={senha} />
      <Campo
        rotulo="Confirme a nova senha"
        value={confirmacao}
        onChangeText={setConfirmacao}
        secureTextEntry
      />
      <Aviso texto={erro} />
      <Botao titulo="Salvar nova senha" onPress={aoSalvar} carregando={enviando} />
    </Tela>
  );
}
