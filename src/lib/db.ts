import { neon } from "@neondatabase/serverless";

// Returns a fresh neon tagged-template function for each call.
// Neon uses HTTP so there's no connection pooling needed — cheap to create per call.
// This defers the neon() call to request time so build-time page analysis doesn't fail
// when DATABASE_URL is not yet set.
export function db() {
  return neon(process.env.DATABASE_URL!);
}
