//index.js
const app = getApp()
const regeneratorRuntime = require('../../utils/runtime');

Page({
  data: {
    from: 0,
    limit: 20,
    end: false,
    activities: [],
    searchDate: ''
  },
  onLoad: function () {
    if (!wx.cloud) {
      return
    }
    wx.showShareMenu({
      withShareTicket: true
    })
  },
  onShow:function(){
    wx.cloud.callFunction({
      name: 'login',
      data: {},
      success: res => {
        app.globalData.openId = res.result.openid; //注意此处小写
        wx.getUserInfo({
          success: res => {
            app.globalData.userInfo = res.userInfo;
            this.setData({
              from: 0,
              end: false,
              activities: []
            })
            this.getActivitiesFromDB();
          }
        })
      },
      fail: err => {
        wx.navigateTo({
          url: '/pages/login/index',
        })
      }
    });
  },
  refresh:function(){
    this.setData({
      from: 0,
      limit: 20,
      end: false,
      activities: [],
      searchDate: ''
    });
    getCurrentPages().reverse()[0].onShow();
  },
  onPullDownRefresh: function (e) {
    this.refresh();
    wx.stopPullDownRefresh();
  },
  onReachBottom: function (e) {
    if (this.data.end) return;
    this.setData({
      from: this.data.from + this.data.limit
    })
    this.getActivitiesFromDB().then(console.log);
  },
  scrolling: function (e) {

  },
  search: function () {
    this.setData({
      from: 0,
      end: false,
      activities: []
    })
    this.getActivitiesFromDB().then(console.log);
  },
  getMoreInfo: function (e) {
    wx.setStorageSync(
      'aId' + e.currentTarget.dataset.id,
      e.currentTarget.dataset.info
    );
    //传参
    wx.navigateTo({
      url: '../theActivity/index?id=' + e.currentTarget.dataset.id
    })
  },
  bindDateChange: function (e) {
    this.setData({
      searchDate: e.detail.value
    })
  },
  async getMyLeague() {
    let leagueInfo = wx.getStorageSync('myLeague');
    if (!leagueInfo) {
      leagueInfo = await wx.cloud.callFunction({
        name: 'getMyLeague',
        data: {}
      });
    }
    if (!leagueInfo) {
      leagueInfo = [app.globalData.openId]
    }
    this.setData({
      myLeague: leagueInfo
    })
  },
  async getActivitiesFromDB() {
    if (this.data.end) return;
    await this.getMyLeague();
    const db = wx.cloud.database();
    const _ = db.command;
    let collections = db.collection('activities');
    if (this.data.searching) {
      this.setData({
        from: 0
      })
    }
    let filter = {
      _openid: _.in(this.data.myLeague)
    }
    if (this.data.searchDate) {
      filter.date = this.data.searchDate
    }
    collections = collections.where(filter);

    if (this.data.from > 0) {
      collections = collections.skip(this.data.from)
    }
    let res = await collections.limit(this.data.limit).orderBy(
      'modifiedAt', 'desc'
    ).get();

    if (!res.data || res.data.length == 0) {
      this.setData({
        end: true
      })
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
      activities.push(activityInfo);
    }))

    this.setData({
      activities: this.data.activities.concat(activities)
    });
    if (res.data.length <= this.data.limit) {
      this.setData({
        end: true
      })
    }
  }
})