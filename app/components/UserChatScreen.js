import React, { Component, Fragment} from "react";
import {
    Dimensions,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    FlatList,
    TextInput,
    BackHandler,
    Platform,
    Alert,
    Modal,
    Keyboard,
    ActivityIndicator,
    Linking,
    ScrollView,
    KeyboardAvoidingView
} from "react-native";  
import { EventRegister } from 'react-native-event-listeners';
import ActionSheet from 'react-native-actionsheet';
import AsyncStorage from '@react-native-community/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TouchableOpacity as TouchableOpacity2 } from 'react-native-gesture-handler'
import ImagePicker from 'react-native-image-picker';
import ImageResizer from 'react-native-image-resizer';

import Moment, { max } from "moment/moment";
import { ImageCompressor } from './ImageCompressorClass';
import ProgressIndicator from "./ProgressIndicator";
import WebService from "../core/WebService";
import { Constants } from "../consts/Constants";
import { Colors } from "../consts/Colors";
import * as Global from "../consts/Global";
import RowChat from "./RowChat";
import Emojis from '../customview/Emojis';
import Memory from "../core/Memory";
import { extendMoment } from "moment-range";


import CustomReportPopupView from '../customview/CustomReportPopupView';
import { stylesGlobal, STICKY_HEADER_HEIGHT } from '../consts/StyleSheet';
import BannerView from "../customview/BannerView";
import { isIphoneX, getBottomSpace } from '../custom_components/react-native-iphone-x-helper';
import { convertEmojimessagetoString, convertStringtoEmojimessage } from "../utils/Util";
import { fcService } from "../utils/FirebaseChatService";
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { getStatusBarHeight } from 'react-native-status-bar-height';

const { height, width } = Dimensions.get("window");
const isLandscape = height < width;
// const topInset = Platform.OS == "ios" ? isIphoneX ? 44 : 0 : 24;
// const bottomInset = Platform.OS == "ios" ? isIphoneX ? 34 : 0 : 0;
// const safeareaview_height = height - topInset - bottomInset - (bottomInset == 0 ? 18 : 0);
// const inputview_height = 50;
let TAG = "UserChatScreen";
let array_chat_message = [];
// let isRefresh = false;
// var preMesssageId;
// let lastMessageId = "";
// let preLastMessageId = 0;
// let preMessageId = "";
// let lastSendMessageId = 0;
var sentNotification = 0;
var imageSize = 36;
var profileUserId = '';
var textinput_height_initial = 30; // initial input text height
let timer = null;
let lastChatId = 0;
let timeStamp = 0;
let sectionList = [];
let previousRecord = false;
let messageIdsList = [];

export default class UserChatScreen extends Component {


    constructor() {
        super();

        console.log('status_Bar_height = ', getStatusBarHeight());

        console.log('isIphoneX  = ', isIphoneX());


        this.state = {
            userId: "",
            userToken: "",
            loading: false,
            user: null,
            dataChatMessage: array_chat_message,
            displayChatMessage: false,
            messageText: "",
            avatarSource: null,
            videoSource: null,
            displayStickerView: false,
            messageLoader: false,
            isFirstTime: false,
            deleteMessageLoading: false,
            displayLoadMoreView: false,
            preMessageText: "",
            showReportModel: false,
            isReloginAlert: false,
            member_plan: '0',
            payment_status: '0',
            chatting_user: null, //  the user json data who is chat
            my_gold_coin: 0,
            coinpermessage: 0,
            textinput_height: 0, // textinput height(according to contents)
            attach_loading: false,

            sent_chat_reuqest_view: false,
            wait_approve_reuqest_view: false,
            received_accept_pay_amount: false,
            top_btn_text: ""
        };
        this.unsubscribe = null;
    }

    UNSAFE_componentWillMount() {
        this.clearStateData();
        this.getData(true);
        this.listener = EventRegister.addEventListener(Constants.EVENT_PROFILE_IMAGE_UPDATED, () => {
            console.log(TAG, "EVENT_PROFILE_IMAGE_UPDATED event called");
        })
    }

    componentDidMount() {
        BackHandler.addEventListener('hardwareBackPress', this.handleBack);
        this.keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', this._keyboardDidShow.bind(this));
        this.keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', this._keyboardDidHide.bind(this));
    }

    componentWillUnmount() {
        clearInterval(this.timer);
        EventRegister.removeEventListener(this.listener)
        BackHandler.removeEventListener('hardwareBackPress', this.handleBack);
        if (this.unsubscribe != undefined && this.unsubscribe != null) {
            console.log(this.unsubscribe, " ------------------------ ");
            this.unsubscribe();
        }
        this.keyboardDidShowListener.remove();
        this.keyboardDidHideListener.remove();
    }

    handleBack = () => {
        // if(this.unsubscribe)
        //     this.unsubscribe();
        this.props.navigation.goBack();
        if (this.props.route.params.refreshList) {
            this.props.route.params.refreshList(true);
        }
        return true;
    };

    _keyboardDidShow(e) {

        this.setState({
            keyboardOffset: e.endCoordinates.height,
            keyboardShwon: true,
        })

        setTimeout(() => {
           // this.scrollToEnd();
            this.autoScroll();
            if(this.scrollKeyboardView)
                this.scrollKeyboardView.scrollToEnd();
        }, 200);

        

        //return;
        // let keyboardHeight = e.endCoordinates.height;
        // console.log('keyboardHeight = =', keyboardHeight);
        // this.setState({keyboardHeight_: 20})
    }

    _keyboardDidHide(e) {
        // setTimeout(() => {
        //     this.autoScroll();
        //     this.scrollKeyboardView.scrollToEnd();
        // }, 200);
        //return;
        this.setState({keyboardHeight_: 0, keyboardOffset: 0, keyboardShwon: 0})
    }

    clearStateData = () => {
        array_chat_message = [];
        lastChatId = 0;
        this.setState({
            userId: "",
            userToken: "",
            loading: false,
            user: null,
            dataChatMessage: array_chat_message,
            displayChatMessage: false,
            messageText: "",
            displayStickerView: false,
            messageLoader: false,
            isFirstTime: false,
            deleteMessageLoading: false,
            displayLoadMoreView: false,
            preMessageText: "",
            showReportModel: false,
            isReloginAlert: false,
            textinput_height: 0,
        });
    };
    /**
    *  get asysn storage data
    */
    getData = async (isLoader) => {
        try {
            var userId = await AsyncStorage.getItem(Constants.KEY_USER_ID);
            var userToken = await AsyncStorage.getItem(Constants.KEY_USER_TOKEN);
            var member_plan = await AsyncStorage.getItem(Constants.KEY_MEMBER_PLAN);
            var payment_status = await AsyncStorage.getItem(Constants.KEY_PAYMENT_STATUS);
            var my_gold_coins_str = await AsyncStorage.getItem(Constants.KEY_GOLD_COINS);
            var userSlug = await AsyncStorage.getItem(Constants.KEY_USER_SLUG);
            var receive_user = this.props.route.params.user;
            profileUserId = receive_user.id
            preMesssageId = this.props.route.params.messageId;
            var storemessage_key = userId + "-" + profileUserId;
            var saved_message = await AsyncStorage.getItem(storemessage_key);
            if (saved_message == null) {
                saved_message = "";
            }
            this.setState({
                userId: userId,
                userToken: userToken,
                userSlug: userSlug,
                receive_user: receive_user,
                member_plan: member_plan,
                payment_status: payment_status,
                my_gold_coin: parseInt(my_gold_coins_str, 10),
                messageText: saved_message,
                top_btn_text: this.state.dataChatMessage.length < 10 ? "No More messages" : "Load Earlier Messages"
            }, () => {
                this.callMemberStatusApi();
            });

            
            
            this.callProfileDetailAPI();
            await this.callGetAPIs(true);
        } catch (error) {
            // Error retrieving data
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    };

    callMemberStatusApi = async () => {
        this.setState({
                loading: true
            });
        let uri = Memory().env == "LIVE" ? Global.URL_GET_CHAT_USERS_INFO : Global.URL_GET_CHAT_USERS_INFO_DEV;
        let params = { "format": "json", "memberUserIDs": [this.state.receive_user.id] };
        let memberUserDatas = await WebService.callChatUserServicePost(uri, params);
        console.log(TAG, 'callMemberStatusApi response = ', JSON.stringify(memberUserDatas));
        if(memberUserDatas.data.length > 0)
        {

            this.setState({last_loginedin: memberUserDatas.data[0].last_lognedin});
        }

        this.setState({
                loading: false
        });
    }

    callGetAPIs = async (isLoader) => {
        try {
            this.setState({ isFirstTime: isLoader });
            let grpId = this.state.receive_user.grpId;

            console.log('-------> callGetAPIs333333', this.state.receive_user, this.state.userId, );

            this.unsubscribe = fcService.getMessages(this.state.receive_user, this.state.userId, this.handleMessageListGUI);
           
            
            console.log(this.unsubscribe)
        } catch (error) {
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    }

    handleMessageListGUI = (messageList) => {

        //console.log(TAG, 'msg from fcm11112224444422244444', JSON.stringify(messageList));


        let msgData = [];
        let tempDate = '';
        messageList.map((val) => {
            let date = '';
            let msgDate = Moment(val.sent_at.toDate()).format('YYYY-MM-DD');
            let currentDate = Moment(new Date()).format('YYYY-MM-DD');
            if (msgDate == currentDate) {
                date = 'Today';
            } else {
                date = `${val.sent_at.toDate().toString().split(' ')[1]} ${val.sent_at.toDate().toString().split(' ')[2]} ${val.sent_at.toDate().toString().split(' ')[3]}`;
            }
            if (date != tempDate) {
                tempDate = date;
                var record = {
                    id: new Date().getTime().toString() + val.id.toString(),
                    message: date,
                    slug: this.state.userId,
                    sent: 0,
                    fromid: this.state.userId,
                    first_name: "",
                    last_name: "",
                    imgpath: "",
                    type: "section",
                    from: "Me",
                    chatroomid: "",
                    read: 0
                };
                msgData.push(record);
            }

            if(val.is_read == 0)
                {
                    console.log('is_read 33333== 0    ', val);
                }

            
            if (val.is_read == 0 && (val.sent_by_user_id != this.state.userId.toString() || val.self !== 1)) {
                console.log(TAG, 'handleMessageListGUI result update read mark2223333', val);
                fcService.updateMsgToRead(val, this.state.receive_user);
            }
            msgData.push(val);

            //console.log('--------> userchatscreen', msgData)
        });
        this.setState({
            dataChatMessage: msgData,
            displayChatMessage: true,
            displayLoadMoreView: true,
            top_btn_text: msgData.length < 10 ? "No More messages" : "Load Earlier Messages"
        });
        setTimeout(() => this.autoScroll(), 250);
    };

    callLoadMoreMessages = () => {


        try {
            if (!this.state.deleteMessageLoading) {
                this.setState({ deleteMessageLoading: true });
                fcService.loadMessages(this.state.receive_user, this.state.userId, this.handleCallLoadMoreMessages);

                 
            }else{

                console.log('-----------s')
                this.setState({
                    
                    top_btn_text: "No More messages" 
                });
            }
        } catch (error) {

             this.setState({
                    
                    top_btn_text: "No More messages" 
                });

            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
            this.setState({ deleteMessageLoading: false });
        }
    }

    handleCallLoadMoreMessages = async (messageList) => {
        let msgData = [];
        let tempDate = '';
        // console.log(" ------ messageList ", messageList.length);
        if (messageList.length > 0) {
            let dataChatMessage = [...this.state.dataChatMessage];
            messageList.map((val) => {
                let exist_flag = false;
                for (let i = 0; i < dataChatMessage.length; i++) {
                    if (val.id == dataChatMessage[i]) {
                        exist_flag = true;
                    }
                }
                if (!exist_flag) {
                    let date = '';
                    let msgDate = Moment(val.sent_at.toDate()).format('YYYY-MM-DD');
                    let currentDate = Moment(new Date()).format('YYYY-MM-DD');
                    if (msgDate == currentDate) {
                        date = 'Today';
                    } else {
                        date = `${val.sent_at.toDate().toString().split(' ')[1]} ${val.sent_at.toDate().toString().split(' ')[2]} ${val.sent_at.toDate().toString().split(' ')[3]}`;
                    }
                    if (date != tempDate) {
                        tempDate = date;
                        var record = {
                            id: new Date().getTime().toString() + val.id.toString(),
                            message: date,
                            slug: this.state.userId,
                            sent: 0,
                            fromid: this.state.userId,
                            first_name: "",
                            last_name: "",
                            imgpath: "",
                            type: "section",
                            from: "Me",
                            chatroomid: "",
                            read: 0
                        };
                        msgData.push(record);
                    }
                    msgData.push(val);
                }
            });
            for (let i = 0; i < dataChatMessage.length; i++) {
                msgData.push(dataChatMessage[i]);
                // this.setState({ dataChatMessage: [msgData[i], ...this.state.dataChatMessage] })
            }

            console.log('----------------');

            this.setState({ 
                dataChatMessage: msgData, 
               });
        }else{
            console.log('00000000000000000');
        }
        this.setState({
            deleteMessageLoading: false,
            displayChatMessage: true,
            displayLoadMoreView: true
        });
    }

    callReceiverProfileDetailAPI = async () => {
        try {
            this.setState({ attach_loading: true });
            let uri = Memory().env == "LIVE" ? Global.URL_MY_PROFILE_DETAIL + this.state.receive_user.slug : Global.URL_MY_PROFILE_DETAIL_DEV + this.state.receive_user.slug;
            //let uri = Memory().env == "LIVE" ? Global.URL_MY_PROFILE_DETAIL + this.state.userSlug : Global.URL_MY_PROFILE_DETAIL_DEV + this.state.userSlug;
            let params = new FormData();
            params.append("token", this.state.userToken);
            params.append("user_id", this.state.receive_user.id);
            params.append("format", "json");
            console.log(TAG + " callReceiverProfileDetailAPI uri " + uri);
            console.log(TAG + " callReceiverProfileDetailAPI params " + JSON.stringify(params));
            WebService.callServicePost(uri, params, this.handleGetReceiverProfileDetailResponse);
        } catch (error) {
            this.setState({ attach_loading: false });
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    };


    // Handle  Profile Data
    handleGetReceiverProfileDetailResponse = (response, isError) => {
        // let getfromAsyncstroage = AsyncStorage.getItem(Constants.KEY_MY_PROFILE);
        // console.log(TAG + " callProfileDetailAPI Response : " + JSON.stringify(response));
        console.log(TAG + " callReceiverProfileDetailAPI isError : " + isError);
        if (!isError) {
            try {
                var result = response;
                if (typeof result != "undefined" && result != undefined && result != null) {
                    if (typeof result.data != "undefined" && result.data != undefined && result.data != null) {
                        myProfileData = result.data;

                        this.setState({ receiverProfile: myProfileData });
                    } else {
                        if (result.msg) {
                            Alert.alert(result.msg.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
                            // if(this.unsubscribe)
                            //     this.unsubscribe();
                            this.props.navigation.goBack();
                        } else {
                            Alert.alert('Something went wrong');
                        }
                    }
                }
            } catch (error) {
                if (error != undefined && error != null && error.length > 0) {
                    Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
                }
            }
        } else {
            if (response != undefined && response != null && response.length > 0) {
                Alert.alert(response.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
        this.setState({ attach_loading: false });
    };

    callProfileDetailAPI = async () => {
        try {
            this.setState({ attach_loading: true });
            //let uri = Memory().env == "LIVE" ? Global.URL_MY_PROFILE_DETAIL + this.state.receive_user.slug : Global.URL_MY_PROFILE_DETAIL_DEV + this.state.receive_user.slug;
            let uri = Memory().env == "LIVE" ? Global.URL_MY_PROFILE_DETAIL + this.state.userSlug : Global.URL_MY_PROFILE_DETAIL_DEV + this.state.userSlug;
            let params = new FormData();
            params.append("token", this.state.userToken);
            params.append("user_id", this.state.userId);
            params.append("format", "json");
            console.log(TAG + " callProfileDetailAPI uri " + uri);
            console.log(TAG + " callProfileDetailAPI params " + JSON.stringify(params));
            WebService.callServicePost(uri, params, this.handleGetProfileDetailResponse);
        } catch (error) {
            this.setState({ attach_loading: false });
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    };

    // Handle  Profile Data
    handleGetProfileDetailResponse = (response, isError) => {
        // let getfromAsyncstroage = AsyncStorage.getItem(Constants.KEY_MY_PROFILE);
        console.log(TAG + " callProfileDetailAPI Response : " + JSON.stringify(response));
        console.log(TAG + " callProfileDetailAPI isError : " + isError);
        let hideLoaing = false;
        if (!isError) {
            try {
                var result = response;
                if (typeof result != "undefined" && result != undefined && result != null) {
                    if (typeof result.data != "undefined" && result.data != undefined && result.data != null) {
                        myProfileData = result.data;
                        this.setState({ chatting_user: myProfileData });

                        this.callReceiverProfileDetailAPI();
                    } else {
                        if (result.msg) {
                            Alert.alert(result.msg.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
                            // if(this.unsubscribe)
                            //     this.unsubscribe();
                            this.props.navigation.goBack();
                        } else {
                            Alert.alert('Something went wrong');
                        }

                        hideLoaing = true;
                    }
                }
            } catch (error) {
                if (error != undefined && error != null && error.length > 0) {
                    Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
                }
                hideLoaing = true;
            }
        } else {
            if (response != undefined && response != null && response.length > 0) {
                Alert.alert(response.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
            hideLoaing = true;
        }
        if(hideLoaing)
            this.setState({ attach_loading: false });
    };

    /**
    *  get last message id
    */
    getPreMessageId = (dataList) => {
        if (dataList.length > 0) {
            preLastMessageId = dataList[dataList.length - 1].id;
        } else {
            preLastMessageId = 0;
        }
    }

    /**
    *  send attachement button click
    */
    sendAttachment = async () => {
        var options = {
            title: 'Select Image',
            mediaType: 'photo',
            quality: 1.0,
            allowsEditing: false,
            noData: true,
            storageOptions: {
                skipBackup: true,
                path: 'images'
            }
        };
        ImagePicker.showImagePicker(options, (response) => {
            //launchImageLibrary(options, (response) => {
            console.log('Response = ', response);
            if (response.didCancel) {
                console.log('User cancelled image picker');
            } else if (response.error) {
                console.log('ImagePicker Error: ', response.error);
            } else if (response.customButton) {
                console.log('User tapped custom button: ', response.customButton);
            } else {
                this.setState({ attach_loading: true });
                let uri = response.uri;
                Image.getSize(uri, (width, height) => {
                    var newwidth = 0, newheight = 0;
                    if (width > 2000 || height > 2000) {
                        if (width > height) {
                            newwidth = 2000;
                            newheight = height * 2000 / width
                        } else {
                            newheight = 2000;
                            newwidth = width * 2000 / height
                        }
                        ImageResizer.createResizedImage(uri, newwidth, newheight, 'JPEG', 90)
                            .then(({ uri }) => {
                                let filename = uri.substring(uri.lastIndexOf('/') + 1);
                                let uploadUri = Platform.OS === 'ios' ? uri.replace('file://', '') : uri;
                                this.callSendAttachmentAPI(uploadUri, filename);
                            })
                            .catch(err => {
                                console.log(" ImageResizer.createResizedImage : ", err);

                            });
                    } else {
                        let filename = uri.substring(uri.lastIndexOf('/') + 1);
                        let uploadUri = Platform.OS === 'ios' ? uri.replace('file://', '') : uri;
                        this.callSendAttachmentAPI(uploadUri, filename);
                    }
                });
            }
        });
    };
    /*
    * call send attachment API
    */
    callSendAttachmentAPI = async (fileUri, fileName) => {

        console.log('create user chat ------------> 0');
        try {
            let grpId = this.state.receive_user.grpId;
            if (grpId) {
                grpId = this.state.receive_user.grpId;
            } else {
                grpId = await fcService.createChat(this.state.receive_user.id, this.state.userId);
                var receive_user = this.state.receive_user;
                receive_user.grpId = grpId;

                this.setState({receive_user: receive_user},  () => {
                    if(!this.unsubscribe)
                        this.unsubscribe = fcService.getMessages(this.state.receive_user, this.state.userId, this.handleMessageListGUI);
                })
            }
            let url = await fcService.sendAttachmentFile(grpId, fileUri, fileName);
            if (url) {
                // console.log(" ------ attachment url : ", url);
                let messageParams = {
                    attachment_field: url,
                    sent_at: new Date(),
                    sent_by_user_id: this.state.userId.toString(),
                    is_read: 0
                };
                fcService.sendMessage(messageParams, grpId);
                if (sentNotification == 0) {
                    this.callSendMessagesNotificationAPI();
                }
                this.callSaveNewMessagesAPI();
                console.log(" sentNotification : before ------------------- : ", sentNotification, this.state.receive_user.id);
                this.callSendMessagesNotificationAppAPI();
                this.setState({
                    messageText: "", preMessageText: ""
                });
            } else {
                Alert.alert(" Get error to upload/send image file ");
            }
        } catch (error) {
            console.log(TAG + " callSendAttachmentAPI error " + error);
            this.setState({
                messageLoader: false
            });
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
        this.setState({ attach_loading: false });
    };
    /**
    *  handle send attechment API response
    */
    handleSendAttachmentResponse = (response, isError) => {
        console.log(TAG + " Response " + response);
        console.log(TAG + " isError " + isError);
        if (!isError) {
            var result = response;
            if (typeof result != "undefined" && result != null) {
                console.log(TAG + " callSendAttachmentAPI result " + JSON.stringify(result));
                this.setState({
                    messageText: "",
                    preMessageText: ""
                });
                // this.refreshCharList();
            }
        } else {
            if (response != undefined && response != null && response.length > 0) {
                Alert.alert(response.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
        this.setState({
            messageLoader: false
        });
    };
    /*
   * call Report API
   */
    callReportAPI = async (desc) => {
        try {
            this.setState({
                loading: true
            });
            let uri = Memory().env == "LIVE" ? Global.URL_REPORT_USERS : Global.URL_REPORT_USERS_DEV
            let params = new FormData();
            params.append("token", this.state.userToken);
            params.append("user_id", this.state.userId);
            params.append("reported_id", profileUserId)
            params.append("format", "json");
            params.append("type", "user")
            params.append("description", desc);
            console.log(TAG + " callFeedReportAPI uri " + uri);
            console.log(TAG + " callFeedReportAPI params " + JSON.stringify(params));

            WebService.callServicePost(
                uri,
                params,
                this.handleReportResponse
            );
        } catch (error) {
            this.setState({
                loading: false
            });
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    };
    /**
    * handle Report API response
    */
    handleReportResponse = (response, isError) => {
        // console.log(TAG + " Response " + response);
        console.log(TAG + " isError " + isError);
        if (!isError) {
            var result = response;
            if (typeof result != undefined && result != null) {
                console.log(TAG + " callReportAPI result " + JSON.stringify(result));
                if (typeof result.msg != undefined && result.msg != null) {
                    //      Alert.alert(result.msg)
                    if (result.status == 'success') {
                        Alert.alert(
                            'Thank You',
                            result.msg,
                            [
                                { text: 'OK', onPress: () => { } },
                            ],
                            { cancelable: true }
                        )
                    }
                    else {
                        Alert.alert(result.msg)
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
    };
    /*
     * call Block API
     */
    callBlockAPI = async () => {
        try {
            this.setState({ loading: true });
            let uri = Memory().env == "LIVE" ? Global.URL_BLOCK_USERS : Global.URL_BLOCK_USERS_DEV
            let params = new FormData();
            params.append("token", this.state.userToken);
            params.append("user_id", this.state.userId);
            params.append("blocked_id", profileUserId)
            params.append("format", "json");
            console.log(TAG + " callBlockAPI uri " + uri);
            console.log(TAG + " callBlockAPI params " + JSON.stringify(params));
            WebService.callServicePost(uri, params, this.handleBlockResponse);
        } catch (error) {
            this.setState({ loading: false });
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    };
    /**
    * handle Block API response
    */
    handleBlockResponse = (response, isError) => {
        console.log(TAG + " Response " + response);
        console.log(TAG + " isError " + isError);

        if (!isError) {
            var result = response;
            if (typeof result != undefined && result != null) {
                console.log(TAG + " callBlockAPI result " + JSON.stringify(result));
                if (typeof result.msg != undefined && result.msg != null) {
                    Alert.alert(result.msg.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""))
                    this.props.navigation.navigate("Dashboard")

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
    };

    autoScroll() {

        console.log(TAG, 'autoscroll');
        if (this.myList) {
            this.myList.scrollToEnd({ animated: false });
        }
    }

    render() {
        return (
            <>
                <SafeAreaView edges={["top"]} style={{ flex: 0, backgroundColor: "black" }}/>
                <SafeAreaView style={{ flex: 1, backgroundColor: !isLandscape ? 'lightgray' : 'black'}}   edges={["left", "right", "bottom"]}
                    onLayout={(event) => {
                        var tmpLayout = event.nativeEvent.layout;
                        if(height - tmpLayout.height > 0)
                        {
                            this.setState({extraScrollHeight: (height - tmpLayout.height)})
                        }
                    }}
                >
                    <View style={{ flex: 1, width: '100%', }} ref="root">
                        {this.renderHeaderView()}
                        {this.renderBannerView()}
                        {this.state.loading == false ? this.renderMainView() : null}
                        <KeyboardAvoidingView 
                            // style={{ flex: 1, width: '100%', }} 

                             extraScrollHeight={!isLandscape ? this.state.extraScrollHeight > 0 ?  Platform.OS === "ios" ? -1 * this.state.extraScrollHeight : 0 : null : null }
// 
//                             contentContainerStyle={{ flexGrow: 1 }}
//                             contentContainerStyle={{ flex: 1 }} 
//                             
                            behavior={Platform.OS === "ios" ? "padding" : null} 
                            
                            keyboardShouldPersistTaps="handled"
                            innerRef={ref => {
                                this.scrollKeyboardView = ref
                              }}
                            enabled>
                            {this.state.displayStickerView == false && this.state.loading == false ? this.renderBottomView() : null}
                        {/* </KeyboardAwareScrollView> */}
                        </KeyboardAvoidingView>
                        {/* {this.state.loading == false ? this.renderReportPopupView():null} */}
                        {/* {this.state.loading == true ? <ProgressIndicator /> : null} */}
                        {/* {this.state.deleteMessageLoading == true ? <ProgressIndicator /> : null} */}
                        {this.renderActionSheet()}
                    </View>
                    {
                        this.state.upgrade_plan_modal && this.renderUpgradeModal()
                    }
                    {
                        this.state.gold_coin_message_view && this.renderSendMessageCheckModal()
                    }
                    {
                        this.state.sent_chat_reuqest_view && this.renderSentChatRequestModal()
                    }
                    {
                        this.state.wait_approve_reuqest_view && this.renderWaitApproveModal()
                    }
                    {
                        this.state.received_accept_pay_amount && this.renderSendGoldModal()
                    }
                    {this.state.attach_loading == true ? <ProgressIndicator /> : null}
                </SafeAreaView>
            </>
            
        )
    }

    renderBannerView = () => {
        return (
            <BannerView
                screenProps={this.props.navigation}
            />
        )
    }

    renderActionSheet = () => {
        return (
            <ActionSheet
                ref={o => this.ActionSheet = o}
                title={'Choose an option'}
                options={['Block', 'Report', 'Cancel']}
                cancelButtonIndex={2}
                onPress={(index) => {
                    console.log(TAG, "index " + index)
                    if (index == 0) {
                        this.setState({
                            reportData: null

                        }, () => {
                            this.displayBlockUserDialog();
                        })
                    } else if (index == 1) {
                        this.setReportModalVisible(true)
                        // this.props.navigation.navigate("ReportFlag", {
                        //     data: this.state.reportData,
                        //     user: this.state.receive_user
                        // });
                    } else {
                        this.setState({
                            reportData: null
                        })
                    }
                }}
            />
        )
    }

    /**
    * Display block user comfirmation alert
    */
    displayBlockUserDialog = () => {
        var user = this.state.receive_user;
        var name = user.first_name;
        let title = Constants.LABEL_BLOCK_TITLE.format(name);
        let message = Constants.LABEL_BLOCK_MESSAGE.format(name);
        Alert.alert(title, message,
            [
                {
                    text: 'Block', onPress: () => {
                        { this.callBlockAPI() }
                    }
                },
                {
                    text: 'Cancel', onPress: () => {

                    }
                }],
            { cancelable: false })
    }

    /**
    * repor flag button click
    */
    showReportFlag = () => {
        this.ActionSheet.show()
    }

    setReportModalVisible(visible) {
        this.setState({ showReportModel: visible });
    }

    renderAttachImageView = () => {
        return (
            <>
                {/* Modal */}
                <View style={{ opacity: 0 }}>
                    <Modal
                        animationType={"fade"}
                        style={{ margin: 0 }}
                        visible={false}
                        onRequestClose={() => { console.log("Modal has been closed.") }}>
                        <View style={{ backgroundColor: 'rgba(52, 52, 52, 0.8)', height: '100%' }}>
                            <View style={{ backgroundColor: 'white', margin: 20, padding: 8, top: 220 }}>
                                <Text style={{ fontSize: 25, top: 4, marginLeft: 20, fontWeight: '500' }}>Select Image</Text>
                                <View style={{ marginTop: 10 }}>
                                    <TouchableOpacity2
                                        onPress={() => this.showCameraPicker()}
                                        style={{ margin: 15 }}
                                    >
                                        <View >
                                            <Text style={{ fontSize: 20, marginLeft: 4, color: 'black', top: 4, }}>Take Photo...</Text>
                                        </View>
                                    </TouchableOpacity2>
                                    <TouchableOpacity2
                                        onPress={() => { this.showImagePicker(); }}
                                        style={{ margin: 15, zIndex: 10 }}
                                    >
                                        <View >
                                            <Text style={{ fontSize: 20, marginLeft: 4, color: 'black', top: 4, }}>Choose from Library...</Text>
                                        </View>
                                    </TouchableOpacity2>
                                    <View style={{ alignItems: 'flex-end' }}>
                                        <TouchableOpacity2
                                            onPress={() => {
                                                // this.setState({ isVisible: !this.state.isVisible })
                                            }}
                                            style={{ margin: 15 }}
                                        >
                                            <Text style={{ fontSize: 20, marginLeft: 4, fontWeight: '500' }}>Cancel</Text>
                                        </TouchableOpacity2>
                                    </View>
                                </View>
                            </View>
                        </View>
                    </Modal>
                </View>
                <View style={{ alignItems: 'center', width: '100%', marginTop: 20 }}>
                    <TouchableOpacity style={[styles.profilePhotoCircle, { width: this.state.screen_width * 0.6, aspectRatio: 1, borderRadius: this.state.screen_width * 0.6 / 2 }]}
                        onPress={() => {
                            this.showImagePicker()
                        }}  >
                        {/* {
                            this.state.imageSource == "" &&
                            <View style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' }}>
                                <Image style={{ width: '50%', height: '50%' }} resizeMode={'contain'} source={require("../icons/ic_register_profile_camera.png")} />
                                <Text style={[styles.LabelProfilePictureFileFormatTextStyle, stylesGlobal.font]}>Click to Upload Profile Picture</Text>
                            </View>
                        }
                        {
                            this.state.imageSource != "" &&
                            <Image style={{ width: '100%', height: '100%', resizeMode: 'cover' }} source={{ uri: this.state.imageSource }} />
                        } */}
                    </TouchableOpacity>
                </View>
            </>
        );
    }

    // render PopUp Menu
    renderReportPopupView = () => {
        return (
            <CustomReportPopupView
                showModel={this.state.showReportModel}
                callAPI={this.callReportAPI}
                closeDialog={() => { this.setState({ showReportModel: false }) }}>
            </CustomReportPopupView>

        );
    }

    /**
    *  display top header
    */
    renderHeaderView = () => {
        var user = this.props.route.params.user;
        var fullName = user.first_name + " " + user.last_name;
        // var imageUrl = user.imageUri + user.filename;
        var imageUrl = user.imageUri;
        

        

        return (
            <View style={[stylesGlobal.headerView, { top: 0}]}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TouchableOpacity style={stylesGlobal.header_backbuttonview_style} onPress={() => { this.handleBack() }}>
                        <Image style={stylesGlobal.header_backbuttonicon_style} source={require("../icons/icon_back.png")} />
                    </TouchableOpacity>
                    <TouchableOpacity style={stylesGlobal.header_logoview_style} onPress={() => { clearInterval(this.timer); this.props.navigation.navigate('Dashboard', { logoclick: true }) }}>
                        <Image style={stylesGlobal.header_logo_style} source={require("../icons/logo_new.png")} />
                    </TouchableOpacity>
                    <TouchableOpacity style={[stylesGlobal.header_avatarview_style, { marginLeft: 10 }]}
                        onPress={() => {
                            if (user.slug != undefined && user.slug != null) {
                                this.props.navigation.navigate("ProfileDetail", {
                                    slug: user.slug
                                });
                            } else {
                                console.log(TAG, " slug not found")
                                this.props.navigation.navigate("MyProfile", {
                                    refreshProfileImage: this.refreshProfileImage
                                });
                            }
                        }}
                    >
                        <View style={stylesGlobal.header_avatarsubview_style}>
                            {/* {console.log("imageUrl>>>>>>", imageUrl)} */}
                            <ImageCompressor style={stylesGlobal.header_avatar_style} uri={imageUrl} default={require("../icons/icon_profile_default.png")} />
                        </View>
                    </TouchableOpacity>
                    <View>
                        <TouchableOpacity
                            onPress={() => {
                                if (user.slug != undefined && user.slug != null) {
                                    this.props.navigation.navigate("ProfileDetail", {
                                        slug: user.slug
                                    });
                                } else {
                                    this.props.navigation.navigate("MyProfile", {
                                        refreshProfileImage: this.refreshProfileImage
                                    });
                                }
                            }}
                        >
                            <Text style={[{ color: Colors.gold, fontSize: 14, marginLeft: 10, marginTop: 10, marginRight: 10, marginBottom: 10 }, stylesGlobal.font]}>{fullName}</Text>
                        </TouchableOpacity>

                        {this.state.last_loginedin && this.renderOnlineState()}
                    </View>
                    
                </View>

                <TouchableOpacity style={stylesGlobal.header_rightmenuview_style} onPress={() => this.showReportFlag()}>
                    <Image style={stylesGlobal.header_rightmenuicon_style} source={require("../icons/menu_icon.png")} />
                </TouchableOpacity>
            </View>
        );
    };

    renderOnlineState = () => {
        let onlineStatus = undefined;

        console.log(" this.state.last_loginedin    = ", this.state.last_loginedin);


        if(this.state.last_loginedin && this.state.last_loginedin != null && this.state.last_loginedin != "")
        {
            var current_date = new Date().toISOString();
            const moment = extendMoment(Moment);

            const diff_dates = moment.range(this.state.last_loginedin, current_date);

            console.log(" this.state.last_loginedin difftime   = ", diff_dates.diff('minutes'), this.state.last_loginedin, current_date);
            if(diff_dates.diff('minutes') <= 5)
            {
                onlineStatus = "Online";
            } 
            else if (diff_dates.diff('days') <= 7)
            {
                onlineStatus = "Last seen " + moment(this.state.last_loginedin).fromNow();
            }else{
                onlineStatus = undefined;
            }
        }

        if(!onlineStatus)
            return <></>

        return <>
                    {
                        onlineStatus === "Online" ? 
                            <Text style={[stylesGlobal.font, {color: Colors.gold, marginLeft: 10, marginTop: -5, marginBottom: 5}]}>
                                {onlineStatus}
                            </Text>
                        :
                            <Text style={[stylesGlobal.font,{color: 'gray', marginLeft: 10, marginTop: -8, marginBottom: 5}]}>
                                {onlineStatus}
                            </Text>

                    }
                </>


    }

    refreshProfileImage = async () => {

    }

    renderMainView = () => {
        return (
           <View style={{ flex: 1, backgroundColor: Colors.white, paddingBottom: !isLandscape ? 50 : 0 }}>
                {this.state.displayChatMessage == true
                    ? this.renderChatMessageList()
                    : null}
                </View>
            
        );
    };

    renderBottomView = () => {
        return (
            <View 
                style={{ 
                    bottom: this.state.keyboardShwon ?  this.state.extraScrollHeight ? this.state.extraScrollHeight : 20 : 0, 
                    flexDirection: 'row',minHeight:50, width: '100%', paddingHorizontal:8, paddingVertical: 8, backgroundColor: 'lightgray', borderTopColor: 'gray', borderTopWidth: 1 }}>
                <View style={{ flex: 1, flexDirection: 'row', borderColor: 'gray', borderWidth: 1, padding: 5, borderRadius: 4, backgroundColor: 'white'}}>
                    <View style={{ flex: 15, backgroundColor: "white", display: 'flex', justifyContent: 'center',  }}>
                        <TextInput
                            ref='messageTextInput'
                            underlineColorAndroid="transparent"
                            blurOnSubmit={false}
                            autoFocus={false}
                            autoCorrect={true}

                            textContentType={'oneTimeCode'}
                            style={
                                [styles.messageTextInput, 
                                {  
                                    padding: 0,
                                    minHeight: 27,
                                   
                                    maxHeight: 120,
                                }, stylesGlobal.font]}
                            onChangeText={async (messageText) => {
                                let message = this.processOnMessage(messageText)
                                this.setState({
                                    messageText: messageText,
                                    preMessageText: message
                                });

                                ;


                                if(this.scrollKeyboardView)
                                    this.scrollKeyboardView.scrollToEnd();

                                try {
                                    var storemessage_key = this.state.userId + "-" + this.state.receive_user.id;
                                    AsyncStorage.setItem(storemessage_key, messageText);
                                } catch (error) {
                                    console, log("chat message save error:::" + error);
                                }
                            }}
                            value={this.state.messageText}
                            defaultValue=""
                            multiline={true}
                            autoCapitalize='sentences'
                            placeholder="Type message..."
                            //onSubmitEditing={this.sendMessage}
                            onContentSizeChange={(event) => {
                                let currentHeight = event.nativeEvent.contentSize.height;
                                // if (currentHeight > 100) {
                                //     currentHeight = 100;
                                // }
                                this.setState({
                                    textinput_height: currentHeight
                                });
                                this.autoScroll();
                                if(this.scrollKeyboardView)
                                    this.scrollKeyboardView.scrollToEnd();
                            }}
                        />
                    </View>
                    <View style={{ flex: 1,  backgroundColor:'white', bottom: 0, float: 'right', flexDirection: 'row' }}>
                        <TouchableOpacity style={[ styles.attachmentButton, {backgroundColor: 'white', flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'flex-start'} ]}
                            onPress={async (event) => {
                                try {
                                    await this.sendAttachment();
                                } catch (error) {
                                    console, log("chat message save error:::" + error);
                                }
                            }}
                        >
                            <Image style={{ width: 20, height: textinput_height_initial * 0.7,resizeMode: 'contain', float: 'right', }} source={require('../icons/attach.png')} />
                        </TouchableOpacity>
                    </View>
                </View>
                
                <View style={{ width: textinput_height_initial, height: textinput_height_initial, marginHorizontal: 10, justifyContent: 'center', alignItems: 'center' }}>
                    {
                        this.state.messageLoader == false &&
                        <TouchableOpacity style={[styles.sendButton]}
                            onPress={async () => {
                                try {
                                    var storemessage_key = this.state.userId + "-" + this.state.receive_user.id;
                                    AsyncStorage.setItem(storemessage_key, "");
                                    // AsyncStorage.setItem(storemessage_key, convertEmojimessagetoString(this.state.messageText));
                                } catch (error) {
                                    console, log("chat message save error:::" + error);
                                }
                                this.sendMessageCheck();
                            }}
                        >
                            <Image style={{ width: '100%', height: textinput_height_initial, resizeMode: 'contain' }} source={require("../icons/chat_send.png")} />
                        </TouchableOpacity>
                    }
                    {
                        this.state.messageLoader == true &&
                        <ActivityIndicator animating={true} color='#cfae45' size="large" style={styles.sendButton} />
                    }
                </View>

            </View>
        );
    };

    /**
    *  display chat message list
    */
    renderChatMessageList = () => {
        let emptyView = (
            <View style={styles.emptyView}>
                {/* <Text
                    style={{
                        backgroundColor: Colors.white,
                        fontSize: 22
                    }}
                >
                    No chat yet.
                </Text> */}
            </View>
        );

        let loadMoreButton = (
            <TouchableOpacity style={styles.loadMoreButtom}>
                {
                    this.state.deleteMessageLoading &&
                    <Image style={{ width: 30, height: 30 }} resizeMode={'contain'} source={require("../icons/loader.gif")} />
                }
                {
                    !this.state.deleteMessageLoading &&
                    <Text style={[styles.loadMoreText, stylesGlobal.font]}>
                        {
                            this.state.top_btn_text
                        }
                    </Text>
                }
            </TouchableOpacity>
        )
        let listView = (
            <FlatList
                // inverted
                // contentContainerStyle={{ flexDirection: 'column-reverse' }}
                ref={(c) => { this.myList = c }}
                data={this.state.dataChatMessage}
                // ListHeaderComponent={(this.state.dataChatMessage.length && this.state.displayLoadMoreView) ? loadMoreButton : null}
                extraData={this.state}
                pagingEnabled={false}
                showsHorizontalScrollIndicator={false}
                showsVerticalScrollIndicator={false}
                keyExtractor={(item, index) => index.toString()}
                initialNumToRender={this.state.dataChatMessage.length}
                onScroll={(event) => {
                    if (event.nativeEvent.contentOffset.y < -10) {
                        // if (event.nativeEvent.contentSize.height - event.nativeEvent.layoutMeasurement.height + 30 <= event.nativeEvent.contentOffset.y && !this.state.deleteMessageLoading && event.nativeEvent.contentOffset.y > event.nativeEvent.layoutMeasurement.height) {
                        this.callLoadMoreMessages();
                    }
                }}
                renderItem={({ item, index }) => (
                    <RowChat
                        navigation={this.props.navigation}
                        data={item}
                        index={index}
                        userId={this.state.userId}
                    />
                )}
                ListFooterComponent={() => (
                    <View style={{ height: 20 }}>
                    </View>
                )}
            />
        );

        return (
            <View style={{ width: '100%', height: "100%", flexDirection: 'column', paddingBottom: isIphoneX() ? 0 : 10, }}>
                {!this.state.dataChatMessage.length ? emptyView : listView}
            </View>
        );
    };

    renderUpgradeModal = () => {
       
        return (
            <View style={{ width: width, height: height, position: 'absolute', top: 0, left: 0, alignItems: 'center', zIndex: 100 }}>
                <View style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, backgroundColor: Colors.black, opacity: 0.2 }}></View>
                <View style={{ width: '90%', marginTop: 60, backgroundColor: Colors.white, borderRadius: 5 }}>
                    <View style={{ width: '100%', padding: 20, display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>

                        
                        <Text style={[{ fontSize: 18, color: Colors.black }, stylesGlobal.font]}>Upgrade Your Account</Text>
                        <TouchableOpacity style={{ margin: 5 }} onPress={() => this.setState({
                                    upgrade_plan_modal: false
                                })}>
                            <Image style={{ width: 20, height: 20, tintColor: Colors.gold }} source={require('../icons/connection-delete.png')} />
                        </TouchableOpacity>
                    </View>
                    <View style={{ width: '100%', padding: 20, borderTopColor: Colors.gray, borderTopWidth: 0.5, borderBottomColor: Colors.gray, borderBottomWidth: 0.5 }}>
                        <Text style={[{ fontSize: 14, color: Colors.black }, stylesGlobal.font]}>
                            Please Upgrade your account in order to send messages to the Inner Circle at The 0.07%
                        </Text>
                    </View>
                    <View style={{ width: '100%', padding: 20, flexDirection: 'row', justifyContent: 'flex-end' }}>
                        <TouchableOpacity style={[{ paddingVertical: 15, paddingHorizontal: 10, backgroundColor: Colors.gold, borderRadius: 5 }, stylesGlobal.shadow_style]}
                            onPress={() => {
                                this.setState({
                                    upgrade_plan_modal: false
                                });

                                 var upgradeData = {
                                    params: null,
                                    userID: this.state.userId,
                                    userToken: this.state.userToken,
                                    operation: 'upgrade',
                                    memberType: '4',
                                }

                                this.props.navigation.navigate('MyAccountScreen', { getDataAgain: this.getDataAgain, initial_tab: "member_plan" });


                                //this.props.navigation.navigate("SignupPaymentScreen", upgradeData);
                                // if (this.state.my_gold_coin > parseInt(coinpermessage.toString(), 10)) {
                                //     this.setState({
                                //         coinpermessage: coinpermessage
                                //     });
                                //     this.sendMessage();
                                // } else {
                                //     this.props.navigation.navigate('MyAccountScreen', { getDataAgain: this.getDataAgain, initial_tab: "buy_goldcoin" });
                                // }
                            }}
                        >
                            <Text style={[{ fontSize: 14, color: Colors.white }, stylesGlobal.font]}>Go to Upgrade</Text>
                        </TouchableOpacity>
                        
                    </View>
                </View>
            </View>
        )
    }

    renderSendMessageCheckModal = () => {
        var chatter_name = this.state.chatting_user.profileData.first_name + " " + this.state.chatting_user.profileData.last_name;
        var coinpermessage = this.state.chatting_user.profileData.user_chat_cost;
        if (coinpermessage == null) {
            coinpermessage = 0;
        }
        return (
            <View style={{ width: width, height: height, position: 'absolute', top: 0, left: 0, alignItems: 'center', zIndex: 100 }}>
                <View style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, backgroundColor: Colors.black, opacity: 0.2 }}></View>
                <View style={{ width: '90%', marginTop: 60, backgroundColor: Colors.white, borderRadius: 5 }}>
                    <View style={{ width: '100%', padding: 20 }}>
                        <Text style={[{ fontSize: 18, color: Colors.black }, stylesGlobal.font]}>Send Message Confirmation</Text>
                    </View>
                    <View style={{ width: '100%', padding: 20, borderTopColor: Colors.gray, borderTopWidth: 0.5, borderBottomColor: Colors.gray, borderBottomWidth: 0.5 }}>
                        <Text style={[{ fontSize: 14, color: Colors.black }, stylesGlobal.font]}>{chatter_name} requests {coinpermessage} gold coins per messages from a non-member. OK?</Text>
                    </View>
                    <View style={{ width: '100%', padding: 20, flexDirection: 'row', justifyContent: 'flex-end' }}>
                        <TouchableOpacity style={[{ paddingVertical: 15, paddingHorizontal: 10, backgroundColor: Colors.gold, borderRadius: 5 }, stylesGlobal.shadow_style]}
                            onPress={() => {
                                this.setState({
                                    gold_coin_message_view: false
                                })
                                if (this.state.my_gold_coin > parseInt(coinpermessage.toString(), 10)) {
                                    this.setState({
                                        coinpermessage: coinpermessage
                                    });
                                    this.sendMessage();
                                } else {
                                    this.props.navigation.navigate('MyAccountScreen', { getDataAgain: this.getDataAgain, initial_tab: "buy_goldcoin" });
                                    // Alert.alert("This feature is only available on the web. Open in web?", "",
                                    // [
                                    //     {text: 'OK', onPress: () => {
                                    //         let link = "https://the007percent.com/my-account";
                                    //         Linking.canOpenURL(link).then(supported => {
                                    //             if (supported) {
                                    //                 Linking.openURL(link);
                                    //             } else {
                                    //                 // alert("asdfasdfas")
                                    //             }
                                    //         });
                                    //     }},
                                    //     {text: 'Cancel', onPress: () => null},
                                    // ],
                                    //     {cancelable: false}
                                    // );
                                }
                            }}
                        >
                            <Text style={[{ fontSize: 14, color: Colors.white }, stylesGlobal.font]}>Accept</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[{ paddingVertical: 15, paddingHorizontal: 10, backgroundColor: Colors.gold, borderRadius: 5, marginLeft: 15 }, stylesGlobal.shadow_style]}
                            onPress={() => this.setState({ gold_coin_message_view: false })}
                        >
                            <Text style={[{ fontSize: 14, color: Colors.white }, stylesGlobal.font]}>Decline</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        )
    }

    renderSentChatRequestModal = () => {
        return (
            <View style={[{ width: width, height: height }, styles.container_modal]}>
                <View style={styles.container_modal_back}></View>
                <View style={{ width: '85%', marginTop: 300, backgroundColor: Colors.white, borderRadius: 10 }}>
                    <View style={{ width: '100%', padding: 20, borderTopColor: Colors.gray, borderTopWidth: 0.5, borderBottomColor: Colors.gray, borderBottomWidth: 0.5 }}>
                        <Text style={[{ fontSize: 14, color: Colors.black }, stylesGlobal.font]}>Your chat request has been sent.</Text>
                    </View>
                    <View style={{ width: '100%', padding: 10, flexDirection: 'row', justifyContent: 'flex-end' }}>
                        <TouchableOpacity style={[{ paddingVertical: 8, paddingHorizontal: 20, backgroundColor: Colors.gold, borderRadius: 5, marginLeft: 15 }, stylesGlobal.shadow_style]}
                            onPress={() => this.setState({ sent_chat_reuqest_view: false })}
                        >
                            <Text style={[{ fontSize: 14, color: Colors.white }, stylesGlobal.font]}>OK</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        )
    }

    renderWaitApproveModal = () => {
        return (
            <View style={[{ width: width, height: height }, styles.container_modal]}>
                <View style={styles.container_modal_back}></View>
                <View style={{ width: '85%', marginTop: 300, backgroundColor: Colors.white, borderRadius: 10 }}>
                    <View style={{ width: '100%', padding: 20, borderTopColor: Colors.gray, borderTopWidth: 0.5, borderBottomColor: Colors.gray, borderBottomWidth: 0.5 }}>
                        <Text style={[{ fontSize: 14, color: Colors.black }, stylesGlobal.font]}>Please wait for recipient to accept your chat request.</Text>
                    </View>
                    <View style={{ width: '100%', padding: 10, flexDirection: 'row', justifyContent: 'flex-end' }}>
                        <TouchableOpacity style={[{ paddingVertical: 8, paddingHorizontal: 20, backgroundColor: Colors.gold, borderRadius: 5, marginLeft: 15 }, stylesGlobal.shadow_style]}
                            onPress={() => this.setState({ wait_approve_reuqest_view: false })}
                        >
                            <Text style={[{ fontSize: 14, color: Colors.white }, stylesGlobal.font]}>OK</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        )
    }

    // GetChatReqest
    callGetChatRequestAPI = () => {
        try {
           this.setState({ attach_loading: true });
            // console.log("callGetChatRequestAPI sentNotification : ", sentNotification);
            let uri = Memory().env == "LIVE" ? Global.URL_GET_CHAT_REQUEST : Global.URL_GET_CHAT_REQUEST_DEV;
            let params = {
                "token": this.state.userToken,
                "format": "json",
                //"sender_id": this.state.chatting_user.user_id,
                "sender_id": this.state.userId,
                //"recipient_id": this.state.receive_user.id,
                "recipient_id": this.state.receive_user.id,
            }
            console.log(TAG + " callGetChatRequestAPI uri " + uri);
            console.log(TAG + " callGetChatRequestAPI params " + JSON.stringify(params));
            WebService.callServicePost(uri, params, this.handleGetChatRequestAPIResponse);
        } catch (error) {
            this.setState({ attach_loading: false })
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    };

    handleGetChatRequestAPIResponse = async (response, isError) => {
        console.log(TAG + " callGetChatRequestAPI App Response " + JSON.stringify(response));
        console.log(TAG + " callGetChatRequestAPI App isError " + isError);
        if (!isError) {
            var result = response;
            if (typeof result != undefined && result != null) {
                if (result.status == "success") {
                    if (result.chat_request != undefined) {
                        let chat_request = result.chat_request;
                        
                        if (chat_request.approve_date != undefined && chat_request.approve_date != null) {
                            // "approve_date": "2022-12-12T12:02:45.000Z", "chat_id": "D39aEepyS4BZ05wbeUOy", 
                            //"expire_date": "2022-12-15T11:37:19.000Z", "id": 14, "paid": null, "pay_amount": 2, 
                            //"recipient_id": 1278, "reject_date": null, "request_date": "2022-12-12T11:37:19.000Z", "sender_id": 950}
                            console.log('UserChatScreen', chat_request.pay_amount);
                            if(chat_request.paid && chat_request.paid === 1)
                                this.sendMessage();
                            else
                                this.setState({received_accept_pay_amount: true, pay_amount: chat_request.pay_amount})
                        } else {
                            this.setState({ wait_approve_reuqest_view: true });
                        }
                    } else {
                        await this.callSendChatRequestAPI();
                    }
                }
            }
        } else {
            if (response != undefined && response != null && response.length > 0) {
                Alert.alert(response.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
        this.setState({ attach_loading: false });
    };

    // Send Chat request
    callSendChatRequestAPI = async () => {


        console.log('create user chat ------------> 1');
        try {
            this.setState({ attach_loading: true })
            
            let uri = Memory().env == "LIVE" ? Global.URL_SEND_CHAT_REQUEST : Global.URL_SEND_CHAT_REQUEST_DEV;
            let grpId = this.state.receive_user.grpId;
            if (grpId == "" || grpId == null) {
                grpId = await fcService.createChat(this.state.receive_user.id, this.state.userId);
                var receive_user = this.state.receive_user;
                receive_user.grpId = grpId;

                this.setState({receive_user: receive_user},  () => {
                    if(!this.unsubscribe)
                        this.unsubscribe = fcService.getMessages(this.state.receive_user, this.state.userId, this.handleMessageListGUI);
                })
            }
            let params = {
                "token": this.state.userToken,
                "format": "json",
                "chat_id": grpId,
                "sender_id": this.state.chatting_user.user_id,
                "recipient_id": this.state.receive_user.id,
                "message_text": this.state.messageText.trim()
            }
            console.log(TAG + " callSendChatRequestAPI uri " + uri);
            console.log(TAG + " callSendChatRequestAPI params " + JSON.stringify(params));
            WebService.callServicePost(uri, params, this.handleSendChatRequestAPIResponse);
        } catch (error) {
            this.setState({ attach_loading: false })
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    };

    handleSendChatRequestAPIResponse = (response, isError) => {
        console.log(TAG + " callSendChatRequestAPI App Response " + JSON.stringify(response));
        console.log(TAG + " callSendChatRequestAPI App isError " + isError);
        if (!isError) {
            var result = response;
            if (typeof result != undefined && result != null) {
                if (result.status == "success") {
                    this.setState({ sent_chat_reuqest_view: true });
                } else {
                    Alert.alert('Something went wrong');
                }
            }
        } else {
            if (response != undefined && response != null && response.length > 0) {
                Alert.alert(response.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
        this.setState({ attach_loading: false });
    };

    callSendChatPayAmountAPI = async () => {
        try {
            this.setState({ attach_loading: true })
            let coin = this.state.pay_amount;
            // console.log("callGetChatRequestAPI sentNotification : ", sentNotification);
            let uri = Memory().env == "LIVE" ? Global.URL_CAHT_SEND_GOLD : Global.URL_CAHT_SEND_GOLD_DEV;
            let params = {
                "token": this.state.userToken,
                "format": "json",
                //"sender_id": this.state.chatting_user.user_id,
                "sender_id": this.state.userId,
                //"recipient_id": this.state.receive_user.id,
                "recipient_id": this.state.receive_user.id,
                pay_amount: coin
            }
            console.log(TAG + " callSendChatPayAmountAPI uri " + uri);
            console.log(TAG + " callSendChatPayAmountAPI params " + JSON.stringify(params));
            WebService.callServicePost(uri, params, this.handleGetSendPayAmountAPIResponse);
        } catch (error) {
            this.setState({ attach_loading: false })
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    }

    handleGetSendPayAmountAPIResponse = (response, isError) => {
        console.log(TAG + " handleGetSendPayAmountAPIResponse App Response " + JSON.stringify(response));
        console.log(TAG + " handleGetSendPayAmountAPIResponse App isError " + isError);
        if (!isError) {
            var result = response;
            if (typeof result != undefined && result != null) {
                if (result.status == "success") {
                    // this.setState({ sent_chat_reuqest_view: true });
                    this.setState({received_accept_pay_amount: false})
                } else {
                    Alert.alert('Something went wrong');
                }
            }
        } else {
            if (response != undefined && response != null && response.length > 0) {
                Alert.alert(response.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
        this.setState({ attach_loading: false });
    };

    renderSendGoldModal() {
        let goldAmount = this.state.pay_amount ?  this.state.pay_amount : 0;
        let isDisabled = false;
        if(this.state.my_gold_coin < parseInt(goldAmount.toString(), 10))
            isDisabled = true;
        return (
            <View style={[{ width: width, height: height }, styles.container_modal]}>
                <View style={styles.container_modal_back}><Text>Send Gold</Text></View>
                <View style={{ width: '85%', marginTop: 300, backgroundColor: Colors.white, borderRadius: 10 }}>
                    <View style={{ width: '100%', padding: 20, borderTopColor: Colors.gray, borderTopWidth: 0.5, borderBottomColor: Colors.gray, borderBottomWidth: 0.5 }}>
                        <Text style={[{ fontSize: 14, color: Colors.black }, stylesGlobal.font]}>
                            Your chat access has been granted! Proceed for {goldAmount} gold coins?
                        </Text>
                    </View>
                    <View style={{ width: '100%', padding: 10, flexDirection: 'row', justifyContent: 'flex-end' }}>
                        <TouchableOpacity 
                            disabled = {isDisabled}
                            style={[{ paddingVertical: 8, paddingHorizontal: 20, backgroundColor: Colors.gold, borderRadius: 5, marginLeft: 15 }, stylesGlobal.shadow_style]}
                            onPress={() => {

                                this.callSendChatPayAmountAPI()}}
                        >
                            <Text style={[{ fontSize: 14, color: Colors.white }, stylesGlobal.font]}>Send</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[{ paddingVertical: 8, paddingHorizontal: 20, backgroundColor: Colors.gold, borderRadius: 5, marginLeft: 15 }, stylesGlobal.shadow_style]}
                            onPress={() => {
                                this.props.navigation.navigate('Dashboard', {selected_screen: "myaccount", myaccount_initial_tab: "buy_goldcoin", getDataAgain: this.getDataAgain });
                                // if (this.state.my_gold_coin > parseInt(coinpermessage.toString(), 10)) {
                                //     this.setState({
                                //         coinpermessage: coinpermessage
                                //     });
                                //     this.sendMessage();
                                // } else {
                                //    
                                // }
                            }}>
                            <Text style={[{ fontSize: 14, color: Colors.white }, stylesGlobal.font]}>Buy Gold</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        )
    }

    sendMessageCheck() {


//         this.setState({received_accept_pay_amount: true})
// 
//         return;
// 
        let targetIsMember = !(this.state.receiverProfile.profileData.member_plan.toString() == "4" || 
                        this.state.receiverProfile.profileData.member_plan.toString() == "7" || 
                        this.state.receiverProfile.profileData.member_plan.toString() == "8");
        let data = this.state.messageText;
        if (data.trim().length > 0) {
            if (this.state.chatting_user.profileData.can_chat != undefined && this.state.chatting_user.profileData.is_verified) {
                if (this.state.member_plan.toString() == "4" || 
                    this.state.member_plan.toString() == "7" || 
                    this.state.member_plan.toString() == "8") {
                    if(targetIsMember) {
                        if(this.state.member_plan.toString() != "4" ) {
                            //need to upgrade plan as vip fan
                            this.setState({ upgrade_plan_modal: true });
                        } else {
                            //send chat request
                            this.callGetChatRequestAPI();
                        }
                        return;
                    } else {
                        //none member vs none member
                        //this.setState({ coinpermessage: 0 });
                        this.sendMessage();
                    }

                } else {
                    //member vs member
                    this.sendMessage();
                }
            } else {
                this.setState({ upgrade_plan_modal: true });
            }
        }
        // this.setState({
        //     gold_coin_message_view: true
        // })
    }
    
    sendMessage = async () => {

        console.log('create user chat ------------> 2');
        console.log(TAG, this.state.chatting_user);
        console.log(TAG, 'sendmessage   ', this.state.chatting_user, this.state.receive_user);
        if (this.state.messageText.trim().length > 0 && this.state.chatting_user.profileData.can_chat && this.state.chatting_user.profileData.is_verified) {
            let msgData = {
                text: this.state.messageText.trim(),
                sent_at: new Date(),
                sent_by_user_id: this.state.userId.toString(),
                is_read: 0
            };
            let grpId = this.state.receive_user.grpId;
            if (grpId) {
                grpId = this.state.receive_user.grpId.trim();
            } else {
                grpId = await fcService.createChat(this.state.receive_user.id, this.state.userId);

                var receive_user = this.state.receive_user;
                receive_user.grpId = grpId;

                this.setState({receive_user: receive_user},  () => {
                    if(!this.unsubscribe)
                        this.unsubscribe = fcService.getMessages(this.state.receive_user, this.state.userId, this.handleMessageListGUI);
                })
            }
            console.log(TAG, 'sendmessage', grpId, this.state.receive_user, );
            fcService.sendMessage(msgData, grpId);
            // if (sentNotification == 0) {
            //     this.callSendMessagesNotificationAPI();
            // }
            // console.log(" sentNotification : before ------------------- : ", sentNotification, this.state.receive_user.id);
            this.callSendMessagesNotificationAPI();


            this.callSendMessagesNotificationAppAPI();
            
            this.callSaveNewMessagesAPI();

            this.setState({
                messageText: "",
                preMessageText: ""
            });
        }
    };

    /*
    * call send messages notification APP
    */
    callSendMessagesNotificationAppAPI = async () => {
        try {
            // console.log("callSendMessagesNotificationAPI sentNotification : ", sentNotification);
            let uri = Memory().env == "LIVE" ? Global.URL_SEND_MESSAGE_NOTIFICATION_APP : Global.URL_SEND_MESSAGE_NOTIFICATION_APP_DEV;
            let params = {
                "token": this.state.userToken,
                "format": "json",
                "to_user_id": this.state.receive_user.id,
                "message_text": this.state.messageText.trim(),
            }
            console.log(TAG + " callSendMessagesNotificationAPIApp uri " + uri);
            console.log(TAG + " callSendMessagesNotificationAPIApp params " + JSON.stringify(params));
            WebService.apiCallRequestAddTag(uri, params, this.handleSendMessagesNotificationResponse);
        } catch (error) {
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    };

    /*
    * call send messages notification
    */
    callSendMessagesNotificationAPI = async () => {
        try {
            sentNotification = 1;
            // console.log("callSendMessagesNotificationAPI sentNotification : ", sentNotification);
            let uri = Memory().env == "LIVE" ? Global.URL_SEND_MESSAGE_NOTIFICATION : Global.URL_SEND_MESSAGE_NOTIFICATION_DEV;
            let params = {
                "token": this.state.userToken,
                "format": "json",
                "to_user_id": this.state.receive_user.id,
                "message_text": this.state.messageText.trim(),
            }
            console.log(TAG + " callSendMessagesNotificationAPI uri " + uri);
            console.log(TAG + " callSendMessagesNotificationAPI params " + JSON.stringify(params));
            WebService.apiCallRequestAddTag(uri, params, this.handleSendMessagesNotificationResponse);
        } catch (error) {
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    };

    handleSendMessagesNotificationResponse = (response, isError) => {
        console.log(TAG + " callSendMessagesNotificationAPI App Response " + JSON.stringify(response));
        console.log(TAG + " callSendMessagesNotificationAPI App isError " + isError);
    };

    callSaveNewMessagesAPI = async () => {
        try {
            let uri = Memory().env == "LIVE" ? Global.URL_SAVE_NEW_MESSAGE : Global.URL_SAVE_NEW_MESSAGE_DEV;
            let params = {
                "token": this.state.userToken,
                "user_id": this.state.userId,
                "format": "json",
                "params": {
                    "updated_at": new Date(),
                    "last_message": this.state.messageText.trim(),
                    "to": this.state.receive_user.id
                }
            };
            console.log(TAG + " callSaveNewMessagesAPI uri " + uri);
            console.log(TAG + " callSaveNewMessagesAPI params " + JSON.stringify(params));
            WebService.callServicePost(uri, params, this.handleSaveNewMessagesResponse);
        } catch (error) {
            console.log(TAG + " callSaveNewMessagesAPI error : ", error);
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    };

    handleSaveNewMessagesResponse = (response, isError) => {
        console.log(TAG + " callSaveNewMessagesAPI Response " + JSON.stringify(response));
        console.log(TAG + " callSaveNewMessagesAPI isError " + isError);
    };
    /**
    *  process on message to show emoji
    */
    processOnMessage = (messageText) => {
        if (messageText.length <= 0) {
            return '';
        } else {

        }
        let oldMessage = this.state.messageText;
        let oldLength = oldMessage.length;
        let newlength = messageText.length;
        let newChar = null;
        let delChar = null;
        if (newlength > oldLength) {
            newChar = messageText.substring(oldLength, newlength)
        }
        else {
            delChar = oldMessage.substring(newlength, oldLength)
        }
        let newMessage = this.state.preMessageText;

        if (newChar != undefined && newChar != null && newChar.length > 0) {
            let isEmoji = false;
            let unicode = newChar;
            for (let i = 0; i < Emojis.emojis.length; i++) {
                let emoji = Emojis.emojis[i];
                if (emoji.emoji == newChar) {
                    unicode = " " + newChar + " ";
                    isEmoji = true
                    break;
                }
            }
            newMessage = newMessage + unicode
        } else {
            let count = delChar.length;
            let isEmoji = false;
            for (let i = 0; i < Emojis.emojis.length; i++) {
                let emoji = Emojis.emojis[i];
                if (emoji.emoji == delChar) {
                    isEmoji = true
                    break;
                }
            }
            if (isEmoji) {
                count = count + 2
            }
            newMessage = newMessage.substring(0, newMessage.length - count);
        }
        return newMessage
    }

    sendEmoji = () => {
        //alert('sendEmoji')
    };
    /**
    *  group by sent time message list
    */
    groupBy = (array, f) => {
        var groups = {};
        array.forEach(function (o) {
            var group = JSON.stringify(f(o));
            groups[group] = groups[group] || [];
            groups[group].push(o);
        });
        return Object.keys(groups).map(function (group) {
            return {
                title: Moment.utc(JSON.parse(group)[0]).local().format("MMM DD YYYY"),
                data: groups[group].sort(function compare(a, b) {
                    var dateA = new Date(Moment.utc((Number(a.sent) * 1000)).local().format("YYYY-MM-DD hh:mm A"));
                    var dateB = new Date(Moment.utc((Number(b.sent) * 1000)).local().format("YYYY-MM-DD hh:mm A"));
                    return dateA - dateB;
                })
            };
        })
    }
    /**
    *  manage message data
    */
    manageMessageData = (item) => {
        item.type = "text";
        item.first_name = "";
        item.last_name = "";
        item.slug = "";
        item.imgpath = "";

        if (item.self === 1) {
            item.first_name = this.state.userFirstName;
            item.last_name = this.state.userLastName;
            item.slug = this.state.userSlug;
            item.imgpath = "";
        } else {
            item.first_name = this.state.receive_user.first_name;
            item.last_name = this.state.receive_user.last_name;
            item.slug = this.state.receive_user.slug;
            item.imgpath = this.state.receive_user.imageUri;
        }
        if (item.message.indexOf(Constants.SMILY_PREFIX) != -1) {
            item.message = this.parceSimleyMessage(item.message);
            item.type = "smiley";
        } else if (item.message.startsWith(Constants.SMILY_PREFIX)) {
            item.message = this.parceSimleyMessage(item.message);
            item.type = "smiley";
        } else if (item.message.startsWith(Constants.OTHER_FILE_GROUP_PREFIX)) {
            item.type = "file";
        } else if (item.message.startsWith(Constants.OTHER_FILE_PREFIX)) {
            item.type = "file";
        } else if (item.message.startsWith(Constants.DELETE_MESSAGE_PREFIX)) {
            item.type = "deleted_message";
        } else if (item.message.startsWith(Constants.MEDIA_FILE_PREFIX)) {
            item.type = "file";
        } else if (item.message.startsWith(Constants.KICKUSER_FILE_PREFIX)) {
            item.type = "kickuser";
        }
        return item;
    }
    /**
    *  display parce smiley data
    */
    parceSimleyMessage = (HtmlCode) => {
        let message = '';
        let newHtml = [];
        newHtml = HtmlCode.split(/(<img.*?>)/g)
        newHtml.map((item) => {
            let word = item.trim();
            if (word.startsWith("<img ")) {
                let data = word.split('title="')[1].split('\">')[0].toLocaleLowerCase();
                let unicode;
                for (let i = 0; i < Emojis.emojis.length; i++) {
                    let emoji = Emojis.emojis[i];
                    if (emoji.name == data) {
                        unicode = emoji.emoji
                        break;
                    }
                    else if (data == "e mail" && emoji.name == "email") {
                        unicode = emoji.emoji
                        break;
                    }
                }
                message = message + " " + unicode;
            } else {
                message = message + " " + word;
            }
        })
        return message.trim();
    }

    getTempArray = (list) => {

        let tempArray = []
        // let oldMessage = array_chat_message.slice();
        list.map((item) => {
            if (item.type === "section") {

            } else {
                tempArray.push(item)
                // messageIdsList.push("" + item.id)
            }
        })
        return tempArray;
    }

    /**
    *  dget section data
    */
    getSectionDate = (sectionDate) => {
        var message = Moment.utc(sectionDate).local().format("MMM DD YYYY");
        var toDay = Moment(new Date()).format("YYYY-MM-DD");
        var yesterDay = Moment(new Date(new Date().setDate(new Date().getDate() - 1))).format("YYYY-MM-DD");
        if (sectionDate === toDay) {
            message = 'Today';
        } else if (sectionDate === yesterDay) {
            message = 'Yesterday'
        }
        var record = {
            id: '0',
            message: message,
            slug: this.state.userId,
            sent: 0,
            fromid: this.state.userId,
            first_name: "",
            last_name: "",
            imgpath: "",
            type: "section",
            from: "Me",
            chatroomid: "",
            read: 0
        };
        return record;
    }

    showReloginDialog = () => {
        if (!this.state.isReloginAlert) {
            this.setState({
                isReloginAlert: true
            })
            Alert.alert(
                Constants.RELOGIN_ALERT_TITLE,
                Constants.RELOGIN_ALERT_MESSAGE,
                [
                    { text: 'OK', onPress: () => this.logoutUser() },
                ],
                { cancelable: false }
            )
        }
    }

    logoutUser = async () => {
        try {
            await AsyncStorage.setItem(Constants.KEY_USER_ID, "");
            await AsyncStorage.setItem(Constants.KEY_USER_TOKEN, "");

            this.props.rootNavigation.navigate("SignInScreen", { isGettingData: false });
        } catch (error) {
            console.log(TAG + " logoutUser error " + error);
        }
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: "100%",
        backgroundColor: Colors.black
    },
    container_modal: {
        position: 'absolute',
        top: 0,
        left: 0,
        alignItems: 'center',
        zIndex: 100,
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
    emptyView: {
        backgroundColor: Colors.white,
        justifyContent: "center",
        height: "100%",
        alignItems: "center",
        alignContent: "center",
        flexDirection: "row"
    },
    userImageContainer: {
        backgroundColor: Colors.gray,
        width: imageSize,
        height: imageSize,
        marginRight: 5,
        borderRadius: imageSize / 2
    },
    userImage: {
        resizeMode: "cover",
        backgroundColor: Colors.transparent,
        borderRadius: imageSize / 2,
        width: imageSize,
        height: imageSize
    },
    sendButton: {
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    messageTextInput: {
        // borderWidth: 0.5,
        // borderRadius: 1,
        // borderColor: Colors.gray,
        // shadowOffset: { width: 1, height: 1 },
        // shadowOpacity: 0.6,
        // shadowRadius: 2,
        // shadowColor: Colors.black,
        backgroundColor: "#FFFFFF",
        color: Colors.black,
        fontSize: 15,
        // paddingVertical: 5,
        // height: 30,
        // maxHeight: 80,
       
        alignContent: 'center',
        textAlignVertical: 'center'
    },
    attachmentButton: {
        alignContent: "flex-end",
    },
    loadMoreButtom: {
        backgroundColor: Colors.transparent,
        alignSelf: 'center',
        justifyContent: 'center',
        padding: 5
    },
    loadMoreText: {
        color: Colors.gold,
        fontSize: 14,
        backgroundColor: Colors.transparent,
        textAlign: 'center'
    }
});
