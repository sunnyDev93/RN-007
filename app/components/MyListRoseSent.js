import React, { Component } from "react";
import {
    Alert,
    StyleSheet,
    SafeAreaView,
    View,
    ScrollView,
    Text,
    Dimensions,
    TouchableOpacity,
    Image,
    TextInput,
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
import { ImageCompressor } from '../components/ImageCompressorClass';
import { EventRegister } from 'react-native-event-listeners';


var TAG = "MyListRoseSent";

export default class MyListRoseSent extends React.Component {

    constructor(props) {
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
            loading: true,
            searchText: '',
            my_gold_coin: 0,

            member_list: [],
            total_length: 0,
            page_number: 0,

            selected_member: null, // use for unfavorite

            invite_event_list: [],
            invite_event_view: false,
            invited_user: null,

            send_rose_modal_show: false,
            send_rose_search_text: "",
            send_rose_page_number: 1,
            send_rose_search_list: [],
            send_rose_search_more_load: true,
            rose_loading: false,
            rose_recv_user: null,
            is_portrait: true,
            screen_height: Dimensions.get('screen').height,
        }
        this.onEndReachedCalledDuringMomentumEvent = true;
        this.onEndReachedCalledDuringMomentumUser = true;
    }

    UNSAFE_componentWillMount() {
        this.getData();

        if(Dimensions.get("window").width < Dimensions.get("window").height) {
            this.setState({
                is_portrait: true,
                screen_height: Dimensions.get('screen').height,
            })
        } else {
            this.setState({
                is_portrait: false,
                screen_height: Dimensions.get('screen').width,
            })
        }

        Dimensions.addEventListener("change", () => {
            if(Dimensions.get("window").width < Dimensions.get("window").height) {
                this.setState({
                    is_portrait: true,
                    screen_height: Dimensions.get('screen').height,
                })
            } else {
                this.setState({
                    is_portrait: false,
                    screen_height: Dimensions.get('screen').width,
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
            var my_gold_coins_str = await AsyncStorage.getItem(Constants.KEY_GOLD_COINS);

           
            this.setState({
                userId: userId,
                userToken: userToken,
                userSlug: userSlug,
                userImagePath: userImagePath,
                userImageName: userImageName,
                showModel: false,
                member_plan: member_plan,
                is_verified: is_verified,
                my_gold_coin: isNaN(parseInt(my_gold_coins_str, 10)) ? 0 : parseInt(my_gold_coins_str, 10),
            }, () => this.getSentRoseList());
        } catch (error) {
            // Error retrieving data
        }

    };

    getSentRoseList() {
        try {

            this.setState({
                loading: true
            });

            let uri = Memory().env == "LIVE" ? Global.URL_GET_ROSE_SENT + this.state.page_number : Global.URL_GET_ROSE_SENT_DEV + this.state.page_number;
            let params = new FormData();
            params.append("token", this.state.userToken);
            params.append("user_id", this.state.userId);
            params.append("format", "json");
                                    
            console.log(TAG + " callGetSentRoseListAPI uri " + uri);
            console.log(TAG + " callGetSentRoseListAPI params " + JSON.stringify(params));

            WebService.callServicePost(uri, params, this.handleGetSentRoseListAPI);
        } catch (error) {
            console.log(TAG + " callGetSentRoseListAPI error " + error);
            this.setState({
                loading: false,
            });
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    }

    handleGetSentRoseListAPI = (response, isError) => {
        console.log(TAG + " callGetSentRoseListAPI Response " + JSON.stringify(response));
        console.log(TAG + " callGetSentRoseListAPI isError " + isError);

        if (!isError) {
            var result = response;
            if (result != undefined && result != null) {
                if(result.status == "success") {
                    if(result.data != null) {
                        if(result.data.roses != null) {
                            for(i = 0; i < result.data.roses.length; i ++) {
                                result.data.roses[i].is_get_received_rose = false;
                            }
                            this.setState({
                                member_list: [...this.state.member_list, ...result.data.roses]
                            })                    
                            if(result.data.roses.length > 0) {
                                this.setState({
                                    page_number: this.state.page_number + 1
                                })
                            } else {
                                this.setState({
                                    more_load: false
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
        // console.log(contentOffset.y);
        return contentOffset.y <= -10
    };

    search_person = () => {
       
        try {
            this.setState({
                rose_loading: true,
            });

            let uri = Memory().env == "LIVE" ? Global.URL_MYLIST_MEMBER_SEARCH : Global.URL_MYLIST_MEMBER_SEARCH_DEV;
            let params = new FormData();
            params.append("token", this.state.userToken);
            params.append("user_id", this.state.userId);
            params.append("format", "json");
            var data = {
                keyword: this.state.send_rose_search_text,
                page: this.state.send_rose_page_number
                // recordPerPage: this.state.membersearchlist_perpage_count
            }
            params.append("data", JSON.stringify(data));
                                    
            console.log(TAG + " callSearchPersonAPI uri " + uri);
            console.log(TAG + " callSearchPersonAPI params " + JSON.stringify(params));

            WebService.callServicePost(uri, params, this.handleSearchPersonRresponse);
        } catch (error) {
            console.log(TAG + " callSearchPersonAPI error " + error);
            this.setState({
                rose_loading: false,
            });
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    }

    handleSearchPersonRresponse = (response, isError) => {
        console.log(TAG + " callSearchPersonAPI Response " + JSON.stringify(response));
        console.log(TAG + " callSearchPersonAPI isError " + isError);
        if (!isError) {
            if(response.status == "success") {
                if(response.data.result != null) {
                    if(response.data.result.length == 0) {
                        this.setState({
                            send_rose_search_more_load: false
                        })
                    } else {
                        for(i = 0; i < response.data.result.length; i ++) {
                            response.data.result[i].profile_image = response.data.result[i].imgpath + Constants.THUMB_FOLDER + response.data.result[i].filename;
                            response.data.result[i].selected = false;
                        }
                        if(this.state.send_rose_page_number == 1) {
                            this.setState({
                                send_rose_search_list: response.data.result,
                            })
                        } else {
                            this.setState({
                                send_rose_search_list: [...this.state.send_rose_search_list, ...response.data.result],
                            })
                        }
                        this.setState({
                            send_rose_search_more_load: true
                        })
                    }
                } else {
                    this.setState({
                        send_rose_search_more_load: false
                    })
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
            rose_loading: false
        });
    };

    searchChangeText = async(text) => {
        this.setState({
            send_rose_search_text: text,
            send_rose_page_number: 1,
            send_rose_search_list: [],
            send_rose_search_more_load: true
        }, () => this.search_person())
    }

    callSendRoseAPI = async () => {
        var rose_recv_user = null;
        for(i = 0; i < this.state.send_rose_search_list.length; i ++) {
            if(this.state.send_rose_search_list[i].selected) {
                rose_recv_user = this.state.send_rose_search_list[i];
                break;
            }
        }
        if(rose_recv_user == null) {
            Alert.alert("Please select a person to send a rose.", "");
            return;
        }
        if(this.state.my_gold_coin == 0) {
            Alert.alert("You do not have enough Gold for this transaction. Please purchase more Gold Coins.", "",
            [
                {text: 'Buy Gold', onPress: () => {
                    this.props.screenProps.navigate('MyAccountScreen', {initial_tab: "buy_goldcoin"});
                }},
                {text: 'Cancel', onPress: () => null},
            ],
                {cancelable: false}
            )
            return;
        }
        this.setState({
            rose_recv_user: rose_recv_user
        })
        try {
            this.setState({
                rose_loading: true
            });
            let uri = Memory().env == "LIVE" ? Global.URL_ROSE_SEND : Global.URL_ROSE_SEND_DEV
            
            let params = new FormData();
            params.append("token", this.state.userToken);
            params.append("user_id", this.state.userId);
            params.append("format", "json");
            params.append("user", rose_recv_user.user_id);
            params.append("show_alert", "false");

            console.log(TAG + " callSendRoseAPI uri " + uri);
            console.log(TAG + " callSendRoseAPI params " + JSON.stringify(params));

            WebService.callServicePost(
                uri,
                params,
                this.handleSendRoseResponse
            );
        } catch (error) {
            this.setState({
                rose_loading: false
            });
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    };

    /** Handle send rose Data
     *
     * @param response
     * @param isError
     */

    handleSendRoseResponse = (response, isError) => {
        console.log(TAG + " callSendRoseAPI Response " + JSON.stringify(response));
        console.log(TAG + " callSendRoseAPI isError " + isError);


        if (!isError) {
            try {
                var result = response;
                if (typeof result != "undefined" && result != undefined && result != null) {
                    if(result.status.toUpperCase() == "Success".toUpperCase()) {
                        
                        this.setState({
                            my_gold_coin: this.state.my_gold_coin - 1
                        })
                        try {
                            AsyncStorage.setItem(Constants.KEY_GOLD_COINS, (this.state.my_gold_coin - 1).toString());
                        } catch(error) {
                            console.log(error)
                        }
                        EventRegister.emit(Constants.EVENT_PROFILE_GOLDCOIN_UPDATED, '');
                        Alert.alert("Rose Sent", "You have sent a Rose to " + this.state.rose_recv_user.first_name + " " + this.state.rose_recv_user.last_name + ".");
                        this.setState({
                            send_rose_modal_show: false, 
                            send_rose_search_text: "",
                            send_rose_page_number: 1,
                            send_rose_search_list: [],
                            send_rose_search_more_load: true,
                            rose_recv_user: null
                        })
                        this.setState({
                            member_list: [],
                            page_number: 0,
                            total_length: 0,
                            more_load: true
                        }, () => this.getSentRoseList())
                    } else {
                        if(response.msg)
                        {
                            Alert.alert(response.msg, "");
                        }else{
                            Alert.alert(Constants.UNKNOWN_MSG, "");
                            //UNKNOWN_MSG
                        }
                    }
                }
            } catch (error) {
                if (error != undefined && error != null && error.length > 0) {
                    Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
                }
            }
        } else {
            if (response != undefined && response != null && response.length > 0) {
                Alert.alert(response.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }

        this.setState({
            rose_loading: false
        });
    };

    render() {
        return (
            <SafeAreaView style={styles.container}>
            {
                (this.state.loading || this.state.rose_loading) && <ProgressIndicator/>
            }
            {
                !this.state.loading && this.state.member_list.length == 0 &&
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <View style = {[stylesGlobal.empty_cardView, {height: '90%', justifyContent: 'center', alignItems: 'center'}]}>
                        <Text style={[stylesGlobal.card_empty_text, stylesGlobal.font, ]}>{"No Sent Roses"}</Text>
                        <TouchableOpacity style = {[stylesGlobal.common_button, stylesGlobal.shadow_style, {marginTop: 10}]} onPress = {() => {
                            this.setState({send_rose_modal_show: true});
                            this.search_person();
                        }}>
                            <Text style = {[{fontSize: 14, color: Colors.white}, stylesGlobal.font]}>{"Send a Rose"}</Text>
                        </TouchableOpacity>
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
                this.state.send_rose_modal_show &&
                <View style = {{width: '100%', height: '100%', position: 'absolute', zIndex: 10, elevation: 10, alignItems: 'center'}}>
                    <View style = {{width: '100%', height: '100%', position: 'absolute', backgroundColor: Colors.black, opacity: 0.3}}/>
                    <View style = {{width: '90%', height: this.state.is_portrait ? this.state.screen_height / 1.5 : this.state.screen_height / 3.5, backgroundColor: Colors.white, borderRadius: 5, padding: 20,}}>
                        <View style = {{width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}}>
                            <Text style = {[{fontSize: 18, color: Colors.black}, stylesGlobal.font]}>{"Send a Rose to"}</Text>
                            <View style = {{flexDirection: 'row', alignItems: 'center'}}>
                            {
                                !this.state.is_portrait &&
                                <TouchableOpacity style = {[{paddingVertical: 10, paddingHorizontal: 20, minWidth: 60, backgroundColor: Colors.gold, borderRadius: 5, justifyContent: 'center', alignItems: 'center', marginEnd: 10}, stylesGlobal.shadow_style]} 
                                    onPress = {() => this.callSendRoseAPI()}
                                >
                                    <Text style = {[{fontSize: 14, color: Colors.white}, stylesGlobal.font]}>Send a Rose</Text>
                                </TouchableOpacity>
                            }
                                <TouchableOpacity style = {{width: 15, height: 15}} 
                                    onPress = {() => {
                                        this.setState({
                                            send_rose_modal_show: false, 
                                            send_rose_search_text: "",
                                            send_rose_page_number: 1,
                                            send_rose_search_list: [],
                                            send_rose_search_more_load: true
                                        })
                                    }}
                                >
                                    <Image style = {{width: '100%', height: '100%', tintColor: Colors.gold}} source={require('../icons/connection-delete.png')}/>
                                </TouchableOpacity>
                            </View>
                        </View>
                        <View style = {{width: '100%', marginTop: 10, alignItems: 'center'}}>
                            <TextInput style = {[{fontSize: 14, color: Colors.black, width: '100%', height: 35, padding: 5, borderWidth: 0.5, borderColor: Colors.gray, borderRadius: 5}, stylesGlobal.font]} placeholder = 'Search...' 
                                autoCorrect = {false}
                                onChangeText = {(text) => this.searchChangeText(text)}
                                returnKeyType = {'done'}
                            >{this.state.send_rose_search_text}</TextInput>
                        </View>
                        <View style = {{ flex: 1, }}>
                            <View style = {{width: '100%', flex: 1, borderWidth: 0.5, borderColor: Colors.gray, marginTop: 10}}>
                                <FlatList
                                    ListHeaderComponent = {this.state.pulldown_loading && <PullDownIndicator/>}
                                    ListFooterComponent={this.state.displayLoadMoreView == true ? footerView : null}
                                    extraData={this.state}
                                    // pagingEnabled={false}
                                    showsHorizontalScrollIndicator={false}
                                    showsVerticalScrollIndicator={false}
                                    data={this.state.send_rose_search_list}
                                    keyExtractor={(item, index) => index.toString()}
                                    style = {{width: '100%'}}
                                    numColumns = {this.state.is_portrait ? 1 : 2}
                                    key = {this.state.is_portrait ? 1 : 2}
                                    renderItem={({ item, index }) => (
                                        <View key = {index} style = {{width: this.state.is_portrait ? '100%' : '50%', alignItems: 'center'}}>
                                            <TouchableOpacity key = {index} style = {{width: '100%', height: 80, flexDirection: 'row', alignItems: 'center', marginBottom: 10, paddingHorizontal: 10, paddingVertical: 5}}
                                                onPress = {() => {
                                                    var send_rose_search_list = this.state.send_rose_search_list;
                                                    for(i = 0; i < send_rose_search_list.length; i ++) {
                                                        if(i == index) {
                                                            send_rose_search_list[i].selected = true;
                                                        } else {
                                                            send_rose_search_list[i].selected = false;
                                                        }
                                                    }
                                                    this.setState({
                                                        send_rose_search_list: send_rose_search_list
                                                    })
                                                }}
                                            >
                                                <View style = {{width: 20, height: 20, marginRight: 10}}>
                                                    <Image source={require('../icons/square.png')}  style={{width: '100%', height: '100%', resizeMode:'contain'}}/>
                                                {
                                                    (item.selected || item.exist_in_current_group) &&
                                                    <Image source={require('../icons/checked.png')} style={{position:'absolute', top: 0, left: 0, width: '100%', height: '100%', resizeMode:'contain', tintColor: item.exist_in_current_group ? Colors.gray : ''}}/>
                                                }
                                                </View>
                                                <View style = {{height: '100%', aspectRatio: 1, marginRight: 10}}>
                                                    <ImageCompressor
                                                        style={{width: '100%', height: '100%', borderRadius: 5, overflow: 'hidden'}}
                                                        uri={item.profile_image}
                                                    />
                                                </View>
                                                <Text style = {[{fontSize: 14, color: Colors.black}, stylesGlobal.font, ]}>{item.first_name} {item.last_name}</Text>
                                            </TouchableOpacity>
                                        </View>
                                    )}
                                    onMomentumScrollBegin={() => { this.onEndReachedCalledDuringMomentumUser = false; }}
                                    onEndReachedThreshold={0.5}
                                    onEndReached={({ distanceFromEnd }) => {
                                        if (!this.onEndReachedCalledDuringMomentumUser ) {
                                            if(this.state.send_rose_search_more_load) {
                                                this.onEndReachedCalledDuringMomentumUser = true;
                                                this.setState({
                                                    send_rose_page_number: this.state.send_rose_page_number + 1
                                                }, () => this.search_person())
                                            }
                                        }
                                    }}
                                    onScroll = {async({nativeEvent}) => {
                                        if(this.isCloseToTop(nativeEvent)) {
                                            this.setState({
                                                send_rose_search_list: [],
                                                send_rose_page_number: 1,
                                                send_rose_search_more_load: true
                                            }, () => this.search_person())
                                        }
                                    }}
                                />
                            </View>
                        {
                            this.state.is_portrait &&
                            <View style = {{width: '100%', marginTop: 20, alignItems: 'flex-end'}}>
                                <TouchableOpacity style = {[{paddingVertical: 10, paddingHorizontal: 20, minWidth: 60, backgroundColor: Colors.gold, borderRadius: 5, justifyContent: 'center', alignItems: 'center'}, stylesGlobal.shadow_style]} 
                                    onPress = {() => this.callSendRoseAPI()}
                                >
                                    <Text style = {[{fontSize: 14, color: Colors.white}, stylesGlobal.font]}>Send a Rose</Text>
                                </TouchableOpacity>
                            </View>
                        }
                        </View>
                    </View>
                </View>
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
                                    sentRose = {true}
                                    is_verified = {this.state.is_verified}
                                />
                            </View>
                        )}
                        onMomentumScrollBegin={() => { this.onEndReachedCalledDuringMomentumEvent = false; }}
                        onEndReachedThreshold={0.5}
                        onEndReached={({ distanceFromEnd }) => {
                            if (!this.onEndReachedCalledDuringMomentumEvent ) {
                                this.onEndReachedCalledDuringMomentumEvent = true;
                                if(this.state.more_load) {
                                    this.getSentRoseList();
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
                                }, () => this.getSentRoseList())
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
})
