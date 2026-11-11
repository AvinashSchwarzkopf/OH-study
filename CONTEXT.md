# Context for the OH study

Handoff notes: *why* things are the way they are. `README.md` says how it
works.

## What this is

A jsPsych sequence-prediction study. Participants see colored tiles revealed
one at a time and click the color they expect next. Four sequences make a
group (one pattern from the design CSV); each participant runs the 8 groups
of one study, in random order. Recruited on Prolific, served and saved by
JATOS. GitHub: https://github.com/AvinashSchwarzkopf/OH-study, branch `main`.

## Decisions worth knowing

- **Pilot split is done on Prolific, one condition at a time** (N=10, 5 per
  study): `STUDY: 1` for the first 5, then switch to `2` once all 5 have
  finished. This confounds condition with recruitment wave, which is
  acceptable for a pilot but not for the main study. The completion-counter
  balancing (`STUDY: "balanced"`) is still in the code, unused; see README
  § Two studies.
- **No practice trial.** The intro screen is the only instruction. Identity
  is a study 2 pattern; study 1 has no pure Identity.
- **One self-paced screen per guess.** The last outcome (check or x) and the
  next prompt share a screen, so `rt` covers both looking at the outcome and
  deciding. Consider an `rt` floor (~250 ms) as an exclusion rule.
- **Wrong-answer hold.** After a wrong guess the button shakes and grays for
  1 s. Extra clicks during the hold are swallowed and not recorded. `rt` has
  the hold subtracted; `penalty_ms` records it.
- **Click-only answers.** The spacebar works on Next/Continue screens only.
- **Face-down slots** show how many items remain in the current sequence,
  which cues sequence length (relevant to Grow-type patterns).
- **Naming mismatch:** the participant-facing words are "sequence" and
  "group", but the data columns are still `bag_index`, `bag_string`,
  `draws_in_bag`, `is_first_draw_of_bag`; `group` in the data is the pattern's
  category, and the session position is `pattern_order`.
- **No completion code on screen.** The Finish button sends participants to
  Prolific's completion link (`COMPLETION_URL` in config.js).
- **Data is only saved in JATOS.** There is no local save server and no
  download fallback, so pilot the study through JATOS.

## Running it

```bash
python3 build_patterns.py   # regenerate js/patterns.js after a CSV change
```

No `node` on this machine. Pushes to GitHub use HTTPS via a keychain token.
Not committed to git here: this folder is not currently a git repo.
