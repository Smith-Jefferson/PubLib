// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init();

const db = cloud.database();
const _ = db.command;


// 云函数入口函数
exports.main = async (event, context) => {
    console.log('event', event)
    let {
        userInfo,
        data
    } = event;
    let {
        openId
    } = userInfo;
    let {
        tobeStored,
        groupId
    } = data;
    //添加到数据库

    try {
        
        await db.collection('groups').where({
            _id: groupId
        }).update({
            data: tobeStored
        })
        //同步更新users表中的groups的title
        if (!tobeStored.title) {
            return true;
        }
        let gInfo = await db.collection('groups').where({
            _id: groupId
        }).get();
        if (!gInfo || !gInfo.data || gInfo.data.length == 0) {
            return false;
        }
        let {
            members
        } = gInfo.data[0];
        if(!members || members.length==0){
            return;
        }
        await Promise.all(members.map(async(uid)=>{
            await db.collection('users').where({
                _openid: uid
            }).update({
                data: {
                    groups: _.push({
                        id: groupInfo._id,
                        title: groupInfo.tilte
                    })
                }
            })
        }));
        return true;
    } catch (err) {
        console.error(err);
        return false;
    }
}