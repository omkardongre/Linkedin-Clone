import { diskStorage } from 'multer';
import { Observable, of } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';

import * as fs from 'fs';
import * as path from 'path';
import magic from 'magic-bytes.js';
import { handleError } from 'src/core/error.utils';
import { HttpStatus } from '@nestjs/common';

type validFileExtension = 'jpg' | 'jpeg' | 'png';
type validMimeType = 'image/jpeg' | 'image/png' | 'image/jpg';

const validFileExtensions: validFileExtension[] = ['jpg', 'jpeg', 'png'];
const validMimeTypes: validMimeType[] = [
  'image/jpeg',
  'image/png',
  'image/jpg',
];

export const saveImageToStorage = {
  storage: diskStorage({
    destination: './images',
    filename: (req, file, cb) => {
      const fileExt = path.extname(file.originalname);
      const fileName = uuidv4() + fileExt;
      cb(null, fileName);
    },
  }),
  fileFilter: (req, file, cb) => {
    const mimeType = file.mimetype;
    if (!validMimeTypes.includes(mimeType)) {
      return cb(new Error('Invalid file type'), false);
    }
    cb(null, true);
  },
};

export const isFileExtensionValid = (
  fullFilePath: string,
): Observable<boolean> => {
  const fileBuffer = fs.readFileSync(fullFilePath);
  const fileType = magic(fileBuffer);

  const isFileTypeLegit = (ext: string): ext is validFileExtension =>
    validFileExtensions.includes(ext as validFileExtension);
  const isMimeTypeLegit = (
    mimeType: string | undefined,
  ): mimeType is validMimeType =>
    mimeType ? validMimeTypes.includes(mimeType as validMimeType) : false;

  const ext = fileType.length ? fileType[0].extension : null;
  const mime = fileType.length ? fileType[0].mime : null;
  return of(isFileTypeLegit(ext || '') && isMimeTypeLegit(mime));
};

export const removeFile = (fullFilePath: string): void => {
  try {
    fs.unlinkSync(fullFilePath);
  } catch (err) {
    console.error(err);
  }
};
