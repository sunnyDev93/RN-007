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
import {convertEmojimessagetoString, convertStringtoEmojimessage} from "../utils/Util";

const { height, width } = Dimensions.get("window");

const topInset = Platform.OS == "ios" ? isIphoneX ? 44 : 0 : 24;
const bottomInset = Platform.OS == "ios" ? isIphoneX ? 34 : 0 : 0;
const safeareaview_height = height - topInset - bottomInset - (bottomInset == 0 ? 18 : 0);
const inputview_height = 50;


var TAG = "UserChatScreen";
var array_chat_message = [];
let isRefresh = false;
var preMesssageId;
var timer;
var lastChatId = 0;
var imageSize = 36;
var profileUserId = '';
let timeStamp = 0;
let lastMessageId = "";
let sectionList = [];
let previousRecord = false;
let preLastMessageId = 0;
let messageIdsList = [];
let preMessageId = "";
let lastSendMessageId = 0;

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
            showReportModel:false,
            isReloginAlert: false,

            member_plan: '0',
            payment_status: '0',

            chatting_user: null, //  the user json data who is chat

            my_gold_coin: 0,
            coinpermessage: 0,

            textinput_height: 0, // textinput height(according to contents)
        };
    }

    UNSAFE_componentWillMount() {
        this.clearStateData();
        this.getData(true);
        this.listener = EventRegister.addEventListener(Constants.EVENT_PROFILE_IMAGE_UPDATED, () => {
            console.log(TAG, "EVENT_PROFILE_IMAGE_UPDATED event called");
        })
    }

    refreshCharList = () => {
        if (!this.state.loading && !this.state.deleteMessageLoading && !this.state.messageLoader) {
            try {
                let tempArray = array_chat_message.slice();
                tempArray = tempArray.reverse();
                preMessageId = "";

                this.callGetNewMessagesAPI(preLastMessageId);
            } catch (error) {
                if (error != undefined && error != null && error.length > 0) {
                    Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
                }
            }
        } else {
            console.log(TAG, " refreshCharList blocked ");
        }
    };

    componentDidMount() {
        BackHandler.addEventListener('hardwareBackPress', this.handleBack);
        this.keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', this._keyboardDidShow.bind(this));
    }

    componentWillUnmount() {
        clearInterval(this.timer);
        EventRegister.removeEventListener(this.listener)
        BackHandler.removeEventListener('hardwareBackPress', this.handleBack);
        this.keyboardDidShowListener.remove();
    }

    handleBack = () => {

        this.props.navigation.goBack();
        if(this.props.route.params.refreshList) {
            this.props.route.params.refreshList(true);
        }
        return true;
    };

    _keyboardDidShow(e) {
        setTimeout(() => {
            if (this.myList !== null && array_chat_message.length > 0) {
                this.myList.scrollToEnd({
                    animated: true,
                });
            }
        }, 500);
    }

    save_chat_history = async(listData) => {
        var storechathistory_key = "history_" + this.state.userId + "-" + this.state.user.id;
        if(listData.length > 0) {
            var saveChatMessage = [];
            var message_count = 0;
            
            for(i = listData.length - 1; i >= 0; i --) {
                saveChatMessage.push(listData[i]);
                if(listData[i] != "section") {
                    message_count ++;
                }
                if(message_count == 10) {
                    break;
                }
            }
            
            try {
                await AsyncStorage.setItem(storechathistory_key, JSON.stringify(saveChatMessage));
                
            } catch(error) {

            }
        }
    }

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
            showReportModel:false,
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
            if(saved_message == null) {
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

            var storechathistory_key = "history_" + userId + "-" + profileUserId;
            var saved_chathistory = await AsyncStorage.getItem(storechathistory_key);
            var saved_chathistory_array = [];
            if(saved_chathistory != null) {
                
                saved_chathistory_array = JSON.parse(saved_chathistory);
                var temp_save_array = saved_chathistory_array.reverse();
                
                this.setState({
                    displayChatMessage: true,
                    dataChatMessage: temp_save_array,
                }, () => {
                    setTimeout(() => this.autoScroll(), 500);
                });
            }
            
            this.callProfileDetailAPI();
            if(!this.timer) {
                this.timer = setInterval(() => {
                    this.refreshCharList();
                }, 3000);
            }
            
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
            this.setState({
                // loading: isLoader,
                isFirstTime: isLoader
            });
            this.callGetChatMessagesAPI(false);
        } catch (error) {
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    }

    /*
    * call get messages list
    */
    callGetChatMessagesAPI = async (isPrevRecord) => {
        try {
            if (isPrevRecord) {
                this.setState({
                    deleteMessageLoading: true
                });
            }
            let uri = Memory().env == "LIVE" ? Global.URL_SINGLE_MESSAGE_LIST + Constants.CALL_BACK_FUNCTION : Global.URL_SINGLE_MESSAGE_LIST_DEV + Constants.CALL_BACK_FUNCTION

            let params = new FormData();
            params.append("basedata", this.state.userId);
            params.append("chatbox", this.state.user.id);
            previousRecord = false
            if (isPrevRecord) {
                previousRecord = true
                params.append("prepend", lastMessageId);
            } else {
                params.append("prepend", "-1");
            }

            console.log(TAG + " callGetChatMessagesAPI uri " + uri);
            console.log(TAG + " callGetChatMessagesAPI params " + JSON.stringify(params));

            WebService.apiCallRequestAddTag(
                uri,
                params,
                this.handleChatMessageResponse
            );
        } catch (error) {
            this.setState({
                loading: false,
                deleteMessageLoading: false,
            });
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    };
    /**
    *  handle get chat  API response
    */
    handleChatMessageResponse = (response, isError) => {
        console.log(TAG + " handleChatMessageResponse response " + JSON.stringify(response));
        console.log(TAG + " handleChatMessageResponse isError " + isError);
        
        if (!isError) {
            var result = response;

            if (typeof result != "undefined" && result != null) {
                var jsonString = result;
                var startPrfix = Constants.CALL_BACK_FUNCTION_PREFIX;
                
                if (jsonString != undefined && jsonString != null ) {
                //  if (jsonString != undefined && jsonString != null && jsonString.startsWith(startPrfix)) {

                    jsonString = jsonString.substring(startPrfix.length, jsonString.length - 1)
                }
                var resultData = JSON.parse(jsonString);
                // if (typeof resultData != undefined
                //     && resultData != null
                //     && typeof resultData.loggedout != undefined
                //     && resultData.loggedout != null
                // ) {
                //     //TODO manage loggedout from cometchat apis
                //     this.showReloginDialog()
                // } else {
                    if (resultData.messages != null && resultData.messages != undefined) {

                        let messagesData = resultData.messages;
                        messageIdsList = [];
                        var tempArray = [];
                        if(previousRecord) {
                            tempArray = this.getTempArray(this.state.dataChatMessage);
                        } else {
                            tempArray = [];
                        }

                        if (messagesData != undefined && messagesData != null) {
                            var messageList = [];
                            let isFetch = true;
                            var count = 0;
                            for (var key in messagesData) {
                                count++;
                            }
                            if (count > 9) {
                                this.setState({
                                    displayLoadMoreView: true
                                });
                            }
                            for (var key in messagesData) {
                                if (isFetch) {
                                    lastMessageId = messagesData[key].id;
                                }
                                isFetch = false
                                var item = this.manageMessageData(messagesData[key]);
                                if (messageIdsList.indexOf("" + item.id) > -1) {

                                } else {
                                    messageIdsList.push("" + item.id);
                                    messageList.push(item);
                                }
                            }

                            if (messageList.length > 0) {
                                if (messageList[messageList.length - 1].id != preMesssageId) {
                                    isRefresh = true
                                }
                                if (previousRecord) {
                                    messageList.reverse()
                                }
                                messageList.map((item) => {
                                    if (previousRecord) {
                                        tempArray.unshift(item);
                                    } else {
                                        tempArray.push(item);
                                    }
                                })
                            } else {
                                console.log(TAG, " previous data not found")
                                this.setState({
                                    displayLoadMoreView: false
                                });
                            }
                        }

                        var tempSection = [];
                        array_chat_message = []
                        sectionList = [];
                        var data = [];
                        tempArray.map((item) => {
                            var sectionDate = Moment.utc((Number(item.sent) * 1000)).local().format("YYYY-MM-DD");
                            if (tempSection.indexOf(sectionDate) > -1) {
                                //In the array!
                            } else {
                                //Not in the array
                                tempSection.push(sectionDate)
                                sectionList.push(sectionDate)
                                var record = this.getSectionDate(sectionDate)
                                array_chat_message.push(record);
                            }
                            if (data.indexOf("" + item.id) === -1) {
                                data.push("" + item.id);
                                array_chat_message.push(item);
                            }
                        })

                    } else {
                        this.setState({
                            displayLoadMoreView: false
                        });
                    }

                    // this.displayData(array_chat_message);
                    if (array_chat_message.length > 0) {
                        this.setState({
                            dataChatMessage: array_chat_message,
                            displayChatMessage: true,
                        }, () => {
                            if(!previousRecord) {
                                setTimeout(() => this.autoScroll(), 500);
                            }
                        });
                        this.getPreMessageId(array_chat_message);
                        this.save_chat_history(array_chat_message);
                    } else {
                        array_chat_message = [];
                        this.setState({
                            dataChatMessage: array_chat_message,
                            displayChatMessage: true
                        });
                    }

                //}
            }
        } else {
            if (response != undefined && response != null && response.length > 0) {
                if (response === Constants.ERROR_MESSAGE_COMETCHAT_LOGOUT) {
                    // //TODO manage loggedout from cometchat apis
                    // this.showReloginDialog()
                } else {
                    Alert.alert(response.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
                }
            }
        }
        this.setState({
            deleteMessageLoading: false,
            loading: false,
        });
    };

    callProfileDetailAPI = async () => {
        try {
            let uri = Memory().env == "LIVE" ? Global.URL_MY_PROFILE_DETAIL + this.state.user.slug : Global.URL_MY_PROFILE_DETAIL_DEV + this.state.user.slug;

            let params = new FormData();
            params.append("token", this.state.userToken);
            params.append("user_id", this.state.userId);
            params.append("format", "json");

            console.log(TAG + " callProfileDetailAPI uri " + uri);
            console.log(TAG + " callProfileDetailAPI params " + JSON.stringify(params));

            WebService.callServicePost(
                uri,
                params,
                this.handleGetProfileDetailResponse
            );
        } catch (error) {
            
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    };

    /** Handle  Profile Data
     *
     * @param response
     * @param isError
     */
    handleGetProfileDetailResponse = (response, isError) => {
        console.log(TAG + " Response " + response);
        console.log(TAG + " isError " + isError);

        if (!isError) {
            try {
                var result = response;
                if (typeof result != "undefined" && result != undefined && result != null) {
                    console.log(TAG + " callProfileDetailAPI result::::::: " + JSON.stringify(result));
                    if (typeof result.data != "undefined" && result.data != undefined && result.data != null) {
                        myProfileData = result.data;
                        this.setState({
                            chatting_user: myProfileData
                        })
                        
                    } else {
                        //console.log(TAG + " callProfileDetailAPI  "+JSON.stringify(result));
                       if(result.msg) {
                            Alert.alert(result.msg.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
                            this.props.navigation.goBack();
                       } else{
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

    displayData = (listData) => {
        if (listData.length > 0) {
            this.setState({
                dataChatMessage: listData,
                displayChatMessage: true,
            }, () => {
                if(!previousRecord) {
                    setTimeout(() => this.autoScroll(), 500);
                }
                
            });
            this.getPreMessageId(listData);
            this.save_chat_history(listData);
        } else {
            listData = [];
            this.setState({
                dataChatMessage: listData,
                displayChatMessage: true
            });
        }

    }
    /**
    *  get last message id
    */
    getPreMessageId = (dataList) => {
        //var array = dataList.slice();
        //array = array.reverse();
        // let id=0, sent=0;
        // for (let i = 0; i < array.length; i++) {
        //     let item = array[i];
        //     if (item.type != "section" && item.read == 1) {
        //         console.log(TAG, "getPreMessageId item.message " + item.message + " === " + item.read);
        //         id = item.id;
        //         sent = item.sent;
        //         break;
        //     }
        // }
        if (dataList.length > 0) {
            preLastMessageId = dataList[dataList.length - 1].id;
        } else {
            preLastMessageId = 0;
        }
    }



    /*
   * call get new messages list
   */
    callGetNewMessagesAPI = async (preMessageId) => {
        try {
            timeStamp = Math.floor(Date.now() / 1000);
            let uri = Memory().env == "LIVE" ? Global.URL_SINGLE_MESSAGE_LIST + Constants.CALL_BACK_FUNCTION + timeStamp : Global.URL_SINGLE_MESSAGE_LIST_DEV + Constants.CALL_BACK_FUNCTION + timeStamp

            let details = {
                'basedata': this.state.userId,
                'action': 'heartbeat',
                'initialize':'1',
                'currenttime':"" + timeStamp,
                'timestamp':''
            };

            let formBody = [];
            for (let property in details) {
                let encodedKey = encodeURIComponent(property);
                let encodedValue = encodeURIComponent(details[property]);
                formBody.push(encodedKey + "=" + encodedValue);
            }
            formBody = formBody.join("&");

            let params = new FormData();
            params.append("basedata", this.state.userId);
            params.append("action", "heartbeat");
            params.append("initialize", "1");
            params.append("currenttime", "" + timeStamp);


            if (array_chat_message != null && array_chat_message.length > 0) {
                params.append("timestamp", "" + preMessageId);
            } else {
                params.append("timestamp", "");
            }
            var array = this.state.dataChatMessage.slice();
            array = array.reverse();
            for (let i = 0; i < array.length; i++) {
                let item = array[i];
                if (item.type != "section" && item.read == 0) {
                    if (item.self === 0) {
                        params.append("readmessages[" + this.state.user.id + "]", item.id);
                    } else {
                        params.append("csUnreadMsg[" + item.id + "]", item.id);
                    }
                }
            }

            console.log(TAG + " callGetNewMessagesAPI uri " + uri);
            console.log(TAG + " callGetNewMessagesAPI params " + JSON.stringify(formBody));

            WebService.apiCallRequestAddTag(
                uri,
                formBody,
                this.handleNewMessageResponse
            );
        } catch (error) {
            console.log(TAG + " callGetNewMessagesAPI error " + error);
        }
    };
    /**
    *  handle get new message API response
    */
    handleNewMessageResponse = (response, isError) => {
        console.log(TAG + " callGetNewMessagesAPI response " + JSON.stringify(response));
        console.log(TAG + " callGetNewMessagesAPI isError " + isError);

        if (!isError) {
            var result = response;

            if (typeof result != "undefined" && result != null) {
                var jsonString = result;
                var startPrfix = Constants.CALL_BACK_FUNCTION + timeStamp + "(";
                if (jsonString != undefined && jsonString != null ) {
           //     if (jsonString != undefined && jsonString != null && jsonString.startsWith(startPrfix)) {
                    jsonString = jsonString.substring(startPrfix.length, jsonString.length - 1)
                }
                var resultData = JSON.parse(jsonString);
                

                // if (typeof resultData != undefined
                //     && resultData != null
                //     && typeof resultData.loggedout != undefined
                //     && resultData.loggedout != null
                // ) {
                //     //TODO manage loggedout from cometchat apis
                //     this.showReloginDialog()
                // } else {
                    if (resultData.csReadmessages != null && resultData.csReadmessages != undefined) {
                        resultData.csReadmessages.map((item) => {
                            for (let i = 0; i < array_chat_message.length; i++) {
                                let data = array_chat_message[i];
                                if (data.type != "section" && data.id == item.message) {
                                    data.read = 1;
                                    break;
                                }
                            }
                        })
                    }

                    if (resultData.messages != null && resultData.messages != undefined) {
                        let messagesData = resultData.messages;

                        var tempArray = [];
                        messageIdsList = [];
                        let mArray = array_chat_message.slice();
                        mArray.reverse().map((item) => {
                            if (item.type === "section") {

                            } else {
                                if (tempArray.indexOf(item.id) === -1) {
                                    messageIdsList.push("" + item.id)
                                    tempArray.push(item)
                                }
                            }
                        })


                        if (messagesData != undefined && messagesData != null) {
                            var messageList = [];

                            for (var key in messagesData) {
                                let data = messagesData[key]
                                if (data.self == 0 || data.read == 1) {
                                    lastSendMessageId = parseInt(data.id, 10);
                                }

                                if (messageIdsList.indexOf("" + data.id) > -1) {
                                    tempArray.indexOf(data.id).read = data.read;
                                } else {
                                    var item = this.manageMessageData(data);
                                    if (item.from == this.state.user.id) {
                                        messageIdsList.push("" + item.id);
                                        messageList.push(item);
                                    }
                                }
                            }

                            if (messageList.length > 0) {
                                if (messageList[messageList.length - 1].id != preMesssageId) {
                                    isRefresh = true
                                }

                                messageList.map((item) => {
                                    if (parseInt(item.id, 10) >= lastSendMessageId) {
                                        tempArray.push(item);
                                    }
                                })
                            } else {
                                console.log(TAG, " previous data not found")
                            }
                        }

                        var tempSection = [];
                        array_chat_message = []
                        sectionList = [];
                        var data = [];

                        tempArray.sort(this.compare)
                        tempArray.map((item) => {
                            var sectionDate = Moment.utc((Number(item.sent) * 1000)).local().format("YYYY-MM-DD");
                            if (tempSection.indexOf(sectionDate) > -1) {
                                //In the array!
                            } else {
                                //Not in the array
                                tempSection.push(sectionDate)
                                sectionList.push(sectionDate)
                                var record = this.getSectionDate(sectionDate);
                                array_chat_message.push(record);
                            }
                            if (data.indexOf("" + item.id) === -1) {
                                if (parseInt(item.id, 10) <= lastSendMessageId) {
                                    item.read = 1;
                                }
                                array_chat_message.push(item);
                                data.push("" + item.id);
                            }
                        })

                        // this.displayData(array_chat_message);
                        if (array_chat_message.length > 0) {
                            this.setState({
                                dataChatMessage: array_chat_message,
                                displayChatMessage: true,
                            }, () => {
                                setTimeout(() => this.autoScroll(), 500);
                            });
                            this.getPreMessageId(array_chat_message);
                            this.save_chat_history(array_chat_message);
                        } else {
                            array_chat_message = [];
                            this.setState({
                                dataChatMessage: array_chat_message,
                                displayChatMessage: true
                            });
                        }

                        // if (array_chat_message.length > 0) {
                        //     this.setState({
                        //         dataChatMessage: array_chat_message,
                        //         displayChatMessage: true,
                        //     }, () => {
                        //         setTimeout(() => this.autoScroll(), 500);
                        //     });
                        //     this.getPreMessageId(array_chat_message)
                        // }
                    } else {
                        if (array_chat_message.length > 0) {
                            this.setState({
                                dataChatMessage: array_chat_message,
                                displayChatMessage: true,
                            });
                        }
                    }
                //}
            }
        } else {
            if (response != undefined && response != null && response.length > 0) {
                Alert.alert(response.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    };

    compare = (oldData, newData) => {
        let comparison = 0;

        if (oldData.sent < newData.sent) {
            comparison = -1;
        } else if (newData.sent < oldData.sent) {
            comparison = 1;
        }
        return comparison;
    }
    /**
     * call send text message API
     */

    callSendTextMessageAPI = async (message) => {
        try {

            if (array_chat_message.length <= 1) {
                this.setState({
                    isFirstTime: false
                });
            }

            this.setState({
                messageLoader: true
            });


            timeStamp = Math.floor(Date.now() / 1000);
            let uri = Memory().env == "LIVE" ? Global.URL_SINGLE_MESSAGE_SEND + Constants.CALL_BACK_FUNCTION + timeStamp : Global.URL_SINGLE_MESSAGE_SEND_DEV + Constants.CALL_BACK_FUNCTION + timeStamp

            let params = new FormData();
            params.append("callbackfn", "mobileapp");
            params.append("basedata", this.state.userId);
            params.append("to", this.state.user.id);
            params.append("localmessageid", "_" + timeStamp);
            params.append("message", message);
            console.log(TAG + " callSendTextMessageAPI uri " + uri);
            console.log(TAG + " callSendTextMessageAPI params " + JSON.stringify(params));

            WebService.apiCallRequestAddTag(
                uri,
                params,
                this.handleSendTextMessageResponse
            );
        } catch (error) {
            console.log(TAG + " callSendTextMessageAPI error " + error);
            this.setState({
                messageLoader: false,
            });
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    };
    /**
    *  handle send message API response
    */
    handleSendTextMessageResponse = (response, isError) => {
        console.log(TAG + " callSendTextMessageAPI Response " + response);
        console.log(TAG + " callSendTextMessageAPI isError " + isError);

        try {

            if (!isError) {
                var result = response;
                if (typeof result != "undefined" && result != null) {

                    var jsonString = result;
                    var startPrfix = Constants.CALL_BACK_FUNCTION + timeStamp + "(";

                    if (jsonString != undefined && jsonString != null ) {
                //  if (jsonString != undefined && jsonString != null && jsonString.startsWith(startPrfix)) {
                        jsonString = jsonString.substring(startPrfix.length, jsonString.length - 1)
                    }
                    var messageData = JSON.parse(jsonString);

                    // if (typeof messageData != undefined
                    //     && messageData != null
                    //     && typeof messageData.loggedout != undefined
                    //     && messageData.loggedout != null
                    // ) {
                    //     //TODO manage loggedout from cometchat apis
                    //     this.showReloginDialog()
                    // } else {
                        if (messageData.id != undefined && messageData.id != null) {
                            var sectionDate = Moment.utc((Number(messageData.sent) * 1000)).local().format("YYYY-MM-DD");
                            if (sectionList.indexOf(sectionDate) > -1) {
                                //In the array!
                            } else {
                                //Not in the array
                                sectionList.push(sectionDate);
                                var record = this.getSectionDate(sectionDate);
                                array_chat_message.push(record);
                            }

                            if (messageIdsList.indexOf("" + messageData.id) > -1) {

                            } else {
                                messageIdsList.push("" + messageData.id);
                                array_chat_message.push({
                                    id: messageData.id,
                                    read: '0',
                                    message: this.state.messageText,
                                    slug: this.state.userId,
                                    sent: messageData.sent,
                                    from: this.state.userId,
                                    to: this.state.user.id,
                                    self: 1,
                                    old: 1,
                                    imgpath: "",
                                    filename: "",
                                    type: "text",
                                    notification: '',
                                    mesage_date: ''
                                });
                            }
                        }


                        if (array_chat_message.length > 0) {
                            this.setState({
                                dataChatMessage: array_chat_message,
                                displayChatMessage: true,
                            }, () => {
                                setTimeout(() => this.autoScroll(), 500);
                            });
                            this.getPreMessageId(this.state.dataChatMessage);
                            if(this.state.coinpermessage != 0) {
                                this.setState({
                                    my_gold_coin: this.state.my_gold_coin - this.state.coinpermessage
                                })
                                try {
                                    AsyncStorage.setItem(Constants.KEY_GOLD_COINS, (this.state.my_gold_coin - this.state.coinpermessage).toString());
                                } catch(error) {
                                    console.log(error)
                                }
                                EventRegister.emit(Constants.EVENT_PROFILE_GOLDCOIN_UPDATED, '');
                            }
                        } else {
                            array_chat_message = [];
                            this.setState({
                                dataChatMessage: array_chat_message,
                                displayChatMessage: true
                            });
                        }

                        this.setState({
                            messageText: "",
                            preMessageText: ""
                        });
                    //}
                }
            } else {
                if (response != undefined && response != null && response.length > 0) {
                    if (response === Constants.ERROR_MESSAGE_COMETCHAT_LOGOUT) {
                        // //TODO manage loggedout from cometchat apis
                        // this.showReloginDialog()
                    } else {
                        Alert.alert(response.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
                    }
                }
            }
            this.setState({
                messageLoader: false
            });
        } catch(error) {
            console.log(error)
        }
        
    };


    /*
    * call send attachment API
    */
    callSendAttachmentAPI = async (type, response) => {
        try {
            this.setState({
                messageLoader: true
            });

            let uri = Memory().env == "LIVE" ? Global.URL_ADD_ATTACHMENT : Global.URL_ADD_ATTACHMENT_DEV


            let params = new FormData();
            params.append("token", this.state.userToken);
            params.append("user_id", this.state.userId);
            params.append("format", "json");
            params.append("receiver_user_id", this.state.user.id);
            if (type == 2) {
                params.append('filedata', {
                    uri: response.uri,
                    type: "video/mp4",
                    name: "testvideo"
                });
            } else if (type == 1) {
                params.append('filedata', {
                    uri: response.uri,
                    type: 'image/jpeg',
                    name: 'testPhotoName.jpg'
                });
            } else {
                params.append('filedata', {
                    uri: response.uri,
                    type: 'image/jpeg',
                    name: 'testPhotoName.jpg'
                });
            }

            console.log(TAG + " callSendAttachmentAPI uri " + uri);
            console.log(TAG + " callSendAttachmentAPI params " + JSON.stringify(params));
            WebService.callServicePost(
                uri,
                params,
                this.handleSendAttachmentResponse
            );
        } catch (error) {
            console.log(TAG + " callSendAttachmentAPI error " + error);
            this.setState({
                messageLoader: false
            });
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
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
                this.refreshCharList();
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
            params.append("reported_id",profileUserId)
            params.append("format", "json");
            params.append("type","user")
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
        console.log(TAG + " Response " + response);
        console.log(TAG + " isError " + isError);

        if (!isError) {
            var result = response;
            if (typeof result != undefined && result != null) {
                console.log(TAG + " callReportAPI result " + JSON.stringify(result));
                if (typeof result.msg != undefined && result.msg != null) {

            //      Alert.alert(result.msg)
            if(result.status == 'success')
            {
            Alert.alert(
                'Thank You',
                result.msg,
                [
                    {text: 'OK', onPress: () => {}},
                ],
                { cancelable: true }
                )
            }
            else{
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
            this.setState({
                loading: true
            });

            let uri = Memory().env == "LIVE" ? Global.URL_BLOCK_USERS: Global.URL_BLOCK_USERS_DEV
            let params = new FormData();
            params.append("token", this.state.userToken);
            params.append("user_id", this.state.userId);
            params.append("blocked_id",profileUserId)
            params.append("format", "json");


            console.log(TAG + " callBlockAPI uri " + uri);
            console.log(TAG + " callBlockAPI params " + JSON.stringify(params));

            WebService.callServicePost(
                uri,
                params,
                this.handleBlockResponse
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
        if (this.myList !== null && array_chat_message.length > 0) {
            if (parseInt(array_chat_message[array_chat_message.length - 1].id) > lastChatId) {
                this.myList.scrollToEnd({
                    animated: true,
                });
                lastChatId = parseInt(array_chat_message[array_chat_message.length - 1].id);
            }
        }
    }


    render() {
        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: Colors.black,}} >
                <View style={{flex: 1, width: '100%', height: safeareaview_height,}} ref="root">
                    {this.renderHeaderView()}
                    {this.renderBannerView()}

                    <KeyboardAvoidingView style = {{flex: 1, width: '100%',}} behavior={Platform.OS == "ios" ? "padding" : null} keyboardVerticalOffset={40} enabled>
                        {this.state.loading == false ? this.renderMainView() : null}
                        {this.state.displayStickerView == false && this.state.loading == false ? this.renderBottomView() : null}
                    </KeyboardAvoidingView>
                    {this.state.loading == false ? this.renderReportPopupView():null}
                    {/* {this.state.loading == true ? <ProgressIndicator /> : null} */}
                    {/* {this.state.deleteMessageLoading == true ? <ProgressIndicator /> : null} */}
                    {this.renderActionSheet()}
                </View>
            {
                this.state.gold_coin_message_view && this.renderSendMessageCheckModal()
            }
            </SafeAreaView>
        )
    }

    renderBannerView = () => {
        return (
            <BannerView
                screenProps = {this.props.navigation}
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
                        {this.callBlockAPI()}
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


     /** render PopUp Menu
     *
     * @returns {*}
     */

    renderReportPopupView = () => {
        return (

            <CustomReportPopupView
                showModel={this.state.showReportModel}
                callAPI = {this.callReportAPI}
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
            <View style={[stylesGlobal.headerView,]}>
                 <View style = {{flexDirection: 'row', alignItems: 'center'}}>
                    <TouchableOpacity style={stylesGlobal.header_backbuttonview_style} onPress={() => { this.handleBack() }}>
                        <Image style = {stylesGlobal.header_backbuttonicon_style} source={require("../icons/icon_back.png")}/>
                    </TouchableOpacity>
                    <TouchableOpacity style={stylesGlobal.header_logoview_style} onPress = {() => {clearInterval(this.timer); this.props.navigation.navigate('Dashboard', {logoclick: true})}}>
                        <Image style={stylesGlobal.header_logo_style} source={require("../icons/logo_new.png")}/>
                    </TouchableOpacity>
                    <TouchableOpacity style = {[stylesGlobal.header_avatarview_style, {marginLeft: 10}]}
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
                            <ImageCompressor style = {stylesGlobal.header_avatar_style} uri={imageUrl} default = {require("../icons/icon_profile_default.png")}/>
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
                    <Image style={stylesGlobal.header_rightmenuicon_style} source={require("../icons/menu_icon.png")}/>
                </TouchableOpacity>
            </View>
        );
    };

    refreshProfileImage = async () => {

    }

    renderMainView = () => {
        return (
            <View style={{ flex: 1, backgroundColor: Colors.white, justifyContent: 'flex-end'}}>
                {this.state.displayChatMessage == true
                    ? this.renderChatMessageList()
                    : null}
            </View>
        );
    };

    renderBottomView = () => {
        return (
            <View style = {{flexDirection: 'row', width: '100%', padding: 5}}>
                <View style={{ flex: 1, backgroundColor: Colors.transparent }}>
                    <TextInput
                        ref='messageTextInput'
                        underlineColorAndroid="transparent"
                        blurOnSubmit={false}
                        autoFocus={false}
                        autoCorrect = {true}
                        textContentType = {'oneTimeCode'}
                        style={[styles.messageTextInput, {height: Math.max(textinput_height_initial, this.state.textinput_height)}, stylesGlobal.font]}
                        onChangeText={async(messageText) => {
                            let message = this.processOnMessage(messageText)
                            this.setState({
                                messageText: messageText,
                                preMessageText: message
                            })
                            
                            try {
                                var storemessage_key = this.state.userId + "-" + this.state.user.id;
                                AsyncStorage.setItem(storemessage_key, messageText);
                                // AsyncStorage.setItem(storemessage_key, convertEmojimessagetoString(this.state.messageText));
                            } catch(error) {
                                console,log("chat message save error:::" + error);
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
                <View style={{ width: textinput_height_initial, height: textinput_height_initial, marginHorizontal: 10, justifyContent: 'center', alignItems: 'center'}}>
                {
                    this.state.messageLoader == false &&
                    <TouchableOpacity style={styles.sendButton}
                        onPress={async() => {
                            try {
    
                                var storemessage_key = this.state.userId + "-" + this.state.user.id;
                                AsyncStorage.setItem(storemessage_key, "");
                                // AsyncStorage.setItem(storemessage_key, convertEmojimessagetoString(this.state.messageText));
                            } catch(error) {
                                console,log("chat message save error:::" + error);
                            }
                            this.sendMessageCheck();
                        }}
                    >
                        <Image style = {{width: '100%', height: '100%', resizeMode: 'contain'}} source={require("../icons/chat_send.png")} />
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

    /// when scroll to top 
    onContentOffsetChanged(offset_y) {
        if(offset_y == 0) {
            this.callGetChatMessagesAPI(true);
        }
    }

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
            <TouchableOpacity style={styles.loadMoreButtom}
                onPress={() => {
                    this.callGetChatMessagesAPI(true);
                }}
            >
            {
                this.state.deleteMessageLoading &&
                <Image style = {{width: 30, height: 30}} resizeMode = {'contain'} source={require("../icons/loader.gif")}/>
            }
            {
                !this.state.deleteMessageLoading &&
                <Text style={[styles.loadMoreText, stylesGlobal.font]}>Load Earlier Messages</Text>
            }
            </TouchableOpacity>
        )


        let listView = (
            <FlatList
                ref={(c) => {
                    this.myList = c
                }}
                ListHeaderComponent={(this.state.dataChatMessage.length && this.state.displayLoadMoreView) ? loadMoreButton : null}
                key = {this.state.dataChatMessage.length}
                extraData={this.state}
                pagingEnabled={false}
                // showsHorizontalScrollIndicator={false}
                // showsVerticalScrollIndicator={false}
                data={this.state.dataChatMessage}
                keyExtractor={(item, index) => index.toString()}
                // onContentSizeChange = {() => this.autoScroll()}

                // initialScrollIndex={this.state.dataChatMessage.length == 0 ? 0 : this.state.dataChatMessage.length - 1}
                // onScrollToIndexFailed = {(error) => this.autoScroll()}
                onScroll = {(event) => this.onContentOffsetChanged(event.nativeEvent.contentOffset.y)}
                renderItem={({ item, index }) => (
                    <RowChat
                        data={item}
                        index={index}
                        userId={this.state.userId}
                    />
                )}
                onLayout = {(event) => {
                    setTimeout(() => {
                        if(this.myList && array_chat_message.length > 0) {
                            // this.myList.scrollToEnd({animated: true})
                            lastChatId = parseInt(array_chat_message[array_chat_message.length - 1].id);
                        }
                    }, 500);
                }}
                ListFooterComponent = {() => (
                    <View style = {{height: 20}}>
                    </View>
                )}

            />
        );

        return (
            <View style={{ width: '100%', height: "100%", flexDirection: 'column', paddingBottom: isIphoneX ? 0 : 10, }}>
                {!this.state.dataChatMessage.length ? emptyView : listView}
            </View>
        );
    };

    renderSendMessageCheckModal = () => {
        var chatter_name = this.state.chatting_user.profileData.first_name + " " + this.state.chatting_user.profileData.last_name;
        var coinpermessage = this.state.chatting_user.profileData.user_chat_cost;
        if(coinpermessage == null) {
            coinpermessage = 0;
        }
        return (
            <View style = {{width: width, height: height, position: 'absolute', top: 0, left: 0, alignItems: 'center', zIndex: 100}}>
                <View style = {{width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, backgroundColor: Colors.black, opacity: 0.2}}></View>
                <View style = {{width: '90%', marginTop: 60, backgroundColor: Colors.white, borderRadius: 5}}>
                    <View style = {{width: '100%', padding: 20}}>
                        <Text style = {[{fontSize: 18, color: Colors.black}, stylesGlobal.font]}>Send Message Confirmation</Text>
                    </View>
                    <View style = {{width: '100%', padding: 20, borderTopColor: Colors.gray, borderTopWidth: 0.5, borderBottomColor: Colors.gray, borderBottomWidth: 0.5}}>
                        <Text style = {[{fontSize: 14, color: Colors.black}, stylesGlobal.font]}>{chatter_name} requests {coinpermessage} gold coins per messages from a non-member. OK?</Text>
                    </View>
                    <View style = {{width: '100%', padding: 20, flexDirection: 'row', justifyContent: 'flex-end'}}>
                        <TouchableOpacity style = {[{paddingVertical: 15, paddingHorizontal: 10, backgroundColor: Colors.gold, borderRadius: 5}, stylesGlobal.shadow_style]} 
                            onPress = {() => {
                                this.setState({
                                    gold_coin_message_view: false
                                })
                                if(this.state.my_gold_coin > parseInt(coinpermessage.toString(), 10)) {
                                    this.setState({
                                        coinpermessage: coinpermessage
                                    });
                                    this.sendMessage();
                                } else {
                                    this.props.navigation.navigate('MyAccountScreen', {getDataAgain: this.getDataAgain, initial_tab: "buy_goldcoin"});
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
                            <Text style = {[{fontSize: 14, color: Colors.white}, stylesGlobal.font]}>Accept</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style = {[{paddingVertical: 15, paddingHorizontal: 10, backgroundColor: Colors.gold, borderRadius: 5, marginLeft: 15}, stylesGlobal.shadow_style]} 
                            onPress = {() => this.setState({gold_coin_message_view: false})}
                        >
                            <Text style = {[{fontSize: 14, color: Colors.white}, stylesGlobal.font]}>Decline</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        )
    }

    sendMessageCheck() {
        let data = this.state.messageText;
        if (data.trim().length > 0) {
            if(this.state.member_plan.toString() == "4" || this.state.member_plan.toString() == "7" || this.state.member_plan.toString() == "8") {
                if(this.state.chatting_user.profileData.member_plan.toString() == "4" || this.state.chatting_user.profileData.member_plan.toString() == "7" || this.state.member_plan.toString() == "8") {
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


    sendMessage = () => {
        if (this.state.messageText.trim().length > 0) {
            this.callSendTextMessageAPI(convertEmojimessagetoString(this.state.messageText.trim()));
        }
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
    *  send attachement button click
    */
    sendAttachment = () => {

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
            
            this.props.rootNavigation.navigate("SignInScreen", {isGettingData: false});
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
        paddingHorizontal: 10,
        // height: 30,
        // maxHeight: 80,
        alignContent: 'center',
        textAlignVertical: 'center'
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
