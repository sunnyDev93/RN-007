import React, { Component } from "react";
import {
    Alert,
    View,
    Text,
    TouchableOpacity,
    Dimensions,
    Image
} from "react-native";
import { EventRegister } from 'react-native-event-listeners'
import { ImageCompressor } from './ImageCompressorClass'
import { Constants } from "../consts/Constants";
import { Colors } from "../consts/Colors";
import {stylesGlobal} from '../consts/StyleSheet'
import * as Global from "../consts/Global";
import CheckboxCus from '../customview/CheckBoxInviteFriend';
import {getUserAge, getRibbonImage} from "../utils/Util";
import Memory from "../core/Memory";
import WebService from "../core/WebService";
import auth from "@react-native-firebase/auth";
import { fcService } from "../utils/FirebaseChatService";
const { width } = Dimensions.get("window");
const cardMargin = 12;
var TAG = "RowInviteFriend";

export default class RowInviteFriend extends Component {
    constructor(props) {
        super(props);
        this.state = {
            showComment: false,
            showPicker: false,
            commentValue: "",
            userToken: '',
            userId: '',
        };
    }

     async UNSAFE_componentWillMount() {
        try {
            
            
            var userToken = await AsyncStorage.getItem(Constants.KEY_USER_TOKEN);
            var userId = await AsyncStorage.getItem(Constants.KEY_USER_ID);
        
            this.setState({
              
                userToken: userToken,
                userId: userId

            });
        } catch (error) {
            // Error retrieving data
        }
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
        console.log("firebase auth token", this.props.myUserId);
        auth()
            .signInWithCustomToken(this.state.chatAuthToken)
            .then((userCredential) => {
                this.unsubscribe = fcService.getRecentChat(this.props.myUserId, this.handleFirebaseRecentChatResponse);
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
            grpId: (!grpId || grpId === "") ? undefined : grpId,
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
        
        var checked = this.props.data.check;
        var data = this.props.data

       
        var title = data.first_name + " " + data.last_name;
        var url = data.imgpath + Constants.THUMB_FOLDER + data.filename;
        
        var slug = data.slug;

        let messageButton = (
            <TouchableOpacity style={[styles.submit, stylesGlobal.shadow_style]}
                onPress={ async () => {
                   await this.callGetChatToken();
                }}
            >
                <Text style={[styles.submitText, stylesGlobal.font]}>{data.is_login == "1" ? "Chat" : "Message"}</Text>
            </TouchableOpacity>
        );

        return (
            <View style = {[stylesGlobal.cardView_container]}>
            {
                getRibbonImage(data)
            }
                <View style={stylesGlobal.cardView}>
                    <TouchableOpacity activeOpacity={1}
                        onPress={() => {
                            if (data.user_id === this.props.myUserId) {
                                this.props.screenProps.navigate("MyProfile", {
                                    refreshProfileImage: this.props.refreshProfileImage
                                });
                            } else {
                                this.props.screenProps.navigate("ProfileDetail", {
                                    slug: slug
                                });
                            }
                        }}
                    >
                        <View style={stylesGlobal.card_profile_fitImageView}>
                            <ImageCompressor uri={url} style={stylesGlobal.card_profile_fitImage}/>
                        </View>
                        
                        <Text style={[{color: Colors.gold, fontSize: 15, backgroundColor: Colors.transparent, marginTop: 5, marginBottom: 5}, stylesGlobal.font_bold]}>{title}</Text>
                    {
                        this.displayProfileInfo(data)
                    }
                    </TouchableOpacity>
                {
                    <View style={{width: '100%', marginTop:20, }}>
                    {   data.invited
                        ?
                            <View style = {{ width: '100%', flexDirection: 'row', justifyContent: 'center', alignItems: 'center'}}>
                                <View style={{backgroundColor:Colors.gold, paddingHorizontal:25, paddingVertical:8, borderRadius:4,}}>
                                    <Text style={[stylesGlobal.font, {color:Colors.black, borderRadius:3}]}>{"Already Invited"}</Text>
                                </View>
                                {messageButton}
                            </View>
                        :
                            <View style = {{ width: '100%', justifyContent: 'center', alignItems: 'center'}}>
                                <View style={{width:'100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center'}}>
																		{this.props.myUserId == this.props.hostId && 
																			<CheckboxCus style = {{marginLeft: 0}}
																					text={checked ? 'Deselect As Invitee' : 'Select As Invitee'}
																					checked={checked}
																					onPress={() => {
																							this.props.onItemPress(data);
																					}}
																			/>
																		}
                                    <TouchableOpacity style={[stylesGlobal.common_button, { marginLeft: this.props.myUserId == this.props.hostId ? 20 : 0}, stylesGlobal.shadow_style]}
                                        onPress={() => {
                                            this.props.invite_user(data);
                                        }}
                                    >
                                        <Text style={[styles.submitText, stylesGlobal.font]}>{"Invite"}</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        }
                    </View>
                }
                </View>
            </View>
        );
    }
    
    checkPressed = () => {
        this.setState({checked: !this.state.checked});
    }
    
    displayProfileInfo(data) {
        if (data.member_plan == "1" || data.member_plan == "2") {
            return this.renderTypeOneAndTwo(data);
        } else if (data.member_plan == "3") {
            return this.renderMemberPlanThreeDetail(data);
        } else {
            return this.renderTypeOthers(data);
        }
    }

    renderTypeOneAndTwo(data) {
        var location = data.address;
        var netWorth = data.net_worth;
        var networth_verified_on = data.networth_verified_on;
        var goldCoins = data.gold_coins;
        if(netWorth == null || netWorth == "Not Set" || netWorth == "" || netWorth == 0) {
            netWorth = "< $2M"
        }

        return (
            <View>
                {location != null && location != "Not Set" && location != "" && location != 0 ? (
                    <View style={{ marginTop: 5, marginBottom: 5 }}>
                        <Text style={[styles.labelViewBold, stylesGlobal.font_bold]}>Location:</Text>
                        <Text style={[styles.labelView, stylesGlobal.font]}>{location}</Text>
                    </View>
                ) : null}

                {netWorth != null && netWorth != "Not Set" && netWorth != "" && netWorth != 0 && networth_verified_on !=null && networth_verified_on!="" && networth_verified_on != undefined ? (
                    <View style={{ marginTop: 5, marginBottom: 5,display:'flex',flexDirection:'column' }}>
                       <Text style={[styles.labelViewBold, stylesGlobal.font_bold]}>Net Worth:</Text>
                        <View style={{display:'flex',flexDirection:'row'}}>
                        <Text style={[styles.labelView, stylesGlobal.font]}>{netWorth}</Text>
                        <Image style = {{width: 33,height: 20, resizeMode: 'contain',marginLeft:-5}} source = {require('../icons/verify_checkmark.png')}></Image>
                        </View> 
                    </View>
                ) : netWorth != null && netWorth != "Not Set" && netWorth != "" && netWorth != 0 ? (
                    <View style={{ marginTop: 5, marginBottom: 5 }}>
                        <Text style={[styles.labelViewBold, stylesGlobal.font_bold]}>Net Worth:</Text>
                        <Text style={[styles.labelView, stylesGlobal.font]}>{netWorth}</Text>
                    </View>
                ) : null}

                {goldCoins != null && goldCoins != "Not Set" && goldCoins != "" && goldCoins != 0 ? (
                    <View style={[{ marginTop: 5, marginBottom: 5 }, stylesGlobal.font]}>
                        <Text style={[styles.labelViewBold, stylesGlobal.font_bold]}>Gold Coins:</Text>
                        <Text style={[styles.labelView, stylesGlobal.font]}>{goldCoins}</Text>
                    </View>
                ) : null}
            </View>
        );
    }

    renderMemberPlanThreeDetail(data) {
        var location = data.address;
        var age = getUserAge(data.dob);
        var dob_verified_on=data.dob_verified_on;
        var height = data.height;
        var eyeColor = data.eye_color;
        var hairColor = data.hair_color;
        var body = data.body;
        var measurements = null;

        if (data.bust_chest != null && data.bust_chest != "Not Set" && data.bust_chest != "" && data.bust_chest != 0) {
            measurements = data.bust_chest;
        }

        if (data.waist != null && data.waist != "Not Set" && data.waist != "" && data.waist != 0) {
            if (measurements != null) {
                measurements = measurements + " / " + data.waist;
            } else {
                measurements = data.waist;
            }
        }

        if (data.hip_inseam != null && data.hip_inseam != "Not Set" && data.hip_inseam != "" && data.hip_inseam != 0) {
            if (measurements != null) {
                measurements = measurements + " / " + data.hip_inseam;
            } else {
                measurements = data.hip_inseam;
            }
        }

        return (
            <View>
                {location != null && location != "Not Set" && location != "" && location != 0 ? (
                    <View style={{ marginTop: 5, marginBottom: 5 }}>
                        <Text style={[styles.labelViewBold, stylesGlobal.font_bold]}>Location:</Text>
                        <Text style={[styles.labelView, stylesGlobal.font]}>{location}</Text>
                    </View>
                ) : null}

                {age != null && age != "Not Set" && age != "" && age != 0 && dob_verified_on!=null && dob_verified_on !=undefined && dob_verified_on != ""  ? (
                    <View style={{ marginTop: 5, marginBottom: 5,display:'flex',flexDirection:'column' }}>
                        <Text style={[styles.labelViewBold, stylesGlobal.font_bold]}>Age:</Text>
                        <View style={{display:'flex',flexDirection:'row'}}>
                        <Text style={[styles.labelView, stylesGlobal.font]}>{age}</Text>
                        <Image style = {{width: 33,height: 20, resizeMode: 'contain',marginLeft:-5}} source = {require('../icons/verify_checkmark.png')}></Image>
                        </View>
                    </View>
                ) : age != null && age != "Not Set" && age != "" && age != 0 ? (
                    <View style={{ marginTop: 5, marginBottom: 5 }}>
                        <Text style={[styles.labelViewBold, stylesGlobal.font_bold]}>Age:</Text>
                        <Text style={[styles.labelView, stylesGlobal.font]}>{age}</Text>
                    </View>
                ) :null}

                {height != null && height != "Not Set" && height != "" && height != 0 ? (
                    <View style={{ marginTop: 5, marginBottom: 5 }}>
                        <Text style={[styles.labelViewBold, stylesGlobal.font_bold]}>Height:</Text>
                        <Text style={[styles.labelView, stylesGlobal.font]}>{height}</Text>
                    </View>
                ) : null}

                {eyeColor != null && eyeColor != "Not Set" && eyeColor != "" && eyeColor != 0 ? (
                    <View style={{ marginTop: 5, marginBottom: 5 }}>
                        <Text style={[styles.labelViewBold, stylesGlobal.font_bold]}>Eye color:</Text>
                        <Text style={[styles.labelView, stylesGlobal.font]}>{eyeColor}</Text>
                    </View>
                ) : null}

                {hairColor != null && hairColor != "Not Set" && hairColor != "" && hairColor != 0 ? (
                    <View style={{ marginTop: 5, marginBottom: 5 }}>
                        <Text style={[styles.labelViewBold, stylesGlobal.font_bold]}>Hair color:</Text>
                        <Text style={[styles.labelView, stylesGlobal.font]}>{hairColor}</Text>
                    </View>
                ) : null}
                {body != null && body != "Not Set" && body != ""  && body != 0 ? (
                    <View style={{ marginTop: 5, marginBottom: 5 }}>
                        <Text style={[styles.labelViewBold, stylesGlobal.font_bold]}>Body:</Text>
                        <Text style={[styles.labelView, stylesGlobal.font]}>{body}</Text>
                    </View>
                ) : null}

                {measurements != null ? (
                    <View style={{ marginTop: 5, marginBottom: 5 }}>
                        <Text style={[styles.labelViewBold, stylesGlobal.font_bold]}>Measurements:</Text>
                        <Text style={[styles.labelView, stylesGlobal.font]}>
                            {measurements}
                        </Text>
                    </View>
                ) : null}
            </View>
        );
    }
    
    renderTypeOthers(data) {
        var location = data.address;
        var age = data.age;
        var dob_verified_on=data.dob_verified_on;
        var totalFollower = data.totalFollower;
        var totalConnection = data.totalConnection;
        return (
            <View>
                {location != null && location != "Not Set" && location != "" && location != 0 ? (
                    <View style={{ marginTop: 5, marginBottom: 5 }}>
                        <Text style={[styles.labelViewBold, stylesGlobal.font_bold]}>Location:</Text>
                        <Text style={[styles.labelView, stylesGlobal.font]}>{location}</Text>
                    </View>
                ) : null}
                {age != null && age != "Not Set" && age != "" && age != 0 && dob_verified_on!=null && dob_verified_on !=undefined && dob_verified_on != ""  ? (
                    <View style={{ marginTop: 5, marginBottom: 5,display:'flex',flexDirection:'column' }}>
                        <Text style={[styles.labelViewBold, stylesGlobal.font_bold]}>Age:</Text>
                        <View style={{display:'flex',flexDirection:'row'}}>
                        <Text style={[styles.labelView, stylesGlobal.font]}>{age}</Text>
                        <Image style = {{width: 33,height: 20, resizeMode: 'contain',marginLeft:-5}} source = {require('../icons/verify_checkmark.png')}></Image>
                        </View>
                    </View>
                ) : age != null && age != "Not Set" && age != "" && age != 0 ? (
                    <View style={{ marginTop: 5, marginBottom: 5 }}>
                        <Text style={[styles.labelViewBold, stylesGlobal.font_bold]}>Age:</Text>
                        <Text style={[styles.labelView, stylesGlobal.font]}>{age}</Text>
                    </View>
                ) :null}
                {(data.member_plan == "6" || data.member_plan == "8") && totalFollower != null && totalFollower != "Not Set" && totalFollower != "" && totalFollower != 0 ? (
                    <View style={{ marginTop: 5, marginBottom: 5 }}>
                        <Text style={[styles.labelViewBold, stylesGlobal.font_bold]}>{"Fans"}</Text>
                        <Text style={[styles.labelView, stylesGlobal.font]}>{totalFollower}</Text>
                    </View>
                ) : null}
                {data.member_plan == "5" && totalConnection != null && totalConnection != "Not Set" && totalConnection != "" && totalFollower != 0 ? (
                    <View style={{ marginTop: 5, marginBottom: 5 }}>
                        <Text style={[styles.labelViewBold, stylesGlobal.font_bold]}>{"Connections"}</Text>
                        <Text style={[styles.labelView, stylesGlobal.font]}>{totalConnection}</Text>
                    </View>
                ) : null}
            </View>
        );
    }

}

const styles = {
    labelViewBold: {
        color: Colors.black,
        fontSize: 13,
        fontWeight: "bold",
        backgroundColor: Colors.transparent,
        marginTop: 1,
        marginBottom: 1
    },
    labelView: {
        color: Colors.black,
        fontSize: 13,
        backgroundColor: Colors.transparent,
        marginTop: 1,
        marginBottom: 1
    },
    submit: {
        paddingVertical: 10,
        width: 100,
        backgroundColor: Colors.gold,
        borderRadius: 5,
        marginStart: 10,
        justifyContent: 'center',
        alignItems: 'center'
    },
    submitText: {
        color: "#fff",
        textAlign: "center"
    },
};

