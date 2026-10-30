import { useState } from 'react';
import { Text, View } from 'react-native';

import * as authApi from '../../src/api/auth';
import { ApiError } from '../../src/api/client';
import { useAuth } from '../../src/auth/AuthContext';
import { Aviso } from '../../src/components/ui/Aviso';
import { Botao } from '../../src/components/ui/Botao';
import { Campo } from '../../src/components/ui/Campo';
import { Icone } from '../../src/components/ui/Icone';
import type { NomeIcone } from '../../src/components/ui/Icone';
import { Tela } from '../../src/components/ui/Tela';
import { Pressionavel } from '../../src/components/ui/Pressionavel';
import { RequisitosSenha } from '../../src/components/ui/RequisitosSenha';
import { cores } from '../../src/theme/cores';
import { curva, raio } from '../../src/theme/estilo';
import { fonte, tamanho } from '../../src/theme/fontes';
import { senhaForte } from '../../src/util/senha';
import { vibrar } from '../../src/util/vibracao';
import { criarEstilos } from '../../src/theme/tema';

type Tipo = 'turista' | 'comerciante';

const TIPOS: { valor: Tipo; titulo: string; descricao: string; icone: NomeIcone }[] = [
  {
    valor: 'turista',
    titulo: 'Sou turista',
    descricao: 'Quero descobrir lugares',
    icone: 'compass',
  },
  {
    valor: 'comerciante',
    titulo: 'Tenho um negócio',
    descricao: 'Quero divulgar meu local',
    icone: 'storefront',
  },
];

const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function CadastroScreen() {
  const styles = useEstilos();
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
    if (!senhaForte(senha)) novos.senha = 'A senha ainda não atende a todos os requisitos.';
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
      vibrar.erro();
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
            <Pressionavel
              key={t.valor}
              onPress={() => setTipo(t.valor)}
              accessibilityRole="radio"
              accessibilityState={{ checked: ativo }}
              accessibilityLabel={`${t.titulo}. ${t.descricao}`}
              style={[styles.tipo, ativo && styles.tipoAtivo]}
            >
              <View style={styles.tipoTopo}>
                <View style={[styles.tipoIcone, ativo && { backgroundColor: cores.sol }]}>
                  <Icone nome={t.icone} tamanho={22} cor={ativo ? cores.tinta : cores.primaria} />
                </View>
                {ativo ? <Icone nome="checkmark-circle" tamanho={22} cor={cores.sol} /> : null}
              </View>
              <Text style={[styles.tipoTitulo, ativo && { color: cores.textoSobreTinta }]}>
                {t.titulo}
              </Text>
              <Text style={[styles.tipoDescricao, ativo && styles.descricaoAtiva]}>
                {t.descricao}
              </Text>
            </Pressionavel>
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
        // O aviso some assim que a senha passa a atender a todos os requisitos.
        erro={senhaForte(senha) ? null : erros.senha}
        secureTextEntry
        autoComplete="new-password"
      />
      <RequisitosSenha senha={senha} />
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

const useEstilos = criarEstilos(() => ({
  tipos: { flexDirection: 'row', gap: 12 },
  tipo: {
    flex: 1,
    gap: 6,
    padding: 14,
    borderRadius: raio.cartao,
    ...curva,
    borderWidth: 1.5,
    borderColor: cores.divisoria,
    backgroundColor: cores.superficie,
  },
  tipoAtivo: { borderColor: cores.tinta, backgroundColor: cores.tinta },
  tipoTopo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  tipoIcone: {
    width: 42,
    height: 42,
    borderRadius: raio.campo,
    ...curva,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: cores.fundoDestaque,
    marginBottom: 4,
  },
  tipoTitulo: { fontFamily: fonte.subtitulo, fontSize: tamanho.destaque, color: cores.texto },
  tipoDescricao: { fontSize: tamanho.apoio, color: cores.textoSecundario },
  descricaoAtiva: { color: 'rgba(255, 255, 255, 0.75)' },
}));
