# Posting kit — Lionel Messi · 90 SECONDS EP03

Files: `out/messi-16x9.mp4` (YouTube, Bilibili, X) · `out/messi-9x16.mp4` (Shorts, TikTok, Reels, 小红书, Douyin) ·
clips: `out/messi-<napkin|rings|comeback|goodbye>-9x16.mp4` · Watermark: haoli.ai · **Tick the platform's AI-content label.**

**The news peg:** his last game for Argentina is **6 October 2026** (v Benin, Estadio Monumental).
Upload the original MP4s to every platform (never a file downloaded from another platform, since the watermark gets it flagged as a repost).

**If he scores on 6 October:** add the goal to `ARGENTINA` in `film.js` (and to the 2026 Miami row for club goals), then run
`bun render/render.ts video films/messi` and `bun render/render.ts cuts films/messi`. The assert in `film.js` will remind
you to update the expected total too.

## Suggested schedule

| Day | Post |
|---|---|
| 30 Sep | Full film everywhere (TikTok, Reels, Shorts: 9:16 · X, YouTube: 16:9). Pin it on TikTok. |
| 1 Oct | Clip `napkin` (19 s): "TOO SMALL AT 10. SIGNED ON A NAPKIN." |
| 3 Oct | Clip `rings` (24 s): "931 GOALS. ONE RING PER SEASON." |
| 5 Oct | Clip `comeback` (19 s): "HE QUIT IN 2016. THEN HE WON IT ALL." |
| 6 Oct, before kick-off | Clip `goodbye` (24 s) + repost the full film on X: "Tonight." |

## Titles

- **YouTube:** Lionel Messi in 90 Seconds: Too Small at 10, 931 Goals Later
- **X:** At 10 he was diagnosed with a growth hormone deficiency. At 13, Barcelona signed him on a paper napkin. 931 goals and 46 trophies later, he plays his last game for Argentina on October 6. 90 seconds, every frame and every note written in code.
- **TikTok / Reels:** Too small at 10. 931 goals later. His last game for Argentina is Oct 6.
- **Bilibili:** 90秒看完梅西｜10岁被诊断生长激素缺乏，13岁在一张餐巾纸上签约巴萨，931球、46座冠军（BGM是用他每个赛季的进球数写的探戈）
- **Douyin / 小红书:** 90秒看完梅西｜"太矮了"的孩子，踢出了931球和46座冠军，10月6日为阿根廷踢最后一场

## Description (EN)

At 10, in Rosario, he was diagnosed with a growth hormone deficiency. At 13, Barcelona's sporting director wrote
his first contract on a paper napkin ("despite some opinions against"). It sold for £762,400 in 2024.

931 goals since, drawn as the rings of a tree: one ring per season, the ring's size set by that season's goals
(73 in 2011–12), wrapped in a bark of 125 for Argentina. The Bernabéu shirt, three lost finals, "¿Qué mirás, bobo?",
Lusail, and 46 trophies stacked next to a 1.70 m man.

The music is an electrotango built from his numbers: every season's goals become a note, played in the sound of its
city (a Catalan pipe in Barcelona, a musette accordion in Paris, a marimba over a dembow in Miami), and a "10" motif
that leaps up a tenth and comes home an octave higher. The crowd chanting his name is synthesized too.

Fan-made tribute, not affiliated with Lionel Messi, the AFA or any club. Stats as of 28 September 2026.

Made with one prompt in Claude Code. Every frame and every sound is code: github.com/Leo309/claude-prompt-films

#Messi #LionelMessi #Argentina #LastDance #GOAT #InterMiami #FCBarcelona #ClaudeCode #AIVideo

## 简介（中文）

10岁那年，在罗萨里奥，他被诊断出生长激素缺乏。13岁，巴萨的技术总监在一张餐巾纸上写下了他的第一份合同——"尽管有一些反对意见"。这张餐巾纸在2024年拍出了76.24万英镑。

之后的931个进球，画成了一棵树的年轮：每个赛季一圈，圈的大小由当季进球数决定（2011–12赛季73球），最外层是阿根廷的125球树皮。伯纳乌举球衣、三次决赛失利、"¿Qué mirás, bobo?"、卢赛尔，最后是46座奖杯叠在一个1.70米的人身边。

配乐是一首用他的数据写的电子探戈：每个赛季的进球数变成一个音符，音色随城市变化（巴塞罗那的加泰罗尼亚笛子、巴黎的手风琴、迈阿密的马林巴和 dembow 节奏），还有一个"10号"动机：向上跳一个十度，再回到高八度的主音。全场齐喊"梅西"的声音也是合成的。

粉丝向致敬作品，与梅西本人、阿根廷足协及任何俱乐部无关。数据截至2026年9月28日。

一句提示词在 Claude Code 里生成，每一帧画面、每一个音符都是代码：github.com/Leo309/claude-prompt-films

#梅西 #Messi #阿根廷 #最后一舞 #AI视频 #ClaudeCode

## Clip captions

- **napkin:** Too small at 10. Signed on a napkin at 13. (Full 90 seconds on my profile.)
- **rings:** Every ring is one season of Lionel Messi goals. 73 in 2011–12 is the thick one.
- **comeback:** Three finals lost. He quit in 2016. Then: 2021, 2022, 2024.
- **goodbye:** 6 October, Monumental. One last time.

## Pinned comment (for the tech crowd)

The whole film is a program. The rings are one polygon per season with area proportional to goals, the napkin is
typed in a ballpoint blue, the tower is 46 pixel cups, and the tango is Web Audio synthesis (the bandoneón is detuned
reeds through a filter; the crowd "ME-SSI" is formant-filtered sawtooth voices). If he scores on October 6, I change
one number and re-render. Code: github.com/Leo309/claude-prompt-films
