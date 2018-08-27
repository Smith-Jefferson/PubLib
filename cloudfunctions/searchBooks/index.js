// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
    env: 'dev'
})

const db = cloud.database();
const collections = db.collection('books');

// 云函数入口函数
exports.main = (event, context) => {
    let {
        keywords,
        limit,
        from,
        openId
    } = event;

    let whereParams = {};

    if (keywords) {
        whereParams.title = keywords
    }
    if (keywords) {
        whereParams._openid = openId
    }
    if (Object.keys(whereParams).length > 0) {
        collections = collections.where(whereParams);
    }
    if (from && from > 0) {
        collections = collections.skip(from)
    }
    if (limit && limit > 0) {
        collections = collections.limit(limit)
    }
    return collections.get();

}