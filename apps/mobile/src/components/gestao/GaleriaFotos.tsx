import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ApiError } from '../../api/client';
import { enviarFoto, removerFoto, urlFoto } from '../../api/gestao';
import { cores } from '../../theme/cores';
import { Aviso } from '../ui/Aviso';
import { Botao } from '../ui/Botao';

type Foto = { id_foto: number; url: string };
type Props = { idEstab: number; fotos: Foto[]; aoMudar: () => void };

// Envio de imagens (RF17). A API recusa arquivos acima de 5 MB ou fora de JPG/PNG/WebP.
export function GaleriaFotos({ idEstab, fotos, aoMudar }: Props) {
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
      {fotos.length > 0 ? (
        <ScrollView horizontal contentContainerStyle={styles.lista}>
          {fotos.map((f) => (
            <View key={f.id_foto}>
              <Image
                source={{ uri: urlFoto(f.url) }}
                style={styles.foto}
                accessibilityLabel="Foto do local"
              />
              <Pressable onPress={() => remover(f.id_foto)} accessibilityRole="button" hitSlop={8}>
                <Text style={styles.remover}>Remover</Text>
              </Pressable>
            </View>
          ))}
        </ScrollView>
      ) : (
        <Text style={styles.dica}>Nenhuma foto ainda. Locais com foto chamam mais atenção.</Text>
      )}
      <Aviso texto={erro} />
      <Botao titulo="Adicionar foto" variante="link" onPress={escolher} carregando={enviando} />
    </View>
  );
}

const styles = StyleSheet.create({
  galeria: { gap: 8 },
  lista: { gap: 8 },
  foto: { width: 140, height: 100, borderRadius: 10, backgroundColor: cores.fundoCampo },
  remover: { color: cores.erro, fontSize: 14, fontWeight: '600', paddingVertical: 6 },
  dica: { fontSize: 14, color: cores.textoSecundario },
});
