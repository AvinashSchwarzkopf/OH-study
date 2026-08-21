/* ------------------------------------------------------------------
   OH Study - sequence prediction from bags
   Flow per pattern: 4 bags in order. For each bag, on every draw the
   participant predicts the next item, then the item is drawn and shown.
   When the bag empties, the next bag begins - with every earlier bag
   still on screen.
   ------------------------------------------------------------------ */

/* ---------- URL / MTurk parameters -------------------------------- */
const params = new URLSearchParams(window.location.search);
const TURK = {
  assignmentId: params.get("assignmentId") || "",
  hitId: params.get("hitId") || "",
  workerId: params.get("workerId") || "",
  turkSubmitTo: params.get("turkSubmitTo") || ""
};
// MTurk sends this exact string while a worker is only previewing the HIT.
const IS_MTURK_PREVIEW = TURK.assignmentId === "ASSIGNMENT_ID_NOT_AVAILABLE";
const FORCE_PATTERN = params.get("pattern");   // ?pattern=alternating for piloting

const COMPLETION_CODE =
  CONFIG.COMPLETION_CODE_PREFIX + "-" +
  Math.random().toString(36).slice(2, 6).toUpperCase() +
  Math.random().toString(36).slice(2, 6).toUpperCase();

/* ---------- Pattern assignment ------------------------------------ */
function eligiblePatterns() {
  let ps = PATTERNS.slice();
  // The practice pattern is spent on practice; seeing it twice would
  // make its second run an odd hybrid of practice and data.
  if (CONFIG.PRACTICE_PATTERN) {
    ps = ps.filter(p => p.id !== CONFIG.PRACTICE_PATTERN);
  }
  if (CONFIG.EXCLUDE_INVALID_PATTERNS) {
    const dropped = ps.filter(p => !p.valid).map(p => p.name);
    if (dropped.length) {
      console.warn("Held out of assignment (non-ABCD characters in a bag): " +
                   dropped.join(", ") + ". Fix the CSV cell, re-run " +
                   "build_patterns.py, or set EXCLUDE_INVALID_PATTERNS=false.");
    }
    ps = ps.filter(p => p.valid);
  }
  if (CONFIG.ONLY_PATTERNS.length) {
    ps = ps.filter(p => CONFIG.ONLY_PATTERNS.includes(p.id));
  }
  return ps;
}

function assignPatterns() {
  const pool = eligiblePatterns();
  if (FORCE_PATTERN) {
    const hit = PATTERNS.filter(p => p.id === FORCE_PATTERN);
    if (hit.length) return hit;
    console.warn('No pattern with id "' + FORCE_PATTERN + '"; assigning at random.');
  }
  const n = CONFIG.PATTERNS_PER_PARTICIPANT === "all"
    ? pool.length
    : Math.min(CONFIG.PATTERNS_PER_PARTICIPANT, pool.length);
  return jsPsych.randomization.sampleWithoutReplacement(pool, n);
}

/* Random A/B/C/D relabelling (optional counterbalancing). */
function makeLetterMap(pattern) {
  const base = ["A", "B", "C", "D"];
  const extra = [...new Set(pattern.bags.join("").split(""))].filter(c => !base.includes(c));
  const map = {};
  if (CONFIG.COUNTERBALANCE_LETTERS) {
    const shuffled = jsPsych.randomization.shuffle(base);
    base.forEach((c, i) => { map[c] = shuffled[i]; });
  } else {
    base.forEach(c => { map[c] = c; });
  }
  extra.forEach(c => { map[c] = c; });
  return map;
}

/* ---------- Display helpers --------------------------------------- */
function escapeHtml(s) {
  return String(s).replace(/[&<>"]/g, c =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}

/* "sequence" -> "Sequence", for row labels and headings. */
function capWord(w) { return w.charAt(0).toUpperCase() + w.slice(1); }

function tile(letter, extraClass) {
  return '<span class="tile tile-' + letter + ' ' + (extraClass || '') + '">' +
         letter + '</span>';
}

/* One face-down slot for an item still in the bag. The slot that is
   about to be drawn is marked, so the participant can see how much is
   left and exactly which position their guess is about. */
function slot(isNext) {
  return '<span class="tile tile-slot' + (isNext ? ' tile-next' : '') + '">' +
         (isNext ? '?' : '') + '</span>';
}

function bagRow(index, items, opts) {
  opts = opts || {};
  const tiles = items.map((l, i) =>
    tile(l, opts.newAt === i ? "tile-new" : "")).join("");
  let slots = "";
  for (let i = 0; i < (opts.remaining || 0); i++) {
    slots += slot(i === 0 && opts.awaiting);
  }
  return '<div class="bagrow' + (opts.current ? ' current' : ' done') + '">' +
           '<div class="rowlab">' +
             '<span>' + capWord(CONFIG.SEQ_WORD) + ' ' + index + '</span>' +
           '</div>' +
           '<div class="tiles">' + tiles + slots + '</div>' +
         '</div>';
}

/* history: [[letters of bag 1], ...] for bags already emptied.
   current: {index, items, remaining, awaiting, newAt} for the bag in play. */
function scene(history, current, caption) {
  const rows = history.map((items, i) => bagRow(i + 1, items, {}));
  if (current) {
    rows.push(bagRow(current.index, current.items, {
      current: true, remaining: current.remaining,
      awaiting: current.awaiting, newAt: current.newAt
    }));
  }
  /* The caption slot is kept even when empty, so the prompt below it
     does not jump between the first draw of a bag and the rest. */
  return '<div class="scene"><div class="bags">' + rows.join("") + '</div>' +
         (caption == null ? '' : '<div class="caption">' + caption + '</div>') +
         '</div>';
}

/* Let A/B/C/D keys stand in for button clicks. */
function attachKeyboard(choices) {
  if (!CONFIG.ALLOW_KEYBOARD) return null;
  const handler = e => {
    const idx = choices.indexOf(e.key.toUpperCase());
    if (idx === -1) return;
    const btn = document.querySelector('.jspsych-btn[data-choice="' + idx + '"]');
    if (btn) { e.preventDefault(); btn.click(); }
  };
  document.addEventListener("keydown", handler);
  return handler;
}

/* A "press on" screen: a real button, plus the spacebar as a shortcut.
   (A keyboard-only screen strands anyone whose focus is elsewhere.) */
function continueTrial(stimulus, data, label, after) {
  let keyHandler = null;
  return {
    type: jsPsychHtmlButtonResponse,
    stimulus: stimulus,
    choices: [label || "Continue"],
    button_html: (c, i) => '<button class="jspsych-btn go" data-choice="' + i + '">' +
                           c + ' <span class="kbd">space</span></button>',
    on_load: () => {
      keyHandler = e => {
        if (e.key !== " " && e.key !== "Spacebar" && e.code !== "Space") return;
        const btn = document.querySelector('.jspsych-btn.go');
        if (btn) { e.preventDefault(); btn.click(); }
      };
      document.addEventListener("keydown", keyHandler);
    },
    on_finish: () => {
      document.removeEventListener("keydown", keyHandler);
      if (after) after();
    },
    data: data
  };
}

/* ---------- Build the trial timeline for one pattern -------------- */
/* opts: {practice: true, nBags: n} for the warm-up block. */
function patternTimeline(pattern, patternIndex, nPatterns, opts) {
  opts = opts || {};
  const map = makeLetterMap(pattern);
  const source = opts.nBags ? pattern.bags.slice(0, opts.nBags) : pattern.bags;
  const bags = source.map(b => b.split("").map(c => map[c]));
  const tag = opts.practice ? '<div class="tag">practice</div>' : '';
  const choices = [...new Set(pattern.bags.join("").split("").map(c => map[c])
                              .concat(["A", "B", "C", "D"]))].sort();

  const timeline = [];
  const history = [];   // bags already emptied, in order

  /* The draw and the next prediction share one screen, so nothing is
     timed: the item that just came out is on screen, labelled with what
     the participant guessed, while the next guess is being made. */
  let lastChoice = null;
  const echo = () =>
    (CONFIG.SHOW_CHOICE_ECHO && lastChoice)
      ? '<span class="chose">You chose <b>' + escapeHtml(lastChoice) + '</b></span>'
      : '';

  bags.forEach((bag, bagIndex) => {
    const drawn = [];

    bag.forEach((actual, drawIndex) => {
      const isFirst = drawIndex === 0;
      const past = history.slice();        // earlier bags, still on screen
      const snapshot = drawn.slice();      // this bag, before the draw

      if (CONFIG.ASK_ON_FIRST_DRAW || !isFirst) {
        let keyHandler = null;
        timeline.push({
          type: jsPsychHtmlButtonResponse,
          stimulus: () =>
            '<div class="screen">' + tag +
              scene(past, { index: bagIndex + 1, items: snapshot,
                           remaining: bag.length - snapshot.length,
                           awaiting: true,
                           newAt: drawIndex > 0 ? snapshot.length - 1 : -1 },
                    echo()) +
              '<p class="prompt">Which letter will come out next?</p>' +
            '</div>',
          choices: choices,
          button_html: (choice, i) =>
            '<button class="jspsych-btn tile-btn tile-' + choice +
            '" data-choice="' + i + '">' + choice + '</button>',
          on_load: () => { keyHandler = attachKeyboard(choices); },
          on_finish: data => {
            if (keyHandler) document.removeEventListener("keydown", keyHandler);
            data.predicted = choices[data.response];
            data.correct = data.predicted === actual;
            lastChoice = data.predicted;
          },
          data: {
            screen: "prediction",
            is_practice: !!opts.practice,
            group: pattern.group,
            pattern_id: pattern.id,
            pattern_name: pattern.name,
            pattern_order: patternIndex + 1,
            bag_index: bagIndex + 1,
            draw_index: drawIndex + 1,
            draws_in_bag: bag.length,
            is_first_draw_of_bag: isFirst,
            actual: actual,
            context: snapshot.join(""),
            bag_string: bag.join(""),
            letter_map: JSON.stringify(map),
            n_evidence_bag1: pattern.n_evidence_bag1,
            n_critical_later: pattern.n_critical_later,
            n_elements_in_pred: pattern.n_elements_in_pred
          }
        });
      }

      drawn.push(actual);
    });

    history.push(drawn.slice());
    const emptied = history.slice();

    timeline.push(continueTrial(
      () => '<div class="screen">' + tag + scene(emptied, null, echo()) + '</div>',
      { screen: "bag_end", pattern_id: pattern.id, bag_index: bagIndex + 1,
        is_practice: !!opts.practice },
      bagIndex < bags.length - 1
        ? "Start " + CONFIG.SEQ_WORD + " " + (bagIndex + 2)
        : "Continue",
      () => { lastChoice = null; }));   // a new bag starts with a clean caption
  });

  return { timeline: timeline, letter_map: map };
}
