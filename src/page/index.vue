<template>
  <div class="wrap" id="wrap">
    <div class="left">
      <div class="list-box">
       
      </div>
    </div>

    <div class="right">
      <div class="operate">
        地址<input v-model="url">
        <div class="btn" @click="play">获取</div>
      </div>
      <div class="">视频片段数：{{videoSlice}}，已加载{{loadVideoSlice}}</div>
      <div>状态：{{globalStatusStr}}</div>
      <div id="video-wrapper">
        <video controls ref="video"></video>
      </div>
    </div>
  </div>
</template>

<script>
import Event from "@src/player/event.js"
import GlobalStatus from "../player/globalStatus.js"
import Enum from "../player/enum.js"
import Player from "@src/player/player.js"
import $ from "jquery"
export default {
  name: 'App',
  data(){
    return {
      videoSlice:0,
      loadVideoSlice:0,
      url:'https://b1.szjal.cn/ppvod/3C58E8BA8A65023822AC7D7F75F2ECD8.m3u8',
      globalStatus:Enum.playStatus.INIT,
      list: [
       
      ],
      player:null
    }
  },
  computed: {
    // a computed getter
    globalStatusStr: function () {
      return Enum.playStatusStr[this.globalStatus]
    }
  },
  mounted(){
    let video = this.$refs.video
   
    this.player = new Player()
    this.player.attachHtmlEle(video)

    Event.on("status_change", (e)=>{
      GlobalStatus.playStatus = e
      this.globalStatus = e
    })

    Event.on("loaded_num", (e)=>{
      this.loadVideoSlice = e
    })

    Event.on("stoped", (e)=>{
      Event.globalData.playStatus = 0
      this.play()
    })
  },
  methods:{

    play(){
      if(!this.url){
        alert("请先输入地址")
        return
      }
      
      if(Event.globalData.playStatus == 1){
        Event.emit("status_change", 3)
        return
      }

      $.get(this.url, (data) => {
        let myURL = new URL(this.url);
        console.log(myURL)
        let urlList = []
        data.split("\n").map((e)=>{
          if (e.indexOf('.ts') > -1) {
            urlList.push(`${myURL.origin}${e}`)
          }
        })
        this.videoSlice = urlList.length
        this.player.setTsUrls(urlList)
        this.player.play()
      })



    }

  }
}
</script>

<style lang="less">
  //此处scss内图片的相对路径都是以本vue文件为基础的，而不是已scss文件自己为基础
  @import '../scss/index.less';

</style>
