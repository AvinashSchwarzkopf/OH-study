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
      '<p>Thank you for participating in our study! In this task, you will see multiple sequences of tiles. Your job is to predict the color of the next tile.</p>'+
    '<p>After making your guess, the next tile will be revealed. You will do this for each tile in the sequence.</p>' +
     '<p> You will then move on to the next sequence. There are four sequences per group, and there are 8-9 groups. </p>' +
     "<p> Let's start with a practice trial. Make sure you can see all the colors clearly. </p>"+
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
/* ?dev=1 jumps straight to a rule, so it skips the intro and practice. */
const timeline = () => SKIP_INTRO
  ? [...body, debrief]
  : [consentPdf, consent, ...practice, ...body, debrief];

/* jatos.js is only present when the study is served by JATOS. Outside it
   (python server.py, file://, GitHub Pages) IN_JATOS is false and the old
   POST/download path is used unchanged. */
const IN_JATOS = typeof jatos !== "undefined";

function startStudy(linkParams) {
  buildBody(linkParams);
  updateProgressBar();
  if (IS_MTURK_PREVIEW) {
    document.getElementById("jspsych-target").innerHTML =
      '<div class="screen text"><h1>Preview mode</h1>' +
      '<p>You are previewing this HIT. <b>Accept the HIT</b> to start the study.</p>' +
      '<p>It takes about ' + CONFIG.ESTIMATED_MINUTES + ' minutes and pays ' +
      CONFIG.PAYMENT_TEXT + '.</p></div>';
  } else {
    renderDevPanel(assigned);
    jsPsych.run(timeline());
  }
}

/* Balanced assignment. The JATOS batch session keeps one counter per study
   ("oh_completed_1", "oh_completed_2") of finished participants. A new
   participant with no ?study= on the link gets the study with fewer
   completions (ties: coin flip). The counter is bumped when the data is
   saved (see saveToJatos). */
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

    /* Query parameters on the study link (?PROLIFIC_PID=..., ?workerId=...)
       reach the study through JATOS, not through window.location, so fill in
       any TURK field that was empty. */
    const q = jatos.urlQueryParameters || {};
    const fromLink = {
      workerId: q.workerId || q.PROLIFIC_PID || q.participantId || "",
      assignmentId: q.assignmentId || q.SESSION_ID || "",
      hitId: q.hitId || q.STUDY_ID || ""
    };
    Object.keys(fromLink).forEach(k => { if (!TURK[k] && fromLink[k]) TURK[k] = fromLink[k]; });
    jsPsych.data.addProperties({
      worker_id: TURK.workerId,
      assignment_id: TURK.assignmentId,
      hit_id: TURK.hitId,
      url_query_parameters: JSON.stringify(q)
    });

    startStudy(pickStudy(q));
  });
} else {
  startStudy();
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

function currentCsv() {
  return jsPsych.data.get().ignore("stimulus").csv();
}

function partialFilename() {
  const suffix = TURK.workerId ? "_" + TURK.workerId : "";
  return SESSION_ID + suffix + "_partial.csv";
}

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
  const filename = final
    ? SESSION_ID + (TURK.workerId ? "_" + TURK.workerId : "") + ".csv"
    : partialFilename();
  const sig = (final ? "final:" : "partial:") + filename + ":" + csv.length;
  if (sig === lastAutosaveSignature && !final) return Promise.resolve(true);
  lastAutosaveSignature = sig;

  const done = (savedOk) => {
    if (!silent && !final) {
      console.warn(savedOk === false ? "Partial data save failed." : "Partial data saved.");
    }
    return savedOk;
  };

  if (IN_JATOS) {
    return Promise.resolve(jatos.submitResultData(final ? csv : csv))
      .then(() => done(true))
      .catch(e => {
        console.warn("Autosave to JATOS failed:", e);
        return done(false);
      });
  }

  const endpoint = saveEndpoint();
  if (!endpoint) {
    if (final) return Promise.resolve(null);
    return Promise.resolve(true);
  }

  return fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ filename: filename, csv: csv })
  }).then(r => done(r.ok)).catch(() => done(false));
}

function finishUp() {
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
        (IN_JATOS && savedOk
          ? '<p><button class="jspsych-btn wide" id="jatos-finish">Finish</button></p>'
          : '') +
        (TURK.turkSubmitTo && TURK.assignmentId
          ? '<form method="POST" action="' + escapeHtml(TURK.turkSubmitTo) +
            '/mturk/externalSubmit">' +
            '<input type="hidden" name="assignmentId" value="' +
              escapeHtml(TURK.assignmentId) + '">' +
            '<input type="hidden" name="completionCode" value="' + COMPLETION_CODE + '">' +
            '<button class="jspsych-btn wide" type="submit">Submit HIT</button></form>'
          : '') +
        (savedOk === false
          ? '<p class="warn">We could not save your data' +
            (IN_JATOS ? ' to the server' : '') + '. Please contact the researcher.</p>' : '') +
      '</div>';
    const fin = document.getElementById("jatos-finish");
    if (fin) fin.onclick = () =>
      jatos.endStudy(true, "completed, code " + COMPLETION_CODE);
  };

  saveCurrentData({ final: true, silent: false })
    .then(savedOk => showDone(savedOk))
    .catch(() => showDone(false));
}

/* ---------- JATOS save --------------------------------------------- */
/* Result data goes into the component result (visible in the JATOS results
   page, exportable from there); the CSV is additionally attached as a result
   file when the JATOS version supports uploads. The study is only ended -
   which hands the participant back to JATOS / the batch end-URL - after the
   data is in, so a failed save never loses a session silently. */
function saveToJatos(clean, csv, filename, showDone) {
  const fmt = CONFIG.JATOS_RESULT_FORMAT || "csv";
  const payload = fmt === "json" ? clean.json()
                : fmt === "both" ? JSON.stringify({ csv: csv, trials: clean.values() })
                : csv;

  const upload = () => {
    if (!CONFIG.JATOS_UPLOAD_FILE || typeof jatos.uploadResultFile !== "function") {
      return Promise.resolve();
    }
    // Wrapped: older jatos.js returns a jQuery deferred, not a Promise.
    return Promise.resolve(jatos.uploadResultFile(csv, filename)).catch(e => {
      console.warn("JATOS result-file upload failed:", e);
    });
  };

  const countCompletion = () =>
    Promise.resolve(jatos.batchSession.set(
      COUNTER_KEY(STUDY), completedCount(STUDY) + 1)).catch(e => {
      console.warn("Could not update the completion counter:", e);
    });

  Promise.resolve(jatos.submitResultData(payload))
    .then(upload)
    .then(countCompletion)
    .then(() => {
      if (CONFIG.JATOS_END_BUTTON === false) {
        jatos.endStudy(true, "completed, code " + COMPLETION_CODE);
      } else {
        showDone(true);
      }
    })
    .catch(e => {
      console.error("JATOS save failed:", e);
      showDone(false);
    });
}
