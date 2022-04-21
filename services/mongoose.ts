import mongoose from 'mongoose';
import { Database } from '@interfaces/database.interface';

export class MongoDatabase implements Database {
  private readonly mongoUrl: string;

  constructor() {
    const { MONGO_USER, MONGO_PASSWORD, MONGO_CLUSTER, MONGO_DB_NAME } = process.env;
    this.mongoUrl = `mongodb+srv://${MONGO_USER}:${MONGO_PASSWORD}@${MONGO_CLUSTER}.mongodb.net/${MONGO_DB_NAME}?retryWrites=true&w=majority`;
  }

  public async connect(url = this.mongoUrl) {
    try {
      await mongoose.connect(url);
    } catch (error) {
      throw new Error(`Cannot connect to mongo db. ${error}`);
    }
  }
}
