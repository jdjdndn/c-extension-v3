/*
 * @Author: yucheng
 * @Date: 2022-01-05 19:02:41
 * @LastEditTime: 2022-02-27 10:58:02
 * @LastEditors: yucheng
 * @Description: ...
 */
let YUCHENG_ERROR_BOX = document.createElement('div'),
  YUCHENG_TIMER = null,
  YUCHENG_DELAY = 3000,
  YUCHENG_RESPONSE = {}, // 响应
  YUCHENG_REQUEST = {}, // 请求
  responseURL = '', // 响应地址
  {
    log
  } = console,
  onerror = window.onerror,
  MAX_RECORD_REQUEST_LIST = 200,
  YUCHENG_PUTDATA_BOX = document.querySelector('.yucheng-putdata-box')
YUCHENG_ERROR_BOX.classList.add('yucheng-error-box')
YUCHENG_ERROR_BOX.style.cssText = `
  position: fixed;
  display: none;
  width: 500px;
  height: 250px;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  background-color: #ccc;
  box-shadow: 0px 0px 1px 1px #ccc;
  z-index: 999999 !important;
  overflow-y: auto;
  border: 0;
`
document.body.appendChild(YUCHENG_ERROR_BOX)

// const putDataBox = document.querySelector('.yucheng-putdata-box')

// 收集的请求列表
let yuchengRequestList = []
const keyup = (e) => {
  if (e.keyCode === 13) {
    clearTimeout(YUCHENG_TIMER);
    YUCHENG_ERROR_BOX.style.display = 'none'
  } else if (e.ctrlKey && e.keyCode === 73) {
    // ctrl + i
    if (YUCHENG_PUTDATA_BOX.style.display === 'none') {
      YUCHENG_PUTDATA_BOX.style.display = 'block'
    } else {
      YUCHENG_PUTDATA_BOX.style.display = 'none'
    }
  }
}
window.addEventListener('keyup', keyup)

function debounce(fn, YUCHENG_DELAY = 16) {
  if (YUCHENG_TIMER) {
    clearTimeout(YUCHENG_TIMER);
  }
  YUCHENG_TIMER = setTimeout(fn, YUCHENG_DELAY);
}

function boxInfo(info) {
  YUCHENG_ERROR_BOX.innerHTML = info
  YUCHENG_ERROR_BOX.style.display = 'block'
  setTimeout(() => {
    YUCHENG_ERROR_BOX.style.display = 'none'
  }, YUCHENG_DELAY)
}

// 监听 js 错误
window.onerror = function (msg, url, lineNo, columnNo, error) {
  if (onerror) {
    onerror()
  }
  let string = msg.toLowerCase();
  let substring = "script error";
  let info = ''
  if (string.indexOf(substring) > -1) {
    info = 'Script Error: See Browser Console for Detail'
  } else {
    let message = [
      'Message: ' + msg + '<br/>' +
      'URL: ' + url + '<br/>' +
      'Line: ' + lineNo + '<br/>' +
      'Column: ' + columnNo + '<br/>' +
      'Error object: ' + JSON.stringify(error)
    ].join(' - ');

    info = message
  }
  boxInfo(info)
};

// 监听 promise 错误 缺点是获取不到列数据
window.addEventListener('unhandledrejection', e => {
  boxInfo('promise error' + e.reason)
})

// 捕获资源加载失败错误 js css img...
window.addEventListener('error', e => {
  debounce(() => {
    boxInfo(JSON.stringify(e) + '资源加载失败')
  })
}, true)

ah.hook({
  //拦截回调
  onreadystatechange: function (xhr) {
    // console.log("onreadystatechange called: %O", xhr);
  },
  onload: function (xhr) {
    // console.log("onload called: %O", xhr);
  },
  //拦截函数
  open: function (arg) {
    // console.log(
    //   "open called: method:%s,url:%s,async:%s",
    //   arg[0],
    //   arg[1],
    //   arg[2]
    // );
    responseURL = arg[1]
  },
  send: function (arg, xhr) {
    let data = arg[0],
      flag = false
    for (const k in YUCHENG_RESPONSE) {
      // console.log('request', k, 'kkkkkkkkkkkkkkkk', YUCHENG_RESPONSE[k]);
      if (xhr.responseURL === k && YUCHENG_RESPONSE[k] && YUCHENG_RESPONSE[k].checked) {
        data = YUCHENG_RESPONSE[k].requestData
        flag = true
        break
      }
    }
    // 发送请求参数
    postMessage({
      data,
      responseURL,
      type: 'request'
    })
    // console.log(
    //   "send:",
    //   arg
    // );
  },
  responseText: {
    getter: tryParseJson2,
  },
  response: {
    getter: tryParseJson2,
  },
});

function tryParseJson2(v, xhr) {
  let data = v,
    flag = false
  for (const k in YUCHENG_RESPONSE) {
    if (!YUCHENG_RESPONSE[k].responseData) {
      break
    }
    // console.log('response', k, 'kkkkkkkkkkkkkkkk', YUCHENG_RESPONSE[k]);
    if (xhr.responseURL === k && YUCHENG_RESPONSE[k] && YUCHENG_RESPONSE[k].checked) {
      data = YUCHENG_RESPONSE[k].responseData
      flag = true
      break
    }
  }
  // 有已修改过就返回已修改的结果，没有返回正常响应结果
  if (flag) {
    return data
  } else {
    postMessage({
      data,
      responseURL: xhr.responseURL,
      type: 'response'
    })
    return data;
  }
  // putDataBox.contentWindow.postMessage({
  //   1997: '5201314',
  //   data: {
  //     data,
  //     responseURL: xhr.responseURL,
  //     type: 'response'
  //   }
  // }, '*')
}

window.addEventListener('message', (e) => {
  // console.log(e.data, '收到消息-error');
  const data = e.data
  if (data['1997']) {
    YUCHENG_RESPONSE[data.path] = data
  }
});

function postMessage(data) {
  YUCHENG_PUTDATA_BOX.contentWindow.postMessage({
    1997: '5201314',
    data
  }, '*')
}