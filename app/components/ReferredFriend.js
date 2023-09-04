import React, { Component } from "react";
import {
    Alert,
    StyleSheet,
    SafeAreaView,
    View,
    TouchableOpacity,
    Image,
    TextInput,
    Keyboard,
    ScrollView,
    Text,
    Dimensions,
    FlatList
} from "react-native";

import { EventRegister } from 'react-native-event-listeners'
import { ImageCompressor } from './ImageCompressorClass'
import { Colors } from "../consts/Colors";
import { Constants } from "../consts/Constants";
import { stylesGlobal, STICKY_HEADER_HEIGHT } from '../consts/StyleSheet';
import CustomPopupView from "../customview/CustomPopupView";
import Memory from "../core/Memory";
import * as Global from "../consts/Global";
import WebService from "../core/WebService";
import ProgressIndicator from "./ProgressIndicator";
import Moment from "moment/moment";
import { selectContact, selectContactPhone, selectContactEmail } from 'react-native-select-contact';
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import * as ValidationUtils from "../utils/ValidationUtils";
import { getProfileSubStr, getRibbonImage } from "../utils/Util";
import ModalDropdown from '../custom_components/react-native-modal-dropdown/ModalDropdown';
import PhoneInput from 'react-native-phone-input';
import BannerView from "../customview/BannerView";
import AsyncStorage from '@react-native-community/async-storage';

import { removeCountryCode } from "../utils/Util";
import CountryPicker, { getAllCountries } from 'react-native-country-picker-modal';
import { AsYouType, parseNumber, parsePhoneNumberFromString, formatNumber  } from 'libphonenumber-js';


const { height, width } = Dimensions.get("window");
var TAG = "ReferredFriend";

export default class ReferredFriend extends React.Component {

    constructor(props) {

        super(props)

        this.state = {
            userId: "",
            userToken: "",
            userSlug: "",
            userImagePath: "",
            userImageName: "",
            showModel: false,
            member_plan: '',
            is_verified: '0',

            searchText: '',

            more_load: true,
            invited_list: [],
            page_number: 0,
            perPageCount: 10,

            showInvitationPopUp: false,
            showPhoneEmailSelectPopUp: false,
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

            selected_contact: null,
            personal_note: "",

            user_role: Global.entries,
            user_gender: [{ type: "Male", image: require('../icons/signup_male.png') }, { type: "Female", image: require('../icons/signup_female.png') }],

            is_portrait: true,

            popup_value_changed: false, // when changed a value in popup
        }

        this.onEndReachedCalledDuringMomentum = true;

    }

    UNSAFE_componentWillMount() {
        this.getData();
        this.listener = EventRegister.addEventListener(Constants.EVENT_PROFILE_IMAGE_UPDATED, () => {
            console.log(TAG, "EVENT_PROFILE_IMAGE_UPDATED event called");
            this.refreshProfileImage();
        })

        if (Dimensions.get("window").width < Dimensions.get("window").height) {
            this.setState({
                is_portrait: true,
            })
        } else {
            this.setState({
                is_portrait: false,
            })
        }

        Dimensions.addEventListener("change", () => {
            if (Dimensions.get("window").width < Dimensions.get("window").height) {
                this.setState({
                    is_portrait: true,
                })
            } else {
                this.setState({
                    is_portrait: false,
                })
            }
        })
    }

    componentWillUnmount() {
        EventRegister.removeEventListener(this.listener)

    }

    /**
       * get async storage data
       */
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


            this.setState({
                userId: userId,
                userToken: userToken,
                userSlug: userSlug,
                userImagePath: userImagePath,
                userImageName: userImageName,
                showModel: false,
                member_plan: member_plan,
                is_verified: is_verified,

            }, () => {
                this.getReferFriendsList();
            });
        } catch (error) {
            // Error retrieving data
        }

    };


    getReferFriendsList() {
        try {

            this.setState({
                loading: true
            });

            let uri = Memory().env == "LIVE" ? Global.URL_GET_REFER_FRIEND + this.state.page_number : Global.URL_GET_REFER_FRIEND_DEV + this.state.page_number;
            // let params = new FormData();
            // params.append("token", this.state.userToken);
            // params.append("user_id", this.state.userId);
            // params.append("format", "json");
            // params.append("perPage", this.state.perPageCount);

            const data = {
                token: this.state.userToken,
                user_id: this.state.userId,
                format: 'json',
                perPage: this.state.perPageCount
            }

            console.log(TAG + " callGetReferFriendsListAPI uri " + uri);
            console.log(TAG + " callGetReferFriendsListAPI params " + JSON.stringify(data));

            WebService.callServicePost(uri, data, this.handleGetReferFriendsListAPI);
        } catch (error) {
            console.log(TAG + " callGetReferFriendsListAPI error " + error);
            this.setState({
                loading: false,
            });
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    }

    handleGetReferFriendsListAPI = (response, isError) => {
        console.log(TAG + " callGetReferFriendsListAPI Response " + JSON.stringify(response));
        console.log(TAG + " callGetReferFriendsListAPI isError " + isError);

        if (!isError) {
            var result = response;
            if (result != undefined && result != null) {
                if (result.status == "success") {
                    if (result.data != null) {
                        for (var i = 0; i < result.data.length; i++) {
                            result.data[i].member_plan = result.data[i].member_type
                        }
                        this.setState({
                            invited_list: [...this.state.invited_list, ...result.data]
                        })
                        if (result.data.length < this.state.perPageCount) {
                            this.setState({
                                more_load: false
                            })
                        } else {
                            this.setState({
                                page_number: this.state.page_number + 1
                            })
                        }
                    }
                } else {
                    if(response.msg)
                    {
                        Alert.alert(response.msg.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
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
            loading: false,
        });
    }

    callInviteNoneMemberAPI = () => {

        var rowInvitation = [];
        // const rowInvitation = this.state.rowInvitation;
        var error_type = "";
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
            let uri = Memory().env == "LIVE" ? Global.URL_INVITE_USER : Global.URL_INVITE_USER_DEV;


//             let params = new FormData();
// 
//             params.append("token", this.state.userToken);
//             params.append("user_id", this.state.userId);
//             params.append("format", "json");
//             for (var index = 0; index < rowInvitation.length; index++) {
//                 const element = rowInvitation[index];
//                 params.append("friend_name[]", element.first_name + " " + element.last_name);
//                 params.append("friend_email[]", element.email);
//                 params.append("friend_mobile[]", element.phoneNumber);
//                 params.append("friend_member_type[]", this.state.user_role[element.selected_user_role_index].type);
//                 if (element.selected_gender_index == 0) {
//                     params.append("friend_gender[]", "1");
//                 } if (element.selected_gender_index == 1) {
//                     params.append("friend_gender[]", "2");
//                 }
//             }
//             params.append("personal_note", this.state.personal_note);

            const data = {
                token: this.state.userToken,
                user_id: this.state.userId,
                format: 'json',
                personal_note: this.state.personal_note,
                social_media_identifier: 1,
            }

//             let aryEmail = [];
//             let aryFirstName = [];
//             let aryLastName = [];
//             let aryPhone = [];
//             let aryMemberType = [];
//             let aryGender = [];
//             let aryInstagram = [];
// 
//             for (let index = 0; index < rowInvitation.length; index++) {
//                 const element = rowInvitation[index];
//                 aryEmail.push(element.email);
//                 aryFirstName.push(element.last_name);
//                 aryLastName.push(element.last_name);
//                 aryPhone.push(element.phoneNumber);
//                 aryInstagram.push(element.instagram);
//                 aryMemberType.push(this.state.user_role[element.selected_user_role_index].type);
//                 if (element.selected_gender_index == 0) {
//                     aryGender.push("1");
//                 } if (element.selected_gender_index == 1) {
//                     aryGender.push("2");
//                 }
//             }

            data["first_name"] = rowInvitation[0].first_name;
            data["last_name"] = rowInvitation[0].last_name;
            data["email"] = rowInvitation[0].email;
            data["phone"] = rowInvitation[0].phoneNumber;
            //data["phone"] = '+1';
            data["instgram"] = rowInvitation[0].instagram;
            data["friend_member_type"] = this.state.user_role[rowInvitation[0].selected_user_role_index].type;
            data["social_media"] = rowInvitation[0].instagram;

            if (rowInvitation[0].selected_gender_index == 0) {
                data["friend_gender"] = '1';
            } if (rowInvitation[0].selected_gender_index == 1) {
                data["friend_gender"] = '2';
            }

            

            console.log(TAG + " callInviteNoneMemberAPI uri " + uri);
            console.log(TAG + " callInviteNoneMemberAPI params " + JSON.stringify(data));

            WebService.callServicePost(uri, data, this.handleInviteNoneMember);
        } catch (error) {
            console.log(TAG + " callInviteNoneMemberAPI error " + error);
            this.setState({
                loading: false
            });
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    }

    handleInviteNoneMember = (response, isError) => {
        console.log(TAG + " callInviteNoneMemberAPI Response " + JSON.stringify(response));
        console.log(TAG + " callInviteNoneMemberAPI isError " + isError);
        if (!isError) {
            if (response.status == "success") {
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
                this.setState({
                    invited_list: [],
                    page_number: 0,
                    more_load: true
                }, () => this.getReferFriendsList())
            } else {
                this.setState({
                    loading: false
                });
                Alert.alert(response.msg, "");
            }
        } else {
            this.setState({
                loading: false
            });
            if (response != undefined && response != null && response.length > 0) {
                Alert.alert(response.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    };

    isCloseToBottom = ({ layoutMeasurement, contentOffset, contentSize }) => {
        const paddingToBottom = 10;
        return layoutMeasurement.height + contentOffset.y >=
            contentSize.height - paddingToBottom;
    };

    isCloseToTop = ({ layoutMeasurement, contentOffset, contentSize }) => {
        const paddingToBottom = 10;

        return contentOffset.y <= -40
    };

    refreshList() {

    }

    getProfileImage = (data) => {
        console.log(TAG, '---- data ->>>>', data);
        var imagePath = null;
        if (data.imgpath != null && data.imgpath != "" && data.filename != null && data.filename != "") {
            imagePath = data.imgpath + Constants.THUMB_FOLDER + data.filename;
        } else {
            imagePath = data.profileImageUrl;
        }
        console.log(TAG, '---- imagepath ', imagePath);
        if (imagePath && imagePath.length > 0) {
            return (
                <View style={stylesGlobal.card_profile_fitImage}>
                    <ImageCompressor uri={imagePath} style={{ width: '100%', height: '100%' }} />
                </View>
            )
        } else {
            if (data.member_type == "1") {
                return (
                    <View style={stylesGlobal.card_profile_fitImage}>
                        <ImageCompressor
                            url={null}
                            default={require('../icons/type_rich.png')}
                            style={{ width: '100%', height: '100%' }}
                        />
                    </View>
                )
            } else if (data.member_type == "2") {
                return (
                    <View style={stylesGlobal.card_profile_fitImage}>
                        <ImageCompressor
                            url={null}
                            default={require('../icons/type_generous.png')}
                            style={{ width: '100%', height: '100%' }}
                        />
                    </View>
                )
            } else if (data.member_type == "3") {
                return (
                    <View style={stylesGlobal.card_profile_fitImage}>
                        <ImageCompressor
                            url={null}
                            default={require('../icons/type_model.png')}
                            style={{ width: '100%', height: '100%' }}
                        />
                    </View>
                )
            } else if (data.member_type == "4" && data.gender == "male") {
                return (
                    <View style={stylesGlobal.card_profile_fitImage}>
                        <ImageCompressor
                            url={null}
                            default={require('../icons/type_vipfan.png')}
                            style={{ width: '100%', height: '100%' }}
                        />
                    </View>
                )
            } else if (data.member_type == "4" && data.gender != "male") {
                return (
                    <View style={stylesGlobal.card_profile_fitImage}>
                        <ImageCompressor
                            url={null}
                            default={require('../icons/type_vipfan_female.png')}
                            style={{ width: '100%', height: '100%' }}
                        />
                    </View>
                )
            } else if (data.member_type == "5") {
                return (
                    <View style={stylesGlobal.card_profile_fitImage}>
                        <ImageCompressor
                            url={null}
                            default={require('../icons/type_connector.png')}
                            style={{ width: '100%', height: '100%' }}
                        />
                    </View>
                )
            } else if (data.member_type == "6") {
                return (
                    <View style={stylesGlobal.card_profile_fitImage}>
                        <ImageCompressor
                            url={null}
                            default={require('../icons/type_famous.png')}
                            style={{ width: '100%', height: '100%' }}
                        />
                    </View>
                )
            } else if (data.member_type == "7") {
                return (
                    <View style={stylesGlobal.card_profile_fitImage}>
                        <ImageCompressor
                            url={null}
                            default={require('../icons/type_fan.png')}
                            style={{ width: '100%', height: '100%' }}
                        />
                    </View>
                )
            } else if (data.member_type == "8") {
                return (
                    <View style={stylesGlobal.card_profile_fitImage}>
                        <ImageCompressor
                            url={null}
                            default={require('../icons/type_fan.png')}
                            style={{ width: '100%', height: '100%' }}
                        />
                    </View>
                )
            }
        }
    }

    renderStatus(data) {
        var status_text = "";
        if (data.is_verified == 1) {
            if (data.is_fan == 0) {
                status_text = "Accepted as Member";
            } else {
                status_text = "Signed Up";
            }
        } else if (data.is_verified == 0) {
            status_text = "Waiting for Approval";
        } else {
            status_text = "Waiting for Sign Up";
        }

        return (
            <View>
                <View style={{ marginVertical: 5, }}>
                    <Text style={[styles.labelView, stylesGlobal.font_bold]}>{"Status: "}</Text>
                    <View style={{ backgroundColor: Colors.gold, alignSelf: 'flex-start', paddingVertical: 5, paddingHorizontal: 10, borderRadius: 5 }}>
                        <Text style={[styles.labelView, stylesGlobal.font]}>{status_text}</Text>
                    </View>
                </View>
                {
                    (data.added_gold_coins != null && data.added_gold_coins != "0") &&
                    <View style={{ marginVertical: 5, }}>
                        <Text style={[styles.labelView, stylesGlobal.font_bold]}>{"Added Gold Coins: "}</Text>
                        <Text style={[styles.labelView, stylesGlobal.font]}>{data.added_gold_coins}</Text>
                    </View>
                }
            </View>
        )
    }

    displayProfileInfo(data) {
        if (data.is_verified != 1) {
            return this.renderNonmember(data)
        } else {
            if (data.member_type == "1" || data.member_type == "2") {
                return this.renderTypeOneAndTwo(data);
            } else if (data.member_type == "3") {
                return this.renderMemberPlanThreeDetail(data);
            } else {
                return this.renderTypeOthers(data);
            }
        }
    }

    renderNonmember(data) {
        return (
            <View style={{ width: '100%' }}>
                {
                    data.email != null && data.email != "" &&
                    <View style={{ marginVertical: 5, }}>
                        <Text style={[styles.labelView, stylesGlobal.font_bold]}>Email: </Text>
                        <Text style={[styles.labelView, stylesGlobal.font]}>{data.email}</Text>
                    </View>
                }
                {
                    data.user_phone != null && data.user_phone != "" &&
                    <View style={{ marginVertical: 5, }}>
                        <Text style={[styles.labelView, stylesGlobal.font_bold]}>Phone: </Text>
                        <Text style={[styles.labelView, stylesGlobal.font]}>{data.user_phone}</Text>
                    </View>
                }
                {
                    data.created_at != null && data.created_at != "" &&
                    <View style={{ marginVertical: 5, }}>
                        <Text style={[styles.labelView, stylesGlobal.font_bold]}>Date Referred: </Text>
                        <Text style={[styles.labelView, stylesGlobal.font]}>{Moment(data.created_at).format("DD MMM YYYY")}</Text>
                    </View>
                }
                {
                    data.member_name != null && data.member_name != "" && 
                    <View style={{ marginVertical: 5, }}>
                        <Text style={[styles.labelView, stylesGlobal.font_bold]}>Suggested Profile Type: </Text>
                        <Text style={[styles.labelView, stylesGlobal.font]}>{data.member_name}</Text>
                    </View>

                }
            </View>
        )
    }

    renderTypeOneAndTwo(data) {
        var location = data.address;
        var netWorth = data.net_worth;
        var networth_verified_on = data.networth_verified_on;
        var goldCoins = data.gold_coins;
        if (netWorth == null || netWorth == "Not Set" || netWorth == "" || netWorth == 0) {
            netWorth = "< $2M"
        }

        return (
            <View>
                {location != null && location != "Not Set" && location != "" && location != 0 ? (
                    <View style={{ marginTop: 5, marginBottom: 5 }}>
                        <Text style={[styles.labelView, stylesGlobal.font_bold]}>Location:</Text>
                        <Text style={[styles.labelView, stylesGlobal.font]}>{location}</Text>
                    </View>
                ) : null}

                {netWorth != null && netWorth != "Not Set" && netWorth != "" && netWorth != 0 && networth_verified_on != null && networth_verified_on != undefined && networth_verified_on != "" ? (
                    <View style={{ marginTop: 5, marginBottom: 5, display: 'flex', flexDirection: 'column' }}>
                        <Text style={[styles.labelViewBold, stylesGlobal.font_bold]}>Net Worth:</Text>
                        <View style={{ display: 'flex', flexDirection: 'row' }}>
                            <Text style={[styles.labelView, stylesGlobal.font]}>{netWorth}</Text>
                            <Image style={{ width: 33, height: 20, resizeMode: 'contain', marginLeft: -5 }} source={require('../icons/verify_checkmark.png')}></Image>
                        </View>
                    </View>
                ) : netWorth != null && netWorth != "Not Set" && netWorth != "" && netWorth != 0 ? (
                    <View style={{ marginTop: 5, marginBottom: 5 }}>
                        <Text style={[styles.labelViewBold, stylesGlobal.font_bold]}>Net Worth:</Text>
                        <Text style={[styles.labelView, stylesGlobal.font]}>{netWorth}</Text>
                    </View>
                ) : null}

                {goldCoins != null && goldCoins != "Not Set" && goldCoins != "" && goldCoins != 0 ? (
                    <View style={[{ marginTop: 5, marginBottom: 5 }, stylesGlobal.font]}>
                        <Text style={[styles.labelView, stylesGlobal.font_bold]}>Gold Coins:</Text>
                        <Text style={[styles.labelView, stylesGlobal.font]}>{goldCoins}</Text>
                    </View>
                ) : null}
            </View>
        );
    }

    renderMemberPlanThreeDetail(data) {
        var location = data.address;
        var age = data.age;
        var dob_verified_on = data.dob_verified_on;
        var height = data.height;
        var eyeColor = data.eye_color;
        var hairColor = data.hair_color;
        var body = data.body;
        var measurements = null;

        if (data.bust_chest != null && data.bust_chest != "Not Set" && data.bust_chest != "" && data.bust_chest != 0) {
            measurements = data.bust_chest;
        }

        if (data.waist != null && data.waist != "Not Set" && data.waist != "" && data.waist != 0) {
            if (measurements != null) {
                measurements = measurements + " / " + data.waist;
            } else {
                measurements = data.waist;
            }
        }

        if (data.hip_inseam != null && data.hip_inseam != "Not Set" && data.hip_inseam != "" && data.hip_inseam != 0) {
            if (measurements != null) {
                measurements = measurements + " / " + data.hip_inseam;
            } else {
                measurements = data.hip_inseam;
            }
        }

        return (
            <View>
                {location != null && location != "Not Set" && location != "" && location != 0 ? (
                    <View style={{ marginTop: 5, marginBottom: 5 }}>
                        <Text style={[styles.labelView, stylesGlobal.font_bold]}>Location:</Text>
                        <Text style={[styles.labelView, stylesGlobal.font]}>{location}</Text>
                    </View>
                ) : null}

                {age != null && age != "Not Set" && age != "" && age != 0 && dob_verified_on != null && dob_verified_on != undefined && dob_verified_on != "" ? (
                    <View style={{ marginTop: 5, marginBottom: 5, display: 'flex', flexDirection: 'column' }}>
                        <Text style={[styles.labelViewBold, stylesGlobal.font_bold]}>Age:</Text>
                        <View style={{ display: 'flex', flexDirection: 'row' }}>
                            <Text style={[styles.labelView, stylesGlobal.font]}>{age}</Text>
                            <Image style={{ width: 33, height: 20, resizeMode: 'contain', marginLeft: -5 }} source={require('../icons/verify_checkmark.png')}></Image>
                        </View>
                    </View>
                ) : age != null && age != "Not Set" && age != "" && age != 0 ? (
                    <View style={{ marginTop: 5, marginBottom: 5 }}>
                        <Text style={[styles.labelViewBold, stylesGlobal.font_bold]}>Age:</Text>
                        <Text style={[styles.labelView, stylesGlobal.font]}>{age}</Text>
                    </View>
                ) : null}

                {height != null && height != "Not Set" && height != "" && height != 0 ? (
                    <View style={{ marginTop: 5, marginBottom: 5 }}>
                        <Text style={[styles.labelView, stylesGlobal.font_bold]}>Height:</Text>
                        <Text style={[styles.labelView, stylesGlobal.font]}>{height}</Text>
                    </View>
                ) : null}

                {eyeColor != null && eyeColor != "Not Set" && eyeColor != "" && eyeColor != 0 ? (
                    <View style={{ marginTop: 5, marginBottom: 5 }}>
                        <Text style={[styles.labelView, stylesGlobal.font_bold]}>Eye color:</Text>
                        <Text style={[styles.labelView, stylesGlobal.font]}>{eyeColor}</Text>
                    </View>
                ) : null}

                {hairColor != null && hairColor != "Not Set" && hairColor != "" && hairColor != 0 ? (
                    <View style={{ marginTop: 5, marginBottom: 5 }}>
                        <Text style={[styles.labelView, stylesGlobal.font_bold]}>Hair color:</Text>
                        <Text style={[styles.labelView, stylesGlobal.font]}>{hairColor}</Text>
                    </View>
                ) : null}
                {body != null && body != "Not Set" && body != "" && body != 0 ? (
                    <View style={{ marginTop: 5, marginBottom: 5 }}>
                        <Text style={[styles.labelView, stylesGlobal.font_bold]}>Body:</Text>
                        <Text style={[styles.labelView, stylesGlobal.font]}>{body}</Text>
                    </View>
                ) : null}

                {measurements != null ? (
                    <View style={{ marginTop: 5, marginBottom: 5 }}>
                        <Text style={[styles.labelView, stylesGlobal.font_bold]}>Measurements:</Text>
                        <Text style={[styles.labelView, stylesGlobal.font]}>
                            {measurements}
                        </Text>
                    </View>
                ) : null}
            </View>
        );
    }

    renderTypeOthers(data) {
        var location = data.address;
        var age = data.age;
        var dob_verified_on = data.dob_verified_on;
        var totalFollower = data.totalFollower;
        var totalConnection = data.totalConnection;
        return (
            <View>
                {location != null && location != "Not Set" && location != "" && location != 0 ? (
                    <View style={{ marginTop: 5, marginBottom: 5 }}>
                        <Text style={[styles.labelView, stylesGlobal.font_bold]}>Location:</Text>
                        <Text style={[styles.labelView, stylesGlobal.font]}>{location}</Text>
                    </View>
                ) : null}
                {age != null && age != "Not Set" && age != "" && age != 0 && dob_verified_on != null && dob_verified_on != undefined && dob_verified_on != "" ? (
                    <View style={{ marginTop: 5, marginBottom: 5, display: 'flex', flexDirection: 'column' }}>
                        <Text style={[styles.labelViewBold, stylesGlobal.font_bold]}>Age:</Text>
                        <View style={{ display: 'flex', flexDirection: 'row' }}>
                            <Text style={[styles.labelView, stylesGlobal.font]}>{age}</Text>
                            <Image style={{ width: 33, height: 20, resizeMode: 'contain', marginLeft: -5 }} source={require('../icons/verify_checkmark.png')}></Image>
                        </View>
                    </View>
                ) : age != null && age != "Not Set" && age != "" && age != 0 ? (
                    <View style={{ marginTop: 5, marginBottom: 5 }}>
                        <Text style={[styles.labelViewBold, stylesGlobal.font_bold]}>Age:</Text>
                        <Text style={[styles.labelView, stylesGlobal.font]}>{age}</Text>
                    </View>
                ) : null}
                {(data.member_plan == "6" || data.member_plan == "8") && totalFollower != null && totalFollower != "Not Set" && totalFollower != "" && totalFollower != 0 ? (
                    <View style={{ marginTop: 5, marginBottom: 5 }}>
                        <Text style={[styles.labelView, stylesGlobal.font_bold]}>{"Fans"}</Text>
                        <Text style={[styles.labelView, stylesGlobal.font]}>{totalFollower}</Text>
                    </View>
                ) : null}
                {data.member_plan == "5" && totalConnection != null && totalConnection != "Not Set" && totalConnection != "" && totalFollower != 0 ? (
                    <View style={{ marginTop: 5, marginBottom: 5 }}>
                        <Text style={[styles.labelView, stylesGlobal.font_bold]}>{"Connections"}</Text>
                        <Text style={[styles.labelView, stylesGlobal.font]}>{totalConnection}</Text>
                    </View>
                ) : null}
            </View>
        );
    }


    render() {
        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: Colors.black }}>
                <View style={styles.container} onStartShouldSetResponder={() => Keyboard.dismiss()}>
                    {
                        this.state.loading && <ProgressIndicator />
                    }
                    {this.state.showInvitationPopUp && this.renderInvitationPopUp()}
                    {this.state.showPhoneEmailSelectPopUp && this.renderPhoneEmailSelectPopUp()}
                    {this.renderHeaderView()}
                    {this.renderBannerView()}
                    {this.renderPopupView()}
                    <View style={{ alignItems: 'center', width: '100%', height: 40, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.card_titlecolor, borderRadius: 3 }}>
                        <Text style={[{ color: Colors.gold, fontSize: 20 }, stylesGlobal.font]}>{"INVITED FRIENDS"}</Text>
                    </View>
                    {
                        !this.state.showInvitationPopUp && <View style={{ width: '100%', marginTop: 10, alignItems: 'flex-end', paddingRight: 20 }}>
                            <TouchableOpacity style={[{ padding: 10, backgroundColor: Colors.gold, borderRadius: 5 }, stylesGlobal.shadow_style]} onPress={() => this.setState({ showInvitationPopUp: true, personal_note: "", 
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
                                popup_value_changed: false })}>
                                <Text style={[{ fontSize: 16, color: Colors.white, textAlign: 'center' }, stylesGlobal.font]}>{"Invite Friends"}</Text>
                            </TouchableOpacity>
                        </View>
                    }
                    {
                        !this.state.loading && this.state.invited_list.length == 0 &&
                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                            <View style={[stylesGlobal.empty_cardView, { height: '90%', justifyContent: 'center', alignItems: 'center' }]}>
                                <Text style={[stylesGlobal.card_empty_text, stylesGlobal.font]}>{"No invited friend yet"}</Text>
                            </View>
                        </View>
                    }
                    {
                        this.state.invited_list.length > 0 &&
                        <View style={{ flex: 1, marginTop: 10, alignItems: 'center' }}>
                            <FlatList
                                ListHeaderComponent={this.state.pulldown_loading && <PullDownIndicator />}
                                ListFooterComponent={this.state.displayLoadMoreView == true ? footerView : null}
                                extraData={this.state}
                                showsHorizontalScrollIndicator={false}
                                showsVerticalScrollIndicator={false}
                                data={this.state.invited_list}
                                keyExtractor={(item, index) => index.toString()}
                                style={{ width: '100%' }}
                                numColumns={this.state.is_portrait ? 1 : 2}
                                key={this.state.is_portrait ? 1 : 2}
                                renderItem={({ item, index }) => (
                                    <View key={index} style={{ width: this.state.is_portrait ? '100%' : '50%', alignItems: 'center' }}>
                                        <View style={stylesGlobal.cardView_container}>
                                            {
                                                getRibbonImage(item)
                                            }
                                            <View style={stylesGlobal.cardView}>
                                                <View style={{ width: '100%', alignItems: 'center' }}>
                                                    <View style={stylesGlobal.card_profile_fitImageView}>
                                                        {this.getProfileImage(item)}
                                                    </View>
                                                </View>
                                                <View style={{ width: '100%', marginTop: 20 }}>
                                                    <Text style={[{ color: Colors.gold, fontSize: 16, marginBottom: 10 }, stylesGlobal.font_bold]}>
                                                        {item.name ? item.name : ""}
                                                    </Text>
                                                    {this.displayProfileInfo(item)}
                                                    {this.renderStatus(item)}
                                                </View>
                                            </View>
                                        </View>
                                    </View>
                                )}
                                onMomentumScrollBegin={() => { this.onEndReachedCalledDuringMomentum = false; }}
                                onEndReachedThreshold={0.5}
                                onEndReached={({ distanceFromEnd }) => {
                                    if (!this.onEndReachedCalledDuringMomentum && this.state.more_load) {
                                        this.onEndReachedCalledDuringMomentum = true;
                                        this.getReferFriendsList();
                                    }
                                }}
                                onScroll={async ({ nativeEvent }) => {
                                    if (this.isCloseToTop(nativeEvent)) {
                                        this.setState({
                                            invited_list: [],
                                            page_number: 0,
                                            more_load: true
                                        }, () => this.getReferFriendsList())
                                    }
                                }}
                            />
                        </View>
                    }
                </View>
            </SafeAreaView>
        );
    }

    renderBannerView = () => {
        return (
            <BannerView
                screenProps={this.props.navigation}
            />
        )
    }

    selectContact = async (invite_index) => {


        console.log(TAG, 'editing vtn', this.props.navigtion)

        await selectContact()
            .then(async (selection) => {


                console.log(TAG, 'result the selection', selection)
                if (!selection) {
                    this.setState({
                        selected_invite_index: -1
                    })
                    return null;
                }

                console.log(selection)

                this.setState({
                    selected_invite_index: invite_index
                })

// {"emails": [{"address": "John-Appleseed@mac.com", "type": "work"}], "familyName": "Appleseed", "givenName": "John", "middleName": "", "name": "John Appleseed", "phones": [{"number": "888-555-5512", "type": "mobile"}, {"number": "888-555-1212", "type": "home"}], "postalAddresses": [{"city": "Atlanta", "isoCountryCode": "us", "postalCode": "30303", "state": "GA", "street": "3494 Kuhl Avenue"}, {"city": "Atlanta", "isoCountryCode": "us", "postalCode": "30303", "state": "GA", "street": "1234 Laurel Street"}], "recordId": "410FE041-5C4E-48DA-B4DE-04C15EA3DBAC"}

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


                    console.log(
                        'sdfad===sdfs=sd=fs=fs=d=fsd=f=sd=sdf'
                        )
                    this.setState({
                        selected_contact: selection,
                        showPhoneEmailSelectPopUp: true,
                    }, () => {console.log('current selected contact', selection)})
                } else 
                {
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

                    console.log(
                        '____________________----------f'
                        )



                    this.setState({
                        rowInvitation: rowInvitation
                    })
                }
            });
    }

    renderInvitationPopUp = () => {
        const { rowInvitation } = this.state;
        return (
            <View style={stylesGlobal.invite_popup_container_view}>
                <View onStartShouldSetResponder={() => this.setState({ showInvitationPopUp: false, rowInvitation: [{ first_name: '', last_name: '', email: '', phoneNumber: '', selected_user_role_index: 6, selected_gender_index: 0, popup_value_changed: false, instagram: '' }] })}
                    style={{ position: 'absolute', width: '100%', height: '100%', top: 0, left: 0, backgroundColor: Colors.black, opacity: 0.3 }} />
                <View style={stylesGlobal.invite_popup_main_view}>
                    <View style={{ width: '100%', alignItems: 'flex-end', marginTop: 20, paddingHorizontal: 5 }}>
                        <TouchableOpacity style={{ width: 15, height: 15, }} onPress={() => this.setState({ showInvitationPopUp: false })}>
                            <Image style={{ width: '100%', height: '100%', tintColor: Colors.gold }} source={require('../icons/connection-delete.png')} />
                        </TouchableOpacity>
                    </View>
                    <KeyboardAwareScrollView keyboardShouldPersistTaps = "handled" style={{ width: '100%' }} contentContainerStyle={{ alignItems: 'center', }} extraScrollHeight={50}>
                        <View style={{ width: '100%', alignItems: 'center' }}>
                            <Image style={stylesGlobal.invite_popup_crown_image} source={require('../icons/crown.png')} />
                            <Text style={[stylesGlobal.invite_view_header_text, stylesGlobal.font, { width: '80%' }]}>{Constants.REFER_FRIEND_VIEW_HEADER}</Text>
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
                                                        rowInvitation,
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
                                            style={[stylesGlobal.invite_view_gender_view,]}
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
                                            }}
                                            renderRow={(member_type_item, member_type_index, highlighted) => {
                                                console.log('last image url = ', JSON.stringify(member_type_item));
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
                                {/* <View style={[stylesGlobal.invite_row_view, { flexDirection: 'column', marginTop: 0 }]}> */}
                                {/*     <Text style={[{ fontSize: 12, color: Colors.black }, stylesGlobal.font]}>{"Phone Number"}</Text> */}
                                {/*     <View style={stylesGlobal.invite_view_input_view}> */}
                                {/*         <PhoneInput */}
                                {/*             ref='phone' */}
                                {/*             value={rowInvitation[0].phoneNumber} */}
                                {/*             onChangePhoneNumber={text => { */}
                                {/*                 rowInvitation[0].phoneNumber = text; */}
                                {/*                 this.setState({ rowInvitation }) */}
                                {/*             }} */}
                                {/*             onSelectCountry={(country) => { */}
                                {/*                 console.log(country) */}
                                {/*             }} */}
                                {/*             style={stylesGlobal.invite_view_input_text} */}
                                {/*             flagStyle={{ */}
                                {/*                 width: 25, */}
                                {/*                 height: 15 */}
                                {/*             }} */}
                                {/*             textStyle={[stylesGlobal.font, { fontSize: 12 }]} */}
                                {/*         /> */}
                                {/*     </View> */}
                                {/* </View> */}
                                {/* <Text style={[{ fontSize: 12, color: Colors.black, marginTop: 10 }, stylesGlobal.font]}>{"or"}</Text> */}
                                {/* <View style={[stylesGlobal.invite_row_view, { flexDirection: 'column', marginTop: 0 }]}> */}
                                {/*     <Text style={[{ fontSize: 12, color: Colors.black }, stylesGlobal.font]}>{"Instagram"}</Text> */}
                                {/*     <View style={stylesGlobal.invite_view_input_view}> */}
                                {/*         <TextInput */}
                                {/*             placeholder='@name' */}
                                {/*             // value={rowInvitation[0].email} */}
                                {/*             style={[stylesGlobal.invite_view_input_text, stylesGlobal.font]} */}
                                {/*             onChangeText={text => { */}
                                {/*                 rowInvitation[0].instagram = text; */}
                                {/*                 this.setState({rowInvitation}) */}
                                {/*             }} */}
                                {/*         /> */}
                                {/*     </View> */}
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
                                <View style={[stylesGlobal.invite_row_view, { flexDirection: 'column' }]}>
                                    <Text style={[{ fontSize: 12, color: Colors.black }, stylesGlobal.font]}>{"Add a Personal Note (optional)"}</Text>
                                    <View style={[stylesGlobal.invite_view_input_view, { height: 80 }]}>
                                        <TextInput
                                            value={this.state.personal_note}
                                            style={[stylesGlobal.invite_view_input_text, stylesGlobal.font, { width: '100%', height: '100%', paddingHorizontal: 5, textAlignVertical: 'top' }]}
                                            multiline={true}
                                            onChangeText={text => {
                                                this.setState({ personal_note: text })
                                            }}
                                        />
                                    </View>
                                </View>
                            </View>


                            <TouchableOpacity style={[stylesGlobal.invite_view_submit_button, { marginBottom: 20 }, stylesGlobal.shadow_style]}
                                onPress={() => this.callInviteNoneMemberAPI()}
                            >
                                <Text style={[stylesGlobal.invite_view_submit_button_text, stylesGlobal.font]}>{"Invite your friend"}</Text>
                            </TouchableOpacity>
                        </View>
                    </KeyboardAwareScrollView>
                </View>
            </View>
        )
    }


    renderPhoneEmailSelectPopUp = () => {
        return (
            <View style={{ position: 'absolute', width: '100%', height: '100%', top: 0, left: 0, zIndex: 100, justifyContent: 'flex-end', alignItems: 'center' }}>
                <View onStartShouldSetResponder={() => this.setState({ showPhoneEmailSelectPopUp: false })}
                    style={{
                        position: 'absolute',
                        width: '100%',
                        height: '100%',
                        top: 0,
                        left: 0,
                        backgroundColor: Colors.black,
                        opacity: 0.3,
                    }}
                />
                <View style={{
                    width: '90%',
                    maxHeight: '90%',
                    backgroundColor: Colors.white,
                    alignItems: 'center',
                    paddingHorizontal: 15,
                    borderRadius: 10,
                    justifyContent: 'center',
                    marginBottom: 30,
                }}>
                    <TouchableOpacity style={{ position: 'absolute', top: 20, right: 20, width: 15, height: 15, zIndex: 20 }} onPress={() => this.setState({ showPhoneEmailSelectPopUp: false })}>
                        <Image style={{ width: '100%', height: '100%', tintColor: Colors.gold }} source={require('../icons/connection-delete.png')} />
                    </TouchableOpacity>
                    <Text style={[stylesGlobal.font, { fontSize: 15, textAlign: 'center', marginTop: 30 }]}>{"Select Phone Number and Email"}</Text>
                    <View style={{ width: '90%', height: 1, backgroundColor: Colors.gray, marginVertical: 10 }} />
                    <View style={{ width: '100%', }}>
                        <Text style={[stylesGlobal.font, { fontSize: 15, }]}>{"Name"}</Text>
                        <View style={{ width: '100%', alignItems: 'flex-end' }}>
                            <View style={{ width: '90%', flexDirection: 'row', alignItems: 'center' }}>
                                <Text style={[stylesGlobal.font, { fontSize: 14, textAlign: 'center', width: 60 }]}>{"name"}</Text>
                                <Text
                                    style={[{
                                        paddingLeft: 10,
                                        borderRadius: 3,
                                        borderWidth: 1,
                                        borderColor: Colors.gray,
                                        width: '70%',
                                        marginTop: 10,
                                        paddingVertical: 5,
                                        fontSize: 12
                                    }, stylesGlobal.font]}
                                >{this.state.selected_contact.name}</Text>
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
                                        <Text
                                            style={[{
                                                paddingLeft: 10,
                                                borderRadius: 3,
                                                borderWidth: 1,
                                                borderColor: Colors.gray,
                                                width: '70%',
                                                marginTop: 10,
                                                paddingVertical: 5,
                                                fontSize: 12
                                            }, stylesGlobal.font]}
                                        >{item.address}</Text>
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
                    <TouchableOpacity
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
                        style={[{
                            paddingHorizontal: 10,
                            paddingVertical: 10,
                            backgroundColor: Colors.gold,
                            borderRadius: 3,
                            marginBottom: 20,
                            width: '50%',
                            alignItems: 'center'
                        }, stylesGlobal.shadow_style]}
                    >
                        <Text style={[stylesGlobal.font, { color: Colors.white, fontSize: 12 }]}>{"Select"}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        )
    }

    /**
   * get profile info API again
   */
    getDataAgain = (refresh) => {
        if (refresh) {
            this.getData();
        }
    }
    /** render PopUp Menu
    *
    * @returns {*}
    */

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

    /**
   * display top header
   */
    renderHeaderView = () => {

        let imageUrl = this.state.userImagePath + Constants.THUMB_FOLDER + this.state.userImageName;

        return (
            <View style={stylesGlobal.headerView}>
                <TouchableOpacity style={stylesGlobal.header_backbuttonview_style} onPress={() => this.props.navigation.goBack()}>
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
                        placeholder="Search members..."
                        onSubmitEditing={this.handleEditComplete}
                        keyboardType='ascii-capable'
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


    /**
* handle search button click of keybaord
*/
    handleEditComplete = () => {
        searchText = this.state.searchText.trim();
        this.setState({
            searchText: searchText,
        });
        if (searchText.length > 0) {
            this.props.rootNavigation.navigate('Dashboard', { selected_screen: "members", search_text: searchText });
        }
    };
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: "100%",
        height: "100%",
        backgroundColor: Colors.black,
    },
    labelView: {
        color: Colors.black,
        fontSize: 13,
    },
});
