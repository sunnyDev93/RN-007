import React, { Component } from "react";
import {
    Alert,
    StyleSheet,
    SafeAreaView,
    View,
    ScrollView,
    Text,
    Dimensions,
    FlatList
} from "react-native";

import { Colors } from "../consts/Colors";
import RowConnection from "./RowConnection";
import { Constants } from "../consts/Constants";
import { stylesGlobal, STICKY_HEADER_HEIGHT } from '../consts/StyleSheet';
import Memory from "../core/Memory";
import * as Global from "../consts/Global";
import WebService from "../core/WebService";
import ProgressIndicator from "./ProgressIndicator";
import Moment from "moment/moment";
import AsyncStorage from '@react-native-community/async-storage';
import InviteUserToEventView from "../customview/InviteUserToEventView";
import {getEventsForInvite, callInviteUserToEvent, callFavoriteMember, callFollowRequest} from "../utils/Util";

var {height, width} = Dimensions.get('window');

var TAG = "MyListRoseReceived";
var isFirsTime = true;

export default class MyListRoseReceived extends React.Component {

    constructor(props) {
        isFirsTime = true;
        super(props)

        this.state = {
            userId: "",
            userToken: "",
            userSlug: "",
            userImagePath: "",
            userImageName: "",
            showModel: false,
            member_plan: '',
            is_verified: '0',
            loading: false,
            searchText: '',

            member_list: [],
            total_length: 0,
            page_number: 0,

            selected_member: null, // use for unfavorite

            invite_event_list: [],
            invite_event_view: false,
            invited_user: null,
            is_portrait: true,
        }

        this.onEndReachedCalledDuringMomentum = true;

    }

    UNSAFE_componentWillMount() {
        this.getData();
        if(Dimensions.get("window").width < Dimensions.get("window").height) {
            this.setState({
                is_portrait: true,
            })
        } else {
            this.setState({
                is_portrait: false,
            })
        }

        Dimensions.addEventListener("change", () => {
            if(Dimensions.get("window").width < Dimensions.get("window").height) {
                this.setState({
                    is_portrait: true,
                })
            } else {
                this.setState({
                    is_portrait: false,
                })
            }
        })
    }

    componentWillUnmount() {
        Dimensions.removeEventListener('change');
    }

    /**
       * get async storage data
       */
    getData = async () => {
        try {

            var userId = await AsyncStorage.getItem(Constants.KEY_USER_ID);
            var userToken = await AsyncStorage.getItem(Constants.KEY_USER_TOKEN);
            var userSlug = await AsyncStorage.getItem(Constants.KEY_USER_SLUG);
            var userFirstName = await AsyncStorage.getItem(Constants.KEY_USER_FIRST_NAME);
            var userLastName = await AsyncStorage.getItem(Constants.KEY_USER_LAST_NAME);
            var userImagePath = await AsyncStorage.getItem(Constants.KEY_USER_IMAGE_URL);
            var userImageName = await AsyncStorage.getItem(Constants.KEY_USER_IMAGE_NAME);
            var member_plan = await AsyncStorage.getItem(Constants.KEY_MEMBER_PLAN);
            var is_verified = await AsyncStorage.getItem(Constants.KEY_IS_VERIFIED);

           
            this.setState({
                userId: userId,
                userToken: userToken,
                userSlug: userSlug,
                userImagePath: userImagePath,
                userImageName: userImageName,
                showModel: false,
                member_plan: member_plan,
                is_verified: is_verified,

            }, () => this.getReceivedRoseList());
        } catch (error) {
            // Error retrieving data
        }

    };

    getReceivedRoseList() {
        try {

            this.setState({
                loading: true
            });

            let uri = Memory().env == "LIVE" ? Global.URL_GET_ROSE_RECEIVED + this.state.page_number : Global.URL_GET_ROSE_RECEIVED_DEV + this.state.page_number;
            let params = new FormData();
            params.append("token", this.state.userToken);
            params.append("user_id", this.state.userId);
            params.append("format", "json");
                                    
            console.log(TAG + " callgetReceivedRoseListAPI uri " + uri);
            console.log(TAG + " callgetReceivedRoseListAPI params " + JSON.stringify(params));

            WebService.callServicePost(uri, params, this.handlegetReceivedRoseListAPI);
        } catch (error) {
            console.log(TAG + " callgetReceivedRoseListAPI error " + error);
            this.setState({
                loading: false,
            });
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    }

    handlegetReceivedRoseListAPI = (response, isError) => {
        console.log(TAG + " callgetReceivedRoseListAPI Response " + JSON.stringify(response));
        console.log(TAG + " callgetReceivedRoseListAPI isError " + isError);

        if (!isError) {
            var result = response;
            if (result != undefined && result != null) {
                if(result.status == "success") {
                    if(result.data != null) {
                        if(result.data.roses != null) {
                            for(i = 0; i < result.data.roses.length; i ++) {
                                result.data.roses[i].is_get_received_rose = true;
                            }
                            this.setState({
                                member_list: [...this.state.member_list, ...result.data.roses]
                            })                    
                            if(result.data.roses.length < 12) {
                                this.setState({
                                    more_load: false
                                })
                            } else {
                                this.setState({
                                    page_number: this.state.page_number + 1
                                })
                            }
                        }
                        if(result.data.total_count != null) {
                            this.setState({
                                total_length: result.data.total_count
                            })
                        }
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
    }

    isCloseToBottom = ({layoutMeasurement, contentOffset, contentSize}) => {
        const paddingToBottom = 10;
        return layoutMeasurement.height + contentOffset.y >=
          contentSize.height - paddingToBottom;
    };

    isCloseToTop = ({layoutMeasurement, contentOffset, contentSize}) => {
        const paddingToBottom = 10;
        console.log(contentOffset.y)
        return contentOffset.y <= -10
    };

    render() {
        return (
            <SafeAreaView style={styles.container}>
            {
                this.state.loading && <ProgressIndicator/>
            }
            {
                !this.state.loading && this.state.member_list.length == 0 &&
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <View style = {[styles.cardView, {height: '90%', justifyContent: 'center', alignItems: 'center'}]}>
                        <Text style={[styles.empty_text, stylesGlobal.font, ]}>{"No Received Roses"}</Text>
                    </View>
                </View>
            }
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
                            invite_event_view: false,
                            selected_member: null
                        })
                    }}
                />
            }
            {
                this.state.member_list.length > 0 &&
                <View style={{ flex: 1, marginTop: 10 }}>
                    <FlatList
                        ListHeaderComponent = {this.state.pulldown_loading && <PullDownIndicator/>}
                        ListFooterComponent={this.state.displayLoadMoreView == true ? footerView : null}
                        extraData={this.state}
                        showsHorizontalScrollIndicator={false}
                        showsVerticalScrollIndicator={false}
                        data={this.state.member_list}
                        keyExtractor={(item, index) => index.toString()}
                        style = {{width: '100%'}}
                        numColumns = {this.state.is_portrait ? 1 : 2}
                        key = {this.state.is_portrait ? 1 : 2}
                        renderItem={({ item, index }) => (
                            <View key = {index} style = {{width: this.state.is_portrait ? '100%' : '50%', alignItems: 'center'}}>
                                <RowConnection
                                    data={item}
                                    screenProps={this.props.screenProps}
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
                                    //         var member_list = this.state.member_list;
                                    //         for(i = 0; i < member_list.length; i ++) {
                                    //             if(member_list[i].id == this.state.selected_member.id) {
                                    //                 if(member_list[i].following_id) {
                                    //                     member_list[i].following_id = null;
                                    //                 } else {
                                    //                     member_list[i].following_id = "1";
                                    //                 }
                                    //                 break;
                                    //             }
                                    //         }
                                    //         this.setState({
                                    //             member_list: member_list,
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
                                    //         var member_list = this.state.member_list;
                                    //         for(i = 0; i < member_list.length; i ++) {
                                    //             if(member_list[i].user_id == this.state.selected_member.user_id) {
                                    //                 if(member_list[i].favorite_id) {
                                    //                     member_list[i].favorite_id = null;
                                    //                 } else {
                                    //                     member_list[i].favorite_id = 1;
                                    //                 }
                                    //                 this.setState({
                                    //                     member_list: member_list,
                                    //                     selected_member: null
                                    //                 })
                                    //                 break;
                                    //             }
                                    //         }
                                    //     }
                                    // }}
                                    myUserId={this.state.userId}
                                    parentscreen = {"MyRoseScreen"}
                                    receivedRose = {true}
                                    is_verified = {this.state.is_verified}
                                />
                            </View>
                        )}
                        onMomentumScrollBegin={() => { this.onEndReachedCalledDuringMomentum = false; }}
                        onEndReachedThreshold={0.5}
                        onEndReached={({ distanceFromEnd }) => {
                            if (!this.onEndReachedCalledDuringMomentum ) {
                                this.onEndReachedCalledDuringMomentum = true;
                                if(this.state.more_load) {
                                    this.getReceivedRoseList();
                                }
                            }
                        }}
                        onScroll = {async({nativeEvent}) => {
                            if(this.isCloseToTop(nativeEvent)) {
                                this.setState({
                                    member_list: [],
                                    page_number: 0,
                                    total_length: 0,
                                    more_load: true
                                }, () => this.getReceivedRoseList())
                            }
                        }}
                    />
                </View>
            }
            </SafeAreaView>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: "100%",
        height: "100%",
        backgroundColor: Colors.black
    },
    cardView: {
        width: width * 0.8,
        backgroundColor: Colors.white,
        margin: 12, //cardMargin,
        borderRadius: 10,
        paddingTop:5,
        paddingBottom:20,
        paddingHorizontal:10,
        shadowColor: Colors.white,
        shadowOffset: {
            width: 0,
            height: 0
        },
        shadowRadius: 7,
        shadowOpacity: 7.0
    },
    empty_text: {
        color: Colors.black,
        fontSize: 14,
        textAlign: "center"
    },
});
