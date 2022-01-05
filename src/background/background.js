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