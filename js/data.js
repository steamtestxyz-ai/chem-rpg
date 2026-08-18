/* ============================================================
 * 化學城堡大冒險 · 資料庫（關卡 / 元素 / pH / 方程式）
 * ============================================================ */
window.ChemRPG = window.ChemRPG || {};

ChemRPG.data = {
  /* ---------- 10 個關卡框架（頭 4 個 impl:true 已實作）---------- */
  levels: [
    { id: 1,  name: '元素周期表密室',     icon: '🜨', type: 'element-match',   impl: true,  desc: '喺限時內將化學元素符號同中文名稱正確配對，考驗你對元素週期表嘅熟悉度。' },
    { id: 2,  name: '酸鹼中和實驗台',     icon: '🧪', type: 'ph-quiz',         impl: true,  desc: '判斷日常物質（檸檬汁、漂白水等）嘅酸鹼性，成為 pH 值達人。' },
    { id: 3,  name: '離子方程式平衡陣',   icon: '⚖️', type: 'equation-balance', impl: true,  desc: '調整化學方程式嘅係數，令左右兩邊原子數目平衡。' },
    { id: 4,  name: '多原子離子射擊場',   icon: '🔫', type: 'polyatomic-shooter', impl: true,  desc: '喺 3D 空間射擊「電荷相符」嘅多原子離子（例如 SO₄²⁻、NH₄⁺、PO₄³⁻），邊射邊記住佢哋嘅電荷！' },
    { id: 5,  name: '摩爾質量神殿',       icon: '💎', type: 'mole',            impl: false, desc: '運算相對分子質量同摩爾數，解開神殿嘅質量之謎。' },
    { id: 6,  name: '氣體定律風暴',       icon: '🌪️', type: 'gas',             impl: false, desc: '運用波義耳定律、查理定律，平息狂暴嘅氣體風暴。' },
    { id: 7,  name: '化學鍵鍊金坊',       icon: '🔗', type: 'bond',            impl: false, desc: '分辨離子鍵、共價鍵同金屬鍵，鍊成穩定嘅化合物。' },
    { id: 8,  name: '反應速率競技場',     icon: '⚡', type: 'rate',            impl: false, desc: '調整濃度、溫度、催化劑，令反應速率達標。' },
    { id: 9,  name: '有機迷霧森林',       icon: '🌿', type: 'organic',         impl: false, desc: '喺迷霧中辨認烷、烯、醇、羧酸等有機家族。' },
    { id: 10, name: '化學計量終焉之塔',   icon: '🏰', type: 'stoichiometry',   impl: false, desc: '綜合所學，解開化學計量嘅終極試煉。' },
  ],

  /* ---------- 關卡 1：元素符號配對（常見中學元素）---------- */
  elements: [
    { sym: 'H',  zh: '氫' }, { sym: 'He', zh: '氦' }, { sym: 'Li', zh: '鋰' },
    { sym: 'Be', zh: '鈹' }, { sym: 'B',  zh: '硼' }, { sym: 'C',  zh: '碳' },
    { sym: 'N',  zh: '氮' }, { sym: 'O',  zh: '氧' }, { sym: 'F',  zh: '氟' },
    { sym: 'Ne', zh: '氖' }, { sym: 'Na', zh: '鈉' }, { sym: 'Mg', zh: '鎂' },
    { sym: 'Al', zh: '鋁' }, { sym: 'Si', zh: '矽' }, { sym: 'P',  zh: '磷' },
    { sym: 'S',  zh: '硫' }, { sym: 'Cl', zh: '氯' }, { sym: 'Ar', zh: '氬' },
    { sym: 'K',  zh: '鉀' }, { sym: 'Ca', zh: '鈣' }, { sym: 'Fe', zh: '鐵' },
    { sym: 'Cu', zh: '銅' }, { sym: 'Zn', zh: '鋅' }, { sym: 'Ag', zh: '銀' },
    { sym: 'Au', zh: '金' }, { sym: 'Hg', zh: '汞' }, { sym: 'Pb', zh: '鉛' },
  ],

  /* ---------- 關卡 2：pH 快問快答 ----------
   * bucket 對應分類：0 強酸 / 1 弱酸 / 2 中性 / 3 弱鹼 / 4 強鹼 */
  phItems: [
    { name: '檸檬汁',   bucket: 0 },
    { name: '胃液',     bucket: 0 },
    { name: '食醋',     bucket: 1 },
    { name: '橙汁',     bucket: 1 },
    { name: '番茄汁',   bucket: 1 },
    { name: '牛奶',     bucket: 1 },
    { name: '雨水',     bucket: 1 },
    { name: '食鹽水',   bucket: 2 },
    { name: '純水',     bucket: 2 },
    { name: '小蘇打水', bucket: 3 },
    { name: '肥皂水',   bucket: 3 },
    { name: '氨水',     bucket: 4 },
    { name: '漂白水',   bucket: 4 },
  ],

  /* ---------- 關卡 3：離子方程式平衡 ----------
   * atoms 直接寫死每種物質嘅原子數，避免解析化學式。
   * answer 為正確係數順序：[左側 species…, 右側 species…] */
  equations: [
    {
      left:  [ { formula: 'H₂', atoms: { H: 2 } },     { formula: 'O₂', atoms: { O: 2 } } ],
      right: [ { formula: 'H₂O', atoms: { H: 2, O: 1 } } ],
      answer: [2, 1, 2],
    },
    {
      left:  [ { formula: 'Fe', atoms: { Fe: 1 } },    { formula: 'O₂', atoms: { O: 2 } } ],
      right: [ { formula: 'Fe₂O₃', atoms: { Fe: 2, O: 3 } } ],
      answer: [4, 3, 2],
    },
    {
      left:  [ { formula: 'Na', atoms: { Na: 1 } },    { formula: 'Cl₂', atoms: { Cl: 2 } } ],
      right: [ { formula: 'NaCl', atoms: { Na: 1, Cl: 1 } } ],
      answer: [2, 1, 2],
    },
    {
      left:  [ { formula: 'HCl', atoms: { H: 1, Cl: 1 } }, { formula: 'NaOH', atoms: { Na: 1, O: 1, H: 1 } } ],
      right: [ { formula: 'NaCl', atoms: { Na: 1, Cl: 1 } }, { formula: 'H₂O', atoms: { H: 2, O: 1 } } ],
      answer: [1, 1, 1, 1],
    },
    {
      left:  [ { formula: 'H₂', atoms: { H: 2 } },     { formula: 'Cl₂', atoms: { Cl: 2 } } ],
      right: [ { formula: 'HCl', atoms: { H: 1, Cl: 1 } } ],
      answer: [1, 1, 2],
    },
  ],
};
