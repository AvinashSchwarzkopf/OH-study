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
const consent = {
  type: jsPsychHtmlButtonResponse,
  choices: ["I agree — begin the study"],
  stimulus:
    '<div class="screen text">' +
      '<h1>Consent to participate</h1>' +
      '<p>This is a research study about how people notice patterns. ' +
         'You will watch items being drawn out of ' + CONFIG.BAG_WORD +
         's and guess what comes next.</p>' +
      '<p>The study will take about ' + CONFIG.ESTIMATED_MINUTES +
         ' minutes, and you can stop at any time by closing the window. ' +
         'Data is stored anonymously.</p>' +
    '</div>',
  data: { screen: "consent" }
};

const howItWorks = continueTrial(
  '<div class="screen text">' +
    '<h1>How this works</h1>' +
    '<p>You will be handed a ' + CONFIG.BAG_WORD + ' holding lettered items — ' +
       '<b>A</b>, <b>B</b>, <b>C</b> and <b>D</b>.</p>' +
    '<div class="tiles demo">' +
      '<span class="tile tile-A">A</span><span class="tile tile-B">B</span>' +
      '<span class="tile tile-C">C</span><span class="tile tile-D">D</span>' +
    '</div>' +
    '<p>You cannot see inside the ' + CONFIG.BAG_WORD + '.</p>' +
  '</div>',
  { screen: "instructions_how" }, "Next");

const yourJob = continueTrial(
  '<div class="screen text">' +
    '<h1>Your job</h1>' +
    '<ul>' +
      '<li>Before each item is pulled out, <b>guess which letter it will be</b>. ' +
          'Then the item comes out and stays on screen, so you can always see ' +
          'everything drawn so far.</li>' +
      '<li>Keep going until the ' + CONFIG.BAG_WORD +
          ' is empty. Then you get a new one.</li>' +
      '<li>Even if you are not sure what comes next, make your best guess.</li>' +
    '</ul>' +
    (CONFIG.ALLOW_KEYBOARD
      ? '<p class="hint">Click a letter, or press its key on the keyboard.</p>' : '') +
  '</div>',
  { screen: "instructions_job" }, "Begin");

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
      '<div class="screen text"><h2>Take a breath</h2>' +
      '<p>That set of ' + CONFIG.BAG_WORD + 's is finished. ' +
      'The next set is unrelated to the one you just saw.</p></div>',
      { screen: "break" }, "Continue"));
  }
});

/* ---------- Back matter ------------------------------------------- */
const strategy = {
  type: jsPsychSurveyHtmlForm,
  preamble: '<div class="screen text"><h2>Almost done</h2>' +
            '<p>In a sentence or two: did you notice anything about how the ' +
            CONFIG.BAG_WORD + 's were filled? If you had a strategy, what was it?</p></div>',
  html: '<textarea name="strategy" rows="5" cols="60" ' +
        'placeholder="Type here. &quot;No idea&quot; is a fine answer."></textarea>',
  data: { screen: "strategy" }
};

const demographics = {
  type: jsPsychSurveyHtmlForm,
  preamble: '<div class="screen text"><h2>A few last questions</h2>' +
            '<p>All optional.</p></div>',
  html:
    '<p><label>Age <input name="age" type="number" min="18" max="120" size="4"></label></p>' +
    '<p><label>Gender <input name="gender" type="text" size="20"></label></p>' +
    '<p><label>Is English your first language? ' +
      '<select name="english"><option value=""></option>' +
      '<option>Yes</option><option>No</option></select></label></p>' +
    '<p><label>Anything go wrong (page glitches, interruptions)?<br>' +
      '<textarea name="problems" rows="2" cols="50"></textarea></label></p>',
  data: { screen: "demographics" }
};

const debrief = {
  type: jsPsychHtmlKeyboardResponse,
  choices: "NO_KEYS",
  trial_duration: 100,
  stimulus: '<div class="screen text"><p>Saving your data…</p></div>',
  data: { screen: "debrief" }
};

/* ---------- Run ---------------------------------------------------- */
const timeline = SKIP_INTRO
  ? [...body, strategy, demographics, debrief]
  : [consent, howItWorks, yourJob, ...body, strategy, demographics, debrief];

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
