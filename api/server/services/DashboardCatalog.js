const fs = require('fs').promises;
const path = require('path');
const { logger } = require('@librechat/data-schemas');

/**
 * @typedef {Object} DashboardFileRefs
 * @property {string} html
 * @property {string} json
 * @property {string} image
 */

/**
 * @typedef {Object} DashboardKPI
 * @property {string} id
 * @property {string} label
 * @property {string} [description]
 * @property {string} [formula]
 */

/**
 * @typedef {'area'|'bar'|'line'|'pie'|'table'|'funnel'|'scatter'|'combo'|string} DashboardVisualType
 */

/**
 * @typedef {Object} DashboardVisual
 * @property {string} id
 * @property {DashboardVisualType} type
 * @property {string} title
 * @property {string} [description]
 */

/**
 * @typedef {Object} DashboardFilter
 * @property {string} id
 * @property {string} label
 * @property {string} [type]
 * @property {string[]} [options]
 * @property {string} [description]
 */

/**
 * @typedef {Object} DashboardMeta
 * @property {string} id
 * @property {string} name
 * @property {string} category
 * @property {string} [audience]
 * @property {string} [description]
 * @property {DashboardFileRefs} files
 * @property {string} [timeRange]
 * @property {string[]} [tabs]
 * @property {DashboardKPI[]} [kpis]
 * @property {DashboardVisual[]} [visuals]
 * @property {DashboardFilter[]} [filters]
 * @property {string[]} [tags]
 */

/**
 * @typedef {DashboardMeta} DashboardCatalogItem
 * @property {string} htmlUrl - Resolved URL for HTML file
 * @property {string} jsonUrl - Resolved URL for JSON file
 * @property {string} imageUrl - Resolved URL for image file
 */

// In-memory cache for loaded dashboards
let cachedDashboards = null;

/**
 * Get the base path for dashboard exports
 * @returns {string}
 */
function getDashboardsExportsPath() {
  return path.join(__dirname, '../../dashboards/exports');
}

/**
 * Build URLs for dashboard files
 * @param {string} folderName - Name of the dashboard folder (empty string for flat structure)
 * @param {DashboardFileRefs} files - File references from meta.json
 * @returns {{htmlUrl: string, jsonUrl: string, imageUrl: string}}
 */
function buildDashboardUrls(folderName, files) {
  const baseUrl = folderName ? `/dashboards/exports/${folderName}` : '/dashboards/exports';
  return {
    htmlUrl: `${baseUrl}/${files.html}`,
    jsonUrl: files.json ? `${baseUrl}/${files.json}` : '',
    imageUrl: files.image ? `${baseUrl}/${files.image}` : '',
  };
}

/**
 * Extract dashboard name from HTML filename
 * @param {string} htmlFileName - HTML filename (e.g., "Sales_Overview_2025-12-17.html")
 * @returns {string} Dashboard name (e.g., "Sales Overview")
 */
function extractDashboardNameFromFilename(htmlFileName) {
  // Remove extension
  const nameWithoutExt = htmlFileName.replace(/\.html$/i, '');
  // Remove date pattern (YYYY-MM-DD or YYYY-MM-DD)
  const nameWithoutDate = nameWithoutExt.replace(/_\d{4}-\d{2}-\d{2}$/, '');
  // Remove "Interactive" suffix if present
  const nameWithoutInteractive = nameWithoutDate.replace(/_Interactive$/i, '');
  // Convert underscores to spaces and capitalize words
  return nameWithoutInteractive
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Generate dashboard ID from filename
 * @param {string} htmlFileName - HTML filename
 * @returns {string} Dashboard ID
 */
function generateDashboardIdFromFilename(htmlFileName) {
  const nameWithoutExt = htmlFileName.replace(/\.html$/i, '');
  const nameWithoutDate = nameWithoutExt.replace(/_\d{4}-\d{2}-\d{2}$/, '');
  const nameWithoutInteractive = nameWithoutDate.replace(/_Interactive$/i, '');
  return nameWithoutInteractive.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

/**
 * Find matching files for an HTML file (PNG, JSON metadata)
 * @param {string} htmlFileName - HTML filename
 * @param {Array<{name: string, isFile: boolean}>} allEntries - All entries in the directory
 * @returns {DashboardFileRefs} File references
 */
function findMatchingFiles(htmlFileName, allEntries) {
  const baseName = htmlFileName.replace(/\.html$/i, '');
  const files = { html: htmlFileName, json: null, image: null };

  for (const entry of allEntries) {
    if (!entry.isFile()) continue;
    const entryName = entry.name;
    const entryBase = entryName.toLowerCase();

    // Look for matching PNG/JPG
    if (!files.image && (entryBase.endsWith('.png') || entryBase.endsWith('.jpg') || entryBase.endsWith('.jpeg'))) {
      const entryBaseName = entryName.replace(/\.(png|jpg|jpeg)$/i, '');
      // Check if base names match (allowing for variations)
      if (entryBaseName.toLowerCase().includes(baseName.toLowerCase().substring(0, 20)) ||
          baseName.toLowerCase().includes(entryBaseName.toLowerCase().substring(0, 20))) {
        files.image = entryName;
      }
    }

    // Look for matching JSON metadata
    if (!files.json && entryBase.endsWith('.json')) {
      const entryBaseName = entryName.replace(/\.json$/i, '');
      if (entryBaseName.toLowerCase().includes('metadata') &&
          (entryBaseName.toLowerCase().includes(baseName.toLowerCase().substring(0, 20)) ||
           baseName.toLowerCase().includes(entryBaseName.toLowerCase().substring(0, 20)))) {
        files.json = entryName;
      }
    }
  }

  return files;
}

/**
 * Convert Metadata JSON format to meta.json format
 * @param {Object} metadata - Metadata JSON object
 * @param {string} folderName - Name of the dashboard folder
 * @param {Object} files - Detected files (html, json, image)
 * @returns {DashboardMeta}
 */
function convertMetadataToMeta(metadata, folderNameOrDashboardName, files) {
  const dashboard = metadata.dashboard || {};
  const visualization = metadata.visualization || {};
  const filters = metadata.filters || {};
  const context = metadata.context || {};

  // Generate ID from folder/dashboard name (convert to lowercase with underscores)
  // Handle both folder names (with underscores) and dashboard names (with spaces)
  const nameForId = folderNameOrDashboardName.replace(/\s+/g, '_').toLowerCase();
  const id = nameForId.replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');

  // Extract category from type or use folder/dashboard name
  const category = dashboard.type
    ? dashboard.type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    : folderNameOrDashboardName.split(/[\s_]+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');

  // Build KPIs from metrics
  const kpis = (visualization.metrics || []).map((metric, index) => ({
    id: `metric_${index}`,
    label: metric,
    description: `Shows ${metric.toLowerCase()} data`,
  }));

  // Build visuals from chart types
  const visuals = (visualization.chartTypes || []).map((chartType, index) => {
    const typeMatch = chartType.match(/\((.*?)\)/);
    const title = typeMatch ? typeMatch[1] : chartType;
    const type = chartType.toLowerCase().includes('area') ? 'area' :
      chartType.toLowerCase().includes('bar') ? 'bar' :
        chartType.toLowerCase().includes('line') ? 'line' :
          chartType.toLowerCase().includes('composed') ? 'combo' : 'chart';

    return {
      id: `visual_${index}`,
      type: type,
      title: title,
      description: chartType,
    };
  });

  // Build filters from filters object
  const filterArray = [];
  if (filters.selectedYear) {
    filterArray.push({
      id: 'year',
      label: 'Year',
      type: 'single-select',
      options: [filters.selectedYear],
      description: 'Selected year for the dashboard',
    });
  }
  if (filters.comparisonMode) {
    filterArray.push({
      id: 'comparisonMode',
      label: 'Comparison Mode',
      type: 'single-select',
      options: [filters.comparisonMode],
      description: 'Comparison mode selected',
    });
  }
  if (filters.abcBand) {
    filterArray.push({
      id: 'abcBand',
      label: 'ABC Band',
      type: 'single-select',
      options: [filters.abcBand],
      description: 'ABC band filter',
    });
  }

  // Generate tags from name and category
  const tags = [
    ...(dashboard.name ? dashboard.name.toLowerCase().split(/\s+/) : []),
    ...(category ? [category.toLowerCase()] : []),
    'dashboard',
  ].filter(Boolean);

  return {
    id: id,
    name: dashboard.name || folderNameOrDashboardName,
    category: category,
    audience: undefined, // Not available in Metadata format
    description: dashboard.description || `Dashboard showing ${dashboard.name || folderNameOrDashboardName} data`,
    files: files,
    timeRange: context.selectedYear || undefined,
    tabs: undefined, // Not available in Metadata format
    kpis: kpis.length > 0 ? kpis : undefined,
    visuals: visuals.length > 0 ? visuals : undefined,
    filters: filterArray.length > 0 ? filterArray : undefined,
    tags: tags,
  };
}

/**
 * Auto-detect files in a folder
 * @param {string} folderPath - Path to the dashboard folder
 * @returns {Promise<DashboardFileRefs>}
 */
async function detectFilesInFolder(folderPath) {
  const entries = await fs.readdir(folderPath, { withFileTypes: true });
  const files = { html: null, json: null, image: null };

  for (const entry of entries) {
    if (entry.isFile()) {
      const fileName = entry.name.toLowerCase();
      if (fileName.endsWith('.html') && !files.html) {
        files.html = entry.name;
      } else if (fileName.endsWith('.json') && !files.json) {
        files.json = entry.name;
      } else if ((fileName.endsWith('.png') || fileName.endsWith('.jpg') || fileName.endsWith('.jpeg')) && !files.image) {
        files.image = entry.name;
      }
    }
  }

  // If files not found, return defaults
  return {
    html: files.html || 'dashboard.html',
    json: files.json || 'metadata.json',
    image: files.image || 'dashboard.png',
  };
}

/**
 * Load all dashboards from the exports directory
 * @returns {Promise<DashboardCatalogItem[]>}
 */
async function loadAllDashboards() {
  // Return cached dashboards if available
  if (cachedDashboards !== null) {
    return cachedDashboards;
  }

  const dashboardsPath = getDashboardsExportsPath();
  const dashboards = [];

  try {
    // Check if the directory exists
    await fs.access(dashboardsPath);
  } catch (error) {
    logger.warn('[DashboardCatalog] Dashboards exports directory not found:', dashboardsPath);
    return [];
  }

  try {
    const entries = await fs.readdir(dashboardsPath, { withFileTypes: true });

    // Separate files and directories
    const htmlFiles = [];
    const directories = [];

    for (const entry of entries) {
      if (entry.isFile() && entry.name.toLowerCase().endsWith('.html')) {
        htmlFiles.push(entry);
      } else if (entry.isDirectory()) {
        directories.push(entry);
      }
    }

    // Process HTML files directly in exports folder (flat structure)
    if (htmlFiles.length > 0) {
      // Get all entries for matching files
      const allEntries = await fs.readdir(dashboardsPath, { withFileTypes: true });

      for (const htmlFile of htmlFiles) {
        try {
          const htmlFileName = htmlFile.name;
          const dashboardName = extractDashboardNameFromFilename(htmlFileName);
          const dashboardId = generateDashboardIdFromFilename(htmlFileName);

          // Find matching PNG and JSON files
          const files = findMatchingFiles(htmlFileName, allEntries);

          // Try to load metadata JSON if found
          let meta = null;
          if (files.json) {
            try {
              const metadataPath = path.join(dashboardsPath, files.json);
              const metadataContent = await fs.readFile(metadataPath, 'utf8');
              const metadata = JSON.parse(metadataContent);
              // Convert Metadata format to meta.json format
              meta = convertMetadataToMeta(metadata, dashboardName, files);
              meta.id = dashboardId; // Use generated ID
            } catch (metadataError) {
              // If metadata parsing fails, create basic meta
              logger.warn(`[DashboardCatalog] Could not parse metadata for ${htmlFileName}:`, metadataError.message);
            }
          }

          // If no metadata found or parsing failed, create basic meta
          if (!meta) {
            meta = {
              id: dashboardId,
              name: dashboardName,
              category: 'General',
              description: `Dashboard: ${dashboardName}`,
              files: files,
              tags: [dashboardName.toLowerCase().replace(/\s+/g, '_'), 'dashboard'],
            };
          }

          // Build URLs for flat structure (no folder name)
          const urls = buildDashboardUrls('', files);

          // Create catalog item
          dashboards.push({
            ...meta,
            ...urls,
          });
        } catch (error) {
          logger.warn(`[DashboardCatalog] Skipping HTML file ${htmlFile.name}:`, error.message);
        }
      }
    }

    // Process subdirectories (folder-based structure) - fallback for backward compatibility
    for (const entry of directories) {

      const folderName = entry.name;
      const folderPath = path.join(dashboardsPath, folderName);
      const metaPath = path.join(folderPath, 'meta.json');

      try {
        let meta;
        let files;

        // Try to load meta.json first
        try {
          await fs.access(metaPath);
          const metaContent = await fs.readFile(metaPath, 'utf8');
          meta = /** @type {DashboardMeta} */ (JSON.parse(metaContent));
          files = meta.files;
        } catch (metaError) {
          // If meta.json doesn't exist, try to find Metadata JSON file
          const folderEntries = await fs.readdir(folderPath, { withFileTypes: true });
          let metadataFile = null;

          // Find Metadata JSON file
          for (const folderEntry of folderEntries) {
            if (folderEntry.isFile() && folderEntry.name.toLowerCase().includes('metadata') && folderEntry.name.endsWith('.json')) {
              metadataFile = folderEntry.name;
              break;
            }
          }

          if (metadataFile) {
            // Read and convert Metadata JSON
            const metadataPath = path.join(folderPath, metadataFile);
            const metadataContent = await fs.readFile(metadataPath, 'utf8');
            const metadata = JSON.parse(metadataContent);

            // Auto-detect files in folder
            files = await detectFilesInFolder(folderPath);

            // Convert Metadata format to meta.json format
            meta = convertMetadataToMeta(metadata, folderName, files);
          } else {
            // No metadata file found, try to auto-detect and create basic meta
            files = await detectFilesInFolder(folderPath);
            meta = {
              id: folderName.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, ''),
              name: folderName.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
              category: 'General',
              description: `Dashboard for ${folderName}`,
              files: files,
              tags: [folderName.toLowerCase(), 'dashboard'],
            };
          }
        }

        // Build URLs for the dashboard files
        const urls = buildDashboardUrls(folderName, files);

        // Create catalog item with resolved URLs
        dashboards.push({
          ...meta,
          ...urls,
        });
      } catch (error) {
        // If folder can't be processed, skip it
        logger.warn(`[DashboardCatalog] Skipping folder ${folderName}:`, error.message);
      }
    }

    // Cache the results
    cachedDashboards = dashboards;
    logger.info(`[DashboardCatalog] Loaded ${dashboards.length} dashboard(s)`);

    return dashboards;
  } catch (error) {
    logger.error('[DashboardCatalog] Error loading dashboards:', error);
    return [];
  }
}

/**
 * Get a dashboard by its ID
 * @param {string} id - Dashboard ID
 * @returns {Promise<DashboardCatalogItem | null>}
 */
async function getDashboardById(id) {
  const dashboards = await loadAllDashboards();
  return dashboards.find((dashboard) => dashboard.id === id) || null;
}

/**
 * Search dashboards by text query
 * @param {string} query - Search query string
 * @returns {Promise<DashboardCatalogItem[]>}
 */
async function searchDashboardsByText(query) {
  if (!query || typeof query !== 'string') {
    return [];
  }

  const dashboards = await loadAllDashboards();
  const lowerQuery = query.toLowerCase();

  return dashboards.filter((dashboard) => {
    // Search in name
    if (dashboard.name?.toLowerCase().includes(lowerQuery)) {
      return true;
    }

    // Search in category
    if (dashboard.category?.toLowerCase().includes(lowerQuery)) {
      return true;
    }

    // Search in audience
    if (dashboard.audience?.toLowerCase().includes(lowerQuery)) {
      return true;
    }

    // Search in description
    if (dashboard.description?.toLowerCase().includes(lowerQuery)) {
      return true;
    }

    // Search in tags
    if (dashboard.tags && Array.isArray(dashboard.tags)) {
      if (dashboard.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))) {
        return true;
      }
    }

    return false;
  });
}

/**
 * Clear the dashboard cache (useful for testing or reloading)
 */
function clearCache() {
  cachedDashboards = null;
}

module.exports = {
  loadAllDashboards,
  getDashboardById,
  searchDashboardsByText,
  clearCache,
};

