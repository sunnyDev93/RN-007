import React, { Component } from "react";
import {
    Alert,
    StyleSheet,
    Text,
    View,
    Image,
    FlatList,
    TouchableOpacity,
    Dimensions,
    Platform,
    SafeAreaView,
    TextInput,
    Keyboard
} from "react-native";

import WebService from "../core/WebService";
import { stylesGlobal, STICKY_HEADER_HEIGHT } from '../consts/StyleSheet'
import { Constants } from "../consts/Constants";
import { Colors } from "../consts/Colors";
import * as Global from "../consts/Global";
import ProgressIndicator from "./ProgressIndicator";
import RowMyTimeLine from "./RowMyTimeLine";
import Memory from '../core/Memory'
import CustomPopupView from "../customview/CustomPopupView";
import { ImageCompressor } from './ImageCompressorClass';
import BannerView from "../customview/BannerView";
import AsyncStorage from '@react-native-community/async-storage';

const isIos = Platform.OS === 'ios'
const isIphoneX = isIos && (Dimensions.get('window').height === 812 || Dimensions.get('window').height === 896);
const bottomPadding = isIphoneX ? 34 : 0;

var TAG = "MyTimeLineScreen";

export default class MyTimeLine extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            pulldown_loading: false,
            showModel: false,
            userId: "",
            userToken: "",
            loading: false,
            displayTimeLine: false,
            id: "",
            slug: "",
            firstName: "",
            lastName: "",
            imgpath: "",
            filename: "",
            activityId: "0",
            activityUserId: "0",
            feedLikeType: 0,
            searchText: '',
            more_load: true,
            pageNumber: 0
        };
    }

    UNSAFE_componentWillMount() {
        this.clearStateData();
        this.refreshProfileImage();
        this.getData();
    }
    /**
        * clear state data
        */
    clearStateData = () => {
        
        this.setState({
            userId: "",
            userToken: "",
            loading: false,
            dataTimeLines: [],
            id: "",
            slug: "",
            firstName: "",
            lastName: "",
            imgpath: "",
            filename: "",
            activityId: "0",
            activityUserId: "0",
            feedLikeType: 0,
            searchText: '',
            more_load: true,
            pageNumber: 0
        });
    };
    /**
        * get asysn storage data
        */
    getData = async () => {
        try {
            console.log(TAG + " getData");
            var userId = await AsyncStorage.getItem(Constants.KEY_USER_ID);
            var userToken = await AsyncStorage.getItem(Constants.KEY_USER_TOKEN);
            
            var id = this.props.route.params.id;
            var slug = this.props.route.params.slug;
            var firstName = this.props.route.params.firstName;
            var lastName = this.props.route.params.lastName;
            var imgpath = this.props.route.params.imgpath;
            var filename = this.props.route.params.filename;

            this.setState({
                userId: userId,
                userToken: userToken,
                id: id,
                slug: slug,
                firstName: lastName,
                lastName: lastName,
                imgpath: imgpath,
                filename: filename,
            });
            console.log(TAG + " getData userId " + userId);
            console.log(TAG + " getData userToken " + userToken);

            this.callGetTimeLineListAPI();
        } catch (error) {
            // Error retrieving data
        }
    };

    /*
    * call get user timeline list API and display content
    */
    callGetTimeLineListAPI = async () => {
        try {

            this.setState({
                loading: true,
            });

            let uri = Memory().env == "LIVE" ? Global.URL_MY_TIMELINE + "?page=" + this.state.pageNumber : Global.URL_MY_TIMELINE_DEV + "?page=" + this.state.pageNumber

            let params = new FormData();
            params.append("token", this.state.userToken);
            params.append("user_id", this.state.userId);
            params.append("format", "json");

            console.log(TAG + " callGetTimeLineListAPI uri " + uri);
            console.log(TAG + " callGetTimeLineListAPI params " + JSON.stringify(params));

            WebService.callServicePost(
                uri,
                params,
                this.handleGetTimeLineListResponse
            );
        } catch (error) {
            this.setState({
                loading: false,
            });
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    };
    /**
        * handle get timeline list API response
        */
    handleGetTimeLineListResponse = (response, isError) => {
        console.log(TAG + " callGetTimeLineListAPI Response " + JSON.stringify(response));
        console.log(TAG + " callGetTimeLineListAPI isError " + isError);

        if (!isError) {
            var result = response;

            if (typeof result != undefined && result != null) {
                if (typeof result.data != undefined && result.data != null) {
                    var mData = result.data.posts;
                    console.log(TAG + " mData length " + mData.length);

                    if (mData.length > 0) {
                        mData.map((i, j) => {
                            i.first_name = this.state.firstName;
                            i.last_name = this.state.lastName;
                            i.profile_imgpath = this.state.imgpath;
                            i.profile_filename = this.state.filename;
                            i.slug = this.state.slug;
                        });

                        this.setState({
                            more_load: true,
                            dataTimeLines: [...this.state.dataTimeLines, ...mData],
                            pageNumber: this.state.pageNumber + 1
                        });

                    } else {
                        this.setState({
                            more_load: false
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
            loading: false,
        });

    };

    /*
    * call  feed like or unlike
    */
    callFeedLikeUnLikeAPI = async () => {
        try {
            this.setState({
                loading: true
            });

            let uri = Memory().env == "LIVE" ? Global.URL_LIKE_FEED_TIME_LINE : Global.URL_LIKE_FEED_TIME_LINE_DEV
            if (this.state.feedLikeType == 1) {
                uri = Memory().env == "LIVE" ? Global.URL_UNLIKE_FEED_TIME_LINE :Global.URL_UNLIKE_FEED_TIME_LINE_DEV
            }

            let params = new FormData();
            params.append("token", this.state.userToken);
            params.append("user_id", this.state.userId);
            params.append("format", "json");
            // params.append("activity_id", this.state.activityId);
            // params.append("activity_user_id", this.state.activityUserId);
            if (this.state.feedLikeType == 1) { 
                params.append("activity_id", this.state.activityId);
            } else {
                params.append("activityId", this.state.activityId);
            }
            params.append("activityUserId", this.state.activityUserId);

            console.log(TAG + " callFeedLikeUnLikeAPI uri " + uri);
            console.log(TAG + " callFeedLikeUnLikeAPI params " + JSON.stringify(params));

            WebService.callServicePost(
                uri,
                params,
                this.handleFeedLikeUnLikeResponse
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
            * handle like timeline  API response
            */
    handleFeedLikeUnLikeResponse = (response, isError) => {
        console.log(TAG + " callFeedLikeUnLikeAPI Response " + JSON.stringify(response));
        console.log(TAG + " callFeedLikeUnLikeAPI isError " + isError);

        if (!isError) {
            var result = response;
            if (typeof result != undefined && result != null) {
                if (typeof result.msg != undefined && result.msg != null) {
                    this.state.dataTimeLines.map((i, j) => {
                        if (i.id === this.state.activityId) {
                            i.is_likes = this.state.feedLikeType == 1 ? 0 : 1;
                            i.total_likes = result.total_likes
                        }
                    });
                    this.setState({
                        activityId: "0",
                        activityUserId: "0",
                        feedLikeType: 0
                    })
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
   * call  feed share
   */
    callFeedShareAPI = async () => {
        try {
            this.setState({
                loading: true
            });

            let uri = Memory().env == "LIVE" ? Global.URL_SHARE_FEED_TIME_LINE : Global.URL_SHARE_FEED_TIME_LINE_DEV;
            let params = new FormData();
            params.append("token", this.state.userToken);
            params.append("user_id", this.state.userId);
            params.append("format", "json");
            params.append("activity_id", this.state.activityId);

            console.log(TAG + " callFeedShareAPI uri " + uri);
            console.log(TAG + " callFeedShareAPI params " + JSON.stringify(params));

            WebService.callServicePost(
                uri,
                params,
                this.handleFeedShareResponse
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
            * handle share timeline  API response
            */
    handleFeedShareResponse = (response, isError) => {
        console.log(TAG + " callFeedShareAPI Response " + JSON.stringify(response));
        console.log(TAG + " callFeedShareAPI isError " + isError);

        if (!isError) {
            var result = response;
            if (typeof result != undefined && result != null) {
                if (typeof result.msg != undefined && result.msg != null) {
                    this.clearStateData();
                    this.getData();
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
     * call  delete post
     */
    callDeletePostAPI = (postId, postVisibility) => {
        console.log(TAG, "callDeletePostAPI postId=>" + postId);
        console.log(TAG, "callDeletePostAPI postVisibility=>" + postVisibility);
        try {
            this.setState({
                loading: true,
                postId: postId,
                postVisibility: postVisibility
            });

            let uri =  Memory().env == "LIVE" ? Global.URL_DELETE_POST : Global.URL_DELETE_POST_DEV;
            let params = new FormData();
            params.append("token", this.state.userToken);
            params.append("user_id", this.state.userId);
            params.append("format", "json");
            params.append("post_id", postId);

            console.log(TAG + " callDeletePostAPI uri " + uri);
            console.log(TAG + " callDeletePostAPI params " + JSON.stringify(params));

            WebService.callServicePost(
                uri,
                params,
                this.handleDeletePostResponse
            );
        } catch (error) {
            this.setState({
                loading: false
            });
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    }

    /**
         * handle delete post  API response
         */
    handleDeletePostResponse = (response, isError) => {
        console.log(TAG + " callDeletePostAPI Response " + JSON.stringify(response));
        console.log(TAG + " callDeletePostAPI isError " + isError);

        if (!isError) {
            var result = response;
            if (typeof result != undefined && result != null) {
                let data = this.state.dataTimeLines;
                let tempArray = [];
                data.map((item, index) => {
                    if (item.id == this.state.postId) {
                        console.log(TAG, "Post Found " + item.id)
                    } else {
                        tempArray.push(item);
                    }
                })

                // array_TimeLine_list = tempArray.slice();
                this.setState({
                    dataTimeLines: tempArray.slice(),
                    postId: "",
                    postVisibility: ""
                })
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
   * call  change post visibility
   */
    callChangePostVisibilityAPI = (postId, postVisibility) => {
        
        try {
            this.setState({
                loading: true,
                postId: postId,
                postVisibility: postVisibility
            });

            let uri = Memory().env == "LIVE" ? Global.URL_CHANGE_POST_VISIBILITY :Global.URL_CHANGE_POST_VISIBILITY_DEV;
            let params = new FormData();
            params.append("token", this.state.userToken);
            params.append("user_id", this.state.userId);
            params.append("format", "json");
            params.append("post_id", postId);
            params.append("visibility", postVisibility);

            console.log(TAG + " callChangePostVisibilityAPI uri " + uri);
            console.log(TAG + " callChangePostVisibilityAPI params " + JSON.stringify(params));

            WebService.callServicePost(
                uri,
                params,
                this.handleChangePostVisibilityResponse
            );
        } catch (error) {
            this.setState({
                loading: false
            });
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    }

    /**
         * handle change post visibility API response
         */
    handleChangePostVisibilityResponse = (response, isError) => {
        console.log(TAG + " callChangePostVisibilityAPI Response " + JSON.stringify(response));
        console.log(TAG + " callChangePostVisibilityAPI isError " + isError);

        if (!isError) {
            var result = response;
            if (typeof result != undefined && result != null) {
                let data = this.state.dataTimeLines;
                data.map((item, index) => {
                    if (item.id == this.state.postId) {
                        item.visibility = this.state.postVisibility;
                    }
                })
                this.setState({
                    dataTimeLines: data,
                    postId: "",
                    postVisibility: ""
                })
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

    render() {
        let emptyView = (
            <View style = {{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
                <View style={styles.emptyView}>
                    <Text style={[stylesGlobal.empty_cardView_text, stylesGlobal.font]}>No record found</Text>
                </View>
            </View>
        );
        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: Colors.black, width: "100%", height: "100%"  }}>
                <View style={{ flex: 1, backgroundColor: Colors.black, width: "100%", height: "100%",}}>
                    {this.renderHeaderView()}
                    {this.renderBannerView()}
                    {this.renderPopupView()}
                    {(!this.state.loading && !this.state.dataTimeLines.length) ? emptyView : this.renderMainView()}
                    {this.state.loading == true ? <ProgressIndicator /> : null}
                </View>
            </SafeAreaView>
        );
    }

    renderBannerView = () => {
        return (
            <BannerView
                screenProps = {this.props.navigation}
            />
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

    hidePopupView = () => {
        this.setState({
            showModel: false
        })
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

    handleEditCompleteSearchText = () => {
        searchText = this.state.searchText.trim();
        this.setState({
            searchText: searchText,
        });
        if (searchText.length > 0) {
            this.props.navigation.navigate('Dashboard', {selected_screen: "members", search_text: searchText});
        }
    };

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
        );
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
                <TouchableOpacity style={stylesGlobal.header_avatarview_style} onPress={() => this.setState({ showModel: true })}>
                    <View style={stylesGlobal.header_avatarsubview_style}>
                        <ImageCompressor style = {stylesGlobal.header_avatar_style} uri={imageUrl}/>
                    </View>
                </TouchableOpacity>
            </View>
        );
    };

    isCloseToBottom = ({layoutMeasurement, contentOffset, contentSize}) => {
        const paddingToBottom = 10;
        return layoutMeasurement.height + contentOffset.y >=
          contentSize.height - paddingToBottom;
    };

    isCloseToTop = ({layoutMeasurement, contentOffset, contentSize}) => {
        const paddingToBottom = 10;
        
        return contentOffset.y <= -10
    };

    renderMainView = () => {
        return (
            <View style={{ flex: 1, width: "100%", height: "100%" }}>
                {this.renderTimeLineList}
            </View>
        );
    };
    /**
            * display  timeline list
            */
    get renderTimeLineList() {

        return (
            <View style={{ flex: 1, marginLeft: 10, marginRight: 10 }}>
                <FlatList
                    extraData={this.state}
                    pagingEnabled={false}
                    showsHorizontalScrollIndicator={false}
                    showsVerticalScrollIndicator={false}
                    data={this.state.dataTimeLines}
                    keyExtractor={(item, index) => index.toString()}
                    renderItem={({ item, index }) => (
                        <RowMyTimeLine
                            data={item}
                            screenProps={this.props.navigation}
                            index={index}
                            likeUnLikeFeed={this.likeUnLikeFeed}
                            shareFeed={this.shareFeed}
                            refreshFeedCommentCount={this.refreshFeedCommentCount}
                            userId={this.state.userId}
                            callDeletePostAPI={this.callDeletePostAPI}
                            callChangePostVisibilityAPI={this.callChangePostVisibilityAPI}
                            refreshProfileImage={this.refreshProfileImage}
                            refreshEventData={this.refreshEventData}
                        />
                    )}
                    scrollEventThrottle={0}
                    onScroll={({nativeEvent}) => {
                        if(this.isCloseToBottom(nativeEvent)) {
                            if (this.state.more_load && this.state.loading != true) {
                                this.setState({
                                    loading: true
                                }, () => this.callGetTimeLineListAPI());
                            }
                        }
                        if(this.isCloseToTop(nativeEvent)) {
                            this.setState({
                                loading: true,
                                more_load: true,
                                dataTimeLines: [],
                                pageNumber: 0
                            }, () => this.callGetTimeLineListAPI());
                        }
                    }}
                />
            </View>
        );
    };

    /**
            * like unlike button click
            */
    likeUnLikeFeed = (data) => {
        console.log(TAG, "likeUnLikeFeed called");
        console.log(TAG, "likeUnLikeFeed data.is_likes " + data.is_likes);
        var type = (data.is_likes == 1 ? 1 : 0);

        this.setState({
            activityId: data.id,
            activityUserId: data.user_id,
            feedLikeType: type
        }, () => {
            this.callFeedLikeUnLikeAPI();
        });
    }
    /**
            * share button click
            */
    shareFeed = (data) => {
        console.log(TAG, "shareFeed called");
        this.setState({
            activityId: data.id,
        }, () => {
            this.callFeedShareAPI();
        });
    }
    /**
            * refresh comment count
            */
    refreshFeedCommentCount = (isRefresh, activityId, commentCount) => {
        console.log(TAG, "refreshFeedCommentCount called " + isRefresh);
        console.log(TAG, "refreshFeedCommentCount activityId " + activityId);
        console.log(TAG, "refreshFeedCommentCount commentCount " + commentCount);
        if (isRefresh) {
            this.state.dataTimeLines.map((i, j) => {
                if (i.id === activityId) {
                    i.total_comments = commentCount
                }
            });
            this.setState({
                activityId: "0",
                activityUserId: "0",
                feedLikeType: 0
            })
        }
    }


    updateRecentChatList = (isRefresh) => {
        if (isRefresh) {
        }
    };

    /**
* relaod data after delete event
*/
    refreshEventData = (isRefresh) => {
        console.log(TAG, "refreshEventData isRefresh " + isRefresh)
        if (isRefresh) {
            this.clearStateData();
            this.getData();
        }
    }
}

const styles = StyleSheet.create({
    emptyView: {
        // backgroundColor: Colors.white,
        // justifyContent: "center",
        // flex: 1,
        // width: "100%",
        // height: "100%",
        // alignItems: "center",
        // alignContent: "center",
        // flexDirection: "row"
        backgroundColor: Colors.white,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: Colors.gray,
        padding: 10,
        margin: 10,
        alignItems: 'center',
        justifyContent: 'center',
        width: '90%',
        height: '90%'
    },
});

