/* ============================================================
 * 化學城堡大冒險 · 計分與雲端上傳
 * ------------------------------------------------------------
 * - 本機：localStorage 暫存成績，方便即時顯示。
 * - 雲端：透過 Fetch 將成績 POST 去 Google Apps Script（需設定 config.GAS_URL）。
 * - 排行榜：透過 GET 向 GAS 索取按總分排序嘅雲端總榜。
 * ============================================================ */
window.ChemRPG = window.ChemRPG || {};

(function () {
  const NS = window.ChemRPG;
  const cfg = NS.config;
  const KEY = 'chemrpg_scores';

  NS.score = {
    /* 學生完成關卡時呼叫：record = {name, level, score, time, passed, ts} */
    submit(record) {
      // 1) 本機暫存
      try {
        const arr = JSON.parse(localStorage.getItem(KEY) || '[]');
        arr.push(record);
        localStorage.setItem(KEY, JSON.stringify(arr));
      } catch (e) { /* 忽略本機錯誤 */ }

      // 2) 上傳雲端（未設定網址就跳過）
      const url = cfg.GAS_URL;
      if (!url || url.indexOf('YOUR_') === 0) return;
      try {
        // 用 text/plain + no-cors，避開 CORS 預檢，確保寫入一定送到
        fetch(url, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify(record),
        }).catch(() => {});
      } catch (e) { /* 網絡失敗唔影響遊戲 */ }
    },

    /* 讀取本機成績 */
    getLocal() {
      try { return JSON.parse(localStorage.getItem(KEY) || '[]'); }
      catch (e) { return []; }
    },

    /* 向雲端索取總榜，結果以 callback(rows) 回傳；失敗傳 null */
    fetchLeaderboard(cb) {
      const url = cfg.GAS_URL;
      if (!url || url.indexOf('YOUR_') === 0) { cb(null); return; }
      fetch(url + '?action=leaderboard', { method: 'GET', mode: 'cors' })
        .then(r => r.json())
        .then(d => cb(d.rows || []))
        .catch(() => cb(null));
    },
  };
})();
