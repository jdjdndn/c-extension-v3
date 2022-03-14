<template>
  <div class="options">
    <div class="item" v-for="(item, i) in responseList" :key="i">
      {{ i + 1 }} path:<input
        type="text"
        v-model="responseList[i].path"
        @focus="showValue(responseList[i].path, i, 'path')"
        @input="showValue(responseList[i].path, i, 'path')"
      />
      requestData:<input
        type="text"
        v-model="responseList[i].requestData"
        @focus="showValue(responseList[i].requestData, i, 'request')"
        @input="showValue(responseList[i].requestData, i, 'request')"
      />
      responseData:<input
        type="text"
        v-model="responseList[i].responseData"
        @focus="showValue(responseList[i].responseData, i, 'response')"
        @input="showValue(responseList[i].responseData, i, 'response')"
      />
      <button @click="put(i, 'request')">改req</button>
      <button @click="put(i, 'response')">改res</button>
      <button @click="deleteFn(i)">删除</button>
      <input
        type="checkbox"
        v-model="responseList[i].checked"
        @click="changeOneChecked(responseList[i])"
      />
    </div>
    <button @click="add">新增</button>
    <!-- <button @click="chooseNot">全开</button> -->
    全开:<input type="checkbox" v-model="checked" @click="chooseNot" />
    <div>
      <textarea
        name=""
        id=""
        cols="67"
        rows="50"
        v-model="inputValue"
        @input="changeOriginValue"
      ></textarea>
    </div>
  </div>
</template>

<script>
import {
  mouseClick,
  copyTargetText,
  autoSelect
} from '../../modules/common.js';
export default {
  name: 'Options',
  data() {
    return {
      // 要修改接口返回值列表
      responseList: [
        {
          path: '/',
          checked: true,
          responseData: '',
          requestData: ''
        }
      ],
      // 默认全选
      checked: true,
      allGetList: [], // 请求参数与响应结果组成的数组
      inputValue: '', // 激活输入框的内容在大框里展示
      originInputSite: {}, // 记录激活的输入框
      obj: {} // 收集请求地址为k,请求参数跟响应结果为value的对象
    };
  },
  mounted() {
    window.addEventListener('message', this.message);
    mouseClick();
    copyTargetText();
    autoSelect();
  },
  methods: {
    // 修改原输入框参数
    changeOriginValue(e) {
      const value = e.target.value;
      let { originInputSite } = this;
      const { i, type } = originInputSite;
      if (type === 'request') {
        this.responseList[i].requestData = value;
      } else if (type === 'response') {
        this.responseList[i].responseData = value;
      } else if (type === 'path') {
        this.responseList[i].path = e.target.value;
      }
      originInputSite = {};
    },
    // 放大展示输入框参数
    showValue(data, i, type) {
      this.originInputSite = { i, type };
      this.inputValue = data;
    },
    // 全选
    chooseNot() {
      this.checked = !this.checked;
      this.responseList.forEach((it) => {
        it.checked = this.checked;
        this.postMessage(it);
      });
    },
    // 单选
    changeOneChecked(data) {
      data.checked = !data.checked;
      this.checked = this.responseList.every((it) => it.checked);
    },
    // 增
    add() {
      this.responseList.push({
        path: '/',
        checked: true,
        responseData: '',
        requestData: ''
      });
    },
    // 删
    deleteFn(i) {
      this.responseList.splice(i, 1);
    },
    // 改 请求参数 或者 响应结果
    put(i, type) {
      if (type === 'request') {
        this.postMessage({
          ...this.filterObjKey(this.responseList[i], 'responseData'),
          type
        });
      } else {
        this.postMessage({
          ...this.filterObjKey(this.responseList[i], 'requestData'),
          type
        });
      }
    },
    // 过滤对象的某个属性
    filterObjKey(obj, k) {
      const newObj = {};
      for (const i in obj) {
        if (i !== k) {
          newObj[i] = obj[i];
        }
      }
      return newObj;
    },
    message(e) {
      // console.log(e.data, '收到消息-options');
      const data = e.data;
      if (data['1997']) {
        // this.responseList.push(JSON.stringify(data.data));
        this.allGetList.push(data.data);
        this.changeResponseList();
      }
    },
    // 根据请求结果 修改 responseList
    changeResponseList() {
      const { obj } = this;
      this.allGetList.forEach((it) => {
        if (!obj[it.responseURL]) {
          const newObj = {};
          if (it.type === 'request') {
            newObj.requestData = it.data;
          } else {
            newObj.responseData = it.data;
          }
          obj[it.responseURL] = {
            responseURL: it.responseURL,
            type: it.type,
            ...newObj
          };
        } else if (obj[it.responseURL].type) {
          if (
            obj[it.responseURL].type === 'request' &&
            it.type === 'response'
          ) {
            obj[it.responseURL].responseData = it.data;
          } else if (
            obj[it.responseURL].type === 'response' &&
            it.type === 'request'
          ) {
            obj[it.responseURL].requestData = it.data;
          }
        }
      });
      const list = [];
      for (const k in obj) {
        list.push({
          ...obj[k],
          requestData: JSON.stringify(obj[k].requestData),
          responseData: JSON.stringify(obj[k].responseData),
          path: obj[k].responseURL,
          checked: this.checked
        });
      }
      this.responseList = list;
    },
    // 发消息
    postMessage(data) {
      // 没有指定path的都不处理
      if (!data.path) return;
      let newData = {
        1997: '5201314'
      };
      if (typeof data === 'object') {
        newData = {
          ...newData,
          ...data
        };
      } else {
        newData.data = data;
      }
      window.top.postMessage(newData, '*');
    }
  }
};
</script>
<style lang="scss">
* {
  margin: 0;
  padding: 0;
  font-family: arial, x-locale-body, sans-serif;
}
html,
body {
  width: 100%;
  height: 100%;
  user-select: none;
  overflow-y: auto;
  background-color: #fff;
}
.options {
  .item {
    display: flex;
    align-items: center;
  }
  input {
    width: 40px;
    outline: none;
    &:first-of-type {
      width: 100px;
    }
  }
  input[type='checkbox'] {
    width: unset;
  }
  textarea {
    outline: none;
  }
}
/* 滚动槽 */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  border-radius: 3px;
  background: rgba(0, 0, 0, 0.06);
  -webkit-box-shadow: inset 0 0 5px rgba(0, 0, 0, 0.08);
}
/* 滚动条滑块 */
::-webkit-scrollbar-thumb {
  border-radius: 3px;
  background: rgba(0, 0, 0, 0.12);
  -webkit-box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.2);
}
</style>