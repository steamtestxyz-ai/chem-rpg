/* ============================================================
 * 未實作關卡 · 佔位畫面（其餘 7 關）
 * 點擊尚未開放嘅房間時顯示「敬請期待」。
 * ============================================================ */
window.ChemRPG = window.ChemRPG || {};
ChemRPG.games = ChemRPG.games || {};

(function () {
  const NS = window.ChemRPG;

  NS.games['__placeholder'] = {
    start(container, lvl) {
      container.innerHTML = `
        <div class="placeholder">
          <div class="ph-icon">${lvl.icon}</div>
          <h2>${lvl.id}. ${NS.util.esc(lvl.name)}</h2>
          <p>${NS.util.esc(lvl.desc || '')}</p>
          <p class="hint">🚧 呢個關卡仲喺度緊發開發中，敬請期待下一個版本！</p>
          <button class="btn" id="ph-back">🏰 返回大廳</button>
        </div>`;
      container.querySelector('#ph-back').onclick = () => {
        if (NS.ui && NS.ui.lobby) NS.ui.lobby();
      };
    },
  };
})();
