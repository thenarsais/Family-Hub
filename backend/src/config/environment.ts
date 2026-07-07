/**
 * Environment Configuration
 * Centralized configuration for all environments
 */

export interface EnvironmentConfig {
  environment: 'development' | 'staging' | 'production';
  nodeEnv: string;
  port: number;
  apiUrl: string;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  database: {
    url: string;
    poolSize: number;
    connectionTimeout: number;
    idleTimeout: number;
  };
  redis: {
    url: string;
    ttl: number;
  };
  supabase: {
    url: string;
    serviceRoleKey: string;
  };
  cors: {
    origins: string[];
    credentials: boolean;
  };
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };
  compression: {
    enabled: boolean;
    level: number;
    threshold: number;
  };
  security: {
    jwtSecret: string;
    bcryptRounds: number;
    allowedOrigins: string[];
  };
}

/**
 * Load environment variables
 */
function loadEnvironmentVariables(): EnvironmentConfig {
  const env = process.env.ENVIRONMENT || process.env.NODE_ENV || 'development';

  // Validate required environment variables
  const required = [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'DATABASE_URL',
    'REDIS_URL'
  ];

  const missing = required.filter((v) => !process.env[v]);
  if (missing.length > 0 && env === 'production') {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  const config: EnvironmentConfig = {
    environment: env as any,
    nodeEnv: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || process.env.API_PORT || '3000'),
    apiUrl: process.env.API_URL || `http://localhost:${process.env.PORT || 3000}`,
    logLevel: (process.env.LOG_LEVEL || 'info') as any,

    database: {
      url: process.env.DATABASE_URL || 'postgresql://localhost/familyhub',
      poolSize: parseInt(process.env.DB_POOL_SIZE || '20'),
      connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT || '5000'),
      idleTimeout: parseInt(process.env.DB_IDLE_TIMEOUT || '30000')
    },

    redis: {
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      ttl: parseInt(process.env.REDIS_TTL || '300')
    },

    supabase: {
      url: process.env.SUPABASE_URL || '',
      serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    },

    cors: {
      origins:
        env === 'production'
          ? (process.env.CORS_ORIGINS || '').split(',').filter(Boolean)
          : ['http://localhost:3000', 'http://localhost:3001'],
      credentials: true
    },

    rateLimit: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 min
      maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100')
    },

    compression: {
      enabled: process.env.COMPRESSION_ENABLED !== 'false',
      level: parseInt(process.env.COMPRESSION_LEVEL || '6'),
      threshold: parseInt(process.env.COMPRESSION_THRESHOLD || '1024')
    },

    security: {
      jwtSecret: process.env.JWT_SECRET || 'development-secret-key',
      bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '10'),
      allowedOrigins:
        env === 'production'
          ? (process.env.ALLOWED_ORIGINS || '').split(',').filter(Boolean)
          : ['localhost', '127.0.0.1']
    }
  };

  return config;
}

/**
 * Validate configuration
 */
function validateConfig(config: EnvironmentConfig): string[] {
  const errors: string[] = [];

  // Validate port
  if (config.port < 1 || config.port > 65535) {
    errors.push('PORT must be between 1 and 65535');
  }

  // Validate database pool size
  if (config.database.poolSize < 1 || config.database.poolSize > 100) {
    errors.push('DB_POOL_SIZE must be between 1 and 100');
  }

  // Validate rate limit
  if (config.rateLimit.maxRequests < 1) {
    errors.push('RATE_LIMIT_MAX_REQUESTS must be at least 1');
  }

  // Validate compression level
  if (config.compression.level < 0 || config.compression.level > 9) {
    errors.push('COMPRESSION_LEVEL must be between 0 and 9');
  }

  // Production validations
  if (config.environment === 'production') {
    if (!config.supabase.url || !config.supabase.serviceRoleKey) {
      errors.push('Supabase credentials required for production');
    }

    if (config.security.jwtSecret === 'development-secret-key') {
      errors.push('JWT_SECRET must be set for production');
    }

    if (config.cors.origins.length === 0) {
      errors.push('CORS_ORIGINS must be set for production');
    }
  }

  return errors;
}

// Load and validate configuration
const config = loadEnvironmentVariables();
const validationErrors = validateConfig(config);

if (validationErrors.length > 0) {
  console.error('❌ Configuration validation failed:');
  validationErrors.forEach((error) => console.error(`  - ${error}`));
  if (config.environment === 'production') {
    process.exit(1);
  }
}

export default config;
