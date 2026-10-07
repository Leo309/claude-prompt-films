# Pixel style: every career as a 16-bit sports game

Approved on 6 October 2026 for new episodes. The pilot is EP04, Messi vs Ronaldo; EP05 (Ohtani) followed in the same
style. Read this together with `PROMO_PROMPT.md`: everything there still applies (research and
`facts.md`, 90.0 s, cold open, 3–4 clips with their own cold opens, the music rules, `post.md`, the hard rules)
except where this file says otherwise.

## Why change

- **Viewers leave in the first second.** TikTok's average watch time is 2–5 s and the retention curve drops at 0:01
  (`plan/LOG.md`). Our 9:16 frame is mostly near-black: a 16:9 film shrunk into a 900 px band, with a blurred, darkened
  copy above and below. In a feed it reads as a text card.
- **The bar.** A study of 15 code-made motion styles ([mg-styles-15](https://github.com/Vincentwei1021/mg-styles-15))
  holds every film to one rule: a hook in the first 0.5 s, and never more than 0.3 s of an empty or black frame.
- **Why pixel art.** We already draw pixel players (`figure` and `drawSprite` in `render/kit.js`). A full-colour,
  full-frame game screen stops the thumb, and a game's grammar maps onto a career: the score counter, levels, bosses,
  high scores, game over and continue.

## The look

- **Native 9:16.** A pixel film exports `width: 1080, height: 1920, portrait: true`. Draw every frame into a 180×320
  offscreen canvas and blit it at ×6 with `imageSmoothingEnabled = false`. Use whole internal pixels only: no
  sub-pixel positions, rotation, blur or anti-aliasing.
- **Full bleed.** The game world fills the frame from top to bottom. Anything that must be read stays inside SAFE
  (x 60–920, y 240–1500, which is internal x 10–153, y 40–250). Below y 1500 and right of x 920 the platforms' captions
  and buttons sit on top, so put only world there: crowd, pitch, ground, sky.
- **Header.** The hook keeps its place and its Anton type at the top (y 240–600), on a dark HUD panel with a pixel
  border so it reads over bright art. The series tag, the clips' "FULL 90 SECONDS" card and the full film's
  "WHO’S NEXT?" card stay where they are. One header across old and new episodes keeps the series recognisable.
  If a pixel-font header proves clearly stronger in the pilot, propose it with stills of both.
- **Palette.** One palette of at most 32 colours per film. Start from a public palette (Lospec's Endesga 32 or
  Sweetie 16) and add the team colours. Use dithered gradients for skies and floodlights, never smooth ones.
- **Sprites.** Players are 24×32 to 32×48 internal pixels, with a dark outline, three-tone shading, kit colours and
  the shirt number. Each player gets one or two signature traits (hair, sleeve, armband, celebration). Animate in held
  steps at 8–12 fps: runs of 6–8 frames, celebrations of 4–6. Draw them from scratch; never trace a photo or copy a
  real game's sprites.
- **Text in the world.** Use a bitmap font drawn in code (a 6×8 cell with A–Z, 0–9 and `. , : ! ? ' - / # % +`), at ×1
  (48 px on screen) for labels and ×2–×4 for big numbers. It needs no font file, so the font rule in `CLAUDE.md`
  (Anton and IBM Plex Mono) still holds.
- **Motion.** Keep timing stepped and motion on whole pixels. Shake the screen by whole internal pixels. Change scenes
  with game transitions (iris, pixel dissolve, scroll, stage-clear wipe), not crossfades. At most 3 full-screen
  flashes per second.
- **No CRT scanlines.** The platforms re-encode every upload, which turns 6 px scanlines into moiré and blocking.
  A vignette and a little bloom on lights are fine.

## The grammar: a career as a game

Each episode picks the game genre that fits its sport and story, and a different one from earlier episodes
(`PROMO_PROMPT.md`: platforms demonetise look-alikes):

| Genre | Fits | Pieces |
|---|---|---|
| Fighting game | VS episodes | select screen, VS screen, health bars as stats, ROUND 1/2/3 |
| Side-scroller | one career | a level per club or era, coins as goals, the final as the boss |
| Arcade sports game | NBA, NFL | court or field from above, "ON FIRE", instant replay, combo counter |
| RPG status screen | records and longevity | LV for age or seasons, XP bars, trophies as items, level-up fanfare |

Shared vocabulary:

- **SCORE** in the corner is the running count (goals, points) that every film already has.
- **NEW HIGH SCORE** is a record, and **GAME OVER / CONTINUE?** is a retirement or a comeback.
- The **cold open** is the payoff, then a rewind. Make the rewind look like a game reset or a tape rewind.
- Invent each game's name. Homage to the era is fine; real game titles, logos, sprites, fonts and sound effects are not.

## Sound

Make it chiptune: pulse leads (12.5, 25 and 50 % duty), a triangle bass, noise-channel drums and arpeggiated chords.
`chip()` in the kit is the starting voice. Add new voices to `render/kit.js` or `render/pixel.js` rather than forking
them. The data melody and the motif from `PROMO_PROMPT.md` still apply. Every on-screen hit gets a sound effect: coin,
jump, hit, power-up, 1UP, round bell, game over.

## Pipeline: the first pixel episode builds it

1. **`render/pixel.js`, the shared toolkit:**
   - the 180×320 canvas and the ×6 blit
   - palette and dither helpers
   - the bitmap font
   - sprite sheets (built on `drawSprite` and `figure`)
   - tile maps and parallax layers
   - game UI: health bar, score counter, dialog box, select screen, stage card

   Later pixel episodes import it and don't fork it.
2. **`render/vertical.js`:** a portrait film is drawn full frame instead of in the band: no blur, no reframe and no
   chapter label (the film draws its own stage cards). The series tag, hook and sub, end cards and progress bar still
   come from `vertical.js`.
3. **`render/render.ts`:** for a portrait film, `video` renders 9:16 only and `reframe` is skipped. `cuts`,
   `stills --format 9x16` and `sheet --format 9x16` keep working. There is no 16:9 version: all three platforms are
   vertical. Bilibili can get a letterboxed copy later.
4. **Tests:** cover the pure helpers (font layout, dither index, palette lookups, internal-to-screen coordinates) in
   `render/pixel.test.js`. `bun test` must pass, including the existing tests.

Old films must render exactly as before. Check one old clip with `stills --format 9x16` after changing `vertical.js`.

## Quality bar

- Every chapter's key frame should look like a screenshot from a real 16-bit game, one a fan would want to share.
- **First 0.5 s:** a full-colour frame with the subject on it; no black frame anywhere in the film or the clips.
- **At phone size:** the key number is readable without zooming. Check stills at 360 px wide.
- **Side by side:** put one new clip next to `out/messi/clip-napkin-9x16.mp4` at 0.5 s and 2 s. The new one should
  be obviously more eye-catching. If it isn't, iterate before rendering the rest.
- Then run the review loop in `PROMO_PROMPT.md` step 7.

## Copy

AI stays the hook and never the subject. The game is the new angle, so the AI line can say so:

- TikTok's first line: "I asked AI to turn {subject} into a 16-bit {genre}."
- The Shorts title: "I Asked AI to Make {Subject} a 16-Bit {Genre} 🎮"
- Reels: still no AI. Write about the player and the moment only.

## Pilot: EP04 Messi vs Ronaldo

- **Genre:** a fighting game with an invented name (for example "GOAT FIGHT ’26").
  - Open on the select screen, then the VS screen.
  - Each round is one stat fans argue about: goals, Ballon d’Or, trophies, the World Cup, the Champions League,
    international goals.
  - The health bars move with the numbers, and both players win rounds. Present every number straight.
  - No verdict at the end: `vertical.cta` is "WHO’S YOUR GOAT?" / "COMMENT BELOW".
- **Data:** `films/messi/facts.md` (updated 6 October 2026 after the farewell: 126 goals in 208 games for Argentina,
  932 in all) and `films/ronaldo/facts.md` (979 goals as of its date). Re-check anything that may have changed,
  Ronaldo's total first.
- **Clips:** 3–4, each one round that ends on its payoff, plus the VS screen as the cold open.
- **Deadline:** as soon as it is good. Slots on 10/10–10/12 are empty.
- **Don't upload.** The ops session uploads finished batches one platform at a time.
