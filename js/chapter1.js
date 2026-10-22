// Capítulo 1 — Um menino em Milão (1991 – 1997)
//
// Os diálogos são uma dramatização inspirada na vida pública de Carlo Acutis.
// Fatos históricos usados aqui: nasceu em Londres em 3/5/1991; a família voltou para Milão
// poucos meses depois; frequentava a Missa na igreja de Santa Maria Segreta; amava a Eucaristia;
// tinha um cachorro (Poldo); a frase "A Eucaristia é a minha autoestrada para o Céu".
// Personagens FICTÍCIOS (marcados abaixo): Dona Rosa e Giulia.
// Veja docs/ROTEIRO.md para a lista do que ainda precisa ser conferido com fontes oficiais.

const maps = (G) => ({
  // ------------------------------------------------------------------ MILÃO (exterior)
  milan: {
    w: 32, h: 24,
    ground(x, y) {
      if (y === 10) return 'roadA';
      if (y === 11) return 'roadB';
      if (x === 15 && y >= 12) return 'roadL';
      if (x === 16 && y >= 12) return 'roadR';
      if (y === 9 && x >= 17 && x <= 26) return 'cobble';
      if (y === 9 || y === 12) return 'walk';
      if ((x === 14 || x === 17) && y >= 12) return 'walk';
      if ((y === 19 || y === 20) && x <= 13) return 'walk';
      if (x >= 22 && x <= 27 && y >= 15 && y <= 18) return 'cobble';
      return 'grass';
    },
    objects: [
      { type: 'house', x: 2, y: 3, w: 6, h: 6, door: 2, enter: true, roof: '#b5533c', wall: '#ecd9a0' },
      { type: 'house', x: 9, y: 4, w: 5, h: 5, door: 2, roof: '#6b8f5a', wall: '#f0e2c0' },
      { type: 'church', x: 17, y: 3, w: 8, h: 6, door: 4, enter: true },
      { type: 'house', x: 26, y: 4, w: 5, h: 5, door: 2, roof: '#7a6a9a', wall: '#e8d0b0' },
      { type: 'house', x: 3, y: 14, w: 7, h: 5, door: 3, roof: '#4a79b0', wall: '#f2d27a', label: 'ESCOLA', flag: true },
      { type: 'fountain', x: 24, y: 16, w: 2, h: 2 },
      { type: 'bench', x: 20, y: 15, w: 2, h: 1 },
      { type: 'bench', x: 28, y: 17, w: 2, h: 1 },
      { type: 'sign', x: 24, y: 9, w: 1, h: 1, id: 'placa_igreja' },
      { type: 'sign', x: 10, y: 20, w: 1, h: 1, id: 'placa_escola' },
      { type: 'lamp', x: 7, y: 9, w: 1, h: 1 }, { type: 'lamp', x: 12, y: 12, w: 1, h: 1 },
      { type: 'lamp', x: 20, y: 12, w: 1, h: 1 }, { type: 'lamp', x: 30, y: 9, w: 1, h: 1 },
      ...[[0, 1], [3, 1], [6, 1], [10, 1], [13, 1], [16, 1], [26, 1], [29, 1], [31, 3], [0, 5], [0, 8], [15, 5], [15, 7],
        [1, 22], [5, 22], [9, 22], [12, 22], [19, 22], [22, 21], [26, 21], [29, 21], [30, 14], [18, 14], [31, 19], [28, 13],
      ].map(([x, y]) => ({ type: 'tree', x, y, w: 1, h: 1 })),
      { type: 'bush', x: 1, y: 9, w: 1, h: 1 }, { type: 'bush', x: 8, y: 9, w: 1, h: 1 },
    ],
    npcs: [
      {
        // Personagem fictícia
        id: 'rosa', kind: 'person', style: 'velha', name: 'Dona Rosa', x: 11, y: 9, dir: 'down',
        async talk(G) {
          await G.say('Dona Rosa', 'Buongiorno, Carlo! Sempre te vejo passando com a sua mãe. Que menino educado!');
          await G.say('Dona Rosa', 'Sabia que Milão tem uma catedral gigante, toda de mármore? Chama-se Duomo. Um dia leve seus pais para passear lá!');
        },
      },
      {
        // Personagem fictícia
        id: 'giulia', kind: 'person', style: 'giulia', sc: 0.85, name: 'Giulia', x: 20, y: 18, dir: 'left',
        async talk(G) {
          if (G.flags.giulia) {
            await G.say('Giulia', 'Obrigada por brincar comigo, Carlo! Você é um ótimo amigo.');
            return;
          }
          await G.say('Giulia', 'Oi, Carlo! Quer brincar de bola aqui na pracinha?');
          const i = await G.choose('O que Carlo responde?', [
            'Claro! Só um pouquinho, depois vou à igreja.',
            'Vamos comigo à Missa? Depois a gente brinca!',
          ]);
          G.flags.giulia = true;
          if (i === 0) {
            G.addStat('alegria', 1);
            await G.say('', 'Os dois chutam a bola por alguns minutos. Carlo ri bastante.');
            await G.say('Giulia', 'Que divertido! Agora vai lá, não quer chegar atrasado.');
          } else {
            G.addStat('fe', 1);
            await G.say('Giulia', 'Hoje não posso, mas outro dia eu vou! Você sempre fala tão bonito de Jesus.');
          }
        },
      },
    ],
    warps: [
      {
        x: 4, y: 8, to: 'casa', tx: 5, ty: 6, dir: 'up',
      },
      {
        x: 21, y: 8, to: 'igreja', tx: 5, ty: 10, dir: 'up',
        async after(G) {
          G.stopFollow();
          G.npc('mae_igreja').hidden = false;
          G.setObjective('Aproxime-se do altar (A) e fale com Jesus.');
          await G.say('', 'Poldo fica esperando do lado de fora da igreja.');
          await G.say('Mamãe', 'Pronto, filho. Chegamos. Como sempre, você faz questão de vir bem cedo…');
        },
      },
    ],
    interacts: [
      {
        x: 24, y: 9, w: 1, h: 1,
        async run(G) {
          await G.say('', 'Igreja de Santa Maria Segreta, em Milão.');
          await G.say('', 'Carlo ia à Missa quase todos os dias. Era o momento mais importante do dia dele.');
        },
      },
      {
        x: 10, y: 20, w: 1, h: 1,
        async run(G) { await G.say('', 'ESCOLA. Carlo ainda vai crescer um pouco antes de estudar aqui… (Capítulo 3)'); },
      },
      {
        x: 24, y: 16, w: 2, h: 2,
        async run(G) { await G.say('', 'Uma fonte na pracinha. A água brilha ao sol.'); },
      },
    ],
  },

  // ------------------------------------------------------------------ CASA (interior)
  casa: {
    w: 10, h: 8,
    ground(x, y) {
      if (y === 0) return 'wallint';
      if (x === 0 || x === 9) return 'wallside';
      if (y === 7) return x === 5 ? 'mat' : 'wallbot';
      return 'wood';
    },
    objects: [
      { type: 'window', x: 3, y: 0, w: 2, h: 1, solid: false },
      { type: 'window', x: 7, y: 0, w: 2, h: 1, solid: false },
      { type: 'shelf', x: 1, y: 1, w: 2, h: 1 },
      { type: 'counter', x: 5, y: 1, w: 4, h: 1 },
      { type: 'rug', x: 2, y: 3, w: 4, h: 3, solid: false },
      { type: 'sofa', x: 2, y: 2, w: 3, h: 1 },
      { type: 'table', x: 6, y: 4, w: 2, h: 2 },
      { type: 'computer', x: 1, y: 5, w: 1, h: 1 },
      { type: 'plant', x: 8, y: 6, w: 1, h: 1 },
    ],
    npcs: [
      {
        id: 'mae', kind: 'person', style: 'mae', name: 'Mamãe', x: 6, y: 2, dir: 'down',
        async talk(G) {
          if (G.flags.mae) {
            await G.say('Mamãe', G.flags.poldo
              ? 'Pode ir, filho. A igreja de Santa Maria Segreta fica pertinho. Eu te alcanço!'
              : 'Chame o Poldo, ele está no tapete. Ele adora passear com você!');
            return;
          }
          await G.say('Mamãe', 'Bom dia, meu amor! Dormiu bem?');
          await G.say('Mamãe', 'Hoje você me pediu para ir à Missa, lembra? Confesso que eu ia pouco à igreja… mas você sempre insiste, e eu adoro ficar ao seu lado.');
          const i = await G.choose('O que Carlo responde?', [
            'Eu gosto de ficar pertinho de Jesus, mamãe.',
            'Podemos levar o Poldo no passeio?',
          ]);
          if (i === 0) {
            G.addStat('fe', 1);
            await G.say('Mamãe', 'Que coisa linda de ouvir, filho… Você me ensina tanto sem nem perceber.');
          } else {
            G.addStat('alegria', 1);
            await G.say('Mamãe', 'Claro! Mas na igreja ele espera do lado de fora, combinado?');
          }
          G.flags.mae = true;
          G.setObjective('Chame o Poldo (ele está no tapete da sala).');
          await G.say('Mamãe', 'Chame o Poldo e vamos.');
        },
      },
      {
        id: 'pai', kind: 'person', style: 'pai', name: 'Papai', x: 8, y: 4, dir: 'left',
        async talk(G) {
          await G.say('Papai', 'Bom dia, Carlo! Sabia que você nasceu em Londres? Mas a sua casa é aqui, em Milão.');
          await G.say('Papai', 'Divirta-se no passeio e depois me conte tudo!');
        },
      },
      {
        id: 'poldo', kind: 'dog', name: 'Poldo', x: 3, y: 4, dir: 'right', sit: true,
        async talk(G, n) {
          if (!G.flags.mae) {
            await G.say('', 'Poldo abana o rabo, animado. (Que tal falar primeiro com a mamãe?)');
            return;
          }
          if (G.flags.poldo) { await G.say('', 'Au! Au!'); return; }
          await G.say('Carlo', 'Vem, Poldo! Vamos passear!');
          await G.say('', 'Poldo pula de alegria e passa a seguir você. O Poldo era o cachorro da família Acutis e Carlo gostava muito dele.');
          G.flags.poldo = true;
          G.startFollow(n);
          G.setObjective('Saia pela porta e vá até a igreja de Santa Maria Segreta.');
        },
      },
    ],
    warps: [
      {
        x: 5, y: 7, to: 'milan', tx: 4, ty: 9, dir: 'down',
        guard(G) {
          if (!G.flags.mae) return 'Falta conversar com a mamãe antes de sair.';
          if (!G.flags.poldo) return 'Falta chamar o Poldo para o passeio!';
          return null;
        },
      },
    ],
    interacts: [
      {
        x: 1, y: 5, w: 1, h: 1,
        async run(G) {
          await G.say('', 'O computador da família.');
          await G.say('', 'Anos depois, Carlo aprenderia a programar e usaria isso para falar de Jesus a muita gente.');
        },
      },
      {
        x: 1, y: 1, w: 2, h: 1,
        async run(G) { await G.say('', 'Uma estante cheia de livros. Os pais de Carlo sempre gostaram de ler.'); },
      },
    ],
  },

  // ------------------------------------------------------------------ IGREJA (interior)
  igreja: {
    w: 12, h: 12,
    ground(x, y) {
      if (y === 0 || x === 0 || x === 11) return 'cwall';
      if (y === 11) return x === 5 || x === 6 ? 'mat' : 'cwall';
      if ((x === 5 || x === 6) && y >= 2) return 'aisle';
      return 'marble';
    },
    objects: [
      { type: 'cwindow', x: 2, y: 0, w: 1, h: 1, solid: false },
      { type: 'cwindow', x: 9, y: 0, w: 1, h: 1, solid: false },
      { type: 'cross', x: 5, y: 0, w: 2, h: 1, solid: false },
      { type: 'altar', x: 4, y: 1, w: 4, h: 1 },
      { type: 'candles', x: 9, y: 2, w: 1, h: 1 },
      ...[4, 6, 8].flatMap((y) => [{ type: 'pew', x: 1, y, w: 3, h: 1 }, { type: 'pew', x: 8, y, w: 3, h: 1 }]),
    ],
    npcs: [
      {
        id: 'padre', kind: 'person', style: 'padre', name: 'Padre', x: 3, y: 2, dir: 'down',
        async talk(G) {
          await G.say('Padre', 'Bom dia, Carlo! Que alegria ver você aqui outra vez.');
          await G.say('Padre', 'Na Missa, Jesus se faz presente na Eucaristia. É o maior presente que Ele nos deixou.');
        },
      },
      {
        id: 'mae_igreja', kind: 'person', style: 'mae', name: 'Mamãe', x: 4, y: 5, dir: 'right', hidden: true,
        async talk(G) { await G.say('Mamãe', 'Vá, filho. Fale com Jesus. Eu espero aqui.'); },
      },
    ],
    warps: [
      { x: 5, y: 11, to: 'milan', tx: 21, ty: 9, dir: 'down', guard: () => 'Ainda não terminamos aqui. Fale com Jesus no altar.' },
      { x: 6, y: 11, to: 'milan', tx: 21, ty: 9, dir: 'down', guard: () => 'Ainda não terminamos aqui. Fale com Jesus no altar.' },
    ],
    interacts: [
      {
        x: 4, y: 1, w: 4, h: 1,
        async run(G) {
          if (G.flags.fim) return;
          G.flags.fim = true;
          await G.say('', 'Carlo se ajoelha diante do sacrário, em silêncio.');
          await G.say('Carlo', 'Oi, Jesus… Eu vim te visitar.');
          await G.say('Mamãe', 'Filho… como você sabe que Ele está aqui de verdade?');
          await G.say('Carlo', 'Porque Ele prometeu, mamãe. Na Eucaristia, Jesus está presente de verdade.');
          await G.say('', 'Esse amor pela Eucaristia só cresceria com os anos. Mais tarde, já adolescente, Carlo diria:');
          await G.card({
            kicker: 'Carlo Acutis',
            title: '“A Eucaristia é a minha autoestrada para o Céu.”',
            text: 'Essa frase resume o centro da vida dele.',
          });
          const i = await G.choose('O que Carlo faz agora?', [
            'Reza em silêncio por quem ele ama.',
            'Agradece a Deus pela sua família.',
          ]);
          if (i === 0) G.addStat('fe', 2); else { G.addStat('caridade', 1); G.addStat('alegria', 1); }
          await G.say('', 'Carlo sai da igreja com o coração leve e um sorriso no rosto.');
          await G.finishChapter();
        },
      },
      {
        x: 9, y: 2, w: 1, h: 1,
        async run(G) { await G.say('', 'Velas acesas. A luz lembra que Jesus é a luz do mundo.'); },
      },
    ],
  },
});

export const chapter1 = {
  id: 1,
  title: 'Um menino em Milão',
  years: '1991 – 1997',
  start: { map: 'casa', x: 5, y: 5, dir: 'up' },
  maps,
  objective: 'Converse com a mamãe (aperte A perto dela).',
  async intro(G) {
    await G.card({
      kicker: 'Londres · 3 de maio de 1991',
      title: 'Nasce Carlo',
      text: 'Carlo Acutis nasce em Londres, na Inglaterra, onde seus pais, Andrea e Antonia, ambos italianos, estavam a trabalho.',
    });
    await G.card({
      kicker: 'Setembro de 1991',
      title: 'De volta à Itália',
      text: 'Poucos meses depois, a família volta para Milão. É nessa cidade que Carlo vai crescer, brincar e descobrir o que mais amava.',
    });
    await G.card({
      kicker: 'Capítulo 1',
      title: 'Um menino em Milão',
      text: 'Use as setas (ou o direcional) para andar e a tecla A (ou Z / Enter) para conversar. Siga o objetivo no topo da tela.',
    });
  },
  async outro(G) {
    const s = G.stats;
    await G.card({
      kicker: 'Fim do Capítulo 1',
      title: 'Um menino em Milão',
      text: `Fé ${s.fe} · Caridade ${s.caridade} · Alegria ${s.alegria}\n\nPróximo: Capítulo 2, “A Primeira Comunhão”. Em breve!`,
    });
  },
};
