
import $ from "jquery"

window.jQuery = $;

import App from "./page/index.vue"

import Vue from 'vue'

if (location.href.indexOf("https") > -1) {
  location.replace(location.href.replace('https', 'http'))
}

window.app =  new Vue({
  el: '#app',
  render: h => h(App)
})