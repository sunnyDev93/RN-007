import React, { Component,Fragment } from 'react';
import {
    Platform,
    StyleSheet,
    Text,
    View,
    Image,
    TextInput,
    Dimensions,
    Alert,
    FlatList,
    TouchableOpacity,
    Linking,
    SafeAreaView,
    ImageBackground,
    Modal,
    Pressable,
    Button
} from 'react-native';
import WebService from "../core/WebService";
import Memory from '../core/Memory';
import {WebView} from 'react-native-webview'
import * as Global from "../consts/Global";
import { Colors } from "../consts/Colors";
import ProgressIndicator from "./ProgressIndicator";
import { stylesGlobal, STICKY_HEADER_HEIGHT } from '../consts/StyleSheet'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import AsyncStorage from '@react-native-community/async-storage';
import NumberFormat from 'react-number-format';
import { EventRegister } from 'react-native-event-listeners';
import { Constants } from "../consts/Constants";
import AsyncAlert from './AsyncAlert';
import AutoCompleteInput from './AutoCompleteInput';
var card_valid_check = require('card-validator');
var TAG = "SignUpPaymentScreen";

export default class SignupPaymentScreen extends React.Component {

    
    constructor(props) {
        super(props);
        
        this.state = {
            
            member_type: -1,
            loading: false,
            userId: "",
            email: "",
            gender: 'Gender',
            gender_box_show: false,
            selected_entry: {},
            type_box_show: false,
            inapppurchase_response: null, // used for in app purchase verify
            isVisible: false, //state of modal default false  
            is_portrait: true,
            screen_width: Dimensions.get("window").width,
            showPaypalWebView: false,
            total_price: 49.99,
            total_price_length: 5,
            see_more_payment_option: true,
            cards_list: [],

            card_type: '', //visa, mastercard, american-express, discover, jcb, diners-club, maestro
            CardValid: false,
            card_number: '',
            card_holder_first_name: '',
            card_holder_last_name: '',
            card_expiry_month: '',
            card_expiry_year: '',
            card_cvv: '',

            paypal_access_token: "",
            paypal_pay_error: false,
            paypal_redirection_link: "",
            paypal_post_run_link: "",

            selected_card: null, // for deleting card

            is_portrait: true,
            showPaypalWebView: false,

            member_type_name: "",
            member_type_cost: "",
            member_type_cost_full: "",
            planList:[],
            showSpins: false,
            shownSpin: true,
            cardNumbers:[],
        }
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
        
        EventRegister.removeEventListener(this.addCardListener);
        Dimensions.removeEventListener('change');
    }

    getDataAgain = () => {
        this.getData();
    }

    getData = async () => {
        var data = []
        data.push({
            new_card_index: true
        });
        
        data.push({
            amazon_pay_index: true
        });
        data.push({
            paypal_pay_index: true
        });
        if(Platform.OS == "ios") {
            data.push({
                apple_pay_index: true
            });
        } else if(Platform.OS == "android") {
            data.push({
                google_pay_index: true
            });
        }
        

        
        var member_type_name = '';
        var member_type_cost = '';
        var member_type_cost_full = '';
        Global.entriesAll.forEach(item => {
            if(item.id == this.props.route.params.memberType)
            {
                let cost = item.cost;
                console.log(cost);
                cost = cost.replace(/[^0-9\.]+/g, "");
                console.log(`${Global.BASE_URL_DEV}/pay/${parseFloat(cost)}`, cost)
                member_type_name = item.name,
                member_type_cost = cost,
                member_type_cost_full = item.cost    
            }
        })

        this.setState({
            cards_list: data,
            operation: this.props.route.params.operation,
            member_type: this.props.route.params.memberType,
            member_type_name : member_type_name,
            member_type_cost : member_type_cost,
            member_type_cost_full : member_type_cost_full
        }, () => this.getPlanList());
    };

    getMemberShipPrice = () => {
        
        return this.state.member_type
    }


    handlePressPaypalBtn = () => {
        this.setState({showPaypalWebView:true});
    }

    callRegisterMemberShip = () => {
        this.setState({loading: true});
        var uri = Memory().env == "LIVE" ? Global.URL_REGISTER_MEMBERPLAN : Global.URL_REGISTER_MEMBERPLAN_DEV ;
            
        let params = new FormData();
        params.append("user_id", this.props.route.params.userID);
        params.append("plan_id",this.state.member_type);
        params.append("format", "json");
        console.log(uri);
        WebService.callServicePost(uri, params, this.handleRegisterMembership);
    }

    callUpgradeMemberShip = () => {
        this.setState({loading: true});
        var uri = Memory().env == "LIVE" ? Global.URL_REGISTER_MEMBERPLAN : Global.URL_REGISTER_MEMBERPLAN_DEV ;
            
        let params = new FormData();
        params.append("user_id", this.props.route.params.userID);
        params.append("plan_id",this.state.member_type);
        params.append("format", "json");
        console.log(uri);
        WebService.callServicePost(uri, params, this.handleUpgradeMembership);
    }

    handleUpgradeMembership = (response, isError) => {
        console.log(TAG + "handleUpgradeMembership Response " + JSON.stringify(response));
        console.log(TAG + "handleUpgradeMembership isError " + isError);
        if(!isError){
            var result = response;
            if (result != undefined && result != null) {
                if(response.status == "success")
                {
                    this.props.navigation.goBack();
                    EventRegister.emit(Constants.EVENT_UPGRADE_PROFILE, '');
                    return;
                }
            }
        }
        this.setState({showPaypalWebView: false}); 
        //this.props.navigation.navigate("SignUpScreen");
        this.props.navigation.goBack();
        EventRegister.emit(Constants.EVENT_UPGRADE_PROFILE, 'cancel');
    }

    sufixProcessForPaypalResponse = async() => {
        await AsyncAlert('Pay Success', '');
        if(this.state.operation === 'signup')
            this.callRegisterMemberShip();
        if(this.state.operation === 'upgrade')
            this.callUpgradeMemberShip();
        this.setState({shownSpin: true})
    }

    handleMessage(event){
        let data = event.nativeEvent.data;
        console.log(TAG, 'result from webview ', data);
        if(data == "pay_success")
        {
            
            if(this.state.showPaypalWebView)
            {
                this.setState({showPaypalWebView: false,  showSpins: false, shownSpin: true}, () => {
                         
                    setTimeout(() => {
                        this.sufixProcessForPaypalResponse();
                    }, 500);
                    
                }); 
            }
            
        } else if(data === "pay_cancel")
            this.setState({showPaypalWebView: false, showSpins: false, shownSpin: true});      
        
        
    }
    handlePaypalResponse = async(data) => {
        
       if(data.title.toLowerCase().includes("success"))
       {
            
        if(this.state.showPaypalWebView)
        {
            this.setState({showPaypalWebView: false}, () => {
            
                setTimeout(() => {
                    this.sufixProcessForPaypalResponse();
                }, 500);
                
            }); 
           
        }
            
       }    
        if(data.title.toLowerCase().includes("Cancel")){this.setState({showPaypalWebView: false});}
        console.log('title ', data.title);
    };


    handleRegisterMembership = (response, isError) => {
        console.log(TAG + "handleRegisterMembership Response " + JSON.stringify(response));
        console.log(TAG + "callLoginAPIs isError " + isError);
        if(!isError){
            var result = response;
            if (result != undefined && result != null) {
                if(response.status == "success")
                {
                    this.signIn();
                    return;
                }
            }
        }
        this.setState({showPaypalWebView: false}); 
        this.props.navigation.navigate("SignUpScreen");
    }
    signIn = () => {
        try {
            let params = this.props.route.params.params.params;
            console.log(TAG, " after payment signin ", params);
            // console.log(TAG + " callLoginAPIs uri " + uri);
            // console.log("callLoginAPIs params>>>",params);
            WebService.callServicePost(this.props.route.params.params.uri, params, this.handleSignInResponse);
        } catch (error) {
            
            // console.warn("catch1"+error);

            if (error != undefined && error != null && error.length > 0) {
                console.warn("catch1_If"+error);
                      Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));


                }
            }
    }


    handleSignInResponse = (response, isError) => {

        this.setState({
            loading: false
        });

        console.log(TAG + "callLoginAPIs Response " + JSON.stringify(response));
        console.log(TAG + "callLoginAPIs isError " + isError);

        if (!isError) {
            var result = response;
            if (result != undefined && result != null) {
                console.log(TAG + " callLoginAPIs result " + JSON.stringify(result));
                if (typeof result.status != undefined && result.status != null) {
                    if (result.status == "error") {
                        Alert.alert(Constants.INVALID_USERNAME_PASSWORD);
                    } else {
                        if (result.data != undefined && result.data != null) {
                            var mData = result.data;
                            console.log(TAG + " result " + result.msg);
                            if (mData.user_id != undefined && mData.user_id != null && mData.user_id != "") {
                                try {
                                    var md5 = require('md5');

                                    var prfixUrl = Memory().env == "LIVE" ? Global.MD5_BASE_URL : Global.MD5_BASE_URL_DEV ;
                                    console.log(TAG, ">>>>prfixUrl:", prfixUrl);


                                    let prefixMD5 = md5(prfixUrl);
                                    console.log(TAG, ">>>>prefixMD5:", prefixMD5);

                                    var userUrl = prefixMD5 + "USER_" + mData.user_id + "/cometchat/"
                                    console.log(TAG, ">>>>userUrl:", userUrl);

                                    let userChannelMD5 = md5(userUrl);
                                    console.log(TAG, ">>>>userChannelMD5:", userChannelMD5);

                                    var userChannelId = "";

                                    if (Platform.OS === 'ios') {
                                        userChannelId = "C_" + userChannelMD5 + "i";
                                    } else {
                                        userChannelId = "C_" + userChannelMD5 + "a";
                                    }
                                    console.log(TAG, ">>>>userChannelId:", userChannelId);
                                    // try {
                                    //     FCM.subscribeToTopic(userChannelId);
                                    // } catch (error) {
                                    //     console.log(TAG, ">>>>error:", error);
                                    // }

                                    console.log(TAG, "condition 1");
                                    console.log(mData);
                                    AsyncStorage.setItem(Constants.KEY_USER_GENDER, mData.gender);
                                    AsyncStorage.setItem(Constants.KEY_USER_EMAIL, this.state.email);
                                    console.log(TAG, "condition 2");
                                    AsyncStorage.setItem(Constants.KEY_USER_ID, mData.user_id);

                                    if (mData.slug != undefined && mData.slug != null) {
                                        console.log(TAG, "condition 4");
                                        AsyncStorage.setItem(Constants.KEY_USER_SLUG, mData.slug);
                                    }


                                    if (mData.token != undefined && mData.token != null) {
                                        console.log(TAG, "condition 5");
                                        AsyncStorage.setItem(Constants.KEY_USER_TOKEN, mData.token);
                                    }

                                    if (mData.is_fan != undefined && mData.is_fan != null) {
                                        console.log(TAG, "condition 6");
                                        AsyncStorage.setItem(Constants.KEY_USER_IS_FAN, mData.is_fan);
                                    }

                                    if (mData.first_name != undefined && mData.first_name != null) {
                                        console.log(TAG, "condition 7");
                                        AsyncStorage.setItem(Constants.KEY_USER_FIRST_NAME, mData.first_name);
                                    }

                                    if (mData.last_name != undefined && mData.last_name != null) {
                                        console.log(TAG, "condition 8");
                                        AsyncStorage.setItem(Constants.KEY_USER_LAST_NAME, mData.last_name);
                                    }


                                    if (mData.address != undefined && mData.address != null) {
                                        console.log(TAG, "condition 9");
                                        AsyncStorage.setItem(Constants.KEY_USER_ADDRESS, mData.address);
                                    }

                                    if (mData.profile_imgpath != undefined && mData.profile_imgpath != null) {
                                        console.log(TAG, "condition 10");
                                        AsyncStorage.setItem(Constants.KEY_USER_IMAGE_URL, mData.profile_imgpath);
                                    }

                                    if (mData.profile_filename != undefined && mData.profile_filename != null) {
                                        console.log(TAG, "condition 11");
                                        AsyncStorage.setItem(Constants.KEY_USER_IMAGE_NAME, mData.profile_filename);
                                    }

                                    AsyncStorage.setItem(Constants.KEY_MEMBER_PLAN, mData.member_plan);
                                    AsyncStorage.setItem(Constants.KEY_CHAT_MODAL, "true");

                                    console.log(TAG, "condition 12");
                                    this.props.navigation.navigate("Dashboard");
                                } catch (error) {
                                    console.log(TAG, "condition error " + error);
                                }

                            } else {
                                    Alert.alert(Constants.INVALID_USERNAME_PASSWORD);
                            }
                        }
                    }
                } else {
                    if (result != undefined && result != null && result.length > 0) {
                        Alert.alert(result.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
                    }
                }
            }
        } else {
            if (response != undefined && response != null && response.length > 0) {
                Alert.alert(response.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    }

    
    changeMemberShipWithNewCard=async()=>{
        if(this.state.card_number.length < 12 || this.state.card_number.length > 19) {
            Alert.alert(Constants.INVALID_CARD_NUMBER, "");
            return;
        }
        var card_valid_data = card_valid_check.number(this.state.card_number);
        
        if(!card_valid_data.isValid) {
            Alert.alert(Constants.INVALID_CARD_NUMBER, "");
            return;
        }
        if(this.state.card_holder_first_name == "") {
            Alert.alert(Constants.EMPTY_CARDHOLDER_FIRSTNAME, "");
            return;
        }
        if(this.state.card_holder_last_name == "") {
            Alert.alert(Constants.EMPTY_CARDHOLDER_LASTNAME, "");
            return;
        }
        if(this.state.card_expiry_month == "") {
            Alert.alert(Constants.EMPTY_CARDEXPIRATION_MONTH, "");
            return;
        }
        if(this.state.card_expiry_year.length < 2) {
            Alert.alert(Constants.EMPTY_CARDEXPIRATION_YEAR, "");
            return;
        }
        if(this.state.card_type == "american-express") {
            if(this.state.card_cvv.length != 4) {
                Alert.alert(Constants.INVALID_AMERICAN_CVV, "");
                return;
            }
        } else {
            if(this.state.card_cvv.length != 3) {
                Alert.alert(Constants.INVALID_CVV, "");
                return;
            }
        }

        //this.purchaseGoldCoin("new_card");
        this.changeMemberShipPaypal("new_card")

        
    }


    getPlanList = async() => {
        try { 

            let uri = Memory().env == "LIVE" ? Global.BASE_URL + 'list-plans' : Global.BASE_URL_DEV + 'list-plans'
            let params = new FormData();
            params.append("user_id", this.props.route.params.userID);
            params.append("token", this.state.userToken);
            params.append("format", "json");

            //console.log(TAG + " callGETPLANLISTAPI uri " + uri);
            //console.log(TAG + " callGETPLANLISTAPI params " + JSON.stringify(params));

            WebService.callServicePost(uri, params, this.handlePlanListResponse);
        } catch(e) {

        }
    }

    handlePlanListResponse = (response, isError) => {

        //console.log(TAG + " callGETPLANLISTAPI result " + JSON.stringify(response));

        if(response.status == 'success'){
            var planList = response.data;
            planList.sort((a, b) => parseInt(a.price, 10) - parseInt(b.price, 10));
            for(i = 0; i < planList.length; i ++) {
                if(planList[i].plan_name == "Chest of Coins") {
                    planList[i].image = require('../icons/goldCoin10000New.png');
                    // planList[i].strip = require('../icons/mark_chest.png');
                } else if(planList[i].plan_name == "Sack of Coins") {
                    planList[i].image = require('../icons/goldCoin1000New.png');
                    // planList[i].strip = require('../icons/mark_sack.png');
                } else if(planList[i].plan_name == "Handful of Coins") {
                    planList[i].image = require('../icons/goldCoin10.png');
                    planList[i].strip = require('../icons/mark_best_seller.png');
                }  
                planList[i].goldcoinpack_count = 0;
                planList[i].gold_coins_number = parseInt(planList[i].gold_coins.replace(/,/g, ''), 10);
                planList[i].price_float = parseFloat(planList[i].price.replace(/,/g, ''), 10);
                planList[i].total_str = "";
                planList[i].add_str = ""; // for alignment of price string in UI
            }

            this.setState({
                planList: planList,
            })
        } else {
            if(response.msg)
            {
                Alert.alert(response.msg.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }else{
                Alert.alert(Constants.UNKNOWN_MSG, "");
                //UNKNOWN_MSG
            }
        }
    }

    changeMemberShipPaypal(pay_type) {
        try {
            this.setState({
                loading: true
            });
            let uri = '';
            if(this.state.operation === 'signup')
            {
                uri = Memory().env == "LIVE" ? Global.URL_CHANGE_MEMBERPLAN_PAYPAL : Global.URL_CHANGE_MEMBERPLAN_PAYPAL_DEV;
                console.log(TAG, 'operation', this.state.operation , "changeMemberShipPaypal url", uri);
                let params = new FormData();
                params.append("format", "json");
                params.append("user_id", this.props.route.params.userID);
                
                
                let save_data = {
                    card_number: this.state.card_number,
                    card_type: "Visa",
                    card_first_name: this.state.card_holder_first_name,
                    card_last_name: this.state.card_holder_last_name,
                    card_expiry_month: this.state.card_expiry_month,
                    card_expiry_year: this.state.card_expiry_year,
                    card_cvv: this.state.card_cvv,
                    hdn_membership_planid: this.state.member_type
                }

                // card_number: document.getElementById('card_number').value.trim(),
                //     card_type: "Visa",
                //     card_first_name: document.getElementById('card_name').value.split(" ")[0],
                //     card_last_name: document.getElementById('card_name').value.split(" ")[1],
                //     card_expiry_month: document.getElementById('expiry_month').value,
                //     card_expiry_year: document.getElementById('expiry_year').value,
                //     card_cvv: document.getElementById('cvv').value,
                //     hdn_membership_planid: this.state.member_type
                let send_data = {
                    intent: "CAPTURE",
                    purchase_units: [{
                        amount: {
                            currency_code: "USD",
                            value: this.state.member_type_cost
                        }
                    }],
                    description: "007 percent",
                    payment_source: {
                        card: {
                            number: this.state.card_number,
                            expiry: "20" + this.state.card_expiry_year + "-" + this.state.card_expiry_month,
                            name: this.state.card_holder_first_name + " " + this.state.card_holder_last_name
                        }
                    }
                }
                console.log(TAG, "changeMemberShipPaypal save & send data :::  ", JSON.stringify(save_data), JSON.stringify(send_data))
                params.append("save_data", JSON.stringify(save_data));
                params.append("send_data", JSON.stringify(send_data));
                WebService.callServicePost(uri, params, this.handleChangeMemberShipResponse);
            }
                
            if(this.state.operation === 'upgrade')
            {
                uri = Memory().env == "LIVE" ? Global.URL_CHANGE_MEMBERPLAN_PAYPAL : Global.URL_CHANGE_MEMBERPLAN_PAYPAL_DEV;
                console.log(TAG, 'operation', this.state.operation , "upgradeMemberShipPaypal url", uri);
                let params = new FormData();
                params.append("format", "json");
                params.append("user_id", this.props.route.params.userID);
                
                
                let save_data = {
                    card_number: this.state.card_number,
                    card_type: "Visa",
                    card_first_name: this.state.card_holder_first_name,
                    card_last_name: this.state.card_holder_last_name,
                    card_expiry_month: this.state.card_expiry_month,
                    card_expiry_year: this.state.card_expiry_year,
                    card_cvv: this.state.card_cvv,
                    hdn_membership_planid: this.state.member_type
                }

                let send_data = {
                    intent: "CAPTURE",
                    purchase_units: [{
                        amount: {
                            currency_code: "USD",
                            value: this.state.member_type_cost
                        }
                    }],
                    description: "007 percent",
                    payment_source: {
                        card: {
                            number: this.state.card_number,
                            expiry: "20" + this.state.card_expiry_year + "-" + this.state.card_expiry_month,
                            name: this.state.card_holder_first_name + " " + this.state.card_holder_last_name
                        }
                    }
                }
                console.log(TAG, "upgradeMemberShipPaypal save & send data :::  ", JSON.stringify(save_data), JSON.stringify(send_data))
                console.log(TAG, "upgradeMemberShipPaypal params ",  JSON.stringify(params))
                params.append("save_data", JSON.stringify(save_data));
                params.append("send_data", JSON.stringify(send_data));
                WebService.callServicePost(uri, params, this.handleUpgradingMemberShipResponse);
            }
                
            
            
        } catch (e) {
            console.log("purchaseGoldCoin error : ", e);
            this.setState({
                loading:false
            });
        }
        
    }

    handleUpgradingMemberShipResponse = async (response, isError)=>{
        console.log(TAG, "handleUpgradingMemberShipResponse response : " + JSON.stringify(response))
        if(response != null && response.status) {
            if(response.status == "success") {
                this.setState({
                    card_type: '', //visa, mastercard, american-express, discover, jcb, diners-club, maestro
                    CardValid: false,
                    card_number: '',
                    card_holder_first_name: '',
                    card_holder_last_name: '',
                    card_expiry_month: '',
                    card_expiry_year: '',
                    card_cvv: '',

                    selected_card_cvv: '',
                })
            }

            else if ( response.status == "COMPLETED" ) {
                this.setState({
                    card_type: '', //visa, mastercard, american-express, discover, jcb, diners-club, maestro
                    CardValid: false,
                    card_number: '',
                    card_holder_first_name: '',
                    card_holder_last_name: '',
                    card_expiry_month: '',
                    card_expiry_year: '',
                    card_cvv: '',
                    selected_card_cvv: '',
                })
                
                await AsyncAlert('Pay Success', '');
                this.props.navigation.goBack();
                EventRegister.emit(Constants.EVENT_UPGRADE_PROFILE, '');
            }
            else {
                Alert.alert(response.error.toString().toUpperCase(), response.error_description);
                setTimeout(() => {
                    this.props.navigation.navigate("SignUpScreen");
                }, 3000);
            }
                            
        }

        this.setState({
            loading: false
        });
    }


    handleChangeMemberShipResponse= async (response, isError)=>{
        console.log(TAG, "handleChangeMemberShipResponse response : " + JSON.stringify(response))
        if(response != null && response.status) {
            if(response.status == "success") {
                this.setState({
                    card_type: '', //visa, mastercard, american-express, discover, jcb, diners-club, maestro
                    CardValid: false,
                    card_number: '',
                    card_holder_first_name: '',
                    card_holder_last_name: '',
                    card_expiry_month: '',
                    card_expiry_year: '',
                    card_cvv: '',

                    selected_card_cvv: '',
                })
            }

            else if ( response.status == "COMPLETED" ) {
                this.setState({
                    card_type: '', //visa, mastercard, american-express, discover, jcb, diners-club, maestro
                    CardValid: false,
                    card_number: '',
                    card_holder_first_name: '',
                    card_holder_last_name: '',
                    card_expiry_month: '',
                    card_expiry_year: '',
                    card_cvv: '',
                    selected_card_cvv: '',
                })
                // await this.getPlanList();
                //this.signIn();
                await AsyncAlert('Pay Success', '');
                this.setState({loading: true}, () => {
                    this.signIn()
                }
                );
            }
            else {
                Alert.alert(response.error.toString().toUpperCase(), response.error_description);
                setTimeout(() => {
                    this.props.navigation.navigate("SignUpScreen");
                }, 3000);
            }
                            
        }

        this.setState({
            loading: false
        });
    }

    buy_coins(index) {
        // Alert.alert("To Buy Gold, please use the Website: the007percent.com", "",
        // [
        //     {text: 'OK', onPress: () => {
        //         let link = "https://the007percent.com/my-account";
        //         Linking.canOpenURL(link).then(supported => {
        //             if (supported) {
        //                 Linking.openURL(link);
        //             } else {
        //                 // alert("asdfasdfas")
        //             }
        //         });
        //     }},
        //     {text: 'Cancel', onPress: () => null},
        // ],
        //     {cancelable: false}
        // )
        // return;


        if(this.state.total_price == 0) {
            Alert.alert(Constants.SELECT_COINS, "");
            return;
        }

        
        var selected_card = null;
        for(var i = 0; i < this.state.cards_list.length; i ++) {
            if(this.state.cards_list[i].default) {
                selected_card = this.state.cards_list[i]
                break;
            }
        }
        if(selected_card == null) {
            //Alert.alert(Constants.BUY_SELL_COIN_NO_SELECTED_CARD, "");
            this.changeMemberShipWithNewCard();
            return;
        }
        if(selected_card.saved_card_index && (selected_card.cvv == null || selected_card.cvv == "")) {
            Alert.alert(Constants.NO_CVV_CODE, "");
            return;
        }

        if(selected_card.amazon_pay_index == true) { //  amozone pay
            console.log("amazone pay");
            Alert.alert("We are getting ready for this request", "");
        } else if(selected_card.paypal_pay_index == true) { // paypal pay 
            console.log("paypal pay");
            this.handlePressPaypalBtn()
            
            // this.paypal_pay();
        } else if(selected_card.apple_pay_index == true) { // apple pay
            console.log("apple pay");
            // this.apple_pay();
            Alert.alert("We are getting ready for this request", "");
        } else if(selected_card.google_pay_index == true) { // google pay
            console.log("google pay");
            Alert.alert("We are getting ready for this request", "");
            
        } else if(selected_card.saved_card_index == true) { // saved credit card
            console.log("saved card pay");
            this.purchaseWithSavedCard();
            //Alert.alert("We are getting ready for this request", "");
        } else {
            this.changeMemberShipWithNewCard();
            //Alert.alert("We are getting ready for this request", "");
        }


        // var payed_method = false;
        // for(var i = 0; i < this.state.cards_list.length; i ++) {
        //     if(this.state.cards_list[i].default == true) {
        //         payed_method = true;
        //         if(this.state.cards_list[i].amazon_pay_index == true) { //  amozone pay
                    
        //         } else if(this.state.cards_list[i].paypal_pay_index == true) { // paypal pay 
        //             // this.paypal_pay();
        //         } else if(this.state.cards_list[i].apple_pay_index == true) { // apple pay
        //             // this.apple_pay();
        //         } else if(this.state.cards_list[i].google_pay_index == true) { // google pay
                    
        //         } else if(this.state.cards_list[i].saved_card_index == true) { // saved credit card
                   
        //         }
        //         break;
        //     }
        // }
        // if(payed_method == false) {

        // }
    }



    purchaseWithSavedCard(item) {
        // if(item.default != true) {
        //     return;
        // }
        // if(this.state.selected_card_cvv.length < 3) {
        //     Alert.alert(Constants.INVALID_CVV, "");
        // }
        //this.purchaseGoldCoin("saved_card");
        this.purchaseGoldCoin("saved_card")
    }

    purchaseGoldCoin(pay_type) {
        try {
            this.setState({
                loading: true
            });
            let uri = Memory().env == "LIVE" ? Global.URL_CHANGE_MEMBERPLAN_PAYPAL : Global.URL_CHANGE_MEMBERPLAN_PAYPAL_DEV;
            let params = new FormData();
            params.append("format", "json");
            params.append("user_id", this.props.route.params.userID);
            
            let gold_coins_amount = 0;
            let planList = this.state.planList
            for (i = 0; i < planList.length; i++) {
                gold_coins_amount = gold_coins_amount + planList[i].gold_coins_number * planList[i].goldcoinpack_count;
            }
            let save_data = {
                card_number: this.state.card_number,
                card_type: "Visa",
                card_first_name: this.state.card_holder_first_name,
                card_last_name: this.state.card_holder_last_name,
                card_expiry_month: this.state.card_expiry_month,
                card_expiry_year: this.state.card_expiry_year,
                card_cvv: this.state.card_cvv,
                hdn_membership_planid: this.state.member_type
            }
            let send_data = {
                intent: "CAPTURE",
                purchase_units: [{
                    amount: {
                        currency_code: "USD",
                        value: this.state.total_price
                    }
                }],
                description: "007 percent",
                payment_source: {
                    card: {
                        number: this.state.card_number,
                        expiry: "20" + this.state.card_expiry_year + "-" + this.state.card_expiry_month,
                        name: this.state.card_holder_first_name + " " + this.state.card_holder_last_name
                    }
                }
            }
            params.append("save_data", JSON.stringify(save_data));
            params.append("send_data", JSON.stringify(send_data));
            WebService.callServicePost(uri, params, this.handlepurchaseGoldCoinResponse);
        } catch (e) {
            console.log("purchaseGoldCoin error : ", e);
        }
        this.setState({
            loading: false
        });
    }

    handlepurchaseGoldCoinResponse=(response, isError)=>{
        console.log("handlepurchaseGoldCoinResponse:::222222222" + JSON.stringify(response))
        if(response != null && response.status) {
            if(response.status == "success") {
                this.setState({
                    card_type: '', //visa, mastercard, american-express, discover, jcb, diners-club, maestro
                    CardValid: false,
                    card_number: '',
                    card_holder_first_name: '',
                    card_holder_last_name: '',
                    card_expiry_month: '',
                    card_expiry_year: '',
                    card_cvv: '',

                    selected_card_cvv: '',
                })
            }

            else if ( response.status == "COMPLETED" ) {
                this.setState({
                    card_type: '', //visa, mastercard, american-express, discover, jcb, diners-club, maestro
                    CardValid: false,
                    card_number: '',
                    card_holder_first_name: '',
                    card_holder_last_name: '',
                    card_expiry_month: '',
                    card_expiry_year: '',
                    card_cvv: '',
                    selected_card_cvv: '',
                })
                // await this.getPlanList();
                Alert.alert(response.msg, "Paid successfully");
            }
            else {
                Alert.alert(response.error.toString().toUpperCase(), response.error_description);
            }
                            
        }

        this.setState({
            loading: false
        });
    }
    /**
       * display top header
       */
     renderHeaderView = () => {
        return (
            <View style={[stylesGlobal.headerView, {justifyContent: 'flex-start'}]}>
                
                <TouchableOpacity 
                    style={stylesGlobal.header_backbuttonview_style} 
                    onPress={() => {
                        this.props.navigation.goBack();
                        if(this.state.operation === 'upgrade')
                            EventRegister.emit(Constants.EVENT_UPGRADE_PROFILE, 'cancel');
                    }}>
                    <Image style = {stylesGlobal.header_backbuttonicon_style} source={require("../icons/icon_back.png")}/>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={stylesGlobal.header_logoview_style} 
                    onPress = {() => 
                        {
                            if(this.state.operation == 'upgrade')
                            {
                                this.props.navigation.navigate("Dashboard");
                                EventRegister.emit(Constants.EVENT_UPGRADE_PROFILE, 'cancel');
                            }
                            else
                                this.props.navigation.navigate("SignInScreen")
                        }}>
                    <Image style={stylesGlobal.header_logo_style} source={require("../icons/logo_new.png")}/>
                </TouchableOpacity>
            </View>
        );
    };


    setDefaultCard = async(item) => {

        var cards_list = this.state.cards_list;
        for(var i = 0; i < cards_list.length; i ++) {
            if(item.amazon_pay_index == true && cards_list[i].amazon_pay_index == true) {
                cards_list[i].default = true;
            } else if(item.paypal_pay_index == true && cards_list[i].paypal_pay_index == true) {
                cards_list[i].default = true;
            } else if(item.apple_pay_index == true && cards_list[i].apple_pay_index == true) {
                cards_list[i].default = true;
            } else if(item.google_pay_index == true && cards_list[i].google_pay_index == true) {
                cards_list[i].default = true;
            } else if(item.saved_card_index == true && cards_list[i].saved_card_index == true) {
                if(cards_list[i].paymentProfileId == item.paymentProfileId) {
                    cards_list[i].default = true;
                } else {
                    cards_list[i].default = false;
                }
            } else {
                cards_list[i].default = false;
            }
        }
        this.setState({
            cards_list: cards_list
        })

        // this.setState({
        //     loading: true,
        //     selected_card: item
        // });
        // try {
            
        //     let uri = Memory().env == "LIVE" ? Global.URL_GET_MAKE_DEFAULT_CARD : Global.URL_GET_MAKE_DEFAULT_CARD_DEV;
        //     let params = new FormData();
        //     params.append("format", "json");
        //     params.append("user_id", this.state.userId);
        //     params.append("token", this.state.userToken);
        //     params.append("payment_id", item.paymentProfileId);
        //     console.log(TAG + "callSetDefaultCardAPIs uri " + uri);
        //     console.log(TAG + "callSetDefaultCardAPIs params>>>" + JSON.stringify(params));
        //     WebService.callServicePost(uri, params, this.handleSetDefaultCardResponse);
        // } catch(e){
        //     this.setState({
        //         loading:false
        //     });
        //     console.log(error)
        // }
    }

    handleSetDefaultCardResponse = async(response, isError) => {
        console.log(TAG + " callSetDefaultCardAPIs Response " + JSON.stringify(response));
        console.log(TAG + " callSetDefaultCardAPIs isError " + isError);

        if (!isError) {
            var result = response;
            if (result != undefined && result != null) {
                if(result.status.toUpperCase() == "success".toUpperCase()) {
                    var cards_list = this.state.cards_list;
                    for(i = 0; i < cards_list.length; i ++) {
                        if(cards_list[i].paymentProfileId == this.state.selected_card.paymentProfileId) {
                            cards_list[i].default = true;
                        } else {
                            cards_list[i].default = false;
                        }
                    }
                    
                    this.setState({
                        selected_card: null,
                        cards_list: cards_list,
                        selected_card_cvv: "",
                    }, () => this.refs._carousel.snapToItem(0, animated = true));

                     var tmpCardList = [...cards_list];
                    var tmpCardNumbers = [];
                    tmpCardList.forEach(item => {
                        if(item.cardNumber)
                            tmpCardNumbers.push(item.cardNumber);
                    });

                    this.setState({
                        cardNumbers: tmpCardNumbers
                    });
                    
                } else {
                    Alert.alert(result.msg.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
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


    onChangeCardNumberText(text) {
        this.setState({card_number: text});

        var card_valid_data = card_valid_check.number(text);
        // console.log(text + "    " + JSON.stringify(card_valid_data))
        if(card_valid_data.card != null) {
            this.setState({
                card_type: card_valid_data.card.type
            })
        } else {
            this.setState({
                card_type: ""
            })
        }
        this.setState({
            CardValid: card_valid_data.isValid,
        })
    }

    Spinner = () => {
        <View>
             <ProgressIndicator />
        </View>
    }

    _renderCardItem = (item, index) => {
        
        return(
            <View style = {{width: '100%', alignItems: 'center'}}>
            {
                item.saved_card_index == true &&
                <View style = {{width: '100%', justifyContent:'center', alignItems: 'center'}}>
                    <TouchableOpacity style = {[stylesGlobal.credit_card_view]} onPress={() => this.setDefaultCard(item)} activeOpacity = {Global.activeOpacity}>
                        <View style={{width:'100%', height: '100%', justifyContent: 'space-between', padding: 10, overflow:'hidden'}}>
                            <Text style={[{color:'#777778', fontSize:14,textAlign:'right'},stylesGlobal.font]} numberOfLines={1}>{(item.cardType).toUpperCase()}</Text>
                            <View style={{width: '100%', paddingTop:10, }}>
                                <Image source={require('../icons/card-chip.png')} style={{width:50,height:50,resizeMode:'contain',}}/>

                                <Text style={[{ color:'#efefef', fontSize:22, textAlign: 'center', marginTop: 10,
                                            textShadowColor:'#929292',
                                            textShadowOffset:{width: 1, height: 1},
                                        textShadowRadius:1,},stylesGlobal.font_bold]}
                                        >XXXX  XXXX  XXXX  {item.last4}
                                </Text>
                            </View>
                            <View style={{width:'100%', flex: 1, justifyContent:'space-between', marginTop:10, flexDirection:'row'}}>
                                <View style={{height: '100%', flexDirection:'row', justifyContent:'center', alignItems: 'flex-end'}}>
                                    <TouchableOpacity style = {styles.action_button} onPress = {() => {this.setDefaultCard(item)}}>
                                        <View>
                                            <Image source={require('../icons/square.png')} style={{width:20, height:20}} />
                                        {
                                            item.default == true &&
                                            <Image style={{width: 20, height: 20, position: 'absolute', bottom: 0, left: 0}} source={require('../icons/checked.png')}/> 
                                        }
                                        </View>
                                        <Text style={[styles.action_button_text, stylesGlobal.font]}>{"Use This"}</Text>
                                    </TouchableOpacity>
                                </View>
                            {
                                item.default == true &&
                                <View style = {{height: '100%', justifyContent:'flex-end', }}>
                                    <Text style={[{color:'#777778', fontSize:14}, stylesGlobal.font]}>CVV</Text>
                                    <TextInput style={[{color:'#777778', fontSize: 14, width: 80, height: 30, paddingHorizontal: 5, marginTop: 5, backgroundColor: Colors.white, borderRadius: 5, borderWidth: 1, borderColor: Colors.gray}, stylesGlobal.font]} 
                                        placeholder = {'3~4 digits'} 
                                        keyboardType = {'number-pad'} 
                                        maxLength={4} 
                                        autoCompleteType = {'cc-csc'}
                                        onChangeText = {(text) => {
                                            var cards_list = this.state.cards_list;
                                            for(var i = 0; i < cards_list.length; i ++) {
                                                if(i == index) {
                                                    cards_list[index].cvv = text;
                                                    cards_list[i].default = true;
                                                } else {
                                                    cards_list[i].default = false;
                                                }
                                            }
                                            this.setState({
                                                cards_list: cards_list
                                            })
                                        }}
                                    >
                                        {item.cvv == null ? "" : item.cvv}
                                    </TextInput>
                                </View>
                            }
                                <View style = {{height: '100%', justifyContent: 'flex-end', alignItems: 'flex-end'}}>
                                    <Text style={[{color:'#777778',fontSize:14},stylesGlobal.font]}>MONTH/YEAR</Text>
                                    <View style = {{flexDirection: 'row', alignItems: 'center', marginTop: 10,}}>
                                        <Text style={[{color: '#777778', fontSize:14,},stylesGlobal.font]}>{"EXPIRES: "}</Text>
                                        <Text style={[{color: '#efefef', fontSize:22, textShadowColor:'#929292', textShadowOffset:{width: 1, height: 1}, textShadowRadius:1}, stylesGlobal.font_bold]}>{"XX/XX"}</Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                    </TouchableOpacity>
                </View>
            }
            {
                item.amazon_pay_index == true &&
                <View style = {{width: '100%', justifyContent:'center', alignItems: 'center'}}>
                    <TouchableOpacity style = {stylesGlobal.credit_card_view} activeOpacity = {Global.activeOpacity} onPress = {() => this.setDefaultCard(item)}>
                        <View style={{ width:'100%', height: '100%', justifyContent: 'center', alignItems: 'center'}}>
                            <Image style = {{width: "50%", height: "50%", resizeMode: 'contain'}} source={require('../icons/pay-amazon.png')}></Image>
                        </View>
                        <View style = {[styles.action_button, {position: 'absolute', left: 20, bottom: 10, zIndex: 10}]}>
                            <View>
                                <Image source={require('../icons/square.png')} style={{width:20, height:20}} />
                            {
                                item.default == true &&
                                <Image style={{width: 20, height: 20, position: 'absolute', bottom: 0, left: 0}} source={require('../icons/checked.png')}/> 
                            }
                            </View>
                            <Text style={[styles.action_button_text, stylesGlobal.font]}>{"Use this"}</Text>
                        </View>
                    </TouchableOpacity>
                </View>
            }
            {
                item.apple_pay_index == true &&
                <View style = {{width: '100%', justifyContent:'center', alignItems: 'center'}}>
                    <TouchableOpacity style = {stylesGlobal.credit_card_view} activeOpacity = {Global.activeOpacity} onPress = {() => this.setDefaultCard(item)}>
                        <View style={{ width:'100%', height: '100%', justifyContent: 'center', alignItems: 'center'}}>
                            <Image style = {{width: "50%", height: "50%", resizeMode: 'contain'}} source={require('../icons/pay-apple.png')}></Image>
                        </View>
                        <View style = {[styles.action_button, {position: 'absolute', left: 20, bottom: 10, zIndex: 10}]}>
                            <View>
                                <Image source={require('../icons/square.png')} style={{width:20, height:20}} />
                            {
                                item.default == true &&
                                <Image style={{width: 20, height: 20, position: 'absolute', bottom: 0, left: 0}} source={require('../icons/checked.png')}/> 
                            }
                            </View>
                            <Text style={[styles.action_button_text, stylesGlobal.font]}>{"Use this"}</Text>
                        </View>
                    </TouchableOpacity>
                </View>
            }
            {
                item.google_pay_index == true &&
                <View style = {{width: '100%', justifyContent:'center', alignItems: 'center'}}>
                    <TouchableOpacity style = {stylesGlobal.credit_card_view} activeOpacity = {Global.activeOpacity} onPress = {() => this.setDefaultCard(item)}>
                        <View style={{ width:'100%', height: '100%', justifyContent: 'center', alignItems: 'center' }}>
                            <Image style = {{width: "50%", height: "50%", resizeMode: 'contain'}} source={require('../icons/pay-google.png')}></Image>
                        </View>
                        <View style = {[styles.action_button, {position: 'absolute', left: 20, bottom: 10, zIndex: 10}]} >
                            <View>
                                <Image source={require('../icons/square.png')} style={{width:20, height:20}} />
                            {
                                item.default == true &&
                                <Image style={{width: 20, height: 20, position: 'absolute', bottom: 0, left: 0}} source={require('../icons/checked.png')}/> 
                            }
                            </View>
                            <Text style={[styles.action_button_text, stylesGlobal.font]}>{"Use this"}</Text>
                        </View>
                    </TouchableOpacity>
                    <View style={{width: '100%', height: 50, marginTop: 20, justifyContent: 'center', alignItems: 'center'}}></View>
                </View>
            }
            {
                item.paypal_pay_index == true &&
                <View style = {{width: '100%', justifyContent:'center', alignItems: 'center'}}>
                    <TouchableOpacity style = {stylesGlobal.credit_card_view} activeOpacity = {Global.activeOpacity} onPress = {() => this.setDefaultCard(item)}>
                        <View style={{ width:'100%', height: '100%', justifyContent: 'center', alignItems: 'center' }}>
                            <Image style = {{width: "50%", height: "50%", resizeMode: 'contain'}} source={require('../icons/pay-paypal.png')}></Image>
                        </View>
                        <View style = {[styles.action_button, {position: 'absolute', left: 20, bottom: 10, zIndex: 10}]}>
                            <View>
                                <Image source={require('../icons/square.png')} style={{width:20, height:20}} />
                            {
                                item.default == true &&
                                <Image style={{width: 20, height: 20, position: 'absolute', bottom: 0, left: 0}} source={require('../icons/checked.png')}/> 
                            }
                            </View>
                            <Text style={[styles.action_button_text, stylesGlobal.font]}>{"Use this"}</Text>
                        </View>
                    </TouchableOpacity>
                </View>
            }
            
            {
                item.new_card_index == true &&
                <View style = {{width: '100%', justifyContent:'center', alignItems: 'center'}}>
                    <View style = {stylesGlobal.credit_card_view}>
                        <View style = {{width: '100%', height: '100%', justifyContent: 'space-between', padding: 10}}>
                            <View style = {{width: '100%'}}>
                                <Text style={[styles.new_card_input_title_text, {paddingBottom:5}, stylesGlobal.font]}>{"Card Number:"}</Text>
                                <View style = {{width: '100%', height: 30, marginTop: 5, borderWidth: 0.5, borderColor: Colors.black, borderRadius: 5, flexDirection: 'row'}}>
                                    <View style = {{height: '100%', aspectRatio: 1.5, justifyContent: 'center', alignItems: 'center'}}>
                                    {
                                        this.state.card_type == "" &&
                                        <Image style = {{width: '100%', height: '80%', resizeMode: 'contain', }} source={require('../icons/card-empty.png')}/>
                                    } 
                                    {
                                        this.state.card_type == "visa" &&
                                        <Image style = {{width: '100%', height: '80%', resizeMode: 'contain', opacity: this.state.CardValid ? 1 : 0.5}} source={require('../icons/card-visa.png')}/>
                                    }
                                    {
                                        this.state.card_type == "mastercard" &&
                                        <Image style = {{width: '100%', height: '80%', resizeMode: 'contain', opacity: this.state.CardValid ? 1 : 0.5}} source={require('../icons/card-mastercard.png')}/>
                                    }
                                    {
                                        this.state.card_type == "american-express" &&
                                        <Image style = {{width: '100%', height: '80%', resizeMode: 'contain', opacity: this.state.CardValid ? 1 : 0.5}} source={require('../icons/card-american-express.png')}/>
                                    }
                                    {
                                        this.state.card_type == "discover" &&
                                        <Image style = {{width: '100%', height: '80%', resizeMode: 'contain', opacity: this.state.CardValid ? 1 : 0.5}} source={require('../icons/card-discover.png')}/>
                                    }
                                    {
                                        this.state.card_type == "jcb" &&
                                        <Image style = {{width: '100%', height: '80%', resizeMode: 'contain', opacity: this.state.CardValid ? 1 : 0.5}} source={require('../icons/card-jcb.png')}/>
                                    }
                                    {
                                        this.state.card_type == "diners-club" &&
                                        <Image style = {{width: '100%', height: '80%', resizeMode: 'contain', opacity: this.state.CardValid ? 1 : 0.5}} source={require('../icons/card-diners-club.png')}/>
                                    }
                                    {
                                        this.state.card_type == "maestro" &&
                                        <Image style = {{width: '100%', height: '80%', resizeMode: 'contain', opacity: this.state.CardValid ? 1 : 0.5}} source={require('../icons/card-maestro.png')}/>
                                    }
                                    </View>
                                    <View style = {{flex: 1, height: '100%'}}>
                                        <AutoCompleteInput 
                                            cardNumbers={this.state.cardNumbers}
                                            onChangeText={(text) => { this.setState({card_number: text}); this.onChangeCardNumberText(text)}}
                                        />
                                        {/* <TextInput style = {[{width:'100%', paddingLeft: 5,paddingTop:5 , height:'100%'}, stylesGlobal.font, ]} autoCompleteType = {'cc-number'} textContentType = {'creditCardNumber'} placeholder = '1234 5678 9012 3456' onChangeText = {(text) => this.onChangeCardNumberText(text)}>{this.state.card_number}</TextInput> */}
                                    </View>
                                </View>
                            </View>
                            <View style = {{width: '100%'}}>
                                <Text style={[styles.new_card_input_title_text, {marginTop:10},stylesGlobal.font]}>{"Name on Card:"}</Text>
                                <View style = {{width: '100%', height: 30,  marginTop: 5, flexDirection: 'row', justifyContent: 'space-between'}}>
                                    <View style = {{width: '100%', height: '100%'}}>
                                        <TextInput 
                                            style = {[{width:'100%', paddingLeft: 5,paddingTop:5 , height:'100%'},styles.expiry_text, stylesGlobal.font]} 
                                            autoCompleteType = {'name'} 
                                            keyboardType = {Platform.OS === 'ios' ? 'ascii-capable' : 'visible-password'} 
                                            autoCorrect = {false} textContentType = "oneTimeCode" placeholder = 'First Name' 
                                            onChangeText = {(text) => {
                                                let names = text.split(' ');
                                                console.log(names, this.state.card_holder_first_name, this.state.card_holder_last_name);
                                                if(names.length == 2)
                                                {
                                                    this.setState({card_holder_first_name: names[0].trim(), card_holder_last_name: names[1].trim()})
                                                }else{
                                                    if(names.length == 1)
                                                        this.setState({card_holder_first_name: names[0].trim()});
                                                    else if(names.length > 2)
                                                    {
                                                        this.setState({card_holder_first_name: names[0].trim(),
                                                            card_holder_last_name: text.slice(names[0].length).trim()
                                                        });
                                                    }
                                                }
                                            }}>{this.state.card_holder_last_name.length > 0 ? this.state.card_holder_first_name + " " + this.state.card_holder_last_name : this.state.card_holder_first_name}
                                        </TextInput>
                                    </View>
                                    {/* <View style = {{width: '48%', height: '100%'}}> */}
                                    {/*     <TextInput style = {[{width:'100%', paddingLeft: 5,paddingTop:5 , height:'100%'},styles.expiry_text, stylesGlobal.font]} autoCompleteType = {'name'} keyboardType = {Platform.OS === 'ios' ? 'ascii-capable' : 'visible-password'} autoCorrect = {false} textContentType = "oneTimeCode" placeholder = 'Last Name' onChangeText = {(text) => this.setState({card_holder_last_name: text})}>{this.state.card_holder_last_name}</TextInput> */}
                                    {/* </View> */}
                                </View>
                            </View>
                            <View style = {{width: '100%',  flexDirection: 'row', justifyContent: 'space-between'}}>
                                <View style = {{flex: 1, flexDirection: 'row', justifyContent: 'space-between'}}>
                                    <View style = {{width: '30%'}}>
                                        <Text style={[styles.new_card_input_title_text, {marginTop:10},stylesGlobal.font]}>{"CVV:"}</Text>
                                        <View style = {{width: '100%', height: 30, marginTop:5,}}>
                                            <TextInput
                                                placeholder='123'
                                                maxLength={4}
                                                style={[{width:'100%', paddingLeft: 5,paddingTop:5 , height:'100%'},styles.expiry_text, stylesGlobal.font]}
                                                autoCompleteType = {'cc-csc'}
                                                keyboardType='number-pad'
                                                underlineColorAndroid={Colors.white}
                                                value={this.state.card_cvv}
                                                onChangeText={(text)=>this.setState({card_cvv:text})}
                                            />
                                        </View>
                                    </View>
                                    <View style = {{width: '65%'}}>
                                        <Text style={[styles.new_card_input_title_text, {marginTop:10},stylesGlobal.font]}>{"Expiry Date:"}</Text>
                                        <View style={{flexDirection:'row', height: 30, alignItems:'center', justifyContent: 'space-between', marginTop:5,}}>
                                            <View style = {{width: '48%', height: '100%'}}>
                                                <TextInput placeholder='MM' maxLength={2}
                                                    style={[{width:'100%', paddingLeft: 5,paddingTop:5 , height:'100%'},styles.expiry_text, stylesGlobal.font]}
                                                    autoCompleteType = {'cc-exp-month'}
                                                    keyboardType='number-pad'
                                                    underlineColorAndroid={Colors.white}
                                                    value={this.state.card_expiry_month}
                                                    onChangeText={(text)=>this.setState({card_expiry_month: text})}
                                                    />
                                            </View>
                                            <View style = {{width: '48%', height: '100%'}}>
                                                <TextInput
                                                    placeholder='YYYY'
                                                    maxLength={4}
                                                    style={[{width:'100%', paddingLeft: 5,paddingTop:5 , height:'100%'},styles.expiry_text, stylesGlobal.font]}
                                                    autoCompleteType = {'cc-exp-year'}
                                                    keyboardType='number-pad'
                                                    underlineColorAndroid={Colors.white}
                                                    value={this.state.card_expiry_year}
                                                    onChangeText={(text)=>this.setState({card_expiry_year: text})}
                                                    />
                                            </View>
                                        </View>
                                    </View>
                                </View>
                                <View style = {{marginLeft: 10, justifyContent: 'flex-end'}}>
                                    <TouchableOpacity style={[styles.button_style, stylesGlobal.shadow_style]}  onPress={() => this.buy_coins()}>
                                        <Text style={[styles.button_text, stylesGlobal.font]}>{"Pay"}</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </View>
                </View>
            }
            </View>
        )
    }

    render(){
        return(
            <Fragment>
                { this.state.loading == true && <ProgressIndicator />  }
                {
                    <Modal
                        style={{display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '000'}}
                        visible={this.state.showPaypalWebView}
                        onRequestClose={() => this.setState({ showPaypalWebView: false })}
                    >
                        <WebView
                            onLoadStart={() => {
                                this.setState({showSpins: true});
                            }}
                            onLoadEnd={() => {this.setState({showSpins: false, shownSpin: false});}}
                            style={{height: '90%', marginTop: 30, marginBottom: 30}}
                            source={{ uri: `${Global.BASE_URL_DEV}pay/${this.state.total_price}` }}
                            onNavigationStateChange={data =>
                                this.handlePaypalResponse(data)
                            }
                            onMessage={(event) => this.handleMessage(event)}
                        />
                        {
                            (this.state.showSpins & this.state.shownSpin) ? (<ProgressIndicator /> ) : (null)
                        }
                    </Modal>
                }
                <SafeAreaView style={{ flex: 0, backgroundColor: Colors.black }}/>
                <SafeAreaView style={{ flex: 1, backgroundColor: Colors.black}}>
                
                    <View style={styles.ParentViewContainerStyle} onStartShouldSetResponder = {() => this.setState({type_box_show: false, gender_box_show: false})}>
                        { this.renderHeaderView() }
                        <Image style={{
                            width: this.state.screen_width * 0.4,
                            height: this.state.screen_width * 0.4, 
                            position: 'absolute', 
                            zIndex: 10,
                            top: STICKY_HEADER_HEIGHT - 13, right: 3,
                            resizeMode: 'contain'
                        }} source={{uri: this.state.selected_entry.tag}}/>
                        <View style = {{flex: 1, marginLeft: 20, marginRight: 20, backgroundColor: '#fcf7ed', borderRadius: 5, overflow: 'hidden'}}>
                            <View style={{ alignItems: 'center', width: '100%', height: 40, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.card_titlecolor }}>
                                <Text style={[styles.headText, stylesGlobal.font]}>{"Purchase Membership"}</Text>
                            </View>
                            <KeyboardAwareScrollView style={{paddingLeft: 20, paddingRight: 20,}} extraScrollHeight={100} keyboardShouldPersistTaps='handled'>
                                

                                <View style = {{width: '100%', alignItems: 'center', marginTop: 40}}>
                                    <View style = {{width: '100%', paddingHorizontal: 10}}>
                                        <View style = {{width: '100%', flexDirection: 'row', paddingVertical: 10, justifyContent: 'center', alignItems: 'center'}}>
                                            <Text style={{fontSize: 20, color: '#000000'}}>Price : {this.state.member_type_cost_full}</Text>
                                        </View>
                                    </View>
                                </View>

                                    
{/* 
                                    {
                            this.state.see_more_payment_option &&
                            <View style = {{width: '100%', alignItems: 'flex-end', paddingEnd: 50, marginBottom: 20}}>
                                <TouchableOpacity style={[styles.button_style, stylesGlobal.shadow_style]}  >
                                    <Text style={[styles.button_text, stylesGlobal.font]}>{"Checkout"}</Text>
                                </TouchableOpacity>
                            </View>
                        } */}

                                


                                {
                            this.state.see_more_payment_option && this.state.cards_list.length > 0 &&
                            this._renderCardItem(this.state.cards_list[0], 0)
                        }
                        {
                            !this.state.see_more_payment_option && this.state.cards_list.map((item, index) => 
                            <View key = {index} style = {{width: '100%'}}>
                            {
                                this._renderCardItem(item, index)
                            }
                            </View>
                            )
                        }
                        {
                            this.state.see_more_payment_option &&
                            <View style = {{width: '100%', paddingTop: 20, alignItems: 'center'}}>
                                <TouchableOpacity style={[styles.button_style, stylesGlobal.shadow_style]} onPress={()=> this.setState({see_more_payment_option: !this.state.see_more_payment_option})} >
                                    <Text style={[styles.button_text, stylesGlobal.font_semibold]}>
                                        {this.state.see_more_payment_option ? "See More Payment Options" : "See Less Payment Options"}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        }
                        {
                            !this.state.see_more_payment_option &&
                            <View style = {{width: '100%', alignItems: 'flex-end', paddingEnd: 50, marginBottom: 30}}>
                                <TouchableOpacity style={[styles.button_style, stylesGlobal.shadow_style]} onPress={()=> this.buy_coins()}  >
                                    <Text style={[styles.button_text, stylesGlobal.font]}>{"Checkout"}</Text>
                                </TouchableOpacity>
                            </View>
                        }
                            <View style = {{height: 40}}></View>
                                
                            </KeyboardAwareScrollView>
                            
                        </View>
                    </View>
                
                
                </SafeAreaView>
            </Fragment>
        );
    }
}


const styles = StyleSheet.create({
    ParentViewContainerStyle: {
        flex: 1,
        backgroundColor: Colors.black,
        paddingBottom: 5
    },
    ViewContainerStyle: {
        marginTop: 5,
        height: 40
    },
    type_button_view: {
        width: '100%', 
        height: 30, 
        borderRadius: 5, 
        borderColor: Colors.black, 
        borderWidth: 0.5,
        marginBottom: 5,
        justifyContent: 'center',
        // alignItems: 'center',
        overflow: 'hidden'
    },
    headText: {
        color: Colors.gold,
        fontSize: 20,
    },
    TextLabelContainerStyle: {
        flexDirection: 'row',
        marginBottom: 0,
    },
    IconStyle: {
        alignSelf: 'center',
        height: 12,
        resizeMode: 'contain',
        width: 12,
        marginRight: 5,
        marginLeft: 5
    },
    TextInputStyle: {
        height: 40,
        color: Colors.black,
        fontSize: 13,
        paddingTop: 10,
        paddingBottom: 5,
        paddingLeft: 5,
        backgroundColor: Colors.transparent,
        flex: 1,
        borderColor: "#000000",
        borderWidth: 0.5,
        borderRadius: 5
    },
    LabelTextStyle: {
        color: Colors.black,
        fontSize: 13,
        marginBottom: 0,
        backgroundColor: Colors.transparent,
    },
    LabelProfilePictureFileFormatTextStyle: {
        color: Colors.black,
        fontSize: 12,
        marginTop: 1,
        backgroundColor: Colors.transparent,
        width: '80%',
        textAlign: 'center'
    },
    iconPasswordStyle: {
        height: 25,
        resizeMode: 'contain',
        width: 25,
    },
    profilePhotoCircle: {
        backgroundColor: '#e9edf0',
        // width: width * 0.6,
        // height: width * 0.6,
        // borderRadius: (width * 0.6) / 2,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden'
    },

    gender_button_view: {
        width: '100%', 
        height: 30, 
        flexDirection: 'row', 
        borderRadius: 5, 
        borderColor: '#000000', 
        borderWidth: 0.5,
    },
    gender_button_icon_view: {
        flex: 1, 
        justifyContent: 'center'
    },
    gender_button_text_view: {
        flex: 4, 
        justifyContent: 'center'
    },
    file_checkbox: {
        width: 20, 
        height: '100%', 
        justifyContent: 'center', 
        marginLeft: 10,
    },
    paypal_button:{
        height: 45,
        width: '100%',
        elevation: 1,
        backgroundColor: '#00457C',
        borderRadius: 5,
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
        
    },

    paypal_btn_txt: {
        color: '#fff',
        fontSize: 18,
    },

    container: {
        flex: 1,
        width: "100%",
        height: "100%",
        backgroundColor: Colors.black,
        alignItems: 'center',
        justifyContent: 'center',
        
    },
    card_view: {
        width: '90%',
        height: '90%',
        alignItems: 'center',
        backgroundColor: '#fcf7ed',
        borderRadius: 10,
        
        shadowColor: Colors.white,
        shadowOffset: {
            width: 0,
            height: 0
        },
        shadowRadius: 7,
        shadowOpacity: 7.0,
        overflow: 'hidden'
    },
    title_header: { 
        width: '100%', 
        height: 40, 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: Colors.card_titlecolor,
        borderTopRightRadius: 10,
        borderTopLeftRadius: 10,
        overflow: 'hidden'
    },
    headText: {
        color: Colors.gold,
        fontSize: 20,
        // fontWeight: 'bold'
    },
    normal_text: {
        fontSize:12, 
        color:Colors.black
    },
    countButton: {
        height: '100%', 
        aspectRatio: 1,
        alignItems: 'center', 
        justifyContent: 'center', 
       
        // backgroundColor:Colors.gold,
    },
    count_textview: {
        width: '60%', 
        height: '100%', 
        borderBottomWidth: 1, 
        
        borderBottomColor: Colors.gold, 
        backgroundColor: Colors.lightGray,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row'
    },
    button_style: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        backgroundColor:Colors.gold, 
        justifyContent:'center', 
        alignItems:'center', 
        borderRadius:5,
        
    },
    button_text: {
        color: Colors.white, 
        fontSize:14,
        
    },
    action_button: {
        // width: 60, 
        height: 50, 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        marginRight: 10,
        marginTop: 5,
        
    },
    action_button_text: {
        color: Colors.black, 
        fontSize: 12
    },
    new_card_input_title_text: {
        color:Colors.black, 
        fontSize:14,
    
    },
    expiry_text: {
        width:'100%', 
        borderWidth:.5,
        paddingLeft:5,
        height:'100%',
        borderRadius:5,
        
    },

    paypal_btn_con: {
        
    },

    paypal_button:{
        height: 45,
        width: '70%',
        elevation: 1,
        backgroundColor: '#00457C',
        borderRadius: 3,
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
    },

    paypal_btn_txt: {
        color: '#fff',
        fontSize: 18,
    }
});