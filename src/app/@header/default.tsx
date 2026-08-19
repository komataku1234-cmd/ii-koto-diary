export default function Header() {
  return (
    <header>
      <nav>
        <span>サイトロゴ</span>
        <ul style={{ display: "flex", gap: "1rem", listStyle: "none" }}>
          <li>Home</li>
          <li>About</li>
          <li>Contact</li>
        </ul>
      </nav>
    </header>
  );
}