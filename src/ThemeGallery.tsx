import { useEffect, useRef } from 'react';
import { THEMES } from './themes';
import type { Theme } from './themes';
import styles from './ThemeGallery.module.css';

function Preview({ theme }: { theme: Theme }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = ref.current!;
    const observer = new ResizeObserver(entries => root.style.setProperty('--preview-scale', String(entries[0].contentRect.width / 1280)));
    observer.observe(root);
    return () => observer.disconnect();
  }, []);
  return <div className={styles.preview} ref={ref}><iframe title={`${theme} game preview`} src={`/?theme=${theme}&preview=1`} tabIndex={-1} /></div>;
}
export default function ThemeGallery() {
  return <main className={styles.gallery}>
    <header><h1>Scamagotchi themes</h1><a href="/">Back to game</a></header>
    <p>Five versions of the same game. Open a theme to play.</p>
    <div className={styles.grid}>{THEMES.map(t => <article key={t.id} data-theme={t.id} className={styles.option}>
      <Preview theme={t.id} />
      <div className={styles.caption}><div><h2>{t.name}</h2><p>{t.description}</p></div><a href={`/?theme=${t.id}`}>Use {t.name}</a></div>
    </article>)}</div>
    <p>Adapted from <a href="https://github.com/Nutlope/hallmark">Hallmark</a>: Hum, Almanac, Arcade, Dusk and Cobalt. Typography follows your browser defaults.</p>
  </main>;
}
