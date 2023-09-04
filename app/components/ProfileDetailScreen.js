import React, { Component, Fragment } from "react";
import {
    Platform,
    StyleSheet,
    Text,
    View,
    Animated,
    ScrollView,
    Dimensions,
    Image,
    Alert,
    TouchableOpacity,
    TextInput,
    SafeAreaView,
    Keyboard,
    Linking,
    FlatList,
    Modal
} from "react-native";
import { EventRegister } from 'react-native-event-listeners';
import ActionSheet from 'react-native-actionsheet'
import Moment from "moment/moment";
import ParallaxScrollView from "react-native-parallax-scroll-view";
import { SectionGrid, FlatGrid } from "react-native-super-grid";
import * as Animatable from 'react-native-animatable';
import StarRating from 'react-native-star-rating';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import AsyncStorage from '@react-native-community/async-storage';
import auth from "@react-native-firebase/auth";

import DialogInput from "../customview/DialogInput";
import SpriteSheet from '../customview/SpriteSheet';
import { ImageCompressor } from './ImageCompressorClass'
import { Colors } from "../consts/Colors";
import { Constants } from "../consts/Constants";
import ProgressIndicator from "./ProgressIndicator";
import PulllDownIndicator from "./PullDownIndicator";
import WebService from "../core/WebService";
import * as Global from "../consts/Global";
import ProfileImageGirdViewRow from "./ProfileImageGirdViewRow";
import CustomTimeline from "../customview/CustomTimeline";
import { stylesGlobal } from '../consts/StyleSheet'
import CustomReportPopupView from '../customview/CustomReportPopupView'
import Memory from '../core/Memory'
import CustomPopupView from "../customview/CustomPopupView"
import { getProfileSubStr, getRibbonImage } from "../utils/Util";
import { convertEmojimessagetoString, convertStringtoEmojimessage, getRecentLoginTimeFrame, getUserAge, getEventsForInvite, callInviteUserToEvent } from "../utils/Util";
import BannerView from "../customview/BannerView";
import { isIphoneX, getBottomSpace, getStatusBarHeight } from '../custom_components/react-native-iphone-x-helper';
import InviteUserToEventView from "../customview/InviteUserToEventView";
import { fcService } from "../utils/FirebaseChatService";

const { height, width } = Dimensions.get("window");
const STICKY_HEADER_HEIGHT = 48;
var myProfileData;
var profileUserId = '';
var smallProfileImageSize = 40;
let timeStamp = 0;
var card_padding = 20;

var TAG = "ProfileDetailScreen";

export default class ProfileDetailScreen extends React.Component {
    constructor(props) {
        super(props);
        //fps = 8
        this.state = {
            pulldown_loading: false,
            isSelectedTab: 1,
            userId: "",
            userToken: "",
            userSlug: "",
            member_plan: "",
            is_verified: "0",
            loading: true,
            enableScrollViewScroll: true,
            dataMyProfile: myProfileData,
            isMyFav: false,
            isFollowing: false,
            displayProfileDetail: false,
            connectionList: [],
            displayConnections: false,
            modalVisible: false,
            showReportModel: false,
            isReloginAlert: false,
            visibleHeaderBool: false,
            showModel: false,
            searchText: '',
            today_birthday: false,
            met_in_person: "0",
            rating_generosity: 0,
            rating_beauty: 0,
            rating_body: 0,
            rating_charm: 0,
            rating_smarts: 0,
            review_notes: "",
            profile_user_gender: "",
            my_gender: "",
            review_notes_edit: false,
            my_gold_coin: 0,
            showSendRoseConfirmModal: false,
            showSendRoseResultModal: false,
            keyboardHeight: 0,
            _scrollViewHeight: 0,
            add_to_list_view: false,
            my_list_array: [],
            is_portrait: true,
            screen_width: Dimensions.get("window").width,
            profileImageSize: Dimensions.get("window").width < Dimensions.get("window").height ? (Dimensions.get("window").width - 20) * 0.75 : (Dimensions.get("window").height - 20) * 0.75,
            coverImageHeight: 0,
            PARALLAX_HEADER_HEIGHT: 0,
            invite_event_view: false,
            invite_event_list: [], // to invite my event
            sendCntRose: '1',

            chatAuthToken: "",
            grpId: "",
            is_old: 1,
        };
        this.unsubscribe = null;
    }

    static defaultProps = {

    }

    UNSAFE_componentWillMount() {
        this.clearStateData();
        this.getData();
        // this.focus_screen = this.props.navigation.addListener('focus', () => {
        //     if(this.props.route.params.slug) {
        //         this.clearStateData();
        //         this.getData();
        //     }
        // })

        if (Dimensions.get("window").width < Dimensions.get("window").height) {
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
            if (Dimensions.get("window").width < Dimensions.get("window").height) {
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

    componentDidMount() {

    }

    componentWillUnmount() {
        // this.focus_screen();
        Dimensions.removeEventListener('change');
        if (this.unsubscribe != undefined && this.unsubscribe != null) {
            this.unsubscribe();
        }
    }


    clearStateData = () => {
        myProfileData = null;
        this.setState({
            isSelectedTab: 1,
            userId: "",
            userToken: "",
            userSlug: "",
            member_plan: "",
            loading: true,
            enableScrollViewScroll: true,
            dataMyProfile: myProfileData,
            isMyFav: false,
            isFollowing: false,
            displayProfileDetail: false,
            connectionList: [],
            displayConnections: false,
            modalVisible: false,
            showReportModel: false,
            isReloginAlert: false,
            showModel: false,
            searchText: '',
            networth_verified_on: null,
            today_birthday: false,

            my_list_array: [],

        });
    }

    /**
     * get user token and user id from AsyncStorage
     *
     */
    getData = async () => {
        try {
            var userId = await AsyncStorage.getItem(Constants.KEY_USER_ID);
            var userToken = await AsyncStorage.getItem(Constants.KEY_USER_TOKEN);
            var userImagePath = await AsyncStorage.getItem(Constants.KEY_USER_IMAGE_URL);
            var userImageName = await AsyncStorage.getItem(Constants.KEY_USER_IMAGE_NAME);
            var is_verified = await AsyncStorage.getItem(Constants.KEY_IS_VERIFIED);
            var my_gold_coins_str = await AsyncStorage.getItem(Constants.KEY_GOLD_COINS);
            var member_plan = await AsyncStorage.getItem(Constants.KEY_MEMBER_PLAN);

            var userSlug = this.props.route.params.slug;
            this.setState({
                userId: userId,
                userToken: userToken,
                userSlug: userSlug,
                is_verified: is_verified,
                modalVisible: false,
                userImageName: userImageName,
                userImagePath: userImagePath,
                my_gold_coin: parseInt(my_gold_coins_str, 10),
                member_plan: member_plan,
            });
        } catch (error) {

        }
        await this.callGetChatToken();
        if (!this.state.pulldown_loading) {
            this.setState({
                loading: true
            });
        }
        this.callMyProfileDetailAPI();
        this.callProfileDetailAPI();
    };

    /**
     * call get profile detail API and display content
     */
    callProfileDetailAPI = async () => {
        try {
            let uri = Memory().env == "LIVE" ? Global.URL_MY_PROFILE_DETAIL + this.state.userSlug : Global.URL_MY_PROFILE_DETAIL_DEV + this.state.userSlug
            let params = {
                "token": this.state.userToken,
                "user_id": this.state.userId,
                "format": "json",
            }
            console.log(TAG + " callProfileDetailAPI uri " + uri);
            console.log(TAG + " callProfileDetailAPI params " + JSON.stringify(params));
            WebService.callServicePost(uri, params, this.handleGetProfileDetailResponse);
        } catch (error) {
            this.setState({
                pulldown_loading: false,
                loading: false
            });
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    };

    /** Handle  Profile Data
     *
     * @param response
     * @param isError
     */
    handleGetProfileDetailResponse = (response, isError) => {
        // console.log(TAG + " callProfileDetailAPI result " + JSON.stringify(response));
        console.log(TAG + " callProfileDetailAPI isError " + isError);
        var isProfile = false;

        if (!isError) {
            try {
                var result = response;
                if (typeof result != "undefined" && result != undefined && result != null) {
                    if (typeof result.data != "undefined" && result.data != undefined && result.data != null) {
                        myProfileData = result.data;
                        console.log("Profile Data", myProfileData.profileData.networth_verified_on)
                        this.setState({
                            networth_verified_on: myProfileData.profileData.networth_verified_on
                        })
                        profileUserId = myProfileData.userProfileInfo.id;
                        isProfile = true;
                        var isFav = false;
                        if (result.data.userProfileInfo != "undefined" && result.data.userProfileInfo != undefined && result.data.userProfileInfo != null) {
                            if (result.data.userProfileInfo.favorite_id != undefined && result.data.userProfileInfo.favorite_id > 0) {
                                isFav = true;
                            }
                        }
                        var birthday = myProfileData.profileData.is_birthday;
                        if (birthday == true) {
                            this.setState({
                                today_birthday: true
                            })
                        } else {
                            this.setState({
                                today_birthday: false
                            })
                        }

                        var isFollowing = result.data.following_id ? true : false;
                        this.setState({
                            dataMyProfile: myProfileData,
                            isMyFav: isFav,
                            isFollowing: isFollowing,
                            profile_user_gender: myProfileData.userProfileInfo.gender
                        });
                        if (myProfileData.rating == null) {
                            this.setState({
                                met_in_person: "0",
                                rating_generosity: 0,
                                rating_beauty: 0,
                                rating_body: 0,
                                rating_charm: 0,
                                rating_smarts: 0,
                            })
                        } else {
                            if (myProfileData.rating.met_in_person == null || myProfileData.rating.met_in_person == "") {
                                this.setState({
                                    met_in_person: "0"
                                })
                            } else {
                                this.setState({
                                    met_in_person: myProfileData.rating.met_in_person
                                })
                            }
                            if (myProfileData.rating.generosity == null || myProfileData.rating.generosity == "") {
                                this.setState({
                                    rating_generosity: 0
                                })
                            } else {
                                this.setState({
                                    rating_generosity: parseInt(myProfileData.rating.generosity.toString(), 10)
                                })
                            }
                            if (myProfileData.rating.beauty == null || myProfileData.rating.beauty == "") {
                                this.setState({
                                    rating_beauty: 0
                                })
                            } else {
                                this.setState({
                                    rating_beauty: parseInt(myProfileData.rating.beauty.toString(), 10)
                                })
                            }
                            if (myProfileData.rating.body == null || myProfileData.rating.body == "") {
                                this.setState({
                                    rating_body: 0
                                })
                            } else {
                                this.setState({
                                    rating_body: parseInt(myProfileData.rating.body.toString(), 10)
                                })
                            }
                            if (myProfileData.rating.charm == null || myProfileData.rating.charm == "") {
                                this.setState({
                                    rating_charm: 0
                                })
                            } else {
                                this.setState({
                                    rating_charm: parseInt(myProfileData.rating.charm.toString(), 10)
                                })
                            }
                            if (myProfileData.rating.smarts == null || myProfileData.rating.smarts == "") {
                                this.setState({
                                    rating_smarts: 0
                                })
                            } else {
                                this.setState({
                                    rating_smarts: parseInt(myProfileData.rating.smarts.toString(), 10)
                                })
                            }
                        }

                        if (myProfileData.note == null) {
                            this.setState({
                                review_notes: ""
                            })
                        } else {
                            if (myProfileData.note.note == null) {
                                this.setState({
                                    review_notes: ""
                                })
                            } else {
                                this.setState({
                                    review_notes: myProfileData.note.note
                                })
                            }
                        }

                    } else {

                        if (result.msg) {
                            Alert.alert(result.msg.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""))
                            this.props.navigation.goBack();
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
        this.setState({
            loading: false
        });
        if (isProfile) {
            this.callGetFavoriteList()
        } else {
            this.setState({
                pulldown_loading: false,
            })
        }
    };

    callMyProfileDetailAPI = async () => {
        try {
            let uri = Memory().env == "LIVE" ? Global.URL_MY_PROFILE_DETAIL : Global.URL_MY_PROFILE_DETAIL_DEV

            let params = new FormData();
            params.append("token", this.state.userToken);
            params.append("user_id", this.state.userId);
            params.append("format", "json");

            console.log(TAG + " callMyProfileDetailAPI uri " + uri);
            // console.log(TAG + " callMyProfileDetailAPI params " + JSON.stringify(params));

            WebService.callServicePost(
                uri,
                params,
                this.handleGetMyprofileDetailResponse
            );
        } catch (error) {
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    };
    /**
    * handle my profile API response 
    */
    handleGetMyprofileDetailResponse = (response, isError) => {
        var isProfile = false;
        // console.log(TAG + " callMyProfileDetailAPI result " + JSON.stringify(response));
        console.log(TAG + " callMyProfileDetailAPI isError " + isError);

        if (!isError) {
            var result = response;
            if (result != undefined && result != null) {
                if (result.data != undefined && result.data != null) {
                    this.setState({
                        my_gender: result.data.userProfileInfo
                    })
                }
            }
        } else {
            if (response != undefined && response != null && response.length > 0) {
                Alert.alert(response.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    }

    /**
     * call favourite action API
     */
    callFavouriteActionAPI = async (userId) => {
        try {
            this.setState({
                loading: true
            });
            let uri = Memory().env == "LIVE" ? Global.URL_FAVOURITE_ACTION : Global.URL_FAVOURITE_ACTION_DEV

            let params = new FormData();
            params.append("token", this.state.userToken);
            params.append("user_id", this.state.userId);
            params.append("format", "json");
            params.append("req_user_id", userId);

            if (this.state.dataMyProfile.userProfileInfo.favorite_id > 0) {
                params.append("type", "remove");
            } else {
                params.append("type", "add");
            }

            console.log(TAG + " callFavouriteActionAPI uri " + uri);
            console.log(TAG + " callFavouriteActionAPI params " + JSON.stringify(params));

            WebService.callServicePost(
                uri,
                params,
                this.handleFavouriteActionResponse
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

    /** Handle send rose Data
     *
     * @param response
     * @param isError
     */

    handleFavouriteActionResponse = (response, isError) => {
        console.log(TAG + " callFavouriteActionAPI result " + JSON.stringify(response));
        console.log(TAG + " callFavouriteActionAPI isError " + isError);
        if (!isError) {
            try {
                var result = response;
                if (typeof result != "undefined" && result != undefined && result != null) {

                    if (typeof result.status != "undefined" && result.status != undefined && result.status != null) {
                        if (this.state.isMyFav) {
                            myProfileData.userProfileInfo.favorite_id = 0;
                        } else {
                            myProfileData.userProfileInfo.favorite_id = 1;
                        }
                        this.setState({
                            dataMyProfile: myProfileData,
                            isMyFav: !this.state.isMyFav,
                        });
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
            loading: false
        });
    };

    callFollowRequestAPI = async (userId) => {
        try {
            this.setState({
                loading: true,
            });
            let uri = Memory().env == "LIVE" ? Global.URL_FOLLOW_REQUEST : Global.URL_FOLLOW_REQUEST_DEV;
            let params = new FormData();
            params.append("token", this.state.userToken);
            params.append("user_id", this.state.userId);
            params.append("format", "json");
            if (this.state.isFollowing) {
                params.append("type", "unfollow");
            } else {
                params.append("type", "follow");
            }
            params.append("request_id", userId);
            // params.append("requestUserId", userId);

            console.log(TAG + " callFollowRequestAPI uri " + uri);
            console.log(TAG + " callFollowRequestAPI params " + JSON.stringify(params));

            WebService.callServicePost(
                uri,
                params,
                this.handleFollowRequestResponse
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
     * handle connection request API response
    */
    handleFollowRequestResponse = (response, isError) => {
        console.log(TAG + " callFollowRequestAPI Response " + JSON.stringify(response));
        console.log(TAG + " callFollowRequestAPI isError " + isError);

        if (!isError) {
            if (response.status == "success") {
                if (this.state.isFollowing) {
                    myProfileData.userProfileInfo.following_id = null;
                } else {
                    myProfileData.userProfileInfo.following_id = 1;
                }
                this.setState({
                    dataMyProfile: myProfileData,
                    isFollowing: !this.state.isFollowing,
                });
            } else {
                Alert.alert(response.msg.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }else{
            if (response != undefined && response != null && response.length > 0) {
                Alert.alert(response.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
        this.setState({
            loading: false
        });
    };

    /**
     * call send rose
     */
    callSendRoseAPI = async (userId) => {
        try {
            this.setState({ loading: true });
            let uri = Memory().env == "LIVE" ? Global.URL_ROSE_SEND : Global.URL_ROSE_SEND_DEV
            // let params = new FormData();
            // params.append("token", this.state.userToken);
            // params.append("user_id", this.state.userId);
            // params.append("format", "json");
            // params.append("user", userId);
            // params.append("show_alert", "false");
            let params = {
                "token": this.state.userToken,
                "user_id": this.state.userId,
                "user": userId,
                "format": "json",
                "show_alert": "false",
                "goldCount": Number(this.state.sendCntRose),
            }
            console.log(TAG + " callSendRoseAPI uri " + uri);
            console.log(TAG + " callSendRoseAPI params " + JSON.stringify(params));
            WebService.callServicePost(uri, params, this.handleSendRoseResponse);
        } catch (error) {
            this.setState({
                loading: false
            });
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    };

    /** Handle send rose Data
     *
     * @param response
     * @param isError
     */

    handleSendRoseResponse = (response, isError) => {
        console.log(TAG + " callSendRoseAPI Response " + JSON.stringify(response));
        console.log(TAG + " callSendRoseAPI isError " + isError);
        if (!isError) {
            try {
                var result = response;
                if (typeof result != "undefined" && result != undefined && result != null) {
                    if (result.status.toUpperCase() == "Success".toUpperCase()) {
                        this.setState({ my_gold_coin: this.state.my_gold_coin - 1 });
                        try {
                            AsyncStorage.setItem(Constants.KEY_GOLD_COINS, (this.state.my_gold_coin - 1).toString());
                        } catch (error) {

                        }
                        EventRegister.emit(Constants.EVENT_PROFILE_GOLDCOIN_UPDATED, '');
                        this.setState({
                            showSendRoseConfirmModal: false,
                            showSendRoseResultModal: true
                        });
                        //Alert.alert("Rose Sent", "You have sent a Rose to " + myProfileData.userProfileInfo.first_name + " " + myProfileData.userProfileInfo.last_name + ".");
                    } else {
                        if(response.msg)
                        {
                            Alert.alert(response.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
                        }else{
                            Alert.alert(Constants.UNKNOWN_MSG, "");
                            //UNKNOWN_MSG
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
        this.setState({ loading: false });
    };

    /**
    * cal lget connection API
    */
    callGetConnectionList = async () => {
        try {
            if (!this.state.pulldown_loading) {
                this.setState({
                    loading: true
                });
            }
            let uri = Memory().env == "LIVE" ? Global.URL_FRIEND_CONNECTION + "0/" + this.state.userSlug : Global.URL_FRIEND_CONNECTION_DEV + "0/" + this.state.userSlug

            let params = new FormData();
            params.append("token", this.state.userToken);
            params.append("user_id", this.state.userId);
            params.append("format", "json");

            console.log(TAG + " callGetConnectionList uri " + uri);
            console.log(TAG + " callGetConnectionList params " + JSON.stringify(params));

            WebService.callServicePost(
                uri,
                params,
                this.handleGetConnectionListResponse
            );
        } catch (error) {
            this.setState({
                pulldown_loading: false,
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
        console.log(TAG + " callGetConnectionList Response " + JSON.stringify(response));
        console.log(TAG + " callGetConnectionList isError " + isError);
        if (!isError) {
            try {
                var result = response;
                if (typeof result != "undefined" && result != undefined && result != null) {
                    if (typeof result.data != "undefined" && result.data != undefined && result.data != null) {
                        var mData = result.data;
                        if (mData.length > 0) {
                            this.setState({
                                connectionList: mData,
                                displayProfileDetail: true,
                                displayConnections: true
                            });
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
            pulldown_loading: false,
            loading: false,
            displayProfileDetail: true
        });
    };
    /**
    * cal lget connection API
    */
    callGetFavoriteList = async () => {
        try {
            if (!this.state.pulldown_loading) {
                this.setState({
                    loading: true
                });
            }
            let uri = Memory().env == "LIVE" ? Global.URL_MY_FAVORITE_LIST : Global.URL_MY_FAVORITE_LIST_DEV

            let params = new FormData();
            params.append("token", this.state.userToken);
            params.append("user_id", this.state.userId);
            params.append("format", "json");
            params.append("type", 1);
            params.append("page", 0);
            params.append("favorite_user_id", myProfileData.userProfileInfo.id)

            console.log(TAG + " callGetFavoriteList uri " + uri);
            console.log(TAG + " callGetFavoriteList params " + JSON.stringify(params));

            WebService.callServicePost(
                uri,
                params,
                this.handleFavoriteListResponse
            );
        } catch (error) {
            console.log(error)
            this.setState({
                pulldown_loading: false,
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
    handleFavoriteListResponse = (response, isError) => {
        console.log(TAG + " callGetFavoriteList Response " + JSON.stringify(response));
        console.log(TAG + " callGetFavoriteList isError " + isError);
        if (!isError) {
            try {
                var result = response;
                if (typeof result != "undefined" && result != undefined && result != null) {
                    if (typeof result.data != "undefined" && result.data != undefined && result.data != null) {
                        var mData = result.data;
                        if (mData.favorite.length > 0) {
                            this.setState({
                                connectionList: mData.favorite,  // this means favorite list, we don't use connections any more..
                                displayProfileDetail: true,
                                displayConnections: true
                            });
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
            pulldown_loading: false,
            loading: false,
            displayProfileDetail: true
        });
    };
    /*
    * call accept or reject request API
    */
    callAcceptRejectRequestAPI = async (type, requestId) => {
        try {
            this.setState({
                loading: true
            });
            let uri = Memory().env == "LIVE" ? Global.URL_ACCEPT_REJECT : Global.URL_ACCEPT_REJECT_DEV

            let params = new FormData();
            params.append("token", this.state.userToken);
            params.append("user_id", this.state.userId);
            params.append("format", "json");
            params.append("type", type);
            params.append("requestId", requestId);

            console.log(TAG + " callAcceptRejectRequestAPI uri " + uri);
            console.log(TAG + " callAcceptRejectRequestAPI params " + JSON.stringify(params));

            WebService.callServicePost(
                uri,
                params,
                this.handleAcceptRejectRequestResponse
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
 * handle accept reject request API response
 */
    handleAcceptRejectRequestResponse = (response, isError) => {
        console.log(TAG + " callAcceptRejectRequestAPI Response " + JSON.stringify(response));
        console.log(TAG + " callAcceptRejectRequestAPI isError " + isError);

        if (!isError) {
            var result = response;

            this.setState({
                loading: false
            });
            if (result != undefined && result != null) {
                this.refreshMyProfileInformation();
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
     * call album request access API
     */
    callAlbumRequestAccessAPI = async (albumId) => {
        try {
            this.setState({
                loading: true
            });
            let uri = Memory().env == "LIVE" ? Global.URL_REQUEST_ALBUMS : Global.URL_REQUEST_ALBUMS_DEV
            let params = new FormData();
            params.append("token", this.state.userToken);
            params.append("user_id", this.state.userId);
            params.append("format", "json");
            params.append("albums", albumId);

            console.log(TAG + " callAlbumRequestAccessAPI uri " + uri);
            console.log(TAG + " callAlbumRequestAccessAPI params " + JSON.stringify(params));

            WebService.callServicePost(
                uri,
                params,
                this.handleAlbumRequestAccessResponse
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
     * Handle album requst access API
     */
    handleAlbumRequestAccessResponse = (response, isError) => {
        console.log(TAG + " callAlbumRequestAccessAPI Response " + JSON.stringify(response));
        console.log(TAG + " callAlbumRequestAccessAPI isError " + isError);

        if (!isError) {
            var result = response;

            if (result != undefined && result != null) {

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
    * call unfriend API
    */
    callUnFriendAPI = async (requestId) => {
        try {
            this.setState({
                loading: true
            });

            let uri = Memory().env == "LIVE" ? Global.URL_UNFRIEND : Global.URL_UNFRIEND_DEV

            let params = new FormData();
            var jsonData = {
                requestId: requestId,
                type: "reject"
            }
            params.append("token", this.state.userToken);
            params.append("user_id", this.state.userId);
            params.append("format", "json");
            params.append("data", JSON.stringify(jsonData));

            console.log(TAG + " callUnFriendAPI uri " + uri);
            console.log(TAG + " callUnFriendAPI params " + JSON.stringify(params));

            WebService.callServicePost(
                uri,
                params,
                this.handleUnFriendResponse
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
 * handle unfriend API response
 */
    handleUnFriendResponse = (response, isError) => {
        console.log(TAG + " callUnFriendAPI Response " + JSON.stringify(response));
        console.log(TAG + " callUnFriendAPI isError " + isError);

        if (!isError) {
            var result = response;

            this.setState({
                loading: false
            });
            if (result != undefined && result != null) {
                this.refreshMyProfileInformation();
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

            let uri = Memory().env == "LIVE" ? Global.URL_BLOCK_USERS : Global.URL_BLOCK_USERS_DEV;
            let params = new FormData();

            params.append("token", this.state.userToken);
            params.append("user_id", this.state.userId);
            params.append("block_id", profileUserId);
            params.append("is_block", 0);
            params.append("type", 1);
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
                Alert.alert(error, "");
            }
        }
    };

    /**
    * handle Report API response
    */
    handleReportResponse = (response, isError) => {
        console.log(TAG + " callReportAPI Response " + JSON.stringify(response));
        console.log(TAG + " callReportAPI isError " + isError);

        if (!isError) {
            var result = response;
            if (typeof result != undefined && result != null) {
                if (typeof result.msg != undefined && result.msg != null) {

                    // Alert.alert(result.msg)
                    if (result.status == 'success') {
                        Alert.alert(Constants.REPORT_SUCCESS, "")
                    } else {
                        if(response.msg)
                        {
                            Alert.alert(response.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
                        }else{
                            Alert.alert(Constants.UNKNOWN_MSG, "");
                            //UNKNOWN_MSG
                        }
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
        * call Block API
        */
    callBlockAPI = async () => {
        try {
            this.setState({
                loading: true
            });

            let uri = Memory().env == "LIVE" ? Global.URL_BLOCK_USERS : Global.URL_BLOCK_USERS_DEV
            let params = new FormData();
            params.append("token", this.state.userToken);
            params.append("user_id", this.state.userId);
            params.append("block_id", profileUserId);
            params.append("is_block", 1);
            params.append("type", 1);
            params.append("message", "");
            params.append("format", "json");


            console.log(TAG + " callBlockAPI uri " + uri);
            console.log(TAG + " callBlockAPI params " + JSON.stringify(params));

            WebService.callServicePost(
                uri,
                params,
                this.handleBlockResponse
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
    * handle Block API response
    */
    handleBlockResponse = (response, isError) => {
        console.log(TAG + " callBlockAPI Response " + JSON.stringify(response));
        console.log(TAG + " callBlockAPI isError " + isError);

        if (!isError) {
            var result = response;
            if (typeof result != undefined && result != null) {
                if (typeof result.msg != undefined && result.msg != null) {
                    if (this.props.route.params.refreshFavorite != undefined) {
                        this.props.route.params.refreshFavorite(this.state.isMyFav);
                    }
                    this.props.navigation.goBack();
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

    getMyList() {
        try {

            this.setState({
                loading: true,
                more_load: false,
                total_length: 0
            });

            let uri = Memory().env == "LIVE" ? Global.URL_GET_LISTS_CATEGORY_MEMBERS : Global.URL_GET_LISTS_CATEGORY_MEMBERS_DEV;
            let params = new FormData();
            params.append("token", this.state.userToken);
            params.append("user_id", this.state.userId);
            params.append("format", "json");
            params.append("page", 0);

            console.log(TAG + " callGetMyListAPI uri " + uri);
            console.log(TAG + " callGetMyListAPI params " + JSON.stringify(params));

            WebService.callServicePost(uri, params, this.handleGetMyListAPI);
        } catch (error) {
            console.log(TAG + " callGetMyListAPI error " + error);
            this.setState({
                loading: false,
            });
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    }

    handleGetMyListAPI = (response, isError) => {
        console.log(TAG + " callGetMyListAPI Response " + JSON.stringify(response));
        console.log(TAG + " callGetMyListAPI isError " + isError);

        if (!isError) {
            var result = response;
            if (result != undefined && result != null) {
                if (result.status == "success") {
                    if (result.data != null) {
                        for (i = 0; i < result.data.group.length; i++) {
                            result.data.group[i].selected = false;
                        }

                        this.setState({
                            my_list_array: result.data.group,
                            add_to_list_view: true
                        })
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
        });
    }

    add_member_to_category = () => {
        try {
            var group_id = "";
            var group_name = "";
            for (i = 0; i < this.state.my_list_array.length; i++) {
                if (this.state.my_list_array[i].selected) {
                    group_id = this.state.my_list_array[i].id;
                    group_name = this.state.my_list_array[i].group_name;
                    break;
                }
            }
            if (group_id == "") {
                Alert.alert(Constants.ADDUSERTOLIST_EMPTY, "");
                return;
            }
            this.setState({
                loading: true,
            });

            let uri = Memory().env == "LIVE" ? Global.URL_MYLIST_ADD_LIST_MEMBER_SEARCH : Global.URL_MYLIST_ADD_LIST_MEMBER_SEARCH_DEV;
            let params = new FormData();
            params.append("token", this.state.userToken);
            params.append("user_id", this.state.userId);
            params.append("format", "json");
            params.append("group_id", group_id);
            params.append("group_name", group_name);
            params.append("users", JSON.stringify([profileUserId]));

            console.log(TAG + " callAddMemberCategoryAPI uri " + uri);
            console.log(TAG + " callAddMemberCategoryAPI params " + JSON.stringify(params));

            WebService.callServicePost(uri, params, this.handleAddMemberCategoryRresponse);
        } catch (error) {
            console.log(TAG + " callAddMemberCategoryAPI error " + error);
            this.setState({
                loading: false,
            });
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    }

    handleAddMemberCategoryRresponse = (response, isError) => {
        console.log(TAG + " callAddMemberCategoryAPI Response " + JSON.stringify(response));
        console.log(TAG + " callAddMemberCategoryAPI isError " + isError);
        if (!isError) {
            if (response.status == "success") {
                var group_name = "";
                for (i = 0; i < this.state.my_list_array.length; i++) {
                    if (this.state.my_list_array[i].selected) {
                        group_name = this.state.my_list_array[i].group_name;
                        break;
                    }
                }
                Alert.alert(myProfileData.userProfileInfo.first_name + " " + myProfileData.userProfileInfo.last_name + " has been added to your list " + "'" + group_name + "'", "");
                this.setState({
                    add_to_list_view: false
                })
            } else {
                Alert.alert(response.msg.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
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
* accept button click
*/
    acceptConnectionRequest = user_id => {
        this.callAcceptRejectRequestAPI("accept", user_id);
    };
    /**
* reject button click
*/
    rejectConnectionRequest = user_id => {
        this.callAcceptRejectRequestAPI("reject", user_id);
    };

    showStickeyHeader = (bool) => {
        { bool != this.state.visibleHeaderBool && this.setState({ visibleHeaderBool: bool }) }
    }

    render() {
        const {
            onScroll = (event) => { }
        } = this.props;

        return (
            <Fragment>
                <SafeAreaView style={{ backgroundColor: Colors.black, flex: 0 }} />
                <SafeAreaView style={[styles.container,]}>
                    {this.renderHeaderView()}
                    {this.renderBannerView()}
                    {this.renderPopupView()}
                    {
                        this.state.invite_event_view &&
                        <InviteUserToEventView
                            screenProps={this.props.navigation}
                            invited_user={{
                                user_id: myProfileData.userProfileInfo.id,
                                first_name: myProfileData.userProfileInfo.first_name,
                                last_name: myProfileData.userProfileInfo.last_name,
                            }}
                            invite_event_list={this.state.invite_event_list}
                            close_view={() => this.setState({ invite_event_view: false })}
                            selectUserforInvite={(item, index) => {
                                if (item.invitation_id == null) {
                                    var invite_event_list = this.state.invite_event_list;
                                    invite_event_list[index].check = !invite_event_list[index].check;
                                    this.setState({
                                        invite_event_list: invite_event_list
                                    })
                                }
                            }}
                            callInviteUserToEvent={async () => {
                                var exist = false
                                for (var i = 0; i < this.state.invite_event_list.length; i++) {
                                    if (this.state.invite_event_list[i].check) {
                                        exist = true;
                                        break;
                                    }
                                }
                                if (!exist) {
                                    Alert.alert(Constants.INVITE_EVENT_SELECTION, "");
                                    return;
                                }
                                this.setState({
                                    loading: true
                                });
                                const response = await callInviteUserToEvent({ user_id: myProfileData.userProfileInfo.id }, this.state.invite_event_list, this.state.userId, this.state.userToken);
                                if (response.status == "success") {
                                    Alert.alert(Constants.INVITED_USER_SUCCESS + myProfileData.userProfileInfo.first_name + " " + myProfileData.userProfileInfo.last_name, "");
                                }
                                this.setState({
                                    loading: false,
                                    invite_event_view: false,
                                })
                            }}
                        />
                    }
                    {this.state.pulldown_loading && <PulllDownIndicator />}
                    {this.state.showSendRoseResultModal && this.renderSendRoseResultModal()}
                    {this.state.showSendRoseConfirmModal && this.renderSendRoseConfirmModal()}
                    {this.state.add_to_list_view && this.renderAddToMyListModal()}
                    {this.state.displayProfileDetail &&

                        <ParallaxScrollView
                            ref={(view) => this._scrollView = view}
                            style={{ flex: 1, borderRadius: 15, paddingHorizontal: card_padding, overflow: 'hidden' }}
                            contentContainerStyle={{ backgroundColor: Colors.black }}
                            onScroll={event => {
                                if (event.nativeEvent.contentOffset.y < -80) {
                                    if (!this.state.pulldown_loading) {
                                        this.setState({
                                            pulldown_loading: true
                                        }, () => this.getData())
                                    }
                                }
                            }}
                            onContentSizeChange={(contentWidth, contentHeight) => {
                                if (this.state._scrollViewHeight == 0) {
                                    this.setState({
                                        _scrollViewHeight: contentHeight
                                    })
                                }
                            }}
                            stickyHeaderHeight={STICKY_HEADER_HEIGHT}
                            parallaxHeaderHeight={this.state.PARALLAX_HEADER_HEIGHT}
                            backgroundSpeed={10}
                            fadeOutForeground={false}
                            onChangeHeaderVisibility={bool => this.showStickeyHeader(bool)}
                            renderBackground={() => (
                                <View key="background" >
                                    <View style={{ width: '100%', paddingHorizontal: card_padding, paddingTop: card_padding - 5 }}>
                                        {this.renderCoverImageView()}
                                    </View>
                                    <View style={{ width: this.state.is_portrait ? this.state.screen_width : this.state.screen_width / 2, aspectRatio: 1, position: 'absolute', top: 0, right: 0, zIndex: 10, elevation: 10 }}>
                                        {getRibbonImage(myProfileData.userProfileInfo)}
                                    </View>
                                </View>
                            )}
                            renderStickyHeader={() => (
                                <View key="sticky-header" style={[styles.stickySection, { justifyContent: "center", alignItems: "center", height: STICKY_HEADER_HEIGHT, backgroundColor: 'black' }]}>
                                    {
                                        this.renderDraggableHeaderView()
                                    }
                                </View>
                            )}
                            renderForeground={() => (
                                <View key="parallax-header" style={{ flex: 1 }}>
                                    {this.renderFullName()}
                                </View>
                            )}
                        >
                            <KeyboardAwareScrollView keyboardShouldPersistTaps = "handled" style={{ flex: 1 }}>
                                {this.renderUserInfo()}
                                {this.renderActionButtons()}
                                {
                                    this.state.today_birthday &&
                                    this.renderBirthdayView()
                                }
                                {this.state.displayConnections ? this.renderMyConnections() : null}
                                {this.renderMyInfo()}
                                {this.renderUserGallery()}
                                {this.renderSuccessTimeLineView()}
                                {this.renderTravelPlansView()}
                                {this.renderRatingView()}
                                {this.renderNotesView()}
                            </KeyboardAwareScrollView>

                        </ParallaxScrollView>}

                    {this.state.displayProfileDetail ? this.renderReportPopupView() : null}
                    {this.state.loading == true ? <ProgressIndicator /> : null}


                    <DialogInput isDialogVisible={this.state.modalVisible}
                        title={"Send Message"}
                        message={this.state.promtTitle}
                        hintInput={"Enter message"}
                        defaultValue={this.state.inputText}
                        submitInput={(inputText) => {
                            this.setModalVisible(false)
                            // this.callSendTextMessageAPI(inputText)
                        }}
                        closeDialog={() => { this.setModalVisible(false) }}>
                    </DialogInput>

                    <ActionSheet
                        ref={o => this.ActionSheet = o}
                        title={'Choose an option'}
                        options={['Block', 'Report', 'Cancel']}
                        cancelButtonIndex={2}
                        onPress={(index) => {
                            if (index == 0) {
                                this.setState({
                                    reportData: null
                                }, () => {
                                    this.displayBlockUserDialog();
                                })
                            } else if (index == 1) {
                                this.setReportModalVisible(true)
                            } else {
                                this.setState({
                                    reportData: null
                                })
                            }
                        }}
                    />
                </SafeAreaView>
            </Fragment>
        );
    }

    renderBannerView = () => {
        return (
            <BannerView
                screenProps={this.props.navigation}
            />
        )
    }

    select_my_list = (index) => {
        var my_list_array = this.state.my_list_array;
        for (i = 0; i < my_list_array.length; i++) {
            if (i == index) {
                my_list_array[i].selected = true;
            } else {
                my_list_array[i].selected = false;
            }
        }
        this.setState({
            my_list_array: my_list_array
        })
    }

    renderAddToMyListModal = () => {
        return (
            <View style={{ width: width, height: height, position: 'absolute', top: 0, left: 0, alignItems: 'center', zIndex: 100 }}>
                <View style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, backgroundColor: Colors.black, opacity: 0.2 }}></View>
                <View style={{ width: '90%', marginTop: 60, backgroundColor: Colors.white, borderRadius: 5 }}>
                    <View style={{ width: '100%', padding: 20 }}>
                        <Text style={[{ fontSize: 18, color: Colors.black }, stylesGlobal.font]}>Add To Friend List</Text>
                    </View>
                    <View style={{ width: '100%', padding: 20, borderTopColor: Colors.gray, borderTopWidth: 0.5, borderBottomColor: Colors.gray, borderBottomWidth: 0.5 }}>
                        {
                            this.state.my_list_array.length == 0 &&
                            <Text style={[{ fontSize: 14, color: Colors.black }, stylesGlobal.font]}>You don't have your own list. Please create your own list on <Text style={{ color: Colors.blue }} onPress={() => { this.setState({ add_to_list_view: false }); this.props.navigation.navigate("MyListsNavigation", { gender: this.state.my_gender }) }}>here</Text></Text>
                        }
                        {
                            this.state.my_list_array.length > 0 &&
                            <Text style={[{ fontSize: 14, color: Colors.black }, stylesGlobal.font]}>{"Add " + myProfileData.userProfileInfo.first_name + " " + myProfileData.userProfileInfo.last_name + " to:"}</Text>
                        }
                    </View>
                    <View style={{ width: '100%', maxHeight: 150, padding: 20, alignItems: 'center' }}>
                        <ScrollView style={{ width: '90%' }}>
                            {
                                this.state.my_list_array.map((item, index) =>
                                    <TouchableOpacity key={index} style={{ width: '100%', flexDirection: 'row', alignItems: 'center', marginBottom: 10 }} onPress={() => this.select_my_list(index)}>
                                        <View style={{ width: 20, height: 20, marginRight: 15 }}>
                                            <Image source={require('../icons/square.png')} style={{ width: '100%', height: '100%', resizeMode: 'contain' }} />
                                            {
                                                item.selected &&
                                                <Image source={require('../icons/checked.png')} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', resizeMode: 'contain' }} />
                                            }
                                        </View>
                                        <Text style={[{ fontSize: 14, color: Colors.black }, stylesGlobal.font]}>{item.group_name}</Text>
                                    </TouchableOpacity>
                                )
                            }
                        </ScrollView>
                    </View>
                    <View style={{ width: '100%', padding: 20, flexDirection: 'row', justifyContent: 'flex-end' }}>
                        <TouchableOpacity style={[{ paddingVertical: 10, paddingHorizontal: 20, minWidth: 60, backgroundColor: Colors.gold, borderRadius: 5, justifyContent: 'center', alignItems: 'center' }, stylesGlobal.shadow_style]}
                            onPress={() => {
                                this.add_member_to_category();
                            }}
                        >
                            <Text style={[{ fontSize: 14, color: Colors.white }, stylesGlobal.font]}>Add To List</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[{ paddingVertical: 10, paddingHorizontal: 20, minWidth: 60, backgroundColor: Colors.gold, borderRadius: 5, marginLeft: 15, justifyContent: 'center', alignItems: 'center' }, stylesGlobal.shadow_style]}
                            onPress={() => this.setState({ add_to_list_view: false })}
                        >
                            <Text style={[{ fontSize: 14, color: Colors.white }, stylesGlobal.font]}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        )
    }

    renderSendRoseResultModal = () => {
        
        var cntSendRose = Number(this.state.sendCntRose );
        //Congratulations.png
        return (
            <Modal
                animationType="fade"
                transparent={true}
                // closeOnClick={true}
                visible={this.state.showSendRoseResultModal}
                onRequestClose={() => this.setState({ showSendRoseResultModal: false })}
                supportedOrientations={['portrait', 'landscape']}
            >
                <View style={{ width: '100%', height: '100%', alignItems: 'center', marginTop: 100 }}>
                    <View style={stylesGlobal.popup_bg_blur_view}></View>
                    <View style={[stylesGlobal.popup_main_container, { marginTop: 60, width: '100%' }]}>
                        <View style={{width: '100%', height: 100}}>
                            <View 
                                style={{
                                    position: 'absolute', 
                                    width: '100%', 
                                    height: 100,
                                    marginTop: -5, 
                                    alignItems: 'center', 
                                    zIndex: 10,
                                    justifyContent: 'center'}}>
                                <Image  
                                    style={{width: '80%', height: 100, resizeMode: 'contain'}} 
                                    source={require('../icons/Congratulations.png')} /> 
                            </View>
                            <TouchableOpacity 
                                style={[stylesGlobal.popup_cancel_button, {
                                    position: 'absolute',
                                    right: 20,
                                    top: 20,
                                    zIndex: 11,
                                    }]} onPress={() => this.setState({ showSendRoseResultModal: false })}>
                                <Image style={stylesGlobal.cancel_delete_image} source={require('../icons/connection-delete.png')} />
                            </TouchableOpacity>
                        </View>
                        
                        
                        <View style={[stylesGlobal.popup_desc_container,{alignItems: 'center', marginTop: -30}]}>
                            <View style={{alignItems: 'center' }}>
                                <Text style={[{ 
                                    fontSize: 14, 
                                    color: Colors.black, 
                                    marginLeft: 5, 
                                    width: '95%',
                                    flexWrap: 'wrap',
                                    flexShrink: 1,
                                    marginRight: 5,  
                                    alignItems: 'center', 
                                    justifyContent: 'center',}, 
                                    stylesGlobal.font]}>{`You sent ${cntSendRose} Virtual Rose`}
                                </Text>
                                <View style={{flexDirection: 'row'}}>
                                    <Text style={[{ 
                                        fontSize: 14, 
                                        color: Colors.black, 
                                        marginLeft: 5, 
                                         flexShrink: 1,
                                        marginRight: 5,  
                                        alignItems: 'center', 
                                        justifyContent: 'center',}, 
                                        stylesGlobal.font]}>To:
                                    </Text>
                                    <Text style={[{ 
                                        fontSize: 14, 
                                        color: Colors.gold, 
                                        marginLeft: 5, 
                                         flexShrink: 1,
                                        marginRight: 5,  
                                        alignItems: 'center', 
                                        justifyContent: 'center',}, 
                                        stylesGlobal.font]}>{myProfileData.userProfileInfo.first_name + " " + myProfileData.userProfileInfo.last_name}
                                    </Text>
                                </View>
                            </View>
                            <View style={{width: 70, justifyContent: 'flex-start'}}>
                                <Image style={{ width: 70, height: 90, resizeMode: 'contain' }} source={require("../icons/animi-rose.gif")} />
                            </View>
                        </View>
                    </View>
                </View>
            </Modal>
        )
    }


    renderSendRoseConfirmModal = () => {
        var modal_title = "";
        var modal_message = "";
        var yes_button_text = "";
        var no_button_text = "";
        var modal_message_end = "";
        var send_rose_status = false;
        var cntSendRose = Number(this.state.sendCntRose );
        if ((this.state.my_gold_coin > 0  && cntSendRose < this.state.my_gold_coin )   ) {
            modal_title = "Send a Rose";
            //modal_message = "Send " + myProfileData.userProfileInfo.first_name + " " + myProfileData.userProfileInfo.last_name + " a virtual rose for ";

            modal_message = "Send a Virtual Rose ";
            modal_message_end = " Gold Coin?";
            yes_button_text = "Send";
            no_button_text = "No";
            send_rose_status = true;
        } else {
            modal_title = "Send a Rose";
            modal_message = "You don't have enough gold coins to make this purchase";
            yes_button_text = "Buy More Gold";
            no_button_text = "Cancel";
            send_rose_status = false;
        }

        return (
            <Modal
                animationType="fade"
                transparent={true}
                // closeOnClick={true}
                visible={this.state.showSendRoseConfirmModal}
                onRequestClose={() => this.setState({ showSendRoseConfirmModal: false })}
                supportedOrientations={['portrait', 'landscape']}
            >
                <View style={{ width: '100%', height: '100%', alignItems: 'center' }}>
                    <View style={stylesGlobal.popup_bg_blur_view}></View>
                    <View style={[stylesGlobal.popup_main_container, { marginTop: 60 }]}>
                        <View style={stylesGlobal.popup_title_view}>
                            <Text style={[stylesGlobal.popup_title_text, stylesGlobal.font, {color:  Colors.gold, fontWeight: 'bold'}]}>{modal_title}</Text>
                            <TouchableOpacity style={stylesGlobal.popup_cancel_button} onPress={() => this.setState({ showSendRoseConfirmModal: false })}>
                                <Image style={stylesGlobal.cancel_delete_image} source={require('../icons/connection-delete.png')} />
                            </TouchableOpacity>
                        </View>
                        <View style={[stylesGlobal.popup_desc_container,{padding:10, flexDirection: 'row', alignItems: 'center', paddingRight: 10}]}>
                        {send_rose_status ? 
                            <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flex: 1, }}>
                                <View style={{padding: 10 }}>
                                    <Text style={[{ 
                                        fontSize: 14, 
                                        color: Colors.black, 
                                        marginLeft: 5, 
                                        width: '95%',
                                        flexWrap: 'wrap',
                                         flexShrink: 1,
                                        marginRight: 5,  
                                        alignItems: 'center', 
                                        justifyContent: 'center',}, 
                                        stylesGlobal.font]}>Send a Virtual Rose
                                    </Text>
                                    <View style={{flexDirection: 'row'}}>
                                        <Text style={[{ 
                                            fontSize: 14, 
                                            color: Colors.black, 
                                            marginLeft: 5, 
                                             flexShrink: 1,
                                            marginRight: 5,  
                                            alignItems: 'center', 
                                            justifyContent: 'center',}, 
                                            stylesGlobal.font]}>To:
                                        </Text>
                                        <Text style={[{ 
                                            fontSize: 14, 
                                            color: Colors.gold, 
                                            marginLeft: 5, 
                                             flexShrink: 1,
                                            marginRight: 5,  
                                            alignItems: 'center', 
                                            justifyContent: 'center',}, 
                                            stylesGlobal.font]}>{myProfileData.userProfileInfo.first_name + " " + myProfileData.userProfileInfo.last_name}
                                        </Text>
                                    </View>
                                    <Text style={[{ 
                                        fontSize: 14, 
                                        color: Colors.black, 
                                        marginLeft: 5, 
                                        width: '95%',
                                        flexWrap: 'wrap',
                                         flexShrink: 1,
                                        marginRight: 5,  
                                        alignItems: 'center', 
                                        justifyContent: 'center',
                                        marginTop: 10
                                    }, 
                                        stylesGlobal.font]}>1 Gold Coin each
                                    </Text>
                                </View>
                                <View style={{width: 50, justifyContent: 'flex-start'}}>
                                    <Image style={{ width: 50, height: 80, resizeMode: 'contain' }} source={require("../icons/animi-rose.gif")} />
                                </View>
                                <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flex: 1,}}>
                                    <TouchableOpacity 
                                        style={{marginRight: 5, width: 20, height: 50, justifyContent: 'center', alignItems: 'center'}}
                                        onPress={() => {
                                            if(this.state.sendCntRose === '1')
                                                return;
                                            let curVal = parseInt(this.state.sendCntRose, 10);
                                            if(curVal === 0)
                                            {
                                                this.setState({sendCntRose: '1'});
                                                return;
                                            }
                                            this.setState({sendCntRose: (curVal - 1).toString()});
                                            }}
                                    >
                                        <Text style={[stylesGlobal.font, {fontSize: 20, color: Colors.gray}]}>-</Text>
                                    </TouchableOpacity>
                                    
                                    <View style={{width: 50, height: 40, borderRadius: 5, borderWidth: 1, justifyContent: 'center', alignItems: 'center', borderColor: Colors.black}}>
                                        <TextInput
                                            // ref='valueAvailableSpace'
                                            multiline={false}
                                            returnKeyType='done'
                                            numberOfLines={1}
                                            underlineColorAndroid="transparent"
                                            autoCapitalize='sentences'
                                            onChangeText={value => {
                                                if (value.match(/^[0-9]+$/) != null || value === "") {
                                                    let tmpCnt = parseInt(value, 10);
                                                    if(value !== "" && tmpCnt == 0)
                                                    {
                                                        this.setState({sendCntRose: '1'});
                                                    }else{
                                                        this.setState({sendCntRose: value});
                                                    }
                                                    
                                                    
                                                } else {
                                                    this.setState({sendCntRose: '1'})
                                                }
                                            }}
                                            value={this.state.sendCntRose}
                                            style={[styles.textInputText, stylesGlobal.font, { borderWidth: 0, flex: 1}]}
                                            onSubmitEditing={(event) => {
                                                //this.refs.valueLastName.focus();
                                            }}
                                            keyboardType={'number-pad'}
                                        />
                                    </View>
                                    <TouchableOpacity 
                                        style={{marginLeft: 5, width: 20, height: 50,  justifyContent: 'center', alignItems: 'center'}}
                                        onPress={() => {

                                            let curVal = parseInt(this.state.sendCntRose, 10);
                                            if(curVal === 0)
                                            {
                                                this.setState({sendCntRose: '1'});
                                                return;
                                            }

                                            if(curVal=== this.state.my_gold_coin)
                                            {
                                                this.setState({sendCntRose: this.state.my_gold_coin.toString()});
                                                return;
                                            }
                                            this.setState({sendCntRose: (curVal + 1).toString()});
                                            }}
                                    >
                                        <Text  style={[stylesGlobal.font, {fontSize: 20, color: Colors.gray}]}>+</Text>
                                    </TouchableOpacity>
                                    
                                </View>

                            </View>
                        :
                            <>
                                <Text style={[{ 
                                    fontSize: 14, 
                                    color: Colors.black, 
                                    marginLeft: 5, 
                                    width: '95%',
                                    flexWrap: 'wrap',
                                     flexShrink: 1,
                                    marginRight: 5,  
                                    alignItems: 'center', 
                                    justifyContent: 'center',}, 
                                    stylesGlobal.font]}>{modal_message}
                                
                                </Text>
                                {send_rose_status && 
                                    <View style={{borderWidth: 1, justifyContent: 'center', alignItems: 'center', width: 40, height: 30, borderRadius: 5, padding: 3}}>
                                        <TextInput
                                            // ref='valueAvailableSpace'
                                            multiline={false}
                                            returnKeyType='done'
                                            numberOfLines={1}
                                            underlineColorAndroid="transparent"
                                            autoCapitalize='sentences'
                                            onChangeText={value => {
                                                if (value.match(/^[0-9]+$/) != null || value === "") {
                                                    let tmpCnt = parseInt(value, 10);
                                                    if(value !== "" && tmpCnt == 0)
                                                    {
                                                        this.setState({sendCntRose: '1'});
                                                    }else{
                                                        this.setState({sendCntRose: value});
                                                    }
                                                    
                                                    
                                                } else {
                                                    this.setState({sendCntRose: '1'})
                                                }
                                            }}
                                            value={this.state.sendCntRose}
                                            style={[styles.textInputText, stylesGlobal.font, { borderWidth: 0, flex: 1}]}
                                            onSubmitEditing={(event) => {
                                                //this.refs.valueLastName.focus();
                                            }}
                                            keyboardType={'number-pad'}
                                        />
                                    </View>
                                }
                                
                                <Text style={[{ fontSize: 14, color: Colors.black, marginLeft: 5, alignItems: 'center', justifyContent: 'center', }, stylesGlobal.font]}>{modal_message_end}</Text>
                            </>

                        }
                            
                            
                            
                        </View>
                        <View style={[stylesGlobal.popup_button_container, {justifyContent: 'center', alignItems: 'center'}]}>
                            <TouchableOpacity style={[stylesGlobal.common_button, { marginEnd: 10, paddingHorizontal: 20, justifyContent: 'center', alignItems: 'center', width: '80%' }, stylesGlobal.shadow_style]}
                                onPress={() => {
                                    let nCntSent = Number(this.state.sendCntRose);
                                    if(nCntSent == 0)
                                    {
                                        Alert.alert("Please send a minimum of 1 Rose.");
                                        return;
                                    }

                                    this.setState({
                                        showSendRoseConfirmModal: false
                                    })
                                    if (send_rose_status) {
                                        this.callSendRoseAPI(myProfileData.userProfileInfo.id)
                                    } else {
                                        this.props.navigation.navigate('MyAccountScreen', { getDataAgain: this.getDataAgain, initial_tab: "buy_goldcoin" })
                                    }
                                }}
                            >
                                <Text style={[stylesGlobal.popup_button_text, stylesGlobal.font]}>{yes_button_text}</Text>
                            </TouchableOpacity>
{/*                             <TouchableOpacity style={[stylesGlobal.common_button, { marginEnd: 10, paddingHorizontal: 20 }, stylesGlobal.shadow_style]} */}
{/*                                 onPress={() => { */}
{/*  */}
{/*                                     let nCntSent = Number(this.state.sendCntRose); */}
{/*                                     if(nCntSent == 0) */}
{/*                                     { */}
{/*                                         Alert.alert("Please send a minimum of 1 Rose."); */}
{/*                                         return; */}
{/*  */}
{/*                                     } */}
{/*  */}
{/*                                     this.setState({ */}
{/*                                         showSendRoseConfirmModal: false */}
{/*                                     }) */}
{/*                                     if (send_rose_status) { */}
{/*                                         this.callSendRoseAPI(myProfileData.userProfileInfo.id) */}
{/*                                     } else { */}
{/*                                         this.props.navigation.navigate('MyAccountScreen', { getDataAgain: this.getDataAgain, initial_tab: "buy_goldcoin" }) */}
{/*                                     } */}
{/*                                 }} */}
{/*                             > */}
{/*                                 <Text style={[stylesGlobal.popup_button_text, stylesGlobal.font]}>{yes_button_text}</Text> */}
{/*                             </TouchableOpacity> */}
{/*                             <TouchableOpacity style={[stylesGlobal.common_button, { paddingHorizontal: 20 }, stylesGlobal.shadow_style]} */}
{/*                                 onPress={() => this.setState({ showSendRoseConfirmModal: false })} */}
{/*                             > */}
{/*                                 <Text style={[stylesGlobal.popup_button_text, stylesGlobal.font]}>{no_button_text}</Text> */}
{/*                             </TouchableOpacity> */}
                        </View>
                    </View>
                </View>
            </Modal>
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
                callAPI={this.callReportAPI}
                closeDialog={() => { this.setState({ showReportModel: false }) }}>
            </CustomReportPopupView>

        );
    }

    renderBirthdayView() {
        if (!myProfileData) {
            return null;
        }
        var first_name = myProfileData.userProfileInfo.first_name;

        return (
            // <View style={{width: width-20, borderRadius:10, backgroundColor:Colors.white, alignSelf:'center', marginTop: 15, marginBottom:10, overflow: 'hidden'}}>
            <View style={[styles.viewContainerWithShadow]}>
                <View style={{ position: 'absolute', width: '100%', aspectRatio: 3.8, right: 0, top: 0 }}>
                    <Image style={{ width: '100%', height: '100%' }} resizeMode={'contain'} source={require("../icons/birthday_ornament.png")} />
                </View>
                <Text style={[stylesGlobal.font_bold, { marginTop: 40, alignSelf: 'center', fontSize: 15, color: Colors.gold }]}>It's {first_name}'s Birthday!</Text>
                <View style={{ width: '100%', justifyContent: 'center', marginTop: 30, marginBottom: 20, flexDirection: 'row' }}>
                    <TouchableOpacity style={[styles.buygiftbutton, stylesGlobal.shadow_style]} onPress={() =>
                        // Alert.alert("This feature is only available on the web. Open in web?", "",
                        // [
                        //     {text: 'OK', onPress: () => {
                        //         let link = "https://007percent.com/browse-category";
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
                        this.props.navigation.navigate("GiftList", { receiver: myProfileData.userProfileInfo, selected_screen: "gift" })
                    }
                    >
                        <Text style={[styles.buttonText, stylesGlobal.font]}>Send a Gift</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.buygiftbutton, stylesGlobal.shadow_style, { marginLeft: 15 }]} onPress={() => this.goToChatScreen()}>
                        <Text style={[styles.buttonText, stylesGlobal.font]}>Send a Message</Text>
                    </TouchableOpacity>
                </View>
            </View>
        )
    }

    sendMetInPersonRating = async (type, rating_value) => {
        var met_in_person = this.state.met_in_person;
        var rating_generosity = this.state.rating_generosity;
        var rating_beauty = this.state.rating_beauty;
        var rating_body = this.state.rating_body;
        var rating_charm = this.state.rating_charm;
        var rating_smarts = this.state.rating_smarts;
        if (type == "met_in_person") {
            if (this.state.met_in_person == "1") {
                this.setState({
                    met_in_person: "0"
                });
                met_in_person = "0";
            } else {
                this.setState({
                    met_in_person: "1"
                });
                met_in_person = "1";
            }
        } else if (type == "rating_generosity") {
            this.setState({
                rating_generosity: rating_value
            });
            rating_generosity = rating_value;
        } else if (type == "rating_beauty") {
            this.setState({
                rating_beauty: rating_value
            });
            rating_beauty = rating_value;
        } else if (type == "rating_body") {
            this.setState({
                rating_body: rating_value
            });
            rating_body = rating_value;
        } else if (type == "rating_charm") {
            this.setState({
                rating_charm: rating_value
            });
            rating_charm = rating_value;
        } else if (type == "rating_smarts") {
            this.setState({
                rating_smarts: rating_value
            });
            rating_smarts = rating_value;
        }

        let uri = Memory().env == "LIVE" ? Global.URL_PROFILE_RATING : Global.URL_PROFILE_RATING_DEV;
        let params = new FormData();
        params.append("token", this.state.userToken);
        params.append("user_id", this.state.userId);
        params.append("user_profile_id", profileUserId);
        params.append("format", "json");
        params.append("get_star_generosity", rating_generosity);
        params.append("get_star_beauty", rating_beauty);
        params.append("get_star_body", rating_body);
        params.append("get_star_charm", rating_charm);
        params.append("get_star_smarts", rating_smarts);
        params.append("met_in_person", met_in_person);
        // let params = {
        //     "token":this.state.userToken,
        //     "user_id":this.state.userId,
        //     "format":"json",
        //     "get_star_generosity":rating_generosity,
        //     "get_star_beauty": rating_beauty,
        //     "get_star_body": rating_body,
        //     "get_star_charm": rating_charm,
        //     "get_star_smarts": rating_smarts,
        //     "met_in_person": met_in_person,
        // }
        console.log(TAG + " callRatingAPI uri " + uri);
        console.log(TAG + " callRatingAPI params " + JSON.stringify(params));

        WebService.callServicePost(
            uri,
            params,
            this.handleRatingResponse
        );
    }

    handleRatingResponse = (response, isError) => {
        console.log(TAG + " handleRatingResponse Response " + JSON.stringify(response));
        console.log(TAG + " handleRatingResponse isError " + isError);

        if (!isError) {

        } else {
            if (response != undefined && response != null && response.length > 0) {
                Alert.alert(response.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }

    };

    ///// rating view
    renderRatingView() {
        return (
            <View style={[{ borderColor: Colors.white, marginTop: 20, backgroundColor: '#faec8e' }]}>
                <View style={{ width: '100%', height: 50, position: 'absolute', top: 0, left: 0, backgroundColor: Colors.black, opacity: 0.1 }}></View>
                <View style={{ width: '100%', height: 50, flexDirection: 'row', paddingLeft: 10, paddingRight: 10, alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={[styles.infoTextHeader, { color: Colors.black, paddingBottom: 0 }, stylesGlobal.font]}>{"Rating"}</Text>
                    <Text style={[{ color: Colors.black, fontSize: 12, marginRight: 10 }, stylesGlobal.font]}>{"(Only you can see this)"}</Text>
                </View>
                <View style={{ width: '100%', height: 250, justifyContent: 'center' }}>
                    <View style={{ width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={[{ color: Colors.black, fontSize: 12 }, stylesGlobal.font]}>{"MET IN PERSON?"}</Text>
                        <TouchableOpacity style={{ width: 20, height: 20, marginLeft: 15 }} onPress={() => this.sendMetInPersonRating("met_in_person", 0)}>
                            <Image style={{ width: '100%', height: '100%', resizeMode: 'contain' }} source={require('../icons/square.png')}></Image>
                            {
                                this.state.met_in_person == "1" &&
                                <Image style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, resizeMode: 'contain' }} source={require('../icons/checked.png')}></Image>
                            }
                        </TouchableOpacity>
                    </View>
                    <View style={{ width: '100%', marginTop: 10, alignItems: 'center' }}>
                        {
                            this.state.profile_user_gender == "male" &&
                            <View style={{ width: '80%', marginTop: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Text style={[{ color: Colors.black, fontSize: 12 }, stylesGlobal.font]}>{"GENEROSITY"}</Text>
                                <StarRating
                                    disabled={this.state.is_verified == "1" ? false : true}
                                    emptyStar={require('../icons/star_unfilled.png')}
                                    fullStar={require('../icons/star_filled.png')}
                                    halfStarEnabled={false}
                                    maxStars={5}
                                    starSize={30}
                                    rating={this.state.rating_generosity}
                                    selectedStar={(rating) => this.sendMetInPersonRating("rating_generosity", rating)}
                                />
                            </View>
                        }
                        {
                            this.state.profile_user_gender == "female" &&
                            <View style={{ width: '80%', marginTop: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Text style={[{ color: Colors.black, fontSize: 12 }, stylesGlobal.font]}>{"BEAUTY"}</Text>
                                <StarRating
                                    disabled={this.state.is_verified == "1" ? false : true}
                                    emptyStar={require('../icons/star_unfilled.png')}
                                    fullStar={require('../icons/star_filled.png')}
                                    halfStarEnabled={false}
                                    maxStars={5}
                                    starSize={30}
                                    rating={this.state.rating_beauty}
                                    selectedStar={(rating) => this.sendMetInPersonRating("rating_beauty", rating)}
                                />
                            </View>
                        }
                        <View style={{ width: '80%', marginTop: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Text style={[{ color: Colors.black, fontSize: 12 }, stylesGlobal.font]}>{"BODY"}</Text>
                            <StarRating
                                disabled={this.state.is_verified == "1" ? false : true}
                                emptyStar={require('../icons/star_unfilled.png')}
                                fullStar={require('../icons/star_filled.png')}
                                halfStarEnabled={false}
                                maxStars={5}
                                starSize={30}
                                rating={this.state.rating_body}
                                selectedStar={(rating) => this.sendMetInPersonRating("rating_body", rating)}
                            />
                        </View>
                        <View style={{ width: '80%', marginTop: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Text style={[{ color: Colors.black, fontSize: 12 }, stylesGlobal.font]}>{"CHARM"}</Text>
                            <StarRating
                                disabled={this.state.is_verified == "1" ? false : true}
                                emptyStar={require('../icons/star_unfilled.png')}
                                fullStar={require('../icons/star_filled.png')}
                                halfStarEnabled={false}
                                maxStars={5}
                                starSize={30}
                                rating={this.state.rating_charm}
                                selectedStar={(rating) => this.sendMetInPersonRating("rating_charm", rating)}
                            />
                        </View>
                        <View style={{ width: '80%', marginTop: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Text style={[{ color: Colors.black, fontSize: 12 }, stylesGlobal.font]}>{"SMARTS"}</Text>
                            <StarRating
                                disabled={this.state.is_verified == "1" ? false : true}
                                emptyStar={require('../icons/star_unfilled.png')}
                                fullStar={require('../icons/star_filled.png')}
                                halfStarEnabled={false}
                                maxStars={5}
                                starSize={30}
                                rating={this.state.rating_smarts}
                                selectedStar={(rating) => this.sendMetInPersonRating("rating_smarts", rating)}
                            />
                        </View>
                    </View>
                </View>
            </View>
        )
    }

    saveNotes = async () => {
        this.setState({
            review_notes_edit: false
        })
        let uri = Memory().env == "LIVE" ? Global.URL_SAVE_NOTES + profileUserId : Global.URL_SAVE_NOTES_DEV + profileUserId
        let params = new FormData();
        params.append("token", this.state.userToken);
        params.append("user_id", this.state.userId);
        params.append("format", "json");
        params.append("note", convertEmojimessagetoString(this.state.review_notes));

        console.log(TAG + " callSaveNotesAPI uri " + uri);
        console.log(TAG + " callSaveNotesAPI params " + JSON.stringify(params));

        WebService.callServicePost(
            uri,
            params,
            this.handleSaveNotesResponse
        );
    }

    handleSaveNotesResponse = (response, isError) => {
        console.log(TAG + " handleSaveNotesResponse Response " + JSON.stringify(response));
        console.log(TAG + " handleSaveNotesResponse isError " + isError);

        if (!isError) {

        } else {
            if (response != undefined && response != null && response.length > 0) {
                Alert.alert(response.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }

    };

    /////// notes view
    renderNotesView() {
        return (
            <View style={[{ borderColor: Colors.white, marginTop: 20, marginLeft: 0, backgroundColor: '#faec8e' }]}>
                <View style={{ width: '100%', height: 50, position: 'absolute', top: 0, left: 0, backgroundColor: Colors.black, opacity: 0.1 }}></View>
                <View style={{ width: '100%', height: 50, flexDirection: 'row', paddingLeft: 10, paddingRight: 10, alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={[styles.infoTextHeader, { color: Colors.black, paddingBottom: 0 }, stylesGlobal.font]}>Notes</Text>
                    <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
                        <Text style={[{ color: Colors.black, fontSize: 12, marginRight: 20 }, stylesGlobal.font]}>(Only you can see this)</Text>
                        {
                            this.state.is_verified == "1" &&
                            <TouchableOpacity onPress={() => this.setState({ review_notes_edit: !this.state.review_notes_edit })}>
                                <Text style={[{ color: Colors.greyDark, fontSize: 13, marginRight: 10 }, stylesGlobal.font]}>Edit</Text>
                            </TouchableOpacity>
                        }
                    </View>
                </View>
                <View style={{ width: '100%', height: 250, paddingTop: 15, paddingBottom: 25, alignItems: 'center', justifyContent: 'center' }}>
                    <View style={{ width: '80%', height: '100%' }} onPress={() => this.setState({ review_notes_edit: true })}>
                        {
                            this.state.review_notes == "" && !this.state.review_notes_edit &&
                            <TouchableOpacity style={{ width: '100%' }} onPress={() => this.setState({ review_notes_edit: true })}>
                                <Text style={[{ width: '100%', color: Colors.black, fontSize: 12 }, stylesGlobal.font]} multiline={true}>Write a note</Text>
                            </TouchableOpacity>
                        }
                        {
                            !this.state.review_notes_edit &&
                            <ScrollView style={{ width: '100%' }}>
                                <Text style={[{ width: '100%', height: '100%', color: Colors.black, fontSize: 12 }, stylesGlobal.font]} multiline={true}>{convertStringtoEmojimessage(this.state.review_notes)}</Text>
                            </ScrollView>
                        }
                        {
                            this.state.review_notes_edit &&
                            <View style={{ width: '100%' }}>
                                <TextInput style={[{ width: '100%', height: 150, paddingLeft: 5, paddingRight: 5, borderRadius: 3, color: Colors.black, fontSize: 12, backgroundColor: Colors.white, textAlignVertical: 'top' }, stylesGlobal.font]} multiline={true}
                                    onChangeText={(text) => this.setState({ review_notes: text })}>{this.state.review_notes}</TextInput>

                                <TouchableOpacity style={[{ width: 60, height: 35, justifyContent: 'center', alignItems: 'center', marginTop: 10, backgroundColor: Colors.gold, borderRadius: 5 }, stylesGlobal.shadow_style]} onPress={() => this.saveNotes()}>
                                    <Text style={[{ color: Colors.white, fontSize: 12 }, stylesGlobal.font]}>Save</Text>
                                </TouchableOpacity>
                            </View>
                        }
                    </View>
                </View>
            </View>
        )
    }


    /**
     * Display block user comfirmation alert
     */
    displayBlockUserDialog = () => {
        if (!myProfileData) {
            return null;
        }

        var userProfileInfo = myProfileData.userProfileInfo;
        let name = userProfileInfo.first_name;
        let title = Constants.LABEL_BLOCK_TITLE.format(name);
        let message = Constants.LABEL_BLOCK_MESSAGE.format(name);

        Alert.alert(title, message,
            [
                {
                    text: 'Block', onPress: () => {
                        this.callBlockAPI()
                    }
                },
                {
                    text: 'Cancel', onPress: () => {

                    }
                }],
            { cancelable: false })
    }

    /**
* repor flag button click
*/
    showReportFlag = (data) => {

        this.ActionSheet.show()
    }

    setModalVisible(visible) {
        this.setState({ modalVisible: visible });
    }

    setReportModalVisible(visible) {
        this.setState({ showReportModel: visible });
    }

    handleCancel = () => {
        this.setState({ modalVisible: false });
    };

    handleOk = () => {
        this.setState({ modalVisible: false });
    };
    /**
* display top header
*/
    renderHeaderView = () => {

        let imageUrl = this.state.userImagePath + Constants.THUMB_FOLDER + this.state.userImageName;

        return (
            <View style={[stylesGlobal.headerView]}>
                <TouchableOpacity style={stylesGlobal.header_backbuttonview_style} onPress={() => {
                    if (this.props.route.params.refreshFavorite != undefined) {
                        this.props.route.params.refreshFavorite(this.state.isMyFav);
                    }
                    this.props.navigation.goBack();
                }}
                >
                    <Image style={stylesGlobal.header_backbuttonicon_style} source={require("../icons/icon_back.png")} />
                </TouchableOpacity>
                <TouchableOpacity style={stylesGlobal.header_logoview_style} onPress={() => this.props.navigation.navigate('Dashboard', { logoclick: true })}>
                    <Image
                        style={stylesGlobal.header_logo_style}
                        source={require("../icons/logo_new.png")}
                    />
                </TouchableOpacity>
                <View style={stylesGlobal.header_searchview_style}>
                    <TextInput
                        ref="searchTextInput"
                        autoCorrect={false}
                        underlineColorAndroid="transparent"
                        returnKeyType={"search"}
                        style={[stylesGlobal.header_searchtextview_style, stylesGlobal.font]}
                        onChangeText={searchText => this.setState({ searchText })}
                        value={this.state.searchText}
                        defaultValue=""
                        multiline={false}
                        autoCapitalize='sentences'
                        onSubmitEditing={this.handleEditComplete}
                        keyboardType='ascii-capable'
                        placeholder="Search members..."
                    />
                    <TouchableOpacity style={stylesGlobal.header_searchiconview_style} onPress={() => {
                        if (this.state.searchText == "") {
                            this.refs.searchTextInput.focus();
                        } else {
                            Keyboard.dismiss();
                            this.setState({
                                searchText: ""
                            })
                        }
                    }}
                    >
                        {
                            this.state.searchText != "" &&
                            <Image
                                style={stylesGlobal.header_searchicon_style}
                                source={require("../icons/connection-delete.png")}
                            />
                        }
                        {
                            this.state.searchText == "" &&
                            <Image
                                style={stylesGlobal.header_searchicon_style}
                                source={require("../icons/dashboard_search.png")}
                            />
                        }
                    </TouchableOpacity>
                </View>
                <TouchableOpacity style={stylesGlobal.header_avatarview_style} onPress={() => this.showPopupView()}>
                    <View style={stylesGlobal.header_avatarsubview_style}>
                        <ImageCompressor style={stylesGlobal.header_avatar_style} uri={imageUrl} />
                    </View>
                </TouchableOpacity>
            </View>
        );
    };

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
    showPopupView = () => {
        this.setState({
            showModel: true
        })
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
            this.props.navigation.navigate("SignInScreen", { isGettingData: false });
        } catch (error) {
            console.log(TAG + " logoutUser error " + error);
        }
    }
    getDataAgain = (refresh) => {
        if (refresh) {
            this.getData();
        }
    }

    renderPopupView = () => {
        return (
            <CustomPopupView
                showModel={this.state.showModel}
                openMyAccountScreen={(show_myaccount, myaccount_initial_tab) => { this.props.navigation.navigate('Dashboard', { selected_screen: "myaccount", myaccount_initial_tab: myaccount_initial_tab }) }}
                logoutUser={this.logoutUser}
                closeDialog={() => { this.setState({ showModel: false }) }}
                prop_navigation={this.props.navigation}
            >

            </CustomPopupView>
        );
    }
    /**
* search button click
*/
    handleEditComplete = () => {
        searchText = this.state.searchText.trim();
        this.setState({
            searchText: searchText,
        });
        if (searchText.length > 0) {
            this.props.navigation.navigate('Dashboard', { selected_screen: "members", search_text: searchText });
        }
    };
    /**
     * display user Header image
     */
    renderDraggableHeaderView = () => {
        if (!myProfileData) {
            return null;
        }
        var userProfileInfo = myProfileData.userProfileInfo;
        var isHiddenFields = myProfileData.isHiddenFields;
        var fullName = userProfileInfo.first_name + " " + (isHiddenFields.last_name != undefined && isHiddenFields.last_name == 1 ? "" : userProfileInfo.last_name);
        var profileImageUrl = userProfileInfo.imgpath + Constants.THUMB_FOLDER + userProfileInfo.filename;
        return (
            <View style={[stylesGlobal.centerLogo, { flexDirection: 'row', height: STICKY_HEADER_HEIGHT, marginTop: 0 }]}>
                <Animatable.View animation="slideInUp" iterationCount={1} direction="alternate" duration={500}
                    style={[stylesGlobal.centerLogo, { flexDirection: 'row', height: STICKY_HEADER_HEIGHT, marginTop: 0 }]}>
                    <View style={{ backgroundColor: Colors.gray, width: 40, height: 40, marginRight: 10, borderRadius: 20 }}>
                        <Image style={{ width: smallProfileImageSize, height: smallProfileImageSize, borderRadius: smallProfileImageSize, resizeMode: 'contain' }}
                            source={{ uri: profileImageUrl }}
                            defaultSource={require("../icons/Background-Placeholder_Camera.png")}
                        />
                    </View>
                    <Text style={[styles.fullnameHeader, stylesGlobal.font_bold]}>
                        {fullName}
                    </Text>
                </Animatable.View>
            </View>
        );
    }
    /**
     * display user cover and profile image
     */
    renderCoverImageView = () => {

        if (!myProfileData) {
            return null;
        }

        var userProfileInfo = myProfileData.userProfileInfo;
        var bannerImageUrl =
            userProfileInfo.profile_background_url +
            userProfileInfo.profile_background;
        var userProfileInfo = myProfileData.userProfileInfo;
        var isHiddenFields = myProfileData.isHiddenFields;
        var fullName = userProfileInfo.first_name + " " + (isHiddenFields.last_name != undefined && isHiddenFields.last_name == 1 ? "" : userProfileInfo.last_name);

        let subText = getProfileSubStr(userProfileInfo)

        return (
            <View style={{ width: '100%', height: this.state.PARALLAX_HEADER_HEIGHT - 6, borderTopLeftRadius: 15, borderTopEndRadius: 15, overflow: 'hidden', alignItems: 'center', backgroundColor: Colors.white }}>
                <ImageCompressor style={{ width: '100%', height: this.state.coverImageHeight, backgroundColor: Colors.black }} uri={bannerImageUrl} />
                <View style={{ position: 'absolute', bottom: 10, alignItems: 'center' }}>
                    <Text style={[styles.fullname, stylesGlobal.font_semibold]}>{fullName}</Text>
                    <Text style={[styles.age, stylesGlobal.font_semibold]}>{subText}</Text>
                    <Text style={[{ fontSize: 12, color: Colors.black }, stylesGlobal.font]}>{"Last Login: " + getRecentLoginTimeFrame(userProfileInfo.last_lognedin)}</Text>
                </View>
            </View>

        );
    };
    /**
    * go to chat screen
    */
    callGetChatToken = async () => {
        try {
            let uri = Memory().env == "LIVE" ? Global.URL_GET_CHAT_TOKEN : Global.URL_GET_CHAT_TOKEN_DEV;
            if (this.state.userToken == undefined) {
                this.setState({ userToken: await AsyncStorage.getItem(Constants.KEY_USER_TOKEN) });
            }
            let params = new FormData();
            params.append("token", this.state.userToken);
            params.append("format", "json");
            
            this.setState({loading: true});
            console.log(TAG + " callGetChatTokenAPI uri " + uri, this.state.userToken);
            console.log(TAG + " callGetChatTokenAPI params " + JSON.stringify(params));
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
        }
    };
    /**
     * handle get chat token API response
     */
    handleCallGetChatTokenResponse = async (response, isError) => {
         console.log(TAG + " callGetChatTokenAPI Response " + JSON.stringify(response));
        console.log(TAG + " callGetChatTokenAPI isError " + isError);
        if (!isError) {
            if (response != null && response.status == "success") {
                Global.CHAT_AUTH_TOKEN = response.data.chatToken;
                this.setState(
                    { chatAuthToken: response.data.chatToken, loading: true },
                    () => this.firebaseAuthWithToken());
            }
        } else {
            this.setState({loading: false});
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
                this.setState({loading: false});
                console.log("firebase auth error", error);
            });
    };

    handleFirebaseRecentChatResponse = async (response, isError, type) => {

        this.setState({loading: false,  got_chat_token: true});
        if(isError)
        {
            Alert.alert("Failed to get user chat list");
            if(this.unsubscribe)
                this.unsubscribe();
            return;
        }
        
        let grpId = "";
        let is_old = 1;
       

        // if(type != "a")
        // {
        //     if(this.unsubscribe)
        //         this.unsubscribe();
        //     return;
        // }

        if(type === "a")
        {
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
        console.log(memberUsersLastMsg)
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
                            if (memberUsersLastMsg[j].members_user_id[0].toString() === memberUserDatas[i].id.toString()) {
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

                 console.log('hhhh*****hhhhhhh = ',myProfileData.userProfileInfo.id.toString(), chatUserList.map(iii => ({id:iii.userId, id2:iii.id})), '----****------');
        // return;
            } catch (error) {
                
                if (error != undefined && error != null && error.length > 0) {
                    Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
                }
            }
            
            //console.log('user list from server', chatUserList);
          
            for (var i = 0; i < chatUserList.length; i++) {
                let each_res = chatUserList[i];
                //console.log(each_res.userId , this.state.userId)//myProfileData.userProfileInfo.id.toString())
                if (each_res.userId === myProfileData.userProfileInfo.id.toString()) {
                    this.setState({ grpId: each_res.id , is_old: each_res.is_old });
                    break;
                }
            }
        }
        }
        
// 
//         if(this.unsubscribe)
//                 this.unsubscribe();

        // if (isError) {
        // } else {
        //     for (var i = 0; i < response.length - 1; i++) {
        //         var data = response[i];
        //         if (data.members_user_id[0] == myProfileData.userProfileInfo.id) {
        //             // console.log(" data =====", data);
        //             this.setState({ grpId: data.id });
        //             this.setState({ is_old: data.is_old });
        //             break;
        //         }
        //     }
        // }

    };

    goToChatScreen = () => {
        console.log('myprofiledata    , this.state.got_chat_token', myProfileData, this.state.got_chat_token)
        if (!myProfileData  || !this.state.got_chat_token) {
            return null;
        }

console.log('profilessssss   ', this.state.grpId)
       // return;
        var user = {
            first_name: myProfileData.userProfileInfo.first_name,
            last_name: myProfileData.userProfileInfo.last_name,
            slug: myProfileData.userProfileInfo.slug,
            imgpath: myProfileData.userProfileInfo.imgpath + myProfileData.userProfileInfo.filename,
            filename: myProfileData.userProfileInfo.filename,
            id: myProfileData.userProfileInfo.id,
            imageUri: myProfileData.userProfileInfo.imgpath + Constants.THUMB_FOLDER + myProfileData.userProfileInfo.filename,
            grpId: (!this.state.grpId || this.state.grpId === "") ? undefined : this.state.grpId,
            is_old: this.state.is_old
        };

        // this.props.navigation.navigate('MyRecentMessagesScreen', {move2chat: true, user: user});
        //console.log(TAG, '>>>>>>>>>>>>>>>', user, myProfileData)
// console.log('====>>>>', this.state.grpId, user);
//         return;
        this.props.navigation.navigate("UserChat", {
            user: user,
            refreshList: this.updateRecentChatList,
            messageId: this.state.grpId ,
        });

        if(this.unsubscribe)
                this.unsubscribe();
    }

    updateRecentChatList = (isRefresh) => {

    };

    /**
    * get profile info API again
    */
    getDataAgain = (refresh) => {
        if (refresh) {
            this.getData()
        }
    }
    /**
     * display user name info
     */
    renderFullName = () => {

        if (!myProfileData) {
            return null;
        }

        var userProfileInfo = myProfileData.userProfileInfo;
        var profileImageUrl = userProfileInfo.imgpath + userProfileInfo.filename;
        var profileThumbNailImageUrl = userProfileInfo.imgpath + Constants.THUMB_FOLDER + userProfileInfo.filename;
        var bannerImageUrl = userProfileInfo.profile_background_url + userProfileInfo.profile_background;
        var fullName = userProfileInfo.first_name + " " + userProfileInfo.last_name;
        var memberPlanName = userProfileInfo.membership_plan_name;
        var age = userProfileInfo.age;
        var isHiddenFields = myProfileData.isHiddenFields;

        return (
            <View style={{ flex: 1, alignItems: 'center', marginRight: card_padding }}>
                <TouchableOpacity style={{ flexDirection: 'row', height: this.state.coverImageHeight, width: width, position: 'absolute', backgroundColor: Colors.transparent }}
                    onPress={() => {
                        if (!myProfileData) {
                            return null;
                        }
                        this.props.navigation.navigate("ImageZoom", {
                            index: 0,
                            tempGalleryUrls: [{
                                id: bannerImageUrl,
                                image: { uri: bannerImageUrl }
                            }]
                        });
                    }}
                >
                </TouchableOpacity>
                <View style={{ marginTop: 34, backgroundColor: Colors.transparent }}>
                    <TouchableOpacity style={{ borderRadius: this.state.profileImageSize }}
                        onPress={() => {
                            this.props.navigation.navigate("ImageZoom", {
                                index: 0,
                                tempGalleryUrls: [{
                                    id: profileImageUrl,
                                    image: { uri: profileImageUrl },
                                    thumb: { uri: profileThumbNailImageUrl }
                                }]
                            })
                        }}
                    >
                        <ImageCompressor
                            uri={isHiddenFields.avatar != undefined && isHiddenFields.avatar == 1 ? '../icons/Background-Placeholder_Camera.png' : profileThumbNailImageUrl}
                            style={{
                                backgroundColor: Colors.gray,
                                overflow: 'hidden',
                                borderRadius: this.state.profileImageSize / 2,
                                width: this.state.profileImageSize,
                                height: this.state.profileImageSize
                            }}
                        />
                    </TouchableOpacity>
                    {
                        ((this.state.is_verified == "1" && this.state.member_plan != "4" && this.state.member_plan != "7" && this.state.member_plan != "8") ||
                            ((this.state.member_plan == "4" || this.state.member_plan == "7" || this.state.member_plan == "8") && (userProfileInfo.member_plan == "4" || userProfileInfo.member_plan == "7" || userProfileInfo.member_plan == "8"))) &&
                        <TouchableOpacity style={[{ width: 80, height: 80, position: 'absolute', borderRadius: 40 }, this.state.is_portrait ? { bottom: 10, right: 10 } : { bottom: 0, right: 0 }]}
                            onPress={() => {
                                this.callFavouriteActionAPI(userProfileInfo.id)
                            }
                            }
                        >
                            <Image style={styles.smallProfileImageContainer} source={this.state.isMyFav ? require('../icons/full_favorite_red.png') : require('../icons/full_favorite_black.png')}></Image>
                        </TouchableOpacity>
                    }
                    {
                        (((this.state.member_plan == "4" || this.state.member_plan == "7" || this.state.member_plan == "8") && (userProfileInfo.member_plan != "4" && userProfileInfo.member_plan != "7" && userProfileInfo.member_plan != "8"))) &&
                        <TouchableOpacity style={[{ width: 80, height: 80, position: 'absolute', borderRadius: 40 }, this.state.is_portrait ? { bottom: 40, right: 35 } : { bottom: 20, right: 20 }]}
                            onPress={() => {
                                // if(this.state.is_verified != "1") {
                                //     Alert.alert(Constants.NOT_APPROVED_MESSAGE, "");
                                //     return;
                                // }
                                this.callFollowRequestAPI(userProfileInfo.id)
                            }
                            }
                        >
                            <Image style={styles.smallProfileImageContainer} source={this.state.isFollowing ? require('../icons/following.png') : require('../icons/following_un.png')}></Image>
                        </TouchableOpacity>
                    }
                </View>
            </View>
        );
    };
    /**
    * display user info
    */
    renderUserInfo = () => {

        if (!myProfileData) {
            return null;
        }

        var userProfileInfo = myProfileData.userProfileInfo;
        var memberPlanName = userProfileInfo.membership_plan_name;
        var age = userProfileInfo.age;
        var heightView = null;
        if (myProfileData.userCustomFields.height != undefined && myProfileData.userCustomFields.height != null && myProfileData.userCustomFields.height != "" && myProfileData.userCustomFields.height != "Not Set") {
            var height = myProfileData.userCustomFields.height;
            heightView = (
                <View style={{ flexDirection: "row", flex: 1, justifyContent: "center", alignItems: 'center' }}>
                    <Image style={{ height: 50, width: 30, resizeMode: 'contain' }} source={require("../icons/icon_profile_model_height.png")} />
                    <View style={{ marginLeft: 5 }}>
                        <Text style={[{ color: Colors.black, fontSize: 12 }, stylesGlobal.font]}>HEIGHT:</Text>
                        <Text style={[{ color: Colors.black, fontSize: 12 }, stylesGlobal.font]}>{height}</Text>
                    </View>
                </View>
            )
        }


        var goldCoinView = null;
        if (myProfileData.userProfileInfo.gold_coins != undefined && myProfileData.userProfileInfo.gold_coins != null && myProfileData.userProfileInfo.gold_coins != "" && myProfileData.userProfileInfo.gold_coins != "Not Set") {
            var goldCoin = myProfileData.userProfileInfo.gold_coins;
            goldCoinView = (
                <View style={{ flexDirection: "row", flex: 1, justifyContent: "center", alignItems: 'center' }}>
                    <Image style={{ height: 50, width: 30, resizeMode: 'contain' }} source={require("../icons/goldCoin10New.png")} />
                    <View style={{ marginLeft: 10 }}>
                        <Text style={[{ color: Colors.black, fontSize: 12 }, stylesGlobal.font]}>GOLD COINS:</Text>
                        <Text style={[{ color: Colors.black, fontSize: 12 }, stylesGlobal.font]}>{goldCoin}</Text>
                    </View>
                </View>
            )
        }


        var bodyView = null
        if (myProfileData.userCustomFields.body != undefined && myProfileData.userCustomFields.body != null && myProfileData.userCustomFields.body != "" && myProfileData.userCustomFields.body != "Not Set") {
            var body = myProfileData.userCustomFields.body;
            bodyView = (
                <View style={{ flexDirection: "row", flex: 1, justifyContent: "center", alignItems: 'center' }}>
                    <Image style={{ height: 50, width: 40, resizeMode: 'contain' }} source={require("../icons/icon_profile_model_body.png")} />
                    <View style={{ marginLeft: 10 }}>
                        <Text style={[{ color: Colors.black, fontSize: 12 }, stylesGlobal.font]}>BODY:</Text>
                        <Text style={[{ color: Colors.black, fontSize: 12 }, stylesGlobal.font]}>{body}</Text>
                    </View>
                </View>
            );
        }

        var connectionsView = null;
        if (myProfileData.connections != undefined && myProfileData.connections != null && myProfileData.connections != "" && myProfileData.connections != "Not Set") {
            var connections = myProfileData.connections;
            connectionsView = (
                <View style={{ flexDirection: "row", flex: 1, justifyContent: "center", alignItems: 'center' }}>
                    <Image style={{ height: 45, width: 45, resizeMode: 'contain' }} source={require("../icons/full_favorite_black.png")} />
                    <View style={{ marginLeft: 10 }}>
                        <Text style={[{ color: Colors.black, fontSize: 12 }, stylesGlobal.font]}>FAVORITES:</Text>
                        <Text style={[{ color: Colors.black, fontSize: 12 }, stylesGlobal.font]}>{connections}</Text>
                    </View>
                </View>
            )
        }

        var netWorthView = null;
        var netWorth = "";
        if (myProfileData.userCustomFields.net_worth != undefined && myProfileData.userCustomFields.net_worth != null && myProfileData.userCustomFields.net_worth != "" && myProfileData.userCustomFields.net_worth != "Not Set") {
            netWorth = myProfileData.userCustomFields.net_worth;
        } else {
            netWorth = "< $2M";
        }
        netWorthView = (
            <View style={{ flexDirection: "row", flex: 1, justifyContent: "center", alignItems: 'center' }}>
                <Image style={{ width: 33, height: 28 }} source={require("../icons/icon_profile_diamond.png")} />
                <View style={{ marginLeft: 10 }}>
                    <Text style={[{ color: Colors.black, fontSize: 12 }, stylesGlobal.font]}>NET WORTH:</Text>
                    <View style={{ flexDirection: "row", marginTop: 2 }}>
                        <Text style={[{ color: Colors.black, fontSize: 12 }, stylesGlobal.font]}>{netWorth}</Text>
                        {
                            this.state.networth_verified_on != null && this.state.networth_verified_on != undefined && this.state.networth_verified_on != "" &&
                            <Image style={{ width: 33, height: 20, resizeMode: 'contain', marginTop: -2, marginLeft: -5 }} source={require('../icons/verify_checkmark.png')}></Image>
                        }
                    </View>
                </View>
            </View>
        )


        let leftView = null;
        let rightView = null;
        if (myProfileData.userProfileInfo.type != undefined && myProfileData.userProfileInfo.type != null && myProfileData.userProfileInfo.type != "" && myProfileData.userProfileInfo.type != "Not Set") {
            if (myProfileData.userProfileInfo.type.toUpperCase() == "MODEL") {
                leftView = heightView;
                rightView = bodyView;
            } else if (myProfileData.userProfileInfo.type.toUpperCase() == "RICH" || myProfileData.userProfileInfo.type.toUpperCase() == "GENEROUS") {
                leftView = goldCoinView;
                rightView = netWorthView;
            } else if (myProfileData.userProfileInfo.type.toUpperCase() == "CONNECTOR") {
                leftView = goldCoinView;
                // rightView = connectionsView;
            } else if (myProfileData.userProfileInfo.type.toUpperCase() == "FAMOUS") {
                leftView = goldCoinView;
            }
        }

        return (
            <View style={{ width: '100%', height: 60, flexDirection: 'row', backgroundColor: Colors.white }}>
                {leftView != null ? <View style={{ flex: 0.5, width: (this.state.screen_width - card_padding * 2) / 2 }}>{leftView}</View>
                    : null}

                {rightView != null ?
                    <View style={{ flex: 0.5, width: (this.state.screen_width - card_padding * 2) / 2 }}>{rightView}</View>
                    : null}
                {
                    this.state.is_verified == "1" &&
                    <TouchableOpacity style={{ alignItems: 'center', flex: 0.2, justifyContent: 'center' }} onPress={() => { this.showReportFlag(profileUserId); }}>
                        <Image style={{ tintColor: Colors.black }} source={require("../icons/menu_icon.png")} />
                    </TouchableOpacity>
                }
            </View>
        )
    }
    /**
    * display action buttons
    */
    renderActionButtons = () => {
        if (!myProfileData) {
            return null;
        }
        var userProfileInfo = myProfileData.userProfileInfo;
        var hasConnections = myProfileData.hasConnections;
        let inviteToEventButton = (
            <TouchableOpacity style={{ width: this.state.is_portrait ? '22%' : '10%', alignItems: 'center', marginTop: 10 }}
                onPress={() => {
                    if (this.state.is_verified != 1) {
                        Alert.alert(Constants.NOT_APPROVED_MESSAGE, "");
                        return;
                    }
                    this.onInvitePress();
                }}>
                <View style={{ width: '100%', aspectRatio: 1 }}>
                    <Image style={styles.countImage} source={require("../icons/send_invitetoevent.png")} />
                </View>
                <Text style={[styles.actionButtonText, stylesGlobal.font]}>{"INVITE TO\nEVENT"}</Text>
            </TouchableOpacity>
        );

        let timeLineButton = (
            <TouchableOpacity style={{ width: this.state.is_portrait ? '22%' : '10%', alignItems: 'center', marginTop: 10 }}
                onPress={() => {
                    if (this.state.is_verified != 1) {
                        Alert.alert(Constants.NOT_APPROVED_MESSAGE, "");
                        return;
                    }
                    this.onTimeLinePress();
                }}>
                <View style={{ width: '100%', aspectRatio: 1 }}>
                    <Image style={styles.countImage} source={require("../icons/send_timeline.png")} />
                </View>
                <Text style={[styles.actionButtonText, stylesGlobal.font]}>{"VIEW\nTIMELINE"}</Text>
            </TouchableOpacity>
        );

        let messageButton = (
            <TouchableOpacity style={{ width: this.state.is_portrait ? '22%' : '10%', alignItems: 'center', marginTop: 10 }}
                onPress={() => {
                    if (this.state.is_verified != 1) {
                        Alert.alert(Constants.NOT_APPROVED_MESSAGE, "");
                        return;
                    }
                    this.goToChatScreen()
                }}>
                <View style={{ width: '100%', aspectRatio: 1 }}>
                    <Image style={styles.countImage} source={require("../icons/send_message.png")} />
                </View>
                <Text style={[styles.actionButtonText, stylesGlobal.font]}>{"SEND A\nMESSAGE"}</Text>
            </TouchableOpacity>
        )

        let sendRoseButton = (
            <TouchableOpacity style={{ width: this.state.is_portrait ? '22%' : '10%', alignItems: 'center', marginTop: 10 }}
                onPress={() => {
                    if (this.state.is_verified != 1) {
                        Alert.alert(Constants.NOT_APPROVED_MESSAGE, "");
                        return;
                    }
                    this.setState({
                        showSendRoseConfirmModal: true,
                        showSendRoseResultModal: false
                    })

                }}>
                <View style={{ width: '100%', aspectRatio: 1 }}>
                    <Image style={[styles.countImage]} source={require('../icons/send_rose.png')} />
                </View>
                <Text style={[styles.actionButtonText, stylesGlobal.font]}>{"SEND A\nROSE"}</Text>
            </TouchableOpacity>
        )

        let addToListButton = (
            <TouchableOpacity style={{ width: this.state.is_portrait ? '22%' : '10%', alignItems: 'center', marginTop: 10 }}
                onPress={() => {
                    if (this.state.is_verified != 1) {
                        Alert.alert(Constants.NOT_APPROVED_MESSAGE, "");
                        return;
                    }
                    this.getMyList();

                }}>
                <View style={{ width: '100%', aspectRatio: 1 }}>
                    <Image style={styles.countImage} source={require("../icons/send_addlist.png")} />
                </View>
                <Text style={[styles.actionButtonText, stylesGlobal.font]}>{"ADD TO\nFRIEND LIST"}</Text>
            </TouchableOpacity>
        )

        let sendGoldCoinButton = (
            <TouchableOpacity style={{ width: this.state.is_portrait ? '22%' : '10%', alignItems: 'center', marginTop: 10 }}
                onPress={() => {
                    if (this.state.is_verified != 1) {
                        Alert.alert(Constants.NOT_APPROVED_MESSAGE, "");
                        return;
                    }
                    this.props.navigation.navigate("GiftList", { receiver: myProfileData.userProfileInfo, send_gold_coin: true })
                }}>
                <View style={{ width: '100%', aspectRatio: 1 }}>
                    <Image style={styles.countImage} source={require("../icons/send_goldcoins.png")} />
                </View>
                <Text style={[styles.actionButtonText, stylesGlobal.font]}>{"SEND GOLD\nCOINS"}</Text>
            </TouchableOpacity>
        )

        let sendGiftButton = (
            <TouchableOpacity style={{ width: this.state.is_portrait ? '22%' : '10%', alignItems: 'center', marginTop: 10 }}
                onPress={() => {
                    if (this.state.is_verified != 1) {
                        Alert.alert(Constants.NOT_APPROVED_MESSAGE, "");
                        return;
                    }
                    this.props.navigation.navigate("GiftList", { receiver: myProfileData.userProfileInfo })
                }}>
                <View style={{ width: '100%', aspectRatio: 1 }}>
                    <Image style={styles.countImage} source={require("../icons/send_gift.png")} />
                </View>
                <Text style={[styles.actionButtonText, stylesGlobal.font]}>{"SEND A\nGIFT"}</Text>
            </TouchableOpacity>
        )

        let wishListButton = (
            <TouchableOpacity style={{ width: this.state.is_portrait ? '22%' : '10%', alignItems: 'center', marginTop: 10 }}
                onPress={() => {
                    if (this.state.is_verified != 1) {
                        Alert.alert(Constants.NOT_APPROVED_MESSAGE, "");
                        return;
                    }
                    this.props.navigation.navigate("MyWishListScreen", { receiver: myProfileData.userProfileInfo });
                }}>
                <View style={{ width: '100%', aspectRatio: 1 }}>
                    <Image style={styles.countImage} source={require("../icons/send_wishlist.png")} />
                </View>
                <Text style={[styles.actionButtonText, stylesGlobal.font]}>{"VIEW\nWISH LIST"}</Text>
            </TouchableOpacity>
        )

        return (
            <View style={{ backgroundColor: Colors.white, borderBottomLeftRadius: 15, borderBottomRightRadius: 15, paddingBottom: 15, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-around' }}>
                {sendRoseButton}
                {sendGiftButton}
                {sendGoldCoinButton}
                {messageButton}
                {inviteToEventButton}
                {timeLineButton}
                {wishListButton}
                {addToListButton}
            </View>
        )
    }


    /**
* display connection list data
*/
    renderMyConnections = () => {

        return (
            <View style={{ marginTop: 20 }}>
                <Text style={[{ color: Colors.gold, fontSize: 14, width: this.state.screen_width - card_padding * 2, paddingLeft: 10, paddingBottom: 5 }, stylesGlobal.font]}>{"FAVORITES"}</Text>
                <View style={{ backgroundColor: Colors.darkGray, width: this.state.screen_width - card_padding * 2, borderRadius: 20, paddingLeft: 10, paddingBottom: 5, paddingTop: 5 }}>
                    {this.renderConnectionList()}
                </View>
            </View>
        );
    }

    renderConnectionList = () => {
        var len = this.state.connectionList.length;
        var displayViewAll = false;
        if (this.state.is_portrait) {
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
            <View style={[{ width: '100%', flexDirection: 'row', alignItems: 'center' }, displayViewAll ? { justifyContent: 'space-around' } : null]}>
                {
                    this.state.connectionList.map((item, index) =>
                        index < len && this.renderConnectionItem(item, index, displayViewAll)
                    )
                }
                {
                    displayViewAll && this.renderConnectionItem(null, -1)
                }
            </View>
        );
    }
    /**
* display connection row data
*/
    renderConnectionItem = (data, index, displayViewAll) => {

        var urlToShow = "";
        if (data != null) {
            urlToShow = data.imgpath + Constants.THUMB_FOLDER + data.filename;
        }

        return (
            <View key={index}
                style={{
                    width: this.state.is_portrait ? '18%' : '10%',
                    aspectRatio: 1,
                    justifyContent: "center",
                    marginRight: displayViewAll ? 0 : (this.state.screen_width - card_padding * 2) * 0.1 / 5,
                    borderRadius: this.state.is_portrait ? (this.state.screen_width - card_padding * 2) * 0.18 / 2 : (this.state.screen_width - card_padding * 2) * 0.1 / 2,
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
                        if (data == null) {
                            this.props.navigation.navigate("FriendConnection", {
                                slug: this.state.userSlug,
                                favorite_user_id: myProfileData.userProfileInfo.id
                            });
                        } else {
                            if (data.id === this.state.userId) {
                                this.props.navigation.navigate("MyProfile", {
                                    refreshProfileImage: this.refreshProfileImage
                                });
                            } else {
                                this.props.navigation.navigate("ProfileDetail", {
                                    slug: data.slug
                                });
                                this.clearStateData();
                                this.getData()
                            }
                        }
                    }}>
                    {
                        data == null &&
                        <Text style={[{ color: Colors.white, fontSize: 10, }, stylesGlobal.font]}>{Constants.VIEW_ALL}</Text>
                    }
                    {
                        data != null &&
                        <ImageCompressor style={{ backgroundColor: Colors.white, width: '100%', height: '100%', }} uri={urlToShow} />
                    }
                </TouchableOpacity>
            </View>
        );
    }

    refreshProfileImage = async () => {

    }

    /**
     * display user profile info
     */
    renderMyInfo = () => {
        var userProfileInfo = myProfileData.userProfileInfo;
        var userCustomFields = myProfileData.userCustomFields;
        var isHiddenFields = myProfileData.isHiddenFields;

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
        var dob_verified_on = myProfileData.profileData.dob_verified_on;

        var location = userProfileInfo.address;
        var language = userCustomFields.languages_known;
        var aboutMe = userProfileInfo.general_info;
        var thinkILike = userProfileInfo.things_i_like;
        var userShapeColor = [];
        var age = getUserAge(dob);
        if (age > 0) {
            //userShapeColor.push({ title: "AGE", value: age });
            if(userProfileInfo.dob_verified_on)
                userShapeColor.push({ title: "AGE", value: age, verified: true });
            else
                userShapeColor.push({ title: "AGE", value: age, });
            // var formatted_dob = Moment(dob).format("DD MMM YYYY");
            // if (isHiddenFields.age != undefined && isHiddenFields.age == 1) {
            //     userShapeColor.push({ title: "AGE", value: "" });
            // }
            // else {
            //     if (this.state.today_birthday) {
            //         userShapeColor.push({ title: "AGE", dob: formatted_dob, value: age, dob_verified_on: dob_verified_on });
            //     } else if (dob_verified_on != null && dob_verified_on != undefined) {
            //         userShapeColor.push({ title: "AGE", value: age, dob_verified_on: dob_verified_on });
            //     } else {
            //         userShapeColor.push({ title: "AGE", value: age });
            //     }
            // }
        }
        if (isHiddenFields.hair_color != undefined && isHiddenFields.hair_color == 1) {
            userShapeColor.push({ title: "HAIR COLOR", value: "" });
        }
        else {
            userShapeColor.push({ title: "HAIR COLOR", value: hair_color });
        }
        if (isHiddenFields.eye_color != undefined && isHiddenFields.eye_color == 1) {
            userShapeColor.push({ title: "EYE COLOR", value: "" });
        }
        else {
            userShapeColor.push({ title: "EYE COLOR", value: eye_color });
        }
        if (isHiddenFields.skin_color != undefined && isHiddenFields.skin_color == 1) {
            userShapeColor.push({ title: "SKIN COLOR", value: "" });
        }
        else {
            userShapeColor.push({ title: "SKIN COLOR", value: skin_color });
        }
        userShapeColor.push({ title: "HEIGHT", value: height });
        // if (isHiddenFields.height != undefined && isHiddenFields.height == 1) {
        //     userShapeColor.push({ title: "HEIGHT", value: "" });
        // }
        // else {
        //     userShapeColor.push({ title: "HEIGHT", value: height });
        // }
        if (isHiddenFields.weight != undefined && isHiddenFields.weight == 1) {
            userShapeColor.push({ title: "WEIGHT", value: "" });
        }
        else {
            userShapeColor.push({ title: "WEIGHT", value: weight });
        }
        if (isHiddenFields.marital_status != undefined && isHiddenFields.marital_status == 1) {
            userShapeColor.push({ title: "MARITAL STATUS", value: "" });
        }
        else {
            userShapeColor.push({ title: "MARITAL STATUS", value: marital_status });
        }
        if (isHiddenFields.body != undefined && isHiddenFields.body == 1) {
            userShapeColor.push({ title: "BODY", value: "" });
        }
        else {
            userShapeColor.push({ title: "BODY", value: body });
        }
        if (isHiddenFields.ethnicity != undefined && isHiddenFields.ethnicity == 1) {
            userShapeColor.push({ title: "ETHNICITY", value: "" });
        }
        else {
            userShapeColor.push({ title: "ETHNICITY", value: ethnicity });
        }

        if (!myProfileData) {
            return null;
        }
        return (
            <View style={{ marginTop: 20, backgroundColor: Colors.white, borderRadius: 15, }}>
                <View style={{ alignItems: 'center', paddingBottom: 20 }}>
                    <Image source={require("../icons/personal.png")} style={{ resizeMode: 'contain', width: 40, height: 40, marginTop: 15 }} />
                    <Text style={[{ color: Colors.black, fontSize: 20, marginTop: 10 }, stylesGlobal.font_semibold]}>Personal Details</Text>
                    <FlatList
                        style={{ width: '100%', }}
                        columnWrapperStyle={{ width: '100%', marginBottom: 10 }}
                        extraData={this.state}
                        numColumns={this.state.is_portrait ? 3 : 5}
                        key={this.state.is_portrait ? 3 : 5}
                        keyExtractor={(item, index) => index.toString()}
                        data={userShapeColor}
                        renderItem={({ item }) => {
                            
                            return (
                                <View style={{ alignItems: 'center', justifyContent: 'center', width: this.state.is_portrait ? '33%' : '10%', aspectRatio: 1 }}>
                                    <View style={{ alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.gold, width: '80%', aspectRatio: 1, borderRadius: 5 }}>
                                        {//item.value != null && item.value != undefined && item.value != "" && item.dob_verified_on != null && item.dob_verified_on != "" && item.dob_verified_on != undefined 
                                            item.title == "AGE" && item.verified &&
                                            <View style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                                <Text style={[{ marginBottom: 10, color: Colors.white, fontSize: 10, }, stylesGlobal.font]}>{item.title}</Text>
                                                <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center'}}>
                                                    <Text style={[{ fontSize: 10, textAlign: 'center' }, stylesGlobal.font]}>{item.value}</Text>
                                                    <Image style={{ width: 20, height: 20, resizeMode: 'contain', marginLeft: 5 }} source={require('../icons/verify_checkmark.png')}></Image>
                                                </View>
                                            </View>
                                        }
                                        {
                                            item.title == "AGE" && !item.verified &&
                                            <View style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                                <Text style={[{ marginBottom: 10, color: Colors.white, fontSize: 10, }, stylesGlobal.font]}>{item.title}</Text>
                                                <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center'}}>
                                                    <Text style={[{ fontSize: 10, textAlign: 'center' }, stylesGlobal.font]}>{item.value}</Text>
                                                    
                                                </View>
                                            </View>
                                        }
                                        {/* { */}
                                        {/*     item.title == "AGE" && item.dob_verified_on == null && */}
                                        {/*     <> */}
                                        {/*         <Text style={[{ marginBottom: 10, color: Colors.white, fontSize: 10, }, stylesGlobal.font]}>{item.title}</Text> */}
                                        {/*         { */}
                                        {/*             item.value != "" ? */}
                                        {/*                 <Text style={[{ fontSize: 10, textAlign: 'center' }, stylesGlobal.font]}>{item.value}</Text> : */}
                                        {/*                 <Image style={{ width: 25, height: 25 }} resizeMode={'contain'} source={require('../icons/signin_password.png')} /> */}
                                        {/*         } */}
                                        {/*     </> */}
                                        {/* } */}
                                        {
                                            item.title != "AGE" &&
                                            <View style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                                <Text style={[{ marginBottom: 10, color: Colors.white, fontSize: 10, }, stylesGlobal.font]}>{item.title}</Text>
                                                {
                                                    item.value != "" ?
                                                        <Text style={[{ fontSize: 10, textAlign: 'center' }, stylesGlobal.font]}>{item.value}</Text> :
                                                        <Image style={{ width: 25, height: 25 }} resizeMode={'contain'} source={require('../icons/signin_password.png')} />
                                                }
                                            </View>
                                        }
                                        {
                                            item.dob &&
                                            <Text style={[{ fontSize: 10, textAlign: 'center' }, stylesGlobal.font]}>{item.dob}</Text>
                                        }
                                    </View>
                                </View>
                            )
                        }}
                    />
                    {/* <View style={{ width:"80%"}}>
                        <FlatGrid
                            itemDimension={80}
                            fixed
                            data={userShapeColor}
                            renderItem={({item, index}) => (
                                <View style={{alignItems:'center', justifyContent:'center', backgroundColor:Colors.gold, width:80, height:80, borderRadius:5}}>
                                {
                                    <View style={{width: '100%', height: '100%', alignItems:'center', justifyContent:'center'}}>
                                        <Text style={[{marginBottom:10, color:Colors.white, fontSize:8, textAlign: 'center'}, stylesGlobal.font]}>{item.title}</Text>
                                        <Text style={[{fontSize:10, textAlign: 'center'}, stylesGlobal.font]}>{item.value}</Text>
                                    {
                                        item.dob &&
                                        <Text style={[{fontSize:10, textAlign: 'center'}, stylesGlobal.font]}>{item.dob}</Text>
                                    }
                                    </View>
                                }
                                </View>
                            )}
                        />
                    </View> */}
                    <Image source={require("../icons/pin.png")} style={{ resizeMode: 'contain', width: 40, height: 40, marginTop: 15 }} />
                    <Text style={[{ color: Colors.black, fontSize: 20, marginTop: 10 }, stylesGlobal.font_semibold]}>Location:</Text>
                    {isHiddenFields.location != undefined && isHiddenFields.location == 1 ?
                        <Image style={{ width: 30, height: 30 }} resizeMode={'contain'} source={require('../icons/signin_password.png')} /> :
                        <Text style={[styles.infoCardValue, stylesGlobal.font]}>{location}</Text>
                    }
                    <Image source={require("../icons/languages.png")} style={{ resizeMode: 'contain', width: 40, height: 40, marginTop: 15 }} />
                    <Text style={[{ color: Colors.black, fontSize: 20, marginTop: 10 }, stylesGlobal.font_semibold]}>Languages:</Text>
                    <Text style={[styles.infoCardValue, stylesGlobal.font]}>{language}</Text>
                    <Image source={require("../icons/aboutme.png")} style={{ resizeMode: 'contain', width: 40, height: 40, marginTop: 15 }} />
                    <Text style={[{ color: Colors.black, fontSize: 20, marginTop: 10 }, stylesGlobal.font_semibold]}>About Me:</Text>
                    {isHiddenFields.general_info != undefined && isHiddenFields.general_info == 1 ?
                        <Image style={{ width: 30, height: 30 }} resizeMode={'contain'} source={require('../icons/signin_password.png')} /> :
                        <Text style={[styles.infoCardValue, stylesGlobal.font, { textAlign: 'center' }]}>{aboutMe}</Text>
                    }
                    <Image source={require("../icons/interests.png")} style={{ resizeMode: 'contain', width: 40, height: 40, marginTop: 15 }} />
                    <Text style={[{ color: Colors.black, fontSize: 20, marginTop: 10 }, stylesGlobal.font_semibold]}>Interests:</Text>
                    {isHiddenFields.things_i_like != undefined && isHiddenFields.things_i_like == 1 ?
                        <Image style={{ width: 30, height: 30 }} resizeMode={'contain'} source={require('../icons/signin_password.png')} /> :
                        <Text style={[styles.infoCardValue, stylesGlobal.font, { textAlign: 'center' }]}>{thinkILike}</Text>
                    }
                </View>
            </View>
        );
    };

    /**
     * display user address info
     */
    renderLocationInfo = () => {
        if (!myProfileData) {
            return null;
        }
        var userProfileInfo = myProfileData.userProfileInfo;
        var location = userProfileInfo.address;
        return (
            <View style={[styles.viewContainerWithShadow]}>
                <View style={styles.infoCardView}>
                    <Image style={styles.infoCardIconView} resizeMode={"contain"} source={require("../icons/profile_location.png")} />
                    <View style={styles.infoCardDetailView}>
                        <Text style={[styles.infoTextHeader, stylesGlobal.font]}>{Constants.LABEL_LOCATION}</Text>
                        <Text style={[styles.infoCardValue, stylesGlobal.font]}>{location}</Text>
                    </View>
                </View>
            </View>
        );
    };

    /**
     * display user about me info
     */
    renderAboutMe = () => {
        if (!myProfileData) {
            return null;
        }
        var userProfileInfo = myProfileData.userProfileInfo;
        var aboutMe = userProfileInfo.general_info;
        return (
            <View style={[styles.viewContainerWithShadow]}>
                <View style={styles.infoCardView}>
                    <Image style={styles.infoCardIconView} resizeMode={"contain"} source={require("../icons/profile_about.png")} />
                    <View style={styles.infoCardDetailView}>
                        <Text style={[styles.infoTextHeader, stylesGlobal.font]}>{Constants.LABEL_ABOUT_ME}</Text>
                        <Text style={[styles.infoCardValue, stylesGlobal.font]}>{aboutMe}</Text>
                    </View>
                </View>
            </View>
        );
    };

    /**
     * display user think i like info
     */
    renderThinkILike = () => {
        if (!myProfileData) {
            return null;
        }
        var userProfileInfo = myProfileData.userProfileInfo;
        var thinkILike = userProfileInfo.things_i_like;
        return (
            <View style={[styles.viewContainerWithShadow]}>
                <View style={styles.infoCardView}>
                    <Image style={styles.infoCardIconView} resizeMode={"contain"} source={require("../icons/profile_about.png")} />
                    <View style={styles.infoCardDetailView}>
                        <Text style={[styles.infoTextHeader, stylesGlobal.font]}>
                            {Constants.LABEL_THINK_I_LIKE}
                        </Text>
                        <Text style={[styles.infoCardValue, stylesGlobal.font]}>{thinkILike}</Text>
                    </View>
                </View>
            </View>
        );
    };

    /**
     * display user language info
     */
    renderLanguage = () => {
        var userCustomFields = myProfileData.userCustomFields;

        var language = userCustomFields.languages_known;

        return (
            <View style={[styles.viewContainerWithShadow]}>
                <View style={styles.infoCardView}>
                    <Image style={styles.infoCardIconView} resizeMode={"contain"} source={require("../icons/profile_language.png")} />
                    <View style={styles.infoCardDetailView}>
                        <Text style={[styles.infoTextHeader, stylesGlobal.font]}>{Constants.LABEL_LANGUAGE}</Text>
                        <Text style={[styles.infoCardValue, stylesGlobal.font]}>{language}</Text>
                    </View>
                </View>
            </View>
        );
    };

    /**
* display gallery info
*/
    renderUserGallery = () => {
        var viewValue;
        if (!myProfileData) {
            return null;
        }
        var isPrivateAlbum = false;
        var galleryImages = [];
        if (myProfileData.is_private_album !== undefined && myProfileData.is_private_album != null) {
            isPrivateAlbum = true
        }

        if (myProfileData.galleryImages == undefined || myProfileData.galleryImages == null || myProfileData.galleryImages.length < 1) {
            viewValue = null
        } else {
            // if (isPrivateAlbum) {
            //     galleryImages.push(myProfileData.is_private_album);
            // }
            myProfileData.galleryImages.map((i, j) => {
                galleryImages.push(i);
            });

            var len = galleryImages.length;
            if (len > 6) {
                len = 6;
            }
            var tempGalleryUrls = [];
            var start = isPrivateAlbum ? 1 : 0
            for (var i = start; i < len; i++) {
                tempGalleryUrls.push({
                    id: "id_" + i,
                    image: { uri: galleryImages[i].imgpath + galleryImages[i].filename }
                })
            }
            var views = [];
//let isPrivate = (data.visibility.toString() === Global.visibility_private.toString());
            views =
                <View style={{ flex: 1, flexDirection: 'row', flexWrap: 'wrap' }}>
                    {
                        galleryImages.map((item, index) =>
                            {

                                var is_hidden = item.is_hidden && !myProfileData.is_editable && !item.is_access;
                                if(item.access.id && item.access.status == 1)
                                    is_hidden = is_hidden && item.access.access_coin;
                                if(index < len)
                                    console.log('sssssssss => ', (item.visibility.toString() === Global.visibility_private.toString()))
                                return (
                                    index < len &&
                                    <ProfileImageGirdViewRow
                                        requestAccess={this.callAlbumRequestAccessAPI}
                                        isMyImage={false}
                                        // isPrivateAlbum={isPrivateAlbum}
                                        // isPrivateAlbum={(item.visibility.toString() === Global.visibility_private.toString())}
                                        isPrivateAlbum={is_hidden}
                                        index={index}
                                        tempGalleryUrls={tempGalleryUrls}
                                        screenProps={this.props.navigation}
                                        data={item}
                                    />
                                    )
                            }
                            
                        )
                    }
                </View>

            viewValue =
                <View style={styles.viewContainerWithShadow}>
                    <Text style={[styles.infoTextHeader, stylesGlobal.font]}>{"Gallery: "}</Text>
                    <TouchableOpacity style={[styles.emptyAddView, { position: 'absolute', right: 10, top: 0, backgroundColor: Colors.transparent }]}
                        onPress={() => {
                            if (!myProfileData) {
                                return null;
                            }
                            var userProfileInfo = myProfileData.userProfileInfo;
                            this.props.navigation.navigate("ShowOtherUserAlbum", {
                                userId: this.state.userId,
                                userToken: this.state.userToken,
                                userSlug: this.state.userSlug,
                                id: userProfileInfo.id,
                                slug: userProfileInfo.slug,
                                avatarUrl: this.state.userImagePath + Constants.THUMB_FOLDER + this.state.userImageName
                            })
                        }}>
                        <Text style={[styles.infoTextHeader, { color: Colors.black }, stylesGlobal.font]}>{"More"}</Text>
                    </TouchableOpacity>
                    {views}
                </View>

        }

        return (
            <View>
                {viewValue}
            </View>
        );
    };


    /**
     * display user time line
     */
    renderSuccessTimeLineView = () => {

        if (!myProfileData) {
            return null;
        }

        var viewValue;
        var success = myProfileData.success;
        var userTimeLine = [];
        success.map((i, j) => {
            userTimeLine.push({ title: i.year, description: i.description, visibility: i.visibility });
        });

        if (
            success != undefined &&
            success != null &&
            success.length > 0
        ) {
            return (
                viewValue =

                <View style={[styles.viewContainerWithShadow, { paddingLeft: 20, paddingRight: 20 }]}>

                    <Text style={[styles.infoTextHeader, stylesGlobal.font]}>Time Line : </Text>
                    <View style={[styles.timeLineContainer]}>
                        <CustomTimeline
                            data={success}
                            renderDetail={this.renderTimeLineDetail}
                            host={false}
                        />
                    </View>
                </View>
            );
        } else {
            {
                viewValue = null
            }
        }

        return (
            <View>
                {viewValue}

            </View>
        );
    };


    /**
     * display user time line  row
     */
    renderTimeLineDetail = rowData => {
        let title = <Text style={[styles.timeLineTitle, stylesGlobal.font_bold]}>{rowData.title}</Text>;
        var desc = null;
        desc = (
            <Text style={[styles.timeLineTextDescription, stylesGlobal.font]}>
                {convertStringtoEmojimessage(rowData.description)}
            </Text>
        );

        return (
            <View style={{ flex: 1 }}>
                {title}
                {desc}
            </View>
        );
    };

    /**
     * display user travel plan info list
     */
    renderTravelPlansView = () => {
        if (!myProfileData) {
            return null;
        }

        var viewValue;
        var userTravelPlan = [];
        myProfileData.schedules.map((item, j) => {
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
                onContentSizeChange={() => {
                    this.scrollview.scrollToEnd({ animated: true })
                }}
                onScroll={this._onScroll}
                style={[styles.cardViewProfile, { marginBottom: 30, paddingBottom: 10, height: 370 }]}
                onTouchMove={this._ignoreScrollBehavior}
            >
                {travelPlanList}
            </ScrollView>

        } else {
            viewValue = (<View style={styles.emptyView}>

            </View>)

        }

        return (
            userTravelPlan.length == 0 ? null :
                <View style={[styles.viewContainerWithShadow]}>
                    <Text style={[styles.infoTextHeader, stylesGlobal.font]}>{"Travel Plans : "}</Text>
                    {viewValue}
                </View>
        );
    };
    /**
* display  travel plan row data
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
                            <Image style={styles.labelIcon} source={require("../icons/pin.png")} />
                        </View>
                        <Text style={[{ color: Colors.black, marginLeft: 5, fontSize: 14, }, stylesGlobal.font_bold]}>
                            {address}
                        </Text>
                    </View>

                    <View style={{ flex: 1, flexDirection: 'row', marginTop: 10, alignItems: 'center' }}>
                        <View style={styles.labelIconView}>
                            <Image style={styles.labelIcon} source={require("../icons/calendar.png")} />
                        </View>
                        <View style={styles.dateView}>
                            <Text style={[styles.date, stylesGlobal.font]}>
                                {Moment(from_date).utc().format("DD MMM YYYY")}
                            </Text>
                        </View>
                        <Text style={[styles.date, stylesGlobal.font, { marginLeft: 5 }]}>
                            {Moment(from_date).utc().format("ddd")}
                        </Text>

                        <View style={{ marginHorizontal: 5 }}>
                            <Text style={[{ fontSize: 10, color: Colors.gold }, stylesGlobal.font]}>THRU</Text>
                        </View>

                        <View style={styles.dateView}>
                            <Text style={[styles.date, stylesGlobal.font]}>
                                {Moment(to_date).utc().format("DD MMM YYYY")}
                            </Text>
                        </View>
                        <Text style={[styles.date, stylesGlobal.font, { marginLeft: 5 }]}>
                            {Moment(to_date).utc().format("ddd")}
                        </Text>
                    </View>

                    <View style={{ flex: 1, flexDirection: 'row', marginTop: 10 }}>
                        <View style={styles.labelIconView}>
                            <Image style={styles.labelIcon} />
                        </View>
                        <Text style={[styles.ageText, { marginLeft: 5, marginTop: 2, fontSize: 12 }, stylesGlobal.font]}>
                            {convertStringtoEmojimessage(travel_purpose)}
                        </Text>
                    </View>
                </View>

            </View>
        );
    };

    /**
     * display user calendar info
     */
    renderCalendarView = () => {

        if (!myProfileData) {
            return null;
        }

        var viewValue;

        var userEvents = myProfileData.userEvents;

        if (
            userEvents != undefined &&
            userEvents != null &&
            userEvents.length > 0
        ) {
            var userEventList = [];

            for (var userEven = 0; userEven < userEvents.length; userEven++) {
                userEventList.push(this.renderUserEventRow(userEvents[userEven], userEven))
            }

            viewValue =
                <View style={styles.viewContainerWithShadow}>
                    <Text style={[styles.infoTextHeader, stylesGlobal.font]}>User Events : </Text>
                    <ScrollView
                        onScroll={this._onScroll}
                        style={[styles.cardViewProfile]}
                        onTouchMove={this._ignoreScrollBehavior}
                    >
                        {userEventList}
                    </ScrollView>
                </View>
        } else {
            {
                viewValue = null
            }
        }

        return (
            <View>
                {viewValue}

            </View>
        );
    };

    /**
     * single user calendar info row
     */

    renderUserEventRow = (rowData, key) => {
        var id = rowData.id;
        var full_day = rowData.full_day;
        var event_image_path = rowData.event_image_path;
        var event_type = rowData.event_type;
        var event_image_name = rowData.event_image_name;
        var visibility = rowData.visibility;
        var title = rowData.title;
        var description = rowData.description;
        var venue_address = rowData.venue_address;
        var from_date = rowData.from_date;
        var to_date = rowData.to_date;
        var from_time = rowData.from_time;
        var to_time = rowData.to_time;
        var event_category_name = rowData.event_category_name;
        var country_name = rowData.country_name;
        var state_name = rowData.state_name;
        var city_name = rowData.city_name;
        var invitation_id = rowData.invitation_id;
        var connection_id = rowData.connection_id;

        var url = event_image_path + event_image_name;

        return (
            <View key={key} style={[styles.cardViewProfile, { alignItems: "center", padding: 10 }]}>
                <View style={[styles.cardViewCalendar, { padding: 10, alignItems: "center" }]}>
                    <ImageCompressor uri={url} style={{ width: width * 0.8, height: width * 0.8, overflow: 'hidden' }} />
                    <View style={{ marginTop: 5, width: width * 0.8 }}>
                        <Text style={[styles.ageText, { color: Colors.gold }, stylesGlobal.font]}>
                            {description}
                        </Text>
                        <View style={{ flexDirection: "row", marginTop: 5 }}>
                            <View style={{ flexDirection: "row" }}>
                                <Image style={styles.ageIcon} resizeMode={"contain"} source={require("../icons/profile_language.png")} />
                                <Text style={[styles.ageText, { color: Colors.black, marginLeft: 3 }, stylesGlobal.font]}>
                                    {Moment(from_date).utc().format("MMM DD, YYYY")}
                                </Text>
                            </View>
                            <View style={{ flexDirection: "row", marginLeft: 10 }}>
                                <Image style={styles.ageIcon} resizeMode={"contain"} source={require("../icons/profile_language.png")} />
                                <Text style={[styles.ageText, { color: Colors.black, marginLeft: 3 }, stylesGlobal.font]}>
                                    {from_time}
                                </Text>
                            </View>
                            <View style={{ flexDirection: "row", marginLeft: 10 }}>
                                <Image style={styles.ageIcon} resizeMode={"contain"} source={require("../icons/profile_language.png")} />
                                <Text style={[styles.ageText, { color: Colors.black, marginLeft: 3, width: 130 }, stylesGlobal.font]}>
                                    {venue_address}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>
            </View>
        );
    };

    /**
     * display user member plan icon
     */
    getImageFromType = data => {
        if (data.membership_plan_id == "1") {
            return (
                <Image style={styles.memberIcon} resizeMode={"contain"} source={require("../icons/UBER.png")} />
            );
        } else if (data.membership_plan_id == "2") {
            return (
                <Image style={styles.memberIcon} resizeMode={"contain"} source={require("../icons/UBER_WEALTHY.png")} />
            );
        } else if (data.membership_plan_id == "3") {
            return (
                <Image style={styles.memberIcon} resizeMode={"contain"} source={require("../icons/MODEL.png")} />
            );
        } else if (data.membership_plan_id == "4") {
            return (
                <Image style={styles.memberIcon} resizeMode={"contain"} source={require("../icons/VIP_FAN.png")} />
            );
        } else if (data.membership_plan_id == "5") {
            return (
                <Image style={styles.memberIcon} resizeMode={"contain"} source={require("../icons/CONNECTOR.png")} />
            );
        } else if (data.membership_plan_id == "6") {
            return (
                <Image style={styles.memberIcon} resizeMode={"contain"} source={require("../icons/CELEBRITY.png")} />
            );
        } else if (data.membership_plan_id == "7") {
            return (
                <Image style={styles.memberIcon} resizeMode={"contain"} source={require("../icons/FAN.png")} />
            );
        }
    };

    refreshMyProfileInformation = () => {
        this.setState({
            loading: true
        });
        this.callProfileDetailAPI();
    };

    /**
     * go to Invite User To Event Screen
     */

    onInvitePress = async () => {

        // if (!myProfileData) {
        //     return null;
        // }

        // var id = myProfileData.userProfileInfo.id
        // this.props.navigation.navigate("InviteUserToEvents", { userid: id })

        this.setState({
            loading: true,
        })
        var item = {
            user_id: myProfileData.userProfileInfo.id,
            first_name: myProfileData.userProfileInfo.first_name,
            last_name: myProfileData.userProfileInfo.last_name,
        }
        const response = await getEventsForInvite(item, this.state.userId, this.state.userToken);
        this.setState({
            loading: false
        })
        if (response.status == "success") {
            this.setState({
                invite_event_list: response.data.events,
                invite_event_view: true
            })
        }

    }

    /**
     * go to user timeline screen
     */

    onTimeLinePress = () => {

        if (!myProfileData) {
            return null;
        }

        var id = myProfileData.userProfileInfo.id
        var userProfileInfo = myProfileData.userProfileInfo;
        this.props.navigation.navigate("UserTimeLine", {
            id: userProfileInfo.id,
            slug: userProfileInfo.slug,
            firstName: userProfileInfo.first_name,
            lastName: userProfileInfo.last_name,
            imgpath: userProfileInfo.imgpath,
            filename: userProfileInfo.filename
        })

    }

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

    showReloginDialog = () => {
        if (!this.state.isReloginAlert) {
            this.setState({
                isReloginAlert: true
            })
            Alert.alert(
                Constants.RELOGIN_ALERT_TITLE,
                Constants.RELOGIN_ALERT_MESSAGE,
                [
                    { text: 'OK', onPress: () => this.logoutUser() },
                ],
                { cancelable: false }
            )
        }
    }

}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.black,
    },
    dateView: {
        backgroundColor: Colors.gold,
        borderRadius: 5,
        marginLeft: 5,
        borderColor: Colors.black,
        paddingVertical: 5,
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
    fullnameHeader: {
        color: Colors.white,
        fontSize: 18,
        marginTop: 10
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
        marginRight: 5
    },
    ageIcon: {
        width: 10,
        height: 12,
        marginRight: 5
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
        color: Colors.gray,
        fontSize: 13,
        marginLeft: 5,
        marginTop: 1,
        backgroundColor: Colors.transparent
    },
    timeLineContainer: {
        flex: 1,
        backgroundColor: Colors.transparent,
        paddingTop: 10,
        paddingBottom: 10
    },
    timeLineTitle: {
        fontSize: 16,
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
    viewContainerWithShadow: {
        backgroundColor: Colors.white,
        borderRadius: 15,
        borderColor: Colors.white,
        // margin: 10,
        marginTop: 20,
        padding: 10,
    },
    smallProfileImageContainer: {
        width: '100%',
        height: '100%',
        resizeMode: 'contain'
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
    submitText: {
        color: "#fff",
        backgroundColor: Colors.transparent,
        textAlign: "center"
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
        borderRadius: 10
    },
    countImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'contain'
    },
    actionButtonText: {
        color: Colors.black,
        textAlign: 'center',
        fontSize: 10,
        marginTop: 5
    },
    fullname: {
        color: Colors.black,
        fontSize: 25,
    },
    age: {
        fontSize: 20,
        color: Colors.black
    },
    buygiftbutton: {
        width: 140,
        height: 40,
        backgroundColor: Colors.gold,
        borderRadius: 5,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonText: {
        color: Colors.white,
        fontSize: 14,
        textAlign: "center",
    },

    textInputText: {
        color: Colors.black,
        marginTop: 3,
        padding: 2,
        justifyContent: 'center',
        backgroundColor: Colors.white,
        textAlignVertical: "center",
        fontSize: 13,
        height: 40,
        borderColor: Colors.black,
        borderWidth: 1,
        borderRadius: 4

    },

    ratingCardView: {

    }
});
