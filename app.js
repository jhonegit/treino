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

/* As chaves têm o id da PESSOA no meio:
     treino.banco.jhone          treino.banco.eliete
     treino.sessaoAtual.jhone    treino.sessaoAtual.eliete
     treino.foto.jhone.esteira

   As chaves sem id no meio (treino.banco, treino.sessaoAtual) são do
   formato antigo, de quando o app tinha uma pessoa só. Depois da
   migração elas continuam guardadas no aparelho de propósito: são a
   cópia de segurança do estado anterior. Nada é apagado. */

const CHAVE_PERFIS = 'treino.perfis';       // quem são as pessoas do app
const RAIZ_BANCO   = 'treino.banco';        // catálogo + treinos já feitos
const RAIZ_SESSAO  = 'treino.sessaoAtual';  // o treino de agora
const RAIZ_FOTO    = 'treino.foto.';        // uma chave por aparelho

/* A copia guardada antes da ficha nova de 11/09/2026, que e de UMA
   pessoa so: ela nasceu antes dos perfis existirem. Continua aqui
   como rede de seguranca. Ver guardarCopiaDeSeguranca. */
const CHAVE_COPIA  = 'treino.copiaAntesDaFicha4';

const VERSAO_DO_FORMATO = 3;   // 3 = formato com perfis

/* Enquanto a migração não terminar bem, o primeiro perfil continua
   lendo e gravando nas chaves antigas. O app funciona igual e nada
   fica pela metade. */
function modoAntigo(id) {
  return !!(perfis && perfis.provisorio && perfis.lista[0] && id === perfis.lista[0].id);
}

function chaveBanco(id)  { return modoAntigo(id) ? RAIZ_BANCO  : RAIZ_BANCO  + '.' + id; }
function chaveSessao(id) { return modoAntigo(id) ? RAIZ_SESSAO : RAIZ_SESSAO + '.' + id; }
function prefixoFoto(id) { return modoAntigo(id) ? RAIZ_FOTO   : RAIZ_FOTO   + id + '.'; }

function comoJson(texto) {
  if (!texto) return null;
  try { return JSON.parse(texto); } catch (erro) { return null; }   // JSON.parse [nativo]
}

/* Todas as chaves da gaveta que começam com um pedaço de texto.
   localStorage.key e .length [navegador] servem para varrer a gaveta. */
function chavesComPrefixo(prefixo) {
  const chaves = [];
  for (let i = 0; i < localStorage.length; i++) {
    const chave = localStorage.key(i);
    if (chave && chave.indexOf(prefixo) === 0) chaves.push(chave);
  }
  return chaves;
}

/* Um banco só é banco se tiver as três listas. Serve para conferir
   arquivo de backup e também dado salvo que voltou estragado. */
function bancoValido(b) {
  return !!b && typeof b === 'object' &&
    Array.isArray(b.exercicios) && Array.isArray(b.treinos) && Array.isArray(b.sessoes);
}


/* ---------- perfis ---------- */

function salvarPerfis() {
  if (perfis.provisorio) return;
  localStorage.setItem(CHAVE_PERFIS, JSON.stringify(perfis));
}

function acharPerfil(id)  { return perfis.lista.find(p => p.id === id) || null; }
function perfilAtual()    { return acharPerfil(perfilId) || perfis.lista[0]; }
function nomeDoPerfil(id) { const p = acharPerfil(id); return p ? p.nome : id; }

function sementeDoPerfil(id) {
  const p = acharPerfil(id);
  return SEMENTES[(p && p.sementes) || id] || DADOS_INICIAIS;
}

/* A MIGRAÇÃO para o formato com perfis.
   Três promessas: não apaga nada, roda uma vez só, e só se dá por
   concluída depois de reler e conferir o que acabou de gravar. Se
   qualquer passo falhar, desfaz o que escreveu e o app segue no
   formato antigo, com os dados inteiros. */
function migrarParaPerfis() {
  const salvo = comoJson(localStorage.getItem(CHAVE_PERFIS));
  if (salvo && Array.isArray(salvo.lista) && salvo.versaoDoFormato >= VERSAO_DO_FORMATO) {
    return salvo;   // já migrado: nada a fazer
  }

  const novos = JSON.parse(JSON.stringify(PERFIS_INICIAIS));
  const dono = novos.lista[0].id;          // quem herda os dados antigos
  const escritas = [];                     // para desfazer se algo falhar

  const antigoTexto = localStorage.getItem(RAIZ_BANCO);
  const jaTemNovo = localStorage.getItem(RAIZ_BANCO + '.' + dono);

  if (antigoTexto && !jaTemNovo) {
    const antigo = comoJson(antigoTexto);
    if (!bancoValido(antigo)) {
      /* dado antigo ilegível: não escrevemos e não apagamos nada */
      avisoDeDados = 'Não consegui ler os dados antigos guardados neste aparelho. ' +
        'Nada foi apagado. Antes de registrar qualquer coisa, salve um backup.';
      novos.provisorio = true;
      return novos;
    }
    try {
      localStorage.setItem(RAIZ_BANCO + '.' + dono, antigoTexto);
      escritas.push(RAIZ_BANCO + '.' + dono);

      const sessaoTexto = localStorage.getItem(RAIZ_SESSAO);
      if (sessaoTexto) {
        localStorage.setItem(RAIZ_SESSAO + '.' + dono, sessaoTexto);
        escritas.push(RAIZ_SESSAO + '.' + dono);
      }

      /* treino.foto.esteira passa a ser treino.foto.jhone.esteira */
      chavesComPrefixo(RAIZ_FOTO).forEach(chave => {
        const resto = chave.slice(RAIZ_FOTO.length);
        if (resto.indexOf('.') >= 0) return;              // já pertence a um perfil
        const nova = RAIZ_FOTO + dono + '.' + resto;
        localStorage.setItem(nova, localStorage.getItem(chave));
        escritas.push(nova);
      });

      /* conferência: releu, continua sendo banco, e nenhum treino sumiu */
      const conferido = comoJson(localStorage.getItem(RAIZ_BANCO + '.' + dono));
      if (!bancoValido(conferido) || conferido.sessoes.length !== antigo.sessoes.length) {
        throw new Error('a conferência do que foi gravado não bateu');
      }
    } catch (erro) {
      escritas.forEach(chave => localStorage.removeItem(chave));
      avisoDeDados = 'Não consegui preparar os perfis neste aparelho, provavelmente ' +
        'por falta de espaço. Nada foi apagado e o app continua funcionando no ' +
        'formato antigo. Salve um backup e abra de novo.';
      novos.provisorio = true;
      return novos;
    }
  }

  /* a partir daqui a migração está fechada e gravada */
  localStorage.setItem(CHAVE_PERFIS, JSON.stringify(novos));
  return novos;
}


/* ---------- banco e sessão do perfil aberto ---------- */

function lerBanco() {
  const texto = localStorage.getItem(chaveBanco(perfilId));
  if (!texto) {
    // primeira abertura deste perfil: copia a semente do dados-iniciais.js
    // JSON.parse e JSON.stringify [nativo] fazem uma cópia de verdade
    const novo = JSON.parse(JSON.stringify(sementeDoPerfil(perfilId)));
    localStorage.setItem(chaveBanco(perfilId), JSON.stringify(novo));
    return novo;
  }
  const guardado = comoJson(texto);
  if (bancoValido(guardado)) return guardado;

  /* texto salvo ilegível. Em vez de trocar por um banco vazio (que
     pareceria perda de dados), o app tranca a gravação, avisa, e
     desenha a ficha de origem só para a tela ter o que mostrar. */
  dadosTrancados = true;
  avisoDeDados = 'Os dados salvos de ' + nomeDoPerfil(perfilId) + ' vieram ilegíveis. ' +
    'Nada foi apagado e o app não vai gravar por cima. Restaure um backup.';
  return JSON.parse(JSON.stringify(sementeDoPerfil(perfilId)));
}

function salvarBanco() {
  if (dadosTrancados) return;
  try {
    localStorage.setItem(chaveBanco(perfilId), JSON.stringify(banco));
  } catch (erro) {
    mostrarFaixa('Sem espaço para gravar. Salve um backup.', false);
  }
}

/* O banco só é copiado da semente na PRIMEIRA abertura do perfil.
   Quando o app ganha um campo novo, quem já usava ficaria sem ele.
   Esta função completa o que falta, sem encostar no que foi
   registrado e SEM reescrever nome de exercício toda vez que abre. */
function completarComSementes() {
  const semente = sementeDoPerfil(perfilId);
  let mudou = false;

  /* ficha esperando o fim do treino pertence a UMA pessoa. Ao abrir o
     banco de alguem, a marca recomeca do zero e e remarcada abaixo se
     for o caso. Assim ela nunca atravessa de um perfil para o outro. */
  fichaPendente = false;

  /* lugares que passaram a existir depois */
  if (!Array.isArray(banco.caminhadas)) { banco.caminhadas = []; mudou = true; }
  if (!banco.config) { banco.config = {}; mudou = true; }
  ['regraProgressao', 'metaSemanalMin', 'fase', 'telasDeAcompanhamento', 'incrementoPadraoKg']
    .forEach(campo => {
      if (banco.config[campo] === undefined && semente.config[campo] !== undefined) {
        banco.config[campo] = semente.config[campo];
        mudou = true;
      }
    });
  if (!banco.config.regraProgressao) { banco.config.regraProgressao = 'classica'; mudou = true; }

  /* exercício ou treino que a semente ganhou depois entra no catálogo.
     O que já existe NÃO é reescrito: nome trocado por você fica. */
  semente.exercicios.forEach(s => {
    if (!banco.exercicios.find(e => e.id === s.id)) {
      banco.exercicios.push(JSON.parse(JSON.stringify(s)));
      mudou = true;
    }
  });
  semente.treinos.forEach(s => {
    if (!banco.treinos.find(t => t.id === s.id)) {
      banco.treinos.push(JSON.parse(JSON.stringify(s)));
      mudou = true;
    }
  });

  /* Desenho que FALTA e buraco, nao escolha sua: e sempre recolocado.
     Trocar um desenho antigo pelo novo, isso sim so acontece quando a
     versao dos dados sobe. E o NOME nunca e reescrito por conta propria. */
  semente.exercicios.forEach(s => {
    const meu = banco.exercicios.find(e => e.id === s.id);
    if (meu && !meu.ilustracao && s.ilustracao) { meu.ilustracao = s.ilustracao; mudou = true; }
  });

  banco.sessoes.forEach((s, n) => {
    if (!s.id) { s.id = 's' + n + '-' + (s.data || '').replace(/-/g, ''); mudou = true; }
  });

  /* Mudança de versão dos dados. Cada número novo é uma correção que
     precisa alcançar quem já vinha usando o app, e roda UMA vez.
     Versão 2 (04/09/2026): a carga passou a subir de 1 em 1 kg, porque
     as anilhas da academia não fecham de 2,5 em 2,5. */
  const versaoSalva = banco.versaoDosDados || 1;

  /* Os passos abaixo sao correcoes da ficha DELE, que existia antes dos
     perfis. Por isso todos conferem fichaDele: nenhum pode encostar no
     banco de outra pessoa. Quem nasce depois ja nasce na versao atual. */
  const fichaDele = semente === DADOS_INICIAIS;

  if (fichaDele && versaoSalva < 2) {
    DADOS_INICIAIS.exercicios.forEach(s => {
      const meu = banco.exercicios.find(e => e.id === s.id);
      if (!meu) return;
      meu.ilustracao = s.ilustracao;                       // o desenho e do app
      meu.incrementoKg = s.incrementoKg;
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
  if (fichaDele && versaoSalva < 3) {
    DADOS_INICIAIS.exercicios.forEach(semente => {
      const meu = banco.exercicios.find(e => e.id === semente.id);
      if (meu) meu.incrementoKg = semente.incrementoKg;
    });
    banco.versaoDosDados = 3;
    mudou = true;
  }

  /* Versão 4 (11/09/2026): a ficha nova. Saíram Smith, goblet, romeno e o
     exercício de tronco; entraram leg press (no A e no C, mesmo id, mesmo
     histórico), abdominal curto e rosca com halteres sentado. Os que saíram
     continuam no catálogo, com o histórico intacto.

     Esta é a única parte que reescreve a LISTA DO DIA. Ela roda uma vez só:
     quando termina, versaoDosDados vira 4 e nunca mais volta aqui. */
  if (fichaDele && versaoSalva < 4) {
    if (mudou) salvarBanco();
    aplicarFichaNova();
    return;
  }

  if (mudou) salvarBanco();
}

/* A ficha nova não pode entrar no meio de um treino: os cartões da tela
   são a lista do dia casada com o que você já registrou, posição por
   posição. Trocar a lista ali embaralharia tudo. Então, se houver treino
   em andamento, a troca fica esperando e acontece quando ele encerrar. */
let fichaPendente = false;

/* Antes de reescrever a lista do dia, guarda uma cópia recuperável do
   banco inteiro numa chave separada. Só a primeira vez: se a cópia já
   existe, ela é a boa e não pode ser sobrescrita por uma mais nova. */
function guardarCopiaDeSeguranca() {
  try {
    if (localStorage.getItem(CHAVE_COPIA)) return;
    localStorage.setItem(CHAVE_COPIA, JSON.stringify({
      app: 'treino', motivo: 'antes da ficha de 11/09/2026',
      salvoEm: new Date().toISOString(),               // Date [nativo]
      banco: banco
    }));
  } catch (erro) { /* gaveta cheia: segue sem a cópia, sem travar o app */ }
}

function aplicarFichaNova() {
  /* trava de seguranca: esta ficha e a dele. Se por algum caminho ela
     for chamada com outro perfil aberto, nao faz nada. */
  if (sementeDoPerfil(perfilId) !== DADOS_INICIAIS) return;

  const emAndamento = lerSessaoSalva();
  if (emAndamento && sessaoTemRegistro(emAndamento)) { fichaPendente = true; return; }

  guardarCopiaDeSeguranca();

  /* troca só a lista de exercícios de cada treino; nome e ordem ficam.
     Sessões não são tocadas: o que você treinou está guardado dentro da
     própria sessão e não depende desta lista para ser mostrado. */
  DADOS_INICIAIS.treinos.forEach(semente => {
    const meu = banco.treinos.find(t => t.id === semente.id);
    if (meu) meu.itens = JSON.parse(JSON.stringify(semente.itens));
    else banco.treinos.push(JSON.parse(JSON.stringify(semente)));
  });

  /* as orientações do exercício (leg press, extensora) pertencem ao app,
     como as ilustrações: seguem as sementes. */
  DADOS_INICIAIS.exercicios.forEach(semente => {
    const meu = banco.exercicios.find(e => e.id === semente.id);
    if (meu) meu.instrucoes = semente.instrucoes;
  });

  banco.versaoDosDados = 4;
  salvarBanco();
}

/* Chamada toda vez que um treino termina, de qualquer jeito. Se não havia
   ficha esperando, não faz nada. */
function aplicarFichaPendente() {
  if (!fichaPendente) return;
  fichaPendente = false;
  aplicarFichaNova();
}

function lerSessaoSalva() {
  return comoJson(localStorage.getItem(chaveSessao(perfilId)));
}

/* Grava a sessão a cada toque. Se ela ainda está zerada, não grava:
   só espiar o app não deve criar treino pendente. */
function salvarSessao() {
  if (!sessao || dadosTrancados) return;
  if (!sessaoTemRegistro(sessao)) {
    localStorage.removeItem(chaveSessao(perfilId));
    return;
  }
  sessao.atualizadaEm = new Date().toISOString();  // Date [nativo]
  try {
    localStorage.setItem(chaveSessao(perfilId), JSON.stringify(sessao));
  } catch (erro) {
    mostrarFaixa('Sem espaço para gravar. Salve um backup.', false);
  }
}

function apagarSessaoSalva() {
  localStorage.removeItem(chaveSessao(perfilId));
}


/* ---------- trocar de pessoa ---------- */

/* Guarda o que está aberto, fecha tudo que é de tela e abre o outro
   perfil do zero. Nada de um perfil sobra no outro: nem cronômetro,
   nem Desfazer, nem edição, nem pergunta pela metade. */
function trocarPerfil(id) {
  if (!acharPerfil(id) || id === perfilId) return;

  salvarSessao();

  perfilId = id;
  perfis.perfilAtual = id;
  salvarPerfis();

  dadosTrancados = false;
  avisoDeDados = null;
  banco = lerBanco();
  completarComSementes();

  const salva = lerSessaoSalva();
  sessao = salva || criarSessao(proximoTreinoId());
  perguntarSobrePendente = salva ? sessaoPrecisaDeDecisao(salva) : false;

  limparTelaAoTrocar();
  aplicarTema();
  desenhar();
  mostrarFaixa('Agora é o treino de ' + nomeDoPerfil(id), false);
}

function limparTelaAoTrocar() {
  ultimaAcao = null;
  confirmando = null;
  editandoCarga = null;
  serieEsperandoCarga = null;
  repsAmpliado = null;
  historicoAberto = null;
  listaAberta = false;
  painelAberto = null;
  edicao = null;
  sessaoApagada = null;
  caminhadaApagada = null;
  nomeDigitado = '';
  backupParaRestaurar = null;
  estadoAntesDaRestauracao = null;
  Object.keys(cacheDeFotos).forEach(k => delete cacheDeFotos[k]);
  pararDescanso();
  esconderFaixa();
}

function renomearPerfil(id, nome) {
  const p = acharPerfil(id);
  const limpo = String(nome || '').trim().slice(0, 20);
  if (!p || !limpo) return;
  p.nome = limpo;
  salvarPerfis();
}

/* A cor da tela vem do perfil: laranja num, rosa no outro.
   O estilo.css já tem as duas paletas; aqui só dizemos qual vale. */
function aplicarTema() {
  const tema = perfilAtual().tema || 'laranja';
  if (document.documentElement && document.documentElement.setAttribute) {
    document.documentElement.setAttribute('data-tema', tema);
  }
  const marca = document.querySelector('meta[name="theme-color"]');
  if (marca) marca.setAttribute('content', tema === 'rosa' ? '#d6417f' : '#f4551e');
}


/* =============================================================
   2. ESTADO
   ============================================================= */

let perfis;                // a lista de pessoas do app
let perfilId;              // a pessoa aberta agora
let dadosTrancados = false;// dado salvo ilegível: o app não grava por cima
let avisoDeDados = null;   // recado fixo no topo, quando algo deu errado

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
let painelAberto = null;            // 'perfis', 'caminhadas', 'resumo' ou 'plano'
let minutosDigitados = '';          // minutos da caminhada, enquanto são escritos
let obsDaCaminhada = '';            // observação da caminhada, enquanto é escrita
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

/* O que o número da carga significa. Isto NÃO é convertido de um
   para o outro: placa não vira quilo sem alguém informar. */
const UNIDADES = {
  'kg':        { curto: 'kg',           rotulo: 'Carga de hoje',                 passo: 'kg' },
  'kg-halter': { curto: 'kg por halter', rotulo: 'Carga de hoje (peso de UM halter)', passo: 'kg' },
  'placa':     { curto: 'placa',        rotulo: 'Carga de hoje (número da placa)', passo: 'placa' }
};

/* Passos de carga oferecidos quando o aparelho ainda não tem um. */
const PASSOS_DE_CARGA = [1, 2, 2.5, 5];

const DIAS_PARA_RESUMO = 14;   // depois disso o app oferece a revisão


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

/* Este perfil usa a regra de progressão mais cautelosa? */
function regraCautelosa() {
  return banco.config.regraProgressao === 'cautelosa';
}

/* Este perfil mostra as telas de caminhada, resumo e plano? */
function temAcompanhamento() {
  return !!banco.config.telasDeAcompanhamento;
}

function unidadeDe(exercicio) {
  return UNIDADES[exercicio && exercicio.unidade] || UNIDADES['kg'];
}

/* "30 kg", "8 kg por halter", "4 placa". Sempre com a unidade junto,
   para ninguém confundir número de placa com quilo. */
function cargaEscrita(valor, unidade) {
  const u = UNIDADES[unidade] || UNIDADES['kg'];
  return numero(valor) + ' ' + u.curto;
}

/* O passo de carga daquele aparelho, ou null quando ainda não foi
   informado. Null é resposta legítima: o app não chuta um valor. */
function passoDeCarga(exercicio) {
  if (typeof exercicio.incrementoKg === 'number' && exercicio.incrementoKg > 0) {
    return exercicio.incrementoKg;
  }
  const padrao = banco.config.incrementoPadraoKg;
  return (typeof padrao === 'number' && padrao > 0) ? padrao : null;
}

/* Para os botões − e + do cartão é preciso algum passo. Usar 1 aqui
   não é sugerir carga: é ela mesma mexendo e vendo o número mudar. */
function passoManual(exercicio) {
  return passoDeCarga(exercicio) || 1;
}

/* O RETRATO guarda, dentro da sessão, como o exercício era naquele
   dia: nome, unidade, quantas séries e qual faixa estavam pedidas.
   É o que impede o histórico de ser reescrito quando a ficha muda. */
function retratoDoItem(itemDoTreino, exercicio) {
  return {
    nome: exercicio.nome,
    unidade: exercicio.unidade || 'kg',
    semCarga: !!exercicio.semCarga,
    porLado: !!exercicio.porLado,
    series: itemDoTreino.series,
    repMin: itemDoTreino.repMin,
    repMax: itemDoTreino.repMax
  };
}

/* O nome que o histórico deve mostrar: o do dia em que foi feito.
   Registro antigo, de antes do retrato, fica marcado como antigo. */
function nomeNoHistorico(item) {
  if (item.retrato && item.retrato.nome) return item.retrato.nome;
  const exercicio = acharExercicio(item.exercicioId);
  return exercicio ? exercicio.nome : item.exercicioId;
}

/* Aquela execução foi feita com a MESMA prescrição de hoje?
   Mudou faixa, número de séries ou unidade, a comparação recomeça. */
function prescricaoIgual(retrato, itemDoTreino, exercicio) {
  if (!retrato) return false;
  return retrato.series === itemDoTreino.series &&
         retrato.repMin === itemDoTreino.repMin &&
         retrato.repMax === itemDoTreino.repMax &&
         (retrato.unidade || 'kg') === (exercicio.unidade || 'kg') &&
         !!retrato.porLado === !!exercicio.porLado;
}

function itemPulado(item)  { return !!item.pulado; }

/* Três coisas diferentes, que não podem virar a mesma:
     pulado                    = não realizou
     concluído e sem séries    = realizou e não registrou
     com séries                = realizou e registrou */
function situacaoDoItem(item) {
  if (item.pulado) return 'pulado';
  if (item.series.length) return 'registrado';
  if (item.concluido) return 'sem-registro';
  return 'aberto';
}


/* ---------- semana e caminhadas ---------- */

/* A segunda-feira da semana daquela data, no formato 2026-09-07. */
function inicioDaSemana(d) {
  const dia = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  dia.setDate(dia.getDate() - ((dia.getDay() + 6) % 7));   // segunda = 0
  return dataLocal(dia);
}

function caminhadasDaSemana() {
  const desde = inicioDaSemana(new Date());
  return (banco.caminhadas || []).filter(c => c.data >= desde);
}

function minutosDaSemana() {
  return caminhadasDaSemana().reduce((soma, c) => soma + (c.minutos || 0), 0);
}

/* O período de revisão começa no uso de verdade, não numa data
   escrita no código: o primeiro dia com treino ou caminhada. */
function primeiroDiaDeUso() {
  const datas = banco.sessoes.map(s => s.data)
    .concat((banco.caminhadas || []).map(c => c.data))
    .filter(Boolean).sort();
  return datas.length ? datas[0] : null;
}

function diasDeUso() {
  const inicio = primeiroDiaDeUso();
  if (!inicio) return 0;
  const p = inicio.split('-');
  const dia0 = new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
  const hoje = new Date();
  return Math.floor((hoje - dia0) / 86400000) + 1;
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
  if (regraCautelosa()) return sugestaoCautelosa(itemDoTreino);

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


/* ---------- a regra cautelosa (perfil de quem está começando) ----------

   Ela é mais exigente que a de cima, de propósito, e NUNCA inventa um
   número. Para sair uma carga sugerida, tudo isto junto:

     - o exercício tem carga;
     - a fase informada não é gestação;
     - as duas execuções mais recentes são comparáveis: mesmo aparelho
       (o id é o aparelho), mesma unidade, mesmas séries e mesma faixa;
     - nas duas, todas as séries de trabalho no topo da faixa ou acima;
     - RIR informado, 2 ou mais, na última série das duas;
     - execução marcada como boa nas duas;
     - nenhum desconforto registrado nas duas;
     - a mesma carga nas duas;
     - e o passo de carga daquele aparelho já foi informado.

   Faltou o passo de carga? Sai o recado sem número. Faltou RIR, ou a
   série ficou incompleta, ou a carga mudou? Não sai nada. */

function fechouOTopoCauteloso(item, itemDoTreino, exercicio) {
  if (!prescricaoIgual(item.retrato, itemDoTreino, exercicio)) return false;
  if (item.series.length < itemDoTreino.series) return false;
  if (!item.series.every(s => s.reps >= itemDoTreino.repMax)) return false;

  const rir = rirDoItem(item);
  if (rir === null || rir < RIR_MINIMO_PARA_SUBIR) return false;

  const nivel = item.desconforto && item.desconforto.nivel;
  if (nivel && nivel !== 'sem') return false;        // qualquer desconforto suspende

  if (item.execucao !== 'boa') return false;         // execução precisa ser informada
  return true;
}

function sugestaoCautelosa(itemDoTreino) {
  const exercicio = acharExercicio(itemDoTreino.exercicioId);
  if (exercicio.semCarga) return null;
  if (banco.config.fase === 'gestacao') return null;

  const ultimas = execucoesDe(itemDoTreino.exercicioId).slice(0, SESSOES_NO_TOPO);
  if (ultimas.length === 0) return null;

  const fecharam = ultimas.filter(e => fechouOTopoCauteloso(e.item, itemDoTreino, exercicio));

  /* 1. duas execuções comparáveis e iguais: aí sim pode sair número */
  if (ultimas.length >= SESSOES_NO_TOPO && fecharam.length >= SESSOES_NO_TOPO) {
    const cargas = ultimas.map(e => cargaDoItem(e.item));
    if (!cargas.some(c => c === null) && cargas.every(c => c === cargas[0])) {
      const salto = passoDeCarga(exercicio);
      if (salto === null) {
        return { carga: null, motivo: 'sem-passo' };
      }
      return {
        carga: Math.round((cargas[0] + salto) * 100) / 100,
        motivo: 'dupla',
        unidade: exercicio.unidade || 'kg'
      };
    }
  }

  /* 2. carga que parece folgada: recado, sem número e sem atalho */
  if (fecharam.length && rirDoItem(ultimas[0].item) >= RIR_CARGA_LEVE) {
    return { carga: null, motivo: 'parece-leve' };
  }

  return null;
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
    itens: treino.itens.map(it => itemNovoDaSessao(it))
  };
}

/* Um exercício dentro do treino de hoje. O retrato guarda como ele
   estava pedido agora, para o histórico nunca ser reescrito depois. */
function itemNovoDaSessao(itemDoTreino) {
  const exercicio = acharExercicio(itemDoTreino.exercicioId);
  const anteriores = execucoesDe(itemDoTreino.exercicioId);
  // a carga já entra preenchida com a da última vez: zero toque
  const carga = anteriores.length ? cargaDoItem(anteriores[0].item) : null;
  return {
    exercicioId: itemDoTreino.exercicioId,
    retrato: retratoDoItem(itemDoTreino, exercicio),
    cargaAtualKg: exercicio.semCarga ? null : carga,
    series: [],
    desconforto: { nivel: null, regioes: [] },
    execucao: null,        // 'boa' ou 'melhorar', informado por quem treina
    pulado: false,         // não realizado, que é diferente de não registrado
    motivoDoPulo: '',
    observacao: '',
    concluido: false
  };
}

function ajustarCarga(i, delta) {
  const item = sessao.itens[i];
  const exercicio = acharExercicio(item.exercicioId);
  const base = typeof item.cargaAtualKg === 'number' ? item.cargaAtualKg : 0;
  const salto = passoManual(exercicio);
  item.cargaAtualKg = Math.max(0, Math.round((base + delta * salto) * 100) / 100);
  salvarSessao();
  desenhar();
}

/* Informar o passo daquele aparelho. Enquanto isso não acontece,
   nenhuma carga sugerida sai com número. */
function definirPassoDeCarga(exercicioId, passo) {
  const exercicio = acharExercicio(exercicioId);
  if (!exercicio) return;
  exercicio.incrementoKg = passo;
  salvarBanco();
  desenhar();
  mostrarFaixa('Passo do aparelho: ' + numero(passo), false);
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
  if (!exercicio.semCarga) {
    serie.cargaKg = item.cargaAtualKg;
    serie.unidade = exercicio.unidade || 'kg';   // fica gravado no registro
  }
  if (exercicio.porLado) serie.porLado = true;   // 8 quer dizer 8 de cada lado
  item.series.push(serie);

  if (item.pulado) { item.pulado = false; item.motivoDoPulo = ''; }
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

/* Como a execução foi, na avaliação de quem treinou. Entra na regra
   cautelosa: sem "boa" informado, não sai sugestão de aumento. */
function definirExecucao(i, valor) {
  const item = sessao.itens[i];
  item.execucao = (item.execucao === valor) ? null : valor;
  salvarSessao();
  desenhar();
}

/* NÃO REALIZADO é diferente de realizado sem registrar. Marcar aqui
   não cria série nenhuma, e o histórico não fica devendo nada. */
function pularExercicio(i) {
  const item = sessao.itens[i];
  if (item.series.length) {
    mostrarFaixa('Este exercício já tem série registrada hoje', false);
    return;
  }
  item.pulado = true;
  item.concluido = true;
  const proximo = sessao.itens.findIndex(it => !it.concluido);
  sessao.itemAberto = proximo >= 0 ? proximo : i;
  ultimaAcao = { tipo: 'pular', i: i };
  salvarSessao();
  desenhar();
  mostrarFaixa('Marcado como não realizado', true);
}

function desmarcarPulo(i) {
  const item = sessao.itens[i];
  item.pulado = false;
  item.motivoDoPulo = '';
  item.concluido = false;
  sessao.itemAberto = i;
  salvarSessao();
  desenhar();
}

/* Escolher o aparelho de verdade daquele lugar da ficha.
   Cada variante é um exercício separado, com histórico separado: o
   que já foi feito no aparelho anterior continua onde estava. A troca
   vale para os três treinos, para a identidade ficar a mesma em A, B
   e C, como pede a comparação entre sessões. */
function escolherVariante(i, novoId) {
  const antigo = sessao.itens[i].exercicioId;
  const novo = acharExercicio(novoId);
  if (!novo || novoId === antigo) return;

  const jaRegistrou = sessao.itens.some(it => it.exercicioId === antigo && it.series.length > 0);
  if (jaRegistrou) {
    mostrarFaixa('Hoje já tem série registrada neste exercício. Dá para escolher o aparelho na próxima sessão.', false);
    return;
  }

  banco.treinos.forEach(t => t.itens.forEach(it => {
    if (it.exercicioId === antigo) it.exercicioId = novoId;
  }));
  salvarBanco();

  const doTreino = acharTreino(sessao.treinoId).itens;
  sessao.itens.forEach((it, n) => {
    if (it.exercicioId === antigo) sessao.itens[n] = itemNovoDaSessao(doTreino[n]);
  });
  salvarSessao();
  desenhar();
  mostrarFaixa(novo.nome + '. O histórico do aparelho anterior continua guardado.', false);
}


/* ---------- caminhadas ----------
   Ficam separadas do treino de musculação de propósito: não empurram
   a fila A > B > C e não viram minuto de musculação nem o contrário. */

function registrarCaminhada() {
  const minutos = Math.round(paraNumero(minutosDigitados) || 0);
  if (!minutos || minutos < 1) {
    mostrarFaixa('Escreva quantos minutos você caminhou', false);
    return;
  }
  if (minutos > 600) {
    mostrarFaixa('Confira os minutos: o app aceita até 600', false);
    return;
  }
  banco.caminhadas.push({
    id: 'c' + Date.now(),
    data: dataLocal(),
    minutos: minutos,
    observacao: (obsDaCaminhada || '').trim().slice(0, 140)
  });
  minutosDigitados = '';
  obsDaCaminhada = '';
  salvarBanco();
  ultimaAcao = { tipo: 'caminhada' };
  desenhar();
  mostrarFaixa(minutos + ' minutos registrados', true);
}

let caminhadaApagada = null;

function apagarCaminhada(id) {
  const pos = banco.caminhadas.findIndex(c => c.id === id);
  if (pos < 0) return;
  caminhadaApagada = { posicao: pos, caminhada: banco.caminhadas[pos] };
  banco.caminhadas.splice(pos, 1);
  salvarBanco();
  ultimaAcao = { tipo: 'apagar-caminhada' };
  desenhar();
  mostrarFaixa('Caminhada apagada', true);
}

function mudarMetaSemanal(delta) {
  const atual = banco.config.metaSemanalMin || 0;
  banco.config.metaSemanalMin = Math.min(300, Math.max(0, atual + delta));
  salvarBanco();
  desenhar();
}

/* A fase é informada à mão e dá para voltar atrás. Marcar gestação
   suspende as sugestões automáticas de aumento e pede revisão com o
   acompanhamento pré-natal. Não apaga nada e não trava o registro. */
function mudarFase(nova) {
  banco.config.fase = nova;
  salvarBanco();
  confirmando = null;
  desenhar();
  mostrarFaixa(nova === 'gestacao'
    ? 'Sugestões automáticas de aumento suspensas'
    : 'Fase anterior à gestação', false);
}

function concluirExercicio(i) {
  sessao.itens[i].pulado = false;
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
  painelAberto = null;
  edicao = null;          // o painel mostra um de cada vez
  desenhar();
}

function abrirEdicao(treinoId) {
  edicao = { treinoId: treinoId, escolhendo: null };
  historicoAberto = null;
  listaAberta = false;
  painelAberto = null;
  desenhar();
}

function abrirListaDeTreinos() {
  listaAberta = true;
  historicoAberto = null;
  painelAberto = null;
  desenhar();
}

/* Os painéis novos: perfis, caminhadas, resumo e sobre o plano. */
function abrirPainel(nome) {
  painelAberto = nome;
  historicoAberto = null;
  listaAberta = false;
  edicao = null;
  /* olhar o resumo já conta como revisão feita: o convite do topo
     só volta depois de mais duas semanas de uso */
  if (nome === 'resumo' && primeiroDiaDeUso()) {
    banco.config.resumoVistoEm = dataLocal();
    salvarBanco();
  }
  desenhar();
}

function fecharHistorico() {
  historicoAberto = null;
  listaAberta = false;
  painelAberto = null;
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

/* A unidade de um registro: a que ficou gravada nele, não a de hoje. */
function unidadeDoItemRegistrado(item) {
  const comUnidade = item.series.filter(function (s) { return s.unidade; });
  if (comUnidade.length) return comUnidade[comUnidade.length - 1].unidade;
  return (item.retrato && item.retrato.unidade) || 'kg';
}

function desenharGrafico(execucoes, modo, unidade) {
  /* só entram no gráfico os registros da MESMA unidade do mais
     recente: placa e quilo não podem virar a mesma linha */
  const mesmos = execucoes.filter(function (e) {
    return unidadeDoItemRegistrado(e.item) === unidade;
  });

  /* do mais antigo para o mais novo, no máximo 15 pontos */
  const pontos = mesmos.slice(0, 15).reverse().map(function (e) {
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
  const sufixo = modo === 'volume' ? '' : ' ' + (UNIDADES[unidade] || UNIDADES['kg']).curto;

  return '<svg class="grafico" viewBox="0 0 320 126" role="img">' +
    '<line class="eixo" x1="' + E + '" y1="' + B + '" x2="' + D + '" y2="' + B + '" />' +
    '<text class="marca-eixo" x="4" y="' + (T + 4) + '">' + esc(numero(maior)) + '</text>' +
    '<text class="marca-eixo" x="4" y="' + (B + 4) + '">' + esc(numero(menor)) + '</text>' +
    '<polyline class="linha" points="' + linha + '" />' +
    bolinhas +
    '<text class="marca-eixo" x="' + E + '" y="120">' + dataCurta(pontos[0].data) + '</text>' +
    '<text class="marca-eixo fim" x="' + D + '" y="120">' + dataCurta(ultimo.data) + '</text>' +
    '<text class="valor-topo" x="' + D + '" y="' + Math.max(12, y(ultimo.valor) - 8).toFixed(1) + '">' +
      esc(numero(ultimo.valor)) + sufixo + '</text>' +
  '</svg>';
}

function blocoDoGrafico(execucoes, exercicio) {
  const unidade = execucoes.length
    ? unidadeDoItemRegistrado(execucoes[0].item)
    : (exercicio.unidade || 'kg');
  const porLado = execucoes.length
    ? !!(execucoes[0].item.retrato && execucoes[0].item.retrato.porLado)
    : !!exercicio.porLado;

  return '<div class="caixa-grafico">' +
    '<div class="abas-grafico">' +
      '<button class="btn-pequeno' + (graficoModo === 'carga' ? ' btn-destaque' : '') +
        '" data-acao="grafico-carga">Carga</button>' +
      '<button class="btn-pequeno' + (graficoModo === 'volume' ? ' btn-destaque' : '') +
        '" data-acao="grafico-volume">Volume</button>' +
    '</div>' +
    desenharGrafico(execucoes, graficoModo, unidade) +
    '<div class="legenda-grafico">' +
      (graficoModo === 'carga'
        ? 'Peso levantado em cada sessão, em ' + esc((UNIDADES[unidade] || UNIDADES['kg']).curto) + '.'
        : 'Peso vezes repetições somado em cada sessão, o trabalho do dia.') +
      (porLado ? ' As repetições são por lado.' : '') +
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
    const antigo = guardado[it.exercicioId];
    if (!antigo) return itemNovoDaSessao(it);
    /* o retrato só é atualizado enquanto nada foi registrado. Depois
       da primeira série ele fica congelado: mudar a ficha não muda o
       que já foi feito. */
    if (antigo.series.length === 0) {
      antigo.retrato = retratoDoItem(it, acharExercicio(it.exercicioId));
    }
    return antigo;
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
  aplicarFichaPendente();
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
  aplicarFichaPendente();   // a ficha nova, se estava esperando o fim do treino
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
  if (pedido.tipo === 'fase')            return mudarFase(pedido.valor);
  if (pedido.tipo === 'descartar') {
    apagarSessaoSalva();
    aplicarFichaPendente();
    perguntarSobrePendente = false;
    sessao = criarSessao(proximoTreinoId());
    desenhar();
    mostrarFaixa('Sessão descartada', false);
  }
}

/* =============================================================
   BACKUP

   O arquivo guarda a VERSÃO do formato, quem é cada pessoa e, de
   cada uma, o banco, o treino em andamento, as caminhadas e as
   fotos. Dá para salvar só quem está aberto ou todo mundo.

   Blob e URL.createObjectURL [navegador] montam um arquivo na
   memória e criam um endereço temporário para ele.
   ============================================================= */

function montarBackup(ids) {
  const dados = {};
  ids.forEach(id => {
    const guardado = (id === perfilId)
      ? banco
      : comoJson(localStorage.getItem(chaveBanco(id)));
    if (!bancoValido(guardado)) return;

    const prefixo = prefixoFoto(id);
    const fotos = {};
    chavesComPrefixo(prefixo).forEach(chave => {
      fotos[chave.slice(prefixo.length)] = localStorage.getItem(chave);
    });

    const perfil = acharPerfil(id);
    dados[id] = {
      nome: perfil ? perfil.nome : id,
      tema: perfil ? perfil.tema : 'laranja',
      sementes: perfil ? perfil.sementes : id,
      banco: guardado,
      sessaoAtual: comoJson(localStorage.getItem(chaveSessao(id))),
      fotos: fotos
    };
  });

  return {
    app: 'treino',
    versaoDoFormato: VERSAO_DO_FORMATO,
    salvoEm: new Date().toISOString(),
    dados: dados
  };
}

function baixarArquivo(nome, conteudo) {
  const arquivo = new Blob([conteudo], { type: 'application/json' });
  const endereco = URL.createObjectURL(arquivo);
  const link = document.createElement('a');
  link.href = endereco;
  link.download = nome;
  link.click();
  URL.revokeObjectURL(endereco);
}

function exportarBackup(tudo) {
  salvarSessao();
  const ids = tudo ? perfis.lista.map(p => p.id) : [perfilId];
  const pacote = montarBackup(ids);
  if (!Object.keys(pacote.dados).length) {
    mostrarFaixa('Não há nada para salvar ainda', false);
    return;
  }
  baixarArquivo(
    'treino-backup-' + (tudo ? 'todos' : perfilId) + '-' + dataLocal() + '.json',
    JSON.stringify(pacote, null, 2)
  );
  mostrarFaixa('Backup salvo na pasta de downloads', false);
}


/* ---------- restaurar um backup ---------- */

/* Abre a busca de arquivos do celular. É tela do sistema, não pop up. */
function pedirBackup() {
  document.getElementById('arquivo-backup').click();
}

/* Confere se o arquivo é mesmo um backup deste app, e de qual
   formato, antes de deixar qualquer coisa acontecer.
   Devolve null quando o arquivo não serve. */
function conferirBackup(texto) {
  const dados = comoJson(texto);
  if (!dados || typeof dados !== 'object') return null;

  /* formato com perfis: um banco por pessoa */
  if (dados.dados && typeof dados.dados === 'object') {
    const ids = Object.keys(dados.dados).filter(id => {
      const p = dados.dados[id];
      return p && bancoValido(p.banco);
    });
    if (!ids.length) return null;
    return { formato: 'perfis', ids: ids, dados: dados };
  }

  /* formato antigo: um banco só, sem dono escrito no arquivo */
  if (bancoValido(dados.banco)) return { formato: 'antigo', dados: dados };

  return null;
}

/* Lê o arquivo e monta a pergunta na tela, com o que tem dentro dele.
   Nada é substituído antes de você confirmar. */
function lerArquivoDeBackup(arquivo) {
  if (!arquivo) return;
  const leitor = new FileReader();          // FileReader [navegador]
  leitor.onload = function () {
    const backup = conferirBackup(leitor.result);
    if (!backup) {
      mostrarFaixa('Esse arquivo não é um backup do Treino', false);
      return;
    }
    backupParaRestaurar = backup;
    const quando = backup.dados.salvoEm
      ? 'de ' + dataCurta(backup.dados.salvoEm.slice(0, 10))
      : 'sem data';

    if (backup.formato === 'perfis') {
      const resumo = backup.ids.map(id => {
        const p = backup.dados.dados[id];
        return (p.nome || id) + ' (' + p.banco.sessoes.length + ')';
      }).join(', ');
      confirmando = {
        tipo: 'restaurar',
        texto: 'Backup ' + quando + ', com: ' + resumo + '. O número entre parênteses é ' +
               'quantos treinos registrados. Restaurar troca o que está no app agora ' +
               'por isso, para cada uma dessas pessoas.',
        botao: 'Restaurar'
      };
    } else {
      /* backup antigo não diz de quem é. O app NÃO adivinha: pergunta. */
      confirmando = {
        tipo: 'destino-backup',
        texto: 'Este backup ' + quando + ' é do formato antigo, com ' +
               backup.dados.banco.sessoes.length + ' treinos registrados, e não diz de ' +
               'quem é. Para qual pessoa ele deve ir? O que estiver guardado nessa ' +
               'pessoa será trocado.',
        opcoes: perfis.lista.map(p => ({
          texto: 'Colocar em ' + p.nome,
          acao: 'destino-perfil',
          id: p.id
        }))
      };
    }
    desenhar();
  };
  leitor.readAsText(arquivo);
}

/* Uma cópia de TUDO que está na gaveta agora, guardada na memória.
   É o que o botão Desfazer usa depois de uma restauração. */
function retratoDeAgora() {
  const chaves = {};
  chavesComPrefixo('treino.').forEach(chave => {
    chaves[chave] = localStorage.getItem(chave);
  });
  return { chaves: chaves };
}

function aplicarRetrato(retrato) {
  chavesComPrefixo('treino.').forEach(chave => localStorage.removeItem(chave));
  Object.keys(retrato.chaves).forEach(chave => {
    try { localStorage.setItem(chave, retrato.chaves[chave]); } catch (erro) { /* sem espaço */ }
  });
  recarregarDoArmazenamento();
}

/* Relê perfil, banco e sessão do zero, a partir do que está gravado. */
function recarregarDoArmazenamento() {
  const salvos = comoJson(localStorage.getItem(CHAVE_PERFIS));
  if (salvos && Array.isArray(salvos.lista) && salvos.lista.length) perfis = salvos;
  if (!acharPerfil(perfilId)) perfilId = perfis.lista[0].id;

  dadosTrancados = false;
  avisoDeDados = null;
  Object.keys(cacheDeFotos).forEach(k => delete cacheDeFotos[k]);

  banco = lerBanco();
  completarComSementes();

  const salva = lerSessaoSalva();
  sessao = salva || criarSessao(proximoTreinoId());
  perguntarSobrePendente = salva ? sessaoPrecisaDeDecisao(salva) : false;

  aplicarTema();
}

/* Grava o pacote de UMA pessoa. Se o perfil ainda não existe na
   lista, ele é criado; os outros perfis não são tocados. */
function gravarPerfilDoBackup(id, pacote) {
  if (!bancoValido(pacote.banco)) throw new Error('banco invalido para ' + id);

  if (!acharPerfil(id)) {
    perfis.lista.push({
      id: id,
      nome: pacote.nome || id,
      tema: pacote.tema || 'laranja',
      sementes: pacote.sementes || id
    });
    salvarPerfis();
  }

  localStorage.setItem(chaveBanco(id), JSON.stringify(pacote.banco));

  if (pacote.sessaoAtual) {
    localStorage.setItem(chaveSessao(id), JSON.stringify(pacote.sessaoAtual));
  } else {
    localStorage.removeItem(chaveSessao(id));
  }

  const prefixo = prefixoFoto(id);
  chavesComPrefixo(prefixo).forEach(chave => localStorage.removeItem(chave));
  const fotos = pacote.fotos || {};
  Object.keys(fotos).forEach(nome => {
    try { localStorage.setItem(prefixo + nome, fotos[nome]); } catch (erro) { /* sem espaço */ }
  });
}

/* destinoId só é usado para backup do formato antigo, que não diz
   de quem é: aí quem escolhe é você, na faixa de confirmação. */
function restaurarBackup(destinoId) {
  const backup = backupParaRestaurar;
  backupParaRestaurar = null;
  if (!backup) return;

  const antes = retratoDeAgora();

  try {
    if (backup.formato === 'perfis') {
      backup.ids.forEach(id => gravarPerfilDoBackup(id, backup.dados.dados[id]));
    } else {
      if (!acharPerfil(destinoId)) throw new Error('perfil de destino inexistente');
      gravarPerfilDoBackup(destinoId, {
        banco: backup.dados.banco,
        sessaoAtual: backup.dados.sessaoAtual,
        fotos: backup.dados.fotos
      });
    }
    recarregarDoArmazenamento();
  } catch (erro) {
    /* qualquer tropeço no meio: volta tudo como estava */
    aplicarRetrato(antes);
    confirmando = null;
    desenhar();
    mostrarFaixa('Não deu para restaurar. Nada foi trocado.', false);
    return;
  }

  estadoAntesDaRestauracao = antes;
  ultimaAcao = { tipo: 'restaurar' };
  confirmando = null;
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
      aplicarRetrato(estadoAntesDaRestauracao);
      estadoAntesDaRestauracao = null;
    }
    esconderFaixa();
    desenhar();
    return;
  }

  /* caminhadas */
  if (ultimaAcao.tipo === 'caminhada') {
    banco.caminhadas.pop();
    salvarBanco();
    esconderFaixa();
    desenhar();
    return;
  }
  if (ultimaAcao.tipo === 'apagar-caminhada') {
    if (caminhadaApagada) {
      banco.caminhadas.splice(caminhadaApagada.posicao, 0, caminhadaApagada.caminhada);
      caminhadaApagada = null;
      salvarBanco();
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
  } else if (ultimaAcao.tipo === 'pular') {
    item.pulado = false;
    item.motivoDoPulo = '';
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
  const foto = localStorage.getItem(prefixoFoto(perfilId) + equipamentoId);
  cacheDeFotos[equipamentoId] = foto;
  return foto;
}

function salvarFoto(equipamentoId, imagem) {
  try {
    localStorage.setItem(prefixoFoto(perfilId) + equipamentoId, imagem);
    cacheDeFotos[equipamentoId] = imagem;
    return true;
  } catch (erro) {
    // o navegador tem limite de espaço; se estourar, avisa sem quebrar
    mostrarFaixa('Sem espaço para mais fotos neste navegador', false);
    return false;
  }
}

function apagarFoto(equipamentoId) {
  localStorage.removeItem(prefixoFoto(perfilId) + equipamentoId);
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

  /* --- cabeçalho colorido --- */
  const feitos = sessao.itens.filter(it => it.concluido).length;

  /* a fileira de pessoas: um toque troca de treino, de histórico e de
     cor. Cada perfil guarda o seu, nada se mistura. */
  const chips = perfis.lista.map(p =>
    '<button class="chip-perfil' + (p.id === perfilId ? ' ativo' : '') +
    '" data-acao="trocar-perfil" data-id="' + esc(p.id) + '">' + esc(p.nome) + '</button>'
  ).join('');

  document.getElementById('cabecalho').innerHTML =
    '<div class="fileira-perfis">' + chips +
      '<button class="chip-perfil ajustes" data-acao="abrir-perfis" ' +
        'aria-label="Ajustes dos perfis">•••</button>' +
    '</div>' +
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
    document.getElementById('conteudo').innerHTML =
      desenharRecadosDoTopo() + desenharConfirmacao() + desenharAviso();
    document.getElementById('rodape').innerHTML = '';
    desenharPainel();
    return;
  }

  /* --- lista de exercícios --- */
  document.getElementById('conteudo').innerHTML =
    desenharRecadosDoTopo() +
    desenharConfirmacao() +
    treino.itens.map((itemDoTreino, i) => desenharCartao(itemDoTreino, i)).join('');

  /* --- rodapé --- */
  const extras = temAcompanhamento()
    ? '<div class="linha-backup">' +
        '<button class="btn-pequeno" data-acao="ver-caminhadas">Caminhadas</button>' +
        '<button class="btn-pequeno" data-acao="ver-resumo">Resumo</button>' +
        '<button class="btn-pequeno" data-acao="ver-plano">Sobre o plano</button>' +
      '</div>'
    : '';

  document.getElementById('rodape').innerHTML =
    (sessaoTemRegistro(sessao)
      ? '<button class="btn-largo btn-destaque" data-acao="concluir-treino">Concluir treino</button>'
      : '') +
    '<div class="linha-backup">' +
      '<button class="btn-pequeno" data-acao="ver-treinos">Treinos registrados</button>' +
    '</div>' +
    extras +
    '<div class="linha-backup">' +
      '<button class="btn-pequeno" data-acao="backup">Backup de ' +
        esc(perfilAtual().nome) + '</button>' +
      '<button class="btn-pequeno" data-acao="backup-tudo">Backup de todos</button>' +
      '<button class="btn-pequeno" data-acao="restaurar">Restaurar</button>' +
    '</div>';

  desenharPainel();

  /* o campo de carga precisa receber o cursor depois de desenhado */
  if (editandoCarga !== null) {
    const campo = document.querySelector('[data-campo="carga"]');  // querySelector [navegador]
    if (campo) { campo.focus(); campo.select(); }
  }
}

/* Recados fixos do topo da tela: problema com os dados salvos, fase
   informada e o convite para revisar a ficha. Nenhum deles tira você
   do treino: são faixas, não pop up. */
function desenharRecadosDoTopo() {
  let html = '';

  if (avisoDeDados) {
    html += '<div class="atencao atencao-forte">' + esc(avisoDeDados) +
      '<div class="botoes-atencao">' +
        '<button class="btn-pequeno" data-acao="backup">Salvar backup agora</button>' +
      '</div></div>';
  }

  if (banco.config.fase === 'gestacao') {
    html += '<div class="atencao">Fase informada: gestação. As sugestões automáticas de ' +
      'aumento de carga estão suspensas. Revise o treino com o acompanhamento pré-natal. ' +
      'Nada foi apagado e o registro continua funcionando.</div>';
  }

  if (temAcompanhamento() && precisaOferecerResumo()) {
    html += '<div class="atencao">Já são ' + diasDeUso() + ' dias de uso registrado. ' +
      'Vale abrir o resumo e conversar com o professor sobre revisar a ficha. ' +
      'O app não muda séries sozinho.' +
      '<div class="botoes-atencao">' +
        '<button class="btn-pequeno" data-acao="ver-resumo">Ver resumo</button>' +
      '</div></div>';
  }

  return html;
}

/* Passaram duas semanas de uso de verdade desde a última olhada? */
function precisaOferecerResumo() {
  if (diasDeUso() < DIAS_PARA_RESUMO) return false;
  const visto = banco.config.resumoVistoEm;
  if (!visto) return true;
  const p = visto.split('-');
  const dia = new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
  return Math.floor((new Date() - dia) / 86400000) >= DIAS_PARA_RESUMO;
}

/* Painel do histórico: sobe por cima da tela, sem tirar você do treino.
   Ele fica ABAIXO da barra do cronômetro de propósito, para você poder
   olhar o histórico enquanto o descanso corre. */
function desenharPainel() {
  const caixa = document.getElementById('painel');

  if (edicao)      { caixa.classList.remove('oculto'); caixa.innerHTML = desenharEdicao(); return; }
  if (listaAberta) { caixa.classList.remove('oculto'); caixa.innerHTML = desenharListaDeTreinos(); return; }

  if (painelAberto === 'perfis')     { caixa.classList.remove('oculto'); caixa.innerHTML = desenharPerfis(); return; }
  if (painelAberto === 'caminhadas') { caixa.classList.remove('oculto'); caixa.innerHTML = desenharCaminhadas(); return; }
  if (painelAberto === 'resumo')     { caixa.classList.remove('oculto'); caixa.innerHTML = desenharResumo(); return; }
  if (painelAberto === 'plano')      { caixa.classList.remove('oculto'); caixa.innerHTML = desenharPlano(); return; }

  if (!historicoAberto) { caixa.classList.add('oculto'); return; }

  const exercicio = acharExercicio(historicoAberto);
  const feitos = execucoesDe(historicoAberto);

  /* resumo de uma linha. A maior carga só compara registros da mesma
     unidade: placa e quilo não entram na mesma conta. */
  const unidadeAtual = feitos.length
    ? unidadeDoItemRegistrado(feitos[0].item)
    : (exercicio.unidade || 'kg');
  const cargas = feitos
    .filter(f => unidadeDoItemRegistrado(f.item) === unidadeAtual)
    .map(f => cargaDoItem(f.item)).filter(c => c !== null);
  const maior = cargas.length ? Math.max.apply(null, cargas) : null;   // Math.max [nativo]
  const resumo = feitos.length + (feitos.length === 1 ? ' sessão' : ' sessões') +
    (maior !== null ? ' · maior carga ' + cargaEscrita(maior, unidadeAtual) : '');

  const linhas = feitos.map(f => {
    const carga = cargaDoItem(f.item);
    const rir = rirDoItem(f.item);
    const d = f.item.desconforto || {};
    const regioes = (d.regioes || []).join(', ');
    const retrato = f.item.retrato;
    /* o nome e a unidade são os DAQUELE dia, não os de hoje */
    const nomeDoDia = nomeNoHistorico(f.item);
    const mudouDeNome = nomeDoDia !== exercicio.nome;
    const porLado = retrato && retrato.porLado;
    return '<div class="sessao">' +
      '<div class="dia">' + dataCurta(f.data) + '</div>' +
      '<div class="detalhe">' +
        '<div class="linha-carga">' +
          (carga !== null ? '<b>' + esc(cargaEscrita(carga, unidadeDoItemRegistrado(f.item))) + '</b> · ' : '') +
          f.item.series.map(x => x.reps).join(' · ') + ' reps' +
          (porLado ? ' por lado' : '') +
          (rir !== null ? ' <span class="marca">RIR ' + rir + '</span>' : '') +
          (f.estado === 'incompleta' ? ' <span class="marca">treino incompleto</span>' : '') +
          (!retrato ? ' <span class="marca">registro antigo</span>' : '') +
          (mudouDeNome ? ' <span class="marca">' + esc(nomeDoDia) + '</span>' : '') +
        '</div>' +
        (retrato ? '<div class="extra-cinza">pedido no dia: ' + retrato.series + ' x ' +
          retrato.repMin + '-' + retrato.repMax + '</div>' : '') +
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
      '<div class="resumo-painel">' + esc(resumo) + '</div></div>' +
      '<button class="btn-destaque" data-acao="fechar-historico">Fechar</button>' +
    '</div>' +
    (aviso ? '<div class="atencao atencao-painel">' + esc(textoDoAviso(aviso)) + '</div>' : '') +
    blocoDoGrafico(feitos, exercicio) +
    '<div class="lista-painel">' +
      (feitos.length ? linhas : '<div class="vazio">Nenhuma sessão registrada ainda.</div>') +
    '</div>';
}


/* ---------- painel dos perfis ----------
   Trocar de pessoa e mudar o nome que aparece no botão. Tudo local:
   não existe conta, senha nem nuvem. */
function desenharPerfis() {
  const linhas = perfis.lista.map(p => {
    const ativo = p.id === perfilId;
    /* de quem está aberto, o número certo é o da memória; dos outros,
       o que está gravado */
    const outro = ativo ? null : comoJson(localStorage.getItem(chaveBanco(p.id)));
    const guardado = ativo ? banco : outro;
    const quantas = guardado && Array.isArray(guardado.sessoes) ? guardado.sessoes.length : 0;
    return '<div class="item-perfil' + (ativo ? ' ativo' : '') + '">' +
      '<div class="dados-perfil">' +
        '<input type="text" data-campo="nome-perfil" data-id="' + esc(p.id) + '" ' +
          'value="' + esc(p.nome) + '" maxlength="20" aria-label="Nome do perfil">' +
        '<div class="extra-cinza">' + quantas +
          (quantas === 1 ? ' treino guardado' : ' treinos guardados') +
          ' · cor ' + esc(p.tema) + '</div>' +
      '</div>' +
      (ativo
        ? '<span class="marca">em uso</span>'
        : '<button class="btn-pequeno btn-destaque" data-acao="trocar-perfil" data-id="' +
            esc(p.id) + '">Usar</button>') +
    '</div>';
  }).join('');

  return '<div class="topo-painel">' +
      '<div><h2>Quem está treinando</h2>' +
      '<div class="resumo-painel">cada pessoa tem ficha, histórico e cargas próprias</div></div>' +
      '<button class="btn-destaque" data-acao="fechar-historico">Fechar</button>' +
    '</div>' +
    '<div class="lista-painel">' + linhas +
      '<div class="nota-painel">Tudo fica guardado só neste aparelho, sem conta e sem ' +
      'internet. Trocar de pessoa não mistura nada: o treino em andamento de cada uma ' +
      'fica esperando onde parou. Para levar os dados para outro celular, use o backup.</div>' +
    '</div>';
}


/* ---------- painel das caminhadas ---------- */
function desenharCaminhadas() {
  const meta = banco.config.metaSemanalMin || 0;
  const feitos = minutosDaSemana();
  const quantas = caminhadasDaSemana().length;
  const parte = meta ? Math.min(100, Math.round((feitos / meta) * 100)) : 0;

  const lista = (banco.caminhadas || []).slice().reverse().slice(0, 30).map(c =>
    '<div class="sessao">' +
      '<div class="dia">' + dataCurta(c.data) + '</div>' +
      '<div class="detalhe">' +
        '<div class="linha-carga"><b>' + c.minutos + ' min</b></div>' +
        (c.observacao ? '<div class="obs">' + esc(c.observacao) + '</div>' : '') +
      '</div>' +
      '<button class="btn-pequeno btn-perigo" data-acao="apagar-caminhada" data-id="' +
        esc(c.id) + '">Apagar</button>' +
    '</div>'
  ).join('');

  return '<div class="topo-painel">' +
      '<div><h2>Caminhadas</h2>' +
      '<div class="resumo-painel">esta semana: ' + feitos + ' min em ' + quantas +
        (quantas === 1 ? ' caminhada' : ' caminhadas') + '</div></div>' +
      '<button class="btn-destaque" data-acao="fechar-historico">Fechar</button>' +
    '</div>' +
    '<div class="lista-painel">' +
      '<div class="barra-meta"><div class="cheio" style="width:' + parte + '%"></div></div>' +
      linhaDeAjuste('Meta da semana', meta + ' min', 'meta', 0) +
      '<div class="nota-painel">Começo sugerido: duas caminhadas de 15 a 25 minutos por ' +
        'semana, num ritmo que ainda deixa conversar. A meta é sua e dá para mudar aqui. ' +
        'Com o tempo, a recomendação geral de saúde é chegar perto de 150 minutos por ' +
        'semana de atividade aeróbica moderada, sem pressa e sem obrigação de bater a ' +
        'meta toda semana. Os minutos de musculação não entram nesta conta.</div>' +
      '<div class="novo-exercicio">' +
        '<div class="rotulo">Registrar caminhada de hoje</div>' +
        '<input type="text" inputmode="numeric" data-campo="minutos" placeholder="Minutos" ' +
          'value="' + esc(minutosDigitados) + '">' +
        '<input type="text" data-campo="obs-caminhada" placeholder="Como foi (opcional)" ' +
          'value="' + esc(obsDaCaminhada) + '">' +
        '<button class="btn-largo btn-marrom" data-acao="salvar-caminhada">Registrar</button>' +
      '</div>' +
      (lista || '<div class="vazio">Nenhuma caminhada registrada ainda.</div>') +
    '</div>';
}


/* ---------- painel do resumo para revisão ----------
   Só conta o que foi registrado. Não soma tonelagem entre exercícios
   diferentes, porque comparar peso de máquina com peso do corpo, ou
   quilo com placa, não quer dizer nada. */
function desenharResumo() {
  const inicio = primeiroDiaDeUso();
  if (!inicio) {
    return '<div class="topo-painel"><div><h2>Resumo</h2></div>' +
      '<button class="btn-destaque" data-acao="fechar-historico">Fechar</button></div>' +
      '<div class="lista-painel"><div class="vazio">O resumo aparece depois do ' +
      'primeiro treino ou da primeira caminhada registrada.</div></div>';
  }

  const dias = diasDeUso();
  const semanas = Math.max(1, dias / 7);
  const sessoes = banco.sessoes;
  const concluidas = sessoes.filter(s => s.estado === 'concluida').length;

  const duracoes = sessoes.map(s => {
    if (!s.iniciadaEm || !s.encerradaEm) return null;
    return Math.round((new Date(s.encerradaEm) - new Date(s.iniciadaEm)) / 60000);
  }).filter(m => m !== null && m > 0 && m < 300);
  const duracaoMedia = duracoes.length
    ? Math.round(duracoes.reduce((a, b) => a + b, 0) / duracoes.length)
    : null;

  let registrados = 0, pulados = 0, semRegistro = 0, series = 0, comRir = 0, comDesconforto = 0;
  sessoes.forEach(s => s.itens.forEach(it => {
    const situacao = situacaoDoItem(it);
    if (situacao === 'pulado') pulados++;
    else if (situacao === 'registrado') registrados++;
    else if (situacao === 'sem-registro') semRegistro++;
    series += it.series.length;
    comRir += it.series.filter(x => typeof x.rir === 'number').length;
    if (it.desconforto && it.desconforto.nivel && it.desconforto.nivel !== 'sem') comDesconforto++;
  }));

  /* por exercício: só o que dá para comparar com ele mesmo */
  const porExercicio = banco.exercicios.map(e => {
    const feitos = execucoesDe(e.id);
    if (!feitos.length) return null;
    const unidade = unidadeDoItemRegistrado(feitos[0].item);
    const cargas = feitos.filter(f => unidadeDoItemRegistrado(f.item) === unidade)
      .map(f => cargaDoItem(f.item)).filter(c => c !== null);
    const primeira = cargas.length ? cargas[cargas.length - 1] : null;
    const ultima = cargas.length ? cargas[0] : null;
    return '<div class="sessao">' +
      '<div class="detalhe">' +
        '<div class="linha-carga"><b>' + esc(e.nome) + '</b></div>' +
        '<div class="extra-cinza">' + feitos.length +
          (feitos.length === 1 ? ' sessão' : ' sessões') +
          (ultima !== null
            ? ' · carga ' + esc(cargaEscrita(primeira, unidade)) +
              (ultima !== primeira ? ' para ' + esc(cargaEscrita(ultima, unidade)) : '')
            : ' · sem carga') +
        '</div>' +
      '</div></div>';
  }).filter(Boolean).join('');

  const minutosCaminhada = (banco.caminhadas || []).reduce((a, c) => a + c.minutos, 0);

  return '<div class="topo-painel">' +
      '<div><h2>Resumo para revisão</h2>' +
      '<div class="resumo-painel">desde ' + dataCurta(inicio) + ', ' + dias +
        (dias === 1 ? ' dia' : ' dias') + ' de uso</div></div>' +
      '<button class="btn-destaque" data-acao="fechar-historico">Fechar</button>' +
    '</div>' +
    '<div class="lista-painel">' +
      '<div class="quadro-resumo">' +
        '<div><b>' + sessoes.length + '</b><span>treinos registrados</span></div>' +
        '<div><b>' + (Math.round((sessoes.length / semanas) * 10) / 10).toString().replace('.', ',') +
          '</b><span>por semana</span></div>' +
        '<div><b>' + concluidas + '</b><span>concluídos</span></div>' +
        '<div><b>' + (duracaoMedia !== null ? duracaoMedia + ' min' : '—') +
          '</b><span>duração média</span></div>' +
        '<div><b>' + series + '</b><span>séries registradas</span></div>' +
        '<div><b>' + comRir + '</b><span>séries com RIR</span></div>' +
      '</div>' +
      '<div class="nota-painel">Exercícios realizados e registrados: ' + registrados + '. ' +
        'Realizados sem registrar séries: ' + semRegistro + '. ' +
        'Marcados como não realizados: ' + pulados + '. ' +
        'Exercícios com desconforto anotado: ' + comDesconforto + '.</div>' +
      '<div class="rotulo">Caminhadas, contadas à parte</div>' +
      '<div class="nota-painel">' + (banco.caminhadas || []).length +
        (banco.caminhadas.length === 1 ? ' caminhada' : ' caminhadas') + ', somando ' +
        minutosCaminhada + ' minutos. Esta semana: ' + minutosDaSemana() + ' de ' +
        (banco.config.metaSemanalMin || 0) + ' minutos da meta. ' +
        'Minuto de musculação não é contado como minuto de caminhada.</div>' +
      '<div class="rotulo">Exercício por exercício</div>' +
      (porExercicio || '<div class="vazio">Nada registrado ainda.</div>') +
      '<div class="nota-painel">Para revisar a ficha: dá para passar UM exercício ' +
        'prioritário de 2 para 3 séries por vez, na tela de editar treino, conversando ' +
        'antes com o professor. O app nunca aumenta série sozinho, e aumentar tudo de ' +
        'uma vez não é uma boa ideia. A duração do treino, sozinha, não é motivo para ' +
        'mudar nada.</div>' +
    '</div>';
}


/* ---------- painel "sobre o plano" ----------
   Fica fora do caminho de registrar série de propósito: quem quer ler,
   abre; quem está treinando, não tropeça nisso. */
function desenharPlano() {
  const fase = banco.config.fase;

  return '<div class="topo-painel">' +
      '<div><h2>Sobre o plano</h2>' +
      '<div class="resumo-painel">como usar, e o que o app não faz</div></div>' +
      '<button class="btn-destaque" data-acao="fechar-historico">Fechar</button>' +
    '</div>' +
    '<div class="lista-painel">' +

      '<div class="rotulo">Antes de começar</div>' +
      '<div class="nota-painel">Faça cerca de 5 minutos de caminhada ou bicicleta e ' +
        'séries leves de preparação nos primeiros exercícios mais exigentes. Termine as ' +
        'séries com aproximadamente 2 a 3 repetições possíveis a mais, sem descansar e ' +
        'mantendo a execução. Nos movimentos que você ainda está aprendendo, deixar uma ' +
        'margem maior é melhor. A sessão costuma levar de 50 a 60 minutos, sem obrigação ' +
        'de completar a hora nem de encurtar os descansos.</div>' +

      '<div class="rotulo">O que é RIR</div>' +
      '<div class="nota-painel">É a resposta a esta pergunta: quantas repetições a mais ' +
        'você conseguiria fazer agora, sem descansar? São repetições dentro da mesma ' +
        'série, não séries extras depois do descanso. Não precisa informar sempre; ' +
        'deixar em branco não é o mesmo que zero, e sem RIR o app não sugere aumento.</div>' +

      '<div class="rotulo">Carga</div>' +
      '<div class="nota-painel">O app começa sem nenhuma carga preenchida e nunca chuta ' +
        'um peso. Onde está escrito "kg por halter", o número é o peso de UM halter. ' +
        'Se o aparelho for de placa numerada, escolha a unidade placa: número de placa ' +
        'não vira quilo sozinho. O passo de aumento é informado aparelho por aparelho, ' +
        'no próprio cartão do exercício.</div>' +

      '<div class="rotulo">Séries</div>' +
      '<div class="nota-painel">A ficha começa com 2 séries de trabalho por exercício, ' +
        '16 por sessão. Depois de cerca de duas semanas de uso de verdade, o app oferece ' +
        'um resumo para revisão. Quem decide aumentar é você com o professor, um ' +
        'exercício por vez.</div>' +

      '<div class="rotulo">Dead bug</div>' +
      '<div class="nota-painel">São 2 séries de 6 a 10 repetições POR LADO. Registre a ' +
        'série uma vez só, depois de fazer os dois lados: 8 quer dizer 8 à direita e 8 ' +
        'à esquerda. Não registre quatro séries.</div>' +

      '<div class="rotulo">O que o app não faz</div>' +
      '<div class="nota-painel">Ele não é avaliação de saúde e não substitui a orientação ' +
        'presencial do professor. Treinar fortalece os músculos; a perda de gordura, ' +
        'quando acontece, é geral e não em um ponto escolhido do corpo. O app não promete ' +
        'resultado localizado, não indica dieta e não diagnostica dor.</div>' +

      '<div class="rotulo">Fase</div>' +
      '<div class="nota-painel">Esta ficha foi organizada para a fase anterior à gestação. ' +
        'Ao confirmar gravidez, revise o treino com o acompanhamento pré-natal. A ' +
        'marcação abaixo é opcional: ela só suspende as sugestões automáticas de aumento ' +
        'e mostra um lembrete. Nada é apagado e o registro continua funcionando.</div>' +
      '<div class="fileira fileira-fase">' +
        '<button data-acao="fase" data-valor="pre-gestacao"' +
          (fase !== 'gestacao' ? ' class="escolhido"' : '') + '>Antes da gestação</button>' +
        '<button data-acao="fase" data-valor="gestacao"' +
          (fase === 'gestacao' ? ' class="escolhido"' : '') + '>Gestante</button>' +
      '</div>' +

      '<div class="rotulo">De onde vêm as recomendações gerais</div>' +
      '<div class="nota-painel">A ficha é uma aplicação prática ao seu caso, não um ' +
        'protocolo testado num estudo. As referências gerais:' +
        '<ul class="links">' +
          '<li>ACSM, atualização de treinamento resistido de 2026: ' +
            'acsm.org/resistance-training-guidelines-update-2026/</li>' +
          '<li>OMS, atividade física e comportamento sedentário: ' +
            'who.int/europe/publications/i/item/9789240014886</li>' +
          '<li>ACOG, exercício durante a gravidez: ' +
            'acog.org/womens-health/faqs/exercise-during-pregnancy</li>' +
          '<li>Estudo sobre hipertrofia dos glúteos: pubmed.ncbi.nlm.nih.gov/37877099/</li>' +
        '</ul></div>' +
    '</div>';
}

/* Tela de edição de um treino. Mexe na lista do dia, não no histórico. */
function desenharEdicao() {
  const treino = acharTreino(edicao.treinoId);

  /* escolhendo um exercício para entrar ou substituir */
  if (edicao.escolhendo) return desenharEscolhaDeExercicio();

  const abas = banco.treinos.slice().sort((a, b) => a.ordem - b.ordem).map(t =>
    '<button class="btn-pequeno' + (t.id === edicao.treinoId ? ' btn-destaque' : '') +
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
      '<button class="btn-destaque" data-acao="fechar-historico">Fechar</button>' +
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
      '<button class="btn-destaque" data-acao="voltar-edicao">Voltar</button>' +
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
      '<button class="btn-destaque" data-acao="fechar-historico">Fechar</button>' +
    '</div>' +
    desenharConfirmacao() +
    '<div class="lista-painel">' +
      emAndamento + linhas +
      (registrados.length || emAndamento ? '' : '<div class="vazio">Nada registrado ainda.</div>') +
    '</div>';
}

/* Faixa marrom de sim ou não, no lugar da caixinha do navegador.
   Quando a pergunta tem mais de uma saída (para qual pessoa vai este
   backup?), ela vira uma lista de opções em vez de um botão só. */
function desenharConfirmacao() {
  if (!confirmando) return '';

  const botoes = confirmando.opcoes
    ? confirmando.opcoes.map(o =>
        '<button data-acao="' + esc(o.acao) + '" data-id="' + esc(o.id) + '" class="btn-destaque">' +
        esc(o.texto) + '</button>').join('')
    : '<button data-acao="confirmar" class="' + (confirmando.perigo ? 'btn-perigo' : 'btn-destaque') + '">' +
      esc(confirmando.botao) + '</button>';

  return '<div class="confirmacao">' +
    '<p>' + esc(confirmando.texto) + '</p>' +
    '<div class="botoes">' + botoes +
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
      '<button class="btn-largo btn-destaque" data-acao="sessao-continuar">Continuar</button>' +
      '<button class="btn-largo" data-acao="sessao-incompleta">Encerrar como incompleta</button>' +
      '<button class="btn-largo btn-perigo" data-acao="sessao-descartar">Descartar</button>' +
    '</div></div>';
}

function desenharCartao(itemDoTreino, i) {
  const item = sessao.itens[i];
  const exercicio = acharExercicio(item.exercicioId);
  const aberto = sessao.itemAberto === i;
  const imagem = imagemDoExercicio(exercicio);

  const prescricao = itemDoTreino.series + ' x ' + itemDoTreino.repMin + '-' + itemDoTreino.repMax +
    (exercicio.porLado ? ' por lado' : '');

  /* resumo que aparece com o cartão fechado */
  let resumo = '—';
  if (item.pulado) {
    resumo = 'não fez';
  } else if (item.series.length) {
    const carga = cargaDoItem(item);
    resumo = (carga !== null ? cargaEscrita(carga, exercicio.unidade) + ' · ' : '') +
             item.series.map(s => s.reps).join('/');
  }

  let html = '<section class="cartao' + (aberto ? ' aberto' : '') + '">' +
    '<div class="cabeca-cartao" data-acao="abrir-cartao" data-i="' + i + '">' +
      '<div class="numero">' + (i + 1) + '</div>' +
      (aberto ? '' : (imagem
        ? '<img class="miniatura" src="' + imagem + '" alt="">'
        : '<div class="miniatura sem-desenho"></div>')) +
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

  /* o desenho do exercício, sem botão nenhum: nada para tocar aqui.
     Sem desenho certo, fica um espaço neutro com o nome. Emprestar o
     desenho de outro movimento seria pior do que não ter desenho. */
  if (imagem) {
    html += '<img class="foto" src="' + imagem + '" alt="' + esc(exercicio.nome) + '">';
  } else {
    html += '<div class="foto sem-desenho"><span>' + esc(exercicio.nome) + '</span></div>';
  }

  /* orientação do exercício, quando existe (leg press, extensora) */
  if (exercicio.instrucoes) {
    html += '<div class="instrucoes">' + esc(exercicio.instrucoes) + '</div>';
  }

  /* qual aparelho é este, de verdade. Cada variante tem histórico
     próprio: escolher não reescreve o que já foi feito na outra. */
  if (Array.isArray(exercicio.variantes) && exercicio.variantes.length) {
    const botoes = exercicio.variantes.map(id => {
      const v = acharExercicio(id);
      if (!v) return '';
      return '<button data-acao="variante" data-i="' + i + '" data-id="' + esc(id) + '"' +
        (id === exercicio.id ? ' class="escolhido"' : '') + '>' + esc(v.nome) + '</button>';
    }).join('');
    html += '<div class="bloco"><div class="rotulo">' + esc(exercicio.rotuloVariante || 'Variante') +
      '</div><div class="fileira fileira-variante">' + botoes + '</div>' +
      '<div class="extra-cinza">A escolha vale para os três treinos. Cada aparelho tem o ' +
        'seu histórico: escolher agora não mexe no que já foi registrado no outro.</div>' +
      '</div>';
  }

  /* última vez */
  const anteriores = execucoesDe(item.exercicioId);
  if (anteriores.length) {
    const a = anteriores[0];
    const carga = cargaDoItem(a.item);
    const rir = rirDoItem(a.item);
    html += '<div class="ultima-vez tocavel" data-acao="ver-historico" data-id="' + item.exercicioId + '">' +
      '<div>Última vez (' + dataCurta(a.data) + '): <b>' +
      (carga !== null ? esc(cargaEscrita(carga, unidadeDoItemRegistrado(a.item))) + ' · ' : '') +
      a.item.series.map(s => s.reps).join('/') + '</b>' +
      (exercicio.porLado ? ' por lado' : '') +
      (rir !== null ? ' · RIR ' + rir : '') + '</div>' +
      '<div class="ver-tudo">ver tudo</div></div>';
  } else {
    html += '<div class="ultima-vez">Primeira vez neste exercício.</div>';
  }

  /* sugestão de progressão */
  const sugerida = sugestaoDeCarga(itemDoTreino);
  if (sugerida && sugerida.carga !== null) {
    const recado = sugerida.motivo === 'leve'
      ? 'Carga parece leve para a faixa. Dá para testar <b>' +
        esc(cargaEscrita(sugerida.carga, exercicio.unidade)) + '</b>.'
      : sugerida.motivo === 'voltar'
      ? 'Esse salto ainda não pegou. Dá para voltar para <b>' +
        esc(cargaEscrita(sugerida.carga, exercicio.unidade)) +
        '</b> e subir de novo mais pra frente.'
      : sugerida.motivo === 'dupla'
      ? 'Duas sessões no topo, com folga e mesma carga. Dá para testar <b>' +
        esc(cargaEscrita(sugerida.carga, exercicio.unidade)) + '</b>.'
      : 'Duas sessões no topo. Dá para testar <b>' +
        esc(cargaEscrita(sugerida.carga, exercicio.unidade)) + '</b>.';
    html += '<div class="sugestao">' +
      '<span>' + recado + '</span>' +
      '<button class="btn-pequeno btn-destaque" data-acao="aceitar-sugestao" data-i="' + i +
        '" data-valor="' + sugerida.carga + '">Usar</button>' +
      '</div>';
  } else if (sugerida && sugerida.motivo === 'sem-passo') {
    html += '<div class="sugestao"><span>Duas sessões no topo, com folga. Dá para avaliar ' +
      'aumentar a carga. Informe abaixo de quanto em quanto este aparelho sobe e o app ' +
      'passa a mostrar o número.</span></div>';
  } else if (sugerida && sugerida.motivo === 'parece-leve') {
    html += '<div class="sugestao"><span>A carga parece leve; confira o ajuste com o ' +
      'professor.</span></div>';
  }

  /* desconforto registrado AGORA: orientação na hora, sem esperar
     repetir. O app não diz o que é, só o que fazer em seguida. */
  const nivelDeHoje = item.desconforto && item.desconforto.nivel;
  if (regraCautelosa() && nivelDeHoje && nivelDeHoje !== 'sem') {
    html += '<div class="atencao atencao-forte">Você registrou desconforto neste exercício ' +
      'hoje. Pare o movimento que dói e não force a série. Peça ao professor para conferir ' +
      'a execução e o ajuste do aparelho antes de repetir. Se o desconforto voltar nas ' +
      'próximas vezes, procure avaliação profissional. As sugestões de aumento de carga ' +
      'ficam suspensas neste exercício.</div>';
  }

  /* desconforto repetido: só o que você registrou, contado */
  const aviso = avisoDeDesconforto(item.exercicioId);
  if (aviso) {
    html += '<div class="atencao">' + esc(textoDoAviso(aviso)) + '</div>';
  }

  /* marcado como não realizado: nada de série falsa */
  if (item.pulado) {
    html += '<div class="bloco bloco-pulado">' +
      '<div class="rotulo">Marcado como não realizado hoje</div>' +
      '<input type="text" data-campo="motivo-pulo" data-i="' + i + '" ' +
        'placeholder="Motivo (opcional): aparelho ocupado, sem tempo..." ' +
        'value="' + esc(item.motivoDoPulo || '') + '">' +
      '<button class="btn-largo" data-acao="desmarcar-pulo" data-i="' + i + '">' +
        'Voltar atrás e registrar</button>' +
      '</div>';
    return html + '</div></section>';
  }

  /* carga */
  if (exercicio.semCarga) {
    html += '<div class="bloco"><div class="extra-cinza">Exercício com o peso do corpo. ' +
      'Isso não é carga faltando: o app não sugere quilos aqui.</div></div>';
  } else {
    const u = unidadeDe(exercicio);
    html += '<div class="bloco"><div class="rotulo">' + esc(u.rotulo) + '</div><div class="carga">';
    if (editandoCarga === i) {
      html += '<input class="campo" type="text" inputmode="decimal" data-campo="carga" data-i="' + i +
                '" value="' + (typeof item.cargaAtualKg === 'number' ? numero(item.cargaAtualKg) : '') + '">' +
              '<button class="passo btn-destaque" data-acao="carga-ok">OK</button>';
    } else {
      html += '<button class="passo" data-acao="carga-menos" data-i="' + i + '">−</button>' +
              '<div class="valor" data-acao="carga-editar" data-i="' + i + '">' +
                numero(item.cargaAtualKg) + ' <small>' + esc(u.curto) + '</small></div>' +
              '<button class="passo" data-acao="carga-mais" data-i="' + i + '">+</button>';
    }
    html += '</div>';

    /* de quanto em quanto este aparelho sobe. Enquanto ninguém
       informar, nenhuma sugestão sai com número. */
    if (regraCautelosa()) {
      const passo = passoDeCarga(exercicio);
      if (passo === null) {
        html += '<div class="rotulo">Este aparelho sobe de quanto em quanto?</div>' +
          '<div class="fileira fileira-passo">' +
          PASSOS_DE_CARGA.map(p =>
            '<button data-acao="passo-carga" data-id="' + esc(exercicio.id) + '" data-valor="' + p +
            '">' + numero(p) + '</button>').join('') +
          '</div>' +
          '<div class="extra-cinza">Sem isso o app não inventa uma carga sugerida. ' +
            'Se não souber, pergunte ao professor e deixe para depois.</div>';
      } else {
        html += '<div class="extra-cinza">Passo deste aparelho: ' + numero(passo) + ' ' +
          esc(u.curto) + ' · <button class="btn-vinculo" data-acao="limpar-passo" data-id="' +
          esc(exercicio.id) + '">trocar</button></div>';
      }
    }
    html += '</div>';
  }

  /* grade de repetições */
  const numeroDaSerie = item.series.length + 1;
  const extra = numeroDaSerie > itemDoTreino.series;
  const ampliada = repsAmpliado === i;

  html += '<div class="bloco">' +
    '<div class="rotulo">Série ' + numeroDaSerie +
      (extra ? ' (extra)' : ' de ' + itemDoTreino.series) + ' · repetições' +
      (exercicio.porLado ? ' POR LADO' : '') + '</div>' +
    (exercicio.porLado
      ? '<div class="extra-cinza">Faça os dois lados e registre UMA vez: tocar em 8 quer ' +
        'dizer 8 à direita e 8 à esquerda. Não registre quatro séries.</div>'
      : '') +
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
          (typeof s.cargaKg === 'number' ? esc(cargaEscrita(s.cargaKg, s.unidade)) + ' · ' : '') +
          s.reps + (s.porLado ? '/lado' : '') +
          (typeof s.rir === 'number' ? ' · RIR ' + s.rir : '') +
          '</div>';
      }).join('') + '</div>';
  }

  /* não realizado: uma saída honesta, que não cria série nenhuma */
  if (item.series.length === 0) {
    html += '<button class="btn-vinculo solto" data-acao="pular-exercicio" data-i="' + i + '">' +
      'Não fiz este exercício hoje</button>';
  }
  html += '</div>';

  /* fechamento: só depois de bater as séries previstas */
  if (item.series.length >= itemDoTreino.series) {
    const rirAtual = rirDoItem(item);
    const nivel = item.desconforto.nivel;

    html += '<div class="fechamento">';

    html += '<div class="rotulo">RIR da última série</div>' +
      '<div class="ajuda">Quantas repetições ainda dariam, na hora que a série acabou, sem descansar.</div>' +
      (regraCautelosa() && exercicio.semCarga
        ? '<div class="ajuda">Aqui, pense em quantas ainda sairiam com a mesma técnica.</div>'
        : '') +
      '<div class="fileira fileira-rir">' +
      [0, 1, 2, 3, 4, 5].map(v =>
        '<button data-acao="rir" data-i="' + i + '" data-valor="' + v + '"' +
        (rirAtual === v ? ' class="escolhido"' : '') + '>' + (v === 5 ? '5+' : v) + '</button>'
      ).join('') + '</div>';

    /* como a execução foi. Entra na regra de aumento: sem "boa"
       informado, o app não sugere subir a carga. */
    if (regraCautelosa()) {
      html += '<div class="bloco"><div class="rotulo">Execução</div>' +
        '<div class="fileira fileira-execucao">' +
        '<button data-acao="execucao" data-i="' + i + '" data-valor="boa"' +
          (item.execucao === 'boa' ? ' class="escolhido"' : '') + '>Boa</button>' +
        '<button data-acao="execucao" data-i="' + i + '" data-valor="melhorar"' +
          (item.execucao === 'melhorar' ? ' class="escolhido"' : '') + '>Deu para melhorar</button>' +
        '</div></div>';
    }

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
      html += '<div class="bloco"><button class="btn-largo btn-destaque" data-acao="concluir-exercicio" data-i="' + i + '">' +
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
    case 'trocar-perfil':      trocarPerfil(alvo.dataset.id); break;
    case 'abrir-perfis':       abrirPainel('perfis'); break;
    case 'ver-caminhadas':     abrirPainel('caminhadas'); break;
    case 'ver-resumo':         abrirPainel('resumo'); break;
    case 'ver-plano':          abrirPainel('plano'); break;

    case 'variante':           escolherVariante(i, alvo.dataset.id); break;
    case 'passo-carga':        definirPassoDeCarga(alvo.dataset.id, Number(valor)); break;
    case 'limpar-passo':       acharExercicio(alvo.dataset.id).incrementoKg = null;
                               salvarBanco(); desenhar(); break;
    case 'execucao':           definirExecucao(i, valor); break;
    case 'pular-exercicio':    pularExercicio(i); break;
    case 'desmarcar-pulo':     desmarcarPulo(i); break;

    case 'salvar-caminhada':   registrarCaminhada(); break;
    case 'apagar-caminhada':   apagarCaminhada(alvo.dataset.id); break;
    case 'mais-meta':          mudarMetaSemanal(+10); break;
    case 'menos-meta':         mudarMetaSemanal(-10); break;

    case 'fase':
      if (valor === 'gestacao' && banco.config.fase !== 'gestacao') {
        confirmando = {
          tipo: 'fase', valor: 'gestacao',
          texto: 'Marcar que você está gestante? As sugestões automáticas de aumento de ' +
                 'carga ficam suspensas e o app passa a lembrar de revisar o treino com o ' +
                 'acompanhamento pré-natal. Nada é apagado, o registro continua funcionando ' +
                 'e dá para voltar atrás quando quiser.',
          botao: 'Marcar'
        };
        desenhar();
      } else {
        mudarFase(valor);
      }
      break;

    case 'destino-perfil':     restaurarBackup(alvo.dataset.id); break;
    case 'backup-tudo':        exportarBackup(true); break;

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
    case 'backup':             exportarBackup(false); break;
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
  } else if (campo === 'motivo-pulo') {
    sessao.itens[Number(alvo.dataset.i)].motivoDoPulo = alvo.value;
    salvarSessao();
  } else if (campo === 'novo-exercicio') {
    nomeDigitado = alvo.value;
  } else if (campo === 'minutos') {
    minutosDigitados = alvo.value;
  } else if (campo === 'obs-caminhada') {
    obsDaCaminhada = alvo.value;
  } else if (campo === 'nome-perfil') {
    renomearPerfil(alvo.dataset.id, alvo.value);
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

/* 1. quem são as pessoas do app. Na primeira abertura depois desta
      versão, os dados que já existiam passam a ser do primeiro perfil,
      sem nada ser apagado nem transferido para o outro. */
perfis = migrarParaPerfis();
perfilId = acharPerfil(perfis.perfilAtual) ? perfis.perfilAtual : perfis.lista[0].id;

/* 2. os dados da pessoa que estava aberta da última vez */
banco = lerBanco();
completarComSementes();
aplicarTema();

/* 3. o treino de agora, dela */
const salva = lerSessaoSalva();
if (salva) {
  sessao = salva;
  // sessão de outro dia ou parada há horas: o app pergunta, não decide
  perguntarSobrePendente = sessaoPrecisaDeDecisao(salva);
} else {
  sessao = criarSessao(proximoTreinoId());
}

desenhar();
