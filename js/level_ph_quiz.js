/* ============================================================
 * 關卡 2 · 酸鹼中和實驗台（pH 快問快答）
 * 玩法：限時 50 秒，8 題，判斷日常物質屬於邊種酸鹼性。
 * 分類：0 強酸 / 1 弱酸 / 2 中性 / 3 弱鹼 / 4 強鹼。
 * 分數 = 答對率×70 + 剩餘時間比例×30。
 * ============================================================ */
window.ChemRPG = window.ChemRPG || {};
ChemRPG.games = ChemRPG.games || {};

(function () {
  const NS = window.ChemRPG;
  const buckets = ['強酸 (pH<3)', '弱酸 (3≤pH<7)', '中性 (pH≈7)', '弱鹼 (7<pH≤11)', '強鹼 (pH>11)'];

  NS.games['ph-quiz'] = {
    meta: { title: '酸鹼中和實驗台', timeLimit: 50 },

    start(container, onComplete) {
      const meta = this.meta;
      const qs = NS.util.shuffle(NS.data.phItems).slice(0, 8);
      const total = qs.length;
      let idx = 0, correct = 0, timeLeft = meta.timeLimit, ended = false;
      const startT = Date.now();
      let timer = null;

      function render() {
        if (ended) return;
        if (idx >= total) return finish();
        const q = qs[idx];
        container.innerHTML = `
          <div class="game-head">
            <div class="game-title">🧪 ${meta.title}</div>
            <div class="timer" id="t">⏱ ${timeLeft}s</div>
          </div>
          <p class="game-tip">第 ${idx + 1}/${total} 題：<b>${NS.util.esc(q.name)}</b> 屬於邊一種酸鹼性？</p>
          <div class="opt-grid" id="opts"></div>`;
        const opts = container.querySelector('#opts');
        buckets.forEach((b, i) => {
          const btn = document.createElement('button');
          btn.className = 'opt';
          btn.textContent = b;
          btn.onclick = () => answer(i, btn);
          opts.appendChild(btn);
        });
      }

      function answer(choice, btn) {
        if (ended) return;
        const q = qs[idx];
        if (choice === q.bucket) {
          correct++;
          btn.classList.add('correct');
        } else {
          btn.classList.add('wrong');
          const right = container.querySelectorAll('.opt')[q.bucket];
          if (right) right.classList.add('correct');
        }
        container.querySelectorAll('.opt').forEach(b => (b.disabled = true));
        idx++;
        setTimeout(render, 800);
      }

      timer = setInterval(() => {
        timeLeft--;
        const t = container.querySelector('#t');
        if (t) t.textContent = `⏱ ${timeLeft}s`;
        if (timeLeft <= 0) finish();
      }, 1000);

      function finish() {
        if (ended) return;
        ended = true;
        clearInterval(timer);
        const used = Math.round((Date.now() - startT) / 1000);
        const score = Math.round((correct / total) * 70 + (timeLeft / meta.timeLimit) * 30);
        onComplete({ score, time: used, passed: score >= NS.config.passScore, detail: `答對 ${correct}/${total}` });
      }

      render();
    },
  };
})();
