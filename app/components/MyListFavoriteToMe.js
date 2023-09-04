import React, { Component } from "react";
import {
    Alert,
    StyleSheet,
    SafeAreaView,
    View,
    Text,
    ScrollView,
    Dimensions,
    FlatList
} from "react-native";

import RowConnection from "./RowConnection";
import { Colors } from "../consts/Colors";
import { Constants } from "../consts/Constants";
import { stylesGlobal, STICKY_HEADER_HEIGHT } from '../consts/StyleSheet'
import Memory from '../core/Memory';
import * as Global from "../consts/Global";
import WebService from "../core/WebService";
import ProgressIndicator from "./ProgressIndicator";
import Moment from "moment/moment";
import AsyncStorage from '@react-native-community/async-storage';
import InviteUserToEventView from "../customview/InviteUserToEventView";
import {getEventsForInvite, callInviteUserToEvent, callFavoriteMember, callFollowRequest} from "../utils/Util";


var TAG = "MyListFavoriteToMe";
var isFirsTime = true;

export default class MyListFavoriteToMe extends React.Component {

    constructor(props) {
        isFirsTime = true;
        super(props)

        this.state = {
            userId: "",
            userToken: "",
            userSlug: "",
            userImagePath: "",
            userImageName: "",
            member_plan: "",
            is_verified: "",

            favorite_list: [],
            page_number: 0,
            more_load: true,

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

                initial_tab: 1,
            }, () => this.getFavoriteToMeList());
        } catch (error) {
            // Error retrieving data
        }
    };

    getFavoriteToMeList() {
        try {

            this.setState({
                loading: true
            });

            let uri = Memory().env == "LIVE" ? Global.URL_GET_FAVORITE_LIST : Global.URL_GET_FAVORITE_LIST_DEV;
            let params = new FormData();
            params.append("token", this.state.userToken);
            params.append("user_id", this.state.userId);
            params.append("format", "json");
            params.append("type", 0);
            params.append("page", this.state.page_number);
                        
            console.log(TAG + " callGetFavoriteToMeAPI uri " + uri);
            console.log(TAG + " callGetFavoriteToMeAPI params " + JSON.stringify(params));

            WebService.callServicePost(uri, params, this.handleGetFavoriteToMe);
        } catch (error) {
            console.log(TAG + " callGetFavoriteToMeAPI error " + error);
            this.setState({
                loading: false
            });
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    }

    handleGetFavoriteToMe = (response, isError) => {
        console.log(TAG + " callGetFavoriteToMeAPI Response " + JSON.stringify(response));
        console.log(TAG + " callGetFavoriteToMeAPI isError " + isError);

        if (!isError) {
            var result = response;
            if (result != undefined && result != null) {
                if(result.status == "success") {
                    if(result.data != null && result.data.favorite != null) {
                        this.setState({
                            favorite_list: [...this.state.favorite_list, ...result.data.favorite]
                        })                    
                        if(result.data.favorite.length > 0) {
                            this.setState({
                                page_number: this.state.page_number + 1
                            })
                        } else {
                            this.setState({
                                more_load: false
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
            loading: false
        });
    }

    refreshList() {

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


    render() {
        return (
            <SafeAreaView style={styles.container}>
            {
                this.state.loading && <ProgressIndicator/>
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
                !this.state.loading && this.state.favorite_list.length == 0 &&
                <View style = {{width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center'}}>
                    <View style = {[stylesGlobal.empty_cardView, {height: '90%', justifyContent: 'center', alignItems: 'center'}]}>
                        <Text style={[stylesGlobal.card_empty_text, stylesGlobal.font, ]}>No Favorites yet</Text>
                    </View>
                </View>
            }
            {
                this.state.favorite_list.length > 0 &&
                <FlatList
                    ListHeaderComponent = {this.state.pulldown_loading && <PullDownIndicator/>}
                    ListFooterComponent={this.state.displayLoadMoreView == true ? footerView : null}
                    extraData={this.state}
                    // pagingEnabled={false}
                    showsHorizontalScrollIndicator={false}
                    showsVerticalScrollIndicator={false}
                    data={this.state.favorite_list}
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
                                        var favorite_list = this.state.favorite_list;
                                        for(i = 0; i < favorite_list.length; i ++) {
                                            if(favorite_list[i].id == this.state.selected_member.id) {
                                                if(favorite_list[i].following_id) {
                                                    favorite_list[i].following_id = null;
                                                } else {
                                                    favorite_list[i].following_id = "1";
                                                }
                                                break;
                                            }
                                        }
                                        this.setState({
                                            favorite_list: favorite_list,
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
                                        var favorite_list = this.state.favorite_list;
                                        for(i = 0; i < favorite_list.length; i ++) {
                                            if(favorite_list[i].user_id == this.state.selected_member.user_id) {
                                                if(favorite_list[i].st != null) {
                                                    if(favorite_list[i].st == 0) {
                                                        favorite_list[i].st = 1;
                                                    } else {
                                                        favorite_list[i].st = 0;
                                                    }
                                                } else {
                                                    if(favorite_list[i].favorite_id) {
                                                        favorite_list[i].favorite_id = null;
                                                    } else {
                                                        favorite_list[i].favorite_id = 1;
                                                    }
                                                }
                                                this.setState({
                                                    favorite_list: favorite_list,
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
                        </View>
                    )}
                    onMomentumScrollBegin={() => { this.onEndReachedCalledDuringMomentum = false; }}
                    onEndReachedThreshold={0.5}
                    onEndReached={({ distanceFromEnd }) => {
                        if (!this.onEndReachedCalledDuringMomentum ) {
                            if(this.state.more_load && !this.state.loading) {
                                this.onEndReachedCalledDuringMomentum = true;
                                this.setState({
                                    loading: true
                                }, () => this.getFavoriteToMeList())
                            }
                        }
                    }}
                    onScroll = {async({nativeEvent}) => {
                        if(this.isCloseToTop(nativeEvent)) {
                            this.setState({
                                favorite_list: [],
                                page_number: 0,
                                more_load: true,
                                loading: true
                            }, () => this.getFavoriteToMeList())
                        }
                    }}
                />
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

});
