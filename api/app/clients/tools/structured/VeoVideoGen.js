const { z } = require('zod');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const { Tool } = require('@langchain/core/tools');
const { logger } = require('@librechat/data-schemas');
const { HttpsProxyAgent } = require('https-proxy-agent');
const { FileContext, ContentTypes } = require('librechat-data-provider');

const displayMessage =
  "Veo displayed a video. All generated videos are already plainly visible, so don't repeat the descriptions in detail. Do not list download links as they are available in the UI already. The user may download the videos by clicking on them, but do not mention anything about downloading to the user.";

/**
 * VeoVideoGen - A tool for generating videos using Google's Veo 3.0 models
 * Supports: veo-3.0-fast-generate, veo-3.0-generate
 */
class VeoVideoGen extends Tool {
  constructor(fields = {}) {
    super();

    /** @type {boolean} Used to initialize the Tool without necessary variables. */
    this.override = fields.override ?? false;
    /** @type {boolean} Necessary for output to contain all video metadata. */
    this.returnMetadata = fields.returnMetadata ?? false;

    this.userId = fields.userId;
    this.fileStrategy = fields.fileStrategy;
    /** @type {boolean} */
    this.isAgent = fields.isAgent;

    if (fields.processFileURL) {
      /** @type {processFileURL} Necessary for output to contain all video metadata. */
      this.processFileURL = fields.processFileURL.bind(this);
    }

    // Support both GOOGLE_KEY and GOOGLE_API_KEY from auth fields
    this.apiKey = fields.GOOGLE_KEY ?? fields.GOOGLE_API_KEY ?? this.getApiKey();
    this.baseURL = 'https://generativelanguage.googleapis.com/v1beta';

    this.name = 'veo-video-gen';
    this.description =
      'Generate videos from text descriptions using Google Veo 3.0 models. Supports fast and standard generation modes.';

    this.description_for_model = `// Generate videos from text descriptions using Google's Veo 3.0 models.
    // Available models:
    // - veo-3.0-fast-generate: Fast generation (2 RPM, 10/day)
    // - veo-3.0-generate: Standard generation (2 RPM, 10/day)
    // 
    // Guidelines:
    // 1. Create detailed, descriptive prompts (3+ sentences)
    // 2. Specify motion, camera movement, scene transitions
    // 3. One video per function call
    // 4. Videos take longer to generate than images (may take minutes)`;

    this.schema = z.object({
      prompt: z
        .string()
        .min(10)
        .max(4000)
        .describe('Detailed text description of the desired video (3+ sentences recommended)'),
      model: z
        .enum(['veo-3.0-fast-generate', 'veo-3.0-generate'])
        .default('veo-3.0-fast-generate')
        .describe('Model to use for video generation'),
      aspect_ratio: z
        .enum(['16:9', '9:16', '1:1'])
        .optional()
        .default('16:9')
        .describe('Aspect ratio of the generated video'),
      duration: z
        .enum(['5s', '10s', '30s'])
        .optional()
        .default('5s')
        .describe('Duration of the video'),
      safety_filter_level: z
        .enum(['block_most', 'block_some', 'block_few', 'block_fewest'])
        .optional()
        .default('block_some')
        .describe('Safety filter level for content moderation'),
    });
  }

  getApiKey() {
    const apiKey = process.env.GOOGLE_KEY ?? process.env.GOOGLE_API_KEY ?? '';
    if (!apiKey && !this.override) {
      throw new Error('Missing GOOGLE_KEY or GOOGLE_API_KEY environment variable.');
    }
    return apiKey;
  }

  getAxiosConfig() {
    const config = {
      headers: {
        'Content-Type': 'application/json',
      },
    };
    if (process.env.PROXY) {
      config.httpsAgent = new HttpsProxyAgent(process.env.PROXY);
    }
    return config;
  }

  wrapInMarkdown(videoUrl) {
    return `![generated video](${videoUrl})`;
  }

  returnValue(value) {
    if (this.isAgent === true && typeof value === 'string') {
      return [value, {}];
    } else if (this.isAgent === true && typeof value === 'object') {
      return [displayMessage, value];
    }
    return value;
  }

  async _call(data) {
    const {
      prompt,
      model = 'veo-3.0-fast-generate',
      aspect_ratio = '16:9',
      duration = '5s',
      safety_filter_level = 'block_some',
    } = data;

    if (!prompt) {
      throw new Error('Missing required field: prompt');
    }

    let resp;
    try {
      const endpoint = `${this.baseURL}/models/${model}:generateVideo`;

      const requestBody = {
        prompt: {
          text: prompt,
        },
        aspect_ratio: aspect_ratio,
        duration: duration,
        safety_filter_level: safety_filter_level,
      };

      const config = this.getAxiosConfig();
      resp = await axios.post(
        `${endpoint}?key=${this.apiKey}`,
        requestBody,
        config,
      );

      logger.debug('[VeoVideoGen] Response:', {
        model,
        status: resp.status,
        hasVideo: !!resp.data?.video,
      });
    } catch (error) {
      logger.error('[VeoVideoGen] Problem generating the video:', error);
      const errorMessage = error.response?.data?.error?.message || error.message;
      return this.returnValue(
        `Something went wrong when trying to generate the video. The Veo API may be unavailable:\nError Message: ${errorMessage}`,
      );
    }

    if (!resp || !resp.data || !resp.data.video) {
      return this.returnValue(
        'No video returned from Veo API. There may be a problem with the API or your configuration.',
      );
    }

    const videoData = resp.data.video;
    let videoUrl;
    let base64Data;

    // Handle different response formats
    if (videoData.videoBase64) {
      base64Data = videoData.videoBase64;
      videoUrl = `data:video/mp4;base64,${base64Data}`;
    } else if (videoData.videoUrl) {
      videoUrl = videoData.videoUrl;
    } else if (videoData.base64) {
      base64Data = videoData.base64;
      videoUrl = `data:video/mp4;base64,${base64Data}`;
    } else {
      return this.returnValue('Unknown video format returned from API.');
    }

    if (!videoUrl) {
      return this.returnValue('No video data returned from API.');
    }

    if (this.isAgent) {
      // For agents, return base64 directly
      let base64 = base64Data;
      if (!base64 && videoUrl.startsWith('data:')) {
        base64 = videoUrl.split(',')[1];
      } else if (!base64 && videoUrl.startsWith('http')) {
        // Fetch video if URL
        try {
          const videoResponse = await axios.get(videoUrl, {
            responseType: 'arraybuffer',
            ...this.getAxiosConfig(),
          });
          base64 = Buffer.from(videoResponse.data).toString('base64');
        } catch (fetchError) {
          logger.error('[VeoVideoGen] Error fetching video:', fetchError);
          return this.returnValue('Error fetching video from URL.');
        }
      }

      if (base64) {
        const content = [
          {
            type: ContentTypes.IMAGE_URL, // Using IMAGE_URL for now, may need VIDEO_URL type
            image_url: {
              url: `data:video/mp4;base64,${base64}`,
            },
          },
        ];

        const response = [
          {
            type: ContentTypes.TEXT,
            text: displayMessage,
          },
        ];
        return [response, { content }];
      }
    } else {
      // For regular use, save video and return markdown
      const videoName = `video-${uuidv4()}.mp4`;

      try {
        let videoBuffer;
        if (base64Data) {
          videoBuffer = Buffer.from(base64Data, 'base64');
        } else if (videoUrl.startsWith('http')) {
          const videoResponse = await axios.get(videoUrl, {
            responseType: 'arraybuffer',
            ...this.getAxiosConfig(),
          });
          videoBuffer = Buffer.from(videoResponse.data);
        } else if (videoUrl.startsWith('data:')) {
          const base64 = videoUrl.split(',')[1];
          videoBuffer = Buffer.from(base64, 'base64');
        }

        if (videoBuffer) {
          const result = await this.processFileURL({
            URL: `data:video/mp4;base64,${videoBuffer.toString('base64')}`,
            basePath: 'uploads',
            userId: this.userId,
            fileName: videoName,
            fileStrategy: this.fileStrategy,
            context: FileContext.image_generation, // Using image_generation for now
          });

          if (this.returnMetadata) {
            this.result = result;
          } else {
            this.result = this.wrapInMarkdown(result.filepath);
          }
        }
      } catch (error) {
        logger.error('[VeoVideoGen] Error while saving the video:', error);
        return this.returnValue(`Failed to save video: ${error.message}`);
      }
    }

    return this.returnValue(this.result || displayMessage);
  }
}

module.exports = VeoVideoGen;

