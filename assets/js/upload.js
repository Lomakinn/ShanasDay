(() => {
  const input = document.getElementById('uInput');
  const drop = document.getElementById('uDrop');
  const list = document.getElementById('uList');
  const saveBtn = document.getElementById('uSave');
  const pickDirBtn = document.getElementById('uPickDir');

  const MAX_SIZE = 50 * 1024 * 1024; // 50MB
  const items = [];
  let targetDirHandle = null;

  function humanSize(n) {
    if (n >= 1024*1024) return (n/(1024*1024)).toFixed(1) + ' МБ';
    if (n >= 1024) return (n/1024).toFixed(0) + ' КБ';
    return n + ' Б';
  }

  function inferTypeByExt(name) {
    const ext = (name.split('.').pop() || '').toLowerCase();
    switch (ext) {
      case 'mp4': case 'm4v': return 'video/mp4';
      case 'webm': return 'video/webm';
      case 'ogv': case 'ogg': return 'video/ogg';
      case 'mov': return 'video/quicktime';
      default: return '';
    }
  }

  function canPlay(file) {
    const v = document.createElement('video');
    const type = file.type || inferTypeByExt(file.name);
    if (!type) return false;
    const res = v.canPlayType(type);
    if (res === 'probably' || res === 'maybe') return true;
    // attempt fallback for quicktime: try mp4
    if (type === 'video/quicktime') return v.canPlayType('video/mp4') !== '';
    return false;
  }

  function addFiles(files) {
    const arr = Array.from(files || []);
    for (const f of arr) {
      const validSize = f.size <= MAX_SIZE;
      const validType = canPlay(f);
      const accepted = validSize && validType;
      const id = items.length;
      items.push({ file: f, accepted, reason: accepted ? '' : (!validSize ? 'Файл больше 50 МБ' : 'Невоспроизводимый формат') });
      renderItem(id);
    }
    updateSaveState();
  }

  function renderItem(idx) {
    const it = items[idx];
    const li = document.createElement('li');
    li.className = 'u-item';
    const badge = document.createElement('span');
    badge.className = 'u-badge';
    badge.textContent = it.accepted ? 'OK' : 'Отклонён';
    const name = document.createElement('div');
    const title = document.createElement('strong');
    title.textContent = it.file.name;
    const meta = document.createElement('small');
    meta.textContent = `${inferTypeByExt(it.file.name) || it.file.type || 'unknown'} • ${humanSize(it.file.size)}` + (it.reason ? ` — ${it.reason}` : '');
    name.appendChild(title); name.appendChild(document.createElement('br')); name.appendChild(meta);
    li.appendChild(badge); li.appendChild(name);
    list.appendChild(li);
  }

  function updateSaveState() {
    const hasAccepted = items.some(it => it.accepted);
    saveBtn.disabled = !hasAccepted;
  }

  async function pickDir() {
    if (!window.showDirectoryPicker) {
      alert('Ваш браузер не поддерживает выбор папки. Сохраните файлы вручную в assets/videos/.');
      return;
    }
    try {
      targetDirHandle = await window.showDirectoryPicker({ id: 'videos-target' });
    } catch (_) { return; }
  }

  function sanitizeName(name) {
    return name.replace(/[\n\\/:*?"<>|]+/g, '_');
  }

  async function saveAll() {
    const toSave = items.filter(it => it.accepted);
    if (!toSave.length) return;
    if (!targetDirHandle) {
      await pickDir();
      if (!targetDirHandle) return;
    }
    for (const it of toSave) {
      const name = sanitizeName(it.file.name);
      try {
        const h = await targetDirHandle.getFileHandle(name, { create: true });
        const w = await h.createWritable();
        await w.write(it.file);
        await w.close();
      } catch (e) {
        console.error('Save failed', e);
        alert('Не удалось сохранить файл: ' + name);
        return;
      }
    }
    alert('Файлы сохранены. Не забудьте обновить manifest.json (скрипт scripts/build-manifest.mjs).');
  }

  // Events
  input.addEventListener('change', () => addFiles(input.files));

  ;['dragenter','dragover'].forEach(ev => drop.addEventListener(ev, (e)=>{ e.preventDefault(); e.stopPropagation(); drop.classList.add('is-dragover'); }));
  ;['dragleave','drop'].forEach(ev => drop.addEventListener(ev, (e)=>{ e.preventDefault(); e.stopPropagation(); drop.classList.remove('is-dragover'); }));
  drop.addEventListener('drop', (e) => { addFiles(e.dataTransfer.files); });

  saveBtn.addEventListener('click', saveAll);
  pickDirBtn.addEventListener('click', pickDir);
})();

