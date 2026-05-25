import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Briefcase, Trophy, TrendingUp, Search,
  ChevronDown, ChevronUp, ArrowLeft, Lock, Eye,
  EyeOff, Shield, LogOut, ShieldCheck, Trash2, UserMinus
} from 'lucide-react';
import { getAdminData, updateRound, deleteJob, deleteUser } from '../storage';
import { supabase } from '../supabaseClient';
import './AdminPage.css';

// ─── Admin credentials (hardcoded, separate from users) ───────────────────────
const ADMIN_PASSWORD = 'admin@2026';
const ADMIN_SESSION_KEY = 'jobstatus_admin_session';

// ─── Round Pill (Now Interactive for Admins!) ────────────────────────────────
function RoundPill({ round, jobId, onUpdateRound }) {
  const config = {
    passed:  { bg: '#D3F9E2', color: '#1A7D44', label: '✓ Pass' },
    failed:  { bg: '#FFE3E5', color: '#C53030', label: '✕ Fail' },
    pending: { bg: '#F0F4FF', color: '#6B7AB8', label: '○ Pending' },
  };
  const c = config[round.status];
  
  const cycleStatus = (e) => {
    e.stopPropagation();
    const nextStatus = {
      pending: 'passed',
      passed: 'failed',
      failed: 'pending',
    }[round.status];
    onUpdateRound(jobId, round.id, nextStatus);
  };

  return (
    <button
      className="admin-round-pill admin-round-pill--interactive"
      style={{ background: c.bg, color: c.color, border: 'none', cursor: 'pointer' }}
      onClick={cycleStatus}
      title="Click to cycle status (Pending -> Pass -> Fail)"
    >
      {round.name}: {c.label}
    </button>
  );
}

// ─── User Card ─────────────────────────────────────────────────────────────────
function UserCard({ user, index, onReload }) {
  const [expanded, setExpanded] = useState(false);
  const hired  = user.jobs.filter(j => j.status === 'hired').length;
  const active = user.jobs.filter(j => j.status === 'active').length;
  const offer  = user.jobs.filter(j => j.status === 'offer').length;
  const failed = user.jobs.filter(j => j.status === 'failed').length;

  const handleDeleteUser = (e) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to permanently delete user "${user.name}" and all their job tracking records? This cannot be undone.`)) {
      deleteUser(user.id);
      onReload();
    }
  };

  const handleDeleteJob = (jobId, company) => {
    if (window.confirm(`Remove application for "${company}"?`)) {
      deleteJob(jobId);
      onReload();
    }
  };

  const handleUpdateRound = (jobId, roundId, nextStatus) => {
    updateRound(jobId, roundId, nextStatus);
    onReload();
  };

  return (
    <motion.div
      className="admin-user-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
    >
      <div className="admin-user-header" onClick={() => setExpanded(e => !e)}>
        <div className="admin-user-left">
          <div className="admin-user-avatar">{user.name[0]}</div>
          <div>
            <div className="admin-user-name-row">
              <span className="admin-user-name">{user.name}</span>
              <button className="admin-delete-user-btn" onClick={handleDeleteUser} title="Delete User Account">
                <UserMinus size={14} />
              </button>
            </div>
            <div className="admin-user-email">{user.email}</div>
          </div>
        </div>

        <div className="admin-user-stats">
          <div className="admin-stat">
            <span className="admin-stat__val">{user.jobs.length}</span>
            <span className="admin-stat__lbl">Applications</span>
          </div>
          <div className="admin-stat">
            <span className="admin-stat__val" style={{ color: '#1A7D44' }}>{hired}</span>
            <span className="admin-stat__lbl">Hired</span>
          </div>
          <div className="admin-stat">
            <span className="admin-stat__val" style={{ color: '#F4A261' }}>{offer}</span>
            <span className="admin-stat__lbl">Offers</span>
          </div>
          <div className="admin-stat">
            <span className="admin-stat__val" style={{ color: '#DC2626' }}>{failed}</span>
            <span className="admin-stat__lbl">Failed</span>
          </div>
          <div className="admin-stat">
            <span className="admin-stat__val" style={{ color: '#6B7AB8' }}>{active}</span>
            <span className="admin-stat__lbl">Active</span>
          </div>
        </div>

        <button className="admin-expand-btn">
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
      </div>

      {expanded && (
        <motion.div
          className="admin-user-jobs"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          {user.jobs.length === 0 ? (
            <p className="admin-no-jobs">No applications yet.</p>
          ) : (
            user.jobs.map(job => (
              <div key={job.id} className={`admin-job-row admin-job-row--${job.status}`}>
                <div className="admin-job-row__left">
                  <div className="admin-job-avatar">
                    {job.status === 'hired' ? '🏆' : job.company[0]}
                  </div>
                  <div>
                    <div className="admin-job-company">{job.company}</div>
                    <div className="admin-job-role">{job.role}</div>
                  </div>
                </div>

                <div className="admin-job-rounds">
                  {job.rounds.map(r => (
                    <RoundPill
                      key={r.id}
                      round={r}
                      jobId={job.id}
                      onUpdateRound={handleUpdateRound}
                    />
                  ))}
                </div>

                <div className="admin-job-status-actions">
                  <div className="admin-job-status">
                    {job.status === 'hired' && <span className="admin-badge admin-badge--hired">🏆 Hired</span>}
                    {job.status === 'offer'  && <span className="admin-badge admin-badge--offer">🎉 Offer</span>}
                    {job.status === 'failed' && <span className="admin-badge admin-badge--failed">❌ Failed</span>}
                    {job.status === 'active' && <span className="admin-badge admin-badge--active">📋 Active</span>}
                  </div>
                  
                  <button
                    className="admin-delete-job-btn"
                    onClick={() => handleDeleteJob(job.id, job.company)}
                    title="Delete Application"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))
          )}
        </motion.div>
      )}
    </motion.div>
  );
}

// ─── Admin Dashboard ───────────────────────────────────────────────────────────
function AdminDashboard({ onLogout }) {
  const [search, setSearch] = useState('');
  const [adminData, setAdminData] = useState(null);
  const [loading, setLoading] = useState(true);

  const handleReload = async () => {
    try {
      const d = await getAdminData();
      setAdminData(d);
    } catch (err) {
      console.error("Failed to load admin stats:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleReload();

    // Subscribe to realtime database changes for instant update without refreshing
    const channel = supabase
      .channel('admin-realtime-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        handleReload();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'jobs' }, () => {
        handleReload();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rounds' }, () => {
        handleReload();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (loading || !adminData) {
    return (
      <div className="admin-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <span className="spinner" style={{ width: '40px', height: '40px', border: '3px solid rgba(200,16,46,0.15)', borderTopColor: 'var(--primary)' }} />
      </div>
    );
  }

  const filtered = adminData.users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const totalPassed = adminData.users.reduce((acc, u) =>
    acc + u.jobs.reduce((a, j) => a + j.rounds.filter(r => r.status === 'passed').length, 0), 0);

  return (
    <div className="admin-page">
      {/* Header */}
      <div className="admin-header">
        <div className="container admin-header__inner">
          <Link to="/" className="admin-back">
            <ArrowLeft size={16} /> Back to Site
          </Link>
          <div className="admin-logo">
            <span className="logo-icon">JS</span>
            <span>Admin Panel</span>
          </div>
          <div className="admin-header__right">
            <div className="admin-header__badge">
              <ShieldCheck size={14} /> Admin Authenticated
            </div>
            <button className="admin-logout-btn" onClick={onLogout} title="Logout from admin">
              <LogOut size={15} /> Logout
            </button>
          </div>
        </div>
      </div>

      <div className="container admin-body">
        {/* Summary Stats */}
        <div className="admin-stats-grid">
          {[
            { icon: Users,      label: 'Total Users',        value: adminData.users.length, color: '#4C6EF5' },
            { icon: Briefcase,  label: 'Total Applications', value: adminData.totalJobs,    color: '#F4A261' },
            { icon: Trophy,     label: 'Total Hired',        value: adminData.totalHired,   color: '#40C074' },
            { icon: TrendingUp, label: 'Rounds Passed',      value: totalPassed,       color: '#52B788' },
          ].map((s, i) => (
            <motion.div
              key={i}
              className="admin-stat-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <div className="admin-stat-icon" style={{ background: s.color + '18', color: s.color }}>
                <s.icon size={22} />
              </div>
              <div className="admin-stat-val">{s.value}</div>
              <div className="admin-stat-lbl">{s.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Search */}
        <div className="admin-search-bar">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* User Cards */}
        <div className="admin-section-label">
          All Registered Users ({filtered.length})
        </div>

        {filtered.length === 0 ? (
          <div className="admin-empty-state">
            <div className="admin-empty">
              <Users size={44} />
              <h3>Awaiting Candidates</h3>
              <p>No registered user accounts were found in your Supabase database.</p>
            </div>

            {/* Premium SQL Helper Card */}
            <motion.div 
              className="admin-sql-helper"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="admin-sql-helper__header">
                <ShieldCheck size={18} style={{ color: 'var(--primary)' }} />
                <span>Quick Setup: Enable Admin Global Read Access (Supabase RLS)</span>
              </div>
              <div className="admin-sql-helper__body">
                <p>
                  If you have already created users but they are not appearing here, it is because **Row-Level Security (RLS)** is active on your Supabase tables. 
                  To grant your Admin Panel read privileges, copy and run this quick script in your **Supabase SQL Editor**:
                </p>
                <div className="admin-sql-code-container">
                  <pre className="admin-sql-code">
{`-- 🔓 Run this in your Supabase SQL Editor to allow the Admin Dashboard to load all users & applications!

-- 1. Enable read access for public.profiles
DROP POLICY IF EXISTS "Allow select for everyone" ON public.profiles;
CREATE POLICY "Allow select for everyone" ON public.profiles FOR SELECT USING (true);

-- 2. Enable read access for public.jobs
DROP POLICY IF EXISTS "Allow select for everyone" ON public.jobs;
CREATE POLICY "Allow select for everyone" ON public.jobs FOR SELECT USING (true);

-- 3. Enable read access for public.rounds
DROP POLICY IF EXISTS "Allow select for everyone" ON public.rounds;
CREATE POLICY "Allow select for everyone" ON public.rounds FOR SELECT USING (true);`}
                  </pre>
                </div>
                <div className="admin-sql-tip">
                  <strong>💡 Easy Alternative (for testing):</strong> You can also disable RLS completely for your demo by running:
                  <code style={{ display: 'block', marginTop: '6px', background: 'rgba(200,16,46,0.06)', padding: '6px 10px', borderRadius: '4px', color: 'var(--primary-dark)', fontSize: '0.82rem' }}>
                    ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
                  </code>
                </div>
              </div>
            </motion.div>
          </div>
        ) : (
          <div className="admin-users-list">
            {filtered.map((user, i) => (
              <UserCard key={user.id} user={user} index={i} onReload={handleReload} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Admin Login Screen ────────────────────────────────────────────────────────
function AdminLogin({ onSuccess }) {
  const [password, setPassword]   = useState('');
  const [showPass, setShowPass]   = useState(false);
  const [error, setError]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [shake, setShake]         = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      if (password === ADMIN_PASSWORD) {
        sessionStorage.setItem(ADMIN_SESSION_KEY, 'true');
        onSuccess();
      } else {
        setError('Incorrect admin password. Please try again.');
        setShake(true);
        setTimeout(() => setShake(false), 500);
      }
      setLoading(false);
    }, 600);
  };

  return (
    <div className="admin-login-page">
      {/* Background */}
      <div className="admin-login-bg">
        <div className="admin-login-blob admin-login-blob--1" />
        <div className="admin-login-blob admin-login-blob--2" />
        <div className="admin-login-grid" />
      </div>

      <Link to="/" className="admin-login-back">
        <ArrowLeft size={16} /> Back to Site
      </Link>

      <motion.div
        className={`admin-login-card ${shake ? 'admin-login-card--shake' : ''}`}
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        {/* Shield icon */}
        <motion.div
          className="admin-login-icon"
          animate={{ rotate: [0, -5, 5, 0] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
        >
          <Shield size={32} />
        </motion.div>

        <h1>Admin Access</h1>
        <p className="admin-login-subtitle">
          This area is restricted. Enter the admin password to continue.
        </p>

        <form onSubmit={handleSubmit} className="admin-login-form">
          <div className="admin-pw-field">
            <Lock size={16} className="admin-pw-icon" />
            <input
              type={showPass ? 'text' : 'password'}
              placeholder="Enter admin password"
              value={password}
              onChange={e => { setPassword(e.target.value); setError(''); }}
              autoFocus
              required
            />
            <button type="button" className="admin-pw-toggle" onClick={() => setShowPass(p => !p)}>
              {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                className="admin-login-error"
                initial={{ opacity: 0, y: -8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0 }}
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <button type="submit" className="admin-login-btn" disabled={loading}>
            {loading
              ? <span className="spinner" />
              : <><ShieldCheck size={16} /> Enter Admin Panel</>
            }
          </button>
        </form>
      </motion.div>
    </div>
  );
}

// ─── Main Export ───────────────────────────────────────────────────────────────
export default function AdminPage() {
  const [authed, setAuthed] = useState(
    () => sessionStorage.getItem(ADMIN_SESSION_KEY) === 'true'
  );

  const handleLogout = () => {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    setAuthed(false);
  };

  return (
    <AnimatePresence mode="wait">
      {!authed
        ? <AdminLogin key="login" onSuccess={() => setAuthed(true)} />
        : <AdminDashboard key="dashboard" onLogout={handleLogout} />
      }
    </AnimatePresence>
  );
}
