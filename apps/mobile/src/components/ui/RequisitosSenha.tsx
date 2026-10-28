import { StyleSheet, Text, View } from 'react-native';

import { cores } from '../../theme/cores';
import { tamanho } from '../../theme/fontes';
import { REQUISITOS_SENHA } from '../../util/senha';
import { Icone } from './Icone';

/** Lista os requisitos da senha embaixo do campo e marca cada um conforme a pessoa digita. */
export function RequisitosSenha({ senha }: { senha: string }) {
  return (
    <View style={styles.lista}>
      {REQUISITOS_SENHA.map((r) => {
        const ok = r.atende(senha);
        return (
          <View
            key={r.texto}
            style={styles.item}
            accessible
            accessibilityLabel={`${r.texto}: ${ok ? 'atendido' : 'falta'}`}
          >
            <Icone
              nome={ok ? 'checkmark-circle' : 'ellipse-outline'}
              tamanho={16}
              cor={ok ? cores.sucesso : cores.textoSecundario}
            />
            <Text style={[styles.texto, ok && { color: cores.sucesso }]}>{r.texto}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  lista: { gap: 4, marginTop: -8 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  texto: { fontSize: tamanho.apoio, color: cores.textoSecundario },
});
