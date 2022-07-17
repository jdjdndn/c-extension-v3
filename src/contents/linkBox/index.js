/*
 * @Author: yucheng
 * @Date: 2022-07-17 09:41:31
 * @LastEditTime: 2022-07-17 21:50:09
 * @LastEditors: yucheng
 * @Description: 
 */
let localFilterLinkMap = {}

function sliceHref(href) {
  try {
    const { origin } = new URL(href)
    if (origin === location.origin) {
      return href.slice(origin.length)
    }
    return href
  } catch (error) {
    console.log(error,'error',href);
    return href
  }
}
// 一个全是a链接的盒子
export function openLinkBoxFn() {
  const loadFn = e => { 
    const h = document.documentElement
    h.style.padding = '0 0 0 200px'
    const div = document.createElement('div');
    div.id = 'yucheng-link-box'

    const {host} = location
    // chrome.storage.local.get(null, function (result) {
    //   // 设置默认参数
    //   const { filterLinkMap = {} } = result;
    //   if (!filterLinkMap[host]) {
    //     localFilterLinkMap[host] = {
    //       index: 0
    //     }
    //   } else {
    //     localFilterLinkMap = filterLinkMap
    //   }
    // });

    const callback = function (mutationsList, observer) {
      const alinkList = [...document.body.querySelectorAll('a')]
      const linkStr = alinkList.reduce((pre, cur) => {
        // svg中a标签也有href
        const href = cur.href.baseVal || cur.href.animVal || cur.href
        if(!href) return pre
        // const isShow = !localFilterLinkMap[host][href] || localFilterLinkMap[host][href].rate < .5
        const text = cur.innerText || sliceHref(href)
        pre += href ? `<li style='list-style: none;' title="${text}"><a target="_blank" href="${href}">${text}</a></li>`:''
        return pre
      }, '')
      div.innerHTML = `
      <ul style='width: 200px;margin: 0;padding: 0 10px;box-sizing: border-box;text-overflow:ellipsis;white-space:nowrap;overflow-x: hidden;'>
        ${linkStr}
      </ul>
      `

      const list = [...document.body.querySelectorAll('a')].map(it => it.href).filter(it => typeof it === 'string')

      // localFilterLinkMap[host].index ++
      // list.forEach(it => {
      //   if (!localFilterLinkMap[host][it]) {
      //     localFilterLinkMap[host][it] = {
      //       index: 1,
      //       rate: 0
      //     }
      //   } else {
      //     localFilterLinkMap[host][it].index++
      //     localFilterLinkMap[host][it].href = it
      //     localFilterLinkMap[host][it].rate = localFilterLinkMap[host][it].index / localFilterLinkMap[host].index
      //   }
      // })
      // console.log(localFilterLinkMap,'localFilterLinkMap==========localFilterLinkMap');
      // chrome.storage.local.set({ filterLinkMap: localFilterLinkMap }, function () { });
    };
    // mutationObsever配置
    const config = {
      childList: true,
      subtree: true,
    };
    const observer = new MutationObserver(callback);
    observer.observe(document.body, config);

    div.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    margin: 0;
    padding: 0;
    height: 100vh;
    box-sizing: border-box;
    overflow-y:auto;
    background-color: #fff;
    `
    const distance = document.documentElement.clientWidth - document.body.offsetWidth
    div.style.left = distance - 16 > 0 ? distance - 200 + 'px' : 0
    div.style.width = '200px'
    document.documentElement.appendChild(div)
  }
  window.removeEventListener('load', loadFn);
  window.addEventListener('load', loadFn);
}