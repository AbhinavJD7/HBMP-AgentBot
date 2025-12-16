import React, { useEffect, useRef, useState, memo } from 'react';
import { cn } from '~/utils';

export interface ChartData {
  type: 'json' | 'image'; // Removed plotly and chartjs to reduce bundle size
  data: any;
  layout?: any;
  config?: any;
  title?: string;
}

interface ChartProps {
  chartData: ChartData | string;
  className?: string;
}

/**
 * Chart component for rendering chart types
 * Supports image-based charts and JSON data display
 * Note: Plotly and Chart.js support removed to reduce bundle size
 */
const Chart = memo(({ chartData, className }: ChartProps) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!chartRef.current) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Parse chart data if it's a string
      let parsedData: ChartData;
      if (typeof chartData === 'string') {
        try {
          parsedData = JSON.parse(chartData);
        } catch {
          // If parsing fails, try to detect chart type from content
          parsedData = {
            type: 'image',
            data: chartData,
          };
        }
      } else {
        parsedData = chartData;
      }

      const { type, data } = parsedData;

      // Plotly and Chart.js support removed to reduce bundle size
      if (type === 'plotly' || type === 'chartjs') {
        setError('Chart library support removed. Please use image or json type.');
        setIsLoading(false);
        return;
      }

      if (type === 'image' || (typeof data === 'string' && data.startsWith('data:image'))) {
        // Render image-based chart
        if (!chartRef.current) return;

        const img = document.createElement('img');
        img.src = typeof data === 'string' ? data : data.src || data.url || '';
        img.style.width = '100%';
        img.style.height = 'auto';
        img.style.borderRadius = '8px';
        img.onload = () => setIsLoading(false);
        img.onerror = () => {
          setError('Failed to load chart image');
          setIsLoading(false);
        };

        chartRef.current.innerHTML = '';
        chartRef.current.appendChild(img);
      } else if (type === 'json') {
        // Render JSON data as formatted display (fallback)
        if (!chartRef.current) return;
        chartRef.current.innerHTML = `<pre class="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-auto">${JSON.stringify(data, null, 2)}</pre>`;
        setIsLoading(false);
      } else {
        setError('Unsupported chart type');
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Error rendering chart:', err);
      setError('Failed to render chart');
      setIsLoading(false);
    }
  }, [chartData]);

  if (error) {
    return (
      <div className={cn('p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800', className)}>
        <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className={cn('w-full my-4', className)}>
      {isLoading && (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
        </div>
      )}
      <div
        ref={chartRef}
        className={cn(
          'w-full min-h-[300px] bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4',
          isLoading && 'opacity-50'
        )}
        style={{ minHeight: isLoading ? '300px' : 'auto' }}
      />
    </div>
  );
});

Chart.displayName = 'Chart';

export default Chart;






