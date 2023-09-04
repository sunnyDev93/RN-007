import React, { Component, Fragment } from "react";
import {
    Alert,
    StyleSheet,
    Text,
    View,
    Image,
    FlatList,
    TouchableOpacity,
    Dimensions,
    TextInput,
    SafeAreaView,
    Keyboard
} from "react-native";

const { height, width } = Dimensions.get("window");
import RowEventInvite from "./RowEventInvite";
import WebService from "../core/WebService";
import { stylesGlobal, STICKY_HEADER_HEIGHT } from '../consts/StyleSheet'
import { Constants } from "../consts/Constants";
import { Colors } from "../consts/Colors";
import * as Global from "../consts/Global";
import ProgressIndicator from "./ProgressIndicator";
import PullDownIndicator from "./PullDownIndicator";
import Memory from '../core/Memory'
import Moment from "moment/moment";
import BannerView from "../customview/BannerView";
import AsyncStorage from '@react-native-community/async-storage';

var TAG = "InviteUserToEventsScreen";


export default class InviteUserToEventsScreen extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            pulldown_loading: false,
            userId: "",
            userToken: "",
            loading: false,
            first_loading: true,
            eventId: "",
            selectedContactList: [],
            dataEventList: [],
            isLoadMoreEvents: true,
            displayLoadMoreLoader: false,
            pageNumber: 0,

            searchText: '',
        };
    }

    UNSAFE_componentWillMount() {
        this.clearStateData();
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
            eventId: "",
            dataEventList: [],
            isLoadMoreEvents: true,
            displayLoadMoreLoader: false,
            pageNumber: 0
        });
    };
    /**
        * get asysnc storage data
        */
    getData = async () => {
        try {
            console.log(TAG + " getData");
            var userId = await AsyncStorage.getItem(Constants.KEY_USER_ID);
            var userToken = await AsyncStorage.getItem(Constants.KEY_USER_TOKEN);
            const { state } = this.props.navigation;

            this.setState({
                userId: userId,
                userToken: userToken,

            });
            this.callGetEventListAPI(true);
        } catch (error) {
            // Error retrieving data
        }
    };

    /*
   * call get event list API and display content
   */
    callGetEventListAPI = async (isFirstTime) => {
        try {
            if (isFirstTime) {
                if(!this.state.pulldown_loading) {
                    this.setState({
                        loading: true,
                        displayLoadMoreLoader: false
                    });
                }
            } else {
                this.setState({
                    displayLoadMoreLoader: true,
                });
            }

            let uri = Memory().env == "LIVE" ? Global.URL_INVITE_EVENTS : Global.URL_INVITE_EVENTS_DEV

            let params = new FormData();
            params.append("token", this.state.userToken);
            params.append("user_id", this.state.userId);
            params.append("format", "json");
            params.append("receiver_id", this.props.route.params.userid);

            console.log(TAG + " callGetEventListAPI uri " + uri);
            console.log(TAG + " callGetEventListAPI params " + JSON.stringify(params));

            WebService.callServicePost(
                uri,
                params,
                this.handleGetEventListResponse
            );
        } catch (error) {
            this.setState({
                pulldown_loading: false,
                loading: false,
                first_loading: false,
                displayLoadMoreLoader: false
            });
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    };
    /**
        * handle get event list API response
        */
    handleGetEventListResponse = (response, isError) => {
        console.log(TAG + " callGetEventListAPI result " + JSON.stringify(response));
        console.log(TAG + " callGetEventListAPI isError " + isError);

        if (!isError) {
            var result = response;
            if (typeof result != undefined && result != null) {
                if (typeof result.data != undefined && result.data != null) {
                    var dataEventList = this.state.dataEventList;
                    if (this.state.pulldown_loading) {
                        dataEventList = [];
                    }
                    var mData = result.data.events;
                    var event_endDateTime = "";

                    if (mData.length > 0) {
                        mData.map((i, j) => {
                            event_endDateTime = Moment(i.to_date).format('MM/DD/YYYY') + " " + i.to_time;
                            if(new Date(event_endDateTime) > new Date()) {
                                if(i.invitation_id == null) {
                                    i.check = false;
                                } else {
                                    i.check = true;
                                }
                                dataEventList.push(i);
                            }
                        });

                        this.setState({
                            isLoadMoreEvents: true,
                            pageNumber: this.state.pageNumber + 1
                        });

                    } else {
                        this.setState({
                            isLoadMoreEvents: false
                        });
                    }

                    this.setState({
                        dataEventList: dataEventList,
                    });
                }
            }

        } else {
            if (response != undefined && response != null && response.length > 0) {
                Alert.alert(response.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
        this.setState({
            pulldown_loading: false,
            first_loading: false,
            loading: false,
            displayLoadMoreLoader: false
        });

    };
    /**
        *  call send invitation API
        */
    callSendInvitationAPI = () => {
        try {
            this.setState({
                loading: true
            });
            let uri = Memory().env == "LIVE" ? Global.URL_INVITE_USER_TO_EVENTS : Global.URL_INVITE_USER_TO_EVENTS_DEV

            let params = new FormData();
            params.append("token", this.state.userToken);
            params.append("user_id", this.state.userId);
            params.append("format", "json");
            params.append("userId", this.props.route.params.userid);
            for (var i = 0; i < this.state.selectedContactList.length; i++) {

                params.append("event[" + i + "]", this.state.selectedContactList[i]);
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
        * handle send invitation API response
        */
    handleSendInvitationResponse = (response, isError) => {
        console.log(TAG + " callSendInvitationAPI Response " + response);
        console.log(TAG + " callSendInvitationAPI isError " + isError);

        if (!isError) {
            var result = response;
            if (typeof result != "undefined" && result != null) {

                const { eventId, goToEventScreen } = this.props.route.params;

                if (goToEventScreen) {
                    this.props.navigation.goBack();
                    goToEventScreen()
                } else {
                    this.props.navigation.goBack();
                }
            }
        } else {
            if (response != undefined && response != null && response.length > 0) {
                Alert.alert(response.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
            const { eventId, goToEventScreen } = this.props.route.params;
            if (goToEventScreen) {
                this.props.navigation.goBack();
                goToEventScreen()
            } else {
                this.props.navigation.goBack();
            }
        }
        this.setState({
            messageLoader: false
        });
    };

    render() {
        let emptyView = (
            <View style={styles.emptyView}>
                <View style = {[stylesGlobal.empty_cardView, {height: '90%', justifyContent: 'center', alignItems: 'center'}]}>
                    <Text style={[stylesGlobal.card_empty_text, stylesGlobal.font, ]}>You are not currently hosting any event.</Text>
                    <TouchableOpacity style = {[{paddingVertical: 10, paddingHorizontal: 20, minWidth: 60, backgroundColor: Colors.gold, borderRadius: 5, marginTop: 15, justifyContent: 'center', alignItems: 'center'}, stylesGlobal.shadow_style]} 
                        onPress = {() => {
                            this.props.navigation.navigate("CreateEvent", {
                                user_id: this.state.userId,
                                token: this.state.userToken,
                                data: null,
                                isCopy: false,
                                loadAfterDeletingEvent: () => {
                                    this.clearStateData();
                                    this.getData();},
                                type: 'create_event'
                            })
                        }}
                    >
                        <Text style = {[{fontSize: 14, color: Colors.white}, stylesGlobal.font]}>Host a Party</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );

        return (
            <Fragment>
                <SafeAreaView style={{backgroundColor:Colors.black,flex:0}}/>
                <SafeAreaView style={[styles.container, {backgroundColor: !this.state.dataEventList.length ? Colors.black : Colors.white}]}>
                    {this.renderHeaderView()}
                    {this.renderBannerView()}
                    {this.state.dataEventList.length == 0 && !this.state.loading && !this.state.pulldown_loading && emptyView}
                    {this.state.dataEventList.length > 0 && this.renderMainView()}
                    {this.state.loading == true && <ProgressIndicator />}
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

    handleEditComplete = () => {
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
                        onSubmitEditing={this.handleEditComplete}
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
            {
                this.state.dataEventList.length > 0 ?
                <View style={[stylesGlobal.header_avatarview_style, {width: 70, height: 30}]}>
                    <TouchableOpacity
                        style={{backgroundColor: Colors.gold, justifyContent: 'center', alignItems: 'center', borderRadius: 20, width: '100%', height: '100%'}}
                        onPress={() => {
                            //  console.log(JSON.stringify(this.state.selectedContactList))
                            if (this.state.selectedContactList.length > 0) {
                                this.callSendInvitationAPI();
                            } else {
                                Alert.alert(Constants.INVITEUSERTOEVENT_EMPTY, "");
                            }
                        }}
                    >
                        <Text style={[{ color: Colors.white, fontSize: 13, backgroundColor: Colors.transparent, }, stylesGlobal.font]}> Send </Text>
                    </TouchableOpacity>
                </View>
                : null
            }
            </View>
        );
    };

    renderMainView = () => {
        return (
            <View style={{ flex: 1, width: "100%", }}>
                {this.state.pulldown_loading && <PullDownIndicator/>}
                {this.state.dataEventList.length > 0 && this.renderEventList}
            </View>
        );
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
    /**
        * display event list
        */
    get renderEventList() {
        let footerView = (
            <View style={{
                backgroundColor: Colors.white,
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
            <View style={{ flex: 1, width: "100%", padding: 10 }}>
                <FlatList
                    ListFooterComponent={this.state.displayLoadMoreLoader == true ? footerView : null}
                    extraData={this.state}
                    pagingEnabled={false}
                    showsHorizontalScrollIndicator={false}
                    showsVerticalScrollIndicator={false}
                    data={this.state.dataEventList}
                    keyExtractor={(item, index) => index.toString()}
                    renderItem={({ item, index }) => (
                        <RowEventInvite
                            data={item}
                            screenProps={this.props.navigation}
                            index={index}
                            onItemPress={this.onItemPress}
                        />
                    )}
                    onEndReachedThreshold={1}
                    onScroll={async({nativeEvent}) => {
                        if(this.isCloseToTop(nativeEvent)) {
                            if(!this.state.pulldown_loading && !this.state.first_loading) {
                                this.setState({
                                    pulldown_loading: true,
                                    pageNumber: 0
                                }, () => {
                                    this.callGetEventListAPI(true);
                                })
                                
                            }
                        }
                    }}
                />
            </View>
        );
    };

    /**
        * event item click
        */
    onItemPress = (data) => {
        this.state.dataEventList.map((item) => {
            if (item.id === data.id) {
                item.check = !item.check
                if (item.check === true) {
                    this.state.selectedContactList.push(data.id);
                } else if (item.check === false) {
                    const i = this.state.selectedContactList.indexOf(data.id)
                    if (i != -1) {
                        this.state.selectedContactList.splice(i, 1)
                    }
                }
            }
        })
        this.setState({ dataEventList: this.state.dataEventList })
    }


    updateRecentChatList = (isRefresh) => {
        if (isRefresh) {
        }
    };

}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: "100%",
        height: "100%",
        backgroundColor: Colors.white
    },
    emptyView: {
        backgroundColor: Colors.black,
        justifyContent: "center",
        flex: 1,
        width: "100%",
        height: "100%",
        alignItems: "center",
    },
});

