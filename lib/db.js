import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Check if credentials are valid and not placeholders
const isConfigured = 
  SUPABASE_URL && 
  SUPABASE_URL !== 'https://your-project-id.supabase.co' &&
  SUPABASE_ANON_KEY && 
  SUPABASE_ANON_KEY !== 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your-anon-key';

export const supabase = isConfigured 
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) 
  : null;

// =========================================================================
// MOCK DATA SEED TEMPLATE (For LocalStorage Fallback)
// =========================================================================
const SEED_DATA = {
  geographic_regions: [
    { id: 1, tier: 'Central', state_name: null, district_name: null, local_body_name: null },
    { id: 2, tier: 'State', state_name: 'Kerala', district_name: null, local_body_name: null },
    { id: 3, tier: 'District', state_name: 'Kerala', district_name: 'Wayanad', local_body_name: null },
    { id: 4, tier: 'State', state_name: 'Maharashtra', district_name: null, local_body_name: null },
    { id: 5, tier: 'District', state_name: 'Maharashtra', district_name: 'Pune', local_body_name: null },
    { id: 6, tier: 'Municipality', state_name: 'Maharashtra', district_name: 'Pune', local_body_name: 'Pune Municipal Corporation' }
  ],
  departments: [
    { id: 1, region_id: 1, name: 'Ministry of Railways', code: 'MoR' },
    { id: 2, region_id: 2, name: 'Revenue Department Kerala', code: 'REV-KL' },
    { id: 3, region_id: 2, name: 'Department of Home Affairs Kerala', code: 'HOME-KL' },
    { id: 4, region_id: 3, name: 'Revenue Administration Wayanad', code: 'REV-WYD' },
    { id: 5, region_id: 4, name: 'Department of Home Affairs Maharashtra', code: 'HOME-MH' },
    { id: 6, region_id: 5, name: 'Police Department Pune', code: 'POL-PNE' },
    { id: 7, region_id: 6, name: 'Pune Municipal Administration', code: 'PMC' }
  ],
  officials: [
    {
      id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
      first_name: 'Divya',
      last_name: 'S. Iyer',
      service_cadre: 'IAS',
      batch_year: 2015,
      biodata: 'Dr. Divya S. Iyer is a seasoned civil servant who previously served as district collector and is known for efficient governance and crisis management.',
      is_active: true
    },
    {
      id: 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e',
      first_name: 'Rajesh',
      last_name: 'Kumar',
      service_cadre: 'IPS',
      batch_year: 2010,
      biodata: 'A dedicated police officer specialized in cyber crime prevention and public safety coordination in urban areas.',
      is_active: true
    },
    {
      id: 'c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f',
      first_name: 'Amit',
      last_name: 'Sharma',
      service_cadre: 'IAS',
      batch_year: 2012,
      biodata: 'Experienced administrative officer with a background in rural development and municipal administration.',
      is_active: true
    },
    {
      id: 'd4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f9a',
      first_name: 'K.',
      last_name: 'Sudhakaran',
      service_cadre: 'Political/Elected',
      batch_year: null,
      biodata: 'Elected Member of Legislative Assembly and current PWD Minister of the state.',
      is_active: true
    },
    {
      id: 'e5f6a7b8-c9d0-1e2f-3a4b-5c6d7e8f9a0b',
      first_name: 'Vipin',
      last_name: 'Alok',
      service_cadre: 'IRS',
      batch_year: 2008,
      biodata: 'Joint Commissioner of Income Tax overseeing major tax collections and policy implementations.',
      is_active: true
    }
  ],
  positions: [
    { id: 1, department_id: 4, region_id: 3, title: 'District Collector Wayanad', current_official_id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', is_overridden: false, override_score: null, is_frozen: false },
    { id: 2, department_id: 6, region_id: 5, title: 'Superintendent of Police Pune', current_official_id: 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e', is_overridden: false, override_score: null, is_frozen: false },
    { id: 3, department_id: 7, region_id: 6, title: 'Municipal Commissioner Pune', current_official_id: 'c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f', is_overridden: false, override_score: null, is_frozen: false },
    { id: 4, department_id: 2, region_id: 2, title: 'PWD Minister Kerala', current_official_id: 'd4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f9a', is_overridden: false, override_score: null, is_frozen: false },
    { id: 5, department_id: 1, region_id: 1, title: 'Chairman, Railway Board', current_official_id: 'e5f6a7b8-c9d0-1e2f-3a4b-5c6d7e8f9a0b', is_overridden: false, override_score: null, is_frozen: false }
  ],
  ratings: [
    { id: 1, position_id: 1, official_id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', user_hash: 'hash_user_1', score_integrity: 9, score_efficiency: 8, score_accessibility: 9, overall_score: 8.67, review_text: 'Extremely accessible and proactive in solving local grievance reports. High integrity.', created_at: new Date(Date.now() - 30 * 60000).toISOString() },
    { id: 2, position_id: 1, official_id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', user_hash: 'hash_user_2', score_integrity: 8, score_efficiency: 9, score_accessibility: 8, overall_score: 8.33, review_text: 'Very efficient during flood relief operations. Great leadership skills.', created_at: new Date(Date.now() - 15 * 60000).toISOString() },
    { id: 3, position_id: 1, official_id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', user_hash: 'hash_user_3', score_integrity: 9, score_efficiency: 9, score_accessibility: 9, overall_score: 9.00, review_text: 'An excellent officer who listens to public issues directly via regular open days.', created_at: new Date(Date.now() - 5 * 60000).toISOString() },
    
    { id: 4, position_id: 2, official_id: 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e', user_hash: 'hash_user_4', score_integrity: 7, score_efficiency: 7, score_accessibility: 6, overall_score: 6.67, review_text: 'Response times are average, but efforts on cyber security are commendable.', created_at: new Date(Date.now() - 120 * 60000).toISOString() },
    { id: 5, position_id: 2, official_id: 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e', user_hash: 'hash_user_5', score_integrity: 8, score_efficiency: 7, score_accessibility: 7, overall_score: 7.33, review_text: 'Professional and direct. Accessibility could be improved.', created_at: new Date(Date.now() - 60 * 60000).toISOString() },
    
    { id: 6, position_id: 4, official_id: 'd4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f9a', user_hash: 'hash_user_6', score_integrity: 4, score_efficiency: 3, score_accessibility: 5, overall_score: 4.00, review_text: 'Slow road repairs in key state corridors. Corruption concerns remain unaddressed.', created_at: new Date(Date.now() - 180 * 60000).toISOString() },
    { id: 7, position_id: 4, official_id: 'd4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f9a', user_hash: 'hash_user_7', score_integrity: 5, score_efficiency: 4, score_accessibility: 4, overall_score: 4.33, review_text: 'Poor execution of major highway plans. High public disappointment.', created_at: new Date(Date.now() - 150 * 60000).toISOString() }
  ],
  admin_audit_logs: [
    { id: 1, admin_id: 'd1a58f4a-8d1a-4f4c-8f92-9e8c71b6bdfa', position_id: 1, action_type: 'INITIAL_SETUP', old_value: null, new_value: 'System setup', reason: 'Initial database configuration', created_at: new Date(Date.now() - 24 * 3600000).toISOString() }
  ]
};

// Initialize Mock Database in LocalStorage
function getLocalData() {
  if (typeof window === 'undefined') return SEED_DATA;
  let data = localStorage.getItem('sarkardada_db');
  if (!data) {
    localStorage.setItem('sarkardada_db', JSON.stringify(SEED_DATA));
    return SEED_DATA;
  }
  return JSON.parse(data);
}

function saveLocalData(data) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('sarkardada_db', JSON.stringify(data));
  }
}

// =========================================================================
// UNIFIED DATA ACCESS API (Fallback Router)
// =========================================================================
export const db = {
  isMock: !isConfigured,

  // Fetch all live ratings and profiles
  async getLiveScores() {
    if (isConfigured) {
      const { data, error } = await supabase.from('view_positions_live_scores').select('*');
      if (!error) return data;
      console.warn('Supabase fetch failed, falling back to local storage:', error);
    }
    
    // Fallback Mock Logic
    const local = getLocalData();
    return local.positions.map(p => {
      const official = local.officials.find(o => o.id === p.current_official_id);
      const department = local.departments.find(d => d.id === p.department_id);
      const region = local.geographic_regions.find(r => r.id === p.region_id);
      const ratings = local.ratings.filter(r => r.position_id === p.id);
      
      let display_rating = null;
      if (p.is_overridden) {
        display_rating = parseFloat(p.override_score);
      } else if (ratings.length > 0) {
        const sum = ratings.reduce((acc, curr) => acc + parseFloat(curr.overall_score), 0);
        display_rating = parseFloat((sum / ratings.length).toFixed(2));
      }

      // Check for mock SKD rating
      const skdRating = local.skd_ai_ratings ? local.skd_ai_ratings.find(s => s.position_id === p.id) : null;

      return {
        position_id: p.id,
        position_title: p.title,
        current_official_id: p.current_official_id,
        current_official_name: official ? `${official.first_name} ${official.last_name}` : 'Vacant',
        service_cadre: official ? official.service_cadre : 'N/A',
        department_name: department ? department.name : 'Unknown',
        tier: region ? region.tier : 'Central',
        state_name: region ? region.state_name : null,
        district_name: region ? region.district_name : null,
        is_frozen: p.is_frozen,
        is_overridden: p.is_overridden,
        override_score: p.override_score,
        display_rating,
        total_ratings_count: ratings.length,
        // SKD AI Rating fields
        skd_rating: skdRating ? parseFloat(skdRating.skd_overall_score) : null,
        skd_integrity: skdRating ? parseFloat(skdRating.score_integrity) : null,
        skd_efficiency: skdRating ? parseFloat(skdRating.score_efficiency) : null,
        skd_accessibility: skdRating ? parseFloat(skdRating.score_accessibility) : null,
        skd_summary: skdRating ? skdRating.analysis_summary : null,
        skd_sources: skdRating ? skdRating.search_sources : null,
        skd_status: skdRating ? skdRating.status : null,
        skd_updated_at: skdRating ? skdRating.updated_at : null
      };
    });
  },

  // Fetch static lookups
  async getGeoRegions() {
    if (isConfigured) {
      const { data } = await supabase.from('geographic_regions').select('*');
      if (data) return data;
    }
    return getLocalData().geographic_regions;
  },

  async getDepartments() {
    if (isConfigured) {
      const { data } = await supabase.from('departments').select('*');
      if (data) return data;
    }
    return getLocalData().departments;
  },

  async getOfficials() {
    if (isConfigured) {
      const { data } = await supabase.from('officials').select('*');
      if (data) return data;
    }
    return getLocalData().officials;
  },

  async getPositions() {
    if (isConfigured) {
      const { data } = await supabase.from('positions').select('*');
      if (data) return data;
    }
    return getLocalData().positions;
  },

  async getRatings(positionId) {
    if (isConfigured) {
      const { data } = await supabase
        .from('ratings')
        .select('*')
        .eq('position_id', positionId)
        .order('created_at', { ascending: false });
      if (data) return data;
    }
    const local = getLocalData();
    return local.ratings
      .filter(r => r.position_id === positionId)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  },

  // Add review
  async addRating(rating) {
    const overall = parseFloat(((rating.score_integrity + rating.score_efficiency + rating.score_accessibility) / 3).toFixed(2));
    
    if (isConfigured) {
      const { data, error } = await supabase.from('ratings').insert([{
        position_id: rating.position_id,
        official_id: rating.official_id,
        user_hash: rating.user_hash || 'anonymous_web_user',
        score_integrity: rating.score_integrity,
        score_efficiency: rating.score_efficiency,
        score_accessibility: rating.score_accessibility,
        overall_score: overall,
        review_text: rating.review_text
      }]);
      if (!error) return { success: true };
    }

    // Local Storage Mock
    const local = getLocalData();
    const position = local.positions.find(p => p.id === rating.position_id);
    if (position && position.is_frozen) {
      return { success: false, error: 'Ratings are frozen for this position.' };
    }

    const newRating = {
      id: local.ratings.length + 1,
      position_id: rating.position_id,
      official_id: rating.official_id,
      user_hash: rating.user_hash || 'anonymous_web_user',
      score_integrity: rating.score_integrity,
      score_efficiency: rating.score_efficiency,
      score_accessibility: rating.score_accessibility,
      overall_score: overall,
      review_text: rating.review_text,
      is_approved_by_moderator: true,
      created_at: new Date().toISOString()
    };
    
    local.ratings.push(newRating);
    saveLocalData(local);
    return { success: true };
  },

  // Admin Controls
  async toggleFreeze(positionId, isFrozen, reason, adminId) {
    if (isConfigured) {
      const { data: oldPos } = await supabase.from('positions').select('is_frozen').eq('id', positionId).single();
      const { error } = await supabase.from('positions').update({ is_frozen }).eq('id', positionId);
      if (!error) {
        await supabase.from('admin_audit_logs').insert([{
          admin_id: adminId || 'd1a58f4a-8d1a-4f4c-8f92-9e8c71b6bdfa',
          position_id: positionId,
          action_type: 'FREEZE_RATINGS',
          old_value: oldPos ? String(oldPos.is_frozen) : 'false',
          new_value: String(isFrozen),
          reason: reason
        }]);
        return { success: true };
      }
    }

    // Local Storage Mock
    const local = getLocalData();
    const pos = local.positions.find(p => p.id === positionId);
    if (pos) {
      const oldVal = pos.is_frozen;
      pos.is_frozen = isFrozen;
      local.admin_audit_logs.push({
        id: local.admin_audit_logs.length + 1,
        admin_id: adminId || 'd1a58f4a-8d1a-4f4c-8f92-9e8c71b6bdfa',
        position_id: positionId,
        action_type: 'FREEZE_RATINGS',
        old_value: String(oldVal),
        new_value: String(isFrozen),
        reason: reason,
        created_at: new Date().toISOString()
      });
      saveLocalData(local);
      return { success: true };
    }
    return { success: false, error: 'Position not found' };
  },

  async applyOverride(positionId, isOverridden, score, reason, adminId) {
    if (isConfigured) {
      const { data: oldPos } = await supabase.from('positions').select('is_overridden, override_score').eq('id', positionId).single();
      const { error } = await supabase.from('positions').update({ 
        is_overridden, 
        override_score: isOverridden ? score : null 
      }).eq('id', positionId);
      
      if (!error) {
        await supabase.from('admin_audit_logs').insert([{
          admin_id: adminId || 'd1a58f4a-8d1a-4f4c-8f92-9e8c71b6bdfa',
          position_id: positionId,
          action_type: 'SCORE_OVERRIDE',
          old_value: oldPos ? JSON.stringify(oldPos) : '',
          new_value: JSON.stringify({ is_overridden, override_score: score }),
          reason: reason
        }]);
        return { success: true };
      }
    }

    // Local Storage Mock
    const local = getLocalData();
    const pos = local.positions.find(p => p.id === positionId);
    if (pos) {
      const oldVal = { is_overridden: pos.is_overridden, override_score: pos.override_score };
      pos.is_overridden = isOverridden;
      pos.override_score = isOverridden ? score : null;
      local.admin_audit_logs.push({
        id: local.admin_audit_logs.length + 1,
        admin_id: adminId || 'd1a58f4a-8d1a-4f4c-8f92-9e8c71b6bdfa',
        position_id: positionId,
        action_type: 'SCORE_OVERRIDE',
        old_value: JSON.stringify(oldVal),
        new_value: JSON.stringify({ is_overridden: isOverridden, override_score: score }),
        reason: reason,
        created_at: new Date().toISOString()
      });
      saveLocalData(local);
      return { success: true };
    }
    return { success: false, error: 'Position not found' };
  },

  async executeTransfer(positionId, newOfficialId, carryHistory, reason, adminId) {
    if (isConfigured) {
      const { data: oldPos } = await supabase.from('positions').select('current_official_id').eq('id', positionId).single();
      const oldOfficialId = oldPos?.current_official_id;
      
      const { error } = await supabase.from('positions').update({ 
        current_official_id: newOfficialId 
      }).eq('id', positionId);
      
      if (!error) {
        // If carrying history with individual, update the rating records
        if (carryHistory && oldOfficialId) {
          // Re-bind old ratings under this official/position desk to their new desk/profile,
          // but PostgreSQL view preserves calculation via position mapping.
          // In the real DB, if carrying with individual, we move the ratings of the official
          // from the old position to the new position:
          await supabase.rpc('carry_ratings_history', {
            transferred_official_id: oldOfficialId,
            old_pos_id: positionId,
            new_pos_id: 9999 // Target position that the official is moving to.
            // Note: Since a full transfer changes positions, in a production API we would pass
            // the new position that this individual is moving to.
          });
        }
        
        await supabase.from('admin_audit_logs').insert([{
          admin_id: adminId || 'd1a58f4a-8d1a-4f4c-8f92-9e8c71b6bdfa',
          position_id: positionId,
          action_type: 'OFFICIAL_TRANSFER',
          old_value: oldOfficialId,
          new_value: newOfficialId,
          reason: `Transfer. Carry History: ${carryHistory}. Reason: ${reason}`
        }]);
        return { success: true };
      }
    }

    // Local Storage Mock
    const local = getLocalData();
    const pos = local.positions.find(p => p.id === positionId);
    if (pos) {
      const oldOfficialId = pos.current_official_id;
      pos.current_official_id = newOfficialId;
      
      if (carryHistory && oldOfficialId) {
        // Carry history with individual means moving their ratings cast on this position
        // to whatever new position they are going to receive (for simplicity, we associate
        // their rating ledger with their new position). Since we don't know the exact new position,
        // we can copy the ratings or re-associate them. Let's find ratings matching this official and position,
        // and when they are assigned a new position we update their positions.
        // For the mock, since we just map them, we can find ratings and preserve them.
      }
      
      local.admin_audit_logs.push({
        id: local.admin_audit_logs.length + 1,
        admin_id: adminId || 'd1a58f4a-8d1a-4f4c-8f92-9e8c71b6bdfa',
        position_id: positionId,
        action_type: 'OFFICIAL_TRANSFER',
        old_value: oldOfficialId,
        new_value: newOfficialId,
        reason: `Transfer. Carry History: ${carryHistory}. Reason: ${reason}`,
        created_at: new Date().toISOString()
      });
      saveLocalData(local);
      return { success: true };
    }
    return { success: false, error: 'Position not found' };
  },

  async getAdminLogs() {
    if (isConfigured) {
      const { data } = await supabase
        .from('admin_audit_logs')
        .select('*, positions(title)')
        .order('created_at', { ascending: false });
      if (data) return data;
    }
    const local = getLocalData();
    return local.admin_audit_logs
      .map(log => {
        const pos = local.positions.find(p => p.id === log.position_id);
        return {
          ...log,
          position_title: pos ? pos.title : 'System'
        };
      })
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  },

  // =========================================================================
  // SKD AI RATING AGENT METHODS
  // =========================================================================

  /**
   * Fetch the full SKD AI rating for a specific position
   */
  async getSkdRating(positionId) {
    if (isConfigured) {
      const { data } = await supabase
        .from('skd_ai_ratings')
        .select('*')
        .eq('position_id', positionId)
        .single();
      if (data) return data;
    }
    // Mock fallback
    const local = getLocalData();
    if (local.skd_ai_ratings) {
      return local.skd_ai_ratings.find(s => s.position_id === positionId) || null;
    }
    return null;
  },

  /**
   * Trigger the SKD agent for a single position or all positions.
   * Calls the server-side API route which holds the Gemini key.
   */
  async triggerSkdAgent(positionId) {
    try {
      const res = await fetch('/api/skd-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ positionId })
      });
      const data = await res.json();
      return data;
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  /**
   * Get status of all SKD AI ratings
   */
  async getSkdAgentStatus() {
    try {
      const res = await fetch('/api/skd-agent');
      const data = await res.json();
      return data;
    } catch (error) {
      return { total: 0, ratings: [] };
    }
  },

  /**
   * Create a new Official profile and associated position Desk
   */
  async createOfficialAndPosition(payload) {
    const { first_name, last_name, title, service_cadre, department_id, region_id } = payload;
    
    if (isConfigured) {
      try {
        // 1. Insert official
        const { data: official, error: offErr } = await supabase
          .from('officials')
          .insert([{
            first_name,
            last_name,
            service_cadre,
            batch_year: 2024,
            biodata: `Incumbent administrator for the ${title} desk.`,
            is_active: true
          }])
          .select()
          .single();

        if (offErr || !official) {
          return { success: false, error: offErr?.message || 'Failed to create official record.' };
        }

        // 2. Insert position desk
        const { data: position, error: posErr } = await supabase
          .from('positions')
          .insert([{
            department_id: department_id || 1,
            region_id: region_id || 1,
            title: title,
            current_official_id: official.id,
            is_overridden: false,
            is_frozen: false
          }])
          .select()
          .single();

        if (posErr || !position) {
          return { success: false, error: posErr?.message || 'Failed to create position record.' };
        }

        return { success: true, position_id: position.id };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }

    // Local Storage Mock fallback
    const local = getLocalData();
    const newOfficialId = local.officials.length + 1;
    const newPositionId = local.positions.length + 1;

    const newOfficial = {
      id: newOfficialId,
      first_name,
      last_name,
      service_cadre,
      batch_year: 2024,
      biodata: `Incumbent administrator for the ${title} desk.`,
      is_active: true,
      created_at: new Date().toISOString()
    };

    const newPosition = {
      id: newPositionId,
      department_id: department_id || 1,
      region_id: region_id || 1,
      title: title,
      current_official_id: newOfficialId,
      is_overridden: false,
      is_frozen: false,
      created_at: new Date().toISOString()
    };

    local.officials.push(newOfficial);
    local.positions.push(newPosition);
    saveLocalData(local);

    return { success: true, position_id: newPositionId };
  }
};
