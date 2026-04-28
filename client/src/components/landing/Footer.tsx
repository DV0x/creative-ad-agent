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
            The creative engine for D2C brands. Research in. A full
            creative pack out. Every hook traceable.
          </p>
        </div>
        <div>
          <h4>Product</h4>
          <ul>
            <li><a href="#shift">The shift</a></li>
            <li><a href="#pricing">Pricing</a></li>
            <li><a href="#faq">FAQ</a></li>
          </ul>
        </div>
        <div>
          <h4>Company</h4>
          <ul>
            <li><a href="#">About</a></li>
            <li><a href="#">Careers</a></li>
            <li><a href="#">Press</a></li>
          </ul>
        </div>
        <div>
          <h4>Resources</h4>
          <ul>
            <li><a href="#">Case studies</a></li>
            <li><a href="#">Changelog</a></li>
            <li><a href="#">API</a></li>
          </ul>
        </div>
        <div>
          <h4>Legal</h4>
          <ul>
            <li><a href="#">Terms</a></li>
            <li><a href="#">Privacy</a></li>
            <li><a href="#">Image IP</a></li>
          </ul>
        </div>
      </div>
      <div className="lp-wrap lp-footer-bottom">
        <span>© 2026 Creative Machines, Inc.</span>
        <span>v2.4 · creativemachines.xyz</span>
      </div>
    </footer>
  )
}
