// 云函数入口文件
const cloud = require('wx-server-sdk');
const _ = require('lodash');

cloud.init();

const db = cloud.database();


// 云函数入口函数
exports.main = async (event, context) => {
    let {
        userInfo,
        groups
    } = event;
    let {
        openId
    } = userInfo;

    try {
        let openIds = [];
        await Promise.all(groups.map(async (id) => {
            let uRes = await db.collection('groups').where({
                _id: id
            }).get();
            if (!uRes || !uRes.data || uRes.data.length == 0) {
                return;
            }
            let members = uRes.data[0].members;
            openIds = _.union(openIds, members);
        }))
        return openIds;
    } catch (err) {
        console.error(err);
        return;
    }
}