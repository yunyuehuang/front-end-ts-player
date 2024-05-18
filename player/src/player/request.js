

import $ from "jquery"
export default {
  requestUrl: function (url) {
    return new Promise(function(resolve, reject){
      $.ajax({  
        url: 'http://129.204.63.215:11200/m3u8',  // 请求的 URL  
        type: 'POST',                          // 请求方法，如 GET、POST 等  
        dataType: 'json',                     // 期望的响应数据类型，如 json、xml、html 等  
        data: {                              // 发送到服务器的数据  
            url: url,  
        },
        success: (response) =>{        // 请求成功时的回调函数  
          console.log(response)
          if (response.code !=0) {
            reject("请求失败" + response.data)
            return
          }
          resolve(response.data);
     
        },  
        error: function(jqXHR, textStatus, errorThrown) { // 请求失败时的回调函数  
          reject("请求失败")
        }
      })
    })
  },
  get(url){
    return new Promise(function(resolve, reject){
      $.ajax({
        url,  // 请求的 URL  
        type: 'GET',                          // 请求方法，如 GET、POST 等  
        success: (response) =>{        // 请求成功时的回调函数  
          resolve(response);
        },  
        error: function(jqXHR, textStatus, errorThrown) { // 请求失败时的回调函数  
          reject("请求失败")
        }
      })
    })
  },


  getKeyMap: function (str) {
    let news = str.slice(str.indexOf(':')+1) 
    let v1Arr = news.split(",")
    let mapd = {}
  
    v1Arr.map((v)=>{
      let tmp = v.split("=")
      if (tmp[0] == "URI") {
          tmp[1] = tmp[1].replaceAll('"', '')
      }
      mapd[tmp[0]] = tmp[1]
    })
    return mapd
  }
}