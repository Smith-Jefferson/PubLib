const app = getApp();
const regeneratorRuntime = require('../../utils/runtime');


// miniprogram/components/bookList/index.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    openId: {
      type: String,
      value: ''
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    activities: []
  },
  lifetimes: {
    attached: function () {   
      this.init().then(console.log)
    }
  },
  pageLifetimes: {
    show: function () {
      this.init().then(console.log)
    }
  },

  /**
   * 组件的方法列表
   */
  methods: {
    async init() {
      this.setData({
        isMe: this.data.openId === app.globalData.openId
      })
      const db = wx.cloud.database();
      let res = await db.collection('activities').where({
        _openid: this.data.openId
      }).orderBy('createdAt', 'desc').get();

      if (!res || !res.data || res.data.length == 0) {
        return;
      }
      let activities = [];
      await Promise.all(res.data.map(async (activityInfo) => {
        let tmpRes = await wx.cloud.getTempFileURL({
          fileList: [activityInfo.imageFileId]
        });
        if (tmpRes && tmpRes.fileList && tmpRes.fileList.length > 0) {
          activityInfo.imageTempURL = tmpRes.fileList[0].tempFileURL;
        }

        let theDate = new Date(activityInfo.createdAt);
        let theDateArr = [theDate.getFullYear(), theDate.getMonth() + 1, theDate.getDate()];
        activityInfo.createdAt = theDateArr.join('-'); //有filter或者pipe相应功能么？

        activities.push(activityInfo);
      }));
      this.setData({
        activities: activities
      })

    },
    getUserInfo: function () {
      if (!app.globalData.userInfo) {
        wx.getUserInfo({
          success: res => {
            app.globalData.userInfo = res.userInfo
          }
        })
      }
    },
    addActivity(e) {
      wx.navigateTo({
        url: '../theActivity/index'
      })
    },
    getMoreInfo(e) {
      wx.setStorageSync(
        'aId' + e.currentTarget.dataset.id,
        e.currentTarget.dataset.info
      );
      wx.navigateTo({
        url: '../theActivity/index?id=' + e.currentTarget.dataset.id
      })
    }
    //提供删除功能
  }
})