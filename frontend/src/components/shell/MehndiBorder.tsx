/**
 * MehndiBorder — the ornamental henna band that frames the top and bottom of
 * the app shell (T-00). Purely decorative; the band art + `data-mehndi="off"`
 * escape hatch live in styles/index.css.
 */
export function MehndiBorder({ edge }: { edge: 'top' | 'bottom' }) {
  return (
    <div
      aria-hidden="true"
      className={`mehndi-band${edge === 'bottom' ? ' mehndi-band--bottom' : ''}`}
    />
  );
}

export default MehndiBorder;
