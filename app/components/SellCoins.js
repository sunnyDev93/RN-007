import React, { Component } from "react";
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    Image,
    SafeAreaView,
    Dimensions, Alert,
    TextInput,
    Keyboard,
    Linking,
    ScrollView
} from "react-native";

import { Colors } from "../consts/Colors";
import { Constants } from "../consts/Constants";
import ProgressIndicator from "./ProgressIndicator";
import {stylesGlobal} from '../consts/StyleSheet';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { EventRegister } from 'react-native-event-listeners'
import * as Global from "../consts/Global";
import WebService from "../core/WebService";
import Memory from '../core/Memory';
import AsyncStorage from '@react-native-community/async-storage';
import NumberFormat from 'react-number-format';
import { ApplePayButton, PaymentRequest } from 'react-native-payments';
import AsyncAlert from './AsyncAlert';
import AutoCompleteInput from './AutoCompleteInput';
var card_valid_check = require('card-validator');
const base64 = require('base-64');
const { width, height } = Dimensions.get("window");
var TAG = "SellCoins Screen";
export default class SellCoins extends React.Component {

    constructor(props) {
        
        super(props)

        this.state = {
            loading: false,
            my_gold_coins: 0,
            origin_my_gold_coins: 0,
            sell_coin_count: 0.0,
            coin_image: null,
            price_per_coin: 0,

            userId: "",
            userToken: "",
            planList:[],

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
            showInputEmailPopup:false, 
            email_address: "",
            cardNumbers:[],
            
        }

        this.onEndReachedCalledDuringMomentum = true;
    }

    async UNSAFE_componentWillMount() {
        this.addCardListener = EventRegister.addEventListener(Constants.EVENT_ADD_CREDIT_CARD, () => {
            this.getCardDetails();
        })
        try {
            var userId = await AsyncStorage.getItem(Constants.KEY_USER_ID);
            var userToken = await AsyncStorage.getItem(Constants.KEY_USER_TOKEN);
            var userSlug = await AsyncStorage.getItem(Constants.KEY_USER_SLUG);
            
            
            this.setState({
                userId: userId,
                userToken: userToken,
                userSlug: userSlug,
            }, () => {
                this.getPlanList();
                this.getCardDetails();
            });
            
        } catch (error) {
            // Error retrieving data
            console.log('getData  error  ' + error);
        }

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

    getPlanList = async() => {
        // this.setState({
        //     loading: true
        // });
        try { 

            let uri = Memory().env == "LIVE" ? Global.BASE_URL + 'list-plans' : Global.BASE_URL_DEV + 'list-plans'
            let params = new FormData();
            params.append("user_id", this.state.userId);
            params.append("token", this.state.userToken);
            params.append("format", "json");

            console.log(TAG + " callGETPLANLISTAPI uri " + uri);
            console.log(TAG + " callGETPLANLISTAPI params " + JSON.stringify(params));

            WebService.callServicePost(uri, params, this.handlePlanListResponse);
        } catch(e) {

            // this.setState({loading:false});
        }
    }

    handlePlanListResponse = async(response, isError) => {

        console.log(TAG + " callGETPLANLISTAPI result " + JSON.stringify(response));

        if(response.status == 'success') {
            
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
            }
            var my_gold_coins_str = await AsyncStorage.getItem(Constants.KEY_GOLD_COINS);
            my_gold_coins = parseInt(my_gold_coins_str, 10);
            if(my_gold_coins <= parseInt(planList[0].gold_coins, 10)) {
                this.setState({
                    coin_image: planList[0].image
                })
            } else if(my_gold_coins >= parseInt(planList[planList.length - 1].gold_coins, 10)) {
                this.setState({
                    coin_image: planList[planList.length - 1].image
                })
            } else {
                for(i = 0; i < planList.length; i ++) {
                    if(parseInt(planList[i].gold_coins, 10) <= my_gold_coins && my_gold_coins < parseInt(planList[i + 1].gold_coins, 10)) {
                        this.setState({
                            coin_image: planList[i].image
                        })
                        break;
                    }
                }
            }
            
            var price_per_coin = parseInt(planList[planList.length - 1].price, 10) / parseInt(planList[planList.length - 1].gold_coins, 10);
            //var price_per_coin = 3;
            this.setState({
                planList: planList,
                price_per_coin: price_per_coin,
                my_gold_coins: my_gold_coins,
                origin_my_gold_coins: my_gold_coins,
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
        // this.setState({
        //     loading:false
        // });
    }

    getCardDetails= async()=>{
        
        let cardList = [];
        
        cardList.push({
            paypal_pay_index: true,
            default: true
        });
        cardList.push({
            amazon_pay_index: true
        });
        if(Platform.OS == "ios") {
            cardList.push({
                apple_pay_index: true
            });
        } else if(Platform.OS == "android") {
            cardList.push({
                google_pay_index: true
            });
        }
        this.setState({
            cards_list: cardList
        })
        // try {
        //     this.setState({
        //         loading:true
        //     });

        //     let uri = Memory().env == "LIVE" ? Global.URL_GET_SAVEDCARDS : Global.URL_GET_SAVEDCARDS_DEV;
        //     let params = new FormData();
        //     params.append("format", "json");
        //     params.append("user_id", this.state.userId);
        //     params.append("token", this.state.userToken);

        //     console.log(TAG + " callCardsList uri " + uri);
        //     console.log(TAG + " callCardsList params " + JSON.stringify(params));
        //     WebService.callServicePost(uri, params, this.handleGetSavedCardsResponse);
        // } catch (error) {
        //     this.setState({
        //         loading: false,
        //     });
        //     // console.warn("catch1"+error);
        //     if (error != undefined && error != null && error.length > 0) {
        //         // console.warn("catch1_If"+error);
        //         Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
        //     }
        // }
    }

    handleGetSavedCardsResponse = (response, isError) => {
        
        console.log(TAG + " callCardsList response " + JSON.stringify(response));
        console.log(TAG + " callCardsList error " + JSON.stringify(isError));
        try {
            if (!isError) {
                if (response != undefined && response != null) {
                    if(response.status == "success") {
                        if(response.data != null) {
                            if(this.state.cards_list.length == 0) {
                                var default_card_index = -1;
                                for(i = 0; i < response.data.length; i ++) {
                                    response.data[i].saved_card_index = true;
                                    if(response.data[i].default == true) {
                                        default_card_index = i;
                                    }
                                }
                                if(default_card_index != -1) {
                                    var default_card = response.data[default_card_index];
                                    response.data.splice(default_card_index, 1);
                                    response.data.unshift(default_card)
                                }

                                response.data.push({
                                   // new_card_index: true
                                });
                                
                                response.data.push({
                                    amazon_pay_index: true
                                });
                                response.data.push({
                                    paypal_pay_index: true
                                });
                                if(Platform.OS == "ios") {
                                    response.data.push({
                                        apple_pay_index: true
                                    });
                                } else if(Platform.OS == "android") {
                                    response.data.push({
                                        google_pay_index: true
                                    });
                                }
                                this.setState({
                                    cards_list: response.data
                                });
                                var tmpCardList = [...result.data];
                                var tmpCardNumbers = [];
                                tmpCardList.forEach(item => {
                                    if(item.cardNumber)
                                    tmpCardNumbers.push(item.cardNumber);
                                });

                                this.setState({
                                    cardNumbers: tmpCardNumbers
                                });
                            } else {
                                var ii = 0;
                                for(var i = 0; i < this.state.cards_list.length; i ++) {
                                    ii = 0;
                                    while(ii < response.data.length) {
                                        response.data[ii].saved_card_index = true;
                                        if(this.state.cards_list[i].paymentProfileId == response.data[ii].paymentProfileId) {
                                            response.data.splice(ii, 1);
                                            break;
                                        } else {
                                            ii ++;
                                        }
                                    }
                                }
                                this.setState({
                                    //cards_list: [...response.data, ...this.state.cards_list]
                                })
                            }
                            if(response.data.length == 0) {
                                this.setState({
                                    initialPage: 0
                                });
                            }
                        }
                    }
                }
            } else {
                if (response != undefined && response != null && response.length > 0) {
                    Alert.alert(response.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
                }
            }
        } catch(error) {
            console.log(error)
        }
        this.setState({
            loading: false,
        });
    }

    plus_button = () => {
        if(this.state.my_gold_coins > 0) {
            this.setState({
                sell_coin_count: this.state.sell_coin_count + 1,
                my_gold_coins: this.state.my_gold_coins - 1
            }, () => {
                if(this.state.my_gold_coins <= parseInt(this.state.planList[0].gold_coins, 10)) {
                    this.setState({
                        coin_image: this.state.planList[0].image
                    })
                } else if(this.state.my_gold_coins >= parseInt(this.state.planList[this.state.planList.length - 1].gold_coins, 10)) {
                    this.setState({
                        coin_image: this.state.planList[planList.length - 1].image
                    })
                } else {
                    for(i = 0; i < this.state.planList.length; i ++) {
                        if(parseInt(this.state.planList[i].gold_coins, 10) <= this.state.my_gold_coins && this.state.my_gold_coins < parseInt(this.state.planList[i + 1].gold_coins, 10)) {
                            this.setState({
                                coin_image: this.state.planList[i].image
                            })
                            break;
                        }
                    }
                }
            })
        }
    }

    minus_button = () => {
        if(this.state.sell_coin_count > 1) {
            this.setState({
                sell_coin_count: this.state.sell_coin_count - 1,
                my_gold_coins: this.state.my_gold_coins + 1
            }, () => {
                if(this.state.my_gold_coins <= parseInt(this.state.planList[0].gold_coins, 10)) {
                    this.setState({
                        coin_image: this.state.planList[0].image
                    })
                } else if(this.state.my_gold_coins >= parseInt(this.state.planList[this.state.planList.length - 1].gold_coins, 10)) {
                    this.setState({
                        coin_image: this.state.planList[planList.length - 1].image
                    })
                } else {
                    for(i = 0; i < this.state.planList.length; i ++) {
                        if(parseInt(this.state.planList[i].gold_coins, 10) <= this.state.my_gold_coins && this.state.my_gold_coins < parseInt(this.state.planList[i + 1].gold_coins, 10)) {
                            this.setState({
                                coin_image: this.state.planList[i].image
                            })
                            break;
                        }
                    }
                }
            })
        }
    }

    handlePressRemeedAfterSelectingCard() {


        if(this.state.sell_coin_count == 0) {
            Alert.alert(Constants.EMPTY_SELL_COIN, "");
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
            Alert.alert(Constants.BUY_SELL_COIN_NO_SELECTED_CARD, "");
            return;
        }
        if(selected_card.saved_card_index && (selected_card.cvv == null || selected_card.cvv == "")) {
            Alert.alert(Constants.NO_CVV_CODE, "");
            return;
        }
        
        if(selected_card.amazon_pay_index == true)
        {
            Alert.alert("We are getting ready for this request", "");
            return;
        }
        if(selected_card.apple_pay_index == true)
        {
            Alert.alert("We are getting ready for this request", "");
            return;
        }
        if(selected_card.google_pay_index == true)
        {
            Alert.alert("We are getting ready for this request", "");
            return;
        }

        //this.setState({showInputEmailPopup: true});

        this.callSellCoinsAPI() ;
    }

    callSellCoinsAPI() {
        // Alert.alert("To Sell Gold, please use the Website: the007percent.com", "",
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
        //     console.log(TAG + "callSellCoinsAPI uri " + uri);
        //     console.log(TAG + "callSellCoinsAPI params>>>" + JSON.stringify(params));
        //     WebService.callServicePost(uri, params, this.handleSellCoinsResponse);
        // } catch(e){
        //     this.setState({
        //         loading:false
        //     });
        //     console.log(error)
        // }

        this.setState({
            loading: true,
            //selected_card: item
        });
        try {
            
            let uri = Memory().env == "LIVE" ? Global.URL_SELL_GOLD_COINS_PAYPAL : Global.URL_SELL_GOLD_COINS_PAYPAL_DEV;
            // let params = new FormData();
            // params.append("format", "json");
            // params.append("user_id", this.state.userId);
            // params.append("token", this.state.userToken);
            // params.append("email", this.state.email_address);
            // params.append('coins', this.state.sell_coin_count)
            let params = {
                "format": "json",
                "user_id": this.state.userId,
                "token": this.state.userToken,
                "email": this.state.email_address,
                'coins': this.state.sell_coin_count,
                'price': (this.state.sell_coin_count * this.state.price_per_coin).toFixed(2)
            };
            console.log(TAG + "callSellCoinsAPI uri " + uri);
            console.log(TAG + "callSellCoinsAPI params>>>" + JSON.stringify(params));
            WebService.callServicePost(uri, params, this.handleSellCoinsResponse);
        } catch(e){
            this.setState({
                loading:false
            });
            console.log(error)
        }
        
    }

    handleSellCoinsResponse = async(response, isError) => {
        console.log(TAG + " callSellCoinsAPI Response " + JSON.stringify(response));
        console.log(TAG + " callSellCoinsAPI isError " + isError);

        if (!isError) {
            var result = response;
            if (result != undefined && result != null) {
                if(result.status.toUpperCase() == "success".toUpperCase()) {
                    
                    await AsyncAlert('', result.msg.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
                    EventRegister.emit(Constants.EVENT_PROFILE_GOLDCOIN_UPDATED, '');
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
            showInputEmailPopup: false
        });
    }

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
        console.log(cards_list);
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

    add_new_card = async() => {
        
        if(this.state.card_number.length < 12 || this.state.card_number.length > 19) {
            Alert.alert(Constants.INVALID_CARD_NUMBER_LENGTH, "");
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

        try {
            this.setState({
                loading: true
            });

            let uri = Memory().env == "LIVE" ? Global.URL_ADD_CREDITCARD : Global.URL_ADD_CREDITCARD_DEV;
            let params = new FormData();
            params.append("token", this.state.userToken);
            params.append("user_id", this.state.userId);
            params.append("format", "json");
            params.append("card_number", this.state.card_number);
            params.append("card_first_name", this.state.card_holder_first_name);
            params.append("card_last_name", this.state.card_holder_last_name);
            params.append("expiry_month", this.state.card_expiry_month);
            params.append("expiry_year", this.state.card_expiry_year);
            params.append("cvv", this.state.card_cvv);
            
            console.log(TAG + " callAddCreditCardAPI uri " + uri);
            console.log(TAG + " callAddCreditCardAPI params " + JSON.stringify(params));

            WebService.callServicePost(uri, params, this.handleSaveCards);
        } catch (error) {
            this.setState({
                loading: false,
            });
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    }

    handleSaveCards = (response, isError) => {
        console.log(TAG + " callAddCreditCardAPI Response " + JSON.stringify(response));
        console.log(TAG + " callAddCreditCardAPI isError " + isError);

        if (!isError) {
            var result = response; ////// {"PaymentStatus":[{"status":"1","msg":"Payment done successfully"}]}
            if (result != undefined && result != null) {
                if(result.PaymentStatus[0].status == "1") {
                    Alert.alert(Constants.CARD_SAVE_SUCCESS, "");
                    this.setState({
                        card_number: '',
                        card_holder_first_name: '',
                        card_holder_last_name: '',
                        card_expiry_month: '',
                        card_expiry_year: '',
                        card_cvv: '',
                        add_button_status: false,

                        card_type: '', 
                        CardValid: false,
                    });
                    // this.getCardDetails();
                    EventRegister.emit(Constants.EVENT_ADD_CREDIT_CARD, '');
                } else {
                    this.setState({
                        loading: false,
                    });
                    Alert.alert("Your card is not saved. Please try again", "");
                }
            }
        } else {
            if (response != undefined && response != null && response.length > 0) {
                Alert.alert(response.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
            this.setState({
                loading: false,
            });
        }
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
                                <Text style={[{ color:'#efefef', fontSize:22, textAlign: 'center', marginTop: 10, textShadowColor:'#929292', textShadowOffset:{width: 1, height: 1}, textShadowRadius:1,},stylesGlobal.font_bold]}>XXXX  XXXX  XXXX  {item.last4}</Text>
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
                                        <Text style={[styles.action_button_text, stylesGlobal.font]}>Use This</Text>
                                    </TouchableOpacity>
                                </View>
                            {
                                item.default == true &&
                                <View style = {{height: '100%', justifyContent:'flex-end', }}>
                                    <Text style={[{color:'#777778', fontSize:14}, stylesGlobal.font]}>CVV</Text>
                                    <TextInput style={[{color:'#777778', fontSize: 14, width: 80, height: 30, paddingHorizontal: 5, marginTop: 5, backgroundColor: Colors.white, borderRadius: 5, borderWidth: 1, borderColor: Colors.gray}, stylesGlobal.font]} 
                                        placeholder = {'3~4 digits'} keyboardType = {'number-pad'} maxLength={4} 
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
                            <Text style={[styles.action_button_text, stylesGlobal.font]}>Use this</Text>
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
                            <Text style={[styles.action_button_text, stylesGlobal.font]}>Use this</Text>
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
                            <Text style={[styles.action_button_text, stylesGlobal.font]}>Use this</Text>
                        </View>
                    </TouchableOpacity>
                    <View style={{width: '100%', height: 50, marginTop: 20, justifyContent: 'center', alignItems: 'center'}}></View>
                </View>
            }
            {
                item.paypal_pay_index == true &&
                <View style = {{width: '100%', justifyContent:'center', alignItems: 'center'}}>

                        
                    <TouchableOpacity style = {stylesGlobal.credit_card_view} activeOpacity = {Global.activeOpacity} onPress = {() => this.setDefaultCard(item)}>

                    <TextInput style={[{color:'#777778', position: 'absolute', zIndex: 1000,  fontSize: 14, width: '80%', height: 30, paddingHorizontal: 5, marginTop: 20, backgroundColor: Colors.white, borderRadius: 5, borderWidth: 1, borderColor: Colors.gray}, stylesGlobal.font]} 
                                       
                                        onChangeText = {(text) => this.setState({email_address: text})} placeholder = "Email Address">{this.state.email_address}</TextInput>

                        <View style={{ width:'100%', height: '100%', justifyContent: 'center', alignItems: 'center'}}>
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
                            <Text style={[styles.action_button_text, stylesGlobal.font]}>Use this</Text>
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
                                <Text style={[styles.new_card_input_title_text, {paddingBottom:5}, stylesGlobal.font]}> Card Number:</Text>
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
                                        {/* <TextInput style = {[{width:'100%',paddingTop:5 ,paddingLeft: 5, height:'100%'}, stylesGlobal.font, ]} keyboardType = 'number-pad' placeholder = '1234 5678 9012 3456' onChangeText = {(text) => this.onChangeCardNumberText(text)}>{this.state.card_number}</TextInput> */}
                                    </View>
                                </View>
                            </View>
                            <View style = {{width: '100%'}}>
                                <Text style={[styles.new_card_input_title_text, {marginTop:10},stylesGlobal.font]}>
                                    Name on Card:
                                </Text>
                                <View style = {{width: '100%', height: 30,  marginTop: 5, flexDirection: 'row', justifyContent: 'space-between'}}>
                                    <View style = {{width: '100%', height: '100%'}}>
                                        <TextInput 
                                            style = {[{width:'100%',paddingTop:5 ,paddingLeft: 5, height:'100%'},styles.expiry_text, stylesGlobal.font]} 
                                            keyboardType = {Platform.OS === 'ios' ? 'ascii-capable' : 'visible-password'} 
                                            autoCorrect = {false} 
                                            textContentType = "oneTimeCode" 
                                            placeholder = 'First Name' 
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
                                    {/*     <TextInput style = {[{width:'100%',paddingTop:5 ,paddingLeft: 5, height:'100%'},styles.expiry_text, stylesGlobal.font]} keyboardType = {Platform.OS === 'ios' ? 'ascii-capable' : 'visible-password'} autoCorrect = {false} textContentType = "oneTimeCode" placeholder = 'Last Name' onChangeText = {(text) => this.setState({card_holder_last_name: text})}>{this.state.card_holder_last_name}</TextInput> */}
                                    {/* </View> */}
                                </View>
                            </View>
                            <View style = {{width: '100%',  flexDirection: 'row', justifyContent: 'space-between'}}>
                                <View style = {{flex: 1, flexDirection: 'row', justifyContent: 'space-between'}}>
                                    <View style = {{width: '30%'}}>
                                        <Text style={[styles.new_card_input_title_text, {marginTop:10},stylesGlobal.font]}> CVV:</Text>
                                        <View style = {{width: '100%', height: 30, marginTop:5,}}>
                                            <TextInput
                                                placeholder='123'
                                                maxLength={4}
                                                style={[{width:'100%',paddingTop:5 ,paddingLeft: 5, height:'100%'},styles.expiry_text, stylesGlobal.font]}
                                                keyboardType='number-pad'
                                                underlineColorAndroid={Colors.white}
                                                value={this.state.card_cvv}
                                                onChangeText={(text)=>this.setState({card_cvv:text})}
                                            />
                                        </View>
                                    </View>
                                    <View style = {{width: '65%'}}>
                                        <Text style={[styles.new_card_input_title_text, {marginTop:10},stylesGlobal.font]}>Expiry Date:</Text>
                                        <View style={{flexDirection:'row', height: 30, alignItems:'center', justifyContent: 'space-between', marginTop:5,}}>
                                            <View style = {{width: '48%', height: '100%'}}>
                                                <TextInput placeholder='MM' maxLength={2}
                                                    style={[{width:'100%',paddingTop:5 ,paddingLeft: 5, height:'100%'},styles.expiry_text, stylesGlobal.font]}
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
                                                    style={[{width:'100%',paddingTop:5 ,paddingLeft: 5, height:'100%'},styles.expiry_text, stylesGlobal.font]}
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
                                    <TouchableOpacity style={[styles.button_style, stylesGlobal.shadow_style]} onPress={() => this.add_new_card()}>
                                        <Text style={[styles.button_text, stylesGlobal.font]}>Add Card</Text>
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

    renderSellCoinAmountInputForm = () => {
        return (
            <View style={{ position:'absolute', width:width, height:height, top:0, left:0, zIndex: 10, alignItems: 'center' }}>
                <View style={{position:'absolute', width:width, height:height, top:0, left:0, backgroundColor:Colors.black, opacity:0.3,}}
                    onStartShouldSetResponder={() => this.setState({showInputEmailPopup:false, email_address: ""})}
                />
                <View style={{width: '95%', backgroundColor:Colors.white, alignItems:'center', paddingHorizontal:15, borderRadius:10, justifyContent:'center'}}>
                    <View style = {{width: '100%', padding: 20}}>
                        <Text style = {[{fontSize: 15, color: Colors.black}, stylesGlobal.font]}>{"Please Enter Paypal Address"}</Text>
                    </View>
                    <View style = {{width: '100%', padding: 20, borderTopColor: Colors.gray, borderTopWidth: 0.5, borderBottomColor: Colors.gray, borderBottomWidth: 0.5, alignItems: 'center'}}>
                        <TextInput style = {[{fontSize: 14, color: Colors.black, width: '90%', height: 35, padding: 5, borderWidth: 0.5, borderColor: Colors.gray, borderRadius: 5}, stylesGlobal.font]} autoCorrect = {false} autoCapitalize = {"none"} onChangeText = {(text) => this.setState({email_address: text})} placeholder = "Email Address">{this.state.email_address}</TextInput>
                    </View>
                    <View style = {{width: '100%', padding: 20, flexDirection: 'row', justifyContent: 'flex-end'}}>
                        <TouchableOpacity style = {[{paddingVertical: 10, paddingHorizontal: 20, minWidth: 60, backgroundColor: Colors.gold, borderRadius: 5, justifyContent: 'center', alignItems: 'center'}, stylesGlobal.shadow_style]} 
                            onPress = {() => this.callSellCoinsAPI()}
                        >
                            <Text style = {[{fontSize: 14, color: Colors.white}, stylesGlobal.font]}>{"Redeem"}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style = {[{paddingVertical: 10, paddingHorizontal: 20, minWidth: 60, backgroundColor: Colors.gold, borderRadius: 5, marginLeft: 15, justifyContent: 'center', alignItems: 'center'}, stylesGlobal.shadow_style]} 
                            onPress = {() => this.setState({showInputEmailPopup: false, email_address: ""})}
                        >
                            <Text style = {[{fontSize: 14, color: Colors.white}, stylesGlobal.font]}>{"Cancel"}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        )
    }

    render() {
        return (
            <SafeAreaView style={styles.container} >
            {
                this.state.loading && 
                <ProgressIndicator/>
            }
            {this.state.showInputEmailPopup && this.renderSellCoinAmountInputForm()}
                <View style={styles.card_view}>
                    <View style={styles.title_header}>
                        <Text style={[styles.headText, stylesGlobal.font]}>SELL GOLD COINS</Text>
                    </View>
                    <View style = {{ flex: 1, width: '100%'}}>
                    {
                        this.state.is_portrait &&
                        <KeyboardAwareScrollView keyboardShouldPersistTaps = "handled" style = {{flex: 1, width: '100%', paddingTop: 20}}>
                            <View style = {{width: '100%', alignItems: 'center'}}>
                                <View style = {[stylesGlobal.credit_card_view, {flexDirection: 'row'}]}>
                                    <View style = {{width: '40%', height: '100%', alignItems: 'center', justifyContent: 'center'}}>
                                        <View style = {{height: '50%', aspectRatio: 1, marginTop: 15, marginBottom: 40}}>
                                            <Image style={{width: "100%", height: '100%', resizeMode: "contain"}} source={this.state.coin_image}/>
                                        </View>
                                    </View>
                                    <View style = {{width: '60%', height: '100%', justifyContent: 'center', zIndex: 10}}>
                                        <View style = {{width: '100%', marginTop: 20, }}>
                                            <Text style={[{fontSize: 14, color: Colors.gold}, stylesGlobal.font_bold]}>{"Your Virtual Wealth"}</Text>
                                        </View>
                                        <View style = {{flexDirection: 'row', alignItems: 'center', marginTop: 5}}>
                                            <Text style={[styles.normal_text, stylesGlobal.font_bold]}>Total Gold Coins: </Text>
                                            <NumberFormat value={this.state.my_gold_coins} displayType={'text'} thousandSeparator={true} renderText={value => <Text style = {[styles.normal_text, stylesGlobal.font]}>{value}</Text>}/>
                                            <Image style={{width: 20, height: 20, resizeMode: "contain", marginLeft: 5}} source={require("../icons/TurningCoin.gif")}/>
                                        </View>
                                        <View style = {{flexDirection: 'row', alignItems: 'center', marginTop: 5}}>
                                            <Text style={[styles.normal_text, stylesGlobal.font_bold]}>{"Total Value: "}</Text>
                                            <NumberFormat value={(this.state.my_gold_coins * this.state.price_per_coin).toFixed(2)} displayType={'text'} thousandSeparator={true} renderText={value => <Text style = {[styles.normal_text, stylesGlobal.font]}>{"$ " + value}</Text>}/>
                                        </View>

                                        <View style = {{width: '100%', height: '50%', justifyContent: 'center', alignItems: 'center'}}>
                                            <View style = {{width: '100%', height: 30, justifyContent: 'center', alignItems: 'center', flexDirection: 'row'}}>
                                                <TouchableOpacity style = {[styles.countButton, {borderTopLeftRadius: 5, borderBottomLeftRadius: 5}]} onPress = {() => this.minus_button()}>
                                                    <Text style={[{color:Colors.gold,fontSize:24,},stylesGlobal.font_bold]}>
                                                        - 
                                                    </Text>
                                                </TouchableOpacity>
                                                <View style = {styles.count_textview}>
                                                    <TextInput style = {[{fontSize: 12, color: Colors.black, width: '100%', textAlign: 'center'}, stylesGlobal.font]} keyboardType = {'number-pad'} 
                                                        onChangeText = {(text) => {
                                                            if(isNaN(parseInt(text, 10))) {
                                                                this.setState({
                                                                    sell_coin_count: 0,
                                                                    my_gold_coins: this.state.origin_my_gold_coins
                                                                })
                                                            } else {
                                                                if(parseInt(text, 10) > this.state.origin_my_gold_coins) {
                                                                    
                                                                } else {
                                                                    this.setState({
                                                                        sell_coin_count: parseInt(text, 10),
                                                                        my_gold_coins: this.state.origin_my_gold_coins - parseInt(text, 10),
                                                                    })
                                                                }
                                                            }
                                                        }}>
                                                        {this.state.sell_coin_count}
                                                    </TextInput>
                                                </View>
                                                <TouchableOpacity style = {[styles.countButton, {borderTopRightRadius: 5, borderBottomRightRadius: 5}]} onPress = {() => this.plus_button()}>
                                                    <Text style={[{color:Colors.gold,fontSize:24,},stylesGlobal.font_bold]}>
                                                        + 
                                                    </Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    </View>
                                </View>
                            </View>

                            <View style = {{width: '100%', paddingHorizontal: 10, marginTop: 10}}>
                                <View style = {{width: '100%', flexDirection: 'row', paddingBottom: 5, justifyContent: 'center', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: Colors.gold}}>
                                    <View style = {{width: '40%', justifyContent: 'center', alignItems: 'center'}}>
                                        <Text style = {[styles.normal_text, stylesGlobal.font_semibold]} multiline = {true}>Product</Text>
                                    </View>
                                    <View style = {{width: '20%',  justifyContent: 'center', alignItems: 'center'}}>
                                        <Text style = {[styles.normal_text, stylesGlobal.font_semibold]}>Quantity</Text>
                                    </View>
                                    <View style = {{width: '40%', justifyContent: 'center', alignItems: 'center'}}>
                                        <Text style = {[styles.normal_text, stylesGlobal.font_semibold]}>Subtotal</Text>
                                    </View>
                                    
                                </View>
                            </View>
                        {
                            this.state.sell_coin_count > 0 &&
                            <View style = {{width: '100%', flexDirection: 'row', paddingHorizontal: 10, paddingVertical: 5, justifyContent: 'center', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: Colors.gold}}>
                                <View style = {{width: '40%', justifyContent: 'center', alignItems: 'center'}}>
                                    <Text style = {[styles.normal_text, stylesGlobal.font]}>{"Gold Coins"}</Text>
                                </View>
                                <View style = {{width: '20%', justifyContent: 'center', alignItems: 'center'}}>
                                    <Text style = {[styles.normal_text, stylesGlobal.font]}>{this.state.sell_coin_count}</Text>
                                </View>
                                <View style = {{width: '30%', justifyContent: 'center', alignItems: 'flex-end'}}>
                                    <Text style = {[styles.normal_text, stylesGlobal.font]}>{"$ " + (this.state.sell_coin_count * this.state.price_per_coin).toFixed(2)}</Text>
                                </View>
                                <View style = {{width: '10%'}}>

                                </View>
                            </View>
                        }
                            <View style = {{width: '100%', flexDirection: 'row', marginTop: 10, marginBottom: 20}}>
                                <View style = {{flex: 1, justifyContent: 'flex-end', flexDirection: 'row', paddingHorizontal: 10}}>
                                    <Text style={[styles.normal_text, stylesGlobal.font_bold]}>{"Total: "}</Text>
                                    <NumberFormat value={(this.state.sell_coin_count * this.state.price_per_coin).toFixed(2)} displayType={'text'} thousandSeparator={true} renderText={value => <Text style = {[styles.normal_text, stylesGlobal.font]}>{"$ " + value}</Text>}/>
                                </View>
                                <View style = {{width: '10%'}}>

                                </View>
                            </View>
                        {
                            this.state.see_more_payment_option &&
                            <View style = {{width: '100%', alignItems: 'flex-end', paddingEnd: 50, marginBottom: 20}}>
                                <TouchableOpacity style={[styles.button_style, stylesGlobal.shadow_style]} 
                                    // 
                                    onPress = {() => this.handlePressRemeedAfterSelectingCard()}
                                    > 
                                    <Text style={[styles.button_text, stylesGlobal.font]}>
                                    Redeem
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        }
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
                                        {this.state.see_more_payment_option ? "See More Credit Options" : "See Less Credit Options"}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        }
                        {
                            !this.state.see_more_payment_option &&
                            <View style = {{width: '100%', alignItems: 'flex-end', paddingEnd: 50, marginBottom: 30}}>
                                <TouchableOpacity style={[styles.button_style, stylesGlobal.shadow_style]} 
                                //</View>onPress={()=> this.callSellCoinsAPI()} >
                                onPress = {() => this.handlePressRemeedAfterSelectingCard()}>
                                    <Text style={[styles.button_text, stylesGlobal.font]}>{'Redeem'}</Text>
                                </TouchableOpacity>
                            </View>
                        }
                            <View style = {{height: 40}}></View>
                        </KeyboardAwareScrollView>
                    }
                    {
                        !this.state.is_portrait &&
                        <View style = {{flex: 1, flexDirection: 'row'}}>
                            <ScrollView style = {{width: '50%', paddingVertical: 10}}>
                                <View style = {{width: '100%', alignItems: 'center'}}>
                                    <View style = {[stylesGlobal.credit_card_view, {flexDirection: 'row'}]}>
                                        <View style = {{width: '40%', height: '100%', alignItems: 'center', justifyContent: 'center'}}>
                                            <View style = {{height: '50%', aspectRatio: 1, marginTop: 15, marginBottom: 40}}>
                                                <Image style={{width: "100%", height: '100%', resizeMode: "contain"}} source={this.state.coin_image}/>
                                            </View>
                                        </View>
                                        <View style = {{width: '60%', height: '100%', justifyContent: 'center', zIndex: 10}}>
                                            <View style = {{width: '100%', marginTop: 20, }}>
                                                <Text style={[{fontSize: 14, color: Colors.gold}, stylesGlobal.font_bold]}>{"Your Virtual Wealth"}</Text>
                                            </View>
                                            <View style = {{flexDirection: 'row', alignItems: 'center', marginTop: 5}}>
                                                <Text style={[styles.normal_text, stylesGlobal.font_bold]}>Total Gold Coins: </Text>
                                                <NumberFormat value={this.state.my_gold_coins} displayType={'text'} thousandSeparator={true} renderText={value => <Text style = {[styles.normal_text, stylesGlobal.font]}>{value}</Text>}/>
                                                <Image style={{width: 20, height: 20, resizeMode: "contain", marginLeft: 5}} source={require("../icons/TurningCoin.gif")}/>
                                            </View>
                                            <View style = {{flexDirection: 'row', alignItems: 'center', marginTop: 5}}>
                                                <Text style={[styles.normal_text, stylesGlobal.font_bold]}>{"Total Value: "}</Text>
                                                <NumberFormat value={(this.state.my_gold_coins * this.state.price_per_coin).toFixed(2)} displayType={'text'} thousandSeparator={true} renderText={value => <Text style = {[styles.normal_text, stylesGlobal.font]}>{"$ " + value}</Text>}/>
                                            </View>

                                            <View style = {{width: '100%', height: '50%', justifyContent: 'center', alignItems: 'center'}}>
                                                <View style = {{width: '100%', height: 30, justifyContent: 'center', alignItems: 'center', flexDirection: 'row'}}>
                                                    <TouchableOpacity style = {[styles.countButton, {borderTopLeftRadius: 5, borderBottomLeftRadius: 5}]} onPress = {() => this.minus_button()}>
                                                        <Text style={[{color:Colors.gold,fontSize:24,},stylesGlobal.font_bold]}>
                                                            - 
                                                        </Text>
                                                    </TouchableOpacity>
                                                    <View style = {styles.count_textview}>
                                                        <TextInput style = {[{fontSize: 12, color: Colors.black, width: '100%', textAlign: 'center'}, stylesGlobal.font]} keyboardType = {'number-pad'} 
                                                            onChangeText = {(text) => {
                                                                if(isNaN(parseInt(text, 10))) {
                                                                    this.setState({
                                                                        sell_coin_count: 0,
                                                                        my_gold_coins: this.state.origin_my_gold_coins
                                                                    })
                                                                } else {
                                                                    if(parseInt(text, 10) > this.state.origin_my_gold_coins) {
                                                                        
                                                                    } else {
                                                                        this.setState({
                                                                            sell_coin_count: parseInt(text, 10),
                                                                            my_gold_coins: this.state.origin_my_gold_coins - parseInt(text, 10),
                                                                        })
                                                                    }
                                                                }
                                                            }}>
                                                            {this.state.sell_coin_count}
                                                        </TextInput>
                                                    </View>
                                                    <TouchableOpacity style = {[styles.countButton, {borderTopRightRadius: 5, borderBottomRightRadius: 5}]} onPress = {() => this.plus_button()}>
                                                        <Text style={[{color:Colors.gold,fontSize:24,},stylesGlobal.font_bold]}>
                                                            + 
                                                        </Text>
                                                    </TouchableOpacity>
                                                </View>
                                            </View>
                                        </View>
                                    </View>
                                </View>
                            </ScrollView>
                            <View style = {{width: '50%'}}>
                                <KeyboardAwareScrollView keyboardShouldPersistTaps = "handled" style = {{flex: 1, width: '100%', paddingTop: 20}} extraHeight = {50}>
                                    <View style = {{width: '100%', paddingHorizontal: 10, marginTop: 10}}>
                                        <View style = {{width: '100%', flexDirection: 'row', paddingBottom: 5, justifyContent: 'center', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: Colors.gold}}>
                                            <View style = {{width: '40%', justifyContent: 'center', alignItems: 'center'}}>
                                                <Text style = {[styles.normal_text, stylesGlobal.font_semibold]} multiline = {true}>Product</Text>
                                            </View>
                                            <View style = {{width: '20%',  justifyContent: 'center', alignItems: 'center'}}>
                                                <Text style = {[styles.normal_text, stylesGlobal.font_semibold]}>Quantity</Text>
                                            </View>
                                            <View style = {{width: '40%', justifyContent: 'center', alignItems: 'center'}}>
                                                <Text style = {[styles.normal_text, stylesGlobal.font_semibold]}>Subtotal</Text>
                                            </View>
                                            
                                        </View>
                                    </View>
                                {
                                    this.state.sell_coin_count > 0 &&
                                    <View style = {{width: '100%', flexDirection: 'row', paddingHorizontal: 10, paddingVertical: 5, justifyContent: 'center', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: Colors.gold}}>
                                        <View style = {{width: '40%', justifyContent: 'center', alignItems: 'center'}}>
                                            <Text style = {[styles.normal_text, stylesGlobal.font]}>{"Gold Coins"}</Text>
                                        </View>
                                        <View style = {{width: '20%', justifyContent: 'center', alignItems: 'center'}}>
                                            <Text style = {[styles.normal_text, stylesGlobal.font]}>{this.state.sell_coin_count}</Text>
                                        </View>
                                        <View style = {{width: '30%', justifyContent: 'center', alignItems: 'flex-end'}}>
                                            <Text style = {[styles.normal_text, stylesGlobal.font]}>{"$ " + (this.state.sell_coin_count * this.state.price_per_coin).toFixed(2)}</Text>
                                        </View>
                                        <View style = {{width: '10%'}}>

                                        </View>
                                    </View>
                                }
                                    <View style = {{width: '100%', flexDirection: 'row', marginTop: 10, marginBottom: 20}}>
                                        <View style = {{flex: 1, justifyContent: 'flex-end', flexDirection: 'row', paddingHorizontal: 10}}>
                                            <Text style={[styles.normal_text, stylesGlobal.font_bold]}>{"Total: "}</Text>
                                            <NumberFormat value={(this.state.sell_coin_count * this.state.price_per_coin).toFixed(2)} displayType={'text'} thousandSeparator={true} renderText={value => <Text style = {[styles.normal_text, stylesGlobal.font]}>{"$ " + value}</Text>}/>
                                        </View>
                                        <View style = {{width: '10%'}}>

                                        </View>
                                    </View>
                                {
                                    this.state.see_more_payment_option &&
                                    <View style = {{width: '100%', alignItems: 'flex-end', paddingEnd: 50, marginBottom: 20}}>
                                        <TouchableOpacity style={[styles.button_style, stylesGlobal.shadow_style]}
                                        //</View> onPress={()=> this.callSellCoinsAPI()} >
                                        onPress = {() => this.handlePressRemeedAfterSelectingCard()}>
                                            <Text style={[styles.button_text, stylesGlobal.font]}>
                                            Redeem
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                }
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
                                                {this.state.see_more_payment_option ? "See More Credit Options" : "See Less Credit Options"}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                }
                                {
                                    !this.state.see_more_payment_option &&
                                    <View style = {{width: '100%', alignItems: 'flex-end', paddingEnd: 50, marginBottom: 30}}>
                                        <TouchableOpacity style={[styles.button_style, stylesGlobal.shadow_style]} 
                                        //</View>onPress={()=> this.callSellCoinsAPI()} >
                                        onPress = {() => this.handlePressRemeedAfterSelectingCard()}>
                                            <Text style={[styles.button_text, stylesGlobal.font]}>{'Redeem'}</Text>
                                        </TouchableOpacity>
                                    </View>
                                }
                                    <View style = {{height: 40}}></View>
                                </KeyboardAwareScrollView>
                            </View>
                        </View>
                    }
                    </View>
                </View>
           </ SafeAreaView>
        );
        
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: "100%",
        height: "100%",
        backgroundColor: Colors.black,
        alignItems : 'center', 
        justifyContent: 'center'
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
    },
    count_textview: {
        width: '50%', 
        height: '100%', 
        borderBottomWidth: 1, 
        borderBottomColor: Colors.gold, 
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.lightGray
    },
    button_style: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        backgroundColor:Colors.gold, 
        justifyContent:'center', 
        alignItems:'center', 
        borderRadius:5
    },
    button_text: {
        color: Colors.white, 
        fontSize:14
    },
    action_button: {
        // width: 60, 
        height: 50, 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        marginRight: 10,
        marginTop: 5
    },
    action_button_text: {
        color: Colors.black, 
        fontSize: 12
    },
    new_card_input_title_text: {
        color:Colors.black, 
        fontSize:14
    },
    expiry_text: {
        width:'100%', 
        borderWidth:.5,
        paddingLeft:5,
        height:'100%',
        borderRadius:5
    }
});