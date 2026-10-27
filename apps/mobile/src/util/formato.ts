export const PRECO = { economico: '$', moderado: '$$', alto: '$$$' } as const;

export function formatarDistancia(km: number) {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1).replace('.', ',')} km`;
}

export function formatarNota(nota: number) {
  return nota.toFixed(1).replace('.', ',');
}
