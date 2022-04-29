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
  private readonly userPrefix = getEnv('USER_PREFIX');
  private readonly profilePrefix = getEnv('PROFILE_PREFIX');

  constructor() {
    this.dynamoDBService = new DynamoDBService();
    this.hashingService = new HashingService();
  }

  public async getProfileByEmail(email: string) {
    const user = await this.dynamoDBService.get(
      this.usersTableName,
      `${this.userPrefix}#${email}`,
      `${this.profilePrefix}#${email}`
    );

    if (!user?.Item) {
      throw new DoesNotExistError('User does not exist');
    }

    return user.Item as DynamoUserProfile;
  }

  public async create(candidate: Pick<DynamoUserProfile, 'email' | 'password'>) {
    try {
      await this.getProfileByEmail(candidate.email);
    } catch (error) {
      if (!(error instanceof RuntimeError)) {
        throw new HttpInternalServerError('User creating failed');
      }

      const encryptedPassword = await this.hashingService.encrypt(candidate.password);

      return this.dynamoDBService.put(
        this.usersTableName,
        `${this.userPrefix}#${candidate.email}`,
        `${this.profilePrefix}#${candidate.email}`,
        {
          email: candidate.email,
          password: encryptedPassword,
          createdAt: new Date().toLocaleDateString(),
        }
      );
    }
    throw new AlreadyExistsError('User already exist');
  }
}
