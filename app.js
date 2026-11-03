import { buildPreview, exportPlan } from './engine.mjs';

const $ = id => document.getElementById(id);
let currentData;
let currentPreview;

function render(data, name) {
  const preview = buildPreview(data);
  currentData = data;
  currentPreview = preview;
  $('file-name').textContent = name;
  $('total').textContent = preview.length;
  for (const status of ['ready', 'error', 'unchanged']) $(status === 'error' ? 'errors' : status).textContent = preview.filter(item => item.status === status).length;
  $('mapping').replaceChildren(...data.mapping.map(rule => {
    const row = document.createElement('div');
    row.className = 'map-row';
    const old = document.createElement('b'); old.textContent = `${rule.label} · #${rule.from}`;
    const arrow = document.createElement('i'); arrow.textContent = '→';
    const next = document.createElement('span'); next.textContent = `Поле #${rule.to}`;
    row.append(old, arrow, next); return row;
  }));
  $('rows').replaceChildren(...preview.map(item => {
    const tr = document.createElement('tr');
    const id = document.createElement('td'); id.textContent = `#${item.taskId}`;
    const status = document.createElement('td');
    const pill = document.createElement('span'); pill.className = `pill ${item.status}`;
    pill.textContent = { ready: 'Готово', error: 'Ошибка', unchanged: 'Без изменений' }[item.status]; status.append(pill);
    const values = document.createElement('td'); values.textContent = item.updates.map(field => `#${field.id}: ${field.value}`).join(' · ') || '—';
    const note = document.createElement('td'); note.textContent = item.errors.join('; ') || (item.status === 'unchanged' ? 'Все значения уже совпадают' : 'Проверка пройдена');
    tr.append(id, status, values, note); return tr;
  }));
  $('download').disabled = !preview.some(item => item.status === 'ready');
}

async function loadDemo() {
  const response = await fetch('sample.json');
  if (!response.ok) throw new Error('Не удалось загрузить пример');
  render(await response.json(), 'sample.json · форма #1423');
}

$('load-demo').addEventListener('click', () => loadDemo().catch(error => alert(error.message)));
$('file-input').addEventListener('change', async event => {
  const file = event.target.files?.[0]; if (!file) return;
  try { render(JSON.parse(await file.text()), `${file.name} · локальный файл`); }
  catch (error) { alert(`Ошибка JSON: ${error.message}`); }
});
$('download').addEventListener('click', () => {
  const file = new Blob([JSON.stringify(exportPlan(currentData, currentPreview), null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(file);
  const link = document.createElement('a'); link.href = url; link.download = 'pyrus-dry-run-plan.json'; link.click();
  URL.revokeObjectURL(url);
});
loadDemo().catch(() => {});
