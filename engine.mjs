export function normalize(value, type) {
  const raw = String(value ?? '').trim();
  if (type === 'positive_number') {
    const number = Number(raw.replace(/[\s\u00a0]/g, '').replace(',', '.'));
    return Number.isFinite(number) ? number : raw;
  }
  return raw;
}

export function validate(value, rule) {
  if (rule.required && (value === '' || value == null)) return 'Обязательное поле пустое';
  if (value === '' || value == null) return null;
  if (rule.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value))) return 'Неверный адрес почты';
  if (rule.type === 'positive_number' && (typeof value !== 'number' || value <= 0)) return 'Число должно быть больше нуля';
  return null;
}

export function buildPreview(data) {
  if (!Array.isArray(data?.mapping) || !Array.isArray(data?.tasks)) throw new Error('Ожидаются массивы mapping и tasks');
  const ids = new Set();
  for (const rule of data.mapping) {
    if (!Number.isInteger(rule.from) || !Number.isInteger(rule.to) || ids.has(rule.to)) throw new Error('Проверьте ID и уникальность новых полей');
    ids.add(rule.to);
  }
  return data.tasks.map(task => {
    const fields = new Map((task.fields ?? []).map(field => [field.id, field.value]));
    const updates = [];
    const errors = [];
    for (const rule of data.mapping) {
      const value = normalize(fields.get(rule.from), rule.type);
      const error = validate(value, rule);
      if (error) errors.push(`${rule.label}: ${error}`);
      else if (fields.has(rule.to) && String(fields.get(rule.to)) === String(value)) continue;
      else updates.push({ id: rule.to, value });
    }
    return { taskId: task.id, status: errors.length ? 'error' : updates.length ? 'ready' : 'unchanged', updates: errors.length ? [] : updates, errors };
  });
}

export function exportPlan(data, preview) {
  return {
    form_id: data.form_id,
    dry_run: true,
    generated_at: new Date().toISOString(),
    operations: preview.filter(item => item.status === 'ready').map(item => ({
      method: 'POST',
      path: `/tasks/${item.taskId}/comments`,
      body: { field_updates: item.updates }
    }))
  };
}
