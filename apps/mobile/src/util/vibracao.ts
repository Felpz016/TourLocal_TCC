import * as Haptics from 'expo-haptics';

// Vibração curta do Taptic Engine, uma por ação e sempre junto de uma mudança na tela:
// muita gente desliga a vibração, então ela nunca é o único aviso. Falhas são ignoradas
// (aparelhos sem motor de vibração, navegador sem suporte).
const ignorar = () => {};

export const vibrar = {
  /** Escolher uma opção numa lista de chips. */
  selecao: () => Haptics.selectionAsync().catch(ignorar),
  /** Uma ação leve que se concretiza, como salvar um local. */
  toque: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(ignorar),
  /** A operação deu certo (avaliação publicada, alterações salvas). */
  sucesso: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(ignorar),
  /** A operação falhou e a mensagem de erro aparece na tela. */
  erro: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(ignorar),
};
