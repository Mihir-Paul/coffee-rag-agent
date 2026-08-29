import React, { useState } from 'react';
import { Menu as MenuIcon, X } from 'lucide-react';

export type AppView = 'landing' | 'how-it-works' | 'features' | 'technology' | 'auth' | 'chat';

interface NavbarProps {
  onNavigate: (view: AppView) => void;
  currentView: AppView;
  isAuthenticated: boolean;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onNavigate,
  currentView,
  isAuthenticated,
  theme,
  onToggleTheme
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (view: AppView) => {
    setMobileMenuOpen(false);
    onNavigate(view);
  };

  return (
    <nav className="site-nav">
      <div className="brand" onClick={() => handleNavClick('landing')} style={{ cursor: 'pointer' }}>
        <div className="brand-icon">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
            <path d="M4 9h13a3 3 0 0 1 0 6h-1" stroke="var(--accent-ink)" strokeWidth="1.8" strokeLinecap="round"/>
            <path d="M4 9v6a4 4 0 0 0 4 4h4a4 4 0 0 0 4-4V9" stroke="var(--accent-ink)" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
        </div>
        <span className="brand-name">CoffeeMind</span>
        <span className="brand-tag">AI BARISTA</span>
      </div>

      <div className="nav-links">
        <button 
          onClick={() => handleNavClick('landing')}
          className={currentView === 'landing' ? 'active' : ''}
        >
          Home
        </button>
        <button 
          onClick={() => handleNavClick('how-it-works')}
          className={currentView === 'how-it-works' ? 'active' : ''}
        >
          How It Works
        </button>
        <button 
          onClick={() => handleNavClick('features')}
          className={currentView === 'features' ? 'active' : ''}
        >
          Features
        </button>
        <button 
          onClick={() => handleNavClick('technology')}
          className={currentView === 'technology' ? 'active' : ''}
        >
          Technology
        </button>
      </div>

      <div className="nav-actions">
        <button className="theme-toggle" onClick={onToggleTheme}>
          <span id="theme-icon">{theme === 'light' ? '☀️' : '🌙'}</span>
          <span id="theme-label">{theme === 'light' ? 'Light' : 'Dark'}</span>
        </button>
        <button className="cta-nav" onClick={() => handleNavClick(isAuthenticated ? 'chat' : 'auth')}>
          {isAuthenticated ? 'Open Chat' : 'Get Started'}
        </button>
      </div>
    </nav>
  );
};
