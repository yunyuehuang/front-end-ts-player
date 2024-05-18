<template>
  <div class="wrap" id="wrap">
    <!-- <div class="title">
      <div class="t1">阿林播放器</div>
      <div class="t2">看剧更轻松</div>
    </div> -->
    <div class="search">
      <input v-model="pageUrl" class="input-url">
      <div class="btn" @click="play(1)"><img src="img/ccs.png">网址获取</div>
    </div>
    <div class="search">
      <input v-model="url" placeholder="xxx.m3u8" class="input-url">
      <div class="btn" @click="play(0)"><img src="img/ccs.png">m3u8获取</div>
    </div>  
    <!-- <div class="operate">
      ts文件正则<input v-model="tsUrl" class="input-url" placeholder="https://xxxxx/xx/{ts}">
      <p class="desc">会将填写内容的{ts}替换为m3u8文件中的ts文件地址</p>
    </div> -->
    <div class="operate">
      <div class="setting">
        <div class="item-input">
          <span class="text">并发数</span>
          <input v-model="threadNum"> 
        </div>
        <div class="item-input">
          <span class="text">超时时长(秒)</span>
          <input v-model="timeOut"> 
        </div>
        <!-- <div class="item-input">
          <span class="text">拼接偏移</span>
          <input v-model="pinOffset"> 
        </div> -->
        <div class="item-input">
          <span class="text">提前量(分)</span>
          <input v-model="preLoadTime"> 
        </div>
        <div class="item-input">
          <span class="text">起始时间(分)</span>
          <input v-model="playBeginTime"> 
        </div>
        <div class="item-input">
          <span class="text">结束时间(分)</span>
          <input v-model="playEndTime"> 
        </div>
        <div class="item-input">
          <span class="text">集数</span>
          <input v-model="section"> 
        </div>


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
        <!-- <div class="mbox loaded">
          <div class="spinner" :style="{'--loaded-left': loadedVideoSlice.cssLeft, '--loaded-left-color': loadedVideoSlice.cssLeftColor, '--loaded-right': loadedVideoSlice.cssRight}">
            <div class="mask"></div>
            <i class="spinner-progress"></i>
          </div>
          <div class="num" >{{loadedVideoSlice.num}}</div>
          <div class="text">已加载</div>
        </div> -->
        <div class="mbox append">
          <div class="spinner" :style="{'--append-left': appendVideoSlice.cssLeft, '--append-left-color': appendVideoSlice.cssLeftColor, '--append-right': appendVideoSlice.cssRight}">
            <div class="mask"></div>
            <i class="spinner-progress"></i>
          </div>
          <div class="num">{{appendVideoSlice.num}}</div>
          <div class="text">已解析</div>
        </div>
      </div>
      <div class="status">
        <div v-for="item in statusBox" :class="item"></div>
      </div>
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
import Req from "@src/player/request.js"

import Store from "../player/store"
export default {
  name: 'App',
  data(){
    return {
      threadNum: 0,
      pinOffset: 0.05,
      pageUrl:'',
      url:'https://cdn.zoubuting.com/20210703/Klgppf2j/hls/index.m3u8',
      tsUrl:'',
      timeOut:10,
      playBeginTime:0,
      playEndTime:0,
      section:0,
      videoSlice:0,
      preLoadTime:0,
      loadedVideoSlice:{
        num:0,
        cssLeft:"rotate(180deg)",
        cssRight:"rotate(-180deg)",
        cssLeftColor:"#edeaff"
      }, //已加载 
      appendVideoSlice:{
        num:0,
        cssLeft:"rotate(180deg)",
        cssRight:"rotate(-180deg)",
        cssLeftColor:"#ebf7f7"
      }, //已解析
      loadingVideoSlice: 0, //加载中
      globalStatus:Enum.playStatus.INIT,
      statusBox: [],
      allSize:0, //内存暂用大小
      player:null
    }
  },

  watch:{
    threadNum: function (val)  {
      Event.config.threadNum = val
      Store.setConfig(this)
    },
    timeOut: function (val)  {
      Event.config.timeOut = val
      Store.setConfig(this)
    },
    preLoadTime: function (val,old)  {
      Event.config.preLoadTime = val
      Store.setConfig(this)
    },
    playBeginTime: function (val)  {
      Event.config.playBeginTime = val
      Store.setConfig(this)
    },
    playEndTime:function (val)  {
      Event.config.playEndTime = val
      Store.setConfig(this)
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
    Store.getConfig(this)

    Event.on("status_change", (e)=>{
      console.log("status_change", e)
      this.globalStatus = e
      Event.globalData.playStatus = e
    })

    Event.on("tsload", (e)=>{ //开始下载片段
      this.$set(this.statusBox, e, 'load');
      this.updateLoading()
    })

    // Event.on("tsloaded", (e)=>{ //下载片段完成
    //   this.$set(this.statusBox, e[1], 'loaded');
    //   this.updateLoading()
    // })

    Event.on("transfered",(e)=>{ //片段转换完成
      this.allSize += e[0].byteLength 
      this.$set(this.statusBox, e[1], 'append')
      this.updateLoading()
    })

    Event.on("play_end",(e)=>{ //播放结束
      if (this.pageUrl != "") {
        this.section ++
        this.play(1)
      }
    })

    let video = this.$refs.video
   
    this.player = new Player()
    this.player.attachHtmlEle(video)
  },
  methods:{

    updateLoading(){
      this.loadingVideoSlice = 0
      this.loadedVideoSlice.num = 0
      this.appendVideoSlice.num = 0
      this.statusBox.map((e)=>{
        if (e == 'load') {
          this.loadingVideoSlice++
        }
        if (e == 'loaded') {
          this.loadedVideoSlice.num ++
          if (this.loadedVideoSlice.num >= this.videoSlice) {
            Event.emit("status_change", Enum.playStatus.COMPLETE)
          }
        }
        if (e == 'append') {
          this.appendVideoSlice.num ++
        }
      })

      this.loadedVideoSlice.num += this.appendVideoSlice.num
      let loadedPer = this.getRowCss(this.loadedVideoSlice.num)
      this.loadedVideoSlice.cssLeft = `rotate(${loadedPer.left}deg)` 
      this.loadedVideoSlice.cssRight = `rotate(${loadedPer.right}deg)` 
      if (loadedPer.right < 0) {
        this.loadedVideoSlice.cssLeftColor = "#edeaff"
      } else {
        this.loadedVideoSlice.cssLeftColor = "#a58dff"
      }
    
      loadedPer = this.getRowCss(this.appendVideoSlice.num)
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
          keyMap.key = await Req.get(this.url.replace(/(\/[^\/]*)$/, '') +"/"+ keyMap.URI)
          Event.globalData.ase = keyMap
          break
        }
      }

      let myURL = new URL(this.url);
      console.log(myURL)
      let urlList = []
      let sliceInfo = []
      this.statusBox = []
      let currentTime = 0
      for (const i in lines) {
        let e = lines[i]
        if (e.indexOf('.ts') > -1) {
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
          this.statusBox.push('init')
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
    debugger
      Event.emit("status_change", Enum.playStatus.LOADING)
      this.player.play()
    },

    async play(type){

      if (type == 1) {
        if(!this.pageUrl){
          alert("请先输入网页地址")
          return
        }
      } else {
        if(!this.url){
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

      Store.setConfig(this)
      Event.globalData.pinOffset = this.pinOffset

      if (type == 0) {
        let data = await Req.get(this.url)
        this.afterGetM3u8(data)
      } else if (type == 1){

        let url = this.pageUrl
        const regex = /\{(\d+)\}/;  
        let matches = regex.exec(this.pageUrl)
        if (matches) {
          let paddingNum = matches[1]
          let section = this.section.toString().padStart(paddingNum, '0')
          url = this.pageUrl.replace(regex, section);
        }

        let data
        try {
          data = await Req.requestUrl(url)
        } catch (error) {
          Event.emit("status_change", Enum.playStatus.INIT)
          alert(error)
          return
        }
        this.url = data.url
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
