# Graphics

`logo.png` and `icon.png` are the team's artwork.

Every other file here is a **placeholder** made for layout. Each one is watermarked "Aphelion placeholder". Replace a file by saving your artwork under the **same file name** (keep the format, or change the extension and update the path listed below).

Palette: `#4350ce` (indigo — terrain/UI), `#e888a0` (rose — Sun), `#bfedf8` (ice — Earth), `#c9c7db` (mist — text), `#000000` (background). Keep rose for anything solar and ice for anything about Earth so the art matches the data colours.

## Lesson illustrations — 520 × 360 (any 13:9 image works)

Referenced in `js/lessons.js` (`image:` field), shown at the top of each lesson.

| File | Lesson |
|---|---|
| `lesson-01-south-pole.svg` | Why everyone wants the south pole |
| `lesson-02-horizon.svg` | How to read the horizon view |
| `lesson-03-lunar-day.svg` | One lunar day lasts a month |
| `lesson-04-polar-sun.svg` | The Sun at the pole |
| `lesson-05-earth.svg` | Where is Earth in the lunar sky? |
| `lesson-06-power.svg` | Solar power: angle is everything |
| `lesson-07-comms.svg` | Talking to Earth |
| `lesson-08-terrain.svg` | Small moves, big changes |
| `lesson-09-planning.svg` | Planning a landing |
| `lesson-10-seasons.svg` | The Moon has seasons too |

The same images are used on the lesson cards of the Learn home page (cropped, revealed on hover).

## Learn home background

`contours-south-pole.svg` — real 1 km elevation contours around the south pole, generated from LOLA data (watermarked). Used large and faint behind the headline; any square SVG or PNG can replace it.

## Badges — 120 × 120, round

Referenced in `js/lessons.js` (`BADGES` and `CHALLENGES`). Shown greyed out until earned.

| File | Earned by |
|---|---|
| `badge-first-light.svg` | Finishing the first lesson |
| `badge-sharp-eye.svg` | A quiz with every answer right first time |
| `badge-flight-plan.svg` | Finishing all lessons |
| `badge-lights-on.svg` | Mission "Keep the lights on" (also its mission artwork) |
| `badge-blackout.svg` | Mission "Radio silence" |
| `badge-eternal-night.svg` | Mission "Eternal night" |
| `badge-apollo-morning.svg` | Mission "Apollo morning" |

## Logo and icon

- `logo.png` — header (32 px) and favicon fallback. A 64 × 64 or 128 × 128 copy would load faster than the current 1.3 MB file.
- `icon.png` — favicon, home-screen icon (`manifest.json`). Provide 192 × 192 and 512 × 512 for best results.

## 3D model

`models/moon_small.glb` — NASA's Moon model for the Moon globe view (NASA SVS 14959, credit: NASA's Goddard Space Flight Center). Not a placeholder; keep as is.
