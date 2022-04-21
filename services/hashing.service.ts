import bcrypt from 'bcrypt';

type UnEncryptedData = string | Buffer;

interface Hashing {
  encrypt(data: UnEncryptedData): Promise<string>;

  verify(data: UnEncryptedData, encryptedData: string): Promise<void>;
}

export class HashingService implements Hashing {
  private readonly salt = Number(process.env.HASH_SALT) | 10;

  public async encrypt(data: UnEncryptedData) {
    return bcrypt.hash(data, this.salt);
  }

  public async verify(data: UnEncryptedData, encryptedData: string) {
    const isValid = await bcrypt.compare(data, encryptedData);

    if (!isValid) {
      throw new Error('Verification failed, data is not equal');
    }
  }
}
