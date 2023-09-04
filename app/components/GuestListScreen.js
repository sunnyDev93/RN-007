import React, { Component, Fragment } from "react";
import {
    Platform,
    StyleSheet,
    Text,
    View,
    Image,
    FlatList,
    TouchableOpacity,
    Dimensions,
    TextInput,
    SafeAreaView,
    Alert,
    Keyboard
} from "react-native";
import Moment from "moment/moment";
import PhoneInput from 'react-native-phone-input'
import { selectContact, selectContactPhone, selectContactEmail } from 'react-native-select-contact';
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import AsyncStorage from '@react-native-community/async-storage';

import RowGuest from "./RowGuest";
import WebService from "../core/WebService";
import { ImageCompressor } from './ImageCompressorClass'
import CustomPopupView from "../customview/CustomPopupView"
import { stylesGlobal, STICKY_HEADER_HEIGHT } from '../consts/StyleSheet'
import { Constants } from "../consts/Constants";
import { Colors } from "../consts/Colors";
import * as Global from "../consts/Global";
import ProgressIndicator from "./ProgressIndicator";
import PullDownIndicator from "./PullDownIndicator";
import Memory from '../core/Memory'
import * as ValidationUtils from "../utils/ValidationUtils";
import { getEventsForInvite, callInviteUserToEvent, callFavoriteMember, callFollowRequest, TimeCompare } from "../utils/Util";
import ModalDropdown from "../custom_components/react-native-modal-dropdown/ModalDropdown";
import BannerView from "../customview/BannerView";
import { removeCountryCode } from "../utils/Util";
import CountryPicker, { getAllCountries } from 'react-native-country-picker-modal';
import { AsYouType, parseNumber, parsePhoneNumberFromString, formatNumber  } from 'libphonenumber-js';


const { width, height } = Dimensions.get("window");
var TAG = "GuestListScreen";

export default class GuestListScreen extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            pulldown_loading: false,
            showModel: false,
            userId: "",
            userToken: "",
            userImageName: "",
            userImagePath: "",
            loading: false,
            dataGuestList: [],
            displayLoadMoreLoader: false,
            eventId: this.props.route.params.eventId,
            inviteList: this.props.route.params.inviteList,
            searchText: "",
            ishosted: this.props.route.params.ishosted,
            is_cancelled: this.props.route.params.is_cancelled,
            is_past: this.props.route.params.is_past,
            page_number: 0,
            more_load: true,
            action_loading: false,

            selected_action_user: null, ///  button clicked user
            eventDetailData: this.props.route.params.eventDetailData,

            total_count: 0,/// the number of total guests
            confirm_count: 0,  /// the number of total confirmed guests

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
            showPhoneEmailSelectPopUp: false,
            selected_contact: null,
            user_role: Global.entries,
            user_gender: [{ type: "Male", image: require('../icons/signup_male.png') }, { type: "Female", image: require('../icons/signup_female.png') }],

            is_portrait: true,
            popup_value_changed: false, // when changed a value in popup
            search_count: 0, // used when search from type username

            chatAuthToken: "",

            

        };
        this.unsubscribe = null;

        this.onEndReachedCalledDuringMomentum = true;
    }

    UNSAFE_componentWillMount() {

    }

    async componentDidMount() {
        await this.getData();
        this.callGetGuestListCountAPI();
        this.callGetGuestListAPI(true);
        // this.initListener = this.props.navigation.addListener('focus', this.initData.bind(this));

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
        // this.initListener();
    }

    initData = () => {
        this.setState({
            page_number: 0
        }, async () => {
            await this.getData();
            this.callGetGuestListCountAPI();
            this.callGetGuestListAPI(true);
        })

    }

    /**
    * get async storage data
    */
    getData = async () => {
        try {
            var userId = await AsyncStorage.getItem(Constants.KEY_USER_ID);
            var userToken = await AsyncStorage.getItem(Constants.KEY_USER_TOKEN);
            var userImageName = await AsyncStorage.getItem(Constants.KEY_USER_IMAGE_NAME);
            var userImagePath = await AsyncStorage.getItem(Constants.KEY_USER_IMAGE_URL);
            this.setState({
                userId: userId,
                userToken: userToken,
                userImageName: userImageName,
                userImagePath: userImagePath,
                search_count: 0,
            });
            await this.callGetChatToken();
        } catch (error) {
            // Error retrieving data
        }
    };

    // Get Chat information -- start
    callGetChatToken = async () => {
        try {
            let uri = Memory().env == "LIVE" ? Global.URL_GET_CHAT_TOKEN : Global.URL_GET_CHAT_TOKEN_DEV;
            if (this.state.userToken == undefined) {
                this.setState({ userToken: await AsyncStorage.getItem(Constants.KEY_USER_TOKEN) });
            }
            let params = new FormData();
            params.append("token", this.state.userToken);
            params.append("format", "json");
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
    }

    handleCallGetChatTokenResponse = async (response, isError) => {
        // console.log(TAG + " callGetChatTokenAPI Response " + JSON.stringify(response));
        console.log(TAG + " callGetChatTokenAPI isError " + isError);
        if (!isError) {
            if (response != null && response.status == "success") {
                Global.CHAT_AUTH_TOKEN = response.data.chatToken;
                this.setState({ chatAuthToken: response.data.chatToken });
            }
        } else {
            if (response != undefined && response != null && response.length > 0) {
                Alert.alert(response.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    };
    // Get Chat information -- end

    callGetGuestListCountAPI = async () => {
        try {

            let uri = Memory().env == "LIVE" ? Global.URL_GUEST_LIST_COUNT + this.state.eventId : Global.URL_GUEST_LIST_COUNT_DEV + this.state.eventId;
            let params = {
                "token": this.state.userToken,
                "user_id": this.state.userId,
                "format": "json"
            };
            console.log(TAG + " callGetGuestListCountAPI uri " + uri);
            console.log(TAG + " callGetGuestListCountAPI params " + JSON.stringify(params));
            WebService.callServicePost(
                uri,
                params,
                this.handleGetGuestListCountResponse
            );
        } catch (error) {

            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    };
    /**
    * handle get guest list API response
    */
    handleGetGuestListCountResponse = (response, isError) => {
        // console.log(TAG + " callGetGuestListCountAPI result " + JSON.stringify(response));
        console.log(TAG + " isError " + isError);
        if (!isError) {
            var result = response;
            if (typeof result != undefined && result != null) {
                if (result.status == "success") {
                    this.setState({
                        total_count: result.data.waitlistCount,
                        confirm_count: result.data.attendeeCount,
                    })
                }
            }
        } else {
            if (response != undefined && response != null && response.length > 0) {
                Alert.alert(response.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    };

    /*
    * call get guest list API and display content
    */
    callGetGuestListAPI = async () => {
        try {
            if (this.state.pulldown_loading || this.state.displayLoadMoreLoader) {
                this.setState({
                    loading: false,
                });
            } else {
                this.setState({
                    loading: true,
                });
            }

            let uri = Memory().env == "LIVE" ? Global.URL_GUEST_LIST + this.state.eventId + "/" + this.state.page_number : Global.URL_GUEST_LIST_DEV + this.state.eventId + "/" + this.state.page_number
            let params = {
                "token": this.state.userToken,   
                "user_id": this.state.userId,
                "format": "json",
                "keyword": this.state.searchText
            };
            this.setState({
                search_count: this.state.search_count + 1
            })

            console.log(TAG + " callGetGuestListAPI uri " + uri);
            console.log(TAG + " callGetGuestListAPI params " + JSON.stringify(params));

            WebService.callServicePost(
                uri,
                params,
                this.handleGetGuestListResponse
            );
        } catch (error) {
            this.setState({
                pulldown_loading: false,
                loading: false,
                displayLoadMoreLoader: false
            });
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    };
    /**
    * handle get guest list API response
    */
    handleGetGuestListResponse = (response, isError) => {
        // console.log(TAG + " callGetGuestListAPI Response " + JSON.stringify(response));
        console.log(TAG + " callGetGuestListAPI isError " + isError);
        if (!isError) {
            var result = response;
            if (typeof result != undefined && result != null) {
                if (typeof result.data != undefined && result.data != null) {
                    var mData = result.data;
                    if (this.state.displayLoadMoreLoader) {
                        this.setState({
                            dataGuestList: [...this.state.dataGuestList, ...mData]
                        })
                    } else {
                        this.setState({
                            dataGuestList: mData
                        })
                    }
                    if (mData.length == 0) {
                        this.setState({
                            more_load: false
                        })
                    } else {
                        this.setState({
                            more_load: true,
                            page_number: this.state.page_number + 1
                        })
                    }
                }
            }
        } else {
            if (response != undefined && response != null && response.length > 0) {
                Alert.alert(response.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }

            this.setState({
                loading: false
            }, () => {
                this.props.navigation.goBack();
            })

            return;

        }
        if (this.state.search_count > 0) {
            this.setState({
                search_count: this.state.search_count - 1,
            }, () => {
                if (this.state.search_count == 0) {
                    this.setState({
                        loading: false
                    })
                }
            }
            )
        } else {
            this.setState({
                loading: false
            })
        }
        this.setState({
            pulldown_loading: false,
            displayLoadMoreLoader: false
        });

    };

    callInviteNoneMemberAPI = async () => {

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
            let uri = Memory().env == "LIVE" ? Global.URL_INVITEE_NON_MEMBER : Global.URL_INVITEE_NON_MEMBER_DEV;
            let params = {
                "token": this.state.userToken,
                "user_id": this.state.userId,
                "format": "json",
                "event_id": this.state.eventId
            };
            let aryEmail = [];
            let aryName = [];
            let aryPhone = [];
            let aryMemberType = [];
            let aryGender = [];
            let pinstagram = [];
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
            params["pemail"] = JSON.stringify(aryEmail);
            params["pname"] = JSON.stringify(aryName);
            params["pphone"] = JSON.stringify(aryPhone);
            params["pmembertype"] = JSON.stringify(aryMemberType);
            params["pgender"] = JSON.stringify(aryGender);
            params["pinstagram"] = JSON.stringify(pinstagram);
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
                this.setState({
                    page_number: 0
                }, () => {
                    this.callGetGuestListCountAPI();
                    this.callGetGuestListAPI(true);
                })
            } else {
                this.setState({
                    loading: false
                })
                Alert.alert(result.error_msg[0]);
            }
        } else {
            this.setState({
                loading: false
            });
            // if (response != undefined && response != null && response.length > 0) {
            //     Alert.alert(response.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            // }
            if (response != undefined && response != null && response.length > 0) {
                Alert.alert(response.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }

    };

    // callEventDetailAPI = async (eventId) => {
    //     try {
    //         // this.setState({
    //         //     loading: true,
    //         // });
    //         let uri = Memory().env == "LIVE" ? Global.URL_EVENT_DETAIL + eventId : Global.URL_EVENT_DETAIL_DEV + eventId
    //         let params = new FormData();
    //         params.append("token", this.state.userToken);
    //         params.append("user_id", this.state.userId);
    //         params.append("format", "json");
    //         params.append("data", "");

    //         console.log(TAG + " callEventDetailAPI uri " + uri);
    //         console.log(TAG + " callEventDetailAPI params " + JSON.stringify(params));

    //         WebService.callServicePost(uri, params, this.handleEventDetailResponse);
    //     } catch (error) {
    //         this.setState({
    //             loading: false,
    //             commentLoading: false
    //         });
    //         if (error != undefined && error != null && error.length > 0) {
    //             Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
    //         }
    //     }
    // };

    // /**
    // * handle event detai lAPI response
    // */
    // handleEventDetailResponse = (response, isError) => {
    //     console.log(TAG + " callEventDetailAPI Response " + JSON.stringify(response));
    //     console.log(TAG + " callEventDetailAPI isError " + isError);
    //     if (!isError) {
    //         var result = response;
    //         if (result != undefined && result != null) {
    //             if (result.data != undefined && result.data != null) {
    //                 this.setState({
    //                     inviteList: result.data.invite,
    //                 })
    //             }
    //         }
    //     } else {
    //         if (response != undefined && response != null && response.length > 0) {
    //             Alert.alert(response.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
    //         }
    //     }
    //     // this.setState({
    //     //     loading: false,
    //     // });
    // };


    render() {
        let emptyView = (
            <View style={styles.emptyView}>
                <View style={stylesGlobal.empty_cardView}>
                    <Text style={[stylesGlobal.card_empty_text, stylesGlobal.font,]}>{"The Guest List is empty"}</Text>
                </View>
            </View>
        );

        // var event_toDateTime = Moment(this.state.eventDetailData.info.to_date).utc().format('DD MMM YYYY HH:mm:ss') ;
        
        //var event_toDateTime = Moment(this.state.eventDetailData.info.to_date).utc().format('DD MMM YYYY HH:mm:ss') + " " + this.state.eventDetailData.info.to_time;
        // var currentEstDate = Moment(Date.now()).utcOffset('-0500').format("DD MMM YYYY HH:mm:ss");

        // console.log('event_toDateTime', event_toDateTime, currentEstDate, new Date(event_toDateTime), new Date(currentEstDate));
        //&& TimeCompare(this.state.eventDetailData.info.to_date)

        console.log('buttons on invite list = ', this.state.ishosted, this.state.is_past, this.state.is_canceled, TimeCompare(this.state.eventDetailData.info.to_date));
       
        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: Colors.black }}>
                <View style={styles.container} onStartShouldSetResponder={() => Keyboard.dismiss()}>
                    {this.state.showInvitationPopUp && this.renderInvitationPopUp()}
                    {this.state.showPhoneEmailSelectPopUp && this.renderPhoneEmailSelectPopUp()}
                    {this.renderHeaderView()}
                    {this.renderBannerView()}
                    {this.renderPopupView()}
                    <View style={{ alignItems: 'center', width: '100%', justifyContent: 'center', alignItems: 'center', }}>
                        <Text style={[{ color: Colors.gold, fontSize: 14 }, stylesGlobal.font]}>{this.state.eventDetailData.info.title}</Text>
                    </View>
                    <View style={{ alignItems: 'center', width: '100%', height: 40, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.card_titlecolor, borderRadius: 3, marginTop: 5 }}>
                        <Text style={[{ color: Colors.gold, fontSize: 20 }, stylesGlobal.font]}>GUEST LIST ({this.state.confirm_count.toString()}/{this.state.total_count.toString()})</Text>
                    </View>
                    {
                        this.state.ishosted && !this.state.is_past && !this.state.is_cancelled  &&
                        <View style={{ width: '100%', alignItems: 'center' }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', marginTop: 10, width: '90%' }}>
                                <TouchableOpacity style={{ backgroundColor: Colors.gold, paddingVertical: 10, borderRadius: 5, width: '45%', alignItems: 'center' }}
                                    onPress={() => {
                                        const { eventId, loadAfterDeletingEvent, inviteList, goToEventScreen } = this.props.route.params;
                                        this.props.navigation.navigate("InviteFriend", {
                                            eventId: this.state.eventId,
                                            hostId: this.state.eventDetailData.info.event_host_userid,
                                            inviteList: this.state.dataGuestList,
                                            loadAfterDeletingEvent: loadAfterDeletingEvent,
                                            refreshListData: this.refreshListData,
                                        })
                                    }}
                                >
                                    <Text style={[stylesGlobal.font, { color: Colors.white, fontSize: 15 }]}>{"Invite Friends"}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() =>
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
                                    style={{ backgroundColor: Colors.gold, paddingVertical: 10, borderRadius: 5, width: '47%', alignItems: 'center' }}
                                >
                                    <Text style={[stylesGlobal.font, { color: Colors.white, fontSize: 15 }]}>{"Invite Non-members"}</Text>
                                </TouchableOpacity>
                            </View>
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', marginTop: 10, width: '90%', marginTop: 10 }}>
                                <TouchableOpacity style={{ backgroundColor: Colors.gold, paddingVertical: 10, borderRadius: 5, width: '45%', alignItems: 'center', }}
                                    onPress={() => {
                                        this.props.navigation.navigate("MyListsNavigation", { invite_guest: true, eventId: this.state.eventId, inviteList: this.state.dataGuestList, })
                                    }}
                                >
                                    <Text style={[stylesGlobal.font, { color: Colors.white, fontSize: 15 }]}>{"Invite from Friend List"}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={{ backgroundColor: Colors.gold, paddingVertical: 10, borderRadius: 5, width: '47%', alignItems: 'center', }}
                                    onPress={() => {
                                        console.log('-------- event_id = ', this.state.eventId)
                                        this.props.navigation.navigate("ImportGuestEvent", { event_id: this.state.eventId, inviteList: this.state.inviteList });
                                    }}
                                >
                                    <Text style={[stylesGlobal.font, { color: Colors.white, fontSize: 15 }]}>{"Import Guest List"}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    }
                    {
                        !this.state.loading && this.state.dataGuestList.length == 0 &&
                        emptyView
                    }
                    {
                        !this.state.loading && this.state.dataGuestList.length > 0 &&
                        this.renderMainView()
                    }
                    {
                        (this.state.loading == true || this.state.action_loading == true) && <ProgressIndicator />
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

        let selection = await selectContact();
        if (!selection) {
            this.setState({
                selected_invite_index: -1
            })
            return null;
        }
        try {
            this.setState({ selected_invite_index: invite_index });
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
        } catch (error) {
            console.log(TAG, " select contact error : ", error);
        }
    }

    renderPhoneEmailSelectPopUp = () => {
        return (
            <View style={{ position: 'absolute', width: '100%', height: '100%', top: 0, left: 0, zIndex: 19, justifyContent: 'flex-end', alignItems: 'center' }}>
                <View onStartShouldSetResponder={() => this.setState({ showPhoneEmailSelectPopUp: false })}
                    style={{ position: 'absolute', width: '100%', height: '100%', top: 0, left: 0, backgroundColor: Colors.black, opacity: 0.3, }} />
                <View style={{ width: '90%', maxHeight: '90%', backgroundColor: Colors.white, alignItems: 'center', paddingHorizontal: 15, borderRadius: 10, justifyContent: 'center', marginBottom: 30, }}>
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
                                rowInvitation[this.state.selected_invite_index].pinstagram = "";
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

    renderInvitationPopUp = () => {
        var rowInvitation = this.state.rowInvitation;
        return (
            <View style={stylesGlobal.invite_popup_container_view}>
                <View onStartShouldSetResponder={() => this.setState({ showInvitationPopUp: false })}
                    style={{ position: 'absolute', width: '100%', height: '100%', top: 0, left: 0, backgroundColor: Colors.black, opacity: 0.3, }} />
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
                            {/* {this.renderInviteRows()} */}
                            {/* <View style = {{width: '100%', alignItems: 'center', justifyContent: 'center', borderTopColor: Colors.gray, borderTopWidth: 1}}>
                                <TouchableOpacity style={{flexDirection: 'row', alignItems: 'center', marginTop: 10}}
                                    onPress={() => {
                                        // this.selectContact();
                                        rowInvitation.push({name:'', email:'', phoneNumber:'', selected_user_role_index: 0, selected_gender_index: 0});
                                        this.setState({rowInvitation});
                                    }}
                                >
                                    <Image style = {{width: 20, height: 20, resizeMode: 'contain', tintColor: Colors.gold, marginRight: 15,}} source={require("../icons/connection-add.png")}/>
                                    <Text style={[ stylesGlobal.font, {color: Colors.black, fontSize: 12}]}>{"ADD ANOTHER REFERRAL"}</Text>
                                </TouchableOpacity>
                            </View>

                            <View style={{width:'100%', height:1, backgroundColor:Colors.gold, marginVertical:10}} /> */}

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
                                                        rowInvitation
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

                                                return (
                                                    <View style={[{ width: '100%', height: '100%', resizeMode: 'cover', alignItems: 'center', flexDirection: 'row', }]}>
                                                        <Image style={{ width: '100%', height: '100%', position: 'absolute', borderRadius: 2 }} source={{ uri: this.state.user_role[this.state.rowInvitation[0].selected_user_role_index].background }}></Image>
                                                        


                                                        <View style={{flexDirection: 'row'}}>
                                                            
                                                            <View style={{ paddingStart: 10 }}>
                                                                <View style={{ height: '100%', aspectRatio: 1, marginRight: 5 }}>
                                                                    <Image style={{ width: '100%', height: '100%' }} 
                                                                        source={this.state.user_role[this.state.rowInvitation[0].selected_user_role_index].badge}></Image>
                                                                
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
                                                // return (
                                                //     <View style={[{ width: '100%', height: 30, resizeMode: 'cover', alignItems: 'center', flexDirection: 'row', marginHorizontal: 10 }]}>
                                                //         <View style={{ height: '100%', aspectRatio: 1, marginRight: 10 }}>
                                                //             <Image style={{ width: '100%', height: '100%' }} source={{ uri: member_type_item.badge }}></Image>
                                                //         </View>
                                                //         <Text style={[{ fontSize: 12, color: Colors.black }, stylesGlobal.font]}>{member_type_item.name}</Text>
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
                                        {/* <PhoneInput */}
                                        {/*     ref='phone' */}
                                        {/*     value={rowInvitation[0].phoneNumber} */}
                                        {/*     onChangePhoneNumber={text => { */}
                                        {/*         rowInvitation[0].phoneNumber = text; */}
                                        {/*         this.setState({ rowInvitation }) */}
                                        {/*     }} */}
                                        {/*     onSelectCountry={(country) => { */}
                                        {/*         console.log(country) */}
                                        {/*     }} */}
                                        {/*     style={stylesGlobal.invite_view_input_text} */}
                                        {/*     flagStyle={{ */}
                                        {/*         width: 25, */}
                                        {/*         height: 15 */}
                                        {/*     }} */}
                                        {/*     textStyle={[stylesGlobal.font, { fontSize: 12 }]} */}
                                        {/* /> */}

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
                                {/*             value={rowInvitation[0].pinstagram} */}
                                {/*             style={[stylesGlobal.invite_view_input_text, stylesGlobal.font]} */}
                                {/*             onChangeText={text => { */}
                                {/*                 rowInvitation[0].pinstagram = text; */}
                                {/*                 this.setState({ rowInvitation }) */}
                                {/*             }} */}
                                {/*         /> */}
                                {/*     </View> */}
                                {/* </View> */}
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

    // render rows for invitation none members
    // renderInviteRows = () => {

    //     let p = [];
    //     const {rowInvitation} = this.state;
    //     for (let index = rowInvitation.length - 1; index >= 0; index--) {
    //         const element = rowInvitation[index];

    //         p.push(
    //             <View key={index} style={{flexDirection: 'row', width: '100%', marginBottom: 20, justifyContent: 'center'}}>
    //                 <View style={{width: '100%', alignItems:'center', justifyContent: 'center',}}>
    //                     <View style={{width: '100%', alignItems: 'center', justifyContent: 'space-around', flexDirection: 'row'}}>
    //                         <View style = {{width: '50%', }}>
    //                             <Text style = {[{fontSize: 12, color: Colors.black}, stylesGlobal.font]}>Name</Text>
    //                             <View style = {{width: '100%', height: 30, flexDirection: 'row', alignItems: 'center', borderRadius: 3, borderWidth: 0.5, borderColor: Colors.gray,}}>
    //                                 <TextInput
    //                                     placeholder='Friend Name'
    //                                     value={element.name}
    //                                     style={[{
    //                                         flex: 1,
    //                                         paddingLeft: 10,
    //                                         paddingVertical: 5,
    //                                         fontSize: 12
    //                                     }, stylesGlobal.font]}
    //                                     onChangeText={text => {
    //                                         rowInvitation[index].name = text;
    //                                         this.setState({rowInvitation})
    //                                     }}
    //                                 />
    //                                 <TouchableOpacity style = {{height: '100%', aspectRatio: 1, marginLeft: 10}} onPress={() => { this.selectContact(index); }}>
    //                                     <Image style = {{width: '90%', height: '90%'}} source = {require("../icons/select_from_contact.jpg")}></Image>
    //                                 </TouchableOpacity>
    //                             </View>
    //                         </View>
    //                         <View style = {{width: '45%', }}>
    //                             <Text style = {[{fontSize: 12, color: Colors.black}, stylesGlobal.font]}>Email Address</Text>
    //                             <TextInput
    //                                 placeholder='Email'
    //                                 value={element.email}
    //                                 style={[{
    //                                     paddingLeft: 10,
    //                                     borderRadius: 3,
    //                                     borderWidth: 1,
    //                                     borderColor: Colors.gray,
    //                                     width: '100%', 
    //                                     height: 30,
    //                                     paddingVertical: 5,
    //                                     fontSize: 12
    //                                 }, stylesGlobal.font]}
    //                                 onChangeText={text => {
    //                                     rowInvitation[index].email = text;
    //                                     this.setState({rowInvitation})
    //                                 }}
    //                             />
    //                         </View>
    //                     </View>
    //                     <View style={{width: '100%', alignItems: 'center', justifyContent: 'space-around', flexDirection: 'row',  marginTop:10,}}>
    //                         <View style = {{flex: 1 }}>
    //                             <Text style = {[{fontSize: 12, color: Colors.black}, stylesGlobal.font]}>Phone Number</Text>
    //                             <PhoneInput
    //                                 ref='phone'
    //                                 value = {element.phoneNumber}
    //                                 onChangePhoneNumber={text => {
    //                                     rowInvitation[index].phoneNumber = text;
    //                                     this.setState({rowInvitation})
    //                                 }}
    //                                 onSelectCountry={(country)=> {
    //                                     console.log(country)
    //                                 }}
    //                                 style={{
    //                                     paddingLeft: 10,
    //                                     borderRadius: 3,
    //                                     borderWidth: 1,
    //                                     borderColor: Colors.gray,
    //                                     width: '100%', 
    //                                     height: 30,
    //                                     paddingVertical: 5,
    //                                 }}
    //                                 flagStyle={{
    //                                     width: 25,
    //                                     height: 15
    //                                 }}
    //                                 textStyle={[stylesGlobal.font, {fontSize: 12}]}
    //                             />
    //                         </View>
    //                         <View style = {{width: 80, marginLeft: 10 }}>
    //                             <Text style = {[{fontSize: 12, color: Colors.black}, stylesGlobal.font]}>Member Type</Text>
    //                             <ModalDropdown 
    //                                 style = {{width: '100%', height: 30, borderRadius: 3, borderWidth: 1, borderColor:Colors.gray,}}
    //                                 dropdownStyle = {{width: 160, height: 30 * this.state.user_role.length}}
    //                                 defaultIndex = {0}
    //                                 options = {this.state.user_role}
    //                                 onSelect = {(member_type_index) => {
    //                                     rowInvitation[index].selected_user_role_index = member_type_index;
    //                                     this.setState({rowInvitation})
    //                                 }}
    //                                 renderButton = {() => {
    //                                     return (
    //                                         <View style = {[{width: '100%', height: '100%', resizeMode: 'cover', alignItems: 'center', flexDirection: 'row',}]}>
    //                                             <View style = {{height: '100%', aspectRatio: 1, marginRight: 5}}>
    //                                                 <Image style = {{width: '100%', height: '100%'}} source = {{uri: this.state.user_role[this.state.rowInvitation[index].selected_user_role_index].badge}}></Image>
    //                                             </View>
    //                                         </View>
    //                                     )
    //                                 }}
    //                                 renderRow = {(member_type_item, member_type_index, highlighted) => {
    //                                     return (
    //                                         <View style = {[{width: '100%', height: 30, resizeMode: 'cover', alignItems: 'center', flexDirection: 'row', marginHorizontal: 10}]}>
    //                                             <View style = {{height: '100%', aspectRatio: 1, marginRight: 10}}>
    //                                                 <Image style = {{width: '100%', height: '100%'}} source = {{uri: member_type_item.badge}}></Image>
    //                                             </View>
    //                                             <Text style = {[{fontSize: 12, color: Colors.black}, stylesGlobal.font]}>{member_type_item.name}</Text>
    //                                         </View>
    //                                     )
    //                                 }}
    //                             />
    //                         </View>
    //                         <View style = {{width: 50, marginLeft: 10 }}>
    //                             <Text style = {[{fontSize: 12, color: Colors.black}, stylesGlobal.font]}>Gender</Text>
    //                             <ModalDropdown 
    //                                 style = {{width: '100%', height: 30, borderRadius: 3, borderWidth: 1, borderColor:Colors.gray,}}
    //                                 dropdownStyle = {{width: 100, height: 60}}
    //                                 defaultIndex = {0}
    //                                 options = {this.state.user_gender}
    //                                 onSelect = {(gender_index) => {
    //                                     rowInvitation[index].selected_gender_index = gender_index;
    //                                     this.setState({rowInvitation})
    //                                 }}
    //                                 renderButton = {() => {
    //                                     return (
    //                                         <View style = {[{width: '100%', height: '100%', resizeMode: 'cover', alignItems: 'center', flexDirection: 'row',}]}>
    //                                             <View style = {{height: '100%', aspectRatio: 1, marginRight: 5, justifyContent: 'center', alignItems: 'center'}}>
    //                                                 <Image style = {{width: '60%', height: '60%', resizeMode: 'contain'}} source = {this.state.user_gender[this.state.rowInvitation[index].selected_gender_index].image}></Image>
    //                                             </View>
    //                                         </View>
    //                                     )
    //                                 }}
    //                                 renderRow = {(gender_type_item, gender_index, highlighted) => {
    //                                     return (
    //                                         <View style = {[{width: '100%', height: 30, resizeMode: 'cover', alignItems: 'center', flexDirection: 'row', marginHorizontal: 10}]}>
    //                                             <View style = {{height: '100%', aspectRatio: 1, marginRight: 10, justifyContent: 'center', alignItems: 'center'}}>
    //                                                 <Image style = {{width: '60%', height: '60%', resizeMode: 'contain'}} source = {gender_type_item.image}></Image>
    //                                             </View>
    //                                             <Text style = {[{fontSize: 12, color: Colors.black}, stylesGlobal.font]}>{gender_type_item.type}</Text>
    //                                         </View>
    //                                     )
    //                                 }}
    //                             />
    //                         </View>
    //                     </View>
    //                 </View>
    //             </View>
    //         )
    //     }
    //     return p;

    // }
    /**
           * display top header
           */
    renderHeaderView = () => {

        // var event_toDateTime = Moment(this.state.eventDetailData.info.to_date).format('MM/DD/YYYY') + " " + this.state.eventDetailData.info.to_time;
        let imageUrl = this.state.userImagePath + Constants.THUMB_FOLDER + this.state.userImageName;

        return (
            <View style={stylesGlobal.headerView}>
                <TouchableOpacity style={stylesGlobal.header_backbuttonview_style}
                    onPress={() => {
                        this.props.navigation.goBack();
                    }}
                >
                    <Image style={stylesGlobal.header_backbuttonicon_style} source={require("../icons/icon_back.png")} />
                </TouchableOpacity>
                <TouchableOpacity style={stylesGlobal.header_logoview_style} onPress={() => this.props.navigation.navigate('Dashboard', { logoclick: true })}>
                    <Image style={stylesGlobal.header_logo_style} source={require("../icons/logo_new.png")} />
                </TouchableOpacity>
                <View style={stylesGlobal.header_searchview_style}>
                    <TextInput
                        ref='searchTextInput'
                        autoCorrect={false}
                        underlineColorAndroid="transparent"
                        returnKeyType={"search"}
                        style={[stylesGlobal.header_searchtextview_style, stylesGlobal.font]}
                        onChangeText={searchText => this.SearchFilterFunction(searchText)}
                        value={this.state.searchText}
                        defaultValue=""
                        multiline={false}
                        autoCapitalize='sentences'
                        placeholder="Search Guest List..."
                        keyboardType='ascii-capable'
                    />
                    <TouchableOpacity style={stylesGlobal.header_searchiconview_style} onPress={() => {
                        if (this.state.searchText == "") {
                            this.refs.searchTextInput.focus();
                        } else {
                            this.clear_search();
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
                <TouchableOpacity style={stylesGlobal.header_avatarview_style} onPress={() => this.showPopupView()}>
                    <View style={stylesGlobal.header_avatarsubview_style}>
                        <ImageCompressor style={stylesGlobal.header_avatar_style} uri={imageUrl} />
                    </View>
                </TouchableOpacity>
            </View>
        );
    };


    // clear search button click
    clear_search = () => {
        Keyboard.dismiss();

        this.SearchFilterFunction("")
    }

    /**
    * display searched data in list
    */
    SearchFilterFunction(text) {
        this.onEndReachedCalledDuringMomentum = true;
        this.setState({
            searchText: text,
            displayLoadMoreLoader: false,
            more_load: true,
            page_number: 0,
        }, () => {
            this.callGetGuestListAPI()
        })
    }

    refreshListData = () => {

        this.setState({
            page_number: 0
        }, async () => {
            await this.getData();
            this.callGetGuestListCountAPI();
            this.callGetGuestListAPI(true);
        })
    }

    isCloseToTop = ({ layoutMeasurement, contentOffset, contentSize }) => {
        const paddingToBottom = 10;
        return contentOffset.y <= -40
    };

    isCloseToBottom = ({ layoutMeasurement, contentOffset, contentSize }) => {
        const paddingToBottom = 10;
        return layoutMeasurement.height + contentOffset.y >=
            contentSize.height - paddingToBottom;
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
        );
    }

    renderMainView = () => {
        return (
            <View style={{ flex: 1, width: "100%", alignItems: 'center' }}>
                {/* {this.state.pulldown_loading && <PullDownIndicator/>} */}
                {this.state.dataGuestList.length > 0 && this.renderGuestList}
            </View>
        );
    };
    /**
           * display guest list
           */
    get renderGuestList() {
        let footerView = (
            <View style={{ backgroundColor: Colors.black, height: 50, justifyContent: 'center', alignItems: 'center' }}>
                <Image style={{ width: 50, height: 50 }} resizeMode={'contain'} source={require("../icons/loader.gif")} />
            </View>
        );

        return (
            <View style={{ flex: 1, width: '100%', marginTop: 10 }}>
                <FlatList
                    ListHeaderComponent={this.state.pulldown_loading && <PullDownIndicator />}
                    ListFooterComponent={this.state.displayLoadMoreLoader == true ? footerView : null}
                    extraData={this.state}
                    pagingEnabled={false}
                    showsHorizontalScrollIndicator={false}
                    showsVerticalScrollIndicator={false}
                    data={this.state.dataGuestList}
                    keyExtractor={(item, index) => index.toString()}
                    style={{ width: '100%' }}
                    numColumns={this.state.is_portrait ? 1 : 2}
                    key={this.state.is_portrait ? 1 : 2}
                    renderItem={({ item, index }) => (
                        <View key={index} style={{ width: this.state.is_portrait ? '100%' : '50%', alignItems: 'center' }}>
                            <RowGuest
                                chatAuthToken={this.state.chatAuthToken}
                                data={item}
                                screenProps={this.props.navigation}
                                index={index}
                                myUserId={this.state.userId}
                                refreshProfileImage={this.refreshProfileImage}
                                ishosted={this.state.ishosted}
                                buttonAction={this.buttonAction}
                                eventDetailData={this.state.eventDetailData}
                            />
                        </View>
                    )}
                    onMomentumScrollBegin={() => { this.onEndReachedCalledDuringMomentum = false; }}
                    onEndReachedThreshold={0.5}
                    onEndReached={({ distanceFromEnd }) => {
                        if (!this.onEndReachedCalledDuringMomentum && this.state.more_load && !this.state.displayLoadMoreLoader) {
                            this.onEndReachedCalledDuringMomentum = true;
                            this.setState({
                                displayLoadMoreLoader: true,
                            }, () => {
                                this.callGetGuestListCountAPI();
                                this.callGetGuestListAPI();
                            })
                        }
                    }}
                    // onRefresh={() => {
                    //     if(!this.state.pulldown_loading) {
                    //         this.setState({
                    //             pulldown_loading: true,
                    //             page_number: 0,
                    //         }, () => {
                    //             this.callGetGuestListCountAPI();
                    //             this.callGetGuestListAPI();
                    //         })
                    //     }
                    // }}
                    // refreshing={this.state.pulldown_loading}
                    onScroll={({ nativeEvent }) => {
                        if (this.isCloseToTop(nativeEvent)) {
                            if (!this.state.pulldown_loading) {
                                this.setState({
                                    pulldown_loading: true,
                                    page_number: 0,
                                }, () => {
                                    this.callGetGuestListCountAPI();
                                    this.callGetGuestListAPI();
                                })
                            }
                        }
                    }}
                />
            </View>
        );
    };

    // buttonAction = (button_text, event_id, user_id, guest_name, is_real, isbringafriend, email) => {
    buttonAction = (button_text, data) => {
        this.setState({
            button_action: button_text,
            selected_action_user: data,
            action_loading: true
        })

        let uri = "";
        let params = {};

        if (button_text == "Accept") {
            uri = Memory().env == "LIVE" ? Global.URL_HOST_INVITE_ACCEPT : Global.URL_HOST_INVITE_ACCEPT_DEV;
            params = {
                "token": this.state.userToken,
                "user_id": this.state.userId,
                "format": "json",
                "eventId": data.event_id,
                "userid": data.user_id,
                "status": 1
            };
        } else if (button_text == "Reject") {
            if (data.is_real == 1) {
                if (data.isbringafriend == 0) {  //// non member signup from event host 
                    uri = Memory().env == "LIVE" ? Global.URL_HOST_INVITE_ACCEPT : Global.URL_HOST_INVITE_ACCEPT_DEV;
                    params = {
                        "token": this.state.userToken,
                        "user_id": this.state.userId,
                        "format": "json",
                        "eventId": data.event_id,
                        "userid": data.user_id,
                        "status": 2
                    };
                } else {  //// non member signup from invitee 
                    uri = Memory().env == "LIVE" ? Global.URL_DELETE_NONMEMBER : Global.URL_DELETE_NONMEMBER_DEV;
                    params = {
                        "token": this.state.userToken,
                        "user_id": this.state.userId,
                        "format": "json",
                        "eventId": data.event_id,
                        "email": data.email,
                        "status": 0
                    };
                }
            }
        } else if (button_text == "Re-Send Invite") {
            if (data.is_real == 1) { /// member
                uri = Memory().env == "LIVE" ? Global.URL_HOST_INVITE_RESEND : Global.URL_HOST_INVITE_RESEND_DEV
                params = {
                    "token": this.state.userToken,
                    "user_id": this.state.userId,
                    "format": "json",
                    "invite": data.user_id,
                    "eventId": data.event_id,
                    "type": "resend"
                };
            } else { // non member
                uri = Memory().env == "LIVE" ? Global.URL_RESENDINVITE_NOSIGNUP : Global.URL_RESENDINVITE_NOSIGNUP_DEV
                params = {
                    "token": this.state.userToken,
                    "user_id": this.state.userId,
                    "format": "json",
                    "email": data.email,
                    "eventId": data.event_id,
                    "sender_user_id": data.sender_user_id,
                    "type": "resend"
                };
            }
        } else if (button_text == "Delete") {
            if (data.is_real == 1) { /// member
                uri = Memory().env == "LIVE" ? Global.URL_HOST_INVITE_RESEND : Global.URL_HOST_INVITE_RESEND_DEV;
                params = {
                    "token": this.state.userToken,
                    "user_id": this.state.userId,
                    "format": "json",
                    "invite": data.user_id,
                    "eventId": data.event_id,
                    "type": "delete"
                };
            } else { // non member
                uri = Memory().env == "LIVE" ? Global.URL_DELETE_NONMEMBER : Global.URL_DELETE_NONMEMBER_DEV;
                params = {
                    "token": this.state.userToken,
                    "user_id": this.state.userId,
                    "format": "json",
                    "eventId": data.event_id,
                    "refer_id": data.refer_id,
                    "status": 0
                };
            }
        } else if (button_text == "Un-Invite") {
            uri = Memory().env == "LIVE" ? Global.URL_HOST_INVITE_RESEND : Global.URL_HOST_INVITE_RESEND_DEV;
            params = {
                "token": this.state.userToken,
                "user_id": this.state.userId,
                "format": "json",
                "invite": data.user_id,
                "eventId": data.event_id,
                "type": "cancel"
            };
        }


        console.log(TAG + " callGuestActionAPI uri " + uri);
        console.log(TAG + " callGuestActionAPI params " + JSON.stringify(params));

        WebService.callServicePost(uri, params, this.handleButtonAction);
    }


    handleButtonAction = (response, isError) => {

        if (!isError) {
            var result = response;
            if (typeof result != undefined && result != null) {
                console.log(TAG + " callGuestActionAPI result " + JSON.stringify(result));
                if (result.status == 'success') {
                    if (this.state.button_action == "Un-Invite" || this.state.button_action == "Reject" || this.state.button_action == "Delete") {
                        Alert.alert(this.state.selected_action_user.first_name + " " + this.state.selected_action_user.last_name + " has been removed from the Guest List.", "");
                    } else if (this.state.button_action == "Re-Send Invite") {
                        Alert.alert("Invite has been sent to " + this.state.selected_action_user.first_name + " " + this.state.selected_action_user.last_name, "");
                    }

                    var dataGuestList = this.state.dataGuestList
                    for (i = 0; i < dataGuestList.length; i++) {
                        if (dataGuestList[i].user_id == this.state.selected_action_user.user_id) {
                            if (this.state.button_action == "Un-Invite" || this.state.button_action == "Reject" || this.state.button_action == "Delete") {
                                dataGuestList.splice(i, 1);
                                this.setState({
                                    total_count: this.state.total_count - 1,
                                })
                                if (this.state.selected_action_user.rsvp_status === "1" && this.state.selected_action_user.is_wait != "1") {
                                    this.setState({
                                        confirm_count: this.state.confirm_count - 1
                                    })
                                }
                            } else {
                                if (result.updated_guest != null) {
                                    dataGuestList.splice(i, 1, result.updated_guest);
                                }
                                if (this.state.button_action == "Accept") {
                                    this.setState({
                                        confirm_count: this.state.confirm_count + 1
                                    })
                                }
                            }
                            break;
                        }
                    }
                    this.setState({
                        dataGuestList: dataGuestList
                    })

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
            action_loading: false
        });
    }
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: Colors.black,
        flex: 1,
        width: '100%',
        height: '100%'
    },
    emptyView: {
        justifyContent: "center",
        flex: 1,
        alignItems: "center",
    },
    TextInputStyle: {
        height: 40,
        color: Colors.black,
        fontSize: 13,
        paddingTop: 10,
        paddingBottom: 5,
        paddingLeft: 5,
        backgroundColor: Colors.transparent,
        flex: 1,
        borderColor: "#000000",
        borderWidth: 0.5,
        borderRadius: 5
    },
});

