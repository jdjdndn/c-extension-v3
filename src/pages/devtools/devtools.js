/*
 * @Author: yucheng
 * @Date: 2022-01-15 15:38:39
 * @LastEditTime: 2022-01-15 15:39:25
 * @LastEditors: yucheng
 * @Description: 
 */
import Vue from "vue";
import Devtools from "./Devtools.vue";
// import router from "./router";

new Vue({
  // router,
  render: (h) => h(Devtools),
}).$mount("#devtools");