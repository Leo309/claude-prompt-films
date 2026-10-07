# claude-prompt-films: rules for every session

One prompt → a 90-second code-rendered film about an athlete, posted as the **90 SECONDS** series by haoli.ai.
Right now the goal is reach on TikTok, YouTube Shorts and Instagram Reels.

## Read first

- `plan/STRATEGY.md`: why we work this way: positioning, where AI goes in the copy, what to measure. (Chinese)
- `plan/CALENDAR.md`: what gets posted when, and the news pegs to ride. (Chinese)
- `plan/BACKLOG.md`: which episode is next, and why. (Chinese)
- `PROMO_PROMPT.md`: how to make an episode. `PIXEL_STYLE.md`: the 16-bit game look every new episode uses from
  EP04 on (EP05 Ohtani is the last one in the old style). `POSTING.md`: how to post one, platform by platform.

## The product

- An episode is a 90.0 s film in 16:9 and 9:16 (`out/<slug>/full-*.mp4`) plus 3–4 clips of 14–23 s
  (`out/<slug>/clip-*.mp4`). `out/` is not in git.
- Every full film has a `coldOpen`: bar 1 plays the payoff, then rewinds into the film (`render/coldopen.js`).
  The 9:16 version ends on a "WHO’S NEXT? / COMMENT A PLAYER" card in the header, in place of the hook.
- Every clip opens on its own `coldOpen` too (since 4 October): the clip's best moment plays in the bar before the
  clip, then rewinds into it, so a clip runs one bar longer than its `from`–`to`. Check the first and last 3 seconds
  of every clip: after the rewind it lands on big type or a running count, never a dark chapter opening, and it ends
  on its payoff, not on credits or the next chapter.
- One 9:16 layout serves TikTok, Reels and Shorts. Anything that must be read stays inside `SAFE` in
  `render/vertical.js` (x 60–920, y 240–1500). Run `bun render/render.ts reframe films/<slug>` before any 9:16 render.
- On-screen copy is about the player. The captions carry one AI line: the TikTok first line and the Shorts title
  say "I asked AI to sum up … in 90 seconds", and Reels captions don't mention AI. Never "how it's made".
- Clip-first since 4 October: the full film goes up once and is pinned as the landing page, then two clips a day.
  A news peg beats the queue. Produce a whole batch first, then upload it one platform at a time
  (TikTok, then Instagram, then YouTube Shorts); never hop between platforms for a single clip.
- When a new episode is done: add it to README.md (Episodes), `plan/BACKLOG.md` and `plan/CALENDAR.md`.

## Git (several sessions share this repo)

- Stage explicit paths only. Never `git add -A` or `git add .`: other sessions leave unfinished work in the tree.
- Run `git status` before committing and `git show --stat HEAD` before pushing.
- Conventional commits in English, with no `Co-Authored-By` line. `.claude/` stays ignored.

## This machine

- Disk is tight and `~/Documents` syncs to iCloud, which offloads big files. Never write PNG frame sequences.
- Fonts: Anton and IBM Plex Mono. Use Latin-1 plus – — · ’ “ ” only.
- One episode costs about 6% of the weekly limit and 40% of a 5-hour window. Use a fresh session per episode.
- `bun test` runs the unit tests (`render/*.test.js`).
