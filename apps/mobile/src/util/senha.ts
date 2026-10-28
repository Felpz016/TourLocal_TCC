// Mesma regra de senha forte da API (api/app/core/senha.py): 8 caracteres ou mais, com
// letra maiúscula, letra minúscula e um caractere especial. O app confere antes de enviar
// para mostrar o que falta enquanto a pessoa digita; quem decide de verdade é a API.
export const REQUISITOS_SENHA = [
  { texto: 'Pelo menos 8 caracteres', atende: (s: string) => s.length >= 8 },
  { texto: 'Uma letra maiúscula', atende: (s: string) => /\p{Lu}/u.test(s) },
  { texto: 'Uma letra minúscula', atende: (s: string) => /\p{Ll}/u.test(s) },
  {
    texto: 'Um caractere especial (! @ # - …)',
    // Qualquer coisa que não seja letra, número ou espaço.
    atende: (s: string) => /[^\p{L}\p{N}\s]/u.test(s),
  },
];

export const senhaForte = (senha: string) => REQUISITOS_SENHA.every((r) => r.atende(senha));
