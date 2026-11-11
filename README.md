# OH Study — sequence prediction

A jsPsych 8 study, run through JATOS and recruited on Prolific.

**The task.** A participant sees a sequence of colored tiles revealed one at a
time. Before each tile they click the color they think comes next. When a
sequence runs out, the next begins, with every earlier sequence still on
screen. Four sequences make a group (one pattern from the design CSV). A
wrong guess holds the screen for 1 s (`WRONG_DELAY_MS`) before moving on.

**Screens:** consent PDF → demographics → instructions → 8 groups of 4
sequences (one screen per guess, a "Group completed" break between groups) →
thank-you screen.

Colors: A = blue, B = red, C = yellow, D = black.

## Files

| File | What it is |
| --- | --- |
| `index.html` | Page shell; loads everything else |
| `js/config.js` | **Every study knob lives here** |
| `js/patterns.js` | Generated from the CSV. Do not hand-edit |
| `js/experiment.js` | Trial construction, display, pattern assignment |
| `js/main.js` | Consent, demographics, timeline, saving, study balancing |
| `js/dev.js` | The `?dev=1` panel |
| `build_patterns.py` | Regenerates `js/patterns.js` from the CSV |
| `consent_form.pdf` | Shown on the first screen |
| `lib/` | jsPsych 8.2.1, vendored |

After editing the CSV (`OH Study design - Pattern organization.csv`):

```bash
python3 build_patterns.py
```

## Two studies

The CSV has two side-by-side tables, "Group 1" and "Group 2". Each is one
study of 8 patterns, and a participant runs one. Identity (AAAAA / BBBBB / …)
is in study 2 only. `index.html?study=1` or `?study=2` picks one; with no
`?study=`, `CONFIG.STUDY` decides. Every data row has a `study` column.

**Current setup (pilot):** `STUDY: 1`, so everyone runs study 1. The split is
done on Prolific: run 5 places, wait until all 5 have finished, change
`STUDY` to `2` in the study files on JATOS, and raise the places to 10.

`STUDY: "balanced"` (unused for now) sends each new participant to the study
with fewer completions (ties: coin flip). Its counters, `oh_completed_1` and
`oh_completed_2`, live in the JATOS **batch session** and go up only when a
participant finishes and their data has saved; they are not touched in any
other mode. Reset them to 0 before using it (JATOS Workers & Batch Manager →
the batch's session data).

## Dev tools

- `?dev=1` opens a panel with the current rule, a live position readout and a
  jump-to-rule menu. It skips consent and instructions unless you tick *show
  intro screens*.
- `?pattern=alternating` forces one pattern (ids are in `js/patterns.js`).

**Never launch with `dev=1` or `DEV_PANEL: true`:** it lets people skip
consent and pick their condition.

## Data

One row per trial. The rows that matter have `screen == "prediction"`.

| Column | Meaning |
| --- | --- |
| `pattern_order` | position of the group in this participant's session (1–8) |
| `pattern_id`, `pattern_name`, `group` | the pattern and its category from the CSV |
| `bag_index`, `draw_index` | sequence (1–4) and position within it |
| `context` | everything shown so far in the sequence |
| `predicted`, `actual`, `correct` | the response and the truth |
| `rt` | ms from prompt onset to the first click (wrong-answer hold removed) |
| `penalty_ms` | the hold applied after a wrong guess (0 on correct trials) |
| `is_first_draw_of_bag` | true for the no-information first guess |
| `bag_string` | the full sequence as shown |
| `n_evidence_bag1`, `n_critical_later`, `n_elements_in_pred` | the CSV's annotation columns |

Session-level columns on every row: `study`, `assigned_patterns` (the group
order), `prolific_pid` / `prolific_session_id` / `prolific_study_id`, the
demographics, and the `jatos_*` ids (`jatos_study_result_id` identifies the
run).

Data is saved only inside JATOS: autosaved every 15 s as the study runs, and
saved once more at the end. Runs that quit partway leave partial data. A
completed run has a
`screen == "debrief"` row.

## Running in JATOS

Zip this folder and import it as a JATOS study (HTML file: `index.html`). Link
parameters such as `?PROLIFIC_PID=` reach the study through
`jatos.urlQueryParameters`. At the end the participant sees a thank-you screen
with a **Finish** button that ends the JATOS run and redirects to
`CONFIG.COMPLETION_URL` (the Prolific completion link). `JATOS_END_BUTTON:
false` ends and redirects immediately after saving instead. Leave the JATOS
study's own end-redirect setting empty so the two don't compete.
