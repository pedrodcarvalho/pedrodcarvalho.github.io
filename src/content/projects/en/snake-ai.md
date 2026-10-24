---
title: Snake AI
tagline: Deep Q-Network agent
summary: An agent trained with a Deep Q-Network (DQN) that learns to play Snake autonomously from the game state, with no hard-coded strategy.
year: 2024
role: Personal project · RL
order: 3
visual: snake
stack: [Python, TensorFlow, Gym, NumPy, curses]
repo: https://github.com/pedrodcarvalho/snake-game-rl
stats:
  - { value: '1,000', label: 'training episodes' }
  - { value: 'DQN', label: 'with experience replay' }
---

## The idea

Nobody tells the agent how to play Snake. It only sees the game state and a reward: positive for eating, negative for crashing. Everything else, from chasing food to avoiding its own tail, has to be learned.

## How it works

- **Game.** A classic Snake implementation in Python using `curses`, with movement, collision detection and scoring.
- **Environment.** A custom OpenAI Gym environment wraps the game: it defines the state representation, the action space (up, down, left, right) and the reward function.
- **Agent.** A Deep Q-Network built with TensorFlow estimates the value of each action. It explores with an ε-greedy policy that decays from 1.0 toward 0.01, and learns from mini-batches sampled out of a 2,000-step replay memory, which stabilizes training.

Training runs for 1,000 episodes and checkpoints the model every 50. After training, the snake plays on its own using the learned policy.

## Why it matters

Reward design is the hard part: a badly shaped reward teaches the snake to circle forever instead of eating. Debugging _behaviour_ rather than code is a different discipline, and the same intuition applies to any learning system deployed in the real world.
