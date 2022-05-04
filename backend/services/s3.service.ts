import { getEnv } from '@helper/environment';
import { S3 } from 'aws-sdk';
import { PutObjectOutput, PutObjectRequest } from 'aws-sdk/clients/s3';

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

  public async put(key: string, body: string | Buffer, bucket: string, acl = 'public-read'): Promise<PutObjectOutput> {
    const params: PutObjectRequest = {
      ACL: acl,
      Bucket: bucket,
      Key: key,
      Body: body,
    };
    return this.s3.putObject(params).promise();
  }
}
