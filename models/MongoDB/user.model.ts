import { Schema, model, models, Model } from 'mongoose';

export interface User {
  _id: Schema.Types.ObjectId;
  email: string;
  password: string;
}

const userSchema = new Schema<User>({
  email: { type: String, unique: true, required: true, lowercase: true },
  password: { type: String, required: true },
});

export const userModel = (models.User as Model<User>) || model<User>('User', userSchema);
