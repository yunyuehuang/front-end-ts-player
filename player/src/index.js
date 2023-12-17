
import $ from "jquery"

window.jQuery = $;

import App from "./page/index.vue"

import Vue from 'vue'
window.app =  new Vue({
  el: '#app',
  render: h => h(App)
})