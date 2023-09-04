import React, { Component } from "react";
import {
    Alert,
    StyleSheet,
    SafeAreaView,
    View,
    TouchableOpacity,
    Image,
    Text,
    ScrollView
} from "react-native";

import { EventRegister } from 'react-native-event-listeners'
import { ImageCompressor } from './ImageCompressorClass'
import { Colors } from "../consts/Colors";
import { Constants } from "../consts/Constants";
import { stylesGlobal, STICKY_HEADER_HEIGHT } from '../consts/StyleSheet';
import Memory from '../core/Memory';
import * as Global from "../consts/Global";
import WebService from "../core/WebService";
import ProgressIndicator from "./ProgressIndicator";
import Moment from "moment/moment";
import AsyncStorage from '@react-native-community/async-storage';
import { localNotificationService } from '../utils/LocalNotificationService';

var TAG = "MyNotifications";

export default class MyNotifications extends React.Component {

    constructor(props) {
        super(props)

        this.state = {
            userId: "",
            userToken: "",
            userSlug: "",
            userFirstName: "",
            userLastName: "",
            userImagePath: "",
            userImageName: "",
            member_plan: "",
            is_verified: "",

            notification_array: [],
            notification_page: 1,
            more_load: true, // if there is history row then true else false

            selected_notification: null,

            numberofperpage: 20,

            load_from_notification: false, // load when receive chat notification

            selected_item: null, // use when go to guest list screen

        }

    }

    /**
       ***************   Notification Type  ******************
       1: connection approval
       2: event invitation
       3: event confirmation
       4: event cancellation
       5: event waitlist
       6: wink
       8: delete event
       9: edit event
       10: receive gift
       11: accepted gift
       12: declined gift
       13: send rose
       14: add to favorite
       15: view album request
       16: album view request accept
       17: album view request reject
       18: view profile
       19: post like
       20: post comment
       21: post share
       22: when create new party or travel
    */

    /****
     *********************   class_type  *****************
     * 
     * 0: null
     * 1: post
     * 2: member
     * 3: party
     * 4: travel
     * 5: gift
     * 6: chat
     * 7: profile
     * 
     */

    UNSAFE_componentWillMount() {
        this.getData();

        this.listenerNotificationChange = EventRegister.addEventListener(Constants.EVENT_NOTIFICATION_CHANGED, async () => {

            let post_count = await AsyncStorage.getItem('POST');
            let member_count = await AsyncStorage.getItem('MEMBER');
            let event_count = await AsyncStorage.getItem('EVENT');
            let travel_count = await AsyncStorage.getItem('TRAVEL');
            let gift_count = await AsyncStorage.getItem('GIFT');
            let chat_count = await AsyncStorage.getItem('CHAT');

            if (post_count.toString() != "0" || member_count.toString() != "0" || event_count.toString() != "0" || travel_count.toString() != "0" || gift_count.toString() != "0" || chat_count.toString() != "0") {
                this.setState({
                    load_from_notification: true,
                    notification_page: 1,
                    more_load: true,
                }, () => this.getNotifications())
            }
        })

    }

    componentWillUnmount() {
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


            this.setState({
                userId: userId,
                userToken: userToken,
                userSlug: userSlug,
                userFirstName: userFirstName,
                userLastName: userLastName,
                userImagePath: userImagePath,
                userImageName: userImageName,
                member_plan: member_plan,
                is_verified: is_verified,

            }, async () => {
                this.getNotifications();

                for (noti_type = 1; noti_type < 8; noti_type++) {
                    if (i != 6) {
                        this.read_notification(noti_type);
                    }
                }

                await AsyncStorage.setItem('POST', "0");
                await AsyncStorage.setItem('MEMBER', "0");
                await AsyncStorage.setItem('EVENT', "0");
                await AsyncStorage.setItem('TRAVEL', "0");
                await AsyncStorage.setItem('GIFT', "0");
                await AsyncStorage.setItem('CHAT', "0");

                localNotificationService.setIconNotificationBadge(0);
                EventRegister.emit(Constants.EVENT_NOTIFICATION_CHANGED, '');
            });

        } catch (error) {
            // Error retrieving data
            return;
        }
    };

    isCloseToBottom = ({ layoutMeasurement, contentOffset, contentSize }) => {
        const paddingToBottom = 10;
        return layoutMeasurement.height + contentOffset.y >=
            contentSize.height - paddingToBottom;
    };

    isCloseToTop = ({ layoutMeasurement, contentOffset, contentSize }) => {
        const paddingToBottom = 10;
        console.log(contentOffset.y)
        return contentOffset.y <= -10
    };

    getNotifications() {

        try {
            if (!this.state.load_from_notification) {
                this.setState({
                    loading: true
                });
            }

            let uri = Memory().env == "LIVE" ? Global.URL_GET_NOTIFICATIONS : Global.URL_GET_NOTIFICATIONS_DEV;
            let params = new FormData();
            params.append("token", this.state.userToken);
            params.append("user_id", this.state.userId);
            params.append("format", "json");
            let data = {
                "page": this.state.notification_page,
                "perPage": this.state.numberofperpage
            }
            params.append("data", JSON.stringify(data));

            console.log(TAG + " callGetNotificationsAPI uri " + uri);
            console.log(TAG + " callGetNotificationsAPI params " + JSON.stringify(params));

            WebService.callServicePost(uri, params, this.handleGetNotifications);
        } catch (error) {
            console.log(TAG + " callGetNotificationsAPI error " + error);
            this.setState({
                load_from_notification: false,
                loading: false
            });
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    }

    handleGetNotifications = async (response, isError) => {
        console.log(TAG + " callGetNotificationsAPI Response " + JSON.stringify(response));
        console.log(TAG + " callGetNotificationsAPI isError " + isError);

        if (!isError) {
            var result = response;
            if (result != undefined && result != null) {
                if (result.status == "success") {
                    var notification_array = result.data;
                    for (i = 0; i < notification_array.length; i++) {
                        notification_array[i].thumb_image_path = notification_array[i].image_path + Constants.THUMB_FOLDER + notification_array[i].image_name;
                    }
                    if (this.state.load_from_notification) {
                        this.setState({
                            notification_array: notification_array,
                            notification_page: this.state.notification_page + 1,
                        });
                    } else {
                        this.setState({
                            notification_array: [...this.state.notification_array, ...notification_array],
                            notification_page: this.state.notification_page + 1,
                        });
                    }

                    if (notification_array.length < this.state.numberofperpage) {
                        this.setState({
                            more_load: false
                        })
                    }
                }
            }
        } else {
            if (response != undefined && response != null && response.length > 0) {
                Alert.alert(response.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }

        this.setState({
            load_from_notification: false,
            loading: false
        });
    }

    read_notification = async (noti_class_type) => {
        try {
            let uri = Memory().env == "LIVE" ? Global.URL_READ_NOTIFICATIONS : Global.URL_READ_NOTIFICATIONS_DEV;
            let params = new FormData();
            params.append("user_id", this.state.userId);
            params.append("token", this.state.userToken);
            params.append("format", "json");
            params.append("notify_type", noti_class_type);
            console.log(TAG + " read_notification callReadNotificationAPI uri " + uri);
            console.log(TAG + " read_notification callReadNotificationAPI params " + JSON.stringify(params));
            WebService.callServicePost(uri, params, this.handleReadNotificationResponse);
        } catch (error) {
            console.log(error)

        }
    }

    handleReadNotificationResponse = async (response, isError) => {
        console.log(TAG + " read_notification callReadNotificationAPI result " + JSON.stringify(response));
        console.log(TAG + " read_notification callReadNotificationAPI isError " + isError);
        if (!isError) {
            try {
                var result = response;
                if (result != null) {
                    if (result.status == "success") {
                        console.log(TAG + " read_notification callReadNotificationAPI result : ", result.msg);
                    }
                }
            } catch (error) {
                console.log(" --- handleReadNotificationResponse : ", error)
            }
        } else {
            if (response != undefined && response != null && response.length > 0) {
                Alert.alert(response.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    };

    refreshProfileImage() {

    }

    deleteNotification = (index) => {
        this.setState({
            selected_notification: this.state.notification_array[index],
            loading: true
        })
        try {

            this.setState({
                loading: true
            });

            let uri = Memory().env == "LIVE" ? Global.URL_DELETE_NOTIFICATION + this.state.notification_array[index].notification_id : Global.URL_DELETE_NOTIFICATION_DEV + this.state.notification_array[index].notification_id;
            let params = new FormData();
            params.append("token", this.state.userToken);
            params.append("user_id", this.state.userId);
            params.append("format", "json");

            console.log(TAG + " callDeleteNotificationsAPI uri " + uri);
            console.log(TAG + " callDeleteNotificationsAPI params " + JSON.stringify(params));

            WebService.callServicePost(uri, params, this.handleDeleteNotifications);
        } catch (error) {
            console.log(TAG + " callDeleteNotificationsAPI error " + error);
            this.setState({
                loading: false
            });
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    }

    handleDeleteNotifications = (response, isError) => {
        console.log(TAG + " callDeleteNotificationsAPI Response " + JSON.stringify(response));
        console.log(TAG + " callDeleteNotificationsAPI isError " + isError);

        if (!isError) {
            var result = response;
            if (result != undefined && result != null) {
                if (result.status == "success") {
                    var notification_array = this.state.notification_array;
                    for (i = 0; i < notification_array.length; i++) {
                        if (this.state.selected_notification != null && (notification_array[i].notification_id == this.state.selected_notification.notification_id)) {
                            notification_array.splice(i, 1);
                            break
                        }
                    }
                    this.setState({
                        notification_array: notification_array,
                        selected_notification: null,
                    });
                } else {
                    if(response.msg)
                    {
                        Alert.alert(response.msg.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
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
            loading: false
        });
    }

    callEventDetailAPI = async (selected_item) => {
        try {
            this.setState({
                loading: true,
                selected_item: selected_item
            });
            let uri = Memory().env == "LIVE" ? Global.URL_EVENT_DETAIL + selected_item.object_id : Global.URL_EVENT_DETAIL_DEV + selected_item.object_id
            let params = new FormData();
            params.append("token", this.state.userToken);
            params.append("user_id", this.state.userId);
            params.append("format", "json");
            params.append("data", "");

            console.log(TAG + " callEventDetailAPI uri " + uri);
            console.log(TAG + " callEventDetailAPI params " + JSON.stringify(params));

            WebService.callServicePost(uri, params, this.handleEventDetailResponse);
        } catch (error) {
            this.setState({
                loading: false,
                commentLoading: false
            });
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    };

    /**
    * handle event detai lAPI response
    */
    handleEventDetailResponse = (response, isError) => {
        console.log(TAG + " Response " + JSON.stringify(response));
        console.log(TAG + " isError " + isError);
        console.log(response.data)
        if (!isError) {
            var result = response;
            if (result != undefined && result != null) {
                if (result.status == "success") {
                    if (result.data != undefined && result.data != null) {
                        var ishosted = false;
                        if (this.state.selected_item.notification_type == "3") {
                            ishosted = true;
                        }

                        this.props.screenProps.navigate("GuestList", {
                            user_id: this.state.userId,
                            token: this.state.userToken,
                            eventId: this.state.selected_item.object_id,
                            inviteList: result.data.invite,
                            ishosted: ishosted,
                            eventDetailData: result.data,
                        })
                        this.setState({
                            selected_item: null
                        })
                    }
                } else {
                    Alert.alert("This event doesn't exsist anymore.", "");
                }
            }
        } else {
            if (response != undefined && response != null && response.length > 0) {
                Alert.alert(response.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
        this.setState({
            loading: false,
        });
    };


    display_notification_contents = (item) => {
        if (item.notification_type == "1") {

        } else if (item.notification_type == "2" || item.notification_type == "5") {
            this.props.screenProps.navigate("EventDetail", {
                screenProps: this.props.screenProps,
                eventId: item.object_id,
                loadAfterDeletingEvent: () => { },
                refreshEventData: () => { },
                EventCategory: item.class_type == "3" ? "travel" : "party",
                // tab_type: this.props.type,
                // invite_code: item.invite_code
            });
        } else if (item.notification_type == "3") {
            this.callEventDetailAPI(item);
        } else if (item.notification_type == "9" || item.notification_type == "22") {
            this.props.screenProps.navigate("EventDetail", {
                screenProps: this.props.screenProps,
                eventId: item.object_id,
                loadAfterDeletingEvent: () => { },
                refreshEventData: () => { },
                EventCategory: item.class_type == "3" ? "travel" : "party",
                // tab_type: this.props.type,
                // invite_code: item.invite_code
            });
        } else if (item.notification_type == "10") {
               // this.props.prop_navigation.navigate("MyGiftScreen", { list_show: "gift_sent" });
               this.props.screenProps.navigate("MyListsNavigation", { list_show: "gift_received" });
                //MyListsNavigation
        } else if (item.notification_type == "11") {
               //this.props.prop_navigation.navigate("MyGiftScreen", { list_show: "mygift" });
               this.props.screenProps.navigate("MyListsNavigation", { list_show: "mygift" });
        } else if (item.notification_type == "12") {
               //this.props.prop_navigation.navigate("MyGiftScreen", { list_show: "mygift" });
                this.props.screenProps.navigate("MyListsNavigation", { list_show: "mygift" });
        } else if (item.notification_type == "13") {
            var token_array = item.url.split("/");
            this.props.screenProps.navigate("ProfileDetail", {
                slug: token_array[token_array.length - 1]
            });
        } else if (item.notification_type == "14") {
            this.props.screenProps.navigate("MyListsNavigation", { list_show: "favorited_me" });
        } else if (item.notification_type == "15" || item.notification_type == "16" || item.notification_type == "17") {
            this.props.move_tab(9);
        } else if (item.notification_type == "18") {
            var token_array = item.url.split("/");
            this.props.screenProps.navigate("ProfileDetail", {
                slug: token_array[token_array.length - 1]
            });
        } else if (item.notification_type == "19" || item.notification_type == "20" || item.notification_type == "21") {
            this.props.screenProps.navigate("MyTimeLine", {
                id: this.state.userId,
                slug: this.state.userSlug,
                firstName: this.state.userFirstName,
                lastName: this.state.userLastName,
                imgpath: this.state.userImagePath,
                filename: this.state.userImageName
            })
        }
    }

    open_profile = (selected_item) => {
        if (selected_item.object_name == "user") {
            // var url = selected_item.url;
            // if(url != null) {
            //     let localUriTypePart = url.split('/');
            //     let user_slug = localUriTypePart[localUriTypePart.length - 1];
            //     this.props.screenProps.navigate("ProfileDetail", {
            //         slug: user_slug
            //     });
            // }
            this.props.screenProps.navigate("ProfileDetail", { slug: selected_item.slug });
        } else if (selected_item.object_name == "event") {
            if (selected_item.notification_type != "4" && selected_item.notification_type != "8") {
                this.props.screenProps.navigate("EventDetail", {
                    screenProps: this.props.screenProps,
                    eventId: selected_item.object_id,
                    loadAfterDeletingEvent: () => { },
                    refreshEventData: () => { },
                    EventCategory: selected_item.class_type == "3" ? "travel" : "party",
                    // tab_type: this.props.type,
                    // invite_code: item.invite_code
                });
            }
        }
    }

    scrollToTop() {
        if (this._scrollView) {
            this._scrollView.scrollTo({ x: 0, y: 0, animated: true })
        }
    }

    render() {
        return (
            <SafeAreaView style={styles.container}>
                {
                    this.state.loading && <ProgressIndicator />
                }
                <View style={[stylesGlobal.cardView, { width: '90%', height: '90%', padding: 0, margin: 0 }]}>
                    <View style={{ width: '100%', height: '100%', alignItems: 'center' }}>
                        <View style={stylesGlobal.title_header}>
                            <Text style={[stylesGlobal.headText, stylesGlobal.font]}>NOTIFICATIONS</Text>
                        </View>
                        <View style={{ width: '100%', flex: 1, alignItems: 'center' }}>
                            {
                                !this.state.loading && this.state.notification_array.length == 0 &&
                                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                                    <Text style={[stylesGlobal.empty_cardView_text, stylesGlobal.font]}>No Notifications yet</Text>
                                </View>
                            }
                            {
                                this.state.notification_array.length > 0 &&
                                <ScrollView
                                    ref={(c) => { this._scrollView = c; }}
                                    style={{ flex: 1, width: '95%' }}
                                    scrollEventThrottle={0}
                                    onScroll={({ nativeEvent }) => {
                                        if (this.isCloseToBottom(nativeEvent)) {
                                            if (this.state.more_load && this.state.loading != true) {
                                                this.setState({
                                                    loading: true
                                                }, () => this.getNotifications())
                                            }
                                        }
                                        if (this.isCloseToTop(nativeEvent)) {
                                            this.setState({
                                                notification_array: [],
                                                notification_page: 1,
                                                more_load: true,
                                                loading: true
                                            }, () => this.getNotifications())
                                        }
                                    }}
                                >
                                    {
                                        this.state.notification_array.map((item, index) =>
                                            <View key={index} style={styles.component_view}>
                                                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }} >
                                                    {
                                                        item.notification_type == "1" &&
                                                        <Image style={{ width: 40, height: 40, }} resizeMode={'contain'} source={require("../icons/ic_tab_dashbord.png")} />
                                                    }
                                                    {
                                                        (item.notification_type == "2" || item.notification_type == "3" || item.notification_type == "4" || item.notification_type == "5" || item.notification_type == "6" || item.notification_type == "8" || item.notification_type == "9" || item.notification_type == "22") &&
                                                        <Image style={{ width: 40, height: 40, }} resizeMode={'contain'} source={require("../icons/ic_tab_events.png")} />
                                                    }
                                                    {
                                                        (item.notification_type == "10" || item.notification_type == "11" || item.notification_type == "12") &&
                                                        <Image style={{ width: 40, height: 40, }} resizeMode={'contain'} source={require("../icons/ic_tab_gift.png")} />
                                                    }
                                                    {
                                                        item.notification_type == "13" &&
                                                        <Image style={{ width: 40, height: 40, }} resizeMode={'contain'} source={require("../icons/transaction_send_rose.png")} />
                                                    }
                                                    {
                                                        item.notification_type == "14" &&
                                                        <Image style={{ width: 40, height: 40, }} resizeMode={'contain'} source={require("../icons/full_favorite_red.png")} />
                                                    }
                                                    {
                                                        (item.notification_type == "15" || item.notification_type == "16" || item.notification_type == "17" || item.notification_type == "18") &&
                                                        <Image style={{ width: 40, height: 40, }} resizeMode={'contain'} source={require("../icons/ic_tab_dashbord.png")} />
                                                    }
                                                    {
                                                        item.notification_type == "19" &&
                                                        <Image style={{ width: 40, height: 40, }} resizeMode={'contain'} source={require("../icons/ic_like.png")} />
                                                    }
                                                    {
                                                        item.notification_type == "20" &&
                                                        <Image style={{ width: 40, height: 40, }} resizeMode={'contain'} source={require("../icons/ic_commet.png")} />
                                                    }
                                                    {
                                                        item.notification_type == "21" &&
                                                        <Image style={{ width: 40, height: 40, }} resizeMode={'contain'} source={require("../icons/ic_share.png")} />
                                                    }
                                                    <TouchableOpacity style={{ marginLeft: 10, marginRight: 5 }} onPress={() => this.open_profile(item)}>
                                                        <ImageCompressor style={{ width: 70, height: 70, }} uri={item.thumb_image_path} />
                                                    </TouchableOpacity>
                                                    <TouchableOpacity style={{ flex: 1, justifyContent: 'center' }} onPress={() => this.display_notification_contents(item)}>
                                                        <Text style={[{ fontSize: 14, color: Colors.gold }, stylesGlobal.font]} numberOfLines={2} renderTruncatedFooter={() => null}>{item.notification_text}</Text>
                                                        <Text style={[{ fontSize: 10, color: Colors.black, marginTop: 5 }, stylesGlobal.font]}>{Moment(item.created_at).format("DD MMM YYYY h:mm a")}</Text>
                                                    </TouchableOpacity>
                                                </View>
                                                <View style={{ alignItems: 'center' }}>
                                                    <TouchableOpacity style={{ width: 30, height: 30, justifyContent: 'center', alignItems: 'flex-end' }} onPress={() => this.deleteNotification(index)}>
                                                        <Image style={{ width: 25, height: 25, }} resizeMode={'contain'} source={require("../icons/ic_delete.png")}></Image>
                                                    </TouchableOpacity>
                                                </View>
                                            </View>
                                        )
                                    }
                                </ScrollView>
                            }
                        </View>
                    </View>
                </View>
            </SafeAreaView>
        );
    }


}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: "100%",
        height: "100%",
        backgroundColor: Colors.black,
        alignItems: 'center',
        justifyContent: 'center'
    },
    card_view: {
        width: '90%',
        height: '90%',
        alignItems: 'center',
        backgroundColor: Colors.white,
        borderRadius: 10,
        shadowColor: Colors.white,
        shadowOffset: {
            width: 0,
            height: 0
        },
        shadowRadius: 7,
        shadowOpacity: 7.0,
    },
    title_header: {
        width: '100%',
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.card_titlecolor,
        borderTopRightRadius: 10,
        borderTopLeftRadius: 10,
        overflow: 'hidden'
    },
    headText: {
        color: Colors.gold,
        fontSize: 20,
        // fontWeight: 'bold'
    },
    component_view: {
        width: '100%',
        marginTop: 15,
        borderBottomWidth: 0.5,
        borderColor: Colors.black,
        paddingLeft: 10,
        paddingRight: 10,
        // paddingTop: 15,
        paddingBottom: 15,
        flexDirection: 'row',
        alignItems: 'center'
    },
    title_text: {
        fontSize: 14,
        color: Colors.black
    },

});
