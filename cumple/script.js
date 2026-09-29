const startBtn = document.getElementById("startBtn");
const surprise = document.getElementById("surprise");
const sections = document.querySelectorAll(".hidden-section");

function revealAll() {
  sections.forEach((section, index) => {
    setTimeout(() => section.classList.add("visible"), index * 180);
  });
}

startBtn.addEventListener("click", () => {
  revealAll();
  createConfetti(70);
  startMusic();
  surprise.scrollIntoView({ behavior: "smooth" });
  playTinyCelebration();
});

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) entry.target.classList.add("visible");
  });
}, { threshold: 0.12 });

sections.forEach(section => observer.observe(section));

document.querySelectorAll(".choice").forEach(button => {
  button.addEventListener("click", () => {
    const result = document.getElementById("gameResult");
    result.textContent = button.textContent.includes("TODAS")
      ? "Respuesta correcta. No había otra opción. 😌💜"
      : "Buena respuesta... pero te faltó marcar TODAS LAS ANTERIORES. 😂";
    createConfetti(20);
  });
});

const secretBtn = document.getElementById("secretBtn");
const secretText = document.getElementById("secretText");
const meterFill = document.getElementById("meterFill");
const triesText = document.getElementById("triesText");
const taunts = [
  "JAJA, CASI 😜", "¡Muy lento! 🐢", "Uy, casi casi 😏", "¿Eso es todo? 😂",
  "Intenta con la otra mano 🙌", "Te falta velocidad ⚡", "Me dio pena, pero no 😈",
  "¡Qué persistente! 💪", "No te rindas... o sí 🤭", "Ya casi, de verdad 👀",
  "Ok, última. Prometido 🤞", "Mentira, otra más 😹", "Ahora sí, me cansé 🥹"
];
const TOTAL = taunts.length;
let tries = 0, unlocked = false, lastDodge = 0;

function dodgeButton(e) {
  if (unlocked) return;
  if (e && e.cancelable) e.preventDefault();
  const now = Date.now();
  if (now - lastDodge < 350) return; // evita contar dos veces el mismo intento
  lastDodge = now;
  tries++;
  const box = secretBtn.parentElement;
  if (tries > TOTAL) return unlock();
  const w = secretBtn.offsetWidth, h = secretBtn.offsetHeight;
  const maxX = Math.max(0, box.clientWidth - w - 10);
  const maxY = Math.max(0, box.clientHeight - h - 10);
  secretBtn.style.position = "absolute";
  secretBtn.style.left = `${5 + Math.random() * maxX}px`;
  secretBtn.style.top = `${5 + Math.random() * maxY}px`;
  secretBtn.textContent = taunts[tries - 1];
  secretBtn.classList.remove("shake"); void secretBtn.offsetWidth; secretBtn.classList.add("shake");
  secretBtn.style.fontSize = Math.max(.6, 1 - tries * .03) + "rem"; // se hace más chiquito
  meterFill.style.width = (tries / TOTAL * 100) + "%";
  triesText.textContent = `Intentos: ${tries}` + (tries > 6 ? " · no te rindas 😈" : "");
  if (tries % 4 === 0) createConfetti(10);
}

function unlock() {
  unlocked = true;
  secretBtn.style.position = "relative";
  secretBtn.style.left = secretBtn.style.top = "auto";
  secretBtn.style.fontSize = "1rem";
  secretBtn.textContent = "OK, PRESIONA 💜";
  triesText.textContent = `¡Lo lograste en ${tries - 1} intentos! 🏆`;
  meterFill.style.width = "100%";
}

secretBtn.addEventListener("mouseenter", dodgeButton);
secretBtn.addEventListener("touchstart", dodgeButton, { passive: false });
secretBtn.addEventListener("click", () => {
  if (!unlocked) return dodgeButton();
  secretText.textContent = "🎁 Sorpresa: oficialmente tienes permiso para disfrutar muchísimo tu día. Y si alguien dice lo contrario, no le hagas caso. 😂";
  createConfetti(60);
  playTinyCelebration();
});

/* ===== Velitas ===== */
const candles = document.querySelectorAll(".candle");
const wishText = document.getElementById("wishText");
candles.forEach(c => c.addEventListener("click", () => {
  if (c.classList.contains("out")) return;
  c.classList.add("out");
  c.textContent = "💨";
  if ([...candles].every(x => x.classList.contains("out"))) {
    wishText.textContent = "✨ Deseo concedido. (Y no me digas cuál, que se cumple más rápido) 🤫";
    createConfetti(90);
    playTinyCelebration();
  }
}));
document.getElementById("relightBtn").addEventListener("click", () => {
  candles.forEach(c => { c.classList.remove("out"); c.textContent = "🕯️"; });
  wishText.textContent = "";
});

/* ===== Cupones ===== */
document.querySelectorAll(".coupon").forEach(c => c.addEventListener("click", () => {
  c.classList.toggle("open");
  if (c.classList.contains("open")) createConfetti(12);
}));

/* ===== Música (sintetizada, sin archivos) ===== */
// Si prefieres una canción real, guarda tu mp3 en /music y pon aquí la ruta, ej: "music/cumple.mp3"
const MP3_PATH = "";
const musicBtn = document.getElementById("musicBtn");
const trackBtn = document.getElementById("trackBtn");
const mp3 = MP3_PATH ? Object.assign(new Audio(MP3_PATH), { loop: true, volume: .6 }) : null;
let mctx = null, loopTimer = null, musicOn = false, party = false;

// [nota MIDI, duración en pulsos] — "Cumpleaños feliz"
const SONG = [
  [60,.75],[60,.25],[62,1],[60,1],[65,1],[64,2],
  [60,.75],[60,.25],[62,1],[60,1],[67,1],[65,2],
  [60,.75],[60,.25],[72,1],[69,1],[65,1],[64,1],[62,2],
  [70,.75],[70,.25],[69,1],[65,1],[67,1],[65,2]
];
const midi = n => 440 * Math.pow(2, (n - 69) / 12);

function tone(t, freq, dur, type, vol) {
  const o = mctx.createOscillator(), g = mctx.createGain();
  o.type = type; o.frequency.value = freq;
  g.gain.setValueAtTime(.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + .03);
  g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  o.connect(g); g.connect(mctx.destination);
  o.start(t); o.stop(t + dur + .05);
}

function scheduleSong() {
  const beat = party ? .3 : .5;
  let t = mctx.currentTime + .1, beats = 0;
  SONG.forEach(([n, d]) => {
    const len = d * beat;
    tone(t, midi(n), len * 1.1, party ? "square" : "triangle", party ? .04 : .09);
    tone(t, midi(n + 12), len, "sine", .03);
    t += len; beats += d;
  });
  // acompañamiento simple: bajo + palmas en modo fiesta
  for (let b = 0; b < beats; b += 1) {
    const bt = mctx.currentTime + .1 + b * beat;
    tone(bt, midi([48, 43, 48, 53][Math.floor(b / 6) % 4]), beat * .9, "sine", .07);
    if (party) tone(bt + beat / 2, 200, .05, "sawtooth", .02);
  }
  loopTimer = setTimeout(scheduleSong, (t - mctx.currentTime + .6) * 1000);
}

function startMusic() {
  if (musicOn) return;
  musicOn = true;
  musicBtn.classList.add("playing");
  if (mp3) return mp3.play().catch(() => {});
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  mctx = new AC();
  scheduleSong();
}
function stopMusic() {
  musicOn = false;
  musicBtn.classList.remove("playing");
  clearTimeout(loopTimer);
  if (mp3) mp3.pause();
  if (mctx) { mctx.close(); mctx = null; }
}
musicBtn.addEventListener("click", () => musicOn ? stopMusic() : startMusic());
trackBtn.addEventListener("click", () => {
  party = !party;
  trackBtn.textContent = party ? "🎈" : "🎉";
  if (musicOn && !mp3) { stopMusic(); startMusic(); }
  else if (!musicOn) startMusic();
});

document.getElementById("celebrateBtn").addEventListener("click", () => {
  createConfetti(150);
  document.getElementById("finalMessage").textContent =
    "🎊 Misión cumplida: arrancarte una sonrisa. ¡Ahora a disfrutar tu cumpleaños! 🦋💜";
  playTinyCelebration();
});

function createConfetti(amount = 50) {
  const container = document.getElementById("confetti");
  const symbols = ["💜", "💗", "✨", "🦋", "🎉", "🎈"];
  for (let i = 0; i < amount; i++) {
    const piece = document.createElement("div");
    piece.className = "confetti-piece";
    piece.textContent = symbols[Math.floor(Math.random() * symbols.length)];
    piece.style.left = Math.random() * 100 + "vw";
    piece.style.fontSize = (10 + Math.random() * 16) + "px";
    piece.style.animationDuration = (2 + Math.random() * 2.2) + "s";
    piece.style.setProperty("--drift", (Math.random() * 240 - 120) + "px");
    container.appendChild(piece);
    setTimeout(() => piece.remove(), 5000);
  }
}

function playTinyCelebration() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const notes = [523.25, 659.25, 783.99];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = freq;
      osc.type = "sine";
      gain.gain.setValueAtTime(0.0001, ctx.currentTime + i * .12);
      gain.gain.exponentialRampToValueAtTime(.08, ctx.currentTime + i * .12 + .02);
      gain.gain.exponentialRampToValueAtTime(.0001, ctx.currentTime + i * .12 + .25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + i * .12);
      osc.stop(ctx.currentTime + i * .12 + .27);
    });
  } catch (_) {}
}
