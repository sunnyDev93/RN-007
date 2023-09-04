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
import { Constants } from "../consts/Constants";
import { stylesGlobal, STICKY_HEADER_HEIGHT } from '../consts/StyleSheet';
import CustomPopupView from "../customview/CustomPopupView";
import BannerView from "../customview/BannerView";
import AsyncStorage from '@react-native-community/async-storage';

import MyListsScreen from "./MyListsScreen";
import MyListFavoriteMember from "./MyListFavoriteMember";
import MyListFavoriteToMe from "./MyListFavoriteToMe";
import MyListRoseSent from "./MyListRoseSent";
import MyListRoseReceived from "./MyListRoseReceived";
import MyListGiftSent from "./MyListGiftSent";
import MyListGiftReceived from "./MyListGiftReceived";
import MyListGiftPurchased from "./MyListGiftPurchased";
import MyListWishList from "./MyListWishList";
import MyListFollow from "./MyListFollow";
import MyListVisitedProfile from "./MyListVisitedProfile";


var { height, width } = Dimensions.get('window');

var TAG = "MyListsNavigation";

export default class MyListsNavigation extends React.Component {

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
            eventId: false,
            is_MyListFavoriteMemberFlag: true,
        }
    }

    async UNSAFE_componentWillMount() {
        if (this.props.route.params != null) {
            if (this.props.route.params.list_show == "rose_sent") {
                this.setState({
                    initial_tab_index: 3,
                    current_page: 3,
                })
            }
            if (this.props.route.params.list_show == "rose_received") {
                this.setState({
                    initial_tab_index: 4,
                    current_page: 4,
                })
            }
            if (this.props.route.params.list_show == "favorite") {
                this.setState({
                    initial_tab_index: 1,
                    current_page: 1,
                })
            }
            if (this.props.route.params.list_show == "favorited_me") {
                this.setState({
                    initial_tab_index: 2,
                    current_page: 2,
                })
            }
            if (this.props.route.params.list_show == "fan" || this.props.route.params.list_show == "following") {
                this.setState({
                    initial_tab_index: 9,
                    current_page: 9,
                })
            }
            if (this.props.route.params.list_show == "mygift") {
                this.setState({
                    initial_tab_index: 7,
                    current_page: 7,
                })
            }
            if (this.props.route.params.list_show == "gift_sent") {
                this.setState({
                    initial_tab_index: 5,
                    current_page: 5,
                })
            }
            if (this.props.route.params.list_show == "gift_received") {
                this.setState({
                    initial_tab_index: 6,
                    current_page: 6,
                })
            }
            this.setState({ eventId: this.props.route.params.eventId });
        }
        await this.getData();
        this.listener = EventRegister.addEventListener(Constants.EVENT_PROFILE_IMAGE_UPDATED, () => {
            console.log(TAG, "EVENT_PROFILE_IMAGE_UPDATED event called");
            this.refreshProfileImage();
        })

    }

    componentWillUnmount() {
        EventRegister.removeEventListener(this.listener);
        this.setState({
            current_page: 0, 
            showModel: false,
            selected_tabindex: -1,
            initial_tab: '',
            initial_tab_index: 0,
        });
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
            if ((member_plan != "4" && member_plan != "7" && member_plan != "8" && is_verified == "1") || (member_plan == "4" || member_plan == "7" || member_plan == "8")) {
                this.setState({is_MyListFavoriteMemberFlag: true});
            }
            this.setState({
                userId: userId,
                userToken: userToken,
                userSlug: userSlug,
                userImagePath: userImagePath,
                userImageName: userImageName,
                showModel: false,
                member_plan: member_plan,
                is_verified: is_verified,
                email_verified: email_verified,

            });

        } catch (error) {
            // Error retrieving data
        }

    };

    render() {
        return (
            <View style={[styles.container, { backgroundColor: Colors.white }]}>
                <SafeAreaView style={styles.container}>
                    {this.renderHeaderView()}
                    {this.renderBannerView()}
                    {this.setUpperTabBar()}
                    {this.renderPopupView()}
                </SafeAreaView>
            </View>
        );
    }

    renderBannerView = () => {
        return (
            <BannerView
                screenProps={this.props.navigation}
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
            this.props.navigation.navigate('Dashboard', { selected_screen: "members", search_text: searchText });
        }
    };

    /**
     * display event type tab bar so user can navigate to event types
     */
    setUpperTabBar = () => {
        return (
            <ScrollableTabView
                style={{ height: 50 }}
                tabBarBackgroundColor={Colors.black}
                tabBarActiveTextColor={Colors.gold}
                // tabBarTextStyle={stylesGlobal.font}
                selectedTabBarTextStyle={stylesGlobal.font_bold}
                locked={true}
                ref='scrollableTab'
                tabBarUnderlineStyle={{ backgroundColor: Colors.gold }}
                tabBarInactiveTextColor={this.state.eventId ? Colors.gray : Colors.gold}
                renderTabBar={() => 
                    <ScrollableTabBar 
                        tab_select_disable={this.state.eventId ? true : false} 
                    />
                }
                initialPage={this.state.initial_tab_index}
                onChangeTab={(index_obj) => {
                   // console.log( TAG, "onChangeTab event index_obj : ", index_obj );
                }}
            >
                <MyListsScreen
                    tabLabel="FRIEND LISTS"
                    screenProps={this.props.navigation}
                    list_show={this.props.route.params.list_show}
                    invite_guest={this.props.route.params.invite_guest}
                    eventId={this.props.route.params.eventId}
                    inviteList={this.props.route.params.inviteList}
                />

                { 
                    this.state.is_MyListFavoriteMemberFlag && 
                    <MyListFavoriteMember
                        tabLabel="MY FAVORITES"
                        screenProps={this.props.navigation}
                    />
                }

                <MyListFavoriteToMe
                    tabLabel="FAVORITED ME"
                    screenProps={this.props.navigation}
                />
                <MyListRoseSent
                    tabLabel="ROSES SENT"
                    screenProps={this.props.navigation}
                />
                <MyListRoseReceived
                    tabLabel="ROSES RECEIVED"
                    screenProps={this.props.navigation}
                />
                <MyListGiftSent
                    tabLabel="GIFTS SENT"
                    screenProps={this.props.navigation}
                />
                <MyListGiftReceived
                    tabLabel="GIFTS RECEIVED"
                    screenProps={this.props.navigation}
                />
                <MyListGiftPurchased
                    tabLabel="GIFTS PURCHASED"
                    screenProps={this.props.navigation}
                />
                <MyListWishList
                    tabLabel="MY WISH LIST"
                    screenProps={this.props.navigation}
                />
                <MyListFollow
                    tabLabel={(this.state.member_plan.toString() == "4" || this.state.member_plan.toString() == "7") ? "MY FOLLOWING" : "MY FOLLOWERS"}
                    screenProps={this.props.navigation}
                />
                <MyListVisitedProfile
                    tabLabel="VISITED MY PROFILE"
                    screenProps={this.props.navigation}
                />
            </ScrollableTabView>
        );
    };

    /**
     * refresh tab content and display event list base on selected event
     */
    updateTabContent = data => {
        console.log(data);
        // switch (data.i) {
        //     case 0:
        //         // this.refs.tab2.renderDataAgain(2);
        //         this.setState({
        //             initialIndex: 0,
        //         })
        //         break;
        //     case 1:
        //         // this.refs.tab3.renderDataAgain(3);
        //         this.setState({
        //             initialIndex: 1,
        //         })
        //         break;
        //     case 2:
        //         this.refs.tab_savedcards.getData();
        //         this.setState({
        //             initialIndex: 2,
        //         })
        //         break;
        // }
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
