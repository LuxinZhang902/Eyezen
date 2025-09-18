# EyeZen

**Privacy-first Chrome Extension for AI-powered eye wellness.**
Detects eye strain locally, guides refreshing eye breaks with AI coaching + Traditional Chinese Medicine massage, tracks progress, and keeps all data private.

---

## 🚀 Features

* **Eye Strain Detection**: Real-time blink and fatigue detection (EAR/PERCLOS) using MediaPipe (WASM) in a Worker.
* **Break Rituals**: 20-20-20 rule reminders, TCM massage guide (Zan Zhu, Si Bai, Jing Ming), hydration nudge.
* **AI Coaching**: Varied break scripts via Writer/Rewriter API, weekly summaries via Summarizer API, multilingual support via Translator API.
* **Dashboard**: Daily KPIs, Eye Score, goals, history trends, privacy toggle.
* **Privacy**: Frames processed locally, no storage of images, only metrics saved.
* **Optional Hybrid**: Firebase sync, Gemini Cloud for personalized coaching letters.

---

## 🛠 Tech Stack

* **Frontend/UI**: React + TypeScript + TailwindCSS, Recharts (charts), Vite + crxjs (build).
* **Extension Platform**: Chrome Extension Manifest V3.
* **State & Storage**: Zustand/Context, chrome.storage.local, IndexedDB.
* **Computer Vision**: MediaPipe Face Landmarker (WASM) for EAR/PERCLOS metrics.
* **AI APIs** (built-in Chrome APIs with Gemini Nano):

  * Writer/Rewriter API → break coaching scripts.
  * Summarizer API → weekly progress digest.
  * Translator API → multilingual UI + scripts.
  * Prompt API multimodal (optional) → lighting/distance suggestions.
* **Notifications/Timers**: Background service worker with chrome.alarms.
* **Audio**: Web Speech API (speechSynthesis) for break guidance.
* **Optional Cloud**: Firebase (sync history/goals), Gemini Cloud (rich summaries).

---

## 📐 System Design Overview

### Architecture

```mermaid
flowchart LR
  subgraph EXT[Chrome Extension (MV3)]
    P[Popup/Dashboard UI]
    B[Background Service Worker]
    ST[Storage (chrome.storage.local + IndexedDB)]
    CO[Coach Engine (LLM APIs: Writer, Rewriter, Summarizer, Translator)]
    VW[CV Worker (MediaPipe WASM: EAR/PERCLOS)]
  end

  CAM[(Webcam)] --> VW
  VW -->|metrics| P
  P --> CO
  CO -->|scripts, summaries| P
  B --> P
  P <--> ST

  subgraph HYB[Optional Hybrid]
    FB[(Firebase)]
    GC[(Gemini Cloud)]
  end

  ST <--> FB
  CO <--> GC
```

### Key Workflows

* **Eye Monitoring → Break**: detect fatigue → notification → break screen with AI script, TCM guide, hydration nudge → log events.
* **Weekly Summary**: load 7-day history → Summarizer API → dashboard digest card.
* **Goal Tracking**: create goal → track daily progress → streaks & completion bar.
* **Settings & Privacy**: toggle camera, adjust sensitivity, erase data.

### Scoring Model

* Base 70.
* +10 for ≥3 breaks, +5 for ≥1 massage, +5 if healthy blink rate.
* −10 for ≥4 fatigue alerts, −5 if >8h screen with insufficient breaks.
* Weekly/monthly = average of daily scores.

---

## 📂 Project Structure

```
/src
  /extension
    manifest.json
    popup.tsx        # popup + dashboard
    options.tsx      # settings & privacy
    background.ts    # alarms, notifications
  /core
    cv-worker.ts     # MediaPipe + EAR/PERCLOS
    metrics.ts       # fatigue index logic
    coach.ts         # AI API calls
    storage.ts       # chrome.storage + IndexedDB
  /ui
    components/*     # cards, ritual player
    charts/*         # Recharts components
    assets/*         # TCM images/animations
```

---

## 🔒 Privacy & Security

* Frames never stored; closed immediately after inference.
* Metrics-only cross Worker boundary.
* No host\_permissions; camera permission requested only on demand.
* Strict MV3 CSP.
* “Erase all data” clears chrome.storage + IndexedDB.

---

## ⚡ Prompt for AI Coding Agent
# Prompt for AI Coding Agent
Build a Chrome Extension (Manifest V3) called "EyeZen" using TypeScript, React, and TailwindCSS. Using Python, Docker and K8S. The extension should:
1. Include a **Popup UI** with status (Good/Tired), a "Start Eye Break" button, and quick settings.
2. Implement a **Dashboard (Options page)** with daily KPIs, Eye Score, goal tracking, weekly summary (via Summarizer API), and settings.
3. Run a **CV Worker** using MediaPipe Face Landmarker (WASM) to compute EAR/PERCLOS from camera frames, outputting metrics (blinkRate, fatigueIndex, posture). Ensure frames are closed immediately.
4. Use a **Background service worker** with chrome.alarms to trigger 20-20-20 reminders and handle notifications. This is for when the user chooses not detect, but a set time of alarm
5. Integrate **Writer/Rewriter API** using OpenAI API to generate break coaching scripts, **Summarizer API** for weekly digests, and **Translator API** for multilingual support.
6. Break Ritual screen should show: 20-20-20 timer, TCM massage guide (Zan Zhu, Si Bai, Jing Ming) with simple animations, hydration nudge, and AI-generated script. Optionally, use Web Speech API for audio.
7. Store user data and events (alerts, breaks, massages, hydration) in chrome.storage.local + IndexedDB, with a simple scoring model (0-100).
8. Include privacy features: camera ON/OFF toggle, erase all data button, metrics-only storage.
9. Follow project structure: /extension (popup, options, background), /core (cv-worker, metrics, coach, storage), /ui (components, charts, assets).
10. Ensure strict CSP, minimal permissions, and MIT license. 

Make sure the code is clean with comments and documentation

---

## 📄 License

