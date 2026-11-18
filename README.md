# waterpedia UM

Design prototype for a water-quality workspace at Universiti Malaya. It follows the five-screen flow from the HCI interview: map the campus lakes first, open one station, compare a flow path, clean a field log, then export a citable archive.

The numbers on screen are sample data for Varsity Lake and the UM Green Belt wetland, from September 2025 through November 2026. Nothing is saved to a server.

## Run it

```bash
npm install
npm run dev
```

Open the local address Vite prints, usually `http://localhost:5173`.

## Screens

| Route | Screen |
| --- | --- |
| `/` | Map overview and triage |
| `/station/:id` | One station: WQI parameters, forecast, metadata |
| `/compare` | Flow-path and multi-station comparison |
| `/upload` | Upload, cleaning review, and QA flags |
| `/archive` | Historical table, citation, and API snippet |

Station detail stays off the top navigation. Open it from a station card, a comparison link, or an archive row.

## Stack

TypeScript, React, and Vite. Styling lives in `src/styles/global.css`. Sample stations live in `src/data/mock.ts`.
