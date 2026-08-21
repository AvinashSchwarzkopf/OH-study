/* ------------------------------------------------------------------
   OH Study - all study-level knobs live here.
   ------------------------------------------------------------------ */
const CONFIG = {

  // ---- Design ----------------------------------------------------
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
  PRACTICE_PATTERN: "identity",
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
  ESTIMATED_MINUTES: 30,     // 22 patterns x ~33 draws; re-time it after a pilot
  PAYMENT_TEXT: "$1.50",

  // ---- Development ----------------------------------------------
  // Panel showing the running rule, with a jump-to-any-rule menu.
  // Leave false and use ?dev=1 when you need it - never on for a live HIT.
  DEV_PANEL: false,

  // ---- Data ------------------------------------------------------
  // POST endpoint for saving. server.py implements /save.
  // Leave "" to skip the upload (data is still offered as a download).
  SAVE_URL: "/save",
  OFFER_DOWNLOAD: true,      // show a "download my data" button at the end (preview aid)
  COMPLETION_CODE_PREFIX: "OH"
};
