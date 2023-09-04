import React from 'react';
import {
    StyleSheet,
    Text,
    View,
    Modal,
    TouchableOpacity,
    Platform,
    Dimensions,
    TouchableWithoutFeedback,
    Alert,
    Linking,
    ScrollView,
    FlatList,
    TextInput,
    Image,
    KeyboardAvoidingView
} from 'react-native';
import { EventRegister } from 'react-native-event-listeners';
import { ImageCompressor } from '../components/ImageCompressorClass';
import { Constants } from "../consts/Constants";
import { Colors } from "../consts/Colors";
import { stylesGlobal, STICKY_HEADER_HEIGHT } from "../consts/StyleSheet";
import WebService from "../core/WebService";
import * as Global from "../consts/Global";
import Memory from '../core/Memory';
import AsyncStorage from '@react-native-community/async-storage';
import { isIphoneX, getBottomSpace } from '../custom_components/react-native-iphone-x-helper';
import ProgressIndicator from "../components/ProgressIndicator";
import { localNotificationService } from '../utils/LocalNotificationService';



var imageSize = 150;
var imagePadding = 10;
var cardPadding = 10;
var messageWidth = width - imageSize - imagePadding * 3;
const { height, width } = Dimensions.get("window");


const imageWidth = 60;
var containerWidth = 250;

var TAG = "NotificationPopupView"

export default class NotificationPopupView extends React.Component {

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

            loading: false,
            selected_item: null,

            is_portrait: true,
        }
    }

    UNSAFE_componentWillMount() {
        // this.getData();

        // this.listenerNotificationChange = EventRegister.addEventListener(Constants.EVENT_NOTIFICATION_CHANGED, async() => {
        //     this.getData();
        // })

        if (Dimensions.get("window").width < Dimensions.get("window").height) {
            this.setState({
                is_portrait: true
            })
        } else {
            this.setState({
                is_portrait: false
            })
        }

        Dimensions.addEventListener("change", () => {
            if (Dimensions.get("window").width < Dimensions.get("window").height) {
                this.setState({
                    is_portrait: true
                })
            } else {
                this.setState({
                    is_portrait: false
                })
            }
        })
    }

    componentWillUnmount() {
        // EventRegister.removeEventListener(this.listenerNotificationChange)
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
            this.callGetNewNotificationsAPI();
        } catch (error) {
            // Error retrieving data
            console.log('getData  error  ' + error);
        }
    }

    /**
     * call get my profile detail API and display content
     */
    callGetNewNotificationsAPI = async () => {
        try {

            this.setState({
                loading: true,
            });
            let uri = Memory().env == "LIVE" ? Global.URL_GET_NEW_NOTIFICATIONS : Global.URL_GET_NEW_NOTIFICATIONS_DEV;
            let params = new FormData();
            params.append("token", this.state.userToken);
            params.append("user_id", this.state.userId);
            params.append("format", "json");
            // let data = {
            //     "page": 1,
            //     "perPage": 20
            // }
            // params.append("data", JSON.stringify(data));

            console.log(TAG + " callGetNewNotificationsAPI uri " + uri);
            console.log(TAG + " callGetNewNotificationsAPI params " + JSON.stringify(params));

            WebService.callServicePost(uri, params, this.handleGetNewNotifications);
        } catch (error) {
            console.log(TAG + " callGetNewNotificationsAPI error " + error);

        }
    }

    handleGetNewNotifications = async (response, isError) => {
        console.log(TAG + " callGetNewNotificationsAPI Response " + JSON.stringify(response));
        console.log(TAG + " callGetNewNotificationsAPI isError " + isError);
        if (!isError) {
            var result = response;
            if (result != undefined && result != null) {
                if (result.status == "success") {
                    if (result.data.notification != null && result.data.notification.length > 0) {
                        EventRegister.emit(Constants.EVENT_BANNER_INVITATION, JSON.stringify(result.data.notification));
                        for (i = 0; i < result.data.notification.length; i++) {
                            result.data.notification[i].thumb_image_path = result.data.notification[i].image_path + Constants.THUMB_FOLDER + result.data.notification[i].image_name;
                        }

                        // console.log('result.data.notification ', result.data.notification );
                        // if(result.data.notification && result.data.notification.length == 0) {
                        //     var tmpData = [{"class_type": 6, "created_at": "2022-12-12T15:11:53.000Z", "first_name": "Mark", "id": null, "image_name": "1567702480_950_12.jpg", "image_path": "https://cdn1.007percent.com/uploads/profile/", "ip": "::ffff:127.0.0.", "is_read": false, "last_name": "Kraus", "notification_id": 97658, "notification_text": "Mark Kraus would like to chat.", "notification_type": 25, "object_id": 950, "object_name": "user", "object_text": "Mark Kraus", "owner_id": 950, "slug": "mark-kraus30", "thumb_image_path": "https://cdn1.007percent.com/uploads/profile/thumb_300x300/1567702480_950_12.jpg", "url": "https://test.007percent.com/messages", "user_id": 1278}];
                        //     this.setState({ notification_array: tmpData });
                        // } else {
                        //     this.setState({ notification_array: result.data.notification });
                        // }

                        this.setState({ notification_array: result.data.notification });
                        this.read_notifications();
                    } else {

                        if(result.data.threenotification != null && result.data.threenotification.length > 0) {
                            EventRegister.emit(Constants.EVENT_BANNER_INVITATION, JSON.stringify(result.data.threenotification));
                            for (i = 0; i < result.data.threenotification.length; i++) {
                                result.data.threenotification[i].thumb_image_path = result.data.threenotification[i].image_path + Constants.THUMB_FOLDER + result.data.threenotification[i].image_name;
                            }
                            this.setState({ notification_array: result.data.threenotification });
                            this.read_notifications();
                        } else {
                            this.setState({ notification_array: [] });
                        }


                        // var tmpData = [{"class_type": 6, "created_at": "2022-12-12T15:11:53.000Z", "first_name": "Mark", "id": null, "image_name": "1567702480_950_12.jpg", "image_path": "https://cdn1.007percent.com/uploads/profile/", "ip": "::ffff:127.0.0.", "is_read": false, "last_name": "Kraus", "notification_id": 97658, "notification_text": "Mark Kraus would like to chat.", "notification_type": 25, "object_id": 950, "object_name": "user", "object_text": "Mark Kraus", "owner_id": 950, "slug": "mark-kraus30", "thumb_image_path": "https://cdn1.007percent.com/uploads/profile/thumb_300x300/1567702480_950_12.jpg", "url": "https://test.007percent.com/messages", "user_id": 1278}];
                        //     this.setState({ notification_array: tmpData });



                        
                    }
                }
            }
        } else {
            if (response != undefined && response != null && response.length > 0) {
                Alert.alert(response.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
        this.setState({ loading: false });

    }

    read_notifications = async () => {

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
        // if (chat_new == null) {
        //     chat_new = 0;
        // }

        // if((post_new + member_new + event_new + travel_new + gift_new) == 0) {
        //     return;
        // }
        // this.read_notification(1);
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
        // await AsyncStorage.setItem('CHAT', "0");
        this.setState({
            all_noti_count: 0
        });

        localNotificationService.setIconNotificationBadge(
            parseInt(chat_new, 10)
            // parseInt(gift_new, 10) + 
            // parseInt(travel_new, 10) + 
            // parseInt(event_new, 10) + 
            // parseInt(member_new, 10) + 
            // parseInt(post_new, 10)
            );
        EventRegister.emit(Constants.EVENT_NOTIFICATION_CHANGED, '');
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
        // console.log(TAG + " callReadNotificationAPI result " + JSON.stringify(response));
        // console.log(TAG + " callReadNotificationAPI isError " + isError);
        if (!isError) {
            try {
                var result = response;
                if (result != null) {
                    if (result.status == "success") {

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

    getDataAgain() {

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
                selected_item: null
            });

        }
    };

    /**
    * handle event detai lAPI response
    */
    handleEventDetailResponse = (response, isError) => {
        console.log(TAG + " callEventDetailAPI Response " + JSON.stringify(response));
        console.log(TAG + " callEventDetailAPI isError " + isError);

        if (!isError) {
            var result = response;
            if (result != undefined && result != null) {
                if (result.status == "success") {
                    if (result.data != undefined && result.data != null) {
                        this.props.closeDialog();
                        this.props.prop_navigation.navigate("GuestList", {
                            user_id: this.state.userId,
                            token: this.state.userToken,
                            eventId: this.state.selected_item.object_id,
                            inviteList: result.data.invite,
                            ishosted: true,
                            eventDetailData: result.data,
                        })
                        this.setState({
                            selected_item: null
                        })
                    }
                } else {
                    Alert.alert("The event might have been deleted.", "");
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

    open_notification_link() {
        this.props.closeDialog();
        if (this.props.account_notification) {
            this.props.account_notification();
        } else {
            if (this.props.openNotificationScreen) {
                this.props.openNotificationScreen(true, "notifications")
            }
        }
    }

    display_notification_contents = (item) => {
        console.log(TAG, " display_notification_contents item  = :", item);
        if (item.notification_type == "1") {

        } else if (item.notification_type == "2" || item.notification_type == "5") {
            this.props.closeDialog();
            this.props.prop_navigation.navigate("EventDetail", {
                screenProps: this.props.prop_navigation,
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
            this.props.closeDialog();
            this.props.prop_navigation.navigate("EventDetail", {
                screenProps: this.props.prop_navigation,
                eventId: item.object_id,
                loadAfterDeletingEvent: () => { },
                refreshEventData: () => { },
                EventCategory: item.class_type == "3" ? "travel" : "party",
                // tab_type: this.props.type,
                // invite_code: item.invite_code
            });
        } else if (item.notification_type == "10") {
            // this.props.prop_navigation.navigate("MyGiftScreen", { list_show: "gift_sent" });
            this.props.prop_navigation.navigate("MyListsNavigation", { list_show: "gift_sent" });
            //MyListsNavigationƒ
        } else if (item.notification_type == "11") {
            //this.props.prop_navigation.navigate("MyGiftScreen", { list_show: "mygift" });
            this.props.prop_navigation.navigate("MyListsNavigation", { list_show: "mygift" });
        } else if (item.notification_type == "12") {
            //this.props.prop_navigation.navigate("MyGiftScreen", { list_show: "mygift" });
            this.props.prop_navigation.navigate("MyListsNavigation", { list_show: "mygift" });
        }
        // else if(item.notification_type == "15"){
        //      this.props.closeDialog();
        //      this.props.prop_navigation.navigate('MyAccountScreen', {initial_tab: "view_album_request"});
        //     //this.props.prop_navigation.navigate('Dashboard', {selected_screen: "myaccount", myaccount_initial_tab: "view_album_request"})
        // } 
        else if (item.notification_type == "13") {
            this.props.closeDialog();
            var token_array = item.url.split("/");
            this.props.prop_navigation.navigate("ProfileDetail", {
                slug: token_array[token_array.length - 1]
            });
        } else if (item.notification_type == "14") {
            this.props.closeDialog();
            this.props.prop_navigation.navigate("MyListsNavigation", { list_show: "favorited_me" });
        } else if (item.notification_type == "15" || item.notification_type == "16" || item.notification_type == "17") {
        //} else if (item.notification_type == "16" || item.notification_type == "17") {
            this.props.closeDialog();
            this.props.prop_navigation.navigate("MyAccountScreen", { initial_tab: "view_album_request" });
        } else if (item.notification_type == "18") {
            this.props.closeDialog();
            var token_array = item.url.split("/");
            this.props.prop_navigation.navigate("ProfileDetail", {
                slug: token_array[token_array.length - 1]
            });
        } else if (item.notification_type == "19" || item.notification_type == "20" || item.notification_type == "21") {
            this.props.closeDialog();
            this.props.prop_navigation.navigate("MyTimeLine", {
                id: this.state.userId,
                slug: this.state.userSlug,
                firstName: this.state.userFirstName,
                lastName: this.state.userLastName,
                imgpath: this.state.userImagePath,
                filename: this.state.userImageName
            })
        } else if(item.notification_type == "25") {
            // this.props.closeDialog();
            //MESSAGE

            //openChatScreen
            // if(this.props.openChatScreen) {
            //     this.props.openChatScreen();
            // }
            // if(this.props.onShowChatRequestModal)
            //     this.props.onShowChatRequestModal(item);
            this.setState({chat_req_item: item, show_chat_req_item_modal: true});
            
               // this.props.prop_navigation.navigate("MyAccountScreen", { initial_tab: "view_album_request" });
               // this.props.prop_navigation.navigate('Dashboard', {selected_screen: "myaccount", });
           // this.props.prop_navigation.navigate('MyRecentMessagesScreen', {notification: item});
 // this.props.prop_navigation.navigate('Dashboard', {selected_screen: "chat"});
            // this.setState({show_chat_requres: true})

        }
    }

    open_profile = (selected_item) => {
        this.props.closeDialog();
        if (selected_item.object_name == "user") {
            this.props.prop_navigation.navigate("ProfileDetail", { slug: selected_item.slug });
        } else if (selected_item.object_name == "event") {
            if (selected_item.notification_type != "4" && selected_item.notification_type != "8") {
                this.props.prop_navigation.navigate("EventDetail", {
                    screenProps: this.props.prop_navigation,
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


    renderChatRequestModal = () => {
        return (
            <View style={[{ width: width, height: height }, styles.container_modal]}>
                
                <View style={styles.container_modal_back}></View>
                <KeyboardAvoidingView 
                    style={{ flex: 1, width: '100%', display: 'flex', flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }} 
                    contentContainerStyle={{ flex: 1 }} 
                    behavior={Platform.OS == "ios" ? "padding" : null} 
                    keyboardVerticalOffset={isIphoneX() ? getBottomSpace() + 15 : 18} enabled>
                    <View style={{ width: '85%', backgroundColor: Colors.white, borderRadius: 10 }}>

                    <View style={{ width: '100%', padding: 20, display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={[{ fontSize: 18, color: Colors.black }, stylesGlobal.font]}>Pending Chat Request</Text>
                        <TouchableOpacity 
                            style={{ margin: 5 }} 
                            onPress={() => this.setState({
                                    show_chat_req_item_modal: false
                                })}>
                            <Image style={{ width: 20, height: 20, tintColor: Colors.gold }} source={require('../icons/connection-delete.png')} />
                        </TouchableOpacity>
                    </View>

                    <View style={{ width: '100%', padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', borderTopColor: Colors.gray, borderTopWidth: 0.5, borderBottomColor: Colors.gray, borderBottomWidth: 0.5 }}>
                        <Text style={[{ fontSize: 14, color: Colors.black, alignContent: 'center', lineHeight: 20}, stylesGlobal.font]}>
                            You have received a chat request from {this.state.chat_req_item.object_text} who is not a Member of the Inner Circle of The 0.07%. What would you like to do?
                    
                        </Text>


                        <View style={styles.userImageContainer, { marginTop: 20,}}>
                            <ImageCompressor uri={this.state.chat_req_item.thumb_image_path} style={styles.userImage}/>
                        </View>

                        <View style={{width: '100%', padding: 10, marginTop: 10, display: 'flex', flexDirection: 'row', justifyContent: 'center', alignItems: 'center'}}>
                            <Text style={{color: '#E8C26B', fontSize: 24, fontFamily: 'raleway', fontWeight: 800}} >{this.state.chat_req_item.object_text}</Text>
                        </View>

                        <View style={{width: '100%', padding: 10, marginTop: 10, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center'}}>
                            <TouchableOpacity 
                                style={[{ width: '80%', paddingVertical: 8, paddingHorizontal: 20, display: 'flex', flexDirection: 'row', justifyContent: 'center', backgroundColor: Colors.gold, borderRadius: 5, }, stylesGlobal.shadow_style]}
                                onPress={() => {
                                    // this.setState({show_chat_req_item_modal: false});
                                    this.callRequestChatActionApi("free", 0);

                                    }}
                            >
                                <Text style={[{ fontSize: 14, color: Colors.white }, stylesGlobal.font]}>Chat for Free</Text>
                            </TouchableOpacity>

                            {this.state.set_chat_gold ? 
                                <View style={{ width: '80%', marginTop: 20,  display: 'flex', alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>

                                    <TextInput 
                                        style={[{ width: '30%', },  styles.expiry_text, stylesGlobal.font]} 
                                        returnKeyType={(Platform.OS === 'ios') ? 'done' : 'next'}
                                        keyboardType="numeric"
                                        onChangeText={(text) => this.setState({ chat_pay_amount: text })}>
                                        {this.state.chat_pay_amount}
                                    </TextInput>
                                    <Image style={{ width: 20, height: 20, resizeMode: "contain", marginLeft: 5 }} source={require("../icons/TurningCoin.gif")} />
                                    <TouchableOpacity 
                                        style={[{ paddingVertical: 8, paddingHorizontal: 20, backgroundColor: Colors.gold, borderRadius: 5, }, stylesGlobal.shadow_style]}
                                        onPress={() => {
                                            // this.setState({show_chat_req_item_modal: false});
                                            this.callRequestChatActionApi("accept", this.state.chat_pay_amount);
                                            
                                            // this.setState({show_chat_req_item_modal: false})
                                            }}
                                    >
                                        <Text style={[{ fontSize: 14, color: Colors.white }, stylesGlobal.font]}>Charge</Text>
                                    </TouchableOpacity> 
                                </View>
                                : 
                                <TouchableOpacity 
                                    style={[{  width: '80%', paddingVertical: 8 , marginTop: 20, paddingHorizontal: 20, display: 'flex', flexDirection: 'row', justifyContent: 'center',backgroundColor: Colors.gold, borderRadius: 5,  }, stylesGlobal.shadow_style]}
                                    onPress={() => {
                                        this.setState({set_chat_gold: true});
                                        }}
                                >
                                    <Text style={[{ fontSize: 14, color: Colors.white }, stylesGlobal.font]}>Charge Gold for this Chat</Text>
                                </TouchableOpacity>
                            }
                                

                            <TouchableOpacity 
                                style={[{  width: '80%', paddingVertical: 8, marginTop: 20, display: 'flex', flexDirection: 'row', justifyContent: 'center',paddingHorizontal: 20, backgroundColor: Colors.gold, borderRadius: 5,  }, stylesGlobal.shadow_style]}
                                onPress={() => {
                                    // this.setState({show_chat_req_item_modal: false});
                                    this.callRequestChatActionApi("delete", 0);
                                    }}
                            >
                                <Text style={[{ fontSize: 14, color: Colors.white }, stylesGlobal.font]}>Decline Chat</Text>
                            </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            
            </View>
        )
    }


     callRequestChatActionApi = async (type, gold) => {
        //type: type, sender_id: senderId, recipient_id: recipientId, gold: gold
//type: "free", "accept", "delete"
        try {
            this.setState({ loading: true })
            let coin = this.state.pay_amount;
            // console.log("callGetChatRequestAPI sentNotification : ", sentNotification);
            let uri = Memory().env == "LIVE" ? Global.URL_CHAT_REQUEST_ACTION : Global.URL_CHAT_REQUEST_ACTION_DEV;
            // let params = {
            //     "token": this.state.userToken,
            //     "format": "json",
            //     
            //     "type": type,
            //     "sender_id": this.state.chat_req_item.object_id,
            //     "recipient_id": this.state.chat_req_item.user_id,
            //     "gold": gold
            // }

            let params = new FormData();
            params.append("token", this.state.userToken);
            params.append("format", type);
            params.append("sender_id", this.state.chat_req_item.object_id);
            params.append("recipient_id", this.state.chat_req_item.user_id);
            params.append("type", type);
            params.append("gold", gold);

            console.log(TAG + " callRequestChatActionApi uri " + uri);
            console.log(TAG + " callRequestChatActionApi params " + JSON.stringify(params));
            WebService.callServicePost(uri, params, this.handleRequestChatActionApiResponse);
        } catch (error) {
            this.setState({ loading: false })
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    }

    handleRequestChatActionApiResponse = (response, isError) => {
        console.log(TAG + " handleRequestChatActionApiResponse App Response " + JSON.stringify(response));
        console.log(TAG + " handleRequestChatActionApiResponse App isError " + isError);
        if (!isError) {
            var result = response;
            if (typeof result != undefined && result != null) {
                if (result.status == "success") {
                    // this.setState({ sent_chat_reuqest_view: true });
                    this.setState({show_chat_req_item_modal: false})
                } else {
                    Alert.alert('Something went wrong');
                }
            }
        } else {
            if (response != undefined && response != null && response.length > 0) {
                Alert.alert(response.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
        this.setState({ loading: false });
    }


 
    render() {
        return (
         
            <Modal
                animationType="fade"
                transparent={true}
                // closeOnClick={true}
                visible={this.props.showModel}
                onRequestClose={() => { this.props.closeDialog(); }}
                supportedOrientations={['portrait', 'landscape']}
            >
            {this.state.show_chat_req_item_modal && this.renderChatRequestModal()}
                <TouchableWithoutFeedback onPress={() => this.props.closeDialog()}>
                    <View style={[styles.modal_container]}>
                        
                        <View style={[styles.mainContainer, {
                            top: this.state.is_portrait ? getBottomSpace() + STICKY_HEADER_HEIGHT + 5 : STICKY_HEADER_HEIGHT + 25,
                            right: this.state.is_portrait ? STICKY_HEADER_HEIGHT : STICKY_HEADER_HEIGHT * 2,
                        }]}>
                            <View style={styles.triangle} />
                            <View style={styles.viewContainer}>
                                <View style={{ width: '100%', alignItems: 'center', justifyContent: 'center', backgroundColor: '#464646' }}>
                                    <Text style={[styles.name, stylesGlobal.font]}>{"NOTIFICATIONS"}</Text>
                                </View>
                                {
                                    this.state.loading &&
                                    <View style={{ width: '100%', paddingVertical: 15, alignItems: 'center' }}>
                                        <Image style={{ width: 30, height: 30 }} resizeMode={'contain'} source={require("../icons/loader.gif")} />
                                    </View>
                                }
                                {
                                    !this.state.loading && this.state.notification_array.length == 0 &&
                                    <View style={{ paddingTop: 10 }}>
                                        <Text style={[styles.noti_titletext, stylesGlobal.font]}>{"No New Notifications"}</Text>
                                    </View>
                                }
                                {
                                    !this.state.loading && this.state.notification_array.length > 0 &&
                                    <View style={{ width: '100%', maxHeight: Dimensions.get('screen').height * 0.5 }}>
                                        <ScrollView style={[{ width: '100%', }]}>
                                            <View flex={1} onStartShouldSetResponder={() => true}>
                                                <FlatList
                                                    style={{ width: '100%' }}
                                                    showsHorizontalScrollIndicator={false}
                                                    showsVerticalScrollIndicator={true}
                                                    data={this.state.notification_array}
                                                    keyExtractor={(item, index) => index.toString()}
                                                    renderItem={({ item, index }) => (
                                                        <View key={index} style={{ width: '100%', paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center' }}>
                                                            <View style={{ width: '100%', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: Colors.gold, flexDirection: 'row' }}>
                                                                <TouchableOpacity style={{ width: 50, height: 50, borderRadius: 25, overflow: 'hidden', backgroundColor: '#999999' }} onPress={() => this.open_profile(item)}>
                                                                    <ImageCompressor style={{ width: 50, height: 50 }} uri={item.thumb_image_path} />
                                                                </TouchableOpacity>
                                                                <TouchableOpacity style={{ flex: 1, justifyContent: 'center', marginLeft: 10 }} onPress={() => this.display_notification_contents(item)}>
                                                                    <Text style={[styles.noti_titletext, stylesGlobal.font, { color: Colors.black }]} numberOfLines={2} renderTruncatedFooter={() => null}>{item.notification_text}</Text>
                                                                </TouchableOpacity>
                                                            </View>
                                                        </View>
                                                    )}
                                                />
                                            </View>
                                            {/* {
                                                this.state.notification_array.map((item, index) => 
                                                <View key = {index} style = {{width: '100%', paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center'}}>
                                                    <View style = {{width: '100%', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: Colors.gold, flexDirection: 'row'}}>
                                                        <TouchableOpacity style = {{width: 50, height: 50, borderRadius: 25, overflow: 'hidden', backgroundColor: '#999999'}} onPress = {() => this.open_profile(item)}>
                                                            <ImageCompressor style = {{width: 50, height: 50}} uri = {item.thumb_image_path}/>
                                                        </TouchableOpacity>
                                                        <TouchableOpacity style = {{flex: 1, justifyContent: 'center', marginLeft: 10}} onPress = {() => this.display_notification_contents(item)}>
                                                            <Text style = {[styles.noti_titletext, stylesGlobal.font, {color: Colors.black}]} numberOfLines = {2} renderTruncatedFooter = {() => null}>{item.notification_text}</Text>
                                                        </TouchableOpacity>
                                                    </View>
                                                </View>
                                                )
                                            } */}
                                        </ScrollView>
                                    </View>
                                }
                                <TouchableOpacity 
                                    style={[{ paddingVertical: 10, paddingHorizontal: 10, backgroundColor: Colors.gold, marginVertical: 15, borderRadius: 5 }, stylesGlobal.shadow_style]} 
                                    onPress={() => this.open_notification_link()}>
                                    <Text style={[styles.noti_titletext, stylesGlobal.font, { color: Colors.white }]}>{"View All Notifications"}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                    
                </TouchableWithoutFeedback>
                    
            </Modal>
            
        );
    }
}
const styles = StyleSheet.create({
    modal_container: {
        flex: 1,
        justifyContent: 'center',
        paddingRight: 5,
        backgroundColor: Colors.transparent,
        ...Platform.select({
            ios: {

                borderRadius: 10,
            },
            android: {

                elevation: 24,
                borderRadius: 5,
            },
        }),
    },
    mainContainer: {
        width: containerWidth,
        backgroundColor: Colors.transparent,
        position: 'absolute',
    },
    viewContainer: {
        width: containerWidth,
        overflow: "hidden",
        backgroundColor: '#fbf7ec',
        alignItems: 'center',
        borderRadius: 5,

    },
    triangle: {
        alignSelf: 'flex-end',
        marginRight: isIphoneX ? 24 : 3,
        width: 0,
        height: 0,
        backgroundColor: 'transparent',
        borderStyle: 'solid',
        borderLeftWidth: 8,
        borderRightWidth: 8,
        borderBottomWidth: 11,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderBottomColor: Colors.lightGray
    },
    main_titletext: {
        fontSize: 14,
        color: Colors.gold,
    },
    separator_line: {
        width: '95%',
        height: 0.5,
        backgroundColor: '#000000',
        marginBottom: 5
    },
    noti_titletext: {
        fontSize: 12,
        color: Colors.black,
    },
    name: {
        color: Colors.gold,
        fontSize: 14,
        backgroundColor: Colors.transparent,
        alignSelf: "center",
        marginVertical: 5,
    },
    imageContainer: {
        marginTop: 5,
        width: imageWidth,
        height: imageWidth,
        backgroundColor: Colors.white,
        borderRadius: imageWidth / 2,
        alignSelf: "center",
        overflow: "hidden",
    },
    image: {
        overflow: "hidden",
        width: imageWidth,
        height: imageWidth,
        borderRadius: imageWidth / 2
    },
    imageCircle: {
        position: 'absolute',
        top: -(imageWidth / 2),
        bottom: -(imageWidth / 2),
        right: -(imageWidth / 2),
        left: -(imageWidth / 2),
        borderRadius: imageWidth / 2 + imageWidth / 4,
        borderWidth: (imageWidth / 2),
        borderColor: Colors.lightGray
    },
    labelView: {
        flexDirection: "row",
        backgroundColor: Colors.transparent,
        paddingBottom: 4,
        paddingTop: 4,
        alignItems: "center"
    },
    label: {
        color: Colors.gold,
        fontSize: 14,
        backgroundColor: Colors.transparent
    },
    divider: {
        backgroundColor: Colors.gray,
        width: containerWidth - 10,
        marginTop: 1,
        marginBottom: 1,
        height: 0.5

    },
    blackDivider: {
        backgroundColor: Colors.black,
        width: containerWidth,
        height: 0.5,
        // marginTop: 10
    },
    viewGray: {
        backgroundColor: Colors.gray,
        width: containerWidth,
        height: 50,
        borderBottomRightRadius: 5,
        borderBottomLeftRadius: 5,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center'
    },
    logoutView: {
        backgroundColor: Colors.white,
        margin: 4,
        padding: 10,
        width: containerWidth / 2 - 20,
        justifyContent: 'center',
        alignItems: 'center'
    },
    profileView: {
        backgroundColor: Colors.gold,
        marginLeft: 4,
        marginTop: 4,
        marginBottom: 4,
        marginRight: 10,
        padding: 10,
        justifyContent: 'center',
        alignItems: 'center',
        width: (containerWidth / 2) - 20,
        borderRadius: 5
    },
    textLogout: {
        fontSize: 11,
        color: Colors.black,
        textAlign: 'center',
    },
    textMyProfile: {
        fontSize: 10,
        color: Colors.white,
        textAlign: 'center',
    },
    account_linktext: {
        fontSize: 14,
        color: Colors.gold,
        fontWeight: 'bold'
    },
    triangle: {
        alignSelf: 'flex-end',
        marginRight: isIphoneX ? 24 : 3,
        width: 0,
        height: 0,
        backgroundColor: 'transparent',
        borderStyle: 'solid',
        borderLeftWidth: 8,
        borderRightWidth: 8,
        borderBottomWidth: 11,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderBottomColor: Colors.lightGray
    },
    link_button_view: {
        width: '100%',
        borderBottomWidth: 0.5,
        borderColor: Colors.gray,
        padding: 5,
        alignItems: 'center'
    },


    container_modal: {
        position: 'absolute',
        top: 0,
        left: 0,
        alignItems: 'center',
        zIndex: 100,
        width: '100%',
        height: '100%',
        
        display: 'flex',
        alignItems: 'center',
        flexDirection: 'column',
        justifyContent: 'center'

    },
    emptyView: {
        backgroundColor: Colors.white,
        justifyContent: "center",
        height: "100%",
        alignItems: "center",
        alignContent: "center",
        flexDirection: "row",
    },
    container_modal_back: {
        width: '100%',
        height: '100%',
        position: 'absolute',
        top: 0,
        left: 0,
        backgroundColor: Colors.black,
        opacity: 0.2
    },
    userImageContainer: {
        backgroundColor: Colors.gray,
        width: imageSize,
        height: imageSize,
        borderRadius: imageSize / 2,
        // overflow: 'hidden',
    },
    userImage: {
        overflow: 'hidden',
        backgroundColor: Colors.white,
        borderRadius: imageSize / 2,
        width: imageSize,
        height: imageSize
    },
    userImageCirle: {
        position: 'absolute',
        top: -(imageSize / 2),
        bottom: -(imageSize / 2),
        right: -(imageSize / 2),
        left: -(imageSize / 2),
        borderRadius: imageSize / 2 + imageSize / 4,
        borderWidth: (imageSize / 2),
        borderColor: Colors.white
    },
    expiry_text: {
        
        borderWidth: .5,
        paddingLeft: 3,
        paddingTop: 5,
        paddingBottom: 5,
        borderRadius: 3,

    }


});

