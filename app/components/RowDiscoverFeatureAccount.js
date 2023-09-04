import React, { Component } from "react";
import {
    View,
    Text,
    Image,
    TouchableOpacity,
    Dimensions,
    StyleSheet,
    Platform
} from "react-native";
import { EventRegister } from 'react-native-event-listeners'
import auth from "@react-native-firebase/auth";
import AsyncStorage from '@react-native-community/async-storage';
import { fcService } from "../utils/FirebaseChatService";
import { Colors } from "../consts/Colors";
import { Constants } from "../consts/Constants";
import { ImageCompressor } from './ImageCompressorClass'
import { stylesGlobal } from '../consts/StyleSheet'
import ModalDropdown from "../custom_components/react-native-modal-dropdown/ModalDropdown";
import * as Global from "../consts/Global";
import Memory from "../core/Memory";
import WebService from "../core/WebService";

var { width, height } = Dimensions.get("window");
width = width > height ? height : width;
const imageWidth = width / 3;
var TAG = "RowDiscoverFeatureAccount";
var current_profile = null;
export default class RowDiscoverFeatureAccount extends Component {

    constructor(props) {
        super(props);
        this.state = {
            category_array: Global.category_array_birthday,
            open_birthday_dropdown_flag: false,
            chatAuthToken: "",
            selected_category: -1,
        };
        this.unsubscribe = null;
    }

    async UNSAFE_componentWillMount() {
        this.listener = EventRegister.addEventListener(Constants.EVENT_PROFILE_IMAGE_UPDATED, () => {
            console.log(TAG, "EVENT_PROFILE_IMAGE_UPDATED event called");
        });
    }

    componentWillUnmount() {
        EventRegister.removeEventListener(this.listener);
        if (this.unsubscribe != null) {
            this.unsubscribe();
        }
    }
    // Go to chat page to send message
    callGetChatToken = async () => {
        try {
            console.log(TAG + " callGetChatToken Global.CHAT_AUTH_TOKEN : ");
            this.props.updateLoading(true);
            let uri = Memory().env == "LIVE" ? Global.URL_GET_CHAT_TOKEN : Global.URL_GET_CHAT_TOKEN_DEV;
            let params = new FormData();
            params.append("format", "json");
            params.append("token", this.props.userToken);
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
            this.props.updateLoading(false);
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
        } else {
            if (response != undefined && response != null && response.length > 0) {
                Alert.alert(response.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
        this.props.updateLoading(false);
    };

    firebaseAuthWithToken = async () => {
        // console.log("firebase auth token", this.state.chatAuthToken);
        // console.log(TAG + " firebaseAuthWithToken : 1", this.props.data.user_id);
        auth()
            .signInWithCustomToken(this.state.chatAuthToken)
            .then((userCredential) => {
                this.unsubscribe = fcService.getRecentChat(this.props.data.user_id, this.handleFirebaseRecentChatResponse);
            })
            .catch((error) => {
                this.props.updateLoading(false);
                console.log("firebase auth error", error);
            });
    };

    handleFirebaseRecentChatResponse = async (response, isError, type) => {
        console.log(TAG + " handleFirebaseRecentChatResponse isError : 1", isError);
        //this.props.updateLoading(false);
        // let data = this.props.data;
        // let grpId = "";
        // let is_old = 1;


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
                if (each_res.userId === this.props.userId.toString()) {
                    grpId = each_res.id;
                    is_old = each_res.is_old;
                    break;
                }
            }
        }

        
        var user = {
            first_name: data2.first_name,
            last_name: data2.last_name,
            slug: data2.slug,
            imgpath: data2.imgpath + data2.filename,
            filename: data2.filename,
            id: data2.user_id,
            imageUri: data2.imgpath + Constants.THUMB_FOLDER + data2.filename,
            grpId: (!grpId || grpId === "") ? undefined : grpId,
            is_old: is_old,
        };

        console.log(TAG, 'group id = ', grpId);

         this.props.screenProps.navigate("UserChat", {
             user: user,
             refreshList: this.updateRecentChatList,
             messageId: grpId
         });

        if(this.unsubscribe)
                this.unsubscribe();

        //this.props.updateLoading(false);
// 
//         if (isError) {
//         } else {
//             for (var i = 0; i < response.length - 1; i++) {
//                 let each_res = response[i];
//                 if (each_res.members_user_id[0] == this.props.userId) {
//                     // console.log(TAG + " handleFirebaseRecentChatResponse each_res : ", each_res);
//                     grpId = each_res.id;
//                     is_old = each_res.is_old;
//                     break;
//                 }
//             }
//         }
//         var user = {
//             first_name: data.first_name,
//             last_name: data.last_name,
//             slug: data.slug,
//             imgpath: data.imgpath + data.filename,
//             filename: data.filename,
//             id: data.user_id,
//             imageUri: data.imgpath + Constants.THUMB_FOLDER + data.filename,
//             grpId: grpId,
//             is_old: is_old,
//         };
//         console.log(TAG + " handleFirebaseRecentChatResponse isError : 1 = : ", user, grpId);
//         this.props.screenProps.navigate("UserChat", {
//             user: user,
//             refreshList: this.updateRecentChatList,
//             messageId: grpId
//         });
    };

    updateRecentChatList = () => { }

    // Get profile
    callProfileDetailAPI = async () => {
        try {
            this.props.updateLoading(true);

            console.log(this.state.userSlug, this.props.data.slug);
            let uri = Memory().env == "LIVE" ? Global.URL_MY_PROFILE_DETAIL + this.props.data.slug : Global.URL_MY_PROFILE_DETAIL_DEV + this.props.data.slug
            let params = {
                "token": this.props.userToken,
                "user_id": this.props.userId,
                "format": "json",
            }
            console.log(TAG + " callProfileDetailAPI uri " + uri);
            console.log(TAG + " callProfileDetailAPI params " + JSON.stringify(params));
            WebService.callServicePost(uri, params, this.handleGetProfileDetailResponse);
        } catch (error) {
            this.props.updateLoading(false);
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    };

    handleGetProfileDetailResponse = (response, isError) => {
        // console.log(TAG + " callProfileDetailAPI result " + JSON.stringify(response));
        console.log(TAG + " callProfileDetailAPI isError " + isError);
        if (!isError) {
            try {
                var result = response;
                if (typeof result != "undefined" && result != undefined && result != null) {
                    if (typeof result.data != "undefined" && result.data != undefined && result.data != null) {
                        current_profile = result.data;
                        if (this.state.selected_category == 2) {
                            console.log('sssssss')
                            this.props.screenProps.navigate("GiftList", { receiver: current_profile.userProfileInfo, selected_screen: "gift" })
                        } else if (this.state.selected_category == 3) {
                            this.props.screenProps.navigate("GiftList", { receiver: current_profile.userProfileInfo, send_gold_coin: true })
                        }
                    } else {
                        if (result.msg) {
                            Alert.alert(result.msg.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""))
                        } else {
                            Alert.alert(Constants.UNKNOWN_MSG, "")
                        }
                    }
                }
            } catch (error) {
                if (error != undefined && error != null && error.length > 0) {
                    Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
                }
            }
        } else {
            if (response != undefined && response != null && response.length > 0) {
                Alert.alert(response.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
        this.props.updateLoading(false);
    };

    makeSpecialBirthday = async (index) => {
        this.setState({ selected_category: index }, async () => {
           if (index == 0) {
                await this.callGetChatToken();
            } else if (index == 1) {
                this.props.update_show_send_rose_birthday_user(this.props.data);
            } else if (index == 2) {
                await this.callProfileDetailAPI();
            } else if (index == 3) {
                await this.callProfileDetailAPI();
            } 
        });
        
    }
    /** 
    * display discover feature account info
    */
    render() {
        var data = this.props.data;
        var fullName = data.first_name + " " + data.last_name;
        var url = data.imgpath + Constants.THUMB_FOLDER + data.filename;
        let birthday_flag = data.is_fan == undefined ? true : false;
        // console.log(" this.state.category_array ", this.state.category_array);
        return (
            <View>
                <TouchableOpacity
                    activeOpacity={1}
                    onPress={() => {
                        if (data.user_id === this.props.userId) {
                            this.props.screenProps.navigate("MyProfile", {
                                refreshProfileImage: this.props.refreshProfileImage
                            });
                        } else {
                            this.props.screenProps.navigate("ProfileDetail", { slug: data.slug });
                        }
                    }}
                >
                    <View style={styles.container}>
                        <View style={styles.imageContainer}>
                            <ImageCompressor
                                uri={url}
                                style={styles.image}
                            />
                            {/* <View style={styles.roundCornerView} /> */}
                        </View>
                        <Text style={[styles.name, stylesGlobal.font]}>{fullName}</Text>
                    </View>
                </TouchableOpacity>
                {
                    birthday_flag == true &&
                    <View style={{ justifyContent: 'center', flexDirection: 'row', marginBottom: 10 }}>
                        <View style={{ width: 125, justifyContent: 'flex-end', alignItems: 'center' }}>
                            <ModalDropdown
                                dropdownStyle={{ height: 35 * 4 + 5 * 6, paddingLeft: 5, paddingTop: 5, paddingRight: 5, backgroundColor: '#ffffff', borderRadius: 3, borderColor: '#000000', borderWidth: 1, borderTopColor: "#ffffff", marginTop: this.state.open_birthday_dropdown_flag == true ? -5 : 0 }}
                                defaultIndex={0}
                                onDropdownWillShow={() => {
                                    this.setState({ open_birthday_dropdown_flag: true });
                                }}
                                onDropdownWillHide={() => {
                                    this.setState({ open_birthday_dropdown_flag: false });
                                }}
                                options={this.state.category_array}
                                onSelect={(index) => {
                                    console.log(" ModalDropDown Index :", index);
                                    this.makeSpecialBirthday(index);
                                }}
                                renderButton={() => {
                                    return (
                                        <View style={[this.state.open_birthday_dropdown_flag == true ? styles.blackBorder : stylesGlobal.shadow_style, { backgroundColor: this.state.open_birthday_dropdown_flag == true ? Colors.white : Colors.gold, borderRadius: 5, padding: 5, height: 35, width: 127, justifyContent: 'center', alignItems: 'center' }]}>
                                            <Text style={[{ color: this.state.open_birthday_dropdown_flag == true ? Colors.black : Colors.white, fontSize: 15 }, stylesGlobal.font]}>{"Make it Special"}</Text>
                                        </View>
                                    )
                                }}
                                renderRow={(item, index) => {
                                    return (
                                        <View style={[styles.visibility_button, { backgroundColor: Colors.black }]}>
                                            <Image style={{ width: 20, height: 20, marginLeft: 8 }} resizeMode={'contain'} source={item.icon_path} />
                                            <Text style={[styles.visibility_text, stylesGlobal.font, { marginLeft: 5 }]}>{item.label}</Text>
                                        </View>
                                    )
                                }}
                            />
                        </View>
                    </View>
                }
            </View>
        );
    }
}
const styles = StyleSheet.create({
    container: {
        // backgroundColor: Colors.white,
        padding: 15,
        alignItems: 'center',
        marginTop: 10
    },
    imageContainer: {
        flex: 1,
        width: imageWidth,
        height: imageWidth,
        // backgroundColor: Colors.white,
        alignSelf: "center",
        borderRadius: imageWidth / 2,
        overflow: 'hidden',
    },
    image: {
        width: imageWidth,
        height: imageWidth,
        overflow: 'hidden',
        backgroundColor: Colors.gray,
        borderRadius: 10,
    },
    roundCornerView: {
        position: 'absolute',
        top: -(10),
        bottom: -(10),
        right: -(10),
        left: -(10),
        borderRadius: 15,
        borderWidth: (10),
        borderColor: Colors.white
    },
    name: {
        color: Colors.gold,
        fontSize: 13,
        backgroundColor: Colors.transparent,
        marginTop: 5
    },
    visibility_button: {
        width: 115,
        height: 35,
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 5,
        borderColor: '#000000',
        borderWidth: 1,
        marginBottom: 5
    },
    visibility_text: {
        fontSize: 14,
        color: Colors.white
    },
    blackBorder: {
        borderColor: "#000000",
        borderBottomColor: "#FFFFFF",
        borderWidth: 1,
    }
});
