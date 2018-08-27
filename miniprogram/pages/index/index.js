//index.js
const app = getApp()

Page({
  data: {
    from: 0,
    limit: 30,
    end: false,
    keywords: '',
    inputValue: '',
    bookList: []
  },

  onLoad: function () {
    if (!wx.cloud) {
      return
    }

    wx.cloud.callFunction({
      name: 'login',
      data: {},
      success: res => {
        app.globalData.openId = res.result.openid; //注意此处小写
        wx.getUserInfo({
          success: res => {
            app.globalData.userInfo = res.userInfo
          }
        })
      },
      fail: err => {

      }
    });


  },
  onShow: function () {
    this.getBooksFromDB();
  },
  bindKeyInput: function (e) {
    this.setData({
      inputValue: e.detail.value
    })
  },
  scrolling: function (e) {

  },
  searchBooks: function () {
    this.setData({
      end: false,
      from: 0,
      keywords: this.data.inputValue,
      bookList: []
    });
    this.getBooksFromDB()
  },
  getMoreInfo: function (e) {
    //传参
    wx.navigateTo({
      url: '../theLib/index?uid=' + e.currentTarget.dataset.uid
    })
  },
  toLower: function (e) {
    if (this.data.end) return;
    this.setData({
      from: this.data.from + this.data.limit
    })
    this.getBooksFromDB();
  },
  /**云函数，有bug无法运行 */
  /**
  getBooksFromDB() {
    if (this.data.end) return;
    wx.cloud.callFunction({
      name: 'searchBooks',
      data: {
        from: this.data.from,
        keywords: this.data.keywords,
        limit: this.data.limit
      }
    }).then(res => {
      if (!res || !res.data || res.data.length == 0) {
        this.setData({
          bookList: []
        });
        return
      }
      let books = res.data.map(ele => {
        let theDate = new Date(ele.createAt);
        let theDateArr = [theDate.getFullYear(), theDate.getMonth() + 1, theDate.getDate()];
        return {
          image: ele.image,
          title: ele.title,
          author: ele.author && ele.author.join(','),
          createAt: theDateArr.join('-'),
          openId: ele._openid,
          userInfo: ele.userInfo
        }
      });

      this.setData({
        bookList: this.data.bookList.concat(books)
      });
      //必须分开，否则不渲染booklist？？
      if (res.data.length <= limit) {
        this.setData({
          end: true
        })
      }

    }).catch(err=>{
      console.log(err)
    })
  } */
  getBooksFromDB() {
    if (this.data.end) return;
    const db = wx.cloud.database();
    let collections = db.collection('books');
    if (this.data.keywords) {
      collections = collections.where({
        title: this.data.keywords
      });
    }
    if (this.data.from > 0) {
      collections = collections.skip(this.data.from)
    }
    collections.limit(this.data.limit).get({
      success: res => {
        console.log('got books from db', res.data)
        if (!res.data || res.data.length == 0) {
          this.setData({
            end: true
          })
          return;
        }


        let books = res.data.map(ele => {
          let theDate = new Date(ele.createAt);
          let theDateArr = [theDate.getFullYear(), theDate.getMonth() + 1, theDate.getDate()];
          return {
            image: ele.image,
            title: ele.title,
            author: ele.author && ele.author.join(','),
            createAt: theDateArr.join('-'),
            openId: ele._openid,
            userInfo: ele.userInfo
          }
        });

        this.setData({
          bookList: this.data.bookList.concat(books)
        });
        //必须分开，否则不渲染booklist？？
        if (res.data.length <= limit) {
          this.setData({
            end: true
          })
        }
      },
      fail: err => {}
    })
  }
})