/* ------------------------------------------------------------------
   OH Study - timeline assembly, consent, debrief, data handoff.
   ------------------------------------------------------------------ */

const jsPsych = initJsPsych({
  display_element: "jspsych-target",
  on_trial_start: trial => devStatus(trial),
  on_data_update: () => scheduleAutosave(),
  on_finish: () => finishUp()
});

let autosaveTimer = null;
let lastAutosaveSignature = null;

/* Session-level metadata attached to every row of the data file. */
jsPsych.data.addProperties({
  study_version: "1.0",
  user_agent: navigator.userAgent,
  started_at: new Date().toISOString()
});

/* ---------- Consent PDF pre-screen -------------------------------- */
const consentPdfState = { doc: null, page: 1 };

function updateConsentAcceptState() {
  const accept = document.querySelector('#jspsych-html-button-response-btngroup .jspsych-btn[data-choice="0"]');
  if (!accept) return;
  const canAccept = !!consentPdfState.doc && consentPdfState.page >= consentPdfState.doc.numPages;
  accept.disabled = !canAccept;
  accept.setAttribute('aria-disabled', String(!canAccept));
  accept.title = canAccept ? "" : "Read the final consent page before accepting.";
}

function renderConsentPdfPage() {
  if (!consentPdfState.doc) return;
  const canvas = document.getElementById("consent-pdf-canvas");
  const pageCount = document.getElementById("consent-pdf-pagecount");
  const prev = document.getElementById("consent-pdf-prev");
  const next = document.getElementById("consent-pdf-next");
  if (!canvas || !pageCount || !prev || !next) return;

  consentPdfState.doc.getPage(consentPdfState.page).then(page => {
    const viewport = page.getViewport({ scale: 1.1 });
    const maxWidth = 760;
    const scale = Math.min(maxWidth / viewport.width, 1.25);
    const scaled = page.getViewport({ scale });
    canvas.width = scaled.width;
    canvas.height = scaled.height;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    page.render({ canvasContext: ctx, viewport: scaled }).promise.catch(() => {});
    pageCount.textContent = "Page " + consentPdfState.page + " of " + consentPdfState.doc.numPages;
    prev.disabled = consentPdfState.page <= 1;
    next.disabled = consentPdfState.page >= consentPdfState.doc.numPages;
    updateConsentAcceptState();
  }).catch(() => {
    pageCount.textContent = "Page unavailable";
    updateConsentAcceptState();
  });
}

function navigateConsentPdf(delta) {
  if (!consentPdfState.doc) return;
  consentPdfState.page = Math.min(consentPdfState.doc.numPages,
    Math.max(1, consentPdfState.page + delta));
  renderConsentPdfPage();
}

function initializeConsentPdfViewer() {
  const status = document.getElementById("consent-pdf-status");
  const canvas = document.getElementById("consent-pdf-canvas");
  const prev = document.getElementById("consent-pdf-prev");
  const next = document.getElementById("consent-pdf-next");

  if (!window.pdfjsLib) {
    if (status) status.textContent = "Consent PDF viewer unavailable in this browser.";
    if (canvas) canvas.style.display = "none";
    if (prev) prev.disabled = true;
    if (next) next.disabled = true;
    return;
  }

  const pdfUrl = CONSENT_PDF_NAME;
  const viewerReady = () => {
    if (status) status.textContent = "Loading consent form…";
    fetch(pdfUrl, { method: "HEAD" })
      .then(r => {
        if (!r.ok) throw new Error("Missing consent PDF");
        return window.pdfjsLib.getDocument({ url: pdfUrl }).promise;
      })
      .then(doc => {
        consentPdfState.doc = doc;
        consentPdfState.page = 1;
        renderConsentPdfPage();
      })
      .catch(() => {
        if (status) status.textContent = "Consent PDF not found. Please place " + CONSENT_PDF_NAME + " in the project folder.";
        if (canvas) canvas.style.display = "none";
        if (prev) prev.disabled = true;
        if (next) next.disabled = true;
        updateConsentAcceptState();
      });
  };

  if (prev) prev.onclick = () => navigateConsentPdf(-1);
  if (next) next.onclick = () => navigateConsentPdf(1);
  document.addEventListener("keydown", e => {
    if (!consentPdfState.doc) return;
    if (e.key === "ArrowLeft") navigateConsentPdf(-1);
    if (e.key === "ArrowRight") navigateConsentPdf(1);
  }, { once: false });
  viewerReady();
}

const consentPdf = {
  type: jsPsychHtmlButtonResponse,
  stimulus: () =>
    '<div class="screen text consent-pdf-page">' +
      '<h1>Consent Form</h1>' +
      '<div class="consent-pdf-shell">' +
        '<button type="button" class="consent-pdf-arrow" id="consent-pdf-prev" aria-label="Previous page">&#8592;</button>' +
        '<div class="consent-pdf-viewer">' +
          '<div id="consent-pdf-status" class="consent-pdf-status">Loading consent form…</div>' +
          '<canvas id="consent-pdf-canvas"></canvas>' +
          '<div id="consent-pdf-pagecount" class="consent-pdf-pagecount">Page 1 of 1</div>' +
        '</div>' +
        '<button type="button" class="consent-pdf-arrow" id="consent-pdf-next" aria-label="Next page">&#8594;</button>' +
      '</div>' +
    '</div>',
  choices: ["Accept"],
  button_html: (c, i) => '<button class="jspsych-btn wide" id="consent-accept" data-choice="' + i + '" disabled>' + c + '</button>',
  on_load: initializeConsentPdfViewer,
  data: { screen: "consent_pdf" }
};

/* continueTrial gives every screen the same button, clickable or space.
   The stimulus is a function so the group count is read at run time from
   the patterns actually assigned rather than hard-coded here. */
const consent = continueTrial(
  () =>
    '<div class="screen text">' +
      '<h1>Prediction Task</h1>' +
      '<p>In this task, you will be shown the colors in a sequence, and predict what color will come out next. There are four sequences in a group, and a total of eight groups.</p>' +
      "<p>There is a small time penalty for choosing the wrong color, but it's okay if you don't know the pattern at first! Just make your best guess.</p>" +
    '</div>',
  { screen: "instructions" }, "Next");

/* ---------- Demographics -------------------------------------------- */
/* Shown right after the consent PDF is accepted. The answers also become
   columns (age, sex, education) on every row, so they sit next to the
   trial data without joining on the demographics row. */
const demographics = {
  type: jsPsychSurveyHtmlForm,
  preamble: '<div class="demo-intro"><h1>About you</h1>' +
    '<p>Thank you for participating in our study! Before we begin, three quick questions:</p></div>',
  html:
    '<div class="demo-form">' +
      '<label for="demo-age">Age</label>' +
      '<input type="number" id="demo-age" name="age" min="18" max="120" step="1" required>' +
      '<label for="demo-sex">Sex</label>' +
      '<select id="demo-sex" name="sex" required>' +
        '<option value="" selected disabled>Select…</option>' +
        '<option>Female</option><option>Male</option><option>Intersex</option>' +
        '<option>Prefer not to say</option>' +
      '</select>' +
      '<label for="demo-education">Highest level of education completed</label>' +
      '<select id="demo-education" name="education" required>' +
        '<option value="" selected disabled>Select…</option>' +
        '<option>Less than high school</option>' +
        '<option>High school diploma or equivalent</option>' +
        '<option>Some college</option>' +
        '<option>Associate degree</option>' +
        "<option>Bachelor's degree</option>" +
        "<option>Master's degree</option>" +
        '<option>Doctoral or professional degree</option>' +
        '<option>Prefer not to say</option>' +
      '</select>' +
    '</div>',
  button_label: "Next",
  data: { screen: "demographics" },
  on_finish: data => {
    const r = data.response || {};
    jsPsych.data.addProperties({ age: r.age, sex: r.sex, education: r.education });
  }
};

/* ---------- Main body --------------------------------------------- */
/* Filled in by buildBody() once the study is known - inside JATOS that is
   only after jatos.onLoad, since the ?study= on the link arrives there. */
let assigned = [];
const body = [];
let completedSets = 0;

function ensureProgressBar() {
  let bar = document.getElementById("study-progress");
  if (!bar) {
    bar = document.createElement("div");
    bar.id = "study-progress";
    bar.innerHTML =
      '<div class="study-progress-track">' +
        '<div class="study-progress-fill"></div>' +
      '</div>' +
      '<div class="study-progress-label">0% complete</div>';
    document.body.insertBefore(bar, document.body.firstChild);
  }
  return bar;
}

function updateProgressBar() {
  const total = Math.max(assigned.length || 1, 1);
  const bar = ensureProgressBar();
  const fill = bar.querySelector(".study-progress-fill");
  const label = bar.querySelector(".study-progress-label");
  const pct = Math.min(Math.max((completedSets / total) * 100, 0), 100);
  if (fill) fill.style.width = pct + "%";
  if (label) label.textContent = Math.round(pct) + "% complete";
}

function markSetComplete() {
  completedSets += 1;
  updateProgressBar();
}

function buildBody(linkParams) {
  STUDY = resolveStudy(linkParams);
  assigned = assignPatterns();
  jsPsych.data.addProperties({
    study: STUDY,
    assigned_patterns: assigned.map(p => p.id).join(","),
    n_patterns_assigned: assigned.length
  });

  assigned.forEach((pattern, i) => {
    const built = patternTimeline(pattern, i);
    body.push(...built.timeline);
    if (i < assigned.length - 1) {
      body.push(continueTrial(
        '<div class="screen text"><h2>Group completed</h2>' +
        '<p>That group of ' + CONFIG.SEQ_WORD + 's is finished. ' +
        'The next group is unrelated to the one you just saw.</p></div>',
        { screen: "break" }, "Continue"));
    }
  });
}

/* ---------- Back matter ------------------------------------------- */
const debrief = {
  type: jsPsychHtmlKeyboardResponse,
  choices: "NO_KEYS",
  trial_duration: 100,
  stimulus: '<div class="screen text"><p>Saving your data…</p></div>',
  data: { screen: "debrief" }
};

/* ---------- Run ---------------------------------------------------- */
/* ?dev=1 jumps straight to a rule, so it skips the intro. */
const timeline = () => SKIP_INTRO
  ? [...body, debrief]
  : [consentPdf, demographics, consent, ...body, debrief];

/* jatos.js is only present when the study is served by JATOS. Outside it
   IN_JATOS is false and data is not saved anywhere. */
const IN_JATOS = typeof jatos !== "undefined";

function startStudy(linkParams) {
  buildBody(linkParams);
  updateProgressBar();
  renderDevPanel(assigned);
  jsPsych.run(timeline());
}

/* Balanced assignment. The JATOS batch session keeps one counter per study
   ("oh_completed_1", "oh_completed_2") of finished participants. A new
   participant with no ?study= on the link gets the study with fewer
   completions (ties: coin flip). The counter is bumped once the data has saved
   (see finishUp). */
const COUNTER_KEY = s => "oh_completed_" + s;
const completedCount = s => Number(jatos.batchSession.get(COUNTER_KEY(s))) || 0;

function pickStudy(q) {
  if (linkStudy(q) !== null || String(CONFIG.STUDY) !== "balanced") return q;
  const studies = knownStudies();
  const low = Math.min(...studies.map(completedCount));
  const fewest = studies.filter(s => completedCount(s) === low);
  return Object.assign({}, q, {
    study: jsPsych.randomization.sampleWithoutReplacement(fewest, 1)[0]
  });
}

if (IN_JATOS) {
  /* JATOS ids exist only once jatos.js has loaded the study run, so they are
     attached here rather than with the other session metadata above. */
  jatos.onLoad(() => {
    jsPsych.data.addProperties({
      jatos_study_id: jatos.studyId,
      jatos_study_title: jatos.studyProperties ? jatos.studyProperties.title : "",
      jatos_component_id: jatos.componentId,
      jatos_study_result_id: jatos.studyResultId,
      jatos_component_result_id: jatos.componentResultId,
      jatos_worker_id: jatos.workerId,
      jatos_worker_type: jatos.workerType || "",
      jatos_batch_id: jatos.batchId,
      jatos_group_result_id: jatos.groupResultId || ""
    });

    /* Prolific's ids arrive on the study link, which JATOS hands over as
       jatos.urlQueryParameters rather than in window.location. */
    const q = jatos.urlQueryParameters || {};
    jsPsych.data.addProperties({
      prolific_pid: q.PROLIFIC_PID || "",
      prolific_study_id: q.STUDY_ID || "",
      prolific_session_id: q.SESSION_ID || ""
    });

    startStudy(pickStudy(q));
  });
} else {
  startStudy();
}

/* ---------- End of study ------------------------------------------ */
function scheduleAutosave() {
  if (!CONFIG.AUTO_SAVE) return;
  if (autosaveTimer) clearTimeout(autosaveTimer);
  autosaveTimer = setTimeout(() => {
    saveCurrentData({ final: false, silent: true });
  }, CONFIG.AUTO_SAVE_INTERVAL_MS || 15000);
}

function saveCurrentData({ final = false, silent = false } = {}) {
  const clean = jsPsych.data.get().ignore("stimulus");
  const csv = clean.csv();
  const sig = (final ? "final:" : "partial:") + csv.length;
  if (sig === lastAutosaveSignature && !final) return Promise.resolve(true);
  lastAutosaveSignature = sig;

  const done = (savedOk) => {
    if (!silent && !final) {
      console.warn(savedOk === false ? "Partial data save failed." : "Partial data saved.");
    }
    return savedOk;
  };

  if (IN_JATOS) {
    return Promise.resolve(jatos.submitResultData(csv))
      .then(() => done(true))
      .catch(e => {
        console.warn("Autosave to JATOS failed:", e);
        return done(false);
      });
  }

  // Outside JATOS there is nowhere to save to.
  return Promise.resolve(final ? null : true);
}

function countCompletion() {
  return Promise.resolve(jatos.batchSession.set(
    COUNTER_KEY(STUDY), completedCount(STUDY) + 1)).catch(e => {
    console.warn("Could not update the completion counter:", e);
  });
}

/* Ends the JATOS study run and sends the participant to CONFIG.COMPLETION_URL.
   Older jatos.js has no endStudyAndRedirect, so fall back to ending the run
   in the background and redirecting ourselves. */
function endStudyAndRedirect() {
  const url = CONFIG.COMPLETION_URL;
  if (!url) return jatos.endStudy(true, "completed");
  if (typeof jatos.endStudyAndRedirect === "function") {
    return jatos.endStudyAndRedirect(url, true, "completed");
  }
  Promise.resolve(jatos.endStudyAjax(true, "completed"))
    .catch(e => console.warn("Could not end the JATOS study run:", e))
    .then(() => { window.location.href = url; });
}

function finishUp() {
  const showDone = (savedOk) => {
    if (IN_JATOS && savedOk && CONFIG.JATOS_END_BUTTON === false) {
      endStudyAndRedirect();
      return;
    }
    const el = document.getElementById("jspsych-target");
    el.innerHTML =
      '<div class="screen text">' +
        '<h1>Thank you for completing our study!</h1>' +
        (IN_JATOS && savedOk
          ? '<p><button class="jspsych-btn wide" id="jatos-finish">Finish</button></p>'
          : '') +
        (savedOk === false
          ? '<p class="warn">We could not save your data' +
            (IN_JATOS ? ' to the server' : '') + '. Please contact the researcher.</p>' : '') +
      '</div>';
    const fin = document.getElementById("jatos-finish");
    if (fin) fin.onclick = () => endStudyAndRedirect();
  };

  saveCurrentData({ final: true, silent: false })
    .then(savedOk => (IN_JATOS && savedOk && String(CONFIG.STUDY) === "balanced"
                        ? countCompletion() : Promise.resolve())
      .then(() => savedOk))
    .then(savedOk => showDone(savedOk))
    .catch(() => showDone(false));
}
