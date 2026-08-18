# 化學城堡大冒險 · Chem Castle RPG

一個以**香港中學化學科**為主題嘅網頁版 RPG 冒險遊戲。學生輸入姓名後，喺「化學城堡」地圖上挑戰 10 個關卡，首 3 關（元素符號配對、pH 快問快答、離子方程式平衡）已完整實作，其餘 7 關留待擴充。成績會經 Google Apps Script 自動寫入你嘅 Google 試算表，方便長期追蹤學生表現。

---

## 📁 檔案結構

```
chem-rpg/
├── index.html                  # 主頁面（SPA，純前端）
├── css/
│   └── style.css               # 城堡 / 魔法實驗室風格 + 手機适配
├── js/
│   ├── config.js               # ⚙️ 你只需要改呢個：填入 GAS_URL
│   ├── data.js                 # 關卡 / 元素 / pH / 方程式 資料
│   ├── games.js                # 通用工具（洗牌、跳脫）
│   ├── score.js                # 計分 + 上傳雲端 + 讀取排行榜
│   ├── level_element_match.js  # 關卡1：元素符號配對
│   ├── level_ph_quiz.js         # 關卡2：pH 快問快答
│   ├── level_equation_balance.js# 關卡3：離子方程式平衡
│   ├── level_placeholder.js     # 其餘 7 關嘅「敬請期待」佔位
│   └── app.js                   # 主控制器（大廳 / 關卡 / 結算 / 排行榜）
└── README.md                   # 呢個檔案
```

全部係**純靜態檔案，無需任何建置（build）步驟**，可以直接拖上 Netlify 發布。

---

## ☁️ 設定雲端計分（Google Apps Script）

### 第 1 步：建立試算表
1. 開啟 [Google 試算表](https://sheets.google.com) 建立一個新試算表（例如命名 `化學城堡成績`）。

### 第 2 步：貼入 Apps Script
1. 喺試算表入面，按「**擴充功能 → Apps Script**」。
2. 將下面成段程式碼**成個覆蓋** `Code.gs` 的內容，然後按「儲存」💾。

```javascript
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('Scores');
    if (!sheet) {
      sheet = ss.insertSheet('Scores');
      sheet.appendRow(['姓名', '關卡', '分數', '用時(秒)', '是否過關', '完成時間']);
    }
    sheet.appendRow([data.name, data.level, data.score, data.time, data.passed, data.ts]);
    return ContentService.createTextOutput(JSON.stringify({ result: 'ok' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ result: 'error', msg: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  var action = e.parameter.action;
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Scores');
  if (!sheet || sheet.getLastRow() < 2) {
    return ContentService.createTextOutput(JSON.stringify({ rows: [] }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  var rows = sheet.getDataRange().getValues();
  rows.shift(); // 去掉標題列

  if (action === 'leaderboard') {
    var map = {};
    rows.forEach(function (r) {
      var name = r[0], score = r[2], time = r[3];
      if (!map[name]) map[name] = { name: name, score: 0, time: 0, levels: 0 };
      map[name].score += score;
      map[name].time += time;
      map[name].levels += 1;
    });
    var arr = Object.keys(map).map(function (k) { return map[k]; });
    arr.sort(function (a, b) { return b.score - a.score; }); // 按總分由高到低
    return ContentService.createTextOutput(JSON.stringify({ rows: arr.slice(0, 20) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  return ContentService.createTextOutput(JSON.stringify({ rows: rows }))
    .setMimeType(ContentService.MimeType.JSON);
}
```

### 第 3 步：部署為網頁應用程式
1. 右上角按「**部署 → 新增部署作業**」。
2. 選擇「**網頁應用程式**」。
3. 「**誰可以存取**」選 **「所有人」**（呢點好重要，否則學生裝置無法寫入）。
4. 按「部署」，Google 會要求授權一次，允許即可。
5. 複製產生嘅 **網頁應用程式網址**（形似 `https://script.google.com/macros/s/XXXX/exec`）。

### 第 4 步：填入網址
打開 `js/config.js`，將 `GAS_URL` 改成你複製嘅網址：

```javascript
GAS_URL: 'https://script.google.com/macros/s/XXXX/exec',
```

> 未設定之前遊戲照樣可以玩，成績會暫存喺學生自己部裝置（本機排行榜），雲端總榜會顯示「未能載入」。

---

## 🚀 發布到 Netlify（免費，拖上去就得）

**方法 A：直接拖放（最簡單）**
1. 去 [app.netlify.com/drop](https://app.netlify.com/drop)。
2. 將整個 `chem-rpg` 資料夾拖入虛線框。
3. 幾秒後就會得到一個公開網址（例如 `https://xxx.netlify.app`），可以分享畀學生。

**方法 B：連接 GitHub（推薦，方便日後更新）**
1. 將 `chem-rpg` 資料夾推上你嘅 GitHub 倉庫。
2. 喺 Netlify 按「Add new site → Import an existing project」，授權 GitHub 並選該倉庫。
3. Build command 留空、Publish directory 填 `chem-rpg`（或將資料夾內容放喺倉庫根目錄則留空）。
4. 部署完成後，日後改完程式碼推上 GitHub 就會自動更新。

> 任何支援靜態檔案嘅平台（GitHub Pages、Cloudflare Pages、Firebase Hosting 等）都可以用，做法類似。

---

## 🎮 關卡一覽

| # | 關卡 | 狀態 | 玩法 |
|---|------|------|------|
| 1 | 元素周期表密室 | ✅ 實作 | 限時配對元素符號與中文名稱 |
| 2 | 酸鹼中和實驗台 | ✅ 實作 | pH 快問快答（強酸/弱酸/中性/弱鹼/強鹼）|
| 3 | 離子方程式平衡陣 | ✅ 實作 | 調整係數平衡方程式 |
| 4 | 多原子離子射擊場 | ✅ 實作 | DOOM 風第一身射擊：怪獸 = 多原子離子（NH₄⁺、OH⁻、NO₃⁻、CO₃²⁻、SO₄²⁻、PO₄³⁻），會行近並發射火球；玩前揀語言（繁中/英文），揀「正/負電荷」子彈，極性啱 + 槍數 = |電荷| 先殺到 |
| 5–10 | 摩爾質量神殿 / 氣體定律風暴 / 化學鍵鍊金坊 / 反應速率競技場 / 有機迷霧森林 / 化學計量終焉之塔 | 🚧 框架就位 | 預留 `type`，日後加 `level_xxx.js` 即可 |

### 想自己加新關卡？
1. 喺 `data.js` 嘅 `levels` 加一項（例如 `{ id: 4, name: '...', icon: '🔥', type: 'redox', impl: true }`）。
2. 新建 `js/level_redox.js`，註冊 `ChemRPG.games['redox']`，提供 `start(container, onComplete)`。
3. 遊戲完成時呼叫 `onComplete({ score, time, passed, detail })`（score 0–100）即可，計分與上傳會自動處理。

---

## 🔒 隱私與資料說明
- 學生姓名只用作成績標籤，無密碼、無登入系統。
- 成績會寫入**你擁有**嘅 Google 試算表，只有你（同你有授權嘅人）睇到。
- 若擔心學生輸入真假名，可喺課堂規定用「班別+學號」作姓名（例如 `2A-15`）。
