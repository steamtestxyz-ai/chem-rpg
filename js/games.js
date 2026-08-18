/* ============================================================
 * 化學城堡大冒險 · 通用工具
 * ============================================================ */
window.ChemRPG = window.ChemRPG || {};

ChemRPG.util = {
  /* Fisher–Yates 洗牌，返回新陣列（唔會改到原本資料）*/
  shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  },
  /* 簡單 HTML 跳脫，防止姓名/關卡名稱破壞版面 */
  esc(s) {
    return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  },
};
