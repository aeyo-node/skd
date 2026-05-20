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
  Activity
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
    // In real app, we would query Supabase to update or delete the review
  };

  // Recharts Chart Data Formatting
  const chartData = positions.map(p => ({
    name: p.position_title.split(' ').slice(-2).join(' '), // short name for x-axis
    Score: p.display_rating || 0,
    Ratings: p.total_ratings_count
  }));

  return (
    <div className="admin-dashboard-container">
      
      {/* Page Title */}
      <div className="admin-header-flex">
        <div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 800, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldAlert style={{ color: 'var(--accent-blue)' }} /> Admin CMS Console
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginTop: '0.25rem' }}>
            Integrity oversight, transfer mapping, and public rating intervention logs.
          </p>
        </div>
        <button onClick={loadData} className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.5rem 1rem' }}>
          <RefreshCw size={14} /> Refresh Logs
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
          <p>Connecting to secure administration database...</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
          
          {/* Top Analytics Panel */}
          <div className="admin-grid-two-col">
            
            {/* Chart: Rating Velocity & Values */}
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', minHeight: '300px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Activity size={16} style={{ color: 'var(--accent-blue)' }} /> Positions Ratings Summary
              </h3>
              <div style={{ flex: 1, width: '100%', height: '220px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={10} />
                    <YAxis stroke="var(--text-secondary)" fontSize={10} domain={[0, 10]} />
                    <Tooltip contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} />
                    <Bar dataKey="Score" fill="var(--accent-gold)" radius={[4, 4, 0, 0]} barSize={24} />
                    <Bar dataKey="Ratings" fill="var(--accent-blue)" radius={[4, 4, 0, 0]} barSize={12} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Anomaly Detection Feed */}
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--accent-red)' }}>
                <AlertTriangle size={16} /> Velocity Anomaly Feed
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto', flex: 1 }}>
                {anomalies.map(al => (
                  <div key={al.id} style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.15)', borderRadius: 'var(--radius-sm)', padding: '0.85rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <strong style={{ fontSize: '0.85rem', color: '#feb2b2' }}>{al.posTitle}</strong>
                      <span style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem', background: 'var(--accent-red)', color: '#fff', fontWeight: 700, borderRadius: 'var(--radius-sm)' }}>
                        {al.risk} RISK
                      </span>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{al.desc}</p>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                      <button className="btn" style={{ padding: '0.25rem 0.6rem', fontSize: '0.7rem', background: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)' }} onClick={() => setOverridePosId(String(positions.find(p => p.position_title === al.posTitle)?.position_id || ''))}>
                        Investigate / Freeze
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Action Modifying Panels */}
          <div className="admin-grid-two-col">
            
            {/* 1. Official Transfer & Mapping Tool */}
            <div className="glass-card">
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <UserCheck size={16} style={{ color: 'var(--accent-green)' }} /> Transfer & Mapping Tool
              </h3>
              
              <form onSubmit={handleTransferSubmit}>
                <div className="form-group">
                  <label className="form-label">Select Target Position Desk</label>
                  <select 
                    className="form-select" 
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

                <div className="form-group">
                  <label className="form-label">Assign New Official Incumbent</label>
                  <select 
                    className="form-select" 
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
                    <span className="form-label" style={{ cursor: 'pointer' }}>Carry rating history with the individual</span>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    If off, history remains bound to the position designation. If on, history shifts with the person.
                  </span>
                </div>

                <div className="form-group">
                  <label className="form-label">Reason for Transfer (Audit Record)</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. IAS general transfer batch order #2026/A"
                    value={transferReason}
                    onChange={(e) => setTransferReason(e.target.value)}
                  />
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
                  Execute Official Transfer
                </button>
                
                {transferMessage && (
                  <div style={{ marginTop: '0.75rem', fontSize: '0.85rem', fontWeight: 600, textAlign: 'center' }}>
                    {transferMessage}
                  </div>
                )}
              </form>
            </div>

            {/* 2. Rating Override & Intervention Mechanics */}
            <div className="glass-card">
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Sliders size={16} style={{ color: 'var(--accent-gold)' }} /> Rating Intervention Engine
              </h3>
              
              <form onSubmit={handleOverrideSubmit}>
                <div className="form-group">
                  <label className="form-label">Select Position for Intervention</label>
                  <select 
                    className="form-select" 
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
                      <span className="form-label" style={{ cursor: 'pointer' }}>Freeze Submissions</span>
                    </div>
                  </div>

                  <div className="form-group">
                    <div className="switch-container" onClick={() => setIsOverridden(!isOverridden)}>
                      <div className={`switch-track ${isOverridden ? 'active' : ''}`}>
                        <div className="switch-thumb"></div>
                      </div>
                      <span className="form-label" style={{ cursor: 'pointer' }}>Hard Score Override</span>
                    </div>
                  </div>
                </div>

                {isOverridden && (
                  <div className="form-group">
                    <label className="form-label">Manual Base Score (0.00 - 10.00)</label>
                    <input 
                      type="number" 
                      min="0.00" 
                      max="10.00" 
                      step="0.01" 
                      className="form-input" 
                      value={overrideScore}
                      onChange={(e) => setOverrideScore(e.target.value)}
                    />
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Applying override score will hide public average but preserve citizen database logs.
                    </span>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Justification / Action Log Reason</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. Freezing due to suspected political bot rating campaign"
                    value={overrideReason}
                    onChange={(e) => setOverrideReason(e.target.value)}
                  />
                </div>

                <button type="submit" className="btn btn-danger" style={{ width: '100%', marginTop: '0.5rem' }}>
                  Save Intervention Setting
                </button>
                
                {overrideMessage && (
                  <div style={{ marginTop: '0.75rem', fontSize: '0.85rem', fontWeight: 600, textAlign: 'center' }}>
                    {overrideMessage}
                  </div>
                )}
              </form>
            </div>

          </div>

          {/* Moderation Queue for Reported Reviews */}
          <div className="glass-card">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <AlertTriangle size={16} style={{ color: 'var(--accent-red)' }} /> Reported Reviews Queue
            </h3>
            
            {reportedReviews.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', padding: '1rem 0' }}>All reported reviews cleared. Content integrity sound!</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
                {reportedReviews.map(rev => (
                  <div key={rev.id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '1rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                        <span>Target: <strong>{rev.position}</strong></span>
                        <span style={{ color: 'var(--accent-red)', fontWeight: 600 }}>{rev.reason}</span>
                      </div>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', italic: 'true', marginBottom: '1rem', lineHeight: 1.4 }}>
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

          {/* Admin Audit Trail Table */}
          <div className="glass-card">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <FileSpreadsheet size={16} style={{ color: 'var(--accent-blue)' }} /> Admin Audit Trail Ledger
            </h3>
            
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', minWidth: '600px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid rgba(255,255,255,0.1)', color: 'var(--text-secondary)', textAlign: 'left' }}>
                    <th style={{ padding: '0.75rem 0.5rem' }}>ID</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Action Type</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Target Profile</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Old Value</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>New Value</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Reason/Justification</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((log, idx) => (
                    <tr key={log.id || idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', color: 'var(--text-secondary)' }}>
                      <td style={{ padding: '0.75rem 0.5rem', fontSize: '0.8rem' }}>{log.id}</td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, background: 'rgba(255,255,255,0.05)', padding: '0.15rem 0.4rem', borderRadius: 'var(--radius-sm)', color: log.action_type === 'SCORE_OVERRIDE' ? 'var(--accent-gold)' : log.action_type === 'FREEZE_RATINGS' ? 'var(--accent-red)' : 'var(--accent-green)' }}>
                          {log.action_type}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', fontWeight: 500, color: 'var(--text-primary)' }}>{log.position_title}</td>
                      <td style={{ padding: '0.75rem 0.5rem', fontSize: '0.8rem', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={log.old_value}>{log.old_value || 'NULL'}</td>
                      <td style={{ padding: '0.75rem 0.5rem', fontSize: '0.8rem', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={log.new_value}>{log.new_value || 'NULL'}</td>
                      <td style={{ padding: '0.75rem 0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{log.reason}</td>
                      <td style={{ padding: '0.75rem 0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
