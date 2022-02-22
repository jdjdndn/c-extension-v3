/*
 * @Author: yucheng
 * @Date: 2022-02-22 21:09:20
 * @LastEditTime: 2022-02-22 21:09:20
 * @LastEditors: yucheng
 * @Description: 
 */
// 跳转方法
export function gotoLink(href) {
  const a = document.createElement('a')
  a.target = '_blank'
  a.rel = 'noopener noreferrer nofollow'
  a.href = href
  a.click()
  a.remove()
}