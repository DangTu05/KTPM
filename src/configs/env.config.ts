import dotenv from 'dotenv';
dotenv.config();

const getEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Biến môi trường ${key} chưa được thiết lập`);
  }
  return value;
};

export const env = {
  JWT_REFRESH_TOKEN_SECRET: getEnv('JWT_REFRESH_TOKEN_SECRET'),
  CLOUDINARY_CLOUD_NAME: getEnv('CLOUDINARY_CLOUD_NAME'),
  CLOUDINARY_API_KEY: getEnv('CLOUDINARY_API_KEY'),
  CLOUDINARY_API_SECRET: getEnv('CLOUDINARY_API_SECRET'),
  MAIN_FOLDER_UPLOAD_CLOUDINARY: getEnv('MAIN_FOLDER_UPLOAD_CLOUDINARY'),
} as const;
