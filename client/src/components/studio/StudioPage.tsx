import { useEffect } from 'react'
import '../landing/landing.css'
import './studio.css'

// /studio — Chakra's founder services page.
// Copy source of truth: billion-dollar-project/marketing/STUDIO-SITE.md (2026-07-14).
// Every headline, sentence and CTA below is verbatim from that doc. Do not edit
// copy here — edit the doc first, then mirror it.
// Not linked from the product homepage nav; DM prospects get the direct link.

const WHATSAPP_URL =
  'https://wa.me/919642268644?text=Hi%20Chakra%2C%20saw%20your%20page.%20I%20want%20to%20talk%20about%20growing%20my%20business.'
const CAL_URL = 'https://cal.com/chakra-creative-machines/30-min-creative-growth-audit'
const ENGINE_URL = 'https://creativemachines.xyz'
const EMAIL = 'chakra@creativemachines.xyz'

const PAGE_TITLE = 'Chakra — I fill paid workshops and build lead pipelines'
const PAGE_DESCRIPTION =
  'Real campaigns, real numbers, one operator. Last workshop: 43 paid bookings, 87% showed up. Mortgage leads at under $9. Check my math on a call.'

// ---------------------------------------------------------------------------
// TESTIMONIALS PLACEHOLDER — renders NOTHING until real quotes land.
// Per the copy doc, slots reserved for:
//   1. Verbis (results, after close)
//   2. RateFinder friend (build + trust)
//   3. Ravila or NGO (range, one line)
// When real quotes arrive, replace `return null` with the section markup.
// ---------------------------------------------------------------------------
function Testimonials() {
  return null
}

export function StudioPage() {
  useEffect(() => {
    document.title = PAGE_TITLE

    const setMeta = (attr: 'name' | 'property', key: string, content: string) => {
      let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
      if (!el) {
        el = document.createElement('meta')
        el.setAttribute(attr, key)
        document.head.appendChild(el)
      }
      el.setAttribute('content', content)
    }
    setMeta('name', 'description', PAGE_DESCRIPTION)
    setMeta('property', 'og:description', PAGE_DESCRIPTION)
  }, [])

  return (
    <div className="lp-root st-root" id="top">
      {/* Minimal header — wordmark + one WhatsApp CTA. No product nav links. */}
      <header className="st-header">
        <div className="lp-wrap-tight st-header-inner">
          <a href="#top" aria-label="Creative Machines" className="lp-nav-logo">
            <span className="word-light">Creative</span>
            <span className="word-bold">Machines</span>
          </a>
          <a
            className="lp-btn lp-btn-ink st-header-cta"
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            Message me on WhatsApp
          </a>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="st-hero">
          <div className="lp-wrap-tight">
            <h1 className="lp-h1">I fill paid workshops and build lead pipelines.</h1>
            <p className="st-hero-sub">
              One person, with systems built for this. Last campaign: 43 paid bookings
              on ₹30,357 of ads, 87% showed up live, and ticket sales paid back almost
              the whole budget.
            </p>
            <div className="st-cta-row">
              <a
                className="lp-btn lp-btn-primary lp-btn-lg"
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                Message me on WhatsApp
              </a>
            </div>
          </div>
        </section>

        {/* What I do */}
        <section className="st-sec">
          <div className="lp-wrap-tight">
            <h2 className="st-h2">What I do</h2>
            <div className="st-cards">
              <article className="st-card">
                <h3>1. I fill workshops and courses.</h3>
                <p>
                  You sell workshops, courses, challenges or consultations. I make your
                  ads, run them on a fixed budget, and get people to pay, book, and
                  actually show up. Paid bookings plus WhatsApp reminders. My last
                  workshop had 87% live attendance. Free webinars get 30 to 40.
                </p>
              </article>
              <article className="st-card">
                <h3>2. I build lead engines.</h3>
                <p>
                  You need a steady line of enquiries, not shared leads from portals
                  that sell the same phone number to four competitors. I build the
                  funnel on your own domain, run the ads, and connect every enquiry to
                  your WhatsApp or CRM. Every lead is yours alone.
                </p>
              </article>
            </div>
          </div>
        </section>

        {/* How I work */}
        <section className="st-sec">
          <div className="lp-wrap-tight">
            <h2 className="st-h2">How I work</h2>
            <ul className="st-how">
              <li>
                <strong>I test more ads in a week than agencies test in a month.</strong>{' '}
                My last campaign ran 12 different ads in 10 days. Most agencies show you
                3 concepts and take two weeks per round. I can do this because I built
                my own ad engine. It's a live product, you can{' '}
                <a
                  className="st-link"
                  href={ENGINE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  try it yourself
                </a>
                .
              </li>
              <li>
                <strong>Losing ads die fast, winners get fed.</strong>{' '}
                A failing ad gets killed at ₹400 of testing, not ₹3,000. In my last
                campaign a video ad started failing. Killed within 48 hours, and the
                account had its best day right after.
              </li>
              <li>
                <strong>Fixed budget, in writing.</strong>{' '}
                We agree your ad spend before we start. It never goes over. No surprise
                bills, ever.
              </li>
              <li>
                <strong>Real reports.</strong>{' '}
                Numbers from your own system, after they settle. Not screenshots of a
                dashboard mid-campaign.
              </li>
            </ul>
          </div>
        </section>

        {/* Real numbers */}
        <section className="st-sec">
          <div className="lp-wrap-tight">
            <h2 className="st-h2">Real numbers, from real campaigns</h2>
            <div className="st-cards">
              <article className="st-card st-case">
                <h3>An education business (India).</h3>
                <p>
                  Ad spend ₹30,357 over 10 days, cold audience. 43 paid bookings. 34
                  attended live, an 87% show rate. Ticket sales returned 98% of the ad
                  budget before the client sold anything at the event. The winning ad
                  returned ₹1.68 for every ₹1 spent while scaling. These numbers come
                  from the client's own system.
                </p>
              </article>
              <article className="st-card st-case">
                <h3>A mortgage client (Canada).</h3>
                <p>
                  I built their loan-application platform and ran their lead campaigns.
                  The lead campaign turned CAD $3,000 into 338 enquiries, under $9 each.
                  Lead portals charge $40 to $150 for shared leads. All in, about $6,000
                  of ads became roughly $15,000 in commissions. Every ad dollar came
                  back about two and a half times. These numbers come from the ad
                  account and the client's own records.
                </p>
              </article>
            </div>
            <p className="st-closer">
              On a call I'll show you exactly how both worked, and what the same machine
              looks like on your business.
            </p>
          </div>
        </section>

        {/* Testimonials — renders nothing until real quotes land (see component above) */}
        <Testimonials />

        {/* Things I've built */}
        <section className="st-sec">
          <div className="lp-wrap-tight">
            <h2 className="st-h2">Things I've built</h2>
            <p className="st-prose">
              An education platform and the ad campaigns that filled its workshops. A
              mortgage loan-application platform in Canada, end to end, plus its lead
              campaigns. A hotel booking system. A scholarship platform for an NGO. And
              Creative Machines, the ad engine, a live product you can try yourself.
            </p>
          </div>
        </section>

        {/* This is for you if */}
        <section className="st-sec">
          <div className="lp-wrap-tight">
            <h2 className="st-h2">This is for you if</h2>
            <p className="st-prose">
              You sell something real. Workshops, courses, consultations, loans, rooms,
              services. You want customers at a cost you can see. You don't need a big
              following. My ads work on cold audiences.
            </p>
          </div>
        </section>

        {/* Trust strip — I'm Chakra */}
        <section className="st-sec">
          <div className="lp-wrap-tight st-trust">
            {/*
              PHOTO PENDING — Chakra to supply.
              Replace this placeholder block with his photo:
              <img className="st-avatar" src="/studio/chakra.jpg" alt="Chakra" />
            */}
            <div className="st-avatar st-avatar-placeholder" aria-hidden="true" />
            <div>
              <h2 className="st-h2 st-trust-name">I'm Chakra.</h2>
              <p className="st-prose">
                I run this myself. You talk to me, not an account manager.
              </p>
            </div>
          </div>
        </section>

        {/* What happens on the call */}
        <section className="st-sec">
          <div className="lp-wrap-tight">
            <h2 className="st-h2">What happens on the call</h2>
            <p className="st-prose">
              You show me your business. I show you, live, what your ads could look like
              and what the numbers mean for you. No fee, no pressure. If I can't help
              you, I'll say so in the first five minutes.
            </p>
            <div className="st-cta-row">
              <a
                className="lp-btn lp-btn-primary lp-btn-lg"
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                Message me on WhatsApp
              </a>
              <a
                className="lp-btn lp-btn-secondary lp-btn-lg"
                href={CAL_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                Book 30 minutes
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="st-footer">
        <div className="lp-wrap-tight">
          <p>
            <a href={`mailto:${EMAIL}`}>{EMAIL}</a> · Built on Creative Machines, the ad
            engine I made.{' '}
            <a href={ENGINE_URL} target="_blank" rel="noopener noreferrer">
              Try it yourself.
            </a>
          </p>
        </div>
      </footer>
    </div>
  )
}
