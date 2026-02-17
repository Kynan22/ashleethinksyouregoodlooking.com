import { useEffect } from 'react';

export default function Overlay({ children, onClose }) {
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape' && onClose) onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget && onClose) onClose();
  };

  return (
    <div className="ta-overlay" onClick={handleBackdrop}>
      {children}
    </div>
  );
}
