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

const CACHE = 'treino-v4';

const ARQUIVOS = [
  './',
  './index.html',
  './estilo.css',
  './app.js',
  './dados-iniciais.js',
  './manifest.json',
  './icones/icone-192.png',
  './icones/icone-512.png',
  './icones/icone-180.png',
  './imagens/banco-scott.webp',
  './imagens/desenvolvimento.webp',
  './imagens/elevacao-lateral.webp',
  './imagens/extensora.webp',
  './imagens/flexora-sentada.webp',
  './imagens/panturrilha.webp',
  './imagens/pec-deck.webp',
  './imagens/puxada-alta.webp',
  './imagens/puxador-remada.webp',
  './imagens/quadriceps-a.webp',
  './imagens/quadriceps-c.webp',
  './imagens/remada.webp',
  './imagens/romeno-halteres.webp',
  './imagens/rosca-ou-triceps.webp',
  './imagens/supino-inclinado.webp',
  './imagens/supino-sentado.webp',
  './imagens/triceps-polia.webp',
  './imagens/tronco.webp'
];

/* 1. INSTALAR: copiar tudo para dentro do celular. */
self.addEventListener('install', evento => {
  evento.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(ARQUIVOS))
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
