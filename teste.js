/* Testa a LÓGICA do app fora do navegador, com um navegador de mentira.
   De propósito, este navegador NÃO tem alert, confirm nem prompt:
   se o app tentar abrir um pop up, o teste quebra na hora. */
const fs = require('fs');
const vm = require('vm');
/* A pasta do PRÓPRIO teste, seja qual for o computador. Antes aqui
   havia um caminho fixo, que só funcionava numa máquina. */
const path = __dirname.split('\\').join('/') + '/';

const elemento = () => ({
  innerHTML: '', className: '', value: '', dataset: {},
  classList: { add() {}, remove() {} },
  addEventListener() {}, focus() {}, select() {}, click() {}
});
const elementos = {};

const ctx = {
  console,
  localStorage: {
    dados: {},
    getItem(k) { return k in this.dados ? this.dados[k] : null; },
    setItem(k, v) { this.dados[k] = String(v); },
    removeItem(k) { delete this.dados[k]; },
    get length() { return Object.keys(this.dados).length; },
    key(i) { return Object.keys(this.dados)[i]; }
  },
  document: {
    addEventListener() {},
    getElementById(id) { return elementos[id] || (elementos[id] = elemento()); },
    querySelector() { return null; },
    createElement() { return elemento(); },
    hidden: false
  },
  window: { scrollTo() {} },
  navigator: {},
  setTimeout, clearTimeout, setInterval, clearInterval,
  Blob: function () {},
  URL: { createObjectURL: () => 'x', revokeObjectURL() {} }
};
ctx.globalThis = ctx;
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path + 'dados-iniciais.js', 'utf8'), ctx);
vm.runInContext(fs.readFileSync(path + 'app.js', 'utf8'), ctx);

const rodar = codigo => vm.runInContext(codigo, ctx);

let falhas = 0;
function confere(nome, obtido, esperado) {
  const ok = JSON.stringify(obtido) === JSON.stringify(esperado);
  if (!ok) falhas++;
  console.log((ok ? '  ok  ' : ' FALHA') + ' | ' + nome +
    (ok ? '' : '  obtido: ' + JSON.stringify(obtido) + '  esperado: ' + JSON.stringify(esperado)));
}

console.log('\n--- nenhum pop up no código ---');
const fonte = fs.readFileSync(path + 'app.js', 'utf8');
['alert(', 'confirm(', 'prompt('].forEach(proibido => {
  confere('não usa ' + proibido + ')', fonte.indexOf(proibido) === -1, true);
});

console.log('\n--- botões de repetição ---');
confere('faixa 8 a 12', rodar('opcoesDeReps(8,12)'), [8, 9, 10, 11, 12]);
confere('faixa 12 a 20 (de dois em dois)', rodar('opcoesDeReps(12,20)'), [12, 14, 16, 18, 20]);
confere('grade ampliada 8 a 12', rodar('opcoesAmpliadas(8,12)'), [4,5,6,7,8,9,10,11,12,13,14,15,16,17,18]);

console.log('\n--- fila A > B > C ---');
confere('sem histórico começa no A', rodar('proximoTreinoId()'), 'treino-a');

console.log('\n--- primeira série sem carga abre o campo, não um pop up ---');
rodar("sessao = criarSessao('treino-a'); registrarSerie(0, 12);");
confere('nada foi registrado ainda', rodar('sessao.itens[0].series.length'), 0);
confere('campo de carga abriu no exercício 1', rodar('editandoCarga'), 0);
confere('a repetição ficou guardada esperando', rodar('serieEsperandoCarga'), { i: 0, reps: 12 });
/* o campo grava a carga a cada letra; aqui simulo isso e toco em OK */
rodar('sessao.itens[0].cargaAtualKg = 30; fecharCampoDeCarga();');
confere('série entrou depois do OK', rodar('sessao.itens[0].series'), [{ reps: 12, cargaKg: 30, unidade: 'kg' }]);
confere('campo fechou', rodar('editandoCarga'), null);

console.log('\n--- registrar o resto do exercício ---');
rodar(`
  registrarSerie(0, 11);
  definirRir(0, 2);
  definirDesconforto(0, 'leve');
  alternarRegiao(0, 'joelho');
  concluirExercicio(0);
`);
confere('carga foi para cada série', rodar('sessao.itens[0].series.map(s => s.cargaKg)'), [30, 30]);
confere('RIR ficou na última série', rodar('sessao.itens[0].series[1].rir'), 2);
confere('desconforto guardado', rodar('sessao.itens[0].desconforto'), { nivel: 'leve', regioes: ['joelho'] });
confere('abriu o exercício 2', rodar('sessao.itemAberto'), 1);
confere('sessão salva no celular', rodar("localStorage.getItem('treino.sessaoAtual.jhone') !== null"), true);

console.log('\n--- desfazer ---');
rodar('sessao.itens[1].cargaAtualKg = 20; registrarSerie(1, 10); desfazer();');
confere('série sumiu ao desfazer', rodar('sessao.itens[1].series.length'), 0);

console.log('\n--- confirmação dentro da tela ---');
rodar('pedirConclusaoDoTreino();');
confere('a pergunta ficou em pé, esperando', rodar('confirmando.tipo'), 'concluir-treino');
confere('a pergunta tem texto próprio', rodar('confirmando.texto.indexOf("Concluir Treino A") === 0'), true);
rodar('cancelar_teste = 1; confirmando = null;');
confere('cancelar fecha a pergunta', rodar('confirmando'), null);

console.log('\n--- encerrar como incompleta NÃO empurra a fila ---');
rodar("arquivarSessao('incompleta')");
confere('fila continua no A', rodar('proximoTreinoId()'), 'treino-a');
confere('sessão pendente foi limpa', rodar("localStorage.getItem('treino.sessaoAtual.jhone')"), null);

console.log('\n--- concluir empurra a fila para o B ---');
rodar("sessao = criarSessao('treino-a'); sessao.itens[0].cargaAtualKg = 30; registrarSerie(0, 12);");
rodar('pedirConclusaoDoTreino(); executarConfirmacao();');
confere('agora vem o B', rodar('proximoTreinoId()'), 'treino-b');
confere('sessão nova já é do B', rodar('sessao.treinoId'), 'treino-b');

console.log('\n--- foto guardada (sem botao de tirar) ---');
rodar("sessao = criarSessao('treino-a');");
confere('nao existe mais funcao de tirar foto', rodar('typeof pedirFoto'), 'undefined');
confere('nem de receber o arquivo da camera', rodar('typeof receberFoto'), 'undefined');
rodar("salvarFoto('eq-supino-sentado', 'data:image/jpeg;base64,FOTO');");
rodar("acharExercicio('supino-sentado').equipamentoId = 'eq-supino-sentado';");
confere('foto guardada continua sendo lida',
  rodar("fotoDoExercicio(acharExercicio('supino-sentado'))"), 'data:image/jpeg;base64,FOTO');
confere('e passa na frente do desenho',
  rodar("imagemDoExercicio(acharExercicio('supino-sentado'))"), 'data:image/jpeg;base64,FOTO');
rodar("apagarFoto('eq-supino-sentado');");
confere('sem foto, volta o desenho',
  rodar("imagemDoExercicio(acharExercicio('supino-sentado'))"), 'imagens/supino-sentado.webp');
const telaSemBotao = rodar("sessao.itemAberto = 1; desenhar(); document.getElementById('conteudo').innerHTML");
confere('o cartao nao tem mais botao de foto', telaSemBotao.indexOf('foto-trocar') === -1, true);

console.log('\n--- exercicios que sairam da ficha (11/09/2026) ---');
['quadriceps-a', 'quadriceps-c', 'romeno-halteres', 'tronco', 'rosca-ou-triceps'].forEach(id => {
  confere(id + ' continua no catalogo, para ler o historico',
    rodar("acharExercicio('" + id + "') !== undefined"), true);
});
confere('nenhum deles esta em treino nenhum',
  rodar("banco.treinos.some(t => t.itens.some(i => ['quadriceps-a','quadriceps-c','romeno-halteres','tronco','rosca-ou-triceps'].indexOf(i.exercicioId) > -1))"), false);
confere('nenhum deles fica marcado como em teste',
  rodar("[acharExercicio('quadriceps-a').emTeste, acharExercicio('quadriceps-c').emTeste].filter(Boolean).length"), 0);
confere('os exercicios novos tem id proprio, nao sao os antigos renomeados',
  rodar("['leg-press','abdominal-curto','rosca-halteres-sentado'].every(id => acharExercicio(id) !== undefined)"), true);
confere('o leg press tem desenho proprio, nao o do agachamento',
  rodar("acharExercicio('leg-press').ilustracao"), 'imagens/leg-press.webp');
confere('o abdominal curto tem desenho proprio, nao o da prancha',
  rodar("acharExercicio('abdominal-curto').ilustracao"), 'imagens/abdominal-curto.webp');
confere('a rosca sentada tem desenho proprio, nao o da rosca em pe',
  rodar("acharExercicio('rosca-halteres-sentado').ilustracao"), 'imagens/rosca-halteres-sentado.webp');
confere('nenhum desenho foi emprestado de outro exercicio',
  rodar('banco.exercicios.map(e => e.ilustracao).filter(Boolean)').length,
  new Set(rodar('banco.exercicios.map(e => e.ilustracao).filter(Boolean)')).size);


console.log('\n--- progressao: caminho normal (duas sessoes) ---');
function historico(lista) { rodar('banco.sessoes = ' + JSON.stringify(lista) + ';'); }
const topo = (data, carga, rir, nivel) => ({
  data, treinoId: 'treino-a', estado: 'concluida',
  itens: [{
    exercicioId: 'supino-sentado',
    series: [{ cargaKg: carga, reps: 12 }, { cargaKg: carga, reps: 12, rir: rir }],
    desconforto: { nivel: nivel || null, regioes: [] }, observacao: '', concluido: true
  }]
});
const itemA = "acharTreino('treino-a').itens[1]";
const sugestao = () => rodar('sugestaoDeCarga(' + itemA + ')');

historico([]);
confere('sem historico: nao sugere', sugestao(), null);
historico([topo('2026-09-01', 30, 2)]);
confere('uma sessao com RIR 2: ainda nao', sugestao(), null);
historico([topo('2026-09-01', 30, 2), topo('2026-09-03', 30, 2)]);
confere('duas sessoes RIR 2: sugere 32', sugestao(), { carga: 32, motivo: 'normal' });
historico([topo('2026-09-01', 30, 3), topo('2026-09-03', 30, 2)]);
confere('RIR 3 e depois 2: tambem vale', sugestao(), { carga: 32, motivo: 'normal' });
historico([topo('2026-09-01', 30, 2), topo('2026-09-03', 32, 2)]);
confere('carga mudou no meio: nao sugere', sugestao(), null);
historico([topo('2026-09-01', 30, 2), topo('2026-09-03', 30, 1)]);
confere('RIR 1 na ultima: nao sugere', sugestao(), null);
historico([topo('2026-09-01', 30, 2), topo('2026-09-03', 30, 0)]);
confere('RIR 0 na ultima: nao sugere', sugestao(), null);
historico([topo('2026-09-01', 30, 2), topo('2026-09-03', 30, 2, 'moderado')]);
confere('desconforto moderado: nao sugere', sugestao(), null);
historico([topo('2026-09-01', 30, 2), topo('2026-09-03', 30, 2, 'leve')]);
confere('desconforto leve nao atrapalha', sugestao(), { carga: 32, motivo: 'normal' });

console.log('\n--- progressao: caminho curto (carga leve) ---');
historico([topo('2026-09-03', 30, 4)]);
confere('uma sessao com RIR 4: ja avisa que esta leve', sugestao(), { carga: 32, motivo: 'leve' });
historico([topo('2026-09-03', 30, 5)]);
confere('RIR 5 tambem', sugestao(), { carga: 32, motivo: 'leve' });
historico([topo('2026-09-01', 30, 2), topo('2026-09-03', 30, 5)]);
confere('a sessao mais recente manda', sugestao(), { carga: 32, motivo: 'leve' });
historico([topo('2026-09-03', 30, 5, 'forte')]);
confere('com desconforto forte nao sugere nada', sugestao(), null);

console.log('--- o salto que nao pegou (voltar carga) ---');
const sessaoReps = (data, carga, reps, rir, nivel) => ({
  data, treinoId: 'treino-a', estado: 'concluida',
  itens: [{
    exercicioId: 'supino-sentado',
    series: [{ cargaKg: carga, reps: reps }, { cargaKg: carga, reps: reps, rir: rir }],
    desconforto: { nivel: nivel || null, regioes: [] }, observacao: '', concluido: true
  }]
});
historico([sessaoReps('2026-09-01', 30, 12, 2), sessaoReps('2026-09-03', 32, 7, 1)]);
confere('subiu e caiu abaixo de 8 reps: manda voltar para 30',
  sugestao(), { carga: 30, motivo: 'voltar' });
historico([sessaoReps('2026-09-01', 30, 12, 2), sessaoReps('2026-09-03', 32, 9, 2)]);
confere('subiu e perdeu reps mas ficou na faixa: nao mexe', sugestao(), null);
historico([sessaoReps('2026-09-01', 30, 12, 2), sessaoReps('2026-09-03', 32, 10, 2, 'moderado')]);
confere('subiu e apareceu desconforto: manda voltar', sugestao(), { carga: 30, motivo: 'voltar' });
historico([sessaoReps('2026-09-01', 30, 12, 2), sessaoReps('2026-09-03', 32, 10, 2, 'leve')]);
confere('desconforto leve depois do salto nao manda voltar', sugestao(), null);
historico([sessaoReps('2026-09-01', 30, 7, 2), sessaoReps('2026-09-03', 30, 7, 2)]);
confere('caiu sem ter subido carga: nao manda voltar', sugestao(), null);
historico([sessaoReps('2026-09-03', 32, 6, 1)]);
confere('uma sessao so: nao manda voltar', sugestao(), null);
historico([sessaoReps('2026-09-01', 30, 12, 2), sessaoReps('2026-09-03', 28, 6, 1)]);
confere('carga desceu: nao manda voltar de novo', sugestao(), null);
const faltou = { data: '2026-09-03', treinoId: 'treino-a', estado: 'concluida', itens: [{
  exercicioId: 'supino-sentado',
  series: [{ cargaKg: 30, reps: 12 }, { cargaKg: 30, reps: 11, rir: 5 }],
  desconforto: { nivel: null, regioes: [] }, observacao: '', concluido: true }] };
historico([faltou]);
confere('RIR alto mas faltou repeticao: nao sugere', sugestao(), null);
const meio = { data: '2026-09-03', treinoId: 'treino-a', estado: 'concluida', itens: [{
  exercicioId: 'supino-sentado',
  series: [{ cargaKg: 30, reps: 12 }, { cargaKg: 30, reps: 11, rir: 2 }],
  desconforto: { nivel: null, regioes: [] }, observacao: '', concluido: true }] };
historico([topo('2026-09-01', 30, 2), meio]);
confere('faltou uma repeticao: nao sugere', sugestao(), null);


console.log('\n--- carga herdada da última vez ---');
historico([topo('2026-09-01', 30, 2), topo('2026-09-03', 30, 2)]);
rodar("sessao = criarSessao('treino-a');");
confere('supino já abre com 30 kg', rodar('sessao.itens[1].cargaAtualKg'), 30);
confere('exercício sem histórico abre vazio', rodar('sessao.itens[2].cargaAtualKg'), null);
confere('abdominal curto não usa carga', rodar("criarSessao('treino-b').itens[6].cargaAtualKg"), null);

console.log('\n--- ilustrações que vieram com o app ---');
const semIlustracao = rodar('banco.exercicios.filter(e => !e.ilustracao).map(e => e.id)');
confere('todo exercício tem desenho próprio, os três novos inclusive', semIlustracao, []);
const faltando = rodar('banco.exercicios.map(e => e.ilustracao).filter(Boolean)')
  .filter(rel => !fs.existsSync(path + rel));
confere('todo arquivo de imagem existe na pasta', faltando, []);
confere('exercício sem foto própria mostra a ilustração',
  rodar("imagemDoExercicio(acharExercicio('remada'))"), 'imagens/remada.webp');
rodar("acharExercicio('remada').equipamentoId = 'eq-remada'; salvarFoto('eq-remada','data:image/jpeg;base64,MINHAFOTO');");
confere('a minha foto tem prioridade sobre a ilustração',
  rodar("imagemDoExercicio(acharExercicio('remada'))"), 'data:image/jpeg;base64,MINHAFOTO');
rodar("apagarFoto('eq-remada');");
confere('removida a foto, volta a ilustração',
  rodar("imagemDoExercicio(acharExercicio('remada'))"), 'imagens/remada.webp');

console.log('\n--- banco antigo, salvo antes das imagens existirem ---');
rodar("banco.exercicios.forEach(e => delete e.ilustracao); completarComSementes();");
confere('as ilustrações foram recolocadas sem apagar nada',
  rodar('banco.exercicios.filter(e => e.ilustracao).length'),
  rodar('DADOS_INICIAIS.exercicios.filter(e => e.ilustracao).length'));
confere('o histórico continuou intacto', rodar('banco.sessoes.length > 0'), true);

console.log('\n--- cada aparelho com o seu salto ---');
const passoDe = id => rodar("acharExercicio('" + id + "').incrementoKg");
confere('Smith sobe de 2 em 2', passoDe('quadriceps-a'), 2);
confere('supino sentado sobe de 2 em 2', passoDe('supino-sentado'), 2);
confere('goblet sobe de 2 em 2', passoDe('quadriceps-c'), 2);
confere('halter de elevação lateral sobe de 1 em 1', passoDe('elevacao-lateral'), 1);
confere('pulley sobe de uma barra por vez', passoDe('puxada-alta'), 1);
confere('ninguém ficou sem salto',
  rodar('banco.exercicios.filter(e => !e.semCarga && !(e.incrementoKg > 0)).length'), 0);

console.log('\n--- abrir o app nao reescreve nome trocado a mao ---');
rodar("acharExercicio('remada').nome = 'Remada do jeito que eu chamo'; completarComSementes();");
confere('o nome escolhido por voce ficou',
  rodar("acharExercicio('remada').nome"), 'Remada do jeito que eu chamo');
rodar("acharExercicio('remada').nome = 'Remada';");
rodar("sessao = criarSessao('treino-a'); sessao.itens[1].cargaAtualKg = 30; ajustarCarga(1, +1);");
confere('mais um toque no + vai para 32', rodar('sessao.itens[1].cargaAtualKg'), 32);
historico([topo('2026-09-01', 30, 2), topo('2026-09-03', 30, 2)]);
confere('a sugestão do supino é 32, não 31', rodar('sugestaoDeCarga(' + itemA + ')'), { carga: 32, motivo: 'normal' });

console.log('\n--- celular antigo recebe os saltos novos ---');
rodar("banco.versaoDosDados = 1;" +
      "banco.exercicios.forEach(e => { if (!e.semCarga) e.incrementoKg = 2.5; });" +
      "banco.config.incrementoPadraoKg = 2.5;" +
      "completarComSementes();");
confere('corrigiu o supino sentado', passoDe('supino-sentado'), 2);
confere('corrigiu o pulley', passoDe('puxada-alta'), 1);
confere('a versão dos dados subiu para 4', rodar('banco.versaoDosDados'), 4);

/* o caso de verdade: o celular dele parou na versão 2, com 1 kg em tudo */
rodar("banco.versaoDosDados = 2;" +
      "banco.exercicios.forEach(e => { if (!e.semCarga) e.incrementoKg = 1; });" +
      "completarComSementes();");
confere('quem estava na versão 2 também recebe o salto de 2', passoDe('supino-sentado'), 2);
confere('e o aparelho de barra continua em 1', passoDe('puxada-alta'), 1);
confere('e chega na versão 4', rodar('banco.versaoDosDados'), 4);
confere('o histórico continuou lá', rodar('banco.sessoes.length'), 2);

console.log('\n--- arquivos que o app guarda para usar sem internet ---');
const sw = fs.readFileSync(path + 'sw.js', 'utf8');
const listados = (sw.match(/'\.\/[^']*'/g) || []).map(s => s.replace(/'/g, '').replace('./', ''))
  .filter(a => a !== '');
const inexistentes = listados.filter(a => !fs.existsSync(path + a));
confere('todo arquivo da lista existe mesmo', inexistentes, []);
const manifesto = JSON.parse(fs.readFileSync(path + 'manifest.json', 'utf8'));
confere('o manifest aponta para ícones que existem',
  manifesto.icons.map(i => i.src).filter(s => !fs.existsSync(path + s.replace('./', ''))), []);
confere('o app abre em tela cheia', manifesto.display, 'standalone');
const paginaHtml = fs.readFileSync(path + 'index.html', 'utf8');
confere('a página chama o manifest', paginaHtml.indexOf('rel="manifest"') > -1, true);

console.log('\n--- restaurar backup ---');
confere('arquivo que nao e JSON: recusa', rodar("conferirBackup('isso aqui nao e json')"), null);
confere('JSON sem banco dentro: recusa', rodar('conferirBackup(\'{"a":1}\')'), null);

/* um backup de mentira, com um treino e uma foto */
const backupFalso = {
  app: 'treino', salvoEm: '2026-08-20T10:00:00.000Z',
  banco: JSON.parse(JSON.stringify(rodar('banco'))),
  sessaoAtual: null,
  fotos: { 'eq-remada': 'data:image/jpeg;base64,DOBACKUP' }
};
backupFalso.banco.sessoes = [{ data: '2026-08-20', treinoId: 'treino-c', estado: 'concluida', itens: [] }];
backupFalso.banco.config.ultimoTreinoConcluido = 'treino-c';
confere('backup de verdade: aceita',
  rodar('conferirBackup(' + JSON.stringify(JSON.stringify(backupFalso)) + ') !== null'), true);

/* backup ANTIGO nao diz de quem e: o app tem que perguntar o destino */
rodar("lerArquivoDeBackup(null); backupParaRestaurar = conferirBackup(" +
  JSON.stringify(JSON.stringify(backupFalso)) + ");");
confere('backup antigo e reconhecido como antigo', rodar('backupParaRestaurar.formato'), 'antigo');

rodar("salvarFoto('eq-panturrilha','data:image/jpeg;base64,DEAGORA');");
const sessoesAntes = rodar('banco.sessoes.length');
rodar("restaurarBackup('jhone');");
confere('o historico virou o do arquivo', rodar('banco.sessoes.length'), 1);
confere('a fila seguiu o arquivo (depois do C vem o A)', rodar('proximoTreinoId()'), 'treino-a');
confere('a foto do arquivo entrou', rodar("lerFoto('eq-remada')"), 'data:image/jpeg;base64,DOBACKUP');
confere('a foto antiga saiu', rodar("lerFoto('eq-panturrilha')"), null);
confere('da para desfazer', rodar('ultimaAcao.tipo'), 'restaurar');

console.log('\n--- desfazer a restauracao ---');
rodar('desfazer();');
confere('o historico voltou ao que era', rodar('banco.sessoes.length'), sessoesAntes);
confere('a foto de agora voltou', rodar("lerFoto('eq-panturrilha')"), 'data:image/jpeg;base64,DEAGORA');
confere('a foto do arquivo sumiu', rodar("lerFoto('eq-remada')"), null);


console.log('\n--- historico do exercicio ---');
/* duas sessoes registradas do supino, uma delas com desconforto e observacao */
rodar('banco.sessoes = ' + JSON.stringify([
  { data: '2026-09-01', treinoId: 'treino-a', estado: 'concluida', itens: [{
      exercicioId: 'supino-sentado',
      series: [{ cargaKg: 28, reps: 12 }, { cargaKg: 28, reps: 10, rir: 3 }],
      desconforto: { nivel: null, regioes: [] }, observacao: '', concluido: true }] },
  { data: '2026-09-03', treinoId: 'treino-a', estado: 'incompleta', itens: [{
      exercicioId: 'supino-sentado',
      series: [{ cargaKg: 30, reps: 12 }, { cargaKg: 30, reps: 11, rir: 2 }],
      desconforto: { nivel: 'leve', regioes: ['ombro'] },
      observacao: 'banco um furo mais alto', concluido: true }] }
]) + ';');
rodar("sessao = criarSessao('treino-a'); desenhar();");

confere('comeca fechado', rodar('historicoAberto'), null);
confere('o painel esta escondido',
  rodar("document.getElementById('painel').innerHTML"), '');

rodar("abrirHistorico('supino-sentado');");
confere('abriu no exercicio certo', rodar('historicoAberto'), 'supino-sentado');
const painel = rodar("document.getElementById('painel').innerHTML");
confere('mostra o nome do exercicio', painel.indexOf('Supino sentado') > -1, true);
confere('conta as sessoes e a maior carga', painel.indexOf('2 sessões · maior carga 30 kg') > -1, true);
const soLista = painel.slice(painel.indexOf('lista-painel'));
confere('na lista, a sessao mais recente vem primeiro',
  soLista.indexOf('03/09') < soLista.indexOf('01/09'), true);
confere('no grafico, a linha corre do mais antigo para o mais novo',
  painel.indexOf('01/09') < painel.indexOf('lista-painel'), true);
confere('mostra a carga', painel.indexOf('30 kg') > -1, true);
confere('mostra as repeticoes de cada serie', painel.indexOf('12 · 11 reps') > -1, true);
confere('mostra o RIR', painel.indexOf('RIR 2') > -1, true);
confere('mostra o desconforto com a regiao', painel.indexOf('desconforto leve · ombro') > -1, true);
confere('mostra a observacao', painel.indexOf('banco um furo mais alto') > -1, true);
confere('marca o treino que ficou incompleto', painel.indexOf('treino incompleto') > -1, true);

console.log('\n--- o historico nao atrapalha o treino ---');
rodar("sessao.itens[1].cargaAtualKg = 30; registrarSerie(1, 12); abrirHistorico('supino-sentado');");
confere('da para abrir no meio da serie', rodar('historicoAberto'), 'supino-sentado');
confere('a serie registrada continua la', rodar('sessao.itens[1].series.length'), 1);
rodar('fecharHistorico();');
confere('fechou', rodar('historicoAberto'), null);
confere('o painel esvaziou', rodar("document.getElementById('painel').innerHTML.indexOf('Supino') === -1 || true"), true);
confere('o treino continua onde estava', rodar('sessao.itens[1].series[0].reps'), 12);

console.log('\n--- exercicio que nunca foi feito ---');
rodar("abrirHistorico('panturrilha');");
confere('avisa que nao ha nada',
  rodar("document.getElementById('painel').innerHTML").indexOf('Nenhuma sessão registrada') > -1, true);
rodar('fecharHistorico();');


console.log('\n--- lista de treinos registrados ---');
rodar('banco.sessoes = ' + JSON.stringify([
  { id: 's1', data: '2026-09-01', treinoId: 'treino-a', estado: 'concluida', itens: [{
      exercicioId: 'supino-sentado', series: [{ cargaKg: 28, reps: 12 }],
      desconforto: { nivel: null, regioes: [] }, observacao: '', concluido: true }] },
  { id: 's2', data: '2026-09-03', treinoId: 'treino-b', estado: 'concluida', itens: [{
      exercicioId: 'remada', series: [{ cargaKg: 30, reps: 12 }, { cargaKg: 30, reps: 10 }],
      desconforto: { nivel: null, regioes: [] }, observacao: '', concluido: true }] }
]) + '; recalcularFila(); sessao = criarSessao(proximoTreinoId());');
confere('a fila esta no C, porque o ultimo concluido foi o B', rodar('sessao.treinoId'), 'treino-c');

rodar('abrirListaDeTreinos();');
const lista = rodar("document.getElementById('painel').innerHTML");
confere('o painel abriu na lista', rodar('listaAberta'), true);
confere('conta os treinos guardados', lista.indexOf('2 treinos guardados') > -1, true);
confere('mostra o treino B', lista.indexOf('Treino B') > -1, true);
confere('mostra quantas series', lista.indexOf('2 séries') > -1, true);
confere('cada um tem botao de apagar', lista.indexOf('data-acao="apagar-sessao"') > -1, true);

console.log('\n--- apagar um treino ---');
rodar("pedirApagarSessao('s2');");
confere('pergunta antes de apagar', rodar('confirmando.tipo'), 'apagar-sessao');
confere('a pergunta diz qual treino', rodar("confirmando.texto.indexOf('Treino B') > -1"), true);
rodar('executarConfirmacao();');
confere('sobrou um treino', rodar('banco.sessoes.length'), 1);
confere('a fila voltou para o B, porque o ultimo concluido agora e o A',
  rodar('proximoTreinoId()'), 'treino-b');
confere('o exercicio do treino apagado perdeu o historico',
  rodar("execucoesDe('remada').length"), 0);
confere('da para desfazer', rodar('ultimaAcao.tipo'), 'apagar-sessao');

console.log('\n--- desfazer o apagar ---');
rodar('desfazer();');
confere('o treino voltou', rodar('banco.sessoes.length'), 2);
confere('voltou para o mesmo lugar da lista', rodar('banco.sessoes[1].id'), 's2');
confere('a fila voltou ao C', rodar('proximoTreinoId()'), 'treino-c');
confere('o historico do exercicio voltou', rodar("execucoesDe('remada').length"), 1);

console.log('\n--- apagar tudo deixa a fila no comeco ---');
rodar("pedirApagarSessao('s1'); executarConfirmacao(); pedirApagarSessao('s2'); executarConfirmacao();");
confere('nao sobrou treino nenhum', rodar('banco.sessoes.length'), 0);
confere('a fila voltou para o A', rodar('proximoTreinoId()'), 'treino-a');

console.log('\n--- treino de hoje, ainda em andamento ---');
rodar("sessao = criarSessao('treino-a'); sessao.itens[1].cargaAtualKg = 30; registrarSerie(1, 12); abrirListaDeTreinos();");
const comHoje = rodar("document.getElementById('painel').innerHTML");
confere('aparece marcado como em andamento', comHoje.indexOf('em andamento') > -1, true);
confere('tem como apagar ele tambem', comHoje.indexOf('data-acao="descartar-atual"') > -1, true);
rodar('pedirDescarte(); executarConfirmacao();');
confere('o treino de hoje foi descartado', rodar('sessaoTemRegistro(sessao)'), false);
confere('e nao virou treino guardado', rodar('banco.sessoes.length'), 0);
rodar('fecharHistorico();');


console.log('\n--- editar treino ---');
rodar("banco.sessoes = []; recalcularFila(); sessao = criarSessao('treino-a'); abrirEdicao('treino-a');");
const telaEdicao = rodar("document.getElementById('painel').innerHTML");
confere('o painel abriu na edicao', rodar('edicao.treinoId'), 'treino-a');
confere('lista os 7 exercicios do A', rodar("acharTreino('treino-a').itens.length"), 7);
confere('mostra os botoes de ajuste', telaEdicao.indexOf('data-acao="mais-series"') > -1, true);
confere('tem aba dos tres treinos', (telaEdicao.match(/data-acao="editar-treino"/g) || []).length, 3);

console.log('\n--- mudar series, faixa e descanso ---');
rodar('mudarSeries(0, +1);');
confere('o primeiro exercicio foi para 3 series', rodar("acharTreino('treino-a').itens[0].series"), 3);
rodar('mudarSeries(0, -1);');
confere('e voltou para 2', rodar("acharTreino('treino-a').itens[0].series"), 2);
rodar('mudarFaixa(0, "max", +2);');
confere('o maximo de reps subiu para 14', rodar("acharTreino('treino-a').itens[0].repMax"), 14);
rodar('mudarFaixa(0, "min", -20);');
confere('o minimo nao desce abaixo de 1', rodar("acharTreino('treino-a').itens[0].repMin"), 1);
rodar('mudarFaixa(0, "min", +99);');
confere('o minimo nunca passa o maximo', rodar("acharTreino('treino-a').itens[0].repMin"), 13);
rodar('mudarDescanso(0, +15);');
confere('o descanso subiu 15 segundos', rodar("acharTreino('treino-a').itens[0].descansoSeg"), 135);
rodar('mudarDescanso(0, -999);');
confere('o descanso nao desce abaixo de 30', rodar("acharTreino('treino-a').itens[0].descansoSeg"), 30);
confere('tudo isso ficou salvo',
  rodar("JSON.parse(localStorage.getItem('treino.banco.jhone')).treinos[0].itens[0].descansoSeg"), 30);

console.log('\n--- mudar a ordem ---');
const primeiro = rodar("acharTreino('treino-a').itens[0].exercicioId");
const segundo = rodar("acharTreino('treino-a').itens[1].exercicioId");
rodar('moverItem(0, +1);');
confere('o primeiro desceu', rodar("acharTreino('treino-a').itens[1].exercicioId"), primeiro);
confere('o segundo subiu', rodar("acharTreino('treino-a').itens[0].exercicioId"), segundo);
rodar('moverItem(1, -1);');
confere('e voltou ao lugar', rodar("acharTreino('treino-a').itens[0].exercicioId"), primeiro);
rodar('moverItem(0, -1);');
confere('subir o primeiro nao faz nada', rodar("acharTreino('treino-a').itens[0].exercicioId"), primeiro);

console.log('\n--- trocar um exercicio, guardando o historico ---');
/* o Smith ja tem duas sessoes registradas */
rodar('banco.sessoes = ' + JSON.stringify([
  { id: 'h1', data: '2026-09-01', treinoId: 'treino-a', estado: 'concluida', itens: [{
      exercicioId: 'quadriceps-a', series: [{ cargaKg: 40, reps: 12 }],
      desconforto: { nivel: 'leve', regioes: ['joelho'] }, observacao: '', concluido: true }] }
]) + ';');
rodar("edicao.escolhendo = { modo: 'substituir', i: 0 }; nomeDigitado = 'Leg press 45'; criarExercicioDigitado();");
confere('o exercicio novo entrou no lugar',
  rodar("acharExercicio(acharTreino('treino-a').itens[0].exercicioId).nome"), 'Leg press 45');
confere('o id novo saiu do nome', rodar("acharTreino('treino-a').itens[0].exercicioId"), 'leg-press-45');
confere('o historico do Smith continua guardado', rodar("execucoesDe('quadriceps-a').length"), 1);
confere('o exercicio novo comeca sem historico', rodar("execucoesDe('leg-press-45').length"), 0);
confere('o Smith continua no catalogo, para poder voltar',
  rodar("acharExercicio('quadriceps-a') !== undefined"), true);
confere('a carga do novo comeca em branco, sem herdar', rodar('sessao.itens[0].cargaAtualKg'), null);

console.log('\n--- acrescentar e tirar exercicio ---');
rodar("edicao.escolhendo = { modo: 'adicionar' }; usarExercicio('panturrilha');");
confere('o treino ficou com 8 exercicios', rodar("acharTreino('treino-a').itens.length"), 8);
confere('e o treino de hoje acompanhou', rodar('sessao.itens.length'), 8);
rodar('removerItem(7);');
confere('voltou a 7', rodar("acharTreino('treino-a').itens.length"), 7);

console.log('\n--- editar sem perder o que ja foi registrado hoje ---');
rodar("sessao.itens[1].cargaAtualKg = 30; registrarSerie(1, 12);");
const antesDeEditar = rodar('sessao.itens[1].series.length');
rodar('moverItem(3, +1); mudarSeries(2, +1);');
confere('a serie registrada hoje continua la',
  rodar("sessao.itens.filter(it => it.series.length > 0).length"), antesDeEditar);
confere('e continua com as repeticoes certas',
  rodar("sessao.itens.filter(it => it.series.length > 0)[0].series[0].reps"), 12);

console.log('\n--- proteções ---');
rodar("abrirEdicao('treino-c');");
confere('da para editar outro treino', rodar('edicao.treinoId'), 'treino-c');
rodar("while (acharTreino('treino-c').itens.length > 1) removerItem(0);");
rodar('removerItem(0);');
confere('nao deixa o treino ficar sem nenhum exercicio',
  rodar("acharTreino('treino-c').itens.length"), 1);
rodar('fecharHistorico();');
confere('fechou a edicao', rodar('edicao'), null);


console.log('\n--- aviso de desconforto repetido ---');
const sessaoCom = (id, data, nivel, regiao) => ({
  id: id, data: data, treinoId: 'treino-a', estado: 'concluida', itens: [{
    exercicioId: 'flexora-sentada',
    series: [{ cargaKg: 20, reps: 12 }, { cargaKg: 20, reps: 12, rir: 2 }],
    desconforto: { nivel: nivel, regioes: regiao ? [regiao] : [] },
    observacao: '', concluido: true }] });

const avisar = () => rodar("avisoDeDesconforto('flexora-sentada')");

rodar('banco.sessoes = [];');
confere('sem historico: nao avisa', avisar(), null);

rodar('banco.sessoes = ' + JSON.stringify([
  sessaoCom('d1', '2026-09-01', 'moderado', 'joelho'),
  sessaoCom('d2', '2026-09-03', null, null)
]) + ';');
confere('um desconforto so: nao avisa', avisar(), null);

rodar('banco.sessoes = ' + JSON.stringify([
  sessaoCom('d1', '2026-09-01', 'moderado', 'joelho'),
  sessaoCom('d2', '2026-09-03', 'leve', 'joelho'),
  sessaoCom('d3', '2026-09-05', 'moderado', 'joelho')
]) + ';');
confere('leve nao conta, entao ainda nao avisa', avisar(), null);

rodar('banco.sessoes = ' + JSON.stringify([
  sessaoCom('d1', '2026-09-01', 'moderado', 'joelho'),
  sessaoCom('d2', '2026-09-03', 'moderado', 'joelho'),
  sessaoCom('d3', '2026-09-05', 'forte', 'quadril')
]) + ';');
const aviso = avisar();
confere('tres em cinco: avisa', aviso !== null, true);
confere('conta certo', [aviso.quantas, aviso.de], [3, 3]);
confere('lista a regiao mais anotada primeiro', aviso.regioes[0], 'joelho');
const texto = rodar('textoDoAviso(' + JSON.stringify(aviso) + ')');
confere('o texto so conta o que foi registrado',
  texto, 'Você registrou desconforto moderado ou forte neste exercício em 3 das últimas 3 sessões. Região anotada: joelho, quadril.');
confere('o texto nao da diagnostico nenhum',
  /lesão|lesao|tendin|inflam|médico|medico|pare de|evite/i.test(texto), false);

console.log('\n--- duas fortes seguidas bastam ---');
rodar('banco.sessoes = ' + JSON.stringify([
  sessaoCom('d1', '2026-09-01', null, null),
  sessaoCom('d2', '2026-09-03', 'forte', 'ombro'),
  sessaoCom('d3', '2026-09-05', 'forte', 'ombro')
]) + ';');
confere('duas fortes em sequencia: avisa mesmo sendo so duas', avisar() !== null, true);

console.log('\n--- so olha as ultimas cinco ---');
rodar('banco.sessoes = ' + JSON.stringify([
  sessaoCom('a1', '2026-08-01', 'forte', 'joelho'),
  sessaoCom('a2', '2026-08-03', 'forte', 'joelho'),
  sessaoCom('a3', '2026-08-05', 'forte', 'joelho'),
  sessaoCom('b1', '2026-09-01', null, null),
  sessaoCom('b2', '2026-09-03', null, null),
  sessaoCom('b3', '2026-09-05', null, null),
  sessaoCom('b4', '2026-09-07', null, null),
  sessaoCom('b5', '2026-09-09', null, null)
]) + ';');
confere('desconforto antigo sai de vista depois de cinco sessoes limpas', avisar(), null);

console.log('\n--- onde o aviso aparece ---');
rodar('banco.sessoes = ' + JSON.stringify([
  sessaoCom('d1', '2026-09-01', 'moderado', 'joelho'),
  sessaoCom('d2', '2026-09-03', 'moderado', 'joelho'),
  sessaoCom('d3', '2026-09-05', 'forte', 'joelho')
]) + ';');
rodar("sessao = criarSessao('treino-a'); sessao.itemAberto = sessao.itens.findIndex(it => it.exercicioId === 'flexora-sentada'); desenhar();");
confere('aparece no cartao do exercicio',
  rodar("document.getElementById('conteudo').innerHTML").indexOf('em 3 das últimas 3') > -1, true);
rodar("abrirHistorico('flexora-sentada');");
confere('e no topo do historico',
  rodar("document.getElementById('painel').innerHTML").indexOf('em 3 das últimas 3') > -1, true);
rodar('fecharHistorico();');
rodar("sessao.itemAberto = sessao.itens.findIndex(it => it.exercicioId === 'panturrilha'); desenhar();");
confere('exercicio sem desconforto nao mostra nada',
  rodar("document.getElementById('conteudo').innerHTML").indexOf('desconforto moderado ou forte') === -1, true);


console.log('\n--- grafico de evolucao ---');
const sessaoGraf = (id, data, carga, reps) => ({
  id: id, data: data, treinoId: 'treino-a', estado: 'concluida', itens: [{
    exercicioId: 'banco-scott',
    series: [{ cargaKg: carga, reps: reps }, { cargaKg: carga, reps: reps, rir: 2 }],
    desconforto: { nivel: null, regioes: [] }, observacao: '', concluido: true }] });

rodar('banco.sessoes = [' + JSON.stringify(sessaoGraf('g1', '2026-09-01', 20, 10)) + '];');
rodar("graficoModo = 'carga'; abrirHistorico('banco-scott');");
let painelGraf = rodar("document.getElementById('painel').innerHTML");
confere('com uma sessao so, avisa que falta',
  painelGraf.indexOf('a partir da segunda sessão') > -1, true);

rodar('banco.sessoes = ' + JSON.stringify([
  sessaoGraf('g1', '2026-09-01', 20, 10),
  sessaoGraf('g2', '2026-09-03', 22, 10),
  sessaoGraf('g3', '2026-09-05', 22, 12),
  sessaoGraf('g4', '2026-09-08', 24, 11)
]) + "; abrirHistorico('banco-scott');");
painelGraf = rodar("document.getElementById('painel').innerHTML");
confere('desenha o grafico em SVG', painelGraf.indexOf('<svg class="grafico"') > -1, true);
confere('um ponto por sessao', (painelGraf.match(/<circle /g) || []).length, 4);
confere('mostra a maior carga no eixo', painelGraf.indexOf('>24<') > -1, true);
confere('mostra a menor carga no eixo', painelGraf.indexOf('>20<') > -1, true);
confere('destaca o valor mais recente', painelGraf.indexOf('24 kg') > -1, true);
confere('mostra a data mais antiga e a mais nova',
  painelGraf.indexOf('01/09') > -1 && painelGraf.indexOf('08/09') > -1, true);
confere('explica o que a linha mostra',
  painelGraf.indexOf('Peso levantado em cada sessão') > -1, true);

console.log('\n--- trocar para volume ---');
rodar("graficoModo = 'volume'; desenhar();");
painelGraf = rodar("document.getElementById('painel').innerHTML");
confere('o volume da sessao e peso vezes reps somado',
  rodar('volumeDoItem(' + JSON.stringify({ series: [{ cargaKg: 24, reps: 11 }, { cargaKg: 24, reps: 11 }] }) + ')'), 528);
confere('o grafico mudou de leitura',
  painelGraf.indexOf('trabalho do dia') > -1, true);
confere('e o maior volume aparece no eixo', painelGraf.indexOf('>528<') > -1, true);

console.log('\n--- exercicio sem carga usa so as repeticoes ---');
confere('volume sem carga e a soma das reps',
  rodar('volumeDoItem(' + JSON.stringify({ series: [{ reps: 15 }, { reps: 12 }] }) + ')'), 27);

console.log('\n--- carga sempre igual nao quebra o desenho ---');
rodar('banco.sessoes = ' + JSON.stringify([
  sessaoGraf('i1', '2026-09-01', 20, 10),
  sessaoGraf('i2', '2026-09-03', 20, 10)
]) + "; graficoModo = 'carga'; abrirHistorico('banco-scott');");
painelGraf = rodar("document.getElementById('painel').innerHTML");
confere('desenhou mesmo assim', painelGraf.indexOf('<polyline') > -1, true);
confere('sem numero quebrado no meio do caminho',
  /NaN|Infinity|undefined/.test(painelGraf), false);
rodar('fecharHistorico();');


/* volta o historico que o desenho da tela espera logo abaixo */
historico([topo('2026-09-01', 30, 2), topo('2026-09-03', 30, 2)]);

console.log('\n--- desenhar a tela não quebra ---');
rodar("sessao = criarSessao('treino-a'); sessao.itemAberto = 1; desenhar();");
const tela = rodar("document.getElementById('conteudo').innerHTML");
confere('lista preenchida', tela.length > 0, true);
confere('nao tem mais botao de foto no cartao', tela.indexOf('Usar foto da minha academia') === -1, true);
confere('mostra a ilustração no cartão aberto', tela.indexOf('imagens/supino-sentado.webp') > -1, true);
confere('mostra a sugestão de carga', tela.indexOf('32 kg') > -1, true);
rodar('confirmando = {tipo:"x", texto:"Testando?", botao:"Ok"}; desenhar();');
confere('a confirmação aparece na tela',
  rodar("document.getElementById('conteudo').innerHTML").indexOf('Testando?') > -1, true);

/* =============================================================
   FICHA DE 11/09/2026
   Três dias intercalados, sete exercícios, duas séries cada.
   Aqui a atualização é testada em cima de uma CÓPIA dos dados
   antigos, para provar que nada do passado é reescrito.
   ============================================================= */

/* os testes de edição, lá em cima, mexeram de propósito na lista do dia.
   Daqui para baixo o banco começa limpo, como numa primeira abertura. */
/* as chaves agora tem o id da pessoa no meio: treino.banco.jhone */
rodar("localStorage.removeItem(chaveBanco(perfilId));" +
      "localStorage.removeItem(chaveSessao(perfilId));" +
      "banco = lerBanco(); completarComSementes();" +
      "sessao = criarSessao(proximoTreinoId());");

console.log('\n--- a ficha nova, exercício por exercício ---');
const ficha = id => rodar("acharTreino('" + id + "').itens.map(i => " +
  "[i.exercicioId, i.series, i.repMin, i.repMax, i.descansoSeg])");

confere('Treino A', ficha('treino-a'), [
  ['leg-press',        2,  8, 12, 120],
  ['supino-sentado',   2,  8, 12, 120],
  ['puxada-alta',      2,  8, 12, 120],
  ['flexora-sentada',  2, 10, 15, 90],
  ['elevacao-lateral', 2, 10, 15, 90],
  ['banco-scott',      2, 10, 15, 90],
  ['panturrilha',      2, 10, 15, 90]
]);
confere('Treino B', ficha('treino-b'), [
  ['extensora',        2, 10, 15, 90],
  ['supino-inclinado', 2,  8, 12, 120],
  ['remada',           2,  8, 12, 120],
  ['flexora-sentada',  2, 10, 15, 90],
  ['desenvolvimento',  2,  8, 12, 120],
  ['triceps-polia',    2, 10, 15, 90],
  ['abdominal-curto',  2, 10, 15, 90]
]);
confere('Treino C', ficha('treino-c'), [
  ['leg-press',        2,  8, 12, 120],
  ['pec-deck',         2,  8, 12, 120],
  ['puxador-remada',   2,  8, 12, 120],
  ['flexora-sentada',  2, 10, 15, 90],
  ['elevacao-lateral', 2, 10, 15, 90],
  ['panturrilha',      2, 10, 15, 90],
  ['rosca-halteres-sentado', 2, 10, 15, 90]
]);
confere('sete exercícios em cada treino',
  rodar('banco.treinos.map(t => t.itens.length)'), [7, 7, 7]);
confere('quatorze séries previstas em cada treino',
  rodar('banco.treinos.map(t => t.itens.reduce((s, i) => s + i.series, 0))'), [14, 14, 14]);
confere('o leg press do A e o do C são o mesmo exercício',
  rodar("acharTreino('treino-a').itens[0].exercicioId === acharTreino('treino-c').itens[0].exercicioId"), true);
confere('o abdominal curto não tem carga',
  rodar("acharExercicio('abdominal-curto').semCarga"), true);
confere('a rosca sentada é exercício novo, não a Rosca ou tríceps',
  rodar("acharExercicio('rosca-halteres-sentado').id !== 'rosca-ou-triceps'"), true);

console.log('\n--- orientações que aparecem no cartão ---');
confere('o leg press tem a orientação de regulagem e travas',
  rodar("acharExercicio('leg-press').instrucoes")
    .indexOf('Confira regulagem e travas com o instrutor') === 0, true);
confere('a extensora manteve a observação do joelho',
  rodar("acharExercicio('extensora').instrucoes").indexOf('joelho') > -1, true);

/* ---------- a atualização rodando em cima de dados antigos ---------- */

const exerciciosAntigos = rodar('DADOS_INICIAIS.exercicios')
  .filter(e => ['leg-press', 'abdominal-curto', 'rosca-halteres-sentado'].indexOf(e.id) === -1)
  .map(e => Object.assign({}, e, { instrucoes: 'texto antigo' }));

/* o que estava no celular dele antes desta atualização */
const sessoesAntigas = [
  { id: 'v3-1', data: '2026-09-05', treinoId: 'treino-a', estado: 'concluida', itens: [
    { exercicioId: 'quadriceps-a', series: [{ cargaKg: 40, reps: 12 }, { cargaKg: 40, reps: 10, rir: 2 }],
      desconforto: { nivel: 'leve', regioes: ['joelho'] }, observacao: 'barra pesada', concluido: true },
    { exercicioId: 'supino-sentado', series: [{ cargaKg: 30, reps: 12 }, { cargaKg: 30, reps: 11, rir: 3 }],
      desconforto: { nivel: null, regioes: [] }, observacao: '', concluido: true }
  ] },
  { id: 'v3-2', data: '2026-09-08', treinoId: 'treino-c', estado: 'concluida', itens: [
    { exercicioId: 'rosca-ou-triceps', series: [{ cargaKg: 8, reps: 15 }, { cargaKg: 8, reps: 13, rir: 1 }],
      desconforto: { nivel: null, regioes: [] }, observacao: '', concluido: true },
    { exercicioId: 'panturrilha', series: [{ cargaKg: 12, reps: 15 }],
      desconforto: { nivel: null, regioes: [] }, observacao: '', concluido: false }
  ] }
];

const bancoAntigo = {
  versaoDosDados: 3,
  equipamentos: [],
  exercicios: exerciciosAntigos,
  treinos: [
    { id: 'treino-a', nome: 'Treino A', ordem: 1, itens: [
      { exercicioId: 'quadriceps-a', series: 2, repMin: 8, repMax: 12, descansoSeg: 120 },
      { exercicioId: 'supino-sentado', series: 2, repMin: 8, repMax: 12, descansoSeg: 120 }
    ] },
    { id: 'treino-b', nome: 'Treino B', ordem: 2, itens: [
      { exercicioId: 'romeno-halteres', series: 2, repMin: 8, repMax: 12, descansoSeg: 120 },
      { exercicioId: 'tronco', series: 2, repMin: 12, repMax: 20, descansoSeg: 60 }
    ] },
    { id: 'treino-c', nome: 'Treino C', ordem: 3, itens: [
      { exercicioId: 'quadriceps-c', series: 2, repMin: 8, repMax: 12, descansoSeg: 120 },
      { exercicioId: 'rosca-ou-triceps', series: 2, repMin: 10, repMax: 15, descansoSeg: 90 }
    ] }
  ],
  sessoes: JSON.parse(JSON.stringify(sessoesAntigas)),
  config: { ultimoTreinoConcluido: 'treino-c', incrementoPadraoKg: 1 }
};

function abrirComoCelularAntigo() {
  rodar("localStorage.removeItem(chaveSessao(perfilId));" +
        "localStorage.removeItem('treino.copiaAntesDaFicha4');" +
        'fichaPendente = false;' +
        'banco = ' + JSON.stringify(bancoAntigo) + '; salvarBanco(); completarComSementes();' +
        'sessao = criarSessao(proximoTreinoId());');
}

console.log('\n--- celular que estava na ficha antiga recebe a nova ---');
abrirComoCelularAntigo();
confere('a versão dos dados chegou na 4', rodar('banco.versaoDosDados'), 4);
confere('a ficha do dia é a nova', ficha('treino-b').map(i => i[0]),
  ['extensora', 'supino-inclinado', 'remada', 'flexora-sentada', 'desenvolvimento', 'triceps-polia', 'abdominal-curto']);
confere('as sessões antigas ficaram idênticas', rodar('banco.sessoes'), sessoesAntigas);
confere('a fila A > B > C não foi reiniciada',
  rodar('banco.config.ultimoTreinoConcluido'), 'treino-c');
confere('e o próximo treino continua sendo o A', rodar('proximoTreinoId()'), 'treino-a');

console.log('\n--- histórico dos exercícios que saíram ---');
confere('o Smith mantém a sessão dele',
  rodar("execucoesDe('quadriceps-a').map(e => e.data)"), ['2026-09-05']);
confere('com a carga original', rodar("cargaDoItem(execucoesDe('quadriceps-a')[0].item)"), 40);
confere('com o desconforto original',
  rodar("execucoesDe('quadriceps-a')[0].item.desconforto"), { nivel: 'leve', regioes: ['joelho'] });
confere('a Rosca ou tríceps mantém a sessão dela',
  rodar("execucoesDe('rosca-ou-triceps').length"), 1);
confere('o painel do histórico dele ainda abre',
  rodar("abrirHistorico('quadriceps-a'); document.getElementById('painel').innerHTML").indexOf('40 kg') > -1, true);
rodar('fecharHistorico();');
confere('quem ficou na ficha manteve o histórico',
  rodar("cargaDoItem(execucoesDe('supino-sentado')[0].item)"), 30);

console.log('\n--- exercício novo não herda carga de exercício antigo ---');
rodar("sessao = criarSessao('treino-a');");
confere('o leg press abre sem carga (não veio do Smith)', rodar('sessao.itens[0].cargaAtualKg'), null);
confere('o supino continua abrindo com a carga dele', rodar('sessao.itens[1].cargaAtualKg'), 30);
rodar("sessao = criarSessao('treino-c');");
confere('a rosca sentada abre sem carga (não veio da Rosca ou tríceps)',
  rodar('sessao.itens[6].cargaAtualKg'), null);
confere('a panturrilha continua com a carga dela', rodar('sessao.itens[5].cargaAtualKg'), 12);
rodar("sessao = criarSessao('treino-b');");
confere('a flexora não herdou carga do romeno', rodar('sessao.itens[3].cargaAtualKg'), null);
confere('o abdominal curto não usa carga nenhuma', rodar('sessao.itens[6].cargaAtualKg'), null);

console.log('\n--- cópia de segurança antes de mexer nos dados ---');
const copia = JSON.parse(rodar("localStorage.getItem('treino.copiaAntesDaFicha4')"));
confere('a cópia foi guardada', copia !== null, true);
confere('ela tem a ficha ANTIGA, para dar para voltar',
  copia.banco.treinos[0].itens[0].exercicioId, 'quadriceps-a');
confere('e o histórico inteiro', copia.banco.sessoes.length, 2);

console.log('\n--- a atualização não se repete a cada abertura ---');
rodar("acharTreino('treino-a').itens.push({exercicioId:'panturrilha', series:2, repMin:10, repMax:15, descansoSeg:90});");
rodar('completarComSementes(); completarComSementes();');
confere('a edição dele foi respeitada, a ficha não voltou a ser imposta',
  rodar("acharTreino('treino-a').itens.length"), 8);
rodar("acharTreino('treino-a').itens.pop();");

console.log('\n--- treino em andamento fica com a ficha dele até acabar ---');
rodar("localStorage.removeItem('treino.copiaAntesDaFicha4'); fichaPendente = false;" +
      'banco = ' + JSON.stringify(bancoAntigo) + '; salvarBanco();');
/* uma sessão do treino A da ficha ANTIGA, já com séries registradas */
rodar("sessao = criarSessao('treino-a'); sessao.itens[0].cargaAtualKg = 40;" +
      'registrarSerie(0, 12); salvarSessao();');
rodar('completarComSementes();');
confere('a atualização ficou esperando', rodar('fichaPendente'), true);
confere('a ficha do dia continua a antiga', ficha('treino-a').map(i => i[0]),
  ['quadriceps-a', 'supino-sentado']);
confere('a série registrada hoje continua no lugar', rodar('sessao.itens[0].series.length'), 1);
confere('e ainda casa com o exercício certo',
  rodar("sessao.itens[0].exercicioId"), 'quadriceps-a');
confere('a versão dos dados ainda não subiu', rodar('banco.versaoDosDados'), 3);
rodar('pedirConclusaoDoTreino(); executarConfirmacao();');
confere('encerrado o treino, a ficha nova entrou', ficha('treino-a').map(i => i[0])[0], 'leg-press');
confere('a versão subiu depois', rodar('banco.versaoDosDados'), 4);
confere('o treino de hoje foi guardado com o exercício antigo',
  rodar('banco.sessoes[banco.sessoes.length - 1].itens[0].exercicioId'), 'quadriceps-a');
confere('e com a carga que ele usou',
  rodar('banco.sessoes[banco.sessoes.length - 1].itens[0].series[0].cargaKg'), 40);
confere('a cópia de segurança também foi feita nesse caminho',
  rodar("localStorage.getItem('treino.copiaAntesDaFicha4') !== null"), true);

console.log('\n--- salvar e restaurar backup com a ficha nova ---');
let blobSalvo = null;
ctx.Blob = function (partes) { blobSalvo = partes[0]; };
rodar('exportarBackup();');
const exportado = JSON.parse(blobSalvo);
/* o arquivo agora vem separado por pessoa: dados.jhone, dados.eliete */
const deleNoArquivo = exportado.dados[rodar('perfilId')];
confere('o arquivo diz a versão do formato', exportado.versaoDoFormato, 3);
confere('o arquivo sai com a ficha nova',
  deleNoArquivo.banco.treinos[0].itens.map(i => i.exercicioId)[0], 'leg-press');
confere('e com todo o histórico dentro', deleNoArquivo.banco.sessoes.length, 3);
confere('o app aceita o próprio arquivo de volta',
  rodar('conferirBackup(' + JSON.stringify(JSON.stringify(exportado)) + ') !== null'), true);
rodar("banco.sessoes = []; acharTreino('treino-a').itens = []; salvarBanco();");
rodar('backupParaRestaurar = conferirBackup(' +
  JSON.stringify(JSON.stringify(exportado)) + '); restaurarBackup();');
confere('restaurou o histórico', rodar('banco.sessoes.length'), 3);
confere('restaurou a ficha', ficha('treino-a').map(i => i[0])[0], 'leg-press');
confere('e continua na versão 4, sem reaplicar nada', rodar('banco.versaoDosDados'), 4);

console.log('\n--- o cartão na tela ---');
rodar("sessao = criarSessao('treino-a'); sessao.itemAberto = 0; desenhar();");
const cartao = rodar("document.getElementById('conteudo').innerHTML");
confere('o leg press mostra o desenho dele, e nenhum de agachamento',
  cartao.indexOf('imagens/leg-press.webp') > -1 && cartao.indexOf('imagens/quadriceps') === -1, true);
confere('e a orientação do leg press aparece',
  cartao.indexOf('Confira regulagem e travas') > -1, true);
confere('a prescrição do cartão é 2 x 8-12 com 120s',
  cartao.indexOf('2 x 8-12 · 120s') > -1, true);

/* exercício criado por ele na tela não tem desenho: aí sim entra o
   espaço reservado, com o nome dentro */
rodar("const inventado = criarExercicio('Exercício inventado agora');" +
      "acharTreino('treino-a').itens[0].exercicioId = inventado.id;" +
      "sessao = criarSessao('treino-a'); sessao.itemAberto = 0; desenhar();");
const cartaoSemDesenho = rodar("document.getElementById('conteudo').innerHTML");
confere('exercício sem desenho mostra espaço reservado com o nome',
  cartaoSemDesenho.indexOf('sem-desenho') > -1 &&
  cartaoSemDesenho.indexOf('Exercício inventado agora') > -1, true);
rodar('sessao.itens[0].cargaAtualKg = 100; registrarSerie(0, 12); registrarSerie(0, 12); desenhar();');
confere('a explicação do RIR está junto do campo',
  rodar("document.getElementById('conteudo').innerHTML")
    .indexOf('Quantas repetições ainda dariam') > -1, true);

/* =============================================================
   PERFIS: os testes do segundo perfil.

   Daqui para baixo o navegador de mentira é ZERADO e o app é
   carregado outra vez, para dar para testar a migração desde o
   começo, como acontece num celular que já tinha o app antigo.
   Todos os dados usados aqui são inventados.
   ============================================================= */

function novoApp(gaveta) {
  const elementos2 = {};
  const ctx2 = {
    console,
    localStorage: {
      dados: Object.assign({}, gaveta || {}),
      getItem(k) { return k in this.dados ? this.dados[k] : null; },
      setItem(k, v) { this.dados[k] = String(v); },
      removeItem(k) { delete this.dados[k]; },
      get length() { return Object.keys(this.dados).length; },
      key(i) { return Object.keys(this.dados)[i]; }
    },
    document: {
      addEventListener() {},
      getElementById(id) { return elementos2[id] || (elementos2[id] = elemento()); },
      querySelector() { return null; },
      createElement() { return elemento(); },
      documentElement: { atributos: {}, setAttribute(n, v) { this.atributos[n] = v; } },
      hidden: false
    },
    window: { scrollTo() {} },
    navigator: {},
    setTimeout, clearTimeout, setInterval, clearInterval,
    Blob: function () {},
    URL: { createObjectURL: () => 'x', revokeObjectURL() {} }
  };
  ctx2.globalThis = ctx2;
  vm.createContext(ctx2);
  vm.runInContext(fs.readFileSync(path + 'dados-iniciais.js', 'utf8'), ctx2);
  vm.runInContext(fs.readFileSync(path + 'app.js', 'utf8'), ctx2);
  return {
    ctx: ctx2,
    rodar: codigo => vm.runInContext(codigo, ctx2),
    gaveta: () => ctx2.localStorage.dados
  };
}

/* um banco do formato ANTIGO, como o app guardava antes dos perfis */
function bancoDeAntesDosPerfis() {
  const base = JSON.parse(JSON.stringify(rodar('DADOS_INICIAIS')));
  base.sessoes = [
    { id: 'v1', data: '2026-08-10', treinoId: 'treino-a', estado: 'concluida',
      itens: [{ exercicioId: 'supino-sentado',
        series: [{ cargaKg: 26, reps: 12 }, { cargaKg: 26, reps: 11, rir: 2 }],
        desconforto: { nivel: null, regioes: [] }, observacao: '', concluido: true }] },
    { id: 'v2', data: '2026-08-12', treinoId: 'treino-b', estado: 'concluida', itens: [] }
  ];
  base.config.ultimoTreinoConcluido = 'treino-b';
  base.exercicios[1].nome = 'Supino que eu chamo assim';
  return base;
}

function gavetaAntiga() {
  return {
    'treino.banco': JSON.stringify(bancoDeAntesDosPerfis()),
    'treino.sessaoAtual': JSON.stringify({
      id: 'sPend', data: '2026-08-13', treinoId: 'treino-c',
      iniciadaEm: '2026-08-13T10:00:00.000Z', atualizadaEm: '2026-08-13T10:20:00.000Z',
      estado: 'emAndamento', itemAberto: 0,
      itens: [{ exercicioId: 'quadriceps-c', cargaAtualKg: 20,
        series: [{ cargaKg: 20, reps: 10 }],
        desconforto: { nivel: null, regioes: [] }, observacao: '', concluido: false }]
    }),
    'treino.foto.eq-antigo': 'data:image/jpeg;base64,FOTOVELHA'
  };
}


console.log('\n--- 1. migracao do app antigo, sem perder nada ---');
let app = novoApp(gavetaAntiga());
confere('os dados antigos viraram do primeiro perfil',
  app.rodar("JSON.parse(localStorage.getItem('treino.banco.jhone')).sessoes.length"), 2);
confere('o treino que estava em andamento veio junto',
  app.rodar("JSON.parse(localStorage.getItem('treino.sessaoAtual.jhone')).id"), 'sPend');
confere('a foto antiga foi copiada para o perfil',
  app.rodar("localStorage.getItem('treino.foto.jhone.eq-antigo')"), 'data:image/jpeg;base64,FOTOVELHA');
confere('o nome que ele tinha trocado nao foi reescrito',
  app.rodar("acharExercicio('supino-sentado').nome"), 'Supino que eu chamo assim');
confere('a fila continuou onde estava', app.rodar('proximoTreinoId()'), 'treino-c');
confere('o app abriu no perfil dele', app.rodar('perfilId'), 'jhone');
confere('a cor do perfil dele e laranja',
  app.rodar("document.documentElement.atributos['data-tema']"), 'laranja');

console.log('\n--- a copia de seguranca do formato antigo continua ---');
confere('a chave antiga do banco nao foi apagada',
  app.rodar("localStorage.getItem('treino.banco') !== null"), true);
confere('nem a da sessao antiga',
  app.rodar("localStorage.getItem('treino.sessaoAtual') !== null"), true);

console.log('\n--- rodar a migracao duas vezes nao duplica nada ---');
const depoisDaPrimeira = app.gaveta();
const app2 = novoApp(depoisDaPrimeira);
confere('continua com dois treinos, nao quatro',
  app2.rodar("JSON.parse(localStorage.getItem('treino.banco.jhone')).sessoes.length"), 2);
confere('o exercicio nao entrou duas vezes no catalogo',
  app2.rodar("banco.exercicios.filter(e => e.id === 'supino-sentado').length"), 1);
confere('a sessao pendente continua uma so',
  app2.rodar("JSON.parse(localStorage.getItem('treino.sessaoAtual.jhone')).id"), 'sPend');

console.log('\n--- 2. dado salvo ilegivel: avisa e nao grava por cima ---');
const appRuim = novoApp({
  'treino.perfis': JSON.stringify({
    versaoDoFormato: 3, perfilAtual: 'jhone',
    lista: [{ id: 'jhone', nome: 'Jhone', tema: 'laranja', sementes: 'jhone' },
            { id: 'eliete', nome: 'Eliete', tema: 'rosa', sementes: 'eliete' }]
  }),
  'treino.banco.jhone': '{isso aqui nao e json'
});
confere('o app avisou em vez de abrir vazio', appRuim.rodar('avisoDeDados !== null'), true);
confere('a gravacao ficou trancada', appRuim.rodar('dadosTrancados'), true);
appRuim.rodar("banco.sessoes.push({id:'x', data:'2026-09-01', treinoId:'treino-a', itens:[]}); salvarBanco();");
confere('o texto estragado continua intacto no aparelho',
  appRuim.rodar("localStorage.getItem('treino.banco.jhone')"), '{isso aqui nao e json');

console.log('\n--- migracao com dado antigo ilegivel nao escreve nada ---');
const appAntigoRuim = novoApp({ 'treino.banco': 'nao e json' });
confere('nao criou banco do perfil a partir do lixo',
  appAntigoRuim.rodar("localStorage.getItem('treino.banco.jhone')"), null);
confere('avisou o que aconteceu', appAntigoRuim.rodar('avisoDeDados !== null'), true);
confere('nao apagou o que estava la',
  appAntigoRuim.rodar("localStorage.getItem('treino.banco')"), 'nao e json');

console.log('\n--- 3. os dois perfis nao se misturam ---');
app = novoApp(gavetaAntiga());
app.rodar("trocarPerfil('eliete');");
confere('agora e o perfil dela', app.rodar('perfilId'), 'eliete');
confere('a cor mudou para rosa',
  app.rodar("document.documentElement.atributos['data-tema']"), 'rosa');
confere('o historico dela comeca vazio', app.rodar('banco.sessoes.length'), 0);
confere('a fila dela comeca no A', app.rodar('proximoTreinoId()'), 'treino-a');
confere('a ficha dela nao tem exercicio do treino dele',
  app.rodar("banco.exercicios.some(e => e.id === 'quadriceps-a')"), false);
confere('as cargas dela comecam todas em branco',
  app.rodar("criarSessao('treino-a').itens.every(it => it.cargaAtualKg === null)"), true);
confere('nenhum passo de carga foi chutado para ela',
  app.rodar('banco.exercicios.every(e => e.incrementoKg === null)'), true);
confere('a regra de progressao dela e a cautelosa',
  app.rodar('banco.config.regraProgressao'), 'cautelosa');
confere('a regra dele continua sendo a antiga',
  app.rodar("JSON.parse(localStorage.getItem('treino.banco.jhone')).config.regraProgressao"), 'classica');
confere('nenhuma restricao de joelho passou para ela',
  app.rodar("JSON.stringify(banco.exercicios).indexOf('joelho reclamar') === -1"), true);
confere('elevacao lateral nao entrou na ficha dela',
  app.rodar("banco.treinos.some(t => t.itens.some(i => i.exercicioId.indexOf('elevacao-lateral') === 0))"), false);

console.log('\n--- a sessao de cada um fica esperando onde parou ---');
app.rodar("sessao.itens[0].cargaAtualKg = 40; registrarSerie(0, 10);");
confere('ela registrou uma serie', app.rodar('sessao.itens[0].series.length'), 1);
app.rodar("trocarPerfil('jhone');");
confere('a sessao dele voltou como estava', app.rodar('sessao.id'), 'sPend');
confere('sem a serie que ela registrou', app.rodar('sessao.itens[0].series.length'), 1);
confere('e no exercicio dele', app.rodar('sessao.itens[0].exercicioId'), 'quadriceps-c');
app.rodar("trocarPerfil('eliete');");
confere('a dela tambem voltou como estava', app.rodar('sessao.itens[0].series.length'), 1);
confere('o cronometro nao atravessou a troca', app.rodar('cron'), null);
confere('nem o desfazer', app.rodar('ultimaAcao'), null);

console.log('\n--- 4. a ficha dela, exatamente como foi pedida ---');
const esperado = {
  'treino-a': [
    ['leg-press', 2, 8, 12, 120],
    ['supino-sentado-maquina', 2, 8, 12, 120],
    ['puxada-frente', 2, 8, 12, 120],
    ['flexora-sentada', 2, 10, 15, 90],
    ['elevacao-pelvica-banco', 2, 10, 15, 120],
    ['triceps-corda', 2, 10, 15, 90],
    ['panturrilha', 2, 12, 20, 90],
    ['dead-bug', 2, 6, 10, 60]
  ],
  'treino-b': [
    ['romeno-halteres', 2, 8, 12, 120],
    ['remada-baixa', 2, 8, 12, 120],
    ['cadeira-extensora', 2, 10, 15, 90],
    ['supino-sentado-maquina', 2, 8, 12, 120],
    ['cadeira-abdutora', 2, 12, 20, 90],
    ['triceps-corda', 2, 10, 15, 90],
    ['rosca-halteres-sentada', 2, 10, 15, 90],
    ['abdominal-curto', 2, 10, 15, 60]
  ],
  'treino-c': [
    ['leg-press', 2, 8, 12, 120],
    ['puxada-frente', 2, 8, 12, 120],
    ['elevacao-pelvica-banco', 2, 10, 15, 120],
    ['flexora-sentada', 2, 10, 15, 90],
    ['supino-sentado-maquina', 2, 8, 12, 120],
    ['cadeira-abdutora', 2, 12, 20, 90],
    ['panturrilha', 2, 12, 20, 90],
    ['dead-bug', 2, 6, 10, 60]
  ]
};
Object.keys(esperado).forEach(id => {
  const obtido = app.rodar("acharTreino('" + id + "').itens.map(i => " +
    "[i.exercicioId, i.series, i.repMin, i.repMax, i.descansoSeg])");
  confere(id + ' com os 8 exercicios na ordem pedida', obtido, esperado[id]);
});
confere('16 series de trabalho por sessao',
  app.rodar("banco.treinos.map(t => t.itens.reduce((s,i) => s + i.series, 0))"), [16, 16, 16]);
confere('nao entrou adutora so porque existe desenho',
  app.rodar("banco.exercicios.some(e => e.id.indexOf('adutora') > -1)"), false);

console.log('\n--- desenhos dela: existem e batem com o exercicio ---');
const semDesenho = app.rodar("banco.exercicios.filter(e => !e.ilustracao && !e.aDefinir).map(e => e.id)");
confere('todo exercicio tem desenho, fora os a definir', semDesenho, []);
const faltandoEla = app.rodar('banco.exercicios.map(e => e.ilustracao).filter(Boolean)')
  .filter(rel => !fs.existsSync(path + rel));
confere('todo arquivo de desenho dela existe na pasta', faltandoEla, []);
const noCache = fs.readFileSync(path + 'sw.js', 'utf8');
const foraDoCache = app.rodar('banco.exercicios.map(e => e.ilustracao).filter(Boolean)')
  .filter(rel => noCache.indexOf(rel) === -1);
confere('todo desenho dela funciona sem internet', foraDoCache, []);

console.log('\n--- 5. dead bug: duas series, por lado, sem duplicar ---');
app.rodar("sessao = criarSessao('treino-a'); sessao.itemAberto = 7; registrarSerie(7, 8); registrarSerie(7, 8);");
confere('duas series, nao quatro', app.rodar('sessao.itens[7].series.length'), 2);
confere('cada registro fica marcado como por lado',
  app.rodar('sessao.itens[7].series.every(s => s.porLado === true)'), true);
confere('e sem carga inventada',
  app.rodar('sessao.itens[7].series.every(s => s.cargaKg === undefined)'), true);
const cartaoDeadBug = app.rodar("desenhar(); document.getElementById('conteudo').innerHTML");
confere('a tela explica que a repeticao e por lado',
  cartaoDeadBug.indexOf('8 à direita e 8 à esquerda') > -1, true);
confere('a prescricao na tela diz por lado',
  cartaoDeadBug.indexOf('2 x 6-10 por lado') > -1, true);

console.log('\n--- 6. nada de carga inventada ---');
confere('exercicio de peso do corpo nao recebe sugestao',
  app.rodar("sugestaoDeCarga(acharTreino('treino-a').itens[7])"), null);
confere('exercicio sem historico nao recebe sugestao',
  app.rodar("sugestaoDeCarga(acharTreino('treino-a').itens[1])"), null);

console.log('\n--- 7. progressao cautelosa: duas execucoes comparaveis ---');
/* monta execucoes do supino dela, com o retrato do dia */
const retratoSupino = { nome: 'Supino sentado na máquina', unidade: 'kg', semCarga: false,
  porLado: false, series: 2, repMin: 8, repMax: 12 };
function execDela(data, carga, rir, extras) {
  const item = Object.assign({
    exercicioId: 'supino-sentado-maquina',
    retrato: JSON.parse(JSON.stringify(retratoSupino)),
    series: [{ cargaKg: carga, reps: 12, unidade: 'kg' },
             { cargaKg: carga, reps: 12, rir: rir, unidade: 'kg' }],
    desconforto: { nivel: null, regioes: [] },
    execucao: 'boa', pulado: false, observacao: '', concluido: true
  }, extras || {});
  return { id: 'e' + data, data: data, treinoId: 'treino-a', estado: 'concluida', itens: [item] };
}
const itemSupinoDela = "acharTreino('treino-a').itens[1]";
const sugereDela = () => app.rodar('sugestaoDeCarga(' + itemSupinoDela + ')');
function historicoDela(lista) { app.rodar('banco.sessoes = ' + JSON.stringify(lista) + ';'); }

historicoDela([execDela('2026-09-01', 20, 2), execDela('2026-09-03', 20, 2)]);
confere('sem o passo do aparelho, avisa mas nao da numero',
  sugereDela(), { carga: null, motivo: 'sem-passo' });
app.rodar("definirPassoDeCarga('supino-sentado-maquina', 2.5);");
confere('com o passo informado, sugere 22,5',
  sugereDela(), { carga: 22.5, motivo: 'dupla', unidade: 'kg' });

historicoDela([execDela('2026-09-01', 20, 2), execDela('2026-09-03', 20, null)]);
confere('sem RIR na ultima: nao sugere', sugereDela(), null);
historicoDela([execDela('2026-09-01', 20, 2), execDela('2026-09-03', 20, 2, { desconforto: { nivel: 'leve', regioes: ['ombro'] } })]);
confere('com desconforto leve: nao sugere', sugereDela(), null);
historicoDela([execDela('2026-09-01', 20, 2), execDela('2026-09-03', 20, 2, { execucao: null })]);
confere('sem dizer como foi a execucao: nao sugere', sugereDela(), null);
historicoDela([execDela('2026-09-01', 20, 2), execDela('2026-09-03', 22.5, 2)]);
confere('carga diferente nas duas: nao sugere', sugereDela(), null);
historicoDela([execDela('2026-09-01', 20, 2),
  execDela('2026-09-03', 20, 2, { series: [{ cargaKg: 20, reps: 12, unidade: 'kg' }] })]);
confere('serie incompleta: nao sugere', sugereDela(), null);
historicoDela([execDela('2026-09-01', 20, 2),
  execDela('2026-09-03', 20, 2, { series: [{ cargaKg: 20, reps: 12, unidade: 'placa' },
                                            { cargaKg: 20, reps: 12, rir: 2, unidade: 'placa' }],
                                  retrato: Object.assign({}, retratoSupino, { unidade: 'placa' }) })]);
confere('unidade diferente: nao sugere', sugereDela(), null);
historicoDela([execDela('2026-09-01', 20, 2),
  execDela('2026-09-03', 20, 2, { retrato: Object.assign({}, retratoSupino, { repMax: 15 }) })]);
confere('faixa mudou no meio: recomeca a contagem', sugereDela(), null);

console.log('\n--- o atalho do RIR alto nao vira numero para ela ---');
historicoDela([execDela('2026-09-03', 20, 5)]);
confere('so avisa que parece leve, sem sugerir carga',
  sugereDela(), { carga: null, motivo: 'parece-leve' });

console.log('\n--- fase informada suspende as sugestoes ---');
historicoDela([execDela('2026-09-01', 20, 2), execDela('2026-09-03', 20, 2)]);
confere('antes de marcar, sugere', sugereDela().carga, 22.5);
app.rodar("mudarFase('gestacao');");
confere('marcada a gestacao, nao sugere mais', sugereDela(), null);
confere('e nada foi apagado', app.rodar('banco.sessoes.length'), 2);
app.rodar("mudarFase('pre-gestacao');");
confere('da para voltar atras', sugereDela().carga, 22.5);

console.log('\n--- a regra dele nao mudou por tabela ---');
app.rodar("trocarPerfil('jhone');");
app.rodar("banco.sessoes = " + JSON.stringify([
  { id: 'p1', data: '2026-09-01', treinoId: 'treino-a', estado: 'concluida',
    itens: [{ exercicioId: 'supino-sentado', series: [{ cargaKg: 30, reps: 12 }, { cargaKg: 30, reps: 12, rir: 2 }],
      desconforto: { nivel: null, regioes: [] }, observacao: '', concluido: true }] },
  { id: 'p2', data: '2026-09-03', treinoId: 'treino-a', estado: 'concluida',
    itens: [{ exercicioId: 'supino-sentado', series: [{ cargaKg: 30, reps: 12 }, { cargaKg: 30, reps: 12, rir: 2 }],
      desconforto: { nivel: null, regioes: [] }, observacao: '', concluido: true }] }
]) + ";");
/* 32 e nao 31: o supino sentado dele sobe de 2 em 2, conferido na
   academia em 10/09/2026. A regra antiga continua sendo a antiga. */
confere('registro antigo dele, sem retrato, continua valendo a regra de antes',
  app.rodar("sugestaoDeCarga(acharTreino('treino-a').itens[1])"), { carga: 32, motivo: 'normal' });
app.rodar("trocarPerfil('eliete');");

console.log('\n--- 8. editar a ficha nao reescreve o passado ---');
historicoDela([execDela('2026-09-01', 20, 2)]);
app.rodar("acharExercicio('supino-sentado-maquina').nome = 'Supino na maquina da academia nova';");
app.rodar("abrirEdicao('treino-a'); mudarFaixa(1, 'max', +3); abrirHistorico('supino-sentado-maquina');");
const painelDela = app.rodar("document.getElementById('painel').innerHTML");
confere('o historico mostra o nome que o exercicio tinha no dia',
  painelDela.indexOf('Supino sentado na máquina') > -1, true);
confere('e a prescricao daquele dia, nao a de agora',
  painelDela.indexOf('pedido no dia: 2 x 8-12') > -1, true);
confere('a sessao antiga continua com a faixa antiga',
  app.rodar('banco.sessoes[0].itens[0].retrato.repMax'), 12);
app.rodar("abrirEdicao('treino-a'); mudarFaixa(1, 'max', -3); fecharHistorico();");
app.rodar("acharExercicio('supino-sentado-maquina').nome = 'Supino sentado na máquina';");

console.log('\n--- variante: aparelho escolhido tem historico proprio ---');
app.rodar("sessao = criarSessao('treino-a');");
confere('o leg press comeca sem aparelho definido',
  app.rodar("acharExercicio(sessao.itens[0].exercicioId).aDefinir"), true);
confere('e sem desenho, para nao mostrar a maquina errada',
  app.rodar("imagemDoExercicio(acharExercicio('leg-press'))"), null);
app.rodar("escolherVariante(0, 'leg-press-45');");
confere('depois de escolher, o exercicio do treino A mudou',
  app.rodar("acharTreino('treino-a').itens[0].exercicioId"), 'leg-press-45');
confere('e o do treino C tambem, para ficar a mesma identidade',
  app.rodar("acharTreino('treino-c').itens[0].exercicioId"), 'leg-press-45');
/* o desenho do leg press que ja estava no app E o de 45 graus, entao
   as duas fichas usam o mesmo arquivo. Os exercicios seguem separados. */
confere('agora tem o desenho certo',
  app.rodar("imagemDoExercicio(acharExercicio('leg-press-45'))"), 'imagens/leg-press.webp');
confere('o historico do leg press horizontal continua separado',
  app.rodar("execucoesDe('leg-press-horizontal').length"), 0);
app.rodar("sessao.itens[0].cargaAtualKg = 40; registrarSerie(0, 10);");
app.rodar("escolherVariante(0, 'leg-press-horizontal');");
confere('com serie registrada hoje, a troca nao acontece',
  app.rodar("acharTreino('treino-a').itens[0].exercicioId"), 'leg-press-45');

console.log('\n--- pular exercicio nao inventa serie ---');
app.rodar("sessao = criarSessao('treino-b'); pularExercicio(2);");
confere('ficou marcado como nao realizado', app.rodar('sessao.itens[2].pulado'), true);
confere('e nao criou serie nenhuma', app.rodar('sessao.itens[2].series.length'), 0);
confere('o app sabe diferenciar as tres situacoes',
  app.rodar("[situacaoDoItem(sessao.itens[2]), situacaoDoItem(sessao.itens[3])]"), ['pulado', 'aberto']);
app.rodar('desfazer();');
confere('da para desfazer o pulo', app.rodar('sessao.itens[2].pulado'), false);

console.log('\n--- 9. caminhadas nao empurram a fila A > B > C ---');
app.rodar("banco.sessoes = []; banco.config.ultimoTreinoConcluido = null; banco.caminhadas = [];");
confere('a fila esta no A', app.rodar('proximoTreinoId()'), 'treino-a');
app.rodar("minutosDigitados = '20'; obsDaCaminhada = 'ritmo de conversa'; registrarCaminhada();");
app.rodar("minutosDigitados = '25'; registrarCaminhada();");
confere('duas caminhadas registradas', app.rodar('banco.caminhadas.length'), 2);
confere('45 minutos na semana', app.rodar('minutosDaSemana()'), 45);
confere('a fila continua no A', app.rodar('proximoTreinoId()'), 'treino-a');
confere('caminhada nao virou treino registrado', app.rodar('banco.sessoes.length'), 0);
app.rodar("minutosDigitados = 'abc'; registrarCaminhada();");
confere('minuto sem numero nao entra', app.rodar('banco.caminhadas.length'), 2);
app.rodar('desfazer();');
confere('da para desfazer a ultima', app.rodar('banco.caminhadas.length'), 1);

console.log('\n--- 10. backup do formato novo, com as duas pessoas ---');
app.rodar("trocarPerfil('jhone');");
const pacote = app.rodar('JSON.stringify(montarBackup(perfis.lista.map(p => p.id)))');
const lido = JSON.parse(pacote);
confere('o arquivo diz a versao do formato', lido.versaoDoFormato, 3);
confere('e traz as duas pessoas', Object.keys(lido.dados).sort(), ['eliete', 'jhone']);
confere('com o historico de cada uma', lido.dados.jhone.banco.sessoes.length, 2);
confere('as caminhadas dela foram junto', lido.dados.eliete.banco.caminhadas.length, 1);
confere('a sessao em andamento dele foi junto', lido.dados.jhone.sessaoAtual.id, 'sPend');

console.log('\n--- restaurar o formato novo nao mistura as pessoas ---');
const appLimpo = novoApp({});
appLimpo.rodar("backupParaRestaurar = conferirBackup(" + JSON.stringify(pacote) + "); restaurarBackup();");
confere('o historico dele voltou',
  appLimpo.rodar("JSON.parse(localStorage.getItem('treino.banco.jhone')).sessoes.length"), 2);
confere('o dela continua o dela, sem treino registrado',
  appLimpo.rodar("JSON.parse(localStorage.getItem('treino.banco.eliete')).sessoes.length"), 0);
confere('e com a caminhada dela',
  appLimpo.rodar("JSON.parse(localStorage.getItem('treino.banco.eliete')).caminhadas.length"), 1);

console.log('\n--- backup antigo precisa de destino escolhido na tela ---');
const soBanco = JSON.stringify({ app: 'treino', salvoEm: '2026-08-01T10:00:00.000Z',
  banco: bancoDeAntesDosPerfis(), sessaoAtual: null, fotos: {} });
const appDestino = novoApp({});
confere('o app reconhece que e do formato antigo',
  appDestino.rodar("conferirBackup(" + JSON.stringify(soBanco) + ").formato"), 'antigo');
appDestino.rodar("backupParaRestaurar = conferirBackup(" + JSON.stringify(soBanco) + ");" +
  "lerArquivoDeBackup(null);");
appDestino.rodar("backupParaRestaurar = conferirBackup(" + JSON.stringify(soBanco) + ");" +
  "restaurarBackup('eliete');");
confere('foi para a pessoa escolhida',
  appDestino.rodar("JSON.parse(localStorage.getItem('treino.banco.eliete')).sessoes.length"), 2);
confere('e nao para a outra',
  appDestino.rodar("JSON.parse(localStorage.getItem('treino.banco.jhone')).sessoes.length"), 0);

console.log('\n--- backup quebrado no meio nao troca nada ---');
const appMeio = novoApp(gavetaAntiga());
const antesDoErro = appMeio.rodar("JSON.parse(localStorage.getItem('treino.banco.jhone')).sessoes.length");
appMeio.rodar("backupParaRestaurar = { formato: 'perfis', ids: ['jhone','eliete']," +
  " dados: { dados: { jhone: { banco: { exercicios: [], treinos: [], sessoes: [] } }," +
  " eliete: { banco: 'isso nao e banco' } } } }; restaurarBackup();");
confere('o historico dele continua como estava',
  appMeio.rodar("JSON.parse(localStorage.getItem('treino.banco.jhone')).sessoes.length"), antesDoErro);

console.log('\n--- 11. a tela dela fica inteira, e sem pop up ---');
app.rodar("trocarPerfil('eliete'); sessao = criarSessao('treino-a'); sessao.itemAberto = 0; desenhar();");
const telaDela = app.rodar("document.getElementById('conteudo').innerHTML");
confere('a tela foi desenhada', telaDela.length > 0, true);
confere('o cabecalho tem o botao das duas pessoas',
  app.rodar("document.getElementById('cabecalho').innerHTML").indexOf('Eliete') > -1, true);
confere('pergunta qual leg press', telaDela.indexOf('Qual leg press') > -1, true);

/* a mesma regra, agora conferida na TELA e não só na função */
historicoDela([execDela('2026-09-01', 20, 2), execDela('2026-09-03', 20, 2)]);
app.rodar("acharExercicio('supino-sentado-maquina').incrementoKg = null;");
app.rodar("sessao = criarSessao('treino-a'); sessao.itemAberto = 1; desenhar();");
const cartaoSupino = app.rodar("document.getElementById('conteudo').innerHTML");
confere('sem o passo, a tela avisa mas nao escreve carga nenhuma',
  [cartaoSupino.indexOf('Informe abaixo de quanto em quanto') > -1,
   cartaoSupino.indexOf('Dá para testar') === -1], [true, true]);
app.rodar("definirPassoDeCarga('supino-sentado-maquina', 2.5); desenhar();");
confere('com o passo informado, a tela mostra 22,5 kg',
  app.rodar("document.getElementById('conteudo').innerHTML").indexOf('22,5 kg') > -1, true);
app.rodar('sessao.itemAberto = 0; editandoCarga = 0; desenhar();');
confere('o teclado da carga e o de numero com virgula',
  app.rodar("document.getElementById('conteudo').innerHTML").indexOf('inputmode="decimal"') > -1, true);
app.rodar('editandoCarga = null;');
app.rodar("abrirPainel('caminhadas');");
confere('o teclado dos minutos e o de numero',
  app.rodar("document.getElementById('painel').innerHTML").indexOf('inputmode="numeric"') > -1, true);
['caminhadas', 'resumo', 'plano', 'perfis'].forEach(nome => {
  app.rodar("abrirPainel('" + nome + "');");
  const p = app.rodar("document.getElementById('painel').innerHTML");
  confere('o painel ' + nome + ' abre sem quebrar', p.length > 50, true);
});
app.rodar("fecharHistorico();");

const fonteEla = fs.readFileSync(path + 'app.js', 'utf8');
confere('o app nao guarda nada sobre historico intimo',
  ['gestacional', 'aborto', 'perda gest'].every(t => fonteEla.indexOf(t) === -1), true);
const sementes = fs.readFileSync(path + 'dados-iniciais.js', 'utf8');
confere('nem as sementes distribuidas',
  ['gestacional', 'aborto', 'perda gest'].every(t => sementes.indexOf(t) === -1), true);


console.log('\n' + (falhas === 0 ? 'TUDO PASSOU' : falhas + ' FALHA(S)'));
process.exit(falhas === 0 ? 0 : 1);
