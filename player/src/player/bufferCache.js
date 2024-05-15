
import event from "./event.js"

export default class bufferCache{

  constructor() {
    this.bufferObj = {
      actIndex:-1,
      list:[]
    }
  }

  getBuffer(timeStamp){
    let buff = null
    this.bufferObj.list.forEach(v => {
      if(timeStamp >= v.sTime && timeStamp < v.eTime){
        buff = v
      }
    });
    return buff

  }

}