import { isAfter } from 'date-fns';
import React, { useMemo } from 'react';
import { imageExtRegex } from 'librechat-data-provider';
import type { TFile, TAttachment, TAttachmentMetadata } from 'librechat-data-provider';
import Image from '~/components/Chat/Messages/Content/Image';
import { useLocalize } from '~/hooks';
import LogLink from './LogLink';
import Chart, { type ChartData } from './Chart';
import Video from './Video';

const videoExtRegex = /\.(mp4|webm|ogg|mov|avi|mkv|flv|wmv|m4v|3gp|gif)$/i;

interface LogContentProps {
  output?: string;
  renderImages?: boolean;
  attachments?: TAttachment[];
}

type ImageAttachment = TFile &
  TAttachmentMetadata & {
    height: number;
    width: number;
  };

const LogContent: React.FC<LogContentProps> = ({ output = '', renderImages, attachments }) => {
  const localize = useLocalize();

  const processedContent = useMemo(() => {
    if (!output) {
      return '';
    }

    const parts = output.split('Generated files:');
    return parts[0].trim();
  }, [output]);

  // Detect chart data in output
  const chartData = useMemo<ChartData | null>(() => {
    if (!output) {
      return null;
    }

    // Plotly and Chart.js support removed to reduce bundle size
    // const plotlyMatch = output.match(/```(?:json|plotly)?\s*(\{[\s\S]*?"type"\s*:\s*"plotly"[\s\S]*?\})\s*```/);
    // if (plotlyMatch) {
    //   try {
    //     const parsed = JSON.parse(plotlyMatch[1]);
    //     return { type: 'plotly', ...parsed };
    //   } catch {
    //     // Continue to other detection methods
    //   }
    // }

    // const chartjsMatch = output.match(/```(?:json|chartjs)?\s*(\{[\s\S]*?"type"\s*:\s*"chartjs"[\s\S]*?\})\s*```/);
    // if (chartjsMatch) {
    //   try {
    //     const parsed = JSON.parse(chartjsMatch[1]);
    //     return { type: 'chartjs', ...parsed };
    //   } catch {
    //     // Continue to other detection methods
    //   }
    // }

    // Try to detect inline JSON chart data (only for image/json types now)
    const jsonMatch = output.match(/\{[\s\S]*?"type"\s*:\s*"(?:image|json)"[\s\S]*?\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        return parsed as ChartData;
      } catch {
        // Not valid JSON
      }
    }

    return null;
  }, [output]);

  const { imageAttachments, videoAttachments, nonImageAttachments } = useMemo(() => {
    const imageAtts: ImageAttachment[] = [];
    const videoAtts: TAttachment[] = [];
    const nonImageAtts: TAttachment[] = [];

    attachments?.forEach((attachment) => {
      const { width, height, filepath = null } = attachment as TFile & TAttachmentMetadata;
      const isImage =
        imageExtRegex.test(attachment.filename ?? '') &&
        width != null &&
        height != null &&
        filepath != null;
      const isVideo =
        videoExtRegex.test(attachment.filename ?? '') && filepath != null;
      
      if (isVideo) {
        videoAtts.push(attachment);
      } else if (isImage) {
        imageAtts.push(attachment as ImageAttachment);
      } else {
        nonImageAtts.push(attachment);
      }
    });

    return {
      imageAttachments: renderImages === true ? imageAtts : null,
      videoAttachments: videoAtts,
      nonImageAttachments: nonImageAtts,
    };
  }, [attachments, renderImages]);

  const renderAttachment = (file: TAttachment) => {
    const now = new Date();
    const expiresAt =
      'expiresAt' in file && typeof file.expiresAt === 'number' ? new Date(file.expiresAt) : null;
    const isExpired = expiresAt ? isAfter(now, expiresAt) : false;
    const filename = file.filename || '';

    if (isExpired) {
      return `${filename} ${localize('com_download_expired')}`;
    }

    const filepath = file.filepath || '';

    // const expirationText = expiresAt
    //   ? ` ${localize('com_download_expires', { 0: format(expiresAt, 'MM/dd/yy HH:mm') })}`
    //   : ` ${localize('com_click_to_download')}`;

    return (
      <LogLink href={filepath} filename={filename}>
        {'- '}
        {filename} {localize('com_click_to_download')}
      </LogLink>
    );
  };

  return (
    <>
      {chartData && <Chart chartData={chartData} />}
      {processedContent && <div>{processedContent}</div>}
      {videoAttachments.length > 0 && (
        <div className="my-2">
          {videoAttachments.map((attachment, index) => {
            const { filepath } = attachment as TFile & TAttachmentMetadata;
            return (
              <Video
                key={index}
                src={filepath ?? ''}
                title={attachment.filename || 'Video'}
                controls={true}
              />
            );
          })}
        </div>
      )}
      {nonImageAttachments.length > 0 && (
        <div>
          <p>{localize('com_generated_files')}</p>
          {nonImageAttachments.map((file, index) => (
            <React.Fragment key={file.filepath}>
              {renderAttachment(file)}
              {index < nonImageAttachments.length - 1 && ', '}
            </React.Fragment>
          ))}
        </div>
      )}
      {imageAttachments?.map((attachment, index) => {
        const { width, height, filepath } = attachment;
        return (
          <Image
            key={index}
            altText={attachment.filename}
            imagePath={filepath}
            height={height}
            width={width}
          />
        );
      })}
    </>
  );
};

export default LogContent;
