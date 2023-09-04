import React, { Component } from "react";
import {
    Alert,
    View,
    Text,
    Image,
    TouchableOpacity,
    Dimensions,
    StyleSheet,
} from "react-native";
import { EventRegister } from 'react-native-event-listeners'
import { Colors } from "../consts/Colors";
import { Constants } from "../consts/Constants";
import { ImageCompressor } from './ImageCompressorClass'
import { stylesGlobal } from '../consts/StyleSheet'
import { SectionGrid, FlatGrid } from "react-native-super-grid";
import AsyncStorage from '@react-native-community/async-storage';
import ProgressIndicator from "./ProgressIndicator";

var TAG = "RowProfileInfo";
export default class RowProfileInfo extends Component {
    constructor(props) {
        super(props);
        this.state = {
            userImagePath: "",
            userImageName: "",
            userSlug: "",
            userId: "",
            profileImageWidth: Dimensions.get("window").width < Dimensions.get("window").height ? Dimensions.get("window").width / 2 : Dimensions.get("window").height / 2,
            is_portrait: true,
            is_applicant: false,
        }
    }

    UNSAFE_componentWillMount() {
        this.getData();
        this.listener = EventRegister.addEventListener(Constants.EVENT_PROFILE_IMAGE_UPDATED, () => {
            console.log(TAG, "EVENT_PROFILE_IMAGE_UPDATED event called");
            this.getData()
        })
        if (Dimensions.get("window").width < Dimensions.get("window").height) {
            this.setState({
                is_portrait: true
            })
        } else {
            this.setState({
                is_portrait: false
            })
        }
        Dimensions.addEventListener("change", () => {
            this.setState({
                profileImageWidth: Dimensions.get("window").width < Dimensions.get("window").height ? Dimensions.get("window").width / 2 : Dimensions.get("window").height / 2,
                is_portrait: Dimensions.get("window").width < Dimensions.get("window").height ? true : false
            })
        })

    }

    getData = async () => {
        try {
            var userId = await AsyncStorage.getItem(Constants.KEY_USER_ID);
            var userSlug = await AsyncStorage.getItem(Constants.KEY_USER_SLUG);
            var userImagePath = await AsyncStorage.getItem(Constants.KEY_USER_IMAGE_URL);
            var userImageName = await AsyncStorage.getItem(Constants.KEY_USER_IMAGE_NAME);
            // console.log(TAG, " getData, userImagePath, userImageName : ", userImagePath, userImageName);
            this.setState({
                userId: userId,
                userImagePath: userImagePath,
                userImageName: userImageName,
                userSlug: userSlug
            });

        } catch (error) {
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    }
    componentWillUnmount() {
        EventRegister.removeEventListener(this.listener)
    }


    /**
     * display profile info
     */
    render() {
        var data = this.props.data;
        var is_applicant = false;
        if (data && data.member_plan)
            is_applicant = (this.props.is_verified == "0" && (data.member_plan != '4' && data.member_plan != '7' && data.member_plan != '8'));
        var fullName = "";
        var url = ""
        if (data != null) {
            fullName = data.first_name + " " + data.last_name;
            url = this.state.userImagePath + Constants.THUMB_FOLDER + this.state.userImageName;
        } else {
            data = { "gender": "male" }
        }
        // console.log(TAG, " profile image url : ", url);
        let partiesHostButton = (
            <TouchableOpacity style={[styles.countImageContainer, { width: this.state.is_portrait ? '22%' : '12%' }]}
                onPress={() => {
                    if (this.props.is_verified != "1") {
                        Alert.alert(Constants.NOT_APPROVED_MESSAGE, "");
                        return;
                    }
                    this.props.switchTab("party", 2);
                }}>
                <View style={styles.countImageView}>
                    <Image style={styles.countImage} source={require("../icons/icon_event_join_count.png")} />
                </View>
                <View style={styles.badgeView}>
                    <Text style={[styles.countText, stylesGlobal.font]} numberOfLines={1}>{this.props.eventCreated}</Text>
                </View>
                <Text style={[styles.label, stylesGlobal.font]}>{Constants.LABEL_PARTIES_HOSTED}</Text>
            </TouchableOpacity>
        )

        let partiesAttendButton = (
            <TouchableOpacity style={[styles.countImageContainer, { width: this.state.is_portrait ? '22%' : '12%' }]}
                onPress={() => {
                    // if(this.props.is_verified != "1") {
                    //     Alert.alert(Constants.NOT_APPROVED_MESSAGE, "");
                    //     return;
                    // }
                    this.props.switchTab("party", 1);
                }}>
                <View style={styles.countImageView}>
                    <Image style={styles.countImage} source={require("../icons/icon_event_join_count.png")} />
                </View>
                <View style={styles.badgeView}>
                    <Text style={[styles.countText, stylesGlobal.font]} numberOfLines={1}>{this.props.eventJoined}</Text>
                </View>
                <Text style={[styles.label, stylesGlobal.font]}>{Constants.LABEL_PARTIES_ATTEND}</Text>
            </TouchableOpacity>
        )

        let tripsHostedButton = (
            <TouchableOpacity style={[styles.countImageContainer, { width: this.state.is_portrait ? '22%' : '12%' }]}
                onPress={() => {
                    if (this.props.is_verified != "1") {
                        Alert.alert(Constants.NOT_APPROVED_MESSAGE, "");
                        return;
                    }
                    this.props.switchTab("trip", 2);
                }}>
                <View style={styles.countImageView}>
                    <Image style={styles.countImage} source={require("../icons/icon_trip_hosted.png")} />
                </View>
                <View style={styles.badgeView}>
                    <Text style={[styles.countText, stylesGlobal.font]} numberOfLines={1}>{this.props.tripCreated}</Text>
                </View>
                <Text style={[styles.label, stylesGlobal.font]}>{Constants.LABEL_TRIPS_HOSTED}</Text>
            </TouchableOpacity>
        )

        let tripsAttendButton = (
            <TouchableOpacity style={[styles.countImageContainer, { width: this.state.is_portrait ? '22%' : '12%' }]}
                onPress={() => {
                    // if(this.props.is_verified != "1") {
                    //     Alert.alert(Constants.NOT_APPROVED_MESSAGE, "");
                    //     return;
                    // }
                    this.props.switchTab("trip", 1);
                }}>
                <View style={styles.countImageView}>
                    <Image style={styles.countImage} source={require("../icons/icon_trip_attended.png")} />
                </View>
                <View style={styles.badgeView}>
                    <Text style={[styles.countText, stylesGlobal.font]} numberOfLines={1}>{this.props.tripJoined}</Text>
                </View>
                <Text style={[styles.label, stylesGlobal.font]}>{Constants.LABEL_TRIPS_ATTEND}</Text>
            </TouchableOpacity>
        )

        let mylistButton = (
            <TouchableOpacity style={[styles.countImageContainer, { width: this.state.is_portrait ? '22%' : '12%' }]}
                onPress={() => {
                    if (this.props.is_verified != "1") {
                        Alert.alert(Constants.NOT_APPROVED_MESSAGE, "");
                        return;
                    }
                    this.props.screenProps.navigate("MyListsNavigation", { gender: data.gender });
                }}
            >
                <View style={styles.countImageView}>
                    <Image style={styles.countImage} source={require("../icons/icon_list.png")} />
                </View>
                <View style={styles.badgeView}>
                    <Text style={[styles.countText, stylesGlobal.font]} numberOfLines={1}>{this.props.mylist}</Text>
                </View>
                <Text style={[styles.label, stylesGlobal.font]}>{Constants.LABEL_MYLISTS}</Text>
            </TouchableOpacity>
        )

        var rose_num = 0;
        if (!isNaN(parseInt(this.props.rose, 10))) {
            rose_num = parseInt(this.props.rose, 10);
        }
        var rose_image = null;
        if (rose_num < 3) {
            rose_image = require("../icons/rose_dashboard1.png");
        } else if (rose_num < 6) {
            rose_image = require("../icons/rose_dashboard3.png");
        } else if (rose_num < 12) {
            rose_image = require("../icons/rose_dashboard6.png");
        } else if (rose_num < 50) {
            rose_image = require("../icons/rose_dashboard12.png");
        } else {
            rose_image = require("../icons/rose_dashboard50.png");
        }

        let roseButton = (
            <TouchableOpacity style={[styles.countImageContainer, { width: this.state.is_portrait ? '22%' : '12%' }, { marginLeft: 2 }]}
                onPress={() => {
                    if (data.gender == "male") {
                        this.props.screenProps.navigate("MyListsNavigation", { gender: data.gender, list_show: "rose_sent" });
                    } else {
                        this.props.screenProps.navigate("MyListsNavigation", { gender: data.gender, list_show: "rose_received" });
                    }
                }}
            >
                <View style={styles.countImageView}>
                    <Image style={styles.countImage} source={rose_image} />
                </View>
                <View style={styles.badgeView}>
                    <Text style={[styles.countText, stylesGlobal.font]} numberOfLines={1}>{this.props.rose}</Text>
                </View>
                <Text style={[styles.label, stylesGlobal.font]}>{data.gender == "male" ? Constants.LABEL_ROSE_MEN : Constants.LABEL_ROSE_WOMEN}</Text>
            </TouchableOpacity>
        )

        let giftsButton = (
            <TouchableOpacity style={[styles.countImageContainer, { width: this.state.is_portrait ? '22%' : '12%' }, { marginLeft: 2 }]}
                onPress={() => {
                    if (data.gender == "male") {
                        this.props.screenProps.navigate("MyListsNavigation", { gender: data.gender, list_show: "gift_sent" });
                    } else {
                        this.props.screenProps.navigate("MyListsNavigation", { gender: data.gender, list_show: "gift_received" });
                    }
                }}
            >
                <View style={styles.countImageView}>
                    <Image style={styles.countImage} source={require("../icons/send_gift.png")} />
                </View>
                <View style={styles.badgeView}>
                    <Text style={[styles.countText, stylesGlobal.font]} numberOfLines={1}>{data.gender == "male" ? this.props.sentGifts : this.props.receivedGifts}</Text>
                </View>
                <Text style={[styles.label, stylesGlobal.font]}>{data.gender == "male" ? Constants.LABEL_GIFTS_SENT : Constants.LABEL_GIFTS_RECEIVED}</Text>
            </TouchableOpacity>
        )

        let favoriteButton = (
            <TouchableOpacity style={[styles.countImageContainer, { width: this.state.is_portrait ? '22%' : '12%' }]}
                onPress={() => {
                    if (this.props.is_verified != "1") {
                        Alert.alert(Constants.NOT_APPROVED_MESSAGE, "");
                        return;
                    }
                    this.props.screenProps.navigate("MyListsNavigation", { gender: data.gender, list_show: "favorite" });
                }}
            >
                <View style={styles.countImageView}>
                    <Image style={styles.countImage} source={require("../icons/full_favorite_red.png")} />
                </View>
                <View style={styles.badgeView}>
                    <Text style={[styles.countText, stylesGlobal.font]} numberOfLines={1}>{this.props.connections}</Text>
                </View>
                <Text style={[styles.label, stylesGlobal.font]}>{Constants.LABEL_FAVORITES}</Text>
            </TouchableOpacity>
        )

        let emptyButton = (
            <View style={[styles.countImageContainer, { width: this.state.is_portrait ? '22%' : '12%' }]}>
            </View>
        )

        let fanButton = (
            <TouchableOpacity style={[styles.countImageContainer, { width: this.state.is_portrait ? '22%' : '12%' }]}
                onPress={() => {
                    if (this.props.is_verified != "1") {
                        Alert.alert(Constants.NOT_APPROVED_MESSAGE, "");
                        return;
                    }
                    this.props.screenProps.navigate("MyListsNavigation", { gender: data.gender, list_show: "fan" });
                }}
            >
                <View style={styles.countImageView}>
                    <Image style={styles.countImage} source={require("../icons/icon_fan_count.png")} />
                </View>
                <View style={styles.badgeView}>
                    <Text style={[styles.countText, stylesGlobal.font]} numberOfLines={1}>{this.props.fans}</Text>
                </View>
                <Text style={[styles.label, stylesGlobal.font]}>
                    {(data.member_plan === "4" || data.member_plan === "7" || data.member_plan === "8") ?
                        Constants.LABEL_FANS_2
                        :
                        Constants.LABEL_FANS
                    }
                </Text>
            </TouchableOpacity>
        )

        let referFriendButton = (
            <TouchableOpacity style={[styles.countImageContainer, { width: this.state.is_portrait ? '22%' : '12%' }]}
                onPress={() => {
                    if (this.props.is_verified != "1") {
                        Alert.alert(Constants.NOT_APPROVED_MESSAGE, "");
                        return;
                    }
                    this.props.screenProps.navigate("ReferredFriend");
                }}
            >
                <View style={styles.countImageView}>
                    <Image style={styles.countImage} source={require("../icons/ReferFriends.png")} />
                </View>
                <View style={styles.badgeView}>
                    <Text style={[styles.countText, stylesGlobal.font]} numberOfLines={1}>{this.props.referFriends}</Text>
                </View>
                <Text style={[styles.label, stylesGlobal.font]}>{Constants.LABEL_REFER_FRIEND}</Text>
            </TouchableOpacity>
        )

        let leaderboardsButton = (
            <TouchableOpacity style={[styles.countImageContainer, { width: this.state.is_portrait ? '22%' : '12%' }]}
                onPress={() => {
                    if (this.props.is_verified != "1") {
                        Alert.alert(Constants.NOT_APPROVED_MESSAGE, "");
                        return;
                    }
                    this.props.screenProps.navigate("TopMembers");
                }}
            >
                <View style={styles.countImageView}>
                    <Image style={styles.countImage} source={require("../icons/icon_leaderboard.png")} />
                </View>
                {/* <View style={styles.badgeView}>
                    <Text style={[styles.countText, stylesGlobal.font]} numberOfLines={1}>{this.props.fans}</Text>
                </View> */}
                <Text style={[styles.label, stylesGlobal.font]}>{Constants.LABEL_LEADERBOARDS}</Text>
            </TouchableOpacity>
        )

        return (
            <View style={styles.container}>
                {
                    !this.props.displayProfileInfo &&
                    <ProgressIndicator />
                }
                <TouchableOpacity style={[styles.imageContainer, { width: this.state.profileImageWidth, aspectRatio: 1, borderRadius: this.state.profileImageWidth / 2 }]}
                    onPress={() => {
                        {
                            // console.log("refreshProfileImage>>>>>>>>>>>", this.props.refreshProfileImage);
                            this.props.screenProps.navigate("MyProfile", {
                                refreshProfileImage: this.props.refreshProfileImage
                            });
                        }
                    }}
                >
                    <ImageCompressor uri={url} style={{ width: this.state.profileImageWidth, height: this.state.profileImageWidth }} />
                </TouchableOpacity>

                <Text style={[styles.name, stylesGlobal.font_bold]}>{fullName}</Text>
                <TouchableOpacity activeOpacity={1}
                    onPress={() => {
                        {
                            // console.log(">>>>>>>refreshProfileImage:", this.props.refreshProfileImage);
                            this.props.screenProps.navigate('EditProfile', {
                                profileDetail: this.props.data,
                                refreshAction: this.props.refreshProfileImage
                            })
                        }
                    }}
                >
                    <Text style={[styles.linklabel, stylesGlobal.font]}>{"Edit My Profile"}</Text>
                </TouchableOpacity>
                {
                    data.gender == "male" &&
                    <View style={{ width: '100%', marginBottom: 20, }}>
                        <View style={{ width: '100%', flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-around' }}>
                            {partiesHostButton}
                            {tripsHostedButton}
                            {roseButton}
                            {giftsButton}
                        {/* </View>
                        <View style={{ width: width - 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', marginTop: 10 }}> */}
                            {fanButton}
                            {!is_applicant && favoriteButton}
                            {mylistButton}
                            {leaderboardsButton}
                            {is_applicant && emptyButton}

                        </View>
                    </View>
                }
                {
                    data.gender != "male" &&
                    <View style={{ width: '100%', marginBottom: 20, paddingHorizontal: 10 }}>
                        <View style={{ width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' }}>
                            {partiesAttendButton}
                            {tripsAttendButton}
                            {roseButton}
                            {giftsButton}
                        </View>
                        <View style={{ width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', marginTop: 10 }}>
                            {fanButton}
                            {!is_applicant && favoriteButton}
                            {mylistButton}
                            {leaderboardsButton}
                            {is_applicant && emptyButton}
                        </View>
                    </View>
                }
            </View>
        );
    }
}
const styles = StyleSheet.create({
    container: {
        backgroundColor: Colors.white,
        // marginTop: 10,
        marginBottom: 15,
        paddingTop: 20,
        marginHorizontal: 10,
        borderRadius: 10,
        // paddingHorizontal: 10
    },
    imageContainer: {
        flex: 1,
        backgroundColor: Colors.white,
        alignSelf: "center",
        overflow: 'hidden'
    },
    name: {
        color: Colors.black,
        fontSize: 22,
        alignSelf: "center",
        marginTop: 6,
    },
    linklabel: {
        color: Colors.gold,
        fontSize: 13,
        alignSelf: "center",
        textAlign: "center",
        textAlignVertical: "center",
        padding: 3
    },
    label: {
        color: Colors.black,
        textAlign: 'center',
        fontSize: 10,
        marginTop: 5
    },
    countImageContainer: {
        alignItems: 'center',
        marginTop: 10
    },
    countImageView: {
        width: "90%",
        aspectRatio: 1,
    },
    countImage: {
        width: "100%",
        height: "100%",
        resizeMode: 'contain'
    },
    badgeView: {
        position: 'absolute',
        right: 0,
        top: 0,
        backgroundColor: Colors.gold,
        // borderWidth: 1,
        // borderColor: Colors.maroon,
        borderRadius: 25,
        overflow: 'hidden',
        width: 25,
        height: 25,
        justifyContent: 'center',
        alignItems: 'center'
    },
    countText: {
        fontWeight: 'bold',
        color: Colors.black,
        fontSize: 12,
    },
});
