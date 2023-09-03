
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

  addBuffer(timeStamp, data){
    let stime = 0
    if(this.bufferObj.list.length > 0){
      stime = this.bufferObj.list[this.bufferObj.list.length -1].eTime
    }
    let buffItem = {
      sTime: stime,
      eTime: event.globalData.currentBufferTime,
      buff:new Uint8Array(data)
    }
    this.bufferObj.list.push(buffItem)
    this.bufferObj.actIndex = 0
    return buffItem

    
    if(this.bufferObj.actIndex == -1){
      let buffItem = {
        sTime: 0,
        eTime: timeStamp,
        buff:new Uint8Array(data)
      }
      this.bufferObj.list.push(buffItem)
      this.bufferObj.actIndex = 0
    }else{
      let buffItem = this.bufferObj.list[this.bufferObj.actIndex]
      if(buffItem.eTime - buffItem.sTime > 20){
        let newBuffItem = {
          sTime: buffItem.eTime,
          eTime: timeStamp,
          buff:new Uint8Array(data)
        }
        this.bufferObj.list.push(newBuffItem)
        this.bufferObj.actIndex += 1
      }else{
        buffItem.eTime = timeStamp
        let sData = new Uint8Array(buffItem.buff.byteLength + data.byteLength);
        sData.set(buffItem.buff, 0);
        sData.set(data, buffItem.buff.byteLength);
        buffItem.buff = sData
      }
    }
   
  }

}