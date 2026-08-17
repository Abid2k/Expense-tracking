export default function Stamp({ children, tone = '', className = '' }) {
  const toneClass = tone ? `stamp-${tone}` : '';
  return <span className={['stamp', toneClass, className].filter(Boolean).join(' ')}>{children}</span>;
}
