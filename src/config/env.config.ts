import dotenv from 'dotenv';

dotenv.config();

interface EnvConfig {
  nodeEnv: 'development' | 'production';
  port: number;
  logLevel: string;
  idempotencySecret: string;
}

const REQUIRED_ENV_VARS: string[] = ['IDEMPOTENCY_SECRET'];

// Export validated configuration
export const getEnvs = (): EnvConfig => {
  // Validate required variables
  for (const key of REQUIRED_ENV_VARS) {
    if (!process.env[key]) {
      console.error(`❌ Missing required environment variable: ${key}`);
      process.exit(1);
    }
  }

  return {
    nodeEnv: (process.env.NODE_ENV || 'development') as
      | 'development'
      | 'production',
    port: parseInt(process.env.PORT || '3000', 10),
    logLevel: process.env.LOG_LEVEL || 'info',
    idempotencySecret: process.env.IDEMPOTENCY_SECRET || 'default_secret',
  };
};
