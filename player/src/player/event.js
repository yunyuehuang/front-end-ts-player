
export default {
  config: {
    pinOffset: 0.05,  //废弃
    threadNum: 0,
    timeOut:0,
    preLoadTime:0,
    playBeginTime:0,
    playEndTime:0,
  },
  globalData:{
    playStatus: 0, //0未开始 1下载中 2已完成 3切换中
    sliceInfo:[], //所有片段信息
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