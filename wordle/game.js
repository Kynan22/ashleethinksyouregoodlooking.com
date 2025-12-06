// =====================================================
// WORDLE GAME LOGIC
// =====================================================

(function() {
  const MAX_GUESSES = 6;
  const WORD_LEN = 5;
  const MELBOURNE_TZ = 'Australia/Melbourne';
  
  // Storage keys
  const STORAGE_KEY = 'wordle_game_state';
  const USED_WORDS_KEY = 'wordle_used_words';

  // Dictionary API for word validation
  const DICT_API = 'https://api.dictionaryapi.dev/api/v2/entries/en/';

  // Word validation cache
  const validatedWords = new Set();
  const invalidWords = new Set();

  // Keyboard layout
  const KEYBOARD_ROWS = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', '←']
  ];

  // Game state
  let currentRow = 0;
  let currentCol = 0;
  let guesses = [];
  let results = [];
  let answer = '';
  let gameOver = false;
  let gameWon = false;
  let todayKey = '';
  let keyStates = {};
  let isRevealing = false; // block input during colour reveal

  // DOM elements
  let tiles = [];
  let keys = {};
  let toastEl, gridEl, keyboardEl, shareBtn, shareSuccess;

  // =====================================================
  // DATE UTILITIES (Melbourne timezone)
  // =====================================================
  
  function getMelbourneDateKey() {
    const now = new Date();
    const melbourneDate = new Date(now.toLocaleString('en-US', { timeZone: MELBOURNE_TZ }));
    const year = melbourneDate.getFullYear();
    const month = String(melbourneDate.getMonth() + 1).padStart(2, '0');
    const day = String(melbourneDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function getDaysSinceEpoch() {
    const now = new Date();
    const melbourneDate = new Date(now.toLocaleString('en-US', { timeZone: MELBOURNE_TZ }));
    const epoch = new Date(2024, 0, 1);
    const diffTime = melbourneDate - epoch;
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }

  // =====================================================
  // WORD SELECTION (no repeats)
  // =====================================================

  function getUsedWords() {
    try {
      const stored = localStorage.getItem(USED_WORDS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  function saveUsedWord(word) {
    const used = getUsedWords();
    if (!used.includes(word)) {
      used.push(word);
      localStorage.setItem(USED_WORDS_KEY, JSON.stringify(used));
    }
  }

  function pickTodayWord() {
  const customWords = window.MY_WORDS || [];
  if (customWords.length === 0) {
    console.error('No custom words defined! Add words to my-words.js');
    return 'ERROR';
  }

  // Words already used on this device (stored in localStorage)
  const usedWords = getUsedWords();

  // Only pick from words that haven't been used yet
  let availableWords = customWords.filter(w => !usedWords.includes(w));

  // If we've used everything once, clear the history and start fresh
  if (availableWords.length === 0) {
    localStorage.removeItem(USED_WORDS_KEY);
    availableWords = [...customWords];
  }

  const dayNum = getDaysSinceEpoch();
  const index = dayNum % availableWords.length;
  const chosen = availableWords[index];

  // Mark today’s chosen word as used immediately,
  // so it won't be picked again on future days
  saveUsedWord(chosen);

  return chosen;
}


  // =====================================================
  // WORD VALIDATION (using Dictionary API)
  // =====================================================

  async function isValidWord(word) {
    word = word.toUpperCase();
    
    if (validatedWords.has(word)) return true;
    if (invalidWords.has(word)) return false;

    if (window.MY_WORDS && window.MY_WORDS.includes(word)) {
      validatedWords.add(word);
      return true;
    }

    try {
      const response = await fetch(DICT_API + word.toLowerCase());
      if (response.ok) {
        validatedWords.add(word);
        return true;
      } else {
        invalidWords.add(word);
        return false;
      }
    } catch (error) {
      console.warn('Dictionary API unavailable, accepting word:', word);
      validatedWords.add(word);
      return true;
    }
  }

  // =====================================================
  // GAME STATE PERSISTENCE
  // =====================================================

  function saveGameState() {
    const state = {
      dateKey: todayKey,
      currentRow,
      currentCol,
      guesses,
      results,
      gameOver,
      gameWon,
      answer,
      keyStates
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function loadGameState() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return null;
      const state = JSON.parse(stored);
      if (state.dateKey !== todayKey) return null;
      return state;
    } catch {
      return null;
    }
  }

  // =====================================================
  // UI HELPERS
  // =====================================================

  function toast(msg = '') {
    if (!toastEl) return;
    if (!msg) {
      toastEl.textContent = '';
      toastEl.classList.add('hidden');
    } else {
      toastEl.textContent = msg;
      toastEl.classList.remove('hidden');
    }
  }

  function setTile(r, c, ch) {
    const t = tiles[r * WORD_LEN + c];
    t.textContent = ch;
    if (ch) {
      t.classList.add('filled', 'pop');
    } else {
      t.classList.remove('filled');
    }
    setTimeout(() => t.classList.remove('pop'), 100);
  }

  function paintTile(r, c, state) {
    const t = tiles[r * WORD_LEN + c];
    t.classList.remove('state-correct', 'state-present', 'state-miss');
    if (state === 'correct' || state === 'present' || state === 'miss') {
      t.classList.add('state-' + state);
    }
  }

  function updateKeyState(letter, state) {
    letter = letter.toUpperCase();
    const current = keyStates[letter];
    
    // Priority: correct > present > miss
    if (current === 'correct') return;
    if (current === 'present' && state === 'miss') return;
    
    keyStates[letter] = state;
    
    const keyEl = keys[letter];
    if (keyEl) {
      keyEl.classList.remove('state-correct', 'state-present', 'state-miss');
      keyEl.classList.add('state-' + state);
    }
  }

  function showShareButton() {
    if (!shareBtn) return;
    shareBtn.classList.add('visible');
  }

  function lockInput() {
    gameOver = true;
    showShareButton();
    saveGameState();
    
    if (gameWon) {
      saveUsedWord(answer);
    }
  }

  // =====================================================
  // GAME LOGIC
  // =====================================================

  function scoreGuess(guess) {
    const result = Array(WORD_LEN).fill('miss');
    const answerArr = answer.split('');
    const used = Array(WORD_LEN).fill(false);

    for (let i = 0; i < WORD_LEN; i++) {
      if (guess[i] === answerArr[i]) {
        result[i] = 'correct';
        used[i] = true;
      }
    }

    for (let i = 0; i < WORD_LEN; i++) {
      if (result[i] === 'correct') continue;
      const idx = answerArr.findIndex((ch, k) => !used[k] && ch === guess[i]);
      if (idx !== -1) {
        result[i] = 'present';
        used[idx] = true;
      }
    }

    return result;
  }

  // Reveal a specific row and then run a callback when done
  function revealRow(rowIndex, result, word, done) {
    isRevealing = true;

    for (let i = 0; i < WORD_LEN; i++) {
      setTimeout(() => {
        paintTile(rowIndex, i, result[i]);
        updateKeyState(word[i], result[i]);

        if (i === WORD_LEN - 1) {
          isRevealing = false;
          if (typeof done === 'function') done();
        }
      }, i * 80); // Slight stagger but no flip
    }
  }

  async function commitGuess() {
    if (gameOver || isRevealing) return;

    const wordArray = guesses[currentRow];
    const word = wordArray.join('').toUpperCase();

    if (word.length < WORD_LEN || wordArray.some(ch => ch === '')) {
      toast('Not enough letters');
      return;
    }

    // Removed "Checking..." so nothing flickers here

    const valid = await isValidWord(word);

    if (!valid) {
      toast('Not in word list');
      return;
    }

    toast('');

    const result = scoreGuess(word);
    results.push(result);
    saveGameState();

    const rowIndex = currentRow;

    // Reveal this exact row, then handle win/lose/next row
    revealRow(rowIndex, result, word, () => {
      if (word === answer) {
        gameWon = true;
        toast('');
        lockInput();
        return;
      }

      const nextRow = rowIndex + 1;

      if (nextRow >= MAX_GUESSES) {
        toast(`The word was: ${answer}`);
        lockInput();
        return;
      }

      currentRow = nextRow;
      currentCol = 0;
      guesses.push(Array(WORD_LEN).fill(''));
      saveGameState();
    });
  }

  function addChar(ch) {
    if (gameOver || isRevealing) return;
    if (currentCol >= WORD_LEN) return;
    
    ch = ch.toUpperCase();
    if (!/^[A-Z]$/.test(ch)) return;
    
    guesses[currentRow][currentCol] = ch;
    setTile(currentRow, currentCol, ch);
    currentCol++;
    saveGameState();
  }

  function backspace() {
    if (gameOver || isRevealing) return;
    if (currentCol > 0) {
      currentCol--;
      guesses[currentRow][currentCol] = '';
      setTile(currentRow, currentCol, '');
      saveGameState();
    }
  }

  // =====================================================
  // SHARE FUNCTIONALITY
  // =====================================================

  function generateShareText() {
    // All hearts:
    // - correct: 💚
    // - present: 🩷
    // - miss: 🩶
    const emojiMap = {
      'correct': '💚',
      'present': '🩷',
      'miss': '🩶'
    };

    const lines = results.map(result => 
      result.map(state => emojiMap[state] || emojiMap['miss']).join('')
    );

    const won = gameWon ? results.length : 'X';
    const header = `Wordle ${todayKey} ${won}/${MAX_GUESSES}`;
    
    return header + '\n\n' + lines.join('\n');
  }

  async function shareResults() {
    const text = generateShareText();
    
    try {
      await navigator.clipboard.writeText(text);
      shareSuccess.classList.add('show');
      setTimeout(() => shareSuccess.classList.remove('show'), 2000);
    } catch (err) {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      shareSuccess.classList.add('show');
      setTimeout(() => shareSuccess.classList.remove('show'), 2000);
    }
  }

  // =====================================================
  // KEYBOARD SETUP
  // =====================================================

  function buildKeyboard() {
    KEYBOARD_ROWS.forEach(rowKeys => {
      const rowEl = document.createElement('div');
      rowEl.className = 'keyboard-row';

      rowKeys.forEach(key => {
        const btn = document.createElement('button');
        btn.className = 'key';
        btn.type = 'button';
        btn.textContent = key;
        btn.setAttribute('data-key', key);

        if (key === 'ENTER' || key === '←') {
          btn.classList.add('wide');
        }

        btn.addEventListener('click', () => handleKeyClick(key));
        
        rowEl.appendChild(btn);
        
        if (key.length === 1) {
          keys[key] = btn;
        }
      });

      keyboardEl.appendChild(rowEl);
    });
  }

  function handleKeyClick(key) {
    if (key === 'ENTER') {
      commitGuess();
    } else if (key === '←') {
      backspace();
    } else {
      addChar(key);
    }
  }

  function setupKeyboardInput() {
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      
      if (e.key === 'Enter') {
        e.preventDefault();
        commitGuess();
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        backspace();
      } else if (/^[a-zA-Z]$/.test(e.key)) {
        addChar(e.key);
      }
    });
  }

  // =====================================================
  // INITIALIZATION
  // =====================================================

  function buildGrid() {
    for (let r = 0; r < MAX_GUESSES; r++) {
      for (let c = 0; c < WORD_LEN; c++) {
        const el = document.createElement('div');
        el.className = 'tile';
        gridEl.appendChild(el);
        tiles.push(el);
      }
    }
  }

  function restoreGame(state) {
    currentRow = state.currentRow;
    currentCol = state.currentCol;
    guesses = state.guesses;
    results = state.results;
    gameOver = state.gameOver;
    gameWon = state.gameWon;
    answer = state.answer;
    keyStates = state.keyStates || {};

    // Restore tile states (already guessed rows)
    for (let r = 0; r < results.length; r++) {
      for (let c = 0; c < WORD_LEN; c++) {
        const tile = tiles[r * WORD_LEN + c];
        tile.textContent = guesses[r][c];
        tile.classList.add('filled');
        const s = results[r][c];
        if (s === 'correct' || s === 'present' || s === 'miss') {
          tile.classList.add('state-' + s);
        }
      }
    }

    // Restore current row in progress (if game not over)
    if (!gameOver && guesses[currentRow]) {
      for (let c = 0; c < currentCol; c++) {
        setTile(currentRow, c, guesses[currentRow][c]);
      }
    }

    // Restore keyboard states
    Object.keys(keyStates).forEach(letter => {
      const keyEl = keys[letter];
      if (keyEl) {
        keyEl.classList.add('state-' + keyStates[letter]);
      }
    });

    if (gameOver) {
      showShareButton();
      if (!gameWon) {
        toast(`The word was: ${answer}`);
      } else {
        toast('');
      }
    }
  }

  function init() {
    toastEl = document.getElementById('toast');
    gridEl = document.getElementById('grid');
    keyboardEl = document.getElementById('keyboard');
    shareBtn = document.getElementById('shareBtn');
    shareSuccess = document.getElementById('shareSuccess');

    // Start with no toast showing
    toast('');

    // Match Wordle "correct" colour to the page title colour
    const titleEl = document.querySelector('.title');
    if (titleEl) {
      const titleColor = window.getComputedStyle(titleEl).color;
      document.documentElement.style.setProperty('--wordle-correct-bg', titleColor);
      document.documentElement.style.setProperty('--wordle-correct-border', titleColor);
    }

    // Ensure the vibrant pink present colours are set
    document.documentElement.style.setProperty('--wordle-present-bg', '#f3a3b0');
    document.documentElement.style.setProperty('--wordle-present-border', '#e28191');

    // Build UI
    buildGrid();
    buildKeyboard();

    // Get today's date key
    todayKey = getMelbourneDateKey();

    // Check for existing game
    const savedState = loadGameState();

    if (savedState) {
      restoreGame(savedState);
    } else {
      // New game
      answer = pickTodayWord();
      guesses = [Array(WORD_LEN).fill('')];
      results = [];
      currentRow = 0;
      currentCol = 0;
      gameOver = false;
      gameWon = false;
      keyStates = {};
      saveGameState();
    }

    // Setup input
    setupKeyboardInput();
    shareBtn.addEventListener('click', shareResults);

    console.log('Wordle initialized for', todayKey);
  }

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
