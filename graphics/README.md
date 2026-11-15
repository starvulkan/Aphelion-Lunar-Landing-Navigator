# Graphics

`logo.png`, `icon.png`, the lesson illustrations (`lesson-*.png`) and the badges (`badge-*.png`) are the team's artwork.

`contours-south-pole.svg` and everything in `readme/` are AI-generated placeholders and are watermarked. To swap any image, save the new one under the **same file name** (or change the extension and update the path listed below).

Palette: `#4350ce` (indigo — terrain/UI), `#e888a0` (rose — Sun), `#bfedf8` (ice — Earth), `#c9c7db` (mist — text), `#000000` (background). Keep rose for anything solar and ice for anything about Earth so the art matches the data colours.

## Lesson illustrations — 520 × 360 (any 13:9 image works)

Referenced in `js/lessons.js` (`image:` field), shown at the top of each lesson.

| File | Lesson |
|---|---|
| `lesson-01-south-pole.png` | Why everyone wants the south pole |
| `lesson-02-horizon.png` | How to read the horizon view |
| `lesson-03-lunar-day.png` | One lunar day lasts a month |
| `lesson-04-polar-sun.png` | The Sun at the pole |
| `lesson-05-earth.png` | Where is Earth in the lunar sky? |
| `lesson-06-power.png` | Solar power: angle is everything |
| `lesson-07-comms.png` | Talking to Earth |
| `lesson-08-terrain.png` | Small moves, big changes |
| `lesson-09-planning.png` | Planning a landing |
| `lesson-10-seasons.png` | The Moon has seasons too |

The same images are used on the lesson cards of the Learn home page (cropped, revealed on hover).

## Learn home background

`contours-south-pole.svg` — real 1 km elevation contours around the south pole, generated from LOLA data (watermarked). Used large and faint behind the headline; any square SVG or PNG can replace it.

## Badges — round, 320 × 320 PNG with a transparent background

Referenced in `js/lessons.js` (`BADGES` and `CHALLENGES`). Shown greyed out until earned.

| File | Earned by |
|---|---|
| `badge-first-light.png` | Finishing the first lesson |
| `badge-sharp-eye.png` | A quiz with every answer right first time |
| `badge-flight-plan.png` | Finishing all lessons |
| `badge-lights-on.png` | Mission "Keep the lights on" (also its mission artwork) |
| `badge-blackout.png` | Mission "Radio silence" (badge title: Total Silence) |
| `badge-eternal-night.png` | Mission "Eternal night" (badge title: Never Ending Night) |
| `badge-apollo-morning.png` | Mission "Apollo morning" (badge title: Mornings) |

## Logo and icon

- `logo.png` — header (32 px) and favicon fallback. A 64 × 64 or 128 × 128 copy would load faster than the current 1.3 MB file.
- `icon.png` — favicon, home-screen icon (`manifest.json`). Provide 192 × 192 and 512 × 512 for best results.

## 3D model

`models/moon_small.glb` — NASA's original Moon model (NASA SVS 14959, credit: NASA's Goddard Space Flight Center). `models/moon_web.glb` (desktop, 4 MB) and `models/moon_mobile.glb` (phones, 2.2 MB) — the same model with a JPEG texture, which is what the app loads. Rebuild both with `python3 tools/make-web-moon.py`. Not placeholders; keep both. If you change the model, bump `MODEL_CACHE` in `js/scene3d.js` so browsers drop the old cached copy.

## Textures

`textures/earth_bmng_200405_2048.jpg` — NASA Blue Marble Next Generation (May 2004, topography and bathymetry), used for Earth in the Moon globe view. Credit: NASA Earth Observatory / Reto Stöckli. Not a placeholder.

## README graphics

`readme/` holds the images used in the project README: `banner.svg` and `one-month.svg` (drawn from real LOLA horizons and Aphelion's Sun/Earth tracks), `divider.svg`, and app screenshots (`*.jpg`; the Learn mode shots show the team's lesson and badge art). All are AI-generated placeholders and carry a visible "AI-generated" watermark, as NASA Space Apps requires. Replace them with the team's own versions before submitting.

The badge PNGs were made from the team's 1024 × 1024 originals: the white square around each circle was made transparent and the image scaled to 320 px. The lesson PNGs are the team's 520 × 360 originals, unchanged.
