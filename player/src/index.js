
import $ from "jquery"

window.jQuery = $;

import App from "./page/index.vue"

import Vue from 'vue'
import { Switch, Popover, Icon } from 'element-ui';
import 'element-ui/lib/theme-chalk/index.css';
Vue.use(Popover)
Vue.use(Icon)
Vue.use(Switch)


window.app =  new Vue({
  el: '#app',
  render: h => h(App)
})