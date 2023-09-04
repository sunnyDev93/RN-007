import React from 'react';
import {
    StyleSheet, Text, View, Modal, TextInput, TouchableOpacity,
    ActivityIndicator, Platform, KeyboardAvoidingView, Dimensions, Image, Keyboard,
    TouchableWithoutFeedback, Alert, Linking
} from 'react-native';
import { EventRegister } from 'react-native-event-listeners';
import AsyncStorage from '@react-native-community/async-storage';
import PushNotificationIOS from '@react-native-community/push-notification-ios';
import Icon from 'react-native-vector-icons/Feather'

import { ImageCompressor } from '../components/ImageCompressorClass';
import { Constants } from "../consts/Constants";
import { Colors } from "../consts/Colors";
import { stylesGlobal } from "../consts/StyleSheet";
import * as GlobalStyleSheet from "../consts/StyleSheet";
import WebService from "../core/WebService";
import * as Global from "../consts/Global";
import Memory from '../core/Memory';
import CustomBadge from "../components/CustomBadge";


const imageWidth = 60;
const isIos = Platform.OS === 'ios'
const { width, height } = Dimensions.get("window")
const isIphoneX = isIos && (Dimensions.get('window').height === 812 || Dimensions.get('window').height === 896);
var myProfileData;
var containerWidth = isIphoneX ? width / 1.7 : width / 1.8
var TAG = "HeaderView"

export default class HeaderView extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            userFirstName: "",
            userLastName: "",
            userImagePath: "",
            userImageName: "",
            userId: "",
            userToken: "",
            userSlug: "",
            notification_array: [],
            searchText: "",
            all_noti_count: 0,
        }
    }
    
    UNSAFE_componentWillMount() {
        this.listener = EventRegister.addEventListener(Constants.EVENT_PROFILE_IMAGE_UPDATED, () => {
            console.log(TAG, "EVENT_PROFILE_IMAGE_UPDATED event called");
            this.getData();
        })
        this.listenerGoldCoinChange = EventRegister.addEventListener(Constants.EVENT_PROFILE_GOLDCOIN_UPDATED, () => {
            console.log(TAG, "goldcoin change calleddddddddd");
            this.getData();
        })

        this.listenerNotificationChange = EventRegister.addEventListener(Constants.EVENT_NOTIFICATION_CHANGED, async() => {
            console.log(TAG, "notification is changed notification is changed notification is changed notification is changed notification is changed notification is changed");
            this.count_notification();
        })
    }

    async componentDidMount() {
        await this.getData();
    }

    componentWillUnmount() {
        EventRegister.removeEventListener(this.listener)
        EventRegister.removeEventListener(this.listenerGoldCoinChange)
        EventRegister.removeEventListener(this.listenerNotificationChange)
    }

    getData = async () => {
        try {
            var notificationCount = await AsyncStorage.getItem(Constants.KEY_NOTIFICATION_COUNT);
            let userFirstName = await AsyncStorage.getItem(Constants.KEY_USER_FIRST_NAME);
            let userLastName = await AsyncStorage.getItem(Constants.KEY_USER_LAST_NAME);
            let userImagePath = await AsyncStorage.getItem(Constants.KEY_USER_IMAGE_URL);
            let userImageName = await AsyncStorage.getItem(Constants.KEY_USER_IMAGE_NAME);
            var userId = await AsyncStorage.getItem(Constants.KEY_USER_ID);
            var userToken = await AsyncStorage.getItem(Constants.KEY_USER_TOKEN);
            var userSlug = await AsyncStorage.getItem(Constants.KEY_USER_SLUG);
            this.setState({
                userId: userId,
                userToken: userToken,
                userSlug: userSlug,
                count: notificationCount,
                userFirstName: userFirstName,
                userLastName: userLastName,
                userImagePath: userImagePath,
                userImageName: userImageName,
            })
            
        } catch (error) {
            // Error retrieving data
            console.log('getData  error  ' + error);
        }
    }

    count_notification = async() => {
        try {
            let post_count = await AsyncStorage.getItem('POST');
            let member_count = await AsyncStorage.getItem('MEMBER');
            let event_count = await AsyncStorage.getItem('EVENT');
            let travel_count = await AsyncStorage.getItem('TRAVEL');
            let gift_count = await AsyncStorage.getItem('GIFT');
            let chat_count = await AsyncStorage.getItem('CHAT');

            var post_count_int = post_count == null ? 0 : parseInt(post_count, 10);
            var member_count_int = member_count == null ? 0 : parseInt(member_count, 10);
            var event_count_int = event_count == null ? 0 : parseInt(event_count, 10);
            var travel_count_int = travel_count == null ? 0 : parseInt(travel_count, 10);
            var gift_count_int = gift_count == null ? 0 : parseInt(gift_count, 10);
            var chat_count_int = chat_count == null ? 0 : parseInt(chat_count, 10);
            this.setState({
                all_noti_count: post_count_int + member_count_int + event_count_int + travel_count_int + gift_count_int
            });
        } catch(error) {
    
        }
    }

    handleSearchIcon = () => {
        if(this.state.searchText == "") {
            this.refs.searchText.focus();
        } else {
            Keyboard.dismiss();
            this.setState({ searchText: "" });
            this.props.setSearchText("");
            this.refs.searchText.focus();
            // this.props.handleSearchIcon();
        }
    }

    configSearchText = (text) => {
        this.setState({searchText: text});
    }

    componentDidUpdate (prevProps, prevState) {
        if(prevState.searchText !== this.state.searchText) {
            this.handleSearch();
        }
    }

    handleSearch = () => {
        // Clears running timer and starts a new one each time the user types
        clearTimeout(this.timer);
        this.timer = setTimeout(() => {
            if(this.props.onChangeText) {
                this.props.onChangeText(this.state.searchText);
            } else {
                this.props.setSearchText(this.state.searchText)
            }
        }, 200);
    }

    render() {
        let imageUrl = this.state.userImagePath + Constants.THUMB_FOLDER + this.state.userImageName;
        return (
            <View style={stylesGlobal.headerView}>
                <TouchableOpacity style={stylesGlobal.header_logoview_style} onPress = {() => this.props.logoClick()}>
                    <Image
                        style={stylesGlobal.header_logo_style}
                        source={require("../icons/logo_new.png")}
                    />
                </TouchableOpacity>
                <View style={stylesGlobal.header_searchview_style}>
                    <TextInput
                        ref = "searchText"
                        autoCorrect = {false}
                        underlineColorAndroid="transparent"
                        returnKeyType={"search"}
                        style={[stylesGlobal.header_searchtextview_style, stylesGlobal.font]}
                        onChangeText={searchText => {
                            this.setState({searchText: searchText});
                            if ( searchText.trim() != "" ) {
                                this.props.setSearchText(this.state.searchText);
                                if(this.props.handleEditComplete) {
                                    this.props.handleEditComplete()
                                }
                            }
                        }}
                        value={this.state.searchText}
                        defaultValue=""
                        multiline={false}
                        autoCapitalize='sentences'
                        onChange={() => {
                        }}
                        keyboardType='ascii-capable'
                        placeholder="Search members..."
                    />
                    <TouchableOpacity style={stylesGlobal.header_searchiconview_style} onPress = {() => this.handleSearchIcon()}>
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
                <TouchableOpacity style={stylesGlobal.header_avatarview_style} onPress={() => {this.props.showNotificationPopupView(); }}>
                    <View style = {{position: 'absolute', top: 0, right: 0, zIndex: 10}}>
                        <CustomBadge>{this.state.all_noti_count == 0 ? "" : this.state.all_noti_count.toString()}</CustomBadge>
                    </View>
                    <View style={stylesGlobal.header_avatarsubview_style}>
                        <Image style = {stylesGlobal.header_avatar_style}source={require("../icons/notification_circle.png")}/>
                    </View>
                </TouchableOpacity>
                <TouchableOpacity style={stylesGlobal.header_avatarview_style} onPress={() => this.props.showPopupView()}>
                    <View style={stylesGlobal.header_avatarsubview_style}>
                        <ImageCompressor style = {stylesGlobal.header_avatar_style} uri={imageUrl}/>
                    </View>
                </TouchableOpacity>

            </View>
        );
    }
}
const styles = StyleSheet.create({
  

});

