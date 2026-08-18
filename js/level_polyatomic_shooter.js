/* ============================================================
 * 關卡 4 · 多原子離子射擊場（DOOM 風格第一身射擊）
 * ------------------------------------------------------------
 * 玩法：
 *  - 玩之前揀語言：繁體中文 / English（怪獸名用對應語言顯示）。
 *  - WASD 移動、鼠標瞄準（桌面用 Pointer Lock，手機拖動睇 + 射擊掣）。
 *  - 怪獸 = 離子（陽離子/陰離子），會一路行近玩家並發射火球。
 *  - 玩家揀「正電荷 / 負電荷」子彈射擊：
 *      怪獸電荷 +1 → 1 槍正電荷子彈就死
 *      怪獸電荷 −2 → 要 2 槍負電荷子彈
 *      怪獸電荷 −3 → 要 3 槍負電荷子彈（視乎吓數 = |電荷|，極性要啱）
 *  - 清光所有怪獸 = 通關。
 * 難度：16 隻怪獸（正負各半、分散於迷宮）、速度慢、火球傷低。
 * 技術：本地 three.min.js（js/lib）。
 * ============================================================ */
window.ChemRPG = window.ChemRPG || {};
ChemRPG.games = ChemRPG.games || {};

(function () {
  const NS = window.ChemRPG;

  // 多原子離子（f=化學式含電荷，b=基礎化學式不含電荷，zh/en=中英文名，z=電荷；擊殺所需槍數 = |z|）
  const IONS = [
    // —— 正電荷（陽離子，冷色系）——
    { f: 'NH₄⁺',  b: 'NH₄',  zh: '銨',     en: 'Ammonium',     z: 1, c: 0x60a5fa },
    { f: 'K⁺',    b: 'K',    zh: '鉀',     en: 'Potassium',    z: 1, c: 0x34d399 },
    { f: 'Ca²⁺',  b: 'Ca',   zh: '鈣',     en: 'Calcium',      z: 2, c: 0x22d3ee },
    { f: 'Cu²⁺',  b: 'Cu',   zh: '銅',     en: 'Copper',       z: 2, c: 0x818cf8 },
    { f: 'Al³⁺',  b: 'Al',   zh: '鋁',     en: 'Aluminium',    z: 3, c: 0xa78bfa },
    // —— 負電荷（陰離子 / 多原子根，暖色系）——
    { f: 'OH⁻',   b: 'OH',   zh: '氫氧根', en: 'Hydroxide',    z: -1, c: 0xf472b6 },
    { f: 'NO₃⁻',  b: 'NO₃',  zh: '硝酸根', en: 'Nitrate',      z: -1, c: 0xef4444 },
    { f: 'CO₃²⁻', b: 'CO₃',  zh: '碳酸根', en: 'Carbonate',    z: -2, c: 0xfbbf24 },
    { f: 'SO₄²⁻', b: 'SO₄',  zh: '硫酸根', en: 'Sulfate',      z: -2, c: 0xfb923c },
    { f: 'PO₄³⁻', b: 'PO₄',  zh: '磷酸根', en: 'Phosphate',    z: -3, c: 0xd946ef },
  ];

  const T = {
    zh: {
      title: '🔫 多原子離子射擊場',
      pickLang: '選擇語言', start: '開始遊戲',
      howto: '🕹️ WASD 移動、移動鼠標瞄準、撳一下射擊。撳 K（或 ＋/－ 掣、Q/E）切換「正 / 負電荷」子彈。怪獸頭上只顯示離子名（唔會顯示電荷多少）——你要記住佢嘅電荷！只有電荷極性啱嘅子彈先會傷到佢，槍數 = |電荷|。行過會留低藍色腳印，幫你記住行過邊度、唔會喺迷宮蕩失路。打錯極性（用錯電荷）唔會傷到佢，反而令佢過充、更難打，所以一定要用啱極性！',
      health: '❤️ 生命', monsters: '👾 怪獸', kills: '💀 擊殺', time: '⏱ 時間',
      pos: '＋ 正電荷', neg: '－ 負電荷', switch: '（K / Q E 或撳掣切換）',
      win: '🎉 通關！你擊敗咗所有離子怪獸！', lose: '💥 你被離子怪獸消滅咗',
    },
    en: {
      title: '🔫 Polyatomic Ion Shooter',
      pickLang: 'Select Language', start: 'Start Game',
      howto: '🕹️ WASD to move, mouse to aim, click to shoot. Press K (or ＋/－ buttons, Q/E) to switch "positive/negative" bullets. Monsters show only the ion name — NOT its charge — so you must remember it! Only bullets whose charge sign matches hurt them, and shots needed = |charge|. Your footsteps glow blue on the floor so you can trace where you have been. Firing the WRONG polarity overcharges the monster and makes it tougher, so always match the sign!',
      health: '❤️ Health', monsters: '👾 Monsters', kills: '💀 Kills', time: '⏱ Time',
      pos: '＋ Positive', neg: '－ Negative', switch: '(K / Q E or buttons to switch)',
      win: '🎉 Level Clear! You defeated all ion monsters!', lose: '💥 You were consumed by ion monsters',
    },
  };

  function loadThree(done) {
    if (window.THREE) { done(true); return; }
    const s = document.createElement('script');
    s.src = 'js/lib/three.min.js';
    s.onload = () => done(true);
    s.onerror = () => done(false);
    document.head.appendChild(s);
  }
  function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[a[i], a[j]] = [a[j], a[i]]; } return a; }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function rand(a, b) { return a + Math.random() * (b - a); }

  // ---------- 音效（Web Audio 程序生成：陰森背景音樂 + 射擊/死亡/受擊聲，唔使外部音樂檔）----------
  let actx = null, masterGain = null, ambience = null, muted = false;
  function ensureAudio() {
    if (!actx) {
      try { const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null; actx = new AC(); } catch (e) { return null; }
      masterGain = actx.createGain(); masterGain.gain.value = muted ? 0 : 0.9; masterGain.connect(actx.destination);
    }
    if (actx.state === 'suspended' && actx.resume) actx.resume();
    return actx;
  }
  function makeNoiseBuffer() {
    const len = Math.floor(actx.sampleRate * 2);
    const buf = actx.createBuffer(1, len, actx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * 0.5;
    return buf;
  }
  function startAmbience() {
    if (!ensureAudio() || ambience) return;
    const t = actx.currentTime;
    const g = actx.createGain(); g.gain.value = 0; g.connect(masterGain);
    const o1 = actx.createOscillator(); o1.type = 'sine'; o1.frequency.value = 55;
    const o2 = actx.createOscillator(); o2.type = 'triangle'; o2.frequency.value = 77.8;   // 增四度（三全音）詭異感
    const o3 = actx.createOscillator(); o3.type = 'sine'; o3.frequency.value = 110; o3.detune.value = -7;
    const lp = actx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 430;
    o1.connect(lp); o2.connect(lp); o3.connect(lp); lp.connect(g);
    const lfo = actx.createOscillator(); lfo.frequency.value = 0.07;                         // 「呼吸」起伏
    const lfoG = actx.createGain(); lfoG.gain.value = 0.06; lfo.connect(lfoG); lfoG.connect(g.gain);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.16, t + 3);
    o1.start(); o2.start(); o3.start(); lfo.start();
    const noise = actx.createBufferSource(); noise.buffer = makeNoiseBuffer(); noise.loop = true;  // 風聲
    const bp = actx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 520; bp.Q.value = 0.6;
    const ng = actx.createGain(); ng.gain.value = 0.05;
    noise.connect(bp); bp.connect(ng); ng.connect(masterGain);
    const nlfo = actx.createOscillator(); nlfo.frequency.value = 0.05;
    const nlfoG = actx.createGain(); nlfoG.gain.value = 200; nlfo.connect(nlfoG); nlfoG.connect(bp.frequency);
    noise.start(); nlfo.start();
    ambience = { nodes: [o1, o2, o3, lfo, noise, nlfo], g: g };
    ambience.timer = setInterval(() => { if (!muted && actx && actx.state === 'running') eeriePing(); }, 4200);
  }
  function eeriePing() {
    if (!actx) return;
    const scale = [220, 261.63, 311.13, 349.23, 415.30];   // 小調音階感
    const f = scale[Math.floor(Math.random() * scale.length)] * (Math.random() < 0.5 ? 2 : 4);
    const o = actx.createOscillator(); o.type = 'sine'; o.frequency.value = f;
    const gg = actx.createGain(); gg.gain.value = 0; o.connect(gg); gg.connect(masterGain);
    const t = actx.currentTime; gg.gain.linearRampToValueAtTime(0.05, t + 0.05); gg.gain.exponentialRampToValueAtTime(0.0004, t + 2.2);
    o.start(t); o.stop(t + 2.3);
  }
  function stopAmbience() {
    if (!ambience) return;
    const a = ambience; ambience = null; clearInterval(a.timer);
    if (!actx) return;
    const t = actx.currentTime;
    try { a.g.gain.cancelScheduledValues(t); a.g.gain.linearRampToValueAtTime(0, t + 0.4); a.nodes.forEach(n => { try { n.stop(t + 0.5); } catch (e) {} }); } catch (e) {}
  }
  function playShoot(sign) {
    if (!ensureAudio() || muted) return;
    const t = actx.currentTime;
    const o = actx.createOscillator(); o.type = 'sawtooth';
    const base = sign > 0 ? 1300 : 620, end = sign > 0 ? 330 : 150;   // 正電荷較亮、負電荷較暗
    o.frequency.setValueAtTime(base, t); o.frequency.exponentialRampToValueAtTime(end, t + 0.14);
    const lp = actx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = sign > 0 ? 3600 : 1500;
    const g = actx.createGain(); g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.22, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
    o.connect(lp); lp.connect(g); g.connect(masterGain); o.start(t); o.stop(t + 0.2);
  }
  function playKill() {
    if (!ensureAudio() || muted) return;
    const t = actx.currentTime;
    const o = actx.createOscillator(); o.type = 'square';
    o.frequency.setValueAtTime(420, t); o.frequency.exponentialRampToValueAtTime(55, t + 0.35);
    const g = actx.createGain(); g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.2, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
    o.connect(g); g.connect(masterGain); o.start(t); o.stop(t + 0.42);
  }
  function playHurt() {
    if (!ensureAudio() || muted) return;
    const t = actx.currentTime;
    const o = actx.createOscillator(); o.type = 'sawtooth';
    o.frequency.setValueAtTime(170, t); o.frequency.exponentialRampToValueAtTime(48, t + 0.3);
    const lp = actx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 820;
    const g = actx.createGain(); g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.28, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
    o.connect(lp); lp.connect(g); g.connect(masterGain); o.start(t); o.stop(t + 0.37);
  }

  NS.games['polyatomic-shooter'] = {
    meta: { title: '多原子離子射擊場', timeLimit: 0 },

    start(container, onComplete) {
      const self = this;
      loadThree(function (ok) {
        if (!ok) {
          container.innerHTML = `<div class="placeholder"><div class="ph-icon">⚠️</div><h2>3D 載入失敗</h2>
            <p>需要 js/lib/three.min.js。請經伺服器（或 Netlify）開啟，唔好直接用 file:// 開。</p>
            <button class="btn" id="ph-back">🏰 返回大廳</button></div>`;
          container.querySelector('#ph-back').onclick = () => { if (NS.ui && NS.ui.lobby) NS.ui.lobby(); };
          return;
        }
        self._run(container, onComplete);
      });
    },

    _run(container, onComplete) {
      const meta = this.meta;
      const THREE = window.THREE;
      const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

      let lang = 'zh';
      const S = () => T[lang];

      // ---------- 開始 / 語言選擇畫面 ----------
      function showStart() {
        container.innerHTML = `
          <div id="lang-screen">
            <h2>${T.zh.title}</h2>
            <p class="pick">${S().pickLang} / Select Language</p>
            <div class="lang-row">
              <button class="lang-btn sel" data-l="zh">🇭🇰 繁體中文</button>
              <button class="lang-btn" data-l="en">🌐 English</button>
            </div>
            <p id="lang-howto">${S().howto}</p>
            <button class="btn big" id="start-btn">▶ ${S().start}</button>
          </div>`;
        container.querySelectorAll('.lang-btn').forEach(b => {
          b.onclick = () => {
            lang = b.dataset.l;
            container.querySelectorAll('.lang-btn').forEach(x => x.classList.remove('sel'));
            b.classList.add('sel');
            container.querySelector('#lang-howto').textContent = S().howto;
            container.querySelector('#start-btn').textContent = '▶ ' + S().start;
          };
        });
        container.querySelector('#start-btn').onclick = () => { ensureAudio(); beginGame(); };
      }

      // ---------- 世界參數 ----------
      const CELL = 4, GRID = 15, HALF = (GRID - 1) / 2;
      const WALL_H = 3.6;
      const MAX_HP = 100;
      const TOTAL = 16;                // 16 隻怪獸（正負各半）
      const MON_SPEED = 2.2;           // 慢速（唔難）
      const FIRE_INTERVAL = 2.8;
      const FIRE_SPEED = 10, FIRE_DMG = 6;
      const BULLET_SPEED = 32;
      const PLAYER_SPEED = 6;
      const EYE = 1.6;

      let grid = [];
      let scene, camera, renderer, clock;
      let player = { x: 0, z: 0 }, yaw = 0, pitch = 0;
      let monsters = [], bullets = [], fireballs = [], effects = [], footprints = [];
      let hp = MAX_HP, kills = 0, elapsed = 0, currentSign = 1;
      let started = false, ended = false, locked = false;
      let rafId = null, hudTimer = null, cv = null;
      let onPointerLockRef = null, onMouseDownRef = null;
      const keys = {};
      const stick = { x: 0, y: 0 };
      let footGeo = null, footMat = null;
      let lastFootX = 0, lastFootZ = 0, footSide = false;

      function cellToWorld(cx, cy) { return { x: (cx - HALF) * CELL, z: (cy - HALF) * CELL }; }
      function worldToCell(x, z) { return { cx: Math.round(x / CELL + HALF), cy: Math.round(z / CELL + HALF) }; }
      function inBounds(cx, cy) { return cx >= 0 && cx < GRID && cy >= 0 && cy < GRID; }
      function isWall(x, z) {
        const c = worldToCell(x, z);
        if (!inBounds(c.cx, c.cy)) return true;
        return grid[c.cy][c.cx] === 1;
      }
      function blocked(x, z) {
        const r = 0.55;
        return isWall(x - r, z - r) || isWall(x + r, z - r) || isWall(x - r, z + r) || isWall(x + r, z + r);
      }

      // ---------- 迷宮生成（遞迴回溯 + 少量開放）----------
      function genMaze() {
        grid = [];
        for (let y = 0; y < GRID; y++) grid.push(new Array(GRID).fill(1));
        function carve(x, y) {
          grid[y][x] = 0;
          for (const [dx, dy] of shuffle([[2, 0], [-2, 0], [0, 2], [0, -2]])) {
            const nx = x + dx, ny = y + dy;
            if (nx > 0 && nx < GRID - 1 && ny > 0 && ny < GRID - 1 && grid[ny][nx] === 1) {
              grid[y + dy / 2][x + dx / 2] = 0; carve(nx, ny);
            }
          }
        }
        carve(1, 1);
        // 開放約 12% 內牆，變成有房有走廊（唔會太密）
        for (let y = 2; y < GRID - 2; y++) for (let x = 2; x < GRID - 2; x++) {
          if (grid[y][x] === 1 && Math.random() < 0.12) grid[y][x] = 0;
        }
        // 開局呼吸位：清出 3×3 空間
        for (let y = 1; y <= 3; y++) for (let x = 1; x <= 3; x++) grid[y][x] = 0;
      }

      // ---------- 程序化石材紋理（裝飾）----------
      function stoneTex(base, line) {
        const c = document.createElement('canvas'); c.width = c.height = 128;
        const g = c.getContext('2d');
        g.fillStyle = base; g.fillRect(0, 0, 128, 128);
        for (let i = 0; i < 220; i++) {
          g.fillStyle = 'rgba(255,255,255,' + (Math.random() * 0.05) + ')';
          g.fillRect(Math.random() * 128, Math.random() * 128, 2, 2);
        }
        g.strokeStyle = line; g.lineWidth = 3;
        for (let i = 0; i <= 128; i += 32) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 128); g.moveTo(0, i); g.lineTo(128, i); g.stroke(); }
        const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
      }

      function makeLabel(text, sub) {
        const c = document.createElement('canvas'); c.width = 256; c.height = 160;
        const g = c.getContext('2d');
        g.font = 'bold 30px sans-serif'; g.textAlign = 'center';
        g.fillStyle = 'rgba(0,0,0,.6)'; g.fillRect(0, 0, 256, 160);
        g.strokeStyle = 'rgba(255,255,255,.25)'; g.strokeRect(4, 4, 248, 152);
        g.fillStyle = '#fff'; g.textBaseline = 'middle';
        g.font = 'bold 56px "PingFang HK","Noto Sans CJK SC",sans-serif';
        g.fillText(text, 128, sub ? 70 : 80);
        if (sub) { g.font = 'bold 26px sans-serif'; g.fillStyle = '#ffd479'; g.fillText(sub, 128, 120); }
        const t = new THREE.CanvasTexture(c);
        const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true }));
        sp.scale.set(3.2, 2.0, 1); return sp;
      }

      // 腳印紋理（行過留低軌跡，防迷路）
      function footTex() {
        const c = document.createElement('canvas'); c.width = c.height = 48;
        const g = c.getContext('2d');
        g.clearRect(0, 0, 48, 48);
        g.fillStyle = 'rgba(150,225,255,0.9)';
        g.beginPath(); g.ellipse(24, 31, 11, 15, 0, 0, Math.PI * 2); g.fill();   // 腳掌
        g.beginPath(); g.ellipse(24, 12, 8, 7, 0, 0, Math.PI * 2); g.fill();      // 腳踭
        return new THREE.CanvasTexture(c);
      }

      // 怪獸頭上嘅「電荷格」：顯示剩餘要打幾多下（即時回饋）。過充時變紅色警告。
      function chargeTex(hp, col, over) {
        const c = document.createElement('canvas'); c.width = 256; c.height = 64;
        const g = c.getContext('2d'); g.clearRect(0, 0, 256, 64);
        const n = Math.max(0, Math.round(hp));
        const r = 9, gap = 22, startX = 128 - (n - 1) * gap / 2;
        for (let i = 0; i < n; i++) {
          g.beginPath(); g.arc(startX + i * gap, 32, r, 0, Math.PI * 2);
          g.fillStyle = over ? '#ff5555' : 'rgba(255,255,255,.92)'; g.fill();
          g.lineWidth = 3; g.strokeStyle = over ? '#ffaa00' : ('#' + col.toString(16).padStart(6, '0')); g.stroke();
        }
        return new THREE.CanvasTexture(c);
      }

      function buildWorld() {
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x0a0a18);
        scene.fog = new THREE.FogExp2(0x0a0a18, 0.022);

        camera = new THREE.PerspectiveCamera(72, 1, 0.1, 200);
        camera.rotation.order = 'YXZ';

        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.domElement.id = 'fps-canvas';
        const hudEl = container.querySelector('#hud') || container;
        hudEl.appendChild(renderer.domElement);

        scene.add(new THREE.AmbientLight(0x6677aa, 0.7));
        const hemi = new THREE.HemisphereLight(0x8899ff, 0x221133, 0.5); scene.add(hemi);

        const floorTex = stoneTex('#1b1b2e', 'rgba(120,120,180,.25)'); floorTex.repeat.set(GRID, GRID);
        const floor = new THREE.Mesh(new THREE.PlaneGeometry(GRID * CELL, GRID * CELL),
          new THREE.MeshStandardMaterial({ map: floorTex, roughness: 1 }));
        floor.rotation.x = -Math.PI / 2; scene.add(floor);
        const ceilTex = stoneTex('#15152a', 'rgba(90,90,140,.2)'); ceilTex.repeat.set(GRID, GRID);
        const ceil = new THREE.Mesh(new THREE.PlaneGeometry(GRID * CELL, GRID * CELL),
          new THREE.MeshStandardMaterial({ map: ceilTex, roughness: 1 }));
        ceil.rotation.x = Math.PI / 2; ceil.position.y = WALL_H; scene.add(ceil);

        // 腳印：平面貼地、半透明、不寫深度（避免 z-fighting）
        footGeo = new THREE.PlaneGeometry(0.5, 0.7);
        footMat = new THREE.MeshBasicMaterial({ map: footTex(), transparent: true, opacity: 0.5, depthWrite: false, color: 0xaff2ff });

        const wallTex = stoneTex('#2a2440', 'rgba(150,140,200,.3)');
        const wallMat = new THREE.MeshStandardMaterial({ map: wallTex, roughness: 0.9 });
        const wg = new THREE.BoxGeometry(CELL, WALL_H, CELL);
        const decoCells = [];
        for (let y = 0; y < GRID; y++) for (let x = 0; x < GRID; x++) {
          if (grid[y][x] === 1) {
            const w = cellToWorld(x, y);
            const m = new THREE.Mesh(wg, wallMat); m.position.set(w.x, WALL_H / 2, w.z); scene.add(m);
          } else if (Math.random() < 0.05) decoCells.push([x, y]);
        }
        // 火把裝飾（氛圍光）
        decoCells.slice(0, 5).forEach(([x, y]) => {
          const w = cellToWorld(x, y);
          const torch = new THREE.PointLight(0xff8844, 0.9, 12); torch.position.set(w.x, 2.4, w.z); scene.add(torch);
        });

        // 玩家起點
        const sp = cellToWorld(2, 2); player.x = sp.x; player.z = sp.z;
      }

      function spawnMonsters() {
        // 收集離起點夠遠嘅地板格
        const floors = [];
        for (let y = 0; y < GRID; y++) for (let x = 0; x < GRID; x++) {
          if (grid[y][x] === 0) {
            const w = cellToWorld(x, y);
            const d = Math.hypot(w.x - player.x, w.z - player.z);
            if (d > 14) floors.push(w);
          }
        }
        // 揀位：盡量分散（相隔 >5 單位），唔好一舖圍埋一齊
        const cand = shuffle(floors); const picks = [];
        for (const f of cand) {
          if (picks.length >= TOTAL) break;
          if (picks.every(c => Math.hypot(c.x - f.x, c.z - f.z) > 5)) picks.push(f);
        }
        let k = 0;
        while (picks.length < TOTAL && k < cand.length) { if (!picks.includes(cand[k])) picks.push(cand[k]); k++; }
        // 正負各半：8 隻正 + 8 隻負（同一隻離子可以重複出現）
        const pos = IONS.filter(i => i.z > 0), neg = IONS.filter(i => i.z < 0);
        const ionPicks = [];
        for (let i = 0; i < TOTAL / 2; i++) ionPicks.push(pos[Math.floor(Math.random() * pos.length)]);
        for (let i = 0; i < TOTAL / 2; i++) ionPicks.push(neg[Math.floor(Math.random() * neg.length)]);
        const ions = shuffle(ionPicks);
        monsters = ions.map((ion, i) => {
          const p = picks[i] || cellToWorld(7, 7);
          const col = ion.c;
          const body = new THREE.Mesh(new THREE.IcosahedronGeometry(0.95, 1),
            new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 0.25, roughness: 0.5, flatShading: true }));
          // 眼
          const eyeMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
          const pupMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
          const eL = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 10), eyeMat); eL.position.set(-0.32, 0.25, 0.8);
          const eR = eL.clone(); eR.position.x = 0.32;
          const pL = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), pupMat); pL.position.set(-0.32, 0.25, 0.95);
          const pR = pL.clone(); pR.position.x = 0.32;
          body.add(eL); body.add(eR); body.add(pL); body.add(pR);
          const label = makeLabel(ion.b, (lang === 'zh' ? ion.zh : ion.en));
          const grp = new THREE.Group();
          grp.add(body); grp.add(label); label.position.y = 1.5;
          // 電荷格（剩餘要打幾多下，即時回饋）
          const chargeLabel = new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true }));
          chargeLabel.material.map = chargeTex(Math.abs(ion.z), ion.c, false);
          chargeLabel.scale.set(3.0, 0.75, 1);
          grp.add(chargeLabel); chargeLabel.position.y = 2.4;
          grp.position.set(p.x, 1.1, p.z); scene.add(grp);
          return { grp, body, label, chargeLabel, ion, hp: Math.abs(ion.z), hpMax: Math.abs(ion.z), overT: 0, alive: true, pos: { x: p.x, z: p.z }, phase: Math.random() * 6, fireT: rand(1, FIRE_INTERVAL) };
        });
      }

      function shoot() {
        if (!started || ended) return;
        camera.updateMatrixWorld(true);
        const dir = camera.getWorldDirection(new THREE.Vector3());
        const col = currentSign > 0 ? 0x5eead4 : 0xfb7185;
        const m = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 10),
          new THREE.MeshBasicMaterial({ color: col }));
        m.position.copy(camera.position);
        scene.add(m);
        bullets.push({ mesh: m, vel: dir.multiplyScalar(BULLET_SPEED), sign: currentSign, life: 2 });
        playShoot(currentSign);
        // 準星反饋
        const ch = container.querySelector('#crosshair'); if (ch) { ch.style.transform = 'translate(-50%,-50%) scale(1.5)'; setTimeout(() => ch && (ch.style.transform = 'translate(-50%,-50%) scale(1)'), 90); }
      }

      function spawnFireball(m) {
        const start = new THREE.Vector3(m.pos.x, 1.1, m.pos.z);
        const dir = new THREE.Vector3(player.x - start.x, (EYE - 1.1), player.z - start.z).normalize();
        const fb = new THREE.Mesh(new THREE.SphereGeometry(0.3, 10, 10), new THREE.MeshBasicMaterial({ color: 0xff7a33 }));
        fb.position.copy(start); scene.add(fb);
        fireballs.push({ mesh: fb, vel: dir.multiplyScalar(FIRE_SPEED), life: 4 });
      }

      function updateChargePips(m) {
        if (!m.chargeLabel) return;
        const old = m.chargeLabel.material.map;
        m.chargeLabel.material.map = chargeTex(m.hp, m.ion.c, m.hp > m.hpMax);
        m.chargeLabel.material.needsUpdate = true;
        if (old) old.dispose();
      }

      function killMonster(m) {
        m.alive = false; kills++;
        playKill();
        // 死亡特效：放大嘅光環
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.12, 8, 20),
          new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true }));
        ring.position.set(m.pos.x, 1.1, m.pos.z); ring.rotation.x = Math.PI / 2; scene.add(ring);
        effects.push({ mesh: ring, life: 0.5 });
        scene.remove(m.grp); m.body.geometry.dispose(); m.body.material.dispose();
        m.label.material.map.dispose(); m.label.material.dispose();
        if (m.chargeLabel) { m.chargeLabel.material.map.dispose(); m.chargeLabel.material.dispose(); }
        updateHud();
        if (kills >= TOTAL) finish(true);
      }

      function damagePlayer(d) {
        hp = Math.max(0, hp - d);
        playHurt();
        const f = container.querySelector('#dmg-flash'); if (f) { f.style.opacity = '0.6'; setTimeout(() => f && (f.style.opacity = '0'), 120); }
        updateHud();
        if (hp <= 0) finish(false);
      }

      function updateHud() {
        const h = container.querySelector('#h-health'); if (h) h.textContent = S().health + ' ' + hp;
        const mn = container.querySelector('#h-mon'); if (mn) mn.textContent = S().monsters + ' ' + monsters.filter(m => m.alive).length;
        const k = container.querySelector('#h-kills'); if (k) k.textContent = S().kills + ' ' + kills;
        const t = container.querySelector('#h-time'); if (t) t.textContent = S().time + ' ' + Math.floor(elapsed) + 's';
        const pos = container.querySelector('#cb-pos'), neg = container.querySelector('#cb-neg');
        if (pos) pos.classList.toggle('active', currentSign > 0);
        if (neg) neg.classList.toggle('active', currentSign < 0);
      }

      function beginGame() {
        container.innerHTML = `
          <div id="hud">
            <div id="hud-top">
              <span id="h-health"></span><span id="h-mon"></span><span id="h-kills"></span><span id="h-time"></span>
              <button id="mute-btn" class="hud-mini" type="button">🔊</button>
            </div>
            <div id="crosshair">✛</div>
            <div id="joy" class="touch-only"><div id="joy-knob"></div></div>
            <div id="hud-bottom">
              <button class="charge-btn" id="cb-pos">＋ 正</button>
              <button class="charge-btn" id="cb-neg">－ 負</button>
              <button class="charge-btn" id="cb-toggle">🔄 切換</button>
              <button class="act-btn" id="shoot-btn">🔫 ${lang === 'zh' ? '射擊' : 'Shoot'}</button>
            </div>
            <div id="dmg-flash"></div>
            <div id="orient-tip"><div><div class="rot">🔄</div>請將手機橫置<br><span>Rotate your phone to landscape</span></div></div>
          </div>`;
        container.querySelector('#cb-pos').onclick = () => { currentSign = 1; updateHud(); };
        container.querySelector('#cb-neg').onclick = () => { currentSign = -1; updateHud(); };
        container.querySelector('#cb-toggle').onclick = () => { currentSign = -currentSign; updateHud(); };
        container.querySelector('#mute-btn').onclick = () => { muted = !muted; if (masterGain) masterGain.gain.value = muted ? 0 : 0.9; container.querySelector('#mute-btn').textContent = muted ? '🔇' : '🔊'; };
        container.querySelector('#shoot-btn').onclick = () => shoot();

        // 手機：虛擬搖桿移動
        const joyEl = container.querySelector('#joy');
        const knobEl = container.querySelector('#joy-knob');
        let joyId = null, joyCx = 0, joyCy = 0; const joyMax = 46;
        function joyStart(e) {
          joyId = e.pointerId;
          const r = joyEl.getBoundingClientRect();
          joyCx = r.left + r.width / 2; joyCy = r.top + r.height / 2;
          try { joyEl.setPointerCapture(e.pointerId); } catch (err) {}
          joyMove(e);
        }
        function joyMove(e) {
          if (e.pointerId !== joyId) return;
          let dx = e.clientX - joyCx, dy = e.clientY - joyCy;
          const dist = Math.hypot(dx, dy);
          if (dist > joyMax) { dx = dx / dist * joyMax; dy = dy / dist * joyMax; }
          knobEl.style.transform = 'translate(calc(-50% + ' + dx + 'px), calc(-50% + ' + dy + 'px))';
          stick.x = dx / joyMax; stick.y = -dy / joyMax;
        }
        function joyEnd(e) {
          if (e.pointerId !== joyId) return;
          joyId = null; knobEl.style.transform = 'translate(-50%, -50%)'; stick.x = 0; stick.y = 0;
        }
        joyEl.addEventListener('pointerdown', joyStart);
        joyEl.addEventListener('pointermove', joyMove);
        joyEl.addEventListener('pointerup', joyEnd);
        joyEl.addEventListener('pointercancel', joyEnd);

        // 手機：橫向全畫面 + 豎屏提示
        checkOrient();
        window.addEventListener('orientationchange', checkOrient);
        try { const hudNow = container.querySelector('#hud'); if (hudNow && hudNow.requestFullscreen) hudNow.requestFullscreen().catch(() => {}); } catch (e) {}

        genMaze();
        buildWorld();
        lastFootX = player.x; lastFootZ = player.z; footSide = false; footprints.length = 0;
        spawnMonsters();
        started = true;
        startAmbience();

        cv = renderer.domElement;
        cv.tabIndex = 0; try { cv.focus(); window.focus(); } catch (e) {}
        cv.addEventListener('click', () => { ensureAudio(); if (!isTouch && !locked && cv.requestPointerLock) { try { window.focus(); } catch (e) {} cv.requestPointerLock(); } });
        onPointerLockRef = () => { locked = (document.pointerLockElement === cv); };
        document.addEventListener('pointerlockchange', onPointerLockRef);
        document.addEventListener('mousemove', onMouseMove);
        onMouseDownRef = (e) => { if (locked && e.button === 0) shoot(); };
        document.addEventListener('mousedown', onMouseDownRef);
        window.addEventListener('keydown', onKeyDownRef);
        window.addEventListener('keyup', onKeyUpRef);
        // 手機：拖動睇 + 撳一下射擊
        let drag = false, lx = 0, ly = 0, mv = 0;
        cv.addEventListener('pointerdown', e => { if (isTouch) { drag = true; lx = e.clientX; ly = e.clientY; mv = 0; try { cv.setPointerCapture(e.pointerId); } catch (err) {} } });
        cv.addEventListener('pointermove', e => { if (isTouch && drag) { const dx = e.clientX - lx, dy = e.clientY - ly; lx = e.clientX; ly = e.clientY; mv += Math.abs(dx) + Math.abs(dy); yaw -= dx * 0.005; pitch = clamp(pitch - dy * 0.005, -1.2, 1.2); } });
        cv.addEventListener('pointerup', () => { if (isTouch) { drag = false; if (mv < 8) shoot(); } });
        window.addEventListener('resize', onResize);

        updateHud();
        clock = new THREE.Clock();
        resize();
        animate();
      }

      function onMouseMove(e) {
        if (!locked) return;
        yaw -= e.movementX * 0.0022;
        pitch = clamp(pitch - e.movementY * 0.0022, -1.2, 1.2);
      }
      function checkOrient() {
        const tip = container.querySelector('#orient-tip');
        if (!tip) return;
        const portrait = window.innerHeight > window.innerWidth;
        const mobile = isTouch;
        tip.style.display = (mobile && portrait) ? 'flex' : 'none';
      }
      function onResize() {
        if (!renderer) return;
        const box = container.querySelector('#hud') || container;
        const w = box.clientWidth, h = box.clientHeight;
        if (!w || !h) return;
        camera.aspect = w / h; camera.updateProjectionMatrix(); renderer.setSize(w, h, false);
        checkOrient();
      }
      function resize() {
        const box = container.querySelector('#hud') || container;
        const w = box.clientWidth, h = box.clientHeight;
        if (!w || !h) return;
        renderer.domElement.style.width = '100%'; renderer.domElement.style.height = '100%';
        camera.aspect = w / h; camera.updateProjectionMatrix(); renderer.setSize(w, h, false);
      }

      function animate() {
        rafId = requestAnimationFrame(animate);
        const dt = Math.min(clock.getDelta(), 0.05);
        elapsed += dt;
        const t = clock.elapsedTime;

        // 玩家移動
        const fwd = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw));
        const right = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));
        const mv = new THREE.Vector3();
        if (keys.w) mv.add(fwd); if (keys.s) mv.sub(fwd);
        if (keys.d) mv.add(right); if (keys.a) mv.sub(right);
        if (stick.y) mv.addScaledVector(fwd, stick.y);
        if (stick.x) mv.addScaledVector(right, stick.x);
        if (mv.lengthSq() > 0) {
          mv.normalize();
          const nx = player.x + mv.x * PLAYER_SPEED * dt;
          const nz = player.z + mv.z * PLAYER_SPEED * dt;
          if (!blocked(nx, player.z)) player.x = nx;
          if (!blocked(player.x, nz)) player.z = nz;
        }
        // 留下腳印（行過嘅路，防迷路）
        if (started && !ended && mv.lengthSq() > 0) {
          const fd = Math.hypot(player.x - lastFootX, player.z - lastFootZ);
          if (fd > 1.3) {
            const d = mv.clone().normalize();
            const perp = new THREE.Vector3(-d.z, 0, d.x);
            const side = footSide ? 0.2 : -0.2;
            const fm = new THREE.Mesh(footGeo, footMat);
            fm.rotation.x = -Math.PI / 2;
            fm.position.set(player.x + perp.x * side, 0.03, player.z + perp.z * side);
            fm.renderOrder = 2;
            scene.add(fm);
            footprints.push(fm);
            if (footprints.length > 280) { const old = footprints.shift(); scene.remove(old); }
            lastFootX = player.x; lastFootZ = player.z; footSide = !footSide;
          }
        }
        camera.position.set(player.x, EYE, player.z);
        camera.rotation.y = yaw; camera.rotation.x = pitch;

        // 怪獸
        monsters.forEach(m => {
          if (!m.alive) return;
          const to = new THREE.Vector3(player.x - m.pos.x, 0, player.z - m.pos.z);
          const d = to.length();
          if (m.overT > 0) m.overT -= dt;
          if (d > 1.3) {
            to.normalize();
            const spd = MON_SPEED * (m.overT > 0 ? 1.6 : 1);
            const nx = m.pos.x + to.x * spd * dt, nz = m.pos.z + to.z * spd * dt;
            if (!blocked(nx, m.pos.z)) m.pos.x = nx;
            if (!blocked(m.pos.x, nz)) m.pos.z = nz;
          }
          m.grp.position.set(m.pos.x, 1.1 + Math.sin(t * 2 + m.phase) * 0.15, m.pos.z);
          m.grp.lookAt(player.x, 1.1, player.z);
          m.fireT -= dt;
          if (m.fireT <= 0 && d < 22) { m.fireT = FIRE_INTERVAL * (0.7 + Math.random() * 0.6); spawnFireball(m); }
        });

        // 玩家子彈
        for (let i = bullets.length - 1; i >= 0; i--) {
          const b = bullets[i]; b.life -= dt; b.mesh.position.addScaledVector(b.vel, dt);
          let hit = false;
          for (const m of monsters) {
            if (!m.alive) continue;
          if (b.mesh.position.distanceTo(m.grp.position) < 1.15) {
            if ((b.sign > 0) === (m.ion.z > 0)) {
              // 極性啱 → 扣電荷
              m.hp--; m.body.material.emissiveIntensity = 0.8;
              setTimeout(() => { if (m.body) m.body.material.emissiveIntensity = 0.25; }, 120);
              if (m.hp <= 0) { killMonster(m); hit = true; break; }
            } else {
              // 極性錯 → 過充：加 HP（封頂）+ 短暫加速，打錯反而更難
              m.hp = Math.min(m.hpMax + 2, m.hp + 1);
              m.overT = Math.max(m.overT, 2.5);
              m.body.material.emissive.setHex(0xff3333); m.body.material.emissiveIntensity = 1;
              setTimeout(() => { if (m.body) { m.body.material.emissive.setHex(m.ion.c); m.body.material.emissiveIntensity = 0.25; } }, 160);
            }
            updateChargePips(m);
            hit = true; break;
          }
          }
          if (hit || b.life <= 0 || isWall(b.mesh.position.x, b.mesh.position.z)) { scene.remove(b.mesh); b.mesh.geometry.dispose(); b.mesh.material.dispose(); bullets.splice(i, 1); }
        }

        // 怪獸火球
        for (let i = fireballs.length - 1; i >= 0; i--) {
          const f = fireballs[i]; f.life -= dt; f.mesh.position.addScaledVector(f.vel, dt);
          const dp = Math.hypot(f.mesh.position.x - player.x, f.mesh.position.z - player.z);
          if (dp < 1.0 && Math.abs(f.mesh.position.y - EYE) < 1.2) { damagePlayer(FIRE_DMG); scene.remove(f.mesh); f.mesh.geometry.dispose(); f.mesh.material.dispose(); fireballs.splice(i, 1); continue; }
          if (f.life <= 0 || isWall(f.mesh.position.x, f.mesh.position.z) || f.mesh.position.y < 0 || f.mesh.position.y > WALL_H) { scene.remove(f.mesh); f.mesh.geometry.dispose(); f.mesh.material.dispose(); fireballs.splice(i, 1); }
        }

        // 特效
        for (let i = effects.length - 1; i >= 0; i--) {
          const e = effects[i]; e.life -= dt; const s = 1 + (0.5 - e.life) * 6;
          e.mesh.scale.set(s, s, s); e.mesh.material.opacity = Math.max(0, e.life * 2);
          if (e.life <= 0) { scene.remove(e.mesh); e.mesh.geometry.dispose(); e.mesh.material.dispose(); effects.splice(i, 1); }
        }

        if (Math.floor(elapsed) % 1 === 0) updateHud();
        renderer.render(scene, camera);
      }

      function finish(win) {
        if (ended) return; ended = true; started = false;
        stopAmbience();
        cancelAnimationFrame(rafId);
        if (hudTimer) clearInterval(hudTimer);
        document.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('keydown', onKeyDownRef);
        window.removeEventListener('keyup', onKeyUpRef);
        if (onPointerLockRef) document.removeEventListener('pointerlockchange', onPointerLockRef);
        if (onMouseDownRef) document.removeEventListener('mousedown', onMouseDownRef);
        window.removeEventListener('resize', onResize);
        window.removeEventListener('orientationchange', checkOrient);
        if (document.pointerLockElement && document.exitPointerLock) document.exitPointerLock();
        try { renderer.dispose(); } catch (e) {}
        const scaled = win ? Math.round((kills / TOTAL) * 50 + (hp / MAX_HP) * 50)
                            : Math.round((kills / TOTAL) * 50);
        onComplete({ score: scaled, time: Math.floor(elapsed), passed: win, detail: (win ? S().win : S().lose) });
      }

      // 鍵位名稱：先用 e.code（唔受鍵盤佈局 / CapsLock 影響），再 fallback e.key
      function keyName(e) {
        switch (e.code) {
          case 'KeyW': case 'ArrowUp': return 'w';
          case 'KeyS': case 'ArrowDown': return 's';
          case 'KeyA': case 'ArrowLeft': return 'a';
          case 'KeyD': case 'ArrowRight': return 'd';
          default: return (e.key || '').toLowerCase();
        }
      }
      let onKeyDownRef = (e) => {
        const k = keyName(e);
        keys[k] = true;
        if (e.key === 'q' || e.code === 'Digit1') { currentSign = 1; updateHud(); }
        if (e.key === 'e' || e.code === 'Digit2') { currentSign = -1; updateHud(); }
        if (e.key === 'k' || e.code === 'KeyK') { currentSign = -currentSign; updateHud(); }
        if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
      };
      let onKeyUpRef = (e) => { keys[keyName(e)] = false; };

      showStart();
    },
  };
})();
