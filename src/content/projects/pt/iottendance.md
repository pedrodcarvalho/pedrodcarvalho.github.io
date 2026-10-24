---
title: IoTTendance
tagline: Presença em tempo real com RFID
summary: Projeto individual em que leitores RFID com ESP32 registram a presença dos alunos em tempo real num dashboard web para professores, trocando a chamada em papel por um toque do cartão.
year: 2024
role: Projeto individual · do hardware à interface
order: 2
visual: rfid
stack: [C++, ESP32, RFID, React, Node.js, Express, MongoDB, WebSockets]
repo: https://github.com/pedrodcarvalho/iottendance
stats:
  - { value: '1 toque', label: 'para registrar presença' }
  - { value: 'Ao vivo', label: 'atualizações para professores' }
---

## O problema

A chamada consome tempo de toda aula, e listas em papel são fáceis de fraudar e difíceis de consolidar. Escolas precisam de dados de presença precisos, instantâneos e fáceis de transformar em relatórios.

## Como funciona

- **Leitores.** Um ESP32 com módulo RFID fica na porta da sala. O aluno aproxima o cartão; o firmware lê o UID e envia ao servidor.
- **Servidor.** Uma API em Node.js + Express valida o cartão para a aula ativa, grava o registro no MongoDB e transmite o evento por WebSockets.
- **Dashboard.** Professores veem as presenças surgirem ao vivo, gerenciam turmas e alunos, fazem a chamada de uma aula e geram relatórios por aluno. Cada instituição tem sua própria conta.

## O que eu construí

Tudo: o firmware do ESP32, a API REST e o modelo de dados, a autenticação de professores e administradores, e o dashboard em React. Foi meu primeiro projeto a percorrer todo o caminho de um sinal de rádio até um pixel na tela, o mesmo formato que depois encontrei no trabalho com V2X.
