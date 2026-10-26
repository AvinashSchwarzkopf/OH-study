/* ------------------------------------------------------------------
   Developer panel. Off for participants; on with ?dev=1 (or by setting
   DEV_PANEL in config.js). Shows which rule is running and jumps to any
   other one. Keep it off for a live HIT.
   ------------------------------------------------------------------ */

const DEV = params.get("dev") === "1" || CONFIG.DEV_PANEL === true;
// Jumping between rules skips consent/instructions unless told otherwise.
const SKIP_INTRO = DEV && params.get("intro") !== "1";

function devURL(patternId, keepIntro) {
  const q = ["dev=1"];
  if (patternId) q.push("pattern=" + encodeURIComponent(patternId));
  if (keepIntro) q.push("intro=1");
  return window.location.pathname + "?" + q.join("&");
}

/* Which rule the panel is currently describing. A session can run
   several rules in a row, so this follows the timeline. */
let DEV_SHOWING = null;

function renderDevPanel(assigned) {
  if (!DEV) return;
  const current = assigned[0];
  DEV_SHOWING = current ? current.id : null;
  const groups = [];
  PATTERNS.forEach(p => {
    const name = "Study " + p.studies.join("+") + " · " + p.group;
    let g = groups.find(x => x.name === name);
    if (!g) { g = { name: name, items: [] }; groups.push(g); }
    g.items.push(p);
  });

  const options = groups.map(g =>
    '<optgroup label="' + escapeHtml(g.name) + '">' +
    g.items.map(p =>
      '<option value="' + p.id + '"' +
      (current && p.id === current.id ? " selected" : "") + '>' +
      escapeHtml(p.name) + (p.valid ? "" : "  ⚠ non-ABCD") + "</option>").join("") +
    "</optgroup>").join("");

  const el = document.createElement("div");
  el.id = "devpanel";
  el.innerHTML =
    '<div class="dp-head"><span>DEV</span>' +
      '<button id="dp-fold" title="collapse">–</button></div>' +
    '<div class="dp-body">' +
      '<div class="dp-now">' +
        '<div class="dp-group">' + escapeHtml(current ? current.group : "—") + '</div>' +
        '<div class="dp-name">' + escapeHtml(current ? current.name : "—") + '</div>' +
      '</div>' +
      '<div class="dp-status" id="dp-status">not started</div>' +
      '<div class="dp-bags">' +
        (current ? current.bags.map((b, i) =>
          '<div><span>' + (i + 1) + '</span>' + escapeHtml(b) + '</div>').join("") : "") +
      '</div>' +
      '<label class="dp-field">jump to rule' +
        '<select id="dp-jump">' + options + '</select></label>' +
      '<label class="dp-check"><input type="checkbox" id="dp-intro"' +
        (params.get("intro") === "1" ? " checked" : "") + '> show intro screens</label>' +
      '<div class="dp-links">' +
        '<a href="' + devURL(null, params.get("intro") === "1") + '">random rule</a>' +
        '<a href="' + window.location.pathname + '">exit dev</a>' +
      '</div>' +
    '</div>';
  document.body.appendChild(el);

  const keepIntro = () => document.getElementById("dp-intro").checked;
  document.getElementById("dp-jump").onchange = e =>
    { window.location.href = devURL(e.target.value, keepIntro()); };
  document.getElementById("dp-intro").onchange = () =>
    { window.location.href = devURL(document.getElementById("dp-jump").value, keepIntro()); };
  document.getElementById("dp-fold").onclick = () =>
    el.classList.toggle("folded");
}

/* Retarget the panel when the timeline moves on to the next rule. */
function devShowPattern(id) {
  if (id === DEV_SHOWING) return;
  const p = PATTERNS.filter(x => x.id === id)[0];
  if (!p) return;
  DEV_SHOWING = id;
  document.querySelector("#devpanel .dp-group").textContent = p.group;
  document.querySelector("#devpanel .dp-name").textContent = p.name;
  document.querySelector("#devpanel .dp-bags").innerHTML =
    p.bags.map((b, i) =>
      '<div><span>' + (i + 1) + '</span>' + escapeHtml(b) + '</div>').join("");
  document.getElementById("dp-jump").value = id;
}

/* Live position readout, driven by each trial's own data. */
function devStatus(trial) {
  if (!DEV) return;
  const box = document.getElementById("dp-status");
  if (!box) return;
  const d = (trial && trial.data) || {};
  if (d.pattern_id) devShowPattern(d.pattern_id);
  let text;
  if (d.screen === "prediction") {
    text = "bag " + d.bag_index + " · predicting draw " +
           d.draw_index + " of " + d.draws_in_bag;
  } else if (d.screen === "bag_end") {
    text = "bag " + d.bag_index + " empty";
  } else {
    text = d.screen || trial.type.info.name;
  }
  box.textContent = text;
}
