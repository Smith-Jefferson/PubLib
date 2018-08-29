const app = getApp();

// miniprogram/components/userInfo/index.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    openId: {
      type: String,
      value: {}
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    userInfo: {
      avatarUrl: app.globalData.userInfo && app.globalData.userInfo.avatarUrl || './user-unlogin.png',
      nickName: app.globalData.userInfo && app.globalData.userInfo.nickName
    },
    contact: {}
  },
  lifetimes: {
    attached: function () {
      this.setData({
        isMe: this.data.openId === app.globalData.openId
      })
      const db = wx.cloud.database();
      db.collection('users').where({
        _openid: this.data.openId
      }).get({
        success: res => {
          if (!res.data || res.data.length == 0) {
            return;
          }
          this.setData({
            _id: res.data[0]._id,
            userInfo: res.data[0].userInfo,
            contact: res.data[0].contact
          })
        },
        fail: err => {
          if (this.data.openId == app.globalData.openId) {
            wx.navigateTo({
              url: '/pages/login/index',
            })
          }
        }
      })
    }
  },
  /**
   * 组件的方法列表
   */
  methods: {
    editSkypeId: function (e) {
      let skypeId = e.detail.value;
      this.editContact({
        skypeId: skypeId
      })
    },
    editContact: function (info) {
      const db = wx.cloud.database();
      db.collection('users').doc(this.data._id).update({
        data: {
          contact: info
        }
      }).then(res => {
        wx.showToast({
          title: '更新成功',
          icon: 'success'
        })
      }).catch(res => {
        wx.showToast({
          title: '更新失败',
          icon: 'none'
        })
      })
    }
  }
})