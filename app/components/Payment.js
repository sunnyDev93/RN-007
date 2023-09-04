import React, { Component,Fragment } from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    Image,
    SafeAreaView,
    TextInput,
    Alert,
    Dimensions,
    Keyboard,
    Platform
} from "react-native";
import { EventRegister } from 'react-native-event-listeners'
import WebService from "../core/WebService";
import { Colors } from "../consts/Colors";
import { Constants } from "../consts/Constants";
import * as Global from "../consts/Global";
import {stylesGlobal} from '../consts/StyleSheet'
import Memory from '../core/Memory'
import { ImageCompressor } from './ImageCompressorClass'
import CustomPopupView from "../customview/CustomPopupView"
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import ProgressIndicator from "./ProgressIndicator";
import BannerView from "../customview/BannerView";
import AsyncStorage from '@react-native-community/async-storage';

const PaymentRequest = require('react-native-payments').PaymentRequest;
var card_valid_check = require('card-validator');

var TAG = "Payment";

export default class Payment extends React.Component {

    constructor(props) {
        
        super(props)

        this.state = {
            initialIndex: -1,
            initialPage:1,
            showModel: false,
            searchText: '',
            loading: true,
            first_loading: true,
            // selectedCard:'',
            // newCardNumber:'',
            // newCardHolderName:'',
            // newCardCvv:'',
            // newCardExpiryMonth:'',
            // newCardExpiryYear:'',
            // planId: this.props.route.params.plan_id,

            buy_id_array: [],
            buy_count_array: [],
            
            // modalVisible:false,
            // selectedCardDetails:{},
            
            card_type: '', //visa, mastercard, american-express, discover, jcb, diners-club, maestro
            CardValid: false,
            card_number: '',
            card_holder_first_name: '',
            card_holder_last_name: '',
            card_expiry_month: '',
            card_expiry_year: '',
            card_cvv: '',

            cards_list: [],
            selected_card: null,
            selected_card_cvv: '',

            upgrade_member_id: "", ////  upgrade member plan id
            buy_type: "", ///// which type of entry buyed, goldcoin, member_upgrade,

            cardNumbers: [],
            see_more_payment_option: true
        }
    }

    UNSAFE_componentWillMount() {
        this.getData();
        
        this.listener = EventRegister.addEventListener(Constants.EVENT_PROFILE_IMAGE_UPDATED, () => {
            console.log(TAG,"EVENT_PROFILE_IMAGE_UPDATED event called");

        })
        if(this.props.route.params != null) {
            if(this.props.route.params.buy_type == "goldcoin") {
                this.setState({
                    buy_type: this.props.route.params.buy_type,
                    buy_id_array: this.props.route.params.buy_id_array, //// array of buy item id
                    buy_count_array: this.props.route.params.buy_count_array
                })
            } else if(this.props.route.params.buy_type == "upgrade_member_plan" ) {
                this.setState({
                    buy_type: this.props.route.params.buy_type,
                    upgrade_member_id: this.props.route.params.upgrade_member_id, 
                })
            } 
        }
        
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

            this.setState({
                userId: userId,
                userToken: userToken,
                userSlug: userSlug,
                userImagePath: userImagePath,
                userImageName: userImageName,
                showModel: false,
            }, () => this.getCardDetails());
        } catch (error) {
            // Error retrieving data
        }

    };

    getCardDetails= async()=>{
        
        try {
            this.setState({
                loading:true
            });

            let uri = Memory().env == "LIVE" ? Global.URL_GET_SAVEDCARDS : Global.URL_GET_SAVEDCARDS_DEV;
            let params = new FormData();
            params.append("format", "json");
            params.append("user_id", this.state.userId);
            params.append("token", this.state.userToken);
            console.log(TAG + " callGetCardsDetailsAPIs uri " + uri);
            console.log(TAG + " callGetCardsDetailsAPIs params ",params);
            WebService.callServicePost(uri, params, this.handleGetSavedCardsResponse);
        } catch (error) {
            this.setState({
                loading: false,
                first_loading: false
            });
            // console.warn("catch1"+error);
            if (error != undefined && error != null && error.length > 0) {
                // console.warn("catch1_If"+error);
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    }

    handleGetSavedCardsResponse = (response, isError) => {
        
        console.log(TAG + " callGetCardsDetailsAPIs " + JSON.stringify(response));
        console.log(TAG + " callGetCardsDetailsAPIs " + JSON.stringify(isError));
        if (!isError) {
            var result = response;
            if (result != undefined && result != null) {
                if(result.status == "success") {
                    if(result.data != null) {
                        var default_card_index = -1;
                        for(i = 0; i < result.data.length; i ++) {
                            result.data[i].save_card_index = true;
                            if(result.data[i].default == true) {
                                default_card_index = i;
                            }
                        }
                        if(default_card_index != -1) {
                            var default_card = result.data[default_card_index];
                            result.data.splice(default_card_index, 1);
                            result.data.unshift(default_card)
                        }
                        // result.data.push({
                        //     cardType: "MASTER",
                        //     last4: "4567",
                        //     expirationDate: '12/24',
                        //     save_card_index: true
                        // })
                        result.data.push({
                            new_card_index: true
                        });
                        result.data.push({
                            amazon_pay_index: true
                        });
                        result.data.push({
                            paypal_pay_index: true
                        });
                        if(Platform.OS == "ios") {
                            result.data.push({
                                apple_pay_index: true
                            });
                        } else if(Platform.OS == "android") {
                            result.data.push({
                                google_pay_index: true
                            });
                        }
                        
                        this.setState({
                            cards_list: result.data
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
        this.setState({
            loading: false,
            first_loading: false
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

    paypal_pay() {

    }

    apple_pay = async () => {
        const METHOD_DATA = [{
            supportedMethods: ['apple-pay'],
            data: {
              merchantIdentifier: 'merchant.com.007percent.007ApplePay',
              supportedNetworks: ['visa', 'mastercard', 'amex'],
              countryCode: 'US',
              currencyCode: 'USD'
            }
        }];
        
        var price_array = this.props.route.params.price_array;
        var buy_item_array = this.props.route.params.buy_item_array;
        var displayItems = [];
        var total_price = 0;
        for(i = 0; i < buy_item_array.length; i ++) {
            displayItems.push({
                label: buy_item_array[i],
                amount: {currency: 'USD', value: price_array[i].toString()}
            })
            total_price = total_price + price_array[i]
        }
        
        const DETAILS = {
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
              amount: { currency: 'USD', value: total_price.toString() }
            }
        };
        const OPTIONS = {
            // requestPayerName: true,
            // requestPayerPhone: false,
            // requestPayerEmail: false,
            // requestShipping: true
        };
        const paymentRequest = new PaymentRequest(METHOD_DATA, DETAILS);
        paymentRequest.onshippingaddresschange = ev => ev.updateWith(DETAILS);
        paymentRequest.onshippingoptionchange = ev => ev.updateWith(DETAILS);

        paymentRequest.canMakePayments().then(async(canMakePayment) => {
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

    purchaseWithNewCard=async()=>{
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

        this.purchaseGoldCoin("new_card");
        
    }

    purchaseWithSavedCard(item) {
        if(item.default != true) {
            return;
        }
        if(this.state.selected_card_cvv.length < 3) {
            Alert.alert(Constants.INVALID_CVV, "");
            return;
        }
        this.purchaseGoldCoin("saved_card");
    }

    purchaseGoldCoin(pay_type) {
        try {
            this.setState({
                loading: true
            });
            let uri = "";
            if(this.state.buy_type == "goldcoin") {
                uri = Memory().env == "LIVE" ? Global.URL_PURCHASE_GOLDCOIN : Global.URL_PURCHASE_GOLDCOIN_DEV;
            } else if(this.state.buy_type == "upgrade_member_plan" || this.state.buy_type == "downgrade_member_plan") {
                uri = Memory().env == "LIVE" ? Global.URL_CHANGE_MEMBERPLAN : Global.URL_CHANGE_MEMBERPLAN_DEV;
            } 

            let params = new FormData();
            params.append("format", "json");
            params.append("user_id", this.state.userId);
            params.append("token", this.state.userToken);
            if(this.state.buy_type == "goldcoin") {
                var buy_count_array = [];
                for(i = 0; i < this.state.buy_count_array.length; i ++) {
                    buy_count_array.push(this.state.buy_count_array[i].toString());
                }
                params.append("textinput", JSON.stringify([this.state.buy_id_array, buy_count_array]));
            }
            if(pay_type == "saved_card") {
                params.append("card_status", 'saved');
                params.append("cvv", this.state.selected_card_cvv);
                if(this.state.buy_type == "goldcoin") {
                    params.append("hdn_goldcoins_planid", this.state.buy_id_array[0]);
                } else if(this.state.buy_type == "upgrade_member_plan" || this.state.buy_type == "downgrade_member_plan") {
                    params.append("hdn_membership_planid", this.state.upgrade_member_id);
                }
                for(i = 0; i < this.state.cards_list.length; i ++) {
                    if(this.state.cards_list[i].default == true) {
                        params.append("payment_id", this.state.cards_list[i].paymentProfileId);
                        break;
                    }
                }
            } else if(pay_type == "new_card") {
                params.append("card_status", 'new');
                params.append("cvv", this.state.card_cvv);
                if(this.state.buy_type == "goldcoin") {
                    params.append("hdn_goldcoins_planid", this.state.buy_id_array[0]);
                } else if(this.state.buy_type == "upgrade_member_plan" || this.state.buy_type == "downgrade_member_plan") {
                    params.append("hdn_membership_planid", this.state.upgrade_member_id);
                } 
                params.append("card_number", this.state.card_number);
                params.append("card_first_name", this.state.card_holder_first_name);
                params.append("card_last_name", this.state.card_holder_last_name);
                params.append("expiry_month", this.state.card_expiry_month);
                params.append("expiry_year", this.state.card_expiry_year);
            }
                        
            console.log("url: " + uri);
            console.log("parameter: " + JSON.stringify(params));

            WebService.callServicePost(uri, params, this.handlepurchaseGoldCoinResponse);

        } catch(e){
            console.log(e)
            this.setState({
                loading: false
            });
        }
    }

    handlepurchaseGoldCoinResponse = (response, isError)=>{
        console.log("purchaseGoldCoin:::" + JSON.stringify(response))
        if(response != null) {
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

                if(this.state.buy_type == "upgrade_member_plan") {
                    AsyncStorage.setItem(Constants.KEY_MEMBER_PLAN, this.state.upgrade_member_id);
                }

                if(this.props.route.params) {
                    if(this.props.route.params.getDataAgain) {
                        this.props.route.params.getDataAgain();
                    }
                }
                this.props.navigation.goBack(); 
            } else {
                if(this.state.buy_type == "upgrade_member_plan" || this.state.buy_type == "downgrade_member_plan") {
                    Alert.alert(Constants.FAILED_MEMBERPLAN, "");
                }
            }
                      
        }

        this.setState({
            loading: false
        });
    }

    openProfileScreen = () => {
        this.hidePopupView()
        this.props.navigation.navigate("MyProfile", {
            refreshProfileImage: this.refreshProfileImage
        })
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

    deleteCardConfirm() {
        Alert.alert(
            Constants.DELETE_CARD_ALERT_TITLE,
            Constants.DELETE_CARD_ALERT_MESSAGE,
            [
              {text: 'Cancel', onPress: () => console.log('Ask me later pressed')},
              {text: 'OK', onPress: () => this.deleteCard()},
            ],
            {cancelable: false},
          );
    }

    deleteCard = async(item) => {
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
        } catch(e){
            this.setState({
                loading:false
            });
            console.log(error)
        }
    }

    handleDeleteCardResponse = async(response, isError) => {
        console.log(TAG + " callDeleteCardAPIs Response " + JSON.stringify(response));
        console.log(TAG + " callDeleteCardAPIs isError " + isError);

        if (!isError) {
            var result = response;
            if (result != undefined && result != null) {
                if(result.status.toUpperCase() == "success".toUpperCase()) {
                    Alert.alert(Constants.REMOVE_CARD_SUCCESS, "");
                    var cards_list = this.state.cards_list;
                    for(i == 0; i < cards_list.length; i ++) {
                        if(cards_list[i].paymentProfileId == this.state.selected_card.paymentProfileId) {
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

    setDefaultCard = async(item) => {
        this.setState({
            loading: true,
            selected_card: item
        });
        try {
            
            let uri = Memory().env == "LIVE" ? Global.URL_GET_MAKE_DEFAULT_CARD : Global.URL_GET_MAKE_DEFAULT_CARD_DEV;
            let params = new FormData();
            params.append("format", "json");
            params.append("user_id", this.state.userId);
            params.append("token", this.state.userToken);
            params.append("payment_id", item.paymentProfileId);
            console.log(TAG + "callSetDefaultCardAPIs uri " + uri);
            console.log(TAG + "callSetDefaultCardAPIs params>>>" + JSON.stringify(params));
            WebService.callServicePost(uri, params, this.handleSetDefaultCardResponse);
        } catch(e){
            this.setState({
                loading:false
            });
            console.log(error)
        }
    }

    handleSetDefaultCardResponse = async(response, isError) => {
        console.log(TAG + " callSetDefaultCardAPIs Response " + JSON.stringify(response));
        console.log(TAG + " callSetDefaultCardAPIs isError " + isError);

        if (!isError) {
            var result = response;
            if (result != undefined && result != null) {
                if(result.status.toUpperCase() == "success".toUpperCase()) {
                    var cards_list = this.state.cards_list;
                    var default_card_index = -1;
                    var default_card = null;
                    for(i = 0; i < cards_list.length; i ++) {
                        if(cards_list[i].paymentProfileId == this.state.selected_card.paymentProfileId) {
                            cards_list[i].default = true;
                            default_card_index = i;
                            default_card = cards_list[i];
                        } else {
                            cards_list[i].default = false;
                        }
                    }
                    cards_list.splice(default_card_index, 1);
                    cards_list.unshift(default_card);
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

    renderPopupView = () => {
        return (
            <CustomPopupView
                showModel={this.state.showModel}
                openMyAccountScreen={(show_myaccount, myaccount_initial_tab) => {this.props.navigation.navigate('Dashboard', {selected_screen: "myaccount", myaccount_initial_tab: myaccount_initial_tab})}}
                logoutUser={this.logoutUser}
                closeDialog={() => { this.setState({ showModel: false }) }}
                prop_navigation = {this.props.navigation}
            >

            </CustomPopupView>
        );
    }

    _renderCardItem = (item, index) => {
        return(
            <View style = {{width: '100%', alignItems: 'center'}}>
            {
                item.save_card_index == true &&
                <View style = {{width: '100%', justifyContent:'center', alignItems: 'center'}}>
                    <TouchableOpacity style = {[styles.credit_card_view]} onPress={() => this.purchaseWithSavedCard(item)} activeOpacity = {Global.activeOpacity}>
                        <View style={{width:'100%', height: '100%', justifyContent: 'space-between', padding: 10, overflow:'hidden'}}>
                            <Text style={[{color:'#777778', fontSize:14,textAlign:'right'},stylesGlobal.font]} numberOfLines={1}>{(item.cardType).toUpperCase()}</Text>
                            <View style={{paddingTop:10}}>
                                <Image source={require('../icons/card-chip.png')} style={{width:50,height:50,resizeMode:'contain',}}/>

                                <Text style={[{color:'#efefef',
                                            fontSize:22,
                                            textAlign: 'center',
                                            textShadowColor:'#929292',
                                            textShadowOffset:{width: 1, height: 1},
                                        textShadowRadius:1,},stylesGlobal.font_bold]}
                                        >XXXX  XXXX  XXXX  {item.last4}
                                </Text>
                                <View style = {{width: '100%', flexDirection: 'row'}}>
                                    <View style = {{flex: 1}}>
                                        <View style={{width:'100%',justifyContent:'space-between', marginTop:10, flexDirection:'row'}}>
                                            <Text style={[{color:'#777778'},stylesGlobal.font]}>
                                                {item.last4}
                                            </Text>
                                            <Text style={[{color:'#777778',fontSize:14},stylesGlobal.font]}>
                                                MONTH/YEAR
                                            </Text>
                                        </View>
                                        <View style={{width:'100%',
                                                    justifyContent:'space-between',
                                                    flexDirection:'row',
                                                    alignItems:'center', marginTop: 10}}>
                                            <View style={{flexDirection:'row', justifyContent:'center', alignItems: 'center'}}>
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
                                                <TouchableOpacity style = {[styles.action_button]} onPress={()=>this.deleteCardConfirm(item)}>
                                                    <Image style={{width: 25, height: 25, resizeMode:'contain',}} source={require('../icons/ic_delete.png')}/>
                                                    <Text style={[styles.action_button_text, stylesGlobal.font]}>Delete</Text>
                                                </TouchableOpacity>
                                            </View>
                                            <View style = {{flexDirection:'row', alignItems: 'center'}}>
                                                <Text style={[{color:'#777778',
                                                            fontSize:14,marginRight:10},stylesGlobal.font]}>
                                                            EXPIRES
                                                </Text>
                                                <Text style={[{color:'#efefef',
                                                                fontSize:18,
                                                                fontWeight:'bold',
                                                                textShadowColor:'#929292',
                                                                textShadowOffset:{width: 1, height: 1},
                                                                textShadowRadius:1,},stylesGlobal.font]}>
                                                    {item.expirationDate}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>
                                {
                                    item.default == true &&
                                    <View style = {{width: 100, alignItems: 'flex-end', justifyContent: 'center'}}>
                                        <View style = {{flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end'}}>
                                            <Text style={[{color:'#777778'}, stylesGlobal.font]}>CVV</Text>
                                            <TextInput style={[{color:'#777778', fontSize: 16, width: 50, height: 30, marginLeft: 5, backgroundColor: Colors.white}, stylesGlobal.font]} keyboardType = {'number-pad'} maxLength={4} onChangeText = {(text) => this.setState({selected_card_cvv: text})}>
                                                {this.state.selected_card_cvv}
                                            </TextInput>
                                        </View>
                                    </View>
                                }
                                </View>
                            </View>
                        </View>
                    </TouchableOpacity>
                </View>
            }
            {
                item.amazon_pay_index == true &&
                <View style = {{width: '100%', justifyContent:'center', alignItems: 'center'}}>
                    <TouchableOpacity style = {styles.credit_card_view} activeOpacity = {Global.activeOpacity}>
                        <View style={{ width:'100%', height: '100%', justifyContent: 'center', alignItems: 'center'}}>
                            <Image style = {{width: "50%", height: "50%", resizeMode: 'contain'}} source={require('../icons/pay-amazon.png')}></Image>
                        </View>
                        <TouchableOpacity style = {[styles.action_button, {position: 'absolute', left: 20, bottom: 10, zIndex: 10}]}>
                            <View>
                                <Image source={require('../icons/square.png')} style={{width:20, height:20}} />
                            {
                                item.default == true &&
                                <Image style={{width: 20, height: 20, position: 'absolute', bottom: 0, left: 0}} source={require('../icons/checked.png')}/> 
                            }
                            </View>
                            <Text style={[styles.action_button_text, stylesGlobal.font]}>Default</Text>
                        </TouchableOpacity>
                    </TouchableOpacity>
                </View>
            }
            {
                item.apple_pay_index == true &&
                <View style = {{width: '100%', justifyContent:'center', alignItems: 'center'}}>
                    <TouchableOpacity style = {styles.credit_card_view} activeOpacity = {Global.activeOpacity} onPress = {() => this.apple_pay()}>
                        <View style={{ width:'100%', height: '100%', justifyContent: 'center', alignItems: 'center'}}>
                            <Image style = {{width: "50%", height: "50%", resizeMode: 'contain'}} source={require('../icons/pay-apple.png')}></Image>
                        </View>
                        <TouchableOpacity style = {[styles.action_button, {position: 'absolute', left: 20, bottom: 10, zIndex: 10}]}>
                            <View>
                                <Image source={require('../icons/square.png')} style={{width:20, height:20}} />
                            {
                                item.default == true &&
                                <Image style={{width: 20, height: 20, position: 'absolute', bottom: 0, left: 0}} source={require('../icons/checked.png')}/> 
                            }
                            </View>
                            <Text style={[styles.action_button_text, stylesGlobal.font]}>Default</Text>
                        </TouchableOpacity>
                    </TouchableOpacity>
                </View>
            }
            {
                item.google_pay_index == true &&
                <View style = {{width: '100%', justifyContent:'center', alignItems: 'center'}}>
                    <TouchableOpacity style = {styles.credit_card_view} activeOpacity = {Global.activeOpacity} >
                        <View style={{ width:'100%', height: '100%', justifyContent: 'center', alignItems: 'center' }}>
                            <Image style = {{width: "50%", height: "50%", resizeMode: 'contain'}} source={require('../icons/pay-google.png')}></Image>
                        </View>
                        <TouchableOpacity style = {[styles.action_button, {position: 'absolute', left: 20, bottom: 10, zIndex: 10}]}>
                            <View>
                                <Image source={require('../icons/square.png')} style={{width:20, height:20}} />
                            {
                                item.default == true &&
                                <Image style={{width: 20, height: 20, position: 'absolute', bottom: 0, left: 0}} source={require('../icons/checked.png')}/> 
                            }
                            </View>
                            <Text style={[styles.action_button_text, stylesGlobal.font]}>Default</Text>
                        </TouchableOpacity>
                    </TouchableOpacity>
                    <View style={{width: '100%', height: 50, marginTop: 20, justifyContent: 'center', alignItems: 'center'}}></View>
                </View>
            }
            {
                item.paypal_pay_index == true &&
                <View style = {{width: '100%', justifyContent:'center', alignItems: 'center'}}>
                    <TouchableOpacity style = {styles.credit_card_view} activeOpacity = {Global.activeOpacity} onPress = {() => this.paypal_pay()}>
                        <View style={{ width:'100%', height: '100%', justifyContent: 'center', alignItems: 'center' }}>
                            <Image style = {{width: "50%", height: "50%", resizeMode: 'contain'}} source={require('../icons/pay-paypal.png')}></Image>
                        </View>
                        <TouchableOpacity style = {[styles.action_button, {position: 'absolute', left: 20, bottom: 10, zIndex: 10}]}>
                            <View>
                                <Image source={require('../icons/square.png')} style={{width:20, height:20}} />
                            {
                                item.default == true &&
                                <Image style={{width: 20, height: 20, position: 'absolute', bottom: 0, left: 0}} source={require('../icons/checked.png')}/> 
                            }
                            </View>
                            <Text style={[styles.action_button_text, stylesGlobal.font]}>Default</Text>
                        </TouchableOpacity>
                    </TouchableOpacity>
                </View>
            }
            {
                item.new_card_index == true &&
                <View style = {{width: '100%', justifyContent:'center', alignItems: 'center'}}>
                    <View style = {styles.credit_card_view}>
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
                                        {/* <TextInput style = {[{width:'100%', paddingLeft: 5, height:'100%'}, stylesGlobal.font, ]} keyboardType = 'number-pad' placeholder = '1234 5678 9012 3456' onChangeText = {(text) => this.onChangeCardNumberText(text)}>{this.state.card_number}</TextInput> */}
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
                                            style = {[styles.expiry_text, stylesGlobal.font]} 
                                            keyboardType = {Platform.OS === 'ios' ? 'ascii-capable' : 'visible-password'} 
                                            autoCorrect = {false} 
                                            textContentType = "oneTimeCode" 
                                            placeholder = 'Name' 
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
                                    {/*     <TextInput style = {[styles.expiry_text, stylesGlobal.font]} keyboardType = {Platform.OS === 'ios' ? 'ascii-capable' : 'visible-password'} autoCorrect = {false} textContentType = "oneTimeCode" placeholder = 'Last Name' onChangeText = {(text) => this.setState({card_holder_last_name: text})}>{this.state.card_holder_last_name}</TextInput> */}
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
                                                style={[styles.expiry_text, stylesGlobal.font]}
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
                                                    style={[styles.expiry_text, stylesGlobal.font]}
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
                                                    style={[styles.expiry_text, stylesGlobal.font]}
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
                                    <TouchableOpacity style={[styles.button_style, stylesGlobal.shadow_style]} onPress={() => this.purchaseWithNewCard()}>
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

    render() {
        return (
            <Fragment>
                < SafeAreaView style={{flex:0,backgroundColor:Colors.black}} />
                <SafeAreaView style={{backgroundColor:Colors.black,flex:1, alignItems: 'center'}}>
                    {this.renderHeaderView()}
                    {this.renderBannerView()}
                    {this.renderPopupView()}
                { 
                    this.state.loading &&
                    <ProgressIndicator/>
                }
                    <View style = {styles.card_view}>
                        <View style={styles.title_header}>
                            <Text style={[styles.headText, stylesGlobal.font]}>MEMBERSHIP</Text>
                        </View>
                        <View style = {{ flex: 1, width: '100%'}}>
                            <KeyboardAwareScrollView keyboardShouldPersistTaps = "handled" style = {{flex: 1, width: '100%', paddingTop: 20}}>
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
                                !this.state.loading &&
                                <View style = {{width: '100%', paddingTop: 20, paddingBottom: 40, alignItems: 'center'}}>
                                    <TouchableOpacity style={[styles.button_style, stylesGlobal.shadow_style]} onPress={()=> this.setState({see_more_payment_option: !this.state.see_more_payment_option})} >
                                        <Text style={[styles.button_text, stylesGlobal.font_semibold]}>
                                            {this.state.see_more_payment_option ? "See More Payment Options" : "See Less Payment Options"}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            }
                            </KeyboardAwareScrollView>
                        </View>
                    </View>
                </SafeAreaView>
            </Fragment>
        );
    }

    renderBannerView = () => {
        return (
            <BannerView
                screenProps = {this.props.navigation}
            />
        )
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


    renderHeaderView = () => {
  
        let imageUrl = this.state.userImagePath + Constants.THUMB_FOLDER + this.state.userImageName;
        return (
            <View style={[stylesGlobal.headerView]}>
                <TouchableOpacity style={stylesGlobal.header_backbuttonview_style} 
                    onPress={() => {
                        if(this.props.route.params) {
                            if(this.props.route.params.getDataAgain) {
                                this.props.route.params.getDataAgain();
                            }
                        }
                        this.props.navigation.goBack()}
                    }
                >
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
        width: "100%",
        height: "100%",
        backgroundColor: Colors.black,

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
    credit_card_view: {
        width: '95%',
        // aspectRatio: 1.6,
        height: 220,
        marginBottom: 10,
        alignItems: 'center',
        backgroundColor:'#FFFFFF',
        borderRadius: 10,
        borderWidth: 0.5,
        borderColor: Colors.gray,
        shadowColor: Colors.white,
        shadowOffset: {
            width: 0,
            height: 0
        },
        shadowRadius: 7,
        shadowOpacity: 7.0,
        
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
        backgroundColor:Colors.gold,
    },
    count_textview: {
        width: '50%', 
        height: '100%', 
        fontSize: 12,
        borderWidth: 1, 
        borderColor: Colors.gold, 
        textAlign: 'center', 
        marginLeft: 2, 
        marginRight: 2
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
