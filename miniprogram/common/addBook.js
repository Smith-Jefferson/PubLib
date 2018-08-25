let addBook = function(){
    wx.scanCode({
        success:(res)=>{
            wx.showModal({
                title:'test',
                content:JSON.stringify(res)
            })
        }
    })
}

module.exports = addBook;