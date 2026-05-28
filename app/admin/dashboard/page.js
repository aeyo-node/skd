'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  Compass,
  Bot,
  Sparkles
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
  const router = useRouter();

  // Authentication check
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isAuth = localStorage.getItem('skd_admin_auth');
      if (isAuth !== 'true') {
        router.push('/admin');
      }
    }
  }, [router]);

  // Tab State
  const [activeTab, setActiveTab] = useState('overview');

  // Search Filter States
  const [directorySearch, setDirectorySearch] = useState('');
  const [ledgerSearch, setLedgerSearch] = useState('');

  // Data Management States
  const [dataManageMode, setDataManageMode] = useState('positions'); // 'positions' or 'officials'
  const [dataSearch, setDataSearch] = useState('');
  const [editingOfficial, setEditingOfficial] = useState(null);
  const [editingPosition, setEditingPosition] = useState(null);
  const [isAddingOfficial, setIsAddingOfficial] = useState(false);
  const [isAddingPosition, setIsAddingPosition] = useState(false);
  const [deletingRecord, setDeletingRecord] = useState(null); // { type: 'official'|'position', id, name }
  const [crudMessage, setCrudMessage] = useState('');

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

  // SKD AI Agent Control Center States
  const [agentLogs, setAgentLogs] = useState([
    '🤖 System initialized: SKD Agent Hub ready.',
    '🔌 Grounding engine status: Connected to Google Search.',
    '⚡ Model footprint: skd-flash-2.0 selected.'
  ]);
  const [runningBatch, setRunningBatch] = useState(false);
  const [runningSingleId, setRunningSingleId] = useState(null);

  // Cloud background batch engine states
  const [cloudBatch, setCloudBatch] = useState({
    status: 'idle',
    total: 0,
    completed: 0,
    failed: 0,
    currentIndex: 0,
    currentOfficial: '',
    currentPositionTitle: '',
    startTime: null,
    stopRequested: false,
    error: null
  });

  // Fetch cloud background batch engine status
  const fetchCloudBatchStatus = async () => {
    try {
      const res = await fetch('/api/skd-agent-batch');
      if (res.ok) {
        const data = await res.json();
        setCloudBatch(data);
      }
    } catch (err) {
      console.error('Error fetching cloud batch status:', err);
    }
  };

  // Poll cloud batch status every 3 seconds only when activeTab is 'ai-agent'
  useEffect(() => {
    if (activeTab === 'ai-agent') {
      fetchCloudBatchStatus();
      const interval = setInterval(() => {
        fetchCloudBatchStatus();
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [activeTab]);

  // Start cloud background batch
  const startCloudBatch = async (concurrency = 2) => {
    try {
      const timestamp = new Date().toLocaleTimeString();
      setAgentLogs(prev => [
        `[${timestamp}] ☁️ Requesting server-side Cloud Batch start (Concurrency: ${concurrency})...`,
        ...prev
      ]);
      const res = await fetch('/api/skd-agent-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start', concurrency })
      });
      const data = await res.json();
      fetchCloudBatchStatus();
      const doneTime = new Date().toLocaleTimeString();
      if (data.success) {
        setAgentLogs(prev => [
          `[${doneTime}] ☁️ Cloud Batch successfully initiated! Server-side worker is active.`,
          ...prev
        ]);
      } else {
        setAgentLogs(prev => [
          `[${doneTime}] ❌ Cloud Batch initiation rejected: ${data.message || data.error}`,
          ...prev
        ]);
      }
    } catch (err) {
      setAgentLogs(prev => [
        `[${new Date().toLocaleTimeString()}] ❌ Cloud Batch initiation error: ${err.message}`,
        ...prev
      ]);
    }
  };

  // Stop cloud background batch
  const stopCloudBatch = async () => {
    try {
      const timestamp = new Date().toLocaleTimeString();
      setAgentLogs(prev => [
        `[${timestamp}] 🛑 Requesting server-side Cloud Batch termination...`,
        ...prev
      ]);
      const res = await fetch('/api/skd-agent-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'stop' })
      });
      const data = await res.json();
      fetchCloudBatchStatus();
      const doneTime = new Date().toLocaleTimeString();
      if (data.success) {
        setAgentLogs(prev => [
          `[${doneTime}] 🛑 Cloud Batch stop requested. Real-time workers are aborting.`,
          ...prev
        ]);
      } else {
        setAgentLogs(prev => [
          `[${doneTime}] ❌ Cloud Batch stop rejected: ${data.message || data.error}`,
          ...prev
        ]);
      }
    } catch (err) {
      setAgentLogs(prev => [
        `[${new Date().toLocaleTimeString()}] ❌ Cloud Batch stop error: ${err.message}`,
        ...prev
      ]);
    }
  };

  // Trigger Gemini web search analysis for a single position
  const triggerSingleAgent = async (posId, title, officialName) => {
    if (runningSingleId || runningBatch) return;
    
    setRunningSingleId(posId);
    const timestamp = new Date().toLocaleTimeString();
    setAgentLogs(prev => [
      `[${timestamp}] 🔍 Initiating agent run for ${title} (${officialName})...`,
      `[${timestamp}] 📡 Crawling public record: "${officialName} ${title.split(';')[0]} India performance"...`,
      ...prev
    ]);

    try {
      const res = await db.triggerSkdAgent(posId);
      const doneTime = new Date().toLocaleTimeString();
      
      if (res.success) {
        setAgentLogs(prev => [
          `[${doneTime}] ✅ Analysis completed successfully for ${title}!`,
          `[${doneTime}] 📊 Overall AI Score: ${res.skd_overall_score.toFixed(2)} (Int: ${res.score_integrity.toFixed(1)}, Eff: ${res.score_efficiency.toFixed(1)}, Acc: ${res.score_accessibility.toFixed(1)})`,
          `[${doneTime}] 🌐 Retrieved sources: ${res.sources.length} links matched.`,
          ...prev
        ]);
        loadData(); // Reload directory state
      } else {
        setAgentLogs(prev => [
          `[${doneTime}] ❌ Failed to complete analysis: ${res.error || 'SKD connection timeout'}`,
          ...prev
        ]);
      }
    } catch (err) {
      setAgentLogs(prev => [
        `[${new Date().toLocaleTimeString()}] ❌ Network error: ${err.message}`,
        ...prev
      ]);
    } finally {
      setRunningSingleId(null);
    }
  };


  // Trigger Gemini web search analysis for all positions
  const triggerBatchAgent = async () => {
    if (runningBatch || runningSingleId) return;
    
    const pendingPositions = positions.filter(p => !p.skd_status || p.skd_status !== 'completed');
    
    if (pendingPositions.length === 0) {
      setAgentLogs(prev => [
        `[${new Date().toLocaleTimeString()}] 🎉 All results grounded. No pending evaluations found.`,
        ...prev
      ]);
      return;
    }

    setRunningBatch(true);
    const timestamp = new Date().toLocaleTimeString();
    setAgentLogs(prev => [
      `[${timestamp}] 🤖 Starting batch run for ${pendingPositions.length} pending positions...`,
      `[${timestamp}] ⏳ Processing sequentially to respect API rate limits...`,
      ...prev
    ]);

    try {
      let completedCount = 0;
      let failedCount = 0;
      
      for (let i = 0; i < pendingPositions.length; i++) {
        const pos = pendingPositions[i];
        
        setAgentLogs(prev => [
          `[${new Date().toLocaleTimeString()}] ⏳ Processing ${i + 1}/${pendingPositions.length}: ${pos.position_title}...`,
          ...prev
        ]);
        
        const res = await db.triggerSkdAgent(pos.position_id);
        
        if (res && res.success) {
          completedCount++;
          setAgentLogs(prev => [
            `[${new Date().toLocaleTimeString()}] ✅ Success: ${pos.position_title} (Score: ${res.skd_overall_score})`,
            ...prev
          ]);
        } else {
          failedCount++;
          setAgentLogs(prev => [
            `[${new Date().toLocaleTimeString()}] ❌ Failed: ${pos.position_title} - ${res?.error || 'Timeout'}`,
            ...prev
          ]);
        }
        
        // Reload data occasionally to reflect progress in the UI
        if ((i + 1) % 5 === 0) {
          loadData();
        }
        
        // Stop the batch automatically if we hit a hard Quota/429 error
        if (res && !res.success && res.error && res.error.includes('429')) {
          setAgentLogs(prev => [
            `[${new Date().toLocaleTimeString()}] 🛑 Batch stopped automatically: Gemini Free Tier Quota Exceeded.`,
            ...prev
          ]);
          break; // Exit the loop
        }

        // Wait 5 seconds between requests to ensure we stay under the 15 Requests Per Minute (RPM) free tier limit
        if (i < pendingPositions.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      }
      
      const doneTime = new Date().toLocaleTimeString();
      setAgentLogs(prev => [
        `[${doneTime}] 🎉 Batch execution complete!`,
        `[${doneTime}] 📈 Summary: ${completedCount} completed successfully, ${failedCount} failed.`,
        ...prev
      ]);
      loadData();
    } catch (err) {
      setAgentLogs(prev => [
        `[${new Date().toLocaleTimeString()}] ❌ Batch network error: ${err.message}`,
        ...prev
      ]);
    } finally {
      setRunningBatch(false);
    }
  };

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

  // CRUD Handlers
  const handleSaveOfficial = async (officialData) => {
    setCrudMessage('Saving...');
    let res;
    if (officialData.id) {
      res = await db.updateOfficial(officialData.id, officialData);
    } else {
      res = await db.addOfficial(officialData);
    }
    if (res.success) {
      setCrudMessage('✅ Official saved successfully!');
      setEditingOfficial(null);
      setIsAddingOfficial(false);
      loadData();
    } else {
      setCrudMessage(`❌ Error: ${res.error}`);
    }
    setTimeout(() => setCrudMessage(''), 3000);
  };

  const handleSavePosition = async (posData) => {
    setCrudMessage('Saving...');
    let res;
    if (posData.id) {
      res = await db.updatePosition(posData.id, posData);
    } else {
      res = await db.addPosition(posData);
    }
    if (res.success) {
      setCrudMessage('✅ Position saved successfully!');
      setEditingPosition(null);
      setIsAddingPosition(false);
      loadData();
    } else {
      setCrudMessage(`❌ Error: ${res.error}`);
    }
    setTimeout(() => setCrudMessage(''), 3000);
  };

  const handleDeleteRecord = async () => {
    if (!deletingRecord) return;
    setCrudMessage('Deleting...');
    let res;
    if (deletingRecord.type === 'official') {
      res = await db.deleteOfficial(deletingRecord.id);
    } else {
      res = await db.deletePosition(deletingRecord.id);
    }
    if (res.success) {
      setCrudMessage(`✅ ${deletingRecord.type} deleted successfully!`);
      setDeletingRecord(null);
      loadData();
    } else {
      setCrudMessage(`❌ Error: ${res.error}`);
    }
    setTimeout(() => setCrudMessage(''), 3000);
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

  // Filtering Position Directory
  const filteredPositions = positions.filter(p => 
    (p.position_title && p.position_title.toLowerCase().includes(directorySearch.toLowerCase())) ||
    (p.current_official_name && p.current_official_name.toLowerCase().includes(directorySearch.toLowerCase())) ||
    (p.department_name && p.department_name.toLowerCase().includes(directorySearch.toLowerCase()))
  );

  // Filtering Audit Ledger
  const filteredAuditLogs = auditLogs.filter(log => 
    log.position_title.toLowerCase().includes(ledgerSearch.toLowerCase()) ||
    log.action_type.toLowerCase().includes(ledgerSearch.toLowerCase()) ||
    log.reason.toLowerCase().includes(ledgerSearch.toLowerCase()) ||
    String(log.id).includes(ledgerSearch)
  );

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
          <button 
            onClick={() => setActiveTab('overview')} 
            className={`sidebar-link ${activeTab === 'overview' ? 'active' : ''}`}
            style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
          >
            <Activity size={16} /> <span style={{ marginLeft: '8px' }}>Dashboard</span>
          </button>
          <button 
            onClick={() => setActiveTab('directory')} 
            className={`sidebar-link ${activeTab === 'directory' ? 'active' : ''}`}
            style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
          >
            <Compass size={16} /> <span style={{ marginLeft: '8px' }}>Directory Grid</span>
          </button>
          <button 
            onClick={() => setActiveTab('interventions')} 
            className={`sidebar-link ${activeTab === 'interventions' ? 'active' : ''}`}
            style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
          >
            <Sliders size={16} /> <span style={{ marginLeft: '8px' }}>Interventions</span>
          </button>
           <button 
            onClick={() => setActiveTab('ledger')} 
            className={`sidebar-link ${activeTab === 'ledger' ? 'active' : ''}`}
            style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
          >
            <FileSpreadsheet size={16} /> <span style={{ marginLeft: '8px' }}>Audit Trail</span>
          </button>
          <button 
            onClick={() => setActiveTab('data-manage')} 
            className={`sidebar-link ${activeTab === 'data-manage' ? 'active' : ''}`}
            style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
          >
            <Settings size={16} /> <span style={{ marginLeft: '8px' }}>Data Management</span>
          </button>
          <button 
            onClick={() => setActiveTab('ai-agent')} 
            className={`sidebar-link ${activeTab === 'ai-agent' ? 'active' : ''}`}
            style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#a78bfa' }}
          >
            <Bot size={16} style={{ color: '#a78bfa' }} /> <span style={{ marginLeft: '8px', fontWeight: 600 }}>AI Rating Agent</span>
          </button>
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
            {activeTab === 'directory' || activeTab === 'ai-agent' ? (
              <input 
                type="text" 
                className="admin-search-input" 
                placeholder="Search positions..." 
                value={directorySearch}
                onChange={(e) => setDirectorySearch(e.target.value)}
              />
            ) : activeTab === 'ledger' ? (
              <input 
                type="text" 
                className="admin-search-input" 
                placeholder="Search audit trail..." 
                value={ledgerSearch}
                onChange={(e) => setLedgerSearch(e.target.value)}
              />
            ) : (
              <input 
                type="text" 
                className="admin-search-input" 
                placeholder="Search CMS logs, desk IDs..." 
                disabled
              />
            )}
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
          <div 
            onClick={() => setActiveTab('directory')} 
            className="stakent-stat-card" 
            style={{ cursor: 'pointer' }}
          >
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
          <div 
            onClick={() => setActiveTab('interventions')} 
            className="stakent-stat-card" 
            style={{ cursor: 'pointer' }}
          >
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
          <div 
            onClick={() => setActiveTab('interventions')} 
            className="stakent-stat-card" 
            style={{ cursor: 'pointer' }}
          >
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

        {/* 4. Tab Contents Workspace */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
            <p>Connecting to secure administration database...</p>
          </div>
        ) : (
          <div>
            
            {/* TABS 1: Overview */}
            {activeTab === 'overview' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '2rem' }} className="admin-grid-two-col">
                {/* Chart summary */}
                <div className="glass-card" style={{ background: '#0e0d1a', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', minHeight: '340px' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Activity size={18} style={{ color: 'var(--accent-blue)' }} /> Tracked Positions Scores Summary
                  </h3>
                  <div style={{ flex: 1, width: '100%', height: '260px' }}>
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

                {/* Flagged Review panel */}
                <div className="glass-card" style={{ background: '#0e0d1a', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 'var(--radius-lg)' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-red)' }}>
                    <AlertTriangle size={18} /> Urgent Moderation Feed
                  </h3>
                  {reportedReviews.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', padding: '1rem 0' }}>All reported reviews cleared. Content integrity sound!</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {reportedReviews.map(rev => (
                        <div key={rev.id} style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)', padding: '1rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                            <span>Target: <strong>{rev.position}</strong></span>
                            <span style={{ color: 'var(--accent-red)', fontWeight: 600 }}>{rev.reason}</span>
                          </div>
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontStyle: 'italic', marginBottom: '1rem', lineHeight: 1.4 }}>
                            "{rev.text}"
                          </p>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button className="btn btn-secondary" style={{ flex: 1, padding: '0.35rem', fontSize: '0.75rem' }} onClick={() => handleModerateReview(rev.id, true)}>
                              Keep
                            </button>
                            <button className="btn btn-danger" style={{ flex: 1, padding: '0.35rem', fontSize: '0.75rem' }} onClick={() => handleModerateReview(rev.id, false)}>
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TABS 2: Directory Grid List */}
            {activeTab === 'directory' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Compass size={18} style={{ color: 'var(--accent-blue)' }} /> Active Administrative Directory ({filteredPositions.length} desks)
                  </h3>
                  {directorySearch && (
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      Filtering by "{directorySearch}"
                    </span>
                  )}
                </div>

                {filteredPositions.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                    No results match your search term.
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                    {filteredPositions.map(p => (
                      <div key={p.position_id} className="glass-card" style={{ background: '#0e0d1a', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 'var(--radius-lg)', padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '180px' }}>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              {p.tier} Desk
                            </span>
                            <div style={{ display: 'flex', gap: '0.35rem' }}>
                              {p.is_frozen && (
                                <span style={{ fontSize: '0.6rem', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', padding: '0.15rem 0.4rem', borderRadius: '4px', fontWeight: 700 }}>
                                  LOCKED
                                </span>
                              )}
                              {p.is_overridden && (
                                <span style={{ fontSize: '0.6rem', background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', padding: '0.15rem 0.4rem', borderRadius: '4px', fontWeight: 700 }}>
                                  OVERRIDDEN
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <h4 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 0.25rem 0', color: '#ffffff', lineHeight: 1.3 }}>
                            {p.position_title}
                          </h4>
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0 0 0.75rem 0' }}>
                            Official: <strong>{p.current_official_name}</strong>
                          </p>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                            <span style={{ fontSize: '1.25rem', fontWeight: 800, color: p.display_rating ? '#a78bfa' : 'var(--text-muted)' }}>
                              {p.display_rating !== null ? p.display_rating.toFixed(2) : 'N/A'}
                            </span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              ({p.total_ratings_count} citizen reviews)
                            </span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '0.75rem' }}>
                          <button 
                            onClick={() => {
                              setTransferPosId(String(p.position_id));
                              setActiveTab('interventions');
                            }}
                            className="btn btn-secondary" 
                            style={{ flex: 1, padding: '0.4rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}
                          >
                            <UserCheck size={12} /> Transfer
                          </button>
                          <button 
                            onClick={() => {
                              setOverridePosId(String(p.position_id));
                              setActiveTab('interventions');
                            }}
                            className="btn btn-secondary" 
                            style={{ flex: 1, padding: '0.4rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}
                          >
                            <Sliders size={12} /> Override
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TABS 3: Interventions forms */}
            {activeTab === 'interventions' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }} className="admin-grid-two-col">
                
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
                <div className="glass-card" style={{ background: '#0e0d1a', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 'var(--radius-lg)' }}>
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
            )}

            {/* TABS 4: Audit Ledger Table */}
            {activeTab === 'ledger' && (
              <div className="ledger-table-container" style={{ marginTop: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FileSpreadsheet size={18} style={{ color: 'var(--accent-blue)' }} /> System Administration Audit Trail Ledger ({filteredAuditLogs.length} entries)
                  </h3>
                  {ledgerSearch && (
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      Filtering by "{ledgerSearch}"
                    </span>
                  )}
                </div>

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
                      {filteredAuditLogs.map((log, idx) => (
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

            {/* TABS 5: AI Rating Agent Control Center */}
            {activeTab === 'ai-agent' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                
                {/* 1. Header controls section */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '2rem' }} className="admin-grid-two-col">
                  
                  {/* Status overview & trigger */}
                  <div className="glass-card" style={{ background: '#0e0d1a', border: '1px solid rgba(167, 139, 250, 0.15)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '240px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                        <Bot size={22} style={{ color: '#a78bfa' }} />
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>Sarkardada AI Agent Core</h3>
                      </div>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.5, marginBottom: '1.5rem' }}>
                        This agent orchestrates deep web crawls of active government personnel to establish automated ratings (Integrity, Efficiency, Public Accessibility) based on verified real-world outputs, judicial reviews, news transcripts, and official portals.
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                      <button 
                        onClick={triggerBatchAgent}
                        className="btn" 
                        disabled={runningBatch || runningSingleId}
                        style={{ background: 'linear-gradient(135deg, #a78bfa, #8b5cf6)', color: '#ffffff', border: 'none', padding: '0.75rem 1.5rem', fontSize: '0.9rem', fontWeight: 700, borderRadius: 'var(--radius-md)', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', cursor: (runningBatch || runningSingleId) ? 'not-allowed' : 'pointer', opacity: (runningBatch || runningSingleId) ? 0.6 : 1, transition: 'all 0.2s ease', boxShadow: '0 4px 15px rgba(167, 139, 250, 0.3)' }}
                      >
                        <Sparkles size={16} /> 
                        {runningBatch ? 'Batch Evaluating...' : 'Run Whole Directory Evaluation'}
                      </button>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.02)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Engine:</span>
                        <strong style={{ fontSize: '0.8rem', color: '#a78bfa' }}>SKD Flash 2.0 grounded</strong>
                      </div>
                    </div>
                  </div>

                  {/* Logs Console */}
                  <div className="glass-card" style={{ background: '#08080f', border: '1px solid rgba(255,255,255,0.03)', borderRadius: 'var(--radius-lg)', padding: '1.2rem', display: 'flex', flexDirection: 'column', height: '240px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', fontWeight: 700 }}>
                        Real-time Crawler Logs
                      </span>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: (runningBatch || runningSingleId) ? '#a78bfa' : 'var(--text-muted)', display: 'inline-block', boxShadow: (runningBatch || runningSingleId) ? '0 0 10px #a78bfa' : 'none' }}></span>
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto', fontFamily: 'monospace', fontSize: '0.75rem', color: '#a78bfa', display: 'flex', flexDirection: 'column', gap: '0.35rem', paddingRight: '0.25rem' }}>
                      {agentLogs.map((log, idx) => (
                        <div key={idx} style={{ lineBreak: 'anywhere', opacity: idx === 0 ? 1 : 0.65 }}>
                          {log}
                        </div>
                      ))}
                  </div>
                </div>
              </div>

                {/* Cloud Background Engine Controller */}
                <div className="glass-card" style={{ 
                  background: 'linear-gradient(135deg, rgba(14, 13, 26, 0.95), rgba(24, 21, 51, 0.95))', 
                  border: '1px solid rgba(139, 92, 246, 0.35)', 
                  borderRadius: 'var(--radius-lg)', 
                  padding: '1.5rem',
                  boxShadow: '0 8px 32px rgba(139, 92, 246, 0.15)',
                  backdropFilter: 'blur(12px)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                        <Bot size={24} style={{ color: '#c084fc' }} />
                        <h4 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#f3e8ff', textShadow: '0 0 10px rgba(192, 132, 252, 0.2)' }}>Cloud-Native Background Batch Engine</h4>
                        <span style={{ 
                          background: cloudBatch.status === 'running' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', 
                          color: cloudBatch.status === 'running' ? '#10b981' : '#ef4444', 
                          border: `1px solid ${cloudBatch.status === 'running' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
                          padding: '0.25rem 0.75rem', 
                          borderRadius: '20px', 
                          fontSize: '0.75rem', 
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem'
                        }}>
                          <span style={{ 
                            width: '6px', 
                            height: '6px', 
                            borderRadius: '50%', 
                            background: cloudBatch.status === 'running' ? '#10b981' : '#ef4444',
                            animation: cloudBatch.status === 'running' ? 'pulse 1.5s infinite' : 'none'
                          }}></span>
                          Cloud Status: {cloudBatch.status}
                        </span>
                      </div>
                      <p style={{ color: '#d8b4fe', fontSize: '0.85rem', margin: 0, opacity: 0.85 }}>
                        Runs asynchronously on the server. You can close your browser or shut down your laptop; execution continues autonomously.
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      {cloudBatch.status !== 'running' ? (
                        <button 
                          onClick={() => startCloudBatch(2)}
                          className="btn"
                          style={{ 
                            background: 'linear-gradient(135deg, #10b981, #059669)', 
                            color: '#ffffff', 
                            border: 'none', 
                            padding: '0.65rem 1.25rem', 
                            fontSize: '0.85rem', 
                            fontWeight: 700, 
                            borderRadius: 'var(--radius-md)', 
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            transition: 'all 0.2s ease',
                            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)'
                          }}
                        >
                          <Sparkles size={14} /> Start Cloud Batch
                        </button>
                      ) : (
                        <button 
                          onClick={stopCloudBatch}
                          className="btn"
                          style={{ 
                            background: 'linear-gradient(135deg, #ef4444, #dc2626)', 
                            color: '#ffffff', 
                            border: 'none', 
                            padding: '0.65rem 1.25rem', 
                            fontSize: '0.85rem', 
                            fontWeight: 700, 
                            borderRadius: 'var(--radius-md)', 
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            transition: 'all 0.2s ease',
                            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)'
                          }}
                        >
                          <AlertTriangle size={14} /> Stop Cloud Batch
                        </button>
                      )}
                    </div>
                  </div>

                  {cloudBatch.status === 'running' && (
                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.03)' }}>
                      {/* Active Official details */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontSize: '0.85rem', color: '#c084fc' }}>Currently Rating:</span>
                          <strong style={{ fontSize: '0.9rem', color: '#ffffff' }}>{cloudBatch.currentOfficial}</strong>
                          <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', opacity: 0.8 }}>({cloudBatch.currentPositionTitle})</span>
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#a78bfa' }}>
                          Progress: <strong>{cloudBatch.completed + cloudBatch.failed}</strong> / <strong>{cloudBatch.total}</strong> pending ({Math.round(((cloudBatch.completed + cloudBatch.failed) / (cloudBatch.total || 1)) * 100)}%)
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden', marginBottom: '0.75rem' }}>
                        <div style={{ 
                          width: `${((cloudBatch.completed + cloudBatch.failed) / (cloudBatch.total || 1)) * 100}%`, 
                          height: '100%', 
                          background: 'linear-gradient(90deg, #a78bfa, #10b981)', 
                          borderRadius: '4px',
                          transition: 'width 0.5s ease-out'
                        }}></div>
                      </div>

                      {/* Detailed metrics */}
                      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        <div>✅ Completed: <strong style={{ color: '#10b981' }}>{cloudBatch.completed}</strong></div>
                        <div>❌ Failed: <strong style={{ color: '#ef4444' }}>{cloudBatch.failed}</strong></div>
                        <div>⏱️ Started At: <span style={{ color: '#ffffff' }}>{cloudBatch.startTime ? new Date(cloudBatch.startTime).toLocaleTimeString() : 'N/A'}</span></div>
                      </div>
                    </div>
                  )}

                  {cloudBatch.status !== 'running' && cloudBatch.total > 0 && (
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.03)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        Last Run Status: <strong style={{ color: cloudBatch.status === 'stopped' ? '#f59e0b' : '#10b981', textTransform: 'uppercase' }}>{cloudBatch.status}</strong>
                        {cloudBatch.error && <span style={{ color: '#ef4444', marginLeft: '0.5rem' }}>— Error: {cloudBatch.error}</span>}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        Processed: <strong>{cloudBatch.completed}</strong> succeeded, <strong>{cloudBatch.failed}</strong> failed out of <strong>{cloudBatch.total}</strong> total items.
                      </div>
                    </div>
                  )}
                </div>


                {/* 2. Position Matrix list */}
                <div className="glass-card" style={{ background: '#0e0d1a', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 'var(--radius-lg)', padding: '1.5rem' }}>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.25rem' }}>Directory AI Matrix Status</h4>
                  
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', minWidth: '750px' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid rgba(255,255,255,0.06)', color: 'var(--text-secondary)', textAlign: 'left' }}>
                          <th style={{ padding: '0.75rem 0.5rem' }}>Office / Desk</th>
                          <th style={{ padding: '0.75rem 0.5rem' }}>Incumbent</th>
                          <th style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>SKD Rating</th>
                          <th style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>Integrity</th>
                          <th style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>Efficiency</th>
                          <th style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>Accessibility</th>
                          <th style={{ padding: '0.75rem 0.5rem' }}>Status</th>
                          <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredPositions.map((p) => {
                          const isCurrentlyRunning = runningSingleId === p.position_id;
                          const hasRating = p.skd_rating !== null && p.skd_rating !== undefined;

                          return (
                            <tr key={p.position_id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', color: 'var(--text-secondary)' }}>
                              <td style={{ padding: '0.75rem 0.5rem', fontWeight: 600, color: '#ffffff' }}>
                                {p.position_title}
                              </td>
                              <td style={{ padding: '0.75rem 0.5rem' }}>
                                {p.current_official_name}
                              </td>
                              <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>
                                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: typeof p.skd_rating === 'number' ? '#a78bfa' : 'var(--text-muted)', background: typeof p.skd_rating === 'number' ? 'rgba(167, 139, 250, 0.08)' : 'rgba(255,255,255,0.02)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                                  {typeof p.skd_rating === 'number' ? p.skd_rating.toFixed(2) : '—'}
                                </span>
                              </td>
                              <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center', fontSize: '0.8rem' }}>
                                {typeof p.skd_integrity === 'number' ? p.skd_integrity.toFixed(1) : '—'}
                              </td>
                              <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center', fontSize: '0.8rem' }}>
                                {typeof p.skd_efficiency === 'number' ? p.skd_efficiency.toFixed(1) : '—'}
                              </td>
                              <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center', fontSize: '0.8rem' }}>
                                {typeof p.skd_accessibility === 'number' ? p.skd_accessibility.toFixed(1) : '—'}
                              </td>
                              <td style={{ padding: '0.75rem 0.5rem' }}>
                                {isCurrentlyRunning ? (
                                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#a78bfa', animation: 'pulse 1.5s infinite' }}>
                                    ⏳ Running Agent
                                  </span>
                                ) : hasRating ? (
                                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-green)' }}>
                                    ✓ Grounded
                                  </span>
                                ) : (
                                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                    Pending Run
                                  </span>
                                )}
                              </td>
                              <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>
                                <button
                                  onClick={() => triggerSingleAgent(p.position_id, p.position_title, p.current_official_name)}
                                  className="btn btn-secondary"
                                  disabled={runningBatch || runningSingleId !== null}
                                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', border: '1px solid rgba(167, 139, 250, 0.2)', color: '#a78bfa', background: 'transparent', cursor: (runningBatch || runningSingleId !== null) ? 'not-allowed' : 'pointer' }}
                                >
                                  <Bot size={12} /> Analyze Desk
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            )}

            {/* TABS 5: Data Management */}
            {activeTab === 'data-manage' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Settings size={18} style={{ color: 'var(--accent-blue)' }} /> Data Management (CRUD)
                  </h3>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <button 
                      onClick={() => setDataManageMode('positions')}
                      className={`btn ${dataManageMode === 'positions' ? 'btn-primary' : 'btn-secondary'}`}
                    >
                      Positions
                    </button>
                    <button 
                      onClick={() => setDataManageMode('officials')}
                      className={`btn ${dataManageMode === 'officials' ? 'btn-primary' : 'btn-secondary'}`}
                    >
                      Officials
                    </button>
                  </div>
                </div>

                {crudMessage && (
                  <div style={{ padding: '1rem', marginBottom: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    {crudMessage}
                  </div>
                )}

                {/* Controls */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <input 
                    type="text" 
                    className="admin-search-input" 
                    style={{ maxWidth: '300px' }}
                    placeholder={`Search ${dataManageMode}...`} 
                    value={dataSearch}
                    onChange={(e) => setDataSearch(e.target.value)}
                  />
                  <button 
                    className="btn btn-primary"
                    onClick={() => {
                      if (dataManageMode === 'positions') {
                        setEditingPosition({ title: '', department_id: 1, region_id: 1, current_official_id: '' });
                        setIsAddingPosition(true);
                      } else {
                        setEditingOfficial({ first_name: '', last_name: '', service_cadre: '', biodata: '', image_url: '' });
                        setIsAddingOfficial(true);
                      }
                    }}
                  >
                    + Add {dataManageMode === 'positions' ? 'Position' : 'Official'}
                  </button>
                </div>

                {/* Table View */}
                <div className="glass-card" style={{ background: '#0e0d1a', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 'var(--radius-lg)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left', color: 'var(--text-muted)' }}>
                        <th style={{ padding: '1rem 0.5rem' }}>ID</th>
                        <th style={{ padding: '1rem 0.5rem' }}>Name/Title</th>
                        <th style={{ padding: '1rem 0.5rem' }}>Details</th>
                        <th style={{ padding: '1rem 0.5rem', textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dataManageMode === 'positions' ? 
                        positions.filter(p => p.position_title && p.position_title.toLowerCase().includes(dataSearch.toLowerCase())).map(p => (
                          <tr key={p.position_id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                            <td style={{ padding: '0.75rem 0.5rem' }}>{p.position_id}</td>
                            <td style={{ padding: '0.75rem 0.5rem', fontWeight: 600 }}>{p.position_title}</td>
                            <td style={{ padding: '0.75rem 0.5rem', color: 'var(--text-muted)' }}>
                              Dep: {p.department_name} | Official: {p.current_official_name}
                            </td>
                            <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>
                              <button className="btn btn-secondary" style={{ marginRight: '0.5rem', padding: '0.2rem 0.5rem' }} onClick={() => { setEditingPosition(p); setIsAddingPosition(false); }}>Edit</button>
                              <button className="btn btn-danger" style={{ padding: '0.2rem 0.5rem' }} onClick={() => setDeletingRecord({ type: 'position', id: p.position_id, name: p.position_title })}>Del</button>
                            </td>
                          </tr>
                        ))
                      : 
                        officials.filter(o => ((o.first_name || '') + ' ' + (o.last_name || '')).toLowerCase().includes(dataSearch.toLowerCase())).map(o => (
                          <tr key={o.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                            <td style={{ padding: '0.75rem 0.5rem' }}>...{String(o.id).slice(-4)}</td>
                            <td style={{ padding: '0.75rem 0.5rem', fontWeight: 600 }}>{o.first_name} {o.last_name}</td>
                            <td style={{ padding: '0.75rem 0.5rem', color: 'var(--text-muted)' }}>
                              Cadre: {o.service_cadre}
                            </td>
                            <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>
                              <button className="btn btn-secondary" style={{ marginRight: '0.5rem', padding: '0.2rem 0.5rem' }} onClick={() => { setEditingOfficial(o); setIsAddingOfficial(false); }}>Edit</button>
                              <button className="btn btn-danger" style={{ padding: '0.2rem 0.5rem' }} onClick={() => setDeletingRecord({ type: 'official', id: o.id, name: `${o.first_name} ${o.last_name}` })}>Del</button>
                            </td>
                          </tr>
                        ))
                      }
                    </tbody>
                  </table>
                </div>

                {/* Edit/Add Official Modal */}
                {editingOfficial && (
                  <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="glass-card" style={{ background: '#0e0d1a', width: '500px', padding: '2rem', borderRadius: 'var(--radius-lg)' }}>
                      <h3 style={{ marginTop: 0 }}>{isAddingOfficial ? 'Add New Official' : 'Edit Official'}</h3>
                      <input className="admin-search-input" style={{ width: '100%', marginBottom: '1rem' }} placeholder="First Name" value={editingOfficial.first_name || ''} onChange={e => setEditingOfficial({...editingOfficial, first_name: e.target.value})} />
                      <input className="admin-search-input" style={{ width: '100%', marginBottom: '1rem' }} placeholder="Last Name" value={editingOfficial.last_name || ''} onChange={e => setEditingOfficial({...editingOfficial, last_name: e.target.value})} />
                      <input className="admin-search-input" style={{ width: '100%', marginBottom: '1rem' }} placeholder="Service Cadre" value={editingOfficial.service_cadre || ''} onChange={e => setEditingOfficial({...editingOfficial, service_cadre: e.target.value})} />
                      <input className="admin-search-input" style={{ width: '100%', marginBottom: '1rem' }} placeholder="Image URL" value={editingOfficial.image_url || ''} onChange={e => setEditingOfficial({...editingOfficial, image_url: e.target.value})} />
                      <textarea className="admin-search-input" style={{ width: '100%', marginBottom: '1rem', minHeight: '80px' }} placeholder="Biodata" value={editingOfficial.biodata || ''} onChange={e => setEditingOfficial({...editingOfficial, biodata: e.target.value})} />
                      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                        <button className="btn btn-secondary" onClick={() => setEditingOfficial(null)}>Cancel</button>
                        <button className="btn btn-primary" onClick={() => handleSaveOfficial(editingOfficial)}>Save</button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Edit/Add Position Modal */}
                {editingPosition && (
                  <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="glass-card" style={{ background: '#0e0d1a', width: '500px', padding: '2rem', borderRadius: 'var(--radius-lg)' }}>
                      <h3 style={{ marginTop: 0 }}>{isAddingPosition ? 'Add New Position' : 'Edit Position'}</h3>
                      <input className="admin-search-input" style={{ width: '100%', marginBottom: '1rem' }} placeholder="Position Title" value={editingPosition.title || editingPosition.position_title || ''} onChange={e => setEditingPosition({...editingPosition, title: e.target.value, position_title: e.target.value})} />
                      <div style={{ marginBottom: '1rem' }}>
                        <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Department ID</label>
                        <input type="number" className="admin-search-input" style={{ width: '100%' }} value={editingPosition.department_id || ''} onChange={e => setEditingPosition({...editingPosition, department_id: parseInt(e.target.value)})} />
                      </div>
                      <div style={{ marginBottom: '1rem' }}>
                        <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Region ID</label>
                        <input type="number" className="admin-search-input" style={{ width: '100%' }} value={editingPosition.region_id || ''} onChange={e => setEditingPosition({...editingPosition, region_id: parseInt(e.target.value)})} />
                      </div>
                      <div style={{ marginBottom: '1rem' }}>
                        <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Current Official ID</label>
                        <select className="admin-search-input" style={{ width: '100%' }} value={editingPosition.current_official_id || ''} onChange={e => setEditingPosition({...editingPosition, current_official_id: e.target.value})}>
                          <option value="">Vacant</option>
                          {officials.map(o => (
                            <option key={o.id} value={o.id}>{o.first_name} {o.last_name}</option>
                          ))}
                        </select>
                      </div>
                      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                        <button className="btn btn-secondary" onClick={() => setEditingPosition(null)}>Cancel</button>
                        <button className="btn btn-primary" onClick={() => handleSavePosition({
                          id: editingPosition.id || editingPosition.position_id,
                          title: editingPosition.title || editingPosition.position_title,
                          department_id: editingPosition.department_id,
                          region_id: editingPosition.region_id,
                          current_official_id: editingPosition.current_official_id || null
                        })}>Save</button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Delete Confirmation Modal */}
                {deletingRecord && (
                  <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="glass-card" style={{ background: '#0e0d1a', width: '400px', padding: '2rem', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>
                      <AlertTriangle size={32} style={{ color: 'var(--accent-red)', margin: '0 auto 1rem auto' }} />
                      <h3 style={{ marginTop: 0 }}>Confirm Deletion</h3>
                      <p style={{ color: 'var(--text-secondary)' }}>Are you sure you want to delete the {deletingRecord.type} <strong>{deletingRecord.name}</strong>? This action cannot be undone.</p>
                      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1.5rem' }}>
                        <button className="btn btn-secondary" onClick={() => setDeletingRecord(null)}>Cancel</button>
                        <button className="btn btn-danger" onClick={handleDeleteRecord}>Yes, Delete</button>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            )}

          </div>
        )}

      </main>
    </div>
  );
}
