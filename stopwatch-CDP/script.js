(() => {
  "use strict";

  const log = {
    info: (msg, extra = {}) => console.info("[Timer]", msg, { level: "info", ...extra }),
    warn: (msg, extra = {}) => console.warn("[Timer]", msg, { level: "warn", ...extra }),
    error: (msg, extra = {}) => console.error("[Timer]", msg, { level: "error", ...extra }),
  };
  const qs = (s) => document.querySelector(s);

  const MAX_MS = (99 * 3600 + 59 * 60 + 59) * 1000 + 999;
  const pad = (n) => String(n).padStart(2, "0");
  const padMs = (n) => String(n).padStart(3, "0");

  const formatTime = (ms) => {
    ms = Math.max(0, Math.min(ms, MAX_MS));
    const total = Math.floor(ms / 1000);
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    const msR = ms % 1000;
    const main = h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
    return { main, ms: `.${padMs(msR)}` };
  };

  function parseHumanTime(input) {
    try {
      if (!input) return null;
      const str = String(input).trim().toLowerCase();
      if (/^\d{1,2}:\d{1,2}(:\d{1,2})?$/.test(str)) {
        const parts = str.split(":").map((v) => parseInt(v, 10));
        let h = 0, m = 0, s = 0;
        if (parts.length === 3) [h, m, s] = parts;
        if (parts.length === 2) [m, s] = parts;
        if (parts.length === 1) [s] = parts;
        if ([h, m, s].some((x) => Number.isNaN(x))) return null;
        return (h * 3600 + m * 60 + s) * 1000;
      }
      const re = /(?:(\d+)\s*h)?\s*(?:(\d+)\s*m)?\s*(?:(\d+)\s*s)?$/;
      const tok = str.match(re);
      if (tok && (tok[1] || tok[2] || tok[3])) {
        const h = parseInt(tok[1] || "0", 10);
        const m = parseInt(tok[2] || "0", 10);
        const s = parseInt(tok[3] || "0", 10);
        return (h * 3600 + m * 60 + s) * 1000;
      }
      if (/^\d+$/.test(str)) return parseInt(str, 10) * 1000;
      return null;
    } catch (e) { log.error("parseHumanTime failed", { error: String(e) }); return null; }
  }

  function beep(duration = 220, freq = 880, type = "sine") {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type; osc.frequency.value = freq;
      osc.connect(gain); gain.connect(ctx.destination);
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration / 1000);
      osc.start(); osc.stop(ctx.currentTime + duration / 1000 + 0.05);
      osc.onended = () => ctx.close().catch(() => {});
    } catch (e) { log.warn("Audio beep unsupported or blocked", { error: String(e) }); }
  }

  const i18n = {
    en:{stopwatch:"Stopwatch",countdown:"Countdown",mode:"Mode",enterTime:"Enter time",apply:"Apply",start:"Start",pause:"Pause",reset:"Reset",theme:"Theme",a11yTip:"Tip",tipText:"Use the language selector to switch EN/ES/PT. Theme is remembered. Countdown input accepts “1:30”, “90s”, “1h 20m”.",invalidTime:"Please enter a valid time.",light:"Light",dark:"Dark"},
    es:{stopwatch:"Cronómetro",countdown:"Cuenta atrás",mode:"Modo",enterTime:"Introduce tiempo",apply:"Aplicar",start:"Iniciar",pause:"Pausar",reset:"Reiniciar",theme:"Tema",a11yTip:"Consejo",tipText:"Cambia EN/ES/PT con el selector. El tema se recuerda. Acepta “1:30”, “90s”, “1h 20m”.",invalidTime:"Por favor introduce un tiempo válido.",light:"Claro",dark:"Oscuro"},
    pt:{stopwatch:"Cronômetro",countdown:"Contagem regressiva",mode:"Modo",enterTime:"Insira o tempo",apply:"Aplicar",start:"Iniciar",pause:"Pausar",reset:"Repor",theme:"Tema",a11yTip:"Dica",tipText:"Use o seletor para alternar EN/ES/PT. O tema é lembrado. Aceita “1:30”, “90s”, “1h 20m”.",invalidTime:"Insira um tempo válido.",light:"Claro",dark:"Escuro"},
  };

  const qsEl = (id) => document.getElementById(id);
  const startBtn = qsEl("startBtn"), pauseBtn = qsEl("pauseBtn"), resetBtn = qsEl("resetBtn");
  const timeDisplay = qsEl("timeDisplay"), millisDisplay = qsEl("millisDisplay");
  const modeStopwatch = qsEl("modeStopwatch"), modeCountdown = qsEl("modeCountdown");
  const modeReadable = qsEl("modeReadable"), countdownRow = qsEl("countdownInputRow");
  const timeInput = qsEl("timeInput"), applyTimeBtn = qsEl("applyTime"), validationMsg = qsEl("validationMsg");
  const themeToggle = qsEl("themeToggle"), langSelect = qsEl("langSelect"), year = qsEl("year");

  const current = {
    mode: localStorage.getItem("busup:lastMode") === "countdown" ? "countdown" : "stopwatch",
    running:false, startTs:0, elapsedMs:0,
    countdownTotal:0, countdownLeft:0, rafId:null,
    lang: localStorage.getItem("busup:lang") || "en",
    theme: localStorage.getItem("busup:theme") || "light"
  };

  function isDark(){ return document.documentElement.classList.contains("dark"); }
  function setTheme(theme){
    const html = document.documentElement;
    if (theme === "dark"){ html.classList.add("dark","theme-dark"); themeToggle.setAttribute("aria-pressed","true"); }
    else { html.classList.remove("dark","theme-dark"); themeToggle.setAttribute("aria-pressed","false"); }
    current.theme = theme; localStorage.setItem("busup:theme", theme);
    const dict = i18n[current.lang] || i18n.en;
    qs("#themeLabel").textContent = isDark() ? dict.dark : dict.light;
    log.info("theme changed", { theme });
  }

  function applyI18n(lang){
    try{
      const dict = i18n[lang] || i18n.en;
      document.querySelectorAll("[data-i18n]").forEach(el => {
        const key = el.getAttribute("data-i18n");
        if (dict[key]) el.textContent = dict[key];
      });
      qs("#themeLabel").textContent = isDark() ? dict.dark : dict.light;
      qs("#modeReadable").textContent = dict[current.mode];
    }catch(e){ log.warn("applyI18n failed", { error:String(e), lang }); }
  }

  function render(ms){
    const {main, ms:msStr} = formatTime(ms);
    timeDisplay.textContent = main;
    millisDisplay.textContent = msStr;
  }

  function start(){
    try{
      if (current.running) return;
      current.running = true;
      if (current.mode === "stopwatch") current.startTs = performance.now() - current.elapsedMs;
      else {
        if (current.countdownLeft <= 0) current.countdownLeft = current.countdownTotal;
        current.startTs = performance.now();
      }
      loop(); log.info("start", { mode: current.mode });
    }catch(e){ log.error("start failed", { error:String(e) }); }
  }
  function pause(){
    try{
      if (!current.running) return;
      current.running = false; cancelAnimationFrame(current.rafId); current.rafId = null;
      if (current.mode === "stopwatch") current.elapsedMs = Math.min(MAX_MS, performance.now() - current.startTs);
      else {
        const delta = performance.now() - current.startTs;
        current.countdownLeft = Math.max(0, current.countdownLeft - delta);
      }
      render(getMs()); log.info("pause", { mode: current.mode });
    }catch(e){ log.error("pause failed", { error:String(e) }); }
  }
  function reset(){
    try{
      cancelAnimationFrame(current.rafId); current.rafId = null; current.running = false;
      if (current.mode === "stopwatch"){ current.elapsedMs = 0; render(0); }
      else { current.countdownLeft = current.countdownTotal; render(current.countdownLeft); }
      qs("#timerCard").classList.remove("flash-on-finish");
      log.info("reset", { mode: current.mode });
    }catch(e){ log.error("reset failed", { error:String(e) }); }
  }
  function loop(){
    current.rafId = requestAnimationFrame(() => {
      try{
        if (!current.running) return;
        let ms;
        if (current.mode === "stopwatch"){
          current.elapsedMs = Math.min(MAX_MS, performance.now() - current.startTs);
          ms = current.elapsedMs;
          if (ms >= MAX_MS){ current.running = false; log.warn("stopwatch reached cap", { capMs: MAX_MS }); }
        } else {
          const elapsed = performance.now() - current.startTs;
          current.countdownLeft = Math.max(0, current.countdownLeft - elapsed);
          current.startTs = performance.now(); ms = current.countdownLeft;
          if (ms <= 0){ current.running = false; render(0); onCountdownFinished(); return; }
        }
        render(ms); loop();
      }catch(e){ log.error("loop failed", { error:String(e) }); current.running = false; }
    });
  }
  function onCountdownFinished(){ try{ beep(240,1040,"square"); const c=qs("#timerCard"); c.classList.remove("flash-on-finish"); void c.offsetWidth; c.classList.add("flash-on-finish"); log.info("countdown finished"); }catch(e){ log.warn("finish feedback failed", { error:String(e) }); } }
  function getMs(){ return current.mode === "stopwatch" ? current.elapsedMs : current.countdownLeft; }

  function setMode(mode){
    if (mode!=="stopwatch" && mode!=="countdown") return;
    if (current.mode===mode) return;
    pause(); current.mode = mode;
    qs("#modeStopwatch").dataset.active = String(mode==="stopwatch");
    qs("#modeCountdown").dataset.active = String(mode==="countdown");
    qs("#modeReadable").textContent = (i18n[current.lang]||i18n.en)[mode];
    countdownRow.classList.toggle("hidden", mode!=="countdown");
    if (mode==="stopwatch"){ render(0); }
    else {
      const saved = localStorage.getItem("busup:lastCountdownMs");
      current.countdownTotal = Math.min(MAX_MS, parseInt(saved || "0",10) || 0);
      current.countdownLeft = current.countdownTotal; render(current.countdownLeft);
      if (saved) timeInput.value = humanize(current.countdownTotal);
    }
    localStorage.setItem("busup:lastMode", mode);
    qs("#timerCard").classList.remove("flash-on-finish");
    log.info("mode changed", { mode });
  }
  function humanize(ms){ const t=Math.floor(ms/1000); const h=Math.floor(t/3600); const m=Math.floor((t%3600)/60); const s=t%60; return h>0?`${pad(h)}:${pad(m)}:${pad(s)}`:`${pad(m)}:${pad(s)}`; }

  function bind(){
    startBtn.addEventListener("click", start);
    pauseBtn.addEventListener("click", pause);
    resetBtn.addEventListener("click", reset);
    modeStopwatch.addEventListener("click", () => setMode("stopwatch"));
    modeCountdown.addEventListener("click", () => setMode("countdown"));
    qsEl("applyTime").addEventListener("click", () => {
      try{
        validationMsg.classList.add("hidden");
        const ms = parseHumanTime(timeInput.value);
        if (ms === null || ms <= 0){
          validationMsg.textContent = (i18n[current.lang] || i18n.en).invalidTime;
          validationMsg.classList.remove("hidden");
          log.warn("invalid countdown input", { input: timeInput.value });
          return;
        }
        current.countdownTotal = Math.min(MAX_MS, ms);
        current.countdownLeft = current.countdownTotal;
        localStorage.setItem("busup:lastCountdownMs", String(current.countdownTotal));
        render(current.countdownLeft);
        log.info("countdown applied", { ms: current.countdownTotal });
      }catch(e){ log.error("applyTime failed", { error:String(e) }); }
    });
    timeInput.addEventListener("keydown", (e) => { if (e.key==="Enter"){ e.preventDefault(); qsEl("applyTime").click(); }});
    themeToggle.addEventListener("click", () => setTheme(isDark() ? "light" : "dark"));
    langSelect.addEventListener("change", () => {
      try{
        current.lang = langSelect.value; localStorage.setItem("busup:lang", current.lang);
        applyI18n(current.lang); log.info("language changed", { lang: current.lang });
      }catch(e){ log.error("language change failed", { error:String(e) }); }
    });
  }

  function init(){
    try{
      qs("#year").textContent = new Date().getFullYear();
      setTheme(current.theme);
      langSelect.value = current.lang; applyI18n(current.lang);
      qs("#modeStopwatch").dataset.active = String(current.mode==="stopwatch");
      qs("#modeCountdown").dataset.active = String(current.mode==="countdown");
      countdownRow.classList.toggle("hidden", current.mode!=="countdown");
      if (current.mode==="stopwatch") render(0);
      else {
        const saved = parseInt(localStorage.getItem("busup:lastCountdownMs") || "0", 10) || 0;
        current.countdownTotal = Math.min(MAX_MS, saved);
        current.countdownLeft = current.countdownTotal; render(current.countdownLeft);
        if (saved) timeInput.value = humanize(saved);
      }
      bind(); log.info("initialized", { mode: current.mode, theme: current.theme, lang: current.lang });
    }catch(e){ log.error("init failed", { error:String(e) }); }
  }

  try{ init(); }catch(e){ log.error("bootstrap failed", { error:String(e) }); }
})();
