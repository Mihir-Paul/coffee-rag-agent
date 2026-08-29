import React, { useState } from 'react';
import { Coffee, AlertCircle, User, ArrowLeft } from 'lucide-react';
import { supabase } from '../supabaseClient';

interface AuthModalProps {
  onAuthSuccess?: () => void;
  onBackToLanding?: () => void;
}

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" style={{ flexShrink: 0 }} aria-hidden="true">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
    />
  </svg>
);

export const AuthModal: React.FC<AuthModalProps> = ({ onAuthSuccess, onBackToLanding }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingType, setLoadingType] = useState<'google' | 'email' | 'demo' | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setLoading(true);
    setLoadingType('google');
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (err: any) {
      console.error('Google Sign-In error:', err);
      let msg = err.message || 'Google Sign-In failed.';
      if (msg.includes('provider is not enabled') || msg.includes('Unsupported provider')) {
        msg = 'Google Sign-In is currently disabled on Supabase setup. Try Demo Guest mode instead!';
      }
      setErrorMsg(msg);
    } finally {
      setLoading(false);
      setLoadingType(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email || !password || (isSignUp && !name)) {
      setErrorMsg('Please complete all required fields.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    setLoadingType('email');

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { name: name.trim() }
          }
        });

        if (error) throw error;

        if (data.session) {
          if (onAuthSuccess) onAuthSuccess();
        } else {
          setErrorMsg('Account created successfully! Please sign in.');
          setIsSignUp(false);
          setShowEmailForm(true);
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (error) throw error;
        if (onAuthSuccess) onAuthSuccess();
      }
    } catch (err: any) {
      console.error('Supabase Auth error:', err);
      let friendlyMessage = err.message || 'Authentication failed. Please check your credentials.';
      if (friendlyMessage.includes('Invalid login credentials')) {
        friendlyMessage = 'Invalid email or password. Please try again.';
      } else if (friendlyMessage.includes('User already registered')) {
        friendlyMessage = 'An account with this email already exists. Please sign in.';
      }
      setErrorMsg(friendlyMessage);
    } finally {
      setLoading(false);
      setLoadingType(null);
    }
  };

  const handleDemoSignIn = async () => {
    setErrorMsg(null);
    setLoading(true);
    setLoadingType('demo');
    const demoEmail = 'aarav@coffeemind.ai';
    const demoPass = 'coffeemind123';

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: demoEmail,
        password: demoPass
      });

      if (error) {
        const signUpRes = await supabase.auth.signUp({
          email: demoEmail,
          password: demoPass,
          options: { data: { name: 'Aarav' } }
        });
        if (signUpRes.error) {
          localStorage.setItem('coffeemind_mock_token', 'test-aarav-token');
          window.location.reload();
          return;
        }
      }
      if (onAuthSuccess) onAuthSuccess();
    } catch (err) {
      localStorage.setItem('coffeemind_mock_token', 'test-aarav-token');
      window.location.reload();
    } finally {
      setLoading(false);
      setLoadingType(null);
    }
  };

  return (
    <div className="auth-page-bg">
      <div className="auth-card-container">
        
        {/* LEFT CARD — SIGN-IN (Fit in 100vh) */}
        <div className="auth-left-card">
          
          {onBackToLanding && (
            <button
              type="button"
              onClick={onBackToLanding}
              style={{
                position: 'absolute',
                top: 'clamp(20px, 3.5vh, 36px)',
                left: 'clamp(20px, 3.5vh, 36px)',
                fontFamily: "'Inter', sans-serif",
                fontSize: '12px',
                fontWeight: 600,
                color: '#d9a441',
                backgroundColor: 'rgba(217, 164, 65, 0.12)',
                border: '1px solid rgba(217, 164, 65, 0.3)',
                borderRadius: '8px',
                padding: '4px 10px',
                cursor: 'pointer',
                zIndex: 10,
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <ArrowLeft size={13} />
              <span>Back to Home</span>
            </button>
          )}

          {/* Plain underlined text link, absolute top-right corner */}
          <button
            type="button"
            onClick={() => { 
              setIsSignUp(!isSignUp); 
              setErrorMsg(null); 
              setShowEmailForm(false); 
            }}
            style={{
              position: 'absolute',
              top: 'clamp(20px, 3.5vh, 36px)',
              right: 'clamp(20px, 3.5vh, 36px)',
              fontFamily: "'Inter', sans-serif",
              fontSize: '12px',
              fontWeight: 500,
              color: '#f2e8da',
              textDecoration: 'underline',
              textUnderlineOffset: '4px',
              backgroundColor: 'transparent',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              zIndex: 10
            }}
          >
            {isSignUp ? 'Sign in' : 'Create account'}
          </button>

          {/* TOP ROW: Icon tile + wordmark "CoffeeMind" & "AI BARISTA" tag */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: 'clamp(20px, 3.5vh, 36px)' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '11px',
              backgroundColor: '#271e17',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Coffee size={19} color="#f2e8da" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: '17px', letterSpacing: '-0.02em', color: '#f2e8da', lineHeight: 1.2 }}>
                CoffeeMind
              </span>
              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '10px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#d9a441', marginTop: '2px', lineHeight: 1 }}>
                AI BARISTA
              </span>
            </div>
          </div>

          {/* MAIN STACKED CONTENT AREA (Top-anchored) */}
          <div style={{ width: '100%', maxWidth: '400px' }}>
            
            {/* HEADLINE: BOLD SANS-SERIF (~32px), tight letter-spacing */}
            <div style={{ marginBottom: 'clamp(14px, 2.2vh, 22px)' }}>
              <h1 style={{ fontFamily: "'Inter', sans-serif", fontSize: 'clamp(26px, 3.8vh, 33px)', fontWeight: 800, color: '#f2e8da', lineHeight: 1.12, letterSpacing: '-0.03em', margin: '0 0 8px 0' }}>
                {isSignUp ? 'Create account' : 'Welcome back'}
              </h1>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 'clamp(12px, 1.6vh, 14px)', color: '#a99a8c', lineHeight: 1.45, margin: 0, maxWidth: '400px' }}>
                {isSignUp 
                  ? 'Join CoffeeMind AI to unlock personalized roasts and custom espresso taste profiles.' 
                  : 'Sign in to access your custom roast preferences and personalized AI coffee recommendations.'}
              </p>
            </div>

            {/* ERROR ALERT */}
            {errorMsg && (
              <div style={{
                padding: '10px 14px',
                borderRadius: '12px',
                backgroundColor: 'rgba(127, 29, 29, 0.4)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#fecaca',
                fontFamily: "'Inter', sans-serif",
                fontSize: '12px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
                marginBottom: '16px'
              }}>
                <AlertCircle size={15} color="#f87171" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* DEFAULT UNCLUTTERED VIEW: BUTTONS ONLY */}
            {!showEmailForm ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(10px, 1.5vh, 14px)' }}>
                
                {/* 1. PRIMARY BUTTON: Full-width pill, min-height 44px, solid cream surface, dark text */}
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  style={{
                    width: '100%',
                    maxWidth: '400px',
                    minHeight: '44px',
                    padding: '10px 20px',
                    borderRadius: '999px',
                    backgroundColor: '#f2e8da',
                    color: '#1b140f',
                    fontWeight: 700,
                    fontSize: '13px',
                    fontFamily: "'Inter', sans-serif",
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    border: 'none',
                    boxSizing: 'border-box',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                    appearance: 'none',
                    WebkitAppearance: 'none'
                  }}
                >
                  {loading && loadingType === 'google' ? (
                    <div style={{ width: '16px', height: '16px', border: '2px solid #1b140f', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                  ) : (
                    <GoogleIcon />
                  )}
                  <span style={{ color: '#1b140f', fontWeight: 700 }}>Continue with Google</span>
                </button>

                {/* 2. SECONDARY BUTTON: Full-width pill, min-height 44px, visible 1.5px dashed border & subtle bg */}
                <button
                  type="button"
                  onClick={handleDemoSignIn}
                  disabled={loading}
                  style={{
                    width: '100%',
                    maxWidth: '400px',
                    minHeight: '44px',
                    padding: '10px 20px',
                    borderRadius: '999px',
                    backgroundColor: 'rgba(255, 255, 255, 0.04)',
                    border: '1.5px dashed rgba(242, 232, 218, 0.35)',
                    color: '#f2e8da',
                    fontWeight: 500,
                    fontSize: '13px',
                    fontFamily: "'Inter', sans-serif",
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    boxSizing: 'border-box',
                    cursor: 'pointer',
                    appearance: 'none',
                    WebkitAppearance: 'none'
                  }}
                >
                  {loading && loadingType === 'demo' ? (
                    <div style={{ width: '15px', height: '15px', border: '2px solid #f2e8da', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                  ) : (
                    <User size={15} color="#a99a8c" />
                  )}
                  <span style={{ color: '#f2e8da', fontWeight: 500 }}>Continue as Guest (Demo Mode)</span>
                </button>

                {/* PLAIN THIN HAIRLINE DIVIDER below buttons */}
                <div style={{ margin: 'clamp(10px, 1.8vh, 16px) 0', width: '100%', maxWidth: '400px' }}>
                  <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', width: '100%' }} />
                </div>

                {/* CENTERED PILL BADGE below divider */}
                <div style={{ display: 'flex', justifyContent: 'center', width: '100%', maxWidth: '400px' }}>
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '5px 14px',
                    borderRadius: '999px',
                    backgroundColor: 'rgba(217, 164, 65, 0.12)',
                    border: '1px solid rgba(217, 164, 65, 0.35)',
                    color: '#d9a441',
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '10.5px',
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase'
                  }}>
                    <span style={{ fontSize: '11px' }}>☕</span>
                    <span>RAG-GROUNDED · V2.4</span>
                  </div>
                </div>

              </div>
            ) : (
              /* INLINE EMAIL FORM VIEW */
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingTop: '2px' }}>
                {isSignUp && (
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 500, color: '#a99a8c', marginBottom: '3px' }}>Full Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Alex Morgan"
                      required
                      style={{
                        width: '100%',
                        padding: '10px 16px',
                        borderRadius: '999px',
                        backgroundColor: 'rgba(255, 255, 255, 0.04)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        color: '#f2e8da',
                        fontSize: '13px',
                        minHeight: '44px',
                        boxSizing: 'border-box',
                        outline: 'none'
                      }}
                    />
                  </div>
                )}
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 500, color: '#a99a8c', marginBottom: '3px' }}>Email address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="barista@coffeemind.ai"
                    required
                    style={{
                      width: '100%',
                      padding: '10px 16px',
                      borderRadius: '999px',
                      backgroundColor: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      color: '#f2e8da',
                      fontSize: '13px',
                      minHeight: '44px',
                      boxSizing: 'border-box',
                      outline: 'none'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 500, color: '#a99a8c', marginBottom: '3px' }}>Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    style={{
                      width: '100%',
                      padding: '10px 16px',
                      borderRadius: '999px',
                      backgroundColor: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      color: '#f2e8da',
                      fontSize: '13px',
                      minHeight: '44px',
                      boxSizing: 'border-box',
                      outline: 'none'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '8px', paddingTop: '4px' }}>
                  <button
                    type="button"
                    onClick={() => setShowEmailForm(false)}
                    style={{
                      width: '33%',
                      minHeight: '44px',
                      padding: '10px',
                      borderRadius: '999px',
                      backgroundColor: 'transparent',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      color: '#a99a8c',
                      fontSize: '12px',
                      fontWeight: 500,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px',
                      cursor: 'pointer'
                    }}
                  >
                    <ArrowLeft size={13} />
                    <span>Back</span>
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      width: '67%',
                      minHeight: '44px',
                      padding: '10px',
                      borderRadius: '999px',
                      backgroundColor: '#f2e8da',
                      color: '#1b140f',
                      fontSize: '13px',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    {loading && loadingType === 'email' ? 'Processing...' : (isSignUp ? 'Create Account' : 'Sign In')}
                  </button>
                </div>
              </form>
            )}

          </div>

        </div>

        {/* RIGHT CARD — REAL PHOTOGRAPHY (Fit in 100vh) */}
        <div className="auth-right-card">
          
          {/* Full-bleed café photograph background */}
          <img
            src="/cafe_hero.jpg"
            alt="Specialty Café Espresso Bar"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center'
            }}
          />

          {/* Dark gradient overlay top-to-bottom */}
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to bottom, rgba(13, 10, 8, 0.88) 0%, rgba(13, 10, 8, 0.35) 40%, rgba(13, 10, 8, 0.92) 100%)',
            pointerEvents: 'none'
          }} />

          {/* TOP-LEFT: Partner credential tile */}
          <div style={{
            position: 'relative',
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            backgroundColor: 'rgba(13, 10, 8, 0.65)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            padding: '8px 14px 8px 8px',
            borderRadius: '14px',
            width: 'fit-content'
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '10px',
              backgroundColor: '#271e17',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Coffee size={16} color="#f2e8da" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: '13px', color: '#f2e8da', lineHeight: 1.2 }}>
                Artisan Roast Lab
              </span>
              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', color: '#a99a8c', lineHeight: 1.2, marginTop: '2px' }}>
                San Francisco, CA • Verified Partner ✓
              </span>
            </div>
          </div>

          {/* MIDDLE: Testimonial Pull-Quote */}
          <div style={{
            position: 'relative',
            zIndex: 10,
            maxWidth: '420px',
            marginTop: 'clamp(16px, 3.5vh, 32px)',
            marginBottom: '12px'
          }}>
            <blockquote style={{
              fontFamily: "'Fraunces', serif",
              fontSize: 'clamp(18px, 2.8vh, 24px)',
              lineHeight: '1.25',
              color: '#f2e8da',
              fontWeight: 400,
              margin: 0,
              letterSpacing: '-0.01em',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}>
              “CoffeeMind's RAG recommendation engine boosted our specialty bean sales by 34%. It understands our daily roast notes better than our best baristas.”
            </blockquote>
            <p style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '10.5px',
              fontWeight: 600,
              color: '#a99a8c',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginTop: '10px'
            }}>
              — Marcus Vance, Founder & Head Roaster
            </p>
          </div>

          {/* FLOATING IN BOTTOM-RIGHT CORNER: Compact Browser Mockup Card */}
          <div style={{
            position: 'absolute',
            bottom: 'clamp(16px, 2.5vh, 24px)',
            right: 'clamp(16px, 2.5vh, 24px)',
            zIndex: 20,
            width: 'clamp(220px, 23vw, 265px)',
            borderRadius: '14px',
            backgroundColor: '#1b140f',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.85)',
            overflow: 'hidden'
          }}>
            {/* macOS Header */}
            <div style={{
              height: '26px',
              padding: '0 10px',
              backgroundColor: '#130e0a',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <div style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#ff5f56' }} />
                <div style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#ffbd2e' }} />
                <div style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#27c93f' }} />
              </div>
              <div style={{
                padding: '1px 8px',
                borderRadius: '5px',
                backgroundColor: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                fontSize: '8.5px',
                color: '#a99a8c',
                fontFamily: "'Inter', sans-serif"
              }}>
                coffeemind.ai/chat
              </div>
              <div style={{ width: '20px' }} />
            </div>

            {/* Dashboard Preview */}
            <div style={{ position: 'relative', aspectRatio: '16 / 10', overflow: 'hidden', backgroundColor: '#0d0a08' }}>
              <img
                src="/app_preview.jpg"
                alt="CoffeeMind AI Barista App Preview"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
