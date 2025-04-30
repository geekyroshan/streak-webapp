// api/env-check.js - Endpoint to check environment variables
import checkEnvHandler from './utils/env-check';

export default function handler(req, res) {
  return checkEnvHandler(req, res);
} 