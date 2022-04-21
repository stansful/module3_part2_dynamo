export interface RequestGalleryQueryParams {
  page?: string;
  limit?: string;
  filter?: string;
}

export interface SanitizedQueryParams {
  limit: number;
  skip: number;
  uploadedByUser: boolean;
}

export interface PicturePaths {
  fsRelativePath: string;
  fsAbsolutePath: string;
}
