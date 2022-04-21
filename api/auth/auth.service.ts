import { HttpBadRequestError, HttpUnauthorizedError } from '@floteam/errors';
import { ResponseMessage } from '@interfaces/response-message.interface';
import { HashingService } from '@services/hashing.service';
import { MongoDatabase } from '@services/mongoose';
import { TokenService } from '@services/token.service';
import { UserService } from '@services/user.service';
import { JwtPayload, RequestUser } from './auth.interfaces';

const mongoDB = new MongoDatabase();
const connect = mongoDB.connect();

export class AuthService {
  private readonly hashingService: HashingService;
  private readonly tokenService: TokenService;
  private readonly userService: UserService;

  constructor() {
    this.hashingService = new HashingService();
    this.tokenService = new TokenService();
    this.userService = new UserService();
  }

  public parseAndValidateIncomingBody(body?: string): RequestUser {
    if (!body) throw new HttpBadRequestError('Please, provide credentials');

    const candidate = JSON.parse(body);

    if (!candidate.email) throw new HttpBadRequestError('Please, provide email');
    if (!candidate.password) throw new HttpBadRequestError('Please, provide password');

    return { email: candidate.email, password: candidate.password };
  }

  public async signIn(candidate: RequestUser): Promise<JwtPayload> {
    try {
      await connect;

      const user = await this.userService.getByEmail(candidate.email);

      await this.hashingService.verify(candidate.password, user.password);

      return this.tokenService.sign({ email: user.email });
    } catch (error) {
      throw new HttpUnauthorizedError('Bad credentials');
    }
  }

  public async signUp(candidate: RequestUser): Promise<ResponseMessage> {
    try {
      await connect;

      await this.userService.create(candidate);

      return { message: 'Created' };
    } catch (error) {
      throw new HttpBadRequestError('Email already exist');
    }
  }

  public async authenticate(token: string) {
    try {
      await connect;

      return this.tokenService.verify<JwtPayload>(token);
    } catch (error) {
      throw new HttpUnauthorizedError('Invalid token');
    }
  }

  public async uploadDevUsers(): Promise<ResponseMessage> {
    const devUsers = [
      { email: 'asergeev@flo.team', password: 'jgF5tn4F' },
      { email: 'vkotikov@flo.team', password: 'po3FGas8' },
      { email: 'tpupkin@flo.team', password: 'tpupkin@flo.team' },
    ];

    try {
      await connect;

      await Promise.all(
        devUsers.map(async (devUser) => {
          return this.userService.create(devUser);
        })
      );

      return { message: 'Dev users uploaded' };
    } catch (error) {
      throw new HttpBadRequestError('Dev users already exist');
    }
  }
}
