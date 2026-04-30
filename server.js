import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Supabase clients
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials in .env file');
  process.exit(1);
}

// Anon client for read operations (respects RLS)
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Service role client for write operations (bypasses RLS — server-side only)
const supabaseAdmin = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// GET /config - Provide Supabase URL and anon key to frontend
app.get('/api/config', (req, res) => {
  res.json({ url: supabaseUrl, anonKey: supabaseAnonKey });
});

// Helper: get user profile from token
async function getUserProfile(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;

  const token = authHeader.replace('Bearer ', '');
  const client = createClient(supabaseUrl, supabaseAnonKey);
  const { data: { user }, error } = await client.auth.getUser(token);

  if (error || !user) return null;

  // Get profile with role and municipalite
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  return {
    id: user.id,
    email: user.email,
    role: profile?.role || 'municipalite',
    municipalite: profile?.municipalite || '',
    full_name: profile?.full_name || ''
  };
}

// POST /auth/register - Register a new user (admin only, server-side)
app.post('/api/auth/register', async (req, res) => {
  try {
    if (!supabaseAdmin) {
      return res.status(500).json({ error: 'Service role not configured' });
    }

    const { email, password, full_name, municipalite, role } = req.body;

    if (!email || !password || !municipalite) {
      return res.status(400).json({ error: 'Missing required fields: email, password, municipalite' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });

    if (authError) {
      return res.status(400).json({ error: authError.message });
    }

    // Create profile
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert([{
        id: authData.user.id,
        email,
        full_name: full_name || '',
        municipalite,
        role: role || 'municipalite'
      }])
      .select();

    if (profileError) {
      // Clean up auth user if profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return res.status(400).json({ error: profileError.message });
    }

    res.status(201).json({ user: authData.user, profile: profileData[0] });
  } catch (err) {
    console.error('Error registering user:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /auth/login - Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Get profile
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .maybeSingle();

    res.json({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      user: {
        id: data.user.id,
        email: data.user.email,
        role: profile?.role || 'municipalite',
        municipalite: profile?.municipalite || '',
        full_name: profile?.full_name || ''
      }
    });
  } catch (err) {
    console.error('Error logging in:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /auth/me - Get current user profile
app.get('/api/auth/me', async (req, res) => {
  try {
    const profile = await getUserProfile(req.headers.authorization);
    if (!profile) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    res.json(profile);
  } catch (err) {
    console.error('Error getting profile:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /auth/users - List all users (admin only)
app.get('/api/auth/users', async (req, res) => {
  try {
    const profile = await getUserProfile(req.headers.authorization);
    if (!profile || profile.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('id, email, full_name, municipalite, role, created_at')
      .order('municipalite');

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(data);
  } catch (err) {
    console.error('Error listing users:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /auth/change-password - Change current user's password
app.post('/api/auth/change-password', async (req, res) => {
  try {
    const profile = await getUserProfile(req.headers.authorization);
    if (!profile) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { new_password } = req.body;
    if (!new_password || new_password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    if (!supabaseAdmin) {
      return res.status(500).json({ error: 'Service role not configured' });
    }

    const { error } = await supabaseAdmin.auth.admin.updateUserById(
      profile.id,
      { password: new_password }
    );

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Error changing password:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /auth/users/:id - Delete a user (admin only)
app.delete('/api/auth/users/:id', async (req, res) => {
  try {
    const profile = await getUserProfile(req.headers.authorization);
    if (!profile || profile.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const userId = req.params.id;

    // Delete profile first (cascade will handle auth user if set up)
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (profileError) {
      return res.status(400).json({ error: profileError.message });
    }

    // Delete auth user
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (authError) {
      return res.status(400).json({ error: authError.message });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /interventions - Retrieve interventions (filtered by user's municipality)
app.get('/api/interventions', async (req, res) => {
  try {
    const { date, municipalite } = req.query;
    const profile = await getUserProfile(req.headers.authorization);

    // Use service role for server-side filtering since RLS may block anon access
    const client = supabaseAdmin || supabase;

    let query = client
      .from('interventions')
      .select('*')
      .order('date', { ascending: false });

    // If user is authenticated and is a municipalite user, filter to their municipality
    if (profile && profile.role !== 'admin') {
      query = query.eq('municipalite', profile.municipalite);
    }

    // Admin can filter by specific municipality
    if (profile && profile.role === 'admin' && municipalite) {
      query = query.eq('municipalite', municipalite);
    }

    if (date) {
      query = query.eq('date', date);
    }

    const { data, error } = await query;

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(data || []);
  } catch (err) {
    console.error('Error fetching interventions:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /interventions/dates - Get all available dates
app.get('/api/interventions/dates', async (req, res) => {
  try {
    const profile = await getUserProfile(req.headers.authorization);
    const client = supabaseAdmin || supabase;

    let query = client
      .from('interventions')
      .select('date')
      .order('date', { ascending: true });

    if (profile && profile.role !== 'admin') {
      query = query.eq('municipalite', profile.municipalite);
    }

    const { data, error } = await query;

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    const uniqueDates = [...new Set((data || []).map(r => r.date))];
    res.json(uniqueDates);
  } catch (err) {
    console.error('Error fetching dates:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /stats - Calculate KPI statistics
app.get('/api/stats', async (req, res) => {
  try {
    const profile = await getUserProfile(req.headers.authorization);
    const client = supabaseAdmin || supabase;

    let query = client.from('interventions').select('*');

    if (profile && profile.role !== 'admin') {
      query = query.eq('municipalite', profile.municipalite);
    }

    const { data, error } = await query;

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    const interventions = data || [];

    const totalTon = interventions.reduce((sum, r) => sum + parseFloat(r.quantite_ton || 0), 0);
    const totalMk = interventions.reduce((sum, r) => sum + parseInt(r.metre_lineaire || 0), 0);
    const uniqueMunicipalities = new Set(interventions.map(r => r.municipalite));
    const uniqueDates = new Set(interventions.map(r => r.date));

    const stats = {
      totalTonnage: parseFloat(totalTon.toFixed(2)),
      totalLinearMeters: totalMk,
      activeMunicipalities: uniqueMunicipalities.size,
      interventionDays: uniqueDates.size,
      averageDailyTonnage: parseFloat((totalTon / (uniqueDates.size || 1)).toFixed(2))
    };

    res.json(stats);
  } catch (err) {
    console.error('Error calculating stats:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /stats/by-municipality - Statistics grouped by municipality
app.get('/api/stats/by-municipality', async (req, res) => {
  try {
    const { date } = req.query;
    const profile = await getUserProfile(req.headers.authorization);
    const client = supabaseAdmin || supabase;

    let query = client.from('interventions').select('*');

    if (profile && profile.role !== 'admin') {
      query = query.eq('municipalite', profile.municipalite);
    }

    if (date) {
      query = query.eq('date', date);
    }

    const { data, error } = await query;

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    const interventions = data || [];
    const munStats = {};

    interventions.forEach(r => {
      if (!munStats[r.municipalite]) {
        munStats[r.municipalite] = {
          municipalite: r.municipalite,
          quantite_ton: 0,
          metre_lineaire: 0,
          days: new Set(),
          count: 0
        };
      }
      munStats[r.municipalite].quantite_ton += parseFloat(r.quantite_ton || 0);
      munStats[r.municipalite].metre_lineaire += parseInt(r.metre_lineaire || 0);
      munStats[r.municipalite].days.add(r.date);
      munStats[r.municipalite].count += 1;
    });

    const result = Object.values(munStats).map(m => ({
      municipalite: m.municipalite,
      quantite_ton: parseFloat(m.quantite_ton.toFixed(2)),
      metre_lineaire: m.metre_lineaire,
      days: m.days.size,
      count: m.count
    }));

    res.json(result);
  } catch (err) {
    console.error('Error calculating municipality stats:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /stats/by-date - Statistics grouped by date
app.get('/api/stats/by-date', async (req, res) => {
  try {
    const profile = await getUserProfile(req.headers.authorization);
    const client = supabaseAdmin || supabase;

    let query = client
      .from('interventions')
      .select('*')
      .order('date', { ascending: true });

    if (profile && profile.role !== 'admin') {
      query = query.eq('municipalite', profile.municipalite);
    }

    const { data, error } = await query;

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    const interventions = data || [];
    const dateStats = {};

    interventions.forEach(r => {
      if (!dateStats[r.date]) {
        dateStats[r.date] = 0;
      }
      dateStats[r.date] += parseFloat(r.quantite_ton || 0);
    });

    const result = Object.entries(dateStats).map(([date, tonnage]) => ({
      date,
      tonnage: parseFloat(tonnage.toFixed(2))
    }));

    res.json(result);
  } catch (err) {
    console.error('Error calculating date stats:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /interventions - Create a new intervention
app.post('/api/interventions', async (req, res) => {
  try {
    const profile = await getUserProfile(req.headers.authorization);
    if (!profile) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { municipalite, quantite_ton, metre_lineaire, type_intervention, lieux, ressources_humaines, equipements, date } = req.body;

    // Validation
    if (!type_intervention || !lieux) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (quantite_ton === undefined || quantite_ton < 0) {
      return res.status(400).json({ error: 'Invalid tonnage' });
    }

    // Determine the municipality for the intervention
    let interventionMunicipalite = municipalite;

    if (profile.role !== 'admin') {
      // Municipalite users can only add interventions for their own municipality
      interventionMunicipalite = profile.municipalite;
    }

    if (!interventionMunicipalite) {
      return res.status(400).json({ error: 'Municipality is required' });
    }

    const insertData = {
      date: date || new Date().toISOString().split('T')[0],
      municipalite: interventionMunicipalite.trim(),
      quantite_ton: parseFloat(quantite_ton),
      metre_lineaire: parseInt(metre_lineaire || 0),
      type_intervention: type_intervention.trim(),
      lieux: lieux.trim(),
      ressources_humaines: ressources_humaines?.trim() || 'أعوان البلدية',
      equipements: equipements?.trim() || '—'
    };

    // Use service role client for writes (bypasses RLS), fallback to anon
    const client = supabaseAdmin || supabase;
    const { data, error } = await client
      .from('interventions')
      .insert([insertData])
      .select();

    if (error) {
      console.error('Database error:', error);
      return res.status(400).json({ error: error.message });
    }

    res.status(201).json(data[0]);
  } catch (err) {
    console.error('Error creating intervention:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
