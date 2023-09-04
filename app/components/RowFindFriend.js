import React, { Component } from "react";
import {
    Dimensions,
    Animated,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ImageBackground,
    Button,
    FlatList,
    TouchableHighlight,
    Alert
} from "react-native";
import { EventRegister } from 'react-native-event-listeners'
import { ImageCompressor } from './ImageCompressorClass'
import { Colors } from "../consts/Colors";
import { Constants } from "../consts/Constants";
import * as Global from "../consts/Global";
import {stylesGlobal} from '../consts/StyleSheet'
import Memory from '../core/Memory'
import WebService from "../core/WebService";
import AsyncStorage from '@react-native-community/async-storage';
import {getUserAge, getRibbonImage} from "../utils/Util";

const { height, width } = Dimensions.get("window");
var TAG = "RowFindFriend";
const cardMargin = 12;
//member_plan = 1 => Rich
//member_plan = 2 =>
//member_plan = 3 => Model
//member_plan = 4 =>
//member_plan = 5 => Connector
//member_plan = 6 => Famous
//member_plan = 7 => Fan
//member_plan = 8 => Alumni

export default class RowFindFriend extends Component {
    state={
        userId: "",
        userToken: "",
        userSlug: "",
        isFav: false,
        isFollowing: false,
        member_plan: "",
        is_verified: "0",
    }

    UNSAFE_componentWillMount() {
        this.listener = EventRegister.addEventListener(Constants.EVENT_PROFILE_IMAGE_UPDATED, () => {
            console.log(TAG, "EVENT_PROFILE_IMAGE_UPDATED event called");
        })
    }

    componentDidMount() {
        this.getData()
    }
    
    getData = async () => {
        try {
            var userId = await AsyncStorage.getItem(Constants.KEY_USER_ID);
            var userToken = await AsyncStorage.getItem(Constants.KEY_USER_TOKEN);
            var member_plan = await AsyncStorage.getItem(Constants.KEY_MEMBER_PLAN);
            var is_verified = await AsyncStorage.getItem(Constants.KEY_IS_VERIFIED);
            var userSlug = this.props.data.slug;
            
            
            this.setState({
                userId: userId,
                userToken: userToken,
                userSlug: userSlug,
                member_plan: member_plan,
                is_verified: is_verified,
            });
        } catch (error) {
            console.log(error)
            // Error retrieving data
        }
    };
    componentWillUnmount() {
        EventRegister.removeEventListener(this.listener)
    }

    render() {
        var data = this.props.data;
        var title = data.first_name + " " + data.last_name;
        var url = data.imgpath + Constants.THUMB_FOLDER + data.filename;
        var startEndDate = data.gold_coins;
        var startEndTime = data.net_worth;
        var venueAddress = data.address;
        var slug = data.slug;
        var isFav = this.props.data.favorite_id ? true : false;
        var isFollowing = this.props.data.following_id ? true : false;

        return (
            <View style = {stylesGlobal.cardView_container}>
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
                                    slug: slug,
                                    refreshFavorite: (isFav) => {
                                        this.setState({isFav})
                                    },
                                });
                            }
                        }}
                    >
                        <View style = {{width: '100%', alignItems: 'center'}}>
                            <View style={{width: '30%', aspectRatio: 1, justifyContent: 'center', alignItems: 'center'}}>
                                <View style={{overflow: 'hidden', width: '80%', height: '80%', borderRadius: '50%'}}>
                                    <ImageCompressor uri={url} style={{width: '100%', height: '100%'}} />
                                </View>
                            {
                                ( (this.state.is_verified == "1" && this.state.member_plan != "4" && this.state.member_plan != "7" && this.state.member_plan != "8") ||
                                ((this.state.member_plan == "4" || this.state.member_plan == "7") && (data.member_plan == "4" || data.member_plan == "7")) )&& 
                                <TouchableOpacity style = {stylesGlobal.card_favorite_button}  onPress={() => {
                                    this.props.callfavoriteApi(data);
                                }}>
                                    <Image source={isFav ? require('../icons/full_favorite_red.png') : require('../icons/full_favorite_black.png')}
                                        style={{width: '100%', height: '100%', resizeMode: 'contain'}}
                                    />
                                </TouchableOpacity>
                            }
                            {
                                (this.state.is_verified != "1" || ((this.state.member_plan == "4" || this.state.member_plan == "7") && (data.member_plan != "4" && data.member_plan != "7" && data.member_plan != "8"))) &&
                                <TouchableOpacity style = {stylesGlobal.card_favorite_button}  onPress={() => {
                                    this.props.followPress(data);
                                }}>
                                    <Image source={isFollowing ? require('../icons/following_un.png') : require('../icons/following.png')}
                                        style={{width: '100%', height: '100%', resizeMode: 'contain'}}
                                    />
                                </TouchableOpacity>
                            }
                            </View>
                        </View>
                        
                        <Text style={[{color: Colors.gold, fontSize: 15, backgroundColor: Colors.transparent, marginTop: 5, marginBottom: 5}, stylesGlobal.font_bold]}>{title}</Text>
                        
                        {this.displayProfileInfo(data)}
                    </TouchableOpacity>
                    {this.renderButtons(data)}
                </View>
            </View>
        );
    }
 
    /**
 * display user info
 */
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

                {netWorth != null && netWorth != "Not Set" && netWorth != "" && netWorth != 0 && networth_verified_on!=null && networth_verified_on !=undefined && networth_verified_on != "" ? (
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

                {age != null && age != "Not Set" && age != "" && age != 0 && dob_verified_on !=null && dob_verified_on != undefined && dob_verified_on != "" ? (
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
                {age != null && age != "Not Set" && age != "" && age != 0 && dob_verified_on !=null && dob_verified_on != undefined && dob_verified_on != "" ? (
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
    
    renderButtons = data => {
        var is_connection_request = data.is_connection_request;
        var connection_id = data.connection_id;
        var status = data.status;
        var is_reject = data.is_reject;

        var sender_user_id = data.sender_user_id;
        var receiver_user_id = data.receiver_user_id;

        var displayMessage = false;
        var displayConnect = false;
        var displayAccept = false;
        var displayReject = false;
        var displayRequestSent = false;
        if (is_connection_request) {
            var displayMessage = false;
            var displayConnect = false;
            var displayAccept = true;
            var displayReject = true;
            displayRequestSent = false;
        } else if (connection_id == null && status == null && is_reject == null) {
            displayMessage = true;
            displayConnect = true;
            displayAccept = false;
            displayReject = false;
            displayRequestSent = false;
        } else if (status == "0" && is_reject == "1") {
            displayMessage = true;
            displayConnect = true;
            displayAccept = false;
            displayReject = false;
            displayRequestSent = false;
        } else if (status == "1" && is_reject == "0") {
            displayMessage = true;
            displayConnect = false;
            displayAccept = false;
            displayReject = false;
            displayRequestSent = false;
        }
        else if (status == "0" && is_reject == "0") {
            displayMessage = false;
            displayConnect = false;
            displayAccept = true;
            displayReject = true;
            displayRequestSent = false;
            if (sender_user_id == this.props.myUserId) {
                displayMessage = true;
                displayAccept = false;
                displayReject = false;
                displayRequestSent = true;
            }
        } else {
            displayMessage = true;
            displayConnect = false;
            displayAccept = false;
            displayReject = false;
            displayRequestSent = false;
        }

        let requestSentButton = (
            <TouchableOpacity
                style={[styles.submit, { marginRight: 10 }, stylesGlobal.shadow_style]}
                underlayColor="#fff"
                onPress={() => {
                    //this.props.messagePress(data);
                }}
            >
                <Text style={[styles.submitText, stylesGlobal.font]}>Request Sent</Text>
            </TouchableOpacity>
        );

        let messageButton = (
            <TouchableOpacity
                style={[styles.submit, { marginRight: 10 }, stylesGlobal.shadow_style]}
                underlayColor="#fff"
                onPress={() => {
                    this.props.messagePress(data);
                }}
            >
                <Text style={[styles.submitText, stylesGlobal.font]}>Message</Text>
            </TouchableOpacity>
        );


        let connectButton = (
            <TouchableOpacity
                style={[styles.submit, { marginRight: 10 }, stylesGlobal.shadow_style]}
                underlayColor="#fff"
                onPress={() => {
                    this.props.connectPress(data);
                }}
            >
                <Text style={[styles.submitText, stylesGlobal.font]}>Connect</Text>
            </TouchableOpacity>
        );

        let acceptButton = (
            <TouchableOpacity
                style={[styles.submit, { marginRight: 10 }, stylesGlobal.shadow_style]}
                underlayColor="#fff"
                onPress={() => {
                    this.props.acceptPress(data);
                }}
            >
                <Text style={[styles.submitText, stylesGlobal.font]}>Accept</Text>
            </TouchableOpacity>
        );

        let rejectButton = (
            <TouchableOpacity
                style={[styles.submit, { marginRight: 10, backgroundColor: Colors.white, borderColor: Colors.gold }, stylesGlobal.shadow_style]}
                underlayColor="#fff"
                onPress={() => {
                    this.props.rejectPress(data);
                }}
            >
                <Text style={[styles.submitText, { color: Colors.gold }, stylesGlobal.font]}>Reject</Text>
            </TouchableOpacity>
        );

        let followButton = (
            <TouchableOpacity
            style={[styles.submit, { marginRight: 10 }, stylesGlobal.shadow_style]}
            underlayColor="#fff"
                onPress={() => {
                    this.props.followPress(data);
                }}
            >
                <Text style={[styles.submitText, stylesGlobal.font]}>Follow</Text>
            </TouchableOpacity>
        )

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
            <View style={styles.buttonView}>
                {/* {displayConnect == true ? connectButton : null} */}
                {/* {displayMessage == true ? messageButton : null} */}
                {/* {displayAccept == true ? acceptButton : null} */}
                {/* {displayReject == true ? rejectButton : null} */}
                {/* {displayRequestSent == true ? requestSentButton : null} */}
                {/* {data.is_verified == "1" && followButton} */}
                {
                    this.state.is_verified && this.props.messagePress &&
                    messageButton
                }
                {
                    this.state.is_verified && this.props.inviteButton &&
                    inviteeventButton
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
        flexDirection: 'row',
        marginTop: 10,
    },
    labelViewBold: {
        color: Colors.black,
        fontSize: 13,
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
        padding: 10,
        width: width * 0.3,
        backgroundColor: Colors.gold,
        borderRadius: 5,
        borderWidth: 1,
        borderColor: Colors.transparent
    },
    submitText: {
        color: "#fff",
        textAlign:
            "center"
    },
};
