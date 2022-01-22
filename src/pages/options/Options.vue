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
        v-model="requestList[i]"
        @focus="showValue(requestList[i], i, 'request')"
        @input="showValue(requestList[i], i, 'request')"
      />
      responseData:<input
        type="text"
        v-model="responseList[i].data"
        @focus="showValue(responseList[i].data, i, 'response')"
        @input="showValue(responseList[i].data, i, 'response')"
      />
      <button @click="put(i)">修改</button>
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
        cols="68"
        rows="5"
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
          data: '',
          checked: true,
          responseData: '',
          requestData: ''
        }
      ],
      // 默认全选
      checked: true,
      allGetList: [], // 请求参数与响应结果组成的数组
      inputValue: '', // 激活输入框的内容在大框里展示
      originInputSite: {} // 记录激活的输入框
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
        this.requestList[i] = value;
      } else if (type === 'response') {
        this.responseList[i].data = value;
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
      this.responseList.push({ path: '/', data: '', checked: true });
    },
    // 删
    deleteFn(i) {
      this.responseList.splice(i, 1);
    },
    // 改
    put(i) {
      this.postMessage(this.responseList[i]);
    },
    message(e) {
      console.log(e.data, '收到消息-options');
      const data = e.data;
      if (data['1997']) {
        this.requestList.push(JSON.stringify(data.data));
      }
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