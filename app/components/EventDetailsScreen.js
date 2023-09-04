import React, { Component, Fragment } from "react";
import {
    Platform,
    StyleSheet,
    Text,
    View,
    TextInput,
    ScrollView,
    Dimensions,
    Image,
    TouchableOpacity,
    Alert,
    SafeAreaView,
    Linking,
    Keyboard,
    KeyboardAvoidingView,
    Modal
} from "react-native";
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { EventRegister } from 'react-native-event-listeners';
import MapView from "react-native-maps";
import FastImage from 'react-native-fast-image';
import PhoneInput from 'react-native-phone-input';
import { selectContact, selectContactPhone, selectContactEmail } from 'react-native-select-contact';
import XLSX from 'xlsx';
import { writeFile, readFile, readDir, DocumentDirectoryPath, DownloadDirectoryPath, LibraryDirectoryPath } from 'react-native-fs';
import DocumentPicker from 'react-native-document-picker';
import AsyncStorage from '@react-native-community/async-storage';
import Button from '../customview/Button';
import Moment from "moment/moment";
import ProgressIndicator from "./ProgressIndicator";
import EventsCommentsRow from "./EventsCommentsRow";
import { Constants } from "../consts/Constants";
import { Colors } from "../consts/Colors";
import WebService from "../core/WebService";
import { ImageCompressor } from './ImageCompressorClass';
import { NewImageCompressor } from './NewImageCompressorClass';
import * as Global from "../consts/Global";
import { stylesGlobal, STICKY_HEADER_HEIGHT } from '../consts/StyleSheet';
import Memory from '../core/Memory';
import CustomPopupView from "../customview/CustomPopupView";
import Emojis from '../customview/Emojis';
import { convertEmojimessagetoString, convertStringtoEmojimessage } from "../utils/Util";
import ModalDropdown from '../custom_components/react-native-modal-dropdown/ModalDropdown';
import BannerView from "../customview/BannerView";
import * as ValidationUtils from "../utils/ValidationUtils";
import InvisibleBlurView from "../customview/InvisibleBlurView";
import AsyncAlert from './AsyncAlert';
import auth from "@react-native-firebase/auth";
import FolderChooser from './FolderChooser';
import { fcService } from "../utils/FirebaseChatService";
import { isIphoneX, getBottomSpace } from '../custom_components/react-native-iphone-x-helper';

import { removeCountryCode } from "../utils/Util";
import CountryPicker, { getAllCountries } from 'react-native-country-picker-modal';
import { AsYouType, parseNumber, parsePhoneNumberFromString, formatNumber  } from 'libphonenumber-js';



var RNFS = require('react-native-fs');


const { width, height } = Dimensions.get("window");
var mainImageViewHeight = height * 0.8;
var eventDetailData;

var TAG = "EventDetailsScreen";

export default class EventDetailsScreen extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            visible: true,
            eventId: "",
            userId: "",
            userToken: "",
            userFirstName: "",
            userLastName: "",
            userImagePath: "",
            userImageName: "",
            userSlug: "",
            is_verified: '0',
            loading: true,
            dataEventDetail: eventDetailData,
            isQrCode: false,
            comment: "",
            commentLoading: false,
            allowDragging: true,
            enableScrollViewScroll: true,
            singlePickerVisible: false,
            singlePickerSelectedItem: undefined,
            haveSentRose: false,
            displayEventDetail: false,
            displayMapView: false,
            visibleHeaderBool: false,
            showAllGuest: false,
            seemoreComments: false,
            RSVP: '',
            showModel: false,
            searchText: '',
            invite_code: '',
            cat_id: "", // specify trip or party, cat_id == 10 then trip, and other case then party

            eventUrl: '',
            eventFullUrl: '',
            eventName: '',
            description: '',
            venue: '',
            fromDate: '',
            toDate: '',
            fromTime: '',
            toTime: '',
            event_host_user_imageURL: '',
            hostBy: '',
            eventInviteList: [],
            eventDetailData: {},
            joinable: false,

            selected_rsvp: -1,

            current_joinability: true, ////  true when can join and false after click 
            event_visibility: "0",
            showInvitationPopUp: false,
            rowInvitation: [
                { 
                    first_name: '', 
                    last_name: '', 
                    email: '', 
                    phoneNumber: '', 
                    selected_user_role_index: 6, 
                    selected_gender_index: 0,
                    countryName: "US",
                    callingCode: "1",
                }
            ],

            rsvp_view_show: false, //// show rsvp in personal invitation

            eventCategoryList: [], // event category,
            current_event_category: "",

            category_array: Global.category_array_event_trip,
            selected_category: 0,

            comment_page: 0,

            commentsList: [],
            seemoreCommentLimit: 5, // the limit number when click see more
            selected_comment: {}, /// for reply comment

            showPhoneEmailSelectPopUp: false,
            selected_contact: null,

            user_role: Global.entries,
            user_gender: [{ type: "Male", image: require('../icons/signup_male.png') }, { type: "Female", image: require('../icons/signup_female.png') }],

            showExportGuestListPopup: false, // contain export file name input
            export_filename: "", // exported file name
            file_dir_path: Platform.OS == "ios" ? DocumentDirectoryPath + "/" : DownloadDirectoryPath + "/",

            import_file_list: [],
            import_file: "",
            showImportGuestListPopup: false,

            first_loading: true, // when load screen at first
            event_changed: false, // true when user change event detail

            showAskWhyCantGoPopup: false,
            showSendMessagePopup: false, // when respond with rsvp "can't go" or "maybe"
            rsvp_send_message: "", // message to send when respond is "can't go" or "maybe"

            available_spaces_int: 0, // used to display available space
            available_percentage: 0, // used to display available percentage

            invite_row_half_view_width: 0, // width of invite friend gender view, can get at render time

            popup_value_changed: false, // when changed a value in popup
            nonmembers_invited_popup: false,

            send_reminders_popup_show: false,
            send_reminders_type: "everyone", // send who // everyone or not_replied
            send_reminder_message: "", // message for send reminder,

        };

    }
    /**
        * clear state data
        */
    clearStateData = () => {
        this.setState({
            visible: true,
            eventId: "",
            user_email: "",
            userId: "",
            userToken: "",
            userFirstName: "",
            userLastName: "",
            userImagePath: "",
            userImageName: "",
            userSlug: "",
            dataEventDetail: eventDetailData,
            isQrCode: false,
            comment: "",
            allowDragging: true,
            enableScrollViewScroll: true,
            singlePickerVisible: false,
            singlePickerSelectedItem: undefined,
            haveSentRose: false,
            displayEventDetail: false,
            displayMapView: false,
            visibleHeaderBool: false,
            showAllGuest: false,
            seemoreComments: false,
            RSVP: '',
            showModel: false,
            searchText: '',

            eventUrl: '',
            eventFullUrl: '',
            eventName: '',
            description: '',
            venue: '',
            fromDate: '',
            toDate: '',
            fromTime: '',
            toTime: '',
            event_host_user_imageURL: '',
            hostBy: '',
            eventInviteList: [],
            eventDetailData: {},
            joinable: false,
            event_visibility: "0",
            showInvitationPopUp: false,
            rowInvitation: [
                { 
                    first_name: '', 
                    last_name: '', 
                    email: '', 
                    phoneNumber: '', 
                    selected_user_role_index: 6, 
                    selected_gender_index: 0,
                    countryName: "US",
                    callingCode: "1",
                }
            ],

            user_role: Global.entries,

            current_event_category: "",
            current_event_category_name: "",

            comment_page: 0,

            commentsList: [],

            first_loading: true,

            available_spaces_int: 0, // used to display available space
            available_percentage: 0,

        });
    };

    UNSAFE_componentWillMount() {
        this.clearStateData();

        current_date = new Date(new Date(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate(), new Date().getUTCHours(), new Date().getUTCMinutes(), new Date().getUTCSeconds()))

        this.listener = EventRegister.addEventListener(Constants.EVENT_PROFILE_IMAGE_UPDATED, () => {
            this.refreshProfileImage();
        })

        this.listenerEventRefresh = EventRegister.addEventListener(Constants.EVENT_EVENT_REFRESH, (data) => {
            this.setState({
                eventId: data
            }, () => this.callEventDetailAPI())
        })

        this.initListener = this.props.navigation.addListener('focus', this.initData.bind(this));
    }

    componentWillUnmount() {
        EventRegister.removeEventListener(this.listener);
        EventRegister.removeEventListener(this.listenerEventRefresh);
        this.initListener();
    }

    initData() {
        this.getData(false);
    }


    /**
     * get user token and user id from AsyncStorage
     *
     */
    getData = async (isComment) => {
        try {
            var user_email = await AsyncStorage.getItem(Constants.KEY_USER_EMAIL);
            var userId = await AsyncStorage.getItem(Constants.KEY_USER_ID);
            var userToken = await AsyncStorage.getItem(Constants.KEY_USER_TOKEN);
            var userFirstName = await AsyncStorage.getItem(Constants.KEY_USER_FIRST_NAME);
            var userLastName = await AsyncStorage.getItem(Constants.KEY_USER_LAST_NAME);
            var userImagePath = await AsyncStorage.getItem(Constants.KEY_USER_IMAGE_URL);
            var userImageName = await AsyncStorage.getItem(Constants.KEY_USER_IMAGE_NAME);
            var userSlug = await AsyncStorage.getItem(Constants.KEY_USER_SLUG);
            var is_verified = await AsyncStorage.getItem(Constants.KEY_IS_VERIFIED);
            var userIsFan = await AsyncStorage.getItem(Constants.KEY_USER_IS_FAN);

            if (this.props.route.params && this.props.route.params.eventId) {
                this.setState({
                    eventId: this.props.route.params.eventId,
                })
            }

            this.setState({
                user_email: user_email,
                userId: userId,
                userToken: userToken,
                userFirstName: userFirstName,
                userLastName: userLastName,
                userImagePath: userImagePath,
                userImageName: userImageName,
                userSlug: userSlug,
                is_verified: is_verified,
                userIsFan: userIsFan,
                isQrCode: false,
                comment: "",
                displayEventDetail: false
            });

        } catch (error) {
            // Error retrieving data
            console.log(TAG + " getData error " + error);
        }
        if (isComment) {
            this.setState({
                commentLoading: true,
            });
        } else {
            this.setState({
                loading: true
            });
        }

        await this.getCategoryList();
        this.callEventDetailAPI();
    };

    /// get category list
    getCategoryList = async () => {

        this.setState({
            loading: true
        });

        let uri = Memory().env == "LIVE" ? Global.URL_CREATE_EVENT : Global.URL_CREATE_EVENT_DEV;

        let params = new FormData();

        params.append("format", "json");
        params.append("user_id", this.state.userId);
        params.append("token", this.state.userToken);
        params.append("is_post", "false");
        console.log(TAG + " callgetCategoryListAPI uri " + uri);
        console.log(TAG + " callgetCategoryListAPI params " + JSON.stringify(params));
        WebService.callServicePost(uri, params, this.handlegetGetCategoryResponse);
    }

    handlegetGetCategoryResponse = (response, isError) => {
        // console.log(TAG + " callGetCategoryAPI result " + JSON.stringify(response));
        console.log(TAG + " callGetCategoryAPI isError " + isError);
        if (!isError) {
            var result = response;
            if (result != undefined && result != null) {
                if (result.data != undefined && result.data != null) {
                    this.setState({
                        eventCategoryList: result.data.event_category,
                    });
                }
            }
        } else {
            if (response != undefined && response != null && response.length > 0) {
                Alert.alert(response.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
            this.setState({
                loading: false
            });
            this.props.navigation.goBack();
        }
    }

    /**
     * call get event detail API and display content
     */
    callEventDetailAPI = async () => {
        this.setState({ loading: true });
        try {
            let uri = Memory().env == "LIVE" ? Global.URL_EVENT_DETAIL + this.state.eventId : Global.URL_EVENT_DETAIL_DEV + this.state.eventId
            let params = new FormData();
            params.append("token", this.state.userToken);
            params.append("user_id", this.state.userId);
            params.append("format", "json");
            params.append("data", "");

            console.log(TAG + " callEventDetailAPI uri " + uri);
            console.log(TAG + " callEventDetailAPI params " + JSON.stringify(params));

            WebService.callServicePost(uri, params, this.handleEventDetailResponse);
        } catch (error) {
            this.setState({
                loading: false,
                commentLoading: false
            });
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    };

    /**
    * handle event detai lAPI response
    */
    handleEventDetailResponse = (response, isError) => {
        console.log(TAG + " callEventDetailAPI Response " + JSON.stringify(response));
        console.log(TAG + " callEventDetailAPI isError " + isError);
        if (!isError) {
            var result = response;
            if (result != undefined && result != null) {
                if (result.status == "success") {
                    if (result.data != undefined && result.data != null) {
                        eventDetailData = result.data;
                        var isQrCode = eventDetailData.info.is_special == "1";
                        // eventName = eventDetailData.info.title;

                        console.log('eventDetailData.variables.is_past', eventDetailData.variables.is_past)
                        this.setState({
                            dataEventDetail: eventDetailData,
                            is_cancelled: eventDetailData.info.cancelled_date != null ? true : false,
                            is_past: eventDetailData.variables.is_past,
                            isQrCode: isQrCode,
                            displayEventDetail: true,
                            RSVP: eventDetailData.info.rsvpStatus,
                            origin_rsvp: eventDetailData.info.rsvp_status
                        });
                        if (eventDetailData.info.rsvp_status == null) {
                            // this.setState({
                            //     selected_rsvp: "1"
                            // })
                        } else {
                            this.setState({
                                selected_rsvp: eventDetailData.info.rsvp_status,
                            })
                        }
                        let eventInfo = eventDetailData.info;

                        var eventCategoryList = this.state.eventCategoryList;
                        for (i = 0; i < eventCategoryList.length; i++) {
                            if (eventCategoryList[i].id == eventInfo.cat_id) {
                                this.setState({
                                    current_event_category: eventCategoryList[i].slug,
                                    current_event_category_name: eventCategoryList[i].event_category_name
                                })
                                break;
                            }
                        }

                        for (i = 0; i < this.state.category_array.length; i++) {
                            if (this.state.category_array[i].value.toString() == eventInfo.visibility) {
                                this.setState({
                                    selected_category: i
                                })
                                break;
                            }
                        }

                        var available_spaces_int = parseInt(eventInfo.available_spaces, 10);
                        var attendeeCount_int = parseInt(eventInfo.attendeeCount, 10);
                        var percentage = 0;
                        if (isNaN(available_spaces_int)) {
                            available_spaces_int = 0;
                        } else {
                            if (isNaN(attendeeCount_int)) {
                                attendeeCount_int = 0;
                            }
                            available_percentage = Math.floor(attendeeCount_int * 100 / available_spaces_int);
                        }
                        ////////////////////////////////////
                        this.setState({
                            eventDetailData: eventDetailData,
                            eventUrl: eventInfo.event_image_path + Constants.THUMB_FOLDER + eventInfo.event_image_name,
                            // eventUrl: eventInfo.event_image_path + eventInfo.event_image_name,
                            eventFullUrl: eventInfo.event_image_path + eventInfo.event_image_name,
                            eventName: eventDetailData.info.title,
                            description: eventInfo.description,
                            venue: eventInfo.venue_address,
                            fromDate: eventInfo.from_date,
                            toDate: eventInfo.to_date,
                            fromTime: eventInfo.from_time,
                            toTime: eventInfo.to_time,
                            event_host_user_imageURL: eventInfo.imgpath + eventInfo.filename,
                            hostBy: eventInfo.first_name + " " + eventInfo.last_name,
                            eventInviteList: eventDetailData.invite,
                            event_visibility: eventInfo.visibility,
                            invite_code: eventDetailData.code,
                            cat_id: eventInfo.cat_id,
                            available_spaces_int: available_spaces_int,
                            available_percentage: available_percentage
                        }, () => this.getChatParams())
                        var commentsList = eventDetailData.comments;
                        for (i == 0; i < commentsList.length; i++) {
                            commentsList.showReply = false
                        }
                        this.setState({
                            commentsList: commentsList
                        })

                        if (eventDetailData.comments.length > 2) {
                            this.setState({
                                seemoreComments: true
                            })
                        } else {
                            this.setState({
                                seemoreComments: false
                            })
                        }

                        if (eventInfo.attendees_id == null) {
                            this.setState({
                                current_joinability: true,
                            })
                        } else {
                            if (eventInfo.is_invited == "0") {
                                this.setState({
                                    current_joinability: false,
                                })
                            }
                        }

                        let latitude = eventInfo.venue_lat;
                        let longitude = eventInfo.venue_lng;

                        if (latitude == undefined || longitude == undefined || latitude == "0" || longitude == "0") {
                            console.log(TAG, "event locaiton not found")
                            this.callGetPlaceDetailAPI(eventInfo.venue_address);
                        } else {
                            this.setState({
                                displayMapView: true
                            })
                        }
                    }
                } else {
                    if (this.state.event_changed && this.props.route.params.refreshEventData) {
                        this.props.route.params.refreshEventData();
                    }
                    this.props.navigation.goBack();
                    Alert.alert(Constants.NO_EVENT_MESSAGE, "");
                }
            }
        } else {
            if (response != undefined && response != null && response.length > 0) {
                Alert.alert(response.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
        this.setState({
            first_loading: false,
            loading: false,
            commentLoading: false
        });
    };

    callGetPlaceDetailAPI = (address) => {
        console.log(TAG, 'callGetPlaceDetailAPI', address)
        try {
            this.setState({
                loading: true
            });
            WebService.getPlaceDetails(
                address,
                this.handlePlaceDetailResponse
            );
        } catch (error) {
            console.log(TAG, " callGetPlaceDetailAPI locationInfo error " + error)
            this.setState({
                loading: false,
                displayMapView: true
            });
        }
    }

    handlePlaceDetailResponse = (response, isError) => {
        // console.log(TAG + " callGetPlaceDetailAPI Response " + JSON.stringify(response));
        console.log(TAG + " callGetPlaceDetailAPI isError " + isError);
        if (!isError) {
            var result = response;
            if (typeof result != "undefined" && result != null) {
                let eventInfo = this.state.dataEventDetail.info;
                eventInfo.venue_lat = result[0].position.lat;
                eventInfo.venue_lng = result[0].position.lng;
                this.setState({
                    dataEventDetail: eventDetailData,
                })
            }
        } else {
            if (response != undefined && response != null && response.length > 0) {
                Alert.alert(response.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
        this.setState({
            loading: false,
            displayMapView: true
        });
    }

    /**
     * call joint event API
     */
    callJoinEventAPI = async (type) => {
        // if(type == "join" && eventDetailData.info.is_guest_list_closed == 1) {
        //     Alert.alert("The Guest List is now closed.", "");
        //     return;
        // }
        if (eventDetailData.info.is_guest_list_closed == 1) {
            Alert.alert("The Guest List is now closed.", "");
            return;
        }
        try {
            let uri = Memory().env == "LIVE" ? Global.URL_EVENT_JOIN : Global.URL_EVENT_JOIN_DEV;

            var jsonData = { eventId: this.state.eventId, type: type };

            let params = new FormData();
            params.append("token", this.state.userToken);
            params.append("user_id", this.state.userId);
            params.append("format", "json");
            params.append("data", JSON.stringify(jsonData));
            if (type == "join") {
                params.append("rsvp_status", "1");
            }
            this.setState({
                loading: true
            });

            WebService.callServicePost(uri, params, this.handlJoinEventResponse);
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
    * handle join event API response
    */
    handlJoinEventResponse = (response, isError) => {
        // console.log(TAG + " callJoinEventAPI Response " + JSON.stringify(response));
        console.log(TAG + " callJoinEventAPI isError " + isError);

        if (!isError) {
            var result = response;
            if (result != undefined && result != null) {
                if (result.m_f_exceeded == 1) {
                    Alert.alert(result.msg, "");
                } else {
                    isRefresh = true
                    if (this.state.current_joinability) {
                        Alert.alert(Constants.JOIN_REQUEST_ALERT_TITLE, Constants.JOIN_REQUEST_ALERT_MESSAGE);
                    } else {
                        Alert.alert(Constants.CANCEL_REQUEST_ALERT_TITLE, Constants.CANCEL_REQUEST_ALERT_MESSAGE);
                    }
                    this.setState({
                        current_joinability: !this.state.current_joinability,
                        event_changed: true
                    })
                    this.clearStateData();
                    this.getData(false);
                }
            }
        } else {
            if (response != undefined && response != null && response.length > 0) {
                Alert.alert(response.msg.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
        this.setState({
            loading: false
        });
    };

    /**
     * call RSVP event API
     */
    callRSVPEventAPI = async (eventId, rsvp, event_type) => {
        try {
            this.setState({ loading: true });
            let uri = Memory().env == "LIVE" ? Global.URL_EVENT_RSVP : Global.URL_EVENT_RSVP_DEV;
            let params = new FormData();
            params.append("token", this.state.userToken);
            params.append("format", "json");
            params.append("user_id", this.state.userId);
            params.append("b", this.state.invite_code);
            params.append("c", this.state.user_email);
            params.append("d", eventId);
            params.append("e", rsvp);
            if (event_type == "open") {
                params.append("chg", 0);
            } else {
                params.append("chg", 1);
            }
            console.log(TAG + " callRSVPEventAPI uri " + uri);
            console.log(TAG + " callRSVPEventAPI params " + JSON.stringify(params));
            // Alert.alert("request", JSON.stringify(params))
            WebService.callServicePost(uri, params, this.handlRSVPEventResponse);
        } catch (error) {
            this.setState({ loading: false });
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    };

    /**
    * handle rsvp event API response
    */
    handlRSVPEventResponse = (response, isError) => {
        // console.log(TAG + " callRSVPEventAPI Response " + JSON.stringify(response));
        console.log(TAG + " callRSVPEventAPI isError " + isError);
        // Alert.alert("response", JSON.stringify(response))
        if (!isError) {
            var result = response;
            if (result != undefined && result != null) {
                if (result.status != undefined && result.status != null) {
                    if (result.status == "success") {
                        if (result.m_f_exceeded == 1) {
                            Alert.alert(result.msg, "");
                        } else {
                            isRefresh = true;
                            this.setState({
                                rsvp_view_show: false,
                                event_changed: true
                            })
                            this.clearStateData();
                            this.getData(false);
                            if (this.state.selected_rsvp == "0" || this.state.selected_rsvp == "2") {
                                this.setState({ loading: false });
                                this.setState({ showSendMessagePopup: true });
                            }
                        }
                    } else {
                        this.setState({
                            rsvp_view_show: false
                        });
                        if (result.msg != null && result.msg != "") {
                            Alert.alert(result.msg, "");
                        } else {
                            Alert.alert(Constants.UNKNOWN_MSG, "");
                        }
                    }
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
     * call cancel event API
     */
    callCancelEventAPI = async () => {
        try {

            this.setState({
                loading: true
            });

            let uri = Memory().env == "LIVE" ? Global.URL_EVENT_CANCEL + this.state.eventId : Global.URL_EVENT_CANCEL_DEV + this.state.eventId

            let params = new FormData();
            params.append("token", this.state.userToken);
            params.append("user_id", this.state.userId);
            params.append("format", "json");

            console.log(TAG + " callCancelEventAPI uri " + uri);
            console.log(TAG + " callCancelEventAPI params " + JSON.stringify(params));

            WebService.callServicePost(uri, params, this.handlCancelEventResponse);
        } catch (error) {
            this.setState({
                loading: false
            });
            Alert.alert(JSON.stringify(error), "");
        }
    };

    /** handle Cancel Event Data
     *
     **/
    handlCancelEventResponse = (response, isError) => {
        console.log(TAG + " callCancelEventAPI Response " + JSON.stringify(response));
        console.log(TAG + " callCancelEventAPI isError " + isError);
        this.setState({
            loading: false
        });
        if (!isError) {
            var result = response;
            isRefresh = true
            this.setState({
                event_changed: true
            })
            this.clearStateData();
            this.getData(false);
        } else {
            if (response != undefined && response != null && response.length > 0) {
                Alert.alert(response.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    };


    /**
     * call delete event API
     */
    callDeleteEventAPI = async () => {
        try {
            this.setState({ loading: true });
            let uri = Memory().env == "LIVE" ? Global.URL_EVENT_REMOVE + this.state.eventId : Global.URL_EVENT_REMOVE_DEV + this.state.eventId;
            let params = new FormData();
            params.append("token", this.state.userToken);
            params.append("user_id", this.state.userId);
            params.append("format", "json");
            console.log(TAG + " callDeleteEventAPI uri " + uri);
            console.log(TAG + " callDeleteEventAPI params " + JSON.stringify(params));
            WebService.callServicePost(uri, params, this.handlDeleteEventResponse);
        } catch (error) {
            this.setState({ loading: false });
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    };
    /** handle delete Event Data
    *
    **/

    handlDeleteEventResponse = (response, isError) => {
        // console.log(TAG + " callDeleteEventAPI Response " + JSON.stringify(response));
        console.log(TAG + " callDeleteEventAPI isError " + isError);
        this.setState({ loading: false });
        if (!isError) {
            var result = response;
            isRefresh = true;
            this.setState({ event_changed: true })
            this.goBackToEventScreen()
        } else {
            if (response != undefined && response != null && response.length > 0) {
                Alert.alert(response.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }

    };
    /**
     * call for invite non-member invite
     */
    callInviteNoneMemberAPI = async () => {
        var rowInvitation = [];

        for (let index = 0; index < this.state.rowInvitation.length; index++) {
            if ((!ValidationUtils.isEmptyOrNull(this.state.rowInvitation[index].first_name.trim()) || !ValidationUtils.isEmptyOrNull(this.state.rowInvitation[index].last_name.trim())) && (!ValidationUtils.isEmptyOrNull(this.state.rowInvitation[index].phoneNumber.trim()) || ValidationUtils.isEmailValid(this.state.rowInvitation[index].email.trim()))) {
                rowInvitation.push(this.state.rowInvitation[index])

            }
        }
        if (rowInvitation.length == 0) {
            Alert.alert(Constants.WARNING_ALERT_TITLE, Constants.NONINVITE_EMPTY);
            return;
        }
        try {
            this.setState({
                loading: true
            });

            let uri = Memory().env == "LIVE" ? Global.URL_INVITEE_NON_MEMBER : Global.URL_INVITEE_NON_MEMBER_DEV;
            // let params = new FormData();
            // params.append("token", this.state.userToken);
            // params.append("user_id", this.state.userId);
            // params.append("format", "json");
            // params.append("event_id", this.state.eventId);
            // if (eventDetailData.info.event_host_userid != this.state.userId) {
            //     params.append("is_bringafriend", "1");
            // }
            let aryEmail = [];
            let aryName = [];
            let aryPhone = [];
            let aryMemberType = [];
            let aryGender = [];
            let aryInstagram = [];

            for (let index = 0; index < rowInvitation.length; index++) {
                const element = rowInvitation[index];
                aryEmail.push(element.email);
                aryName.push(element.first_name + " " + element.last_name);
                aryPhone.push(element.callingCode + element.phoneNumber);
                aryMemberType.push(this.state.user_role[element.selected_user_role_index].type);
                if (element.selected_gender_index == 0) {
                    aryGender.push("1");
                } if (element.selected_gender_index == 1) {
                    aryGender.push("2");
                }
            }
            // params.append("pemail", JSON.stringify(aryEmail));
            // params.append("pname", JSON.stringify(aryName));
            // params.append("pphone", JSON.stringify(aryPhone));
            // params.append("pmembertype", JSON.stringify(aryMemberType));
            // params.append("pgender", JSON.stringify(aryGender));


            const data = {
                token: this.state.userToken,
                user_id: this.state.userId,
                format: 'json',
                event_id: this.state.eventId,
                pemail: JSON.stringify(aryEmail),
                pname:  JSON.stringify(aryName),
                pphone: JSON.stringify(aryPhone),
                pmembertype: JSON.stringify(aryMemberType),
                pgender:  JSON.stringify(aryGender),
                pinstagram: JSON.stringify(aryInstagram)
            }

            if (eventDetailData.info.event_host_userid != this.state.userId) {
                data["is_bringafriend"] = "1";
            }

            console.log(TAG + " callInviteNoneMemberAPI uri " + uri);
            console.log(TAG + " callInviteNoneMemberAPI params " + JSON.stringify(data));

            WebService.callServicePost(uri, data, this.handleInviteNoneMember);
        } catch (error) {
            console.log(TAG + " callInviteNoneMemberAPI error " + error);
            this.setState({
                loading: false
            });
            if (response != undefined && response != null && response.length > 0) {
                Alert.alert(response.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    };

    /**
    * handle add member ingroup API response
    */
    handleInviteNoneMember = (response, isError) => {
        console.log(TAG + " callInviteNoneMemberAPI Response " + JSON.stringify(response));

        if (!isError) {
            var result = response;
            this.setState({
                showInvitationPopUp: false,
                rowInvitation: [
                { 
                    first_name: '', 
                    last_name: '', 
                    email: '', 
                    phoneNumber: '', 
                    selected_user_role_index: 6, 
                    selected_gender_index: 0,
                    countryName: "US",
                    callingCode: "1",
                }
            ],
            })
            if (result.status == 1) {
                if (result.m_f_exceeded == 1) {
                    Alert.alert(result.msg, "");
                } else {
                    this.setState({
                        event_changed: true,
                        nonmembers_invited_popup: true
                    })
                    //Alert.alert(Constants.SENT_INVITE_SUCCESS, "");
                }
            } else {
                Alert.alert(result.error_msg[0]);
            }
        } else {
            Alert.alert(response.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            //Alert.alert(Constants.NO_INTERNET, "");
        }
        this.setState({
            loading: false
        });
    };


    callGetChatToken2 = async () => {
       
      
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

        this.setState({
                loading: true
            });
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


        this.setState({
            loading: false
        });
        // let data = this.state.eventDetailData;
        var eventDetailData_r = this.state.eventDetailData;
        
        if(isError)
        {
            Alert.alert("Failed to get user chat list");
            if(this.unsubscribe)
                this.unsubscribe();
            return;
        }
        
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

                 console.log('hhhhhhhhhhh = ', chatUserList);
        // return;
            } catch (error) {
                
                if (error != undefined && error != null && error.length > 0) {
                    Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
                }
            }
            
            //console.log('user list from server', chatUserList);
          
            for (var i = 0; i < chatUserList.length; i++) {
                let each_res = chatUserList[i];
                if (each_res.userId === eventDetailData_r.info.created_by_userid.toString()) {
                    this.setState({ grpId: each_res.id , is_old: each_res.is_old });
                    break;
                }
            }
        }

        if(this.unsubscribe)
                this.unsubscribe();


//         let grpId = "";
//         let is_old = 1;
//         
//         if (isError) {
//         } else {
//             for (var i = 0; i < response.length - 1; i++) {
//                 let each_res = response[i];
//                 if (each_res.members_user_id[0] == eventDetailData_r.info.created_by_userid.toString()) {
//                     grpId = each_res.id;
//                     is_old = each_res.is_old;
//                     break;
//                 }
//             }
//         }
// 
//         this.setState({grpId: grpId, is_old: is_old});

        
        
    };

    getChatParams = async () => {
        try {


            if(this.state.userId === this.state.eventDetailData.info.event_host_userid)
                return;

            this.setState({
                loading: true
            });


            let uri = Memory().env == "LIVE" ? Global.URL_GET_CHAT_TOKEN : Global.URL_GET_CHAT_TOKEN_DEV;
            if (this.state.userToken == undefined) {
                this.setState({ userToken: await AsyncStorage.getItem(Constants.KEY_USER_TOKEN) });
            }
            let params = new FormData();
            params.append("token", this.state.userToken);
            params.append("format", "json");
            WebService.callServicePost(uri, params, this.handleCallGetChatTokenResponse);
        } catch (error) {
            
            if (error.message != undefined && error.message != null && error.message.length > 0) {
                Alert.alert(
                    error
                        .replace(/<\/?[^>]+>/gi, "")
                        .replace(/\\n/g, "")
                        .replace(/\"/g, "")
                );
            }
        }
    }

    chatwithhost = async () => {

       

        var eventDetailData_r = this.state.eventDetailData;
        var user = {
            first_name: eventDetailData_r.info.first_name,
            last_name: eventDetailData_r.info.last_name,
            slug: eventDetailData_r.info.slug,
            imgpath: eventDetailData_r.info.imgpath + eventDetailData_r.info.filename,
            filename: eventDetailData_r.info.filename,
            id: eventDetailData_r.info.created_by_userid,
            imageUri: eventDetailData_r.info.imgpath + Constants.THUMB_FOLDER + eventDetailData_r.info.filename,
            grpId: (!this.state.grpId || this.state.grpId === "") ? undefined : this.state.grpId,
            is_old: this.state.is_old,
        };

        
        this.props.navigation.navigate("UserChat", {
            user: user,
            refreshList: this.updateRecentChatList,
            messageId: this.state.grpId
        });

//         var eventDetailData_r = this.state.eventDetailData;
//         var user = {
//             first_name: eventDetailData_r.info.first_name,
//             last_name: eventDetailData_r.info.last_name,
//             slug: eventDetailData_r.info.slug,
//             imgpath: eventDetailData_r.info.imgpath,
//             filename: eventDetailData_r.info.filename,
//             id: eventDetailData_r.info.created_by_userid,
//             imageUri: eventDetailData_r.info.filename
//         };
// 
// 
//         console.log(eventDetailData_r);
// 
// 
//         console.log(user);
//         this.props.navigation.navigate("UserChat", {
//             user: user,
//             refreshList: this.refreshListData,
//             messageId: "0"
//         });

          
    }

    callSendTextMessageAPI = async (message) => {
        try {

            this.setState({
                loading: true
            });

            var timeStamp = Math.floor(Date.now() / 1000);
            let uri = Memory().env == "LIVE" ? Global.URL_SINGLE_MESSAGE_SEND + Constants.CALL_BACK_FUNCTION + timeStamp : Global.URL_SINGLE_MESSAGE_SEND_DEV + Constants.CALL_BACK_FUNCTION + timeStamp

            let params = new FormData();
            params.append("callbackfn", "mobileapp");
            params.append("basedata", this.state.userId);
            params.append("to", this.state.eventDetailData.info.event_host_userid);
            params.append("localmessageid", "_" + timeStamp);
            params.append("message", message);
            console.log(TAG + " callSendTextMessageAPI uri " + uri);
            console.log(TAG + " callSendTextMessageAPI params " + JSON.stringify(params));

            WebService.apiCallRequestAddTag(
                uri,
                params,
                this.handleSendTextMessageResponse
            );
        } catch (error) {
            console.log(TAG + " callSendTextMessageAPI error " + error);
            this.setState({
                loading: false,
            });
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    };
    /**
    *  handle send message API response
    */
    handleSendTextMessageResponse = (response, isError) => {
        console.log(TAG + " callSendTextMessageAPI Response " + JSON.stringify(response));
        console.log(TAG + " callSendTextMessageAPI isError " + isError);

        try {
            if (!isError) {
                var result = response;
                if (typeof result != "undefined" && result != null) {

                }
            } else {

            }

        } catch (error) {
            console.log(error)
        }
        this.setState({
            loading: false,
            showSendMessagePopup: false,
            rsvp_send_message: "",
        });
    };

    renderBannerView = () => {
        return (
            <BannerView
                screenProps={this.props.navigation}
            />
        )
    }


    render() {
        // const { onScroll = () => { } } = this.props;
        const isTravel = this.state.cat_id == "10";
        // console.log(TAG, " render eventDetailData : ", eventDetailData);
        // console.log(TAG, " render navigation.state.params : ", this.props);
        if (eventDetailData) {
            var eventInfo = eventDetailData.info;
            var eventFromDate = eventDetailData.info.from_date;
            var is_special = eventInfo.is_special;
            var attendees_id = eventInfo.attendees_id;
            var is_invited = eventInfo.is_invited;
            var rsvpStatus = eventInfo.rsvp_status;
            if (rsvpStatus == null) {
                rsvpStatus = 1;
            }
            // var is_joinable_user = true;
            var is_joinable_user = this.state.dataEventDetail.variables.is_joinable_user; //// current user can join this event that is, current user is restrict user or not
            var is_past = this.state.is_past; ///  whether the event is past or not
            var is_cancelled = this.state.is_cancelled;
            var is_enabled_rsvp = this.state.dataEventDetail.variables.is_enabled_rsvp;  /// the status which can submit request
            var is_open_rsvp = this.state.dataEventDetail.variables.is_open_rsvp;   /// invited me but no response yet
            var is_joined_wait = this.state.dataEventDetail.variables.is_joined_wait;   //// send join request but host is not accept, so display Cancel Request

            var event_host_userid = eventInfo.event_host_userid;
            // console.log(">>>> event_host_userid ::: ", typeof(event_host_userid), " ::: ", typeof(this.state.userId))
            var ishosted = event_host_userid == this.state.userId;
            var isGuest = false;
            var eventInviteList = this.state.eventInviteList;
            if (eventInviteList != null) {
                for (i = 0; i < eventInviteList.length; i++) {
                    if (this.state.userId == eventInviteList[i].id) {
                        isGuest = true;
                        break;
                    }
                }
            }

            return (
                <SafeAreaView style={{ flex: 1, backgroundColor: Colors.black }}>
                    {/* <SafeAreaView style={{backgroundColor:Colors.black, flex:0}}/> */}
                    {this.state.loading && <ProgressIndicator />}
                    <View style={styles.container}>
                        {this.renderHeaderView()}
                        {this.renderBannerView()}
                        {this.renderPopupView()}
                         {this.state.send_reminders_popup_show && this.renderSendRemindersView()}
                        {this.state.showInvitationPopUp && this.renderInvitationPopUp()}
                        {this.state.showPhoneEmailSelectPopUp && this.renderPhoneEmailSelectPopUp()}
                        {this.state.showExportGuestListPopup && this.renderExportGuestListPopup()}
                        {this.state.showImportGuestListPopup && this.renderImportGuestListPopup()}
                        {this.state.showSendMessagePopup && this.renderSendMessagePopup()}
                        <View style={stylesGlobal.subViewDetail}>
                            <View style={stylesGlobal.title_header}>
                                <Text style={[stylesGlobal.headText, stylesGlobal.font]}>{isTravel ? "TRIP DETAIL" : "PARTY DETAIL"}</Text>
                            </View>
                            {
                                !this.state.first_loding &&
                                <KeyboardAwareScrollView style={Platform.OS === 'ios' ? { flex: 1, width: '100%', paddingLeft: 30, paddingRight: 30, paddingTop: 20 } : { flex: 1, width: '100%', paddingLeft: 30, paddingRight: 30, paddingTop: 20 }}
                                    extraScrollHeight={100} keyboardShouldPersistTaps='handled'
                                >
                                    {
                                        is_past ? 
                                        <View style={{ width: '100%', height: 30, marginBottom: 15, borderRadius: 5, justifyContent: 'center', paddingLeft: 10, backgroundColor: Colors.gold }}>
                                            <Text style={[styles.actionButtonText, stylesGlobal.font]}>This is a past {isTravel ? "trip" : "event"}</Text>
                                        </View> : 
                                        (is_cancelled ? 
                                        <View style={{ width: '100%', height: 30, marginBottom: 15, borderRadius: 5, justifyContent: 'center', paddingLeft: 10, backgroundColor: Colors.gold }}>
                                            <Text style={[styles.actionButtonText, stylesGlobal.font]}>This {isTravel ? "trip" : "event"} has been cancelled</Text>
                                        </View> :  
                                        (eventDetailData.info.is_guest_list_closed ? 
                                        
                                        <View style={{ width: '100%', height: 30, marginBottom: 15, borderRadius: 5, justifyContent: 'center', paddingLeft: 10, backgroundColor: Colors.gold }}>
                                            <Text style={[styles.actionButtonText, stylesGlobal.font]}>The Guest List is now closed</Text>  
                                        </View> : null))
                                    }
                                    {/* { */}
                                    {/*     is_cancelled && */}
                                    {/*     <View style={{ width: '100%', height: 30, marginBottom: 15, borderRadius: 5, justifyContent: 'center', paddingLeft: 10, backgroundColor: Colors.gold }}> */}
                                    {/*         <Text style={[styles.actionButtonText, stylesGlobal.font]}>This {isTravel ? "trip" : "event"} has been cancelled</Text> */}
                                    {/*     </View> */}
                                    {/* } */}
                                    {/* { */}
                                    {/*     eventDetailData.info.is_guest_list_closed == 1 &&  */}
                                    {/*     <View style={{ width: '100%', height: 30, marginBottom: 15, borderRadius: 5, justifyContent: 'center', paddingLeft: 10, backgroundColor: Colors.gold }}> */}
                                    {/*         <Text style={[styles.actionButtonText, stylesGlobal.font]}>The Guest List is now closed</Text>   */}
                                    {/*     </View> */}
                                    {/* } */}
                                    <TouchableOpacity onPress={() => {
                                        this.props.navigation.navigate("ImageZoom", {
                                            index: 0,
                                            tempGalleryUrls: [{
                                                id: this.state.eventFullUrl,
                                                image: { uri: this.state.eventFullUrl }
                                            }]
                                        })
                                    }}>
                                        <ImageCompressor style={Platform.OS === 'ios' ? { height: width - 80, width: width - 80, borderRadius: 10, overflow: 'hidden' } : { height: width - 80, width: width - 80, borderRadius: 10, justifyContent: 'center', overflow: 'hidden' }}
                                            uri={this.state.eventUrl}
                                            default={require('../icons/Background-Placeholder_Camera.png')}
                                        />
                                    </TouchableOpacity>
                                    <View style={{ width: '100%', marginTop: 25, alignItems: 'center', flexDirection: 'row' }}>
                                        <Text style={[stylesGlobal.titleText, { flex: 1, marginTop: 0, }, stylesGlobal.font_bold]}>{convertStringtoEmojimessage(this.state.eventName)}</Text>
                                        <Image style={{ width: 25, height: 25, marginLeft: 10, marginRight: 25, }} resizeMode={'contain'} source={this.state.category_array[this.state.selected_category].icon_path} />
                                    </View>

                                    <Text style={[stylesGlobal.descriptionText, stylesGlobal.font]}>{convertStringtoEmojimessage(this.state.description)}</Text>

                                    {
                                        ishosted && !is_past &&
                                        <View style={{ width: '100%', flexDirection: 'row', marginTop: 15, alignItems: 'center' }}>
                                            <Image style={{ width: 25, height: 25, marginRight: 20, resizeMode: 'contain' }} source={require('../icons/event_rsvp.png')} />
                                            <TouchableOpacity style={[styles.actionButton, stylesGlobal.shadow_style]}
                                                onPress={() => {
                                                    this.onGuestPress();
                                                }}
                                            >
                                                <Text style={[styles.actionButtonText, stylesGlobal.font]}>Manage Guest List</Text>
                                            </TouchableOpacity>
                                        </View>
                                    }
                                    {
                                        !ishosted && is_joinable_user &&
                                        <View style={{ marginTop: 15, flexDirection: 'row', alignItems: 'center', width: '100%' }}>
                                            {
                                                // true
                                                (!(!is_enabled_rsvp && (is_past || is_cancelled))) &&
                                                <Image style={{ width: 25, height: 25, marginRight: 20, resizeMode: 'contain' }} source={require('../icons/event_rsvp.png')} />
                                            }
                                            {
                                                // (is_enabled_rsvp || !is_enabled_rsvp && (is_past || is_cancelled)) &&
                                                (is_enabled_rsvp) &&
                                                <Text style={[stylesGlobal.descriptionText, stylesGlobal.font, { marginTop: 0, marginRight: 5 }]}>{"RSVP: "}</Text>
                                            }
                                            {/* {
                                                !is_enabled_rsvp && (is_past || is_cancelled) &&
                                                <View style={[{ paddingVertical: 5, paddingHorizontal: 10, backgroundColor: Colors.gold, borderRadius: 5, alignItems: 'center', justifyContent: 'center' }]}>
                                                    <Text style={[styles.actionButtonText, { color: Colors.black }, stylesGlobal.font]}>No Reply</Text>
                                                </View>
                                            } */}
                                            {
                                                !is_enabled_rsvp && !is_past && !is_cancelled && is_joined_wait &&
                                                <View style={{}}>
                                                    <View style={[{ paddingVertical: 5, paddingHorizontal: 10, backgroundColor: Colors.gold, borderRadius: 5, alignItems: 'center', justifyContent: 'center' }]}>
                                                        <Text style={[styles.actionButtonText, { color: Colors.black }, stylesGlobal.font]}>{"Pending Approval"}</Text>
                                                    </View>
                                                    <TouchableOpacity style={[styles.actionButton, { marginTop: 5 }, stylesGlobal.shadow_style]}
                                                        onPress={() => {
                                                            this.callJoinEventAPI("cancel");
                                                        }}>
                                                        <Text style={[styles.actionButtonText, stylesGlobal.font]}>{'Cancel Join Request'}</Text>
                                                    </TouchableOpacity>
                                                </View>
                                            }
                                            {
                                                !is_enabled_rsvp && !is_past && !is_cancelled && !is_joined_wait &&
                                                <TouchableOpacity style={[styles.actionButton, stylesGlobal.shadow_style]}
                                                    onPress={() => {
                                                        if (this.state.userIsFan == 0) {
                                                            this.callJoinEventAPI("join");
                                                        }
                                                        else {
                                                            this.setState({ isFan: true });
                                                        }
                                                    }}>
                                                    <Text style={[styles.actionButtonText, stylesGlobal.font]}>{'Ask to Join'}</Text>
                                                </TouchableOpacity>
                                            }
                                            {
                                                is_enabled_rsvp && (is_past || is_cancelled) &&
                                                <View>
                                                    {
                                                        is_open_rsvp &&
                                                        <View style={[{ paddingVertical: 5, paddingHorizontal: 10, backgroundColor: Colors.gold, borderRadius: 5, alignItems: 'center', justifyContent: 'center' }]}>
                                                            <Text style={[styles.actionButtonText, { color: Colors.black }, stylesGlobal.font]}>No Reply</Text>
                                                        </View>
                                                    }
                                                    {
                                                        !is_open_rsvp &&
                                                        <View style={[{ paddingVertical: 5, paddingHorizontal: 15, backgroundColor: Colors.gold, borderRadius: 5, alignItems: 'center', justifyContent: 'center' }]}>
                                                            <Text style={[styles.actionButtonText, { color: Colors.black }, stylesGlobal.font]}>
                                                                {rsvpStatus == 0 ? "Can't Go" : rsvpStatus == 1 ? 'Going' : "Maybe"}
                                                            </Text>
                                                        </View>
                                                    }
                                                </View>
                                            }
                                            {
                                                is_enabled_rsvp && !is_past && !is_cancelled &&
                                                <View style={{ flex: 1 }}>
                                                    {
                                                        (is_open_rsvp || this.state.rsvp_view_show) &&
                                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                            {/* <Text style={[stylesGlobal.locationText, stylesGlobal.font, {marginLeft: 0, marginBottom: 0}, ]}>RSVP:</Text> */}
                                                            <ModalDropdown
                                                                style={{ width: 130, height: 35, justifyContent: 'center', alignItems: 'center', marginLeft: 10 }}
                                                                dropdownStyle={{ width: 130, height: 35 * 3 }}
                                                                defaultIndex={0}
                                                                options={['Going', "Can't Go", 'Maybe']}
                                                                onSelect={(index) => {
                                                                    if (index == 0) {
                                                                        this.setState({
                                                                            selected_rsvp: "1",
                                                                        })
                                                                    } else if (index == 1) {
                                                                        this.setState({
                                                                            selected_rsvp: "0",
                                                                        })
                                                                    } else if (index == 2) {
                                                                        this.setState({
                                                                            selected_rsvp: "2",
                                                                        })
                                                                    }
                                                                    setTimeout(() => {
                                                                        if (this.props.route.params.response_invite) {
                                                                            this.props.route.params.response_invite(false);
                                                                        }
                                                                        this.rsvp_submit('personal')
                                                                    }, 500);
                                                                }}
                                                                renderButton={() => {
                                                                    return (
                                                                        <View style={{ width: 130, height: 35, justifyContent: 'center', alignItems: 'center', flexDirection: 'row', borderColor: Colors.black, borderWidth: 0.5, borderRadius: 5 }}>
                                                                            <Text style={[stylesGlobal.locationText, stylesGlobal.font, { marginLeft: 0, marginBottom: 0 }]}>{this.state.selected_rsvp == '-1' ? " Please select" : this.state.selected_rsvp == '0' ? "Can't Go" : this.state.selected_rsvp == '1' ? "Going" : "Maybe"}</Text>
                                                                            <Image style={{ width: 20, height: 20, marginLeft: 10, resizeMode: 'contain' }} source={require('../icons/down_arrow.png')} />
                                                                        </View>
                                                                    )
                                                                }}
                                                                renderRow={(item, member_type_index, highlighted) => {
                                                                    return (
                                                                        <View style={{ width: '100%', height: 35, justifyContent: 'center', alignItems: 'center' }}>
                                                                            <Text style={[stylesGlobal.locationText, stylesGlobal.font, { marginLeft: 0 }]}>{item}</Text>
                                                                        </View>
                                                                    )
                                                                }}
                                                            />
                                                            {/* <TouchableOpacity style={[{width: 100, height: 35, marginLeft: 15, backgroundColor:Colors.gold, borderRadius:5, justifyContent: 'center', alignItems: 'center'}, stylesGlobal.shadow_style]}
                                                                onPress = {() => this.rsvp_submit('personal')}>
                                                                <Text style={[stylesGlobal.locationText, stylesGlobal.font, {marginLeft: 0, marginBottom: 0, color: Colors.white}]}>Submit</Text>
                                                            </TouchableOpacity> */}
                                                        </View>
                                                    }
                                                    {
                                                        !(is_open_rsvp || this.state.rsvp_view_show) &&
                                                        <View style={{ alignItems: 'center', width: '100%', flexDirection: 'row' }}>
                                                            <View style={[{ paddingVertical: 5, paddingHorizontal: 15, backgroundColor: Colors.gold, borderRadius: 5, alignItems: 'center', justifyContent: 'center' }]}>
                                                                <Text style={[styles.actionButtonText, { color: Colors.black }, stylesGlobal.font]}>
                                                                    {rsvpStatus == 0 ? "Can't Go" : rsvpStatus == 1 ? 'Going' : "Maybe"}
                                                                </Text>
                                                            </View>
                                                            <TouchableOpacity style={[{ marginLeft: 15 }, styles.actionButton, stylesGlobal.shadow_style]}
                                                                onPress={() => this.setState({ rsvp_view_show: true })}>
                                                                <Text style={[styles.actionButtonText, stylesGlobal.font]}>{"Change"}</Text>
                                                            </TouchableOpacity>
                                                        </View>
                                                    }
                                                </View>
                                            }
                                        </View>
                                    }
                                    {
                                        !ishosted && !is_past && !is_cancelled && ((!ishosted && is_invited == "1") || (!ishosted && is_invited == "0" && attendees_id != null)) && this.state.event_visibility.toString != Global.visibility_invitee.toString() &&
                                        <View style={{ marginTop: 15, flexDirection: 'row', alignItems: 'center', width: '100%' }}>
                                            <View style={{ width: 25, height: 25, marginRight: 20 }}></View>
                                            <ModalDropdown
                                                style={[{ width: 120, height: 40, backgroundColor: Colors.gold, borderRadius: 5, justifyContent: 'center', alignItems: 'center' }, stylesGlobal.shadow_style]}
                                                dropdownStyle={{ width: 180, height: 45 * 3, borderWidth: 1, borderRadius: 5, borderColor: Colors.black, marginTop: 10 }}
                                                defaultIndex={0}
                                                options={["Members", "Non-Members"]}
                                                onSelect={(index) => {
                                                    if (eventDetailData.info.is_guest_list_closed == 1) {
                                                        Alert.alert("The Guest List is now closed.", "");
                                                        return;
                                                    }
                                                    if (index == 0) {
                                                        this.props.navigation.navigate("InviteFriend", {
                                                            eventId: this.state.eventId,
                                                            hostId: event_host_userid,
                                                            inviteList: eventDetailData.invite,
                                                            loadAfterDeletingEvent: this.loadAfterDeletingOrEditingEvent,
                                                            refreshListData: this.loadAfterDeletingOrEditingEvent,
                                                        })
                                                    } else if (index == 1) {
                                                        this.setState({
                                                            showInvitationPopUp: true,
                                                            rowInvitation: [
                                                                { 
                                                                    first_name: '', 
                                                                    last_name: '', 
                                                                    email: '', 
                                                                    phoneNumber: '', 
                                                                    selected_user_role_index: 6, 
                                                                    selected_gender_index: 0,
                                                                    countryName: "US",
                                                                    callingCode: "1",
                                                                }
                                                            ],

                                                            popup_value_changed: false
                                                        })
                                                    }
                                                }}
                                                renderSeparator={() => null}
                                                renderHeader={() => {
                                                    return (
                                                        <View style={[{ width: '100%', height: 45, alignItems: 'center', justifyContent: 'center' }]}>
                                                            <Text style={[styles.actionButtonText, { color: Colors.black }, stylesGlobal.font]}>{"Bring a Friend"}</Text>
                                                        </View>
                                                    )
                                                }}
                                                renderButton={() => {
                                                    return (
                                                        <View>
                                                            {
                                                                this.state.userIsFan == 0 ?
                                                                    <View style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' }}>
                                                                        <Text style={[styles.actionButtonText, stylesGlobal.font]}>{"Bring a Friend"}</Text>
                                                                    </View> :
                                                                    <TouchableOpacity style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' }} onPress={() => {
                                                                        this.setState({ isFan: true });
                                                                    }}>
                                                                        <Text style={[styles.actionButtonText, stylesGlobal.font]}>{"Bring a Friend"}</Text>
                                                                    </TouchableOpacity>
                                                            }
                                                        </View>
                                                    )
                                                }}
                                                renderRow={(item, index, highlighted) => {
                                                    return (
                                                        <View style={[{ width: '100%', height: 45, padding: 5, paddingTop: 0 }]}>
                                                            <View style={{ width: '100%', height: '100%', alignItems: 'center', flexDirection: 'row', borderRadius: 5, overflow: 'hidden', backgroundColor: Colors.black }}>
                                                                {
                                                                    index == 0 &&
                                                                    <Image style={{ width: '100%', height: '100%', position: 'absolute', left: 0, top: 0, resizeMode: 'stretch' }} source={require('../icons/bringafriend_gold.png')}></Image>
                                                                }
                                                                {
                                                                    index == 0 &&
                                                                    <Image style={{ width: 25, height: 25, resizeMode: 'contain', marginStart: 15 }} source={require('../icons/memberVisibility.png')}></Image>
                                                                }
                                                                {
                                                                    index == 1 &&
                                                                    <Image style={{ width: 25, height: 25, resizeMode: 'contain', marginStart: 15 }} source={require('../icons/visibility_member_gray.png')}></Image>
                                                                }
                                                                <Text style={[styles.actionButtonText, { marginStart: 10, color: index == 0 ? Colors.black : Colors.white }, stylesGlobal.font]}>{item}</Text>
                                                            </View>
                                                        </View>
                                                    )
                                                }}
                                            />
                                        </View>
                                    }

                                    <View style={{ marginTop: 15, flexDirection: 'row', alignItems: 'center', width: '100%' }}>
                                        <Image source={require('../icons/calendar.png')} style={{ width: 25, height: 25, resizeMode: 'contain' }} />
                                        <View style={{ flex: 1, flexDirection: 'row', marginLeft: 20, alignItems: 'center', flexWrap: 'wrap' }}>
                                            <View style={[stylesGlobal.date_view]}>
                                                <Text style={[styles.actionButtonText, { color: Colors.black }, stylesGlobal.font]}>{this.state.fromDate == "" ? "" : Moment(this.state.fromDate).utc().format('DD MMM YYYY')}</Text>
                                            </View>
                                            <Text style={[styles.actionButtonText, { color: Colors.black, marginLeft: 5 }, stylesGlobal.font]}>{this.state.fromDate == "" ? "" : Moment(this.state.fromDate).utc().format("ddd")}</Text>
                                            {
                                                isTravel &&
                                                <Text style={[styles.actionButtonText, { color: Colors.black, marginHorizontal: 5 }, stylesGlobal.font]}></Text>
                                            }
                                            {
                                                isTravel &&
                                                <View style={{ marginTop: 5, alignItems: 'center', flexDirection: 'row' }}>
                                                    <View style={[stylesGlobal.date_view]}>
                                                        <Text style={[styles.actionButtonText, { color: Colors.black }, stylesGlobal.font]}>{this.state.toDate == "" ? "" : Moment(this.state.toDate).utc().format("DD MMM YYYY")}</Text>
                                                    </View>
                                                    <Text style={[styles.actionButtonText, { color: Colors.black, marginLeft: 5 }, stylesGlobal.font]}>{this.state.toDate == "" ? "" : Moment(this.state.toDate).utc().format("ddd")}</Text>
                                                </View>
                                            }
                                        </View>
                                    </View>
                                    {
                                        !isTravel &&
                                        <View style={{ marginTop: 15, flexDirection: 'row', alignItems: 'center', width: '100%' }}>
                                            <Image source={require('../icons/clock.png')} style={{ width: 25, height: 25, resizeMode: 'contain' }} />
                                            <Text style={[stylesGlobal.locationText, stylesGlobal.font]}>{this.state.fromTime + " - " + this.state.toTime}</Text>
                                        </View>
                                    }
                                    <View style={[{ marginTop: 15, flexDirection: 'row', alignItems: 'center', marginRight: 15 }, stylesGlobal.font]}>
                                        <Image source={require('../icons/pin.png')} style={{ width: 25, height: 25, resizeMode: 'contain' }} />
                                        <Text style={[stylesGlobal.locationText, stylesGlobal.font]}>{this.state.venue}</Text>
                                    </View>
                                    {/* {
                                !ishosted && !is_past && ((!ishosted && is_invited == "1") || (!ishosted && is_invited == "0" && attendees_id != null)) && this.state.event_visibility.toString != Global.visibility_invitee.toString() &&
                                <View style={{marginTop:15, flexDirection: 'row', alignItems:'center', width:'100%'}}>
                                    <View style = {{width: 25, height: 25, marginRight: 20}}></View>
                                    <ModalDropdown 
                                        style = {[{width: 120, height: 40, backgroundColor:Colors.gold, borderRadius:5, justifyContent: 'center', alignItems: 'center'}, stylesGlobal.shadow_style]}
                                        dropdownStyle = {{width: 180, height: 40 * 2}}
                                        defaultIndex = {0}
                                        options = {["Select from Members/Fans", "Invite Non-Members"]}
                                        onSelect = {(index) => {
                                            if(index == 0) {
                                                this.props.navigation.navigate("InviteFriend", {
                                                    eventId: this.state.eventId,
                                                    hostId: event_host_userid,
                                                    inviteList: [],
                                                    loadAfterDeletingEvent: this.loadAfterDeletingOrEditingEvent,
                                                    refreshListData: this.loadAfterDeletingOrEditingEvent,
                                                })
                                            } else if(index == 1) {
                                                this.setState({showInvitationPopUp: true});
                                            }
                                        }}
                                        renderButton = {() => {
                                            return (
                                                <View style = {{width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center'}}>
                                                    <Text style = {[styles.actionButtonText, stylesGlobal.font]}>Bring a friend</Text>
                                                </View>
                                            )
                                        }}
                                        renderRow = {(item, member_type_index, highlighted) => {
                                            return (
                                                <View style = {[{width: '100%', height: 39, alignItems: 'center', flexDirection: 'row', borderColor: '#808080', borderWidth: 0.5, padding: 3}]}>
                                                    <View style = {{width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', borderWidth: 0.5, borderColor: '#000000', borderRadius: 2, backgroundColor: Colors.gold}}>
                                                        <Text style = {[{fontSize: 12, color: Colors.white}, stylesGlobal.font]}>{item}</Text>
                                                    </View>
                                                </View>
                                            )
                                        }}
                                    />
                                </View>
                            } */}
                                    <View style={{ marginTop: 40, alignItems: 'center' }}>
                                        <Text style={[styles.subViewTitle, stylesGlobal.font_semibold]}>{"Guest List"}</Text>
                                        <View style={{ width: '100%', height: 2, backgroundColor: Colors.gold, marginTop: 10, marginRight: 30 }} />
                                        {
                                            this.state.available_spaces_int != 0 &&
                                            <View style={{ width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 5 }}>
                                                <Text style={[styles.subViewTitle, stylesGlobal.font, { color: Colors.black }]}>{"Available Spaces: " + this.state.available_spaces_int}</Text>
                                                {
                                                    !is_past && !is_cancelled && this.state.available_percentage > 50 &&
                                                    <Text style={[styles.subViewTitle, stylesGlobal.font, { color: Colors.black }]}>{" (" + this.state.available_percentage + "% full)"}</Text>
                                                }
                                            </View>
                                        }
                                        <View style={{ marginTop: 15, width: '100%', alignItems: 'center' }}>
                                            {
                                                this.renderGuests(is_invited, attendees_id, is_past, is_cancelled)
                                            }
                                        </View>
                                    </View>
                                    {
                                        ishosted &&  /// this is from Host invitation
                                        <View style={{ width: '100%', alignItems: 'center', marginTop: 20 }}>
                                            <Text style={[styles.subViewTitle, stylesGlobal.font_semibold]}>{isTravel ? "Travel Setting" : "Event Setting"}</Text>
                                            <View style={{ width: '100%', height: 2, backgroundColor: Colors.gold, marginTop: 10, marginRight: 30 }} />
                                            <View style={{ width: '100%', flexDirection: 'row', justifyContent: 'center' }}>
                                                {!is_cancelled && <Button text='Edit' onPress={() => this.onEditPress()} />}
                                                {is_past && <Button text='Delete' onPress={() => this.onDeletePress()} />}
                                                {!is_cancelled && !is_past && <Button text='Send Reminders' onPress={() => {
                                                                  this.setState({
                                                                        send_reminders_type: "everyone",
                                                                        send_reminder_message: "",
                                                                        send_reminders_popup_show: true
                                                                    })
                                                }} />}
                                            </View>
                                            <View style={{ width: '100%', flexDirection: 'row', justifyContent: 'center' }}>
                                                {!is_cancelled && <Button text='Copy' onPress={() => this.onCopyPress()} />}
                                                {
                                                    !is_past && !is_cancelled &&
                                                    <Button text='Cancel' onPress={() => this.onCancelPress()} />
                                                }
                                            </View>

                                        </View>
                                    }
                                    <View style={{ width: '95%', paddingLeft: 20, borderBottomColor: Colors.gold, borderBottomWidth: 2, alignItems: 'center', marginTop: 20, }}>
                                        <Text style={[styles.subViewTitle, stylesGlobal.font_semibold]}>Hosted By: {this.state.hostBy}</Text>

                                    </View>
                                    {
                                        this.state.current_event_category_name != "" &&
                                        <View style={{ width: '100%', alignItems: 'center', marginTop: 5, marginRight: 30 }}>
                                            <Text style={[styles.subViewTitle, stylesGlobal.font, { color: Colors.black }]}>{"Category: " + this.state.current_event_category_name}</Text>
                                        </View>
                                    }
                                    <View style={{ marginTop: 10, alignItems: 'center' }}>
                                        <View style={{ width: width - 30, height: '100%', position: 'absolute', left: -30, top: 0 }}>
                                            {
                                                this.state.current_event_category == "Birthday" &&
                                                <Image style={{ width: '100%', height: (width - 30) * 0.46, resizeMode: 'cover', }} source={require('../icons/Event-Mobile-Background-Birthday.jpg')} />
                                            }
                                            {
                                                this.state.current_event_category == "Lunch" &&
                                                <Image style={{ width: '100%', height: (width - 30) * 0.55, resizeMode: 'cover' }} source={require('../icons/Event-Mobile-Background-Lunch.jpg')} />
                                            }
                                            {
                                                this.state.current_event_category == "Dinner" &&
                                                <Image style={{ width: '100%', height: (width - 30) * 0.46, resizeMode: 'cover' }} source={require('../icons/Event-Mobile-Background-Dinner.jpg')} />
                                            }
                                            {
                                                this.state.current_event_category == "Music-event" &&
                                                <Image style={{ width: '100%', height: (width - 30) * 0.64, resizeMode: 'cover' }} source={require('../icons/Event-Mobile-Background-Nightout.jpg')} />
                                            }
                                            {
                                                this.state.current_event_category == "Yacht-Party" &&
                                                <Image style={Platform.OS === 'ios' ? { width: '100%', height: (width - 30) * 0.44, resizeMode: 'contain' } : { width: '100%', height: (width - 30) * 0.37, resizeMode: 'contain' }} source={require('../icons/Event-Mobile-Background-Yacht.jpg')} />
                                            }
                                            {
                                                this.state.current_event_category.toUpperCase() == "Travel".toUpperCase() &&
                                                <Image style={{ width: '100%', height: (width - 30) * 0.6, resizeMode: 'cover' }} source={require('../icons/Event-Mobile-Background-Travel.jpg')} />
                                            }
                                        </View>

                                        <TouchableOpacity onPress={() => {
                                            if (event_host_userid == this.state.userId) {
                                                this.props.navigation.navigate("MyProfile", {
                                                    refreshProfileImage: this.refreshProfileImage
                                                });
                                            } else {
                                                this.props.navigation.navigate("ProfileDetail", {
                                                    slug: eventInfo.slug
                                                })
                                            }
                                        }}>
                                            {
                                                this.state.event_host_user_imageURL != '' &&
                                                <FastImage style={{ height: 150, width: 150, borderRadius: 75, marginTop: 20 }} source={{ uri: this.state.event_host_user_imageURL }} />
                                            }
                                            {
                                                this.state.event_host_user_imageURL == '' &&
                                                <Image style={{ height: 150, width: 150, borderRadius: 75, marginTop: 20, resizeMode: 'contain' }} source={require('../icons/Profile-gold.png')} />
                                            }
                                        </TouchableOpacity>
                                        {
                                            !is_past && !is_cancelled && !ishosted && this.state.is_verified == "1" &&
                                            <View style={{ alignItems: 'center', width: '100%', marginTop: 15 }}>
                                                <TouchableOpacity style={[{ paddingVertical: 10, paddingHorizontal: 30, backgroundColor: Colors.gold, borderRadius: 5 }, stylesGlobal.shadow_style]}
                                                    onPress={() => this.chatwithhost()}>
                                                    <Text style={[styles.actionButtonText, stylesGlobal.font]}>{"Chat with Host"}</Text>
                                                </TouchableOpacity>
                                            </View>
                                        }
                                    </View>

                                    <View style={{ marginTop: 40, alignItems: 'center' }}>
                                        <Text style={[styles.subViewTitle, stylesGlobal.font_semibold]}>{"Location"}</Text>
                                        <View style={{ width: '100%', height: 2, backgroundColor: Colors.gold, marginTop: 10, marginRight: 30 }} />
                                        {this.state.displayMapView && this.renderMapView()}
                                    </View>
                                    <View style={{ marginTop: 40, alignItems: 'center' }}>
                                        <Text style={[styles.subViewTitle, stylesGlobal.font_semibold]}>{"Comments"}</Text>
                                        <View style={{ width: '100%', height: 2, backgroundColor: Colors.gold, marginVertical: 10, marginRight: 30 }} />
                                        {this.state.commentsList.length > 0 && this.renderCommentsList()}
                                    </View>
                                    {
                                        this.state.is_verified == "1" && (this.state.dataEventDetail.allow_discussion == 1 || this.state.dataEventDetail.info.is_special != "0") &&
                                        <View style={{ marginTop: 20, alignItems: 'center' }}>
                                            {this.renderUserCommentView()}
                                        </View>
                                    }
                                    {
                                        this.state.nonmembers_invited_popup &&
                                        <Modal
                                            animationType="fade"
                                            transparent={true}
                                            // closeOnClick={true}
                                            visible={this.state.suspend_account_popup}
                                            onRequestClose={() => this.setState({ suspend_account_popup: false })}
                                            supportedOrientations={['portrait', 'landscape']}
                                        >
                                            <View style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' }}>
                                                <View style={stylesGlobal.popup_bg_blur_view}></View>
                                                <View style={[stylesGlobal.popup_main_container, { paddingBottom: 0 }]}>
                                                    <View style={[stylesGlobal.popup_desc_container, { flexDirection: 'column' }]}>
                                                        <Text style={[{ fontSize: 14, color: Colors.black, paddingBottom: 20 }, stylesGlobal.font]}>{Constants.BRING_A_NONMEMBER_HEADER} </Text>
                                                        <Text style={[{ fontSize: 14, color: Colors.gray, paddingBottom: 0 }, stylesGlobal.font]}>{Constants.BRING_A_NONMEMBER_NOTE}</Text>
                                                    </View>
                                                    {
                                                        <View style={stylesGlobal.popup_button_container}>
                                                            <TouchableOpacity style={[stylesGlobal.common_button, stylesGlobal.shadow_style]} onPress={() => this.setState({ nonmembers_invited_popup: false })}>
                                                                <Text style={[stylesGlobal.popup_button_text, stylesGlobal.font]}>{"OK"}</Text>
                                                            </TouchableOpacity>
                                                        </View>
                                                    }
                                                </View>
                                            </View>
                                        </Modal>
                                    }
                                    {
                                        this.state.isFan &&
                                        <Modal
                                            animationType="fade"
                                            transparent={true}
                                            supportedOrientations={['portrait', 'landscape']}
                                        >
                                            <View style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' }}>
                                                <View style={stylesGlobal.popup_bg_blur_view}></View>
                                                <View style={[stylesGlobal.popup_main_container, { paddingBottom: 0 }]}>
                                                    <View style={[stylesGlobal.popup_desc_container, { flexDirection: 'column' }]}>
                                                        <Text style={[{ fontSize: 14, color: Colors.black, paddingBottom: 20 }, stylesGlobal.font]}>{Constants.FAN_ACCOUNT_LIMIT_HEADER} </Text>
                                                        <Text style={[{ fontSize: 14, color: Colors.gray, paddingBottom: 0 }, stylesGlobal.font]}>{Constants.FAN_ACCOUNT_LIMIT_NOTE}</Text>
                                                    </View>
                                                    {
                                                        <View style={stylesGlobal.popup_button_container}>
                                                            <TouchableOpacity style={[stylesGlobal.common_button, stylesGlobal.shadow_style]} onPress={() => {
                                                                this.refs.popupRef.open_account_link();
                                                            }}>
                                                                <Text style={[stylesGlobal.popup_button_text, stylesGlobal.font]}>{"Upgrade My Account"}</Text>
                                                            </TouchableOpacity>
                                                        </View>
                                                    }
                                                </View>
                                            </View>
                                        </Modal>
                                    }
                                    <View style={{ height: 50 }}></View>
                                </KeyboardAwareScrollView>
                            }
                        </View>
                    </View>
                </SafeAreaView>

            );
        } else {

            return (
                <SafeAreaView style={{ backgroundColor: Colors.black, flex: 1 }}>
                    <View style={{ flex: 1, backgroundColor: Colors.black, width: "100%", height: "100%" }}>
                        {this.renderHeaderView()}
                        <View style={{ flex: 1, backgroundColor: Colors.white, width: "100%", height: "100%" }}></View>
                    </View>
                </SafeAreaView>
            );
        }
    }

    renderSendMessagePopup = () => {
        return (
            <View style={{ width: '100%', height: '100%', position: 'absolute', justifyContent: 'center', alignItems: 'center', zIndex: 10, elevation: 10 }}>
                <View style={{ width: '100%', height: '100%', position: 'absolute', backgroundColor: Colors.black, opacity: 0.3 }} />
                <View style={{ width: '90%', backgroundColor: Colors.white, borderRadius: 5 }}>
                    <View style={{ width: '100%', paddingHorizontal: 10, paddingVertical: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomColor: Colors.gray, borderBottomWidth: 1 }}>
                        <Text style={[{ fontSize: 16, color: Colors.black }, stylesGlobal.font_semibold]}>{"RSVP Done"}</Text>
                        <TouchableOpacity style={{ padding: 5 }} onPress={() => this.setState({ showSendMessagePopup: false, showAskWhyCantGoPopup: false, rsvp_send_message: "" })}>
                            <Image style={stylesGlobal.cancel_delete_image} source={require("../icons/connection-delete.png")} />
                        </TouchableOpacity>
                    </View>
                    <View style={{ width: '100%', paddingHorizontal: 10, paddingVertical: 10, borderBottomColor: Colors.gray, borderBottomWidth: 1 }}>
                        <Text style={[{ fontSize: 16, color: Colors.black }, stylesGlobal.font_semibold]}>{`Your RSVP has been registered.\nWould you like to send message to\n${this.state.hostBy} why you cannot come?`}</Text>
                    </View>
                    {
                        this.state.showAskWhyCantGoPopup && <View style={{ width: '100%', paddingHorizontal: 10, paddingVertical: 10, borderBottomColor: Colors.gray, borderBottomWidth: 1 }}>
                            <TextInput style={[{ width: '100%', height: 100, fontSize: 14, color: Colors.black, borderWidth: 1, borderColor: Colors.gray, borderRadius: 5, padding: 5, marginTop: 5 }, stylesGlobal.font]} multiline={true} onChangeText={(text) => this.setState({ rsvp_send_message: text })}>{this.state.delete_password}</TextInput>
                        </View>
                    }
                    {
                        this.state.showAskWhyCantGoPopup ? <View style={{ width: '100%', marginVertical: 15, flexDirection: 'row', justifyContent: 'flex-end' }}>
                            <TouchableOpacity style={[styles.actionButton, stylesGlobal.shadow_style]}
                                onPress={() => this.setState({ showSendMessagePopup: false, showAskWhyCantGoPopup: false, rsvp_send_message: "" })}
                            >
                                <Text style={[styles.actionButtonText, stylesGlobal.font]}>{"Send Message"}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.actionButton, stylesGlobal.shadow_style, { marginHorizontal: 15 }]} onPress={() => this.setState({ showAskWhyCantGoPopup: false, showSendMessagePopup: false, rsvp_send_message: "" })}>
                                <Text style={[styles.actionButtonText, stylesGlobal.font]}>{"Cancel"}</Text>
                            </TouchableOpacity>
                        </View> : <View style={{ width: '100%', marginVertical: 15, flexDirection: 'row', justifyContent: 'flex-end' }}>
                                <TouchableOpacity style={[styles.actionButton, stylesGlobal.shadow_style]}
                                    onPress={() => this.setState({ showAskWhyCantGoPopup: true })}
                                >
                                    <Text style={[styles.actionButtonText, stylesGlobal.font]}>{"Yes"}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.actionButton, stylesGlobal.shadow_style, { marginHorizontal: 15 }]} onPress={() => this.setState({ showSendMessagePopup: false, rsvp_send_message: "" })}>
                                    <Text style={[styles.actionButtonText, stylesGlobal.font]}>{"No"}</Text>
                                </TouchableOpacity>
                            </View>
                    }
                </View>
            </View>
        )
    }

    renderExportGuestListPopup = () => {
        return (
            <View style={{ position: 'absolute', width: width, height: height, top: 0, left: 0, zIndex: 10, alignItems: 'center' }}>
                <View style={{ position: 'absolute', width: width, height: height, top: 0, left: 0, backgroundColor: Colors.black, opacity: 0.3, }}
                    onStartShouldSetResponder={() => this.setState({ showExportGuestListPopup: false, export_filename: "" })}
                />
                <View style={{ width: '95%', backgroundColor: Colors.white, alignItems: 'center', paddingHorizontal: 15, borderRadius: 10, justifyContent: 'center' }}>
                    <View style={{ width: '100%', padding: 20 }}>
                        <Text style={[{ fontSize: 15, color: Colors.black }, stylesGlobal.font]}>{"Enter File Name for Export"}</Text>
                    </View>
                    {/* <View style={{ width: '100%', padding: 20, borderTopColor: Colors.gray, borderTopWidth: 0.5, borderBottomColor: Colors.gray, borderBottomWidth: 0.5, alignItems: 'center' }}> */}
                    {/*     <FolderChooser /> */}
                    {/* </View> */}
                    <View style={{ width: '100%', padding: 20, borderTopColor: Colors.gray, borderTopWidth: 0.5, borderBottomColor: Colors.gray, borderBottomWidth: 0.5, alignItems: 'center' }}>
                        {/* <Text style={[{ fontSize: 15, color: Colors.black, }, stylesGlobal.font]}>{"File Name : "}</Text> */}
                        <TextInput style={[{ fontSize: 14, color: Colors.black, width: '90%', height: 35, padding: 5, borderWidth: 0.5, borderColor: Colors.gray, borderRadius: 5 }, stylesGlobal.font]} autoCorrect={false} autoCapitalize={"none"} onChangeText={(text) => this.setState({ export_filename: text })} placeholder="file name">{this.state.export_filename}</TextInput>
                    </View>
                    <View style={{ width: '100%', padding: 20, flexDirection: 'row', justifyContent: 'flex-end' }}>
                        <TouchableOpacity style={[{ paddingVertical: 10, paddingHorizontal: 20, minWidth: 60, backgroundColor: Colors.gold, borderRadius: 5, justifyContent: 'center', alignItems: 'center' }, stylesGlobal.shadow_style]}
                            onPress={() => this.exportGuestList()}
                        >
                            <Text style={[{ fontSize: 14, color: Colors.white }, stylesGlobal.font]}>{"Export"}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[{ paddingVertical: 10, paddingHorizontal: 20, minWidth: 60, backgroundColor: Colors.gold, borderRadius: 5, marginLeft: 15, justifyContent: 'center', alignItems: 'center' }, stylesGlobal.shadow_style]}
                            onPress={() => this.setState({ showExportGuestListPopup: false, export_filename: "" })}
                        >
                            <Text style={[{ fontSize: 14, color: Colors.white }, stylesGlobal.font]}>{"Cancel"}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        )
    }

    renderImportGuestListPopup = () => {
        return (
            <View style={{ position: 'absolute', width: width, height: height, top: 0, left: 0, zIndex: 10, alignItems: 'center' }}>
                <View style={{ position: 'absolute', width: width, height: height, top: 0, left: 0, backgroundColor: Colors.black, opacity: 0.3 }}
                    onStartShouldSetResponder={() => this.setState({ showImportGuestListPopup: false, export_filename: "" })}
                />
                <View style={{ width: '95%', backgroundColor: Colors.white, alignItems: 'center', paddingHorizontal: 15, borderRadius: 10, justifyContent: 'center' }}>
                    <View style={{ width: '100%', padding: 20 }}>
                        <Text style={[{ fontSize: 15, color: Colors.black }, stylesGlobal.font]}>{"Please select file you are going to import"}</Text>
                    </View>
                    <View style={{ width: '100%', maxHeight: 150, padding: 20, borderTopColor: Colors.gray, borderTopWidth: 0.5, borderBottomColor: Colors.gray, borderBottomWidth: 0.5, alignItems: 'center' }}>
                        {
                            this.state.import_file_list.length == 0 &&
                            <Text style={[{ fontSize: 14, color: Colors.black }, stylesGlobal.font]}>{"You don't have any expoerted file."}</Text>
                        }
                        {
                            this.state.import_file_list.length > 0 &&
                            <ScrollView style={{ width: '90%' }}>
                                {
                                    this.state.import_file_list.map((item, index) =>
                                        <TouchableOpacity key={index} style={{ width: '100%', flexDirection: 'row', alignItems: 'center', marginBottom: 10 }} onPress={() => this.select_importfile(index)}>
                                            <View style={{ width: 20, height: 20, marginRight: 15 }}>
                                                <Image source={require('../icons/square.png')} style={{ width: '100%', height: '100%', resizeMode: 'contain' }} />
                                                {
                                                    item.selected &&
                                                    <Image source={require('../icons/checked.png')} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', resizeMode: 'contain' }} />
                                                }
                                            </View>
                                            <Text style={[{ fontSize: 14, color: Colors.black }, stylesGlobal.font]}>{item.filename}</Text>
                                        </TouchableOpacity>
                                    )
                                }
                            </ScrollView>
                        }
                    </View>
                    <View style={{ width: '100%', padding: 20, flexDirection: 'row', justifyContent: 'flex-end' }}>
                        <TouchableOpacity style={[{ paddingVertical: 10, paddingHorizontal: 20, minWidth: 60, backgroundColor: Colors.gold, borderRadius: 5, justifyContent: 'center', alignItems: 'center' }, stylesGlobal.shadow_style]}
                            onPress={() => this.importGuestList()}
                        >
                            <Text style={[{ fontSize: 14, color: Colors.white }, stylesGlobal.font]}>{"Import"}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[{ paddingVertical: 10, paddingHorizontal: 20, minWidth: 60, backgroundColor: Colors.gold, borderRadius: 5, marginLeft: 15, justifyContent: 'center', alignItems: 'center' }, stylesGlobal.shadow_style]}
                            onPress={() => this.setState({ showImportGuestListPopup: false, })}
                        >
                            <Text style={[{ fontSize: 14, color: Colors.white }, stylesGlobal.font]}>{"Cancel"}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        )
    }
    /**
    * handle search button click of keybaord
    */
    handleEditCompleteSearchText = () => {
        searchText = this.state.searchText.trim();
        this.setState({
            searchText: searchText,
        });
        if (searchText.length > 0) {
            this.props.navigation.navigate('Dashboard', { selected_screen: "members", search_text: searchText });
        }
    };

    selectContact = async (invite_index) => {

        await selectContact()
            .then(async (selection) => {
                if (!selection) {
                    this.setState({
                        selected_invite_index: -1
                    })
                    return null;
                }

                this.setState({
                    selected_invite_index: invite_index
                })

                if (selection.phones.length > 0) {
                    for (i = 0; i < selection.phones.length; i++) {
                        if (i == 0) {
                            selection.phones[i].selected = true;
                        } else {
                            selection.phones[i].selected = false;
                        }
                    }
                }
                if (selection.emails.length > 0) {
                    for (i = 0; i < selection.emails.length; i++) {
                        if (i == 0) {
                            selection.emails[i].selected = true;
                        } else {
                            selection.emails[i].selected = false;
                        }
                    }
                }
                if (selection.phones.length > 1 || selection.emails.length > 1) {
                    selection.first_name = "";
                    selection.last_name = "";
                    var name_splite = [];
                    if (selection.name != null && selection.name != "") {
                        name_splite = selection.name.split(" ");
                        selection.first_name = name_splite[0];
                        if (name_splite.length > 1) {
                            for (i = 1; i < name_splite.length; i++) {
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
                    if (selection.name) {
                        contact_name = selection.name;
                    }
                    if (selection.phones.length > 0) {
                        contact_phoneNumber = selection.phones[0].number;
                    }
                    if (selection.emails.length > 0) {
                        contact_email = selection.emails[0].address;
                    }
                    var name_splite = [];
                    rowInvitation[invite_index].first_name = "";
                    rowInvitation[invite_index].last_name = "";
                    if (contact_name != null && contact_name != "") {
                        name_splite = contact_name.split(" ");
                        rowInvitation[invite_index].first_name = name_splite[0];
                        if (name_splite.length > 1) {
                            for (i = 1; i < name_splite.length; i++) {
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
            <View style={{ position: 'absolute', width: '100%', height: '100%', top: 0, left: 0, zIndex: 10, justifyContent: 'flex-end', alignItems: 'center' }}>
                <View style={{ position: 'absolute', width: '100%', height: '100%', top: 0, left: 0, backgroundColor: Colors.black, opacity: 0.3, }}
                    onStartShouldSetResponder={() => this.setState({ showPhoneEmailSelectPopUp: false })}
                />
                <View style={{ width: '95%', maxHeight: height - 100, backgroundColor: Colors.white, alignItems: 'center', paddingHorizontal: 15, borderRadius: 10, justifyContent: 'center', marginBottom: 30, }}>
                    <TouchableOpacity style={{ position: 'absolute', top: 20, right: 20, width: 15, height: 15, zIndex: 20 }} onPress={() => this.setState({ showPhoneEmailSelectPopUp: false })}>
                        <Image style={{ width: '100%', height: '100%', tintColor: Colors.gold }} source={require('../icons/connection-delete.png')} />
                    </TouchableOpacity>
                    <Text style={[stylesGlobal.font, styles.actionButtonText, { textAlign: 'center', marginTop: 30 }]}>{"Select Phone Number and Email"}</Text>
                    <View style={{ width: '90%', height: 1, backgroundColor: Colors.gray, marginVertical: 10 }} />
                    <View style={{ width: '100%', }}>
                        <Text style={[stylesGlobal.font, { fontSize: 15, }]}>{"Name"}</Text>
                        <View style={{ width: '100%', alignItems: 'flex-end' }}>
                            <View style={{ width: '90%', flexDirection: 'row', alignItems: 'center' }}>
                                <Text style={[stylesGlobal.font, { fontSize: 14, textAlign: 'center', width: 60 }]}>{"name"}</Text>
                                <Text style={[{ paddingLeft: 10, borderRadius: 3, borderWidth: 1, borderColor: Colors.gray, width: '70%', marginTop: 10, paddingVertical: 5, fontSize: 12 }, stylesGlobal.font]}>{this.state.selected_contact.name}</Text>
                                <View style={{ marginLeft: 10, width: 20, height: 20 }}>

                                </View>
                            </View>
                        </View>
                    </View>
                    <View style={{ width: '100%', marginTop: 10 }}>
                        <Text style={[stylesGlobal.font, { fontSize: 15, }]}>{"Phone Number"}</Text>
                        {
                            this.state.selected_contact.phones.map((item, index) =>
                                <TouchableOpacity key={index} style={{ width: '100%', alignItems: 'flex-end' }} onPress={() => {
                                    var selected_contact = this.state.selected_contact;
                                    for (i = 0; i < selected_contact.phones.length; i++) {
                                        if (i == index) {
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
                                    <View style={{ width: '90%', flexDirection: 'row', alignItems: 'center' }}>
                                        <Text style={[stylesGlobal.font, { fontSize: 14, textAlign: 'center', width: 60 }]}>{item.type}</Text>
                                        <PhoneInput
                                            disabled={true}
                                            value={item.number}
                                            style={{
                                                flex: 1,
                                                paddingLeft: 10,
                                                borderRadius: 3,
                                                borderWidth: 1,
                                                borderColor: Colors.gray,
                                                marginTop: 10,
                                                paddingVertical: 5,
                                            }}
                                            flagStyle={{
                                                width: 25,
                                                height: 15
                                            }}
                                            textStyle={[stylesGlobal.font, { fontSize: 12 }]}
                                        />
                                        <View style={{ marginLeft: 10, width: 20, height: 20 }}>
                                            {
                                                item.selected &&
                                                <Image source={require('../icons/checked.png')} style={{ width: '100%', height: '100%', resizeMode: 'contain' }} />
                                            }
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            )
                        }
                    </View>
                    <View style={{ width: '100%', marginTop: 10 }}>
                        <Text style={[stylesGlobal.font, { fontSize: 15, }]}>{"Email"}</Text>
                        {
                            this.state.selected_contact.emails.map((item, index) =>
                                <TouchableOpacity key={index} style={{ width: '100%', alignItems: 'flex-end' }} onPress={() => {
                                    var selected_contact = this.state.selected_contact;
                                    for (i = 0; i < selected_contact.emails.length; i++) {
                                        if (i == index) {
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
                                    <View style={{ width: '90%', flexDirection: 'row', alignItems: 'center' }}>
                                        <Text style={[stylesGlobal.font, { fontSize: 14, textAlign: 'center', width: 60 }]}>{item.type}</Text>
                                        <Text style={[{ paddingLeft: 10, borderRadius: 3, borderWidth: 1, borderColor: Colors.gray, width: '70%', marginTop: 10, paddingVertical: 5, fontSize: 12 }, stylesGlobal.font]}>{item.address}</Text>
                                        <View style={{ marginLeft: 10, width: 20, height: 20 }}>
                                            {
                                                item.selected &&
                                                <Image source={require('../icons/checked.png')} style={{ width: '100%', height: '100%', resizeMode: 'contain' }} />
                                            }
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            )
                        }
                    </View>
                    <View style={{ width: '100%', height: 1, backgroundColor: Colors.gold, marginVertical: 10 }} />
                    <TouchableOpacity style={[{ paddingHorizontal: 10, paddingVertical: 10, backgroundColor: Colors.gold, borderRadius: 3, marginBottom: 20, width: '50%', alignItems: 'center' }, stylesGlobal.shadow_style]}
                        onPress={() => {
                            if (this.state.selected_invite_index > -1) {
                                var rowInvitation = this.state.rowInvitation;
                                var selected_contact = this.state.selected_contact;
                                var contact_name = "";
                                var contact_email = "";
                                var contact_phoneNumber = "";
                                if (selected_contact.name) {
                                    contact_name = selected_contact.name;
                                }
                                for (i = 0; i < selected_contact.phones.length; i++) {
                                    if (selected_contact.phones[i].selected) {
                                        contact_phoneNumber = selected_contact.phones[i].number;
                                        break;
                                    }
                                }
                                for (i = 0; i < selected_contact.emails.length; i++) {
                                    if (selected_contact.emails[i].selected) {
                                        contact_email = selected_contact.emails[i].address;
                                        break;
                                    }
                                }
                                var name_splite = [];
                                rowInvitation[this.state.selected_invite_index].first_name = "";
                                rowInvitation[this.state.selected_invite_index].last_name = "";
                                if (contact_name != null && contact_name != "") {
                                    name_splite = contact_name.split(" ");
                                    rowInvitation[this.state.selected_invite_index].first_name = name_splite[0];
                                    if (name_splite.length > 1) {
                                        for (i = 1; i < name_splite.length; i++) {
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
                        <Text style={[stylesGlobal.font, { color: Colors.white, fontSize: 12 }]}>{"Select"}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        )
    }



    sendReminders = async () => {
        if (this.state.send_reminders_type == "everyone") {
            if (this.state.total_confirmed == 0) {
                return;
            }
        }
        if (this.state.send_reminders_type == "not_replied") {
            if (this.state.total_non_replied == 0) {
                return;
            }
        }

        try {

            this.setState({
                loading: true
            });

            let uri = Memory().env == "LIVE" ? Global.URL_SEND_REMINDERS : Global.URL_SEND_REMINDERS_DEV;
            let params = new FormData();
            params.append("token", this.state.userToken);
            params.append("user_id", this.state.userId);
            params.append("format", "json");
            params.append("event_id", this.state.eventId);
            if (this.state.send_reminders_type == "everyone") {
                params.append("notify_all", 1);
            } else if (this.state.send_reminders_type == "not_replied") {
                params.append("notify_all", 0);
            }

            console.log(TAG + " callSendRemindersAPI uri " + uri);
            console.log(TAG + " callSendRemindersAPI params " + JSON.stringify(params));

            WebService.callServicePost(uri, params, this.handleSendRemindersAPI);
        } catch (error) {
            console.log(TAG + " callSendRemindersAPI error " + error);
            this.setState({
                loading: false,
            });
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    }

    handleSendRemindersAPI = (response, isError) => {
        console.log(TAG + " callSendRemindersAPI Response " + JSON.stringify(response));
        console.log(TAG + " callSendRemindersAPI isError " + isError);

        if (!isError) {
            var result = response;
            if (result != undefined && result != null) {
                if (result.status == "success") {
                    Alert.alert("Sent Reminders Successfully", "");
                    this.setState({
                        send_reminders_popup_show: false
                    })
                } else {
                    Alert.alert("Error occurred. Please try again");
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
    
    renderSendRemindersView = () => {
        return (
            <Modal
                animationType="fade"
                transparent={true}
                // closeOnClick={true}
                visible={this.state.send_reminders_popup_show}
                onRequestClose={() => this.setState({ send_reminders_popup_show: false })}
                supportedOrientations={['portrait', 'landscape']}
            >
                <KeyboardAvoidingView style={{ flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center'}} contentContainerStyle={{ flex: 1 }} behavior={Platform.OS == "ios" ? "padding" : null} keyboardVerticalOffset={isIphoneX() ? getBottomSpace() + 15 : 18} enabled>
                
                {/* <View style={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}> */}
                    <View style={stylesGlobal.popup_bg_blur_view}></View>
                    <View style={stylesGlobal.popup_main_container}>
                        <View style={stylesGlobal.popup_title_view}>
                            <Text style={[stylesGlobal.popup_title_text, stylesGlobal.font]}>{"Send Reminders"}</Text>
                            <TouchableOpacity style={stylesGlobal.popup_cancel_button} onPress={() => this.setState({ send_reminders_popup_show: false })}>
                                <Image style={stylesGlobal.cancel_delete_image} source={require('../icons/connection-delete.png')} />
                            </TouchableOpacity>
                        </View>
                        <View style={stylesGlobal.popup_desc_container}>
                            <TouchableOpacity style={{ width: '100%', flexDirection: 'row', alignItems: 'center' }} onPress={() => this.setState({ send_reminders_type: "everyone" })}>
                                <View style={{ width: 20, height: 20, marginEnd: 10 }}>
                                    <Image style={{ width: '100%', height: '100%', resizeMode: 'contain' }} source={require('../icons/square.png')} />
                                    {
                                        this.state.send_reminders_type == "everyone" && //not_replied
                                        <Image style={{ position: 'absolute', top: 0, left: 0, width: 20, height: 25, resizeMode: 'contain' }} source={require('../icons/checked.png')} />
                                    }
                                </View>
                                <Text style={[stylesGlobal.popup_desc_text, { color: this.state.send_reminders_type == "everyone" ? Colors.gold : Colors.black }, stylesGlobal.font]}>{"Message Everyone"}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={{ width: '100%', flexDirection: 'row', alignItems: 'center', marginTop: 15 }} onPress={() => this.setState({ send_reminders_type: "not_replied" })}>
                                <View style={{ width: 20, height: 20, marginEnd: 10 }}>
                                    <Image style={{ width: '100%', height: '100%', resizeMode: 'contain' }} source={require('../icons/square.png')} />
                                    {
                                        this.state.send_reminders_type == "not_replied" && //not_replied
                                        <Image style={{ position: 'absolute', top: 0, left: 0, width: 20, height: 25, resizeMode: 'contain' }} source={require('../icons/checked.png')} />
                                    }
                                </View>
                                <Text style={[stylesGlobal.popup_desc_text, { color: this.state.send_reminders_type == "not_replied" ? Colors.gold : Colors.black }, stylesGlobal.font]}>{"Only Message Guests Who Have Not Replied"}</Text>
                            </TouchableOpacity>
                            <TextInput
                                multiline={true}
                                returnKeyType='default'
                                placeholder="Your Message"
                                underlineColorAndroid="transparent"
                                autoCapitalize='sentences'
                                onChangeText={value => {
                                    this.setState({ send_reminder_message: value })
                                }}
                                value={this.state.send_reminder_message}
                                style={[stylesGlobal.popup_textinput, stylesGlobal.font]}
                                onSubmitEditing={(event) => {

                                }}
                            ></TextInput>
                        </View>
                        <View style={stylesGlobal.popup_button_container}>
                            <TouchableOpacity style={[stylesGlobal.common_button, { marginEnd: 10 }, stylesGlobal.shadow_style]} onPress={() => this.sendReminders()}>
                                <Text style={[stylesGlobal.popup_button_text, stylesGlobal.font]}>{"Send("}{this.state.send_reminders_type == "everyone" ? this.state.total_confirmed : this.state.total_non_replied}{")"}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[stylesGlobal.common_button, stylesGlobal.shadow_style]}
                                onPress={() =>
                                    this.setState({
                                        send_reminders_popup_show: false
                                    })
                                }
                            >
                                <Text style={[stylesGlobal.popup_button_text, stylesGlobal.font]}>{"Cancel"}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                {/* </View> */}
                </KeyboardAvoidingView>
            </Modal>
        )
    }

    /**
    * render invite popup view
    */
    renderInvitationPopUp = () => {
        var rowInvitation = this.state.rowInvitation;

        return (
            <View style={stylesGlobal.invite_popup_container_view}>
                <View style={{ position: 'absolute', width: width, height: height, top: 0, left: 0, backgroundColor: Colors.black, opacity: 0.3, }}
                    onStartShouldSetResponder={() => this.setState({ showInvitationPopUp: false })}
                />
                <View style={stylesGlobal.invite_popup_main_view}>
                    <View style={{ width: '100%', alignItems: 'flex-end', marginTop: 20, paddingHorizontal: 5 }}>
                        <TouchableOpacity style={{ width: 15, height: 15, }} onPress={() => this.setState({ showInvitationPopUp: false })}>
                            <Image style={{ width: '100%', height: '100%', tintColor: Colors.gold }} source={require('../icons/connection-delete.png')} />
                        </TouchableOpacity>
                    </View>
                    <KeyboardAwareScrollView keyboardShouldPersistTaps = "handled" style={{ width: '100%' }} contentContainerStyle={{ alignItems: 'center', }} extraScrollHeight={50}>
                        <View style={{ width: '100%', alignItems: 'center' }}>
                            <Image style={stylesGlobal.invite_popup_crown_image} source={require('../icons/crown.png')} />
                            <Text style={[stylesGlobal.invite_view_header_text, stylesGlobal.font]}>{Constants.INVITE_FRIEND_VIEW_HEADER}</Text>
                            <TouchableOpacity style={[stylesGlobal.invite_view_submit_button, stylesGlobal.shadow_style]} onPress={() => this.selectContact(0)}>
                                <Text style={[stylesGlobal.invite_view_submit_button_text, stylesGlobal.font]}>{"Import From Contacts"}</Text>
                            </TouchableOpacity>

                            <View style={{ width: '100%', height: 1, backgroundColor: Colors.gray, marginTop: 20 }} />

                            <View style={{ width: '100%', alignItems: 'center', justifyContent: 'center' }}>
                                <View style={stylesGlobal.invite_row_view}>
                                    <View style={{ width: '47%', }}>
                                        <Text style={[{ fontSize: 12, color: Colors.black }, stylesGlobal.font]}>{"First Name"}</Text>
                                        <View style={stylesGlobal.invite_view_input_view}>
                                            <TextInput
                                                placeholder='First Name'
                                                value={rowInvitation[0].first_name}
                                                style={[stylesGlobal.invite_view_input_text, stylesGlobal.font]}
                                                onChangeText={text => {
                                                    rowInvitation[0].first_name = text;
                                                    if (!this.state.popup_value_changed) {
                                                        if (text.length > 0 && text[text.length - 1] == 'a') {
                                                            rowInvitation[0].selected_gender_index = 1;
                                                            rowInvitation[0].selected_user_role_index = 2;
                                                        } else {
                                                            rowInvitation[0].selected_gender_index = 0;
                                                            rowInvitation[0].selected_user_role_index = 6;
                                                        }
                                                    }
                                                    this.setState({
                                                        rowInvitation,
                                                    })
                                                }}
                                            />
                                        </View>
                                    </View>
                                    <View style={{ width: '47%', }}>
                                        <Text style={[{ fontSize: 12, color: Colors.black }, stylesGlobal.font]}>{"Last Name"}</Text>
                                        <View style={stylesGlobal.invite_view_input_view}>
                                            <TextInput
                                                placeholder='Last Name'
                                                value={rowInvitation[0].last_name}
                                                style={[stylesGlobal.invite_view_input_text, stylesGlobal.font]}
                                                onChangeText={text => {
                                                    rowInvitation[0].last_name = text;
                                                    this.setState({
                                                        rowInvitation
                                                    })
                                                }}
                                            />
                                        </View>
                                    </View>
                                </View>
                                <View style={stylesGlobal.invite_row_view}>
                                    <View style={{ width: '47%' }} onLayout={(event) => this.setState({ invite_row_half_view_width: event.nativeEvent.layout.width })}>
                                        <Text style={[{ fontSize: 12, color: Colors.black }, stylesGlobal.font]}>{"Gender"}</Text>
                                        <ModalDropdown
                                            style={stylesGlobal.invite_view_gender_view}
                                            dropdownStyle={{ width: this.state.invite_row_half_view_width, height: 30 * this.state.user_gender.length }}
                                            defaultIndex={0}
                                            options={this.state.user_gender}
                                            onSelect={(gender_index) => {
                                                rowInvitation[0].selected_gender_index = gender_index;
                                                if (!this.state.popup_value_changed) {
                                                    if (gender_index == 1) {
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
                                            renderButton={() => {
                                                return (
                                                    <View style={[{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', }]}>
                                                        <Text style={[{ fontSize: 12, color: Colors.black }, stylesGlobal.font]}>{this.state.user_gender[this.state.rowInvitation[0].selected_gender_index].type}</Text>
                                                        <View style={{ height: '100%', aspectRatio: 1, justifyContent: 'center', alignItems: 'center', marginStart: 10 }}>
                                                            <Image style={{ width: '60%', height: '60%', resizeMode: 'contain' }} source={this.state.user_gender[this.state.rowInvitation[0].selected_gender_index].image}></Image>
                                                        </View>
                                                    </View>
                                                )
                                            }}
                                            renderRow={(gender_type_item, gender_index, highlighted) => {
                                                return (
                                                    <View style={[{ width: '100%', height: 30, alignItems: 'center', flexDirection: 'row', marginHorizontal: 10 }]}>
                                                        <View style={{ height: '100%', aspectRatio: 1, marginRight: 10, justifyContent: 'center', alignItems: 'center' }}>
                                                            <Image style={{ width: '60%', height: '60%', resizeMode: 'contain' }} source={gender_type_item.image}></Image>
                                                        </View>
                                                        <Text style={[{ fontSize: 12, color: Colors.black }, stylesGlobal.font]}>{gender_type_item.type}</Text>
                                                    </View>
                                                )
                                            }}
                                        />
                                    </View>
                                    <View style={{ width: '47%', }}>
                                        <Text style={[{ fontSize: 12, color: Colors.black }, stylesGlobal.font]}>{"Member Type"}</Text>
                                        <ModalDropdown
                                            style={stylesGlobal.invite_view_gender_view}
                                            dropdownStyle={{ width: this.state.invite_row_half_view_width, height: 30 * this.state.user_role.length }}
                                            defaultIndex={0}
                                            options={this.state.user_role}
                                            onSelect={(member_type_index) => {
                                                rowInvitation[0].selected_user_role_index = member_type_index;
                                                this.setState({
                                                    rowInvitation,
                                                    popup_value_changed: true
                                                })
                                            }}
                                            renderButton={() => {
                                                return (
                                                    <View style={[{ width: '100%', height: '100%', resizeMode: 'cover', alignItems: 'center', flexDirection: 'row', }]}>
                                                        <Image style={{ width: '100%', height: '100%', position: 'absolute', borderRadius: 2 }} source={{ uri: this.state.user_role[this.state.rowInvitation[0].selected_user_role_index].background }}></Image>
                                                        <View style={{flexDirection: 'row'}}>
                                                            
                                                            <View style={{ paddingStart: 10 }}>
                                                                <View style={{ height: '100%', aspectRatio: 1, marginRight: 5 }}>
                                                                    <Image style={{ width: '100%', height: '100%' }} source={this.state.user_role[this.state.rowInvitation[0].selected_user_role_index].badge }></Image>
                                                                </View>
                                                            </View>

                                                            <View style={{ flex: 1, height: '100%', justifyContent: 'center' }}>
                                                                <Text style={[{ fontSize: 12, color: Colors.white }, stylesGlobal.font]}>{this.state.user_role[this.state.rowInvitation[0].selected_user_role_index].name}</Text>
                                                            </View>
                                                        </View>

                                                        
                                                    </View>
                                                )
                                                // return (
                                                //     <View style={[{ width: '100%', height: '100%', resizeMode: 'cover', alignItems: 'center', flexDirection: 'row', }]}>
                                                //         <View style={{ flex: 1, height: '100%', alignItems: 'flex-end', justifyContent: 'center' }}>
                                                //             <Text style={[{ fontSize: 12, color: Colors.black }, stylesGlobal.font]}>{this.state.user_role[this.state.rowInvitation[0].selected_user_role_index].name}</Text>
                                                //         </View>
                                                //         <View style={{ width: '50%', paddingStart: 10 }}>
                                                //             <View style={{ height: '100%', aspectRatio: 1, marginRight: 5 }}>
                                                //                 <Image style={{ width: '100%', height: '100%' }} source={{ uri: this.state.user_role[this.state.rowInvitation[0].selected_user_role_index].badge }}></Image>
                                                //             </View>
                                                //         </View>
                                                //     </View>
                                                // )
                                            }}
                                            renderRow={(member_type_item, member_type_index, highlighted) => {
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
                                                // return (
                                                //     <View style={[{ width: '100%', height: 30, resizeMode: 'cover', alignItems: 'center', flexDirection: 'row', marginHorizontal: 10 }]}>
                                                //         <View style={{ height: '100%', aspectRatio: 1, marginRight: 10 }}>
                                                //             <Image style={{ width: '100%', height: '100%' }} source={{ uri: member_type_item.badge }}></Image>
                                                //         </View>
                                                //         <Text style={[{ fontSize: 12, color: Colors.black }, stylesGlobal.font]}>{member_type_item.name}</Text>
                                                //     </View>
                                                // )
                                            }}
                                        />
                                    </View>
                                </View>
                                <View style={[stylesGlobal.invite_row_view, { flexDirection: 'column' }]}>
                                    <Text style={[{ fontSize: 12, color: Colors.black }, stylesGlobal.font]}>{"Email Address"}</Text>
                                    <View style={stylesGlobal.invite_view_input_view}>
                                        <TextInput
                                            placeholder='Email'
                                            value={rowInvitation[0].email}
                                            style={[stylesGlobal.invite_view_input_text, stylesGlobal.font]}
                                            onChangeText={text => {
                                                rowInvitation[0].email = text;
                                                this.setState({ rowInvitation })
                                            }}
                                        />
                                    </View>
                                </View>
                                <Text style={[{ fontSize: 12, color: Colors.black, marginTop: 10 }, stylesGlobal.font]}>{"or"}</Text>
                                <View style={[stylesGlobal.invite_row_view, { flexDirection: 'column', marginTop: 0 }]}>
                                    <Text style={[{ fontSize: 12, color: Colors.black }, stylesGlobal.font]}>{"Phone Number"}</Text>
                                    {/* <View style={stylesGlobal.invite_view_input_view}> */}
                                    {/*     <PhoneInput */}
                                    {/*         ref='phone' */}
                                    {/*         value={rowInvitation[0].phoneNumber} */}
                                    {/*         onChangePhoneNumber={text => { */}
                                    {/*             rowInvitation[0].phoneNumber = text; */}
                                    {/*             this.setState({ rowInvitation }) */}
                                    {/*         }} */}
                                    {/*         onSelectCountry={(country) => { */}
                                    {/*             console.log(country) */}
                                    {/*         }} */}
                                    {/*         style={stylesGlobal.invite_view_input_text} */}
                                    {/*         flagStyle={{ */}
                                    {/*             width: 25, */}
                                    {/*             height: 15 */}
                                    {/*         }} */}
                                    {/*         textStyle={[stylesGlobal.font, { fontSize: 12 }]} */}
                                    {/*     /> */}
                                    {/* </View> */}

                                    <View style={[styles.TextInputStyle, {
                                        paddingTop: 0,
                                        paddingBottom: 0,
                                        paddingLeft: 0,
                                        marginTop: 5,
                                        flexDirection: 'row',
                                        alignItems: 'center'
                                       }]}>
                                        <View style={{marginLeft: 10, marginRight: 10, flexDirection: 'row', alignItems: 'center'}}>
                                            <CountryPicker onSelect={(value) => {
                                                rowInvitation[0].callingCode = value.callingCode;
                                                rowInvitation[0].countryName = value.cca2;
                                                rowInvitation[0].valuePhone = "";
                                                this.setState({rowInvitation});

                                                // this.setState({ 
                                                //     callingCode: value.callingCode, 
                                                //     countryName: value.cca2, 
                                                //     valuePhone: "" })
                                            }}
                                                countryCode={rowInvitation[0].countryName}
                                                withFlag={true}
                                                withCallingCode={true}
                                            />
                                            <Image style={{ width: 10, height: 10, resizeMode: 'contain', marginRight: 20 }} source={require('../icons/down_arrow.png')} />
                                        </View>
                                        {/* <View style = {{flexDirection:'row', alignItems: 'center', width: '90%'}}> */}
                                        <Text style={[{fontSize: 16,  marginLeft: 2, qkemarginTop: 3 }, stylesGlobal.font]}>+{rowInvitation[0].callingCode}</Text>
                                        <TextInput
                                            ref='phoneInput'
                                            multiline={false}
                                            returnKeyType='done'
                                            keyboardType='phone-pad'
                                            numberOfLines={1}
                                            underlineColorAndroid="transparent"
                                            autoCapitalize='sentences'
                                            onChangeText={value => {
                                                const num = parsePhoneNumberFromString(value, rowInvitation[0].countryName)

                                                let reg = /^[0-9]/
                                                if (!!num && 
                                                    rowInvitation[0].phoneNumber.length > value.length && 
                                                    !reg.test(rowInvitation[0].phoneNumber[rowInvitation[0].phoneNumber.length - 1])){
                                                  let phone = num.nationalNumber.split('')
                                                  phone.pop()
                                                  phone = phone.join('');
                                                  rowInvitation[0].phoneNumber = phone;
                                                  this.setState({rowInvitation})
                                                } else {
                                                    rowInvitation[0].phoneNumber = new AsYouType(this.state.countryName).input(value);
                                                  this.setState({rowInvitation})
                                                }

                                              //  this.setState({ phoneNumber: numPhone})
                                            }}
                                            value={removeCountryCode(rowInvitation[0].phoneNumber)}
                                            style={[styles.textInputText, stylesGlobal.font, { flexGrow: 1, marginLeft: 10}]}
                                            onSubmitEditing={(event) => {
                                                //this.refs.valueNetWorthAnnualy.focus();

                                            }}
                                        ></TextInput>
                                        {/* </View> */}
                                        {/* </View> */}
                                    </View>
                                </View>
                                {/* <Text style={[{ fontSize: 12, color: Colors.black, marginTop: 10 }, stylesGlobal.font]}>{"or"}</Text> */}
                                {/* <View style={[stylesGlobal.invite_row_view, { flexDirection: 'column', marginTop: 0 }]}> */}
                                {/*     <Text style={[{ fontSize: 12, color: Colors.black }, stylesGlobal.font]}>{"Instagram"}</Text> */}
                                {/*     <View style={stylesGlobal.invite_view_input_view}> */}
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

                            <TouchableOpacity style={[stylesGlobal.invite_view_submit_button, { marginBottom: 20 }, stylesGlobal.shadow_style]}
                                onPress={() => {
                                    this.callInviteNoneMemberAPI();
                                }}
                            >
                                <Text style={[stylesGlobal.invite_view_submit_button_text, stylesGlobal.font]}>{"Invite your friend"}</Text>
                            </TouchableOpacity>
                        </View>
                    </KeyboardAwareScrollView>
                </View>
            </View>
        )
    }

    /**
    * display top header
    **/
    renderHeaderView = () => {

        let imageUrl = this.state.userImagePath + Constants.THUMB_FOLDER + this.state.userImageName;
        return (
            <View style={[stylesGlobal.headerView]}>
                <TouchableOpacity style={stylesGlobal.header_backbuttonview_style} onPress={() => {
                    if (this.state.event_changed && this.props.route.params.refreshEventData) {
                        this.props.route.params.refreshEventData();
                    }
                    // this.props.route.params.tab_type
                    this.props.navigation.goBack();
                }}>
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
                        underlineColorAndroid="transparent"
                        returnKeyType={"search"}
                        style={[stylesGlobal.header_searchtextview_style, stylesGlobal.font]}
                        onChangeText={searchText => this.setState({ searchText })}
                        value={this.state.searchText}
                        defaultValue=""
                        multiline={false}
                        autoCorrect={false}
                        autoCapitalize='sentences'
                        onSubmitEditing={this.handleEditCompleteSearchText}
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

    getDocumentPathPicker = async () => {
        this.setState({showExportGuestListPopup: true}, async () => {
            try {



                console.log(TAG, 'getDocmentPathPicker')
                const res = await DocumentPicker.pickDirectory();
                //  const response = await DocumentPicker.pick({
                //     type: [DocumentPicker.types.allFiles],
                // });
                console.log(TAG, " getDocumentPathPicker ", res);
                if (res.uri != undefined && res.uri != null) {
                   this.setState({ file_dir_path: res.uri });
                    // .replace("file://", "")
                }

                //export_filename

                var tmpFileName = Moment(new Date).utc().format('DD MMM YYYY') + " " + this.state.eventName;


               this.setState({  export_filename: tmpFileName });
            } catch (err) {
                if (DocumentPicker.isCancel(err)) {
                    // User cancelled the picker, exit any dialogs or menus and move on
                } else {
                    throw err;
                }
            }
        });
        
    }

    renderPopupView = () => {
        return (
            <CustomPopupView
                ref="popupRef"
                showModel={this.state.showModel}
                openMyAccountScreen={(show_myaccount, myaccount_initial_tab) => { this.props.navigation.navigate('Dashboard', { selected_screen: "myaccount", myaccount_initial_tab: myaccount_initial_tab }) }}
                logoutUser={this.logoutUser}
                closeDialog={() => { this.setState({ showModel: false }) }}
                prop_navigation={this.props.navigation}
            >

            </CustomPopupView>
        );
    }

    renderGuests = (is_invited, attendees_id, is_past, is_cancelled) => {
        var eventInviteList = this.state.eventInviteList;
        var ishosted = eventDetailData.info.event_host_userid === this.state.userId;
        const { showAllGuest } = this.state;
        let p = [];
        const element = eventInviteList[0];
        const element1 = eventInviteList[1];
        const element2 = eventInviteList[2];
        const element3 = eventInviteList[3];
        p.push(
            <View key={0} style={{ width: '100%', flexDirection: 'row' }}>
                {element && this.renderGroupRow(element)}
                {element1 && this.renderGroupRow(element1)}
                {element2 && this.renderGroupRow(element2)}
                {element3 && this.renderGroupRow(element3)}
            </View>
        )
        p.push(
            <View key={1} style={{ width: '100%', justifyContent: 'center', alignItems: 'center' }}>
                {
                    // eventInviteList.length > 0 &&
                    <TouchableOpacity style={[styles.actionButton, stylesGlobal.shadow_style, { marginTop: 15, width: 150, marginRight: 10 }]}
                        onPress={() => {
                            this.onGuestPress();
                        }}
                    >
                        <Text style={[styles.actionButtonText, stylesGlobal.font]}>{"View All"}</Text>
                    </TouchableOpacity>
                }
                {
                    ishosted &&
                    <View style={{ width: '100%', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 10 }}>
                        <TouchableOpacity style={[styles.actionButton, stylesGlobal.shadow_style, { marginRight: 10, width: 150 }]}
                            onPress={async () => {
                                await this.getDocumentPathPicker();
                            }}
                        >
                            <Text style={[styles.actionButtonText, stylesGlobal.font]}>{"Export to File"}</Text>
                        </TouchableOpacity>
                        {
                            !is_past && !is_cancelled &&
                            <TouchableOpacity style={[styles.actionButton, stylesGlobal.shadow_style, { width: 150, marginRight: 10 }]}
                                onPress={() => {
                                    this.importGuestListPopup();
                                }}
                            >
                                <Text style={[styles.actionButtonText, stylesGlobal.font]}>{"Import from File"}</Text>
                            </TouchableOpacity>
                        }
                    </View>
                }
            </View>
        )
        return p;
    }

    renderGroupRow = item => {
        const imageWidth = (width - 130) / 4;
        var url = item.imgpath + item.filename;
        var slug = item.slug;
        return (
            <TouchableOpacity style={{ marginHorizontal: 5, width: imageWidth, height: imageWidth, borderRadius: imageWidth / 2 }}
                onPress={() => {
                    if (item.id === this.state.userId) {
                        this.props.navigation.navigate("MyProfile", {
                            refreshProfileImage: this.refreshProfileImage
                        });
                    } else {
                        this.props.navigation.navigate("ProfileDetail", {
                            slug: slug
                        });
                    }
                }}
            >
                <ImageCompressor style={{ width: imageWidth, height: imageWidth, borderRadius: imageWidth / 2, overflow: 'hidden', }} uri={url} />
            </TouchableOpacity>
        );
    };

    /**********
     *  rsvp submit button action
     ******************/
    rsvp_submit(event_type) {
        if (eventDetailData.info.is_guest_list_closed == 1) {
            Alert.alert("The Guest List is now closed.", "");
            return;
        }
        if (this.state.selected_rsvp != null) {
            if (this.state.selected_rsvp == '0' || this.state.selected_rsvp == '1' || this.state.selected_rsvp == '2') {
                if (this.state.origin_rsvp != this.state.selected_rsvp) {
                    this.callRSVPEventAPI(this.state.eventId, this.state.selected_rsvp, event_type);
                } else {
                    this.setState({
                        rsvp_view_show: false,
                    })
                }
            }
        }
    }

    /**
    * display event map
    **/
    renderMapView() {

        if (typeof eventDetailData == "undefined") {
            return null;
        }

        var eventInfo = eventDetailData.info;
        var latitude = eventInfo.venue_lat;
        var longitude = eventInfo.venue_lng;
        const isTravel = this.state.cat_id == "10";
        const streetViewLatLngD = {
            latitudeDelta: 0.001,
            longitudeDelta: 0.0015
        }
        const cityViewLatLngD = {
            latitudeDelta: 2.5,
            longitudeDelta: 0.8
        }
        const scheme = Platform.select({ ios: 'maps:0,0?q=', android: 'geo:0,0?q=' });
        const latLng = `${latitude},${longitude}`;
        const label = eventInfo.venue_address;
        const url = Platform.select({
            ios: `${scheme}${label}@${latLng}`,
            android: `${scheme}${latLng}(${label})`
        });
        return (
            <View style={{ width: '100%', height: 200, marginTop: 15 }}>
                <View style={{ paddingVertical: 10, paddingHorizontal: 15, position: 'absolute', top: 5, left: 5, backgroundColor: Colors.white, zIndex: 10, elevation: 10, borderRadius: 5 }}>
                    <Text style={[styles.subViewTitle, { color: Colors.black }, stylesGlobal.font]}>{eventInfo.venue_address}</Text>
                    <TouchableOpacity onPress={() => Linking.openURL(url)}>
                        <Text style={[styles.subViewTitle, { color: Colors.blue }, stylesGlobal.font]}>{"View larger map"}</Text>
                    </TouchableOpacity>
                </View>
                <MapView
                    ref={ref => this.mapViewRef = ref}
                    style={{ flex: 1, borderRadius: 15 }}
                    scrollEnabled={true}
                    initialRegion={{
                        latitude: parseFloat(latitude),
                        longitude: parseFloat(longitude),
                        ...(isTravel ? cityViewLatLngD : streetViewLatLngD)
                    }}

                    onRegionChangeComplete={region => {
                        const newRegion = {
                            latitude: parseFloat(latitude),
                            longitude: parseFloat(longitude),
                            ...(isTravel ? {
                                latitudeDelta: region.latitudeDelta,
                                longitudeDelta: region.longitudeDelta
                            } : streetViewLatLngD)
                        }
                        const current = new Date().getTime();
                        if (current - this.moment > 1000) {
                            if (region.latitude !== newRegion.latitude) {
                                this.mapViewRef.animateToRegion(newRegion, 0);
                            }
                        }
                        this.moment = new Date().getTime();
                    }}
                    onPress={(e) => Linking.openURL(url)}
                >
                    <MapView.Marker
                        coordinate={{
                            latitude: parseFloat(latitude),
                            longitude: parseFloat(longitude)
                        }}
                    />
                </MapView>
            </View>
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

    /**
    * display event comment data
    **/
    renderUserCommentView = () => {

        if (typeof eventDetailData == "undefined") {
            return null;
        }

        var allow_discussion = eventDetailData.allow_discussion;
        return (
            <View style={{ width: '100%', paddingRight: 20 }}>
                <View style={{ width: '100%' }}>
                    <TextInput
                        underlineColorAndroid="transparent"
                        returnKeyType={"done"}
                        style={[styles.commentTextInput, stylesGlobal.font]}
                        placeholderTextColor={Colors.gray}
                        onChangeText={comment => {
                            this.setState({ comment });
                        }}
                        value={this.state.comment}
                        defaultValue=""
                        multiline={false}
                        autoCapitalize='sentences'
                        autoCorrect={true}
                        placeholder="Leave a Comment"
                    // keyboardType='ascii-capable'
                    />

                    <View style={{ width: '100%', alignItems: 'center' }}>
                        {
                            !this.state.commentLoading ?
                                <TouchableOpacity style={[{ width: '100%', paddingVertical: 10, alignItems: 'center', backgroundColor: Colors.gold, borderRadius: 5, }, stylesGlobal.shadow_style]}
                                    onPress={() => {
                                        if (this.state.comment.length > 0) {
                                            this.setState({
                                                commentLoading: true
                                            });
                                            Keyboard.dismiss()
                                            this.callPostCommentAPI();
                                        } else {
                                            Keyboard.dismiss()
                                            Alert.alert(Constants.ENTER_COMMENT);
                                        }
                                    }}
                                >
                                    <Text style={[styles.actionButtonText, stylesGlobal.font]}>{"Submit Comment"}</Text>
                                </TouchableOpacity>
                                : null
                        }
                        {
                            this.state.commentLoading ?
                                <View style={[styles.postTextStyle, { backgroundColor: Colors.white, height: 50 }]}>
                                    <ProgressIndicator />
                                </View>
                                : null
                        }
                    </View>
                </View>
                {allow_discussion == "0" ? (
                    <View style={styles.blurView} />
                ) : null}
            </View>
        );
    }

    /**
     * call post comment of event
     */
    callPostCommentAPI = async () => {

        try {

            let uri = Memory().env == "LIVE" ? Global.URL_ADD_EVENT_COMMENT + this.state.eventId : Global.URL_ADD_EVENT_COMMENT_DEV + this.state.eventId
            let params = new FormData();
            params.append("token", this.state.userToken);
            params.append("user_id", this.state.userId);
            params.append("format", "json");
            params.append("comment", convertEmojimessagetoString(this.state.comment));

            console.log(TAG + " callPostCommentAPI uri " + uri);
            console.log(TAG + " callPostCommentAPI params " + JSON.stringify(params));

            WebService.callCommentPost(uri, params, this.handlPostCommentResponse);
        } catch (error) {
            console.log(TAG + " callPostCommentAPI error " + error);
            this.setState({
                commentLoading: false
            });
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    };

    /**
    * handle post comment API response
    **/
    handlPostCommentResponse = (response, isError) => {
        console.log(TAG + " callPostCommentAPI Response " + JSON.stringify(response));
        console.log(TAG + " callPostCommentAPI isError " + isError);

        if (!isError) {
            var result = response;
            if (result != undefined && result != null) {

                var commentObj = result.data;
                commentObj.reply = [];
                this.setState({
                    comment: "",
                    commentsList: [...commentObj, ...this.state.commentsList],
                });
            }
        } else {
            if (response != undefined && response != null && response.length > 0) {
                Alert.alert(response.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
        this.setState({
            commentLoading: false
        });
    };

    showReplyInput = (comment_id) => {
        var commentsList = this.state.commentsList;
        var selected_comment_index = 0;
        for (i = 0; i < commentsList.length; i++) {
            if (commentsList[i].id == comment_id) {
                selected_comment_index = i;
                break;
            }
        }
        commentsList[selected_comment_index].showReply = !commentsList[selected_comment_index].showReply;
        this.setState({
            commentsList: commentsList
        })
    }

    sendReplyComment = (root_comment, comment_text) => {

        try {
            this.setState({
                selected_comment: root_comment,
                commentLoading: true
            })

            let uri = Memory().env == "LIVE" ? Global.URL_REPLY_COMMENTS + this.state.eventId : Global.URL_REPLY_COMMENTS_DEV + this.state.eventId
            let params = new FormData();
            params.append("token", this.state.userToken);
            params.append("user_id", this.state.userId);
            params.append("format", "json");
            var data = {
                parentId: root_comment.id,
                rootId: root_comment.id,
                comment: comment_text
            }
            params.append("data", JSON.stringify(data));

            console.log(TAG + " callSendReplyAPI uri " + uri);
            console.log(TAG + " callSendReplyAPI params " + JSON.stringify(params));

            WebService.callServicePost(uri, params, this.handlecallSendReplyComments);
        } catch (error) {
            console.log(TAG + " callSendReplyAPI error " + error);
            this.setState({
                commentLoading: false
            });
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    }

    handlecallSendReplyComments = (response, isError) => {
        console.log(TAG + " callSendReplyAPI Response " + JSON.stringify(response));
        console.log(TAG + " callSendReplyAPI isError " + isError);

        if (!isError) {
            var result = response;
            if (result != undefined && result != null) {
                if (result.status == "success") {
                    var commentsList = this.state.commentsList;
                    var selected_comment_index = 0;
                    for (i = 0; i < commentsList.length; i++) {
                        if (commentsList[i].id == this.state.selected_comment.id) {
                            selected_comment_index = i;
                            break;
                        }
                    }
                    commentsList[selected_comment_index].showReply = !commentsList[selected_comment_index].showReply;
                    commentsList[selected_comment_index].reply = result.data;
                    this.setState({
                        commentsList: commentsList,
                        commentLoading: false
                    })
                }
            }
        } else {
            this.setState({
                commentLoading: false
            });
            if (response != undefined && response != null && response.length > 0) {
                Alert.alert(response.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    }

    deleteComment = (delete_comment) => {
        try {
            this.setState({
                selected_comment: delete_comment,
                commentLoading: true
            })

            let uri = Memory().env == "LIVE" ? Global.URL_DELETE_COMMENT + delete_comment.id : Global.URL_DELETE_COMMENT_DEV + delete_comment.id;
            let params = new FormData();
            params.append("token", this.state.userToken);
            params.append("user_id", this.state.userId);
            params.append("format", "json");
            var data = {
                parentId: delete_comment.id,
                rootId: delete_comment.id,
            }
            params.append("data", JSON.stringify(data));

            console.log(TAG + " callDeleteCommentAPI uri " + uri);
            console.log(TAG + " callDeleteCommentAPI params " + JSON.stringify(params));

            WebService.callServicePost(uri, params, this.handleDeleteComments);
        } catch (error) {
            console.log(TAG + " callDeleteCommentAPI error " + error);
            this.setState({
                commentLoading: false
            });
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    }

    handleDeleteComments = (response, isError) => {
        console.log(TAG + " callDeleteCommentAPI Response " + JSON.stringify(response));
        console.log(TAG + " callDeleteCommentAPI isError " + isError);

        if (!isError) {
            var result = response;
            if (result != undefined && result != null) {
                if (result.status == "success") {
                    var commentsList = this.state.commentsList;
                    var selected_comment_index = -1;
                    for (i = 0; i < commentsList.length; i++) {
                        if (commentsList[i].id == this.state.selected_comment.id) {
                            commentsList.splice(i, 1);
                            selected_comment_index = i;
                            break;
                        }
                        if (commentsList[i].reply != null && Array.isArray(commentsList[i].reply)) {
                            for (j = 0; j < commentsList[i].reply.length; j++) {
                                if (commentsList[i].reply[j].id == this.state.selected_comment.id) {
                                    commentsList[i].reply.splice(j, 1);
                                    selected_comment_index = j;
                                    break;
                                }
                            }
                            if (selected_comment_index != -1) {
                                break
                            }
                        }
                    }
                    this.setState({
                        commentsList: commentsList,
                    })
                }
            }
        } else {

            if (response != undefined && response != null && response.length > 0) {
                Alert.alert(response.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
        this.setState({
            commentLoading: false
        });
    }

    seemoreComments() {
        try {
            this.setState({
                commentLoading: true
            });

            let uri = Memory().env == "LIVE" ? Global.URL_SEEMORE_COMMENTS + this.state.comment_page : Global.URL_SEEMORE_COMMENTS_DEV + this.state.comment_page
            let params = new FormData();
            params.append("token", this.state.userToken);
            params.append("user_id", this.state.userId);
            params.append("format", "json");
            params.append("event_id", this.state.eventId);
            params.append("limit", this.state.seemoreCommentLimit);

            console.log(TAG + " callSeeMoreAPI uri " + uri);
            console.log(TAG + " callSeeMoreAPI params " + JSON.stringify(params));

            WebService.callServicePost(uri, params, this.handleSeeMoreComments);
        } catch (error) {
            console.log(TAG + " callSeeMoreAPI error " + error);
            this.setState({
                commentLoading: false
            });
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    }

    handleSeeMoreComments = (response, isError) => {
        console.log(TAG + " callSeeMoreAPI Response " + JSON.stringify(response));
        console.log(TAG + " callSeeMoreAPI isError " + isError);

        if (!isError) {
            var result = response;
            if (result != undefined && result != null) {
                if (result.status == "success") {
                    var comment_list = result.data;
                    for (i = 0; i < comment_list.length; i++) {
                        comment_list[i].showReply = false
                    }
                    if (comment_list.length < this.state.seemoreCommentLimit) {
                        this.setState({
                            seemoreComments: false,
                        })
                    } else {
                        this.setState({
                            seemoreComments: true,
                            comment_page: this.state.comment_page + 1
                        })
                    }
                    this.setState({
                        commentsList: [...this.state.commentsList, ...comment_list],
                        commentLoading: false
                    })
                }
            }
        } else {
            this.setState({
                commentLoading: false
            });
            if (response != undefined && response != null && response.length > 0) {
                Alert.alert(response.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    }

    /**
  * display comment list data
  **/
    renderCommentsList = () => {

        if (!eventDetailData) {
            return null;
        }

        if (this.state.is_verified != "1" || !(this.state.dataEventDetail.allow_discussion == 1 || this.state.dataEventDetail.info.is_special != "0")) {
            var commentsList = [];
            if (this.state.commentsList.length > 2) {
                commentsList.push(this.state.commentsList[0]);
                commentsList.push(this.state.commentsList[1]);
                this.setState({
                    commentsList: commentsList
                })
            }
        }

        return (
            <View style={{ width: '100%', minHeight: 50 }}>
                {
                    this.state.commentsList.map((item, index) =>
                        <EventsCommentsRow
                            key={index}
                            data={item}
                            showReplyInput={this.showReplyInput}
                            sendReplyComment={this.sendReplyComment}
                            deleteComment={this.deleteComment}
                            user_slug={this.state.userSlug}
                            navigation={this.props.navigation}
                        />
                    )

                }
                {/* {
                this.state.seemoreComments &&
                <TouchableOpacity style={{alignSelf:'center'}} onPress = {() => this.seemoreComments()}>
                    <Text style={{color:Colors.gold}}>see more</Text>
                </TouchableOpacity>
            } */}
                {
                    (this.state.is_verified != "1" || !(this.state.dataEventDetail.allow_discussion == 1 || this.state.dataEventDetail.info.is_special != "0")) &&
                    // <View style = {{width: '100%', height: '100%', position: 'absolute', zIndex: 5, left: 0, top: 0}}>
                    //     <View style = {{width: '100%', height: '100%', position: 'absolute', zIndex: 10, left: 0, top: 0, backgroundColor: Colors.white, opacity: 0.95}}/>
                    //     <View style = {{width: '100%', height: '100%', position: 'absolute', zIndex: 20, left: 0, top: 0, justifyContent: 'center', alignItems: 'center'}}>
                    //         <View style = {{width: '80%', flexDirection: 'row', justifyContent: 'center', alignItems: 'center'}}>
                    //             <Image  style={stylesGlobal.hidden_lock_image} source={require("../icons/signin_password.png")}/>
                    //             <Text style = {[{fontSize: 14, color: Colors.gold, textAlign: "center", marginLeft: 10}, stylesGlobal.font]}>{this.state.is_verified != "1" ? Constants.NOT_APPROVED_MESSAGE : "You are not in the guest list."}</Text>
                    //         </View>
                    //     </View>
                    // </View>
                    <InvisibleBlurView>
                        <View style={{ width: '80%', flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
                            <Image style={stylesGlobal.hidden_lock_image} source={require("../icons/signin_password.png")} />
                            <Text style={[{ fontSize: 14, color: Colors.gold, textAlign: "center", marginLeft: 10 }, stylesGlobal.font]}>{this.state.is_verified != "1" ? Constants.NOT_APPROVED_MESSAGE : "You are not in the guest list."}</Text>
                        </View>
                    </InvisibleBlurView>
                }
            </View>
        )
    };

    /**
  * cancel event click
  **/
    onCancelPress = () => {
        Alert.alert(Constants.CANCEL_EVENT_ALERT_TITLE, Constants.CANCEL_EVENT_ALERT_MESSAGE,
            [{ text: 'Yes', onPress: () => this.callCancelEventAPI() }
                , {
                text: 'No', onPress: () => {
                }
            }],
            { cancelable: false })
    }

    /**
* delete event click
**/
    onDeletePress = () => {
        Alert.alert(Constants.DELETE_EVENT_ALERT_TITLE, Constants.DELETE_EVENT_ALERT_MESSAGE,
            [{ text: 'Yes', onPress: () => this.callDeleteEventAPI() }
                , {
                text: 'No', onPress: () => {
                }
            }],
            { cancelable: false })
    }
    /**
    * copy event click
    **/
    onCopyPress = () => {
        if (!eventDetailData) {
            return null;
        }
        const isTravel = this.state.cat_id == "10";
        const screenName = isTravel ? "CreateTravelScreen" : "CreateEvent"
        this.props.navigation.navigate(screenName, {
            user_id: this.state.userId,
            token: this.state.userToken,
            data: eventDetailData,
            isCopy: true,
            updateHostEvent: isTravel ? () => { } : this.getData,
            loadAfterDeletingEvent: this.loadAfterCopyEvent,
            type: 'copy_event'
        })
    }
    /**
       * edit event click
       **/
    onEditPress = () => {
        if (!eventDetailData) {
            return null;
        }
        const isTravel = this.state.cat_id == "10";
        const screenName = isTravel ? "CreateTravelScreen" : "CreateEvent"
        this.props.navigation.navigate(screenName, {
            user_id: this.state.userId,
            token: this.state.userToken,
            data: eventDetailData,
            isCopy: false,
            updateHostEvent: isTravel ? () => { } : this.getData,
            loadAfterDeletingEvent: this.loadAfterDeletingOrEditingEvent,
            type: 'edit_event'
        })
    }

    exportGuestList = async () => {
        if (this.state.export_filename == "") {
            Alert.alert("Please input exported file name", "");
            return;
        }
        console.log(TAG, 'exportGuestList dir path =', this.state.file_dir_path, decodeURI(this.state.file_dir_path));
        var filePath = decodeURI(this.state.file_dir_path);
        readDir(filePath)
            .then((res) => {
                var file_exist = false
                for (i = 0; i < res.length; i++) {
                    var filename_part = res[i].name.split('.');
                    var fileType = filename_part[filename_part.length - 1];
                    var fileName = "";
                    for (j = 0; j < filename_part.length - 1; j++) {
                        fileName += filename_part[j];
                    }

                    if (fileName == this.state.export_filename) {
                        file_exist = true;
                        break;
                    } else {
                        file_exist = false;
                    }
                }
                if (file_exist) {
                    Alert.alert("The file name is already used. Please input another name", "");
                    return;
                } else {
                    this.callGetAllGuestListAPI();
                }
            })
            .catch((error) => {
                console.log(TAG, " exportGuestList ", error);
                //Alert.alert(EVENT_GUESTLIST_EXPORT_DIR_ERR, "");
                Alert.alert("Guest list export error\n" + error, "");
            })

    }

    callGetAllGuestListAPI = async () => {
        try {
            this.setState({ loading: true, });
            let uri = Memory().env == "LIVE" ? Global.URL_GUEST_LIST + this.state.eventId : Global.URL_GUEST_LIST_DEV + this.state.eventId;
            let params = {
                "token": this.state.userToken,
                "user_id": this.state.userId,
                "format": "json"
            };
            console.log(TAG + " callGetAllGuestListAPI uri " + uri);
            console.log(TAG + " callGetAllGuestListAPI params " + JSON.stringify(params));
            WebService.callServicePost(uri, params, this.handleGetAllGuestListResponse);
        } catch (error) {
            this.setState({ loading: false, });
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    };
    /**
    * handle get guest list API response
    */
    handleGetAllGuestListResponse = (response, isError) => {
         console.log(TAG + " callGetAllGuestListAPI Response " + JSON.stringify(response));
        console.log(TAG + " callGetAllGuestListAPI isError " + isError);

        if (!isError) {
            var result = response;

            if (typeof result != undefined && result != null) {
                if (typeof result.data != undefined && result.data != null) {
                    if (result.data != null && result.data.length > 0) {
                        // var guest_list = [];
                        // 
                        // for (i = 0; i < result.data.length; i++) {
                        //     guest_list.push({
                        //         "First Name": result.data[i].first_name,
                        //         "Last Name": result.data[i].last_name,
                        //         "Gender": result.data[i].gender.toLowerCase() === "femail" ? "F" : "M",
                        //         
                        //     });
                        //     console.log('lllllll------->>>>>>', result.data[i].gender);
                        // }

                        var guest_list = [];
                        guest_list.push("No, First Name, Last Name, Gender, Email, Comment,")
                        for (i = 0; i < result.data.length; i++) {
                            var lastName = result.data[i].last_name;
                            var firstName = result.data[i].first_name;
                            var comment = "";

                            if(lastName &&  lastName.includes("Invited by"))
                            {
                                var tmpnames = firstName.split(" ");
                                comment = lastName;
                                firstName = tmpnames[0];
                                lastName = tmpnames.length > 1 ? tmpnames[1] : "";
                            }
                            var tmpStr = `${i + 1}, ${firstName}, ${lastName}, ${result.data[i].gender.toLowerCase() === "femail" ? "F" : "M"}, ${result.data[i].email}, ${comment},`;
                            guest_list.push(tmpStr);
                            // console.log('lllllll------->>>>>>', result.data[i].gender);
                        }

                        const filePath = decodeURI(this.state.file_dir_path) + this.state.export_filename + ".csv";

                        RNFS.writeFile(filePath, guest_list.join('\n'), 'utf8')
                          .then((success) => {
                            console.log('FILE WRITTEN!');
                            this.setState({
                                showExportGuestListPopup: false,
                                export_filename: ""
                            })
                            Alert.alert("Guest List export completed", filePath.replace(DocumentDirectoryPath, "").replace("file://", ""));
                          })
                          .catch((err) => {
                            console.log(err.message);
                            Alert.aert(err.message)
                          });

                        // const ws = XLSX.utils.json_to_sheet(guest_list);
                        // const wb = XLSX.utils.book_new();
                        // XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
                        // const wbout = XLSX.write(wb, { type: 'binary', bookType: 'xlsx' });
                        // const file = decodeURI(this.state.file_dir_path) + this.state.export_filename + ".xlsx";
                        // console.log(TAG, 'handleGetAllGuestListResponse path = ', file);
                        // const output = resource => resource;
                        // writeFile(file, output(wbout), 'ascii')
                        //     .then((res) => {
                        //         this.setState({
                        //             showExportGuestListPopup: false,
                        //             export_filename: ""
                        //         })
                        //         Alert.alert("Guest List export completed", file.replace(DocumentDirectoryPath, "").replace("file://", ""));
                        //     })
                        //     .catch((error) => {
                        //         console.log(error)
                        //     })
                    } else {
                        Alert.alert("Guest List is empty", "");
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
    };

    importGuestListPopup = async () => {

        var strToShow = "Make sure you have a csv file with your import data, with the first line listing the import field descriptions. Choose among the following: \n"
        + "First Name, Last Name, Gender, Email, Phone, Birthday, Profile Type, Invited By\n"
        + "First Name / Last Name are mandatory, the rest is optional.";


        await AsyncAlert('', strToShow);

        try {
            const response = await DocumentPicker.pick({
                type: [DocumentPicker.types.allFiles],
            });
            console.log(
                TAG,
                'importGuestListPopup selct res = ', 
                response,
                response[0].uri,
                response[0].type, // mime type
                response[0].name,
                response[0].size
            );
            this.setState({
                import_file: decodeURI( response[0].uri)
            }, () => this.importGuestList())

        } catch (err) {
            if (DocumentPicker.isCancel(err)) {
                // User cancelled the picker, exit any dialogs or menus and move on
            } else {
                throw err;
            }
        }
    }

    select_importfile = (index) => {
        var import_file_list = this.state.import_file_list;
        for (i = 0; i < import_file_list.length; i++) {
            if (i == index) {
                import_file_list[i].selected = true;
                this.setState({
                    import_file: import_file_list[i].filename
                })
            } else {
                import_file_list[i].selected = false;
            }
        }
    }

    importGuestList = async () => {
        if (this.state.import_file == "") {
            Alert.alert("Please select import file", "");
            return;
        }
        var filenameurl_part = this.state.import_file.split('/');
        var file_name = filenameurl_part[filenameurl_part.length - 1];
        var filename_part = file_name.split('.');
        var fileType = filename_part[filename_part.length - 1];
        if (fileType != "csv") {
            Alert.alert("Please select an Excel (.csv) file", "");
            return;
        }
        console.log('selected file path = ', this.state.import_file)
        readFile(this.state.import_file, 'ascii')
            .then((res) => {
                const input = res => res;



                let lines = res.split("\n");
                lines = lines.map(line => line.split(","));
//                 const wb = XLSX.read(input(res), { type: 'binary' });
// 
//                 const wsname = wb.SheetNames[0];
//                 const ws = wb.Sheets[wsname];
//                 const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
                const data = lines;

                console.log('xlsx => ', data);

                //return;

                var guest_list = [];
                var id_index = -1;
                var email_index = -1;
                var phone_index = -1;
                var firstname_index = -1;
                var lastname_index = -1;
                var genderindex = -1;
                for (i = 0; i < data[0].length; i++) {
                    if (data[0][i] == "id") {
                        id_index = i;
                        
                    }

                    if (data[0][i].toLowerCase().trim() == "first name") {
                        firstname_index = i;
                        
                    }

                    if (data[0][i].toLowerCase().trim() == "last name") {
                        lastname_index = i;
                        
                    }

                    if (data[0][i].toLowerCase().trim() == "email") {
                        email_index = i;
                        
                    }

                    if (data[0][i].toLowerCase().trim()  == "phone") {
                        phone_index = i;
                        
                    }
                    if (data[0][i].toLowerCase().trim()  == "gender") {
                        genderindex = i;
                        
                    }
                }

                var strErr = "";
                if(firstname_index == -1)
                {
                    strErr += "'First Name', ";
                }
                if(lastname_index == -1)
                {
                    strErr += "'Last Name', ";
                }
                
                
                if(strErr != "")
                {
                    Alert.alert("Mismatching field name: " + strErr, "");
                    return;
                }

                // guest_list.push({
                //     "First Name": result.data[i].first_name,
                //     "Last Name": result.data[i].last_name,
                //     "Gender": result.data[i].gender,
                //     "Email": result.data[i].email,
                //     "Address": result.data[i].address,
                //     "id": result.data[i].user_id
                // })
                // if (id_index == -1) {
                //     Alert.alert("This imported file has an incorrect data format", "");
                // } else {
                //     for (i = 1; i < data.length; i++) {
                //         guest_list.push({
                //             id: data[i][id_index]
                //             email: id_index
                //         })
                //     }
                //     this.callSendInvitationAPI(guest_list);
                // }

                if(email_index == -1 && phone_index == -1)
                {
                    Alert.alert("This imported file has an incorrect data format", "");
                }else{
                    for(i = 1 ; i < data.length ; i++)
                    {
console.log(data[i]);
                        let tmpEmail = "";
                        let tmpPhone = "";
                        if(email_index > 0)
                            tmpEmail = data[i][email_index]
                        if(phone_index > 0)
                            tmpPhone = data[i][phone_index]

                        console.log(tmpPhone)
                        guest_list.push({
                            email: tmpEmail ? tmpEmail.trim() : "",
                            phone: tmpPhone ? tmpPhone.toFixed().trim() : "",
                            firstname: firstname_index >= 0 ? data[i][firstname_index] : '',
                            lastname: lastname_index >= 0 ? data[i][lastname_index] : '',
                        })
                    }

                    this.callSendInvitationAPI(guest_list);
                }

                

            })
            .catch((error) => {
                console.log(error);
                Alert.alert("Selected file is currupted. Please select another file.", "");
            })
    }

    callSendInvitationAPI = (guest_list) => {
        try {
            this.setState({
                loading: true
            });
            let uri = Memory().env == "LIVE" ? Global.URL_SEND_EVENT_IMPORT : Global.URL_SEND_EVENT_IMPORT_DEV;

            // let params = new FormData();
            // params.append("token", this.state.userToken);
            // params.append("user_id", this.state.userId);
            // params.append("format", "json");
            // params.append("event_id", this.state.eventId);
            // for (var i = 0; i < guest_list.length; i++) {
            //     params.append("data[" + i + "]", "['" + guest_list[i].email + "', '" + guest_list[i].phone +"']");
            // }

            let data = {
                token: this.state.userToken,
                user_id: this.state.userId,
                format: 'json',
                'event_id': this.state.eventId,

            }
            let contacts = []
            for (var i = 0; i < guest_list.length; i++) {
                //params.append("data[" + i + "]", "['" + guest_list[i].email + "', '" + guest_list[i].phone +"']");
                contacts.push(
                    {
                        email: guest_list[i].email, 
                        phone: guest_list[i].phone,  
                        first_name: guest_list[i].firstname,  
                        last_name: guest_list[i].lastname
                    });
            }
            data['data'] = contacts;
            console.log(TAG + " callSendInvitationAPI uri " + uri);
            console.log(TAG + " callSendInvitationAPI params " + JSON.stringify(data));

            WebService.callServicePost(
                uri,
                data,
                this.handleSendInvitationResponse
            );
        } catch (error) {
            console.log(TAG + " callSendInvitationAPI error " + error);
            this.setState({
                loading: false
            });
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    };

    /**
           * handle send invitaiton API response
           */
    handleSendInvitationResponse = (response, isError) => {

        console.log(TAG + "callSendInvitationAPI Response " + JSON.stringify(response));
        console.log(TAG + "callSendInvitationAPI isError " + isError);

        if (!isError) {
            var result = response;
            if (result.status == "success") {
                this.setState({
                    showImportGuestListPopup: false,
                }, () => this.onGuestPress());
                ;
            }
        } else {
            Alert.alert(Constants.NO_INTERNET, "");
        }
        this.setState({
            loading: false
        });
    };


    /**
       * guest event click
       **/
    onGuestPress = () => {
        if (!eventDetailData) {
            return null;
        }
        var event_host_userid = this.state.eventDetailData.info.event_host_userid;
        var ishosted = event_host_userid === this.state.userId;

        this.props.navigation.navigate("GuestList", {
            user_id: this.state.userId,
            token: this.state.userToken,
            eventId: this.state.eventId,
            inviteList: this.state.eventInviteList,
            loadAfterDeletingEvent: this.loadAfterDeletingOrEditingEvent,
            // goToEventScreen: this.getData,
            is_cancelled: this.state.is_cancelled,
            is_past: this.state.is_past,
            ishosted: ishosted,
            eventDetailData: eventDetailData,
            toDate: this.state.toDate
        })
    }

    loadAfterDeletingOrEditingEvent = (isComment) => {
        console.log(TAG, "loadAfterDeletingOrEditingEvent called")
        isRefresh = true
        this.clearStateData();
        this.setState({ loading: true, })
        this.getData(false);
    }

    loadAfterCopyEvent = (isComment) => {
        isRefresh = true;
        const { state } = this.props.navigation;
        setTimeout(() => this.backToScreen(), 100);
    }

    goBackToEventScreen = () => {
        const { state } = this.props.navigation;
        setTimeout(() => this.backToScreen(), 100);
    }

    backToScreen = () => {
        if (this.props.route.params.refreshEventData) {
            this.props.route.params.refreshEventData(4);
        }
        this.props.navigation.goBack();

    }

    refreshListData = (isRefreshed) => {
        console.log(TAG, "refreshListData called")
    }


}


const styles = {
    container: {
        backgroundColor: Colors.black,
        flex: 1,
        width: '100%',
        height: '100%'
    },
    headText: {
        color: Colors.gold,
        fontSize: 20,
    },
    commentTextInput: {
        borderWidth: 0.5,
        borderRadius: 5,
        borderColor: Colors.black,
        marginVertical: 10,
        color: Colors.gray,
        fontSize: 13,
        padding: 5,
        height: 40,

    },
    postTextStyle: {
        paddingTop: 10,
        paddingBottom: 10,
        paddingLeft: 15,
        paddingRight: 15,
        backgroundColor: Colors.gold,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 5,

    },
    blurView: {
        marginTop: 10,
        height: 300,
        backgroundColor: Colors.white,
        opacity: 0.90
    },
    subViewTitle: {
        color: Colors.gold,
        fontSize: 14,
    },
    actionButton: {
        paddingHorizontal: 15,
        paddingVertical: 10,
        alignItems: 'center',
        backgroundColor: Colors.gold,
        borderRadius: 5
    },
    actionButtonText: {
        fontSize: 15,
        color: Colors.white
    }

};
