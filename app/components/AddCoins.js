import React, { Component } from "react";
import {
    Platform,
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    Image,
    SafeAreaView,
    Dimensions,
    Alert,
    TextInput,
    Linking,
    ScrollView,
    Modal
} from "react-native";

import AutoComplete from 'react-native-autocomplete-input'
import { WebView } from 'react-native-webview'
import { EventRegister } from 'react-native-event-listeners'
import * as Global from "../consts/Global";
import { Colors } from "../consts/Colors";
import { Constants } from "../consts/Constants";
import WebService from "../core/WebService";
import ProgressIndicator from "./ProgressIndicator";
import { stylesGlobal } from '../consts/StyleSheet';
import Memory from '../core/Memory'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { ApplePayButton, PaymentRequest } from 'react-native-payments';
var card_valid_check = require('card-validator');
const base64 = require('base-64');
import AsyncStorage from '@react-native-community/async-storage';
import NumberFormat from 'react-number-format';
import AsyncAlert from './AsyncAlert';

import AutoCompleteInput from './AutoCompleteInput'


var TAG = "AddCoin Screen";
export default class AddCoin extends React.Component {

    constructor(props) {

        super(props)

        this.state = {
            userId: "",
            userToken: "",
            planList: [],

            total_price: 0,
            total_price_length: 0, // total price string length

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
            showSpins: false,
            shownSpin: true,
            didPaypalPayment: false,
            cardNumbers: []
        }

        this.onEndReachedCalledDuringMomentum = true;
    }

    UNSAFE_componentWillMount() {
        this.getData();
        this.addCardListener = EventRegister.addEventListener(Constants.EVENT_ADD_CREDIT_CARD, () => {
            this.getCardDetails();
        })

        if (Dimensions.get("window").width < Dimensions.get("window").height) {
            this.setState({
                is_portrait: true,
            })
        } else {
            this.setState({
                is_portrait: false,
            })
        }

        Dimensions.addEventListener("change", () => {
            if (Dimensions.get("window").width < Dimensions.get("window").height) {
                this.setState({
                    is_portrait: true,
                })
            } else {
                this.setState({
                    is_portrait: false,
                })
            }
        });



    }

    componentWillUnmount() {
        EventRegister.removeEventListener(this.addCardListener);
        Dimensions.removeEventListener('change');
    }

    getDataAgain = () => {
        this.getData();
    }

    getData = async () => {
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
        }

    };

    getPlanList = async () => {
        try {

            let uri = Memory().env == "LIVE" ? Global.BASE_URL + 'list-plans' : Global.BASE_URL_DEV + 'list-plans'
            let params = new FormData();
            params.append("user_id", this.state.userId);
            params.append("token", this.state.userToken);
            params.append("format", "json");

            console.log(TAG + " callGETPLANLISTAPI uri " + uri);
            console.log(TAG + " callGETPLANLISTAPI params " + JSON.stringify(params));

            WebService.callServicePost(uri, params, this.handlePlanListResponse);
        } catch (e) {

        }
    }

    handlePlanListResponse = (response, isError) => {
        console.log(TAG + " callGETPLANLISTAPI result " + JSON.stringify(response));
        if (!isError) {
            if (response.status == 'success') {
                var planList = response.data;
                planList.sort((a, b) => parseInt(a.price, 10) - parseInt(b.price, 10));
                for (i = 0; i < planList.length; i++) {
                    if (planList[i].plan_name == "Chest of Coins") {
                        planList[i].image = require('../icons/goldCoin10000New.png');
                        // planList[i].strip = require('../icons/mark_chest.png');
                    } else if (planList[i].plan_name == "Sack of Coins") {
                        planList[i].image = require('../icons/goldCoin1000New.png');
                        // planList[i].strip = require('../icons/mark_sack.png');
                    } else if (planList[i].plan_name == "Handful of Coins") {
                        planList[i].image = require('../icons/goldCoin10New.png');
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
                    Alert.alert(response.msg, "");
                }else{
                    Alert.alert(Constants.UNKNOWN_MSG, "");
                    //UNKNOWN_MSG
                }
                
            }
            
        } else {
            Alert.alert(response.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
        }
    }
        

    getCardDetails = async () => {

        try {
            this.setState({
                loading: true
            });

            let uri = Memory().env == "LIVE" ? Global.URL_GET_SAVEDCARDS : Global.URL_GET_SAVEDCARDS_DEV;
            let params = new FormData();
            params.append("format", "json");
            params.append("user_id", this.state.userId);
            params.append("token", this.state.userToken);

            console.log(TAG + " callCardsList uri " + uri);
            console.log(TAG + " callCardsList params " + JSON.stringify(params));
            WebService.callServicePost(uri, params, this.handleGetSavedCardsResponse);
        } catch (error) {
            this.setState({
                loading: false,
            });
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    }

    handleGetSavedCardsResponse = (response, isError) => {

        console.log(TAG + " callCardsList response " + JSON.stringify(response));
        console.log(TAG + " callCardsList error " + JSON.stringify(isError));
        try {
            if (!isError) {
                if (response != undefined && response != null) {
                    if (response.status == "success") {
                        if (response.data != null) {
                            if (this.state.cards_list.length == 0) {
                                var default_card_index = -1;
                                for (i = 0; i < response.data.length; i++) {
                                    response.data[i].saved_card_index = true;
                                    if (response.data[i].default == true) {
                                        default_card_index = i;
                                    }
                                }
                                if (default_card_index != -1) {
                                    var default_card = response.data[default_card_index];
                                    response.data.splice(default_card_index, 1);
                                    response.data.unshift(default_card)
                                }

                                response.data.push({
                                    new_card_index: true
                                });

                                response.data.push({
                                    amazon_pay_index: true
                                });
                                response.data.push({
                                    paypal_pay_index: true
                                });
                                if (Platform.OS == "ios") {
                                    response.data.push({
                                        apple_pay_index: true
                                    });
                                } else if (Platform.OS == "android") {
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
                                console.log(TAG, 'cardNumbers', tmpCardNumbers);
                            
                            } else {
                                var ii = 0;
                                for (var i = 0; i < this.state.cards_list.length; i++) {
                                    ii = 0;
                                    while (ii < response.data.length) {
                                        response.data[ii].saved_card_index = true;
                                        if (this.state.cards_list[i].paymentProfileId == response.data[ii].paymentProfileId) {
                                            response.data.splice(ii, 1);
                                            break;
                                        } else {
                                            ii++;
                                        }
                                    }
                                }
                                this.setState({
                                    cards_list: [...response.data, ...this.state.cards_list],

                                });

                                var tmpCardList = [...response.data, ...this.state.cards_list];
                                
                                
                                var tmpCardNumbers = [];
                                tmpCardList.forEach(item => {
                                    if(item.cardNumber)
                                    tmpCardNumbers.push(item.cardNumber);
                                });

                                this.setState({
                                    cardNumbers: tmpCardNumbers
                                });
                                console.log(TAG, 'cardNumbers', tmpCardNumbers);
                            }
                            if (response.data.length == 0) {
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
        } catch (error) {
            console.log(error)
        }
        this.setState({
            loading: false,
        });
    }

    minus_button = (index) => {
        var planList = this.state.planList;
        if (planList[index].goldcoinpack_count != 0) {
            planList[index].goldcoinpack_count = planList[index].goldcoinpack_count - 1;
            if (planList[index].goldcoinpack_count == 0) {
                planList[index].total_str = "";
            } else {
                planList[index].total_str = (planList[index].goldcoinpack_count * planList[index].gold_coins_number).toString() + " $" + (Math.round(planList[index].goldcoinpack_count * planList[index].price_float * 100) / 100).toString();
            }

            this.setState({
                planList: planList,
                total_price: this.state.total_price - planList[index].price_float,
                total_price_length: (this.state.total_price - planList[index].price_float).toFixed(2).length
            })
        }
    }

    plus_button = (index) => {
        var planList = this.state.planList;
        planList[index].goldcoinpack_count = planList[index].goldcoinpack_count + 1;
        planList[index].total_str = (planList[index].goldcoinpack_count * planList[index].gold_coins_number).toString() + " $" + (Math.round(planList[index].goldcoinpack_count * planList[index].price_float * 100) / 100).toString();

        this.setState({
            planList: planList,
            total_price: this.state.total_price + planList[index].price_float,
            total_price_length: (this.state.total_price + planList[index].price_float).toFixed(2).length

        })
    }

    setPlanList = data => {
        // setTimeout(() => this.setState(data), 200);
        this.setState(data);
        console.log("this is from card screen");
    }

    removeCoinpack = (index) => {
        var planList = this.state.planList;
        var total_price = 0;
        planList[index].goldcoinpack_count = 0;
        for (i = 0; i < planList.length; i++) {
            total_price = total_price + Math.round(planList[i].goldcoinpack_count * planList[i].price_float * 100) / 100;
            if (i == index) {
                planList[i].total_str = "";
            }
        }

        this.setState({
            planList: planList,
            total_price: total_price,
            total_price_length: total_price.toFixed(2).length
        })
    }

    onChangeCardNumberText(text) {
        this.setState({ card_number: text });

        var card_valid_data = card_valid_check.number(text);
        // console.log(text + "    " + JSON.stringify(card_valid_data))
        if (card_valid_data.card != null) {
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

    getPayPalAuth = async () => {
        var uri = Memory().env == "LIVE" ? Global.PAYPAL_API + "v1/oauth2/token" : Global.PAYPAL_API_SANDBOX + "v1/oauth2/token";
        var client_id = Memory().env == "LIVE" ? Global.PAYPAL_CLIENTID : Global.PAYPAL_CLIENTID_SANDBOX;
        var secret_key = Memory().env == "LIVE" ? Global.PAYPAL_SECRETEKEY : Global.PAYPAL_SECRETEKEY_SANDBOX;

        let params = new URLSearchParams();
        params.append("grant_type", "client_credentials");

        await fetch(uri, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + base64.encode(client_id + ":" + secret_key)
            },
            body: params.toString()
        })
            .then(response => response.json())
            .then(async data => {
                if (data.access_token) {
                    this.setState({
                        paypal_access_token: data.access_token
                    })
                } else {
                    this.setState({
                        loading: false,
                        paypal_pay_error: true
                    });
                }
            })
            .catch((error) => {
                this.setState({
                    loading: false,
                    paypal_pay_error: true
                });
                if(error.message == Constants.ERROR_NETWORK_REQUEST_FAILED)
                    Alert.alert("Warning", Constants.NO_INTERNET2);
                else
                    Alert.alert("Warning!", error.message);
            });
    }

    getPayPalapprovalUrl = async () => {

        var trans_detail = {
            "intent": "sale",
            "payer": {
                "payment_method": "paypal"
            },
            "transactions": [{
                "amount": {
                    "total": this.state.total_price.toString(),
                    "currency": "USD",
                    "details": {
                        "subtotal": this.state.total_price.toString(),
                        "tax": "0",
                        "shipping": "0",
                        "handling_fee": "0",
                        "shipping_discount": "0",
                        "insurance": "0"
                    }
                }

            }],
            "redirect_urls": {
                "return_url": Global.PAYPAL_REDIRECT_URL,
                "cancel_url": Global.PAYPAL_REDIRECT_URL
            }
        }

        var uri = Memory().env == "LIVE" ? Global.PAYPAL_API + "v1/payments/payment" : Global.PAYPAL_API_SANDBOX + "v1/payments/payment";

        await fetch(uri, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + this.state.paypal_access_token
            },
            body: JSON.stringify(trans_detail)
        })
            .then(response => response.json())
            .then(async data => {

                console.log(TAG, 'payment_api_result', JSON.stringify(data))
                if (data.id) {
                    this.setState({
                        paypal_transaction_id: data.id,

                    })
                    if (data.links && data.links.length > 0) {
                        for (i = 0; i < data.links.length; i++) {
                            if (data.links[i].method == "REDIRECT") {
                                this.setState({
                                    paypal_redirection_link: data.links[i].href,
                                })
                            }
                            if (data.links[i].method == "POST") {
                                this.setState({
                                    paypal_post_run_link: data.links[i].href,
                                })
                            }
                        }
                    }
                } else {
                    this.setState({
                        loading: false,
                        paypal_pay_error: true
                    });
                    Alert.alert("Warning!", Constants.PAYMENT_ERROR);
                }
            })
            .catch((error) => {
                this.setState({
                    loading: false,
                    paypal_pay_error: true
                });
                Alert.alert("Warning!", error.message);
            });
    }

    handleOpenURL = async (url) => {

        console.log(JSON.stringify(url));
        var regex = /[?&]([^=#]+)=([^&#]*)/g,
            params = {},
            match;
        while (match = regex.exec(url.url)) {
            params[match[1]] = match[2];
        }

        if (params.paymentId == null) {
            Alert.alert("Transaction is cancelled", "");
            return;
        }

        this.setState({
            loading: true,
        });

        var uri = Memory().env == "LIVE" ? Global.PAYPAL_API + "v1/payments/payment/" + params.paymentId + "/execute" : Global.PAYPAL_API_SANDBOX + "v1/payments/payment/" + params.paymentId + "/execute";

        await fetch(uri, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + this.state.paypal_access_token
            },
            body: JSON.stringify({
                payer_id: params.PayerID
            })
        })
            .then(response => response.json())
            .then(async data => {

                if (data.state == "approved") {
                    Alert.alert("Congratulations!", "Your transaction is done successfully.");
                } else {
                    Alert.alert("Warning!", Constants.PAYMENT_ERROR);
                }
            })
            .catch((error) => {
                Alert.alert("Warning!", error);
            });

        this.setState({
            loading: false,
        });
    }


    paypal_pay2 = async () => {
        if (this.state.total_price == 0) {
            Alert.alert(Constants.SELECT_COINS, "");
            return;
        }
        this.setState({ showPaypalWebView: true });
    }

    paypal_pay = async () => {
        if (this.state.total_price == 0) {
            Alert.alert(Constants.SELECT_COINS, "");
            return;
        }
        this.setState({
            loading: true,
        });

        await this.getPayPalAuth();
        if (!this.state.paypal_pay_error) {
            await this.getPayPalapprovalUrl();
        }
        if (!this.state.paypal_pay_error) {
            const canOpen = await Linking.canOpenURL(this.state.paypal_redirection_link);
            if (canOpen) {
                this.setState({
                    linking_type: "paypal"
                })
                Linking.openURL(this.state.paypal_redirection_link);
            }
        }

        this.setState({
            loading: false,
        });
    }

    apple_pay = async () => {
        if (this.state.total_price == 0) {
            Alert.alert(Constants.SELECT_COINS, "");
            return;
        }
        const METHOD_DATA = [{
            supportedMethods: ['apple-pay'],
            data: {
                merchantIdentifier: 'merchant.com.007percent.007ApplePay',
                supportedNetworks: ['visa', 'mastercard', 'amex'],
                countryCode: 'US',
                currencyCode: 'USD'
            }
        }];

        var DETAILS = {};
        var displayItems = [];
        for (i = 0; i < this.state.planList.length; i++) {
            if (this.state.planList[i].goldcoinpack_count > 0) {
                displayItems.push({
                    label: this.state.planList[i].plan_name,
                    amount: { currency: 'USD', value: (Math.round(this.state.planList[i].goldcoinpack_count * this.state.planList[i].price_float * 100) / 100).toString() }
                })
            }
        }
        DETAILS = {
            id: 'goldcoin-buy',
            displayItems: displayItems,

            // shippingOptions: [{
            //   id: 'economy',
            //   label: 'Economy Shipping',
            //   amount: { currency: 'USD', value: '0.00' },
            //   detail: 'Arrives in 3-5 days' // `detail` is specific to React Native Payments
            // }],
            total: {
                label: 'all',
                amount: { currency: 'USD', value: this.state.total_price.toString() }
            }
        };
        // if(this.state.buy_type == "goldcoin") {

        // } else if(this.state.buy_type == "upgrade_member_plan") {

        // }

        const OPTIONS = {
            // requestPayerName: true,
            // requestPayerPhone: false,
            // requestPayerEmail: false,
            // requestShipping: false
        };
        const paymentRequest = new PaymentRequest(METHOD_DATA, DETAILS);
        paymentRequest.onshippingaddresschange = ev => ev.updateWith(DETAILS);
        paymentRequest.onshippingoptionchange = ev => ev.updateWith(DETAILS);


        paymentRequest.canMakePayments().then(async (canMakePayment) => {
            if (canMakePayment) {
                console.log('Can Make Payment')
                const paymentResponse = await paymentRequest.show();
                paymentResponse.complete('success');
                //   .then(paymentResponse => {
                //     // Your payment processing code goes here
                //     console.log(JSON.stringify(paymentResponse))
                //     paymentResponse.complete('success');
                //   })
                //   .catch(error => {
                //     paymentResponse.complete('fail');
                //     alert(error)
                //       console.log("first:" + error)
                //   });
                console.log(JSON.stringify(paymentResponse))
            } else {
                Alert.alert(
                    'Apple Pay',
                    'Apple Pay is not available in this device'
                );
            }
        })
            .catch(error => {
                console.log("second" + error)

            })
    }

    purchaseWithNewCard = async () => {
        if (this.state.card_number.length < 12 || this.state.card_number.length > 19) {
            Alert.alert(Constants.INVALID_CARD_NUMBER, "");
            return;
        }
        var card_valid_data = card_valid_check.number(this.state.card_number);

        if (!card_valid_data.isValid) {
            Alert.alert(Constants.INVALID_CARD_NUMBER, "");
            return;
        }
        if (this.state.card_holder_first_name == "") {
            Alert.alert(Constants.EMPTY_CARDHOLDER_FIRSTNAME, "");
            return;
        }
        // if (this.state.card_holder_last_name == "") {
        //     Alert.alert(Constants.EMPTY_CARDHOLDER_LASTNAME, "");
        //     return;
        // }
        if (this.state.card_expiry_month == "") {
            Alert.alert(Constants.EMPTY_CARDEXPIRATION_MONTH, "");
            return;
        }
        if (this.state.card_expiry_year.length < 2) {
            Alert.alert(Constants.EMPTY_CARDEXPIRATION_YEAR, "");
            return;
        }
        if (this.state.card_type == "american-express") {
            if (this.state.card_cvv.length != 4) {
                Alert.alert(Constants.INVALID_AMERICAN_CVV + "sdfsdf", "");
                return;
            }
        } else {
            if (this.state.card_cvv.length != 3) {
                Alert.alert(Constants.INVALID_CVV, "");
                return;
            }
        }

        //this.purchaseGoldCoin("new_card");
        this.purchaseGoldCoinPaypal("new_card")
    }

    purchaseGoldCoinPaypal(pay_type) {
        try {


            let uri = Memory().env == "LIVE" ? Global.URL_PURCHASE_GOLDCOIN_PAYPAL : Global.URL_PURCHASE_GOLDCOIN_PAYPAL_DEV;
            console.log("purchaseGoldCoinPaypal:::222222222" + uri)
            let params = new FormData();
            params.append("format", "json");
            params.append("user_id", this.state.userId);
            params.append("token", this.state.userToken);
            let gold_coins_amount = 0;
            let planList = this.state.planList
            for (i = 0; i < planList.length; i++) {
                gold_coins_amount = gold_coins_amount + planList[i].gold_coins_number * planList[i].goldcoinpack_count;
            }

            let names = this.state.card_holder_first_name.split(' ');

            let save_data = {
                card_number: this.state.card_number,
                card_type: "Visa",
                card_first_name: names[0],
                card_holder_last_name: names[1],
                card_expiry_month: this.state.card_expiry_month,
                card_expiry_year: this.state.card_expiry_year,
                gold_coins: gold_coins_amount.toString(),
                card_cvv: this.state.card_cvv
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
                        name: this.state.card_holder_first_name
                    }
                }
            }
            console.log("purchaseGoldCoinPaypal:::222222222", JSON.stringify(save_data), JSON.stringify(send_data))
            params.append("save_data", JSON.stringify(save_data));
            params.append("send_data", JSON.stringify(send_data));
            console.log("purchaseGoldCoinPaypal:::222222222", JSON.stringify(save_data), JSON.stringify(params))
            WebService.callServicePost(uri, params, this.handlepurchaseGoldCoinResponse);
            this.setState({
                loading: true
            });
        } catch (e) {
            console.log("purchaseGoldCoin error : ", e);
        }

    }

    handlepurchaseGoldCoinResponse = async (response, isError) => {
        console.log("handlepurchaseGoldCoinResponse:::222222222" + JSON.stringify(response))
        if (response != null && response.status) {
            if (response.status == "success") {
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

            else if (response.status == "COMPLETED") {
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

                await AsyncAlert('Pay Success', '');
                EventRegister.emit(Constants.EVENT_PROFILE_GOLDCOIN_UPDATED, '');


            }
            else {
                Alert.alert(response.error.toString().toUpperCase(), response.error_description);
            }

        }

        this.setState({
            loading: false
        });
    }


    purchaseWithSavedCard(item) {
        if (item.default != true) {
            return;
        }
        if (this.state.selected_card_cvv.length < 3) {
            Alert.alert(Constants.INVALID_CVV, "");
        }
        this.purchaseGoldCoin("saved_card");
    }

    purchaseGoldCoin(pay_type) {
        try {
            this.setState({
                loading: true
            });
            let uri = Memory().env == "LIVE" ? Global.URL_PURCHASE_GOLDCOIN : Global.URL_PURCHASE_GOLDCOIN_DEV;

            let params = new FormData();
            params.append("format", "json");
            params.append("user_id", this.state.userId);
            params.append("token", this.state.userToken);
            var buy_count_array = [];
            for (i = 0; i < this.state.buy_count_array.length; i++) {
                buy_count_array.push(this.state.buy_count_array[i].toString());
            }
            params.append("textinput", JSON.stringify([this.state.buy_id_array, buy_count_array]));
            if (pay_type == "saved_card") {
                params.append("card_status", 'saved');
                params.append("cvv", this.state.selected_card_cvv);
                params.append("hdn_goldcoins_planid", this.state.buy_id_array[0]);
                for (i = 0; i < this.state.cards_list.length; i++) {
                    if (this.state.cards_list[i].default == true) {
                        params.append("payment_id", this.state.cards_list[i].paymentProfileId);
                        break;
                    }
                }
            } else if (pay_type == "new_card") {

                let names = this.state.card_holder_first_name.split(' ');
                params.append("card_status", 'new');
                params.append("cvv", this.state.card_cvv);
                params.append("hdn_goldcoins_planid", this.state.buy_id_array[0]);
                params.append("card_number", this.state.card_number);
                params.append("card_first_name", names[0]);
                params.append("card_last_name", names[1]);
                params.append("expiry_month", this.state.card_expiry_month);
                params.append("expiry_year", this.state.card_expiry_year);
            }

            console.log("url: " + uri);
            console.log("parameter: " + JSON.stringify(params));

            WebService.callServicePost(uri, params, this.handlepurchaseGoldCoinResponse);

        } catch (e) {
            this.setState({
                loading: false
            });
        }
    }

    deleteCardConfirm() {
        Alert.alert(
            'Please Confirm',
            'Do you want to delete this card?',
            [
                { text: 'Cancel', onPress: () => console.log('Ask me later pressed') },
                { text: 'OK', onPress: () => this.deleteCard() },
            ],
            { cancelable: false },
        );
    }

    deleteCard = async (item) => {
        this.setState({
            loading: true,
            selected_card: item
        });
        try {

            let uri = Memory().env == "LIVE" ? Global.URL_GET_DELETE_CARD : Global.URL_GET_DELETE_CARD_DEV;
            let params = new FormData();
            params.append("format", "json");
            params.append("user_id", this.state.userId);
            params.append("api_token", this.state.userToken);
            params.append("payment_id", item.paymentProfileId);
            console.log(TAG + " callDeleteCardAPIs uri " + uri);
            console.log("TAG + callDeleteCardAPIs params>>>" + JSON.stringify(params));
            WebService.callServicePost(uri, params, this.handleDeleteCardResponse);
        } catch (e) {
            this.setState({
                loading: false
            });
            console.log(error)
        }
    }

    handleDeleteCardResponse = async (response, isError) => {
        console.log(TAG + " callDeleteCardAPIs Response " + JSON.stringify(response));
        console.log(TAG + " callDeleteCardAPIs isError " + isError);

        if (!isError) {
            var result = response;
            if (result != undefined && result != null) {
                if (result.status.toUpperCase() == "success".toUpperCase()) {
                    Alert.alert("Card removed successfully.", "");
                    var cards_list = this.state.cards_list;
                    for (i = 0; i < cards_list.length; i++) {
                        if (cards_list[i].paymentProfileId == this.state.selected_card.paymentProfileId) {
                            cards_list.slice(i, 1);
                            break;
                        }
                    }
                    this.setState({
                        selected_card: null,
                        cards_list: cards_list,
                        selected_card_cvv: "",
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

    setDefaultCard = async (item) => {

        var cards_list = this.state.cards_list;
        for (var i = 0; i < cards_list.length; i++) {
            if (item.amazon_pay_index == true && cards_list[i].amazon_pay_index == true) {
                cards_list[i].default = true;
            } else if (item.paypal_pay_index == true && cards_list[i].paypal_pay_index == true) {
                cards_list[i].default = true;
            } else if (item.apple_pay_index == true && cards_list[i].apple_pay_index == true) {
                cards_list[i].default = true;
            } else if (item.google_pay_index == true && cards_list[i].google_pay_index == true) {
                cards_list[i].default = true;
            } else if (item.saved_card_index == true && cards_list[i].saved_card_index == true) {
                if (cards_list[i].paymentProfileId == item.paymentProfileId) {
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

    handleSetDefaultCardResponse = async (response, isError) => {
        console.log(TAG + " callSetDefaultCardAPIs Response " + JSON.stringify(response));
        console.log(TAG + " callSetDefaultCardAPIs isError " + isError);

        if (!isError) {
            var result = response;
            if (result != undefined && result != null) {
                if (result.status.toUpperCase() == "success".toUpperCase()) {
                    var cards_list = this.state.cards_list;
                    for (i = 0; i < cards_list.length; i++) {
                        if (cards_list[i].paymentProfileId == this.state.selected_card.paymentProfileId) {
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


        if (this.state.total_price == 0) {
            Alert.alert(Constants.SELECT_COINS, "");
            return;
        }
        var selected_card = null;
        for (var i = 0; i < this.state.cards_list.length; i++) {
            if (this.state.cards_list[i].default) {
                selected_card = this.state.cards_list[i]
                break;
            }
        }
        if (selected_card == null) {

            this.purchaseWithNewCard();
            return;
        }
        if (selected_card.saved_card_index && (selected_card.cvv == null || selected_card.cvv == "")) {
            Alert.alert(Constants.NO_CVV_CODE, "");
            return;
        }

        if (selected_card.amazon_pay_index == true) { //  amozone pay
            console.log("amazone pay");
            Alert.alert("We are getting ready for this request", "");
        } else if (selected_card.paypal_pay_index == true) { // paypal pay 
            console.log("paypal pay");
            // this.paypal_pay();
            this.paypal_pay2();

        } else if (selected_card.apple_pay_index == true) { // apple pay
            console.log("apple pay");
            // this.apple_pay();
            Alert.alert("We are getting ready for this request", "");
        } else if (selected_card.google_pay_index == true) { // google pay
            console.log("google pay");
            Alert.alert("We are getting ready for this request", "");
        } else if (selected_card.saved_card_index == true) { // saved credit card
            console.log("saved card pay");
            this.purchaseWithSavedCard();
        } else {
            this.purchaseWithNewCard();
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

    handleResponseUpdateGoldCoins = (response, isError) => {

    }
    sufixProcessForPaypalResponse = async () => {
        await AsyncAlert('Pay Success', '');
        let gold_coins_amount = 0;
        let planList = this.state.planList;
        let prevGolds = 0;
        gold_coins_amount = parseFloat(prevGolds)
        for (i = 0; i < planList.length; i++) {
            gold_coins_amount = gold_coins_amount + planList[i].gold_coins_number * planList[i].goldcoinpack_count;
        }
        var uri = Memory().env == "LIVE" ? Global.URL_UPDATE_GOLD_COINS : Global.URL_UPDATE_GOLD_COINS_DEV;

        let params = new FormData();
        params.append("token", this.state.userToken);
        params.append("user_id", this.state.userId);
        params.append("coins", gold_coins_amount);
        params.append("format", "json");
        console.log(TAG, 'uri = ', uri);
        console.log(TAG, 'params = ', params);
        WebService.callServicePost(uri, params, this.handleUpdateCoinReponse);


        //

    }

    handleUpdateCoinReponse = async (response, isError) => {
        console.log(TAG + "callAPI handleUpdateCoinReponse Response " + JSON.stringify(response));
        console.log(TAG + "callAPI handleUpdateCoinReponse isError " + isError);
        if (response.status == 'success') {
            EventRegister.emit(Constants.EVENT_PROFILE_GOLDCOIN_UPDATED, '');
        }
    }

    handleMessage(event) {
        let data = event.nativeEvent.data;
        console.log(TAG, 'result from webview ', data);
        if (data == "pay_success") {

            if (this.state.showPaypalWebView) {
                this.setState({ showPaypalWebView: false, showSpins: false, shownSpin: true }, () => {

                    setTimeout(() => {
                        this.sufixProcessForPaypalResponse();
                    }, 500);

                });
            }

        } else if (data === "pay_cancel")
            this.setState({ showPaypalWebView: false, showSpins: false, shownSpin: true });


    }
    handlePaypalResponse = async (data) => {

        if (data.title.toLowerCase().includes("success")) {

            if (this.state.showPaypalWebView) {
                this.setState({ showPaypalWebView: false }, () => {

                    setTimeout(() => {
                        this.sufixProcessForPaypalResponse();
                    }, 500);

                });

            }

        }
        if (data.title.toLowerCase().includes("Cancel")) { this.setState({ showPaypalWebView: false }); }
        console.log('title ', data.title);
    };

    addNewCard = async () => {
        if (this.state.card_number.length < 12 || this.state.card_number.length > 19) {
            Alert.alert(Constants.INVALID_CARD_NUMBER_LENGTH, "");
            return;
        }
        var card_valid_data = card_valid_check.number(this.state.card_number);

        if (!card_valid_data.isValid) {
            Alert.alert(Constants.INVALID_CARD_NUMBER, "");
            return;
        }
        if (this.state.card_holder_first_name == "") {
            Alert.alert(Constants.EMPTY_CARDHOLDER_FIRSTNAME, "");
            return;
        }
        if (this.state.card_holder_last_name == "") {
            Alert.alert(Constants.EMPTY_CARDHOLDER_LASTNAME, "");
            return;
        }
        if (this.state.card_expiry_month == "") {
            Alert.alert(Constants.EMPTY_CARDEXPIRATION_MONTH, "");
            return;
        }
        if (this.state.card_expiry_year.length < 2) {
            Alert.alert(Constants.EMPTY_CARDEXPIRATION_YEAR, "");
            return;
        }
        if (this.state.card_type == "american-express") {
            if (this.state.card_cvv.length != 4) {
                Alert.alert(Constants.INVALID_AMERICAN_CVV, "");
                return;
            }
        } else {
            if (this.state.card_cvv.length != 3) {
                Alert.alert(Constants.INVALID_CVV, "");
                return;
            }
        }

        try {
            this.setState({
                loading: true
            });


            let names = this.state.card_holder_first_name.split(' ');
            let uri = Memory().env == "LIVE" ? Global.URL_ADD_CREDITCARD : Global.URL_ADD_CREDITCARD_DEV;
            let params = new FormData();
            params.append("token", this.state.userToken);
            params.append("user_id", this.state.userId);
            params.append("format", "json");
            params.append("card_number", this.state.card_number);
            params.append("card_first_name", names[0]);
            params.append("card_last_name", names[1]);
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
                if (result.PaymentStatus[0].status == "1") {
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
            this.setState({
                loading: false,
            });
            if (response != undefined && response != null && response.length > 0) {
                Alert.alert(response.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    }

    _renderCardItem = (item, index) => {
        return (
            <View style={{ width: '100%', alignItems: 'center' }}>
                {
                    item.saved_card_index == true &&
                    <View style={{ width: '100%', justifyContent: 'center', alignItems: 'center' }}>
                        <TouchableOpacity style={[stylesGlobal.credit_card_view]} onPress={() => this.setDefaultCard(item)} activeOpacity={Global.activeOpacity}>
                            <View style={{ width: '100%', height: '100%', justifyContent: 'space-between', padding: 10, overflow: 'hidden' }}>
                                <Text style={[{ color: '#777778', fontSize: 14, textAlign: 'right' }, stylesGlobal.font]} numberOfLines={1}>{(item.cardType).toUpperCase()}</Text>
                                <View style={{ width: '100%', paddingTop: 10, }}>
                                    <Image source={require('../icons/card-chip.png')} style={{ width: 50, height: 50, resizeMode: 'contain', }} />
                                    <Text style={[{
                                        color: '#efefef', fontSize: 22, textAlign: 'center', marginTop: 10,
                                        textShadowColor: '#929292',
                                        textShadowOffset: { width: 1, height: 1 },
                                        textShadowRadius: 1,
                                    }, stylesGlobal.font_bold]}
                                    >XXXX  XXXX  XXXX  {item.last4}
                                    </Text>
                                </View>
                                <View style={{ width: '100%', flex: 1, justifyContent: 'space-between', marginTop: 10, flexDirection: 'row' }}>
                                    <View style={{ height: '100%', flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end' }}>
                                        <TouchableOpacity style={styles.action_button} onPress={() => { this.setDefaultCard(item) }}>
                                            <View>
                                                <Image source={require('../icons/square.png')} style={{ width: 20, height: 20 }} />
                                                {
                                                    item.default == true &&
                                                    <Image style={{ width: 20, height: 20, position: 'absolute', bottom: 0, left: 0 }} source={require('../icons/checked.png')} />
                                                }
                                            </View>
                                            <Text style={[styles.action_button_text, stylesGlobal.font]}>{"Use This"}</Text>
                                        </TouchableOpacity>
                                    </View>
                                    {
                                        item.default == true &&
                                        <View style={{ height: '100%', justifyContent: 'flex-end', }}>
                                            <Text style={[{ color: '#777778', fontSize: 14 }, stylesGlobal.font]}>CVV</Text>
                                            <TextInput style={[{ color: '#777778', fontSize: 14, width: 80, height: 30, paddingHorizontal: 5, marginTop: 5, backgroundColor: Colors.white, borderRadius: 5, borderWidth: 1, borderColor: Colors.gray }, stylesGlobal.font]}
                                                placeholder={'3~4 digits'}
                                                keyboardType={'number-pad'}
                                                maxLength={4}
                                                autoCompleteType={'cc-csc'}
                                                onChangeText={(text) => {
                                                    var cards_list = this.state.cards_list;
                                                    for (var i = 0; i < cards_list.length; i++) {
                                                        if (i == index) {
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
                                    <View style={{ height: '100%', justifyContent: 'flex-end', alignItems: 'flex-end' }}>
                                        <Text style={[{ color: '#777778', fontSize: 14 }, stylesGlobal.font]}>MONTH/YEAR</Text>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10, }}>
                                            <Text style={[{ color: '#777778', fontSize: 14, }, stylesGlobal.font]}>{"EXPIRES: "}</Text>
                                            <Text style={[{ color: '#efefef', fontSize: 22, textShadowColor: '#929292', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 1 }, stylesGlobal.font_bold]}>{"XX/XX"}</Text>
                                        </View>
                                    </View>
                                </View>
                            </View>
                        </TouchableOpacity>
                    </View>
                }
                {/* {
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
            } */}
                {/* {
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
            } */}
                {
                    item.paypal_pay_index == true &&
                    <View style={{ width: '100%', justifyContent: 'center', alignItems: 'center' }}>
                        <TouchableOpacity style={stylesGlobal.credit_card_view} activeOpacity={Global.activeOpacity} onPress={() => this.setDefaultCard(item)}>
                            <View style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' }}>
                                <Image style={{ width: "50%", height: "50%", resizeMode: 'contain' }} source={require('../icons/pay-paypal.png')}></Image>
                            </View>
                            <View style={[styles.action_button, { position: 'absolute', left: 20, bottom: 10, zIndex: 10 }]}>
                                <View>
                                    <Image source={require('../icons/square.png')} style={{ width: 20, height: 20 }} />
                                    {
                                        item.default == true &&
                                        <Image style={{ width: 20, height: 20, position: 'absolute', bottom: 0, left: 0 }} source={require('../icons/checked.png')} />
                                    }
                                </View>
                                <Text style={[styles.action_button_text, stylesGlobal.font]}>{"Use this"}</Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                }
                {
                    item.new_card_index == true &&
                    <View style={{ width: '100%', justifyContent: 'center', alignItems: 'center' }}>
                        <View style={stylesGlobal.credit_card_view}>
                            <View style={{ width: '100%', height: '100%', justifyContent: 'space-between', padding: 10 }}>
                                <View style={{ width: '100%', zIndex: 100 }}>
                                    <Text style={[styles.new_card_input_title_text, { paddingBottom: 5 }, stylesGlobal.font]}>{"Card Number:"}</Text>
                                    <View style={{ width: '100%', height: 30, marginTop: 5, borderWidth: 0.5, borderColor: Colors.black, borderRadius: 5, flexDirection: 'row' }}>
                                        <View style={{ height: '100%', aspectRatio: 1.5, justifyContent: 'center', alignItems: 'center' }}>
                                            {
                                                this.state.card_type == "" &&
                                                <Image style={{ width: '100%', height: '80%', resizeMode: 'contain', }} source={require('../icons/card-empty.png')} />
                                            }
                                            {
                                                this.state.card_type == "visa" &&
                                                <Image style={{ width: '100%', height: '80%', resizeMode: 'contain', opacity: this.state.CardValid ? 1 : 0.5 }} source={require('../icons/card-visa.png')} />
                                            }
                                            {
                                                this.state.card_type == "mastercard" &&
                                                <Image style={{ width: '100%', height: '80%', resizeMode: 'contain', opacity: this.state.CardValid ? 1 : 0.5 }} source={require('../icons/card-mastercard.png')} />
                                            }
                                            {
                                                this.state.card_type == "american-express" &&
                                                <Image style={{ width: '100%', height: '80%', resizeMode: 'contain', opacity: this.state.CardValid ? 1 : 0.5 }} source={require('../icons/card-american-express.png')} />
                                            }
                                            {
                                                this.state.card_type == "discover" &&
                                                <Image style={{ width: '100%', height: '80%', resizeMode: 'contain', opacity: this.state.CardValid ? 1 : 0.5 }} source={require('../icons/card-discover.png')} />
                                            }
                                            {
                                                this.state.card_type == "jcb" &&
                                                <Image style={{ width: '100%', height: '80%', resizeMode: 'contain', opacity: this.state.CardValid ? 1 : 0.5 }} source={require('../icons/card-jcb.png')} />
                                            }
                                            {
                                                this.state.card_type == "diners-club" &&
                                                <Image style={{ width: '100%', height: '80%', resizeMode: 'contain', opacity: this.state.CardValid ? 1 : 0.5 }} source={require('../icons/card-diners-club.png')} />
                                            }
                                            {
                                                this.state.card_type == "maestro" &&
                                                <Image style={{ width: '100%', height: '80%', resizeMode: 'contain', opacity: this.state.CardValid ? 1 : 0.5 }} source={require('../icons/card-maestro.png')} />
                                            }
                                        </View>
                                        <View style={{ flex: 1, height: '100%' }}>
                                            <AutoCompleteInput 
                                                cardNumbers={this.state.cardNumbers}
                                                onChangeText={(text) => { this.setState({card_number: text}); this.onChangeCardNumberText(text)}}
                                            />
                                            {/* <TextInput style={[{ width: '100%', paddingLeft: 5, paddingTop: 5, height: '100%' }, stylesGlobal.font,]} autoCompleteType={'cc-number'} textContentType={'creditCardNumber'} placeholder='1234 5678 9012 3456' onChangeText={(text) => this.onChangeCardNumberText(text)}>{this.state.card_number}</TextInput> */}
                                        </View>
                                    </View>
                                </View>
                                <View style={{ width: '100%' }}>
                                    <Text style={[styles.new_card_input_title_text, { marginTop: 10 }, stylesGlobal.font]}>{"Name on Card:"}</Text>
                                    <View style={{ width: '100%', height: 30, marginTop: 5, flexDirection: 'row', justifyContent: 'space-between' }}>
                                        {/* <View style={{ width: '48%', height: '100%' }}> */}
                                        <View style={{ width: '100%', height: '100%' }}>
                                            <TextInput style={[{ 
                                                width: '100%', 
                                                paddingLeft: 5, 
                                                paddingTop: 5, 
                                                height: '100%' }, 
                                                styles.expiry_text, 
                                                stylesGlobal.font]} 
                                                autoCompleteType={'name'} 
                                                keyboardType={Platform.OS === 'ios' ? 'ascii-capable' : 'visible-password'} 
                                                autoCorrect={false} 
                                                textContentType="oneTimeCode" 
                                                placeholder='Name' 
                                                onChangeText={(text) => this.setState({ card_holder_first_name: text })}>{this.state.card_holder_first_name}</TextInput>
                                        </View>
                                        {/* <View style={{ width: '48%', height: '100%' }}> */}
                                        {/*     <TextInput style={[{ width: '100%', paddingLeft: 5, paddingTop: 5, height: '100%' }, styles.expiry_text, stylesGlobal.font]} autoCompleteType={'name'} keyboardType={Platform.OS === 'ios' ? 'ascii-capable' : 'visible-password'} autoCorrect={false} textContentType="oneTimeCode" placeholder='Last Name' onChangeText={(text) => this.setState({ card_holder_last_name: text })}>{this.state.card_holder_last_name}</TextInput> */}
                                        {/* </View> */}
                                    </View>
                                </View>
                                <View style={{ width: '100%', flexDirection: 'row', justifyContent: 'space-between' }}>
                                    <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between' }}>
                                        <View style={{ width: '30%' }}>
                                            <Text style={[styles.new_card_input_title_text, { marginTop: 10 }, stylesGlobal.font]}>{"CVV:"}</Text>
                                            <View style={{ width: '100%', height: 30, marginTop: 5, }}>
                                                <TextInput
                                                    placeholder='123'
                                                    maxLength={4}
                                                    style={[{ width: '100%', paddingLeft: 5, paddingTop: 5, height: '100%' }, styles.expiry_text, stylesGlobal.font]}
                                                    autoCompleteType={'cc-csc'}
                                                    keyboardType='number-pad'
                                                    underlineColorAndroid={Colors.white}
                                                    value={this.state.card_cvv}
                                                    onChangeText={(text) => this.setState({ card_cvv: text })}
                                                />
                                            </View>
                                        </View>
                                        <View style={{ width: '65%' }}>
                                            <Text style={[styles.new_card_input_title_text, { marginTop: 10 }, stylesGlobal.font]}>{"Expiry Date:"}</Text>
                                            <View style={{ flexDirection: 'row', height: 30, alignItems: 'center', justifyContent: 'space-between', marginTop: 5, }}>
                                                <View style={{ width: '48%', height: '100%' }}>
                                                    <TextInput placeholder='MM' maxLength={2}
                                                        style={[{ width: '100%', paddingLeft: 5, paddingTop: 5, height: '100%' }, styles.expiry_text, stylesGlobal.font]}
                                                        autoCompleteType={'cc-exp-month'}
                                                        keyboardType='number-pad'
                                                        underlineColorAndroid={Colors.white}
                                                        value={this.state.card_expiry_month}
                                                        onChangeText={(text) => this.setState({ card_expiry_month: text })}
                                                    />
                                                </View>
                                                <View style={{ width: '48%', height: '100%' }}>
                                                    <TextInput
                                                        placeholder='YYYY'
                                                        maxLength={4}
                                                        style={[{ width: '100%', paddingLeft: 5, paddingTop: 5, height: '100%' }, styles.expiry_text, stylesGlobal.font]}
                                                        autoCompleteType={'cc-exp-year'}
                                                        keyboardType='number-pad'
                                                        underlineColorAndroid={Colors.white}
                                                        value={this.state.card_expiry_year}
                                                        onChangeText={(text) => this.setState({ card_expiry_year: text })}
                                                    />
                                                </View>
                                            </View>
                                        </View>
                                    </View>
                                    <View style={{ marginLeft: 10, justifyContent: 'flex-end' }}>
                                        <TouchableOpacity style={[styles.button_style, stylesGlobal.shadow_style]} onPress={() => this.buy_coins()}>
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

    render() {
        return (
            <SafeAreaView style={styles.container} >
                {
                    this.state.loading && <ProgressIndicator />
                }
                {
                    <Modal
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '000' }}
                        visible={this.state.showPaypalWebView}
                        onRequestClose={() => this.setState({ showPaypalWebView: false })}
                    >
                        <WebView
                            onLoadStart={() => {
                                this.setState({ showSpins: true });
                            }}
                            onLoadEnd={() => { this.setState({ showSpins: false, shownSpin: false }); }}
                            style={{ height: '90%', marginTop: 30, marginBottom: 30 }}
                            source={{ uri: `${Global.BASE_URL_DEV}pay/${this.state.total_price}` }}
                            onNavigationStateChange={data =>
                                this.handlePaypalResponse(data)
                            }
                            onMessage={(event) => this.handleMessage(event)}
                        />
                        {
                            (this.state.showSpins & this.state.shownSpin) ? (<ProgressIndicator />) : (null)
                        }
                    </Modal>
                }
                {
                    this.state.planList.length > 0 &&
                    <View style={styles.card_view}>
                        <View style={styles.title_header}>
                            <Text style={[styles.headText, stylesGlobal.font]}>{"BUY GOLD COINS"}</Text>
                        </View>
                        <View style={{ flex: 1, width: '100%' }}>
                            {
                                this.state.is_portrait &&
                                <KeyboardAwareScrollView keyboardShouldPersistTaps = "handled" style={{ flex: 1, width: '100%', paddingTop: 20 }}>
                                    {
                                        this.state.planList.map((item, index) =>
                                            <View key={index} style={{ width: '100%', alignItems: 'center' }}>
                                                <View style={[stylesGlobal.credit_card_view, { flexDirection: 'row' }]}>
                                                    {
                                                        item.strip &&
                                                        <Image style={{ width: 120, height: 120, resizeMode: 'contain', position: 'absolute', top: -8, right: -8, zIndex: 5 }} source={item.strip} />
                                                    }
                                                    <View style={{ width: '50%', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                                                        <View style={{ width: '100%', marginTop: 20, alignItems: 'center' }}>
                                                            <Text style={[{ fontSize: 14, color: Colors.gold }, stylesGlobal.font_bold]}>{item.plan_name}</Text>
                                                        </View>
                                                        <View style={{ height: index == 0 ? '45%' : '50%', aspectRatio: 1, marginTop: 15, marginBottom: 40 }}>
                                                            <Image style={{ width: "100%", height: '100%', resizeMode: "contain" }} source={item.image} />
                                                        </View>
                                                    </View>
                                                    <View style={{ width: '50%', height: '100%', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
                                                        <View style={{ width: '100%', height: '50%', paddingTop: 30, }}>
                                                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                                <Text style={[styles.normal_text, stylesGlobal.font_semibold]}>{"Gold Coins: "}</Text>
                                                                <NumberFormat value={item.gold_coins} displayType={'text'} thousandSeparator={true} renderText={value => <Text style={[styles.normal_text, stylesGlobal.font]}>{value}</Text>} />
                                                                <Image style={{ width: 20, height: 20, resizeMode: "contain", marginLeft: 5 }} source={require("../icons/TurningCoin.gif")} />
                                                            </View>
                                                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                                <Text style={[styles.normal_text, stylesGlobal.font_semibold]}>Price: </Text>
                                                                <NumberFormat value={item.price} displayType={'text'} thousandSeparator={true} renderText={value => <Text style={[styles.normal_text, stylesGlobal.font]}>{value}</Text>} />
                                                            </View>
                                                            {
                                                                item.shopping_discount != "0" &&
                                                                <Text style={[styles.normal_text, stylesGlobal.font, { marginTop: 2 }]}><Text style={stylesGlobal.font_semibold}>Save: </Text>{item.shopping_discount}%</Text>
                                                            }
                                                        </View>
                                                        <View style={{ width: '100%', height: '50%', justifyContent: 'center', alignItems: 'center' }}>
                                                            <View style={{ width: '100%', height: 30, justifyContent: 'center', alignItems: 'center', flexDirection: 'row' }}>
                                                                <TouchableOpacity style={[styles.countButton, { borderTopLeftRadius: 5, borderBottomLeftRadius: 5 }]} onPress={() => this.minus_button(index)}>
                                                                    <Text style={[{ color: Colors.gold, fontSize: 24, }, stylesGlobal.font_bold]}>
                                                                        {"-"}
                                                                    </Text>
                                                                </TouchableOpacity>
                                                                <View style={[{}, styles.count_textview]}>
                                                                    {
                                                                        item.goldcoinpack_count == 0 &&
                                                                        // <TextInput style = {[styles.normal_text, stylesGlobal.font]} placeholder = {'0 $0.00'} editable = {false}></TextInput>
                                                                        <TextInput style={[{ paddingTop: 5 }, styles.normal_text, stylesGlobal.font]} placeholder={'0'} editable={false}></TextInput>
                                                                    }
                                                                    {
                                                                        item.goldcoinpack_count != 0 &&
                                                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                                            <NumberFormat value={item.goldcoinpack_count * item.gold_coins_number} displayType={'text'} thousandSeparator={true} renderText={value => <Text style={[styles.normal_text, stylesGlobal.font]}>{value}</Text>} />
                                                                            {/* <NumberFormat value={Math.round(item.goldcoinpack_count * item.price_float * 100) / 100} displayType={'text'} thousandSeparator={true} renderText={value => <Text style = {[styles.normal_text, stylesGlobal.font]}>{" $ " + value}</Text>}/> */}
                                                                        </View>
                                                                    }
                                                                </View>
                                                                <TouchableOpacity style={[styles.countButton, { borderTopRightRadius: 5, borderBottomRightRadius: 5 }]} onPress={() => this.plus_button(index)}>
                                                                    <Text style={[{ color: Colors.gold, fontSize: 24, }, stylesGlobal.font_bold]}>
                                                                        {"+"}
                                                                    </Text>
                                                                </TouchableOpacity>
                                                            </View>
                                                            {/* <View style = {{width: '100%', flex: 1, justifyContent: 'flex-start', alignItems: 'center', marginTop: 5, }}>
                                                <TouchableOpacity style={[styles.button_style, stylesGlobal.shadow_style]} >
                                                    <Text style={[styles.button_text, stylesGlobal.font]}>
                                                        Buy Now
                                                    </Text>
                                                </TouchableOpacity>
                                            </View> */}
                                                        </View>
                                                    </View>
                                                </View>
                                            </View>
                                        )
                                    }
                                    <View style={{ width: '100%', paddingHorizontal: 10, marginTop: 10 }}>
                                        <View style={{ width: '100%', flexDirection: 'row', paddingBottom: 5, justifyContent: 'center', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: Colors.gold }}>
                                            <View style={{ width: '40%', justifyContent: 'center', alignItems: 'center' }}>
                                                <Text style={[styles.normal_text, stylesGlobal.font_semibold]} multiline={true}>{"Product"}</Text>
                                            </View>
                                            <View style={{ width: '20%', justifyContent: 'center', alignItems: 'center' }}>
                                                <Text style={[styles.normal_text, stylesGlobal.font_semibold]}>{"Quantity"}</Text>
                                            </View>
                                            <View style={{ width: '30%', justifyContent: 'center', alignItems: 'flex-end' }}>
                                                <Text style={[styles.normal_text, stylesGlobal.font_semibold]}>{"Subtotal"}</Text>
                                            </View>
                                            <View style={{ width: '10%', justifyContent: 'center', alignItems: 'flex-end' }}>

                                            </View>
                                        </View>
                                    </View>
                                    {
                                        this.state.planList.map((item, index) =>
                                            <View key={index} style={{ width: '100%', alignItems: 'center' }}>
                                                {
                                                    item.goldcoinpack_count > 0 &&
                                                    <View key={index} style={{ width: '100%', paddingHorizontal: 10 }}>
                                                        <View style={{ width: '100%', flexDirection: 'row', paddingVertical: 5, justifyContent: 'center', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: Colors.gold }}>
                                                            <View style={{ width: '40%', flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
                                                                <View style={{ height: index == 0 ? 40 : 50, aspectRatio: 1, }}>
                                                                    <Image style={{ width: "100%", height: '100%', resizeMode: "contain" }} source={item.image} />
                                                                </View>
                                                                <Text style={[styles.normal_text, { marginHorizontal: 5 }, stylesGlobal.font]} multiline={true}>{item.plan_name}</Text>
                                                            </View>
                                                            <View style={{ width: '20%', justifyContent: 'center', alignItems: 'center' }}>
                                                                <NumberFormat value={item.goldcoinpack_count * item.gold_coins_number} displayType={'text'} thousandSeparator={true} renderText={value => <Text style={[styles.normal_text, stylesGlobal.font]}>{value}</Text>} />
                                                            </View>
                                                            <View style={{ width: '30%', flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' }}>
                                                                <Text style={[styles.normal_text, stylesGlobal.font]}>{"$"}</Text>
                                                                <View style={{ width: 7 * this.state.total_price_length, alignItems: 'flex-end' }}>
                                                                    <NumberFormat value={(item.goldcoinpack_count * item.price_float).toFixed(2)} displayType={'text'} thousandSeparator={true} renderText={value => <Text style={[styles.normal_text, stylesGlobal.font]}>{value}</Text>} />
                                                                </View>
                                                            </View>
                                                            <View style={{ width: '10%', justifyContent: 'center', alignItems: 'center' }}>
                                                                <TouchableOpacity style={{ margin: 5 }} onPress={() => this.removeCoinpack(index)}>
                                                                    <Image style={{ width: 20, height: 20, tintColor: Colors.gold }} source={require('../icons/connection-delete.png')} />
                                                                </TouchableOpacity>
                                                            </View>
                                                        </View>
                                                    </View>
                                                }
                                            </View>
                                        )
                                    }
                                    <View style={{ width: '100%', flexDirection: 'row', marginTop: 10, marginBottom: 20, paddingHorizontal: 10 }}>
                                        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', flexDirection: 'row', }}>
                                            <Text style={[styles.normal_text, stylesGlobal.font_bold]}>{"Total: "}</Text>
                                            <Text style={[styles.normal_text, stylesGlobal.font]}>{"$"}</Text>
                                            <View style={{ width: 7 * this.state.total_price_length, alignItems: 'flex-end' }}>
                                                <NumberFormat value={this.state.total_price.toFixed(2).toString()} displayType={'text'} thousandSeparator={true} renderText={value => <Text style={[styles.normal_text, stylesGlobal.font]}>{value}</Text>} />
                                            </View>
                                        </View>
                                        <View style={{ width: '10%' }}>

                                        </View>
                                    </View>
                                    {
                                        this.state.see_more_payment_option &&
                                        <View style={{ width: '100%', alignItems: 'flex-end', paddingEnd: 50, marginBottom: 20 }}>
                                            <TouchableOpacity style={[styles.button_style, stylesGlobal.shadow_style]} onPress={() => this.buy_coins()} >
                                                <Text style={[styles.button_text, stylesGlobal.font]}>{"Checkout"}</Text>
                                            </TouchableOpacity>
                                        </View>
                                    }
                                    {
                                        this.state.see_more_payment_option && this.state.cards_list.length > 0 &&
                                        this._renderCardItem(this.state.cards_list[0], 0)
                                    }
                                    {
                                        !this.state.see_more_payment_option && this.state.cards_list.map((item, index) =>
                                            <View key={index} style={{ width: '100%' }}>
                                                {
                                                    this._renderCardItem(item, index)
                                                }
                                            </View>
                                        )
                                    }
                                    {
                                        this.state.see_more_payment_option &&
                                        <View style={{ width: '100%', paddingTop: 20, alignItems: 'center' }}>
                                            <TouchableOpacity style={[styles.button_style, stylesGlobal.shadow_style]} onPress={() => this.setState({ see_more_payment_option: !this.state.see_more_payment_option })} >
                                                <Text style={[styles.button_text, stylesGlobal.font_semibold]}>
                                                    {this.state.see_more_payment_option ? "See More Payment Options" : "See Less Payment Options"}
                                                </Text>
                                            </TouchableOpacity>
                                        </View>
                                    }
                                    {
                                        !this.state.see_more_payment_option &&
                                        <View style={{ width: '100%', alignItems: 'flex-end', paddingEnd: 50, marginBottom: 30 }}>
                                            <TouchableOpacity style={[styles.button_style, stylesGlobal.shadow_style]} onPress={() => this.buy_coins()} >
                                                <Text style={[styles.button_text, stylesGlobal.font]}>{"Checkout"}</Text>
                                            </TouchableOpacity>
                                        </View>
                                    }
                                    <View style={{ height: 40 }}></View>
                                </KeyboardAwareScrollView>
                            }
                            {
                                !this.state.is_portrait &&
                                <View style={{ flex: 1, flexDirection: 'row' }}>
                                    <ScrollView style={{ width: '50%', paddingVertical: 10 }}>
                                        {
                                            this.state.planList.map((item, index) =>
                                                <View key={index} style={{ width: '100%', alignItems: 'center' }}>
                                                    <View style={[stylesGlobal.credit_card_view, { flexDirection: 'row' }]}>
                                                        {
                                                            item.strip &&
                                                            <Image style={{ width: 120, height: 120, resizeMode: 'contain', position: 'absolute', top: -8, right: -8, zIndex: 5 }} source={item.strip} />
                                                        }
                                                        <View style={{ width: '50%', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                                                            <View style={{ width: '100%', marginTop: 20, alignItems: 'center' }}>
                                                                <Text style={[{ fontSize: 14, color: Colors.gold }, stylesGlobal.font_bold]}>{item.plan_name}</Text>
                                                            </View>
                                                            <View style={{ height: index == 0 ? '45%' : '50%', aspectRatio: 1, marginTop: 15, marginBottom: 40 }}>
                                                                <Image style={{ width: "100%", height: '100%', resizeMode: "contain" }} source={item.image} />
                                                            </View>
                                                        </View>
                                                        <View style={{ width: '50%', height: '100%', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
                                                            <View style={{ width: '100%', height: '50%', paddingTop: 30, }}>
                                                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                                    <Text style={[styles.normal_text, stylesGlobal.font_semibold]}>Gold Coins: </Text>
                                                                    <NumberFormat value={item.gold_coins} displayType={'text'} thousandSeparator={true} renderText={value => <Text style={[styles.normal_text, stylesGlobal.font]}>{value}</Text>} />
                                                                    <Image style={{ width: 20, height: 20, resizeMode: "contain", marginLeft: 5 }} source={require("../icons/TurningCoin.gif")} />
                                                                </View>
                                                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                                    <Text style={[styles.normal_text, stylesGlobal.font_semibold]}>Price: </Text>
                                                                    <NumberFormat value={item.price} displayType={'text'} thousandSeparator={true} renderText={value => <Text style={[styles.normal_text, stylesGlobal.font]}>{value}</Text>} />
                                                                </View>
                                                                {
                                                                    item.shopping_discount != "0" &&
                                                                    <Text style={[styles.normal_text, stylesGlobal.font, { marginTop: 2 }]}><Text style={stylesGlobal.font_semibold}>Save: </Text>{item.shopping_discount}%</Text>
                                                                }
                                                            </View>
                                                            <View style={{ width: '100%', height: '50%', justifyContent: 'center', alignItems: 'center' }}>
                                                                <View style={{ width: '100%', height: 30, justifyContent: 'center', alignItems: 'center', flexDirection: 'row' }}>
                                                                    <TouchableOpacity style={[styles.countButton, { borderTopLeftRadius: 5, borderBottomLeftRadius: 5 }]} onPress={() => this.minus_button(index)}>
                                                                        <Text style={[{ color: Colors.gold, fontSize: 24, }, stylesGlobal.font_bold]}>
                                                                            {"-"}
                                                                        </Text>
                                                                    </TouchableOpacity>
                                                                    <View style={styles.count_textview}>
                                                                        {
                                                                            item.goldcoinpack_count == 0 &&
                                                                            // <TextInput style = {[styles.normal_text, stylesGlobal.font]} placeholder = {'0 $0.00'} editable = {false}></TextInput>
                                                                            <TextInput style={[styles.normal_text, stylesGlobal.font]} placeholder={'0'} editable={false}></TextInput>
                                                                        }
                                                                        {
                                                                            item.goldcoinpack_count != 0 &&
                                                                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                                                <NumberFormat value={item.goldcoinpack_count * item.gold_coins_number} displayType={'text'} thousandSeparator={true} renderText={value => <Text style={[styles.normal_text, stylesGlobal.font]}>{value}</Text>} />
                                                                                {/* <NumberFormat value={Math.round(item.goldcoinpack_count * item.price_float * 100) / 100} displayType={'text'} thousandSeparator={true} renderText={value => <Text style = {[styles.normal_text, stylesGlobal.font]}>{" $ " + value}</Text>}/> */}
                                                                            </View>
                                                                        }
                                                                    </View>
                                                                    <TouchableOpacity style={[styles.countButton, { borderTopRightRadius: 5, borderBottomRightRadius: 5 }]} onPress={() => this.plus_button(index)}>
                                                                        <Text style={[{ color: Colors.gold, fontSize: 24, }, stylesGlobal.font_bold]}>
                                                                            {"+"}
                                                                        </Text>
                                                                    </TouchableOpacity>
                                                                </View>
                                                                {/* <View style = {{width: '100%', flex: 1, justifyContent: 'flex-start', alignItems: 'center', marginTop: 5, }}>
                                                    <TouchableOpacity style={[styles.button_style, stylesGlobal.shadow_style]} >
                                                        <Text style={[styles.button_text, stylesGlobal.font]}>
                                                            Buy Now
                                                        </Text>
                                                    </TouchableOpacity>
                                                </View> */}
                                                            </View>
                                                        </View>
                                                    </View>
                                                </View>
                                            )
                                        }
                                    </ScrollView>
                                    <View style={{ width: '50%' }}>
                                        <KeyboardAwareScrollView  keyboardShouldPersistTaps = "handled" style={{ flex: 1, width: '100%', paddingTop: 20 }} extraHeight={50}>
                                            <View style={{ width: '100%', paddingHorizontal: 10, marginTop: 10 }}>
                                                <View style={{ width: '100%', flexDirection: 'row', paddingBottom: 5, justifyContent: 'center', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: Colors.gold }}>
                                                    <View style={{ width: '40%', justifyContent: 'center', alignItems: 'center' }}>
                                                        <Text style={[styles.normal_text, stylesGlobal.font_semibold]} multiline={true}>{"Product"}</Text>
                                                    </View>
                                                    <View style={{ width: '20%', justifyContent: 'center', alignItems: 'center' }}>
                                                        <Text style={[styles.normal_text, stylesGlobal.font_semibold]}>{"Quantity"}</Text>
                                                    </View>
                                                    <View style={{ width: '30%', justifyContent: 'center', alignItems: 'flex-end' }}>
                                                        <Text style={[styles.normal_text, stylesGlobal.font_semibold]}>{"Subtotal"}</Text>
                                                    </View>
                                                    <View style={{ width: '10%', justifyContent: 'center', alignItems: 'flex-end' }}>

                                                    </View>
                                                </View>
                                            </View>
                                            {
                                                this.state.planList.map((item, index) =>
                                                    <View key={index} style={{ width: '100%', alignItems: 'center' }}>
                                                        {
                                                            item.goldcoinpack_count > 0 &&
                                                            <View key={index} style={{ width: '100%', paddingHorizontal: 10 }}>
                                                                <View style={{ width: '100%', flexDirection: 'row', paddingVertical: 5, justifyContent: 'center', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: Colors.gold }}>
                                                                    <View style={{ width: '40%', flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
                                                                        <View style={{ height: index == 0 ? 40 : 50, aspectRatio: 1, }}>
                                                                            <Image style={{ width: "100%", height: '100%', resizeMode: "contain" }} source={item.image} />
                                                                        </View>
                                                                        <Text style={[styles.normal_text, { marginHorizontal: 5 }, stylesGlobal.font]} multiline={true}>{item.plan_name}</Text>
                                                                    </View>
                                                                    <View style={{ width: '20%', justifyContent: 'center', alignItems: 'center' }}>
                                                                        <NumberFormat value={item.goldcoinpack_count * item.gold_coins_number} displayType={'text'} thousandSeparator={true} renderText={value => <Text style={[styles.normal_text, stylesGlobal.font]}>{value}</Text>} />
                                                                    </View>
                                                                    <View style={{ width: '30%', flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' }}>
                                                                        <Text style={[styles.normal_text, stylesGlobal.font]}>{"$"}</Text>
                                                                        <View style={{ width: 7 * this.state.total_price_length, alignItems: 'flex-end' }}>
                                                                            <NumberFormat value={(item.goldcoinpack_count * item.price_float).toFixed(2)} displayType={'text'} thousandSeparator={true} renderText={value => <Text style={[styles.normal_text, stylesGlobal.font]}>{value}</Text>} />
                                                                        </View>
                                                                    </View>
                                                                    <View style={{ width: '10%', justifyContent: 'center', alignItems: 'center' }}>
                                                                        <TouchableOpacity style={{ margin: 5 }} onPress={() => this.removeCoinpack(index)}>
                                                                            <Image style={{ width: 20, height: 20, tintColor: Colors.gold }} source={require('../icons/connection-delete.png')} />
                                                                        </TouchableOpacity>
                                                                    </View>
                                                                </View>
                                                            </View>
                                                        }
                                                    </View>
                                                )
                                            }
                                            <View style={{ width: '100%', flexDirection: 'row', marginTop: 10, marginBottom: 20, paddingHorizontal: 10 }}>
                                                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', flexDirection: 'row', }}>
                                                    <Text style={[styles.normal_text, stylesGlobal.font_bold]}>{"Total: "}</Text>
                                                    <Text style={[styles.normal_text, stylesGlobal.font]}>{"$"}</Text>
                                                    <View style={{ width: 7 * this.state.total_price_length, alignItems: 'flex-end' }}>
                                                        <NumberFormat value={this.state.total_price.toFixed(2).toString()} displayType={'text'} thousandSeparator={true} renderText={value => <Text style={[styles.normal_text, stylesGlobal.font]}>{value}</Text>} />
                                                    </View>
                                                </View>
                                                <View style={{ width: '10%' }}>

                                                </View>
                                            </View>
                                            {
                                                this.state.see_more_payment_option &&
                                                <View style={{ width: '100%', alignItems: 'flex-end', paddingEnd: 50, marginBottom: 20 }}>
                                                    <TouchableOpacity style={[styles.button_style, stylesGlobal.shadow_style]} onPress={() => this.buy_coins()} >
                                                        <Text style={[styles.button_text, stylesGlobal.font]}>{"Checkout"}</Text>
                                                    </TouchableOpacity>
                                                </View>
                                            }
                                            {
                                                this.state.see_more_payment_option && this.state.cards_list.length > 0 &&
                                                this._renderCardItem(this.state.cards_list[0], 0)
                                            }
                                            {
                                                !this.state.see_more_payment_option && this.state.cards_list.map((item, index) =>
                                                    <View key={index} style={{ width: '100%' }}>
                                                        {
                                                            this._renderCardItem(item, index)
                                                        }
                                                    </View>
                                                )
                                            }
                                            {
                                                this.state.see_more_payment_option &&
                                                <View style={{ width: '100%', paddingTop: 20, alignItems: 'center' }}>
                                                    <TouchableOpacity style={[styles.button_style, stylesGlobal.shadow_style]} onPress={() => this.setState({ see_more_payment_option: !this.state.see_more_payment_option })} >
                                                        <Text style={[styles.button_text, stylesGlobal.font_semibold]}>
                                                            {this.state.see_more_payment_option ? "See More Payment Options" : "See Less Payment Options"}
                                                        </Text>
                                                    </TouchableOpacity>
                                                </View>
                                            }
                                            {
                                                !this.state.see_more_payment_option &&
                                                <View style={{ width: '100%', alignItems: 'flex-end', paddingEnd: 50, marginBottom: 30 }}>
                                                    <TouchableOpacity style={[styles.button_style, stylesGlobal.shadow_style]} onPress={() => this.buy_coins()} >
                                                        <Text style={[styles.button_text, stylesGlobal.font]}>{"Checkout"}</Text>
                                                    </TouchableOpacity>
                                                </View>
                                            }
                                            <View style={{ height: 40 }}></View>
                                        </KeyboardAwareScrollView>
                                    </View>
                                </View>
                            }
                        </View>
                    </View>
                }
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
        fontSize: 12,
        color: Colors.black
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
        backgroundColor: Colors.gold,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 5,

    },
    button_text: {
        color: Colors.white,
        fontSize: 14,

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
        color: Colors.black,
        fontSize: 14,

    },
    expiry_text: {
        width: '100%',
        borderWidth: .5,
        paddingLeft: 5,
        height: '100%',
        borderRadius: 5,

    }
});
