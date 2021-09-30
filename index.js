const fs = require("fs");
const puppeteer = require("puppeteer");

const version = process.argv[2] || "dnspod-v5";
if (!fs.statSync(`./ns/${version}`).isDirectory()) {
  console.log(`ns 目录下没有找到 ${version}`);
  return;
}

const sites = require(`./ns/${version}/sites.js`);
const configPath = `./ns/${version}/config.json`;
const config = fs.existsSync(configPath) ? JSON.parse(fs.readFileSync(configPath, "utf-8")) : {};
let { startIndex = 0, dnsTimes = [] } = config;

// 结束任务
function done() {
  const sortedDnsTimes = dnsTimes.sort((a, b) => a - b);
  const dnsTimesLength = dnsTimes.length;
  console.log();
  console.log(`采集数据共 ${dnsTimesLength} 条`);
  console.log(`最大的5个值: ${sortedDnsTimes.slice(Math.max(0, sortedDnsTimes.length - 5)).join("ms, ")}ms`);
  console.log(`平均值:${(dnsTimes.reduce((sum, x) => (sum += x), 0) / dnsTimesLength).toFixed(2)}ms`);
  console.log(`p50: ${sortedDnsTimes[Math.floor(dnsTimesLength * 0.5)]}ms`);
  console.log(`p90: ${sortedDnsTimes[Math.floor(dnsTimesLength * 0.9)]}ms`);

  const dnsGt0Times = dnsTimes.filter(Boolean);
  const sortedDnsGt0Times = dnsGt0Times.sort((a, b) => a - b);
  const dnsGt0TimesLength = dnsGt0Times.length;
  console.log();
  console.log(`非零数据共 ${dnsGt0TimesLength} 条`);
  console.log(`非零数据平均值: ${(dnsGt0Times.reduce((sum, x) => (sum += x), 0) / dnsGt0TimesLength).toFixed(2)}ms`);
  console.log(`非零数据p50: ${sortedDnsGt0Times[Math.floor(dnsGt0TimesLength * 0.5)]}ms`);
  console.log(`非零数据p90: ${sortedDnsGt0Times[Math.floor(dnsGt0TimesLength * 0.9)]}ms`);

  process.exit(0);
}
process.on("SIGINT", done);

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    devtools: false,
    dumpio: false,
    ignoreHTTPSErrors: true,
    handleSIGINT: false,
  });
  const ctx = await browser.createIncognitoBrowserContext();

  // 执行一个用例
  async function tick() {
    const site = sites[startIndex];
    if (!site) {
      done();
      return;
    }
    const webPage = await ctx.newPage();
    webPage.setViewport({ isMobile: false, width: 1920, height: 1080 });
    const webStart = Date.now();
    try {
      await webPage.goto(`https://www.${site}`, {
        timeout: 10000,
        waitUntil: "domcontentloaded",
      });
      // DOMContentLoaded 之后页面可能还有一些部分资源没加载，为了截图完整一些，等到 load 事件触发再截图，但最多等 3 秒
      await new Promise((r) => {
        setTimeout(r, 3000);
        webPage.on("load", r);
      });
      await webPage.screenshot({
        type: "png",
        encoding: "binary",
        fullPage: false,
        path: `./ns/${version}/${String(startIndex).padStart(5, 0)}-${site}.png`,
      });
      const dnsUse = await webPage.evaluate(() => {
        const timing = performance.getEntriesByType("navigation")[0].toJSON();
        return Number((timing.domainLookupEnd - timing.domainLookupStart).toFixed(2));
      });
      dnsTimes.push(dnsUse);
      console.log(`${site.padEnd(30)} DNS耗时：${`${dnsUse}ms`.padEnd(10)} 执行耗时：${Date.now() - webStart}ms`);
    } catch (error) {
      console.log(`${site.padEnd(30)} 执行错误：${error.message}`);
    } finally {
      await webPage.close();
      fs.writeFileSync(
        configPath,
        JSON.stringify({
          startIndex: ++startIndex,
          dnsTimes,
        }),
        { encoding: "utf-8" }
      );
      tick();
    }
  }
  tick();
})();
