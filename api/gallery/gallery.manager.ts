import { HttpBadRequestError } from '@floteam/errors';
import { MultipartRequest } from 'lambda-multipart-parser';
import { RequestGalleryQueryParams } from './gallery.interfaces';
import { GalleryService } from './gallery.service';

export class GalleryManager {
  private readonly galleryService: GalleryService;

  constructor() {
    this.galleryService = new GalleryService();
  }

  public getPictures(query: RequestGalleryQueryParams, email: string) {
    const sanitizedQuery = this.galleryService.validateAndSanitizeQuery(query);
    return this.galleryService.getPictures(sanitizedQuery, email);
  }

  public uploadPicture(pictures: MultipartRequest, email: string) {
    if (!pictures.files.length) {
      throw new HttpBadRequestError('File missing');
    }

    const picture = pictures.files[0];

    if (picture.contentType !== 'image/jpeg') {
      throw new HttpBadRequestError('Unfortunately we support only jpeg');
    }

    return this.galleryService.uploadPicture(picture, email);
  }

  public uploadExistingPictures() {
    return this.galleryService.uploadExistingPictures();
  }
}
