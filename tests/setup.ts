// Provide the secrets that server modules read from the validated env at import
// time. Set before any test file imports `@/config/env`.
process.env.JWT_SECRET ??= 'test-jwt-secret-at-least-32-characters-long';
process.env.NEXT_PUBLIC_ENVIRONMENT ??= 'development';
