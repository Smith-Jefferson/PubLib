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
          //由于前期bug，很多用户没有存users表所以在这里补上，正常来讲不需要
          wx.getUserInfo({
            success: function (res) {
              let {
                userInfo
              } = res;
              wx.cloud.callFunction({
                name: 'saveUserInfo',
                data: {
                  briefUserInfo: userInfo
                }
              }).then(flag => {

              }).catch(console.error)
            }
          })

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
  onShow() {
    console.log('on show')
  }

})