export function BeforeAfter() {
  return (
    <section className="lp-compare-wrap lp-sec" id="shift">
      <div className="lp-wrap">
        <div className="lp-sec-head">
          <div>
            <h2 className="lp-h2">From two-week sprints to five-minute packs.</h2>
          </div>
          <div className="right">
            <p>
              Meta and TikTok reward brands that ship variety, not polish —{' '}
              <strong>30+ different creatives a month</strong>, not three
              perfect ones. Two-week production loops can't keep up.{' '}
              <strong>Creative is the targeting now.</strong>
            </p>
          </div>
        </div>

        <div className="lp-compare">
          <div className="before">
            <span className="lp-compare-tag">Before · The old loop</span>
            <h3><span className="lp-strike">What you're stuck doing now</span></h3>
            <ul className="lp-compare-rows">
              <li><span className="k">Time to first test</span><span className="v"><strong>7 – 14 days.</strong> Brief, concepts, revisions.</span><span className="n">14d</span></li>
              <li><span className="k">Cost per creative</span><span className="v"><strong>~$10 each.</strong> Fiverr templates.</span><span className="n">$10</span></li>
              <li><span className="k">Variant velocity</span><span className="v"><strong>3 – 4 creatives</strong>, variations of one idea.</span><span className="n">×4</span></li>
              <li><span className="k">Iteration loop</span><span className="v"><strong>Two weeks per round.</strong> Slack feedback.</span><span className="n">2wk</span></li>
              <li><span className="k">Brand fit</span><span className="v"><strong>Templates.</strong> Best guess at your hook.</span><span className="n">?</span></li>
            </ul>
            <p className="closer">Slow. Generic. Guess.</p>
          </div>
          <div className="after">
            <span className="lp-compare-tag">After · Creative Machines</span>
            <h3>How performance teams ship now</h3>
            <ul className="lp-compare-rows">
              <li><span className="k">Time to first test</span><span className="v"><strong>Under 5 minutes.</strong> URL in, pack out.</span><span className="n">5m</span></li>
              <li><span className="k">Cost per creative</span><span className="v"><strong>As low as $0.10.</strong></span><span className="n">$0.10</span></li>
              <li><span className="k">Variant velocity</span><span className="v"><strong>30+ a week, or 300.</strong> Cap is your budget, not your team.</span><span className="n">30+</span></li>
              <li><span className="k">Iteration loop</span><span className="v"><strong>Rewrite in chat.</strong> New creative in 30 seconds.</span><span className="n">30s</span></li>
              <li><span className="k">Brand fit</span><span className="v"><strong>Researched from your URL.</strong> Every hook traceable.</span><span className="n">✓</span></li>
            </ul>
            <p className="closer">Fast. Tested. Yours.</p>
          </div>
        </div>
      </div>
    </section>
  )
}
