<template>
  <div class="wrap" id="wrap">
    <div class="operate">
      页面地址<input v-model="pageUrl" class="input-url"><br/>
      m3u8地址<input v-model="url" placeholder="填了优先取这个" class="input-url">
      <div class="btn" @click="play">获取</div>
    </div>  
    <!-- <div class="operate">
      ts文件正则<input v-model="tsUrl" class="input-url" placeholder="https://xxxxx/xx/{ts}">
      <p class="desc">会将填写内容的{ts}替换为m3u8文件中的ts文件地址</p>
    </div> -->
    <div class="operate">
      并发数<input v-model="threadNum">  
      超时时长<input v-model="timeOut">秒<br/>
      拼接偏移量<input v-model="pinOffset">
      起始下载时间点<input v-model="playBeginTime">分
    </div>
    <div class="operate">状态：{{globalStatusStr}}</div>
    <div class="operate">视频片段数：{{videoSlice}}，已加载{{loadVideoSlice}}，加载中{{loadingVideoSlice}}</div>
    <div class="status">
      <div v-for="item in statusBox" :class="item"></div>
    </div>
    <div id="video-wrapper">
      <video controls ref="video"></video>
    </div>

  </div>
</template>

<script>
import Event from "../player/event.js"
import Enum from "../player/enum.js"
import Player from "@src/player/player.js"
import $ from "jquery"
import Store from "../player/store"
export default {
  name: 'App',
  data(){
    return {
      pinOffset:0.05,
      pageUrl:'',
      url:'https://cdn.zoubuting.com/20210703/Klgppf2j/hls/index.m3u8',
      tsUrl:'',
      threadNum:5,
      timeOut:10,
      playBeginTime:0,

      videoSlice:0,
      loadVideoSlice:0,
      loadingVideoSlice: 0,
      globalStatus:Enum.playStatus.INIT,
      statusBox: [],
      player:null
    }
  },
  computed: {
    globalStatusStr: function () {
      return Enum.playStatusStr[this.globalStatus]
    }
  },
  mounted(){
    Store.getConfig(this)

    let video = this.$refs.video
   
    this.player = new Player()
    this.player.attachHtmlEle(video)

    Event.on("status_change", (e)=>{
      console.log("status_change", e)
      this.globalStatus = e
      Event.globalData.playStatus = e
    })

    Event.on("loaded_num", (e)=>{
      this.loadVideoSlice = e
      if (e >= this.videoSlice) {
        Event.emit("status_change", Enum.playStatus.COMPLETE)
        return
      }
    })

    Event.on("tsload", (e)=>{
      this.$set(this.statusBox, e, 'load');
      this.updateLoading()
    });

    Event.on("tsloaded", (e)=>{
      this.$set(this.statusBox, e[1], 'loaded');
      this.updateLoading()
    });

    Event.on("appened",(e)=>{
      this.$set(this.statusBox, e[1], 'append');
    })
  },
  methods:{

    updateLoading(){
      let num = 0
      this.statusBox.map((e)=>{
        if (e == 'load') {
          num++
        }
      })
      this.loadingVideoSlice = num
    },

    afterGetM3u8(data){
      let myURL = new URL(this.url);
      console.log(myURL)
      let urlList = []
      let lengthList = []
      let arr = data.split("\n")
      for (const i in arr) {
        let e = arr[i]
        if (e.indexOf('METHOD=') > -1) {
          alert("暂时无法播放加密视频 " + e)
          Event.emit("status_change", Enum.playStatus.INIT)
          return
        }


        if (e.indexOf('.ts') > -1) {
          this.statusBox.push('init')
          let url
          if (this.tsUrl) {
            url = this.tsUrl.replace('{ts}', e)
          } else {
            if (e.indexOf('http') > -1) {
              url = e
            } else {
              url = `${myURL.origin}/${e}`
            }
          }
          urlList.push(url)
        }
        if (e.indexOf('EXTINF') > -1) {
          let match = /\d+(\.\d+)?/.exec(e);
    
          if (!match) {
            alert("时长解析错误")
            Event.emit("status_change", Enum.playStatus.INIT)
            return
          }
          lengthList.push(Number(match[0]))
        }
      }
      let time = lengthList[0]
      if (this.playBeginTime > 0) {
        while(this.playBeginTime*60 > time){
  
          lengthList.shift();
          urlList.shift()
          if (lengthList.length == 0) {
            alert("起始播放时间超过视频总时长")
            Event.emit("status_change", Enum.playStatus.INIT)
            return
          }
          
          time += lengthList[0]
        }
      }
      Event.globalData.lengthList = lengthList
      this.videoSlice = urlList.length
      this.player.setTsUrls(urlList)
      this.player.setLoaderConfig({
        threadNum: this.threadNum,
        timeOut: this.timeOut
      })
      this.player.play()
    },

    play(){
      if(!this.url && !this.pageUrl){
        alert("请先输入地址")
        return
      }
      
      if(Event.globalData.playStatus == Enum.playStatus.LOADING){
        alert("正在播放中")
        return
      }

      Event.emit("status_change", Enum.playStatus.LOADING)

      Store.setConfig(this)
      Event.globalData.pinOffset = this.pinOffset

      if (this.url) {
        $.get(this.url, this.afterGetM3u8)
      } else if (this.pageUrl){
        $.ajax({  
        url: 'http://129.204.63.215:11200/m3u8',  // 请求的 URL  
        type: 'POST',                          // 请求方法，如 GET、POST 等  
        dataType: 'json',                     // 期望的响应数据类型，如 json、xml、html 等  
        data: {                              // 发送到服务器的数据  
            url: this.pageUrl,  
        },
        success: (response) =>{        // 请求成功时的回调函数  
          console.log(response); 
          if (response.code !=0) {
            Event.emit("status_change", Enum.playStatus.INIT)
            alert("请求失败" + response.data)
            return
          }
          this.url = response.data.url
          this.afterGetM3u8(response.data.data)
        },  
        error: function(jqXHR, textStatus, errorThrown) { // 请求失败时的回调函数  
          alert("请求失败")
          Event.emit("status_change", Enum.playStatus.INIT)
        },  
      })
    }
    }
  }
}
</script>

<style lang="less">
  //此处scss内图片的相对路径都是以本vue文件为基础的，而不是以scss文件自己为基础
  @import '../scss/index.less';

</style>
