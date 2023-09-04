import React, { Component } from "react";
import {
    SafeAreaView,
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    Image,
    TextInput,
    Dimensions, 
    Alert,
    FlatList,
    Keyboard,
    KeyboardAvoidingView,
    Linking,
} from "react-native";
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import { EventRegister } from 'react-native-event-listeners'
import { ImageCompressor } from './ImageCompressorClass'
import Carousel from 'react-native-snap-carousel';
import { Colors } from "../consts/Colors";
import { Constants } from "../consts/Constants";
import { stylesGlobal, STICKY_HEADER_HEIGHT } from '../consts/StyleSheet'
import CustomPopupView from "../customview/CustomPopupView"
import stylesSlider from "../styles/index.style";
import { ScrollView } from "react-native-gesture-handler";
import ProgressIndicator from "./ProgressIndicator";
import Memory from '../core/Memory';
import * as Global from "../consts/Global";
import WebService from "../core/WebService";
import BannerView from "../customview/BannerView";
import AsyncStorage from '@react-native-community/async-storage';

var card_valid_check = require('card-validator');


var {width, height} = Dimensions.get('window');

var TAG = "GiftSend";
const cardMargin = 12;

var SLIDER_1_FIRST_ITEM = 0;


export default class GiftSend extends React.Component {

    constructor(props) {
        isFirsTime = true;
        super(props)

        this.state = {
            loading: false,
            searchText: '',
            
            userImagePath: "",
            userImageName: "",
            showModel: false,
            selected_gift: null,
            selected_gift_item: this.props.route.params.selected_gift,
            numberofgift: this.props.route.params.numberofgift,
            receiver: this.props.route.params.receiver,
            my_gold_coin: 0,

            gift_purchase_success: false, // true after buy gift

        }
    }

    UNSAFE_componentWillMount() {
        this.getData();
        this.listener = EventRegister.addEventListener(Constants.EVENT_PROFILE_IMAGE_UPDATED, () => {
            console.log(TAG,"EVENT_PROFILE_IMAGE_UPDATED event called");
            this.refreshProfileImage();
        })

    }

    componentDidMount() {

    }

    componentWillUnmount() {
        EventRegister.removeEventListener(this.listener)
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
            var my_gold_coins_str = await AsyncStorage.getItem(Constants.KEY_GOLD_COINS);

            this.setState({
                userId: userId,
                userToken: userToken,
                userSlug: userSlug,
                userImagePath: userImagePath,
                userImageName: userImageName,
                showModel: false,
                my_gold_coin: parseInt(my_gold_coins_str, 10),
            });
        } catch (error) {
            // Error retrieving data
        }

        this.getGiftDetail();

    };

    getGiftDetail = async() => {
        try {
            this.setState({ loading: true });
            let uri = Memory().env == "LIVE" ? Global.URL_GIFT_DETAIL + this.state.selected_gift_item.id : Global.URL_GIFT_DETAIL_DEV + this.state.selected_gift_item.id;
            let params = new FormData();
            params.append("token", this.state.userToken);
            params.append("user_id", this.state.userId);
            params.append("format", "json");
            console.log(TAG + " callgiftDetailAPI uri " + uri);
            console.log(TAG + " callgiftDetailAPI params " + JSON.stringify(params));
            WebService.callServicePost(
                uri,
                params,
                this.handleGiftDetailResponse
            );
        } catch (error) {
            console.log(error)
            this.setState({
                loading: false
            });
            Alert.alert(JSON.stringify(error), "");
        }
    }

    handleGiftDetailResponse = (response, isError) => {
        console.log(TAG + " callgiftDetailAPI result " + JSON.stringify(response));
        if (!isError) {
            try {
                var result = response;
                if (typeof result != "undefined" && result != undefined && result != null) {
                    this.setState({
                        selected_gift: result.data,
                    })
                }
            } catch (error) {
                Alert.alert(JSON.stringify(error), "");
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

    sendGift = async() => {
        if(this.state.my_gold_coin < parseInt(this.state.selected_gift.orderDetails.gold_coin.toString(), 10)) {
            Alert.alert("To Buy or Sell Gold, please use the Website: the007percent.com", "",
            [
                {text: 'OK', onPress: () => {
                    let link = Memory().env == "LIVE" ? Global.BASE_URL : Global.BASE_URL_DEV + "my-account";
                    Linking.canOpenURL(link).then(supported => {
                        if (supported) {
                            Linking.openURL(link);
                        } else {
                            // alert("asdfasdfas")
                        }
                    });
                }},
                {text: 'Cancel', onPress: () => null},
            ],
                {cancelable: false}
            );
            return;
        }
        try {
            this.setState({
                loading: true
            });
            let uri = Memory().env == "LIVE" ? Global.URL_SENDGIFT : Global.URL_SENDGIFT_DEV;
            let params = {
                "token": this.state.userToken,
                "user_id": this.state.userId,
                "format": "json",
                "product_id": this.state.selected_gift.orderDetails.id,
                "receiver_id": this.state.receiver.id,
                "num_of_coins": parseInt(this.state.selected_gift.orderDetails.gold_coin.toString(), 10),
                "is_own": 0
            };
            console.log(TAG + " callSendGiftAPI uri " + uri);
            console.log(TAG + " callSendGiftAPI params " + JSON.stringify(params));
            WebService.callServicePost( uri, params, this.handleSendGiftResponse );
        } catch (error) {
            console.log(error)
            this.setState({
                loading: false
            });
            Alert.alert(JSON.stringify(error), "");
        }
    }

    handleSendGiftResponse = (response, isError) => {
        console.log(TAG + " callSendGiftAPI Response " + JSON.stringify(response));
        console.log(TAG + " callSendGiftAPI isError " + isError);
        if (!isError) {
            try {
                var result = response;
                if (typeof result != "undefined" && result != undefined && result != null) {
                    if(result.status.toUpperCase() == "Success".toUpperCase()) {
                        this.callGiftCheckOutAPI(result.msg);
                    } else {

                    }
                }
            } catch (error) {
                console.log(TAG + " callSendGiftAPI result " + error);
                Alert.alert(JSON.stringify(error), "");
            }
        } else {
            console.log(TAG + " callSendGiftAPI result " + error);
            if (response != undefined && response != null && response.length > 0) {
                Alert.alert(response.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
        this.setState({ loading: false });
    };

    callGiftCheckOutAPI = (orderID) => {
        try {
            this.setState({ loading: true });
            let uri = Memory().env == "LIVE" ? Global.URL_BUYGIFT + orderID.toString() : Global.URL_BUYGIFT_DEV + orderID.toString();
            let params = new FormData();
            params.append("token", this.state.userToken);
            params.append("user_id", this.state.userId);
            params.append("format", "json");
            console.log(TAG + " callGiftCheckOutAPI uri " + uri);
            console.log(TAG + " callGiftCheckOutAPI params " + JSON.stringify(params));
            WebService.callServicePost( uri, params, this.handleGiftCheckOutResponse );
        } catch (error) {
            console.log(error)
            this.setState({ loading: false });
            Alert.alert(JSON.stringify(error), "");
        }
    }

    handleGiftCheckOutResponse = (response, isError) => {
        console.log(TAG + " callGiftCheckOutAPI result " + JSON.stringify(response));
        if (!isError) {
            try {
                var result = response;
                if (typeof result != "undefined" && result != undefined && result != null) {
                    try {
                        AsyncStorage.setItem(Constants.KEY_GOLD_COINS, (this.state.my_gold_coin - parseInt(this.state.selected_gift.orderDetails.gold_coin.toString(), 10) * this.state.numberofgift).toString());
                    } catch(error) {
                        console.log(error)
                    }
                    EventRegister.emit(Constants.EVENT_PROFILE_GOLDCOIN_UPDATED, '');
                    this.setState({ gift_purchase_success: true });
                    this.mainScrollView.scrollToPosition(0, 0, true);
                }
            } catch (error) {
                Alert.alert(JSON.stringify(error), "");
            }
        } else {
            if (response != undefined && response != null && response.length > 0) {
                Alert.alert(response.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
        this.setState({ loading: false });
    };

    render() {
        return (
            <SafeAreaView style={styles.container} onStartShouldSetResponder={() => Keyboard.dismiss()}>
                {this.renderHeaderView()}
                {this.renderPopupView()}
                {this.state.loading && <ProgressIndicator/>}
            {
                this.state.selected_gift != null &&
                <View style = {[stylesGlobal.subViewDetail, {backgroundColor: '#FCF7ED'}]}>
                    <View style={stylesGlobal.title_header}>
                        <Text style={[stylesGlobal.headText, stylesGlobal.font]}>{"YOUR ORDER"}</Text>
                    </View>
                    <KeyboardAwareScrollView keyboardShouldPersistTaps = "handled" ref = {ref => {this.mainScrollView = ref}} style = {{flex: 1, width: '100%', padding: 20}} showsVerticalScrollIndicator = {false}>
                        <View style = {{width: '100%', alignItems: 'center', backgroundColor: Colors.white, borderRadius: 5, overflow: 'hidden', marginBottom: 20}}>
                            <View style = {{width: '120%', height: '100%', position: 'absolute', top: 0, left: -Dimensions.get('screen').width * 0.1}}>
                                <Image style = {{width: '100%', height: '100%', resizeMode: 'contain'}} source={require("../icons/gift_background.png")}></Image>
                            </View>
                            <View style = {{position: 'absolute', top: 0, right: 0, width: '35%', aspectRatio: 1}}>
                                <Image style = {{width: '100%', height: '100%', resizeMode: 'contain'}} source={require("../icons/gold_ribbon.png")}></Image>
                            </View>
                        {
                            this.state.gift_purchase_success &&
                            <View style = {{width: '100%', alignItems: 'center', marginTop: 25}}>
                                <View style = {{width: 60, aspectRatio: 1}}>
                                    <Image style = {{width: '100%', height: '100%', resizeMode: 'contain'}} source={require("../icons/verify_checkmark.png")}></Image>
                                </View>
                                <Text style = {[styles.rowText, {color: Colors.gold, fontSize: 18, marginTop: 10}, stylesGlobal.font]}>{"Purchase Completed"}</Text>
                            </View>
                        }
                            <View style = {{width: '100%', alignItems: 'center', marginTop: 25}}>
                                <Text style = {[styles.rowText, stylesGlobal.font,]}>{"A gift for"}</Text>
                            </View>
                            <TouchableOpacity style = {{width: 150, aspectRatio: 1, borderRadius: 75, borderWidth: 2, borderColor: Colors.gold, overflow: 'hidden', marginVertical: 20 }}
                                onPress = {() => this.props.navigation.navigate("ProfileDetail", {slug: this.state.receiver.slug})}
                            >
                                <ImageCompressor
                                    uri={this.state.receiver.imgpath + Constants.THUMB_FOLDER + this.state.receiver.filename}
                                    style={{ width: '100%', height: '100%'}}
                                />
                            </TouchableOpacity>
                            <View style = {{width: '100%', alignItems: 'center'}}>
                                <Text style = {[styles.rowText, stylesGlobal.font]}>{this.state.receiver.first_name + ' ' + this.state.receiver.last_name}</Text>
                            </View>
                            <TouchableOpacity style = {{width: '60%', aspectRatio: 1, marginTop: 25}}
                                onPress={() => {
                                    this.props.navigation.navigate("ImageZoom", {
                                        index: 0,
                                        tempGalleryUrls: [{
                                            id: this.state.selected_gift.orderDetails.image_path + this.state.selected_gift.orderDetails.image_name,
                                            image: { uri: this.state.selected_gift.orderDetails.image_path + this.state.selected_gift.orderDetails.image_name }
                                        }]
                                    })
                                }}    
                            >
                                <ImageCompressor
                                    uri={this.state.selected_gift.orderDetails.image_path + this.state.selected_gift.orderDetails.image_name}
                                    style={{ width: '100%', height: '100%', overflow: 'hidden'}}
                                />
                            </TouchableOpacity>
                            <View style = {{width: '100%', alignItems: 'center', marginVertical: 25}}>
                                <Text style = {[styles.rowText, stylesGlobal.font_bold, {color: Colors.gold}]}>{this.state.selected_gift.orderDetails.title}</Text>
                                <Text style = {[styles.rowText, stylesGlobal.font, {width: '70%', textAlign: 'center', marginTop: 15}]} multiline = {true}>{this.state.selected_gift.orderDetails.description}</Text>
                            </View>
                        {
                            this.state.gift_purchase_success &&
                            <View style = {{width: '100%', alignItems: 'center', marginBottom: 25}}>
                                <Text style = {[styles.rowText, stylesGlobal.font, {width: '70%', textAlign: 'center', color: Colors.gold}]} multiline = {true}>
                                    {"You will be notified when " + this.state.receiver.first_name + " has claimed your gift"}
                                </Text>
                                <TouchableOpacity style = {[styles.buy_button, {marginTop: 20}, stylesGlobal.shadow_style]}
                                    onPress = {() => this.props.navigation.goBack()}
                                >
                                    <Text style = {[styles.rowText, stylesGlobal.font, {color: Colors.white}]}>{"Continue Shopping"}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style = {[styles.buy_button, {marginTop: 10}, stylesGlobal.shadow_style]}
                                    onPress = {() => this.props.navigation.navigate('Dashboard', {logoclick: true})}
                                >
                                    <Text style = {[styles.rowText, stylesGlobal.font, {color: Colors.white}]}>{"Go To Dashboard"}</Text>
                                </TouchableOpacity>
                            </View>
                        }
                        </View>
                    {
                        !this.state.gift_purchase_success &&
                        <View style = {{width: '100%', alignItems: 'center', backgroundColor: Colors.white, borderRadius: 5, marginBottom: 20, overflow: 'hidden'}}>
                            <View style = {{width: '100%', height: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.gold}}>
                                <Text style = {[styles.rowText, {color: Colors.white}, stylesGlobal.font]}>{"Make Purchase"}</Text>
                            </View>
                            <View style = {{width: '100%', alignItems: 'center', marginVertical: 25}}>
                                <View style = {{width: '80%', flexDirection: 'row', justifyContent: 'center'}}>
                                    <Image style = {{width: 30, height: 30, resizeMode: 'contain'}} source={require("../icons/goldCoin10New.png")}></Image>
                                    <View style = {{justifyContent: 'flex-end', flexDirection: 'row'}}>
                                        <View style = {{alignItems: 'flex-end'}}>
                                            <Text style = {[styles.rowText, stylesGlobal.font_semibold, {}]}>{"Total:  "}</Text>
                                            <Text style = {[styles.rowText, stylesGlobal.font_semibold, {marginTop: 15}]}>{"Account Balance:  "}</Text>
                                            <Text style = {[styles.rowText, stylesGlobal.font_semibold, {marginTop: 15}]}>{"Balance After Purchase:  "}</Text>
                                        </View>
                                        <View style = {{alignItems: 'flex-end'}}>
                                            <Text style = {[styles.rowText, stylesGlobal.font_semibold, {}]}>{parseInt(this.state.selected_gift.orderDetails.gold_coin.toString(), 10) * this.state.numberofgift}</Text>
                                            <Text style = {[styles.rowText, stylesGlobal.font_semibold, {marginTop: 15}]}>{this.state.my_gold_coin}</Text>
                                        {
                                            (this.state.my_gold_coin - parseInt(this.state.selected_gift.orderDetails.gold_coin.toString(), 10) * this.state.numberofgift) < 0 &&
                                            <Text style = {[styles.rowText, stylesGlobal.font_semibold, {marginTop: 15, color: Colors.red}]}>{this.state.my_gold_coin - parseInt(this.state.selected_gift.orderDetails.gold_coin.toString(), 10) * this.state.numberofgift}</Text>
                                        }
                                        {
                                            (this.state.my_gold_coin - parseInt(this.state.selected_gift.orderDetails.gold_coin.toString(), 10) * this.state.numberofgift) >= 0 &&
                                            <Text style = {[styles.rowText, stylesGlobal.font_semibold, {marginTop: 15}]}>{this.state.my_gold_coin - parseInt(this.state.selected_gift.orderDetails.gold_coin.toString(), 10) * this.state.numberofgift}</Text>
                                        }   
                                        </View>
                                    </View>
                                </View>
                            {
                                (this.state.my_gold_coin - parseInt(this.state.selected_gift.orderDetails.gold_coin.toString(), 10) * this.state.numberofgift) < 0 &&
                                <View style = {{width: '100%', alignItems: 'center', marginTop: 25}}>
                                    <Text style = {[styles.rowText, stylesGlobal.font, {color: Colors.red, marginTop: 15}]}>{"You need more gold coins"}</Text>
                                </View>
                            }
                                <View style = {{width: '100%', marginTop: 20, alignItems: 'center'}}>
                                    {this.state.my_gold_coin < (parseInt(this.state.selected_gift.orderDetails.gold_coin.toString(), 10) * this.state.numberofgift) && 
                                        <TouchableOpacity style = {[styles.buy_button, stylesGlobal.shadow_style]} 
                                            onPress = {() => this.props.navigation.navigate('Dashboard', {selected_screen: "myaccount", myaccount_initial_tab: "buy_goldcoin"})}
                                        >
                                            <Text style = {[styles.rowText, stylesGlobal.font, {color: Colors.white}]}>{"Buy More Gold Coins"}</Text>
                                        </TouchableOpacity>
                                    }
                                    
                                    <TouchableOpacity style = {[styles.buy_button, {marginTop: 10}, stylesGlobal.shadow_style]}
                                        disabled = {(this.state.my_gold_coin - parseInt(this.state.selected_gift.orderDetails.gold_coin.toString(), 10) * this.state.numberofgift) < 0 ? true : false}
                                        onPress = {() => this.sendGift()}
                                    >
                                        <Text style = {[styles.rowText, stylesGlobal.font, {color: Colors.white}]}>{"Send Now"}</Text>
                                    {
                                        (this.state.my_gold_coin - parseInt(this.state.selected_gift.orderDetails.gold_coin.toString(), 10) * this.state.numberofgift) < 0 &&
                                        <View style = {{width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, backgroundColor: Colors.white, opacity: 0.3}}></View>
                                    }
                                    </TouchableOpacity>
                                </View> 
                            </View>
                        </View>
                    }
                        <View style = {{height: 20, width: '100%'}}></View>
                    </KeyboardAwareScrollView>  
                </View>   
            }               
            </SafeAreaView>
        );
    }

    renderBannerView = () => {
        return (
            <BannerView
                screenProps = {this.props.navigation}
            />
        )
    }
 
    /** render PopUp Menu
    *
    * @returns {*}
    */

    renderPopupView = () => {
        return (
            <CustomPopupView
                showModel={this.state.showModel}
                openMyAccountScreen={(show_myaccount, myaccount_initial_tab) => this.props.navigation.navigate('Dashboard', {selected_screen: "myaccount", myaccount_initial_tab: myaccount_initial_tab})}
                logoutUser={this.logoutUser}
                closeDialog={() => { this.setState({ showModel: false }) }}
                prop_navigation = {this.props.navigation}
            >
            </CustomPopupView>
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

    hidePopupView = () => {
        this.setState({
            showModel: false
        })
    }

    showPopupView = () => {
        this.setState({
            showModel: true
        })
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


    /**
   * display top header
   */
    renderHeaderView = () => {

        let imageUrl = this.state.userImagePath + Constants.THUMB_FOLDER + this.state.userImageName;
        return (
            <View style={[stylesGlobal.headerView]}>
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
                <TouchableOpacity style={stylesGlobal.header_avatarview_style} onPress={() => this.showPopupView()}>
                    <View style={stylesGlobal.header_avatarsubview_style}>
                        <ImageCompressor style = {stylesGlobal.header_avatar_style} uri={imageUrl}/>
                    </View>
                </TouchableOpacity>
            </View>
        );
    };

}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.black,
    },
    rowText: {
        color: Colors.black,
        fontSize: 16,
    },
    buy_button: {
        width: '70%', 
        height: 40, 
        alignItems: 'center', 
        justifyContent: 'center', 
        backgroundColor: Colors.gold, 
        borderRadius: 5
    }
});
