# Nudge: System Architecture & Interview Guide

This document is your definitive guide to understanding, explaining, and defending the **Nudge** platform in technical and product management interviews. It breaks down the engineering, product decisions, and psychological foundations of the platform.

---

## 1. Product & Business Overview

### The Business Problem
Modern retail trading apps (Robinhood, Zerodha, Webull) are fundamentally designed to optimize for **trade volume**, because their revenue model (PFOF or brokerage fees) relies on users trading frequently. They use gamification, flashy colors, and zero-friction UX to encourage impulse trading. Consequently, retail investors consistently underperform the market by panic-selling during dips or taking profits too early on long-term winners.

### The Solution: "Nudge"
Nudge is a behavioral-finance SaaS designed to align with the investor's long-term outcomes, not trade volume. It introduces **Positive Friction** into the sell flow. When a user attempts an impulsive trade, the system's heuristic engine detects it and generates a real-time, AI-driven psychological intervention (a "nudge") to slow the user down and force analytical thinking.

### The Psychology (Kahneman & Thaler)
* **System 1 vs. System 2 (Kahneman):** Panic-selling is a *System 1* response (fast, emotional, automatic). The nudge modal introduces friction to wake up *System 2* (slow, analytical, logical). By forcing the user to read an objective summary of *why* they are selling, we short-circuit the panic loop.
* **Choice Architecture (Thaler):** We never block the user from selling. Blocking creates frustration. Instead, we alter the "choice architecture" by presenting the holding's long-term context right before execution.
* **Myopic Loss Aversion:** Investors feel the pain of a loss twice as severely as the joy of an equivalent gain. If a stock is up 50% over a year, but down 3% today, the investor obsesses over the 3% drop. Nudge contextualizes this.
* **Herding Behavior:** Humans are wired to follow the crowd. If the broader market (Nifty 50) is bleeding, users panic-sell perfectly healthy individual stocks.

---

## 2. Engineering Architecture & Data Flow

### Tech Stack
* **Frontend:** React, Vite, TailwindCSS v4, Framer Motion, Nivo Charts.
* **Backend:** FastAPI (Python), SQLAlchemy, SQLite (Development) / PostgreSQL (Production).
* **AI Engine:** Anthropic Claude (via API).
* **Market Data:** `yfinance` (Yahoo Finance).

### End-to-End Data Flow (The "Sell" Action)
1. **Trigger:** User clicks "Review Order" on `SellConfirm.jsx`.
2. **Intent API:** Frontend sends `POST /api/sell-intent` to FastAPI.
3. **Behavioral Engine:** `impulsivity_engine.py` parallelly fetches market data (Nifty 50) and asset data (90-day history).
4. **Scoring:** The engine applies 4 heuristic functions to calculate a score (0-100). 
5. **Branching:**
   * If score < 35 (Low impulsivity): Backend returns `{'action': 'execute'}`. Frontend proceeds instantly.
   * If score >= 35 (High impulsivity): Backend triggers `llm_caller.py`.
6. **LLM Generation:** Claude is prompted with the user's historical data, the holding context, and the triggered signals. It returns a JSON object containing a calm, analytical message.
7. **Intervention:** Frontend receives the LLM payload, mounts the `NudgeModal.jsx` overlay (blurring the background to focus attention).
8. **Resolution:** If the user clicks "Sell Anyway", `POST /api/execute-sell` is called with `heeded=false`. If they click "Keep Holding", it is logged as `heeded=true`.

### Architectural Tradeoffs & Limitations
* **Tradeoff: Synchronous LLM Calls.** Currently, the user waits ~2 seconds while Claude generates the nudge. 
  * *Why we did it:* It prevents the sell execution from going through. 
  * *Scalability concern:* If the LLM API degrades, the user is trapped in a loading state. 
  * *Production Fix:* Implement a hard timeout (e.g., 2.5s). If the LLM doesn't respond, we fail open (allow the trade to execute without a nudge) to maintain core system availability.
* **Tradeoff: yfinance dependency.** Scraping Yahoo Finance is brittle.
  * *Production Fix:* Replace with a robust websocket/REST market data provider like Alpaca, Polygon.io, or Bloomberg API.

---

## 3. The Impulsivity Engine (Core Logic)

**File:** `impulsivity_engine.py`

This is the brain of the platform. Instead of sending raw data to an LLM and hoping it finds patterns (which is slow, expensive, and hallucinates), we use deterministic heuristics to compute a score, and only use the LLM for *communication*. 

### The 4 Signals

**1. Sell Frequency (Overtrading)**
* *Logic:* How many times has the user attempted to sell anything in the last 7 days?
* *Math:* `(attempts / 3) * 20` (Capped at 25).
* *Psychology:* Chasing dopamine. High frequency indicates a lack of conviction and reactive tinkering.

**2. Broad Market Dip (Herding)**
* *Logic:* Is the Nifty 50 bleeding today?
* *Math:* If Nifty < -1.5%, `score = abs(change) * 5` (Capped at 25).
* *Psychology:* Fear contagion. If the whole market is down, the urge to sell is often environmental, not fundamental to the specific stock.

**3. Trend Contradiction (Myopic Loss Aversion)**
* *Logic:* Is the stock up > 5% over 90 days, but down > 2% today?
* *Math:* `score = 90-day-return * 0.8` (Capped at 25).
* *Psychology:* Reminding the user of the macro trend. 

**4. Hold Duration (Short-termism)**
* *Logic:* Have they held the stock for less than 14 days?
* *Math:* `max(15 - hold_days, 0)`.
* *Psychology:* Strategic investments rarely play out in a week. Short holds are almost exclusively emotional exits.

**Why weights & thresholds?** We use strict caps (e.g., max 25 points per signal) to prevent a single extreme market event (like a 10% market crash) from completely overriding the user's personal behavioral data. 

---

## 4. UX/UI & Frontend Architecture

### Design Philosophy
* **Trust & Calmness:** We use a monochromatic palette (Slate/Black/White) with a single vibrant accent (`#ccff00`). We explicitly avoid the jarring Red/Green "strobing" UI of standard crypto/fintech apps. Red/Green induces sympathetic nervous system responses (fight or flight). 
* **Premium Dashboard Layout:** Extracted `Layout.jsx` with a fixed `Sidebar` and `TopBar`. This isolates navigation from the main canvas, reducing cognitive load.
* **Empty States & Skeletons:** We don't use generic spinners. We use skeleton screens (`Skeleton.jsx`) to maintain the visual structure of the page while loading, which makes the app feel vastly faster and more stable. 
* **Micro-interactions:** Framer Motion is used for subtle route transitions and hover states. This provides immediate kinesthetic feedback, establishing trust that the software is responsive.

---

## 5. Interview Framing & Narrative

When explaining this project to Recruiters, PMs, or Engineering Managers, use this narrative arc:

### The Hook (For PMs & Recruiters)
*"I noticed that modern fintech apps are essentially engineered like slot machines. They optimize for maximum trade volume using gamification. I wanted to build the anti-thesis to that: a platform that optimizes for investor discipline. Nudge is a behavioral-finance SaaS that detects panic-selling in real-time and introduces AI-driven 'positive friction' to help retail investors make rational, System-2 decisions."*

### The Engineering Narrative (For Senior Engineers)
*"I built Nudge as a distributed monolith. The hardest engineering challenge was orchestrating the behavioral engine. I realized that asking an LLM to look at market data and decide if a user is panicked is too slow, expensive, and non-deterministic. So, I engineered a deterministic heuristic pipeline in Python (FastAPI) that scores the trade based on 4 psychological signals (Hold Duration, Market Dip, etc.). If the score breaches a threshold, I pass those explicit signals as context to Anthropic's Claude API. This hybrid approach guarantees fast, predictable scoring while still utilizing the LLM for empathetic, human-like communication."*

### Answering "What would you change for Production?"
1. **Data Ingestion:** Move away from scraping `yfinance` to a streaming WebSocket connection (e.g., Polygon.io) for real-time tick data.
2. **Auth & State:** Implement Clerk or Supabase for JWT auth, and move portfolio state to a global store like Zustand to prevent prop-drilling and redundant API calls.
3. **Queueing:** Move non-critical features (like Journal summarization or Behavioral Health Score recalculations) to a background worker (Celery/Redis) so they don't block the HTTP response cycle.
4. **Resiliency:** Add circuit breakers for the LLM. If Anthropic goes down or spikes to 5s latency, the app should instantly fall back to executing the trade to ensure core functionality is never blocked.

---

## 6. Code Walkthrough Examples

### Handling Data Failures (`impulsivity_engine.py`)
```python
# We use dropna() to handle missing market data natively.
nifty = yf.download('^NSEI', period='5d', interval='1d', progress=False)
nifty = nifty.dropna(subset=['Close']) # CRITICAL FIX
```
**Explanation:** Yahoo Finance often returns `NaN` for days the market is closed (weekends/holidays). If we don't drop these, the math `(price - previous) / previous` results in `NaN`. When FastAPI tries to serialize this to JSON, it crashes (`ValueError: Out of range float values`). By dropping NaNs, we ensure the engine always compares the *last two actual trading sessions*, keeping the system highly robust against upstream data corruption.

### The Positive Friction Loop (`SellConfirm.jsx`)
```javascript
const handleSellNow = async () => {
  const res = await postSellIntent(USER_ID, ticker);
  if (res.data.action === 'nudge') {
    setNudgeData(res.data); // Mounts the modal, pausing the execution
  } else {
    await postExecuteSell(USER_ID, holding.ticker, sellQty, null, null);
  }
};
```
**Explanation:** This is the core architectural implementation of "Choice Architecture". The API call acts as a middleware between intention and execution. The state `nudgeData` acts as a lock. If populated, the UI halts and renders the intervention overlay. It forces the user to actively re-confirm their choice.
