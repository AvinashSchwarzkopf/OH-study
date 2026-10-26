/* ------------------------------------------------------------------
   OH Study - all study-level knobs live here.
   ------------------------------------------------------------------ */
const CONFIG = {

  // ---- Design ----------------------------------------------------
  // The design CSV is split into two studies (its "Group 1" and
  // "Group 2" tables); each participant runs exactly one. The study
  // link decides which: ?study=1 or ?study=2 (works inside JATOS too).
  // This value is used only when the link carries no study:
  //   "balanced" - inside JATOS, give each participant whichever study
  //                has fewer completed participants (counted in the
  //                JATOS batch session). Outside JATOS: a coin flip.
  //   "random"   - a coin flip per participant (balanced on average).
  //   1 or 2     - everyone runs that study.
  STUDY: "balanced",

  // How many patterns (= CSV rows) each participant sees, in a random
  // order. "all" runs every eligible pattern in one session; a number
  // runs that many. Note the carry-over: having just learned
  // "Alternating" changes how a person approaches "Grow", and with
  // "all" that applies to every pattern after the first.
  PATTERNS_PER_PARTICIPANT: "all",

  // Patterns whose bags contain characters outside A-D are held out of
  // random assignment (currently: "Bracketing", bag 4 = DANCDNCD).
  // Set false to run them anyway; the extra letter gets its own button.
  EXCLUDE_INVALID_PATTERNS: true,

  // Restrict assignment to specific pattern ids (from js/patterns.js).
  // e.g. ["identity", "alternating"].  Empty = all eligible patterns.
  ONLY_PATTERNS: [],

  // Randomly remap A/B/C/D to a fresh permutation for each participant,
  // so alphabetical order can't be confused with sequence structure.
  // The mapping is stored in the data. Off = shown exactly as in the CSV.
  COUNTERBALANCE_LETTERS: false,

  // ---- Practice --------------------------------------------------
  // A warm-up before the study proper. Identity (AAAAA / BBBBB / ...)
  // is the easiest pattern, so it teaches the mechanics without
  // teaching a rule worth transferring. The practice pattern is
  // dropped from the main assignment so nobody sees it twice, and its
  // rows are flagged is_practice. Set to "" for no practice.
  PRACTICE_PATTERN: "identity_practice",
  PRACTICE_SEQUENCES: 4,     // how many of its four sequences to run

  // ---- Trial flow ------------------------------------------------
  ASK_ON_FIRST_DRAW: true,   // predict draw 1 of a bag (a pure guess; useful baseline)
  SHOW_CHOICE_ECHO: true,    // echo "You chose X" under the bags after each draw
  // false = the letter buttons must be clicked; the A/B/C/D keys do
  // nothing. (The spacebar shortcut on Next/Begin/Continue screens is
  // separate and always on.)
  ALLOW_KEYBOARD: false,

  // ---- Participant-facing copy ----------------------------------
  // The participant-facing word for one run of items (was "bag").
  // Row labels, buttons and screen copy all follow it.
  SEQ_WORD: "sequence",
  ESTIMATED_MINUTES: 15,     // per study: ~8 patterns, ~250 draws; re-time it after a pilot
  PAYMENT_TEXT: "$1.50",

  // ---- Development ----------------------------------------------
  // Panel showing the running rule, with a jump-to-any-rule menu.
  // Leave false and use ?dev=1 when you need it - never on for a live HIT.
  DEV_PANEL: false,

  // ---- Data ------------------------------------------------------
  // POST endpoint for saving. server.py implements /save.
  // Leave "" to skip the upload (data is still offered as a download).
  SAVE_URL: "/save",
  // Save partial data in the background while the participant is running.
  // This is especially useful on Prolific/JATOS where a late dropout can
  // still leave a useful partial dataset behind.
  AUTO_SAVE: true,
  AUTO_SAVE_INTERVAL_MS: 15000,

  // ---- JATOS -----------------------------------------------------
  // When the study runs inside JATOS (jatos.js loaded), data goes to
  // JATOS instead of SAVE_URL - these knobs are ignored otherwise.
  // What to send as result data: "csv", "json", or "both".
  JATOS_RESULT_FORMAT: "csv",
  // Also attach the CSV as a downloadable result file (JATOS 3.7.1+).
  JATOS_UPLOAD_FILE: true,
  // true  = show the completion code with a "Finish" button that ends
  //         the study (participant can copy the code first).
  // false = end the study immediately after saving (JATOS redirects to
  //         its end page / the batch's end-URL, e.g. Prolific).
  JATOS_END_BUTTON: true,
  COMPLETION_CODE_PREFIX: "OH"
};
