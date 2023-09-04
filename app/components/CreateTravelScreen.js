import React, { Component,Fragment } from "react";
import {
    Platform,
    StyleSheet,
    Text,
    View,
    TextInput,
    TouchableOpacity,
    SafeAreaView,
    Dimensions,
    ImageBackground,
    Image,
    KeyboardAvoidingView,
    Alert,
    Keyboard,
    Modal
} from "react-native";
import Icon from "react-native-vector-icons/Feather";
import * as ValidationUtils from "../utils/ValidationUtils";
import FastImage from 'react-native-fast-image'
import FitImage from 'react-native-fit-image'
const { height, width } = Dimensions.get("window");
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import { Dropdown } from 'react-native-material-dropdown';
import { Colors } from "../consts/Colors";
import DateTimePicker from "react-native-modal-datetime-picker";
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import Moment from "moment/moment";
import { extendMoment } from 'moment-range';
const moment = extendMoment(Moment);
import ImagePicker from "react-native-image-picker";
import * as Global from "../consts/Global";
import WebService from "../core/WebService";
import Geocoder from "react-native-geocoder";
import ProgressIndicator from "./ProgressIndicator";
import { Constants } from "../consts/Constants";
import { stylesGlobal, STICKY_HEADER_HEIGHT } from '../consts/StyleSheet'
import CustomPopupView from "../customview/CustomPopupView";
import { ImageCompressor } from './ImageCompressorClass';
import Memory from '../core/Memory';
import RNPickerSelect from 'react-native-picker-select';
import {convertEmojimessagetoString, convertStringtoEmojimessage, getUserLocation} from "../utils/Util";
import BannerView from "../customview/BannerView";
import AsyncStorage from '@react-native-community/async-storage';
import * as RNLocalize from "react-native-localize";
import ModalDropdown from '../custom_components/react-native-modal-dropdown/ModalDropdown';
import Tooltip from 'react-native-walkthrough-tooltip';
import { isIphoneX, getBottomSpace } from '../custom_components/react-native-iphone-x-helper';
import {Calendar} from 'react-native-calendars';

var TAG = "CreateTravelScreen";
var today;
var minStartDate = '';
var minEndDate = '';
var isChecked = false;
var currentDate;
var eventCategoryList = [];
var eventId = '';
var isInvited = 0;
let location = "";
let imageWidth = width;
let imageHeight = width;

export default class CreateTravelScreen extends React.Component {

    constructor() {
        super();
        var today = new Date();
        currentDate = parseInt(today.getMonth() + 1) + "/" + today.getDate() + "/" + today.getFullYear();
        this.state = {
            userId: "",
            userToken: "",
            userSlug: "",
            userImagePath: "",
            userImageName: "",
            member_plan: "",
            is_verified: "",

            event_create_type: "",

            showModel: false,
            currentDate: currentDate,
            startMinDate: currentDate,
            endMinDate: currentDate,
            startMaxDate: currentDate,
            isEndDateSelect: false,
            valueEventTitle: '',
            valueEventDescription: '',
            valueEventImage: { uri: '', type: '', fileName: '' },
            valueLocation: '',
            valueStartDateOfEvent: '',
            valueEndDateOfEvent: '',
            valueStartTimeOfEvent: '',
            valueEndTimeOfEvent: '',
            valueAvailableSpace: '',
            dayofStartDate: '',
            dayofEndDate: '',
            from_time_zone: '',
            to_time_zone: '',
            loading: true,
            eventCategoryList: [],
            selected_event_category: 0,

            past_event: false, // event is past event when edit event
            
            showVisibilityDropdown: false,
            isFullDay: '0',
            locationInfo: '',
            searchedText: '',
            eventImagePath: '',
            userFirstName:'',
            userLastName:'',

            isStartDatePickerVisible: false,
            isEndDatePickerVisible: false,

            notifyChange: false,
            notifyChangeText: "", // used in Notify check text

            category_array: Global.category_array_event_trip,
            selected_category: Global.selected_category, // for visibility

            searchText: '',
            props_event_title: '',

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
            send_reminder_message: "", // message for send reminder

            is_portrait: true,
        };
    }

    UNSAFE_componentWillMount() {
        eventId = '';
        today = new Date();
        minStartDate = Moment(today).format("DD/MM/YYYY");
        minEndDate = Moment(today).format("DD/MM/YYYY");

        this.setState({
            event_create_type: this.props.route.params.type,
        })

        this.setNotifyChangeText();
        this.getCategoryList();

        // getUserLocation(
        //     position => {
        //         const { latitude, longitude } = position.coords;
                
        //     },
        //     error => { console.log(error); console.log("-------------------------------------") }
        // );
    }

    setNotifyChangeText = () => {
        if(this.state.category_array[this.state.selected_category].value == 2) { //Invitees
            this.setState({
                notifyChangeText: "Guests"
            });
        } else if(this.state.category_array[this.state.selected_category].value == 3) { // Favorites
            this.setState({
                notifyChangeText: "My Favorites"
            });
        } else if(this.state.category_array[this.state.selected_category].value == 0) { // Member
            this.setState({
                notifyChangeText: "Members"
            });
        } else if(this.state.category_array[this.state.selected_category].value == 5) { // Members\n& Favorites
            this.setState({
                notifyChangeText: "Members and My Favorites"
            });
        } else if(this.state.category_array[this.state.selected_category].value == 1) { // Public
            this.setState({
                notifyChangeText: "Members and Fans"
            });
        }
    }

    /**
     * display event edit data
     */
    setData = () => {

        const data = this.props.route.params.data.info;
        eventId = data.id;
        var selected_event_id = 0;
        if (data.full_day === '1')
            isChecked = true
        else
            isChecked = false

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
                selected_event_id = events;
                this.setState({
                    props_event_title: this.state.eventCategoryList[events].value
                })
                break;
            }
        }

        for(i = 0; i < this.state.category_array.length; i ++) {
            if(this.state.category_array[i].value.toString() == data.visibility) {
                this.setState({
                    selected_category: i
                }, () => this.setNotifyChangeText());
                break;
            }
        }

        if (this.props.route.params.isCopy) {
            if(new Date(Moment(data.from_date)) < new Date()) {
                var date_difference_startDate = new Date(Moment(data.from_date).format("MM/DD/YYYY")).getDay() - new Date().getDay();
                if(date_difference_startDate < 0) {
                    date_difference_startDate = 7 + date_difference_startDate;
                }
                if(new Date(Moment(data.from_date).format("MM/DD/YYYY")).getDay() == 5) { // if original day is Friday then set Sunday
                    date_difference_startDate = 2 + date_difference_startDate;
                } 

                var date_difference_startToend = moment.range(new Date(Moment(data.from_date).format("MM/DD/YYYY")), new Date(Moment(data.to_date).format("MM/DD/YYYY"))).diff('days');

                this.setState({
                    valueStartDateOfEvent: Moment(new Date()).add(date_difference_startDate, 'days').format("MM/DD/YYYY"),
                    dayofStartDate: Moment(new Date()).add(date_difference_startDate, 'days').format("ddd"),
                    endMinDate: Moment(new Date()).add(date_difference_startDate, 'days').format("MM/DD/YYYY"),
                    valueEndDateOfEvent: Moment(new Date()).add(date_difference_startDate + date_difference_startToend, 'days').format("MM/DD/YYYY"),
                    dayofEndDate: Moment(new Date()).add(date_difference_startDate + date_difference_startToend, 'days').format("ddd"),
                    endMinDate: Moment(new Date()).add(date_difference_startDate + date_difference_startToend, 'days').format("MM/DD/YYYY"),
                })
            } else {
                this.setState({
                    valueStartDateOfEvent: Moment(data.from_date).format("MM/DD/YYYY"),
                    dayofStartDate: Moment(data.from_date).format("ddd"),
                    valueEndDateOfEvent: Moment(data.to_date).format("MM/DD/YYYY"),
                    dayofEndDate: Moment(data.to_date).format("ddd"),
                    startMaxDate: Moment(data.to_date).format("MM/DD/YYYY"),
                    endMinDate: Moment(data.from_date).format("MM/DD/YYYY"),
                })
            }
          
        } else {
            if(new Date(Moment(data.to_date)) < new Date()) {
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
                valueEndDateOfEvent: Moment(data.to_date).format("MM/DD/YYYY"),
                dayofEndDate: Moment(data.to_date).format("ddd"),
                startMaxDate: Moment(data.to_date).format("MM/DD/YYYY"),
                endMinDate: Moment(data.from_date).format("MM/DD/YYYY"),
            })
        }

        this.setState({
            // valueStartDateOfEvent: Moment(data.from_date).format("MM/DD/YYYY"),
            // valueEndDateOfEvent: Moment(data.to_date).format("MM/DD/YYYY"),
            valueEventTitle: convertStringtoEmojimessage(data.title),
            valueEventDescription: convertStringtoEmojimessage(data.description),
            searchedText: data.venue_address,
            isFullDay: data.full_day,
            valueStartTimeOfEvent: data.from_time,
            valueEndTimeOfEvent: data.to_time,
            from_time_zone: data.from_time_am_pm,
            to_time_zone: data.to_time_am_pm,
            selected_event_category: selected_event_id,
            // startMaxDate: Moment(data.to_date).format("MM/DD/YYYY"),
            // endMinDate: Moment(data.from_date).format("MM/DD/YYYY"),
            isEndDateSelect: true,
            valueEventImage: imageData,
            isStartDateSelect: true,
            loading: false,
            eventImagePath: data.event_image_path + data.event_image_name
        })
        this.refs.ref_GooglePlacesAutocomplete.setAddressText(data.venue_address)
        if(data.available_spaces == null) {
            this.setState({
                valueAvailableSpace: 0
            })
        } else {
            this.setState({
                valueAvailableSpace: data.available_spaces
            })
        }
        this.onGeoCodeSearchFunc(data.venue_address)
    }

    /**
    * get event category list
    */
    getCategoryList = async () => {
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

            });
            
        } catch (error) {
            // Error retrieving data
            console.log(TAG + " getData error " + error);
        }
        this.setState({
            loading: true
        });

        let uri = Memory().env == "LIVE" ? Global.URL_CREATE_EVENT : Global.URL_CREATE_EVENT_DEV

        let params = new FormData();

        params.append("format", "json");
        params.append("user_id", this.state.userId);
        params.append("token", this.state.userToken);
        params.append("is_post", "false");

        console.log(TAG + " callGetCategoryListAPI uri " + uri);
        console.log(TAG + " callGetCategoryListAPI params " + JSON.stringify(params));


        WebService.callServicePost(
            uri,
            params,
            this.handleGetCategoryListResponse
        )

    }

    /**
        * handle get event category API response
        */
     handleGetCategoryListResponse = (response, isError) => {
        console.log(TAG + " callGetCategoryListAPI Response " + JSON.stringify(response));
        console.log(TAG + " callGetCategoryListAPI isError " + isError);
        if (!isError) {
            var result = response;
            if (result != undefined && result != null) {
                if (result.data != undefined && result.data != null) {
                    eventCategoryList = [];
                    for (let events = 0; events < result.data.event_category.length; events++) {
                        if(result.data.event_category[events].event_category_name.toUpperCase() === 'Trip'.toUpperCase()) {
                            eventCategoryList.push({
                                'id': result.data.event_category[events].id,
                                'label': result.data.event_category[events].event_category_name,
                                'value': result.data.event_category[events].event_category_name,
                                'default_image': result.data.event_category[events].default_image
                            })
                        }
                    }

                    this.setState({
                        eventCategoryList: eventCategoryList
                    }, () => {
                        if(eventCategoryList.length == 1) {
                            this.onChangeTextCategory(eventCategoryList[0].value, 1);
                        }
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
                        this.setState({
                            valueStartDateOfEvent: Moment(tomorrow).format("MM/DD/YYYY"),
                            dayofStartDate: Moment(tomorrow).format("ddd"),
                            valueEndDateOfEvent: Moment(tomorrow).format("MM/DD/YYYY"),
                            dayofEndDate: Moment(tomorrow).format("ddd"),
                            // valueEventTitle : "Travel with " + this.state.userFirstName + " " + this.state.userLastName,
                            loading: false
                        });
                    }

                }
            }
        } else {
            if (response != undefined && response != null && response.length > 0) {
                Alert.alert(response.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
            this.props.navigation.navigation.goBack();
        }
        this.setState({
            loading: false
        });
    }


    /**
    * save event data to server
    */
    saveEventDetail = () => {

        if(this.state.selected_event_category < 0) {
            Alert.alert("Warning!", "Please select category.");
            return;
        }

        let title = this.state.valueEventTitle.trim();
        let fromDate = this.state.valueStartDateOfEvent.trim();
        let toDate = this.state.valueEndDateOfEvent.trim();
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
        } else if (ValidationUtils.isEmptyOrNull(fromDate)) {
            Alert.alert(Constants.EMPTY_EVENT_START_DATE);
            return;
        } else if (ValidationUtils.isEmptyOrNull(toDate)) {
            Alert.alert(Constants.EMPTY_EVENT_END_DATE);
            return;
        } else if (ValidationUtils.isEmptyOrNull(venueAddress)) {
            Alert.alert(Constants.EMPTY_EVENT_LOCATION);
            return;
        } 
        // else if (ValidationUtils.isEmptyOrNull(description)) {
        //     Alert.alert(Constants.EMPTY_EVENT_DESCRIPTION);
        //     return;
        // }
        // else if (ValidationUtils.isEmptyOrNull(fromTime)) {
        //     alert(Constants.EMPTY_EVENT_START_TIME);
        //     return;
        // } else if (ValidationUtils.isEmptyOrNull(toTime)) {
        //     alert(Constants.EMPTY_EVENT_END_TIME);
        //     return;
        // }
        else {
            let from1 = Moment(fromDate).format("YYYY-MM-DD");
            let from2 = Moment(toDate).format("YYYY-MM-DD")
            if (from1 > from2) {
                Alert.alert(Constants.EMPTY_EVENT_END_DATE_SMALL);
                return;
            }
        }

        if(this.state.valueMalePercent != "" && this.state.valueFemalePercent != "" && (parseInt(this.state.valueMalePercent, 10) > 100 || parseInt(this.state.valueFemalePercent, 10) > 100)) {
            Alert.alert(Constants.INVALIDE_RSVP_PERCENTAGE);
            return;
        }

        try {
            if (this.state.locationInfo != null && this.state.locationInfo[0]) {
                this.nextStep();
            } else {
                this.setState({
                    loading: true
                });
                WebService.getPlaceDetails(
                    venueAddress,
                    this.handlePlaceDetailResponse
                );
            }
        } catch (error) {
            console.log(TAG, " callScheduleAPI locationInfo error " + error)
            this.setState({
                loading: false
            });
        }
    }

    handlePlaceDetailResponse = (response, isError) => {
        console.log(TAG + " callGetPlaceDetail Response " + JSON.stringify(response));
        console.log(TAG + " callGetPlaceDetail isError " + isError);
        if (!isError) {
            var result = response;
            if (typeof result != "undefined" && result != null) {
                this.setState({
                    locationInfo: result
                })
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

        console.log(TAG, 'nextStep  image = ', JSON.stringify(this.state.valueEventImage));
        if (ValidationUtils.isEmptyOrNull(this.state.valueEventImage.uri)) {
            if (this.state.eventId !== '') {
                this.callCreateEventAPI(true);
            }
            else {
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

            let uri = Memory().env == "LIVE" ? Global.URL_UPLOAD_EVENT_IMAGE : Global.URL_UPLOAD_EVENT_IMAGE_DEV;
            let params = new FormData();

            params.append("format", "json");
            params.append("user_id", this.state.userId);
            params.append("token", this.state.userToken);
            params.append('event_image', {
                uri: this.state.valueEventImage.uri,
                type: 'image/jpeg',
                name: 'testPhotoName.jpg'
            });


            console.log(TAG + " callUploadEventImageAPI uri " + uri);
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
        console.log(TAG + " callUploadEventImageAPI Response " + JSON.stringify(response));
        console.log(TAG + " callUploadEventImageAPI isError " + isError);

        if (!isError) {
            var result = response;

            if (result != undefined && result != null) {
                if (result.filePath != undefined && result.filePath != null) {
                    this.setState({
                        eventImagePath: result.filePath
                    });
                }
                if (eventId !== '') {
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

            this.setState({
                loading: true
            });
            let uri
            if (isEdit && !this.props.route.params.isCopy) {
                uri = Memory().env == "LIVE" ? Global.URL_EDIT_TRAVEL + eventId : Global.URL_EDIT_TRAVEL_DEV + eventId
            }
            else {
                uri = Memory().env == "LIVE" ? Global.URL_CREATE_TRAVEL : Global.URL_CREATE_TRAVEL_DEV
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
            }

            let params = new FormData();

            params.append("format", "json");
            params.append("user_id", this.state.userId);
            params.append("token", this.state.userToken);
            // params.append("from_time", this.state.valueStartTimeOfEvent);
            // params.append("to_time", this.state.valueEndTimeOfEvent);
            params.append("time_zone", RNLocalize.getTimeZone());
            params.append("from_date", this.state.valueStartDateOfEvent);
            params.append("to_date", this.state.valueEndDateOfEvent);
            params.append("from_time_zone", this.state.from_time_zone);
            params.append("to_time_zone", this.state.to_time_zone);
            params.append("street_number_map", "");
            params.append("route_map", "");
            params.append("postal_code", postal_code);
            params.append("venue_address", location);
            params.append("country_code", country_code);
            params.append("country", country);
            params.append("state_code", state_code);
            params.append("state", state);
            params.append("city", city);
            params.append("event_category", this.state.eventCategoryList[this.state.selected_event_category].id);
            params.append("visibility", this.state.category_array[this.state.selected_category].value);
            params.append("full_day", this.state.isFullDay);
            params.append("title", convertEmojimessagetoString(this.state.valueEventTitle.trim()));
            params.append("description", convertEmojimessagetoString(this.state.valueEventDescription.trim()));
            params.append("is_post", "true");
            params.append('event_image_path', this.state.eventImagePath);
            params.append('available_spaces', this.state.valueAvailableSpace);
            if(this.state.category_array[this.state.selected_category].value == 2 || this.state.past_event) {
                params.append('notify_invitees', 0);
                params.append('notified_all', 0);
            } else {
                if(this.state.notifyChange) {
                    params.append('notify_invitees', 1);
                    params.append('notified_all', 1);
                } else {
                    params.append('notify_invitees', 0);
                    params.append('notified_all', 0);
                }
            }

            const data = {
                format: 'json',
                user_id: this.state.userId,
                token: this.state.userToken,
                time_zone: RNLocalize.getTimeZone(),
                "from_date": this.state.valueStartDateOfEvent,
                "to_date": this.state.valueEndDateOfEvent,
                "from_time_zone": this.state.from_time_zone,
                "to_time_zone": this.state.to_time_zone,
                "street_number_map": "",
                "route_map": "",
                "postal_code": postal_code,
                "venue_address": location,
                "country_code": country_code,
                "country": country,
                "state_code": state_code,
                "state": state,
                "city": city,
                "event_category": this.state.eventCategoryList[this.state.selected_event_category].id,
                "visibility": this.state.category_array[this.state.selected_category].value,
                "full_day": this.state.isFullDay,
                "title": convertEmojimessagetoString(this.state.valueEventTitle.trim()),
                "description": convertEmojimessagetoString(this.state.valueEventDescription.trim()),
                "is_post": "true",
                'event_image_path': this.state.eventImagePath,
                'available_spaces': this.state.valueAvailableSpace,
            }
            if(this.state.category_array[this.state.selected_category].value == 2 || this.state.past_event) {
                data['notify_invitees'] = 0;
                data['notified_all'] = 0;
            } else {
                if(this.state.notifyChange) {
                    data['notify_invitees'] = 1;
                    data['notified_all'] = 1;
                } else {
                    data['notify_invitees'] = 0;
                    data['notified_all'] = 0;
                }
            }

            console.log(TAG + " callCreateEventAPI uri " + uri);
            console.log(TAG + " callCreatetravelAPI paramsssssss " + JSON.stringify(data));

            if (isInvited == 2) {
                WebService.callServicePost(
                    uri,
                    data,
                    this.handleCreateEventResponseWithInvitee
                );
            } else {
                WebService.callServicePost(
                    uri,
                    data,
                    this.handleCreateEventResponseWithoutInvitee
                );
            }

        } catch (error) {
            console.log("create travel api error", error);
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
        console.log(TAG + " Response " + response);
        console.log(TAG + " isError " + isError);
        isInvited = 0;
        if (!isError) {
            var result = response;
            if (result != undefined && result != null) {
                console.log(TAG + " callMyProfileDetailAPI result0000000 " + JSON.stringify(result));
                this.goToEventScreen();
            }
        } else {
            if (response != undefined && response != null && response.length > 0) {
                Alert.alert(response.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
            // Alert.alert(Constants.NO_INTERNET, "");
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
    handleCreateEventResponseWithInvitee = (response, isError) => {
        isInvited = 0;
        console.log(TAG + " Response " + response);
        console.log(TAG + " isError " + isError);

        if (!isError) {
            var result = response;
            if (result != undefined && result != null) {
                console.log(TAG + " callMyProfileDetailAPI result " + JSON.stringify(result));
                if (!result.event_id) {
                    // this.props.navigation.navigate("InviteFriend", {
                    //     eventId: eventId,
                    //     goToEventScreen: this.goToEventScreen,
                    //     eventName:this.state.valueEventTitle,
                    //     fullInvite: this.props.route.params.data ? true : false
                    // })
                    this.callEventDetailAPI(eventId);
                }
                else {
                    // this.props.navigation.navigate("InviteFriend", {
                    //     eventId: result.event_id,
                    //     goToEventScreen: this.goToEventScreen,
                    //     eventName:this.state.valueEventTitle,
                    //     fullInvite: this.props.route.params.data ? true : false
                    // })
                    this.callEventDetailAPI(result.event_id);

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
        console.log(TAG, "goToEventScreen called")

        //this.props.route.params.loadAfterDeletingEvent(false);
        if(this.props.route.params)
            await this.props.route.params.updateHostEvent();
        setTimeout(() => this.props.navigation.goBack(), 100);
    }

    handleStartDatePicked = date => {

        this.setState({
            isStartDatePickerVisible: false,
            valueStartDateOfEvent: Moment(date).format("MM/DD/YYYY"),
            dayofStartDate: Moment(date).format("ddd"),
            endMinDate: Moment(date).format("MM/DD/YYYY")
        }, () => {
            // let from1 = Moment(date).format("YYYY-MM-DD");
            // let from2 = Moment(this.state.valueEndDateOfEvent).format("YYYY-MM-DD")
            if (date > new Date(this.state.valueEndDateOfEvent)) {
                this.setState({
                    valueEndDateOfEvent: this.state.valueStartDateOfEvent,
                    dayofStartDate: Moment(this.state.valueStartDateOfEvent).format("ddd"),
                    isEndDateSelect: true,
                    startMaxDate: date
                });
            }
        })
        if(this.state.event_create_type == "edit_event") {
            if(this.state.category_array[this.state.selected_category].value != 2) {
                this.setState({
                    notifyChange: true
                })
            }
        }
    }

    handleEndDatePicked = date => {
        this.setState({
            isEndDatePickerVisible: false,
            valueEndDateOfEvent: Moment(date).format("MM/DD/YYYY"),
            dayofEndDate: Moment(date).format("ddd"),
            isEndDateSelect: true,
            startMaxDate: date,
        })
        if(date < new Date()) {
            this.setState({
                notifyChange: false,
                past_event: true
            })
        } else {
            this.setState({
                past_event: false,
            })
            if(this.state.event_create_type == "edit_event") {
                if(this.state.category_array[this.state.selected_category].value != 2) {
                    this.setState({
                        notifyChange: true
                    })
                }
            }
        }
    }

    sendReminders = async() => {
        if(this.state.send_reminders_type == "everyone") {
            if(this.state.total_confirmed == 0) {
                return;
            }
        }
        if(this.state.send_reminders_type == "not_replied") {
            if(this.state.total_non_replied == 0) {
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
            if(this.state.send_reminders_type == "everyone") {
                params.append("notify_all", 1);
            } else if(this.state.send_reminders_type == "not_replied") {
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
                if(result.status == "success") {
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

    render() {
        return (
            <Fragment>
                <SafeAreaView style={{backgroundColor:Colors.black,flex:0}}/>
            {/* <SafeAreaView style={{backgroundColor:Colors.white,flex:1}}> */}
                {this.renderPopupView()}
                {this.renderCalenderStart()}
                {this.renderCalenderEnd()}
                <View style={{ width:'100%',height:'100%',backgroundColor:'white'}}>
                    {/* <DateTimePicker */}
                    {/*     isVisible={this.state.isStartDatePickerVisible} */}
                    {/*     onConfirm={this.handleStartDatePicked} */}
                    {/*     onCancel={() => this.setState({isStartDatePickerVisible: false})} */}
                    {/*     date={this.state.valueStartDateOfEvent == "" ? new Date() : new Date(this.state.valueStartDateOfEvent)} */}
                    {/*     minimumDate = {(this.props.route.params.data != null) ? null : new Date()} */}
                    {/*     mode = {"date"} */}
                    {/* /> */}
                    {/* <DateTimePicker */}
                    {/*     isVisible={this.state.isEndDatePickerVisible} */}
                    {/*     onConfirm={this.handleEndDatePicked} */}
                    {/*     onCancel={() => this.setState({isEndDatePickerVisible: false})} */}
                    {/*     date={this.state.valueEndDateOfEvent == "" ? new Date() : new Date(this.state.valueEndDateOfEvent)} */}
                    {/*     minimumDate = {new Date(this.state.valueStartDateOfEvent)} */}
                    {/*     mode = {"date"} */}
                    {/* /> */}
                    {this.renderHeaderView()}
                    {this.renderBannerView()}
                    {this.renderEventForm()}
                    {this.state.send_reminders_popup_show && this.renderSendRemindersView()}
                    {this.state.loading == true && <ProgressIndicator />}
                </View>
            {/* </SafeAreaView> */}
            </Fragment>
        );
    }

    renderBannerView = () => {
        return (
            <BannerView
                screenProps = {this.props.navigation}
            />
        )
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
                showModel={this.state.showModel}
                openMyAccountScreen={(show_myaccount, myaccount_initial_tab) => {this.props.navigation.navigate('Dashboard', {selected_screen: "myaccount", myaccount_initial_tab: myaccount_initial_tab})}}
                logoutUser={this.logoutUser}
                closeDialog={() => { this.setState({ showModel: false }) }}
                prop_navigation = {this.props.navigation}
            >

            </CustomPopupView>
        );
    }

    handleEditCompleteSearchText = () => {
        searchText = this.state.searchText.trim();
        this.setState({
            searchText: searchText,
        });
        if (searchText.length > 0) {
            this.props.navigation.navigate('Dashboard', {selected_screen: "members", search_text: searchText});
        }
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
                        onSubmitEditing={this.handleEditCompleteSearchText}
                        keyboardType='ascii-capable'
                        placeholder="Search members..."
                    />
                    <TouchableOpacity style={stylesGlobal.header_searchiconview_style} onPress = {() => {
                        if(this.state.searchText == "") {
                            this.refs.searchTextInput.focus();
                        } else {
                            this.setState({
                                searchText: ""
                            })
                            Keyboard.dismiss();
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
            </View>

        );
    };

    renderCalenderStart = () => {
        return (
            <Modal
                animationType="fade"
                transparent={true}
                // closeOnClick={true}
                visible={this.state.isStartDatePickerVisible}
                onRequestClose={() => this.setState({ isStartDatePickerVisible: false })}
                supportedOrientations={['portrait', 'landscape']}
            >
                <KeyboardAvoidingView style={{ flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center'}} contentContainerStyle={{ flex: 1 }} behavior={Platform.OS == "ios" ? "padding" : null} keyboardVerticalOffset={isIphoneX() ? getBottomSpace() + 15 : 18} enabled>
                    <View style={stylesGlobal.popup_bg_blur_view}></View>
                    <View style={stylesGlobal.popup_main_container}>
                        <View style={stylesGlobal.popup_title_view}>
                            <Text style={[stylesGlobal.popup_title_text, stylesGlobal.font]}>{"Select Date"}</Text>
                            <TouchableOpacity style={stylesGlobal.popup_cancel_button} onPress={() => this.setState({ isStartDatePickerVisible: false })}>
                                <Image style={stylesGlobal.cancel_delete_image} source={require('../icons/connection-delete.png')} />
                            </TouchableOpacity>
                        </View>
                        <View style={stylesGlobal.popup_desc_container}>
                           
                            <View style={{width: '100%'}}>
                                <Calendar 
                                     initialDate={this.state.valueStartDateOfEvent == "" ? new Date() : new Date(this.state.valueStartDateOfEvent)} 
                                    // initialDate={'2023-03-30'}
                                    // minDate={(this.props.route.params.data != null) ? null : new Date() }
                                    
                                    onDayPress={day => { this.setState({ isStartDatePickerVisible: false }, () => {this.handleStartDatePicked(day.dateString) });}}
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

    renderCalenderEnd = () => {
        return (
            <Modal
                animationType="fade"
                transparent={true}
                // closeOnClick={true}
                visible={this.state.isEndDatePickerVisible}
                onRequestClose={() => this.setState({ isEndDatePickerVisible: false })}
                supportedOrientations={['portrait', 'landscape']}
            >
                <KeyboardAvoidingView style={{ flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center'}} contentContainerStyle={{ flex: 1 }} behavior={Platform.OS == "ios" ? "padding" : null} keyboardVerticalOffset={isIphoneX() ? getBottomSpace() + 15 : 18} enabled>
                    <View style={stylesGlobal.popup_bg_blur_view}></View>
                    <View style={stylesGlobal.popup_main_container}>
                        <View style={stylesGlobal.popup_title_view}>
                            <Text style={[stylesGlobal.popup_title_text, stylesGlobal.font]}>{"Select Date"}</Text>
                            <TouchableOpacity style={stylesGlobal.popup_cancel_button} onPress={() => this.setState({ isEndDatePickerVisible: false })}>
                                <Image style={stylesGlobal.cancel_delete_image} source={require('../icons/connection-delete.png')} />
                            </TouchableOpacity>
                        </View>
                        <View style={stylesGlobal.popup_desc_container}>
                           
                            <View style={{width: '100%'}}>
                                <Calendar 
                                     initialDate={this.state.valueEndDateOfEvent == "" ? new Date() : new Date(this.state.valueEndDateOfEvent)} 
                                    // initialDate={'2023-03-30'}
                                    // minDate={(this.props.route.params.data != null) ? null : new Date() }
                                    
                                    onDayPress={day => { this.setState({ isEndDatePickerVisible: false }, () => {this.handleEndDatePicked(day.dateString) });}}
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
        return(
            <View style = {{position: 'absolute', top: 0, left: 0, bottom: 0, right: 0, alignItems: 'center', justifyContent: 'center', zIndex: 10, elevation: 10}}>
                <View style = {{position: 'absolute', top: 0, left: 0, bottom: 0, right: 0, backgroundColor: Colors.black, opacity: 0.3}}></View>
                <View style = {{width: '90%', borderRadius: 5, backgroundColor: Colors.white}}>
                    <View style = {{width: '100%', padding: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomColor: Colors.gray, borderBottomWidth: 0.5}}>
                        <Text style = {[{fontSize: 18, color: Colors.black}, stylesGlobal.font]}>{"Send Reminders"}</Text>
                        <TouchableOpacity style = {{padding: 5}} onPress = {() => this.setState({send_reminders_popup_show: false})}>
                            <Image style = {{width: 15, height: 15, tintColor: Colors.gold}} source={require('../icons/connection-delete.png')}/>
                        </TouchableOpacity>
                    </View>
                    <View style = {{width: '100%', padding: 20, borderBottomColor: Colors.gray, borderBottomWidth: 0.5}}>
                        <TouchableOpacity style = {{width: '100%', flexDirection: 'row', alignItems: 'center'}} onPress = {() => this.setState({send_reminders_type: "everyone"})}>
                            <View style = {{width: 20, height: 20, marginEnd: 10}}>
                                <Image style={{width: '100%', height: '100%', resizeMode:'contain'}} source={require('../icons/square.png')} />
                            {
                                this.state.send_reminders_type == "everyone" && //not_replied
                                <Image style={{position:'absolute', top: 0, left:0, width:20, height:25, resizeMode:'contain'}} source={require('../icons/checked.png')} />
                            }
                            </View>
                            <Text style = {[{fontSize: 14, color: this.state.send_reminders_type == "everyone" ? Colors.gold : Colors.black}, stylesGlobal.font]}>{"Message Everyone"}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style = {{width: '100%', flexDirection: 'row', alignItems: 'center', marginTop: 15}} onPress = {() => this.setState({send_reminders_type: "not_replied"})}>
                            <View style = {{width: 20, height: 20, marginEnd: 10}}>
                                <Image style={{width: '100%', height: '100%', resizeMode:'contain'}} source={require('../icons/square.png')} />
                            {
                                this.state.send_reminders_type == "not_replied" && //not_replied
                                <Image style={{position:'absolute', top: 0, left:0, width:20, height:25, resizeMode:'contain'}} source={require('../icons/checked.png')} />
                            }
                            </View>
                            <Text style = {[{fontSize: 14, color: this.state.send_reminders_type == "not_replied" ? Colors.gold : Colors.black}, stylesGlobal.font]}>{"Only Message Guests Who Have Not Replied"}</Text>
                        </TouchableOpacity>
                        <TextInput
                            multiline={true}
                            returnKeyType='default'
                            placeholder = "Your Message"
                            underlineColorAndroid="transparent"
                            autoCapitalize='sentences'
                            onChangeText={value => {
                                this.setState({ send_reminder_message: value })
                            }}
                            value={this.state.send_reminder_message}
                            style={[{width: '100%', height: 120, borderRadius: 5, borderColor: Colors.black, borderWidth: 0.5, fontSize: 14, padding: 10, marginTop: 10}, stylesGlobal.font]}
                            onSubmitEditing={(event) => {

                            }}
                        ></TextInput>
                    </View>
                    <View style = {{width: '100%', padding: 20, flexDirection: 'row', justifyContent: 'flex-end'}}>
                        <TouchableOpacity style = {[{paddingHorizontal: 15, paddingVertical: 10, backgroundColor: Colors.gold, borderRadius: 5, marginEnd: 10}, stylesGlobal.shadow_style]} onPress = {() => this.sendReminders()}>
                            <Text style = {[{fontSize: 14, color: Colors.white}, stylesGlobal.font]}>{"Send("}{this.state.send_reminders_type == "everyone" ? this.state.total_confirmed : this.state.total_non_replied}{")"}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style = {[{paddingHorizontal: 15, paddingVertical: 10, backgroundColor: Colors.gold, borderRadius: 5}, stylesGlobal.shadow_style]}
                            onPress = {() => 
                                this.setState({
                                    send_reminders_popup_show: false
                                })
                            }
                        >
                            <Text style = {[{fontSize: 14, color: Colors.white}, stylesGlobal.font]}>{"Cancel"}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        )
    }

    renderAdvancingSetting = () => {
        return(
            <View style={[styles.headView, {marginBottom: 20}]}>
                <View style={{flexDirection:'row', alignItems: 'center'}}>
                    <Text style={[styles.headingText, stylesGlobal.font_bold]}>{"Availables spaces"}</Text>
                    <Tooltip
                        isVisible={this.state.showToolTip_availableSpace}
                        content={
                            <View style = {{paddingVertical: 15, paddingHorizontal: 15, backgroundColor: Colors.tooltip_background}}>
                                <Text style = {[{fontSize: 13, color: Colors.black}, stylesGlobal.font]}>{Constants.EVENT_AVAILABLE_SPACES_TOOLTIP}</Text>
                            </View>
                        }
                        onClose={() => this.setState({showToolTip_availableSpace: false})}
                        placement="top"
                        backgroundColor = {'rgba(0,0,0,0.2)'}
                        topAdjustment={Platform.OS === 'android' ? -StatusBar.currentHeight : 0}
                        arrowSize = {{width: 0, height: 0}}
                    >
                        <TouchableOpacity
                            style={{ width: 20, height: 20, marginHorizontal: 5}}
                            onPress={() => this.setState({showToolTip_availableSpace: true})}
                        >
                            <Image style={{width: '100%', height: '100%', resizeMode: 'contain'}} source={require('../icons/tooltip.png')}/>
                        </TouchableOpacity>
                    </Tooltip>
                    <Text style={[{fontSize: 13, color: Colors.black},, stylesGlobal.font]}>{"(optional)"}</Text>
                </View>

                <View style={[styles.headView, {marginTop: 0}]}>
                    
                    <View style = {{width: '100%', flexDirection: 'row', alignItems: 'center'}}>
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
                            style={[styles.textInputText, stylesGlobal.font, {width: '100%'}]}
                            onSubmitEditing={(event) => {
                                //this.refs.valueLastName.focus();
                            }}
                            keyboardType={'number-pad'}
                        />
                    </View>
                    <Text style = {[{fontSize: 13, color: Colors.black}, stylesGlobal.font]}>{"leave blank if no limit"}</Text>
                </View>

                <View style={{flexDirection:'row', alignItems: 'center', flexWrap: 'wrap', marginTop: 10}}>
                    <Text style={[styles.headingText, stylesGlobal.font_bold]}>{"Male to Female RSVP Percentage"}</Text>
                    <Tooltip
                        isVisible={this.state.showToolTip_percentage}
                        content={
                            <View style = {{paddingVertical: 15, paddingHorizontal: 15, backgroundColor: Colors.tooltip_background}}>
                                <Text style = {[{fontSize: 13, color: Colors.black}, stylesGlobal.font]}>{Constants.EVENT_RSVP_PERCENTAGE_TOOLTIP}</Text>
                            </View>
                        }
                        onClose={() => this.setState({showToolTip_percentage: false})}
                        placement="top"
                        backgroundColor = {'rgba(0,0,0,0.2)'}
                        topAdjustment={Platform.OS === 'android' ? -StatusBar.currentHeight : 0}
                        arrowSize = {{width: 0, height: 0}}
                    >
                        <TouchableOpacity
                            style={{ width: 20, height: 20, marginHorizontal: 5}}
                            onPress={() => this.setState({showToolTip_percentage: true})}
                        >
                            <Image style={{width: '100%', height: '100%', resizeMode: 'contain'}} source={require('../icons/tooltip.png')}/>
                        </TouchableOpacity>
                    </Tooltip>
                    <Text style={[{fontSize: 13, color: Colors.black}, stylesGlobal.font]}>{"(optional)"}</Text>
                </View>
                 <View style={[styles.headView, {width: '100%', marginTop: 0}]}>
                            
                    <View style = {{width: '100%', flexDirection: 'row', alignItems: 'center', marginTop: 5}}>
                        <View style = {{width: '45%', flexDirection: 'row', alignItems: 'center'}}>
                            <View style = {{width: 80, flexDirection: 'row', borderWidth: 1, borderColor: Colors.black, borderRadius: 5, alignItems: 'center'}}>
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
                                            this.setState({ valueFemalePercent: '', valueMalePercent: ''})
                                          
                                        }
                                    }}
                                    value={this.state.valueMalePercent}
                                    style={[styles.textInputText, stylesGlobal.font, {flex: 1, borderWidth: 0}]}
                                    onSubmitEditing={(event) => {
                                        //this.refs.valueLastName.focus();
                                    }}
                                    keyboardType={'number-pad'}
                                />
                                <Text style={[{fontSize: 14, color: Colors.black, marginHorizontal: 10}, stylesGlobal.font]}>{"%"}</Text>
                            </View>
                            <Text style={[{fontSize: 14, color: Colors.black, marginStart: 10, marginEnd: 30}, stylesGlobal.font]}>{"Male"}</Text>
                        </View>
                        <View style = {{width: '55%', flexDirection: 'row', alignItems: 'center'}}>
                            <View style = {{width: 80, flexDirection: 'row', borderWidth: 1, borderColor: Colors.black, borderRadius: 5, alignItems: 'center'}}>
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
                                            this.setState({ valueFemalePercent: '', valueMalePercent: '' })
                                            
                                        }   
                                    }}
                                    value={this.state.valueFemalePercent}
                                    style={[styles.textInputText, stylesGlobal.font, {flex: 1, borderWidth: 0}]}
                                    onSubmitEditing={(event) => {
                                        //this.refs.valueLastName.focus();
                                    }}
                                    keyboardType={'number-pad'}
                                />
                                <Text style={[{fontSize: 14, color: Colors.black, marginHorizontal: 10}, stylesGlobal.font]}>{"%"}</Text>
                            </View>
                            <Text style={[{fontSize: 14, color: Colors.black, marginStart: 10, marginEnd: 30}, stylesGlobal.font]}>{"Female"}</Text>
                        </View>
                    </View>
                </View>

                <View style={[styles.headView, {width: '100%', marginTop: 10, flexDirection: 'row'}]}>
                    <View style = {{width: '45%'}}>
                        <Text style={[styles.headingText, stylesGlobal.font_bold]}>{"Close Guest List:"}</Text>
                        <Text style={[{fontSize: 13, color: Colors.black}, stylesGlobal.font]}>{"(optional)"}</Text>
                        <View style={{flexDirection: 'row'}}>
                            <View style = {{width: 80, flexDirection: 'row',  marginTop: 5, borderWidth: 1, borderColor: Colors.black, borderRadius: 5, alignItems: 'center'}}>
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
                                    style={[styles.textInputText, stylesGlobal.font, {flex: 1, borderWidth: 0}]}
                                    onSubmitEditing={(event) => {
                                        //this.refs.valueLastName.focus();
                                    }}
                                    keyboardType={'number-pad'}
                                />
                            </View>
                            <View style={{marginLeft: 10}}>
                                <Text style={[{fontSize: 13, color: Colors.black, marginVertical: 5}, stylesGlobal.font]}>{"Hours"}</Text>
                                <Text style={[{fontSize: 13, color: Colors.black, marginVertical: 5}, stylesGlobal.font]}>{"before"}</Text>
                            
                            </View>
                            
                        </View>
                        
                    </View>

                    <View style = {{width: '55%', }}>
                        <Text style={[styles.headingText, stylesGlobal.font_bold, , { flexWrap: 'nowrap', overflow: 'visible', width: '150%'}]}>{"Send RSVP Reminders:"}</Text>
                        <Text style={[{fontSize: 13, color: Colors.black}, stylesGlobal.font]}>{"(optional)"}</Text>
                        <View style={{flexDirection: 'row', }}>
                            <View style = {{width: 80, flexDirection: 'row', marginTop: 5, borderWidth: 1, borderColor: Colors.black, borderRadius: 5, alignItems: 'center'}}>
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
                                    style={[styles.textInputText, stylesGlobal.font, {flex: 1, borderWidth: 0}]}
                                    onSubmitEditing={(event) => {
                                        //this.refs.valueLastName.focus();
                                    }}
                                    keyboardType={'number-pad'}
                                />

                            </View>
                            
                           <View style={{marginLeft: 10}}>
                                <Text style={[{fontSize: 13, color: Colors.black, marginVertical: 5}, stylesGlobal.font]}>{"Hours"}</Text>
                                <Text style={[{fontSize: 13, color: Colors.black, marginVertical: 5}, stylesGlobal.font]}>{"before"}</Text>
                            </View>
                        </View>
                    </View>
                </View>
                {this.state.event_create_type != "edit_event" && 
                    <View style={[styles.headView, { width: '100%', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', marginTop: 10, }]}>
                        {

                            <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center' }}
                                // disabled={this.state.event_create_type == "edit_event" ? false : true}
                                onPress={() => {
                                    this.setState({ notifyChange: !this.state.notifyChange })
                                }}
                            >
                                <Image source={require('../icons/square.png')} style={{ width: 20, height: 20, resizeMode: 'contain' }} />
                                {this.state.notifyChange && <Image source={require('../icons/checked.png')} style={{ position: 'absolute', left: 0, width: 20, height: 20, resizeMode: 'contain' }} />}
                                <Text style={[{ fontSize: 13, color: Colors.black, marginStart: 10 }, , stylesGlobal.font]}>{"Notify All Members about this trip"}</Text>
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
            <SafeAreaView style={styles.container}>
                <View style = {styles.card_view}>
                    <View style={{ alignItems: 'center', width: '100%', height: 40, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.card_titlecolor }}>
                        <Text style={[styles.headText, stylesGlobal.font]}>{this.state.event_create_type == "edit_event" ? "EDIT TRIP" : "HOST A TRIP"}</Text>
                    </View>
                    <KeyboardAwareScrollView style={{width: '100%', }} extraScrollHeight={100} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps = {'handled'}>
                        {/* <View style={[styles.headView, {flex: 1,}]}>
                            <View style={{flexDirection:'row', marginBottom: 5}}>
                                <Text style={[{color:'red'}, stylesGlobal.font]}>{"*"}</Text>
                                <Text style={[styles.headingText, stylesGlobal.font]}>{"Trip Title"}</Text>
                            </View>
                            <TextInput
                                ref='valueEventTitle'
                                multiline={false}
                                returnKeyType='done'
                                numberOfLines={1}
                                underlineColorAndroid="transparent"
                                autoCapitalize='sentences'
                                onChangeText={value => {
                                    this.setState({ valueEventTitle: value })
                                }}
                                value={this.state.valueEventTitle}
                                style={[styles.textInputText, stylesGlobal.font]}
                                onSubmitEditing={(event) => {
                                    //this.refs.valueLastName.focus();
                                }}
                                // keyboardType={Platform.OS === 'android' ? 'email-address' : 'ascii-capable'}
                            />
                        </View> */}
                        <View style={[styles.headView, {flexDirection:'row', alignItems: 'center', justifyContent: 'space-between'}]}>
                            <View style={[ {flex: 1, marginRight: 10 }]}>
                                <View style={{flexDirection:'row'}}>
                                    <Text style={[{color:'red'}, stylesGlobal.font]}>{"*"}</Text>
                                    <Text style={[styles.headingText, stylesGlobal.font]}>{"Trip Title"}</Text>
                                </View>
                                <TextInput
                                    ref='valueEventTitle'
                                    multiline={false}
                                    returnKeyType='done'
                                    numberOfLines={1}
                                    underlineColorAndroid="transparent"
                                    autoCapitalize='sentences'
                                    onChangeText={value => {
                                        this.setState({ valueEventTitle: value })
                                    }}
                                    value={this.state.valueEventTitle}
                                    style={[styles.textInputText, stylesGlobal.font]}
                                    onSubmitEditing={(event) => {
                                        //this.refs.valueLastName.focus();
                                    }}
                                    // keyboardType={Platform.OS === 'android' ? 'email-address' : 'ascii-capable'}
                                />
                            </View>
                            <View style={{alignItems:'center', marginTop: 5}}>
                                <Text style={[styles.headingText, stylesGlobal.font]}>{"Visibility"}</Text>
                                <ModalDropdown 
                                    dropdownStyle = {styles.visibility_container_view}
                                    defaultIndex = {0}
                                    options = {this.state.category_array}
                                    onDropdownWillShow = {() => Keyboard.dismiss()}
                                    onSelect = {(index) => {
                                        this.setState({
                                            selected_category: index
                                        }, () => this.setNotifyChangeText())
                                    }}
                                    renderButton = {() => {
                                        return (
                                            <View style={{ alignItems: 'center', justifyContent: 'center'}}>
                                                <Image style={{width: 40, height: 40, resizeMode: 'contain'}} source={this.state.category_array[this.state.selected_category].icon_path}/>
                                                <Text style={[{fontSize: 13}, stylesGlobal.font]}>{this.state.category_array[this.state.selected_category].label}</Text>
                                            </View>
                                        )
                                    }}
                                    renderRow = {(item, index, highlighted) => {
                                        return (
                                            <View key = {index} style = {[styles.visibility_button, this.state.selected_category == index ? {backgroundColor: Colors.gold} : {backgroundColor: Colors.black}]}>
                                                <Image style = {{width: 20, height:20, marginLeft: 8}} resizeMode = {'contain'} source={item.icon_path}/>
                                                <Text style = {[styles.visibility_text, stylesGlobal.font, {marginLeft: 5}]}>{item.label}</Text>
                                            </View>
                                        )
                                    }}
                                />
                            </View>
                        </View>

                        <View style={styles.headView}>
                            <View style={{flexDirection:'row', marginBottom: 5}}>
                                <Text style={[{color:'red'}, stylesGlobal.font]}>{"*"}</Text>
                                <Text style={[styles.headingText, stylesGlobal.font]}>{"Description"}</Text>
                            </View>
                            <TouchableOpacity style={styles.textInputTextDescrip}
                                onPress={()=>this.valueEventDescription.focus()}
                                activeOpacity={1}
                            >
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
                                    style={stylesGlobal.font}
                                    onSubmitEditing={(event) => {

                                    }}
                                    // keyboardType={Platform.OS === 'android' ? 'email-address' : 'ascii-capable'}
                                ></TextInput>
                            </TouchableOpacity>
                        </View>
                        <View style={[styles.headView, {flexDirection:'row',justifyContent:'space-between'}]}>
                            <TouchableOpacity style = {{width: '45%'}} onPress={() => {
                                this.setState({
                                    isStartDatePickerVisible: true
                                })
                            }}>
                                {this.renderTextView('Date', this.state.valueStartDateOfEvent, this.state.dayofStartDate)}
                            </TouchableOpacity>
                            <TouchableOpacity style = {{width: '45%'}} onPress={() => {
                                this.setState({
                                    isEndDatePickerVisible: true
                                })
                            }}>
                                {this.renderTextView('', this.state.valueEndDateOfEvent, this.state.dayofEndDate)}
                            </TouchableOpacity>
                            {/* <View style={{width:'45%', flexDirection:'row', justifyContent:'space-between'}}>
                                <TouchableOpacity onPress={() => {
                                    this.setState({
                                        isStartDatePickerVisible: true
                                    })
                                }} style={{flex: 1}}>
                                    {this.renderTextView('Date', this.state.valueStartDateOfEvent)}
                                </TouchableOpacity>
                                <View style = {{justifyContent: 'flex-end', marginLeft: 15}}>
                                    <View style = {{height: 40, justifyContent: 'center'}}>
                                        <Text style = {stylesGlobal.font}>{this.state.dayofStartDate}</Text>
                                    </View>
                                </View>
                            </View>
                            <View style={{width:'45%', flexDirection:'row', justifyContent:'space-between'}}>
                                <TouchableOpacity onPress={() => {
                                    this.setState({
                                        isEndDatePickerVisible: true
                                    })
                                }} style={{flex: 1}}>
                                    {this.renderTextView('', this.state.valueEndDateOfEvent)}
                                </TouchableOpacity>
                                <View style = {{justifyContent: 'flex-end', marginLeft: 15}}>
                                    <View style = {{height: 40, justifyContent: 'center'}}>
                                        <Text style = {stylesGlobal.font}>{this.state.dayofEndDate}</Text>
                                    </View>
                                </View>
                            </View> */}
                        </View>

                        

                        {this.renderLocation('Destination', this.state.valueLocation, 'valueLocation')}

                        {/* <View style={styles.headView}>
                            <View style={{flexDirection:'row', marginBottom: 5}}>
                                <Text style={[styles.headingText, stylesGlobal.font]}>Availables spaces</Text>
                            </View>
                            <View style = {{width: '100%', flexDirection: 'row', alignItems: 'center'}}>
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
                                    value={this.state.valueAvailableSpace.toString()}
                                    style={[styles.textInputText, stylesGlobal.font, {width: '45%'}]}
                                    onSubmitEditing={(event) => {
                                        //this.refs.valueLastName.focus();
                                    }}
                                    keyboardType={'number-pad'}
                                />
                            </View>
                            <Text style = {[{fontSize: 13, color: Colors.black}, stylesGlobal.font]}>{"leave blank if no limit"}</Text>
                        </View> */}

                       

                        <View style={styles.headView}>
                            <Text style={[styles.headingText, stylesGlobal.font]}>{"Cover Image"} </Text>
                            <View style={[{ borderColor: Colors.black, borderRadius: 4, marginTop: 5, overflow:'hidden' }, stylesGlobal.font]}>
                            {this.ImageCompressor()}
                            </View>
                        </View>

                         <View style={[styles.headView, { marginTop: 20, paddingLeft: 0, paddingRight: 0, marginLeft: 0, marginRight: 0, marginBottom: this.state.isShowAdvancingSetting ? 0 : 10}]}>
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
                                    

                                </View>
                            }
                        </View>
                        {this.state.isShowAdvancingSetting ? this.renderAdvancingSetting() : null}
                        
                    {/* { */}
                    {/*     this.state.event_create_type != "edit_event" && */}
                    {/*     <View style = {{width: '100%', marginTop: 20, alignItems: 'center'}}> */}
                    {/*         <TouchableOpacity style = {[styles.submitGold, {marginBottom: 0}, stylesGlobal.shadow_style]} */}
                    {/*             onPress = {() =>  */}
                    {/*                 this.setState({ */}
                    {/*                     send_reminders_type: "everyone", */}
                    {/*                     send_reminder_message: "", */}
                    {/*                     send_reminders_popup_show: true */}
                    {/*                 }) */}
                    {/*             } */}
                    {/*         > */}
                    {/*             <Text style={[styles.submitTextWhite, stylesGlobal.font]}>{"Send Reminders Now"}</Text> */}
                    {/*         </TouchableOpacity> */}
                    {/*     </View> */}
                    {/* } */}
                    
                        {/* <View style={[{width: '100%', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', marginTop: 20}]}> */}
                        {/* {
                            (this.state.category_array[this.state.selected_category].value == 2 || this.state.past_event) &&
                            <View style = {{flexDirection: 'row', alignItems: 'center'}}>
                                <Image source={require('../icons/square.png')}  style={{width: 20, height: 20, resizeMode:'contain', tintColor: Colors.gray}}/>
                                <Text style = {[{fontSize: 13, color: Colors.gray, marginStart: 10}, stylesGlobal.font]}>{this.state.event_create_type == "edit_event" ? "Notify Guests about changes this Trip" : "Notify all " + this.state.notifyChangeText + " this Trip"}</Text>
                            </View>
                        } */}
                        {/* { */}
                        {/*     !(this.state.category_array[this.state.selected_category].value == 2 || this.state.past_event) && */}
                        {/*     <TouchableOpacity style = {{flexDirection: 'row', alignItems: 'center'}}  */}
                        {/*         disabled = {this.state.event_create_type == "edit_event" ? false : true} */}
                        {/*         onPress = {() => { */}
                        {/*             if(this.state.event_create_type == "edit_event") { */}
                        {/*                 this.setState({notifyChange: !this.state.notifyChange}) */}
                        {/*             } */}
                        {/*         }} */}
                        {/*     > */}
                        {/*         <Image source={require('../icons/square.png')}  style={{width: 20, height: 20, resizeMode:'contain'}}/> */}
                        {/*         {this.state.notifyChange && <Image source={require('../icons/checked.png')} style={{position:'absolute', left:0, width:20, height:20, resizeMode:'contain'}}/>} */}
                        {/*         <Text style = {[{fontSize: 13, color: Colors.black, marginStart: 10}, stylesGlobal.font]}>{this.state.event_create_type == "edit_event" ? "Notify Confirmed Guests about changes to this Trip" : "Notify also not personally invited " + this.state.notifyChangeText}</Text> */}
                        {/*     </TouchableOpacity> */}
                        {/* } */}
                        {/* </View> */}
                        {this.renderBottomButton()}

                    </KeyboardAwareScrollView>
                </View>
            </SafeAreaView>
        );
    };

    ImageCompressor = () => {
        return (
            <View>
                <FitImage
                    source={
                        (this.state.valueEventImage.uri === undefined || this.state.valueEventImage.uri == null || this.state.valueEventImage.uri == "" || this.state.valueEventImage.uri.length <= 0) ?
                            require("../icons/travelCover.jpg")
                            : { uri: this.state.valueEventImage.uri }
                    }
                    style={ { position: 'absolute',height: 300, width:'100%'  }}
                    resizeMode={"cover"}
                    defaultSource={require("../icons/travelCover.jpg")}
                />
                <FastImage
                    source={this.state.valueEventImage.uri != null ? { uri: this.state.valueEventImage.uri } : require("../icons/travelCover.jpg")}
                    style={{ height: 300, width:'100%' }}
                    resizeMode='cover'
                />
                <TouchableOpacity style={{height:40, flexDirection:'row',position:'absolute',bottom:0,right:0,backgroundColor:'transparent', }} onPress={() => this.showImagePicker()}>
                    <View style={{height: '100%', backgroundColor:Colors.white, paddingHorizontal:10, justifyContent:'center', }}>
                        <Text style={[{color: Colors.black}, stylesGlobal.font]}>{"Change Image"}</Text>
                    </View>
                    <View style={{height: '100%', aspectRatio: 1,  backgroundColor: Colors.white, alignItems:'center', justifyContent:'center', marginStart: 5}}>
                        <Image style={{width: '50%', height: '50%', resizeMode: 'contain'}} source={require('../icons/signup_upload.png')}/>
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
            <View style={styles.headView}>
                <View style={{flexDirection:'row', marginBottom: 5}}>
                    <Text style={[{color:'red'}, stylesGlobal.font]}>*</Text>
                    <Text style={[styles.headingText, stylesGlobal.font]}>{headerText}</Text>
                </View>
                {this.getGoogleAutoCompleteView()}
                <View style={styles.bottomView}></View>
            </View>
        );

    }

        /**
    * fetch place detail from google place
    */
    onGeoCodeSearchFunc = (data) => {
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

    getCurrentLocation = async() => {
        getUserLocation(
            position => {
                const { latitude, longitude } = position.coords;
                Geocoder.geocodePosition({lat: latitude, lng: longitude}).then(res => {
                    this.setState({
                        locationInfo: res,
                        searchedText: res[0].formattedAddress,
                        loading: false
                    }, () => {
                        location = res[0].formattedAddress
                    })
                    this.refs.ref_GooglePlacesAutocomplete.setAddressText(res[0].formattedAddress)
                }).catch(err => {
                    console.log(err)
                    // this.setState({
                    //     searchedText: res[0].formattedAddress,
                    //     loading: false
                    // }, () => {
                    //     location = res[0].formattedAddress
                    // })
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

        return (
            <View style = {{width: '100%', flexDirection: 'row', borderWidth: 1, borderColor: Colors.black, borderRadius:5, overflow: 'hidden'}}>
                <GooglePlacesAutocomplete
                    ref = "ref_GooglePlacesAutocomplete"
                    placeholder=''
                    minLength={3} // minimum length of text to search
                    autoFocus={false}
                    fetchDetails={false}
                    returnKeyType={'done'}
                    getDefaultValue={() => this.state.searchedText}
                    listViewDisplayed={false}  // true/false/undefined
                    fetchDetails={false}
                    renderDescription={(row) => row.description}
                    onPress={(data, details) => {
                        if(this.state.event_create_type == "edit_event") {
                            if(this.state.category_array[this.state.selected_category].value != 2 && !this.state.past_event) {
                                this.setState({
                                    notifyChange: true
                                })
                            }
                        }
                        this.onGeoCodeSearchFunc(data.description);
                        //this.refs.valueAvailableSpace.focus();
                    }}
                    onSubmitEditing = {() => {
                        this.onGeoCodeSearchFunc(location);
                       // this.refs.valueAvailableSpace.focus();
                    }}
                    query={query}
                    styles={{
                        textInputContainer: {
                            flex: 1,
                            backgroundColor: Colors.white,
                            height: 40,
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
                        description: [{fontSize: 13,}, stylesGlobal.font]
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
                {/* <TouchableOpacity style = {{height: 40, aspectRatio: 1, justifyContent: 'center', alignItems: 'center'}} onPress = {() => this.getCurrentLocation()}>
                    <Image style={{width: '60%', height: '60%', resizeMode: 'contain'}} source={require("../icons/pin.png")}/>
                </TouchableOpacity> */}
            </View>
        )
    };


    /**
     * display TextView View
     */
    renderTextView = (headerText, stateValue, dayValue) => {
        return (
            <View >
                <View style={{flexDirection:'row', marginBottom: 5}}>
                    <Text style={[{color:'red'}, stylesGlobal.font]}>*</Text>
                    <Text style={[styles.headingText, stylesGlobal.font]}>{headerText}</Text>
                </View>
                <View style={[styles.viewCenterText, {justifyContent: 'center', }]}>
                    <Text style={stylesGlobal.font}>{stateValue} {dayValue != null && dayValue != "" ? " (" + dayValue + ")" : ""}</Text>
                </View>
            </View>
        );

    }

    /**
        * display bottom save and cancel button
        */
    renderBottomButton = () => {

        let cancelButton = (<TouchableOpacity
            style={[styles.submitGold,  stylesGlobal.shadow_style]}
            underlayColor="#fff"
            onPress={() => {
                this.props.navigation.goBack();
            }}
        >
            <Text style={[styles.submitTextWhite, stylesGlobal.font]}>Cancel</Text>
        </TouchableOpacity>);
        
        let saveWithOutInviteButton = (<TouchableOpacity
            style={[styles.submitGold,  stylesGlobal.shadow_style]}
            underlayColor="#fff"
            onPress={() => {
                // isInvited = 1;
                isInvited = 2;
                this.saveEventDetail()
            }}
        >
            <Text style={[styles.submitTextWhite, stylesGlobal.font]}>{this.state.notifyChange && !this.state.past_event ? "Save" : "Save"}</Text>
        </TouchableOpacity>);

        let inviteFriendsButton = (<TouchableOpacity
            style={[styles.submitGold, stylesGlobal.shadow_style]}
            underlayColor="#fff"
            onPress={() => {
                isInvited = 2;
                this.saveEventDetail()
            }}
        >
            <Text style={[styles.submitTextWhite, stylesGlobal.font]}>Save & Invite Friends</Text>
        </TouchableOpacity>);

        return (
            <View>
            {
                this.state.event_create_type == "edit_event" &&
                <View style = {{width: '100%'}}>
                    <View style={{ alignItems: "center", flexDirection: 'row', justifyContent: 'center',  }}>
                        {/* {cancelButton} */}
                        {saveWithOutInviteButton}
                    </View>
                    <View style={{ alignItems: "center", justifyContent: 'center', }}>
                            
                         {cancelButton}
                    </View>
                </View>
                
            }
            {
                this.state.event_create_type == "create_event" &&
                <View style = {{width: '100%'}}>
                    <View style={{ alignItems: "center", justifyContent: 'center', }}>
                        {saveWithOutInviteButton}
                    </View>
                    {/* <View style={{width: '100%', alignItems: "center", flexDirection: 'row', justifyContent: 'center', }}> */}
                    {/*      */}
                    {/*     {inviteFriendsButton} */}
                    {/* </View> */}
                    <View style={{width: '100%', alignItems: "center", flexDirection: 'row', justifyContent: 'center', }}>
                        {cancelButton}
                        {/* {inviteFriendsButton} */}
                    </View>
                    
                </View>
            }
            {
                this.state.event_create_type == "copy_event" &&
                <View style = {{width: '100%'}}>
                    <View style={{width: '100%', alignItems: "center", flexDirection: 'row', justifyContent: 'center',}}>
                       
                        {copyFriendsButton}
                    </View>
                    <View style={{ alignItems: "center", justifyContent: 'center', }}>
                        {/* {saveWithOutInviteButton} */}
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
        if(text == null) {
            title = ""
        } else {
            title = text + " with "  + this.state.userFirstName + " " + this.state.userLastName;;
        }
        var image = null;
        switch (index) {
            case 0:
                image=null;
                break;
            case 1:
                // image = this.state.eventCategoryList[index - 1].default_image
                image = "https://cdn1.007percent.com/uploads/event_images/1599675711_21_03.jpg"
                break;
        }
        this.setState({
            selected_event_category: index - 1,
            // valueEventTitle: title,
            props_event_title: text,
            valueEventImage: {
                uri: image,
                type: 'image/jpeg',
                name: 'testPhotoName.jpg'
            }
        })
    }

    /** Handle Visibility DropDown Value
     *
     * @param text
     * @param index
     * @param data
     */
    onChangeTextVisibility = (text, index, data) => {
        

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

        /**
         * The first arg is the options object for customization (it can also be null or omitted for default options),
         * The second arg is the callback which sends object: response (more info below in README)
         */
        ImagePicker.showImagePicker(options, (response) => {
            console.log('Response = ', response.type);

            if (response.didCancel) {
                console.log('User cancelled image picker');
            }
            else if (response.error) {
                console.log('ImagePicker Error: ', response.error);
            }
            else if (response.customButton) {
                console.log('User tapped custom button: ', response.customButton);
            }
            else {
                //let source = {uri: response.uri};

                // You can also display the image using data:
                // let source = { uri: 'data:image/jpeg;base64,' + response.data };
                this.setState({
                    valueEventImage: response
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
        paddingBottom:10,
        backgroundColor: Colors.black
    },
    card_view: {
        flex: 1,
        width: '100%',
        borderRadius: 10,
        backgroundColor: Colors.white,
       
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
        fontWeight: 'bold',
        backgroundColor: Colors.transparent,
        fontSize: 14,
    },
    headingTextVisibility: {
        color: Colors.black,
        fontWeight: 'bold',
        backgroundColor: Colors.transparent,
        fontSize: 14,
    },
    textInputText: {
        color: Colors.black,
        marginTop: 5,
        padding: 5,
        justifyContent: 'center',
        backgroundColor: Colors.white,
        textAlignVertical: "center",
        fontSize: 13,
        height: 40,
        borderColor: Colors.black,
        borderWidth: 1,
        borderRadius:4

    },
    textInputTextDescrip: {
        color: Colors.black,
        padding: 5,
        backgroundColor: Colors.white,
        fontSize: 13,
        borderColor: Colors.black,
        borderWidth: 1,
        borderRadius:4,
        height:100

    },
    viewCenterText: {
        padding: 5,
        justifyContent: 'center',
        backgroundColor: Colors.white,
        borderColor: Colors.black,
        borderRadius: 4,
        borderWidth: 1,
        height: 40,
    },
    viewCenterTextVisibility: {
        // backgroundColor: 'red',
        height:2
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
        borderRadius: 4,
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
});

const pickerSelectStyles = StyleSheet.create({
    inputIOS: {
        padding: 5,
        justifyContent: 'center',
        backgroundColor: Colors.white,
        borderColor: Colors.black,
        borderRadius: 4,
        borderWidth: 1,
        height: 40,
        color: Colors.black,
        fontSize: 13,
        fontFamily:'raleway',
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
        fontFamily:'raleway',
    }, 
});
