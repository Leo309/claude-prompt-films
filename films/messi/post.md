# Posting kit — Lionel Messi · 90 SECONDS EP03

Files: `out/messi/full-9x16.mp4` (TikTok, Shorts, Reels) · `out/messi/full-16x9.mp4` (YouTube) ·
clips `out/messi/clip-<napkin|rings|comeback|goodbye>-9x16.mp4`
Cover frame: 1.0 s (the cold open: Lusail, WORLD CHAMPION) · AI label: on · How to post: `POSTING.md` ·
Dates: `plan/CALENDAR.md`
**News peg: his last game for Argentina, Tue 6 October 2026, v Benin at the Monumental.** Post before it.

## The angle

**Too small at 10, and his last game for Argentina is October 6.** In between: 931 goals grown like the rings of a tree.

## TikTok (9:16)

**Caption**
```
I asked AI to sum up Messi's career in 90 seconds 🐐🇦🇷 Too small at 10. 931 goals and 46 trophies later, his last game for Argentina is Oct 6.
#messi #argentina #football #90seconds #ai
```
**Pinned comment**
```
What did the AI miss? 👇
```

## YouTube Shorts (9:16)

**Title**
```
I Asked AI to Sum Up Lionel Messi in 90 Seconds 🐐
```
**Description**
```
Too small at 10, signed on a paper napkin at 13. 931 goals drawn as the rings of a tree, one ring per season (the thick one is 73, in 2011–12), and a tango built from his numbers.
The Bernabéu shirt, ¿Qué mirás, bobo?, Lusail. His last game for Argentina is October 6.
Made with AI · fan-made, not affiliated with Lionel Messi, the AFA or any club · stats as of 28 Sept 2026.
#Messi #Argentina #Shorts
```
**Pinned comment**
```
What did the AI miss? 👇
```

## Instagram Reels (9:16)

**Caption**
```
Too small at 10. One last game for Argentina on October 6. 🔊 Sound on: it's a tango built from his goals, one note per season.

The napkin. The Bernabéu shirt. ¿Qué mirás, bobo? Lusail.

#messi #leomessi #argentina #football #90seconds
```
**Pinned comment**
```
Too small at 10 → 46 trophies. Which moment hits hardest? 👇
```
**Tag (optional):** @leomessi

## YouTube (16:9, optional)

Same title and description; add it to the "90 SECONDS" playlist and set it as the Short's related video.

## Clips (9:16, each opens on its best moment and ends on "FULL 90 SECONDS / ON MY PROFILE")

| File | Length | Caption (TikTok, Reels) | Shorts title |
|---|---|---|---|
| `clip-napkin-9x16.mp4` | 19 s | Too small at 10. Signed on a napkin at 13. #messi #barcelona | Messi: Too Small at 10, Signed on a Napkin at 13 🐐 |
| `clip-rings-9x16.mp4` | 21 s | Every ring is one season of Messi goals. The thick one is 73, in 2011–12. #messi #fcbarcelona | Every Ring Is a Season of Messi Goals 🐐 |
| `clip-comeback-9x16.mp4` | 17 s | Three finals lost. He quit in 2016. Then: 2021, 2022, 2024. #messi #argentina | Messi Quit in 2016. Then He Won It All 🇦🇷 |
| `clip-goodbye-9x16.mp4` | 21 s | 6 October, Monumental. One last time. 🇦🇷 #messi #argentina | Messi's Last Game for Argentina: Oct 6 🇦🇷 |

Cover for every clip: the frame at 0.3 s, its cold open's payoff. The profile grid then reads as a row of payoffs.

Shorts description for a clip: its caption, then `Full 90 seconds on my channel · Made with AI · fan-made, not affiliated with Lionel Messi, the AFA or any club · stats as of 28 Sept 2026`. In YouTube Studio, set the full film's Short as the clip's related video.
Pinned comment on every clip: TikTok and Shorts `Full 90 seconds on my profile 👆 What did the AI miss?` ·
Reels `Full 90 seconds on my profile 👆`.
`goodbye` goes out on the morning of 6 October, before kick-off.

**If he scores on 6 October:** add the goal to `ARGENTINA` in `film.js` (and the expected total in its assert), put the
`goodbye` hook in the past tense, then run `bun render/render.ts video films/messi` and
`bun render/render.ts cuts films/messi`.

## Later

- B 站：我让AI用90秒总结了梅西：10岁被说太矮，931个进球长成了年轮 · 发布时勾选"AI 生成内容"。
- X: not yet.
