//index.js
const app = getApp();

Page({
  data: {
    id: '', //活动id
    activityInfo: {},
    isMe: false,
    isNew: false, //是否创建活动中
    imageDefaultPath: './image-default.png',
    imagePath: './image-default.png',
    buttonDisabled: true
  },

  onLoad: function (option) {
    if (!wx.cloud) {
      wx.redirectTo({
        url: '../chooseLib/chooseLib',
      })
      return
    }
    this.setData({
      userInfo: Object.assign({
        openId: app.globalData.openId
      }, app.globalData.userInfo)
    })
    //创建活动
    if (!option.id) {
      let theDate = new Date();
      let theDateArr = [theDate.getFullYear(), theDate.getMonth() + 1, theDate.getDate()];
      let theDateStr = theDateArr.join('-');

      this.setData({
        isNew: true,
        activityInfo: {
          date: theDateStr,
          fromTime: '18:00',
          toTime: '19:00',
          userInfo: this.data.userInfo
        }, //没有activityInfo的时候一定没有uid
        isMe: true
      })
    } else {
      let activityInfo = wx.getStorageSync('aId' + option.id);
      this.setData({
        activityInfo: activityInfo,
        isMe: activityInfo.userInfo.openId === this.data.userInfo.openId,
        imagePath: activityInfo.imageTempURL
      })
      this.checkFormValid();
    }
  },
  onPullDownRefresh: function (e) {
    wx.stopPullDownRefresh();
  },
  bindDateChange: function (e) {
    let activityInfo = this.data.activityInfo;
    activityInfo.date = e.detail.value;
    this.setData({
      activityInfo: activityInfo
    })
  },
  bindFTimeChange: function (e) {
    let activityInfo = this.data.activityInfo;
    activityInfo.fromTime = e.detail.value;
    this.setData({
      activityInfo: activityInfo
    })
  },
  bindTTimeChange: function (e) {
    let activityInfo = this.data.activityInfo;
    activityInfo.toTime = e.detail.value;
    this.setData({
      activityInfo: activityInfo
    })
  },
  bindTitleChange: function (e) {
    let activityInfo = this.data.activityInfo;
    activityInfo.title = e.detail.value;
    this.setData({
      activityInfo: activityInfo
    })
    this.checkFormValid();
  },
  bindDetailChange: function (e) {
    let activityInfo = this.data.activityInfo;
    activityInfo.detail = e.detail.value;
    this.setData({
      activityInfo: activityInfo
    })
    this.checkFormValid();
  },
  chooseImage: function (e) {
    if (!this.data.isMe) {
      return;
    }
    wx.chooseImage({
      count: 1,
      sizeType: ['original', 'compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        let imagePath = res.tempFilePaths[0];
        this.setData({
          imagePath: imagePath
        })
        this.checkFormValid();
      }
    })
  },
  uploadImage: function (id) {
    //uploadImage
    let originalImg = this.data.activityInfo.image || this.data.imageDefaultPath;
    let imageModified = this.data.imagePath !== originalImg;
    if (!imageModified) {
      return Promise.resolve();
    }
    return wx.cloud.uploadFile({
      cloudPath: 'activities/image_' + id + '.png',
      filePath: this.data.imagePath
    }).catch((err) => {
      console.log(err);
    })
  },
  addActivityToDB(dt) {
    const db = wx.cloud.database();
    let tobeStored = this.data.activityInfo;
    tobeStored.createdAt = new Date();
    return db.collection('activities').add({
      data: tobeStored
    }).catch((err) => {
      console.log(err);
    })
  },
  editActivityToDB(dt) {
    const db = wx.cloud.database();
    let tobeStored = {
      title: this.data.activityInfo.title,
      detail: this.data.activityInfo.detail,
      modifiedAt: this.data.activityInfo.modifiedAt,
      beginAt: this.data.activityInfo.beginAt,
      endBy: this.data.activityInfo.endBy
    }
    //如果图片有修改
    if (dt && dt.imageFileId) {
      tobeStored.imageFileId = dt.imageFileId
    }
    return db.collection('activities').doc(this.data.activityInfo._id).update({
      data: tobeStored
    }).catch(err => {
      console.log(err)
    })
  },
  updateImageFileIdToDB(id, imageFileId) {
    const db = wx.cloud.database();
    return db.collection('activities').doc(id).update({
      data: {
        imageFileId: imageFileId
      }
    }).catch(err => {
      console.log(err)
    })
  },
  saveActivityToDB() {
    return new Promise((resolve, reject) => {
      if (this.data.activityInfo._id) {
        this.uploadImage(this.data.activityInfo._id).then((uRes) => {
          this.editActivityToDB({
            imageFileId: uRes && uRes.fileID
          }).then((res) => {
            resolve(res);
          });
        })
      } else {
        this.addActivityToDB().then((aRes) => {
          this.uploadImage(aRes._id).then((uRes) => {
            if (!uRes || !uRes.fileID) {
              resolve();
              return;
            }
            this.updateImageFileIdToDB(aRes._id, uRes.fileID).then(() => {
              resolve();
            })
          })
        })
      }
    })

  },
  checkFormValid() {
    if (!this.data.activityInfo.title) {
      this.setData({
        buttonDisabled: true
      })
      return;
    }
    if (!this.data.activityInfo.detail) {
      this.setData({
        buttonDisabled: true
      })
      return;
    }
    if (!this.data.activityInfo.imageFileId && !this.data.imagePath) {
      this.setData({
        buttonDisabled: true
      })
      return;
    }
    this.setData({
      buttonDisabled: false
    })
  },
  submit: function (e) {
    if (!this.data.isMe) return;
    if (this.data.buttonDisabled) return;
    let activityInfo = Object.assign(this.data.activityInfo, {
      modifiedAt: new Date(),
      beginAt: new Date(this.data.activityInfo.date + ' ' + this.data.activityInfo.fromTime),
      endBy: new Date(this.data.activityInfo.date + ' ' + this.data.activityInfo.toTime)
    });
    this.setData({
      activityInfo
    })
    this.saveActivityToDB().then(() => {
      wx.switchTab({
        url: '/pages/myLib/index'
      })
    })

  }
})