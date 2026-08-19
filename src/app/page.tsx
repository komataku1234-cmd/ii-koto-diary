import Link from "next/link";
import styles from "./page.module.css";

export default function Home() {
  return (
    <main className={styles.container}>
      <h1 className={styles.title}>トップページ</h1>
      <Link href="/about" className={styles.link}>
        Aboutページへ移動
      </Link>
    </main>
  );
}