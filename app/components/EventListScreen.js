import React, { Component } from "react";
import {
    StyleSheet,
    View,
    Text,
    Image,
    TouchableOpacity,
    Dimensions,
    ScrollView,
    Alert,
    Platform,
    FlatList,
    ActivityIndicator,
    TouchableWithoutFeedback,
    Modal,
    Animated,
} from "react-native";
import Moment from "moment/moment";
import AsyncStorage from '@react-native-community/async-storage';
import { ImageCompressor } from './ImageCompressorClass'
import WebService from "../core/WebService";
import { Constants } from "../consts/Constants";
import { Colors } from "../consts/Colors";
import { EventRegister } from 'react-native-event-listeners'
import * as Global from "../consts/Global";
import ProgressIndicator from "./ProgressIndicator";
import { stylesGlobal } from '../consts/StyleSheet';
import Memory from '../core/Memory';
import Emojis from '../customview/Emojis';
import { convertEmojimessagetoString, convertStringtoEmojimessage } from "../utils/Util";
import Carousel from "../../modified/react-native-snap-carousel/Carousel";
import stylesSliderEntry, {
    sliderWidth,
    itemWidth
} from "../styles/SliderEntry.style";
import stylesSlider, { colors } from "../styles/index.style";
import { isIphoneX, getBottomSpace, getStatusBarHeight } from '../custom_components/react-native-iphone-x-helper';
import InvisibleBlurView from "../customview/InvisibleBlurView";
import InvisiblePopupView from "../customview/InvisiblePopupView";

var SLIDER_1_FIRST_ITEM = 0;
const cardMargin = 12;
var TAG = "EventListScreen";

export default class EventListScreen extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            userId: "",
            userToken: "",
            loading: false,
            slider1Ref: null,
            sliderActiveIndex: SLIDER_1_FIRST_ITEM,
            singlePickerVisible: false,
            singlePickerSelectedItem: undefined,
            dataEventList: [],
            isLoadMoreEvents: true,
            displayLoadMoreLoader: false,

            selected_eventId: 0,
            member_plan: '',
            is_verified: "0",
            selected_event_toDate: '',

            is_portrait: true,
            screen_width: Dimensions.get("window").width,
            page_number: 0,
            isShownModalToRreadMore: true,
        };

    }

    checkAndRunAnimation = async () => {
        let showToolTipScreen = await AsyncStorage.getItem("show_tool_tip_screen");

        if(showToolTipScreen === "no")
        {
            this.setState({ isShownModalToRreadMore: false });
            return;
        }
        


        console.log(
            'width ==== ', Dimensions.get("window").width * 0.6 / 2 - 30
            )
       this.fadeAnim = new Animated.Value(60);

       Animated.loop(
           Animated.timing(this.fadeAnim, {
          toValue: -30,
          duration: 4000,
          useNativeDriver: true,
        })
        ).start();
    }

    componentDidMount() {

        

       this.checkAndRunAnimation();
    }

    UNSAFE_componentWillMount() {
        // this.clearStateData();
        // this.getData(false, this.props.type);
        if (Dimensions.get("window").width < Dimensions.get("window").height) {
            this.setState({
                is_portrait: true,
                screen_width: Dimensions.get("window").width
            })
        } else {
            this.setState({
                is_portrait: false,
                screen_width: Dimensions.get("window").height
            })
        }

        Dimensions.addEventListener("change", () => {
            if (Dimensions.get("window").width < Dimensions.get("window").height) {
                this.setState({
                    is_portrait: true,
                    screen_width: Dimensions.get("window").width
                })
            } else {
                this.setState({
                    is_portrait: false,
                    screen_width: Dimensions.get("window").height
                })
            }
        });

        if (this.props.onRef) {
            this.props.onRef(this);
        }
        this.refreshWholePage = EventRegister.addEventListener("eventlistscreen_refresh_whole_page", () => {
            this.getData(true, 2);
        });

    }

    componentWillUnmount() {
        EventRegister.removeEventListener(this.refreshWholePage);
    }


    /**
    * display event data again
    **/
    renderDataAgain = (i) => {
        // this.clearStateData();
        console.log(TAG, 'renderDataAgain')
        this.getData(false, this.props.type);
    }

    getHostedEvents = () => {
        console.log(TAG, 'getHostedEvents');
        this.getData(true, 2);
    }

    /**
   * clear state data
   **/
    clearStateData = () => {
        if (this.props.type == 1) {
            this.setState({
                page_number: 1
            });
        } else {
            this.setState({
                page_number: 0
            });
        }
        this.setState({
            userId: "",
            userToken: "",
            loading: false,
            slider1Ref: null,
            singlePickerVisible: false,
            singlePickerSelectedItem: undefined,
            dataEventList: [],
            isLoadMoreEvents: true,
            displayLoadMoreLoader: false,
        });
    }

    /**
     * get user stored information
     */
    getData = async (isRefresh, i) => {
        try {
            if (isRefresh) {
                if (this.props.type == 1) {
                    this.setState({
                        page_number: 1
                    });
                } else {
                    this.setState({
                        page_number: 0
                    });
                }
            }
            var userId = await AsyncStorage.getItem(Constants.KEY_USER_ID);
            var userToken = await AsyncStorage.getItem(Constants.KEY_USER_TOKEN);
            var member_plan = await AsyncStorage.getItem(Constants.KEY_MEMBER_PLAN);
            var is_verified = await AsyncStorage.getItem(Constants.KEY_IS_VERIFIED);
            this.setState({
                userId: userId,
                userToken: userToken,
                member_plan: member_plan,
                is_verified: is_verified
            });

            this.callEventListAPI(true, i);


        } catch (error) {
            // Error retrieving data
        }
    };

    /**
    * call event list API
    **/
    callEventListAPI = async (isFirstTime, i) => {
        try {

            // console.log("calling now callEventListAPI----------");
            // return;
            // console.log( " ----- EventListScreen.js callEventListAPI : ", isFirstTime, i, this.state.page_number);
            // if (isFirstTime) {
            //     this.setState({
            //         loading: true,
            //         displayLoadMoreLoader: false
            //     });
            // } else {
            //     this.setState({
            //         displayLoadMoreLoader: true,
            //     });
            // }
            this.setState({ loading: true });
            var addData = false;
            var uri = "";


             console.log(TAG, 'event category travel url = ', this.props.EventCategory)
            if (this.props.EventCategory.toUpperCase() === "travel".toUpperCase()) {
                switch (this.props.type) {
                    // case 1:
                    //     addData = true;
                    //     uri = Memory().env == "LIVE" ? Global.URL_EVENT_LIST + this.state.page_number : Global.URL_EVENT_LIST_DEV + this.state.page_number
                    //     break;
                    case 2:
                        uri = Memory().env == "LIVE" ? Global.URL_OPEN_TRAVEL + this.state.page_number : Global.URL_OPEN_TRAVEL_DEV + this.state.page_number
                        break;
                    case 3:
                        uri = Memory().env == "LIVE" ? Global.URL_JOIN_TRAVEL + this.state.page_number : Global.URL_JOIN_TRAVEL_DEV + this.state.page_number
                        break;
                    case 4:
                        uri = Memory().env == "LIVE" ? Global.URL_MY_TRAVEL + this.state.page_number : Global.URL_MY_TRAVEL_DEV + this.state.page_number
                        break;
                    // case 5:
                    //     uri = Memory().env == "LIVE" ? Global.URL_PAST_EVENTS + this.state.page_number : Global.URL_PAST_EVENTS_DEV + this.state.page_number
                    //     break;
                }

                console.log(TAG, 'event category travel url = ', uri)
            }
            if (this.props.EventCategory.toUpperCase() === "party".toUpperCase()) {
                switch (this.props.type) {
                    // case 1:
                    //     addData = true;
                    //     uri = Memory().env == "LIVE" ? Global.URL_EVENT_LIST + this.state.page_number : Global.URL_EVENT_LIST_DEV + this.state.page_number
                    //     break;
                    case 2:
                        uri = Memory().env == "LIVE" ? Global.URL_OPEN_INVITATION + this.state.page_number : Global.URL_OPEN_INVITATION_DEV + this.state.page_number
                        break;
                    case 3:
                        uri = Memory().env == "LIVE" ? Global.URL_JOIN_EVENTS + this.state.page_number : Global.URL_JOIN_EVENTS_DEV + this.state.page_number
                        break;
                    case 4:
                        uri = Memory().env == "LIVE" ? Global.URL_MY_EVENTS + this.state.page_number : Global.URL_MY_EVENTS_DEV + this.state.page_number
                        break;
                    // case 5:
                    //     uri = Memory().env == "LIVE" ? Global.URL_PAST_EVENTS + this.state.page_number : Global.URL_PAST_EVENTS_DEV + this.state.page_number
                    //     break;
                }
            }
            var jsonData = {
                recordPerPage: "5",
                keyword: "",
                page: this.state.page_number
            }

            let params = new FormData();
            params.append("token", this.state.userToken);
            params.append("user_id", this.state.userId);
            params.append("format", "json");
            if (addData) {
                params.append("data", JSON.stringify(jsonData));
            } else {
                params.append("data", "");
            }
            console.log(TAG + " callEventListAPI uri " + uri);
            console.log(TAG + " callEventListAPI params " + JSON.stringify(params));
            WebService.callServicePost(uri, params, this.handleGetEventListResponse);
        } catch (error) {
            console.log(error)
            this.setState({ loading: false, displayLoadMoreLoader: false });
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    };

    /**
    * handle event list API response
    **/
    handleGetEventListResponse = (response, isError) => {
        // console.log(TAG + " callEventListAPI response " + JSON.stringify(response));
        console.log(TAG + " callEventListAPI isError " + isError);
        if (!isError) {
            var result = response;
            if (typeof result != undefined && result != null) {
                if (typeof result.data != undefined && result.data != null) {
                    if (result.event_type.toUpperCase() == this.props.EventCategory.toUpperCase() && result.tab_index.toString() == this.props.type.toString()) {
                        if (result.data != undefined && result.data != null) {
                            this.setState({ dataEventList: result.data });
                            // if (this.state.displayLoadMoreLoader) {
                            //     this.setState({
                            //         dataEventList: [...this.state.dataEventList, result.data],
                            //     });
                            // } else {
                            //     if (result.data.length == 0) {
                            //         this.setState({ dataEventList: [] });
                            //     } else {
                            //         this.setState({ dataEventList: result.data });
                            //     }
                            // }
                            console.log(" ----- EventListScreen.js callEventListAPI : ", result.data.length, this.state.page_number);
                            if (result.data.length > 0) {
                                this.setState({
                                    isLoadMoreEvents: true,
                                    // page_number: this.state.page_number + 1
                                })
                            } else {
                                this.setState({
                                    isLoadMoreEvents: false,
                                })
                            }
                        }
                    }
                }
            }
        } else {
            if (response != undefined && response != null && response.length > 0) {
                Alert.alert(response.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
        this.setState({ loading: false, displayLoadMoreLoader: false });
    };

    /**
     * call get event detail API and display content
     */
    callEventDetailAPI = async (eventId) => {
        try {
            this.setState({
                loading: true,
                commentLoading: false,
                selected_eventId: eventId,
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
            this.setState({ loading: false, commentLoading: false });
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    };

    /**
    * handle event detai lAPI response
    */
    handleEventDetailResponse = (response, isError) => {
        // console.log(TAG + " callEventDetailAPI Response " + JSON.stringify(response));
        console.log(TAG + " callEventDetailAPI isError " + isError);
        if (!isError) {
            var result = response;
            if (result != undefined && result != null) {
                if (result.data != undefined && result.data != null) {
                    eventDetailData = result.data;
                    this.props.screenProps.navigate("GuestList", {
                        user_id: this.state.userId,
                        token: this.state.userToken,
                        eventId: this.state.selected_eventId,
                        inviteList: eventDetailData.invite,
                        loadAfterDeletingEvent: this.props.loadAfterDeletingOrEditingEvent,
                        ishosted: true,
                        eventDetailData: eventDetailData,
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
            commentLoading: false
        });
    };


    renderEmptyView = () => {
        return (
            <View style={{width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center'}}>
                <View style = {stylesGlobal.empty_cardView}>
                    <Text style={[stylesGlobal.empty_cardView_text, stylesGlobal.font, ]}>{this.props.EventCategory.toUpperCase() ===  'travel'.toUpperCase() ? 'No Trips' : 'No Events'}</Text>
                </View>
            </View>
        )
    }

    render() {
        return (
            <View style={styles.container}>
                {
                    this.state.loading == true ? 
                    null : (this.state.dataEventList.length > 0 ?  
                        this.renderMainView() : this.renderEmptyView())
                }
                {this.state.loading == true ? <ProgressIndicator /> : null}
            </View>
        );
    }

    renderMainView = () => {

        return (
            <View style={{ flex: 1, width: "100%", height: "100%", alignItems: 'center' }}>
                <InvisiblePopupView ref="invisible_popup_view" navigation={this.props.rootNavigation} openMyAccountScreen={this.props.openMyAccountScreen} />
                {
                    this.renderEventList
                }
            </View>
        );
    };

    scrollToFirst = () => {
        if (this._carousel) {
            this._carousel.snapToItem(0, true)
        }
    }

    /**
* display event list data
**/
    get renderEventList() {

        return (
            <View style={{ flex: 1 }}>
                <Carousel
                    ref={(c) => { this._carousel = c; }}
                    extraData={this.state}
                    data={this.state.dataEventList}
                    keyExtractor={(item, index) => index.toString()}
                    renderItem={this.renderSliderRow}
                    sliderWidth={Dimensions.get('screen').width}
                    itemWidth={this.state.screen_width * 0.8}
                    inactiveSlideScale={0.94}
                    inactiveSlideOpacity={0.6}
                    activeSlideAlignment={'start'}
                    enableMomentum={true}
                    // firstItem={this.state.sliderActiveIndex}
                    containerCustomStyle={stylesSlider.slider}
                    contentContainerCustomStyle={stylesSlider.sliderContentContainer}
                    onSnapToItem={index => this.setState({ sliderActiveIndex: index })}
                    onEndReachedThreshold={1}
                    onScroll={async (e) => {
                        if (e.nativeEvent.contentOffset.x < -50) {

                            // this.setState({isShownModalToRreadMore: true});
                            this.setState({
                                page_number: 0
                            }, () => this.callEventListAPI(true, this.props.type));
                        }
                    }}
                />
            </View>
        );
    };

    /**
* display event data row
**/
    renderSliderRow = ({ item, index }) => {

        if (item == null) {
            return (
                <View style={styles.emptyView}>
                    <View style={[stylesGlobal.empty_cardView, { width: '100%' }]}>
                        <Text style={[stylesGlobal.empty_cardView_text, stylesGlobal.font, { color: Colors.black, marginBottom: 10 }]}>Caught up with all invitations.</Text>
                        {
                            this.state.member_plan != "4" && this.state.member_plan != "7" && this.state.member_plan != "8" && this.state.is_verified == "1" &&
                            <TouchableOpacity style={[styles.submitButton, stylesGlobal.shadow_style]} underlayColor="#fff" onPress={() => this.props.goToCreateEventScreen()}>
                                <Text style={[styles.submitText, stylesGlobal.font]}>{this.props.EventCategory === 'party' ? 'Host a Party' : 'Host a Trip'}</Text>
                            </TouchableOpacity>
                        }
                    </View>
                </View>
            );
        }

        var eventId = item.id;
        var title = item.title;
        var venue_address = item.venue_address;
        var url = item.event_image_path + Constants.THUMB_FOLDER + item.event_image_name;
        // console.log("url",url)
        var fromDate = item.from_date;
        var toDate = item.to_date;
        var fromTime = item.from_time;
        var toTime = item.to_time;
        var is_joinable = false;
        var event_endDateTime = Moment(toDate).format('MM/DD/YYYY') + " " + toTime;
        if ((this.state.is_verified == "1") && (new Date(event_endDateTime) > new Date())) {
            is_joinable = true
        }
        var is_past = false;
        if (new Date(event_endDateTime) < new Date()) {
            is_past = true
        }
        var hostId = item.event_host_userid;
        type = this.props.type;
        let interestButton;
        let rsvpButton;
        var invitedUserId = item.invited_user_id;
        var iAmHost = false;

        if (hostId == this.state.userId) {
            iAmHost = true;
        }

        var isRSVP = false;
        if (item.is_invited != undefined && item.is_invited == 1) {
            isRSVP = true;
        }
        var desc_arr = [];
        var abbr_desc = "";
        if (item.description != null && item.description != "") {
            desc_arr = item.description.split(" ");
            if (desc_arr.length > 0) {
                var i = 0;
                var desc_temp = "";
                var ii = 0
                while (i < desc_arr.length) {
                    if (desc_arr[i] != "") {
                        desc_temp = desc_temp + desc_arr[i] + " ";
                        ii++;
                    }
                    i++;
                    if (ii == 2) {
                        break
                    }
                }
                abbr_desc = convertStringtoEmojimessage(desc_temp) + " ...";
            }
        }

        if (item.attendees_id != null) {
            // interestButton = (<TouchableOpacity
            //     style={[styles.submitButton, stylesGlobal.shadow_style]}
            //     underlayColor="#fff"
            //     onPress={() => {
            //         {
            //             this.props.screenProps.navigate("EventDetail", {
            //                 screenProps: this.props.screenProps,
            //                 eventId: eventId,
            //                 loadAfterDeletingEvent: this.props.loadAfterDeletingEvent,
            //                 refreshEventData: this.renderDataAgain,
            //                 EventCategory:this.props.EventCategory,
            //                 tab_type: this.props.type,
            //                 invite_code: item.invite_code
            //             });
            //         }
            //     }}
            // >
            //     <Text style={[styles.submitText, stylesGlobal.font]}>Cancel Request</Text>
            // </TouchableOpacity>);
            interestButton = (
                <View style={[{ paddingVertical: 5, paddingHorizontal: 10, backgroundColor: Colors.gold, borderRadius: 5, alignItems: 'center', justifyContent: 'center' }]}>
                    <Text style={[styles.submitText, { color: Colors.black }, stylesGlobal.font]}>{"Pending Approval"}</Text>
                </View>
            )
        } else {

            interestButton = (<TouchableOpacity
                style={[styles.submitButton, stylesGlobal.shadow_style]}
                underlayColor="#fff"
                onPress={() => {
                    {
                        // console.log(TAG, " EventListScreen this.props.type === ", this.props.type);
                        this.props.screenProps.navigate("EventDetail", {
                            screenProps: this.props.screenProps,
                            eventId: eventId,
                            loadAfterDeletingEvent: this.props.loadAfterDeletingEvent,
                            refreshEventData: this.renderDataAgain,
                            EventCategory: this.props.EventCategory,
                            tab_type: this.props.type,
                            invite_code: item.invite_code
                        });
                    }
                }}
            >
                <Text style={[styles.submitText, stylesGlobal.font]}>{"Ask to Join"}</Text>
            </TouchableOpacity>);

        }

        return (
            <View style={{ flex: 1, padding: cardMargin, }} >
                <Modal
                    animationType="fade"
                    transparent={true}
                    // closeOnClick={true}
                     backdropOpacity={0.3}
                    
                    // visible={this.state.isShownModalToRreadMore}
                     visible={false}
                    onRequestClose={() => this.setState({ isShownModalToRreadMore: false }, async () => await AsyncStorage.setItem("show_tool_tip_screen", "no"))}
                    supportedOrientations={['portrait', 'landscape']}
                >
                <TouchableWithoutFeedback onPress={() => this.setState({ isShownModalToRreadMore: false }, async () => await AsyncStorage.setItem("show_tool_tip_screen", "no"))}>
                    <View style={{
                            flex: 1,
                            justifyContent: 'center',
                            alignItems: 'center',
                            backgroundColor: 'rgba(0,0,0,0.8)',
                        }}>
                      <TouchableWithoutFeedback>
                        <View style={{
                            height:'60%',
                            padding: 35,
                            width: '90%',
                            justifyContent: 'center',
                            alignItems: 'center',
                            // backgroundColor: '#000',
                            shadowColor: '#000',
                            shadowOffset: {
                              width: 0,
                              height: 2,
                            },
                            shadowOpacity: 0.25,
                            shadowRadius: 3.84,
                            elevation: 5,
                            borderRadius: 5,
                            }}>
                            <View style={[{
                                width: '100%',
                                padding: 20,
                                backgroundColor: "transparent", 
                                flexDirection: 'row', 
                                justifyContent: 'flex-end'}]}>
                                <TouchableOpacity style={stylesGlobal.popup_cancel_button} onPress={() => this.setState({ isShownModalToRreadMore: false }, async () => await AsyncStorage.setItem("show_tool_tip_screen", "no"))}>
                                    <Image style={stylesGlobal.cancel_delete_image} source={require('../icons/connection-delete.png')} />
                                </TouchableOpacity>
                            </View>

                            <View style={{height: 30, width: '100%', paddingHorizontal: 10, alignItems: 'center' }}>
                                 {/* <View */}
                                 {/*    ref={ref => this.animiBarRef = ref} */}
                                 {/*  style={{borderStyle: 'solid', borderWidth: 2, borderRadius: 20, height: 10, width: '60%', borderColor: Colors.gold}}></View> */}
                                 <Animated.View
                                    style={{
                                        color: 'white',
                                        width: 30,
                                        height: 30,
                                       transform: [{
                                          translateX: this.fadeAnim,
                                        }],
                                        marginTop: -10,
                                    }}>
                                    <Image style={{width: 30, height: 30}} source={require("../icons/tap.png")}></Image>
                                </Animated.View>
                             </View>
                             <View style={{
                                width: '100%',
                                padding: 20,
                                alignItems: 'center'
                                }}>
                                <Text style={[stylesGlobal.font, {color: Colors.gold, fontSize: 20, }]}>Scroll left to see more</Text>
                             </View>

                             <View style={{
                                width: '100%',
                                padding: 20,
                                alignItems: 'center',
                                flexDirection: 'row',
                                justifyContent: 'flex-end'

                                }}>

                                

                                <TouchableOpacity style={stylesGlobal.popup_cancel_button} onPress={() => this.setState({ isShownModalToRreadMore: false }, async () => await AsyncStorage.setItem("show_tool_tip_screen", "no"))}>
                                    <Text style={[stylesGlobal.font, {color: Colors.gold, fontSize: 12}]}>Got it</Text>
                                </TouchableOpacity>
                                
                             </View>
                             
                        </View>
                      </TouchableWithoutFeedback>
                    </View>
                  </TouchableWithoutFeedback>

                    
                </Modal>
                <View style={[styles.cardView, { minHeight: '60%' }]}>
                    <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps='always' showsVerticalScrollIndicator={false}>
                        <TouchableOpacity style={{ width: '100%' }} activeOpacity={Global.activeOpacity}
                            onPress={() => {
                                // console.log(TAG, " EventListScreen this.props.type === ", this.props.type);
                                this.props.screenProps.navigate("EventDetail", {
                                    // screenProps: this.props.screenProps,
                                    eventId: eventId,
                                    loadAfterDeletingEvent: this.props.loadAfterDeletingEvent,
                                    refreshEventData: this.renderDataAgain,
                                    tab_type: this.props.type,
                                    // EventCategory:this.props.EventCategory,
                                    // invite_code: item.invite_code
                                });
                            }}
                        >
                            <View style={styles.fitImageView}>
                                <ImageCompressor uri={url} style={styles.fitImage} />
                                {
                                    item.imgpath != null && item.filename &&
                                    <TouchableOpacity style={{ position: 'absolute', width: 80, height: 80, borderRadius: 40, borderWidth: 1, borderColor: Colors.gold, bottom: 10, right: 10, overflow: 'hidden' }}
                                        onPress={() => {
                                            if (iAmHost) {
                                                this.props.screenProps.navigate("MyProfile", {
                                                    refreshProfileImage: this.refreshProfileImage
                                                });
                                            } else {
                                                this.props.screenProps.navigate("ProfileDetail", {
                                                    slug: item.slug
                                                })
                                            }
                                        }}
                                    >
                                        <Image style={{ width: '100%', height: '100%', resizeMode: 'cover' }} source={{ uri: item.imgpath + Constants.THUMB_FOLDER + item.filename, cache: 'force-cache' }} />
                                    </TouchableOpacity>
                                }
                            </View>
                            <Text style={[stylesGlobal.titleText, { marginTop: 10 }, stylesGlobal.font_bold]} numberOfLines={1}>
                                {convertStringtoEmojimessage(item.title)}
                            </Text>
                            <View style={{ width: '100%', flexDirection: 'row', alignItems: 'center', marginTop: 10,  }}>
                                <Text style={[styles.rowText, stylesGlobal.font]}>{abbr_desc}<Text style={[styles.rowText, { color: Colors.gold }, stylesGlobal.font]}>{"Read More"}</Text></Text>
                                
                            </View>
                            {/* {
                                iAmHost && !is_past
                                    ?
                                    <View style={[styles.rowView]}>
                                        <View style={[styles.labelIconView,]}>
                                            <Image style={styles.labelIcon} source={require("../icons/event_rsvp.png")}/>
                                        </View>
                                        <TouchableOpacity activeOpacity={.6} style={[styles.submitButton, stylesGlobal.shadow_style]} underlayColor="#fff"
                                            onPress={() => {
                                                this.setState({selected_event_toDate: toDate})
                                                this.callEventDetailAPI(eventId);
                                            }}
                                        >
                                            <Text style={[styles.submitText, stylesGlobal.font]}>{"Manage Guest List"}</Text>
                                        </TouchableOpacity>
                                    </View>
                                    :
                                    is_joinable && this.props.type == 2 ?
                                    <View style={[styles.rowView]}>
                                        <View style={[styles.labelIconView,]}>
                                            <Image style={styles.labelIcon} source={require("../icons/event_rsvp.png")}/>
                                        </View>
                                        {(this.props.type == 2 ) ? interestButton : null}
                                    </View>
                                    : null
                            }
                            <View style={[styles.rowView, {marginTop: 0}]}>
                                <View style={[styles.labelIconView, {marginTop: 15}]}>
                                    <Image style={styles.labelIcon} source={require("../icons/calendar.png")}/>
                                </View>
                            {
                                this.props.EventCategory.toUpperCase() != 'travel'.toUpperCase() &&
                                <View style = {{alignItems: 'center', flexDirection: 'row', marginTop: 15}}>
                                    <View style={[stylesGlobal.date_view, {marginEnd: 5}]}>
                                        <Text style={[styles.rowText, stylesGlobal.font]}>
                                            {Moment(fromDate).isValid() ? Moment(fromDate).format("DD MMM YYYY") : "No date"}
                                        </Text>
                                    </View>
                                    <Text style={[styles.rowText, stylesGlobal.font,]}>
                                        {Moment(fromDate).isValid() ? Moment(fromDate).format("ddd") : ""}
                                    </Text>
                                </View>
                            }
                            {
                                this.props.EventCategory.toUpperCase() === 'travel'.toUpperCase() &&
                                <View style = {{alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap'}}>
                                    <View style = {{flexDirection: 'row', alignItems: 'center', paddingTop: 15}}>
                                        <View style={[stylesGlobal.date_view, {marginEnd: 5}]}>
                                            <Text style={[styles.rowText, stylesGlobal.font]}>
                                                {Moment(fromDate).isValid() ? Moment(fromDate).format("DD MMM YYYY") : "No date"}
                                            </Text>
                                        </View>
                                        <Text style={[styles.rowText, stylesGlobal.font]}>
                                            {Moment(fromDate).isValid() ? Moment(fromDate).format("ddd") : ""}
                                        </Text>
                                    </View>
                                
                                    <Text style={[styles.rowText, stylesGlobal.font, {marginHorizontal: 5, paddingTop: 15}]}>-</Text>

                                    <View style = {{flexDirection: 'row', alignItems: 'center', paddingTop: 15}}>
                                        <View style={[stylesGlobal.date_view, {marginEnd: 5}]}>
                                            <Text style={[styles.rowText, stylesGlobal.font]}>
                                                {Moment(toDate).isValid() ? Moment(toDate).format("DD MMM YYYY") : "No date"}
                                            </Text>
                                        </View>
                                        <Text style={[styles.rowText, stylesGlobal.font,]}>
                                            {Moment(toDate).isValid() ? Moment(toDate).format("ddd") : ""}
                                        </Text>
                                    </View>
                                </View>
                            }
                            </View>

                        {
                            this.props.EventCategory==='party' && fromTime != null && 
                            <View style={styles.rowView}>
                                <View style={styles.labelIconView}>
                                    <Image style={styles.labelIcon} source={require("../icons/clock.png")}/>
                                </View>
                                <Text style={[styles.rowText, stylesGlobal.font]}>
                                    {fromTime} - {toTime}
                                </Text>
                            </View>
                        }
                        {
                            this.props.EventCategory != 'party' &&
                            <View style={styles.rowView}>
                                <View style={styles.labelIconView}>
                                    <Image style={styles.labelIcon} source={require("../icons/pin.png")}/>
                                </View>
                                <Text style={[styles.rowText, stylesGlobal.font]} numberOfLines={3}>{"Click on card to see location ..."}</Text>
                            </View>
                        }
                            <TouchableOpacity style={{flexDirection:'row', width:'100%', alignItems:'center'}}
                                onPress={() => {
                                    if (iAmHost) {
                                        this.props.screenProps.navigate("MyProfile", {
                                            refreshProfileImage: this.refreshProfileImage
                                        });
                                    } else {
                                        this.props.screenProps.navigate("ProfileDetail", {
                                            slug: item.slug
                                        })
                                    }
                                }}
                            >
                                <View style={{width:60, height:60, marginTop:10, borderRadius:50, justifyContent:'center', alignItems:'center', overflow:'hidden', borderWidth:.5}}>
                                {
                                    item.imgpath != null && item.filename &&
                                    <Image style={{width:60,height:60,resizeMode:'contain'}} source={{uri:item.imgpath + Constants.THUMB_FOLDER + item.filename,cache:'force-cache'}}/>
                                }
                                </View>
                                <View style={{flexDirection:'row',justifyContent:'center',alignItems:"center"}}>
                                    <Text style={[{marginLeft:10, fontSize:16, color:Colors.black}, stylesGlobal.font_bold]}>Host: </Text>
                                {
                                    item.first_name != null && item.last_name != null &&
                                    <Text style={[{marginLeft:10, fontSize:16, color:Colors.black}, stylesGlobal.font]}>{item.first_name} {item.last_name}</Text>
                                }
                                </View>
                            </TouchableOpacity> */}
                            <View style={{ width: '100%', alignItems: 'flex-end' }}>
                                <View style={{ width: '100%', flexDirection: 'row' }}>
                                    <View style={{ marginStart: 10 }}>
                                        <Image source={require('../icons/calendar.png')} style={{ marginTop: 10, width: 25, height: 25, resizeMode: 'contain' }} />
                                        {
                                            this.props.EventCategory === 'party' ? <Image source={require('../icons/clock.png')} style={{ marginTop: 10, width: 25, height: 25, resizeMode: 'contain' }} /> :
                                                <Image source={require('../icons/pin.png')} style={{ marginTop: 40, width: 25, height: 25, resizeMode: 'contain' }} />
                                        }
                                    </View>
                                    <View style={{ marginStart: 20 }}>
                                        <Text style={[styles.item_title_text, stylesGlobal.font_bold]}>{"Date:"}</Text>
                                        {
                                            this.props.EventCategory.toUpperCase() == 'travel'.toUpperCase() &&
                                            <Text style={[styles.item_title_text, stylesGlobal.font_bold]}>{" "}</Text>
                                        }
                                        {
                                            this.props.EventCategory === 'party' && fromTime != null && <Text style={[styles.item_title_text, stylesGlobal.font_bold, { marginTop: 16}]}>{"Time:"}</Text>
                                        }
                                        {
                                            this.props.EventCategory != 'party' &&
                                            <Text style={[styles.item_title_text, stylesGlobal.font_bold, { marginTop: 16}]} >{"Location:"}</Text>
                                        }
                                        <Text style={[styles.item_title_text, stylesGlobal.font_bold]}>{"Host:"}</Text>
                                    </View >
                                    <View style={{ flex: 1, marginStart: 10, }}>
                                        {
                                            this.props.EventCategory.toUpperCase() != 'travel'.toUpperCase() &&
                                            <View style={{ alignItems: 'center', flexDirection: 'row' }}>
                                                <Text style={[styles.item_title_text, stylesGlobal.font]}>
                                                    {Moment(fromDate).isValid() ? Moment(fromDate).utc().format("DD MMM YYYY") : "No date"}
                                                </Text>
                                                <Text style={[styles.item_title_text, stylesGlobal.font,]}>
                                                    {Moment(fromDate).isValid() ? " (" + Moment(fromDate).utc().format("ddd") + ")" : ""}
                                                </Text>
                                            </View>
                                        }
                                        {
                                            this.props.EventCategory.toUpperCase() == 'travel'.toUpperCase() &&
                                            <View>
                                                <View style={{ alignItems: 'center', flexDirection: 'row' }}>
                                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                        <Text style={[styles.item_title_text, stylesGlobal.font]}>
                                                            {Moment(fromDate).isValid() ? Moment(fromDate).format("DD MMM YYYY") : "No date"}
                                                        </Text>
                                                        <Text style={[styles.item_title_text, stylesGlobal.font]}>
                                                            {Moment(fromDate).isValid() ? " (" + Moment(fromDate).format("ddd") + ")" : ""}
                                                        </Text>
                                                    </View>

                                                    <Text style={[styles.item_title_text, stylesGlobal.font, { marginHorizontal: 5 }]}>-</Text>
                                                </View>
                                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                    <Text style={[styles.item_title_text, stylesGlobal.font]}>
                                                        {Moment(toDate).isValid() ? Moment(toDate).format("DD MMM YYYY") : "No date"}
                                                    </Text>
                                                    <Text style={[styles.item_title_text, stylesGlobal.font,]}>
                                                        {Moment(toDate).isValid() ? " (" + Moment(toDate).format("ddd") + ")" : ""}
                                                    </Text>
                                                </View>
                                            </View>
                                        }
                                        {
                                            this.props.EventCategory == 'party' && fromTime != null &&
                                            <Text style={[styles.item_title_text, stylesGlobal.font]}>
                                                {fromTime} - {toTime}
                                            </Text>
                                        }
                                        {
                                            this.props.EventCategory != 'party' &&
                                            <Text style={[styles.item_title_text, stylesGlobal.font, { flex: 1 }]} numberOfLines={1} ellipsizeMode={"tail"}>{venue_address != null && venue_address != "" ? venue_address : "No Address"}</Text>
                                        }
                                        {
                                            item.first_name != null && item.last_name != null &&
                                            <Text style={[styles.item_title_text, stylesGlobal.font]}>{item.first_name} {item.last_name}</Text>
                                        }
                                    </View>
                                </View>
                            </View>
                        </TouchableOpacity>
                    </ScrollView>
                    <View style={{ width: '100%', paddingVertical: 15 }}>
                        <View style={{ width: '100%', alignItems: 'center' }}>
                            <TouchableOpacity style={[{ width: '80%', paddingVertical: 10, backgroundColor: Colors.gold, borderRadius: 5, alignItems: 'center' }, stylesGlobal.shadow_style]}
                                onPress={() => {
                                    // console.log(TAG, " EventListScreen this.props.type === ", this.props.type);
                                    this.props.screenProps.navigate("EventDetail", {
                                        // screenProps: this.props.screenProps,
                                        eventId: eventId,
                                        loadAfterDeletingEvent: this.props.loadAfterDeletingEvent,
                                        refreshEventData: this.renderDataAgain,
                                        tab_type: this.props.type,
                                        // EventCategory:this.props.EventCategory,
                                        // invite_code: item.invite_code
                                    });
                                }}
                            >
                                <Text style={[{ fontSize: 16, color: Colors.white }, stylesGlobal.font]}>{"Event Details"}</Text>
                            </TouchableOpacity>
                        </View>
                        {
                            iAmHost && !is_past &&
                            <View style={{ width: '100%', alignItems: 'center', marginTop: 15 }}>
                                <TouchableOpacity style={[{ width: '80%', paddingVertical: 10, backgroundColor: Colors.gold, borderRadius: 5, alignItems: 'center' }, stylesGlobal.shadow_style]}
                                    onPress={() => {
                                        this.setState({ selected_event_toDate: toDate })
                                        this.callEventDetailAPI(eventId);
                                    }}
                                >
                                    <Text style={[{ fontSize: 16, color: Colors.white }, stylesGlobal.font]}>{"Manage Guest List"}</Text>
                                </TouchableOpacity>
                            </View>
                        }
                    </View>
                    {
                        item.is_hidden &&
                        <InvisibleBlurView>
                            <TouchableOpacity style={{ alignItems: 'center', justifyContent: 'center' }} onPress={() => this.refs.invisible_popup_view.displayPopup(item)}>
                                <Image style={stylesGlobal.hidden_lock_image} source={require("../icons/signin_password.png")}></Image>
                                <Text style={[{ fontSize: 14, color: Colors.gold, marginTop: 5 }, stylesGlobal.font]}>{"Invisible"}</Text>
                            </TouchableOpacity>
                        </InvisibleBlurView>
                    }
                </View>
            </View>
        );
    };

    /**
     * render SliderRow Image
     */
    image(url) {
        return <Image source={{ uri: url }} style={stylesSliderEntry.image} />;
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

}

const styles = StyleSheet.create({
    container: {
        backgroundColor: Colors.black,
        width: "100%",
        height: "100%"
    },
    emptyView: {
        flex: 1,
        width: "100%",
        height: '100%',
        justifyContent: "center",
        alignItems: "center",
    },
    submitButton: {
        padding: 10,
        backgroundColor: Colors.gold,
        borderRadius: 5,
        borderWidth: 1,
        borderColor: Colors.transparent,
        paddingLeft: 20,
        paddingRight: 20,
        margin: 5
    },
    submitText: {
        color: Colors.white,
        fontSize: 14,
        backgroundColor: Colors.transparent,
        textAlign: "center"
    },
    cardView: {
        width: '100%',
        height: '100%',
        backgroundColor: Colors.white,
        borderRadius: 10,
        padding: cardMargin,
        shadowColor: Colors.white,
        shadowOffset: {
            width: 0,
            height: 0
        },
        shadowRadius: 7,
        shadowOpacity: 7.0
    },
    fitImage: {
        width: '100%',
        height: '100%',
        borderRadius: 10,
        overflow: 'hidden',
    },
    fitImageView: {
        width: '100%',
        borderRadius: 10,
        overflow: 'visible',
        aspectRatio: 1
    },
    labelIconView: {
        marginRight: 10,
    },
    labelIcon: {
        width: 25,
        height: 25,
        resizeMode: 'contain',
    },
    rowView: {
        flexDirection: 'row',
        marginTop: 15,
        alignItems: 'center',
    },
    rowText: {
        color: Colors.black,
        fontSize: 14,
        backgroundColor: Colors.transparent
    },
    item_title_text: {
        // marginLeft:10, 
        marginTop: 16,
        fontSize: 14,
        color: Colors.black
    }
});
