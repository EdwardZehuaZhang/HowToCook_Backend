require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');
const { syncRepository } = require('./utils/githubSync');
const recipeRoutes = require('./routes/recipeRoutes');
const searchRoutes = require('./routes/searchRoutes');
const recipeController = require('./controllers/recipeController'); // Assuming you have this import

// Connect to database
connectDB();

const app = express();

// Add global request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  console.log(`📥 ${req.method} ${req.url}`);
  
  // Log when the response is finished
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`📤 ${req.method} ${req.url} ${res.statusCode} - ${duration}ms`);
  });
  
  next();
});

// Middleware
app.use(cors({
  origin: ['http://localhost:9003','http://localhost:9002', 'http://localhost:9001', 'http://localhost:3000','http://localhost:3001','http://localhost:3002'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
app.use(express.json());

// Routes
// Register routes with both /api prefix and without
app.use('/api/recipes', recipeRoutes);
// Also register routes without the /api prefix as a fallback
app.use('/recipes', recipeRoutes);

// Do the same for search routes
app.use('/api/search', searchRoutes);
app.use('/search', searchRoutes);

// Add a direct route for testing search
app.get('/test-search', (req, res) => {
  console.log('⭐ Test search endpoint hit with query:', req.query);
  return recipeController.searchRecipes(req, res);
});

app.get('/api/categories', recipeController.getCategories);  // Assuming you have this import

// Sync route - manually trigger a sync with the GitHub repo
app.get('/sync', async (req, res) => {
  try {
    // Start sync process
    syncRepository();
    res.json({ message: 'Sync process started' });
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