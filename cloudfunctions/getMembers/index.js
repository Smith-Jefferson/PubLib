// 云函数入口文件
const cloud = require('wx-server-sdk');

cloud.init();

const db = cloud.database();


// 云函数入口函数
exports.main = async (event, context) => {
    let {
        userInfo,
        members
    } = event;
    let {
        openId
    } = userInfo;

    let membersInfo = [openId];
    try {
        
        await Promise.all(members.map(async (id) => {
            let gRes = await db.collection('users').where({
                _openid: id
            }).get();
            if (gRes && gRes.data && gRes.data.length > 0) {
                membersInfo.push(gRes.data[0])
            }
        }));
        return membersInfo;
    } catch (err) {
        console.error(err);
        return ;
    }
}