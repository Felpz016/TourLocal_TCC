import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { ActivityIndicator, Image, Text, View } from 'react-native';

import { ApiError } from '../../api/client';
import { enviarFoto, removerFoto, urlFoto } from '../../api/gestao';
import { cores } from '../../theme/cores';
import { curva, raio } from '../../theme/estilo';
import { tamanho } from '../../theme/fontes';
import { Aviso } from '../ui/Aviso';
import { Icone } from '../ui/Icone';
import { Pressionavel } from '../ui/Pressionavel';
import { criarEstilos } from '../../theme/tema';

type Foto = { id_foto: number; url: string };
type Props = { idEstab: number; fotos: Foto[]; aoMudar: () => void };

// Envio de imagens (RF17). A API recusa arquivos acima de 5 MB ou fora de JPG/PNG/WebP.
export function GaleriaFotos({ idEstab, fotos, aoMudar }: Props) {
  const styles = useEstilos();
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function escolher() {
    setErro(null);
    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8, // comprime um pouco para caber no limite e economizar dados
    });
    if (resultado.canceled) return;
    setEnviando(true);
    try {
      await enviarFoto(idEstab, resultado.assets[0]);
      aoMudar();
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : 'Não foi possível enviar a foto.');
    } finally {
      setEnviando(false);
    }
  }

  async function remover(idFoto: number) {
    try {
      await removerFoto(idFoto);
      aoMudar();
    } catch {
      setErro('Não foi possível remover a foto.');
    }
  }

  return (
    <View style={styles.galeria}>
      <View style={styles.grade}>
        {fotos.map((f) => (
          <View key={f.id_foto}>
            <Image
              source={{ uri: urlFoto(f.url) }}
              style={styles.foto}
              accessibilityLabel="Foto do local"
            />
            <Pressionavel
              onPress={() => remover(f.id_foto)}
              accessibilityRole="button"
              accessibilityLabel="Remover foto"
              hitSlop={10}
              style={styles.remover}
            >
              <Icone nome="close" tamanho={14} cor={cores.textoSobreTinta} />
            </Pressionavel>
          </View>
        ))}
        {fotos.length < 10 ? (
          <Pressionavel
            onPress={escolher}
            disabled={enviando}
            accessibilityRole="button"
            accessibilityLabel="Adicionar foto"
            style={({ pressed }) => [styles.adicionar, pressed && { opacity: 0.7 }]}
          >
            {enviando ? (
              <ActivityIndicator color={cores.primaria} />
            ) : (
              <>
                <Icone nome="add" tamanho={26} cor={cores.primaria} />
                <Text style={styles.textoAdicionar}>Adicionar</Text>
              </>
            )}
          </Pressionavel>
        ) : null}
      </View>
      {fotos.length === 0 ? (
        <Text style={styles.dica}>Nenhuma foto ainda. Locais com foto chamam mais atenção.</Text>
      ) : null}
      <Aviso texto={erro} />
    </View>
  );
}

const useEstilos = criarEstilos(() => ({
  galeria: { gap: 10 },
  grade: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  foto: {
    width: 96,
    height: 96,
    borderRadius: raio.bloco,
    ...curva,
    backgroundColor: cores.fundoCampo,
  },
  remover: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 26,
    height: 26,
    borderRadius: raio.pilula,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(11, 27, 58, 0.75)',
  },
  adicionar: {
    width: 96,
    height: 96,
    borderRadius: raio.bloco,
    ...curva,
    gap: 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: cores.primaria,
    backgroundColor: cores.fundoDestaque,
  },
  textoAdicionar: { fontSize: tamanho.apoio, fontWeight: '700', color: cores.primaria },
  dica: { fontSize: tamanho.rotulo, color: cores.textoSecundario },
}));
