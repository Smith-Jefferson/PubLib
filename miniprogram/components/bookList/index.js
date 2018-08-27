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
      }).get({
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
    queryBookByISBN: function (isbnId) {
      console.log('isbnid', isbnId)
      return new Promise(function (resolve, reject) {
        wx.request({
          method: 'GET',
          url: 'https://www.yezhongqi.com/v2/book/isbn/' + isbnId,
          header: {
            "Content-Type": "json"
          },
          success: info => {
            console.log('info', info)
            resolve(info);
            // let bookInfo = info.data;
            // this.addBookToDB(bookInfo);
            // //将书加到显示列表中
            // let theDate = new Date();
            // let theDateArr = [theDate.getFullYear(), theDate.getMonth() + 1, theDate.getDate()];
            // this.data.bookList.push({
            //   image: bookInfo.image,
            //   title: bookInfo.title,
            //   author: bookInfo.author && bookInfo.author.join(','),
            //   createAt: theDateArr.join('-')
            // })
            // this.setData({
            //   bookList: this.data.bookList
            // })
          },
          fail: info => {
            console.log('fail info ', info)
            wx.showModal({
              title: '查询书籍失败',
              content: JSON.stringify(info)
            })
            reject(info)
          }
        })
      })
    },
    addBook: function () {
      let _self = this;
      console.log(_self)
      wx.scanCode({
        scanType: ['barCode'],
        success: res => {
          if (!res || !res.result) return;
          this.queryBookByISBN(res.result).then((bookRes) => {
            if (!bookRes || !bookRes.data) return;
            let bookInfo = bookRes.data;
            _self.addBookToDB(res.result, bookInfo).then(dbRes => {
              //将书加到显示列表中
              let theDate = new Date();
              let theDateArr = [theDate.getFullYear(), theDate.getMonth() + 1, theDate.getDate()];
              _self.data.bookList.push({
                image: bookInfo.image,
                title: bookInfo.title,
                author: bookInfo.author && bookInfo.author.join(','),
                createAt: theDateArr.join('-')
              })
              _self.setData({
                bookList: _self.data.bookList
              })
            }, addErr => {
              console.log(addErr)
              wx.showModal({
                title: 'queryBookByISBN失败',
                content: JSON.stringify(addErr)
              })
            }).catch(addErr => {
              console.log(addErr)
              wx.showToast({
                icon: 'none',
                title: '添加数据库失败'
              })
            })
          }).catch(dbErr => {
            console.log(dbErr)
            wx.showModal({
              title: '查询书籍数据失败',
              content: JSON.stringify(dbErr)
            })
            // wx.showToast({
            //   icon: 'none',
            //   title: '查询书籍数据失败'
            // })
          })

        },
        fail: scanRes => {
          wx.showModal({
            title: '获取扫描数据失败',
            content: JSON.stringify(scanRes)
          })
        }
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
    addBookToDB: function (scanId, info) {
      return new Promise((resolve, reject) => {
        const db = wx.cloud.database();
        db.collection('books').where({
          scanId: scanId
        }).count().then(findRes => {
          if (!findRes) reject('count DB error');
          if (!findRes.total || findRes > 0) reject('already exsist');
          let tobeStored = Object.assign({
            scanId: scanId,
            userInfo: app.globalData.userInfo,
            createAt: new Date()
          }, info);
          return db.collection('books').add({
            data: tobeStored
          }).then(res => {
            resolve(res);
          }).catch(err => {
            reject(err)
          })
        });
      })
    },
    //提供删除功能
  }
})