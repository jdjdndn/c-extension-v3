/*
 * @Author: yucheng
 * @Date: 2022-01-01 16:28:16
 * @LastEditTime: 2022-04-04 15:40:59
 * @LastEditors: yucheng
 * @Description: ..
 */

export const commonDefault = {
  videoPlayRate: 1.5, // 默认播放速度
  collectInfoFlag: false, // 默认不收集信息
  openNewPageFlag: true, // 默认点击a链接打开新页面
  fanyiFlag: false, // 默认不翻译
  // auxclickOnly: true, // 默认auxclick与click不同时触发
};
export const defaultparams = {
  videoPlayRate: 1.5,
  fanyiFlag: false,
  configParamsBacket: {}, // 深拷贝所有配置参数
  mapInfo: {
    default: commonDefault,
  }, // content对象信息
  host: "", // location.host
  videoPlayRateList: [
    {
      videoPlayRate: 1,
    },
    {
      videoPlayRate: 1.5,
    },
    {
      videoPlayRate: 2,
    },
  ], // 视频播放速度列表
  clearTimeList: [1, 3, 7, 30], // 清理缓存事件列表
  clearTime: 1,
  changeEleMiaoBian: false, // 是否开启移入元素加样式
  noChangeHrefList: ["iflytek", "zhixue", "localhost", "google"], // 不跳转其他url列表
  debug: false, // 调试模式
  recordErrorList: ["localhost"], // 记录报错列表
};
import "./index.scss";
const { getEventListeners } = window;
const { href, host, origin } = location;

let target = null,
  timer = null,
  targetCssText = null,
  configParamsDefault = {
    changeEleMiaoBian: false,
    debug: true,
  },
  YUCHENG_USE_BOX = document.createElement("div"),
  YUCHENG_USE_DELAY = 1000,
  contentMenuEventsFlag = false, // 是否contentmenu事件
  clickEventInvoke = false, //auxclick触发时不触发click
  hrefReg = /(http|ftp|https):\/\/[\w\-_]+(\.[\w\-_]+)+([\w\-\.,@?^=%&:/~\+#]*[\w\-\@?^=%&/~\+#])?/;

const { log } = console;
YUCHENG_USE_BOX.classList.add("yucheng-use-box");
YUCHENG_USE_BOX.style.cssText = `
  position: fixed;
  display: none;
  width: 200px;
  height: 30px;
  left: 50%;
  top: 20px;
  font-size: 20px;
  transform: translateX(-50%);
  background-color: #ccc;
  box-shadow: 0px 0px 1px 1px #ccc;
  z-index: 999999 !important;
`;
document.body.appendChild(YUCHENG_USE_BOX);

// 工具类
class Util {
  constructor() {
    this.timer = null;
  }
  debounce(fn, delay = 16) {
    if (this.timer) {
      clearTimeout(this.timer);
    }
    if (typeof fn !== "function") {
      return false;
    }
    this.timer = setTimeout(fn, delay);
  }
}

// 判断是否undefined,null
export function unDef(data) {
  return data == void 0;
}

// noClose 为 false 时，不关闭
export function boxInfo(info, noClose = true) {
  return false;
}

// 判断网址是否需要跳转
export function otherSiteHref(href) {
  let splitArr = [],
    newStr = decodeURIComponent(href);
  const protocolList = ["https://", "http://"];
  protocolList.forEach((protocol) => {
    let str = newStr;
    while (str) {
      const index = str.indexOf(protocol);
      if (index !== -1) {
        splitArr.push({
          index,
          protocol,
          remain: str.slice(index),
        });
      }
      str = str.slice(index + protocol.length);
    }
  });
  // return {
  //   needChange: false,
  //   href: 'http://www.baidu.com'
  // }
  return {
    needChange: splitArr.length > 1,
    href: splitArr.length > 1 ? splitArr[1].remain : href,
  };
}

// 判断父元素是否为a元素,找10次就不找了
function isParentNodeA(item, max = 0) {
  if (!item || max >= 5) return null;
  max++;
  if (item.nodeName === "A") {
    return {
      href: item.href,
      target: item.target,
    };
  } else {
    return isParentNodeA(item.parentNode, max);
  }
}

// shift + space 实现点击鼠标所在位置
export function mouseClick(configParams = configParamsDefault) {
  // console.log(configParams, "common.js------");
  let { mapInfo, host } = configParams;
  if (!mapInfo) {
    mapInfo = configParamsDefault.mapInfo;
  }
  // 从子孙往上找，直到找到可以点击的dom
  function findParentClick(item, isClick = true) {
    if (!item) return !isClick;
    // 父元素是否a链接
    let parentIsANode = null;
    // 获取元素上的监听事件
    if (
      item.nodeName === "A" &&
      item.target !== "_blank" &&
      mapInfo[host].openNewPageFlag
    ) {
      console.log("因该触发这里");
      // gotoLink(item.href);
      gotoLink(otherSiteHref(item.href).href);
      return isClick;
    } else if ((parentIsANode = isParentNodeA(target))) {
      const otherSiteObj = otherSiteHref(parentIsANode.href);
      if (otherSiteObj.needChange) {
        gotoLink(otherSiteObj.href);
      } else if (
        parentIsANode.target !== "_blank" &&
        mapInfo[host].openNewPageFlag
      ) {
        gotoLink(otherSiteHref(parentIsANode.href).href);
      }
      // gotoLink(parentIsANode.href);
      return isClick;
    } else if (typeof window.getEventListeners === "function") {
      const listeners = window.getEventListeners(item);
      if (listeners && listeners.click) {
        item.click();
        return isClick;
      }
    } else if ("click" in item) {
      // 拿不到监听的事件对象就看能否点击，能点击就点击
      item.click();
      return isClick;
    }
    const parent = item.parentNode;
    findParentClick(parent, isClick);
    return !isClick;
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

  // 从子孙往上找，直到找到可以点击的a链接
  function findParentAClick(item, index = 0) {
    if (!item) return;
    index++;
    if (index > 10) {
      return;
    }
    if (item.nodeName === "A") {
      // return gotoLink(hrefChange(item.href))
      return gotoLink(otherSiteHref(item.href).href);
    }
    const parent = item.parentNode;
    findParentAClick(parent, index);
  }

  function getDomain(href) {
    if (!hrefReg.test(href)) {
      return false;
    }
    const urlParams = new URL(href);
    const { protocol, origin } = urlParams;
    let defaultHost = 80;
    if (protocol === "https:") {
      defaultHost = 443;
    }
    return origin + ":" + defaultHost;
  }

  // 判断是否同源
  function sameOrigin(src) {
    if (getDomain(href) && getDomain(src)) {
      return true;
    }
    return false;
  }

  function pointermove(e) {
    moveObj.debounce(() => {
      if (configParams.changeEleMiaoBian) {
        if (target) {
          target.style.cssText = targetCssText;
        }
      }
      target = e.target;
      if (configParams.changeEleMiaoBian) {
        targetCssText = e.target.style.cssText;
        e.target.style.cssText += "box-shadow: 0px 0px 1px 1px #ccc;";
      }
      if (target.nodeName === "IFRAME" && target) {
        const targetWin = target.contentWindow;
        if (targetWin && sameOrigin(target.src)) {
          try {
            targetWin.addEventListener("pointermove", pointermove);
          } catch (error) {
            boxInfo("iframe e");
          }
        }
      }
      if (
        !target ||
        !target.nodeName ||
        !target.classList ||
        target.innerText === ""
      )
        return false;
    });
  }

  const moveObj = new Util();
  window.removeEventListener("pointermove", pointermove);
  window.addEventListener("pointermove", pointermove);

  const iframes = [...document.querySelectorAll("iframe")].filter(
    (it) => !it.src.startsWith("chrome-extension")
  );
  iframes.forEach((it) => {
    it.onload = function() {
      const targetWin = it.contentWindow;
      if (target && targetWin && sameOrigin(target.src)) {
        targetWin.addEventListener("pointermove", pointermove);
      }
    };
  });

  function contextmenu(e) {
    contentMenuEventsFlag = true;
  }
  window.removeEventListener("contextmenu", contextmenu);
  window.addEventListener("contextmenu", contextmenu);

  function click(e) {
    console.log("click触发", clickEventInvoke, new Date().getTime());
    if (clickEventInvoke) {
      e.preventDefault();
    }
  }
  window.removeEventListener("click", click);
  window.addEventListener("click", click);

  // auxclick触发时，不触发contextmenu和click
  function auxclick(e) {
    clickEventInvoke = true;
    console.log("auxclick触发了", clickEventInvoke, new Date().getTime());
    const auxclickTimer = setTimeout(() => {
      if (contentMenuEventsFlag) return;
      contentMenuEventsFlag = false;
      clearTimeout(auxclickTimer);
      console.log(target, "auxclick-target");
      findParentClick(target);
      clickEventInvoke = false;
      console.log("auxclick触发了", clickEventInvoke, new Date().getTime());
    }, 200);
  }
  window.addEventListener("auxclick", auxclick);

  function keyup(e) {
    const code = e.keyCode;
    if (e.keyCode === 13) {
      YUCHENG_USE_BOX.style.display = "none";
    }
    if (e.ctrlKey && code === 88 && !window.getSelection().toString()) {
      const flag = findParentClick(target);
      if (flag) {
        boxInfo("click s");
      } else {
        boxInfo("click e");
      }
    } else if (37 == code && e.ctrlKey) {
      // 实现浏览器上一步下一步
      //处理的部分
      boxInfo("back");
      history.back();
    } else if (39 == code && e.ctrlKey) {
      //处理的部分
      boxInfo("forward");
      history.go(1);
    }
    // alt + x 点击打开新页面
    if (e.altKey && code === 88 && target) {
      findParentAClick(target);
    }
  }

  window.removeEventListener("keyup", keyup);
  window.addEventListener("keyup", keyup);

  function logInfo(...msg) {
    if (!configParams.debug) return false;
    // console.log(...msg);
    boxInfo(...msg);
  }
}

// ctrl+c 复制文本
export function copyTargetText() {
  const preList = [...document.querySelectorAll("pre")];
  const keyUp2 = (e) => {
    if (e.ctrlKey && e.keyCode === 67) {
      const text = window.getSelection().toString();
      if (text) {
        clipboardWrite(text);
      } else {
        if (preList.length) {
          const pre = preList.find((it) => it.contains(target));
          if (pre) {
            clipboardWrite(pre.innerText);
            return false;
          }
        }
        clipboardWrite(target.innerText);
      }
    }
  };
  window.removeEventListener("keyup", keyUp2);
  window.addEventListener("keyup", keyUp2);
}

function clipboardWrite(text, needClear = false) {
  if (text) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(
        function() {
          /* clipboard successfully set */
          boxInfo("copy s");
          if (needClear) {
            window.getSelection().removeAllRanges();
          }
        },
        function(err) {
          /* clipboard write failed */
          boxInfo("copy e");
          if (needClear) {
            window.getSelection().removeAllRanges();
          }
        }
      );
    } else {
      document.execCommand("copy");
      boxInfo("copy s");
      if (needClear) {
        window.getSelection().removeAllRanges();
      }
    }
  } else if (["img", "video"].includes(target.nodeName.toLowerCase())) {
    copyImg();
  } else if (target.nodeName.toLowerCase() === "canvas") {
    canvasCopy(target);
  }
}

function copyImg() {
  const img = new Image();
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  const defaultWidth = 800;
  const ratio = target.width / target.height;
  const width = target.width >= defaultWidth ? target.width : defaultWidth;
  const height = width / ratio;

  canvas.width = width;
  canvas.height = height;
  // 宽高比

  img.crossOrigin = "Anonymous";
  img.src = target.src;

  img.onload = () => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.drawImage(img, 0, 0, width, height);
    canvasCopy(canvas, true);
  };

  img.onerror = () => {
    boxInfo("cors e");
  };
}

function canvasCopy(canvas, need = false) {
  // 将canvas转为blob
  canvas.toBlob((blob) => {
    const data = [
      new ClipboardItem({
        [blob.type]: blob,
      }),
    ];
    navigator.clipboard.write(data).then(
      () => {
        boxInfo("copy s");
      },
      () => {
        boxInfo("copy e");
      }
    );
  });
}

// 选择的自动选中
const selectObj = new Util();
export function autoSelect() {
  document &&
    document.addEventListener("selectionchange", (e) => {
      selectObj.debounce(() => {
        if (!window.getSelection().toString()) return false;
        clipboardWrite(window.getSelection().toString(), true);
      }, 1000);
    });
}
