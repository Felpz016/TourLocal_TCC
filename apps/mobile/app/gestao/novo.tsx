import { router } from 'expo-router';
import { ScrollView, StyleSheet } from 'react-native';

import { cadastrar } from '../../src/api/gestao';
import { Aviso } from '../../src/components/ui/Aviso';
import { FormularioEstabelecimento } from '../../src/components/gestao/FormularioEstabelecimento';
import { cores } from '../../src/theme/cores';
import { estilosLargura } from '../../src/theme/layout';

// Cadastro de estabelecimento (UC10, RF15). Depois de salvar, abre a edição para as fotos.
export default function NovoLocalTela() {
  return (
    <ScrollView contentContainerStyle={[styles.conteudo, estilosLargura.conteudo]}>
      <Aviso
        tipo="alerta"
        texto="O cadastro passa por uma verificação antes de aparecer para os turistas."
      />
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
  conteudo: { padding: 20, gap: 16, paddingBottom: 48, backgroundColor: cores.fundo },
});
