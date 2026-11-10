// Acrescenta ao app.json o caminho base da versão web quando ela é publicada numa subpasta,
// como no GitHub Pages (https://<usuario>.github.io/TourLocal_TCC/). Sem EXPO_BASE_URL,
// vale o app.json como está.
module.exports = ({ config }) =>
  process.env.EXPO_BASE_URL
    ? { ...config, experiments: { ...config.experiments, baseUrl: process.env.EXPO_BASE_URL } }
    : config;
