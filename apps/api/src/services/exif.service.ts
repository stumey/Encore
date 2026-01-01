import exifr from 'exifr';
import { Logger } from '../utils/logger';

const logger = new Logger('ExifService');

export interface ExifMetadata {
  latitude: number;
  longitude: number;
  takenAt: Date | null;
  make: string | null;
  model: string | null;
}

export const exifService = {
  /**
   * Extract EXIF metadata from photo/video buffer
   * Returns null if no GPS data found (minimum viable for our use case)
   */
  async extract(buffer: Buffer): Promise<ExifMetadata | null> {
    try {
      const data = await exifr.parse(buffer, {
        pick: ['GPSLatitude', 'GPSLongitude', 'DateTimeOriginal', 'CreateDate', 'Make', 'Model'],
        gps: true,
      });

      if (!data?.latitude || !data?.longitude) {
        logger.debug('No GPS data in EXIF');
        return null;
      }

      const metadata: ExifMetadata = {
        latitude: data.latitude,
        longitude: data.longitude,
        takenAt: data.DateTimeOriginal ?? data.CreateDate ?? null,
        make: data.Make ?? null,
        model: data.Model ?? null,
      };

      logger.debug('EXIF extracted', { lat: metadata.latitude, lng: metadata.longitude });
      return metadata;
    } catch (error) {
      logger.warn('EXIF extraction failed', { error: (error as Error).message });
      return null;
    }
  },
};
