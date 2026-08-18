/* ============================================================
 * 化學城堡大冒險 · 全局設定
 * ------------------------------------------------------------
 * 老師（你）只需要改呢個檔案入面嘅 GAS_URL 就可以啟用雲端計分。
 * ============================================================ */
window.ChemRPG = window.ChemRPG || {};

ChemRPG.config = {
  /* 👇👇👇 將下面成串網址，替換成你喺 Google 試算表部署嘅 Apps Script 網址。
   *     部署教學請睇 README.md。
   *     未設定之前，遊戲依然可以玩，成績會暫存喺本機瀏覽器。            */
  GAS_URL: 'https://script.google.com/macros/s/AKfycbzs8xh4S38QYL2KOdoFO9laeSfRaGvPz0Z05m0j0WsOSYnIt1IMZL9YkVmdy9L3vNGs/exec',

  passScore: 50,   // 每關 100 分，達到呢個分數即算「過關」
};
