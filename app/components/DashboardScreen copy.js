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
    FlatList,
    ImageBackground,
    TextInput,
    Alert,
    SafeAreaView,
    Keyboard,
    PermissionsAndroid,
    Linking
} from "react-native";
import { useNavigationState } from '@react-navigation/native' 
import AsyncStorage from '@react-native-community/async-storage';
import { EventRegister } from 'react-native-event-listeners'
import RNThumbnail from 'react-native-thumbnail';
import { createThumbnail } from "react-native-create-thumbnail";
import ActionSheet from 'react-native-actionsheet'
import FitImage from 'react-native-fit-image'
import { ImageCompressor } from './ImageCompressorClass';
import ImagePicker from "react-native-image-picker";
import GridView from "react-native-super-grid";
import { Constants } from "../consts/Constants";
import { Colors } from "../consts/Colors";
import ProgressIndicator from "./ProgressIndicator";
import PullDownIndicator from "./PullDownIndicator";
import RowNewMemberRegister from "./RowNewMemberRegister";
import RowNearMePeople from "./RowNearMePeople";
import RowRecentLogin from "./RowRecentLogin";
import RowDiscoverFeatureAccount from "./RowDiscoverFeatureAccount";
import RowGallery from "./RowGallery";
import RowUserPost from "./RowUserPost";
import RowAddedYouAsFavourite from "./RowAddedYouAsFavourite";
import * as Global from "../consts/Global";
import RowProfileInfo from "./RowProfileInfo";
import WebService from "../core/WebService";
import { stylesGlobal, STICKY_HEADER_HEIGHT } from '../consts/StyleSheet'
import HeaderView from "../customview/HeaderView";
import CustomPopupView from "../customview/CustomPopupView";
import NotificationPopupView from "../customview/NotificationPopupView";
import CustomReportPopupView from "../customview/CustomReportPopupView";
import Memory from "../core/Memory";
import {SectionGrid, FlatGrid} from "react-native-super-grid";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { selectContact, selectContactPhone, selectContactEmail } from 'react-native-select-contact';
import PhoneInput from 'react-native-phone-input';
import ModalDropdown from "../custom_components/react-native-modal-dropdown/ModalDropdown";
import {convertEmojimessagetoString, convertStringtoEmojimessage} from "../utils/Util";
import BannerView from "../customview/BannerView";
import InviteBannerView from "../customview/InviteBannerView";
import Clipboard from '@react-native-community/clipboard';
import { getStatusBarHeight, getBottomSpace  } from 'react-native-iphone-x-helper';
import * as ValidationUtils from "../utils/ValidationUtils";
import { BlurView, VibrancyView } from "@react-native-community/blur";
import InvisibleBlurView from "../customview/InvisibleBlurView";


var { width, height } = Dimensions.get("window");
width = width > height ? height : width;
height = width > height ? width : height;

function wp(percentage) {
    const value = percentage * width / 100;
    return Math.round(value);
}


var array_New_Member_Register = [];
var array_Discover_Feature_Account = [];
var array_Near_Me_People = [];
var array_User_Gallery = [];
var array_Added_As_You_Favourite = [];
var profileInfo;
var array_User_Feed_list = [];
var pageNumber = 0;

const cardMargin = 10;
const cardLeftRightPadding = 10;
const SLIDER_1_FIRST_ITEM = 1;


var TAG = "DashboardScreen";


export default class DashboardScreen extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            pulldown_loading: false,
            isOpen: false,
            selectedItem: "About",
            firstName: "",
            lastName: "",
            userId: "",
            userToken: "",
            userSlug: "",
            loading: true,
            slider1ActiveSlide: SLIDER_1_FIRST_ITEM,
            slider1Ref: null,
            displayProfileInfo: false,
            dataProfileInfo: profileInfo,

            dataEventJoined: "0",
            dataEventCreated: "0",
            dataTripJoined: "0",
            dataTripCreated: "0",
            dataMyConnectionCount: "0",
            dataFans: "0",
            dataRose: "0",
            dataFollowing: "0",
            dataMyList: "0",
            dataReferFriends: "0",
            dataSentGifts: "0",
            dataReceivedGifts: "0",


            dataNewMemberRegister: array_New_Member_Register,
            displayNewMemberRegister: false,
            dataDiscoverFeatureAccountRegister: array_Discover_Feature_Account,
            displayDiscoverFeatureAccount: false,
            dataNearMePeople: array_Near_Me_People,
            displayNearMePeople: false,
            dataRecentLogin: [],
            dataUserGallery: array_User_Gallery,
            displayUserGallery: false,
            dataAddedYouAsFavourite: array_Added_As_You_Favourite,
            displayAddedYouAsFavourite: false,
            isGallaryOpen: true,
            animatedValueEmptyGallary: new Animated.Value(100),
            showModel: false,
            showNotificationModel: false,
            dataUserFeeds: array_User_Feed_list,
            displayUserFeeds: false,
            isLoadMoreUserFeeds: true,
            displayLoadMoreView: false,
            displayLoadMoreLoader: false,
            activityId: "0",
            activityUserId: "0",
            feedLikeType: 0,
            showReportModel:false,
            userImagePath: "",
            userImageName: "",
            privacyValue: "Member",
            valueEventImage:'',
            videoSource:'',
            postText:'',
            newUpdate:'',
            newUpdateLoader:false,
            myEvents: [],
            rowInvitation: [{first_name:'', last_name: '', email:'', phoneNumber:'', selected_user_role_index: 6, selected_gender_index: 0}],
            noteInvitation:'',
            showInvitationPopUp: false,
            showNotes: false,
            hash_key:'',
            showReferLink: false,

            is_verified: "0",
            email_verified: "1",
            payment_status: "1",
            
            member_plan: '0',

            selected_category: Global.selected_category,
            category_array: Global.category_array_others,
            
            searchText: '',

            birthday_users: [],

            showPhoneEmailSelectPopUp: false,
            selected_contact: null,
            user_role: Global.entries,
            user_gender: [{type: "Male", image: require('../icons/signup_male.png')}, {type: "Female", image: require('../icons/signup_female.png')}],

            is_special: "0", // for special invite

            popup_value_changed: false, // when changed a value in popup
            reportedId: "",
        };
    }


    /** Calling API and clearing previous data
     *
     */
    refreshData = () => {
        array_New_Member_Register = [];
        array_Discover_Feature_Account = [];
        array_Near_Me_People = [];
        array_User_Gallery = [];
        array_User_Posts = [];
        array_Added_As_You_Favourite = [];
        array_User_Feed_list = [];
        pageNumber = 0;
        this.setState({
            isOpen: false,
            selectedItem: "About",
            firstName: "",
            lastName: "",
            userId: "",
            userToken: "",
            loading: true,
            slider1ActiveSlide: SLIDER_1_FIRST_ITEM,
            slider1Ref: null,
            displayProfileInfo: false,
            dataProfileInfo: profileInfo,
            dataEventJoined: "0",
            dataEventCreated: "0",
            dataMyConnectionCount: "0",
            dataFans: "0",
            dataRose: "0",
            dataNewMemberRegister: array_New_Member_Register,
            displayNewMemberRegister: false,
            dataDiscoverFeatureAccountRegister: array_Discover_Feature_Account,
            displayDiscoverFeatureAccount: false,
            dataNearMePeople: array_Near_Me_People,
            displayNearMePeople: false,
            dataRecentLogin: [],
            dataUserGallery: array_User_Gallery,
            displayUserGallery: false,
            dataAddedYouAsFavourite: array_Added_As_You_Favourite,
            displayAddedYouAsFavourite: false,
            isGallaryOpen: true,
            animatedValueEmptyGallary: new Animated.Value(100),
            showModel: false,
            showNotificationModel: false,
            showReportModel:false,
            dataUserFeeds: array_User_Feed_list,
            displayUserFeeds: false,
            isLoadMoreUserFeeds: true,
            displayLoadMoreView: false,
            displayLoadMoreLoader: false,
            activityId: "0",
            activityUserId: "0",
            feedLikeType: 0,
            userImagePath: "",
            userImageName: "",
            myEvents: [],
            rowInvitation: [{first_name:'', last_name: '', email:'', phoneNumber:'', selected_user_role_index: 6, selected_gender_index: 0}],
            noteInvitation:'',
            showInvitationPopUp: false,
            showNotes: false,
            hash_key:'',
            showReferLink: false,
            searchText: '',
            selected_category: Global.selected_category,
            is_special: "0", // for special invite
        });
        this.getData();
        this.listener = EventRegister.addEventListener(Constants.EVENT_PROFILE_IMAGE_UPDATED, () => {
            console.log(TAG, "EVENT_PROFILE_IMAGE_UPDATED event called");
            this.refreshProfileImage();
        })
        this.userDetails();
    }

    UNSAFE_componentWillMount() {
        array_New_Member_Register = [];
        array_Discover_Feature_Account = [];
        array_Near_Me_People = [];
        array_User_Gallery = [];
        array_User_Posts = [];
        array_Added_As_You_Favourite = [];
        array_User_Feed_list = [];
        pageNumber = 0;
        this.setState({
            isOpen: false,
            selectedItem: "About",
            firstName: "",
            lastName: "",
            userId: "",
            userToken: "",
            loading: true,
            slider1ActiveSlide: SLIDER_1_FIRST_ITEM,
            slider1Ref: null,
            displayProfileInfo: false,
            dataProfileInfo: profileInfo,
            dataEventJoined: "0",
            dataEventCreated: "0",
            dataMyConnectionCount: "0",
            dataFans: "0",
            dataRose: "0",
            dataNewMemberRegister: array_New_Member_Register,
            displayNewMemberRegister: false,
            dataDiscoverFeatureAccountRegister: array_Discover_Feature_Account,
            displayDiscoverFeatureAccount: false,
            dataNearMePeople: array_Near_Me_People,
            displayNearMePeople: false,
            dataUserGallery: array_User_Gallery,
            displayUserGallery: false,
            dataAddedYouAsFavourite: array_Added_As_You_Favourite,
            displayAddedYouAsFavourite: false,
            isGallaryOpen: true,
            animatedValueEmptyGallary: new Animated.Value(100),
            showModel: false,
            showNotificationModel: false,
            showReportModel:false,
            dataUserFeeds: array_User_Feed_list,
            displayUserFeeds: false,
            isLoadMoreUserFeeds: true,
            displayLoadMoreView: false,
            displayLoadMoreLoader: false,
            activityId: "0",
            activityUserId: "0",
            feedLikeType: 0,
            userImagePath: "",
            userImageName: "",
            myEvents: [],
            rowInvitation: [{first_name:'', last_name: '', email:'', phoneNumber:'', selected_user_role_index: 6, selected_gender_index: 0}],
            noteInvitation:'',
            showInvitationPopUp: false,
            showNotes: false,
            hash_key:'',
            showReferLink: false,
        });

        this.getData();

        this.listener = EventRegister.addEventListener(Constants.EVENT_PROFILE_IMAGE_UPDATED, () => {
            console.log(TAG, "EVENT_PROFILE_IMAGE_UPDATED event called");
            this.refreshProfileImage();
        });

        this.bannerListener = EventRegister.addEventListener(Constants.EVENT_BANNER_CHANGED, (data) => {
            console.log(TAG, "EVENT_BANNER_CHANGED event called");
            if(data == "") {
                this.setState({
                    is_verified: "1"
                })
            } else {
                this.setState({
                    is_verified: "0"
                })
            }
        })

        this.specialInviteListener = EventRegister.addEventListener(Constants.EVENT_SPECIAL_INVITE_PRIVILEGE_CHANGED, async() => {
            console.log(TAG, "special invite privilege changed");
            let is_special = await AsyncStorage.getItem(Constants.KEY_IS_SPECIAL);
            this.setState({
                is_special: is_special
            })
        });
    }

    componentDidMount() {
        this.orientationListener = Dimensions.addEventListener("change", (e) => {
            
        });
    }

    componentWillUnmount() {
        EventRegister.removeEventListener(this.listener);
        EventRegister.removeEventListener(this.bannerListener);
        EventRegister.removeEventListener(this.specialInviteListener);
    }

    postNewUpdateAPI = async() => {
        if(this.state.valueEventImage == "" && this.state.videoSource == "") {
            this.setState({
                loading: true
            })
        }
        this.setState({
            newUpdateLoader: true
        })
        if(this.state.postText.length===0 && this.state.videoSource.length===0 && this.state.valueEventImage.length===0) {
            this.setState({newUpdateLoader: false})
            Alert.alert(Constants.INVALID_POST_CONTENTS, "");
            return;
        } 
        try {
            let url = Memory().env =="LIVE" ? Global.BASE_URL + 'my-activities' : Global.BASE_URL_DEV + 'my-activities';
            var userId = await AsyncStorage.getItem(Constants.KEY_USER_ID);
            var userToken = await AsyncStorage.getItem(Constants.KEY_USER_TOKEN)
            let params = new FormData();
            params.append("format", "json");
            params.append("user_id",userId);
            params.append("token", userToken);
            params.append("post_text", convertEmojimessagetoString(this.state.postText));
            params.append("activity_check_visibility", this.state.category_array[this.state.selected_category].value);
            if(this.state.valueEventImage.length !== 0){
                params.append("upload_image", {
                    uri: this.state.valueEventImage,
                    type: 'image/jpeg',
                    name: 'testPhotoName.jpg'
                });
            }
            if(this.state.videoSource.length !== 0){
                params.append("upload_video", {
                    uri: this.state.videoSource,
                    type: 'video/mp4',
                    name: 'testPhotoName.mp4'
                });
            }
            console.log(TAG + " PostData URL " + url);
            console.log(TAG + " PostData params " + JSON.stringify(params));
            WebService.callServicePost( url, params, this.handlePostNewUpdate );
        } catch(error) {
            console.log(error)
            this.setState({
                newUpdateLoader: false,
                loading: false
            });
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    }

    handlePostNewUpdate = (response, isError) => {
        console.log(TAG + " PostData response " + JSON.stringify(response))
        this.setState({
            newUpdateLoader: false,
            valueEventImage: '',
            postText: '',
            videoSource: '',
            selected_category: Global.selected_category,
            loading: true
        }, () => this.refreshEventData(true));
    }

    scrolltoTop_mainScrollView() {
        this.refs.mainscrollView.scrollTo({x: 0, y: 0, animated: true})
    }

    /** calling getData API
     *
     * @returns {Promise<void>}
     */
    getData = async () => {
        try {
            var userId = await AsyncStorage.getItem(Constants.KEY_USER_ID);
            var userToken = await AsyncStorage.getItem(Constants.KEY_USER_TOKEN);
            var location = await AsyncStorage.getItem(Constants.LOCATION);
            var userSlug = await AsyncStorage.getItem(Constants.KEY_USER_SLUG);
            var userImagePath = await AsyncStorage.getItem(Constants.KEY_USER_IMAGE_URL);
            var userImageName = await AsyncStorage.getItem(Constants.KEY_USER_IMAGE_NAME);
            var is_verified = await AsyncStorage.getItem(Constants.KEY_IS_VERIFIED);
            
            this.setState({
                userId: userId,
                userToken: userToken,
                userSlug: userSlug,
                userImagePath: userImagePath,
                userImageName: userImageName,
                is_verified: is_verified
            });

        } catch (error) {
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
        this.setState({
            loading: true
        });
        
        this.callGetNearMePeopleAPI(location);
        this.callGetRecentLoginAPI();
    };

    callGetRecentLoginAPI = async () => {

        try {
            
            let uri = Memory().env == "LIVE" ? Global.URL_GETRECENTLOGIN : Global.URL_GETRECENTLOGIN_DEV;

            let params = new FormData();
            params.append("token", this.state.userToken);
            params.append("user_id", this.state.userId);
            params.append("format", "json");
            var json = {
                recordPerPage: 10,
                page: 1
            }
            params.append("data", JSON.stringify(json));

            console.log(TAG + " callGetRecentLoginAPI uri " + uri);
            console.log(TAG + " callGetRecentLoginAPI params " + JSON.stringify(params));
            
            WebService.callServicePost(
                uri,
                params,
                this.handleGetRecentLoginResponse
            );
        } catch (error) {
            
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    };

    handleGetRecentLoginResponse = (response, isError) => {
        console.log(TAG + " callGetRecentLoginAPI response " + JSON.stringify(response));
        console.log(TAG + " callGetRecentLoginAPI isError " + isError);

        if (!isError) {
            var result = response;

            if (typeof result != undefined && result != null) {
                if (result.status == "success") {
                    this.setState({
                        dataRecentLogin: result.data
                    })
                }
            }
        } else {
            if (response != undefined && response != null && response.length > 0) {
                Alert.alert(response.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    }

    /*
   * call get user feeds list API and display content
   */
    callGetUserFeedListAPI = async (isFirstTime) => {
        try {
            if (isFirstTime) {
                if(!this.state.pulldown_loading) {
                    this.setState({
                        loading: true,
                        displayLoadMoreView: false,
                        displayLoadMoreLoader: false
                    });
                }
            } else {
                this.setState({
                    displayLoadMoreLoader: true,
                });
            }
            let uri = Memory().env == "LIVE" ? Global.URL_GET_FEEDS + pageNumber : Global.URL_GET_FEEDS_DEV + pageNumber;
            let params = new FormData();
            params.append("token", this.state.userToken);
            params.append("user_id", this.state.userId);
            params.append("format", "json");

            console.log(TAG + " callGetUserFeedListAPI uri " + uri);
            console.log(TAG + " callGetUserFeedListAPI params " + JSON.stringify(params));

            WebService.callServicePost(
                uri,
                params,
                this.handleGetUserFeedListResponse
            );
        } catch (error) {
            this.setState({
                pulldown_loading: false,
                loading: false,
                displayLoadMoreView: false,
                displayLoadMoreLoader: false
            });
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    };

/**
* handle get feed list API response
*/
    handleGetUserFeedListResponse = (response, isError) => {
        console.log(TAG + " callGetUserFeedListAPI response " + JSON.stringify(response));
        console.log(TAG + " callGetUserFeedListAPI isError " + isError);

        if (!isError) {
            var result = response;

            if (typeof result != undefined && result != null) {
                if (result.status == "success") {
                    var mData = result.data;
                    if (result.data.length > 0) {
                        for(i = 0; i < result.data.length; i ++) {
                            array_User_Feed_list.push(result.data[i]);
                        }

                        this.setState({
                            isLoadMoreUserFeeds: true,
                        }, () => {
                            pageNumber = pageNumber + 1
                        });

                    } else {
                        this.setState({
                            isLoadMoreUserFeeds: false
                        });
                    }

                    if (array_User_Feed_list.length > 0) {
                        this.setState({
                            dataUserFeeds: array_User_Feed_list,
                            displayUserFeeds: true,
                            displayLoadMoreView: false,
                            displayLoadMoreLoader: false
                        });
                    } else {
                        array_User_Feed_list = [];
                        this.setState({
                            displayUserFeeds: false,
                            displayLoadMoreView: false,
                            displayLoadMoreLoader: false
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
            loading: false,
            displayLoadMoreView: false,
            displayLoadMoreLoader: false,
            pulldown_loading: false,
        });
        if (pageNumber == 1) {
            
        } else {
            this.setState({
                
            })
        }
    };

    /** call Near People API
     *
     * @returns {Promise<void>}
     */
    callGetNearMePeopleAPI = async (location) => {
        try {
            
            let uri = Memory().env == "LIVE" ? Global.BASE_URL : Global.BASE_URL_DEV;
            var latitude = 0.00;
            var longitude = 0.00;

            let params = new FormData();
            params.append("token", this.state.userToken);
            params.append("user_id", this.state.userId);
            params.append("format", "json");

            console.log(TAG + " callGetNearMePeopleAPI uri " + uri);
            console.log(TAG + " callGetNearMePeopleAPI params " + JSON.stringify(params));

            WebService.callServicePost(
                uri,
                params,
                this.handleGetNearMePeopleResponse
            );

        } catch (error) {
            console.error(TAG, " callGetNearMePeopleAPI error " + error);
            this.setState({
                loading: false
            });
            this.callGetUserFeedListAPI(true);
        }

    };

    /**
* handle get near me people API response
*/
    handleGetNearMePeopleResponse = async(response, isError) => {
        console.log(TAG + "callGetNearMePeopleAPI Response " + JSON.stringify(response));
        console.log(TAG + "callGetNearMePeopleAPI isError " + isError);

        if (!isError) {
            var result = response;

            if (typeof result != undefined && result != null) {
                if (typeof result.data != undefined && result.data != null) {
                    var mData = result.data;

                    if (mData.userProfileInfo != undefined && mData.userProfileInfo != null) {
                        profileInfo = mData.userProfileInfo;
                        let userImagePath = this.state.userImagePath;
                        let userImageName = this.state.userImageName;
                        if (profileInfo.profile_imgpath != undefined && profileInfo.profile_imgpath != null) {
                            userImagePath = profileInfo.profile_imgpath;
                            AsyncStorage.setItem(Constants.KEY_USER_IMAGE_URL, userImagePath);
                        }

                        if (profileInfo.profile_filename != undefined && profileInfo.profile_filename != null) {
                            console.log(TAG, "condition 11");
                            userImageName = profileInfo.profile_filename;
                            try {
                                AsyncStorage.setItem(Constants.KEY_USER_IMAGE_NAME, userImageName);
                            } catch(error) {
    
                            }
                        }
                        try {
                            // AsyncStorage.setItem(Constants.KEY_IS_VERIFIED, mData.userProfileInfo.is_verified);
                            AsyncStorage.setItem(Constants.KEY_EMAIL_VERIFIED, mData.userProfileInfo.status);
                            AsyncStorage.setItem(Constants.KEY_AUTO_RENEW, mData.userProfileInfo.auto_renew);
                            AsyncStorage.setItem(Constants.KEY_GOLD_COINS, mData.userProfileInfo.gold_coins);
                            AsyncStorage.setItem(Constants.KEY_MEMBER_PLAN, mData.userProfileInfo.member_plan);
                            AsyncStorage.setItem(Constants.KEY_PAYMENT_STATUS, mData.userProfileInfo.payment_status);
                            AsyncStorage.setItem(Constants.KEY_HASH_KEY, mData.userProfileInfo.hash_key);
                            AsyncStorage.setItem(Constants.KEY_IS_SPECIAL, mData.userProfileInfo.is_special);
                        } catch(error) {

                        }

                        this.setState({
                            is_special: mData.userProfileInfo.is_special,
                            birthday_users: mData.usersBirthday,
                            // is_verified: mData.userProfileInfo.is_verified,
                            email_verified: mData.userProfileInfo.status,
                            payment_status: mData.userProfileInfo.payment_status,
                            hash_key: mData.userProfileInfo.hash_key,
                            userImagePath: userImagePath,
                            userImageName: userImageName,
                            dataProfileInfo: mData.userProfileInfo,
                            displayProfileInfo: true,

                            member_plan: mData.userProfileInfo.member_plan,

                            dataRose: mData.send_rose.total_gift_received,
                        });

                        var saved_banner_action = "";
                        if (mData.banner_msg.action != undefined && mData.banner_msg.action != null) {
                            saved_banner_action = mData.banner_msg.action;
                            AsyncStorage.setItem(Constants.KEY_IS_VERIFIED, "0");
                        } else {
                            saved_banner_action = "";
                            AsyncStorage.setItem(Constants.KEY_IS_VERIFIED, "1");
                        }
                        
                        EventRegister.emit(Constants.EVENT_BANNER_CHANGED, saved_banner_action);
                        // AsyncStorage.setItem(Constants.KEY_BANNER_ACTION, saved_banner_action);

                        if((mData.banner_msg.action == null || mData.banner_msg.action == "") && mData.userProfileInfo.is_verified == "1") {
                            this.setState({
                                is_verified: "1"
                            })
                        } else {
                            this.setState({
                                is_verified: "0"
                            })
                        }

                        if(mData.eventAttended != null || mData.eventAttended != "") {
                            this.setState({
                                dataEventJoined: mData.eventAttended.toString()
                            })
                        }
                        if(mData.eventHosted != null || mData.eventHosted != "") {
                            this.setState({
                                dataEventCreated: mData.eventHosted.toString()
                            })
                        }
                        if(mData.tripAttended != null || mData.tripAttended != "") {
                            this.setState({
                                dataTripJoined: mData.tripAttended.toString()
                            })
                        }
                        if(mData.tripHosted != null || mData.tripHosted != "") {
                            this.setState({
                                dataTripCreated: mData.tripHosted.toString()
                            })
                        }
                        if(mData.connections != null || mData.connections != "") {
                            this.setState({
                                dataMyConnectionCount: mData.connections.toString()
                            })
                        }
                        if(mData.fans != null || mData.fans != "") {
                            this.setState({
                                dataFans: mData.fans.toString()
                            })
                        }
                        if(mData.following != null || mData.following != "") {
                            this.setState({
                                dataFollowing: mData.following.toString()
                            })
                        }
                        if(mData.myList != null || mData.myList != "") {
                            this.setState({
                                dataMyList: mData.myList.toString()
                            })
                        }
                        if(mData.refer_friends != null || mData.refer_friends != "") {
                            this.setState({
                                dataReferFriends: mData.refer_friends.toString()
                            })
                        }
                        if(mData.sent_gifts != null || mData.sent_gifts != "") {
                            this.setState({
                                dataSentGifts: mData.sent_gifts.toString()
                            })
                        }
                        if(mData.received_gifts != null || mData.received_gifts != "") {
                            this.setState({
                                dataReceivedGifts: mData.received_gifts.toString()
                            })
                        }
                    }

                    if (mData.newUserRegister != undefined && mData.newUserRegister != null) {
                        mData.newUserRegister.map((i, j) => {
                            array_New_Member_Register.push(i);
                        });
                        if (this.state.dataNewMemberRegister.length > 0) {
                            this.setState({
                                displayNewMemberRegister: true
                            });
                        } else {
                            array_New_Member_Register = [];
                            this.setState({
                                displayNewMemberRegister: false
                            });
                        }
                    }

                    if (mData.usersMatchCriteria != undefined && mData.usersMatchCriteria != null) {
                        mData.usersMatchCriteria.map((i, j) => {
                            array_Discover_Feature_Account.push(i);
                        });
                        if (this.state.dataDiscoverFeatureAccountRegister.length > 0) {
                            this.setState({
                                displayDiscoverFeatureAccount: true
                            });
                        } else {
                            array_Discover_Feature_Account = [];
                            this.setState({
                                displayDiscoverFeatureAccount: false
                            });
                        }
                    }

                    if (mData.usersNearYou != undefined && mData.usersNearYou != null) {
                        mData.usersNearYou.map((i, j) => {
                            array_Near_Me_People.push(i);
                        });
                        if (this.state.dataNearMePeople.length > 0) {
                            this.setState({
                                displayNearMePeople: true
                            });
                        } else {
                            array_Near_Me_People = [];
                            this.setState({
                                displayNearMePeople: false
                            });
                        }
                    }

                    if (mData.userImages != undefined && mData.userImages != null) {
                        mData.userImages.map((i, j) => {
                            array_User_Gallery.push(i);
                        });
                        if (this.state.dataUserGallery.length > 0) {
                            this.setState({
                                displayUserGallery: true,
                                animatedValueEmptyGallary: new Animated.Value(
                                    this.state.dataUserGallery.length / 2 * 170
                                )
                            });
                        } else {
                            array_User_Gallery = [];
                            this.setState({
                                displayUserGallery: false
                            });
                        }
                    }

                    if (mData.favouritedMe != undefined && mData.favouritedMe != null) {
                        mData.favouritedMe.map((i, j) => {
                            array_Added_As_You_Favourite.push(i);
                        });
                        if (this.state.dataAddedYouAsFavourite.length > 0) {
                            this.setState({
                                displayAddedYouAsFavourite: true
                            });
                        } else {
                            array_Added_As_You_Favourite = [];
                            this.setState({
                                displayAddedYouAsFavourite: false
                            });
                        }
                    }

                    if(mData.newEvents) {
                        this.setState({
                            myEvents: mData.newEvents
                        })
                    }

                    var profile_feature_count = 0;
                    var profile_feature_count_done = 0;

                    profile_feature_count ++;
                    if(mData.userProfileInfo.first_name == null || mData.userProfileInfo.first_name == "") {
                        profile_feature_count_done ++;
                    }
                    profile_feature_count ++;
                    if(mData.userProfileInfo.last_name == null || mData.userProfileInfo.last_name == "") {
                        profile_feature_count_done ++;
                    }
                    profile_feature_count ++;
                    if(mData.userProfileInfo.email == null || mData.userProfileInfo.email == "") {
                        profile_feature_count_done ++;
                    }

                } else {
                    console.log(TAG, " callGetNearMePeopleAPI result not found")
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
        this.setState({
            temp: true
        }, () => this.callGetUserFeedListAPI(true))
        
    }

    /*
    * call  feed like or unlike
    */
    callFeedLikeUnLikeAPI = async () => {
        try {
            this.setState({
                loading: true
            });

            let uri = Memory().env =="LIVE" ? Global.URL_LIKE_FEED_TIME_LINE : Global.URL_LIKE_FEED_TIME_LINE_DEV;
            if (this.state.feedLikeType == 1) {
                uri = Memory().env =="LIVE" ? Global.URL_UNLIKE_FEED_TIME_LINE : Global.URL_UNLIKE_FEED_TIME_LINE_DEV;
            }
            let params = new FormData();
            params.append("token", this.state.userToken);
            params.append("user_id", this.state.userId);
            params.append("id", this.state.userId);
            params.append("format", "json");
            if (this.state.feedLikeType == 1) { 
                params.append("activity_id", this.state.activityId);
            } else {
                params.append("activityId", this.state.activityId);
            }
            params.append("activityUserId", this.state.activityUserId);

            console.log(TAG + " callFeedLikeUnLikeAPI uri " + uri);
            console.log(TAG + " callFeedLikeUnLikeAPI params " + JSON.stringify(params));

            WebService.callServicePost(
                uri,
                params,
                this.handleFeedLikeUnLikeResponse
            );
        } catch (error) {
            this.setState({
                loading: false,
                activityId: "0",
                activityUserId: "0",
                feedLikeType: 0
            });
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    };

    /**
* handle feed like and unlike API response
*/
    handleFeedLikeUnLikeResponse = (response, isError) => {
        console.log(TAG + " callFeedLikeUnLikeAPI result " + JSON.stringify(response));
        console.log(TAG + " callFeedLikeUnLikeAPI isError " + isError);

        if (!isError) {
            var result = response;
            if (typeof result != undefined && result != null) {
                if (result.status == "success") {
                    this.state.dataUserFeeds.map((i, j) => {
                        if (i.id === this.state.activityId) {
                            i.is_likes = this.state.feedLikeType == 1 ? 0 : 1;
                            i.total_likes = result.total_likes
                        }
                    });
                } else {
                    Alert.alert(result.msg, "");
                }
            }
        } else {
            if (response != undefined && response != null && response.length > 0) {
                Alert.alert(response.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
        this.setState({
            loading: false,
            activityId: "0",
            activityUserId: "0",
            feedLikeType: 0
        });
    };


    /*
    * call  feed share
    */
    callFeedShareAPI = async () => {
        try {
            this.setState({
                loading: true
            });

            let uri = Memory().env == "LIVE" ? Global.URL_SHARE_FEED_TIME_LINE : Global.URL_SHARE_FEED_TIME_LINE_DEV;
            let params = new FormData();
            params.append("token", this.state.userToken);
            params.append("activity_user_id", this.state.userId);
            params.append("user_id", this.state.userId);
            params.append("id", this.state.userId);
            params.append("format", "json");
            params.append("activity_id", this.state.activityId);

            console.log(TAG + " callFeedShareAPI uri " + uri);
            console.log(TAG + " callFeedShareAPI params " + JSON.stringify(params));

            WebService.callServicePost(
                uri,
                params,
                this.handleFeedShareResponse
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
* handle feed share API response
*/
    handleFeedShareResponse = (response, isError) => {
        console.log(TAG + " callFeedShareAPI result " + JSON.stringify(response));
        console.log(TAG + " callFeedShareAPI isError " + isError);

        if (!isError) {
            var result = response;
            if (typeof result != undefined && result != null) {
                
                if (result.status == "success") {
                    array_User_Feed_list = [];
                    pageNumber = 0;
                    this.callGetUserFeedListAPI(true);
                } else {
                    if(response.msg)
                    {
                        Alert.alert(response.msg, "");
                    }else{
                        Alert.alert(Constants.UNKNOWN_MSG, "");
                        //UNKNOWN_MSG
                    }
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


    /*
    * call Report API
    */
   callReportAPI = async (desc) => {
        try {
            this.setState({
                loading: true
            });

            let uri =Memory().env == "LIVE"? Global.URL_BLOCK_USERS: Global.URL_BLOCK_USERS_DEV
            let params = new FormData();

            params.append("token", this.state.userToken);
            params.append("user_id", this.state.userId);
            params.append("block_id", this.state.reportedId);
            params.append("is_block", 0);
            params.append("type", 2);
            params.append("message", desc);
            params.append("format", "json");

            console.log(TAG + " callFeedReportAPI uri " + uri);
            console.log(TAG + " callFeedReportAPI params " + JSON.stringify(params));

            WebService.callServicePost(
                uri,
                params,
                this.handleReportResponse
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
    * handle Report API response
    */
    handleReportResponse = (response, isError) => {
        console.log(TAG + " Response " + response);
        console.log(TAG + " isError " + isError);

        if (!isError) {
            var result = response;
            if (typeof result != undefined && result != null) {
                console.log(TAG + " callReportAPI result " + JSON.stringify(result));
                if (typeof result.msg != undefined && result.msg != null) {
                    if(result.status == 'success') {
                        Alert.alert(
                            'Thank You',
                            result.msg,
                            [
                            {text: 'OK', onPress: () => {}},
                            ],
                            { cancelable: true }
                        )
                    } else{
                        Alert.alert(result.msg.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""))
                    }
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


    callInviteUserAPI = async () => {
        try {
            this.setState({
                loading: true
            });
            const {rowInvitation} = this.state;
            let uri = Memory().env == "LIVE"? Global.URL_INVITE_USER: Global.URL_INVITE_USER_DEV
            let params = new FormData();
            params.append("token", this.state.userToken);
            params.append("user_id", this.state.userId);
            params.append("format", "json");
            for (let index = 0; index < rowInvitation.length; index++) {
                const element = rowInvitation[index];
                params.append("friend_name[]", element.first_name + " " + element.last_name);
                params.append("friend_email[]", element.email);
                params.append("friend_mobile[]", element.phoneNumber);
                params.append("friend_member_type[]", this.state.user_role[element.selected_user_role_index].type);
                if(element.selected_gender_index == 0) {
                    params.append("friend_gender[]", "1");
                } if(element.selected_gender_index == 1) {
                    params.append("friend_gender[]", "2");
                }
            }
            params.append("personal_note", this.state.noteInvitation);

            console.log(TAG + " callInviteUserAPI uri " + uri);
            console.log(TAG + " callInviteUserAPI params " + JSON.stringify(params));

            WebService.callServicePost(
                uri,
                params,
                this.handleInviteUserApiResponse
            );
        } catch (error) {
            this.setState({
                loading: false
            });
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    }

    handleInviteUserApiResponse = (response, isError) => {
        console.log(TAG + "callInviteUserAPI Response " + JSON.stringify(response));
        console.log(TAG + "callInviteUserAPI isError " + isError);

        if (!isError) {
            var result = response;
            Alert.alert('Sent Invitation Successfully.', '');
            this.setState({
                showInvitationPopUp: false, 
                rowInvitation: [{first_name:'', last_name: '', email:'', phoneNumber:'', selected_user_role_index: 6, selected_gender_index: 0}],
                noteInvitation: ""
            })
        } else {
            if (response != undefined && response != null && response.length > 0) {
                Alert.alert(response.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
        this.setState({
            loading: false
        });
    };

    render() {
        return (
            <SafeAreaView style={styles.container} onStartShouldSetResponder={() => Keyboard.dismiss()}>
                <HeaderView
                    logoClick = {() => this.scrolltoTop_mainScrollView()}
                    screenProps = {this.props.rootNavigation}
                    setSearchText = {(text) => this.setState({searchText: text})}
                    handleEditComplete = {() => this.handleEditComplete()}
                    showNotificationPopupView = {() => this.setState({ showNotificationModel: true })}
                    showPopupView = {() => this.setState({ showModel: true })}
                />
                {this.state.pulldown_loading && <PullDownIndicator/>}
                {this.renderMainView()}
                <CustomPopupView
                    showModel = {this.state.showModel}
                    openMyAccountScreen = {this.props.jumpToDashboardTab}
                    logoutUser={this.logoutUser}
                    closeDialog={() => { this.setState({ showModel: false }) }}
                    prop_navigation = {this.props.rootNavigation}
                >
                </CustomPopupView>
                <NotificationPopupView
                    showModel = {this.state.showNotificationModel}
                    openNotificationScreen = {this.props.jumpToDashboardTab}
                    closeDialog={() => { this.setState({ showNotificationModel: false }) }}
                    prop_navigation = {this.props.rootNavigation}
                >
                </NotificationPopupView>
                {this.state.showInvitationPopUp && this.renderInvitationPopUp()}
                {this.state.showPhoneEmailSelectPopUp && this.renderPhoneEmailSelectPopUp()}
                {this.renderReportPopupView()}
                {this.state.loading == true ? <ProgressIndicator /> : null}
                <ActionSheet
                    ref={o => this.ActionSheet = o}
                    title={'Choose an option'}
                    options={[ 'Report', 'Cancel']}
                    cancelButtonIndex={2}
                    onPress={(index) => {
                        console.log(TAG, "index " + index)
                      if (index == 0) {

                          this.setReportModalVisible(true)
                            
                        } else {
                            this.setState({
                                reportData: null
                            })
                        }
                    }}
                />
            </SafeAreaView>

        );
    }

    /**
     * Display block user comfirmation alert
     */
    displayBlockUserDialog = (data) => {
        var sharePost = false;
        let name = data.first_name
        if (data.shared_by_user_id != null && data.user_info != null) {
            name = data.user_info.first_name;
        }
        let title = Constants.LABEL_BLOCK_TITLE.format(name);
        let message = Constants.LABEL_BLOCK_MESSAGE.format(name);

        Alert.alert(title, message,
            [
                {
                    text: 'Block', onPress: () => {

                    }
                },
                {
                    text: 'Cancel', onPress: () => {

                    }
                }],
            { cancelable: false })
    }
    /**
    * get profile info API again
    */
    getDataAgain = (refresh) => {
        if (refresh) {
            this.refreshData();
        }
    }
  
    requestContactPermission = async (invite_index) => {
        // try {
        //     const granted = await PermissionsAndroid.request(
        //         PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
        //         {
        //         title: 'Allow Access Contact?',
        //         message:
        //             'allow this app to read contact information',
        //         buttonNegative: 'Cancel',
        //         buttonPositive: 'OK',
        //         },
        //     );
        //     if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        //         this.selectContact(invite_index);
        //     } else {
                
        //     }
        // } catch (err) {
        //     console.warn(err);
        // }
        this.selectContact(invite_index);
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
        }); 
    }

    renderPhoneEmailSelectPopUp = () => {
        return (
            <View style={{ position:'absolute', width: '100%', height: '100%', top:0, left:0, zIndex: 10, justifyContent: 'flex-end', alignItems: 'center' }}>
                <View style={{position:'absolute', width: '100%', height: '100%', top:0, left:0, backgroundColor:Colors.black, opacity:0.3,}}
                    onStartShouldSetResponder = {() => this.setState({showPhoneEmailSelectPopUp: false})}
                />
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
                                <Text
                                    style={[{
                                        paddingLeft:10,
                                        borderRadius:3,
                                        borderWidth:1,
                                        borderColor:Colors.gray,
                                        width:'70%',
                                        marginTop:10,
                                        paddingVertical:5,
                                        fontSize:12
                                    }, stylesGlobal.font]}
                                >{this.state.selected_contact.name}</Text>
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
                                <Text style={[{
                                        paddingLeft:10,
                                        borderRadius:3,
                                        borderWidth:1,
                                        borderColor:Colors.gray,
                                        width:'70%',
                                        marginTop:10,
                                        paddingVertical:5,
                                        fontSize:12
                                    }, stylesGlobal.font]}
                                >{item.address}</Text>
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
                    <TouchableOpacity style={[{
                            paddingHorizontal:10,
                            paddingVertical:10,
                            backgroundColor:Colors.gold,
                            borderRadius:3,
                            marginBottom:20,
                            width:'50%',
                            alignItems:'center'
                        }, stylesGlobal.shadow_style]}
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
                    >
                        <Text style={[ stylesGlobal.font,{color:Colors.white, fontSize:12}]}>{"Select"}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        )
    }

    renderInvitationPopUp = () => {
        const {rowInvitation} = this.state;

        let notes = this.state.showNotes ? (<TextInput
                value={this.state.noteInvitation}
                multiline
                style={[{
                    paddingLeft:10,
                    borderRadius:3,
                    borderWidth:1,
                    borderColor:Colors.gray,
                    width:'90%',
                    paddingVertical:3,
                    fontSize:12,
                    height: 70,
                    marginBottom:10
                }, stylesGlobal.font]}
                onChangeText={text => {
                    this.setState({noteInvitation: text})
                }}
        />) : null;
        const copyReferlink = (Memory().env == "LIVE"? Global.BASE_URL: Global.BASE_URL_DEV) + 'register?code=' +
                this.state.hash_key + "&type=2#getin_content";
                
        return (
            <View style={stylesGlobal.invite_popup_container_view}>
                <View onStartShouldSetResponder={() => this.setState({showInvitationPopUp: false}) }
                    style={{
                        position:'absolute',
                        width:width,
                        height:height,
                        top:0,
                        left:0,
                        backgroundColor:Colors.black,
                        opacity:0.3
                    }}
                />
                <View style={[stylesGlobal.invite_popup_main_view, {flex: 1, marginBottom: getStatusBarHeight() + getBottomSpace() + 49 + 20}]}>
                {/* {
                    this.state.showReferLink ?
                    <View style={{width:'100%'}}>
                        <Text style={[stylesGlobal.font, {fontSize:15, marginVertical:10, fontWeight:'400'}]}>{"Copy Refer LInk."}</Text>
                        <View style={{backgroundColor:'gray', width:'100%', height:1}}/>
                        <Text style={[stylesGlobal.font, {fontSize:12, marginVertical:10}]}>{copyReferlink}</Text>
                        <View style={{backgroundColor:'gray', width:'100%', height:1}}/>
                        <TouchableOpacity
                            style={{paddingVertical:7,
                                paddingHorizontal:12,
                                backgroundColor:Colors.gold,
                                alignSelf:'flex-end',
                                marginVertical:10,
                                borderRadius:3
                            }}
                            onPress={() => this.setState({showReferLink:false})}
                        >
                            <Text style={[stylesGlobal.font, {fontSize:15, color:Colors.white}]}>{"Back"}</Text>
                        </TouchableOpacity>
                    </View>
                :
                    <View style = {{width: '100%'}}> */}
                        <View style = {{width: '100%', alignItems: 'flex-end', marginTop: 20, paddingHorizontal: 5}}>
                            <TouchableOpacity style = {{width: 15, height: 15,}} onPress = {() => this.setState({showInvitationPopUp: false})}>
                                <Image style = {{width: '100%', height: '100%', tintColor: Colors.gold}} source={require('../icons/connection-delete.png')}/>
                            </TouchableOpacity>
                        </View>
                        <KeyboardAwareScrollView style = {{width: '100%'}} contentContainerStyle={{ alignItems:'center', }} extraScrollHeight={50} keyboardShouldPersistTaps = "handled">
                            <View style = {{width: '100%', alignItems: 'center'}}>
                                <Image style={stylesGlobal.invite_popup_crown_image} source={require('../icons/crown.png')}/>
                                <Text style={[stylesGlobal.font, {fontSize:15, textAlign:'center', marginTop:10}]}>
                                    {"You Have Been Granted Special The .007% Invitation Privileges!"}
                                </Text>
                                <Text style={[stylesGlobal.font, {fontSize:15, color: Colors.gold, textAlign:'center', marginTop:5}]}>
                                    {"Earn 10 Gold Coins For Each Of Your Approved Friends."}
                                </Text>
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
                                                        if(!this.state.popup_value_changed) {
                                                            if(text.length > 0 && text[text.length - 1] == 'a') {
                                                                rowInvitation[0].selected_gender_index = 1;
                                                                rowInvitation[0].selected_user_role_index = 2;
                                                            } else {
                                                                rowInvitation[0].selected_gender_index = 0;
                                                                rowInvitation[0].selected_user_role_index = 6;
                                                            }
                                                        }
                                                        this.setState({
                                                            rowInvitation
                                                        })
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
                                                    if(!this.state.popup_value_changed) {
                                                        if(gender_index == 1) {
                                                            rowInvitation[0].selected_user_role_index = 2;
                                                        } else {
                                                            rowInvitation[0].selected_user_role_index = 6;
                                                        }
                                                    }
                                                    this.setState({
                                                        rowInvitation,
                                                        popup_value_changed: true
                                                    })
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
                                                    this.setState({
                                                        rowInvitation,
                                                        popup_value_changed: true
                                                    })
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
                                                    return (
                                                        <View style = {[{width: '100%', height: 30, resizeMode: 'cover', alignItems: 'center', flexDirection: 'row', marginHorizontal: 10}]}>
                                                            <View style = {{height: '100%', aspectRatio: 1, marginRight: 10}}>
                                                                <Image style = {{width: '100%', height: '100%'}} source = {{uri: member_type_item.badge}}></Image>
                                                            </View>
                                                            <Text style = {[{fontSize: 12, color: Colors.black}, stylesGlobal.font]}>{member_type_item.name}</Text>
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
                                    <Text style = {[{fontSize: 12, color: Colors.black, marginTop: 10}, stylesGlobal.font]}>{"or"}</Text>
                                    <View style = {[stylesGlobal.invite_row_view, {flexDirection: 'column', marginTop: 0}]}>
                                        <Text style = {[{fontSize: 12, color: Colors.black}, stylesGlobal.font]}>{"Instagram"}</Text>
                                        <View style = {stylesGlobal.invite_view_input_view}>
                                            <TextInput
                                                placeholder='@name'
                                                // value={rowInvitation[0].email}
                                                style={[stylesGlobal.invite_view_input_text, stylesGlobal.font]}
                                                onChangeText={text => {
                                                    // rowInvitation[0].email = text;
                                                    // this.setState({rowInvitation})
                                                }}
                                            />
                                        </View>
                                    </View>
                                    <View style = {[stylesGlobal.invite_row_view, {flexDirection: 'column'}]}>
                                        <Text style = {[{fontSize: 12, color: Colors.black}, stylesGlobal.font]}>{"Add a Personal Note (optional)"}</Text>
                                        <View style = {[stylesGlobal.invite_view_input_view, {height: 80}]}>
                                            <TextInput
                                                value={this.state.noteInvitation}
                                                style={[stylesGlobal.invite_view_input_text, stylesGlobal.font, {width: '100%', height: '100%', paddingHorizontal: 5, textAlignVertical: 'top'}]}
                                                multiline = {true}
                                                onChangeText={text => {
                                                    this.setState({noteInvitation: text})
                                                }}
                                            />
                                        </View>
                                    </View>
                                </View>
                                <TouchableOpacity style={[stylesGlobal.invite_view_submit_button, stylesGlobal.shadow_style]}
                                    onPress={()=>{
                                        this.callInviteUserAPI();
                                    }}
                                >
                                    <Text style={[stylesGlobal.invite_view_submit_button_text, stylesGlobal.font]}>{"Send "}{ValidationUtils.isEmailValid(this.state.rowInvitation[0].email) ? "Email" : this.state.rowInvitation[0].phoneNumber != "" ? "SMS" : ""}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[stylesGlobal.invite_view_submit_button, stylesGlobal.shadow_style]} 
                                    onPress={() => {
                                        Clipboard.setString(copyReferlink);
                                        this.setState({
                                            showReferLink: true
                                        })
                                    }}
                                >
                                    <Text style={[ stylesGlobal.invite_view_submit_button_text, stylesGlobal.font]}>{"Copy Link"}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[stylesGlobal.invite_view_submit_button, {marginBottom:20}, stylesGlobal.shadow_style]}
                                    onPress={()=>{
                                        Clipboard.setString(copyReferlink);
                                    }}
                                >
                                    <Text style={[stylesGlobal.invite_view_submit_button_text, stylesGlobal.font]}>{"Share Invite"}</Text>
                                </TouchableOpacity>
                            </View>
                        </KeyboardAwareScrollView>
                    {/* </View> */}
                {/* } */}
                </View>
            </View>
        )
    }

    /** render PopUp Menu
     *
     * @returns {*}
     */

    renderReportPopupView = () => {
        return (
            <CustomReportPopupView
                showModel={this.state.showReportModel}
                callAPI = {this.callReportAPI}
                closeDialog={() => { this.setState({ showReportModel: false }) }}>
            </CustomReportPopupView>
        );
    }

    refreshProfileImage = async () => {
        try {
            var userImagePath = await AsyncStorage.getItem(Constants.KEY_USER_IMAGE_URL);
            var userImageName = await AsyncStorage.getItem(Constants.KEY_USER_IMAGE_NAME);
            this.setState({
                userImagePath: userImagePath,
                userImageName: userImageName
            });
        } catch (error) {
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    }

    logoutUser = async () => {
        this.hidePopupView();

        try {
            this.setState({
                loading: true
            })
            let uri = Memory().env == "LIVE" ? Global.URL_LOGOUT : Global.URL_LOGOUT_DEV;

            let params = new FormData();
            params.append("token", this.state.userToken);
            params.append("user_id", this.state.userId);
            params.append("format", "json");

            console.log(TAG + " callLogoutAPI uri " + uri);
            console.log(TAG + " callLogoutAPI params " + JSON.stringify(params));
            
            WebService.callServicePost(
                uri,
                params,
                this.handleLogoutResponse
            );
        } catch (error) {
            console.log(TAG + " logoutUser error " + error);
            this.setState({
                loading: false
            })
        }
        
    }

    handleLogoutResponse = async(response, isError) => {
        console.log(TAG + " callLogoutAPI Response " + JSON.stringify(response));
        console.log(TAG + " callLogoutAPI isError " + isError);
        
        if (!isError) {
            var result = response;
            if (typeof result != undefined && result != null) {
                if (result.status == "success") {
                    try {
                        await AsyncStorage.setItem(Constants.KEY_USER_ID, "");
                        await AsyncStorage.setItem(Constants.KEY_USER_TOKEN, "");
                        this.props.rootNavigation.navigate("SignInScreen", {isGettingData: false});
                    
                    } catch (error) {
                        console.log(TAG + " logoutUser error " + error);
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
            displayLoadMoreView: false,
            displayLoadMoreLoader: false
        });

    };

    hidePopupView = () => {
        this.setState({
            showModel: false
        })
    }

    showPopupView = () => {
        this.setState({
            showModel: true
        })
    }

    hideNotificationPopupView = () => {
        this.setState({
            showNotificationModel: false
        })
    }

    setReportModalVisible(visible) {
        this.setState({ showReportModel: visible });
    }

    handleSearchIcon = () => {

    }

    /**
    * handle search button click of keybaord
    */
    handleEditComplete = () => {
        searchText = this.state.searchText.trim();
        this.setState({
            searchText: searchText,
        }, () => {
            if(this.state.searchText.length > 0) {
                this.props.jumpToSearchTab(this.state.searchText);
            }
        });
    };


    renderMainView = () => {

        const { navigation } = this.props.rootNavigation;
        const {myEvents} = this.state;
        return (
            <ScrollView style={{flex: 1, backgroundColor: Colors.black, width: "100%", height: "100%",}}
                ref="mainscrollView"
                onScroll={async(e) => {
                    let paddingToBottom = e.nativeEvent.layoutMeasurement.height;
                    let contentOffset = e.nativeEvent.contentOffset.y + 250;
                    let contentSize = e.nativeEvent.contentSize.height;
                    let diff = contentSize - paddingToBottom;
                    if (contentOffset >= diff) {
                        if (this.state.isLoadMoreUserFeeds) {
                            this.setState({
                                displayLoadMoreView: true,
                            }, () => {
                                this.getNextRecords(), this.setState({
                                    displayLoadMoreLoader: true
                                })
                            })
                        }
                    }
                    if(e.nativeEvent.contentOffset.y < -10) {
                        try {
                            var location = await AsyncStorage.getItem(Constants.LOCATION);
                            this.setState({
                                pulldown_loading: true
                            })
                            this.refreshEventData(true);
                            
                        } catch(error) {
                            console.log(error);
                        }
                        
                    } else {
                        
                    }
                }}
                scrollEventThrottle={800}
            >
                <View>
                    <BannerView screenProps = {this.props.rootNavigation} />
                    <InviteBannerView screenProps = {this.props.rootNavigation} jumpToEventTab={this.props.jumpToEventTab} jumpToTravelTab={this.props.jumpToTravelTab} setLoading = {(status) => this.setState({loading: status})}/>
                {
                    this.state.displayProfileInfo &&
                    this.renderProfileInfo
                }
                {
                    myEvents.length != 0 &&
                    this.renderEvents()
                }
                {
                    this.state.birthday_users != null && this.state.birthday_users.length > 0 &&
                    this.renderBirthdayView()
                }
                        {/*  This is unused part  */}
                {/* {
                    this.state.displayNewMemberRegister == true &&
                    this.renderNewMemberRegister
                } */}
                        {/*  This is unused part  */}
                {
                    !this.state.loading && this.state.dataRecentLogin.length > 0 &&
                    this.renderRecentLogin
                }
                {
                    this.state.displayDiscoverFeatureAccount == true &&
                    this.renderDiscoverFeatureAccount
                }

                {/* {
                    this.state.displayNearMePeople == true &&
                    this.renderNearMePeople
                } */}

                {
                    this.state.displayAddedYouAsFavourite == true &&
                    this.renderAddedYouAsFavourite
                }
                {
                    !this.state.loading && this.state.is_verified == "1" && this.state.is_special == "1" &&
                    this.renderPrivilegeInvition()
                }
                {
                    !this.state.loading && this.state.is_verified == "1" && this.state.member_plan != "4" && this.state.member_plan != "7" && 
                    this.shareNew()
                }
                {
                    this.state.displayUserFeeds == true && this.state.dataUserFeeds.length > 0 &&
                    this.renderUserPosts()
                }
                </View>
            </ScrollView>
        );
    };
        
    renderBirthdayView = () => {
        return (
            <View style={[styles.cardView]}>
                <Image style = {{position: 'absolute', width: '40%', height: '80%', right: 0, bottom: 0}} resizeMode = {'contain'} source={require( "../icons/birthday_balloon.png")}/>
                <View style={styles.labelView}>
                    <Text style={[styles.label, stylesGlobal.font]}>{"Wish a Happy Birthday!"}</Text>
                </View>
                <FlatList
                    style = {{width: '100%'}}
                    extraData={this.state}
                    paddingLeft={5}
                    paddingRight={5}
                    horizontal={true}
                    pagingEnabled={false}
                    showsHorizontalScrollIndicator={false}
                    showsVerticalScrollIndicator={false}
                    data={this.state.birthday_users}
                    keyExtractor={(item, index) => index.toString()}
                    renderItem={({ item }) => (
                        <RowDiscoverFeatureAccount
                            data={item}
                            screenProps={this.props.rootNavigation}
                            userId={this.state.userId}
                            refreshProfileImage={this.refreshProfileImage}
                        />
                    )}
                />
                {/* <View style = {{width: '100%', alignItems: 'center', marginTop: 10, marginBottom: 10}}>
                    <TouchableOpacity style = {[styles.button, stylesGlobal.shadow_style]}>
                        <Text style = {[styles.buttonText, stylesGlobal.font]}>BUY A GIFT</Text>
                    </TouchableOpacity>
                </View> */}
            </View>
        )
    }

    renderEvents = () => {
        const {myEvents} = this.state;
        return(
            <View style={[styles.cardView,]}>
                <View style = {{width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', }}>
                    <View style={[styles.labelView, {alignItems: 'center', justifyContent: 'space-between'}]}>
                        <Text style={[styles.label, stylesGlobal.font]}>{"Current Parties And Trips"}</Text>
                        <TouchableOpacity onPress={() => this.props.jumpToEventTab(0)}>
                            <Text style={[stylesGlobal.font, {color:Colors.gold}]}>{Constants.LABEL_VIEW_ALL}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
                
                <FlatList
                    style = {{width: '100%',}}
                    columnWrapperStyle = {{width: '100%', justifyContent: 'space-between', marginBottom: 10}}
                    extraData={this.state}
                    numColumns = {2}
                    showsVerticalScrollIndicator={false}
                    keyExtractor={(item, index) => index.toString()}
                    data={myEvents.length > 4 ? myEvents.slice(0, 4) : myEvents}
                    renderItem={({item, index}) => {
                        const {imgpath, image, id, title} = item;
                        return(
                            <View style = {{width: '48%'}}>
                                <TouchableOpacity style = {{width: '100%'}}
                                    onPress={() => {
                                        this.props.rootNavigation.navigate("EventDetail", {
                                            eventId: id,
                                            refreshEventData: () => {},
                                            EventCategory: item.cat_id == "10" ? "travel" : "party"
                                        })
                                }}>
                                    <ImageCompressor style={{width: '100%', aspectRatio: 1}} uri={imgpath + Constants.THUMB_FOLDER + image} />
                                    <Text style={[stylesGlobal.font, styles.label, {color:Colors.gold, marginTop: 5}]}>{title}</Text>
                                </TouchableOpacity>
                            {
                                item.is_hidden && 
                                <InvisibleBlurView>
                                    <Image style = {stylesGlobal.hidden_lock_image} source = {require("../icons/signin_password.png")}></Image>
                                    <Text style = {[{fontSize: 14, color: Colors.gold, marginTop: 5}, stylesGlobal.font]}>{"Invisible"}</Text>
                                </InvisibleBlurView>
                            }
                            </View>
                        )
                    }}
                />
            </View>
        )
    }

    renderPrivilegeInvition = () => {
       return(
            // <View style={{ width: width-20, borderRadius:10, backgroundColor:Colors.white, alignSelf:'center', marginBottom: 15, alignItems:'center', paddingHorizontal:15}}>
            <View style = {styles.cardView}>
                <Image style={{width: 30, height:30, marginTop: 15, resizeMode:'contain'}} source={require('../icons/crown.png')}/>
                <Text style={[stylesGlobal.font, {fontSize:15, textAlign:'center', marginTop:10}]}>
                    You Have Been Granted Special Invitation Privileges!
                </Text>
                <Text style={[stylesGlobal.font, {fontSize:15, color: Colors.gold, textAlign:'center', marginTop:5}]}>
                    Earn 10 Gold Coins For Each Of Your Approved Friends.
                </Text>
                <TouchableOpacity style={[{paddingHorizontal:15, paddingVertical:10, borderRadius:3, backgroundColor:Colors.gold, marginVertical:15}, stylesGlobal.shadow_style]}
                        onPress={()=> {
                        this.setState({
                            showInvitationPopUp: true, 
                            rowInvitation: [{first_name:'', last_name: '', email:'', phoneNumber:'', selected_user_role_index: 6, selected_gender_index: 0}], 
                            showNotes: false, 
                            noteInvitation: '', 
                            popup_value_changed: false
                        })
                    }}
                >
                    <Text style={[stylesGlobal.font, {color:Colors.white, fontSize:14}]}>{"Invite Friends into The 0.07%"}</Text>
                </TouchableOpacity>
            </View>
       )
    }
    /** render users's profile data
     *
     * @returns {*}
     */
    get renderProfileInfo() {
        return (
            <RowProfileInfo
                data={this.state.dataProfileInfo}
                eventCreated={this.state.dataEventCreated}
                eventJoined={this.state.dataEventJoined}
                tripCreated={this.state.dataTripCreated}
                tripJoined={this.state.dataTripJoined}
                connections={this.state.dataMyConnectionCount}
                fans={this.state.dataFans}
                following={this.state.dataFollowing}
                rose={this.state.dataRose}
                mylist = {this.state.dataMyList}
                referFriends = {this.state.dataReferFriends}
                sentGifts = {this.state.dataSentGifts}
                receivedGifts = {this.state.dataReceivedGifts}
                screenProps={this.props.rootNavigation}
                switchTab={this.switchTab}
                // gender = {this.state.gender}
                refreshProfileImage={this.refreshProfileImage}
                is_verified = {this.state.is_verified}
            />
        );
    }

    /**
* handle switch to another tab
*/
    switchTab = (tab_name, index) => {
        if(tab_name == "party") {
            this.props.jumpToEventTab(index);
        } else if(tab_name == "trip") {
            this.props.jumpToTravelTab(index);
        }
    }

    /** toggle Gallery on/off
     *
     * @returns {*}
     */
    get renderOpenRenderButton() {
        return (
            <TouchableOpacity style={{padding: 10, borderWidth: 2, borderColor: Colors.white, margin: cardMargin, flexDirection: "row", justifyContent: "center", alignItems: "center", alignSelf: "flex-start"}}
                onPress={() => {
                    this.animateGallaryView();
                }}
            >
                <Text style={[{textAlign: "center", backgroundColor: Colors.transparent, color: Colors.white}, stylesGlobal.font_bold]}>{"Gallery"}</Text>
                <Image style={{ margin: 5 }} source={this.state.isGallaryOpen ? require("../icons/icon_up.png") : require("../icons/icon_down.png")}/>
            </TouchableOpacity>
        );
    }

    /** render empty gallery view
     *
     * @returns {*}
     */
    get renderUserEmptyGallery() {
        const animatedStyle = {
            height: this.state.animatedValueEmptyGallary
        };
        var userStyle = this.state.isGallaryOpen ? cardMargin : 0;
        return (
            <Animated.View style={[
                    {
                        backgroundColor: Colors.transparent,
                        paddingTop: userStyle,
                        paddingLeft: cardMargin,
                        paddingRight: cardMargin,
                        paddingBottom: cardMargin
                    },
                    animatedStyle
                ]}
            >
                <View style={{backgroundColor: Colors.white, borderRadius: 10, paddingLeft: cardLeftRightPadding, paddingRight: cardLeftRightPadding}}>
                    <View style={styles.labelView}>
                        <Image style={styles.labelIcon} source={require("../icons/profile_location.png")}/>
                        <Text style={[styles.label, stylesGlobal.font]}>{Constants.LABEL_GALLERY}</Text>
                    </View>
                    <View style={styles.labelView}>
                        <Image style={styles.labelIcon} source={require("../icons/profile_location.png")}/>
                        <Text style={[styles.label, stylesGlobal.font]}>Add your gallery albums</Text>
                    </View>
                </View>
            </Animated.View>
        );
    }

    /** animate the gallery view while its open/close
     *
     */
    animateGallaryView = () => {
        if (this.state.isGallaryOpen) {
            if (this.state.displayUserGallery) {
                this.setState({
                    isGallaryOpen: !this.state.isGallaryOpen
                });
                Animated.stagger(0, [
                    Animated.timing(this.state.animatedValueEmptyGallary, {
                        toValue: 0,
                        duration: 300
                    })
                ]).start();
            } else {
                this.setState({
                    isGallaryOpen: !this.state.isGallaryOpen
                });
                Animated.stagger(0, [
                    Animated.timing(this.state.animatedValueEmptyGallary, {
                        toValue: 0,
                        duration: 300
                    })
                ]).start();
            }
        } else {
            if (this.state.displayUserGallery) {
                this.setState({
                    isGallaryOpen: !this.state.isGallaryOpen
                });
                Animated.stagger(0, [
                    Animated.timing(this.state.animatedValueEmptyGallary, {
                        toValue: this.state.dataUserGallery.length / 2 * 170,
                        duration: 300
                    })
                ]).start();
            } else {
                this.setState({
                    isGallaryOpen: !this.state.isGallaryOpen
                });
                Animated.stagger(0, [
                    Animated.timing(this.state.animatedValueEmptyGallary, {
                        toValue: 100,
                        duration: 300
                    })
                ]).start();
            }
        }
    };

    /** render new member registration
     *
     * @returns {*}
     */
    get renderNewMemberRegister() {
        var userStyle = this.state.isGallaryOpen ? cardMargin : 0;

        return (
            <View style={[styles.cardView]}>
                <View style={styles.labelView}>
                    <Text style={[styles.label, stylesGlobal.font]}>{Constants.LABEL_NEW_MEMBER_JOINTED}</Text>
                </View>
                <FlatList
                    extraData={this.state}
                    paddingLeft={5}
                    paddingRight={5}
                    horizontal={true}
                    pagingEnabled={false}
                    showsHorizontalScrollIndicator={false}
                    showsVerticalScrollIndicator={false}
                    data={this.state.dataNewMemberRegister}
                    keyExtractor={(item, index) => index.toString()}
                    renderItem={({ item }) => (
                        <RowNewMemberRegister
                            data={item}
                            screenProps={this.props.rootNavigation}
                            userId={this.state.userId}
                            refreshProfileImage={this.refreshProfileImage}
                        />
                    )}
                />
            </View>
        );
    }

    get renderRecentLogin() {
        return (
            <View style={[styles.cardView]}>
                <View style={styles.labelView}>
                    <Text style={[styles.label, stylesGlobal.font]}>{Constants.LABEL_RECENT_LOGIN}</Text>
                </View>
                <FlatList
                    extraData={this.state}
                    paddingLeft={5}
                    paddingRight={5}
                    horizontal={true}
                    pagingEnabled={false}
                    showsHorizontalScrollIndicator={false}
                    showsVerticalScrollIndicator={false}
                    data={this.state.dataRecentLogin}
                    keyExtractor={(item, index) => index.toString()}
                    renderItem={({ item }) => (
                        <RowRecentLogin
                            data={item}
                            screenProps={this.props.rootNavigation}
                            userId={this.state.userId}
                            refreshProfileImage={this.refreshProfileImage}
                        />
                    )}
                />
            </View>
        );
    }


    /** render promoted accounts
     *
     * @returns {*}
     */
    get renderDiscoverFeatureAccount() {
        return (
            <View style={[styles.cardView]}>
                <View style={styles.labelView}>
                    <Text style={[styles.label, stylesGlobal.font]}>{Constants.LABEL_DISCOVER_FEATRE_ACCOUNT}</Text>
                </View>
                <FlatList
                    style = {{width: '100%'}}
                    extraData={this.state}
                    paddingLeft={5}
                    paddingRight={5}
                    horizontal={true}
                    pagingEnabled={false}
                    showsHorizontalScrollIndicator={false}
                    showsVerticalScrollIndicator={false}
                    data={this.state.dataDiscoverFeatureAccountRegister}
                    keyExtractor={(item, index) => index.toString()}
                    renderItem={({ item }) => (
                        <RowDiscoverFeatureAccount
                            data={item}
                            screenProps={this.props.rootNavigation}
                            userId={this.state.userId}
                            refreshProfileImage={this.refreshProfileImage}
                        />
                    )}
                />
            </View>
        );
    }

    /** render near me people accounts
     *
     * @returns {*}
     */

    get renderNearMePeople() {
        return (
            <View style={[styles.cardView]}>
                <View style={styles.labelView}>

                    {/* <Image
                        style={styles.labelIcon}
                        source={require("../icons/profile_location.png")}
                    />

                    <Text style={[styles.label, stylesGlobal.font]}>{Constants.LABEL_PEOPLE_NEAR_ME}</Text> */}
                </View>
                <FlatList
                    extraData={this.state}
                    paddingLeft={5}
                    paddingRight={5}
                    horizontal={true}
                    pagingEnabled={false}
                    showsHorizontalScrollIndicator={false}
                    showsVerticalScrollIndicator={false}
                    data={this.state.dataNearMePeople}
                    keyExtractor={(item, index) => index.toString()}
                    renderItem={({ item }) => (
                        <RowNearMePeople
                            data={item}
                            screenProps={this.props.rootNavigation}
                            userId={this.state.userId}
                            refreshProfileImage={this.refreshProfileImage}
                        />
                    )}
                />
            </View>
        );
    }

    /** render people who has added me as a favourite accounts
     *
     * @returns {*}
     */

    get renderAddedYouAsFavourite() {
        return (
            <View style={[styles.cardView]}>
                <View style={[styles.labelView]}>
                    <Text style={[styles.label, stylesGlobal.font]}>{Constants.LABEL_ADDED_YOU_AS_FAVOURITE}</Text>
                    <TouchableOpacity style={styles.viewAllView}
                        onPress={() => {
                            this.props.rootNavigation.navigate("MyListsNavigation", {list_show: "favorited_me"});
                        }}
                    >
                        <Text style={[styles.viewAllText, stylesGlobal.font]}>{Constants.LABEL_VIEW_ALL}</Text>
                    </TouchableOpacity>
                </View>

                <FlatList
                    style = {{width: '100%'}}
                    extraData={this.state}
                    pagingEnabled={false}
                    showsHorizontalScrollIndicator={false}
                    showsVerticalScrollIndicator={false}
                    data={this.state.dataAddedYouAsFavourite}
                    keyExtractor={(item, index) => index.toString()}
                    renderItem={({ item }) => (
                        <RowAddedYouAsFavourite
                            data={item}
                            itemMargin={cardMargin}
                            itemPadding={cardLeftRightPadding}
                            screenProps={this.props.rootNavigation}
                            userId={this.state.userId}
                            refreshProfileImage={this.refreshProfileImage}
                        />
                    )}
                />
            </View>
        );
    }

    /** render all user posts
     *
     * @returns {*}
     */
    selectVideoTapped=()=> {
        const options = {
          title: 'Video Picker',
          takePhotoButtonTitle: 'Take Video...',
          mediaType: 'video',
          videoQuality: 'medium',
        };

        ImagePicker.showImagePicker(options, (response) => {
            console.log('Response = ', JSON.stringify(response));
            if (response.didCancel) {
                console.log('User cancelled video picker');
            } else if (response.error) {
                console.log('ImagePicker Error: ', response.error);
            } else if (response.customButton) {
                console.log('User tapped custom button: ', response.customButton);
            } else {
                // RNThumbnail.get(response.uri).then((result) => {
                //     this.setState({thumbnailUri: result.path})
                // })
                createThumbnail({url: response.uri})
                .then(responseThumbnail => {
                    console.log("--------", responseThumbnail)
                    this.setState({
                        thumbnailUri: "file://" + responseThumbnail.path,
                        videoSource: response.uri,
                    })
                })
                .catch(error => {
                    console.log({error})
                })
                // this.setState({
                //     videoSource: response.uri,
                // });
            }
        });
    }

    showImagePicker = () => {
        var options = {
            title: 'Select Image',
            mediaType: 'photo',
            quality: 1.0,
            allowsEditing: false,
            noData: true,
            storageOptions: {
                skipBackup: true,
                path: 'images'
            }
        };
        ImagePicker.showImagePicker(options, (response) => {
            if (response.didCancel) {
                console.log('User cancelled image picker');
            } else if (response.error) {
                console.log('ImagePicker Error: ', response.error);
            } else if (response.customButton) {
                console.log('User tapped custom button: ', response.customButton);
            } else {
                console.log(response)
                this.setState({
                    valueEventImage: response.uri,
                });
            }
        });
    }

    shareNew = () =>{
        let imagePrivacy=this.state.privacyValue==='Public'?require('../icons/publicVisibility.png'):require('../icons/memberVisibility.png')
        dataPrivacy=[{
            value: 'Public',
          }, {
            value: 'Member',
        }]
        let imageUrl = this.state.userImagePath + Constants.THUMB_FOLDER + this.state.userImageName;
        
        return(
            <View style={[styles.cardView]}>
                <View style={{flexDirection: 'row', width: '100%',height: 80, marginTop:10, borderBottomWidth: 1, borderColor: Colors.gray,}}>
                    <ImageCompressor style={{width: 50, height: 50,  borderRadius: 50 / 2, backgroundColor: Colors.black, overflow: "hidden"}} uri={imageUrl}/>
                    <View style={{height:80, width:'90%'}}>
                        <TextInput style={[{paddingLeft: 10, width: '90%', }, stylesGlobal.font]}
                            onChangeText={(text) => {
                                this.setState({ postText: text, });
                            }}
                            multiline={true}
                            value={this.state.postText}
                            underlineColorAndroid='white'
                            onFocus={()=>this.setState({newUpdate:'text'})}
                            placeholder='SHARE AN UPDATE'
                        />
                    </View>
                </View>
            {
                this.state.valueEventImage !== '' &&
                <TouchableOpacity style={{marginTop:10,borderRadius:10,overflow:'hidden'}} activeOpacity={.8} onPress={() => this.showImagePicker()}>
                    {/* <FitImage source={{ uri: this.state.valueEventImage }} style={ { position: 'absolute',height: 300, width:'100%'  }} resizeMode={"cover"}/> */}
                    <ImageBackground source={{ uri: this.state.valueEventImage }} style={{ width:'100%', aspectRatio: 1 }} resizeMode='cover'>
                        <View style={{flex:1,backgroundColor:'rgba(0, 0, 0, 0.05)', justifyContent:'center',alignItems:'center'}}>
                        {
                            this.state.newUpdateLoader? <ProgressIndicator/>:
                            <Text style={[{color:Colors.white,fontSize:18}, stylesGlobal.font]}>Change Image</Text>
                        }
                        {
                            !this.state.newUpdateLoader?
                            <TouchableOpacity style={{position:'absolute', top:10, right:8, justifyContent:'center', alignItems:'center', backgroundColor:'transparent'}}
                                onPress={()=> {
                                    this.setState({valueEventImage: ''});
                                }}
                            >
                                <Image style={{width:30, height:30, resizeMode:'contain', tintColor: Colors.gold}} source={require('../icons/ic_delete.png')}/>
                            </TouchableOpacity> : null
                        }
                        </View>
                    </ImageBackground>
                </TouchableOpacity>
            }
            { 
                this.state.thumbnailUri !== '' && this.state.videoSource ?
                <TouchableOpacity style={{marginTop:10,borderRadius:10,overflow:'hidden'}} activeOpacity={.8} onPress={()=>this.selectVideoTapped()}>
                    <ImageBackground source={{ uri: this.state.thumbnailUri }} style={{ height: 300, width:'100%', }} resizeMode='cover'>
                        <View style={{flex: 1, backgroundColor:'rgba(0, 0, 0, 0.83)', justifyContent: 'center',alignItems: 'center'}}>
                        {
                            this.state.newUpdateLoader? <ProgressIndicator/> :
                            <Text style={[{color:Colors.white,fontSize:18}, stylesGlobal.font]}>Change Video</Text>
                        }
                        {
                            !this.state.newUpdateLoader ?
                            <TouchableOpacity style={{position:'absolute', top:10, right:8, justifyContent:'center', alignItems:'center', backgroundColor:'transparent'}}
                                onPress={() => {
                                    this.setState({videoSource:''});
                                }}
                            >
                                <Image style={{width:30, height:30, resizeMode:'contain', tintColor: Colors.gold}} source={require('../icons/ic_delete.png')}/>
                            </TouchableOpacity> : null
                        }
                        </View>
                    </ImageBackground>
                </TouchableOpacity> : null
            }
                <View style={{flexDirection:'row',width:'100%', paddingHorizontal:5, justifyContent:'space-between', height:50}}>
                    <View style={{ width: '60%', height: 50, paddingTop:15, flexDirection:'row', alignItems: 'center'}}>
                        <TouchableOpacity style={{height:30, marginRight: 15, flexDirection: 'row', alignItems: 'flex-end'}} 
                            onPress={() =>{this.setState({newUpdate:'photo'},() => this.showImagePicker())}}>
                            <Image style={{width: 30, aspectRatio: 1.32}} resizeMode = {'contain'} source={require('../icons/ic_register_profile_camera.png')}/>
                        </TouchableOpacity>
                        <TouchableOpacity style={{height: 30, flexDirection: 'row', alignItems: 'flex-end'}}
                            onPress={() => {this.setState({newUpdate:'video'},() => this.selectVideoTapped())}}>
                            <Image style={{width: 30, aspectRatio: 1.65}} resizeMode = {'contain'} source={require('../icons/icon_video.png')}/>
                        </TouchableOpacity>
                    </View>

                    <View style={{width:'40%', height:50,paddingRight: 10, paddingTop: 10, flexDirection:'row', justifyContent:'space-between'}}>
                        <ModalDropdown 
                            style = {{height: '100%', marginRight: 20}}
                            dropdownStyle = {{height: 35 * 5 + 5 * 6, paddingLeft: 5, paddingTop: 5, paddingRight: 5, backgroundColor: '#ffffff', borderRadius: 3, borderColor: '#000000', borderWidth: 1}}
                            defaultIndex = {0}
                            options = {this.state.category_array}
                            onSelect = {(index) => {
                                this.setState({
                                    selected_category: index,
                                });
                            }}
                            renderButton = {() => {
                                return (
                                    <View style={{width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center'}}>
                                        <Image style={{width: 30, height: 30, resizeMode: 'contain'}} source={this.state.category_array[this.state.selected_category].icon_path}/>
                                    </View>
                                )
                            }}
                            renderRow = {(item, index, highlighted) => {
                                return (
                                    <View style = {[styles.visibility_button, this.state.selected_category == index ? {backgroundColor: Colors.gold} : {backgroundColor: Colors.black}]}>
                                        <Image style = {{width: 20, height:20, marginLeft: 8}} resizeMode = {'contain'} source={item.icon_path}/> 
                                        <Text style = {[styles.visibility_text, stylesGlobal.font, {marginLeft: 5}]}>{item.label}</Text>
                                    </View>
                                )
                            }}
                        />

                        <TouchableOpacity style={[{paddingVertical:10, flex: 1, backgroundColor:Colors.gold, borderRadius:5, justifyContent:'center', alignItems:'center'}, stylesGlobal.shadow_style]}
                            onPress={() => this.postNewUpdateAPI()}
                        >
                            <Text style={[{color:Colors.white, fontSize: 15}, stylesGlobal.font]}>Post</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        );
    }

    renderUserPosts = () => {
        let footerView = (
            <View style={{backgroundColor: Colors.white, height: 35, justifyContent: 'center', alignItems: 'center'}}>
            {
                this.state.displayLoadMoreLoader == false ? null :
                <Image style = {{width: 50, height: 50}} resizeMode = {'contain'} source={require("../icons/loader.gif")}/>
            }
            </View>
        );

        return (
            <View style={[styles.cardView, {paddingBottom: 60, paddingLeft: 0, paddingRight: 0,}]}>
                <View style={{width: '100%', height: 40, backgroundColor: Colors.card_titlecolor, justifyContent: 'center', alignItems: 'center', marginBottom: 10}}>
                    <Text style={[{fontSize: 20, color: Colors.gold}, stylesGlobal.font]}>FEED</Text>
                </View>
                <View style = {{width: '100%', paddingLeft: cardLeftRightPadding, paddingRight: cardLeftRightPadding,}}>
                    <FlatList
                        ListFooterComponent={this.state.displayLoadMoreView == true ? footerView : null}
                        extraData={{props: this.props, state: this.state}}
                        pagingEnabled={false}
                        showsHorizontalScrollIndicator={false}
                        showsVerticalScrollIndicator={false}
                        data={this.state.dataUserFeeds}
                        keyExtractor={(item, index) => index.toString()}
                        renderItem={({ item, index }) => (
                            <RowUserPost
                                data={item}
                                index={index}
                                screenProps={this.props.rootNavigation}
                                likeUnLikeFeed={this.likeUnLikeFeed}
                                shareFeed={this.shareFeed}
                                refreshFeedCommentCount={this.refreshFeedCommentCount}
                                userId={this.state.userId}
                                showReportFlag={this.showReportFlag}
                                refreshProfileImage={this.refreshProfileImage}
                                refreshEventData={this.refreshEventData}
                                callChangePostVisibilityAPI={this.callChangePostVisibilityAPI}
                                callDeletePostAPI={this.callDeletePostAPI}
                                is_verified = {this.state.is_verified}
                                member_plan = {this.state.member_plan}
                            />
                        )}
                    />
                </View>
            </View>
        );
    }
    
    //////  change visibility
    callChangePostVisibilityAPI = (postId, postVisibility) => {
        console.log(TAG, "callChangePostVisibilityAPI postId=>" + postId);
        console.log(TAG, "callChangePostVisibilityAPI postVisibility=>" + postVisibility);
        
        try {
            this.setState({
                loading: true,
                postId: postId,
                postVisibility: postVisibility
            });

            let uri = Memory().env == "LIVE" ? Global.URL_CHANGE_POST_VISIBILITY :Global.URL_CHANGE_POST_VISIBILITY_DEV;
            let params = new FormData();
            params.append("token", this.state.userToken);
            params.append("user_id", this.state.userId);
            params.append("format", "json");
            params.append("post_id", postId);
            params.append("visibility", postVisibility);

            console.log(TAG + " callChangePostVisibilityAPI uri " + uri);
            console.log(TAG + " callChangePostVisibilityAPI params " + JSON.stringify(params));

            WebService.callServicePost(
                uri,
                params,
                this.handleChangePostVisibilityResponse
            );
        } catch (error) {
            this.setState({
                loading: false
            });
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    }

    handleChangePostVisibilityResponse = (response, isError) => {
        console.log(TAG + " Response " + response);
        console.log(TAG + " isError " + isError);

        if (!isError) {
            var result = response;
            if (typeof result != undefined && result != null) {
                console.log(TAG + " callChangePostVisibilityAPI result " + JSON.stringify(result));
                array_User_Feed_list.map((item, index) => {
                    if (item.id == this.state.postId) {
                        item.visibility = this.state.postVisibility;
                    }
                })
                this.setState({
                    dataUserFeeds: array_User_Feed_list,
                    postId: "",
                    postVisibility: ""
                })
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

//////////////  user post delete
    callDeletePostAPI = (postId, postVisibility) => {
        console.log(TAG, "callDeletePostAPI postId=>" + postId);
        console.log(TAG, "callDeletePostAPI postVisibility=>" + postVisibility);
        try {
            this.setState({
                loading: true,
                postId: postId,
                postVisibility: postVisibility
            });

            let uri =  Memory().env == "LIVE" ? Global.URL_DELETE_POST : Global.URL_DELETE_POST_DEV;
            let params = new FormData();
            params.append("token", this.state.userToken);
            params.append("user_id", this.state.userId);
            params.append("format", "json");
            params.append("post_id", postId);

            console.log(TAG + " callDeletePostAPI uri " + uri);
            console.log(TAG + " callDeletePostAPI params " + JSON.stringify(params));

            WebService.callServicePost(
                uri,
                params,
                this.handleDeletePostResponse
            );
        } catch (error) {
            this.setState({
                loading: false
            });
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    }

    /**
         * handle delete post  API response
         */
    handleDeletePostResponse = (response, isError) => {
        console.log(TAG + " callDeletePostAPI Response " + response);
        console.log(TAG + " callDeletePostAPI isError " + isError);

        if (!isError) {
            var result = response;
            if (typeof result != undefined && result != null) {
                let tempArray = [];
                array_User_Feed_list.map((item, index) => {
                    if (item.id == this.state.postId) {
                        console.log(TAG, "Post Found " + item.id)
                    } else {
                        tempArray.push(item);
                    }
                })

                array_User_Feed_list = tempArray.slice();
                this.setState({
                    dataUserFeeds: array_User_Feed_list,
                    postId: "",
                    postVisibility: ""
                })
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

    /**
* repor flag button click
*/
    showReportFlag = (data) => {
        this.setState({
            reportedId: data
        })
        this.ActionSheet.show()
    }

    /**
* feed like and unlike button click
*/
    likeUnLikeFeed = (data) => {
        console.log(TAG, "likeUnLikeFeed called");
        var type = (data.is_likes == 1 ? 1 : 0);
        this.setState({
            activityId: data.id,
            activityUserId: data.user_id,
            feedLikeType: type //1: unlike other 0: like
        }, () => {
            this.callFeedLikeUnLikeAPI();
        });
    }
    /**
   * feed share button click
   */
    shareFeed = (data) => {
        console.log(TAG, "shareFeed called");
        this.setState({
            activityId: data.id,
        }, () => {
            this.callFeedShareAPI();
        });
    }

    /**
* refresh feed comment count
*/
    refreshFeedCommentCount = (isRefresh, activityId, commentCount) => {
        if (isRefresh) {
            this.state.dataUserFeeds.map((i, j) => {
                if (i.id === activityId) {
                    i.total_comments = commentCount
                }
            });
            this.setState({
                activityId: "0",
                activityUserId: "0",
                feedLikeType: 0
            })
        }
    }

    /**
 * auto load next feed list data
 */
    getNextRecords = () => {

        if (!this.state.loading && !this.state.displayLoadMoreLoader) {
            console.log("getNextRecords called");
            if (this.state.isLoadMoreUserFeeds) {
                console.log("getNextRecords called 1");
                this.callGetUserFeedListAPI(false);
            } else {
                console.log("getNextRecords called 3");
                this.setState({
                    isLoadMoreUserFeeds: false,
                    displayLoadMoreView: false,
                    displayLoadMoreLoader: false
                })
            }
        }
    }

    /** navigate to perticular screen
     *
     * @returns {*}
     */

    _navigateTo = routeName => {
        
        this.props.rootNavigation.navigate(routeName)
    };


    /**
   * change profile view popup
   */
    chageStateValue = () => {
        this.setState({
            showModel: !this.state.showModel
        })
    }


    /**
 * relaod data after delete event
 */
    refreshEventData = (isRefresh) => {
        
        if (isRefresh) {
            array_User_Feed_list = [];
            array_Near_Me_People = [];
            array_Added_As_You_Favourite = [];
            array_Discover_Feature_Account = [];
            pageNumber = 0;
            this.callGetNearMePeopleAPI();
            // this.callGetUserFeedListAPI(true);
        }
    }
}

const styles = StyleSheet.create({
    exampleContainer: {
        marginBottom: 30,
        marginTop: 20,
        backgroundColor: Colors.white,
        flexDirection: "column",
        borderRadius: 10
    },
    title: {
        paddingHorizontal: 30,
        backgroundColor: "transparent",
        color: "rgba(255, 255, 255, 0.9)",
        fontSize: 21,
        fontWeight: "bold",
        textAlign: "center"
    },
    gradient: {
        ...StyleSheet.absoluteFillObject
    },
    scrollview: {
        flex: 1,
        paddingTop: 50
    },
    container: {
        flex: 1,
        width: '100%',
        height: '100%',
        backgroundColor: Colors.black,
    },
    labelView: {
        width: "100%",
        flexDirection: "row",
        paddingBottom: 5,
        paddingTop: 5,
        marginTop: 10,
        alignItems: "center",
        // justifyContent: 'space-around'
    },
    labelIconView: {
        marginRight: 5,
    },
    labelIcon: {
        width: 16,
        height: 18,
        resizeMode: 'contain',
        marginRight: 5,
        marginLeft: 5,
        // tintColor: Colors.black
    },
    label: {
        color: Colors.black,
        fontSize: 14,
        fontFamily:'raleway',
        marginLeft: 5
    },
    gridView: {
        paddingTop: 0,
        flex: 1
    },
    cardView: {
        backgroundColor: Colors.white,
        borderRadius: 10,
        marginLeft: cardMargin,
        marginRight: cardMargin,
        marginBottom: 15,
        paddingLeft: cardLeftRightPadding,
        paddingRight: cardLeftRightPadding,
        paddingBottom: 10,
        overflow: 'hidden',
        alignItems:'center'
    },
    viewAllText: {
        color: Colors.gold,
        fontSize: 14,
    },
    viewAllView: {
        position: 'absolute',
        right: 10,
        bottom: 0,
        top: 0,
        paddingBottom: 5,
        paddingTop: 5,
    },
    visibility_button: {
        width: 120, 
        height: 35, 
        flexDirection: 'row', 
        alignItems: 'center', 
        borderRadius: 3, 
        borderColor: '#000000', 
        borderWidth: 1,
        marginBottom: 5
    },
    visibility_text: {
        fontSize: 14,
        color: Colors.white
    },
    invite_buttons: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: Colors.gold,
        borderRadius: 5,
        marginBottom: 10,
        width:'70%',
        alignItems: 'center'
    },
    invite_buttons_text: {
        color: Colors.white,
        fontSize: 13
    }
});
