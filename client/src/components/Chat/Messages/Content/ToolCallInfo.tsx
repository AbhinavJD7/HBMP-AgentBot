import React, { useMemo } from 'react';
import { useLocalize } from '~/hooks';
import { Tools } from 'librechat-data-provider';
import { UIResourceRenderer } from '@mcp-ui/client';
import UIResourceCarousel from './UIResourceCarousel';
import DashboardExplanation, { type DashboardExplanationData } from './Parts/DashboardExplanation';
import type { TAttachment, UIResource } from 'librechat-data-provider';

function OptimizedCodeBlock({ text, maxHeight = 320 }: { text: string; maxHeight?: number }) {
  return (
    <div
      className="rounded-lg bg-surface-tertiary p-2 text-xs text-text-primary"
      style={{
        position: 'relative',
        maxHeight,
        overflow: 'auto',
      }}
    >
      <pre className="m-0 whitespace-pre-wrap break-words" style={{ overflowWrap: 'break-word' }}>
        <code>{text}</code>
      </pre>
    </div>
  );
}

export default function ToolCallInfo({
  input,
  output,
  domain,
  function_name,
  pendingAuth,
  attachments,
}: {
  input: string;
  function_name: string;
  output?: string | null;
  domain?: string;
  pendingAuth?: boolean;
  attachments?: TAttachment[];
}) {
  const localize = useLocalize();
  
  // Check if output contains dashboard explanation
  const dashboardExplanation = useMemo<DashboardExplanationData | null>(() => {
    if (!output) {
      return null;
    }
    try {
      // Try parsing as JSON
      const parsed = JSON.parse(output);
      if (parsed && parsed.type === 'dashboard_explanation') {
        return parsed as DashboardExplanationData;
      }
      // Also check if it's nested in a result object
      if (parsed && typeof parsed === 'object' && 'result' in parsed) {
        const result = parsed.result;
        if (result && typeof result === 'string') {
          try {
            const nestedParsed = JSON.parse(result);
            if (nestedParsed && nestedParsed.type === 'dashboard_explanation') {
              return nestedParsed as DashboardExplanationData;
            }
          } catch {
            // Not nested JSON
          }
        }
      }
    } catch {
      // Not JSON or not dashboard explanation - try to find JSON in the string
      try {
        // Look for JSON object in the output string
        const jsonMatch = output.match(/\{[\s\S]*?"type"\s*:\s*"dashboard_explanation"[\s\S]*?\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed && parsed.type === 'dashboard_explanation') {
            return parsed as DashboardExplanationData;
          }
        }
      } catch {
        // Couldn't extract JSON
      }
    }
    return null;
  }, [output]);

  const formatText = (text: string) => {
    try {
      return JSON.stringify(JSON.parse(text), null, 2);
    } catch {
      return text;
    }
  };

  let title =
    domain != null && domain
      ? localize('com_assistants_domain_info', { 0: domain })
      : localize('com_assistants_function_use', { 0: function_name });
  if (pendingAuth === true) {
    title =
      domain != null && domain
        ? localize('com_assistants_action_attempt', { 0: domain })
        : localize('com_assistants_attempt_info');
  }

  const uiResources: UIResource[] =
    attachments
      ?.filter((attachment) => attachment.type === Tools.ui_resources)
      .flatMap((attachment) => {
        return attachment[Tools.ui_resources] as UIResource[];
      }) ?? [];

  return (
    <div className="w-full p-2">
      <div style={{ opacity: 1 }}>
        <div className="mb-2 text-sm font-medium text-text-primary">{title}</div>
        <div>
          <OptimizedCodeBlock text={formatText(input)} maxHeight={250} />
        </div>
        {output && (
          <>
            <div className="my-2 text-sm font-medium text-text-primary">
              {localize('com_ui_result')}
            </div>
            <div>
              {dashboardExplanation ? (
                <DashboardExplanation data={dashboardExplanation} />
              ) : (
                <OptimizedCodeBlock text={formatText(output)} maxHeight={250} />
              )}
            </div>
            {uiResources.length > 0 && (
              <div className="my-2 text-sm font-medium text-text-primary">
                {localize('com_ui_ui_resources')}
              </div>
            )}
            <div>
              {uiResources.length > 1 && <UIResourceCarousel uiResources={uiResources} />}

              {uiResources.length === 1 && (
                <UIResourceRenderer
                  resource={uiResources[0]}
                  onUIAction={async (result) => {
                    console.log('Action:', result);
                  }}
                  htmlProps={{
                    autoResizeIframe: { width: true, height: true },
                  }}
                />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
