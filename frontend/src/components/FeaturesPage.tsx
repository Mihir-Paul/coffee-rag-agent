import React from 'react';
import { ArrowRight, Sparkles, ShieldCheck, DollarSign, CheckCircle2, Sliders } from 'lucide-react';
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
    <div className="page-wrapper-fit min-h-screen bg-[#FDF9F3] dark:bg-[#0D0A08] text-[#2B1B10] dark:text-[#F5EAD9] transition-colors duration-300 font-sans">
      
      {/* Shared Navbar */}
      <Navbar
        onNavigate={onNavigate}
        currentView="features"
        isAuthenticated={isAuthenticated}
        theme={theme}
        onToggleTheme={onToggleTheme}
      />

      <main className="page-main flex-1 flex flex-col justify-between py-2 lg:py-3">
        <section className="section-container flex-1 flex flex-col justify-between my-auto">
          
          {/* Centered Section Header */}
          <header className="section-header !pt-2 sm:!pt-4 !mb-3 sm:!mb-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#B85C2C]/10 dark:bg-[#B85C2C]/20 border border-[#B85C2C]/30 text-[11px] font-semibold text-[#B85C2C] dark:text-[#D9A441] mb-2">
              <Sparkles className="w-3 h-3" />
              <span>FEATURES</span>
            </div>

            <h1 className="font-serif text-[clamp(28px,3.2vw,48px)] font-bold tracking-tight leading-[1.08] text-[#2B1B10] dark:text-[#F5EAD9] mb-2">
              Built for better coffee decisions.
            </h1>

            <p className="text-xs sm:text-sm lg:text-base text-[#6E5D4F] dark:text-[#B5A495] leading-relaxed max-w-[650px] mx-auto">
              Designed with state-of-the-art AI architecture to deliver accurate, non-hallucinated recommendations.
            </p>
          </header>

          {/* 4-Column Cards Grid (All 4 cards fit in 1 row on desktop) */}
          <div className="cards-grid-4col !mb-3 sm:!mb-5">
            
            {/* Card 1 */}
            <article className="info-card !p-5 rounded-2xl bg-white/70 dark:bg-[#18110C]/80 border border-[#E6D5C3] dark:border-[#2A1D15] shadow-sm flex flex-col justify-between">
              <div className="space-y-2">
                <div className="w-9 h-9 rounded-xl bg-[#B85C2C]/10 text-[#B85C2C] dark:text-[#D9A441] flex items-center justify-center">
                  <Sliders className="w-4 h-4" />
                </div>
                <h2 className="text-base sm:text-lg font-serif font-bold text-[#2B1B10] dark:text-[#F5EAD9] leading-tight">
                  Personalized Recommendations
                </h2>
              </div>
              <p className="text-xs text-[#6E5D4F] dark:text-[#B5A495] leading-relaxed mt-2">
                Recommends coffee based on preferences including temperature, sweetness, milk options, and roast style.
              </p>
            </article>

            {/* Card 2 */}
            <article className="info-card !p-5 rounded-2xl bg-white/70 dark:bg-[#18110C]/80 border border-[#E6D5C3] dark:border-[#2A1D15] shadow-sm flex flex-col justify-between">
              <div className="space-y-2">
                <div className="w-9 h-9 rounded-xl bg-[#B85C2C]/10 text-[#B85C2C] dark:text-[#D9A441] flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h2 className="text-base sm:text-lg font-serif font-bold text-[#2B1B10] dark:text-[#F5EAD9] leading-tight">
                  RAG-Grounded Answers
                </h2>
              </div>
              <p className="text-xs text-[#6E5D4F] dark:text-[#B5A495] leading-relaxed mt-2">
                Grounds responses strictly in the official knowledge base without inventing menu items or prices.
              </p>
            </article>

            {/* Card 3 */}
            <article className="info-card !p-5 rounded-2xl bg-white/70 dark:bg-[#18110C]/80 border border-[#E6D5C3] dark:border-[#2A1D15] shadow-sm flex flex-col justify-between">
              <div className="space-y-2">
                <div className="w-9 h-9 rounded-xl bg-[#B85C2C]/10 text-[#B85C2C] dark:text-[#D9A441] flex items-center justify-center">
                  <DollarSign className="w-4 h-4" />
                </div>
                <h2 className="text-base sm:text-lg font-serif font-bold text-[#2B1B10] dark:text-[#F5EAD9] leading-tight">
                  Budget Awareness
                </h2>
              </div>
              <p className="text-xs text-[#6E5D4F] dark:text-[#B5A495] leading-relaxed mt-2">
                Respects your selected spending limit, such as under ₹200/₹250, and filters items automatically.
              </p>
            </article>

            {/* Card 4 */}
            <article className="info-card !p-5 rounded-2xl bg-white/70 dark:bg-[#18110C]/80 border border-[#E6D5C3] dark:border-[#2A1D15] shadow-sm flex flex-col justify-between">
              <div className="space-y-2">
                <div className="w-9 h-9 rounded-xl bg-[#B85C2C]/10 text-[#B85C2C] dark:text-[#D9A441] flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <h2 className="text-base sm:text-lg font-serif font-bold text-[#2B1B10] dark:text-[#F5EAD9] leading-tight">
                  Dietary & Allergen Safety
                </h2>
              </div>
              <p className="text-xs text-[#6E5D4F] dark:text-[#B5A495] leading-relaxed mt-2">
                Supports dairy-free options like Oat Milk and checks allergen info before making recommendations.
              </p>
            </article>

          </div>

          {/* Centered CTA Section */}
          <div className="cta-container !mb-3 sm:!mb-5">
            <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-[#140E0A] via-[#1B120D] to-[#2B1B10] text-[#F5EAD9] text-center space-y-2 sm:space-y-3 shadow-xl border border-[#2A1D15]">
              <h3 className="font-serif text-[clamp(20px,2.2vw,26px)] font-bold">Experience smart coffee recommendations</h3>
              <p className="text-xs sm:text-sm text-[#C5B4A5] max-w-md mx-auto leading-relaxed">
                Try CoffeeMind AI today and get instant, grounded beverage choices.
              </p>
              <div className="pt-1">
                <button
                  onClick={() => onNavigate(isAuthenticated ? 'chat' : 'auth')}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#B85C2C] to-[#A34E22] hover:from-[#A34E22] hover:to-[#8B3E18] text-white font-bold text-xs sm:text-sm shadow-lg inline-flex items-center gap-2 hover:scale-[1.02] transition-transform"
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
