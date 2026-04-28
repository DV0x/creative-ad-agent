const CAL_URL = 'https://cal.com/chakra-creative-machines/30-min-creative-growth-audit'

export function Footer() {
  return (
    <footer className="lp-footer">
      <div className="lp-wrap lp-footer-grid">
        <div className="lp-footer-brand-col">
          <div className="lp-footer-brand">
            <span className="word-light">Creative</span>
            <span className="word-bold">Machines</span>
          </div>
          <p className="lp-footer-brand-blurb">
            The creative engine for D2C founders and growth teams.
            Research in. A full creative pack out. Every hook traceable.
          </p>
        </div>
        <div>
          <h4>Product</h4>
          <ul>
            <li><a href="#shift">The shift</a></li>
            <li><a href="#run-growth">Run growth</a></li>
            <li><a href="#pricing">Pricing</a></li>
            <li><a href="#faq">FAQ</a></li>
          </ul>
        </div>
        <div>
          <h4>Talk to us</h4>
          <ul>
            <li>
              <a href={CAL_URL} target="_blank" rel="noopener noreferrer">
                Book a 30-min call
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="lp-wrap lp-footer-bottom">
        <span>For brands too small for an agency, too serious for slop.</span>
        <span>creativemachines.xyz</span>
      </div>
    </footer>
  )
}
