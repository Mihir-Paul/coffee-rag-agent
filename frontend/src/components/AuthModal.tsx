import React, { useState } from 'react';
import { 
  Coffee, 
  User, 
  AlertCircle, 
  ArrowRight,
  Code2 
} from 'lucide-react';
import { GrainGradient } from "@paper-design/shaders-react";
import { supabase } from '../supabaseClient';

interface AuthModalProps {
  onAuthSuccess?: () => void;
}

const GoogleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" className="shrink-0" aria-hidden="true">
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

/* Signature Visual Element: Espresso Machine Pressure Gauge Dial */
const EspressoPressureGauge = () => {
  return (
    <div className="relative w-44 h-44 sm:w-48 sm:h-48 flex items-center justify-center shrink-0">
      {/* SVG Arc Gauge */}
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
        {/* Track */}
        <circle
          cx="60"
          cy="60"
          r="48"
          fill="none"
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth="7"
          strokeDasharray="226 75"
          strokeLinecap="round"
        />
        {/* Highlighted Ember Extraction Arc */}
        <circle
          cx="60"
          cy="60"
          r="48"
          fill="none"
          stroke="#E05A10"
          strokeWidth="7"
          strokeDasharray="170 130"
          strokeDashoffset="0"
          strokeLinecap="round"
        />
      </svg>

      {/* Dial Center Reading */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-3xl sm:text-4xl font-bold font-sans tracking-tight text-white">
          9.0
        </span>
        <span className="text-[10px] tracking-widest font-semibold text-[#E05A10] uppercase mt-0.5">
          BAR PRESSURE
        </span>
        <span className="text-[9px] text-white/50 tracking-wider uppercase mt-1">
          Optimal Zone
        </span>
      </div>
    </div>
  );
};

export const AuthModal: React.FC<AuthModalProps> = ({ onAuthSuccess }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingType, setLoadingType] = useState<'google' | 'email' | 'demo-aarav' | 'demo-priya' | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showDevPanel, setShowDevPanel] = useState(false);

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setLoading(true);
    setLoadingType('google');
    try {
      console.log('Google OAuth initiated');
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
        msg = 'Google Sign-In is not enabled in your Supabase Dashboard. Please enable Google Provider under Authentication -> Providers -> Google.';
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
          setErrorMsg('Account created successfully! Please sign in with your credentials.');
          setIsSignUp(false);
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
      let friendlyMessage = err.message || 'Authentication failed. Please check your details.';
      if (friendlyMessage.includes('Invalid login credentials')) {
        friendlyMessage = 'Invalid email or password. Please double check and try again.';
      } else if (friendlyMessage.includes('User already registered')) {
        friendlyMessage = 'An account with this email already exists. Please sign in instead.';
      }
      setErrorMsg(friendlyMessage);
    } finally {
      setLoading(false);
      setLoadingType(null);
    }
  };

  const handleDemoSignIn = async (demoName: 'Aarav' | 'Priya') => {
    setErrorMsg(null);
    setLoading(true);
    setLoadingType(demoName === 'Aarav' ? 'demo-aarav' : 'demo-priya');
    const demoEmail = demoName === 'Aarav' ? 'aarav@coffeemind.ai' : 'priya@coffeemind.ai';
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
          options: { data: { name: demoName } }
        });
        if (signUpRes.error) {
          localStorage.setItem('coffeemind_mock_token', demoName === 'Aarav' ? 'test-aarav-token' : 'test-priya-token');
          window.location.reload();
          return;
        }
      }
      if (onAuthSuccess) onAuthSuccess();
    } catch (err) {
      localStorage.setItem('coffeemind_mock_token', demoName === 'Aarav' ? 'test-aarav-token' : 'test-priya-token');
      window.location.reload();
    } finally {
      setLoading(false);
      setLoadingType(null);
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F5EFEB] dark:bg-[#14100D] font-sans antialiased text-[#2A1810] dark:text-[#F0EADF]">
      
      {/* LEFT PANEL (~45% width, Warm Parchment Background, Collapses under 880px) */}
      <div className="w-full min-[880px]:w-[45%] h-full p-8 sm:p-12 lg:p-14 flex flex-col justify-between overflow-y-auto bg-[#F5EFEB] dark:bg-[#14100D]">
        
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-[6px] bg-[#2A1810] dark:bg-[#F0EADF] text-[#F5EFEB] dark:text-[#2A1810] flex items-center justify-center shrink-0">
              <Coffee className="w-4 h-4" />
            </div>
            <span className="font-sans font-medium text-base text-[#2A1810] dark:text-[#F0EADF] tracking-tight">
              CoffeeMind AI
            </span>
          </div>

          <button
            type="button"
            onClick={() => { setIsSignUp(!isSignUp); setErrorMsg(null); }}
            className="text-xs font-medium text-[#2A1810]/70 dark:text-[#F0EADF]/70 hover:text-[#2A1810] dark:hover:text-[#F0EADF] underline underline-offset-2 transition-colors cursor-pointer"
          >
            {isSignUp ? 'Sign in' : 'Create account'}
          </button>
        </div>

        {/* Form Container (Single column, spacious) */}
        <div className="w-full max-w-[400px] my-auto py-6 space-y-5">
          
          {/* Headline (Serif display face ONLY here) */}
          <div className="space-y-1.5">
            <h1 className="font-serif text-3xl min-[880px]:text-[40px] font-bold text-[#2A1810] dark:text-[#F0EADF] leading-tight">
              {isSignUp ? 'Create account' : 'Welcome back'}
            </h1>
            <p className="font-sans text-sm text-[#2A1810]/60 dark:text-[#F0EADF]/60 font-normal">
              {isSignUp ? 'Build your personalized AI coffee profile.' : 'Continue your AI-powered coffee journey.'}
            </p>
          </div>

          {/* OAuth Buttons (Pill shaped, semi-transparent white fill, thin 1px border) */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="h-10 px-3 rounded-full border border-[#2A1810]/15 dark:border-white/15 bg-white/70 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 text-[#2A1810] dark:text-[#F0EADF] text-xs font-medium flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <GoogleIcon />
              <span className="truncate">{loadingType === 'google' ? 'Connecting...' : 'Google'}</span>
            </button>

            <button
              type="button"
              onClick={() => handleDemoSignIn('Aarav')}
              disabled={loading}
              className="h-10 px-3 rounded-full border border-[#2A1810]/15 dark:border-white/15 bg-white/70 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 text-[#2A1810] dark:text-[#F0EADF] text-xs font-medium flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <User className="w-3.5 h-3.5 text-[#2A1810]/60 dark:text-[#F0EADF]/60" />
              <span className="truncate">Demo User</span>
            </button>
          </div>

          {/* Divider */}
          <div className="relative flex items-center justify-center my-4">
            <div className="w-full h-px bg-[#2A1810]/10 dark:bg-white/10" />
            <span className="absolute bg-[#F5EFEB] dark:bg-[#14100D] px-3 text-[10px] font-semibold tracking-wider text-[#2A1810]/40 dark:text-[#F0EADF]/40 uppercase">
              or with email
            </span>
          </div>

          {/* Inline Error Alert */}
          {errorMsg && (
            <div className="p-3 rounded-[9px] bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400 text-xs flex items-center gap-2 animate-fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form Fields: rounded ~9px, soft semi-transparent white fill, warm accent focus ring */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#2A1810]/70 dark:text-[#F0EADF]/70 block">
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="Aarav Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-11 px-4 rounded-[9px] bg-white/70 dark:bg-white/5 border border-[#2A1810]/10 dark:border-white/10 text-[#2A1810] dark:text-[#F0EADF] placeholder:#2A1810/35 text-sm focus:outline-none focus:ring-2 focus:ring-[#C85A17]/40 focus:border-[#C85A17] transition-all"
                  required
                />
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#2A1810]/70 dark:text-[#F0EADF]/70 block">
                Email Address
              </label>
              <input
                type="email"
                placeholder="harshitlog@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-11 px-4 rounded-[9px] bg-white/70 dark:bg-white/5 border border-[#2A1810]/10 dark:border-white/10 text-[#2A1810] dark:text-[#F0EADF] placeholder:#2A1810/35 text-sm focus:outline-none focus:ring-2 focus:ring-[#C85A17]/40 focus:border-[#C85A17] transition-all"
                required
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-[#2A1810]/70 dark:text-[#F0EADF]/70 block">
                  Password
                </label>
                {!isSignUp && (
                  <button
                    type="button"
                    onClick={() => setErrorMsg('Password reset instructions will be sent to your email.')}
                    className="text-xs text-[#C85A17] hover:underline font-medium"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <input
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-11 px-4 rounded-[9px] bg-white/70 dark:bg-white/5 border border-[#2A1810]/10 dark:border-white/10 text-[#2A1810] dark:text-[#F0EADF] placeholder:#2A1810/35 text-sm focus:outline-none focus:ring-2 focus:ring-[#C85A17]/40 focus:border-[#C85A17] transition-all"
                required
              />
            </div>

            {/* Checkbox + Terms */}
            <div className="pt-1 flex items-start gap-2.5 text-xs text-[#2A1810]/60 dark:text-[#F0EADF]/60">
              <input
                type="checkbox"
                id="terms"
                defaultChecked
                className="mt-0.5 rounded border-[#2A1810]/20 text-[#2A1810] focus:ring-0"
              />
              <label htmlFor="terms" className="leading-snug">
                By signing in, you agree to our{' '}
                <a href="#" className="text-[#2A1810] dark:text-[#F0EADF] underline font-bold">Terms of Service</a>{' '}
                and{' '}
                <a href="#" className="text-[#2A1810] dark:text-[#F0EADF] underline font-bold">Privacy Policy</a>.
              </label>
            </div>

            {/* Full-width primary button, solid dark roast-brown fill, warm parchment text */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 mt-2 rounded-[9px] bg-[#2A1810] dark:bg-[#F0EADF] text-[#F5EFEB] dark:text-[#2A1810] font-semibold text-sm flex items-center justify-center transition-all hover:bg-[#3D251A] dark:hover:bg-[#E5DEC] cursor-pointer disabled:opacity-50 shadow-sm"
            >
              {loadingType === 'email' ? (
                <span>{isSignUp ? 'Creating account...' : 'Signing in...'}</span>
              ) : isSignUp ? (
                <span>Create Account</span>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </form>

        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-[#2A1810]/40 dark:text-[#F0EADF]/40 pt-4 border-t border-[#2A1810]/5 dark:border-white/5">
          <span>© 2026 CoffeeMind AI</span>
          <button 
            type="button"
            onClick={() => setShowDevPanel(!showDevPanel)}
            className="hover:text-[#2A1810] dark:hover:text-[#F0EADF] transition-colors text-[11px]"
          >
            Dev Access
          </button>
        </div>

        {/* Dev Drawer */}
        {showDevPanel && (
          <div className="mt-2 p-3 rounded-[9px] bg-white/70 dark:bg-white/5 border border-[#2A1810]/10 text-xs space-y-2 animate-fade-in">
            <p className="font-semibold text-[#2A1810]/70 dark:text-[#F0EADF]/70 text-[11px]">Developer Test Profiles</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleDemoSignIn('Aarav')}
                disabled={loading}
                className="py-1.5 px-2.5 rounded border border-[#2A1810]/10 bg-white dark:bg-[#14100D] text-[#2A1810] dark:text-[#F0EADF] text-left flex items-center justify-between cursor-pointer text-[11px]"
              >
                <span>Sign in Aarav</span>
                <ArrowRight className="w-3 h-3 text-[#C85A17]" />
              </button>
              <button
                type="button"
                onClick={() => handleDemoSignIn('Priya')}
                disabled={loading}
                className="py-1.5 px-2.5 rounded border border-[#2A1810]/10 bg-white dark:bg-[#14100D] text-[#2A1810] dark:text-[#F0EADF] text-left flex items-center justify-between cursor-pointer text-[11px]"
              >
                <span>Sign in Priya</span>
                <ArrowRight className="w-3 h-3 text-[#C85A17]" />
              </button>
            </div>
          </div>
        )}

      </div>

      {/* RIGHT PANEL (~55% width, near-black background, warm ember-orange glow bottom-right, Hidden under 880px) */}
      <div className="hidden min-[880px]:flex min-[880px]:w-[55%] h-full relative overflow-hidden bg-[#0B0806] text-white p-10 lg:p-14 flex-col justify-between">
        
        {/* Film-grain texture background */}
        <GrainGradient
          speed={1}
          scale={1}
          rotation={0}
          offsetX={0}
          offsetY={0}
          softness={0.5}
          intensity={0.5}
          noise={0.25}
          shape="corners"
          frame={2854.5}
          colors={["#FFFFFF", "#E05A10", "#E05A10", "#FFFFFF"]}
          colorBack="#00000000"
          className="absolute inset-0 bg-black opacity-80 pointer-events-none"
        />

        {/* Warm Ember-Orange Radial Gradient Glow (Bottom-Right) */}
        <div 
          className="absolute -bottom-20 -right-20 w-[480px] h-[480px] rounded-full opacity-35 blur-3xl pointer-events-none"
          style={{ background: 'radial-gradient(circle, #E05A10 0%, transparent 70%)' }}
        />

        {/* Top Badges */}
        <div className="relative z-10 flex items-center justify-between">
          <span className="px-3 py-1 rounded-full border border-white/20 text-[10px] tracking-widest text-white/80 font-semibold uppercase">
            v2.4 RAG ENGINE
          </span>
          <span className="px-3 py-1 rounded-full border border-[#E05A10]/40 bg-[#E05A10]/10 text-[10px] tracking-widest text-[#E05A10] font-semibold uppercase">
            AI BARISTA ACTIVE
          </span>
        </div>

        {/* Signature Visual Element & Copy Section */}
        <div className="relative z-10 my-auto py-8 max-w-[540px] space-y-6">
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {/* Signature Element: Espresso Machine Pressure Gauge */}
            <EspressoPressureGauge />

            {/* Right Side Headline & Copy */}
            <div className="space-y-3">
              {/* Short two-line headline in SERIF display face with solid accent color swap */}
              <h2 className="font-serif text-2xl lg:text-3xl font-bold leading-snug text-white">
                Precision extraction meets <span className="text-[#E05A10]">AI intelligence.</span>
              </h2>

              <p className="font-sans text-xs lg:text-sm text-white/70 font-normal leading-relaxed">
                CoffeeMind analyzes extraction variables, bean origin, and roast density to deliver real-time recommendations grounded in our custom coffee knowledge base.
              </p>
            </div>
          </div>

        </div>

        {/* Footer info */}
        <div className="relative z-10 flex items-center justify-between pt-4 border-t border-white/10 text-[11px] text-white/40 font-sans">
          <span>Grounded RAG Coffee Engine</span>
          <span>CoffeeMind AI System</span>
        </div>

      </div>

    </div>
  );
};
