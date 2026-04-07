// ===== Core App =====

const PAGES = {
  dashboard:  { title: 'ダッシュボード' },
  tax:        { title: '税金シミュレーション' },
  cashflow:   { title: 'キャッシュフロー' },
  executive:  { title: '役員報酬シミュレーション' },
  furusato:   { title: 'ふるさと納税シミュレーション' },
  guide:      { title: '法人設立手順ガイド' },
  financial:  { title: '財務分析' },
};

function navigate(pageId) {
  // ページ切替
  document.querySelectorAll('.page').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));

  const page = document.getElementById('page-' + pageId);
  if (page) page.classList.add('active');

  const nav = document.querySelector(`[data-page="${pageId}"]`);
  if (nav) nav.classList.add('active');

  document.getElementById('topbar-title').textContent = PAGES[pageId]?.title || pageId;

  // ページ固有の初期化
  if (pageId === 'cashflow') initCashflow();
  if (pageId === 'tax') switchTaxTab('personal');
  if (pageId === 'executive') renderExecutiveChart(0,0,0,0,0,0);

  window.scrollTo(0, 0);
}

function switchTaxTab(tab) {
  document.querySelectorAll('.tab').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.tab-panel').forEach(el => el.classList.remove('active'));
  document.getElementById('tab-' + tab)?.classList.add('active');
  document.getElementById('panel-' + tab)?.classList.add('active');
}

// 数値フォーマット
function fmt(v) {
  if (v === null || v === undefined) return '-';
  return Math.round(v).toLocaleString('ja-JP');
}

// PDF出力（印刷ダイアログ）
function printPage() {
  window.print();
}

// CSV出力（キャッシュフロー用）
function exportCsv() {
  const table = document.getElementById('cf-table');
  if (!table) return;
  let csv = '';
  for (const row of table.rows) {
    const cells = Array.from(row.cells).map(c => {
      const inp = c.querySelector('input');
      const val = inp ? (inp.value || '0') : c.textContent.trim();
      return `"${val}"`;
    });
    csv += cells.join(',') + '\n';
  }
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'cashflow_' + new Date().toISOString().slice(0,10) + '.csv';
  a.click();
  URL.revokeObjectURL(url);
}

// 初期化
document.addEventListener('DOMContentLoaded', () => {
  navigate('dashboard');
});
