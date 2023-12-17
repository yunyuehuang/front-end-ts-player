
import Event from "./event"


let STEP_INIT = 1
let STEP_DOING = 2

export default class tsLoader{

  constructor(){
    this.urlIndex = 0
    this.threadNum = 5
    this.timeOut = 10
    this.urls = []
  }
  ab2str(buf) {
    return String.fromCharCode.apply(null, new Uint16Array(buf));
  }


  loadTsFile(urls, config) {
    this.threadNum = config.threadNum
    this.timeOut = config.timeOut

    this.urls = urls
    for (let i = 0; i < this.threadNum; i++) {
      this.beginLoad()
    }
  }

  beginLoad(){
    if (this.urlIndex >= this.urls.length) {
      return
    }
    let xhr = new XMLHttpRequest();
    xhr.requestStep = STEP_INIT
    xhr.url = this.urls[this.urlIndex]
    xhr.urlIndex = this.urlIndex
    this.urlIndex ++

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
    }, this.timeOut * 1000)

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
        }, this.timeOut * 1000)
       
        xhr.requestStep = STEP_DOING
      }
      if (xhr.readyState == 4) {
        if (xhr.status == 200) {
          Event.emit("tsloaded", [xhr.response, xhr.urlIndex]);
          this.beginLoad()
        } else {
          console.log(xhr.status,'请求结束，结果error')
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
      }, this.timeOut * 1000)
    }, 1000)
  }

}
