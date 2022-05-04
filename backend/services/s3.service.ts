import { getEnv } from '@helper/environment';
import { S3 } from 'aws-sdk';

export class S3Service {
  private readonly s3 = new S3({ region: getEnv('REGION') });

  public async getPreSignedGetUrl(key: string, bucket: string) {
    const params = {
      Bucket: bucket,
      Key: key,
      Expires: 60 * 5, // 5mins
    };
    return this.s3.getSignedUrlPromise('getObject', params);
  }

  public async getPreSignedPutUrl(key: string, bucket: string, contentType = 'image/jpeg') {
    const params = {
      Bucket: bucket,
      Key: key,
      Expires: 60 * 10, // 10mins
      ContentType: contentType,
    };
    return this.s3.getSignedUrlPromise('putObject', params);
  }
}
