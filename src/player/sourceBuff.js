import Event from "./event"
export default class sourceBuff{

  constructor() {
 
    this.buffer = null
    this.queue = []
    this.sliceQueue = []
    this.bufferIng = {
      start:0,
      end:0
    }
    this.playBufferTime =  {
      start:0,
      end:0
    }

    this.appendIndex = 0
  }


  // 元素添加至队列中，队列中的元素按照slice.index顺序排序
  addSlice(slice){
    if (this.sliceQueue.length == 0) {
      this.sliceQueue.push(slice)
      return
    }

    if (slice.index < this.sliceQueue[0].index) {
      this.sliceQueue.unshift(slice)
    }

    for (let i=0; i <this.sliceQueue.length; i++) {
      let nowSlice = this.sliceQueue[i]
      if (slice.index > nowSlice.index) {
        if (i == this.sliceQueue.length-1) {
          this.sliceQueue.push(slice)
          return
        }

        let nextSlice = this.sliceQueue[i + 1]
        if (slice.index < nextSlice.index) {
          this.sliceQueue.splice(i + 1, 0, slice)
          return
        }
      }
    }
  }

  getSlice(){
    if (this.sliceQueue.length == 0) {
      return 
    }

    let nextSlice = this.sliceQueue[0]
    if (nextSlice.index > this.appendIndex) {
      return
    }
    this.sliceQueue.shift()
    this.addTask({
      type:"append",
      data: nextSlice.data
    })
    this.doTask()
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
    if(this.nowTask){
      return
    }

    if(this.queue.length <= 0){
      this.getSlice()
      return
    }

    this.nowTask = this.queue.pop()
    try {
      if(this.nowTask.type == "append"){
        this.appendData()
      }else if(this.nowTask.type == "remove"){
        // playBufferTime或者 bufferIng加长时，检测到长度过长，remove掉尾部
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
    this.buffer.timestampOffset = this.nowTask.buffItem.sTime
    this.buffer.appendBuffer(this.nowTask.buffItem.buff)
  }


  appendData(){
    
    if(this.mediaSource.duration > 0){
      //添加buffer偏移量
      this.buffer.timestampOffset = this.mediaSource.duration - 0.05
    } else {
      this.buffer.timestampOffset = 0
    }
    
    this.buffer.appendBuffer(this.nowTask.data);
  }
  removeData(){
    this.buffer.remove(this.nowTask.sTime, this.nowTask.eTime)
  }

  bufferEnd(){

    if(this.nowTask.type == "append"){
      Event.emit("appened", [this.nowTask.data, this.appendIndex])
      Event.emit("loaded_num", this.appendIndex + 1)

      this.appendIndex ++
      //检测是否需要进行remove
      this.bufferIng.end = this.mediaSource.duration
      let removeTime = this.bufferIng.end - this.bufferIng.start
      if(removeTime > 8){ //如果buffer长度大于8，则移除前n秒,使得buffer区域只剩下2秒
        removeTime = removeTime - 2
        let stime = this.bufferIng.start

        this.addTask({
          type:"remove",
          sTime: stime ,
          eTime:this.bufferIng.start + removeTime
        }, 1) 
        //将任务push到队列中，保证下一个就会执行，优先执行删除任务，执行完之后才能append本次数据。否则可能导致本次删除还没执行，下一次数据又来到了。
        this.bufferIng.start += removeTime
      }
    }
    
    else if(this.nowTask.type == "remove"){
      // if(this.lastTask && this.lastTask.addRemove){
      //   Event.emit("appened", this.lastTask.data) //继续append上次被remove打断的数据
      //   this.lastTask = null
      // }
    }

    else if(this.nowTask.type == "play_append"){
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
      if(this.nowTask.reset){
        this.playBufferTime.start = this.nowTask.buffItem.sTime
      }
      this.playBufferTime.end = this.nowTask.buffItem.eTime
    }

    this.nowTask = null
    this.doTask()
    
  }
}  