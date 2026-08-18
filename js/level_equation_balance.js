/* ============================================================
 * 關卡 3 · 離子方程式平衡陣（係數調整）
 * 玩法：限時 90 秒，3 條方程式，用 ＋ / − 調整係數令左右原子平衡。
 * 分數 = 平衡成功率×70 + 剩餘時間比例×30。
 * ============================================================ */
window.ChemRPG = window.ChemRPG || {};
ChemRPG.games = ChemRPG.games || {};

(function () {
  const NS = window.ChemRPG;

  NS.games['equation-balance'] = {
    meta: { title: '離子方程式平衡陣', timeLimit: 90 },

    start(container, onComplete) {
      const meta = this.meta;
      const eqs = NS.util.shuffle(NS.data.equations).slice(0, 3);
      const total = eqs.length;
      let idx = 0, solved = 0, timeLeft = meta.timeLimit, ended = false;
      const startT = Date.now();
      let timer = null;

      function render() {
        if (ended) return;
        if (idx >= total) return finish();
        const eq = eqs[idx];
        const all = eq.left.concat(eq.right);
        const coeffs = all.map(() => 1);

        let html = `
          <div class="game-head">
            <div class="game-title">⚖️ ${meta.title}</div>
            <div class="timer" id="t">⏱ ${timeLeft}s</div>
          </div>
          <p class="game-tip">第 ${idx + 1}/${total} 題：調整係數令左右兩邊原子數平衡，再按「檢查」。</p>
          <div class="eq" id="eq">`;

        all.forEach((s, i) => {
          html += `
            <div class="eq-item">
              <button class="step" data-i="${i}" data-d="-1">−</button>
              <span class="coeff" id="c${i}">1</span>
              <button class="step" data-i="${i}" data-d="1">＋</button>
              <span class="formula">${s.formula}</span>
            </div>`;
          if (i < all.length - 1) {
            html += `<span class="sep">${i === eq.left.length - 1 ? '→' : '+'}</span>`;
          }
        });
        html += `</div><button class="btn" id="check">✅ 檢查</button>`;
        container.innerHTML = html;

        container.querySelectorAll('.step').forEach(b => {
          b.onclick = () => {
            const i = +b.dataset.i, d = +b.dataset.d;
            coeffs[i] = Math.min(9, Math.max(1, coeffs[i] + d));
            container.querySelector('#c' + i).textContent = coeffs[i];
          };
        });

        container.querySelector('#check').onclick = () => {
          if (balance(eq, coeffs)) {
            solved++;
            idx++;
            setTimeout(render, 500);
          } else {
            const eqEl = container.querySelector('#eq');
            if (eqEl) {
              eqEl.classList.add('shake');
              setTimeout(() => eqEl.classList.remove('shake'), 400);
            }
          }
        };
      }

      function sumAtoms(species, coeffs) {
        const m = {};
        species.forEach((s, i) => {
          for (const a in s.atoms) m[a] = (m[a] || 0) + s.atoms[a] * coeffs[i];
        });
        return m;
      }

      function balance(eq, coeffs) {
        const left = sumAtoms(eq.left, coeffs.slice(0, eq.left.length));
        const right = sumAtoms(eq.right, coeffs.slice(eq.left.length));
        const keys = new Set([...Object.keys(left), ...Object.keys(right)]);
        for (const k of keys) if (left[k] !== right[k]) return false;
        return true;
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
        const score = Math.round((solved / total) * 70 + (timeLeft / meta.timeLimit) * 30);
        onComplete({ score, time: used, passed: score >= NS.config.passScore, detail: `平衡 ${solved}/${total}` });
      }

      render();
    },
  };
})();
