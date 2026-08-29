import React from 'react';
import { ArrowRight, Sliders, Brain, CheckCircle2 } from 'lucide-react';
import { Navbar, AppView } from './Navbar';

interface HowItWorksPageProps {
  onNavigate: (view: AppView) => void;
  isAuthenticated: boolean;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export const HowItWorksPage: React.FC<HowItWorksPageProps> = ({
  onNavigate,
  isAuthenticated,
  theme,
  onToggleTheme,
}) => {
  return (
    <>
      <Navbar
        onNavigate={onNavigate}
        currentView="how-it-works"
        isAuthenticated={isAuthenticated}
        theme={theme}
        onToggleTheme={onToggleTheme}
      />

      <main style={{ padding: '40px 44px 56px', maxWidth: '1240px', margin: '0 auto' }}>
        <header style={{ textAlign: 'center', marginBottom: '44px' }}>
          <span className="badge">✦ HOW IT WORKS</span>
          <h1 className="headline display" style={{ fontSize: '42px', marginTop: '12px' }}>
            Coffee recommendations that actually understand you.
          </h1>
          <p className="lead" style={{ margin: '16px auto 0', maxWidth: '680px' }}>
            Discover how CoffeeMind AI maps your unique taste profile to handcrafted menu items using intelligent RAG search.
          </p>
        </header>

        <section className="stats" style={{ padding: 0, marginBottom: '56px' }}>
          <article className="stat-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '10px',
                background: 'rgba(217,164,65,0.16)', color: 'var(--accent)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700
              }}>
                <Sliders size={18} style={{ margin: 'auto' }} />
              </div>
              <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.08em', color: 'var(--accent)' }}>
                STEP 01
              </span>
            </div>
            <h2 className="stat-title" style={{ fontSize: '20px' }}>Tell us your taste</h2>
            <p className="stat-desc">
              Specify your preferred sweetness level, temperature (Hot or Iced), milk choice (Oat Milk, Almond Milk, Whole Milk), caffeine strength, and budget limit.
            </p>
          </article>

          <article className="stat-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '10px',
                background: 'rgba(217,164,65,0.16)', color: 'var(--accent)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700
              }}>
                <Brain size={18} style={{ margin: 'auto' }} />
              </div>
              <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.08em', color: 'var(--accent)' }}>
                STEP 02
              </span>
            </div>
            <h2 className="stat-title" style={{ fontSize: '20px' }}>CoffeeMind understands</h2>
            <p className="stat-desc">
              The agent system matches your taste profile against the official menu knowledge base using Google ADK tool orchestration and LangChain RAG vector search.
            </p>
          </article>

          <article className="stat-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '10px',
                background: 'rgba(217,164,65,0.16)', color: 'var(--accent)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700
              }}>
                <CheckCircle2 size={18} style={{ margin: 'auto' }} />
              </div>
              <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.08em', color: 'var(--accent)' }}>
                STEP 03
              </span>
            </div>
            <h2 className="stat-title" style={{ fontSize: '20px' }}>Get your recommendation</h2>
            <p className="stat-desc">
              Receive grounded beverage suggestions complete with exact prices, ingredients, allergen details, and custom barista brewing recipes.
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
            Ready to find your perfect cup?
          </h3>
          <p style={{ fontSize: '15px', color: 'var(--card-ink-muted)', margin: '0 auto 24px', maxWidth: '520px' }}>
            Chat with CoffeeMind AI now to get personalized recommendations tailored to your exact taste.
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
