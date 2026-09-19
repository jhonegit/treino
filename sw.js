/* =============================================================
   SERVICE WORKER: o que faz o app abrir sem internet.

   É um ajudante que o navegador guarda por fora da página. Na
   primeira visita ele copia todos os arquivos do app para dentro do
   celular. Depois disso, quando você abrir na academia, ele entrega
   essas cópias em vez de ir na internet. Se o sinal cair, tanto faz.

   ATENÇÃO: ele só funciona em endereço https (ou no localhost).
   Abrindo o arquivo direto do disco, ele nem liga, e o app continua
   funcionando normalmente, só sem o ícone na tela inicial.

   Para publicar uma versão nova do app, mude o número do CACHE
   embaixo. É isso que avisa o celular que existe coisa nova.
   ============================================================= */

const CACHE = 'treino-v16';

const ARQUIVOS = [
  './',
  './index.html',
  './estilo.css',
  './app.js',
  './dados-iniciais.js',
  './colecao.js',
  './manifest.json',
  './icones/icone-192.png',
  './icones/icone-512.png',
  './icones/icone-180.png',
  './imagens/abdominal-articulado.webp',
  './imagens/abdominal-curto.webp',
  './imagens/banco-scott.webp',
  './imagens/cadeira-abdutora.webp',
  './imagens/cadeira-adutora.webp',
  './imagens/crucifixo-cross.webp',
  './imagens/dead-bug.webp',
  './imagens/desenvolvimento.webp',
  './imagens/elevacao-lateral-polia.webp',
  './imagens/elevacao-lateral.webp',
  './imagens/elevacao-pelvica-banco.webp',
  './imagens/extensora.webp',
  './imagens/face-pull.webp',
  './imagens/flexora-deitada.webp',
  './imagens/flexora-sentada.webp',
  './imagens/leg-press-horizontal.webp',
  './imagens/leg-press.webp',
  './imagens/maquina-gluteo.webp',
  './imagens/panturrilha-leg-press.webp',
  './imagens/panturrilha-sentada.webp',
  './imagens/panturrilha.webp',
  './imagens/pec-deck.webp',
  './imagens/peck-deck-reverso.webp',
  './imagens/ponte-gluteos.webp',
  './imagens/pulley-supinado.webp',
  './imagens/pullover-polia.webp',
  './imagens/puxada-alta.webp',
  './imagens/puxador-remada.webp',
  './imagens/quadriceps-a.webp',
  './imagens/quadriceps-c.webp',
  './imagens/remada-unilateral-halter.webp',
  './imagens/remada.webp',
  './imagens/romeno-halteres.webp',
  './imagens/rosca-concentrada.webp',
  './imagens/rosca-halteres-sentado.webp',
  './imagens/rosca-inclinada.webp',
  './imagens/rosca-martelo-sentado.webp',
  './imagens/rosca-ou-triceps.webp',
  './imagens/rosca-polia-baixa.webp',
  './imagens/supino-halteres-deitado.webp',
  './imagens/supino-inclinado-halteres.webp',
  './imagens/supino-inclinado.webp',
  './imagens/supino-sentado.webp',
  './imagens/triceps-acima-cabeca.webp',
  './imagens/triceps-coice.webp',
  './imagens/triceps-corda.webp',
  './imagens/triceps-invertido-polia.webp',
  './imagens/triceps-polia-barra.webp',
  './imagens/triceps-polia.webp',
  './imagens/triceps-testa-halteres.webp',
  './imagens/tronco.webp'
];

/* A coleção inteira de desenhos também vai para dentro do celular,
   para a tela "Escolher desenho" funcionar na academia sem sinal.
   importScripts [navegador] lê o colecao.js, que tem a lista; assim
   um desenho novo entra aqui sem ninguém mexer neste arquivo. */
importScripts('colecao.js');
const TUDO = ARQUIVOS.concat(COLECAO_DE_DESENHOS.map(d => './' + d.arquivo));

/* 1. INSTALAR: copiar tudo para dentro do celular. */
self.addEventListener('install', evento => {
  evento.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(TUDO))
      .then(() => self.skipWaiting())   // assume o posto na hora
  );
});

/* 2. ATIVAR: jogar fora as cópias das versões antigas. */
self.addEventListener('activate', evento => {
  evento.waitUntil(
    caches.keys()
      .then(nomes => Promise.all(
        nomes.filter(n => n !== CACHE).map(n => caches.delete(n))
      ))
      .then(() => self.clients.claim())
  );
});

/* 3. RESPONDER: primeiro a cópia guardada, internet só se faltar.
   Isso é o que deixa o app instantâneo e independente de sinal. */
self.addEventListener('fetch', evento => {
  if (evento.request.method !== 'GET') return;
  evento.respondWith(
    caches.match(evento.request).then(guardado => {
      if (guardado) return guardado;
      return fetch(evento.request)
        .then(resposta => {
          // guarda o que veio da rede, para a próxima vez já ter
          const copia = resposta.clone();
          caches.open(CACHE).then(cache => cache.put(evento.request, copia));
          return resposta;
        })
        .catch(() => caches.match('./index.html'));   // sem rede e sem cópia
    })
  );
});
