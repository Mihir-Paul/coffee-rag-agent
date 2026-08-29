import React from 'react';
import { ArrowRight, ShieldCheck, DollarSign, CheckCircle2, Sliders } from 'lucide-react';
import { Navbar, AppView } from './Navbar';

interface FeaturesPageProps {
  onNavigate: (view: AppView) => void;
  isAuthenticated: boolean;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export const FeaturesPage: React.FC<FeaturesPageProps> = ({
  onNavigate,
  isAuthenticated,
  theme,
  onToggleTheme,
}) => {
  return (
    <>
      <Navbar
        onNavigate={onNavigate}
        currentView="features"
        isAuthenticated={isAuthenticated}
        theme={theme}
        onToggleTheme={onToggleTheme}
      />

      <main style={{ padding: '40px 44px 56px', maxWidth: '1240px', margin: '0 auto' }}>
        <header style={{ textAlign: 'center', marginBottom: '44px' }}>
          <span className="badge">✦ FEATURES</span>
          <h1 className="headline display" style={{ fontSize: '42px', marginTop: '12px' }}>
            Built for better coffee decisions.
          </h1>
          <p className="lead" style={{ margin: '16px auto 0', maxWidth: '680px' }}>
            Designed with state-of-the-art AI architecture to deliver accurate, non-hallucinated recommendations.
          </p>
        </header>

        <section style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
          gap: '20px',
          marginBottom: '56px'
        }}>
          <article className="stat-card">
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: 'rgba(217,164,65,0.16)', color: 'var(--accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: '14px'
            }}>
              <Sliders size={18} style={{ margin: 'auto' }} />
            </div>
            <h2 className="stat-title" style={{ fontSize: '18px' }}>Personalized Recommendations</h2>
            <p className="stat-desc">
              Recommends coffee based on preferences including temperature, sweetness, milk options, and roast style.
            </p>
          </article>

          <article className="stat-card">
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: 'rgba(217,164,65,0.16)', color: 'var(--accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: '14px'
            }}>
              <ShieldCheck size={18} style={{ margin: 'auto' }} />
            </div>
            <h2 className="stat-title" style={{ fontSize: '18px' }}>RAG-Grounded Answers</h2>
            <p className="stat-desc">
              Grounds responses strictly in the official knowledge base without inventing menu items or prices.
            </p>
          </article>

          <article className="stat-card">
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: 'rgba(217,164,65,0.16)', color: 'var(--accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: '14px'
            }}>
              <DollarSign size={18} style={{ margin: 'auto' }} />
            </div>
            <h2 className="stat-title" style={{ fontSize: '18px' }}>Budget Awareness</h2>
            <p className="stat-desc">
              Respects your selected spending limit, such as under ₹200/₹250, and filters items automatically.
            </p>
          </article>

          <article className="stat-card">
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: 'rgba(217,164,65,0.16)', color: 'var(--accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: '14px'
            }}>
              <CheckCircle2 size={18} style={{ margin: 'auto' }} />
            </div>
            <h2 className="stat-title" style={{ fontSize: '18px' }}>Dietary & Allergen Safety</h2>
            <p className="stat-desc">
              Supports dairy-free options like Oat Milk and checks allergen info before making recommendations.
            </p>
          </article>
        </section>

        <section style={{
          background: 'var(--card-bg)',
          color: 'var(--card-ink)',
          borderRadius: 'var(--radius)',
          padding: '44px 36px',
          textAlign: 'center',
          border: '1px solid var(--border)'
        }}>
          <h3 style={{ fontSize: '26px', fontWeight: 700, margin: '0 0 12px', color: 'var(--card-ink)' }}>
            Discover your personalized match
          </h3>
          <p style={{ fontSize: '15px', color: 'var(--card-ink-muted)', margin: '0 auto 24px', maxWidth: '520px' }}>
            Experience precision AI recommendations grounded in our artisanal coffee menu knowledge base.
          </p>
          <button
            className="btn-primary"
            onClick={() => onNavigate(isAuthenticated ? 'chat' : 'auth')}
          >
            <span>Start Recommendation Chat</span>
            <ArrowRight size={16} />
          </button>
        </section>
      </main>
    </>
  );
};
