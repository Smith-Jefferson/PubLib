//index.js
const app = getApp()

Page({
  data: {
    avatarUrl: './user-unlogin.png',
    userInfo: {},
    logged: false,
    takeSession: false,
    requestResult: '',
    imgUrl:'./user-unlogin.png'
  },

  onLoad: function() {
    if (!wx.cloud) {
      
      return
    }

    wx.cloud.callFunction({
      name: 'login',
      data: {},
      success: res => {
        app.globalData.openid = res.result.openid;
      },
      fail: err => {

      }
    });
  },
  getMoreInfo:function(e){
    //传参
    wx.navigateTo({
      url:'../theLib/index?uid=111'
    })
  }
})
