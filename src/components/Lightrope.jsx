export default function Lightrope() {
  return (
    <ul className="lightrope">
      {Array.from({ length: 10 }, (_, i) => (
        <li key={i} />
      ))}
    </ul>
  );
}
