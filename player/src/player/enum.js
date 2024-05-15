
export default {

  playStatus:{
    INIT:0,
    LOADING:1,
    COMPLETE:2,
    CHANGING:3,
    PASEING:4
  },
  playStatusStr:{
    "0":"未开始",
    "1":"下载中",
    "2":"完成",
    "3":"切换中",
    "4":"解析中"
  },
  playEvent:{
    TSLOADED:'tsloaded',
    TRANSFERED:'transfered',
    STATUS_CHANGE:'status_change',
  }
  
}