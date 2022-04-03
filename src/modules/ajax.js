export function ajax(options) {
  // 基础请求url
  const baseUrl = "https://chengyu.site:8889/https-api";
  // 存储的是默认值
  var defaults = {
    type: "get",
    url: "",
    data: {},
    header: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    success: function() {},
    error: function() {},
  };

  // 使用options对象中的属性覆盖defaults对象中的属性
  Object.assign(defaults, options);

  // 创建ajax对象
  var xhr = new XMLHttpRequest();
  // 拼接请求参数的变量
  var params = "";
  // 循环用户传递进来的对象格式参数
  for (var attr in defaults.data) {
    // 将参数转换为字符串格式
    params += attr + "=" + defaults.data[attr] + "&";
  }
  // 将参数最后面的&截取掉
  // 将截取的结果重新赋值给params变量
  params = params.substr(0, params.length - 1);

  // 判断请求方式
  if (defaults.type == "get") {
    if (params) {
      defaults.url = baseUrl + defaults.url + "?" + params;
    } else {
      // 没有参数不拼接 ？
      defaults.url = baseUrl + defaults.url;
    }
  } else {
    defaults.url = baseUrl + defaults.url;
  }

  // 配置ajax对象
  xhr.open(defaults.type, defaults.url);
  // 如果请求方式为post
  if (defaults.type == "post") {
    // 用户希望的向服务器端传递的请求参数的类型
    var contentType = defaults.header["Content-Type"];
    // 设置请求参数格式的类型
    xhr.setRequestHeader("Content-Type", contentType);
    // 判断用户希望的请求参数格式的类型
    // 如果类型为json
    if (contentType == "application/json") {
      // 向服务器端传递json数据格式的参数
      xhr.send(JSON.stringify(defaults.data));
    } else {
      // 向服务器端传递普通类型的请求参数
      xhr.send(params);
    }
  } else {
    // 发送请求
    xhr.send();
  }
  // 监听xhr对象下面的onload事件
  // 当xhr对象接收完响应数据后触发
  xhr.onload = function() {
    // xhr.getResponseHeader()
    // 获取响应头中的数据
    var contentType = xhr.getResponseHeader("Content-Type");
    // 服务器端返回的数据
    var responseText = xhr.responseText;

    // 如果响应类型中包含applicaition/json
    if (contentType.includes("application/json")) {
      // 将json字符串转换为json对象
      responseText = JSON.parse(responseText);
    }

    // 当http状态码等于200的时候
    if (xhr.status == 200) {
      // 请求成功 调用处理成功情况的函数
      defaults.success(responseText, xhr);
    } else {
      // 请求失败 调用处理失败情况的函数
      defaults.error(responseText, xhr);
    }
  };
}
