import firestore, {getCountFromServer} from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import { Constants } from "../consts/Constants";
import Memory from '../core/Memory';

let lastMessageTime = null;
class FirebaseChatService {

    getNewMessageCount = (selectedData, receiverId, callback) => {
        let dbName = Memory().env == "LIVE" ? Constants.FIREBASE_LIVE_GROUP_MESSAGES_TABLE_NAME : Constants.FIREBASE_TEST_GROUP_MESSAGES_TABLE_NAME;
        let subFieldName = Memory().env == "LIVE" ? Constants.FIREBASE_LIVE_MESSAGES_TABLE_NAME : Constants.FIREBASE_TEST_MESSAGES_TABLE_NAME;

        // try {
        //     lastMessageTime = null;
        //     let firestore_unsub = firestore().collection(dbName)
        //         .doc(selectedData.grpId.trim())
        //         .collection(subFieldName)
        //         .where('is_read', '===', 1)
        //         .orderBy('sent_at', 'desc')
        //         .limit(Constants.FIREBASE_MESSAGES_PER_PAGE)
        //         .onSnapshot(function (querySnapshot, error) {
        //             // console.log(">>>>>>>> querySnapshot empty ::::: ", querySnapshot.empty)
        //             if (querySnapshot.empty) {
        //                 callback(messageList);
        //                 return firestore_unsub;
        //             } else {
        //                 querySnapshot.docChanges().forEach(function (msgData) {
        //                     console.log("------- querySnapshot getMessages ::::: ", msgData.doc.data());
        //                     
        //                 });
        //                 callback(messageList);
        //                 // isInitial = 0;
        //                 return firestore_unsub;
        //             }
        //         }, (error) => {
        //             console.log(">>>>>::::  error :: ", error);
        //         });
        //     return firestore_unsub;
        // } catch (error) {
        //     // console.log(">>>>>::::  error :: ", error);
        // }
    }
    getRecentChat = (userId, callback) => {
        let chatDataList = [];
        let count = 0;

        let dbName2 = Memory().env == "LIVE" ? Constants.FIREBASE_LIVE_GROUP_MESSAGES_TABLE_NAME : Constants.FIREBASE_TEST_GROUP_MESSAGES_TABLE_NAME;
        let subFieldName = Memory().env == "LIVE" ? Constants.FIREBASE_LIVE_MESSAGES_TABLE_NAME : Constants.FIREBASE_TEST_MESSAGES_TABLE_NAME;
        
        let dbName = Memory().env == "LIVE" ? Constants.FIREBASE_LIVE_GROUPS_TABLE_NAME : Constants.FIREBASE_TEST_GROUPS_TABLE_NAME;
        //let subFieldName = Memory().env == "LIVE" ? Constants.FIREBASE_LIVE_MESSAGES_TABLE_NAME : Constants.FIREBASE_TEST_MESSAGES_TABLE_NAME;

        let firestore_unsub = firestore()
            .collection(dbName)
            .where('members_user_id', 'array-contains', userId.toString())
            .orderBy('updated_at', 'desc')
            .onSnapshot((querySnapshot) => {
                //console.log('getRecentChat   ------------ got result  ',querySnapshot)
                if (querySnapshot ) {
                    if (querySnapshot.size == 0) {
                        callback(chatDataList, false, "");
                        return firestore_unsub;
                    }
                    chatDataList = [];
                    querySnapshot.docChanges().forEach(async function (chatData) {
                        //console.log(" ---------- getrecentChat :::::: ", chatData);
                        if (chatData.type === "added") {
                        
                            var data = chatData.doc.data();

                            data.id = chatData.doc.id;

                            let index = data.members_user_id.indexOf(userId.toString())
                            data.members_user_id.splice(index, 1);
                            try{
                                if(chatData.doc && chatData.doc.id)
                                {
                                    let newMsgs = await firestore().collection(dbName2)
                                        .doc(chatData.doc.id)
                                        .collection(subFieldName)
                                        .where('is_read', '==', 0)
                                        .get();
                                    var newMsgCnt = 0;
                                    if(newMsgs.size > 0)
                                    {   
                                        for(var ii = 0 ; ii < newMsgs.size; ii++)
                                        {
                                            var dataTmp = newMsgs._docs[ii];

                                            if(dataTmp && 
                                                dataTmp._data && 
                                                dataTmp._data.sent_by_user_id && 
                                                dataTmp._data.sent_by_user_id != userId.toString())
                                            {
                                                newMsgCnt++;
                                            }
                                        }
                                    }
                                   
                                    data.newMsgCnt = newMsgCnt;  
                                }

                            }catch(e22){}
                            
                            

                            //console.log('new messae cunt = ', data.newMsgCnt);
                            chatDataList.push(data);
                            count++;


                           
                                        //.size, newMsgs[0]

                            if (count == querySnapshot.size) {
                                console.log('yyyyyyyyy chat list count =', count);
                                callback(chatDataList, false, "a");
                            }


                            
                        } else if (chatData.type === "modified") {
                            // console.log(" --------- Modified chat: ", chatData.doc.data());
                            var data = chatData.doc.data();
                            data.id = chatData.doc.id;

                            console.log('>>>>>>>>  modifiedeeeeee', data);//ecJ4az9YGG73ah8otgl1

                            let index = data.members_user_id.indexOf(userId.toString())
                            data.members_user_id.splice(index, 1);


                            try{
                                if(chatData.doc && chatData.doc.id)
                                {
                                    let newMsgs = await firestore().collection(dbName2)
                                        .doc(chatData.doc.id)
                                        //.collection(subFieldName).where('is_read', '==', 0).get();
                                        .collection(subFieldName)
                                        .where('is_read', '==', 0)
                                        
                                        //.where('sent_by_user_id', '!=', userId.toString())
                                        // .orderBy('sent_at', 'desc')
                                        .get();
                                    
                                    var newMsgCnt = 0;
                                    if(newMsgs.size > 0)
                                    {
                                         //console.log('chat modified  ', newMsgs._docs);

                                        let prevSentData = null;
                                        for(var ii = 0 ; ii < newMsgs.size; ii++)
                                        {
                                            var dataTmp = newMsgs._docs[ii];
                                            if(dataTmp && 
                                                dataTmp._data && 
                                                dataTmp._data.sent_by_user_id && 
                                                dataTmp._data.sent_by_user_id != userId.toString())
                                            {
                                                newMsgCnt++;
                                            }
                                        }
                                    }
                                   
                                    data.newMsgCnt = newMsgCnt;  
                                }
                            }catch(e22){}
                            

                            callback(data, false, "m");


                            

                        } else if (chatData.type === "r") {
                            // console.log("Removed chat: ", chatData.doc.data());
                        }


                    });

                    // if(chatDataList.length > 0)
                    //     callback(chatDataList, false, "a");
                }

            });
        return firestore_unsub;
    };

    getMessages = (selectedData, currentUserId, callback) => {

        console.log('getmessages   ', selectedData, )
        let messageList = [];
        // let isInitial = 1;
        let dbName = Memory().env == "LIVE" ? Constants.FIREBASE_LIVE_GROUP_MESSAGES_TABLE_NAME : Constants.FIREBASE_TEST_GROUP_MESSAGES_TABLE_NAME;
        let subFieldName = Memory().env == "LIVE" ? Constants.FIREBASE_LIVE_MESSAGES_TABLE_NAME : Constants.FIREBASE_TEST_MESSAGES_TABLE_NAME;
        try {
            lastMessageTime = null;
            let firestore_unsub = firestore().collection(dbName)
                .doc(selectedData.grpId.trim())
                .collection(subFieldName)
                .orderBy('sent_at', 'desc')
                .limit(Constants.FIREBASE_MESSAGES_PER_PAGE)
                .onSnapshot(function (querySnapshot, error) {
                    //console.log(">>>>>>>> querySnapshot empty ::::: ", querySnapshot.empty)
                    if (querySnapshot.empty) {
                        callback(messageList);
                        return firestore_unsub;
                    } else {
                        querySnapshot.docChanges().forEach(function (msgData) {
                            console.log('firebasechatservice  msgDatamsgDatamsgData ', msgData.doc.data().text, msgData.type)
                            // console.log("------- querySnapshot getMessages ::::: ", msgData.doc.data());

                            if (msgData.type === "added" ) {

                                let data = msgData.doc.data();
                                data.id = msgData.doc.id;
                                data.message = data.text;
                                data.type = "text";
                                data.self = (parseInt(currentUserId) == parseInt(data.sent_by_user_id)) ? 1 : 0;
                                data.sent = data.sent_at.toDate();
                                if (data.is_read == null && data.is_read == undefined) {
                                    data.is_read = 1;

                                    console.log('not found is_read    >>> ', data)
                                }
                                data.imgpath = selectedData.imgpath;

                                if(data.sent_at.toDate() < lastMessageTime)
                                    messageList = [ data, ...messageList];
                                else
                                    messageList = [ ...messageList, data];


                              
//                                 if ( data.sent_at.toDate() < lastMessageTime) {
// 
//                                     console.log('firebasechatservice 21222   ', data)
//                                     messageList.push(data);     
//                                 } else {
// 
//                                     console.log('firebasechatservice  will update ', data)
// 
// 
//                                     if ( data.is_read == 0 ) {
//                                         //console.log('-----------------> is_read == 0 ', data, data.sent_at.toDate(), lastMessageTime, messageList[0].re);
//                                         for( let i = 0 ; i < messageList.length; i++ ) {
//                                             if ( data.sent_at.toDate() < messageList[i].re) {
//                                                 //console.log('-----------------> is_read == 0 22222 ', messageList[i]);
//                                                  messageList.splice(i, 0, data);
//                                                 
//                                                 break;
//                                             }
//                                         }
//                                         if(data.self !== 1)
//                                             {
//                                                 console.log('>>>>>>>>>>>>>>   ', data);
//                                             fcService.updateMsgToRead(data, selectedData);
//                                             }
//                                     } else {
//                                         messageList.unshift(data);
//                                     }
//                                 }
                                 lastMessageTime = data.sent_at.toDate();
                            } else if (msgData.type === "modified") {
                                let updateMsg = msgData.doc.data();
                                //{"is_read": 1, "sent_at": {"nanoseconds": 772000000, "seconds": 1689933312}, "sent_by_user_id": "1290", "text": "Hi, james"} 
                                console.log("getMessages Modified message 333: ", msgData.doc.data(), messageList);
                                messageList.forEach(msg => {
                                    try{
                                        if(updateMsg.text === msg.message && msg.self === 1 && updateMsg.is_read === 1 && 
                                        (updateMsg.sent_at.nanoseconds === msg.sent_at.nanoseconds && 
                                            updateMsg.sent_at.seconds === msg.sent_at.seconds ))
                                        {
                                            msg.is_read = 1;
                                        }
                                    }catch(e1){
                                        console.log("exception in getting modified message  = ", e1.message);
                                    }
                                    
                                })
                            } else if (msgData.type === "removed") {
                                // console.log("getMessages Removed message: ", msgData.doc.data());
                            } else {
                                console.log("getMessages updated ----- message: ", msgData.doc.data());
                            }
                        });
                        callback(messageList);
                        // isInitial = 0;
                        return firestore_unsub;
                    }
                }, (error) => {
                    console.log(">>>>>::::  error :: ", error);
                });
            return firestore_unsub;
        } catch (error) {
            // console.log(">>>>>::::  error :: ", error);
        }
    };

    loadMessages = (selectedData, currentUserId, callback) => {
        console.log(lastMessageTime, "lastMessageTime");
        let messageList = [];
        let isInitial = 1;
        let dbName = Memory().env == "LIVE" ? Constants.FIREBASE_LIVE_GROUP_MESSAGES_TABLE_NAME : Constants.FIREBASE_TEST_GROUP_MESSAGES_TABLE_NAME;
        let subFieldName = Memory().env == "LIVE" ? Constants.FIREBASE_LIVE_MESSAGES_TABLE_NAME : Constants.FIREBASE_TEST_MESSAGES_TABLE_NAME;
        try {
            firestore().collection(dbName)
                .doc(selectedData.grpId.trim())
                .collection(subFieldName)
                .orderBy('sent_at', 'desc')
                .startAfter(lastMessageTime)
                .limit(Constants.FIREBASE_MESSAGES_PER_PAGE)
                .get().then((querySnapshot) => {
                    if (querySnapshot.empty) {
                        messageList = [];
                        callback(messageList);
                    } else {
                        querySnapshot.docChanges().forEach(function (msgData) {
                            if (msgData.type === "added") {
                                let data = msgData.doc.data();
                                data.id = msgData.doc.id;
                                data.message = data.text;
                                data.type = "text";
                                data.self = (parseInt(currentUserId) == parseInt(data.sent_by_user_id)) ? 1 : 0;
                                data.sent = data.sent_at.toDate();
                                data.read = 1;
                                data.imgpath = selectedData.imgpath;
                                if (isInitial) {
                                    messageList.unshift(data);
                                } else {
                                    messageList.push(data);
                                }
                                lastMessageTime = data.sent_at.toDate();
                            } else if (msgData.type === "modified") {
                                // console.log("Modified message: ", msgData.doc.data());
                            } else if (msgData.type === "removed") {
                                // console.log("Removed message: ", msgData.doc.data());
                            }
                        });
                        callback(messageList);
                        isInitial = 0;
                        return;
                    }
                });
        } catch (error) {
            console.log("firebase load message >>>>>::::  error :: ", error);
        }
    };

    sendMessage = async (msgData, grpId) => {
        let dbName = Memory().env == "LIVE" ? Constants.FIREBASE_LIVE_GROUP_MESSAGES_TABLE_NAME : Constants.FIREBASE_TEST_GROUP_MESSAGES_TABLE_NAME;
        let collectionName = Memory().env == "LIVE" ? Constants.FIREBASE_LIVE_MESSAGES_TABLE_NAME : Constants.FIREBASE_TEST_MESSAGES_TABLE_NAME;
        try {
            var data = await firestore().collection(dbName)
                .doc(grpId)
                .collection(collectionName)
                .add(msgData)
                .then(function (data) {
                    return data;
                })
                .catch(function (error) {
                    return null;
                });
            if (data) {
                if (msgData.text == undefined && msgData.text == null) {
                    var updateGroupData = {
                        updated_at: new Date(),
                        last_message: "File",
                    };
                    this.updateLatestMessage(grpId, updateGroupData);
                } else {
                    var updateGroupData = {
                        updated_at: new Date(),
                        last_message: msgData.text,
                    };
                    this.updateLatestMessage(grpId, updateGroupData);
                }

            }
        } catch (error) {
            // console.log(">>>>>::::  error :: ", error);
        }
    };

    updateLatestMessage = (grpId, params) => {
        let dbName = Memory().env == "LIVE" ? Constants.FIREBASE_LIVE_GROUPS_TABLE_NAME : Constants.FIREBASE_TEST_GROUPS_TABLE_NAME;
        try {
            firestore().collection(dbName)
                .doc(grpId).update(params);
        } catch (error) {
        }
    };

    updateMsgToRead = (msg, selectedData) => {

        console.log('Firebasechatservice', 'updateMsgToRead22222', msg, selectedData, selectedData.grpId);
        let dbName = Memory().env == "LIVE" ? Constants.FIREBASE_LIVE_GROUP_MESSAGES_TABLE_NAME : Constants.FIREBASE_TEST_GROUP_MESSAGES_TABLE_NAME;
        let subFieldName = Memory().env == "LIVE" ? Constants.FIREBASE_LIVE_MESSAGES_TABLE_NAME : Constants.FIREBASE_TEST_MESSAGES_TABLE_NAME;
        firestore().collection(dbName)
            .doc(selectedData.grpId.trim())
            .collection(subFieldName)
            .doc(msg.id)
            .update({ is_read: 1 });
    }

    createChat = async (memberUserId, currentUserId) => {
        let dbName = Memory().env == "LIVE" ? Constants.FIREBASE_LIVE_GROUPS_TABLE_NAME : Constants.FIREBASE_TEST_GROUPS_TABLE_NAME;
        try {
            let groupData = {
                created_at: new Date(),
                created_by: currentUserId.toString(),
                members_user_id: [currentUserId.toString(), memberUserId.toString()],
                group_type_name: 'private',
                group_type: 1,
                is_old_chat_updated: 1,
                updated_at: new Date()
            };
            var newGrpId = await firestore().collection(dbName)
                .add(groupData)
                .then(function (docRef) {
                    return docRef.id;
                })
                .catch(function (error) {
                    console.log(">>>>>> createChat error :: ", error);
                    return null;
                });
            return newGrpId;
        } catch (error) {
        }
    };

    sendAttachmentFile = async (grpId, uri, name) => {

        try {
            let imageRef = storage().ref('chat_files').child((+new Date()) + '-' + name);
            await imageRef.putFile(uri).catch((error) => { throw error });
            let url = await imageRef.getDownloadURL().catch((error) => {
                console.log(" sendAttachmentFile getDownloadURL error : ", error);
                throw error;
            })
            return url;
        } catch (error) {
            console.log("sendAttachmentFile messageParams error: ", error);
            return false;
        }
    }

}

export const fcService = new FirebaseChatService()