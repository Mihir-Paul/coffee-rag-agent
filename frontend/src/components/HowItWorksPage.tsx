import React from 'react';
import { ArrowRight, Sparkles, Sliders, Brain, CheckCircle2 } from 'lucide-react';
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
    <div className="page-wrapper bg-[#FDF9F3] dark:bg-[#0D0A08] text-[#2B1B10] dark:text-[#F5EAD9] transition-colors duration-300 font-sans">
      
      {/* Shared Navbar */}
      <Navbar
        onNavigate={onNavigate}
        currentView="how-it-works"
        isAuthenticated={isAuthenticated}
        theme={theme}
        onToggleTheme={onToggleTheme}
      />

      <main className="page-main">
        <section className="section-container">
          
          {/* Centered Section Header */}
          <header className="section-header">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#B85C2C]/10 dark:bg-[#B85C2C]/20 border border-[#B85C2C]/30 text-xs font-semibold text-[#B85C2C] dark:text-[#D9A441] mb-5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>HOW IT WORKS</span>
            </div>

            <h1 className="font-serif text-[clamp(40px,5vw,68px)] font-bold tracking-tight leading-[1.05] text-[#2B1B10] dark:text-[#F5EAD9] mb-6">
              Coffee recommendations that actually understand you.
            </h1>

            <p className="text-lg sm:text-xl text-[#6E5D4F] dark:text-[#B5A495] leading-relaxed max-w-[760px] mx-auto">
              Discover how CoffeeMind AI maps your unique taste profile to handcrafted menu items using intelligent RAG search.
            </p>
          </header>

          {/* 3-Card Grid */}
          <div className="cards-grid-3col">
            
            {/* Step 01 */}
            <article className="info-card rounded-3xl bg-white/70 dark:bg-[#18110C]/80 border border-[#E6D5C3] dark:border-[#2A1D15] shadow-sm">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-[#B85C2C]/10 text-[#B85C2C] dark:text-[#D9A441] flex items-center justify-center">
                  <Sliders className="w-6 h-6" />
                </div>
                <div className="text-xs font-bold tracking-widest text-[#B85C2C] dark:text-[#D9A441] uppercase">STEP 01</div>
                <h2 className="text-[clamp(20px,2vw,26px)] font-serif font-bold text-[#2B1B10] dark:text-[#F5EAD9]">Tell us your taste</h2>
              </div>
              <p className="text-sm text-[#6E5D4F] dark:text-[#B5A495] leading-relaxed mt-4">
                Specify your preferred sweetness level, temperature (Hot or Iced), milk choice (Oat Milk, Almond Milk, Whole Milk), caffeine strength, and budget limit.
              </p>
            </article>

            {/* Step 02 */}
            <article className="info-card rounded-3xl bg-white/70 dark:bg-[#18110C]/80 border border-[#E6D5C3] dark:border-[#2A1D15] shadow-sm">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-[#B85C2C]/10 text-[#B85C2C] dark:text-[#D9A441] flex items-center justify-center">
                  <Brain className="w-6 h-6" />
                </div>
                <div className="text-xs font-bold tracking-widest text-[#B85C2C] dark:text-[#D9A441] uppercase">STEP 02</div>
                <h2 className="text-[clamp(20px,2vw,26px)] font-serif font-bold text-[#2B1B10] dark:text-[#F5EAD9]">CoffeeMind understands</h2>
              </div>
              <p className="text-sm text-[#6E5D4F] dark:text-[#B5A495] leading-relaxed mt-4">
                The agent system matches your taste profile against the official menu knowledge base using Google ADK tool orchestration and LangChain RAG vector search.
              </p>
            </article>

            {/* Step 03 */}
            <article className="info-card rounded-3xl bg-white/70 dark:bg-[#18110C]/80 border border-[#E6D5C3] dark:border-[#2A1D15] shadow-sm">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-[#B85C2C]/10 text-[#B85C2C] dark:text-[#D9A441] flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div className="text-xs font-bold tracking-widest text-[#B85C2C] dark:text-[#D9A441] uppercase">STEP 03</div>
                <h2 className="text-[clamp(20px,2vw,26px)] font-serif font-bold text-[#2B1B10] dark:text-[#F5EAD9]">Get your recommendation</h2>
              </div>
              <p className="text-sm text-[#6E5D4F] dark:text-[#B5A495] leading-relaxed mt-4">
                Receive grounded beverage suggestions complete with exact prices, ingredients, allergen details, and custom barista brewing recipes.
              </p>
            </article>

          </div>

          {/* Centered CTA Section */}
          <div className="cta-container">
            <div className="p-10 sm:p-14 rounded-3xl bg-gradient-to-br from-[#140E0A] via-[#1B120D] to-[#2B1B10] text-[#F5EAD9] text-center space-y-6 shadow-2xl border border-[#2A1D15]">
              <h3 className="font-serif text-[clamp(24px,3vw,36px)] font-bold">Ready to find your perfect cup?</h3>
              <p className="text-base text-[#C5B4A5] max-w-lg mx-auto leading-relaxed">
                Experience AI-driven recommendations personalized to your daily coffee mood.
              </p>
              <div className="pt-2">
                <button
                  onClick={() => onNavigate(isAuthenticated ? 'chat' : 'auth')}
                  className="px-8 py-4 rounded-xl bg-gradient-to-r from-[#B85C2C] to-[#A34E22] hover:from-[#A34E22] hover:to-[#8B3E18] text-white font-bold text-base shadow-xl inline-flex items-center gap-3 hover:scale-[1.02] transition-transform"
                >
                  <span>Start Your Coffee Journey</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

        </section>
      </main>
    </div>
  );
};
