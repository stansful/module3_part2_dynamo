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

  public uploadPicture(pictures: MultipartRequest) {
    if (!pictures.files.length) {
      throw new HttpBadRequestError('File missing');
    }

    const picture = pictures.files[0];

    if (picture.contentType !== 'image/jpeg') {
      throw new HttpBadRequestError('Unfortunately we support only jpeg');
    }

    return this.galleryService.uploadPicture(picture);
  }

  public getPreSignedUploadLink(email: string, body?: string) {
    if (!body) {
      throw new HttpBadRequestError('Please, provide picture metadata');
    }

    const parsedBody = JSON.parse(body);
    const metadata = parsedBody?.metadata;

    if (!metadata) {
      throw new HttpBadRequestError('Please, provide picture metadata');
    }

    return this.galleryService.getPreSignedUploadLink(email, metadata);
  }

  public updateImageStatus(imageName: string) {
    return this.galleryService.updateImageStatus(imageName);
  }
}
