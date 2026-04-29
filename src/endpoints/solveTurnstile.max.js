const fs = require("fs");
const { createContext, closeContext } = require("../module/browserContext");

function solveTurnstileMin({ url, proxy }) {
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
        
      await page.evaluateOnNewDocument(() => {
        let token = null;
        async function waitForToken() {
          while (!token) {
            try {
              token = window.turnstile.getResponse();
            } catch (e) {}
            await new Promise((resolve) => setTimeout(resolve, 500));
          }
          var c = document.createElement("input");
          c.type = "hidden";
          c.name = "cf-response";
          c.value = token;
          document.body.appendChild(c);
        }
        waitForToken();
      });

      await page.goto(url, {
        waitUntil: "domcontentloaded",
      });

      await page.waitForSelector('[name="cf-response"]', {
        timeout: 60000,
      });
      const token = await page.evaluate(() => {
        try {
          return document.querySelector('[name="cf-response"]').value;
        } catch (e) {
          return null;
        }
      });
      isResolved = true;
      clearInterval(cl);
      await closeContext(context);
      if (!token || token.length < 10) return reject(new Error("Failed to get token"));
      return resolve(token);
    } catch (e) {
      console.log(e);

      if (!isResolved) {
        isResolved = true;
        await closeContext(context);
        clearInterval(cl);
        reject(e);
      }
    }
  });
}
module.exports = solveTurnstileMin;
