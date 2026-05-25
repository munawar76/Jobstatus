import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, ArrowLeft, CheckCircle, X, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './AuthPage.css';

// Password strength rules
const RULES = [
  { id: 'len',   label: 'At least 8 characters',      test: (p) => p.length >= 8 },
  { id: 'upper', label: 'One uppercase letter (A–Z)',  test: (p) => /[A-Z]/.test(p) },
  { id: 'lower', label: 'One lowercase letter (a–z)',  test: (p) => /[a-z]/.test(p) },
  { id: 'spec',  label: 'One special character (!@#$…)', test: (p) => /[^A-Za-z0-9]/.test(p) },
];

function PasswordStrength({ password }) {
  if (!password) return null;
  return (
    <motion.div
      className="pw-rules"
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
    >
      {RULES.map(r => {
        const ok = r.test(password);
        return (
          <div key={r.id} className={`pw-rule ${ok ? 'pw-rule--ok' : 'pw-rule--fail'}`}>
            {ok ? <Check size={12} /> : <X size={12} />}
            <span>{r.label}</span>
          </div>
        );
      })}
    </motion.div>
  );
}

const slide = {
  hidden:  { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.28 } },
  exit:    { opacity: 0, y: -10, transition: { duration: 0.18 } },
};

export default function AuthPage() {
  const [tab, setTab]           = useState('login');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');
  const { login, register, resetPassword } = useAuth();
  const navigate   = useNavigate();

  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const set = (k) => (e) => { setForm(f => ({ ...f, [k]: e.target.value })); setError(''); };

  const passwordValid = () => RULES.every(r => r.test(form.password));

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    if (!passwordValid()) {
      setError('Password does not meet all requirements.');
      setLoading(false);
      return;
    }
    try {
      await register(form.name, form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccess('');
    try {
      await resetPassword(form.email);
      setSuccess('Password reset link sent — check your inbox.');
    } catch (err) {
      setError(err.message || 'Failed to send password reset email.');
    } finally {
      setLoading(false);
    }
  };

  const switchTab = (t) => { setTab(t); setError(''); setSuccess(''); setForm({ name:'', email:'', password:'' }); };

  return (
    <div className="auth-page">
      <div className="auth-bg">
        <div className="auth-grid" />
        <div className="auth-blob auth-blob--1" />
        <div className="auth-blob auth-blob--2" />
        <div className="auth-blob auth-blob--3" />
        <div className="auth-noise" />
      </div>

      <Link to="/" className="auth-back"><ArrowLeft size={15} /> Back</Link>

      <motion.div
        className="auth-card"
        initial={{ opacity: 0, y: 36, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Logo */}
        <Link to="/" className="auth-logo">
          <span className="logo-box">JS</span>
          <span className="logo-name">JobStatus</span>
        </Link>

        {/* Tab bar */}
        {tab !== 'forgot' && (
          <div className="auth-tabs" role="tablist">
            {['login','register'].map(t => (
              <button
                key={t} role="tab"
                className={`auth-tab ${tab === t ? 'auth-tab--on' : ''}`}
                onClick={() => switchTab(t)}
              >
                {t === 'login' ? 'Sign in' : 'Create account'}
              </button>
            ))}
          </div>
        )}

        <AnimatePresence mode="wait">

          {/* ──────── LOGIN ──────── */}
          {tab === 'login' && (
            <motion.form key="login" variants={slide} initial="hidden" animate="visible" exit="exit"
              onSubmit={handleLogin} className="auth-form" autoComplete="off">

              <div className="auth-heading">
                <h1>Welcome back</h1>
                <p>Sign in to your account</p>
              </div>

              <div className="field">
                <label htmlFor="login-email">Email address</label>
                <input id="login-email" type="email" value={form.email}
                  onChange={set('email')} required autoComplete="email" />
              </div>

              <div className="field">
                <div className="field-label-row">
                  <label htmlFor="login-pw">Password</label>
                  <button type="button" className="forgot-link" onClick={() => switchTab('forgot')}>
                    Forgot password?
                  </button>
                </div>
                <div className="field-pw">
                  <input id="login-pw" type={showPass ? 'text' : 'password'}
                    value={form.password} onChange={set('password')} required autoComplete="current-password" />
                  <button type="button" className="pw-eye" onClick={() => setShowPass(p => !p)}
                    aria-label={showPass ? 'Hide password' : 'Show password'}>
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {error && (
                <motion.p className="auth-error" initial={{ opacity:0 }} animate={{ opacity:1 }}>
                  {error}
                </motion.p>
              )}

              <button type="submit" className="auth-submit" disabled={loading}>
                {loading ? <span className="spinner" /> : 'Sign In'}
              </button>
            </motion.form>
          )}

          {/* ──────── REGISTER ──────── */}
          {tab === 'register' && (
            <motion.form key="register" variants={slide} initial="hidden" animate="visible" exit="exit"
              onSubmit={handleRegister} className="auth-form" autoComplete="off">

              <div className="auth-heading">
                <h1>Get started</h1>
                <p>Create your free account</p>
              </div>

              <div className="field">
                <label htmlFor="reg-name">Full name</label>
                <input id="reg-name" type="text" value={form.name}
                  onChange={set('name')} required autoComplete="name" />
              </div>

              <div className="field">
                <label htmlFor="reg-email">Email address</label>
                <input id="reg-email" type="email" value={form.email}
                  onChange={set('email')} required autoComplete="email" />
              </div>

              <div className="field">
                <label htmlFor="reg-pw">Password</label>
                <div className="field-pw">
                  <input id="reg-pw" type={showPass ? 'text' : 'password'}
                    value={form.password} onChange={set('password')} required autoComplete="new-password" />
                  <button type="button" className="pw-eye" onClick={() => setShowPass(p => !p)}
                    aria-label={showPass ? 'Hide' : 'Show'}>
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                <AnimatePresence>
                  {form.password && <PasswordStrength password={form.password} />}
                </AnimatePresence>
              </div>

              {error && (
                <motion.p className="auth-error" initial={{ opacity:0 }} animate={{ opacity:1 }}>
                  {error}
                </motion.p>
              )}

              <button type="submit" className="auth-submit"
                disabled={loading || (form.password && !passwordValid())}>
                {loading ? <span className="spinner" /> : 'Create Account'}
              </button>
            </motion.form>
          )}

          {/* ──────── FORGOT ──────── */}
          {tab === 'forgot' && (
            <motion.form key="forgot" variants={slide} initial="hidden" animate="visible" exit="exit"
              onSubmit={handleForgot} className="auth-form">

              <div className="auth-heading">
                <h1>Reset password</h1>
                <p>Enter your email and we'll send a reset link</p>
              </div>

              <div className="field">
                <label htmlFor="forgot-email">Email address</label>
                <input id="forgot-email" type="email" value={form.email}
                  onChange={set('email')} required autoComplete="email" />
              </div>

              {error   && <motion.p className="auth-error"   initial={{opacity:0}} animate={{opacity:1}}>{error}</motion.p>}
              {success && (
                <motion.div className="auth-success" initial={{opacity:0,scale:0.96}} animate={{opacity:1,scale:1}}>
                  <CheckCircle size={16} /> {success}
                </motion.div>
              )}

              <button type="submit" className="auth-submit" disabled={loading}>
                {loading ? <span className="spinner" /> : 'Send Reset Link'}
              </button>

              <button type="button" className="auth-back-link" onClick={() => switchTab('login')}>
                ← Back to sign in
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
