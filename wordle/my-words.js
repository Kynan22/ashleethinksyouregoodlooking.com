// =====================================================
// YOUR CUSTOM WORD LIST
// =====================================================
// Edit this list with your personal/romantic words!
// These are the words that will be chosen as daily answers.
// Add as many 5-letter words as you want.
// The game will cycle through them without repeating.
// 
// RULES:
// - Words must be exactly 5 letters
// - Words should be real English words (so they pass validation)
// - Words are case-insensitive
// =====================================================

const MY_WORDS = [
  "HEART",
  "LOVER",
  "KYNAN",
  "GIZMO",
  "MOVIE",
  "PANSY",
  "ARDEN",
  "PIZZA",
  "BROWN",
  "ADORE",
  "HAPPY",
  "LATTE",
  "FLIRT",
  "MUSIC",
  "BEACH",
  "TEXTS",
  "CALLS"
];

// Export for use in game (filters to only valid 5-letter words)
window.MY_WORDS = MY_WORDS
  .map(w => w.toUpperCase().trim())
  .filter(w => w.length === 5 && /^[A-Z]+$/.test(w));
