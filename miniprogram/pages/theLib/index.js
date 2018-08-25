//index.js
const app = getApp()

Page({
  data: {
    userInfo: {
      avatarUrl:'./user-unlogin.png'
    }
  },

  onLoad: function(option) {
    if (!wx.cloud) {
      wx.redirectTo({
        url: '../chooseLib/chooseLib',
      })
      return
    }
    console.log(option)
    if(!option.uid){
      wx.switchTab({
        url: '/pages/index/index',
      })
    }
    //通过query拿到这个用户的信息
    console.log(option.query)
  }

})
