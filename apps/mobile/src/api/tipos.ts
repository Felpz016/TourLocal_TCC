// Tipos espelhados dos schemas da API (api/app/schemas).

export type TipoUsuario = 'turista' | 'comerciante' | 'administrador';
export type FaixaPreco = 'economico' | 'moderado' | 'alto';

export type Usuario = {
  id_usuario: number;
  nome: string;
  email: string;
  tipo: TipoUsuario;
  criado_em: string;
};

export type Perfil = {
  faixa_orcamento: FaixaPreco | null;
  restricoes_alimentares: string[];
  necessita_acessibilidade: boolean;
  tempo_disponivel_min: number | null;
  raio_busca_km: string;
};
