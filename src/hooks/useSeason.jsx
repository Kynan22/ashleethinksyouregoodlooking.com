import { useEffect, useState } from 'react';

export function useSeason() {
  const [isChristmas, setIsChristmas] = useState(false);
  const [isValentines, setIsValentines] = useState(false);

  useEffect(() => {
    const now = new Date();
    const month = now.getMonth(); // 0=Jan, 11=Dec
    const date = now.getDate();
    const christmas = month === 11 && date === 25;
    const valentines = month === 1 && date === 14;
    setIsChristmas(christmas);
    setIsValentines(valentines);

    if (christmas) {
      document.body.classList.add('christmas-mode');
    } else {
      document.body.classList.remove('christmas-mode');
    }

    return () => document.body.classList.remove('christmas-mode');
  }, []);

  return { isChristmas, isValentines };
}
