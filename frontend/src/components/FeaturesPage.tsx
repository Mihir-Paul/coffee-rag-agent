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
    <div className="page-wrapper bg-[#FDF9F3] dark:bg-[#0D0A08] text-[#2B1B10] dark:text-[#F5EAD9] transition-colors duration-300 font-sans">
      
      {/* Shared Navbar */}
      <Navbar
        onNavigate={onNavigate}
        currentView="features"
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
              <span>FEATURES</span>
            </div>

            <h1 className="font-serif text-[clamp(40px,5vw,68px)] font-bold tracking-tight leading-[1.05] text-[#2B1B10] dark:text-[#F5EAD9] mb-6">
              Built for better coffee decisions.
            </h1>

            <p className="text-lg sm:text-xl text-[#6E5D4F] dark:text-[#B5A495] leading-relaxed max-w-[760px] mx-auto">
              Designed with state-of-the-art AI architecture to deliver accurate, non-hallucinated recommendations.
            </p>
          </header>

          {/* 2-Column Cards Grid */}
          <div className="cards-grid-2col">
            
            {/* Card 1 */}
            <article className="info-card rounded-3xl bg-white/70 dark:bg-[#18110C]/80 border border-[#E6D5C3] dark:border-[#2A1D15] shadow-sm">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-[#B85C2C]/10 text-[#B85C2C] dark:text-[#D9A441] flex items-center justify-center">
                  <Sliders className="w-6 h-6" />
                </div>
                <h2 className="text-[clamp(20px,2vw,26px)] font-serif font-bold text-[#2B1B10] dark:text-[#F5EAD9]">Personalized Recommendations</h2>
              </div>
              <p className="text-sm text-[#6E5D4F] dark:text-[#B5A495] leading-relaxed mt-4">
                Recommends coffee based on individual customer preferences including temperature, sweetness, milk alternatives, and roast style.
              </p>
            </article>

            {/* Card 2 */}
            <article className="info-card rounded-3xl bg-white/70 dark:bg-[#18110C]/80 border border-[#E6D5C3] dark:border-[#2A1D15] shadow-sm">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-[#B85C2C]/10 text-[#B85C2C] dark:text-[#D9A441] flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h2 className="text-[clamp(20px,2vw,26px)] font-serif font-bold text-[#2B1B10] dark:text-[#F5EAD9]">RAG-Grounded Answers</h2>
              </div>
              <p className="text-sm text-[#6E5D4F] dark:text-[#B5A495] leading-relaxed mt-4">
                Grounds responses strictly in the official coffee knowledge base rather than inventing menu items or incorrect prices.
              </p>
            </article>

            {/* Card 3 */}
            <article className="info-card rounded-3xl bg-white/70 dark:bg-[#18110C]/80 border border-[#E6D5C3] dark:border-[#2A1D15] shadow-sm">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-[#B85C2C]/10 text-[#B85C2C] dark:text-[#D9A441] flex items-center justify-center">
                  <DollarSign className="w-6 h-6" />
                </div>
                <h2 className="text-[clamp(20px,2vw,26px)] font-serif font-bold text-[#2B1B10] dark:text-[#F5EAD9]">Budget Awareness</h2>
              </div>
              <p className="text-sm text-[#6E5D4F] dark:text-[#B5A495] leading-relaxed mt-4">
                Respects the selected spending limit, such as under ₹200/₹250, and filters recommendations accordingly.
              </p>
            </article>

            {/* Card 4 */}
            <article className="info-card rounded-3xl bg-white/70 dark:bg-[#18110C]/80 border border-[#E6D5C3] dark:border-[#2A1D15] shadow-sm">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-[#B85C2C]/10 text-[#B85C2C] dark:text-[#D9A441] flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h2 className="text-[clamp(20px,2vw,26px)] font-serif font-bold text-[#2B1B10] dark:text-[#F5EAD9]">Dietary & Allergen Safety</h2>
              </div>
              <p className="text-sm text-[#6E5D4F] dark:text-[#B5A495] leading-relaxed mt-4">
                Supports dairy-free preferences such as Oat Milk and checks allergen information automatically before suggesting products.
              </p>
            </article>

          </div>

          {/* Centered CTA Section */}
          <div className="cta-container">
            <div className="p-10 sm:p-14 rounded-3xl bg-gradient-to-br from-[#140E0A] via-[#1B120D] to-[#2B1B10] text-[#F5EAD9] text-center space-y-6 shadow-2xl border border-[#2A1D15]">
              <h3 className="font-serif text-[clamp(24px,3vw,36px)] font-bold">Experience smart coffee recommendations</h3>
              <p className="text-base text-[#C5B4A5] max-w-lg mx-auto leading-relaxed">
                Try CoffeeMind AI today and get instant, grounded beverage choices.
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
