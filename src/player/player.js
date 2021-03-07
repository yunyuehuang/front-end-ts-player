

import tsLoader from "./loader.js"
import decoder from "./decoder.js"
import bufferCache from "./bufferCache"
import sourceBuff from "./sourceBuff"
import Event from "./event"
export default class myPlayer{
  
  constructor() {
    this.htmlEle = null
    this.mediaSource = null
    
    this.urlIndex = 0
    this.isAddHeadInfo = 1
    this.bufferCache = new bufferCache()
    this.sourceBuff = null
    this.tsLoader = new tsLoader()
    this.bindEvent()
  }

  bindEvent(){
  
    Event.on("tsloaded",(data)=>{
      decoder.transferFormat(data, this.isAddHeadInfo)
      if(this.isAddHeadInfo){
        this.isAddHeadInfo = 0
      }
    })

    Event.on("transfered",(data)=>{
      
      this.sourceBuff.addTask({
        type:"append",
        data:data
      })
      this.sourceBuff.doTask()
    })

    Event.on("appened",(data)=>{
    
      this.bufferCache.addBuffer(this.mediaSource.duration, data)
      this.urlIndex ++ 
      if(Event.globalData.playStatus == 3){
        Event.emit("stoped")
        return
      }
      this.loadTs()
    })
  }

  play(){
    this.isAddHeadInfo = 1
    this.urlIndex = 0
    Event.emit("status_change", 1)
    this.mediaSource = new MediaSource()
    this.htmlEle.src = URL.createObjectURL(this.mediaSource)
    this.mediaSource.addEventListener('sourceopen', ()=> {
      this.mediaSource.duration = 0
      this.sourceBuff = new sourceBuff()
      this.sourceBuff.initBuffer(this.mediaSource)
      this.loadTs()
    });
   
  }

  setTsUrl(url){
    this.tsUrl = url
  }
  attachHtmlEle(el){
    this.htmlEle = el
   
    this.htmlEle.addEventListener('timeupdate', (e)=> {
      if(this.sourceBuff.nowTask && this.sourceBuff.nowTask.type == "play_append"){
        return
      }
     
      let reset = 0
      let ts = -1
      if(this.sourceBuff.playBufferTime.end <= this.htmlEle.currentTime || this.sourceBuff.playBufferTime.start >= this.htmlEle.currentTime){
        ts = this.htmlEle.currentTime
        reset = 1
        this.sourceBuff.addTask({
          type:"play_remove"
        })
      }else{
        let overLoadPlayTime = this.sourceBuff.playBufferTime.end - this.htmlEle.currentTime - 2
        if(overLoadPlayTime < 0){
          ts = this.htmlEle.currentTime + 2
          
        }
      }
      if(ts > -1 ){
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
    })

   
  }

  loadTs(){
    let url = this.tsUrl.replace("{{index}}", this.urlIndex)
    this.tsLoader.loadTsFile(url)
  }


}