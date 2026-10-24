---
title: FloraSense
tagline: Monitor de saúde de plantas com TinyML
summary: Nós ESP32 enviam dados de clima e solo via MQTT, um modelo TensorFlow Lite Micro avalia a saúde da planta no próprio dispositivo e a API Gemini identifica doenças em fotos das folhas, tudo em um dashboard web em tempo real.
year: 2026
role: TCC · ponta a ponta
badge: TCC
order: 1
visual: flora
stack:
  [
    C++,
    Python,
    TensorFlow,
    TFLite Micro,
    Gemini API,
    MQTT,
    React,
    TypeScript,
    Node.js,
    MongoDB,
    Docker,
  ]
repo: https://github.com/pedrodcarvalho/flora-sense
stats:
  - { value: '2 KB', label: 'de tensor arena no ESP32' }
  - { value: '4', label: 'canais de sensores por nó' }
  - { value: 'Tempo real', label: 'pipeline MQTT → WebSocket' }
---

## O problema

Plantas adoecem em silêncio. Quando as folhas amarelam, a causa (falta de água, excesso de calor, um fungo) geralmente já está agindo há dias. Monitores comerciais apenas registram números brutos ou mandam tudo para a nuvem, o que é caro e lento em conexões instáveis.

O FloraSense parte de uma pergunta simples: **quanta inteligência cabe em um microcontrolador de 5 dólares ao lado da planta?**

## Arquitetura

O sistema é dividido em três camadas, cada uma com uma única responsabilidade:

- **Borda (ESP32 + C++).** Cada nó lê um DHT22 (temperatura e umidade), um sensor de luminosidade BH1750 e um sensor de umidade do solo. As leituras são padronizadas com as mesmas estatísticas do treino e uma pequena rede neural rodando em **TensorFlow Lite for Microcontrollers**, dentro de uma tensor arena de 2 KB, as transforma em uma nota de saúde _no próprio dispositivo_, então o nó continua útil mesmo sem rede.
- **Transporte (MQTT).** Os nós publicam leituras e notas compactas em um broker MQTT. Um serviço Node.js assina os tópicos, persiste a série temporal no MongoDB e envia atualizações ao vivo para o navegador via WebSockets.
- **Análise (React + Gemini).** O dashboard em TypeScript mostra gráficos ao vivo e históricos de cada planta. É possível enviar uma foto da folha para a **API Gemini**, que identifica doenças e sugere cuidados.

## O que eu construí

- O firmware do ESP32: leitura dos sensores, conectividade Wi-Fi/MQTT e inferência com TFLite Micro.
- O pipeline de ML em Jupyter (pandas, scikit-learn, TensorFlow/Keras): exploração, pré-processamento, treino e exportação para um modelo `.tflite` embutido no firmware como array C.
- O back-end em Express + Socket.IO com autenticação JWT, e o dashboard em React.
- Um Docker Compose que sobe toda a pilha com um único comando.

## O que aprendi

Fazer um modelo caber em algumas centenas de kilobytes obriga a pensar como engenheiro de embarcados e cientista de dados ao mesmo tempo: cada feature, camada e byte precisa se justificar. Esse equilíbrio entre acurácia, memória e latência é exatamente o trabalho que quero continuar fazendo.
