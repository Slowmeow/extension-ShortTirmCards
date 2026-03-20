// ─── Загружаем сохранённые настройки ─────────────────────────────
chrome.storage.local.get(['source_lang', 'target_lang'], (result) => {
  const source = result.source_lang || 'ja';
  const target = result.target_lang || 'en';
  setActive('source-grid', source);
  setActive('target-grid', target);
});

// ─── Клики по кнопкам языка оригинала ────────────────────────────
document.getElementById('source-grid').querySelectorAll('.lang-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const lang = btn.dataset.lang;
    chrome.storage.local.set({ source_lang: lang }, () => {
      setActive('source-grid', lang);
      showStatus('Сохранено ✓');
    });
  });
});

// ─── Клики по кнопкам языка перевода ─────────────────────────────
document.getElementById('target-grid').querySelectorAll('.lang-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const lang = btn.dataset.lang;
    chrome.storage.local.set({ target_lang: lang }, () => {
      setActive('target-grid', lang);
      showStatus('Сохранено ✓');
    });
  });
});

// ─── Подсветка активной кнопки ────────────────────────────────────
function setActive(gridId, lang) {
  document.getElementById(gridId).querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === lang);
  });
}

// ─── Статус сохранения ────────────────────────────────────────────
function showStatus(msg) {
  const el = document.getElementById('status');
  el.textContent = msg;
  setTimeout(() => el.textContent = '', 1500);
}