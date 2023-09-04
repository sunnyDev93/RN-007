import React, { Component, Fragment } from 'react'
import {View, Dimensions, Text, TextInput, TouchableOpacity, Image, SafeAreaView, Alert, FlatList, Keyboard, Modal, KeyboardAvoidingView} from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import { Colors } from "../consts/Colors";
import ProgressIndicator from "./ProgressIndicator";
import * as ValidationUtils from "../utils/ValidationUtils";
const { width, height } = Dimensions.get('window')
import DateTimePicker from "react-native-modal-datetime-picker";
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import WebService from "../core/WebService";
import * as Global from "../consts/Global";
import Geocoder from 'react-native-geocoder';
import Moment from "moment/moment";
import { Constants } from "../consts/Constants";
import { stylesGlobal, STICKY_HEADER_HEIGHT } from '../consts/StyleSheet'
import CustomPopupView from "../customview/CustomPopupView";
import { ImageCompressor } from './ImageCompressorClass';
import Memory from '../core/Memory';
import {convertEmojimessagetoString, convertStringtoEmojimessage} from "../utils/Util";
import BannerView from "../customview/BannerView";
import AsyncStorage from '@react-native-community/async-storage';
import ModalDropdown from '../custom_components/react-native-modal-dropdown/ModalDropdown';
import CustomCalendarView from './CustomCalendarView';
import { isIphoneX, getBottomSpace } from '../custom_components/react-native-iphone-x-helper';
import {Calendar} from 'react-native-calendars';

var TAG = "AddTravelPlanScreen";
var currentDate = '';
let location = "";

export default class AddTravelPlanScreen extends Component {

    constructor() {
        super();
        var today = new Date();
        currentDate = parseInt(today.getMonth() + 1) + "/" + today.getDate() + "/" + today.getFullYear();
        
        this.state = {
            showModel: false,
            scheduleId: '',
            valueLocation: '',
            valueStartDateOfEvent: '',
            valueEndDateOfEvent: '',
            loading: false,
            valueEventDescription: '',
            category_array: Global.category_array_others,
            selected_category: Global.selected_category,
            locationInfo: '',
            searchedText: '',
            startMinDate: currentDate,
            startMaxDate: currentDate,
            endMinDate: currentDate,
            isEndDateSelect: false,
            isStartDateSelect: false,

            travelPlanList: [],
            pageNumber: 0,
            deleting_schedule_id: 0,
            userToken: '',
            userId: '',
            data_changed: false,

            valueStartDateOfEvent_origin: "",
            valueEndDateOfEvent_origin: "",
            valueEventDescription_origin: "",
            selected_category_origin: Global.selected_category,
            searchedText_origin: "",

            isStartDatePickerVisible: false,
            isEndDatePickerVisible: false,

            addbutton_click: false,
            searchText: "", ////  top bar search view,

            selectedDate: "",
            showModal: false,

        };
    }

    UNSAFE_componentWillMount() {
        this.refreshProfileImage();
        this.setState({
            userToken: this.props.route.params.userToken,
            userId: this.props.route.params.userId,
            addbutton_click: this.props.route.params.addPlan ? true : false
        }, () => this.callGetTravelPlanListAPI())
        
    }

 
    /**
     * display pre travel plan data
     */
    setData = (data) => {
        console.log(JSON.stringify(data))
        this.setState({
            scheduleId: data.id,
        })
        
        this.onGeoCodeSearchFunc(data.address)
        for(i = 0; i < this.state.category_array.length; i ++) {
            if(this.state.category_array[i].value.toString() == data.visibility.toString()) {
                this.setState({
                    selected_category: i,
                    selected_category_origin: i
                })
                break;
            }
        }
        this.setState({
            valueStartDateOfEvent: Moment(data.from_date).format("MMM DD, YYYY"),
            valueEndDateOfEvent: Moment(data.to_date).format("MMM DD, YYYY"),
            valueEventDescription: convertStringtoEmojimessage(data.travel_purpose),
            searchedText: data.address,
            startMaxDate: Moment(data.to_date).format("MMM DD, YYYY"),
            endMinDate: Moment(data.from_date).format("MMM DD, YYYY"),
            isEndDateSelect: true,
            isStartDateSelect: true,

            valueStartDateOfEvent_origin: Moment(data.from_date).format("MMM DD, YYYY"),
            valueEndDateOfEvent_origin: Moment(data.to_date).format("MMM DD, YYYY"),
            valueEventDescription_origin: convertStringtoEmojimessage(data.travel_purpose),
            searchedText_origin: data.address,

        })
        this.googleplacesRef && this.googleplacesRef.setAddressText(data.address)

    }

    clearData() {
        this.setState({
            scheduleId: '',
            valueLocation: '',
            valueStartDateOfEvent: '',
            valueEndDateOfEvent: '',
            loading: false,
            valueEventDescription: '',
            category_array: Global.category_array_event_trip,
            selected_category: Global.selected_category,
            locationInfo: '',
            searchedText: '',
            startMinDate: currentDate,
            startMaxDate: currentDate,
            endMinDate: currentDate,
            isEndDateSelect: false,
            isStartDateSelect: false,

            data_changed: false,

            valueStartDateOfEvent_origin: "",
            valueEndDateOfEvent_origin: "",
            valueEventDescription_origin: "",
            selected_category_origin: Global.selected_category,
            searchedText_origin: "",

            isStartDatePickerVisible: false,
            isEndDatePickerVisible: false,

            addbutton_click: false,
        })
    }

    /**
     * get google place data of selected place
     */
    onGeoCodeSearchFunc = (data) => {
        Geocoder.geocodeAddress(data).then(res => {
            console.log(TAG, " onGeoCodeSearchFunc res" + JSON.stringify(res))
            this.setState({
                locationInfo: res,
                searchedText: data,
                loading: false
            }, () => {
                location = data
            })
        }).catch(err => {
            console.log(TAG, " onGeoCodeSearchFunc err " + err)
            this.setState({
                searchedText: data,
                loading: false
            }, () => {
                location = data
            })
        })
    }


    /**
    * save button click to save or edit travel plan
    */
    saveButtonPress = () => {
        var fromDate = this.state.valueStartDateOfEvent.trim();
        var toDate = this.state.valueEndDateOfEvent.trim();
        var address = this.state.searchedText.trim();
        var purpose = this.state.valueEventDescription.trim();

        console.log(TAG, "address " + address)
        console.log(TAG, "location " + location)
        if (ValidationUtils.isEmptyOrNull(address)) {
            address = location;
        }
        console.log(TAG, "finbal " + address)
        if (ValidationUtils.isEmptyOrNull(fromDate)) {
            Alert.alert(Constants.EMPTY_SCHEDULE_FROM);
            return;
        }
        if (ValidationUtils.isEmptyOrNull(toDate)) {
            Alert.alert(Constants.EMPTY_SCHEDULE_TO);
            return;
        }
        if (ValidationUtils.isEmptyOrNull(address)) {
            Alert.alert(Constants.EMPTY_SCHEDULE_LOCATION);
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
                    address,
                    this.handlePlaceDetailResponse
                );
            }
        } catch (error) {
            console.log(TAG, " saveButtonPress locationInfo error " + error)
            this.setState({
                loading: false
            });
        }
    }

    handlePlaceDetailResponse = (response, isError) => {
        console.log(TAG + " Response " + response);
        console.log(TAG + " isError " + isError);
        if (!isError) {
            var result = response;
            if (typeof result != "undefined" && result != null) {
                console.log(TAG, " result detail==>" + JSON.stringify(result))
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
        }
        this.setState({
            loading: false
        });
    }

    nextStep = () => {
        if (this.state.scheduleId !== "") {
            this.callScheduleAPI(true)
        }
        else {
            this.callScheduleAPI(false)
        }
    }
    /**
     * call Schedule API
     */
    callScheduleAPI = async (isEdit) => {
        try {
            console.log(TAG,"callScheduleAPI called")
            let uri;
            if (isEdit) {
                uri = Memory().env == "LIVE" ?  Global.URL_EDIT_SCHEDULE : Global.URL_EDIT_SCHEDULE_DEV
            }
            else {
                uri = Memory().env == "LIVE" ? Global.URL_ADD_SCHEDULE : Global.URL_ADD_SCHEDULE_DEV
            }

            let params = new FormData();

            let latitude = "";
            let longitude = "";
            let country_code = "";
            let country = "";
            let state_code = "";
            let state = "";
            let city = "";
            let zip = "";

            try {
                if (this.state.locationInfo != null && this.state.locationInfo[0]) {
                    latitude = this.state.locationInfo[0].position.lat;
                    longitude = this.state.locationInfo[0].position.lng;
                    country_code = this.state.locationInfo[0].countryCode;
                    country = this.state.locationInfo[0].country;
                    state_code = this.state.locationInfo[0].adminArea;
                    state = this.state.locationInfo[0].adminArea;
                    city = this.state.locationInfo[0].locality;
                    zip = this.state.locationInfo[0].postalCode;
                }
            } catch (error) {
                console.log(TAG, " callScheduleAPI locationInfo error " + error)
            }

            this.setState({
                loading: true
            });
            params.append("format", "json");
            params.append("user_id", this.props.route.params.userId);
            params.append("token", this.props.route.params.userToken);
            params.append("from_date", this.state.valueStartDateOfEvent);
            params.append("to_date", this.state.valueEndDateOfEvent);
            params.append("address", location);
            params.append("street_number_map", "");
            params.append("route_map", "");
            params.append("latitude", latitude);
            params.append("longitude", longitude);
            params.append("country_code", country_code);
            params.append("country", country);
            params.append("state_code", state_code);
            params.append("state", state);
            params.append("city", city);
            params.append("zip", zip);
            params.append("type", this.state.category_array[this.state.selected_category].value );
            params.append("travel_purpose", convertEmojimessagetoString(this.state.valueEventDescription.trim()));
            params.append("add_schedule", "");
            if (isEdit) {
                params.append("hdn_schedule_id", this.state.scheduleId);
            }


            const data = {
                format: 'json',
                user_id: this.props.route.params.userId,
                token: this.props.route.params.userToken,
                from_date: this.state.valueStartDateOfEvent,
                to_date: this.state.valueEndDateOfEvent,
                address: location,
                street_number_map: '',
                route_map: '',
                latitude: latitude,
                longitude: longitude,
                country_code: country_code,
                country: country,
                state_code: state_code,
                state: state,
                city: city,
                zip: zip,
                type: this.state.category_array[this.state.selected_category].value,
                travel_purpose: convertEmojimessagetoString(this.state.valueEventDescription.trim()),
                add_schedule: ''
            }
            if (isEdit) {
                data["hdn_schedule_id"] = this.state.scheduleId;
            }

            console.log(TAG + " callScheduleAPI uri " + uri);
            console.log(TAG + " callScheduleAPI params " + JSON.stringify(data));
            WebService.callServicePost(
                uri,
                data,
                this.handleResponse
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
    * handle save or edit teravel plan API response
    */
    handleResponse = (response, isError) => {
        console.log(TAG + " callScheduleAPI Response " + JSON.stringify(response));
        console.log(TAG + " callScheduleAPI isError " + isError);
        this.setState({
            loading: false
        });
        if (!isError) {
            var result = response;
            if (result != undefined && result != null) {
                var travelPlanList = this.state.travelPlanList;
                if (this.state.scheduleId !== "") { /// for edit case
                    var index = 0;
                    for(index = 0; index < travelPlanList.length; index ++) {
                        if(this.state.scheduleId == travelPlanList[index].id) {
                            break;
                        }
                    }
                    travelPlanList.splice(index, 1);
                    travelPlanList.splice(index, 0, result.data);
                } else {  // for create new travel
                    travelPlanList.splice(0, 0, result.data);
                }
                this.setState({
                    travelPlanList: travelPlanList
                })
                
                this.clearData();
                this.setState({
                    addbutton_click: false,
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



    go_backaction() {

        var data_changed = false;
        if(this.state.valueStartDateOfEvent_origin != this.state.valueStartDateOfEvent) {
            data_changed = true;
        }
        if(this.state.valueEndDateOfEvent_origin != this.state.valueEndDateOfEvent) {
            data_changed = true;
        }
        if(this.state.valueEventDescription_origin != this.state.valueEventDescription) {
            data_changed = true;
        }
        if(this.state.selected_category_origin != this.state.selected_category) {
            data_changed = true;
        }
        if(this.state.searchedText_origin != this.state.searchedText) {
            data_changed = true;
        }

        if(data_changed) {
            Alert.alert(Constants.SAVE_DATA_ALERT_TITLE, Constants.SAVE_DATA_ALERT_MESSAGE,
            [
                {text: "No", onPress: () => this.props.navigation.goBack()},
                {text: "Yes", onPress: () => this.saveButtonPress()}
            ],
            { cancelable: true })
        } else {
            this.props.route.params.getDataAgain();
            this.props.navigation.goBack()
        }
    }

    handleStartDatePicked = date => {
        this.setState({
            valueStartDateOfEvent: Moment(date).format("MMM DD, YYYY"),
            endMinDate: Moment(date).format("MMM DD, YYYY"),
            isStartDatePickerVisible: false,
        });
    }

    handleEndDatePicked = date => {
        this.setState({
            valueEndDateOfEvent: Moment(date).format("MMM DD, YYYY"),
            isEndDateSelect: true,
            startMaxDate: Moment(date).format("MMM DD, YYYY"),
            isEndDatePickerVisible: false,
        });
    }

    render() {
        return (
            <Fragment>
                <SafeAreaView style={{backgroundColor:Colors.black, flex:0}}/>
                <SafeAreaView style={{ flex: 1, backgroundColor:Colors.black, }}>
                    {this.renderCalenderStart()}
                    {this.renderCalenderEnd()}
                    {this.state.showModal && <CustomCalendarView selectedDate={this.state.selectedDate} onClosed={() => {this.setState({showModal: false})}}/>}
                    {/* <DateTimePicker */}
                    {/*     isVisible={this.state.isStartDatePickerVisible} */}
                    {/*     onConfirm={this.handleStartDatePicked} */}
                    {/*     onCancel={() => this.setState({isStartDatePickerVisible: false})} */}
                    {/*     date={this.state.valueStartDateOfEvent == "" ? new Date() : new Date(this.state.valueStartDateOfEvent)} */}
                    {/*     minimumDate = {new Date(this.state.startMinDate)} */}
                    {/*     maxDate={this.state.isEndDateSelect ? new Date(this.state.startMaxDate) : ''} */}
                    {/*     mode = {"date"} */}
                    {/* /> */}
                    {/* <DateTimePicker */}
                    {/*     isVisible={this.state.isEndDatePickerVisible} */}
                    {/*     onConfirm={this.handleEndDatePicked} */}
                    {/*     onCancel={() => this.setState({isEndDatePickerVisible: false})} */}
                    {/*     date={this.state.valueEndDateOfEvent == "" ? new Date() : new Date(this.state.valueEndDateOfEvent)} */}
                    {/*     minimumDate = {new Date(this.state.endMinDate)} */}
                    {/*     mode = {"date"} */}
                    {/* /> */}
                    {this.renderHeaderView()}
                    {this.renderBannerView()}
                    {this.renderPopupView()}
                    {this.setDetailsForm()}
                    {this.state.loading == true ? <ProgressIndicator /> : null}
                </SafeAreaView>
            </Fragment>
        );
    }


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

    renderBannerView = () => {
        return (
            <BannerView
                screenProps = {this.props.navigation}
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
        this.hidePopupView()
        try {
            await AsyncStorage.setItem(Constants.KEY_USER_ID, "");
            await AsyncStorage.setItem(Constants.KEY_USER_TOKEN, "");

            this.props.navigation.navigate("SignInScreen", {isGettingData: false});
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
            this.props.navigation.navigate('Dashboard', {selected_screen: "members", search_text: searchText});
        }
    };

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

    /**
    * display top header
    */
    renderHeaderView = () => {
        const { navigate } = this.props.navigation;
        const { state } = this.props.navigation;
        let imageUrl = this.state.userImagePath + Constants.THUMB_FOLDER + this.state.userImageName;
        return (
            <View style={stylesGlobal.headerView}>
                <TouchableOpacity style={stylesGlobal.header_backbuttonview_style} onPress={() => {this.go_backaction()}}>
                    <Image style = {stylesGlobal.header_backbuttonicon_style} source={require("../icons/icon_back.png")}/>
                </TouchableOpacity>
                <TouchableOpacity style={stylesGlobal.header_logoview_style} onPress = {() => this.props.navigation.navigate('Dashboard', {logoclick: true})}>
                    <Image source={require("../icons/logo_new.png")} style={stylesGlobal.header_logo_style}/>
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
                            Keyboard.dismiss();
                            this.setState({
                                searchText: ""
                            })
                        }}}
                    >
                    {
                        this.state.searchText != "" &&
                        <Image style = {stylesGlobal.header_searchicon_style} source={require("../icons/connection-delete.png")}/>
                    }
                    {
                        this.state.searchText == "" &&
                        <Image style = {stylesGlobal.header_searchicon_style} source={require("../icons/dashboard_search.png")}/>
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

    callGetTravelPlanListAPI = async () => {
        try {
            this.setState({
                loading: true,
            });
            
            let uri = Memory().env == "LIVE" ? Global.URL_GET_TRAVEL_PLAN + this.state.pageNumber : Global.URL_GET_TRAVEL_PLAN_DEV + this.state.pageNumber


            let params = new FormData();
            params.append("token", this.state.userToken);
            params.append("user_id", this.state.userId);
            params.append("format", "json");


            WebService.callServicePost(
                uri,
                params,
                this.handleGetTravelPlanListResponse
            );
        } catch (error) {
            this.setState({
                loading: false,
            });
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    };
    /**
*  handle travel plan list API response
*/
    handleGetTravelPlanListResponse = (response, isError) => {
        console.log(TAG + " handleGetTravelPlanListResponse Response " + response);
        console.log(TAG + " isError " + isError);

        if (!isError) {
            var result = response;

            if (typeof result != undefined && result != null) {
                console.log(TAG + " callGetTravelPlanListAPI result " + JSON.stringify(result));
                if (typeof result.data != undefined && result.data != null) {
                    var mData = result.data;
                    var array_Travel_Plan_list = this.state.travelPlanList;
                    if (mData.length > 0) {
                        
                        mData.map((i, j) => {
                            var isExist = false;
                            array_Travel_Plan_list.map((item) => {
                                if (item.id === i.id) {
                                    isExist = true;
                                }
                            })
                            if (!isExist) {
                                array_Travel_Plan_list.push(i);
                            }
                        });
                        this.setState({
                            travelPlanList: array_Travel_Plan_list,
                            pageNumber: this.state.pageNumber + 1
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
        });

    };


    callDeleteTravelPlanAPI = async (schedule_id) => {
        try {
            this.setState({
                loading: true,
                deleting_schedule_id: schedule_id
            });

            let uri = Memory().env == "LIVE" ? Global.URL_DELETE_SCHEDULE : Global.URL_DELETE_SCHEDULE_DEV
            let params = new FormData();
            params.append("token", this.state.userToken);
            params.append("user_id", this.state.userId);
            params.append("format", "json");
            params.append("schedule_id", schedule_id);
            console.log("ssssssssssss:::" + JSON.stringify(params));
            WebService.callServicePost(
                uri,
                params,
                this.handleDeleteTravelPlanResponse
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
     * Handle Delete Travel Plan API
     */
    handleDeleteTravelPlanResponse = (response, isError) => {
        console.log(TAG + " Response " + JSON.stringify(response));
        console.log(TAG + " isError " + isError);

        if (!isError) {
            var result = response;

            if (result != undefined && result != null) {
                var travelPlanList = this.state.travelPlanList;
                for(i = 0; i < travelPlanList.length; i ++) {
                    if(travelPlanList[i].id == this.state.deleting_schedule_id) {
                        travelPlanList.splice(i, 1);
                        break;
                    }
                }
                this.setState({
                    travelPlanList: travelPlanList
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
     * display Personal Details of an User
     */
    setDetailsForm = () => {
        return (
            <View style={styles.card_view}>
                <View style={{ alignItems: 'center', width: '100%', height: 40, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.card_titlecolor }}>
                    <Text style={[styles.headText, stylesGlobal.font]}>TRAVEL SCHEDULE</Text>
                </View>
                <KeyboardAwareScrollView style={styles.container}
                    extraScrollHeight={10}
                    enableAutomaticScroll={true}
                    keyboardDismissMode="on-drag"
                    showsVerticalScrollIndicator={false} 
                    keyboardShouldPersistTaps = "handled"
                >
                {
                    !this.state.addbutton_click &&
                    <View style = {{width: '100%', alignItems: 'flex-end', marginTop: 10, marginBottom: 10}}>
                        <TouchableOpacity style = {[{width: 80, height: 30, marginRight: 10, backgroundColor: Colors.gold, borderRadius: 5, justifyContent: 'center', alignItems: 'center'}, stylesGlobal.shadow_style]}
                            onPress = {() => this.setState({addbutton_click: true})}
                        >
                            <Text style = {[stylesGlobal.font, {fontSize: 14, color: Colors.white}]}>Add</Text>
                        </TouchableOpacity>
                    </View>
                }
                {
                    this.state.addbutton_click &&
                    <View keyboardShouldPersistTaps='handled'>
                        {this.renderLocation('Location', this.state.valueLocation, 'valueLocation')}
                        <View style = {{width: '100%', flexDirection: 'row', justifyContent: 'space-between'}}>
                            <TouchableOpacity style = {{width: '48%'}} onPress={() => {
                                this.setState({
                                    isStartDatePickerVisible: true
                                })
                            }}>
                                {this.renderTextView('From Date', this.state.valueStartDateOfEvent)}
                            </TouchableOpacity>

                            <TouchableOpacity style = {{width: '48%'}} onPress={() => {
                                this.setState({
                                    isEndDatePickerVisible: true
                                })
                            }}>
                                {this.renderTextView('To Date', this.state.valueEndDateOfEvent)}
                            </TouchableOpacity>
                        </View>
                        <View style = {{width: '100%', flexDirection: 'row', justifyContent: 'space-between'}}>
                            <View style={[styles.headView, {flex: 1}]}>
                                <Text style={[styles.headingText, { marginBottom: 2 }, stylesGlobal.font_bold]}>Travel Purpose</Text>
                                <TextInput
                                    ref='valueEventDescription'
                                    underlineColorAndroid="transparent"
                                    style={[styles.textInputText, stylesGlobal.font]}
                                    onChangeText={value => {
                                        this.setState({ 
                                            valueEventDescription: value,
                                        })
                                    }}
                                    value={this.state.valueEventDescription}
                                    multiline={true}
                                    returnKeyType='default'
                                    autoCapitalize='sentences'
                                    onSubmitEditing={(event) => {

                                    }}
                                ></TextInput>
                            </View>
                            <View style = {{width: 80, justifyContent: 'flex-end', alignItems: 'center'}}>
                                <ModalDropdown 
                                    dropdownStyle = {{height: 35 * 5 + 5 * 6, paddingLeft: 5, paddingTop: 5, paddingRight: 5, backgroundColor: '#ffffff', borderRadius: 3, borderColor: '#000000', borderWidth: 1}}
                                    defaultIndex = {0}
                                    options = {this.state.category_array}
                                    onSelect = {(index) => {
                                        this.setState({
                                            selected_category: index
                                        })
                                    }}
                                    renderButton = {() => {
                                        return (
                                            <View style={{justifyContent: 'center', alignItems: 'center'}}>
                                                <Image style={[styles.ageIcon, { width: 30, height: 30, resizeMode: 'contain'}]} source={this.state.category_array[this.state.selected_category].icon_path}/>
                                                <Text style = {[stylesGlobal.font, {fontSize: 11}]}>{this.state.category_array[this.state.selected_category].label}</Text>
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
                            </View>
                        </View>
                        {this.renderBottomButton()}
                    </View>
                }  

                    <View style={{ width: '100%', }}>
                    <FlatList
                            ListFooterComponent={this.state.displayLoadMoreView == true ? footerView : null}
                            extraData={this.state}
                            key = {this.state.travelPlanList.length}
                            pagingEnabled={false}
                            showsHorizontalScrollIndicator={false}
                            showsVerticalScrollIndicator={false}
                            data={this.state.travelPlanList}
                            keyExtractor={(item, index) => index.toString()}
                            renderItem={({ item }, index) => this.renderTravelPlanRow(item, index)}
                            onEndReachedThreshold={1}
                            onEndReached={({ distanceFromEnd }) => {
                                this.callGetTravelPlanListAPI();
                            }}
                        />
                    </View>
                </KeyboardAwareScrollView>
            </View>
        );
    };


    handlePressedDate = (clickedDate) => {
        console.log(clickedDate);
        this.setState({selectedDate: clickedDate, showModal: true})
    }
    /////////////////   travel pls list    ///////////////
    renderTravelPlanRow = (rowData, index) => {
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
        var selected_category = 0;
        for(i = 0; i < this.state.category_array.length; i ++) {
            if(rowData.visibility.toString() == this.state.category_array[i].value.toString()) {
                selected_category = i;
                break;
            }
        }
        var travel_purpose = convertStringtoEmojimessage(rowData.travel_purpose);
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
            <View key={index}>
                <View style={[styles.infoCardContainer,]}>
                    <View style = {{flexDirection: "row", flex: 1, paddingBottom: 10, justifyContent: 'center', alignItems: 'center'}}>
                        <View style = {{flex: 1}}>
                            <View style = {{flexDirection: 'row', paddingTop: 5, alignItems: 'center'}}>
                                <Image source={require('../icons/pin.png')} style={{width: 20, height: 20, resizeMode:'contain'}} />
                                <Text style={[{color: Colors.black, fontSize: 12, marginLeft: 10, flex: 1}, stylesGlobal.font_semibold]} multiline = {true}>{address}</Text>
                            </View>
                            <View style = {{flexDirection: 'row', alignItems: 'center'}}>
                                <Image source={require('../icons/calendar.png')} style={{width: 20, height: 20, resizeMode:'contain'}} />
                                <View style={{flexDirection: 'row', flexWrap: 'wrap', marginLeft: 10, alignItems: 'center', flex: 1}}>
                                    <TouchableOpacity 
                                        style={[{paddingVertical: 5, paddingHorizontal: 10, backgroundColor: Colors.gold, borderRadius: 5, alignItems: 'center', justifyContent: 'center', marginTop: 5}]}
                                        onPress={() => this.handlePressedDate(Moment(from_date).format("YYYY-MM-DD"))}
                                    >
                                        <Text style={[{color: Colors.black, fontSize: 12}, stylesGlobal.font]}>{Moment(from_date).format("DD MMM YYYY")}</Text>
                                    </TouchableOpacity>
                                    <Text style={[{ fontSize: 10, color: Colors.black, marginLeft: 5, marginRight: 5}, stylesGlobal.font]}>THRU</Text>
                                    <TouchableOpacity 
                                        style={[{paddingVertical: 5, paddingHorizontal: 10, backgroundColor: Colors.gold, borderRadius: 5, alignItems: 'center', justifyContent: 'center', marginTop: 5}]}
                                        onPress={() => this.handlePressedDate(Moment(to_date).format("YYYY-MM-DD"))}
                                    >
                                        <Text style={[{fontSize: 12}, stylesGlobal.font]}>{Moment(to_date).format("DD MMM YYYY")}</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                            <View style = {{flexDirection: 'row', paddingTop: 5, alignItems: 'center'}}>
                                {/* <Image source={require('../icons/pin.png')} style={{width: 20, height: 20, resizeMode:'contain'}} /> */}
                                <View style = {{width: 20}}/>
                                <Text style={[{color: Colors.black, fontSize: 12, marginLeft: 10, width: '100%'}, stylesGlobal.font_semibold]} multiline = {true}>{travel_purpose}</Text>
                            </View>
                        </View>
                        <View style = {{width: 120, flexDirection: 'row', justifyContent: 'center', alignItems: 'center'}}>
                            <View style = {{alignItems: 'center', justifyContent: 'center', marginRight: 5}}>
                                <Image style={[styles.ageIcon, { width: 30, height: 30, resizeMode: 'contain'}]} source={this.state.category_array[selected_category].icon_path}/>
                                <Text style={[{color: Colors.black, fontSize: 10,}, stylesGlobal.font_semibold]}>{this.state.category_array[selected_category].label}</Text>
                            </View>
                            <TouchableOpacity style={{alignItems: 'center', justifyContent: 'center', marginRight: 5}}
                                onPress={() => {
                                    this.setData(rowData);
                                    this.setState({
                                        addbutton_click: true
                                    })
                                }}>
                                <Image style={[styles.ageIcon, { width: 30, height: 30, resizeMode: 'contain'}]} source={require("../icons/ic_edit.png")}/>
                                <Text style={[{color: Colors.black, fontSize: 10,}, stylesGlobal.font_semibold]}>Edit</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={{alignItems: 'center', justifyContent: 'center'}}
                                onPress={() => Alert.alert('Delete Travel Plan Confirmation', 'Are you sure you want to delete travel plan?', [{
                                    text: 'Yes',
                                    onPress: () => this.callDeleteTravelPlanAPI(id)
                                }
                                    , {
                                    text: 'No', onPress: () => {
                                    }
                                }],
                                    { cancelable: false })}>
                                <Image style={[styles.ageIcon, { width: 30, height: 30, resizeMode: 'contain' }]} source={require("../icons/ic_delete.png")}/>
                                <Text style={[{color: Colors.black, fontSize: 10}, stylesGlobal.font_semibold]}>Delete</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </View>
        );
    };

    /**
    * display bottom save and cancel button
    */
    renderBottomButton = () => {
        let cancelButton = (<TouchableOpacity
            style={[styles.submitGold, { margin: 10 }, stylesGlobal.shadow_style]}
            underlayColor="#fff"
            onPress={() => {
                this.clearData();
                this.setState({
                    addbutton_click: false,
                })
            }}
        >
            <Text style={[styles.submitTextWhite, stylesGlobal.font]}>Cancel</Text>
        </TouchableOpacity>);

        let saveButton = (<TouchableOpacity
            style={[styles.submitGold, { margin: 10 }, stylesGlobal.shadow_style]}
            underlayColor="#fff"
            onPress={() => {
                this.saveButtonPress();
            }}
        >
            <Text style={[styles.submitTextWhite, stylesGlobal.font]}>Save</Text>
        </TouchableOpacity>);

        return (
            <View>

                <View style={{ alignItems: "center", flexDirection: 'row', justifyContent: 'center', margin: 20 }}>
                    {cancelButton}
                    {saveButton}
                </View>
            </View>
        );

    };

    /**
     * display Location View
     */
    renderLocation = (headerText, stateValue, stateName) => {
        return (
            <View style={[styles.headView]}>
                <Text style={[styles.headingText, { marginBottom: 2 }, stylesGlobal.font_bold]}><Text style = {{color: Colors.red}}>*</Text>{headerText}</Text>
                {this.getGoogleAutoCompleteView()}
            </View>
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

        return <GooglePlacesAutocomplete
            ref={ref => {this.googleplacesRef = ref}}
            minLength={3} // minimum length of text to search
            autoFocus={false}
            fetchDetails={false}
            returnKeyType={'done'}
            getDefaultValue={() => this.state.searchedText}
            listViewDisplayed={false}  // true/false/undefined
            fetchDetails={false}
            renderDescription={(row) => row.description}
            onPress={(data, details) => {
                this.onGeoCodeSearchFunc(data.description)
            }}
            onSubmitEditing = {() => {
                this.onGeoCodeSearchFunc(location);
            }}
            query={query}
            styles={{
                textInputContainer: {
                    width: '100%',
                    backgroundColor: Colors.white,
                    borderTopWidth: 0,
                    borderBottomWidth: 0,
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
                    borderColor: Colors.black,
                    borderRadius: 2,
                    borderWidth: 1,
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
    };

    /**
     * display TextView View
     */
    renderTextView = (headerText, stateValue) => {
        return (
            <View style={styles.headView}>
                <Text style={[styles.headingText, stylesGlobal.font_bold]}><Text style = {{color: Colors.red}}>*</Text> {headerText}</Text>
                <View style={[styles.viewCenterText, { marginTop: 5, justifyContent: 'center', }]}>
                    <Text style={stylesGlobal.font}>{stateValue}</Text>
                </View>
            </View>
        );
    }
}

const styles = {
    container: {
        flex: 1,
        width: "100%",
        height: "100%",
        padding: 10,
        backgroundColor: Colors.white
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
    headText: {
        color: Colors.gold,
        fontSize: 20,
    },
    headView: {
        marginTop: 10,
    },
    headingText: {
        color: Colors.black,
        backgroundColor: Colors.transparent,
        fontSize: 14,
    },
    textInputText: {
        color: Colors.black,
        marginTop: 3,
        padding: 5,
        justifyContent: 'center',
        backgroundColor: Colors.white,
        textAlignVertical: "center",
        fontSize: 13,
        borderColor: Colors.black,
        borderWidth: 1,
        borderRadius: 2,
        minHeight: 40,
        maxHeight: 90,
    },
    viewCenterText: {
        padding: 5,
        justifyContent: 'center',
        backgroundColor: Colors.white,
        borderColor: Colors.black,
        borderRadius: 2,
        borderWidth: 1,
        height: 40,
    },
    submitTextWhite: {
        color: Colors.white,
        backgroundColor: Colors.transparent,
        textAlign: "center",
        fontSize: 14,
    },
    submitTextGold: {
        color: Colors.gold,
        backgroundColor: Colors.transparent,
        textAlign: "center",
        fontSize: 14,
    },
    submitWhite: {
        // padding: 10,
        // paddingHorizontal: 15,
        paddingVertical: 10,
        width: 120,
        backgroundColor: Colors.white,
        borderRadius: 5,
        borderWidth: 1,
        borderColor: Colors.gold,
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'center',
        marginTop: 0,
        marginBottom: 20
    },
    submitGold: {
        // padding: 10,
        // paddingHorizontal: 15,
        paddingVertical: 10,
        width: 120,
        backgroundColor: Colors.gold,
        borderRadius: 5,
        borderWidth: 1,
        borderColor: Colors.transparent,
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'center',
        marginTop: 0,
        marginBottom: 20
    },

    infoCardContainer: {
        flex: 1,
        borderRadius: 3,
        paddingBottom: 5,
        paddingTop: 5,
        borderBottomColor: Colors.gray,
        borderBottomWidth: 1
    },
    ageIcon: {
        width: 20,
        height: 20,
    },
    ageText: {
        fontSize: 14,
        backgroundColor: Colors.transparent,
        color: Colors.gray
    },
    iconView: {
        height: 30,
        width: 30,
        marginRight: 5,
        justifyContent: 'center',
        alignContent: 'center',
        alignItems: 'center'
    },

    visibility_container_view: {
        position: 'absolute', 
        justifyContent: 'space-between', 
        zIndex: 10, 
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
}
