'use strict';

const M = Array.isArray(window.LOVE_MESSAGES) ? window.LOVE_MESSAGES : [];
const P = [
  ['rgba(255,255,255,.82)', 'rgba(251,113,133,.84)', 'rgba(190,24,93,.92)'],
  ['rgba(255,255,255,.8)', 'rgba(244,114,182,.84)', 'rgba(126,34,206,.92)'],
  ['rgba(255,255,255,.78)', 'rgba(196,181,253,.82)', 'rgba(109,40,217,.92)'],
  ['rgba(255,255,255,.8)', 'rgba(253,186,116,.84)', 'rgba(234,88,12,.9)'],
  ['rgba(255,255,255,.8)', 'rgba(125,211,252,.82)', 'rgba(2,132,199,.9)']
];

const $ = selector => document.querySelector(selector);
const field = $('#field');
const canvas = $('#fx');
const ctx = canvas.getContext('2d');
const welcome = $('#welcome');
const complete = $('#complete');
const toast = $('#toast');
const message = $('#message');
const done = $('#done');
const total = $('#total');
const fill = $('#fill');
const progress = $('#progress');
const sound = $('#sound');
const soundWave1 = $('#soundWave1');
const soundWave2 = $('#soundWave2');
const install = $('#install');
const nameInput = $('#nameInput');
const linkResult = $('#linkResult');
const updateBanner = $('#updateBanner');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');

let bubbles = [];
let particles = [];
let deck = [];
let found = 0;
let last = performance.now();
let toastTimer = 0;
let soundOn = false;
let audio = null;
let ambient = null;
let deferredInstall = null;
let currentName = cleanName(new URLSearchParams(location.search).get('para')) || 'Dally';
let refreshing = false;
let waitingWorker = null;

function cleanName(value) {
  if (!value) return '';
  return value.replace(/[<>]/g, '').trim().replace(/\s+/g, ' ').slice(0, 28);
}

function personalizedUrl(name = currentName) {
  const url = new URL(location.href);
  url.searchParams.set('para', cleanName(name) || 'Dally');
  url.hash = '';
  return url.toString();
}

function applyName(name, updateAddress = true) {
  currentName = cleanName(name) || 'Dally';
  nameInput.value = currentName;
  $('#brandEyebrow').textContent = `Una sorpresa para ${currentName}`;
  $('#headline').textContent = `Cada burbuja guarda un mensaje para ${currentName}`;
  $('#welcomeTitle').textContent = `Una sorpresa para ${currentName}`;
  $('#completeTitle').textContent = `${currentName}, descubriste todos los mensajes`;
  $('#finalMessage').textContent = `${currentName}, puede que las burbujas se hayan terminado, pero todavía quedan muchos recuerdos bonitos por crear. Gracias por ser parte de tantos momentos especiales.`;
  document.title = `Burbujas de Amor para ${currentName}`;
  linkResult.textContent = personalizedUrl(currentName);
  linkResult.classList.add('show');
  if (updateAddress) history.replaceState(null, '', personalizedUrl(currentName));
}

function shuffle(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function activeLimit() {
  const area = field.clientWidth * field.clientHeight;
  if (innerWidth < 430) return Math.max(7, Math.min(10, Math.floor(area / 27000)));
  if (innerWidth < 760) return Math.max(9, Math.min(13, Math.floor(area / 24000)));
  return Math.max(12, Math.min(17, Math.floor(area / 30000)));
}

function bubbleSize() {
  const widthFactor = Math.max(0.78, Math.min(1.18, field.clientWidth / 920));
  const min = innerWidth < 430 ? 50 : innerWidth < 760 ? 58 : 68;
  const max = innerWidth < 430 ? 76 : innerWidth < 760 ? 92 : 116;
  return (min + Math.random() * (max - min)) * widthFactor;
}

function resizeCanvas() {
  const ratio = Math.min(devicePixelRatio || 1, 2);
  canvas.width = Math.round(innerWidth * ratio);
  canvas.height = Math.round(innerHeight * ratio);
  canvas.style.width = `${innerWidth}px`;
  canvas.style.height = `${innerHeight}px`;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  bubbles.forEach(clampBubble);
}

function clampBubble(bubble) {
  const width = field.clientWidth;
  const height = field.clientHeight;
  bubble.x = Math.max(2, Math.min(bubble.x, Math.max(2, width - bubble.s - 2)));
  bubble.y = Math.max(2, Math.min(bubble.y, Math.max(2, height - bubble.s - 2)));
}

function candidatePosition(size) {
  const width = field.clientWidth;
  const height = field.clientHeight;
  const padding = 10;
  const gap = innerWidth < 500 ? 8 : 12;
  let best = { x: padding, y: padding, score: -Infinity };

  for (let attempt = 0; attempt < 80; attempt += 1) {
    const x = padding + Math.random() * Math.max(0, width - size - padding * 2);
    const y = padding + Math.random() * Math.max(0, height - size - padding * 2);
    let nearest = Infinity;

    for (const other of bubbles) {
      if (!other.alive) continue;
      const dx = x + size / 2 - (other.x + other.s / 2);
      const dy = y + size / 2 - (other.y + other.s / 2);
      const distance = Math.hypot(dx, dy) - (size + other.s) / 2;
      nearest = Math.min(nearest, distance);
    }

    if (!bubbles.length || nearest >= gap) return { x, y };
    if (nearest > best.score) best = { x, y, score: nearest };
  }

  return best;
}

function createBubble(index) {
  const element = document.createElement('button');
  const size = bubbleSize();
  const palette = P[index % P.length];
  const position = candidatePosition(size);
  const speed = (innerWidth < 600 ? 32 : 42) + Math.random() * 24;
  const angle = Math.random() * Math.PI * 2;

  element.type = 'button';
  element.className = 'bubble';
  element.setAttribute('aria-label', 'Descubrir mensaje');
  element.style.setProperty('--s', `${size}px`);
  element.style.setProperty('--c1', palette[0]);
  element.style.setProperty('--c2', palette[1]);
  element.style.setProperty('--c3', palette[2]);

  const bubble = {
    element,
    s: size,
    x: position.x,
    y: position.y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    phase: Math.random() * Math.PI * 2,
    drift: 0.4 + Math.random() * 0.8,
    alive: true
  };

  element.addEventListener('click', () => popBubble(bubble));
  field.append(element);
  bubbles.push(bubble);
  renderBubble(bubble, performance.now());
}

function fillField() {
  while (bubbles.filter(item => item.alive).length < activeLimit() && deck.length) {
    createBubble(bubbles.length + found);
  }
}

function renderBubble(bubble, time) {
  const floatY = reduced.matches ? 0 : Math.sin(time / 900 + bubble.phase) * 4;
  const rotation = reduced.matches ? 0 : Math.sin(time / 1400 + bubble.phase) * 3;
  bubble.element.style.left = `${bubble.x}px`;
  bubble.element.style.top = `${bubble.y}px`;
  bubble.element.style.transform = `translate3d(0,${floatY}px,0) rotate(${rotation}deg)`;
}

function separateBubbles() {
  const gap = innerWidth < 500 ? 6 : 10;

  for (let i = 0; i < bubbles.length; i += 1) {
    const a = bubbles[i];
    if (!a.alive) continue;

    for (let j = i + 1; j < bubbles.length; j += 1) {
      const b = bubbles[j];
      if (!b.alive) continue;

      const ax = a.x + a.s / 2;
      const ay = a.y + a.s / 2;
      const bx = b.x + b.s / 2;
      const by = b.y + b.s / 2;
      let dx = bx - ax;
      let dy = by - ay;
      let distance = Math.hypot(dx, dy);
      const target = (a.s + b.s) / 2 + gap;

      if (distance === 0) {
        dx = Math.random() - 0.5;
        dy = Math.random() - 0.5;
        distance = Math.hypot(dx, dy);
      }

      if (distance < target) {
        const nx = dx / distance;
        const ny = dy / distance;
        const overlap = target - distance;
        const push = overlap * 0.52;
        a.x -= nx * push;
        a.y -= ny * push;
        b.x += nx * push;
        b.y += ny * push;

        const relativeVelocity = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
        if (relativeVelocity < 0) {
          const impulse = -relativeVelocity * 0.72;
          a.vx -= impulse * nx;
          a.vy -= impulse * ny;
          b.vx += impulse * nx;
          b.vy += impulse * ny;
        }

        clampBubble(a);
        clampBubble(b);
      }
    }
  }
}

function animationFrame(time) {
  const delta = Math.min((time - last) / 1000, 0.035);
  last = time;
  const width = field.clientWidth;
  const height = field.clientHeight;

  for (const bubble of bubbles) {
    if (!bubble.alive) continue;

    if (!reduced.matches) {
      const wander = time / 1000 * bubble.drift + bubble.phase;
      bubble.vx += Math.cos(wander) * 3.4 * delta;
      bubble.vy += Math.sin(wander * 1.13) * 3.4 * delta;

      const speed = Math.hypot(bubble.vx, bubble.vy);
      const maxSpeed = innerWidth < 600 ? 68 : 88;
      const minSpeed = innerWidth < 600 ? 28 : 35;
      if (speed > maxSpeed) {
        bubble.vx = bubble.vx / speed * maxSpeed;
        bubble.vy = bubble.vy / speed * maxSpeed;
      } else if (speed < minSpeed && speed > 0) {
        bubble.vx = bubble.vx / speed * minSpeed;
        bubble.vy = bubble.vy / speed * minSpeed;
      }

      bubble.x += bubble.vx * delta;
      bubble.y += bubble.vy * delta;

      if (bubble.x <= 2 || bubble.x + bubble.s >= width - 2) {
        bubble.x = Math.max(2, Math.min(bubble.x, width - bubble.s - 2));
        bubble.vx *= -0.94;
      }
      if (bubble.y <= 2 || bubble.y + bubble.s >= height - 2) {
        bubble.y = Math.max(2, Math.min(bubble.y, height - bubble.s - 2));
        bubble.vy *= -0.94;
      }
    }
  }

  separateBubbles();
  bubbles.forEach(bubble => bubble.alive && renderBubble(bubble, time));
  drawParticles(delta);
  requestAnimationFrame(animationFrame);
}

function popBubble(bubble) {
  if (!bubble.alive || !deck.length) return;
  bubble.alive = false;
  bubble.element.classList.add('pop');
  bubble.element.setAttribute('aria-hidden', 'true');

  const text = deck.shift();
  found += 1;
  updateProgress();
  showMessage(text);
  createBurst(bubble);
  playPop();

  setTimeout(() => {
    bubble.element.remove();
    bubbles = bubbles.filter(item => item !== bubble);
    if (deck.length) {
      fillField();
    } else {
      setTimeout(() => {
        celebrate();
        complete.showModal();
      }, 650);
    }
  }, 360);
}

function updateProgress() {
  const percentage = M.length ? Math.round(found / M.length * 100) : 0;
  done.textContent = found;
  total.textContent = M.length;
  fill.style.width = `${percentage}%`;
  progress.setAttribute('aria-valuenow', String(percentage));
}

function showMessage(text) {
  clearTimeout(toastTimer);
  message.textContent = text;
  toast.classList.add('show');
  toast.setAttribute('aria-hidden', 'false');
  toastTimer = setTimeout(() => {
    toast.classList.remove('show');
    toast.setAttribute('aria-hidden', 'true');
  }, 3600);
}

function createBurst(bubble) {
  const rect = field.getBoundingClientRect();
  const x = rect.left + bubble.x + bubble.s / 2;
  const y = rect.top + bubble.y + bubble.s / 2;
  const count = reduced.matches ? 8 : 30;

  for (let i = 0; i < count; i += 1) {
    const angle = Math.PI * 2 * i / count + Math.random() * 0.25;
    const speed = 60 + Math.random() * 165;
    particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, radius: 2 + Math.random() * 5, life: 1, decay: 0.8 + Math.random() * 0.65, hue: 310 + Math.random() * 55 });
  }
}

function celebrate() {
  if (reduced.matches) return;
  for (let burst = 0; burst < 6; burst += 1) {
    setTimeout(() => {
      for (let i = 0; i < 45; i += 1) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 80 + Math.random() * 220;
        particles.push({ x: innerWidth * (0.18 + Math.random() * 0.64), y: innerHeight * (0.2 + Math.random() * 0.34), vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, radius: 2 + Math.random() * 6, life: 1, decay: 0.55 + Math.random() * 0.45, hue: 300 + Math.random() * 70 });
      }
    }, burst * 120);
  }
  playSuccess();
}

function drawParticles(delta) {
  ctx.clearRect(0, 0, innerWidth, innerHeight);
  for (let i = particles.length - 1; i >= 0; i -= 1) {
    const particle = particles[i];
    particle.life -= particle.decay * delta;
    particle.x += particle.vx * delta;
    particle.y += particle.vy * delta;
    particle.vy += 45 * delta;
    if (particle.life <= 0) {
      particles.splice(i, 1);
      continue;
    }
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
    ctx.fillStyle = `hsla(${particle.hue},90%,78%,${particle.life})`;
    ctx.fill();
  }
}

function ensureAudio() {
  if (!audio) audio = new (window.AudioContext || window.webkitAudioContext)();
}

function tone(frequency, duration = 0.12, type = 'sine', gain = 0.045, delay = 0) {
  if (!soundOn) return;
  ensureAudio();
  const oscillator = audio.createOscillator();
  const volume = audio.createGain();
  const now = audio.currentTime + delay;
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, now);
  volume.gain.setValueAtTime(0.0001, now);
  volume.gain.exponentialRampToValueAtTime(gain, now + 0.015);
  volume.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  oscillator.connect(volume).connect(audio.destination);
  oscillator.start(now);
  oscillator.stop(now + duration + 0.03);
}

function playPop() {
  tone(520, 0.09, 'sine', 0.04);
  tone(760, 0.12, 'triangle', 0.025, 0.035);
}

function playSuccess() {
  [523, 659, 784, 1047].forEach((note, index) => tone(note, 0.45, 'sine', 0.035, index * 0.11));
}

function ambientOn() {
  ensureAudio();
  if (ambient) return;
  const master = audio.createGain();
  master.gain.value = 0.012;
  master.connect(audio.destination);
  const nodes = [196, 246.94, 293.66].map((frequency, index) => {
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.type = index ? 'sine' : 'triangle';
    oscillator.frequency.value = frequency;
    gain.gain.value = 0.6 / (index + 1);
    oscillator.connect(gain).connect(master);
    oscillator.start();
    return oscillator;
  });
  ambient = { master, nodes };
}

function ambientOff() {
  if (!ambient) return;
  ambient.nodes.forEach(node => { try { node.stop(); } catch {} });
  ambient.master.disconnect();
  ambient = null;
}

function toggleSound() {
  soundOn = !soundOn;
  sound.setAttribute('aria-pressed', String(soundOn));
  sound.setAttribute('aria-label', soundOn ? 'Desactivar sonido' : 'Activar sonido');
  sound.dataset.tip = soundOn ? 'Desactivar sonido' : 'Activar sonido';
  soundWave1.style.display = soundOn ? '' : 'none';
  soundWave2.style.display = soundOn ? '' : 'none';
  if (soundOn) {
    ambientOn();
    playPop();
  } else {
    ambientOff();
  }
}

function resetGame() {
  clearTimeout(toastTimer);
  toast.classList.remove('show');
  if (complete.open) complete.close();
  bubbles.forEach(bubble => bubble.element.remove());
  bubbles = [];
  particles = [];
  deck = shuffle(M);
  found = 0;
  updateProgress();
  fillField();
}

async function copyOrShare() {
  const url = personalizedUrl();
  const shareData = { title: `Burbujas de Amor para ${currentName}`, text: `Tengo una sorpresa para ${currentName} 💗`, url };
  try {
    if (navigator.share) {
      await navigator.share(shareData);
    } else {
      await navigator.clipboard.writeText(url);
      showMessage('Enlace personalizado copiado ✨');
    }
  } catch (error) {
    if (error.name !== 'AbortError') showMessage('No se pudo compartir. Intenta copiar el enlace.');
  }
}

function showUpdate(worker) {
  waitingWorker = worker;
  updateBanner.classList.add('show');
}

async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  const registration = await navigator.serviceWorker.register('./sw.js');

  if (registration.waiting && navigator.serviceWorker.controller) showUpdate(registration.waiting);

  registration.addEventListener('updatefound', () => {
    const worker = registration.installing;
    if (!worker) return;
    worker.addEventListener('statechange', () => {
      if (worker.state === 'installed' && navigator.serviceWorker.controller) showUpdate(worker);
    });
  });

  setInterval(() => registration.update().catch(() => {}), 60 * 60 * 1000);
}

$('#nameForm').addEventListener('submit', event => {
  event.preventDefault();
  applyName(nameInput.value);
  resetGame();
  welcome.close();
});

$('#startWithoutChange').addEventListener('click', () => {
  applyName(nameInput.value || currentName);
  resetGame();
  welcome.close();
});

$('#copyLink').addEventListener('click', async () => {
  applyName(nameInput.value || currentName);
  await navigator.clipboard.writeText(personalizedUrl());
  showMessage('Enlace personalizado copiado ✨');
});

$('#personalize').addEventListener('click', () => {
  nameInput.value = currentName;
  linkResult.textContent = personalizedUrl();
  linkResult.classList.add('show');
  welcome.showModal();
});

$('#share').addEventListener('click', copyOrShare);
$('#shareFinal').addEventListener('click', copyOrShare);
$('#restart').addEventListener('click', resetGame);
$('#again').addEventListener('click', resetGame);
$('#close').addEventListener('click', () => complete.close());
sound.addEventListener('click', toggleSound);

window.addEventListener('resize', () => {
  resizeCanvas();
  bubbles.forEach(clampBubble);
});

window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault();
  deferredInstall = event;
  install.hidden = false;
});

install.addEventListener('click', async () => {
  if (!deferredInstall) return;
  deferredInstall.prompt();
  await deferredInstall.userChoice;
  deferredInstall = null;
  install.hidden = true;
});

$('#updateNow').addEventListener('click', () => {
  if (!waitingWorker) return;
  refreshing = true;
  waitingWorker.postMessage({ type: 'SKIP_WAITING' });
});

navigator.serviceWorker?.addEventListener('controllerchange', () => {
  if (refreshing) location.reload();
});

applyName(currentName, false);
soundWave1.style.display = 'none';
soundWave2.style.display = 'none';
resizeCanvas();
total.textContent = M.length;
deck = shuffle(M);
fillField();
requestAnimationFrame(animationFrame);
setTimeout(() => welcome.showModal(), 260);
registerServiceWorker().catch(console.warn);
