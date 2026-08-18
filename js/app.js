/* ============================================================
 * 化學城堡大冒險 · 主控制器（大廳 / 關卡 / 結算 / 排行榜）
 * ============================================================ */
window.ChemRPG = window.ChemRPG || {};

(function () {
  const NS = window.ChemRPG;
  const cfg = NS.config;
  const $ = sel => document.querySelector(sel);
  const esc = NS.util.esc;

  const state = {
    name: localStorage.getItem('chemrpg_name') || '',
    completed: {}, // { levelId: {score, time} }
  };

  // 已實作關卡總數（用嚟顯示「通關 X/Y」）
  const IMPL = NS.data.levels.filter(l => l.impl).length;

  const app = $('#app');

  /* ---------- 頂部狀態列 ---------- */
  function topbar() {
    const done = Object.keys(state.completed).length;
    return `
      <header class="topbar">
        <div class="brand">🧙 化學城堡大冒險</div>
        <div class="stats">
          <span>🧑 ${esc(state.name || '未登入')}</span>
          <span>⭐ ${totalScore()}</span>
          <span>⏱ ${totalTime()}s</span>
          <span>🗝️ ${done}/${IMPL}</span>
        </div>
        <button class="btn ghost" id="btn-lb">🏆 排行榜</button>
      </header>`;
  }

  function totalScore() {
    return Object.values(state.completed).reduce((s, r) => s + r.score, 0);
  }
  function totalTime() {
    return Object.values(state.completed).reduce((s, r) => s + r.time, 0);
  }

  /* ---------- 大廳 / 主地圖 ---------- */
  function renderLobby() {
    const rooms = NS.data.levels.map(l => `
      <button class="room ${l.impl ? '' : 'locked'}" data-id="${l.id}">
        <div class="room-icon">${l.icon}</div>
        <div class="room-name">${l.id}. ${esc(l.name)}</div>
        <div class="room-status">${state.completed[l.id] ? '✅ 已通關' : (l.impl ? '🔓 進入' : '🔒 未開放')}</div>
      </button>`).join('');

    app.innerHTML = `
      ${topbar()}
      <main class="lobby">
        <div class="hero">
          <h1>⚗️ 歡迎嚟到化學城堡 ⚗️</h1>
          <p>輸入你嘅姓名，展開 10 關化學 RPG 冒險！（首 4 關已開放）</p>
          <div class="name-row">
            <input id="name-input" maxlength="20" placeholder="學生姓名" value="${esc(state.name)}">
            <button class="btn" id="name-save">儲存</button>
          </div>
          <p class="hint">💡 姓名只用於記錄成績，可隨時更改；成績會上載去老師嘅試算表。</p>
        </div>
        <section class="map">${rooms}</section>
      </main>`;

    $('#name-save').onclick = () => {
      const v = $('#name-input').value.trim();
      if (!v) { alert('請先輸入姓名～'); return; }
      state.name = v;
      localStorage.setItem('chemrpg_name', v);
      renderLobby();
    };
    $('#name-input').addEventListener('keydown', e => { if (e.key === 'Enter') $('#name-save').click(); });

    app.querySelectorAll('.room').forEach(b => {
      b.onclick = () => {
        const id = +b.dataset.id;
        const lvl = NS.data.levels.find(l => l.id === id);
        if (!lvl.impl) { NS.games['__placeholder'].start(app, lvl); return; }
        if (!state.name) { alert('請先輸入並儲存你嘅姓名！'); return; }
        renderGame(lvl);
      };
    });
    $('#btn-lb').onclick = renderLeaderboard;
  }

  /* ---------- 關卡畫面 ---------- */
  function renderGame(lvl) {
    const game = NS.games[lvl.type];
    app.innerHTML = `${topbar()}<main class="game-wrap" id="game-root"></main>`;
    $('#btn-lb').onclick = renderLeaderboard;
    game.start($('#game-root'), res => onLevelComplete(lvl, res));
  }

  /* ---------- 關卡完成 → 結算 ---------- */
  function onLevelComplete(lvl, res) {
    state.completed[lvl.id] = { score: res.score, time: res.time };

    NS.score.submit({
      name: state.name,
      level: lvl.name,
      score: res.score,
      time: res.time,
      passed: res.passed ? 1 : 0,
      ts: new Date().toISOString(),
    });

    const done = Object.keys(state.completed).length;
    const allImpl = NS.data.levels.filter(l => l.impl).map(l => l.id);
    const clearedAll = allImpl.every(id => state.completed[id]);

    app.innerHTML = `
      ${topbar()}
      <main class="result">
        <div class="result-card ${res.passed ? 'win' : 'lose'}">
          <h2>${res.passed ? '🎉 過關！' : '💥 挑戰失敗'}</h2>
          <p class="detail">${esc(lvl.name)} · ${esc(res.detail || '')}</p>
          <div class="score-big">${res.score}<small>/100</small></div>
          <div class="lines">
            <div>⏱ 用時：${res.time}s</div>
            <div>⭐ 累積總分：${totalScore()}</div>
            <div>🗝️ 已通關：${done}/${IMPL}</div>
          </div>
          ${clearedAll ? '<p class="clear-banner">🏰 你已通關所有已開放關卡，真正嘅化學魔法師！</p>' : ''}
          <div class="btn-row">
            <button class="btn" id="r-back">🏰 返回大廳</button>
            <button class="btn ghost" id="r-lb">🏆 排行榜</button>
          </div>
        </div>
      </main>`;
    $('#r-back').onclick = renderLobby;
    $('#r-lb').onclick = renderLeaderboard;
  }

  /* ---------- 排行榜 ---------- */
  function renderLeaderboard() {
    app.innerHTML = `
      ${topbar()}
      <main class="lb-wrap">
        <h2>🏆 排行榜</h2>
        <div id="lb-body">載入中…</div>
        <button class="btn" id="lb-back">🏰 返回大廳</button>
      </main>`;
    $('#btn-lb').onclick = renderLeaderboard;
    $('#lb-back').onclick = renderLobby;

    // 本機記錄
    const local = NS.score.getLocal();
    let html = '<h3>📱 本機記錄（呢部裝置）</h3>';
    if (local.length) {
      html += `<table class="lb-table">
        <tr><th>姓名</th><th>關卡</th><th>分數</th><th>用時</th></tr>` +
        local.slice(-25).reverse().map(r =>
          `<tr><td>${esc(r.name)}</td><td>${esc(r.level)}</td><td>${r.score}</td><td>${r.time}s</td></tr>`
        ).join('') + '</table>';
    } else {
      html += '<p>暫無本機記錄。</p>';
    }
    $('#lb-body').innerHTML = html;

    // 雲端總榜
    NS.score.fetchLeaderboard(rows => {
      if (rows && rows.length) {
        const c = '<h3>☁️ 雲端總榜（按總分）</h3><table class="lb-table">' +
          '<tr><th>排名</th><th>姓名</th><th>總分</th><th>總用時</th><th>關卡數</th></tr>' +
          rows.map((r, i) =>
            `<tr><td>${i + 1}</td><td>${esc(r.name)}</td><td>${r.score}</td><td>${r.time}s</td><td>${r.levels}</td></tr>`
          ).join('') + '</table>';
        $('#lb-body').insertAdjacentHTML('beforeend', c);
      } else {
        $('#lb-body').insertAdjacentHTML('beforeend',
          '<p class="hint">☁️ 雲端總榜暫時未能載入（可能尚未設定 Google Apps Script 網址，或試算表仲未收到數據）。</p>');
      }
    });
  }

  // 畀 placeholder 關卡呼叫返回大廳
  NS.ui = { lobby: renderLobby, leaderboard: renderLeaderboard };

  renderLobby();
})();
