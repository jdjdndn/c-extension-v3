<!--
 * @Author: yucheng
 * @Date: 2022-01-15 15:38:39
 * @LastEditTime: 2022-01-15 18:11:21
 * @LastEditors: yucheng
 * @Description: ...
-->
<template>
  <div>
    <!-- {{ res }} -->
    <div>connection:{{ res.connection }}</div>
    <div>
      request
      <ul>
        <li v-for="item in requestKeys" :key="item">
          {{ item }}:{{ res.request[item] }}
        </li>
      </ul>
    </div>
    <div>
      response
      <ul>
        <li v-for="item in responseKeys" :key="item">
          {{ item }}:{{ res.response[item] }}
        </li>
      </ul>
    </div>
    <div>time:{{ res.time }}</div>
    <div>_resourceType: {{ res._resourceType }}</div>
  </div>
</template>

<script>
export default {
  name: 'Options',
  data() {
    return {
      res: null,
      port: null
    };
  },
  computed: {
    requestKeys({ res }) {
      return Object.keys(res.request);
    },
    responseKeys({ res }) {
      return Object.keys(res.response);
    }
  },
  mounted() {
    const that = this;
    this.chrome = chrome;
    // this.log(chrome.devtools, chrome.extension, '---------');

    chrome.devtools.panels.create(
      'yucheng-pannel',
      'FontPicker.png',
      'devtools.html',
      function (panel) {
        const port = chrome.runtime.connect({
          name: 'panel'
        });
        that.port = port;
        // port.postMessage({
        //   name: 'from devtools',
        //   tabId: chrome.devtools.inspectedWindow.tabId
        // });
        port.onMessage.addListener(function (request) {
          console.log(request);
        });
        // panel.onShown.addListener((window) => {
        //   that.log('show');
        //   const port = chrome.runtime.connect({
        //     name: 'panel'
        //   });
        //   that.port = port;
        //   port.postMessage({
        //     name: 'from devtools',
        //     tabId: chrome.devtools.inspectedWindow.tabId
        //   });
        //   port.onMessage.addListener(function (request) {
        //     that.log(request, 'request');
        //   });
        // });
        // panel.onHidden.addListener((window) => {
        //   console.log('onHidden');
        // });
        // panel.onSearch.addListener((widnow) => {
        //   console.log('search');
        // });
        // // 创建自定义侧边栏
        // chrome.devtools.panels.elements.createSidebarPane(
        //   'look',
        //   function (sidebar) {
        //     // sidebar.setPage('../sidebar.html'); // 指定加载某个页面
        //     sidebar.setExpression(
        //       'document.querySelectorAll("img")',
        //       'All Images'
        //     ); // 通过表达式来指定
        //     //sidebar.setObject({aaa: 111, bbb: 'Hello World!'}); // 直接设置显示某个对象
        //   }
        // );
      }
    );
    chrome.devtools.network.onRequestFinished.addListener((res) => {
      that.log(res);
      if (!that.port) return;
      that.postMessage({
        type: 'request',
        res
      });
    });
    // chrome.devtools.network.onFinished.addListener((res) => {
    //   that.log(res);
    //   that.postMessage({
    //     type: 'response',
    //     res
    //   });
    // });
    chrome.devtools.network.getHAR((res) => {
      that.postMessage({
        type: 'getHAR',
        res
      });
    });
  },
  methods: {
    log(res) {
      this.res = res;
      // chrome.devtools.inspectedWindow.eval('console.log(' + msg + ')');
    },
    postMessage(data) {
      const { port } = this;
      if (!port) return;
      port.postMessage({
        name: 'from devtools',
        data
      });
    }
  }
};
</script>

<style>
ul,
li {
  list-style: none;
}
</style>