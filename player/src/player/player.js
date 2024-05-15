

import tsLoader from "./loader.js"
import Decoder from "./decoder.js"
import bufferCache from "./bufferCache"
import sourceBuff from "./sourceBuff"
import Event from "./event"
import Enum from "./enum"
export default class myPlayer{
  
  constructor() {
    this.htmlEle = null
    this.mediaSource = null
    this.videoTime = 0 //视频总时长，秒
    this.tsUrls = []
    this.loaderConfig = {
      threadNum: 5,
      timeOut: 10
    }
    this.autoPlay = false //自动播放的记录
    this.sourceBuff = null
    this.bufferCache = null
    this.decoder = null
    this.tsLoader = null

    this.bindEvent()
  }

  bindEvent(){
    Event.on("tsloaded",(data)=>{
      this.decoder.transferFormat(data)
    })

    Event.on("transfered",(data)=>{
      this.sourceBuff.addSlice({
        index: data[1],
        data: data[0]
      })
      this.sourceBuff.doTask()
    })

    Event.on("appened",(data)=>{
      this.bufferCache.addBuffer(this.mediaSource.duration, data[0])
      if (!this.autoPlay && Event.globalData.currentBufferTime > 40) {
        try {
          this.htmlEle.requestFullscreen()
          this.htmlEle.play()
          this.autoPlay = true
        } catch (error) {
          console.log("自动播放和全屏错误", error)
        }
      }
    })
  }

  play(){
    if (this.tsLoader) {
      this.stop()
    }

    this.mediaSource = new MediaSource()
    this.htmlEle.src = URL.createObjectURL(this.mediaSource)
    this.mediaSource.addEventListener('sourceopen', ()=> {

      this.mediaSource.duration = 0
      this.sourceBuff = new sourceBuff()
      this.sourceBuff.initBuffer(this.mediaSource)

      this.bufferCache = new bufferCache()
      this.decoder = new Decoder()
      this.tsLoader = new tsLoader()

      this.loadTs()
    });
   
  }

  stop(){
    try {
      this.tsLoader.stop()
      this.decoder.stop()
      this.sourceBuff.stop()
      this.autoPlay = false
      this.htmlEle.currentTime = 0
      Event.globalData.currentBufferTime = 0
      this.htmlEle.exitFullscreen()
    } catch (error) {
      console.log("stop error", error)
    }

  }

  setTsUrls(url){
    this.tsUrls = url
  }
  setLoaderConfig(e){
    this.loaderConfig = e
  }
  attachHtmlEle(el){
    this.htmlEle = el
    this.htmlEle.addEventListener('timeupdate', this.onVideoPlay.bind(this)) //当目前的播放位置已更改时触发。
    this.htmlEle.addEventListener('seeked', this.onVideoPlay.bind(this)) //当用户已移动/跳跃到音频/视频中的新位置时触发。
    this.htmlEle.addEventListener('play', this.onVideoPlay.bind(this)) //当音频/视频已开始或不再暂停时触发。

    this.htmlEle.addEventListener('waiting', (e)=>{
      console.log('waiting', e)
      this.onVideoEnd()
    }) 


    this.htmlEle.addEventListener('error', (e)=>{
      console.log("检测到error", e)
 
    }) //当目前的播放列表已结束时触发。

    // this.htmlEle.addEventListener('pause', (e)=>{
    //   console.log("检测到暂停", this.htmlEle.currentTime, this.videoTime)
    //   this.onVideoEnd()
    // })
  }

  onVideoEnd(){
 
    if (this.htmlEle.currentTime > this.videoTime - 3){
      console.log("结束触发")
      this.stop()
      Event.emit("play_end")
    }
  }

  onVideoPlay(e){
    
    if(this.sourceBuff.nowTask && (this.sourceBuff.nowTask.type == "play_append" || this.sourceBuff.nowTask.type == "play_remove")){
      return
    }
   
    let reset = 0 //是否需要重置 playBufferTime
    let ts = -1 //新的加载时间点
    if(this.sourceBuff.playBufferTime.end <= this.htmlEle.currentTime || this.sourceBuff.playBufferTime.start >= this.htmlEle.currentTime){
      //当前播放点不在已经buffer的区域内， ts = 新播放点的值
      ts = this.htmlEle.currentTime
      reset = 1
      this.sourceBuff.addTask({
        type:"play_remove" 
      })
    }else{
      //当前播放点在已经buffer的区域内，判断后2秒的内容是否已加载，未加载则加载后2秒的内容 ts=2后的时间点
      //console.log(this.htmlEle.currentTime, this.htmlEle.currentTime + 2, this.sourceBuff.playBufferTime)
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
    this.tsLoader.loadTsFile(this.tsUrls, this.loaderConfig)
  }


}