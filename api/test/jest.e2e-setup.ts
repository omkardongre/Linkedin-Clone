import * as dotenv from 'dotenv';

// Load .env.test when NODE_ENV is 'test'
dotenv.config({ path: '.env.test' });
