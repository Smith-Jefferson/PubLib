//index.js
const app = getApp()

Page({
  data: {
    openId:''
  },

  onLoad: function (option) {
    if (!wx.cloud) {
      wx.redirectTo({
        url: '../chooseLib/chooseLib',
      })
      return
    }
    if (!option.uid) {
      wx.switchTab({
        url: '/pages/index/index',
      })
    }
    this.setData({
      openId: option.uid
    })
  }

})