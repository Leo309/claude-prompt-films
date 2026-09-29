# Film recipe

This is the brief behind `/promo <keyword>`. One keyword in, one finished MP4 (and a ready-to-post caption) out.

## The brief

> Make a promo film about **{keyword}**. {seconds, default 90} seconds. Rich in content, not abstract:
> real numbers, dates and moments. Show why it is great. The visuals should hit hard. You know what I mean.

That's the whole creative direction. Everything below is how to deliver it.

**Effect first.** The film is for the fans of the subject, and it has to feel made *by* one:
- the moments they'd pick themselves;
- the numbers they quote;
- the in-jokes and memes they'll catch on first watch (football, NFL, F1, esports, any niche).

People who don't know the niche should still feel the energy. The tech story ("one prompt, Claude, code") goes
in the caption, not in the film, so both audiences get something.

## Workflow

1. **Research first.** Search the web for the subject; your training data may be stale. Check anything
   recent: current team, latest records, retirement news. Write `films/<slug>/facts.md`:
   - a table of *on screen · value · source link*, plus an "as of" date, with key numbers cross-checked
     against two sources. **No number appears on screen unless it is in facts.md;**
   - an **Insider references** list: the moments, nicknames, catchphrases and memes fans use, with where
     they come from (Reddit, X, fan wikis). Pick 2–4 that will land and build scenes around them.
2. **Concept.** Pick:
   - one *spine*: a visual motif that carries through the film (LeBron: the ball and the scoring line);
   - 5–7 chapters, each with its own visual idea: a chart, a diagram, a tally, typography, a pixel sprite;
   - a signal colour for the subject (plus at most one accent) on a dark ink background.
3. **Timeline.** 120 BPM: a beat is 0.5 s, a bar is 2 s. Cuts land on bars, hits land on beats.
   Keep one `IMPACTS` list that drives the camera shake/flash *and* the hit sounds.
4. **Build** `films/<slug>/film.js` (+ `index.html`, copied from `films/lebron`). Reuse `render/kit.js`
   and `render/player.js`, and don't fork them. `film.js` exports `{ width, height, duration, fonts, draw, score }`.
   - `draw(ctx, t)` must be a pure function of `t` (use `hash`/`rng`, never `Math.random`).
   - `score(ac)` synthesizes the soundtrack with the kit's instruments. No audio files.
   - The haoli.ai watermark is added by the player; don't draw your own.
5. **Make the music theirs**, not a generic beat (see `films/lebron/film.js` → score):
   - **Data melody**: turn the subject's key series (points per season, goals per year…) into notes,
     and play each one the moment its data point appears on screen.
   - **Places**: change instruments and percussion with the subject's clubs, cities or eras,
     using genre and regional sounds.
   - **Motif**: a 4–7 note theme built from their numbers (shirt number → scale degrees), and bring it
     back in every chapter on a different instrument.
6. **Pixel sprites** (`drawSprite` in the kit): the subject as a stylised pixel figure, from signature traits
   (hair, headband, number) or an iconic pose or celebration. Draw them from scratch; don't trace a photo.
7. **Self-review loop.** `bun render/render.ts sheet films/<slug> --count 36`, then look at the sheet.
   Fix overlaps, overflow, empty frames and unreadable text. Zoom in with `stills --at ...` on busy moments.
   Repeat until clean.
8. **Render.** `bun render/render.ts video films/<slug>` → `out/<slug>.mp4`.
9. **Package.** Write `films/<slug>/post.md`:
   - titles for YouTube, X and Bilibili/Douyin (EN + 中文) that lead with the subject, not the tech;
   - a description ending with "Made with one prompt in Claude Code · github.com/Leo309/claude-prompt-films";
   - hashtags;
   - a reminder to tick the platform's AI-content label.

   Report the MP4 path, length and size.

## Hard rules: platform upload limits

These get videos blocked or demonetized, so never break them:
- **No copyrighted audio or footage.** No real songs, broadcast commentary, game footage or photos.
  Content ID and rights-holder matching catch them. Everything is drawn and synthesized.
- **Label AI content** where the platform asks. Chinese platforms require the AI-generated declaration.
- **No fabricated quotes** presented as something a real person said.
- **No full-screen flashes faster than 3 per second** (photosensitivity).

## Creative calls: effect first

- Stylised likenesses (pixel sprites, caricature) are fine.
- Team colours, names and iconography are fine when they make a scene land. Leagues sometimes file claims
  over logos; if a video gets claimed, swap that asset and re-render (it's one function).
- Memes should be affectionate. Roast the moment, not the person's tragedy.
- Keep the end card line "A fan-made tribute. Not affiliated with …": it's cheap and it heads off claims.

## Constraints of this machine

- Disk is tight: never write PNG frame sequences. `video` streams frames straight into ffmpeg.
- Fonts: Anton (display) and IBM Plex Mono (captions), loaded by `render/player.css`.
  Stick to Latin-1 characters plus – — · ’ “ ”; other glyphs may be missing.
