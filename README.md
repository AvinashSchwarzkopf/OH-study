# OH Study — sequence prediction from bags

A jsPsych 8 implementation of the design in
`OH Study design - Current version.csv`.

**The task.** A participant is handed a bag holding lettered items. Before each
item is drawn they predict which letter it will be; the item then comes out and
stays on screen. When the bag empties, the next bag begins — with every earlier
bag still visible above it, so the whole history is on screen. Each CSV row is
one pattern = four bags, run in order Bag1 → Bag4.

**Screens:** consent → How this works → Your job (Begin) → bags 1–4, with a
*Start bag n* button between them → strategy question → demographics →
completion code.

## Run it locally

```bash
python3 oh-study/server.py
```

Then open <http://localhost:8000>. Finished sessions are written to
`oh-study/data/<session_id>.csv`.

Useful during piloting:

- **`?dev=1` opens the developer panel** (top right): the rule currently
  running, a live position readout (`bag 2 · predicting draw 4 of 9`), that
  rule's four bag strings so you can check them against the CSV, and a
  **jump to rule** menu covering all 23 rows. Jumping skips consent and
  instructions so you land straight in Bag 1; tick *show intro screens* to
  keep them. Rules with a bad character are listed with a ⚠ and can still be
  opened this way even though they never reach a participant.
- `?pattern=alternating` — force a specific pattern (ids are in `js/patterns.js`)
- the end screen has a **Download my data** button

The panel is off unless you ask for it. Never launch a HIT with `dev=1` in the
URL (or `DEV_PANEL: true` in the config) — it lets people skip the consent
screen and pick their own condition.

## Files

| File | What it is |
| --- | --- |
| `index.html` | Page shell; loads everything else |
| `js/config.js` | **Every study knob lives here** — start here |
| `js/patterns.js` | Generated from the CSV. Do not hand-edit |
| `js/experiment.js` | Bag/draw trial construction and display |
| `js/main.js` | Consent, instructions, timeline assembly, data handoff |
| `build_patterns.py` | Regenerates `js/patterns.js` from the CSV |
| `js/dev.js` | The `?dev=1` panel. Not loaded into anything a participant sees |
| `server.py` | Local preview server + `/save` endpoint |
| `bundle.py` | Inlines everything into one portable `oh-study-standalone.html` |
| `lib/` | jsPsych 8.2.1, vendored so it runs offline |

When the CSV changes:

```bash
python3 oh-study/build_patterns.py
```

## Design decisions baked in (all in `js/config.js`)

- **One pattern per participant** (`PATTERNS_PER_PARTICIPANT: 1`). All 23 rows
  in one session is 715 draws, and having just learned "Alternating" changes how
  a person approaches "Grow", so the default is between-subjects. Raise the
  number if you want within-subject data and accept the carry-over.
- **A prediction on every draw**, including the first draw of Bag 1 where there
  is no information yet (`ASK_ON_FIRST_DRAW`). Those rows are flagged
  `is_first_draw_of_bag` and give you a guessing baseline.
- **Earlier bags stay on screen**, greyed and smaller, above the bag in play —
  so predictions in Bags 2–4 are made with the full record visible rather than
  from memory.
- **Bags run in CSV order** — Bag1 is always first. That ordering is what the
  "evidence in B1 / critical trials in later bags" columns assume.
- **Feedback is implicit**: the drawn item is shown either way, so the reveal
  also says "Correct" / "Not this time" (`SHOW_ACCURACY_FEEDBACK`).
- **Neutral framing.** Nothing tells participants that the four bags are
  related. Saying so would change what "transfer to Bag 2" measures.
- **Letters are shown as they appear in the CSV.** Set
  `COUNTERBALANCE_LETTERS: true` to randomly relabel A/B/C/D per participant, so
  alphabetical order can't be mistaken for sequence structure. The mapping is
  saved in the `letter_map` column.
- **"Bracketing" is held out.** Its Bag 4 reads `DANCDNCD`, which contains an
  `N` — the only non-A–D character in the file. Fix the cell, re-run
  `build_patterns.py`, and it rejoins the pool automatically. To run it as-is,
  set `EXCLUDE_INVALID_PATTERNS: false` (the `N` gets its own button).

## Data

One row per trial. The rows that matter are `screen == "prediction"`:

| Column | Meaning |
| --- | --- |
| `pattern_name`, `group` | from the CSV |
| `bag_index`, `draw_index` | 1-based position |
| `context` | everything drawn before this prediction, e.g. `"ABAB"` |
| `predicted`, `actual`, `correct` | the response and the truth |
| `rt` | ms from prompt onset to click/keypress |
| `is_first_draw_of_bag` | true for the no-information draw |
| `bag_string`, `letter_map` | the bag as shown, and any relabelling |
| `n_evidence_bag1`, `n_critical_later`, `n_elements_in_pred` | the CSV's own annotation columns |

Session-level columns (`session_id`, `worker_id`, `assignment_id`, `hit_id`,
`completion_code`, `assigned_patterns`) are repeated on every row.

## Connecting it to Mechanical Turk

The code is already MTurk-shaped; what is missing is an account and a host.

1. **Host the folder** over HTTPS — any static host works, but `/save` needs a
   server, so either keep `server.py` behind a real domain, or point
   `CONFIG.SAVE_URL` at your own endpoint (or at DataPipe / JATOS / Pavlovia),
   or set it to `""` and collect data another way.
2. **Create an External Question HIT** whose URL is your hosted `index.html`.
   MTurk appends `assignmentId`, `hitId`, `workerId`, and `turkSubmitTo`; the
   study reads all four, stores them in the data, and shows a **Submit HIT**
   button that posts back to `turkSubmitTo` — that is the whole handshake.
3. **Preview mode is handled.** While a worker is previewing, MTurk sends
   `assignmentId=ASSIGNMENT_ID_NOT_AVAILABLE`; the study shows a short "accept
   the HIT to start" page instead of burning a session.
4. **If you use a Survey Link HIT instead**, workers paste the completion code
   shown at the end (`OH-XXXXXXXX`, also stored in every data row) into the HIT.
5. **Before launching:** set `PAYMENT_TEXT` and `ESTIMATED_MINUTES` in
   `config.js` to match the HIT, put real contact details in the consent screen,
   and pilot the exact hosted URL yourself with `?pattern=` to check every
   pattern renders.

Sanity check the timing before you price the HIT: a 24-draw pattern takes about
5 minutes at the default 1.4 s reveal.
