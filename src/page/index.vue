<template>
  <div class="wrap" id="wrap">
    <div class="left">
      <div class="list-box">
        <div class="item" v-for="(item, index) in list" :class="{ active: index == listIndex }" @click="listIndex = index;num=''">
          {{item.name}}
        </div>
      </div>
    </div>

    <div class="right">
      <div class="operate">
        选集<input v-model="num">
        <div class="btn" @click="play">获取</div>
      </div>
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
      listIndex:2,
      num:'32',
      globalStatus:Enum.playStatus.INIT,
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
          name:"rosi",
          url:"https://v.qiexiazai.com/fuckyou-9527/rs{{num}}/index{{index}}.ts"
        },
        {
          name:"约模私拍",
          url:"https://v.qiexiazai.com/fuckyou-9527/wuying{{num}}/8000kb/hls/index{{index}}.ts"
        }
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

    Event.on("stoped", (e)=>{
      Event.globalData.playStatus = 0
      this.play()
    })
  },
  methods:{

    play(){
      if(!this.num){
        alert("请先输入选集")
        return
      }
      
      if(Event.globalData.playStatus == 1){
        Event.emit("status_change", 3)
        return
      }
      let url = this.list[this.listIndex].url.replace("{{num}}", this.num)
      this.player.setTsUrl(url)
      this.player.play()
    }

  }
}
</script>

<style lang="scss">
  //此处scss内图片的相对路径都是以本vue文件为基础的，而不是已scss文件自己为基础
  @import '../scss/index.scss';

</style>
