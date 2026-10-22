# A Caminhada de Carlo

RPG educativo e jogável no celular sobre a vida de **Carlo Acutis**, do nascimento em Londres, passando por Milão, até Assis.
Estilo de jogo "Game Boy / Pokémon", com personagens um pouco maiores (inspirado em Metal Slug).

## Como jogar

- **Computador:** setas ou WASD para andar; `Z`, `Enter` ou `Espaço` para o botão **A** (conversar, avançar texto).
- **Celular:** direcional e botão **A** na tela.
- O progresso (capítulos concluídos) fica salvo no próprio aparelho.

## Rodar localmente

Não há dependências nem build. Basta servir a pasta como site estático:

```bash
python3 -m http.server 8000
# abra http://localhost:8000
```

## Publicar (Vercel)

Importe o repositório na Vercel como projeto estático (sem comando de build, diretório raiz `/`).
Depois, no celular, abra o link e use "Adicionar à tela inicial" para instalar como app (PWA, funciona offline).

## Estrutura

| Arquivo | Para quê |
|---|---|
| `index.html`, `style.css` | Tela do jogo, diálogos, controles de toque |
| `js/main.js` | Motor: movimento, colisão, câmera, diálogos, escolhas, salvamento |
| `js/render.js` | Desenho em pixel art feito em código (chão, prédios, personagens, cachorro) |
| `js/chapters.js` | Lista dos 7 capítulos (a "caminhada da vida") |
| `js/chapter1.js` | Capítulo 1: mapas, personagens, diálogos e história |
| `docs/ROTEIRO.md` | Roteiro de todos os capítulos e o que falta conferir com fontes oficiais |

Para criar um novo capítulo: copie `js/chapter1.js`, defina seus mapas/personagens/diálogos, registre em `SCRIPTS` (`js/main.js`) e marque `ready: true` em `js/chapters.js`.

## Conteúdo e fidelidade histórica

Os diálogos são **dramatizações** inspiradas na vida pública de Carlo. Personagens fictícios estão marcados no código.
Antes de divulgar, revisar os fatos e textos com fontes oficiais (veja `docs/ROTEIRO.md`).
