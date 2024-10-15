import multer, { FileFilterCallback } from "multer";
import { Request } from "express";

// Configure storage settings
const storage = multer.diskStorage({
  destination: function (req: Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) {
    cb(null, './public/uploads'); // No error, so pass null for the error parameter
  },
  filename: function (req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix); // No error, so pass null for the error parameter
  }
});

// File filter to accept only images
const fileFilter = (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  // Accept only image mimetypes
  if (file.mimetype.startsWith('image/')) {
    cb(null, true); // No error, so pass null for the error parameter
  } else {
    cb(new Error('Only image files are allowed') as unknown as any, false);
  }
};

// Configure Multer middleware
export const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB file size limit
  fileFilter
});
