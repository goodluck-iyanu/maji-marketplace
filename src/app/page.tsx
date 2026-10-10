import Link from 'next/link'
import {
  ArrowRight,
  CheckCircle2,
  CreditCard,
  Package,
  ShieldCheck,
  Sparkles,
  Store,
  Truck,
  Zap,
} from 'lucide-react'
import {
  MajiLogo,
  MajiSpinner,
  MajiStorefrontBadge,
} from '@/components/brand/maji-brand'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#111111] flex flex-col selection:bg-[#F05A28]/15">
      {/* Top Navigation Header */}
      <header className="sticky top-0 z-40 w-full bg-[#FAF8F5]/85 backdrop-blur-md border-b border-[#111111]/[0.07]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group" aria-label="Maji Home">
            <MajiLogo
              variant="horizontal"
              colorway="ember-duotone-light"
              size={36}
              className="transition-transform duration-200 group-hover:scale-[1.02]"
            />
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-neutral-600">
            <a href="#features" className="hover:text-[#111111] transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="hover:text-[#111111] transition-colors">
              How It Works
            </a>
            <a href="#payouts" className="hover:text-[#111111] transition-colors">
              Paystack Payouts
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-[#111111] hover:bg-[#111111]/[0.05] transition-colors"
            >
              Login
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#F05A28] text-white text-sm font-semibold shadow-sm shadow-[#F05A28]/25 hover:bg-[#d94b1c] transition-all hover:-translate-y-0.5"
            >
              <span>Start Selling</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative overflow-hidden pt-14 pb-20 sm:pt-20 sm:pb-28 maji-grid-bg">
          {/* Magic UI Ambient Radial Ember Glow */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 h-[420px] w-[680px] rounded-full blur-3xl opacity-20"
            style={{
              background:
                'radial-gradient(circle, #F05A28 0%, #FF8559 48%, transparent 75%)',
            }}
          />

          <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              {/* Left Column: Value Proposition */}
              <div className="lg:col-span-7 text-center lg:text-left">
                <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white border border-[#111111]/[0.08] shadow-xs mb-6">
                  <MajiLogo
                    variant="symbol"
                    colorway="ember-orange"
                    size={18}
                    animation="bounce"
                  />
                  <span className="text-xs font-semibold tracking-wide text-[#111111]">
                    Built for Nigerian Merchants &amp; Creators
                  </span>
                  <span className="h-1.5 w-1.5 rounded-full bg-[#F05A28]" />
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#111111] leading-[1.08]">
                  Create your online store{' '}
                  <span className="text-[#F05A28]">in minutes.</span>
                </h1>

                <p className="mt-5 text-base sm:text-lg text-neutral-600 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                  The easiest way to sell physical and digital products online. Launch your custom storefront, calculate live delivery quotes, and receive direct bank payouts automatically.
                </p>

                <div className="mt-8 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5">
                  <Link
                    href="/login"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-4 rounded-2xl bg-[#111111] text-white font-semibold text-base shadow-lg shadow-[#111111]/10 hover:bg-[#F05A28] transition-all duration-200 hover:-translate-y-0.5"
                  >
                    <span>Start Selling</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href="/login"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-4 rounded-2xl bg-white text-[#111111] font-semibold text-base border border-[#111111]/12 hover:border-[#111111]/30 hover:bg-neutral-50 transition-all"
                  >
                    <span>Login to Dashboard</span>
                  </Link>
                </div>

                <div className="mt-8 flex flex-wrap items-center justify-center lg:justify-start gap-x-6 gap-y-2 text-xs font-medium text-neutral-500">
                  <span className="inline-flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[#F05A28]" />
                    Physical &amp; Digital Products
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[#F05A28]" />
                    Automated Paystack Subaccounts
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[#F05A28]" />
                    Live Lagos &amp; Ogun Delivery Quotes
                  </span>
                </div>
              </div>

              {/* Right Column: Interactive Maji Brand & Live Storefront Showcase */}
              <div className="lg:col-span-5">
                <div className="relative rounded-3xl bg-white border border-[#111111]/[0.08] p-6 sm:p-7 shadow-2xl shadow-[#111111]/[0.06]">
                  {/* Top Bar */}
                  <div className="flex items-center justify-between pb-5 mb-5 border-b border-neutral-100">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-[#F05A28]" />
                      <span className="h-2.5 w-2.5 rounded-full bg-[#FF8559]" />
                      <span className="h-2.5 w-2.5 rounded-full bg-neutral-200" />
                    </div>
                    <span className="text-[11px] font-mono text-neutral-400 bg-neutral-50 px-2.5 py-1 rounded-md border border-neutral-100">
                      maji.hoberg.com.ng/store/your-brand
                    </span>
                  </div>

                  {/* Animated Splash Lockup Stage (05 · Full Lockup Splash Reveal) */}
                  <div className="rounded-2xl bg-[#FAF8F5] border border-[#111111]/[0.06] p-6 flex flex-col items-center justify-center text-center mb-5">
                    <MajiLogo
                      variant="horizontal"
                      colorway="ember-duotone-light"
                      size={58}
                      animation="splash"
                    />
                    <p className="mt-3 text-xs font-medium text-neutral-500">
                      Storefront Basket Smile · Instant Merchant Identity
                    </p>
                  </div>

                  {/* Live Storefront Motion Indicators (Loaders 01, 02, 04, 06) */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-[#FAF8F5]/70 border border-[#111111]/[0.06] p-3.5 flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-white border border-neutral-200/80 flex items-center justify-center shrink-0">
                        <MajiLogo
                          variant="symbol"
                          colorway="ember-orange"
                          size={26}
                          animation="bounce"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#111111] truncate">
                          Instant Store
                        </p>
                        <p className="text-[11px] text-neutral-500 truncate">
                          Ready in 60 secs
                        </p>
                      </div>
                    </div>

                    <div className="rounded-2xl bg-[#FAF8F5]/70 border border-[#111111]/[0.06] p-3.5 flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-white border border-neutral-200/80 flex items-center justify-center shrink-0">
                        <MajiLogo
                          variant="symbol"
                          colorway="ember-duotone-light"
                          size={26}
                          animation="rocker"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#111111] truncate">
                          Smart Cart
                        </p>
                        <p className="text-[11px] text-neutral-500 truncate">
                          Variants &amp; stock
                        </p>
                      </div>
                    </div>

                    <div className="rounded-2xl bg-[#FAF8F5]/70 border border-[#111111]/[0.06] p-3.5 flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-white border border-neutral-200/80 flex items-center justify-center shrink-0">
                        <MajiSpinner size={24} color="ember" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#111111] truncate">
                          Fast Checkout
                        </p>
                        <p className="text-[11px] text-neutral-500 truncate">
                          Paystack verified
                        </p>
                      </div>
                    </div>

                    <div className="rounded-2xl bg-[#111111] text-white p-3.5 flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                        <MajiLogo
                          variant="symbol"
                          colorway="ember-orange"
                          size={26}
                          animation="pulse"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate">
                          T+1 Payouts
                        </p>
                        <p className="text-[11px] text-neutral-400 truncate">
                          Direct to bank
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Bento Features Section */}
        <section id="features" className="py-20 bg-white border-y border-[#111111]/[0.06]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="max-w-2xl mx-auto text-center mb-14">
              <span className="inline-block text-xs font-bold uppercase tracking-widest text-[#F05A28] mb-2">
                Everything You Need to Sell
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#111111]">
                Designed for speed, trust, and growth
              </h2>
              <p className="mt-3 text-neutral-500 text-sm sm:text-base">
                Maji combines a custom storefront builder, automated payment splitting, and logistics quotes into one cohesive workspace.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="rounded-3xl bg-[#FAF8F5] border border-[#111111]/[0.07] p-7 hover:border-[#F05A28]/40 transition-all">
                <div className="h-11 w-11 rounded-2xl bg-[#F05A28]/10 text-[#F05A28] flex items-center justify-center mb-5">
                  <Store className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-[#111111] mb-2">
                  Custom Branded Storefront
                </h3>
                <p className="text-sm text-neutral-600 leading-relaxed">
                  Get your own shareable Maji store link, custom brand colors, banner, social links, and mobile-optimized shopping cart immediately.
                </p>
              </div>

              <div id="payouts" className="rounded-3xl bg-[#FAF8F5] border border-[#111111]/[0.07] p-7 hover:border-[#F05A28]/40 transition-all">
                <div className="h-11 w-11 rounded-2xl bg-[#F05A28]/10 text-[#F05A28] flex items-center justify-center mb-5">
                  <CreditCard className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-[#111111] mb-2">
                  Direct Paystack Bank Payouts
                </h3>
                <p className="text-sm text-neutral-600 leading-relaxed">
                  Connect any Nigerian bank account with instant account name resolution and receive automated split settlements via Paystack.
                </p>
              </div>

              <div className="rounded-3xl bg-[#FAF8F5] border border-[#111111]/[0.07] p-7 hover:border-[#F05A28]/40 transition-all">
                <div className="h-11 w-11 rounded-2xl bg-[#F05A28]/10 text-[#F05A28] flex items-center justify-center mb-5">
                  <Truck className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-[#111111] mb-2">
                  Live Delivery &amp; Order Tracking
                </h3>
                <p className="text-sm text-neutral-600 leading-relaxed">
                  Customers can calculate live delivery rates at checkout or arrange pickup directly, with dedicated order reference tracking pages.
                </p>
              </div>

              <div className="rounded-3xl bg-[#FAF8F5] border border-[#111111]/[0.07] p-7 hover:border-[#F05A28]/40 transition-all">
                <div className="h-11 w-11 rounded-2xl bg-[#F05A28]/10 text-[#F05A28] flex items-center justify-center mb-5">
                  <Package className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-[#111111] mb-2">
                  Physical &amp; Digital Catalogs
                </h3>
                <p className="text-sm text-neutral-600 leading-relaxed">
                  Sell clothing, gadgets, food, and beauty alongside instant digital downloads like ebooks, courses, templates, and software.
                </p>
              </div>

              <div className="rounded-3xl bg-[#FAF8F5] border border-[#111111]/[0.07] p-7 hover:border-[#F05A28]/40 transition-all">
                <div className="h-11 w-11 rounded-2xl bg-[#F05A28]/10 text-[#F05A28] flex items-center justify-center mb-5">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-[#111111] mb-2">
                  Hoberg AI Seller Assistant
                </h3>
                <p className="text-sm text-neutral-600 leading-relaxed">
                  Built-in AI assistant inside your seller dashboard to guide you through store setup, product creation, and payout verification.
                </p>
              </div>

              <div className="rounded-3xl bg-[#111111] text-white p-7 flex flex-col justify-between">
                <div>
                  <div className="h-11 w-11 rounded-2xl bg-[#F05A28] text-white flex items-center justify-center mb-5">
                    <Zap className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">
                    Ready to launch your store?
                  </h3>
                  <p className="text-sm text-neutral-400 leading-relaxed mb-6">
                    Open your Maji seller account today and share your storefront link across WhatsApp, Instagram, and TikTok.
                  </p>
                </div>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-[#F05A28] text-white text-sm font-semibold hover:bg-[#d94b1c] transition-colors"
                >
                  <span>Create Your Store</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="py-20 bg-[#FAF8F5]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-xl mx-auto mb-14">
              <span className="text-xs font-bold uppercase tracking-widest text-[#F05A28]">
                3 Simple Steps
              </span>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-[#111111]">
                From sign-up to first sale
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  step: '01',
                  title: 'Name your store',
                  desc: 'Sign up and choose whether you sell physical or digital products to customize your storefront.',
                },
                {
                  step: '02',
                  title: 'Connect bank & add products',
                  desc: 'Verify your Nigerian bank account in seconds and upload your products with photos, variants, and prices.',
                },
                {
                  step: '03',
                  title: 'Share & get paid',
                  desc: 'Share your Maji store link anywhere. Customers pay securely via Paystack and you get notified instantly.',
                },
              ].map((item) => (
                <div
                  key={item.step}
                  className="rounded-3xl bg-white border border-[#111111]/[0.07] p-7 shadow-xs"
                >
                  <span className="inline-flex items-center justify-center h-9 px-3 rounded-full bg-[#F05A28]/10 text-[#F05A28] font-mono text-xs font-bold mb-4">
                    STEP {item.step}
                  </span>
                  <h3 className="text-lg font-bold text-[#111111] mb-2">{item.title}</h3>
                  <p className="text-sm text-neutral-600 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Official Deep Obsidian Footer */}
      <footer className="bg-[#111111] text-white border-t border-white/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <MajiLogo variant="horizontal" colorway="ember-duotone-dark" size={32} />
            <span className="hidden sm:inline-block h-4 w-px bg-white/15" />
            <p className="text-xs text-neutral-400">
              Your marketplace, your way · Powered by Hoberg Digital
            </p>
          </div>

          <div className="flex items-center gap-4">
            <MajiStorefrontBadge height={34} />
          </div>
        </div>
      </footer>
    </div>
  )
}
