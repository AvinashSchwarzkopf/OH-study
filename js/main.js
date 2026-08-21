/* ------------------------------------------------------------------
   OH Study - timeline assembly, consent, debrief, data handoff.
   ------------------------------------------------------------------ */

const jsPsych = initJsPsych({
  display_element: "jspsych-target",
  on_trial_start: trial => devStatus(trial),
  on_finish: () => finishUp()
});

/* Session-level metadata attached to every row of the data file. */
const SESSION_ID = "s" + Date.now().toString(36) +
                   Math.random().toString(36).slice(2, 7);

jsPsych.data.addProperties({
  session_id: SESSION_ID,
  completion_code: COMPLETION_CODE,
  worker_id: TURK.workerId,
  assignment_id: TURK.assignmentId,
  hit_id: TURK.hitId,
  study_version: "1.0",
  user_agent: navigator.userAgent,
  started_at: new Date().toISOString()
});

/* ---------- Front matter ------------------------------------------ */
/* continueTrial gives every screen the same button, clickable or space.
   The stimulus is a function so the group count is read at run time from
   the patterns actually assigned rather than hard-coded here. */
const consent = continueTrial(
  () =>
    '<div class="screen text">' +
      '<h1>Prediction Task</h1>' +
      '<p>In this task, you will see multiple sequences of letters. Your job is to predict the next letter by clicking the A, B, C, or D buttons.</p>'+
    '<p>After making your guess, the correct letter will be revealed. You will do this for each letter in the sequence.</p>' +
     '<p> You will then move on to the next sequence. There are four sequences per group, and there are ' + assigned.length + ' groups. </p>' +
     "<p> Let's start with a practice trial.</p>"+
    '</div>',
  { screen: "consent" }, "Next");

/* ---------- Practice ----------------------------------------------- */
/* The warm-up teaches the mechanics, so it stands in for the old
   "How this works" / "Your job" pages. Its rows carry is_practice. */
const practicePattern = CONFIG.PRACTICE_PATTERN
  ? PATTERNS.filter(p => p.id === CONFIG.PRACTICE_PATTERN)[0]
  : null;

const practice = [];
if (practicePattern) {
  practice.push(...patternTimeline(practicePattern, 0, 1, {
    practice: true, nBags: CONFIG.PRACTICE_SEQUENCES
  }).timeline);
  practice.push(continueTrial(
    '<div class="screen text"><h2>That was practice</h2>' +
    '<p>The study starts now.</p>' +
    "<p> Please try your best! If you don't know what letter comes next, make your best guess.</p>"+
    '</div>',
    { screen: "practice_end" }, "Begin"));
} else if (CONFIG.PRACTICE_PATTERN) {
  console.warn('No pattern with id "' + CONFIG.PRACTICE_PATTERN +
               '"; running without practice.');
}

/* ---------- Main body --------------------------------------------- */
const assigned = assignPatterns();
jsPsych.data.addProperties({
  assigned_patterns: assigned.map(p => p.id).join(","),
  n_patterns_assigned: assigned.length
});

const body = [];
assigned.forEach((pattern, i) => {
  const built = patternTimeline(pattern, i, assigned.length);
  body.push(...built.timeline);
  if (i < assigned.length - 1) {
    body.push(continueTrial(
      '<div class="screen text"><h2>Set completed</h2>' +
      '<p>That set of ' + CONFIG.SEQ_WORD + 's is finished. ' +
      'The next set is unrelated to the one you just saw.</p></div>',
      { screen: "break" }, "Continue"));
  }
});

/* ---------- Back matter ------------------------------------------- */
const debrief = {
  type: jsPsychHtmlKeyboardResponse,
  choices: "NO_KEYS",
  trial_duration: 100,
  stimulus: '<div class="screen text"><p>Saving your data…</p></div>',
  data: { screen: "debrief" }
};

/* ---------- Run ---------------------------------------------------- */
/* ?dev=1 jumps straight to a rule, so it skips the intro and practice. */
const timeline = SKIP_INTRO
  ? [...body, debrief]
  : [consent, ...practice, ...body, debrief];

if (IS_MTURK_PREVIEW) {
  document.getElementById("jspsych-target").innerHTML =
    '<div class="screen text"><h1>Preview mode</h1>' +
    '<p>You are previewing this HIT. <b>Accept the HIT</b> to start the study.</p>' +
    '<p>It takes about ' + CONFIG.ESTIMATED_MINUTES + ' minutes and pays ' +
    CONFIG.PAYMENT_TEXT + '.</p></div>';
} else {
  renderDevPanel(assigned);
  jsPsych.run(timeline);
}

/* ---------- End of study ------------------------------------------ */
/* GitHub Pages (and a file:// copy) have no /save endpoint. Posting there
   would fail and show the participant an error about data they can't fix, so
   on a static host we skip the upload and offer the download instead. */
function saveEndpoint() {
  const staticHost = location.protocol === "file:" ||
                     /(^|\.)github\.io$/.test(location.hostname);
  return staticHost ? "" : CONFIG.SAVE_URL;
}

function finishUp() {
  // Drop the rendered HTML from the file - it is huge and adds nothing.
  const clean = jsPsych.data.get().ignore("stimulus");
  const csv = clean.csv();
  const filename = SESSION_ID + (TURK.workerId ? "_" + TURK.workerId : "") + ".csv";

  const showDone = (savedOk) => {
    const el = document.getElementById("jspsych-target");
    el.innerHTML =
      '<div class="screen text">' +
        '<h1>Thank you</h1>' +
        '<p>Your completion code is:</p>' +
        '<div class="code">' + COMPLETION_CODE + '</div>' +
        '<p>Paste this code into the HIT to be paid.</p>' +
        (TURK.turkSubmitTo && TURK.assignmentId
          ? '<form method="POST" action="' + escapeHtml(TURK.turkSubmitTo) +
            '/mturk/externalSubmit">' +
            '<input type="hidden" name="assignmentId" value="' +
              escapeHtml(TURK.assignmentId) + '">' +
            '<input type="hidden" name="completionCode" value="' + COMPLETION_CODE + '">' +
            '<button class="jspsych-btn wide" type="submit">Submit HIT</button></form>'
          : '') +
        (savedOk === false
          ? '<p class="warn">We could not reach the server. Please download your ' +
            'data file and email it to the researcher.</p>' : '') +
        (CONFIG.OFFER_DOWNLOAD || savedOk === false
          ? '<p><button class="jspsych-btn" id="dl">Download my data (CSV)</button></p>' : '') +
        '<p class="hint">' + (savedOk ? 'Data saved as ' + escapeHtml(filename) + '.' : '') +
        '</p>' +
      '</div>';
    const dl = document.getElementById("dl");
    if (dl) dl.onclick = () => clean.localSave("csv", filename);
  };

  const endpoint = saveEndpoint();
  if (!endpoint) { showDone(null); return; }

  fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ filename: filename, csv: csv })
  })
    .then(r => showDone(r.ok))
    .catch(() => showDone(false));
}
