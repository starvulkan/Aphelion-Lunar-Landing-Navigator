# Aphelion — Lunar Landing Navigator

A web app for comparing lunar landing sites and dates. It shows where the Sun and Earth sit against the **real terrain horizon** of a site, and how long a lander would have sunlight for power and a line of sight to Earth for radio.

Built for the 2026 NASA Space Apps Challenge.

## Two modes

**Mission** — for planners. Pick a site and a landing time and get (switch between **Professional**, every number at a glance, and **Educational**, the key points in plain words):
- an overall score from 0 to 100 built from power, comms, night survival and terrain slope
- a 3D view of the real LOLA terrain around the site, lit by the Sun from its true direction with cast shadows, plus a Moon globe and a 360° horizon panorama
- a year view ("Season and patterns") with the team's SAOQ season index, the best landing day, longest light and dark runs, and how strongly the site follows the season
- time to the next sunset/sunrise and Earthset/Earthrise, from any moment you scrub to
- sunlight, Earth-in-view and "both" percentages, plus the longest dark spell
- "If the landing slips" (±1–2 days) and a 45-day grid of the best landing days
- a sky-dome plot, a comparison table of pinned scenarios with CSV export, and shareable links
- a one-click check of any value against NASA/JPL Horizons

**Learn** — for students and the public. Ten short lessons, each with a live lab driven by the same engine and terrain data, quizzes, XP ranks, badges, and four missions that the app checks against your real Mission-mode scenario.

## Data

- **Ephemeris** — computed in the browser for any date (Meeus; IAU 2009 lunar orientation). Checked against JPL Horizons: worst difference 0.014° over 434 samples.
- **Terrain** — NASA LRO LOLA grids from the PDS Geosciences Node. Horizons for 36 curated sites are in `data/horizons.json`; custom coordinates use LOLA tiles built at deploy time.
- **Sites** — Apollo, Chang'e, Chandrayaan-3, SLIM, CLPS landers, the nine Artemis candidate regions, Chang'e 7, and reference points, each with a cited source.

Full citations: [DATA_SOURCES.md](DATA_SOURCES.md). How to check every number yourself: [VERIFY.md](VERIFY.md).

## Run locally

No build step and no dependencies.

```bash
python3 -m http.server 8000      # or: npx serve .
# open http://localhost:8000
```

Opening `index.html` directly from disk will not work (browsers block the data files over `file://`).

### Optional: generate the custom-site terrain tiles

Curated sites work out of the box. To get real terrain for **custom coordinates** locally (the deploy workflow does this automatically), run once with internet access:

```bash
node tools/build-data.mjs           # downloads ~185 MB of LOLA data into .cache/, writes data/dem/
```

Without the tiles, custom sites fall back to a smooth-sphere horizon and the app says so.

### Check the ephemeris

```bash
node tools/validate.mjs             # against the stored Horizons table
node tools/validate.mjs --live      # against fresh Horizons values
```

## Deploy (GitHub Pages)

1. Repository **Settings → Pages → Source: GitHub Actions**.
2. Push to `main`. `.github/workflows/deploy.yml` downloads the LOLA data, rebuilds `data/`, validates the engine against JPL Horizons (deploy fails if off by more than 0.1°), and publishes.
3. The workflow also runs daily to refresh the Horizons reference.

## Project layout

```
index.html            app shell
css/styles.css        design (palette: #4350ce #e888a0 #bfedf8 #c9c7db #000000)
js/app.js             Mission mode, dialogs, URL state, comparison
js/ephemeris.js       Sun/Earth engine, visibility windows, Horizons query builder
js/terrain.js         loads LOLA horizons and tiles
js/viz.js             panorama, timeline, sky dome, season and lesson charts
js/scene3d.js         3D terrain and Moon globe (three.js)
js/season.js          season index (SAOQ) and year-long pattern analysis
js/learn.js           Learn mode (lessons, labs, quizzes, missions, XP)
js/lessons.js         lesson text, quizzes, missions, ranks, badges
js/sites.js           curated sites with sources
js/store.js           localStorage wrapper
tools/lola-horizon.js horizon ray-marcher (shared by app and build)
tools/build-data.mjs  rebuilds data/ from NASA sources
tools/validate.mjs    compares the engine with JPL Horizons
tools/validate-season.mjs  compares the season analysis with the team report
vendor/three/         three.js (MIT)
data/                 horizons.json, patches.i16, dem/, horizons-reference.json, stars.json
graphics/             logo, icon, and watermarked placeholders
```

## Disclaimer

A planning aid and teaching tool, not flight software. Use official mission products for operational decisions.

## License

Apache 2.0 — see [LICENSE](LICENSE).
