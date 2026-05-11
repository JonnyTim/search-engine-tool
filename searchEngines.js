// const puppeteer = require("puppeteer");
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

function decodeBingCkUrl(href) {
  try {
    if (!href || !href.includes("bing.com/ck/a")) return href;
    const u = new URL(href).searchParams.get("u");
    if (!u || !u.startsWith("a1")) return href;
    let b64 = u.slice(2).replace(/-/g, "+").replace(/_/g, "/");
    while (b64.length % 4) b64 += "=";
    const decoded = Buffer.from(b64, "base64").toString("utf8");
    if (/^https?:\/\//i.test(decoded)) return decoded;
    if (decoded.startsWith("/")) return "https://www.bing.com" + decoded;
    return href;
  } catch {
    return href;
  }
}

async function googleSearch(query) {
  const browser = await puppeteer.launch({ headless: "new" });
  try {
    //https://serpapi.com/search-api    
    const page = await browser.newPage();
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36'
    );

    await page.goto(
      `https://www.google.com.hk/search?q=${encodeURIComponent(
        query
      )}&oq=${encodeURIComponent(
        query
      )}&uule=w+CAIQICIaQXVzdGluLFRleGFzLFVuaXRlZCBTdGF0ZXM&hl=en&gl=us&sourceid=chrome&ie=UTF-8%22#ip=1`,
      { waitUntil: 'networkidle2' }
    );
    await page.waitForSelector("#search > div > div");
    const summaries = await page.evaluate(() => {
      const liElements = Array.from(
        document.querySelector("#search > div > div").childNodes
      );
      const firstFiveLiElements = liElements.slice(0, 10);
      return firstFiveLiElements.map((li) => {
        const linkElement = li.querySelector("a");
        const href = linkElement.getAttribute("href");
        const title = linkElement.querySelector("a > h3").textContent;
        const abstract = Array.from(
          li.querySelectorAll("div > div > div > div > div > div > span")
        )
          .map((e) => e.textContent)
          .join("");
        return { href, title, abstract };
      });
    });
    await browser.close();
    // console.log(summaries);
    return summaries;
  } catch (error) {
    console.error("An error occurred:", error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

async function bingSearch(query) {
  const browser = await puppeteer.launch({ headless: "new" });
  try {
    //https://serpapi.com/bing-search-api
    const page = await browser.newPage();
    await page.goto(
      `https://www.bing.com/search?form=QBRE&q=${encodeURIComponent(query)}&cc=US`,
      { waitUntil: 'networkidle2' }
    );
    await page.waitForSelector('#b_results li.b_algo');
    const summaries = await page.evaluate(() => {
      const liElements = Array.from(
        document.querySelectorAll("#b_results > li.b_algo")
      );
      return liElements.slice(0, 20).map((li) => {
        const linkElement = li.querySelector("h2 a");
        const href = linkElement ? linkElement.getAttribute("href") : "";
        const title = linkElement ? linkElement.textContent : "";

        const abstractElement =
          li.querySelector(".b_caption > p") ||
          li.querySelector(".b_caption .b_lineclamp1, .b_caption .b_lineclamp2, .b_caption .b_lineclamp3, .b_caption .b_lineclamp4") ||
          li.querySelector(".b_caption");
        const abstract = abstractElement ? abstractElement.textContent.trim() : "";

        return { href, title, abstract };
      });
    });
    await browser.close();
    return summaries.map((r) => ({ ...r, href: decodeBingCkUrl(r.href) }));
  } catch (error) {
    console.error("An error occurred:", error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

async function yahooSearch(query) {
  const browser = await puppeteer.launch({ headless: "new" });
  try {
    const page = await browser.newPage();
    await page.goto(
      `https://search.yahoo.com/search?p=${encodeURIComponent(query)}&ei=UTF-8&fr=fp-tts&vc=us&vl=lang_en`,
      { waitUntil: 'networkidle2' }
    );
    await page.waitForSelector(".searchCenterMiddle");
    const summaries = await page.evaluate(() => {
      const liElements = Array.from(
        document.querySelectorAll(".searchCenterMiddle > li")
      );
      const results = [];
      for (const li of liElements) {
        const h3 = li.querySelector("h3");
        if (!h3) continue;
        const linkElement = h3.closest("a") || li.querySelector("a:has(h3)");
        if (!linkElement) continue;
        const href = linkElement.getAttribute("href") || "";
        if (!href || /search\.yahoo\.com\/search|images\.search\.yahoo\.com/.test(href)) continue;
        const title = h3.textContent.trim();
        const compTextElement = li.querySelector(".compText");
        const abstract = compTextElement ? compTextElement.textContent.trim() : "";
        results.push({ href, title, abstract });
        if (results.length >= 20) break;
      }
      return results;
    });
    await browser.close();
    return summaries;
  } catch (error) {
    console.error("An error occurred:", error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

async function duckduckgoSearch(query) {
  const browser = await puppeteer.launch({ headless: "new" });
  try {
    //https://serpapi.com/duckduckgo-search-api
    // 可以改区域，这些设置的是港区
    const page = await browser.newPage();
    await page.goto(
      `https://duckduckgo.com/?q=${encodeURIComponent(query)}&kl=us-en&ia=web`,
      { waitUntil: 'networkidle2' }
    );
    await page.waitForSelector("ol.react-results--main > li");
    const summaries = await page.evaluate(() => {
      const liElements = Array.from(
        document.querySelectorAll("ol.react-results--main > li")
      );
      const firstFiveLiElements = liElements.slice(0, 20);
      return firstFiveLiElements.map((li) => {
        const abstractElement = li
          .querySelector('div[data-result="snippet"]');
        const linkElement = li
          .querySelector('a[data-testid="result-title-a"]');

        const href = linkElement?.href || '';
        const title = linkElement?.innerText || '';
        const abstract = abstractElement?.innerText || '';

        return { href, title, abstract };
      });
    });
    await browser.close();
    // console.log(summaries);
    return summaries;
  } catch (error) {
    console.error("An error occurred:", error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

module.exports = {
  googleSearch,
  bingSearch,
  yahooSearch,
  duckduckgoSearch,
};
