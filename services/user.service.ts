import { AlreadyExistsError, HttpInternalServerError } from '@floteam/errors';
import { RuntimeError } from '@floteam/errors/runtime/runtime-error';
import { getEnv } from '@helper/environment';
import { DynamoDBService } from '@services/dynamoDB.service';
import { HashingService } from '@services/hashing.service';
import { DoesNotExistError } from '../errors/does-not-exist';

export interface DynamoUserProfile {
  primaryKey: string;
  sortKey: string;
  email: string;
  password: string;
  createdAt: string;
}

export class UserService {
  private readonly dynamoDBService: DynamoDBService;
  private readonly hashingService: HashingService;
  private readonly usersTableName = getEnv('USERS_TABLE_NAME');

  constructor() {
    this.dynamoDBService = new DynamoDBService();
    this.hashingService = new HashingService();
  }

  public async getByEmail(email: string) {
    const user = await this.dynamoDBService.get(this.usersTableName, `USER#${email}`, `PROFILE#${email}`);

    if (!user?.Item?.email) {
      throw new DoesNotExistError('User does not exist');
    }

    return user.Item as DynamoUserProfile;
  }

  public async create(candidate: Pick<DynamoUserProfile, 'email' | 'password'>) {
    try {
      await this.getByEmail(candidate.email);
    } catch (error) {
      if (!(error instanceof RuntimeError)) {
        throw new HttpInternalServerError('User creating failed');
      }

      const encryptedPassword = await this.hashingService.encrypt(candidate.password);

      return this.dynamoDBService.put(this.usersTableName, `USER#${candidate.email}`, `PROFILE#${candidate.email}`, {
        email: candidate.email,
        password: encryptedPassword,
        createdAt: new Date().toLocaleDateString(),
      });
    }
    throw new AlreadyExistsError('User already exist');
  }
}
