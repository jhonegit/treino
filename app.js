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
let backupParaRestaurar = null;     // arquivo lido, esperando confirmação
let estadoAntesDaRestauracao = null; // retrato para o Desfazer da restauração
let cron = null;           // cronômetro de descanso
let relogioId = null;      // identificador do setInterval do cronômetro
let desfazerId = null;     // identificador do sumiço da faixa

const RIR_MINIMO_PARA_SUBIR = 2;   // folga mínima para a sessão contar
const RIR_CARGA_LEVE        = 4;   // daqui para cima, uma sessão só já basta
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

/* Duas regras de sugestão, e são as únicas. Nada aqui é conselho
   médico nem regra universal: foi o que nós dois combinamos.

   1. CARGA LEVE (caminho curto). Uma sessão só, com todas as séries no
      topo da faixa e RIR 4 ou mais, já indica que o peso está folgado
      demais. Sugere na próxima sessão, sem esperar a segunda.

   2. PROGRESSÃO DUPLA (caminho normal). Duas sessões seguidas fechando
      o topo com folga (RIR 2 ou mais) e a MESMA carga nas duas. Se a
      carga mudou no meio, a contagem recomeça.

   Devolve { carga, motivo } ou null quando não há o que sugerir. */
function sugestaoDeCarga(itemDoTreino) {
  const exercicio = acharExercicio(itemDoTreino.exercicioId);
  if (exercicio.semCarga) return null;

  const ultimas = execucoesDe(itemDoTreino.exercicioId).slice(0, SESSOES_NO_TOPO);
  if (ultimas.length === 0) return null;

  const salto = exercicio.incrementoKg || banco.config.incrementoPadraoKg;
  const somar = carga => Math.round((carga + salto) * 100) / 100;   // Math.round [nativo]

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
  desenhar();
}

function fecharHistorico() {
  historicoAberto = null;
  desenhar();
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
      '<button class="btn-pequeno" data-acao="trocar-treino">Trocar treino</button>' +
    '</div>';

  /* --- sessão pendente toma a tela --- */
  if (perguntarSobrePendente) {
    document.getElementById('conteudo').innerHTML = desenharConfirmacao() + desenharAviso();
    document.getElementById('rodape').innerHTML = '';
    desenharHistorico();
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
      '<button class="btn-pequeno" data-acao="backup">Salvar backup</button>' +
      '<button class="btn-pequeno" data-acao="restaurar">Restaurar backup</button>' +
    '</div>';

  desenharHistorico();

  /* o campo de carga precisa receber o cursor depois de desenhado */
  if (editandoCarga !== null) {
    const campo = document.querySelector('[data-campo="carga"]');  // querySelector [navegador]
    if (campo) { campo.focus(); campo.select(); }
  }
}

/* Painel do histórico: sobe por cima da tela, sem tirar você do treino.
   Ele fica ABAIXO da barra do cronômetro de propósito, para você poder
   olhar o histórico enquanto o descanso corre. */
function desenharHistorico() {
  const caixa = document.getElementById('historico');
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

  caixa.classList.remove('oculto');
  caixa.innerHTML =
    '<div class="topo-historico">' +
      '<div><h2>' + esc(exercicio.nome) + '</h2>' +
      '<div class="resumo-historico">' + resumo + '</div></div>' +
      '<button class="btn-laranja" data-acao="fechar-historico">Fechar</button>' +
    '</div>' +
    '<div class="lista-historico">' +
      (feitos.length ? linhas : '<div class="vazio">Nenhuma sessão registrada ainda.</div>') +
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
      : 'Duas sessões no topo. Dá para testar <b>' + numero(sugerida.carga) + ' kg</b>.';
    html += '<div class="sugestao">' +
      '<span>' + recado + '</span>' +
      '<button class="btn-pequeno btn-laranja" data-acao="aceitar-sugestao" data-i="' + i +
        '" data-valor="' + sugerida.carga + '">Usar</button>' +
      '</div>';
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

    html += '<div class="bloco"><div class="rotulo">Desconforto</div><div class="fileira">' +
      NIVEIS.map(n => {
        const escolhido = nivel === n.id;
        const ruim = escolhido && (n.id === 'moderado' || n.id === 'forte');
        return '<button data-acao="desconforto" data-i="' + i + '" data-valor="' + n.id + '"' +
          (escolhido ? ' class="escolhido' + (ruim ? ' ruim' : '') + '"' : '') + '>' + n.texto + '</button>';
      }).join('') + '</div></div>';

    if (nivel && nivel !== 'sem') {
      html += '<div class="bloco"><div class="rotulo">Região (opcional)</div><div class="fileira">' +
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
