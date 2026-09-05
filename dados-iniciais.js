/* =============================================================
   SEMENTES: seus treinos, exercícios e equipamentos.

   Este arquivo NÃO é o app. Ele é só o ponto de partida.
   Na primeira vez que você abrir o app, tudo isto é copiado para
   dentro do celular. Depois disso, quem manda são os dados salvos,
   e este arquivo nunca mais é lido.

   Por que os treinos moram aqui, e não dentro do app.js:
   assim o programa não conhece o nome de nenhum exercício seu, e
   depois dá para criar a tela de edição sem reescrever nada.
   ============================================================= */

const DADOS_INICIAIS = {
  versaoDosDados: 2,

  /* -----------------------------------------------------------
     EQUIPAMENTOS: as máquinas físicas da sua academia.
     Ainda vazio. Entra na versão 1.1, com foto e ajustes
     (encosto 4, assento 3). O lugar já existe.
     ----------------------------------------------------------- */
  equipamentos: [],

  /* -----------------------------------------------------------
     EXERCÍCIOS: o movimento em si.
     incrementoKg é o menor salto de carga possível naquele
     aparelho. Deixei 1 kg em todos, que é o passo que funciona nas
     anilhas da sua academia. Se algum aparelho só andar de 5 em 5,
     muda aqui, exercício por exercício.

     Os dois "quadríceps a definir" são exercícios separados de
     propósito: o do Treino A e o do Treino C podem acabar sendo
     movimentos diferentes. Para trocar depois, você muda só o
     nome aqui e o histórico continua colado nesse mesmo id.
     ----------------------------------------------------------- */
  exercicios: [
    { id: "quadriceps-a",        nome: "Quadríceps do A (a definir)", equipamentoId: null, incrementoKg: 1,   ilustracao: "imagens/quadriceps-a.webp", instrucoes: "Testar qual movimento não incomoda o joelho. Hack squat e sissy squat estão fora." },
    { id: "supino-sentado",      nome: "Supino sentado",              equipamentoId: null, incrementoKg: 1,   ilustracao: "imagens/supino-sentado.webp", instrucoes: "" },
    { id: "puxada-alta",         nome: "Pulley (puxada alta)",        equipamentoId: null, incrementoKg: 1,   ilustracao: "imagens/puxada-alta.webp", instrucoes: "" },
    { id: "flexora-sentada",     nome: "Flexora sentada",             equipamentoId: null, incrementoKg: 1,   ilustracao: "imagens/flexora-sentada.webp", instrucoes: "" },
    { id: "elevacao-lateral",    nome: "Elevação lateral",            equipamentoId: null, incrementoKg: 1,     ilustracao: "imagens/elevacao-lateral.webp", instrucoes: "" },
    { id: "banco-scott",         nome: "Banco Scott",                 equipamentoId: null, incrementoKg: 1,   ilustracao: "imagens/banco-scott.webp", instrucoes: "" },
    { id: "panturrilha",         nome: "Panturrilha",                 equipamentoId: null, incrementoKg: 1,     ilustracao: "imagens/panturrilha.webp", instrucoes: "" },

    { id: "romeno-halteres",     nome: "Levantamento romeno com halteres", equipamentoId: null, incrementoKg: 1,   ilustracao: "imagens/romeno-halteres.webp", instrucoes: "" },
    { id: "supino-inclinado",    nome: "Supino inclinado",            equipamentoId: null, incrementoKg: 1,   ilustracao: "imagens/supino-inclinado.webp", instrucoes: "" },
    { id: "remada",              nome: "Remada",                      equipamentoId: null, incrementoKg: 1,   ilustracao: "imagens/remada.webp", instrucoes: "" },
    { id: "extensora",           nome: "Extensora (só se confortável)", equipamentoId: null, incrementoKg: 1,   ilustracao: "imagens/extensora.webp", instrucoes: "Se o joelho reclamar, pular e registrar o desconforto." },
    { id: "desenvolvimento",     nome: "Desenvolvimento de ombros",   equipamentoId: null, incrementoKg: 1,   ilustracao: "imagens/desenvolvimento.webp", instrucoes: "" },
    { id: "triceps-polia",       nome: "Tríceps na polia",            equipamentoId: null, incrementoKg: 1,   ilustracao: "imagens/triceps-polia.webp", instrucoes: "" },
    { id: "tronco",              nome: "Exercício de tronco",         equipamentoId: null, incrementoKg: 0,   semCarga: true, ilustracao: "imagens/tronco.webp", instrucoes: "" },

    { id: "quadriceps-c",        nome: "Quadríceps do C (a definir)", equipamentoId: null, incrementoKg: 1,   ilustracao: "imagens/quadriceps-c.webp", instrucoes: "Mesmo teste do Treino A, sem hack squat e sem sissy squat." },
    { id: "pec-deck",            nome: "Pec deck (voador)",           equipamentoId: null, incrementoKg: 1,   ilustracao: "imagens/pec-deck.webp", instrucoes: "" },
    { id: "puxador-remada",      nome: "Puxador com remada",          equipamentoId: null, incrementoKg: 1,   ilustracao: "imagens/puxador-remada.webp", instrucoes: "" },
    { id: "rosca-ou-triceps",    nome: "Rosca ou tríceps",            equipamentoId: null, incrementoKg: 1,   ilustracao: "imagens/rosca-ou-triceps.webp", instrucoes: "" }
  ],

  /* -----------------------------------------------------------
     TREINOS: a lista do dia.
     Séries, faixa de repetições e descanso ficam AQUI, no item do
     treino, e não no exercício. É isso que permite o mesmo
     exercício aparecer com 2 x 8-12 num treino e 3 x 12-15 noutro.
     ----------------------------------------------------------- */
  treinos: [
    {
      id: "treino-a", nome: "Treino A", ordem: 1,
      itens: [
        { exercicioId: "quadriceps-a",     series: 2, repMin: 8,  repMax: 12, descansoSeg: 120 },
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
        { exercicioId: "romeno-halteres",  series: 2, repMin: 8,  repMax: 12, descansoSeg: 120 },
        { exercicioId: "supino-inclinado", series: 2, repMin: 8,  repMax: 12, descansoSeg: 120 },
        { exercicioId: "remada",           series: 2, repMin: 8,  repMax: 12, descansoSeg: 120 },
        { exercicioId: "extensora",        series: 2, repMin: 10, repMax: 15, descansoSeg: 90  },
        { exercicioId: "desenvolvimento",  series: 2, repMin: 8,  repMax: 12, descansoSeg: 120 },
        { exercicioId: "triceps-polia",    series: 2, repMin: 10, repMax: 15, descansoSeg: 90  },
        { exercicioId: "tronco",           series: 2, repMin: 12, repMax: 20, descansoSeg: 60  }
      ]
    },
    {
      id: "treino-c", nome: "Treino C", ordem: 3,
      itens: [
        { exercicioId: "quadriceps-c",     series: 2, repMin: 8,  repMax: 12, descansoSeg: 120 },
        { exercicioId: "pec-deck",         series: 2, repMin: 8,  repMax: 12, descansoSeg: 120 },
        { exercicioId: "puxador-remada",   series: 2, repMin: 8,  repMax: 12, descansoSeg: 120 },
        { exercicioId: "flexora-sentada",  series: 2, repMin: 10, repMax: 15, descansoSeg: 90  },
        { exercicioId: "elevacao-lateral", series: 2, repMin: 10, repMax: 15, descansoSeg: 90  },
        { exercicioId: "panturrilha",      series: 2, repMin: 10, repMax: 15, descansoSeg: 90  },
        { exercicioId: "rosca-ou-triceps", series: 2, repMin: 10, repMax: 15, descansoSeg: 90  }
      ]
    }
  ],

  /* Sessões já treinadas. Começa vazio. */
  sessoes: [],

  config: {
    ultimoTreinoConcluido: null,
    incrementoPadraoKg: 1
  }
};
