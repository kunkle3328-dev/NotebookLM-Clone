import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class StorageService {
  private s3Client: S3Client;
  private bucket: string;
  private publicUrl: string;

  constructor(private config: ConfigService) {
    const endpoint = this.config.get<string>('S3_ENDPOINT', 'http://localhost:9000');
    const region = this.config.get<string>('S3_REGION', 'us-east-1');
    const accessKeyId = this.config.get<string>('S3_ACCESS_KEY', 'minioadmin');
    const secretAccessKey = this.config.get<string>('S3_SECRET_KEY', 'minioadmin123');
    
    this.bucket = this.config.get<string>('S3_BUCKET', 'notebook');
    this.publicUrl = this.config.get<string>('S3_PUBLIC_URL', endpoint);

    this.s3Client = new S3Client({
      region,
      endpoint,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      forcePathStyle: true,
    });

    this.ensureBucketExists();
  }

  private async ensureBucketExists() {
    try {
      // In production, bucket should be created via infrastructure as code
      // This is a simple check
      console.log(`Using S3 bucket: ${this.bucket}`);
    } catch (error) {
      console.error('Failed to ensure bucket exists:', error);
    }
  }

  async uploadFile(
    path: string,
    filename: string,
    buffer: Buffer,
    contentType: string,
  ): Promise<string> {
    const key = `${path}/${filename}`;

    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      }),
    );

    return `${this.publicUrl}/${this.bucket}/${key}`;
  }

  async getSignedDownloadUrl(key: string, expiresIn: number = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    return getSignedUrl(this.s3Client, command, { expiresIn });
  }

  async deleteFile(key: string): Promise<void> {
    await this.s3Client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );
  }
}
