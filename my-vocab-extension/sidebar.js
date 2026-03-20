let currentTab = 'session';

// ─── Загрузка карточек ────────────────────────────────────────────
function loadCards() {
  chrome.storage.local.get(['session_deck', 'permanent_deck'], (result) => {
    const session = result.session_deck || [];
    const permanent = result.permanent_deck || [];

    document.getElementById('count-session').textContent = session.length;
    document.getElementById('count-permanent').textContent = permanent.length;

    renderList(currentTab === 'session' ? session : permanent);
  });
}

function renderList(cards) {
  const list = document.getElementById('list');

  if (cards.length === 0) {
    list.innerHTML = `
      <div class="empty">
        Пока пусто 👀<br>
        Выдели слово на странице<br>и нажми 🔍
      </div>
    `;
    return;
  }

  list.innerHTML = cards.map((card, i) => `
    <div class="card">
      <div class="card-text">
        <div class="card-word">${card.word}</div>
        <div class="card-translation">${card.translation}</div>
      </div>
      <button class="card-delete" data-index="${i}">×</button>
    </div>
  `).join('');

  list.querySelectorAll('.card-delete').forEach(btn => {
    btn.addEventListener('click', () => deleteCard(parseInt(btn.dataset.index)));
  });
}

// ─── Удаление ─────────────────────────────────────────────────────
function deleteCard(index) {
  const key = currentTab === 'session' ? 'session_deck' : 'permanent_deck';
  chrome.storage.local.get([key], (result) => {
    const cards = result[key] || [];
    cards.splice(index, 1);
    chrome.storage.local.set({ [key]: cards }, loadCards);
  });
}

// ─── Очистить ─────────────────────────────────────────────────────
document.getElementById('btn-clear').addEventListener('click', () => {
  const key = currentTab === 'session' ? 'session_deck' : 'permanent_deck';
  if (confirm(`Очистить ${currentTab === 'session' ? 'сессию' : 'все слова'}?`)) {
    chrome.storage.local.set({ [key]: [] }, loadCards);
  }
});

// ─── Квиз ─────────────────────────────────────────────────────────
document.getElementById('btn-quiz').addEventListener('click', () => {
  chrome.tabs.create({ url: chrome.runtime.getURL('quiz.html') });
});

// ─── Настройки языка ──────────────────────────────────────────────
const settingsBtn = document.getElementById('btn-settings');
const settingsPanel = document.getElementById('settings-panel');

settingsBtn.addEventListener('click', () => {
  settingsPanel.classList.toggle('open');
  settingsBtn.classList.toggle('active');
});

// Загружаем текущие языки
chrome.storage.local.get(['source_lang', 'target_lang'], (result) => {
  setActive('source-grid', result.source_lang || 'ja');
  setActive('target-grid', result.target_lang || 'en');
});

// Клики по языкам оригинала
document.getElementById('source-grid').querySelectorAll('.lang-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    chrome.storage.local.set({ source_lang: btn.dataset.lang });
    setActive('source-grid', btn.dataset.lang);
  });
});

// Клики по языкам перевода
document.getElementById('target-grid').querySelectorAll('.lang-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    chrome.storage.local.set({ target_lang: btn.dataset.lang });
    setActive('target-grid', btn.dataset.lang);
  });
});

function setActive(gridId, lang) {
  document.getElementById(gridId).querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === lang);
  });
}

// ─── Табы ─────────────────────────────────────────────────────────
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    currentTab = tab.dataset.tab;
    loadCards();
  });
});

// ─── Обновление при добавлении слова ─────────────────────────────
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local') loadCards();
});

// ─── Старт ────────────────────────────────────────────────────────
loadCards();