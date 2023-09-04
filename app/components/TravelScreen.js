import React, { Component } from "react";
import {
    Alert,
    StyleSheet,
    SafeAreaView,
} from "react-native";
import ScrollableTabView, {
    ScrollableTabBar
} from "react-native-scrollable-tab-view";
import { EventRegister } from 'react-native-event-listeners'
import { ImageCompressor } from './ImageCompressorClass'
import ActionButton from "react-native-action-button";
import { Colors } from "../consts/Colors";
import EventListScreen from "./EventListScreen";
import { Constants } from "../consts/Constants";
import { stylesGlobal, STICKY_HEADER_HEIGHT } from '../consts/StyleSheet';
import HeaderView from "../customview/HeaderView";
import CustomPopupView from "../customview/CustomPopupView";
import NotificationPopupView from "../customview/NotificationPopupView";
import ProgressIndicator from "./ProgressIndicator";
import BannerView from "../customview/BannerView";
import AsyncStorage from '@react-native-community/async-storage';
import Memory from '../core/Memory';
import * as Global from "../consts/Global";
import WebService from "../core/WebService";

var TAG = "TravelScreen";
var isFirsTime = true;

export default class TravelScreen extends React.Component {

    constructor(props) {
        isFirsTime = true;
        super(props)

        this.state = {
            loading: false,
            initialIndex: -1,
            userImagePath: "",
            userImageName: "",
            showModel: false,
            showNotificationModel: false,
            member_plan: '',
            is_verified: '0',
            searchText: '',
            initial_tab: this.props.currentTripType == -1 ? 0 : this.props.currentTripType,
            origin_init_tab_index: this.props.currentTripType == -1 ? -1 : this.props.currentTripType,
            selected_first_tab: false,
            selected_second_tab: false,
            selected_third_tab: false,
        }

    }

    UNSAFE_componentWillMount() {
        this.getData();
        this.listener = EventRegister.addEventListener(Constants.EVENT_PROFILE_IMAGE_UPDATED, () => {
            console.log(TAG,"EVENT_PROFILE_IMAGE_UPDATED event called");
            this.refreshProfileImage();
        });

        
    }
    componentWillUnmount() {
        EventRegister.removeEventListener(this.listener)
    }
    /**
       * get async storage data
       */
    getData = async () => {
        try {
            let userId = await AsyncStorage.getItem(Constants.KEY_USER_ID);
            let userToken = await AsyncStorage.getItem(Constants.KEY_USER_TOKEN);
            let userSlug = await AsyncStorage.getItem(Constants.KEY_USER_SLUG);
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
            console.log(error)
        }
    };
    

    configure_startup_category = async() => {
        var userId = await AsyncStorage.getItem(Constants.KEY_USER_ID);
        var userToken = await AsyncStorage.getItem(Constants.KEY_USER_TOKEN);
        this.setState({
            userId: userId,
            userToken: userToken,
        }, () => this.setInitCategory());

    }

    setInitCategory = async() => {
        if(this.state.origin_init_tab_index == -1) {
            this.callInitialCategory();
        } else {
            this.scrollableTab.goToPage(this.state.origin_init_tab_index);
            if(this.state.origin_init_tab_index == 0) {
                this.tab2.scrollToFirst();
            } else if(this.state.origin_init_tab_index == 1) {
                this.tab3.scrollToFirst();
            } else if(this.state.origin_init_tab_index == 2) {
                this.tab4.scrollToFirst(); 
            }
        }
    }

    setInitialTabIndex = (index) => {
        // this.setState({
        //     initial_tab: index
        // }, () => {
        //     setTimeout( () => {
        //         if(this.scrollableTab != undefined) {
        //             this.scrollableTab.goToPage(index)
        //         }
        //     }, 100);
        // })
        this.interVal = undefined;
        setTimeout(() => {
            if(!this.state.is_got) this.setInitialTabIndex(index);
            else{
                if ((this.state.member_plan == '4' || this.state.member_plan == '7' || this.state.member_plan == '8' || this.state.is_verified != "1")) {
                    index = 0;
                } 

                this.setState({ initial_tab: index, origin_init_tab_index: index }, () => {
                    setTimeout(() => {
                        if (this.scrollableTab != undefined) {
                            console.log('moving page =====> ', index);
                            this.scrollableTab.goToPage(index)
                        }
                    }, 300);
                });

                
            }
        }, 1000);

    }

    callInitialCategory = () => {
        try {
            
            this.setState({
                loading: true
            })
            
            let uri = Memory().env == "LIVE" ? Global.URL_DETERMINE_CATEGORY_TRAVEL : Global.URL_DETERMINE_CATEGORY_TRAVEL_DEV;
            let params = new FormData();
            params.append("token", this.state.userToken);
            params.append("user_id", this.state.userId);
            params.append("format", "json");            
            console.log(TAG + " callInitialCategoryAPI uri " + uri);
            console.log(TAG + " callInitialCategoryAPI params " + JSON.stringify(params));

            WebService.callServicePost( uri, params, this.handleInitialCategoryResponse );
        } catch (error) {
            console.log(error)
            this.setState({
                loading: false,
            })
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    }

    handleInitialCategoryResponse = (response, isError) => {
        // console.log(TAG + " callInitialCategoryAPI result " + JSON.stringify(response));
        console.log(TAG + " callInitialCategoryAPI isError " + isError);

        if (!isError) {
            var result = response;
            if(result.status == "success") {
                if(result.data.tab_index == 1 || result.data.tab_index == 2) {
                    this.setState({
                        initial_tab: 0,
                        origin_init_tab_index: 0,
                    })
                } else if(result.data.tab_index == 3) {
                    this.setState({
                        initial_tab: 1,
                        origin_init_tab_index: 1
                    })
                } else if(result.data.tab_index == 4) {
                    this.setState({
                        initial_tab: 2,
                        origin_init_tab_index: 2
                    })
                }
                this.setState({
                    loading: false,
                    selected_first_tab: false,
                    selected_second_tab: false,
                    selected_third_tab: false,
                }, () => {
                    if(this.state.initial_tab == 0) {
                        this.setState({
                            selected_first_tab: true,
                            selected_second_tab: false,
                            selected_third_tab: false,
                        }, () =>this.tab2.renderDataAgain(2));
                    } else if(this.state.initial_tab == 1) {
                        this.setState({
                             selected_first_tab: false,
                            selected_second_tab: true,
                            selected_third_tab: false,
                        }, () => this.tab3.renderDataAgain(3));
                    } else if(this.state.initial_tab == 2) {
                        this.setState({
                            selected_first_tab: false,
                            selected_second_tab: false,
                            selected_third_tab: true,
                        }, () => this.tab4.renderDataAgain(4));
                    } 
                })
            } else {
                this.setState({
                    loading: false,
                })
            }
        } else {
            if (response != undefined && response != null && response.length > 0) {
                Alert.alert(response.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
            
            this.setState({
                loading: false,
            })
        }
        
    }
        
    render() {
        return (
            <SafeAreaView style={styles.container}>
                <HeaderView
                    ref = "header_view"
                    logoClick = {() => this.props.jumpToDashboardTab()}
                    screenProps = {this.props.rootNavigation}
                    setSearchText = {(text) => this.setState({searchText: text})}
                    handleEditComplete = {() => this.handleEditComplete()}
                    showNotificationPopupView = {() => { this.refNotificationPopupView.getData(); this.setState({ showNotificationModel: true }) }}
                    showPopupView = {() => this.setState({ showModel: true })}
                />
                <BannerView screenProps = {this.props.rootNavigation} jumpToEventTab={this.props.jumpToEventTab} jumpToTravelTab={this.props.jumpToTravelTab} />
                <CustomPopupView
                    showModel = {this.state.showModel}
                    openMyAccountScreen = {this.props.jumpToDashboardTab}
                    closeDialog={() => { this.setState({ showModel: false }) }}
                    prop_navigation = {this.props.rootNavigation}
                >
                </CustomPopupView>
                <NotificationPopupView
                    ref={ref => this.refNotificationPopupView = ref}
                    // ref = "refNotificationPopupView"
                    showModel = {this.state.showNotificationModel}
                    openNotificationScreen = {this.props.jumpToDashboardTab}
                    closeDialog={() => { this.setState({ showNotificationModel: false }) }}
                    prop_navigation = {this.props.rootNavigation}
                >
                </NotificationPopupView>
            {
                !this.state.loading && this.setUpperTabBar()
            }
            {
                this.state.loading && <ProgressIndicator/>
            }
            {
                this.state.member_plan != '4' && this.state.member_plan != '7' && this.state.member_plan != '8' && this.state.is_verified == "1" && 
                this.showUploadButton()
            }
            </SafeAreaView>
        );
    }

    /**
        * get profile info API again
        */
       getDataAgain = (refresh) => {
        if (refresh) {
            this.getData();
        }
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
            
            this.props.rootNavigation.navigate("SignInScreen", {isGettingData: false});
        } catch (error) {
            console.log(TAG + " logoutUser error " + error);
        }
    }

    hidePopupView = () => {
        this.setState({
            showModel: false
        })
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
                onPress={() =>
                    this.goToCreateEventScreen()
                }
            />
        );
    }


    updateHostEvent = () => {
        this.tab4.getHostedEvents();
    }

    /**
     *  Go to Create Event Scren
     *
     */
    goToCreateEventScreen = () => {
        this.props.rootNavigation.navigate("CreateTravelScreen", {
            user_id: this.state.userId,
            token: this.state.userToken,
            data: null,
            isCopy: false,
            loadAfterDeletingEvent: this.loadAfterDeletingEvent,
            updateHostEvent: this.updateHostEvent,
            type: 'create_event'
        })
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
        //console.log('upper tab bar ', this.state.is_verified);
        return (
            <ScrollableTabView
                style={{ height: 50 }}
                tabBarBackgroundColor={Colors.black}
                tabBarActiveTextColor={Colors.gold}
                tabBarTextStyle = {stylesGlobal.font}
                selectedTabBarTextStyle = {stylesGlobal.font_bold}
                locked={true}
                ref={ref => this.scrollableTab = ref}
                tabBarUnderlineStyle={{ backgroundColor: Colors.gold }}
                tabBarInactiveTextColor={Colors.gold}
                onChangeTab={(data) => this.updateTabContent(data)}
                renderTabBar={() => <ScrollableTabBar />}
                initialPage = {this.state.initial_tab}
                // page={this.props.currentTripType == -1 ? this.state.initial_tab : this.props.currentTripType}
            >
                <EventListScreen
                    ref={ref => this.tab2 = ref}
                    tabLabel="MEMBER TRIPS"
                    screenProps={this.props.rootNavigation}
                    funcTabSelection={this.handleAutoTabSelection}
                    type={2}
                    loadAfterDeletingEvent={this.loadAfterDeletingEvent}
                    goToCreateEventScreen={this.goToCreateEventScreen}
                    refreshEventData={this.refreshEventData}
                    EventCategory="travel"
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
                    EventCategory="travel"
                />
            {
                this.state.member_plan != '4' && this.state.member_plan != '7' && this.state.member_plan != '8' && this.state.is_verified == "1" && 
                <EventListScreen
                    ref={ref => this.tab4 = ref}
                    tabLabel="HOSTED TRIPS"
                    screenProps={this.props.rootNavigation}
                    funcTabSelection={this.handleAutoTabSelection}
                    type={4}
                    loadAfterDeletingEvent={this.loadAfterDeletingEvent}
                    goToCreateEventScreen={this.goToCreateEventScreen}
                    refreshEventData={this.refreshEventData}
                    EventCategory="travel"
                />
            }
            </ScrollableTabView>
        );
    };

    /**
     * refresh tab content and display event list base on selected event
     */
    updateTabContent = data => {
        console.log(TAG, 'updateTabContent');
        switch (data.i) {
            case 0:
                if(this.state.selected_first_tab) {
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
                if(this.state.selected_second_tab) {
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
                if(this.tab4)
                {
                    if(this.state.selected_third_tab) {
                        this.tab4.scrollToFirst();
                    } else {
                        this.setState({
                            selected_first_tab: false,
                            selected_second_tab: false,
                            selected_third_tab: true
                        }, () => this.tab4.renderDataAgain(4))
                    }
                }
                
            break;
        }
    };

    /**
   * relaod data after delete event
   */
    loadAfterDeletingEvent = (isInvite) => {
        if(this.state.initial_tab == 0) {
            this.tab2.renderDataAgain(2);
        } else if(this.state.initial_tab == 1) {
            this.tab3.renderDataAgain(3);
        } else if(this.state.initial_tab == 2) {
            this.tab4.renderDataAgain(4);
        }
    }


    /**
   * auto move to past event tab
   */
    handleAutoTabSelection = (mData) => {
        // if (mData != undefined && mData != null) {
        //     if (isFirsTime) {
        //         isFirsTime = false;
        //         if (mData.length == 0) {
        //             this.setState({
        //                 initialIndex: 2,
        //             })
        //         }
        //     }
        // }
    }

    refreshEventData=(isRefresh)=>{

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
