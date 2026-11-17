// Campos de hora (HH:MM) do horário de funcionamento.
// O teclado numérico do iPhone não tem ":", então o app coloca os dois-pontos sozinho:
// o comerciante digita só os números ("0830") e vê "08:30".

/** Formata enquanto digita: só números, no máximo 4, com ":" depois da hora. */
export function mascararHora(texto: string): string {
  let digitos = texto.replace(/\D/g, '').slice(0, 4);
  // Hora começando por 3 a 9 só pode ter um dígito: "8" vira "08".
  if (/^[3-9]/.test(digitos)) digitos = `0${digitos}`.slice(0, 4);
  return digitos.length > 2 ? `${digitos.slice(0, 2)}:${digitos.slice(2)}` : digitos;
}

/** Completa o que ficou na tela ao sair do campo: "9" → "09:00", "08:3" → "08:30". */
export function completarHora(texto: string): string {
  const digitos = texto.replace(/\D/g, '');
  if (digitos.length === 0 || digitos.length > 4) return texto;
  if (digitos.length <= 2) return `${digitos.padStart(2, '0')}:00`;
  // Com 3 dígitos a tela mostra "08:3": completa o minuto com zero, como se vê.
  const quatro = digitos.padEnd(4, '0');
  return `${quatro.slice(0, 2)}:${quatro.slice(2)}`;
}

const HORA = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Hora válida no formato da API (HH:MM), aceitando o que ainda não foi completado. */
export function horaValida(texto: string): string | null {
  const completa = completarHora(texto);
  return HORA.test(completa) ? completa : null;
}
