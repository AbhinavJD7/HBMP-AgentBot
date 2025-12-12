const { z } = require('zod');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const { Tool } = require('@langchain/core/tools');
const { logger } = require('@librechat/data-schemas');
const { HttpsProxyAgent } = require('https-proxy-agent');
const { FileContext, ContentTypes } = require('librechat-data-provider');
const { getImageBasename } = require('@librechat/api');

const displayMessage =
  "Gemini displayed an image. All generated images are already plainly visible, so don't repeat the descriptions in detail. Do not list download links as they are available in the UI already. The user may download the images by clicking on them, but do not mention anything about downloading to the user.";

/**
 * GeminiImageGen - A tool for generating images using Google's Gemini/Imagen models
 * Supports multiple models: gemini-2.5-flash-preview-image, gemini-3-pro-image, imagen-4.0 models
 */
class GeminiImageGen extends Tool {
  constructor(fields = {}) {
    super();

    /** @type {boolean} Used to initialize the Tool without necessary variables. */
    this.override = fields.override ?? false;
    /** @type {boolean} Necessary for output to contain all image metadata. */
    this.returnMetadata = fields.returnMetadata ?? false;

    this.userId = fields.userId;
    this.fileStrategy = fields.fileStrategy;
    /** @type {boolean} */
    this.isAgent = fields.isAgent;

    if (fields.processFileURL) {
      /** @type {processFileURL} Necessary for output to contain all image metadata. */
      this.processFileURL = fields.processFileURL.bind(this);
    }

    // Support both GOOGLE_KEY and GOOGLE_API_KEY from auth fields
    this.apiKey = fields.GOOGLE_KEY ?? fields.GOOGLE_API_KEY ?? this.getApiKey();
    // Use the correct base URL for image generation
    // Gemini image models use the generativelanguage API
    this.baseURL = 'https://generativelanguage.googleapis.com/v1beta';

    this.name = 'gemini-image-gen';
    this.description =
      'Generate high-quality images from text descriptions using Google Gemini/Imagen models. Supports multiple models with different quality and speed options.';

    this.description_for_model = `// Generate images from text descriptions using Google's Gemini image models.
    // Available models:
    // - gemini-2.5-flash-preview-image: Fast generation (500 RPM, 2/day) - Recommended for speed
    // - gemini-3-pro-image: High quality generation (20 RPM, 2/day) - Recommended for quality
    // 
    // Guidelines:
    // 1. Create detailed, descriptive prompts (3+ sentences)
    // 2. Specify visual elements: lighting, composition, mood, style
    // 3. One image per function call unless explicitly requested multiple
    // 4. Use gemini-2.5-flash-preview-image for faster results, gemini-3-pro-image for higher quality`;

    this.schema = z.object({
      prompt: z
        .string()
        .min(10)
        .max(4000)
        .describe('Detailed text description of the desired image (3+ sentences recommended)'),
      model: z
        .enum([
          'gemini-2.5-flash-preview-image',
          'gemini-3-pro-image',
          'imagen-4.0-fast-generate',
          'imagen-4.0-generate',
          'imagen-4.0-ultra-generate',
        ])
        .default('gemini-2.5-flash-preview-image')
        .describe('Model to use for image generation. Available: gemini-2.5-flash-preview-image (fast, 500 RPM), gemini-3-pro-image (high quality, 20 RPM), imagen-4.0 models (Imagen API)'),
      aspect_ratio: z
        .enum(['1:1', '9:16', '16:9', '4:3', '3:4'])
        .optional()
        .describe('Aspect ratio of the generated image'),
      number_of_images: z
        .number()
        .int()
        .min(1)
        .max(4)
        .default(1)
        .describe('Number of images to generate (1-4)'),
      safety_filter_level: z
        .enum(['block_most', 'block_some', 'block_few', 'block_fewest'])
        .optional()
        .default('block_some')
        .describe('Safety filter level for content moderation'),
      person_generation: z
        .enum(['allow_all', 'allow_adult', 'dont_allow'])
        .optional()
        .default('allow_adult')
        .describe('Person generation policy'),
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

  wrapInMarkdown(imageUrl) {
    return `![generated image](${imageUrl})`;
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
      model = 'gemini-2.5-flash-preview-image',
      aspect_ratio,
      number_of_images = 1,
      safety_filter_level = 'block_some',
      person_generation = 'allow_adult',
    } = data;

    if (!prompt) {
      throw new Error('Missing required field: prompt');
    }

    // Determine endpoint and request body based on model type
    // Imagen models use generateImage, Gemini image models use generateContent
    let endpoint;
    let requestBody;
    
    if (model.startsWith('imagen-')) {
      // Imagen models use generateImage endpoint
      endpoint = `${this.baseURL}/models/${model}:generateImage`;
      requestBody = {
        prompt: {
          text: prompt,
        },
        number_of_images: Math.min(Math.max(1, number_of_images), 4),
      };
      
      if (aspect_ratio) {
        requestBody.aspect_ratio = aspect_ratio;
      }
      if (safety_filter_level) {
        requestBody.safety_filter_level = safety_filter_level;
      }
      if (person_generation) {
        requestBody.person_generation = person_generation;
      }
    } else {
      // Gemini image models use generateContent with responseModalities
      // Note: Some parameters may not be supported in generationConfig for image models
      endpoint = `${this.baseURL}/models/${model}:generateContent`;
      requestBody = {
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          responseModalities: ['IMAGE'],
        },
      };

      // Note: These parameters may need to be in a different location or not supported
      // For now, we'll only include responseModalities which is required for image generation
      // If multiple images are needed, we may need to make multiple requests
    }
    
    let resp;
    try {
      // Log the endpoint for debugging
      logger.debug('[GeminiImageGen] Calling endpoint:', endpoint);
      logger.debug('[GeminiImageGen] Model type:', model.startsWith('imagen-') ? 'Imagen' : 'Gemini');

      const config = this.getAxiosConfig();
      resp = await axios.post(
        `${endpoint}?key=${this.apiKey}`,
        requestBody,
        config,
      );

      logger.debug('[GeminiImageGen] Response:', {
        model,
        status: resp.status,
        responseKeys: Object.keys(resp.data || {}),
        candidatesCount: resp.data?.candidates?.length || 0,
      });
    } catch (error) {
      logger.error('[GeminiImageGen] Problem generating the image:', {
        error: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        endpoint: endpoint,
        model: model,
        apiKeyPresent: !!this.apiKey,
        errorData: error.response?.data,
      });
      const errorMessage = error.response?.data?.error?.message || error.message;
      const statusCode = error.response?.status;
      
      // Provide more specific error messages
      if (statusCode === 404) {
        return this.returnValue(
          `The image generation endpoint was not found (404). This might mean:\n` +
          `1. The model "${model}" is not available or the name is incorrect\n` +
          `2. The API endpoint has changed\n` +
          `3. Your API key doesn't have access to image generation\n` +
          `Error: ${errorMessage || 'Endpoint not found'}`,
        );
      }
      
      return this.returnValue(
        `Something went wrong when trying to generate the image (Status: ${statusCode || 'Unknown'}):\nError Message: ${errorMessage}`,
      );
    }

    // Handle different response formats based on endpoint used
    const generatedImages = [];
    
    if (model.startsWith('imagen-')) {
      // Imagen API response format: { generatedImages: [{ imageBase64, ... }] }
      if (resp.data?.generatedImages && resp.data.generatedImages.length > 0) {
        generatedImages.push(...resp.data.generatedImages);
      }
    } else {
      // Gemini generateContent response format: { candidates: [{ content: { parts: [{ inlineData: { data, mimeType } }] } }] }
      if (resp.data?.candidates && resp.data.candidates.length > 0) {
        for (const candidate of resp.data.candidates) {
          if (candidate.content && candidate.content.parts) {
            for (const part of candidate.content.parts) {
              if (part.inlineData && part.inlineData.data) {
                generatedImages.push({
                  imageBase64: part.inlineData.data,
                  mimeType: part.inlineData.mimeType || 'image/png',
                });
              }
            }
          }
        }
      }
    }

    if (generatedImages.length === 0) {
      logger.warn('[GeminiImageGen] No images in response. Response structure:', JSON.stringify(resp.data, null, 2));
      return this.returnValue(
        'No images returned from Gemini API. There may be a problem with the API or your configuration. Check logs for response structure.',
      );
    }
    const imageResults = [];

    // Process each generated image
    for (const imageData of generatedImages) {
      let imageUrl;
      let base64Data;

      // Handle different response formats
      if (imageData.imageBase64) {
        base64Data = imageData.imageBase64;
        imageUrl = `data:image/png;base64,${base64Data}`;
      } else if (imageData.imageUrl) {
        imageUrl = imageData.imageUrl;
      } else if (imageData.base64) {
        base64Data = imageData.base64;
        imageUrl = `data:image/png;base64,${base64Data}`;
      } else {
        logger.warn('[GeminiImageGen] Unknown image format:', imageData);
        continue;
      }

      if (!imageUrl) {
        continue;
      }

      if (this.isAgent) {
        // For agents, return base64 directly
        let base64 = base64Data;
        if (!base64 && imageUrl.startsWith('data:')) {
          base64 = imageUrl.split(',')[1];
        } else if (!base64 && imageUrl.startsWith('http')) {
          // Fetch image if URL
          try {
            const imageResponse = await axios.get(imageUrl, {
              responseType: 'arraybuffer',
              ...this.getAxiosConfig(),
            });
            base64 = Buffer.from(imageResponse.data).toString('base64');
          } catch (fetchError) {
            logger.error('[GeminiImageGen] Error fetching image:', fetchError);
            continue;
          }
        }

        if (base64) {
          imageResults.push({
            type: ContentTypes.IMAGE_URL,
            image_url: {
              url: `data:image/png;base64,${base64}`,
            },
          });
        }
      } else {
        // For regular use, save image and return markdown
        const imageName = `img-${uuidv4()}.png`;

        try {
          let imageBuffer;
          if (base64Data) {
            imageBuffer = Buffer.from(base64Data, 'base64');
          } else if (imageUrl.startsWith('http')) {
            const imageResponse = await axios.get(imageUrl, {
              responseType: 'arraybuffer',
              ...this.getAxiosConfig(),
            });
            imageBuffer = Buffer.from(imageResponse.data);
          } else if (imageUrl.startsWith('data:')) {
            const base64 = imageUrl.split(',')[1];
            imageBuffer = Buffer.from(base64, 'base64');
          }

          if (imageBuffer) {
            const result = await this.processFileURL({
              URL: `data:image/png;base64,${imageBuffer.toString('base64')}`,
              basePath: 'images',
              userId: this.userId,
              fileName: imageName,
              fileStrategy: this.fileStrategy,
              context: FileContext.image_generation,
            });

            if (this.returnMetadata) {
              imageResults.push(result);
            } else {
              imageResults.push(this.wrapInMarkdown(result.filepath));
            }
          }
        } catch (error) {
          logger.error('[GeminiImageGen] Error while saving the image:', error);
          imageResults.push(`Failed to save image: ${error.message}`);
        }
      }
    }

    if (this.isAgent && imageResults.length > 0) {
      const response = [
        {
          type: ContentTypes.TEXT,
          text: displayMessage,
        },
      ];
      return [response, { content: imageResults }];
    }

    if (imageResults.length === 0) {
      return this.returnValue('No images were successfully generated or saved.');
    }

    return this.returnValue(imageResults.join('\n\n'));
  }
}

module.exports = GeminiImageGen;

