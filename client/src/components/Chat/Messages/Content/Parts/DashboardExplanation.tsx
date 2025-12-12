import React, { memo, useState } from 'react';
import { ExternalLink, BarChart3, Filter, Target, TrendingUp, Eye, EyeOff, ChevronDown, ChevronRight } from 'lucide-react';
import DashboardViewer from './DashboardViewer';

export interface DashboardExplanationData {
  type: 'dashboard_explanation';
  dashboard?: {
    id: string;
    name: string;
    category: string;
    audience?: string;
    description?: string;
  };
  structure?: {
    kpis?: Array<{
      id: string;
      label: string;
      description?: string;
      formula?: string;
    }>;
    visuals?: Array<{
      id: string;
      type: string;
      title: string;
      description?: string;
    }>;
    filters?: Array<{
      id: string;
      label: string;
      type?: string;
      options?: string[];
      description?: string;
    }>;
    timeRange?: string;
    tabs?: string[];
  };
  links?: {
    htmlUrl: string;
    jsonUrl: string;
    imageUrl: string;
    viewUrl?: string; // API endpoint for viewing the dashboard
  };
  tags?: string[];
  dashboards?: DashboardExplanationData[];
  count?: number;
  error?: string;
  message?: string;
}

interface DashboardExplanationProps {
  data: DashboardExplanationData;
}

const DashboardExplanation = memo(({ data }: DashboardExplanationProps) => {
  // Handle multiple dashboards (search results)
  if (data.dashboards && data.dashboards.length > 0) {
    return (
      <div className="flex flex-col gap-3">
        <div className="text-sm font-medium text-text-primary mb-2">
          Found {data.count || data.dashboards.length} dashboard{data.dashboards.length !== 1 ? 's' : ''}:
        </div>
        <div className="flex flex-col gap-3">
          {data.dashboards.map((dashboard, index) => (
            <DashboardListItem key={dashboard.dashboard?.id || index} data={dashboard} />
          ))}
        </div>
      </div>
    );
  }

  // Handle error case
  if (data.error || !data.dashboard) {
    return (
      <div className="rounded-lg border border-border-light bg-surface-secondary p-4">
        <p className="text-text-error">
          {data.error || data.message || 'Unable to load dashboard information'}
        </p>
      </div>
    );
  }

  return <DashboardExplanationCard data={data} />;
});

const DashboardExplanationCard = memo(({ data }: { data: DashboardExplanationData }) => {
  const { dashboard, structure, links, tags } = data;
  const [showDashboard, setShowDashboard] = useState(false);

  if (!dashboard) {
    return null;
  }

  return (
    <div className="rounded-lg border border-border-light bg-surface-secondary shadow-sm">
      {/* Header */}
      <div className="border-b border-border-light p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 className="h-5 w-5 text-text-primary" />
              <h3 className="text-lg font-semibold text-text-primary">{dashboard.name}</h3>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className="inline-flex items-center rounded-md bg-surface-tertiary px-2 py-1 text-xs font-medium text-text-secondary">
                {dashboard.category}
              </span>
              {dashboard.audience && (
                <span className="inline-flex items-center rounded-md bg-surface-tertiary px-2 py-1 text-xs font-medium text-text-secondary">
                  {dashboard.audience}
                </span>
              )}
            </div>
          </div>
          {links?.imageUrl && (
            <div className="flex-shrink-0">
              <img
                src={(() => {
                  // Ensure absolute URL to bypass React Router
                  const url = links.imageUrl.startsWith('http') 
                    ? links.imageUrl 
                    : `${window.location.origin}${links.imageUrl.startsWith('/') ? links.imageUrl : `/${links.imageUrl}`}`;
                  // Add cache busting to ensure fresh load
                  return `${url}${url.includes('?') ? '&' : '?'}t=${Date.now()}`;
                })()}
                alt={dashboard.name}
                className="h-20 w-32 rounded border border-border-light object-cover"
                crossOrigin="anonymous"
                loading="lazy"
                onError={(e) => {
                  console.error('Failed to load dashboard image:', links.imageUrl, e);
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
                onLoad={() => {
                  console.log('Dashboard image loaded successfully');
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      {dashboard.description && (
        <div className="border-b border-border-light p-4">
          <p className="text-sm text-text-secondary">{dashboard.description}</p>
        </div>
      )}

      {/* Structure */}
      {structure && (
        <div className="p-4 space-y-4">
          {/* KPIs */}
          {structure.kpis && structure.kpis.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-4 w-4 text-text-secondary" />
                <h4 className="text-sm font-semibold text-text-primary">Key Performance Indicators</h4>
              </div>
              <div className="space-y-2">
                {structure.kpis.map((kpi) => (
                  <div key={kpi.id} className="ml-6">
                    <div className="text-sm font-medium text-text-primary">{kpi.label}</div>
                    {kpi.description && (
                      <div className="text-xs text-text-secondary mt-0.5">{kpi.description}</div>
                    )}
                    {kpi.formula && (
                      <div className="text-xs text-text-tertiary mt-0.5 font-mono">{kpi.formula}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Visuals */}
          {structure.visuals && structure.visuals.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-text-secondary" />
                <h4 className="text-sm font-semibold text-text-primary">Visualizations</h4>
              </div>
              <div className="space-y-2">
                {structure.visuals.map((visual) => (
                  <div key={visual.id} className="ml-6">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-text-primary">{visual.title}</span>
                      <span className="inline-flex items-center rounded bg-surface-tertiary px-1.5 py-0.5 text-xs font-medium text-text-secondary">
                        {visual.type}
                      </span>
                    </div>
                    {visual.description && (
                      <div className="text-xs text-text-secondary mt-0.5">{visual.description}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Filters */}
          {structure.filters && structure.filters.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Filter className="h-4 w-4 text-text-secondary" />
                <h4 className="text-sm font-semibold text-text-primary">Filters</h4>
              </div>
              <div className="space-y-2">
                {structure.filters.map((filter) => (
                  <div key={filter.id} className="ml-6">
                    <div className="text-sm font-medium text-text-primary">{filter.label}</div>
                    {filter.type && (
                      <div className="text-xs text-text-secondary mt-0.5">Type: {filter.type}</div>
                    )}
                    {filter.options && filter.options.length > 0 && (
                      <div className="text-xs text-text-secondary mt-0.5">
                        Options: {filter.options.join(', ')}
                      </div>
                    )}
                    {filter.description && (
                      <div className="text-xs text-text-secondary mt-0.5">{filter.description}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Time Range */}
          {structure.timeRange && (
            <div>
              <div className="text-xs font-semibold text-text-secondary mb-1">Time Range</div>
              <div className="text-sm text-text-primary">{structure.timeRange}</div>
            </div>
          )}

          {/* Tabs */}
          {structure.tabs && structure.tabs.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-text-secondary mb-1">Available Tabs</div>
              <div className="flex flex-wrap gap-1">
                {structure.tabs.map((tab, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center rounded bg-surface-tertiary px-2 py-1 text-xs text-text-secondary"
                  >
                    {tab}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tags */}
      {tags && tags.length > 0 && (
        <div className="border-t border-border-light p-4">
          <div className="flex flex-wrap gap-1">
            {tags.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center rounded bg-surface-tertiary px-2 py-1 text-xs text-text-secondary"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {(links?.viewUrl || links?.htmlUrl) && (
        <div className="border-t border-border-light p-4 space-y-2">
          <button
            onClick={() => setShowDashboard(!showDashboard)}
            className="flex w-full items-center justify-center rounded-xl bg-surface-primary px-4 py-2 text-sm font-medium text-text-primary hover:bg-surface-primary-contrast transition-colors"
            type="button"
          >
            {showDashboard ? (
              <>
                <EyeOff className="mr-2 h-4 w-4" />
                Hide Dashboard Preview
              </>
            ) : (
              <>
                <Eye className="mr-2 h-4 w-4" />
                View Dashboard Preview
              </>
            )}
          </button>
          <button
            onClick={() => {
              // Use viewUrl (API endpoint) if available, otherwise fall back to htmlUrl
              const viewUrl = links.viewUrl || `/api/dashboards/file/${dashboard.id}`;
              const url = viewUrl.startsWith('http') 
                ? viewUrl 
                : `${window.location.origin}${viewUrl.startsWith('/') ? viewUrl : `/${viewUrl}`}`;
              window.open(url, '_blank', 'noopener,noreferrer');
            }}
            className="flex w-full items-center justify-center rounded-xl border border-border-light bg-surface-secondary px-4 py-2 text-sm font-medium text-text-secondary hover:bg-surface-tertiary transition-colors"
            type="button"
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Open Dashboard
          </button>
        </div>
      )}

      {/* Inline Dashboard Viewer */}
      {showDashboard && (links?.viewUrl || links?.htmlUrl) && (
        <div className="border-t border-border-light p-4">
          <DashboardViewer 
            dashboardName={dashboard.name} 
            htmlUrl={links.viewUrl || `/api/dashboards/file/${dashboard.id}`} 
          />
        </div>
      )}
    </div>
  );
});

// Compact list item for multiple dashboards
const DashboardListItem = memo(({ data }: { data: DashboardExplanationData }) => {
  const { dashboard, links } = data;
  const [isExpanded, setIsExpanded] = useState(false);

  if (!dashboard) {
    return null;
  }

  const handleImageClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent expanding/collapsing when clicking image
    const viewUrl = links?.viewUrl || `/api/dashboards/file/${dashboard.id}`;
    const url = viewUrl.startsWith('http') 
      ? viewUrl 
      : `${window.location.origin}${viewUrl.startsWith('/') ? viewUrl : `/${viewUrl}`}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const imageUrl = links?.imageUrl 
    ? (links.imageUrl.startsWith('http') 
        ? links.imageUrl 
        : `${window.location.origin}${links.imageUrl.startsWith('/') ? links.imageUrl : `/${links.imageUrl}`}`)
    : null;

  return (
    <div className="rounded-lg border border-border-light bg-surface-secondary overflow-hidden">
      {/* Compact Header with Preview Image */}
      <div className="p-4">
        <div className="flex items-start gap-4">
          {/* Clickable Preview Image */}
          {imageUrl && (
            <div 
              onClick={handleImageClick}
              className="flex-shrink-0 cursor-pointer group relative"
              title="Click to open dashboard"
            >
              <img
                src={`${imageUrl}${imageUrl.includes('?') ? '&' : '?'}t=${Date.now()}`}
                alt={dashboard.name}
                className="h-24 w-40 rounded-lg border-2 border-border-light object-cover transition-all group-hover:border-text-primary group-hover:shadow-lg"
                crossOrigin="anonymous"
                loading="lazy"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 rounded-lg transition-all flex items-center justify-center">
                <ExternalLink className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          )}
          
          {/* Dashboard Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="h-5 w-5 text-text-primary flex-shrink-0" />
                  <h4 className="text-lg font-semibold text-text-primary">{dashboard.name}</h4>
                </div>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="inline-flex items-center rounded-md bg-surface-tertiary px-2 py-1 text-xs font-medium text-text-secondary">
                    {dashboard.category}
                  </span>
                  {dashboard.audience && (
                    <span className="inline-flex items-center rounded-md bg-surface-tertiary px-2 py-1 text-xs font-medium text-text-secondary">
                      {dashboard.audience}
                    </span>
                  )}
                </div>
                {dashboard.description && (
                  <p className="text-sm text-text-secondary mb-3">{dashboard.description}</p>
                )}
              </div>
            </div>
            
            {/* Expand/Collapse Button */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
              type="button"
            >
              {isExpanded ? (
                <>
                  <ChevronDown className="h-4 w-4" />
                  Hide Details
                </>
              ) : (
                <>
                  <ChevronRight className="h-4 w-4" />
                  Show Details
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="border-t border-border-light">
          <DashboardExplanationCard data={data} />
        </div>
      )}
    </div>
  );
});

DashboardListItem.displayName = 'DashboardListItem';

export default DashboardExplanation;

