import { useState } from 'react';

import * as authApi from '../../src/api/auth';
import { ApiError } from '../../src/api/client';
import { Aviso } from '../../src/components/ui/Aviso';
import { Botao } from '../../src/components/ui/Botao';
import { Campo } from '../../src/components/ui/Campo';
import { Tela } from '../../src/components/ui/Tela';

export default function RecuperarSenhaScreen() {
  const [email, setEmail] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [enviado, setEnviado] = useState(false);
  const [enviando, setEnviando] = useState(false);

  async function aoEnviar() {
    if (!email.trim()) {
      setErro('Informe seu e-mail.');
      return;
    }
    setErro(null);
    setEnviando(true);
    try {
      await authApi.recuperarSenha(email.trim());
      setEnviado(true);
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : 'Não foi possível enviar.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Tela
      titulo="Esqueci a senha"
      subtitulo="Enviaremos um link para você criar uma nova senha."
    >
      <Campo
        rotulo="E-mail"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
      />
      <Aviso texto={erro} />
      <Aviso
        tipo="sucesso"
        texto={
          enviado
            ? 'Se o e-mail estiver cadastrado, você vai receber o link em instantes. Confira também a caixa de spam.'
            : null
        }
      />
      <Botao titulo="Enviar link" onPress={aoEnviar} carregando={enviando} />
    </Tela>
  );
}
