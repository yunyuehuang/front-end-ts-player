
import Event from "./event"

export default class Decoder{
  constructor(){
    this.isStop = false
  }

  stop(){
    this.isStop = true
  }
  //eventData 内容为 [buff, index] 
  transferFormat(eventData, cb) {
    // 将源数据从ArrayBuffer格式保存为可操作的Uint8Array格式
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer

    var segment = new Uint8Array(eventData[0]);

    var remuxedSegments = [];
    var remuxedBytesLength = 0;
    var remuxedInitSegment = null;
  
    // remux选项默认为true，将源数据的音频与视频混合为mp4，设为false则不混合。如果为false，data事件里面会收到两次回调，一次是视频数据，一次是音频数据，如果为true，则只会收到一次视频和音频合并后的数据。
    var transmuxer = new muxjs.mp4.Transmuxer({
      remux: true
    });


    // 监听data事件，开始转换流
    transmuxer.on('data', (event)=> {
      if (this.isStop) {
        return
      }

      //remux选项默认为false，则会回调两次，因此event.type为video，一次type为audio，如果为true，则只会回调一次，type为combined
      if (event.type != "combined") {
        return
      }

      remuxedSegments.push(event)
      remuxedBytesLength += event.data.byteLength
      remuxedInitSegment = event.initSegment
    })
  
    transmuxer.on('done', (d)=> {
      if (this.isStop) {
        return
      }
      var offset = 0;
      var bytes = new Uint8Array(remuxedInitSegment.byteLength + remuxedBytesLength)
      bytes.set(remuxedInitSegment, offset)
      offset += remuxedInitSegment.byteLength
  
      for (var j = 0; j < remuxedSegments.length; j++) {
        bytes.set(remuxedSegments[j].data, offset)
        offset += remuxedSegments[j].byteLength
      }
      remuxedSegments = [];
      remuxedBytesLength = 0;

      Event.emit("transfered", [bytes, eventData[1]])

      // 解析出转换后的mp4相关信息，与最终转换结果无关
      // vjsParsed = muxjs.mp4.tools.inspect(bytes);
      // console.log('transmuxed', vjsParsed);
  
    });
    // push方法可能会触发'data'事件，因此要在事件注册完成后调用
    transmuxer.push(segment); // 传入源二进制数据，分割为m2ts包，依次调用上图中的流程
    // flush的调用会直接触发'done'事件，因此要事件注册完成后调用
    transmuxer.flush(); // 将所有数据从缓存区清出来
  }



}