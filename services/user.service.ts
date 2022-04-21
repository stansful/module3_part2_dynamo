import { AlreadyExistsError, HttpInternalServerError } from '@floteam/errors';
import { RuntimeError } from '@floteam/errors/runtime/runtime-error';
import { User, userModel } from '@models/MongoDB';
import { HashingService } from '@services/hashing.service';
import { DoesNotExistError } from '../errors/does-not-exist';

export class UserService {
  public async getByEmail(email: string): Promise<User> {
    const user = await userModel.findOne({ email });

    if (!user) {
      throw new DoesNotExistError('User does not exist');
    }

    return user;
  }

  public async create(candidate: Omit<User, '_id'>): Promise<User> {
    try {
      await this.getByEmail(candidate.email);
    } catch (error) {
      if (!(error instanceof RuntimeError)) {
        throw new HttpInternalServerError('User creating failed');
      }

      const hashingService = new HashingService();
      const encryptedPassword = await hashingService.encrypt(candidate.password);

      const user = await userModel.create({ ...candidate, password: encryptedPassword });
      return user.save();
    }
    throw new AlreadyExistsError('User already exist');
  }
}
