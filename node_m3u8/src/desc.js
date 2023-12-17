const puppeteer = require('puppeteer');
let browser
puppeteer.launch().then(data=>{
  browser=data
})

exports.getM3u8 = async function(url){
  const page = await browser.newPage();
  let rsData
  // 订阅 reponse 事件，参数是一个 reponse 实体
  page.on('response', async (response) => {
    if (response.url().indexOf(".m3u8") > -1) {
      console.log("解析", response.url())
      let data = await response.text()
      if (data.indexOf(".m3u8") > -1) {
        return
      }
      rsData = {url: response.url(), data:data}
      await page.close();
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
    console.log(error.message)
  }
  await page.close();
}