import { useEffect, useState } from 'react';
import { TextInput, View } from 'react-native';

import { cores } from '../theme/cores';
import { curva, raio, semContornoWeb } from '../theme/estilo';
import { tamanho } from '../theme/fontes';
import { criarEstilos } from '../theme/tema';
import { Icone } from './ui/Icone';
import { Pressionavel } from './ui/Pressionavel';

type Props = {
  valor: string;
  /** Chamado só quando a pessoa para de digitar, para não buscar a cada letra. */
  onBuscar: (texto: string) => void;
  placeholder: string;
};

const ESPERA_MS = 350;

// Busca por nome, no topo da lista de cada eixo, como a barra de busca do Apple Maps.
export function CampoBusca({ valor, onBuscar, placeholder }: Props) {
  const styles = useEstilos();
  const [texto, setTexto] = useState(valor);
  const [focado, setFocado] = useState(false);

  // Se a busca for limpa de fora (ex.: "Limpar busca"), o campo acompanha.
  useEffect(() => setTexto(valor), [valor]);

  useEffect(() => {
    if (texto.trim() === valor.trim()) return;
    const espera = setTimeout(() => onBuscar(texto.trim()), ESPERA_MS);
    return () => clearTimeout(espera);
  }, [texto, valor, onBuscar]);

  return (
    <View style={[styles.caixa, focado && styles.caixaFocada]}>
      <Icone nome="search" tamanho={18} cor={focado ? cores.primaria : cores.textoSecundario} />
      <TextInput
        value={texto}
        onChangeText={setTexto}
        onSubmitEditing={() => onBuscar(texto.trim())}
        onFocus={() => setFocado(true)}
        onBlur={() => setFocado(false)}
        placeholder={placeholder}
        placeholderTextColor={cores.textoSecundario}
        accessibilityLabel="Buscar por nome"
        accessibilityHint="Procura no nome, na categoria e no endereço dos lugares"
        returnKeyType="search"
        autoCorrect={false}
        clearButtonMode="never"
        maxLength={60}
        style={styles.entrada}
      />
      {texto ? (
        <Pressionavel
          onPress={() => {
            setTexto('');
            onBuscar('');
          }}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Limpar busca"
        >
          <Icone nome="close-circle" tamanho={18} cor={cores.textoSecundario} />
        </Pressionavel>
      ) : null}
    </View>
  );
}

const useEstilos = criarEstilos(() => ({
  caixa: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 44,
    paddingHorizontal: 12,
    borderRadius: raio.campo,
    ...curva,
    backgroundColor: cores.fundoCampo,
    borderWidth: 1,
    borderColor: cores.divisoria,
  },
  // Foco como nos campos do app: borda azul (na web, sem o contorno padrão do navegador).
  caixaFocada: { borderColor: cores.primaria, backgroundColor: cores.superficie },
  entrada: {
    flex: 1,
    height: '100%',
    fontSize: tamanho.corpo,
    color: cores.texto,
    ...semContornoWeb,
  },
}));
