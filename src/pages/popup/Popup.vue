<!--
 * @Author: yucheng
 * @Date: 2021-08-31 08:23:13
 * @LastEditTime: 2022-02-27 15:43:03
 * @LastEditors: yucheng
 * @Description: ...
-->
<template>
  <div ref="popup" class="popup">
    <h1>{{ msg }}</h1>
    <!-- 开启选中元素描边 -->
    <div class="popup-item">
      1、开启选中元素描边
      <label for="a" @click="changeEleCssText(true)"
        >开<input id="a" type="radio" name="a" :checked="changeEleMiaoBian"
      /></label>
      <label for="b" @click="changeEleCssText()"
        >关<input id="b" type="radio" name="a" :checked="!changeEleMiaoBian"
      /></label>
    </div>
    <div class="popup-item">
      2、开启debug
      <label for="c" @click="changeDebug(true)"
        >开<input id="c" type="radio" name="c" :checked="debug"
      /></label>
      <label for="d" @click="changeDebug()"
        >关<input id="d" type="radio" name="c" :checked="!debug"
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
        :value="noChangeHrefList"
        @blur="noChangeHrefListBlur"
      ></textarea>
      4、记录报错列表(host为ip地址的自动添加)
      <textarea
        name=""
        id=""
        cols="50"
        rows="3"
        :value="recordErrorList"
        @blur="recordErrorBlur"
        @keyup="recordErrorKeyup"
      ></textarea>
      5、视频播放速度
      <!-- <input type="text" :value="videoPlayRate" @blur="videoPlayRateBlur" /> -->
      <select name="select" @change="videoPlayRateChange">
        <option
          :label="item.videoPlayRate"
          :value="item.videoPlayRate"
          :selected="item.videoPlayRate === videoPlayRate"
          v-for="(item, i) in videoPlayRateList"
          :key="i"
        ></option></select
      ><br />
      6、缓存清理（日）
      <select name="select" @change="clearTimeChange">
        <option
          :label="item"
          :value="item"
          :selected="item === clearTime"
          v-for="(item, i) in clearTimeList"
          :key="i"
        ></option>
      </select>
      <!-- 7、iframe
      <iframe src="./options.html" frameborder="0"></iframe> -->
      <div class="popup-item">
        7、开启翻译
        <label for="e" @click="changeFanyi(true)"
          >开<input id="e" type="radio" name="e" :checked="debug"
        /></label>
        <label for="f" @click="changeFanyi()"
          >关<input id="f" type="radio" name="e" :checked="!debug"
        /></label>
      </div>
    </div>
    <!-- <button @click="openBackground">打开popup页面</button> -->
  </div>
</template>

<script>
import { mouseClick, defaultparams } from '../../modules/common';
export default {
  data() {
    return {
      msg: 'Welcome!--popup',
      ...defaultparams
    };
  },
  mounted() {
    const { getAndSetParams, sendMessage } = this;
    const that = this;
    getAndSetParams();
    console.log(chrome, 'chrome');
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      that.host = request.host;
      console.log(request, sender, '接受消息');
    });
    sendMessage({}, (res) => {
      if (res && res.host) {
        that.host = res.host;
      }
    });
    this.start();
  },
  methods: {
    // 开启翻译
    changeFanyi(fanyiFlag = false) {
      console.log(fanyiFlag);
      const { host, mapInfo, noChangeLog } = this;
      if (!mapInfo || !mapInfo[host]) return false;
      if (mapInfo[host].fanyiFlag === fanyiFlag)
        return noChangeLog('不需要切换');
      mapInfo[host].fanyiFlag = fanyiFlag;
      this.saveAndSend({ fanyiFlag });
    },
    start() {
      chrome.windows.getAll({ populate: true }, function (windowList) {
        console.log(windowList, 'windowList');
      });
    },
    // 设置content.js中的list列表
    setConfigMap() {},
    // 缓存清理时间切换
    clearTimeChange(e) {
      this.clearTime = Number(e.target.value);
      const { clearTime } = this;
      this.saveAndSend({ clearTime });
    },
    // 获取配置参数之后做点事情
    afterGetConfigParams(result) {
      mouseClick(result);
      this.sendMessage2(result);
    },
    // 获取storage并设置参数
    getAndSetParams() {
      let that = this;
      // 获取配置参数
      chrome.storage.sync.get(null, function (result) {
        that.result = result;
        console.log('看看获取的参数', result);
        if (!result) return false;
        that.configParamsBacket = JSON.parse(
          JSON.stringify(result.configParams) || '{}'
        );
        const {
          changeEleMiaoBian,
          noChangeHrefList,
          debug,
          recordErrorList,
          mapInfo,
          host,
          clearTime
        } = that.result;
        that.host = host;
        that.changeEleMiaoBian = changeEleMiaoBian || that.changeEleMiaoBian;
        that.debug = debug || that.debug;
        that.mapInfo = mapInfo || {};
        that.clearTime = clearTime || 1;

        that.noChangeHrefList =
          noChangeHrefList && noChangeHrefList.length
            ? noChangeHrefList
            : that.noChangeHrefList;

        that.recordErrorList =
          recordErrorList && recordErrorList.length
            ? recordErrorList
            : that.recordErrorList;

        that.afterGetConfigParams(that.result);
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
      this.debug = debugFlag;
      const { debug, noChangeLog, isChange } = this;
      const flag = isChange('debug');
      if (flag) {
        return noChangeLog('debug');
      }
      this.saveAndSend({ debug });
    },
    videoPlayRateChange(e) {
      const { host, mapInfo, noChangeLog } = this;
      if (!mapInfo || !mapInfo[host] || !mapInfo[host].videoPlayRate)
        return false;
      if (mapInfo[host].videoPlayRate === Number(e.target.value))
        return noChangeLog('视频播放速度');
      mapInfo[host].videoPlayRate = Number(e.target.value);
      this.saveAndSend({ mapInfo });
    },
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
      this.changeEleMiaoBian = changeEleMiaoBianFlag;
      const { changeEleMiaoBian, noChangeLog, isChange } = this;
      const flag = isChange('changeEleMiaoBian');
      if (flag) {
        return noChangeLog('元素描边');
      }
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
      mouseClick(params);
    },
    // 改变配置参数
    changeStorage(params) {
      this._data = {
        ...this._data,
        ...params
      };
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
    sendMessage2(message) {
      chrome.runtime.sendMessage(message, function (response) {});
    }
  },
  watch: {
    host: {
      immediate: true,
      handler(val, oldval) {
        if (!val) return;
        if (val == oldval) return;
        let { mapInfo, videoPlayRate, saveAndSend, recordErrorList } = this;
        if (!mapInfo[val]) {
          mapInfo[val] = {};
          mapInfo[val].videoPlayRate = videoPlayRate;
          saveAndSend({ mapInfo });
        } else {
          this.videoPlayRate = mapInfo[val].videoPlayRate;
        }
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
