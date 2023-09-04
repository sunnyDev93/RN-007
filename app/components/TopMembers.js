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
    Dimensions
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
import BannerView from "../customview/BannerView";
import AsyncStorage from '@react-native-community/async-storage';
import ScrollableTabView, {
    ScrollableTabBar
} from "react-native-scrollable-tab-view";
import TopVirtualWealth from "./TopVirtualWealth";
import TopRealWealth from "./TopRealWealth";
import TopRoseReceived from "./TopRoseReceived";
import TopFollowed from "./TopFollowed";

var {height, width} = Dimensions.get('window');

var TAG = "TopMembers";

export default class TopMembers extends React.Component {

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

            loading: false,
        }
    }

    UNSAFE_componentWillMount() {
        this.getData();
        this.listener = EventRegister.addEventListener(Constants.EVENT_PROFILE_IMAGE_UPDATED, () => {
            console.log(TAG,"EVENT_PROFILE_IMAGE_UPDATED event called");
            this.refreshProfileImage();
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
            });
        } catch (error) {
            // Error retrieving data
        }
    };


    renderBannerView = () => {
        return (
            <BannerView
                screenProps = {this.props.navigation}
            />
        )
    }

    setUpperTabBar = () => {
        return (
            <ScrollableTabView
                style={{ height: 50 }}
                tabBarBackgroundColor={Colors.black}
                tabBarTextStyle = {stylesGlobal.font}
                selectedTabBarTextStyle = {stylesGlobal.font_bold}
                tabBarActiveTextColor={Colors.gold}
                locked={true}
                ref='scrollableTab'
                tabBarUnderlineStyle={{ backgroundColor: Colors.gold }}
                tabBarInactiveTextColor={Colors.gold}
                renderTabBar={() => <ScrollableTabBar />}
                initialPage = {0}
                // page={this.props.currentEventType == -1 ? this.state.initial_tab : this.props.currentEventType}
            >
                <TopVirtualWealth
                    ref="tab2"
                    tabLabel="TOP VIRTUAL WEALTH"
                    navigation={this.props.navigation}
                />
                <TopRealWealth
                    ref="tab2"
                    tabLabel="TOP REAL WEALTH"
                    navigation={this.props.navigation}
                />
                <TopRoseReceived
                    ref="tab2"
                    tabLabel="TOP ROSES RECEIVED"
                    navigation={this.props.navigation}
                />
                <TopFollowed
                    ref="tab2"
                    tabLabel="TOP FOLLOWERS"
                    navigation={this.props.navigation}
                />
            </ScrollableTabView>
        );
    };

    render() {
        return (
            <SafeAreaView style={styles.container}>
            {
                this.state.loading && <ProgressIndicator/>
            }
                {this.renderHeaderView()}
                {this.renderBannerView()}
                {this.renderPopupView()}
                {this.setUpperTabBar()}
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
    /** render PopUp Menu
    *
    * @returns {*}
    */

    renderPopupView = () => {
        return (
            <CustomPopupView
                showModel={this.state.showModel}
                openMyAccountScreen={(show_myaccount, myaccount_initial_tab) => {this.props.navigation.navigate('Dashboard', {selected_screen: "myaccount", myaccount_initial_tab: myaccount_initial_tab})}}
                logoutUser={this.logoutUser}
                closeDialog={() => { this.setState({ showModel: false }) }}
                prop_navigation = {this.props.navigation}
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
                        <Image
                            style = {stylesGlobal.header_searchicon_style}
                            source={require("../icons/connection-delete.png")}
                        />
                    }
                    {
                        this.state.searchText == "" &&
                        <Image
                            style = {stylesGlobal.header_searchicon_style}
                            source={require("../icons/dashboard_search.png")}
                        />
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

}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: "100%",
        height: "100%",
        backgroundColor: Colors.black
    },
    cardView: {
        width: width * 0.8,
        backgroundColor: Colors.white,
        margin: 12, //cardMargin,
        borderRadius: 10,
        paddingTop:5,
        paddingBottom:20,
        paddingHorizontal:10,
        shadowColor: Colors.white,
        shadowOffset: {
            width: 0,
            height: 0
        },
        shadowRadius: 7,
        shadowOpacity: 7.0
    },
    person_view: {
        width: '100%',
        height: 100,
        borderRadius: 5,
        backgroundColor: Colors.white,
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        marginBottom: 10
    },
    seal_view: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute', 
        left: 0, 
        right: 0
    },
    component_text: {
        fontSize: 13,
        color: Colors.black,
    },
    coin_view: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    fitImage: {
        borderRadius: 10,
        width: width * 0.9 * 0.3 - 20,
        height: width * 0.8 - 20,
        overflow: 'hidden',
        // backgroundColor: Colors.gray,
        aspectRatio: 1
    },
    fitImageView: {
        borderRadius: 10,
        borderColor: Colors.white,
        borderWidth: 3,
        overflow: 'hidden',
        aspectRatio: 1
    },
    toplist_title: {
        color: Colors.black,
        fontSize: 16,
        fontWeight: '600'
    },
    empty_text: {
        color: Colors.black,
        fontSize: 14,
        textAlign: "center"
    },
});
