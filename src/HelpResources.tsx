import { ExternalLink, LifeBuoy } from 'lucide-react';
import { HELP_GROUPS, POLICE_REPORT, type SafetyHarm, type SafetyResource } from './safetyResources';
import styles from './HelpResources.module.css';

function ResourceLink({ resource }: { resource: SafetyResource }) {
  return <li><a href={resource.url} target="_blank" rel="noopener noreferrer">{resource.title}<ExternalLink size={15} aria-hidden="true" /><span className={styles.srOnly}> (opens an external website in a new tab)</span></a><p>{resource.description}</p></li>;
}

export default function HelpResources({ harm }: { harm?: SafetyHarm }) {
  const kinds: SafetyHarm[] = harm ? [harm] : ['scam', 'grooming', 'cyberbullying'];
  return <section className={styles.help} aria-label="Real help in Singapore">
    <h3><LifeBuoy size={20} aria-hidden="true" />Real help in Singapore</h3>
    <p>These official links open outside the game. Practice actions here do not contact a platform or the authorities.</p>
    {kinds.map(kind => {
      const group = HELP_GROUPS[kind];
      const body = <><p>{group.guidance}</p><ul>{group.links.map(resource => <ResourceLink key={resource.url} resource={resource} />)}</ul></>;
      return harm ? <div key={kind}>{body}</div> : <details key={kind}><summary>{group.title}</summary>{body}</details>;
    })}
    <ul><ResourceLink resource={POLICE_REPORT} /></ul>
    <p className={styles.note}>For a real report, keep account names, dates, message links and relevant non-intimate messages. Do not download or forward intimate images; ask a trusted adult or the authorities how to handle them safely.</p>
    <small>Guidance checked 6 November 2026. Platform menus may change.</small>
  </section>;
}
