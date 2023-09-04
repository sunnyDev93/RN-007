import React, { Component } from "react";
import {
    Dimensions,
    Image,
    Text,
    TouchableOpacity,
    View,
    Alert
} from "react-native";

import { ImageCompressor } from './ImageCompressorClass'
import { Colors } from "../consts/Colors";
import { Constants } from "../consts/Constants";
import * as Global from "../consts/Global";
import {stylesGlobal} from '../consts/StyleSheet';
import Moment from "moment/moment";
import Memory from "../core/Memory";
import AsyncStorage from '@react-native-community/async-storage';
import {getUserAge, getRibbonImage} from "../utils/Util";
import WebService from "../core/WebService";
import auth from "@react-native-firebase/auth";
import { fcService } from "../utils/FirebaseChatService";

const { height, width } = Dimensions.get("window");
var TAG = "RowConnection";
const cardMargin = 12;
//member_plan = 1 => Rich
//member_plan = 2 =>
//member_plan = 3 => Model
//member_plan = 4 =>
//member_plan = 5 => Connector
//member_plan = 6 => Famous
//member_plan = 7 => Fan
//member_plan = 8 => Alumni

export default class RowConnection extends Component {

    constructor(props) {
        super(props)
        this.state = {
            member_plan: '',
            is_verified: '',
            chatAuthToken: '',
            userToken: '',
            userId: '',
        }
        this.unsubscribe = null;
    }

    async UNSAFE_componentWillMount() {
        try {
            
            var member_plan = await AsyncStorage.getItem(Constants.KEY_MEMBER_PLAN);
            var is_verified = await AsyncStorage.getItem(Constants.KEY_IS_VERIFIED);
            var userToken = await AsyncStorage.getItem(Constants.KEY_USER_TOKEN);
            var userId = await AsyncStorage.getItem(Constants.KEY_USER_ID);
        
            this.setState({
                member_plan: member_plan,
                is_verified: is_verified,
                userToken: userToken,
                userId: userId

            });
        } catch (error) {
            // Error retrieving data
        }
    }

    componentWillUnmount(){
        if ( this.unsubscribe != null ) {
            this.unsubscribe();
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

// console.log('loger333333------>', grpId);
// return;
        //console.log(TAG, '>>>>>>>>>>>>>> ', user, data.id);
        this.props.screenProps.navigate("UserChat", {
            user: user,
            refreshList: this.updateRecentChatList,
            messageId: grpId
        });

        if(this.unsubscribe)
                this.unsubscribe();
    };

    render() {
        var data = this.props.data;
        var title = data.first_name + " " + data.last_name;
        var url = data.imgpath + Constants.THUMB_FOLDER + data.filename;
        var slug = data.slug;
        var favorite = false;
        var networth_verified_on = this.props.data.networth_verified_on;
        if(data.st != null) {
            if(data.st == 0) {
                favorite = false;
            } else {
                favorite = true;
            }
        } else {
            if(data.favorite_id == null) {
                favorite = false;
            } else {
                favorite = true;
            }
        }


        var isFollowing = false;
        if(data.following_id == null) {
            isFollowing = false;
        } else {
            isFollowing = true;
            //alert(data.first_name);
        }
        return (
            <View style = {stylesGlobal.cardView_container}>
            {
                getRibbonImage(data)
            }
                <View style={stylesGlobal.cardView}>
                    <TouchableOpacity activeOpacity={1} 
                        onPress={() => {
                            if(this.props.data.is_real != 0) {
                                if (data.user_id === this.props.myUserId) {
                                    this.props.screenProps.navigate("MyProfile", {
                                        // refreshProfileImage: this.props.refreshProfileImage
                                    });
                                } else {
                                    this.props.screenProps.navigate("ProfileDetail", {
                                        slug: slug
                                    });
                                }
                            }
                        }}
                    >
                        <View style = {{width: '100%', alignItems: 'center'}}>
                            <View style={stylesGlobal.card_profile_fitImageView}>
                                <View style={stylesGlobal.card_profile_fitImage}>
                                    <ImageCompressor uri={url} style={{width: '100%', height: '100%'}}/>
                                </View>
                                
                            {
                                this.props.followPress && this.props.favoritePress &&
                                ( (this.state.is_verified == "1" && this.state.member_plan != "4" && this.state.member_plan != "7" && this.state.member_plan != "8") ||
                                ((this.state.member_plan == "4" || this.state.member_plan == "7" || this.state.member_plan == "8") && (data.member_plan == "4" || data.member_plan == "7" || data.member_plan == "8")) ) && 
                                <TouchableOpacity style = {stylesGlobal.card_favorite_button} 
                                    onPress = {() => {
                                        this.props.favoritePress(data);
                                    }}
                                >
                                    <Image style={{width: '100%', height: '100%', resizeMode: 'contain'}} source={favorite ? require('../icons/full_favorite_red.png') : require('../icons/full_favorite_black.png')}/>
                                </TouchableOpacity>
                            }
                            {
                                this.props.followPress && this.props.favoritePress &&
                                (((this.state.member_plan == "4" || this.state.member_plan == "7" || this.state.member_plan == "8") && (data.member_plan != "4" && data.member_plan != "7" && data.member_plan != "8"))) &&
                                <TouchableOpacity style = {stylesGlobal.card_favorite_button} 
                                    onPress = {() => {
                                        this.props.followPress(data);
                                    }}
                                >
                                    <Image style={{width: '100%', height: '100%', resizeMode: 'contain'}} source={isFollowing  ? require('../icons/following.png') : require('../icons/following_un.png')}/>
                                </TouchableOpacity>
                            }
                            </View>
                        </View>
                        
                        <Text style={[{color: Colors.gold, fontSize: 15, backgroundColor: Colors.transparent, marginTop: 5, marginBottom: 5}, stylesGlobal.font_bold]}>{title}</Text>

                        {this.displayProfileInfo(data)}
                        {this.props.parentscreen == "MyRoseScreen" && this.datecountView(data)}
                    </TouchableOpacity>
                    {this.renderButtons(data)}
                </View>
            </View>
        );
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
        // console.log("data",data);
        var location = data.address;
        var netWorth = data.net_worth;
        var networth_verified_on = data.networth_verified_on;
        var goldCoins = data.gold_coins;
        var is_verified = data.is_verified;
        var memberType = data.name;
        var memberPlan = data.member_plan;
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

                {is_verified == 1  && netWorth != null && netWorth != "Not Set" && netWorth != "" && netWorth != 0 && networth_verified_on!=null && networth_verified_on !=undefined && networth_verified_on != "" ? (
                    <View style={{ marginTop: 5, marginBottom: 5,display:'flex',flexDirection:'column' }}>
                        <Text style={[styles.labelViewBold, stylesGlobal.font_bold]}>Net Worth:</Text>
                        <View style={{display:'flex',flexDirection:'row'}}>
                        <Text style={[styles.labelView, stylesGlobal.font]}>{netWorth}</Text>
                        <Image style = {{width: 33,height: 20, resizeMode: 'contain',marginLeft:-5}} source = {require('../icons/verify_checkmark.png')}></Image>
                        </View>  
                    </View>
                ) : is_verified == 1  && netWorth != null && netWorth != "Not Set" && netWorth != "" && netWorth != 0 ? (
                    <View style={{ marginTop: 5, marginBottom: 5 }}>
                        <Text style={[styles.labelViewBold, stylesGlobal.font_bold]}>Net Worth:</Text>
                        <Text style={[styles.labelView, stylesGlobal.font]}>{netWorth}</Text>
                    </View>
                ) : null}

                {is_verified == 1  && goldCoins != null && goldCoins != "Not Set" && goldCoins != "" && goldCoins != 0 ? (
                    <View style={[{ marginTop: 5, marginBottom: 5 }, stylesGlobal.font]}>
                        <Text style={[styles.labelViewBold, stylesGlobal.font_bold]}>Gold Coins:</Text>
                        <Text style={[styles.labelView, stylesGlobal.font]}>{goldCoins}</Text>
                    </View>
                ) : null}

                

                {((is_verified != 1 && (memberPlan != 4 && memberPlan != 7 && memberPlan != 8)) ) &&  
                    <View style={{ marginTop: 5, marginBottom: 5 }}>
                        <Text style={[styles.labelViewBold, stylesGlobal.font_bold]}>Applied for Profile:</Text>
                        <Text style={[styles.labelView, stylesGlobal.font]}>{memberType}</Text>
                    </View>

                }

                {(is_verified != 1 && memberPlan == 8) &&  
                    <View style={{ marginTop: 5, marginBottom: 5 }}>
                        <Text style={[styles.labelViewBold, stylesGlobal.font_bold]}>Past Profile:</Text>
                        <Text style={[styles.labelView, stylesGlobal.font]}>{memberType}</Text>
                    </View>

                }
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
        var is_verified = data.is_verified;
        var memberType = data.name;
        var memberPlan = data.member_plan;
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

                {age != null && age != "Not Set" && age != "" && age != 0 && dob_verified_on !=null && dob_verified_on != undefined && dob_verified_on != ""? (
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

                {((is_verified != 1 && (memberPlan != 4 && memberPlan != 7 && memberPlan != 8)) || memberPlan == 8) && 
                    <View style={{ marginTop: 5, marginBottom: 5 }}>
                        <Text style={[styles.labelViewBold, stylesGlobal.font_bold]}>Profile Type:</Text>
                        <Text style={[styles.labelView, stylesGlobal.font]}>{memberType}</Text>
                    </View>
                }
            </View>
        );
    }
    
    renderTypeOthers(data) {
        var location = data.address;
        var age = getUserAge(data.dob);
        var dob_verified_on=data.dob_verified_on;
        var totalFollower = data.totalFollower;
        var totalConnection = data.totalConnection;
        var is_verified = data.is_verified;
        var memberType = data.name;
        var memberPlan = data.member_plan;
        return (
            <View>
                {location != null && location != "Not Set" && location != "" && location != 0 ? (
                    <View style={{ marginTop: 5, marginBottom: 5 }}>
                        <Text style={[styles.labelViewBold, stylesGlobal.font_bold]}>Location:</Text>
                        <Text style={[styles.labelView, stylesGlobal.font]}>{location}</Text>
                    </View>
                ) : null}
                {age != null && age != "Not Set" && age != "" && age != 0 && dob_verified_on!=null && dob_verified_on != undefined && dob_verified_on != "" ? (
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
                {data.member_plan == "5" && totalConnection != null && totalConnection != "Not Set" && totalConnection != "" && totalConnection != 0 ? (
                    <View style={{ marginTop: 5, marginBottom: 5 }}>
                        <Text style={[styles.labelViewBold, stylesGlobal.font_bold]}>{"Followers"}</Text>
                        <Text style={[styles.labelView, stylesGlobal.font]}>{totalConnection}</Text>
                    </View>
                ) : null}

                {((is_verified != 1 && (memberPlan != 4 && memberPlan != 7 && memberPlan != 8)) || memberPlan == 8) && 
                    <View style={{ marginTop: 5, marginBottom: 5 }}>
                        <Text style={[styles.labelViewBold, stylesGlobal.font_bold]}>Profile Type:</Text>
                        <Text style={[styles.labelView, stylesGlobal.font]}>{memberType}</Text>
                    </View>
                }
            </View>
        );
    }

    datecountView(data) {
        return (
            <View>
                <View style={{ marginTop: 5, marginBottom: 5, }}>
                    <Text style={[styles.labelViewBold, stylesGlobal.font]}>Date:</Text>
                    <Text style={[styles.labelView, stylesGlobal.font]}>{Moment(data.send_date).format("DD MMM YYYY")}</Text>
                </View>
                <View style={{ marginTop: 5, marginBottom: 5, }}>
                    <Text style={[styles.labelView, stylesGlobal.font]}>{(this.props.sentRose ? "You sent " : this.props.receivedRose ? "Sent you " : "") + data.rose_count + (parseInt(data.rose_count, 10) > 1 ? " Roses" : " Rose")}</Text>
                </View>
            </View>
        )
    }

    renderButtons = (data) => {

        if(this.props.is_verified != "1") {
            return null;
        }
        var is_connection_request = data.is_connection_request;
        var connection_id = data.connection_id;
        var status = data.status;
        var is_reject = data.is_reject;
        var sender_user_id = data.sender_user_id;
        var receiver_user_id = data.receiver_user_id;

        let messageButton = (
            <TouchableOpacity style={[styles.submit, stylesGlobal.shadow_style]}
                onPress={async () => {
                    await this.callGetChatToken();
                }}
            >
                <Text style={[styles.submitText, stylesGlobal.font]}>{data.is_login == "1" ? "Chat" : "Message"}</Text>
            </TouchableOpacity>
        );

        let importGuestCheckButton = (
            data.invited ? 
            <View style={{backgroundColor:Colors.gold, paddingHorizontal:25, paddingVertical:8, borderRadius:5}}>
                <Text style={[stylesGlobal.font, {color: Colors.black, borderRadius: 3}]}>Already Invited</Text>
            </View> 
            :
            <View style = {{width: '100%', flexDirection: 'row', justifyContent: 'center', alignItems: 'center'}}>
                <TouchableOpacity style = {[{flexDirection: 'row'}, ]} onPress = {() => this.props.select_guest(data)}>
                    <View style = {{marginRight: 5}}>
                        <Image source={require('../icons/square.png')}  style={{width: 20, height: 20, resizeMode: 'contain'}}/>
                    {
                        data.selected && 
                        <Image source={require('../icons/checked.png')} style={{position:'absolute', top: 0, left: 0, width: 20, height: 20, resizeMode: 'contain'}}/>
                    }
                    </View>
                    <Text style = {[{fontSize: 14, color: Colors.black}, stylesGlobal.font]}>{this.props.invite_guest ? "Select as Invitee" : "IMPORT THIS USER"}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.submit, stylesGlobal.shadow_style]}
                    onPress={() => {
                        this.props.invite_user(data);
                    }}
                >
                    <Text style={[styles.submitText, stylesGlobal.font]}>{"Invite"}</Text>
                </TouchableOpacity>
            </View>
        )

        let followButton = (
            <TouchableOpacity style={[styles.submit, stylesGlobal.shadow_style]}
                onPress={() => {
                    this.props.followPress(data);
                }}
            >
                <Text style={[styles.submitText, stylesGlobal.font]}>{data.following_id ? "Unfollow" : "Follow"}</Text>
            </TouchableOpacity>
        )

        let removelistButton = (
            <TouchableOpacity style={[{paddingVertical: 10, paddingHorizontal: 15, backgroundColor: Colors.gold, borderRadius: 5, justifyContent: 'center', alignItems: 'center'}, stylesGlobal.shadow_style]}
                onPress={() => {
                    this.props.removeFromList(data);
                }}
            >
                <Text style={[styles.submitText, stylesGlobal.font]}>{"Remove from List"}</Text>
            </TouchableOpacity>
        );

        let inviteeventButton = (
            <TouchableOpacity style={[styles.submit, stylesGlobal.shadow_style]}
                onPress={() => {
                    this.props.inviteButton(data);
                }}
            >
                <Text style={[styles.submitText, stylesGlobal.font]}>{"Invite"}</Text>
            </TouchableOpacity>
        );

        return (
            <View style={{width: '100%', justifyContent: "center", alignItems: "center",}}>
            {
                this.props.invite_guest &&
                <View style = {styles.buttonView}>
                    {
                        importGuestCheckButton
                    }
                </View>
            }
            {
                !this.props.invite_guest &&
                <View style = {{width: '100%'}}>
                    <View style = {styles.buttonView}>
                    {
                        this.props.messageButton &&
                        messageButton
                    }
                    {
                        this.props.inviteButton &&
                        inviteeventButton
                    }
                    </View>
                    <View style = {styles.buttonView}>
                    {
                        this.props.removeFromList &&
                        removelistButton
                    }
                    </View>
                </View>
            }
                {/* <View style = {styles.buttonView}>
                {
                    this.props.is_verified == "1" && this.props.messageButton &&
                    messageButton
                }
                {
                    this.props.is_verified == "1" && !this.props.invite_guest && this.props.inviteButton &&
                    inviteeventButton
                }
                </View>
                <View style = {styles.buttonView}>
                {
                    this.props.is_verified == "1" && (this.props.parentscreen == "ImportGuestList" || this.props.invite_guest) &&
                    importGuestCheckButton
                }
                {
                    this.props.is_verified == "1" && this.props.parentscreen != "ImportGuestList" && !this.props.invite_guest && this.props.removeFromList &&
                    removelistButton
                }
                </View> */}
            </View>
        );
    };
}

const styles = {
    buttonView: {
        width: '100%',
        justifyContent: "center",
        alignItems: "center",
        flexDirection: 'row',
        marginTop: 10,
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
        textAlign: "center",
    }
};
