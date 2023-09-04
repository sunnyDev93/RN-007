import React, { Component } from "react";
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
    KeyboardAvoidingView
} from "react-native";
import { EventRegister } from 'react-native-event-listeners';
import ActionSheet from 'react-native-actionsheet';
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
import CustomReportPopupView from '../customview/CustomReportPopupView';
import { stylesGlobal, STICKY_HEADER_HEIGHT } from '../consts/StyleSheet';
import BannerView from "../customview/BannerView";
import AsyncStorage from '@react-native-community/async-storage';
import { isIphoneX, getBottomSpace } from '../custom_components/react-native-iphone-x-helper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { convertEmojimessagetoString, convertStringtoEmojimessage } from "../utils/Util";
import { fcService } from "../utils/FirebaseChatService";
import { TouchableOpacity as TouchableOpacity2 } from 'react-native-gesture-handler'
import ImagePicker from 'react-native-image-picker';
import ImageResizer from 'react-native-image-resizer';

const { height, width } = Dimensions.get("window");
// const topInset = Platform.OS == "ios" ? isIphoneX ? 44 : 0 : 24;
// const bottomInset = Platform.OS == "ios" ? isIphoneX ? 34 : 0 : 0;
// const safeareaview_height = height - topInset - bottomInset - (bottomInset == 0 ? 18 : 0);
// const inputview_height = 50;
var TAG = "UserChatScreen";
var array_chat_message = [];
// let isRefresh = false;
// var preMesssageId;
// let lastMessageId = "";
// let preLastMessageId = 0;
// let preMessageId = "";
// let lastSendMessageId = 0;
var timer = null;
var sentNotification = 0;
var lastChatId = 0;
var imageSize = 36;
var profileUserId = '';
let timeStamp = 0;
let sectionList = [];
let previousRecord = false;
let messageIdsList = [];
var textinput_height_initial = 30; // initial input text height

export default class UserChatScreen extends Component {
    constructor() {
        super();
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
            attach_loading: false
        };
    }

    UNSAFE_componentWillMount() {
        this.clearStateData();
        this.getData(true);
        this.listener = EventRegister.addEventListener(Constants.EVENT_PROFILE_IMAGE_UPDATED, () => {
            console.log(TAG, "EVENT_PROFILE_IMAGE_UPDATED event called");
        })
    }

    // refreshCharList = () => {
    //     if (!this.state.loading && !this.state.deleteMessageLoading && !this.state.messageLoader) {
    //         try {
    //             let tempArray = array_chat_message.slice();
    //             tempArray = tempArray.reverse();
    //             preMessageId = "";
    //             // fcService.getMessages(this.state.user, this.state.userId, this.handleMessageListGUI);
    //         } catch (error) {
    //             if (error != undefined && error != null && error.length > 0) {
    //                 Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
    //             }
    //         }
    //     } else {
    //         console.log(TAG, " refreshCharList blocked ");
    //     }
    // };

    // // check message read or not
    // checkMessageRead = () => {
    //     if (!this.state.loading && !this.state.deleteMessageLoading && !this.state.messageLoader) {
    //         try {
    //             let tempArray = array_chat_message.slice();
    //             tempArray = tempArray.reverse();
    //             preMessageId = "";
    //             fcService.getMessages(this.state.user, this.state.userId, this.handleMessageReadCheck);
    //         } catch (error) {
    //             if (error != undefined && error != null && error.length > 0) {
    //                 Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
    //             }
    //         }
    //     } else {
    //         console.log(TAG, " refreshCharList blocked ");
    //     }
    // };

    // handleMessageReadCheck = (messageList) => {
    //     let newReadMsgList = [];
    //     let tempDate = '';
    //     messageList.map((val) => {
    //         if (val.is_read == 0) {
    //             newReadMsgList.push(val);
    //         }
    //     });
    //     console.log(" --------------- ", this.unReadMessageLen, newReadMsgList.length);
    //     if (this.unReadMessageLen < newReadMsgList.length) {
    //         console.log(" --------------- ", "read ");
    //     }
    //     this.unReadMessageLen = newReadMsgList.length;
    //     console.log( this.state.dataChatMessage, "--------------------");
    //     this.setState({
    //         dataChatMessage: msgData,
    //         displayChatMessage: true,
    //         displayLoadMoreView: true
    //     });
    //     clearInterval(this.timer);
    // };
    componentDidMount() {
        BackHandler.addEventListener('hardwareBackPress', this.handleBack);
        // this.keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', this._keyboardDidShow.bind(this));
    }

    componentWillUnmount() {
        clearInterval(this.timer);
        EventRegister.removeEventListener(this.listener)
        BackHandler.removeEventListener('hardwareBackPress', this.handleBack);
        // this.keyboardDidShowListener.remove();
    }

    handleBack = () => {
        this.props.navigation.goBack();
        if (this.props.route.params.refreshList) {
            this.props.route.params.refreshList(true);
        }
        return true;
    };

    // _keyboardDidShow(e) {
    //     setTimeout(() => {
    //         if (this.myList !== null && array_chat_message.length > 0) {
    //             this.myList.scrollToEnd({
    //                 animated: true,
    //             });
    //         }
    //     }, 200);
    // }

    // save_chat_history = async (listData) => {
    //     var storechathistory_key = "history_" + this.state.userId + "-" + this.state.user.id;
    //     if (listData.length > 0) {
    //         var saveChatMessage = [];
    //         var message_count = 0;
    //         for (i = listData.length - 1; i >= 0; i--) {
    //             saveChatMessage.push(listData[i]);
    //             if (listData[i] != "section") {
    //                 message_count++;
    //             }
    //             if (message_count == 10) {
    //                 break;
    //             }
    //         }
    //         try {
    //             await AsyncStorage.setItem(storechathistory_key, JSON.stringify(saveChatMessage));
    //         } catch (error) {

    //         }
    //     }
    // }
    /**
    *  clear state data
    */
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
            var user = this.props.route.params.user;
            profileUserId = user.id
            preMesssageId = this.props.route.params.messageId;
            var storemessage_key = userId + "-" + profileUserId;
            var saved_message = await AsyncStorage.getItem(storemessage_key);
            if (saved_message == null) {
                saved_message = "";
            }
            this.setState({
                userId: userId,
                userToken: userToken,
                user: user,
                member_plan: member_plan,
                payment_status: payment_status,
                my_gold_coin: parseInt(my_gold_coins_str, 10),
                messageText: saved_message,
            });
            this.callProfileDetailAPI();
            // if (this.timer == null) {
            //     this.timer = setInterval(() => {
            //         this.checkMessageRead();
            //     }, 4000);
            // }
            this.callGetAPIs(true);
        } catch (error) {
            // Error retrieving data
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    };

    callGetAPIs = (isLoader) => {
        try {
            this.setState({ isFirstTime: isLoader });
            fcService.getMessages(this.state.user, this.state.userId, this.handleMessageListGUI);
        } catch (error) {
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    }

    handleMessageListGUI = (messageList) => {
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
            msgData.push(val);
        });
        // console.log(" --------", msgData.length, this.state.dataChatMessage.length);
        if (this.state.dataChatMessage.length == 0) {
            for (let i = 0; i < msgData.length; i++) {
                this.setState({
                    dataChatMessage: [...this.state.dataChatMessage, msgData[i]]
                })
            }
            this.setState({
                displayChatMessage: true,
                displayLoadMoreView: true
            });
        } else if (this.state.dataChatMessage.length != msgData.length && this.state.dataChatMessage[this.state.dataChatMessage.length - 1] != msgData[msgData.length - 1]) {
            this.setState({
                dataChatMessage: [...this.state.dataChatMessage, msgData[msgData.length - 1]]
            })
        }
    };

    callLoadMoreMessages = () => {
        try {
            if (!this.state.deleteMessageLoading) {
                this.setState({ deleteMessageLoading: true });
                fcService.loadMessages(this.state.user, this.state.userId, this.handleCallLoadMoreMessages);
            }
        } catch (error) {
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
            this.setState({ deleteMessageLoading: false });
        }
    }

    handleCallLoadMoreMessages = async (messageList) => {
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
            msgData.push(val);
        });
        this.setState({ dataChatMessage: [...msgData, ...this.state.dataChatMessage] })
        this.setState({
            // dataChatMessage: msgData,
            deleteMessageLoading: false,
            displayChatMessage: true,
            displayLoadMoreView: true
        });
    }

    callProfileDetailAPI = async () => {
        try {
            let uri = Memory().env == "LIVE" ? Global.URL_MY_PROFILE_DETAIL + this.state.user.slug : Global.URL_MY_PROFILE_DETAIL_DEV + this.state.user.slug;
            let params = new FormData();
            params.append("token", this.state.userToken);
            params.append("user_id", this.state.userId);
            params.append("format", "json");
            console.log(TAG + " callProfileDetailAPI uri " + uri);
            console.log(TAG + " callProfileDetailAPI params " + JSON.stringify(params));
            WebService.callServicePost(uri, params, this.handleGetProfileDetailResponse);
        } catch (error) {

            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    };

    // Handle  Profile Data
    handleGetProfileDetailResponse = (response, isError) => {
        // let getfromAsyncstroage = AsyncStorage.getItem(Constants.KEY_MY_PROFILE);
        // console.log(TAG + " callProfileDetailAPI Response : " + JSON.stringify(response));
        console.log(TAG + " callProfileDetailAPI isError : " + isError);
        if (!isError) {
            try {
                var result = response;
                if (typeof result != "undefined" && result != undefined && result != null) {
                    if (typeof result.data != "undefined" && result.data != undefined && result.data != null) {
                        myProfileData = result.data;
                        this.setState({ chatting_user: myProfileData });
                    } else {
                        if (result.msg) {
                            Alert.alert(result.msg.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
                            this.props.navigation.goBack();
                        } else {
                            Alert.alert('Something went wrong')
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

    //     /*
    //    * call get new messages list
    //    */
    //     callGetNewMessagesAPI = async (preMessageId) => {
    //         try {
    //             timeStamp = Math.floor(Date.now() / 1000);
    //             let uri = Memory().env == "LIVE" ? Global.URL_SINGLE_MESSAGE_LIST + Constants.CALL_BACK_FUNCTION + timeStamp : Global.URL_SINGLE_MESSAGE_LIST_DEV + Constants.CALL_BACK_FUNCTION + timeStamp
    //             let details = {
    //                 'basedata': this.state.userId,
    //                 'action': 'heartbeat',
    //                 'initialize': '1',
    //                 'currenttime': "" + timeStamp,
    //                 'timestamp': ''
    //             };
    //             let formBody = [];
    //             for (let property in details) {
    //                 let encodedKey = encodeURIComponent(property);
    //                 let encodedValue = encodeURIComponent(details[property]);
    //                 formBody.push(encodedKey + "=" + encodedValue);
    //             }
    //             formBody = formBody.join("&");
    //             let params = new FormData();
    //             params.append("basedata", this.state.userId);
    //             params.append("action", "heartbeat");
    //             params.append("initialize", "1");
    //             params.append("currenttime", "" + timeStamp);
    //             if (array_chat_message != null && array_chat_message.length > 0) {
    //                 params.append("timestamp", "" + preMessageId);
    //             } else {
    //                 params.append("timestamp", "");
    //             }
    //             var array = this.state.dataChatMessage.slice();
    //             array = array.reverse();
    //             for (let i = 0; i < array.length; i++) {
    //                 let item = array[i];
    //                 if (item.type != "section" && item.read == 0) {
    //                     if (item.self === 0) {
    //                         params.append("readmessages[" + this.state.user.id + "]", item.id);
    //                     } else {
    //                         params.append("csUnreadMsg[" + item.id + "]", item.id);
    //                     }
    //                 }
    //             }
    //             console.log(TAG + " callGetNewMessagesAPI uri " + uri);
    //             console.log(TAG + " callGetNewMessagesAPI params " + JSON.stringify(formBody));
    //             WebService.apiCallRequestAddTag(uri, formBody, this.handleNewMessageResponse);
    //         } catch (error) {
    //             console.log(TAG + " callGetNewMessagesAPI error " + error);
    //         }
    //     };
    //     /**
    //     *  handle get new message API response
    //     */
    //     handleNewMessageResponse = (response, isError) => {
    //         console.log(TAG + " callGetNewMessagesAPI response " + JSON.stringify(response));
    //         console.log(TAG + " callGetNewMessagesAPI isError " + isError);
    //         if (!isError) {
    //             var result = response;
    //             if (typeof result != "undefined" && result != null) {
    //                 var jsonString = result;
    //                 var startPrfix = Constants.CALL_BACK_FUNCTION + timeStamp + "(";
    //                 if (jsonString != undefined && jsonString != null) {
    //                     //     if (jsonString != undefined && jsonString != null && jsonString.startsWith(startPrfix)) {
    //                     jsonString = jsonString.substring(startPrfix.length, jsonString.length - 1)
    //                 }
    //                 var resultData = JSON.parse(jsonString);
    //                 // if (typeof resultData != undefined
    //                 //     && resultData != null
    //                 //     && typeof resultData.loggedout != undefined
    //                 //     && resultData.loggedout != null
    //                 // ) {
    //                 //     //TODO manage loggedout from cometchat apis
    //                 //     this.showReloginDialog()
    //                 // } else {
    //                 if (resultData.csReadmessages != null && resultData.csReadmessages != undefined) {
    //                     resultData.csReadmessages.map((item) => {
    //                         for (let i = 0; i < array_chat_message.length; i++) {
    //                             let data = array_chat_message[i];
    //                             if (data.type != "section" && data.id == item.message) {
    //                                 data.read = 1;
    //                                 break;
    //                             }
    //                         }
    //                     })
    //                 }

    //                 if (resultData.messages != null && resultData.messages != undefined) {
    //                     let messagesData = resultData.messages;
    //                     var tempArray = [];
    //                     messageIdsList = [];
    //                     let mArray = array_chat_message.slice();
    //                     mArray.reverse().map((item) => {
    //                         if (item.type === "section") {
    //                         } else {
    //                             if (tempArray.indexOf(item.id) === -1) {
    //                                 messageIdsList.push("" + item.id)
    //                                 tempArray.push(item)
    //                             }
    //                         }
    //                     })

    //                     if (messagesData != undefined && messagesData != null) {
    //                         var messageList = [];
    //                         for (var key in messagesData) {
    //                             let data = messagesData[key]
    //                             if (data.self == 0 || data.read == 1) {
    //                                 lastSendMessageId = parseInt(data.id, 10);
    //                             }
    //                             if (messageIdsList.indexOf("" + data.id) > -1) {
    //                                 tempArray.indexOf(data.id).read = data.read;
    //                             } else {
    //                                 var item = this.manageMessageData(data);
    //                                 if (item.from == this.state.user.id) {
    //                                     messageIdsList.push("" + item.id);
    //                                     messageList.push(item);
    //                                 }
    //                             }
    //                         }

    //                         if (messageList.length > 0) {
    //                             if (messageList[messageList.length - 1].id != preMesssageId) {
    //                                 isRefresh = true
    //                             }

    //                             messageList.map((item) => {
    //                                 if (parseInt(item.id, 10) >= lastSendMessageId) {
    //                                     tempArray.push(item);
    //                                 }
    //                             })
    //                         } else {
    //                             console.log(TAG, " previous data not found")
    //                         }
    //                     }
    //                     var tempSection = [];
    //                     array_chat_message = []
    //                     sectionList = [];
    //                     var data = [];
    //                     tempArray.sort(this.compare)
    //                     tempArray.map((item) => {
    //                         var sectionDate = Moment.utc((Number(item.sent) * 1000)).local().format("YYYY-MM-DD");
    //                         if (tempSection.indexOf(sectionDate) > -1) {
    //                             //In the array!
    //                         } else {
    //                             //Not in the array
    //                             tempSection.push(sectionDate)
    //                             sectionList.push(sectionDate)
    //                             var record = this.getSectionDate(sectionDate);
    //                             array_chat_message.push(record);
    //                         }
    //                         if (data.indexOf("" + item.id) === -1) {
    //                             if (parseInt(item.id, 10) <= lastSendMessageId) {
    //                                 item.read = 1;
    //                             }
    //                             array_chat_message.push(item);
    //                             data.push("" + item.id);
    //                         }
    //                     })
    //                     // this.displayData(array_chat_message);
    //                     if (array_chat_message.length > 0) {
    //                         this.setState({
    //                             dataChatMessage: array_chat_message,
    //                             displayChatMessage: true,
    //                         }, () => {
    //                             setTimeout(() => this.autoScroll(), 500);
    //                         });
    //                         this.getPreMessageId(array_chat_message);
    //                         this.save_chat_history(array_chat_message);
    //                     } else {
    //                         array_chat_message = [];
    //                         this.setState({
    //                             dataChatMessage: array_chat_message,
    //                             displayChatMessage: true
    //                         });
    //                     }
    //                     // if (array_chat_message.length > 0) {
    //                     //     this.setState({
    //                     //         dataChatMessage: array_chat_message,
    //                     //         displayChatMessage: true,
    //                     //     }, () => {
    //                     //         setTimeout(() => this.autoScroll(), 500);
    //                     //     });
    //                     //     this.getPreMessageId(array_chat_message)
    //                     // }
    //                 } else {
    //                     if (array_chat_message.length > 0) {
    //                         this.setState({
    //                             dataChatMessage: array_chat_message,
    //                             displayChatMessage: true,
    //                         });
    //                     }
    //                 }
    //                 //}
    //             }
    //         } else {
    //             if (response != undefined && response != null && response.length > 0) {
    //                 if (response === Constants.ERROR_MESSAGE_COMETCHAT_LOGOUT) {
    //                     // //TODO manage loggedout from cometchat apis
    //                     // this.showReloginDialog()
    //                 }
    //             }
    //         }
    //     };

    compare = (oldData, newData) => {
        let comparison = 0;

        if (oldData.sent < newData.sent) {
            comparison = -1;
        } else if (newData.sent < oldData.sent) {
            comparison = 1;
        }
        return comparison;
    }

    // /**
    //  * call send text message API
    //  */
    // callSendTextMessageAPI = async (message) => {
    //     try {
    //         if (array_chat_message.length <= 1) {
    //             this.setState({
    //                 isFirstTime: false
    //             });
    //         }
    //         this.setState({ messageLoader: true });
    //         timeStamp = Math.floor(Date.now() / 1000);
    //         let uri = Memory().env == "LIVE" ? Global.URL_SINGLE_MESSAGE_SEND + Constants.CALL_BACK_FUNCTION + timeStamp : Global.URL_SINGLE_MESSAGE_SEND_DEV + Constants.CALL_BACK_FUNCTION + timeStamp
    //         let params = new FormData();
    //         params.append("callbackfn", "mobileapp");
    //         params.append("basedata", this.state.userId);
    //         params.append("to", this.state.user.id);
    //         params.append("localmessageid", "_" + timeStamp);
    //         params.append("message", message);
    //         console.log(TAG + " callSendTextMessageAPI uri " + uri);
    //         console.log(TAG + " callSendTextMessageAPI params " + JSON.stringify(params));

    //         WebService.apiCallRequestAddTag(
    //             uri,
    //             params,
    //             this.handleSendTextMessageResponse
    //         );
    //     } catch (error) {
    //         console.log(TAG + " callSendTextMessageAPI error " + error);
    //         this.setState({
    //             messageLoader: false,
    //         });
    //         if (error != undefined && error != null && error.length > 0) {
    //             Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
    //         }
    //     }
    // };
    // /**
    // *  handle send message API response
    // */
    // handleSendTextMessageResponse = (response, isError) => {
    //     // console.log(TAG + " callSendTextMessageAPI Response " + response);
    //     console.log(TAG + " callSendTextMessageAPI isError " + isError);
    //     try {
    //         if (!isError) {
    //             var result = response;
    //             if (typeof result != "undefined" && result != null) {
    //                 var jsonString = result;
    //                 var startPrfix = Constants.CALL_BACK_FUNCTION + timeStamp + "(";
    //                 if (jsonString != undefined && jsonString != null) {
    //                     //  if (jsonString != undefined && jsonString != null && jsonString.startsWith(startPrfix)) {
    //                     jsonString = jsonString.substring(startPrfix.length, jsonString.length - 1)
    //                 }
    //                 var messageData = JSON.parse(jsonString);
    //                 // if (typeof messageData != undefined
    //                 //     && messageData != null
    //                 //     && typeof messageData.loggedout != undefined
    //                 //     && messageData.loggedout != null
    //                 // ) {
    //                 //     //TODO manage loggedout from cometchat apis
    //                 //     this.showReloginDialog()
    //                 // } else {
    //                 if (messageData.id != undefined && messageData.id != null) {
    //                     var sectionDate = Moment.utc((Number(messageData.sent) * 1000)).local().format("YYYY-MM-DD");
    //                     if (sectionList.indexOf(sectionDate) > -1) {
    //                         //In the array!
    //                     } else {
    //                         //Not in the array
    //                         sectionList.push(sectionDate);
    //                         var record = this.getSectionDate(sectionDate);
    //                         array_chat_message.push(record);
    //                     }

    //                     if (messageIdsList.indexOf("" + messageData.id) > -1) {

    //                     } else {
    //                         messageIdsList.push("" + messageData.id);
    //                         try {
    //                             array_chat_message.push({
    //                                 id: messageData.id,
    //                                 read: '0',
    //                                 message: this.state.messageText,
    //                                 slug: this.state.userId,
    //                                 sent: messageData.sent,
    //                                 from: this.state.userId,
    //                                 to: this.state.user.id,
    //                                 self: 1,
    //                                 old: 1,
    //                                 imgpath: "",
    //                                 filename: "",
    //                                 type: "text",
    //                                 notification: '',
    //                                 mesage_date: ''
    //                             });
    //                         } catch (error) {
    //                             console.log(error, " array_chat_message.push({ : ");
    //                         }
    //                     }
    //                 }
    //                 if (array_chat_message.length > 0) {
    //                     this.setState({
    //                         dataChatMessage: array_chat_message,
    //                         displayChatMessage: true,
    //                     }, () => {
    //                         setTimeout(() => this.autoScroll(false), 500);
    //                     });
    //                     this.getPreMessageId(this.state.dataChatMessage);
    //                     if (this.state.coinpermessage != 0) {
    //                         this.setState({
    //                             my_gold_coin: this.state.my_gold_coin - this.state.coinpermessage
    //                         })
    //                         try {
    //                             AsyncStorage.setItem(Constants.KEY_GOLD_COINS, (this.state.my_gold_coin - this.state.coinpermessage).toString());
    //                         } catch (error) {
    //                             console.log(error)
    //                         }
    //                         EventRegister.emit(Constants.EVENT_PROFILE_GOLDCOIN_UPDATED, '');
    //                     }
    //                 } else {
    //                     array_chat_message = [];
    //                     this.setState({
    //                         dataChatMessage: array_chat_message,
    //                         displayChatMessage: true
    //                     });
    //                 }
    //                 this.setState({ messageText: "", preMessageText: "" });
    //             }
    //         } else {
    //             if (response != undefined && response != null && response.length > 0) {
    //                 if (response === Constants.ERROR_MESSAGE_COMETCHAT_LOGOUT) {
    //                     // //TODO manage loggedout from cometchat apis
    //                     // this.showReloginDialog()
    //                 } else {
    //                     Alert.alert(response.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
    //                 }
    //             }
    //         }
    //         this.setState({
    //             messageLoader: false
    //         });
    //     } catch (error) {
    //         console.log(error)
    //     }

    // };

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
                console.log("A>>>>>>>>>>>>");
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
        try {
            let grpId = this.state.user.grpId;
            if (grpId) {
                grpId = this.state.user.grpId;
            } else {
                grpId = await fcService.createChat(this.state.user.id, this.state.userId);
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
                console.log( " sentNotification : before ------------------- : ", sentNotification, this.state.user.id );
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
        if (this.myList !== null && this.state.dataChatMessage.length > 0) {
            this.myList.scrollToEnd();
        }
    }

    render() {
        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: Colors.black, }} >
                <View style={{ flex: 1, width: '100%', }} ref="root">
                    {this.renderHeaderView()}
                    {this.renderBannerView()}
                    <KeyboardAvoidingView style={{ flex: 1, width: '100%', }} contentContainerStyle={{ flex: 1 }} behavior={Platform.OS == "ios" ? "padding" : null} keyboardVerticalOffset={isIphoneX() ? getBottomSpace() + 15 : 18} enabled>
                        {/* {this.state.displayAttachImage && this.renderAttachImageView()} */}
                        {this.state.loading == false ? this.renderMainView() : null}
                        {this.state.displayStickerView == false && this.state.loading == false ? this.renderBottomView() : null}
                    </KeyboardAvoidingView>
                    {/* {this.state.loading == false ? this.renderReportPopupView():null} */}
                    {/* {this.state.loading == true ? <ProgressIndicator /> : null} */}
                    {/* {this.state.deleteMessageLoading == true ? <ProgressIndicator /> : null} */}
                    {this.renderActionSheet()}
                </View>
                {
                    this.state.gold_coin_message_view && this.renderSendMessageCheckModal()
                }
                {this.state.attach_loading == true ? <ProgressIndicator /> : null}
            </SafeAreaView>
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
                        //     user: this.state.user
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
        var user = this.state.user;
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
        // console.log("user.imageUri>>>>>>>>>>", imageUrl);

        return (
            <View style={[stylesGlobal.headerView,]}>
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
                </View>

                <TouchableOpacity style={stylesGlobal.header_rightmenuview_style} onPress={() => this.showReportFlag()}>
                    <Image style={stylesGlobal.header_rightmenuicon_style} source={require("../icons/menu_icon.png")} />
                </TouchableOpacity>
            </View>
        );
    };

    refreshProfileImage = async () => {

    }

    renderMainView = () => {
        return (
            <View style={{ flex: 1, backgroundColor: Colors.white, justifyContent: 'flex-end' }}>
                {this.state.displayChatMessage == true
                    ? this.renderChatMessageList()
                    : null}
            </View>
        );
    };

    renderBottomView = () => {
        return (
            <View style={{ flexDirection: 'row', width: '100%', padding: 5 }}>
                <View style={{ flex: 10, backgroundColor: Colors.transparent }}>
                    <TextInput
                        ref='messageTextInput'
                        underlineColorAndroid="transparent"
                        blurOnSubmit={false}
                        autoFocus={false}
                        autoCorrect={true}
                        textContentType={'oneTimeCode'}
                        style={[styles.messageTextInput, { height: Math.max(textinput_height_initial, this.state.textinput_height) }, stylesGlobal.font]}
                        onChangeText={async (messageText) => {
                            let message = this.processOnMessage(messageText)
                            this.setState({
                                messageText: messageText,
                                preMessageText: message
                            })

                            try {
                                var storemessage_key = this.state.userId + "-" + this.state.user.id;
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
                            if (currentHeight > 80) {
                                currentHeight = 80;
                            }
                            this.setState({
                                textinput_height: currentHeight
                            })
                        }}
                    />
                </View>
                <View style={{ flex: 1 }}>
                    <TouchableOpacity style={[styles.attachmentButton, { height: Math.max(textinput_height_initial, this.state.textinput_height) }]}
                        onPress={async (event) => {
                            try {
                                await this.sendAttachment();
                            } catch (error) {
                                console, log("chat message save error:::" + error);
                            }
                        }}
                    >
                        <Image style={{ width: '100%', height: '100%', resizeMode: 'contain' }} source={require('../icons/attach.png')} />
                    </TouchableOpacity>
                </View>
                <View style={{ width: textinput_height_initial, height: textinput_height_initial, marginHorizontal: 10, justifyContent: 'center', alignItems: 'center' }}>
                    {
                        this.state.messageLoader == false &&
                        <TouchableOpacity style={styles.sendButton}
                            onPress={async () => {
                                try {
                                    var storemessage_key = this.state.userId + "-" + this.state.user.id;
                                    AsyncStorage.setItem(storemessage_key, "");
                                    // AsyncStorage.setItem(storemessage_key, convertEmojimessagetoString(this.state.messageText));
                                } catch (error) {
                                    console, log("chat message save error:::" + error);
                                }
                                this.sendMessageCheck();
                            }}
                        >
                            <Image style={{ width: '100%', height: '100%', resizeMode: 'contain' }} source={require("../icons/chat_send.png")} />
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
                            this.state.dataChatMessage.length < 10 ? "No More message" : "Load Earlier Messages"
                        }
                    </Text>
                }
            </TouchableOpacity>
        )
        let listView = (
            <FlatList
                inverted
                contentContainerStyle={{ flexDirection: 'column-reverse' }}
                ref={(c) => { this.myList = c }}
                data={this.state.dataChatMessage}
                ListHeaderComponent={(this.state.dataChatMessage.length && this.state.displayLoadMoreView) ? loadMoreButton : null}
                key={this.state.dataChatMessage.length}
                extraData={this.state}
                pagingEnabled={false}
                showsHorizontalScrollIndicator={false}
                showsVerticalScrollIndicator={false}
                keyExtractor={(item, index) => item.id.toString()}
                initialNumToRender={this.state.dataChatMessage.length}
                // onScrollToIndexFailed={info => {
                //     console.log( "  event.nativeEvent.contentOffset.y ----- ", info.index);
                //     const wait = new Promise(resolve => setTimeout(resolve, 500));
                //     wait.then(() => {
                //         this.myList.scrollToIndex({ index: info.index, animated: true });
                //     });
                // }}
                // initialScrollIndex={this.state.dataChatMessage.length == 0 ? 0 : this.state.dataChatMessage.length - 1}
                // onContentSizeChange={()=>{
                //     if ( this.state.dataChatMessage.length > 30 ) {
                //         console.log( " -----=====---")
                //         this.refs.flatList.scrollToEnd();
                //     }
                // }}
                onScroll={(event) => {
                    // console.log(event.nativeEvent.contentSize.height, event.nativeEvent.layoutMeasurement.height, event.nativeEvent.contentOffset.y, "event.nativeEvent.contentOffset.y")
                    // console.log("  event.nativeEvent.contentOffset.y ----- ", event.nativeEvent.contentOffset.y);
                    if (event.nativeEvent.contentSize.height - event.nativeEvent.layoutMeasurement.height + 30 <= event.nativeEvent.contentOffset.y && !this.state.deleteMessageLoading && event.nativeEvent.contentOffset.y > event.nativeEvent.layoutMeasurement.height) {
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
                onLayout={(event) => {
                    // if (this.myList && this.state.dataChatMessage.length > 0) {
                    //     this.myList.scrollToEnd({
                    //         animated: true,
                    //     });
                    // }
                }}
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

    sendMessageCheck() {
        let data = this.state.messageText;
        if (data.trim().length > 0) {
            if (this.state.member_plan.toString() == "4" || this.state.member_plan.toString() == "7" || this.state.member_plan.toString() == "8") {
                if (this.state.chatting_user.profileData.member_plan.toString() == "4" || this.state.chatting_user.profileData.member_plan.toString() == "7" || this.state.member_plan.toString() == "8") {
                    this.setState({
                        coinpermessage: 0
                    });
                    this.sendMessage();
                } else {
                    this.setState({
                        gold_coin_message_view: true
                    })
                }
            } else {
                this.sendMessage();
            }
        }
        // this.setState({
        //     gold_coin_message_view: true
        // })
    }

    sendMessage = async () => {
        if (this.state.messageText.trim().length > 0) {
            let msgData = {
                text: this.state.messageText.trim(),
                sent_at: new Date(),
                sent_by_user_id: this.state.userId.toString(),
                is_read: 0
            };
            let grpId = this.state.user.grpId;
            if (grpId) {
                grpId = this.state.user.grpId;
            } else {
                grpId = await fcService.createChat(this.state.user.id, this.state.userId);
            }
            fcService.sendMessage(msgData, grpId);
            if (sentNotification == 0) {          
                this.callSendMessagesNotificationAPI();
            }
            console.log( " sentNotification : before ------------------- : ", sentNotification, this.state.user.id );
            this.callSendMessagesNotificationAppAPI();
            this.setState({
                messageText: "",
                preMessageText: ""
            });
            this.callSaveNewMessagesAPI();
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
                "to_user_id": this.state.user.id,
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
                "to_user_id": this.state.user.id,
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
                    "updted_at": new Date(),
                    "last_message": this.state.messageText.trim(),
                    "to": this.state.user.id
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
            item.first_name = this.state.user.first_name;
            item.last_name = this.state.user.last_name;
            item.slug = this.state.user.slug;
            item.imgpath = this.state.user.imageUri;
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
        color: Colors.gray,
        fontSize: 15,
        // paddingVertical: 5,
        // height: 30,
        // maxHeight: 80,
        paddingHorizontal: 10,
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
