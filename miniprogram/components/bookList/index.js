const app = getApp();

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
    bookList: []
  },
  lifetimes: {
    attached: function () {
      this.setData({
        isMe: this.data.openId === app.globalData.openId
      })

      const db = wx.cloud.database();
      db.collection('books').where({
        _openid: this.data.openId
      }).orderBy(
        'createAt', 'desc'
      ).get({
        success: res => {
          if (!res.data || res.data.length == 0) {
            return;
          }
          let books = res.data.map(ele => {
            let theDate = new Date(ele.createAt);
            let theDateArr = [theDate.getFullYear(), theDate.getMonth() + 1, theDate.getDate()];
            return {
              image: ele.image,
              title: ele.title,
              author: ele.author && ele.author.join(','),
              createAt: theDateArr.join('-')
            }
          });
          this.setData({
            bookList: books
          })
        },
        fail: err => {}
      })
    }
  },
  /**
   * 组件的方法列表
   */
  methods: {
    //判断是否已存在
    checkWhetherbookExsist: function (scanId) {
      return new Promise((resolve, reject) => {
        const db = wx.cloud.database();
        db.collection('books').where({
          scanId: scanId,
          _openid: this.data.openId
        }).count().then(findRes => {
          if (!findRes) {
            reject('count DB error');
            return;
          }
          if (findRes.total && findRes.total > 0) {
            reject('already exsist');
            return;
          }
          resolve(findRes.total)
        }).catch(err => {
          reject(err);
        })
      })
    },
    //查询豆瓣接口
    queryBookByISBN: function (isbnId) {
      return new Promise(function (resolve, reject) {
        wx.request({
          method: 'GET',
          url: 'https://www.yezhongqi.com/v2/book/isbn/' + isbnId,
          header: {
            "Content-Type": "json"
          },
          success: bookRes => {
            if (!bookRes || !bookRes.data || bookRes.data.code && bookRes.data.code >= 6000) {
              reject(bookRes);
              return;
            }
            resolve(bookRes.data);
          },
          fail: info => {
            reject(info)
          }
        })
      })
    },
    //扫描获取isbn
    scanBook: function () {
      return new Promise(function (resolve, reject) {
        wx.scanCode({
          scanType: ['barCode'],
          success: res => {
            if (!res || !res.result) {
              reject();
              return;
            }
            resolve(res.result);
          },
          fail: scanRes => {
            reject(scanRes)
          }
        })
      })
    },
    //点击添加按钮执行
    addBook: function () {
      try {
        this.scanBook().then(isbnId => {
          this.checkWhetherbookExsist(isbnId).then((total) => {
            this.queryBookByISBN(isbnId).then((bookInfo) => {
              this.addBookToDB(isbnId, bookInfo).then(dbRes => {
                wx.showToast({
                  title: '添加成功',
                  icon: 'success'
                })
                //将书加到显示列表中
                let theDate = new Date();
                let theDateArr = [theDate.getFullYear(), theDate.getMonth() + 1, theDate.getDate()];
                this.data.bookList.unshift({
                  image: bookInfo.image,
                  title: bookInfo.title,
                  author: bookInfo.author && bookInfo.author.join(','),
                  createAt: theDateArr.join('-')
                })
                this.setData({
                  bookList: this.data.bookList
                })
              }).catch(err => {
                console.log(err)
              })
            }).catch(err => {
              console.log(err)
            })
          }).catch(err => {
            console.log(err)
          })
        }).catch(err => {
          console.log(err)
        })
      } catch (err) {
        //添加日志
      }
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
    //添加到数据库
    addBookToDB: function (scanId, info) {
      const db = wx.cloud.database();
      let tobeStored = Object.assign({
        scanId: scanId,
        userInfo: app.globalData.userInfo,
        createAt: new Date()
      }, info);
      return db.collection('books').add({
        data: tobeStored
      });
    },
    //提供删除功能
  }
})