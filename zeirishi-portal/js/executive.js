// ===== 役員報酬シミュレーション =====

function calcExecutive() {
  const companyProfit = parseFloat(document.getElementById('ex-profit').value) * 10000 || 0;
  const salary = parseFloat(document.getElementById('ex-salary').value) * 10000 || 0;
  const isHojin = document.getElementById('ex-hojin').value === '1';
  const hasKenpo = document.getElementById('ex-kenpo').value === '1';

  // --- 個人側計算 ---
  // 給与所得控除
  let kyuyoDeduction;
  if (salary <= 1_625_000) kyuyoDeduction = 550_000;
  else if (salary <= 1_800_000) kyuyoDeduction = salary * 0.4 - 100_000;
  else if (salary <= 3_600_000) kyuyoDeduction = salary * 0.3 + 80_000;
  else if (salary <= 6_600_000) kyuyoDeduction = salary * 0.2 + 440_000;
  else if (salary <= 8_500_000) kyuyoDeduction = salary * 0.1 + 1_100_000;
  else kyuyoDeduction = 1_950_000;

  const kyuyoShotoku = Math.max(0, salary - kyuyoDeduction);

  // 社会保険料（役員報酬ベース）
  // 標準報酬月額に近似（簡略計算）
  const monthSalary = salary / 12;
  // 健康保険: 報酬×10%（労使折半→5%）、厚生年金: 報酬×18.3%（折半→9.15%）上限あり
  const kenpoRate   = hasKenpo ? 0.1182 / 2 : 0; // 協会けんぽ東京概算
  const kounenRate  = 0.183 / 2;
  const kounenCap   = 650_000; // 標準報酬月額上限
  const kounenBase  = Math.min(monthSalary, kounenCap);
  const shakaihokenMonthly = monthSalary * kenpoRate + kounenBase * kounenRate;
  const shakaihokenAnnual  = Math.floor(shakaihokenMonthly * 12);

  // 基礎控除・社保控除後の課税所得
  const kisoKojo = salary <= 24_000_000 ? 480_000 : 320_000;
  const taxableIncome = Math.max(0, kyuyoShotoku - shakaihokenAnnual - kisoKojo);

  // 所得税
  const brackets = [
    { limit: 1_950_000,  rate: 0.05,  ded: 0 },
    { limit: 3_300_000,  rate: 0.10,  ded: 97_500 },
    { limit: 6_950_000,  rate: 0.20,  ded: 427_500 },
    { limit: 9_000_000,  rate: 0.23,  ded: 636_000 },
    { limit: 18_000_000, rate: 0.33,  ded: 1_536_000 },
    { limit: 40_000_000, rate: 0.40,  ded: 2_796_000 },
    { limit: Infinity,   rate: 0.45,  ded: 4_796_000 },
  ];
  let incomeTax = 0;
  for (const b of brackets) {
    if (taxableIncome <= b.limit) {
      incomeTax = Math.max(0, Math.floor(taxableIncome * b.rate - b.ded));
      break;
    }
  }
  const fukko = Math.floor(incomeTax * 0.021);
  const residentTax = Math.floor(taxableIncome * 0.10);
  const personalTaxTotal = incomeTax + fukko + residentTax;
  const personalBurden = personalTaxTotal + shakaihokenAnnual;
  const takeHome = salary - personalBurden;

  // --- 法人側計算 ---
  // 役員報酬は損金算入 → 法人の課税所得 = 会社利益 - 役員報酬
  const corpProfit = Math.max(0, companyProfit - salary);
  let corpTax = 0;
  if (corpProfit > 0) {
    const low = Math.min(corpProfit, 8_000_000);
    const high = Math.max(0, corpProfit - 8_000_000);
    corpTax = Math.floor(low * 0.15 + high * 0.232);
    const localCorpTax = Math.floor(corpTax * 0.103);
    const residentCorpTax = Math.floor(corpTax * 0.207);
    const bizTax = Math.floor(Math.min(corpProfit, 4_000_000) * 0.035 + Math.min(Math.max(0, corpProfit - 4_000_000), 4_000_000) * 0.053 + Math.max(0, corpProfit - 8_000_000) * 0.07);
    const specialBiz = Math.floor(bizTax * 0.372);
    corpTax = corpTax + localCorpTax + residentCorpTax + bizTax + specialBiz;
  }

  // 会社の社保負担（法定福利費）
  const compShakai = hasKenpo ? Math.floor(shakaihokenAnnual * 1) : 0; // 会社負担は本人と同額

  const totalBurden = personalBurden + corpTax + compShakai;
  const combinedEffective = companyProfit > 0 ? (totalBurden / companyProfit * 100).toFixed(1) : 0;

  document.getElementById('ex-result').innerHTML = `
    <div class="result-box">
      <h3>合計負担（個人税金 + 社会保険 + 法人税等）</h3>
      <div class="result-main">${fmt(totalBurden)} <span>円</span></div>
      <div class="result-breakdown">
        <div class="result-item">
          <div class="ri-label">役員報酬（個人収入）</div>
          <div class="ri-value">${fmt(salary)}円</div>
        </div>
        <div class="result-item">
          <div class="ri-label">個人所得税等</div>
          <div class="ri-value danger">${fmt(personalTaxTotal)}円</div>
        </div>
        <div class="result-item">
          <div class="ri-label">社会保険料（個人）</div>
          <div class="ri-value danger">${fmt(shakaihokenAnnual)}円</div>
        </div>
        <div class="result-item">
          <div class="ri-label">法人税等</div>
          <div class="ri-value danger">${fmt(corpTax)}円</div>
        </div>
        <div class="result-item">
          <div class="ri-label">社保（会社負担）</div>
          <div class="ri-value danger">${fmt(compShakai)}円</div>
        </div>
        <div class="result-item">
          <div class="ri-label">実質総負担率</div>
          <div class="ri-value">${combinedEffective}%</div>
        </div>
        <div class="result-item">
          <div class="ri-label">手取り（概算）</div>
          <div class="ri-value success">${fmt(takeHome)}円</div>
        </div>
        <div class="result-item">
          <div class="ri-label">残留利益（法人内）</div>
          <div class="ri-value success">${fmt(Math.max(0, corpProfit - corpTax))}円</div>
        </div>
      </div>
    </div>
  `;

  renderExecutiveChart(salary, personalTaxTotal, shakaihokenAnnual, corpTax, compShakai, Math.max(0, corpProfit - corpTax));
}

function renderExecutiveChart(salary, pTax, pShakai, cTax, cShakai, retained) {
  const ctx = document.getElementById('ex-chart');
  if (!ctx) return;
  if (window._exChart) window._exChart.destroy();
  window._exChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['個人所得税等', '社保(個人)', '法人税等', '社保(会社)', '手取り', '法人内留保'],
      datasets: [{
        data: [pTax, pShakai, cTax, cShakai, Math.max(0, salary - pTax - pShakai), retained],
        backgroundColor: ['#ef5350','#ef9a9a','#1a237e','#5c6bc0','#4caf50','#81c784'],
        borderWidth: 2,
        borderColor: '#fff',
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: 'right' } }
    }
  });
}
