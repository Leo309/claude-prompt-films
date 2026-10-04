# Film recipe

This is the brief behind `/promo <keyword>`. One keyword in, one finished MP4 (and a ready-to-post caption) out.

## The brief

> Make a promo film about **{keyword}**. 90 seconds. Rich in content, not abstract:
> real numbers, dates and moments. Show why it is great. The visuals should hit hard. You know what I mean.

That's the whole creative direction. Everything below is how to deliver it.

**The series is 90 SECONDS.** Every film is exactly 90 s: 45 bars at 120 BPM, 48 bars at 128 BPM. A countdown to
00:00 and the series tag are added by the player, so land the last beat on 90.0 and keep the end card inside it.

**Effect first.** The film is for the fans of the subject, and it has to feel made *by* one:
- the moments they'd pick themselves;
- the numbers they quote;
- the in-jokes and memes they'll catch on first watch (football, NFL, F1, esports, any niche).

People who don't know the niche should still feel the energy. Nothing on screen is about how the film was made.
The captions carry one AI line, adjusted per platform: the TikTok first line and the Shorts title say "I asked AI to
sum up … in 90 seconds", and Reels captions don't mention AI (see `POSTING.md`).

## Workflow

1. **Research first.** Search the web for the subject; your training data may be stale. Check anything
   recent: current team, latest records, retirement news. Write `films/<slug>/facts.md`:
   - a table of *on screen · value · source link*, plus an "as of" date, with key numbers cross-checked
     against two sources. **No number appears on screen unless it is in facts.md;**
   - an **Insider references** list: the moments, nicknames, catchphrases and memes fans use, with where
     they come from (Reddit, X, fan wikis). Pick 2–4 that will land and build scenes around them.
2. **Concept.** Pick the following, and make each one **different from every earlier episode**. Platforms
   demonetize look-alike, mass-produced videos, and repeats bore the audience anyway. Read the Episodes table in
   README.md first.
   - one *spine*: a visual motif that carries through the film (LeBron: the scoring line; Ronaldo: the wall of 1,000);
   - 5–7 chapters, each with its own visual idea: a chart, a diagram, a tally, typography, a pixel sprite;
   - a signal colour for the subject (plus at most one accent) on a dark ink background.
3. **Timeline.** Pick a tempo and genre that fit the subject (EP01: 120 BPM trap; EP02: 128 BPM house). Write the
   timeline in bars (`bar(n)`). Cuts land on bars, hits land on beats. Keep one `IMPACTS` list that drives the
   camera shake/flash *and* the hit sounds.
4. **Build** `films/<slug>/film.js` (+ `index.html`, copied from `films/lebron`). Reuse `render/kit.js`
   and `render/player.js`, and don't fork them. `film.js` exports `{ width, height, duration, fonts, draw, score }`.
   - `draw(ctx, t)` must be a pure function of `t` (use `hash`/`rng`, never `Math.random`).
   - `score(ac)` synthesizes the soundtrack with the kit's instruments. No audio files.
   - The haoli.ai watermark is added by the player; don't draw your own.
   - Also export `title`, `episode` (the next number in the Episodes table), `vertical: { hook: [2 short lines], sub }`
     and `chapters: [[t, "LABEL"], ...]`. The 9:16 version is built from these (`render/vertical.js`),
     so the hook has to work as a phone headline on its own.
   - Export `cuts: [{ name, from, to, hook: [2 lines], sub, coldOpen }, ...]`: 3–4 clips of 14–23 s, each a complete
     moment with its own headline. `bun render/render.ts cuts films/<slug>` renders them for Shorts, TikTok and Reels,
     ending on a card that points to the full film. Give each clip its own `coldOpen` (same shape as the film's, below)
     on the clip's best moment: it plays in the bar before `from`, so the clip runs one bar longer. Pick big type or a
     big hit, not a small figure, and a moment that stays on screen for the whole bar (no fade, no next chapter).
     Start the clip on a strong beat (big type, a running count), never on a dark chapter opening: viewers decide in
     the first 3 seconds, and the cold open only covers the first 1.4. End it on its payoff, not on credits or the
     next chapter. Start `sub` with the player's name: pixel players have no faces.
   - Export `coldOpen: { from, length }`. Feeds decide in a second or two, so bar 1 of the full film plays the
     payoff: set `from` 0.02 s before the film's biggest hit, so the first sound is that hit, and set `length` to one bar.
     The player rewinds it into the film (`render/coldopen.js`), and the film stays exactly 90 s.
   - Optionally export `vertical.cta: [big, small]` to replace the 9:16 end card's "WHO’S NEXT?" / "COMMENT A PLAYER".
     For VS episodes, use "WHO’S YOUR GOAT?" / "COMMENT BELOW".
   - **Phone-legible text:** anything meant to be read must be at least 72 px on the 1920×1080 canvas. The 9:16
     frame shows a wide chapter at 56 % (a zoomed one at up to 83 %), so smaller text is texture.
   - Compose each chapter so that its key content fits in about two thirds of the width: the 9:16 reframe then zooms
     it in. A chapter whose content has to span the frame (a chart that grows across it) goes in
     `vertical.wide: [chapter start, ...]` and stays at full width.
   - Headlines go in the 9:16 top band and are about the player and the number, never the AI.
5. **Make the music theirs**, not a generic beat (see `films/lebron/film.js` → score):
   - **Data melody**: turn the subject's key series (points per season, goals per year…) into notes,
     and play each one the moment its data point appears on screen.
   - **Places**: change instruments and percussion with the subject's clubs, cities or eras,
     using genre and regional sounds.
   - **Motif**: a 4–7 note theme built from their numbers (shirt number → scale degrees), and bring it
     back in every chapter on a different instrument.
6. **Pixel sprites**: the subject as a stylised pixel figure. `figure(pose, look)` in the kit builds one from
   joint positions and a look (hair, beard, headband, number), and `drawSprite` draws it. Aim for signature traits
   and the iconic pose or celebration. Draw them from scratch; don't trace a photo.
7. **Self-review loop.** `bun render/render.ts sheet films/<slug> --count 36`, then look at the sheet
   (`out/<slug>/work/sheet.png`). Fix overlaps, overflow, empty frames and unreadable text. Zoom in with
   `stills --at ...` on busy moments. In the 9:16 frame, check the cold open (0 s to one bar) and the end card (last 3 s), and
   each clip's first and last 3 seconds (`stills --format 9x16 --cut <name>`, from one bar before the clip's `from`).
   Repeat until clean.
8. **Render.** First `bun render/render.ts reframe films/<slug>`: it measures each chapter and writes
   `films/<slug>/reframe.json` (commit it), which the 9:16 frame uses to zoom per chapter. Then check the vertical frame
   with `sheet films/<slug> --format 9x16`, with one still per chapter. Nothing that must be read may leave the safe zone
   (x 60–920, y 240–1500); if a chapter crops something important, add it to `vertical.wide` and reframe again.
   Then `bun render/render.ts video films/<slug>` → `out/<slug>/full-16x9.mp4` and `out/<slug>/full-9x16.mp4`, and
   `cuts films/<slug>` for the clips (`out/<slug>/clip-<name>-9x16.mp4`).
9. **Package.** Write `films/<slug>/post.md` in the same layout as `films/messi/post.md` (rules in `POSTING.md`):
   - a header with the files, the cover-frame time (usually inside the cold open) and the subject's next news peg;
   - **TikTok:** the caption opens with "I asked AI to sum up {player}'s career in 90 seconds." and continues about
     the player, including a phrase people search for. Hashtags: the player, the team or league, the sport,
     `#90seconds`, `#ai`. Pinned comment: "What did the AI miss? 👇";
   - **YouTube Shorts:** the title "I Asked AI to Sum Up {Player} in 90 Seconds {emoji}", then a fan-detail description
     ending "Made with AI · fan-made, not affiliated with … · stats as of …". Pin the same comment;
   - **Instagram Reels:** the player and the moment only, with no AI, an optional tag of the player's own account,
     and a pinned question fans will argue about;
   - a clips table (file, length, caption). Clip captions are about the moment; on TikTok and Shorts the pinned
     comment points to the full film;
   - under "Later", one Chinese title for Bilibili: "我让AI用90秒总结了{主题}：…".

   Dates don't go in `post.md`: add the posts to `plan/CALENDAR.md`, and add the episode to `plan/BACKLOG.md` and
   the Episodes table in README.md. Report the MP4 paths, length and size.

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
