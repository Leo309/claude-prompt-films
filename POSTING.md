# Posting playbook: 90 SECONDS

Per-film copy lives in `films/<slug>/post.md` and the dates in `plan/CALENDAR.md`. The reasoning behind both is in
`plan/STRATEGY.md`. This file covers how to post on each platform.

## The rule (2026-09-30)

- **The screen shows the player.** The 9:16 headline is the player and the number. EP01 LeBron keeps
  "I ASKED AI FOR / A LEBRON FILM." as a control, so the two kinds of hook can be compared.
- **The captions carry one AI line, adjusted per platform.** AI is the hook, never the subject: no "how it's made",
  no code and no links.

| Platform | AI in the copy | How |
|---|---|---|
| TikTok | first line | "I asked AI to sum up {player}'s career in 90 seconds." Everything after that is about the player. |
| YouTube Shorts | title | "I Asked AI to Sum Up {Player} in 90 Seconds {emoji}" |
| Instagram Reels | none | Only the player and the moment. Meta favours human-made content and counts DM shares most. |
| YouTube 16:9 (optional) | title | Same as the Short. |
| Later: Bilibili, X | strong | "一句话让 AI 做了…" / "I gave AI one sentence…": there, the AI angle is the draw. |

- **Pinned comment on TikTok and Shorts: "What did the AI miss? 👇"** Fans love to correct, and every correction is a comment.
- **The loop.** Every full film ends on "WHO’S NEXT? / COMMENT A PLAYER". The most-named player becomes a next episode;
  post it as a reply to that comment (TikTok: reply with video).
- **Write "AI", not "Claude".** When someone asks which AI, answer "Claude" in the comments.
- **AI label: on** wherever the platform has one (see the upload checklist).

## TikTok

- **The algorithm rewards** the 2-second hold, watch time, completion and comments. A large share of views comes from search.
- **Caption:** the first line carries a searchable phrase as well as the AI line ("…his last game for Argentina is Oct 6").
- **Hashtags:** 3–5: the player, the team or league, the sport, `#90seconds`, `#ai`.
- **First hour:** reply to comments. Answer "who's next" comments with a video reply.
- **Account and tools:** keep a personal or creator account (Creator Rewards excludes business accounts). Post from TikTok Studio on
  desktop, which handles the cover, the AI label and scheduling.

## YouTube Shorts

- **The algorithm rewards** watch time. Shorts keep collecting views for weeks, unlike TikTok's first 48 hours.
- **Title:** the formula above. The description is fan detail, and its last line reads `Made with AI · fan-made`
  (a clip's: `Full 90 seconds on my channel · Made with AI · fan-made`). No list of who it isn't affiliated with and
  no stats date: viewers don't open Shorts descriptions, a disclaimer carries little weight, and a clip whose numbers
  change gets re-rendered anyway.
- **The 16:9 upload** goes in as the Short's *related video*, and both go in the "90 SECONDS" playlist.
- **Cover:** in YouTube Studio on desktop, Thumbnail → Upload file → `out/<slug>/cover-<name>.jpg`. "Select from
  video" only offers three frames YouTube picks itself, usually not the payoff.

## Instagram Reels (+ Facebook)

- **The algorithm rewards** DM sends (the strongest signal for reaching non-followers), watch time, replays and originality.
- **Caption:** the player only, with one optional tag: the player's own account. Never mass-tag.
- **Trial Reels** show a Reel to non-followers first, so use them to test a hook before it reaches followers. They can be
  scheduled since February 2026.
- **Collab posts:** invite a big fan page as a collaborator so the Reel shows on both profiles. DM them first. This works
  far better than @-ing the star.
- **The owner's own main account:** on the first one or two Reels, invite it as a collaborator (Tag people → Invite
  collaborator, then accept from the main account). Its followers become the new account's first audience, and the post
  shows both names. After that, repost from the main account now and then (share → Repost) or share to its Story.
  Never re-upload the file there: the duplicate gets both posts down-ranked and splits the views.
- **Facebook:** switch on "Also share to Facebook".
- **Post from the phone app** (AI label, cover and Facebook sharing are most complete there). Move the MP4 by AirDrop;
  WeChat and email recompress it.

## Later

- **X:** the first post is fan-only, with 1–2 hashtags. Reply with the video under the big posts about the game (once per
  thread), and put links in replies.
- **Bilibili:** post the 16:9 file with the title "我让AI用90秒总结了{主题}…" and declare AI-generated content.
- **小红书:** a 3:4 cover with big Chinese text, and declare AI.
- **抖音:** it needs Chinese on-screen text first, which means adding a CJK font to the renderer.

## Every upload

1. **Upload the original MP4** from `out/<slug>/`. Never re-upload a file downloaded from another platform, because the
   other app's watermark gets it down-ranked.
2. **AI label:** TikTok "AI-generated content" on; Instagram "AI info" on. YouTube asks "AI use" (2026): was AI used to
   make a real person say or do something they didn't, alter footage of a real event or place, generate a realistic
   scene that didn't happen, or create music that is the main focus of the video? A clip is none of these (pixel
   animation of real events, music under the picture), so answer No; the description says "Made with AI". A film whose
   music is its point (LeBron's: the beat is his career) is the fourth case: decide before posting it.
3. **Cover:** `out/<slug>/cover-<name>.jpg`, the cold open's payoff (`post.md` names the moment). On YouTube upload it
   as the thumbnail; on TikTok and Reels pick the same frame.
4. **Hashtags:** 3–5.
5. **Pin the comment** from `post.md`.
6. **Reply to comments in the first hour.**
7. **Log it** in `plan/LOG.md`: the link right away, the numbers at 24 h and 72 h.

## One file for all three apps

The 9:16 layout keeps everything that must be read inside the area that TikTok, Reels and Shorts all leave
uncovered: x 60–920, y 240–1500 on the 1080×1920 frame (`SAFE` in `render/vertical.js`). Post the same file
everywhere. Don't add the apps' own text stickers near the bottom or the right edge.

## Cadence (clip-first since 4 October)

- **The full film** goes up once, before its clips, on TikTok, Shorts and Reels. Pin it on the TikTok profile:
  it is the landing page. The first three posts showed that a 90 s film doesn't travel on its own (2.1 s average
  watch on TikTok), while a 19 s clip did (636 views on Shorts).
- **Clips carry the account:** two a day. Each one ends on "FULL 90 SECONDS / ON MY PROFILE".
- **Volume:** 2 posts per platform per day. Beyond 3 a day, each post does worse.
- **Time:** 3–7 pm Pacific (6–10 pm Eastern).
- **News beats the queue.** Before a game, post the full film 3–5 days ahead and a clip on game day. After big news,
  change the number in `film.js`, re-render (about 20 minutes) and post the same day.

## Scheduling from Claude in Chrome (6 October)

Claude can schedule on all three sites from the owner's Chrome (the Claude in Chrome extension, already signed in).
Finish producing the whole batch first (files, covers, `post.md` copy), then do one platform at a time: TikTok,
then Instagram, then YouTube Shorts. Every site has its own quirks, and switching back and forth costs more than
it saves.

- **Keep that Chrome window on screen.** When it is minimized or completely covered, Chrome treats the page as
  hidden: it doesn't load video there, doesn't run animation frames, and screenshots show stale frames. Instagram then
  can't read the video and spins forever; TikTok's caption editor and date/time pickers don't commit. YouTube Studio
  works either way. Check with `document.visibilityState`, and trust what the page reports over a screenshot.
- **If the window has to stay hidden:** play a 2-pixel silent stream in the page first (a canvas `captureStream()` in a
  muted video). Chrome then loads media in that page, and Instagram's uploader works. A screenshot makes the page draw
  one frame, which lets dialogs finish opening or closing (YouTube's upload dialog stays `display: none` until then):
  take one after every step that opens or closes something. TikTok still needs the window on screen.
- **Files over 10 MB** (the full films): the upload tool takes at most 10 MB per call. Split the MP4 into three parts,
  load them into helper file inputs on the page, join them there (`new File([a, b, c])`), check the size and SHA-256
  against the original, then hand the file to the site's own file input with a `change` event. Done for LeBron's full
  film on YouTube and Instagram.
- **YouTube Studio:** pick the schedule date on the calendar (a typed date doesn't stick); the time field takes typing
  ("3:00 PM", then Return). Read times with a regex: the page puts a narrow no-break space before "PM".
- **Instagram web:** Create → Post → Crop: Original (it defaults to a square crop) → Next → Cover photo: Select from
  computer → Next → caption, Add AI label, Schedule content → date on the calendar, then the Hours, Minutes and AM/PM
  boxes (focus each one, then type).
- **TikTok Studio:** up to 10 days ahead, and a scheduled post's caption can't be fixed afterwards, so type the caption
  in a visible window. Writing the editor's state from a script changes what the box shows, not what gets posted
  (kareem went in as "clip-kareem-9x16" that way).
- **Pinned comments** are posted once a post is live. YouTube: the Short's comment panel, ⋮ → Pin. Instagram web can
  post a comment but has no Pin (only Delete), so pin it from the phone app. TikTok: from the video page, but the
  video page threw a slider captcha after a day of automated uploads; Claude stops there and leaves it for the owner.
- **Reels AI label on scheduled posts:** the web "edit scheduled content" dialog always shows Add AI label switched off,
  even right after saving it on. A Reel posted straight away does show "AI content". Check a scheduled Reel once it is
  live and add the label in the app if it is missing.
