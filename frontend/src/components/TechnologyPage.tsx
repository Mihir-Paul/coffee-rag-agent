import React from 'react';
import { ArrowRight, Cpu, Layers, Brain, Database } from 'lucide-react';
import { Navbar, AppView } from './Navbar';

interface TechnologyPageProps {
  onNavigate: (view: AppView) => void;
  isAuthenticated: boolean;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export const TechnologyPage: React.FC<TechnologyPageProps> = ({
  onNavigate,
  isAuthenticated,
  theme,
  onToggleTheme,
}) => {
  return (
    <>
      <Navbar
        onNavigate={onNavigate}
        currentView="technology"
        isAuthenticated={isAuthenticated}
        theme={theme}
        onToggleTheme={onToggleTheme}
      />

      <main style={{ padding: '40px 44px 56px', maxWidth: '1240px', margin: '0 auto' }}>
        <header style={{ textAlign: 'center', marginBottom: '44px' }}>
          <span className="badge">✦ AI ARCHITECTURE</span>
          <h1 className="headline display" style={{ fontSize: '42px', marginTop: '12px' }}>
            Powered by AI. Grounded in coffee knowledge.
          </h1>
          <p className="lead" style={{ margin: '16px auto 0', maxWidth: '680px' }}>
            How CoffeeMind AI combines LLM intelligence with real-world menu constraints.
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
              marginBottom: '10px'
            }}>
              <Brain size={18} style={{ margin: 'auto' }} />
            </div>
            <span style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.08em', color: 'var(--accent)' }}>
              REASONING ENGINE
            </span>
            <h2 className="stat-title" style={{ fontSize: '18px', marginTop: '4px' }}>Google GenAI (Gemini)</h2>
            <p className="stat-desc">
              Handles intelligent natural-language reasoning and coffee recommendation generation.
            </p>
          </article>

          <article className="stat-card">
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: 'rgba(217,164,65,0.16)', color: 'var(--accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: '10px'
            }}>
              <Layers size={18} style={{ margin: 'auto' }} />
            </div>
            <span style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.08em', color: 'var(--accent)' }}>
              RAG PIPELINE
            </span>
            <h2 className="stat-title" style={{ fontSize: '18px', marginTop: '4px' }}>LangChain</h2>
            <p className="stat-desc">
              Handles RAG retrieval, document processing, and grounds responses in official menu knowledge.
            </p>
          </article>

          <article className="stat-card">
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: 'rgba(217,164,65,0.16)', color: 'var(--accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: '10px'
            }}>
              <Cpu size={18} style={{ margin: 'auto' }} />
            </div>
            <span style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.08em', color: 'var(--accent)' }}>
              AGENT ORCHESTRATION
            </span>
            <h2 className="stat-title" style={{ fontSize: '18px', marginTop: '4px' }}>Google ADK</h2>
            <p className="stat-desc">
              Provides agent architecture and multi-tool orchestration for brewing & menu calculations.
            </p>
          </article>

          <article className="stat-card">
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: 'rgba(217,164,65,0.16)', color: 'var(--accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: '10px'
            }}>
              <Database size={18} style={{ margin: 'auto' }} />
            </div>
            <span style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.08em', color: 'var(--accent)' }}>
              DATABASE & SECURITY
            </span>
            <h2 className="stat-title" style={{ fontSize: '18px', marginTop: '4px' }}>Supabase</h2>
            <p className="stat-desc">
              Handles authentication, customer identity, preferences, and data protected by RLS.
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
            See the technology in action
          </h3>
          <p style={{ fontSize: '15px', color: 'var(--card-ink-muted)', margin: '0 auto 24px', maxWidth: '520px' }}>
            Interact with our RAG agent system to see context-grounded AI recommendations in real-time.
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
