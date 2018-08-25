//index.js
const app = getApp()

Page({
  data: {
    userInfo: {
      avatarUrl: './user-unlogin.png',
      nickName: app.globalData.userInfo && app.globalData.userInfo.nickName
    }
  },

  onLoad: function () {
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
        }
      }
    })
  },
  onShow: function () {
    if (app.globalData.logged) {
      if (app.globalData.userInfo && app.globalData.userInfo.nickName) {
        this.setData({
          userInfo: app.globalData.userInfo
        })
      } else {
        wx.getUserInfo({
          success: res => {
            app.globalData.userInfo = res.userInfo;
            this.setData({
              userInfo: app.globalData.userInfo
            })
          },
          fail: res => {
            wx.switchTab({
              url: '/pages/login/index',
            })
          }
        })
      }
    } else {
      wx.switchTab({
        url: '/pages/login/index'
      });
    }
  },
  addBook: function () {
    console.log('addBook')
    wx.request({
      method:'GET',
      url: 'https://api.douban.com/v2/book/isbn/9787121335228',
      success: info => {
        wx.showModal({
          title: 'test',
          content: JSON.stringify(info)
        })
        this.addBookToDB(info)
      },
      fail: info => {
        wx.showModal({
          title: 'test',
          content: JSON.stringify(info)
        })
      }
    })
    return;
    //
    wx.scanCode({
      scanType: ['barCode'],
      success: res => {
        wx.request({
          method:'GET',
          header: {
            'content-type': 'application/json; charset=utf-8'
          },
          url: 'https://api.douban.com/v2/book/isbn/' + res.result,
          success: info => {
            wx.showModal({
              title: 'test',
              content: JSON.stringify(info)
            })
            this.addBookToDB(info)
          },
          fail: info => {
            wx.showModal({
              title: 'test',
              content: JSON.stringify(info)
            })
          }
        })
      },
      fail: res => {
        wx.showModal({
          title: 'test',
          content: JSON.stringify(res)
        })
      }
    })
  },
  addBookToDB: function (info) {
    const db = wx.cloud.database()
    db.collection('books').add({
      data: Object.assign({}, info),
      success: res => {
        // 在返回结果中会包含新创建的记录的 _id
        this.setData({
          counterId: res._id,
          count: 1
        })
        wx.showToast({
          title: '新增记录成功',
        })
        console.log('[数据库] [新增记录] 成功，记录 _id: ', res._id)
      },
      fail: err => {
        wx.showToast({
          icon: 'none',
          title: '新增记录失败'
        })
        console.error('[数据库] [新增记录] 失败：', err)
      }
    })
  }

})