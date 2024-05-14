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
        <div class="item-input">
          <span class="text">拼接偏移</span>
          <input v-model="pinOffset"> 
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
          <span class="text">section</span>
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
        <div class="mbox load">
          <div class="spinner">
          
          </div>
          <div class="num">{{loadingVideoSlice}}</div>
          <div class="text">加载中</div>
        </div>
        <div class="mbox loaded">
          <div class="spinner" :style="{'--loaded-left': loadedVideoSlice.cssLeft, '--loaded-left-color': loadedVideoSlice.cssLeftColor, '--loaded-right': loadedVideoSlice.cssRight}">
            <div class="mask"></div>
            <i class="spinner-progress"></i>
          </div>
          <div class="num" >{{loadedVideoSlice.num}}</div>
          <div class="text">已加载</div>
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
      playEndTime:0,
      section:0,
      videoSlice:0,
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
      this.updateLoading()
    })

    Event.on("play_end",(e)=>{
      if (this.pageUrl != "") {
        this.section ++
        this.play(1)
      }
    })
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
          this.loadedVideoSlice.num++
        }
        if (e == 'append') {
          this.appendVideoSlice.num++
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

    afterGetM3u8(data){
      let myURL = new URL(this.url);
      console.log(myURL)
      let urlList = []
      let lengthList = []
      let arr = data.split("\n")
      this.statusBox = []
      for (const i in arr) {
        let e = arr[i]
        if (e.indexOf('METHOD=') > -1) {
          alert("暂时无法播放加密视频 " + e)
          Event.emit("status_change", Enum.playStatus.INIT)
          return
        }
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
          lengthList.push(Number(match[0]))
        }
      }

      let time = lengthList[0]
      if (this.playBeginTime > 0) {
        while(this.playBeginTime*60 > time){ //设置了起始时间后，需要跳过的片段
          this.statusBox.shift();
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
      this.player.videoTime = 0
      lengthList.map((v)=>{
        this.player.videoTime += v
      })

      Event.globalData.lengthList = lengthList
      this.videoSlice = urlList.length
      
      this.player.setTsUrls(urlList)
      this.player.setLoaderConfig({
        threadNum: this.threadNum,
        timeOut: this.timeOut
      })
      Event.emit("status_change", Enum.playStatus.LOADING)
      this.player.play()
    },

    play(type){

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
        $.get(this.url, this.afterGetM3u8)
      } else if (type == 1){

        let url = this.pageUrl
        const regex = /\{(\d+)\}/;  
        let matches = regex.exec(this.pageUrl)
        if (matches) {
          let paddingNum = matches[1]
          let section = this.section.toString().padStart(paddingNum, '0')
          url = this.pageUrl.replace(regex, section);
        }
        $.ajax({  
        url: 'http://129.204.63.215:11200/m3u8',  // 请求的 URL  
        type: 'POST',                          // 请求方法，如 GET、POST 等  
        dataType: 'json',                     // 期望的响应数据类型，如 json、xml、html 等  
        data: {                              // 发送到服务器的数据  
            url: url,  
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
