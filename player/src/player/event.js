
export default {

  globalData:{
    playStatus: 0, //0未开始 1下载中 2已完成 3切换中
    pinOffset: 0.05,  //废弃
    lengthList:[], //视频每个片段时长
    currentBufferTime:0, //当前最新的总长度
  },

  eventObj:{},

  on(event, func){
    if(!this.eventObj[event]){
      this.eventObj[event] = []
    }

    this.eventObj[event].push(func)
  },

  emit(event,data){
    if(!this.eventObj[event]){
      return
    }
    this.eventObj[event].forEach(element => {
      element(data)
    });
  }

}