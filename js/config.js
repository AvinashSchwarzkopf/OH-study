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
  STUDY: 2,

  // How many patterns (= CSV rows) each participant sees, in a random
  // order. "all" runs every eligible pattern in one session; a number
  // runs that many. Note the carry-over: having just learned
  // "Alternating" changes how a person approaches "Grow", and with
  // "all" that applies to every pattern after the first.
  PATTERNS_PER_PARTICIPANT: "all",

  // Restrict assignment to specific pattern ids (from js/patterns.js).
  // e.g. ["identity", "alternating"].  Empty = all eligible patterns.
  ONLY_PATTERNS: [],

  // ---- Trial flow ------------------------------------------------
  ASK_ON_FIRST_DRAW: true,   // predict draw 1 of a bag (a pure guess; useful baseline)
  // After a wrong guess the pressed button shakes and goes gray for this
  // long (ms) before the trial moves on. 0 = no hold.
  WRONG_DELAY_MS: 1000,
  SHOW_CHOICE_ECHO: true,    // show a green check / red x under the bags after each draw

  // ---- Participant-facing copy ----------------------------------
  // The participant-facing word for one run of items (was "bag").
  // Row labels, buttons and screen copy all follow it.
  SEQ_WORD: "sequence",

  // ---- Development ----------------------------------------------
  // Panel showing the running rule, with a jump-to-any-rule menu.
  // Leave false and use ?dev=1 when you need it - never on for a live HIT.
  DEV_PANEL: false,

  // ---- Data ------------------------------------------------------
  // Save partial data in the background while the participant is running.
  // This is especially useful on Prolific/JATOS where a late dropout can
  // still leave a useful partial dataset behind.
  AUTO_SAVE: true,
  AUTO_SAVE_INTERVAL_MS: 15000,

  // ---- JATOS -----------------------------------------------------
  // Data is saved only when the study runs inside JATOS (jatos.js loaded).
  // true  = show the thank-you screen with a "Finish" button that ends
  //         the study and sends the participant to COMPLETION_URL.
  // false = end the study and redirect immediately after saving.
  JATOS_END_BUTTON: true,
  // Where finished participants are sent (Prolific's completion link).
  // "" = no redirect; JATOS shows its own end page.
  COMPLETION_URL: "https://app.prolific.com/submissions/complete?cc=CDJOZ0UU"
};
