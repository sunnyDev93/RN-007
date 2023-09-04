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
// import SellGoldCoinNavigator from "./SellGoldCoinNavigator";
import SellCoins from "./SellCoins";
import MyNotifications from "./MyNotifications";
import CustomBadge from "../components/CustomBadge";
import { Constants } from "../consts/Constants";
import { stylesGlobal, STICKY_HEADER_HEIGHT } from '../consts/StyleSheet';
import CustomPopupView from "../customview/CustomPopupView";
import BannerView from "../customview/BannerView";
import AsyncStorage from '@react-native-community/async-storage';

var {height, width} = Dimensions.get('window');

var TAG = "MyAccountScreen";

export default class MyAccountScreen extends React.Component {

    constructor(props) {
        
        super(props)

        this.state = {
            initialIndex: -1,
            userImagePath: "",
            userImageName: "",
            showModel: false,
            selected_tabindex: -1,
            member_plan: '',
            is_verified: '0',
            email_verified: '0',

            initial_tab: '',
            initial_tab_index: 0,
            current_page: 0,
            searchText: '',

            notificationCount: {
                post: "0",
                member: "0",
                event: "0",
                travel: "0",
                gift: "0",
                chat: "0",
            },
        }
    }

    async UNSAFE_componentWillMount() {
        if(this.props.route.params != null) {
            if(this.props.route.params.initial_tab == "add_card") {
                this.setState({
                    initial_tab_index: 4,
                })
            }
            if(this.props.route.params.initial_tab == "upload_document") {
                this.setState({
                    initial_tab_index: 1,
                })
            }
            if(this.props.route.params.initial_tab == "buy_goldcoin") {
                this.setState({
                    initial_tab_index: 2,
                })
            }
            if(this.props.route.params.initial_tab == "notifications") {
                this.setState({
                    initial_tab_index: 8,
                    // initial_tab_index: 5,
                })
            }
            if(this.props.route.params.initial_tab == "view_album_request") {
                this.setState({
                    initial_tab_index: 9,
                    // initial_tab_index: 6,
                })
            }
        }

        await this.getData();
        this.listener = EventRegister.addEventListener(Constants.EVENT_PROFILE_IMAGE_UPDATED, () => {
            console.log(TAG,"EVENT_PROFILE_IMAGE_UPDATED event called");
            this.refreshProfileImage();
        })

        this.listenerNotificationChange = EventRegister.addEventListener(Constants.EVENT_NOTIFICATION_CHANGED, async() => {
            console.log(TAG, "notification is changed notification is changed notification is changed notification is changed notification is changed notification is changed");
            this.getnotificaion()
        })

    }

    componentDidMount() {
        this.getnotificaionListener = this.props.navigation.addListener('willFocus', this.init_notification.bind(this));
    }

    init_notification() {
        this.getnotificaion();
    }

    getnotificaion = async() => {
        try {
            let post_count = await AsyncStorage.getItem('POST');
            let member_count = await AsyncStorage.getItem('MEMBER');
            let event_count = await AsyncStorage.getItem('EVENT');
            let travel_count = await AsyncStorage.getItem('TRAVEL');
            let gift_count = await AsyncStorage.getItem('GIFT');
            let chat_count = await AsyncStorage.getItem('CHAT');

            const notificationCount = {
                post: post_count,
                member: member_count,
                event: event_count,
                travel: travel_count,
                gift: gift_count,
                chat: chat_count
            };
            this.setState({notificationCount});
        } catch(error) {

        }
    }

    componentWillUnmount() {
        EventRegister.removeEventListener(this.listener);
        EventRegister.removeEventListener(this.listenerNotificationChange);
        this.getnotificaionListener();
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
        this.setState({
            initial_tab_index: index,
            current_page: index,
        })
    }

    render() {
        return (
            <View style={styles.container}>
                <SafeAreaView style={styles.container}>
                {this.renderHeaderView()}
                {this.renderBannerView()}
                {this.setUpperTabBar()}
                {this.renderPopupView()}
                </SafeAreaView>
                <View style = {stylesGlobal.tab_bar_view}>
                    <TouchableOpacity style = {{justifyContent: 'center', alignItems: 'center'}} onPress = {() => this.props.navigation.navigate('Dashboard', {selected_screen: "dashboard"})}>
                        <Image source={require("../icons/ic_tab_dashbord.png")} resizeMode = "contain"
                            style={stylesGlobal.tab_icon}
                        />
                        <Text style = {{fontSize: 9, color: Colors.gold, marginTop: 5}}>DASHBOARD</Text>
                        {/* <CustomBadge style = {{position: 'absolute', top: 0, right: 0}}>{this.state.notificationCount.post.toString() != "0" ? this.state.notificationCount.post.toString() : ""}</CustomBadge> */}
                    </TouchableOpacity>
                    <TouchableOpacity style = {{justifyContent: 'center', alignItems: 'center'}} onPress = {() => this.props.navigation.navigate('Dashboard', {selected_screen: "members"})}>
                        <Image source={require("../icons/ic_tab_connect.png")} resizeMode = "contain"
                            style={stylesGlobal.tab_icon}
                        />
                        <Text style = {{fontSize: 9, color: Colors.gold, marginTop: 5}}>MEMBERS</Text>
                        {/* <CustomBadge style = {{position: 'absolute', top: 0, right: 0}}>{this.state.notificationCount.member.toString() != "0" ? this.state.notificationCount.member.toString() : ""}</CustomBadge> */}
                    </TouchableOpacity>
                    <TouchableOpacity style = {{justifyContent: 'center', alignItems: 'center'}} onPress = {() => this.props.navigation.navigate('Dashboard', {selected_screen: "event"})}>
                        <Image source={require("../icons/ic_tab_events.png")} resizeMode = "contain"
                            style={stylesGlobal.tab_icon}
                        />
                        <Text style = {{fontSize: 9, color: Colors.gold, marginTop: 5}}>PARTIES</Text>
                        {/* <CustomBadge style = {{position: 'absolute', top: 0, right: 0}}>{this.state.notificationCount.event.toString() != "0" ? this.state.notificationCount.event.toString() : ""}</CustomBadge> */}
                    </TouchableOpacity>
                    <TouchableOpacity style = {{justifyContent: 'center', alignItems: 'center'}} onPress = {() => this.props.navigation.navigate('Dashboard', {selected_screen: "travel"})}>
                        <Image source={require("../icons/ic_tab_travel.png")} resizeMode = "contain"
                            style={[stylesGlobal.tab_icon, {width: 30}]}
                        />
                        <Text style = {{fontSize: 9, color: Colors.gold, marginTop: 5}}>TRAVEL</Text>
                        <CustomBadge style = {{position: 'absolute', top: 0, right: 0}}>{this.state.notificationCount.travel.toString() != "0" ? this.state.notificationCount.travel.toString() : ""}</CustomBadge>
                    </TouchableOpacity>
                    <TouchableOpacity style = {{justifyContent: 'center', alignItems: 'center'}} onPress = {() => this.props.navigation.navigate('Dashboard', {selected_screen: "gift"})}>
                        <Image source={require("../icons/ic_tab_gift.png")} resizeMode = "contain"
                            style={stylesGlobal.tab_icon}
                        />
                        <Text style = {{fontSize: 9, color: Colors.gold, marginTop: 5}}>GIFTS</Text>
                        {/* <CustomBadge style = {{position: 'absolute', top: 0, right: 0}}>{this.state.notificationCount.gift.toString() != "0" ? this.state.notificationCount.gift.toString() : ""}</CustomBadge> */}
                    </TouchableOpacity>
                    <TouchableOpacity style = {{justifyContent: 'center', alignItems: 'center'}} onPress = {() => this.props.navigation.navigate('Dashboard', {selected_screen: "chat"})}>
                        <Image source={require("../icons/ic_tab_messages.png")} resizeMode = "contain"
                            style={stylesGlobal.tab_icon}
                        />
                        <Text style = {{fontSize: 9, color: Colors.gold, marginTop: 5}}>CHAT</Text>
                        {/* <CustomBadge style = {{position: 'absolute', top: 0, right: 0}}>{this.state.notificationCount.chat.toString() != "0" ? this.state.notificationCount.chat.toString() : ""}</CustomBadge> */}
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    renderBannerView = () => {
        return (
            <BannerView
                screenProps = {this.props.navigation}
            />
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
                openProfileScreen={this.openProfileScreen}
                logoutUser={this.logoutUser}
                closeDialog={() => { this.setState({ showModel: false }) }}
                screenProps={() => {
                    this.hidePopupView();
                }}
                // account_notification = {() => this.setState({current_page: 8})}
                // account_membership = {() => this.setState({current_page: 0})}
                // buy_goldcoin = {() => this.setState({current_page: 2})}
                account_notification = {() => this.refs.scrollableTab.goToPage(8)}
                account_membership = {() => this.refs.scrollableTab.goToPage(0)}
                buy_goldcoin = {() => this.refs.scrollableTab.goToPage(2)}
                prop_navigation = {this.props.navigation}
            >
            </CustomPopupView>
        )
    }

    openProfileScreen = () => {
        this.hidePopupView()
        this.props.navigation.navigate("MyProfile", {
            refreshProfileImage: this.refreshProfileImage,
        })
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
            this.props.navigation.navigate("SignInScreen", {isGettingData: false});
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
                        placeholder="Search members..."
                        onSubmitEditing={this.handleEditComplete}
                        keyboardType='ascii-capable'
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

                <TouchableOpacity style={stylesGlobal.header_avatarview_style} onPress={() => this.showPopupView()}>
                    <View style={stylesGlobal.header_avatarsubview_style}>
                        <ImageCompressor style = {stylesGlobal.header_avatar_style} uri={imageUrl}/>
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
            this.props.rootNavigation.navigate('Dashboard', {selected_screen: "members", search_text: searchText});
        }
    };

    updateTab = (data) => {
        
        if(data.i == 5) { // transaction history
            if(this.refs.tab_transactionhistory.scrollToTop) {
                console.log("============")
                this.refs.tab_transactionhistory.scrollToTop();
            }
        } else if(data.i == 8) { // notification
            if(this.refs.tab_notifications.scrollToTop) {
                console.log("============")
                this.refs.tab_notifications.scrollToTop();
            }
        } else if(data.i == 9) { // view album request
            if(this.refs.tab_viewalbumrequest.scrollToTop) {
                console.log("============")
                this.refs.tab_viewalbumrequest.scrollToTop();
            }
        }
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
                tabBarTextStyle = {stylesGlobal.font}
                selectedTabBarTextStyle = {stylesGlobal.font_bold}
                locked={true}
                ref='scrollableTab'
                tabBarUnderlineStyle={{ backgroundColor: Colors.gold }}
                tabBarInactiveTextColor={Colors.gold}
                renderTabBar={() => <ScrollableTabBar />}
                initialPage = {this.state.initial_tab_index}
                onChangeTab = {(data) => this.updateTab(data)}
            >
                <Subscription
                    ref="tab_subscription"
                    tabLabel="MEMBERSHIP"
                    screenProps={this.props.navigation}
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
                    move_tab = {this.move_tab}
                />
                <ViewAlbumRequest
                    ref="tab_viewalbumrequest"
                    tabLabel="ALBUM VIEW REQUESTS"
                    screenProps={this.props.navigation}
                />
            </ScrollableTabView>
        );
    };

    refreshEventData=(tab_index)=>{

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
