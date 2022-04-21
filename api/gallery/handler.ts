import { errorHandler } from '@helper/http-api/error-handler';
import { createResponse } from '@helper/http-api/response';
import { log } from '@helper/logger';
import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { RequestGalleryQueryParams } from './gallery.interfaces';
import { GalleryManager } from './gallery.manager';
import multipartParser from 'lambda-multipart-parser';

const galleryManager = new GalleryManager();

export const getPictures: APIGatewayProxyHandlerV2 = async (event, context) => {
  log(event);

  try {
    context.callbackWaitsForEmptyEventLoop = false;

    const query: RequestGalleryQueryParams = {
      page: event.queryStringParameters?.page,
      limit: event.queryStringParameters?.limit,
      filter: event.queryStringParameters?.filter,
    };
    // @ts-ignore
    const email = event.requestContext.authorizer.email;
    const pictures = await galleryManager.getPictures(query, email);

    return createResponse(200, pictures);
  } catch (error) {
    return errorHandler(error);
  }
};

export const uploadPicture: APIGatewayProxyHandlerV2 = async (event, context) => {
  log(event);
  try {
    context.callbackWaitsForEmptyEventLoop = false;

    // @ts-ignore
    const email = event.requestContext.authorizer.email;
    // @ts-ignore
    const pictures = await multipartParser.parse(event);

    const response = await galleryManager.uploadPicture(pictures, email);

    return createResponse(201, response);
  } catch (error) {
    if (error.message === 'Missing Content-Type') {
      return createResponse(400, { message: 'Please, provide content type' });
    }

    return errorHandler(error);
  }
};

export const uploadExistingPictures: APIGatewayProxyHandlerV2 = async (event, context) => {
  log(event);

  try {
    context.callbackWaitsForEmptyEventLoop = false;

    const response = await galleryManager.uploadExistingPictures();

    return createResponse(201, response);
  } catch (error) {
    return errorHandler(error);
  }
};
