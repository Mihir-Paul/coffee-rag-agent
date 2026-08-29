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
    <div className="page-wrapper bg-[#FDF9F3] dark:bg-[#0D0A08] text-[#2B1B10] dark:text-[#F5EAD9] transition-colors duration-300 font-sans">
      
      {/* Shared Navbar */}
      <Navbar
        onNavigate={onNavigate}
        currentView="technology"
        isAuthenticated={isAuthenticated}
        theme={theme}
        onToggleTheme={onToggleTheme}
      />

      <main className="page-main">
        <section className="section-container">
          
          {/* Centered Section Header */}
          <header className="section-header">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#B85C2C]/10 dark:bg-[#B85C2C]/20 border border-[#B85C2C]/30 text-xs font-semibold text-[#B85C2C] dark:text-[#D9A441] mb-5">
              <Cpu className="w-3.5 h-3.5" />
              <span>AI ARCHITECTURE</span>
            </div>

            <h1 className="font-serif text-[clamp(40px,5vw,68px)] font-bold tracking-tight leading-[1.05] text-[#2B1B10] dark:text-[#F5EAD9] mb-6">
              Powered by AI. Grounded in coffee knowledge.
            </h1>

            <p className="text-lg sm:text-xl text-[#6E5D4F] dark:text-[#B5A495] leading-relaxed max-w-[760px] mx-auto">
              How CoffeeMind AI combines LLM intelligence with real-world menu constraints.
            </p>
          </header>

          {/* 2-Column Cards Grid */}
          <div className="cards-grid-2col">
            
            {/* 1. Google GenAI */}
            <article className="info-card rounded-3xl bg-[#140E0A] text-[#F5EAD9] border border-white/10 shadow-xl">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-[#D9A441]/10 text-[#D9A441] flex items-center justify-center font-bold">
                  <Brain className="w-6 h-6" />
                </div>
                <div className="text-xs font-bold text-[#D9A441] uppercase tracking-wider">REASONING ENGINE</div>
                <h2 className="text-[clamp(20px,2vw,26px)] font-serif font-bold">Google GenAI (Gemini)</h2>
              </div>
              <p className="text-sm text-[#B5A495] leading-relaxed mt-4">
                Handles intelligent natural-language reasoning and coffee recommendation generation, understanding nuance in user preferences.
              </p>
            </article>

            {/* 2. LangChain */}
            <article className="info-card rounded-3xl bg-[#140E0A] text-[#F5EAD9] border border-white/10 shadow-xl">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-[#D9A441]/10 text-[#D9A441] flex items-center justify-center font-bold">
                  <Layers className="w-6 h-6" />
                </div>
                <div className="text-xs font-bold text-[#D9A441] uppercase tracking-wider">RAG RETRIEVAL PIPELINE</div>
                <h2 className="text-[clamp(20px,2vw,26px)] font-serif font-bold">LangChain</h2>
              </div>
              <p className="text-sm text-[#B5A495] leading-relaxed mt-4">
                Handles the RAG pipeline, retrieval, document processing, and grounding the model's responses in the official coffee knowledge base.
              </p>
            </article>

            {/* 3. Google ADK */}
            <article className="info-card rounded-3xl bg-[#140E0A] text-[#F5EAD9] border border-white/10 shadow-xl">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-[#D9A441]/10 text-[#D9A441] flex items-center justify-center font-bold">
                  <Cpu className="w-6 h-6" />
                </div>
                <div className="text-xs font-bold text-[#D9A441] uppercase tracking-wider">AGENT ORCHESTRATION</div>
                <h2 className="text-[clamp(20px,2vw,26px)] font-serif font-bold">Google ADK</h2>
              </div>
              <p className="text-sm text-[#B5A495] leading-relaxed mt-4">
                Provides the agent architecture and multi-tool orchestration for the CoffeeMind AI system, executing brewing and menu calculations.
              </p>
            </article>

            {/* 4. Supabase */}
            <article className="info-card rounded-3xl bg-[#140E0A] text-[#F5EAD9] border border-white/10 shadow-xl">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-[#D9A441]/10 text-[#D9A441] flex items-center justify-center font-bold">
                  <Database className="w-6 h-6" />
                </div>
                <div className="text-xs font-bold text-[#D9A441] uppercase tracking-wider">DATABASE & SECURITY</div>
                <h2 className="text-[clamp(20px,2vw,26px)] font-serif font-bold">Supabase</h2>
              </div>
              <p className="text-sm text-[#B5A495] leading-relaxed mt-4">
                Handles authentication, customer identity, preferences, and persistent application data protected by Row Level Security (RLS).
              </p>
            </article>

          </div>

          {/* Centered CTA Section */}
          <div className="cta-container">
            <div className="p-10 sm:p-14 rounded-3xl bg-gradient-to-br from-[#140E0A] via-[#1B120D] to-[#2B1B10] text-[#F5EAD9] text-center space-y-6 shadow-2xl border border-[#2A1D15]">
              <h3 className="font-serif text-[clamp(24px,3vw,36px)] font-bold">Try the AI Coffee Assistant</h3>
              <p className="text-base text-[#C5B4A5] max-w-lg mx-auto leading-relaxed">
                Test Gemini, ADK, and LangChain RAG in action with real coffee recommendations.
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
