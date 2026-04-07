// ===== 財務分析 =====

let radarChart = null;
let trendChart = null;

function calcFinancial() {
  // BS項目
  const currentAssets    = parseFloat(document.getElementById('fa-ca').value) * 10000 || 0;
  const totalAssets      = parseFloat(document.getElementById('fa-ta').value) * 10000 || 0;
  const currentLiab      = parseFloat(document.getElementById('fa-cl').value) * 10000 || 0;
  const totalLiab        = parseFloat(document.getElementById('fa-tl').value) * 10000 || 0;
  const equity           = parseFloat(document.getElementById('fa-eq').value) * 10000 || 0;
  const inventory        = parseFloat(document.getElementById('fa-inv').value) * 10000 || 0;
  const receivable       = parseFloat(document.getElementById('fa-rec').value) * 10000 || 0;

  // PL項目
  const sales            = parseFloat(document.getElementById('fa-sales').value) * 10000 || 0;
  const cogs             = parseFloat(document.getElementById('fa-cogs').value) * 10000 || 0;
  const opProfit         = parseFloat(document.getElementById('fa-op').value) * 10000 || 0;
  const netProfit        = parseFloat(document.getElementById('fa-np').value) * 10000 || 0;
  const depreciation     = parseFloat(document.getElementById('fa-dep').value) * 10000 || 0;
  const interestExp      = parseFloat(document.getElementById('fa-int').value) * 10000 || 0;

  if (sales === 0 || totalAssets === 0) {
    document.getElementById('fa-result').innerHTML = '<div class="alert alert-warn">売上高と総資産を入力してください。</div>';
    return;
  }

  // --- 比率計算 ---
  const grossProfit    = sales - cogs;
  const grossMargin    = pct(grossProfit, sales);
  const opMargin       = pct(opProfit, sales);
  const netMargin      = pct(netProfit, sales);
  const roe            = equity > 0 ? pct(netProfit, equity) : null;
  const roa            = pct(netProfit, totalAssets);
  const currentRatio   = currentLiab > 0 ? (currentAssets / currentLiab * 100).toFixed(1) : null;
  const debtRatio      = totalAssets > 0 ? (totalLiab / totalAssets * 100).toFixed(1) : null;
  const equityRatio    = totalAssets > 0 ? (equity / totalAssets * 100).toFixed(1) : null;
  const invTurnover    = inventory > 0 ? (sales / inventory).toFixed(1) : null;
  const recTurnover    = receivable > 0 ? (sales / receivable).toFixed(1) : null;
  const recDays        = receivable > 0 ? (receivable / sales * 365).toFixed(0) : null;
  const assetTurnover  = (sales / totalAssets).toFixed(2);
  const ebitda         = opProfit + depreciation;
  const interestCover  = interestExp > 0 ? (opProfit / interestExp).toFixed(1) : null;

  // スコア（5段階）
  const scores = {
    opMargin:     scoreBy(parseFloat(opMargin),   [2,5,10,15]),
    currentRatio: scoreBy(parseFloat(currentRatio),[80,100,150,200]),
    equityRatio:  scoreBy(parseFloat(equityRatio), [10,20,30,50]),
    roe:          roe !== null ? scoreBy(parseFloat(roe), [0,5,10,15]) : 2,
    assetTurnover:scoreBy(parseFloat(assetTurnover),[0.3,0.6,1.0,1.5]),
  };

  const avgScore = Object.values(scores).reduce((a,b)=>a+b,0) / Object.keys(scores).length;
  const rank = avgScore >= 4.5 ? 'A+' : avgScore >= 3.5 ? 'A' : avgScore >= 2.5 ? 'B' : avgScore >= 1.5 ? 'C' : 'D';

  document.getElementById('fa-result').innerHTML = `
    <div class="result-box">
      <h3>財務健全性スコア</h3>
      <div class="result-main">${rank} <span>（${avgScore.toFixed(1)} / 5.0）</span></div>
      <div class="result-breakdown">
        <div class="result-item"><div class="ri-label">売上総利益率</div><div class="ri-value">${grossMargin}%</div></div>
        <div class="result-item"><div class="ri-label">営業利益率</div><div class="ri-value">${opMargin}%</div></div>
        <div class="result-item"><div class="ri-label">純利益率</div><div class="ri-value">${netMargin}%</div></div>
        <div class="result-item"><div class="ri-label">ROE</div><div class="ri-value">${roe ?? '-'}%</div></div>
        <div class="result-item"><div class="ri-label">ROA</div><div class="ri-value">${roa}%</div></div>
        <div class="result-item"><div class="ri-label">流動比率</div><div class="ri-value">${currentRatio ?? '-'}%</div></div>
        <div class="result-item"><div class="ri-label">自己資本比率</div><div class="ri-value">${equityRatio ?? '-'}%</div></div>
        <div class="result-item"><div class="ri-label">負債比率</div><div class="ri-value">${debtRatio ?? '-'}%</div></div>
        <div class="result-item"><div class="ri-label">総資産回転率</div><div class="ri-value">${assetTurnover}回</div></div>
        <div class="result-item"><div class="ri-label">売上債権回転日数</div><div class="ri-value">${recDays ?? '-'}日</div></div>
        <div class="result-item"><div class="ri-label">EBITDA</div><div class="ri-value">${fmt(ebitda)}円</div></div>
        <div class="result-item"><div class="ri-label">インタレストカバー</div><div class="ri-value">${interestCover ?? '-'}倍</div></div>
      </div>
    </div>
  `;

  renderRadarChart(scores);
}

function renderRadarChart(scores) {
  const ctx = document.getElementById('fa-radar');
  if (!ctx) return;
  if (radarChart) radarChart.destroy();
  radarChart = new Chart(ctx, {
    type: 'radar',
    data: {
      labels: ['収益性\n(営業利益率)', '安全性\n(流動比率)', '安定性\n(自己資本)', '効率性\n(総資産回転)', '成長性\n(ROE)'],
      datasets: [{
        label: '自社',
        data: [scores.opMargin, scores.currentRatio, scores.equityRatio, scores.assetTurnover, scores.roe],
        backgroundColor: 'rgba(26,58,92,0.2)',
        borderColor: '#1a3a5c',
        pointBackgroundColor: '#c8a84b',
        borderWidth: 2,
        pointRadius: 5,
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      scales: {
        r: {
          min: 0, max: 5, ticks: { stepSize: 1 },
          grid: { color: '#dde3ec' },
        }
      },
      plugins: { legend: { display: false } }
    }
  });
}

function pct(num, den) {
  if (!den || den === 0) return '0.0';
  return (num / den * 100).toFixed(1);
}

function scoreBy(val, thresholds) {
  // thresholds: [d, c, b, a] → returns 1〜5
  if (isNaN(val)) return 2;
  if (val >= thresholds[3]) return 5;
  if (val >= thresholds[2]) return 4;
  if (val >= thresholds[1]) return 3;
  if (val >= thresholds[0]) return 2;
  return 1;
}
