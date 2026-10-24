---
title: Snake AI
tagline: Agente com Deep Q-Network
summary: Agente treinado com Deep Q-Network (DQN) que aprende a jogar Snake de forma autônoma a partir do estado do jogo, sem nenhuma estratégia programada.
year: 2024
role: Projeto pessoal · RL
order: 3
visual: snake
stack: [Python, TensorFlow, Gym, NumPy, curses]
repo: https://github.com/pedrodcarvalho/snake-game-rl
stats:
  - { value: '1.000', label: 'episódios de treino' }
  - { value: 'DQN', label: 'com experience replay' }
---

## A ideia

Ninguém ensina o agente a jogar Snake. Ele só enxerga o estado do jogo e uma recompensa: positiva ao comer, negativa ao bater. Todo o resto, de perseguir a comida a desviar da própria cauda, precisa ser aprendido.

## Como funciona

- **Jogo.** Uma implementação clássica de Snake em Python com `curses`, com movimento, detecção de colisão e pontuação.
- **Ambiente.** Um ambiente customizado do OpenAI Gym envolve o jogo: define a representação do estado, o espaço de ações (cima, baixo, esquerda, direita) e a função de recompensa.
- **Agente.** Uma Deep Q-Network em TensorFlow estima o valor de cada ação. Ela explora com uma política ε-greedy que decai de 1,0 até 0,01 e aprende com mini-batches sorteados de uma memória de replay de 2.000 passos, o que estabiliza o treino.

O treino roda por 1.000 episódios e salva o modelo a cada 50. Depois, a cobra joga sozinha usando a política aprendida.

## Por que importa

O mais difícil é desenhar a recompensa: uma recompensa mal formulada ensina a cobra a andar em círculos para sempre em vez de comer. Depurar _comportamento_, e não código, é outra disciplina, e a mesma intuição vale para qualquer sistema que aprende no mundo real.
