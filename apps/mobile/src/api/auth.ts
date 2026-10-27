import { api } from './client';
import type { Perfil, TipoUsuario, Usuario } from './tipos';

export function cadastrar(dados: {
  nome: string;
  email: string;
  senha: string;
  tipo: Exclude<TipoUsuario, 'administrador'>;
}) {
  return api<Usuario>('/auth/cadastro', { method: 'POST', body: JSON.stringify(dados) });
}

export function login(email: string, senha: string) {
  return api<{ access_token: string }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, senha }),
  });
}

export function buscarUsuarioLogado() {
  return api<Usuario>('/auth/me');
}

export function recuperarSenha(email: string) {
  return api<{ detail: string }>('/auth/recuperar-senha', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export function redefinirSenha(token: string, novaSenha: string) {
  return api<void>('/auth/redefinir-senha', {
    method: 'POST',
    body: JSON.stringify({ token, nova_senha: novaSenha }),
  });
}

export function buscarPerfil() {
  return api<Perfil>('/perfil');
}

export function salvarPerfil(perfil: Perfil) {
  return api<Perfil>('/perfil', { method: 'PUT', body: JSON.stringify(perfil) });
}
