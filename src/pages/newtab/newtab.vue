<!--
 * @Author: yucheng
 * @Date: 2022-05-27 23:19:34
 * @LastEditTime: 2022-05-28 11:44:36
 * @LastEditors: yucheng
 * @Description: 
-->
<template>
  <div>
    <ul>
      <li v-for="item in historyList" :key="item.lastVisitTime">
        <a :href="item.url"> {{ item.title }}</a>
      </li>
    </ul>
  </div>
</template>

<script>
import { mouseClick, chalk } from '../../modules/common';
export default {
  name: 'newtab',
  data() {
    return {
      historyList: []
    };
  },
  computed: {},
  mounted() {
    const that = this;
    chrome.storage.sync.get(null, function (result) {
      mouseClick(result, window);
    });
    chrome.history.onVisited.addListener((res) => {
      const { lastVisitTime, visitCount, url, title } = res;
      if (that.historyList.filter((it) => it.url === url)) return false;
      that.historyList.push({ lastVisitTime, visitCount, url, title });
      chalk(that.historyList);
    });
  },
  methods: {}
};
</script>

<style>
ul,
li {
  list-style: none;
}
</style>