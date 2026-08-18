/* ============================================================
 * 關卡 1 · 元素周期表密室（元素符號配對）
 * 玩法：限時 60 秒，點左邊符號再點右邊中文名稱配對。
 * 錯誤配對扣 3 秒。分數 = 配對率×70 + 剩餘時間比例×30。
 * ============================================================ */
window.ChemRPG = window.ChemRPG || {};
ChemRPG.games = ChemRPG.games || {};

(function () {
  const NS = window.ChemRPG;

  NS.games['element-match'] = {
    meta: { title: '元素周期表密室', timeLimit: 60 },

    start(container, onComplete) {
      const meta = this.meta;
      const picks = NS.util.shuffle(NS.data.elements).slice(0, 8);
      const total = picks.length;
      let matched = 0, selSym = null, timeLeft = meta.timeLimit, ended = false;
      const startT = Date.now();
      let timer = null;

      container.innerHTML = `
        <div class="game-head">
          <div class="game-title">🜨 ${meta.title}</div>
          <div class="timer" id="t">⏱ ${timeLeft}s</div>
        </div>
        <p class="game-tip">點擊左邊元素符號，再點擊右邊對應中文名稱配對。配錯會扣 3 秒！</p>
        <div class="match-grid">
          <div class="match-col" id="syms"></div>
          <div class="match-col" id="names"></div>
        </div>`;

      const symCol = container.querySelector('#syms');
      const nameCol = container.querySelector('#names');
      const tEl = container.querySelector('#t');

      NS.util.shuffle(picks).forEach(el => {
        const b = document.createElement('button');
        b.className = 'match-cell sym';
        b.textContent = el.sym;
        b.dataset.zh = el.zh;
        b.onclick = () => {
          if (b.classList.contains('done')) return;
          container.querySelectorAll('.sym.selected').forEach(x => x.classList.remove('selected'));
          selSym = b;
          b.classList.add('selected');
        };
        symCol.appendChild(b);
      });

      NS.util.shuffle(picks).forEach(el => {
        const b = document.createElement('button');
        b.className = 'match-cell name';
        b.textContent = el.zh;
        b.dataset.zh = el.zh;
        b.onclick = () => {
          if (b.classList.contains('done') || !selSym) return;
          const s = selSym;
          if (s.dataset.zh === b.dataset.zh) {
            s.classList.add('done', 'correct');
            b.classList.add('done', 'correct');
            matched++;
            selSym = null;
            if (matched === total) finish();
          } else {
            b.classList.add('wrong');
            s.classList.add('wrong');
            timeLeft = Math.max(0, timeLeft - 3);
            setTimeout(() => { b.classList.remove('wrong'); s.classList.remove('wrong'); }, 500);
            selSym = null;
            s.classList.remove('selected');
          }
        };
        nameCol.appendChild(b);
      });

      timer = setInterval(() => {
        timeLeft--;
        if (tEl) tEl.textContent = `⏱ ${timeLeft}s`;
        if (timeLeft <= 0) finish();
      }, 1000);

      function finish() {
        if (ended) return;
        ended = true;
        clearInterval(timer);
        const used = Math.round((Date.now() - startT) / 1000);
        const score = Math.round((matched / total) * 70 + (timeLeft / meta.timeLimit) * 30);
        onComplete({ score, time: used, passed: score >= NS.config.passScore, detail: `配對 ${matched}/${total}` });
      }
    },
  };
})();
