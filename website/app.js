// Install button behavior
const installBtn = document.getElementById('installBtn');
const heroInstall = document.getElementById('heroInstall');
const webstoreLink = document.getElementById('webstoreLink');
const openGuide = document.getElementById('openGuide');
const guideModal = document.getElementById('guideModal');
const closeGuide = document.getElementById('closeGuide');
const closeGuide2 = document.getElementById('closeGuide2');
const openExtensions = document.getElementById('openExtensions');

function openInstallGuide() {
  guideModal.classList.remove('hidden');
}

function closeInstallGuide() {
  guideModal.classList.add('hidden');
}

function goToWebStore() {
  // Placeholder link — replace with actual Web Store URL when available
  // Example: https://chrome.google.com/webstore/detail/eyezen/<EXTENSION_ID>
  const url = 'https://chrome.google.com/webstore';
  window.open(url, '_blank', 'noopener,noreferrer');
}

installBtn.addEventListener('click', goToWebStore);
heroInstall.addEventListener('click', goToWebStore);
webstoreLink.addEventListener('click', (e) => { e.preventDefault(); goToWebStore(); });
openGuide.addEventListener('click', openInstallGuide);
closeGuide.addEventListener('click', closeInstallGuide);
closeGuide2.addEventListener('click', closeInstallGuide);
openExtensions.addEventListener('click', () => {
  window.location.href = 'chrome://extensions';
});

// Live demo controls
const demoOverlay = document.getElementById('demoOverlay');
const heroOverlay = document.getElementById('heroOverlay');
const brightness = document.getElementById('brightness');
const tint = document.getElementById('tint');
const tintButtons = document.querySelectorAll('.tint');

let currentColor = '#FFB74D';
let currentOpacity = parseFloat(tint.value);
let currentBrightness = parseFloat(brightness.value);

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return { r, g, b };
}

function applyOverlay() {
  const { r, g, b } = hexToRgb(currentColor);
  const rgba = `rgba(${r}, ${g}, ${b}, ${currentOpacity})`;
  demoOverlay.style.backgroundColor = rgba;
  heroOverlay.style.backgroundColor = rgba;
  document.documentElement.style.filter = `brightness(${currentBrightness})`;
}

brightness.addEventListener('input', (e) => {
  currentBrightness = parseFloat(e.target.value);
  applyOverlay();
});

tint.addEventListener('input', (e) => {
  currentOpacity = parseFloat(e.target.value);
  applyOverlay();
});

tintButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    tintButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentColor = btn.dataset.color;
    applyOverlay();
  });
});

applyOverlay();

// Ambient mode toggle & tilt interaction
const ambientToggle = document.getElementById('ambientToggle');
const hero = document.querySelector('.hero');
const tiltWindow = document.getElementById('tiltWindow');
const orbs = document.querySelector('.orbs');

if (ambientToggle) {
  ambientToggle.addEventListener('click', () => {
    document.body.classList.toggle('glow-on');
    if (orbs) {
      orbs.classList.toggle('paused');
    }
  });
}

if (hero && tiltWindow) {
  const maxRotate = 6; // degrees
  hero.addEventListener('mousemove', (e) => {
    const rect = hero.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2; // [-1,1]
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    tiltWindow.style.transform = `perspective(800px) rotateY(${x * maxRotate}deg) rotateX(${(-y) * maxRotate}deg)`;
    if (orbs) {
      orbs.style.transform = `translate(${x * 10}px, ${y * 8}px)`;
    }
  });
  hero.addEventListener('mouseleave', () => {
    tiltWindow.style.transform = '';
    if (orbs) orbs.style.transform = '';
  });
}