<template>
  <div class="status-wrap">
    <div class="status"   @mousemove="updateTooltipPosition"  
      @mouseleave="hideTooltip" @click="clickBar" >
      <div v-for="item in loadingBox" class="child" :class="item.classType" :style="'width:'+item.width+'px;left:'+item.left+'px;'"></div>
      <div v-for="item in appendBox" class="child" :class="item.classType" :style="'width:'+item.width+'px;left:'+item.left+'px;'"></div>
      <div v-for="item in errorBox" class="child" :class="item.classType" :style="'width:'+item.width+'px;left:'+item.left+'px;'"></div>
    
    </div>
    <div class="current" :style="'left:'+currentTimeBox.left+'px;'"></div>
    <div  
      class="tooltip"  
      v-show="isTooltipVisible"  
      :style="{ top: tooltipTop + 'px', left: tooltipLeft + 'px' }"  
    >  
      {{nowTime}}
    </div>  
  </div>
</template>

<script>
import Event from "../player/event.js"
import Enum from "../player/enum.js"
import Tool from "../player/tool.js"

export default {
  name:"playbar",
  data(){
    return {
      isTooltipVisible:false,
      tooltipTop:0,
      tooltipLeft:0,
      nowTime:'00:00:00',
      loadingBox:[],
      appendBox:[],
      errorBox:[],
      currentTimeBox:{
        left:0,
        show:false
      }
    }
  },
  mounted(){
    Event.on("currentTime", (e)=>{
      let bi = 670 / Event.globalData.player.videoTime
      this.currentTimeBox.left = e * bi-1
    })
  },
  methods:{
    updateTooltipPosition(event) {  
      if (Event.globalData.player.videoTime == 0) {
        return
      }

      let target = event.target
      if (event.target.classList.contains('child')) {  
        target = event.target.parentNode
      }

      this.isTooltipVisible = true;  
      // 获取触发元素的边界和窗口的滚动位置  
      const rect = target.getBoundingClientRect();  
      const x = event.clientX;  
      const y = rect.top;  
  
      // 这里你可能需要调整位置，以确保 tooltip 不会超出触发元素或窗口边界  
      // 这里只是一个简单的例子，将 tooltip 放在鼠标指针的下方和右侧  
      this.tooltipTop = y + 20; // 20px 的偏移量  
      this.tooltipLeft = x + 20; // 20px 的偏移量  

      let bi = 670 / Event.globalData.player.videoTime
      this.nowTime = Tool.formatSeconds((x - rect.left)/bi)

      // 你可能还需要考虑窗口的滚动位置，这里简化处理  
      // this.tooltipTop += window.pageYOffset || document.documentElement.scrollTop;  
      // this.tooltipLeft += window.pageXOffset || document.documentElement.scrollLeft;  
    },  
    clickBar(event) {
      if (Event.globalData.player.videoTime == 0) {
        return
      }
      let target = event.target
      if (event.target.classList.contains('child')) {  //子元素冒泡的，先获取到父元素
        target = event.target.parentNode
      }
      const rect = target.getBoundingClientRect();  
      let bi = 670 / Event.globalData.player.videoTime
      let time = Math.ceil((event.clientX - rect.left)/ bi)
      Event.globalData.player.htmlEle.currentTime = time + 0.1
    },
    hideTooltip() {  
      this.isTooltipVisible = false;  
    },  
    setPos(obj) {
      let bi = 670 / Event.globalData.player.videoTime
      obj.left = obj.sTime * bi
      obj.width =  (obj.eTime -obj.sTime) * bi
    },
    updateLoading(){
      let loadingBox = []
      let appendBox = []
      let errorBox = []

      let loadingObj = null
      let appendObj = null
      let errorObj = null

      for (let i = 0; i < Event.globalData.sliceInfo.length; i++) {
        let slice = Event.globalData.sliceInfo[i]
        if (slice.loadStatus == 1) { //下载中
          if (!loadingObj || loadingObj.index != i) { //开辟一个新的块
            if (loadingObj) {
              this.setPos(loadingObj)
              loadingBox.push(loadingObj)
            }

            loadingObj = {
              classType: 'load',
              index : i+1,
              sTime : slice.sTime,
              eTime : slice.eTime
            }
          } else { //相连的块，直接修改obj的结束时间
            loadingObj.eTime = slice.eTime
            loadingObj.index = i+1
          }
        } else if (slice.loadStatus == 2) { //下载完成
          if (appendObj && appendObj.index == i) { //相连的块，直接修改obj的结束时间
            appendObj.eTime = slice.eTime
            appendObj.index = i+1
          } else { //开辟一个新的块
            if (appendObj) {
              this.setPos(appendObj)
              appendBox.push(appendObj)
            }
            appendObj = {
              classType: 'append',
              index : i+1,
              sTime : slice.sTime,
              eTime : slice.eTime
            }
          }
        } else if (slice.loadStatus == 3) { //下载错误
          if (!errorObj || errorObj.index != i) { //开辟一个新的块
            if (errorObj) {
              this.setPos(errorObj)
              errorBox.push(errorObj)
            }

            errorObj = {
              classType: 'error',
              index: i+1,
              sTime: slice.sTime,
              eTime: slice.eTime
            }
          } else { //相连的块，直接修改obj的结束时间
            errorObj.eTime = slice.eTime
            errorObj.index = i+1
          }
        }
      }
      if (loadingObj) {
        this.setPos(loadingObj)
        loadingBox.push(loadingObj)
      }
      if (appendObj) {
        this.setPos(appendObj)
        appendBox.push(appendObj)
      }
      if (errorObj) {
        this.setPos(errorObj)
        errorBox.push(errorObj)
      }

      this.loadingBox = loadingBox
      this.appendBox = appendBox
      this.errorBox = errorBox
    },
  }
}
</script>