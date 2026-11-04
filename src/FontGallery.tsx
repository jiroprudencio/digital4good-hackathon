import { FONT_PAIRINGS } from './fonts';
import styles from './FontGallery.module.css';

export default function FontGallery() {
  return <main data-theme="pocket" className={styles.gallery}><header><h1>Font pairings</h1><a href="/">Back to game</a></header>
    <p>Silkscreen headings with five reading fonts, in Pocket. The phone keeps its iOS system font.</p>
    {FONT_PAIRINGS.map((font, i) => <section key={font.id} className={styles.row}>
      <aside><h2>{i + 1}. {font.heading} + {font.body}</h2><p>{font.note}</p><a href={`/?font=${font.id}`}>Use this pairing</a><p><a href={`https://fonts.google.com/specimen/${font.heading.replaceAll(' ', '+')}`}>Heading specimen</a> / <a href={`https://fonts.google.com/specimen/${font.body.replaceAll(' ', '+')}`}>Interface specimen</a></p></aside>
      <div data-font={font.id} className={styles.specimen}>
        <h1>Scamagotchi</h1><h2>SGD 1,000,000</h2><p className={styles.stageSample}>School days → Campus life → Working world → Home</p>
        <h3>Check the payment details</h3><p>A familiar name is not enough. Call the supplier using your saved contact before sending money.</p>
        <div className={styles.buttons}><a href={`/?font=${font.id}`}>Play with this pairing</a><span>+SGD 20 per tap</span></div>
        <p>0123456789 / SGD 24 / 240 / 2,400 / I l 1 / O 0</p>
      </div>
    </section>)}
  </main>;
}
