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
    Dimensions,
    Text
} from "react-native";
import ScrollableTabView, {
    ScrollableTabBar
} from "react-native-scrollable-tab-view";
import { EventRegister } from 'react-native-event-listeners'
import { ImageCompressor } from './ImageCompressorClass'
import { Colors } from "../consts/Colors";
import TransactionHistory from "./TransactionHistory";
import ChangePassword from "./ChangePassword";
import SavedCards from "./SavedCards";
import Subscription from "./Subscription";
import EmailNotification from "./EmailNotification";
import ViewAlbumRequest from "./ViewAlbumRequest";
import UploadDocument from "./UploadDocument";
import AddCoins from "./AddCoins";
import SellCoins from "./SellCoins";
import MyNotifications from "./MyNotifications";
import CustomBadge from "../components/CustomBadge";
import { Constants } from "../consts/Constants";
import { stylesGlobal, STICKY_HEADER_HEIGHT } from '../consts/StyleSheet';
import HeaderView from "../customview/HeaderView";
import CustomPopupView from "../customview/CustomPopupView";
import NotificationPopupView from "../customview/NotificationPopupView";
import BannerView from "../customview/BannerView";
import AsyncStorage from '@react-native-community/async-storage';


var TAG = "MyAccountScreen";

export default class MyAccountScreen extends React.Component {

    constructor(props) {

        super(props)

        this.state = {
            initialIndex: -1,
            userImagePath: "",
            userImageName: "",
            showModel: false,
            showNotificationModel: false,
            selected_tabindex: -1,
            member_plan: '',
            is_verified: '0',
            email_verified: '0',

            initial_tab: '',
            initial_tab_index: 0,
            current_page: 0,
            searchText: '',

            payment_check_failed: this.props.payment_check_failed,

        }
    }

    async UNSAFE_componentWillMount() {
        if (this.props.initial_tab == "member_plan" || this.props.route.params.initial_tab == "member_plan") {
            this.setState({
                initial_tab_index: 0,
            }, () => {
                this.refs.tab_subscription.resortplans();
            })
        }
        if (this.props.initial_tab == "add_card" || this.props.route.params.initial_tab == "add_card") {
            this.setState({
                initial_tab_index: 4,
            })
        }
        if (this.props.initial_tab == "upload_document" || this.props.route.params.initial_tab == "upload_document") {
            this.setState({
                initial_tab_index: 1,
            })
        }
        if (this.props.initial_tab == "buy_goldcoin" || this.props.route.params.initial_tab == "buy_goldcoin") {
            this.setState({
                initial_tab_index: 2,
            })
        }

       
        if (this.props.initial_tab == "notifications" || this.props.route.params.initial_tab == "notifications") {
            this.setState({
                initial_tab_index: 8,
                // initial_tab_index: 5,
            })
        }
        if (this.props.initial_tab == "view_album_request" || this.props.route.params.initial_tab == "view_album_request") {
            this.setState({
                initial_tab_index: 9,
                // initial_tab_index: 6,
            })
        }

        await this.getData();
        this.listener = EventRegister.addEventListener(Constants.EVENT_PROFILE_IMAGE_UPDATED, () => {
            console.log(TAG, "EVENT_PROFILE_IMAGE_UPDATED event called");
            this.refreshProfileImage();
        })

    }

    componentWillUnmount() {
        EventRegister.removeEventListener(this.listener);
        EventRegister.removeEventListener(this.listenerNotificationChange);
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
            var email_verified = await AsyncStorage.getItem(Constants.KEY_EMAIL_VERIFIED);

            this.setState({
                userId: userId,
                userToken: userToken,
                userSlug: userSlug,
                userImagePath: userImagePath,
                userImageName: userImageName,
                showModel: false,
                member_plan: member_plan,
                is_verified: is_verified,
                email_verified: email_verified
            });


        } catch (error) {
            // Error retrieving data
        }

    };

    move_tab = (index) => {
        this.refs.scrollableTab.goToPage(index)
    }

    render() {
        return (
            <View style={styles.container}>
                <SafeAreaView style={styles.container}>
                    <HeaderView
                        ref="header_view"
                        logoClick={() => this.props.jumpToDashboardTab ? this.props.jumpToDashboardTab() : this.props.navigation.navigate('Dashboard')}
                        screenProps={this.props.navigation}
                        setSearchText={(text) => {
                            if (!this.state.payment_check_failed) {
                                this.setState({ searchText: text })
                            }
                        }}
                        handleEditComplete={() => this.handleEditComplete()}
                        showNotificationPopupView={() => {
                            if (!this.state.payment_check_failed) {
                                this.refs.refNotificationPopupView.getData();
                                this.setState({ showNotificationModel: true })
                            }
                        }}
                        showPopupView={() => {
                            this.setState({ showModel: true })
                        }}
                    />
                    <BannerView screenProps={this.props.navigation} jumpToEventTab={this.props.jumpToEventTab} jumpToTravelTab={this.props.jumpToTravelTab} />
                    <CustomPopupView
                        showModel={this.state.showModel}
                        openMyAccountScreen={this.props.jumpToDashboardTab}
                        logoutUser={this.logoutUser}
                        closeDialog={() => { this.setState({ showModel: false }) }}
                        prop_navigation={this.props.navigation}
                        account_notification={() => this.refs.scrollableTab.goToPage(8)}
                        account_membership={() => this.refs.scrollableTab.goToPage(0)}
                        buy_goldcoin={() => this.refs.scrollableTab.goToPage(2)}
                        payment_check_failed={this.state.payment_check_failed}
                    >
                    </CustomPopupView>
                    <NotificationPopupView
                        ref="refNotificationPopupView"
                        showModel={this.state.showNotificationModel}
                        openNotificationScreen={this.props.jumpToDashboardTab}
                        closeDialog={() => { this.setState({ showNotificationModel: false }) }}
                        prop_navigation={this.props.navigation}
                        account_notification={() => this.refs.scrollableTab.goToPage(8)}
                    >
                    </NotificationPopupView>
                    {this.setUpperTabBar()}
                </SafeAreaView>
            </View>
        );
    }

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
            this.props.navigation.navigate("SignInScreen", { isGettingData: false });
        } catch (error) {
            console.log(TAG + " logoutUser error " + error);
        }
    }


    /**
* handle search button click of keybaord
*/
    handleEditComplete = () => {
        if (!this.state.payment_check_failed) {
            searchText = this.state.searchText.trim();
            this.setState({
                searchText: searchText,
            }, () => {
                if (this.state.searchText.length > 0) {
                    this.props.jumpToSearchTab(this.state.searchText);
                }
            });
        }
    };

    updateTab = (data) => {
        if (data.i == 5) { // transaction history
            if (this.refs.tab_transactionhistory.scrollToTop) {
                this.refs.tab_transactionhistory.scrollToTop();
            }
        } else if (data.i == 8) { // notification
            if (this.refs.tab_notifications.scrollToTop) {
                this.refs.tab_notifications.scrollToTop();
            }
        } else if (data.i == 9) { // view album request
            if (this.refs.tab_viewalbumrequest.scrollToTop) {
                this.refs.tab_viewalbumrequest.scrollToTop();
            }
        }
    }

    setPaymentCheck = async (status) => {
        this.props.setPaymentCheck(status);
        this.setState({
            payment_check_failed: status
        })
    }

    /**
     * display event type tab bar so user can navigate to event types
     */
    setUpperTabBar = () => {
        return (
            <ScrollableTabView
                style={{ height: 50 }}
                tabBarBackgroundColor={Colors.black}
                tabBarActiveTextColor={Colors.gold}
                tabBarTextStyle={stylesGlobal.font}
                selectedTabBarTextStyle={stylesGlobal.font_bold}
                locked={true}
                ref='scrollableTab'
                tabBarUnderlineStyle={{ backgroundColor: Colors.gold }}
                tabBarInactiveTextColor={Colors.gold}
                renderTabBar={() => <ScrollableTabBar tab_select_disable={this.state.payment_check_failed ? true : false} />}
                initialPage={this.state.initial_tab_index}
                onChangeTab={(data) => this.updateTab(data)}
            >
                <Subscription
                    ref="tab_subscription"
                    tabLabel="MEMBERSHIP"
                    screenProps={this.props.navigation}
                    setPaymentCheck={this.setPaymentCheck}
                />
                <UploadDocument
                    ref="tab_uploaddocument"
                    tabLabel="CREDENTIALS"
                    screenProps={this.props.navigation}
                />
                <AddCoins
                    ref="tab_buy_goldcoin"
                    tabLabel="BUY GOLD"
                    screenProps={this.props.navigation}
                />
                <SellCoins
                    ref="tab_sell_goldcoin"
                    tabLabel="SELL GOLD"
                    screenProps={this.props.navigation}
                />
                <SavedCards
                    ref="tab_savedcards"
                    tabLabel="PAYMENT INFO"
                    screenProps={this.props.navigation}
                />
                <TransactionHistory
                    ref="tab_transactionhistory"
                    tabLabel="TRANSACTION HISTORY"
                    screenProps={this.props.navigation}
                />
                <ChangePassword
                    ref="tab_changepassword"
                    tabLabel="CHANGE PASSWORD"
                    screenProps={this.props.navigation}
                />
                <EmailNotification
                    ref="tab_emailnotification"
                    tabLabel="NOTIFICATION SETTINGS"
                    screenProps={this.props.navigation}
                />
                <MyNotifications
                    ref="tab_notifications"
                    tabLabel="NOTIFICATIONS"
                    screenProps={this.props.navigation}
                    move_tab={this.move_tab}
                />
                <ViewAlbumRequest
                    ref="tab_viewalbumrequest"
                    tabLabel="ALBUM VIEW REQUESTS"
                    screenProps={this.props.navigation}
                />
            </ScrollableTabView>
        );
    };

    refreshEventData = (tab_index) => {

    }

}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        // width: "100%",
        // height: "100%",
        backgroundColor: Colors.black
    },
});
