'use client';

import React, { useState, useEffect } from 'react';
import { db } from '../../../lib/db';
import { 
  ShieldAlert, 
  Lock, 
  Unlock, 
  RefreshCw, 
  Sliders, 
  FileSpreadsheet,
  AlertTriangle,
  UserCheck,
  CheckCircle,
  Eye,
  EyeOff,
  Activity,
  Search,
  Bell,
  Settings,
  Compass
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid 
} from 'recharts';

export default function AdminDashboard() {
  const [positions, setPositions] = useState([]);
  const [officials, setOfficials] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Transfer Tool State
  const [transferPosId, setTransferPosId] = useState('');
  const [transferNewOfficialId, setTransferNewOfficialId] = useState('');
  const [carryHistory, setCarryHistory] = useState(false);
  const [transferReason, setTransferReason] = useState('');
  const [transferMessage, setTransferMessage] = useState('');

  // Override Engine State
  const [overridePosId, setOverridePosId] = useState('');
  const [isFrozen, setIsFrozen] = useState(false);
  const [isOverridden, setIsOverridden] = useState(false);
  const [overrideScore, setOverrideScore] = useState('5.0');
  const [overrideReason, setOverrideReason] = useState('');
  const [overrideMessage, setOverrideMessage] = useState('');

  // Live Anomaly & Moderation Queue
  const [anomalies, setAnomalies] = useState([]);
  const [reportedReviews, setReportedReviews] = useState([]);

  // Data Loading
  const loadData = async () => {
    setLoading(true);
    const posData = await db.getLiveScores();
    setPositions(posData);

    const officialData = await db.getOfficials();
    setOfficials(officialData);

    const logData = await db.getAdminLogs();
    setAuditLogs(logData);

    // Dynamic mock anomalies
    const anomalyAlerts = [
      { id: 1, posTitle: 'Superintendent of Police Pune', rateCount: 8, timeWindow: '2 mins', risk: 'HIGH', desc: 'Suspicious IP rating velocity detected (8 ratings within 120s).' },
      { id: 2, posTitle: 'District Collector Wayanad', rateCount: 5, timeWindow: '5 mins', risk: 'MEDIUM', desc: 'Slight rise in review traffic.' }
    ];
    setAnomalies(anomalyAlerts);

    // Mock reported reviews for moderations queue
    const queue = [
      { id: 1, position: 'PWD Minister Kerala', reviewer: 'hash_user_6', text: 'Utterly corrupt, has been taking cuts on every road contract. Needs to be removed!', reason: 'Flagged for non-factual personal attack' },
      { id: 2, position: 'Superintendent of Police Pune', reviewer: 'hash_user_4', text: 'Police is slow and bad. SP is a useless bureaucrat.', reason: 'Flagged for profanity/offensive language' }
    ];
    setReportedReviews(queue);

    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Sync details in form when override selection changes
  useEffect(() => {
    if (overridePosId) {
      const selected = positions.find(p => p.position_id === parseInt(overridePosId));
      if (selected) {
        setIsFrozen(selected.is_frozen || false);
        setIsOverridden(selected.is_overridden || false);
        setOverrideScore(selected.override_score !== null ? String(selected.override_score) : '5.0');
      }
    }
  }, [overridePosId, positions]);

  // Execute Transfer Action
  const handleTransferSubmit = async (e) => {
    e.preventDefault();
    if (!transferPosId || !transferNewOfficialId || !transferReason.trim()) {
      setTransferMessage('❌ All fields are required to execute a transfer.');
      return;
    }

    const res = await db.executeTransfer(
      parseInt(transferPosId),
      transferNewOfficialId,
      carryHistory,
      transferReason,
      'admin_user_dev_01'
    );

    if (res.success) {
      setTransferMessage('✅ Officer transfer executed and logged in audit trail!');
      setTransferReason('');
      loadData();
    } else {
      setTransferMessage(`❌ Error: ${res.error}`);
    }
  };

  // Execute Override Action
  const handleOverrideSubmit = async (e) => {
    e.preventDefault();
    if (!overridePosId || !overrideReason.trim()) {
      setOverrideMessage('❌ Select a position and provide an override justification.');
      return;
    }

    const posId = parseInt(overridePosId);
    
    // 1. Save Freeze State if toggled
    await db.toggleFreeze(posId, isFrozen, overrideReason, 'admin_user_dev_01');

    // 2. Save Override Score if toggled
    const res = await db.applyOverride(
      posId,
      isOverridden,
      parseFloat(overrideScore),
      overrideReason,
      'admin_user_dev_01'
    );

    if (res.success) {
      setOverrideMessage('✅ Intervention settings updated and logged!');
      setOverrideReason('');
      loadData();
    } else {
      setOverrideMessage(`❌ Error: ${res.error}`);
    }
  };

  // Moderator actions on reviews queue
  const handleModerateReview = (reviewId, approved) => {
    setReportedReviews(prev => prev.filter(item => item.id !== reviewId));
  };

  // Recharts Chart Data Formatting
  const chartData = positions.map(p => ({
    name: p.position_title.split(' ').slice(-2).join(' '), // short name for x-axis
    Score: p.display_rating || 0,
    Ratings: p.total_ratings_count
  }));

  return (
    <div className="admin-dashboard-layout">
      
      {/* 1. Sidebar Navigation panel */}
      <aside className="admin-sidebar">
        <div className="sidebar-brand">
          ⚖️ <span>SARKARDADA</span>
        </div>

        <div className="sidebar-profile">
          <div className="profile-avatar">RC</div>
          <div className="profile-info">
            <span className="profile-name">Ryan Crawford</span>
            <span className="profile-role">Portal Chief (Pro)</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <a href="#" className="sidebar-link active">
            <Activity size={16} /> Dashboard
          </a>
          <a href="/" className="sidebar-link">
            <Compass size={16} /> Directory Grid
          </a>
          <a href="#intervention" className="sidebar-link">
            <Sliders size={16} /> Interventions
          </a>
          <a href="#ledger" className="sidebar-link">
            <FileSpreadsheet size={16} /> Audit Trail
          </a>
        </nav>

        <div className="sidebar-status-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
            <strong style={{ fontSize: '0.8rem', color: '#ffffff' }}>System Online</strong>
          </div>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0 }}>
            Supabase DB sync active.
          </p>
        </div>
      </aside>

      {/* 2. Main Workspace */}
      <main className="admin-main">
        
        {/* Top Navigation Bar */}
        <div className="admin-top-nav">
          <div className="admin-search-bar">
            <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              className="admin-search-input" 
              placeholder="Search audit trail, positions..." 
            />
          </div>

          <div className="admin-top-actions">
            <button 
              onClick={loadData} 
              className="btn btn-secondary" 
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.5rem 1rem', fontSize: '0.85rem' }}
            >
              <RefreshCw size={14} className={loading ? 'spin-anim' : ''} /> Sync Live
            </button>
            
            {/* Bell Alerts with notifications dot */}
            <div style={{ position: 'relative', cursor: 'pointer', padding: '0.25rem', color: 'var(--text-secondary)' }}>
              <Bell size={18} />
              {reportedReviews.length > 0 && (
                <span style={{ position: 'absolute', top: 0, right: 0, width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-red)' }}></span>
              )}
            </div>

            <div style={{ cursor: 'pointer', padding: '0.25rem', color: 'var(--text-secondary)' }}>
              <Settings size={18} />
            </div>
          </div>
        </div>

        {/* Header Title block */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            CMS Console Dashboard
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '0.15rem' }}>
            Officer integrity audit logs, transfer mappings, and citizen report intervention systems.
          </p>
        </div>

        {/* 3. Stat widget cards row */}
        <div className="stakent-cards-grid">
          
          {/* Card 1: Directory */}
          <div className="stakent-stat-card">
            <div className="stakent-card-header">
              <span>Public Directory</span>
              <Activity size={14} style={{ color: 'var(--accent-blue)' }} />
            </div>
            <div>
              <div className="stakent-card-value">{positions.length}</div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.15rem 0 0 0' }}>Tracked Positions</p>
            </div>
            <div className="stakent-card-footer">
              <span className="stakent-trend-pill positive">
                +4.8% 📈
              </span>
              <svg viewBox="0 0 100 30" style={{ width: '80px', height: '24px', stroke: '#10b981', strokeWidth: 2, fill: 'none' }}>
                <path d="M0,25 Q15,10 30,20 T60,5 T90,15 T100,10" />
              </svg>
            </div>
          </div>

          {/* Card 2: Interventions */}
          <div className="stakent-stat-card">
            <div className="stakent-card-header">
              <span>Active Interventions</span>
              <Sliders size={14} style={{ color: 'var(--accent-gold)' }} />
            </div>
            <div>
              <div className="stakent-card-value">
                {positions.filter(p => p.is_frozen || p.is_overridden).length}
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.15rem 0 0 0' }}>Moderated / Locked Profiles</p>
            </div>
            <div className="stakent-card-footer">
              <span className="stakent-trend-pill neutral">
                Stable 🔒
              </span>
              <svg viewBox="0 0 100 30" style={{ width: '80px', height: '24px', stroke: '#f59e0b', strokeWidth: 2, fill: 'none' }}>
                <path d="M0,15 Q20,10 40,25 T80,10 T100,15" />
              </svg>
            </div>
          </div>

          {/* Card 3: Reported */}
          <div className="stakent-stat-card">
            <div className="stakent-card-header">
              <span>Report Moderation</span>
              <AlertTriangle size={14} style={{ color: 'var(--accent-red)' }} />
            </div>
            <div>
              <div className="stakent-card-value">{reportedReviews.length}</div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.15rem 0 0 0' }}>Flagged Review Feed</p>
            </div>
            <div className="stakent-card-footer">
              <span className={`stakent-trend-pill ${reportedReviews.length > 0 ? 'negative' : 'positive'}`}>
                {reportedReviews.length > 0 ? 'Action Req.' : 'Clean ✓'}
              </span>
              <svg viewBox="0 0 100 30" style={{ width: '80px', height: '24px', stroke: '#ef4444', strokeWidth: 2, fill: 'none' }}>
                <path d="M0,20 Q25,5 50,25 T75,10 T100,30" />
              </svg>
            </div>
          </div>

        </div>

        {/* 4. Dashboard Grid Workspace */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
            <p>Connecting to secure administration database...</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '2rem' }} className="admin-grid-two-col">
            
            {/* Left Column: Form Tools */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              
              {/* Form 1: Officer Transfer */}
              <div className="glass-card" style={{ background: '#0e0d1a', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 'var(--radius-lg)' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <UserCheck size={18} style={{ color: 'var(--accent-blue)' }} /> Incumbent Officer Transfer & Mapping Desk
                </h3>
                
                <form onSubmit={handleTransferSubmit}>
                  <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label className="form-label">Target Position Desk</label>
                    <select 
                      className="form-select" 
                      style={{ width: '100%', padding: '0.65rem' }}
                      value={transferPosId} 
                      onChange={(e) => setTransferPosId(e.target.value)}
                    >
                      <option value="">-- Choose Position --</option>
                      {positions.map(p => (
                        <option key={p.position_id} value={p.position_id}>
                          {p.position_title} (Current: {p.current_official_name})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label className="form-label">Assign New Incumbent Official</label>
                    <select 
                      className="form-select" 
                      style={{ width: '100%', padding: '0.65rem' }}
                      value={transferNewOfficialId} 
                      onChange={(e) => setTransferNewOfficialId(e.target.value)}
                    >
                      <option value="">-- Select New Official --</option>
                      {officials.map(o => (
                        <option key={o.id} value={o.id}>
                          {o.first_name} {o.last_name} ({o.service_cadre} - {o.batch_year || 'N/A'})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group" style={{ margin: '1rem 0' }}>
                    <div className="switch-container" onClick={() => setCarryHistory(!carryHistory)}>
                      <div className={`switch-track ${carryHistory ? 'active' : ''}`}>
                        <div className="switch-thumb"></div>
                      </div>
                      <span className="form-label" style={{ cursor: 'pointer', fontSize: '0.85rem' }}>Carry rating history with the individual officer</span>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      If disabled, previous review history remains bound to the position designation. If enabled, scores shift with the officer.
                    </span>
                  </div>

                  <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                    <label className="form-label">Reason for Action (Audit ledger logging)</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      style={{ width: '100%', padding: '0.65rem' }}
                      placeholder="e.g. IAS general transfer batch order #2026/A"
                      value={transferReason}
                      onChange={(e) => setTransferReason(e.target.value)}
                    />
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem', fontSize: '0.9rem', width: '100%' }}>
                    Execute Transfer
                  </button>
                  
                  {transferMessage && (
                    <div style={{ marginTop: '0.75rem', fontSize: '0.85rem', fontWeight: 600, color: transferMessage.includes('❌') ? 'var(--accent-red)' : '#10b981', textAlign: 'center' }}>
                      {transferMessage}
                    </div>
                  )}
                </form>
              </div>

              {/* Form 2: Override Engine */}
              <div id="intervention" className="glass-card" style={{ background: '#0e0d1a', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 'var(--radius-lg)' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Sliders size={18} style={{ color: 'var(--accent-gold)' }} /> Hard Score Override & Freeze Desk
                </h3>
                
                <form onSubmit={handleOverrideSubmit}>
                  <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label className="form-label">Select Position for Moderation</label>
                    <select 
                      className="form-select" 
                      style={{ width: '100%', padding: '0.65rem' }}
                      value={overridePosId} 
                      onChange={(e) => setOverridePosId(e.target.value)}
                    >
                      <option value="">-- Choose Profile --</option>
                      {positions.map(p => (
                        <option key={p.position_id} value={p.position_id}>
                          {p.position_title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    <div className="form-group">
                      <div className="switch-container" onClick={() => setIsFrozen(!isFrozen)}>
                        <div className={`switch-track ${isFrozen ? 'active' : ''}`}>
                          <div className="switch-thumb"></div>
                        </div>
                        <span className="form-label" style={{ cursor: 'pointer', fontSize: '0.85rem' }}>Lock Submissions</span>
                      </div>
                    </div>

                    <div className="form-group">
                      <div className="switch-container" onClick={() => setIsOverridden(!isOverridden)}>
                        <div className={`switch-track ${isOverridden ? 'active' : ''}`}>
                          <div className="switch-thumb"></div>
                        </div>
                        <span className="form-label" style={{ cursor: 'pointer', fontSize: '0.85rem' }}>Manual Score Override</span>
                      </div>
                    </div>
                  </div>

                  {isOverridden && (
                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                      <label className="form-label">Manual Base Score (0.00 - 10.00)</label>
                      <input 
                        type="number" 
                        min="0.00" 
                        max="10.00" 
                        step="0.01" 
                        className="form-input" 
                        style={{ width: '100%', padding: '0.65rem' }}
                        value={overrideScore}
                        onChange={(e) => setOverrideScore(e.target.value)}
                      />
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Overriding the score conceals the citizen-calculated rating average.
                      </span>
                    </div>
                  )}

                  <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                    <label className="form-label">Action Log / Justification</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      style={{ width: '100%', padding: '0.65rem' }}
                      placeholder="e.g. Locking ratings due to bot traffic anomaly."
                      value={overrideReason}
                      onChange={(e) => setOverrideReason(e.target.value)}
                    />
                  </div>

                  <button type="submit" className="btn btn-danger" style={{ padding: '0.75rem', fontSize: '0.9rem', width: '100%' }}>
                    Apply Intervention Setting
                  </button>
                  
                  {overrideMessage && (
                    <div style={{ marginTop: '0.75rem', fontSize: '0.85rem', fontWeight: 600, color: overrideMessage.includes('❌') ? 'var(--accent-red)' : '#10b981', textAlign: 'center' }}>
                      {overrideMessage}
                    </div>
                  )}
                </form>
              </div>

            </div>

            {/* Right Column: Charts & Reported Reviews */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              
              {/* Positions Ratings chart */}
              <div className="glass-card" style={{ background: '#0e0d1a', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', minHeight: '300px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Activity size={18} style={{ color: 'var(--accent-blue)' }} /> Tracked Positions Scores Summary
                </h3>
                <div style={{ flex: 1, width: '100%', height: '220px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="purpleGlow" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.85}/>
                          <stop offset="95%" stopColor="#818cf8" stopOpacity={0.25}/>
                        </linearGradient>
                        <linearGradient id="blueGlow" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.85}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.25}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                      <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={10} />
                      <YAxis stroke="var(--text-secondary)" fontSize={10} domain={[0, 10]} />
                      <Tooltip contentStyle={{ background: '#0f0e1c', border: '1px solid rgba(255,255,255,0.08)', color: '#ffffff', borderRadius: '8px' }} />
                      <Bar dataKey="Score" fill="url(#purpleGlow)" radius={[4, 4, 0, 0]} barSize={24} />
                      <Bar dataKey="Ratings" fill="url(#blueGlow)" radius={[4, 4, 0, 0]} barSize={12} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Reported Queue */}
              <div className="glass-card" style={{ background: '#0e0d1a', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 'var(--radius-lg)' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-red)' }}>
                  <AlertTriangle size={18} /> Reported Reviews Queue
                </h3>
                
                {reportedReviews.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', padding: '1rem 0' }}>All reported reviews cleared. Content integrity sound!</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {reportedReviews.map(rev => (
                      <div key={rev.id} style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)', padding: '1rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                            <span>Target: <strong>{rev.position}</strong></span>
                            <span style={{ color: 'var(--accent-red)', fontWeight: 600 }}>{rev.reason}</span>
                          </div>
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontStyle: 'italic', marginBottom: '1rem', lineHeight: 1.4 }}>
                            "{rev.text}"
                          </p>
                        </div>
                        
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button className="btn btn-secondary" style={{ flex: 1, padding: '0.35rem', fontSize: '0.8rem' }} onClick={() => handleModerateReview(rev.id, true)}>
                            Approve / Keep
                          </button>
                          <button className="btn btn-danger" style={{ flex: 1, padding: '0.35rem', fontSize: '0.8rem' }} onClick={() => handleModerateReview(rev.id, false)}>
                            Reject / Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

          </div>
        )}

        {/* 5. Audit logs ledger */}
        {!loading && (
          <div id="ledger" className="ledger-table-container">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileSpreadsheet size={18} style={{ color: 'var(--accent-blue)' }} /> System Administration Audit Trail Ledger
            </h3>
            
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', minWidth: '700px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid rgba(255,255,255,0.06)', color: 'var(--text-secondary)', textAlign: 'left' }}>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Log ID</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Action Type</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Target Position</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Old Value</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>New Value</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Justification</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((log, idx) => (
                    <tr key={log.id || idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', color: 'var(--text-secondary)' }}>
                      <td style={{ padding: '0.75rem 0.5rem', fontSize: '0.8rem' }}>{log.id}</td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, background: 'rgba(255,255,255,0.04)', padding: '0.15rem 0.4rem', borderRadius: 'var(--radius-sm)', color: log.action_type === 'SCORE_OVERRIDE' ? 'var(--accent-gold)' : log.action_type === 'FREEZE_RATINGS' ? 'var(--accent-red)' : 'var(--accent-green)' }}>
                          {log.action_type}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', fontWeight: 500, color: 'var(--text-primary)' }}>{log.position_title}</td>
                      <td style={{ padding: '0.75rem 0.5rem', fontSize: '0.8rem', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={log.old_value}>{log.old_value || 'NULL'}</td>
                      <td style={{ padding: '0.75rem 0.5rem', fontSize: '0.8rem', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={log.new_value}>{log.new_value || 'NULL'}</td>
                      <td style={{ padding: '0.75rem 0.5rem', fontSize: '0.85rem' }}>{log.reason}</td>
                      <td style={{ padding: '0.75rem 0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
