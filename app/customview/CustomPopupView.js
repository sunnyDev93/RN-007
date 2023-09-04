import React from 'react';
import {
    StyleSheet, Text, View, Modal, TouchableOpacity,
    Platform, Dimensions, Image,
    TouchableWithoutFeedback, Alert, Linking
} from 'react-native';
import { EventRegister } from 'react-native-event-listeners';
import { ImageCompressor } from '../components/ImageCompressorClass';
import { Constants } from "../consts/Constants";
import { Colors } from "../consts/Colors";
import { stylesGlobal, STICKY_HEADER_HEIGHT } from "../consts/StyleSheet";
import Icon from 'react-native-vector-icons/Feather'
import WebService from "../core/WebService";
import * as Global from "../consts/Global";
import Memory from '../core/Memory';
import AsyncStorage from '@react-native-community/async-storage';
import { isIphoneX, getBottomSpace } from '../custom_components/react-native-iphone-x-helper';
import { getUserAge, getRibbonImage } from "../utils/Util";

const imageWidth = 120;

var TAG = "CustomPopupView"
export default class CustomPopupView extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            userFirstName: "",
            userLastName: "",
            userImagePath: "",
            userImageName: "",
            userId: "",
            userToken: "",
            userSlug: "",
            coins: '',
            is_verified: '0',
            member_plan: '1',
            my_gold_coins_str: '',
            is_portrait: true,
            containerWidth: 250,
        }
    }
    async UNSAFE_componentWillMount() {
        await this.getData();

        this.listener = EventRegister.addEventListener(Constants.EVENT_PROFILE_IMAGE_UPDATED, async () => {
            console.log(TAG, "EVENT_PROFILE_IMAGE_UPDATED event called");
            await this.callMyProfileDetailAPI();
            this.getData();
        })
        this.listenerGoldCoinChange = EventRegister.addEventListener(Constants.EVENT_PROFILE_GOLDCOIN_UPDATED, async () => {
            console.log(TAG, "goldcoin change calleddddddddd");
            await this.callMyProfileDetailAPI();
            this.getData();
        })

        if (Dimensions.get("window").width < Dimensions.get("window").height) {
            this.setState({
                is_portrait: true,
                containerWidth: 250
            })
        } else {
            this.setState({
                is_portrait: false,
                containerWidth: 400
            })
        }

        Dimensions.addEventListener("change", () => {
            if (Dimensions.get("window").width < Dimensions.get("window").height) {
                this.setState({
                    is_portrait: true,
                    containerWidth: 250
                })
            } else {
                this.setState({
                    is_portrait: false,
                    containerWidth: 400
                })
            }
        })
    }

    componentWillUnmount() {
        EventRegister.removeEventListener(this.listener);
        EventRegister.removeEventListener(this.listenerGoldCoinChange);
    }

    getData = async () => {
        try {
            var notificationCount = await AsyncStorage.getItem(Constants.KEY_NOTIFICATION_COUNT);

            let userFirstName = await AsyncStorage.getItem(Constants.KEY_USER_FIRST_NAME);
            let userLastName = await AsyncStorage.getItem(Constants.KEY_USER_LAST_NAME);
            let userImagePath = await AsyncStorage.getItem(Constants.KEY_USER_IMAGE_URL);
            let userImageName = await AsyncStorage.getItem(Constants.KEY_USER_IMAGE_NAME);
            var userId = await AsyncStorage.getItem(Constants.KEY_USER_ID);
            var userToken = await AsyncStorage.getItem(Constants.KEY_USER_TOKEN);
            var userSlug = await AsyncStorage.getItem(Constants.KEY_USER_SLUG);
            var my_gold_coins_str = await AsyncStorage.getItem(Constants.KEY_GOLD_COINS);
            var is_verified = await AsyncStorage.getItem(Constants.KEY_IS_VERIFIED);
            var member_plan = await AsyncStorage.getItem(Constants.KEY_MEMBER_PLAN);

            this.setState({
                userId: userId,
                userToken: userToken,
                userSlug: userSlug,
                count: notificationCount,
                userFirstName: userFirstName,
                userLastName: userLastName,
                userImagePath: userImagePath,
                userImageName: userImageName,
                my_gold_coins_str: my_gold_coins_str,
                is_verified: is_verified,
                member_plan: member_plan
            });

            this.getProfileData();


            //.callMyProfileDetailAPI();
        } catch (error) {
            // Error retrieving data
            console.log('custompopupView getData  error  ' + error);
        }
    }

    getProfileData = async () => {
        const profileData = await AsyncStorage.getItem(Constants.KEY_MY_PROFILE);
        if (profileData != undefined && profileData != null) {
            const objProfile = JSON.parse(profileData);

            this.setState({
                dataMyProfile: objProfile,
                coins: objProfile.userProfileInfo.gold_coins
            });
        }
    }

    /**
     * call get my profile detail API and display content
     */
    callMyProfileDetailAPI = async () => {
        try {
            // console.log('callmyprofle');
            let uri = Memory().env == "LIVE" ? Global.URL_MY_PROFILE_DETAIL : Global.URL_MY_PROFILE_DETAIL_DEV
            let params = new FormData();
            params.append("token", this.state.userToken);
            params.append("user_id", this.state.userId);
            params.append("format", "json");
            console.log(TAG + " callMyProfileDetailAPI uri " + uri);
            console.log(TAG + " callMyProfileDetailAPI params " + JSON.stringify(params));
            WebService.callServicePost(uri, params, this.handleGetMyprofileDetailResponse);
        } catch (error) {
            console.log(error)
            this.setState({
                loading: false
            });
        }
    };
    /**
    * handle my profile API response
    */
    handleGetMyprofileDetailResponse = async (response, isError) => {
        // console.log(TAG + " callMyProfileDetailAPI Response " + JSON.stringify(response));
        console.log(TAG + " callMyProfileDetailAPI isError " + isError);
        if (!isError) {
            var result = response;
            if (result != undefined && result != null) {
                if (result.data != undefined && result.data != null) {
                    this.setState({
                        dataMyProfile: result.data,
                        coins: result.data.userProfileInfo.gold_coins
                    });
                    if (this.state.my_gold_coins_str != result.data.userProfileInfo.gold_coins) {
                        try {
                            if ( result.data.userProfileInfo.networth_amount != undefined && result.data.userProfileInfo.networth_amount != null){
                                AsyncStorage.setItem(Constants.KEY_NET_WORTH, result.data.userProfileInfo.networth_amount);
                            }
                            AsyncStorage.setItem(Constants.KEY_GOLD_COINS, result.data.userProfileInfo.gold_coins);
                        } catch (error) {
                            console.log(" handleGetMyprofileDetailResponse : -- ", error);
                        }
                    }

                    await AsyncStorage.setItem(Constants.KEY_MY_PROFILE, JSON.stringify(result.data));
                }
            }

        } else {
            if (response != undefined && response != null && response.length > 0) {
                Alert.alert(response.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
        this.setState({
            loading: false
        });
    };

    getDataAgain() {

    }

    openProfile() {
        this.props.closeDialog();
        if (!this.props.payment_check_failed) {
            this.props.prop_navigation.navigate("MyProfile", { refreshProfileImage: () => { } });
        }
    }

    open_gold_coin_link = () => {
        // Alert.alert("To Buy or Sell Gold, please use the Website: the007percent.com", "",
        // [
        //     {text: 'OK', onPress: () => {
        //         let link = "https://the007percent.com/my-account";
        //         Linking.canOpenURL(link).then(supported => {
        //             if (supported) {
        //                 Linking.openURL(link);
        //             } else {
        //                 
        //             }
        //         });
        //     }},
        //     {text: 'Cancel', onPress: () => null},
        // ],
        //     {cancelable: false}
        // )
        this.props.closeDialog();
        if (!this.props.payment_check_failed) {
            if (this.props.buy_goldcoin) {
                this.props.buy_goldcoin();
            } else {
                if (this.props.openMyAccountScreen) {
                    this.props.openMyAccountScreen(true, "buy_goldcoin")
                }
                // this.props.prop_navigation.navigate('MyAccountScreen', {getDataAgain: this.getDataAgain, initial_tab: "buy_goldcoin"});
            }
        }
    }

    open_notification_link() {
        this.props.closeDialog();
        if (!this.props.payment_check_failed) {
            if (this.props.account_notification) {
                this.props.account_notification();
            } else {
                if (this.props.openMyAccountScreen) {
                    this.props.openMyAccountScreen(true, "notifications")
                }
            }
        }
    }

    open_account_link() {
        this.props.closeDialog();
        if (!this.props.payment_check_failed) {
            if (this.props.account_membership) {
                this.props.account_membership();
            } else {
                if (this.props.openMyAccountScreen) {
                    this.props.openMyAccountScreen(true, "susbscription")
                }
            }
        }
    }

    open_mygift_link = () => {
        this.props.closeDialog();
        if (!this.props.payment_check_failed) {
            this.props.prop_navigation.navigate("MyGiftScreen");
        }
    }

    open_wishlist_link = () => {
        this.props.closeDialog();
        if (!this.props.payment_check_failed) {
            this.props.prop_navigation.navigate("MyWishListScreen");
        }
    }

    open_mylist_link = () => {
        this.props.closeDialog();
        if (!this.props.payment_check_failed) {
            this.props.prop_navigation.navigate("MyListsNavigation", { list_show: 'all' });
        }
    }

    open_referfriend_link = () => {
        this.props.closeDialog();
        if (!this.props.payment_check_failed) {
            this.props.prop_navigation.navigate("ReferredFriend");
        }
    }

    open_myfavorite_link = () => {
        this.props.closeDialog();
        if (!this.props.payment_check_failed) {
            this.props.prop_navigation.navigate("MyFavoriteScreen");
        }
    }

    open_visitemyprofile_link = () => {
        this.props.closeDialog();
        if (!this.props.payment_check_failed) {
            this.props.prop_navigation.navigate("VisitedProfile");
        }
    }

    open_topmembers_link = () => {
        this.props.closeDialog();
        if (!this.props.payment_check_failed) {
            this.props.prop_navigation.navigate("TopMembers");
        }
    }

    getRibbonImage = () => {

        if (!this.state.dataMyProfile) {
            return null;
        }

        var imagePath = null;
        for (let i = 0; i < Global.entriesAll.length; i++) {
            if (this.state.dataMyProfile.userProfileInfo.member_plan.toString() == Global.entriesAll[i].type.toString()) {
                imagePath = Global.entriesAll[i].tag;
                break;
            }
        }

        if (this.state.is_verified == "1") {
            return (
                // <TouchableOpacity style={styles.ribbon} onPress={() =>{ console.log('sdfsdf'); this.openProfile()}}>
                //     <Image style={{ width: '100%', height: '100%', resizeMode: 'contain' }} source={{ uri: imagePath }} />
                // </TouchableOpacity>
                <View style={styles.ribbon}>
                    <Image style={{ width: '100%', height: '100%', resizeMode: 'contain' }} source={{ uri: imagePath }} />
                </View>
            );
        } else {
            return (
                // <TouchableOpacity style={styles.ribbon} onPress={() =>{ console.log('sdfsdf'); this.openProfile()}}>
                //     <Image style={{ width: '100%', height: '100%', resizeMode: 'contain' }} source={require("../icons/Profile-Badges-Applicant.png")} />
                // </TouchableOpacity>
                 <View style={styles.ribbon} >
                    <Image style={{ width: '100%', height: '100%', resizeMode: 'contain' }} source={require("../icons/Profile-Badges-Applicant.png")} />
                </View>
            );
        }
    }

    render() {
        return (

            <Modal
                animationType="fade"
                transparent={true}
                closeOnClick={true}
                visible={this.props.showModel}
                onRequestClose={() => {
                    this.props.closeDialog();
                }}
                supportedOrientations={['portrait', 'landscape']}
            >
                <TouchableWithoutFeedback onPress={() => this.props.closeDialog()}>
                    <View style={[styles.modal_container]}>
                        <View style={[styles.mainContainer, {
                            width: this.state.containerWidth,
                            //top: this.state.is_portrait ? getBottomSpace() + STICKY_HEADER_HEIGHT + 25 : STICKY_HEADER_HEIGHT + 35,
                            top: STICKY_HEADER_HEIGHT + STICKY_HEADER_HEIGHT * 0.75 + 15,
                            //right: this.state.is_portrait ? 10 : getBottomSpace() + 10,
                            right: 10,
                        }]}>
                            <View style={styles.triangle} />
                            {
                                this.getRibbonImage()
                            }
                            <TouchableOpacity style={{ 
                                            width: '100%', 
                                            alignItems: 'center', 
                                            justifyContent: 'center', 
                                            paddingVertical: 5, 
                                            zIndex: 1000, 
                                            position: 'absolute',
                                            top: 35
                                            }} onPress={() =>{ console.log('sdfsdf'); this.openProfile()}}>
                                            <Text style={[styles.name, stylesGlobal.font]}>{"View My Profile"}</Text>
                                        </TouchableOpacity>
                            <View style={[styles.viewContainer, { width: this.state.containerWidth - 20, }]}>
                                <View style={{ width: '100%', alignItems: 'center', justifyContent: 'center', backgroundColor: '#464646' }}>
                                    <Text style={[styles.name, stylesGlobal.font]}>{this.state.userFirstName.toUpperCase() + ' ' + this.state.userLastName.toUpperCase()}</Text>
                                </View>
                                <View style={{ width: '100%', flexDirection: this.state.is_portrait ? 'column' : 'row', alignItems: 'center', justifyContent: 'center' }}>
                                    <View style={{ width: this.state.is_portrait ? '100%' : '50%',  paddingTop: 35}}>
                                        {/* <TouchableOpacity style={{  */}
                                        {/*     width: '100%',  */}
                                        {/*     alignItems: 'center',  */}
                                        {/*     justifyContent: 'center',  */}
                                        {/*     paddingVertical: 5,  */}
                                        {/*     zIndex: 1000,  */}
                                        {/*     }} onPress={() =>{ console.log('sdfsdf'); this.openProfile()}}> */}
                                        {/*     <Text style={[styles.name, stylesGlobal.font]}>{"View My Profile"}</Text> */}
                                        {/* </TouchableOpacity> */}
                                        <TouchableOpacity style={styles.imageContainer} onPress={() => this.openProfile()}>
                                            <ImageCompressor style={styles.image} uri={this.state.userImagePath + Constants.THUMB_FOLDER + this.state.userImageName} />
                                        </TouchableOpacity>

                                        <View style={{ flexDirection: 'row', width: '100%', justifyContent: 'center', alignItems: 'center', marginTop: 10 }}>
                                            <Text style={[{ color: Colors.black }, stylesGlobal.font]}>{'Gold Coins: '}</Text>
                                            <Text style={[{ color: Colors.black }, stylesGlobal.font]}>{this.state.coins}</Text>
                                            <TouchableOpacity style={{ marginLeft: 10 }} onPress={() => this.open_gold_coin_link()}>
                                                <Image source={require('../icons/TurningCoin.gif')} style={{ width: 25, height: 25, resizeMode: 'contain', marginLeft: 5 }} />
                                            </TouchableOpacity>
                                            
                                            <TouchableOpacity style={{ marginLeft: 10 }} onPress={() => this.open_gold_coin_link()}>
                                                <Image source={require('../icons/plus_sign.png')} style={{ width: 20, height: 20, resizeMode: 'contain' }} />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                    <View style={{ width: this.state.is_portrait ? '100%' : '50%', alignItems: 'center' }}>
                                        {/* <TouchableOpacity style = {styles.link_button_view} onPress = {() => this.open_notification_link()}>
                                            <Text style={[styles.account_linktext, stylesGlobal.font]}>{"Notifications"}</Text>
                                        </TouchableOpacity> */}
                                        <TouchableOpacity style={styles.link_button_view} onPress={() => this.open_account_link()}>
                                            <Text style={[styles.account_linktext, stylesGlobal.font]}>{"My Account"}</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={styles.link_button_view} onPress={() => this.open_mylist_link()}>
                                            <Text style={[styles.account_linktext, stylesGlobal.font]}>{"Friend Lists"}</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={styles.link_button_view} onPress={() => this.open_referfriend_link()}>
                                            <Text style={[styles.account_linktext, stylesGlobal.font]}>{"Refer Friends"}</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={styles.link_button_view} onPress={() => this.open_topmembers_link()}>
                                            <Text style={[styles.account_linktext, stylesGlobal.font]}>{"Leaderboards"}</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                                <View style={[styles.viewGray, { width: this.state.containerWidth, }]}>
                                    <TouchableOpacity style={[styles.button_view, stylesGlobal.shadow_style, { width: (this.state.containerWidth / 2) - 30 }]} onPress={() => {
                                        this.props.closeDialog();
                                        if (!this.props.payment_check_failed) {
                                            this.props.prop_navigation.navigate('EditProfile', {
                                                // userSlug: this.state.userSlug,
                                                // profileDetail: this.state.dataMyProfile,
                                                refreshAction: this.getDataAgain
                                            })
                                        }
                                    }}>
                                        <Text style={[styles.textMyProfile, stylesGlobal.font]}>{"Edit Profile"}</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity style={[styles.button_view, stylesGlobal.shadow_style, { backgroundColor: '#464646', width: (this.state.containerWidth / 2) - 30 }]} onPress={() => this.props.logoutUser()}>
                                        <Text style={[styles.textMyProfile, stylesGlobal.font]}>{"Logout"}</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </View>
                </TouchableWithoutFeedback>
            </Modal >

        );
    }
}
const styles = StyleSheet.create({
    modal_container: {
        flex: 1,
        justifyContent: 'center',
        paddingRight: 5,
        backgroundColor: Colors.transparent,
        ...Platform.select({
            ios: {
                borderRadius: 10,
            },
            android: {
                elevation: 24,
                borderRadius: 5,
            },
        }),
    },
    mainContainer: {
        position: 'absolute',
        alignItems: 'center'
    },
    ribbon: {
        width: 140,
        height: 140,
        position: "absolute",
        right: 2,
        top: 5,
        zIndex: 20,
        elevation: 3,
        
    },
    triangle: {
        alignSelf: 'flex-end',
        marginRight: isIphoneX ? 24 : 3,
        width: 0,
        height: 0,
        borderStyle: 'solid',
        borderLeftWidth: 8,
        borderRightWidth: 8,
        borderBottomWidth: 11,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderBottomColor: Colors.lightGray
    },
    viewContainer: {
        borderTopRightRadius: 5,
        borderTopLeftRadius: 5,
        overflow: "hidden",
        backgroundColor: '#fbf7ec',
        alignItems: 'center',
    },
    viewGray: {
        height: 50,
        borderBottomRightRadius: 5,
        borderBottomLeftRadius: 5,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center'
    },
    imageContainer: {
        // marginTop: 5,
        width: imageWidth,
        height: imageWidth,
        backgroundColor: Colors.white,
        borderRadius: imageWidth / 2,
        alignSelf: "center",
        overflow: "hidden",
    },
    image: {
        overflow: "hidden",
        width: imageWidth,
        height: imageWidth,
        borderRadius: imageWidth / 2
    },
    imageCircle: {
        position: 'absolute',
        top: -(imageWidth / 2),
        bottom: -(imageWidth / 2),
        right: -(imageWidth / 2),
        left: -(imageWidth / 2),
        borderRadius: imageWidth / 2 + imageWidth / 4,
        borderWidth: (imageWidth / 2),
        borderColor: Colors.lightGray
    },
    name: {
        color: Colors.gold,
        fontSize: 14,
        alignSelf: "center",
        marginVertical: 5,
    },
    labelView: {
        flexDirection: "row",
        paddingBottom: 4,
        paddingTop: 4,
        alignItems: "center"
    },
    label: {
        color: Colors.gold,
        fontSize: 14,
    },
    button_view: {
        backgroundColor: Colors.gold,
        marginLeft: 4,
        marginTop: 4,
        marginBottom: 4,
        marginRight: 10,
        padding: 10,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 5
    },
    textLogout: {
        fontSize: 11,
        color: Colors.black,
        textAlign: 'center',
    },
    textMyProfile: {
        fontSize: 10,
        color: Colors.white,
        textAlign: 'center',
    },
    account_linktext: {
        fontSize: 14,
        color: Colors.black,
        paddingVertical: 5
    },
    link_button_view: {
        width: '80%',
        borderBottomWidth: 0.5,
        borderColor: Colors.gold,
        padding: 5,
        alignItems: 'center'
    },


});

