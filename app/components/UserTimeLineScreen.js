import React, { Component,Fragment } from "react";
import {
    StyleSheet,
    Text,
    View,
    Image,
    FlatList,
    TouchableOpacity,
    Dimensions,
    Platform,
    Alert,
    SafeAreaView,
    TextInput,
    Keyboard
} from "react-native";
import ActionSheet from 'react-native-actionsheet'
const { height, width } = Dimensions.get("window");
import WebService from "../core/WebService";
import { stylesGlobal, STICKY_HEADER_HEIGHT } from '../consts/StyleSheet'
import { Constants } from "../consts/Constants";
import { Colors } from "../consts/Colors";
import * as Global from "../consts/Global";
import ProgressIndicator from "./ProgressIndicator";
import PulllDownIndicator from "./PullDownIndicator";
import RowUserTimeLine from "./RowUserTimeLine";
import CustomReportPopupView from '../customview/CustomReportPopupView';
import CustomPopupView from "../customview/CustomPopupView";
import { ImageCompressor } from './ImageCompressorClass';
import Memory from '../core/Memory';
import BannerView from "../customview/BannerView";
import AsyncStorage from '@react-native-community/async-storage';

const isIos = Platform.OS === 'ios'
const isIphoneX = isIos && (Dimensions.get('window').height === 812 || Dimensions.get('window').height === 896);
const bottomPadding = isIphoneX ? 36 : 0;
var pageNumber = 0;
var array_TimeLine_list = [];
var TAG = "UserTimeLineScreen";

export default class UserTimeLineScreen extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            pulldown_loading: false,
            showModel: false,
            searchText: '',
            userId: "",
            userToken: "",
            loading: true,
            dataTimeLines: array_TimeLine_list,
            displayTimeLine: false,
            isLoadMoreTimeLine: true,
            displayLoadMoreView: false,
            displayLoadMoreLoader: false,
            id: "",
            slug: "",
            firstName: "",
            lastName: "",
            imgpath: "",
            filename: "",
            activityId: "0",
            activityUserId: "0",
            showReportModel:false,
            feedLikeType: 0,
            reportedId: '',
        };
    }

    UNSAFE_componentWillMount() {
        this.refreshProfileImage();
        this.clearStateData();
        this.getData();
    }
    /**
    * clear state data
    */
    clearStateData = () => {
        array_TimeLine_list = [];
        pageNumber = 0;
        this.setState({
            userId: "",
            userToken: "",
            loading: false,
            dataTimeLines: array_TimeLine_list,
            displayTimeLine: false,
            isLoadMoreTimeLine: false,
            displayLoadMoreView: false,
            displayLoadMoreLoader: false,
            id: "",
            slug: "",
            firstName: "",
            lastName: "",
            imgpath: "",
            filename: "",
            activityId: "0",
            activityUserId: "0",
            showReportModel:false,
            feedLikeType: 0
        });
    };

    /**
    * get date from storage data
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
                firstName: firstName,
                lastName: lastName,
                imgpath: imgpath,
                filename: filename,
            });
           

            this.callGetTimeLineListAPI(true);
        } catch (error) {
            // Error retrieving data
        }
    };

    /*
    * call get user timeline list API and display content
    */
    callGetTimeLineListAPI = async (isFirstTime) => {
        try {
            if (isFirstTime) {
                if(!this.state.pulldown_loading) {
                    this.setState({
                        loading: true,
                        displayLoadMoreView: false,
                        displayLoadMoreLoader: false
                    });
                }
            } else {
                this.setState({
                    displayLoadMoreLoader: true,
                });
            }

            let uri = Memory().env == "LIVE" ? Global.URL_USER_ACTIVITIES + this.state.slug + "/?page=" + pageNumber : Global.URL_USER_ACTIVITIES_DEV + this.state.slug + "/?page=" + pageNumber

            let params = new FormData();
            params.append("token", this.state.userToken);
            params.append("user_id", this.state.userId);
            params.append("format", "json");

            const data = {
                "token": this.state.userToken,
                "user_id":  this.state.userId,
                "page": pageNumber,
                "format": "json"
            }

            console.log(TAG + " callGetTimeLineListAPI uri " + uri);
            console.log(TAG + " callGetTimeLineListAPI params " + JSON.stringify(params));

            WebService.callServicePost(
                uri,
                data,
                this.handleGetTimeLineListResponse
            );
        } catch (error) {
            this.setState({
                pulldown_loading: false,
                loading: false,
                displayLoadMoreView: false,
                displayLoadMoreLoader: false
            });
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    };

    /**
   * handle get time list API response
   */
    handleGetTimeLineListResponse = (response, isError) => {
        console.log(TAG + " callGetTimeLineListAPI Response " + JSON.stringify(response));
        console.log(TAG + " callGetTimeLineListAPI isError " + isError);

        if (!isError) {
            var result = response;
            if (typeof result != undefined && result != null) {
                if (typeof result.data != undefined && result.data != null) {
                    var mData = result.data.posts;
                    if (mData.length > 0) {
                        mData.map((i, j) => {
                            i.first_name = this.state.firstName;
                            i.last_name = this.state.lastName;
                            i.profile_imgpath = this.state.imgpath;
                            i.profile_filename = this.state.filename;
                            i.slug = this.state.slug;
                            array_TimeLine_list.push(i);
                        });

                        this.setState({
                            isLoadMoreTimeLine: true,
                        }, () => {
                            pageNumber = pageNumber + 1
                        });

                    } else {
                        this.setState({
                            isLoadMoreTimeLine: false
                        });
                    }

                    if (array_TimeLine_list.length > 0) {
                        this.setState({
                            dataTimeLines: array_TimeLine_list,
                            displayTimeLine: true,
                            displayLoadMoreView: false,
                            displayLoadMoreLoader: false
                        });
                    } else {
                        array_TimeLine_list = [];
                        this.setState({
                            displayTimeLine: true,
                            displayLoadMoreView: false,
                            displayLoadMoreLoader: false
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
            loading: false,
            displayLoadMoreView: false,
            displayLoadMoreLoader: false
        });

    };

    /*
    * call timeline like or unlike
    */
    callFeedLikeUnLikeAPI = async () => {
        try {
            this.setState({
                loading: true
            });

            let uri = Memory().env == "LIVE" ? Global.URL_LIKE_FEED_TIME_LINE : Global.URL_LIKE_FEED_TIME_LINE_DEV
            if (this.state.feedLikeType == 1) {
                uri = Memory().env == "LIVE" ? Global.URL_UNLIKE_FEED_TIME_LINE : Global.URL_UNLIKE_FEED_TIME_LINE_DEV
            }

            let params = new FormData();
            params.append("token", this.state.userToken);
            params.append("user_id", this.state.userId);
            params.append("id", this.state.userId);
            params.append("format", "json");
            if (this.state.feedLikeType == 1) { 
                params.append("activity_id", this.state.activityId);
            } else {
                params.append("activityId", this.state.activityId);
            }
            params.append("activity_user_id", this.state.activityUserId);

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
        * handle timeline like and unlike API response
        */
    handleFeedLikeUnLikeResponse = (response, isError) => {
        console.log(TAG + " callFeedLikeUnLikeAPI Response " + response);
        console.log(TAG + " callFeedLikeUnLikeAPI isError " + isError);

        if (!isError) {
            var result = response;
            if (typeof result != undefined && result != null) {
                if (typeof result.msg != undefined && result.msg != null) {
                    if (result.status == "success") {
                        this.state.dataTimeLines.map((i, j) => {
                            if (i.id === this.state.activityId) {
                                i.is_likes = this.state.feedLikeType == 1 ? 0 : 1;
                                i.total_likes = result.total_likes
                            }
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
            activityId: "0",
            activityUserId: "0",
            feedLikeType: 0
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

            let uri = Memory().env == "LIVE" ? Global.URL_SHARE_FEED_TIME_LINE : Global.URL_SHARE_FEED_TIME_LINE_DEV

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

    /*
      * handle share feed API response
      */
    handleFeedShareResponse = (response, isError) => {
        console.log(TAG + " callFeedShareAPIResponse " + JSON.stringify(response));
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
            params.append("reported_id", this.state.reportedId)
            params.append("format", "json");
            params.append("type","post")
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
        console.log(TAG + " callFeedReportAPIResponse " + JSON.stringify(response));
        console.log(TAG + " callFeedReportAPI isError " + isError);

        if (!isError) {
            var result = response;
            if (typeof result != undefined && result != null) {
                if (typeof result.msg != undefined && result.msg != null) {
                    if(result.status == 'success') {
                        Alert.alert(
                            'Thank You',
                            result.msg,
                            [
                                {text: 'OK', onPress: () => {}},
                            ],
                            { cancelable: true }
                            )
                    } else{
                        Alert.alert(result.msg.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""))
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


    render() {
        let emptyView = (
            <View style={styles.emptyView}>
                <Text style={[stylesGlobal.empty_cardView_text, stylesGlobal.font]}>No record found.</Text>
            </View>
        );
        return (
            <Fragment>
            <SafeAreaView style={{backgroundColor:Colors.black,flex:0}}/>
            <View style={{flex: 1, backgroundColor: Colors.black, width: "100%", height: "100%", paddingBottom: bottomPadding}}>
                {this.renderHeaderView()}
                {this.renderBannerView()}
                {this.renderPopupView()}
                {this.state.dataTimeLines.length > 0 ? this.renderMainView() : emptyView}
                {this.renderReportPopupView()}
                {this.state.loading == true ? <ProgressIndicator /> : null}
                <ActionSheet
                    ref={o => this.ActionSheet = o}
                    title={'Choose an option'}
                    options={[ 'Report', 'Cancel']}
                    cancelButtonIndex={2}
                    onPress={(index) => {
                        console.log(TAG, "index " + index)
                      if (index == 0) {
                        this.setReportModalVisible(true)
                            // this.props.navigation.navigate("ReportFlag", {
                            //     data: this.state.reportData
                            // });
                        } else {
                            this.setState({
                                reportData: null
                            })
                        }
                    }}
                />
            </View>
            </Fragment>
        );
    }

    renderBannerView = () => {
        return (
            <BannerView
                screenProps = {this.props.navigation}
            />
        )
    }

    /**
     * Display block user comfirmation alert
     */
    displayBlockUserDialog = (data) => {
        var sharePost = false;
        let name = data.first_name
        if (data.shared_by_user_id != null && data.user_info != null) {
            name = data.user_info.first_name;
        }
        let title = Constants.LABEL_BLOCK_TITLE.format(name);
        let message = Constants.LABEL_BLOCK_MESSAGE.format(name);

        Alert.alert(title, message,
            [
                {
                    text: 'Block', onPress: () => {

                    }
                },
                {
                    text: 'Cancel', onPress: () => {

                    }
                }],
            { cancelable: false })
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

    /*
      * display top header
      */
    renderHeaderView = () => {
        let imageUrl = this.state.userImagePath + Constants.THUMB_FOLDER + this.state.userImageName;
        return (
            <View style={stylesGlobal.headerView}>
                <TouchableOpacity style={stylesGlobal.header_backbuttonview_style} onPress={() => {this.props.navigation.goBack()}}>
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


    renderMainView = () => {
        return (
            <View style={{ flex: 1, width: "100%", height: "100%" }}>
                {this.state.pulldown_loading && <PulllDownIndicator/>}
                {this.state.dataTimeLines.length > 0 ? this.renderTimeLineList : null}
            </View>
        );
    };
    /*
      * display timeline data
      */
    get renderTimeLineList() {
        let footerView = (
            <View style={{
                backgroundColor: Colors.black,
                height: 50,
                justifyContent: 'center',
                alignItems: 'center'
            }}>
                {this.state.displayLoadMoreLoader == false ? null :
                    <ProgressIndicator />
                }
            </View>
        );

        return (
            <View style={{ flex: 1, marginLeft: 10, marginRight: 10 }}>
                <FlatList
                    ListFooterComponent={this.state.displayLoadMoreView == true ? footerView : null}
                    extraData={this.state}
                    pagingEnabled={false}
                    showsHorizontalScrollIndicator={false}
                    showsVerticalScrollIndicator={false}
                    data={this.state.dataTimeLines}
                    keyExtractor={(item, index) => index.toString()}
                    renderItem={({ item, index }) => (
                        <RowUserTimeLine
                            data={item}
                            screenProps={this.props.navigation}
                            index={index}
                            likeUnLikeFeed={this.likeUnLikeFeed}
                            shareFeed={this.shareFeed}
                            refreshFeedCommentCount={this.refreshFeedCommentCount}
                            userId={this.state.userId}
                            showReportFlag={this.showReportFlag}
                            refreshProfileImage={this.refreshProfileImage}
                            refreshEventData={this.refreshEventData}
                        />
                    )}
                    onEndReachedThreshold={1}
                    onEndReached={({ distanceFromEnd }) => {
                        if(!this.state.pulldown_loading) {
                            if (this.state.isLoadMoreTimeLine) {
                                this.setState({
                                    displayLoadMoreView: true,
                                }, () => {
                                    this.getNextRecords(), this.setState({
                                        displayLoadMoreLoader: true
                                    })
                                })
                            }
                        }
                    }}
                    onScroll={event => {
                        if(event.nativeEvent.contentOffset.y < -80) {
                            if(!this.state.pulldown_loading) {
                                this.setState({
                                    pulldown_loading: true
                                }, () => {
                                    pageNumber = 0;
                                    array_TimeLine_list = [];
                                    this.callGetTimeLineListAPI(true);
                                })
                            }
                        }
                    }}
                />
            </View>
        );
    };

    /*
   * flag or report time line button click
   */
    showReportFlag = (data) => {
        this.setState({
            reportedId: data
        })
        this.ActionSheet.show()
    }

    /*
  * like and unlike time line button click
  */
    likeUnLikeFeed = (data) => {
        var type = (data.is_likes == 1 ? 1 : 0);
        this.setState({
            activityId: data.id,
            activityUserId: data.user_id,
            feedLikeType: type
        }, () => {
            this.callFeedLikeUnLikeAPI();
        });
    }

    /*
  * share time line button click
  */
    shareFeed = (data) => {
        console.log(TAG, "shareFeed called");
        this.setState({
            activityId: data.id,
        }, () => {
            this.callFeedShareAPI();
        });
    }

    setReportModalVisible(visible) {
        this.setState({ showReportModel: visible });
    }

    renderReportPopupView = () => {
        return (

            <CustomReportPopupView
                 showModel={this.state.showReportModel}
                 callAPI = {this.callReportAPI}
                 closeDialog={() => { this.setState({ showReportModel: false }) }}>
            </CustomReportPopupView>

        );
    }

    /*
   * update timeline comment count
   */
    refreshFeedCommentCount = (isRefresh, activityId, commentCount) => {
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

    /*
   * get next page record of timeline
   */
    getNextRecords = () => {

        if (!this.state.loading && !this.state.displayLoadMoreLoader) {
            console.log("getNextRecords called");
            if (this.state.isLoadMoreTimeLine) {
                console.log("getNextRecords called 1");
                this.callGetTimeLineListAPI(false);
            } else {
                console.log("getNextRecords called 3");
                this.setState({
                    isLoadMoreTimeLine: false,
                    displayLoadMoreView: false,
                    displayLoadMoreLoader: false
                })
            }
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
        backgroundColor: Colors.white,
        justifyContent: "center",
        flex: 1,
        width: "100%",
        height: "100%",
        alignItems: "center",
        alignContent: "center",
        flexDirection: "row"
    },
});

