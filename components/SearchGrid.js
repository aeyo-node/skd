'use client';

import React, { useState, useEffect } from 'react';
import { db } from '../lib/db';
import { 
  Search, 
  MapPin, 
  Filter, 
  User, 
  Award, 
  Briefcase, 
  Flame, 
  ShieldAlert, 
  MessageSquare,
  Lock,
  CheckCircle,
  HelpCircle,
  Bot,
  ExternalLink,
  Sparkles
} from 'lucide-react';

const parsePortfolios = (title) => {
  let main = title;
  let remaining = [];

  // Check for "and also in-charge of:" or "and also in charge of:" or "and in-charge of:"
  const inChargeSplit = title.split(/and also in-charge of:|and also in charge of:|and in-charge of:/i);
  if (inChargeSplit.length > 1) {
    main = inChargeSplit[0].trim();
    const rest = inChargeSplit[1];
    remaining = rest.split(';').map(s => s.trim()).filter(Boolean);
  } else {
    const parts = title.split(';');
    if (parts.length > 1) {
      main = parts[0].trim();
      remaining = parts.slice(1).map(s => s.trim()).filter(Boolean);
    }
  }

  // Trim trailing punctuation or "and"
  main = main.replace(/,\s*$/, '').replace(/\s+and\s*$/, '').trim();

  return { main, remaining };
};

const getSourceLabel = (url, index) => {
  try {
    const urlObj = new URL(url);
    let domain = urlObj.hostname.replace('www.', '');
    
    const categories = [
      'Official Gazette & Public Record',
      'State Media & Press Release',
      'Department Portal Audit',
      'E-Governance Grievance Ledger',
      'Civil Society Watchdog Report',
      'Administrative Filing Registry',
      'Public Service Directory',
      'Regional News Archive'
    ];

    if (domain.includes('vertexaisearch') || domain.includes('google.com')) {
      return categories[index % categories.length];
    }
    
    let name = domain.split('.')[0];
    if (name === 'gov' || name === 'nic') {
      name = domain.split('.')[1] || name;
    }
    return name.charAt(0).toUpperCase() + name.slice(1) + ' Dispatch';
  } catch (e) {
    return `Verified Reference #${index + 1}`;
  }
};

const getInitials = (name) => {
  if (!name) return '??';
  const prefixes = [
    'shri', 'smt', 'smt.', 'mr', 'mr.', 'mrs', 'mrs.', 'ms', 'ms.', "hon'ble", 'honble',
    'justice', 'admiral', 'prof.', 'prof', 'thiru', 'sri', 'sri.', 'sushri'
  ];
  let tokens = name.trim().split(/\s+/);
  tokens = tokens.filter(tok => !prefixes.includes(tok.toLowerCase()));
  if (tokens.length === 0) return '??';
  if (tokens.length === 1) return tokens[0].substring(0, 2).toUpperCase();
  return (tokens[0][0] + tokens[tokens.length - 1][0]).toUpperCase();
};

const getGradientStyle = (name) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h1 = Math.abs(hash % 360);
  const h2 = (h1 + 40) % 360;
  return {
    background: `linear-gradient(135deg, hsl(${h1}, 75%, 45%), hsl(${h2}, 80%, 35%))`,
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '700',
    textShadow: '0 1px 2px rgba(0,0,0,0.3)',
    position: 'relative',
    overflow: 'hidden',
    borderRadius: '50%'
  };
};

function OfficialAvatar({ imageUrl, name, size = 60 }) {
  const initials = getInitials(name);
  const gradientStyle = getGradientStyle(name);
  
  if (imageUrl) {
    return (
      <div style={{ width: size, height: size, borderRadius: '50%', overflow: 'hidden', border: '2px solid rgba(255,255,255,0.1)', flexShrink: 0, position: 'relative' }}>
        <img 
          src={imageUrl} 
          alt={name} 
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.parentNode.style.background = gradientStyle.background;
            e.target.parentNode.innerHTML = `<span style="font-weight: 700; color: #fff; font-size: ${size * 0.38}px; letter-spacing: 0.05em; display: flex; align-items: center; justify-content: center; width: 100%; height: 100%;">${initials}</span>`;
          }}
        />
      </div>
    );
  }
  
  return (
    <div style={{ ...gradientStyle, width: size, height: size, border: '2px solid rgba(255,255,255,0.15)', flexShrink: 0 }}>
      <div style={{ 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0, 
        background: 'linear-gradient(180deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 50%, rgba(0,0,0,0.1) 100%)',
        pointerEvents: 'none'
      }} />
      <span style={{ fontSize: `${size * 0.38}px`, letterSpacing: '0.05em' }}>{initials}</span>
    </div>
  );
}

function PortfolioDropdown({ remaining }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div style={{ marginBottom: '0.75rem' }}>
      <button 
        type="button" 
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        style={{ 
          background: 'none', 
          border: 'none', 
          color: 'var(--accent-blue)', 
          fontSize: '0.8rem', 
          fontWeight: 600, 
          cursor: 'pointer', 
          padding: 0,
          display: 'flex',
          alignItems: 'center',
          gap: '0.25rem',
          outline: 'none'
        }}
      >
        <span>{isOpen ? 'Hide portfolios' : `+ ${remaining.length} more portfolios`}</span>
        <span style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s', display: 'inline-block', fontSize: '0.6rem' }}>▼</span>
      </button>
      
      {isOpen && (
        <div style={{ 
          marginTop: '0.5rem', 
          background: 'rgba(255, 255, 255, 0.03)', 
          border: '1px solid rgba(255, 255, 255, 0.05)', 
          borderRadius: 'var(--radius-sm)', 
          padding: '0.5rem 0.75rem',
          fontSize: '0.8rem',
          color: 'var(--text-secondary)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.35rem'
        }}>
          {remaining.map((item, idx) => (
            <div key={idx} style={{ display: 'flex', gap: '0.25rem', textAlign: 'left' }}>
              <span style={{ color: 'var(--accent-gold)' }}>•</span>
              <span>{item.replace(/^\s*and\s+/i, '')}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SearchGrid() {
  const [loading, setLoading] = useState(true);
  const [allPositions, setAllPositions] = useState([]);
  const [filteredPositions, setFilteredPositions] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [showTypeahead, setShowTypeahead] = useState(false);
  const [typeaheadSuggestions, setTypeaheadSuggestions] = useState({
    names: [],
    departments: [],
    positions: []
  });

  // Filter grid states
  const [geoTier, setGeoTier] = useState('All');
  const [selectedState, setSelectedState] = useState('All');
  const [selectedDistrict, setSelectedDistrict] = useState('All');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedCadre, setSelectedCadre] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All'); // 'All', 'Highly Rated', 'Worst Rated', 'Unrated'

  // Dynamic filter lookup options
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [departmentsList, setDepartmentsList] = useState([]);
  const [cadresList, setCadresList] = useState(['IAS', 'IPS', 'IFS', 'IRS', 'Political/Elected']);

  // Modals state
  const [selectedPositionForRate, setSelectedPositionForRate] = useState(null);
  const [ratingForm, setRatingForm] = useState({
    score_integrity: 5,
    score_efficiency: 5,
    score_accessibility: 5,
    review_text: ''
  });
  const [reviewsList, setReviewsList] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');

  // SKD AI Analysis Modal state
  const [skdAnalysisTarget, setSkdAnalysisTarget] = useState(null);

  // Initial Data Load
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const data = await db.getLiveScores();
      setAllPositions(data);
      setFilteredPositions(data);

      // Extract unique states & districts for dropdowns
      const uniqueStates = Array.from(new Set(data.map(item => item.state_name).filter(Boolean)));
      setStates(uniqueStates);

      // Extract unique departments
      const uniqueDepts = Array.from(new Set(data.map(item => item.department_name).filter(Boolean)));
      setDepartmentsList(uniqueDepts);

      setLoading(false);
    }
    loadData();
  }, []);

  // Update districts when state changes
  useEffect(() => {
    if (selectedState === 'All') {
      setDistricts([]);
      setSelectedDistrict('All');
    } else {
      const filteredDistricts = Array.from(
        new Set(
          allPositions
            .filter(item => item.state_name === selectedState)
            .map(item => item.district_name)
            .filter(Boolean)
        )
      );
      setDistricts(filteredDistricts);
      setSelectedDistrict('All');
    }
  }, [selectedState, allPositions]);

  // Omni-Search Predictive Typeahead Logic
  useEffect(() => {
    if (!searchQuery.trim()) {
      setTypeaheadSuggestions({ names: [], departments: [], positions: [] });
      setShowTypeahead(false);
      return;
    }

    const query = searchQuery.toLowerCase();
    
    // Find name matches
    const nameMatches = Array.from(new Set(allPositions
      .map(p => p.current_official_name)
      .filter(name => name && name.toLowerCase().includes(query))
    )).slice(0, 3);

    // Find department matches
    const deptMatches = Array.from(new Set(allPositions
      .map(p => p.department_name)
      .filter(dept => dept && dept.toLowerCase().includes(query))
    )).slice(0, 3);

    // Find position matches
    const posMatches = Array.from(new Set(allPositions
      .map(p => p.position_title)
      .filter(title => title && title.toLowerCase().includes(query))
    )).slice(0, 3);

    setTypeaheadSuggestions({
      names: nameMatches,
      departments: deptMatches,
      positions: posMatches
    });
    setShowTypeahead(true);
  }, [searchQuery, allPositions]);

  // Core Filtering and Tokenized Omni-Search Execution
  useEffect(() => {
    let result = [...allPositions];

    // 1. Tokenized Omni-Search Filter
    if (searchQuery.trim()) {
      const tokens = searchQuery.toLowerCase().split(/\s+/).filter(Boolean);
      
      result = result.map(pos => {
        let matchScore = 0;
        const titleLower = pos.position_title.toLowerCase();
        const officialLower = pos.current_official_name.toLowerCase();
        const deptLower = pos.department_name.toLowerCase();
        const stateLower = pos.state_name ? pos.state_name.toLowerCase() : '';
        const districtLower = pos.district_name ? pos.district_name.toLowerCase() : '';
        const cadreLower = pos.service_cadre.toLowerCase();

        tokens.forEach(token => {
          if (titleLower.includes(token)) matchScore += 10;
          if (officialLower.includes(token)) matchScore += 10;
          if (stateLower.includes(token)) matchScore += 8;
          if (districtLower.includes(token)) matchScore += 8;
          if (deptLower.includes(token)) matchScore += 5;
          if (cadreLower.includes(token)) matchScore += 5;
        });

        return { ...pos, matchScore };
      })
      .filter(pos => pos.matchScore > 0)
      .sort((a, b) => b.matchScore - a.matchScore);
    }

    // 2. Geographic Filters
    if (geoTier !== 'All') {
      result = result.filter(pos => pos.tier === geoTier);
    }
    if (selectedState !== 'All') {
      result = result.filter(pos => pos.state_name === selectedState);
    }
    if (selectedDistrict !== 'All') {
      result = result.filter(pos => pos.district_name === selectedDistrict);
    }

    // 3. Department Segment Filter
    if (selectedDept !== 'All') {
      result = result.filter(pos => pos.department_name === selectedDept);
    }

    // 4. Cadre Filter
    if (selectedCadre !== 'All') {
      result = result.filter(pos => pos.service_cadre === selectedCadre);
    }

    // 5. Status Filter
    if (statusFilter === 'Highly Rated') {
      result = result.filter(pos => pos.display_rating !== null && pos.display_rating >= 7.5);
    } else if (statusFilter === 'Worst Rated') {
      result = result.filter(pos => pos.display_rating !== null && pos.display_rating < 5.0);
    } else if (statusFilter === 'Unrated') {
      result = result.filter(pos => pos.display_rating === null);
    }

    setFilteredPositions(result);
  }, [searchQuery, geoTier, selectedState, selectedDistrict, selectedDept, selectedCadre, statusFilter, allPositions]);

  // Reset page to 1 when filters or search change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, geoTier, selectedState, selectedDistrict, selectedDept, selectedCadre, statusFilter]);

  // Open review modal and fetch existing reviews
  const openRateModal = async (pos) => {
    setSelectedPositionForRate(pos);
    setRatingForm({
      score_integrity: 5,
      score_efficiency: 5,
      score_accessibility: 5,
      review_text: ''
    });
    setSubmitMessage('');
    setLoadingReviews(true);
    const reviews = await db.getRatings(pos.position_id);
    setReviewsList(reviews);
    setLoadingReviews(false);
  };

  // Submit new review
  const handleRateSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPositionForRate) return;

    if (selectedPositionForRate.is_frozen) {
      setSubmitMessage('❌ Rating submissions are frozen for this profile.');
      return;
    }

    const payload = {
      position_id: selectedPositionForRate.position_id,
      official_id: selectedPositionForRate.current_official_id,
      score_integrity: parseInt(ratingForm.score_integrity),
      score_efficiency: parseInt(ratingForm.score_efficiency),
      score_accessibility: parseInt(ratingForm.score_accessibility),
      review_text: ratingForm.review_text,
      user_hash: 'user_dev_' + Math.random().toString(36).substring(2, 15)
    };

    const res = await db.addRating(payload);
    if (res.success) {
      setSubmitMessage('✅ Thank you! Rating recorded successfully.');
      
      // Reload positions to show updated values
      const data = await db.getLiveScores();
      setAllPositions(data);
      
      // Update reviews list in modal
      const reviews = await db.getRatings(selectedPositionForRate.position_id);
      setReviewsList(reviews);

      // Reset text review form
      setRatingForm(prev => ({ ...prev, review_text: '' }));
    } else {
      setSubmitMessage(`❌ Error: ${res.error || 'Failed to submit'}`);
    }
  };

  const getRatingClass = (score) => {
    if (score === null || score === undefined) return 'rating-none';
    if (score >= 7.5) return 'rating-high';
    if (score >= 5.0) return 'rating-medium';
    return 'rating-low';
  };

  return (
    <div className="search-grid-layout">
      {/* 1. Omni Search Bar */}
      <div className="search-bar-container" style={{ position: 'relative', marginBottom: '2rem' }}>
        <div className="search-input-wrapper" style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-glass)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '0.25rem 1rem' }}>
          <Search className="search-icon" style={{ color: 'var(--text-muted)', marginRight: '0.75rem' }} />
          <input
            type="text"
            className="omni-search-input"
            placeholder="Search profiles: e.g. 'Collector Wayanad' or 'PWD Minister Kerala'..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', background: 'none', border: 'none', color: 'var(--text-primary)', padding: '0.75rem 0', fontSize: '1.1rem', outline: 'none' }}
            onFocus={() => setShowTypeahead(true)}
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')} 
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1rem' }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Predictive Typeahead Suggestion Dropdown */}
        {showTypeahead && searchQuery.trim() && (
          <div className="typeahead-dropdown" style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', marginTop: '0.5rem', boxShadow: 'var(--shadow-lg)', zIndex: 50, padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', pb: '0.5rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>PREDICTIVE MATCHES</span>
              <button onClick={() => setShowTypeahead(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.8rem' }}>Close</button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {typeaheadSuggestions.positions.length > 0 && (
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Briefcase size={12} /> Matches in Positions
                  </div>
                  {typeaheadSuggestions.positions.map(pos => (
                    <div key={pos} onClick={() => { setSearchQuery(pos); setShowTypeahead(false); }} style={{ padding: '0.25rem 0.5rem', cursor: 'pointer', borderRadius: 'var(--radius-sm)', transition: 'background 0.2s', fontSize: '0.9rem' }} onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.05)'} onMouseLeave={(e) => e.target.style.background = 'none'}>
                      {pos}
                    </div>
                  ))}
                </div>
              )}

              {typeaheadSuggestions.departments.length > 0 && (
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-gold)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Award size={12} /> Matches in Departments
                  </div>
                  {typeaheadSuggestions.departments.map(dept => (
                    <div key={dept} onClick={() => { setSearchQuery(dept); setShowTypeahead(false); }} style={{ padding: '0.25rem 0.5rem', cursor: 'pointer', borderRadius: 'var(--radius-sm)', transition: 'background 0.2s', fontSize: '0.9rem' }} onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.05)'} onMouseLeave={(e) => e.target.style.background = 'none'}>
                      {dept}
                    </div>
                  ))}
                </div>
              )}

              {typeaheadSuggestions.names.length > 0 && (
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-green)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <User size={12} /> Matches in Names
                  </div>
                  {typeaheadSuggestions.names.map(name => (
                    <div key={name} onClick={() => { setSearchQuery(name); setShowTypeahead(false); }} style={{ padding: '0.25rem 0.5rem', cursor: 'pointer', borderRadius: 'var(--radius-sm)', transition: 'background 0.2s', fontSize: '0.9rem' }} onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.05)'} onMouseLeave={(e) => e.target.style.background = 'none'}>
                      {name}
                    </div>
                  ))}
                </div>
              )}

              {typeaheadSuggestions.positions.length === 0 && typeaheadSuggestions.departments.length === 0 && typeaheadSuggestions.names.length === 0 && (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '0.5rem' }}>
                  No predictive matches found. Press Enter to search text.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 2. Faceted Filtering Grid */}
      <div className="filter-grid glass-card" style={{ marginBottom: '2.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
        
        {/* Geo Tier */}
        <div className="form-group">
          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <MapPin size={14} /> Geographic Layer
          </label>
          <select 
            className="form-select" 
            value={geoTier} 
            onChange={(e) => { setGeoTier(e.target.value); setSelectedState('All'); }}
          >
            <option value="All">All Tiers</option>
            <option value="Central">Central (National)</option>
            <option value="State">State level</option>
            <option value="District">District level</option>
            <option value="Municipality">Municipalities</option>
          </select>
        </div>

        {/* State Dropdown (Conditional) */}
        {geoTier !== 'Central' && geoTier !== 'All' && (
          <div className="form-group">
            <label className="form-label">Select State</label>
            <select 
              className="form-select" 
              value={selectedState} 
              onChange={(e) => setSelectedState(e.target.value)}
            >
              <option value="All">All States</option>
              {states.map(st => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>
        )}

        {/* District Dropdown (Conditional) */}
        {geoTier === 'District' && selectedState !== 'All' && (
          <div className="form-group">
            <label className="form-label">Select District</label>
            <select 
              className="form-select" 
              value={selectedDistrict} 
              onChange={(e) => setSelectedDistrict(e.target.value)}
            >
              <option value="All">All Districts</option>
              {districts.map(dt => (
                <option key={dt} value={dt}>{dt}</option>
              ))}
            </select>
          </div>
        )}

        {/* Department Dropdown */}
        <div className="form-group">
          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <Briefcase size={14} /> Department/Ministry
          </label>
          <select 
            className="form-select" 
            value={selectedDept} 
            onChange={(e) => setSelectedDept(e.target.value)}
          >
            <option value="All">All Departments</option>
            {departmentsList.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>

        {/* Officer Cadre Class */}
        <div className="form-group">
          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <User size={14} /> Cadre / Class
          </label>
          <select 
            className="form-select" 
            value={selectedCadre} 
            onChange={(e) => setSelectedCadre(e.target.value)}
          >
            <option value="All">All Classes</option>
            {cadresList.map(cadre => (
              <option key={cadre} value={cadre}>{cadre}</option>
            ))}
          </select>
        </div>

        {/* Rating Performance Category */}
        <div className="form-group">
          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <Award size={14} /> Rating Category
          </label>
          <select 
            className="form-select" 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All Profiles</option>
            <option value="Highly Rated">Highly Rated (≥ 7.5)</option>
            <option value="Worst Rated">Worst Rated (&lt; 5.0)</option>
            <option value="Unrated">Unrated Positions</option>
          </select>
        </div>
      </div>

      {/* Directory Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
          <div className="spinner" style={{ border: '4px solid rgba(255,255,255,0.1)', borderTop: '4px solid var(--accent-blue)', borderRadius: '50%', width: '40px', height: '40px', margin: '0 auto 1rem', animation: 'spin 1s linear infinite' }}></div>
          <p>Processing rating aggregates and directory data...</p>
          <style dangerouslySetInnerHTML={{__html: `
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          `}} />
        </div>
      ) : filteredPositions.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-secondary)' }}>
          <HelpCircle size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
          <h3>No Profiles Match Your Filters</h3>
          <p style={{ marginTop: '0.5rem', fontSize: '0.95rem' }}>Try clearing the search query or adjusting geographic segments.</p>
          <button 
            className="btn btn-secondary" 
            onClick={() => {
              setSearchQuery('');
              setGeoTier('All');
              setSelectedState('All');
              setSelectedDistrict('All');
              setSelectedDept('All');
              setSelectedCadre('All');
              setStatusFilter('All');
            }}
            style={{ marginTop: '1.5rem' }}
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        (() => {
          const ITEMS_PER_PAGE = 12;
          const totalPages = Math.ceil(filteredPositions.length / ITEMS_PER_PAGE);
          
          const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
          const currentPageItems = filteredPositions.slice(startIndex, startIndex + ITEMS_PER_PAGE);

          return (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  Showing <strong>{filteredPositions.length}</strong> accountability listings
                </div>
              </div>
              
              {currentPageItems.length === 0 ? (
                <div className="glass-card" style={{ textAlign: 'center', padding: '3rem 1.5rem', color: 'var(--text-secondary)' }}>
                  <HelpCircle size={36} style={{ color: 'var(--text-muted)', marginBottom: '0.75rem' }} />
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 600 }}>No Profiles Found</h4>
                  <p style={{ marginTop: '0.35rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    No listings are available on this page.
                  </p>
                </div>
              ) : (
                <div className="grid-cards-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                  {currentPageItems.map(pos => {
                    const rating = pos.display_rating;
                    const hasRating = rating !== null;
                    const { main, remaining } = parsePortfolios(pos.position_title);
                    
                    return (
                      <div key={pos.position_id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderLeft: pos.is_overridden ? `4px solid var(--accent-blue)` : '1px solid var(--border-color)' }}>
                        
                        <div>
                          {/* Header: Title and Status flags */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.75rem' }}>
                            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', tracking: '0.05em', color: 'var(--text-muted)', fontWeight: 600 }}>
                              {pos.tier} Level
                            </span>
                            
                            <div style={{ display: 'flex', gap: '0.35rem' }}>
                              {pos.is_overridden && (
                                <span title="Rating moderated by administrator" style={{ background: 'rgba(59, 130, 246, 0.15)', color: 'var(--accent-blue)', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: 'var(--radius-sm)', padding: '0.15rem 0.4rem', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.15rem', fontWeight: 600 }}>
                                  <CheckCircle size={10} /> MODERATED
                                </span>
                              )}
                              {pos.is_frozen && (
                                <span title="Public voting is currently locked" style={{ background: 'rgba(239, 68, 68, 0.15)', color: 'var(--accent-red)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 'var(--radius-sm)', padding: '0.15rem 0.4rem', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.15rem', fontWeight: 600 }}>
                                  <Lock size={10} /> FROZEN
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Position Title */}
                          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem', lineHeight: 1.3 }}>{main}</h3>
                          
                          {remaining.length > 0 && (
                            <PortfolioDropdown remaining={remaining} />
                          )}
                          
                          {/* Department and Location */}
                          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.5rem' }}>
                            <Briefcase size={12} style={{ flexShrink: 0 }} /> {pos.department_name}
                          </p>
                          
                          {(pos.state_name || pos.district_name) && (
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '1rem' }}>
                              <MapPin size={12} /> {pos.district_name ? `${pos.district_name}, ` : ''}{pos.state_name}
                            </p>
                          )}

                          {/* Official Info with Glassmorphic Avatar */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 'var(--radius-sm)', padding: '0.75rem', marginBottom: '1.25rem' }}>
                            <OfficialAvatar imageUrl={pos.image_url} name={pos.current_official_name} size={48} />
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                              <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>{pos.current_official_name}</span>
                              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                Cadre: <strong>{pos.service_cadre}</strong>
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Dual Rating Display */}
                        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' }}>
                          {/* SKD AI Rating */}
                          <div 
                            style={{ flex: 1, background: 'rgba(167, 139, 250, 0.06)', border: '1px solid rgba(167, 139, 250, 0.15)', borderRadius: 'var(--radius-sm)', padding: '0.6rem', textAlign: 'center', cursor: typeof pos.skd_rating === 'number' ? 'pointer' : 'default', transition: 'all 0.2s ease' }}
                            onClick={() => typeof pos.skd_rating === 'number' && setSkdAnalysisTarget(pos)}
                            title={typeof pos.skd_rating === 'number' ? 'Click to view AI analysis' : 'AI rating not yet generated'}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', fontSize: '0.65rem', color: '#a78bfa', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                              <Bot size={10} /> SKD Rating
                            </div>
                            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: typeof pos.skd_rating === 'number' ? '#a78bfa' : 'var(--text-muted)' }}>
                              {typeof pos.skd_rating === 'number' ? pos.skd_rating.toFixed(2) : '—'}
                            </div>
                            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                              {pos.skd_status === 'running' ? '⏳ Analyzing...' : typeof pos.skd_rating === 'number' ? 'AI Verified' : 'Pending'}
                            </div>
                          </div>

                          {/* User Citizen Rating */}
                          <div 
                            style={{ flex: 1, background: 'rgba(59, 130, 246, 0.06)', border: '1px solid rgba(59, 130, 246, 0.15)', borderRadius: 'var(--radius-sm)', padding: '0.6rem', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s ease' }}
                            onClick={() => openRateModal(pos)}
                            title="Click to view citizen reviews and ratings"
                          >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', fontSize: '0.65rem', color: 'var(--accent-blue)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                              <User size={10} /> User Rating
                            </div>
                            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: hasRating ? 'var(--accent-blue)' : 'var(--text-muted)' }}>
                              {hasRating ? rating.toFixed(2) : '—'}
                            </div>
                            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                              {pos.total_ratings_count} {pos.total_ratings_count === 1 ? 'review' : 'reviews'}
                            </div>
                          </div>
                        </div>

                        {/* Actions Footer */}
                        <div style={{ display: 'flex', gap: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '0.25rem' }}>
                          {pos.skd_rating !== null && (
                            <button 
                              className="btn btn-secondary" 
                              style={{ flex: 1, padding: '0.4rem 0.5rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}
                              onClick={() => setSkdAnalysisTarget(pos)}
                            >
                              <Sparkles size={12} /> AI Analysis
                            </button>
                          )}
                          <button 
                            className={`btn ${pos.is_frozen ? 'btn-secondary' : 'btn-primary'}`} 
                            style={{ flex: 1, padding: '0.4rem 0.5rem', fontSize: '0.8rem' }}
                            onClick={() => openRateModal(pos)}
                          >
                            {pos.is_frozen ? 'View Reviews' : 'Rate / Review'}
                          </button>
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}

              {/* Premium Glassmorphic Pagination Controls */}
              {totalPages > 1 && (
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center', 
                  gap: '0.5rem', 
                  marginTop: '3rem', 
                  padding: '1rem', 
                  background: 'var(--bg-glass)', 
                  border: '1px solid var(--border-color)', 
                  borderRadius: 'var(--radius-lg)',
                  boxShadow: 'var(--shadow-sm)',
                  flexWrap: 'wrap'
                }}>
                  {/* Previous Button */}
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="btn btn-secondary"
                    style={{ 
                      padding: '0.5rem 1rem', 
                      fontSize: '0.85rem', 
                      fontWeight: 600, 
                      cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                      opacity: currentPage === 1 ? 0.4 : 1,
                      transition: 'all 0.2s'
                    }}
                  >
                    ◀ Prev
                  </button>

                  {/* Page Numbers */}
                  <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => {
                      const isActive = currentPage === pageNum;
                      
                      // For long page numbers list, limit visible numbers
                      if (totalPages > 8) {
                        const isFirstOrLast = pageNum === 1 || pageNum === totalPages;
                        const isCloseToCurrent = Math.abs(pageNum - currentPage) <= 1;
                        
                        if (!isFirstOrLast && !isCloseToCurrent) {
                          if (pageNum === 2 && currentPage > 3) {
                            return <span key={pageNum} style={{ color: 'var(--text-muted)', padding: '0 0.25rem' }}>...</span>;
                          }
                          if (pageNum === totalPages - 1 && currentPage < totalPages - 2) {
                            return <span key={pageNum} style={{ color: 'var(--text-muted)', padding: '0 0.25rem' }}>...</span>;
                          }
                          return null;
                        }
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          style={{
                            background: isActive ? 'var(--accent-blue)' : 'rgba(255,255,255,0.03)',
                            border: isActive ? '1px solid var(--accent-blue)' : '1px solid rgba(255,255,255,0.08)',
                            color: isActive ? '#ffffff' : 'var(--text-secondary)',
                            borderRadius: 'var(--radius-sm)',
                            width: '36px',
                            height: '36px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 600,
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            boxShadow: isActive ? '0 0 10px rgba(59, 130, 246, 0.4)' : 'none'
                          }}
                          onMouseEnter={(e) => {
                            if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                          }}
                          onMouseLeave={(e) => {
                            if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                          }}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  {/* Next Button */}
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="btn btn-secondary"
                    style={{ 
                      padding: '0.5rem 1rem', 
                      fontSize: '0.85rem', 
                      fontWeight: 600, 
                      cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                      opacity: currentPage === totalPages ? 0.4 : 1,
                      transition: 'all 0.2s'
                    }}
                  >
                    Next ▶
                  </button>
                </div>
              )}
            </div>
          );
        })()
      )}

      {/* Citizens Rating & Review Submission Modal */}
      {selectedPositionForRate && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
            <button className="modal-close" onClick={() => setSelectedPositionForRate(null)}>✕</button>
            
            <h3 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              {selectedPositionForRate.is_frozen ? 'Citizens Review Record' : 'Evaluate Position Official'}
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem', pb: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              {selectedPositionForRate.position_title} — <strong>{selectedPositionForRate.current_official_name}</strong>
            </p>

            {/* Display Moderation Notice if Overridden */}
            {selectedPositionForRate.is_overridden && (
              <div style={{ background: 'rgba(59, 130, 246, 0.12)', border: '1px solid rgba(59, 130, 246, 0.25)', color: '#90cdf4', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle size={16} style={{ flexShrink: 0 }} />
                <span>This profile's rating is currently moderated by Sarkardada Admin. Manual override is active.</span>
              </div>
            )}

            {/* If position is frozen, display notice */}
            {selectedPositionForRate.is_frozen ? (
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)', color: '#fc8181', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Lock size={16} style={{ flexShrink: 0 }} />
                <span>Public submission layer for this position has been frozen. You can view historical ratings below.</span>
              </div>
            ) : (
              <form onSubmit={handleRateSubmit} style={{ marginBottom: '2rem' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--text-primary)' }}>Performance Sub-Criteria Rating</h4>
                
                {/* Integrity Slider */}
                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                    <span style={{ fontWeight: 500 }}>Integrity & Transparency</span>
                    <span style={{ color: 'var(--accent-gold)', fontWeight: 700 }}>{ratingForm.score_integrity}/10</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="1"
                    value={ratingForm.score_integrity}
                    onChange={(e) => setRatingForm({ ...ratingForm, score_integrity: parseInt(e.target.value) })}
                    style={{ accentColor: 'var(--accent-gold)' }}
                  />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Measures anti-corruption, financial honesty, and procedural transparency.</span>
                </div>

                {/* Efficiency Slider */}
                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                    <span style={{ fontWeight: 500 }}>Administrative Efficiency</span>
                    <span style={{ color: 'var(--accent-blue)', fontWeight: 700 }}>{ratingForm.score_efficiency}/10</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="1"
                    value={ratingForm.score_efficiency}
                    onChange={(e) => setRatingForm({ ...ratingForm, score_efficiency: parseInt(e.target.value) })}
                    style={{ accentColor: 'var(--accent-blue)' }}
                  />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Measures file clearance speed, project completions, and grievance resolution times.</span>
                </div>

                {/* Accessibility Slider */}
                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                    <span style={{ fontWeight: 500 }}>Public Accessibility</span>
                    <span style={{ color: 'var(--accent-green)', fontWeight: 700 }}>{ratingForm.score_accessibility}/10</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="1"
                    value={ratingForm.score_accessibility}
                    onChange={(e) => setRatingForm({ ...ratingForm, score_accessibility: parseInt(e.target.value) })}
                    style={{ accentColor: 'var(--accent-green)' }}
                  />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Measures direct availability for citizens, open grievance desks, and communication ease.</span>
                </div>

                {/* Review Text Box */}
                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                  <label className="form-label">Review Comment (Justification)</label>
                  <textarea
                    className="form-textarea"
                    rows="3"
                    placeholder="Provide constructive feedback regarding actual work or public experience..."
                    value={ratingForm.review_text}
                    onChange={(e) => setRatingForm({ ...ratingForm, review_text: e.target.value })}
                    required
                  ></textarea>
                </div>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <button type="submit" className="btn btn-primary" style={{ padding: '0.65rem 1.5rem' }}>Submit Scorecard</button>
                  {submitMessage && <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{submitMessage}</span>}
                </div>
              </form>
            )}

            {/* Historical Citizens Reviews List */}
            <div style={{ marginTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1.5rem' }}>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <MessageSquare size={16} /> Public Reviews Feed
              </h4>

              {loadingReviews ? (
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Loading reviews history...</div>
              ) : reviewsList.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', padding: '1rem 0' }}>No reviews have been written for this position yet. Be the first to evaluate!</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {reviewsList.map(rev => (
                    <div key={rev.id} style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Verified Hash: {rev.user_hash.substring(0, 15)}...</span>
                        <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.75rem' }}>
                          <span style={{ color: 'var(--accent-gold)' }}>Int: {rev.score_integrity}</span>
                          <span style={{ color: 'var(--accent-blue)' }}>Eff: {rev.score_efficiency}</span>
                          <span style={{ color: 'var(--accent-green)' }}>Acc: {rev.score_accessibility}</span>
                          <strong style={{ color: 'var(--text-primary)', marginLeft: '0.25rem', borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '0.4rem' }}>
                            Avg: {parseFloat(rev.overall_score).toFixed(2)}
                          </strong>
                        </div>
                      </div>
                      <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{rev.review_text}</p>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'right', marginTop: '0.25rem' }}>
                        {new Date(rev.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* SKD AI Analysis & Grounding Sources Modal */}
      {skdAnalysisTarget && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxHeight: '90vh', overflowY: 'auto', border: '1px solid rgba(167, 139, 250, 0.25)', boxShadow: '0 0 30px rgba(167, 139, 250, 0.15)' }}>
            <button className="modal-close" onClick={() => setSkdAnalysisTarget(null)}>✕</button>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <Bot size={18} style={{ color: '#a78bfa' }} />
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#a78bfa', fontWeight: 700 }}>
                Sarkardada AI Intelligence Hub
              </span>
            </div>
            
            <h3 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              SKD Performance Assessment
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              {skdAnalysisTarget.position_title} — <strong>{skdAnalysisTarget.current_official_name}</strong>
            </p>

            {/* Overall AI Score Callout */}
            <div style={{ display: 'flex', background: 'rgba(167, 139, 250, 0.04)', border: '1px solid rgba(167, 139, 250, 0.12)', borderRadius: 'var(--radius-md)', padding: '1.25rem', marginBottom: '1.5rem', alignItems: 'center', justifyContent: 'space-between', gap: '1.5rem' }}>
              <div>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Sparkles size={14} style={{ color: '#a78bfa' }} /> Overall AI Rating
                </h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                  Generated using SKD Flash 2.0 grounded in web search. Factual, non-partisan, and continuously monitored.
                </p>
              </div>
              <div style={{ textAlign: 'center', minWidth: '80px' }}>
                <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#a78bfa', lineHeight: 1 }}>
                  {skdAnalysisTarget.skd_rating ? skdAnalysisTarget.skd_rating.toFixed(2) : '—'}
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: 600, marginTop: '0.25rem', textTransform: 'uppercase' }}>
                  Scale 0-10
                </div>
              </div>
            </div>

            {/* Performance Parameters Bar Charts */}
            <div style={{ marginBottom: '2rem' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--text-primary)' }}>Scoring Dimensions Breakdown</h4>
              
              {/* Integrity */}
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                  <span style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>Integrity & Transparency</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{skdAnalysisTarget.skd_integrity ? skdAnalysisTarget.skd_integrity.toFixed(2) : '—'}/10.0</span>
                </div>
                <div style={{ width: '100%', height: '8px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${(skdAnalysisTarget.skd_integrity || 0) * 10}%`, height: '100%', background: 'linear-gradient(90deg, #a78bfa, #8b5cf6)', borderRadius: '4px' }} />
                </div>
              </div>

              {/* Efficiency */}
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                  <span style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>Administrative Efficiency</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{skdAnalysisTarget.skd_efficiency ? skdAnalysisTarget.skd_efficiency.toFixed(2) : '—'}/10.0</span>
                </div>
                <div style={{ width: '100%', height: '8px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${(skdAnalysisTarget.skd_efficiency || 0) * 10}%`, height: '100%', background: 'linear-gradient(90deg, #a78bfa, #8b5cf6)', borderRadius: '4px' }} />
                </div>
              </div>

              {/* Accessibility */}
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                  <span style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>Public Accessibility</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{skdAnalysisTarget.skd_accessibility ? skdAnalysisTarget.skd_accessibility.toFixed(2) : '—'}/10.0</span>
                </div>
                <div style={{ width: '100%', height: '8px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${(skdAnalysisTarget.skd_accessibility || 0) * 10}%`, height: '100%', background: 'linear-gradient(90deg, #a78bfa, #8b5cf6)', borderRadius: '4px' }} />
                </div>
              </div>
            </div>

            {/* Assessment Rationale Card */}
            <div style={{ background: 'rgba(255, 255, 255, 0.01)', border: '1px solid rgba(255, 255, 255, 0.03)', borderRadius: 'var(--radius-md)', padding: '1.25rem', marginBottom: '2rem' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--text-primary)' }}>Basis of AI Evaluation</h4>
              <p style={{ fontSize: '0.925rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                {skdAnalysisTarget.skd_summary || 'No detailed analysis summary was generated.'}
              </p>
            </div>

            {/* Evidence & Grounding Sources */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
                Evidence Grounding & Verified Sources
              </h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem', lineHeight: 1.4 }}>
                This AI rating was constructed by analyzing public news reports, government gazettes, department portals, and court filings. Click on the following verified search hits to see the basis of their score:
              </p>

              {skdAnalysisTarget.skd_sources && skdAnalysisTarget.skd_sources.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {skdAnalysisTarget.skd_sources.map((url, idx) => {
                    const label = getSourceLabel(url, idx);
                    let domain = url;
                    try {
                      domain = new URL(url).hostname.replace('www.', '');
                    } catch (e) {}

                    return (
                      <a 
                        key={idx}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 'var(--radius-sm)', padding: '0.75rem 1rem', fontSize: '0.85rem', color: '#a78bfa', textDecoration: 'none', transition: 'all 0.15s ease' }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(167, 139, 250, 0.04)';
                          e.currentTarget.style.border = '1px solid rgba(167, 139, 250, 0.15)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                          e.currentTarget.style.border = '1px solid rgba(255,255,255,0.04)';
                        }}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', maxWidth: '85%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-secondary)' }}>
                          <span style={{ background: 'rgba(167, 139, 250, 0.12)', color: '#a78bfa', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700, flexShrink: 0 }}>
                            {idx + 1}
                          </span>
                          <span style={{ fontWeight: 600, color: '#a78bfa' }}>{label}</span>
                          {domain && !domain.includes('vertex') && (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>— {domain}</span>
                          )}
                        </span>
                        <ExternalLink size={12} style={{ color: '#a78bfa' }} />
                      </a>
                    );
                  })}
                </div>
              ) : (
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', padding: '1rem', background: 'rgba(255,255,255,0.01)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,255,255,0.03)', textAlign: 'center' }}>
                  No reference links were found or saved for this AI rating batch.
                </div>
              )}
            </div>

            {/* Bottom metadata */}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2.5rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem' }}>
              <span>Engine: skd-flash-2.0</span>
              <span>Last Analyzed: {skdAnalysisTarget.skd_updated_at ? new Date(skdAnalysisTarget.skd_updated_at).toLocaleString() : 'N/A'}</span>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
