import { HttpBadRequestError, HttpInternalServerError } from '@floteam/errors';
import { ResponseMessage } from '@interfaces/response-message.interface';
import { ImageService } from '@services/image.service';
import { UserService } from '@services/user.service';
import fs from 'fs/promises';
import path from 'path';
import * as uuid from 'uuid';
import { MultipartFile } from 'lambda-multipart-parser';
import { MetaDataService } from '@services/meta-data.service';
import { RequestGalleryQueryParams, PicturePaths, SanitizedQueryParams } from './gallery.interfaces';

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

    // TODO: add skip and limit
    try {
      if (uploadedByUser) {
        const user = await this.userService.getProfileByEmail(email);
        return this.imageService.getByUserEmail(user.email);
      }

      return this.imageService.getAllImages();
    } catch (error) {
      throw new HttpInternalServerError('Cant send pictures...', error.message);
    }
  }

  public async uploadPicture(picture: MultipartFile, email: string): Promise<ResponseMessage> {
    const newPictureName = (uuid.v4() + '_' + picture.filename).toLowerCase();

    try {
      const metadata = await MetaDataService.getExifMetadata(picture.content);

      await this.imageService.create({ name: newPictureName, metadata, status: 'Pending' }, email);

      return { message: 'Picture uploaded' };
    } catch (error) {
      throw new HttpInternalServerError(error);
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

      await Promise.all(
        picturesInfo.map(async (pictureInfo) => {
          const pictureBuffer = await fs.readFile(pictureInfo.fsAbsolutePath);
          const data = await MetaDataService.getExifMetadata(pictureBuffer);
          return this.imageService.create({ name: pictureInfo.fsRelativePath, metadata: data, status: 'Pending' });
        })
      );

      return { message: 'Pictures uploaded' };
    } catch (error) {
      throw new HttpBadRequestError('Pictures already exist');
    }
  }
}
