import { getEnv } from '@helper/environment';
import { S3 } from 'aws-sdk';

export class S3Service {
  private readonly s3 = new S3({ region: getEnv('REGION') });

  public getPreSignedGetUrl(key: string, bucket: string): string {
    const params = {
      Bucket: bucket,
      Key: key,
      Expires: 60 * 5, // 5mins
    };
    return this.s3.getSignedUrl('getObject', params);
  }

  public getPreSignedPutUrl(key: string, bucket: string): string {
    const params = {
      Bucket: bucket,
      Key: key,
      Expires: 60 * 10, // 10mins
    };
    return this.s3.getSignedUrl('putObject', params);
  }
}
