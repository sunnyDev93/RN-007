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


var TAG = "MyListGiftSent";
var {height, width} = Dimensions.get('window');
export default class MyListGiftSent extends React.Component {

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

            }, () => this.getSentGiftList());
        } catch (error) {
            // Error retrieving data
        }

    };

    getSentGiftList() {
        try {
            this.setState({
                loading: true
            });

            let uri = Memory().env == "LIVE" ? Global.URL_GIFTS_SENT + this.state.viewall_page_number : Global.URL_GIFTS_SENT_DEV + this.state.viewall_page_number;
            let params = new FormData();
            params.append("token", this.state.userToken);
            params.append("user_id", this.state.userId);
            params.append("format", "json");
            
            console.log(TAG + " callgetSentGiftAPI uri " + uri);
            console.log(TAG + " callgetSentGiftAPI params " + JSON.stringify(params));

            WebService.callServicePost(uri, params, this.handleGetSentGift);
        } catch (error) {
            console.log(TAG + " callgetSentGiftAPI error " + error);
            this.setState({
                loading: false
            });
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    }

    handleGetSentGift = (response, isError) => {
        console.log(TAG + " callgetSentGiftAPI Response " + JSON.stringify(response));
        console.log(TAG + " callgetSentGiftAPI isError " + isError);

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

    _renderGiftSentItem = (item, index) => {
        var imageUrl = item.image_path + item.image_name;
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
                        <Text style={[styles.rowText, stylesGlobal.font]}>{"Sent To: "}</Text>
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
                        <Text style={[styles.rowText, stylesGlobal.font]}>{"Sent On: "}</Text>
                        <Text style={[styles.rowText, stylesGlobal.font]}>{Moment(item.created_at).format("DD MMM YYYY, hh:mm a")}</Text>
                    </View>
                </View>
                <View style = {{width: '100%', marginTop: 20, alignItems: 'center'}}>
                {
                    item.is_accepted == "1" &&
                    <View style = {[styles.button,]}>
                        <Text style = {[styles.buttonText, stylesGlobal.font]}>{"Accepted"}</Text>
                    </View>
                }
                {
                    item.is_accepted == "0" &&
                    <View style = {[styles.button,]}>
                        <Text style = {[styles.buttonText, stylesGlobal.font]}>{"Declined"}</Text>
                    </View>
                }  
                {
                    item.is_accepted != "1" && item.is_accepted != "0" &&
                    <View style = {[styles.button,]}>
                        <Text style = {[styles.buttonText, stylesGlobal.font]}>{"Pending"}</Text>
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
                        <Text style={[styles.empty_text, stylesGlobal.font, ]}>{"No Sent Gifts"}</Text>
                        <TouchableOpacity style = {[stylesGlobal.common_button, stylesGlobal.shadow_style, {marginTop: 10}]} onPress = {() => this.props.screenProps.navigate("GiftList", {receiver: null})}>
                            <Text style = {[{fontSize: 14, color: Colors.white}, stylesGlobal.font]}>{"Send a Gift"}</Text>
                        </TouchableOpacity>
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
                                this._renderGiftSentItem(item, index)
                            }
                            </View>
                        )}
                        onMomentumScrollBegin={() => { this.onEndReachedCalledDuringMomentum = false; }}
                        onEndReachedThreshold={0.5}
                        onEndReached={({ distanceFromEnd }) => {
                            if (!this.onEndReachedCalledDuringMomentum ) {
                                this.onEndReachedCalledDuringMomentum = true;
                                if(this.state.more_load) {
                                    this.getSentGiftList();
                                }
                            }
                        }}
                        onScroll = {async({nativeEvent}) => {
                            if(this.isCloseToTop(nativeEvent)) {
                                this.setState({
                                    member_list: [],
                                    viewall_page_number: 0,
                                    more_load: true
                                }, () => this.getSentGiftList())
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
