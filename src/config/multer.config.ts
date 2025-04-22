import * as  fs from 'fs';
import { diskStorage } from 'multer';
import { extname } from 'path';
import * as path from 'path';
import { Injectable } from '@nestjs/common';
export const multerConfig = {
    storage: diskStorage({
      destination: (req, file, cb) => {
        const dest = './uploads/profilepics';
        fs.mkdirSync(dest, { recursive: true }); // Ensure directory exists
        cb(null, dest);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = extname(file.originalname);
        const baseName = path.basename(file.originalname, ext);
        const fileName = `${baseName}-${uniqueSuffix}${ext}`;
        cb(null, fileName);
      }
    }),
    fileFilter: (req, file, cb) => {
      if (file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed!'), false);
      }
    },
    limits: {
      fileSize: 5 * 1024 * 1024 // 5MB limit
    }
  }