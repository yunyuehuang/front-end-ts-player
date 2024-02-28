



const pattern = /^http(s)?:\/\/(?!.*http).*\.m3u8$/;


console.log(pattern.test('https://jiexi.ddmz6.com/api/publicApi.php?url=https://top.1080pzy.co/202402/23/8BEvWYEUiL3/video/index.m3u8'))

console.log(pattern.test('https://top.1080pzy.co/202402/23/8BEvWYEUiL3/video/index.m3u8'))
