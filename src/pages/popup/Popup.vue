<!--
 * @Author: yucheng
 * @Date: 2021-08-31 08:23:13
 * @LastEditTime: 2022-04-03 14:02:11
 * @LastEditors: yucheng
 * @Description: ...
-->
<template>
  <div ref="popup" class="popup">
    <h1>{{ host }}---{{ msg }}</h1>
    <!-- 开启选中元素描边 -->
    <div class="popup-item">
      1、开启选中元素描边
      <label for="a" @click="changeEleCssText(true)"
        >开<input
          id="a"
          type="radio"
          name="a"
          :value="true"
          v-model="allDataObj.changeEleMiaoBian"
      /></label>
      <label for="b" @click="changeEleCssText()"
        >关<input
          id="b"
          type="radio"
          name="a"
          :value="false"
          v-model="allDataObj.changeEleMiaoBian"
      /></label>
    </div>
    <div class="popup-item">
      2、开启debug
      <label for="c" @click="changeDebug(true)"
        >开<input
          id="c"
          type="radio"
          name="c"
          :value="true"
          v-model="allDataObj.debug"
      /></label>
      <label for="d" @click="changeDebug()"
        >关<input
          id="d"
          type="radio"
          name="c"
          :value="false"
          v-model="allDataObj.debug"
      /></label>
    </div>
    <!-- 不跳转列表 -->
    <div class="popup-item">
      3、不跳转列表
      <textarea
        name=""
        id=""
        cols="50"
        rows="3"
        :value="allDataObj.noChangeHrefList"
        @blur="noChangeHrefListBlur"
      ></textarea>
    </div>
    <div class="popup-item">
      4、记录报错列表(host为ip地址的自动添加)
      <textarea
        name=""
        id=""
        cols="50"
        rows="3"
        :value="allDataObj.recordErrorList"
        @blur="recordErrorBlur"
        @keyup="recordErrorKeyup"
      ></textarea>
    </div>
    <div class="popup-item">
      5、视频播放速度
      <!-- <input type="text" :value="videoPlayRate" @blur="videoPlayRateBlur" /> -->
      <select name="select" @change="videoPlayRateChange">
        <option
          :label="item.videoPlayRate"
          :value="item.videoPlayRate"
          :selected="item.videoPlayRate === allDataObj.videoPlayRate"
          v-for="(item, i) in allDataObj.videoPlayRateList"
          :key="i"
        ></option>
      </select>
    </div>
    <div class="popup-item">
      6、缓存清理（日）
      <select name="select" @change="clearTimeChange">
        <option
          :label="item"
          :value="item"
          :selected="item === allDataObj.clearTime"
          v-for="(item, i) in allDataObj.clearTimeList"
          :key="i"
        ></option>
      </select>
    </div>
    <!-- 7、iframe
      <iframe src="./options.html" frameborder="0"></iframe> -->
    <div class="popup-item">
      7、开启翻译
      <label for="e" @click="changeFanyi(true)"
        >开<input
          id="e"
          type="radio"
          name="e"
          :value="true"
          v-model="allDataObj.fanyiFlag"
      /></label>
      <label for="f" @click="changeFanyi(false)"
        >关<input
          id="f"
          type="radio"
          name="e"
          :value="false"
          v-model="allDataObj.fanyiFlag"
      /></label>
    </div>
    <div class="popup-item">
      8、开启链接收集
      <label for="g" @click="collectInfo(true)"
        >开<input
          id="g"
          type="radio"
          name="g"
          :value="true"
          v-model="allDataObj.collectInfoFlag"
      /></label>
      <label for="h" @click="collectInfo(false)"
        >关<input
          id="h"
          type="radio"
          name="g"
          :value="false"
          v-model="allDataObj.collectInfoFlag"
      /></label>
    </div>
    <div class="popup-item">
      9、新页面开链接
      <label for="i" @click="openNewPage(true)"
        >开<input
          id="i"
          type="radio"
          name="i"
          :value="true"
          v-model="allDataObj.openNewPageFlag"
      /></label>
      <label for="j" @click="openNewPage(false)"
        >关<input
          id="j"
          type="radio"
          name="i"
          :value="false"
          v-model="allDataObj.openNewPageFlag"
      /></label>
    </div>
    <!-- 不跳转链接列表 -->
    <div class="popup-item">
      10、不在新页面打开链接列表（生效需刷新）
      <textarea
        name=""
        id=""
        cols="50"
        rows="3"
        :value="allDataObj.noOpenLinkList"
        @blur="noOpenLinkListBlur"
      ></textarea>
    </div>
    <div class="popup-item">
      11、默认auxclick与click不同时触发（切换需刷新）
      <label for="l" @click="changeAuxclickOnly(true)"
        >开<input
          id="l"
          type="radio"
          name="k"
          :value="true"
          v-model="allDataObj.auxclickOnly"
      /></label>
      <label for="k" @click="changeAuxclickOnly(false)"
        >关<input
          id="k"
          type="radio"
          name="k"
          :value="false"
          v-model="allDataObj.auxclickOnly"
      /></label>
    </div>
    <!-- <button @click="openBackground">打开popup页面</button> -->
  </div>
</template>

<script>
import {
  mouseClick,
  defaultparams,
  commonDefault,
  unDef
} from '../../modules/common';
export default {
  data() {
    return {
      msg: 'Welcome!--popup',
      host: '',
      allDataObj: {},
      configParamsBacket: {}
    };
  },
  created() {
    const newCommonDefault = JSON.parse(JSON.stringify(commonDefault));
    const newDefaultParams = JSON.parse(JSON.stringify(defaultparams));
    for (const k in newCommonDefault) {
      this.allDataObj[k] = newCommonDefault[k];
    }
    for (const k in newDefaultParams) {
      this.allDataObj[k] = newDefaultParams[k];
    }
  },
  mounted() {
    const { getAndSetParams } = this;
    getAndSetParams();
  },
  methods: {
    // 10
    noOpenLinkListBlur(e) {
      const { host, allDataObj, saveAndSend } = this;
      const { mapInfo } = allDataObj;
      if (!mapInfo || !mapInfo[host]) return false;
      const noOpenLinkList = this.replaceComma(e.target.value);
      mapInfo[host].noOpenLinkList = noOpenLinkList;
      this.saveAndSend({ mapInfo });
    },
    changeAuxclickOnly(auxclickOnly = commonDefault.auxclickOnly) {
      this.commonSetRadioParams(auxclickOnly, 'auxclickOnly');
    },
    openNewPage(openNewPageFlag = true) {
      const { host, allDataObj, saveAndSend } = this;
      const { mapInfo } = allDataObj;
      if (!mapInfo || !mapInfo[host]) return false;
      allDataObj.openNewPageFlag = openNewPageFlag;
      mapInfo[host].openNewPageFlag = openNewPageFlag;
      console.log(mapInfo[host], 'openflag', openNewPageFlag);
      saveAndSend({ mapInfo });
    },
    collectInfo(collectInfoFlag = commonDefault.collectInfoFlag) {
      const { host, allDataObj, saveAndSend } = this;
      const { mapInfo } = allDataObj;
      if (!mapInfo || !mapInfo[host]) return false;
      allDataObj.collectInfoFlag = collectInfoFlag;
      mapInfo[host].collectInfoFlag = collectInfoFlag;
      saveAndSend({ mapInfo });
    },
    // 开启翻译
    changeFanyi(fanyiFlag = commonDefault.fanyiFlag) {
      const { host, allDataObj, saveAndSend } = this;
      const { mapInfo } = allDataObj;
      if (!mapInfo || !mapInfo[host]) return false;
      allDataObj.fanyiFlag = fanyiFlag;
      mapInfo[host].fanyiFlag = fanyiFlag;
      saveAndSend({ mapInfo });
    },
    // 设置单选框的公共方法
    commonSetRadioParams(flag, type) {
      const { host, allDataObj, saveAndSend } = this;
      const { mapInfo } = allDataObj;
      if (!mapInfo || !mapInfo[host]) return false;
      allDataObj[type] = flag;
      mapInfo[host][type] = flag;
      saveAndSend({ mapInfo });
    },
    start() {
      const that = this;
      chrome.windows.getAll({ populate: true }, function (windowList) {
        const thisWindow = windowList
          .find((window) => window.focused)
          .tabs.find((it) => it.active);
        that.host = new URL(thisWindow.url).host;
        // console.log('windowList', thisWindow, that.host);
      });
    },
    // 设置content.js中的list列表
    setConfigMap() {},
    // 缓存清理时间切换
    clearTimeChange(e) {
      this.allDataObj.clearTime = Number(e.target.value);
      const { clearTime } = this.allDataObj;
      this.saveAndSend({ clearTime });
    },
    // 获取配置参数之后做点事情
    afterGetConfigParams(result) {
      this.start();
      mouseClick(result);
      this.sendMessage2(result);
    },
    // 获取storage并设置参数
    getAndSetParams() {
      let that = this;
      // 获取配置参数
      chrome.storage.sync.get(null, function (result) {
        that.allDataObj = { ...that.allDataObj, ...result };
        console.log('看看获取的参数', result, that.allDataObj);
        if (!result) return false;
        that.configParamsBacket = JSON.parse(JSON.stringify(result) || '{}');

        that.afterGetConfigParams(result);
      });
    },
    recordErrorKeyup(e) {
      if (e.keyCode === 13) {
        this.recordErrorBlur();
      }
    },
    recordErrorBlur(e) {
      const recordErrorList = this.replaceComma(e.target.value);
      this.saveAndSend({ recordErrorList });
    },
    changeDebug(debugFlag = false) {
      this.allDataObj.debug = debugFlag;
      const { debug } = this.allDataObj;
      this.saveAndSend({ debug });
    },
    videoPlayRateChange(e) {
      const { host, allDataObj, saveAndSend } = this;
      const { mapInfo } = allDataObj;
      if (!mapInfo || !mapInfo[host] || !mapInfo[host].videoPlayRate)
        return false;
      mapInfo[host].videoPlayRate = Number(e.target.value);
      saveAndSend({ mapInfo });
    },
    // 3
    noChangeHrefListBlur(e) {
      const noChangeHrefList = this.replaceComma(e.target.value);
      this.saveAndSend({ noChangeHrefList });
    },
    // 打开新页面
    openBackground() {
      window.open(chrome.extension.getURL('options.html'));
    },
    // 切换是否开启元素描边
    changeEleCssText(changeEleMiaoBianFlag = false) {
      this.allDataObj.changeEleMiaoBian = changeEleMiaoBianFlag;
      const { changeEleMiaoBian } = this.allDataObj;
      this.saveAndSend({ changeEleMiaoBian });
    },
    // 分割并替换逗号
    replaceComma(val) {
      const strList = val
        .replaceAll('，', ',')
        .split(',')
        .map((t) => {
          let newT = '';
          if (t.includes('\n')) {
            newT = t.split('\n')[0];
          } else {
            newT = t;
          }
          return newT;
        });
      return strList;
    },
    // 保存参数并且发消息
    saveAndSend(payload) {
      const params = { ...this.result, ...payload };
      this.changeStorage(params);
      this.sendMessage(params);
      this.sendMessage2(params);
      this.configParamsBacket = JSON.parse(JSON.stringify(params));
    },
    // 改变配置参数
    changeStorage(params) {
      // for (const k in params) {
      //   this.$data[k] = params[k];
      // }
      // console.log(params, this.$data, '==');
      chrome.storage.sync.set(params, function (result) {});
    },
    // 判断参数是否变化, true未变化， false变化了
    isChange(name) {
      if (!name) return;
      const { configParamsBacket } = this;
      if (typeof configParamsBacket[name] !== 'object') {
        if (configParamsBacket[name] === this[name]) return true;
        return false;
      } else if (Array.isArray(configParamsBacket[name])) {
        if (configParamsBacket[name].length !== this[name].length) return false;
        const flag = configParamsBacket[name].every((item) => {
          return this[name].includes(item);
        });
        return flag;
      }
      return true;
    },
    // 未修改时的提示信息
    noChangeLog(msg) {
      const { debug } = this;
      if (!debug) return false;
      console.log(msg + '一致，不修改');
    },
    // 发送消息
    sendMessage(message, fn = () => {}) {
      chrome.tabs.query(
        {
          active: true,
          currentWindow: true
        },
        (tabs) => {
          chrome.tabs.sendMessage(tabs[0].id, message, fn);
        }
      );
    },
    sendMessage2(message, fn = () => {}) {
      chrome.runtime.sendMessage(message, function (response) {
        if (typeof fn === 'function') fn(response);
      });
    }
  },
  watch: {
    host: {
      immediate: true,
      handler(val, oldval) {
        if (!val) return;
        if (val === oldval) return;
        const { saveAndSend, allDataObj } = this;
        let { mapInfo, recordErrorList } = allDataObj;
        if (!mapInfo[val]) {
          mapInfo[val] = commonDefault;
        } else {
          for (const k in commonDefault) {
            if (unDef(mapInfo[val][k])) {
              mapInfo[val][k] = commonDefault[k];
            }
            // console.log(
            //   k,
            //   commonDefault[k],
            //   mapInfo[val][k],
            //   'mapInfo[val][k]'
            // );
            allDataObj[k] = mapInfo[val][k];
          }
        }
        console.log(mapInfo[val], allDataObj, 'mapInfo  watcher');
        saveAndSend({ mapInfo });
        const valIndex = val.indexOf(':');
        if (valIndex !== -1) {
          const hostStr = val.slice(0, valIndex);
          if (recordErrorList.includes(hostStr)) return false;
          recordErrorList.push(hostStr);
          saveAndSend({ recordErrorList });
        }
      }
    }
  }
};
</script>

<style lang="scss">
.popup {
  label,
  input {
    cursor: pointer;
  }
  textarea {
    outline: 0;
  }
  select {
    width: 50%;
    outline: none;
  }
}
</style>
