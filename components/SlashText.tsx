// Label for an `a.slash` link: on hover it splits along a diagonal and a cut line is drawn
// on that same diagonal (styles in globals.css). The SVG spans the label plus 8% each side
// (viewBox x -8…108 = label 0…100), and the line continues the split — 64% down at the left
// edge to 40% at the right — past both ends.
const SlashText = ({ children }: { children: string }) => (
  <span className="slash-text">
    <span className="slash-top">{children}</span>
    <span className="slash-bottom" aria-hidden="true">
      {children}
    </span>
    <svg className="slash-line" viewBox="-8 0 116 100" preserveAspectRatio="none" aria-hidden="true">
      <line x1="-8" y1="65.92" x2="108" y2="38.08" vectorEffect="non-scaling-stroke" />
    </svg>
  </span>
);

export default SlashText;
