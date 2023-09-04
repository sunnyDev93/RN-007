import React, { Component } from "react";
import {
    AppState,
    Dimensions,
    Image,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    View,
    Alert,
    Linking,
    SafeAreaView,
    TouchableOpacity
} from 'react-native';

import TabNavigator from 'react-native-tab-navigator';

import DashboardScreen from "./DashboardScreen";
import GlobalSearchScreen from "./GlobalSearchScreen";
import EventsScreen from "./EventsScreen";
import GiftsScreen from "./GiftsScreen";
import TravelScreen from "./TravelScreen";
import MyRecentMessagesScreen from "./MyRecentMessagesScreen";
import MyAccountScreen from "./MyAccountScreen";
import { Colors } from "../consts/Colors";
import { Constants } from "../consts/Constants";

import CustomBadge from "./CustomBadge";
// import {updateNotificationsBadgeCount} from "../utils/firebaseUtils";
import Memory from '../core/Memory';
import WebService from "../core/WebService";
import * as Global from "../consts/Global";
import { EventRegister } from 'react-native-event-listeners';
import AsyncStorage from '@react-native-community/async-storage';
import { stylesGlobal } from '../consts/StyleSheet';
import { localNotificationService } from '../utils/LocalNotificationService';
import DashboardPopupView from "../customview/DashboardPopupView"
import HeaderView from "../customview/HeaderView";
import CustomPopupView from "../customview/CustomPopupView";
import NotificationPopupView from "../customview/NotificationPopupView";

const tabViewHeight = 49;
var imageSize = 36;
var TAG = "TabNavigatorClass";

export default class TabNavigatorClass extends Component {
    constructor(props) {
        super(props);
        this.state = {
            is_portrait: true,
            userId: "",
            userToken: "",
            userFirstName: '',
            userLastName: '',
            count: '',
            selectedTab: 'DASHBOARD',
            myaccount_selected: false, // when shows my account screen, it;s true
            currentEventType: 0,
            currentTripType: 0,
            appState: AppState.currentState,
            notificationCount: {
                post: 0,
                member: 0,
                event: 0,
                travel: 0,
                gift: 0,
                chat: 0,
            },
            gift_receiver: null,
            gift_category_selected: true,

            search_tab_selected: false, // true when search tab is rendered(once rendered)

            searchText: "", // header search text
            myaccount_initial_tab: "",
            showNotificationModel: false, // notification modal
            showModel: false, // popup modal
            payment_check_failed: false, // to use for payment check failed popup view
        }
    }

    async UNSAFE_componentWillMount() {
        try {
            var userId = await AsyncStorage.getItem(Constants.KEY_USER_ID);
            var userToken = await AsyncStorage.getItem(Constants.KEY_USER_TOKEN);
            var userFirstName = await AsyncStorage.getItem(Constants.KEY_USER_FIRST_NAME);
            var userLastName = await AsyncStorage.getItem(Constants.KEY_USER_LAST_NAME);
            this.setState({
                userId: userId,
                userToken: userToken,
                userFirstName: userFirstName,
                userLastName: userLastName,
            });
        } catch (error) {
            console.log(error)
        }
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

        this.listenerNotificationChange = EventRegister.addEventListener(Constants.EVENT_NOTIFICATION_CHANGED, async () => {


            try {
                let post_count = await AsyncStorage.getItem('POST');
                let member_count = await AsyncStorage.getItem('MEMBER');
                let event_count = await AsyncStorage.getItem('EVENT');
                let travel_count = await AsyncStorage.getItem('TRAVEL');
                let gift_count = await AsyncStorage.getItem('GIFT');
                var chat_count = await AsyncStorage.getItem('CHAT');

                if (this.state.selectedTab == 'MESSAGE') {
                    if (chat_count != null && chat_count != "0") {
                        chat_count = "0";
                        await AsyncStorage.setItem('CHAT', "0");
                        this.read_notifications(6);
                    }
                }
                const notificationCount = {
                    post: post_count,
                    member: member_count,
                    event: event_count,
                    travel: travel_count,
                    gift: gift_count,
                    chat: chat_count
                };

             //   console.log(TAG, 'event_notification_changed', notificationCount);
                this.setState({ notificationCount });

            } catch (error) {

            }
        })

        this.listenerGotoDashboard = EventRegister.addEventListener(Constants.EVENT_GOTODASHBOARD, async () => {
            this.jumpToDashboardTab();
        })

        this.callGetNotificationCountAPI();
    }

    componentDidMount() {
        console.log('asdfasdfad')
        this.goToDashboardTabListener = this.props.navigation.addListener('focus', this.goToDashboardTab.bind(this));
        this.leaveDashboardTabListener = this.props.navigation.addListener('blur', this.leaveDashboardTab.bind(this));
        if (this.props.route.params && this.props.route.params.web_link_object != null) {
            // console.log(TAG, " this.props.route.params === ", this.props.route.params);
            if (this.props.route.params.web_link_object.web_link_type == 'new_invitation') {
                this.props.navigation.navigate("EventDetail", {
                    eventId: this.props.route.params.web_link_object.id,
                    loadAfterDeletingEvent: () => { },
                    refreshEventData: () => { },
                })
            }
        } else {

        }
    }

    componentWillUnmount() {
        this.goToDashboardTabListener();
        this.leaveDashboardTabListener();
    }

    callGetNotificationCountAPI = async () => {
        try {
            let uri = Memory().env == "LIVE" ? Global.URL_GET_NOTIFICATION_COUNT : Global.URL_GET_NOTIFICATION_COUNT_DEV;
            let params = {
                "token": this.state.userToken,
                "user_id": this.state.userId,
                "format": "json"
            }
            console.log(TAG + " callGetNotificationCountAPI uri " + uri);
            console.log(TAG + " callGetNotificationCountAPI params " + JSON.stringify(params));
            WebService.callServicePost(
                uri,
                params,
                this.handleGetNotificationCountResponse
            );
        } catch (error) {
            console.log("" + error);

        }
    };

    /** Handle send rose Data
     *
     * @param response
     * @param isError
     */

    handleGetNotificationCountResponse = async (response, isError) => {
        console.log(TAG + " callGetNotificationCountAPI result " + JSON.stringify(response));
        console.log(TAG + " callGetNotificationCountAPI isError " + isError);
        if (!isError) {
            try {
                var result = response;

                var notificationCount = {
                    post: 0,
                    member: 0,
                    event: 0,
                    travel: 0,
                    gift: 0,
                    chat: 0
                }
                if (result != null) {
                    if (result.status == "success") {
                        var post_count = 0;
                        var profile_count = 0;
                        if (result.data != null) {
                            if (result.data.length > 0) {
                                for (i = 0; i < result.data.length; i++) {
                                    if (result.data[i].notify_type == "1") {
                                        // notificationCount.post = parseInt(result.data[i].count, 10);
                                        post_count = parseInt(result.data[i].count, 10);
                                    } else if (result.data[i].notify_type == "2") {
                                        notificationCount.member = parseInt(result.data[i].count, 10);
                                    } else if (result.data[i].notify_type == "3") {
                                        notificationCount.event = parseInt(result.data[i].count, 10);
                                    } else if (result.data[i].notify_type == "4") {
                                        notificationCount.travel = parseInt(result.data[i].count, 10);
                                    } else if (result.data[i].notify_type == "5") {
                                        notificationCount.gift = parseInt(result.data[i].count, 10);
                                    } else if (result.data[i].notify_type == "6") {
                                        notificationCount.chat = parseInt(result.data[i].count, 10);
                                    } else if (result.data[i].notify_type == "7") {
                                        // notificationCount.profile = parseInt(result.data[i].count, 10);
                                        profile_count = parseInt(result.data[i].count, 10);
                                    }
                                }
                                notificationCount.post = post_count + profile_count;
                            } else {
                                notificationCount.post = 0;
                                notificationCount.member = 0;
                                notificationCount.event = 0;
                                notificationCount.travel = 0;
                                notificationCount.gift = 0;
                                notificationCount.chat = 0;
                            }
                            await AsyncStorage.setItem('POST', `${notificationCount.post}`);
                            await AsyncStorage.setItem('MEMBER', `${notificationCount.member}`);
                            await AsyncStorage.setItem('EVENT', `${notificationCount.event}`);
                            await AsyncStorage.setItem('TRAVEL', `${notificationCount.travel}`);
                            await AsyncStorage.setItem('GIFT', `${notificationCount.gift}`);
                            await AsyncStorage.setItem('CHAT', `${notificationCount.chat}`);
                            this.setState({
                                notificationCount: notificationCount
                            });
                            localNotificationService.setIconNotificationBadge(
                                notificationCount.post + 
                                notificationCount.member + 
                                notificationCount.event +
                                notificationCount.travel + 
                                notificationCount.gift + 
                                notificationCount.chat);

                            EventRegister.emit(Constants.EVENT_NOTIFICATION_CHANGED, '');
                        }
                    } else {

                    }
                }

//                console.log(TAG, 'vent_notification_changed2222', notificationCount);
            } catch (error) {
                console.log(" -- handleGetNotificationCountResponse : ", error)
            }
        } else {
            if (response != undefined && response != null && response.length > 0) {
                Alert.alert(response.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }

        }
    };

    goToDashboardTab = async () => {
        if (this.props.route.params) {

            if (this.props.route.params.logoclick == true) {
                this.jumpToDashboardTab();
            } else if (this.props.route.params.selected_screen == "myaccount") {
                this.jumpToDashboardTab(true, this.props.route.params.myaccount_initial_tab);
            } else if (this.props.route.params.selected_screen == "dashboard") {
                this.jumpToDashboardTab();
                console.log("dashboard click")
            } else if (this.props.route.params.selected_screen == "members") {
                this.jumpToSearchTab(this.props.route.params.search_text)
                console.log("member click")
            } else if (this.props.route.params.selected_screen == "event") {
                console.log("event click")
                console.log(TAG, " goToDashboardTab : ==== ", this.props.route.params.web_link_object)
                if ( this.props.route.params.web_link_object != null ) {
                    this.jumpToEventTab();
                }
            } else if (this.props.route.params.selected_screen == "travel") {
                console.log("travel click")
                console.log(TAG, " goToDashboardTab : ==== ", this.props.route.params);
                this.jumpToTravelTab()
            } else if (this.props.route.params.selected_screen == "gift") {

                this.jumpToGiftsTab()
            } else if (this.props.route.params.selected_screen == "chat") {
                // console.log('this.props.route.params', this.props.route.params)
                this.jumpToChatTab()
            }

        }
    }

    leaveDashboardTab() {
        if (this.props.route.params) {
            if (this.props.route.params.logoclick) {
                this.props.route.params.logoclick = false
            }
            if (this.props.route.params.selected_screen == "members") {
                this.props.route.params.selected_screen = "";
                this.props.route.params.search_text = "";
            }
        }
    }

    updateNotificationCountView = async () => {

        console.log(TAG, 'updateNotificationCountView')

        const { notificationCount } = this.state;
        if (this.state.selectedTab == "DASHBOARD") {
            this.read_notifications(1);
            this.read_notifications(7);
            notificationCount.post = "0";
            await AsyncStorage.setItem('POST', `${notificationCount.post}`)
        } else if (this.state.selectedTab == "MEMBERS") {
            this.read_notifications(2);
            notificationCount.member = "0";
            await AsyncStorage.setItem('MEMBER', `${notificationCount.member}`);
        } else if (this.state.selectedTab == "EVENT") {
            this.read_notifications(3);
            notificationCount.event = "0";
            await AsyncStorage.setItem('EVENT', `${notificationCount.event}`)
        } else if (this.state.selectedTab == "TRAVEL") {
            this.read_notifications(4);
            notificationCount.travel = "0";
            await AsyncStorage.setItem('TRAVEL', `${notificationCount.travel}`)
        } else if (this.state.selectedTab == "GIFTS") {
            this.read_notifications(5);
            notificationCount.gift = "0";
            await AsyncStorage.setItem('GIFT', `${notificationCount.gift}`)
        } else if (this.state.selectedTab == "MESSAGE") {
            this.read_notifications(6);
            notificationCount.chat = "0";
            await AsyncStorage.setItem('CHAT', `${notificationCount.chat}`)
        }
        this.setState({ notificationCount });

    }

    updateNotificationBadge = () => {// not used

        const { notificationCount } = this.state;
        const { post, member, event, travel, gift, chat } = notificationCount
        const totalNotifications = (
            Number.parseInt(post || 0) + Number.parseInt(event || 0) + Number.parseInt(member || 0)
            + Number.parseInt(travel || 0) + Number.parseInt(gift || 0) + Number.parseInt(chat || 0)
        )
        if (!this.totalNotifications || (this.totalNotifications !== totalNotifications)) {
            this.totalNotifications = totalNotifications
            // updateNotificationsBadgeCount(totalNotifications);
        }
    }

    read_notifications = async (noti_class_type) => {

        if(noti_class_type != 6)
            return;
        
        try {
            let uri = Memory().env == "LIVE" ? Global.URL_READ_NOTIFICATIONS : Global.URL_READ_NOTIFICATIONS_DEV;
            let params = new FormData();
            params.append("user_id", this.state.userId);
            params.append("token", this.state.userToken);
            params.append("format", "json");
            params.append("notify_type", noti_class_type);

            console.log(TAG + " read_notifications callReadNotificationAPI uri " + uri);
            console.log(TAG + " read_notifications callReadNotificationAPI params " + JSON.stringify(params));

            WebService.callServicePost(
                uri,
                params,
                this.handleReadNotificationResponse
            );
        } catch (error) {
            console.log(error)

        }
    }

    handleReadNotificationResponse = async (response, isError) => {
        console.log(TAG + " read_notifications callReadNotificationAPI result " + JSON.stringify(response));
        console.log(TAG + " read_notifications callReadNotificationAPI isError " + isError);
        if (!isError) {
            try {
                var result = response;
                if (result != null) {
                    if (result.status == "success") {
                        //  set icon notification badge number
                        let post_new = await AsyncStorage.getItem('POST');
                        if (post_new == null) {
                            post_new = 0;
                        }

                        let member_new = await AsyncStorage.getItem('MEMBER');
                        if (member_new == null) {
                            member_new = 0;
                        }

                        let event_new = await AsyncStorage.getItem('EVENT');
                        if (event_new == null) {
                            event_new = 0;
                        }

                        let travel_new = await AsyncStorage.getItem('TRAVEL');
                        if (travel_new == null) {
                            travel_new = 0;
                        }

                        let gift_new = await AsyncStorage.getItem('GIFT');
                        if (gift_new == null) {
                            gift_new = 0;
                        }

                        let chat_new = await AsyncStorage.getItem('CHAT');
                        if (chat_new == null) {
                            chat_new = 0;
                        }
                        console.log('------->', parseInt(post_new, 10) + parseInt(member_new, 10) + parseInt(event_new, 10) +
                            parseInt(travel_new, 10) + parseInt(gift_new, 10) + parseInt(chat_new, 10))
                        localNotificationService.setIconNotificationBadge(
                            parseInt(post_new, 10) + 
                            parseInt(member_new, 10) + 
                            parseInt(event_new, 10) +
                            parseInt(travel_new, 10) + 
                            parseInt(gift_new, 10) + 
                            parseInt(chat_new, 10))
                    }
                }
            } catch (error) {
                console.log(error)
            }
        } else {
            if (response != undefined && response != null && response.length > 0) {
                Alert.alert(response.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    };

    render() {
        const { notificationCount } = this.state;
        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: Colors.black }}>
                <DashboardPopupView ref="dashboard_popup_view" rootNavigation={this.props.navigation} jumpToDashboardTab={this.jumpToDashboardTab} />
                <TabNavigator tabBarStyle={styles.tabBarStyle} hidesTabTouch={true}>
                    <TabNavigator.Item
                        selected={this.state.selectedTab === 'DASHBOARD' || this.state.selectedTab === 'DASHBOARD_MYACCOUNT'}
                        title="DASHBOARD"
                        titleStyle={[styles.titleStyle, stylesGlobal.font]}
                        selectedTitleStyle={[styles.selectedTitleStyle, stylesGlobal.font_bold]}
                        renderIcon={() => <Image source={require("../icons/ic_tab_dashbord.png")} style={styles.icon} />}
                        renderSelectedIcon={() => <Image source={require("../icons/ic_tab_dashbord.png")} style={styles.selectedIcon} />}
                        // renderBadge={() => <CustomBadge>{notificationCount.post.toString() != "0" ? notificationCount.post.toString() : ""}</CustomBadge>}
                        onPress={async () => {
                            // if(this.state.myaccount_selected) {
                            //     this.setState({ selectedTab: 'DASHBOARD_MYACCOUNT'});
                            // } else {
                            //     if(this.state.selectedTab == 'DASHBOARD') {
                            //         this.refs.tab_dashboard.scrolltoTop_mainScrollView();
                            //     }
                            //     this.setState({ selectedTab: 'DASHBOARD'});
                            // }
                            try {
                                if (this.state.selectedTab == 'DASHBOARD') {
                                    this.refs.tab_dashboard.scrolltoTop_mainScrollView();
                                } else {
                                    this.setState({ selectedTab: 'DASHBOARD' });
                                }
                                await this.refs.tab_dashboard.getData();
                                this.setState({ selectedTab: 'DASHBOARD' });
                                this.props.navigation.setParams({ selected_screen: "dashboard" });
                                if (this.state.payment_check_failed) {
                                    this.refs.dashboard_popup_view.setPaymentCheckFailed(true);
                                }
                            } catch (error) {
                                console.log(TAG, " Dashboard select error : ", error);
                                console.log(TAG, " Dashboard select error 2 : ", this.state.selectedTab);
                            }
                        }}
                    >
                        <React.Fragment>
                            {
                                this.state.selectedTab == "DASHBOARD" &&
                                <DashboardScreen 
                                    ref="tab_dashboard" 
                                    rootNavigation={this.props.navigation} 
                                    jumpToDashboardTab={this.jumpToDashboardTab} 
                                    jumpToSearchTab={this.jumpToSearchTab} 
                                    jumpToMyNetworkTab={this.jumpToMyNetworkTab} 
                                    jumpToEventTab={this.jumpToEventTab} 
                                    jumpToTravelTab={this.jumpToTravelTab} 
                                    jumpToAlbums={this.jumpToAlbums} 
                                    jumpToChatTab={this.jumpToChatTab}
                                    />
                            }
                            {
                                this.state.selectedTab == "DASHBOARD_MYACCOUNT" &&
                                <MyAccountScreen 
                                    ref="tab_dashboard_myaccount" 
                                    navigation={this.props.navigation} 
                                    initial_tab={this.state.myaccount_initial_tab} 
                                    payment_check_failed={this.state.payment_check_failed} 
                                    setPaymentCheck={this.setPaymentCheck} 
                                    jumpToDashboardTab={this.jumpToDashboardTab} 
                                    jumpToChatTab={this.jumpToChatTab}
                                    jumpToSearchTab={this.jumpToSearchTab} />
                            }
                        </React.Fragment>
                    </TabNavigator.Item>
                    <TabNavigator.Item
                        selected={this.state.selectedTab === 'MEMBERS' || this.state.selectedTab === 'MEMBERS_MYACCOUNT'}
                        title="MEMBERS"
                        titleStyle={[styles.titleStyle, stylesGlobal.font]}
                        selectedTitleStyle={[styles.selectedTitleStyle, stylesGlobal.font_bold]}
                        renderIcon={() => <Image source={require("../icons/ic_tab_connect.png")} style={styles.icon} />}
                        renderSelectedIcon={() => <Image source={require("../icons/ic_tab_connect.png")} style={styles.selectedIcon} />}
                        // renderBadge={() => <CustomBadge>{notificationCount.member.toString() != "0" ? notificationCount.member.toString() : ""}</CustomBadge>}
                        onPress={async () => {
                            if (!this.state.payment_check_failed) {
                                this.setState({ selectedTab: 'MEMBERS' }, () => {
                                    this.props.navigation.setParams({ selected_screen: "members" });
                                    if (!this.state.search_tab_selected) {
                                        this.refs.tab_search.setSearchText("");
                                        this.setState({
                                            search_tab_selected: true
                                        })
                                    }
                                });
                            }
                        }}
                    >
                        <GlobalSearchScreen ref="tab_search" rootNavigation={this.props.navigation} jumpToChatTab={this.jumpToChatTab} jumpToDashboardTab={this.jumpToDashboardTab} jumpToEventTab={this.jumpToEventTab} jumpToTravelTab={this.jumpToTravelTab} />
                    </TabNavigator.Item>
                    <TabNavigator.Item
                        selected={this.state.selectedTab === 'EVENT'}
                        title="PARTIES"
                        titleStyle={[styles.titleStyle, stylesGlobal.font]}
                        selectedTitleStyle={[styles.selectedTitleStyle, stylesGlobal.font_bold]}
                        renderIcon={() => <Image source={require("../icons/ic_tab_events.png")} style={styles.icon} />}
                        renderSelectedIcon={() => <Image source={require("../icons/ic_tab_events.png")} style={styles.selectedIcon} />}
                        // renderBadge={() => <CustomBadge>{notificationCount.event.toString() != "0" ? notificationCount.event.toString() : ""}</CustomBadge>}
                        onPress={async () => {
                            if (!this.state.payment_check_failed) {
                                this.setState({ currentEventType: -1, selectedTab: 'EVENT', }, () => {
                                    this.props.navigation.setParams({ selected_screen: "event" });
                                    this.refs.tab_parties.configure_startup_category();
                                });
                            }
                        }}
                    >
                        <EventsScreen ref="tab_parties" rootNavigation={this.props.navigation} jumpToChatTab={this.jumpToChatTab} currentEventType={this.state.currentEventType} jumpToDashboardTab={this.jumpToDashboardTab} jumpToSearchTab={this.jumpToSearchTab} jumpToEventTab={this.jumpToEventTab} jumpToTravelTab={this.jumpToTravelTab} />
                    </TabNavigator.Item>
                    <TabNavigator.Item
                        selected={this.state.selectedTab === 'TRAVEL'}
                        title="TRIPS"
                        titleStyle={[styles.titleStyle, stylesGlobal.font]}
                        selectedTitleStyle={[styles.selectedTitleStyle, stylesGlobal.font_bold]}
                        renderIcon={() => <Image source={require("../icons/ic_tab_travel.png")} style={styles.icon} />}
                        renderSelectedIcon={() => <Image source={require("../icons/ic_tab_travel.png")} style={styles.selectedIcon} />}
                        // renderBadge={() => <CustomBadge>{notificationCount.travel.toString() != "0" ? notificationCount.travel.toString() : ""}</CustomBadge>}
                        onPress={async () => {
                            if (!this.state.payment_check_failed) {
                                this.props.navigation.setParams({ selected_screen: "travel" });
                                this.setState({ currentTripType: -1, selectedTab: 'TRAVEL' }, () => {
                                    this.refs.tab_trips.configure_startup_category();
                                });
                            }
                        }}
                    >
                        <TravelScreen ref="tab_trips" rootNavigation={this.props.navigation} jumpToChatTab={this.jumpToChatTab}  currentTripType={this.state.currentTripType} jumpToDashboardTab={this.jumpToDashboardTab} jumpToSearchTab={this.jumpToSearchTab} jumpToEventTab={this.jumpToEventTab} jumpToTravelTab={this.jumpToTravelTab} />
                    </TabNavigator.Item>
                    <TabNavigator.Item
                        selected={this.state.selectedTab === 'GIFTS'}
                        title="SHOP"
                        titleStyle={[styles.titleStyle, stylesGlobal.font]}
                        selectedTitleStyle={[styles.selectedTitleStyle, stylesGlobal.font_bold]}
                        renderIcon={() => <Image source={require("../icons/ic_tab_gift.png")} style={styles.icon} />}
                        renderSelectedIcon={() => <Image source={require("../icons/ic_tab_gift.png")} style={styles.selectedIcon} />}
                        // renderBadge={() => <CustomBadge>{notificationCount.gift.toString() != "0" ? notificationCount.gift.toString() : ""}</CustomBadge>}
                        onPress={async () => {
                            if (!this.state.payment_check_failed) {
                                this.props.navigation.setParams({ selected_screen: "gift" });
                                this.setState({ selectedTab: 'GIFTS' });
                                Global.gift_category_selected = true;
                            }
                        }}
                    >
                        <GiftsScreen rootNavigation={this.props.navigation} receiver={this.state.gift_receiver} jumpToChatTab={this.jumpToChatTab} jumpToDashboardTab={this.jumpToDashboardTab} jumpToSearchTab={this.jumpToSearchTab} jumpToEventTab={this.jumpToEventTab} jumpToTravelTab={this.jumpToTravelTab} />
                    </TabNavigator.Item>
                    <TabNavigator.Item
                        selected={this.state.selectedTab === 'MESSAGE'}
                        title="CHAT"
                        titleStyle={[styles.titleStyle, stylesGlobal.font]}
                        selectedTitleStyle={[styles.selectedTitleStyle, stylesGlobal.font_bold]}
                        renderIcon={() => <Image source={require("../icons/ic_tab_messages.png")} style={styles.icon} />}
                        renderSelectedIcon={() => <Image source={require("../icons/ic_tab_messages.png")} style={styles.selectedIcon} />}
                        renderBadge={() => <CustomBadge>{notificationCount.chat.toString() != "0" ? notificationCount.chat.toString() : ""}</CustomBadge>}
                        onPress={async () => {
                            if (!this.state.payment_check_failed) {
                                this.props.navigation.setParams({ selected_screen: "chat" });
                                notificationCount.chat = "0";
                                this.setState({ selectedTab: 'MESSAGE', notificationCount });
                                await AsyncStorage.setItem('CHAT', `${notificationCount.chat}`)
                                this.read_notifications(6);
                                this.refs.tab_recentchat.scrolltoTop_mainScrollView();
                            }
                        }}
                    >
                        <MyRecentMessagesScreen 
                            ref="tab_recentchat" 
                            rootNavigation={this.props.navigation} 
                            jumpToDashboardTab={this.jumpToDashboardTab} 
                            jumpToEventTab={this.jumpToEventTab} 
                            jumpToTravelTab={this.jumpToTravelTab} 
                            read_notifications={this.read_notifications} 
                            notificationItem={this.props.route.params ? this.props.route.params.notification : {}}
                            jumpToChatTab={this.jumpToChatTab} 

                        />
                    </TabNavigator.Item>
                </TabNavigator>
            </SafeAreaView>
        );
    }

    setPaymentCheck = async (status) => {
        this.refs.dashboard_popup_view.setPaymentCheckFailed(status);
        this.setState({ payment_check_failed: status });
    }

    jumpToDashboardTab = (myaccount_call, myaccount_initial_tab, payment_check_failed) => {
        if (myaccount_call) {
            if (payment_check_failed) {
                this.setState({
                    payment_check_failed: true
                })
            } else {
                this.setState({
                    payment_check_failed: false
                })
            }

            console.log('myaccount_call', myaccount_call, myaccount_initial_tab, payment_check_failed)
            this.setState({ selectedTab: 'DASHBOARD_MYACCOUNT', myaccount_initial_tab: myaccount_initial_tab });
            
            this.setState({ myaccount_selected: true }, () => {
                if (this.state.myaccount_selected) {
                    var myaccount_tab_index = 0;
                    if (myaccount_initial_tab == "susbscription") {
                        myaccount_tab_index = 0;
                    } else if (myaccount_initial_tab == "buy_goldcoin") {
                        myaccount_tab_index = 2;
                    } else if (myaccount_initial_tab == "notifications") {
                        myaccount_tab_index = 8;
                    } else if (myaccount_initial_tab == "add_card") {
                        myaccount_tab_index = 4;
                    }

                    setTimeout(() => {
                        if (this.refs.tab_dashboard_myaccount) {
                            this.refs.tab_dashboard_myaccount.move_tab(myaccount_tab_index);
                        }
                    }, 500);
                }
            })
        } else {
            this.setState({ selectedTab: 'DASHBOARD' }, () => {
                this.refs.tab_dashboard.scrolltoTop_mainScrollView();
                this.updateNotificationCountView();
            });
            if (this.state.payment_check_failed) {
                this.refs.dashboard_popup_view.setPaymentCheckFailed(true);
            }
        }
    }

    jumpToSearchTab = (search_text, myaccount_call, myaccount_initial_tab) => {
        if (myaccount_call) {
            this.setState({ selectedTab: 'MEMBERS_MYACCOUNT', myaccount_initial_tab: myaccount_initial_tab });
        } else {
            this.setState({ selectedTab: 'MEMBERS' }, () => {
                this.setState({
                    search_tab_selected: true
                })
                this.refs.tab_search.setSearchText(search_text);
                this.updateNotificationCountView();
            });
        }
    }

    jumpToEventTab = (index) => {
        console.log(TAG, " jumpToEventTab = index : ", index)
        this.setState({ currentEventType: -1, selectedTab: 'EVENT' }, () => {
            this.updateNotificationCountView();
            this.props.navigation.setParams({ selected_screen: "event" });
            if (index != null) {
                this.refs.tab_parties.setInitialTabIndex(index);
            } else {
                this.refs.tab_parties.configure_startup_category();
            }
        });
    }

    jumpToTravelTab = (index) => {
        // this.setState({ currentTripType: index, }, () => {
        //     this.setState({ selectedTab: 'TRAVEL' }, () => {
        //         this.updateNotificationCountView();
        //         if (index != null) {
        //              this.refs.tab_trips.setInitialTabIndex(index);
        //         } else 
        //         this.refs.tab_trips.configure_startup_category();
        //     })
        // });

        console.log(TAG, " jumpToTravelTab = index : ", index)

        this.setState({ currentTripType: -1, selectedTab: 'TRAVEL' }, () => {
                this.updateNotificationCountView();
                this.props.navigation.setParams({ selected_screen: "trip" });
                if (index != null) {
                     this.refs.tab_trips.setInitialTabIndex(index);
                } else 
                this.refs.tab_trips.configure_startup_category();
            })
    }

    getDataAgainAlbum = () => {
        this.refs.tab_dashboard.callGetNearMePeopleAPI();
    }

    jumpToAlbums = () => {
        this.setState({ selectedTab: 'AddAlbum' }, () => {
            this.updateNotificationCountView();
            this.props.navigation.navigate("AddAlbum", {
                userId: this.state.userId,
                userToken: this.state.userToken,
                getDataAgain: this.getDataAgainAlbum,
                isPrivate: 0
            })
        });
    }

    jumpToGiftsTab = () => {
        this.setState({ selectedTab: 'GIFTS' }, () => {
            this.updateNotificationCountView();
        });
    }

    jumpToChatTab = () => {
        this.setState({ selectedTab: 'MESSAGE' }, () => {
            this.updateNotificationCountView("message");
        });
    }

    jumpToMyNetworkTab = () => {
        this.setState({ selectedTab: 'NETWORK' }, () => {
            this.updateNotificationCountView();
        });
    }
}

const styles = StyleSheet.create({
    titleStyle: {
        color: Colors.gold,
        opacity: 0.7,
        fontSize: 9,
    },
    selectedTitleStyle: {
        color: Colors.gold,
        opacity: 1,
        fontSize: 9,
    },
    icon: {
        width: imageSize,
        height: imageSize,
        opacity: 0.5,
        marginBottom: -5
    },
    selectedIcon: {
        width: imageSize,
        height: imageSize,
        marginBottom: -5
    },
    tabBarStyle: {
        backgroundColor: Colors.black,
        height: tabViewHeight,
        // paddingBottom: tabPaddingBottom,
        borderTopWidth: 2,
        borderTopColor: Colors.gold
    }
});
