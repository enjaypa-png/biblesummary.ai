"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/supabase";
import HeroBibleSearch from "@/components/HeroBibleSearch";
import BrandName from "@/components/BrandName";
import Logo from "@/components/Logo";

export default function ClearBibleLanding() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    getCurrentUser().then((user) => {
      if (user) {
        router.replace("/bible");
      } else {
        setReady(true);
      }
    });
  }, [router]);

  if (!ready) return null;

  return (
    <div className="cb-landing">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

        .cb-landing {
          --accent: #7c5cfc;
          --accent-dark: #6344e0;
          --accent-light: #ede8ff;
          --accent-glow: rgba(124, 92, 252, 0.15);
          --text-primary: #0f0f0f;
          --text-secondary: #4a4a5a;
          --text-muted: #8a8a9a;
          --bg-warm: #faf9f7;
          --card-border: rgba(124, 92, 252, 0.08);
          --card-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04);
          --card-shadow-hover: 0 4px 12px rgba(0,0,0,0.06), 0 20px 48px rgba(0,0,0,0.08);

          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          color: var(--text-primary);
          background: #fff;
          min-height: 100vh;
          overflow-x: hidden;
          -webkit-font-smoothing: antialiased;
        }

        /* ═══════════════════════════════════════════
           HERO
        ═══════════════════════════════════════════ */
        .cb-hero {
          position: relative;
          padding: 100px 24px 80px;
          text-align: center;
          background: linear-gradient(180deg, #f8f5ff 0%, #ede8ff 35%, #e0d6ff 65%, #f3f0ff 100%);
          overflow: hidden;
        }
        .cb-hero::before {
          content: '';
          position: absolute;
          top: -200px;
          left: 50%;
          transform: translateX(-50%);
          width: 800px;
          height: 800px;
          background: radial-gradient(circle, rgba(124,92,252,0.08) 0%, transparent 70%);
          pointer-events: none;
        }
        .cb-hero-inner {
          position: relative;
          z-index: 1;
          max-width: 720px;
          margin: 0 auto;
        }
        .cb-hero-logo { margin: 0 auto 36px; }
        .cb-hero h1 {
          font-size: clamp(38px, 6vw, 62px);
          font-weight: 800;
          line-height: 1.1;
          letter-spacing: -0.03em;
          margin-bottom: 20px;
          color: var(--text-primary);
        }
        .cb-hero h1 .purple { color: var(--accent); }
        .cb-hero .cb-sub {
          font-size: 18px;
          line-height: 1.7;
          color: var(--text-secondary);
          max-width: 540px;
          margin: 0 auto 36px;
          font-weight: 400;
        }
        .cb-hero-ctas {
          display: flex;
          gap: 14px;
          justify-content: center;
          flex-wrap: wrap;
          margin-top: 32px;
        }
        .cb-btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 16px 32px;
          font-size: 15px;
          font-weight: 700;
          color: #fff;
          background: var(--accent);
          border-radius: 999px;
          text-decoration: none;
          box-shadow: 0 4px 16px rgba(124,92,252,0.35), 0 1px 3px rgba(124,92,252,0.2);
          transition: all 0.25s cubic-bezier(0.4,0,0.2,1);
          letter-spacing: -0.01em;
        }
        .cb-btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 32px rgba(124,92,252,0.45), 0 2px 6px rgba(124,92,252,0.25);
          background: var(--accent-dark);
        }
        .cb-btn-outline {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 16px 32px;
          font-size: 15px;
          font-weight: 700;
          color: var(--accent);
          background: #fff;
          border: 2px solid rgba(124,92,252,0.25);
          border-radius: 999px;
          text-decoration: none;
          transition: all 0.25s cubic-bezier(0.4,0,0.2,1);
          letter-spacing: -0.01em;
        }
        .cb-btn-outline:hover {
          background: var(--accent-light);
          border-color: var(--accent);
          transform: translateY(-2px);
        }
        .cb-hero-note {
          font-size: 13px;
          color: var(--text-muted);
          margin-top: 18px;
          font-weight: 500;
        }

        /* ═══════════════════════════════════════════
           CORE MESSAGE — Understand / Remember / Apply
        ═══════════════════════════════════════════ */
        .cb-core {
          padding: 120px 24px 100px;
          background: #fff;
        }
        .cb-core-grid {
          max-width: 1100px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 48px;
        }
        .cb-core-item {
          text-align: center;
          padding: 48px 24px;
          border-radius: 24px;
          transition: all 0.35s cubic-bezier(0.4,0,0.2,1);
          position: relative;
        }
        .cb-core-item:hover {
          background: var(--bg-warm);
          transform: translateY(-4px);
        }
        .cb-core-word {
          font-size: clamp(40px, 5vw, 60px);
          font-weight: 900;
          letter-spacing: -0.04em;
          line-height: 1;
          margin-bottom: 16px;
        }
        .cb-core-word.black { color: var(--text-primary); }
        .cb-core-word.purple { color: var(--accent); }
        .cb-core-desc {
          font-size: 16px;
          line-height: 1.7;
          color: var(--text-secondary);
          max-width: 280px;
          margin: 0 auto;
          font-weight: 400;
        }

        /* ═══════════════════════════════════════════
           FEATURES SECTION
        ═══════════════════════════════════════════ */
        .cb-features {
          padding: 100px 24px 120px;
          background: var(--bg-warm);
        }
        .cb-features-header {
          text-align: center;
          margin-bottom: 100px;
          max-width: 600px;
          margin-left: auto;
          margin-right: auto;
        }
        .cb-label {
          display: inline-block;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 2.5px;
          text-transform: uppercase;
          color: var(--accent);
          background: var(--accent-light);
          padding: 6px 16px;
          border-radius: 999px;
          margin-bottom: 20px;
        }
        .cb-section-title {
          font-size: clamp(32px, 5vw, 48px);
          font-weight: 800;
          letter-spacing: -0.03em;
          line-height: 1.15;
          color: var(--text-primary);
        }
        .cb-section-title .purple { color: var(--accent); }

        /* ─── Feature Block (alternating) ─── */
        .cb-feat {
          max-width: 1100px;
          margin: 0 auto 120px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 80px;
          align-items: center;
        }
        .cb-feat:last-of-type { margin-bottom: 80px; }
        .cb-feat.reverse .cb-feat-text { order: 2; }
        .cb-feat.reverse .cb-feat-demo { order: 1; }

        .cb-feat-text h3 {
          font-size: 36px;
          font-weight: 800;
          letter-spacing: -0.03em;
          line-height: 1.15;
          color: var(--text-primary);
          margin-bottom: 16px;
        }
        .cb-feat-text p {
          font-size: 17px;
          line-height: 1.75;
          color: var(--text-secondary);
          font-weight: 400;
        }
        .cb-feat-text .cb-feat-cta {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          margin-top: 24px;
          font-size: 15px;
          font-weight: 700;
          color: var(--accent);
          text-decoration: none;
          transition: gap 0.2s ease;
        }
        .cb-feat-text .cb-feat-cta:hover { gap: 10px; }

        /* ─── Demo Card (the visual mock-up) ─── */
        .cb-demo {
          background: #fff;
          border-radius: 20px;
          padding: 32px;
          box-shadow: var(--card-shadow);
          border: 1px solid rgba(0,0,0,0.04);
          transition: all 0.35s cubic-bezier(0.4,0,0.2,1);
          position: relative;
          overflow: hidden;
        }
        .cb-demo:hover {
          box-shadow: var(--card-shadow-hover);
          transform: translateY(-4px);
        }
        .cb-demo::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, var(--accent), #a78bfa, var(--accent));
          border-radius: 20px 20px 0 0;
        }

        /* ─── Mock UI inside demos ─── */
        .cb-mock-search {
          display: flex;
          align-items: center;
          gap: 12px;
          background: #f8f7fa;
          border: 1.5px solid #e8e5f0;
          border-radius: 14px;
          padding: 14px 18px;
          margin-bottom: 20px;
        }
        .cb-mock-search svg { flex-shrink: 0; opacity: 0.5; }
        .cb-mock-search-text {
          font-size: 14px;
          color: var(--text-muted);
          font-weight: 500;
        }
        .cb-mock-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          color: var(--accent);
          margin-bottom: 10px;
        }
        .cb-mock-badge-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--accent);
        }
        .cb-mock-answer {
          background: linear-gradient(135deg, #faf8ff 0%, #f5f2ff 100%);
          border-radius: 14px;
          padding: 20px;
          border: 1px solid rgba(124,92,252,0.1);
          margin-bottom: 14px;
        }
        .cb-mock-answer p {
          font-size: 14px;
          line-height: 1.7;
          color: var(--text-secondary);
          margin: 0;
        }
        .cb-mock-verse {
          background: #fff;
          border-radius: 12px;
          padding: 16px 18px;
          border: 1px solid #f0edf5;
          box-shadow: 0 1px 4px rgba(0,0,0,0.03);
        }
        .cb-mock-verse + .cb-mock-verse { margin-top: 10px; }
        .cb-mock-verse-ref {
          font-size: 11px;
          font-weight: 800;
          color: var(--accent);
          letter-spacing: 0.5px;
          margin-bottom: 6px;
        }
        .cb-mock-verse-text {
          font-size: 14px;
          color: var(--text-primary);
          line-height: 1.65;
          font-style: italic;
        }
        .cb-mock-explanation {
          background: linear-gradient(135deg, #faf8ff 0%, #f5f2ff 100%);
          border-radius: 14px;
          padding: 20px;
          border-left: 4px solid var(--accent);
          border-top: 1px solid rgba(124,92,252,0.06);
          border-right: 1px solid rgba(124,92,252,0.06);
          border-bottom: 1px solid rgba(124,92,252,0.06);
          margin-top: 14px;
        }
        .cb-mock-explanation p {
          font-size: 14px;
          line-height: 1.7;
          color: var(--text-secondary);
          margin: 0;
        }
        .cb-mock-chapter-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #fff;
          border-radius: 14px;
          padding: 16px 20px;
          border: 1px solid #f0edf5;
          box-shadow: 0 1px 4px rgba(0,0,0,0.03);
          margin-bottom: 16px;
        }
        .cb-mock-chapter-name {
          font-size: 15px;
          font-weight: 700;
          color: var(--text-primary);
        }
        .cb-mock-chapter-meta {
          font-size: 12px;
          color: var(--text-muted);
          margin-top: 2px;
        }
        .cb-mock-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: var(--accent);
          color: #fff;
          padding: 8px 18px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 700;
          box-shadow: 0 2px 8px rgba(124,92,252,0.3);
        }
        .cb-mock-summary {
          background: linear-gradient(135deg, #faf8ff 0%, #f5f2ff 100%);
          border-radius: 14px;
          padding: 20px;
          border: 1px solid rgba(124,92,252,0.1);
        }
        .cb-mock-summary ul {
          margin: 0;
          padding-left: 18px;
          font-size: 14px;
          line-height: 1.8;
          color: var(--text-secondary);
        }
        .cb-mock-summary ul li { margin-bottom: 4px; }
        .cb-mock-summary ul li:last-child { margin-bottom: 0; }

        /* ─── 3-col cards ─── */
        .cb-cards-3 {
          max-width: 1100px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 28px;
          margin-top: 80px;
        }
        .cb-card {
          background: linear-gradient(160deg, #ffffff 0%, #faf8ff 50%, #f5f0ff 100%);
          border-radius: 24px;
          padding: 44px 36px 40px;
          box-shadow: 0 2px 8px rgba(124,92,252,0.06), 0 12px 40px rgba(124,92,252,0.08);
          border: 1px solid rgba(124,92,252,0.1);
          position: relative;
          overflow: hidden;
          transition: all 0.35s cubic-bezier(0.4,0,0.2,1);
        }
        .cb-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, var(--accent), #a78bfa, #c4b5fd);
        }
        .cb-card::after {
          content: '';
          position: absolute;
          top: -60px;
          right: -60px;
          width: 140px;
          height: 140px;
          background: radial-gradient(circle, rgba(124,92,252,0.06) 0%, transparent 70%);
          pointer-events: none;
        }
        .cb-card:hover {
          box-shadow: 0 4px 16px rgba(124,92,252,0.12), 0 24px 56px rgba(124,92,252,0.14);
          transform: translateY(-8px);
          border-color: rgba(124,92,252,0.2);
        }
        .cb-card-icon {
          width: 64px;
          height: 64px;
          border-radius: 20px;
          background: linear-gradient(135deg, var(--accent) 0%, #9b85fd 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 24px;
        }
        .cb-card-icon svg {
          stroke: #fff !important;
        }
        .cb-card h4 {
          font-size: 22px;
          font-weight: 800;
          letter-spacing: -0.02em;
          color: var(--text-primary);
          margin-bottom: 12px;
        }
        .cb-card p {
          font-size: 15px;
          line-height: 1.75;
          color: var(--text-secondary);
          font-weight: 400;
          position: relative;
        }

        /* ═══════════════════════════════════════════
           WHY SECTION
        ═══════════════════════════════════════════ */
        .cb-why {
          padding: 120px 24px;
          background: #fff;
        }
        .cb-why-grid {
          max-width: 1100px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 80px;
          align-items: center;
        }
        .cb-why-text h2 {
          font-size: clamp(32px, 4vw, 44px);
          font-weight: 800;
          letter-spacing: -0.03em;
          line-height: 1.15;
          color: var(--text-primary);
          margin-bottom: 20px;
        }
        .cb-why-text > p {
          font-size: 17px;
          line-height: 1.75;
          color: var(--text-secondary);
          margin-bottom: 32px;
        }
        .cb-why-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .cb-why-list li {
          display: flex;
          align-items: center;
          gap: 14px;
          font-size: 16px;
          font-weight: 600;
          color: var(--text-primary);
        }
        .cb-check {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--accent-light) 0%, #e8e0ff 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        /* Purple gradient card */
        .cb-purple-card {
          background: linear-gradient(145deg, #7c5cfc 0%, #5a3fd4 50%, #4830b8 100%);
          border-radius: 24px;
          padding: 48px 40px;
          color: #fff;
          box-shadow: 0 8px 32px rgba(124,92,252,0.3), 0 2px 8px rgba(124,92,252,0.2);
          position: relative;
          overflow: hidden;
        }
        .cb-purple-card::before {
          content: '';
          position: absolute;
          top: -60px;
          right: -60px;
          width: 200px;
          height: 200px;
          background: radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%);
          pointer-events: none;
        }
        .cb-purple-card::after {
          content: '';
          position: absolute;
          bottom: -40px;
          left: -40px;
          width: 160px;
          height: 160px;
          background: radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%);
          pointer-events: none;
        }
        .cb-purple-card h3 {
          font-size: 24px;
          font-weight: 800;
          letter-spacing: -0.02em;
          margin-bottom: 28px;
          position: relative;
        }
        .cb-purple-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 16px;
          position: relative;
        }
        .cb-purple-list li {
          display: flex;
          align-items: center;
          gap: 14px;
          font-size: 15px;
          font-weight: 500;
          color: rgba(255,255,255,0.92);
        }
        .cb-purple-check {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: rgba(255,255,255,0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        /* ═══════════════════════════════════════════
           PRICING TEASER
        ═══════════════════════════════════════════ */
        .cb-pricing-teaser {
          padding: 60px 24px;
          background: var(--bg-warm);
          text-align: center;
          border-top: 1px solid rgba(0,0,0,0.04);
          border-bottom: 1px solid rgba(0,0,0,0.04);
        }
        .cb-pricing-teaser p {
          font-size: 16px;
          color: var(--text-secondary);
          margin-bottom: 14px;
        }
        .cb-pricing-teaser a {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 15px;
          font-weight: 700;
          color: var(--accent);
          text-decoration: none;
          transition: gap 0.2s ease;
        }
        .cb-pricing-teaser a:hover { gap: 10px; }

        /* ═══════════════════════════════════════════
           FINAL CTA
        ═══════════════════════════════════════════ */
        .cb-final-cta {
          padding: 120px 24px;
          text-align: center;
          background: linear-gradient(180deg, #fff 0%, #f5f2ff 30%, #ede8ff 60%, #f5f2ff 100%);
          position: relative;
          overflow: hidden;
        }
        .cb-final-cta::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, rgba(124,92,252,0.06) 0%, transparent 70%);
          pointer-events: none;
        }
        .cb-final-cta h2 {
          font-size: clamp(32px, 5vw, 48px);
          font-weight: 800;
          letter-spacing: -0.03em;
          color: var(--text-primary);
          margin-bottom: 12px;
          position: relative;
        }
        .cb-final-cta .cb-tagline {
          font-size: 20px;
          color: var(--text-secondary);
          margin-bottom: 40px;
          font-weight: 500;
          position: relative;
        }
        .cb-final-cta .cb-tagline .purple {
          color: var(--accent);
          font-weight: 700;
        }

        /* ═══════════════════════════════════════════
           DISCLAIMER
        ═══════════════════════════════════════════ */
        .cb-disclaimer {
          padding: 48px 24px;
          background: #fff;
          border-top: 1px solid rgba(0,0,0,0.04);
          text-align: center;
        }
        .cb-disclaimer p {
          max-width: 560px;
          margin: 0 auto;
          font-size: 14px;
          line-height: 1.7;
          color: var(--text-muted);
        }

        /* ═══════════════════════════════════════════
           FOOTER
        ═══════════════════════════════════════════ */
        .cb-footer {
          padding: 48px 24px 32px;
          text-align: center;
          border-top: 1px solid rgba(0,0,0,0.04);
          background: var(--bg-warm);
        }
        .cb-footer-links {
          display: flex;
          justify-content: center;
          gap: 28px;
          flex-wrap: wrap;
          margin-bottom: 16px;
        }
        .cb-footer-links a {
          font-size: 13px;
          font-weight: 500;
          color: var(--text-muted);
          text-decoration: none;
          transition: color 0.2s ease;
        }
        .cb-footer-links a:hover { color: var(--accent); }
        .cb-footer-email {
          font-size: 13px;
          color: var(--text-muted);
          margin-bottom: 4px;
        }
        .cb-footer-copy {
          font-size: 12px;
          color: #ccc;
        }

        /* ═══════════════════════════════════════════
           RESPONSIVE
        ═══════════════════════════════════════════ */
        @media (max-width: 900px) {
          .cb-core-grid { grid-template-columns: 1fr; gap: 24px; }
          .cb-core-item { padding: 32px 16px; }
          .cb-feat {
            grid-template-columns: 1fr;
            gap: 40px;
          }
          .cb-feat.reverse .cb-feat-text { order: 1; }
          .cb-feat.reverse .cb-feat-demo { order: 2; }
          .cb-cards-3 { grid-template-columns: 1fr; }
          .cb-why-grid {
            grid-template-columns: 1fr;
            gap: 48px;
          }
        }
      `}</style>

      {/* ═══════════════════ HERO ═══════════════════ */}
      <section className="cb-hero">
        <div className="cb-hero-inner">
          <div className="cb-hero-logo">
            <Logo variant="hero" height={120} style={{ display: "inline-block" }} />
          </div>
          <h1>
            The <span className="purple">Bible</span> — Finally Easy<br />to Understand
          </h1>
          <p className="cb-sub">
            Read the Bible with AI explanations, clear summaries, and practical guidance for your life.
          </p>
          <HeroBibleSearch />
          <div className="cb-hero-ctas">
            <Link href="/signup" className="cb-btn-primary">
              Start Reading Free
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            </Link>
            <Link href="/#features" className="cb-btn-outline">
              See How It Works
            </Link>
          </div>
          <p className="cb-hero-note">No credit card required &middot; Free forever plan available</p>
        </div>
      </section>

      {/* ═══════════════════ CORE MESSAGE ═══════════════════ */}
      <section className="cb-core">
        <div className="cb-core-grid">
          <div className="cb-core-item">
            <div className="cb-core-word black">Understand</div>
            <p className="cb-core-desc">AI explains every verse in simple language.</p>
          </div>
          <div className="cb-core-item">
            <div className="cb-core-word black">Remember</div>
            <p className="cb-core-desc">Chapter summaries help you retain what you read.</p>
          </div>
          <div className="cb-core-item">
            <div className="cb-core-word purple">Apply</div>
            <p className="cb-core-desc">Get real-life guidance from Scripture.</p>
          </div>
        </div>
      </section>

      {/* ═══════════════════ FEATURES ═══════════════════ */}
      <section id="features" className="cb-features">
        <div className="cb-features-header">
          <div className="cb-label">Features</div>
          <h2 className="cb-section-title">
            Everything you need to<br /><span className="purple">understand Scripture</span>
          </h2>
        </div>

        {/* ── Feature 1: AI Bible Search ── */}
        <div className="cb-feat">
          <div className="cb-feat-text">
            <h3>AI Bible Search</h3>
            <p>
              Ask any Bible question and receive an instant AI-powered answer with supporting verses.
              Try &ldquo;Why did Judas betray Jesus?&rdquo; or &ldquo;Who was Samson?&rdquo; and get clear, sourced answers in seconds.
            </p>
            <Link href="/signup" className="cb-feat-cta">
              Try it free
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            </Link>
          </div>
          <div className="cb-feat-demo">
            <div className="cb-demo">
              <div className="cb-mock-search">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <span className="cb-mock-search-text">Who was Samson?</span>
              </div>
              <div className="cb-mock-answer">
                <div className="cb-mock-badge"><span className="cb-mock-badge-dot" /> AI Answer</div>
                <p>
                  Samson was a judge of Israel known for his incredible strength, which God gave him to defend Israel against the Philistines. His strength was tied to a Nazirite vow — his hair was never to be cut.
                </p>
              </div>
              <div className="cb-mock-verse">
                <div className="cb-mock-verse-ref">Judges 13:24</div>
                <p className="cb-mock-verse-text">
                  The woman gave birth to a son and named him Samson. The boy grew up, and the LORD blessed him.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Feature 2: AI Verse Explanations ── */}
        <div className="cb-feat reverse">
          <div className="cb-feat-text">
            <h3>Instant Verse Explanations</h3>
            <p>
              Tap any verse and instantly see a clear, modern explanation in plain English. No theological jargon — just the meaning, made simple.
            </p>
            <Link href="/signup" className="cb-feat-cta">
              Try it free
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            </Link>
          </div>
          <div className="cb-feat-demo">
            <div className="cb-demo">
              <div className="cb-mock-verse">
                <div className="cb-mock-verse-ref">Philippians 4:13 (KJV)</div>
                <p className="cb-mock-verse-text">
                  I can do all things through Christ which strengtheneth me.
                </p>
              </div>
              <div className="cb-mock-explanation">
                <div className="cb-mock-badge"><span className="cb-mock-badge-dot" /> AI Explanation</div>
                <p>
                  Paul is saying that no matter what situation he faces — whether he has plenty or is in need — he finds strength through his relationship with Christ. This verse is about endurance and contentment, not about achieving anything you want.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Feature 3: Apply to My Life ── */}
        <div className="cb-feat">
          <div className="cb-feat-text">
            <h3>Apply Scripture to Your Life</h3>
            <p>
              The AI helps you take what you read and apply it to real-life situations. Get practical, personal insights that make the Bible relevant to your day-to-day.
            </p>
            <Link href="/signup" className="cb-feat-cta">
              Try it free
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            </Link>
          </div>
          <div className="cb-feat-demo">
            <div className="cb-demo">
              <div className="cb-mock-verse">
                <div className="cb-mock-verse-ref">1 Timothy 6:6</div>
                <p className="cb-mock-verse-text">
                  But godliness with contentment is great gain.
                </p>
              </div>
              <div className="cb-mock-explanation">
                <div className="cb-mock-badge"><span className="cb-mock-badge-dot" /> Apply to My Life</div>
                <p>
                  This week, notice when the desire for more starts to drive your decisions. Contentment isn&rsquo;t settling — it&rsquo;s choosing what matters most. Try writing down three things you&rsquo;re grateful for each morning.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Feature 4: 66 Book Summaries ── */}
        <div className="cb-feat reverse">
          <div className="cb-feat-text">
            <h3>66 Book Summaries</h3>
            <p>
              Every book of the Bible, summarized clearly. Understand entire chapters in minutes so you always know the big picture before diving into the details.
            </p>
            <Link href="/signup" className="cb-feat-cta">
              Start reading
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            </Link>
          </div>
          <div className="cb-feat-demo">
            <div className="cb-demo">
              <div className="cb-mock-chapter-bar">
                <div>
                  <div className="cb-mock-chapter-name">1 Timothy 6</div>
                  <div className="cb-mock-chapter-meta">25 verses</div>
                </div>
                <div className="cb-mock-pill">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
                  View Summary
                </div>
              </div>
              <div className="cb-mock-summary">
                <div className="cb-mock-badge"><span className="cb-mock-badge-dot" /> Chapter Summary</div>
                <ul>
                  <li>Paul instructs Timothy on how servants should treat their masters.</li>
                  <li>He warns against false teachers who use religion as a way to get rich.</li>
                  <li>He describes contentment as &ldquo;great gain&rdquo; and urges Timothy to pursue righteousness.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* ── 3-Column Cards ── */}
        <div className="cb-cards-3">
          <div className="cb-card">
            <div className="cb-card-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L9.19 8.63L2 9.24L7.46 13.97L5.82 21L12 17.27L18.18 21L16.54 13.97L22 9.24L14.81 8.63L12 2Z"/>
              </svg>
            </div>
            <h4>Highlights &amp; Bookmarks</h4>
            <p>Save important verses with color-coded highlights and bookmark exactly where you left off.</p>
          </div>
          <div className="cb-card">
            <div className="cb-card-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </div>
            <h4>Personal Notes</h4>
            <p>Write your own notes on any verse or chapter. Your thoughts, saved alongside Scripture.</p>
          </div>
          <div className="cb-card">
            <div className="cb-card-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
              </svg>
            </div>
            <h4>Listen to the Bible</h4>
            <p>Choose from multiple narrator voices and listen to any chapter while you follow along.</p>
          </div>
        </div>
      </section>

      {/* ═══════════════════ WHY ═══════════════════ */}
      <section className="cb-why">
        <div className="cb-why-grid">
          <div className="cb-why-text">
            <h2>Why ClearBible.ai?</h2>
            <p>
              Other Bible apps are cluttered with ads and confusing tools. ClearBible.ai was built to make Scripture simple.
            </p>
            <ul className="cb-why-list">
              {["No ads — ever", "Clean, distraction-free reading", "Powerful AI tools built in", "Multiple translations (CBT, KJV, WEB)"].map((item) => (
                <li key={item}>
                  <span className="cb-check">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="cb-purple-card">
            <h3>ClearBible.ai</h3>
            <ul className="cb-purple-list">
              {["AI Verse Explanations", "AI Bible Search", "Apply to Your Life", "66 Book Summaries", "Audio Playback", "Highlights, Notes & Bookmarks"].map((item) => (
                <li key={item}>
                  <span className="cb-purple-check">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ═══════════════════ PRICING TEASER ═══════════════════ */}
      <section className="cb-pricing-teaser">
        <p>Bible text, bookmarks, notes, and reading progress are <strong>always free</strong>.</p>
        <Link href="/pricing">
          View Pricing
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
        </Link>
      </section>

      {/* ═══════════════════ DISCLAIMER ═══════════════════ */}
      <section className="cb-disclaimer">
        <p>
          ClearBible.ai is an educational reading tool. It does not provide spiritual counseling, religious advice, or interpretive theology. Summaries describe what each book contains in plain language.
        </p>
      </section>

      {/* ═══════════════════ FINAL CTA ═══════════════════ */}
      <section className="cb-final-cta">
        <h2>Start Understanding the Bible Today</h2>
        <p className="cb-tagline">
          Read. Understand. Remember. <span className="purple">Apply.</span>
        </p>
        <div className="cb-hero-ctas" style={{ position: "relative" }}>
          <Link href="/signup" className="cb-btn-primary">
            Start Reading Free
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
          </Link>
          <Link href="/login" className="cb-btn-outline">Sign In</Link>
        </div>
      </section>

      {/* ═══════════════════ FOOTER ═══════════════════ */}
      <footer className="cb-footer">
        <div style={{ marginBottom: 20 }}>
          <Logo height={56} style={{ margin: "0 auto", display: "block" }} />
        </div>
        <div className="cb-footer-links">
          <Link href="/pricing">Pricing</Link>
          <Link href="/terms">Terms of Service</Link>
          <Link href="/privacy">Privacy Policy</Link>
          <Link href="/refunds">Refund Policy</Link>
        </div>
        <p className="cb-footer-email">support@clearbible.ai</p>
        <p className="cb-footer-copy">&copy; {new Date().getFullYear()} ClearBible.ai</p>
      </footer>
    </div>
  );
}
