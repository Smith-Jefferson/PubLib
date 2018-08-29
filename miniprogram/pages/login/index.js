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
      //添加到数据库
      const db = wx.cloud.database();
      let tobeStored = {
        createAt: new Date(),
        userInfo: e.detail.userInfo,
        contact: {}
      };
      db.collection('users').where({
        _openid: app.globalData.openId
      }).get({
        success: res => {
          if (res.data && res.data.length > 0) {
            wx.navigateBack({
              delta: 1
            })
            return;
          }
          db.collection('users').add({
            data: tobeStored,
            success: res => {
              // wx.showToast({
              //   title: '添加成功',
              // })
            },
            fail: err => {
              // wx.showToast({
              //   icon: 'none',
              //   title: '新增记录失败'
              // })
            },
            complete: res => {
              wx.navigateBack({
                delta: 1
              })
            }
          })
        },
        fail: err => {},
        complete: res => {
          wx.navigateBack({
            delta: 1
          })
        }
      })
    }
  }
})