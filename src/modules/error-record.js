/*
 * @Author: yucheng
 * @Date: 2022-01-05 19:02:41
 * @LastEditTime: 2022-01-15 14:58:27
 * @LastEditors: yucheng
 * @Description: ...
 */
let YUCHENG_ERROR_BOX = document.createElement('div'),
  YUCHENG_TIMER = null,
  YUCHENG_DELAY = 3000,
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
// 监听请求错误
function ajaxEventTrigger(event) {
  var ajaxEvent = new CustomEvent(event, {
    detail: this
  });
  window.dispatchEvent(ajaxEvent);
}
let oldXHR = window.XMLHttpRequest;

function newXHR() {
  var realXHR = new oldXHR();
  realXHR.addEventListener('abort', function () {
    ajaxEventTrigger.call(this, 'ajaxAbort');
  }, false);
  realXHR.addEventListener('error', function () {
    ajaxEventTrigger.call(this, 'ajaxError');
  }, false);
  realXHR.addEventListener('load', function () {
    ajaxEventTrigger.call(this, 'ajaxLoad');
  }, false);
  realXHR.addEventListener('loadstart', function () {
    ajaxEventTrigger.call(this, 'ajaxLoadStart');
  }, false);
  realXHR.addEventListener('progress', function () {
    ajaxEventTrigger.call(this, 'ajaxProgress');
  }, false);
  realXHR.addEventListener('timeout', function () {
    ajaxEventTrigger.call(this, 'ajaxTimeout');
  }, false);
  realXHR.addEventListener('loadend', function () {
    ajaxEventTrigger.call(this, 'ajaxLoadEnd');
  }, false);
  realXHR.addEventListener('readystatechange', function () {
    ajaxEventTrigger.call(this, 'ajaxReadyStateChange');
  }, false);
  return realXHR;
}
window.XMLHttpRequest = newXHR;
window.addEventListener('ajaxReadyStateChange', function (e) {
  const status = String(e.detail.status)
  if (!status.startsWith('2') && (e.detail.responseText || e.detail.responseURL)) {
    const info = '错误码：' + e.detail.status + '，错误信息：' + e.detail.responseText + '，错误url:' + e.detail.responseURL
    boxInfo(info)
  } else {
    if (e.detail.responseURL && (e.detail.responseText || e.detail.response)) {
      yuchengRequestList.push({
        url: e.detail.responseURL,
        data: JSON.parse(e.detail.responseText || "{}")
      })
      if (yuchengRequestList.length > MAX_RECORD_REQUEST_LIST) {
        const len = yuchengRequestList.length - MAX_RECORD_REQUEST_LIST
        yuchengRequestList = yuchengRequestList.slice(len)
      }
      debounce(() => {
        console.log(yuchengRequestList, '请求对象')
      }, 100)
    }
  }
});
window.addEventListener('ajaxAbort', function (e) {
  if (e.detail.responseText || e.detail.responseURL) {
    const info = '错误码：' + e.detail.status + '，错误信息：' + e.detail.responseText + '，错误url:' + e.detail.responseURL
    boxInfo(info)
  }
});