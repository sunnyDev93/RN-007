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
import Moment from "moment/moment";
import { stylesGlobal, STICKY_HEADER_HEIGHT } from '../consts/StyleSheet'
import { Constants } from "../consts/Constants";
import { Colors } from "../consts/Colors";
import * as Global from "../consts/Global";
import ProgressIndicator from "./ProgressIndicator";
import PullDownIndicator from "./PullDownIndicator";
import Memory from '../core/Memory';
import { ImageCompressor } from './ImageCompressorClass';
import CustomPopupView from "../customview/CustomPopupView";
import BannerView from "../customview/BannerView";
import AsyncStorage from '@react-native-community/async-storage';

const isIos = Platform.OS === 'ios'
const isIphoneX = isIos && (Dimensions.get('window').height === 812 || Dimensions.get('window').height === 896);
const inviteButtonPadding = isIphoneX ? 5 : 12

var TAG = "ImportGuestEvent";

const cardMargin = 12;

export default class ImportGuestEvent extends React.Component {

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

            event_id: this.props.route.params.event_id,
            inviteList: this.props.route.params.inviteList,

            loading: false,
            pulldown_loading: false,
            page_number: 1,
            count_per_page: 10,
            more_load: true, /// indicate to load more
            displayLoadMoreLoader: false,

            selected_event: null,
            
            showModel: false,
            searchText: "",



            event_list: [],
        };
    }

    UNSAFE_componentWillMount() {
        this.getData();
    }

    // componentDidMount() {
    //     this.initListener = this.props.navigation.addListener('focus', this.initData.bind(this));
    // }

    // componentWillUnmount() {
    //     this.initListener();
    // }

    // initData = () => {
    //     this.callEventDetailAPI(this.state.event_id);
    // }

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

            this.callGetEventListAPI(true);
        } catch (error) {
            // Error retrieving data
        }
    };

    callGetEventListAPI = async () => {
        try {
            if(this.state.pulldown_loading || this.state.displayLoadMoreLoader) {
                this.setState({
                    loading: false
                })
            } else {
                this.setState({
                    loading: true
                })
            }
            
            let uri = Memory().env == "LIVE" ? Global.URL_IMPORT_EVENTS : Global.URL_IMPORT_EVENTS_DEV;

            let params = {
                "token": this.state.userToken,
                "user_id": this.state.userId,
                "format": "json",
                "event_id": this.state.event_id,
                "page_number": this.state.page_number,
                "count_per_page": this.state.count_per_page};

            console.log(TAG + " callGetEventListAPI uri " + uri);
            console.log(TAG + " callGetEventListAPI params " + JSON.stringify(params));

            WebService.callServicePost(
                uri,
                params,
                this.handleGetEventsListResponse
            );
        } catch (error) {
            this.setState({
                loading: false,
                pulldown_loading: false,
                displayLoadMoreLoader: false
            })
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    };
    /**
           * handle get guest list API response
           */
    handleGetEventsListResponse = (response, isError) => {
        console.log(TAG + " callGetEventListAPI result " + JSON.stringify(response));
        console.log(TAG + " callGetEventListAPI isError " + isError);

        if (!isError) {
            var result = response;
            if(result.status == "success") {
                if(result.data.events == null || result.data.events.length == 0) {
                    this.setState({
                        more_load: false
                    })
                } else {
                    for(i = 0; i < result.data.events.length; i ++) {
                        result.data.events[i].selected = false;
                    }
                    if(this.state.pulldown_loading || this.state.displayLoadMoreLoader) {
                        this.setState({
                            event_list: [...this.state.event_list, ...result.data.events]
                        })
                    } else {
                        this.setState({
                            event_list: result.data.events
                        })
                    }
                    this.setState({
                        page_number: this.state.page_number + 1
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
            displayLoadMoreLoader: false
        })
    };

    callEventDetailAPI = async (eventId) => {
        try {
            this.setState({
                loading: true,
            });
            let uri = Memory().env == "LIVE" ? Global.URL_EVENT_DETAIL + eventId : Global.URL_EVENT_DETAIL_DEV + eventId
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
                commentLoading: false
            });
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
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
                
                if (result.data != undefined && result.data != null) {
                    this.setState({
                        inviteList: result.data.invite,
                    })
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

    render() {
        let emptyView = (
            <View style={styles.emptyView}>
                <View style = {stylesGlobal.empty_cardView}>
                    <Text style={[stylesGlobal.empty_cardView_text, stylesGlobal.font]}>
                    No events.
                    </Text>
                </View>
            </View>
        );
        return (
            <Fragment>
                <SafeAreaView style={{backgroundColor:Colors.black,flex:0}}/>
                <SafeAreaView style={{ flex: 1, backgroundColor: Colors.black, width: "100%", height: "100%" }}>
                { this.renderHeaderView() }
                {this.renderBannerView()}
                { this.renderPopupView() }
                <View style={{ alignItems: 'center', width: '100%', height: 40, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.card_titlecolor, borderRadius: 3 }}>
                    <Text style={[{color:Colors.gold, fontSize:20}, stylesGlobal.font]}>IMPORT GUESTS</Text>
                </View>
                {
                    this.state.event_list.length > 0 &&
                    this.renderMainView()
                }
                {
                    !this.state.loading && !this.state.pulldown_loading && this.state.event_list.length == 0 &&
                    emptyView
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
                    <Image
                        style={stylesGlobal.header_logo_style}
                        source={require("../icons/logo_new.png")}
                    />
                </TouchableOpacity>
                <View style={stylesGlobal.header_searchview_style}>
                    <TextInput
                        ref='searchTextInput'
                        autoCorrect = {false}
                        underlineColorAndroid="transparent"
                        returnKeyType={"search"}
                        style={[stylesGlobal.header_searchtextview_style, stylesGlobal.font]}
                        onChangeText={searchText => this.setState({ searchText })}
                        value={this.state.searchText}
                        defaultValue=""
                        multiline={false}
                        autoCapitalize='sentences'
                        placeholder="Search members..."
                        keyboardType='ascii-capable'
                        onSubmitEditing={this.handleEditComplete}
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

    handleEditComplete = () => {
        searchText = this.state.searchText.trim();
        this.setState({
            searchText: searchText,
        });
        if (searchText.length > 0) {
            this.props.navigation.navigate('Dashboard', {selected_screen: "members", search_text: searchText});
        }
    };


    refreshListData = () => {
        console.log(TAG, "refreshListData called")
        this.props.navigation.goBack();
    }

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
        return (
            <View style={{ flex: 1, width: "100%", height: "100%", alignItems: 'center', marginTop: 10}}>
            {
                this.state.pulldown_loading && <PullDownIndicator/>
            }
            {
                this.renderEventGuestList
            }
            </View>
        );
    };
    /**
           * display guest list
           */
    get renderEventGuestList() {
        let footerView = (
            <View style={{
                backgroundColor: Colors.black,
                height: 50,
                justifyContent: 'center',
                alignItems: 'center'
            }}>
                <Image style = {{width: 50, height: 50}} resizeMode = {'contain'} source={require("../icons/loader.gif")}/>

            </View>
        );

        return (
            <View style={{ flex: 1, width: '100%',  marginTop: 10, alignItems: 'center' }}>
                <FlatList
                    ref = {ref => {this._event_flatlist = ref}}
                    ListFooterComponent={this.state.displayLoadMoreLoader == true ? footerView : null}
                    extraData={this.state}
                    pagingEnabled={false}
                    showsHorizontalScrollIndicator={false}
                    showsVerticalScrollIndicator={false}
                    data={this.state.event_list}
                    keyExtractor={(item, index) => index.toString()}
                    renderItem={({ item, index }) =>  this._renderItem(item, index)}
                    onEndReachedThreshold={1}
                    onScroll={({nativeEvent}) => {
                        if(this.isCloseToTop(nativeEvent)) {
                            if(!this.state.pulldown_loading) {
                                this.setState({
                                    pulldown_loading: true,
                                    page_number: 1,
                                }, () => this.callGetEventListAPI())
                            }
                        }
                        if(this.isCloseToBottom(nativeEvent)) {
                            if(this.state.more_load) {
                                if (!this.state.displayLoadMoreLoader) {
                                    this.setState({
                                        displayLoadMoreLoader: true,
                                    }, () => this.callGetEventListAPI())
                                }
                            }
                        }
                    }}
                    onScrollToIndexFailed={(error) => {
                        setTimeout(() => {
                            this._event_flatlist.scrollToIndex({ index: 0, animated: true });
                        }, 100);
                    }}
                />
            </View>
        );
    };

    _renderItem = (item, index)=>{
        var event_image_url = item.event_image_path + Constants.THUMB_FOLDER + item.event_image_name;
        return(
                <TouchableOpacity style={[styles.cardView, ]} activeOpacity = {Global.activeOpacity}
                    onPress={() => {
                        var event_list = this.state.event_list;
                        for(i = 0; i < event_list.length; i ++) {
                            if(i == index) {
                                event_list[i].selected = true;
                                this.setState({
                                    selected_event: event_list[i]
                                })
                                console.log(JSON.stringify(event_list[i]))
                            } else {
                                event_list[i].selected = false;
                            }
                        }
                        this.setState({
                            event_list: event_list
                        }, () => {
                            this.props.navigation.navigate("ImportGuestList", {
                                selected_event_id: this.state.event_id,
                                imported_event_id: this.state.selected_event.id, 
                                target_event_id: this.props.route.params.event_id,
                                goback: this.goback, 
                                inviteList: this.state.inviteList,
                                callEventDetailAPI: this.callEventDetailAPI
                            });
                        })
                    }}
                >
                    <View
                        activeOpacity = {Global.activeOpacity}
                        onPress={() => {
                            this.props.navigation.navigate("EventDetail", {
                                eventId: item.id,
                                // loadAfterDeletingEvent: this.props.loadAfterDeletingEvent,
                                refreshEventData: this.refreshEventData,
                                EventCategory: item.event_category_name,
                                // tab_type: this.props.type,
                                // invite_code: item.invite_code
                            });
                        }}
                    >
                        <ImageCompressor uri={event_image_url} style={styles.fitImage}/>
                        <Text style={[stylesGlobal.titleText, stylesGlobal.font_bold]} numberOfLines={1}>
                            {item.title}
                        </Text>
                    </View>

                    <View activeOpacity = {Global.activeOpacity}>
                        <View style={styles.rowView}>
                            <View style={styles.labelIconView}>
                                <Image style={styles.labelIcon} source={require("../icons/calendar.png")}/>
                            </View>
                            <Text style={[styles.rowText, stylesGlobal.font]}>
                                {Moment(item.from_date).format("MMM DD, YYYY (ddd)")} {item.event_category_name.toUpperCase() === 'travel'.toUpperCase() ? '-' : ''} {item.event_category_name.toUpperCase() === 'travel'.toUpperCase() ? Moment(item.to_date).format("MMM DD, YYYY (ddd)") : ''}
                            </Text>

                        </View>
                    {
                        item.event_category_name.toUpperCase() != 'travel' && item.from_time != null && 
                        <View style={styles.rowView}>
                            <View style={styles.labelIconView}>
                                <Image
                                    style={styles.labelIcon}
                                    source={require("../icons/clock.png")}
                                />
                            </View>
                            <Text style={[styles.rowText, stylesGlobal.font]}>
                                {item.from_time} - {item.to_time}
                            </Text>
                        </View> 
                    }

                        <View style={styles.rowView}>
                            <View style={styles.labelIconView}>
                                <Image style={styles.labelIcon} source={require("../icons/pin.png")}/>
                            </View>
                            <Text style={[styles.rowText, stylesGlobal.font]} numberOfLines={3}>{item.venue_address}</Text>
                        </View>
                    </View>
                </TouchableOpacity>
                
        )
    }

    goback = () => {
        this.props.navigation.goBack();
    }

    refreshEventData() {

    }

    select_event(index) {
        var event_list = this.state.event_list;
        for(i = 0; i < event_list.length; i ++) {
            if(i == index) {
                event_list[i].selected = true;
                this.setState({
                    selected_event: event_list[i]
                })
            } else {
                event_list[i].selected = false;
            }
        }
        this.setState({
            event_list: event_list
        })
    }

}

const styles = StyleSheet.create({
    emptyView: {
        backgroundColor: Colors.black,
        flex: 1,
        alignItems: "center",
        justifyContent: 'center'
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
        shadowOpacity: 7.0
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

