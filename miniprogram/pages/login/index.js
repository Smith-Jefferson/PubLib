//index.js
const app = getApp()

Page({
  data: {
    imgUrl: './user-unlogin.png',
    userInfo: {},
    logged: false,
    takeSession: false,
    requestResult: ''
  },

  onLoad: function () {

    // 获取用户信息
    wx.getSetting({
      success: res => {
        if (res.authSetting['scope.userInfo']) {
          app.globalData.logged = true;
          wx.switchTab({
            url: '/pages/myLib/index',
          })
        }

      }
    })
  },

  onGetUserInfo: function (e) {
    if (e.detail.userInfo) {
      app.globalData.logged = true;
      app.globalData.userInfo = {
        avatarUrl: e.detail.userInfo.avatarUrl,
        userInfo: e.detail.userInfo
      }
      wx.navigateBack({
        delta: 1
      })
    }
  }
})