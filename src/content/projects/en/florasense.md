---
title: FloraSense
tagline: TinyML plant-health monitor
summary: ESP32 sensor nodes stream climate and soil data over MQTT, a TensorFlow Lite Micro model scores plant health on-device, and the Gemini API flags disease from leaf photos, all on a real-time web dashboard.
year: 2026
role: Undergraduate thesis · end-to-end
badge: Thesis
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
  - { value: '2 KB', label: 'tensor arena on the ESP32' }
  - { value: '4', label: 'sensor channels per node' }
  - { value: 'Real-time', label: 'MQTT → WebSocket pipeline' }
---

## The problem

Plants fail silently. By the time leaves yellow, the root cause (too little water, too much heat, a fungal infection) has usually been at work for days. Commercial monitors either just log raw numbers or send everything to the cloud, which is expensive and slow on unreliable connections.

FloraSense asks a simple question: **how much intelligence can live directly on a $5 microcontroller next to the plant?**

## Architecture

The system is split into three layers that each do one job well:

- **Edge (ESP32 + C++).** Each node reads a DHT22 (temperature and humidity), a BH1750 light sensor and a soil-moisture probe. The readings are standardized with the same statistics used in training, then a small neural network running on **TensorFlow Lite for Microcontrollers**, inside a 2 KB tensor arena, turns them into a plant-health score _on the device itself_, so a node stays useful even when the network is down.
- **Transport (MQTT).** Nodes publish compact readings and scores to an MQTT broker. A Node.js service subscribes, persists the time series in MongoDB and pushes live updates to browsers over WebSockets.
- **Insight (React + Gemini).** The TypeScript dashboard shows live and historical charts per plant. Users can upload a leaf photo, which is sent to the **Gemini API** for disease identification and care suggestions.

## What I built

- The ESP32 firmware: sensor sampling, Wi-Fi/MQTT connectivity and TFLite Micro inference.
- The ML pipeline in Jupyter (pandas, scikit-learn, TensorFlow/Keras): exploration, preprocessing, training, and export to a `.tflite` model embedded in the firmware as a C array.
- The Express + Socket.IO back end with JWT authentication, and the React dashboard.
- A Docker Compose setup so the whole stack starts with one command.

## What I learned

Fitting a model into a few hundred kilobytes forces you to think like an embedded engineer and a data scientist at the same time: every feature, layer and byte has to justify itself. That trade-off between accuracy, memory and latency is exactly the work I want to keep doing.
