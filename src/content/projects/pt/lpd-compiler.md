---
title: Compilador LPD
tagline: Compilador e máquina virtual, do zero em C
summary: Compilador completo para LPD, uma linguagem de programação didática, escrito do zero em C, com análise léxica, sintática e semântica, geração de código e uma máquina virtual de pilha para executar o resultado.
year: 2024
role: Projeto de disciplina · compiladores
order: 4
visual: compiler
stack: [C, GCC, GTK, Léxico, Sintático, Semântico, Geração de código]
repo: https://github.com/pedrodcarvalho/compiler-development
stats:
  - { value: '5', label: 'fases de compilação' }
  - { value: '0', label: 'geradores de parser usados' }
---

## O desafio

Escrever um compilador para LPD, uma linguagem estruturada de ensino, **sem** lex, yacc ou qualquer gerador de parser. Só C, uma gramática e muito cuidado com memória.

## Pipeline

1. **Análise léxica.** Um scanner escrito à mão transforma o código-fonte em tokens e aponta caracteres inválidos com o número da linha.
2. **Análise sintática.** Um parser descendente recursivo segue a gramática de declarações, `se`/`enquanto`, procedimentos e funções, e se recupera de erros sem travar.
3. **Análise semântica.** Uma tabela de símbolos controla escopos e tipos (`inteiro`, `booleano`), detectando identificadores não declarados, tipos incompatíveis e uso incorreto de funções.
4. **Geração de código.** Expressões são convertidas para notação pós-fixa e emitidas como instruções para uma máquina de pilha própria, com otimizações básicas.
5. **Máquina virtual.** Um programa C separado executa o código-objeto gerado, com gerenciamento de memória em pilha.

Compilador e máquina virtual têm interface desktop em GTK: uma para abrir o código LPD e compilá-lo em código-objeto, outra para carregar e executar esse código.

## O que aprendi

Construir cada fase à mão faz você entender o que uma linguagem _é_: como uma sequência de caracteres vira estrutura, significado e, por fim, execução. Também me deixou muito melhor em ler C, depurar ponteiros e projetar estruturas de dados que continuam corretas sob pressão.
