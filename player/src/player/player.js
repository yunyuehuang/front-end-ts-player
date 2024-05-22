

import tsLoader from "./loader.js"
import Decoder from "./decoder.js"
import sourceBuff from "./sourceBuff"
import Event from "./event"
import Decrypter from "./crypt/decrypter"
import {hexadecimalInteger} from "./crypt/mp4-tools.js"


export default class myPlayer{
  
  constructor() {
   
    this.videoTime = 0 //视频总时长，秒

    this.autoPlay = false //自动播放的记录

    this.htmlEle = null
    this.mediaSource = null
    this.sourceBuff = null
    this.decoder = null
    this.tsLoader = null

    this.bindEvent()
  }

  bindEvent(){
    Event.on("tsloaded",(data)=>{
      if (Event.globalData.ase) {
        const encoder = new TextEncoder()
        let gm = new Decrypter()
        gm.decrypt(data[0], encoder.encode(Event.globalData.ase.key).buffer, hexadecimalInteger(Event.globalData.ase.IV).buffer,0)
        .then((e) => {
          data[0] = e
          this.decoder.transferFormat(data)
        })
      } else {
        this.decoder.transferFormat(data)
      }
      
    })

    Event.on("transfered",(data)=>{
      
      let index = data[1]
      let slice = Event.globalData.sliceInfo[index]
      slice.buff = data[0]

      let ts = this.htmlEle.currentTime
      if (!this.autoPlay && slice.eTime - Event.config.playBeginTime > 30) { //加载到一定长度，自动播放
        try {
          this.htmlEle.play()
          this.htmlEle.requestFullscreen()
          this.autoPlay = true
        } catch (error) {
          console.log("autoPlay", error)
        }
      }

      if (ts >= slice.sTime && ts < slice.eTime) { //播放点在范围内，证明已经进入阻塞，直接添加
        this.onVideoPlay()
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
      this.tsLoader.htmlEle = this.htmlEle

      if (Event.config.playBeginTime > 0) {
        let beginOffset = 0
        let sliceInfo = Event.globalData.sliceInfo
        for (const i in sliceInfo) {
          if (Event.config.playBeginTime >= sliceInfo[i].sTime && Event.config.playBeginTime < sliceInfo[i].eTime) {
            beginOffset = i
            break
          }
        }
        this.tsLoader.urlIndex = beginOffset
        this.htmlEle.currentTime = Event.config.playBeginTime
      } 

      console.log("envData", Event)
      this.tsLoader.loadTsFile()
    });
   
  }

  stop(){
    try {
      this.tsLoader.stop()
      this.decoder.stop()
      this.sourceBuff.stop()
      this.autoPlay = false
      this.videoTime = 0
      this.htmlEle.currentTime = 0
      document.exitFullscreen()
      this.htmlEle.src = ''
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
      if (this.onVideoEnd()) {
        return
      }
      
      let index = this.getPlayIndex()
      console.log(this.htmlEle.currentTime, Event.globalData.sliceInfo[index], Event.globalData.sliceInfo[index+1])

      let nextIndex = index+1 
      let errIndex = 0
      while(true) {
        if (nextIndex > Event.globalData.sliceInfo.length) {
          break
        }
        if (Event.globalData.sliceInfo[nextIndex].loadStatus == 3) { //下一个片段是错误片段
          errIndex = nextIndex
          nextIndex ++
        } else {
          break
        }
      }

      if (errIndex > 0 && errIndex< Event.globalData.sliceInfo.length) {
        this.htmlEle.currentTime = Event.globalData.sliceInfo[errIndex+1].sTime
        console.log("自动跳过错误片段", this.htmlEle.currentTime, Event.globalData.sliceInfo[errIndex+1])
      }
    
    }) 


    this.htmlEle.addEventListener('error', (e)=>{
      console.log("检测到error", e)
 
    }) //当目前的播放列表已结束时触发。

  }

  onVideoEnd(){
    if (!Event.config.autoPlayNext){
      return
    }
    let end = Event.config.playEndTime > 0 ? Event.config.playEndTime : this.videoTime-3
    if (this.htmlEle.currentTime > end){
      console.log("结束触发")
      this.stop()
      Event.emit("play_end")
      return true
    }
    return false
  }

  onVideoPlay(e){
    Event.emit("currentTime", this.htmlEle.currentTime)
    if(this.sourceBuff.nowTask){
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
        return i
      } 
    }
  }
}