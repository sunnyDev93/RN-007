import React, { Component,Fragment } from "react";
import {
    Alert,
    Platform,
    StyleSheet,
    Text,
    View,
    Animated,
    SafeAreaView,
    ScrollView,
    Dimensions,
    Image,
    TouchableOpacity,
    TextInput,
    Linking,
    Keyboard,
    FlatList
} from "react-native";
import { EventRegister } from 'react-native-event-listeners'
import ParallaxScrollView from "react-native-parallax-scroll-view";
import * as Animatable from 'react-native-animatable';
import {SectionGrid, FlatGrid} from "react-native-super-grid";
import Moment from "moment/moment";
import PhoneInput from 'react-native-phone-input';
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { selectContact, selectContactPhone, selectContactEmail } from 'react-native-select-contact';
import { extendMoment } from "moment-range";
import AsyncStorage from '@react-native-community/async-storage';

import { ImageCompressor } from './ImageCompressorClass'
import { Colors } from "../consts/Colors";
import { Constants } from "../consts/Constants";
import ProgressIndicator from "./ProgressIndicator";
import WebService from "../core/WebService";
import * as Global from "../consts/Global";
import ProfileImageGirdViewRow from "./ProfileImageGirdViewRow";
import CustomTimeline from "../customview/CustomTimeline";
import { stylesGlobal } from '../consts/StyleSheet'
import Memory from '../core/Memory'
import {getProfileSubStr, convertStringtoEmojimessage, getRecentLoginTimeFrame, getUserAge, getRibbonImage} from "../utils/Util";
import CustomPopupView from "../customview/CustomPopupView";
import * as ValidationUtils from "../utils/ValidationUtils";
import ModalDropdown from '../custom_components/react-native-modal-dropdown/ModalDropdown';
import BannerView from "../customview/BannerView";
import { isIphoneX, getBottomSpace, getStatusBarHeight } from '../custom_components/react-native-iphone-x-helper';

const { height, width } = Dimensions.get("window");
const STICKY_HEADER_HEIGHT = 48;

var smallProfileImageSize = 40;

var card_padding = 20;

var TAG = "MyProfileScreen";

const interpolate = (value, opts) => {
	const x = value.interpolate(opts)
	x.toJSON = () => x.__getValue()
	return x
}

export default class MyProfileScreen extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            userId: "",
            userToken: "",
            userSlug: "",
            is_verified: "0",
            loading: false,
            userFirstName: "",
            userLastName: "",
            enableScrollViewScroll: true,
            dataMyProfile: null,
            displayProfileDetail: false,
            connectionList: [],
            displayConnections: false,
            visibleHeaderBool:true,

            showInvitationPopUp: false,
            showPhoneEmailSelectPopUp: false,
            rowInvitation: [{first_name: '', last_name: '', email: '', phoneNumber: '', selected_user_role_index: 0, selected_gender_index: 0}],
            user_role: Global.entries,
            user_gender: [{type: "Male", image: require('../icons/signup_male.png')}, {type: "Female", image: require('../icons/signup_female.png')}],

            searchText: '',

            userImagePath: "",
            userImageName: "",

            profileImageSize: Dimensions.get("window").width < Dimensions.get("window").height ? (Dimensions.get("window").width - 20) * 0.75 : (Dimensions.get("window").height - 20) * 0.75,
            coverImageHeight: 0,
            PARALLAX_HEADER_HEIGHT: 0,

            is_portrait: true,
            screen_width: Dimensions.get("window").width,

            showModel: false,
        };

    }
    static defaultProps = {

    }
    draggedValue = new Animated.Value(-120)
    UNSAFE_componentWillMount() {
        this.getData();



        this.listener = EventRegister.addEventListener(Constants.EVENT_PROFILE_IMAGE_UPDATED, () => {
            this.getDataAgain()
        })

        if(Dimensions.get("window").width < Dimensions.get("window").height) {
            this.setState({
                is_portrait: true,
                screen_width: Dimensions.get("window").width,
            })
        } else {
            this.setState({
                is_portrait: false,
                screen_width: Dimensions.get("window").width - (getStatusBarHeight() + getBottomSpace()),
            })
        }
        this.setState({
            profileImageSize: Dimensions.get("window").width < Dimensions.get("window").height ? (Dimensions.get("window").width - 20) * 0.75 : (Dimensions.get("window").height - 20) * 0.7,
        }, () => {
            this.setState({
                coverImageHeight: this.state.profileImageSize / 2 + 40,
                PARALLAX_HEADER_HEIGHT: this.state.profileImageSize + 46 + 60
            }) 
        })
        Dimensions.addEventListener("change", () => {
            if(Dimensions.get("window").width < Dimensions.get("window").height) {
                this.setState({
                    is_portrait: true,
                    screen_width: Dimensions.get("window").width,
                    profileImageSize: (Dimensions.get("window").width - 20) * 0.75,
                }, () => {
                    this.setState({
                        coverImageHeight: this.state.profileImageSize / 2 + 40,
                        PARALLAX_HEADER_HEIGHT: this.state.profileImageSize + 46 + 60
                    }) 
                })
            } else {
                this.setState({
                    is_portrait: false,
                    screen_width: Dimensions.get("window").width - (getStatusBarHeight() + getBottomSpace()),
                    profileImageSize: (Dimensions.get("window").height - 20) * 0.7,
                }, () => {
                    this.setState({
                        coverImageHeight: this.state.profileImageSize / 2 + 40,
                        PARALLAX_HEADER_HEIGHT: this.state.profileImageSize + 46 + 60
                    }) 
                })
            }
        })
    }

    componentWillUnmount() {
        EventRegister.removeEventListener(this.listener)
    }

    /**
     * get user token and user id from AsyncStorage
     *
     */
    getData = async () => {
        try {
            var userId = await AsyncStorage.getItem(Constants.KEY_USER_ID);
            var userToken = await AsyncStorage.getItem(Constants.KEY_USER_TOKEN);
            var userSlug = await AsyncStorage.getItem(Constants.KEY_USER_SLUG);
            var userFirstName = await AsyncStorage.getItem(Constants.KEY_USER_FIRST_NAME);
            var userLastName = await AsyncStorage.getItem(Constants.KEY_USER_LAST_NAME);
            var is_verified = await AsyncStorage.getItem(Constants.KEY_IS_VERIFIED);
            var searchText = this.props.route.params.searchText;
            
            this.setState({
                loading: true,
                userId: userId,
                userToken: userToken,
                userSlug: userSlug,
                userFirstName: userFirstName,
                userLastName: userLastName,
                is_verified: is_verified
            }, () => {
                if(this.props.route.params.senderPage === "viewalbumrequest")
                {
                    this.props.navigation.navigate("AddAlbum", {
                                        userId: this.state.userId,
                                        userToken: this.state.userToken,
                                        getDataAgain: this.getDataAgain,
                                        isPrivate: 0,
                                        move2Album: true,
                                        albumData: this.props.route.params.senderData
                                    })
                }

            });

        } catch (error) {
            // Error retrieving data
            console.log(TAG, "getData error " + error);
        }
        var profileData = await AsyncStorage.getItem(Constants.KEY_MY_PROFILE);
        var connectionsListData = await AsyncStorage.getItem(Constants.KEY_MY_PROFILE_CONNECTIONS);
        if(profileData != null && profileData != "") {
            this.setState({
                dataMyProfile: JSON.parse(profileData),
                displayProfileDetail: true,
                loading: false
            })
        } else {
            this.setState({
                loading: true,
                displayProfileDetail: false,
            });
        }
        if(connectionsListData != null && connectionsListData != "") {
            this.setState({
                connectionList: JSON.parse(connectionsListData),
                displayConnections: true
            })
        }
        this.callMyProfileDetailAPI();
    };
    

    /**
        * get profile info API again
        */
    getDataAgain = (refresh) => {
        this.callMyProfileDetailAPI();
    }

    /**
     * call get my profile detail API and display content
     */
    callMyProfileDetailAPI = async () => {
        try {
            let uri = Memory().env == "LIVE" ? Global.URL_MY_PROFILE_DETAIL : Global.URL_MY_PROFILE_DETAIL_DEV

            let params = new FormData();
            params.append("token", this.state.userToken);
            params.append("user_id", this.state.userId);
            params.append("format", "json");
            console.log(TAG + " callMyProfileDetailAPI uri " + uri);
            console.log(TAG + " callMyProfileDetailAPI params " + JSON.stringify(params));
            WebService.callServicePost(
                uri,
                params,
                this.handleGetMyprofileDetailResponse
            );
        } catch (error) {
            this.setState({
                loading: false
            });
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    };
    /**
    * handle my profile API response
    */
    handleGetMyprofileDetailResponse = async(response, isError) => {

        // console.log(TAG + " callMyProfileDetailAPI result " + JSON.stringify(response));
        console.log(TAG + " callMyProfileDetailAPI isError sssssss " + isError);
        if (!isError) {
            var result = response;
            if (result != undefined && result != null && result.data != undefined && result.data != null) {
                if (result.data.userProfileInfo.imgpath != undefined && result.data.userProfileInfo.imgpath != null) {
                    let userImagePath = result.data.userProfileInfo.imgpath;
                    console.log(TAG, 'profile image page', userImagePath);
                    AsyncStorage.setItem(Constants.KEY_USER_IMAGE_URL, userImagePath);
                    this.setState({ userImagePath: userImagePath});
                }
                if (result.data.userProfileInfo.filename != undefined && result.data.userProfileInfo.filename != null) {
                    let userImageName = result.data.userProfileInfo.filename;
                    AsyncStorage.setItem(Constants.KEY_USER_IMAGE_NAME, userImageName);
                    this.setState({ userImageName: userImageName });
                }
                this.setState({ dataMyProfile: result.data });
                console.log(TAG, "callMyProfileDetailAPI after response before asyncstorage");
                await AsyncStorage.setItem(Constants.KEY_MY_PROFILE, JSON.stringify(result.data))
                this.callGetConnectionList()
            } else {
                this.setState({
                    loading: false
                }); 
            }
        } else {
            if (response != undefined && response != null && response.length > 0) {
                Alert.alert(response.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
            this.setState({
                loading: false
            });
        }
    };
    /**
        * call get connection lsit API
        */
    callGetConnectionList = async () => {
        try {
            let uri = Memory().env == "LIVE" ? Global.URL_MY_FAVORITE_LIST  : Global.URL_MY_FAVORITE_LIST_DEV;
            let params = new FormData();
            params.append("token", this.state.userToken);
            params.append("user_id", this.state.userId);
            params.append("format", "json");
            params.append("type", 1);
            params.append("page", 0);
            params.append("favorite_user_id", this.state.userId)
            console.log(TAG + " callGetFavoriteList uri " + uri);
            console.log(TAG + " callGetFavoriteList params " + JSON.stringify(params));
            WebService.callServicePost( uri, params, this.handleGetConnectionListResponse);
        } catch (error) {
            this.setState({
                loading: false,
                displayProfileDetail: true
            });
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    }
    /**
        * handle get connection list API response
        */
    handleGetConnectionListResponse = (response, isError) => {
        // console.log(TAG + " callGetFavoriteList Response " + JSON.stringify(response));
        console.log(TAG + " callGetFavoriteList isError " + isError);
        if (!isError) {
            try {
                var result = response;
                if (typeof result != "undefined" && result != undefined && result != null) {
                    if (typeof result.data != "undefined" && result.data != undefined && result.data != null) {
                        if (result.data.favorite && result.data.favorite.length > 0) {
                            this.setState({
                                connectionList: result.data.favorite,
                                displayProfileDetail: true,
                                displayConnections: true
                            });
                            AsyncStorage.setItem(Constants.KEY_MY_PROFILE_CONNECTIONS, JSON.stringify(result.data.favorite))
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
        this.setState({
            loading: false,
            displayProfileDetail: true
        });
    };

    

    showStickeyHeader=(bool)=>{
        {bool!==this.state.visibleHeaderBool&&this.setState({visibleHeaderBool:bool})}
    }

    callInviteNoneMemberAPI = async () => {
        var rowInvitation = [];
        for (let index = 0; index < this.state.rowInvitation.length; index++) {
            if ( (!ValidationUtils.isEmptyOrNull(this.state.rowInvitation[index].first_name.trim()) || !ValidationUtils.isEmptyOrNull(this.state.rowInvitation[index].last_name.trim())) && (!ValidationUtils.isEmptyOrNull(this.state.rowInvitation[index].phoneNumber.trim()) || ValidationUtils.isEmailValid(this.state.rowInvitation[index].email.trim())) ) {
                rowInvitation.push(this.state.rowInvitation[index]);
            }
        }
        if (rowInvitation.length == 0) {
            Alert.alert(Constants.WARNING_ALERT_TITLE, Constants.NONINVITE_EMPTY);
            return;
        }

        try {
            this.setState({ loading: true });
            let uri = Memory().env == "LIVE" ? Global.URL_INVITEE_NON_MEMBER : Global.URL_INVITEE_NON_MEMBER_DEV;
            let params = new FormData();
            params.append("token", this.state.userToken);
            params.append("user_id", this.state.userId);
            params.append("format", "json");
            let aryEmail = [];
            let aryName = [];
            let aryPhone = [];
            let aryMemberType = [];
            let aryGender = [];
            for (let index = 0; index < rowInvitation.length; index++) {
                const element = rowInvitation[index];
                aryEmail.push(element.email);
                aryName.push(element.first_name + " " + element.last_name);
                aryPhone.push(element.callingCode + element.phoneNumber);
                aryMemberType.push(this.state.user_role[element.selected_user_role_index].type);
                if(element.selected_gender_index == 0) {
                    aryGender.push("1");
                } if(element.selected_gender_index == 1) {
                    aryGender.push("2");
                }
            }
            params.append("pemail", JSON.stringify(aryEmail));
            params.append("pname", JSON.stringify(aryName));
            params.append("pphone", JSON.stringify(aryPhone));
            params.append("pmembertype", JSON.stringify(aryMemberType));
            params.append("pgender", JSON.stringify(aryGender));

            console.log(TAG + " callInviteNoneMemberAPI uri " + uri);
            console.log(TAG + " callInviteNoneMemberAPI params " + JSON.stringify(params));
            WebService.callServicePost(uri, params, this.handleInviteNoneMember);
        } catch (error) {
            console.log(TAG + " callInviteNoneMemberAPI error " + error);
            this.setState({
                loading: false
            });
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    };

    /**
* handle add member ingroup API response
*/
    handleInviteNoneMember = (response, isError) => {
        console.log(TAG + " callInviteNoneMemberAPI Response " + JSON.stringify(response));
        console.log(TAG + " callInviteNoneMemberAPI isError " + isError);

        if (!isError) {
            var result = response;
            this.setState({
                showInvitationPopUp: false, 
                rowInvitation: [{first_name: '', last_name: '', email: '', phoneNumber: '', selected_user_role_index: 0, selected_gender_index: 0}]
            })
            if(result.status == 1) {
                Alert.alert(Constants.SENT_INVITE_SUCCESS, "");
            } else {
                Alert.alert(result.error_msg[0]);
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

    renderBannerView = () => {
        return (
            <BannerView
                screenProps = {this.props.navigation}
            />
        )
    }

    render() {
        return (
            <Fragment>
            <SafeAreaView style={{flex:0,backgroundColor:Colors.black}}/>
            <SafeAreaView style={{flex:1,backgroundColor:Colors.black}}>
                {this.renderHeaderView()}
                {this.renderBannerView()}
                {this.renderPopupView()}
                {this.state.displayProfileDetail &&
                <ParallaxScrollView
                    fadeOutForeground={true}
                    fadeOutBackground={true}
                    onChangeHeaderVisibility={bool=>{
                        this.showStickeyHeader(bool);
                    }}
                    backgroundColor= {Colors.black}
                    renderStickyHeader={() => (
                        <View key="sticky-header" style={[styles.stickySection, { justifyContent: "center", alignItems: "center", height: STICKY_HEADER_HEIGHT, backgroundColor:'black' }]}>
                            {this.renderDraggableHeaderView()}
                        </View>
                    )}
                    ref={(view) => this._scrollView = view}
                    style={{ flex: 1, borderRadius:15, paddingHorizontal: card_padding, overflow:'hidden'}}
                    contentContainerStyle={{backgroundColor:Colors.black, }}
                    onScroll={event => {
                        
                    }}
                    stickyHeaderHeight={STICKY_HEADER_HEIGHT}
                    parallaxHeaderHeight={this.state.PARALLAX_HEADER_HEIGHT}
                    renderBackground={() => (
                        <View key="background" >
                            <View style = {{width: '100%', paddingHorizontal: card_padding, paddingTop: card_padding - 5}}>
                                {this.renderCoverImageView()}
                            </View>
                            <View style = {{width: this.state.is_portrait ? this.state.screen_width : this.state.screen_width / 2, aspectRatio: 1, position: 'absolute', top: 0, right: 0, zIndex: 10, elevation: 10}}>
                                {getRibbonImage(this.state.dataMyProfile.userProfileInfo)}
                            </View>
                        </View>
                    )}
                    renderForeground={() => (
                        <View key="parallax-header" style={{flex:1}}>
                            {this.renderFullName()}
                        </View>
                    )}

                >
                    <View style={{flex: 1, alignItems:'center', backgroundColor:Colors.black}}>
                        {this.renderUserInfo()}
                        {this.renderActionButtons()}
                    </View>
                    <View style={{backgroundColor:Colors.black, marginTop:20}}>
                        {this.state.displayConnections ? this.renderMyConnections() : null}
                        {this.renderMyInfo()}
                        {this.renderUserGallery()}
                        {this.renderSuccessTimeLineView()}
                        {this.renderTravelPlansView()}
                    </View>
                    <View style={{width:'100%', backgroundColor:Colors.transparent, height:50}}/>

                </ParallaxScrollView>}

                {this.state.showInvitationPopUp && this.renderInvitationPopUp()}
                {this.state.showPhoneEmailSelectPopUp && this.renderPhoneEmailSelectPopUp()}
                {this.state.loading == true && <ProgressIndicator />}
                </SafeAreaView>
            </Fragment>
        );
    }

    hidePopupView = () => {
        this.setState({
            showModel: false
        })
    }
    
    logoutUser = async () => {
        this.hidePopupView()
        try {
            await AsyncStorage.setItem(Constants.KEY_USER_ID, "");
            await AsyncStorage.setItem(Constants.KEY_USER_TOKEN, "");
            
            this.props.navigation.navigate("SignInScreen", {isGettingData: false});
        } catch (error) {
            console.log(TAG + " logoutUser error " + error);
        }
    }

    renderPopupView = () => {
        return (
            <CustomPopupView
				ref = "popupRef"
                showModel={this.state.showModel}
                openMyAccountScreen={(show_myaccount, myaccount_initial_tab) => {this.props.navigation.navigate('Dashboard', {selected_screen: "myaccount", myaccount_initial_tab: myaccount_initial_tab})}}
                logoutUser={this.logoutUser}
                closeDialog={() => { this.setState({ showModel: false }) }}
                prop_navigation = {this.props.navigation}
            >
            </CustomPopupView>
        );
    }

    /**
        * display top header
        */
    renderHeaderView = () => {
        let imageUrl = this.state.userImagePath + Constants.THUMB_FOLDER + this.state.userImageName;
        return (
            <View style={stylesGlobal.headerView}>
                <TouchableOpacity style={stylesGlobal.header_backbuttonview_style} onPress={() => {
                        EventRegister.emit(Constants.EVENT_PROFILE_IMAGE_UPDATED);
                        if(this.props.route.params.refreshProfileImage) {
                            this.props.route.params.refreshProfileImage();
                        }
                        this.props.navigation.goBack();
                    }}
                >
                    <Image style = {stylesGlobal.header_backbuttonicon_style} source={require("../icons/icon_back.png")}/>
                </TouchableOpacity>
                <TouchableOpacity style={stylesGlobal.header_logoview_style} onPress = {() => this.props.navigation.navigate('Dashboard', {logoclick: true})}>
                    <Image
                        style={stylesGlobal.header_logo_style}
                        source={require("../icons/logo_new.png")}
                    />
                </TouchableOpacity>
                <View style={stylesGlobal.header_searchview_style}>
                    <TextInput
                        ref = "searchTextInput"
                        autoCorrect = {false}
                        underlineColorAndroid="transparent"
                        returnKeyType={"search"}
                        style={[stylesGlobal.header_searchtextview_style, stylesGlobal.font]}
                        onChangeText={searchText => this.setState({ searchText })}
                        value={this.state.searchText}
                        defaultValue=""
                        multiline={false}
                        autoCapitalize='sentences'
                        placeholder="Search members..."
                        onSubmitEditing={this.handleEditComplete}
                        keyboardType='ascii-capable'
                    />
                    <TouchableOpacity style={stylesGlobal.header_searchiconview_style} onPress = {() => {
                        if(this.state.searchText == "") {
                            this.refs.searchTextInput.focus();
                        } else {
                            Keyboard.dismiss();
                            this.setState({
                                searchText: ""
                            })
                        }}}
                    >
                    {
                        this.state.searchText != "" &&
                        <Image
                            style = {stylesGlobal.header_searchicon_style}
                            source={require("../icons/connection-delete.png")}
                        />
                    }
                    {
                        this.state.searchText == "" &&
                        <Image
                            style = {stylesGlobal.header_searchicon_style}
                            source={require("../icons/dashboard_search.png")}
                        />
                    }
                    </TouchableOpacity>
                </View>
                <TouchableOpacity style={stylesGlobal.header_avatarview_style} onPress={() => this.setState({ showModel: true })}>
                    <View style={stylesGlobal.header_avatarsubview_style}>
                        <ImageCompressor style = {stylesGlobal.header_avatar_style} uri={imageUrl}/>
                    </View>
                </TouchableOpacity>
            </View >
        );
    };
    /**
        * search button click
        */
    handleEditComplete = () => {
        searchText = this.state.searchText.trim();
        this.setState({
            searchText: searchText,
        });
        if (searchText.length > 0) {
            this.props.navigation.navigate('Dashboard', {selected_screen: "members", search_text: searchText});
        }
    };

    /**
    * display user Header image
    */
    renderDraggableHeaderView = () => {
        if (!this.state.dataMyProfile) {
            return null;
        }
        var userProfileInfo = this.state.dataMyProfile.userProfileInfo;

        var profileImageUrl = userProfileInfo.imgpath + Constants.THUMB_FOLDER + userProfileInfo.filename;
        return (
            <View style={[stylesGlobal.centerLogo, { flexDirection: 'row', height: STICKY_HEADER_HEIGHT, marginTop: 0 }]}>

               <Animatable.View
                    animation="slideInUp" iterationCount={1} direction="alternate" duration={1000}
                    style={[stylesGlobal.centerLogo, { flexDirection: 'row', height: STICKY_HEADER_HEIGHT, marginTop: 0, alignItems:"center"}]}
                >
                    <View style={{
                        backgroundColor: Colors.gray,
                        width: smallProfileImageSize,
                        height: smallProfileImageSize,
                        marginRight: 10,
                        borderRadius: smallProfileImageSize / 2
                    }}>
                        <Image
                            style={styles.smallProfileImageContainer}
                            source={{ uri: profileImageUrl }}
                            defaultSource={require("../icons/icon_profile_default.png")}
                        />
                        {/* <View style={styles.smallRoundCornerView} /> */}
                    </View>
                    <Text style={[{fontSize: 18, color: Colors.white}, stylesGlobal.font_bold]}>
                        {this.state.dataMyProfile.userProfileInfo.first_name
                        + " " + this.state.dataMyProfile.userProfileInfo.last_name}
                    </Text>
                </Animatable.View>
            </View>
        );
    }

    /**
    * display user cover and profile image
    */
    renderCoverImageView = () => {
        if (!this.state.dataMyProfile) {
            return null;
        }
        var userProfileInfo = this.state.dataMyProfile.userProfileInfo;
        var fullName = userProfileInfo.first_name + " " + userProfileInfo.last_name;
        var bannerImageUrl = userProfileInfo.profile_background_url + userProfileInfo.profile_background;
        // let subText = getProfileSubStr(userProfileInfo)
        return (
            <View style={{
                    borderTopLeftRadius: 15,
                    borderTopEndRadius: 15,
                    width: '100%',
                    height: this.state.PARALLAX_HEADER_HEIGHT - 6,
                    overflow: 'hidden',
                    alignItems: 'center',
                    backgroundColor: Colors.white,
                }}
            >
                <ImageCompressor
                    uri={bannerImageUrl}
                    style={{
                        width: '100%',
                        height: this.state.coverImageHeight,
                        backgroundColor: Colors.black,
                    }}
                />
                <View style={{position: 'absolute', bottom: 6, width: '100%', alignItems: 'center'}}>
                    <Text style={[styles.fullname, stylesGlobal.font_semibold]}>{fullName}</Text>
                </View>
            </View>

        );
    };

    /**
         * display user name info
         */
    renderFullName = () => {

        if (!this.state.dataMyProfile) {
            return null;
        }

        var userProfileInfo = this.state.dataMyProfile.userProfileInfo;
        // console.log("profileThumbNailImageUrl",userProfileInfo);
        var profileImageUrl = userProfileInfo.imgpath + userProfileInfo.filename;
        var bannerImageUrl = userProfileInfo.profile_background_url + userProfileInfo.profile_background;
        var profileThumbNailImageUrl = userProfileInfo.imgpath + Constants.THUMB_FOLDER + userProfileInfo.filename;
        return (
            <View style={{flex:1, alignItems:'center',}}>
                <TouchableOpacity style={{flexDirection: 'row', height: this.state.coverImageHeight, width: '100%', position: 'absolute', backgroundColor: Colors.transparent}}
                    onPress={() => {
                        if (!this.state.dataMyProfile) {
                            return null;
                        }
                        this.props.navigation.navigate("ProfileFullImage", {
                            getDataAgain: this.getDataAgain,
                            type: "cover_image",
                            index: 0,
                            tempGalleryUrls: [{
                                id: bannerImageUrl,
                                image: { uri: bannerImageUrl }
                            }]
                        });
                    }}
                >
                </TouchableOpacity>
                <TouchableOpacity
                    style={{marginTop: 34}}
                    onPress={() => {
                        this.props.navigation.navigate("ProfileFullImage", {
                            getDataAgain: this.getDataAgain,
                            type: "profile_image",
                            index: 0,
                            tempGalleryUrls: [{
                                id: profileImageUrl,
                                image: { uri: profileImageUrl },
                                thumb: { uri: profileThumbNailImageUrl}
                            }]
                        })
                    }}
                >
                    <ImageCompressor
                        uri={profileThumbNailImageUrl}
                        style={{backgroundColor: Colors.gray,
                            overflow: 'hidden',
                            borderRadius: this.state.profileImageSize / 2,
                            width: this.state.profileImageSize,
                            height: this.state.profileImageSize }}
                    />
                </TouchableOpacity>
            </View>
        );
    };

    /**
    * display user info
    */
    renderUserInfo = () => {
        if (!this.state.dataMyProfile) {
            return null;
        }
        var userProfileInfo = this.state.dataMyProfile.userProfileInfo;
        var memberPlanName = userProfileInfo.membership_plan_name;
        var age = userProfileInfo.age;
        var heightView = null;
        if (this.state.dataMyProfile.userCustomFields.height != undefined && this.state.dataMyProfile.userCustomFields.height != null) {
            var height = this.state.dataMyProfile.userCustomFields.height;
            heightView = (
                <View style={{flex: 1, flexDirection: "row", justifyContent: "center", alignItems: 'center'}}>
                    <Image style={{ width: 25 }} source={require("../icons/icon_profile_model_height.png")}/>
                    <View style={{ marginLeft: 5 }}>
                        <Text style={[{ color: Colors.black, fontSize: 12 },stylesGlobal.font] }>HEIGHT:</Text>
                        <Text style={[{ color: Colors.black, fontSize: 12 }, stylesGlobal.font]}>{height}</Text>
                    </View>
                </View>
            )
        }

        var goldCoinView = null;
        if (this.state.dataMyProfile.userProfileInfo.gold_coins != undefined && this.state.dataMyProfile.userProfileInfo.gold_coins != null) {
            var goldCoin = this.state.dataMyProfile.userProfileInfo.gold_coins;
            goldCoinView = (
                <TouchableOpacity style={{flex: 1, flexDirection: "row", justifyContent: "center", alignItems: 'center'}}
                    onPress={()=>this.props.navigation.navigate('MyAccountScreen',{  getDataAgain: this.getDataAgain, initial_tab: "buy_goldcoin"})}
                >
                    <Image style={{ height: 50,width:50,resizeMode:'contain' }} source={require("../icons/goldCoin10New.png")}/>
                    <View style={{ marginLeft: 10 }}>
                        <Text style={[{ color: Colors.black, fontSize: 12 }, stylesGlobal.font]}>GOLD COINS:</Text>
                        <Text style={[{ color: Colors.black, fontSize: 12 }, stylesGlobal.font]}>{goldCoin}</Text>
                    </View>
                </TouchableOpacity>
            )
        }

        var bodyView = null
        if (this.state.dataMyProfile.userCustomFields.body != undefined && this.state.dataMyProfile.userCustomFields.body != null) {
            var body = this.state.dataMyProfile.userCustomFields.body;
            bodyView = (
                <View style={{flex: 1, flexDirection: "row", justifyContent: "center", alignItems: 'center'}}>
                    <Image style={{ height: 30 }} source={require("../icons/icon_profile_model_body.png")}/>
                    <View style={{ marginLeft: 10 }}>
                        <Text style={[{ color: Colors.black, fontSize: 12 }, stylesGlobal.font]}>BODY:</Text>
                        <Text style={[{ color: Colors.black, fontSize: 12 }, stylesGlobal.font]}>{body}</Text>
                    </View>
                </View>
            );
        }

        var connectionsView = null;
        if (this.state.dataMyProfile.connections != undefined && this.state.dataMyProfile.connections != null) {
            var connections = this.state.dataMyProfile.connections;
            connectionsView = (
                <View style={{flex: 1, flexDirection: "row", justifyContent: "center", alignItems: 'center'}}>
                    <Image style={{ height: 50, width:50, resizeMode:'contain' }} source={require("../icons/full_favorite_black.png")}/>
                    <View style={{ marginLeft: 10 }}>
                        <Text style={[{ color: Colors.black, fontSize: 12 }, stylesGlobal.font]}>FAVORITES:</Text>
                        <Text style={[{ color: Colors.black, fontSize: 12 }, stylesGlobal.font]}>{connections}</Text>
                    </View>
                </View>
            )
        }

        var netWorthView = null;
        if (this.state.dataMyProfile.userCustomFields.net_worth != undefined && this.state.dataMyProfile.userCustomFields.net_worth != null) {
            var netWorth = this.state.dataMyProfile.userCustomFields.net_worth;
            netWorthView = (
                <View style={{flex: 1, flexDirection: "row", justifyContent: "center", alignItems: 'center'}}>
                    <Image style={{ width: 33, height: 28 }} source={require("../icons/icon_profile_diamond.png")}/>
                    <View style={{ marginLeft: 10 }}>
                        <Text style={[{ color: Colors.black, fontSize: 12 }, stylesGlobal.font]}>NET WORTH:</Text>
                        <Text style={[{ color: Colors.black, fontSize: 12 }, stylesGlobal.font]}>{netWorth}</Text>
                    </View>
                </View>
            )
        }


        let leftView = null;
        let rightView = null;
        if (this.state.dataMyProfile.userProfileInfo.type != undefined && this.state.dataMyProfile.userProfileInfo.type != null) {
            if (this.state.dataMyProfile.userProfileInfo.type.toUpperCase() == "MODEL") {
                leftView = heightView;
                rightView = bodyView;
            } else if (this.state.dataMyProfile.userProfileInfo.type.toUpperCase() == "RICH") {
                leftView = netWorthView;
                rightView = goldCoinView;
            } else if (this.state.dataMyProfile.userProfileInfo.type.toUpperCase() == "CONNECTOR") {
                leftView = goldCoinView;
                rightView = connectionsView;
            } else if (this.state.dataMyProfile.userProfileInfo.type.toUpperCase() == "FAMOUS") {
                leftView = goldCoinView;
            }
        }

        return (
            <View style={{ width: '100%', height: 60, flexDirection: 'row' , backgroundColor:Colors.white}}>
                {leftView != null ? <View style={{ flex: 0.5, width: (this.state.screen_width - card_padding * 2) / 2 }}>{leftView}</View>
                    : null}

                {rightView != null ?
                    <View style={{ flex: 0.5, width: (this.state.screen_width - card_padding * 2) / 2 }}>{rightView}</View>
                    : null}
            </View>
        )
    }

    renderActionButtons = () => {
        if (!this.state.dataMyProfile) {
            return null;
        }

        var data = this.state.dataMyProfile.userProfileInfo;
        var imagePath = null;
        for(i = 0; i < Global.entriesAll.length; i ++) {
            if((this.state.is_verified != "1" || data.member_plan.toString() == "4" || data.member_plan.toString() == "7") && data.gender == "male") {
                if(Global.entriesAll[i].type.toString() == "4") {
                    imagePath = Global.entriesAll[i].avatar;
                    break;
                }
            } else if((this.state.is_verified != "1" || data.member_plan.toString() == "4" || data.member_plan.toString() == "7") && data.gender != "male") {
                if(Global.entriesAll[i].type.toString() == "7") {
                    imagePath = Global.entriesAll[i].avatar;
                    break;
                }
            } else if(this.state.is_verified == "1" && (data.member_plan.toString() == Global.entriesAll[i].type.toString())) {
                imagePath = Global.entriesAll[i].avatar;
                break;
            }
        }

        console.log("profile imagepath = ", imagePath);

        let myAccountButton = (
                <TouchableOpacity style={{width: this.state.is_portrait ? '22%': '10%', alignItems: 'center', marginTop: 10}}
                    onPress={() => {
												this.refs.popupRef.open_account_link();
                    }}
                >
                    <View style = {{width: '100%', aspectRatio: 1}}>
                        <Image style={styles.countImage} source={{uri: imagePath}}/>
                        {/* <Image style={styles.countImage} source={imagePath}/> */}
                    </View>
                    <Text style={[styles.actionButtonText, stylesGlobal.font]}>{"MY\nACCOUNT"}</Text>
                </TouchableOpacity>
        );


        let myGiftsButton = (
                <TouchableOpacity style={{width: this.state.is_portrait ? '22%': '10%', alignItems: 'center', marginTop: 10}}
                    onPress={() => {
                        if(this.state.is_verified != 1) {
                            Alert.alert(Constants.NOT_APPROVED_MESSAGE, "");
                            return;
                        }
                        this.props.navigation.navigate("MyListsNavigation", {gender: this.state.dataMyProfile.userProfileInfo.gender, list_show: "mygift"});
                    }}>
                    <View style = {{width: '100%', aspectRatio: 1}}>
                        <Image style={styles.countImage} source={require("../icons/send_gift.png")}/>
                    </View>
                    <Text style={[styles.actionButtonText, stylesGlobal.font]}>{"MY\nGIFTS"}</Text>
                </TouchableOpacity>
        )

        let myWishListButton = (
                <TouchableOpacity style={{width: this.state.is_portrait ? '22%': '10%', alignItems: 'center', marginTop: 10}}
                    onPress={() => {
                        if(this.state.is_verified != 1) {
                            Alert.alert(Constants.NOT_APPROVED_MESSAGE, "");
                            return;
                        }
                        this.props.navigation.navigate("MyWishListScreen");
                    }}>
                    <View style = {{width: '100%', aspectRatio: 1}}>
                        <Image style={styles.countImage} source={require('../icons/send_wishlist.png')}/>
                    </View>
                    <Text style={[styles.actionButtonText, stylesGlobal.font]}>{"MY\nWISH LIST"}</Text>
                </TouchableOpacity>
        )

        let referFriendsButton = (
                <TouchableOpacity style={{width: this.state.is_portrait ? '22%': '10%', alignItems: 'center', marginTop: 10}}
                    onPress={() => this.setState({showInvitationPopUp: true})}>
                    <View style = {{width: '100%', aspectRatio: 1}}>
                        <Image style={styles.countImage} source={require("../icons/ReferFriends.png")}/>
                    </View>
                    <Text style={[styles.actionButtonText, stylesGlobal.font]}>{"REFER\nFRIENDS"}</Text>
                </TouchableOpacity>
        )


        let myTimeLineButton = (
                <TouchableOpacity style={{width: this.state.is_portrait ? '22%': '10%', alignItems: 'center', marginTop: 10}}
                    onPress={() => {
                        if(this.state.is_verified != 1) {
                            Alert.alert(Constants.NOT_APPROVED_MESSAGE, "");
                            return;
                        }
                        this.onTimeLinePress();
                    }}>
                    <View style = {{width: '100%', aspectRatio: 1}}>
                        <Image style={styles.countImage} source={require("../icons/send_timeline.png")}/>
                    </View>
                    <Text style={[styles.actionButtonText, stylesGlobal.font]}>{"VIEW\nTIMELINE"}</Text>
                </TouchableOpacity>
        );

        let buyGoldCoinButton = (
                <TouchableOpacity style={{width: this.state.is_portrait ? '22%': '10%', alignItems: 'center', marginTop: 10}}
                    onPress={() => {
                        // Alert.alert("To Buy or Sell Gold, please use the Website: the007percent.com", "",
                        // [
                        //     {text: 'OK', onPress: () => {
                        //         let link = "https://the007percent.com/my-account";
                        //         Linking.canOpenURL(link).then(supported => {
                        //             if (supported) {
                        //                 Linking.openURL(link);
                        //             } else {
                        //                 // alert("asdfasdfas")
                        //             }
                        //         });
                        //     }},
                        //     {text: 'Cancel', onPress: () => null},
                        // ],
                        //     {cancelable: false}
                        // )
                        if(this.state.is_verified != 1) {
                            Alert.alert(Constants.NOT_APPROVED_MESSAGE, "");
                            return;
                        }
                        this.props.navigation.navigate('MyAccountScreen', {getDataAgain: this.getDataAgain, initial_tab: "buy_goldcoin"});
                    }}>
                    <View style = {{width: '100%', aspectRatio: 1}}>
                        <Image style={styles.countImage} source={require("../icons/send_goldcoins.png")}/>
                    </View>
                    <Text style={[styles.actionButtonText, stylesGlobal.font]}>{"BUY\nGOLD COINS"}</Text>
                </TouchableOpacity>
        )

        let emptyButton = (
            <View style={{width: this.state.is_portrait ? '22%': '10%', alignItems: 'center', marginTop: 10}}>
                
            </View>
        );

        let editProfileButton = (
            <TouchableOpacity style={{width: this.state.is_portrait ? '22%': '10%', alignItems: 'center', marginTop: 10}}
                onPress={() => this.props.navigation.navigate('EditProfile', {
                    profileDetail: this.state.dataMyProfile,
                    refreshAction: this.getDataAgain
                })}
            >
                <View style = {{width: '100%', aspectRatio: 1}}>
                    <Image style={styles.countImage} source={require("../icons/edit_profile.png")}/>
                </View>
                <Text style={[styles.actionButtonText, stylesGlobal.font]}>{"EDIT\nPROFILE"}</Text>
            </TouchableOpacity>
    );

        return (
            <View style={{width: '100%', backgroundColor:Colors.white, borderBottomLeftRadius:15, borderBottomRightRadius:15, paddingBottom:15, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-around'}}>
                {myAccountButton}
                {myGiftsButton}
                {myWishListButton}
                {referFriendsButton}
                {myTimeLineButton}
                {buyGoldCoinButton}
                {editProfileButton}
                {this.state.is_portrait && emptyButton}
            </View>
        )
    }

    selectContact = async(invite_index) => {
        await selectContact()
        .then(async(selection) => {
            if (!selection) {
                this.setState({
                    selected_invite_index: -1
                })
                return null;
            }

            this.setState({
                selected_invite_index: invite_index
            })
            
            if(selection.phones.length > 0) {
                for(i = 0; i < selection.phones.length; i ++) {
                    if(i == 0) {
                        selection.phones[i].selected = true;
                    } else {
                        selection.phones[i].selected = false;
                    }
                }
            }
            if(selection.emails.length > 0) {
                for(i = 0; i < selection.emails.length; i ++) {
                    if(i == 0) {
                        selection.emails[i].selected = true;
                    } else {
                        selection.emails[i].selected = false;
                    }
                }
            }
            if(selection.phones.length > 1 || selection.emails.length > 1) {
                selection.first_name = "";
                selection.last_name = "";
                var name_splite = [];
                if(selection.name != null && selection.name != "") {
                    name_splite = selection.name.split(" ");
                    selection.first_name = name_splite[0];
                    if(name_splite.length > 1) {
                        for(i = 1; i < name_splite.length; i ++) {
                            selection.last_name += name_splite[i] + " ";
                        }
                        selection.last_name.trim();
                    }
                }
                this.setState({
                    selected_contact: selection,
                    showPhoneEmailSelectPopUp: true,
                })
            } else {
                var rowInvitation = this.state.rowInvitation;
                var contact_name = "";
                var contact_email = "";
                var contact_phoneNumber = "";
                if(selection.name) {
                    contact_name = selection.name;
                }
                if(selection.phones.length > 0) {
                    contact_phoneNumber = selection.phones[0].number;
                } 
                if(selection.emails.length > 0) {
                    contact_email = selection.emails[0].address;
                } 
                
                var name_splite = [];
                rowInvitation[invite_index].first_name = "";
                rowInvitation[invite_index].last_name = "";
                if(contact_name != null && contact_name != "") {
                    name_splite = contact_name.split(" ");
                    rowInvitation[invite_index].first_name = name_splite[0];
                    if(name_splite.length > 1) {
                        for(i = 1; i < name_splite.length; i ++) {
                            rowInvitation[invite_index].last_name += name_splite[i] + " ";
                        }
                        rowInvitation[invite_index].last_name.trim();
                    }
                }
                rowInvitation[invite_index].email = contact_email;
                rowInvitation[invite_index].phoneNumber = contact_phoneNumber;
                this.setState({
                    rowInvitation: rowInvitation
                })
            }
            // this.renderPhoneEmailSelectPopUp();
        }); 
    }

    renderInvitationPopUp = () => {
        const {rowInvitation} = this.state;
        const n = rowInvitation.length;
        return (
            <View style={stylesGlobal.invite_popup_container_view}>
                <View onStartShouldSetResponder={() => this.setState({showInvitationPopUp:false, rowInvitation: [{first_name: '', last_name: '', email: '', phoneNumber: '', selected_user_role_index: 0, selected_gender_index: 0}]})}
                    style={{position:'absolute', width:width, height:height, top:0, left:0, backgroundColor:Colors.black, opacity:0.3}}/>
                <View style={stylesGlobal.invite_popup_main_view}>
                    <View style = {{width: '100%', alignItems: 'flex-end', marginTop: 20, paddingHorizontal: 5}}>
                        <TouchableOpacity style = {{width: 15, height: 15,}} onPress = {() => this.setState({showInvitationPopUp: false})}>
                            <Image style = {{width: '100%', height: '100%', tintColor: Colors.gold}} source={require('../icons/connection-delete.png')}/>
                        </TouchableOpacity>
                    </View>
                    <KeyboardAwareScrollView keyboardShouldPersistTaps = "handled" style = {{width: '100%'}} contentContainerStyle={{alignItems:'center',}} extraScrollHeight={n * 95 + 150 - height + 180}>
                        <Image style={stylesGlobal.invite_popup_crown_image} source={require('../icons/crown.png')}/>
                        <Text style={[stylesGlobal.invite_view_header_text, stylesGlobal.font]}>{Constants.INVITE_FRIEND_VIEW_HEADER}</Text>
                        <TouchableOpacity style = {[stylesGlobal.invite_view_submit_button, stylesGlobal.shadow_style]} onPress={() => this.selectContact(0)}>
                            <Text style = {[stylesGlobal.invite_view_submit_button_text, stylesGlobal.font]}>{"Import From Contacts"}</Text>
                        </TouchableOpacity>
                        <View style={{width:'100%', height:1, backgroundColor:Colors.gray, marginTop:20}} />

                        <View style={{width: '100%', alignItems:'center', justifyContent: 'center'}}>
                                <View style={stylesGlobal.invite_row_view}>
                                    <View style = {{width: '47%', }}>
                                        <Text style = {[{fontSize: 12, color: Colors.black}, stylesGlobal.font]}>{"First Name"}</Text>
                                        <View style = {stylesGlobal.invite_view_input_view}>
                                            <TextInput
                                                placeholder='First Name'
                                                value={rowInvitation[0].first_name}
                                                style={[stylesGlobal.invite_view_input_text, stylesGlobal.font]}
                                                onChangeText={text => {
                                                    rowInvitation[0].first_name = text;
                                                    this.setState({rowInvitation})
                                                }}
                                            />
                                        </View>
                                    </View>
                                    <View style = {{width: '47%', }}>
                                        <Text style = {[{fontSize: 12, color: Colors.black}, stylesGlobal.font]}>{"Last Name"}</Text>
                                        <View style = {stylesGlobal.invite_view_input_view}>
                                            <TextInput
                                                placeholder='Last Name'
                                                value={rowInvitation[0].last_name}
                                                style={[stylesGlobal.invite_view_input_text, stylesGlobal.font]}
                                                onChangeText={text => {
                                                    rowInvitation[0].last_name = text;
                                                    this.setState({rowInvitation})
                                                }}
                                            />
                                        </View>
                                    </View>
                                </View>
                                <View style={stylesGlobal.invite_row_view}>
                                    <View style = {{width: '47%' }} onLayout={(event) => this.setState({invite_row_half_view_width: event.nativeEvent.layout.width})}>
                                        <Text style = {[{fontSize: 12, color: Colors.black}, stylesGlobal.font]}>{"Gender"}</Text>
                                        <ModalDropdown 
                                            style = {stylesGlobal.invite_view_gender_view}
                                            dropdownStyle = {{width: this.state.invite_row_half_view_width, height: 30 * this.state.user_gender.length}}
                                            defaultIndex = {0}
                                            options = {this.state.user_gender}
                                            onSelect = {(gender_index) => {
                                                rowInvitation[0].selected_gender_index = gender_index;
                                                this.setState({rowInvitation})
                                            }}
                                            renderButton = {() => {
                                                return (
                                                    <View style = {[{width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', flexDirection: 'row',}]}>
                                                        <Text style = {[{fontSize: 12, color: Colors.black}, stylesGlobal.font]}>{this.state.user_gender[this.state.rowInvitation[0].selected_gender_index].type}</Text>
                                                        <View style = {{height: '100%', aspectRatio: 1, justifyContent: 'center', alignItems: 'center', marginStart: 10}}>
                                                            <Image style = {{width: '60%', height: '60%', resizeMode: 'contain'}} source = {this.state.user_gender[this.state.rowInvitation[0].selected_gender_index].image}></Image>
                                                        </View>
                                                    </View>
                                                )
                                            }}
                                            renderRow = {(gender_type_item, gender_index, highlighted) => {
                                                return (
                                                    <View style = {[{width: '100%', height: 30, alignItems: 'center', flexDirection: 'row', marginHorizontal: 10}]}>
                                                        <View style = {{height: '100%', aspectRatio: 1, marginRight: 10, justifyContent: 'center', alignItems: 'center'}}>
                                                            <Image style = {{width: '60%', height: '60%', resizeMode: 'contain'}} source = {gender_type_item.image}></Image>
                                                        </View>
                                                        <Text style = {[{fontSize: 12, color: Colors.black}, stylesGlobal.font]}>{gender_type_item.type}</Text>
                                                    </View>
                                                )
                                            }}
                                        />
                                    </View>
                                    <View style = {{width: '47%',}}>
                                        <Text style = {[{fontSize: 12, color: Colors.black}, stylesGlobal.font]}>{"Member Type"}</Text>
                                        <ModalDropdown 
                                            style = {stylesGlobal.invite_view_gender_view}
                                            dropdownStyle = {{width: this.state.invite_row_half_view_width, height: 30 * this.state.user_role.length}}
                                            defaultIndex = {0}
                                            options = {this.state.user_role}
                                            onSelect = {(member_type_index) => {
                                                rowInvitation[0].selected_user_role_index = member_type_index;
                                                this.setState({rowInvitation})
                                            }}
                                            renderButton = {() => {
                                                return (
                                                    <View style = {[{width: '100%', height: '100%', resizeMode: 'cover', alignItems: 'center', flexDirection: 'row',}]}>
                                                        <View style = {{flex: 1, height: '100%', alignItems: 'flex-end', justifyContent: 'center'}}>
                                                            <Text style = {[{fontSize: 12, color: Colors.black}, stylesGlobal.font]}>{this.state.user_role[this.state.rowInvitation[0].selected_user_role_index].name}</Text>
                                                        </View>
                                                        <View style = {{width: '50%', paddingStart: 10}}>
                                                            <View style = {{height: '100%', aspectRatio: 1, marginRight: 5}}>
                                                                <Image style = {{width: '100%', height: '100%'}} 
                                                                    source = {this.state.user_role[this.state.rowInvitation[0].selected_user_role_index].badge}></Image>
                                                            </View>
                                                        </View>
                                                    </View>
                                                )
                                            }}
                                            renderRow = {(member_type_item, member_type_index, highlighted) => {
                                                // return (
                                                //     <View style = {[{width: '100%', height: 30, resizeMode: 'cover', alignItems: 'center', flexDirection: 'row', marginHorizontal: 10}]}>
                                                //         <View style = {{height: '100%', aspectRatio: 1, marginRight: 10}}>
                                                //             <Image style = {{width: '100%', height: '100%'}} source = {{uri: member_type_item.badge}}></Image>
                                                //         </View>
                                                //         <Text style = {[{fontSize: 12, color: Colors.black}, stylesGlobal.font]}>{member_type_item.name}</Text>
                                                //     </View>
                                                // )
                                                return (
                                                    <View style={[{ width: '100%', height: 30, resizeMode: 'cover', alignItems: 'center', flexDirection: 'row', paddingHorizontal: 2, paddingVertical: 2, justifyContent: 'center'}]}>
                                                        <Image style={{ width: '100%', height: '100%', position: 'absolute', borderRadius: 5 }} source={{ uri: member_type_item.background }}></Image>
                                                        <View style={{width: '100%', height: '100%', flexDirection: 'row', alignItems: 'center'}}>
                                                            <View style={{ height: '100%', aspectRatio: 1, marginRight: 10 }}>
                                                                <Image style={{ width: '100%', height: '100%' }} source={{ uri: member_type_item.badge }}></Image>
                                                            </View>
                                                            <Text style={[{ fontSize: 12, color: Colors.white }, stylesGlobal.font]}>{member_type_item.name}</Text>
                                                        </View>
                                                        
                                                    </View>
                                                )
                                            }}
                                        />
                                    </View>
                                </View>
                                <View style = {[stylesGlobal.invite_row_view, {flexDirection: 'column'}]}>
                                    <Text style = {[{fontSize: 12, color: Colors.black}, stylesGlobal.font]}>{"Email Address"}</Text>
                                    <View style = {stylesGlobal.invite_view_input_view}>
                                        <TextInput
                                            placeholder='Email'
                                            value={rowInvitation[0].email}
                                            style={[stylesGlobal.invite_view_input_text, stylesGlobal.font]}
                                            onChangeText={text => {
                                                rowInvitation[0].email = text;
                                                this.setState({rowInvitation})
                                            }}
                                        />
                                    </View>
                                </View>
                                <Text style = {[{fontSize: 12, color: Colors.black, marginTop: 10}, stylesGlobal.font]}>{"or"}</Text>
                                <View style = {[stylesGlobal.invite_row_view, {flexDirection: 'column', marginTop: 0}]}>
                                    <Text style = {[{fontSize: 12, color: Colors.black}, stylesGlobal.font]}>{"Phone Number"}</Text>
                                    <View style = {stylesGlobal.invite_view_input_view}>
                                        <PhoneInput
                                            ref='phone'
                                            value = {rowInvitation[0].phoneNumber}
                                            onChangePhoneNumber={text => {
                                                rowInvitation[0].phoneNumber = text;
                                                this.setState({rowInvitation})
                                            }}
                                            onSelectCountry={(country)=> {
                                                console.log(country)
                                            }}
                                            style={stylesGlobal.invite_view_input_text}
                                            flagStyle={{
                                                width: 25,
                                                height: 15
                                            }}
                                            textStyle={[stylesGlobal.font, {fontSize: 12}]}
                                        />
                                    </View>
                                </View>
                                {/* <Text style = {[{fontSize: 12, color: Colors.black, marginTop: 10}, stylesGlobal.font]}>{"or"}</Text> */}
                                {/* <View style = {[stylesGlobal.invite_row_view, {flexDirection: 'column', marginTop: 0}]}> */}
                                {/*     <Text style = {[{fontSize: 12, color: Colors.black}, stylesGlobal.font]}>{"Instagram"}</Text> */}
                                {/*     <View style = {stylesGlobal.invite_view_input_view}> */}
                                {/*         <TextInput */}
                                {/*             placeholder='Instagram' */}
                                {/*             // value={rowInvitation[0].email} */}
                                {/*             style={[stylesGlobal.invite_view_input_text, stylesGlobal.font]} */}
                                {/*             onChangeText={text => { */}
                                {/*                 // rowInvitation[0].email = text; */}
                                {/*                 // this.setState({rowInvitation}) */}
                                {/*             }} */}
                                {/*         /> */}
                                {/*     </View> */}
                                {/* </View> */}
                            </View>
                            
                            <TouchableOpacity style={[stylesGlobal.invite_view_submit_button, {marginBottom:20}, stylesGlobal.shadow_style]} 
                                onPress={() => this.callInviteNoneMemberAPI()}
                            >
                                <Text style={[stylesGlobal.invite_view_submit_button_text, stylesGlobal.font]}>{"Invite your friend"}</Text>
                            </TouchableOpacity>
                    </KeyboardAwareScrollView>
                </View>
            </View>
        )
    }

    renderPhoneEmailSelectPopUp = () => {
        return (
            <View style={{ position:'absolute', width: '100%', height: '100%', top:0, left:0, zIndex: 10, justifyContent: 'flex-end', alignItems: 'center' }}>
                <View onStartShouldSetResponder = {() => this.setState({showPhoneEmailSelectPopUp: false})}
                    style={{position:'absolute', width: '100%', height: '100%', top:0, left:0, backgroundColor:Colors.black, opacity:0.3,}}/>
                <View style={{width: '95%', maxHeight: height-100, backgroundColor:Colors.white, alignItems:'center', paddingHorizontal:15, borderRadius:10, justifyContent:'center', marginBottom: 30,}}>
                    <TouchableOpacity style = {{position: 'absolute', top: 20, right: 20, width: 15, height: 15, zIndex: 20}} onPress = {() => this.setState({showPhoneEmailSelectPopUp: false})}>
                        <Image style = {{width: '100%', height: '100%', tintColor: Colors.gold}} source={require('../icons/connection-delete.png')}/>
                    </TouchableOpacity>
                    <Text style={[stylesGlobal.font, {fontSize:15,  textAlign:'center', marginTop: 30}]}>
                        Select Phone Number and Email
                    </Text>
                    <View style={{width: '90%', height:1, backgroundColor:Colors.gray, marginVertical:10}} />
                    <View style = {{width: '100%',}}>
                        <Text style={[stylesGlobal.font, {fontSize: 15, }]}>Name</Text>
                        <View style = {{width: '100%', alignItems: 'flex-end'}}>
                            <View style = {{width: '90%', flexDirection: 'row', alignItems: 'center'}}>
                                <Text style={[stylesGlobal.font, {fontSize: 14,  textAlign:'center', width: 60}]}>name</Text>
                                <Text style={[{ paddingLeft:10, borderRadius:3, borderWidth:1, borderColor:Colors.gray, width:'70%', marginTop:10, paddingVertical:5, fontSize:12}, stylesGlobal.font]}>{this.state.selected_contact.name}</Text>
                                <View style = {{marginLeft: 10, width: 20, height: 20}}>
                                
                                </View>
                            </View>
                        </View>
                    </View>
                    <View style = {{width: '100%', marginTop: 10}}>
                        <Text style={[stylesGlobal.font, {fontSize: 15, }]}>Phone Number</Text>
                    {
                        this.state.selected_contact.phones.map((item, index) =>
                        <TouchableOpacity key = {index} style = {{width: '100%', alignItems: 'flex-end'}} onPress = {() => {
                                var selected_contact = this.state.selected_contact;
                                for(i = 0; i < selected_contact.phones.length; i ++) {
                                    if(i == index) {
                                        selected_contact.phones[i].selected = true;
                                    } else {
                                        selected_contact.phones[i].selected = false;
                                    }
                                }
                                this.setState({
                                    selected_contact: selected_contact
                                })
                            }}
                        >
                            <View style = {{width: '90%', flexDirection: 'row', alignItems: 'center'}}>
                                <Text style={[stylesGlobal.font, {fontSize: 14,  textAlign:'center', width: 60}]}>{item.type}</Text>
                                <PhoneInput
                                    disabled = {true}
                                    value = {item.number}
                                    style={{
                                        flex: 1,
                                        paddingLeft:10,
                                        borderRadius:3,
                                        borderWidth:1,
                                        borderColor:Colors.gray,
                                        marginTop:10,
                                        paddingVertical:5,
                                    }}
                                    flagStyle={{
                                        width:25,
                                        height:15
                                    }}
                                    textStyle={[stylesGlobal.font, {fontSize:12}]}
                                />
                                <View style = {{marginLeft: 10, width: 20, height: 20}}>
                                {
                                    item.selected &&
                                    <Image source={require('../icons/checked.png')} style={{width: '100%', height: '100%', resizeMode: 'contain'}}/>
                                }
                                </View>
                            </View>
                        </TouchableOpacity>
                        )
                    }
                    </View>
                    <View style = {{width: '100%', marginTop: 10}}>
                        <Text style={[stylesGlobal.font, {fontSize: 15, }]}>Email</Text>
                    {
                        this.state.selected_contact.emails.map((item, index) =>
                        <TouchableOpacity key = {index} style = {{width: '100%', alignItems: 'flex-end'}} onPress = {() => {
                                var selected_contact = this.state.selected_contact;
                                for(i = 0; i < selected_contact.emails.length; i ++) {
                                    if(i == index) {
                                        selected_contact.emails[i].selected = true;
                                    } else {
                                        selected_contact.emails[i].selected = false;
                                    }
                                }
                                this.setState({
                                    selected_contact: selected_contact
                                })
                            }}
                        >
                            <View style = {{width: '90%', flexDirection: 'row', alignItems: 'center'}}>
                                <Text style={[stylesGlobal.font, {fontSize: 14,  textAlign:'center', width: 60}]}>{item.type}</Text>
                                <Text style={[{paddingLeft:10, borderRadius:3, borderWidth:1, borderColor:Colors.gray, width:'70%', marginTop:10, paddingVertical:5, fontSize:12}, stylesGlobal.font]} >{item.address}</Text>
                                <View style = {{marginLeft: 10, width: 20, height: 20}}>
                                {
                                    item.selected &&
                                    <Image source={require('../icons/checked.png')} style={{width: '100%', height: '100%', resizeMode: 'contain'}}/>
                                }
                                </View>
                            </View>
                        </TouchableOpacity>
                        )
                    }
                    </View>
                    <View style={{width:'100%', height:1, backgroundColor:Colors.gold, marginVertical:10}} />
                    <TouchableOpacity
                        onPress={() => {
                            if(this.state.selected_invite_index > -1) {
                                var rowInvitation = this.state.rowInvitation;
                                var selected_contact = this.state.selected_contact;
                                var contact_name = "";
                                var contact_email = "";
                                var contact_phoneNumber = "";
                                if(selected_contact.name) {
                                    contact_name = selected_contact.name;
                                }
                                for(i = 0; i < selected_contact.phones.length; i ++) {
                                    if(selected_contact.phones[i].selected) {
                                        contact_phoneNumber = selected_contact.phones[i].number;
                                        break;
                                    } 
                                }
                                for(i = 0; i < selected_contact.emails.length; i ++) {
                                    if(selected_contact.emails[i].selected) {
                                        contact_email = selected_contact.emails[i].address;
                                        break;
                                    } 
                                }
                                
                                var name_splite = [];
                                rowInvitation[this.state.selected_invite_index].first_name = "";
                                rowInvitation[this.state.selected_invite_index].last_name = "";
                                if(contact_name != null && contact_name != "") {
                                    name_splite = contact_name.split(" ");
                                    rowInvitation[this.state.selected_invite_index].first_name = name_splite[0];
                                    if(name_splite.length > 1) {
                                        for(i = 1; i < name_splite.length; i ++) {
                                            rowInvitation[this.state.selected_invite_index].last_name += name_splite[i] + " ";
                                        }
                                        rowInvitation[this.state.selected_invite_index].last_name.trim();
                                    }
                                }
                                rowInvitation[this.state.selected_invite_index].email = contact_email;
                                rowInvitation[this.state.selected_invite_index].phoneNumber = contact_phoneNumber;
                                this.setState({
                                    showPhoneEmailSelectPopUp: false, 
                                    rowInvitation: rowInvitation,
                                    selected_invite_index: -1
                                })
                            }
                            
                        }}
                        style={[{
                            paddingHorizontal:10,
                            paddingVertical:10,
                            backgroundColor:Colors.gold,
                            borderRadius:3,
                            marginBottom:20,
                            width:'50%',
                            alignItems:'center'
                        }, stylesGlobal.shadow_style]}
                    >
                        <Text style={[ stylesGlobal.font, {color:Colors.white, fontSize:12}]}>Select</Text>
                    </TouchableOpacity>
                </View>
            </View>
        )
    }

    /**
        * time line button click
        */
    onTimeLinePress = () => {

        if (!this.state.dataMyProfile) {
            return null;
        }

        var id = this.state.dataMyProfile.userProfileInfo.id
        var userProfileInfo = this.state.dataMyProfile.userProfileInfo;
        this.props.navigation.navigate("MyTimeLine", {
            id: userProfileInfo.id,
            slug: userProfileInfo.slug,
            firstName: userProfileInfo.first_name,
            lastName: userProfileInfo.last_name,
            imgpath: userProfileInfo.imgpath,
            filename: userProfileInfo.filename
        })

    }
    /**
        * display conncction list
        */
    renderMyConnections = () => {

        return (
            <View style={{ }}>
                <Text style={[{color: Colors.gold, fontSize: 14, width: this.state.screen_width - card_padding * 2, paddingLeft: 10, paddingBottom: 5}, stylesGlobal.font]}>{"FAVORITES"}</Text>
                <View style={{backgroundColor: Colors.darkGray, width: this.state.screen_width - card_padding * 2, borderRadius: 20, paddingLeft: 10, paddingBottom: 5, paddingTop: 5}}>
                    {this.renderConnectionList()}
                </View>
            </View>
        );
    }

    renderConnectionList = () => {
        var len = this.state.connectionList.length;
        var displayViewAll = false;
        if(this.state.is_portrait) {
            if (len > 4) {
                len = 4
                displayViewAll = true
            } else {
                displayViewAll = false
            }
        } else {
            if (len > 8) {
                len = 8
                displayViewAll = true
            } else {
                displayViewAll = false
            }
        }

        return (
            <View style = {[{width: '100%', flexDirection: 'row', alignItems: 'center'}, displayViewAll ? {justifyContent: 'space-around'} : null]}>
            {
                this.state.connectionList.map((item, index) =>
                    index < len && this.renderConnectionItem(item, index, displayViewAll )
                )
            }
            {
                displayViewAll && this.renderConnectionItem(null, -1) 
            }
            </View>
        );
    }
    /**
        * display conncction row data
        */
    renderConnectionItem = (data, index, displayViewAll) => {

        var urlToShow = "";
        if(data != null) {
            urlToShow = data.imgpath + Constants.THUMB_FOLDER + data.filename;
        }
        return (
            <View key={index} 
                style={{
                    width: this.state.is_portrait ? '18%' : '10%', 
                    aspectRatio: 1, 
                    justifyContent: "center", 
                    marginRight: displayViewAll ? 0 : (this.state.screen_width - card_padding * 2) * 0.1 / 5,
                    borderRadius: this.state.is_portrait ? (this.state.screen_width - card_padding * 2) * 0.18 / 2 : (this.state.screen_width - 40) * 0.1 / 2, 
                    overflow: 'hidden',
                }}
            >
                <TouchableOpacity 
                    style={{
                        backgroundColor: data != null ? Colors.gray : Colors.gold, 
                        width: '100%', 
                        height: '100%', 
                        justifyContent: 'center',
                        alignItems: 'center',
                        
                    }}
                    onPress={() => {
                        if(data == null) {
                            this.props.navigation.navigate("MyListsNavigation", {list_show: "favorite"});
                        } else {
                            if (data.id === this.state.userId) {
                                this.props.navigation.navigate("MyProfile", {
                                    refreshProfileImage: this.getDataAgain
                                });
                            } else {
                                this.props.navigation.navigate("ProfileDetail", {
                                    slug: data.slug
                                });
                            }
                        }
                    }}>
                    {
                        data == null &&
                        <Text style={[{color: Colors.white, fontSize: 10,}, stylesGlobal.font]}>{Constants.VIEW_ALL}</Text>
                    }
                    {
                        data != null &&
                        <ImageCompressor style={{backgroundColor: Colors.white, width: '100%', height: '100%', }} uri={urlToShow}/>
                    }
                </TouchableOpacity>
            </View>
        );
    }

    /**
    * display user profile info
    */
    renderMyInfo = () => {

        if (!this.state.dataMyProfile) {
            return null;
        }

        return (
            <View style={{marginTop:20, backgroundColor:Colors.white, borderRadius:15}}>
                {this.renderShapeAndColor()}
            </View>
        );
    };

    /**
     * display user shape & color info
     */
    renderShapeAndColor = () => {
        if (!this.state.dataMyProfile) {
            return null;
        }
        var userProfileInfo = this.state.dataMyProfile.userProfileInfo;
        var userCustomFields = this.state.dataMyProfile.userCustomFields;

        var dob = userProfileInfo.dob;
        var age = userProfileInfo.age;
        var hair_color = userCustomFields.hair_color;
        var eye_color = userCustomFields.eye_color;
        var skin_color = userCustomFields.skin_color;
        var height = userCustomFields.height;
        var weight = userCustomFields.weight;
        var marital_status = userCustomFields.marital_status;
        var body = userCustomFields.body;
        var ethnicity = userCustomFields.ethnicity;

        var location = userProfileInfo.address;
        var language = userCustomFields.languages_known;
        var aboutMe = userProfileInfo.general_info;
        var thinkILike = userProfileInfo.things_i_like;

        var userShapeColor = [];

        var age = getUserAge(dob);
        if(age > 0) {
            if(userProfileInfo.dob_verified_on)
                userShapeColor.push({ title: "AGE", value: age, verified: true });
            else
                userShapeColor.push({ title: "AGE", value: age, });
        }

        if (hair_color != undefined && hair_color != null && hair_color != 0 && hair_color != "Not Set") {
            userShapeColor.push({ title: "HAIR COLOR", value: hair_color });
        }

        if (eye_color != undefined && eye_color != null && eye_color != 0 && eye_color != "Not Set") {
            userShapeColor.push({ title: "EYE COLOR", value: eye_color });
        }

        if (skin_color != undefined && skin_color != null && skin_color != 0 && skin_color != "Not Set") {
            userShapeColor.push({ title: "SKIN COLOR", value: skin_color });
        }

        if (height != undefined && height != null && height != 0 && height != "Not Set") {
            userShapeColor.push({ title: "HEIGHT", value: height });
        }

        if (weight != undefined && weight != null && weight != 0 && weight != "Not Set") {
            userShapeColor.push({ title: "WEIGHT", value: weight });
        }

        if (marital_status != undefined && marital_status != null && marital_status != 0 && marital_status != "Not Set") {
            userShapeColor.push({ title: "MARITAL STATUS", value: marital_status });
        }

        if (body != undefined && body != null && body != 0 && body != "Not Set") {
            userShapeColor.push({ title: "BODY", value: body });
        }

        if (ethnicity != undefined && ethnicity != null && ethnicity != 0 && ethnicity != "Not Set") {
            userShapeColor.push({ title: "ETHNICITY", value: ethnicity });
        }
        
        return (
            <View style={{alignItems:'center', paddingBottom:20}}>
                <TouchableOpacity style={[styles.emptyAddView, {position: 'absolute', right: 10, top: 10, backgroundColor: Colors.transparent}]}
                    onPress={() => this.props.navigation.navigate('EditProfile', {
                        profileDetail: this.state.dataMyProfile,
                        refreshAction: this.getDataAgain
                    })}>
                    <Text style = {[stylesGlobal.font, styles.infoTextedit]}>{"Edit"}</Text>
                </TouchableOpacity>
                <Image source={require("../icons/personal.png")} style={{resizeMode:'contain', width:40, height:40, marginTop:15}} />
                <Text style={[{color:Colors.black, fontSize: 20, marginTop:10}, stylesGlobal.font_semibold]}>Personal Details</Text>
                <FlatList
                    style = {{width: '100%',}}
                    columnWrapperStyle = {{width: '100%', marginBottom: 10}}
                    extraData={this.state}
                    numColumns = {this.state.is_portrait ? 3 : 5}
                    key = {this.state.is_portrait ? 3 : 5}
                    keyExtractor={(item, index) => index.toString()}
                    data={userShapeColor}
                    renderItem={({item}) => {
                        return(
                            <View style={{alignItems:'center', justifyContent:'center', width: this.state.is_portrait ? '33%' : '20%', aspectRatio: 1}}>
                                <View style={{alignItems:'center', justifyContent:'center', backgroundColor:Colors.gold, width: '80%', aspectRatio: 1, borderRadius:5}}>
                                    <View style={{alignItems: 'center', justifyContent: 'center'}}>
                                         <Text style={[{marginBottom:10, color:Colors.white, fontSize:8}, stylesGlobal.font]}>{item.title}</Text>
                                    </View>
                                   
                                    <View style={{ width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center'}}>
                                        <Text style={[{fontSize:10, textAlign: 'center'}, stylesGlobal.font]}>{item.value}</Text>
                                        {item.verified && 
                                            <Image source={require("../icons/verify_checkmark.png")} style={{resizeMode: 'contain', width: 20, height: 20, marginLeft: 5}} />
                                        }
                                    </View>

                                </View>
                            </View>
                        )
                    }}
                />
                <Image source={require("../icons/pin.png")} style={{resizeMode:'contain', width:40, height:40, marginTop:15}} />
                <Text style={[{color:Colors.black, fontSize: 20, marginTop:10}, stylesGlobal.font_semibold]}>{"Location:"}</Text>
                <Text style={[styles.infoCardValue, stylesGlobal.font]}>{location}</Text>
                <Image source={require("../icons/languages.png")} style={{resizeMode:'contain', width:40, height:40, marginTop:15}} />
                <Text style={[{color:Colors.black, fontSize: 20, marginTop:10}, stylesGlobal.font_semibold]}>{"Languages:"}</Text>
                <Text style={[styles.infoCardValue, stylesGlobal.font]}>{language}</Text>
                <Image source={require("../icons/aboutme.png")} style={{resizeMode:'contain', width:40, height:40, marginTop:15}} />
                <Text style={[{color:Colors.black, fontSize: 20, marginTop:10}, stylesGlobal.font_semibold]}>{"About Me:"}</Text>
                <Text style={[styles.infoCardValue, stylesGlobal.font, {textAlign:'center'}]}>{aboutMe}</Text>
                {/* <Text style={[styles.infoCardValue, stylesGlobal.font, {textAlign:'center'}]}>{"Instagram: " }</Text> */}
                <Image source={require("../icons/interests.png")} style={{resizeMode:'contain', width:40, height:40, marginTop:15}} />
                <Text style={[{color:Colors.black, fontSize: 20, marginTop:10}, stylesGlobal.font_semibold]}>{"Interests:"}</Text>
                <Text style={[styles.infoCardValue, stylesGlobal.font, {textAlign:'center'}]}>{thinkILike}</Text>
            </View>
        );
    };

    /**
     * display user gallery images
     */
    renderUserGallery = () => {
        var viewValue;
        if (!this.state.dataMyProfile) {
            return null;
        }
        var galleryImages = this.state.dataMyProfile.galleryImages;
        if (galleryImages == undefined || galleryImages == null || galleryImages.length < 1) {
            viewValue = <View style={styles.emptyView}>
                <TouchableOpacity style={[styles.emptyAddView, stylesGlobal.shadow_style]}
                    onPress={() => {
                        this.props.navigation.navigate("AddAlbum", {
                            userId: this.state.userId,
                            userToken: this.state.userToken,
                            getDataAgain: this.getDataAgain,
                            isPrivate: 0
                        })
                    }}
                >
                    <Text style={[styles.emptyAddText, stylesGlobal.font]}>{"Add Images"}</Text>
                </TouchableOpacity>
            </View>
        } else {
            var len = galleryImages.length;
            if(len > 6) {
                len = 6;
            }
            var tempGalleryUrls = [];
            for (var i = 0; i < len; i++) {
                
                var uri = galleryImages[i].imgpath + galleryImages[i].filename;
                uri = uri == 0 ? 'undefined' : uri;
                tempGalleryUrls.push({
                    id: "id_" + i.toString(),
                    image: { uri: uri}
                })
            }
            viewValue = <View style = {{flex: 1, flexDirection: 'row', flexWrap: 'wrap'}}>
                {
                    galleryImages.map((item, index) =>
                        index < len && 
                        <ProfileImageGirdViewRow
                            key={index}
                            isMyImage={true}
                            index={index}
                            tempGalleryUrls={tempGalleryUrls}
                            screenProps={this.props.navigation}
                            data={item} 
                        />
                    ) 
                }
                </View>
        }

        return (
             <View style={styles.viewContainerWithShadow}>
                <Text style={[styles.infoTextHeader, stylesGlobal.font]}>{"Gallery : "}</Text>
                {
                    this.state.is_verified == "1" &&
                    <TouchableOpacity style={[styles.emptyAddView, {position: 'absolute', right: 10, top: 10, backgroundColor: Colors.transparent}]}
                        onPress={() => {
                            this.props.navigation.navigate("AddAlbum", {
                                userId: this.state.userId,
                                userToken: this.state.userToken,
                                getDataAgain: this.getDataAgain,
                                isPrivate: 0
                            })
                        }}>
                        <Text style = {[stylesGlobal.font, styles.infoTextedit]}>{"See All"}</Text>
                    </TouchableOpacity>
                }
                {this.state.is_verified == "1" && viewValue}
                {
                    this.state.is_verified != "1" &&
                    <View style={styles.emptyView}>
                        <View style = {{flexDirection: 'row', justifyContent: 'center', alignItems: 'center'}}>
                            <Image  style={{width: 40, height: 40, resizeMode: 'contain'}} source={require("../icons/signin_password.png")}/>
                            <Text style = {[{fontSize: 14, color: Colors.gold}, stylesGlobal.font]}>{"Your profile seems not approved"}</Text>
                        </View>
                    </View>
                }
            </View>
        );
    };


    /**
     * display user time line
     */
    renderSuccessTimeLineView = () => {
        if (!this.state.dataMyProfile) {
            return null;
        }

        var dob = this.state.dataMyProfile.userProfileInfo.dob;
        
        var viewValue;
        var success = this.state.dataMyProfile.success;
        
        if (success != undefined && success != null && success.length > 0) {
            var successList = [];
            for (var successData = 0; successData < success.length; successData++) {
                successList.push({ title: success[successData].year, description: success[successData].description, visibility: success[successData].visibility });
            }
            viewValue = <ScrollView
                    onScroll={this._onScroll}
                    style={[styles.cardViewProfile, { marginBottom: 30, paddingBottom: 10 }]}
                    onTouchMove={this._ignoreScrollBehavior}
                >
                    <CustomTimeline
                        data={success}
                        host = {true}
                    />
                </ScrollView>

        } else {
            {
                viewValue = <View style={styles.emptyView}>
                    <TouchableOpacity style={[styles.emptyAddView, stylesGlobal.shadow_style]}
                        onPress={() => {
                            this.props.navigation.navigate("AddSuccessTimeline", {
                                userId: this.state.userId,
                                userToken: this.state.userToken,
                                getDataAgain: this.getDataAgain,
                                timelineData: [],
                                dob: dob
                            })
                        }}>
                        <Text style={[styles.emptyAddText, stylesGlobal.font]}>Add an achievement</Text>
                    </TouchableOpacity>

                </View>
            }
        }

        return (
            <View style={[styles.viewContainerWithShadow, {paddingHorizontal: 20}]}>
                <Text style={[styles.infoTextHeader, stylesGlobal.font]}>Success Timeline : </Text>
            {
                this.state.is_verified == "1" &&
                <View style={{flexDirection: 'row', position: 'absolute', right: 10, top: 5, }}>
                    <TouchableOpacity style={[styles.emptyAddView, {backgroundColor: Colors.transparent, marginRight: 10}]}
                        onPress={() => {
                            this.props.navigation.navigate("AddSuccessTimeline", {
                                userId: this.state.userId,
                                userToken: this.state.userToken,
                                getDataAgain: this.getDataAgain,
                                timelineData: [],
                                dob: dob,
                                addTimeline: true,
                            })
                        }}>
                        <Text style = {[stylesGlobal.font, styles.infoTextedit]}>Add</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.emptyAddView, {backgroundColor: Colors.transparent}]}
                        onPress={() => {
                            this.props.navigation.navigate("AddSuccessTimeline", {
                                userId: this.state.userId,
                                userToken: this.state.userToken,
                                getDataAgain: this.getDataAgain,
                                timelineData: [],
                                dob: dob
                            })
                        }}>
                        <Text style = {[stylesGlobal.font, styles.infoTextedit]}>Edit</Text>
                    </TouchableOpacity>
                </View>
            }
            {
                this.state.is_verified == "1" &&
                viewValue
            }
            {
                this.state.is_verified != "1" &&
                <View style={styles.emptyView}>
                    <View style = {{flexDirection: 'row', justifyContent: 'center', alignItems: 'center'}}>
                        <Image  style={{width: 40, height: 40, resizeMode: 'contain'}} source={require("../icons/signin_password.png")}/>
                        <Text style = {[{fontSize: 14, color: Colors.gold}, stylesGlobal.font]}>Your profile seems not approved</Text>
                    </View>
                </View>
            }
            </View>
        );
    };


    /**
     * display user travel plan info list
     */
    renderTravelPlansView = () => {
        if (!this.state.dataMyProfile) {
            return null;
        }

        var viewValue;
        var userTravelPlan = [];
        this.state.dataMyProfile.schedules.map((item, j) => {
            let endDate = new Date(Moment(item.to_date).utc().format("YYYY-MM-DD"));
            userTravelPlan.push(item)
        })
        userTravelPlan.reverse();
        if (userTravelPlan != undefined && userTravelPlan != null && userTravelPlan.length > 0) {

            var travelPlanList = [];
            for (var travelPlan = 0; travelPlan < userTravelPlan.length; travelPlan++) {
                travelPlanList.push(this.renderUserTravelPlanRow(userTravelPlan[travelPlan], travelPlan))
            }
            viewValue = <ScrollView
                ref={ref => this.scrollview = ref}
                onScroll={this._onScroll}
                style={[styles.cardViewProfile, { marginBottom: 30, paddingBottom: 10, height: 370 }]}
                onTouchMove={this._ignoreScrollBehavior}
                onContentSizeChange={() => {
                    this.scrollview.scrollToEnd({animated:true})
                }}
            >
                {travelPlanList}
            </ScrollView>

        } else {
            viewValue = (<View style={styles.emptyView}>

                <TouchableOpacity style={[styles.emptyAddView, stylesGlobal.shadow_style]}
                    onPress={() => {
                        this.props.navigation.navigate("AddTravelPlan", {
                            userId: this.state.userId,
                            userToken: this.state.userToken,
                            getDataAgain: this.getDataAgain,
                            data: null,
                            travelPlanList: []
                        })
                    }}>
                    <Text style={[styles.emptyAddText, stylesGlobal.font]}>{"Add Travel Plan"}</Text>
                </TouchableOpacity>
            </View>)
        }

        return (
            <View style={[styles.viewContainerWithShadow]}>
                <Text style={[styles.infoTextHeader, stylesGlobal.font]}>{"Travel Plans : "}</Text>
            {
                this.state.is_verified == "1" &&
                <View style={{flexDirection: 'row', position: 'absolute',
                        right: 10,
                        top: 10,}}>
                    <TouchableOpacity style={[styles.emptyAddView, {
                        marginRight: 10,
                        backgroundColor: Colors.transparent
                    }]}
                        onPress={() => {
                            this.props.navigation.navigate("AddTravelPlan", {
                                userId: this.state.userId,
                                userToken: this.state.userToken,
                                getDataAgain: this.getDataAgain,
                                data: null,
                                travelPlanList: [],
                                addPlan: true,
                            })
                        }}>
                        <Text style = {[stylesGlobal.font, styles.infoTextedit]}>{"Add"}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.emptyAddView, {
                        
                        backgroundColor: Colors.transparent
                    }]}
                        onPress={() => {
                            this.props.navigation.navigate("AddTravelPlan", {
                                userId: this.state.userId,
                                userToken: this.state.userToken,
                                getDataAgain: this.getDataAgain,
                                data: null,
                                travelPlanList: []
                            })
                        }}>
                        <Text style = {[stylesGlobal.font, styles.infoTextedit]}>{"Edit"}</Text>
                    </TouchableOpacity>
                </View>
            }
            {
                this.state.is_verified == "1" &&
                viewValue
            }
            {
                this.state.is_verified != "1" &&
                <View style={styles.emptyView}>
                    <View style = {{flexDirection: 'row', justifyContent: 'center', alignItems: 'center'}}>
                        <Image  style={{width: 40, height: 40, resizeMode: 'contain'}} source={require("../icons/signin_password.png")}/>
                        <Text style = {[{fontSize: 14, color: Colors.gold}, stylesGlobal.font]}>{"Your profile seems not approved"}</Text>
                    </View>
                </View>
            }
            </View>
        );
    };

    /**
    * display travel plan row data
    */
    renderUserTravelPlanRow = (rowData, index) => {
        var id = rowData.id;
        var userid = rowData.userid;
        var from_date = rowData.from_date;
        var to_date = rowData.to_date;
        var country = rowData.country;
        var state = rowData.state;
        var city = rowData.city;
        var zipcode = rowData.zipcode;
        var address = rowData.address;
        var latitude = rowData.latitude;
        var longitude = rowData.longitude;
        var visibility = rowData.visibility;
        var travel_purpose = rowData.travel_purpose;
        var created_at = rowData.created_at;
        var updated_at = rowData.updated_at;
        var deleted_at = rowData.deleted_at;
        var ip = rowData.ip;
        var city_name = rowData.city_name;
        var state_name = rowData.state_name;
        var state_code = rowData.state_code;
        var country_name = rowData.country_name;
        var country_code = rowData.country_code;

        return (
            <View key={index} style={[styles.cardViewProfile]}>
                <View style={{ borderBottomWidth: 2, borderBottomColor: 'gray', paddingBottom: 10, paddingTop: 10 }}>
                    <View style={{ flex: 1, flexDirection: 'row' }}>
                        <View style={styles.labelIconView}>
                            <Image style={styles.labelIcon} source={require("../icons/pin.png")}/>
                        </View>
                        <Text style={[{ color: Colors.black, marginLeft: 5, fontSize: 14, }, stylesGlobal.font_bold]}>{address}</Text>
                    </View>

                    <View style={{ flex: 1, flexDirection: 'row', marginTop: 10, alignItems:'center' }}>
                        <View style={styles.labelIconView}>
                            <Image style={styles.labelIcon} source={require("../icons/calendar.png")}/>
                        </View>
                        <View style = { styles.dateView}>
                            <Text style = {[styles.date, stylesGlobal.font]}>{Moment(from_date).utc().format("DD MMM YYYY")}</Text>
                        </View>
                        <Text style = {[styles.date, stylesGlobal.font, {marginLeft: 5}]}>{Moment(from_date).utc().format("ddd")} </Text>

                        <View style={{ marginHorizontal:5}}>
                            <Text style={[{fontSize:10, color:Colors.gold}, stylesGlobal.font]}>THRU</Text>
                        </View>

                        <View style={styles.dateView}>
                            <Text style={[styles.date, stylesGlobal.font]}>{Moment(to_date).utc().format("MMM DD, YYYY")}</Text>
                        </View>
                        <Text style = {[styles.date, stylesGlobal.font, {marginLeft: 5}]}>
                            {Moment(to_date).utc().format("ddd")}
                        </Text>
                    </View>

                    <View style={{ flex: 1, flexDirection: 'row', marginTop: 10 }}>
                        <View style={styles.labelIconView}>
                            <Image style={styles.labelIcon}/>
                        </View>
                        <Text style={[styles.ageText, { marginLeft: 5, marginTop: 2, fontSize: 12 }, stylesGlobal.font]}>
                            {convertStringtoEmojimessage(travel_purpose)}
                        </Text>
                    </View>
                </View>
            </View>
        );
    };

    _onScroll = ({ nativeEvent }) => {
        if (nativeEvent.contentOffset.y <= 0 && !this.state.enableScrollViewScroll) {
            this.setState({ enableScrollViewScroll: true });
        }
    }

    _ignoreScrollBehavior = () => {
        if (this.state.enableScrollViewScroll) {
            this.setState({ enableScrollViewScroll: false });
        }
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.black
    },
    dateView: {
        backgroundColor: Colors.gold,
        borderRadius: 5,
        marginLeft: 5,
        borderColor: Colors.black,
        paddingVertical:5,
        paddingHorizontal: 8
    },
    date: {
        fontSize: 14,
        backgroundColor: Colors.transparent,
        color: Colors.black,
    },
    labelIconView: {
        marginRight: 5,
        backgroundColor: Colors.transparent,
    },
    labelIcon: {
        width: 25,
        height: 25,
        resizeMode: 'contain',
        marginRight: 5,
        marginLeft: 5,
    },
    fullname: {
        color: Colors.black,
        fontSize: 25,
    },
    age: {
        fontSize:20,
        fontWeight:'400',
        color: Colors.black
    },
    memberPlan: {
        fontSize: 14,
        backgroundColor: Colors.transparent,
        color: Colors.gray
    },
    ageText: {
        fontSize: 14,
        backgroundColor: Colors.transparent,
        color: Colors.gray
    },
    cardViewProfile: {
        backgroundColor: Colors.transparent,
    },
    cardViewCalendar: {
        backgroundColor: Colors.white,
        borderRadius: 3,
        shadowOpacity: 0.5,
        shadowRadius: 5,
        shadowColor: Colors.white
    },
    profileNameViewStyle: {
        width: width,
        top: 0,
        alignItems: "center",
        marginTop: 5
    },
    memberPlanContainer: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        marginTop: 5
    },
    memberPlanView: {
        flexDirection: "row",
        flex: 1,
        alignContent: "center",
        justifyContent: "center",
        alignItems: "center"
    },
    memberIcon: {
        width: 15,
        height: 15,
        marginRight: 5,
        resizeMode: 'contain'
    },
    ageIcon: {
        width: 10,
        height: 12,
        marginRight: 5,
        resizeMode: 'contain'
    },
    infoCardView: {
        flexDirection: "row",
        flex: 1,
        alignContent: "center",
        justifyContent: "center",
        alignItems: "center"
    },
    infoCardIconView: {
        width: 20,
        marginLeft: 10,
        marginRight: 10
    },
    infoCardDetailView: {
        flex: 1,
        flexDirection: "column",
        borderLeftWidth: 1,
        borderColor: Colors.gray
    },
    infoCardValue: {
        color: Colors.black,
        fontSize: 13,
        marginTop: 5,
        marginHorizontal:20
    },
    timeLineContainer: {
        flex: 1,
        backgroundColor: Colors.transparent,
        paddingTop: 10,
        paddingBottom: 10
    },
    timeLineTitle: {
        fontSize: 16,
        fontWeight: "bold",
        color: Colors.white,
        backgroundColor: Colors.transparent
    },
    timeLineTextDescription: {
        color: Colors.white,
        backgroundColor: Colors.transparent
    },
    stickySection: {
        height: STICKY_HEADER_HEIGHT,
        width: '100%',
        flexDirection: "column",
        backgroundColor: Colors.transparent,
        justifyContent: "center",
    },
    parallaxHeader: {
        alignItems: 'center',
        flex: 1,
        flexDirection: "column",
        justifyContent: 'flex-end'
    },
    infoTextHeader: {
        fontSize: 18,
        paddingLeft: 10,
        paddingRight: 10,
        paddingBottom: 10,
        color: Colors.gold
    },
    infoTextedit: {
        fontSize: 13,
        paddingLeft: 10,
        paddingRight: 10,
        paddingBottom: 10,
        color: Colors.gold
    },
    viewContainerWithShadow: {
        backgroundColor: Colors.white,
        borderRadius: 15,
        borderColor: Colors.white,
        justifyContent: 'center',
        padding: 10,
        marginTop: 20
    },
    smallProfileImageContainer: {
        backgroundColor: Colors.gray,
        width: smallProfileImageSize,
        height: smallProfileImageSize,
        borderRadius: smallProfileImageSize / 2
    },
    smallRoundCornerView: {
        position: 'absolute',
        top: -(smallProfileImageSize / 2),
        bottom: -(smallProfileImageSize / 2),
        right: -(smallProfileImageSize / 2),
        left: -(smallProfileImageSize / 2),
        borderRadius: (smallProfileImageSize / 2 + smallProfileImageSize / 4),
        borderWidth: (smallProfileImageSize / 2),
        borderColor: Colors.black,
    },
    connectButton: {
        padding: 5,
        width: 80,
        height: 36,
        borderWidth: 1,
        borderColor: Colors.transparent,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: Colors.gold,
        borderRadius: 18,
        alignContent: "center",
    },
    messageButton: {
        padding: 5,
        width: 80,
        height: 36,
        borderWidth: 1,
        borderColor: Colors.transparent,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: Colors.gold,
        borderRadius: 18,
        alignContent: "center",
    },
    smallUserRoseType: {
        backgroundColor: Colors.white,
        width: smallProfileImageSize,
        height: smallProfileImageSize,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: smallProfileImageSize / 2
    },
    emptyAddView: {
        backgroundColor: Colors.gold,
        padding: 10,
        borderRadius: 5
    },
    countImage: {
        width: '100%',
        height: '100%',
        resizeMode:'contain'
    },
    actionButtonText: {
        color:Colors.black, 
        textAlign:'center', 
        fontSize:10, 
        marginTop: 5
    },

    emptyView: {
        justifyContent: "center",
        height: 150,
        alignItems: "center",
        alignContent: "center",
        flexDirection: "row"
    },
    fitImage: {
        borderRadius: 20,
        minHeight: width * 0.8,
        overflow: 'hidden',
        backgroundColor: Colors.gray
    },
    emptyAddText: {
        fontSize: 14,
        textAlign: 'center',
        color: Colors.white
    }
});
