//index.js
const app = getApp();

Page({
  data: {
    id: '', //活动id
    groupInfo: {},
    isMe: false,
    isNew: false, //是否创建活动中
    imageDefaultPath: './image-default.png',
    imagePath: './image-default.png',
    buttonDisabled: true,
    groupMembers: [],
    isMember: false
  },

  onLoad: function (option) {
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
        } else {
          wx.navigateTo({
            url: '/pages/login/index',
          })
        }
      }
    })
    this.setData({
      userInfo: Object.assign({
        openId: app.globalData.openId
      }, app.globalData.userInfo)
    })
    //创建活动
    if (!option.id) {

      this.setData({
        isNew: true,
        groupInfo: {
          userInfo: this.data.userInfo,
          title: '',
          detail: ''
        }, //没有activityInfo的时候一定没有uid
        isMe: true
      })
    } else {
      let groupInfo = wx.getStorageSync('gId' + option.id);
      if (!groupInfo) {
        db.collection('groups').where({
          _id: option.id
        }).get().then((gRes) => {
          if (gRes && gRes.data && gRes.data.length > 0) {
            groupInfo = gRes.data[0];
            this.initAfterGroupInfo(groupInfo);
          }
        })
      } else {
        this.initAfterGroupInfo(groupInfo);
      }
      this.checkFormValid();
    }

    //分享功能
    wx.showShareMenu({
      withShareTicket: true
    })
  },
  onShareAppMessage: function (res) {
    console.log('from', res);
    return {
      title: '邀请您加入组织~'
    }
  },
  initAfterGroupInfo: function (groupInfo) {
    this.setData({
      groupInfo: groupInfo,
      isMe: groupInfo.userInfo.openId === this.data.userInfo.openId,
      isMember: groupInfo.members.indexOf(this.data.userInfo.openId) > -1
    })
    //获取临时图片url
    if (groupInfo.imageFileId) {
      wx.cloud.getTempFileURL({
        fileList: [groupInfo.imageFileId]
      }).then(tmpRes => {
        if (tmpRes && tmpRes.fileList && tmpRes.fileList.length > 0) {
          groupInfo.imageTempURL = tmpRes.fileList[0].tempFileURL;
        }
        this.setData({
          groupInfo: groupInfo,
          imagePath: groupInfo.imageTempURL
        })
        if (groupInfo.members && groupInfo.members.length > 0) {
          this.getMembers(groupInfo.members);
        }
      })
    }


  },

  getMembers: function (members) {
    wx.cloud.callFunction({
      name: 'getMembers',
      data: {
        members
      },
      success: (res) => {
        console.log('groupMembers', res)
        this.setData({
          groupMembers: res.result
        })
      }
    })
  },
  bindTitleChange: function (e) {
    let groupInfo = this.data.groupInfo;
    groupInfo.title = e.detail.value;
    this.setData({
      groupInfo: groupInfo
    })
    this.checkFormValid();
  },
  bindDetailChange: function (e) {
    let groupInfo = this.data.groupInfo;
    groupInfo.detail = e.detail.value;
    this.setData({
      groupInfo: groupInfo
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
    let originalImg = this.data.groupInfo.imageTempURL || this.data.imageDefaultPath;
    let imageModified = this.data.imagePath !== originalImg;
    if (!imageModified) {
      return Promise.resolve();
    }
    return wx.cloud.uploadFile({
      cloudPath: 'groups/image_' + id + '.png',
      filePath: this.data.imagePath
    }).catch((err) => {
      console.log(err);
    })
  },
  addGroupToDB(dt) {
    const db = wx.cloud.database();
    let tobeStored = this.data.groupInfo;
    tobeStored.createdAt = new Date();
    return db.collection('groups').add({
      data: tobeStored
    }).catch((err) => {
      console.log(err);
    })
  },
  editGroupToDB(dt) {
    const db = wx.cloud.database();
    let tobeStored = {
      title: this.data.groupInfo.title,
      detail: this.data.groupInfo.detail,
      modifiedAt: this.data.groupInfo.modifiedAt,
    }
    //如果图片有修改
    if (dt && dt.imageFileId) {
      tobeStored.imageFileId = dt.imageFileId
    }
    return db.collection('groups').doc(this.data.groupInfo._id).update({
      data: tobeStored
    }).catch(err => {
      console.log(err)
    })
  },
  updateImageFileIdToDB(id, imageFileId) {
    console.log('image save to db')
    const db = wx.cloud.database();
    return db.collection('groups').doc(id).update({
      data: {
        imageFileId: imageFileId
      }
    }).catch(err => {
      console.log(err)
    })
  },
  saveGroupToDB() {
    return new Promise((resolve, reject) => {
      if (this.data.groupInfo._id) {
        //编辑的话，先存图片，再更新数据库
        this.uploadImage(this.data.groupInfo._id).then((uRes) => {
          this.editGroupToDB({
            imageFileId: uRes && uRes.fileID
          }).then((res) => {
            resolve(res);
          });
        })
      } else {
        //新增的话，先添加数据库生成id，再根据id上传图片，再更新数据库，存入图片id
        //并且向user表加入group信息
        this.addGroupToDB().then((aRes) => {
          let groupInfo = this.data.groupInfo;
          groupInfo._id = aRes._id;
          this.setData({
            groupInfo: groupInfo
          })
          this.uploadImage(aRes._id).then((uRes) => {
            if (!uRes || !uRes.fileID) {
              resolve();
              return;
            }
            this.updateImageFileIdToDB(aRes._id, uRes.fileID).then(() => {
              console.log('joingroup')
              wx.cloud.callFunction({
                name: 'joinGroup',
                data: {
                  groupInfo: JSON.stringify(this.data.groupInfo)
                },
                success: res => {
                  resolve(res);
                },
                complete: console.log
              })

            })
          })
        })
      }
    })

  },
  checkFormValid() {
    if (!this.data.groupInfo.title) {
      this.setData({
        buttonDisabled: true
      })
      return;
    }
    if (!this.data.groupInfo.detail) {
      this.setData({
        buttonDisabled: true
      })
      return;
    }
    if (!this.data.groupInfo.imageFileId && this.data.imagePath == this.data.imageDefaultPath) {
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
    let groupInfo = Object.assign(this.data.groupInfo, {
      modifiedAt: new Date()
    });
    this.setData({
      groupInfo
    })
    this.saveGroupToDB().then(() => {
      wx.switchTab({
        url: '/pages/myLib/index'
      })
    })

  },
  join: function (e) {
    wx.cloud.callFunction({
      name: 'joinGroup',
      data: {
        groupInfo: JSON.stringify(this.data.groupInfo)
      },
      success: res => {
        wx.switchTab({
          url: '/pages/myLib/index'
        })
      }
    })
  }
})