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

// GET /interventions - Retrieve all interventions with optional filters
app.get('/api/interventions', async (req, res) => {
  try {
    const { date, municipalite } = req.query;

    let query = supabase
      .from('interventions')
      .select('*')
      .order('date', { ascending: false });

    if (date) {
      query = query.eq('date', date);
    }

    if (municipalite) {
      query = query.eq('municipalite', municipalite);
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
    const { data, error } = await supabase
      .from('interventions')
      .select('date')
      .order('date', { ascending: true });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    const uniqueDates = [...new Set(data.map(r => r.date))];
    res.json(uniqueDates);
  } catch (err) {
    console.error('Error fetching dates:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /stats - Calculate KPI statistics
app.get('/api/stats', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('interventions')
      .select('*');

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

    let query = supabase
      .from('interventions')
      .select('*');

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
    const { data, error } = await supabase
      .from('interventions')
      .select('*')
      .order('date', { ascending: true });

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
    const { municipalite, quantite_ton, metre_lineaire, type_intervention, lieux, ressources_humaines, equipements, date } = req.body;

    // Validation
    if (!municipalite || !type_intervention || !lieux) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (quantite_ton === undefined || quantite_ton < 0) {
      return res.status(400).json({ error: 'Invalid tonnage' });
    }

    const insertData = {
      date: date || new Date().toISOString().split('T')[0],
      municipalite: municipalite.trim(),
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
