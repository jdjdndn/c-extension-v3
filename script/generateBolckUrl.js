/*
 * @Author: yucheng
 * @Date: 2022-07-16 11:30:35
 * @LastEditTime: 2022-07-20 19:22:21
 * @LastEditors: yucheng
 * @Description: 生成json文件
 */
const fs = require('fs')
const path = require('path')

const bilibiliList = ['i*.hdslb.com/bfs','s1.hdslb.com/bfs']
const juejinList = ['/advert/query_adverts', 'mcs.snssdk.com/list', 'tvax4.sinaimg.cn', 'tva1.sinaimg.cn', 'img01.sogoucdn.com']
const qidianList = ['qidian.com/webgame/game', 'qidian.com/upload/gamesy','bossaudioandcomic-1252317822.image.myqcloud.com/activity/document','bossaudioandcomic-1252317822.image.myqcloud.com','bookcover.yuewen.com','qidian.gtimg.com','cpgame.qd.game.qidian.com','imgservices-1252317822.image.myqcloud.com']
const porny91List = ['bob4885.com', 'raw.githubusercontent.com/91porny/happy/master/newyear','n0322.com','885964.com','nrxduw5.com','701.oss-cn-hongkong.aliyuncs.com','m.360buyimg.com/ddimg','vcawmm.com','cdn.jsdelivr.net/gh/91porny/happy/newyear','bob5858.com','dimg04.c-ctrip.com']
const baiDuTieBaList = ['gss3.bdstatic.com','gss0.bdstatic.com','tb2.bdstatic.com/tb','tb1.bdstatic.com/tb','tb3.bdstatic.com','tieba-ares.cdn.bcebos.com']
const baiduSousuoList = ['himg.bdimg.com', 'pss.bdstatic.com', 'ms.bdimg.com', 'dss2.bdstatic.com', 'search-operate.cdn.bcebos.com', 'nv00.cdn.bcebos.com', {
  urlFilter: 'pss.bdstatic.com/r/www/cache',
  resourceTypes: ['script']
}
]
const hu4tvList = ['cdn.cnbj1.fds.api.mi-img.com']

function write(filename, data) {
  fs.writeFile(path.join(__dirname, filename), data, (err) => {
    if (err) {
      console.log(err);
      return err;
    }
    return { code: 200, message: 'success' };
  });
}
function read(filename) {
  return fs.readFileSync(
    path.join(__dirname, filename),
    "utf-8",
    (err, data) => {
      if (err) {
        write(filename, JSON.stringify({}));
        return err;
      }
      return data;
    }
  );
}

function generateRulesJson(rules, filename) {
  const nameArr = filename.split('/')
  fileNameList.push(nameArr.slice(-2).join('/'));
  const realRules = rules.map((it, i) => {
    const index = i+1
    if (typeof it === 'string') {
      return {
        id: index,
        priority: index,
        action: {
          type: 'block'
        },
        condition: {
          urlFilter: it,
          resourceTypes: [
            'xmlhttprequest',
            'image'
          ]
        }
      }
    } else {
      return {
        id: index,
        priority: index,
        action: {
          type: it.type || 'block'
        },
        condition: {
          urlFilter: it.urlFilter,
          resourceTypes: it.resourceTypes || [
            'xmlhttprequest',
            'image'
          ]
        }
      }
    }
  })
  write(filename,JSON.stringify(realRules,null,2))
}

// 文件名列表
const fileNameList = []
generateRulesJson(bilibiliList,'../src/rules/bilibili.json')
generateRulesJson(juejinList,'../src/rules/juejin.json')
generateRulesJson(qidianList, '../src/rules/qidain.json')
generateRulesJson(porny91List, '../src/rules/porny91.json')
generateRulesJson(baiDuTieBaList, '../src/rules/baidutieba.json')
generateRulesJson(baiduSousuoList, '../src/rules/baidusousuo.json')
generateRulesJson(hu4tvList, '../src/rules/hu4tv.json')

const manifestJson = read('../src/manifest.json')
const manifestData = JSON.parse(manifestJson || '{}')

const rule_resources = fileNameList.map((path,i) => ({
  enabled: true,
  id: i+1+'',
  path
}))
write('../src/manifest.json',JSON.stringify({
  ...manifestData,
  declarative_net_request: {
    rule_resources
  }
}, null, 2))
