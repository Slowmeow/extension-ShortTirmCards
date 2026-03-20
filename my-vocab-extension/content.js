const SOURCE_LANG = 'ja';   // будет перезаписано из storage
const TARGET_LANG = 'en';   // будет перезаписано из storage

let sourceLang = SOURCE_LANG;
let targetLang = TARGET_LANG;

// Загружаем язык из storage
chrome.storage.local.get(['source_lang', 'target_lang'], (r) => {
  sourceLang = r.source_lang || SOURCE_LANG;
  targetLang = r.target_lang || TARGET_LANG;
});

// Обновляем если пользователь сменил язык в popup
chrome.storage.onChanged.addListener((changes) => {
  if (changes.source_lang) sourceLang = changes.source_lang.newValue;
  if (changes.target_lang) targetLang = changes.target_lang.newValue;
});

let tooltip = null;

// ─── Пузырёк ─────────────────────────────────────────────────────
const bubble = document.createElement('div');
bubble.id = 'vocabdeck-bubble';
bubble.textContent = '🔍';
bubble.style.cssText = `
  position: fixed;
  display: none;
  background: #cba6f7;
  color: #1e1e2e;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  font-size: 15px;
  line-height: 30px;
  text-align: center;
  cursor: pointer;
  z-index: 2147483646;
  box-shadow: 0 2px 8px rgba(0,0,0,0.4);
  user-select: none;
`;
document.body.appendChild(bubble);

// ─── Показываем пузырёк при выделении ────────────────────────────
document.addEventListener('mouseup', (e) => {
  if (e.target.closest('#vocabdeck-tooltip') || e.target.closest('#vocabdeck-bubble')) return;

  setTimeout(() => {
    const selection = window.getSelection();
    const text = selection.toString().trim();

    if (text.length > 0) {
      const rect = selection.getRangeAt(0).getBoundingClientRect();
      bubble.style.left = `${Math.min(rect.right + 8, window.innerWidth - 40)}px`;
      bubble.style.top = `${Math.max(rect.top - 40, 8)}px`;
      bubble.style.display = 'block';
    } else {
      hideBubble();
    }
  }, 10);
});

// ─── Клик на пузырёк — переводим выделенное ──────────────────────
bubble.addEventListener('click', async (e) => {
  e.stopPropagation();

  const selection = window.getSelection();
  const word = selection.toString().trim();

  const bx = parseFloat(bubble.style.left);
  const by = parseFloat(bubble.style.top);
  hideBubble();

  if (word) await showTooltip(word, bx, by);
});

// ─── Скрываем пузырёк при клике в другом месте ───────────────────
document.addEventListener('mousedown', (e) => {
  if (e.target.closest('#vocabdeck-bubble') || e.target.closest('#vocabdeck-tooltip')) return;
  hideBubble();
});

function hideBubble() {
  bubble.style.display = 'none';
}

// ─── Тултип ──────────────────────────────────────────────────────
async function showTooltip(word, x, y) {
  removeTooltip();

  tooltip = document.createElement('div');
  tooltip.id = 'vocabdeck-tooltip';
  tooltip.innerHTML = `
    <div class="vd-word">${word}</div>
    <div class="vd-translation">...</div>
    <button class="vd-btn">+ В колоду</button>
  `;

  tooltip.style.cssText = `
    position: fixed;
    left: ${Math.min(x + 12, window.innerWidth - 230)}px;
    top: ${Math.min(y + 8, window.innerHeight - 120)}px;
    z-index: 2147483647;
    background: #1e1e2e;
    color: #cdd6f4;
    border: 1px solid #45475a;
    border-radius: 10px;
    padding: 10px 14px;
    min-width: 160px;
    max-width: 240px;
    font-family: sans-serif;
    font-size: 14px;
    box-shadow: 0 4px 16px rgba(0,0,0,0.5);
  `;

  tooltip.querySelector('.vd-word').style.cssText = `
    font-weight: bold;
    font-size: 16px;
    color: #cba6f7;
    margin-bottom: 4px;
  `;
  tooltip.querySelector('.vd-translation').style.cssText = `
    color: #a6e3a1;
    margin-bottom: 8px;
    min-height: 18px;
  `;
  tooltip.querySelector('.vd-btn').style.cssText = `
    background: #cba6f7;
    color: #1e1e2e;
    border: none;
    border-radius: 6px;
    padding: 4px 12px;
    cursor: pointer;
    font-size: 13px;
    font-weight: bold;
    width: 100%;
  `;

  document.body.appendChild(tooltip);

  setTimeout(() => {
    document.addEventListener('click', onOutsideClick);
  }, 100);

  // Переводим
  const translation = await fetchTranslation(word);
  const el = document.getElementById('vocabdeck-tooltip');
  if (!el) return;

  el.querySelector('.vd-translation').textContent = translation;
  el.querySelector('.vd-btn').onclick = () => {
    saveCard(word, translation);
    el.querySelector('.vd-btn').textContent = '✓ Добавлено';
    setTimeout(removeTooltip, 700);
  };
}

// ─── Перевод ─────────────────────────────────────────────────────
async function fetchTranslation(word) {
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(word)}`;
    const res = await fetch(url);
    const data = await res.json();
    return data[0].map(p => p[0]).filter(Boolean).join('') || '—';
  } catch {
    return '⚠️ ошибка';
  }
}

// ─── Сохранение ──────────────────────────────────────────────────
function saveCard(word, translation) {
  chrome.storage.local.get(['session_deck', 'permanent_deck'], (r) => {
    const session = r.session_deck || [];
    const permanent = r.permanent_deck || [];

    const card = {
      word: word,
      translation: translation,
      addedAt: Date.now(),
      source: window.location.hostname
    };

    console.log('[VocabDeck] сохраняем карточку:', card);

    if (!session.some(c => c.word === word)) session.unshift(card);
    if (!permanent.some(c => c.word === word)) permanent.unshift(card);

    chrome.storage.local.set(
      { session_deck: session, permanent_deck: permanent },
      () => console.log('[VocabDeck] сохранено, сессия:', session.length)
    );
  });
}

// ─── Убрать тултип ───────────────────────────────────────────────
function removeTooltip() {
  const el = document.getElementById('vocabdeck-tooltip');
  if (el) el.remove();
  tooltip = null;
  document.removeEventListener('click', onOutsideClick);
}

function onOutsideClick(e) {
  if (!e.target.closest('#vocabdeck-tooltip')) removeTooltip();
}