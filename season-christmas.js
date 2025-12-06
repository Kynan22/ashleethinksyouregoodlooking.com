// season-christmas.js
// Handles activating "christmas-mode" based on the current date.

(function () {
  function activateSeasonMode(modeClass, predicate) {
    const now = new Date();
    if (!predicate(now)) return;

    // Only apply after DOM is ready
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => {
        document.body.classList.add(modeClass);
      });
    } else {
      document.body.classList.add(modeClass);
    }
  }

  // 🎄 Christmas: December 25 (local time)
  activateSeasonMode("christmas-mode", (now) => {
    const month = now.getMonth(); // 0 = Jan, 11 = Dec
    const date  = now.getDate();
    return month === 11 && date === 25;
    // For testing, you can temporarily change to today's date.
    // For a window: return (month === 11 && date >= 24 && date <= 26);
  });
})();

