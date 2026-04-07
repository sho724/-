// ===== 税金シミュレーション =====

const TAX = {
  // 所得税速算表（課税所得に対する税率）
  incomeTaxBrackets: [
    { limit: 1_950_000,   rate: 0.05,  deduction: 0 },
    { limit: 3_300_000,   rate: 0.10,  deduction: 97_500 },
    { limit: 6_950_000,   rate: 0.20,  deduction: 427_500 },
    { limit: 9_000_000,   rate: 0.23,  deduction: 636_000 },
    { limit: 18_000_000,  rate: 0.33,  deduction: 1_536_000 },
    { limit: 40_000_000,  rate: 0.40,  deduction: 2_796_000 },
    { limit: Infinity,    rate: 0.45,  deduction: 4_796_000 },
  ],

  // 給与所得控除
  kyuyoDeduction(income) {
    if (income <= 1_625_000)  return 550_000;
    if (income <= 1_800_000)  return income * 0.4 - 100_000;
    if (income <= 3_600_000)  return income * 0.3 + 80_000;
    if (income <= 6_600_000)  return income * 0.2 + 440_000;
    if (income <= 8_500_000)  return income * 0.1 + 1_100_000;
    return 1_950_000;
  },

  // 基礎控除
  kisoKojo(income) {
    if (income <= 24_000_000) return 480_000;
    if (income <= 24_500_000) return 320_000;
    if (income <= 25_000_000) return 160_000;
    return 0;
  },

  // 所得税計算
  calcIncomeTax(taxableIncome) {
    for (const b of this.incomeTaxBrackets) {
      if (taxableIncome <= b.limit) {
        return Math.floor(taxableIncome * b.rate - b.deduction);
      }
    }
  },

  // 法人税率
  corporateTaxRate(profit, capital) {
    // 中小企業（資本金1億円以下）
    const isSmall = capital <= 100_000_000;
    if (isSmall) {
      // 年800万以下: 15%、超: 23.2%
      const low = Math.min(profit, 8_000_000);
      const high = Math.max(0, profit - 8_000_000);
      return low * 0.15 + high * 0.232;
    }
    return profit * 0.232;
  },
};

function calcPersonalTax() {
  const income     = parseFloat(document.getElementById('pt-income').value) * 10000 || 0;
  const haifusha   = parseInt(document.getElementById('pt-haifusha').value) || 0;
  const dependents = parseInt(document.getElementById('pt-dependents').value) || 0;
  const insurance  = parseFloat(document.getElementById('pt-insurance').value) * 10000 || 0;
  const furusato   = parseFloat(document.getElementById('pt-furusato').value) * 10000 || 0;

  // 給与所得
  const kyuyoShotoku = income - TAX.kyuyoDeduction(income);

  // 各種控除
  const kisoKojo    = TAX.kisoKojo(income);
  const haifuKojo   = haifusha > 0 ? 380_000 : 0;
  const fuuyoKojo   = dependents * 380_000;
  const shakaihokenKojo = insurance;
  const furusatoKojo = furusato > 2000 ? furusato - 2000 : 0;

  const totalKojo = kisoKojo + haifuKojo + fuuyoKojo + shakaihokenKojo + furusatoKojo;
  const taxableIncome = Math.max(0, kyuyoShotoku - totalKojo);

  // 所得税
  const incomeTax = Math.max(0, TAX.calcIncomeTax(taxableIncome));
  const fukko = Math.floor(incomeTax * 0.021); // 復興特別所得税

  // 住民税（課税所得×10%、控除は所得税より少し小さい）
  const residentTaxBase = Math.max(0, kyuyoShotoku - (kisoKojo - 50000) - haifuKojo - fuuyoKojo - shakaihokenKojo - furusatoKojo);
  const residentTax = Math.floor(residentTaxBase * 0.10);

  const totalTax = incomeTax + fukko + residentTax;
  const takeHome = income - totalTax - insurance;
  const effectiveRate = income > 0 ? (totalTax / income * 100).toFixed(1) : 0;

  document.getElementById('pt-result').innerHTML = `
    <div class="result-box">
      <h3>年間税負担合計（概算）</h3>
      <div class="result-main">${fmt(totalTax)} <span>円</span></div>
      <div class="result-breakdown">
        <div class="result-item">
          <div class="ri-label">給与所得</div>
          <div class="ri-value">${fmt(kyuyoShotoku)}円</div>
        </div>
        <div class="result-item">
          <div class="ri-label">課税所得</div>
          <div class="ri-value">${fmt(taxableIncome)}円</div>
        </div>
        <div class="result-item">
          <div class="ri-label">所得税</div>
          <div class="ri-value danger">${fmt(incomeTax)}円</div>
        </div>
        <div class="result-item">
          <div class="ri-label">復興特別所得税</div>
          <div class="ri-value danger">${fmt(fukko)}円</div>
        </div>
        <div class="result-item">
          <div class="ri-label">住民税（概算）</div>
          <div class="ri-value danger">${fmt(residentTax)}円</div>
        </div>
        <div class="result-item">
          <div class="ri-label">実効税率</div>
          <div class="ri-value">${effectiveRate}%</div>
        </div>
        <div class="result-item">
          <div class="ri-label">手取り（税・社保除く）</div>
          <div class="ri-value success">${fmt(takeHome)}円</div>
        </div>
      </div>
    </div>
  `;
}

function calcCorporateTax() {
  const profit  = parseFloat(document.getElementById('ct-profit').value) * 10000 || 0;
  const capital = parseFloat(document.getElementById('ct-capital').value) * 10000 || 0;
  const prefecture = document.getElementById('ct-prefecture').value;

  const corpTax = Math.max(0, Math.floor(TAX.corporateTaxRate(profit, capital)));
  // 地方法人税（法人税額×10.3%）
  const localCorpTax = Math.floor(corpTax * 0.103);
  // 法人住民税（法人税額×概算率）
  const residentTax = Math.floor(corpTax * 0.207);
  // 事業税（簡易：所得割）
  const businessTax = capital <= 100_000_000
    ? Math.floor(Math.min(profit, 4_000_000) * 0.035 + Math.min(Math.max(0, profit - 4_000_000), 4_000_000) * 0.053 + Math.max(0, profit - 8_000_000) * 0.07)
    : Math.floor(profit * 0.096);
  // 特別法人事業税
  const specialBizTax = Math.floor(businessTax * 0.372);

  const totalTax = corpTax + localCorpTax + residentTax + businessTax + specialBizTax;
  const effectiveRate = profit > 0 ? (totalTax / profit * 100).toFixed(1) : 0;
  const afterTax = profit - totalTax;

  document.getElementById('ct-result').innerHTML = `
    <div class="result-box">
      <h3>法人税等合計（概算）</h3>
      <div class="result-main">${fmt(totalTax)} <span>円</span></div>
      <div class="result-breakdown">
        <div class="result-item">
          <div class="ri-label">法人税</div>
          <div class="ri-value danger">${fmt(corpTax)}円</div>
        </div>
        <div class="result-item">
          <div class="ri-label">地方法人税</div>
          <div class="ri-value danger">${fmt(localCorpTax)}円</div>
        </div>
        <div class="result-item">
          <div class="ri-label">法人住民税</div>
          <div class="ri-value danger">${fmt(residentTax)}円</div>
        </div>
        <div class="result-item">
          <div class="ri-label">事業税</div>
          <div class="ri-value danger">${fmt(businessTax)}円</div>
        </div>
        <div class="result-item">
          <div class="ri-label">特別法人事業税</div>
          <div class="ri-value danger">${fmt(specialBizTax)}円</div>
        </div>
        <div class="result-item">
          <div class="ri-label">実効税率</div>
          <div class="ri-value">${effectiveRate}%</div>
        </div>
        <div class="result-item">
          <div class="ri-label">税引後利益</div>
          <div class="ri-value success">${fmt(afterTax)}円</div>
        </div>
      </div>
    </div>
  `;
}
