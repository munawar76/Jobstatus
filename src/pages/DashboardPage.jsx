import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ReactConfetti from 'react-confetti';
import {
  Plus, Trash2, LogOut, CheckCircle, XCircle, Clock,
  Building2, ChevronRight, Briefcase, X, Check, Trophy,
  Sparkles, AlertCircle, Edit3, MoreVertical
} from 'lucide-react';
import {
  getUserJobs, createJob, updateRound, addRound,
  deleteRound, markHired, deleteJob, updateJob
} from '../storage';
import { useAuth } from '../context/AuthContext';
import './DashboardPage.css';

// ---- Round Status Button ----
function RoundCard({ round, jobId, onUpdate, onDelete }) {
  const [animating, setAnimating] = useState(null);

  const handleStatus = (status) => {
    setAnimating(status);
    setTimeout(() => {
      onUpdate(jobId, round.id, status);
      setAnimating(null);
    }, 400);
  };

  const statusConfig = {
    passed: { label: 'Passed', bg: '#D3F9E2', border: '#40C074', text: '#1A7D44', icon: <CheckCircle size={16} /> },
    failed: { label: 'Failed', bg: '#FFE3E5', border: '#E63946', text: '#C53030', icon: <XCircle size={16} /> },
    pending: { label: 'Pending', bg: '#F0F4FF', border: '#A0AABF', text: '#6B7AB8', icon: <Clock size={16} /> },
  };

  const s = statusConfig[round.status];

  return (
    <motion.div
      className={`round-card round-card--${round.status} ${animating ? `round-card--animating-${animating}` : ''}`}
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      style={{ background: s.bg, borderColor: s.border + '50' }}
    >
      <div className="round-card__left">
        <span className="round-card__icon" style={{ color: s.text, background: s.border + '20' }}>
          {s.icon}
        </span>
        <div>
          <span className="round-card__name">{round.name}</span>
          <span className="round-card__status" style={{ color: s.text }}>{s.label}</span>
        </div>
      </div>

      <div className="round-card__actions">
        <motion.button
          className={`round-btn round-btn--pass ${round.status === 'passed' ? 'round-btn--active-pass' : ''}`}
          whileTap={{ scale: 0.9 }}
          whileHover={{ scale: 1.08 }}
          onClick={() => handleStatus(round.status === 'passed' ? 'pending' : 'passed')}
          title="Mark as Passed"
        >
          <Check size={15} />
          <span>Pass</span>
          {round.status === 'passed' && (
            <motion.span
              className="ripple-ring"
              initial={{ scale: 0.8, opacity: 0.7 }}
              animate={{ scale: 2, opacity: 0 }}
              transition={{ duration: 0.6 }}
            />
          )}
        </motion.button>

        <motion.button
          className={`round-btn round-btn--fail ${round.status === 'failed' ? 'round-btn--active-fail' : ''}`}
          whileTap={{ scale: 0.9 }}
          whileHover={{ scale: 1.08 }}
          onClick={() => handleStatus(round.status === 'failed' ? 'pending' : 'failed')}
          title="Mark as Failed"
        >
          <X size={15} />
          <span>Fail</span>
          {round.status === 'failed' && (
            <motion.div className="shake-indicator" />
          )}
        </motion.button>

        <motion.button
          className="round-btn round-btn--delete"
          whileTap={{ scale: 0.9 }}
          onClick={() => onDelete(jobId, round.id)}
          title="Remove round"
        >
          <Trash2 size={13} />
        </motion.button>
      </div>
    </motion.div>
  );
}

// ---- Add Job Modal ----
function AddJobModal({ onClose, onAdd }) {
  const [form, setForm] = useState({ company: '', role: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => { onAdd(form); setLoading(false); }, 400);
  };

  return (
    <motion.div
      className="modal-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="modal"
        initial={{ opacity: 0, scale: 0.85, y: 40 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.85, y: 40 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        onClick={e => e.stopPropagation()}
      >
        <div className="modal__header">
          <h3>Add New Application</h3>
          <button className="modal-close" onClick={onClose}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="modal__body">
          <div className="field">
            <label>Company Name</label>
            <div className="field-input">
              <Building2 size={16} className="field-icon" />
              <input
                type="text"
                placeholder="e.g. Google, Amazon..."
                value={form.company}
                onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
                required
                autoFocus
              />
            </div>
          </div>

          <div className="field">
            <label>Role / Position</label>
            <div className="field-input">
              <Briefcase size={16} className="field-icon" />
              <input
                type="text"
                placeholder="e.g. Senior React Developer"
                value={form.role}
                onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                required
              />
            </div>
          </div>

          <p className="modal-note">
            <AlertCircle size={13} /> Round 1, Round 2, and Client Round will be added automatically.
          </p>

          <div className="modal__footer">
            <button type="button" className="btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="auth-submit modal-submit" disabled={loading}>
              {loading ? <span className="spinner" /> : <><Plus size={16} /> Add Application</>}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

import { useState as useLocalState } from 'react';

// ---- Offer Popup ----
function OfferPopup({ job, onHired, onCustomStatus, onClose }) {
  const [showCustomInput, setShowCustomInput] = useLocalState(false);
  const [customReason, setCustomReason] = useLocalState('');

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (!customReason.trim()) return;
    onCustomStatus(job.id, customReason.trim());
  };

  return (
    <motion.div
      className="modal-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="offer-popup"
        initial={{ opacity: 0, scale: 0.7, y: 60 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.7 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      >
        <motion.div
          className="offer-emoji"
          animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
          transition={{ duration: 1, delay: 0.3 }}
        >
          🎉
        </motion.div>
        <h2>All Rounds Cleared!</h2>
        <p>You've passed every interview round at <strong>{job.company}</strong>!</p>

        {!showCustomInput ? (
          <div className="offer-choices">
            <button className="offer-btn offer-btn--hired" onClick={() => onHired(job.id)}>
              <Trophy size={18} /> Got the Job!
            </button>
            <button className="offer-btn offer-btn--waiting" onClick={onClose}>
              <Clock size={18} /> Waiting for Offer Letter
            </button>
            <button className="offer-btn offer-btn--custom" onClick={() => setShowCustomInput(true)}>
              <Edit3 size={18} /> Custom Status / Reason
            </button>
          </div>
        ) : (
          <form onSubmit={handleCustomSubmit} className="offer-custom-form">
            <p className="custom-input-label">Enter custom status or reason:</p>
            <input
              type="text"
              placeholder="e.g. Declined Offer, Low Budget, Cancelled..."
              value={customReason}
              onChange={e => setCustomReason(e.target.value)}
              required
              autoFocus
            />
            <div className="offer-custom-actions">
              <button type="submit" className="custom-save-btn">Save Status</button>
              <button type="button" className="custom-cancel-btn" onClick={() => setShowCustomInput(false)}>Cancel</button>
            </div>
          </form>
        )}
      </motion.div>
    </motion.div>
  );
}

// ---- Hired Celebration ----
function HiredCelebration({ job, onClose }) {
  const [wh, setWh] = useState({ w: window.innerWidth, h: window.innerHeight });

  useEffect(() => {
    const handler = () => setWh({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  return (
    <div className="hired-celebration">
      <ReactConfetti
        width={wh.w} height={wh.h}
        numberOfPieces={300}
        recycle={false}
        colors={['#52B788', '#40C074', '#FFD60A', '#F4A261', '#2D6A4F', '#ffffff']}
      />
      <motion.div
        className="hired-card"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 18 }}
      >
        <motion.div
          className="hired-trophy"
          animate={{ y: [0, -15, 0], rotate: [0, 5, -5, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          🏆
        </motion.div>
        <h1>Congratulations!</h1>
        <p>You got the job at</p>
        <h2>{job.company}</h2>
        <p className="hired-role">{job.role}</p>
        <motion.div
          className="hired-stars"
          animate={{ opacity: [1, 0.5, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          ⭐ ⭐ ⭐ ⭐ ⭐
        </motion.div>
        <button className="hired-close" onClick={onClose}>
          <Sparkles size={16} /> Continue to Dashboard
        </button>
      </motion.div>
    </div>
  );
}

// ---- Main Dashboard ----
export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [offerJob, setOfferJob] = useState(null);
  const [hiredJob, setHiredJob] = useState(null);
  const [newRoundName, setNewRoundName] = useState('');
  const [addingRound, setAddingRound] = useState(false);
  const [prevOfferStatus, setPrevOfferStatus] = useState({});
  const [notesText, setNotesText] = useState('');
  const [savingNotes, setSavingNotes] = useState('idle');
  const [debounceTimeout, setDebounceTimeout] = useState(null);

  // Sync editor value when selection changes
  const selectedJob = jobs.find(j => j.id === selectedJobId);

  useEffect(() => {
    if (selectedJob) {
      setNotesText(selectedJob.notes || '');
      setSavingNotes('idle');
    } else {
      setNotesText('');
    }
  }, [selectedJobId]);

  const handleNotesChange = (e) => {
    const text = e.target.value;
    setNotesText(text);
    setSavingNotes('saving');

    if (debounceTimeout) clearTimeout(debounceTimeout);

    const timeout = setTimeout(async () => {
      if (!selectedJobId) return;
      try {
        await updateJob(selectedJobId, { notes: text });
        setSavingNotes('saved');
        const j = await getUserJobs(user.id);
        setJobs(j);
      } catch (err) {
        console.error("Failed to auto-save notes:", err);
        setSavingNotes('error');
      }
    }, 800);

    setDebounceTimeout(timeout);
  };

  const loadJobs = useCallback(async () => {
    try {
      const j = await getUserJobs(user.id);
      setJobs(j);

      // Check for new "offer" status
      setPrevOfferStatus(prev => {
        j.forEach(job => {
          if (job.status === 'offer' && prev[job.id] !== 'offer') {
            setOfferJob(job);
          }
        });
        const statusMap = {};
        j.forEach(j2 => { statusMap[j2.id] = j2.status; });
        return statusMap;
      });
    } catch (err) {
      console.error("Failed to load jobs:", err);
    }
  }, [user.id]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  const handleAddJob = async ({ company, role }) => {
    try {
      const job = await createJob({ userId: user.id, company, role });
      await loadJobs();
      setSelectedJobId(job.id);
      setShowAddModal(false);
    } catch (err) {
      console.error("Failed to add job:", err);
    }
  };

  const handleUpdateRound = async (jobId, roundId, status) => {
    try {
      await updateRound(jobId, roundId, status);
      // Reload and check for offer
      const updatedJobs = await getUserJobs(user.id);
      setJobs(updatedJobs);
      const updatedJob = updatedJobs.find(j => j.id === jobId);
      if (updatedJob?.status === 'offer') {
        setOfferJob(updatedJob);
      }
    } catch (err) {
      console.error("Failed to update round:", err);
    }
  };

  const handleDeleteRound = async (jobId, roundId) => {
    try {
      await deleteRound(jobId, roundId);
      await loadJobs();
    } catch (err) {
      console.error("Failed to delete round:", err);
    }
  };

  const handleAddRound = async (e) => {
    e.preventDefault();
    if (!newRoundName.trim() || !selectedJobId) return;
    try {
      await addRound(selectedJobId, newRoundName.trim());
      setNewRoundName('');
      setAddingRound(false);
      await loadJobs();
    } catch (err) {
      console.error("Failed to add custom round:", err);
    }
  };

  const handleMarkHired = async (jobId) => {
    try {
      await markHired(jobId);
      const job = jobs.find(j => j.id === jobId);
      await loadJobs();
      setOfferJob(null);
      setHiredJob(job);
    } catch (err) {
      console.error("Failed to mark hired:", err);
    }
  };

  const handleCustomStatus = async (jobId, customStatusText) => {
    try {
      const job = jobs.find(j => j.id === jobId);
      const updatedNotes = `[Outcome: ${customStatusText}]\n\n` + (job?.notes || '');
      await updateJob(jobId, { status: customStatusText, notes: updatedNotes });
      await loadJobs();
      setOfferJob(null);
    } catch (err) {
      console.error("Failed to save custom status:", err);
    }
  };

  const handleDeleteJob = async (jobId) => {
    if (!window.confirm('Remove this application?')) return;
    try {
      await deleteJob(jobId);
      if (selectedJobId === jobId) setSelectedJobId(null);
      await loadJobs();
    } catch (err) {
      console.error("Failed to delete job:", err);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (err) {
      console.error("Failed to logout:", err);
    }
  };

  const statusIcon = (status) => {
    if (status === 'hired') return '🏆';
    if (status === 'offer') return '🎉';
    const passed = jobs.find(j => j.id)?.rounds?.filter(r => r.status === 'passed').length;
    return '📋';
  };

  const getJobStatusBadge = (job) => {
    if (job.status === 'hired') return { label: 'Hired!', cls: 'badge--hired' };
    if (job.status === 'offer') return { label: 'Offer!', cls: 'badge--offer' };
    if (job.status === 'failed') return { label: 'Failed', cls: 'badge--fail' };
    if (job.status !== 'active') return { label: job.status, cls: 'badge--fail' };
    const passed = job.rounds.filter(r => r.status === 'passed').length;
    if (passed > 0) return { label: `${passed}/${job.rounds.length} done`, cls: 'badge--progress' };
    return { label: 'Not started', cls: 'badge--pending' };
  };

  return (
    <div className="dashboard">
      {/* ---- SIDEBAR ---- */}
      <aside className="sidebar">
        <div className="sidebar__header">
          <Link to="/" className="sidebar-logo">
            <span className="logo-icon">JS</span>
            <span>JobStatus</span>
          </Link>
        </div>

        <div className="sidebar__user">
          <div className="user-avatar">{user.name[0].toUpperCase()}</div>
          <div>
            <div className="user-name">{user.name}</div>
            <div className="user-email">{user.email}</div>
          </div>
        </div>

        <button className="add-job-btn" onClick={() => setShowAddModal(true)}>
          <Plus size={18} /> New Application
        </button>

        <div className="sidebar__jobs">
          <div className="sidebar__section-label">
            Applications ({jobs.length})
          </div>

          {jobs.length === 0 && (
            <div className="sidebar__empty">
              <Briefcase size={28} />
              <p>No applications yet.<br />Add your first one!</p>
            </div>
          )}

          <AnimatePresence>
            {jobs.map(job => {
              const badge = getJobStatusBadge(job);
              return (
                <motion.button
                  key={job.id}
                  className={`job-item ${selectedJobId === job.id ? 'job-item--active' : ''} ${job.status === 'hired' ? 'job-item--hired' : ''}`}
                  onClick={() => setSelectedJobId(job.id)}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  layout
                >
                  <div className="job-item__avatar">
                    {job.status === 'hired' ? '🏆' : job.company[0]}
                  </div>
                  <div className="job-item__info">
                    <div className="job-item__company">{job.company}</div>
                    <div className="job-item__role">{job.role}</div>
                  </div>
                  <span className={`badge ${badge.cls}`}>{badge.label}</span>
                </motion.button>
              );
            })}
          </AnimatePresence>
        </div>

        <button className="logout-btn" onClick={handleLogout}>
          <LogOut size={16} /> Logout
        </button>
      </aside>

      {/* ---- MAIN CONTENT ---- */}
      <main className="dashboard-main">
        <AnimatePresence mode="wait">
          {!selectedJob ? (
            jobs.length === 0 ? (
              <motion.div
                key="empty"
                className="dashboard-empty"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <div className="empty-icon">📋</div>
                <h2>Select an application</h2>
                <p>Choose a company from the sidebar, or add a new application to get started.</p>
                <button className="btn-hero-primary" onClick={() => setShowAddModal(true)}>
                  <Plus size={18} /> Add Your First Application
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="summary-dashboard"
                className="summary-dashboard"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              >
                {/* Dashboard Greeting Header */}
                <div className="summary-dashboard__header">
                  <h1>Hello, {user.name}! 🚀</h1>
                  <p>Welcome back. Here is your overall job application pipeline at a glance.</p>
                </div>

                {/* Metric Summary Cards Grid */}
                <div className="summary-dashboard__stats">
                  <div className="summary-stat-card summary-stat-card--total">
                    <div className="summary-stat-icon">📝</div>
                    <div className="summary-stat-value">{jobs.length}</div>
                    <div className="summary-stat-label">Total Applied</div>
                  </div>
                  <div className="summary-stat-card summary-stat-card--active">
                    <div className="summary-stat-icon">📋</div>
                    <div className="summary-stat-value">
                      {jobs.filter(j => j.status === 'active' || j.status === 'offer').length}
                    </div>
                    <div className="summary-stat-label">In Progress</div>
                  </div>
                  <div className="summary-stat-card summary-stat-card--success">
                    <div className="summary-stat-icon">🏆</div>
                    <div className="summary-stat-value">
                      {jobs.filter(j => j.status === 'hired').length}
                    </div>
                    <div className="summary-stat-label">Offers & Hired</div>
                  </div>
                  <div className="summary-stat-card summary-stat-card--closed">
                    <div className="summary-stat-icon">✕</div>
                    <div className="summary-stat-value">
                      {jobs.filter(j => j.status === 'failed' || (j.status !== 'active' && j.status !== 'offer' && j.status !== 'hired')).length}
                    </div>
                    <div className="summary-stat-label">Closed / Rejected</div>
                  </div>
                </div>

                {/* Master Overview Table Card */}
                <div className="summary-dashboard__table-card">
                  <div className="summary-table-header">
                    <h3>Master Application Summary</h3>
                    <span className="summary-table-badge">All Applications</span>
                  </div>
                  <div className="summary-table-wrapper">
                    <table className="summary-table">
                      <thead>
                        <tr>
                          <th>Company</th>
                          <th>Target Role</th>
                          <th>Interview Progress</th>
                          <th>Current Status</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {jobs.map(job => {
                          const badge = getJobStatusBadge(job);
                          const passedRounds = job.rounds.filter(r => r.status === 'passed').length;
                          return (
                            <tr key={job.id} onClick={() => setSelectedJobId(job.id)} className="summary-table-row-clickable">
                              <td className="company-cell">
                                <div className="company-logo-avatar">{job.company[0].toUpperCase()}</div>
                                <strong>{job.company}</strong>
                              </td>
                              <td className="role-cell">{job.role}</td>
                              <td>
                                <div className="table-rounds-progress">
                                  <span className="progress-text">{passedRounds}/{job.rounds.length} passed</span>
                                  <div className="progress-bar-bg">
                                    <div 
                                      className="progress-bar-fill" 
                                      style={{ width: `${(passedRounds / job.rounds.length) * 100}%` }}
                                    />
                                  </div>
                                </div>
                              </td>
                              <td>
                                <span className={`badge ${badge.cls}`}>{badge.label}</span>
                              </td>
                              <td>
                                <button 
                                  className="table-action-view" 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedJobId(job.id);
                                  }}
                                >
                                  View Pipeline →
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )
          ) : (
            <motion.div
              key={selectedJob.id}
              className="job-detail"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.3 }}
            >
              {/* Job Header */}
              <div className="job-detail__header">
                <div className="job-header-left">
                  <div className="job-detail__avatar">
                    {selectedJob.status === 'hired' ? '🏆' : selectedJob.company[0]}
                  </div>
                  <div>
                    <h1 className="job-detail__company">{selectedJob.company}</h1>
                    <p className="job-detail__role">{selectedJob.role}</p>
                  </div>
                </div>

                <div className="job-header-right">
                  {selectedJob.status === 'hired' && (
                    <motion.div
                      className="hired-status-badge"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring' }}
                    >
                      🏆 Hired!
                    </motion.div>
                  )}
                  {selectedJob.status === 'offer' && (
                    <motion.div
                      className="offer-status-badge"
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      🎉 Offer Received!
                    </motion.div>
                  )}
                  {selectedJob.status === 'failed' && (
                    <motion.div
                       className="failed-status-badge"
                       initial={{ scale: 0 }}
                       animate={{ scale: 1 }}
                       transition={{ type: 'spring' }}
                    >
                      ❌ Process Ended
                    </motion.div>
                  )}
                  {selectedJob.status !== 'active' && selectedJob.status !== 'hired' && selectedJob.status !== 'offer' && selectedJob.status !== 'failed' && (
                    <motion.div
                       className="failed-status-badge"
                       initial={{ scale: 0 }}
                       animate={{ scale: 1 }}
                       transition={{ type: 'spring' }}
                       style={{ background: 'var(--surface-2)', color: 'var(--text-light)', border: '1px solid var(--border)' }}
                    >
                      ⚙️ {selectedJob.status}
                    </motion.div>
                  )}
                  <button
                    className="delete-job-btn"
                    onClick={() => handleDeleteJob(selectedJob.id)}
                    title="Delete this application"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* If hired → show celebration card */}
              {selectedJob.status === 'hired' && (
                <motion.div
                  className="hired-inline-card"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <span className="hired-inline-emoji">🎊</span>
                  <div>
                    <strong>You got the job!</strong>
                    <p>Congratulations on landing this role at {selectedJob.company}!</p>
                  </div>
                </motion.div>
              )}

              {/* Offer waiting card */}
              {selectedJob.status === 'offer' && (
                <motion.div
                  className="offer-inline-card"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <span>⏳</span>
                  <div>
                    <strong>Waiting for offer letter</strong>
                    <p>All rounds cleared! Mark as hired once you receive the offer.</p>
                  </div>
                  <button className="mark-hired-btn" onClick={() => handleMarkHired(selectedJob.id)}>
                    <Trophy size={14} /> Mark as Hired!
                  </button>
                </motion.div>
              )}

              {/* Failed inline card */}
              {selectedJob.status === 'failed' && (
                <motion.div
                  className="failed-inline-card"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <span>💔</span>
                  <div>
                    <strong>Process Ended (Failed Round)</strong>
                    <p>One or more rounds failed. Don't worry, the next opportunity is just around the corner!</p>
                  </div>
                </motion.div>
              )}

              {/* Custom status inline card */}
              {selectedJob.status !== 'active' && selectedJob.status !== 'hired' && selectedJob.status !== 'offer' && selectedJob.status !== 'failed' && (
                <motion.div
                  className="failed-inline-card"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}
                >
                  <span style={{ filter: 'grayscale(0.2)' }}>💡</span>
                  <div>
                    <strong>Custom Outcome: {selectedJob.status}</strong>
                    <p>You recorded a custom outcome for this application. You can review details or write your thoughts below!</p>
                  </div>
                </motion.div>
              )}

              {/* Rounds Section */}
              <div className="rounds-section">
                <div className="rounds-header">
                  <h3>Interview Rounds</h3>
                  <span className="rounds-count">
                    {selectedJob.rounds.filter(r => r.status === 'passed').length}/{selectedJob.rounds.length} passed
                  </span>
                </div>

                {/* Progress */}
                <div className="rounds-progress">
                  <motion.div
                    className="rounds-progress__fill"
                    initial={{ width: 0 }}
                    animate={{
                      width: `${(selectedJob.rounds.filter(r => r.status === 'passed').length / selectedJob.rounds.length) * 100}%`
                    }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                  />
                </div>

                <AnimatePresence>
                  {selectedJob.rounds.map(round => (
                    <RoundCard
                      key={round.id}
                      round={round}
                      jobId={selectedJob.id}
                      onUpdate={handleUpdateRound}
                      onDelete={handleDeleteRound}
                    />
                  ))}
                </AnimatePresence>

                {/* Add Round */}
                <div className="add-round-section">
                  {!addingRound ? (
                    <button className="add-round-btn" onClick={() => setAddingRound(true)}>
                      <Plus size={16} /> Add Custom Round
                    </button>
                  ) : (
                    <motion.form
                      className="add-round-form"
                      onSubmit={handleAddRound}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <input
                        type="text"
                        placeholder="Round name (e.g. HR Round, Technical Test...)"
                        value={newRoundName}
                        onChange={e => setNewRoundName(e.target.value)}
                        autoFocus
                      />
                      <button type="submit" className="round-add-confirm">
                        <Check size={16} />
                      </button>
                      <button type="button" className="round-add-cancel" onClick={() => { setAddingRound(false); setNewRoundName(''); }}>
                        <X size={16} />
                      </button>
                    </motion.form>
                  )}
                </div>
              </div>

              {/* Interview Diary & Thoughts Section — Premium Auto-saving card */}
              <div className="notes-section">
                <div className="notes-header">
                  <div className="notes-title-row">
                    <h3>📝 Interview Diary & Thoughts</h3>
                    <div className="saving-indicator">
                      {savingNotes === 'saving' && (
                        <span className="saving-status saving-status--saving">
                          <span className="pulse-dot" /> Saving...
                        </span>
                      )}
                      {savingNotes === 'saved' && (
                        <span className="saving-status saving-status--saved">
                          <Check size={12} /> Saved to cloud
                        </span>
                      )}
                      {savingNotes === 'error' && (
                        <span className="saving-status saving-status--error">
                          <AlertCircle size={12} /> Save error
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="notes-subtitle">
                    Share your thoughts, document what went well, what went wrong, or key questions asked so you can review them.
                  </p>
                </div>
                <textarea
                  className="notes-textarea"
                  value={notesText}
                  onChange={handleNotesChange}
                  placeholder="Share your interview experience... What questions did they ask? What went right? What went wrong? Documenting your thoughts helps you learn and share insights easily!"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* ---- MODALS ---- */}
      <AnimatePresence>
        {showAddModal && (
          <AddJobModal
            onClose={() => setShowAddModal(false)}
            onAdd={handleAddJob}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {offerJob && !hiredJob && (
          <OfferPopup
            job={offerJob}
            onHired={handleMarkHired}
            onCustomStatus={handleCustomStatus}
            onClose={() => setOfferJob(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {hiredJob && (
          <HiredCelebration
            job={hiredJob}
            onClose={() => setHiredJob(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
