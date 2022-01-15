<!--
 * @Author: yucheng
 * @Date: 2022-01-15 15:38:39
 * @LastEditTime: 2022-01-15 18:11:21
 * @LastEditors: yucheng
 * @Description: ...
-->
<template>
  <div>
    {{ msg }}
  </div>
</template>

<script>
export default {
  name: 'Options',
  data() {
    return {
      msg: null,
      port: null
    };
  },
  mounted() {
    const that = this;
    this.chrome = chrome;
    this.log(chrome.devtools, chrome.extension, '---------');

    chrome.devtools.panels.create(
      'yucheng-pannel',
      'FontPicker.png',
      'devtools.html',
      function (panel) {
        panel.onShown.addListener((window) => {
          that.log('show');
          const port = chrome.runtime.connect({
            name: 'panel'
          });
          that.port = port;
          port.postMessage({
            name: 'from -> devtools, init',
            tabId: chrome.devtools.inspectedWindow.tabId
          });
          port.onMessage.addListener(function (request) {
            that.log(request, 'request');
          });
        });
        panel.onHidden.addListener((window) => {
          console.log('onHidden');
        });
        panel.onSearch.addListener((widnow) => {
          console.log('search');
        });
        // 创建自定义侧边栏
        chrome.devtools.panels.elements.createSidebarPane(
          'look',
          function (sidebar) {
            // sidebar.setPage('../sidebar.html'); // 指定加载某个页面
            sidebar.setExpression(
              'document.querySelectorAll("img")',
              'All Images'
            ); // 通过表达式来指定
            //sidebar.setObject({aaa: 111, bbb: 'Hello World!'}); // 直接设置显示某个对象
          }
        );
      }
    );
    chrome.devtools.network.onRequestFinished.addListener((res) => {
      that.log(
        'onRequestFinished----',
        res.request,
        res.response,
        'onRequestFinished-----------'
      );
      if (!that.port) return;
      that.port.postMessage({
        name: 'from -> devtools',
        tabId: chrome.devtools.inspectedWindow.tabId,
        ...res
      });
    });
    // chrome.devtools.network.onFinished.addListener((res) => {
    //   that.log(
    //     'onFinished----',
    //     // res.request,
    //     // res.response,
    //     this,
    //     that,
    //     'onFinished-----------'
    //   );
    // });
  },
  methods: {
    log(...msg) {
      this.msg = msg;
      chrome.devtools.inspectedWindow.eval('console.log(' + msg + ')');
    }
  }
};
</script>