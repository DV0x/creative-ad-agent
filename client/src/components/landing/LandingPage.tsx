import { Nav } from './Nav'
import { Hero } from './Hero'
import { BeforeAfter } from './BeforeAfter'
import { Pricing } from './Pricing'
import { DoneForYou } from './DoneForYou'
import { FAQ } from './FAQ'
import { Footer } from './Footer'
import './landing.css'

export function LandingPage() {
  return (
    <div className="lp-root">
      <Nav />
      <Hero />
      <BeforeAfter />
      <Pricing />
      <DoneForYou />
      <FAQ />
      <Footer />
    </div>
  )
}
