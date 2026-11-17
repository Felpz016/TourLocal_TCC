import { Switch, Text, TextInput, View } from 'react-native';

import type { HorarioIn } from '../../api/gestao';
import { cores } from '../../theme/cores';
import { curva, raio } from '../../theme/estilo';
import { tamanho } from '../../theme/fontes';
import { criarEstilos } from '../../theme/tema';
import { completarHora, horaValida, mascararHora } from '../../util/hora';

const DIAS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

export type HorarioDia = { aberto: boolean; abre: string; fecha: string };

export function horariosIniciais(horarios: HorarioIn[] = []): HorarioDia[] {
  return DIAS.map((_, dia) => {
    const h = horarios.find((x) => x.dia_semana === dia);
    return h
      ? { aberto: true, abre: h.hora_abertura.slice(0, 5), fecha: h.hora_fechamento.slice(0, 5) }
      : { aberto: false, abre: '09:00', fecha: '18:00' };
  });
}

/** Converte para a API; devolve o nome do primeiro dia com hora inválida, se houver. */
export function paraApi(dias: HorarioDia[]): { horarios: HorarioIn[]; erro: string | null } {
  const horarios: HorarioIn[] = [];
  for (const [dia, h] of dias.entries()) {
    if (!h.aberto) continue;
    const abre = horaValida(h.abre);
    const fecha = horaValida(h.fecha);
    if (!abre || !fecha) {
      return { horarios: [], erro: `Confira o horário de ${DIAS[dia].toLowerCase()} (use HH:MM).` };
    }
    horarios.push({ dia_semana: dia, hora_abertura: abre, hora_fechamento: fecha });
  }
  return { horarios, erro: null };
}

const DICA = 'Digite só os números, por exemplo 0830 para 08:30.';

type Props = { dias: HorarioDia[]; onChange: (dias: HorarioDia[]) => void };

// Um horário por dia; fechamento menor que a abertura significa que passa da meia-noite.
export function EditorHorarios({ dias, onChange }: Props) {
  const styles = useEstilos();
  const mudar = (indice: number, parcial: Partial<HorarioDia>) =>
    onChange(dias.map((d, i) => (i === indice ? { ...d, ...parcial } : d)));

  return (
    <View style={styles.lista}>
      {dias.map((d, i) => (
        <View key={DIAS[i]} style={styles.linha}>
          <Switch
            value={d.aberto}
            onValueChange={(aberto) => mudar(i, { aberto })}
            accessibilityLabel={`Abre ${DIAS[i].toLowerCase()}`}
            trackColor={{ true: cores.primaria }}
          />
          <Text style={styles.dia}>{DIAS[i]}</Text>
          {d.aberto ? (
            <>
              <TextInput
                value={d.abre}
                onChangeText={(texto) => mudar(i, { abre: mascararHora(texto) })}
                onBlur={() => mudar(i, { abre: completarHora(d.abre) })}
                style={styles.hora}
                maxLength={5}
                inputMode="numeric"
                placeholder="HH:MM"
                placeholderTextColor={cores.textoSecundario}
                accessibilityLabel={`${DIAS[i]}: abre às`}
                accessibilityHint={DICA}
              />
              <Text style={styles.ate}>às</Text>
              <TextInput
                value={d.fecha}
                onChangeText={(texto) => mudar(i, { fecha: mascararHora(texto) })}
                onBlur={() => mudar(i, { fecha: completarHora(d.fecha) })}
                style={styles.hora}
                maxLength={5}
                inputMode="numeric"
                placeholder="HH:MM"
                placeholderTextColor={cores.textoSecundario}
                accessibilityLabel={`${DIAS[i]}: fecha às`}
                accessibilityHint={DICA}
              />
            </>
          ) : (
            <Text style={styles.fechado}>Fechado</Text>
          )}
        </View>
      ))}
    </View>
  );
}

const useEstilos = criarEstilos(() => ({
  lista: { gap: 6 },
  linha: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 48 },
  dia: { width: 72, fontSize: tamanho.corpo, color: cores.texto, fontWeight: '600' },
  hora: {
    width: 70,
    borderWidth: 1,
    borderColor: cores.borda,
    borderRadius: raio.selo,
    ...curva,
    paddingVertical: 8,
    textAlign: 'center',
    fontSize: tamanho.corpo,
    color: cores.texto,
    backgroundColor: cores.fundoCampo,
  },
  ate: { fontSize: tamanho.corpo, color: cores.textoSecundario },
  fechado: { fontSize: tamanho.corpo, color: cores.textoSecundario },
}));
