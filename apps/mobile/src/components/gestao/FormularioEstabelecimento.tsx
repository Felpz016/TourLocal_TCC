import * as Location from 'expo-location';
import { useEffect, useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';

import { ApiError } from '../../api/client';
import type { Detalhe } from '../../api/estabelecimentos';
import type { EstabelecimentoIn } from '../../api/gestao';
import { geocodificar } from '../../api/localizacao';
import { buscarCategorias } from '../../api/recomendacoes';
import type { Categoria, Eixo } from '../../api/recomendacoes';
import type { FaixaPreco } from '../../api/tipos';
import { cores } from '../../theme/cores';
import { Mapa } from '../Mapa';
import { Aviso } from '../ui/Aviso';
import { Botao } from '../ui/Botao';
import { Campo } from '../ui/Campo';
import { Opcao } from '../ui/Opcao';
import { Secao } from '../ui/Secao';
import { EditorHorarios, horariosIniciais, paraApi } from './EditorHorarios';

const EIXOS: { valor: Eixo; rotulo: string }[] = [
  { valor: 'comer', rotulo: 'Onde comer' },
  { valor: 'ficar', rotulo: 'Onde ficar' },
  { valor: 'fazer', rotulo: 'O que fazer' },
];
const PRECOS: { valor: FaixaPreco; rotulo: string }[] = [
  { valor: 'economico', rotulo: '$ Econômico' },
  { valor: 'moderado', rotulo: '$$ Moderado' },
  { valor: 'alto', rotulo: '$$$ Alto' },
];
const DIETAS = [
  { valor: 'vegetariano', rotulo: 'Vegetariano' },
  { valor: 'vegano', rotulo: 'Vegano' },
  { valor: 'sem_gluten', rotulo: 'Sem glúten' },
  { valor: 'sem_lactose', rotulo: 'Sem lactose' },
];

type Props = {
  inicial?: Detalhe;
  tituloBotao: string;
  onSalvar: (dados: EstabelecimentoIn) => Promise<void>;
};

const alternar = <T,>(lista: T[], valor: T) =>
  lista.includes(valor) ? lista.filter((v) => v !== valor) : [...lista, valor];

// Cadastro e edição do estabelecimento pelo comerciante (UC10 e UC11, RF15 e RF16).
export function FormularioEstabelecimento({ inicial, tituloBotao, onSalvar }: Props) {
  const [nome, setNome] = useState(inicial?.nome ?? '');
  const [descricao, setDescricao] = useState(inicial?.descricao ?? '');
  const [endereco, setEndereco] = useState(inicial?.endereco ?? '');
  const [coordenadas, setCoordenadas] = useState(
    inicial ? { latitude: inicial.latitude, longitude: inicial.longitude } : null,
  );
  const [eixo, setEixo] = useState<Eixo>(inicial?.eixo ?? 'comer');
  const [categoriasDoEixo, setCategoriasDoEixo] = useState<Categoria[]>([]);
  const [categorias, setCategorias] = useState<string[]>(inicial?.categorias ?? []);
  const [faixa, setFaixa] = useState<FaixaPreco | null>(inicial?.faixa_preco ?? null);
  const [acessivel, setAcessivel] = useState(inicial?.acessibilidade ?? false);
  const [dietas, setDietas] = useState<string[]>(inicial?.opcoes_alimentares ?? []);
  const [telefone, setTelefone] = useState(inicial?.telefone ?? '');
  const [site, setSite] = useState(inicial?.site ?? '');
  const [dias, setDias] = useState(horariosIniciais(inicial?.horarios));
  const [fechado, setFechado] = useState(inicial?.fechado_temporariamente ?? false);
  const [localizando, setLocalizando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    buscarCategorias(eixo)
      .then(setCategoriasDoEixo)
      .catch(() => setCategoriasDoEixo([]));
  }, [eixo]);

  function trocarEixo(novo: Eixo) {
    setEixo(novo);
    setCategorias([]); // categorias de eixos diferentes não se misturam
  }

  async function localizarEndereco() {
    setLocalizando(true);
    setErro(null);
    try {
      const r = await geocodificar(endereco);
      setCoordenadas({ latitude: r.latitude, longitude: r.longitude });
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : 'Endereço não encontrado.');
    } finally {
      setLocalizando(false);
    }
  }

  async function usarPosicaoAtual() {
    setLocalizando(true);
    setErro(null);
    try {
      const permissao = await Location.requestForegroundPermissionsAsync();
      if (permissao.status !== 'granted') {
        setErro('Sem permissão de localização. Informe o endereço e toque em "Localizar".');
        return;
      }
      const { coords } = await Location.getCurrentPositionAsync({});
      setCoordenadas({ latitude: coords.latitude, longitude: coords.longitude });
    } catch {
      setErro('Não foi possível obter a posição atual.');
    } finally {
      setLocalizando(false);
    }
  }

  async function salvar() {
    const { horarios, erro: erroHorario } = paraApi(dias);
    const problema =
      (nome.trim().length < 2 && 'Informe o nome do local.') ||
      (endereco.trim().length < 3 && 'Informe o endereço.') ||
      (!coordenadas && 'Marque o local no mapa: toque em "Localizar" ou use a posição atual.') ||
      (categorias.length === 0 && 'Escolha ao menos uma categoria.') ||
      erroHorario;
    if (problema) {
      setErro(problema);
      return;
    }
    setSalvando(true);
    setErro(null);
    try {
      await onSalvar({
        nome,
        descricao,
        endereco,
        latitude: coordenadas!.latitude,
        longitude: coordenadas!.longitude,
        categorias,
        faixa_preco: faixa,
        acessibilidade: acessivel,
        opcoes_alimentares: eixo === 'comer' ? dietas : [],
        telefone,
        site,
        horarios,
        fechado_temporariamente: fechado,
      });
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : 'Não foi possível salvar.');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <View style={styles.formulario}>
      <Campo rotulo="Nome do local" value={nome} onChangeText={setNome} maxLength={150} />
      <Campo
        rotulo="Descrição"
        value={descricao}
        onChangeText={setDescricao}
        multiline
        maxLength={2000}
        style={{ minHeight: 90, textAlignVertical: 'top' }}
      />

      <Secao titulo="Endereço e posição no mapa">
        <Campo rotulo="Endereço" value={endereco} onChangeText={setEndereco} maxLength={255} />
        <View style={styles.botoesLinha}>
          <Botao
            titulo="Localizar endereço"
            variante="link"
            onPress={localizarEndereco}
            carregando={localizando}
          />
          <Botao titulo="Usar minha posição atual" variante="link" onPress={usarPosicaoAtual} />
        </View>
        {coordenadas ? (
          <Mapa posicao={{ ...coordenadas, origem: 'manual', endereco }} />
        ) : (
          <Text style={styles.dica}>O local ainda não foi marcado no mapa.</Text>
        )}
      </Secao>

      <Secao titulo="Tipo de local" linha>
        {EIXOS.map((e) => (
          <Opcao
            key={e.valor}
            rotulo={e.rotulo}
            selecionada={eixo === e.valor}
            onPress={() => trocarEixo(e.valor)}
          />
        ))}
      </Secao>
      <Secao titulo="Categorias" dica="Escolha até 3." linha>
        {categoriasDoEixo.map((c) => (
          <Opcao
            key={c.nome}
            rotulo={c.nome}
            selecionada={categorias.includes(c.nome)}
            onPress={() =>
              setCategorias((atual) =>
                atual.includes(c.nome) || atual.length < 3 ? alternar(atual, c.nome) : atual,
              )
            }
          />
        ))}
      </Secao>

      <Secao titulo="Faixa de preço" linha>
        {PRECOS.map((p) => (
          <Opcao
            key={p.valor}
            rotulo={p.rotulo}
            selecionada={faixa === p.valor}
            onPress={() => setFaixa(faixa === p.valor ? null : p.valor)}
          />
        ))}
      </Secao>

      {eixo === 'comer' ? (
        <Secao titulo="Opções no cardápio" linha>
          {DIETAS.map((d) => (
            <Opcao
              key={d.valor}
              rotulo={d.rotulo}
              selecionada={dietas.includes(d.valor)}
              onPress={() => setDietas(alternar(dietas, d.valor))}
            />
          ))}
        </Secao>
      ) : null}

      <View style={styles.interruptor}>
        <Text style={styles.rotulo}>Acessível para cadeira de rodas</Text>
        <Switch
          value={acessivel}
          onValueChange={setAcessivel}
          accessibilityLabel="Acessível para cadeira de rodas"
          trackColor={{ true: cores.primaria }}
        />
      </View>

      <Secao titulo="Contato">
        <Campo
          rotulo="Telefone"
          value={telefone}
          onChangeText={setTelefone}
          inputMode="tel"
          maxLength={40}
        />
        <Campo
          rotulo="Site ou rede social"
          value={site}
          onChangeText={setSite}
          inputMode="url"
          autoCapitalize="none"
          maxLength={255}
        />
      </Secao>

      <Secao titulo="Horário de funcionamento">
        <EditorHorarios dias={dias} onChange={setDias} />
      </Secao>

      <View style={styles.interruptor}>
        <View style={{ flex: 1 }}>
          <Text style={styles.rotulo}>Fechado temporariamente</Text>
          <Text style={styles.dica}>Enquanto ativo, o local não aparece nas recomendações.</Text>
        </View>
        <Switch
          value={fechado}
          onValueChange={setFechado}
          accessibilityLabel="Fechado temporariamente"
          trackColor={{ true: cores.erro }}
        />
      </View>

      <Aviso texto={erro} />
      <Botao titulo={tituloBotao} onPress={salvar} carregando={salvando} />
    </View>
  );
}

const styles = StyleSheet.create({
  formulario: { gap: 20 },
  botoesLinha: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  dica: { fontSize: 14, color: cores.textoSecundario },
  rotulo: { fontSize: 16, fontWeight: '600', color: cores.texto },
  interruptor: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
});
