const cache = new Map();

function getCache(key) {
  const item = cache.get(key);

  if (!item) return null;

  if (Date.now() > item.expiresAt) {
    cache.delete(key);
    return null;
  }

  return item.value;
}

function setCache(key, value, ttlMs = 60000) {
  cache.set(key, {
    value,
    expiresAt: Date.now() + ttlMs
  });
}

function clearCache(prefix = "") {
  for (const key of cache.keys()) {
    if (!prefix || key.startsWith(prefix)) {
      cache.delete(key);
    }
  }
}

module.exports = {
  getCache,
  setCache,
  clearCache
};
