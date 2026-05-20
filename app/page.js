'use client';

import React, { useState, useEffect } from 'react';
import SearchGrid from '../components/SearchGrid';
import { db } from '../lib/db';
import { Shield, Sparkles } from 'lucide-react';

export default function HomePage() {
  const [showDemoBanner, setShowDemoBanner] = useState(false);

  useEffect(() => {
    // Show banner if running in local mock fallback mode
    if (db.isMock) {
      setShowDemoBanner(true);
    }
  }, []);

  return (
    <div className="home-container">
      {/* 1. Hero Title / Introduction */}
      <section className="hero-section" style={{ textAlign: 'center', padding: '2.5rem 1rem 3.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: '2.5rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', color: 'var(--accent-gold)', padding: '0.4rem 0.8rem', borderRadius: 'var(--radius-xl)', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '1.25rem' }}>
          <Sparkles size={12} /> Empowering Indian Democracy
        </div>
        <h1 style={{ fontSize: '3rem', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: '1rem' }}>
          Public Servant Ratings <br />
          <span style={{ background: 'linear-gradient(90deg, var(--accent-gold) 0%, var(--accent-blue) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            & Accountability Ledger
          </span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.15rem', maxWidth: '680px', margin: '0 auto', lineHeight: 1.6 }}>
          A secure, decentralized dashboard designed to track civil officer performance, record citizen rating histories, and monitor institutional corruption.
        </p>
      </section>

      {/* 2. Demo Warning Banner (Shows only if Supabase environment variables are missing) */}
      {showDemoBanner && (
        <div className="demo-banner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Shield size={18} style={{ color: 'var(--accent-gold)', flexShrink: 0 }} />
            <span>
              <strong>Local Sandbox Mode Active:</strong> The application is currently using browser <code>localStorage</code> populated with standard seeds. Configure your Supabase variables in <code>.env.local</code> to synchronize with PostgreSQL.
            </span>
          </div>
          <button className="demo-banner-close" onClick={() => setShowDemoBanner(false)}>✕</button>
        </div>
      )}

      {/* 3. Advanced Search and Filters UI */}
      <SearchGrid />
    </div>
  );
}
