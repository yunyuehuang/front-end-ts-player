
export default {
  config: {
    pinOffset: 0.05,  //废弃
    threadNum: 5,
    timeOut:20,
    preLoadTime:20,
    playBeginTime:0,
    playEndTime:0,
    autoPlayNext:false,
    pageUrl:'',
    url:'https://cdn.zoubuting.com/20210703/Klgppf2j/hls/index.m3u8',
  },
  globalData:{
    player:null,
    playStatus: 0, //0未开始 1下载中 2已完成 3切换中
    sliceInfo:[], //所有片段信息
    ase:null
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