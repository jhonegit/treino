/* =============================================================
   APP DE TREINO, protótipo 1: só o painel do treino.

   Como este arquivo está organizado (títulos em maiúsculas):
     1. GUARDAR E LER   grava e recupera do celular
     2. ESTADO          o que o app tem na cabeça agora
     3. CONSULTAS       perguntas sobre os dados
     4. REGRAS          progressão dupla e afins, decididas por nós
     5. AÇÕES           o que acontece quando você toca em algo
     6. CRONÔMETRO
     7. IMAGENS         o desenho de cada exercício
     8. DESENHO         transforma o estado em tela
     9. TOQUES          liga os botões às ações
    10. INÍCIO

   Convenção dos comentários:
     [nativo]    função que já vem no JavaScript
     [navegador] recurso do navegador, não da linguagem
     as demais funções fomos nós que escrevemos.
   Nenhuma biblioteca externa. Nada aqui pede internet.

   Regra de casa: NENHUM pop up. Nada de alert, confirm ou prompt.
   Confirmação vira faixa marrom dentro da tela, digitar vira campo
   dentro do cartão, recado vira faixa no pé.
   ============================================================= */


/* =============================================================
   1. GUARDAR E LER
   ============================================================= */

/* localStorage [navegador]: uma gaveta de texto que o navegador
   reserva para este endereço. Sobrevive a fechar o app e desligar
   o celular. Só guarda texto, por isso o vai e vem com JSON. */

const CHAVE_BANCO  = 'treino.banco';        // catálogo + treinos já feitos
const CHAVE_SESSAO = 'treino.sessaoAtual';  // o treino de agora
const CHAVE_FOTO   = 'treino.foto.';        // uma chave por aparelho

function lerBanco() {
  const texto = localStorage.getItem(CHAVE_BANCO);
  if (!texto) {
    // primeira abertura: copia as sementes do arquivo dados-iniciais.js
    // JSON.parse e JSON.stringify [nativo] fazem uma cópia de verdade
    const novo = JSON.parse(JSON.stringify(DADOS_INICIAIS));
    localStorage.setItem(CHAVE_BANCO, JSON.stringify(novo));
    return novo;
  }
  return JSON.parse(texto);
}

function salvarBanco() {
  localStorage.setItem(CHAVE_BANCO, JSON.stringify(banco));
}

/* O banco só é copiado das sementes na PRIMEIRA abertura. Quando a
   gente acrescenta um campo novo lá (foi o caso das ilustrações),
   quem já usava o app ficaria sem ele. Esta função completa o que
   falta, sem encostar no que você já registrou. */
function completarComSementes() {
  let mudou = false;

  DADOS_INICIAIS.exercicios.forEach(semente => {
    const meu = banco.exercicios.find(e => e.id === semente.id);
    if (!meu) { banco.exercicios.push(JSON.parse(JSON.stringify(semente))); mudou = true; return; }
    // a ilustração pertence ao app, não a você: sempre segue as sementes.
    // É o que troca os desenhos antigos pelos novos sem apagar histórico.
    if (meu.ilustracao !== semente.ilustracao) { meu.ilustracao = semente.ilustracao; mudou = true; }
    if (meu.nome !== semente.nome) { meu.nome = semente.nome; mudou = true; }
    if (!!meu.emTeste !== !!semente.emTeste) { meu.emTeste = !!semente.emTeste; mudou = true; }
  });

  /* Mudança de versão dos dados. Cada número novo é uma correção que
     precisa alcançar quem já vinha usando o app.
     Versão 2 (04/09/2026): a carga passou a subir de 1 em 1 kg, porque
     as anilhas da academia não fecham de 2,5 em 2,5. */
  banco.sessoes.forEach((s, n) => {
    if (!s.id) { s.id = 's' + n + '-' + (s.data || '').replace(/-/g, ''); mudou = true; }
  });

  const versaoSalva = banco.versaoDosDados || 1;
  if (versaoSalva < 2) {
    DADOS_INICIAIS.exercicios.forEach(semente => {
      const meu = banco.exercicios.find(e => e.id === semente.id);
      if (meu) meu.incrementoKg = semente.incrementoKg;
    });
    banco.config.incrementoPadraoKg = DADOS_INICIAIS.config.incrementoPadraoKg;
    banco.versaoDosDados = 2;
    mudou = true;
  }

  /* Versão 3 (10/09/2026): cada exercício passou a ter o salto de carga real
     do aparelho, conforme o parecer do professor. A ideia de subir uma
     porcentagem foi descartada: o app tem que oferecer peso que existe na
     máquina. Smith, supino sentado e goblet vão de 2 em 2; o resto fica de 1
     em 1, e nos aparelhos de barra esse 1 quer dizer uma barra. */
  if (versaoSalva < 3) {
    DADOS_INICIAIS.exercicios.forEach(semente => {
      const meu = banco.exercicios.find(e => e.id === semente.id);
      if (meu) meu.incrementoKg = semente.incrementoKg;
    });
    banco.versaoDosDados = 3;
    mudou = true;
  }

  if (mudou) salvarBanco();
}

function lerSessaoSalva() {
  const texto = localStorage.getItem(CHAVE_SESSAO);
  return texto ? JSON.parse(texto) : null;
}

/* Grava a sessão a cada toque. Se ela ainda está zerada, não grava:
   só espiar o app não deve criar treino pendente. */
function salvarSessao() {
  if (!sessao) return;
  if (!sessaoTemRegistro(sessao)) {
    localStorage.removeItem(CHAVE_SESSAO);
    return;
  }
  sessao.atualizadaEm = new Date().toISOString();  // Date [nativo]
  localStorage.setItem(CHAVE_SESSAO, JSON.stringify(sessao));
}

function apagarSessaoSalva() {
  localStorage.removeItem(CHAVE_SESSAO);
}


/* =============================================================
   2. ESTADO
   ============================================================= */

let banco;                 // tudo que está salvo
let sessao;                // o treino em andamento
let perguntarSobrePendente = false;  // mostrar o aviso de sessão antiga?
let ultimaAcao = null;     // o que o botão Desfazer desfaz
let confirmando = null;    // pergunta de sim ou não aberta na tela
let editandoCarga = null;  // índice do exercício com o campo de carga aberto
let serieEsperandoCarga = null;  // repetição tocada antes de haver carga
let repsAmpliado = null;   // índice do exercício com a grade estendida
let historicoAberto = null;         // id do exercício com o histórico na tela
let listaAberta = false;            // lista dos treinos já registrados
let edicao = null;                  // { treinoId, escolhendo } quando editando um treino
let sessaoApagada = null;           // guardada na memória para o Desfazer
let nomeDigitado = '';              // nome do exercício novo, enquanto é escrito
let graficoModo = 'carga';          // o gráfico do histórico: 'carga' ou 'volume'
let backupParaRestaurar = null;     // arquivo lido, esperando confirmação
let estadoAntesDaRestauracao = null; // retrato para o Desfazer da restauração
let cron = null;           // cronômetro de descanso
let relogioId = null;      // identificador do setInterval do cronômetro
let desfazerId = null;     // identificador do sumiço da faixa

const RIR_MINIMO_PARA_SUBIR = 2;   // folga mínima para a sessão contar
const RIR_CARGA_LEVE        = 4;   // daqui para cima, uma sessão só já basta
const SESSOES_OLHADAS       = 5;   // quantas sessões o aviso de desconforto olha
const DESCONFORTOS_PARA_AVISAR = 3;// quantas delas com desconforto para avisar
const SESSOES_NO_TOPO       = 2;   // duas sessões seguidas
const HORAS_ATE_PERGUNTAR   = 4;   // depois disso, o app pergunta o que fazer

const REGIOES = ['joelho', 'ombro', 'cotovelo', 'quadril', 'coluna', 'punho'];
const NIVEIS  = [
  { id: 'sem',      texto: 'Sem' },
  { id: 'leve',     texto: 'Leve' },
  { id: 'moderado', texto: 'Moderado' },
  { id: 'forte',    texto: 'Forte' }
];


/* =============================================================
   3. CONSULTAS
   ============================================================= */

function acharTreino(id)      { return banco.treinos.find(t => t.id === id); }
function acharExercicio(id)   { return banco.exercicios.find(e => e.id === id); }
function acharEquipamento(id) { return banco.equipamentos.find(e => e.id === id); }

/* Data de hoje no formato 2026-09-04, no fuso do celular.
   (toISOString sozinho usaria o horário de Londres e podia errar o dia.) */
function dataLocal(d) {
  d = d || new Date();
  const dois = n => String(n).padStart(2, '0');   // padStart [nativo]
  return d.getFullYear() + '-' + dois(d.getMonth() + 1) + '-' + dois(d.getDate());
}

function dataCurta(iso) {
  const p = iso.split('-');
  return p[2] + '/' + p[1];
}

/* 30 vira "30", 32.5 vira "32,5" */
function numero(n) {
  if (n === null || n === undefined) return '?';
  return String(n).replace('.', ',');
}

/* "32,5" vira 32.5. Devolve null quando não é número. */
function paraNumero(texto) {
  const valor = parseFloat(String(texto).replace(',', '.'));  // parseFloat [nativo]
  return isNaN(valor) ? null : valor;                          // isNaN [nativo]
}

function esc(texto) {
  return String(texto).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
}

/* Qual treino vem agora: o seguinte na fila depois do último CONCLUÍDO.
   Treino encerrado como incompleto não mexe na fila. */
function proximoTreinoId() {
  const ordenados = banco.treinos.slice().sort((a, b) => a.ordem - b.ordem);
  const ultimo = banco.config.ultimoTreinoConcluido;
  if (!ultimo) return ordenados[0].id;
  const i = ordenados.findIndex(t => t.id === ultimo);
  return ordenados[(i + 1) % ordenados.length].id;
}

/* Todas as vezes que você já fez um exercício, da mais recente para a
   mais antiga. Daqui saem a linha "última vez" e a progressão. */
function execucoesDe(exercicioId) {
  const achados = [];
  banco.sessoes.forEach(s => {
    s.itens.forEach(item => {
      if (item.exercicioId === exercicioId && item.series.length > 0) {
        achados.push({ data: s.data, estado: s.estado, item: item });
      }
    });
  });
  achados.sort((a, b) => (a.data < b.data ? 1 : -1));
  return achados;
}

function cargaDoItem(item) {
  const comCarga = item.series.filter(s => typeof s.cargaKg === 'number');
  return comCarga.length ? comCarga[comCarga.length - 1].cargaKg : null;
}

function rirDoItem(item) {
  const ultima = item.series[item.series.length - 1];
  return ultima && typeof ultima.rir === 'number' ? ultima.rir : null;
}

function sessaoTemRegistro(s) {
  return s.itens.some(item =>
    item.series.length > 0 ||
    item.observacao ||
    (item.desconforto && item.desconforto.nivel)
  );
}

function seriesDaSessao(s) {
  return s.itens.reduce((soma, it) => soma + it.series.length, 0);
}

/* A sessão salva é de hoje e recente, ou é sobra de outro dia? */
function sessaoPrecisaDeDecisao(s) {
  if (s.data !== dataLocal()) return true;
  const horas = (Date.now() - new Date(s.atualizadaEm).getTime()) / 3600000;
  return horas > HORAS_ATE_PERGUNTAR;
}


/* =============================================================
   4. REGRAS
   Tudo aqui é decisão nossa, não regra médica nem verdade universal.
   ============================================================= */

/* Botões de repetição de uma faixa.
   Faixa curta (8 a 12): de um em um. Faixa longa (12 a 20): de dois
   em dois, senão viram botões demais e some a vantagem do toque único. */
function opcoesDeReps(repMin, repMax) {
  const passo = (repMax - repMin) <= 5 ? 1 : 2;
  const lista = [];
  for (let r = repMin; r <= repMax; r += passo) lista.push(r);
  if (lista[lista.length - 1] !== repMax) lista.push(repMax);
  return lista;
}

/* Grade estendida, para o dia em que sair da faixa. */
function opcoesAmpliadas(repMin, repMax) {
  const lista = [];
  for (let r = Math.max(1, repMin - 4); r <= repMax + 6; r++) lista.push(r);
  return lista;
}

/* Uma execução "fechou o topo"?
   Todas as séries no limite de cima da faixa, RIR 2 ou mais na última,
   e sem desconforto moderado ou forte. */
function fechouOTopo(item, itemDoTreino) {
  if (item.series.length < itemDoTreino.series) return false;
  const todasNoTopo = item.series.every(s => s.reps >= itemDoTreino.repMax);
  if (!todasNoTopo) return false;
  const rir = rirDoItem(item);
  if (rir === null || rir < RIR_MINIMO_PARA_SUBIR) return false;
  const nivel = item.desconforto && item.desconforto.nivel;
  if (nivel === 'moderado' || nivel === 'forte') return false;
  return true;
}

/* O salto de carga não pegou?
   Pedido do professor em 10/09/2026: se você subiu o peso e na sessão
   seguinte caiu ABAIXO do mínimo da faixa, ou apareceu desconforto, aquele
   salto ainda era cedo. Aí o certo é voltar para a carga de antes e
   construir de novo até o topo.

   Se você ficou dentro da faixa, mesmo perdendo repetição, está tudo bem:
   é esperado cair de 12 para 9 depois de subir. Não mexe. */
function saltoNaoPegou(recente, anterior, itemDoTreino) {
  if (!anterior) return false;
  const cargaNova  = cargaDoItem(recente.item);
  const cargaVelha = cargaDoItem(anterior.item);
  if (cargaNova === null || cargaVelha === null) return false;
  if (cargaNova <= cargaVelha) return false;   // não houve salto nenhum
  const caiu  = recente.item.series.some(s => s.reps < itemDoTreino.repMin);
  const nivel = recente.item.desconforto && recente.item.desconforto.nivel;
  const doeu  = nivel === 'moderado' || nivel === 'forte';
  return caiu || doeu;
}

/* Três regras de sugestão, e são as únicas. Nada aqui é conselho
   médico nem regra universal: foi o que nós dois combinamos.

   1. CARGA LEVE (caminho curto). Uma sessão só, com todas as séries no
      topo da faixa e RIR 4 ou mais, já indica que o peso está folgado
      demais. Sugere na próxima sessão, sem esperar a segunda.

   2. PROGRESSÃO DUPLA (caminho normal). Duas sessões seguidas fechando
      o topo com folga (RIR 2 ou mais) e a MESMA carga nas duas. Se a
      carga mudou no meio, a contagem recomeça.

   3. VOLTAR. O salto anterior não pegou: sugere a carga de antes. Esta
      vem primeiro, porque não adianta pensar em subir enquanto o último
      aumento ainda não assentou.

   Devolve { carga, motivo } ou null quando não há o que sugerir. */
function sugestaoDeCarga(itemDoTreino) {
  const exercicio = acharExercicio(itemDoTreino.exercicioId);
  if (exercicio.semCarga) return null;

  const ultimas = execucoesDe(itemDoTreino.exercicioId).slice(0, SESSOES_NO_TOPO);
  if (ultimas.length === 0) return null;

  const salto = exercicio.incrementoKg || banco.config.incrementoPadraoKg;
  const somar = carga => Math.round((carga + salto) * 100) / 100;   // Math.round [nativo]

  /* 0. o salto anterior não pegou: sugere voltar */
  if (ultimas.length >= 2 && saltoNaoPegou(ultimas[0], ultimas[1], itemDoTreino)) {
    return { carga: cargaDoItem(ultimas[1].item), motivo: 'voltar' };
  }

  /* 1. carga leve: basta a sessão mais recente */
  const recente = ultimas[0];
  if (fechouOTopo(recente.item, itemDoTreino)) {
    const cargaRecente = cargaDoItem(recente.item);
    if (cargaRecente !== null && rirDoItem(recente.item) >= RIR_CARGA_LEVE) {
      return { carga: somar(cargaRecente), motivo: 'leve' };
    }
  }

  /* 2. progressão dupla */
  if (ultimas.length < SESSOES_NO_TOPO) return null;
  if (!ultimas.every(e => fechouOTopo(e.item, itemDoTreino))) return null;

  const cargas = ultimas.map(e => cargaDoItem(e.item));
  if (cargas.some(c => c === null)) return null;
  if (!cargas.every(c => c === cargas[0])) return null;   // carga tem que ser a mesma

  return { carga: somar(cargas[0]), motivo: 'normal' };
}


/* =============================================================
   5. AÇÕES
   ============================================================= */

function criarSessao(treinoId) {
  const treino = acharTreino(treinoId);
  return {
    id: 's' + Date.now(),
    data: dataLocal(),
    iniciadaEm: new Date().toISOString(),
    atualizadaEm: new Date().toISOString(),
    treinoId: treinoId,
    estado: 'emAndamento',
    itemAberto: 0,
    itens: treino.itens.map(it => {
      const exercicio = acharExercicio(it.exercicioId);
      const anteriores = execucoesDe(it.exercicioId);
      // a carga já entra preenchida com a da última vez: zero toque
      const carga = anteriores.length ? cargaDoItem(anteriores[0].item) : null;
      return {
        exercicioId: it.exercicioId,
        cargaAtualKg: exercicio.semCarga ? null : carga,
        series: [],
        desconforto: { nivel: null, regioes: [] },
        observacao: '',
        concluido: false
      };
    })
  };
}

function ajustarCarga(i, delta) {
  const item = sessao.itens[i];
  const exercicio = acharExercicio(item.exercicioId);
  const base = typeof item.cargaAtualKg === 'number' ? item.cargaAtualKg : 0;
  const salto = exercicio.incrementoKg || banco.config.incrementoPadraoKg;
  item.cargaAtualKg = Math.max(0, Math.round((base + delta * salto) * 100) / 100);
  salvarSessao();
  desenhar();
}

/* Abre o campo de digitar a carga DENTRO do cartão. Sem pop up. */
function abrirCampoDeCarga(i) {
  editandoCarga = i;
  desenhar();
}

function fecharCampoDeCarga() {
  const pendente = serieEsperandoCarga;
  editandoCarga = null;
  serieEsperandoCarga = null;
  // se o campo abriu porque você tocou numa repetição, registra agora
  if (pendente && typeof sessao.itens[pendente.i].cargaAtualKg === 'number') {
    registrarSerie(pendente.i, pendente.reps);
    return;
  }
  salvarSessao();
  desenhar();
}

/* O toque mais importante do app: registrar uma série. */
function registrarSerie(i, reps) {
  const item = sessao.itens[i];
  const itemDoTreino = acharTreino(sessao.treinoId).itens[i];
  const exercicio = acharExercicio(item.exercicioId);

  // primeira vez neste exercício: o app ainda não sabe a carga.
  // em vez de pop up, abre o campo no cartão e guarda a repetição tocada.
  if (!exercicio.semCarga && typeof item.cargaAtualKg !== 'number') {
    serieEsperandoCarga = { i: i, reps: reps };
    editandoCarga = i;
    desenhar();
    mostrarFaixa('Qual a carga? Depois toque em OK', false);
    return;
  }

  const serie = { reps: reps };
  if (!exercicio.semCarga) serie.cargaKg = item.cargaAtualKg;
  item.series.push(serie);

  repsAmpliado = null;
  ultimaAcao = { tipo: 'serie', i: i };
  salvarSessao();
  iniciarDescanso(itemDoTreino.descansoSeg);
  desenhar();
  mostrarFaixa('Série ' + item.series.length + ' registrada', true);
}

function definirRir(i, valor) {
  const item = sessao.itens[i];
  if (item.series.length === 0) return;
  const ultima = item.series[item.series.length - 1];
  ultima.rir = (ultima.rir === valor) ? undefined : valor;  // tocar de novo desmarca
  salvarSessao();
  desenhar();
}

function definirDesconforto(i, nivel) {
  const item = sessao.itens[i];
  item.desconforto.nivel = (item.desconforto.nivel === nivel) ? null : nivel;
  if (item.desconforto.nivel === 'sem' || item.desconforto.nivel === null) {
    item.desconforto.regioes = [];
  }
  salvarSessao();
  desenhar();
}

function alternarRegiao(i, regiao) {
  const regioes = sessao.itens[i].desconforto.regioes;
  const pos = regioes.indexOf(regiao);
  if (pos >= 0) regioes.splice(pos, 1); else regioes.push(regiao);
  salvarSessao();
  desenhar();
}

function concluirExercicio(i) {
  sessao.itens[i].concluido = true;
  const proximo = sessao.itens.findIndex(it => !it.concluido);
  sessao.itemAberto = proximo >= 0 ? proximo : i;
  ultimaAcao = { tipo: 'concluir', i: i };
  salvarSessao();
  desenhar();
  window.scrollTo({ top: 0, behavior: 'smooth' });   // window.scrollTo [navegador]
  mostrarFaixa('Exercício concluído', true);
}

function abrirHistorico(exercicioId) {
  historicoAberto = exercicioId;
  listaAberta = false;
  desenhar();
}

function abrirEdicao(treinoId) {
  edicao = { treinoId: treinoId, escolhendo: null };
  historicoAberto = null;
  listaAberta = false;
  desenhar();
}

function abrirListaDeTreinos() {
  listaAberta = true;
  historicoAberto = null;
  desenhar();
}

function fecharHistorico() {
  historicoAberto = null;
  listaAberta = false;
  edicao = null;
  desenhar();
}

/* ---------- gráfico de evolução ----------
   Desenhado à mão em SVG, que é o desenho vetorial que o próprio
   navegador entende. Sem biblioteca nenhuma, sem internet, e o
   arquivo inteiro pesa menos que uma imagem.

   São duas leituras do mesmo histórico:
     carga  = o peso levantado naquele dia
     volume = peso x repetições somado, ou seja, o trabalho do dia */

function volumeDoItem(item) {
  return item.series.reduce(function (soma, s) {
    return soma + (typeof s.cargaKg === 'number' ? s.cargaKg * s.reps : s.reps);
  }, 0);
}

function desenharGrafico(execucoes, modo) {
  /* do mais antigo para o mais novo, no máximo 15 pontos */
  const pontos = execucoes.slice(0, 15).reverse().map(function (e) {
    return { data: e.data, valor: modo === 'volume' ? volumeDoItem(e.item) : cargaDoItem(e.item) };
  }).filter(function (p) { return typeof p.valor === 'number'; });

  if (pontos.length < 2) {
    return '<div class="grafico-vazio">O gráfico aparece a partir da segunda sessão registrada.</div>';
  }

  const valores = pontos.map(function (p) { return p.valor; });
  const maior = Math.max.apply(null, valores);
  const menor = Math.min.apply(null, valores);
  /* uma folga em cima e embaixo, para a linha não encostar na borda.
     Quando todos os valores são iguais, a folga vira 10% do próprio valor. */
  const folga = (maior - menor) ? (maior - menor) * 0.25 : (maior * 0.1 || 1);
  const alto = maior + folga, baixo = menor - folga;

  const E = 40, D = 310, T = 16, B = 104;   // as bordas do desenho
  const x = function (i) { return E + (D - E) * (i / (pontos.length - 1)); };
  const y = function (v) { return B - ((v - baixo) / (alto - baixo)) * (B - T); };

  const linha = pontos.map(function (p, i) { return x(i).toFixed(1) + ',' + y(p.valor).toFixed(1); }).join(' ');
  const bolinhas = pontos.map(function (p, i) {
    return '<circle cx="' + x(i).toFixed(1) + '" cy="' + y(p.valor).toFixed(1) + '" r="3.5" />';
  }).join('');

  const ultimo = pontos[pontos.length - 1];
  const unidade = modo === 'volume' ? '' : ' kg';

  return '<svg class="grafico" viewBox="0 0 320 126" role="img">' +
    '<line class="eixo" x1="' + E + '" y1="' + B + '" x2="' + D + '" y2="' + B + '" />' +
    '<text class="marca-eixo" x="4" y="' + (T + 4) + '">' + esc(numero(maior)) + '</text>' +
    '<text class="marca-eixo" x="4" y="' + (B + 4) + '">' + esc(numero(menor)) + '</text>' +
    '<polyline class="linha" points="' + linha + '" />' +
    bolinhas +
    '<text class="marca-eixo" x="' + E + '" y="120">' + dataCurta(pontos[0].data) + '</text>' +
    '<text class="marca-eixo fim" x="' + D + '" y="120">' + dataCurta(ultimo.data) + '</text>' +
    '<text class="valor-topo" x="' + D + '" y="' + Math.max(12, y(ultimo.valor) - 8).toFixed(1) + '">' +
      esc(numero(ultimo.valor)) + unidade + '</text>' +
  '</svg>';
}

function blocoDoGrafico(execucoes) {
  return '<div class="caixa-grafico">' +
    '<div class="abas-grafico">' +
      '<button class="btn-pequeno' + (graficoModo === 'carga' ? ' btn-laranja' : '') +
        '" data-acao="grafico-carga">Carga</button>' +
      '<button class="btn-pequeno' + (graficoModo === 'volume' ? ' btn-laranja' : '') +
        '" data-acao="grafico-volume">Volume</button>' +
    '</div>' +
    desenharGrafico(execucoes, graficoModo) +
    '<div class="legenda-grafico">' +
      (graficoModo === 'carga'
        ? 'Peso levantado em cada sessão.'
        : 'Peso vezes repetições somado em cada sessão, o trabalho do dia.') +
    '</div>' +
  '</div>';
}

/* Aviso de desconforto repetido. Regra explícita, combinada, e nada
   além disso: o app CONTA o que você registrou e mostra o número.
   Ele não diz causa, não dá nome a nada e não recomenda tratamento.

   Avisa quando, nas últimas 5 sessões daquele exercício:
     - 3 ou mais tiveram desconforto moderado ou forte; ou
     - as 2 mais recentes tiveram desconforto forte.

   Devolve { quantas, de, regioes } ou null. */
function avisoDeDesconforto(exercicioId) {
  const ultimas = execucoesDe(exercicioId).slice(0, SESSOES_OLHADAS);
  if (ultimas.length === 0) return null;

  const pesado = item => {
    const nivel = item.desconforto && item.desconforto.nivel;
    return nivel === 'moderado' || nivel === 'forte';
  };
  const forte = item => (item.desconforto && item.desconforto.nivel) === 'forte';

  const comDesconforto = ultimas.filter(e => pesado(e.item));
  const duasFortesSeguidas = ultimas.length >= 2 && forte(ultimas[0].item) && forte(ultimas[1].item);

  if (comDesconforto.length < DESCONFORTOS_PARA_AVISAR && !duasFortesSeguidas) return null;

  /* regiões anotadas, da mais repetida para a menos */
  const contagem = {};
  comDesconforto.forEach(e => {
    (e.item.desconforto.regioes || []).forEach(r => { contagem[r] = (contagem[r] || 0) + 1; });
  });
  const regioes = Object.keys(contagem).sort((a, b) => contagem[b] - contagem[a]);

  return { quantas: comDesconforto.length, de: ultimas.length, regioes: regioes };
}

/* O texto do aviso, escrito por nós, sempre o mesmo. */
function textoDoAviso(aviso) {
  return 'Você registrou desconforto moderado ou forte neste exercício em ' +
    aviso.quantas + ' das últimas ' + aviso.de +
    (aviso.de === 1 ? ' sessão.' : ' sessões.') +
    (aviso.regioes.length ? ' Região anotada: ' + aviso.regioes.join(', ') + '.' : '');
}

/* ---------- editar o treino ----------
   Tudo aqui mexe só na LISTA do treino, nunca no que você já registrou.
   Depois de cada mudança, o treino de hoje é reencaixado pela função
   sincronizarSessao, que preserva as séries já feitas. */

function itensDoTreinoEmEdicao() {
  return acharTreino(edicao.treinoId).itens;
}

/* Reconstrói o treino de hoje a partir da lista nova, mantendo o que já
   foi registrado em cada exercício. Se um exercício saiu do treino, o
   que foi feito nele hoje sai junto; o histórico antigo não se mexe. */
function sincronizarSessao() {
  if (!sessao || sessao.treinoId !== edicao.treinoId) return;
  const guardado = {};
  sessao.itens.forEach(item => { guardado[item.exercicioId] = item; });

  sessao.itens = acharTreino(sessao.treinoId).itens.map(it => {
    if (guardado[it.exercicioId]) return guardado[it.exercicioId];
    const exercicio = acharExercicio(it.exercicioId);
    const anteriores = execucoesDe(it.exercicioId);
    return {
      exercicioId: it.exercicioId,
      cargaAtualKg: exercicio.semCarga ? null : (anteriores.length ? cargaDoItem(anteriores[0].item) : null),
      series: [], desconforto: { nivel: null, regioes: [] }, observacao: '', concluido: false
    };
  });
  if (sessao.itemAberto >= sessao.itens.length) sessao.itemAberto = 0;
  salvarSessao();
}

function guardarEdicao() {
  salvarBanco();
  sincronizarSessao();
  desenhar();
}

function moverItem(i, direcao) {
  const itens = itensDoTreinoEmEdicao();
  const destino = i + direcao;
  if (destino < 0 || destino >= itens.length) return;
  const guardado = itens[i];
  itens[i] = itens[destino];
  itens[destino] = guardado;
  guardarEdicao();
}

function mudarSeries(i, delta) {
  const item = itensDoTreinoEmEdicao()[i];
  item.series = Math.min(8, Math.max(1, item.series + delta));
  guardarEdicao();
}

function mudarFaixa(i, ponta, delta) {
  const item = itensDoTreinoEmEdicao()[i];
  if (ponta === 'min') {
    item.repMin = Math.min(item.repMax - 1, Math.max(1, item.repMin + delta));
  } else {
    item.repMax = Math.max(item.repMin + 1, Math.min(50, item.repMax + delta));
  }
  guardarEdicao();
}

function mudarDescanso(i, delta) {
  const item = itensDoTreinoEmEdicao()[i];
  item.descansoSeg = Math.min(300, Math.max(30, item.descansoSeg + delta));
  guardarEdicao();
}

function removerItem(i) {
  const itens = itensDoTreinoEmEdicao();
  if (itens.length <= 1) return;
  itens.splice(i, 1);
  guardarEdicao();
}

/* Transforma "Agachamento no Smith" em "agachamento-no-smith", que é
   como os exercícios são identificados por dentro. normalize [nativo]
   separa a letra do acento, e o replace joga o acento fora. */
function apelidoDe(nome) {
  const base = String(nome).normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'exercicio';
  let apelido = base, n = 2;
  while (acharExercicio(apelido)) { apelido = base + '-' + n; n++; }
  return apelido;
}

/* Cria um exercício novo no catálogo. Id novo de propósito: assim o
   histórico do exercício antigo fica intacto e o novo começa do zero. */
function criarExercicio(nome) {
  const exercicio = {
    id: apelidoDe(nome),
    nome: String(nome).trim(),
    equipamentoId: null,
    incrementoKg: banco.config.incrementoPadraoKg,
    ilustracao: null,
    instrucoes: ''
  };
  banco.exercicios.push(exercicio);
  return exercicio;
}

function criarExercicioDigitado() {
  const nome = (nomeDigitado || '').trim();
  if (!nome) { mostrarFaixa('Escreva o nome do exercicio', false); return; }
  const novo = criarExercicio(nome);
  nomeDigitado = '';
  usarExercicio(novo.id);
}

function usarExercicio(exercicioId) {
  const itens = itensDoTreinoEmEdicao();
  const escolha = edicao.escolhendo;
  if (!escolha) return;
  if (escolha.modo === 'substituir') {
    itens[escolha.i].exercicioId = exercicioId;
  } else {
    const molde = itens[itens.length - 1];
    itens.push({
      exercicioId: exercicioId,
      series: molde ? molde.series : 2,
      repMin: molde ? molde.repMin : 8,
      repMax: molde ? molde.repMax : 12,
      descansoSeg: molde ? molde.descansoSeg : 90
    });
  }
  edicao.escolhendo = null;
  guardarEdicao();
}

/* Depois de apagar ou devolver uma sessão, a fila A > B > C precisa ser
   recalculada: ela segue o treino CONCLUÍDO mais recente que sobrou. */
function recalcularFila() {
  const concluidas = banco.sessoes.filter(s => s.estado === 'concluida');
  concluidas.sort((a, b) => (a.data < b.data ? -1 : 1));
  banco.config.ultimoTreinoConcluido = concluidas.length
    ? concluidas[concluidas.length - 1].treinoId
    : null;
}

function pedirApagarSessao(sessaoId) {
  const alvo = banco.sessoes.find(s => s.id === sessaoId);
  if (!alvo) return;
  confirmando = {
    tipo: 'apagar-sessao',
    sessaoId: sessaoId,
    texto: 'Apagar o ' + acharTreino(alvo.treinoId).nome + ' de ' + dataCurta(alvo.data) +
           ', com ' + seriesDaSessao(alvo) + ' séries? Some do histórico de todos os exercícios.',
    botao: 'Apagar',
    perigo: true
  };
  desenhar();
}

function apagarSessao(sessaoId) {
  const pos = banco.sessoes.findIndex(s => s.id === sessaoId);
  if (pos < 0) return;
  sessaoApagada = { posicao: pos, sessao: banco.sessoes[pos] };
  banco.sessoes.splice(pos, 1);
  recalcularFila();
  salvarBanco();
  ultimaAcao = { tipo: 'apagar-sessao' };
  desenhar();
  mostrarFaixa('Treino apagado', true);
}

function abrirCartao(i) {
  sessao.itemAberto = (sessao.itemAberto === i) ? -1 : i;
  editandoCarga = null;
  repsAmpliado = null;
  salvarSessao();
  desenhar();
}

/* Trocar de treino. Se já tem coisa registrada, pergunta na tela. */
function pedirTrocaDeTreino() {
  const ordenados = banco.treinos.slice().sort((a, b) => a.ordem - b.ordem);
  const i = ordenados.findIndex(t => t.id === sessao.treinoId);
  const novo = ordenados[(i + 1) % ordenados.length];
  if (!sessaoTemRegistro(sessao)) return trocarTreino(novo.id);
  confirmando = {
    tipo: 'trocar',
    destino: novo.id,
    texto: 'Trocar para ' + novo.nome + '? As ' + seriesDaSessao(sessao) +
           ' séries registradas hoje serão apagadas.',
    botao: 'Trocar'
  };
  desenhar();
}

function trocarTreino(destinoId) {
  apagarSessaoSalva();
  sessao = criarSessao(destinoId);
  confirmando = null;
  pararDescanso();
  desenhar();
}

/* Arquiva a sessão no banco. estado: 'concluida' ou 'incompleta'.
   Só a concluída empurra a fila A > B > C. */
function arquivarSessao(estado) {
  sessao.estado = estado;
  sessao.encerradaEm = new Date().toISOString();
  banco.sessoes.push(sessao);
  if (estado === 'concluida') banco.config.ultimoTreinoConcluido = sessao.treinoId;
  salvarBanco();
  apagarSessaoSalva();
  const nome = acharTreino(sessao.treinoId).nome;
  sessao = criarSessao(proximoTreinoId());
  confirmando = null;
  perguntarSobrePendente = false;
  pararDescanso();
  desenhar();
  mostrarFaixa(nome + (estado === 'concluida' ? ' concluído' : ' guardado como incompleto'), false);
}

function pedirConclusaoDoTreino() {
  const feitos = sessao.itens.filter(it => it.series.length > 0).length;
  confirmando = {
    tipo: 'concluir-treino',
    texto: 'Concluir ' + acharTreino(sessao.treinoId).nome + ' com ' + feitos +
           ' de ' + sessao.itens.length + ' exercícios?',
    botao: 'Concluir'
  };
  desenhar();
}

function pedirDescarte() {
  confirmando = {
    tipo: 'descartar',
    texto: 'Descartar de vez as ' + seriesDaSessao(sessao) + ' séries dessa sessão?',
    botao: 'Descartar',
    perigo: true
  };
  desenhar();
}

function executarConfirmacao() {
  const pedido = confirmando;
  confirmando = null;
  if (!pedido) return;
  if (pedido.tipo === 'trocar')          return trocarTreino(pedido.destino);
  if (pedido.tipo === 'concluir-treino') return arquivarSessao('concluida');
  if (pedido.tipo === 'restaurar')       return restaurarBackup();
  if (pedido.tipo === 'apagar-sessao')   return apagarSessao(pedido.sessaoId);
  if (pedido.tipo === 'descartar') {
    apagarSessaoSalva();
    perguntarSobrePendente = false;
    sessao = criarSessao(proximoTreinoId());
    desenhar();
    mostrarFaixa('Sessão descartada', false);
  }
}

/* Backup: baixa um arquivo .json com tudo, fotos incluídas.
   Blob e URL.createObjectURL [navegador] montam um arquivo na memória
   e criam um endereço temporário para ele. */
function exportarBackup() {
  const fotos = {};
  banco.equipamentos.forEach(eq => {
    const foto = lerFoto(eq.id);
    if (foto) fotos[eq.id] = foto;
  });
  const tudo = {
    app: 'treino',
    salvoEm: new Date().toISOString(),
    banco: banco,
    sessaoAtual: lerSessaoSalva(),
    fotos: fotos
  };
  const arquivo = new Blob([JSON.stringify(tudo, null, 2)], { type: 'application/json' });
  const endereco = URL.createObjectURL(arquivo);
  const link = document.createElement('a');
  link.href = endereco;
  link.download = 'treino-backup-' + dataLocal() + '.json';
  link.click();
  URL.revokeObjectURL(endereco);
  mostrarFaixa('Backup salvo na pasta de downloads', false);
}


/* ---------- restaurar um backup ---------- */

/* Abre a busca de arquivos do celular. É tela do sistema, não pop up. */
function pedirBackup() {
  document.getElementById('arquivo-backup').click();
}

/* Confere se o arquivo escolhido é mesmo um backup deste app antes de
   deixar qualquer coisa acontecer. */
function conferirBackup(texto) {
  let dados;
  try { dados = JSON.parse(texto); } catch (erro) { return null; }
  if (!dados || typeof dados !== 'object') return null;
  const b = dados.banco;
  if (!b || !Array.isArray(b.exercicios) || !Array.isArray(b.treinos) || !Array.isArray(b.sessoes)) return null;
  return dados;
}

/* Lê o arquivo e monta a pergunta na tela, com o que tem dentro dele.
   Nada é substituído antes de você confirmar. */
function lerArquivoDeBackup(arquivo) {
  if (!arquivo) return;
  const leitor = new FileReader();          // FileReader [navegador]
  leitor.onload = function () {
    const dados = conferirBackup(leitor.result);
    if (!dados) {
      mostrarFaixa('Esse arquivo não é um backup do Treino', false);
      return;
    }
    backupParaRestaurar = dados;
    const quantasFotos = dados.fotos ? Object.keys(dados.fotos).length : 0;  // Object.keys [nativo]
    confirmando = {
      tipo: 'restaurar',
      texto: 'Backup ' + (dados.salvoEm ? 'de ' + dataCurta(dados.salvoEm.slice(0, 10)) : 'sem data') +
             ', com ' + dados.banco.sessoes.length + ' treinos registrados e ' +
             quantasFotos + (quantasFotos === 1 ? ' foto' : ' fotos') +
             '. Restaurar apaga o que está no app agora e põe isso no lugar.',
      botao: 'Restaurar'
    };
    desenhar();
  };
  leitor.readAsText(arquivo);
}

/* Todas as chaves de foto guardadas hoje. localStorage.key e .length
   [navegador] servem justamente para varrer a gaveta. */
function chavesDeFoto() {
  const chaves = [];
  for (let i = 0; i < localStorage.length; i++) {
    const chave = localStorage.key(i);
    if (chave && chave.indexOf(CHAVE_FOTO) === 0) chaves.push(chave);
  }
  return chaves;
}

/* Uma cópia de tudo que está no app agora, guardada só na memória.
   É o que o botão Desfazer usa depois de uma restauração. */
function retratoDeAgora() {
  const fotos = {};
  chavesDeFoto().forEach(chave => { fotos[chave] = localStorage.getItem(chave); });
  return {
    banco: JSON.parse(JSON.stringify(banco)),
    sessaoAtual: lerSessaoSalva(),
    fotos: fotos
  };
}

function aplicarEstado(estado, fotosComPrefixo) {
  banco = JSON.parse(JSON.stringify(estado.banco));
  salvarBanco();

  chavesDeFoto().forEach(chave => localStorage.removeItem(chave));
  Object.keys(cacheDeFotos).forEach(id => delete cacheDeFotos[id]);
  const fotos = estado.fotos || {};
  Object.keys(fotos).forEach(nome => {
    // no arquivo de backup a chave é o id do aparelho; no retrato da
    // memória ela já vem com o prefixo. Os dois casos caem aqui.
    const chave = fotosComPrefixo ? nome : CHAVE_FOTO + nome;
    try { localStorage.setItem(chave, fotos[nome]); } catch (erro) { /* sem espaço */ }
  });

  if (estado.sessaoAtual) {
    sessao = estado.sessaoAtual;
    localStorage.setItem(CHAVE_SESSAO, JSON.stringify(sessao));
    perguntarSobrePendente = sessaoPrecisaDeDecisao(sessao);
  } else {
    apagarSessaoSalva();
    perguntarSobrePendente = false;
    sessao = criarSessao(proximoTreinoId());
  }
  completarComSementes();
}

function restaurarBackup() {
  const backup = backupParaRestaurar;
  backupParaRestaurar = null;
  if (!backup) return;

  estadoAntesDaRestauracao = retratoDeAgora();
  aplicarEstado(backup, false);

  ultimaAcao = { tipo: 'restaurar' };
  pararDescanso();
  desenhar();
  mostrarFaixa('Backup restaurado', true);
}


/* ---------- faixa de recado e desfazer ---------- */

function mostrarFaixa(texto, podeDesfazer) {
  const caixa = document.getElementById('desfazer');
  caixa.innerHTML =
    '<span>' + esc(texto) + '</span>' +
    (podeDesfazer ? '<button data-acao="desfazer">DESFAZER</button>' : '');
  caixa.classList.remove('oculto');
  clearTimeout(desfazerId);                       // clearTimeout [nativo]
  desfazerId = setTimeout(esconderFaixa, 6000);   // setTimeout [nativo]
}

function esconderFaixa() {
  document.getElementById('desfazer').classList.add('oculto');
  ultimaAcao = null;
}

function desfazer() {
  if (!ultimaAcao) return esconderFaixa();

  /* devolver um treino apagado ao lugar de onde saiu */
  if (ultimaAcao.tipo === 'apagar-sessao') {
    if (sessaoApagada) {
      banco.sessoes.splice(sessaoApagada.posicao, 0, sessaoApagada.sessao);
      sessaoApagada = null;
      recalcularFila();
      salvarBanco();
    }
    esconderFaixa();
    desenhar();
    return;
  }

  /* desfazer uma restauração: volta o retrato guardado na memória */
  if (ultimaAcao.tipo === 'restaurar') {
    if (estadoAntesDaRestauracao) {
      aplicarEstado(estadoAntesDaRestauracao, true);
      estadoAntesDaRestauracao = null;
    }
    esconderFaixa();
    desenhar();
    return;
  }

  const item = sessao.itens[ultimaAcao.i];
  if (ultimaAcao.tipo === 'serie') {
    item.series.pop();          // pop [nativo]: tira o último da lista
    pararDescanso();
  } else if (ultimaAcao.tipo === 'concluir') {
    item.concluido = false;
    sessao.itemAberto = ultimaAcao.i;
  }
  esconderFaixa();
  salvarSessao();
  desenhar();
}


/* =============================================================
   6. CRONÔMETRO
   ============================================================= */

function iniciarDescanso(segundos) {
  cron = { fim: Date.now() + segundos * 1000, avisou: false };
  if (!relogioId) relogioId = setInterval(pintarCronometro, 250);  // setInterval [nativo]
  pintarCronometro();
}

function pararDescanso() {
  cron = null;
  clearInterval(relogioId);
  relogioId = null;
  document.getElementById('cronometro').classList.add('oculto');
}

function pintarCronometro() {
  const caixa = document.getElementById('cronometro');
  if (!cron) { caixa.classList.add('oculto'); return; }

  const restam = Math.round((cron.fim - Date.now()) / 1000);
  const acabou = restam <= 0;

  if (acabou && !cron.avisou) {
    cron.avisou = true;
    // navigator.vibrate [navegador]: só existe em celular Android
    if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
  }

  const min = Math.floor(Math.abs(restam) / 60);
  const seg = Math.abs(restam) % 60;

  caixa.className = acabou ? 'acabou' : '';
  caixa.innerHTML =
    '<div class="tempo">' + (acabou ? 'pronto' : min + ':' + String(seg).padStart(2, '0')) + '</div>' +
    '<button class="btn-pequeno" data-acao="mais-tempo">+30s</button>' +
    '<button class="btn-pequeno" data-acao="pular-descanso">Fechar</button>';
}


/* =============================================================
   7. IMAGENS
   Cada exercício tem o seu desenho, que veio junto com o app pelo
   campo ilustracao das sementes.

   O app também sabe mostrar foto guardada por aparelho, e ela passa
   na frente do desenho. Não existe mais botão para tirar foto: essas
   funções ficaram só para ler o que já existe e para o backup. A foto
   pertence ao EQUIPAMENTO, não ao exercício, porque a mesma máquina
   serve a vários exercícios.
   ============================================================= */

const cacheDeFotos = {};   // evita reler o mesmo texto grande a cada desenho

function lerFoto(equipamentoId) {
  if (!equipamentoId) return null;
  if (equipamentoId in cacheDeFotos) return cacheDeFotos[equipamentoId];
  const foto = localStorage.getItem(CHAVE_FOTO + equipamentoId);
  cacheDeFotos[equipamentoId] = foto;
  return foto;
}

function salvarFoto(equipamentoId, imagem) {
  try {
    localStorage.setItem(CHAVE_FOTO + equipamentoId, imagem);
    cacheDeFotos[equipamentoId] = imagem;
    return true;
  } catch (erro) {
    // o navegador tem limite de espaço; se estourar, avisa sem quebrar
    mostrarFaixa('Sem espaço para mais fotos neste navegador', false);
    return false;
  }
}

function apagarFoto(equipamentoId) {
  localStorage.removeItem(CHAVE_FOTO + equipamentoId);
  cacheDeFotos[equipamentoId] = null;
}

/* A foto que VOCÊ tirou do aparelho da sua academia. */
function fotoDoExercicio(exercicio) {
  return lerFoto(exercicio.equipamentoId);
}

/* O que aparece no cartão: a sua foto, se existir; senão o desenho
   que já veio junto com o app (pasta imagens). */
function imagemDoExercicio(exercicio) {
  return fotoDoExercicio(exercicio) || exercicio.ilustracao || null;
}

/* =============================================================
   8. DESENHO
   Uma função só redesenha a tela a partir do estado.
   Mudou o dado, chama desenhar().
   ============================================================= */

function desenhar() {
  const treino = acharTreino(sessao.treinoId);

  /* --- cabeçalho laranja --- */
  const feitos = sessao.itens.filter(it => it.concluido).length;
  document.getElementById('cabecalho').innerHTML =
    '<div class="titulo-treino">' +
      '<h1>' + esc(treino.nome.toUpperCase()) + '</h1>' +
      '<div class="hoje">HOJE</div>' +
    '</div>' +
    '<div class="linha-progresso">' +
      '<span>' + feitos + ' de ' + sessao.itens.length + ' exercícios</span>' +
      '<span class="botoes-cabecalho">' +
        '<button class="btn-pequeno" data-acao="editar-treino" data-id="' + treino.id + '">Editar</button>' +
        '<button class="btn-pequeno" data-acao="trocar-treino">Trocar treino</button>' +
      '</span>' +
    '</div>';

  /* --- sessão pendente toma a tela --- */
  if (perguntarSobrePendente) {
    document.getElementById('conteudo').innerHTML = desenharConfirmacao() + desenharAviso();
    document.getElementById('rodape').innerHTML = '';
    desenharPainel();
    return;
  }

  /* --- lista de exercícios --- */
  document.getElementById('conteudo').innerHTML =
    desenharConfirmacao() +
    treino.itens.map((itemDoTreino, i) => desenharCartao(itemDoTreino, i)).join('');

  /* --- rodapé --- */
  document.getElementById('rodape').innerHTML =
    (sessaoTemRegistro(sessao)
      ? '<button class="btn-largo btn-laranja" data-acao="concluir-treino">Concluir treino</button>'
      : '') +
    '<div class="linha-backup">' +
      '<button class="btn-pequeno" data-acao="ver-treinos">Treinos registrados</button>' +
    '</div>' +
    '<div class="linha-backup">' +
      '<button class="btn-pequeno" data-acao="backup">Salvar backup</button>' +
      '<button class="btn-pequeno" data-acao="restaurar">Restaurar backup</button>' +
    '</div>';

  desenharPainel();

  /* o campo de carga precisa receber o cursor depois de desenhado */
  if (editandoCarga !== null) {
    const campo = document.querySelector('[data-campo="carga"]');  // querySelector [navegador]
    if (campo) { campo.focus(); campo.select(); }
  }
}

/* Painel do histórico: sobe por cima da tela, sem tirar você do treino.
   Ele fica ABAIXO da barra do cronômetro de propósito, para você poder
   olhar o histórico enquanto o descanso corre. */
function desenharPainel() {
  const caixa = document.getElementById('painel');

  if (edicao)      { caixa.classList.remove('oculto'); caixa.innerHTML = desenharEdicao(); return; }
  if (listaAberta) { caixa.classList.remove('oculto'); caixa.innerHTML = desenharListaDeTreinos(); return; }
  if (!historicoAberto) { caixa.classList.add('oculto'); return; }

  const exercicio = acharExercicio(historicoAberto);
  const feitos = execucoesDe(historicoAberto);

  /* resumo de uma linha */
  const cargas = feitos.map(f => cargaDoItem(f.item)).filter(c => c !== null);
  const maior = cargas.length ? Math.max.apply(null, cargas) : null;   // Math.max [nativo]
  const resumo = feitos.length + (feitos.length === 1 ? ' sessão' : ' sessões') +
    (maior !== null ? ' · maior carga ' + numero(maior) + ' kg' : '');

  const linhas = feitos.map(f => {
    const carga = cargaDoItem(f.item);
    const rir = rirDoItem(f.item);
    const d = f.item.desconforto || {};
    const regioes = (d.regioes || []).join(', ');
    return '<div class="sessao">' +
      '<div class="dia">' + dataCurta(f.data) + '</div>' +
      '<div class="detalhe">' +
        '<div class="linha-carga">' +
          (carga !== null ? '<b>' + numero(carga) + ' kg</b> · ' : '') +
          f.item.series.map(x => x.reps).join(' · ') + ' reps' +
          (rir !== null ? ' <span class="marca">RIR ' + rir + '</span>' : '') +
          (f.estado === 'incompleta' ? ' <span class="marca">treino incompleto</span>' : '') +
        '</div>' +
        (d.nivel && d.nivel !== 'sem'
          ? '<div class="extra">desconforto ' + esc(d.nivel) + (regioes ? ' · ' + esc(regioes) : '') + '</div>'
          : '') +
        (f.item.observacao ? '<div class="obs">' + esc(f.item.observacao) + '</div>' : '') +
      '</div></div>';
  }).join('');

  const aviso = avisoDeDesconforto(historicoAberto);

  caixa.classList.remove('oculto');
  caixa.innerHTML =
    '<div class="topo-painel">' +
      '<div><h2>' + esc(exercicio.nome) + '</h2>' +
      '<div class="resumo-painel">' + resumo + '</div></div>' +
      '<button class="btn-laranja" data-acao="fechar-historico">Fechar</button>' +
    '</div>' +
    (aviso ? '<div class="atencao atencao-painel">' + esc(textoDoAviso(aviso)) + '</div>' : '') +
    blocoDoGrafico(feitos) +
    '<div class="lista-painel">' +
      (feitos.length ? linhas : '<div class="vazio">Nenhuma sessão registrada ainda.</div>') +
    '</div>';
}

/* Tela de edição de um treino. Mexe na lista do dia, não no histórico. */
function desenharEdicao() {
  const treino = acharTreino(edicao.treinoId);

  /* escolhendo um exercício para entrar ou substituir */
  if (edicao.escolhendo) return desenharEscolhaDeExercicio();

  const abas = banco.treinos.slice().sort((a, b) => a.ordem - b.ordem).map(t =>
    '<button class="btn-pequeno' + (t.id === edicao.treinoId ? ' btn-laranja' : '') +
    '" data-acao="editar-treino" data-id="' + t.id + '">' + esc(t.nome) + '</button>'
  ).join('');

  const linhas = treino.itens.map((it, i) => {
    const exercicio = acharExercicio(it.exercicioId);
    return '<div class="item-edicao">' +
      '<div class="cabeca-edicao">' +
        '<div class="nome-edicao">' + (i + 1) + '. ' + esc(exercicio.nome) + '</div>' +
        '<div class="setas">' +
          '<button class="btn-pequeno" data-acao="subir" data-i="' + i + '">&#9650;</button>' +
          '<button class="btn-pequeno" data-acao="descer" data-i="' + i + '">&#9660;</button>' +
        '</div>' +
      '</div>' +
      linhaDeAjuste('Series', it.series, 'series', i) +
      linhaDeAjuste('Minimo de reps', it.repMin, 'repmin', i) +
      linhaDeAjuste('Maximo de reps', it.repMax, 'repmax', i) +
      linhaDeAjuste('Descanso', it.descansoSeg + 's', 'descanso', i) +
      '<div class="acoes-edicao">' +
        '<button class="btn-pequeno" data-acao="substituir" data-i="' + i + '">Trocar exercicio</button>' +
        '<button class="btn-pequeno btn-perigo" data-acao="remover-item" data-i="' + i + '">Tirar do treino</button>' +
      '</div>' +
    '</div>';
  }).join('');

  return '<div class="topo-painel">' +
      '<div><h2>Editar treino</h2>' +
      '<div class="resumo-painel">muda a lista do dia, nao mexe no historico</div></div>' +
      '<button class="btn-laranja" data-acao="fechar-historico">Fechar</button>' +
    '</div>' +
    '<div class="abas">' + abas + '</div>' +
    '<div class="lista-painel">' + linhas +
      '<button class="btn-largo btn-marrom" data-acao="adicionar-item">Acrescentar exercicio</button>' +
    '</div>';
}

function linhaDeAjuste(rotulo, valor, campo, i) {
  return '<div class="ajuste">' +
    '<div class="rotulo-ajuste">' + rotulo + '</div>' +
    '<button class="btn-pequeno" data-acao="menos-' + campo + '" data-i="' + i + '">&minus;</button>' +
    '<div class="valor-ajuste">' + esc(valor) + '</div>' +
    '<button class="btn-pequeno" data-acao="mais-' + campo + '" data-i="' + i + '">+</button>' +
  '</div>';
}

/* Lista de exercicios para escolher, mais o campo de criar um novo. */
function desenharEscolhaDeExercicio() {
  const escolha = edicao.escolhendo;
  const titulo = escolha.modo === 'substituir' ? 'Trocar por' : 'Acrescentar';

  const usados = acharTreino(edicao.treinoId).itens.map(it => it.exercicioId);
  const lista = banco.exercicios.slice()
    .sort((a, b) => a.nome.localeCompare(b.nome))   // localeCompare [nativo]: ordem alfabetica
    .map(e => '<button class="btn-largo escolha" data-acao="usar-exercicio" data-id="' + e.id + '">' +
      esc(e.nome) + (usados.indexOf(e.id) >= 0 ? ' <span class="marca">ja esta no treino</span>' : '') +
      '</button>')
    .join('');

  const aviso = escolha.modo === 'substituir'
    ? '<div class="aviso-troca">O historico do exercicio que sai continua guardado. ' +
      'O que entrar comeca do zero, sem herdar carga.</div>'
    : '';

  return '<div class="topo-painel">' +
      '<div><h2>' + titulo + '</h2></div>' +
      '<button class="btn-laranja" data-acao="voltar-edicao">Voltar</button>' +
    '</div>' +
    '<div class="lista-painel">' + aviso +
      '<div class="novo-exercicio">' +
        '<div class="rotulo">Criar um exercicio novo</div>' +
        '<input type="text" data-campo="novo-exercicio" placeholder="Nome do exercicio">' +
        '<button class="btn-largo btn-marrom" data-acao="criar-exercicio">Criar e usar</button>' +
      '</div>' +
      '<div class="rotulo">Ou escolher um que ja existe</div>' + lista +
    '</div>';
}

/* Lista de tudo que já foi registrado, para poder apagar o que foi só
   teste. Mostra também o treino de hoje, se estiver em andamento. */
function desenharListaDeTreinos() {
  const registrados = banco.sessoes.slice().reverse();   // mais recente em cima

  const emAndamento = sessaoTemRegistro(sessao)
    ? '<div class="sessao">' +
        '<div class="dia">' + dataCurta(sessao.data) + '</div>' +
        '<div class="detalhe">' +
          '<div class="linha-carga"><b>' + esc(acharTreino(sessao.treinoId).nome) + '</b>' +
            ' <span class="marca">em andamento</span></div>' +
          '<div class="extra-cinza">' + seriesDaSessao(sessao) + ' séries registradas hoje</div>' +
        '</div>' +
        '<button class="btn-pequeno btn-perigo" data-acao="descartar-atual">Apagar</button>' +
      '</div>'
    : '';

  const linhas = registrados.map(s => {
    const exerciciosFeitos = s.itens.filter(it => it.series.length > 0).length;
    return '<div class="sessao">' +
      '<div class="dia">' + dataCurta(s.data) + '</div>' +
      '<div class="detalhe">' +
        '<div class="linha-carga"><b>' + esc(acharTreino(s.treinoId).nome) + '</b>' +
          (s.estado === 'incompleta' ? ' <span class="marca">incompleto</span>' : '') + '</div>' +
        '<div class="extra-cinza">' + exerciciosFeitos + ' exercícios · ' +
          seriesDaSessao(s) + ' séries</div>' +
      '</div>' +
      '<button class="btn-pequeno btn-perigo" data-acao="apagar-sessao" data-id="' + esc(s.id) + '">Apagar</button>' +
    '</div>';
  }).join('');

  return '<div class="topo-painel">' +
      '<div><h2>Treinos registrados</h2>' +
      '<div class="resumo-painel">' + registrados.length +
        (registrados.length === 1 ? ' treino guardado' : ' treinos guardados') + '</div></div>' +
      '<button class="btn-laranja" data-acao="fechar-historico">Fechar</button>' +
    '</div>' +
    desenharConfirmacao() +
    '<div class="lista-painel">' +
      emAndamento + linhas +
      (registrados.length || emAndamento ? '' : '<div class="vazio">Nada registrado ainda.</div>') +
    '</div>';
}

/* Faixa marrom de sim ou não, no lugar da caixinha do navegador. */
function desenharConfirmacao() {
  if (!confirmando) return '';
  return '<div class="confirmacao">' +
    '<p>' + esc(confirmando.texto) + '</p>' +
    '<div class="botoes">' +
      '<button data-acao="confirmar" class="' + (confirmando.perigo ? 'btn-perigo' : 'btn-laranja') + '">' +
        esc(confirmando.botao) + '</button>' +
      '<button data-acao="cancelar" class="cancelar">Cancelar</button>' +
    '</div></div>';
}

function desenharAviso() {
  const treino = acharTreino(sessao.treinoId);
  return '<div class="aviso">' +
    '<h2>Sessão anterior não finalizada</h2>' +
    '<p>' + esc(treino.nome) + ' de ' + dataCurta(sessao.data) + ', com ' +
      seriesDaSessao(sessao) + ' séries registradas.</p>' +
    '<div class="botoes">' +
      '<button class="btn-largo btn-laranja" data-acao="sessao-continuar">Continuar</button>' +
      '<button class="btn-largo" data-acao="sessao-incompleta">Encerrar como incompleta</button>' +
      '<button class="btn-largo btn-perigo" data-acao="sessao-descartar">Descartar</button>' +
    '</div></div>';
}

function desenharCartao(itemDoTreino, i) {
  const item = sessao.itens[i];
  const exercicio = acharExercicio(item.exercicioId);
  const aberto = sessao.itemAberto === i;
  const imagem = imagemDoExercicio(exercicio);

  const prescricao = itemDoTreino.series + ' x ' + itemDoTreino.repMin + '-' + itemDoTreino.repMax;

  /* resumo que aparece com o cartão fechado */
  let resumo = '—';
  if (item.series.length) {
    const carga = cargaDoItem(item);
    resumo = (carga !== null ? numero(carga) + ' kg · ' : '') +
             item.series.map(s => s.reps).join('/');
  }

  let html = '<section class="cartao' + (aberto ? ' aberto' : '') + '">' +
    '<div class="cabeca-cartao" data-acao="abrir-cartao" data-i="' + i + '">' +
      '<div class="numero">' + (i + 1) + '</div>' +
      (imagem && !aberto ? '<img class="miniatura" src="' + imagem + '" alt="">' : '') +
      '<div class="nome-exercicio">' + esc(exercicio.nome) +
        (exercicio.emTeste ? ' <span class="selo">em teste</span>' : '') +
        '<div class="prescricao">' + prescricao + ' · ' + itemDoTreino.descansoSeg + 's</div>' +
      '</div>' +
      '<div class="resumo' + (item.concluido ? ' feito' : '') + '">' +
        (item.concluido ? '✓<br>' : '') + esc(resumo) +
      '</div>' +
    '</div>';

  if (!aberto) return html + '</section>';

  html += '<div class="corpo-cartao">';

  /* o desenho do exercício, sem botão nenhum: nada para tocar aqui */
  if (imagem) {
    html += '<img class="foto" src="' + imagem + '" alt="' + esc(exercicio.nome) + '">';
  }

  /* última vez */
  const anteriores = execucoesDe(item.exercicioId);
  if (anteriores.length) {
    const a = anteriores[0];
    const carga = cargaDoItem(a.item);
    const rir = rirDoItem(a.item);
    html += '<div class="ultima-vez tocavel" data-acao="ver-historico" data-id="' + item.exercicioId + '">' +
      '<div>Última vez (' + dataCurta(a.data) + '): <b>' +
      (carga !== null ? numero(carga) + ' kg · ' : '') +
      a.item.series.map(s => s.reps).join('/') + '</b>' +
      (rir !== null ? ' · RIR ' + rir : '') + '</div>' +
      '<div class="ver-tudo">ver tudo</div></div>';
  } else {
    html += '<div class="ultima-vez">Primeira vez neste exercício.</div>';
  }

  /* sugestão de progressão */
  const sugerida = sugestaoDeCarga(itemDoTreino);
  if (sugerida) {
    const recado = sugerida.motivo === 'leve'
      ? 'Carga parece leve para a faixa. Dá para testar <b>' + numero(sugerida.carga) + ' kg</b>.'
      : sugerida.motivo === 'voltar'
      ? 'Esse salto ainda não pegou. Dá para voltar para <b>' + numero(sugerida.carga) + ' kg</b> e subir de novo mais pra frente.'
      : 'Duas sessões no topo. Dá para testar <b>' + numero(sugerida.carga) + ' kg</b>.';
    html += '<div class="sugestao">' +
      '<span>' + recado + '</span>' +
      '<button class="btn-pequeno btn-laranja" data-acao="aceitar-sugestao" data-i="' + i +
        '" data-valor="' + sugerida.carga + '">Usar</button>' +
      '</div>';
  }

  /* desconforto repetido: só o que você registrou, contado */
  const aviso = avisoDeDesconforto(item.exercicioId);
  if (aviso) {
    html += '<div class="atencao">' + esc(textoDoAviso(aviso)) + '</div>';
  }

  /* carga */
  if (!exercicio.semCarga) {
    html += '<div class="bloco"><div class="rotulo">Carga de hoje</div><div class="carga">';
    if (editandoCarga === i) {
      html += '<input class="campo" type="text" inputmode="decimal" data-campo="carga" data-i="' + i +
                '" value="' + (typeof item.cargaAtualKg === 'number' ? numero(item.cargaAtualKg) : '') + '">' +
              '<button class="passo btn-laranja" data-acao="carga-ok">OK</button>';
    } else {
      html += '<button class="passo" data-acao="carga-menos" data-i="' + i + '">−</button>' +
              '<div class="valor" data-acao="carga-editar" data-i="' + i + '">' +
                numero(item.cargaAtualKg) + ' kg</div>' +
              '<button class="passo" data-acao="carga-mais" data-i="' + i + '">+</button>';
    }
    html += '</div></div>';
  }

  /* grade de repetições */
  const numeroDaSerie = item.series.length + 1;
  const extra = numeroDaSerie > itemDoTreino.series;
  const ampliada = repsAmpliado === i;

  html += '<div class="bloco">' +
    '<div class="rotulo">Série ' + numeroDaSerie +
      (extra ? ' (extra)' : ' de ' + itemDoTreino.series) + ' · repetições</div>' +
    '<div class="grade-reps' + (ampliada ? ' ampliada' : '') + '">' +
      (ampliada ? opcoesAmpliadas(itemDoTreino.repMin, itemDoTreino.repMax)
                : opcoesDeReps(itemDoTreino.repMin, itemDoTreino.repMax))
        .map(r => '<button data-acao="rep" data-i="' + i + '" data-valor="' + r + '">' + r + '</button>')
        .join('') +
      '<button class="outro" data-acao="' + (ampliada ? 'rep-menos-opcoes' : 'rep-outro') +
        '" data-i="' + i + '">' + (ampliada ? 'voltar' : 'outro') + '</button>' +
    '</div>';

  /* séries já registradas */
  if (item.series.length) {
    html += '<div class="series-feitas">' +
      item.series.map((s, n) => {
        const noTopo = s.reps >= itemDoTreino.repMax;
        return '<div class="chip' + (noTopo ? ' topo' : '') + '">' +
          (n + 1) + 'ª · ' +
          (typeof s.cargaKg === 'number' ? numero(s.cargaKg) + ' kg · ' : '') +
          s.reps + (typeof s.rir === 'number' ? ' · RIR ' + s.rir : '') +
          '</div>';
      }).join('') + '</div>';
  }
  html += '</div>';

  /* fechamento: só depois de bater as séries previstas */
  if (item.series.length >= itemDoTreino.series) {
    const rirAtual = rirDoItem(item);
    const nivel = item.desconforto.nivel;

    html += '<div class="fechamento">';

    html += '<div class="rotulo">RIR da última série</div><div class="fileira fileira-rir">' +
      [0, 1, 2, 3, 4, 5].map(v =>
        '<button data-acao="rir" data-i="' + i + '" data-valor="' + v + '"' +
        (rirAtual === v ? ' class="escolhido"' : '') + '>' + (v === 5 ? '5+' : v) + '</button>'
      ).join('') + '</div>';

    html += '<div class="bloco"><div class="rotulo">Desconforto</div><div class="fileira fileira-desconforto">' +
      NIVEIS.map(n => {
        const escolhido = nivel === n.id;
        const ruim = escolhido && (n.id === 'moderado' || n.id === 'forte');
        return '<button data-acao="desconforto" data-i="' + i + '" data-valor="' + n.id + '"' +
          (escolhido ? ' class="escolhido' + (ruim ? ' ruim' : '') + '"' : '') + '>' + n.texto + '</button>';
      }).join('') + '</div></div>';

    if (nivel && nivel !== 'sem') {
      html += '<div class="bloco"><div class="rotulo">Região (opcional)</div><div class="fileira fileira-regiao">' +
        REGIOES.map(r =>
          '<button data-acao="regiao" data-i="' + i + '" data-valor="' + r + '"' +
          (item.desconforto.regioes.indexOf(r) >= 0 ? ' class="escolhido"' : '') + '>' + r + '</button>'
        ).join('') + '</div></div>';
    }

    html += '<div class="bloco"><div class="rotulo">Observação (opcional)</div>' +
      '<textarea data-campo="obs" data-i="' + i + '" placeholder="banco um furo mais alto...">' +
      esc(item.observacao) + '</textarea></div>';

    if (!item.concluido) {
      html += '<div class="bloco"><button class="btn-largo btn-laranja" data-acao="concluir-exercicio" data-i="' + i + '">' +
        'Concluir exercício</button></div>';
    }

    html += '</div>';
  }

  return html + '</div></section>';
}


/* =============================================================
   9. TOQUES
   Um único ouvinte para a tela inteira: ele olha o data-acao do
   que foi tocado e chama a função certa. Assim nada precisa ser
   religado toda vez que a tela é redesenhada.
   ============================================================= */

document.addEventListener('click', function (evento) {
  // closest [navegador]: sobe do ponto tocado até achar quem tem data-acao
  const alvo = evento.target.closest('[data-acao]');
  if (!alvo) return;

  const acao  = alvo.dataset.acao;
  const i     = alvo.dataset.i !== undefined ? Number(alvo.dataset.i) : null;
  const valor = alvo.dataset.valor;

  switch (acao) {
    case 'abrir-cartao':       abrirCartao(i); break;
    case 'ver-historico':      abrirHistorico(alvo.dataset.id); break;
    case 'grafico-carga':      graficoModo = 'carga'; desenhar(); break;
    case 'grafico-volume':     graficoModo = 'volume'; desenhar(); break;
    case 'ver-treinos':        abrirListaDeTreinos(); break;
    case 'editar-treino':      abrirEdicao(alvo.dataset.id); break;
    case 'subir':              moverItem(i, -1); break;
    case 'descer':             moverItem(i, +1); break;
    case 'mais-series':        mudarSeries(i, +1); break;
    case 'menos-series':       mudarSeries(i, -1); break;
    case 'mais-repmin':        mudarFaixa(i, 'min', +1); break;
    case 'menos-repmin':       mudarFaixa(i, 'min', -1); break;
    case 'mais-repmax':        mudarFaixa(i, 'max', +1); break;
    case 'menos-repmax':       mudarFaixa(i, 'max', -1); break;
    case 'mais-descanso':      mudarDescanso(i, +15); break;
    case 'menos-descanso':     mudarDescanso(i, -15); break;
    case 'remover-item':       removerItem(i); break;
    case 'substituir':         edicao.escolhendo = { modo: 'substituir', i: i }; desenhar(); break;
    case 'adicionar-item':     edicao.escolhendo = { modo: 'adicionar' }; desenhar(); break;
    case 'voltar-edicao':      edicao.escolhendo = null; desenhar(); break;
    case 'usar-exercicio':     usarExercicio(alvo.dataset.id); break;
    case 'criar-exercicio':    criarExercicioDigitado(); break;
    case 'apagar-sessao':      pedirApagarSessao(alvo.dataset.id); break;
    case 'descartar-atual':    pedirDescarte(); break;
    case 'fechar-historico':   fecharHistorico(); break;

    case 'carga-mais':         ajustarCarga(i, +1); break;
    case 'carga-menos':        ajustarCarga(i, -1); break;
    case 'carga-editar':       abrirCampoDeCarga(i); break;
    case 'carga-ok':           fecharCampoDeCarga(); break;
    case 'aceitar-sugestao':   sessao.itens[i].cargaAtualKg = Number(valor); salvarSessao(); desenhar(); break;

    case 'rep':                registrarSerie(i, Number(valor)); break;
    case 'rep-outro':          repsAmpliado = i; desenhar(); break;
    case 'rep-menos-opcoes':   repsAmpliado = null; desenhar(); break;

    case 'rir':                definirRir(i, Number(valor)); break;
    case 'desconforto':        definirDesconforto(i, valor); break;
    case 'regiao':             alternarRegiao(i, valor); break;
    case 'concluir-exercicio': concluirExercicio(i); break;

    case 'trocar-treino':      pedirTrocaDeTreino(); break;
    case 'concluir-treino':    pedirConclusaoDoTreino(); break;
    case 'confirmar':          executarConfirmacao(); break;
    case 'cancelar':           confirmando = null; backupParaRestaurar = null; desenhar(); break;

    case 'desfazer':           desfazer(); break;
    case 'backup':             exportarBackup(); break;
    case 'restaurar':          pedirBackup(); break;

    case 'mais-tempo':         if (cron) { cron.fim += 30000; cron.avisou = false; pintarCronometro(); } break;
    case 'pular-descanso':     pararDescanso(); break;

    case 'sessao-continuar':   perguntarSobrePendente = false; desenhar(); break;
    case 'sessao-incompleta':  arquivarSessao('incompleta'); break;
    case 'sessao-descartar':   pedirDescarte(); break;
  }
});

/* Campos de digitar. Eles gravam a cada letra e NÃO redesenham a
   tela, senão o teclado do celular fecharia no meio da digitação. */
document.addEventListener('input', function (evento) {
  const alvo = evento.target;
  const campo = alvo.dataset && alvo.dataset.campo;
  if (campo === 'obs') {
    sessao.itens[Number(alvo.dataset.i)].observacao = alvo.value;
    salvarSessao();
  } else if (campo === 'novo-exercicio') {
    nomeDigitado = alvo.value;
  } else if (campo === 'carga') {
    const valor = paraNumero(alvo.value);
    if (valor !== null) {
      sessao.itens[Number(alvo.dataset.i)].cargaAtualKg = valor;
      salvarSessao();
    }
  }
});

/* Enter no campo de carga vale como OK. */
document.addEventListener('keydown', function (evento) {
  if (evento.key === 'Enter' && evento.target.dataset && evento.target.dataset.campo === 'carga') {
    evento.preventDefault();
    fecharCampoDeCarga();
  }
});

/* Arquivo de backup escolhido na busca de arquivos. */
document.getElementById('arquivo-backup').addEventListener('change', function (evento) {
  lerArquivoDeBackup(evento.target.files[0]);
  evento.target.value = '';   // limpa, para dar para escolher o mesmo arquivo de novo
});

/* Se o celular bloquear ou você trocar de app, grava na hora.
   visibilitychange [navegador] avisa quando a página some da vista. */
document.addEventListener('visibilitychange', function () {
  if (document.hidden) salvarSessao();
});


/* =============================================================
   10. INÍCIO
   ============================================================= */

/* Liga o ajudante que guarda o app no celular (o service worker do
   arquivo sw.js). Só funciona em endereço https ou no localhost; se
   você abriu o arquivo direto do disco, esta parte é ignorada e o
   app roda igual, só sem o ícone na tela inicial. */
if ('serviceWorker' in navigator && location.protocol.indexOf('http') === 0) {
  navigator.serviceWorker.register('sw.js').catch(function () {
    /* silêncio de propósito: falhar aqui não pode atrapalhar o treino */
  });
}

banco = lerBanco();
completarComSementes();

const salva = lerSessaoSalva();
if (salva) {
  sessao = salva;
  // sessão de outro dia ou parada há horas: o app pergunta, não decide
  perguntarSobrePendente = sessaoPrecisaDeDecisao(salva);
} else {
  sessao = criarSessao(proximoTreinoId());
}

desenhar();
