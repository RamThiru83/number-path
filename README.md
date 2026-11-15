# Number Path

A private family maths path that sequences the official Numberblocks YouTube episodes into learning stages,
with a short talk-and-do activity and a grown-up check for each unit.

- 5 stages (0–5, 6–10, 11–20, 21–50, 51–100+), 30 core units, 6 bridge units for gaps (rupees, time, sorting, measuring, hundreds, home languages)
- Units mapped to NCF Foundational Stage 2022 (CG-8) and NIPUN Bharat numeracy Lakshyas
- Spaced review (2 days, 1 week, 3 weeks) and a mixed-review nudge every 4th session
- Progress synced with Supabase (schema `pathway`, row-level security, family sign-in by email link); works offline and syncs later

## Files
- `index.html`, `css/`, `js/` — static app, no build step
- `data/content.json` — generated; edit `tools/content-src.js` (units), `tools/catalogue.js` (titles), `tools/ids.json` (YouTube IDs), then run `node tools/content-src.js`
- `sw.js` — offline cache for the app shell

Videos play from the official Numberblocks channel via the YouTube privacy-enhanced embed. Not affiliated with Alphablocks Ltd or the BBC.
