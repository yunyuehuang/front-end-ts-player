const puppeteer = require('puppeteer');
let logs = require ("./log.js")
let browser
puppeteer.launch({
  args: ['--no-sandbox'],
  headless: false
}).then(data=>{
  browser=data
})

exports.getM3u8 = async function(url){
  const page = await browser.newPage();
  let rsData
  const pattern = /^http(s)?:\/\/(?!.*http).*\.m3u8$/;

  // 订阅 reponse 事件，参数是一个 reponse 实体
  page.on('response', async (response) => {
    try {
      console.log('请求', response.url())
      if (pattern.test(response.url())) {
        logs.log("解析", response.url())
        let data = await response.text()
        if (data.indexOf(".m3u8") > -1) {
          return
        }
        rsData = {url: response.url(), data:data}
        await page.close();
        logs.log("解析到了，关闭页面")
      }
    } catch (error) {
      logs.log("body err", error)
    }

  })

  try {
    await page.goto(url,{
      waitUntil: 'networkidle0'
    });
  } catch (error) {
    if (error.message == "Navigating frame was detached") {
      return rsData
    }
    logs.log(error.message)
  }
  await page.close();
}