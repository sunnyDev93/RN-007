import React, { Component } from "react";
import {
    Platform,
    StyleSheet,
    View,
    FlatList,
    Image,
    TouchableOpacity,
    TextInput,
    Text,
    ActivityIndicator,
    Keyboard,
    Dimensions,
    Alert,
    SafeAreaView,
    ScrollView
} from "react-native";

import { EventRegister } from 'react-native-event-listeners';
import RowConnection from "./RowConnection";
import WebService from "../core/WebService";
import Accordion from 'react-native-collapsible/Accordion';
import Checkbox from '../customview/CheckBoxCus';
import CustomSlider from '../customview/CustomeSlider'
import Icon from "react-native-vector-icons/Feather";
import PullDownIndicator from "./PullDownIndicator";
import { Constants } from "../consts/Constants";
import { Colors } from "../consts/Colors";
import * as Global from "../consts/Global";
import ProgressIndicator from "./ProgressIndicator";
import { stylesGlobal } from '../consts/StyleSheet';
import Memory from '../core/Memory';
import { ImageCompressor } from './ImageCompressorClass';
import HeaderView from "../customview/HeaderView";
import CustomPopupView from "../customview/CustomPopupView";
import NotificationPopupView from "../customview/NotificationPopupView";
import MultiSlider from "@ptomasroos/react-native-multi-slider";
import BannerView from "../customview/BannerView";
import AsyncStorage from '@react-native-community/async-storage';
import InviteUserToEventView from "../customview/InviteUserToEventView";
import * as Animatable from 'react-native-animatable';
import { getEventsForInvite, callInviteUserToEvent, callFavoriteMember, callFollowRequest } from "../utils/Util";


const isIos = Platform.OS === 'ios'
const isIphoneX = isIos && (Dimensions.get('window').height === 812 || Dimensions.get('window').height === 896);
const bottomPadding = isIphoneX ? 34 : 0;
var pageNumber = 1;

var TAG = "GlobalSearchScreen";
export default class GlobalSearchScreen extends React.Component {
    constructor(props) {
        super(props);
        type = this.props.type;

        this.state = {
            userId: "",
            userToken: "",
            is_verified: "0",
            loading: false,
            searchText: "",
            dataSearchUsersList: [],
            isLoadMoreSearchUser: true,
            displayLoadMoreView: false,
            isReloginAlert: false,
            activeSections: [0],
            activeSections_2: [],
            ageValues: [0, 60],
            distanValues: [0, 100],
            heightValues: [30, 229],
            weightValues: [5, 145],
            networthValues: [0, 4],
            accountType: [],
            nonAccountType: [],
            hairColor: [],
            eyeColor: [],
            skinColor: [],
            bodyType: [],
            ethnicityType: [],
            maritalType: [],
            genderType: [],
            isFiltering: false,
            showNetworth: false,
            showModel: false,
            showNotificationModel: false,


            pulldown_loading: false,

            selected_member: null, /// used for favorite and following

            invite_event_view: false, // invite user to event view
            invite_event_list: [],
            invited_user: null,
            filter_apply_button_click: false,
            is_portrait: true,
            landscape_filter_isActive: true,
            search_count: 0, // used when type search text
        };

        this.onEndReachedCalledDuringMomentum = true;
        this.resetFilter = this.resetFilter.bind(this);
    }

    UNSAFE_componentWillMount() {
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
        EventRegister.removeEventListener(this.listener);
        this.refs.header_view.configSearchText("");
    }
    /**
     * clear state data
    */
    clearStateData = () => {
        pageNumber = 1;
        this.setState({
            userId: "",
            userToken: "",
            userGender: "",
            loading: false,
            searchText: "",
            showModel: false,
            dataSearchUsersList: [],
            isLoadMoreSearchUser: true,
            displayLoadMoreView: false,
            isReloginAlert: false,
            activeSections: [0],
            activeSections_2: [],
            ageValues: [0, 60],
            distanValues: [0, 100],
            heightValues: [30, 229],
            weightValues: [5, 145],
            networthValues: [0, 4],
            accountType: [],
            nonAccountType: [],
            hairColor: [],
            eyeColor: [],
            skinColor: [],
            bodyType: [],
            ethnicityType: [],
            maritalType: [],
            genderType: [],
            showNetworth: false,
            filter_apply_button_click: false,

            search_count: 0

        });
    };

    getData = async () => {
        try {
            var userId = await AsyncStorage.getItem(Constants.KEY_USER_ID);
            var userToken = await AsyncStorage.getItem(Constants.KEY_USER_TOKEN);
            var userGender = await AsyncStorage.getItem(Constants.KEY_USER_GENDER);
            var userImageName = await AsyncStorage.getItem(Constants.KEY_USER_IMAGE_NAME);
            var userImagePath = await AsyncStorage.getItem(Constants.KEY_USER_IMAGE_URL);
            var is_verified = await AsyncStorage.getItem(Constants.KEY_IS_VERIFIED);
            var ageValues = [0, 60];
            var distanValues = [0, 100];
            var heightValues = [30, 229];
            var weightValues = [5, 145];
            var networthValues = [0, 4];
            var accountType = userGender == "female" ? ["1", "2", "4", "5"] : []
            var showNetworth;
            if (accountType.includes('1') || accountType.includes('2')) {
                showNetworth = true;
            } else {
                showNetworth = false;
            }
            var nonAccountType = [];
            var hairColor = [];
            var eyeColor = [];
            var skinColor = [];
            var bodyType = [];
            var ethnicityType = [];
            var maritalType = [];
            var genderType = [];

            this.setState({
                userId: userId,
                userToken: userToken,
                is_verified: is_verified,
                userImageName,
                userImagePath,

                ageValues,
                distanValues,
                heightValues,
                weightValues,
                networthValues,
                accountType,
                nonAccountType,
                hairColor,
                eyeColor,
                skinColor,
                bodyType,
                ethnicityType,
                maritalType,
                genderType,
                userGender,
                showNetworth,

                search_count: 0
            });

        } catch (error) {
            // Error retrieving data
            console.log(error)
        }
    };

    setSearchText = (search_text, screen_load) => {
        pageNumber = 1;
        this.setState({
            searchText: search_text,
            filter_apply_button_click: false
        }, async () => {
            if (this.state.userId == "") {
                await this.getData();
            }
            if (search_text == "") {
                this.callSearchUserListAPI(true);
            } else {
                this.callSearchUserListAPI(false);
            }

            setTimeout(() => {
                if (this.refs.header_view) {
                    this.refs.header_view.configSearchText(this.state.searchText);
                }
            }, 500);
        })
    }

    /*
    * call get guest list API and display content
    */
    callSearchUserListAPI = async (isFirstTime, search_type) => {
        try {
            if (!this.state.pulldown_loading && !this.state.displayLoadMoreView) {
                this.setState({
                    loading: true,
                });
            }
            let uri = Memory().env == "LIVE" ? Global.URL_SEARCH + pageNumber : Global.URL_SEARCH_DEV + pageNumber
            const eyeColor = this.state.eyeColor.join(",")
            const skinColor = this.state.skinColor.join(",");
            const hairColor = this.state.hairColor.join(",");
            const ethnicity = this.state.ethnicityType.join(",");
            const maritalStatus = this.state.maritalType.join(",");
            const body = this.state.bodyType.join(",");
            let miles = "";
            if (this.state.distanValues[0] == 0 && this.state.distanValues[1] == 100) {
                miles = "";
            } else {
                miles = this.state.distanValues[0] + "-" + this.state.distanValues[1];
            }
            let age = "";
            if (this.state.ageValues[0] == 0 && this.state.ageValues[1] == 60) {
                age = "";
            } else {
                age = this.state.ageValues[0] + "-" + this.state.ageValues[1];
            }
            let height = "";
            if (this.state.heightValues[0] == 30 && this.state.heightValues[1] == 229) {
                height = "";
            } else {
                height = this.state.heightValues[0] + "-" + this.state.heightValues[1];
            }
            let weight = "";
            if (this.state.weightValues[0] == 5 && this.state.weightValues[1] == 145) {
                weight = "";
            } else {
                weight = this.state.weightValues[0] + "-" + this.state.weightValues[1];
            }
            var search_text = "";
            if (search_type == "shows_all_member") {
                search_text = "";
            } else {
                search_text = this.state.searchText;
            }
            var jsonData = null;
            // if(this.state.filter_apply_button_click) {
            //     jsonData = {
            //         eyeColor,
            //         skinColor,
            //         hairColor,
            //         ethnicity,
            //         maritalStatus,
            //         body,
            //         recordPerPage: '',
            //         userType: this.state.accountType,
            //         age,
            //         miles,
            //         networth:'',
            //         connection:'',
            //         gender:this.state.genderType,
            //         height,
            //         weight,
            //         page: pageNumber,
            //         keyword: search_text
            //     }
            // } else {
            //     jsonData = {
            //         eyeColor: "",
            //         skinColor: "",
            //         hairColor: "",
            //         ethnicity: "",
            //         maritalStatus: "",
            //         body: "",
            //         recordPerPage: '',
            //         userType: isFirstTime ? this.state.accountType : [],
            //         // userType: this.state.accountType,
            //         age: "",
            //         miles: "",
            //         networth: '',
            //         connection: '',
            //         gender: [],
            //         height: "",
            //         weight: "",
            //         page: pageNumber,
            //         keyword: search_text
            //     }
            // }
            jsonData = {
                eyeColor,
                skinColor,
                hairColor,
                ethnicity,
                maritalStatus,
                body,
                recordPerPage: '',
                userType: this.state.accountType,
                age,
                miles,
                networth: '',
                connection: '',
                gender: this.state.genderType,
                height,
                weight,
                page: pageNumber,
                keyword: search_text,
                filter_applied: this.state.filter_apply_button_click ? 1 : 0
            }
            // console.log("dddddddd:", jsonData)
            // let params = new FormData();
            // params.append("token", this.state.userToken);
            // params.append("user_id", this.state.userId);
            // params.append("format", "json");
            // params.append("data", JSON.stringify(jsonData));

            let params = {
                token: this.state.userToken,
                user_id: this.state.userId,
                format: 'json',
                data: jsonData
            }

            this.setState({
                search_count: this.state.search_count + 1
            })
            console.log(TAG + " callSearchUserListAPI uri " + uri);
            console.log(TAG + " callSearchUserListAPI params " + JSON.stringify(params));

            WebService.callServicePost(
                uri,
                params,
                this.handleSearchUserListResponse
            );
        } catch (error) {
            this.setState({
                pulldown_loading: false,
                loading: false,
                displayLoadMoreView: false,
            });

            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    };

    /**
     * handle search user API response
    */
    handleSearchUserListResponse = (response, isError) => {
        // console.log(TAG + " callSearchUserListAPI Response " + JSON.stringify(response));
        console.log(TAG + " callSearchUserListAPI444 isError " + isError);

        if (!isError) {
            var result = response;
            if (typeof result != undefined && result != null) {
                if (typeof result.data != undefined && result.data != null) {
                    // console.log(TAG + " callSearchUserListAPI222222  ", result.data);

                    var filters = [];
                    if (result.data.userType) {
                        if(result.data.userType.constructor != Array){
                            var tmpWords = result.data.userType.split(',');
                            var arrNums = tmpWords.map(item => item.replace(/\D/g,''));
                            filters = arrNums;
                        } else {

                            console.log('callSearchUserListAPI33334444  ', result.data.userType);
                              
                              filters = result.data.userType;
                        }
                        
                    }
                    var mData = result.data.result;

                    console.log('callSearchUserListAPI55555', mData)
                    if (mData != undefined && mData != null) {

                        if(this.state.accountType.length > 0)
                        {
                            console.log('sdfsf adf asd asas a  a')
                            mData = mData.filter(item => {
                                return filters.filter(item2 => item.member_plan.toFixed() === item2).length > 0
                            });
                        }
                        
                        if (!this.state.displayLoadMoreView) {
                            this.setState({
                                dataSearchUsersList: mData,
                            });
                        } else {
                            this.setState({
                                dataSearchUsersList: [...this.state.dataSearchUsersList, ...mData]
                            })
                        }

                        if (mData.length > 0) {
                            mData.map((i, j) => {
                                i.is_connection_request = false;
                            });

                            this.setState({
                                isLoadMoreSearchUser: true,
                            }, () => {
                                pageNumber = pageNumber + 1
                            });

                        } else {
                            this.setState({
                                isLoadMoreSearchUser: false
                            })
                        }
                    }

                    this.setState({
                        accountType: filters
                    })  ;
                }
            }
        } else {
            if (response != undefined && response != null && response.length > 0) {
                Alert.alert(response.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
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
            displayLoadMoreView: false,
        });

    };

    async resetFilter() {
        // this.clearStateData();
        this.getData(true);
        this.callSearchUserListAPI(true);
    }

    render() {
        let emptyView = (
            <View style={styles.emptyView}>
                <View style={stylesGlobal.empty_cardView}>
                    <Text style={[{ width: '80%' }, stylesGlobal.empty_cardView_text, stylesGlobal.font]}>
                        {"Your current search term does not match any records."}
                    </Text>
                    <TouchableOpacity 
                        style={[{ paddingHorizontal: 15, paddingVertical: 10, marginTop: 15, borderRadius: 5, backgroundColor: Colors.gold }, stylesGlobal.shadow_style]} 
                        onPress={() => this.show_all_member()}>
                        <Text style={[{ color: Colors.white, fontSize: 15, }, stylesGlobal.font]}>{"Show all Members"}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );

        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: Colors.black, width: "100%", height: "100%" }}>
                <HeaderView
                    ref="header_view"
                    logoClick={() => this.props.jumpToDashboardTab()}
                    screenProps={this.props.rootNavigation}
                    setSearchText={(text) => this.setState({ searchText: text })}
                    onChangeText={searchText => this.setState({ searchText: searchText, isFiltering: false, filter_apply_button_click: false, }, () => {
                        pageNumber = 1;
                        this.callSearchUserListAPI(false);
                    })}
                    // handleEditComplete = {() => this.handleEditComplete()}
                    showNotificationPopupView={() => { this.refs.refNotificationPopupView.getData(); this.setState({ showNotificationModel: true }) }}
                    showPopupView={() => this.setState({ showModel: true })}
                />
                <BannerView screenProps={this.props.rootNavigation} jumpToEventTab={this.props.jumpToEventTab} jumpToTravelTab={this.props.jumpToTravelTab} />
                <CustomPopupView
                    showModel={this.state.showModel}
                    openMyAccountScreen={this.props.jumpToDashboardTab}
                    logoutUser={this.logoutUser}
                    closeDialog={() => { this.setState({ showModel: false }) }}
                    prop_navigation={this.props.rootNavigation}
                >
                </CustomPopupView>
                <NotificationPopupView
                    ref="refNotificationPopupView"
                    showModel={this.state.showNotificationModel}
                    openNotificationScreen={this.props.jumpToDashboardTab}
                    closeDialog={() => { this.setState({ showNotificationModel: false }) }}
                    prop_navigation={this.props.rootNavigation}
                >
                </NotificationPopupView>
                {
                    this.state.invite_event_view &&
                    <InviteUserToEventView
                        screenProps={this.props.rootNavigation}
                        invited_user={this.state.selected_member}
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
                            const response = await callInviteUserToEvent(this.state.selected_member, this.state.invite_event_list, this.state.userId, this.state.userToken);
                            if (response.status == "success") {
                                Alert.alert(Constants.INVITED_USER_SUCCESS + this.state.selected_member.first_name + " " + this.state.selected_member.last_name, "");
                            }
                            this.setState({
                                loading: false,
                                invite_event_view: false,
                                selected_member: null
                            })
                        }}
                    />
                }
                {
                    this.state.is_portrait &&
                    <View style={{ flex: 1, width: '100%', alignItems: 'center' }}>
                        {/* <TouchableOpacity */}
                        {/*     style={{ */}
                        {/*         width: '90%', */}
                        {/*         backgroundColor: Colors.gold, */}
                        {/*         alignSelf: 'center', */}
                        {/*         // marginTop: 10, */}
                        {/*         height: 50, */}
                        {/*         backgroundColor: Colors.gold, */}
                        {/*         alignItems: 'center', */}
                        {/*         justifyContent: 'center', */}
                        {/*         borderTopLeftRadius: 15, */}
                        {/*         borderTopRightRadius: 15, */}
                        {/*         borderBottomLeftRadius: this.state.isFiltering ? 0 : 15, */}
                        {/*         borderBottomRightRadius: this.state.isFiltering ? 0 : 15, */}
                        {/*         marginBottom: this.state.isFiltering ? 0 : 8, */}
                        {/*     }} */}
                        {/*     onPress={() => this.setState({ isFiltering: !this.state.isFiltering })} */}
                        {/* > */}
                        {/*     <Text style={[stylesGlobal.font_bold, { color: Colors.black, fontSize: 17 }]}>{"Search Filter"}</Text> */}
                        {/*     <Icon name={this.state.isFiltering ? 'chevron-up' : 'chevron-down'} color='#000' size={20} style={{ position: 'absolute', right: 20, }} /> */}
                        {/* </TouchableOpacity> */}
                        {!this.state.isFiltering ? 
                            this.renderFilterView()
                        : null}
                        {!this.state.loading && this.state.dataSearchUsersList.length == 0 ? emptyView : this.renderMainView()}
                    </View>
                }
                {
                    !this.state.is_portrait &&
                    <View style={{ flex: 1, width: '100%', flexDirection: 'row' }}>
                        <View style={{ width: '40%', borderRadius: 15, overflow: 'hidden', marginBottom: 5, backgroundColor: Colors.white }}>
                            {/* <TouchableOpacity style={{ */}
                            {/*     height: 50, */}
                            {/*     backgroundColor: Colors.gold, */}
                            {/*     alignItems: 'center', */}
                            {/*     justifyContent: 'center', */}
                            {/*     borderTopLeftRadius: 15, */}
                            {/*     borderTopRightRadius: 15, */}
                            {/*     flexDirection: 'row', */}
                            {/*     borderBottomColor: '#fff', */}
                            {/*     borderBottomWidth: 1, */}
                            {/* }} */}
                            {/*     onPress={() => this.setState({ landscape_filter_isActive: !this.state.landscape_filter_isActive })} */}
                            {/* > */}
                            {/*     <Text style={[stylesGlobal.font_bold, { fontSize: 17, }]}>{"Search Filter"}</Text> */}
                            {/*     <Icon name={this.state.landscape_filter_isActive ? 'chevron-up' : 'chevron-down'} color='#000' size={20} style={{ position: 'absolute', right: 20, }} /> */}
                            {/* </TouchableOpacity> */}
                            <ScrollView style={{ width: '100%', paddingBottom: 5 }}>
                                {
                                    this.state.landscape_filter_isActive &&
                                    <View style={{ flex: 1, backgroundColor: Colors.white, }}>
                                        {this._renderHeader("Search Filter", 0, true)}
                                        {this._renderContent("Account Type", 0)}
                                        {this._renderHeader("Demographic", 1, true)}
                                        {this._renderContent("Demographic", 1)}
                                        {this._renderHeader("Physical Appearance", 2, true)}
                                        {this._renderContent("Physical Appearance", 2)}
                                        {this._renderHeader("Marital Status", 3, true)}
                                        {this._renderContent("Marital Status", 3)}
                                        <View style={{ justifyContent: 'space-around', marginVertical: 20, flexDirection: 'row' }}>
                                            <TouchableOpacity
                                                style={[{
                                                    width: 120,
                                                    backgroundColor: Colors.gold,
                                                    borderRadius: 5,
                                                    paddingVertical: 10,
                                                    alignItems: 'center'
                                                }, stylesGlobal.shadow_style]}
                                                onPress={this.resetFilter()}
                                            >
                                                <Text style={[stylesGlobal.font, { color: Colors.white }]}>{"Reset Filters"}</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={[{
                                                    width: 120,
                                                    backgroundColor: Colors.gold,
                                                    borderRadius: 5,
                                                    paddingVertical: 10,
                                                    alignItems: 'center'
                                                }, stylesGlobal.shadow_style]}
                                                onPress={() => {
                                                    pageNumber = 1;
                                                    this.setState({
                                                        isFiltering: false,
                                                        filter_apply_button_click: true,
                                                        //dataSearchUsersList: []
                                                        activeSections: [0],
                                                        activeSections_2: []
                                                    }, () => this.callSearchUserListAPI(false))
                                                }}
                                            >
                                                <Text style={[stylesGlobal.font, { color: Colors.white }]}>{"Apply"}</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                }
                            </ScrollView>
                        </View>
                        <View style={{ width: '60%', }}>
                            {!this.state.loading && this.state.dataSearchUsersList.length == 0 ? emptyView : this.renderMainView()}
                        </View>
                    </View>
                }
                {this.state.loading == true ? <ProgressIndicator /> : null}
            </SafeAreaView>
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
        this.setState({
            showModel: false
        })
        try {
            await AsyncStorage.setItem(Constants.KEY_USER_ID, "");
            await AsyncStorage.setItem(Constants.KEY_USER_TOKEN, "");

            this.props.rootNavigation.navigate("SignInScreen", { isGettingData: false });
        } catch (error) {
            console.log(TAG + " logoutUser error " + error);
        }
    }


    getDataAgain = (refresh) => {
        if (refresh) {
            this.callSearchUserListAPI(true);
        }
    }

    _renderHeader_2 = (section, index, isActive, sections) => {
        
        return (
            <View style={{
                height: 50,
                backgroundColor: Colors.gold,
                alignItems: 'center',
                justifyContent: 'center',
                borderTopLeftRadius: 15,
                borderTopRightRadius: 15,
                flexDirection: 'row',
                borderBottomColor: '#fff',
                borderBottomWidth: 1,
            }}
            >
                <Text style={[stylesGlobal.font_bold, { fontSize: 17, }]}>{section}</Text>
            </View>
        )
    }

    _renderContent_2 = (section, index, isActive, sections) => {
        const sections__ = ['Search Filter', 'Demographic', 'Physical Appearance', 'Marital Status']
        return (
            <>
                <Accordion
                    expandMultiple={true}
                    activeSections={this.state.activeSections}
                    sections={sections__}
                    renderHeader={this._renderHeader}
                    renderContent={this._renderContent}
                    onChange={this._updateSection}
                    underlayColor='white'
                    duration={500}
                />
                <View style={{ justifyContent: 'center', marginTop: 20, flexDirection: 'row' }}>
                    <TouchableOpacity
                        style={[{
                            backgroundColor: Colors.gold,
                            borderRadius: 5,
                            paddingVertical: 10,
                            paddingHorizontal: 25
                        }, stylesGlobal.shadow_style]}
                        onPress={() => {
                            this.setState({
                                isFiltering: false,
                            })
                            this.resetFilter()
                        }}
                    >
                        <Text style={[stylesGlobal.font, { color: Colors.white }]}>{"Reset Filters"}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[{
                            backgroundColor: Colors.gold,
                            borderRadius: 5,
                            paddingVertical: 10,
                            paddingHorizontal: 25,
                            marginLeft: 20
                        }, stylesGlobal.shadow_style]}
                        onPress={() => {
                            pageNumber = 1;
                            this.setState({
                                isFiltering: false,
                                filter_apply_button_click: true,
                                activeSections: [0],
                                activeSections_2: []
                            }, () => this.callSearchUserListAPI(false))
                        }}
                    >
                        <Text style={[stylesGlobal.font, { color: Colors.white }]}>{"Apply"}</Text>
                    </TouchableOpacity>
                </View>
                <View style={{ height: 30 }}></View>
            </>
            )
    }

    renderFilterView = () => {
        
        const sections_2 = ['Search Filter']
        return (
            <View style={{ width: '90%', maxHeight: '80%', borderTopLeftRadius: 15, borderTopRightRadius: 15, borderBottomLeftRadius: 15, borderBottomRightRadius: 15, zIndex: 10, overflow: 'hidden', backgroundColor: Colors.white }}>
                <ScrollView
                    contentContainerStyle={{
                        // borderBottomLeftRadius:15,
                        // borderBottomRightRadius:15,
                        // margin:15,
                        // marginTop:0,
                        // backgroundColor:'#fff',
                        // zIndex: 10
                    }}
                >
                    <Accordion
                        expandMultiple={false}
                        activeSections={this.state.activeSections_2}
                        sections={sections_2}
                        renderHeader={this._renderHeader_2}
                        renderContent={this._renderContent_2}
                        onChange={this._updateSection_2}
                        underlayColor='white'
                        duration={1000}
                    />
                    
                    
                </ScrollView>
            </View>
        )
    }


    async show_all_member() {
        pageNumber = 1;
        this.setState({
            loading: true,
            showModel: false,
            // searchText: '',
            dataSearchUsersList: [],
            isLoadMoreSearchUser: true,
            displayLoadMoreView: false,
            isReloginAlert: false,
            activeSections: [0],
            activeSections_2: [],
            ageValues: [0, 60],
            distanValues: [0, 100],
            heightValues: [30, 229],
            weightValues: [5, 145],
            networthValues: [0, 4],
            accountType: [],
            nonAccountType: [],
            hairColor: [],
            eyeColor: [],
            skinColor: [],
            bodyType: [],
            ethnicityType: [],
            maritalType: [],
            genderType: [],
            showNetworth: false,
            filter_apply_button_click: false,
        }, () => this.callSearchUserListAPI(false, "shows_all_member"));
    }

    _renderHeader = (section, index, isActive, sections) => {
        if (index == 0) {
            return <View style={{ height: 0, backgroundColor: Colors.gold }} />
        }
        return (
            <View style={{
                height: 50,
                backgroundColor: Colors.gold,
                alignItems: 'center',
                justifyContent: 'center',
                borderTopLeftRadius: 15,
                borderTopRightRadius: 15,
                flexDirection: 'row',
                borderBottomColor: '#fff',
                borderBottomWidth: 1,
            }}
            >
                <Text style={[stylesGlobal.font_bold, { fontSize: 17, }]}>{section}</Text>
                {
                    this.state.is_portrait &&
                    <Icon name={isActive ? 'chevron-up' : 'chevron-down'} color='#000' size={20} style={{ position: 'absolute', right: 20, }} />
                }
            </View>
        )
    }

    _renderContent = (section, index, isActive, sections) => {
        console.log('_renderContent = ', section, index);
        const { accountType, genderType, hairColor, eyeColor, skinColor, bodyType, ethnicityType, maritalType, nonAccountType } = this.state;
        switch (index) {
            case 0:
                return (

                    <View>
                        <View style={{ flexDirection: 'row', paddingVertical: 15 }}>
                            <View style={{ flex: 1 }}>
                                <Checkbox text='Rich' checked={accountType.includes('1')} onPress={() => this._checkboxPressed('1', 'accountType', accountType)} />
                                <Checkbox text='Model' checked={accountType.includes('3')} onPress={() => this._checkboxPressed('3', 'accountType', accountType)} />
                                <Checkbox text='Famous' checked={accountType.includes('6')} onPress={() => this._checkboxPressed('6', 'accountType', accountType)} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Checkbox text='Gentleman' checked={accountType.includes('2')} onPress={() => this._checkboxPressed('2', 'accountType', accountType)} />
                                <Checkbox text='Connector' checked={accountType.includes('5')} onPress={() => this._checkboxPressed('5', 'accountType', accountType)} />
                            </View>
                        </View>
                        <View style={{ backgroundColor: '#000', height: 1 }}></View>
                        <View style={{ flexDirection: 'row', paddingVertical: 15 }}>
                            <View style={{ flex: 1 }}>
                                <Checkbox text='Fan' checked={accountType.includes('7')} disabled={false} onPress={() => this._checkboxPressed('7', 'accountType', accountType)} />
                                <Checkbox text='Alumni' checked={accountType.includes('8')} disabled={false} onPress={() => this._checkboxPressed('8', 'accountType', accountType)} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Checkbox text='VIP Fan' checked={accountType.includes('4')} disabled={false} onPress={() => this._checkboxPressed('4', 'accountType', accountType)} />
                                <Checkbox text='Applicant' checked={accountType.includes('9')} disabled={false} onPress={() => this._checkboxPressed('9', 'accountType', accountType)} />
                            </View>
                        </View>
                        <View style={{ paddingVertical: 15 }}>
                            <CustomSlider
                                onValueChange={(values) => {
                                    this.setState({ distanValues: values });
                                    pageNumber = 1;
                                }}
                                values={this.state.distanValues}
                                min={0}
                                max={100}
                                text='Miles'
                            />
                        </View>
                    </View>
                )
                break;
            case 1:
                return (
                    <View style={{
                        alignItems: 'center',
                        paddingVertical: 15
                    }}>
                        <View style={{ flexDirection: 'row', paddingVertical: 15, justifyContent: 'center', marginRight: 15 }}>
                            <Checkbox text='Female' checked={genderType.includes('Female')} onPress={() => this._checkboxPressed('Female', 'gender', genderType)} />
                            <Checkbox text='Male' checked={genderType.includes('Male')} onPress={() => this._checkboxPressed('Male', 'gender', genderType)} />
                        </View>
                        <CustomSlider
                            onValueChange={(values) => {
                                this.setState({ ageValues: values });
                            }}
                            values={this.state.ageValues}
                            min={0}
                            max={60}
                            text='Age'
                        />
                        {
                            this.state.showNetworth &&
                            <View style={{ alignItems: 'center', marginTop: 25 }}>
                                <View style={{ flexDirection: 'row' }}>
                                    <Text style={[{ marginRight: 15, marginTop: -3, width: 30 }, stylesGlobal.font]}>N/A</Text>
                                    <MultiSlider
                                        snapped={true}
                                        values={this.state.networthValues}
                                        sliderLength={Dimensions.get("window").width * 0.6}
                                        min={0}
                                        max={4}
                                        customMarker={() => (
                                            <View style={{
                                                backgroundColor: Colors.gold,
                                                width: 12,
                                                height: 12,
                                                borderRadius: 6,
                                                borderWidth: 1,
                                                borderColor: '#000'
                                            }}>
                                            </View>
                                        )}
                                        markerOffsetY={3}
                                        trackStyle={{
                                            height: 6,
                                            backgroundColor: 'transparent',
                                            borderRadius: 3,
                                            borderWidth: 1,
                                            borderColor: '#000'
                                        }}
                                        selectedStyle={{
                                            backgroundColor: Colors.gold
                                        }}
                                        // markerContainerStyle={{
                                        //     width: 50,
                                        //     height: 50,
                                        //     backgroundColor:Colors.gold,
                                        //     borderWidth:1,
                                        //     borderColor:'#000'
                                        // }}
                                        onValuesChangeFinish={(values) => {
                                            this.setState({ networthValues: values });
                                            // AsyncStorage.setItem('networthValues', JSON.stringify(values))
                                            //     .then(json => console.log('success'))
                                            //     .catch(error => console.log('error!'))
                                        }}
                                    />
                                    <Text style={[{ marginLeft: 15, marginTop: -3, width: 30 }, stylesGlobal.font]}>1B</Text>
                                </View>
                                <View style={{ alignItems: 'center' }}>
                                    <View style={{ width: 250, flexDirection: 'row', justifyContent: 'space-evenly' }}>
                                        <Text style={[{ color: Colors.gold }, stylesGlobal.font_semibold]}>{this.calNetworth(this.state.networthValues[0])}</Text>
                                        <Text style={[{ color: Colors.gold }, stylesGlobal.font_semibold]}>{this.calNetworth(this.state.networthValues[1])}</Text>
                                    </View>
                                    <Text style={[stylesGlobal.font, { marginTop: 10 }]}>Networth</Text>
                                </View>
                            </View>
                        }
                    </View>
                );
                break;
            case 2:
                return (
                    <Animatable.View
                        duration={1500}
                        easing="ease-out"
                        animation={isActive ? 'fadeInDown' : false}
                    >
                        <View style={{
                            alignItems: 'center',
                            paddingVertical: 15
                        }}>
                            <View style={{ flexDirection: 'row', paddingVertical: 15 }}>
                                <View style={{ flex: 1 }}>
                                    <Checkbox text='Black Hair' checked={hairColor.includes('12')} onPress={() => this._checkboxPressed('12', 'hair', hairColor)} />
                                    <Checkbox text='Brown Hair' checked={hairColor.includes('14')} onPress={() => this._checkboxPressed('14', 'hair', hairColor)} />
                                    <Checkbox text='Red Hair' checked={hairColor.includes('16')} onPress={() => this._checkboxPressed('16', 'hair', hairColor)} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Checkbox text='Blonde Hair' checked={hairColor.includes('13')} onPress={() => this._checkboxPressed('13', 'hair', hairColor)} />
                                    <Checkbox text='Grey Hair' checked={hairColor.includes('15')} onPress={() => this._checkboxPressed('15', 'hair', hairColor)} />
                                    <Checkbox text='Other' checked={hairColor.includes('17')} onPress={() => this._checkboxPressed('17', 'hair', hairColor)} />
                                </View>
                            </View>
                            <View style={{ backgroundColor: '#000', height: 1 }}></View>
                            <View style={{ flexDirection: 'row', paddingVertical: 15 }}>
                                <View style={{ flex: 1 }}>
                                    <Checkbox text='Black Eyes' checked={eyeColor.includes('1')} onPress={() => this._checkboxPressed('1', 'eye', eyeColor)} />
                                    <Checkbox text='Brown Eyes' checked={eyeColor.includes('3')} onPress={() => this._checkboxPressed('3', 'eye', eyeColor)} />
                                    <Checkbox text='Ohter' checked={eyeColor.includes('5')} onPress={() => this._checkboxPressed('5', 'eye', eyeColor)} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Checkbox text='Blue Eyes' checked={eyeColor.includes('2')} onPress={() => this._checkboxPressed('2', 'eye', eyeColor)} />
                                    <Checkbox text='Green Eyes' checked={eyeColor.includes('4')} onPress={() => this._checkboxPressed('4', 'eye', eyeColor)} />
                                    {/* <Checkbox text='Hazel Eyes' checked={eyeColor.includes('Hazel')} onPress={() => this._checkboxPressed('Hazel', 'eye', eyeColor)}/> */}
                                </View>
                            </View>
                            <View style={{ backgroundColor: '#000', height: 1 }}></View>
                            <View style={{ flexDirection: 'row', paddingVertical: 15 }}>
                                <View style={{ flex: 1 }}>
                                    {/* <Checkbox text='Fair Skin' checked={skinColor.includes('7')} onPress={() => this._checkboxPressed('7', 'skin', skinColor)}/> */}
                                    <Checkbox text='Black Skin' checked={skinColor.includes('7')} onPress={() => this._checkboxPressed('7', 'skin', skinColor)} />
                                    <Checkbox text='Olive Skin' checked={skinColor.includes('9')} onPress={() => this._checkboxPressed('9', 'skin', skinColor)} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Checkbox text='White Skin' checked={skinColor.includes('8')} onPress={() => this._checkboxPressed('8', 'skin', skinColor)} />
                                    <Checkbox text='Medium Skin' checked={skinColor.includes('553')} onPress={() => this._checkboxPressed('553', 'skin', skinColor)} />

                                    {/* <Checkbox text='Brown Skin' checked={skinColor.includes('Brown Skin')} onPress={() => this._checkboxPressed('Brown Skin', 'skin', skinColor)}/> */}
                                </View>
                            </View>
                            <View style={{ backgroundColor: '#000', height: 1 }}></View>
                            <View style={{ paddingVertical: 15 }}>
                                <CustomSlider
                                    onValueChange={(values) => {
                                        this.setState({ heightValues: values });
                                    }}
                                    values={this.state.heightValues}
                                    min={30}
                                    max={229}
                                    text='Height (cm)'
                                />
                            </View>
                            <View style={{ paddingVertical: 15 }}>
                                <CustomSlider
                                    onValueChange={(values) => {
                                        this.setState({ weightValues: values });
                                    }}
                                    values={this.state.weightValues}
                                    min={5}
                                    max={145}
                                    text='Weight (kg)'
                                />
                            </View>
                            <View style={{ flexDirection: 'row', paddingVertical: 15 }}>
                                <View style={{ flex: 1 }}>
                                    <Checkbox text='Slim' checked={bodyType.includes('530')} onPress={() => this._checkboxPressed('530', 'body', bodyType)} />
                                    <Checkbox text='Medium' checked={bodyType.includes('552')} onPress={() => this._checkboxPressed('552', 'body', bodyType)} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Checkbox text='Curvy' checked={bodyType.includes('532')} onPress={() => this._checkboxPressed('532', 'body', bodyType)} />
                                    <Checkbox text='Athletic' checked={bodyType.includes('534')} onPress={() => this._checkboxPressed('534', 'body', bodyType)} />
                                </View>
                            </View>
                            <View style={{ backgroundColor: '#000', height: 1 }}></View>
                            <View style={{ flexDirection: 'row', paddingVertical: 15 }}>
                                <View style={{ flex: 1 }}>
                                    <Checkbox text='Black' checked={ethnicityType.includes('457')} onPress={() => this._checkboxPressed('457', 'ethinic', ethnicityType)} />
                                    <Checkbox text='Asian' checked={ethnicityType.includes('459')} onPress={() => this._checkboxPressed('459', 'ethinic', ethnicityType)} />
                                    <Checkbox text='Middle Eastern' checked={ethnicityType.includes('466')} onPress={() => this._checkboxPressed('466', 'ethinic', ethnicityType)} />
                                    <Checkbox text='Pacific Islander' checked={ethnicityType.includes('467')} onPress={() => this._checkboxPressed('467', 'ethinic', ethnicityType)} />
                                    <Checkbox text='Other' checked={ethnicityType.includes('524')} onPress={() => this._checkboxPressed('524', 'ethinic', ethnicityType)} />

                                </View>
                                <View style={{ flex: 1 }}>
                                    <Checkbox text='Latino' checked={ethnicityType.includes('464')} onPress={() => this._checkboxPressed('464', 'ethinic', ethnicityType)} />
                                    <Checkbox text='East India' checked={ethnicityType.includes('465')} onPress={() => this._checkboxPressed('465', 'ethinic', ethnicityType)} />
                                    <Checkbox text='American Indian' checked={ethnicityType.includes('469')} onPress={() => this._checkboxPressed('469', 'ethinic', ethnicityType)} />
                                    <Checkbox text='White' checked={ethnicityType.includes('523')} onPress={() => this._checkboxPressed('523', 'ethinic', ethnicityType)} />
                                </View>
                            </View>
                        </View>
                    </Animatable.View>  
                    
                );
                break;
            case 3:
                return (
                    <View>
                        <View style={{ flexDirection: 'row', paddingVertical: 15 }}>
                            <View style={{ flex: 1 }}>
                                <Checkbox text='Single' checked={maritalType.includes('529')} onPress={() => this._checkboxPressed('529', 'marital', maritalType)} />
                                <Checkbox text='Widowed' checked={maritalType.includes('550')} onPress={() => this._checkboxPressed('550', 'marital', maritalType)} />
                                <Checkbox text='Divorced' checked={maritalType.includes('520')} onPress={() => this._checkboxPressed('520', 'marital', maritalType)} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Checkbox text='Separated' checked={maritalType.includes('521')} onPress={() => this._checkboxPressed('521', 'marital', maritalType)} />
                                <Checkbox text='Married' checked={maritalType.includes('522')} onPress={() => this._checkboxPressed('522', 'marital', maritalType)} />
                                <Checkbox text='Open' checked={maritalType.includes('551')} onPress={() => this._checkboxPressed('551', 'marital', maritalType)} />
                            </View>
                        </View>
                    </View>
                );
                break;
            default:
                break;
        }
        return (
            <View>
                <Text></Text>
            </View>
        )
    }

    calNetworth = (index) => {
        switch (index) {
            case 0:
                return 'N/A'
                break;
            case 1:
                return '>$30M'
                break;
            case 2:
                return '>$100M'
                break;
            case 3:
                return '>$500M'
                break;
            case 4:
                return '>$1B'
                break
            default:
                break;
                return ''
        }
    }

    _checkboxPressed = (text, type, stateValue) => {
        const temp = stateValue;
        if (temp.includes(text)) {
            const index = temp.indexOf(text);
            if (index > -1) {
                temp.splice(index, 1);
            }
        } else {
            temp.push(text)
        }

        switch (type) {
            case 'accountType':
                let showNetworth;
                if (temp.includes('1') || temp.includes('2')) {
                    showNetworth = true
                } else {
                    showNetworth = false
                }
                this.setState({ accountType: temp, showNetworth })
                break;
            case 'nonAccountType':
                this.setState({ accountType: temp })
                break;
            case 'gender':
                this.setState({ genderType: temp })
                break;
            case 'hair':
                this.setState({ hairColor: temp })
                break;
            case 'eye':
                this.setState({ eyeColor: temp })
                break;
            case 'skin':
                this.setState({ skinColor: temp })
                break;
            case 'body':
                this.setState({ bodyType: temp })
                break;
            case 'ethinic':
                this.setState({ ethnicityType: temp });
                break;
            case 'marital':
                this.setState({ maritalType: temp })
            case 'nonaccountType':
                this.setState({ nonAccountType: temp })
            default:
                break;
        }
        pageNumber = 1;
    }

    _updateSection = activeSections => {
        this.setState({ activeSections })
    }
    _updateSection_2 = activeSections => {
        this.setState({ activeSections_2:  activeSections})
    }

    renderMainView = () => {
        return (
            <View style={{ flex: 1, width: "100%", height: "100%", alignItems: 'center' }}>
                {
                    this.renderSearchUsersList
                }
            </View>
        );
    };

    /**
     * display search user list
    */
    get renderSearchUsersList() {

        let footerView = (
            <View style={{ backgroundColor: Colors.black, height: 50, justifyContent: 'center', alignItems: 'center' }}>
                {
                    this.state.displayLoadMoreView == false ? null :
                        <Image style={{ width: 50, height: 50 }} resizeMode={'contain'} source={require("../icons/loader.gif")} />
                }
            </View>
        );

        return (
            <View style={{ flex: 1, width: '100%', alignItems: 'center' }} onTouchStart={() => this.setState({ isFiltering: false })}>
                <FlatList
                    ref={(ref) => { this.flatListRef = ref; }}
                    ListHeaderComponent={this.state.pulldown_loading && <PullDownIndicator />}
                    ListFooterComponent={this.state.displayLoadMoreView == true ? footerView : null}
                    extraData={this.state}
                    // pagingEnabled={false}
                    showsHorizontalScrollIndicator={false}
                    showsVerticalScrollIndicator={false}
                    data={this.state.dataSearchUsersList}
                    keyExtractor={(item, index) => index.toString()}
                    style={{ width: '100%' }}
                    renderItem={({ item, index }) => (
                        <View key={index} style={{ width: '100%', alignItems: 'center' }}>
                            <RowConnection
                                data={item}
                                screenProps={this.props.rootNavigation}
                                is_verified={item.is_verified}
                                myUserId={this.state.userId}
                                messageButton={true}
                                followPress={async (item) => {
                                    this.setState({
                                        selected_member: item,
                                        loading: true
                                    })
                                    const response = await callFollowRequest(item, this.state.userId, this.state.userToken);
                                    this.setState({
                                        loading: false
                                    })
                                    if (response.status == "success") {
                                        var myList = this.state.dataSearchUsersList
                                        for (i = 0; i < myList.length; i++) {
                                            if (myList[i].id == this.state.selected_member.id) {
                                                if (myList[i].following_id) {
                                                    myList[i].following_id = null;
                                                } else {
                                                    myList[i].following_id = "1";
                                                }
                                                break;
                                            }
                                        }
                                        this.setState({
                                            dataSearchUsersList: myList,
                                            selected_member: null
                                        })
                                    }
                                }}
                                favoritePress={async (item) => {
                                    this.setState({
                                        selected_member: item,
                                        loading: true
                                    })
                                    const response = await callFavoriteMember(item, this.state.userId, this.state.userToken);
                                    this.setState({
                                        loading: false
                                    })
                                    if (response.status == "success") {
                                        var myList = this.state.dataSearchUsersList
                                        for (i = 0; i < myList.length; i++) {
                                            if (myList[i].id == this.state.selected_member.id) {
                                                if (myList[i].favorite_id) {
                                                    myList[i].favorite_id = null;
                                                } else {
                                                    myList[i].favorite_id = "1";
                                                }
                                                break;
                                            }
                                        }
                                        this.setState({
                                            dataSearchUsersList: myList,
                                            selected_member: null
                                        })
                                    }
                                }}
                                inviteButton={async (item) => {
                                    this.setState({
                                        selected_member: item,
                                        loading: true
                                    })
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
                                }}
                            />
                        </View>
                    )}
                    onMomentumScrollBegin={() => { this.onEndReachedCalledDuringMomentum = false; }}
                    onEndReachedThreshold={0.5}
                    onEndReached={({ distanceFromEnd }) => {
                        if (!this.onEndReachedCalledDuringMomentum && this.state.isLoadMoreSearchUser && !this.state.loading && !this.state.displayLoadMoreView) {
                            this.onEndReachedCalledDuringMomentum = true;
                            this.setState({
                                displayLoadMoreView: true,
                            }, () => {
                                this.callSearchUserListAPI(false);
                            })
                        }
                    }}
                    onScroll={async (e) => {
                        // this.setState({isFiltering: false});
                        if(this.state.activeSections_2.length != 0)
                        {
                            this.setState({
                                activeSections: [0],
                                activeSections_2: []
                            });
                        }
                    
                        if (e.nativeEvent.contentOffset.y < -80) {
                            if (!this.state.pulldown_loading) {
                                pageNumber = 1;
                                this.setState({
                                    pulldown_loading: true
                                }, () => this.callSearchUserListAPI(false))
                            }
                        }
                    }}
                />
            </View>
        );
    };
}

const styles = StyleSheet.create({
    emptyView: {
        flex: 1,
        width: "100%",
        alignItems: "center",
        justifyContent: "center",
    },
});
