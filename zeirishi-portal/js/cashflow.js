// ===== キャッシュフローシミュレーション =====

const CF_MONTHS = ['4月','5月','6月','7月','8月','9月','10月','11月','12月','1月','2月','3月'];
const CF_ROWS = {
  income: [
    { key: 'sales',     label: '売上収入' },
    { key: 'other_in',  label: 'その他収入' },
  ],
  expense: [
    { key: 'purchase',  label: '仕入・外注費' },
    { key: 'labor',     label: '人件費' },
    { key: 'rent',      label: '地代家賃' },
    { key: 'utility',   label: '水道光熱費' },
    { key: 'tax_pay',   label: '税金支払' },
    { key: 'other_ex',  label: 'その他経費' },
  ],
  invest: [
    { key: 'capex',     label: '設備投資' },
  ],
  finance: [
    { key: 'borrow',    label: '借入' },
    { key: 'repay',     label: '借入返済' },
  ],
};

let cfChart = null;

function initCashflow() {
  buildCfTable();
}

function buildCfTable() {
  const container = document.getElementById('cf-table-container');
  if (!container) return;

  let html = `<div style="overflow-x:auto"><table class="data-table" id="cf-table">
    <thead>
      <tr>
        <th style="min-width:140px">項目</th>
        ${CF_MONTHS.map(m => `<th style="min-width:90px;text-align:right">${m}</th>`).join('')}
        <th style="min-width:100px;text-align:right">合計</th>
      </tr>
    </thead>
    <tbody>`;

  const sections = [
    { title: '【営業収入】', rows: CF_ROWS.income,   prefix: 'in' },
    { title: '【営業支出】', rows: CF_ROWS.expense,  prefix: 'ex' },
    { title: '【投資】',     rows: CF_ROWS.invest,   prefix: 'iv' },
    { title: '【財務】',     rows: CF_ROWS.finance,  prefix: 'fn' },
  ];

  for (const sec of sections) {
    html += `<tr><td colspan="${CF_MONTHS.length + 2}" style="background:#eef3f9;font-weight:700;font-size:12px;color:#1a3a5c;padding:8px 14px">${sec.title}</td></tr>`;
    for (const row of sec.rows) {
      const id = `${sec.prefix}_${row.key}`;
      html += `<tr>
        <td style="font-size:13px">${row.label}</td>
        ${CF_MONTHS.map((_, i) => `<td><input class="cf-input" type="number" id="${id}_${i}" placeholder="0" oninput="recalcCf()" step="10000"></td>`).join('')}
        <td class="right" id="${id}_total" style="font-weight:600">0</td>
      </tr>`;
    }
  }

  // 小計行
  html += `
    <tr class="total-row">
      <td>営業CF</td>
      ${CF_MONTHS.map((_, i) => `<td class="right" id="ops_${i}">0</td>`).join('')}
      <td class="right" id="ops_total">0</td>
    </tr>
    <tr class="total-row">
      <td>月末残高</td>
      ${CF_MONTHS.map((_, i) => `<td class="right" id="balance_${i}">0</td>`).join('')}
      <td class="right" id="balance_total">-</td>
    </tr>
  `;

  html += `</tbody></table></div>`;
  container.innerHTML = html;
}

function recalcCf() {
  const opening = parseFloat(document.getElementById('cf-opening').value) * 10000 || 0;

  const get = (prefix, key, i) => parseFloat(document.getElementById(`${prefix}_${key}_${i}`)?.value) * 10000 || 0;

  let balance = opening;
  const monthlyOps = [];
  const balances = [];

  for (let i = 0; i < 12; i++) {
    const inTotal  = CF_ROWS.income.reduce((s, r)  => s + get('in', r.key, i), 0);
    const exTotal  = CF_ROWS.expense.reduce((s, r) => s + get('ex', r.key, i), 0);
    const ivTotal  = CF_ROWS.invest.reduce((s, r)  => s + get('iv', r.key, i), 0);
    const fnIn     = get('fn', 'borrow', i);
    const fnOut    = get('fn', 'repay', i);

    const ops = inTotal - exTotal - ivTotal + fnIn - fnOut;
    balance += ops;

    monthlyOps.push(ops);
    balances.push(balance);

    document.getElementById(`ops_${i}`).textContent = fmtShort(ops);
    document.getElementById(`ops_${i}`).style.color = ops < 0 ? '#c62828' : '';
    document.getElementById(`balance_${i}`).textContent = fmtShort(balance);
    document.getElementById(`balance_${i}`).style.color = balance < 0 ? '#c62828' : '';
  }

  // 各行の合計
  const allSections = [
    { rows: CF_ROWS.income,  prefix: 'in' },
    { rows: CF_ROWS.expense, prefix: 'ex' },
    { rows: CF_ROWS.invest,  prefix: 'iv' },
    { rows: CF_ROWS.finance, prefix: 'fn' },
  ];
  for (const sec of allSections) {
    for (const row of sec.rows) {
      const id = `${sec.prefix}_${row.key}`;
      const total = Array.from({length: 12}, (_, i) => get(sec.prefix, row.key, i)).reduce((a, b) => a + b, 0);
      document.getElementById(`${id}_total`).textContent = fmtShort(total);
    }
  }

  const totalOps = monthlyOps.reduce((a, b) => a + b, 0);
  document.getElementById('ops_total').textContent = fmtShort(totalOps);
  document.getElementById('ops_total').style.color = totalOps < 0 ? '#c62828' : '';

  renderCfChart(balances);
}

function renderCfChart(balances) {
  const ctx = document.getElementById('cf-chart');
  if (!ctx) return;
  if (cfChart) cfChart.destroy();
  cfChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: CF_MONTHS,
      datasets: [{
        type: 'line',
        label: '月末残高',
        data: balances.map(v => Math.round(v / 10000)),
        borderColor: '#1a3a5c',
        backgroundColor: 'rgba(26,58,92,0.08)',
        borderWidth: 2,
        pointRadius: 4,
        fill: true,
        yAxisID: 'y',
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: 'top' } },
      scales: {
        y: {
          title: { display: true, text: '万円' },
          ticks: { callback: v => v.toLocaleString() + '万' }
        }
      }
    }
  });
}

function clearCfTable() {
  const inputs = document.querySelectorAll('.cf-input');
  inputs.forEach(el => el.value = '');
  recalcCf();
}

function fmtShort(v) {
  return Math.round(v / 10000).toLocaleString() + '万';
}
