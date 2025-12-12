import React, { memo, useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, ChevronUp, ExternalLink, Maximize2, Minimize2 } from 'lucide-react';
import { cn } from '~/utils';

interface DashboardViewerProps {
  dashboardName: string;
  htmlUrl: string;
  className?: string;
}

const DashboardViewer = memo(({ dashboardName, htmlUrl, className }: DashboardViewerProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Convert relative URL to absolute
  const absoluteUrl = useMemo(() => {
    if (htmlUrl.startsWith('http')) {
      return htmlUrl;
    }
    // Ensure the URL starts with / if it's relative
    const url = htmlUrl.startsWith('/') ? htmlUrl : `/${htmlUrl}`;
    return `${window.location.origin}${url}`;
  }, [htmlUrl]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const handleToggleExpand = () => {
    setIsExpanded((prev) => !prev);
  };

  const handleFullscreen = async () => {
    if (!containerRef.current) return;

    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error('Fullscreen error:', error);
    }
  };

  const handleOpenInNewTab = () => {
    window.open(absoluteUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className={cn('rounded-lg border border-border-light bg-surface-secondary overflow-hidden', className)}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border-light bg-surface-tertiary px-4 py-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-text-primary truncate">
              {dashboardName}
            </div>
            <div className="text-xs text-text-secondary mt-0.5">Dashboard Preview</div>
          </div>
        </div>
        <div className="flex items-center gap-2 ml-4">
          <button
            onClick={handleOpenInNewTab}
            className="p-1.5 rounded-md hover:bg-surface-primary transition-colors"
            title="Open in new tab"
            type="button"
          >
            <ExternalLink className="h-4 w-4 text-text-secondary" />
          </button>
          <button
            onClick={handleFullscreen}
            className="p-1.5 rounded-md hover:bg-surface-primary transition-colors"
            title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            type="button"
          >
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4 text-text-secondary" />
            ) : (
              <Maximize2 className="h-4 w-4 text-text-secondary" />
            )}
          </button>
          <button
            onClick={handleToggleExpand}
            className="p-1.5 rounded-md hover:bg-surface-primary transition-colors"
            title={isExpanded ? 'Collapse' : 'Expand'}
            type="button"
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-text-secondary" />
            ) : (
              <ChevronDown className="h-4 w-4 text-text-secondary" />
            )}
          </button>
        </div>
      </div>

      {/* Dashboard Content */}
      <div
        ref={containerRef}
        className={cn(
          'relative bg-white transition-all duration-300 ease-in-out overflow-hidden',
          isExpanded ? 'h-[800px]' : 'h-[400px]',
        )}
      >
        {isLoading && !hasError && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-text-primary mb-2"></div>
              <div className="text-sm text-text-secondary">Loading dashboard...</div>
            </div>
          </div>
        )}
        {hasError && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
            <div className="text-center p-4">
              <div className="text-sm font-medium text-text-error mb-2">Failed to load dashboard</div>
              <div className="text-xs text-text-secondary mb-4">{absoluteUrl}</div>
              <button
                onClick={handleOpenInNewTab}
                className="px-4 py-2 rounded-md bg-surface-primary text-text-primary hover:bg-surface-primary-contrast transition-colors text-sm"
                type="button"
              >
                Open in New Tab
              </button>
            </div>
          </div>
        )}
        <iframe
          ref={iframeRef}
          src={absoluteUrl}
          className="w-full h-full border-0"
          title={`${dashboardName} Dashboard`}
          onLoad={() => {
            setIsLoading(false);
            console.log('Dashboard iframe loaded:', absoluteUrl);
          }}
          onError={(e) => {
            console.error('Dashboard iframe error:', absoluteUrl, e);
            setIsLoading(false);
            setHasError(true);
          }}
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
          style={{ display: isLoading ? 'none' : 'block' }}
        />
      </div>
    </div>
  );
});

DashboardViewer.displayName = 'DashboardViewer';

export default DashboardViewer;

