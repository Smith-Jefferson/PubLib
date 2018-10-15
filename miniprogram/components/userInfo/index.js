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
      this.init();
    }
  },
  pageLifetimes: {
    show: function () {
      this.init();
    }
  },
  /**
   * 组件的方法列表
   */
  methods: {
    init: function () {
      this.setData({
        isMe: this.data.openId === app.globalData.openId
      })
      
      wx.cloud.callFunction({
        name: 'getUserInfo',
        data: {
          uid: this.data.openId
        }
      }).then(res => {
        if (!res || !res.result) {
          return;
        }
        console.log('userInfo',res.result)
        this.setData(res.result);
      })
    },
    editSkypeId: function (e) {
      if (!e.detail.value || e.detail.value == this.data.contact.skypeId) {
        return;
      }
      let contact = this.data.contact;
      contact.skypeId = e.detail.value;
      this.editContact(contact)
    },
    editWechatId: function (e) {
      if (!e.detail.value || e.detail.value == this.data.contact.wechatId) {
        return;
      }
      let contact = this.data.contact;
      contact.wechatId = e.detail.value;
      this.editContact(contact)
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
    },
    getGroupInfo: function (e) {
      wx.setStorageSync('gId' + e.currentTarget.dataset.gid, e.currentTarget.dataset.igroup);
      wx.navigateTo({
        url: '../theGroup/index?id=' + e.currentTarget.dataset.gid
      })
    },
    addGroup: function (e) {
      wx.navigateTo({
        url: '../theGroup/index'
      })
    }
  }
})