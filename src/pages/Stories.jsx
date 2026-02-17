import { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';

const STORIES = {
  start: {
    title: "The start",
    steps: [
      { img: "/assets/msg1.png", alt: "Your message", caption: "I knew immediately I wanted to impress you with that URL" },
      { img: "/assets/time1.png", alt: "My reply", caption: "I spent 3 hours straight setting it up. I was worried I was taking too long" },
      { img: "/assets/web1.png", alt: "Website", caption: "After all that work I still kept it basic in an attempt to play it cool!" },
      { img: "/assets/reply1.png", alt: "Your Response", caption: "I vividly remember not being able to stop smiling afterwards." },
      { img: "/assets/count1.png", alt: "Countdown", caption: "Which is why I couldn't help myself but share my excitement." },
    ]
  },
  thug: {
    title: "The thug",
    steps: [
      { img: "/assets/img1.png", alt: "img1", caption: "caption 1" },
      { img: "/assets/img1.png", alt: "img2", caption: "caption 2" },
      { img: "/assets/img1.png", alt: "img3", caption: "caption 3" },
    ]
  },
  relief: {
    title: "The relief",
    steps: [
      { img: "/assets/img1.png", alt: "img1", caption: "caption 1" },
      { img: "/assets/img1.png", alt: "img2", caption: "caption 2" },
      { img: "/assets/img1.png", alt: "img3", caption: "caption 3" },
      { img: "/assets/img1.png", alt: "img4", caption: "caption 4" },
    ]
  }
};

export default function Stories() {
  const [activeStory, setActiveStory] = useState(null);
  const [stepIndex, setStepIndex] = useState(0);

  const story = activeStory ? STORIES[activeStory] : null;
  const step = story ? story.steps[stepIndex] : null;

  const closeStory = useCallback(() => {
    setActiveStory(null);
    setStepIndex(0);
  }, []);

  const goNext = useCallback(() => {
    if (!story) return;
    if (stepIndex >= story.steps.length - 1) {
      closeStory();
    } else {
      setStepIndex(i => i + 1);
    }
  }, [story, stepIndex, closeStory]);

  const goPrev = useCallback(() => {
    if (stepIndex > 0) setStepIndex(i => i - 1);
  }, [stepIndex]);

  useEffect(() => {
    if (!activeStory) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') closeStory();
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [activeStory, goNext, goPrev, closeStory]);

  return (
    <Layout title="Stories" subtitle="Three little stories that meant a lot to me.">
      <div className="story-chips">
        <button className="chipCard" onClick={() => setActiveStory('start')}>
          <span className="eyebrow">Chapter 1</span>
          <h3>The Start</h3>
        </button>

        <button className="chipCard cs" disabled>
          <span className="eyebrow">Chapter 2</span>
          <h3>Coming Soon...</h3>
        </button>

        <button className="chipCard cs" disabled>
          <span className="eyebrow">Chapter 3</span>
          <h3>Coming Soon...</h3>
        </button>
      </div>

      {/* Overlay Player */}
      {activeStory && story && step && (
        <div className="overlay" onClick={(e) => { if (!e.target.closest('.player')) closeStory(); }}>
          <div className="player" role="dialog" aria-modal="true">
            <div className="playerHeader">
              <div className="titleSmall">{story.title}</div>
              <button className="closeBtn" onClick={closeStory}>Close</button>
            </div>

            <div className="stage">
              <div className="fade show" key={stepIndex}>
                <div className="imgWrap">
                  <img src={step.img} alt={step.alt || ''} />
                </div>
                {step.caption && <div className="caption">{step.caption}</div>}
              </div>
            </div>

            <div className="playerFooter">
              <div className="progress">
                {story.steps.map((_, i) => (
                  <div key={i} className={`dot ${i === stepIndex ? 'active' : ''}`} />
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="ghost" onClick={goPrev}>Prev</button>
                <button className="ghost" onClick={goNext}>Next</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
