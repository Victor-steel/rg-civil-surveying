# Rules for any AI tool editing this site (Antigravity, Claude, Cursor, Grok)

Website: one-page site plus four service pages for **RG Civil Engineering and Surveying Ltd**.
Owner: Luke. He is not a software engineer: explain changes in plain words, make small changes one at a time, and don't restyle anything he didn't ask about.

## One folder, shared by every tool

- THIS folder (`~/Projects/obsidian-brain/mocks/rg-civil-surveying`) is the only working copy. It is the folder the preview at http://127.0.0.1:4190 runs from. Antigravity, Claude, Cursor and Grok all edit these same files.
- The folders in `~/Projects/ai-model-academy` called `rg-civil-surveying-mock`, `rg-civil-surveying-mock-antigravity-pack`, `rg-civil-surveying-mock-claude-pack`, `rg-civil-surveying-mock-cursor-export` and `rg-civil-surveying-mock-grok-pack` are OLD copies. Never edit or copy from them.
- Another tool may have changed the files since you last looked. Before every change, read `CHANGELOG.md` (newest at the top) and re-read the files you are about to edit. Never work from memory of an earlier version.

## Stay in sync with the other tools (every tool, every time)

1. **Start from the folder as it is now.** At the start of every request, read the top 5 lines of `CHANGELOG.md` and look at which files changed most recently (`ls -lt`). Then read the files you will touch. Do this again if more than a few minutes have passed.
2. **Never save a file from an older copy.** If you made a working copy elsewhere (a zip, an export, a sandbox), re-copy the current files from this folder before you edit, and check the file has not changed again before you save it back.
3. **Keep other tools' work.** If another tool added or removed something (for example Antigravity removing unconfirmed claims), build on that. Never put back what it removed unless Luke asks.
4. **Leave a note.** Add a CHANGELOG line for every change: date, your tool name, what changed, which files, and where the backup is.
5. **Back up before you change.** Copy the files you will change into a folder named `_backup-before-<what>-<date>/` first.

## After every change

1. Copy each changed file into `dist/` at the same path (for example `services/x.html` to `dist/services/x.html`).
2. Add one line to the top of the list in `CHANGELOG.md`: date, your tool name, what you changed.
3. Check the page at about 390, 768 and 1440 px wide, with no sideways scrolling.

## How the site is built

- Plain HTML, CSS and JavaScript. No build step, no frameworks, no installs.
- `index.html`: home page. `services/*.html`: one page per service tile. `styles.css` and `app.js` are shared by all five pages.
- The header, footer and phone bar are copied into all five HTML files. If you change one, change all five.
- Contact details live in `siteConfig` at the top of `app.js` and in the HTML. Change both.
- Design notes: `DESIGN.md`. Project notes and launch checklist: `README.md`.

## Facts you must not change without asking Luke

- RG Civil Engineering and Surveying Ltd; Ryan Johnston, Engineer / Director
- 07956 996 424 (`tel:+447956996424`); ryan@rgcivilengineering.co.uk
- Instagram: https://www.instagram.com/rgcivilengineeringsurveying/
- Territory: Cumbria, Northumberland, south-west Scotland and beyond
- Company number 15923449; registered office 67 Moorhouse Road, Carlisle, CA2 7LU

## Welcome Screen & Hero River Photo (Locked per Luke, 15–16 Nov 2026)

- **Desktop Welcome Screen (LOCKED — never change unless Luke explicitly asks):** Keep the original desktop widescreen welcome screen untouched (`assets/video/cumbria-river-survey-4k.mp4`, existing 3D cutout RG compass, headings, and framing). Never alter desktop layout, framing, or background when adjusting mobile.
- **Mobile / Portrait Welcome Screen:** Phones and upright portrait screens (`(max-width: 768px), (orientation: portrait) and (max-width: 1024px)`) use the dedicated 9:16 flowing river loop (`assets/video/cumbria-river-survey-mobile.mp4`) so the tripod remains visible on the right gravel bank.
- The river survey photograph must ALWAYS be the unmanned yellow tripod setup (`assets/generated/cumbria-river-survey-no-man.jpg` on desktop/hero, `assets/generated/cumbria-river-survey-mobile-clean.jpg` on mobile — zero people in frame).
- Never replace it with photos showing people, surveyors, or high-vis workers.
- When displayed as a welcome screen or visual, keep the photo clean: no heavy writing, title cards, or buttons blocking or covering the instrument.


## Honesty and safety

- Never invent qualifications, accreditations, reviews, clients, project names, statistics, awards, prices, guarantees or emergency cover. If something is missing, leave a clearly marked placeholder and tell Luke.
- Images come only from `assets/`. The only outside call is the Google Fonts link.
- The enquiry form is a preview: it opens an email in the visitor's own email app and must not send or store anything remotely.
- Keep `<meta name="robots" content="noindex, nofollow">` on every page.
- Never publish, upload or deploy anything. Luke does that himself.

## Preview

From this folder: `python3 -m http.server 4190`, then open http://127.0.0.1:4190/
