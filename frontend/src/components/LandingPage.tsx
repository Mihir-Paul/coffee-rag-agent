import React from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';
import { Navbar, AppView } from './Navbar';

interface LandingPageProps {
  onNavigate: (view: AppView) => void;
  isAuthenticated: boolean;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onNavigate,
  isAuthenticated,
  theme,
  onToggleTheme,
}) => {
  const handlePrimaryCTA = () => {
    if (isAuthenticated) {
      onNavigate('chat');
    } else {
      onNavigate('auth');
    }
  };

  return (
    <div className="page-wrapper bg-[#FDF9F3] dark:bg-[#0D0A08] text-[#2B1B10] dark:text-[#F5EAD9] transition-colors duration-300 font-sans">
      
      {/* Shared Navbar */}
      <Navbar
        onNavigate={onNavigate}
        currentView="landing"
        isAuthenticated={isAuthenticated}
        theme={theme}
        onToggleTheme={onToggleTheme}
      />

      <main className="page-main">
        <section className="section-container">
          
          {/* ---------------------------------------------------- */}
          {/* 1. HERO SECTION */}
          {/* ---------------------------------------------------- */}
          <div className="py-16 sm:py-20 lg:py-24 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
            
            {/* Left Content Column */}
            <div className="lg:col-span-7 space-y-6 sm:space-y-8 text-center lg:text-left">
              
              {/* Eyebrow Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#B85C2C]/10 dark:bg-[#B85C2C]/20 border border-[#B85C2C]/30 text-xs font-semibold text-[#B85C2C] dark:text-[#D9A441]">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Context-Aware RAG Engine</span>
              </div>

              {/* Dominant Headline using fluid clamp() */}
              <h1 className="font-serif text-[clamp(36px,5vw,68px)] font-bold tracking-tight text-[#2B1B10] dark:text-[#F5EAD9] leading-[1.1]">
                Your perfect cup{' '}
                <span className="block mt-2 bg-gradient-to-r from-[#B85C2C] via-[#D9A441] to-[#9C4A20] bg-clip-text text-transparent italic">
                  starts here.
                </span>
              </h1>

              {/* Short Supporting Copy */}
              <p className="text-base sm:text-lg lg:text-xl text-[#6E5D4F] dark:text-[#B5A495] max-w-xl mx-auto lg:mx-0 leading-relaxed font-normal">
                Discover coffee recommendations tailored to your taste, dietary preferences, and budget.
              </p>

              {/* Primary & Secondary Actions */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <button
                  onClick={handlePrimaryCTA}
                  className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-[#B85C2C] to-[#A34E22] hover:from-[#A34E22] hover:to-[#8B3E18] text-white font-bold text-base shadow-xl shadow-[#B85C2C]/25 hover:scale-[1.01] transition-all flex items-center justify-center gap-3 group"
                >
                  <span>Start Your Coffee Journey</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>

                {!isAuthenticated && (
                  <button
                    onClick={() => onNavigate('auth')}
                    className="w-full sm:w-auto px-7 py-4 rounded-xl border border-[#E6D5C3] dark:border-[#38261C] hover:border-[#B85C2C] text-[#2B1B10] dark:text-[#F5EAD9] font-semibold text-base transition-all bg-white/50 dark:bg-[#18110C]/50 hover:bg-white dark:hover:bg-[#18110C]"
                  >
                    Sign In
                  </button>
                )}
              </div>

            </div>

            {/* Right Hero Image Column */}
            <div className="lg:col-span-5 mb-8 lg:mb-0">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border-2 border-[#E6D5C3] dark:border-[#38261C] bg-[#F8F3EA] dark:bg-[#18110C]">
                <img 
                  src="/cafe_hero.jpg" 
                  alt="Artisan Coffee Bar" 
                  className="w-full h-[320px] sm:h-[380px] lg:h-[420px] object-cover"
                />
              </div>
            </div>

          </div>

          {/* ---------------------------------------------------- */}
          {/* 2. HERO STATISTICS STRIP */}
          {/* ---------------------------------------------------- */}
          <div className="py-12 sm:py-16 border-t border-[#E6D5C3]/40 dark:border-[#2A1D15]/60 mb-20">
            <div className="cards-grid-3col mb-0">
              
              {/* Card 1 */}
              <article className="info-card rounded-3xl bg-white/70 dark:bg-[#18110C]/80 border border-[#E6D5C3] dark:border-[#2A1D15] shadow-sm text-center flex flex-col justify-between transition-all hover:border-[#B85C2C]/50">
                <div className="space-y-2">
                  <div className="text-[clamp(32px,4vw,52px)] font-serif font-bold text-[#B85C2C] dark:text-[#D9A441] tracking-tight">
                    14
                  </div>
                  <div className="font-serif font-bold text-lg sm:text-xl text-[#2B1B10] dark:text-[#F5EAD9]">
                    Coffee Options
                  </div>
                </div>
                <p className="text-sm text-[#6E5D4F] dark:text-[#B5A495] leading-relaxed max-w-xs mx-auto mt-4">
                  Handcrafted specialty menu items
                </p>
              </article>

              {/* Card 2 */}
              <article className="info-card rounded-3xl bg-white/70 dark:bg-[#18110C]/80 border border-[#E6D5C3] dark:border-[#2A1D15] shadow-sm text-center flex flex-col justify-between transition-all hover:border-[#B85C2C]/50">
                <div className="space-y-2">
                  <div className="text-[clamp(24px,3vw,38px)] font-serif font-bold text-[#B85C2C] dark:text-[#D9A441] tracking-tight">
                    Personalized
                  </div>
                  <div className="font-serif font-bold text-lg sm:text-xl text-[#2B1B10] dark:text-[#F5EAD9]">
                    Recommendations
                  </div>
                </div>
                <p className="text-sm text-[#6E5D4F] dark:text-[#B5A495] leading-relaxed max-w-xs mx-auto mt-4">
                  Customized to sweetness, milk & budget
                </p>
              </article>

              {/* Card 3 */}
              <article className="info-card rounded-3xl bg-white/70 dark:bg-[#18110C]/80 border border-[#E6D5C3] dark:border-[#2A1D15] shadow-sm text-center flex flex-col justify-between transition-all hover:border-[#B85C2C]/50">
                <div className="space-y-2">
                  <div className="text-[clamp(24px,3vw,38px)] font-serif font-bold text-[#B85C2C] dark:text-[#D9A441] tracking-tight">
                    RAG-Grounded
                  </div>
                  <div className="font-serif font-bold text-lg sm:text-xl text-[#2B1B10] dark:text-[#F5EAD9]">
                    Factual Answers
                  </div>
                </div>
                <p className="text-sm text-[#6E5D4F] dark:text-[#B5A495] leading-relaxed max-w-xs mx-auto mt-4">
                  Zero invented prices or non-existent items
                </p>
              </article>

            </div>
          </div>

        </section>
      </main>
    </div>
  );
};
