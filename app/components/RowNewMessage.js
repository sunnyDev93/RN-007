import React, { Component } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    Dimensions,
    StyleSheet,
    Platform,
    Image,
    Alert,
} from "react-native";
import { EventRegister } from 'react-native-event-listeners'
import { Colors } from "../consts/Colors";
import Memory from "../core/Memory";
import * as Global from "../consts/Global";
import { Constants } from "../consts/Constants";
import { stylesGlobal } from '../consts/StyleSheet'
import AsyncStorage from '@react-native-community/async-storage';
import WebService from "../core/WebService";
import auth from "@react-native-firebase/auth";
import { fcService } from "../utils/FirebaseChatService";
const { width } = Dimensions.get("window");
var imageSize = 60;
var cardPadding = 10;
var TAG = "RowNewMessage";
export default class RowNewMessage extends Component {

    constructor(props) {
        super(props);
        this.state = {
            showComment: false,
            showPicker: false,
            commentValue: "",
            is_verified: "",
        };
    }

    async UNSAFE_componentWillMount() {
        this.listener = EventRegister.addEventListener(Constants.EVENT_PROFILE_IMAGE_UPDATED, () => {
            console.log(TAG,"EVENT_PROFILE_IMAGE_UPDATED event called");
        })

        var is_verified = await AsyncStorage.getItem(Constants.KEY_IS_VERIFIED);
         var userToken = await AsyncStorage.getItem(Constants.KEY_USER_TOKEN);
            var userId = await AsyncStorage.getItem(Constants.KEY_USER_ID);
        this.setState({
            is_verified: is_verified,
            userToken: userToken,
            userId: userId
        });
    }
    
    componentWillUnmount() {
        EventRegister.removeEventListener(this.listener)
    }


    async handleCreateNewChat(data) {
        if(this.props.member_plan == "7" && data.member_plan != "7" && data.member_plan != "4") {
            Alert.alert(Constants.NEW_MESSAGE_LIMIT, "");
            return;
        } 
        if(this.state.is_verified != "1" && data.member_plan != "7" && data.member_plan != "4") {
            Alert.alert(Constants.NOT_APPROVED_MESSAGE, "");
            return;
        }

        var isOld = false;
        var grpId = undefined;
        if(this.props.chatUserList && this.props.chatUserList.length > 0)
        {
            this.props.chatUserList.forEach((item) => {
                if(item.userId === data.user_id.toString())
                    {
                        isOld = true;
                        grpId = item.id;
                    }
            })
        }
        console.log(isOld)
        //return;
// 
// console.log(this.props.chatUserList);
//         console.log(TAG, 'new message', data);

        //return;
        var user = {
            first_name: data.first_name,
            last_name: data.last_name,
            slug: data.slug,
            imgpath: data.imgpath + Constants.THUMB_FOLDER + data.filename,
            // filename: data.filename,
            id: data.user_id,
            imageUri: data.imgpath + Constants.THUMB_FOLDER + data.filename,
            grpId: grpId != "" ? grpId : undefined,
            is_old: isOld,

            // imageUri: data.imgpath
        };
        this.props.screenProps.navigate("UserChat", {
            user: user,
            refreshList: this.props.refreshList,
        
            messageId: grpId
        });
    }

    /**
    * go to chat screen
    */
    callGetChatToken = async () => {
        console.log('---------------------------')
        try {
            let uri = Memory().env == "LIVE" ? Global.URL_GET_CHAT_TOKEN : Global.URL_GET_CHAT_TOKEN_DEV;
            if (this.state.userToken == undefined) {
                this.setState({ userToken: await AsyncStorage.getItem(Constants.KEY_USER_TOKEN) });
            }
            let params = new FormData();
            params.append("token", this.state.userToken);
            params.append("format", "json");
            WebService.callServicePost(uri, params, this.handleCallGetChatTokenResponse);
        } catch (error) {
            console.log(error);
            if (error.message != undefined && error.message != null && error.message.length > 0) {
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
            }
        }else{
            if (response != undefined && response != null && response.length > 0) {
                Alert.alert(response.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    };

    firebaseAuthWithToken = async () => {
        // console.log("firebase auth token", this.state.chatAuthToken);
        auth()
            .signInWithCustomToken(this.state.chatAuthToken)
            .then((userCredential) => {
                this.unsubscribe = fcService.getRecentChat(this.state.userId, this.handleFirebaseRecentChatResponse);
            })
            .catch((error) => {
                console.log("firebase auth error", error);
            });
    };

    handleFirebaseRecentChatResponse = async (response, isError, type) => {

        if(isError)
        {
            Alert.alert("Failed to get user chat list");
            if(this.unsubscribe)
                this.unsubscribe();
            return;
        }
        let data2 = this.props.data;
        let grpId = "";
        let is_old = 1;
       

        if(type != "a")
        {
            if(this.unsubscribe)
                this.unsubscribe();
            return;
        }

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
                for (let j = 0; j < memberUsersLastMsg.length; j++) {
                    // console.log(" --- memberUsersLastMsg[j].updated_at : ", memberUsersLastMsg[j].id);
                    if (memberUsersLastMsg[j].group_type == 1) {
                        for (let i = 0; i < memberUserDatas.length; i++) {
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
                            chatUserList.push(groupChatInfor);
                        }
                    } else {
                        // console.log(" ------- special  chat ", memberUsersLastMsg[j]);
                    }
                }
                
                chatUserList.sort(function (a, b) {
                    return b.t.getTime() - a.t.getTime();
                    //return new Date(b.t).getTime() - new Date(a.t).getTime();
                });

        //         console.log(chatUserList);
        // return;
            } catch (error) {
                
                if (error != undefined && error != null && error.length > 0) {
                    Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
                }
            }
            
            //console.log('user list from server', chatUserList);
          
            for (var i = 0; i < chatUserList.length; i++) {
                let each_res = chatUserList[i];
                if (each_res.userId === data2.id.toString()) {
                    grpId = each_res.id;
                    is_old = each_res.is_old;
                    break;
                }
            }
        }

        let hostImagefilename = await AsyncStorage.getItem(Constants.KEY_USER_IMAGE_NAME);
        
        var user = {
            first_name: data2.first_name,
            last_name: data2.last_name,
            slug: data2.slug,
            imgpath: data2.imgpath + data2.filename,
            filename: data2.filename,
            id: data2.id,
            imageUri: data2.imgpath + Constants.THUMB_FOLDER + data2.filename,
            grpId: grpId != "" ? grpId : undefined,
            is_old: is_old,
        };

        this.props.screenProps.navigate("UserChat", {
            user: user,
            refreshList: this.updateRecentChatList,
            messageId: grpId
        });

        if(this.unsubscribe)
                this.unsubscribe();

//         let data = this.props.data;
//         let grpId = "";
//         let is_old = 1;
//         if (isError) {
//         } else {
//             for (var i = 0; i < response.length - 1; i++) {
//                 let each_res = response[i];
//                 if (each_res.members_user_id[0] == data.id) {
//                     grpId = each_res.id;
//                     is_old = each_res.is_old;
//                     break;
//                 }
//             }
//         }
// 
//         if(grpId == "")
//             grpId = await fcService.createChat(data.id, this.state.userId);
// 
//         
//         var user = {
//             first_name: data.first_name,
//             last_name: data.last_name,
//             slug: data.slug,
//             imgpath: data.imgpath + data.filename,
//             filename: data.filename,
//             id: data.id,
//             imageUri: data.imgpath + Constants.THUMB_FOLDER + data.filename,
//             grpId: grpId,
//             is_old: is_old,
//         };
// 
//         //console.log(TAG, '>>>>>>>>>>>>>> ', user, data.id);
//         this.props.screenProps.navigate("UserChat", {
//             user: user,
//             refreshList: this.updateRecentChatList,
//             messageId: grpId
//         });
    };
    
    render() {
        var data = this.props.data;
        return (
            <TouchableOpacity
                onPress={async () => {
                    this.handleCreateNewChat(data);

                    //await this.callGetChatToken();
                    
                }}
            >
                {this.renderNewMessage(data)}
            </TouchableOpacity>
        );
    }
    /** 
       * display user data
       */
    renderNewMessage = (data) => {
        var url = data.imgpath + Constants.THUMB_FOLDER + data.filename;
        var fullname = data.first_name + " " + data.last_name;
        var slug = data.slug;
        return (
            <View>
                <View style={styles.container}>
                    <TouchableOpacity
                        onPress={() => {
                            if (data.user_id === this.props.userId) {
                                this.props.screenProps.navigate("MyProfile",{
                                    refreshProfileImage:this.props.refreshProfileImage
                                });
                            } else {
                                this.props.screenProps.navigate("ProfileDetail", {
                                    slug: slug
                                });
                            }
                        }}
                    >
                        <View style={styles.userImageContainer}>
                            <Image
                                style={styles.userImage}
                                source={{ uri: url }}
                                defaultSource={require("../icons/Background-Placeholder_Camera.png")}
                            />
                        </View>
                    </TouchableOpacity>

                    <Text style={[styles.name, stylesGlobal.font]}>{fullname}</Text>
                </View>
                <View style={styles.separator} />
            </View>
        );
    };
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: Colors.white,
        padding: cardPadding,
        flexDirection: "row"
    },
    userImageContainer: {
        backgroundColor: Colors.gray,
        width: imageSize,
        height: imageSize,
        borderRadius: imageSize / 2
    },
    userImage: {
        resizeMode: "cover",
        backgroundColor: Colors.white,
        borderRadius: imageSize / 2,
        width: imageSize,
        height: imageSize
    },
    name: {
        fontSize: 15,
        color: Colors.black,
        backgroundColor: Colors.transparent,
        marginLeft: 10,
        alignSelf: "center"
    },
    separator: {
        height: 1,
        width: "100%",
        backgroundColor: Colors.black
    }
});
