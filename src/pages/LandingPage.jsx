import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Briefcase, CheckCircle, XCircle, Plus, ArrowRight,
  TrendingUp, Users, Shield, Zap, Star, ChevronDown,
  Trophy, Building2, Target, Bell, Clock, ArrowUpRight
} from 'lucide-react';
import './LandingPage.css';

// ---- Demo Data ----
const DEMO_CARDS = [
  {
    name: 'Priya Sharma',
    company: 'Google',
    role: 'Senior Frontend Engineer',
    rounds: [
      { name: 'Round 1', status: 'passed' },
      { name: 'Round 2', status: 'passed' },
      { name: 'Client Round', status: 'passed' },
    ],
    final: 'hired',
  },
  {
    name: 'Arjun Mehta',
    company: 'Amazon',
    role: 'Full Stack Developer',
    rounds: [
      { name: 'Round 1', status: 'passed' },
      { name: 'Round 2', status: 'passed' },
      { name: 'Client Round', status: 'pending' },
      { name: 'HR Round', status: 'pending' },
    ],
    final: null,
  },
];

const FEATURES = [
  { icon: Target, title: 'Track Every Round', desc: 'Log Round 1, Round 2, Client Round — and add any custom round your process needs.' },
  { icon: TrendingUp, title: 'See Your Progress', desc: "Visual status for every company. Know at a glance what stage you're at across all applications." },
  { icon: Bell, title: 'Never Miss a Beat', desc: 'Instant visual feedback when you pass or fail a round — animated green checks and red alerts.' },
  { icon: Trophy, title: 'Celebrate Your Win', desc: 'When you get the job, a full celebration animation fires off. You deserve it!' },
  { icon: Building2, title: 'Multi-Company View', desc: 'Applied to 10 companies? Track all of them clearly in one organized dashboard.' },
  { icon: Shield, title: 'Private & Secure', desc: 'Secure database architecture keeping your credentials and applications fully protected.' },
];

const STATS = [
  { value: '500+', label: 'Job Seekers' },
  { value: '3,200+', label: 'Applications Tracked' },
  { value: '100%', label: 'Free & Secure' },
];

function RoundRow({ round }) {
  const statusConfig = {
    passed: { color: '#22C55E', bg: 'rgba(34,197,94,0.1)', text: 'Passed', icon: <CheckCircle size={14} /> },
    failed: { color: '#EF4444', bg: 'rgba(239,68,68,0.1)', text: 'Failed', icon: <XCircle size={14} /> },
    pending: { color: '#8A99AD', bg: 'rgba(138,153,173,0.1)', text: 'Pending', icon: <Clock size={14} /> },
  };

  const s = statusConfig[round.status];

  return (
    <div className="demo-round-row">
      <span className="demo-round-row__icon" style={{ color: s.color }}>{s.icon}</span>
      <span className="demo-round-row__name">{round.name}</span>
      <span className="demo-round-row__status" style={{ color: s.color, background: s.bg }}>{s.text}</span>
    </div>
  );
}

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const heroRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="landing-layout">
      {/* ---- NAVBAR ---- */}
      <nav className={`landing-nav ${scrolled ? 'landing-nav--scrolled' : ''}`}>
        <div className="container landing-nav__inner">
          <Link to="/" className="landing-nav__logo">
            <span className="logo-icon">JS</span>
            <span>JobStatus</span>
          </Link>
          <div className="landing-nav__links">
            <a href="#features">Features</a>
            <a href="#demo">Demo</a>
            <Link to="/admin" className="nav-admin-link">Admin</Link>
          </div>
          <div className="landing-nav__actions">
            <Link to="/auth" className="btn-ghost">Login</Link>
            <Link to="/auth" className="btn-primary">Get Started Free</Link>
          </div>
        </div>
      </nav>

      {/* ---- HERO ---- */}
      <section className="hero" ref={heroRef}>
        <div className="hero-bg">
          <div className="hero-blob hero-blob--1" />
          <div className="hero-blob hero-blob--2" />
          <div className="hero-blob hero-blob--3" />
          <div className="hero-grid" />
        </div>
        
        <div className="container hero__content">
          <div className="hero__left">
            <motion.div
              className="hero-eyebrow"
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span />
              Your personal job hunt command center
              <span />
            </motion.div>

            <motion.h1
              className="hero__title"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
            >
              Never Lose Track<br />
              of <em>Where You Stand</em>
            </motion.h1>

            <motion.p
              className="hero__sub"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              Applied to dozens of companies and can't remember which round you're at in each? 
              JobStatus tracks your interviews, custom rounds, and job offers with stunning feedback.
            </motion.p>

            <motion.div
              className="hero__actions"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.45 }}
            >
              <Link to="/auth" className="btn-primary btn-hero">
                Start Tracking Free <ArrowRight size={16} />
              </Link>
              <a href="#demo" className="btn-outline btn-hero">
                Watch Demo
              </a>
            </motion.div>
          </div>

          <div className="hero__right">
            <motion.div
              className="hero-card"
              initial={{ opacity: 0, scale: 0.9, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4, type: 'spring', stiffness: 100 }}
            >
              <div className="hero-card__chrome">
                <span /><span /><span />
                <div className="hero-card__url">jobstatus.app/dashboard</div>
              </div>
              <div className="hero-card__body">
                <div className="hc-sidebar">
                  {['Google ✅', 'Amazon 🔄', 'Flipkart ✅', 'Netflix ❌', 'Microsoft 📋'].map((c, i) => (
                    <div key={i} className={`hc-item ${i === 1 ? 'hc-item--active' : ''}`}>{c}</div>
                  ))}
                </div>
                <div className="hc-main">
                  <div className="hc-role">Full Stack Developer</div>
                  {[
                    { n: 'Round 1', s: 'passed' },
                    { n: 'Round 2', s: 'passed' },
                    { n: 'Client Round', s: 'pending' },
                  ].map((r, i) => (
                    <div key={i} className={`hc-round hc-round--${r.s}`}>
                      <span>{r.s === 'passed' ? '✓' : '○'}</span> {r.n}
                    </div>
                  ))}
                  <div className="hc-status">🏆 Hired!</div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        <div className="hero__scroll">
          <motion.div animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>
            <ChevronDown size={20} />
          </motion.div>
        </div>
      </section>

      {/* ---- DEMO SECTION ---- */}
      <section className="landing-section demo-section" id="demo">
        <div className="container">
          <div className="section-header">
            <span className="section-tagline">Real-Time Trackers</span>
            <h2>Check Out How It Works</h2>
            <p>See exactly where you stand at any company, from the first screen to the official offer letter.</p>
          </div>

          <div className="demo-cards-grid">
            {DEMO_CARDS.map((card, i) => (
              <motion.div
                key={i}
                className={`demo-card-item ${card.final === 'hired' ? 'demo-card-item--hired' : ''}`}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
              >
                <div className="demo-card-item__top">
                  <div className="demo-company-avatar">{card.company[0]}</div>
                  <div>
                    <h3 className="demo-company-name">{card.company}</h3>
                    <p className="demo-company-role">{card.role}</p>
                  </div>
                  {card.final === 'hired' && (
                    <span className="demo-badge demo-badge--hired">🏆 Hired</span>
                  )}
                </div>

                <div className="demo-card-item__meta">
                  <span>Candidate: <strong>{card.name}</strong></span>
                </div>

                <div className="demo-card-item__rounds">
                  {card.rounds.map((round, j) => (
                    <RoundRow key={j} round={round} />
                  ))}
                </div>

                {card.final === 'hired' ? (
                  <div className="demo-offer-box">
                    🎉 Offer Received! Full celebration confetti loaded.
                  </div>
                ) : (
                  <div className="demo-progress-box">
                    <div className="demo-progress-bar">
                      <div className="demo-progress-bar__fill" style={{ width: '50%' }} />
                    </div>
                    <span>Interview process ongoing (50% done)</span>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ---- FEATURES ---- */}
      <section className="landing-section features-section" id="features">
        <div className="container">
          <div className="section-header">
            <span className="section-tagline">Features Overview</span>
            <h2>Engineered For The Modern Job Hunt</h2>
            <p>Everything you need to successfully organize your career progress, with no spreadsheets required.</p>
          </div>

          <div className="features-grid">
            {FEATURES.map((f, i) => (
              <motion.div
                key={i}
                className="feature-card"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
              >
                <div className="feature-card__icon">
                  <f.icon size={22} />
                </div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ---- CTA SECTION ---- */}
      <section className="landing-section cta-section">
        <div className="container">
          <div className="cta-box">
            <div className="cta-box__bg" />
            <div className="cta-box__content">
              <h2>Organize Your Search Today</h2>
              <p>Simple registration. No card required. Completely private, secure, and ready to go.</p>
              
              <div className="cta-stats">
                {STATS.map((s, i) => (
                  <div key={i} className="cta-stat-item">
                    <span className="cta-stat-value">{s.value}</span>
                    <span className="cta-stat-label">{s.label}</span>
                  </div>
                ))}
              </div>

              <Link to="/auth" className="btn-primary btn-hero btn-cta">
                Get Started Now <ArrowUpRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ---- FOOTER ---- */}
      <footer className="landing-footer">
        <div className="container landing-footer__inner">
          <div className="footer-left">
            <span className="logo-icon">JS</span>
            <span>JobStatus</span>
          </div>
          <p>© 2026 JobStatus. Built with premium custom styling. All rights reserved.</p>
          <div className="footer-links">
            <Link to="/auth">Register</Link>
            <Link to="/auth">Login</Link>
            <Link to="/admin">Admin Access</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
