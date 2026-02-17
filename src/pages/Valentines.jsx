import { useState, useEffect, useCallback } from 'react';
import { Heart, ChevronLeft, ChevronRight } from 'lucide-react';
import BackButton from '../components/BackButton';

const PAGES = [
  {
    type: 'cover',
    content: (
      <>
        <div className="vday-ornament">❦</div>
        <h1 className="vday-cover-title">Valentine's Day</h1>
        <p className="vday-cover-sub">A home cooked meal</p>
        <div className="vday-cover-date">14 February 2026</div>
        <div className="vday-cover-names">Kynan & Ashlee</div>
        <div className="vday-ornament">❦</div>
      </>
    ),
  },
  {
    type: 'section',
    title: 'To Start',
    items: [
      {
        name: 'Cheese & Crackers Board',
        desc: 'A selection of brie, aged cheddar & gouda with water crackers, quince paste & fresh grapes',
      },
    ],
  },
  {
    type: 'section',
    title: 'Main Course',
    items: [
      {
        name: 'Honey Garlic Pork Tenderloin',
        desc: 'Tender pork glazed with honey & garlic, served with roasted vegetables & creamy mash',
      },
    ],
  },
  {
    type: 'section',
    title: 'Dessert',
    items: [
      {
        name: 'Yochi Run',
        desc: 'A walk down to Yochi for froyo — because we deserve it',
      },
    ],
  },
  {
    type: 'section',
    title: 'To Drink',
    items: [
      {
        name: 'Strawberry Spritz',
        desc: 'Fresh strawberries, prosecco & a splash of soda — sweet and bubbly',
      },
    ],
  },
  {
    type: 'back',
    content: (
      <>
        <div className="vday-ornament">❦</div>
        <p className="vday-back-msg">
          Happy Valentine's Day, Ashlee.
        </p>
        <p className="vday-back-note">
          Every moment with you is my favourite.<br />
          I love you more than words could ever say.
        </p>
        <Heart className="vday-back-heart" size={32} />
        <div className="vday-ornament">❦</div>
      </>
    ),
  },
];

export default function Valentines() {
  const [page, setPage] = useState(0);

  const goNext = useCallback(() => {
    if (page < PAGES.length - 1) setPage(p => p + 1);
  }, [page]);

  const goPrev = useCallback(() => {
    if (page > 0) setPage(p => p - 1);
  }, [page]);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [goNext, goPrev]);

  const currentPage = PAGES[page];

  return (
    <div className="vday-bg">
      {/* Floating hearts background */}
      <div className="vday-hearts-bg" aria-hidden="true">
        {Array.from({ length: 12 }, (_, i) => (
          <span key={i} className="vday-float-heart" style={{
            left: `${8 + (i * 7.5) % 85}%`,
            animationDelay: `${i * 0.7}s`,
            animationDuration: `${4 + (i % 3) * 1.5}s`,
            fontSize: `${12 + (i % 4) * 6}px`,
            opacity: 0.12 + (i % 3) * 0.06,
          }}>♥</span>
        ))}
      </div>

      <main className="shell" style={{ position: 'relative', zIndex: 1 }}>
        <div className="game-header">
          <BackButton />
        </div>

        {/* The menu book */}
        <div className="vday-book">
          {/* Spine decoration */}
          <div className="vday-spine" />

          <div className="vday-page" key={page}>
            {currentPage.type === 'cover' && (
              <div className="vday-page-cover">{currentPage.content}</div>
            )}

            {currentPage.type === 'section' && (
              <div className="vday-page-menu">
                <div className="vday-ornament">✦</div>
                <h2 className="vday-section-title">{currentPage.title}</h2>
                <div className="vday-divider" />
                <div className="vday-items">
                  {currentPage.items.map((item, i) => (
                    <div key={i} className="vday-item">
                      <h3 className="vday-item-name">{item.name}</h3>
                      <p className="vday-item-desc">{item.desc}</p>
                    </div>
                  ))}
                </div>
                <div className="vday-divider" />
                <div className="vday-ornament">✦</div>
              </div>
            )}

            {currentPage.type === 'back' && (
              <div className="vday-page-back">{currentPage.content}</div>
            )}
          </div>

          {/* Page navigation */}
          <div className="vday-nav">
            <button
              className="vday-nav-btn"
              onClick={goPrev}
              disabled={page === 0}
            >
              <ChevronLeft size={18} />
            </button>

            <div className="vday-dots">
              {PAGES.map((_, i) => (
                <div
                  key={i}
                  className={`vday-dot ${i === page ? 'active' : ''}`}
                  onClick={() => setPage(i)}
                />
              ))}
            </div>

            <button
              className="vday-nav-btn"
              onClick={goNext}
              disabled={page === PAGES.length - 1}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
