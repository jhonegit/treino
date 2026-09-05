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

console.log('\n--- foto do aparelho ---');
rodar("sessao = criarSessao('treino-a');");
const eq = rodar("garantirEquipamento(acharExercicio('supino-sentado')).id");
confere('criou o aparelho do supino', eq, 'eq-supino-sentado');
confere('o exercício passou a apontar para o aparelho',
  rodar("acharExercicio('supino-sentado').equipamentoId"), 'eq-supino-sentado');
rodar("salvarFoto('eq-supino-sentado', 'data:image/jpeg;base64,FOTO');");
confere('foto guardada e lida de volta',
  rodar("fotoDoExercicio(acharExercicio('supino-sentado'))"), 'data:image/jpeg;base64,FOTO');
confere('foto fica em chave separada',
  rodar("localStorage.getItem('treino.foto.eq-supino-sentado')"), 'data:image/jpeg;base64,FOTO');
confere('exercício sem foto devolve nada',
  rodar("fotoDoExercicio(acharExercicio('panturrilha'))"), null);
rodar("apagarFoto('eq-supino-sentado');");
confere('foto removida', rodar("fotoDoExercicio(acharExercicio('supino-sentado'))"), null);

console.log('\n--- progressão dupla ---');
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

historico([]);
confere('sem histórico: não sugere', rodar('sugestaoDeCarga(' + itemA + ')'), null);
historico([topo('2026-09-01', 30, 2)]);
confere('uma sessão no topo: ainda não', rodar('sugestaoDeCarga(' + itemA + ')'), null);
historico([topo('2026-09-01', 30, 2), topo('2026-09-03', 30, 2)]);
confere('duas no topo: sugere 31', rodar('sugestaoDeCarga(' + itemA + ')'), 31);
historico([topo('2026-09-01', 30, 2), topo('2026-09-03', 32.5, 2)]);
confere('carga mudou no meio: não sugere', rodar('sugestaoDeCarga(' + itemA + ')'), null);
historico([topo('2026-09-01', 30, 2), topo('2026-09-03', 30, 1)]);
confere('RIR 1 na última: não sugere', rodar('sugestaoDeCarga(' + itemA + ')'), null);
historico([topo('2026-09-01', 30, 2), topo('2026-09-03', 30, 2, 'moderado')]);
confere('desconforto moderado: não sugere', rodar('sugestaoDeCarga(' + itemA + ')'), null);
historico([topo('2026-09-01', 30, 2), topo('2026-09-03', 30, 3)]);
confere('RIR 3 também vale', rodar('sugestaoDeCarga(' + itemA + ')'), 31);
const meio = { data: '2026-09-03', treinoId: 'treino-a', estado: 'concluida', itens: [{
  exercicioId: 'supino-sentado',
  series: [{ cargaKg: 30, reps: 12 }, { cargaKg: 30, reps: 11, rir: 2 }],
  desconforto: { nivel: null, regioes: [] }, observacao: '', concluido: true }] };
historico([topo('2026-09-01', 30, 2), meio]);
confere('faltou uma repetição: não sugere', rodar('sugestaoDeCarga(' + itemA + ')'), null);

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
rodar("garantirEquipamento(acharExercicio('remada')); salvarFoto('eq-remada','data:image/jpeg;base64,MINHAFOTO');");
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
confere('a sugestão agora é 31, não 32,5', rodar('sugestaoDeCarga(' + itemA + ')'), 31);

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


console.log('\n--- desenhar a tela não quebra ---');
rodar("sessao = criarSessao('treino-a'); sessao.itemAberto = 1; desenhar();");
const tela = rodar("document.getElementById('conteudo').innerHTML");
confere('lista preenchida', tela.length > 0, true);
confere('mostra o botão de usar foto própria', tela.indexOf('Usar foto da minha academia') > -1, true);
confere('mostra a ilustração no cartão aberto', tela.indexOf('imagens/supino-sentado.webp') > -1, true);
confere('mostra a sugestão de carga', tela.indexOf('31 kg') > -1, true);
rodar('confirmando = {tipo:"x", texto:"Testando?", botao:"Ok"}; desenhar();');
confere('a confirmação aparece na tela',
  rodar("document.getElementById('conteudo').innerHTML").indexOf('Testando?') > -1, true);

console.log('\n' + (falhas === 0 ? 'TUDO PASSOU' : falhas + ' FALHA(S)'));
process.exit(falhas === 0 ? 0 : 1);
