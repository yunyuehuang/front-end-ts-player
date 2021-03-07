
import "./aa.scss"
import "./bb.css"

import $ from "jquery"

window.jQuery = $;
import "./zyupload-1.0.0.min.js"
import App from "./page/index.vue"


import Vue from 'vue'
window.app =  new Vue({
  el: '#app',
  render: h => h(App)
})