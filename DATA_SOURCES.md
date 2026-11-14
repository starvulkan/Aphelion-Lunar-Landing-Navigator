# Data sources and citations

Everything Aphelion shows is either computed from a published method or read
from a public NASA dataset. Nothing is hand-tuned or invented. This file lists
what to credit and where each number comes from. To check the numbers
yourself, see [VERIFY.md](VERIFY.md).

## 1. Sun and Earth positions (ephemeris)

Computed live in the browser by `js/ephemeris.js`.

| Part | Method | Reference |
|---|---|---|
| Sun position | Apparent geocentric place, ch. 25 | Meeus, J. (1998). *Astronomical Algorithms*, 2nd ed. Willmann-Bell. |
| Moon position | Truncated ELP-2000/82 series (60 + 60 terms), ch. 47 | Meeus (1998), ch. 47; Chapront-Touzé, M. & Chapront, J. (1988), *A&A* 190, 342. |
| Precession J2000 → date | IAU 1976, ch. 21 | Meeus (1998), ch. 21; Lieske, J.H. et al. (1977), *A&A* 58, 1. |
| Moon orientation and physical libration | IAU WGCCRE 2009 rotation model with its periodic libration terms | Archinal, B.A. et al. (2011). Report of the IAU Working Group on Cartographic Coordinates and Rotational Elements: 2009. *Celest. Mech. Dyn. Astr.* 109, 101–135. doi:10.1007/s10569-010-9320-4 |
| Refraction | None — the Moon has no atmosphere | — |

**Validation reference — NASA/JPL Horizons System**
Giorgini, J.D. et al. (1996). JPL's On-Line Solar System Data Service. *Bull. Am. Astron. Soc.* 28(3), 1158.
Horizons API documentation: <https://ssd-api.jpl.nasa.gov/doc/horizons.html>
Planetary ephemeris used by Horizons: Park, R.S., Folkner, W.M., Williams, J.G. & Boggs, D.H. (2021). The JPL Planetary and Lunar Ephemerides DE440 and DE441. *Astron. J.* 161, 105. doi:10.3847/1538-3881/abd414

`data/horizons-reference.json` holds 434 Horizons values (7 sites × Sun and Earth × 31 days). The GitHub Actions workflow refreshes it every day and refuses to deploy if the app's engine differs by more than 0.1°.

Result on 2026-11-14: worst elevation difference 0.014°, mean 0.003°, worst azimuth difference 0.014° (cos-elevation weighted).

## 2. Terrain (horizons and ground height)

**NASA LRO Lunar Orbiter Laser Altimeter (LOLA)**
Smith, D.E. et al. (2010). The Lunar Orbiter Laser Altimeter Investigation on the Lunar Reconnaissance Orbiter Mission. *Space Sci. Rev.* 150, 209–241. doi:10.1007/s11214-009-9512-y
Dataset: Smith, D.E., Neumann, G.A. et al., *LRO LOLA Gridded Data Records*, LRO-L-LOLA-4-GDR-V1.0, NASA Planetary Data System Geosciences Node.
<https://pds-geosciences.wustl.edu/lro/lro-l-lola-3-rdr-v1/lrolol_1xxx/data/lola_gdr/>

| File | Projection | Used for |
|---|---|---|
| `polar/img/ldem_60s_240m.img` | Polar stereographic, 240 m/px, 60–90°S | All curated sites south of 60°S; custom-site tiles |
| `polar/img/ldem_75n_240m.img` | Polar stereographic, 240 m/px, 75–90°N | North-polar sites; custom-site tile |
| `cylindrical/img/ldem_64.img` | Simple cylindrical, 64 px/deg (474 m) | Non-polar sites, terrain within 40 km |
| `cylindrical/img/ldem_16.img` | Simple cylindrical, 16 px/deg (1.9 km) | Non-polar sites, terrain 40–400 km |
| `cylindrical/img/ldem_4.img` | Simple cylindrical, 4 px/deg (7.6 km) | Custom sites outside the polar tiles |

Heights are `DN × 0.5 m` above a 1,737.4 km sphere in the Mean Earth / Polar Axis frame (DE421), as stated in each file's PDS label.

**How horizons are computed** (`tools/lola-horizon.js`): for every 1° of azimuth, march outward to 400 km on the sphere, read the LOLA height (bilinear), and keep the largest elevation angle seen from a point 2 m above the local ground. Curvature is exact; no refraction. `data/horizons.json` was produced with this code from the files above and can be regenerated with `node tools/build-data.mjs`.

Spot checks against published elevations: IM-1 site 2,588 m (NASA CLPS poster: 2,579 m); Chang'e 6 site −5,255 m (LROC: −5,256 m).

**3D terrain patches** (`data/patches.i16`): for each curated site, an 84 × 84 km grid (181 × 181 samples) of LOLA heights from the same files, used by the 3D terrain view. The Moon globe's relief is shaded in the browser from `ldem_4`. Sun direction, Earth direction and Earth's phase in both 3D views come from the ephemeris engine above.

**Moon globe model:** *Moon 3D Models for Web, AR, and Animation*, NASA Scientific Visualization Studio, ID 14959 (published 29 Jan 2026), file `moon_small.glb` (colour map from Lunar Reconnaissance Orbiter imagery, no topography). <https://svs.gsfc.nasa.gov/14959/> Credit line requested by NASA: **NASA's Goddard Space Flight Center**. The original is kept unmodified in `graphics/models/moon_small.glb`. The app loads a copy with only its colour texture re-encoded from PNG to JPEG (quality 88); geometry is unchanged. Desktops get `moon_web.glb` (4096 × 4096 texture, 4 MB) and phones and tablets get `moon_mobile.glb` (2048 × 2048, 2.2 MB). Rebuild it with `python3 tools/make-web-moon.py`. If it cannot be loaded, the globe falls back to a sphere shaded from LOLA `ldem_4`.

## 2a. Overall score

`js/score.js`. A 0–100 screening score for one site, landing time and stay, extending the SELENE prototype's balance score (geometric mean of sunlit % and Earth-visible %):

`score = 100 × Power^wP × Comms^wC × Night^wN × Terrain^wT`

| Factor | Definition | Balanced weight |
|---|---|---|
| Power | share of the stay with the Sun above the LOLA terrain | 0.35 |
| Comms | share of the stay with Earth above the LOLA terrain | 0.35 |
| Night survival | 1 − longest spell without sunlight ÷ stay length (floor 0.05) | 0.15 |
| Terrain | slope at the site from LOLA over a ~0.9 km baseline: 1 at ≤ 5°, 0.05 at ≥ 20° | 0.15 |

"Power first" and "Comms first" use 0.50 / 0.20 for the first two weights. The weights and slope limits are the team's design choices, not a NASA standard; the score is for comparing options, not for certifying a site. Slope over a 0.9 km baseline does not show lander-scale hazards.

## 2b. Season analysis (SAOQ)

**Team report:** *Lunar South Pole Mission Opportunity — Astronomical Windows, Illumination Geometry, and Lunar-Cycle Timing* (Aphelion team, 2026). Data: NASA/JPL Horizons, DE441, Moon (301) from Earth (399), daily records 4 Aug 2010 – 4 Aug 2030, field SunSub-LAT. The report defines the Southern Astronomical Opportunity Quotient, `SAOQ = 100 × min[1, max(0, −SunSubLat / 1.59°)]`, and lists the windows with SAOQ ≥ 90 %.

Aphelion computes the sub-solar latitude live for any year (`js/season.js`) instead of reading the report's table. `tools/validate-season.mjs` checks that the live result reproduces the report: same dates for the yearly minima (14 Nov 2026, 7 Nov 2027, 4 Oct 2028, 24 Sep 2029), values within 0.002°, and window edges within one day.

The "Season and patterns" panel adds, per site and year, from the terrain-based visibility model: sunlight and Earth-in-view for a stay starting on each day, the best landing day, the longest unbroken sunlight and darkness, and the Pearson correlation between SAOQ and the site's sunlight. As the report stresses, SAOQ is a seasonal screening index, not a sunlight percentage or a probability of success.

## 3. Mapping tools used as references

- **LROC QuickMap** — Arizona State University LROC team and Applied Coherent Technology. <https://quickmap.lroc.asu.edu/> Used to check coordinates and LOLA elevation profiles.
- **NASA Moon Trek** — NASA Solar System Treks Project, Jet Propulsion Laboratory. <https://trek.nasa.gov/moon/> Used to inspect terrain around candidate sites.
- **NASA GSFC Planetary Geodesy Data Archive** — LOLA illumination products for independent comparison of sunlight statistics. <https://pgda.gsfc.nasa.gov/>

## 4. Landing-site coordinates (`js/sites.js`)

Each entry in `js/sites.js` carries its own `src` field. Summary:

| Sites | Source |
|---|---|
| Apollo 11, 12, 14, 15, 16, 17 | Davies, M.E. & Colvin, T.R. (2000). Lunar coordinates in the regions of the Apollo landers. *J. Geophys. Res.* 105(E8), 20277–20280; NASA Apollo Lunar Surface Journal. |
| Chang'e 3, 4, 5, 6; Chandrayaan-3; IM-2; HAKUTO-R M1 impact | LROC post-landing localisations (Arizona State University), e.g. Chang'e 6: <https://www.lroc.asu.edu/images/1374> |
| IM-1 | NASA CLPS AGU poster (2025), NTRS 20250011367 — 80.13°S, 1.44°E, 2,579 m |
| SLIM | JAXA mission release (January 2024) |
| Blue Ghost Mission 1 | Firefly Aerospace / NASA (March 2025) |
| Artemis candidate regions (Oct 2024 list) | NASA (2024) LEAG announcement; NTRS 20250011660 (LPSC 2026 abstract). Reference points: *ResGAT-F* (2025), Int. J. Digital Earth, doi:10.1080/17538947.2025.2547291, Table 4 (Peak near Cabeus B, Mons Mouton Plateau, Nobile Rim 1 & 2, de Gerlache Rim 2, Slater Plain); LROC NAC ROI mosaic "HAWORTH" centre (Haworth); De Rosa, D. et al. (2012), *Planet. Space Sci.* 74, 224–246, arXiv:1208.5587, Table 2 (Malapert Massif, connecting ridge, de Gerlache rim). |
| Mons Mouton, Reiner Gamma, Shackleton, Peary | IAU/USGS Gazetteer of Planetary Nomenclature, <https://planetarynames.wr.usgs.gov/> |
| Chang'e 7 target | Wang, C. et al. (2024), *Natl. Sci. Rev.*; launch delay to 2027 per CNSA (Aug 2026) |
| Luna 25 intended site | Roscosmos / IKI (2023) |

Artemis regions are about 15 × 15 km. The listed points are published reference points inside them, not official landing sites.

## 5. Lesson facts (Learn mode)

| Fact | Source |
|---|---|
| Lunar axial tilt to the ecliptic 1.54° | Archinal et al. (2011); Meeus (1998) ch. 53 |
| Synodic month 29.53 d, sidereal 27.32 d, draconic 27.21 d, eclipse year 346.62 d | Meeus (1998) ch. 49–54 |
| Optical libration ±7.9° (longitude), ±6.7° (latitude) | Meeus (1998) ch. 53 |
| Permanently shadowed craters below 40 K | Paige, D.A. et al. (2010). Diviner Lunar Radiometer observations of cold traps in the Moon's south polar region. *Science* 330, 479–482. |
| LCROSS water 5.6 ± 2.9 % by mass | Colaprete, A. et al. (2010). Detection of water in the LCROSS ejecta plume. *Science* 330, 463–468. |
| Ridge sites lit > 80 % of the time | Mazarico, E. et al. (2011). Illumination conditions of the lunar polar regions using LOLA topography. *Icarus* 211, 1066–1081. |
| Total solar irradiance 1,361 W/m² | Kopp, G. & Lean, J.L. (2011). *Geophys. Res. Lett.* 38, L01706. |
| Apollo landing Sun elevations 5–15° | NASA Apollo Lunar Surface Journal mission summaries |
| Artemis III re-scoped to an Earth-orbit test; first landing on Artemis IV (2028) | NASA announcement, Feb–Mar 2026 |

## 6. Software and type

- Typeface: Archivo by Omnibus-Type, SIL Open Font License, via Google Fonts.
- 3D rendering: three.js r170 (MIT licence), vendored in `vendor/three/`. No other JavaScript libraries.
- Second typeface in Learn mode: Instrument Serif by Rodrigo Fuenzalida, SIL Open Font License, via Google Fonts.
- 3D site scene adapted from the team's own SELENE prototype (`space-apps-challenge-practicePlayground`, MIT).
- Star positions in the 3D view: bright-star list (right ascension, declination, magnitude) carried over from the SELENE prototype (`data/stars.json`). Its original catalogue is not recorded there — confirm before citing it by name.
- Learn-mode interaction patterns (large split headlines, scroll word reveal, marquee, rolling button labels) are inspired by landonorris.com (design by OFF+BRAND). No code, images or fonts from that site are used.

## 7. Graphics

`graphics/logo.png` and `graphics/icon.png` are the team's own artwork. `graphics/contours-south-pole.svg` is generated from LOLA data (1 km contours around the south pole) and is watermarked. All other files in `graphics/` are placeholders generated for layout and carry an "Aphelion placeholder" watermark; see `graphics/README.md`.
