import { config } from 'dotenv';
import { envValidationSchema } from './env.validation.js';

config({ path: process.env.NODE_ENV === 'test' ? '.env.test' : '.env' });

const { error, value } = envValidationSchema.validate(process.env, {
  allowUnknown: true,
  stripUnknown: true,
});

if (error) {
  // Same failure shape W1 checked for: fail fast, name the variable.
  throw new Error(`Config validation error: ${error.message}`);
}

export const env = {
  nodeEnv: value.NODE_ENV as string,
  port: value.PORT as number,
  dbHost: value.DB_HOST as string,
  dbPort: value.DB_PORT as number,
  dbUsername: value.DB_USERNAME as string,
  dbPassword: value.DB_PASSWORD as string,
  dbDatabase: value.DB_DATABASE as string,
  jwtSecret: value.JWT_SECRET as string,
  jwtAccessExpiresIn: value.JWT_ACCESS_EXPIRES_IN as string,
  jwtRefreshExpiresIn: value.JWT_REFRESH_EXPIRES_IN as string,
  corsOrigin: value.CORS_ORIGIN as string,
  throttleDefaultLimit: value.THROTTLE_DEFAULT_LIMIT as number,
  throttleRegisterLimit: value.THROTTLE_REGISTER_LIMIT as number,
  throttleRefreshLimit: value.THROTTLE_REFRESH_LIMIT as number,
};
