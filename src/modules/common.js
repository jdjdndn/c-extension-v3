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
  auxclickOnly: false, // 默认auxclick与click不同时触发
  noOpenLinkList: [], // 如果新页面打开链接，这些不会新页面打开链接
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
  noOpenLinkDomList = [], // 不需要跳转的a链接父元素
  findUrlReg = /(https?|ftp|file):\/\/[-A-Za-z0-9+&@#\/%?=~_|!:,.;]+[-A-Za-z0-9+&@#/%=~_|]/,
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

// 根据选择器列表收集dom列表
export function getNoOpenDomList(noOpenLinkList) {
  noOpenLinkDomList = noOpenLinkList
    .map((it) => document.querySelector(it))
    .filter(Boolean);
  console.log(noOpenLinkDomList, "noOpenLinkDomList");
}

// fetch 第一个参数url,第二个参数为配置对象
// {
//    method: 'POST', // *GET, POST, PUT, DELETE, etc.
//     mode: 'cors', // no-cors, *cors, same-origin
//     cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
//     credentials: 'same-origin', // include, *same-origin, omit
//     headers: {
//       'Content-Type': 'application/json'
//       // 'Content-Type': 'application/x-www-form-urlencoded',
//     },
//     redirect: 'follow', // manual, *follow, error
//     referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
//     body: JSON.stringify(data) // body data type must match "Content-Type" header
// }
// 判断页面是否存在
export function sendReq(
  url,
  fn = () => {},
  errFn = () => {},
  finallyFn = () => {}
) {
  fetch(url)
    .then((res) => {
      console.log(res, "res==========");
      if (res.status === 200) {
        fn(res);
      } else {
        errFn(res);
      }
    })
    .catch((err) => errFn(err))
    .finally(finallyFn);
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
  if (item.href) {
    return {
      tag: item.nodeName,
      href: item.href,
      target: item.target,
    };
  } else {
    return isParentNodeA(item.parentNode, max);
  }
}

// shift + space 实现点击鼠标所在位置
export function mouseClick(configParams) {
  console.log(configParams, "common.js------");
  let { mapInfo } = configParams;
  if (!mapInfo) {
    mapInfo = configParamsDefault.mapInfo;
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

  function doSth(item) {
    // if (host === "github.com") {
    //   const reg = new RegExp(/\((.*?)\)/);
    //   const matched = item.innerText.match(reg);
    //   const href = matched && matched[1];
    //   if (hrefReg.test(href)) gotoLink(href);
    // }
    const matched = item.innerText && item.innerText.match(findUrlReg);
    let href = matched && matched[0];
    // fix:内容中的href可能被折叠展示不全，优先使用a标签的href
    if ((href && item.href && (href = item.href)) || hrefReg.test(href)) {
      console.log(7);
      gotoLink(href);
      return true;
    }
    return false;
  }

  // 从子孙往上找，直到找到可以点击的dom
  function findParentClick(item, isClick = true) {
    if (!item) return !isClick;
    if (doSth(item)) return isClick;
    const openFLag =
      noOpenLinkDomList.length &&
      noOpenLinkDomList.some((it) => it.contains(item));
    // 有不需要新页面打开的直接点击即可
    if (openFLag && "click" in item) {
      console.log(8);
      // 拿不到监听的事件对象就看能否点击，能点击就点击
      item.click();
      return isClick;
    }
    // 父元素是否a链接
    let parentIsANode = null;
    // 获取元素上的监听事件
    let otherObj = {};
    if (
      item.href &&
      (otherObj = otherSiteHref(item.href)) &&
      otherObj.needChange
    ) {
      console.log(1, otherObj);
      gotoLink(otherObj.href);
      return isClick;
    } else if (item.href && mapInfo[host].openNewPageFlag) {
      console.log(2, otherObj);
      gotoLink(otherObj.href);
      return isClick;
    } else if (
      (parentIsANode = isParentNodeA(target)) &&
      (otherObj = otherSiteHref(parentIsANode.href)) &&
      otherObj.needChange
    ) {
      console.log(3, otherObj);
      gotoLink(otherObj.href);
      return isClick;
    } else if (
      parentIsANode &&
      // parentIsANode.target !== "_blank" &&
      mapInfo[host].openNewPageFlag
    ) {
      console.log(4, otherObj);
      gotoLink(otherObj.href);
      return isClick;
    }
    // else if (typeof getEventListeners === "function") {
    //   const listeners = getEventListeners(item);
    //   console.log(5);
    //   if (listeners && listeners.click) {
    //     item.click();
    //     return isClick;
    //   }
    // }
    else if ("click" in item) {
      console.log(6, parentIsANode);
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
    console.log(href, "gotoLink---href");
    const a = document.createElement("a");
    a.target = "_blank";
    a.rel = "noopener noreferrer nofollow";
    a.href = href;
    a.click();
    a.remove();
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
      // if (target.nodeName === "IFRAME" && target) {
      //   const targetWin = target.contentWindow;
      //   if (targetWin && sameOrigin(target.src)) {
      //     // if (targetWin) {
      //     try {
      //       targetWin.addEventListener("pointermove", pointermove);
      //     } catch (error) {
      //       boxInfo("iframe e");
      //     }
      //   }
      // }
      // if (
      //   !target ||
      //   !target.nodeName ||
      //   !target.classList ||
      //   target.innerText === ""
      // )
      //   return false;
    });
  }

  const moveObj = new Util();

  function contextmenu(e) {
    contentMenuEventsFlag = true;
  }

  function click(e) {
    console.log("click触发", e.target, new Date().getTime());
    if (clickEventInvoke) {
      e.preventDefault();
    }
  }

  // auxclick触发时，不触发contextmenu和click
  function auxclick(e) {
    e.preventDefault();
    e.stopImmediatePropagation();
    if (mapInfo[host].auxclickOnly) clickEventInvoke = true;
    console.log("auxclick触发了", clickEventInvoke, new Date().getTime());
    const auxclickTimer = setTimeout(() => {
      if (contentMenuEventsFlag) return;
      contentMenuEventsFlag = false;
      clearTimeout(auxclickTimer);
      console.log("auxclick-target");
      findParentClick(e.target);
      clickEventInvoke = false;
      // console.log(
      //   "auxclick-setTimeout",
      //   clickEventInvoke,
      //   new Date().getTime()
      // );
    }, 200);
  }

  function keyup(e) {
    const code = e.keyCode;
    const preList = [...document.querySelectorAll("pre")];
    if (e.keyCode === 13) {
      YUCHENG_USE_BOX.style.display = "none";
    } else if (e.ctrlKey && e.keyCode === 67) {
      // ctrl +c 复制图片、文本
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
    } else if (e.ctrlKey && code === 88 && !window.getSelection().toString()) {
      // ctrl + x 点击
      const flag = findParentClick(target);
      if (flag) {
        boxInfo("click s");
      } else {
        boxInfo("click e");
      }
    } else if (37 === code && e.ctrlKey) {
      // 实现浏览器上一步下一步
      history.back();
    } else if (39 === code && e.ctrlKey) {
      //处理的部分
      history.go(1);
    } else if (e.ctrlKey && code === 188) {
      // ctrl + , 下载所有图片
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
    // alt + x 点击打开新页面
    // if (e.altKey && code === 88 && target) {
    //   findParentClick(target);
    // }
  }

  function keydown(e) {
    const code = e.keyCode;
    if (e.ctrlKey && code === 83) e.preventDefault();
  }

  // 去除copy之后的尾巴
  document.addEventListener("copy", function(e) {
    e.preventDefault();
    const selection = window.getSelection().toString();
    e.clipboardData.setData("text/plain", selection);
  });

  // 页面离开事件
  // window.addEventListener('beforeunload', function (event) {})

  function createLinstener(targetWin) {
    targetWin.removeEventListener("pointermove", pointermove);
    targetWin.addEventListener("pointermove", pointermove);
    targetWin.removeEventListener("auxclick", auxclick);
    targetWin.addEventListener("auxclick", auxclick);
    targetWin.removeEventListener("contextmenu", contextmenu);
    targetWin.addEventListener("contextmenu", contextmenu);
    targetWin.removeEventListener("click", click);
    targetWin.addEventListener("click", click);
    targetWin.removeEventListener("keyup", keyup);
    targetWin.addEventListener("keyup", keyup);
    targetWin.removeEventListener("keydown", keydown);
    targetWin.addEventListener("keydown", keydown);
  }

  createLinstener(window);

  //   .filter(
  //   (it) => !it.src.startsWith("chrome-extension")
  // );
  // const iframes = [...document.querySelectorAll("iframe")];
  // iframes.forEach((it) => {
  //   // it.onload = function() {
  //   const targetWin = it.contentWindow;
  //   console.log(targetWin, "targetWin");
  //   if (targetWin && sameOrigin(it.src)) {
  //     // if (targetWin) {
  //     createLinstener(targetWin);
  //   }
  //   // };
  // });

  function logInfo(...msg) {
    if (!configParams.debug) return false;
    // console.log(...msg);
    boxInfo(...msg);
  }
}

// // ctrl+c 复制文本
// export function copyTargetText() {
//   const keyUp2 = (e) => {
//     if (e.ctrlKey && e.keyCode === 67) {
//       const text = window.getSelection().toString();
//       if (text) {
//         clipboardWrite(text);
//       } else {
//         if (preList.length) {
//           const pre = preList.find((it) => it.contains(target));
//           if (pre) {
//             clipboardWrite(pre.innerText);
//             return false;
//           }
//         }
//         clipboardWrite(target.innerText);
//       }
//     }
//   };
//   window.removeEventListener("keyup", keyUp2);
//   window.addEventListener("keyup", keyUp2);
// }

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
