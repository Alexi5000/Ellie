/**
 * Service Discovery Dashboard
 * Simple web interface to monitor service discovery status
 */

const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API endpoints
app.get('/api/services', async (req, res) => {
  try {
    const response = await axios.get(`${BACKEND_URL}/services`);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to fetch services', 
      message: error.message 
    });
  }
});

app.get('/api/services/health', async (req, res) => {
  try {
    const response = await axios.get(`${BACKEND_URL}/services/health`);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to fetch service health', 
      message: error.message 
    });
  }
});

app.get('/api/services/stats', async (req, res) => {
  try {
    const response = await axios.get(`${BACKEND_URL}/services/stats`);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to fetch service stats', 
      message: error.message 
    });
  }
});

// Main dashboard route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Service Discovery Dashboard running on port ${PORT}`);
  console.log(`Backend URL: ${BACKEND_URL}`);
});