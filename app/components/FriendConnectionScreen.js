import React, { Component, Fragment } from "react";
import {
    Platform,
    StyleSheet,
    View,
    FlatList,
    Image,
    TouchableOpacity,
    TextInput,
    Text,
    ActivityIndicator,
    Keyboard,
    Dimensions,
    Alert,
    SafeAreaView
} from "react-native";
import DialogInput from "../customview/DialogInput";
import RowConnection from "./RowConnection";
import WebService from "../core/WebService";
import { Constants } from "../consts/Constants";
import { Colors } from "../consts/Colors";
import * as Global from "../consts/Global";
import ProgressIndicator from "./ProgressIndicator";
import { stylesGlobal, STICKY_HEADER_HEIGHT } from '../consts/StyleSheet'
import Memory from '../core/Memory';
import { ImageCompressor } from './ImageCompressorClass';
import CustomPopupView from "../customview/CustomPopupView";
import BannerView from "../customview/BannerView";
import AsyncStorage from '@react-native-community/async-storage';
import InviteUserToEventView from "../customview/InviteUserToEventView";
import {getEventsForInvite, callInviteUserToEvent, callFavoriteMember, callFollowRequest} from "../utils/Util";

const isIos = Platform.OS === 'ios'
const isIphoneX = isIos && (Dimensions.get('window').height === 812 || Dimensions.get('window').height === 896);
const bottomPadding = isIphoneX ? 36 : 0;



let timeStamp = 0;

var TAG = "FriendConnectionScreen";
export default class FriendConnectionScreen extends React.Component {

    constructor(props) {
        super(props);
        type = this.props.type;
        this.state = {
            userId: "",
            userToken: "",
            loading: true,
            dataConnectionList: [],
            isLoadMoreConnections: true,
            displayLoadMoreLoading: false,
            userSlug: '',
            modalVisible: false,
            isReloginAlert: false,
            searchText: "",
            showModel: false,

            selected_member: null,

            invite_event_list: [],
            invite_event_view: false,
            invited_user: null
        };
    }

    UNSAFE_componentWillMount() {
        this.refreshProfileImage();
        this.clearStateData();
        this.getData(false);
    }


    /**
     * clear state data
    */
    clearStateData = () => {
        
        this.setState({
            userId: "",
            userToken: "",
            is_verified: '0',
            loading: true,
            dataConnectionList: [],
            isLoadMoreConnections: true,
            displayLoadMoreLoading: false,
            userSlug: '',
            modalVisible: false,
            isReloginAlert: false,
            page_number: 0
        });
    };
    /**
     * get async storage data
    */
    getData = async (isFilterCall) => {
        try {
            var userId = await AsyncStorage.getItem(Constants.KEY_USER_ID);
            var userToken = await AsyncStorage.getItem(Constants.KEY_USER_TOKEN);
            var is_verified = await AsyncStorage.getItem(Constants.KEY_IS_VERIFIED);

            this.setState({
                userId: userId,
                userToken: userToken,
                is_verified: is_verified,
                modalVisible: false,
                page_number: 0
            });
            console.log(TAG + " getData userId " + userId);
            console.log(TAG + " getData userToken " + userToken);
            this.callMyConnectionsListAPI(true);
        } catch (error) {
            console.log(error)
            // Error retrieving data
        }
    };

    /*
    * call get connection list API and display content
    */
    callMyConnectionsListAPI = async (isFirstTime) => {
        var favorite_user_id = this.props.route.params.favorite_user_id;
        try {
            if (!this.state.displayLoadMoreLoading) {
                this.setState({
                    loading: true,
                });
            } 

            let uri = Memory().env == "LIVE" ? Global.URL_MY_FAVORITE_LIST  : Global.URL_MY_FAVORITE_LIST_DEV;
            let params = new FormData();
            params.append("token", this.state.userToken);
            params.append("user_id", this.state.userId);
            params.append("format", "json");
            params.append("favorite_user_id", favorite_user_id);
            params.append("page", this.state.page_number);
            params.append("type", 1)

            console.log(TAG + " callMyConnectionsListAPI uri " + uri);
            console.log(TAG + " callMyConnectionsListAPI params " + JSON.stringify(params));

            WebService.callServicePost(
                uri,
                params,
                this.handleMyConnectionListResponse
            );
        } catch (error) {
            this.setState({
                loading: false,
                displayLoadMoreLoading: false
            });
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    };
    /**
     * handle connection list API response
    */
    handleMyConnectionListResponse = (response, isError) => {
        console.log(TAG + " callMyConnectionsListAPI Response " + JSON.stringify(response));
        console.log(TAG + " callMyConnectionsListAPI isError " + isError);

        if (!isError) {
            var result = response;
            if (typeof result != undefined && result != null) {
                if (typeof result.data != undefined && result.data != null) {
                    var dataConnectionList = this.state.dataConnectionList;
                    var mData = result.data.favorite;
                    if(mData.length > 0) {
                        if(this.state.displayLoadMoreLoading) {
                            this.setState({
                                dataConnectionList: [...dataConnectionList, ...mData],
                            })
                        } else {
                            this.setState({
                                dataConnectionList: mData,
                            })
                        }
                        this.setState({
                            isLoadMoreConnections: true,
                            page_number: this.state.page_number + 1
                        }); 
                    } else {
                        this.setState({
                            isLoadMoreConnections: false
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
            displayLoadMoreLoading: false
        });
    };

    render() {

        let emptyView = (
            <View style={stylesGlobal.empty_cardView}>
                <Text style={[stylesGlobal.empty_cardView_text, stylesGlobal.font]}>No record found.</Text>
            </View>
        );

        return (
            <Fragment>
                <SafeAreaView style={{ flex: 0, backgroundColor: Colors.black }}/>
                <SafeAreaView style={{flex: 1, backgroundColor: Colors.black, paddingBottom: bottomPadding, justifyContent: 'center', alignItems: 'center'}}>
                    {this.state.loading == true && <ProgressIndicator />}
                    {this.renderHeaderView()}
                    {this.renderBannerView()}
                    {this.renderPopupView()}
                {
                    this.state.invite_event_view && 
                    <InviteUserToEventView
                        screenProps = {this.props.screenProps}
                        invited_user = {this.state.selected_member}
                        invite_event_list = {this.state.invite_event_list}
                        close_view = {() => this.setState({invite_event_view: false})}
                        selectUserforInvite = {(item, index) => {
                            if(item.invitation_id == null) {
                                var invite_event_list = this.state.invite_event_list;
                                invite_event_list[index].check = !invite_event_list[index].check;
                                this.setState({
                                    invite_event_list: invite_event_list
                                })
                            }
                        }}
                        callInviteUserToEvent = {async() => {
                            var exist = false
                            for (var i = 0; i < this.state.invite_event_list.length; i++) {
                                if(this.state.invite_event_list[i].check) {
                                    exist = true;
                                    break;
                                }
                            }
                            if(!exist) {
                                Alert.alert(Constants.INVITE_EVENT_SELECTION, "");
                                return;
                            }
                            this.setState({
                                loading: true
                            });
                            const response = await callInviteUserToEvent(this.state.selected_member, this.state.invite_event_list, this.state.userId, this.state.userToken);
                            if(response.status == "success") {
                                Alert.alert(Constants.INVITED_USER_SUCCESS + this.state.selected_member.first_name + " " + this.state.selected_member.last_name, "");
                            }
                            this.setState({
                                loading: false,
                                invite_event_view: false
                            })
                        }}
                    />
                }
                {
                    (this.state.loading == false && this.state.dataConnectionList.length == 0) ? emptyView : this.renderMainView()
                }
                </SafeAreaView>
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

    renderMainView = () => {
        return (
            <View style={{ flex: 1, width: "100%", height: "100%", alignItems: 'center' }}>
                {this.renderConnectionList}
            </View>
        );
    };
    /**
     * display connection list
    */
    get renderConnectionList() {
        let footerView = (
            <View style={{ backgroundColor: Colors.black, height: 50, justifyContent: 'center', alignItems: 'center'}}>
                <Image style = {{width: 50, height: 50}} resizeMode = {'contain'} source={require("../icons/loader.gif")}/>
            </View>
        );

        return (
            <View style={{ flex: 1 }}>
                <FlatList
                    ListFooterComponent={this.state.displayLoadMoreLoading == true ? footerView : null}
                    extraData={this.state}
                    pagingEnabled={false}
                    showsHorizontalScrollIndicator={false}
                    showsVerticalScrollIndicator={false}
                    data={this.state.dataConnectionList}
                    keyExtractor={(item, index) => index}
                    renderItem={({ item, index }) => (
                        <RowConnection
                            data={item}
                            screenProps={this.props.navigation}
                            messageButton={true}
                            messageButton={true}
                            inviteButton = {async(item) => {
                                this.setState({
                                    selected_member: item,
                                    loading: true
                                })
                                const response = await getEventsForInvite(item, this.state.userId, this.state.userToken);
                                this.setState({
                                    loading: false
                                })
                                if(response.status == "success") {
                                    this.setState({
                                        invite_event_list: response.data.events,
                                        invite_event_view: true
                                    })
                                }
                            }}
                            followPress = {async(item) => {
                                this.setState({
                                    selected_member: item,
                                    loading: true
                                })
                                const response = await callFollowRequest(item, this.state.userId, this.state.userToken);
                                this.setState({
                                    loading: false
                                })
                                if(response.status == "success") {
                                    var dataConnectionList = this.state.dataConnectionList;
                                    for(i = 0; i < dataConnectionList.length; i ++) {
                                        if(dataConnectionList[i].id == this.state.selected_member.id) {
                                            if(dataConnectionList[i].following_id) {
                                                dataConnectionList[i].following_id = null;
                                            } else {
                                                dataConnectionList[i].following_id = "1";
                                            }
                                            break;
                                        }
                                    }
                                    this.setState({
                                        dataConnectionList: dataConnectionList,
                                        selected_member: null
                                    })
                                }
                            }}
                            favoritePress = {async(item) => {
                                this.setState({
                                    selected_member: item,
                                    loading: true
                                })
                                const response = await callFavoriteMember(item, this.state.userId, this.state.userToken);
                                this.setState({
                                    loading: false
                                })
                                if(response.status == "success") {
                                    var dataConnectionList = this.state.dataConnectionList;
                                    for(i = 0; i < dataConnectionList.length; i ++) {
                                        if(dataConnectionList[i].user_id == this.state.selected_member.user_id) {
                                            if(dataConnectionList[i].favorite_id) {
                                                dataConnectionList[i].favorite_id = null;
                                            } else {
                                                dataConnectionList[i].favorite_id = 1;
                                            }
                                            this.setState({
                                                dataConnectionList: dataConnectionList,
                                                selected_member: null
                                            })
                                            break;
                                        }
                                    }
                                }
                            }}
                            myUserId={this.state.userId}
                            is_verified = {this.state.is_verified}
                        />
                    )}
                    onEndReachedThreshold={1}
                    onEndReached={({ distanceFromEnd }) => {
                        if (this.state.isLoadMoreConnections) {
                            if(!this.state.displayLoadMoreLoading) {
                                this.setState({
                                    displayLoadMoreLoading: true,
                                }, () => {
                                    this.callMyConnectionsListAPI(false);
                                })
                            }
                        }
                    }}
                />
            </View>
        );
    };

    /**
     * auto load next records
    */
    getNextConnectionRecords = () => {

        if (!this.state.loading && !this.state.displayLoadMoreLoading) {
            console.log("getNextConnectionRecords called");
            if (this.state.isLoadMoreConnections) {
                console.log("getNextConnectionRecords called 1");

                this.callMyConnectionsListAPI(false);

            } else {
                console.log("getNextConnectionRecords called 3");
                this.setState({
                    isLoadMoreConnections: false,
                    displayLoadMoreLoading: false
                })
            }
        }

    }


    updateRecentChatList = (isRefresh) => {

    };

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
