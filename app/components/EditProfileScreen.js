import React, { Component, Fragment } from "react";
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    Dimensions,
    Image,
    BackHandler,
    SafeAreaView, Alert,
    TextInput,
    Keyboard
} from "react-native";

import EditProfileDisplayDetails from "./EditProfileDisplayDetails";
import ProgressIndicator from "./ProgressIndicator";
import WebService from "../core/WebService";
import { Constants } from "../consts/Constants";
import { Colors } from "../consts/Colors";
import * as Global from "../consts/Global";
import { stylesGlobal, STICKY_HEADER_HEIGHT } from '../consts/StyleSheet'
import Memory from '../core/Memory'
import { ImageCompressor } from './ImageCompressorClass';
import CustomPopupView from "../customview/CustomPopupView";
import { isEmailValid } from "../utils/ValidationUtils";
import { isValidNumber, parsePhoneNumberFromString } from 'libphonenumber-js';
import { EventRegister } from 'react-native-event-listeners';
import BannerView from "../customview/BannerView";
import AsyncStorage from '@react-native-community/async-storage';
import { convertEmojimessagetoString, convertStringtoEmojimessage, getRecentLoginTimeFrame, getUserAge } from "../utils/Util";
import Moment from "moment/moment";

const { width, height } = Dimensions.get("window");

var profileInfo = null;
var customFieldsData = null;
var reference;
var TAG = "EditProfileScreen";
var currentTab = 1;
var profileDetail;
var isProfileUpdated = false;

export default class EditProfileScreen extends React.Component {

    constructor() {
        super();

        this.state = {
            searchText: '',
            showModel: '',
            userId: "",
            userToken: "",
            loading: true,
            eye_color_array: [],
            skin_color_array: [],
            hair_color_array: [],
            height_array: [],
            weight_array: [],
            ethnicity_array: [],
            marital_status_array: [],
            body_array: [],
            languages_known_array: [],
            bust_chest_array: [],
            waist_array: [],
            hip_inseam_array: [],
            isUpdating: false,
            params: {},

            userImageName: '',
            userImagePath: '',

            member_plan: '',
        };
    }

    UNSAFE_componentWillMount() {
        this.clearStateData();
        this.refreshProfileImage()
        this.getData(false);
    }

    componentDidMount() {
        BackHandler.addEventListener('hardwareBackPress', this.handleBack);
    }

    componentWillUnmount() {
        BackHandler.removeEventListener('hardwareBackPress', this.handleBack);
    }
    /**
    * clear state data
    */
    clearStateData = () => {
        array_chat_message = [];
        this.setState({
            userId: "",
            userToken: "",
            loading: true,
            isUpdating: false
        });
    };
    /**
    * get aysn storage data
    */
    getData = async () => {
        try {
            var userId = await AsyncStorage.getItem(Constants.KEY_USER_ID);
            var userToken = await AsyncStorage.getItem(Constants.KEY_USER_TOKEN);
            var member_plan = await AsyncStorage.getItem(Constants.KEY_MEMBER_PLAN);
            var userSlug = await AsyncStorage.getItem(Constants.KEY_USER_SLUG);

            this.setState({
                userId: userId,
                userToken: userToken,
                userSlug: userSlug,
                loading: true,
                isUpdating: false,
                member_plan: member_plan
            });

            this.callGetProfileInfoAPI();

        } catch (error) {
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    };

    /*
     * call get profile list
     */
    callGetProfileInfoAPI = async () => {
        try {
            let uri = Memory().env == "LIVE" ? Global.URL_GET_PROFILE_INFO : Global.URL_GET_PROFILE_INFO_DEV;
            let params = new FormData();
            params.append("token", this.state.userToken);
            params.append("user_id", this.state.userId);
            params.append("format", "json");
            console.log(TAG + " callGetProfileInfoAPI uri " + uri);
            console.log(TAG + " callGetProfileInfoAPI params " + JSON.stringify(params));
            WebService.callServicePost(uri, params, this.handleProfileInfoResponse );
        } catch (error) {
            console.log(TAG + " callGetProfileInfoAPI error " + error);
        }
    };

    /**
    * handle profile info API response
    */
    handleProfileInfoResponse = (response, isError) => {
        //console.log(TAG + " callGetProfileInfoAPI Response " + JSON.stringify(response));
        console.log(TAG + " isError " + isError);
        if (!isError) {
            var result = response;
            if (typeof result != undefined && result != null) {
                if (typeof result.data != undefined && result.data != null) {
                    var mData = result.data;
                    profileInfo = mData;
                    // console.log(profileInfo.userCustomFields.languages_known);
                    if (typeof mData.customFields != undefined && mData.customFields != null) {
                        customFieldsData = mData.customFields;
                        // console.log(TAG + " profileInfo " + JSON.stringify(profileInfo));
                        // console.log(profileInfo)
                    }
                    if (typeof mData.profileData != undefined && mData.profileData != null) {

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
    * call update profile info
    */
    callUpdateProfileInfoAPI = async () => {
        try {

            var jsonDataTab1 = this.refs.tab1.updateProfileInfo();
            console.log(TAG, "jsonDataTab1.languages_known_tags " + JSON.stringify(jsonDataTab1.languages_known_tags))
            var languageTag = "";
            var languageId = ""
            jsonDataTab1.languages_known_tags.map((item, j) => {
                languageTag = languageTag + item + ",";

            })
            if (languageTag.trim().endsWith(",")) {
                languageTag = languageTag.substring(0, languageTag.length - 1)
            }
            console.log(TAG, " languageTag " + languageTag);

            let newdata = languageTag;


            if (jsonDataTab1.first_name == null || jsonDataTab1.first_name == undefined || jsonDataTab1.first_name == "") {
                Alert.alert(Constants.EMPTY_FIRST_NAME, "");
                return;
            }
            if (jsonDataTab1.last_name == null || jsonDataTab1.last_name == undefined || jsonDataTab1.last_name == "") {
                Alert.alert(Constants.EMPTY_LAST_NAME, "");
                return;
            }
            if (jsonDataTab1.gender == null || jsonDataTab1.gender == undefined || jsonDataTab1.gender == "") {
                Alert.alert(Constants.EMPTY_GENDER, "");
                return;
            }
            if (!isEmailValid(jsonDataTab1.email)) {
                Alert.alert(Constants.INVALID_EMAIL_ID, "");
                return;
            }
            if (jsonDataTab1.address == null || jsonDataTab1.address == undefined || jsonDataTab1.address == "") {
                Alert.alert(Constants.EMPTY_ADDRESS, "");
                return;
            }
            if (jsonDataTab1.phone != "" && !isValidNumber(jsonDataTab1.phone)) {
                Alert.alert(Constants.INVALID_PHONE_NUMBER, "");
                return;
            }
            if (jsonDataTab1.general_info == null || jsonDataTab1.general_info == undefined || jsonDataTab1.general_info == "") {
                Alert.alert(Constants.EMPTY_ABOUT_YOU, "");
                return;
            }
            if (jsonDataTab1.things_i_like == null || jsonDataTab1.things_i_like == undefined || jsonDataTab1.things_i_like == "") {
                Alert.alert(Constants.EMPTY_YOU_LIKE, "");
                return;
            }
            if (getUserAge(Moment(jsonDataTab1.dob).utc().format("MM/DD/YYYY")) < 18) {
                Alert.alert(Constants.LIMIT_AGE, "");
                return;
            }

            this.setState({
                isUpdating: true
            });
            let uri = Memory().env == "LIVE" ? Global.URL_GET_PROFILE_INFO : Global.URL_GET_PROFILE_INFO_DEV;

            let params = {
                "token": this.state.userToken,
                "user_id": this.state.userId,
                "format": "json",
                "first_name": jsonDataTab1.first_name,
                "last_name": jsonDataTab1.last_name,
                "gender": jsonDataTab1.gender,
                "email": jsonDataTab1.email,
                "social_media": jsonDataTab1.social_media,
                "dob": jsonDataTab1.dob,
                "other_field[age]": "0",
                "phone": jsonDataTab1.phone,
                "address": jsonDataTab1.address,
                "master_value[eye_color]": jsonDataTab1.eye_color,
                "master_value[skin_color]": jsonDataTab1.skin_color,
                "master_value[hair_color]": jsonDataTab1.hair_color,
                "master_value[height]": jsonDataTab1.height,
                "master_value[weight]": jsonDataTab1.weight,
                "master_value[ethnicity]": jsonDataTab1.ethnicity,
                "master_value[marital_status]": jsonDataTab1.marital_status,
                "master_value[body]": jsonDataTab1.body,
                "networth_amount": jsonDataTab1.networth_amount,
                "message_cost": jsonDataTab1.user_chat_cost,
                "general_info": jsonDataTab1.general_info,
                "things_i_like": jsonDataTab1.things_i_like,
                "languages_known_tags": languageTag,
                "field[1]": jsonDataTab1.field["1"],
                "field[2]": jsonDataTab1.field["2"],
                "field[3]": jsonDataTab1.field["3"],
                "field[7]": jsonDataTab1.field["7"],
                "field[8]": jsonDataTab1.field["8"],
                "field[13]": jsonDataTab1.field["13"],
                // "field[14]": jsonDataTab1.field["14"],
                "field[22]": jsonDataTab1.field["22"],
                // "field[24]": jsonDataTab1.field["24"],
                "other_field[last_name]": jsonDataTab1.other_field.last_name,
                "other_field[email]": jsonDataTab1.other_field.email,
                "other_field[age]": jsonDataTab1.other_field.age,
                "other_field[location]": jsonDataTab1.other_field.location,
                "other_field[about_me]": jsonDataTab1.other_field.about_me,
                "other_field[things_i_likes]": jsonDataTab1.other_field.things_i_likes,
                "other_field[social_media]": jsonDataTab1.other_field.social_media,
            }
            this.setState({ params: params });
            // for (var i = 0; i < customFieldsData[8].length; i++) {
            //     if (newdata.indexOf(customFieldsData[8][i].value) > -1) {
            //         params.append("master_value[languages_known][" + i + "]", customFieldsData[8][i].id);
            //     }
            // }
            var lang_index = 0;
            for (var index = 0; index < customFieldsData.length; index++) {
                if (customFieldsData[index][0].field_name_key == "languages_known") {
                    for (var i = 0; i < newdata.length; i++) {
                        for (var j = 0; j < customFieldsData[index].length; j++) {
                            if (newdata[i] == customFieldsData[index][j].value) {
                                params.append("master_value[languages_known][" + lang_index + "]", customFieldsData[index][j].id);
                                lang_index++;
                                break;
                            }
                        }
                    }
                    break;
                }
            }

            console.log(TAG + " callUpdateProfileInfoAPI uri " + uri);
            console.log(TAG + " callUpdateProfileInfoAPI params " + JSON.stringify(params));

            WebService.callServicePost(
                uri,
                params,
                this.handleUpdateProfileInfoResponse
            );
        } catch (error) {
            console.log(TAG + " callUpdateProfileInfoAPI error " + error);
        }
    };
    /**
    * handle update profile info API response
    */
    handleUpdateProfileInfoResponse = (response, isError) => {

        if (!isError) {
            var result = response;
            if (typeof result != undefined && result != null) {
                console.log(TAG + " callUpdateProfileInfoAPI result " + JSON.stringify(result));
                console.log(TAG + " callUpdateProfileInfoAPI errors " + result.errors);

                // this.callMyProfileDetailAPI();
                if (typeof result.status != undefined && result.status != null) {
                    if (result.status == "success") {
                        EventRegister.emit(Constants.EVENT_PROFILE_IMAGE_UPDATED, '');
                        isProfileUpdated = true;
                        const { state } = this.props.navigation;
                        this.props.navigation.goBack();
                        this.props.route.params.refreshAction();

                    } else {
                        if (typeof result.errors != undefined && result.errors != null) {
                            let errorFiltered = result.errors.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, "");
                            let error = errorFiltered.split('.');
                            console.log('numOfCommas', error);
                            Alert.alert(error[0])
                        }
                        if (typeof result.data != undefined && mDresult.dataata != null) {
                            var mData = result.data;
                            console.log(TAG + " Response " + mData);
                            profileInfo = result.data;
                            if (typeof mData.customFields != undefined && mData.customFields != null) {
                                customFieldsData = mData.customFields;
                            }
                            if (typeof mData.profileData != undefined && mData.profileData != null) {

                            }
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
            isUpdating: false
        });
    };

    render() {
        return (
            <Fragment>
                <SafeAreaView style={{ flex: 0, backgroundColor: Colors.black }} />
                <SafeAreaView style={{ flex: 1, backgroundColor: Colors.gold }}>
                    <View style={styles.container}>
                        {this.renderHeaderView()}
                        {this.renderBannerView()}
                        {this.renderPopupView()}
                        {!this.state.loading ? this.setUpperTabBar() : null}
                        {!this.state.loading ? this.setUpdateButton() : null}
                        {this.state.loading == true || this.state.isUpdating == true ? <ProgressIndicator /> : null}
                    </View>
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
     * render header view
     */
    renderHeaderView = () => {

        const { state } = this.props.navigation;
        let imageUrl = this.state.userImagePath + Constants.THUMB_FOLDER + this.state.userImageName;
        return (
            <View style={stylesGlobal.headerView}>
                <TouchableOpacity style={stylesGlobal.header_backbuttonview_style}
                    onPress={() => {
                        this.props.navigation.goBack();
                        if (isProfileUpdated) {
                            this.props.route.params.refreshAction();
                        }
                    }}
                >
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
                            });
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

    /**
     * display event type tab bar so user can navigate to event types
     */
    setUpperTabBar = () => {
        return (
            <View style={{ flex: 1 }}>
                <EditProfileDisplayDetails
                    ref="tab1"
                    tabLabel="PERSONAL DETAILS"
                    screenProps={this.props.navigation} r
                    type={1}
                    customFieldsData={customFieldsData}
                    profileInfo={profileInfo}
                />
            </View>
        );
    };

    /**
     * refresh tab content and display event list base on selected event
     */
    updateTabContent = data => {
        console.log(TAG + " updateTabContent data " + JSON.stringify(data.i));
        switch (data.i) {
            case 0:
                currentTab = 1;
                break;
            case 1:
                currentTab = 2;
                break;
            case 2:
                currentTab = 3;
                break;

        }
    };

    /**
    * display bottom buttons
    */
    setUpdateButton = () => {

        return (
            <TouchableOpacity style={{ backgroundColor: Colors.gold, justifyContent: 'center', alignItems: 'center', height: 40, width: '100%', }}
                onPress={() => this.callUpdateProfileInfoAPI()}
                activeOpacity={1}
            >
                <Text style={[{ fontSize: 16, }, stylesGlobal.font_semibold]}>Update</Text>
            </TouchableOpacity>
        );
    }

    /**
    * back button click
    */
    handleBack = () => {
        this.props.navigation.goBack();
        if (isProfileUpdated) {
            this.props.route.params.refreshAction();
            return true
        }
        return false;
    };

}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: "100%",
        height: "100%",
        backgroundColor: Colors.white
    },
});
