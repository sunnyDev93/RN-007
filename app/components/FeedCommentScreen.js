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
    KeyboardAvoidingView
} from "react-native";
import Emojis from '../customview/Emojis'
import Moment from "moment/moment";
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import ProgressIndicator from "./ProgressIndicator";
import WebService from "../core/WebService";
import { Constants } from "../consts/Constants";
import { Colors } from "../consts/Colors";
import * as Global from "../consts/Global";
import RowFeedComment from "./RowFeedComment";
import { stylesGlobal, STICKY_HEADER_HEIGHT } from '../consts/StyleSheet'
import Memory from '../core/Memory'
import CustomPopupView from "../customview/CustomPopupView";
import { EventRegister } from 'react-native-event-listeners';
import { ImageCompressor } from './ImageCompressorClass';
import PullDownIndicator from "./PullDownIndicator";
import {convertEmojimessagetoString, convertStringtoEmojimessage} from "../utils/Util";
import BannerView from "../customview/BannerView";
import AsyncStorage from '@react-native-community/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { isIphoneX, getBottomSpace } from '../custom_components/react-native-iphone-x-helper';

const { height, width } = Dimensions.get("window");

const topInset = Platform.OS == "ios" ? isIphoneX ? 44 : 0 : 24;
const bottomInset = Platform.OS == "ios" ? isIphoneX ? 34 : 0 : 0;
const safeareaview_height = height - topInset - bottomInset - (bottomInset == 0 ? 18 : 0);


var array_comment_list = [];
var isRefresh = false;
var preCommentId = "";
var timer;
var lastCommentId = 0;

var textinput_height_initial = 30; // initial input text height

var TAG = "FeedCommentScreen";
export default class FeedCommentScreen extends Component {
    constructor() {
        super();
        this.state = {
            pulldown_loading: false,
            userId: "",
            userToken: "",
            loading: true,
            dataCommentList: array_comment_list,
            displayComments: false,
            commentText: "",
            commentLoader: false,
            activityId: "0",
            activityUserId: "0",
            totalComment: 0,
            commentId: "0",
            commentLikeType: 0,
            preCommentText: "",

            keyboardHeight: 0,

            userImagePath: "",
            userImageName: "",

            searchText: "",
            showModel: false,

            textinput_height: 0
        };
    }

    UNSAFE_componentWillMount() {
        this.clearStateData();
        this.getData(true);

        this.listener = EventRegister.addEventListener(Constants.EVENT_PROFILE_IMAGE_UPDATED, () => {
            console.log(TAG,"EVENT_PROFILE_IMAGE_UPDATED event called");
            this.refreshProfileImage();
        })
    }

    componentDidMount() {
        BackHandler.addEventListener('hardwareBackPress', this.handleBack);
        this.keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', this._keyboardDidShow.bind(this));
        this.keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', this._keyboardDidHide.bind(this));

    }

    componentWillUnmount() {
        BackHandler.removeEventListener('hardwareBackPress', this.handleBack);
        this.keyboardDidShowListener.remove();
        this.keyboardDidHideListener.remove();

        EventRegister.removeEventListener(this.listener)

    }

    handleBack = () => {
        clearInterval(this.timer);
        const { state } = this.props.navigation;
        this.props.navigation.goBack();
        if(this.props.route.params && this.props.route.params.refreshFeedCommentCount) {
            this.props.route.params.refreshFeedCommentCount(isRefresh, this.state.activityId, this.state.totalComment);
        }
        // this.props.navigation.dispatch(backAction, state.params.refreshFeedCommentCount(isRefresh, this.state.activityId, this.state.totalComment))
        return true;
    };

    _keyboardDidShow(e) {
        this.setState({
            keyboardHeight: e.endCoordinates.height
        });
    }
    
    _keyboardDidHide(e) { 
         this.setState({
            keyboardHeight: 0
        });
    }


    /**
   * clear state data
   */
    clearStateData = () => {
        array_comment_list = [];
        lastCommentId = 0;
        this.setState({
            userId: "",
            userToken: "",
            loading: true,
            dataCommentList: array_comment_list,
            displayComments: false,
            commentText: "",
            commentLoader: false,
            activityId: "0",
            activityUserId: "0",
            totalComment: 0,
            commentId: "0",
            commentLikeType: 0,
            preCommentText: ""
        });
    };
    /**
   * get asysn storage data
   */
    getData = async (isLoader) => {
        try {
            console.log(TAG + " getData");
            var userId = await AsyncStorage.getItem(Constants.KEY_USER_ID);
            var userToken = await AsyncStorage.getItem(Constants.KEY_USER_TOKEN);
            var userImagePath = await AsyncStorage.getItem(Constants.KEY_USER_IMAGE_URL);
            var userImageName = await AsyncStorage.getItem(Constants.KEY_USER_IMAGE_NAME);
            
            var activityId = this.props.route.params.activityId;
            var activityUserId = this.props.route.params.activityUserId;
            var totalComment = this.props.route.params.totalComment;
            this.setState({
                userId: userId,
                userToken: userToken,
                userImagePath: userImagePath,
                userImageName: userImageName,
                activityId: activityId,
                activityUserId: activityUserId,
                totalComment: totalComment,

            });
            console.log(TAG + " getData userId " + userId);
            console.log(TAG + " getData userToken " + userToken);

            // this.timer = setInterval(() => {
            //     this.refreshCommentList();
            // }, 20000);

            this.callGetAPIs(true)

        } catch (error) {
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    };

    /**
 * call get feed comment api
 */
    callGetAPIs = (isLoader) => {
        try {
            if(!this.state.pulldown_loading) {
                this.setState({
                    loading: isLoader,
                });
            }
            this.callGetCommentAPI();
        } catch (error) {
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    }

    /*
    * call get messages list
    */
    callGetCommentAPI = async () => {
        try {
            let uri = Memory().env == "LIVE" ? Global.URL_GET_FEED_TIME_LINE_COMMENTS : Global.URL_GET_FEED_TIME_LINE_COMMENTS_DEV;

            let params = new FormData();
            params.append("token", this.state.userToken);
            params.append("user_id", this.state.userId);
            params.append("format", "json");
            params.append("activity_id", this.state.activityId);

            console.log(TAG + " callGetCommentAPI uri " + uri);
            console.log(TAG + " callGetCommentAPI params " + JSON.stringify(params));

            WebService.callServicePost(
                uri,
                params,
                this.handleGetCommentListResponse
            );
        } catch (error) {
            console.log(TAG + " callGetCommentAPI error " + error);
            this.setState({
                pulldown_loading: false,
                loading: false
            });
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    };

    /**
   * handle get feed comment list API response
   */
    handleGetCommentListResponse = (response, isError) => {
        console.log(TAG + " Response " + JSON.stringify(response));
        console.log(TAG + " isError " + isError);

        if (!isError) {
            var result = response;

            if (typeof result != "undefined" && result != null) {
                if (typeof result.data != "undefined" && result.data != null) {
                    array_comment_list = [];
                    var mData = result.data;
                    if (mData.length > 0) {
                        if (mData[mData.length - 1].id != preCommentId) {
                            isRefresh = true
                        }
                    }

                    mData.map((item) => {
                        array_comment_list.push(item);
                    })

                    if (array_comment_list.length > 0) {
                        this.setState({
                            dataCommentList: array_comment_list,
                            displayComments: true,
                        }, () => {
                            //setTimeout(() => this.autoScroll(), 1500);
                        });

                    } else {
                        array_comment_list = [];
                        this.setState({
                            dataCommentList: array_comment_list,
                            displayComments: true
                        });
                    }
                }
            }
        } else {
            if (response != undefined && response != null && response.length > 0) {
                Alert.alert(response.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
        this.setState({
            pulldown_loading: false,
            loading: false
        });
    };


    /**
     * call send comment API
     */
    callSendCommentAPI = async (comment, parentId) => {
        try {
            this.setState({
                commentLoader: true
            });
            let uri = Memory().env == "LIVE" ? Global.URL_SEND_FEED_TIME_LINE_COMMENTS : Global.URL_SEND_FEED_TIME_LINE_COMMENTS_DEV;

            let params = new FormData();
            params.append("token", this.state.userToken);
            params.append("user_id", this.state.userId);
            params.append("format", "json");
            params.append("pid", parentId);
            params.append("activity_id", this.state.activityId);
            params.append("activity_user_id", this.state.activityUserId);
            params.append("comment", convertEmojimessagetoString(comment));


            console.log(TAG + " callSendCommentAPI uri " + uri);
            console.log(TAG + " callSendCommentAPI params " + JSON.stringify(params));

            WebService.callServicePost(
                uri,
                params,
                this.handleSendCommentResponse
            );
        } catch (error) {
            console.log(TAG + " callSendCommentAPI error " + error);
            this.setState({
                commentLoader: false,
                loading: false
            });
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    };

    /**
* handle send feed comment  API response
*/
    handleSendCommentResponse = (response, isError) => {
        console.log(TAG + " Response " + JSON.stringify(response));
        console.log(TAG + " isError " + isError);

        if (!isError) {
            var result = response;
            if (typeof result != "undefined" && result != null) {
                if (typeof result.total_comment != "undefined" && result.total_comment != null) {
                    this.setState({
                        totalComment: result.total_comment,
                    });
                }
                this.setState({
                    commentText: "",
                    preCommentText: ""
                });
                this.callGetAPIs(false);
            }
        } else {
            if (response != undefined && response != null && response.length > 0) {
                Alert.alert(response.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
        this.setState({
            commentLoader: false
        });
    };


    /*
    * call  comment like or unlike
    */
    callCommentLikeUnLikeAPI = async () => {
        try {
            this.setState({
                loading: true
            });

            let uri = Memory().env == "LIVE" ? Global.URL_LIKE_FEED_TIME_LINE_COMMENTS :Global.URL_LIKE_FEED_TIME_LINE_COMMENTS_DEV
            if (this.state.commentLikeType == 2) {
                uri = Memory().env == "LIVE" ? Global.URL_UNLIKE_FEED_TIME_LINE_COMMENTS :Global.URL_UNLIKE_FEED_TIME_LINE_COMMENTS_DEV
            }
            let params = new FormData();
            params.append("token", this.state.userToken);
            params.append("user_id", this.state.userId);
            params.append("format", "json");
            params.append("comment_id", this.state.commentId);

            console.log(TAG + " callCommentLikeUnLikeAPI uri " + uri);
            console.log(TAG + " callCommentLikeUnLikeAPI params " + JSON.stringify(params));

            WebService.callServicePost(
                uri,
                params,
                this.handleCommentLikeUnLikeResponse
            );
        } catch (error) {
            this.setState({
                loading: false,
                commentId: "0",
                commentLikeType: 0
            });
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    };
    /**
* handle like unlike feed comment  API response
*/
    handleCommentLikeUnLikeResponse = (response, isError) => {
        console.log(TAG + " callCommentLikeUnLikeAPI result " + JSON.stringify(response));
        console.log(TAG + " allCommentLikeUnLikeAPI isError " + isError);

        if (!isError) {
            var result = response;
            if (typeof result != undefined && result != null) {
                
                this.state.dataCommentList.map((i, j) => {
                    let replyList = i.comments_reply;
                    if (i.id === this.state.commentId) {
                        console.log(TAG, " Comment Like/UnLike success")
                        i.is_liked = this.state.commentLikeType == 1 ? 1 : 0,
                            i.total_likes = result.total_likes
                    } else {
                        if (replyList != null && replyList.length > 0) {
                            console.log(TAG, " Reply Like/UnLike " + replyList.length)
                            replyList.map((m, n) => {
                                if (m.id === this.state.commentId) {
                                    console.log(TAG, " Reply Like/UnLike success")
                                    m.is_liked = this.state.commentLikeType == 1 ? 1 : 0,
                                        m.total_likes = result.total_likes
                                }
                            });
                        }
                    }
                });
                this.setState({
                    commentId: "0",
                    commentLikeType: 0
                });
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

    render() {
        if (Platform.OS == 'ios') {
            return (
                <SafeAreaView style={styles.container} ref="root">
                    <View style={{flex: 1, width: '100%', height: safeareaview_height,}} ref="root">
                        {this.renderHeaderView()}
                        {this.renderBannerView()}
                        {this.renderPopupView()}
                        
                        <KeyboardAvoidingView
                            style = {{flex: 1, width: '100%', marginBottom: 5}}
                            extraData={this.state}
                            extraScrollHeight={5}
                            keyboardShouldPersistTaps = {'handled'}
                            enableAutomaticScroll={false}
                            alwaysBounceVertical={false}
                            behavior={Platform.OS == "ios" ? "padding" : null} 
                            keyboardVerticalOffset={40} 
                            enabled
                        >
                            {this.state.displayComments == true ? this.renderMainView() : null}
                            {this.state.displayComments == true ? this.renderBottomView() : null}
                        </KeyboardAvoidingView>
                        {this.state.loading == true ? <ProgressIndicator /> : null}
                    </View>
                </SafeAreaView>
            );
        } else {
            return (
                <View style={styles.container} ref="root">
                    {this.renderHeaderView()}
                    {this.state.loading == false ? this.renderMainView() : null}
                    {this.state.loading == false ? this.renderBottomView() : null}
                    {this.state.loading == true ? <ProgressIndicator /> : null}
                </View>
            );
        }

    }

    renderBannerView = () => {
        return (
            <BannerView
                screenProps = {this.props.navigation}
            />
        )
    }

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

    handleEditComplete = () => {
        searchText = this.state.searchText.trim();
        console.log(TAG + " handleEditComplete searchText " + searchText);
        this.setState({
            searchText: searchText,
        });
        if (searchText.length > 0) {
            this.props.navigation.navigate("SearchUser", {
                searchText: this.state.searchText
            });
        }
    };

    handleEditCompleteSearchText = () => {
        searchText = this.state.searchText.trim();
        this.setState({
            searchText: searchText,
        });
        if (searchText.length > 0) {
            this.props.navigation.navigate("SearchUser", {
                searchText: this.state.searchText
            });
        }
    };
    /**
* display top header
*/
    renderHeaderView = () => {
        let imageUrl = this.state.userImagePath + Constants.THUMB_FOLDER + this.state.userImageName;
        return (
            <View style={[stylesGlobal.headerView]}>
                <TouchableOpacity style={stylesGlobal.header_backbuttonview_style} onPress={() => this.handleBack()}>
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
                        onSubmitEditing={this.handleEditCompleteSearchText}
                        keyboardType='ascii-capable'
                        placeholder="Search members..."
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

    renderMainView = () => {
        return (
            <View style={{flex: 1, width: "100%", backgroundColor: Colors.white,}}>
                {this.state.pulldown_loading && <PullDownIndicator/>}
                {this.state.displayComments == true
                    ? this.renderChatMessageList()
                    : null}
            </View>
        );
    };

    /**
* display bottom view
*/
    renderBottomView = () => {
        return (
            <View style={{flexDirection: 'row', width: "100%", backgroundColor: Colors.black, padding: 5}}>
                <View style={{ flex: 1, backgroundColor: Colors.transparent, }}>
                    <TextInput
                        ref='commentTextInput'
                        underlineColorAndroid="transparent"
                        blurOnSubmit={false}
                        autoFocus={false}
                        returnKeyType={"send"}
                        style={[styles.commentTextInput, {height: Math.max(textinput_height_initial, this.state.textinput_height)}, stylesGlobal.font]}
                        onChangeText={(commentText) => {
                            //let comment = this.processOnComment(commentText)
                            this.setState({
                                commentText: commentText,
                                preCommentText: commentText
                            })
                        }}
                        value={this.state.commentText}
                        defaultValue=""
                        multiline={false}
                        autoCapitalize='sentences'
                        placeholder="Type comment..."
                        onSubmitEditing={this.sendComment}
                        // keyboardType='ascii-capable'
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
                    !this.state.commentLoader &&
                    <TouchableOpacity style={styles.sendButton}
                        onPress={() => {
                            this.sendComment();
                        }}
                    >
                        <Image style = {{width: '100%', height: '100%', resizeMode: 'contain'}} source={require("../icons/chat_send.png")}/>
                    </TouchableOpacity>
                }
                {
                    this.state.commentLoader &&
                    <ActivityIndicator
                        animating={true}
                        color='#cfae45'
                        size="large"
                        style={{ width: 30, height: 30, }} />
                }
                </View>
            </View>
        );
    };

    /**
* process on comment button
*/
    processOnComment = (commentText) => {
        if (commentText.length <= 0) {
            return '';
        } else {

        }
        let oldComment = this.state.commentText;
        let oldLength = oldComment.length;
        let newlength = commentText.length;
        let newChar = null;
        let delChat = null;
        if (newlength > oldLength) {
            newChar = commentText.substring(oldLength, newlength)
            //console.log(TAG, "newChar " + newChar)
        }
        else {
            delChat = oldComment.substring(newlength, oldLength)
            //console.log(TAG, "delChat " + delChat)
        }
        let newComment = this.state.preCommentText;

        if (newChar != undefined && newChar != null && newChar.length > 0) {
            let isEmoji = false;
            let unicode = newChar;
            for (let i = 0; i < Emojis.emojis.length; i++) {
                let emoji = Emojis.emojis[i];
                if (emoji.emoji == newChar) {
                    unicode = " " + newChar + " ";
                    console.log(TAG, " emji name " + emoji.name)
                    isEmoji = true
                    break;
                }
            }
            newComment = newComment + unicode
        } else {
            let count = delChat.length;
            let isEmoji = false;
            for (let i = 0; i < Emojis.emojis.length; i++) {
                let emoji = Emojis.emojis[i];
                if (emoji.emoji == newChar) {
                    isEmoji = true
                    break;
                }
            }
            if (isEmoji) {
                count = count + 2
            }
            newComment = newComment.substring(0, newComment.length - count);
        }
        return newComment
    }

    /**
* display comment list
*/
    renderChatMessageList = () => {
        let emptyView = (
            <View style={styles.emptyView}>
                <Text
                    style={[{
                        backgroundColor: Colors.white,
                        fontSize: 14
                    }, stylesGlobal.font]}
                >
                    {"Be the first one to comment"}
                </Text>
            </View>
        );

        let listView = (
            <FlatList
                ref={(c) => {
                    this.myList = c
                }}
                extraData={this.state}
                pagingEnabled={false}
                showsHorizontalScrollIndicator={false}
                showsVerticalScrollIndicator={false}
                data={this.state.dataCommentList}
                keyExtractor={(item, index) => index.toString()}
                onContentSizeChange = {() => this.myList.scrollToEnd({animated: true,})}
                renderItem={({ item, index }) => (
                    <RowFeedComment
                        data={item}
                        index={index}
                        userId={this.state.userId}
                        userToken={this.state.userToken}
                        activityId={this.state.activityId}
                        refreshReplyContent={this.refreshReplyContent}
                        likeUnLikeFeed={this.likeUnLikeFeed}
                        navigation = {this.props.navigation}
                    />
                )}
                onScroll={async(e) => {
                    if(e.nativeEvent.contentOffset.y < -80) {
                        if(!this.state.pulldown_loading) {
                            this.setState({
                                pulldown_loading: true
                            }, () => this.refreshCommentList())
                            
                        }
                    }
                }}
            />
        );

        return (
            <View style={{ flex: 1, flexDirection: 'column' }}>
                {!this.state.dataCommentList.length ? emptyView : listView}
            </View>
        );
    };

    /**
* like unlike feed comment button click
*/
    likeUnLikeFeed = (data) => {
        console.log(TAG, "likeUnLikeFeed called");
        var type = (data.is_liked == 1 ? 2 : 1);
        this.setState({
            commentId: data.id,
            commentLikeType: type
        }, () => {
            this.callCommentLikeUnLikeAPI();
        });
    }

    /**
* refresh comment list after reply on comment
*/
    refreshReplyContent = (totalComment) => {
        this.setState({
            totalComment: totalComment,
        });
        this.callGetAPIs(false);
    }

    autoScroll() {
        console.log(TAG + " autoScroll called");
        if (this.myList !== null) {
            if (parseInt(array_comment_list[array_comment_list.length - 1].id) > lastCommentId) {
                this.myList.scrollToEnd();
                lastCommentId = parseInt(array_comment_list[array_comment_list.length - 1].id);
            }
        }
    }

    /**
* send comment button click
*/
    sendComment = () => {
        console.log(TAG + " sendComment called");
        //Keyboard.dismiss()
        var commentText = this.state.commentText.trim();
        console.log(TAG + " sendComment commentText " + commentText);
        this.setState({
            commentText: commentText
        });
        if (commentText.length > 0) {
            // let newHtml = [];
            // newHtml = this.state.preCommentText.split(' ')
            // let comment = '';
            // newHtml.map((item) => {
            //     let char = item;
            //     console.log(TAG, " char " + char)
            //     if(char.trim().length>0){
            //         let isEmoji = false;
            //         let unicode = char;
            //         for (let i = 0; i < Emojis.emojis.length; i++) {
            //             let emoji = Emojis.emojis[i];
            //             if (emoji.emoji === char || emoji.name === char) {
            //                 unicode = " :" + emoji.name + ": ";
            //                 isEmoji = true
            //                 break;
            //             }
            //         }

            //         if (isEmoji) {
            //             comment = comment + " " + unicode;
            //         } else {
            //             comment = comment + char;
            //         }
            //     }else{
            //         comment = comment +  char;
            //     }
            // })
            if (!this.state.commentLoader) {
                this.callSendCommentAPI(commentText, "0");
            }
        } else {
            Alert.alert(Constants.ENTER_COMMENT)
        }
    };

    refreshCommentList = () => {
        console.log(TAG, "refreshCommentList");
        if (!this.state.loading) {
            this.callGetAPIs(false)
        }
    };

    

}
const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: "100%",
        height: "100%",
        backgroundColor: Colors.black,
    },
    emptyView: {
        backgroundColor: Colors.white,
        justifyContent: "center",
        height: "100%",
        alignItems: "center",
        alignContent: "center",
        flexDirection: "row"
    },
    sendButton: {
        width: "100%",
        height: "100%",
        alignItems: 'center',
        backgroundColor: Colors.transparent,
        justifyContent: 'center'
    },
    commentTextInput: {
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
});
