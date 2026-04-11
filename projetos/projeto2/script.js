
let micInput = null;
let camCapture = null;
let hasMic = false;
let hasCam = false;

const cfg = {
  sensitivity: 5,
  brushSize: 20,
  alpha: 70,
  velocity: 3,
  style: 'circles',
  reactive: true,
  auto: true,
  invert: false
};

// Build viz bars
const vizBar = document.getElementById('viz-bar');
const bars = [];
for (let i = 0; i < 24; i++) {
  const b = document.createElement('div');
  b.className = 'bar';
  b.style.height = '4px';
  vizBar.appendChild(b);
  bars.push(b);
}

// Modal actions
document.getElementById('btn-allow-all').addEventListener('click', () => {
  startSketch(true, true);
  document.getElementById('modal').classList.add('hidden');
});
document.getElementById('btn-allow-mic').addEventListener('click', () => {
  startSketch(true, false);
  document.getElementById('modal').classList.add('hidden');
});
document.getElementById('btn-no-perm').addEventListener('click', () => {
  startSketch(false, false);
  document.getElementById('modal').classList.add('hidden');
});

function startSketch(useMic, useCam) {
  hasMic = useMic;
  hasCam = useCam;

  const sketch = (p) => {
    let mic, fft, cam;
    let brushX, brushY;
    let autoX, autoY, autoAngle = 0;
    let hue = 0;
    let spectrum = new Array(24).fill(0);

    p.setup = () => {
      const cnv = p.createCanvas(p.windowWidth, p.windowHeight);
      cnv.parent('p5-canvas-container');
      p.colorMode(p.HSB, 360, 100, 100, 100);
      p.background(0, 0, 5);
      brushX = p.width / 2;
      brushY = p.height / 2;
      autoX = p.width / 2;
      autoY = p.height / 2;

      if (hasMic) {
        mic = new p5.AudioIn();
        mic.start();
        fft = new p5.FFT(0.8, 64);
        fft.setInput(mic);
        document.getElementById('dot-mic').classList.add('on');
      }

      if (hasCam) {
        cam = p.createCapture(p.VIDEO);
        cam.size(320, 240);
        cam.hide();
        document.getElementById('dot-cam').classList.add('on2');
      }
    };

    p.draw = () => {
      // Get audio data
      let vol = 0;
      if (hasMic && mic) {
        vol = mic.getLevel() * cfg.sensitivity * 10;
        const spec = fft.analyze();
        for (let i = 0; i < 24; i++) {
          spectrum[i] = spec[Math.floor(i * spec.length / 24)];
        }
        // Update viz bars
        bars.forEach((b, i) => {
          const h = Math.max(4, (spectrum[i] / 255) * 44);
          b.style.height = h + 'px';
        });
      }

      // Get camera brightness if available
      let camBright = 0;
      if (hasCam && cam && cam.loadedmetadata) {
        try {
          cam.loadPixels();
          if (cam.pixels && cam.pixels.length > 0) {
            let total = 0;
            const step = 40;
            let count = 0;
            for (let i = 0; i < cam.pixels.length; i += step * 4) {
              total += (cam.pixels[i] + cam.pixels[i+1] + cam.pixels[i+2]) / 3;
              count++;
            }
            camBright = count > 0 ? (total / count) / 255 : 0;
          }
        } catch(e) {}
      }

      hue = (hue + 0.5) % 360;

      // Auto-paint movement
      if (cfg.auto) {
        autoAngle += 0.02 + vol * 0.05;
        const r = 80 + Math.sin(autoAngle * 0.7) * 60 + vol * 30;
        autoX += Math.cos(autoAngle) * cfg.velocity * (1 + vol * 2);
        autoY += Math.sin(autoAngle * 1.3) * cfg.velocity * (1 + vol * 2);
        autoX = p.constrain(autoX, 50, p.width - 50);
        autoY = p.constrain(autoY, 50, p.height - 50);
        if (p.random() < 0.01) { autoX = p.random(100, p.width-100); autoY = p.random(100, p.height-100); }
        drawBrush(autoX, autoY, vol, camBright, hue);
      }

      // Mouse painting
      if (p.mouseIsPressed) {
        brushX = p.mouseX;
        brushY = p.mouseY;
        drawBrush(brushX, brushY, vol + 0.3, camBright, hue + 120);
      }
    };

    function drawBrush(x, y, vol, camBright, h) {
      const reactiveVol = cfg.reactive ? vol : 0;
      const size = cfg.brushSize * (1 + reactiveVol * 3) * (1 + camBright * 0.5);
      const alpha = cfg.alpha;
      const sat = cfg.invert ? 20 : 80 + reactiveVol * 20;
      const bright = cfg.invert ? 90 : 60 + reactiveVol * 30;

      p.noStroke();

      switch(cfg.style) {
        case 'circles':
          for (let i = 0; i < 3 + reactiveVol * 5; i++) {
            const ox = p.random(-size/2, size/2);
            const oy = p.random(-size/2, size/2);
            const s = p.random(size * 0.2, size);
            p.fill((h + i * 20) % 360, sat, bright, alpha * 0.4);
            p.ellipse(x + ox, y + oy, s, s);
          }
          break;

        case 'lines':
          for (let i = 0; i < 5 + reactiveVol * 8; i++) {
            const angle = p.random(p.TWO_PI);
            const len = p.random(size * 0.5, size * 2);
            p.stroke((h + i * 15) % 360, sat, bright, alpha * 0.6);
            p.strokeWeight(p.random(0.5, 2 + reactiveVol * 3));
            p.line(x, y, x + p.cos(angle) * len, y + p.sin(angle) * len);
            p.noStroke();
          }
          break;

        case 'splatter':
          for (let i = 0; i < 8 + reactiveVol * 15; i++) {
            const d = p.pow(p.random(), 2) * size * 2;
            const a = p.random(p.TWO_PI);
            const s = p.random(2, size * 0.4 + reactiveVol * 10);
            p.fill((h + d * 2) % 360, sat, bright, alpha * p.random(0.2, 0.8));
            p.ellipse(x + p.cos(a) * d, y + p.sin(a) * d, s, s);
          }
          break;

        case 'wave':
          p.stroke(h % 360, sat, bright, alpha * 0.5);
          p.strokeWeight(1 + reactiveVol * 3);
          p.noFill();
          p.beginShape();
          for (let a = 0; a < p.TWO_PI; a += 0.1) {
            const r = size * (0.5 + p.noise(p.cos(a) * 0.5 + p.frameCount * 0.01, p.sin(a) * 0.5) * (1 + reactiveVol * 2));
            p.curveVertex(x + p.cos(a) * r, y + p.sin(a) * r);
          }
          p.endShape(p.CLOSE);
          p.noStroke();
          break;
      }
    }

    p.keyPressed = () => {
      if (p.key === 'c' || p.key === 'C') {
        p.background(0, 0, cfg.invert ? 95 : 5);
      }
      if (p.key === 's' || p.key === 'S') {
        p.saveCanvas('sound-painter', 'png');
      }
      if (p.key === 'i' || p.key === 'I') {
        cfg.invert = !cfg.invert;
        document.getElementById('btn-invert').classList.toggle('active', cfg.invert);
      }
    };

    p.windowResized = () => { p.resizeCanvas(p.windowWidth, p.windowHeight); };
  };

  new p5(sketch);
}

// GUI
document.getElementById('gui-toggle').addEventListener('click', () => {
  document.getElementById('gui').classList.toggle('hidden');
});

function bindSlider(id, valId, key, parse) {
  const sl = document.getElementById(id);
  sl.addEventListener('input', () => {
    const v = parse ? parseFloat(sl.value) : parseInt(sl.value);
    document.getElementById(valId).textContent = v;
    cfg[key] = v;
  });
}
bindSlider('sl-sens', 'val-sens', 'sensitivity', true);
bindSlider('sl-brush', 'val-brush', 'brushSize', false);
bindSlider('sl-alpha', 'val-alpha', 'alpha', false);
bindSlider('sl-vel', 'val-vel', 'velocity', false);

document.getElementById('sel-style').addEventListener('change', e => { cfg.style = e.target.value; });

function bindToggle(btnId, cfgKey) {
  const btn = document.getElementById(btnId);
  btn.addEventListener('click', () => {
    cfg[cfgKey] = !cfg[cfgKey];
    btn.classList.toggle('active', cfg[cfgKey]);
  });
}
bindToggle('btn-reactive', 'reactive');
bindToggle('btn-auto', 'auto');
bindToggle('btn-invert', 'invert');

document.getElementById('btn-clear').addEventListener('click', () => {
  // Dispatch 'c' key event simulation
  const event = new KeyboardEvent('keydown', { key: 'c' });
  document.dispatchEvent(event);
  // direct clear — set a flag that the sketch can poll
  window._clearCanvas = true;
  setTimeout(() => window._clearCanvas = false, 100);
});