chrome.bookmarks.getTree(
  (nodeTree) => {
    console.log(nodeTree, 'nodeTree');
    const list = treeToList(nodeTree)
    const obj = {}
    list.forEach(item => {
      obj[item.url] = item
    })
    const newList = []
    for (const k in obj) {
      newList.push(obj[k])
    }
    console.log(newList, 'newList');
  }
)

// 树转数组
function treeToList(tree, list = [], index = 0) {
  if (!tree || !tree.length) {
    return list
  }
  tree.forEach(item => {
    const newItem = {}
    for (const k in item) {
      if (k !== 'children') {
        newItem[k] = item[k]
      }
    }
    list.unshift({
      ...newItem,
      index
    })
    if (!item.children || !item.children.length) {
      list.unshift({
        ...item,
        index
      })
      return list
    }
    index++
    treeToList(item.children, list, index)
  });
  return list
}

// popup通信
// const popup = chrome.extension.getViews({ type: "popup" })[0]
// popup.GetMessageFromBackground("给我的兄弟popup点东西~")
// ​
// function GetMessageFromPopup(data){
//     console.log("popup给我的东西~",data)
// }

// 拦截请求
// 其类型是 chrome.webRequest.WebRequestDetails
// return { redirectUrl: newurl}，转发请求
// return { cancel: true }，abort 请求

// https://wenku.baidu.com/xpage/form/getform?id=wenku_search_mode_2019
const blockUrlList = {
  juejin: {
    adList: ['query_adverts'],
    num: 0,
  },
  'wenku.baidu': {
    adList: ['xpage/form/getform', 'wk_vip_suggesstion', 'ext_platform=pc'],
    num: 0,
  },
}
// 查找过滤参数的数组
let sliceArr = []
// 过滤参数的索引
let kIndex, linkObj = {},
  requestObj = {}, //请求参数对象
  requestList = [], //请求参数列表
  maxRecordIndex = 200,
  configParams = {}, // 配置参数对象
  requestIndex = 0, // 请求条数
  hasDeleteHerfList = [], // 进入过的网址记录
  windowList = [] // window列表

function handlerRequest(details) {
  // console.log(details, 'details')
  ((details.requestBody || {}).raw || []).forEach(raw => {
    const blob = new Blob([raw.bytes], {
      type: 'application/json'
    })
    blob.text().then(data => {
      try {
        requestList.unshift({
          url: details.url,
          data: JSON.parse(data || '{}')
        })
      } catch (error) {
        requestList.unshift({
          url: details.url,
          data
        })
      }
      if (requestList.length > maxRecordIndex) {
        requestList = requestList.slice(maxRecordIndex)
      }
      // console.log(data, '这里', JSON.parse(data));
      if (requestObj[details.url]) {
        requestObj[details.url].push(JSON.parse(data))
      } else {
        requestObj[details.url] = []
      }
    })
  })
  console.log(requestObj, requestList, '请求参数对象');
  // 如果找到了一个要拦截的参数，记录位置，下次从找到的位置接着找
  for (const k in blockUrlList) {
    kIndex = k
    if (details.initiator && details.initiator.includes(k)) {
      const len = blockUrlList[k].adList
      let num = blockUrlList[k].num
      if (num >= len - 1) {
        // 结束
        sliceArr = blockUrlList[k].adList
        kIndex = 0
        return (blockUrlList[k].num = 0)
      }
      sliceArr = blockUrlList[k].adList.slice(num)
      const index = sliceArr.findIndex(it => details.url.includes(it))
      // console.log(sliceArr, index, 'index')
      if (index !== -1) {
        num = index
        return {
          cancel: true
        }
      } else {
        // 结束或者没找到的时候重置索引
        sliceArr = blockUrlList[k].adList
        kIndex = 0
        blockUrlList[k].num = 0
      }
    }
  }
  // 注意 proxy 和 block 需要你自己定义
  /**
   * 代理转发
   */
  // if (proxy) {
  //   return {
  //     redirectUrl: details.url.replace(proxy.origin, proxy.target),
  //   }
  // }
  /**
   * 请求拦截
   * */
  // if (block) {
  // return { cancel: true }
  // }
}

// 拦截请求
// chrome.webRequest.onBeforeRequest.addListener(
//   handlerRequest, {
//     urls: ['<all_urls>'],
//   },
//   // 定义获取哪些权限
//   ['blocking', 'requestBody', 'extraHeaders']
// )

// chrome.contextMenus.create({
//   title: '使用谷歌搜索：%s', // %s表示选中的文字
//   contexts: ['selection'], // 只有当选中文字时才会出现此右键菜单
//   onclick: function (params) {
//     console.log(params, 'params')
//     // 注意不能使用location.href，因为location是属于background的window对象
//     chrome.tabs.create({
//       url: 'https://www.google.com/search?q=' + encodeURI(params.selectionText),
//     })
//   },
// })

chrome.runtime.onMessage.addListener(function notify(
  message,
  sender,
  sendResponse
) {
  colectHref(message.href)
  if (message.linkObj) {
    linkObj = {
      ...linkObj,
      ...message.linkObj
    }
    // 这种只分类一次
    const newLinkObj = {}
    for (const k in linkObj) {
      if (!k) continue
      const {
        origin
      } = new URL(k)
      if (newLinkObj[origin]) {
        newLinkObj[origin][k] = linkObj[k]
      } else {
        newLinkObj[origin] = {}
      }
    }
    console.log(newLinkObj, linkObj);
  } else {
    configParams = message
  }
  if (sender.tab) {
    const tabId = sender.tab.id;
    if (tabId in connections) {
      connections[tabId].postMessage(message);
    } else {
      cache[tabId] = cache[tabId] || [];
      cache[tabId].push(message);
    }
  } else {
    console.log("sender.tab not defined.");
  }
  return true
});

// 获取配置
chrome.storage.sync.get(null, function (result) {
  console.log(result, 'result');
  configParams = result
  // 清理缓存
  clearCache(configParams)
})

function colectHref(href) {
  hasDeleteHerfList = hasDeleteHerfList.filter(it => Boolean)
  const index = hasDeleteHerfList.findIndex((it => it === href))
  if (index !== -1) {
    hasDeleteHerfList.splice(index, 1)
  }
  hasDeleteHerfList.unshift(href)
  console.log('历史记录列表', hasDeleteHerfList);
}

function clearCache(configParams) {
  const callback = function () {
    log('Do something clever here once data has been removed', configParams.clearTime);
  };
  if (!configParams.clearTime) return false
  const millisecondsPerWeek = 1000 * 60 * 60 * 24 * (configParams.clearTime || 1);
  const oneWeekAgo = (new Date()).getTime() - millisecondsPerWeek;
  chrome.browsingData.remove({
    "since": oneWeekAgo
  }, {
    "appcache": true,
    "cache": true,
    "cacheStorage": true,
    "cookies": true,
    "downloads": true,
    "fileSystems": true,
    "formData": true,
    "history": true,
    "indexedDB": true,
    "localStorage": true,
    "passwords": true,
    "serviceWorkers": true,
    "webSQL": true
  }, callback);
}
// TODO
const connections = {};

const cache = {};

chrome.runtime.onConnect.addListener(function (port) {

  const extensionListener = function (message, sender, sendResponse) {
    if (message.name === "init") {
      console.log('init');
    } else {
      requestIndex++
      console.log(message, requestIndex);
    }
    const tabId = message.tabId;
    connections[tabId] = port;
    if (cache[tabId] && cache[tabId].length) {
      for (let i = 0; i < cache[tabId].length; i++) {
        const req = cache[tabId][i];
        port.postMessage(req);
      }
    }
    return;
  }

  port.onMessage.addListener(extensionListener);

  port.onDisconnect.addListener(function (port) {
    port.onMessage.removeListener(extensionListener);
    const tabs = Object.keys(connections);
    for (let i = 0, len = tabs.length; i < len; i++) {
      if (connections[tabs[i]] == port) {
        delete connections[tabs[i]]
        break;
      }
    }
  });
});

chrome.windows.getAll({
  populate: true
}, (a) => {
  windowList = []
  a.forEach(it => {
    windowList.push(...it.tabs)
  })
  console.log(windowList, 'windowList');
})