// p5.js sketch
const sketch = (p) => {
  let particles = [];
  let cfg = {
    count: 150,
    speed: 1.5,
    size: 3,
    connDist: 120,
    colorMode: 'green',
    attract: true,
    trail: true,
    burst: false
  };

  const colorPalettes = {
    green:   (h) => p.color(70 + h*10, 100, 60, 85),
    pink:    (h) => p.color(300 + h*10, 90, 65, 85),
    cyan:    (h) => p.color(185 + h*10, 90, 65, 85),
    rainbow: (h) => p.color(h * 360, 85, 65, 85),
    fire:    (h) => p.color(h * 40, 95, 65, 85)
  };

  function getColor(pct) {
    p.colorMode(p.HSB, 360, 100, 100, 100);
    const fn = colorPalettes[cfg.colorMode] || colorPalettes.green;
    return fn(pct);
  }

  class Particle {
    constructor() { this.reset(); }
    reset() {
      this.pos = p.createVector(p.random(p.width), p.random(p.height));
      this.vel = p5.Vector.random2D().mult(p.random(0.5, cfg.speed));
      this.acc = p.createVector(0, 0);
      this.id = p.random();
      this.life = p.random(0.4, 1.0);
    }
    applyForce(f) { this.acc.add(f); }
    update() {
      this.vel.add(this.acc);
      this.vel.limit(cfg.speed * 2.5);
      this.pos.add(this.vel);
      this.acc.mult(0);
      // wrap
      if (this.pos.x < 0) this.pos.x = p.width;
      if (this.pos.x > p.width) this.pos.x = 0;
      if (this.pos.y < 0) this.pos.y = p.height;
      if (this.pos.y > p.height) this.pos.y = 0;
    }
    draw() {
      p.colorMode(p.HSB, 360, 100, 100, 100);
      const c = getColor(this.id);
      p.noStroke();
      p.fill(c);
      const s = cfg.size * this.life;
      p.circle(this.pos.x, this.pos.y, s);
      // glow
      p.fill(p.hue(c), p.saturation(c), p.brightness(c), 20);
      p.circle(this.pos.x, this.pos.y, s * 3);
    }
    burst(cx, cy) {
      const d = p5.Vector.dist(this.pos, p.createVector(cx, cy));
      if (d < 200) {
        const f = p5.Vector.sub(this.pos, p.createVector(cx, cy));
        f.normalize().mult((200 - d) * 0.15);
        this.applyForce(f);
      }
    }
  }

  function syncCount() {
    while (particles.length < cfg.count) particles.push(new Particle());
    while (particles.length > cfg.count) particles.pop();
  }

  p.setup = () => {
    const cnv = p.createCanvas(p.windowWidth, p.windowHeight);
    cnv.parent('p5-canvas-container');
    p.colorMode(p.HSB, 360, 100, 100, 100);
    syncCount();
  };

  p.draw = () => {
    p.colorMode(p.RGB);
    if (cfg.trail) {
      p.fill(10, 10, 15, 30);
      p.noStroke();
      p.rect(0, 0, p.width, p.height);
    } else {
      p.background(10, 10, 15);
    }

    const mx = p.mouseX, my = p.mouseY;
    const mouseDown = p.mouseIsPressed;

    particles.forEach(pt => {
      if (mouseDown && cfg.attract) {
        const d = p.dist(pt.pos.x, pt.pos.y, mx, my);
        if (d < 250) {
          const f = p5.Vector.sub(p.createVector(mx, my), pt.pos);
          f.normalize().mult(0.6 * (250-d)/250);
          pt.applyForce(f);
        }
      }
      pt.update();
      pt.draw();
    });

    // Draw connections
    p.colorMode(p.HSB, 360, 100, 100, 100);
    for (let i = 0; i < particles.length; i++) {
      for (let j = i+1; j < particles.length; j++) {
        const d = p5.Vector.dist(particles[i].pos, particles[j].pos);
        if (d < cfg.connDist) {
          const alpha = p.map(d, 0, cfg.connDist, 40, 0);
          const c = getColor(particles[i].id);
          p.stroke(p.hue(c), p.saturation(c), p.brightness(c), alpha);
          p.strokeWeight(0.5);
          p.line(particles[i].pos.x, particles[i].pos.y, particles[j].pos.x, particles[j].pos.y);
        }
      }
    }

    // Update stats
    if (p.frameCount % 15 === 0) {
      document.getElementById('stat-fps').textContent = 'FPS: ' + Math.round(p.frameRate());
      document.getElementById('stat-parts').textContent = 'Partículas: ' + particles.length;
    }
  };

  p.mousePressed = () => {
    if (cfg.burst) {
      particles.forEach(pt => pt.burst(p.mouseX, p.mouseY));
    }
  };

  p.keyPressed = () => {
    if (p.key === 'c' || p.key === 'C') {
      p.background(10, 10, 15);
    }
    if (p.key === ' ') {
      const cx = p.width/2, cy = p.height/2;
      particles.forEach(pt => {
        const f = p5.Vector.sub(pt.pos, p.createVector(cx, cy));
        f.normalize().mult(p.random(3, 8));
        pt.applyForce(f);
      });
    }
    if (p.key === 'r' || p.key === 'R') {
      particles.forEach(pt => pt.reset());
    }
    if (p.key === '+' || p.key === '=') {
      cfg.count = Math.min(400, cfg.count + 20);
      document.getElementById('sl-count').value = cfg.count;
      document.getElementById('val-count').textContent = cfg.count;
      syncCount();
    }
    if (p.key === '-') {
      cfg.count = Math.max(20, cfg.count - 20);
      document.getElementById('sl-count').value = cfg.count;
      document.getElementById('val-count').textContent = cfg.count;
      syncCount();
    }
  };

  p.windowResized = () => { p.resizeCanvas(p.windowWidth, p.windowHeight); };

  // Expose cfg for GUI
  window._p5cfg = cfg;
  window._p5syncCount = syncCount;
  window._p5particles = particles;
};

new p5(sketch);

// GUI Controls
document.getElementById('gui-toggle').addEventListener('click', () => {
  document.getElementById('gui').classList.toggle('hidden');
});

function bindSlider(id, valId, key, parse) {
  const sl = document.getElementById(id);
  sl.addEventListener('input', () => {
    const v = parse ? parseFloat(sl.value) : parseInt(sl.value);
    document.getElementById(valId).textContent = v;
    window._p5cfg[key] = v;
    if (key === 'count' && window._p5syncCount) window._p5syncCount();
  });
}
bindSlider('sl-count', 'val-count', 'count', false);
bindSlider('sl-speed', 'val-speed', 'speed', true);
bindSlider('sl-size', 'val-size', 'size', true);
bindSlider('sl-conn', 'val-conn', 'connDist', false);

document.getElementById('sel-color').addEventListener('change', e => {
  window._p5cfg.colorMode = e.target.value;
});

function bindToggle(btnId, cfgKey) {
  const btn = document.getElementById(btnId);
  btn.addEventListener('click', () => {
    window._p5cfg[cfgKey] = !window._p5cfg[cfgKey];
    btn.classList.toggle('active', window._p5cfg[cfgKey]);
  });
}
bindToggle('btn-attract', 'attract');
bindToggle('btn-trail', 'trail');
bindToggle('btn-burst', 'burst');
document.getElementById('btn-repel').addEventListener('click', () => {
  window._p5cfg.attract = false;
  // flip attract
});