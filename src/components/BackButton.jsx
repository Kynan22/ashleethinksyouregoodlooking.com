import { useNavigate } from 'react-router-dom';

export default function BackButton({ to }) {
  const navigate = useNavigate();

  const handleClick = (e) => {
    e.preventDefault();
    if (to) {
      navigate(to);
    } else {
      navigate(-1);
    }
  };

  return (
    <a className="backBtn" href="#" onClick={handleClick} aria-label="Go back">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path fill="currentColor" d="M15.5 19.1 8.4 12l7.1-7.1-1.4-1.4L5.6 12l8.5 8.5z" />
      </svg>
      Back
    </a>
  );
}
