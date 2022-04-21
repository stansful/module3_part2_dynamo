import { AlreadyExistsError, HttpInternalServerError } from '@floteam/errors';
import { RuntimeError } from '@floteam/errors/runtime/runtime-error';
import { Image, imageModel } from '@models/MongoDB/image.model';
import mongoose from 'mongoose';
import { DoesNotExistError } from '../errors/does-not-exist';

export class ImageService {
  async getAll(options?: mongoose.QueryOptions): Promise<Image[]> {
    return imageModel.find({ belongsTo: null }, null, options);
  }

  async getByUserId(id: mongoose.Schema.Types.ObjectId, options?: mongoose.QueryOptions): Promise<Image[]> {
    return imageModel.find({ belongsTo: id }, null, options);
  }

  async getByFileName(fileName: string): Promise<Image> {
    const image = await imageModel.findOne({ path: fileName });

    if (!image) {
      throw new DoesNotExistError('Image does not exist');
    }

    return image;
  }

  async create(imageEntity: Image): Promise<Image> {
    try {
      await this.getByFileName(imageEntity.path);
    } catch (error) {
      if (!(error instanceof RuntimeError)) {
        throw new HttpInternalServerError('Image creating failed');
      }

      const image = await imageModel.create({ ...imageEntity });
      return image.save();
    }
    throw new AlreadyExistsError('Image already exist');
  }
}
