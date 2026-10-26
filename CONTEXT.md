# Context for the OH study

Handoff notes for picking this up cold. `README.md` documents how the code
works; this file records *why it is the way it is*, what is unfinished, and
where things live. Written 2026-08-20.

## What this is

A jsPsych sequence-prediction study. A participant sees a sequence of letters
revealed one at a time. Before each letter appears they guess what it will be;
then it is revealed and they guess the next one. When a sequence runs out, the
next begins, with all finished sequences still on screen. Four sequences make a
set; each set is one pattern (rule) from the design CSV. The session runs every
eligible pattern.

Built to be connected to Mechanical Turk later. Not yet launched.

Data collection now runs through JATOS: `index.html` loads `jatos.js` and
`js/main.js` submits result data + a CSV result file to JATOS whenever JATOS is
serving the study. The MTurk `/save` POST path is untouched and still used
outside JATOS. See README.md § Running in JATOS.

## Where things live

| Thing | Path |
| --- | --- |
| The study | `~/Desktop/oh-study/` (this folder) |
| Design source | `OH Study design - Pattern organization.csv` (this folder; two tables = two studies) |
| GitHub | https://github.com/AvinashSchwarzkopf/OH-study, branch `main` |

Since 2026-10-21 the design is split into two shorter studies, one per CSV
table; a participant runs one, chosen by `?study=1|2` on the link (see
README.md § Two studies). `build_patterns.py` now reads the CSV from this
folder.

## Participant flow

1. Intro page — task description, sequence/group counts filled in at run time.
2. Practice: 4 sequences of the Identity pattern, badged "practice".
3. "That was practice" → the study begins.
4. For each pattern: 4 sequences, one screen per draw, then a "Set completed"
   break before the next pattern.
5. Completion code.

There are no instruction pages — practice *is* the instructions. There are no
strategy or demographics questionnaires; both were removed, and the
`survey-html-form` plugin with them.

## Decisions worth knowing

- **One self-paced screen per draw.** The revealed letter, a "You chose X"
  echo, and the next prompt share a screen. Nothing is timed, so `rt` covers
  both looking at the outcome and deciding. Nothing forces a participant to
  actually look — consider an `rt` floor (~250 ms) as an exclusion rule.
- **Click-only.** `ALLOW_KEYBOARD: false` kills the A/B/C/D keys. The spacebar
  shortcut on Next/Begin/Continue screens is a separate handler and still works.
- **Identity is spent on practice** and held out of the main pool, so it is
  never seen twice. That costs it as a condition. Swapping practice onto a
  throwaway pattern (e.g. AABAB) would give it back.
- **Face-down slots** show how many items remain in the current sequence. This
  cues sequence length, which matters for Grow-type patterns.
- **"Sequence" is the participant-facing word** (`CONFIG.SEQ_WORD`), but the
  data columns are still `bag_index`, `bag_string`, `draws_in_bag`,
  `is_first_draw_of_bag`. Naming mismatch, deliberate, not yet reconciled.
- **Within-subject, random order**, every eligible pattern per participant
  (~21 patterns, ~673 draws, est. 30 min). Carry-over across that many
  patterns is real and untested. `ESTIMATED_MINUTES` is a guess — re-time it
  after a pilot.

## Open items, none acted on

- Intro has no consent language (duration, right to stop, anonymity) and no
  "I agree" button. Needs one before a real launch.
- No progress indicator across a long session.
- The "Set completed" screen repeats itself: heading plus "That set of
  sequences is finished."
- Rename `bag_*` data columns to `sequence_*`?
- Copy the CSV into the repo (above).

## Running it

```bash
cd ~/Desktop/oh-study
python3 server.py 8321          # then open http://localhost:8321/index.html
python3 build_patterns.py       # regenerate js/patterns.js after a CSV change
python3 bundle.py               # rebuild oh-study-standalone.html
```

`oh-study-standalone.html` inlines everything into one file with saving turned
off — for sharing a preview, not for collecting data. Rebuild it after any
change to js/ or css/, or it goes stale.

`?dev=1` opens a dev panel that skips the intro and practice and lets you jump
between patterns. **Never launch a HIT with `dev=1` or `DEV_PANEL: true`** —
it lets people skip consent and pick their own condition.

## Environment

- jsPsych 8.2.1 vendored in `lib/`; no CDN, runs offline.
- No `node` on this machine. Python 3.9.13. `gh` is not installed.
- Pushes to GitHub work over HTTPS via a token in the macOS keychain.
- Global git identity is literally `<Avinash Schwarzkopf>` /
  `<avinashschwarzkopf@berkeley.edu>`, angle brackets included, which git
  rejects as an author. Commits here used a repo-local override. Fix with:
  `git config --global user.name "Avinash Schwarzkopf"` and the matching
  `user.email`.
