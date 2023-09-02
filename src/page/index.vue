<template>
  <div class="wrap" id="wrap">
    <div class="operate">
      地址<input v-model="url" class="input-url">
      <div class="btn" @click="play">获取</div>
    </div>  
    <div class="operate">
      ts文件正则<input v-model="tsUrl" class="input-url" placeholder="https://xxxxx/xx/{ts}">
      <p class="desc">会将填写内容的{ts}替换为m3u8文件中的ts文件地址</p>
    </div>
    <div class="operate">
      并发数<input v-model="threadNum">  
      超时时长<input v-model="timeOut">
      拼接偏移量<input v-model="pinOffset">
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
import Event from "@src/player/event.js"
import Enum from "../player/enum.js"
import Player from "@src/player/player.js"
import $ from "jquery"
export default {
  name: 'App',
  data(){
    return {
      videoSlice:0,
      loadVideoSlice:0,
      loadingVideoSlice: 0,
      pinOffset:0.05,
      url:'https://cdn.zoubuting.com/20210703/Klgppf2j/hls/index.m3u8',
      tsUrl:'{ts}',
      globalStatus:Enum.playStatus.INIT,
      threadNum:5,
      timeOut:10,
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
    let video = this.$refs.video
   
    this.player = new Player()
    this.player.attachHtmlEle(video)

    Event.on("status_change", (e)=>{
      this.globalStatus = e
      Event.globalData.globalStatus = e
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

    play(){
      if(!this.url){
        alert("请先输入地址")
        return
      }
      
      if(Event.globalData.playStatus == Enum.playStatus.LOADING){
        alert("正在播放中")
        return
      }

      Event.globalData.pinOffset = this.pinOffset

      $.get(this.url, (data) => {
        let myURL = new URL(this.url);
        console.log(myURL)
        let urlList = []
        data.split("\n").map((e)=>{
          if (e.indexOf('.ts') > -1) {
            this.statusBox.push('init')
            let url
            if (this.tsUrl) {
              url = this.tsUrl.replace('{ts}', e)
            } else {
              url = `${myURL.origin}/${e}`
            }
            urlList.push(url)
          }
        })
        this.videoSlice = urlList.length
        this.player.setTsUrls(urlList)
        this.player.setLoaderConfig({
          threadNum: this.threadNum,
          timeOut: this.timeOut
        })
        this.player.play()
      })
    }
  }
}
</script>

<style lang="less">
  //此处scss内图片的相对路径都是以本vue文件为基础的，而不是以scss文件自己为基础
  @import '../scss/index.less';

</style>
