const express = require('express')
const desc = require('./desc.js')
const app = express()
const port = 3000

// 使用内置的中间件来解析 URL 编码和 JSON 数据  
app.use(express.urlencoded({ extended: true }));  
app.use(express.json());  


app.post('/m3u8',async (req, res) => {
  // 从请求体中获取数据  
  const data = req.body;  
    
  // 打印数据以进行调试  
  console.log(data);  
  try{
    rsdata = await desc.getM3u8(data.url)
  } catch(err){
    res.send({code:1, data: "解析失败:" + err.message})
  }
  if (!rsdata) {
    res.send({code:1, data:"无数据"})
  }
  res.send({code:0, data:rsdata})
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

console.log("开始")

