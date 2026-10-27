import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text } from 'react-native';

import { cadastrar } from '../../src/api/gestao';
import { FormularioEstabelecimento } from '../../src/components/gestao/FormularioEstabelecimento';
import { cores } from '../../src/theme/cores';
import { estilosLargura } from '../../src/theme/layout';

// Cadastro de estabelecimento (UC10, RF15). Depois de salvar, abre a edição para as fotos.
export default function NovoLocalTela() {
  return (
    <ScrollView contentContainerStyle={[styles.conteudo, estilosLargura.conteudo]}>
      <Text style={styles.aviso}>
        O cadastro passa por uma verificação antes de aparecer para os turistas.
      </Text>
      <FormularioEstabelecimento
        tituloBotao="Enviar para verificação"
        onSalvar={async (dados) => {
          const { id_estab } = await cadastrar(dados);
          router.replace(`/gestao/${id_estab}`);
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  conteudo: { padding: 16, gap: 16, backgroundColor: cores.fundo },
  aviso: { fontSize: 15, color: cores.textoSecundario },
});
