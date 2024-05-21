<template>
  <div class="wrap" id="wrap">
    <!-- <div class="title">
      <div class="t1">阿林播放器</div>
      <div class="t2">看剧更轻松</div>
    </div> -->
    <div class="search">
      <input v-model="config.pageUrl" class="input-url">
      <div class="btn" @click="play(1)">
        <el-popover
          placement="top-start"
          title="网址说明"
          width="500"
          trigger="hover"
          content="http://xxx-{2}.html 会自动将{2}替换为具体的集数。{2}中的2表示数字最少有2位数位，当填写集数1时，会补0，变为01，使其达到两位数，最终结果是http://xxx-01.html">
          <i slot="reference" class="el-icon-question"></i>
    
        </el-popover>
        &nbsp;网址获取</div>
    
    </div>

    <div class="search">
      <input v-model="config.url" placeholder="xxx.m3u8" class="input-url">
      <div class="btn" @click="play(0)"><img src="img/ccs.png">m3u8获取</div>
    </div>  

    <div class="operate">
      <div class="setting">
        <div class="item-input">
          <span class="text">集数</span>
          <input v-model="config.section"> 
        </div>
        <div class="item-input">
          <span class="text">自动连播</span>
          <div class="obj"> <el-switch v-model="config.autoPlayNext"></el-switch></div>
         
        </div>
        <div class="item-input">
          <span class="text">起始时间(分)</span>
          <input v-model="config.playBeginTime"> 
        </div>
        <div class="item-input">
          <span class="text">结束时间(分)</span>
          <input v-model="config.playEndTime"> 
        </div>
        <div class="item-input">
          <span class="text">提前量(分)</span>
          <input v-model="config.preLoadTime"> 
        </div>

        <div class="item-input">
          <span class="text">超时时长(秒)</span>
          <input v-model="config.timeOut"> 
        </div>
        <div class="item-input">
          <span class="text">并发数</span>
          <input v-model="config.threadNum"> 
        </div>
        <!-- <div class="item-input">
          <span class="text">拼接偏移</span>
          <input v-model="pinOffset"> 
        </div> -->
      </div>
      <div class="mbox-wrap">
        <div class="mbox">
          <div class="spinner" :class="globalStatusStr == '下载中' ? 'red' : ''">
            
          </div>
          <div class="num">{{globalStatusStr}}</div>
          <div class="text">状态</div>
        </div>
        <div class="mbox all">
          <div class="spinner">
          </div>
          <div class="num">{{videoSlice}}</div>
          <div class="text">总片段</div>
        </div>
        <div class="mbox all">
          <div class="spinner">
          </div>
          <div class="num" v-html="allSizeStr"></div>
          <div class="text">内存</div>
        </div>
        <div class="mbox load">
          <div class="spinner">
          
          </div>
          <div class="num">{{loadingVideoSlice}}</div>
          <div class="text">加载中</div>
        </div>
        <div class="mbox append">
          <div class="spinner" :style="{'--append-left': appendVideoSlice.cssLeft, '--append-left-color': appendVideoSlice.cssLeftColor, '--append-right': appendVideoSlice.cssRight}">
            <div class="mask"></div>
            <i class="spinner-progress"></i>
          </div>
          <div class="num">{{appendVideoSlice.num}}</div>
          <div class="text">已解析</div>
        </div>
      </div>
    
    </div>
    <div id="video-wrapper">
      <video controls ref="video"></video>
      <playbar ref="bar"></playbar>
    </div>

  </div>
</template>

<script>
import Event from "../player/event.js"
import Enum from "../player/enum.js"
import Player from "@src/player/player.js"
import Req from "@src/player/request.js"
import Store from "../player/store"
import playbar from "./playbar.vue"

export default {
  name: 'App',
  components: {  
    playbar  
  },  
  data(){
    return {
      config:Event.config,
      videoSlice:0,
      appendVideoSlice:{
        num:0,
        cssLeft:"rotate(180deg)",
        cssRight:"rotate(-180deg)",
        cssLeftColor:"#ebf7f7"
      }, //已解析
      loadingVideoSlice: 0, //加载中的数量
      globalStatus:Enum.playStatus.INIT,
      allSize:0, //内存占用大小
      player:null,
    }
  },

  watch:{
    config:{ 
      handler: function (newValue, oldValue) {
        Store.setConfig(this.config)
      },
      deep: true 
    },
  },
  computed: {
    globalStatusStr: function () {
      return Enum.playStatusStr[this.globalStatus]
    },
    allSizeStr: function(){
      let bytes = this.allSize
      if (bytes === 0) return '0B';  
      const units = ['B', 'KB', 'MB', 'GB', 'TB'];  
      let u = 0;  
      while (bytes >= 1024 && u < units.length - 1) {  
        bytes /= 1024;  
        ++u;  
      }
      return `${bytes.toFixed(2)}${units[u]}`; 
    }
    
  },
  mounted(){
    Store.getConfig(this.config)

    Event.on("status_change", (e)=>{
      console.log("status_change", e)
      this.globalStatus = e
      Event.globalData.playStatus = e
    })

    Event.on("tsload", (e)=>{ //开始下载片段
      this.$refs.bar.updateLoading();
      this.updateLoading()
    })
    Event.on("transfered",(e)=>{ //片段转换完成
      this.allSize += e[0].byteLength 
      this.$refs.bar.updateLoading();
      this.updateLoading()
    })
    Event.on("tsload_err", (e)=>{ //下载片段完成
      this.$refs.bar.updateLoading();
      this.updateLoading()
    })

    Event.on("play_end",(e)=>{ //播放结束
      if (this.config.pageUrl != "") {
        this.config.section ++
        this.play(1)
      }
    })

    let video = this.$refs.video
   
    this.player = new Player()
    Event.globalData.player = this.player
    this.player.attachHtmlEle(video)
  },
  methods:{
    updateLoading(){
      this.loadingVideoSlice = 0
      this.appendVideoSlice.num = 0
    
      for (let i = 0; i < Event.globalData.sliceInfo.length; i++) {
        let slice = Event.globalData.sliceInfo[i]
        if (slice.loadStatus == 1) { //下载中
          this.loadingVideoSlice++
        } else if (slice.loadStatus == 2) { //下载完成
          this.appendVideoSlice.num ++
          if (this.appendVideoSlice.num >= this.videoSlice) {
            Event.emit("status_change", Enum.playStatus.COMPLETE)
          }
    
        }
      }
     
      let loadedPer = this.getRowCss(this.appendVideoSlice.num)
      this.appendVideoSlice.cssLeft = `rotate(${loadedPer.left}deg)` 
      this.appendVideoSlice.cssRight = `rotate(${loadedPer.right}deg)` 
      if (loadedPer.right < 0) {
        this.appendVideoSlice.cssLeftColor = "#ebf7f7"
      } else {
        this.appendVideoSlice.cssLeftColor = "#48d1ca"
      }
    },


    getRowCss(num){
      let per = num / this.videoSlice
      let res = {left:0, right:0}
      if (per <= 0.5) {
        res.right = -180 + Math.ceil(180 * (per / 0.5))
        res.left=180
      } else {
        res.right = 0
        let j = per - 0.5
        res.left = Math.ceil(180 * (j / 0.5))
      }
      return res
    },

    async afterGetM3u8(data){
      Event.globalData.ase = null
      let lines = data.split("\n")
      for (const i in lines) {
        let e = lines[i]
        if (e.indexOf('METHOD=') > -1) {
          let keyMap = Req.getKeyMap(e)
          keyMap.key = await Req.get(this.config.url.replace(/(\/[^\/]*)$/, '') +"/"+ keyMap.URI)
          Event.globalData.ase = keyMap
          break
        }
      }

      let myURL = new URL(this.config.url);
      let urlList = []
      let sliceInfo = []

      let currentTime = 0
      for (const i in lines) {
        let e = lines[i]
        if (e.indexOf('.ts') > -1) {
          let url
          if (e.indexOf('http') > -1) {
            url = e
          } else {
            url = `${myURL.origin}/${e}`
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
          let time = Number(match[0])
         
          sliceInfo.push({
            sTime:currentTime,
            eTime:currentTime+time,
            loadStatus:0
          })
          currentTime += time
        }
      }

      for (const i in sliceInfo) {
        sliceInfo[i].url = urlList[i]
      }

      Event.globalData.sliceInfo = sliceInfo
      this.videoSlice = sliceInfo.length
      
      this.player.videoTime = currentTime
      this.allSize = 0
      Event.emit("status_change", Enum.playStatus.LOADING)
      this.player.play()
    },

    async play(type){

      if (type == 1) {
        if(!this.config.pageUrl){
          alert("请先输入网页地址")
          return
        }
      } else {
        if(!this.config.url){
          alert("请先输入m3u8地址")
          return
        }
      }
      
      if(Event.globalData.playStatus == Enum.playStatus.PASEING){
        alert("正在解析中")
        return
      }

      if (location.href.indexOf("https") > -1) {
        alert("请使用http访问")
        return
      }

      Event.emit("status_change", Enum.playStatus.PASEING)

      Store.setConfig(this.config)
      Event.globalData.pinOffset = this.pinOffset

      if (type == 0) {
        let data = await Req.get(this.config.url)
        this.afterGetM3u8(data)
      } else if (type == 1){

        let url = this.config.pageUrl
        const regex = /\{(\d+)\}/;  
        let matches = regex.exec(this.config.pageUrl)
        if (matches) {
          let paddingNum = matches[1]
          let section = this.config.section.toString().padStart(paddingNum, '0')
          url = this.config.pageUrl.replace(regex, section);
        }

        let data
        try {
          data = await Req.requestUrl(url)
        } catch (error) {
          Event.emit("status_change", Enum.playStatus.INIT)
          alert(error)
          return
        }
        this.config.url = data.url
        this.afterGetM3u8(data.data)
      }
    }
  }
}
</script>

<style lang="less">
  //此处scss内图片的相对路径都是以本vue文件为基础的，而不是以scss文件自己为基础
  @import '../scss/index.less';

</style>
