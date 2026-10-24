---
title: LPD Compiler
tagline: A compiler and VM, from scratch in C
summary: A complete compiler for LPD, a didactic programming language, written from scratch in C, with a lexer, parser, semantic analysis, code generation and a stack-based virtual machine to run the output.
year: 2024
role: Course project · compilers
order: 4
visual: compiler
stack: [C, GCC, GTK, Lexer, Parser, Semantic analysis, Code generation]
repo: https://github.com/pedrodcarvalho/compiler-development
stats:
  - { value: '5', label: 'compilation phases' }
  - { value: '0', label: 'parser generators used' }
---

## The challenge

Write a compiler for LPD, a structured teaching language, **without** lex, yacc or any parser generator. Just C, a grammar and a lot of care with memory.

## Pipeline

1. **Lexical analysis.** A hand-written scanner turns source text into tokens and reports invalid characters with line numbers.
2. **Syntax analysis.** A recursive-descent parser follows the grammar for declarations, `se`/`enquanto` (LPD’s Portuguese `if`/`while`), procedures and functions, and recovers gracefully from errors.
3. **Semantic analysis.** A symbol table tracks scopes and types (`inteiro`, `booleano`), catching undeclared identifiers, type mismatches and misuse of functions.
4. **Code generation.** Expressions are converted to postfix and emitted as instructions for a custom stack machine, with basic optimizations.
5. **Virtual machine.** A separate C program executes the generated object code with stack-based memory management.

Both the compiler and the VM ship with a GTK desktop interface: one to open LPD source and compile it to object code, the other to load and run that code.

## What it taught me

Building every phase by hand makes you understand what a language _is_: how a string of characters becomes structure, meaning and finally execution. It also made me much better at reading C, at debugging pointers, and at designing data structures that stay correct under pressure.
