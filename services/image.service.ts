import { AlreadyExistsError, HttpInternalServerError } from '@floteam/errors';
import { RuntimeError } from '@floteam/errors/runtime/runtime-error';
import { getEnv } from '@helper/environment';
import { DynamoDBService } from '@services/dynamoDB.service';
import { ExifData } from 'ts-exif-parser';
import { DoesNotExistError } from '../errors/does-not-exist';

export interface DynamoUserImage {
  primaryKey: string;
  sortKey: string;
  name: string;
  metadata: ExifData;
  status: 'Uploaded' | 'Pending' | 'Rejected';
}

export class ImageService {
  private readonly dynamoDBService: DynamoDBService;
  private readonly usersTableName = getEnv('USERS_TABLE_NAME');
  private readonly userPrefix = getEnv('USER_PREFIX');
  private readonly imagePrefix = getEnv('IMAGE_PREFIX');
  private readonly publicityImages = getEnv('PUBLICITY_IMAGE_EMAIL');

  constructor() {
    this.dynamoDBService = new DynamoDBService();
  }

  async getAllImages() {
    const images = await this.dynamoDBService.query(
      this.usersTableName,
      'primaryKey = :user AND begins_with (sortKey , :image)',
      {
        ':user': `${this.userPrefix}#${this.publicityImages}`,
        ':image': `${this.imagePrefix}#`,
      }
    );
    return (images?.Items ? images.Items : []) as DynamoUserImage[];
  }

  async getByUserEmail(email: string) {
    const images = await this.dynamoDBService.query(
      this.usersTableName,
      'primaryKey = :user AND begins_with (sortKey , :image)',
      {
        ':user': `${this.userPrefix}#${email}`,
        ':image': `${this.imagePrefix}#`,
      }
    );
    return (images?.Items ? images.Items : []) as DynamoUserImage[];
  }

  async getByImageName(imageName: string) {
    const images = await this.dynamoDBService.query(
      this.usersTableName,
      'sortKey = :image AND begins_with (primaryKey , :user)',
      {
        ':image': `${this.imagePrefix}#${imageName}`,
        ':user': `${this.userPrefix}#`,
      },
      'InvertedIndexes'
    );
    return (images?.Items ? images.Items : []) as DynamoUserImage[];
  }

  async getByEmailAndImageName(email: string, name: string) {
    const image = await this.dynamoDBService.get(
      this.usersTableName,
      `${this.userPrefix}#${email}`,
      `${this.imagePrefix}#${name}`
    );

    if (!image?.Item) {
      throw new DoesNotExistError('Image does not exist');
    }

    return image.Item as DynamoUserImage;
  }

  async create(image: Omit<DynamoUserImage, 'primaryKey' | 'sortKey'>, email = this.publicityImages) {
    try {
      await this.getByEmailAndImageName(email, image.name);
    } catch (error) {
      if (!(error instanceof RuntimeError)) {
        throw new HttpInternalServerError('Image creating failed');
      }

      return this.dynamoDBService.put(
        this.usersTableName,
        `${this.userPrefix}#${email}`,
        `${this.imagePrefix}#${image.name}`,
        image
      );
    }
    throw new AlreadyExistsError('Image already exist');
  }

  async update(email: string, imageName: string, attributes: Partial<Omit<DynamoUserImage, 'primaryKey' | 'sortKey'>>) {
    return this.dynamoDBService.put(
      this.usersTableName,
      `${this.userPrefix}#${email}`,
      `${this.imagePrefix}#${imageName}`,
      attributes
    );
  }
}
