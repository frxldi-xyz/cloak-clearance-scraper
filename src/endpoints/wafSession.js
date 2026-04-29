const { createContext, closeContext } = require("../module/browserContext");

function sanitizeHeaders(headers) {
  const result = { ...headers };
  delete result["content-type"];
  delete result["accept-encoding"];
  delete result["accept"];
  delete result["content-length"];
  return result;
}

function addPseudoHeaders(headers, targetUrl) {
  const parsed = new URL(targetUrl);
  return {
    ...headers,
    ":authority": headers[":authority"] || parsed.host,
    ":method": headers[":method"] || "GET",
    ":path": headers[":path"] || `${parsed.pathname || "/"}${parsed.search || ""}`,
    ":scheme": headers[":scheme"] || parsed.protocol.replace(":", ""),
  };
}

async function waitForCookies(page, timeout = 3000) {
  const end = Date.now() + timeout;
  let cookies = [];
  while (Date.now() < end) {
    cookies = await page.cookies().catch(() => []);
    if (cookies.length > 0) break;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  return cookies;
}

function getSource({ url, proxy }) {
  return new Promise(async (resolve, reject) => {
    if (!url) return reject(new Error("Missing url parameter"));
    const context = await createContext({ proxy }).catch(() => null);
    if (!context) return reject(new Error("Failed to create browser context"));

    let isResolved = false;

    var cl = setTimeout(async () => {
      if (!isResolved) {
        isResolved = true;
        await closeContext(context);
        reject(new Error("Timeout Error"));
      }
    }, global.timeOut || 60000);

    try {
      const page = await context.newPage();

      if (proxy?.username && proxy?.password)
        await page.authenticate({
          username: proxy.username,
          password: proxy.password,
        });
      let documentHeaders = null;
      await page.setRequestInterception(true);
      page.on("request", async (request) => {
        try {
          if (!documentHeaders && request.resourceType() === "document") {
            documentHeaders = request.headers();
          }
          await request.continue();
        } catch (e) {}
      });

      await page.goto(url, {
        waitUntil: "domcontentloaded",
        timeout: global.timeOut || 60000,
      });

      await page.waitForNavigation({ waitUntil: "load", timeout: Number(process.env.LOAD_WAIT_TIME || 5000) }).catch(() => {});
      await new Promise((resolve) => setTimeout(resolve, Number(process.env.PAGE_SETTLE_TIME || 1000)));

      const cookies = await waitForCookies(page, Number(process.env.COOKIE_WAIT_TIME || 3000));
      let headers = sanitizeHeaders(documentHeaders || {});
      headers["user-agent"] = headers["user-agent"] || await page.evaluate(() => navigator.userAgent).catch(() => undefined);
      headers["accept-language"] = headers["accept-language"] || await page.evaluate(() => navigator.languages?.length ? `${navigator.languages[0]},${navigator.languages.slice(1).map((lang) => `${lang};q=0.9`).join(",")}` : navigator.language).catch(() => undefined);
      headers = addPseudoHeaders(headers, url);
      Object.keys(headers).forEach((key) => (headers[key] === undefined || headers[key] === null) && delete headers[key]);

      isResolved = true;
      clearInterval(cl);
      await closeContext(context);
      resolve({ cookies, headers });
    } catch (e) {
      if (!isResolved) {
        isResolved = true;
        await closeContext(context);
        clearInterval(cl);
        reject(e);
      }
    }
  });
}
module.exports = getSource;
