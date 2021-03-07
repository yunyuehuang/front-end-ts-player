
import Event from "./event"


export default class tsLoader{

  constructor(){
    this.videoStatus = 1
    Event.on("change_video",()=>{
      this.videoStatus = 2
    })
    this.requestStep = 0
    this.timer = null
    this.url = ""
  }
  ab2str(buf) {
    return String.fromCharCode.apply(null, new Uint16Array(buf));
  }


  loadTsFile(url) {
    this.requestStep = 1
    this.url = url

    let xhr = new XMLHttpRequest();
    this.xhr = xhr
    xhr.onerror = (e)=> {
      console.log(e, "请求错误")
    }

    xhr.onloadend = (e)=> {
      if (e.lengthComputable == false) {
        console.log(e, "下载异常")
        this.timeOutDeal()
      }
    }
    xhr.onreadystatechange = this.onReadyChange.bind(this)
    
    xhr.open('GET', url);
    xhr.responseType = "arraybuffer";
    xhr.send();

    this.timer = setTimeout(this.timeOutDeal.bind(this), 3000)
   
  }

  onReadyChange(){
    let xhr = this.xhr
    //3开始接收响应体  4响应体接收完成
    if(xhr.readyState >= 3){
      clearTimeout(this.timer)
      //接收响应体的过程中，会多次触发此回调，readyState都是3，如果回调间隔过长，表示接收数据阻塞，这里也设置一个超时。
      //取消请求的时候会有一个 readyState是4的回调，status为0.
      if(xhr.readyState == 3){
        this.timer = setTimeout(this.timeOutDeal.bind(this),5000)
        console.log("开始响应")
        this.requestStep = 2
      }
      if (xhr.readyState == 4) {
        if (xhr.status == 200) {
         
          Event.emit("tsloaded", xhr.response);
        } else {
          console.log(xhr.status,'请求结束，结果error')
        }
      }
    }
  }

  timeOutDeal(){
    let xhr = this.xhr
    clearTimeout(this.timer)
    if (this.requestStep == 1) {
      console.log("请求超时")
    } else {
      console.log("响应超时")
    }

    this.requestStep = 1
    xhr.abort() //timeout调用 abort->onreadystatechange  readyState是4的回调，status为0 -> onloadend 再次调用timeOutDeal-> 输出一次，设置time1定时器 ->  然后再到timeout的这次,又设置一个time1定时器。-> 6秒钟之后几乎同时发起send，首先发起的会在第二次
    if (this.timer) {
      clearTimeout(this.timer)
    }

    console.log("等下重发")
    this.timer = setTimeout(()=> {
      if (Event.globalData.playStatus == 3) { //请求异常的时候，
        Event.emit("stoped")
        return
      }
      xhr.open('GET', this.url);
      xhr.send();
      this.timer = setTimeout(this.timeOutDeal.bind(this), 3000)
    }, 1000)
  }

}

