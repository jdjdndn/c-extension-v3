<!--
 * @Author: yucheng
 * @Date: 2022-05-27 23:19:34
 * @LastEditTime: 2022-07-17 11:56:24
 * @LastEditors: yucheng
 * @Description: 
-->
<template>
  <div>
    <ul>
      <li v-for="item in historyList" :key="item.lastVisitTime">
        <a :href="item.url" :title="item.title"> {{ item.title }}</a>
      </li>
    </ul>
  </div>
</template>

<script>
import { mouseClick, chalk } from "../../modules/common";
export default {
  name: "newtab",
  data() {
    return {
      historyList: [],
    };
  },
  computed: {},
  mounted() {
    const that = this;
    chrome.storage.local.get(null, function(result) {
      mouseClick(result, window);
    });

    chrome.storage.local.get(["historyObj"], function(result) {
      console.log("Value is set to ", result);
    });

    chrome.history.onVisited.addListener((res) => {
      const { lastVisitTime, visitCount, url, title } = res;
      if (that.historyList.filter((it) => it.url === url)) return false;
      that.historyList.push({ lastVisitTime, visitCount, url, title });
      chalk(that.historyList);
    });

    chrome.bookmarks.getTree((nodeTree) => {
      chalk(nodeTree, "nodeTree");
      // const list = treeToList(nodeTree);
      // const obj = {};
      // list.forEach((item) => {
      //   obj[item.url] = item;
      // });
      // const newList = [];
      // for (const k in obj) {
      //   newList.push(obj[k]);
      // }
      // chalk(newList, "newList");
    });
  },
  methods: {},
};
</script>

<style>
ul,
li {
  list-style: none;
}
</style>
