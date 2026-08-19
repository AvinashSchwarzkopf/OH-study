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
  return jsPsych.randomization.sampleWithoutReplacement(
    pool, Math.min(CONFIG.PATTERNS_PER_PARTICIPANT, pool.length));
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

function tile(letter, extraClass) {
  return '<span class="tile tile-' + letter + ' ' + (extraClass || '') + '">' +
         letter + '</span>';
}

function bagRow(index, items, opts) {
  opts = opts || {};
  const tiles = items.map((l, i) =>
    tile(l, opts.newAt === i ? "tile-new" : "")).join("");
  let tail = "";
  if (opts.awaiting) {
    tail = items.length
      ? '<span class="next"><span class="arrow">→</span>' +
        '<span class="tile tile-unknown">?</span></span>'
      : '<span class="tile tile-unknown">?</span>';
  }
  return '<div class="bagrow' + (opts.current ? ' current' : ' done') + '">' +
           '<div class="rowlab">' +
             (opts.current ? '<span class="bagicon"></span>' : '') +
             '<span>Bag ' + index + '</span>' +
           '</div>' +
           '<div class="tiles">' + tiles + tail + '</div>' +
         '</div>';
}

/* history: [[letters of bag 1], ...] for bags already emptied.
   current: {index, items, awaiting, newAt} for the bag in play. */
function scene(history, current, caption) {
  const rows = history.map((items, i) => bagRow(i + 1, items, {}));
  if (current) {
    rows.push(bagRow(current.index, current.items, {
      current: true, awaiting: current.awaiting, newAt: current.newAt
    }));
  }
  return '<div class="scene"><div class="bags">' + rows.join("") + '</div>' +
         (caption ? '<div class="caption">' + caption + '</div>' : '') + '</div>';
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
function continueTrial(stimulus, data, label) {
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
    on_finish: () => document.removeEventListener("keydown", keyHandler),
    data: data
  };
}

/* ---------- Build the trial timeline for one pattern -------------- */
function patternTimeline(pattern, patternIndex, nPatterns) {
  const map = makeLetterMap(pattern);
  const bags = pattern.bags.map(b => b.split("").map(c => map[c]));
  const choices = [...new Set(bags.flat().concat(["A", "B", "C", "D"]))].sort();

  const timeline = [];
  const history = [];   // bags already emptied, in order

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
          stimulus:
            '<div class="screen">' +
              scene(past, { index: bagIndex + 1, items: snapshot, awaiting: true }) +
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
          },
          data: {
            screen: "prediction",
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
      const afterDraw = drawn.slice();

      timeline.push({
        type: jsPsychHtmlKeyboardResponse,
        choices: "NO_KEYS",
        trial_duration: CONFIG.REVEAL_DURATION_MS,
        stimulus: () => {
          const last = jsPsych.data.get().filter({ screen: "prediction" }).last(1).values()[0];
          let caption = "";
          if (CONFIG.SHOW_ACCURACY_FEEDBACK && last && last.pattern_id === pattern.id &&
              last.bag_index === bagIndex + 1 && last.draw_index === drawIndex + 1) {
            caption = last.correct
              ? '<span class="fb ok">Correct</span>'
              : '<span class="fb no">Not this time — you said ' +
                escapeHtml(last.predicted) + '</span>';
          }
          return '<div class="screen">' +
                   scene(past, { index: bagIndex + 1, items: afterDraw,
                                 newAt: afterDraw.length - 1 }, caption) +
                 '</div>';
        },
        data: {
          screen: "reveal", pattern_id: pattern.id,
          bag_index: bagIndex + 1, draw_index: drawIndex + 1, actual: actual
        }
      });
    });

    history.push(drawn.slice());
    const emptied = history.slice();

    timeline.push(continueTrial(
      '<div class="screen">' + scene(emptied, null) + '</div>',
      { screen: "bag_end", pattern_id: pattern.id, bag_index: bagIndex + 1 },
      bagIndex < bags.length - 1
        ? "Start " + CONFIG.BAG_WORD + " " + (bagIndex + 2)
        : "Continue"));
  });

  return { timeline: timeline, letter_map: map };
}
