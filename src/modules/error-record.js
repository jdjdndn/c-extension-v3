/*
 * @Author: yucheng
 * @Date: 2022-01-05 19:02:41
 * @LastEditTime: 2022-01-22 20:09:29
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
  MAX_RECORD_REQUEST_LIST = 200
YUCHENG_ERROR_BOX.classList.add('yucheng-error-box')
YUCHENG_ERROR_BOX.style.cssText = `
  position: fixed;
  display: none;
  width: 400px;
  height: 150px;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  background-color: #ccc;
  box-shadow: 0px 0px 1px 1px #ccc;
  z-index: 999999 !important;
  overflow-y: auto;
`
document.body.appendChild(YUCHENG_ERROR_BOX)

const putDataBox = document.querySelector('.yucheng-putdata-box')

// 收集的请求列表
let yuchengRequestList = []
window.addEventListener('keyup', (e) => {
  if (e.keyCode === 13) {
    clearTimeout(YUCHENG_TIMER);
    YUCHENG_ERROR_BOX.style.display = 'none'
  }
})

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
    putDataBox.contentWindow.postMessage({
      1997: '5201314',
      data: {
        ...arg[0],
        responseURL,
        type: 'request'
      }
    }, '*')
    // console.log(
    //   "send:",
    //   arg[0]
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
  let data = v
  for (const k in YUCHENG_RESPONSE) {
    if (xhr.responseURL.includes(k) && YUCHENG_RESPONSE[k] && YUCHENG_RESPONSE[k].checked) {
      newV = YUCHENG_RESPONSE[k].data
      break
    }
  }
  putDataBox.contentWindow.postMessage({
    1997: '5201314',
    data: {
      data,
      responseURL: xhr.responseURL,
      type: 'response'
    }
  }, '*')
  return data;
}

window.addEventListener('message', (e) => {
  // console.log(e.data, '收到消息-error');
  const data = e.data
  if (data['1997']) {
    YUCHENG_RESPONSE[data.path] = {
      data: data.data,
      checked: data.checked
    }
  }
});