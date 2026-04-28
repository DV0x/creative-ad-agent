const CAL_URL = 'https://cal.com/chakra-creative-machines/30-min-creative-growth-audit'

const SERVICES = [
  {
    name: 'Creative production',
    blurb: 'Research, hooks, and 30+ creatives a week, shipped to your ad accounts.',
  },
  {
    name: 'Media buying',
    blurb: 'Meta + TikTok. Daily optimization, weekly tests, learnings logged.',
  },
  {
    name: 'Landing & lead-gen',
    blurb: 'Pages built for the offer, not the template — shipped fast.',
  },
  {
    name: 'Weekly reporting',
    blurb: 'Hook rate, CPA, ROAS — and exactly what we’ll change next.',
  },
] as const

const TRUST = [
  'Built on the engine you can try yourself',
  'Founder-led. No account-manager game-of-telephone.',
  'Month-to-month. No lock-in.',
] as const

export function DoneForYou() {
  return (
    <section className="lp-sec lp-dfy" id="run-growth">
      <div className="lp-wrap">
        <div className="lp-dfy-head">
          <div>
            <h2 className="lp-h2 lp-dfy-h2">
              We&rsquo;ll run <span className="lp-pop-word">growth</span>.<br />
              You run the <span className="lp-pop-underline">brand</span>.
            </h2>
          </div>
          <div className="right">
            <p className="lp-dfy-sub">
              For D2C founders and local business owners with more ad accounts
              than time. One team, four services, the{' '}
              <span className="lp-pop-underline">full funnel</span> — so the
              creative we ship gets spent, tested, and reported on.
            </p>
          </div>
        </div>

        <div className="lp-dfy-services">
          {SERVICES.map((s) => (
            <div key={s.name} className="lp-dfy-service">
              <h3 className="lp-dfy-service-name">{s.name}</h3>
              <p className="lp-dfy-service-blurb">{s.blurb}</p>
            </div>
          ))}
        </div>

        <ul className="lp-dfy-trust">
          {TRUST.map((t) => (
            <li key={t} className="lp-dfy-trust-pill">{t}</li>
          ))}
        </ul>

        <div className="lp-dfy-cta-row">
          <a
            className="lp-btn lp-btn-primary lp-btn-lg lp-dfy-cta"
            href={CAL_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            Book a discovery call →
          </a>
          <span className="lp-dfy-cta-note">
            30-min creative &amp; growth audit · no obligation
          </span>
        </div>
      </div>
    </section>
  )
}
