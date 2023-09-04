import React, { Component, Fragment } from "react";
import {
    Platform,
    StyleSheet,
    Text,
    View,
    Image,
    FlatList,
    TouchableOpacity,
    Dimensions,
    TextInput,
    SafeAreaView,
    Alert,
    Keyboard
} from "react-native";

const { height, width } = Dimensions.get("window");
import WebService from "../core/WebService";
import { stylesGlobal, STICKY_HEADER_HEIGHT } from '../consts/StyleSheet'
import { Constants } from "../consts/Constants";
import { Colors } from "../consts/Colors";
import * as Global from "../consts/Global";
import ProgressIndicator from "./ProgressIndicator";
import PullDownIndicator from "./PullDownIndicator";
import Memory from '../core/Memory';
import { ImageCompressor } from './ImageCompressorClass';
import CustomPopupView from "../customview/CustomPopupView";
import RowConnection from "./RowConnection";
import BannerView from "../customview/BannerView"; 
import AsyncStorage from '@react-native-community/async-storage';
import {getEventsForInvite, callInviteUserToEvent, callFavoriteMember, callFollowRequest} from "../utils/Util";


var TAG = "ImportGuestList";

const cardMargin = 12;

export default class ImportGuestList extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            userId: "",
            userToken: "",
            userFirstName: "",
            userLastName: "",
            userImagePath: "",
            userImageName: "",
            userSlug: "",
            is_verified: "",

            selected_event_id: this.props.route.params.selected_event_id,
            imported_event_id: this.props.route.params.imported_event_id,
            inviteList: this.props.route.params.inviteList,

            loading: false,
            pulldown_loading: false,
            page_number: 1,
            count_per_page: 10,
            more_load: true, /// indicate to load more
            displayLoadMoreLoader: false,

            showModel: false,
            searchText: "",

            isOnlyRespondedInvite: false,
            selectAllInvitee: false,

            guest_list: [],
            global_guest_list: [],

            selected_invite_user: null, // used when invite a user
            selected_member: null, // used for favorite
        };
    }

    UNSAFE_componentWillMount() {
        this.getData();
    }

    /**
         * get async storage data
         */
    getData = async () => {
        try {
            var userId = await AsyncStorage.getItem(Constants.KEY_USER_ID);
            var userToken = await AsyncStorage.getItem(Constants.KEY_USER_TOKEN);
            var userFirstName = await AsyncStorage.getItem(Constants.KEY_USER_FIRST_NAME);
            var userLastName = await AsyncStorage.getItem(Constants.KEY_USER_LAST_NAME);
            var userImagePath = await AsyncStorage.getItem(Constants.KEY_USER_IMAGE_URL);
            var userImageName = await AsyncStorage.getItem(Constants.KEY_USER_IMAGE_NAME);
            var userSlug = await AsyncStorage.getItem(Constants.KEY_USER_SLUG);
            var is_verified = await AsyncStorage.getItem(Constants.KEY_IS_VERIFIED);

            this.setState({
                userId: userId,
                userToken: userToken,
                userFirstName: userFirstName,
                userLastName: userLastName,
                userImagePath: userImagePath,
                userImageName: userImageName,
                userSlug: userSlug,
                is_verified: is_verified,
            });

            this.callGetGuestsListAPI();
        } catch (error) {
            // Error retrieving data
        }
    };

    callGetGuestsListAPI = async () => {
        try {

            if(this.state.pulldown_loading) {
                this.setState({
                    loading: false
                })
            } else {
                this.setState({
                    loading: true
                })
            }
            
            let uri = Memory().env == "LIVE" ? Global.URL_IMPORT_EVENT_GUESTS : Global.URL_IMPORT_EVENT_GUESTS_DEV;

            // let params = new FormData();
            // params.append("token", this.state.userToken);
            // params.append("user_id", this.state.userId);
            // params.append("format", "json");
            // params.append("eventIds", JSON.stringify([this.state.imported_event_id]));

            const data = 
            {
                token: this.state.userToken,
                user_id: this.state.userId,
                format: 'json',
                eventIds: JSON.stringify([this.state.imported_event_id]),
                event_id: this.props.route.params.selected_event_id
            }
            if(this.state.isOnlyRespondedInvite) {
                //params.append("res", 1);
                data['res'] = 1;
            } else {
                //params.append("res", 0);
                data['res'] = 0;
            }

            console.log(TAG + " callGetGuestsListAPI uri " + uri);
            console.log(TAG + " callGetGuestsListAPI params " + JSON.stringify(data));

            WebService.callServicePost(
                uri,
                data,
                this.handleGetGuestsListResponse
            );
        } catch (error) {
            this.setState({
                loading: false,
                pulldown_loading: false,
            })
            if (error.message != undefined && error.message != null && error.message.length > 0) {
                Alert.alert(error.message.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    };
    /**
           * handle get guest list API response
           */
    handleGetGuestsListResponse = (response, isError) => {
        console.log(TAG + " callGetGuestsListAPI result " + JSON.stringify(response));
        console.log(TAG + " callGetGuestsListAPI isError " + isError);

        if (!isError) {
            var result = response;
            if(result.status == "success") {
                if(result.data.result != null) {
                    var inviteList = this.state.inviteList;
                    for(i = 0; i < result.data.result.length; i ++) {
                        if(this.state.selectAllInvitee) {
                            result.data.result[i].selected = true;
                        } else {
                            result.data.result[i].selected = false;
                        }
                        result.data.result[i].invited = false;
                        for(j = 0; j < inviteList.length; j ++) {
                            if(result.data.result[i].id == inviteList[j].id) {
                                result.data.result[i].selected = false;
                                result.data.result[i].invited = true;
                                break;
                            }
                        }
                    }

                    this.setState({
                        guest_list: result.data.result,
                        global_guest_list: result.data.result,
                    })
                }
            } else {
                if(response.msg)
                {
                    Alert.alert(response.msg, "");
                }else{
                    Alert.alert(Constants.UNKNOWN_MSG, "");
                    //UNKNOWN_MSG
                }
            }
            
        } else {
            if (response != undefined && response != null && response.length > 0) {
                Alert.alert(response.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
        this.setState({
            loading: false,
            pulldown_loading: false,
        })
    };

    callSendInvitationAPI = () => {
        try {
            this.setState({
                loading: true
            });
            let uri = Memory().env == "LIVE" ? Global.URL_SEND_EVENT_INVITATION : Global.URL_SEND_EVENT_INVITATION_DEV

            let params = new FormData();
            params.append("token", this.state.userToken);
            params.append("user_id", this.state.userId);
            params.append("format", "json");
            params.append("event_id", this.state.selected_event_id);
            if(this.state.selected_invite_user == null) {
                var count = 0;
                for(i = 0; i < this.state.global_guest_list.length; i ++) {
                    if(this.state.global_guest_list[i].selected == true) {
                        params.append("data[" + count + "]", this.state.global_guest_list[i].user_id);
                        count ++;
                    }
                }
            } else {
                params.append("data[0]", this.state.selected_invite_user.user_id);
            }
            
            console.log(TAG + " callSendInvitationAPI uri " + uri);
            console.log(TAG + " callSendInvitationAPI params " + JSON.stringify(params));

            WebService.callServicePost(
                uri,
                params,
                this.handleSendInvitationResponse
            );
        } catch (error) {
            console.log(TAG + " callSendInvitationAPI error " + error);
            this.setState({
                loading: false
            });
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    };

    /**
     * handle send invitaiton API response
     */
    handleSendInvitationResponse = (response, isError) => {
        console.log(TAG + "callSendInvitationAPI Response " + JSON.stringify(response));
        console.log(TAG + "callSendInvitationAPI isError " + isError);

        if (!isError) {
            if(response.status == "success") {
                if(this.state.selected_invite_user == null) {
                    if(this.props.route.params.goback) {
                        this.props.navigation.goBack();
                        this.props.route.params.goback();
                    } else {
                        this.props.navigation.goBack();
                    }
                } else {
                    var guest_list = [];
                    var global_guest_list = this.state.global_guest_list;
                    for(i = 0; i < global_guest_list.length; i ++) {
                        if(global_guest_list[i].user_id == this.state.selected_invite_user.user_id) {
                            global_guest_list[i].selected = false;
                            global_guest_list[i].invited = true;
                        }
                        if ( (global_guest_list[i].first_name + " " + global_guest_list[i].last_name).indexOf(this.state.searchText) > -1 ) {
                            guest_list.push(this.state.global_guest_list[i]);
                        }
                    }

                    var inviteList = this.state.inviteList
                    inviteList.push(this.state.selected_invite_user);

                    this.setState({
                        guest_list: guest_list,
                        global_guest_list: global_guest_list,
                        selected_invite_user: null,
                        inviteList: inviteList
                    })
                }
            } else {
                if(response.msg)
                {
                    Alert.alert(response.msg, "");
                }else{
                    Alert.alert(Constants.UNKNOWN_MSG, "");
                    //UNKNOWN_MSG
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

    favoriteFriend = async (data) => {
        try {
            this.setState({
                loading: true,
                selected_member: data
            });
            let uri = Memory().env == "LIVE" ? Global.URL_FAVOURITE_ACTION : Global.URL_FAVOURITE_ACTION_DEV

            let params = new FormData();
            params.append("token", this.state.userToken);
            params.append("user_id", this.state.userId);
            params.append("format", "json");
            params.append("req_user_id", data.user_id);
            if (data.favorite_id) {
                params.append("type", "remove");
            } else {
                params.append("type", "add");
            }

            console.log(TAG + " callFavouriteActionAPI uri " + uri);
            console.log(TAG + " callFavouriteActionAPI params " + JSON.stringify(params));

            WebService.callServicePost(
                uri,
                params,
                this.handleFavouriteActionResponse
            );
        } catch (error) {
            console.log(error)
            this.setState({
                loading: false
            });
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    };

    handleFavouriteActionResponse = (response, isError) => {
        console.log(TAG + " callFavouriteActionAPI Response " + JSON.stringify(response));
        console.log(TAG + " callFavouriteActionAPI isError " + isError);
        if (!isError) {
            if(response.status == "success") {
                var guest_list = this.state.guest_list;
                for(i = 0; i < guest_list.length; i ++) {
                    if(guest_list[i].id == this.state.selected_member.id) {
                        if(guest_list[i].st != null) {
                            if(guest_list[i].st == 0) {
                                guest_list[i].st = 1;
                            } else {
                                guest_list[i].st = 0;
                            }
                        } else {
                            if(guest_list[i].favorite_id) {
                                guest_list[i].favorite_id = null;
                            } else {
                                guest_list[i].favorite_id = 1;
                            }
                        }
                        break;
                    }
                }
            } else {
                Alert.alert(response.msg.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
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

    selectAllGuest = () => {
        this.setState({
            selectAllInvitee: !this.state.selectAllInvitee
        }, () => {
            var guest_list = this.state.guest_list;
            for(i = 0; i < guest_list.length; i ++) {
                if(!guest_list[i].invited) {
                    if(this.state.selectAllInvitee) {
                        guest_list[i].selected = true;
                    } else {
                        guest_list[i].selected = false;
                    }
                }
            }
            var global_guest_list = this.state.global_guest_list;
            for(i = 0; i < global_guest_list.length; i ++) {
                if(!global_guest_list[i].invited) {
                    if(this.state.selectAllInvitee) {
                        global_guest_list[i].selected = true;
                    } else {
                        global_guest_list[i].selected = false;
                    }
                }
            }
            this.setState({
                guest_list: guest_list,
                global_guest_list: global_guest_list
            })
        })
    }

    respondOnlyCheckbox() {
        this.setState({
            isOnlyRespondedInvite: !this.state.isOnlyRespondedInvite
        }, () => {
            this.callGetGuestsListAPI();
        })
    }

    importGuests = () => {
        var count = 0;
        for(i = 0; i < this.state.global_guest_list.length; i ++) {
            if(this.state.global_guest_list[i].selected == true) {
                count ++;
            }
        }
        if(count == 0) {
            Alert.alert(Constants.INVITEGUEST_EMPTY, "");
            return;
        }

        this.callSendInvitationAPI();

    }

    invite_user = (data) => {

        this.setState({
            selected_invite_user: data
        }, () => this.callSendInvitationAPI())
    }

    render() {
        
        return (
            <Fragment>
                <SafeAreaView style={{backgroundColor:Colors.black,flex:0}}/>
                <SafeAreaView style={{ flex: 1, backgroundColor: Colors.black, width: "100%", height: "100%", }}>
                { 
                    this.renderHeaderView() 
                }
                {
                    this.renderBannerView()
                }
                { 
                    this.renderPopupView() 
                }
                    <View style={{ alignItems: 'center', width: '100%', height: 40, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.card_titlecolor, borderRadius: 3 }}>
                        <Text style={[{color:Colors.gold, fontSize:20}, stylesGlobal.font]}>IMPORT GUESTS</Text>
                    </View>
                {
                    this.renderMainView()
                }
                {
                    this.state.loading == true && <ProgressIndicator /> 
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
    /**
           * display top header
           */
    renderHeaderView = () => {

        let imageUrl = this.state.userImagePath + Constants.THUMB_FOLDER + this.state.userImageName;

        return (
            <View style={stylesGlobal.headerView}>
                <TouchableOpacity style={stylesGlobal.header_backbuttonview_style} 
                    onPress={() => {
                        this.props.navigation.goBack();
                    }}
                >
                    <Image style = {stylesGlobal.header_backbuttonicon_style} source={require("../icons/icon_back.png")}/>
                </TouchableOpacity>
                <TouchableOpacity style={stylesGlobal.header_logoview_style} onPress = {() => this.props.navigation.navigate('Dashboard', {logoclick: true})}>
                    <Image style={stylesGlobal.header_logo_style} source={require("../icons/logo_new.png")}/>
                </TouchableOpacity>
                <View style={stylesGlobal.header_searchview_style}>
                    <TextInput
                        ref='searchTextInput'
                        autoCorrect = {false}
                        autoCapitalize = {"none"}
                        underlineColorAndroid="transparent"
                        returnKeyType={"search"}
                        style={[stylesGlobal.header_searchtextview_style, stylesGlobal.font]}
                        onChangeText={(text) => {this.setState({ searchText: text }, () => this.handleEditComplete(text))}}
                        value={this.state.searchText}
                        defaultValue=""
                        multiline={false}
                        placeholder="Search members..."
                        keyboardType='ascii-capable'
                        // onSubmitEditing={this.handleEditComplete}
                    />
                    <TouchableOpacity style={stylesGlobal.header_searchiconview_style} onPress = {() => {
                        if(this.state.searchText == "") {
                            this.refs.searchTextInput.focus();
                        } else {
                            Keyboard.dismiss();
                            this.setState({
                                searchText: ""
                            })
                            this.handleEditComplete("");
                        }}}
                    >
                    {
                        this.state.searchText != "" &&
                        <Image style = {stylesGlobal.header_searchicon_style} source={require("../icons/connection-delete.png")}/>
                    }
                    {
                        this.state.searchText == "" &&
                        <Image style = {stylesGlobal.header_searchicon_style} source={require("../icons/dashboard_search.png")}/>
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

    showPopupView = () => {
        this.setState({
            showModel: true
        })
    }

    hidePopupView = () => {
        this.setState({
            showModel: false
        })
    }
    
    logoutUser = async () => {
        this.hidePopupView();
        try {
            await AsyncStorage.setItem(Constants.KEY_USER_ID, "");
            await AsyncStorage.setItem(Constants.KEY_USER_TOKEN, "");
            
            this.props.navigation.navigate("SignInScreen", {isGettingData: false});
        } catch (error) {
            console.log(TAG + " logoutUser error " + error);
        }
    }

    getDataAgain = (refresh) => {
        if (refresh) {
            this.getData();
        }
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
        );
    }


    handleEditComplete = (searchText) => {
        var guest_list = [];
        if(searchText.length == 0 ) {
            this.setState({
                guest_list: this.state.global_guest_list
            })
        } else {
            for(i = 0; i < this.state.global_guest_list.length; i ++) {
                if ( (this.state.global_guest_list[i].first_name + " " + this.state.global_guest_list[i].last_name).indexOf(searchText) > -1 ) {
                    guest_list.push(this.state.global_guest_list[i]);
                }
            }
            this.setState({
                guest_list: guest_list
            })
        }

    };

    isCloseToTop = ({layoutMeasurement, contentOffset, contentSize}) => {
        const paddingToBottom = 10;
        return contentOffset.y <= -40
    };

    isCloseToBottom = ({layoutMeasurement, contentOffset, contentSize}) => {
        const paddingToBottom = 10;
        return layoutMeasurement.height + contentOffset.y >=
          contentSize.height - paddingToBottom;
    };


    renderMainView = () => {
        let emptyView = (
            <View style={styles.emptyView}>
                <View style={stylesGlobal.empty_cardView}>
                    <Text style={[stylesGlobal.empty_cardView_text, stylesGlobal.font]}>{"No guest list"}</Text>
                </View>
            </View>
        );
        return (
            <View style={{ flex: 1, width: "100%", height: "100%", alignItems: 'center', marginTop: 10}}>
                <View style = {{width: '100%', paddingLeft: 10}}>
                    <View style = {{width: '100%', flexDirection: 'row', alignItems: 'center'}}>
                        <TouchableOpacity style = {{ flexDirection: 'row', alignItems: 'center', marginVertical: 5}} onPress = {() => this.respondOnlyCheckbox()}>
                            <Image source={require('../icons/square.png')}  style={{width:20, height:20, resizeMode:'contain'}}/>
                        {
                            this.state.isOnlyRespondedInvite && 
                            <Image source={require('../icons/checked.png')} style={{position:'absolute', top: 0, left: 0, width: 20, height: 20, resizeMode:'contain'}}/>
                        }
                            <Text style = {[{fontSize: 14, color: Colors.gold, marginLeft: 5}, stylesGlobal.font]}>Display Only Invitees Who Responded</Text>
                        </TouchableOpacity>
                    </View>
                    <View style = {{width: '100%', flexDirection: 'row', alignItems: 'center'}}>
                        <TouchableOpacity style = {{ flexDirection: 'row', alignItems: 'center', marginVertical: 10}} onPress = {() => this.selectAllGuest()}>
                            <Image source={require('../icons/square.png')}  style={{width:20, height:20, resizeMode:'contain'}}/>
                        {
                            this.state.selectAllInvitee && 
                            <Image source={require('../icons/checked.png')} style={{position:'absolute', top: 0, left: 0, width: 20, height: 20, resizeMode:'contain'}}/>
                        }
                            <Text style = {[{fontSize: 14, color: Colors.gold, marginLeft: 5}, stylesGlobal.font]}>Select/Deselect All</Text>
                        </TouchableOpacity>
                    </View>
                </View>
                <View style = {{width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 10}}>
                    <TouchableOpacity style = {[styles.button_style, stylesGlobal.shadow_style, {marginRight: 10}]} onPress = {() => this.importGuests()}>
                        <Text style = {[styles.button_text, stylesGlobal.font]}>{"Invite Selected"}</Text>
                    </TouchableOpacity>
                </View>
            {
                this.state.pulldown_loading && <PullDownIndicator/>
            }
            {
                this.state.guest_list.length > 0 &&
                this.renderGuestList
            }
            {
                !this.state.loading && !this.state.pulldown_loading && this.state.guest_list.length == 0 &&
                emptyView
            }
            </View>
        );
    };
    /**
           * display guest list
           */
    get renderGuestList() {
        let footerView = (
            <View style={{backgroundColor: Colors.black, height: 50, justifyContent: 'center', alignItems: 'center'}}>
                <Image style = {{width: 50, height: 50}} resizeMode = {'contain'} source={require("../icons/loader.gif")}/>
            </View>
        );

        return (
            <View style={{ flex: 1, width: '100%',  marginTop: 10, alignItems: 'center' }}>
                <FlatList
                    ListFooterComponent={this.state.displayLoadMoreLoader == true ? footerView : null}
                    extraData={this.state}
                    pagingEnabled={false}
                    showsHorizontalScrollIndicator={false}
                    showsVerticalScrollIndicator={false}
                    data={this.state.guest_list}
                    keyExtractor={(item, index) => index.toString()}
                    style = {{width: '100%'}}
                    renderItem={({ item, index }) => 
                        <View key = {index} style = {{width: '100%', alignItems: 'center'}}>
                            <RowConnection
                                data={item}
                                screenProps={this.props.navigation}
                                messageButton={true}
                                select_guest = {this.select_guest}
                                myUserId={this.state.userId}
                                is_verified = {this.state.is_verified}
                                parentscreen = {"ImportGuestList"}
                                // followPress = {async(item) => {
                                //     this.setState({
                                //         selected_member: item,
                                //         loading: true
                                //     })
                                //     const response = await callFollowRequest(item, this.state.userId, this.state.userToken);
                                //     this.setState({
                                //         loading: false
                                //     })
                                //     if(response.status == "success") {
                                //         var guest_list = this.state.guest_list;
                                //         for(i = 0; i < guest_list.length; i ++) {
                                //             if(guest_list[i].id == this.state.selected_member.id) {
                                //                 if(guest_list[i].following_id) {
                                //                     guest_list[i].following_id = null;
                                //                 } else {
                                //                     guest_list[i].following_id = "1";
                                //                 }
                                //                 break;
                                //             }
                                //         }
                                //         this.setState({
                                //             guest_list: guest_list,
                                //             selected_member: null
                                //         })
                                //     }
                                // }}
                                // favoritePress = {async(item) => {
                                //     this.setState({
                                //         selected_member: item,
                                //         loading: true
                                //     })
                                //     const response = await callFavoriteMember(item, this.state.userId, this.state.userToken);
                                //     this.setState({
                                //         loading: false
                                //     })
                                //     if(response.status == "success") {
                                //         var guest_list = this.state.guest_list;
                                //         for(i = 0; i < guest_list.length; i ++) {
                                //             if(guest_list[i].id == this.state.selected_member.id) {
                                //                 if(guest_list[i].st != null) {
                                //                     if(guest_list[i].st == 0) {
                                //                         guest_list[i].st = 1;
                                //                     } else {
                                //                         guest_list[i].st = 0;
                                //                     }
                                //                 } else {
                                //                     if(guest_list[i].favorite_id) {
                                //                         guest_list[i].favorite_id = null;
                                //                     } else {
                                //                         guest_list[i].favorite_id = 1;
                                //                     }
                                //                 }
                                //                 break;
                                //             }
                                //         }
                                //     }
                                // }}
                                invite_user = {this.invite_user}
                                invite_guest = {true}
                            />  
                        </View>  
                    }
                    onEndReachedThreshold={1}
                    onScroll={({nativeEvent}) => {
                        if(this.isCloseToTop(nativeEvent)) {
                            if(!this.state.pulldown_loading && !this.state.loading) {
                                this.setState({
                                    pulldown_loading: true,
                                }, () => this.callGetGuestsListAPI())
                            }
                        }
                    }}
                />
            </View>
        );
    };

    select_guest = (data) => {
        
        var guest_list = [];

        var global_guest_list = this.state.global_guest_list;
        for(i = 0; i < global_guest_list.length; i ++) {
            if(global_guest_list[i].user_id == data.user_id) {
                global_guest_list[i].selected = !global_guest_list[i].selected;
            }
            if ( (global_guest_list[i].first_name + " " + global_guest_list[i].last_name).indexOf(this.state.searchText) > -1 ) {
                guest_list.push(this.state.global_guest_list[i]);
            }
        }
        this.setState({
            guest_list: guest_list,
            global_guest_list: global_guest_list
        })
    }

    
}

const styles = StyleSheet.create({
    emptyView: {
        flex: 1,
        width: "100%",
        alignItems: "center",
        justifyContent: "center"
    },
    button_style: {
        paddingVertical:10, 
        paddingHorizontal:10, 
        backgroundColor:Colors.gold, 
        borderRadius:5, 
        justifyContent: 'center', 
        alignItems: 'center'
    },
    button_text: {
        fontSize: 14,
        color: Colors.white
    },
    cardView: {
        width: width * 0.80,
        height: '90%',
        backgroundColor: Colors.white,
        padding: cardMargin,
        borderRadius: 10,
        margin: cardMargin,
        shadowColor: Colors.white,
        shadowOffset: {
            width: 0,
            height: 0
        },
        shadowRadius: 7,
        shadowOpacity: 7.0,
        justifyContent: 'center',
        alignItems: 'center'
    },
    fitImage: {
        width: width * 0.80 - 2 * cardMargin,
        height: width * 0.80 - 2 * cardMargin,
        borderRadius: 10,
        minHeight: width * 0.6,
        overflow: 'hidden',
        backgroundColor: Colors.white,
        aspectRatio: 1
    },
    rowView: {
        flexDirection: 'row',
        marginTop: 10,
        width: width * 0.6,
        backgroundColor: Colors.transparent
    },
    rowText: {
        color: Colors.black,
        marginLeft: 5,
        fontSize: 14,
        backgroundColor: Colors.transparent
    },
    labelIconView: {
        marginRight: 5,
        backgroundColor: Colors.transparent,
    },
    labelIcon: {
        width: 16,
        height: 18,
        resizeMode: 'contain',
        marginRight: 5,
        marginLeft: 5,
    },
});

