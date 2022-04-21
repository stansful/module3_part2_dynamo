import { Schema, model, models, Model } from 'mongoose';
import { ExifData } from 'ts-exif-parser';

export interface Image {
  path: string;
  metadata: ExifData;
  belongsTo: Schema.Types.ObjectId | null;
}

const imageSchema = new Schema<Image>({
  path: { type: String, unique: true, required: true, lowercase: true },
  metadata: { type: Object, required: true },
  belongsTo: { type: Schema.Types.ObjectId || null, ref: 'User' },
});

export const imageModel = (models.Image as Model<Image>) || model<Image>('Image', imageSchema);
