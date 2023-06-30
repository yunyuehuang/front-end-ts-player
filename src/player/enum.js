
export default {

  playStatus:{
    INIT:0,
    LOADING:1,
    COMPLETE:2,
    CHANGING:3
  },
  playStatusStr:{
    "0":"未开始",
    "1":"下载中",
    "2":"完成",
    "3":"切换中"
  },
  playEvent:{
    TSLOADED:'tsloaded',
    TRANSFERED:'transfered',
    APPENDED:'appened',
    STATUS_CHANGE:'status_change',
  }
  
}