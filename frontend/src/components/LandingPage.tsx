import React from 'react';
import { Navbar, AppView } from './Navbar';

interface LandingPageProps {
  onNavigate: (view: AppView) => void;
  isAuthenticated: boolean;
  userProfile?: { name?: string; email?: string } | null;
  onSignOut?: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onNavigate,
  isAuthenticated,
  userProfile,
  onSignOut,
  theme,
  onToggleTheme,
}) => {
  const firstName = userProfile?.name
    ? userProfile.name.split(' ')[0]
    : userProfile?.email
    ? userProfile.email.split('@')[0]
    : 'User';

  const handleHeroCTA = () => {
    if (isAuthenticated) {
      if (onSignOut) {
        onSignOut();
      }
    } else {
      onNavigate('auth');
    }
  };

  return (
    <>
      <Navbar
        onNavigate={onNavigate}
        currentView="landing"
        isAuthenticated={isAuthenticated}
        theme={theme}
        onToggleTheme={onToggleTheme}
      />

      <section className="hero">
        <div>
          <span className="badge">✦ Context-Aware RAG Engine</span>
          <h1 className="headline display">Your perfect cup<br /><em>starts here.</em></h1>
          <p className="lead">Discover coffee recommendations tailored to your taste, dietary preferences, and budget.</p>
          <div className="hero-actions">
            <button
              className={`btn-primary ${isAuthenticated ? 'is-signed-in' : ''}`}
              id="auth-btn"
              onClick={handleHeroCTA}
            >
              <span id="auth-label">
                {isAuthenticated ? `Sign Out (${firstName})` : 'Start Your Coffee Journey'}
              </span>
              <span id="auth-arrow">{isAuthenticated ? '↩' : '→'}</span>
            </button>
          </div>
        </div>
        <div className="hero-media">
          <img src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=1200&auto=format&fit=crop" alt="Barista pulling espresso" />
        </div>
      </section>

      <section className="stats">
        <div className="stat-card">
          <div className="stat-num">14</div>
          <div className="stat-title">Coffee Options</div>
          <p className="stat-desc">Handcrafted specialty menu items</p>
        </div>
        <div className="stat-card">
          <div className="stat-num">Personalized</div>
          <div className="stat-title">Recommendations</div>
          <p className="stat-desc">Customized to sweetness, milk & budget</p>
        </div>
        <div className="stat-card">
          <div className="stat-num">RAG-Grounded</div>
          <div className="stat-title">Factual Answers</div>
          <p className="stat-desc">Zero invented prices or non-existent items</p>
        </div>
      </section>
    </>
  );
};
