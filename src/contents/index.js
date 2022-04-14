// import '../assets/index.scss'
import {
  mouseClick,
  copyTargetText,
  autoSelect,
  boxInfo,
  defaultparams,
  // hrefChange,
  otherSiteHref,
  unDef,
} from "../modules/common.js";
import { ajax } from "../modules/ajax.js";
let performance_now = performance.now(),
  liListStr = "", // 链接列表字符串
  linkObj = {},
  timer = null,
  win = "",
  youtubeFlag = false, // YouTube中文翻译只设置一次
  configParams = {
    mapInfo: {},
  }, // popup配置参数
  cached = {}; // 缓存起来

const { location } = window;
const { href, host, pathname, origin, search, protocol } = location;
const { log, error, dir } = console;
const vueAroundList = ["router.vuejs.org", "vuex.vuejs.org", "cli.vuejs.org"];

// 获取配置参数
chrome.storage.sync.get(null, function(result) {
  configParams = {
    ...configParams,
    ...result,
    host,
  };
  if (configParams && configParams.mapInfo && !configParams.mapInfo[host]) {
    configParams.mapInfo[host] = {
      ...configParams.mapInfo[host],
      videoPlayRate: defaultparams.videoPlayRate,
      fanyiFlag: defaultparams.fanyiFlag,
    };
  }
  console.log(configParams, result, "configParams");
  chrome.storage.sync.set({ ...configParams, host }, function() {});
  commonEvents(configParams);
  copyTargetText();
  autoSelect();
  logInfo(result, configParams, "storage-get");
});

console.log(chrome, "chrome");

// 接收配置消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  configParams = {
    ...configParams,
    ...request,
  };
  commonEvents(configParams);
  // logInfo(
  //   request,
  //   configParams,
  //   "接收消息",
  //   (configParams.mapInfo[host] || {}).videoPlayRate ||
  //     defaultparams.videoPlayRate
  // );
  sendResponse({
    host,
    str: "我收到了你的情书， popup~",
  });
});

// 初始化跟修改配置后的公共触发事件
function commonEvents(configParams) {
  // 跳转网址
  replaceHref(configParams);
  // 键盘点击事件
  if (!cached["mouseClick"]) mouseClick(configParams);
  cached["mouseClick"] = mouseClick;
  // 添加/移除错误监听
  removeErrListening(configParams);
  // 切换视频播放速度
  videoPlay(
    unDef((configParams.mapInfo[host] || {}).videoPlayRate)
      ? defaultparams.videoPlayRate
      : configParams.mapInfo[host].videoPlayRate
  );
  // 设置是否翻译
  setFanyi(
    unDef((configParams.mapInfo[host] || {}).fanyiFlag)
      ? defaultparams.fanyiFlag
      : configParams.mapInfo[host].fanyiFlag
  );
  // 切换收集a链接
  configParams.mapInfo[host].collectInfoFlag =
    configParams.mapInfo &&
    configParams.host &&
    configParams.mapInfo[host].collectInfoFlag;
}

function addNewElement(innerhtml, node, src) {
  const element = document.createElement(node);
  if (src) {
    element.src = innerhtml;
  } else {
    element.innerHTML = innerhtml;
  }
  document.getElementsByTagName("head")[0].appendChild(element);
}

function setFanyi(fanyiFlag) {
  // 谷歌翻译
  // 不翻译的列表
  const fanYiList = [
    "stackoverflow.com",
    "www.npmjs.com",
    "developer.chrome.com",
  ];
  const fanyiFlag1 = fanYiList.some((item) => host === item);

  if (fanyiFlag || fanyiFlag1) {
    // 隐藏顶部栏
    const { head } = document;
    const style = document.createElement("style");
    const text = [
      // 翻译按钮样式设置
      "#google_translate_element {",
      "  position: fixed;",
      "  width: 80px;", // 按钮宽度(仅PC端生效)
      "  left: 0px;", // 左侧边距离设置；如果要靠右设置，left改成right即可
      "  bottom: 25px;", // 距离底部高度
      "  height: 22px;", // 按钮高度
      "  border: 2px solid #0000;", // 边框线设置
      "  border-radius: 5px;", // 边界半径设置
      "  z-index: 10000000;",
      "  overflow: hidden;",
      "  box-shadow: 1px 1px 3px 0 #0000;", // 外边框阴影设置
      "  opacity: 0.4;", // 初始透明度设置
      "  transform: translateX(-75%);", // 按钮隐藏百分比设置(仅PC端生效)
      "  transition: all 0.3s;",
      "}",
      "#google_translate_element:hover {",
      "  opacity: 1;", // 透明度设置
      "  transform: translateX(0);",
      "}",
      "#google_translate_element .goog-te-gadget-simple {",
      "  width: 100%;",
      "}",
      ".goog-te-banner-frame.skiptranslate {",
      "  display: none",
      "}",
      "html,body{",
      "  top: 0!important",
      "}",
      // 原文按钮样式设置
      ".recoverPage {",
      "  width: 45px;", // 按钮宽度(仅PC端生效)
      "  background-color: #F0F8FF;", // 背景色设置
      "  position: fixed;",
      "  left: -5px;", // 左侧边距离设置；如果要靠右设置，left改成right即可
      "  z-index: 10000000;",
      "  bottom: 50px;", // 距离底部高度
      "  user-select: none;",
      "  text-align: center;",
      "  border: 1px solid #a8a8a8;", // 边框线设置
      "  font-size: small;",
      "  line-height: 25px;", // 按钮高度设置(仅PC端生效)
      "  border-radius: 15px;", // 边界半径设置
      "  box-shadow: 1px 1px 3px 0 #C0C0C0;", // 外边框阴影设置
      "  opacity: 0.4;", // 初始透明度设置
      "  transform: translateX(-70%);", // 按钮隐藏百分比设置(仅PC端生效)
      "  transition: all 0.3s;",
      "  }",
      ".recoverPage:hover {",
      "  opacity: 1;", // 透明度设置
      "  transform: translateX(0);",
      "  }",
      ".recoverPage:active {",
      "  box-shadow: 1px 1px 3px 0 #888 inset;",
      "  }",

      /* ----移动端UI适配设置（PC端不生效）-----------------------------------------*/
      " @media handheld, only screen and (max-width: 768px) {",
      // 翻译按钮样式设置
      " #google_translate_element {",
      "  width: 104px;", // 按钮宽度
      "  }",
      "  #google_translate_element .goog-te-combo {",
      "  margin: 0;",
      "  padding-top: 2px;",
      "  border: none;",
      "  }",
      // 原文按钮样式设置
      " .recoverPage {",
      "  width: 34px;", // 按钮宽度
      "  line-height: 24px;", // 按钮高度设置
      "  transform: translateX(-40%);", // 按钮隐藏百分比设置
      "  transform: translateX(1);", // 隐藏功能开关，0为关闭；1为打开
      "  }",
      "  }",
    ].join("\n");
    const style_text = document.createTextNode(text);
    style.appendChild(style_text);
    head.appendChild(style);

    // 恢复原网页按钮设置
    const initScript = document.createElement("script");
    const initText = document.createTextNode(
      [
        // 清除图片的请求，加快访问速度
        "  img = [].slice.call(document.querySelectorAll('#goog-gt-tt img,#google_translate_element img'));",
        "  img.forEach(function(v, i){",
        "   v.src = '';",
        "  });",

        "  const recoverPage = document.createElement('div')",
        "  recoverPage.setAttribute('class', 'notranslate recoverPage')",
        "  recoverPage.innerText = '原文'",
        "  document.body.appendChild(recoverPage)",
        "  recoverPage.onclick = (() => {",
        "  const phoneRecoverIframe = document.getElementById(':1.container')",
        "  const PCRecoverIframe = document.getElementById(':2.container')",
        "    if (phoneRecoverIframe) {",
        "      const recoverDocument = phoneRecoverIframe.contentWindow.document",
        "      recoverDocument.getElementById(':1.restore').click()",
        " } else if (PCRecoverIframe) {",
        "      const recoverDocument = PCRecoverIframe.contentWindow.document",
        "      recoverDocument.getElementById(':2.restore').click()",
        "    }",
        "  })",
      ].join("\n")
    );
    initScript.appendChild(initText);
    head.appendChild(initScript);

    // 翻译按钮设置
    const google_translate_element = document.createElement("div");
    google_translate_element.id = "google_translate_element";
    document.documentElement.appendChild(google_translate_element);

    const gtehtml =
      "function googleTranslateElementInit() {" +
      "new google.translate.TranslateElement({" +
      "autoDisplay: true," +
      "layout: google.translate.TranslateElement.InlineLayout.SIMPLE," +
      "multilanguagePage: true," +
      "pageLanguage: 'auto'," +
      "includedLanguages: 'zh-CN,zh-TW,en,ja,ru'" +
      "}, 'google_translate_element');}";

    addNewElement(gtehtml, "script", false);
    // addNewElement(
    //   "https://cdn.jsdelivr.net/gh/zs6/gugefanyijs@1.9/element.js",
    //   "script",
    //   true
    // );

    //   google翻译的网址  //translate.google.com/translate_a/element.js?cb=googleTranslateElementInit
    // https://cdn.jsdelivr.net/gh/zs6/gugefanyijs@1.9/element.js
    addNewElement(
      "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit",
      "script",
      true
    );

    // 翻译按钮
    (function ziDongFanYi() {
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
    })();
  }
}

function replaceHref(configParams) {
  const needChange = otherSiteHref(href).needChange;
  const noChange = (configParams.noChangeHrefList || []).some((it) =>
    host.includes(it)
  );
  if (needChange && !noChange) {
    // location.replace(hrefChange(href))
    location.replace(otherSiteHref(href).href);
  }
}

function removeErrListening(configParams) {
  // 错误监听
  const needRecord = (configParams.recordErrorList || []).some((it) =>
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

function $$(domStr, dom = document) {
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
function videoPlay(rate = 1.5, index = 0) {
  logInfo("视频加速");
  if (index > 10) {
    return false;
  }
  index++;
  const video = $("video");
  if (video) {
    const realRate = Number(rate) === rate ? rate : 1.5;
    if (video.playbackRate !== realRate) {
      video.autoplay = true;
      video.playbackRate = realRate;
    } else if (!video.paused) {
      video.play();
      return;
    }
  } else {
    setTimeout(() => {
      videoPlay();
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
      configParams.host &&
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
          console.log("这里是success函数", data);
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

// 跳转方法
function gotoLink(href) {
  const a = document.createElement("a");
  a.target = "_blank";
  a.rel = "noopener noreferrer nofollow";
  a.href = href;
  a.click();
  a.remove();
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
  "www.4hu.tv": {
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
  },
  "developer.mozilla.org": {
    callback: mdn,
  },
  "github.com": {
    callback: github,
  },
  "www.zhihu.com": {
    callback: zhihu,
  },
  "juejin.cn": {
    callback: juejin,
    scroll: ".entry-list",
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
  "cn.pornhub.com": {
    callback: pornhub,
  },
  "www.yyyweb.com": {
    callback: yyyweb,
  },
  "yt5.tv": {
    callback: yt5,
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
  },
  "segmentfault.com": {
    callback: sifou,
  },
  "www.google.com": {
    callback: google,
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
};

// mutationObsever配置
const config = {
  childList: true,
  subtree: true,
};

clearInterval(timer);

function main() {
  // 获取所有a链接
  const callback = function(mutationsList, observer) {
    addLinkListBox(getDomList("a"));
  };
  const observerGetLinks = new MutationObserver(callback);
  observerGetLinks.observe(document, config);
  for (const k in list) {
    // logInfo(host, k, "看看走的是哪一个");

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
        list[k].callback && list[k].callback(params);
      };
      const observer = new MutationObserver(callback);
      observer.observe(document, config);
      break;
    }
  }
}
main();

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

function keyUp(e) {
  const code = e.keyCode;
  // ctrl + , 下载所有图片
  if (e.ctrlKey && code === 188) {
    let downloadImgList = [],
      type = null;
    const imgList = [...$$("img")]
      .map((it) => it.dataset.src || it.src)
      .filter(Boolean);
    imgList.forEach((t) => {
      let url = null;
      if (t.startsWith("data")) {
        let start = t.indexOf("/");
        let end = t.indexOf(";");
        if (start !== -1 && end !== -1) {
          type = t.slice(start + 1, end);
        }
        url = getWebUrl(base64ToBlob(t));
      } else if (t.startsWith("blob")) {
        url = getWebUrl(t);
      } else if (t.startsWith("http")) {
        url = t;
      }
      downloadImgList.push(url);
    });
    downloadImgList.forEach((t, i) => {
      const imgDom = document.createElement("a");
      imgDom.href = t;
      const date = new Date();
      imgDom.download =
        date.toLocaleDateString() +
        "-" +
        date.toLocaleTimeString() +
        "-" +
        Math.random() +
        i +
        "." +
        type;
      imgDom.click();
      imgDom.remove();
    });
  }
}
window.removeEventListener("keydown", keyUp);
window.addEventListener("keydown", keyUp);

function douyin() {
  const classList = [
    "login-guide-container",
    "mPWahmAI.screen-mask.login-mask-enter-done",
    "recommend-comment-login.recommend-comment-login-mask",
  ];
  removeArrList(classList, ".");
  const adIdList = ["captcha_container"];
  removeArrList(adIdList, "#");
  const widnowBox = $(".windows-os");
  if (widnowBox && widnowBox.children.length === 3) {
    widnowBox.children[0].remove();
  }
}

// 007影视
function hdys007() {
  // const iframe = $("#player_swf");
  // if (iframe) {
  //   // gotoLink(iframe.src)
  //   console.log(iframe.src, "------");
  // }
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
  //   // console.log(newContentDom.innerText, '--');
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
function toutiao() {
  // const linkList = [...getDomList('.s-result-list .cs-view-block .text-darker a'), ...getDomList('.sldebar_out .silebar_inner li a')]
  // addLinkListBox(linkList)
}

// 张鑫旭官网
function zhangxinxu() {
  // const linkList = [...getDomList('#content .status-publish h2 a'), ...getDomList('.sldebar_out .silebar_inner li a')]
  // addLinkListBox(linkList, 'zhangxinxu-toolbox')
}

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
  // window.addEventListener('keyup', function (e) {
  //   if (e.keyCode === 13) {
  //     proClick('j_chapterNext', {}, 'id')
  //   }
  // })
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
function bilibili() {
  // removeAllFunc("[id*=Ad], [class*=activity]");
  // removeAllFunc(
  //   "[id*=ad-], [id*=ad-], [class*=-ad], [class*=ad-], [id*=Ad], [id*=recommand]"
  // );
  removeFunc(".extension");
  removeFunc("#bili_live>a");
  removeAllFunc(".banner-card.b-wrap");
  if ($$(".bilibili-player-video-btn-speed-name").innerHTML === "1.5x") return;
  proClick("倍速");
  proClick(
    "bilibili-player-video-btn-speed-menu-list",
    {
      all: true,
      i: 1,
    },
    "class"
  );
  const linkList = [
    ...getDomList("#app .video-card-reco .info-box"),
    ...getDomList(".b-wrap .zone-list-box .video-card-common", ".card-pic"),
    ...getDomList(".video-list .video-item>a"),
  ];
  addLinkListBoxPro(linkList, "bilibili-toolbox");
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

  // const linkCount = $('#spanCount')
  // if (!linkCount.classList.contains('active')) {
  //   linkCount.parentNode.click()
  // }
}
// youtube
function youtube() {
  setStyle(".html5-video-player", "display: block");
  videoPlay(
    unDef((configParams.mapInfo[host] || {}).videoPlayRate)
      ? defaultparams.videoPlayRate
      : configParams.mapInfo[host].videoPlayRate
  );
  // const video = $("video");
  // if (video) {
  //   // youtubeFlag = true;
  //   video.addEventListener("canplay", (e) => {
  //     const zimuShowBtn = $(".ytp-subtitles-button.ytp-button");
  //     if (zimuShowBtn.ariaPressed !== "true") {
  //       zimuShowBtn.click();
  //     }
  //     // 字幕文本
  //     const zimuText = $(".captions-text");
  //     if (zimuText) return false;
  //     // 打开面板按钮
  //     const pannel = $(".ytp-button.ytp-settings-button");
  //     pannel && pannel.click();
  //     // 左侧  字幕（1）
  //     const zimuTxt = [...$$(".ytp-menuitem-label")];
  //     let zimuTxtBtn = null;
  //     zimuTxt.forEach((t) => {
  //       if (t.innerText.includes("字幕")) {
  //         zimuTxtBtn = t;
  //       }
  //     });
  //     // 设置中文
  //     if (zimuTxtBtn) {
  //       const parentBox = zimuTxtBtn.parentNode;
  //       if (
  //         parentBox
  //           .querySelector(".ytp-menuitem-content")
  //           .innerText.includes("中文")
  //       ) {
  //         return;
  //       }
  //       parentBox.click();
  //       console.log("当前不是中文字幕");
  //       const languateBtnList = [...$$(".ytp-menuitem")];
  //       let needChooseLanguage = false;
  //       languateBtnList.some((t) => {
  //         if (t.innerText.includes("中文")) {
  //           t.click();
  //           return true;
  //         } else if (t.innerText.includes("自动翻译")) {
  //           console.log(t.innerText, "t.innerText");
  //           t.click();
  //           needChooseLanguage = true;
  //           return true;
  //         } else {
  //           return false;
  //         }
  //       });
  //       // 自动翻译要多走一步
  //       if (needChooseLanguage) {
  //         const languateBtnList2 = [...$$(".ytp-menuitem")];
  //         languateBtnList2.some((t) => {
  //           if (t.innerText.includes("中文（简体）")) {
  //             t.click();
  //             return true;
  //           }
  //           return false;
  //         });
  //       }
  //       $$(".ytp-panel")[0].style.display = "none";
  //       pannel.click();
  //     }
  //   });
  // }
}

function mdn({ href, win }) {
  const window = win;
  const us = "en-US";
  const zh = "zh-CN";
  const mdn = `${location.protocol}//${location.host}/`;
  // 上一次的 lastUrlStr
  let perUrlStr = "";
  // https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API
  const urlStr = href.split(mdn)[1];
  const index = urlStr.indexOf("/");
  // const needReplaceStr = urlStr.slice(0, index)
  const lastUrlStr = urlStr.slice(index);
  const noChinese = document.querySelector(".page-content-container>h1");
  if (noChinese && noChinese.innerText.includes("Page not found")) {
    // if (href.includes(us)) {
    window.history.back();
    return;
  } else {
    const noChangeLanguageBtn = document.querySelector(".show-desktop");
    const selectDom = document.getElementById("language-selector");
    if (selectDom) {
      const options = selectDom.querySelectorAll("option");
      const flag = Array.from(options).some((item) => item.value === zh);
      if (!flag) return;
    }
    if (!noChangeLanguageBtn || !noChangeLanguageBtn.innerText) {
      return;
    }
    if (href.includes(zh)) return;
    perUrlStr = lastUrlStr;
    location.href = mdn + zh + lastUrlStr;
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
  win.addEventListener("scroll", function scroll() {
    throlleRemove(adClassList, ".");
  });
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
  //       console.log(text, '---text');
  //       it && it.remove()
  //     }
  //   })
  // })
}

function juejin() {
  // setStyle('.article-suspended-panel.article-suspended-panel', 'right: 17rem;margin-right:unset')
  setStyle(".sticky-block-box", "height:100%");
  setStyle(".sticky-block-box .sidebar-block", "height:100%");
  setStyle(".sticky-block-box .sidebar-block .article-catalog", "height:100%");
  setStyle(
    ".sticky-block-box .sidebar-block .article-catalog .catalog-body",
    "max-height:calc(100% - 2rem)"
  );
  rmSomeSelf(".entry-list>.item", ".tag");
  // const linkList = [...getDomList('.content-wrapper .title-row a'), ...getDomList('.result-list .item .title-row a')]
  // addLinkListBox(linkList, 'juejin-toolbox')
  const a = $(".panel-btn.with-badge");
  if (a && !a.classList.contains("active")) {
    a.click();
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

// 所有跳转方法
function tiaozhuan() {
  // window.addEventListener('click', function (e) {
  //   // 键盘点击事件触发，就不触发这个。
  //   if (ifMouseDownNoClick) return
  //   commonTiaozhuan(e)
  // })
}

// 公共跳转方法
function commonTiaozhuan(e, needGo) {
  logInfo(e, "有href的node元素", e.target);
  let href = "",
    newHref = "",
    targetReal = null,
    eventType = null;
  // a链接也有target属性，但是他的target是个字符串，点击事件的target是个元素
  if (e && e.target && e.target.nodeName) {
    targetReal = e.target;
    eventType = true;
  } else {
    targetReal = e;
  }
  if (targetReal.href) {
    href = targetReal.href;
  } else if (targetReal.parentNode && targetReal.parentNode.href) {
    href = targetReal.parentNode.href;
  }
  // const index = href.lastIndexOf('http')
  // if (index !== -1) {
  //   newHref = href.slice(index)
  // }
  // newHref = hrefChange(href)
  newHref = otherSiteHref(href).href;
  // 判断是否为网址，是网址可以直接跳转
  if (newHref) {
    const hrefStr = decodeURIComponent(newHref);
    eventType && e.preventDefault();
    gotoLink(hrefStr);
  }
  // 点击事件里不需要多次一举，键盘事件的点击需要
  if (needGo) {
    gotoLink(decodeURIComponent(newHref));
  }
}

const vueFlag = vueAroundList.some((it) => host === it);
if (vueFlag && !href.includes("/zh/")) {
  let s = location.origin + "/zh/" + location.pathname;
  location.href = s;
}

// 去除copy之后的尾巴
document.addEventListener("copy", function(e) {
  e.preventDefault();
  const selection = window.getSelection().toString();
  e.clipboardData.setData("text/plain", selection);
});

// 页面离开事件
// window.addEventListener('beforeunload', function (event) {})

setTimeout(function() {
  let performance_end = performance.now();
  const time = performance_end - performance_now;
  logInfo("加载时间" + "===>" + time);
}, 0);

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

// tiaozhuan()
window.addEventListener("visibilitychange", function(event) {
  if (document.hidden) return;
  sendMessage({
    liListStr,
    linkObj,
  });
});

function sendMessage(
  object = {},
  fn = function(response) {
    logInfo(response, "response-content");
  }
) {
  object = {
    ...object,
    host,
    href,
  };
  chrome.storage.sync.set({ ...configParams, host }, function() {});
  try {
    chrome.runtime.sendMessage(object, fn);
  } catch (error) {
    logInfo("发送消息错误", error);
  }
}

window.addEventListener("blur", (e) => {
  boxInfo("no focus", false);
});

window.addEventListener("focus", (e) => {
  boxInfo("has focus");
});

// var xhr = new XMLHttpRequest();
// xhr.onreadystatechange = function() {
//   if (xhr.readyState == 4) {
//     if ((xhr.status >= 200 && xhr.status < 300) || xhr.status == 304) {
//       console.log(xhr.responseText);
//     }
//   }
// };
// xhr.onerror = function() {
//   console.log("%c请求失败", "color:red;font-size:30px");
// };
// xhr.open("post", "http://localhost:88/image1", true);
// xhr.send(null);
