/* =============================================================
   SEMENTES: os treinos, exercícios e equipamentos de cada perfil.

   Este arquivo NÃO é o app. Ele é só o ponto de partida.
   Na primeira vez que um perfil é aberto, tudo dele é copiado para
   dentro do celular. Depois disso, quem manda são os dados salvos,
   e a semente só volta a ser lida quando o app ganha uma correção
   que precisa alcançar quem já estava usando (ver versaoDosDados).

   Por que os treinos moram aqui, e não dentro do app.js:
   assim o programa não conhece o nome de nenhum exercício, e as
   telas de edição funcionam igual para qualquer ficha.

   São DUAS sementes, uma por pessoa. Elas nunca se misturam: cada
   perfil tem catálogo, ficha, histórico e ajustes próprios.
   ============================================================= */


/* -----------------------------------------------------------
   OS PERFIS
   tema decide a cor da tela. 'laranja' e 'rosa' estão no estilo.css.
   sementes diz de qual ficha inicial o perfil nasce.
   O nome pode ser trocado depois, dentro do app.
   ----------------------------------------------------------- */
const PERFIS_INICIAIS = {
  versaoDoFormato: 3,
  perfilAtual: 'jhone',
  lista: [
    { id: 'jhone',  nome: 'Jhone',  tema: 'laranja', sementes: 'jhone'  },
    { id: 'eliete', nome: 'Eliete', tema: 'rosa',    sementes: 'eliete' }
  ]
};


/* =============================================================
   PERFIL 1 — a ficha que já existia no app.
   Nada aqui foi alterado por causa do segundo perfil.
   ============================================================= */

const DADOS_INICIAIS = {
  versaoDosDados: 4,

  /* -----------------------------------------------------------
     EQUIPAMENTOS: as máquinas físicas da academia.
     Ainda vazio. Entra na versão 1.1, com foto e ajustes
     (encosto 4, assento 3). O lugar já existe.
     ----------------------------------------------------------- */
  equipamentos: [],

  /* -----------------------------------------------------------
     EXERCÍCIOS: o movimento em si.
     incrementoKg é o menor salto de carga possível naquele
     aparelho, conferido por você na academia em 10/09/2026.

     2 kg: supino sentado. São anilhas de 1 kg de cada lado, então
     o menor salto real é 2.

     1 kg: halteres e os aparelhos de barra. Nos de barra o número
     que você digita é a BARRA, não o quilo (você conta 7, 8, 9), e
     ali só existe salto de uma barra por vez.

     Se um aparelho mudar, muda aqui e sobe versaoDosDados.

     Um exercício NUNCA é reaproveitado com outro nome: cada
     movimento tem o seu id, e o histórico anda colado no id. Por
     isso os exercícios que saíram da ficha continuam aqui embaixo,
     em vez de virarem os novos.
     ----------------------------------------------------------- */
  exercicios: [
    /* ---------- estão na ficha ---------- */
    { id: "leg-press",           nome: "Leg press",                   equipamentoId: null, incrementoKg: 1,   ilustracao: "imagens/leg-press.webp", instrucoes: "Confira regulagem e travas com o instrutor. Mantenha quadril e costas apoiados e use amplitude confortável para o joelho. Não force o movimento se provocar dor." },
    { id: "supino-sentado",      nome: "Supino sentado",              equipamentoId: null, incrementoKg: 2,   ilustracao: "imagens/supino-sentado.webp", instrucoes: "" },
    { id: "puxada-alta",         nome: "Pulley (puxada alta)",        equipamentoId: null, incrementoKg: 1,   ilustracao: "imagens/puxada-alta.webp", instrucoes: "" },
    { id: "flexora-sentada",     nome: "Flexora sentada",             equipamentoId: null, incrementoKg: 1,   ilustracao: "imagens/flexora-sentada.webp", instrucoes: "" },
    { id: "elevacao-lateral",    nome: "Elevação lateral",            equipamentoId: null, incrementoKg: 1,   ilustracao: "imagens/elevacao-lateral.webp", instrucoes: "" },
    { id: "banco-scott",         nome: "Rosca Scott",                 equipamentoId: null, incrementoKg: 1,   ilustracao: "imagens/banco-scott.webp", instrucoes: "" },
    { id: "panturrilha",         nome: "Panturrilha",                 equipamentoId: null, incrementoKg: 1,   ilustracao: "imagens/panturrilha.webp", instrucoes: "" },

    { id: "extensora",           nome: "Extensora (só se confortável)", equipamentoId: null, incrementoKg: 1, ilustracao: "imagens/extensora.webp", instrucoes: "Se o joelho reclamar, pular e registrar o desconforto." },
    { id: "supino-inclinado",    nome: "Supino inclinado",            equipamentoId: null, incrementoKg: 1,   ilustracao: "imagens/supino-inclinado.webp", instrucoes: "" },
    { id: "remada",              nome: "Remada",                      equipamentoId: null, incrementoKg: 1,   ilustracao: "imagens/remada.webp", instrucoes: "" },
    { id: "desenvolvimento",     nome: "Desenvolvimento de ombros",   equipamentoId: null, incrementoKg: 1,   ilustracao: "imagens/desenvolvimento.webp", instrucoes: "" },
    { id: "triceps-polia",       nome: "Tríceps na polia",            equipamentoId: null, incrementoKg: 1,   ilustracao: "imagens/triceps-polia.webp", instrucoes: "" },
    { id: "abdominal-curto",     nome: "Abdominal curto deitado",     equipamentoId: null, incrementoKg: 0,   semCarga: true, ilustracao: "imagens/abdominal-curto.webp", instrucoes: "Sem peso nenhum. Conte repetições, não segundos." },

    { id: "pec-deck",            nome: "Pec deck (voador)",           equipamentoId: null, incrementoKg: 1,   ilustracao: "imagens/pec-deck.webp", instrucoes: "" },
    { id: "puxador-remada",      nome: "Puxador com remada",          equipamentoId: null, incrementoKg: 1,   ilustracao: "imagens/puxador-remada.webp", instrucoes: "" },
    { id: "rosca-halteres-sentado", nome: "Rosca com halteres sentado", equipamentoId: null, incrementoKg: 1, ilustracao: "imagens/rosca-halteres-sentado.webp", instrucoes: "" },

    /* ---------- saíram da ficha em 11/09/2026 ----------
       Continuam aqui de propósito. O histórico deles segue
       inteiro e dá para consultar; se um dia voltarem, voltam
       com o mesmo id e o mesmo passado. */
    { id: "quadriceps-a",        nome: "Agachamento no Smith",        equipamentoId: null, incrementoKg: 2,   ilustracao: "imagens/quadriceps-a.webp", instrucoes: "Fora da ficha desde 11/09/2026. O histórico continua guardado aqui." },
    { id: "quadriceps-c",        nome: "Agachamento Goblet",          equipamentoId: null, incrementoKg: 2,   ilustracao: "imagens/quadriceps-c.webp", instrucoes: "Fora da ficha desde 11/09/2026. O histórico continua guardado aqui." },
    { id: "romeno-halteres",     nome: "Levantamento romeno com halteres", equipamentoId: null, incrementoKg: 1, ilustracao: "imagens/romeno-halteres.webp", instrucoes: "Fora da ficha desde 11/09/2026. As cargas dele não passaram para a flexora: são movimentos diferentes." },
    { id: "tronco",              nome: "Exercício de tronco",         equipamentoId: null, incrementoKg: 0,   semCarga: true, ilustracao: "imagens/tronco.webp", instrucoes: "Fora da ficha desde 11/09/2026. O abdominal curto é outro exercício, com id próprio." },
    { id: "rosca-ou-triceps",    nome: "Rosca ou tríceps",            equipamentoId: null, incrementoKg: 1,   ilustracao: "imagens/rosca-ou-triceps.webp", instrucoes: "Fora da ficha desde 11/09/2026. Não dá para saber qual movimento foi feito em cada registro, então esse histórico NÃO virou histórico da rosca com halteres sentado." }
  ],

  /* -----------------------------------------------------------
     TREINOS: a lista do dia. Revisão de 11/09/2026.
     Três dias por semana, intercalados. Sete exercícios, duas
     séries cada: 14 séries por treino.

     Séries, faixa de repetições e descanso ficam AQUI, no item do
     treino, e não no exercício. É isso que permite o mesmo
     exercício aparecer com 2 x 8-12 num treino e 3 x 12-15 noutro.

     O leg press é o MESMO exercício no A e no C (id leg-press),
     de propósito: os dois dias somam no mesmo histórico.
     ----------------------------------------------------------- */
  treinos: [
    {
      id: "treino-a", nome: "Treino A", ordem: 1,
      itens: [
        { exercicioId: "leg-press",        series: 2, repMin: 8,  repMax: 12, descansoSeg: 120 },
        { exercicioId: "supino-sentado",   series: 2, repMin: 8,  repMax: 12, descansoSeg: 120 },
        { exercicioId: "puxada-alta",      series: 2, repMin: 8,  repMax: 12, descansoSeg: 120 },
        { exercicioId: "flexora-sentada",  series: 2, repMin: 10, repMax: 15, descansoSeg: 90  },
        { exercicioId: "elevacao-lateral", series: 2, repMin: 10, repMax: 15, descansoSeg: 90  },
        { exercicioId: "banco-scott",      series: 2, repMin: 10, repMax: 15, descansoSeg: 90  },
        { exercicioId: "panturrilha",      series: 2, repMin: 10, repMax: 15, descansoSeg: 90  }
      ]
    },
    {
      id: "treino-b", nome: "Treino B", ordem: 2,
      itens: [
        { exercicioId: "extensora",        series: 2, repMin: 10, repMax: 15, descansoSeg: 90  },
        { exercicioId: "supino-inclinado", series: 2, repMin: 8,  repMax: 12, descansoSeg: 120 },
        { exercicioId: "remada",           series: 2, repMin: 8,  repMax: 12, descansoSeg: 120 },
        { exercicioId: "flexora-sentada",  series: 2, repMin: 10, repMax: 15, descansoSeg: 90  },
        { exercicioId: "desenvolvimento",  series: 2, repMin: 8,  repMax: 12, descansoSeg: 120 },
        { exercicioId: "triceps-polia",    series: 2, repMin: 10, repMax: 15, descansoSeg: 90  },
        { exercicioId: "abdominal-curto",  series: 2, repMin: 10, repMax: 15, descansoSeg: 90  }
      ]
    },
    {
      id: "treino-c", nome: "Treino C", ordem: 3,
      itens: [
        { exercicioId: "leg-press",        series: 2, repMin: 8,  repMax: 12, descansoSeg: 120 },
        { exercicioId: "pec-deck",         series: 2, repMin: 8,  repMax: 12, descansoSeg: 120 },
        { exercicioId: "puxador-remada",   series: 2, repMin: 8,  repMax: 12, descansoSeg: 120 },
        { exercicioId: "flexora-sentada",  series: 2, repMin: 10, repMax: 15, descansoSeg: 90  },
        { exercicioId: "elevacao-lateral", series: 2, repMin: 10, repMax: 15, descansoSeg: 90  },
        { exercicioId: "panturrilha",      series: 2, repMin: 10, repMax: 15, descansoSeg: 90  },
        { exercicioId: "rosca-halteres-sentado", series: 2, repMin: 10, repMax: 15, descansoSeg: 90 }
      ]
    }
  ],

  /* Sessões já treinadas. Começa vazio. */
  sessoes: [],

  /* Caminhadas registradas. Começa vazio e não empurra a fila A > B > C. */
  caminhadas: [],

  config: {
    ultimoTreinoConcluido: null,
    incrementoPadraoKg: 1,
    /* 'classica' é a regra que este perfil já usava: progressão dupla
       mais o atalho de carga leve com RIR 4 ou mais. Não mexer. */
    regraProgressao: 'classica'
  }
};


/* =============================================================
   PERFIL 2 — ficha de corpo inteiro, três treinos, quase iniciante.

   Diferenças de propósito em relação à ficha acima:

   - incrementoKg começa NULO. O app não inventa um passo de carga:
     enquanto ele não for informado, nenhuma sugestão numérica sai.
   - unidade diz o que o número na tela significa. 'kg' é o peso
     marcado no aparelho, 'kg-halter' é o peso de UM halter, e
     'placa' é o número da placa, que não vira kg sozinho.
   - variantes é a lista de aparelhos que servem para aquele lugar
     da ficha. Cada variante é um exercício separado, com histórico
     separado: trocar não reescreve o que já foi feito.
   - porLado avisa que a repetição registrada vale para cada lado.
   ============================================================= */

const DADOS_ELIETE = {
  /* Nasce ja na versao atual do app: as correcoes 2, 3 e 4 sao da
     ficha dele, de antes dos perfis, e nao se aplicam a esta. */
  versaoDosDados: 4,

  equipamentos: [],

  exercicios: [
    /* ---- lugar do leg press: o aparelho ainda não foi confirmado ---- */
    { id: "leg-press", nome: "Leg press (definir o aparelho)", equipamentoId: null,
      incrementoKg: null, unidade: 'kg', ilustracao: null, aDefinir: true,
      variantes: ["leg-press-45", "leg-press-horizontal"],
      rotuloVariante: "Qual leg press tem na sua academia?",
      instrucoes: "Enquanto o aparelho não for escolhido, o app não mostra desenho, para não mostrar a máquina errada. Dá para registrar as séries assim mesmo." },

    { id: "leg-press-45", nome: "Leg press 45 graus", equipamentoId: null,
      incrementoKg: null, unidade: 'kg', ilustracao: "imagens/leg-press.webp",
      variantes: ["leg-press-45", "leg-press-horizontal"],
      rotuloVariante: "Qual leg press tem na sua academia?",
      instrucoes: "Costas e quadril apoiados, pés na plataforma na largura dos ombros. Desça até onde a lombar continua encostada e volte sem travar o joelho." },

    { id: "leg-press-horizontal", nome: "Leg press horizontal", equipamentoId: null,
      incrementoKg: null, unidade: 'kg', ilustracao: "imagens/leg-press-horizontal.webp",
      variantes: ["leg-press-45", "leg-press-horizontal"],
      rotuloVariante: "Qual leg press tem na sua academia?",
      instrucoes: "Costas apoiadas no encosto, pés na plataforma na largura dos ombros. Desça controlando e volte sem travar o joelho." },

    { id: "supino-sentado-maquina", nome: "Supino sentado na máquina", equipamentoId: null,
      incrementoKg: null, unidade: 'kg', ilustracao: "imagens/supino-sentado.webp",
      instrucoes: "Costas no encosto, pegador na altura do meio do peito. Empurre até quase esticar e volte devagar." },

    { id: "puxada-frente", nome: "Puxada pela frente na polia", equipamentoId: null,
      incrementoKg: null, unidade: 'kg', ilustracao: "imagens/puxada-alta.webp",
      instrucoes: "Coxas presas no apoio, peito aberto. Puxe a barra na frente até a altura do queixo e suba controlando." },

    { id: "flexora-sentada", nome: "Flexora sentada", equipamentoId: null,
      incrementoKg: null, unidade: 'kg', ilustracao: "imagens/flexora-sentada.webp",
      instrucoes: "Joelho alinhado com o eixo da máquina. Dobre os joelhos empurrando o apoio para baixo e volte devagar." },

    /* ---- lugar do glúteo: banco com halter, ou ponte no chão ---- */
    { id: "elevacao-pelvica-banco", nome: "Elevação pélvica no banco com halter", equipamentoId: null,
      incrementoKg: null, unidade: 'kg-halter', ilustracao: "imagens/elevacao-pelvica-banco.webp",
      variantes: ["elevacao-pelvica-banco", "ponte-gluteos"],
      rotuloVariante: "Como você vai fazer este exercício?",
      instrucoes: "Parte alta das costas apoiada no banco, pés firmes no chão. O halter fica estável e protegido sobre o quadril. Suba o quadril apertando o glúteo, sem arquear demais a lombar. Peça ao professor para montar com você nas primeiras vezes." },

    { id: "ponte-gluteos", nome: "Ponte de glúteos no chão", equipamentoId: null,
      incrementoKg: null, unidade: 'kg', semCarga: true, ilustracao: "imagens/ponte-gluteos.webp",
      variantes: ["elevacao-pelvica-banco", "ponte-gluteos"],
      rotuloVariante: "Como você vai fazer este exercício?",
      instrucoes: "Cabeça e ombros apoiados no colchonete, joelhos dobrados e pés no chão. Suba e desça o quadril de forma controlada. Comece sem carga." },

    { id: "triceps-corda", nome: "Tríceps na polia com corda", equipamentoId: null,
      incrementoKg: null, unidade: 'kg', ilustracao: "imagens/triceps-polia.webp",
      instrucoes: "Cotovelos junto ao corpo e parados. Estenda até esticar o braço e volte devagar." },

    /* ---- lugar da panturrilha: o aparelho ainda não foi confirmado ---- */
    { id: "panturrilha", nome: "Panturrilha (definir o aparelho)", equipamentoId: null,
      incrementoKg: null, unidade: 'kg', ilustracao: null, aDefinir: true,
      variantes: ["panturrilha-leg-press", "panturrilha-sentada"],
      rotuloVariante: "Onde você faz a panturrilha?",
      instrucoes: "Enquanto o aparelho não for escolhido, o app não mostra desenho. Dá para registrar as séries assim mesmo." },

    { id: "panturrilha-leg-press", nome: "Panturrilha no leg press", equipamentoId: null,
      incrementoKg: null, unidade: 'kg', ilustracao: "imagens/panturrilha-leg-press.webp",
      variantes: ["panturrilha-leg-press", "panturrilha-sentada"],
      rotuloVariante: "Onde você faz a panturrilha?",
      instrucoes: "A montagem quem orienta é o professor. Apoie a parte da frente do pé na plataforma, empurre pelo tornozelo e mantenha o joelho sem hiperestender." },

    { id: "panturrilha-sentada", nome: "Panturrilha na máquina sentada", equipamentoId: null,
      incrementoKg: null, unidade: 'kg', ilustracao: "imagens/panturrilha-sentada.webp",
      variantes: ["panturrilha-leg-press", "panturrilha-sentada"],
      rotuloVariante: "Onde você faz a panturrilha?",
      instrucoes: "Parte da frente do pé no apoio, movimento só pelo tornozelo, subindo e descendo sem pressa." },

    { id: "dead-bug", nome: "Dead bug", equipamentoId: null,
      incrementoKg: null, unidade: 'kg', semCarga: true, porLado: true,
      ilustracao: "imagens/dead-bug.webp",
      instrucoes: "Deitada, braços para cima, quadris e joelhos dobrados. Estenda lentamente um braço e a perna oposta, mantendo o tronco estável; volte e alterne. Reduza o alcance se perder o controle ou sentir desconforto." },

    { id: "romeno-halteres", nome: "Levantamento romeno com halteres", equipamentoId: null,
      incrementoKg: null, unidade: 'kg-halter', ilustracao: "imagens/romeno-halteres.webp",
      instrucoes: "Joelhos levemente dobrados, coluna firme. Empurre o quadril para trás descendo os halteres rente à perna e volte apertando o glúteo." },

    { id: "remada-baixa", nome: "Remada baixa na polia", equipamentoId: null,
      incrementoKg: null, unidade: 'kg', ilustracao: "imagens/puxador-remada.webp",
      instrucoes: "Sentada, coluna firme. Puxe o pegador até a barriga levando os cotovelos para trás e volte controlando." },

    { id: "cadeira-extensora", nome: "Cadeira extensora", equipamentoId: null,
      incrementoKg: null, unidade: 'kg', ilustracao: "imagens/extensora.webp",
      instrucoes: "Joelho alinhado com o eixo da máquina. Estenda sem dar solavanco e volte devagar." },

    { id: "cadeira-abdutora", nome: "Cadeira abdutora", equipamentoId: null,
      incrementoKg: null, unidade: 'kg', ilustracao: "imagens/cadeira-abdutora.webp",
      instrucoes: "Costas no encosto. Abra as pernas contra o apoio e volte controlando, sem bater os pesos." },

    { id: "rosca-halteres-sentada", nome: "Rosca com halteres sentada", equipamentoId: null,
      incrementoKg: null, unidade: 'kg-halter', ilustracao: "imagens/rosca-halteres-sentado.webp",
      instrucoes: "Sentada, cotovelos junto ao corpo. Suba o halter dobrando o cotovelo e desça devagar." },

    { id: "abdominal-curto", nome: "Abdominal curto deitada", equipamentoId: null,
      incrementoKg: null, unidade: 'kg', semCarga: true, ilustracao: "imagens/abdominal-curto.webp",
      instrucoes: "Deitada, joelhos dobrados. Tire só os ombros do chão, sem puxar o pescoço com as mãos, e desça devagar." }
  ],

  treinos: [
    {
      id: "treino-a", nome: "Treino A", ordem: 1,
      itens: [
        { exercicioId: "leg-press",               series: 2, repMin: 8,  repMax: 12, descansoSeg: 120 },
        { exercicioId: "supino-sentado-maquina",  series: 2, repMin: 8,  repMax: 12, descansoSeg: 120 },
        { exercicioId: "puxada-frente",           series: 2, repMin: 8,  repMax: 12, descansoSeg: 120 },
        { exercicioId: "flexora-sentada",         series: 2, repMin: 10, repMax: 15, descansoSeg: 90  },
        { exercicioId: "elevacao-pelvica-banco",  series: 2, repMin: 10, repMax: 15, descansoSeg: 120 },
        { exercicioId: "triceps-corda",           series: 2, repMin: 10, repMax: 15, descansoSeg: 90  },
        { exercicioId: "panturrilha",             series: 2, repMin: 12, repMax: 20, descansoSeg: 90  },
        { exercicioId: "dead-bug",                series: 2, repMin: 6,  repMax: 10, descansoSeg: 60  }
      ]
    },
    {
      id: "treino-b", nome: "Treino B", ordem: 2,
      itens: [
        { exercicioId: "romeno-halteres",         series: 2, repMin: 8,  repMax: 12, descansoSeg: 120 },
        { exercicioId: "remada-baixa",            series: 2, repMin: 8,  repMax: 12, descansoSeg: 120 },
        { exercicioId: "cadeira-extensora",       series: 2, repMin: 10, repMax: 15, descansoSeg: 90  },
        { exercicioId: "supino-sentado-maquina",  series: 2, repMin: 8,  repMax: 12, descansoSeg: 120 },
        { exercicioId: "cadeira-abdutora",        series: 2, repMin: 12, repMax: 20, descansoSeg: 90  },
        { exercicioId: "triceps-corda",           series: 2, repMin: 10, repMax: 15, descansoSeg: 90  },
        { exercicioId: "rosca-halteres-sentada",  series: 2, repMin: 10, repMax: 15, descansoSeg: 90  },
        { exercicioId: "abdominal-curto",         series: 2, repMin: 10, repMax: 15, descansoSeg: 60  }
      ]
    },
    {
      id: "treino-c", nome: "Treino C", ordem: 3,
      itens: [
        { exercicioId: "leg-press",               series: 2, repMin: 8,  repMax: 12, descansoSeg: 120 },
        { exercicioId: "puxada-frente",           series: 2, repMin: 8,  repMax: 12, descansoSeg: 120 },
        { exercicioId: "elevacao-pelvica-banco",  series: 2, repMin: 10, repMax: 15, descansoSeg: 120 },
        { exercicioId: "flexora-sentada",         series: 2, repMin: 10, repMax: 15, descansoSeg: 90  },
        { exercicioId: "supino-sentado-maquina",  series: 2, repMin: 8,  repMax: 12, descansoSeg: 120 },
        { exercicioId: "cadeira-abdutora",        series: 2, repMin: 12, repMax: 20, descansoSeg: 90  },
        { exercicioId: "panturrilha",             series: 2, repMin: 12, repMax: 20, descansoSeg: 90  },
        { exercicioId: "dead-bug",                series: 2, repMin: 6,  repMax: 10, descansoSeg: 60  }
      ]
    }
  ],

  sessoes: [],
  caminhadas: [],

  config: {
    ultimoTreinoConcluido: null,
    /* nulo de propósito: o passo de carga de cada aparelho é informado
       dentro do app, aparelho por aparelho. O app não chuta. */
    incrementoPadraoKg: null,
    /* 'cautelosa': duas execuções comparáveis, mesma carga, todas as
       séries no topo, RIR 2 ou mais, execução marcada como boa e sem
       desconforto. Sem isso, nenhuma sugestão numérica sai. */
    regraProgressao: 'cautelosa',
    /* meta semanal de caminhada, em minutos. Editável na tela. */
    metaSemanalMin: 50,
    /* marcação de fase, manual e opcional: 'pre-gestacao' ou 'gestacao' */
    fase: 'pre-gestacao',
    /* mostra os botões de Caminhadas, Resumo e Sobre o plano */
    telasDeAcompanhamento: true
  }
};


/* Onde o app procura a semente de cada perfil. */
const SEMENTES = {
  jhone:  DADOS_INICIAIS,
  eliete: DADOS_ELIETE
};
