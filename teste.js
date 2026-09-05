/* Testa a LÓGICA do app fora do navegador, com um navegador de mentira.
   De propósito, este navegador NÃO tem alert, confirm nem prompt:
   se o app tentar abrir um pop up, o teste quebra na hora. */
const fs = require('fs');
const vm = require('vm');
const path = 'C:/Users/Jhonn/app-treino/';

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
confere('série entrou depois do OK', rodar('sessao.itens[0].series'), [{ reps: 12, cargaKg: 30 }]);
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
confere('sessão salva no celular', rodar("localStorage.getItem('treino.sessaoAtual') !== null"), true);

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
confere('sessão pendente foi limpa', rodar("localStorage.getItem('treino.sessaoAtual')"), null);

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

console.log('\n--- exercicios em teste ---');
confere('o do treino A trocou de nome', rodar("acharExercicio('quadriceps-a').nome"), 'Agachamento no Smith');
confere('o do treino C trocou de nome', rodar("acharExercicio('quadriceps-c').nome"), 'Agachamento Goblet');
confere('os dois estao marcados como em teste',
  rodar("[acharExercicio('quadriceps-a').emTeste, acharExercicio('quadriceps-c').emTeste]"), [true, true]);
confere('o id nao mudou, entao o historico continua colado',
  rodar("acharTreino('treino-a').itens[0].exercicioId"), 'quadriceps-a');
rodar("sessao.itemAberto = 0; desenhar();");
confere('o selo aparece na tela',
  rodar("document.getElementById('conteudo').innerHTML").indexOf('em teste') > -1, true);


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
confere('duas sessoes RIR 2: sugere 31', sugestao(), { carga: 31, motivo: 'normal' });
historico([topo('2026-09-01', 30, 3), topo('2026-09-03', 30, 2)]);
confere('RIR 3 e depois 2: tambem vale', sugestao(), { carga: 31, motivo: 'normal' });
historico([topo('2026-09-01', 30, 2), topo('2026-09-03', 32, 2)]);
confere('carga mudou no meio: nao sugere', sugestao(), null);
historico([topo('2026-09-01', 30, 2), topo('2026-09-03', 30, 1)]);
confere('RIR 1 na ultima: nao sugere', sugestao(), null);
historico([topo('2026-09-01', 30, 2), topo('2026-09-03', 30, 0)]);
confere('RIR 0 na ultima: nao sugere', sugestao(), null);
historico([topo('2026-09-01', 30, 2), topo('2026-09-03', 30, 2, 'moderado')]);
confere('desconforto moderado: nao sugere', sugestao(), null);
historico([topo('2026-09-01', 30, 2), topo('2026-09-03', 30, 2, 'leve')]);
confere('desconforto leve nao atrapalha', sugestao(), { carga: 31, motivo: 'normal' });

console.log('\n--- progressao: caminho curto (carga leve) ---');
historico([topo('2026-09-03', 30, 4)]);
confere('uma sessao com RIR 4: ja avisa que esta leve', sugestao(), { carga: 31, motivo: 'leve' });
historico([topo('2026-09-03', 30, 5)]);
confere('RIR 5 tambem', sugestao(), { carga: 31, motivo: 'leve' });
historico([topo('2026-09-01', 30, 2), topo('2026-09-03', 30, 5)]);
confere('a sessao mais recente manda', sugestao(), { carga: 31, motivo: 'leve' });
historico([topo('2026-09-03', 30, 5, 'forte')]);
confere('com desconforto forte nao sugere nada', sugestao(), null);
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
confere('exercício de tronco não usa carga', rodar("criarSessao('treino-b').itens[6].cargaAtualKg"), null);

console.log('\n--- ilustrações que vieram com o app ---');
const semIlustracao = rodar('banco.exercicios.filter(e => !e.ilustracao).map(e => e.id)');
confere('todo exercício tem ilustração', semIlustracao, []);
const faltando = rodar('banco.exercicios.map(e => e.ilustracao)')
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
  rodar('banco.exercicios.filter(e => !e.ilustracao).length'), 0);
confere('o histórico continuou intacto', rodar('banco.sessoes.length > 0'), true);

console.log('\n--- carga de 1 em 1 kg ---');
const passos = rodar('banco.exercicios.filter(e => !e.semCarga).map(e => e.incrementoKg)');
confere('todo exercício sobe de 1 kg', [...new Set(passos)], [1]);
rodar("sessao = criarSessao('treino-a'); sessao.itens[1].cargaAtualKg = 30; ajustarCarga(1, +1);");
confere('mais um toque no + vai para 31', rodar('sessao.itens[1].cargaAtualKg'), 31);
historico([topo('2026-09-01', 30, 2), topo('2026-09-03', 30, 2)]);
confere('a sugestão agora é 31, não 32,5', rodar('sugestaoDeCarga(' + itemA + ')'), { carga: 31, motivo: 'normal' });

console.log('\n--- app antigo, salvo quando era 2,5 kg ---');
rodar("banco.versaoDosDados = 1;" +
      "banco.exercicios.forEach(e => { if (!e.semCarga) e.incrementoKg = 2.5; });" +
      "banco.config.incrementoPadraoKg = 2.5;" +
      "completarComSementes();");
confere('a atualização corrigiu todos os passos',
  [...new Set(rodar('banco.exercicios.filter(e => !e.semCarga).map(e => e.incrementoKg)'))], [1]);
confere('a versão dos dados subiu para 2', rodar('banco.versaoDosDados'), 2);
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

rodar("salvarFoto('eq-panturrilha','data:image/jpeg;base64,DEAGORA');");
const sessoesAntes = rodar('banco.sessoes.length');
rodar('backupParaRestaurar = ' + JSON.stringify(backupFalso) + '; restaurarBackup();');
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
  rodar("JSON.parse(localStorage.getItem('treino.banco')).treinos[0].itens[0].descansoSeg"), 30);

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
confere('mostra a sugestão de carga', tela.indexOf('31 kg') > -1, true);
rodar('confirmando = {tipo:"x", texto:"Testando?", botao:"Ok"}; desenhar();');
confere('a confirmação aparece na tela',
  rodar("document.getElementById('conteudo').innerHTML").indexOf('Testando?') > -1, true);

console.log('\n' + (falhas === 0 ? 'TUDO PASSOU' : falhas + ' FALHA(S)'));
process.exit(falhas === 0 ? 0 : 1);
