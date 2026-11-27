# 3D avatar prototype (procedural, cel-shaded)

Reference for art direction and for the slider → shape pipeline. **Not production art.**

- `avatar_logic.js` — the component used by `design/screens/FaceAdjust.dc.html`. `buildAvatar(THREE, params)` builds a bust from code with three.js r149: deformed head (anime proportions), painted anime eyes, brows, nose, mouth, layered hair strands (short / fade / long / curly / none), optional glasses and beard, toon (cel) shading with an inverted-hull ink outline, blink and idle sway.
- `renders.png` — reference renders from several angles and styles.

## Art direction (decided)
3D anime / video-game style: cel-shaded, ink outlines, big expressive eyes, stylized proportions. Not chibi or cartoonish, not photoreal.

## What the production version changes
- A sculpted head mesh made by a 3D artist, with **the same parameters exposed as blend shapes**: face width, jaw, eye size, eye spacing, nose, lips, brows (+ more as needed). The face scan fills these values; the user can edit them.
- Hair, glasses and beards become authored meshes with the same IDs (`short`, `fade`, `long`, `curly`, `none`).
- Render in the app with a toon shader + outline pass (same look as here).
- Body tiers driven by STR/AGI/VIT (GAME_DESIGN §13) attach below the same neck point.

## Parameter contract (stored per user, 0–100 unless noted)
`fw, jaw, eye, sp, nose, lips, brow, skin (0–5), eyeColor (0–3), hairColor (0–3), hair (id), glasses (bool), beard (bool)`
