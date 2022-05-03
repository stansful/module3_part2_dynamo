import { HttpBadRequestError, HttpInternalServerError } from '@floteam/errors';
import { getEnv } from '@helper/environment';
import { ResponseMessage } from '@interfaces/response-message.interface';
import { ImageService } from '@services/image.service';
import { S3Service } from '@services/s3.service';
import { UserService } from '@services/user.service';
import fs from 'fs/promises';
import path from 'path';
import { ExifData } from 'ts-exif-parser';
import * as uuid from 'uuid';
import { MultipartFile } from 'lambda-multipart-parser';
import { MetaDataService } from '@services/meta-data.service';
import { RequestGalleryQueryParams, PicturePaths, SanitizedQueryParams } from './gallery.interfaces';

export class GalleryService {
  private readonly imageService = new ImageService();
  private readonly userService = new UserService();
  private readonly s3Service = new S3Service();
  private readonly imageBucket = getEnv('BUCKET');
  private readonly pictureLimit = getEnv('DEFAULT_PICTURE_LIMIT');
  private readonly picturesPath = path.resolve(__dirname, '..', '..', '..', '..', 'static', 'pictures');

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
    const limit = this.parseQueryParam(parseInt(this.pictureLimit), query.limit);

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

  public async getPreSignedUploadLink(email: string) {
    const generatedImageName = (uuid.v4() + '.jpeg').toLowerCase();

    await this.imageService.create({ name: generatedImageName, metadata: {} as ExifData, status: 'Pending' }, email);

    const uploadUrl = await this.s3Service.getPreSignedPutUrl(generatedImageName, this.imageBucket);

    return { key: generatedImageName, uploadUrl };
  }

  public async updateImageStatus(imageName: string) {
    const images = await this.imageService.getByImageName(imageName);
    const image = images[0];
    const email = image.primaryKey.split('#')[1];
    await this.imageService.update(email, imageName, { ...image, status: 'Uploaded' });
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
