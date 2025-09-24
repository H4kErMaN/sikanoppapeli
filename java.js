// Yksinkertainen Sikanoppapeli (2 noppaa), useita pelaajia
(() => {
  const $ = (id) => document.getElementById(id);

  // Setup elements
  const setupView = $("setup");
  const nameFields = $("nameFields");
  const playerCountInput = $("playerCount");
  const targetScoreInput = $("targetScore");
  const startBtn = $("startBtn");

  // Game elements
  const gameView = $("game");
  const playersEl = $("players");
  const targetOut = $("targetOut");
  const newGameBtn = $("newGame");
  const rollBtn = $("roll");
  const holdBtn = $("hold");
  const die1El = $("die1");
  const die2El = $("die2");
  const statusEl = $("status");

  const DIE = ["", "⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];

  let S = null; // state

  // --- Setup screen logic ---
  function renderNameFields() {
    const n = clamp(parseInt(playerCountInput.value, 10) || 2, 2, 8);
    playerCountInput.value = n;
    nameFields.innerHTML = "";
    for (let i = 0; i < n; i++) {
      const wrap = document.createElement("label");
      wrap.textContent = `Pelaaja ${i + 1} `;
      const input = document.createElement("input");
      input.type = "text";
      input.value = `P${i + 1}`;
      input.id = `name_${i}`;
      wrap.appendChild(input);
      nameFields.appendChild(wrap);
    }
  }

  playerCountInput.addEventListener("change", renderNameFields);
  startBtn.addEventListener("click", startGame);

  function startGame() {
    const count = clamp(parseInt(playerCountInput.value, 10) || 2, 2, 8);
    const target = clamp(parseInt(targetScoreInput.value, 10) || 100, 10, 1000);
    const names = [];
    for (let i = 0; i < count; i++) {
      const v = (document.getElementById(`name_${i}`)?.value || "").trim();
      names.push(v || `P${i + 1}`);
    }

    S = {
      names,
      target,
      scores: Array(count).fill(0),
      current: 0,
      active: 0,
      playing: true,
    };

    targetOut.textContent = String(target);
    renderPlayers();
    setActive(0);
    setDiceVisible(false);
    setStatus(`${S.names[S.active]} aloittaa. Onnea!`);

    setupView.classList.add("hidden");
    gameView.classList.remove("hidden");
    enableActions(true);
  }

  // --- Game logic ---
  function roll() {
    if (!S?.playing) return;
    const d1 = r6(), d2 = r6();
    setDiceVisible(true, d1, d2);

    if (d1 === 1 && d2 === 1) {
      S.scores[S.active] = 0;
      updateScore(S.active);
      S.current = 0;
      updateCurrent(S.active);
      nextPlayer(`${S.names[S.active]} heitti kaksois-⚀ – kokonaisscore nollattiin.`);
      return;
    }
    if (d1 === 1 || d2 === 1) {
      S.current = 0;
      updateCurrent(S.active);
      nextPlayer(`${S.names[S.active]} heitti ⚀ – kierros nollautui.`);
      return;
    }

    const sum = d1 + d2;
    S.current += sum;
    updateCurrent(S.active);
    setStatus(`${S.names[S.active]} keräsi +${sum} (kierros: ${S.current}).`);
  }

  function hold() {
    if (!S?.playing) return;
    S.scores[S.active] += S.current;
    updateScore(S.active);

    if (S.scores[S.active] >= S.target) {
      S.playing = false;
      enableActions(false);
      setStatus(`${S.names[S.active]} VOITTAA! (${S.scores[S.active]} ≥ ${S.target})`);
      highlightWinner(S.active);
      return;
    }

    nextPlayer(`${S.names[S.active]} pankitti ${S.current} pistettä.`);
    S.current = 0;
  }

  function nextPlayer(reason) {
    if (reason) setStatus(reason);
    const prev = S.active;
    S.active = (S.active + 1) % S.names.length;
    setActive(S.active, prev);
  }

  // --- UI helpers ---
  function renderPlayers() {
    playersEl.innerHTML = "";
    S.names.forEach((name, i) => {
      const li = document.createElement("div");
      li.className = "player";
      li.id = `player_${i}`;
      li.innerHTML = `
        <div class="p-head">
          <span class="p-name" id="nameOut_${i}">${escapeHtml(name)}</span>
          <span class="badge" id="badge_${i}">Vuoro</span>
        </div>
        <div class="p-scores">
          <div class="p-score">
            <div class="label">KOKO</div>
            <div class="value" id="score_${i}">0</div>
          </div>
          <div class="p-score">
            <div class="label">KIERROS</div>
            <div class="value cur" id="current_${i}">0</div>
          </div>
        </div>
      `;
      playersEl.appendChild(li);
    });
  }

  function setActive(now, prev = null) {
    if (prev !== null) {
      $(`player_${prev}`).classList.remove("active");
      $(`badge_${prev}`).style.display = "none";
      $(`current_${prev}`).textContent = "0";
    }
    $(`player_${now}`).classList.add("active");
    $(`badge_${now}`).style.display = "inline-block";
    S.current = 0;
  }

  function updateScore(i) {
    $(`score_${i}`).textContent = String(S.scores[i]);
  }

  function updateCurrent(i) {
    $(`current_${i}`).textContent = String(S.current);
  }

  function setDiceVisible(on, d1 = null, d2 = null) {
    die1El.style.visibility = on ? "visible" : "hidden";
    die2El.style.visibility = on ? "visible" : "hidden";
    die1El.textContent = d1 ? DIE[d1] : "—";
    die2El.textContent = d2 ? DIE[d2] : "—";
  }

  function setStatus(msg) {
    statusEl.textContent = msg;
  }

  function enableActions(on) {
    rollBtn.disabled = !on;
    holdBtn.disabled = !on;
  }

  function highlightWinner(i) {
    for (let k = 0; k < S.names.length; k++) {
      const el = $(`player_${k}`);
      el.classList.toggle("winner", k === i);
      el.classList.remove("active");
      $(`badge_${k}`).style.display = "none";
    }
  }

  // --- Events ---
  rollBtn.addEventListener("click", roll);
  holdBtn.addEventListener("click", hold);
  newGameBtn.addEventListener("click", () => {
    gameView.classList.add("hidden");
    setupView.classList.remove("hidden");
    setStatus("");
    enableActions(false);
    setDiceVisible(false);
  });

  document.addEventListener("keydown", (e) => {
    if (!S?.playing) return;
    const k = e.key.toLowerCase();
    if (k === "r") roll();
    if (k === "p" || k === "h") hold();
  });

  // --- utils ---
  function r6() { return 1 + Math.floor(Math.random() * 6); }
  function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }
  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  // initial name fields
  renderNameFields();
})();
