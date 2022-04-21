import { AWSPartitial } from '../types';

export const galleryConfig: AWSPartitial = {
  functions: {
    apiGalleryGetPictures: {
      handler: 'api/gallery/handler.getPictures',
      memorySize: 128,
      events: [
        {
          httpApi: {
            path: '/gallery',
            method: 'get',
            authorizer: {
              name: 'jwtAuthorizerHttpApi',
            },
          },
        },
      ],
    },
    apiGalleryUploadPicture: {
      handler: 'api/gallery/handler.uploadPicture',
      memorySize: 128,
      events: [
        {
          httpApi: {
            path: '/gallery',
            method: 'post',
            authorizer: {
              name: 'jwtAuthorizerHttpApi',
            },
          },
        },
      ],
    },
    apiParseAndUploadExistingPictures: {
      handler: 'api/gallery/handler.uploadExistingPictures',
      memorySize: 128,
      events: [
        {
          httpApi: {
            path: '/gallery/fill',
            method: 'get',
          },
        },
      ],
    },
  },
};
