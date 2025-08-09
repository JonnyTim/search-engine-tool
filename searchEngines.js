const puppeteer = require("puppeteer");

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
    await page.waitForSelector('#b_results .b_algo');
    const summaries = await page.evaluate(() => {
      const liElements = Array.from(
        document.querySelectorAll("#b_results > .b_algo")
      );
      const firstFiveLiElements = liElements.slice(0, 10);
      return firstFiveLiElements.map((li) => {
        const abstractElement = li.querySelector(".b_caption > p");
        const linkElement = li.querySelector("a");
        const href = linkElement.getAttribute("href");
        const title = linkElement.textContent;

        const abstract = abstractElement ? abstractElement.textContent : "";
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
        document.querySelector(".searchCenterMiddle").childNodes
      );
      const firstFiveLiElements = liElements.slice(0, 10);
      return firstFiveLiElements.map((li) => {
        const compTextElement = li.querySelector(".compText");
        const linkElement = li.querySelector("a");
        const href = linkElement.getAttribute("href");
        const title = linkElement.getAttribute("aria-label");

        const abstract = compTextElement ? compTextElement.textContent : "";
        return { href, title, abstract };
      });
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
      const firstFiveLiElements = liElements.slice(0, 10);
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
