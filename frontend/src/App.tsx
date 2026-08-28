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
  Code2,
  History,
  Clock,
  LogOut
} from 'lucide-react';
import { Message, CoffeeRecommendation, UserProfile, ConversationSession } from './types';
import { supabase } from './supabaseClient';
import { AuthModal } from './components/AuthModal';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

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
  const [showDevMode, setShowDevMode] = useState(false);

  // Supabase Auth & User Session State
  const [userSession, setUserSession] = useState<any>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [conversations, setConversations] = useState<ConversationSession[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome-1',
      sender: 'assistant',
      text: 'Good morning 👋\n\nI am CoffeeMind AI, your personal coffee expert. Ask me about our handcrafted menu, dietary recommendations, prices, or personalized orders!',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Check Supabase Auth session on load
  useEffect(() => {
    // 1. Check local mock token first (for testing/demo fallback)
    const mockToken = localStorage.getItem('coffeemind_mock_token');
    if (mockToken) {
      setAuthToken(mockToken);
      fetchUserProfile(mockToken);
      fetchConversations(mockToken);
      setAuthChecking(false);
      return;
    }

    // 2. Check Supabase auth session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserSession(session);
      if (session?.access_token) {
        setAuthToken(session.access_token);
        fetchUserProfile(session.access_token);
        fetchConversations(session.access_token);
      }
      setAuthChecking(false);
    }).catch(() => {
      setAuthChecking(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserSession(session);
      if (session?.access_token) {
        setAuthToken(session.access_token);
        fetchUserProfile(session.access_token);
        fetchConversations(session.access_token);
      } else if (!localStorage.getItem('coffeemind_mock_token')) {
        setAuthToken(null);
        setUserProfile(null);
        setConversations([]);
      }
      setAuthChecking(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (token: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUserProfile(data);
      }
    } catch (err) {
      console.error('Failed to fetch user profile:', err);
    }
  };

  const fetchConversations = async (token: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/conversations`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
      }
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
    }
  };

  const handleSelectConversation = async (convId: string) => {
    if (!authToken) return;
    setSessionId(convId);
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/conversations/${convId}/messages`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.messages && data.messages.length > 0) {
          const loadedMsgs: Message[] = data.messages.map((m: any) => ({
            id: m.id,
            sender: m.role === 'user' ? 'user' : 'assistant',
            text: m.content,
            timestamp: new Date(m.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            recommendations: m.recommendations || []
          }));
          setMessages(loadedMsgs);
        }
      }
    } catch (err) {
      console.error('Error loading session messages:', err);
    } finally {
      setLoading(false);
      if (window.innerWidth < 768) setSidebarOpen(false);
    }
  };

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const handleLogout = async () => {
    localStorage.removeItem('coffeemind_mock_token');
    await supabase.auth.signOut();
    setUserSession(null);
    setAuthToken(null);
    setUserProfile(null);
    setConversations([]);
    setSessionId(null);
    setMessages([
      {
        id: 'welcome-1',
        sender: 'assistant',
        text: 'Good morning 👋\n\nI am CoffeeMind AI, your personal coffee expert. Ask me about our handcrafted menu, dietary recommendations, prices, or personalized orders!',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  const handleNewChat = async () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: 'assistant',
        text: `Hello ${userProfile?.name || ''} 👋\n\nWhat are you in the mood for today?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    setSessionId(null);

    if (authToken) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/conversations`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${authToken}` }
        });
        if (res.ok) {
          const newConv = await res.json();
          setSessionId(newConv.id);
          setConversations(prev => [newConv, ...prev]);
        }
      } catch (err) {
        console.error('Failed to create new conversation:', err);
      }
    }

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
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const res = await fetch(`${API_BASE_URL}/api/chat`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message: queryText,
          session_id: sessionId
        })
      });

      if (!res.ok) {
        let errData: any = {};
        try {
          errData = await res.json();
        } catch (_) {}

        if (res.status === 401) {
          throw new Error('Your session has expired. Please sign in again.');
        } else if (res.status === 429 || errData.error === 'AI_QUOTA_EXHAUSTED') {
          throw new Error('CoffeeMind is temporarily unavailable. Please try again later.\n\nOur AI service has reached its current usage limit.');
        } else if (res.status === 503 || errData.error === 'AI_TEMPORARILY_UNAVAILABLE') {
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

      // Refresh conversations list to update titles
      if (authToken) {
        fetchConversations(authToken);
      }

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

  // Format active user preference badge
  const pref = userProfile?.preferences;
  const prefSummary = pref 
    ? `${pref.temperature} · ${pref.sweetness} Sweet · ${pref.milk_preference} · Budget ₹${pref.budget}`
    : 'Cold · Low Sweet · Oat Milk · Budget ₹250';

  // 1. Session Loading State: Minimal CoffeeMind loader
  if (authChecking) {
    return (
      <div className="fixed inset-0 z-50 bg-[#FBF4E9] dark:bg-[#1B120D] flex flex-col items-center justify-center space-y-4 font-sans text-[#2B1B10] dark:text-[#F5EAD9]">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#B85C2C] to-[#9C4A20] flex items-center justify-center shadow-xl shadow-[#B85C2C]/25 animate-pulse">
          <Coffee className="w-7 h-7 text-white" />
        </div>
        <div className="text-center space-y-1">
          <h2 className="font-serif text-xl font-bold">CoffeeMind AI</h2>
          <p className="text-xs text-[#9C8A72] dark:text-[#9A877A]">Connecting to your coffee workspace...</p>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated State: Show Auth Screen ONLY (No dashboard behind it)
  if (!authToken) {
    return <AuthModal onAuthSuccess={() => {}} />;
  }

  // 3. Authenticated State: Render Main Dashboard
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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(184, 92, 44, 0.3)'
              }}>
                <Coffee size={22} color="#ffffff" />
              </div>
              <div>
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--sidebar-text)' }}>
                  CoffeeMind AI
                </h1>
                <p style={{ fontSize: '0.75rem', color: 'var(--sidebar-text-muted)' }}>Your personal coffee expert</p>
              </div>
            </div>
            {window.innerWidth < 768 && (
              <button onClick={() => setSidebarOpen(false)} style={{ color: 'var(--sidebar-text)', padding: '0.25rem' }} aria-label="Close sidebar">
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
              boxShadow: '0 4px 12px rgba(184, 92, 44, 0.25)'
            }}
          >
            <Plus size={18} />
            <span>New Chat</span>
          </button>

          {/* Recent Sessions Section */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div className="sidebar-section-header">
              <History size={14} color="var(--sidebar-text-muted)" />
              <span>Recent Sessions</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '180px', overflowY: 'auto' }}>
              {conversations.length === 0 ? (
                <button 
                  onClick={handleNewChat}
                  className={`session-card ${!sessionId ? 'active' : ''}`}
                >
                  <div className="session-card-icon-wrapper">
                    <MessageSquare size={16} color="var(--accent-primary)" />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--sidebar-text)' }}>
                      Current Coffee Session
                    </span>
                    <span style={{ fontSize: '0.725rem', color: 'var(--sidebar-text-muted)', marginTop: '0.15rem' }}>
                      Active
                    </span>
                  </div>
                </button>
              ) : (
                conversations.map(conv => (
                  <button 
                    key={conv.id}
                    onClick={() => handleSelectConversation(conv.id)}
                    className={`session-card ${sessionId === conv.id ? 'active' : ''}`}
                  >
                    <div className="session-card-icon-wrapper">
                      <MessageSquare size={16} color="var(--accent-primary)" />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--sidebar-text)' }}>
                        {conv.title || 'Coffee Session'}
                      </span>
                      <span style={{ fontSize: '0.725rem', color: 'var(--sidebar-text-muted)', marginTop: '0.15rem' }}>
                        {conv.created_at ? new Date(conv.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'Today'}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Customer Profile & Preferences Section */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div className="sidebar-section-header">
              <User size={14} color="var(--sidebar-text-muted)" />
              <span>Customer Profile</span>
            </div>
            <div className="preference-card active">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%' }}>
                <User size={14} color="var(--accent-primary)" />
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--sidebar-text)' }}>
                  {userProfile?.name || 'Authenticated Customer'}
                </span>
              </div>
              <span style={{ fontSize: '0.725rem', color: 'var(--sidebar-text-muted)', marginTop: '0.25rem', lineHeight: 1.4 }}>
                {prefSummary}
              </span>
            </div>
          </div>

          {/* Developer Mode Inspection Drawer */}
          {showDevMode && (
            <div style={{
              padding: '0.75rem',
              backgroundColor: 'rgba(0,0,0,0.15)',
              borderRadius: '8px',
              border: '1px solid var(--session-card-border)',
              fontSize: '0.7rem',
              color: 'var(--sidebar-text-muted)',
              marginBottom: '1rem'
            }}>
              <div style={{ fontWeight: 600, color: 'var(--accent-gold)', marginBottom: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Code2 size={12} />
                <span>Dev Mode: Customer Data Mapping</span>
              </div>
              <p>Database: <code>Supabase RLS Enforced</code></p>
              <ul style={{ paddingLeft: '1.2rem', marginTop: '0.25rem' }}>
                <li>Auth User ID → Mapped to Customer</li>
                <li>Internal ID → Hidden from UI</li>
              </ul>
            </div>
          )}
        </div>

        {/* Footer Settings & Logout */}
        <div style={{ borderTop: '1px solid var(--sidebar-border)', paddingTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button
            onClick={() => setShowDevMode(!showDevMode)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
            title="Toggle Developer Data Mapping"
          >
            <Settings size={16} color="var(--sidebar-text-muted)" />
            <span style={{ fontSize: '0.8rem', color: 'var(--sidebar-text-muted)' }}>CoffeeMind v1.0</span>
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button 
              onClick={toggleTheme}
              title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
              style={{
                padding: '0.45rem',
                borderRadius: '8px',
                backgroundColor: 'var(--session-card-bg)',
                border: '1px solid var(--session-card-border)',
                color: 'var(--sidebar-text)'
              }}
            >
              {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
            </button>
            <button 
              onClick={handleLogout}
              title="Sign Out"
              style={{
                padding: '0.45rem',
                borderRadius: '8px',
                backgroundColor: 'rgba(168, 63, 44, 0.1)',
                border: '1px solid var(--danger)',
                color: 'var(--danger)'
              }}
            >
              <LogOut size={16} />
            </button>
          </div>
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
              <span style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: 600 }}>● RAG-Grounded & Supabase Authenticated</span>
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
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem auto',
              boxShadow: '0 6px 20px rgba(184, 92, 44, 0.35)'
            }}>
              <Coffee size={28} color="#ffffff" />
            </div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              How can I curate your coffee today, {userProfile?.name || 'there'}?
            </h1>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', maxWidth: '550px', margin: '0.35rem auto 0 auto' }}>
              Handcrafted coffee knowledge grounded in our live menu, RAG data, and your authenticated preferences.
            </p>
          </div>

          {/* Quick Action Chips */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center', marginBottom: '1.5rem' }}>
            {QUICK_ACTIONS.map((act, i) => {
              const IconComp = act.icon;
              return (
                <button
                  key={i}
                  onClick={() => sendMessage(act.prompt)}
                  disabled={loading}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.45rem 0.85rem',
                    borderRadius: '20px',
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                    fontSize: '0.825rem',
                    fontWeight: 500,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <IconComp size={14} color="var(--accent-primary)" />
                  <span>{act.label}</span>
                </button>
              );
            })}
          </div>

          {/* Message List */}
          {messages.map((msg) => (
            <div
              key={msg.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
                alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                animation: 'fadeIn 0.25s ease'
              }}
            >
              <div
                style={{
                  padding: '0.9rem 1.1rem',
                  borderRadius: msg.sender === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  backgroundColor: msg.sender === 'user' ? 'var(--user-bubble)' : 'var(--bot-bubble)',
                  color: msg.sender === 'user' ? 'var(--user-text)' : 'var(--text-primary)',
                  border: msg.sender === 'user' ? 'none' : '1px solid var(--bot-border)',
                  boxShadow: 'var(--shadow-sm)',
                  fontSize: '0.925rem',
                  lineHeight: '1.55'
                }}
              >
                {msg.isError ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--danger)' }}>
                    <AlertTriangle size={18} />
                    <span>{msg.text}</span>
                  </div>
                ) : (
                  <div className="markdown-content">
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                  </div>
                )}
              </div>

              {/* Timestamp */}
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem', padding: '0 0.35rem' }}>
                {msg.timestamp}
              </span>

              {/* Recommendations Structured Cards */}
              {msg.recommendations && msg.recommendations.length > 0 && (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: '0.75rem',
                  width: '100%',
                  marginTop: '0.75rem'
                }}>
                  {msg.recommendations.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        backgroundColor: 'var(--bg-card)',
                        border: '1px solid var(--card-border)',
                        borderRadius: '12px',
                        padding: '1rem',
                        boxShadow: 'var(--shadow-sm)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <h4 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
                            {item.name}
                          </h4>
                          <span style={{
                            backgroundColor: 'rgba(184, 92, 44, 0.12)',
                            color: 'var(--accent-primary)',
                            fontWeight: 700,
                            fontSize: '0.85rem',
                            padding: '0.2rem 0.5rem',
                            borderRadius: '6px'
                          }}>
                            ₹{item.price_inr}
                          </span>
                        </div>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0.4rem 0' }}>
                          {item.description}
                        </p>
                      </div>

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.5rem' }}>
                        <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.4rem', borderRadius: '4px', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-muted)' }}>
                          {item.temperature}
                        </span>
                        <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.4rem', borderRadius: '4px', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-muted)' }}>
                          {item.milk}
                        </span>
                        <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.4rem', borderRadius: '4px', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-muted)' }}>
                          {item.sweetness} Sweet
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Typing Loading Indicator */}
          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem', padding: '0.5rem 0' }}>
              <Sparkles size={16} className="animate-spin" color="var(--accent-primary)" />
              <span>CoffeeMind is crafting a personalized recommendation...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div style={{
          padding: '1rem 1.5rem',
          backgroundColor: 'var(--bg-card)',
          borderTop: '1px solid var(--border-color)'
        }}>
          <div style={{
            maxWidth: '900px',
            margin: '0 auto',
            position: 'relative',
            display: 'flex',
            alignItems: 'center'
          }}>
            <textarea
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask CoffeeMind about drinks, prices, dietary options..."
              style={{
                width: '100%',
                padding: '0.85rem 3.25rem 0.85rem 1.1rem',
                borderRadius: '12px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                fontSize: '0.95rem',
                resize: 'none',
                outline: 'none',
                boxShadow: 'var(--shadow-sm)'
              }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              style={{
                position: 'absolute',
                right: '0.6rem',
                padding: '0.5rem',
                borderRadius: '8px',
                backgroundColor: input.trim() && !loading ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                color: input.trim() && !loading ? '#ffffff' : 'var(--text-muted)',
                cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s ease'
              }}
            >
              <Send size={18} />
            </button>
          </div>
        </div>

      </main>
    </div>
  );
}

