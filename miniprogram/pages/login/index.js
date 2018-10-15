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
  onPullDownRefresh: function (e) {
    wx.stopPullDownRefresh();
  },

  onGetUserInfo: function (e) {
    if (e.detail.userInfo) {
      app.globalData.logged = true;
      app.globalData.userInfo = e.detail.userInfo

      wx.cloud.callFunction({
        name: 'saveUserInfo',
        data: {
          briefUserInfo: e.detail.userInfo
        }
      }).then(flag => {
        if (flag) {
          wx.navigateBack({
            delta: 1
          })
          return;
        }
      }).catch(console.error)
    }
  }
})