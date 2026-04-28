import { useState } from 'react'

const CAL_URL = 'https://cal.com/chakra-creative-machines/30-min-creative-growth-audit'

const ITEMS = [
  {
    q: 'Will my ads look like everyone else’s AI ads?',
    a: 'No — because we don’t start from a prompt, we start from your brand’s research. Every hook traces to a line you’ve already earned. Every image follows art direction written to match your voice. If two brands use us, they get two different packs. The only thing they share is the method.',
  },
  {
    q: 'What if the research misses something about my brand?',
    a: 'Open the research file and rewrite the line. Regenerate the one concept that referenced it. Total time: under a minute. The research is an editable artifact, not a black box. You own the source-of-truth — we just fill it in fast.',
  },
  {
    q: 'Does it work for brands without a real website yet?',
    a: 'Kind of. If you have a landing page with voice, proof points, and at least a rough ICP, yes. If you have a Notion doc and a Shopify template, feed us the Notion. If you have neither, start there — we’ll do a sharper job with even a one-page brand doc than with a thin site.',
  },
  {
    q: 'Can I use the images commercially?',
    a: 'Yes, every image you generate is yours — to run, crop, layer, or print. We cover IP for anything generated under the product; see the Terms for the small print.',
  },
  {
    q: 'What does the done-for-you service cost?',
    a: 'Custom by engagement. Most are a flat monthly retainer plus ad spend, sized to your goals — typical engagements start in the low four figures per month and scale with ad spend. We quote it on the discovery call, once we’ve seen your brand and current performance.',
  },
  {
    q: 'How is this different from a regular agency?',
    a: 'We built the creative engine that runs underneath. Instead of paying a five-person team for two weeks of brief-and-revise, you get the creative volume Andromeda actually rewards — shipped from the same tool you can audit yourself. Founder-led, month-to-month, no account-manager game-of-telephone.',
  },
  {
    q: 'What do you need from me to get started?',
    a: 'Three things: your brand URL, ad-account access (Meta + TikTok), and a 30-minute kickoff so we can hear what’s worked and what hasn’t. First creatives ship in week one. Cancel any month — no lock-in.',
  },
] as const

export function FAQ() {
  const [openIdx, setOpenIdx] = useState(0)

  return (
    <section className="lp-sec" id="faq" style={{ paddingTop: 48 }}>
      <div className="lp-wrap-tight">
        <div className="lp-faq-head">
          <div>
            <h2 className="lp-h2">Things people ask before they sign up.</h2>
          </div>
          <div className="right">
            <p>
              Answers in plain English. If yours isn&rsquo;t here,{' '}
              <a
                className="lp-faq-link"
                href={CAL_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                book a 30-min call
              </a>
              {' '}— we&rsquo;ll cover it live.
            </p>
          </div>
        </div>

        <div className="lp-faq-list">
          {ITEMS.map((item, i) => (
            <div
              key={i}
              className={`lp-faq-item ${openIdx === i ? 'open' : ''}`}
              onClick={() => setOpenIdx(openIdx === i ? -1 : i)}
            >
              <div className="lp-faq-q">
                <h3>{item.q}</h3>
                <span className="lp-faq-icon" />
              </div>
              <div className="lp-faq-a">
                <p>{item.a}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
