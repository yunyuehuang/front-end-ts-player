
import $ from "jquery"

window.jQuery = $;

import App from "./page/index.vue"

import Vue from 'vue'
import ElementUI from 'element-ui';
import 'element-ui/lib/theme-chalk/index.css';


Vue.use(ElementUI);

window.app =  new Vue({
  el: '#app',
  render: h => h(App)
})