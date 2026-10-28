import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';

import { buscarDetalhe } from '../../src/api/estabelecimentos';
import type { Detalhe } from '../../src/api/estabelecimentos';
import { atualizar } from '../../src/api/gestao';
import { FormularioEstabelecimento } from '../../src/components/gestao/FormularioEstabelecimento';
import { GaleriaFotos } from '../../src/components/gestao/GaleriaFotos';
import { Aviso } from '../../src/components/ui/Aviso';
import { Botao } from '../../src/components/ui/Botao';
import { Secao } from '../../src/components/ui/Secao';
import { cores } from '../../src/theme/cores';
import { estilosLargura } from '../../src/theme/layout';

// Edição pelo dono ou pelo administrador (UC11, RF16, RN07) e envio de fotos (RF17).
export default function EditarLocalTela() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const idEstab = Number(id);
  const [lugar, setLugar] = useState<Detalhe | null>(null);
  const [aviso, setAviso] = useState<{ texto: string; tipo: 'erro' | 'sucesso' } | null>(null);
  // Muda a cada salvamento para o formulário recomeçar com os dados gravados.
  const [versao, setVersao] = useState(0);

  const carregar = useCallback(async () => {
    try {
      setLugar(await buscarDetalhe(idEstab));
    } catch {
      setAviso({ texto: 'Não foi possível carregar o local.', tipo: 'erro' });
    }
  }, [idEstab]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  if (!lugar) {
    return (
      <View style={styles.centro}>
        {aviso ? <Aviso texto={aviso.texto} /> : <ActivityIndicator color={cores.primaria} />}
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={[styles.conteudo, estilosLargura.conteudo]}>
      {!lugar.verificado ? (
        <Aviso
          tipo="alerta"
          texto="Aguardando verificação. Você já pode completar os dados e enviar fotos; avisamos quando o local for aprovado."
        />
      ) : null}
      <Botao
        titulo="Ver como o turista vê"
        icone="eye-outline"
        variante="secundario"
        onPress={() => router.push(`/lugar/${idEstab}`)}
      />

      <Secao
        titulo="Fotos"
        icone="images-outline"
        dica="JPG, PNG ou WebP, até 5 MB cada (máximo 10)."
      >
        <GaleriaFotos idEstab={idEstab} fotos={lugar.fotos} aoMudar={carregar} />
      </Secao>

      <Aviso texto={aviso?.texto ?? null} tipo={aviso?.tipo} />
      <FormularioEstabelecimento
        key={versao}
        inicial={lugar}
        tituloBotao="Salvar alterações"
        onSalvar={async (dados) => {
          const r = await atualizar(idEstab, dados);
          setAviso({
            tipo: 'sucesso',
            texto:
              lugar.verificado && !r.verificado
                ? 'Alterações salvas. Como o nome ou o endereço mudou, o local volta para verificação.'
                : 'Alterações salvas.',
          });
          await carregar();
          setVersao((v) => v + 1);
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  conteudo: { padding: 20, gap: 16, paddingBottom: 48 },
});
