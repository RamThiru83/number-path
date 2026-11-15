// Public, publishable settings only. Data is protected by row-level security in Supabase.
export const SUPABASE_URL = 'https://odsrftvuceizketmcesy.supabase.co';
export const SUPABASE_KEY = 'sb_publishable_x3BnqzNP3On0O1C-axPtSw_UbeFLnnw';
export const DB_SCHEMA = 'pathway';

// Review spacing in days after a unit is first secured: 2 days, 1 week, 3 weeks.
export const REVIEW_INTERVALS = [2, 7, 21];
// Every Nth session suggests a mixed review of earlier units.
export const INTERLEAVE_EVERY = 4;
