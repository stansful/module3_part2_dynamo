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
          },
        },
      ],
    },

    apiGalleryGetPreSignedUploadLink: {
      handler: 'api/gallery/handler.getPreSignedUploadLink',
      memorySize: 128,
      events: [
        {
          httpApi: {
            path: '/gallery/upload',
            method: 'post',
            authorizer: {
              name: 'jwtSimpleAuthorizerHttpApi',
            },
          },
        },
      ],
    },

    triggerGalleryS3Upload: {
      handler: 'api/gallery/handler.s3Upload',
      events: [
        {
          s3: {
            bucket: '${file(env.yml):${self:provider.stage}.BUCKET}',
            event: 's3:ObjectCreated:*',
            existing: true,
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
