import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './Wordle.css';

const MAX_GUESSES = 6;
const WORD_LEN = 5;
const MELBOURNE_TZ = 'Australia/Melbourne';
const DICT_API = 'https://api.dictionaryapi.dev/api/v2/entries/en/';
const STORAGE_KEY = 'wordle_game_state';
const USED_WORDS_KEY = 'wordle_used_words';

const MY_WORDS = [
  "HEART", "LOVER", "KYNAN", "GIZMO", "MOVIE", "PANSY", "ARDEN", "PIZZA",
  "BROWN", "ADORE", "HAPPY", "LATTE", "FLIRT", "MUSIC", "BEACH", "TEXTS", "CALLS"
].map(w => w.toUpperCase().trim()).filter(w => w.length === 5 && /^[A-Z]+$/.test(w));

const KEYBOARD_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', '←']
];

const validatedWords = new Set(MY_WORDS);
const invalidWords = new Set();

function getMelbourneDateKey() {
  const now = new Date();
  const m = new Date(now.toLocaleString('en-US', { timeZone: MELBOURNE_TZ }));
  return `${m.getFullYear()}-${String(m.getMonth()+1).padStart(2,'0')}-${String(m.getDate()).padStart(2,'0')}`;
}

function getDaysSinceEpoch() {
  const now = new Date();
  const m = new Date(now.toLocaleString('en-US', { timeZone: MELBOURNE_TZ }));
  return Math.floor((m - new Date(2024, 0, 1)) / 86400000);
}

function getUsedWords() {
  try { return JSON.parse(localStorage.getItem(USED_WORDS_KEY) || '[]'); }
  catch { return []; }
}

function saveUsedWord(word) {
  const used = getUsedWords();
  if (!used.includes(word)) { used.push(word); localStorage.setItem(USED_WORDS_KEY, JSON.stringify(used)); }
}

function pickTodayWord() {
  const usedWords = getUsedWords();
  let available = MY_WORDS.filter(w => !usedWords.includes(w));
  if (!available.length) { localStorage.removeItem(USED_WORDS_KEY); available = [...MY_WORDS]; }
  const chosen = available[getDaysSinceEpoch() % available.length];
  saveUsedWord(chosen);
  return chosen;
}

function scoreGuess(guess, answer) {
  const result = Array(WORD_LEN).fill('miss');
  const answerArr = answer.split('');
  const used = Array(WORD_LEN).fill(false);
  for (let i = 0; i < WORD_LEN; i++) {
    if (guess[i] === answerArr[i]) { result[i] = 'correct'; used[i] = true; }
  }
  for (let i = 0; i < WORD_LEN; i++) {
    if (result[i] === 'correct') continue;
    const idx = answerArr.findIndex((ch, k) => !used[k] && ch === guess[i]);
    if (idx !== -1) { result[i] = 'present'; used[idx] = true; }
  }
  return result;
}

async function isValidWord(word) {
  word = word.toUpperCase();
  if (validatedWords.has(word)) return true;
  if (invalidWords.has(word)) return false;
  try {
    const res = await fetch(DICT_API + word.toLowerCase());
    if (res.ok) { validatedWords.add(word); return true; }
    invalidWords.add(word); return false;
  } catch { validatedWords.add(word); return true; }
}

export default function Wordle() {
  const navigate = useNavigate();
  const todayKey = useRef(getMelbourneDateKey());

  const [guesses, setGuesses] = useState(() => {
    const saved = loadState(todayKey.current);
    return saved ? saved.guesses : [Array(WORD_LEN).fill('')];
  });
  const [results, setResults] = useState(() => {
    const saved = loadState(todayKey.current);
    return saved ? saved.results : [];
  });
  const [currentRow, setCurrentRow] = useState(() => {
    const saved = loadState(todayKey.current);
    return saved ? saved.currentRow : 0;
  });
  const [currentCol, setCurrentCol] = useState(() => {
    const saved = loadState(todayKey.current);
    return saved ? saved.currentCol : 0;
  });
  const [answer] = useState(() => {
    const saved = loadState(todayKey.current);
    return saved ? saved.answer : pickTodayWord();
  });
  const [gameOver, setGameOver] = useState(() => {
    const saved = loadState(todayKey.current);
    return saved ? saved.gameOver : false;
  });
  const [gameWon, setGameWon] = useState(() => {
    const saved = loadState(todayKey.current);
    return saved ? saved.gameWon : false;
  });
  const [keyStates, setKeyStates] = useState(() => {
    const saved = loadState(todayKey.current);
    return saved ? saved.keyStates : {};
  });
  const [toast, setToast] = useState('');
  const [isRevealing, setIsRevealing] = useState(false);
  const [showShareSuccess, setShowShareSuccess] = useState(false);
  const [popTile, setPopTile] = useState(null);

  // Save state on changes
  useEffect(() => {
    const state = { dateKey: todayKey.current, guesses, results, currentRow, currentCol, answer, gameOver, gameWon, keyStates };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [guesses, results, currentRow, currentCol, answer, gameOver, gameWon, keyStates]);

  const addChar = useCallback((ch) => {
    if (gameOver || isRevealing || currentCol >= WORD_LEN) return;
    ch = ch.toUpperCase();
    if (!/^[A-Z]$/.test(ch)) return;

    setGuesses(prev => {
      const next = prev.map(r => [...r]);
      next[currentRow][currentCol] = ch;
      return next;
    });
    setPopTile(`${currentRow}-${currentCol}`);
    setTimeout(() => setPopTile(null), 100);
    setCurrentCol(c => c + 1);
  }, [gameOver, isRevealing, currentCol, currentRow]);

  const backspace = useCallback(() => {
    if (gameOver || isRevealing || currentCol <= 0) return;
    setGuesses(prev => {
      const next = prev.map(r => [...r]);
      next[currentRow][currentCol - 1] = '';
      return next;
    });
    setCurrentCol(c => c - 1);
  }, [gameOver, isRevealing, currentCol, currentRow]);

  const commitGuess = useCallback(async () => {
    if (gameOver || isRevealing) return;
    const word = guesses[currentRow].join('').toUpperCase();
    if (word.length < WORD_LEN) { setToast('Not enough letters'); return; }

    const valid = await isValidWord(word);
    if (!valid) { setToast('Not in word list'); return; }
    setToast('');

    const result = scoreGuess(word, answer);
    setIsRevealing(true);

    // Reveal tiles with stagger
    const newKeyStates = { ...keyStates };
    for (let i = 0; i < WORD_LEN; i++) {
      const letter = word[i];
      const current = newKeyStates[letter];
      if (current !== 'correct') {
        if (!(current === 'present' && result[i] === 'miss')) {
          newKeyStates[letter] = result[i];
        }
      }
    }

    setResults(prev => [...prev, result]);
    setKeyStates(newKeyStates);

    setTimeout(() => {
      setIsRevealing(false);
      if (word === answer) {
        setGameWon(true);
        setGameOver(true);
        saveUsedWord(answer);
      } else if (currentRow + 1 >= MAX_GUESSES) {
        setToast(`The word was: ${answer}`);
        setGameOver(true);
      } else {
        setCurrentRow(r => r + 1);
        setCurrentCol(0);
        setGuesses(prev => [...prev, Array(WORD_LEN).fill('')]);
      }
    }, WORD_LEN * 80 + 100);
  }, [gameOver, isRevealing, guesses, currentRow, answer, keyStates]);

  // Keyboard handler
  useEffect(() => {
    const handler = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === 'Enter') { e.preventDefault(); commitGuess(); }
      else if (e.key === 'Backspace') { e.preventDefault(); backspace(); }
      else if (/^[a-zA-Z]$/.test(e.key)) addChar(e.key);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [commitGuess, backspace, addChar]);

  const shareResults = async () => {
    const emojiMap = { correct: '💚', present: '🩷', miss: '🩶' };
    const lines = results.map(r => r.map(s => emojiMap[s] || '🩶').join(''));
    const won = gameWon ? results.length : 'X';
    const text = `Wordle ${todayKey.current} ${won}/${MAX_GUESSES}\n\n${lines.join('\n')}`;
    try { await navigator.clipboard.writeText(text); }
    catch { /* fallback */ }
    setShowShareSuccess(true);
    setTimeout(() => setShowShareSuccess(false), 2000);
  };

  const handleKey = (key) => {
    if (key === 'ENTER') commitGuess();
    else if (key === '←') backspace();
    else addChar(key);
  };

  return (
    <main className="shell wordle-shell">
      <section className="card">
        <header className="card-header">
          <button className="backBtn" onClick={() => navigate('/arcade')}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path fill="currentColor" d="M15.5 19.1 8.4 12l7.1-7.1-1.4-1.4L5.6 12l8.5 8.5z"/>
            </svg>
            Back
          </button>
          <h1 className="title">Wordle</h1>
          {gameOver && (
            <button className="share-btn visible" onClick={shareResults}>Share 🩷</button>
          )}
        </header>

        <p className="message" style={{ margin: '0 0 6px', fontSize: 14, opacity: 0.8 }}>5 letters • 6 guesses</p>

        <div className="wordle-wrap">
          <div className={`toast ${toast ? '' : 'hidden'}`} aria-live="polite">{toast}</div>

          <div className="grid" aria-label="Word grid">
            {Array.from({ length: MAX_GUESSES }, (_, r) =>
              Array.from({ length: WORD_LEN }, (_, c) => {
                const letter = guesses[r]?.[c] || '';
                const result = results[r]?.[c];
                const stateClass = result ? `state-${result}` : '';
                const filled = letter ? 'filled' : '';
                const pop = popTile === `${r}-${c}` ? 'pop' : '';
                return (
                  <div key={`${r}-${c}`} className={`tile ${filled} ${stateClass} ${pop}`}>
                    {letter}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </section>

      <div className="keyboard-shell">
        <div className="keyboard" aria-label="Keyboard">
          {KEYBOARD_ROWS.map((row, ri) => (
            <div key={ri} className="keyboard-row">
              {row.map(key => {
                const ks = key.length === 1 ? keyStates[key] : undefined;
                return (
                  <button
                    key={key}
                    className={`key ${key === 'ENTER' || key === '←' ? 'wide' : ''} ${ks ? `state-${ks}` : ''}`}
                    onClick={() => handleKey(key)}
                  >
                    {key}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {showShareSuccess && (
        <div className="share-success show">Copied to clipboard!</div>
      )}
    </main>
  );
}

function loadState(todayKey) {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    const state = JSON.parse(stored);
    if (state.dateKey !== todayKey) return null;
    return state;
  } catch { return null; }
}
