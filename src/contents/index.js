import { ajax } from "../modules/ajax.js";
import {
  // copyTargetText,
  autoSelect,
  chalk,
  collectAllLink,
  commonDefault,
  doSth,
  gotoLink,
  isParentNodeA,
  mouseClick,
  otherSiteHref,
  // boxInfo,
  paramsDefault,
  sendReq,
  unDef,
} from "../modules/common.js";
import "../modules/index.scss";
// import { openLinkBoxFn } from './linkBox/index';
let performance_now = performance.now(),
  liListStr = "", // 链接列表字符串
  linkObj = {},
  timer = null,
  win = "",
  // youtubeFlag = false, // YouTube中文翻译只设置一次
  configParams = paramsDefault, // popup配置参数
  aLinkMap = {}, // 指定某些a链接直接跳转
  cached = {}; // 缓存起来

const { location } = window;
const { href, host, pathname, origin, search, protocol } = location;
const { log, error, dir } = console;
const vueAroundList = ["router.vuejs.org", "vuex.vuejs.org", "cli.vuejs.org"];
// dom元素id
let nodeIdNum = 0;

// 获取配置参数
chrome.storage.local.get(null, function(result) {
  // 设置默认参数
  setStorageDefault(result);
  const { mapInfo } = configParams;
  // 获取storage事件和接受消息处理的公共事件
  commonEvents(configParams);
  // copyTargetText();
  autoSelect();
  main(mapInfo);
  //   if (mapInfo[host].openLinkBox) {
  //     openLinkBoxFn(configParams)
  //  }
});

chalk(chrome, "chrome");

// 接收配置消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  configParams = {
    ...configParams,
    ...request,
  };
  commonEvents(configParams);
  sendResponse({
    str: "我收到了你的情书， popup~",
  });
});

// 初始化跟修改配置后的公共触发事件
function commonEvents(configParams) {
  const { mapInfo } = configParams;
  // 跳转网址
  replaceHref(configParams);
  // 键盘点击事件
  if (!cached["mouseClick"]) {
    mouseClick({ ...configParams, host }, window, aLinkMap);
    // ifraemsListener({ ...configParams, host });
  }
  // cached["mouseClick"] = mouseClick;
  // 添加/移除错误监听
  removeErrListening(configParams);
  // 切换视频播放速度
  videoPlay(mapInfo[host].videoPlayRate);
  // 设置是否翻译
  setFanyi(mapInfo[host].fanyiFlag);
  // 切换收集a链接
  // configParams.mapInfo[host].collectInfoFlag =
  //   configParams.mapInfo &&
  //   configParams.host &&
  //   configParams.mapInfo[host].collectInfoFlag;

  // getNoOpenDomList((configParams.mapInfo[host] || {}).noOpenLinkList || []);
  // getNoOpenDomList(mapInfo[host].noOpenLinkList);
}

function ifraemsListener(params) {
  const frames = window.frames;
  const framesLength = frames.length;
  for (let i = 0; i < framesLength; i++) {
    const frameWindow = frames[i];
    try {
      mouseClick(params, frameWindow.contentWindow);
    } catch (error) {
      console.error("iframe事件加载失败：" + i);
    }
  }
}

// addNewElement('link', 'css/service-worker.css')
// link href
// script src
function addNewElement(node, src) {
  const element = document.createElement(node);
  element.id = "yucheng-" + node + "-" + nodeIdNum++;
  if (!src) return;
  if (node === "link") {
    element.href = chrome.runtime.getURL(src);
    console.log(chrome.runtime.getURL(src), "chrome.runtime.getURL(src)");
  } else {
    element.src = chrome.runtime.getURL(src);
  }
  console.log(element.id, element.src, "element");
  document.head.appendChild(element);
}

// 设置 mapInfo 默认参数
function setStorageDefault(result) {
  const mapInfo = { ...configParams.mapInfo, ...result.mapInfo };
  let flag = false;
  if (!mapInfo[host]) {
    mapInfo[host] = commonDefault;
    flag = true;
  } else {
    for (const k in commonDefault) {
      if (unDef(mapInfo[host][k])) {
        flag = true;
        mapInfo[host][k] = commonDefault[k];
      }
    }
  }
  configParams = {
    ...configParams,
    ...result,
    mapInfo,
  };
  // chalk(configParams, result, "configParams result");
  if (flag) {
    // chalk("mapInfo变化了", mapInfo[host], configParams);
    chrome.storage.local.set({ mapInfo }, function() {});
  }
}

// 判断是否中文网页
function isChinesePage() {
  const lang = document.documentElement.lang;
  // 获取网页的标题
  const pageTitle = document.title;
  // 获取网页使用的主要语言
  const mainLang = document.characterSet.toLowerCase();
  return (
    lang.substring(0, 2) === "zh" ||
    mainLang.substring(0, 2) === "gb" ||
    /[\u4E00-\u9FFF]/.test(pageTitle)
  );
}

function setFanyi(fanyiFlag) {
  if (fanyiFlag && !isChinesePage()) {
    //   google翻译的网址  //translate.google.com/translate_a/element.js?cb=googleTranslateElementInit
    // https://cdn.jsdelivr.net/gh/zs6/gugefanyijs@1.9/element.js
    // 参考地址： https://greasyfork.org/zh-CN/scripts/398746-%E7%BD%91%E9%A1%B5%E7%BF%BB%E8%AF%91/code

    const a = document.createElement("div");
    a.id = "yucheng-translate";
    a.innerHTML = `
    <div id="google_translate_element"></div>
    <script type="text/javascript">
      function googleTranslateElementInit() {
        new google.translate.TranslateElement({pageLanguage: 'zh-CN', includedLanguages: 'zh-CN,zh-TW,en,ja,ru', layout: /mobile/i.test(navigator.userAgent) ? 0 : 2, 'google_translate_element');
      }
    </script>
    <script src="//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit" type="text/javascript"></script>
    `;
    document.body.appendChild(a);

    // 翻译按钮
    const d = $("#google_translate_element");
    if (d) {
      // 选择语言的弹出盒子
      const iframe = $(".goog-te-menu-frame.skiptranslate");
      if (!iframe) return;
      if (d.innerText.includes("中文")) return;
      const zhBtn = iframe.contentWindow.document
        .getElementById(":1.menuBody")
        .querySelectorAll("a");
      Array.from(zhBtn).forEach((item) => {
        if (item.innerHTML.includes("简体")) {
          item.click();
        }
      });
    }
  }
}

function replaceHref(configParams) {
  const otherObj = otherSiteHref(href, host);
  const needChange = otherObj.needChange;
  // 如果前一次的url是当前url的第二个http开头的网址，不跳。即上一次http://www.baidu.com，这一次 http://www.ciji.com?http://www.baidu.com,这样不跳
  // if (configParams.lastLocationHerf === otherObj.href) return
  const noChange = configParams.noChangeHrefList.some((it) =>
    host.includes(it)
  );
  if (needChange && !noChange) {
    location.replace(otherObj.href);
  }
  chalk(
    "configParams--changeHref",
    configParams.lastLocationHerf,
    location.href
  );
}

function removeErrListening(configParams) {
  // 错误监听
  const needRecord = configParams.recordErrorList.some((it) =>
    host.includes(it)
  );
  const script = document.querySelector(".yucheng-error-record");
  if (!needRecord && script) {
    script.remove();
  }
  if ((needRecord || !host) && !script) {
    // ajax-hook
    const ajaxProxyScript = document.createElement("script");
    ajaxProxyScript.src = chrome.runtime.getURL("js/ajaxHook.js");
    document.head.appendChild(ajaxProxyScript);

    const YUCHENG_PUTDATA_BOX = document.createElement("iframe");
    YUCHENG_PUTDATA_BOX.classList.add("yucheng-putdata-box");
    YUCHENG_PUTDATA_BOX.style.cssText = `
      position:fixed;
      top: 0;
      right: 0;
      width: 500px;
      height: 100%;
      display: none;
      z-index: 9999;
    `;
    YUCHENG_PUTDATA_BOX.src = chrome.runtime.getURL("options.html");
    document.body.appendChild(YUCHENG_PUTDATA_BOX);

    setTimeout(errListening, 0);
  }
}

function errListening() {
  const script = document.createElement("script");
  script.className = "yucheng-error-record";
  script.src = chrome.runtime.getURL("js/error-record.js");
  document.head.appendChild(script);
}

// 代码块不要被翻译
[
  "pre",
  "code",
  ".prism-code",
  "a.type",
  ".example-wrap",
  "#handbook-content h2, .handbook-toc, #sidebar",
  ".octotree-tree-view",
  ".github-repo-size-div",
].forEach((str) => {
  noTranslateFn(str);
});

function noTranslateFn(str) {
  const domList = $$(str);
  domList.forEach((dom) => {
    if (!dom.classList.contains("notranslate")) {
      dom.classList.add("notranslate");
    }
  });
}
function setNoTranslate(obj) {
  for (const k in obj) {
    if (k === host) {
      obj[k].forEach((str) => {
        noTranslateFn(str);
      });
    }
  }
}

// 不用翻译列表
const noTranslateList = {
  "github.com": [
    ".f4.text-normal",
    ".Details-content--hidden-not-important.js-navigation-container.js-active-navigation-container.d-md-block",
  ],
};
setNoTranslate(noTranslateList);

function logInfo(...msg) {
  if (!configParams.debug) return false;
  // const msgInfo = JSON.stringify(msg)
  // log(`%c${msgInfo}`, 'background-color: yellow; font-size: 16px;')
  log(...msg);
}
if (window.top) {
  win = window.top;
} else {
  win = window;
}
logInfo("Content script working...");

function rmCommonAd() {
  const ad_key = [
    "ad",
    "Ad",
    "AD",
    "ads",
    "ADV",
    "ggad",
    "topad",
    "aswift",
    "abox",
    "sponsor",
    "spread",
  ];
  ad_key.forEach((key) => {
    if (key === "ad") {
      Array.from($$(`[class*=${key}]`))
        .filter((el) => {
          if (typeof el.className !== "string") return false;
          if (el.className.match(/[a-z]?ad[a-z]?/)[0] !== "ad") return false;
          return true;
        })
        .forEach((el) => (el.style.display = "none"));
    } else if (key === "Ad") {
      Array.from($$(`[id*=${key}]`))
        .filter((el) => {
          if (["G_IMG"].includes(el.tagName)) return false;
          if (el.id.match(/Ad[a-z]?/)[0] !== "Ad") return false;
          return true;
        })
        .forEach((el) => (el.style.display = "none"));
      Array.from($$(`[class*=${key}]`))
        .filter((el) => {
          if (["G_IMG"].includes(el.tagName)) return false;
          if (typeof el.className !== "string") return false;
          if (el.className.match(/Ad[a-z]?/)[0] !== "Ad") return false;
          return true;
        })
        .forEach((el) => (el.style.display = "none"));
    } else {
      $$(`[id*=${key}]`).forEach((el) => (el.style.display = "none"));
      $$(`[class*=${key}]`).forEach((el) => (el.style.display = "none"));
    }
  });
  Array.from($$("*"))
    .filter((el) =>
      Boolean(
        [...el.attributes].find((attr) => {
          let m = attr.name.match(/[a-z]?ad[a-z]?/);
          if (m && m[0] === "ad") return true;
          m = attr.name.match(/[a-z]?ads[a-z]?/);
          if (m && m[0] === "ad") return true;
          return false;
        })
      )
    )
    .forEach((el) => (el.style.display = "none"));
  const iframes = Array.from($$(`iframe`)).filter((el) => {
    if (typeof el.src !== "string") return false;
    let m = el.src.match(/[a-zA-Z0-9]?ad[a-zA-Z0-9]?/);
    if (m && m[0] === "ad") return true;
    m = el.src.match(/[a-zA-Z0-9]?ads[a-zA-Z0-9]?/);
    if (m && m[0] === "ads") return true;
    const keys = ["googleads"];
    for (const key of keys) if (el.src.includes(key)) return true;
    return false;
  });
  iframes.forEach((el) => (el.style.display = "none"));
}
rmCommonAd();

function debounce(fn, delay = 16) {
  if (timer) {
    clearTimeout(timer);
  }
  timer = setTimeout(fn, delay);
}

function $(domStr, dom = document) {
  return dom.querySelector(domStr);
}

export function $$(domStr, dom = document) {
  return dom.querySelectorAll(domStr);
}
// 移除所有
function removeAllFunc(domList) {
  const domArr = $$(domList);
  if (domArr) {
    domArr.forEach((item) => item.remove());
  }
}
// 移除单个 类名或者id 元素
function removeFunc(dom) {
  const domArr = $(dom);
  if (domArr) {
    domArr.remove();
  }
}
// 遍历数组移除单个 类名或者id 元素
function removeArrList(classList, badge) {
  classList.forEach((item) => {
    const itemStr = badge + item;
    const dom = $(itemStr);
    if (dom) {
      dom.remove();
    }
  });
}
// 遍历数组隐藏单个 类名或者id 元素
function hideArrList(classList, badge) {
  classList.forEach((item) => {
    const itemStr = badge + item;
    const dom = $(itemStr);
    if (dom) {
      dom.style.display = "none";
    }
  });
}

// 设置样式
function setStyle(str, css) {
  if (str instanceof HTMLElement) {
    const oldCssText = str.style.cssText;
    str.style.cssText = css + oldCssText;
  } else {
    const strObj = document.querySelector(str);
    if (strObj) {
      strObj.style.cssText = css;
    }
  }
}
// 节流
function throttle(fun, delay = 50) {
  let last;
  let deferTimer;
  return function(...args) {
    const that = this;
    const now = +new Date();
    if (last && now < last + delay) {
      clearTimeout(deferTimer);
      deferTimer = setTimeout(function() {
        last = now;
        fun.apply(that, args);
      }, delay);
    } else {
      last = now;
      fun.apply(that, args);
    }
  };
}

// 视频播放
function videoPlay(rate, index = 0) {
  logInfo("视频加速");
  if (index > 10) {
    return false;
  }
  index++;
  const video = $("video");
  if (video) {
    if (video.playbackRate !== rate) {
      video.autoplay = true;
      video.playbackRate = rate;
    } else if (!video.paused) {
      video.play();
      return;
    }
  } else {
    setTimeout(() => {
      videoPlay(rate, index);
    }, 500);
  }
}

// 点击事件
function proClick(str, options = {}, search = "aira-label") {
  let dom = null;
  const all = options.all || false;
  const i = options.i || 0;
  switch (search) {
    case "aira-label":
      dom = all ? $$(`[aria-label=${str}]`)[i] : $(`[aria-label=${str}]`);
      break;
    case "class":
      dom = all ? $$(`.${str}`)[i] : $(`.${str}`);
      break;
    case "id":
      dom = all ? $$(`.${str}`)[i] : $(`#${str}`);
      break;
    default:
      dom = all ? $$(`[aria-label=${str}]`)[i] : $(`[aria-label=${str}]`);
  }
  if (dom) {
    dom.click();
  }
}

// 移除包含指定元素的元素
function rmSomeSelf(father, child, lsit = [], flag = true) {
  const parents = document.querySelectorAll(father);
  const parentList = Array.from(parents);
  parentList.forEach((parent) => {
    // flag 为 true 排序字段，为false包含字段
    if (flag) {
      lsit.push("广告");
      lsit.forEach((exclude) => {
        const str = exclude.toLowerCase();
        if (
          parent.querySelector(child) &&
          parent.querySelector(child).innerText.includes(str)
        ) {
          parent.remove();
        }
      });
    } else {
      lsit.forEach((includes) => {
        const str = includes.toLowerCase();
        logInfo(parent.querySelector(child), "-------------------");
        if (
          parent.querySelector(child) &&
          !parent.querySelector(child).innerText.includes(str)
        ) {
          parent.remove();
        }
      });
    }
  });
}

// 过滤链接
function linkFilter(linkList = []) {
  if (host === "juejin.cn") {
    return linkList.filter(
      (it) =>
        (it.href.includes("/post/") && !it.href.includes("#")) ||
        it.href.includes("//link.juejin")
    );
  } else if (host === "www.zhihu.com") {
    return linkList.filter(
      (it) => it.href.includes("/question/") || it.href.includes("/zvideo/")
    );
  } else if (host === "www.cnblogs.com") {
    return linkList.filter((it) => it.href.includes("/p/"));
  } else if (host === "www.google.com") {
    return linkList.filter((it) => !it.href.includes("www.google.com/search"));
  }
  return linkList;
}

// 将一个dom元素下的一个a标签放进一行li中
function addLinkListBox(linkList = []) {
  liListStr = "";
  let hrefList = [];
  linkList.forEach((item, i) => {
    linkObj[item.toString()] = item.innerText;
    hrefList.push({
      nodeName: "a",
      href: item.toString(),
      text: item.innerText,
      host,
    });
    liListStr += `<li title='${
      item.innerText
    }'><a href='${item.toString()}' rel="noopener noreferrer" target="_blank">${
      item.innerText
    }</a></li>\n`;
  });
  hrefList = linkFilter(hrefList);
  if (!liListStr) return;
  debounce(() => {
    sendMessage({
      liListStr,
      linkObj,
      hrefList,
    });
    // 收集a链接
    if (
      configParams.mapInfo &&
      configParams.mapInfo[host] &&
      configParams.mapInfo[host].collectInfoFlag
    ) {
      ajax({
        type: "post",
        url: "/put-links",
        header: {
          "Content-Type": "application/json",
        },
        pageProtocol: protocol,
        data: hrefList,
        success: function(data) {
          chalk("这里是success函数", data);
        },
      });
    }
  });
}
// 将一个dom元素下的一个a标签放进一行li中或者多个a放进一个li
// linkList为页面上a元素的父亲的集合
function addLinkListBoxPro(linkList = [], boxName = "toolbox", oneLine = true) {
  let aLinkStr = "",
    linkListStr = "";
  linkList.forEach((item) => {
    const itemList = Array.from(item.querySelectorAll("a"));
    if (itemList.length <= 0) return;
    if (oneLine) {
      // 一个li标签多个a
      itemList.forEach((it) => {
        aLinkStr += `<a title='${
          it.innerText
        }' href='${it.toString()}' rel="noopener noreferrer" target="_blank">${
          it.innerText
        }</a>`;
      });
      linkListStr += `<li>${aLinkStr}</li>\n`;
    } else {
      // 一个li标签里面一个a标签
      itemList.forEach((it) => {
        aLinkStr += `<li title='${
          it.innerText
        }'><a href='${it.toString()}' rel="noopener noreferrer" target="_blank">${
          it.innerText
        }</a></li>\n`;
      });
      linkListStr += aLinkStr;
    }
    aLinkStr = "";
  });
  addLinkListBox([], boxName, linkListStr);
}

const params = {
  href,
  win,
  pathname,
  origin,
  search,
  host,
  protocol,
};

// dom数组
function getDomList(str, filterClassList) {
  let arr = [];
  const list = document.querySelectorAll(str);
  arr = Array.from(list);
  if (!filterClassList) {
    return arr;
  }
  arr = arr.map((it) => it.cloneNode(true));
  if (Array.isArray(filterClassList)) {
    filterClassList.forEach((it) => {
      arr.forEach((item) => {
        const filterIt = Array.from(item.querySelectorAll(it));
        filterIt.forEach((t) => t.remove());
      });
    });
  } else if (typeof filterClassList === "string") {
    arr.forEach((item) => {
      const filterIt = Array.from(item.querySelectorAll(filterClassList));
      filterIt.forEach((t) => t.remove());
    });
  }
  return arr;
}

const list = {
  "www.baidu.com": {
    callback: baidu,
  },
  "wenku.baidu.com": {
    callback: wenku,
  },
  "www.jb51.net": {
    callback: jiaobenzhijia,
  },
  "jingyan.baidu.com": {
    callback: baidujingyan,
  },
  "www.bilibili.com": {
    callback: bilibili,
  },
  "search.bilibili.com": {
    // 执行函数
    callback: bilibili,
    nextStep: {
      // 分页按钮集合
      nextStepList: ".pages .page-item",
      // 当前激活的按钮类名，不加点
      curActiveClass: "active",
      // 实际点击的 nextStepList 下某个元素
      clickBtn: "button",
    },
  },
  "www.it1352.cn": {
    callback: it1352,
  },
  ".alexa.cn": {
    callback: alexacn,
  },
  "www.imomoe.la": {
    callback: yinghuadongman,
  },
  "www.xbiquge.la": {
    callback: biquge,
  },
  "4hu.tv": {
    callback: hu4tv,
  },
  "www.csdn.net": {
    callback: csdn,
  },
  "blog.csdn.net": {
    callback: csdn,
  },
  "www.youtube.com": {
    callback: youtube,
    scroll: "#primary .style-scope #contents",
    selectorList: [
      "#meta > h3 a",
      "#dismissible > div > div.metadata.style-scope.ytd-compact-video-renderer > a",
    ],
  },
  "developer.mozilla.org": {
    callback: mdn,
  },
  "github.com": {
    callback: github,
    selectorList: [
      "#panel-2 > div.js-feed-container > div > article:nth-child(1) > div > section > h5 > span.Truncate > span > a",
      "div.application-main > div > div > div > aside > div:nth-child(5) > a",
      "#js-pjax-container > div:nth-child(2) > div > div > div > div:nth-child(1) > div:nth-child(2) > article:nth-child(1) > div > h4 > span > a",
      "#js-pjax-container > div:nth-child(2) > div > div > div > article:nth-child(3) > div > div > div > h3 > a",
      "#js-pjax-container > div > div > div > ul > li:nth-child(1) > div > div > div > a",
    ],
  },
  "www.zhihu.com": {
    callback: zhihu,
  },
  "juejin.cn": {
    callback: juejin,
    scroll: ".entry-list",
    selectorList: [
      "#juejin > div.view-container.container > main > div > div > div > div > div > div > div > li:nth-child(11) > div > div.content-wrapper > div > div.title-row > a",
      "#juejin > div.view-container > main > div > div.sidebar.sidebar > div.sidebar-block.related-entry-sidebar-block.shadow > div.block-body > div > a:nth-child(1)",
      "#juejin > div.view-container > main > div > div.main-area.recommended-area.shadow > div.entry-list.list.recommended-entry-list > li:nth-child(1) > div > div.content-wrapper > div > div.title-row > a",
    ],
  },
  "lodash.com": {
    callback: lodash,
    // rehref: 'www.lodash.com'
  },
  "webpack.js.org": {
    // callback: webpack,
    rehref: "https://webpack.docschina.org",
  },
  "vuejs.org": {
    // callback: vue,
    rehref: "https://cn.vuejs.org",
  },
  "vitejs.dev": {
    rehref: "https://cn.vitejs.dev",
    // callback: vite,
  },
  "www.yyyweb.com": {
    callback: yyyweb,
  },
  "360yy.cn": {},
  "www.tiktok.com": {},
  "www.qidian.com": {
    callback: qidian,
  },
  "read.qidian.com": {
    callback: qidian,
  },
  "www.douyu.com": {
    callback: douyu,
  },
  "reactjs.org": {
    // callback: react
    rehref: "https://zh-hans.reactjs.org",
  },
  "www.jianshu.com": {
    callback: jianshu,
    scroll: ".note-list",
    selectorList: [
      "div.container.programmer > div > div.col-xs-18.col-xs-offset-8.main > div > ul > div:nth-child(2) > div > a",
      "#__next > div > div > aside > div > div.ant-affix > section:nth-child(2) > div:nth-child(2) > div > a",
      "#__next > div > div > div > section:nth-child(4) > ul > li:nth-child(1) > div > div > a",
    ],
  },
  "segmentfault.com": {
    callback: sifou,
  },
  "www.google.com": {
    callback: google,
    preventDefault: true,
    selectorList: [
      "#rso > div:nth-child(1) > div > div > div > a",
      "#rso > div:nth-child(1) > div > div > div > div > div > div > a",
      "#rso > div:nth-child(2) > div > div:nth-child(1) > div > div > div > div > a",
      "#rso > div > div > div > div > div > a",
    ],
  },
  "www.cnblogs.com": {
    callback: bokeyuan,
  },
  "momoyu.cc": {
    callback: momoyu,
    // 滚动事件绑定者
    el: "#app",
  },
  "www.xiaodao0.com": {
    callback: xiaodao,
  },
  "www.zhangxinxu.com": {
    callback: zhangxinxu,
    selectorList: [
      "#recent-posts-3 > ul > li:nth-child(1) > a",
      "#daily-top-10-posts > ul > li:nth-child(1) > a",
      "#most_commented_widget-4 > ul > li:nth-child(1) > a",
      "#content > div:nth-child(0) h2 > a",
    ],
  },
  "so.toutiao.com": {
    callback: toutiao,
  },
  "sso.iflytek.com:8443": {
    callback: iflytek,
  },
  "git.iflytek.com": {
    callback: gitlab,
  },
  "v3.vuejs.org": {
    rehref: "https://v3.cn.vuejs.org",
  },
  "www.bqxs520.com": {
    callback: biquge520,
  },
  "www.007hdys.com": {
    callback: hdys007,
  },
  "www.douyin.com": {
    callback: douyin,
  },
  "babeljs.io": {
    rehref: "www.babeljs.cn",
  },
  "cn.pornhub.com": {
    callback: pornhub,
    selectorList: [
      "#recommended-videos > li:nth-child(0) div > div.phimage > a",
      "#hotVideosSection > li:nth-child(0) div > div.phimage > a",
      "#hottestMenuSection > li:nth-child(0) div > div.phimage > a",
      "#mostViewedPerCountry > li:nth-child(0) div > div.phimage > a",
      "#mostViewedVerifiedAmateursSection > li:nth-child(0) div > div.phimage > a",
      "#topContentPartnersSection > li:nth-child(0) div > div.phimage > a",
      "#videoFeedsSection > li:nth-child(0) div > div.phimage > a",
      "#mostRecentVideosSection > li:nth-child(0) div > div.phimage > a",
      "#recommendedVideos > li:nth-child(0) div > div.thumbnail-info-wrapper.clearfix > span > a",
      "#relatedVideosCenter > li:nth-child(0) div > div.phimage > a",
    ],
  },
  "yt5.tv": {
    callback: yt5,
  },
  "91porny.com": {
    callback: porny91,
  },
  "www.imooc.com": {
    callback: muke,
  },
  "axios-http.com": {
    callback: axios,
  },
};

// mutationObsever配置
const config = {
  childList: true,
  subtree: true,
};

clearInterval(timer);

function main(mapInfo) {
  for (const k in list) {
    list[k].once = 0;
    if (host === k) {
      // 英文调中文网站
      if (list[k].rehref) {
        location.href = list[k].rehref + pathname;
        return false;
      }
      // ctrl + ⬇
      if (list[k].scroll) {
        function loadData(e) {
          if (e.keyCode === 40 && e.ctrlKey) {
            const a = $(list[k].scroll);
            window.scrollTo(0, a.offsetHeight);
          }
        }
        window.removeEventListener("keydown", loadData);
        window.addEventListener("keydown", loadData);
      }

      // ctrl + ⬇
      if (list[k].nextStep) {
        function loadData(e) {
          if (e.ctrlKey) {
            const btnList = getDomList(list[k].nextStep.nextStepList);
            const index = btnList.findIndex((it) =>
              it.classList.contains(list[k].nextStep.curActiveClass)
            );
            if (index === -1) return false;
            if (e.keyCode === 40) {
              // ctrl + ⬇
              if (!btnList[index + 1]) return;
              const needClickNode = btnList[index + 1].querySelector(
                list[k].nextStep.clickBtn
              );
              needClickNode.click();
            } else if (e.keyCode === 38) {
              // ctrl + ⬆
              if (!btnList[index - 1]) return;
              const needClickNode = btnList[index - 1].querySelector(
                list[k].nextStep.clickBtn
              );
              needClickNode.click();
            }
          }
        }
        window.removeEventListener("keydown", loadData);
        window.addEventListener("keydown", loadData);
      }

      const callback = function(mutationsList, observer) {
        logInfo("回调执行-observer");
        // addLinkListBox(getDomList("a"));
        list[k].callback &&
          list[k].callback(
            { ...params, ...list[k], ...mapInfo[host] },
            list[k]
          );

        if (list[k].selectorList) {
          const linkMap = collectAllLink(list[k].selectorList);
          if (JSON.stringify(linkMap) !== "{}") {
            chalk(linkMap, "linkMap");
            aLinkMap = linkMap;
          }
        }
      };
      const observer = new MutationObserver(callback);
      observer.observe(document, config);
      break;
    }
  }
}

function base64ToBlob(base64Data) {
  let arr = base64Data.split(","),
    fileType = arr[0].match(/:(.*?);/)[1],
    bstr = atob(arr[1]),
    l = bstr.length,
    u8Arr = new Uint8Array(l);

  while (l--) {
    u8Arr[l] = bstr.charCodeAt(l);
  }
  return new Blob([u8Arr], {
    type: fileType,
  });
}

function getWebUrl(file) {
  let url = null;
  if (window.createObjectURL != undefined) {
    // basic
    url = window.createObjectURL(file);
  } else if (window.URL != undefined) {
    // mozilla(firefox)
    url = window.URL.createObjectURL(file);
  } else if (window.webkitURL != undefined) {
    // webkit or chrome
    url = window.webkitURL.createObjectURL(file);
  }
  return url;
}

function axios() {
  if (pathname === "/") rerturn;
  if (!href.includes("/zh/")) {
    location.href = origin + "/zh/" + pathname;
  }
}

function muke() {
  const classList = [
    "wechat-box.js-wechat-box",
    "maskcode-block.js-maskcode-block",
  ];
  removeArrList(classList, ".");
}

function porny91() {
  setStyle(".modal-open", "overflow:auto");
  const classList = [
    "jsv.jsv-g1.mb-0 .container-fluid.mb-3.p-0",
    "mobile-adv.mobile-adv-bottom",
    "modal-backdrop",
  ];
  const adIdList = [
    "main .container-fluid.mb-3.p-0",
    "main .container-fluid.mb-0.p-0",
    "warningModal",
  ];
  removeArrList(classList, ".");
  removeArrList(adIdList, "#");
  const videoBox = $("#videoShowPage");
  videoBox &&
    [...videoBox.parentNode.children].forEach((it) => {
      if (it.id !== "videoShowPage") it.remove();
    });
  const videoListPage = $("#videoListPage");
  videoListPage &&
    [...videoListPage.parentNode.children].forEach((it) => {
      if (it.id !== "videoListPage") it.remove();
    });
  const skipBtn = $(".skip-btn.cursor-p");
  skipBtn && skipBtn.click();
}

function douyin() {
  if ($(".xgplayer-setting-playbackRatio").innerText === "1.5x") return;
  const menuList = [...$$(".xgplayer-playratio-item")];
  const btn1point5 = menuList.find((it) => it.innerText === "1.5x");
  btn1point5 && btn1point5.click();
  // const classList = [
  //   "login-guide-container",
  //   "mPWahmAI.screen-mask.login-mask-enter-done",
  //   "recommend-comment-login.recommend-comment-login-mask",
  // ];
  // removeArrList(classList, ".");
  // const adIdList = ["captcha_container"];
  // removeArrList(adIdList, "#");
  // const widnowBox = $(".windows-os");
  // if (widnowBox && widnowBox.children.length === 3) {
  //   widnowBox.children[0].remove();
  // }
}

// 007影视
function hdys007() {
  if (href.includes("/play/")) {
    const btnList = [...$$(".dslist-group-item")];
    function changeItem(e) {
      const code = e.keyCode;
      let index = btnList.findIndex((it) => it.classList.contains("on"));
      let clickBtn = null;
      if (code === 37) {
        const preBtn = btnList[--index];
        if (preBtn) {
          clickBtn = preBtn.querySelector("a");
          clickBtn && clickBtn.click();
        }
        // 上一个
      } else if (code === 39) {
        // 下一个
        const nextBtn = btnList[++index];
        if (nextBtn) {
          clickBtn = nextBtn.querySelector("a");
          clickBtn && clickBtn.click();
        }
      }
    }
    window.removeEventListener("keyup", changeItem);
    window.addEventListener("keyup", changeItem);
  }
}

// 笔趣阁
function biquge520() {
  // const contentDom = $('.box_con')
  // if (contentDom) {
  //   const newContentDom = contentDom.cloneNode(true)
  //   // chalk(newContentDom.innerText, '--');
  //   document.body.appendChild(newContentDom)
  // }
  // const classList = ['box_con']
  // removeArrList(classList, '.')
  // setStyle('.box_con', 'display:none;')
}

// iflytek自动登录
function iflytek() {
  // const loginBtn = document.querySelector('.user-btn')
  // loginBtn && loginBtn.click()
}

// gitlab
function gitlab() {
  proClick("oauth-login-cas3", {}, "id");
}
// react官网
// function react({
//   host,
//   pathname
// }) {
//   location.href = 'https://zh-hans.reactjs.org' + pathname
// }

// 今日头条
function toutiao() {}

// 张鑫旭官网
function zhangxinxu() {}

// 斗鱼
function douyu() {
  const adClassList = [
    "XinghaiAd",
    "SvgaPlayerDom",
    "Bottom-ad",
    "layout-Player-title",
    "layout-Player-toolbar",
    "react-draggable",
  ];
  removeArrList(adClassList, ".");
  proClick("wfs-2a8e83", {}, "class");
}

// 起点
function qidian() {
  const adIdList = [
    "topGameOp",
    "tr-banner",
    "banner-two",
    "banner3",
    "j-topHeadBox",
    "j_bodyRecWrap",
    "page-ops",
    "banner1",
    "j_guideBtn",
  ];
  const adClassList = [
    "game-link",
    "focus-img.cf",
    "top-bg-box",
    "topics-list.mb40.cf",
    "games-op-wrap",
    "right-op-wrap.mb10",
    "crumbs-nav.center990.top-op",
    "fans-zone",
  ];
  removeArrList(adIdList, "#");
  removeArrList(adClassList, ".");
  const linkList = [
    ...getDomList(".wrap .cf .fl li"),
    ...getDomList(".wrap .box-center .fl li"),
    ...getDomList(".wrap .box-center .rank-list .name-box"),
  ];
  addLinkListBoxPro(linkList, "qidian-toolbox");
}

// 樱桃
function yt5() {
  const adClassList = [
    "v-footer",
    "notice-container",
    "page-promotion.noticeShow",
    "page-promotion",
    "download-tip",
    "detail-share",
  ];
  removeArrList(adClassList, ".");
}
// 前端里
function yyyweb() {
  const adClassList = ["google-auto-placed"];
  removeArrList(adClassList, ".");
  removeAllFunc("[class*=adsbygoogle]");
}

function yyywebClick() {
  const adIdList = ["ad_position_box"];
  removeArrList(adIdList, "#");
}

// 百度
function baidu() {
  let results = [...$$("[id]")].filter((el) => el.id.match(/^\d+$/));
  results.filter((el) => $("[data-tuiguang]", el)).forEach((el) => el.remove());
  results = results
    .filter((el) => document.contains(el))
    .filter((el) => $("[class*=tuiguang]", el))
    .forEach((el) => el.remove());
  const content_right = document.getElementById("content_right");
  if (content_right)
    Array.from(content_right.children)
      .filter((el) => el.tagName !== "TABLE")
      .forEach((el) => el.remove());
  [...$$("#content_left")].forEach((el) => {
    [...el.children].forEach((el) => {
      console.log(el, el.className);
      if (!el.className) {
        el.remove();
      }
    });
  });
}
// 百度文库
function wenku() {
  if ($(".read-all")) {
    $(".read-all").click();
    removeAllFunc("[class*=hx]");
    removeAllFunc("[class*=vip]");
  }
  removeFunc(".fwk_gH");
  removeFunc(".fengchaoad");
}
// 脚本之家
function jiaobenzhijia() {
  removeAllFunc("[class*=logo]");
  removeAllFunc("[class*=blank]");
  removeAllFunc("[class*=dxy]");
  removeAllFunc("[class*=lbd]");
  removeAllFunc("[class*=google-]");
  removeFunc("#aswift_1");
  $$("#article>.clearfix")[0];
  removeFunc("#article>.clearfix>div");
  removeAllFunc("#txtlink, .mainlr, .main-right, .topimg");
}
// 百度经验
function baidujingyan() {
  removeAllFunc(
    "#aside, #wgt-like, #fresh-share-exp-e, #wgt-exp-share, .task-panel-entrance"
  );
}
// 哔哩哔哩
function bilibili(payload, origin) {
  videoPlay(payload.videoPlayRate);
  // removeAllFunc("[id*=Ad], [class*=activity]");
  // removeAllFunc(
  //   "[id*=ad-], [id*=ad-], [class*=-ad], [class*=ad-], [id*=Ad], [id*=recommand]"
  // );
  removeFunc(".extension");
  removeFunc("#bili_live>a");
  removeAllFunc(".banner-card.b-wrap");
  const linkList = [
    ...getDomList("#app .video-card-reco .info-box"),
    ...getDomList(".b-wrap .zone-list-box .video-card-common", ".card-pic"),
    ...getDomList(".video-list .video-item>a"),
  ];
  addLinkListBoxPro(linkList, "bilibili-toolbox");
  // 跳过连播按钮
  const btn = $(".bilibili-player-electric-panel-jump");
  btn && btn.click();

  let speedBtn = $(".bilibili-player-video-btn-speed-name");
  if (
    origin.once ||
    (speedBtn && speedBtn.innerHTML === payload.videoPlayRate + "x")
  )
    return;

  proClick("倍速");
  proClick(
    "bilibili-player-video-btn-speed-menu-list",
    {
      all: true,
      i: 1,
    },
    "class"
  );
  origin.once++;
}
// it屋
function it1352() {
  removeAllFunc(".row.hidden-sm");
}
// 未知
function alexacn() {
  removeAllFunc("[class*=important]");
}
// 樱花动漫
function yinghuadongman() {
  removeAllFunc("[id*=HM], #fix_bottom_dom");
  removeArrList(["HMRichBox", "fix_bottom_dom"], "#");
}
// 笔趣阁
function biquge() {
  removeAllFunc("[id*=cs_]");
  removeAllFunc(".dahengfu");
  removeAllFunc(".box_con>table");
  removeAllFunc(".box_con>p");
  removeAllFunc("#content>p:last-child");
}
// 4hu
function hu4tv() {
  // #midBox
  const adList = [
    "midBox",
    "coupletLeft",
    "coupletRight",
    "listBox",
    "btmBox",
    "popBox",
    "maskBox",
  ];
  setStyle("body", "overflow:auto");
  removeArrList(adList, "#");
  if (pathname !== "/") {
    $$(".wrap").length === 6 && $$(".wrap")[0].remove();
  }
}
// csdn
function csdn() {
  const classList = ["passport-login-container"];
  removeArrList(classList, ".");
}
// youtube
function youtube(payload) {
  setStyle(".html5-video-player", "display: block");
  const menusList = [...$$(".ytp-menuitem")];
  if (menusList.some((it) => it.innerText === "播放速度1.5")) return;
  // videoPlay(payload.videoPlayRate);
  const settintBt = $(".ytp-button.ytp-settings-button.ytp-hd-quality-badge");
  settintBt && settintBt.click();
  const videoPalyRateBtn = menusList.find((it) =>
    it.innerText.includes("播放速度")
  );
  videoPalyRateBtn && videoPalyRateBtn.click();
  // .ytp-menuitem-label = 1.5
  const Btn1point5 = [...$$(".ytp-menuitem-label")].find((it) =>
    it.innerText.includes("1.5")
  );
  if (Btn1point5) {
    Btn1point5.click();
  }
}

function mdn({ href, pathname, origin }) {
  const zh = "zh-CN";
  if (!this.once && !href.includes(zh)) {
    const pathList = pathname.split("/");
    pathList[1] = zh;
    const newHref = pathList.join("/");
    sendReq(
      newHref,
      (res) => {
        const newUrl = origin + newHref;
        location.href = newUrl;
      },
      (err) => {},
      () => {
        this.once = true;
      }
    );
  }
}

function zhihu({ href, win }) {
  const adClassList = [
    "Post-SideActions",
    "Card.TopstoryItem.TopstoryItem--old.TopstoryItem--advertCard.TopstoryItem-isRecommend",
    "Pc-card.Card>a",
    "Sticky>a",
    "Card.TopstoryItem.TopstoryItem--advertCard.TopstoryItem-isRecommend",
  ];
  removeArrList(adClassList, ".");
  rmSomeSelf(
    ".Card.TopstoryItem.TopstoryItem--old.TopstoryItem-isFollow",
    ".advert-signpc-label"
  );
  rmSomeSelf(
    ".Card.TopstoryItem.TopstoryItem--old.TopstoryItem-isRecommend",
    ".advert-signpc-label"
  );
  const throlleRemove = throttle(removeArrList, 300);
  // win.addEventListener("scroll", function scroll() {
  //   throlleRemove(adClassList, ".");
  // });
  // const includesList = ['web', 'js', 'javascript', 'node', 'npm', 'github', 'jquery', 'css', 'html', '音视频', '前端', 'vue', 'react', 'nginx', 'webpack', 'http', 'websocket', 'ts', 'typescript', 'chrome', 'linux', 'iframe', 'electron', 'es6', 'es7', 'es8', 'es9', 'es10', 'es11', 'es12', 'async', 'await']
  // const root = document.querySelector('#root')
  // let linkList = Array.from(root.querySelectorAll('a'))
  // linkList = linkList.filter(link => {
  //   logInfo(link.innerText || ('innerText' in link.firstElementChild && link.firstElementChild.innerText), '--------');
  //   return includesList.some(item => (link.innerText || ('innerText' in link.firstElementChild && link.firstElementChild.innerText) || "").toLowerCase().includes(item))
  // })
  // addLinkListBox(linkList, 'zhihu-toolbox')
  // const boxList = $$('.Card.TopstoryItem.TopstoryItem-isRecommend')
  // boxList.forEach(it => {
  //   const text = it.innerText
  //   includesList.forEach(t => {
  //     if (!text.includes(t.toLocaleLowerCase())) {
  //       chalk(text, '---text');
  //       it && it.remove()
  //     }
  //   })
  // })
}

function juejin(payload, juejinObj) {
  // setStyle(".sticky-block-box", "height:100%");
  // setStyle(".sticky-block-box .sidebar-block", "height:100%");
  // setStyle(".sticky-block-box .sidebar-block .article-catalog", "height:100%");
  // setStyle(
  //   ".sticky-block-box .sidebar-block .article-catalog .catalog-body",
  //   "max-height:calc(100% - 2rem)"
  // );
  rmSomeSelf(".entry-list>.item", ".tag");
  const a = $(".panel-btn.with-badge");
  if (a && !a.classList.contains("active") && payload.once === 0) {
    a.click();
    juejinObj.once++;
  }
}
// 简书
function jianshu() {
  // iframe的广告都给他干掉
  const c = document.querySelectorAll("iframe");
  Array.from(c).forEach((it) => it.remove());

  // setStyle('._3Pnjry', 'right: 200px;left:unset')
  // const linkList = [...getDomList('._1iTR78 .em6wEs>a'), ...getDomList('.itemlist-box .content>a'), ...getDomList('._3Z3nHf ._26Hhi2 a'), ...getDomList('._3Z3nHf .cuOxAY a')]
  // addLinkListBox(linkList, 'jianshu-toolbox')
}
// 思否
function sifou() {
  // setStyle('.d-none.col-2', 'position:fixed!important;right:0;')
  // const linkList = [...getDomList('.content-list-wrap .list-group-flush .list-group-item h5 a'), ...getDomList('.article-content h3 a')]
  // addLinkListBox(linkList, 'sifou-toolbox')
}

// google
function google() {
  // const linkList = [...getDomList('.g .yuRUbf>a')]
  // addLinkListBox(linkList, 'google-toolbox')
}
// 博客园
function bokeyuan() {
  // setStyle('#main_content', 'max-width:1200px;margin:auto')
  // setStyle('#post_list', 'width: 800px')
  // const linkList = [...getDomList('#post_list .post-item .post-item-title'), ...getDomList('#side_right .item-list a')]
  // addLinkListBox(linkList, 'bokeyuan-toolbox')
}
// 摸摸鱼
function momoyu() {
  // const linkList = [...getDomList('.content .hot-outer ul li a')]
  // addLinkListBox(linkList, 'momoyu-toolbox')
}
// 小刀娱乐网
function xiaodao() {
  // const linkList = [...getDomList('#CommonListCell .post-list .post-title a'), ...getDomList('.LanMu_WenZhangCeBianLan ul li a')]
  // addLinkListBox(linkList, 'xiaodao-toolbox')
}

function lodash({ href, win }) {
  if (host.includes("www.")) return;
  const s = href.replace("lodash.com", "www.lodashjs.com");
  location.href = s;
}

function pornhub() {
  removeFunc("#hd-rightColVideoPage");
  removeFunc("li.sniperModeEngaged.alpha");
  const adIdList = ["pb_content", "pb_top_bar"];
  removeArrList(adIdList, "#");
}

function github() {
  const linkList = [
    ...getDomList(".d-md-flex .d-flex h3"),
    ...getDomList(".repo-list .d-flex .f4.text-normal a"),
  ];
  let aLinkStr = "",
    linkListStr = "";
  linkList.forEach((item) => {
    const itemList = Array.from(item.querySelectorAll("a"));
    if (itemList.length <= 0) return;
    itemList.forEach((it) => {
      aLinkStr += `<a href='${it.toString()}' rel="noopener noreferrer" target="_blank">${
        it.innerText
      }</a>`;
    });
    linkListStr += `<li>${aLinkStr}</li>\n`;
    aLinkStr = "";
  });
  addLinkListBox([], "xiaodao-toolbox", linkListStr);
}
//  https://product.pconline.com.cn/ class: fixLeftQRcode  id:xuanfu_wapper

const vueFlag = vueAroundList.some((it) => host === it);
if (vueFlag && !href.includes("/zh/")) {
  let s = location.origin + "/zh/" + location.pathname;
  location.href = s;
}

// setTimeout(function () {
//   let performance_end = performance.now();
//   const time = performance_end - performance_now;
//   logInfo("加载时间" + "===>" + time);
// }, 0);

setTimeout(function() {
  return false;

  function removeAd(e) {
    const target = e.target;
    const targetList = Array.from(e.target.classList);
    if (targetList.includes("remove-ad-box") || target.nodeName === "BODY")
      return;
    e.preventDefault();
    let domStr = "";
    if (targetList.length > 0) {
      domStr = "." + targetList.join(".");
    } else if (target.id) {
      domStr = "#" + target.id;
    } else {
      const parent = target.parentNode;
      const parentClassList = Array.from(parent.classList);
      if (parentClassList.length > 0) {
        domStr =
          "." + parentClassList.join(".") + ">" + target.nodeName.toLowerCase();
      } else {
        domStr = "#" + target.id + ">" + target.nodeName.toLowerCase();
      }
    }
    try {
      domStrList.push(domStr);
      log(domStrList, "domStrList");
      const dom = document.querySelector(domStr);
      dom.remove();
    } catch (error) {}
  }
}, 0);

function sendMessage(
  object = {},
  fn = function(response) {
    logInfo(response, "response-content");
  }
) {
  try {
    chrome.runtime.sendMessage(object, fn);
  } catch (error) {
    logInfo("发送消息错误", error);
  }
}

// 需要跳转的a链接直接跳转
function goOtherLink(e) {
  let target = e.target;
  function handle(target) {
    if (!target) return;
    if (doSth(target)) return;
    const preventDefault = list[host].preventDefault || false;
    // todo preventDefault是否需要？
    preventDefault && e.preventDefault();
    if (target.nodeName === "A" && target.href) {
      e.stopPropagation();
      const otherObj = otherSiteHref(target.href, host);
      if (otherObj.needChange) {
        gotoLink(otherObj.href);
        return true;
      }
      if (aLinkMap[target.href]) {
        gotoLink(target.href);
        return true;
      }
      if ("click" in target) {
        item.click();
      }
      console.log({ otherObj }, { hrefTitle: aLinkMap[target.href] });
    }
    return false;
  }
  if (handle(target)) return;
  target = isParentNodeA(target);
  if (handle(target)) return;
}
window.removeEventListener("click", goOtherLink);
window.addEventListener("click", goOtherLink);
