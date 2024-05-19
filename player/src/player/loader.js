
import Event from "./event"


let STEP_INIT = 1
let STEP_DOING = 2

export default class tsLoader{

  constructor(){
    this.urlIndex = 0
    this.isStop = false
    this.htmlEle = null
    this.loadingMap = {} //正在请求中的句柄
  }
  ab2str(buf) {
    return String.fromCharCode.apply(null, new Uint16Array(buf));
  }


  loadTsFile() {
    let num = Object.keys(this.loadingMap).length
    for (let i = 0; i < Event.config.threadNum - num; i++) {
      this.beginLoad()
    }
  }

  stop(){
    this.isStop = true
  }

  beginLoad(){
    if (this.isStop) {
      return
    }
    let sliceInfo = Event.globalData.sliceInfo
    let hasData = false //是否有需要加载的数据
    for (let i = this.urlIndex;i<sliceInfo.length;i++){
      if (sliceInfo[i].loadStatus == 0 && (Event.config.preLoadTime > 0 && this.htmlEle.currentTime + Event.config.preLoadTime*60 > sliceInfo[i].sTime)){
        this.urlIndex = i
        hasData = true
        break
      }
    }
    if (!hasData) {
      return
    }
    let xhr = new XMLHttpRequest();
    xhr.requestStep = STEP_INIT
    xhr.url = sliceInfo[this.urlIndex].url
    xhr.urlIndex = this.urlIndex
    this.loadingMap[xhr.urlIndex] = xhr
    sliceInfo[xhr.urlIndex].loadStatus = 1  //0初始化 1下载中  2已下载  3下载出错

    xhr.onerror = (e)=> {
      console.log(e, "请求错误")
      this.timeOutDeal(xhr)
    }

    xhr.onloadend = (e)=> {
      if (e.lengthComputable == false) {
        console.log(e, "下载异常")
        //this.timeOutDeal(xhr)
      }
    }

    xhr.onreadystatechange = () => {
      this.onReadyChange(xhr)
    }
    
    xhr.open('GET', xhr.url);
    xhr.responseType = "arraybuffer";
    xhr.send();

    Event.emit("tsload", xhr.urlIndex);

    xhr.timer = setTimeout(() => {
      this.timeOutDeal(xhr)
    }, Event.config.timeOut * 1000)

  }

  onReadyChange(xhr){
   
    //3开始接收响应体  4响应体接收完成
    if(xhr.readyState >= 3){
      clearTimeout(xhr.timer)
      //接收响应体的过程中，会多次触发此回调，readyState都是3，如果回调间隔过长，表示接收数据阻塞，这里也设置一个超时。
      //取消请求的时候会有一个 readyState是4的回调，xhr.status为0.
      if(xhr.readyState == 3){
        xhr.timer = setTimeout(()=>{
          this.timeOutDeal(xhr)
        }, Event.config.timeOut * 1000)
       
        xhr.requestStep = STEP_DOING
      }
      if (xhr.readyState == 4) {

        if (xhr.urlIndex == 3) {
          Event.emit("tsload_err", xhr.urlIndex)
          Event.globalData.sliceInfo[xhr.urlIndex].loadStatus = 3
          delete this.loadingMap[xhr.urlIndex]
          this.loadTsFile()
          return
        }
        if (xhr.status == 200) {
          if (this.isStop) {
            return
          }
          Event.globalData.sliceInfo[xhr.urlIndex].loadStatus = 2
          Event.emit("tsloaded", [xhr.response, xhr.urlIndex]);

          delete this.loadingMap[xhr.urlIndex]
          this.loadTsFile()
        } else if (xhr.status == 0) {} else {
          console.log(xhr.status,'请求结束，结果error')
          Event.globalData.sliceInfo[xhr.urlIndex].loadStatus = 3
          delete this.loadingMap[xhr.urlIndex]
          Event.emit("tsload_err", xhr.urlIndex)
        
          this.loadTsFile()

          // xhr.send();
        }
      }
    }
  }

  timeOutDeal(xhr){
    clearTimeout(xhr.timer)
    if (xhr.requestStep == STEP_INIT) {
      console.log("请求超时")
    } else {
      console.log("响应超时")
    }

    xhr.requestStep = STEP_INIT
    xhr.abort() //timeout调用 abort->onreadystatechange  readyState是4的回调，status为0 -> onloadend 再次调用timeOutDeal-> 输出一次，设置time1定时器 ->  然后再到timeout的这次,又设置一个time1定时器。-> 6秒钟之后几乎同时发起send，首先发起的会在第二次
    if (xhr.timer) {
      clearTimeout(xhr.timer)
    }

    console.log("等下重发")
    xhr.timer = setTimeout(()=> {
      xhr.open('GET', xhr.url);
      xhr.send();
      xhr.timer = setTimeout(()=>{
        this.timeOutDeal(xhr)
      }, Event.config.timeOut * 1000)
    }, 1000)
  }

}

