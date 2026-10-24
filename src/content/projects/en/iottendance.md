---
title: IoTTendance
tagline: Real-time RFID attendance
summary: Solo project in which ESP32 RFID readers log student attendance in real time to a web dashboard for teachers, replacing paper roll calls with a tap of a card.
year: 2024
role: Solo project · hardware to UI
order: 2
visual: rfid
stack: [C++, ESP32, RFID, React, Node.js, Express, MongoDB, WebSockets]
repo: https://github.com/pedrodcarvalho/iottendance
stats:
  - { value: '1 tap', label: 'to record attendance' }
  - { value: 'Live', label: 'updates for teachers' }
---

## The problem

Calling the roll eats into every class, and paper lists are easy to fake and painful to consolidate. Schools need attendance data that is accurate, instant, and easy to report on.

## How it works

- **Readers.** An ESP32 with an RFID module sits at the classroom door. Students tap their card; the firmware reads the UID and sends it to the server.
- **Server.** A Node.js + Express API validates the card against the active class, stores the record in MongoDB and broadcasts the event over WebSockets.
- **Dashboard.** Teachers see check-ins appear live, manage classes and students, take attendance for a session, and generate per-student reports. Each institution gets its own account.

## What I built

Everything: the ESP32 firmware, the REST API and data model, authentication for teachers and administrators, and the React dashboard. It was my first project to cross the full path from a radio signal to a pixel on screen, which later became the shape of my work on V2X.
