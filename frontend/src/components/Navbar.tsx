import React, { useState } from 'react';
import { Coffee, ArrowRight, Menu as MenuIcon, X, Sun, Moon } from 'lucide-react';

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
    <header className="sticky top-0 z-50 backdrop-blur-md bg-[#FDF9F3]/95 dark:bg-[#0D0A08]/95 border-b border-[#E6D5C3]/50 dark:border-[#2A1D15] transition-all">
      <div className="section-container h-20 flex items-center justify-between">
        
        {/* Brand Logo Left */}
        <div 
          onClick={() => handleNavClick('landing')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-[#B85C2C] to-[#9C4A20] flex items-center justify-center shadow-md shadow-[#B85C2C]/20 group-hover:scale-105 transition-transform">
            <Coffee className="w-5 h-5 text-white" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-serif font-bold text-lg sm:text-xl tracking-tight text-[#2B1B10] dark:text-[#F5EAD9]">
              CoffeeMind
            </span>
            <span className="text-[9px] sm:text-[10px] font-bold tracking-wider px-1.5 py-0.5 rounded bg-[#B85C2C]/15 text-[#B85C2C] dark:text-[#D9A441] border border-[#B85C2C]/30 uppercase">
              AI BARISTA
            </span>
          </div>
        </div>

        {/* Center / Right Navigation Options */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-[#6E5D4F] dark:text-[#C5B4A5]">
          <button 
            onClick={() => handleNavClick('landing')}
            className={`hover:text-[#B85C2C] dark:hover:text-[#D9A441] transition-colors ${currentView === 'landing' ? 'text-[#B85C2C] dark:text-[#D9A441] font-bold' : ''}`}
          >
            Home
          </button>
          <button 
            onClick={() => handleNavClick('how-it-works')}
            className={`hover:text-[#B85C2C] dark:hover:text-[#D9A441] transition-colors ${currentView === 'how-it-works' ? 'text-[#B85C2C] dark:text-[#D9A441] font-bold' : ''}`}
          >
            How It Works
          </button>
          <button 
            onClick={() => handleNavClick('features')}
            className={`hover:text-[#B85C2C] dark:hover:text-[#D9A441] transition-colors ${currentView === 'features' ? 'text-[#B85C2C] dark:text-[#D9A441] font-bold' : ''}`}
          >
            Features
          </button>
          <button 
            onClick={() => handleNavClick('technology')}
            className={`hover:text-[#B85C2C] dark:hover:text-[#D9A441] transition-colors ${currentView === 'technology' ? 'text-[#B85C2C] dark:text-[#D9A441] font-bold' : ''}`}
          >
            Technology
          </button>

          {/* Theme Toggle Button */}
          <button
            onClick={onToggleTheme}
            className="px-3 py-2 rounded-xl border border-[#E6D5C3] dark:border-[#2A1D15] bg-[#F8F3EA] dark:bg-[#18110C] text-[#2B1B10] dark:text-[#F5EAD9] hover:border-[#B85C2C] dark:hover:border-[#D9A441] transition-all flex items-center gap-2 ml-1"
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
          >
            {theme === 'light' ? (
              <>
                <Moon className="w-4 h-4 text-[#2B1B10]" />
                <span className="text-xs font-semibold text-[#6E5D4F]">Dark</span>
              </>
            ) : (
              <>
                <Sun className="w-4 h-4 text-[#D9A441]" />
                <span className="text-xs font-semibold text-[#C5B4A5]">Light</span>
              </>
            )}
          </button>

          {/* User Auth Actions */}
          {isAuthenticated ? (
            <button
              onClick={() => handleNavClick('chat')}
              className="px-5 py-2.5 rounded-xl bg-[#B85C2C] hover:bg-[#A34E22] text-white font-medium text-sm shadow-md transition-all flex items-center gap-2"
            >
              <span>Open Chat</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleNavClick('auth')}
                className="text-sm font-semibold text-[#6E5D4F] dark:text-[#C5B4A5] hover:text-[#B85C2C] dark:hover:text-[#D9A441] transition-colors px-2 py-1"
              >
                Sign In
              </button>
              <button
                onClick={() => handleNavClick('auth')}
                className="px-5 py-2.5 rounded-xl bg-[#B85C2C] hover:bg-[#A34E22] text-white font-medium text-sm shadow-md transition-all flex items-center gap-2"
              >
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </nav>

        {/* Mobile Navigation Controls */}
        <div className="flex items-center gap-2 md:hidden">
          <button
            onClick={onToggleTheme}
            className="px-2.5 py-1.5 rounded-lg border border-[#E6D5C3] dark:border-[#2A1D15] bg-[#F8F3EA] dark:bg-[#18110C] text-[#2B1B10] dark:text-[#F5EAD9] flex items-center gap-1.5"
            aria-label="Toggle Theme"
          >
            {theme === 'light' ? (
              <>
                <Moon className="w-4 h-4 text-[#2B1B10]" />
                <span className="text-xs font-semibold">Dark</span>
              </>
            ) : (
              <>
                <Sun className="w-4 h-4 text-[#D9A441]" />
                <span className="text-xs font-semibold text-[#D9A441]">Light</span>
              </>
            )}
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg bg-[#F0E6D8] dark:bg-[#1E1510] text-[#2B1B10] dark:text-[#F5EAD9]"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
          </button>
        </div>

      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#FDF9F3] dark:bg-[#120D0A] border-b border-[#E6D5C3] dark:border-[#2A1D15] px-6 py-6 space-y-4 shadow-xl">
          <nav className="flex flex-col space-y-3 font-medium text-sm text-[#6E5D4F] dark:text-[#C5B4A5]">
            <button onClick={() => handleNavClick('landing')} className="text-left py-1 hover:text-[#B85C2C]">Home</button>
            <button onClick={() => handleNavClick('how-it-works')} className="text-left py-1 hover:text-[#B85C2C]">How It Works</button>
            <button onClick={() => handleNavClick('features')} className="text-left py-1 hover:text-[#B85C2C]">Features</button>
            <button onClick={() => handleNavClick('technology')} className="text-left py-1 hover:text-[#B85C2C]">Technology</button>
          </nav>
          <div className="pt-4 border-t border-[#E6D5C3] dark:border-[#2A1D15] flex flex-col gap-3">
            {isAuthenticated ? (
              <button
                onClick={() => handleNavClick('chat')}
                className="w-full py-3 rounded-xl bg-[#B85C2C] text-white font-medium text-center text-sm"
              >
                Open Chat
              </button>
            ) : (
              <>
                <button
                  onClick={() => handleNavClick('auth')}
                  className="w-full py-2.5 rounded-xl border border-[#E6D5C3] dark:border-[#2A1D15] text-center font-medium text-sm"
                >
                  Sign In
                </button>
                <button
                  onClick={() => handleNavClick('auth')}
                  className="w-full py-3 rounded-xl bg-[#B85C2C] text-white font-medium text-center text-sm shadow-md"
                >
                  Get Started
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
