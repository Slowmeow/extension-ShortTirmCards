let cards = [];
let queue = [];
let current = 0;
let knew = 0;
let forgot = 0;
let currentDeck = 'session';

// ─── Загрузка колод ───────────────────────────────────────────────
chrome.storage.local.get(['session_deck', 'permanent_deck'], (r) => {
  const session = r.session_deck || [];
  const permanent = r.permanent_deck || [];

  document.getElementById('session-count').textContent =
    session.length === 0 ? 'Пусто' : `${session.length} слов`;
  document.getElementById('permanent-count').textContent =
    permanent.length === 0 ? 'Пусто' : `${permanent.length} слов`;

  document.getElementById('btn-session').onclick = () => startQuiz(session, 'session');
  document.getElementById('btn-permanent').onclick = () => startQuiz(permanent, 'permanent');
});

// ─── Старт квиза ──────────────────────────────────────────────────
function startQuiz(deck, deckName) {
  if (deck.length === 0) return;

  currentDeck = deckName;
  cards = [...deck];
  // Перемешиваем
  queue = cards.sort(() => Math.random() - 0.5);
  current = 0;
  knew = 0;
  forgot = 0;

  showScreen('screen-quiz');
  showCard();
}

// ─── Показ карточки ───────────────────────────────────────────────
function showCard() {
  if (current >= queue.length) {
    showResult();
    return;
  }

  const card = queue[current];
  const total = queue.length;

  // Прогресс
  const pct = Math.round((current / total) * 100);
  document.getElementById('progress-fill').style.width = pct + '%';
  document.getElementById('progress-text').textContent = `${current + 1} / ${total}`;

  // Слово
  document.getElementById('quiz-word').textContent = card.word;
  document.getElementById('quiz-hint').textContent = 'нажми чтобы увидеть перевод';
  document.getElementById('quiz-answer').style.display = 'none';
  document.getElementById('quiz-answer').textContent = card.translation;

  // Кнопки
  document.getElementById('btn-show').style.display = 'block';
  document.getElementById('btn-answer-row').style.display = 'none';
}

// ─── Показать ответ ───────────────────────────────────────────────
document.getElementById('btn-show').onclick = () => {
  document.getElementById('quiz-answer').style.display = 'block';
  document.getElementById('quiz-hint').textContent = 'ты знал это слово?';
  document.getElementById('btn-show').style.display = 'none';
  document.getElementById('btn-answer-row').style.display = 'flex';
};

// ─── Знал ─────────────────────────────────────────────────────────
document.getElementById('btn-knew').onclick = () => {
  knew++;
  current++;
  showCard();
};

// ─── Не знал ──────────────────────────────────────────────────────
document.getElementById('btn-forgot').onclick = () => {
  forgot++;
  // Добавляем слово в конец очереди — повторим позже
  queue.push(queue[current]);
  current++;
  showCard();
};

// ─── Результат ────────────────────────────────────────────────────
function showResult() {
  showScreen('screen-result');

  const total = cards.length;
  const pct = Math.round((knew / total) * 100);

  let emoji = '😢';
  let title = 'Попробуй ещё раз!';
  if (pct >= 80) { emoji = '🎉'; title = 'Отличный результат!'; }
  else if (pct >= 50) { emoji = '👍'; title = 'Неплохо!'; }
  else if (pct >= 30) { emoji = '📖'; title = 'Нужно повторить'; }

  document.getElementById('result-emoji').textContent = emoji;
  document.getElementById('result-title').textContent = title;
  document.getElementById('result-stats').innerHTML = `
    Знал: <span>${knew}</span> из ${total}<br>
    Не знал: <span style="color:#f38ba8">${forgot}</span><br>
    Результат: <span>${pct}%</span>
  `;
}

// ─── Кнопки результата ────────────────────────────────────────────
document.getElementById('btn-restart').onclick = () => {
  chrome.storage.local.get(['session_deck', 'permanent_deck'], (r) => {
    const deck = currentDeck === 'session'
      ? (r.session_deck || [])
      : (r.permanent_deck || []);
    startQuiz(deck, currentDeck);
  });
};

document.getElementById('btn-back').onclick = () => {
  showScreen('screen-select');
};

// ─── Переключение экранов ─────────────────────────────────────────
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}