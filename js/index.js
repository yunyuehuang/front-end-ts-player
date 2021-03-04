
//var urls = "https://v.qiexiazai.com/fuckyou-9527/xr163/8000kb/hls/index{{index}}.ts";
var $ = document.querySelector.bind(document);
var vjsParsed,
  video,
  buffer,
  mediaSource,
  urlIndex = 100, //请求链接序号;
  videoUrl = "",
  outputType = "combined",   // 只处理视频设置video，只处理音频设置audio，视频音频混合设置为'combined'
  globalStatus = 0, //播放器状态  0未开始  1下载中  2 接收完毕  3等待切换
  videoInit = 0


var app = new Vue({
  el: '#app',
  data: {
    listIndex:0,
    num:'',
    globalStatus:0,
    list: [
      {
        name:"1系列",
        url:"https://v.qiexiazai.com/fuckyou-9527/xr{{num}}/8000kb/hls/index{{index}}.ts"
      },
      {
        name:"r1",
        url:"https://v.qiexiazai.com/fuckyou-9527/ru{{num}}/3500kb/hls/index{{index}}.ts"
      },
      {
        name:"约模私拍",
        url:"https://v.qiexiazai.com/fuckyou-9527/wuying{{num}}/8000kb/hls/index{{index}}.ts"
      }
    ]
  },
  computed: {
    // a computed getter
    globalStatusStr: function () {
      let status = {
        "0":"未开始",
        "1":"下载中",
        "2":"完成",
        "3":"切换中"
      }
      return status[this.globalStatus]
    }
  },
  mounted(){
    video = document.createElement('video');
    video.controls = true;
    $('#video-wrapper').appendChild(video);
    video.addEventListener('error', logevent);
  },
  methods:{
 
    play(){
      if(!this.num){
        alert("请先输入选集")
        return
      }
      if(this.globalStatus == 0 || this.globalStatus == 2){
        this.globalStatus = 1
        urlIndex = 0
        videoInit = 0
        videoUrl = this.list[this.listIndex].url.replace("{{num}}", this.num)
        mediaSource = new MediaSource()
        video.src = URL.createObjectURL(mediaSource)
        mediaSource.addEventListener('sourceopen', function () {
          initBuffer()
          getData(videoUrl)
        });
      }else{
        this.globalStatus = 3
      }
      
    }
  }
})

function initBuffer(){
  // MediaSource 实例默认的duration属性为NaN
  mediaSource.duration = 0;
  // 转换后mp4的音频格式 视频格式
  var codecsArray = ["avc1.64001f", "mp4a.40.5"];
  

  // 转换为带音频、视频的mp4
  if (outputType === 'combined') {
    buffer = mediaSource.addSourceBuffer('video/mp4; codecs="mp4a.40.2,avc1.64001f"');
  } else if (outputType === 'video') {
    // 转换为只含视频的mp4
    buffer = mediaSource.addSourceBuffer('video/mp4;codecs="' + codecsArray[0] + '"');
  } else if (outputType === 'audio') {
    // 转换为只含音频的mp4
    buffer = mediaSource.addSourceBuffer('audio/mp4;codecs="' + (codecsArray[1] || codecsArray[0]) + '"');
  }


  //buffer.mode = 'sequence'
  buffer.addEventListener('updatestart', logevent);
  buffer.addEventListener('updateend', function () {
    if(app.globalStatus == 3){
      app.globalStatus = 0
      app.play()
    }else{
      urlIndex++
      getData(videoUrl)
    }
   
  });
  buffer.addEventListener('error', logevent);
}
function getData(url) {

  let xhr = new XMLHttpRequest();
  let resStatus = 1
  url = url.replace("{{index}}", urlIndex);
  xhr.onerror = function(e){
    console.log(e,"请求错误")
  }
  xhr.onloadend = function(e){
    
    if(e.lengthComputable == false){
      console.log(e,"下载异常")
      timeOutDeal()
    }
  }
  xhr.open('GET', url);
  // 接收的是 video/mp2t 二进制数据，并且arraybuffer类型方便后续直接处理 
  xhr.responseType = "arraybuffer";
  xhr.send();
  var timer = setTimeout(timeOutDeal,3000)
  var time1
  //超时之后的处理。停止当前请求，重新发起请求。
  function timeOutDeal(){
    clearTimeout(timer)
    
    
    if(resStatus == 1){
      console.log("请求超时", resStatus)
    }else{
      console.log("响应超时", resStatus)
    }
    resStatus = 1
    xhr.abort() //timeout调用 abort->onreadystatechange  readyState是4的回调，status为0 -> onloadend 再次调用timeOutDeal-> 输出一次，设置time1定时器 ->  然后再到timeout的这次,又设置一个time1定时器。-> 6秒钟之后几乎同时发起send，首先发起的会在第二次
    if(time1){
      clearTimeout(time1)
    }
   
    console.log("等下重发")
    time1 = setTimeout(function(){
      if(app.globalStatus == 3){ //请求异常的时候，
        app.globalStatus = 0
        app.play()
        return
      }
      console.log("请求重发")
      xhr.open('GET', url);
      xhr.send();
      timer = setTimeout(timeOutDeal, 3000)
    },1000)
  
  }

  xhr.onreadystatechange = function () {
    //3开始接收响应体  4响应体接收完成
   
    if(xhr.readyState >= 3){
      clearTimeout(timer)
      //接收响应体的过程中，会多次触发此回调，readyState都是3，如果回调间隔过长，表示接收数据阻塞，这里也设置一个超时。
      //取消请求的时候会有一个 readyState是4的回调，status为0.
      if(xhr.readyState == 3){
        timer = setTimeout(timeOutDeal,5000)
        console.log("开始响应")
        resStatus = 2
      }
      if (xhr.readyState == 4) {
        if (xhr.status == 200) {
          transferFormat(xhr.response);
        } else {
          console.log(xhr.status,'请求结束，结果error')
        }
      }
    }

  }
}


function logevent(event) {
  console.log(event);
}


function transferFormat(data) {
  // 将源数据从ArrayBuffer格式保存为可操作的Uint8Array格式
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer
  var segment = new Uint8Array(data);
  var combined = false;

  var remuxedSegments = [];
  var remuxedBytesLength = 0;
  var remuxedInitSegment = null;

  // remux选项默认为true，将源数据的音频与视频混合为mp4，设为false则不混合。如果为false，data事件里面会收到两次回调，一次是视频数据，一次是音频数据，如果为true，则只会收到一次视频和音频合并后的数据。
  var transmuxer = new muxjs.mp4.Transmuxer({
    remux: true
  });

  // 监听data事件，开始转换流
  transmuxer.on('data', function (event) {
    //remux选项默认为false，则会回调两次，因此event.type为video，一次type为audio，如果为true，则只会回调一次，type为combined
    console.log(event,"data事件");
    if (event.type == outputType) {
      // remuxedSegments.push(event);
      // remuxedBytesLength += event.data.byteLength;
      // remuxedInitSegment = event.initSegment;
    //  buffer.timestampOffset = urlIndex
    console.log(mediaSource.duration, buffer.timestampOffset)
    buffer.timestampOffset = mediaSource.duration>0 ? mediaSource.duration -1 : 0
      if(videoInit == 0 ){
        let data = new Uint8Array(event.initSegment.byteLength + event.data.byteLength);
        data.set(event.initSegment, 0);
        data.set(event.data, event.initSegment.byteLength);
        console.log(muxjs.mp4.tools.inspect(data));
        //buffer.appendBuffer(data);
        videoInit = 1
        console.log("第一次初始化")
      }else{
        //buffer.appendBuffer(new Uint8Array(event.data));
        console.log("后续直接添加")
      }
     
    }
  });
  // 监听转换完成事件，拼接最后结果并传入MediaSource
  transmuxer.on('done', function () {
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
