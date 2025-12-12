const express = require('express');
const path = require('path');
const fs = require('fs');
const {
  loadAllDashboards,
  getDashboardById,
  searchDashboardsByText,
  clearCache,
} = require('~/server/services/DashboardCatalog');

const router = express.Router();

/**
 * GET /api/dashboards
 * Get all dashboards
 */
router.get('/', async (req, res) => {
  try {
    const dashboards = await loadAllDashboards();
    res.json(dashboards);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load dashboards', message: error.message });
  }
});

/**
 * GET /api/dashboards/search?q=query
 * Search dashboards by text query
 * NOTE: Must be before /:id route to avoid matching "search" as an ID
 */
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || typeof q !== 'string') {
      return res.status(400).json({ error: 'Query parameter "q" is required' });
    }

    const dashboards = await searchDashboardsByText(q);
    res.json(dashboards);
  } catch (error) {
    res.status(500).json({ error: 'Failed to search dashboards', message: error.message });
  }
});

/**
 * GET /api/dashboards/file/:id
 * Serve the HTML file for a dashboard
 * NOTE: Must be before /:id route to avoid matching "file" as an ID
 */
router.get('/file/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const dashboard = await getDashboardById(id);

    if (!dashboard || !dashboard.htmlUrl) {
      return res.status(404).json({ error: 'Dashboard not found', id });
    }

    // Extract the file path from htmlUrl (e.g., /dashboards/exports/sales_overview_v1/file.html)
    let urlPath = dashboard.htmlUrl;
    if (urlPath.startsWith('http')) {
      urlPath = new URL(urlPath).pathname;
    }
    
    // Extract relative path after /dashboards/exports/
    // e.g., /dashboards/exports/sales_overview_v1/file.html -> sales_overview_v1/file.html
    const relativePath = urlPath.replace(/^\/dashboards\/exports\//, '');
    const dashboardsPath = path.join(__dirname, '../../dashboards/exports');
    const filePath = path.join(dashboardsPath, relativePath);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Dashboard file not found', filePath });
    }

    // Serve the HTML file
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.sendFile(path.resolve(filePath));
  } catch (error) {
    res.status(500).json({ error: 'Failed to serve dashboard file', message: error.message });
  }
});

/**
 * POST /api/dashboards/clear-cache
 * Clear the dashboard cache (forces reload on next request)
 */
router.post('/clear-cache', async (req, res) => {
  try {
    clearCache();
    res.json({ message: 'Dashboard cache cleared successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to clear cache', message: error.message });
  }
});

/**
 * GET /api/dashboards/:id
 * Get a specific dashboard by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const dashboard = await getDashboardById(id);

    if (!dashboard) {
      return res.status(404).json({ error: 'Dashboard not found', id });
    }

    res.json(dashboard);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load dashboard', message: error.message });
  }
});

module.exports = router;


