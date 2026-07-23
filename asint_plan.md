# OSINT Domain Dashboard — Project Plan & Handover Brief

## Project Identity
- **Name**: `osint-domain-dashboard`
- **Type**: Open-Source Intelligence (OSINT) Maritime & Airspace Domain Awareness Platform
- **Framing**: NOT "Defence Intelligence" (overclaims). Always describe as: "OSINT / Domain Awareness Dashboard"
- **Goal**: Portfolio/resume project → industry-competitive product
- **Core differentiator**: Data fusion + dark-asset anomaly detection (vessels/aircraft going dark near sensitive zones, correlated with satellite imagery)
- **Budget constraint**: Zero cost — free tiers and student subscriptions only

---

## Developer Info
- **Name**: Rohit
- **MacBook Air (Apple Silicon — darwin-arm64)**
- **Node**: v22.8.0 (upgrade to v22.12.0+ recommended — causes Vite warnings but builds work)
- **Project location**: `~/Downloads/osint/osint-domain-dashboard`

---

## Student Subscriptions Available (use these, never settle for less)
| Resource | Notes |
|---|---|
| GitHub Student Developer Pack | Activate if not done — unlocks domain, DigitalOcean credits etc |
| MongoDB Atlas (student tier) | Time-series DB for AIS/ADS-B storage |
| JetBrains All Products Pack | Full IDE suite including AI assistant (Junie) — vibe-coding option |
| Figma (student) | UI design |
| GitHub Copilot (student) | Inline autocomplete |
| Perplexity Pro | Research only, not coding |

---

## Vibe-Coding Tool Roster
| Tool | Usage Status | Role |
|---|---|---|
| **Codex (ChatGPT Go)** | ~95% left, resets Aug 6 | **Primary tool — started here** |
| Gemini AI Pro (Antigravity) | 100% available | Heavy-lifting / agentic driver |
| Cursor (free tier) | ~51% used, resets July 17 | Focused small edits |
| GitHub Copilot (student) | Unknown | Inline autocomplete |
| JetBrains AI (Junie) | Full student access | IDE-based alternative |

---

## Vibe-Coding Workflow Rules (strictly follow)
1. Claude gives **one task at a time** as a single ready-to-paste prompt for a vibe-coding tool, then **waits**
2. Claude writes code directly **only for terminal/setup tasks** — never for feature implementation
3. Terminal prompts and vibe-coding tool prompts are always given **separately with clear labels**
4. Rohit runs the prompt, reports back success or stuck
5. **Stuck = defer, not abandon** — note it, move on, carry into next handover
6. Foundational/important tasks always come first
7. Never manage or settle for less when student resources are available

---

## Finalized Tech Stack
| Layer | Choice | Notes |
|---|---|---|
| Frontend | React + Vite | Migrate to Next.js at industry stage |
| Map | Leaflet.js + react-leaflet + OpenStreetMap | Free, no API key |
| Backend | Python | scikit-learn, rasterio, shapely for ML phase |
| Database | MongoDB Atlas (student tier) | Time-series collections for AIS/ADS-B |
| Scheduler | GitHub Actions (free cron) | No always-on server needed |
| Aircraft data | OpenSky Network REST API | Free, uses basic auth (username/password) |
| Ship data | AISStream.io WebSocket | Free, API key required — stored in .env |
| Satellite (base) | NASA GIBS WMTS tiles | Free, no key, no rate limit |
| Satellite (hi-res, later) | Copernicus/Sentinel Hub | Free tier, registration required |
| ML (Phase 5) | scikit-learn — Isolation Forest + DBSCAN | Anomaly detection, no GPU needed |
| NL summaries (later) | Gemini API | Natural-language anomaly explanations |
| Design | Figma (student) | |
| Deployment | Vercel or Netlify free tier | |

---

## API Credentials (never commit to git — store in .env)
- **OpenSky Network**: account created — uses username/password basic auth (no separate API key)
- **AISStream.io**: account created via GitHub OAuth — API key generated and stored locally
- **.env file**: not yet created — will be set up during Phase 2 (AIS integration task)
- **.gitignore**: already includes .env by default from Vite scaffold

---

## Phased Roadmap
| Phase | Feature | Status |
|---|---|---|
| **Phase 0** | Repo scaffold + Leaflet/OSM full-screen map | ✅ COMPLETE |
| Phase 1 | Live ADS-B aircraft tracking (OpenSky) on map | ⬜ Next |
| Phase 2 | Live AIS ship tracking (AISStream WebSocket) on map | ⬜ |
| Phase 3 | NASA GIBS satellite imagery toggle layer | ⬜ |
| Phase 4 | Historical storage (MongoDB) + timeline playback | ⬜ |
| Phase 5 | ML anomaly / dark-asset detection (Isolation Forest + DBSCAN) | ⬜ |
| Phase 6 | Change detection + terrain analysis | ⬜ |

---

## Task Log

### ✅ Task 1 — Repo scaffold + full-screen Leaflet/OSM map
- **Tool used**: Codex
- **Result**: Complete
- **Files changed**: `App.jsx`, `App.css`, `index.css`, `main.jsx`, `src/components/MapView.jsx` (new)
- **Map config**: Center `[20, 0]`, zoom `2`, OSM tile layer, 100vw/100vh fullscreen
- **Notes**: Node v22.8.0 causes EBADENGINE warnings but build succeeds. Upgrade to v22.12.0+ recommended when convenient.

---

## Deferred / Stuck Tasks
_(none yet — will be listed here as they arise)_

---

## Next Task (Task 2 — Phase 1)
**Goal**: Fetch live aircraft data from OpenSky Network REST API and plot aircraft as markers on the map.

**Approach**:
- Python backend script to fetch from `https://opensky-network.org/api/states/all`
- Initially: can poll directly from frontend (REST, no key needed for anonymous) as a quick win
- Markers should show ICAO code, altitude, and heading on hover/click

**Waiting on**: Rohit to confirm Task 1 map renders correctly in browser before issuing Task 2 prompt.

---

## How to Resume in a New Chat
1. Paste this entire `plan.md` into the new chat
2. State: "Continuing my OSINT dashboard project — pick up from where plan.md says"
3. Claude will read current phase status, deferred tasks, and issue the next task prompt
