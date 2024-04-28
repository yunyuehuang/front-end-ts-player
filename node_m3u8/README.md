# m3u8地址获取
启动了一个http服务，接收一个网页地址，使用puppeteer进行页面请求，并捕获页面中发起的m3u8资源请求，拿到m3u8文件的内容并返回。


# 部署问题

## 1. 依赖问题

在linux环境部署的时候遇到错误
/home/wwwroot/reike_crontab/public/kr36/node_modules/@puppeteer/browsers/lib/cjs/launch.js:277        
reject(new Error([                       ^
Error: Failed to launch the browser process!/root/.cache/puppeteer/chrome/linux-115.0.5790.98/chrome-linux64/chrome: error while loading shared libraries: libatk-1.0.so.0: cannot open shared object file: No such file or directory
TROUBLESHOOTING: https://pptr.dev/troubleshooting    at Interface.onClose (/home/wwwroot/reike_crontab/public/kr36/node_modules/@puppeteer/browsers/lib/cjs/launch.js:277:24)    at Interface.emit (node:events:525:35)    at Interface.close (node:internal/readline/interface:537:10)    at Socket.onend (node:internal/readline/interface:263:10)    at Socket.emit (node:events:525:35)    at endReadable

CentOS 7安装扩展：
更新系统软件包yum update  
安装扩展yum install -y atk  cups-libs  libxkbcommon libXcomposite libXdamage libXrandr libgbm  pango  
可以解决

## 2. 权限
使用nvm管理node环境之后，切换node版本，安装puppeteer依赖提示
mkdir /root/.cache/puppeteer/chrome  access denied

貌似是用nvm之后导致了某种权限问题。

设置
export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
然后执行npm install ，可以在安装依赖时跳过chrome核心的安装。

然后手动执行
node node_modules/puppeteer/install.mjs

这样就不会有权限问题了。
Downloading chrome r119.0.6045.105 - 148.2 MB [====================] 100% 0.0s
Chrome (119.0.6045.105) downloaded to /root/.cache/puppeteer/chrome/linux-119.0.6045.105
