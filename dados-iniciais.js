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
  versaoDosDados: 4,

  /* -----------------------------------------------------------
     EQUIPAMENTOS: as máquinas físicas da sua academia.
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

  config: {
    ultimoTreinoConcluido: null,
    incrementoPadraoKg: 1
  }
};
