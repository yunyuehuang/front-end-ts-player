

export default {
  formatSeconds: function (seconds) {
    // 确保秒数是整数  
    seconds = Math.ceil(seconds);

    // 计算小时、分钟和剩余的秒数  
    var hours = Math.floor(seconds / 3600);
    var minutes = Math.floor((seconds % 3600) / 60);
    var secs = seconds % 60;

    // 格式化时间部分  
    var timeParts = [];
    if (hours > 0) {
      // 如果小时大于0，则添加小时部分  
      timeParts.push(hours.toString().padStart(2, '0'));
    }
    timeParts.push(minutes.toString().padStart(2, '0'));
    timeParts.push(secs.toString().padStart(2, '0'));

    // 返回格式化的时间字符串  
    return timeParts.join(':');
  },
  spliceTime(str) {
    if (str == undefined) {
      return 0
    }
    const regex = /^[\d:]+$/;  
    if (!regex.test(str)) {
      return 0
    }


    let arr = str.split(':')
    let time = 0
    if (arr.length > 1) {
      time = arr[0] * 60 + arr[1] *1
    } else {
      time = arr[0] * 60
    }
    return time
  }

}