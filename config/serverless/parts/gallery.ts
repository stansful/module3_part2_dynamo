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
              name: 'jwtSimpleAuthorizerHttpApi',
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
              name: 'jwtSimpleAuthorizerHttpApi',
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
          http: {
            path: '/gallery/fill',
            method: 'get',
          },
        },
      ],
    },
  },
};
