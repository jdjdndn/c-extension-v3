/*
 * @Author: yucheng
 * @Date: 2022-01-01 16:28:16
 * @LastEditTime: 2022-07-17 22:14:46
 * @LastEditors: yucheng
 * @Description: ..
 */
// mapInfo的所有参数
export const commonDefault = {
  videoPlayRate: 1.5, // 默认播放速度
  collectInfoFlag: false, // 默认不收集信息
  openNewPageFlag: true, // 默认点击a链接打开新页面
  fanyiFlag: false, // 默认不翻译
  auxclickOnly: false, // 默认auxclick与click不同时触发
  noOpenLinkList: [], // 如果新页面打开链接，这些不会新页面打开链接
  openLinkBox: false, // 默认在左侧不打开收集a链接的盒子
};
// 只包含默认参数
export const paramsDefault = {
  mapInfo: {
    default: commonDefault,
    "91porny.com": {
      auxclickOnly: true,
      collectInfoFlag: false,
      fanyiFlag: false,
      noOpenLinkList: [],
      openNewPageFlag: true,
      videoPlayRate: 1.5,
    },
    "cloud.tencent.com": {
      auxclickOnly: false,
      collectInfoFlag: true,
      fanyiFlag: false,
      openNewPageFlag: true,
      videoPlayRate: 1.5,
    },
    "cn.pornhub.com": {
      auxclickOnly: true,
      collectInfoFlag: false,
      fanyiFlag: false,
      noOpenLinkList: [".pagination3"],
      openNewPageFlag: true,
      videoPlayRate: 2,
    },
    "coding.imooc.com": {
      auxclickOnly: false,
      collectInfoFlag: false,
      fanyiFlag: false,
      noOpenLinkList: [".comp-tab-t.js-comp-tab"],
      openNewPageFlag: true,
      videoPlayRate: 1.5,
    },
    default: {
      auxclickOnly: false,
      collectInfoFlag: false,
      fanyiFlag: false,
      noOpenLinkList: [],
      openNewPageFlag: true,
      videoPlayRate: 1.5,
    },
    "developer.chrome.com": {
      auxclickOnly: false,
      collectInfoFlag: false,
      fanyiFlag: false,
      noOpenLinkList: ["navigation-tree"],
      openNewPageFlag: true,
      videoPlayRate: 1.5,
    },
    "github.com": {
      auxclickOnly: true,
      collectInfoFlag: true,
      fanyiFlag: false,
      noOpenLinkList: [
        ".octotree-sidebar.octotree-github-sidebar.ui-resizable",
      ],
      openNewPageFlag: true,
      videoPlayRate: 1.5,
    },
    "juejin.cn": {
      auxclickOnly: false,
      collectInfoFlag: true,
      fanyiFlag: false,
      noOpenLinkList: [".list-nav"],
      openNewPageFlag: false,
      videoPlayRate: 1.5,
    },
    "segmentfault.com": {
      auxclickOnly: false,
      collectInfoFlag: true,
      fanyiFlag: false,
      noOpenLinkList: [],
      openNewPageFlag: true,
      videoPlayRate: 1.5,
    },
    "sleazyfork.org": {
      auxclickOnly: false,
      collectInfoFlag: false,
      fanyiFlag: false,
      noOpenLinkList: [".pagination"],
      openNewPageFlag: true,
      videoPlayRate: 1.5,
    },
    "www.007hdys.com": {
      auxclickOnly: false,
      collectInfoFlag: false,
      fanyiFlag: false,
      noOpenLinkList: [".pagination", ".collapse.navbar-collapse"],
      openNewPageFlag: true,
      videoPlayRate: 1.5,
    },
    "www.google.com": {
      auxclickOnly: false,
      collectInfoFlag: false,
      fanyiFlag: false,
      noOpenLinkList: ["#xjs"],
      openNewPageFlag: true,
      videoPlayRate: 1.5,
    },
    "www.jianshu.com": {
      auxclickOnly: false,
      collectInfoFlag: true,
      fanyiFlag: false,
      noOpenLinkList: [],
      openNewPageFlag: true,
      videoPlayRate: 1.5,
    },
  }, // content对象信息
  clearTime: 1,
  changeEleMiaoBian: false, // 是否开启移入元素加样式
  noChangeHrefList: [
    "iflytek",
    "zhixue",
    "localhost",
    "google",
    "cloud.tencent.com",
    "account.aliyun.com",
    "www.hgmanhua.top",
    "auth.huaweicloud.com",
    "pay.qq.com.open.weixin.qq.com",
    "passport.weibo.com",
  ], // 不跳转其他url列表
  debug: false, // 调试模式
  recordErrorList: ["localhost"], // 记录报错列表
};
// 包含默认参数以及其他参数
export const defaultparams = {
  fanyiFlag: false,
  videoPlayRate: 1.5,
  configParamsBacket: {}, // 深拷贝所有配置参数
  videoPlayRateList: [
    {
      videoPlayRate: 1,
    },
    {
      videoPlayRate: 1.25,
    },
    {
      videoPlayRate: 1.5,
    },
    {
      videoPlayRate: 2,
    },
  ], // 视频播放速度列表
  clearTimeList: [1, 3, 7, 30], // 清理缓存事件列表
  ...paramsDefault,
};
import "./index.scss";
// const { href, host, origin } = location;
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
  auxclicked = false, // auxclick事件触发了
  findUrlReg = /(https?|ftp|file):\/\/[-A-Za-z0-9+&@#\/%?=~_|!:,.;]+[-A-Za-z0-9+&@#/%=~_|]/, // 文本中找url
  hrefReg = /(http|ftp|https):\/\/[\w\-_]+(\.[\w\-_]+)+([\w\-\.,@?^=%&:/~\+#]*[\w\-\@?^=%&/~\+#])?/; // 判断是否是url

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
  constructor () {
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
  // chalk(noOpenLinkDomList, "noOpenLinkDomList");
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
  fn = () => { },
  errFn = () => { },
  finallyFn = () => { }
) {
  fetch(url)
    .then((res) => {
      chalk(res, "res==========");
      if (res.status === 200) {
        fn(res);
      } else {
        errFn(res);
      }
    })
    .catch((err) => errFn(err))
    .finally(finallyFn);
}

// 获取随机颜色
function getRandomColor() {
  return (
    "#" + ("00000" + ((Math.random() * 0x1000000) << 0).toString(16)).substr(-6)
  );
}
// 设置控制台打印颜色
function realChalk(element) {
  const time = new Date().toLocaleString() + "    ";
  if (typeof element === "object") {
    console.log(`%c%s`, `color:${getRandomColor()};`, time, element);
  } else {
    console.log(
      `%c${time}%c${element + ""}`,
      `color:${getRandomColor()};`,
      `color:${getRandomColor()};`
    );
  }
}
// 随机长度字符串
function randomString(e = 6) {
  var t = "ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz",
    a = t.length,
    n = "";
  for (let i = 0; i < e; i++) n += t.charAt(Math.floor(Math.random() * a));
  return n;
}
// 设置控制台打印颜色
export function chalk(...args) {
  if (args.length > 1) {
    const str = args.find((it) => typeof it === "string") || randomString();
    console.groupCollapsed(str);
    for (let index = 0; index < args.length; index++) {
      realChalk(args[index]);
    }
    try {
      console.groupEnd(str);
    } catch (error) { }
  } else {
    realChalk(args[0]);
  }
}

// 当前链接与网页host不一致时或者 `https://link.juejin.cn?target=https%3A%2F%2Fgithub.com%2FPanJiaChen%2Fvue-element-admin` 直接跳转
function getNeedChange(arr, href, host) {
  if (!host) return arr.length > 1;
  return arr.length > 1 || (arr.length === 1 && new URL(href).host !== host);
}

// 跳转方法
function gotoLink(href) {
  if (!hrefReg.test(href)) return console.error("非正常url");
  // chalk(href, "gotoLink---href");
  const a = document.createElement("a");
  a.target = "_blank";
  a.rel = "noopener noreferrer nofollow";
  a.href = href;
  a.click();
  a.remove();
}

// 判断网址是否需要跳转
export function otherSiteHref(href, host) {
  let splitArr = [],
    needChange = false,
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
        needChange = getNeedChange(splitArr, href, host);
        splitArr = splitArr.sort((a, b) => a.index - b.index);
        // if (needChange) {
        //   return {
        //     needChange,
        //     href: splitArr.length > 1 ? splitArr[1].remain : href,
        //   };
        // }
      }
      str = str.slice(index + protocol.length);
    }
  });
  // return {
  //   needChange: false,
  //   href: 'http://www.baidu.com'
  // }
  return {
    // needChange: getNeedChange(splitArr, href, host),
    needChange,
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
export function mouseClick(configParams, targetWin) {
  // chalk(configParams, "common.js------");
  let { mapInfo, host } = configParams;
  if (!host) chalk("没有host");
  if (!mapInfo) {
    mapInfo = configParamsDefault.mapInfo;
  }

  function doSth(item) {
    const matched = item.innerText && item.innerText.match(findUrlReg);
    let href = matched && matched[0];
    // fix:内容中的href可能被折叠展示不全，优先使用a标签的href
    if ((href && item.href && (href = item.href)) || hrefReg.test(href)) {
      // chalk(7);
      gotoLink(href);
      return true;
    }
    return false;
  }

  function newPageOpen(item) {
    if (!item) return;
    if (doSth(item)) return;
    let parentIsANode = null;
    // 获取元素上的监听事件
    let otherObj = {};

    parentIsANode = isParentNodeA(item)
    if (parentIsANode && parentIsANode.href) {
      otherObj = otherSiteHref(parentIsANode.href, host)
      if (otherObj.needChange) {
        return gotoLink(otherObj.href)
      }
    }
    if (otherObj.href) {
      return gotoLink(otherObj.href)
    }
    if ("click" in item) {
      item.click()
    }
  }

  // 从子孙往上找，直到找到可以点击的dom
  function findParentClick(item, isClick = true) {
    if (!item) return !isClick;
    if (doSth(item)) return isClick;
    // 父元素是否a链接
    let parentIsANode = null;
    // 获取元素上的监听事件
    let otherObj = {};
    if (
      item.href &&
      (otherObj = otherSiteHref(item.href, host)) &&
      otherObj.needChange &&
      hrefReg.test(item.href)
    ) {
      // chalk(1, otherObj);
      // gotoLink(otherObj.href);
      return isClick;
    }
    else if (
      (parentIsANode = isParentNodeA(target)) &&
      (otherObj = otherSiteHref(parentIsANode.href, host)) &&
      otherObj.needChange &&
      hrefReg.test(parentIsANode.href)
    ) {
      // chalk(3, otherObj);
      // gotoLink(otherObj.href);
      return isClick;
    }
    else if ("click" in item) {
      // chalk(6, parentIsANode, otherObj, item);
      // 拿不到监听的事件对象就看能否点击，能点击就点击
      item.click();
      return isClick;
    }
    const parent = item.parentNode;
    findParentClick(parent, isClick);
    return !isClick;
  }

  function pointermove(e) {
    moveObj.debounce(() => {
      if (configParams.changeEleMiaoBian) {
        if (target) {
          target.style.cssText = targetCssText;
        }
      }
      target = e.target;
      if (target.href || target.src) {
        clipboardWrite(target.href);
      }
      if (configParams.changeEleMiaoBian) {
        targetCssText = e.target.style.cssText;
        e.target.style.cssText += "box-shadow: 0px 0px 1px 1px #ccc;";
      }
    });
  }

  const moveObj = new Util();

  function contextmenu(e) {
    contentMenuEventsFlag = true;
  }

  function click(e) {
    // chalk("click触发", e.target, new Date().getTime());
    if (clickEventInvoke) {
      e.preventDefault();
    }
    // 这个事件 在auxclick和click中只触发一次
    if (!auxclicked) {
      doSth(e.target)
    }
  }

  // auxclick触发时，不触发contextmenu和click
  function auxclick(e) {
    e.preventDefault();
    if (mapInfo[host].auxclickOnly) clickEventInvoke = true;
    auxclicked = true
    // chalk("auxclick触发了", clickEventInvoke, new Date().getTime());
    const auxclickTimer = setTimeout(() => {
      if (contentMenuEventsFlag) return;
      contentMenuEventsFlag = false;
      clearTimeout(auxclickTimer);
      // chalk("auxclick-target");
      newPageOpen(e.target);
      clickEventInvoke = false;
      auxclicked = false
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
      newPageOpen(target);
    } else if (e.altKey && code === 88) {
      // alt + x 点击
      findParentClick(target);
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
  document.addEventListener("copy", function (e) {
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

  createLinstener(targetWin);

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
        function () {
          /* clipboard successfully set */
          boxInfo("copy s");
          if (needClear) {
            window.getSelection().removeAllRanges();
          }
        },
        function (err) {
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
    chalk("cors e");
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
        chalk("copy s");
      },
      () => {
        chalk("copy e");
      }
    );
  });
}

// 选择的自动选中
const selectObj = new Util();
export function autoSelect() {
  document &&
    document.addEventListener("selectionchange", (e) => {
      // selectObj.debounce(() => {
      //   if (!window.getSelection().toString()) return false;
      //   clipboardWrite(window.getSelection().toString(), true);
      // }, 1000);
    });
}
