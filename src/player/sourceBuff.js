
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
    this.buffer.timestampOffset = this.nowTask.buffItem.sTime >0 ? this.nowTask.buffItem.sTime - 0.2 : this.nowTask.buffItem.sTime
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

      let removeTime = this.bufferIng.end - this.bufferIng.start
      // if(removeTime > 8){ //如果buffer长度大于8，则移除前n秒,使得buffer区域只剩下2秒
      //   removeTime = removeTime - 2
      //   let stime = this.bufferIng.start
      //   this.addTask({
      //     type:"remove",
      //     sTime: stime ,
      //     eTime:this.bufferIng.start + removeTime
      //   }, 1) //将任务push到队列中，保证下一个就会执行，优先执行删除任务，执行完之后才能append本次数据。否则可能导致本次删除还没执行，下一次数据又来到了。
      //   this.nowTask.addRemove = 1
      //   this.bufferIng.start += removeTime
      // }
      if(this.nowTask.addRemove){
        this.lastTask = this.nowTask
        //this.doTask() 
        //return
      }else{
        Event.emit("appened", this.nowTask.data)
      }
    }
    
    else if(this.nowTask.type == "remove"){
      if(this.lastTask && this.lastTask.addRemove){
        Event.emit("appened", this.lastTask.data) //继续append上次被remove打断的数据
        this.lastTask = null
      }
    }

    else if(this.nowTask.type == "play_append"){
      let removeTime = this.playBufferTime.end - this.playBufferTime.start
      // if(removeTime > 30){
      //   removeTime = removeTime - 10
      //   let stime = this.playBufferTime.start
      //   this.addTask({
      //     type:"remove",
      //     sTime: stime ,
      //     eTime:this.playBufferTime.start + removeTime
      //   }, 1)
      //   this.playBufferTime.start += removeTime
      // }
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