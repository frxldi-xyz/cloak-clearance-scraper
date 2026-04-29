const { createContext, closeContext } = require("../module/browserContext");

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

      await page.setRequestInterception(true);
      page.on("request", async (request) => request.continue());
      page.on("response", async (res) => {
        try {
          if (
            [200, 302].includes(res.status()) &&
            [url, url + "/"].includes(res.url())
          ) {
            await page
              .waitForNavigation({ waitUntil: "load", timeout: 5000 })
              .catch(() => {});
            const html = await page.content();
            isResolved = true;
            clearInterval(cl);
            await closeContext(context);
            resolve(html);
          }
        } catch (e) {}
      });
      await page.goto(url, {
        waitUntil: "domcontentloaded",
      });
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
