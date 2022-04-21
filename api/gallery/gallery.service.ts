import { HttpBadRequestError, HttpInternalServerError } from '@floteam/errors';
import { ResponseMessage } from '@interfaces/response-message.interface';
import { ImageService } from '@services/image.service';
import { MongoDatabase } from '@services/mongoose';
import { UserService } from '@services/user.service';
import fs from 'fs/promises';
import path from 'path';
import * as uuid from 'uuid';
import { MultipartFile } from 'lambda-multipart-parser';
import { MetaDataService } from '@services/meta-data.service';
import { RequestGalleryQueryParams, PicturePaths, SanitizedQueryParams } from './gallery.interfaces';

const mongoDB = new MongoDatabase();
const connect = mongoDB.connect();

export class GalleryService {
  private readonly imageService: ImageService;
  private readonly userService: UserService;
  private readonly picturesPath = path.resolve(__dirname, '..', '..', '..', '..', 'static', 'pictures');
  private readonly pictureLimit = Number(process.env.DEFAULT_PICTURE_LIMIT) || 6;

  constructor() {
    this.imageService = new ImageService();
    this.userService = new UserService();
  }

  private parseQueryParam(defaultValue: number, num?: string): number {
    if (!num) {
      return defaultValue;
    }

    const result = parseInt(num);

    const isInfinity = !isFinite(result);

    if (isInfinity) throw new HttpBadRequestError('I thought we were friends... Dont do this =(');

    if (result < 1) throw new HttpBadRequestError('Query params value must be more than zero');

    return result;
  }

  public validateAndSanitizeQuery(query: RequestGalleryQueryParams): SanitizedQueryParams {
    const requestPage = this.parseQueryParam(1, query.page);
    const limit = this.parseQueryParam(this.pictureLimit, query.limit);

    const skip = requestPage * limit - limit;
    const uploadedByUser = query.filter === 'true';

    return { limit, skip, uploadedByUser };
  }

  public async getPictures(query: SanitizedQueryParams, email: string) {
    const { uploadedByUser, skip, limit } = query;

    try {
      await connect;

      if (uploadedByUser) {
        const user = await this.userService.getByEmail(email);
        return this.imageService.getByUserId(user._id, { skip, limit });
      }

      return this.imageService.getAll({ skip, limit });
    } catch (error) {
      throw new HttpInternalServerError('Cant send pictures...', error.message);
    }
  }

  public async uploadPicture(picture: MultipartFile, email: string): Promise<ResponseMessage> {
    const newPictureName = (uuid.v4() + '_' + picture.filename).toLowerCase();

    try {
      await connect;

      const metadata = await MetaDataService.getExifMetadata(picture.content);

      await fs.writeFile(path.join(this.picturesPath, newPictureName), picture.content);

      const user = await this.userService.getByEmail(email);

      await this.imageService.create({ path: newPictureName, metadata, belongsTo: user._id });

      return { message: 'Picture uploaded' };
    } catch (error) {
      throw new HttpInternalServerError('Upload failed...', error.message);
    }
  }

  public async uploadExistingPictures(): Promise<ResponseMessage> {
    try {
      const pictures = await fs.readdir(this.picturesPath);
      const picturesInfo = pictures.map((pictureName): PicturePaths => {
        return {
          fsRelativePath: pictureName,
          fsAbsolutePath: path.join(this.picturesPath, pictureName),
        };
      });

      await connect;

      await Promise.all(
        picturesInfo.map(async (pictureInfo) => {
          const pictureBuffer = await fs.readFile(pictureInfo.fsAbsolutePath);
          const data = await MetaDataService.getExifMetadata(pictureBuffer);
          return this.imageService.create({ path: pictureInfo.fsRelativePath, metadata: data, belongsTo: null });
        })
      );

      return { message: 'Pictures uploaded' };
    } catch (error) {
      throw new HttpBadRequestError('Pictures already exist');
    }
  }
}
