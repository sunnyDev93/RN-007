import React, { Component } from "react";
import {
    Dimensions,
    Image,
    TouchableOpacity,
    View,
    Text
} from "react-native";
import { EventRegister } from 'react-native-event-listeners';
import auth from "@react-native-firebase/auth";
import Moment from "moment/moment";
import AsyncStorage from '@react-native-community/async-storage';
import Memory from "../core/Memory";
import { fcService } from "../utils/FirebaseChatService";
import { ImageCompressor } from './ImageCompressorClass';
import { Colors } from "../consts/Colors";
import { Constants } from "../consts/Constants";
import * as Global from "../consts/Global";
import WebService from "../core/WebService";
import { stylesGlobal } from '../consts/StyleSheet'
import { getUserAge, getRibbonImage } from "../utils/Util";

const { height, width } = Dimensions.get("window");
var TAG = "RowGuest";
const cardMargin = 12;


export default class RowGuest extends Component {

    constructor(props) {
        super(props);
        this.state = {
            userId: "",
            userToken: "",
            member_plan: "",
            user_data: null,
            first_buttonText: '',
            second_buttonText: '',
            third_buttonText: ''
        }
    }

    async UNSAFE_componentWillMount() {
        try {
            var userId = await AsyncStorage.getItem(Constants.KEY_USER_ID);
            var userToken = await AsyncStorage.getItem(Constants.KEY_USER_TOKEN);
            var member_plan = await AsyncStorage.getItem(Constants.KEY_MEMBER_PLAN);
            this.setState({
                userId: userId,
                userToken: userToken,
                member_plan: member_plan
            })
        } catch (error) {

        }
        this.listener = EventRegister.addEventListener(Constants.EVENT_PROFILE_IMAGE_UPDATED, () => {
            console.log(TAG, "EVENT_PROFILE_IMAGE_UPDATED event called");
        });
        if (this.props.data != null) {
            this.setState({ user_data: this.props.data });
        }
    }

    componentWillUnmount() {
        EventRegister.removeEventListener(this.listener);
        if (this.unsubscribe != undefined && this.unsubscribe != null) {
            this.unsubscribe();
        }
    }

    render() {
        var data = this.props.data;
        var title = data.first_name + " " + data.last_name;
        var url = data.imgpath + Constants.THUMB_FOLDER + data.filename;
        var slug = data.slug;
        return (
            <View style={stylesGlobal.cardView_container}>
                {
                    getRibbonImage(data)
                }
                <View style={stylesGlobal.cardView}>
                    <TouchableOpacity
                        activeOpacity={1}
                        onPress={() => {
                            if (this.props.data.is_real != 0) {
                                if (data.user_id === this.props.myUserId) {
                                    this.props.screenProps.navigate("MyProfile", {
                                        refreshProfileImage: this.props.refreshProfileImage
                                    });
                                } else {
                                    this.props.screenProps.navigate("ProfileDetail", {
                                        slug: slug
                                    });
                                }
                            }
                        }}
                    >
                        <View style={{ width: '100%', alignItems: 'center' }}>
                            <View style={stylesGlobal.card_profile_fitImageView}>
                                <ImageCompressor uri={url} style={stylesGlobal.card_profile_fitImage} />
                                {/* {getRibbonImage(data)} */}
                            </View>
                        </View>
                        <Text style={[{ color: Colors.gold, fontSize: 15, fontWeight: 'bold', backgroundColor: Colors.transparent, marginTop: 5, marginBottom: 5 }, stylesGlobal.font]}>
                            {title}
                        </Text>
                        {this.displayProfileInfo(data)}
                    </TouchableOpacity>
                    {this.renderButtons(data)}
                </View>
            </View>
        );
    }

    displayProfileInfo(data) {
        if (this.props.data.is_real == 1) {
            if (data.member_plan == "1" || data.member_plan == "2") {
                return this.renderTypeOneAndTwo(data);
            } else if (data.member_plan == "3") {
                return this.renderMemberPlanThreeDetail(data);
            } else {
                return this.renderTypeOthers(data);
            }
        } else {
            var member_type = "";
            for (i = 0; i < Global.entries.length; i++) {
                if (Global.entries[i].type.toString() == data.member_plan.toString()) {
                    member_type = Global.entries[i].name;
                    break;
                }
            }
            if (member_type == "") {
                member_type = "FAN";
            }
            return (
                <View style={{ marginTop: 5, marginBottom: 5 }}>
                    <Text style={[styles.labelView, stylesGlobal.font]}>{"Suggested Profile Type: " + member_type}</Text>
                </View>
            )
        }
    }

    renderTypeOneAndTwo(data) {
        var location = data.address;
        var netWorth = data.net_worth;
        var networth_verified_on = data.networth_verified_on;
        var goldCoins = data.gold_coins;
        if (netWorth == null || netWorth == "Not Set" || netWorth == "" || netWorth == 0) {
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

                {netWorth != null && netWorth != "Not Set" && netWorth != "" && netWorth != 0 && networth_verified_on != null && networth_verified_on != "" && networth_verified_on != undefined ? (
                    <View style={{ marginTop: 5, marginBottom: 5, display: 'flex', flexDirection: 'column' }}>
                        <Text style={[styles.labelViewBold, stylesGlobal.font_bold]}>Net Worth:</Text>
                        <View style={{ display: 'flex', flexDirection: 'row' }}>
                            <Text style={[styles.labelView, stylesGlobal.font]}>{netWorth}</Text>
                            <Image style={{ width: 33, height: 20, resizeMode: 'contain', marginLeft: -5 }} source={require('../icons/verify_checkmark.png')}></Image>
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
        var dob_verified_on = data.dob_verified_on;
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

                {age != null && age != "Not Set" && age != "" && age != 0 && dob_verified_on != null && dob_verified_on != undefined && dob_verified_on != "" ? (
                    <View style={{ marginTop: 5, marginBottom: 5, display: 'flex', flexDirection: 'column' }}>
                        <Text style={[styles.labelViewBold, stylesGlobal.font_bold]}>Age:</Text>
                        <View style={{ display: 'flex', flexDirection: 'row' }}>
                            <Text style={[styles.labelView, stylesGlobal.font]}>{age}</Text>
                            <Image style={{ width: 33, height: 20, resizeMode: 'contain', marginLeft: -5 }} source={require('../icons/verify_checkmark.png')}></Image>
                        </View>
                    </View>
                ) : age != null && age != "Not Set" && age != "" && age != 0 ? (
                    <View style={{ marginTop: 5, marginBottom: 5 }}>
                        <Text style={[styles.labelViewBold, stylesGlobal.font_bold]}>Age:</Text>
                        <Text style={[styles.labelView, stylesGlobal.font]}>{age}</Text>
                    </View>
                ) : null}

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
                {body != null && body != "Not Set" && body != "" && body != 0 ? (
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
        var age = getUserAge(data.dob);
        var dob_verified_on = data.dob_verified_on;
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
                {age != null && age != "Not Set" && age != "" && age != 0 && dob_verified_on != null && dob_verified_on != undefined && dob_verified_on != "" ? (
                    <View style={{ marginTop: 5, marginBottom: 5, display: 'flex', flexDirection: 'column' }}>
                        <Text style={[styles.labelViewBold, stylesGlobal.font_bold]}>Age:</Text>
                        <View style={{ display: 'flex', flexDirection: 'row' }}>
                            <Text style={[styles.labelView, stylesGlobal.font]}>{age}</Text>
                            <Image style={{ width: 33, height: 20, resizeMode: 'contain', marginLeft: -5 }} source={require('../icons/verify_checkmark.png')}></Image>
                        </View>
                    </View>
                ) : age != null && age != "Not Set" && age != "" && age != 0 ? (
                    <View style={{ marginTop: 5, marginBottom: 5 }}>
                        <Text style={[styles.labelViewBold, stylesGlobal.font_bold]}>Age:</Text>
                        <Text style={[styles.labelView, stylesGlobal.font]}>{age}</Text>
                    </View>
                ) : null}
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

    buttonAction = async (button_text) => {
        this.props.buttonAction(button_text, this.props.data);
    }

    gotoChatScreen = () => {
        console.log(TAG, 'gotoChageScree', this.props.chatAuthToken);
        console.log(TAG, 'before calling firebase userId = ', this.state.userId);
        this.firebaseAuthWithToken();
    }

    firebaseAuthWithToken = () => {
        let chatAuthToken = this.props.chatAuthToken;
        auth()
            .signInWithCustomToken(chatAuthToken)
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
        console.log(" ------- memberUsersLastMsg.length : ", memberUsersLastMsg.length, memberUserIds.length, memberUsersLastMsg.length > 0);
        if (memberUsersLastMsg.length > 0) {


            console.log(" ------- memberUsersLastMsg.length 2222  : ", memberUsersLastMsg.length, memberUserIds.length, memberUsersLastMsg.length > 0);

            try {
                let uri = Memory().env == "LIVE" ? Global.URL_GET_CHAT_USERS_INFO : Global.URL_GET_CHAT_USERS_INFO_DEV;


                console.log(" ------- memberUsersLastMsg.length 2222  333 : ", memberUsersLastMsg.length, memberUserIds.length, memberUsersLastMsg.length > 0);

                let params = { "format": "json", "memberUserIDs": memberUserIds };

                console.log('before chat screen params = ', params);    
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

                console.log('error in before firebase', error);
                
                if (error != undefined && error != null && error.length > 0) {
                    Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
                }
            }
            
            console.log('user list from server', chatUserList);
          
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
            imgpath: data2.imgpath + hostImagefilename,
            filename: hostImagefilename,
            id: data2.id,
            imageUri: data2.imgpath + Constants.THUMB_FOLDER + data2.filename,
            grpId: (!grpId || grpId === "") ? undefined : grpId,
            is_old: is_old,
        };

        console.log('before chat page = ', user, data2);

        this.props.screenProps.navigate("UserChat", {
            user: user,
            refreshList: this.updateRecentChatList,
            messageId: grpId
        });

        if(this.unsubscribe)
                this.unsubscribe();

            // for (var i = 0; i < response.length - 1; i++) {
            //     let result = response[i];
            //     if (result.members_user_id[0] === data.id.toString()) {
            //         grpId = result.id;
            //         is_old = result.is_old;
            //         break;
            //     }
            // }
            // let hostImagefilename = await AsyncStorage.getItem(Constants.KEY_USER_IMAGE_NAME);
            // var user = {
            //     first_name: data.first_name,
            //     last_name: data.last_name,
            //     slug: data.slug,
            //     imgpath: data.imgpath + hostImagefilename,
            //     filename: hostImagefilename,
            //     id: data.user_id,
            //     imageUri: data.imgpath + Constants.THUMB_FOLDER + data.filename,
            //     grpId: grpId,
            //     is_old: is_old
            // };
            // this.props.screenProps.navigate("UserChat", {
            //     user: user,
            //     refreshList: this.updateRecentChatList,
            //     messageId: grpId,
            // });
        

    };

    updateRecentChatList = () => {

    };

    renderButtons = data => {

        var first_buttonText = "Waiting";
        var second_buttonText = "Un-Invite";
        var third_buttonText = "Re-Send Invite";
        var ishosted = this.props.ishosted;
        var type = "";
        var event_toDateTime = Moment(this.props.eventDetailData.info.to_date).format('MM/DD/YYYY') + " " + this.props.eventDetailData.info.to_time;
        if (this.props.data.is_real == 0) {
            first_buttonText = "Waiting for Sign-Up";
            if (new Date(event_toDateTime) < new Date()) {
                first_buttonText = "Did Not Sign-Up";
            }
            second_buttonText = "Re-Send Invite";
            third_buttonText = "Delete";
            if (new Date(event_toDateTime) < new Date()) {
                second_buttonText = "Delete"
            }
        } else {
            if (data.rsvp_status != undefined && data.rsvp_status != null) {
                data.rsvp_status = data.rsvp_status.toString();
            }
            if (this.props.data.isbringafriend == 1) {
                if (data.rsvp_status === "0") {
                    first_buttonText = "Can't Go";
                    if (ishosted) {
                        type = "not attend";
                        second_buttonText = "Un-Invite"
                    } else {

                    }
                } else if (data.rsvp_status === "1") {
                    if (data.is_wait == "1") {
                        if (new Date(event_toDateTime) < new Date()) {
                            first_buttonText = "Not Confirmed";
                        } else {
                            first_buttonText = "Wants to join";
                        }
                        if (ishosted) {
                            type = "want join"
                            first_buttonText = "Wants to join";
                            second_buttonText = "Accept";
                            third_buttonText = "Reject";
                            if (new Date(event_toDateTime) < new Date()) {
                                second_buttonText = "Delete"
                            }
                        }
                    } else {
                        first_buttonText = "Going";
                        second_buttonText = "Un-Invite"
                    }
                } else if (data.rsvp_status === "2") {
                    first_buttonText = "Maybe";
                    if (ishosted) {
                        type = "not sure";
                        second_buttonText = "Un-Invite";
                        third_buttonText = "Re-Send Invite";
                    } else {
                    }
                } else if (data.rsvp_status == "3") {
                    if (ishosted) {
                        type = "rejected";
                        first_buttonText = "Rejected";
                    } else {
                        first_buttonText = "Wants to join";
                    }
                } else {
                    // console.log(data.slug, "data.rsvp_status 3: ", data.rsvp_status, ishosted);
                }
            } else {
                if (data.rsvp_status != null) {
                    if (data.rsvp_status === "0") {
                        // first_buttonText = "Sorry not attending";
                        first_buttonText = "Can't Go";
                        if (ishosted) {
                            type = "not attend";
                            second_buttonText = "Un-Invite"
                        } else {

                        }
                    } else if (data.rsvp_status === "1") {
                        if (data.is_wait == "1") {
                            if (new Date(event_toDateTime) < new Date()) {
                                first_buttonText = "Not Confirmed";
                            } else {
                                first_buttonText = "Wants to join";
                            }
                            if (ishosted) {
                                type = "want join";
                                second_buttonText = "Accept";
                                third_buttonText = "Reject";
                                if (new Date(event_toDateTime) < new Date()) {
                                    second_buttonText = "Delete"
                                }
                            } else {

                            }
                        } else {
                            first_buttonText = "Going";
                            second_buttonText = "Un-Invite"
                        }
                    } else if (data.rsvp_status === "2") {
                        first_buttonText = "Maybe";
                        if (ishosted) {
                            type = "not sure";
                            second_buttonText = "Un-Invite";
                            third_buttonText = "Re-Send Invite";
                        } else {

                        }
                    } else if (data.rsvp_status == "3") {
                        if (ishosted) {
                            type = "rejected";
                            first_buttonText = "Rejected";
                        } else {
                            first_buttonText = "Wants to join";
                        }
                    } else {
                        // console.log(data.slug, "data.rsvp_status 5 : ", data.rsvp_status, ishosted);
                    }
                } else {
                    first_buttonText = "Waiting";
                    if (new Date(event_toDateTime) < new Date()) {
                        first_buttonText = "No Reply";
                    }
                    if (ishosted) {
                        type = "waiting";
                        second_buttonText = "Un-Invite";
                        third_buttonText = "Re-Send Invite";
                    } else {

                    }
                }
            }
        }

        let firstButton = (
            <View style={[{ paddingVertical: 5, paddingHorizontal: 10, marginLeft: 10, marginTop: 5, backgroundColor: Colors.gold, borderRadius: 5, alignItems: 'center', justifyContent: 'center' }]}>
                <Text style={[{ fontSize: 15 }, stylesGlobal.font]}>{first_buttonText}</Text>
            </View>
        );

        let secondButton = (
            <TouchableOpacity
                style={[styles.submit, stylesGlobal.shadow_style]}
                underlayColor="#fff"
                onPress={() => {
                    this.buttonAction(second_buttonText);
                }}
            >
                <Text style={[styles.submitText, stylesGlobal.font]}>{second_buttonText}</Text>
            </TouchableOpacity>
        );

        let thirdButton = (
            <TouchableOpacity
                style={[styles.submit, stylesGlobal.shadow_style]}
                underlayColor="#fff"
                onPress={() => {
                    this.buttonAction(third_buttonText)
                }}
            >
                <Text style={[styles.submitText, stylesGlobal.font]}>{third_buttonText}</Text>
            </TouchableOpacity>
        );

        let messageButton = (
            <TouchableOpacity style={[styles.submit, stylesGlobal.shadow_style]}
                onPress={() => {
                    if (this.props.chatAuthToken) {
                        this.gotoChatScreen();
                    }
                }}
            >
                <Text style={[styles.submitText, stylesGlobal.font]}>{data.is_login == "1" ? "Chat" : "Message"}</Text>
            </TouchableOpacity>
        );

        return (
            <View style={{ width: '100%', justifyContent: "center", alignItems: "center", }}>
                <View style={styles.buttonView}>
                    {firstButton}
                    {this.props.ishosted && messageButton}
                </View>
                {
                    this.props.data.is_real != 1 && new Date(event_toDateTime) > new Date() && this.props.ishosted &&
                    <View style={styles.buttonView}>
                        {secondButton}
                        {thirdButton}
                    </View>
                }
                {
                    this.props.data.is_real != 1 && new Date(event_toDateTime) < new Date() && this.props.ishosted &&
                    <View style={styles.buttonView}>
                        {secondButton}
                    </View>
                }
                {
                    this.props.data.is_real == 1 &&
                    <View style={styles.buttonView}>
                        {
                            ishosted && type != "rejected" && new Date(event_toDateTime) > new Date() &&
                            secondButton
                        }
                        {
                            ishosted && (type == "not sure" || type == "not attend" || type == "waiting" || type == "want join") && new Date(event_toDateTime) > new Date() &&
                            thirdButton
                        }
                        {
                            ishosted && type == "want join" && new Date(event_toDateTime) < new Date() &&
                            secondButton
                        }
                    </View>
                }
            </View>

        );
    };
}
const styles = {
    buttonView: {
        width: '100%',
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "row",
        flexWrap: 'wrap',
        marginTop: 5,
    },
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
    submit: {
        padding: 10,
        backgroundColor: Colors.gold,
        borderRadius: 5,
        borderWidth: 1,
        borderColor: Colors.transparent,
        marginTop: 5,
        marginLeft: 10
    },
    submitText: {
        color: "#fff",
        textAlign: "center",
        fontSize: 15
    },
    ribbon: {
        width: 100,
        height: 100,
        position: "absolute",
        right: 13,
        top: 17,
    }
};
