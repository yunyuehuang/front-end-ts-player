import Event from "./event"
export default class sourceBuff{

  constructor() {
    this.mediaSource = null
    this.buffer = null
    this.queue = []
    this.playBufferTime =  {
      start:0,
      end:0
    }

    this.appendIndex = 0
    this.isStop = false
  }
  stop(){
    this.mediaSource = null
    this.isStop = true
    this.buffer = null
    this.queue = []

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
    // this.buffer.mode = 'segments'
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
    if (this.isStop) {
      return
    }
    if(this.nowTask){
      return
    }

    if(this.queue.length <= 0){
      return
    }

    this.nowTask = this.queue.pop()
    try {
      if(this.nowTask.type == "remove"){
        // playBufferTime加长时，检测到长度过长，remove掉尾部
        this.removeData()
      }else if(this.nowTask.type == "play_append"){
        //添加播放区内容
        this.playAppend()
      }else if(this.nowTask.type == "play_remove"){
        //当前播放点不在已经buffer的区域内，清除this.playBufferTime.start ~ this.playBufferTime.end所有内容
        this.playRemove()
      }
    } catch (error) {
      this.nowTask = null
    }
  }

  playRemove(){
    this.buffer.remove(this.playBufferTime.start, this.playBufferTime.end)
  }

  playAppend(){
    if(this.nowTask.reset){
      this.playBufferTime.start = this.nowTask.buffItem.sTime
    }
    this.playBufferTime.end = this.nowTask.buffItem.eTime
    
    this.buffer.timestampOffset = this.nowTask.buffItem.sTime
    this.buffer.appendBuffer(this.nowTask.buffItem.buff)
  }

  removeData(){
    this.buffer.remove(this.nowTask.sTime, this.nowTask.eTime)
  }

  bufferEnd(){
    if (this.isStop) {
      return
    }

    if(this.nowTask.type == "play_append"){
      let removeTime = this.playBufferTime.end - this.playBufferTime.start
      if(removeTime > 30){
        removeTime = removeTime - 10
        let stime = this.playBufferTime.start
        this.addTask({
          type:"remove",
          sTime: stime ,
          eTime:this.playBufferTime.start + removeTime
        }, 1)
        this.playBufferTime.start += removeTime
      }
     
    }

    this.nowTask = null
    this.doTask()
    
  }
}  