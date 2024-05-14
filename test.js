const regex = /\{(\d+)\}/;  
const str = "http://gggggg/ssd {2}cccccc}";  
let matches;  
let capturedNumbers = [];  
  
// 使用全局搜索标志 'g' 来找到所有的匹配项  
matches = regex.exec(str)
console.log(matches)

const newStr = str.replace(regex, '30');

console.log(newStr)