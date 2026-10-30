// Armazenamento local falso para os testes (o real só existe no celular e no navegador).
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
