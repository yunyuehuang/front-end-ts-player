

import tsLoader from "./loader.js"
import Decoder from "./decoder.js"
import sourceBuff from "./sourceBuff"
import Event from "./event"
import Enum from "./enum"
export default class myPlayer{
  
  constructor() {
   
    this.videoTime = 0 //视频总时长，秒

    this.loaderConfig = {
      threadNum: 5,
      timeOut: 10,
      preLoadTime:0,
    }
    this.autoPlay = false //自动播放的记录

    this.htmlEle = null
    this.mediaSource = null
    this.sourceBuff = null
    this.decoder = null
    this.tsLoader = null

    this.playBeginTime = 0
    this.playEndTime = 0

    this.bindEvent()
  }

  bindEvent(){
    Event.on("tsloaded",(data)=>{
      this.decoder.transferFormat(data)
    })

    Event.on("transfered",(data)=>{
      
      let index = data[1]
      Event.globalData.sliceInfo[index].buff = data[0]
      let slice = Event.globalData.sliceInfo[index]
     
      let ts = this.htmlEle.currentTime

      if (!this.autoPlay && slice.eTime - this.playBeginTime*60 > 30) {
        try {
          this.htmlEle.play()
          this.htmlEle.requestFullscreen()
          this.autoPlay = true
        } catch (error) {
          console.log("autoPlay", error)
        }
       
      }
      if (ts >= slice.sTime && ts < slice.eTime) { //播放点在范围内，证明已经进入阻塞，直接添加
        console.log("进入范围", ts, slice)
        this.sourceBuff.addTask({
          type:"play_remove" 
        })
        this.sourceBuff.addTask({
          type:"play_append",
          buffItem:slice,
          reset:1
        })
        this.sourceBuff.doTask()

        if (index == 0) { //第一片段添加完后，移动到启始播放点。第一帧里面有一些元信息，不添加直接加其他的片段，会出错。
          let beginOffset = 0
          let sliceInfo = Event.globalData.sliceInfo
          for (const i in sliceInfo) {
            if (this.playBeginTime > 0) {
              if (this.playBeginTime*60 >= sliceInfo[i].sTime && this.playBeginTime*60 <= sliceInfo[i].eTime) {
                beginOffset = i
                break
              }
            }
          } 
          this.tsLoader.urlIndex = beginOffset
          this.htmlEle.currentTime = this.playBeginTime*60
        }

      } else if (ts >= slice.sTime-1 && ts < slice.sTime) { //播放到了临近的，可能是之前播放到这里阻塞了，触发一下append
        this.onVideoPlay()
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

      this.mediaSource.duration = this.videoTime
      this.sourceBuff = new sourceBuff()
      this.sourceBuff.initBuffer(this.mediaSource)

      this.decoder = new Decoder()
      this.tsLoader = new tsLoader()
      this.tsLoader.threadNum = this.loaderConfig.threadNum
      this.tsLoader.timeOut = this.loaderConfig.timeOut
      this.tsLoader.preLoadTime = this.loaderConfig.preLoadTime
      this.tsLoader.htmlEle = this.htmlEle
      this.tsLoader.loadTsFile()


    });
   
  }

  stop(){
    try {
      this.tsLoader.stop()
      this.decoder.stop()
      this.sourceBuff.stop()
      this.autoPlay = false
      this.htmlEle.currentTime = 0
      this.htmlEle.exitFullscreen()
    } catch (error) {
      console.log("stop error", error)
    }

  }


  attachHtmlEle(el){
    this.htmlEle = el
    this.htmlEle.addEventListener('timeupdate', this.onVideoPlay.bind(this)) //当目前的播放位置已更改时触发。
    this.htmlEle.addEventListener('seeking', this.onVideoPlay.bind(this)) //当用户已移动/跳跃到音频/视频中的新位置时触发。
    this.htmlEle.addEventListener('play', this.onVideoPlay.bind(this)) //当音频/视频已开始或不再暂停时触发。

    this.htmlEle.addEventListener('waiting', (e)=>{
      console.log('waiting', e)
      this.onVideoEnd()
    }) 


    this.htmlEle.addEventListener('error', (e)=>{
      console.log("检测到error", e)
 
    }) //当目前的播放列表已结束时触发。

  }

  onVideoEnd(){
    let end = this.playEndTime > 0 ? this.playEndTime*60 : this.videoTime-3
    if (this.htmlEle.currentTime > end){
      console.log("结束触发")
      this.stop()
      Event.emit("play_end")
      return true
    }
    return false
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
      this.tsLoader.urlIndex = this.getPlayIndex()
    }else{
      //当前播放点在已经buffer的区域内，判断后2秒的内容是否已加载，未加载则加载后2秒的内容 ts=2后的时间点
      //console.log(this.htmlEle.currentTime, this.htmlEle.currentTime + 2, this.sourceBuff.playBufferTime)
      if(this.htmlEle.currentTime + 2 >=  this.sourceBuff.playBufferTime.end){
        ts = this.htmlEle.currentTime + 2
      }
    }
    if(ts > -1){
      if (this.onVideoEnd()) {
        return
      }
      this.tsLoader.loadTsFile()
      for (let i = 0; i < Event.globalData.sliceInfo.length;i++) {
        let slice = Event.globalData.sliceInfo[i]
        if (ts >= slice.sTime && ts <= slice.eTime && slice.loadStatus == 2) {
        
          this.sourceBuff.addTask({
            type:"play_append",
            buffItem:slice,
            reset:reset
          })
          this.sourceBuff.doTask()
          break
        }
      }
    }
  }

  getPlayIndex() {
    let ts = this.htmlEle.currentTime
    for (let i = 0; i < Event.globalData.sliceInfo.length;i++) {
      let slice = Event.globalData.sliceInfo[i]
      if (ts >= slice.sTime && ts < slice.eTime) {
        console.log("新的偏移", ts, slice)
        return i
      } 
    }
  }
}