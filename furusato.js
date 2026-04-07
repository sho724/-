// ===== ふるさと納税シミュレーション =====

function calcFurusato() {
  const income     = parseFloat(document.getElementById('fs-income').value) * 10000 || 0;
  const spouse     = document.getElementById('fs-spouse').value;      // '0'=なし '1'=配偶者控除 '2'=配偶者特別控除
  const dependents = parseInt(document.getElementById('fs-dependents').value) || 0;
  const medicalEx  = parseFloat(document.getElementById('fs-medical').value) * 10000 || 0;
  const insurance  = parseFloat(document.getElementById('fs-insurance').value) * 10000 || 0;

  // 給与所得控除
  let kyuyoDed;
  if (income <= 1_625_000) kyuyoDed = 550_000;
  else if (income <= 1_800_000) kyuyoDed = income * 0.4 - 100_000;
  else if (income <= 3_600_000) kyuyoDed = income * 0.3 + 80_000;
  else if (income <= 6_600_000) kyuyoDed = income * 0.2 + 440_000;
  else if (income <= 8_500_000) kyuyoDed = income * 0.1 + 1_100_000;
  else kyuyoDed = 1_950_000;

  const kyuyoShotoku = income - kyuyoDed;

  // 基礎控除
  const kisoKojo = income <= 24_000_000 ? 480_000 : 0;

  // 配偶者控除
  let spouseKojo = 0;
  if (spouse === '1') spouseKojo = 380_000;
  else if (spouse === '2') spouseKojo = 260_000; // 簡略

  // 扶養控除（16歳以上一般扶養として計算）
  const fuuyoKojo = dependents * 380_000;

  // 医療費控除
  const medicalKojo = Math.max(0, medicalEx - Math.min(income * 0.01, 100_000));

  const totalKojo = kisoKojo + spouseKojo + fuuyoKojo + insurance + medicalKojo;
  const taxableIncome = Math.max(0, kyuyoShotoku - totalKojo);

  // 所得税率
  let taxRate = 0.05;
  const brackets = [
    { limit: 1_950_000,  rate: 0.05 },
    { limit: 3_300_000,  rate: 0.10 },
    { limit: 6_950_000,  rate: 0.20 },
    { limit: 9_000_000,  rate: 0.23 },
    { limit: 18_000_000, rate: 0.33 },
    { limit: 40_000_000, rate: 0.40 },
    { limit: Infinity,   rate: 0.45 },
  ];
  for (const b of brackets) {
    if (taxableIncome <= b.limit) { taxRate = b.rate; break; }
  }

  // ふるさと納税控除上限額の計算
  // 住民税所得割額（簡易）
  const residentTaxIncome = Math.max(0, kyuyoShotoku - (kisoKojo - 50_000) - spouseKojo - fuuyoKojo - insurance - medicalKojo);
  const residentTaxBase = Math.floor(residentTaxIncome * 0.10);

  // 上限 = (住民税所得割額 × 0.2) / (0.9 - 所得税率 × 1.021) + 2,000
  const denominator = 0.9 - taxRate * 1.021;
  const limit = denominator > 0
    ? Math.floor(residentTaxBase * 0.2 / denominator) + 2000
    : 0;

  // 自己負担2,000円を除いた実質控除額
  const effectiveDeduction = Math.max(0, limit - 2000);

  document.getElementById('fs-result').innerHTML = `
    <div class="result-box">
      <h3>ふるさと納税 控除上限額（概算）</h3>
      <div class="result-main">${fmt(limit)} <span>円</span></div>
      <div class="result-breakdown">
        <div class="result-item">
          <div class="ri-label">給与所得</div>
          <div class="ri-value">${fmt(kyuyoShotoku)}円</div>
        </div>
        <div class="result-item">
          <div class="ri-label">課税所得（所得税）</div>
          <div class="ri-value">${fmt(taxableIncome)}円</div>
        </div>
        <div class="result-item">
          <div class="ri-label">適用所得税率</div>
          <div class="ri-value">${(taxRate * 100).toFixed(0)}%</div>
        </div>
        <div class="result-item">
          <div class="ri-label">住民税所得割（概算）</div>
          <div class="ri-value">${fmt(residentTaxBase)}円</div>
        </div>
        <div class="result-item">
          <div class="ri-label">実質控除額（-2,000円）</div>
          <div class="ri-value success">${fmt(effectiveDeduction)}円</div>
        </div>
        <div class="result-item">
          <div class="ri-label">自己負担</div>
          <div class="ri-value danger">2,000円</div>
        </div>
      </div>
    </div>
    <div class="alert alert-warn" style="margin-top:16px">
      ⚠️ この計算は概算です。医療費控除・住宅ローン控除・iDeCo等がある場合は上限額が変わります。正確な金額は税理士にご相談ください。
    </div>
  `;
}
