import React, { Component, Fragment } from "react";
import {
    Alert,
    Platform,
    StyleSheet,
    Text,
    View,
    TextInput,
    TouchableOpacity,
    SafeAreaView,
    Dimensions,
    Image,
    Keyboard,
    KeyboardAvoidingView,
    StatusBar,
    Modal,
    ImageBackground
} from "react-native";
import Icon from "react-native-vector-icons/Feather";
import FastImage from 'react-native-fast-image'
import FitImage from 'react-native-fit-image'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import { Dropdown } from 'react-native-material-dropdown';
import DateTimePicker from "react-native-modal-datetime-picker";
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import Moment from "moment/moment";
import ImagePicker from "react-native-image-picker";
import Geocoder from "react-native-geocoder";
import RNPickerSelect from 'react-native-picker-select';
import moment from 'moment';
import ImageResizer from 'react-native-image-resizer';
import AsyncStorage from '@react-native-community/async-storage';
import * as RNLocalize from "react-native-localize";
import Tooltip from 'react-native-walkthrough-tooltip';
import * as ValidationUtils from "../utils/ValidationUtils";
import { Colors } from "../consts/Colors";
import * as Global from "../consts/Global";
import WebService from "../core/WebService";
import ProgressIndicator from "./ProgressIndicator";
import { Constants } from "../consts/Constants";
import { stylesGlobal, STICKY_HEADER_HEIGHT } from '../consts/StyleSheet'
import CustomPopupView from "../customview/CustomPopupView";
import { ImageCompressor } from './ImageCompressorClass';
import Memory from '../core/Memory'
import { convertEmojimessagetoString, convertStringtoEmojimessage, getUserLocation } from "../utils/Util";
import BannerView from "../customview/BannerView";
import ModalDropdown from "../custom_components/react-native-modal-dropdown/ModalDropdown";
import { isIphoneX, getBottomSpace } from '../custom_components/react-native-iphone-x-helper';
import {Calendar} from 'react-native-calendars';

const { height, width } = Dimensions.get("window");

var TAG = "CreateEventScreen";
var today;
var currentDate;
var eventCategoryList = [];
var isInvited = 0; // 1: save without guest, 2: invite friend, 3: copy guest list
let location = "";
let currentEventData = {};

export default class CreateEventScreen extends React.Component {

    constructor() {
        super();
        var today = new Date();
        currentDate = parseInt(today.getMonth() + 1) + "/" + today.getDate() + "/" + today.getFullYear();
        this.state = {
            loading: true,
            userId: "",
            userToken: "",
            userSlug: "",
            userImagePath: "",
            userImageName: "",
            member_plan: "",
            is_verified: "",

            event_create_type: "",
            eventId: '',
            showModel: false,
            currentDate: currentDate,
            startMinDate: currentDate,
            endMinDate: currentDate,
            valueEventTitle: '',
            valueEventDescription: '',
            valueEventImage: { 'uri': '', type: '', fileName: '' },
            valueLocation: '',
            valueStartDateOfEvent: '',
            dayofStartDate: '',
            // valueEndDateOfEvent: '',
            valueStartTimeOfEvent: '',
            valueEndTimeOfEvent: '',
            valueAvailableSpace: "",
            from_time_zone: '',
            to_time_zone: '',

            eventCategoryList: [],
            selected_event_category: 0,

            past_event: false, // event is past event when edit event
            isFullDay: '0',
            locationInfo: '',
            searchedText: '',
            eventImagePath: '',
            userFirstName: '',
            defaultImage: require("../icons/Background-Placeholder_Camera.png"),

            isDatePickerVisible: false,
            isStartTimePickerVisible: false,
            isEndTimePickerVisible: false,

            notifyChange: false,
            notifyChangeText: "", // used in Notify check text

            category_array: Global.category_array_event_trip,
            selected_category: Global.selected_category, // for visibility

            isDateChanged: false,
            isTimeChanged: false,
            isImageChanged: false,
            isTitleChanged: false,

            searchText: '',
            props_event_title: "", // use when edit, copy event

            showToolTip_availableSpace: false,
            showToolTip_percentage: false,
            valueMalePercent: '',
            valueFemalePercent: '',
            hours_close_guests_list: '',
            hours_rsvp_reminder: '',

            total_confirmed: 0, // for send reminders
            total_non_replied: 0, // for send reminders
            send_reminders_popup_show: false,
            send_reminders_type: "everyone", // send who // everyone or not_replied
            send_reminder_message: "", // message for send reminder,

            hideSomeViews: true,
            showAdvancedSettings: false,
            isShowAdvancingSetting: false,
            is_portrait: true,
            showInitSettingModal: true,
        };
        this.keyboardDidShowListener = null;
    }

    UNSAFE_componentWillMount = async () => {
        await this.getData();


        today = new Date();
        this.setState({
            event_create_type: this.props.route.params.type,
        })
        this.setNotifyChangeText();
        this.getCategoryList();
        getUserLocation(
            position => {
                const { latitude, longitude } = position.coords;

            },
            error => { console.log(error); console.log("-------------------------------------") }
        );

    }

    componentDidMount() {
        this.keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', this._keyboardDidShow.bind(this));
    }

    componentWillUnmount() {
        if (this.keyboardDidShowListener != null) {
            this.keyboardDidShowListener.remove();
        }
    }

    _keyboardDidShow(e) {
        setTimeout(() => {
            // this.autoScroll()
            // this.setState({send_reminders_popup_show: false});
            // this.setState({send_reminders_popup_show: true});
        }, 200);
    }

    setNotifyChangeText = () => {
        if (this.state.category_array[this.state.selected_category].value == 2) { //Invitees
            this.setState({
                notifyChangeText: "Guests"
            });
        } else if (this.state.category_array[this.state.selected_category].value == 3) { // Favorites
            this.setState({
                notifyChangeText: "My Favorites"
            });
        } else if (this.state.category_array[this.state.selected_category].value == 0) { // Member
            this.setState({
                notifyChangeText: "Members"
            });
        } else if (this.state.category_array[this.state.selected_category].value == 5) { // Members\n& Favorites
            this.setState({
                notifyChangeText: "Members and My Favorites"
            });
        } else if (this.state.category_array[this.state.selected_category].value == 1) { // Public
            this.setState({
                notifyChangeText: "Members and Fans"
            });
        }
    }

    getData = async () => {
        try {

            var userId = await AsyncStorage.getItem(Constants.KEY_USER_ID);
            var userToken = await AsyncStorage.getItem(Constants.KEY_USER_TOKEN);
            var userSlug = await AsyncStorage.getItem(Constants.KEY_USER_SLUG);
            var userFirstName = await AsyncStorage.getItem(Constants.KEY_USER_FIRST_NAME);
            var userLastName = await AsyncStorage.getItem(Constants.KEY_USER_LAST_NAME);
            var userImagePath = await AsyncStorage.getItem(Constants.KEY_USER_IMAGE_URL);
            var userImageName = await AsyncStorage.getItem(Constants.KEY_USER_IMAGE_NAME);
            var member_plan = await AsyncStorage.getItem(Constants.KEY_MEMBER_PLAN);
            var is_verified = await AsyncStorage.getItem(Constants.KEY_IS_VERIFIED);
            var male =   await AsyncStorage.getItem(Constants.KEY_EVENT_MALE_PERCENT);
            var female = await AsyncStorage.getItem(Constants.KEY_EVENT_FEMALE_PERCENT);


            console.log('---------> createEventScreen  userId ', userId, userToken, userFirstName, userLastName, male, female);



            this.setState({
                userId: userId,
                userToken: userToken,
                userSlug: userSlug,
                userFirstName: userFirstName,
                userLastName: userLastName,
                userImagePath: userImagePath,
                userImageName: userImageName,
                member_plan: member_plan,
                is_verified: is_verified,
                valueMalePercent: male,
                valueFemalePercent: female,

            });

        } catch (error) {
            // Error retrieving data
            return;
        }
    }

    /**
    * get event category list
    */
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
        WebService.callServicePost(
            uri,
            params,
            this.handlegetCategoryListResponse
        )
    }

    /**
    * handle get event category API response
    */
    handlegetCategoryListResponse = (response, isError) => {
        // console.log(TAG + " callGetCategoryListAPI result " + JSON.stringify(response));
        console.log(TAG + " callGetCategoryListAPI isError " + isError);
        if (!isError) {
            var result = response;
            if (result != undefined && result != null) {
                if (result.data != undefined && result.data != null) {
                    eventCategoryList = [];
                    for (let events = 0; events < result.data.event_category.length; events++) {
                        category_name = result.data.event_category[events].event_category_name;
                        if (category_name.toUpperCase() !== 'Trip'.toUpperCase()) {
                            eventCategoryList.push({
                                'id': result.data.event_category[events].id,
                                'label': category_name,
                                'value': category_name,
                                'defaul_image': result.data.event_category[events].default_image
                            })
                        }
                    }

                    console.log('eventCategoryList', eventCategoryList)
                    this.setState({
                        eventCategoryList: eventCategoryList
                    });

                    if (this.props.route.params.data != null) {
                        this.setData();
                        this.setState({
                            isDateChanged: true,
                            isTimeChanged: true,
                            isImageChanged: true,
                            isTitleChanged: true,
                        })
                    } else {

                        var today = Moment();
                        var tomorrow = today.add(1, 'days');
                        if (new Date().getDay() == 6) {//// if today is Saturday then set next Saturday
                            this.setState({
                                valueStartDateOfEvent: Moment(today.add(7, 'days')).format("MM/DD/YYYY"),
                                dayofStartDate: Moment(today.add(7, 'days')).format("ddd"),
                            })
                        } else {
                            this.setState({
                                valueStartDateOfEvent: Moment(tomorrow).format("MM/DD/YYYY"),
                                dayofStartDate: Moment(tomorrow).format("ddd"),
                            })
                        }
                        this.setState({
                            valueStartTimeOfEvent: '07:00 am',
                            valueEndTimeOfEvent: '00:00 am',
                            loading: false,
                        });
                    }
                }
            }
        } else {
            if (response != undefined && response != null && response.length > 0) {
                Alert.alert(response.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
            this.props.navigation.goBack();
        }
        this.setState({
            loading: false
        });
    }

    /**
     * display event edit data
     */
    setData = () => {

        const data = this.props.route.params.data.info;

        this.setState({
            eventId: data.id
        })

        var selected_event_index = 0;

        if (data.full_day === '1') {
            isChecked = true
        } else {
            isChecked = false
        }

        var type = '';
        if (data.event_image_name != '') {
            type = data.event_image_name.split('.')[1]
        }

        var imageData = {
            'uri': data.event_image_path + data.event_image_name,
            'fileName': data.event_image_name, 'type': type
        }

        for (let events = 0; events < this.state.eventCategoryList.length; events++) {
            if (this.state.eventCategoryList[events].id == data.cat_id) {
                selected_event_index = events;
                this.setState({
                    props_event_title: this.state.eventCategoryList[events].value
                })
                break;
            }
        }

        for (i = 0; i < this.state.category_array.length; i++) {
            if (this.state.category_array[i].value.toString() == data.visibility) {
                this.setState({
                    selected_category: i
                }, () => {
                    this.setNotifyChangeText()
                });
                break;
            }
        }

        if (this.props.route.params.isCopy) {
            if (new Date(Moment(data.from_date)) < new Date()) {
                var date_difference_startDate = new Date(Moment(data.from_date).format("MM/DD/YYYY")).getDay() - new Date().getDay();
                if (date_difference_startDate < 0) {
                    date_difference_startDate = 7 + date_difference_startDate;
                }

                var date_difference_startToend = moment.range(new Date(Moment(data.from_date).format("MM/DD/YYYY")), new Date(Moment(data.to_date).format("MM/DD/YYYY"))).diff('days');

                this.setState({
                    valueStartDateOfEvent: Moment(new Date()).add(date_difference_startDate, 'days').format("MM/DD/YYYY"),
                    dayofStartDate: Moment(new Date()).add(date_difference_startDate, 'days').format("ddd"),
                    endMinDate: Moment(new Date()).add(date_difference_startDate, 'days').format("MM/DD/YYYY"),
                    // valueEndDateOfEvent: Moment(new Date()).add(date_difference_startDate + date_difference_startToend, 'days').format("MM/DD/YYYY"),
                    endMinDate: Moment(new Date()).add(date_difference_startDate + date_difference_startToend, 'days').format("MM/DD/YYYY"),
                })
            } else {
                this.setState({
                    valueStartDateOfEvent: Moment(data.from_date).format("MM/DD/YYYY"),
                    dayofStartDate: Moment(data.from_date).format("ddd"),
                    // valueEndDateOfEvent: Moment(data.to_date).format("MM/DD/YYYY"),
                    endMinDate: Moment(data.from_date).format("MM/DD/YYYY"),
                })
            }

        } else {
            if (new Date(Moment(data.from_date)) < new Date()) {
                this.setState({
                    past_event: true,
                })
            } else {
                this.setState({
                    past_event: false,
                })
            }
            this.setState({
                valueStartDateOfEvent: Moment(data.from_date).format("MM/DD/YYYY"),
                dayofStartDate: Moment(data.from_date).format("ddd"),
                // valueEndDateOfEvent: Moment(data.to_date).format("MM/DD/YYYY"),
                endMinDate: Moment(data.from_date).format("MM/DD/YYYY"),
            })
        }

        if (data.m_f_ratio != null && data.m_f_ratio != "") {

            this.setState({
                valueMalePercent: (parseFloat(data.m_f_ratio) * 100).toString(),
                valueFemalePercent: (100 - parseFloat(data.m_f_ratio) * 100).toString()
            })
        }
        if (data.reminder_hrs != null && data.reminder_hrs != "") {
            this.setState({
                hours_rsvp_reminder: data.reminder_hrs
            })
        }
        if (data.guest_list_close_hrs != null && data.guest_list_close_hrs != "") {
            this.setState({
                hours_close_guests_list: data.guest_list_close_hrs
            })
        }

        if (data.total_confirmed != null && data.total_confirmed != "") {
            this.setState({
                total_confirmed: data.total_confirmed
            })
        }
        if (data.total_non_replied != null && data.total_non_replied != "") {
            this.setState({
                total_non_replied: data.total_non_replied
            })
        }

        this.setState({
            valueEventTitle: convertStringtoEmojimessage(data.title),
            valueEventDescription: convertStringtoEmojimessage(data.description),
            searchedText: data.venue_address,
            isFullDay: data.full_day,
            valueStartTimeOfEvent: data.from_time,
            valueEndTimeOfEvent: data.to_time,
            from_time_zone: data.from_time_am_pm,
            to_time_zone: data.to_time_am_pm,
            selected_event_category: selected_event_index,
            valueEventImage: imageData,
            isStartDateSelect: true,
            loading: false,
            eventImagePath: data.event_image_path + data.event_image_name
        })
        this.refs.ref_GooglePlacesAutocomplete.setAddressText(data.venue_address);
        if (data.available_spaces == null || data.available_spaces.toString() == "0") {
            this.setState({
                valueAvailableSpace: ""
            })
        } else {
            this.setState({
                valueAvailableSpace: data.available_spaces
            })
        }
        this.onGeoCodeSearchFunc(data.venue_address)
    }

    /**
    * save event data to server
    */
    saveEventDetail = async () => {


        if (this.state.selected_event_category == -1) {
            Alert.alert("Warning!", "Please select category.");
            return;
        }
        let title = this.state.valueEventTitle.trim();
        let fromDate = this.state.valueStartDateOfEvent.trim();
        // let toDate = this.state.valueEndDateOfEvent.trim();
        let venueAddress = this.state.searchedText.trim();
        let description = this.state.valueEventDescription.trim();
        let fromTime = this.state.valueStartTimeOfEvent.trim();
        let toTime = this.state.valueEndTimeOfEvent.trim();
        if (ValidationUtils.isEmptyOrNull(venueAddress)) {
            venueAddress = location;
        }
        if (ValidationUtils.isEmptyOrNull(title)) {
            Alert.alert(Constants.EMPTY_EVENT_TITLE);
            return;
        }
        if (ValidationUtils.isEmptyOrNull(fromDate)) {
            Alert.alert(Constants.EMPTY_EVENT_START_DATE);
            return;
        }

        if (ValidationUtils.isEmptyOrNull(venueAddress)) {
            Alert.alert(Constants.EMPTY_EVENT_LOCATION);
            return;
        }
        if (ValidationUtils.isEmptyOrNull(description)) {
            Alert.alert(Constants.EMPTY_EVENT_DESCRIPTION);
            return;
        }
        if (ValidationUtils.isEmptyOrNull(fromTime)) {
            Alert.alert(Constants.EMPTY_EVENT_START_TIME);
            return;
        }
        if (ValidationUtils.isEmptyOrNull(toTime)) {
            Alert.alert(Constants.EMPTY_EVENT_END_TIME);
            return;
        }
        if (this.state.valueMalePercent != "" && this.state.valueFemalePercent != "" && (parseInt(this.state.valueMalePercent, 10) > 100 || parseInt(this.state.valueFemalePercent, 10) > 100)) {
            Alert.alert(Constants.INVALIDE_RSVP_PERCENTAGE);
            return;
        }

        // let from1 = Moment(fromDate).format("YYYY-MM-DD");
        // let from2 = Moment(toDate).format("YYYY-MM-DD");
        // let from1 = Moment(fromDate).format();
        // let from2 = Moment(toDate).format();
        // if (from1 > from2) {
        //     Alert.alert(Constants.EMPTY_EVENT_END_DATE_SMALL);
        //     return;
        // }

        if (ValidationUtils.isEmptyOrNull(this.state.valueEventImage.uri)) {
            Alert.alert(Constants.EMPTY_EVENT_IMAGE);
            return;
        }
        try {
            this.setState({ loading: true });


            //save preset MF percentage
            if(this.state.valueMalePercent)
            {
                 await AsyncStorage.setItem(Constants.KEY_EVENT_MALE_PERCENT, this.state.valueMalePercent);
            }
            if(this.state.valueFemalePercent)
            {
                await AsyncStorage.setItem(Constants.KEY_EVENT_FEMALE_PERCENT, this.state.valueFemalePercent);
            }
            
           
            //console.log('hhhhhhhhhh');
            //return;


            if (this.state.locationInfo != null && this.state.locationInfo[0]) {
                this.nextStep();
            } else {                
                WebService.getPlaceDetails( venueAddress, this.handlePlaceDetailResponse );
            }
        } catch (error) {
            console.log(TAG, " saveEventDetail locationInfo error " + error)
            this.setState({
                loading: false
            });
        }
    }

    handlePlaceDetailResponse = (response, isError) => {
        console.log(TAG + " PlaceDetail detail==>" + JSON.stringify(response))
        console.log(TAG + " PlaceDetail detail isError " + isError);
        if (!isError) {
            var result = response;
            if (typeof result != "undefined" && result != null) {
                this.setState({ locationInfo: result })
                this.nextStep();
            } else {
                this.nextStep();
            }
        } else {
            if (response != undefined && response != null && response.length > 0) {
                Alert.alert(response.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
            this.setState({
                loading: false
            });
        }

    }

    nextStep = () => {
        if (ValidationUtils.isEmptyOrNull(this.state.valueEventImage.uri)) {
            if (this.state.eventId !== '') {
                this.callCreateEventAPI(true);
            } else {
                this.callCreateEventAPI(false);
            }
        } else {
            this.callUploadEventImageAPI();
        }
    }

    /**
     * call upload Event image API
     */
    callUploadEventImageAPI = async (isInvite, isEdit) => {
        try {

            this.setState({
                loading: true
            });

            let uri = Memory().env == "LIVE" ? Global.URL_UPLOAD_EVENT_IMAGE : Global.URL_UPLOAD_EVENT_IMAGE_DEV
            let params = new FormData();

            params.append("format", "json");
            params.append("user_id", this.state.userId);
            params.append("token", this.state.userToken);
            if (this.state.valueEventImage.uri != null) {
                params.append('event_image', {
                    uri: this.state.valueEventImage.uri,
                    type: 'image/jpeg',
                    name: 'testPhotoName.jpg'
                });
            }
            console.log(TAG + " callUploadEventImageAPI uri " + uri, Memory().env);
            console.log(TAG + " callUploadEventImageAPI params " + JSON.stringify(params));

            WebService.callServicePostWithFormData(
                uri,
                params,
                this.handleUploadEventImageResponse
            );

        } catch (error) {
            isInvited = 0;
            this.setState({
                loading: false
            });
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    };

    /**
    * handle event image upload API response
    */
    handleUploadEventImageResponse = (response, isError) => {
        console.log(TAG + " callUploadEventImageAPI result " + JSON.stringify(response));
        console.log(TAG + " callUploadEventImageAPI isError " + isError);

        if (!isError) {
            var result = response;

            if (result != undefined && result != null) {

                if (result.filePath != undefined && result.filePath != null) {
                    this.setState({
                        eventImagePath: result.filePath
                    });
                }
                if (this.state.eventId !== '') {
                    this.callCreateEventAPI(true);
                } else {
                    this.callCreateEventAPI(false);
                }

            } else {
                isInvited = 0;

                this.setState({
                    loading: false
                });
            }
        } else {
            isInvited = 0;
            if (response != undefined && response != null && response.length > 0) {
                Alert.alert(response.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }

            this.setState({
                loading: false
            });
        }
    };


    /**
     * call create Event API
     */
    callCreateEventAPI = async (isEdit) => {
        try {
            this.setState({ loading: true });
            var uri = "";
            if (isEdit && !this.props.route.params.isCopy) {
                uri = Memory().env == "LIVE" ? Global.URL_EDIT_EVENT + this.state.eventId : Global.URL_EDIT_EVENT_DEV + this.state.eventId;
            } else {
                uri = Memory().env == "LIVE" ? Global.URL_CREATE_EVENT : Global.URL_CREATE_EVENT_DEV;
            }

            let latitude = "";
            let longitude = "";
            let country_code = "";
            let country = "";
            let state_code = "";
            let state = "";
            let city = "";
            let postal_code = "";

            try {
                if (this.state.locationInfo != null && this.state.locationInfo[0]) {
                    latitude = this.state.locationInfo[0].position.lat;
                    longitude = this.state.locationInfo[0].position.lng;
                    country_code = this.state.locationInfo[0].countryCode;
                    country = this.state.locationInfo[0].country;
                    state_code = this.state.locationInfo[0].adminArea;
                    state = this.state.locationInfo[0].adminArea;
                    city = this.state.locationInfo[0].locality;
                    postal_code = this.state.locationInfo[0].postalCode;
                }
            } catch (error) {
                console.log(TAG, " callScheduleAPI locationInfo error " + error)
            };


            let tmpToDate = this.state.valueStartDateOfEvent;
            const beginTime = moment(this.state.valueStartTimeOfEvent, "hh:mm a");
            const endTime = moment(this.state.valueEndTimeOfEvent, "hh:mm a");
            if(endTime.isBefore(beginTime))
            {
                tmpToDate = moment(this.state.valueStartDateOfEvent, "MM/DD/YYYY").add(1, 'days').format("MM/DD/YYYY");
            }



            let params = {
                "format": "json",
                "user_id": this.state.userId,
                "token": this.state.userToken,
                "from_time": this.state.valueStartTimeOfEvent,
                "to_time": this.state.valueEndTimeOfEvent,
                "time_zone": RNLocalize.getTimeZone(),
                "from_date": this.state.valueStartDateOfEvent,
                "to_date": tmpToDate,
                "street_number_map": "",
                "route_map": "",
                "postal_code": postal_code,
                "venue_address": location,
                "country_code": country_code,
                "country": country,
                "state_code": state_code,
                "state": state,
                "city": city,
                "visibility": this.state.category_array[this.state.selected_category].value,
                "full_day": this.state.isFullDay,
                "title": convertEmojimessagetoString(this.state.valueEventTitle.trim()),
                "description": convertEmojimessagetoString(this.state.valueEventDescription.trim()),
                "is_post": "true",
                "event_image_path": this.state.eventImagePath,
                "available_spaces": this.state.valueAvailableSpace,
                "m_f_ratio": this.state.valueMalePercent,
                "reminder_hrs": this.state.hours_rsvp_reminder,
                "guest_list_close_hrs": this.state.hours_close_guests_list,

                "event_category": this.state.eventCategoryList[this.state.selected_event_category].id,
                "notify_invitees": 0,
                "notified_all": 0,
            };

            if (this.state.notifyChange) {
                params.notify_invitees = 1;
                params.notified_all = 1;
            }
            // if ((this.state.category_array[this.state.selected_category].value == 2) || this.state.past_event) {
            //     params.append('notify_invitees', 0);
            //     params.append('notified_all', 0);
            // } else {
            //     if (this.state.notifyChange) {
            //         params.append('notify_invitees', 1);
            //         params.append('notified_all', 1);
            //     } else {
            //         params.append('notify_invitees', 0);
            //         params.append('notified_all', 0);
            //     }
            // }
            console.log(TAG, "isInvited ", isInvited, " callCreateEventAPI uri " + uri);
            console.log(TAG + " callCreateEventAPI params " + JSON.stringify(params));

            currentEventData = {...params};

            if (isInvited == 2) {
                WebService.callServicePost( uri, params, this.handleCreateEventResponseWithInvitee );
            } else if (isInvited == 1) {
                WebService.callServicePost( uri, params, this.handleCreateEventResponseWithoutInvitee );
            } else if (isInvited == 3) {
                WebService.callServicePost( uri, params, this.handleCreateEventResponseWithCopy );
            }
        } catch (error) {
            console.log("create event error " + error);
            isInvited = 0;
            this.setState({
                loading: false
            });
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    };

    /**
    * handle event create without invitee API response
    */
    handleCreateEventResponseWithoutInvitee = (response, isError) => {
        console.log(TAG + " callCreateEventAPI result " + JSON.stringify(response));
        console.log(TAG + " callCreateEventAPI isError " + isError);
        isInvited = 0;
        if (!isError) {
            var result = response;
            if (result != undefined && result != null) {
                this.goToEventScreen();
            }
        } else {
            //Alert.alert(Constants.NO_INTERNET, "");
            if (response != undefined && response != null && response.length > 0) {
                Alert.alert(response.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
        this.setState({
            loading: false
        });
    };

    callEventDetailAPI = async (eventId) => {
        try {
            this.setState({
                loading: true,
                commentLoading: false,
                selected_eventId: eventId,
            });
            let uri = Memory().env == "LIVE" ? Global.URL_EVENT_DETAIL + eventId : Global.URL_EVENT_DETAIL_DEV + eventId
            let params = new FormData();
            params.append("token", this.state.userToken);
            params.append("user_id", this.state.userId);
            params.append("format", "json");
            params.append("data", "");
            console.log(TAG + " callEventDetailAPI uri " + uri);
            console.log(TAG + " callEventDetailAPI params " + JSON.stringify(params));
            WebService.callServicePost(uri, params, this.handleEventDetailResponse);
        } catch (error) {
            this.setState({ loading: false, commentLoading: false });
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    };

    handleEventDetailResponse = (response, isError) => {
        // console.log(TAG + " callEventDetailAPI Response " + JSON.stringify(response));
        console.log(TAG + " callEventDetailAPI isError " + isError);
        if (!isError) {
            var result = response;
            if (result != undefined && result != null) {
                if (result.data != undefined && result.data != null) {
                    eventDetailData = result.data;
                    this.props.navigation.navigate("GuestList", {
                        user_id: this.state.userId,
                        token: this.state.userToken,
                        eventId: this.state.selected_eventId,
                        inviteList: eventDetailData.invite,
                        loadAfterDeletingEvent: this.props.loadAfterDeletingOrEditingEvent,
                        ishosted: true,
                        eventDetailData: eventDetailData,
                    })
                }
            }
        } else {
            if (response != undefined && response != null && response.length > 0) {
                Alert.alert(response.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
        this.setState({
            loading: false,
            commentLoading: false
        });
    };


    /**  
    * handle event create with invitee API response
    */
    handleCreateEventResponseWithInvitee = async (response, isError) => {
        isInvited = 0;
        console.log(TAG + " callCreateEventAPI with invitee result " + JSON.stringify(response));
        console.log(TAG + " callCreateEventAPI with invitee isError " + isError);

        if (!isError) {
            var result = response;
            if (result != undefined && result != null) {
                var inviteList = [];
                if (this.props.route.params.data) {
                    inviteList = this.props.route.params.data.invite
                }

                

                if(this.state.eventId !== '') // is editing
                {
                    if(this.props.route.params.updateHostEvent)
                        await this.props.route.params.updateHostEvent();
                    setTimeout(() => this.props.navigation.goBack(), 100);

                    return;
                }
                if (!result.event_id) {
                    // this.props.navigation.navigate("InviteFriend", {
                    //     hostId: this.state.userId,
                    //     eventId: this.state.eventId,
                    //     goToEventScreen: this.goToEventScreen,
                    //     eventName: this.state.valueEventTitle,
                    //     inviteList: inviteList,
                    //     fullInvite: this.props.route.params.data ? true : false
                    // });

                    this.callEventDetailAPI(this.state.userId);

                    // this.props.navigation.navigate("GuestList", {
                    //     user_id: this.state.userId,
                    //     token: this.state.userToken,
                    //     eventId: this.state.eventId,
                    //     inviteList: inviteList,
                    //     // loadAfterDeletingEvent: this.props.loadAfterDeletingOrEditingEvent,
                    //     ishosted: true,
                    //     eventDetailData: currentEventData,
                    // });
                } else {
                    // this.props.navigation.navigate("InviteFriend", {
                    //     hostId: this.state.userId,
                    //     eventId: result.event_id,
                    //     goToEventScreen: this.goToEventScreen,
                    //     eventName: this.state.valueEventTitle,
                    //     inviteList: inviteList,
                    //     fullInvite: this.props.route.params.data ? true : false
                    // });

                    this.callEventDetailAPI(result.event_id);

                    // if(this.props.route.params.updateHostEvent)
                    //     await this.props.route.params.updateHostEvent();
                    // setTimeout(() => this.props.navigation.goBack(), 100);

                    // this.props.navigation.navigate("GuestList", {
                    //     user_id: result.event_id,
                    //     token: this.state.userToken,
                    //     eventId: result.event_id,
                    //     inviteList: inviteList,
                    //     // loadAfterDeletingEvent: this.props.loadAfterDeletingOrEditingEvent,
                    //     ishosted: true,
                    //     eventDetailData: currentEventData,
                    // });
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

    /**   COPY
    * handle event create with invitee API response
    */
    handleCreateEventResponseWithCopy = (response, isError) => {
        isInvited = 0;
        // console.log(TAG + " callCreateEventAPI result " + JSON.stringify(response));
        console.log(TAG + " callCreateEventAPI isError " + isError);

        if (!isError) {
            var result = response;
            if (result != undefined && result != null) {
                var inviteList = [];
                if (this.props.route.params.data) {
                    inviteList = this.props.route.params.data.invite
                }
                if (inviteList != null && inviteList.length > 0) {
                    if (!result.event_id) {
                        this.props.navigation.navigate("InviteFriend", {
                            hostId: this.state.userId,
                            eventId: this.state.eventId,
                            goToEventScreen: this.goToEventScreen,
                            eventName: this.state.valueEventTitle,
                            inviteList: inviteList,
                            isCopy: true
                        })
                    } else {
                        this.props.navigation.navigate("InviteFriend", {
                            hostId: this.state.userId,
                            eventId: result.event_id,
                            goToEventScreen: this.goToEventScreen,
                            eventName: this.state.valueEventTitle,
                            inviteList: inviteList,
                            isCopy: true
                        })
                    }
                } else {
                    this.goToEventScreen();
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

    /**
    * handle back to event list screen
    */
    goToEventScreen = async () => {
        if(this.props.route.params.updateHostEvent)
            await this.props.route.params.updateHostEvent();
        setTimeout(() => this.props.navigation.goBack(), 100);
    }

    handleDatePicked = date => {

        console.log(date)
        if (Moment(date).format("MM/DD/YYYY") != this.state.valueStartDateOfEvent) {
            this.setState({
                isDateChanged: true,
                valueStartDateOfEvent: Moment(date).format("MM/DD/YYYY"),
                dayofStartDate: Moment(date).format("ddd"),
                endMinDate: Moment(date).format("MM/DD/YYYY")
            })
            if (new Date(date) < new Date()) {
                this.setState({
                    notifyChange: false,
                    past_event: true
                });
            } else {
                this.setState({
                    past_event: false
                })
                if (this.state.event_create_type == "edit_event") {
                    if (this.state.category_array[this.state.selected_category].value != 2) {
                        this.setState({
                            notifyChange: true
                        })
                    }
                }
            }

        }
        this.setState({
            isDatePickerVisible: false,
        })
    }

    handleStartTimePicked = time => {
        if (Moment(time).format("hh:mm a") != this.state.valueStartTimeOfEvent) {
            this.setState({
                valueStartTimeOfEvent: Moment(time).format("hh:mm a"),
                isTimeChanged: true,
            })
            if (this.state.event_create_type == "edit_event" && !this.state.past_event) {
                if (this.state.category_array[this.state.selected_category].value != 2) {
                    this.setState({
                        notifyChange: true
                    })
                }
            }
        } else {

        }
        this.setState({
            isStartTimePickerVisible: false,
        })
    }

    handleEndTimePicked = time => {
        if (Moment(time).format("hh:mm a") != this.state.valueEndTimeOfEvent) {
            this.setState({
                isEndTimePickerVisible: false,
                valueEndTimeOfEvent: Moment(time).format("hh:mm a"),
                isTimeChanged: true,
            })
            if (this.state.event_create_type == "edit_event" && !this.state.past_event) {
                if (this.state.category_array[this.state.selected_category].value != 2) {
                    this.setState({
                        notifyChange: true
                    })
                }
            }
        } else {
            this.setState({
                isEndTimePickerVisible: false,
            })
        }
    }

    render() {
        return (
            <Fragment>
                {this.state.eventId === '' && this.state.showInitSettingModal && this.state.eventCategoryList.length > 0 && this.renderInitSettingModalViews()}
                <SafeAreaView style={{ backgroundColor: Colors.black, flex: 0 }} />
                {this.renderPopupView()}
                {this.renderCalender()}
                <View style={{ width: '100%', height: '100%', backgroundColor: 'white' }}>
                    {/* <DateTimePicker */}
                    {/*     isVisible={this.state.isDatePickerVisible} */}
                    {/*     onConfirm={this.handleDatePicked} */}
                    {/*     onCancel={() => this.setState({ isDatePickerVisible: false })} */}
                    {/*     date={this.state.valueStartDateOfEvent == "" ? new Date() : new Date(this.state.valueStartDateOfEvent)} */}
                    {/*     minimumDate={(this.props.route.params.data != null) ? null : new Date()} */}
                    {/*     mode={"date"} */}
                    {/* /> */}
                    <DateTimePicker
                        isVisible={this.state.isStartTimePickerVisible}
                        titleIOS={'Picka a time'}
                        onConfirm={this.handleStartTimePicked}
                        onCancel={() => this.setState({ isStartTimePickerVisible: false })}
                        date={this.state.valueStartTimeOfEvent == "" ? new Date() : new Date(Moment(new Date()).format('MM/DD/YYYY') + " " + this.state.valueStartTimeOfEvent)}
                        is24Hour={false}
                        mode={"time"}
                    />
                    <DateTimePicker
                        isVisible={this.state.isEndTimePickerVisible}
                        titleIOS={'Picka a time'}
                        onConfirm={this.handleEndTimePicked}
                        onCancel={() => this.setState({ isEndTimePickerVisible: false })}
                        date={this.state.valueEndTimeOfEvent == "" ? new Date() : new Date(Moment(new Date()).format('MM/DD/YYYY') + " " + this.state.valueEndTimeOfEvent)}
                        is24Hour={false}
                        mode={"time"}
                    />
                    {this.renderHeaderView()}
                    {this.renderBannerView()}
                    {this.renderEventForm()}
                    {this.state.send_reminders_popup_show && this.renderSendRemindersView()}
                    {this.state.loading == true && <ProgressIndicator />}
                </View>
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

    hidePopupView = () => {
        this.setState({
            showModel: false
        })
    }

    logoutUser = async () => {
        this.hidePopupView();
        try {
            await AsyncStorage.setItem(Constants.KEY_USER_ID, "");
            await AsyncStorage.setItem(Constants.KEY_USER_TOKEN, "");

            this.props.navigation.navigate("SignInScreen", { isGettingData: false });
        } catch (error) {
            console.log(TAG + " logoutUser error " + error);
        }
    }

    handleEditCompleteSearchText = () => {
        searchText = this.state.searchText.trim();
        this.setState({
            searchText: searchText,
        });
        if (searchText.length > 0) {
            this.props.navigation.navigate('Dashboard', { selected_screen: "members", search_text: searchText });
        }
    };

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
    * display top header
    */
    renderHeaderView = () => {
        const { navigate } = this.props.navigation;
        const { state } = this.props.navigation;
        let imageUrl = this.state.userImagePath + Constants.THUMB_FOLDER + this.state.userImageName;
        return (
            <View style={stylesGlobal.headerView}>
                <TouchableOpacity style={stylesGlobal.header_backbuttonview_style} onPress={() => this.props.navigation.goBack()}>
                    <Image style={stylesGlobal.header_backbuttonicon_style} source={require("../icons/icon_back.png")} />
                </TouchableOpacity>
                <TouchableOpacity style={stylesGlobal.header_logoview_style} onPress={() => this.props.navigation.navigate('Dashboard', { logoclick: true })}>
                    <Image style={stylesGlobal.header_logo_style} source={require("../icons/logo_new.png")} />
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
                        onSubmitEditing={this.handleEditCompleteSearchText}
                        keyboardType='ascii-capable'
                        placeholder="Search members..."
                    />
                    <TouchableOpacity style={stylesGlobal.header_searchiconview_style} onPress={() => {
                        if (this.state.searchText == "") {
                            this.refs.searchTextInput.focus();
                        } else {
                            this.setState({
                                searchText: ""
                            })
                            Keyboard.dismiss();
                        }
                    }}
                    >
                        {
                            this.state.searchText != "" &&
                            <Image style={stylesGlobal.header_searchicon_style} source={require("../icons/connection-delete.png")} />
                        }
                        {
                            this.state.searchText == "" &&
                            <Image style={stylesGlobal.header_searchicon_style} source={require("../icons/dashboard_search.png")} />
                        }
                    </TouchableOpacity>
                </View>
                <TouchableOpacity style={stylesGlobal.header_avatarview_style} onPress={() => this.setState({ showModel: true })}>
                    <View style={stylesGlobal.header_avatarsubview_style}>
                        <ImageCompressor style={stylesGlobal.header_avatar_style} uri={imageUrl} />
                    </View>
                </TouchableOpacity>

            </View>

        );
    };

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

    renderCalender = () => {
        return (
            <Modal
                animationType="fade"
                transparent={true}
                // closeOnClick={true}
                visible={this.state.isDatePickerVisible}
                onRequestClose={() => this.setState({ isDatePickerVisible: false })}
                supportedOrientations={['portrait', 'landscape']}
            >
                <KeyboardAvoidingView style={{ flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center'}} contentContainerStyle={{ flex: 1 }} behavior={Platform.OS == "ios" ? "padding" : null} keyboardVerticalOffset={isIphoneX() ? getBottomSpace() + 15 : 18} enabled>
                    <View style={stylesGlobal.popup_bg_blur_view}></View>
                    <View style={stylesGlobal.popup_main_container}>
                        <View style={stylesGlobal.popup_title_view}>
                            <Text style={[stylesGlobal.popup_title_text, stylesGlobal.font]}>{"Select Date"}</Text>
                            <TouchableOpacity style={stylesGlobal.popup_cancel_button} onPress={() => this.setState({ isDatePickerVisible: false })}>
                                <Image style={stylesGlobal.cancel_delete_image} source={require('../icons/connection-delete.png')} />
                            </TouchableOpacity>
                        </View>
                        <View style={stylesGlobal.popup_desc_container}>
                           
                            <View style={{width: '100%'}}>
                                <Calendar 
                                     initialDate={this.state.valueStartDateOfEvent == "" ? new Date() : new Date(this.state.valueStartDateOfEvent)} 
                                    // initialDate={'2023-03-30'}
                                    // minDate={(this.props.route.params.data != null) ? null : new Date() }
                                    
                                    onDayPress={day => { this.setState({ isDatePickerVisible: false }, () => {this.handleDatePicked(day.dateString) });}}
                                    monthFormat={'yyyy MM'}
                                    
                                    // disableArrowLeft={disableLeftArrow}
                                    // disableArrowRight={disableRightArrow}
                                    enableSwipeMonths={true}
                                />
                            </View>
                        </View>
                    </View>
                </KeyboardAvoidingView>
                
                
            </Modal>
            )
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

    renderAdvancingSetting = () => {
        return (
            <View style={{ width: '100%', marginBottom: 10, borderBottomLeftRadius: 15, borderBottomRightRadius: 15, zIndex: 10, overflow: 'hidden' }}>
                {/* <View style={[styles.headView, { }]}> */}
                {/*      */}
                {/*      */}
                {/* </View> */}


                <View style={styles.headView}>
                    <View style={{ flexDirection: 'row', marginBottom: 10 }}>
                        <Text style={[{ color: 'red' }, stylesGlobal.font]}>*</Text>
                        <Text style={[styles.headingText, stylesGlobal.font_bold]}>{"Category"}</Text>
                    </View>
                    <RNPickerSelect
                        items={this.state.eventCategoryList}
                        style={{ ...pickerSelectStyles, placeholder: stylesGlobal.font }}
                        useNativeAndroidPickerStyle={false}
                        placeholder={{
                            label: 'Select a category...',
                            value: null,
                        }}
                        value={this.state.props_event_title}
                        onValueChange={(value, index) => {
                            this.onChangeTextCategory(value, index)
                        }}
                    />
                </View>

                <View style={[styles.headView]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5 }}>
                        <Text style={[styles.headingText, stylesGlobal.font_bold]}>{"Availables spaces"}</Text>
                        <Tooltip
                            isVisible={this.state.showToolTip_availableSpace}
                            content={
                                <View style={{ paddingVertical: 15, paddingHorizontal: 15, backgroundColor: Colors.tooltip_background }}>
                                    <Text style={[{ fontSize: 13, color: Colors.black }, stylesGlobal.font]}>{Constants.EVENT_AVAILABLE_SPACES_TOOLTIP}</Text>
                                </View>
                            }
                            onClose={() => this.setState({ showToolTip_availableSpace: false })}
                            placement="top"
                            backgroundColor={'rgba(0,0,0,0.2)'}
                            topAdjustment={Platform.OS === 'android' ? -StatusBar.currentHeight : 0}
                            arrowSize={{ width: 0, height: 0 }}
                        >
                            <TouchableOpacity
                                style={{ width: 20, height: 20, marginHorizontal: 5 }}
                                onPress={() => this.setState({ showToolTip_availableSpace: true })}
                            >
                                <Image style={{ width: '100%', height: '100%', resizeMode: 'contain' }} source={require('../icons/tooltip.png')} />
                            </TouchableOpacity>
                        </Tooltip>
                        <Text style={[{ fontSize: 13, color: Colors.black }, , stylesGlobal.font]}>{"(optional)"}</Text>
                    </View>
                    <View style={{ width: '100%', flexDirection: 'row', alignItems: 'center' }}>
                        <TextInput
                            ref='valueAvailableSpace'
                            multiline={false}
                            returnKeyType='done'
                            numberOfLines={1}
                            underlineColorAndroid="transparent"
                            autoCapitalize='sentences'
                            onChangeText={value => {
                                this.setState({ valueAvailableSpace: value })
                            }}
                            value={this.state.valueAvailableSpace}
                            style={[styles.textInputText, stylesGlobal.font, { width: '100%' }]}
                            onSubmitEditing={(event) => {
                                //this.refs.valueLastName.focus();
                            }}
                            keyboardType={'number-pad'}
                        />
                    </View>
                    <Text style={[{ fontSize: 13, color: Colors.black }, stylesGlobal.font]}>{"leave blank if no limit"}</Text>
                </View>

                <View style={[styles.headView, { width: '100%' }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginBottom: 5 }}>
                        <Text style={[styles.headingText, stylesGlobal.font_bold]}>{"Male to Female RSVP Percentage"}</Text>
                        <Tooltip
                            isVisible={this.state.showToolTip_percentage}
                            content={
                                <View style={{ paddingVertical: 15, paddingHorizontal: 15, backgroundColor: Colors.tooltip_background }}>
                                    <Text style={[{ fontSize: 13, color: Colors.black }, stylesGlobal.font]}>{Constants.EVENT_RSVP_PERCENTAGE_TOOLTIP}</Text>
                                </View>
                            }
                            onClose={() => this.setState({ showToolTip_percentage: false })}
                            placement="top"
                            backgroundColor={'rgba(0,0,0,0.2)'}
                            topAdjustment={Platform.OS === 'android' ? -StatusBar.currentHeight : 0}
                            arrowSize={{ width: 0, height: 0 }}
                        >
                            <TouchableOpacity
                                style={{ width: 20, height: 20, marginHorizontal: 5 }}
                                onPress={() => this.setState({ showToolTip_percentage: true })}
                            >
                                <Image style={{ width: '100%', height: '100%', resizeMode: 'contain' }} source={require('../icons/tooltip.png')} />
                            </TouchableOpacity>
                        </Tooltip>
                        <Text style={[{ fontSize: 13, color: Colors.black }, stylesGlobal.font]}>{"(optional)"}</Text>
                    </View>
                    <View style={{ width: '100%', flexDirection: 'row', alignItems: 'center', marginTop: 5 }}>
                        <View style={{ width: '50%', flexDirection: 'row', alignItems: 'center' }}>
                            <View style={{ width: 80, flexDirection: 'row', borderWidth: 1, borderColor: Colors.black, borderRadius: 5, alignItems: 'center' }}>
                                <TextInput
                                    // ref='valueAvailableSpace'
                                    multiline={false}
                                    returnKeyType='done'
                                    numberOfLines={1}
                                    underlineColorAndroid="transparent"
                                    autoCapitalize='sentences'
                                    onChangeText={value => {
                                        if (value.match(/^[0-9]+$/) != null) {
                                            //this.setState({ valueMalePercent: value })
                                            var valueMalePercent = parseInt(value, 10);
                                            if (valueMalePercent > 100) {
                                                this.setState({ valueFemalePercent: '0', valueMalePercent: '100'  });
                                                
                                            } else {
                                                this.setState({ valueMalePercent: valueMalePercent.toFixed(), valueFemalePercent: (100 - valueMalePercent).toString()  })
                                               
                                            }
                                        } else if(value == "" || value == null || value == undefined) {
                                            this.setState({valueMalePercent: ''})
                                          
                                        }
                                    }}
                                    value={this.state.valueMalePercent}
                                    style={[styles.textInputText, stylesGlobal.font, { flex: 1, borderWidth: 0 }]}
                                    onSubmitEditing={(event) => {
                                        //this.refs.valueLastName.focus();
                                    }}
                                    keyboardType={'number-pad'}
                                />
                                <Text style={[{ fontSize: 14, color: Colors.black, marginHorizontal: 10 }, stylesGlobal.font]}>{"%"}</Text>
                            </View>
                            <Text style={[{ fontSize: 14, color: Colors.black, marginStart: 10, marginEnd: 30 }, stylesGlobal.font]}>{"Male"}</Text>
                        </View>
                        <View style={{ width: '50%', flexDirection: 'row', alignItems: 'center' }}>
                            <View style={{ width: 80, flexDirection: 'row', borderWidth: 1, borderColor: Colors.black, borderRadius: 5, alignItems: 'center' }}>
                                <TextInput
                                    // ref='valueAvailableSpace'
                                    multiline={false}
                                    returnKeyType='done'
                                    numberOfLines={1}
                                    underlineColorAndroid="transparent"
                                    autoCapitalize='sentences'
                                    onChangeText={value => {
                                        if (value.match(/^[0-9]+$/) != null) {
                                            
                                            var valueFemalePercent = parseInt(value, 10);
                                            if (valueFemalePercent > 100) {
                                                this.setState({ valueMalePercent: '0', valueFemalePercent: '100' })
                                                
                                            } else {
                                                this.setState({ valueFemalePercent: valueFemalePercent.toFixed(), valueMalePercent: (100 - valueFemalePercent).toString()})
                                                
                                            }
                                        } else if(value == "" || value == null || value == undefined) {
                                            this.setState({ valueFemalePercent: ''})
                                            
                                        }
                                        
                                    }}
                                    value={this.state.valueFemalePercent}
                                    style={[styles.textInputText, stylesGlobal.font, { flex: 1, borderWidth: 0 }]}
                                    onSubmitEditing={(event) => {
                                        //this.refs.valueLastName.focus();
                                    }}
                                    keyboardType={'number-pad'}
                                />
                                <Text style={[{ fontSize: 14, color: Colors.black, marginHorizontal: 10 }, stylesGlobal.font]}>{"%"}</Text>
                            </View>
                            <Text style={[{ fontSize: 14, color: Colors.black, marginStart: 10, marginEnd: 30 }, stylesGlobal.font]}>{"Female"}</Text>
                        </View>
                    </View>
                </View>

                <View style={[styles.headView, { flexDirection: 'row', justifyContent: 'space-around' }]}>
                    <View style={{ width: '50%', alignItems: 'flex-start' }}>
                        <Text style={[styles.headingText, stylesGlobal.font_bold]}>{"Close Guest List:"}</Text>
                        <Text style={[{ fontSize: 13, color: Colors.black }, stylesGlobal.font]}>{"(optional)"}</Text>
                        <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
                            <TextInput
                                // ref='valueAvailableSpace'
                                multiline={false}
                                returnKeyType='done'
                                numberOfLines={1}
                                underlineColorAndroid="transparent"
                                autoCapitalize='sentences'
                                onChangeText={value => {
                                    this.setState({ hours_close_guests_list: value })
                                }}
                                value={this.state.hours_close_guests_list}
                                style={[styles.textInputText, stylesGlobal.font, { width: 80, textAlign: 'center' }]}
                                onSubmitEditing={(event) => {
                                    //this.refs.valueLastName.focus();
                                }}
                                keyboardType={'number-pad'}
                            />
                            <View style={{ marginLeft: 10 }}>
                                <Text style={[{ fontSize: 13, color: Colors.black, marginVertical: 5 }, stylesGlobal.font]}>{"Hours"}</Text>
                                <Text style={[{ fontSize: 13, color: Colors.black }, stylesGlobal.font]}>{"before"}</Text>
                            </View>

                        </View>

                    </View>
                    <View style={{ width: '50%', alignItems: 'flex-start', overflow: 'visible', flexDirection: 'column'   }}>
                        <Text style={[styles.headingText, stylesGlobal.font_bold, { flexWrap: 'nowrap', overflow: 'visible', width: '150%'}]}>{"Send RSVP Reminders:"}</Text>
                        <Text style={[{ fontSize: 13, color: Colors.black }, stylesGlobal.font]}>{"(optional)"}</Text>
                        <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
                            <TextInput
                                // ref='valueAvailableSpace'
                                multiline={false}
                                returnKeyType='done'
                                numberOfLines={1}
                                underlineColorAndroid="transparent"
                                autoCapitalize='sentences'
                                onChangeText={value => {
                                    this.setState({ hours_rsvp_reminder: value })
                                }}
                                value={this.state.hours_rsvp_reminder}
                                style={[styles.textInputText, stylesGlobal.font, { width: 80, textAlign: 'center' }]}
                                onSubmitEditing={(event) => {
                                    //this.refs.valueLastName.focus();
                                }}
                                keyboardType={'number-pad'}
                            />
                            <View style={{ marginLeft: 10 }}>
                                <Text style={[{ fontSize: 13, color: Colors.black, marginVertical: 5 }, stylesGlobal.font]}>{"Hours"}</Text>
                                <Text style={[{ fontSize: 13, color: Colors.black }, stylesGlobal.font]}>{"before"}</Text>
                            </View>
                        </View>
                    </View>
                </View>
                {
                    // this.state.event_create_type == "edit_event" && <View style={[styles.headView, { width: '100%', alignItems: 'center' }]}>
                    //     <TouchableOpacity style={[styles.submitGold, { marginBottom: 0 }, stylesGlobal.shadow_style]}
                    //         onPress={() =>
                    //             this.setState({
                    //                 send_reminders_type: "everyone",
                    //                 send_reminder_message: "",
                    //                 send_reminders_popup_show: true
                    //             })
                    //         }
                    //     >
                    //         <Text style={[styles.submitTextWhite, stylesGlobal.font]}>{"Send Reminders Now"}</Text>
                    //     </TouchableOpacity>
                    // </View>
                }
                {this.state.event_create_type != "edit_event" && 
                    <View style={[styles.headView, { width: '100%', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', marginTop: 10, marginBottom: 10 }]}>
                        {

                            <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center' }}
                                // disabled={this.state.event_create_type == "edit_event" ? false : true}
                                onPress={() => {
                                    this.setState({ notifyChange: !this.state.notifyChange })
                                }}
                            >
                                <Image source={require('../icons/square.png')} style={{ width: 20, height: 20, resizeMode: 'contain' }} />
                                {this.state.notifyChange && <Image source={require('../icons/checked.png')} style={{ position: 'absolute', left: 0, width: 20, height: 20, resizeMode: 'contain' }} />}
                                <Text style={[{ fontSize: 13, color: Colors.black, marginStart: 10 }, , stylesGlobal.font]}>{"Notify All Members about this Party"}</Text>
                            </TouchableOpacity>
                        }
                    </View>
                }
            </View>
        )
    }
    /**
     * display event form
     */
    renderEventForm = () => {

        return (
            <SafeAreaView style={styles.container} onStartShouldSetResponder={() => this.setState({ show_visibility: false })}>
                <View style={styles.card_view}>
                    <View style={{ alignItems: 'center', width: '100%', height: 40, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.card_titlecolor }}>
                        <Text style={[styles.headText, stylesGlobal.font]}>{this.state.event_create_type == "edit_event" ? "EDIT PARTY" : "HOST A PARTY"}</Text>
                    </View>
                    <KeyboardAwareScrollView style={{ paaddingBottom: 20, }} extraScrollHeight={40} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps={'handled'}>

                        <View style={[styles.headView]}>
                            <View style={{ flexDirection: 'row' }}>
                                <Text style={[{ color: 'red' }, stylesGlobal.font]}>{"*"}</Text>
                                <Text style={[styles.headingText, stylesGlobal.font_bold]}>{"Event Title"}</Text>
                            </View>
                            <TextInput
                                ref='valueEventTitle'
                                multiline={false}
                                returnKeyType='done'
                                numberOfLines={1}
                                underlineColorAndroid="transparent"
                                autoCapitalize='sentences'
                                onChangeText={value => {
                                    this.setState({ valueEventTitle: value, isTitleChanged: true })
                                }}
                                value={this.state.valueEventTitle}
                                style={[styles.textInputText, stylesGlobal.font]}
                                onSubmitEditing={(event) => {
                                    //this.refs.valueLastName.focus();
                                }}
                            />
                        </View>
                        <View style={[styles.headView,]}>
                            <View style={{ flexDirection: 'row' }}>
                                <Text style={[{ color: 'red' }, stylesGlobal.font]}>{"*"}</Text>
                                <Text style={[styles.headingText, stylesGlobal.font_bold]}>{"Event Description"}</Text>
                            </View>
                            <TouchableOpacity style={[styles.textInputTextDescrip,]} activeOpacity={1} onPress={() => this.valueEventDescription.focus()}>
                                <TextInput
                                    ref={(ref) => this.valueEventDescription = ref}
                                    multiline={true}
                                    returnKeyType='default'
                                    underlineColorAndroid="transparent"
                                    autoCapitalize='sentences'
                                    onChangeText={value => {
                                        this.setState({ valueEventDescription: value })
                                    }}
                                    value={this.state.valueEventDescription}
                                    numberOfLines={20}
                                    style={stylesGlobal.descriptionTextInput}
                                    onSubmitEditing={(event) => {

                                    }}
                                ></TextInput>
                            </TouchableOpacity>
                        </View>
                        <View style={[styles.headView, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
                            <View style={{ alignItems: 'center', width: '45%' }}>
                                <Text style={[styles.headingText, stylesGlobal.font_bold]}>{"Visibility"}</Text>
                                <ModalDropdown
                                    dropdownStyle={styles.visibility_container_view}
                                    defaultIndex={0}
                                    options={this.state.category_array}
                                    onDropdownWillShow={() => Keyboard.dismiss()}
                                    onSelect={(index) => {
                                        this.setState({
                                            selected_category: index
                                        }, () => this.setNotifyChangeText())
                                    }}
                                    renderButton={() => {
                                        return (
                                            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                                                <Image style={{ width: 40, height: 40, resizeMode: 'contain' }} source={this.state.category_array[this.state.selected_category].icon_path} />
                                                <Text style={[{ fontSize: 13 }, stylesGlobal.font]}>{this.state.category_array[this.state.selected_category].label}</Text>
                                            </View>
                                        )
                                    }}
                                    renderRow={(item, index, highlighted) => {
                                        return (
                                            <View key={index} style={[styles.visibility_button, this.state.selected_category == index ? { backgroundColor: Colors.gold } : { backgroundColor: Colors.black }]}>
                                                <Image style={{ width: 20, height: 20, marginLeft: 8 }} resizeMode={'contain'} source={item.icon_path} />
                                                <Text style={[styles.visibility_text, stylesGlobal.font, { marginLeft: 5 }]}>{item.label}</Text>
                                            </View>
                                        )
                                    }}
                                />
                            </View>
                            <TouchableOpacity style={{ width: '45%' }} onPress={() => {
                                this.setState({
                                    isDatePickerVisible: true
                                })
                            }} >
                                {this.renderTextView('Date', this.state.valueStartDateOfEvent, this.state.dayofStartDate)}
                            </TouchableOpacity>
                            {/* <View style = {{justifyContent: 'flex-end', marginLeft: 15}}>
                                <View style = {{height: 40, justifyContent: 'center'}}>
                                    <Text style = {stylesGlobal.font}>{this.state.dayofStartDate}</Text>
                                </View>
                            </View> */}
                        </View>

                        <View style={[styles.headView, { flexDirection: 'row', justifyContent: 'space-between' }]}>
                            <TouchableOpacity style={{ width: '45%' }} onPress={() => {
                                this.setState({
                                    isStartTimePickerVisible: true
                                })
                            }}>
                                {this.renderTextView('Time', this.state.valueStartTimeOfEvent)}
                            </TouchableOpacity>

                            <TouchableOpacity style={{ width: '45%' }} onPress={() => {
                                this.setState({
                                    isEndTimePickerVisible: true
                                })
                            }} >
                                {this.renderTextView('', this.state.valueEndTimeOfEvent)}
                            </TouchableOpacity>
                        </View>
                        <View style={[styles.headView, { width: '100%' }]}>
                            {this.renderLocation('Location', this.state.valueLocation, 'valueLocation')}
                        </View>

                        <View style={[styles.headView]}>
                            <Text style={[styles.headingText, stylesGlobal.font_bold]}>{"Cover Image"}</Text>
                            <View style={{ borderColor: Colors.black, borderRadius: 4, marginTop: 5, overflow: 'hidden' }}>
                                {this.ImageCompressor()}
                            </View>
                        </View>

                        <View style={[styles.headView, { marginTop: 20, paddingLeft: 0, paddingRight: 0 }]}>
                            {
                                this.state.is_portrait &&
                                <View style={{ flex: 1, width: '100%', alignItems: 'center' }}>
                                    <TouchableOpacity
                                        style={{
                                            width: '100%',
                                            backgroundColor: Colors.gold,
                                            alignSelf: 'center',
                                            // marginTop: 10,
                                            height: 50,
                                            backgroundColor: Colors.gold,
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            borderTopLeftRadius: 15,
                                            borderTopRightRadius: 15,
                                            borderBottomLeftRadius: 0,
                                            borderBottomRightRadius: 0,
                                            marginBottom: this.state.isShowAdvancingSetting ? 0 : 8,
                                        }}
                                        onPress={() => this.setState({ isShowAdvancingSetting: !this.state.isShowAdvancingSetting })}
                                    >
                                        <Text style={[stylesGlobal.font_bold, { color: Colors.white, fontSize: 17 }]}>{"Advanced Settings"}</Text>
                                        <Icon name={this.state.isShowAdvancingSetting ? 'chevron-up' : 'chevron-down'} color='#000' size={20} style={{ position: 'absolute', right: 20, }} />
                                    </TouchableOpacity>
                                    {this.state.isShowAdvancingSetting ? this.renderAdvancingSetting() : null}

                                </View>
                            }
                        </View>
                        {/* <View style={[styles.headView, {width: '100%', alignItems: 'center', justifyContent: 'center', flexDirection: 'row'}]}>
                            {
                                !(this.state.category_array[this.state.selected_category].value == 2 || this.state.past_event) &&
                                <TouchableOpacity style = {{flexDirection: 'row', alignItems: 'center'}} 
                                    disabled = {this.state.event_create_type == "edit_event" ? false : true}
                                    onPress = {() => {
                                        if(this.state.event_create_type == "edit_event") {
                                            this.setState({notifyChange: !this.state.notifyChange})
                                        }
                                    }}
                                >
                                    <Image source={require('../icons/square.png')}  style={{width:20, height:20, resizeMode:'contain'}}/>
                                    {this.state.notifyChange && <Image source={require('../icons/checked.png')} style={{position:'absolute', left:0, width:20, height:20, resizeMode:'contain'}}/>}
                                    <Text style = {[{fontSize: 13, color: Colors.black, marginStart: 10},, stylesGlobal.font]}>{this.state.event_create_type == "edit_event" ? "Notify Confirmed Guests about changes to this Party" : "Notify also not personally invited " + this.state.notifyChangeText}</Text>
                                </TouchableOpacity>
                            }
                            </View> */}
                        {this.renderBottomButton()}

                    </KeyboardAwareScrollView>
                </View>
            </SafeAreaView>
        );
    };

    ImageCompressor = () => {
        return (
            <View>
                {
                    this.state.valueEventImage.uri != null && this.state.valueEventImage.uri != "" &&
                    <View>
                        <FitImage style={{ position: 'absolute', height: 300, width: '100%' }} resizeMode={"cover"} source={{ uri: this.state.valueEventImage.uri }} defaultSource={this.state.defaultImage} />
                        <FastImage style={{ height: 300, width: '100%' }} resizeMode={"cover"} source={{ uri: this.state.valueEventImage.uri }} />
                    </View>
                }
                {
                    (this.state.valueEventImage.uri == null || this.state.valueEventImage.uri == "") &&
                    <View style={{ width: '100%', height: 300 }}>
                        <Image style={{ position: 'absolute', height: '100%', width: '100%', resizeMode: 'cover' }} source={this.state.defaultImage} />
                    </View>
                }
                <TouchableOpacity style={{ height: 40, flexDirection: 'row', position: 'absolute', bottom: 0, right: 0 }} onPress={() => this.showImagePicker()}>
                    <View style={{ height: '100%', backgroundColor: Colors.white, paddingHorizontal: 10, justifyContent: 'center' }}>
                        <Text style={[{ color: Colors.black }, stylesGlobal.font]}>{"Change Image"}</Text>
                    </View>
                    <View style={{ height: '100%', aspectRatio: 1, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center', marginStart: 5 }}>
                        <Image style={{ width: '50%', height: '50%', resizeMode: 'contain' }} source={require('../icons/signup_upload.png')} />
                    </View>
                </TouchableOpacity>
            </View>
        );
    }
    /**
     * display Location View
     */
    renderLocation = (headerText, stateValue, stateName) => {
        return (
            <View >
                <View style={{ flexDirection: 'row' }}>
                    <Text style={[{ color: 'red' }, stylesGlobal.font]}>*</Text>
                    <Text style={[styles.headingText, { marginBottom: 5 }, stylesGlobal.font_bold]}>{headerText}</Text>
                </View>
                {this.getGoogleAutoCompleteView()}
            </View>

        );

    }

    handleCloseSettingModal = () => {
        this.setState({ showInitSettingModal: false });
    }

    renderInitSettingModalViews = () => {
        return (
            <View
                style={[
                    {
                        position: "absolute",
                        left: 0,
                        top: 0,
                        right: 0,
                        bottom: 0,
                        zIndex: 200,
                        elevation: 200,
                        alignItems: "center",
                    },
                ]}
            >
                <View
                    style={{
                        width: "100%",
                        height: "100%",
                        position: "absolute",
                        backgroundColor: Colors.black,
                        opacity: 0.3,
                    }}
                />
                <View
                    style={{
                        width: "70%",
                        height: "100%",
                        alignItems: "center",
                        justifyContent: "center",
                        paddingHorizontal: this.state.is_portrait ? 10 : 0,
                    }}
                >
                    <View
                        style={[{
                            width: this.state.is_portrait ? "100%" : "90%",
                            borderRadius: 10,
                            backgroundColor: Colors.white,
                            overflow: "hidden",

                        },
                        stylesGlobal.shadow_style,
                        ]}
                    >
                        <View style={{ margin: 10, justifyContent: 'center', alignItems: 'center' }}>
                            <View style={{ position: 'absolute', right: 0, top: 0 }}>
                                <TouchableOpacity
                                    underlayColor="#fff"
                                    onPress={() => {
                                        this.handleCloseSettingModal();
                                    }}
                                >
                                    <ImageBackground style={{ width: 20, height: 20, justifyContent: 'center', alignItems: 'center' }} source={require('../icons/connection-delete.png')}>

                                    </ImageBackground>
                                </TouchableOpacity>

                            </View>

                            <View style={{ width: '95%', marginTop: 20, }}>
                                <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                                    <Text style={[stylesGlobal.font, { fontSize: 16 }]}> What Type of Event</Text>
                                    <Text style={[stylesGlobal.font, { fontSize: 16, marginTop: 5 },]}> Are You Hosting?</Text>
                                </View>
                                <View style={{ alignItems: 'center', justifyContent: 'center', marginTop: 15, textAlign: 'center' }}>
                                    <Text style={[stylesGlobal.font, { fontSize: 13, }]}> This can be changed later in the advanced settings for your event.</Text>
                                </View>

                                <View style={{ marginTop: 20, marginBottom: 5, alignItems: 'center', justifyContent: 'center', overflow: 'scroll' }}>
                                    {
                                        eventCategoryList.map((item, index) => {
                                            return (
                                                this.generateSettingImageBtn(item.label, index, item.value)
                                            )
                                        })
                                    }
                                </View>
                            </View>
                        </View>
                    </View>
                </View>
            </View>
        );
    }

    generateSettingImageBtn = (label, index, value) => {
        var imageUrl = "";
        switch (index) {
            case 0:
                {
                    imageUrl = require('../icons/balloons.png');
                }
                break;
            case 1:
                {
                    imageUrl = require('../icons/lunch.png');
                }
                break;
            case 2:
                {
                    imageUrl = require('../icons/dinner.png');
                }
                break;
            case 3:
                {
                    imageUrl = require('../icons/night_out.png');
                }
                break;
            case 4:
                {
                    imageUrl = require('../icons/yacht.png');
                }
                break;
            case 5:
                {
                    imageUrl = require('../icons/other.png');
                }
                break;
        }
        return (
            <TouchableOpacity
                style={[styles.submitBlack, { marginBottom: 5, justifyContent: 'center' },]}
                underlayColor="#fff"
                onPress={() => {
                    this.onChangeTextCategory(value, index);
                    //console.log('onChangeTextCategory  ', value);
                    this.handleCloseSettingModal();
                }}
                key={index}
            >
                <View style={{ width: '100%', height: '100%', flexDirection: 'row', alignItems: 'center' }}>
                    <Image style={{ height: 25, width: 25, resizeMode: 'cover' }} source={imageUrl} ></Image>
                    <Text style={[{ color: '#fff' }, stylesGlobal.font, { marginLeft: 10, fontSize: 16 }]}>{label}</Text>
                </View>
            </TouchableOpacity>
        );
    }

    /**
   * fetch place detail from google place
   */
    onGeoCodeSearchFunc = (data) => {
        console.log('onGeoCodeSearchFunc', data);
        Geocoder.geocodeAddress(data).then(res => {
            this.setState({
                locationInfo: res,
                searchedText: data,
                loading: false
            }, () => {
                location = data
            })
        }).catch(err => {
            this.setState({
                searchedText: data,
                loading: false
            }, () => {
                location = data
            })
        })
    }

    getCurrentLocation = async () => {
        getUserLocation(
            position => {
                const { latitude, longitude } = position.coords;
                Geocoder.geocodePosition({ lat: latitude, lng: longitude }).then(res => {
                    this.setState({
                        locationInfo: res,
                        searchedText: res[0].formattedAddress,
                        loading: false
                    }, () => {
                        location = res[0].formattedAddress
                    })
                    this.refs.ref_GooglePlacesAutocomplete.setAddressText(res[0].formattedAddress);
                    if (this.state.event_create_type == "edit_event") {
                        if (this.state.category_array[this.state.selected_category].value != 2 && !this.state.past_event) {
                            this.setState({
                                notifyChange: true
                            })
                        }
                    }
                }).catch(err => {
                    console.log(err)
                    this.setState({
                        searchedText: res[0].formattedAddress,
                        loading: false
                    }, () => {
                        location = res[0].formattedAddress
                    })
                })
            },
            error => { console.log("error") }
        );
    }

    /** render AutoCompleteTextView
     *
     * @returns {*}
     */
    getGoogleAutoCompleteView = () => {
        const query = {
            key: Global.GOOGLE_MAP_KEY,
            types: "geocode|establishment",
            language: 'en',
        };
        navigator.geolocation = require('@react-native-community/geolocation');
        return (
            <View style={{ width: '100%', flexDirection: 'row', borderWidth: 1, borderColor: Colors.black, borderRadius: 5, overflow: 'hidden' }}>
                <GooglePlacesAutocomplete
                    ref="ref_GooglePlacesAutocomplete"
                    placeholder=''
                    minLength={3} // minimum length of text to search
                    autoFocus={false}
                    fetchDetails={false}
                    returnKeyType={'done'}
                    getDefaultValue={() => this.state.searchedText}
                    listViewDisplayed={false}  // true/false/undefined

                    renderDescription={(row) => row.description}
                    onPress={(data, details) => {

                        if (this.state.event_create_type == "edit_event") {
                            if (this.state.category_array[this.state.selected_category].value != 2 && !this.state.past_event) {
                                this.setState({
                                    notifyChange: true
                                })
                            }
                        }

                        this.onGeoCodeSearchFunc(data.description);

                    }}
                    onSubmitEditing={() => {
                        this.onGeoCodeSearchFunc(location);

                    }}
                    query={query}
                    styles={{
                        textInputContainer: {
                            flex: 1,
                            height: 40,
                            backgroundColor: Colors.white,
                        },
                        textInput: [{
                            marginLeft: 0,
                            marginRight: 0,
                            paddingLeft: 5,
                            marginTop: 0,
                            height: 40,
                            backgroundColor: Colors.transparent,
                            color: Colors.black,
                            fontSize: 13,
                        }, stylesGlobal.font],
                        container: {
                            backgroundColor: Colors.white,
                        },
                        predefinedPlacesDescription: [{
                            color: Colors.black,
                            fontSize: 13,
                        }, stylesGlobal.font],
                        description: [{ fontSize: 13, }, stylesGlobal.font]
                    }}
                    currentLocation={false}
                    currentLocationLabel="Current location"
                    nearbyPlacesAPI="GooglePlacesSearch"
                    textInputProps={{
                        onChangeText: (text) => {
                            location = text;
                        }
                    }}
                />
                <TouchableOpacity style={{ height: 40, aspectRatio: 1, justifyContent: 'center', alignItems: 'center' }} onPress={() => this.getCurrentLocation()}>
                    <Image style={{ width: '60%', height: '60%', resizeMode: 'contain' }} source={require("../icons/pin.png")} />
                </TouchableOpacity>
            </View>
        )
    };



    renderTextView = (headerText, stateValue, dayofStartDate) => {
        return (
            <View >
                <View style={{ flexDirection: 'row' }}>
                    <Text style={[{ color: 'red' }, stylesGlobal.font]}>{"*"}</Text>
                    <Text style={[styles.headingText, stylesGlobal.font_bold]}>{headerText}</Text>
                </View>
                <View style={[styles.viewCenterText, { marginTop: 5, justifyContent: 'center', }]}>
                    <Text style={stylesGlobal.font}>{stateValue} {dayofStartDate != null && dayofStartDate != "" ? " (" + dayofStartDate + ")" : ""}</Text>
                </View>
            </View>
        );
    }

    /**
        * display bottom save and cancel button
        */
    renderBottomButton = () => {

        let cancelButton = (<TouchableOpacity
            style={[styles.submitGold, { margin: 10 }, stylesGlobal.shadow_style]}
            underlayColor="#fff"
            onPress={() => {
                this.props.navigation.goBack();
            }}
        >
            <Text style={[styles.submitTextWhite, stylesGlobal.font]}>{"Cancel"}</Text>
        </TouchableOpacity>);

        let saveWithOutInviteButton = (<TouchableOpacity
            style={[styles.submitGold, { margin: 10 }, stylesGlobal.shadow_style]}
            underlayColor="#fff"
            onPress={() => {
                // isInvited = 1;
                isInvited = 2;
                this.saveEventDetail()
                //this.goToEventScreen();
            }}
            disabled={this.state.loading}
        >
            <Text style={[styles.submitTextWhite, stylesGlobal.font]}>{this.state.notifyChange && !this.state.past_event ? "Save" : "Save"}</Text>
        </TouchableOpacity>);

        let inviteFriendsButton = (<TouchableOpacity
            style={[styles.submitGold, { margin: 10, }, stylesGlobal.shadow_style]}
            underlayColor="#fff"
            onPress={() => {
                isInvited = 2;
                this.saveEventDetail()
            }}
            disabled={this.state.loading}
        >
            <Text style={[styles.submitTextWhite, stylesGlobal.font]}>{"Save & Invite Friends"}</Text>
        </TouchableOpacity>);

        let copyFriendsButton = (<TouchableOpacity
            style={[styles.submitGold, { margin: 10 }, stylesGlobal.shadow_style]}
            underlayColor="#fff"
            onPress={() => {
                isInvited = 3;
                this.saveEventDetail()
            }}
        >
            <Text style={[styles.submitTextWhite, stylesGlobal.font]}>{"Copy Guest List"}</Text>
        </TouchableOpacity>);

        return (
            <View style={{ marginTop: 10 }}>
                {
                    this.state.event_create_type == "edit_event" &&
                    <View style={{ alignItems: "center", justifyContent: 'center', marginBottom: 20 }}>
                        {saveWithOutInviteButton}
                        {cancelButton}
                    </View>
                }
                {
                    this.state.event_create_type == "create_event" &&
                    <View style={{ width: '100%' }}>
                        <View style={{ alignItems: "center", justifyContent: 'center', marginBottom: 20 }}>
                            {saveWithOutInviteButton}
                            {/* {inviteFriendsButton} */}
                            {cancelButton}

                        </View>

                    </View>
                }
                {
                    this.state.event_create_type == "copy_event" &&
                    <View style={{ width: '100%' }}>
                        <View style={{ width: '100%', alignItems: "center", flexDirection: 'row', justifyContent: 'center' }}>
                            {saveWithOutInviteButton}
                            {copyFriendsButton}
                            {cancelButton}
                        </View>
                    </View>
                }
            </View>
        );
    };

    /** Handle Category DropDown Value
     *
     * @param text
     * @param index
     * @param data
     */
    onChangeTextCategory = (text, index) => {
        const flag = this.state.valueEventTitle == '';
        var title = "";
        if (text == null) {
            title = ""
        } else {
            title = text + " with " + this.state.userFirstName + " " + this.state.userLastName;;
        }
        var starttime = '';
        var start_ap = 'pm'
        var endtime = '';
        var end_ap = 'am';
        var image = null;

        var objEventCates = this.state.eventCategoryList.filter(item => item.value === text);
        var imageUrl = "";
        if(objEventCates.length > 0)
        {
            imageUrl = objEventCates[0].defaul_image;
        }

        switch (index) {
            case 0:
                starttime = '07:00 pm';
                endtime = '12:00 am';
                // image = null;
                break;
            case 1:
                starttime = '06:00 am';
                endtime = '09:00 am';
                // image = 'https://cdn1.007percent.com/uploads/event_images/1571426541_14_15.jpg'
                break;
            case 2:
                starttime = '12:00 pm';
                endtime = '02:00 pm';
                // image = 'https://cdn1.007percent.com/uploads/event_images/1571426567_14_23.jpg'
                break;
            case 3:
                starttime = '08:00 pm';
                endtime = '11:00 pm';
                // image = 'https://cdn1.007percent.com/uploads/event_images/1571426595_14_32.jpg'
                break;
            case 4:
                starttime = '10:00 am';
                endtime = '01:00 pm';
                // image = 'https://cdn1.007percent.com/uploads/event_images/1571426627_14_35.jpg'
                break;
            case 5:
                starttime = '10:00 pm';
                endtime = '01:00 am';
                // image = 'https://cdn1.007percent.com/uploads/event_images/1571426663_14_71.jpg'
                break;
            case 6:
                starttime = '11:00 pm';
                endtime = '03:00 am';
                // image = 'https://cdn1.007percent.com/uploads/event_images/1571426694_14_36.jpg';
                break;
            case 7:
                starttime = '12:00 am';
                endtime = '12:00 am';
                // image = 'https://cdn1.007percent.com/uploads/event_images/1557131726_14_67.jpeg'
                break;
            default:
                break;
        }
        this.setState({
            from_time_zone: start_ap,
            to_time_zone: end_ap,
            selected_event_category: index,
            props_event_title: text
        })
        if (!this.state.isTitleChanged) {
            this.setState({
                valueEventTitle: title
            })
        }
        if (!this.state.isTimeChanged) {
            this.setState({
                valueStartTimeOfEvent: starttime,
                valueEndTimeOfEvent: endtime,
            })
        }
        if (!this.state.isImageChanged) {
            this.setState({
                valueEventImage: {
                    // uri: image ? image : this.state.valueEventImage.uri,
                    uri: imageUrl,
                    type: 'image/jpeg',
                    name: 'testPhotoName.jpg'
                }
            })
        }
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

       // return;

        /**
         * The first arg is the options object for customization (it can also be null or omitted for default options),
         * The second arg is the callback which sends object: response (more info below in README)
         */
        ImagePicker.showImagePicker(options, (response) => {

            console.log('Response = ', response.type);

            if (response.didCancel) {
                console.log('User cancelled image picker');
            } else if (response.error) {
                console.log('ImagePicker Error: ', response.error);
            } else if (response.customButton) {
                console.log('User tapped custom button: ', response.customButton);
            } else {

                Image.getSize(response.uri, (width, height) => {
                    var newwidth = 0, newheight = 0;
                    if (width > 2000 || height > 2000) {
                        if (width > height) {
                            newwidth = 2000;
                            newheight = height * 2000 / width
                        } else {
                            newheight = 2000;
                            newwidth = width * 2000 / height
                        }
                        ImageResizer.createResizedImage(response.uri, newwidth, newheight, 'JPEG', 90)
                            .then(({ uri }) => {
                                this.setState({
                                    valueEventImage: { uri: uri },
                                    isImageChanged: true,
                                })
                            })
                            .catch(err => {
                                console.log(err);

                            });
                    } else {
                        this.setState({
                            valueEventImage: { uri: response.uri },
                            isImageChanged: true,
                        })
                    }
                });
            }
        });
    }

}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: "100%",
        height: "100%",
        padding: 10,
        paddingTop: 2,
        paddingBottom: 15,
        backgroundColor: Colors.black
    },
    card_view: {
        flex: 1,
        borderRadius: 10,
        backgroundColor: Colors.white,
        marginLeft: 10,
        marginRight: 10,
        marginBottom: 10,
        overflow: 'hidden'
    },
    headView: {
        marginTop: 10,
        paddingLeft: 10,
        paddingRight: 10
    },
    headingText: {
        color: Colors.gold,
        backgroundColor: Colors.transparent,
        fontSize: 14,
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
    textInputTextDescrip: {
        color: Colors.black,
        marginTop: 5,

        backgroundColor: Colors.white,
        fontSize: 13,
        borderColor: Colors.black,
        borderWidth: 1,
        borderRadius: 4,


    },
    viewCenterText: {
        padding: 5,
        paddingTop: 2,
        justifyContent: 'center',
        backgroundColor: Colors.white,
        borderColor: Colors.black,
        borderRadius: 4,
        borderWidth: 1,
        height: 40,
        color: Colors.black
    },
    viewCenterTextVisibility: {
        // backgroundColor: 'red',
        height: 2
    },
    bottomView: {
        backgroundColor: Colors.white,
        height: 0.5,
        marginTop: 1
    },
    submitTextWhite: {
        color: Colors.white,
        backgroundColor: Colors.transparent,
        textAlign: "center",
        fontSize: 14,
        // fontWeight: 'bold'
    },
    submitTextGold: {
        color: Colors.black,
        backgroundColor: Colors.transparent,
        textAlign: "center",
        fontSize: 14,
        fontWeight: 'bold'
    },
    submitWhite: {
        padding: 10,
        width: width * 0.45,
        backgroundColor: Colors.white,
        borderRadius: 2,
        borderWidth: 1,
        borderColor: Colors.gold,
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'center',
        marginTop: 0,
        marginBottom: 20
    },
    submitGold: {
        padding: 10,
        width: width * 0.40,
        backgroundColor: Colors.gold,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: Colors.transparent,
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'center',
        marginTop: 0,
        marginBottom: 20
    },

    submitBlack: {
        paddingLeft: 10,
        paddingRight: 10,
        paddingTop: 5,
        paddingBottom: 5,
        width: '80%',
        backgroundColor: '#000',
        borderRadius: 6,
        borderWidth: 1,
        borderColor: Colors.transparent,
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'center',
        marginTop: 0,
        marginBottom: 20
    },

    headText: {
        color: Colors.gold,
        fontSize: 20,
    },

    visibility_container_view: {
        height: 35 * 5 + 5 * 6,
        paddingLeft: 5,
        paddingTop: 5,
        paddingRight: 5,
        backgroundColor: '#ffffff',
        borderRadius: 3,
        borderColor: '#000000',
        borderWidth: 1
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
    picker_style: {
        padding: 5,
        justifyContent: 'center',
        backgroundColor: Colors.white,
        borderColor: Colors.black,
        borderRadius: 4,
        borderWidth: 1,
        height: 40,
        color: Colors.black,
        fontSize: 13,
        fontFamily: 'raleway',
    },
});

const pickerSelectStyles = StyleSheet.create({
    inputIOS: {
        padding: 5,
        // justifyContent: 'center',
        backgroundColor: Colors.white,
        borderColor: Colors.black,
        borderRadius: 4,
        borderWidth: 1,
        height: 40,
        color: Colors.black,
        fontSize: 13,
        fontFamily: 'raleway'
    },
    inputAndroid: {
        padding: 5,
        justifyContent: 'center',
        backgroundColor: Colors.white,
        borderColor: Colors.black,
        borderRadius: 4,
        borderWidth: 1,
        height: 40,
        color: Colors.black,
        fontSize: 13,
        fontFamily: 'raleway_regular'
    },
});
