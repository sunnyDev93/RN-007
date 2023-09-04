import React, { Component } from "react";
import {
    Alert,
    StyleSheet,
    SafeAreaView,
    Dimensions
} from "react-native";
import ScrollableTabView, {
    ScrollableTabBar
} from "react-native-scrollable-tab-view";
import { EventRegister } from 'react-native-event-listeners'
import AsyncStorage from '@react-native-community/async-storage';
import ActionButton from "react-native-action-button";
import { Colors } from "../consts/Colors";
import { ImageCompressor } from './ImageCompressorClass'
import EventListScreen from "./EventListScreen";
// import CreateEventScreen from "./CreateEventScreen";
import { Constants } from "../consts/Constants";
import { stylesGlobal, STICKY_HEADER_HEIGHT } from '../consts/StyleSheet'
import HeaderView from "../customview/HeaderView";
import CustomPopupView from "../customview/CustomPopupView";
import NotificationPopupView from "../customview/NotificationPopupView";
import Memory from '../core/Memory';
import WebService from "../core/WebService";
import * as Global from "../consts/Global";
import ProgressIndicator from "./ProgressIndicator";
import BannerView from "../customview/BannerView";

var TAG = "EventsScreen";

export default class EventsScreen extends React.Component {

    constructor(props) {
        super(props)
        console.log(TAG, " EventsScreen = this.props.currentEventType : ", this.props.currentEventType);
        this.state = {
            loading: false,
            initialIndex: 1,
            userId: "",
            userToken: "",
            userSlug: "",
            userImagePath: "",
            userImageName: "",
            showModel: false,
            showNotificationModel: false,
            member_plan: '',
            is_verified: '0',
            initial_tab: this.props.currentEventType == -1 ? 0 : this.props.currentEventType,
            searchText: '',
            origin_init_tab_index: this.props.currentEventType == -1 ? -1 : this.props.currentEventType,
            selected_first_tab: false,
            selected_second_tab: false,
            selected_third_tab: false,
            is_portrait: true
        }
    }

    updateWindowDimensions() {
        if (Dimensions.get("window").width < Dimensions.get("window").height) {
            this.setState({ is_portrait: true });
        } else {
            this.setState({ is_portrait: false })
        }
    }

    UNSAFE_componentWillMount() {
        this.getData();
        this.listener = EventRegister.addEventListener(Constants.EVENT_PROFILE_IMAGE_UPDATED, () => {
            console.log(TAG, "EVENT_PROFILE_IMAGE_UPDATED event called");
            this.refreshProfileImage();
        });
    }

    componentDidMount() {
        Dimensions.addEventListener("change", this.updateWindowDimensions());
    }

    componentWillUnmount() {
        EventRegister.removeEventListener(this.listener)
        Dimensions.removeEventListener("change", this.updateWindowDimensions());
    }

    /**
       * get async storage data
       */
    getData = async () => {
        try {
            let userId = await AsyncStorage.getItem(Constants.KEY_USER_ID);
            let userToken = await AsyncStorage.getItem(Constants.KEY_USER_TOKEN);
            let userSlug = await AsyncStorage.getItem(Constants.KEY_USER_SLUG);
            // var userFirstName = await AsyncStorage.getItem(Constants.KEY_USER_FIRST_NAME);
            // var userLastName = await AsyncStorage.getItem(Constants.KEY_USER_LAST_NAME);
            let userImagePath = await AsyncStorage.getItem(Constants.KEY_USER_IMAGE_URL);
            let userImageName = await AsyncStorage.getItem(Constants.KEY_USER_IMAGE_NAME);
            let member_plan = await AsyncStorage.getItem(Constants.KEY_MEMBER_PLAN);
            let is_verified = await AsyncStorage.getItem(Constants.KEY_IS_VERIFIED);
            this.setState({
                userId: userId,
                userToken: userToken,
                userSlug: userSlug,
                userImagePath: userImagePath,
                userImageName: userImageName,
                showModel: false,
                member_plan: member_plan,
                is_verified: is_verified,
                is_got: true,
            });
        } catch (error) {
            // Error retrieving data
        }
    };

    configure_startup_category = async () => {		// load data before render
        var userId = await AsyncStorage.getItem(Constants.KEY_USER_ID);
        var userToken = await AsyncStorage.getItem(Constants.KEY_USER_TOKEN);
        this.setState({
            userId: userId,
            userToken: userToken,
        }, () => this.setInitCategory());
    }

    setInitCategory = async () => {
        // console.log(TAG, " setInitCategory ==== this.state.member_plan, this.state.is_verified  : ", this.state.member_plan, this.state.is_verified);
        if (this.state.origin_init_tab_index == -1) {
            this.callInitialCategory();
        } else {
            if ((this.state.member_plan == '4' || this.state.member_plan == '7' || this.state.member_plan == '8' || this.state.is_verified != "1")) {
                this.setState({ origin_init_tab_index: 0 });
            }
            setTimeout(() => {
                this.scrollableTab.goToPage(this.state.origin_init_tab_index);
                if (this.state.origin_init_tab_index == 0) {
                    this.tab2.scrollToFirst();
                } else if (this.state.origin_init_tab_index == 1) {
                    this.tab3.scrollToFirst();
                } else if (this.state.origin_init_tab_index == 2) {
                    this.tab4.scrollToFirst();
                }
            }, 100)
        }
    }

    setInitialTabIndex = async (index) => {

        this.interVal = undefined;
        setTimeout(() => {
            if(!this.state.is_got) this.setInitialTabIndex(index);
            else{
                if ((this.state.member_plan == '4' || this.state.member_plan == '7' || this.state.member_plan == '8' || this.state.is_verified != "1")) {
                    index = 0;
                } 

                this.setState({ initial_tab: index, origin_init_tab_index: index });

                setTimeout(() => {
                    if (this.scrollableTab != undefined) {
                        console.log('moving page =====> ', index);
                        this.scrollableTab.goToPage(index)
                    }
                }, 300);
            }
        }, 1000);

        
        
    }

    callInitialCategory = () => {
        try {
            this.setState({ loading: true })
            let uri = Memory().env == "LIVE" ? Global.URL_DETERMINE_CATEGORY_EVENT : Global.URL_DETERMINE_CATEGORY_EVENT_DEV;
            let params = new FormData();
            params.append("token", this.state.userToken);
            params.append("user_id", this.state.userId);
            params.append("format", "json");
            console.log(TAG + " callInitialCategoryAPI uri " + uri);
            console.log(TAG + " callInitialCategoryAPI params " + JSON.stringify(params));
            WebService.callServicePost(uri, params, this.handleInitialCategoryResponse);
        } catch (error) {
            this.setState({ loading: false });
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    }

    handleInitialCategoryResponse = (response, isError) => {
        console.log(TAG + " callInitialCategoryAPI result " + JSON.stringify(response));
        console.log(TAG + " callInitialCategoryAPI isError " + isError);
        if (!isError) {
            var result = response;
            if (result.status == "success") {
                if (result.data.tab_index == 1 || result.data.tab_index == 2) {
                    this.setState({
                        initial_tab: 0,
                        origin_init_tab_index: 0,
                    })
                } else if (result.data.tab_index == 3) {
                    this.setState({
                        initial_tab: 1,
                        origin_init_tab_index: 1,
                    })
                } else if (result.data.tab_index == 4) {
                    if (this.state.member_plan == '4' || this.state.member_plan == '7' || this.state.member_plan == '8' || this.state.is_verified != "1") {
                        this.setState({
                            initial_tab: 0,
                            origin_init_tab_index: 0,
                        })
                    } else {
                        this.setState({
                            initial_tab: 2,
                            origin_init_tab_index: 2,
                        })
                    }
                }

            } else {
                this.setState({
                    initial_tab: 0,
                    origin_init_tab_index: 0,
                })
                alert("callInitialCategoryAPI isError")
            }
        } else {
            this.setState({
                initial_tab: 0,
                origin_init_tab_index: 0,
            });

            if (response != undefined && response != null && response.length > 0) {
                Alert.alert(response.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }

        this.setState({
            loading: false,
            selected_first_tab: false,
            selected_second_tab: false,
            selected_third_tab: false,
        }, () => {
            if (this.state.initial_tab == 0) {
                this.setState({
                    selected_first_tab: true
                }, () => this.tab2.renderDataAgain(2))
            } else if (this.state.initial_tab == 1) {
                this.setState({
                    selected_second_tab: true
                }, () => this.tab3.renderDataAgain(3))
            } else if (this.state.initial_tab == 2) {
                this.setState({
                    selected_third_tab: true
                }, () => this.tab4.renderDataAgain(4))
            }
        })

    };

    render() {
        return (
            <SafeAreaView style={styles.container}>
                <HeaderView
                    ref="header_view"
                    logoClick={() => this.props.jumpToDashboardTab()}
                    screenProps={this.props.rootNavigation}
                    setSearchText={(text) => this.setState({ searchText: text })}
                    handleEditComplete={() => this.handleEditComplete()}
                    showNotificationPopupView={() => { this.refNotificationPopupView.getData(); this.setState({ showNotificationModel: true }) }}
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
                    ref={ref => this.refNotificationPopupView = ref}
                    showModel={this.state.showNotificationModel}
                    openNotificationScreen={this.props.jumpToDashboardTab}
                    closeDialog={() => { this.setState({ showNotificationModel: false }) }}
                    prop_navigation={this.props.rootNavigation}
                >
                </NotificationPopupView>
                {
                    !this.state.loading && this.setUpperTabBar()
                }
                {
                    this.state.loading && <ProgressIndicator />
                }
                {
                    this.state.member_plan != '4' && this.state.member_plan != '7' && this.state.member_plan != '8' && this.state.is_verified == "1" &&
                    this.showUploadButton()
                }
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
            await AsyncStorage.removeItem(Constants.KEY_USER_ID);
            await AsyncStorage.removeItem(Constants.KEY_USER_TOKEN);
            this.props.rootNavigation.navigate("SignInScreen", { isGettingData: false });
        } catch (error) {
            console.log(TAG + " logoutUser error " + error);
        }
    }

    /**
    * display upload button
    */
    showUploadButton = () => {
        return (
            <ActionButton
                buttonColor={Colors.gold}
                title="New Event"
                style={{ position: "absolute", right: 10, bottom: 20 }}
                onPress={async () => {
                    this.goToCreateEventScreen()
                }}
            />
        );
    }

    /**
     *  Go to Create Event Scren
     *
     */
    goToCreateEventScreen = () => {

        if(!this.tab4){
            this.setInitialTabIndex(2);
        }

        this.props.rootNavigation.navigate("CreateEvent", {
                        userId: this.state.userId,
                        token: this.state.userToken,
                        data: null,
                        isCopy: false,
                        loadAfterDeletingEvent: this.loadAfterDeletingEvent,
                        updateHostEvent: this.updateHostEvent,
                        type: 'create_event'
                    })

    //console.log(TAG, 'goToCreateEventScreen   ', this.state.userId, this.state.userToken);
//         console.log(this.inverVal, this.tab4);
//         if(!this.interVal)
//         {
//             this.interVal = setInterval(() => {
// 
//             if(!this.tab4){
//                 console.log('dlslsdlslslslslslslsl');
//                 if(this.scrollableTab)
//                     this.scrollableTab.goToPage(2)
//                 else 
//                 {
// 
//                     clearInterval(this.interVal);
//                     this.interVal = undefined;
//                 }
//             }else{
//                 clearInterval(this.interVal);
//                 this.props.rootNavigation.navigate("CreateEvent", {
//                             userId: this.state.userId,
//                             token: this.state.userToken,
//                             data: null,
//                             isCopy: false,
//                             loadAfterDeletingEvent: this.loadAfterDeletingEvent,
//                             updateHostEvent: this.updateHostEvent,
//                             type: 'create_event'
//                         })
//                 }
//                 this.interVal = undefined;
//             }, 1000);
//         }
        

       
    }

    /**
    * handle search button click of keybaord
    */
    handleEditComplete = () => {
        searchText = this.state.searchText.trim();
        this.setState({
            searchText: searchText,
        }, () => {
            if (this.state.searchText.length > 0) {
                this.props.jumpToSearchTab(this.state.searchText);
            }
        });
    };

    /**
     * display event type tab bar so user can navigate to event types
     */
    setUpperTabBar = () => {
        return (
            <ScrollableTabView
                style={{ width: '100%', height: 50, }}
                tabBarBackgroundColor={Colors.black}
                tabBarTextStyle={stylesGlobal.font}
                selectedTabBarTextStyle={stylesGlobal.font_bold}
                tabBarActiveTextColor={Colors.gold}
                locked={true}
                ref={ref => this.scrollableTab = ref}
                tabBarUnderlineStyle={{ backgroundColor: Colors.gold }}
                tabBarInactiveTextColor={Colors.gold}
                onChangeTab={(data) => this.updateTabContent(data)}
                renderTabBar={() => <ScrollableTabBar style={{ width: '100%' }} />}
                initialPage={this.state.initial_tab}
            >
                <EventListScreen
                    ref={ref => this.tab2 = ref}
                    tabLabel="MEMBER PARTIES"
                    screenProps={this.props.rootNavigation}
                    funcTabSelection={this.handleAutoTabSelection}
                    type={2}
                    loadAfterDeletingEvent={this.loadAfterDeletingEvent}
                    goToCreateEventScreen={this.goToCreateEventScreen}
                    refreshEventData={this.refreshEventData}
                    openMyAccountScreen={this.props.jumpToDashboardTab}
                    EventCategory="party"
                />
                <EventListScreen
                    ref={ref => this.tab3 = ref}
                    tabLabel="PERSONAL INVITATIONS"
                    screenProps={this.props.rootNavigation}
                    funcTabSelection={this.handleAutoTabSelection}
                    type={3}
                    loadAfterDeletingEvent={this.loadAfterDeletingEvent}
                    goToCreateEventScreen={this.goToCreateEventScreen}
                    refreshEventData={this.refreshEventData}
                    openMyAccountScreen={this.props.jumpToDashboardTab}
                    EventCategory="party"
                />
                {
                    this.state.member_plan != '4' && this.state.member_plan != '7' && this.state.member_plan != '8' && this.state.is_verified == "1" &&
                    <EventListScreen
                        // onRef={ref => { console.log('tab4   --------------->'); this.tab4 = ref }}
                         ref={ref => this.tab4 = ref}
                        tabLabel="HOSTED PARTIES"
                        screenProps={this.props.rootNavigation}
                        funcTabSelection={this.handleAutoTabSelection}
                        type={4}
                        loadAfterDeletingEvent={this.loadAfterDeletingEvent}
                        goToCreateEventScreen={this.goToCreateEventScreen}
                        refreshEventData={this.refreshEventData}
                        openMyAccountScreen={this.props.jumpToDashboardTab}
                        EventCategory="party"
                    />
                }
            </ScrollableTabView>
        );
    };

    /**
     * refresh tab content and display event list base on selected event
     */
    updateTabContent = data => {
        //console.log(TAG, 'updateTabContent ', data);
        switch (data.i) {
            case 0:
                if (this.state.selected_first_tab) {
                    this.tab2.scrollToFirst();
                } else {
                    this.setState({
                        selected_first_tab: true,
                        selected_second_tab: false,
                         selected_third_tab: false
                    }, () => this.tab2.renderDataAgain(2))
                }
                break;
            case 1:
                if (this.state.selected_second_tab) {
                    this.tab3.scrollToFirst();
                } else {
                    this.setState({
                         selected_first_tab: false,
                        selected_second_tab: true,
                         selected_third_tab: false
                    }, () => this.tab3.renderDataAgain(3))
                }
                break;
            case 2:
                if (this.state.selected_third_tab) {
                    this.tab4.scrollToFirst();
                } else {
                    this.setState({
                         selected_first_tab: false,
                        selected_second_tab: false,
                         selected_third_tab: true
                    }, () => this.tab4.renderDataAgain(4))
                }
                break;
        }
    };

    /**
    * relaod data after delete event
    */
    loadAfterDeletingEvent = (isInvite) => {
        if (this.state.initial_tab == 0) {
            this.tab2.renderDataAgain(2);
        } else if (this.state.initial_tab == 1) {
            this.tab3.renderDataAgain(3);
        } else if (this.state.initial_tab == 2) {
            this.tab4.renderDataAgain(4);
        }
    }

    updateHostEvent = () => {
        console.log('updatehostevent---------->     ', this.tab2, this.tab3, this.tab4);

        if(!this.tab4)
        {
            if(this.scrollableTab)
                this.scrollableTab.goToPage(2);
        }
        this.tab4.getHostedEvents();
    }

    /**
    * auto move to past event tab
    */
    handleAutoTabSelection = (mData) => {

    }

    refreshEventData = (tab_index) => {

    }

}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: "100%",
        height: "100%",
        backgroundColor: Colors.black
    },
});
