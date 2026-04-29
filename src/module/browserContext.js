async function createContext({ proxy } = {}) {
  if (!global.browser) return null;

  const proxyServer = proxy ? `http://${proxy.host}:${proxy.port}` : undefined;

  if (typeof global.browser.createBrowserContext === 'function') {
    return global.browser.createBrowserContext({ proxyServer });
  }

  if (typeof global.browser.createIncognitoBrowserContext === 'function') {
    return global.browser.createIncognitoBrowserContext({ proxyServer });
  }

  return null;
}

async function closeContext(context) {
  if (!context) return;
  await context.close().catch(() => {});
}

module.exports = { createContext, closeContext };
