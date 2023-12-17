const puppeteer = require('puppeteer');
let browser 
puppeteer.launch()


export async function getM3u8(url){
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
      rsData = data
      await browser.close();
      console.log("取消请求")
    }
  })
  try {
    await page.goto(url,{
     waitUntil: 'networkidle0'
    });
  } catch (error) {
    console.log(error.message)

    if (error.message == "Navigating frame was detached") {
      console.log("取消了")
      return rsData
    }
  }
  await browser.close();
}
 
// #EXTM3U
// #EXT-X-STREAM-INF:PROGRAM-ID=1,BANDWIDTH=1000000,RESOLUTION=960x540
// /20230806/3ZsLFzi5/1000kb/hls/index.m3u8


console.log("请求1")