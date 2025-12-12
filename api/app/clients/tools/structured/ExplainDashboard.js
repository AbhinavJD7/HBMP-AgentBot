const { z } = require('zod');
const { Tool } = require('@langchain/core/tools');
const { logger } = require('@librechat/data-schemas');
const {
  loadAllDashboards,
  getDashboardById,
  searchDashboardsByText,
} = require('~/server/services/DashboardCatalog');

/**
 * ExplainDashboard - A tool for explaining dashboards to users
 * Allows agents to fetch dashboard metadata and provide structured explanations
 */
class ExplainDashboard extends Tool {
  constructor(fields = {}) {
    super();

    this.name = 'explain_dashboard';
    this.description =
      'Search and explain dashboards to users. Use this when the user asks about dashboards, wants to see available dashboards, or needs information about specific dashboards. Returns a list of matching dashboards with details.';

    this.description_for_model = `// Search and explain dashboards to users
    // Use this tool when:
    // - User asks "list dashboards", "show me dashboards", "what dashboards are available?"
    // - User asks "explain the sales dashboard" or "what does the sales overview dashboard show?"
    // - User searches for dashboards: "dashboards about sales", "ivvy chain dashboard", "revenue dashboards"
    // - User wants to know what KPIs, visuals, or filters are available in a dashboard
    // - User mentions a dashboard name or category (e.g., "sales", "overview", "chain", "ivvy")
    // - User asks for "clickable links" or "links to view dashboards"
    //
    // Parameters:
    // - dashboardId: Specific dashboard ID (e.g., "sales_overview_v1") if you know the exact ID
    // - query: Search query to find dashboards - use keywords from user's request:
    //   * Dashboard names or parts of names (e.g., "sales", "overview", "ivvy", "chain")
    //   * Categories (e.g., "sales", "revenue", "operations")
    //   * Audience types (e.g., "manager", "executive")
    //   * Any descriptive terms the user mentions
    //
    // Search strategy:
    // - If user asks for "list of dashboards" or "all dashboards", use query: "" or omit both parameters
    // - If user mentions specific dashboard name (e.g., "Ivvy Chain Dashboard"), use query with those keywords
    // - If user asks about a category (e.g., "sales dashboards"), use query with that category
    // - The search will match dashboard names, categories, descriptions, and tags
    //
    // Returns: A list of matching dashboards with full details (name, category, KPIs, visuals, filters, etc.)
    // Each dashboard includes a "viewUrl" field with the API endpoint (/api/dashboards/file/:id) for clickable links.
    // IMPORTANT: When providing clickable links to users, always use the viewUrl field, NOT htmlUrl.
    // Format links as: [Dashboard Name](http://localhost:3090/api/dashboards/file/dashboard_id)
    // Users can then select a dashboard from the list to discuss further.`;

    this.schema = z.object({
      dashboardId: z
        .string()
        .optional()
        .describe('Specific dashboard ID to explain (e.g., "sales_overview_v1")'),
      query: z
        .string()
        .optional()
        .describe('Search query to find dashboards (e.g., "sales", "overview", "revenue")'),
    });
  }

  async _call(data) {
    const { dashboardId, query } = data;

    try {
      let dashboards = [];

      // If dashboardId is provided, fetch that specific dashboard
      if (dashboardId) {
        const dashboard = await getDashboardById(dashboardId);
        if (dashboard) {
          dashboards = [dashboard];
        } else {
          return JSON.stringify({
            type: 'dashboard_explanation',
            error: `Dashboard with ID "${dashboardId}" not found`,
            dashboards: [],
          });
        }
      } else if (query && query.trim()) {
        // If query is provided, search for matching dashboards
        dashboards = await searchDashboardsByText(query.trim());
        if (dashboards.length === 0) {
          // If no matches found, show all dashboards with a message
          dashboards = await loadAllDashboards();
          const allDashboards = dashboards.map((d) => ({
            type: 'dashboard_explanation',
            dashboard: {
              id: d.id,
              name: d.name,
              category: d.category,
              audience: d.audience,
              description: d.description,
            },
            structure: {
              kpis: d.kpis || [],
              visuals: d.visuals || [],
              filters: d.filters || [],
              timeRange: d.timeRange,
              tabs: d.tabs || [],
            },
            links: {
              htmlUrl: d.htmlUrl,
              jsonUrl: d.jsonUrl,
              imageUrl: d.imageUrl,
              viewUrl: `/api/dashboards/file/${d.id}`, // API endpoint for viewing the dashboard
            },
            tags: d.tags || [],
          }));
          
          return JSON.stringify({
            type: 'dashboard_explanation',
            message: `No dashboards found matching "${query}". Here are all available dashboards:`,
            dashboards: allDashboards,
            count: allDashboards.length,
          });
        }
      } else {
        // If neither is provided or query is empty, return all dashboards
        dashboards = await loadAllDashboards();
      }

      // Format the response for each dashboard
      const explanations = dashboards.map((dashboard) => ({
        type: 'dashboard_explanation',
        dashboard: {
          id: dashboard.id,
          name: dashboard.name,
          category: dashboard.category,
          audience: dashboard.audience,
          description: dashboard.description,
        },
        structure: {
          kpis: dashboard.kpis || [],
          visuals: dashboard.visuals || [],
          filters: dashboard.filters || [],
          timeRange: dashboard.timeRange,
          tabs: dashboard.tabs || [],
        },
        links: {
          htmlUrl: dashboard.htmlUrl,
          jsonUrl: dashboard.jsonUrl,
          imageUrl: dashboard.imageUrl,
          viewUrl: `/api/dashboards/file/${dashboard.id}`, // API endpoint for viewing the dashboard
        },
        tags: dashboard.tags || [],
      }));

      // If only one dashboard, return it directly; otherwise return array
      if (explanations.length === 1) {
        return JSON.stringify(explanations[0]);
      }

      return JSON.stringify({
        type: 'dashboard_explanation',
        dashboards: explanations,
        count: explanations.length,
      });
    } catch (error) {
      logger.error('[ExplainDashboard] Error explaining dashboard:', error);
      return JSON.stringify({
        type: 'dashboard_explanation',
        error: 'Failed to load dashboard information',
        message: error.message,
      });
    }
  }
}

module.exports = ExplainDashboard;

