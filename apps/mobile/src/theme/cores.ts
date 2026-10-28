// Paleta azul com contraste suficiente para texto (RNF11): branco sobre `primaria`
// fica acima de 4,5:1, e `textoSecundario` também passa sobre fundo branco.
export const cores = {
  primaria: '#2563EB',
  primariaEscura: '#1E3A8A',
  primariaTexto: '#FFFFFF',
  texto: '#0F172A',
  textoSecundario: '#64748B',
  // Borda de campos e chips (3:1 sobre branco); `divisoria` é só para separar cartões.
  borda: '#CBD5E1',
  divisoria: '#E2E8F0',
  erro: '#DC2626',
  fundoErro: '#FEECEC',
  alerta: '#92400E',
  fundoAlerta: '#FFF6E5',
  // Fundo das telas; cartões e campos ficam em `superficie` por cima dele.
  fundo: '#F4F7FB',
  superficie: '#FFFFFF',
  fundoCampo: '#F8FAFC',
  // Âmbar escuro: as estrelas também precisam de contraste sobre o fundo branco.
  estrela: '#B45309',
  favorito: '#E11D48',
  fundoDestaque: '#EAF2FF',
};

// Degradê do topo das telas principais, do azul-marinho ao azul claro.
export const degrade = ['#1E3A8A', '#2563EB', '#3B82F6'] as const;
