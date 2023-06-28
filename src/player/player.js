

import tsLoader from "./loader.js"
import decoder from "./decoder.js"
import bufferCache from "./bufferCache"
import sourceBuff from "./sourceBuff"
import Event from "./event"
import Enum from "../enum"
export default class myPlayer{
  
  constructor() {
    this.htmlEle = null
    this.mediaSource = null
    this.tsUrls = []
    this.readySlice = []
    this.threadNum = 1
    this.isAddHeadInfo = 1 //解析第一个文件时需要添加头信息
    this.bufferCache = new bufferCache()
    this.sourceBuff = null
    this.tsLoader = new tsLoader()
    this.bindEvent()
  }

  bindEvent(){
  
    Event.on("tsloaded",(data)=>{
      decoder.transferFormat(data)
    })

    Event.on("transfered",(data)=>{
      this.sourceBuff.addSlice({
        index: data[1],
        data: data[0]
      })
      this.sourceBuff.doTask()
    })

    Event.on("appened",(data)=>{
      if(Event.globalData.playStatus == 3){
        Event.emit("stoped")
        return
      }
      this.bufferCache.addBuffer(this.mediaSource.duration, data[0])
    
     
    })
  }

  play(){
    this.isAddHeadInfo = 1
    Event.emit("status_change", Enum.playStatus.PLAYING)
    this.mediaSource = new MediaSource()
    this.htmlEle.src = URL.createObjectURL(this.mediaSource)
    this.mediaSource.addEventListener('sourceopen', ()=> {
      this.mediaSource.duration = 0
      this.sourceBuff = new sourceBuff()
      this.sourceBuff.initBuffer(this.mediaSource)
      this.loadTs()
    });
   
  }

  setTsUrls(url){
    this.tsUrls = url
  }
  setThreadNum(e){
    this.threadNum = e
  }
  attachHtmlEle(el){
    this.htmlEle = el
    this.htmlEle.addEventListener('timeupdate', this.onVideoPlay.bind(this))
    this.htmlEle.addEventListener('seeked', this.onVideoPlay.bind(this))
    this.htmlEle.addEventListener('play', this.onVideoPlay.bind(this))
  }

  onVideoPlay(e){
    console.log("拖动")
    if(this.sourceBuff.nowTask && (this.sourceBuff.nowTask.type == "play_append" || this.sourceBuff.nowTask.type == "play_remove")){
      return
    }
   
    let reset = 0 //是否需要重置 playBufferTime
    let ts = -1 
    if(this.sourceBuff.playBufferTime.end <= this.htmlEle.currentTime || this.sourceBuff.playBufferTime.start >= this.htmlEle.currentTime){
      //当前播放点不在已经buffer的区域内， ts = 新播放点的值
      ts = this.htmlEle.currentTime
      reset = 1
      this.sourceBuff.addTask({
        type:"play_remove" 
      })
    }else{
      //当前播放点在已经buffer的区域内，判断后2秒的内容是否已加载，未加载则加载后2秒的内容 ts=2后的时间点
      console.log(this.htmlEle.currentTime, this.htmlEle.currentTime + 2, this.sourceBuff.playBufferTime)
      if(this.htmlEle.currentTime + 2 >=  this.sourceBuff.playBufferTime.end){
        ts = this.htmlEle.currentTime + 2
      }
    }
    if(ts > -1){
      let buffItem = this.bufferCache.getBuffer(ts)
      if(buffItem){
        this.sourceBuff.addTask({
          type:"play_append",
          buffItem:buffItem,
          reset:reset
        })
        this.sourceBuff.doTask()
      }
    }
  }

  loadTs(){
    this.tsLoader.loadTsFile(this.tsUrls, this.threadNum)
  }


}