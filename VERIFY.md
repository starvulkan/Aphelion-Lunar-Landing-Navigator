# How to check Aphelion's numbers yourself

These checks use only official NASA tools, outside the app. Each one takes a
few minutes. If a check fails, the app is wrong — please open an issue.

---

## Check 1 — Sun and Earth position (JPL Horizons, by hand)

1. In Aphelion, pick a site and a time. Note the **Sun** elevation and azimuth from the panorama label or the Sun panel, the site's coordinates, and its ground height (shown under the site name).
2. Open the Horizons web app: <https://ssd.jpl.nasa.gov/horizons/app.html>
3. Set:
   - **Ephemeris Type:** Observer Table
   - **Target Body:** Sun
   - **Observer Location:** click *Edit* → *Specify coordinates* → Body: **Moon (301)** → type *geodetic* → enter **East longitude** (west is negative), **latitude** (south is negative), and **altitude in km** = (ground height + 2 m) ÷ 1000.
   - **Time Specification:** your UTC time, step 1 hour.
   - **Table Settings:** select only quantity **4** (Apparent AZ & EL). Angle format: decimal degrees.
4. Generate. Compare the *Azimuth* and *Elevation* columns with Aphelion.
5. Repeat with **Target Body: Earth** for the Earth numbers.

**Expected agreement:** within about 0.02°. (The Sun's disc is 0.53° wide.)

Shortcut: the **Check in JPL Horizons** button under the site details opens the Horizons API with exactly these settings already filled in. Change `COMMAND='10'` to `COMMAND='399'` in the address for Earth.

---

## Check 2 — Automated comparison (one command)

Needs Node.js 18 or newer and an internet connection.

```bash
node tools/validate.mjs --live
```

This downloads fresh Sun and Earth tables from Horizons for seven sites (south pole, Malapert Massif, Slater Plain, IM-2, Apollo 11, Chang'e 4, and the sub-Earth point) over the next 30 days and prints the largest difference for each. It exits with an error if any elevation differs by more than 0.1°.

Without `--live` it uses the stored table `data/horizons-reference.json` (retrieved from Horizons, refreshed daily by the deploy workflow).

---

## Check 3 — Terrain height (LROC QuickMap)

1. Open <https://quickmap.lroc.asu.edu/> and switch the projection to **South Polar** (or Equirectangular for non-polar sites).
2. In *Layers*, turn on **LOLA → Elevation**.
3. Use the search box or the coordinate readout to go to the site's latitude and longitude, and read the elevation under the cursor.
4. Compare with the ground height Aphelion shows. Expect agreement within tens of metres (Aphelion uses the 240 m/px LOLA grid, QuickMap may show a finer one).

## Check 4 — Terrain horizon (QuickMap or Moon Trek)

1. In Aphelion, hover over the panorama to find the azimuth of a ridge and its height in degrees.
2. In QuickMap, use the **Draw / Path** tool to draw a line from the site in that compass direction (QuickMap shows bearing and length) and open the **Elevation profile**.
3. For a ridge at distance *d* (m) that stands Δh (m) above the site, the elevation angle is about atan((Δh − d²/3,474,800) / d) degrees — the second term is the Moon's curvature. It should match the panorama within a few tenths of a degree.

NASA Moon Trek (<https://trek.nasa.gov/moon/>) has a similar elevation-profile tool.

## Check 5 — Sunlight statistics (NASA GSFC)

NASA Goddard publishes LOLA-based illumination maps for the south pole at <https://pgda.gsfc.nasa.gov/> (search "illumination"). Average illumination there is a multi-year figure, so compare it with Aphelion's sunlight percentage over **1 lunar day** at several dates across a year: high ridges (connecting ridge, Malapert) should be lit most of the time, and Shackleton's floor never.

## Check 5b — Season index (SAOQ) and sub-solar latitude

1. In Aphelion, the site details show the **Sub-solar point**; the "Season and patterns" panel shows SAOQ and the southern-summer window.
2. In the Horizons web app choose Target **Moon**, Observer **Geocentric (500)**, quantity **14** (Observer sub-lon & sub-lat) — the *Sun sub-lat* column (SunSub-LAT) is the sub-solar latitude. It should match Aphelion within about 0.01°.
3. SAOQ = 100 × min(1, max(0, −SunSubLat ÷ 1.59)). Compare with the team report: minima on 14 Nov 2026 (−1.557°), 7 Nov 2027, 4 Oct 2028, 24 Sep 2029.
4. Or run `node tools/validate-season.mjs`, which makes this comparison automatically.

## Check 6 — Site coordinates

Every curated site in `js/sites.js` has a `src` field naming where its coordinates come from. Search the coordinates in QuickMap; for landed missions the hardware is visible in LROC images at those coordinates.

---

## What Aphelion does not model

- Terrain smaller than the LOLA grid (240 m/px at the poles, ~474 m elsewhere): boulders, small craters, and the lander's own structure.
- Partial Sun: "sunlight" means the centre of the Sun's disc is above the terrain. A ridge can hide half the disc while the app still says "in sunlight".
- Radio effects such as diffraction over ridges or multipath — "Earth in view" is pure line of sight to the centre of Earth's disc.
- Eclipses of the Sun by Earth (lunar eclipses), which last a few hours a few times a year.
