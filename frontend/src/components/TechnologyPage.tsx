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
    <div className="page-wrapper-fit min-h-screen bg-[#FDF9F3] dark:bg-[#0D0A08] text-[#2B1B10] dark:text-[#F5EAD9] transition-colors duration-300 font-sans">
      
      {/* Shared Navbar */}
      <Navbar
        onNavigate={onNavigate}
        currentView="technology"
        isAuthenticated={isAuthenticated}
        theme={theme}
        onToggleTheme={onToggleTheme}
      />

      <main className="page-main flex-1 flex flex-col justify-between py-2 lg:py-3">
        <section className="section-container flex-1 flex flex-col justify-between my-auto">
          
          {/* Centered Section Header */}
          <header className="section-header !pt-2 sm:!pt-4 !mb-3 sm:!mb-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#B85C2C]/10 dark:bg-[#B85C2C]/20 border border-[#B85C2C]/30 text-[11px] font-semibold text-[#B85C2C] dark:text-[#D9A441] mb-2">
              <Cpu className="w-3 h-3" />
              <span>AI ARCHITECTURE</span>
            </div>

            <h1 className="font-serif text-[clamp(28px,3.2vw,48px)] font-bold tracking-tight leading-[1.08] text-[#2B1B10] dark:text-[#F5EAD9] mb-2">
              Powered by AI. Grounded in coffee knowledge.
            </h1>

            <p className="text-xs sm:text-sm lg:text-base text-[#6E5D4F] dark:text-[#B5A495] leading-relaxed max-w-[650px] mx-auto">
              How CoffeeMind AI combines LLM intelligence with real-world menu constraints.
            </p>
          </header>

          {/* 4-Column Cards Grid (All 4 cards fit in 1 row on desktop) */}
          <div className="cards-grid-4col !mb-3 sm:!mb-5">
            
            {/* 1. Google GenAI */}
            <article className="info-card !p-5 rounded-2xl bg-white/70 dark:bg-[#18110C]/80 border border-[#E6D5C3] dark:border-[#2A1D15] shadow-sm flex flex-col justify-between">
              <div className="space-y-2">
                <div className="w-9 h-9 rounded-xl bg-[#B85C2C]/10 text-[#B85C2C] dark:text-[#D9A441] flex items-center justify-center font-bold">
                  <Brain className="w-4 h-4" />
                </div>
                <div className="text-[10px] font-bold text-[#B85C2C] dark:text-[#D9A441] uppercase tracking-wider">REASONING ENGINE</div>
                <h2 className="text-base sm:text-lg font-serif font-bold leading-tight text-[#2B1B10] dark:text-[#F5EAD9]">Google GenAI (Gemini)</h2>
              </div>
              <p className="text-xs text-[#6E5D4F] dark:text-[#B5A495] leading-relaxed mt-2">
                Handles intelligent natural-language reasoning and coffee recommendation generation.
              </p>
            </article>

            {/* 2. LangChain */}
            <article className="info-card !p-5 rounded-2xl bg-white/70 dark:bg-[#18110C]/80 border border-[#E6D5C3] dark:border-[#2A1D15] shadow-sm flex flex-col justify-between">
              <div className="space-y-2">
                <div className="w-9 h-9 rounded-xl bg-[#B85C2C]/10 text-[#B85C2C] dark:text-[#D9A441] flex items-center justify-center font-bold">
                  <Layers className="w-4 h-4" />
                </div>
                <div className="text-[10px] font-bold text-[#B85C2C] dark:text-[#D9A441] uppercase tracking-wider">RAG PIPELINE</div>
                <h2 className="text-base sm:text-lg font-serif font-bold leading-tight text-[#2B1B10] dark:text-[#F5EAD9]">LangChain</h2>
              </div>
              <p className="text-xs text-[#6E5D4F] dark:text-[#B5A495] leading-relaxed mt-2">
                Handles RAG retrieval, document processing, and grounds responses in official menu knowledge.
              </p>
            </article>

            {/* 3. Google ADK */}
            <article className="info-card !p-5 rounded-2xl bg-white/70 dark:bg-[#18110C]/80 border border-[#E6D5C3] dark:border-[#2A1D15] shadow-sm flex flex-col justify-between">
              <div className="space-y-2">
                <div className="w-9 h-9 rounded-xl bg-[#B85C2C]/10 text-[#B85C2C] dark:text-[#D9A441] flex items-center justify-center font-bold">
                  <Cpu className="w-4 h-4" />
                </div>
                <div className="text-[10px] font-bold text-[#B85C2C] dark:text-[#D9A441] uppercase tracking-wider">AGENT ORCHESTRATION</div>
                <h2 className="text-base sm:text-lg font-serif font-bold leading-tight text-[#2B1B10] dark:text-[#F5EAD9]">Google ADK</h2>
              </div>
              <p className="text-xs text-[#6E5D4F] dark:text-[#B5A495] leading-relaxed mt-2">
                Provides agent architecture and multi-tool orchestration for brewing & menu calculations.
              </p>
            </article>

            {/* 4. Supabase */}
            <article className="info-card !p-5 rounded-2xl bg-white/70 dark:bg-[#18110C]/80 border border-[#E6D5C3] dark:border-[#2A1D15] shadow-sm flex flex-col justify-between">
              <div className="space-y-2">
                <div className="w-9 h-9 rounded-xl bg-[#B85C2C]/10 text-[#B85C2C] dark:text-[#D9A441] flex items-center justify-center font-bold">
                  <Database className="w-4 h-4" />
                </div>
                <div className="text-[10px] font-bold text-[#B85C2C] dark:text-[#D9A441] uppercase tracking-wider">DATABASE & SECURITY</div>
                <h2 className="text-base sm:text-lg font-serif font-bold leading-tight text-[#2B1B10] dark:text-[#F5EAD9]">Supabase</h2>
              </div>
              <p className="text-xs text-[#6E5D4F] dark:text-[#B5A495] leading-relaxed mt-2">
                Handles authentication, customer identity, preferences, and data protected by RLS.
              </p>
            </article>

          </div>

          {/* Centered CTA Section */}
          <div className="cta-container">
            <div className="cta-banner">
              <h3 className="cta-title">Try the AI Coffee Assistant</h3>
              <p className="cta-desc">
                Test Gemini, ADK, and LangChain RAG in action with real coffee recommendations.
              </p>
              <div className="cta-button-wrap">
                <button
                  onClick={() => onNavigate(isAuthenticated ? 'chat' : 'auth')}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#B85C2C] to-[#A34E22] hover:from-[#A34E22] hover:to-[#8B3E18] text-white font-bold text-xs sm:text-sm shadow-lg inline-flex items-center gap-2 hover:scale-[1.02] transition-transform"
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
