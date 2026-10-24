import type { Localized } from '@/i18n';

/** Secondary projects listed under "More on GitHub". */
export type Repo = {
  name: string;
  url: string;
  description: Localized<string>;
  language: string;
};

const gh = (name: string) => `https://github.com/pedrodcarvalho/${name}`;

export const repos: Repo[] = [
  {
    name: 'cpu-profiler-linux-module',
    url: gh('cpu-profiler-linux-module'),
    language: 'C',
    description: {
      en: 'A CPU profiler implemented as a Linux kernel module.',
      pt: 'Profiler de CPU implementado como módulo do kernel Linux.',
    },
  },
  {
    name: 'rock-paper-scissors-hand-detection-ai',
    url: gh('rock-paper-scissors-hand-deteciton-ai'),
    language: 'TensorFlow.js',
    description: {
      en: 'Rock-paper-scissors played with your hand, detected live in the browser by a TensorFlow.js model.',
      pt: 'Pedra, papel e tesoura com a mão, detectada ao vivo no navegador por um modelo TensorFlow.js.',
    },
  },
  {
    name: 'computational-vision',
    url: gh('computational-vision'),
    language: 'PyTorch',
    description: {
      en: 'Computer-vision experiments and models built with PyTorch.',
      pt: 'Experimentos e modelos de visão computacional com PyTorch.',
    },
  },
  {
    name: 'dijkstra-pathfinding-visualization',
    url: gh('dijkstra-pathfinding-visualization'),
    language: 'Python',
    description: {
      en: 'Dijkstra’s shortest path on a real road network, visualized as an animated plot.',
      pt: 'Menor caminho de Dijkstra em uma malha viária real, visualizado em um gráfico animado.',
    },
  },
  {
    name: 'mindshift',
    url: gh('mindshift'),
    language: 'JavaScript',
    description: {
      en: 'A 2D puzzle-platformer game built from scratch.',
      pt: 'Jogo 2D de plataforma e quebra-cabeça feito do zero.',
    },
  },
  {
    name: 'btc-sentiment-scraping',
    url: gh('btc-sentiment-scraping'),
    language: 'Python',
    description: {
      en: 'Scrapes posts about Bitcoin and scores market sentiment with NLP.',
      pt: 'Coleta posts sobre Bitcoin e estima o sentimento do mercado com NLP.',
    },
  },
];
