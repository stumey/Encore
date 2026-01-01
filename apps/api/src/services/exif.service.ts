import exifr from 'exifr';
import { Logger } from '../utils/logger';

const logger = new Logger('ExifService');

export interface ExifMetadata {
  latitude?: number;
  longitude?: number;
  takenAt: Date | null;
  make: string | null;
  model: string | null;
}

export const exifService = {
  /**
   * Extract EXIF metadata from photo/video buffer
   * Returns metadata with whatever fields are available (date, GPS, device info)
   */
  async extract(buffer: Buffer): Promise<ExifMetadata | null> {
    try {
      const data = await exifr.parse(buffer, {
        pick: ['GPSLatitude', 'GPSLongitude', 'DateTimeOriginal', 'CreateDate', 'Make', 'Model'],
        gps: true,
      });

      if (!data) {
        logger.debug('No EXIF data found');
        return null;
      }

      const takenAt = data.DateTimeOriginal ?? data.CreateDate ?? null;
      const hasGps = data.latitude && data.longitude;

      const metadata: ExifMetadata = {
        ...(hasGps && { latitude: data.latitude, longitude: data.longitude }),
        takenAt,
        make: data.Make ?? null,
        model: data.Model ?? null,
      };

      logger.debug('EXIF extracted', {
        hasGps,
        hasTakenAt: !!takenAt,
        ...(hasGps && { lat: data.latitude, lng: data.longitude }),
      });

      return metadata;
    } catch (error) {
      logger.warn('EXIF extraction failed', { error: (error as Error).message });
      return null;
    }
  },
};
