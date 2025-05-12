require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');
const { syncRepository } = require('./utils/githubSync');
const recipeRoutes = require('./routes/recipeRoutes');

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:9003','http://localhost:9002', 'http://localhost:9001', 'http://localhost:3000','http://localhost:3001','http://localhost:3002'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/recipes', recipeRoutes);
app.use('/api/search', searchRoutes);


// Sync route - manually trigger a sync with the GitHub repo
app.get('/sync', async (req, res) => {
  try {
    // Start sync process
    syncRepository();
    res.json({ message: 'Sync process started' });F
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api-status', (req, res) => {
  res.json({ status: 'ok', message: 'API is running' });
});

// Root endpoint for testing
app.get('/', (req, res) => {
  res.send('HowToCook Backend is running. Access API endpoints at /api/...');
});

// Set up port
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  
  // Initial sync with GitHub repository
  if (process.env.AUTO_SYNC === 'true') {
    syncRepository();
  }
});