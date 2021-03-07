
import Event from "./event"
export default class sourceBuff{

  constructor() {
 
    this.buffer = null
    this.queue = []
    this.removeIng = 0
    this.bufferIng = {
      start:0,
      end:0
    }
    this.playBufferTime =  {
      start:0,
      end:0
    }
  }




  initBuffer(mediaSource){
    this.mediaSource = mediaSource
    // while(this.mediaSource.sourceBuffers.length > 0){
    //   mediaSource.endOfStream()
    //   this.mediaSource.removeSourceBuffer(this.mediaSource.sourceBuffers[0])
    // }

    let outputType = 'combined'
    var codecsArray = ["avc1.64001f", "mp4a.40.5"];
    if (outputType === 'combined') {
      this.buffer = this.mediaSource.addSourceBuffer('video/mp4; codecs="mp4a.40.2,avc1.64001f"');
     // mediaSource.addSourceBuffer('video/mp4; codecs="mp4a.40.2,avc1.64001f"');
    } else if (outputType === 'video') {
      // 转换为只含视频的mp4
      this.buffer = this.mediaSource.addSourceBuffer('video/mp4;codecs="' + codecsArray[0] + '"');
    } else if (outputType === 'audio') {
      // 转换为只含音频的mp4
      this.buffer = this.mediaSource.addSourceBuffer('audio/mp4;codecs="' + (codecsArray[1] || codecsArray[0]) + '"');
    }
    //buffer.mode = 'sequence'
    //buffer.addEventListener('updatestart', logevent);
    this.buffer.addEventListener('updateend', this.bufferEnd.bind(this));
    //buffer.addEventListener('error', logevent);
  }

  addTask(data, push){
    if(push){
      this.queue.push(data)
    }else{
      this.queue.unshift(data)
    }
    
  }

  doTask(){
    if(this.queue.length <= 0){
      return
    }

    if(this.nowTask){
      return
    }
    this.nowTask = this.queue.pop()
    try {
      if(this.nowTask.type == "append"){
        this.appendData()
      }else if(this.nowTask.type == "remove"){
        this.removeData()
      }else if(this.nowTask.type == "play_append"){
        this.playAppend()
      }else if(this.nowTask.type == "play_remove"){
        this.playAppend()
      }
    } catch (error) {
      this.nowTask = null
    }
  
   
  }

  playRemove(){
    
    this.buffer.remove(this.playBufferTime.start, this.playBufferTime.end)
  }

  playAppend(){
    this.buffer.timestampOffset = this.nowTask.buffItem.sTime >0 ? this.nowTask.buffItem.sTime - 0.3 : this.nowTask.buffItem.sTime
    this.buffer.appendBuffer(this.nowTask.buffItem.buff)
  }


  appendData(){
    if(this.nowTask.timestampOffset){
      this.buffer.timestampOffset = this.nowTask.timestampOffset
    }else{
      if(this.mediaSource.duration > 0){
        this.buffer.timestampOffset = this.mediaSource.duration - 0.5
      }
    }
    this.buffer.appendBuffer(this.nowTask.data);
  }
  removeData(){
    console.log("移除",this.nowTask )
    this.buffer.remove(this.nowTask.sTime, this.nowTask.eTime)
  }

  bufferEnd(){

    if(this.nowTask.type == "append"){
      this.bufferIng.end = this.mediaSource.duration

      let overTime = this.bufferIng.end - this.bufferIng.start - 5
      if(overTime > 10){
        let stime = this.bufferIng.start
        this.addTask({
          type:"remove",
          sTime: stime ,
          eTime:this.bufferIng.start + overTime
        },1)
        this.nowTask.addRemove = 1
        this.bufferIng.start += overTime
      }
      if(this.nowTask.addRemove){
        this.lastTask = this.nowTask
        this.nowTask = null
        this.doTask()
        return
      }else{
        Event.emit("appened", this.nowTask.data)
      }
    }
    if(this.nowTask.type == "remove"){
      if(this.lastTask && this.lastTask.addRemove){
        Event.emit("appened", this.lastTask.data)
        this.lastTask = null
      }
    }
    if(this.nowTask.type == "play_append"){
      let overTime = this.playBufferTime.end - this.playBufferTime.start - 30
      if(overTime > 30){
        let stime = this.playBufferTime.start
        this.addTask({
          type:"remove",
          sTime: stime ,
          eTime:this.playBufferTime.start + overTime
        },1)
        this.playBufferTime.start += overTime
        this.doTask()
      }
      if(this.nowTask.reset){
        this.playBufferTime.start = this.nowTask.buffItem.sTime
      }
      this.playBufferTime.end = this.nowTask.buffItem.eTime
      console.log("增加播放块", this.playBufferTime)
    }



    this.nowTask = null
    this.doTask()
    
  }
}  