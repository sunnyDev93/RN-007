import React, { Component } from "react";
import {
    Alert,
    Platform,
    StyleSheet,
    Text,
    View,
    Image,
    TextInput,
    FlatList,
    TouchableOpacity,
    Keyboard,
    Dimensions,
    SafeAreaView,
} from "react-native";
import Emojis from "../customview/Emojis";
import ActionButton from "react-native-action-button";
import { EventRegister } from "react-native-event-listeners";
import ProgressIndicator from "./ProgressIndicator";
import PullDownIndicator from "./PullDownIndicator";
import RowRecentMessage from "./RowRecentMessage";
import WebService from "../core/WebService";
import { Constants } from "../consts/Constants";
import { Colors } from "../consts/Colors";
import * as Global from "../consts/Global";
import { stylesGlobal, STICKY_HEADER_HEIGHT } from "../consts/StyleSheet";
import Memory from "../core/Memory";
import { ImageCompressor } from "./ImageCompressorClass";
import HeaderView from "../customview/HeaderView";
import CustomPopupView from "../customview/CustomPopupView";
import PopupView from "../customview/PopupView";
import NotificationPopupView from "../customview/NotificationPopupView";
import BannerView from "../customview/BannerView";
import AsyncStorage from "@react-native-community/async-storage";
import auth from "@react-native-firebase/auth";
import { fcService } from "../utils/FirebaseChatService";

import * as RootNavigation from '../utils/ReactNavigation';

const isIos = Platform.OS === "ios";
const isIphoneX =
    isIos &&
    (Dimensions.get("window").height === 812 ||
        Dimensions.get("window").height === 896);
const bottomPadding = isIphoneX ? 36 : 0;

var array_recent_chat = [];
var TAG = "MyRecentMessagesScreen";

export default class MyRecentMessagesScreen extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            pulldown_loading: false,
            userId: "",
            userToken: "",
            loading: true,
            dataRecentChat: array_recent_chat,
            displayRecentChat: false,
            openSearchBar: true,
            searchText: "",
            showModel: false,
            showNotificationModel: false,
            is_verified: "",
            memberPlan: 0,
            chat_count: 0, // notification chat count
            chatAuthToken: "",
        };
        this.unsubscribe = null;
    }

    UNSAFE_componentWillMount() {


        //console.log('sasasasasasa', RootNavigation.getCurrentRoute());
        this.listener = EventRegister.addEventListener(
            Constants.EVENT_PROFILE_IMAGE_UPDATED,
            () => {
                console.log(TAG, "EVENT_PROFILE_IMAGE_UPDATED event called");
                this.refreshProfileImage();
            }
        );
        this.listenerNotificationChange = EventRegister.addEventListener(
            Constants.EVENT_NOTIFICATION_CHANGED,
            async () => {
                try {
                    let chat_count = await AsyncStorage.getItem("CHAT");
                    console.log(TAG, "EVENT_NOTIFICATION_CHANGED event called");
                    if (chat_count.toString() != "0") {
                        this.getData();
                    }
                } catch (error) {
                    console.log(" ---------- notification EVENT_NOTIFICATION_CHANGED event called ");
                }
            }
        );
    }

    componentDidMount() {
        this.getData();
    }

    componentWillUnmount() {
        EventRegister.removeEventListener(this.listener);
        EventRegister.removeEventListener(this.listenerNotificationChange);
        if (this.unsubscribe != undefined && this.unsubscribe != null) {
            this.unsubscribe();
            this.unsubscribe = undefined;
            console.log('------------->>>>>>>  >>>>>>> unsubscribe cleard')
        }
        // this.forcusListener();
        // AsyncStorage.removeItem("MyRecentChatList");
    }
    /**
     * clear state data
     */
    clearStateData = () => {
        // array_recent_chat = [];
        this.setState({
            userId: "",
            userToken: "",
            // loading: false,
            dataRecentChat: array_recent_chat,
            displayRecentChat: false,
            openSearchBar: true,
            searchText: "",
            showModel: false,
        });
    };
    /**
     * get asyns storage data
     */
    getData = async () => {
        try {
            AsyncStorage.setItem(Constants.KEY_NOTIFICATION_COUNT, "");
            var userId = await AsyncStorage.getItem(Constants.KEY_USER_ID);
            var userToken = await AsyncStorage.getItem(Constants.KEY_USER_TOKEN);
            // var aaa = await AsyncStorage.getItem(Constants.KEY_NOTIFICATION_COUNT);
            var userImageName = await AsyncStorage.getItem(Constants.KEY_USER_IMAGE_NAME);
            var userImagePath = await AsyncStorage.getItem(Constants.KEY_USER_IMAGE_URL);
            var is_verified = await AsyncStorage.getItem(Constants.KEY_IS_VERIFIED);
            var memberPlan = await AsyncStorage.getItem(Constants.KEY_MEMBER_PLAN);
            this.setState({
                userId: userId,
                userToken: userToken,
                userImageName,
                userImagePath,
                is_verified: is_verified,
                memberPlan,
            });
            // if(is_verified == "1") {
            
            var recent_chat_array = await AsyncStorage.getItem("MyRecentChatList");
            if (recent_chat_array != null) {
                array_recent_chat = JSON.parse(recent_chat_array);
                this.setState({ dataRecentChat: array_recent_chat, loading: false });
            }
            await this.callGetChatToken();
        } catch (error) {
            console.log(error);
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(
                    error
                        .replace(/<\/?[^>]+>/gi, "")
                        .replace(/\\n/g, "")
                        .replace(/\"/g, "")
                );
            }
        }
    };

    scrolltoTop_mainScrollView() {
        if (this.refs.mainscrollView) {
            this.refs.mainscrollView.scrollToOffset({ offset: 0, animated: true });
        }
    }

    // getOldChatList = async () => {
    //     try {
    //         let uri = Memory().env == "LIVE" ? Global.URL_GET_OLD_RECENT_CHATLIST : Global.URL_GET_OLD_RECENT_CHATLIST_DEV;
    //         console.log(TAG, " getOldChatList uri : ", uri);
    //         let result = await WebService.apiCallGeneralPost(uri);
    //         if (result == false) {
    //             return [];
    //         }
    //         if (result.status == "success") {
    //             return result.data;
    //         } else {
    //             return [];
    //         }
    //     } catch (error) {
    //         console.log(TAG, " getOldChatList error : ", error);
    //         if (error != undefined && error != null && error.length > 0) {
    //             Alert.alert(error.replace(/<\/?[^>]+>/gi, "").replace(/\\n/g, "").replace(/\"/g, ""));
    //         }
    //     }
    // };

    callGetChatToken = async () => {
        try {
            let uri = Memory().env == "LIVE" ? Global.URL_GET_CHAT_TOKEN : Global.URL_GET_CHAT_TOKEN_DEV;
            if (this.state.userToken == undefined) {
                this.setState({ userToken: await AsyncStorage.getItem(Constants.KEY_USER_TOKEN) });
            }
            let params = new FormData();
            params.append("token", this.state.userToken);
            params.append("format", "json");
            console.log(TAG + " callGetChatTokenAPI uri " + uri, this.state.userToken);
            console.log(TAG + " callGetChatTokenAPI params " + JSON.stringify(params));
            WebService.callServicePost(uri, params, this.handleCallGetChatTokenResponse);
        } catch (error) {
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(
                    error
                        .replace(/<\/?[^>]+>/gi, "")
                        .replace(/\\n/g, "")
                        .replace(/\"/g, "")
                );
            }
            this.setState({ pulldown_loading: false, loading: false });
        }
    };
    /**
     * handle get chat token API response
     */
    handleCallGetChatTokenResponse = async (response, isError) => {
        // console.log(TAG + " callGetChatTokenAPI Response " + JSON.stringify(response));
        console.log(TAG + " callGetChatTokenAPI isError " + isError);
        if (!isError) {
            if (response != null && response.status == "success") {
                Global.CHAT_AUTH_TOKEN = response.data.chatToken;
                this.setState(
                    { chatAuthToken: response.data.chatToken },
                    () => this.firebaseAuthWithToken());
            } else {
                this.setState({ loading: false });
            }
        } else {
            this.setState({ loading: false });
            if (response != undefined && response != null && response.length > 0) {
                Alert.alert(response.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    };

    firebaseAuthWithToken = async () => {
         console.log("firebase auth token333333", this.state.chatAuthToken);
         if(this.unsubscribe)
            return;
        console.log('firebase auth 22222222');
        auth()
            .signInWithCustomToken(this.state.chatAuthToken)
            .then((userCredential) => {

                // if(!this.unsubscribe)
                //     {
                //         this.unsubscribe();
                //         this.unsubscribe = undefined;
                //     }

                    this.unsubscribe = fcService.getRecentChat(this.state.userId, this.handleFirebaseRecentChatResponse);
            })
            .catch((error) => {
                console.log("firebase auth error", error);
            });
    };

    handleFirebaseRecentChatResponse = async (response, isError, type) => {
console.log('handleFirebaseRecentChatResponse   ------------ got result  ', type)
        if (isError) {
            this.setState({ dataRecentChat: [], displayRecentChat: true });
            try {
                await AsyncStorage.setItem("MyRecentChatList", JSON.stringify([]));
            } catch (error) { }
        } else {
            if (type == "a") {
                console.log('chat ---------> added');
                let chatUserList = [];
                let memberUserIds = [];
                let memberUsersLastMsg = [];

                for (var i = 0; i < response.length ; i++) {
                    var data = response[i];
                    if (data.group_type == 1) {
                        if (!memberUserIds.includes(parseInt(data.members_user_id[0]))) {
                            memberUserIds.push(parseInt(data.members_user_id[0]));
                            memberUsersLastMsg.push(data);
                        } else {
                            for (let j = 0; j < memberUsersLastMsg.length; j++) {
                                if (memberUsersLastMsg[j].group_type == 1 && memberUsersLastMsg[j].members_user_id[0].toString() == data.members_user_id[0].toString() && memberUsersLastMsg[j].updated_at.seconds < data.updated_at.seconds) {
                                    memberUsersLastMsg[j] = data;
                                    break;
                                }
                            }
                        }
                    } else {
                        if (data.group_type == 2) {
                            memberUsersLastMsg.push(data);
                        }
                    }
                }
                // console.log(" ------- memberUsersLastMsg.length : ", memberUsersLastMsg.length, memberUserIds.length);
                if (memberUsersLastMsg.length > 0) {
                    try {
                        let uri = Memory().env == "LIVE" ? Global.URL_GET_CHAT_USERS_INFO : Global.URL_GET_CHAT_USERS_INFO_DEV;
                        let params = { "format": "json", "memberUserIDs": memberUserIds };
                        let memberUserDatas = await WebService.callChatUserServicePost(uri, params);

                        memberUserDatas = memberUserDatas.data;
                       // console.log('--------------------- lastlogin data = ', memberUserDatas);

                        for (let j = 0; j < memberUsersLastMsg.length; j++) {
                            
                            // console.log(" --- memberUsersLastMsg[j].updated_at : ", memberUsersLastMsg[j].id);
                            if (memberUsersLastMsg[j].group_type == 1) {
                                for (let i = 0; i < memberUserDatas.length; i++) {


                                    // if(memberUserDatas[i].userName.includes('Takshak'))
                                    // {
                                    //     console.log('--------------------- lastlogin data = Takshak =  ', memberUserDatas[i]);
                                    // }


                                    // console.log(" --- memberUserDatas[i].id.toString() : ", memberUserDatas[i].id.toString());
                                    if (memberUsersLastMsg[j].members_user_id[0].toString() == memberUserDatas[i].id.toString()) {
                                        let memberUsersInfo = {};
                                        memberUsersInfo["first_name"] = memberUserDatas[i].userName.split(" ")[0];
                                        memberUsersInfo["last_name"] = memberUserDatas[i].userName.split(" ")[1];
                                        memberUsersInfo["slug"] = memberUserDatas[i].slug;
                                        memberUsersInfo["imgpath"] = `${memberUserDatas[i].profile_imgpath}${memberUserDatas[i].profile_filename}`;
                                        memberUsersInfo["role"] = "single";
                                        memberUsersInfo["type"] = "text";
                                        memberUsersInfo["status"] = "offline";
                                        memberUsersInfo["userId"] = memberUserDatas[i].id.toString();
                                        memberUsersInfo["m"] = memberUsersLastMsg[j].last_message;
                                        memberUsersInfo["t"] = memberUsersLastMsg[j].updated_at.toDate();
                                        memberUsersInfo["id"] = memberUsersLastMsg[j].id;
                                        memberUsersInfo["is_old"] = 0;
                                        memberUsersInfo["newMsgCnt"] = memberUsersLastMsg[j].newMsgCnt;
                                        memberUsersInfo["last_loginedin"] = memberUserDatas[i].last_lognedin;
                                        chatUserList.push(memberUsersInfo);
                                        break;
                                    }
                                }
                            } else if (memberUsersLastMsg[j].group_type == 2) {
                                // console.log("group chat ", memberUsersLastMsg[j]);
                                if (memberUsersLastMsg[j].isGroupChat == 1) {
                                    let groupChatInfor = {};
                                    groupChatInfor["first_name"] = memberUsersLastMsg[j].name;
                                    groupChatInfor["last_name"] = "";
                                    groupChatInfor["slug"] = "";
                                    groupChatInfor["imgpath"] = "";
                                    groupChatInfor["role"] = "group";
                                    groupChatInfor["type"] = "text";
                                    groupChatInfor["status"] = "offline";
                                    groupChatInfor["userId"] = this.state.userId;
                                    groupChatInfor["m"] = memberUsersLastMsg[j].last_message;
                                    groupChatInfor["t"] = memberUsersLastMsg[j].updated_at.toDate();
                                    groupChatInfor["id"] = memberUsersLastMsg[j].id;
                                    groupChatInfor["users"] = memberUsersLastMsg[j].members_user_id;
                                    groupChatInfor["is_old"] = 0;
                                    groupChatInfor["newMsgCnt"] = memberUsersLastMsg[j].newMsgCnt;
                                   // groupChatInfor["last_loginedin"] = memberUserDatas[i].last_lognedin;
                                    chatUserList.push(groupChatInfor);
                                }
                            } else {
                                // console.log(" ------- special  chat ", memberUsersLastMsg[j]);
                            }
                        }
                        // let oldchatList = [];
                        // let oldChatListData = await this.getOldChatList();
                        // if (oldChatListData.length > 0) {
                        //     for (let i = 0; i < oldChatListData.length; i++) {
                        //         // console.log( " ----------------------- ", oldChatListData[i]);
                        //         let index = oldChatListData[i].members_user_id.indexOf(this.state.userId.toString())
                        //         oldChatListData[i].members_user_id.splice(index, 1);
                        //         let currentId = oldChatListData[i].members_user_id[0].toString();
                        //         if (oldChatListData[i].is_store_to_firebase == 0) {
                        //             if (memberUserIds.includes(parseInt(currentId))) {
                        //                 for (let i = 0; i < chatUserList.length; i++) {
                        //                     if ( chatUserList[i].userId.toString() == currentId.toString() ) {
                        //                         chatUserList[i].is_old = 1;
                        //                     }
                        //                 }
                        //             } else {
                        //                 let memberData = oldChatListData[i].memberUsersInfo[currentId];
                        //                 let memberUsersInfo = {};
                        //                 memberUsersInfo["first_name"] = memberData.userName.split(" ")[0];
                        //                 memberUsersInfo["last_name"] = memberData.userName.split(" ")[1];
                        //                 memberUsersInfo["slug"] = memberData.slug;
                        //                 memberUsersInfo["imgpath"] = `${memberData.profile_imgpath}${memberData.profile_filename}`;
                        //                 memberUsersInfo["role"] = "single";
                        //                 memberUsersInfo["type"] = "text";
                        //                 memberUsersInfo["status"] = "offline";
                        //                 memberUsersInfo["userId"] = memberUserDatas[i].id.toString();
                        //                 memberUsersInfo["m"] = oldChatListData[i].last_message;
                        //                 memberUsersInfo["t"] = new Date(parseInt(oldChatListData[i].update_at) * 1000);
                        //                 memberUsersInfo["id"] = oldChatListData[i].convo_id;
                        //                 memberUsersInfo["is_old"] = 1;
                        //                 oldchatList.push(memberUsersInfo);
                        //             }
                        //         }
                        //     }
                        // }
                        // chatUserList = chatUserList.concat(oldchatList);
                        chatUserList.sort(function (a, b) {
                            return b.t.getTime() - a.t.getTime();
                            //return new Date(b.t).getTime() - new Date(a.t).getTime();
                        })
                    } catch (error) {
                        console.log(TAG, " callGetChatUserInfoAPI response error : ", error);
                        if (error != undefined && error != null && error.length > 0) {
                            Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
                        }
                    }
                    try {
                        this.setState({ ...this.state.dataRecentChat, dataRecentChat: chatUserList });
                        await AsyncStorage.setItem("MyRecentChatList", JSON.stringify(chatUserList));
                    } catch (error) {
                    }
                }
            } else if (type == "m") {

                 console.log('chat ---------> mmodified', response);


                 var chatUserList = this.state.dataRecentChat;


                let exist_flag = false;
                for (let i = 0; i < chatUserList.length; i++) {
                    //console.log(this.state.dataRecentChat[i], response);
                    if (chatUserList[i].userId == response.members_user_id[0] && ((chatUserList[i].role == "single" && response.group_type == 1) || (chatUserList[i].role == "group" && response.group_type == 2))) {
                        chatUserList[i].m = response.last_message;
                        chatUserList[i].t = response.updated_at.toDate();
                        chatUserList[i].newMsgCnt = response.newMsgCnt;
                        exist_flag = true;
                        break;
                    }
                }
                if (!exist_flag) {
                    let uri = Memory().env == "LIVE" ? Global.URL_GET_CHAT_USERS_INFO : Global.URL_GET_CHAT_USERS_INFO_DEV;
                    let params = { "format": "json", "memberUserIDs": response.members_user_id };
                    let memberUserDatas = await WebService.callChatUserServicePost(uri, params);
                    memberUserDatas = memberUserDatas.data;

                    console.log('---------******* lastlogin data =  ', memberUserDatas);
                    if(memberUserDatas[0].userName.includes('Takshak'))
                    {
                        console.log('---------******* lastlogin data = Takshak =  ', memberUserDatas);
                    }



                    if (response.group_type == 1) {
                        let memberUsersInfo = {};
                        memberUsersInfo["first_name"] = memberUserDatas[0].userName.split(" ")[0];
                        memberUsersInfo["last_name"] = memberUserDatas[0].userName.split(" ")[1];
                        memberUsersInfo["slug"] = memberUserDatas[0].slug;
                        memberUsersInfo["imgpath"] = `${memberUserDatas[0].profile_imgpath}${memberUserDatas[0].profile_filename}`;
                        memberUsersInfo["role"] = "single";
                        memberUsersInfo["type"] = "text";
                        memberUsersInfo["status"] = "offline";
                        memberUsersInfo["userId"] = memberUserDatas[0].id.toString();
                        memberUsersInfo["m"] = response.last_message;
                        memberUsersInfo["t"] = response.updated_at.toDate();
                        memberUsersInfo["id"] = response.id;
                        memberUsersInfo["is_old"] = 0;
                        memberUsersInfo["newMsgCnt"] = response.newMsgCnt;
                        memberUsersInfo["last_loginedin"] = memberUserDatas[0].last_lognedin;
                        this.setState({ dataRecentChat: [...this.state.dataRecentChat, memberUsersInfo] });

                    }

                    await AsyncStorage.setItem('MyRecentChatList', JSON.stringify(datUsrList));
                }else{
                    chatUserList.sort(function (a, b) {
                        try{

                            return new Date(b.t).getTime() - new Date(a.t).getTime();
                        }catch(e){
                            console.log('sort exception   ', a, b, e)
                            return -100000;
                        }
                    });

                    
                    try {
                        this.setState({  dataRecentChat: chatUserList });
                        await AsyncStorage.setItem("MyRecentChatList", JSON.stringify(chatUserList));
                    } catch (error) {
                    }
                }
            }
        }
        this.setState({
            pulldown_loading: false,
            loading: false,
        });
    };
    /**
     * call get recent chat lsit API
     */
    callCometChatRecentMessageAPI = async () => {
        try {
            let uri =
                Memory().env == "LIVE"
                    ? Global.URL_RECENT_CHAT_LIST
                    : Global.URL_RECENT_CHAT_LIST_DEV;
            let params = new FormData();
            params.append("format", "json");
            params.append("basedata", this.state.userId);
            params.append("action", "heartbeat");
            params.append("crinitialize", "1");
            params.append("buddylist", "1");
            params.append("initialize", "1");
            params.append("firstLoad", "1");
            console.log(TAG + " callCometChatRecentMessageAPI uri " + uri);
            console.log(TAG + " callCometChatRecentMessageAPI params " + JSON.stringify(params));
            WebService.callServicePost(uri, params, this.handleCometChatRecentMessageResponse);
        } catch (error) {
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(
                    error
                        .replace(/<\/?[^>]+>/gi, "")
                        .replace(/\\n/g, "")
                        .replace(/\"/g, "")
                );
            }
            this.setState({
                pulldown_loading: false,
                loading: false,
            });
        }
    };
    /**
     * handle get recent chat list API response
     */
    handleCometChatRecentMessageResponse = async (response, isError) => {
        console.log(TAG + " callCometChatRecentMessageAPI Response " + JSON.stringify(response));
        console.log(TAG + " isError " + isError);
        if (!isError) {
            var result = response;
            if (result != undefined && result != null) {
                var roomKeys = [];
                var groupList = [];
                if (result.chatrooms != undefined && result.chatrooms != null) {
                    for (var key in result.chatrooms) {
                        roomKeys.push(key);
                        var item = result.chatrooms[key];
                        item.key = key;
                        this.generateGroupChannel(item.id);
                        groupList.push(item);
                    }
                }

                var groupIds = [];
                if (result.chatroomList != undefined && result.chatroomList != null) {
                    for (var key in result.chatroomList) {
                        if (roomKeys.includes(key)) {
                            groupIds.push(key);
                        }
                    }
                }
                var friendIds = [];
                var buddyList = [];
                if (result.buddylist != undefined && result.buddylist != null) {
                    for (var key in result.buddylist) {
                        var item = result.buddylist[key];
                        item.first_name = "";
                        item.last_name = "";
                        item.key = item.id;
                        if (item.n != undefined && item.n != null) {
                            const words = item.n.split(" ");
                            const count = words.length;
                            if (count > 0) {
                                item.first_name = words[0];
                                if (count > 1) {
                                    item.last_name = words[1];
                                }
                            }
                        }
                        buddyList.push(item);
                        friendIds.push(item.id);
                    }
                }

                if (result.recentchats != undefined && result.recentchats != null) {
                    var groupData = JSON.parse(result.recentchats);
                    var messageList = [];
                    // if (result.chatrooms != undefined && result.chatrooms != null) {
                    //     for (var key in result.chatrooms) {
                    //         if (!groupIds.includes(key)) {
                    //             console.log(TAG, "callCometChatRecentMessageAPI group not exist in messages " + key)
                    //             var item = {};
                    //             item.key = key;
                    //             var record = result.chatrooms[key];
                    //             let timeStamp = Math.floor(Date.now() / 1000);
                    //             item.type = "new_group";
                    //             item.message_id = "0";
                    //             item.m = "";
                    //             item.role = "group";
                    //             item.first_name = record.name;
                    //             item.last_name = record.name;
                    //             item.slug = record.name;
                    //             item.imgpath = record.img;
                    //             item.status = "";
                    //             item.status_message = "";
                    //             item.userId = record.id;
                    //             item.n = record.name;
                    //             item.t = timeStamp;
                    //             item.member = record.online;
                    //             item.createdby = record.createdby;
                    //             messageList.push(item);
                    //         }
                    //     }
                    // }
                    for (var key in groupData) {
                        var item = groupData[key];
                        item.key = key;
                        item.type = "text";
                        item.message_id = item.id;
                        var jsonString = item.m;
                        if (
                            jsonString != undefined &&
                            jsonString != null &&
                            jsonString.indexOf(Constants.SMILY_PREFIX) != -1
                        ) {
                            item.m = this.parceSimleyMessage(item.m);
                            item.type = "smiley";
                        } else if (
                            jsonString != undefined &&
                            jsonString != null &&
                            jsonString.startsWith(Constants.SMILY_PREFIX)
                        ) {
                            item.m = this.parceSimleyMessage(item.m);
                            item.type = "smiley";
                        } else if (
                            jsonString != undefined &&
                            jsonString != null &&
                            jsonString.startsWith(Constants.OTHER_FILE_GROUP_PREFIX)
                        ) {
                            item.m = "File";
                            item.type = "file";
                        } else if (
                            jsonString != undefined &&
                            jsonString != null &&
                            jsonString.startsWith(Constants.OTHER_FILE_PREFIX)
                        ) {
                            item.m = "File";
                            item.type = "file";
                        } else if (
                            jsonString != undefined &&
                            jsonString != null &&
                            jsonString.startsWith(Constants.DELETE_MESSAGE_PREFIX)
                        ) {
                            item.m = "has deleted this message";
                            item.type = "deleted_message";
                        } else if (
                            jsonString != undefined &&
                            jsonString != null &&
                            jsonString.startsWith(Constants.MEDIA_FILE_PREFIX)
                        ) {
                            item.m = "File";
                            item.type = "file";
                        } else if (
                            jsonString != undefined &&
                            jsonString != null &&
                            jsonString.startsWith(Constants.KICKUSER_FILE_PREFIX)
                        ) {
                            jsonString = jsonString.substring(
                                Constants.KICKUSER_FILE_PREFIX.length,
                                jsonString.length
                            );
                            //console.log(TAG, " KICKUSER_FILE_PREFIX jsonString =>" + jsonString)
                            item.m = "User Kicked";
                            item.type = "kickuser";
                        }
                        if (friendIds.includes(key)) {
                            item.role = "single";
                            buddyList.map((i, j) => {
                                if (i.key === key) {
                                    item.first_name = i.first_name;
                                    item.last_name = i.last_name;
                                    item.slug = i.slug;
                                    item.imgpath = i.a;
                                    item.status = i.s;
                                    item.status_message = i.m;
                                    item.userId = i.id;
                                }
                            });
                            messageList.push(item);
                        } else if (groupIds.includes(key)) {
                            item.role = "group";
                            groupList.map((i, j) => {
                                if (i.key === key) {
                                    item.first_name = i.name;
                                    item.last_name = i.name;
                                    item.slug = i.name;
                                    item.imgpath = i.img;
                                    item.status = "";
                                    item.status_message = "";
                                    item.userId = i.id;
                                    item.n = i.name;
                                    item.s = i.s;
                                    item.member = i.online;
                                    item.createdby = i.createdby;
                                }
                            });
                            if (item.type == "deleted_message") {
                                item.m = "has deleted this message from " + item.first_name;
                            }
                            messageList.push(item);
                        }
                    }
                    var sortedData = messageList.sort(this.compare);
                    array_recent_chat = [];
                    if (sortedData != undefined && sortedData != null) {
                        sortedData.map((i, j) => {
                            array_recent_chat.push(i);
                        });
                    }
                    if (array_recent_chat.length > 0) {
                        this.setState({
                            dataRecentChat: array_recent_chat,
                            displayRecentChat: true,
                        });
                        try {
                            await AsyncStorage.setItem("MyRecentChatList", JSON.stringify(array_recent_chat));
                        } catch (error) { }
                    } else {
                        array_recent_chat = [];
                        this.setState({
                            dataRecentChat: array_recent_chat,
                            displayRecentChat: true,
                        });
                    }
                }
            }
        } else {
            if (response != undefined && response != null && response.length > 0) {
                Alert.alert(response.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
        this.setState({
            pulldown_loading: false,
            loading: false,
        });
    };
    /**
     * process to display smiley
     */
    parceSimleyMessage = (HtmlCode) => {
        let message = "";
        var newHtml = HtmlCode.split(/(<img.*?>)/g);
        newHtml.map((item) => {
            let word = item.trim();
            if (word.startsWith("<img ")) {
                let data = word.split('title="')[1].split('">')[0].toLocaleLowerCase();
                let unicode;
                for (let i = 0; i < Emojis.emojis.length; i++) {
                    let emoji = Emojis.emojis[i];
                    if (emoji.name == data) {
                        unicode = emoji.emoji;
                        break;
                    } else if (data == "e mail" && emoji.name == "email") {
                        unicode = emoji.emoji;
                        break;
                    }
                }
                message = message + " " + unicode;
            } else {
                message = message + " " + word;
            }
        });
        console.log(TAG, " parceSimleyMessage message==>" + message.trim());
        return message.trim();
    };
    /**
     * geenrate channel id of group
     */
    generateGroupChannel = async (groupId) => {
        try {
            console.log(TAG, " generateGroupChannel groupId " + groupId);
            var md5 = require("md5");

            var prfixUrl = Global.MD5_BASE_URL;
            console.log(TAG, ">>>>prfixUrl:", prfixUrl);

            let prefixMD5 = md5(prfixUrl);
            console.log(TAG, ">>>>prefixMD5:", prefixMD5);

            var groupUrl = prefixMD5 + "CHATROOM_" + groupId + "/cometchat/";
            console.log(TAG, ">>>>groupUrl:", groupUrl);

            let groupChannelMD5 = md5(groupUrl);
            console.log(TAG, ">>>>groupChannelMD5:", groupChannelMD5);

            var groupChannelId = "";

            if (Platform.OS === "ios") {
                groupChannelId = "C_" + groupChannelMD5 + "i";
            } else {
                groupChannelId = "C_" + groupChannelMD5 + "a";
            }

            console.log(TAG, ">>>>groupChannelId:", groupChannelId);
//            FCM.subscribeToTopic(groupChannelId);
            console.log(TAG, "generateGroupChannel end");
        } catch (error) {
            console.log(TAG, "generateGroupChannel error  groupId" + groupId);
            console.log(TAG, "generateGroupChannel error " + error);
        }
    };

    compare = (oldData, newData) => {
        let comparison = 0;
        if (oldData.t > newData.t) {
            comparison = -1;
        } else if (newData.t > oldData.t) {
            comparison = 1;
        }
        return comparison;
    };
    /**
     * update list
     */
    updateRecentChatList = async (isRefresh) => {
        console.log(TAG, " updateRecentChatList isRefresh " + isRefresh);
        // let chat_count = await AsyncStorage.getItem('CHAT');
        // if (chat_count.toString() != "0") {
        //     await AsyncStorage.setItem('CHAT', "0");
        //     this.props.read_notifications(6);
        // }
        if (isRefresh) {
            this.clearStateData();
            this.getData();
        }
    };
    /**
     * open search view
     */
    openSearchEditor = () => {
        this.setState(
            {
                openSearchBar: true,
                searchText: "",
            },
            () => {
                this.refs.searchTextInput.focus();
            }
        );
    };
    /**
     * close search view
     */
    closeSearchEditor = () => {
        console.log(TAG + " closeSearchEditor called");
        if (this.state.searchText.trim().length != 0) {
            this.setState(
                {
                    ...this.state,
                    dataRecentChat: array_recent_chat,
                    searchText: "",
                    openSearchBar: true,
                },
                () => {
                    console.log(
                        TAG + " closeSearchEditor called " + this.state.searchText
                    );
                    this.SearchFilterFunction("");
                }
            );
            Keyboard.dismiss();
        }
    };
    /**
     * dsiplay searched records
     */
    SearchFilterFunction(text) {
        const temp = [];
        array_recent_chat.map((item) => {
            const firstName = item.first_name.toUpperCase();
            const lastName = item.last_name.toUpperCase();
            const textData = text.toUpperCase();
            if (firstName.indexOf(textData) > -1 || lastName.indexOf(textData) > -1) {
                temp.push(item);
            }
        });

        this.setState({
            dataRecentChat: temp,
            searchText: text,
        });
    }

    onContentOffsetChanged(offset_y) {
        if (offset_y < -80) {
            // if (!this.state.pulldown_loading) {
            //     this.setState(
            //         {
            //             pulldown_loading: true,
            //         },
            //         //() => this.callCometChatRecentMessageAPI()
            //     );
            // }
        }
    }

    render() {
        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: Colors.black }}>
                <View style={styles.container}>
                    <HeaderView
                        ref="header_view"
                        logoClick={() => this.props.jumpToDashboardTab()}
                        screenProps={this.props.rootNavigation}
                        setSearchText={(text) => this.setState({ searchText: text })}
                        onChangeText={(searchText) => this.SearchFilterFunction(searchText)}
                        // handleEditComplete={() => Keyboard.dismiss()}
                        showNotificationPopupView={() => {
                            this.refs.refNotificationPopupView.getData();
                            this.setState({ showNotificationModel: true });
                        }}
                        showPopupView={() => this.setState({ showModel: true })}
                    />
                    <BannerView
                        screenProps={this.props.rootNavigation}
                        jumpToEventTab={this.props.jumpToEventTab}
                        jumpToTravelTab={this.props.jumpToTravelTab}
                    />
                    <CustomPopupView
                        showModel={this.state.showModel}
                        openMyAccountScreen={this.props.jumpToDashboardTab}
                        logoutUser={this.logoutUser}
                        closeDialog={() => {
                            this.setState({ showModel: false });
                        }}
                        prop_navigation={this.props.rootNavigation}
                    ></CustomPopupView>
                    <NotificationPopupView
                        ref="refNotificationPopupView"
                        showModel={this.state.showNotificationModel}
                        openNotificationScreen={this.props.jumpToDashboardTab}
                        closeDialog={() => {
                            this.setState({ showNotificationModel: false });
                        }}
                        prop_navigation={this.props.rootNavigation}
                    ></NotificationPopupView>
                    {this.renderMainView()}
                    {this.state.loading == true ? <ProgressIndicator /> : null}
                </View>
            </SafeAreaView>
        );
    }

    refreshProfileImage = async () => {
        try {
            var userImagePath = await AsyncStorage.getItem(
                Constants.KEY_USER_IMAGE_URL
            );
            var userImageName = await AsyncStorage.getItem(
                Constants.KEY_USER_IMAGE_NAME
            );
            this.setState({
                userImagePath: userImagePath,
                userImageName: userImageName,
            });
        } catch (error) {
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(
                    error
                        .replace(/<\/?[^>]+>/gi, "")
                        .replace(/\\n/g, "")
                        .replace(/\"/g, "")
                );
            }
        }
    };

    logoutUser = async () => {
        this.setState({
            showModel: false,
        });
        try {
            await AsyncStorage.setItem(Constants.KEY_USER_ID, "");
            await AsyncStorage.setItem(Constants.KEY_USER_TOKEN, "");
            await AsyncStorage.setItem("MyRecentChatList", "");

            this.props.rootNavigation.navigate("SignInScreen", {
                isGettingData: false,
            });
        } catch (error) {
            console.log(TAG + " logoutUser error " + error);
        }
    };

    getDataAgain = (refresh) => {

        console.log('MyRecentMessagesScreen getdataagain')
        if (refresh) {
            this.getData();
        }
    };

    renderMainView = () => {
        return (
            <View
                style={{
                    flex: 1,
                    width: "100%",
                    height: "100%",
                    paddingBottom: bottomPadding,
                }}
            >
                {this.state.pulldown_loading && <PullDownIndicator />}
                {this.renderRecentMessageList()}
            </View>
        );
    };
    /**
     * display recent chat list
     */
    renderRecentMessageList = () => {
        let emptyView = (
            <View style={styles.emptyView}>
                <Text style={[{ color: Colors.black, fontSize: 14 }, stylesGlobal.font]} >
                    {"No Recent Chat"}
                </Text>
            </View>
        );




        let listView = (
            <FlatList
                ref="mainscrollView"
                extraData={this.state}
                pagingEnabled={false}
                showsHorizontalScrollIndicator={false}
                showsVerticalScrollIndicator={false}
                data={this.state.dataRecentChat}
                keyExtractor={(item, index) => index.toString()}
                onScroll={(event) =>
                    this.onContentOffsetChanged(event.nativeEvent.contentOffset.y)
                }
                renderItem={({ item, index }) => {//console.log('recentmessage = ', item);
                    return (
                        <RowRecentMessage
                            data={item}
                            screenProps={this.props.rootNavigation}
                            index={index}
                            refreshList={this.updateRecentChatList}
                            userId={this.state.userId}
                            refreshProfileImage={this.refreshProfileImage}
                            onPressItem={this.onPressItem}
                        />
                    );
                }}
            />
        );

        return (
            <View style={{ flex: 1 }}>
                {!this.state.loading && !this.state.dataRecentChat.length
                    ? emptyView
                    : listView}
                {/* {this.state.memberPlan == 1 ||
                this.state.memberPlan == 3 ||
                this.state.memberPlan == 6 ||
                this.state.memberPlan == 7 ||
                this.state.memberPlan == 8 ? (
                <PopupView navigation={this.props.rootNavigation} />
                ) : null} */}
                <ActionButton
                    buttonColor={Colors.gold}
                    title="New Task"
                    style={{ position: "absolute", bottom: 10, right: 10 }}
                    onPress={() => {
                        this.openNewMessageScreen();
                    }}
                />
            </View>
        );
    };

    onPressItem = (item) => {
        this.setState({ selected_person: item }, () => { this.callGetMessageListAPI(); });
    };

    callGetMessageListAPI = async () => {

        //if (this.unsubscribe != undefined && this.unsubscribe != null) {
        //    this.unsubscribe();
        //}


        var user = {
            first_name: this.state.selected_person.first_name,
            last_name: this.state.selected_person.last_name,
            slug: this.state.selected_person.slug,
            imgpath: this.state.selected_person.imgpath,
            filename: this.state.selected_person.filename,
            id: this.state.selected_person.userId,
            imageUri: this.state.selected_person.imgpath,
            grpId: this.state.selected_person.id,
            is_old: this.state.selected_person.is_old,
            last_loginedin: this.state.selected_person.last_loginedin,
        };
        // console.log(">>>> user ::: ", user)
        this.props.rootNavigation.navigate("UserChat", {
            user: user,
            refreshList: this.updateRecentChatList,
            messageId: this.state.selected_person.message_id,
        });
    };

    callIsAllowUserChatAPI = async (message) => {
        try {
            this.setState({
                loading: true,
            });

            let uri =
                Memory().env == "LIVE"
                    ? Global.URL_GET_CHATLIST
                    : Global.URL_GET_CHATLIST_DEV;

            let params = new FormData();
            params.append("token", this.state.userToken);
            params.append("user_id", this.state.userId);
            params.append("format", "json");
            params.append("friendId", this.state.selected_person.id);
            console.log(TAG + " callIsAllowUserChatAPI uri " + uri);
            console.log(
                TAG + " callIsAllowUserChatAPI params " + JSON.stringify(params)
            );

            WebService.callServicePost(
                uri,
                params,
                this.handleIsAllowUserChatResponse
            );
        } catch (error) {
            console.log(TAG + " callIsAllowUserChatAPI error " + error);
            this.setState({
                loading: false,
            });
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(
                    error
                        .replace(/<\/?[^>]+>/gi, "")
                        .replace(/\\n/g, "")
                        .replace(/\"/g, "")
                );
            }
        }
    };
    /**
     *  handle is allow chat API response
     */
    handleIsAllowUserChatResponse = (response, isError) => {
        console.log(
            TAG + " callIsAllowUserChatAPI Response " + JSON.stringify(response)
        );
        console.log(TAG + " callIsAllowUserChatAPI isError " + isError);
        this.setState({
            loading: false,
        });

        if (!isError) {
            var result = response;
            if (typeof result != "undefined" && result != null) {
                if (
                    result.data.isUserInChatlist == 1 ||
                    result.data.isPaidChat == 0 ||
                    result.data.isUserInChatlist == 0
                ) {
                    if (this.state.selected_person.role === "group") {
                        var group = {
                            groupId: this.state.selected_person.userId,
                            groupName: this.state.selected_person.n,
                            groupImage: this.state.selected_person.imgpath,
                            groupMember: this.state.selected_person.member,
                            groupCreatedBy: this.state.selected_person.createdby,
                        };
                        this.props.rootNavigation.navigate("GroupChat", {
                            group: group,
                            refreshList: this.updateRecentChatList,
                            messageId: this.state.selected_person.message_id,
                        });
                    } else {
                        var user = {
                            first_name: this.state.selected_person.first_name,
                            last_name: this.state.selected_person.last_name,
                            slug: this.state.selected_person.slug,
                            imgpath: this.state.selected_person.imgpath,
                            filename: this.state.selected_person.filename,
                            id: this.state.selected_person.userId,
                            imageUri: this.state.selected_person.imgpath,
                            last_loginedin: this.state.selected_person.last_loginedin,
                        };
                        this.props.rootNavigation.navigate("UserChat", {
                            user: user,
                            refreshList: this.updateRecentChatList,
                            messageId: this.state.selected_person.message_id,
                        });
                    }
                } else {
                    Alert.alert(
                        "Error",
                        "Sorry, you have reached your contact limit for your profile type. " +
                        "Contacting this person outside of the limit costs " +
                        result.this.state.selected_person.chatCost +
                        " gold coins. " +
                        "Would you like to apply your gold coins towards this transaction?",
                        [{ text: "OK", onPress: () => this.handleBack() }],
                        { cancelable: false }
                    );
                }
            }
        } else {
            this.setState({
                loading: false,
            });
            if (response != undefined && response != null && response.length > 0) {
                Alert.alert(
                    response
                        .replace(/<\/?[^>]+>/gi, "")
                        .replace(/\\n/g, "")
                        .replace(/\"/g, "")
                );
            }
        }
    };
    /**
     * open cat screen
     */
    openNewMessageScreen = () => {

        //console.log(this.state.dataRecentChat);
        //return;
        const { navigate } = this.props.rootNavigation;
        navigate("NewMessage", {
            refreshList: this.updateRecentChatList,
            chatUserList: this.state.dataRecentChat
        });
    };
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: "100%",
        height: "100%",
        backgroundColor: Colors.white,
    },
    emptyView: {
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center'
    }
    
});
