const { createContext, closeContext } = require("../module/browserContext");

async function findAcceptLanguage(page) {
  return await page.evaluate(async () => {
    const result = await fetch("https://httpbin.org/get")
      .then((res) => res.json())
      .then(
        (res) =>
          res.headers["Accept-Language"] || res.headers["accept-language"]
      )
      .catch(() => null);
    return result;
  });
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
      await page.goto(url, {
        waitUntil: "domcontentloaded",
        timeout: global.timeOut || 60000,
      });

      await page.waitForNetworkIdle({ idleTime: 1000, timeout: 10000 }).catch(() => {});
      await new Promise((resolve) => setTimeout(resolve, Number(process.env.PAGE_SETTLE_TIME || 2000)));

      const cookies = await page.cookies();
      const acceptLanguage = await findAcceptLanguage(page);
      const headers = {
        "user-agent": await page.evaluate(() => navigator.userAgent).catch(() => undefined),
        "accept-language": acceptLanguage,
      };

      Object.keys(headers).forEach((key) => headers[key] === undefined && delete headers[key]);

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
