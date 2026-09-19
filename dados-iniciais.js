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
  versaoDosDados: 5,

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
    { id: "triceps-polia",       nome: "Tríceps na polia",            equipamentoId: null, incrementoKg: 1,   ilustracao: "imagens/triceps-polia-barra.webp", instrucoes: "" },
    { id: "abdominal-curto",     nome: "Abdominal curto deitado",     equipamentoId: null, incrementoKg: 0,   semCarga: true, ilustracao: "imagens/abdominal-curto.webp", instrucoes: "Sem peso nenhum. Conte repetições, não segundos." },

    { id: "pec-deck",            nome: "Pec deck (voador)",           equipamentoId: null, incrementoKg: 1,   ilustracao: "imagens/pec-deck.webp", instrucoes: "" },
    { id: "puxador-remada",      nome: "Puxador com remada",          equipamentoId: null, incrementoKg: 1,   ilustracao: "imagens/puxador-remada.webp", instrucoes: "" },
    { id: "rosca-halteres-sentado", nome: "Rosca com halteres sentado", equipamentoId: null, incrementoKg: 1, ilustracao: "imagens/rosca-halteres-sentado.webp", instrucoes: "" },

    /* ---------- entraram em 18/09/2026, com os dois blocos ----------
       Todos com salto de 1 até ele conferir na academia. Os de
       "porLado" são feitos um lado de cada vez: a repetição anotada
       vale para cada lado. A abdutora e a panturrilha no leg press
       usam os desenhos que já existiam para a ficha da Eliete. */
    { id: "peck-deck-reverso",        nome: "Peck deck reverso",                 equipamentoId: null, incrementoKg: 1, ilustracao: "imagens/peck-deck-reverso.webp", instrucoes: "" },
    { id: "rosca-martelo-sentado",    nome: "Rosca martelo sentado",             equipamentoId: null, incrementoKg: 1, ilustracao: "imagens/rosca-martelo-sentado.webp", instrucoes: "" },
    { id: "triceps-testa-halteres",   nome: "Tríceps testa deitado",             equipamentoId: null, incrementoKg: 1, ilustracao: "imagens/triceps-testa-halteres.webp", instrucoes: "" },
    { id: "triceps-corda",            nome: "Tríceps corda na polia",            equipamentoId: null, incrementoKg: 1, ilustracao: "imagens/triceps-corda.webp", instrucoes: "" },
    { id: "flexora-deitada",          nome: "Flexora deitada",                   equipamentoId: null, incrementoKg: 1, ilustracao: "imagens/flexora-deitada.webp", instrucoes: "" },
    { id: "maquina-gluteo",           nome: "Máquina de glúteo",                 equipamentoId: null, incrementoKg: 1, porLado: true, ilustracao: "imagens/maquina-gluteo.webp", instrucoes: "" },
    { id: "cadeira-adutora",          nome: "Cadeira adutora",                   equipamentoId: null, incrementoKg: 1, ilustracao: "imagens/cadeira-adutora.webp", instrucoes: "" },
    { id: "cadeira-abdutora",         nome: "Cadeira abdutora",                  equipamentoId: null, incrementoKg: 1, ilustracao: "imagens/cadeira-abdutora.webp", instrucoes: "" },
    { id: "abdominal-articulado",     nome: "Abdominal articulado",              equipamentoId: null, incrementoKg: 1, ilustracao: "imagens/abdominal-articulado.webp", instrucoes: "" },
    { id: "supino-halteres-deitado",  nome: "Supino com halteres deitado",       equipamentoId: null, incrementoKg: 1, ilustracao: "imagens/supino-halteres-deitado.webp", instrucoes: "" },
    { id: "supino-inclinado-halteres",nome: "Supino inclinado com halteres",     equipamentoId: null, incrementoKg: 1, ilustracao: "imagens/supino-inclinado-halteres.webp", instrucoes: "" },
    { id: "crucifixo-cross",          nome: "Crucifixo no cross over",           equipamentoId: null, incrementoKg: 1, ilustracao: "imagens/crucifixo-cross.webp", instrucoes: "" },
    { id: "pulley-supinado",          nome: "Pulley pegada supinada",            equipamentoId: null, incrementoKg: 1, ilustracao: "imagens/pulley-supinado.webp", instrucoes: "" },
    { id: "remada-unilateral-halter", nome: "Remada unilateral com halter",      equipamentoId: null, incrementoKg: 1, porLado: true, ilustracao: "imagens/remada-unilateral-halter.webp", instrucoes: "" },
    { id: "pullover-polia",           nome: "Pullover na polia",                 equipamentoId: null, incrementoKg: 1, ilustracao: "imagens/pullover-polia.webp", instrucoes: "" },
    { id: "elevacao-lateral-polia",   nome: "Elevação lateral na polia",         equipamentoId: null, incrementoKg: 1, porLado: true, ilustracao: "imagens/elevacao-lateral-polia.webp", instrucoes: "" },
    { id: "face-pull",                nome: "Face pull na polia",                equipamentoId: null, incrementoKg: 1, ilustracao: "imagens/face-pull.webp", instrucoes: "" },
    { id: "rosca-polia-baixa",        nome: "Rosca na polia baixa",              equipamentoId: null, incrementoKg: 1, ilustracao: "imagens/rosca-polia-baixa.webp", instrucoes: "" },
    { id: "rosca-concentrada",        nome: "Rosca concentrada sentado",         equipamentoId: null, incrementoKg: 1, porLado: true, ilustracao: "imagens/rosca-concentrada.webp", instrucoes: "" },
    { id: "rosca-inclinada",          nome: "Rosca inclinada no banco",          equipamentoId: null, incrementoKg: 1, ilustracao: "imagens/rosca-inclinada.webp", instrucoes: "" },
    { id: "triceps-invertido-polia",  nome: "Tríceps na polia pegada invertida", equipamentoId: null, incrementoKg: 1, ilustracao: "imagens/triceps-invertido-polia.webp", instrucoes: "" },
    { id: "triceps-coice",            nome: "Tríceps coice com halter",          equipamentoId: null, incrementoKg: 1, porLado: true, ilustracao: "imagens/triceps-coice.webp", instrucoes: "" },
    { id: "triceps-acima-cabeca",     nome: "Tríceps acima da cabeça na polia",  equipamentoId: null, incrementoKg: 1, ilustracao: "imagens/triceps-acima-cabeca.webp", instrucoes: "" },
    { id: "panturrilha-leg-press",    nome: "Panturrilha no leg press",          equipamentoId: null, incrementoKg: 1, ilustracao: "imagens/panturrilha-leg-press.webp", instrucoes: "" },

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
     TREINOS: a lista do dia. Revisão de 18/09/2026.
     Três dias por semana, intercalados. Nove exercícios, duas
     séries cada: 18 séries por treino.

     São DOIS blocos que se revezam. O bloco dura seis treinos
     concluídos (A, B e C duas vezes, umas duas semanas) e depois
     o app passa sozinho para o outro. Seis, e não três, para cada
     exercício aparecer duas vezes seguidas: é o que a regra de
     subir carga precisa ver.

     A perna quase não muda de um bloco para o outro, de propósito:
     o joelho dele não recebe aparelho novo. A variedade fica em
     peito, costas, ombro e braço.

     Séries, faixa de repetições e descanso ficam AQUI, no item do
     treino, e não no exercício. É isso que permite o mesmo
     exercício aparecer com 2 x 8-12 num treino e 3 x 12-15 noutro.

     O mesmo exercício em treinos diferentes (leg press, flexora,
     máquina de glúteo) usa o MESMO id: todos somam no mesmo
     histórico.

     Os treinos A, B e C da ficha de 11/09 continuam aqui com
     "arquivado": fora da fila e da edição, mas o histórico ainda
     precisa do nome deles para mostrar os dias em que foram feitos.
     ----------------------------------------------------------- */
  treinos: [
    {
      id: "treino-a1", nome: "Treino A1", ordem: 1, bloco: 1,
      itens: [
        { exercicioId: "leg-press",              series: 2, repMin: 8,  repMax: 12, descansoSeg: 120 },
        { exercicioId: "supino-sentado",         series: 2, repMin: 8,  repMax: 12, descansoSeg: 120 },
        { exercicioId: "puxada-alta",            series: 2, repMin: 8,  repMax: 12, descansoSeg: 120 },
        { exercicioId: "elevacao-lateral",       series: 2, repMin: 10, repMax: 15, descansoSeg: 90  },
        { exercicioId: "banco-scott",            series: 2, repMin: 10, repMax: 15, descansoSeg: 90  },
        { exercicioId: "triceps-polia",          series: 2, repMin: 10, repMax: 15, descansoSeg: 90  },
        { exercicioId: "flexora-sentada",        series: 2, repMin: 10, repMax: 15, descansoSeg: 90  },
        { exercicioId: "panturrilha",            series: 2, repMin: 10, repMax: 15, descansoSeg: 90  },
        { exercicioId: "abdominal-curto",        series: 2, repMin: 10, repMax: 15, descansoSeg: 90  }
      ]
    },
    {
      id: "treino-b1", nome: "Treino B1", ordem: 2, bloco: 1,
      itens: [
        { exercicioId: "extensora",              series: 2, repMin: 10, repMax: 15, descansoSeg: 90  },
        { exercicioId: "supino-inclinado",       series: 2, repMin: 8,  repMax: 12, descansoSeg: 120 },
        { exercicioId: "remada",                 series: 2, repMin: 8,  repMax: 12, descansoSeg: 120 },
        { exercicioId: "desenvolvimento",        series: 2, repMin: 8,  repMax: 12, descansoSeg: 120 },
        { exercicioId: "rosca-martelo-sentado",  series: 2, repMin: 10, repMax: 15, descansoSeg: 90  },
        { exercicioId: "triceps-testa-halteres", series: 2, repMin: 10, repMax: 15, descansoSeg: 90  },
        { exercicioId: "maquina-gluteo",         series: 2, repMin: 10, repMax: 15, descansoSeg: 90  },
        { exercicioId: "cadeira-adutora",        series: 2, repMin: 10, repMax: 15, descansoSeg: 90  },
        { exercicioId: "abdominal-articulado",   series: 2, repMin: 10, repMax: 15, descansoSeg: 90  }
      ]
    },
    {
      id: "treino-c1", nome: "Treino C1", ordem: 3, bloco: 1,
      itens: [
        { exercicioId: "leg-press",              series: 2, repMin: 8,  repMax: 12, descansoSeg: 120 },
        { exercicioId: "pec-deck",               series: 2, repMin: 8,  repMax: 12, descansoSeg: 120 },
        { exercicioId: "puxador-remada",         series: 2, repMin: 8,  repMax: 12, descansoSeg: 120 },
        { exercicioId: "peck-deck-reverso",      series: 2, repMin: 10, repMax: 15, descansoSeg: 90  },
        { exercicioId: "rosca-halteres-sentado", series: 2, repMin: 10, repMax: 15, descansoSeg: 90  },
        { exercicioId: "triceps-corda",          series: 2, repMin: 10, repMax: 15, descansoSeg: 90  },
        { exercicioId: "flexora-deitada",        series: 2, repMin: 10, repMax: 15, descansoSeg: 90  },
        { exercicioId: "cadeira-abdutora",       series: 2, repMin: 10, repMax: 15, descansoSeg: 90  },
        { exercicioId: "panturrilha",            series: 2, repMin: 10, repMax: 15, descansoSeg: 90  }
      ]
    },
    {
      id: "treino-a2", nome: "Treino A2", ordem: 4, bloco: 2,
      itens: [
        { exercicioId: "leg-press",               series: 2, repMin: 8,  repMax: 12, descansoSeg: 120 },
        { exercicioId: "supino-halteres-deitado", series: 2, repMin: 8,  repMax: 12, descansoSeg: 120 },
        { exercicioId: "pulley-supinado",         series: 2, repMin: 8,  repMax: 12, descansoSeg: 120 },
        { exercicioId: "elevacao-lateral-polia",  series: 2, repMin: 10, repMax: 15, descansoSeg: 90  },
        { exercicioId: "rosca-polia-baixa",       series: 2, repMin: 10, repMax: 15, descansoSeg: 90  },
        { exercicioId: "triceps-invertido-polia", series: 2, repMin: 10, repMax: 15, descansoSeg: 90  },
        { exercicioId: "flexora-deitada",         series: 2, repMin: 10, repMax: 15, descansoSeg: 90  },
        { exercicioId: "panturrilha-leg-press",   series: 2, repMin: 10, repMax: 15, descansoSeg: 90  },
        { exercicioId: "abdominal-articulado",    series: 2, repMin: 10, repMax: 15, descansoSeg: 90  }
      ]
    },
    {
      id: "treino-b2", nome: "Treino B2", ordem: 5, bloco: 2,
      itens: [
        { exercicioId: "extensora",                 series: 2, repMin: 10, repMax: 15, descansoSeg: 90  },
        { exercicioId: "supino-inclinado-halteres", series: 2, repMin: 8,  repMax: 12, descansoSeg: 120 },
        { exercicioId: "remada-unilateral-halter",  series: 2, repMin: 8,  repMax: 12, descansoSeg: 120 },
        { exercicioId: "desenvolvimento",           series: 2, repMin: 8,  repMax: 12, descansoSeg: 120 },
        { exercicioId: "rosca-concentrada",         series: 2, repMin: 10, repMax: 15, descansoSeg: 90  },
        { exercicioId: "triceps-coice",             series: 2, repMin: 10, repMax: 15, descansoSeg: 90  },
        { exercicioId: "maquina-gluteo",            series: 2, repMin: 10, repMax: 15, descansoSeg: 90  },
        { exercicioId: "cadeira-abdutora",          series: 2, repMin: 10, repMax: 15, descansoSeg: 90  },
        { exercicioId: "abdominal-curto",           series: 2, repMin: 10, repMax: 15, descansoSeg: 90  }
      ]
    },
    {
      id: "treino-c2", nome: "Treino C2", ordem: 6, bloco: 2,
      itens: [
        { exercicioId: "leg-press",              series: 2, repMin: 8,  repMax: 12, descansoSeg: 120 },
        { exercicioId: "crucifixo-cross",        series: 2, repMin: 10, repMax: 15, descansoSeg: 90  },
        { exercicioId: "pullover-polia",         series: 2, repMin: 10, repMax: 15, descansoSeg: 90  },
        { exercicioId: "face-pull",              series: 2, repMin: 10, repMax: 15, descansoSeg: 90  },
        { exercicioId: "rosca-inclinada",        series: 2, repMin: 10, repMax: 15, descansoSeg: 90  },
        { exercicioId: "triceps-acima-cabeca",   series: 2, repMin: 10, repMax: 15, descansoSeg: 90  },
        { exercicioId: "flexora-sentada",        series: 2, repMin: 10, repMax: 15, descansoSeg: 90  },
        { exercicioId: "cadeira-adutora",        series: 2, repMin: 10, repMax: 15, descansoSeg: 90  },
        { exercicioId: "panturrilha",            series: 2, repMin: 10, repMax: 15, descansoSeg: 90  }
      ]
    },

    /* ---------- ficha de 11/09/2026, arquivada em 18/09 ---------- */
    {
      id: "treino-a", nome: "Treino A", ordem: 91, arquivado: true,
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
      id: "treino-b", nome: "Treino B", ordem: 92, arquivado: true,
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
      id: "treino-c", nome: "Treino C", ordem: 93, arquivado: true,
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

  /* -----------------------------------------------------------
     COMO FAZER: três linhas por exercício, que aparecem no cartão
     aberto. Moram só aqui, e o app lê direto daqui: não são copiadas
     para o celular, então corrigir um texto aqui corrige na tela na
     próxima publicação, sem mexer em versaoDosDados.
     ----------------------------------------------------------- */
  comoFazer: {
    "leg-press": [
      "Encosto confortável, pés no meio da plataforma, na largura do quadril.",
      "Destrave, desça dobrando os joelhos até onde for confortável e empurre de volta.",
      "Não estique o joelho até travar lá no alto e mantenha o quadril colado no banco."
    ],
    "supino-sentado": [
      "Banco na altura em que as pegadas fiquem na linha do meio do peito.",
      "Empurre as pegadas para a frente até quase esticar os braços e volte devagar.",
      "Costas apoiadas e ombros para trás o tempo todo."
    ],
    "puxada-alta": [
      "Coxas presas embaixo do apoio, barra um pouco mais aberta que os ombros.",
      "Puxe a barra até a altura do queixo, levando os cotovelos para baixo.",
      "Não jogue o corpo para trás para ajudar e volte a barra devagar."
    ],
    "elevacao-lateral": [
      "Sentado ou em pé, um halter em cada mão, braços ao lado do corpo.",
      "Suba os braços para os lados até a altura dos ombros, cotovelos levemente dobrados.",
      "Peso leve. Não balance o corpo para subir."
    ],
    "banco-scott": [
      "Axila encostada no alto do apoio, braços esticados sobre a almofada.",
      "Dobre os cotovelos subindo a barra até perto do rosto e desça devagar.",
      "Não estique o braço de uma vez no final: é onde o cotovelo mais sofre."
    ],
    "triceps-polia": [
      "Polia no alto com a barra reta (ou a corda), em pé bem perto do cabo.",
      "Com os cotovelos colados ao corpo, estique os braços empurrando a barra para baixo.",
      "Só o antebraço se mexe: o cotovelo fica parado."
    ],
    "flexora-sentada": [
      "Joelho alinhado com o eixo da máquina e o rolo logo acima do calcanhar.",
      "Dobre os joelhos puxando o rolo para baixo e volte devagar.",
      "Coxas presas pelo apoio, sem tirar o quadril do banco."
    ],
    "panturrilha": [
      "Joelhos sob o apoio, ponta dos pés na plataforma, calcanhares para fora.",
      "Suba os calcanhares o máximo que der, segure um segundo e desça até alongar.",
      "Movimento lento, sem quicar embaixo."
    ],
    "abdominal-curto": [
      "Deitado de barriga para cima, joelhos dobrados e pés no chão.",
      "Tire só os ombros do chão, contraindo a barriga, e volte devagar.",
      "Não puxe a cabeça com as mãos."
    ],
    "extensora": [
      "Encosto ajustado para o joelho ficar alinhado com o eixo da máquina, rolo acima do tornozelo.",
      "Estique as pernas levantando o rolo e desça devagar.",
      "Se o joelho reclamar, diminua a amplitude ou pule o exercício."
    ],
    "supino-inclinado": [
      "Banco ajustado para as pegadas ficarem na altura da parte de cima do peito.",
      "Empurre para a frente e para cima até quase esticar os braços e volte devagar.",
      "Costas apoiadas e ombros para trás."
    ],
    "remada": [
      "Peito encostado no apoio, braços esticados segurando as pegadas.",
      "Puxe as pegadas em direção à barriga, juntando as escápulas (os ossos das costas).",
      "Não afaste o peito do apoio para puxar."
    ],
    "desenvolvimento": [
      "Sentado no banco com encosto reto, halteres na altura das orelhas.",
      "Empurre para cima até quase esticar os braços e desça até a altura das orelhas.",
      "Costas coladas no encosto, sem arquear a lombar."
    ],
    "rosca-martelo-sentado": [
      "Sentado com encosto, um halter em cada mão, palmas viradas uma para a outra.",
      "Dobre os cotovelos subindo os halteres sem girar o punho, como quem segura um martelo.",
      "Cotovelos parados junto ao corpo."
    ],
    "triceps-testa-halteres": [
      "Deitado no banco reto, barra W nas mãos, braços esticados para o teto.",
      "Dobre só os cotovelos, descendo a barra até perto da testa, e estique de volta.",
      "Cotovelos apontando para o teto o tempo todo. Comece leve."
    ],
    "maquina-gluteo": [
      "Siga a regulagem da máquina: uma perna de apoio e a outra no apoio que empurra.",
      "Empurre a perna para trás, esticando o quadril, e volte devagar. Depois troque de lado.",
      "Não arqueie a lombar para ganhar amplitude."
    ],
    "cadeira-adutora": [
      "Sentado, pernas abertas, almofadas na parte de dentro dos joelhos.",
      "Feche as pernas juntando as almofadas e volte devagar.",
      "Abra só até onde for confortável."
    ],
    "abdominal-articulado": [
      "Sentado na máquina, mãos nas pegadas ou peito no apoio, conforme o modelo.",
      "Enrole o tronco para a frente contraindo a barriga e volte devagar.",
      "Não puxe com os braços: quem faz força é a barriga."
    ],
    "pec-deck": [
      "Banco na altura em que as pegadas fiquem na linha do peito.",
      "Feche os braços à frente do peito, como num abraço, e volte devagar.",
      "Não deixe os braços irem muito para trás na volta."
    ],
    "puxador-remada": [
      "Sentado, pés apoiados, segurando a pegada do cabo.",
      "Puxe em direção à barriga, com os cotovelos passando junto ao corpo.",
      "Tronco parado, sem balançar para trás."
    ],
    "peck-deck-reverso": [
      "No voador, sentado de frente para o encosto, pegadas na altura dos ombros.",
      "Abra os braços para trás, quase esticados, e volte devagar.",
      "Peso leve: quem trabalha é a parte de trás do ombro."
    ],
    "rosca-halteres-sentado": [
      "Sentado no banco com encosto, um halter em cada mão, palmas para a frente.",
      "Dobre os cotovelos subindo os halteres até os ombros e desça devagar.",
      "Cotovelos parados ao lado do corpo."
    ],
    "triceps-corda": [
      "Polia no alto com a corda, em pé perto do cabo.",
      "Estique os braços para baixo e, no final, afaste as pontas da corda para os lados.",
      "Cotovelos colados ao corpo."
    ],
    "flexora-deitada": [
      "Deitado de barriga para baixo, joelho logo depois da beirada do banco, rolo acima do calcanhar.",
      "Dobre os joelhos trazendo o rolo em direção ao bumbum e desça devagar.",
      "Quadril colado no banco, sem levantar."
    ],
    "cadeira-abdutora": [
      "Sentado, pernas fechadas, almofadas na parte de fora dos joelhos.",
      "Abra as pernas para os lados e volte devagar.",
      "Costas apoiadas, sem balançar o tronco."
    ],
    "supino-halteres-deitado": [
      "Deitado no banco reto, um halter em cada mão na altura do peito.",
      "Empurre os halteres para cima até quase esticar os braços e desça devagar.",
      "Pés no chão e ombros para trás. Peça ajuda para pegar e soltar halter pesado."
    ],
    "pulley-supinado": [
      "No pulley, pegada fechada, com as palmas viradas para você.",
      "Puxe a barra até o queixo, com os cotovelos descendo junto ao corpo.",
      "Sem jogar o corpo para trás."
    ],
    "elevacao-lateral-polia": [
      "Polia no ponto mais baixo, em pé de lado para a máquina, pegada na mão mais longe.",
      "Suba o braço para o lado até a altura do ombro e desça devagar. Depois troque de lado.",
      "Peso leve e corpo parado."
    ],
    "rosca-polia-baixa": [
      "Polia no ponto mais baixo com a barra reta, em pé perto do cabo.",
      "Dobre os cotovelos subindo a barra até perto do peito e desça devagar.",
      "Cotovelos parados junto ao corpo."
    ],
    "triceps-invertido-polia": [
      "Polia no alto com a barra reta, pegada com as palmas viradas para cima.",
      "Com os cotovelos colados ao corpo, estique os braços para baixo.",
      "Use peso menor que o do tríceps na polia comum."
    ],
    "panturrilha-leg-press": [
      "No leg press, só a ponta dos pés na beirada de baixo da plataforma, pernas quase esticadas.",
      "Empurre a plataforma com a ponta dos pés e volte devagar até alongar.",
      "Pés bem firmes. Peça ao instrutor para mostrar na primeira vez."
    ],
    "supino-inclinado-halteres": [
      "Banco inclinado, um halter em cada mão na altura da parte de cima do peito.",
      "Empurre para cima até quase esticar os braços e desça devagar.",
      "Costas coladas no banco."
    ],
    "remada-unilateral-halter": [
      "Um joelho e uma mão apoiados no banco, o halter na outra mão, costas retas.",
      "Puxe o halter em direção ao quadril, cotovelo junto ao corpo, e desça devagar. Depois troque de lado.",
      "Se apoiar o joelho incomodar, apoie só a mão e deixe os dois pés no chão."
    ],
    "rosca-concentrada": [
      "Sentado na ponta do banco, pernas abertas, cotovelo apoiado na parte de dentro da coxa.",
      "Suba o halter até o ombro e desça devagar até quase esticar. Depois troque de lado.",
      "Só o antebraço se mexe."
    ],
    "triceps-coice": [
      "Um joelho e uma mão apoiados no banco, halter na outra mão, braço colado ao corpo e cotovelo dobrado.",
      "Estique o braço para trás e volte devagar. Depois troque de lado.",
      "O cotovelo fica parado. Se apoiar o joelho incomodar, apoie só a mão."
    ],
    "crucifixo-cross": [
      "Polias na altura dos ombros, uma pegada em cada mão, um passo à frente do meio.",
      "Com os cotovelos levemente dobrados, junte as mãos à frente do peito e volte devagar.",
      "Peso leve. Não deixe os braços irem muito para trás."
    ],
    "pullover-polia": [
      "Polia no alto com a barra reta, em pé um passo atrás, tronco um pouco inclinado.",
      "Com os braços quase esticados, leve a barra do alto até perto das coxas e volte devagar.",
      "Os cotovelos não dobram: quem trabalha são as costas."
    ],
    "face-pull": [
      "Polia na altura do rosto, com a corda.",
      "Palmas para baixo, dê um passo para trás e puxe a corda em direção à testa, abrindo os cotovelos para os lados.",
      "Peso leve. Quem trabalha é a parte de trás do ombro, não as costas."
    ],
    "rosca-inclinada": [
      "Banco inclinado, costas apoiadas, braços pendurados com um halter em cada mão.",
      "Dobre os cotovelos subindo os halteres e desça devagar até esticar.",
      "Os braços ficam atrás do corpo: comece com menos peso que na rosca sentada."
    ],
    "triceps-acima-cabeca": [
      "Polia baixa com a corda, de costas para a máquina, corda atrás da cabeça, um pé à frente.",
      "Estique os braços para cima e para a frente e volte devagar.",
      "Cotovelos apontando para a frente, sem abrir."
    ]
  },
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
  /* Nasce ja na versao atual do app: as correcoes 2 a 5 sao da ficha
     dele e nao se aplicam a esta. Quem ja usava fica na 4, e tanto faz:
     nenhum passo de versao encosta no banco dela. */
  versaoDosDados: 5,

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
