import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import * as authApi from '../../src/api/auth';
import { ApiError } from '../../src/api/client';
import { useAuth } from '../../src/auth/AuthContext';
import { Aviso } from '../../src/components/ui/Aviso';
import { Botao } from '../../src/components/ui/Botao';
import { Campo } from '../../src/components/ui/Campo';
import { Icone } from '../../src/components/ui/Icone';
import type { NomeIcone } from '../../src/components/ui/Icone';
import { Tela } from '../../src/components/ui/Tela';
import { cores } from '../../src/theme/cores';
import { raio } from '../../src/theme/estilo';

type Tipo = 'turista' | 'comerciante';

const TIPOS: { valor: Tipo; titulo: string; descricao: string; icone: NomeIcone }[] = [
  { valor: 'turista', titulo: 'Sou turista', descricao: 'Quero descobrir lugares', icone: 'compass' },
  {
    valor: 'comerciante',
    titulo: 'Tenho um negócio',
    descricao: 'Quero divulgar meu local',
    icone: 'storefront',
  },
];

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
    <Tela
      titulo="Como você vai usar o TourLocal?"
      rodape={<Botao titulo="Criar conta" onPress={aoCadastrar} carregando={enviando} />}
    >
      <View style={styles.tipos} accessibilityRole="radiogroup">
        {TIPOS.map((t) => {
          const ativo = tipo === t.valor;
          return (
            <Pressable
              key={t.valor}
              onPress={() => setTipo(t.valor)}
              accessibilityRole="radio"
              accessibilityState={{ checked: ativo }}
              accessibilityLabel={`${t.titulo}. ${t.descricao}`}
              style={[styles.tipo, ativo && styles.tipoAtivo]}
            >
              <View style={styles.tipoTopo}>
                <View style={[styles.tipoIcone, ativo && { backgroundColor: cores.superficie }]}>
                  <Icone nome={t.icone} tamanho={22} cor={cores.primaria} />
                </View>
                {ativo ? <Icone nome="checkmark-circle" tamanho={22} cor={cores.primaria} /> : null}
              </View>
              <Text style={styles.tipoTitulo}>{t.titulo}</Text>
              <Text style={styles.tipoDescricao}>{t.descricao}</Text>
            </Pressable>
          );
        })}
      </View>

      <Campo
        rotulo="Nome"
        icone="person-outline"
        value={nome}
        onChangeText={setNome}
        erro={erros.nome}
        autoComplete="name"
      />
      <Campo
        rotulo="E-mail"
        icone="mail-outline"
        value={email}
        onChangeText={setEmail}
        erro={erros.email}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
      />
      <Campo
        rotulo="Senha"
        icone="lock-closed-outline"
        value={senha}
        onChangeText={setSenha}
        erro={erros.senha}
        dica="Pelo menos 8 caracteres."
        secureTextEntry
        autoComplete="new-password"
      />
      <Campo
        rotulo="Confirme a senha"
        icone="lock-closed-outline"
        value={confirmacao}
        onChangeText={setConfirmacao}
        erro={erros.confirmacao}
        secureTextEntry
        autoComplete="new-password"
      />
      <Aviso texto={erroGeral} />
    </Tela>
  );
}

const styles = StyleSheet.create({
  tipos: { flexDirection: 'row', gap: 12 },
  tipo: {
    flex: 1,
    gap: 6,
    padding: 14,
    borderRadius: raio.cartao,
    borderWidth: 1.5,
    borderColor: cores.divisoria,
    backgroundColor: cores.superficie,
  },
  tipoAtivo: { borderColor: cores.primaria, backgroundColor: cores.fundoDestaque },
  tipoTopo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  tipoIcone: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: cores.fundoDestaque,
    marginBottom: 4,
  },
  tipoTitulo: { fontSize: 15, fontWeight: '700', color: cores.texto },
  tipoDescricao: { fontSize: 13, color: cores.textoSecundario },
});
