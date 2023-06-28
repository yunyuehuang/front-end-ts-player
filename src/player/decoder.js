
import Event from "./event"

export default {
  status:0,
  //eventData 内容为 [buff, index] 
  transferFormat(eventData, cb) {
    // 将源数据从ArrayBuffer格式保存为可操作的Uint8Array格式
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer
    let data = eventData[0]
    let isAddHeadInfo = eventData[1] == 0
    var segment = new Uint8Array(data);

  
    var remuxedSegments = [];
    var remuxedBytesLength = 0;
    var remuxedInitSegment = null;
  
    // remux选项默认为true，将源数据的音频与视频混合为mp4，设为false则不混合。如果为false，data事件里面会收到两次回调，一次是视频数据，一次是音频数据，如果为true，则只会收到一次视频和音频合并后的数据。
    var transmuxer = new muxjs.mp4.Transmuxer({
      remux: true
    });

    let outputType = "combined"
  
    // 监听data事件，开始转换流
    transmuxer.on('data', (event)=> {
      this.status = 1
      //remux选项默认为false，则会回调两次，因此event.type为video，一次type为audio，如果为true，则只会回调一次，type为combined
      if (event.type != outputType) {
        return
      }
      let data 
      //buffer.timestampOffset = mediaSource.duration>0 ? mediaSource.duration -1 : 0
      if(isAddHeadInfo){
        try {
          data = new Uint8Array(event.initSegment.byteLength + event.data.byteLength)
        }catch (error) {
          console.log(error,"下载完成")
          Event.emit("status_change", 2)
          return
        }
        data.set(event.initSegment, 0);
        data.set(event.data, event.initSegment.byteLength);
        //buffer.appendBuffer(data);
      }else{
        data = new Uint8Array(event.data)      
      }

      Event.emit("transfered", [data, eventData[1]])

      //console.log(muxjs.mp4.tools.inspect(data));
  
    });
    // 监听转换完成事件，拼接最后结果并传入MediaSource
    transmuxer.on('done', (d)=> {
      if(this.status == 0)
      {
        Event.emit("status_change", 2)
      }
      this.status = 0  
      return
      var offset = 0;
      try {
        var bytes = new Uint8Array(remuxedInitSegment.byteLength + remuxedBytesLength)
      } catch (error) {
        console.log(error,"下载完成")
        app.globalStatus = 2
        return
      }
     
      bytes.set(remuxedInitSegment, offset);
      offset += remuxedInitSegment.byteLength;
  
      for (var j = 0, i = offset; j < remuxedSegments.length; j++) {
        bytes.set(remuxedSegments[j].data, i);
        i += remuxedSegments[j].byteLength;
      }
      remuxedSegments = [];
      remuxedBytesLength = 0;
      // 解析出转换后的mp4相关信息，与最终转换结果无关
      vjsParsed = muxjs.mp4.tools.inspect(bytes);
      console.log('transmuxed', vjsParsed);
  
      buffer.appendBuffer(bytes);
    });
    // push方法可能会触发'data'事件，因此要在事件注册完成后调用
    transmuxer.push(segment); // 传入源二进制数据，分割为m2ts包，依次调用上图中的流程
    // flush的调用会直接触发'done'事件，因此要事件注册完成后调用
    transmuxer.flush(); // 将所有数据从缓存区清出来
  }



}