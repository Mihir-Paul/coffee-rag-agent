import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { 
  Coffee, 
  Send, 
  Plus, 
  Sun, 
  Moon, 
  Menu, 
  X, 
  Sparkles, 
  User, 
  Settings, 
  MessageSquare, 
  CheckCircle2, 
  AlertTriangle,
  Zap,
  Snowflake,
  Flame,
  DollarSign,
  ShieldAlert,
  Heart,
  Code2
} from 'lucide-react';
import { Message, CoffeeRecommendation, CustomerProfileOption } from './types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// Customer-facing profile options (Clean names only — internal IDs used only in background payload)
const CUSTOMER_PROFILES: CustomerProfileOption[] = [
  { id: 'guest', name: 'Guest User', desc: 'Standard AI Assistant' },
  { id: 'C001', name: 'Aarav', desc: 'Cold · Low Sweet · Oat Milk · Budget ₹250' },
  { id: 'C002', name: 'Priya', desc: 'Dairy-Free · High Caffeine · Budget ₹200' }
];

const QUICK_ACTIONS = [
  { label: 'Recommend something', icon: Sparkles, prompt: 'Recommend a popular coffee for me' },
  { label: 'Something cold', icon: Snowflake, prompt: 'What cold drinks do you have?' },
  { label: 'Something sweet', icon: Heart, prompt: 'I want something sweet and flavorful' },
  { label: 'Under ₹200', icon: DollarSign, prompt: 'I have ₹200. What should I order?' },
  { label: 'High caffeine', icon: Zap, prompt: 'Which drinks have the most caffeine?' },
  { label: 'Dairy-free options', icon: CheckCircle2, prompt: 'I don\'t drink dairy. What can I order?' }
];

export default function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<string>('guest');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [showDevMode, setShowDevMode] = useState(false);
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome-1',
      sender: 'assistant',
      text: 'Good morning 👋\n\nI am CoffeeMind AI, your personal coffee expert. Ask me about our handcrafted menu, dietary recommendations, prices, or personalized orders!',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const handleNewChat = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: 'assistant',
        text: 'Good morning 👋\n\nWhat are you in the mood for today?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    setSessionId(null);
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  const sanitizeClientText = (text: string): string => {
    if (!text) return text;
    // Replace any leftover internal customer IDs with friendly terms
    return text
      .replace(/\bCustomer\s+C\d{3}\b/gi, 'your')
      .replace(/\bC\d{3}'s\b/gi, 'your')
      .replace(/\bC\d{3}\b/gi, 'your')
      .replace(/\byour prefers\b/gi, 'you prefer')
      .replace(/\byour likes\b/gi, 'you like');
  };

  const sendMessage = async (textToSend?: string) => {
    const queryText = (textToSend || input).trim();
    if (!queryText || loading) return;

    let effectiveQuery = queryText;
    if (selectedProfile !== 'guest') {
      effectiveQuery = `[Customer profile ${selectedProfile}] ${queryText}`;
    }

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: queryText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: effectiveQuery,
          user_id: selectedProfile,
          session_id: sessionId
        })
      });

      if (!res.ok) {
        let errData: any = {};
        try {
          errData = await res.json();
        } catch (_) {}

        if (res.status === 429 || errData.error === 'AI_QUOTA_EXHAUSTED') {
          throw new Error('CoffeeMind is temporarily unavailable. Please try again later.\n\nOur AI service has reached its current usage limit.');
        } else if (res.status === 503 || errData.error === 'AI_TEMPORARILY_UNAVAILABLE') {
          throw new Error('CoffeeMind is temporarily unavailable. Please try again later.');
        } else if (res.status === 403 || res.status === 401 || errData.error === 'AI_AUTHENTICATION_ERROR') {
          throw new Error('CoffeeMind is temporarily unavailable. Please try again later.');
        } else if (res.status === 404 || errData.error === 'AI_MODEL_NOT_FOUND') {
          throw new Error('CoffeeMind is temporarily unavailable. Please try again later.');
        } else {
          throw new Error('CoffeeMind is temporarily unavailable. Please try again later.');
        }
      }

      const data = await res.json();

      if (data.session_id) {
        setSessionId(data.session_id);
      }

      const cleanedResponse = sanitizeClientText(data.response || 'I have found some options for you.');

      const botMsg: Message = {
        id: `bot-${Date.now()}`,
        sender: 'assistant',
        text: cleanedResponse,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        recommendations: data.recommendations || []
      };

      setMessages(prev => [...prev, botMsg]);

    } catch (err: any) {
      console.error('Chat error:', err);
      
      let errorDisplayMessage = err.message || 'CoffeeMind is temporarily unavailable. Please try again later.';
      if (err.name === 'TypeError' && err.message.includes('Failed to fetch')) {
        errorDisplayMessage = 'CoffeeMind is temporarily unavailable. Please check that the backend is running at http://localhost:8000.';
      }

      const errorMsg: Message = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        text: errorDisplayMessage,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isError: true
      };

      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      
      {/* Sidebar Overlay (Mobile) */}
      {sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 40,
            display: 'block'
          }}
        />
      )}

      {/* Sidebar */}
      <aside 
        style={{
          width: '280px',
          backgroundColor: 'var(--bg-sidebar)',
          color: 'var(--sidebar-text)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '1.25rem',
          transition: 'all 0.3s ease',
          zIndex: 50,
          position: window.innerWidth < 768 ? 'fixed' : 'relative',
          top: 0,
          bottom: 0,
          left: sidebarOpen || window.innerWidth >= 768 ? 0 : '-280px',
          boxShadow: 'var(--shadow-lg)'
        }}
      >
        <div>
          {/* Header Brand */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(200, 122, 55, 0.4)'
              }}>
                <Coffee size={22} color="#ffffff" />
              </div>
              <div>
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.02em', color: '#fff' }}>
                  CoffeeMind AI
                </h1>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Your personal coffee expert</p>
              </div>
            </div>
            {window.innerWidth < 768 && (
              <button onClick={() => setSidebarOpen(false)} style={{ color: '#fff', padding: '0.25rem' }}>
                <X size={20} />
              </button>
            )}
          </div>

          {/* New Chat Button */}
          <button
            onClick={handleNewChat}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1rem',
              backgroundColor: 'var(--accent-primary)',
              color: '#ffffff',
              borderRadius: '10px',
              fontWeight: 600,
              fontSize: '0.9rem',
              marginBottom: '1.5rem',
              boxShadow: '0 4px 12px rgba(200, 122, 55, 0.3)'
            }}
          >
            <Plus size={18} />
            <span>New Chat</span>
          </button>

          {/* Recent Chats Section */}
          <div style={{ marginBottom: '1.5rem' }}>
            <p style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
              Recent Sessions
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <button 
                onClick={handleNewChat}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.6rem 0.75rem',
                  borderRadius: '8px',
                  backgroundColor: 'var(--sidebar-hover)',
                  color: '#fff',
                  fontSize: '0.85rem',
                  textAlign: 'left',
                  width: '100%'
                }}
              >
                <MessageSquare size={16} color="var(--accent-primary)" />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Current Coffee Session</span>
              </button>
            </div>
          </div>

          {/* My Preferences Section (Clean customer names only) */}
          <div style={{ marginBottom: '1.5rem' }}>
            <p style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
              My Preferences
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {CUSTOMER_PROFILES.map(prof => (
                <button
                  key={prof.id}
                  onClick={() => setSelectedProfile(prof.id)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    padding: '0.65rem 0.75rem',
                    borderRadius: '8px',
                    backgroundColor: selectedProfile === prof.id ? 'var(--accent-secondary)' : 'transparent',
                    border: selectedProfile === prof.id ? '1px solid var(--accent-primary)' : '1px solid transparent',
                    color: '#fff',
                    textAlign: 'left',
                    width: '100%',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%' }}>
                    <User size={14} color={selectedProfile === prof.id ? '#ffffff' : 'var(--accent-primary)'} />
                    <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{prof.name}</span>
                  </div>
                  <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{prof.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Developer Mode Inspection Drawer */}
          {showDevMode && (
            <div style={{
              padding: '0.75rem',
              backgroundColor: 'rgba(0,0,0,0.3)',
              borderRadius: '8px',
              border: '1px solid var(--sidebar-hover)',
              fontSize: '0.7rem',
              color: 'var(--text-muted)',
              marginBottom: '1rem'
            }}>
              <div style={{ fontWeight: 600, color: 'var(--accent-gold)', marginBottom: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Code2 size={12} />
                <span>Dev Mode: Customer Data Mapping</span>
              </div>
              <p>Storage: <code>coffee_agent/data/customers.json</code></p>
              <ul style={{ paddingLeft: '1.2rem', marginTop: '0.25rem' }}>
                <li>C001 → Aarav (Oat Milk, Cold)</li>
                <li>C002 → Priya (Dairy-Free, High Caffeine)</li>
              </ul>
            </div>
          )}
        </div>

        {/* Footer Settings & Theme Switch */}
        <div style={{ borderTop: '1px solid var(--sidebar-hover)', paddingTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button
            onClick={() => setShowDevMode(!showDevMode)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
            title="Toggle Developer Data Mapping"
          >
            <Settings size={16} color="var(--text-muted)" />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>CoffeeMind v1.0</span>
          </button>
          <button 
            onClick={toggleTheme}
            title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
            style={{
              padding: '0.5rem',
              borderRadius: '8px',
              backgroundColor: 'var(--sidebar-hover)',
              color: '#fff'
            }}
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
        </div>
      </aside>

      {/* Main Area */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: 'var(--bg-primary)', position: 'relative' }}>
        
        {/* Navbar */}
        <header style={{
          height: '64px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 1.5rem',
          backgroundColor: 'var(--bg-card)',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {window.innerWidth < 768 && (
              <button onClick={() => setSidebarOpen(true)} style={{ color: 'var(--text-primary)', padding: '0.25rem' }}>
                <Menu size={22} />
              </button>
            )}
            <div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700 }}>
                CoffeeMind AI
              </h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: 600 }}>● RAG-Grounded Assistant</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              onClick={handleNewChat}
              style={{
                fontSize: '0.8rem',
                fontWeight: 600,
                padding: '0.4rem 0.8rem',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                color: 'var(--text-secondary)'
              }}
            >
              Clear Session
            </button>
          </div>
        </header>

        {/* Scrollable Conversation Stream */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '900px', width: '100%', margin: '0 auto' }}>
          
          {/* Greeting Hero Header */}
          <div style={{ textAlign: 'center', margin: '1rem 0 1.5rem 0' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '0.75rem',
              boxShadow: 'var(--shadow-md)'
            }}>
              <Coffee size={30} color="#ffffff" />
            </div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Good morning 👋
            </h2>
            <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              What are you in the mood for?
            </p>

            {/* Quick Action Chips */}
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.5rem',
              justifyContent: 'center',
              marginTop: '1.25rem'
            }}>
              {QUICK_ACTIONS.map((action, idx) => {
                const IconComp = action.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => sendMessage(action.prompt)}
                    disabled={loading}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      padding: '0.5rem 0.9rem',
                      borderRadius: '20px',
                      backgroundColor: 'var(--bg-card)',
                      border: '1px solid var(--card-border)',
                      color: 'var(--text-primary)',
                      fontSize: '0.825rem',
                      fontWeight: 500,
                      boxShadow: 'var(--shadow-sm)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <IconComp size={14} color="var(--accent-primary)" />
                    <span>{action.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Messages Stream */}
          {messages.map(msg => (
            <div
              key={msg.id}
              className="animate-fade-in"
              style={{
                display: 'flex',
                gap: '0.75rem',
                justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                alignItems: 'flex-start'
              }}
            >
              {msg.sender === 'assistant' && (
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--accent-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: 'var(--shadow-sm)'
                }}>
                  <Coffee size={20} color="#ffffff" />
                </div>
              )}

              <div style={{ maxWidth: '80%', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{
                  padding: '1rem 1.25rem',
                  borderRadius: msg.sender === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  backgroundColor: msg.sender === 'user' ? 'var(--user-bubble)' : (msg.isError ? 'var(--bg-secondary)' : 'var(--bot-bubble)'),
                  color: msg.sender === 'user' ? 'var(--user-text)' : 'var(--text-primary)',
                  border: msg.sender === 'user' ? 'none' : (msg.isError ? '1px solid var(--danger)' : '1px solid var(--bot-border)'),
                  boxShadow: 'var(--shadow-sm)',
                  fontSize: '0.925rem',
                  lineHeight: '1.6'
                }}>
                  {msg.isError && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--danger)', marginBottom: '0.4rem', fontWeight: 600 }}>
                      <ShieldAlert size={18} />
                      <span>Notice</span>
                    </div>
                  )}

                  {/* Render Markdown cleanly for assistant, plain text for user */}
                  {msg.sender === 'assistant' && !msg.isError ? (
                    <div className="markdown-content">
                      <ReactMarkdown>{msg.text}</ReactMarkdown>
                    </div>
                  ) : (
                    <div style={{ whiteSpace: 'pre-line' }}>{msg.text}</div>
                  )}
                </div>

                {/* Structured Coffee Recommendation Cards */}
                {msg.recommendations && msg.recommendations.length > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0.85rem', marginTop: '0.5rem' }}>
                    {msg.recommendations.map(rec => (
                      <div
                        key={rec.id}
                        style={{
                          backgroundColor: 'var(--bg-card)',
                          border: '1px solid var(--card-border)',
                          borderRadius: '14px',
                          padding: '1rem',
                          boxShadow: 'var(--shadow-md)',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                            <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                              {rec.name}
                            </h4>
                            <span style={{
                              fontSize: '0.9rem',
                              fontWeight: 700,
                              color: 'var(--accent-primary)',
                              backgroundColor: 'var(--accent-light)',
                              padding: '0.2rem 0.5rem',
                              borderRadius: '6px'
                            }}>
                              ₹{rec.price_inr}
                            </span>
                          </div>

                          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', lineHeight: '1.4' }}>
                            {rec.description}
                          </p>

                          {/* Attribute Badges */}
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '0.5rem' }}>
                            <span style={{
                              fontSize: '0.7rem',
                              fontWeight: 600,
                              padding: '0.15rem 0.45rem',
                              borderRadius: '4px',
                              backgroundColor: rec.temperature === 'Hot' ? 'rgba(225, 29, 72, 0.1)' : 'rgba(14, 165, 233, 0.1)',
                              color: rec.temperature === 'Hot' ? 'var(--danger)' : 'var(--accent-primary)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.2rem'
                            }}>
                              {rec.temperature === 'Hot' ? <Flame size={12} /> : <Snowflake size={12} />}
                              {rec.temperature}
                            </span>

                            <span style={{
                              fontSize: '0.7rem',
                              fontWeight: 600,
                              padding: '0.15rem 0.45rem',
                              borderRadius: '4px',
                              backgroundColor: 'rgba(234, 179, 8, 0.1)',
                              color: 'var(--accent-gold)'
                            }}>
                              Sweetness: {rec.sweetness}
                            </span>

                            <span style={{
                              fontSize: '0.7rem',
                              fontWeight: 600,
                              padding: '0.15rem 0.45rem',
                              borderRadius: '4px',
                              backgroundColor: 'rgba(168, 85, 247, 0.1)',
                              color: '#a855f7'
                            }}>
                              Caffeine: {rec.caffeine}
                            </span>

                            <span style={{
                              fontSize: '0.7rem',
                              fontWeight: 600,
                              padding: '0.15rem 0.45rem',
                              borderRadius: '4px',
                              backgroundColor: 'rgba(34, 197, 94, 0.1)',
                              color: 'var(--success)'
                            }}>
                              Milk: {rec.milk}
                            </span>
                          </div>
                        </div>

                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
                          Ingredients: {rec.ingredients ? rec.ingredients.join(', ') : 'Standard'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <span style={{
                  fontSize: '0.7rem',
                  color: 'var(--text-muted)',
                  alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start'
                }}>
                  {msg.timestamp}
                </span>
              </div>

              {msg.sender === 'user' && (
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--bg-sidebar)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: 'var(--shadow-sm)'
                }}>
                  <User size={18} color="#ffffff" />
                </div>
              )}
            </div>
          ))}

          {/* Loading Indicator */}
          {loading && (
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: 'var(--accent-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Coffee size={20} color="#ffffff" />
              </div>
              <div style={{
                padding: '0.75rem 1.25rem',
                borderRadius: '18px 18px 18px 4px',
                backgroundColor: 'var(--bot-bubble)',
                border: '1px solid var(--bot-border)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <Sparkles size={16} color="var(--accent-primary)" style={{ animation: 'spin 2s linear infinite' }} />
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>CoffeeMind is crafting a response...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <footer style={{
          padding: '1rem 1.5rem 1.5rem 1.5rem',
          backgroundColor: 'var(--bg-primary)',
          borderTop: '1px solid var(--border-color)',
          maxWidth: '900px',
          width: '100%',
          margin: '0 auto'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: '0.75rem',
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--card-border)',
            borderRadius: '16px',
            padding: '0.75rem 1rem',
            boxShadow: 'var(--shadow-md)',
            transition: 'border-color 0.2s ease'
          }}>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me anything about coffee..."
              rows={1}
              style={{
                flex: 1,
                border: 'none',
                outline: 'none',
                backgroundColor: 'transparent',
                color: 'var(--text-primary)',
                fontSize: '0.95rem',
                resize: 'none',
                maxHeight: '120px'
              }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                backgroundColor: input.trim() && !loading ? 'var(--accent-primary)' : 'var(--border-color)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s ease'
              }}
            >
              <Send size={18} />
            </button>
          </div>
          <p style={{ textAlign: 'center', fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            CoffeeMind AI is grounded by RAG knowledge base. All prices and details match shop menu data.
          </p>
        </footer>

      </main>
    </div>
  );
}
