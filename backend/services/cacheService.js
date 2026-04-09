// In-memory cache with timestamps
const cache = {};

const TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

function set(key, value) {
  cache[key] = { value, updatedAt: Date.now() };
}

function get(key) {
  const entry = cache[key];
  if (!entry) return null;
  if (Date.now() - entry.updatedAt > TTL_MS) return null; // expired
  return entry;
}

function getAge(key) {
  const entry = cache[key];
  if (!entry) return null;
  return Math.floor((Date.now() - entry.updatedAt) / 60000); // minutes
}

function isStale(key) {
  const entry = cache[key];
  if (!entry) return true;
  return Date.now() - entry.updatedAt > TTL_MS;
}

module.exports = { set, get, getAge, isStale };
