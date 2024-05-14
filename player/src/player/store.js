
let fields = ['pinOffset', 'url','tsUrl','threadNum','timeOut','pageUrl','playBeginTime','section','playEndTime']

export default {

  setData: function(obj, objBeSet){
    fields.map(v=>{
      objBeSet[v] = obj[v]
    })
  },

  getConfig(vueObj){
    let storeData = localStorage.getItem("data")
    if (storeData) {
      this.setData(JSON.parse(storeData), vueObj)
    }
  },

  setConfig(vueObj){
    let json = {}
    this.setData(vueObj, json)
    localStorage.setItem("data", JSON.stringify(json))
  }
    
}