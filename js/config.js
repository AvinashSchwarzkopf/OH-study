/* ------------------------------------------------------------------
   OH Study - all study-level knobs live here.
   ------------------------------------------------------------------ */
const CONFIG = {

  // ---- Design ----------------------------------------------------
  // How many patterns (= CSV rows) each participant sees.
  // 1 = fully between-subjects. Raising this risks carry-over: having
  // just learned "Alternating" changes how a person approaches "Grow".
  PATTERNS_PER_PARTICIPANT: 1,

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

  // ---- Trial flow ------------------------------------------------
  ASK_ON_FIRST_DRAW: true,   // predict draw 1 of a bag (a pure guess; useful baseline)
  SHOW_ACCURACY_FEEDBACK: true, // mark the reveal "Correct"/"Not this time"
  REVEAL_DURATION_MS: 1400,  // how long the drawn item stays before the next prediction
  ALLOW_KEYBOARD: true,      // A/B/C/D keys as well as clicks

  // ---- Participant-facing copy ----------------------------------
  BAG_WORD: "bag",
  ESTIMATED_MINUTES: 8,
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
