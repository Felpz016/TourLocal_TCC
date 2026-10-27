// Endereço da API FastAPI. No celular físico, troque localhost pelo IP do computador
// (ex.: EXPO_PUBLIC_API_URL=http://192.168.0.10:8000 no arquivo .env).
export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000';

export async function verificarApi(): Promise<boolean> {
  try {
    const resposta = await fetch(`${API_URL}/health`);
    return resposta.ok;
  } catch {
    return false;
  }
}
