//index.js
const app = getApp()

Page({
  data: {
    openId: ''
  },

  onLoad: function () {
    this.setData({
      openId: app.globalData.openId
    })
    if (!wx.cloud) {
      wx.redirectTo({
        url: '../chooseLib/chooseLib',
      })
      return
    }

    // 获取用户信息
    wx.getSetting({
      success: res => {
        if (res.authSetting['scope.userInfo']) {
          app.globalData.logged = true;
        } else {
          wx.navigateTo({
            url: '/pages/login/index',
          })
        }
      }
    })

    wx.showShareMenu({
      withShareTicket: true
    })
  },
  onPullDownRefresh: function (e) {
    wx.stopPullDownRefresh();
  },


})