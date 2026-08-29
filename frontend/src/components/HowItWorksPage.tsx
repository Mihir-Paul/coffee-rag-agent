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
    <div className="page-wrapper-fit min-h-screen bg-[#FDF9F3] dark:bg-[#0D0A08] text-[#2B1B10] dark:text-[#F5EAD9] transition-colors duration-300 font-sans">
      
      {/* Shared Navbar */}
      <Navbar
        onNavigate={onNavigate}
        currentView="how-it-works"
        isAuthenticated={isAuthenticated}
        theme={theme}
        onToggleTheme={onToggleTheme}
      />

      <main className="page-main flex-1 flex flex-col justify-between py-2 lg:py-4">
        <section className="section-container flex-1 flex flex-col justify-between my-auto">
          
          {/* Centered Section Header */}
          <header className="section-header !pt-3 sm:!pt-6 !mb-4 sm:!mb-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#B85C2C]/10 dark:bg-[#B85C2C]/20 border border-[#B85C2C]/30 text-xs font-semibold text-[#B85C2C] dark:text-[#D9A441] mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>HOW IT WORKS</span>
            </div>

            <h1 className="font-serif text-[clamp(32px,3.8vw,56px)] font-bold tracking-tight leading-[1.05] text-[#2B1B10] dark:text-[#F5EAD9] mb-3">
              Coffee recommendations that actually understand you.
            </h1>

            <p className="text-sm sm:text-base lg:text-lg text-[#6E5D4F] dark:text-[#B5A495] leading-relaxed max-w-[700px] mx-auto">
              Discover how CoffeeMind AI maps your unique taste profile to handcrafted menu items using intelligent RAG search.
            </p>
          </header>

          {/* 3-Card Grid */}
          <div className="cards-grid-3col !mb-4 sm:!mb-6">
            
            {/* Step 01 */}
            <article className="info-card !p-6 sm:!p-7 rounded-3xl bg-white/70 dark:bg-[#18110C]/80 border border-[#E6D5C3] dark:border-[#2A1D15] shadow-sm">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-[#B85C2C]/10 text-[#B85C2C] dark:text-[#D9A441] flex items-center justify-center">
                  <Sliders className="w-5 h-5" />
                </div>
                <div className="text-[11px] font-bold tracking-widest text-[#B85C2C] dark:text-[#D9A441] uppercase">STEP 01</div>
                <h2 className="text-[clamp(18px,1.8vw,24px)] font-serif font-bold text-[#2B1B10] dark:text-[#F5EAD9]">Tell us your taste</h2>
              </div>
              <p className="text-xs sm:text-sm text-[#6E5D4F] dark:text-[#B5A495] leading-relaxed mt-3">
                Specify your preferred sweetness level, temperature (Hot or Iced), milk choice (Oat Milk, Almond Milk, Whole Milk), caffeine strength, and budget limit.
              </p>
            </article>

            {/* Step 02 */}
            <article className="info-card !p-6 sm:!p-7 rounded-3xl bg-white/70 dark:bg-[#18110C]/80 border border-[#E6D5C3] dark:border-[#2A1D15] shadow-sm">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-[#B85C2C]/10 text-[#B85C2C] dark:text-[#D9A441] flex items-center justify-center">
                  <Brain className="w-5 h-5" />
                </div>
                <div className="text-[11px] font-bold tracking-widest text-[#B85C2C] dark:text-[#D9A441] uppercase">STEP 02</div>
                <h2 className="text-[clamp(18px,1.8vw,24px)] font-serif font-bold text-[#2B1B10] dark:text-[#F5EAD9]">CoffeeMind understands</h2>
              </div>
              <p className="text-xs sm:text-sm text-[#6E5D4F] dark:text-[#B5A495] leading-relaxed mt-3">
                The agent system matches your taste profile against the official menu knowledge base using Google ADK tool orchestration and LangChain RAG vector search.
              </p>
            </article>

            {/* Step 03 */}
            <article className="info-card !p-6 sm:!p-7 rounded-3xl bg-white/70 dark:bg-[#18110C]/80 border border-[#E6D5C3] dark:border-[#2A1D15] shadow-sm">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-[#B85C2C]/10 text-[#B85C2C] dark:text-[#D9A441] flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div className="text-[11px] font-bold tracking-widest text-[#B85C2C] dark:text-[#D9A441] uppercase">STEP 03</div>
                <h2 className="text-[clamp(18px,1.8vw,24px)] font-serif font-bold text-[#2B1B10] dark:text-[#F5EAD9]">Get your recommendation</h2>
              </div>
              <p className="text-xs sm:text-sm text-[#6E5D4F] dark:text-[#B5A495] leading-relaxed mt-3">
                Receive grounded beverage suggestions complete with exact prices, ingredients, allergen details, and custom barista brewing recipes.
              </p>
            </article>

          </div>

          {/* Centered CTA Section */}
          <div className="cta-container !mb-4 sm:!mb-6">
            <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#140E0A] via-[#1B120D] to-[#2B1B10] text-[#F5EAD9] text-center space-y-3 sm:space-y-4 shadow-2xl border border-[#2A1D15]">
              <h3 className="font-serif text-[clamp(22px,2.5vw,30px)] font-bold">Ready to find your perfect cup?</h3>
              <p className="text-xs sm:text-sm text-[#C5B4A5] max-w-lg mx-auto leading-relaxed">
                Experience AI-driven recommendations personalized to your daily coffee mood.
              </p>
              <div className="pt-1">
                <button
                  onClick={() => onNavigate(isAuthenticated ? 'chat' : 'auth')}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#B85C2C] to-[#A34E22] hover:from-[#A34E22] hover:to-[#8B3E18] text-white font-bold text-xs sm:text-sm shadow-xl inline-flex items-center gap-2 hover:scale-[1.02] transition-transform"
                >
                  <span>Start Your Coffee Journey</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

        </section>
      </main>
    </div>
  );
};
