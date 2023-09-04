import React, { Component } from "react";
import {
    Alert,
    StyleSheet,
    SafeAreaView,
    View,
    TouchableOpacity,
    ScrollView,
    Text,
    Dimensions,
    FlatList
} from "react-native";

import { ImageCompressor } from './ImageCompressorClass'
import { Colors } from "../consts/Colors";
import { Constants } from "../consts/Constants";
import { stylesGlobal, STICKY_HEADER_HEIGHT } from '../consts/StyleSheet';
import Memory from "../core/Memory";
import * as Global from "../consts/Global";
import WebService from "../core/WebService";
import ProgressIndicator from "./ProgressIndicator";
import Moment from "moment/moment";
import AsyncStorage from '@react-native-community/async-storage';


var TAG = "MyListGiftReceived";
var {height, width} = Dimensions.get('window');

export default class MyListGiftReceived extends React.Component {

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

            member_list: [],
            total_length: 0,
            viewall_page_number: 0,
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

            }, () => this.getReceivedGiftList());
        } catch (error) {
            // Error retrieving data
        }

    };

    getReceivedGiftList() {

        try {

            this.setState({
                loading: true
            });

            let uri = Memory().env == "LIVE" ? Global.URL_GIFTS_RECEIVED + this.state.viewall_page_number : Global.URL_GIFTS_RECEIVED_DEV + this.state.viewall_page_number;
            let params = new FormData();
            params.append("token", this.state.userToken);
            params.append("user_id", this.state.userId);
            params.append("format", "json");
            
            console.log(TAG + " callgetGiftsReceivedAPI uri " + uri);
            console.log(TAG + " callgetGiftsReceivedAPI params " + JSON.stringify(params));

            WebService.callServicePost(uri, params, this.handleGetGiftsReceived);
        } catch (error) {
            console.log(TAG + " callgetGiftsReceivedAPI error " + error);
            this.setState({
                loading: false
            });
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }

        
    }

    handleGetGiftsReceived = (response, isError) => {
        console.log(TAG + " callgetGiftsReceivedAPI Response " + JSON.stringify(response));
        console.log(TAG + " callgetGiftsReceivedAPI isError " + isError);

        if (!isError) {
            var result = response;
            if (result != undefined && result != null) {
                if(result.status == "success") {
                    if(result.data != null) {
                        this.setState({
                            member_list: [...this.state.member_list, ...result.data],
                        });
                        if(result.data.length > 0) {
                            this.setState({
                                more_load: true,
                                viewall_page_number: this.state.viewall_page_number + 1
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
                Alert.alert(response.msg.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }

        this.setState({
            loading: false
        });
    }

    accept_decline_gift = (status, order_item) => {
        try {

            this.setState({
                loading: true,
                selected_order: order_item,
                accept_status: status
            });

            let uri = Memory().env == "LIVE" ? Global.URL_ACCEPT_DECLINE_GIFT : Global.URL_ACCEPT_DECLINE_GIFT_DEV;
            let params = new FormData();
            params.append("token", this.state.userToken);
            params.append("user_id", this.state.userId);
            params.append("format", "json");
            params.append("order_id", order_item.id);
            if(status == "accept") {
                params.append("action", 1);
            } else {
                params.append("action", 0);
            }
            
            console.log(TAG + " callAcceptRejectGift uri " + uri);
            console.log(TAG + " callAcceptRejectGift params " + JSON.stringify(params));

            WebService.callServicePost(uri, params, this.handleAcceptRejectGiftsReceived);
        } catch (error) {
            console.log(TAG + " callAcceptRejectGift error " + error);
            this.setState({
                loading: false
            });
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    }

    handleAcceptRejectGiftsReceived = (response, isError) => {
        console.log(TAG + " callAcceptRejectGift Response " + JSON.stringify(response));
        console.log(TAG + " callAcceptRejectGift isError " + isError);

        if (!isError) {
            var result = response;
            if (result != undefined && result != null) {
                if(result.status == "success") {
                    var member_list = this.state.member_list;
                    for(i = 0; i < member_list.length; i ++) {
                        if(member_list[i].id == this.state.selected_order.id) {
                            if(this.state.accept_status == "accept") {
                                member_list[i].is_accepted = "1";
                            } else {
                                member_list.splice(i, 1);
                            }
                            break;
                        }
                    }
                    this.setState({
                        member_list: gifts_array,
                        selected_order: null
                    })
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
        } else {
            if (response != undefined && response != null && response.length > 0) {
                Alert.alert(response.msg.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
        this.setState({
            loading: false
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

    gift_detail(item) {
        var gift_item = {
            "id": item.vg_product_id,
            "title": item.title,
            "image_path": item.image_path,
            "image_name": item.image_name,
            "gold_coin": item.gold_coin,
            "type": "0",
            "status": "1",
            "slug": "",
            "wishlist_id": ""
        }
        this.props.screenProps.navigate("GiftDetail", {item: gift_item, numberofgift: 1, receiver: null, src_screen: "mygift"});
    }

    _renderGiftReceivedItem = (item, index) => {
        
        var imageUrl = item.image_path + item.image_name;
        if(item.image_path == null || item.image_name == null) {
            imageUrl = null
        }
        
        return(
            <TouchableOpacity style={[stylesGlobal.cardView, {width: '80%', padding: 10, marginBottom: 20}]} activeOpacity = {Global.activeOpacity} onPress = {() => this.gift_detail(item)}>
                <View style = {{width: '100%', aspectRatio: 1}}>
                    <ImageCompressor
                        uri={imageUrl}
                        style={styles.fitImage}
                        default = {require('../icons/Background-Placeholder_Camera.png')}
                    />
                </View>
                <Text style={[stylesGlobal.titleText, stylesGlobal.font]} numberOfLines={1}>
                    {item.title}
                </Text>
                <View style = {{width: '100%', marginTop: 15}}>
                    <View style = {{width: '100%', marginBottom: 10}}>
                        <Text style={[styles.rowText, stylesGlobal.font]}>{"Sent By: "}</Text>
                        <Text style={[styles.rowText, stylesGlobal.font]}>{item.first_name} {item.last_name}</Text>
                    </View>
                    <View style = {{width: '100%', marginBottom: 10}}>
                        <Text style={[styles.rowText, stylesGlobal.font]}>{"Gold Coin Value: "}</Text>
                        <Text style={[styles.rowText, stylesGlobal.font]}>{item.gold_coin}</Text>
                    </View>
                    <View style = {{width: '100%', marginBottom: 10}}>
                        <Text style={[styles.rowText, stylesGlobal.font]}>{"Type: "}</Text>
                        <Text style={[styles.rowText, stylesGlobal.font]}>{item.vg_product_type == "0" ? "Real Gift" : "Virtual Gift"}</Text>
                    </View>
                    <View style = {{width: '100%', marginBottom: 10}}>
                        <Text style={[styles.rowText, stylesGlobal.font]}>{"Received On: "}</Text>
                        <Text style={[styles.rowText, stylesGlobal.font]}>{Moment(item.created_at).format("MMM DD, YYYY, hh:mm a")}</Text>
                    </View>
                </View>
                <View style = {{width: '100%', marginTop: 20, alignItems: 'center'}}>
                {
                    item.is_accepted != "1" && item.vg_product_type == "0" &&
                    <View style = {{width: '100%', flexDirection: 'row', justifyContent: 'center'}}>
                        <TouchableOpacity style = {[styles.button, stylesGlobal.shadow_style]} onPress = {() => this.accept_decline_gift("accept", item)}>
                            <Text style = {[styles.buttonText, stylesGlobal.font]}>{"Accept"}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style = {[styles.button, stylesGlobal.shadow_style, {marginLeft: 20}]} onPress = {() => this.accept_decline_gift("decline", item)}>
                            <Text style = {[styles.buttonText, stylesGlobal.font]}>{"Decline"}</Text>
                        </TouchableOpacity>
                    </View>
                }
                {
                    item.is_accepted == "1" && item.vg_product_type == "0" && 
                    <View style = {[styles.button, ]}>
                        <Text style = {[styles.buttonText, stylesGlobal.font, {color: Colors.black}]}>{"Accepted"}</Text>
                    </View>
                }
                </View>
            </TouchableOpacity>
        )
    }

    render() {
        return (
            <SafeAreaView style={styles.container}>
            {
                this.state.loading && <ProgressIndicator/>
            }
            {
                !this.state.loading && this.state.member_list.length == 0 &&
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <View style = {[stylesGlobal.empty_cardView, {height: '90%', justifyContent: 'center', alignItems: 'center'}]}>
                        <Text style={[stylesGlobal.card_empty_text, stylesGlobal.font, ]}>{"No Received Gifts"}</Text>
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
                            {
                                this._renderGiftReceivedItem(item, index)
                            }
                            </View>
                        )}
                        onMomentumScrollBegin={() => { this.onEndReachedCalledDuringMomentum = false; }}
                        onEndReachedThreshold={0.5}
                        onEndReached={({ distanceFromEnd }) => {
                            if (!this.onEndReachedCalledDuringMomentum ) {
                                this.onEndReachedCalledDuringMomentum = true;
                                if(this.state.more_load) {
                                    this.getReceivedGiftList();
                                }
                            }
                        }}
                        onScroll = {async({nativeEvent}) => {
                            if(this.isCloseToTop(nativeEvent)) {
                                this.setState({
                                    member_list: [],
                                    viewall_page_number: 0,
                                    more_load: true
                                }, () => this.getReceivedGiftList())
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
    fitImage: {
        borderRadius: 10,
        width: '100%',
        height: '100%',
        overflow: 'hidden',
    },
    rowText: {
        color: Colors.black,
        fontSize: 14,
        backgroundColor: Colors.transparent
    },
    button: {
        paddingVertical: 10,
        paddingHorizontal: 15,
        backgroundColor: Colors.gold,
        borderRadius: 5,
    },
    buttonText: {
        color: Colors.black,
        fontSize: 14,
    },
});
