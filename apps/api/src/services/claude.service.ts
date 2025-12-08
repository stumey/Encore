import Anthropic from '@anthropic-ai/sdk';
import axios from 'axios';
import { configService } from '../config/env';
import { Logger } from '../utils/logger';

const logger = new Logger('ClaudeService');

const client = new Anthropic({
  apiKey: configService.get('CLAUDE_API_KEY'),
});

const SYSTEM_PROMPT = `You are an expert concert identification AI. Your job is to analyze concert photos/videos and identify key details.

You will receive:
1. The image/video to analyze
2. EXIF metadata (date taken, GPS coordinates if available)
3. Any additional context

Use ALL available information to make your identification:

VISUAL ANALYSIS:
- Stage design, lighting rigs, LED screens
- Artist appearance, clothing, instruments
- Venue architecture (indoor/outdoor, arena/club/stadium)
- Merch, banners, tour branding visible
- Crowd size to estimate venue capacity

METADATA CORRELATION:
- If you know the date, cross-reference with known tour dates
- GPS coordinates can identify the venue
- Date + venue + visual clues = high confidence identification

TOUR IDENTIFICATION:
- Artists often have distinct stage designs per tour
- LED screen content, stage shape, lighting colors are tour-specific
- If you identify the artist and have a date, you can often determine the tour

Return your analysis as JSON:
{
  "artist": {
    "name": "Artist/band name or null",
    "confidence": 0.0-1.0,
    "clues": ["List of visual/contextual clues used"]
  },
  "venue": {
    "name": "Venue name or null",
    "city": "City or null",
    "type": "arena|stadium|club|theater|festival|outdoor|unknown",
    "confidence": 0.0-1.0,
    "clues": ["List of clues"]
  },
  "tour": {
    "name": "Tour name or null",
    "confidence": 0.0-1.0,
    "clues": ["List of clues"]
  },
  "estimatedDate": "YYYY-MM-DD or null if no EXIF and can't infer",
  "overallConfidence": 0.0-1.0,
  "reasoning": "Brief summary of your identification process"
}`;

export interface PhotoMetadata {
  takenAt?: Date | string;
  latitude?: number;
  longitude?: number;
  originalFilename?: string;
}

export interface ArtistAnalysis {
  name: string | null;
  confidence: number;
  clues: string[];
}

export interface VenueAnalysis {
  name: string | null;
  city: string | null;
  type: 'arena' | 'stadium' | 'club' | 'theater' | 'festival' | 'outdoor' | 'unknown';
  confidence: number;
  clues: string[];
}

export interface TourAnalysis {
  name: string | null;
  confidence: number;
  clues: string[];
}

export interface PhotoAnalysis {
  artist: ArtistAnalysis;
  venue: VenueAnalysis;
  tour: TourAnalysis;
  estimatedDate: string | null;
  overallConfidence: number;
  reasoning: string;
}

async function fetchImageAsBase64(url: string): Promise<{ data: string; mediaType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' }> {
  const response = await axios.get(url, { responseType: 'arraybuffer' });
  const contentType = response.headers['content-type'] as string;

  const mediaType = (['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(contentType)
    ? contentType
    : 'image/jpeg') as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';

  const data = Buffer.from(response.data).toString('base64');
  return { data, mediaType };
}

export const claudeService = {
  async analyzePhoto(imageUrl: string, metadata?: PhotoMetadata): Promise<PhotoAnalysis> {
    logger.debug('Analyzing photo', { imageUrl, metadata });

    // Fetch image and convert to base64
    const image = await fetchImageAsBase64(imageUrl);

    // Build context from metadata
    let contextMessage = 'Analyze this concert photo.';

    if (metadata) {
      const contextParts: string[] = [];

      if (metadata.takenAt) {
        const date = new Date(metadata.takenAt);
        contextParts.push(`Photo taken: ${date.toISOString().split('T')[0]} at ${date.toTimeString().slice(0, 5)}`);
      }

      if (metadata.latitude && metadata.longitude) {
        contextParts.push(`GPS coordinates: ${metadata.latitude}, ${metadata.longitude}`);
      }

      if (metadata.originalFilename) {
        contextParts.push(`Original filename: ${metadata.originalFilename}`);
      }

      if (contextParts.length > 0) {
        contextMessage = `Analyze this concert photo.\n\nEXIF Metadata:\n${contextParts.join('\n')}\n\nUse this metadata to help identify the tour and venue.`;
      }
    }

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: image.mediaType,
                data: image.data,
              },
            },
            {
              type: 'text',
              text: contextMessage,
            },
          ],
        },
      ],
    });

    const text = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('');

    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found in response');

      const analysis = JSON.parse(jsonMatch[0]) as PhotoAnalysis;

      logger.info('Photo analyzed', {
        artist: analysis.artist.name,
        venue: analysis.venue.name,
        confidence: analysis.overallConfidence,
      });

      return analysis;
    } catch (error) {
      logger.error('Failed to parse AI response', { text, error });
      return {
        artist: { name: null, confidence: 0, clues: [] },
        venue: { name: null, city: null, type: 'unknown', confidence: 0, clues: [] },
        tour: { name: null, confidence: 0, clues: [] },
        estimatedDate: null,
        overallConfidence: 0,
        reasoning: 'Failed to analyze photo',
      };
    }
  },

  /**
   * Analyze multiple photos from the same concert for better accuracy
   */
  async analyzePhotoBatch(
    imageUrls: string[],
    metadata?: PhotoMetadata
  ): Promise<PhotoAnalysis> {
    if (imageUrls.length === 1) {
      return this.analyzePhoto(imageUrls[0], metadata);
    }

    // For multiple photos, analyze first few and combine insights
    const analyses = await Promise.all(
      imageUrls.slice(0, 3).map((url) => this.analyzePhoto(url, metadata))
    );

    // Find consensus - prefer higher confidence results
    const bestArtist = analyses
      .map((a) => a.artist)
      .sort((a, b) => b.confidence - a.confidence)[0];

    const bestVenue = analyses
      .map((a) => a.venue)
      .sort((a, b) => b.confidence - a.confidence)[0];

    const bestTour = analyses
      .map((a) => a.tour)
      .sort((a, b) => b.confidence - a.confidence)[0];

    return {
      artist: bestArtist,
      venue: bestVenue,
      tour: bestTour,
      estimatedDate: analyses.find((a) => a.estimatedDate)?.estimatedDate ?? null,
      overallConfidence: Math.max(...analyses.map((a) => a.overallConfidence)),
      reasoning: `Analyzed ${imageUrls.length} photos for better accuracy`,
    };
  },
};
