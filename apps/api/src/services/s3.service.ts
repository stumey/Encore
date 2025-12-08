import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { configService } from '../config/env';
import { Logger } from '../utils/logger';

const logger = new Logger('S3Service');

const client = new S3Client({
  region: configService.get('AWS_REGION'),
});

const bucketName = configService.get('S3_BUCKET_NAME');
const urlExpiry = configService.get('S3_PRESIGNED_URL_EXPIRY');

export const s3Service = {
  async generateUploadUrl(key: string, contentType: string): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      ContentType: contentType,
    });
    const url = await getSignedUrl(client, command, { expiresIn: urlExpiry });
    logger.debug('Generated upload URL', { key });
    return url;
  },

  async generateDownloadUrl(key: string): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    });
    const url = await getSignedUrl(client, command, { expiresIn: urlExpiry });
    return url;
  },

  async deleteObject(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    });
    await client.send(command);
    logger.info('Deleted S3 object', { key });
  },
};
