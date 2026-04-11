// Preview mini-animations for card 1
(function() {
  const c1 = document.getElementById('preview1');
  const ctx1 = c1.getContext('2d');
  let particles = [];
  let w, h;
  function resize1() {
    w = c1.offsetWidth; h = c1.offsetHeight;
    c1.width = w; c1.height = h;
  }
  resize1();
  for (let i = 0; i < 80; i++) {
    particles.push({
      x: Math.random()*w, y: Math.random()*h,
      vx: (Math.random()-0.5)*1.5, vy: (Math.random()-0.5)*1.5,
      size: Math.random()*3+1,
      hue: 70 + Math.random()*20
    });
  }
  function draw1() {
    ctx1.fillStyle = 'rgba(10,10,15,0.2)';
    ctx1.fillRect(0,0,w,h);
    particles.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > w) p.vx *= -1;
      if (p.y < 0 || p.y > h) p.vy *= -1;
      ctx1.beginPath();
      ctx1.arc(p.x, p.y, p.size, 0, Math.PI*2);
      ctx1.fillStyle = `hsla(${p.hue},100%,55%,0.85)`;
      ctx1.fill();
      particles.forEach(q => {
        const d = Math.hypot(p.x-q.x, p.y-q.y);
        if (d < 80) {
          ctx1.beginPath();
          ctx1.moveTo(p.x, p.y); ctx1.lineTo(q.x, q.y);
          ctx1.strokeStyle = `hsla(${p.hue},100%,55%,${0.15*(1-d/80)})`;
          ctx1.lineWidth = 0.5;
          ctx1.stroke();
        }
      });
    });
    requestAnimationFrame(draw1);
  }
  draw1();
})();

// Preview mini-animation for card 2
(function() {
  const c2 = document.getElementById('preview2');
  const ctx2 = c2.getContext('2d');
  let w, h, t = 0;
  function resize2() {
    w = c2.offsetWidth; h = c2.offsetHeight;
    c2.width = w; c2.height = h;
  }
  resize2();
  function draw2() {
    ctx2.fillStyle = 'rgba(10,10,15,0.15)';
    ctx2.fillRect(0,0,w,h);
    for (let i = 0; i < 8; i++) {
      const amp = 30 + Math.sin(t*0.3+i)*20;
      ctx2.beginPath();
      for (let x = 0; x < w; x += 3) {
        const y = h/2 + Math.sin(x*0.02 + t + i*0.7) * amp + Math.sin(x*0.05 + t*1.3)*15;
        x === 0 ? ctx2.moveTo(x, y) : ctx2.lineTo(x, y);
      }
      ctx2.strokeStyle = `hsla(${300+i*15},90%,65%,0.4)`;
      ctx2.lineWidth = 1.5;
      ctx2.stroke();
    }
    t += 0.03;
    requestAnimationFrame(draw2);
  }
  draw2();
})();