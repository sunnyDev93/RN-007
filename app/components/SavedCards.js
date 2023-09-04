import React, { Component, Fragment } from "react";
import {
    Alert,
    Platform,
    StyleSheet,
    SafeAreaView,
    View,
    TouchableOpacity,
    Image,
    TextInput,
    Text,
    Dimensions,
    FlatList,
    ScrollView
} from "react-native";

import { Colors } from "../consts/Colors";
import { Constants } from "../consts/Constants";
import { stylesGlobal, STICKY_HEADER_HEIGHT } from '../consts/StyleSheet'
import Memory from '../core/Memory';
import * as Global from "../consts/Global";
import WebService from "../core/WebService";
import ProgressIndicator from "./ProgressIndicator";
import { KeyboardAwareScrollView, KeyboardAwareFlatList } from 'react-native-keyboard-aware-scroll-view';
import AsyncStorage from '@react-native-community/async-storage';
import { EventRegister } from 'react-native-event-listeners';


import Autocomplete from 'react-native-autocomplete-input';

import AutoCompleteInput from './AutoCompleteInput';


var card_valid_check = require('card-validator');

var TAG = "SavedCards";

export default class SavedCards extends React.Component {

    constructor(props) {

        super(props)

        this.state = {
            userId: "",
            userToken: "",
            userSlug: "",
            userImagePath: "",
            userImageName: "",
            member_plan: "",
            is_verified: "",

            showModel: false,

            first_loading: true,
            loading: false,
            cards_list: [],
            add_button_status: false, /// when add card true, no add card false

            card_type: '', //visa, mastercard, american-express, discover, jcb, diners-club, maestro
            CardValid: false,
            card_number: '',
            card_holder_first_name: '',
            card_holder_last_name: '',
            card_expiry_month: '',
            card_expiry_year: '',
            card_cvv: '',

            selected_card: null,

            is_portrait: true,

            filteredCards:[],
            cardNumbers:[],

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
                member_plan: member_plan,
                is_verified: is_verified,

            });
        } catch (error) {
            // Error retrieving data
            return;
        }

        this.getSavedCards();
    };
// 
//     findCard(query){
//         // Method called every time when we change the value of the input
//         if (query) {
//           // Making a case insensitive regular expression
//           const regex = new RegExp(`${query.trim()}`, 'i');
//           // Setting the filtered film array according the query
// 
//           console.log('----------->    Saved cards ', this.state.cardNumbers)
// 
//           var filtered = this.state.cardNumbers.filter((item) => item.search(regex) >= 0);
// 
//           this.setState({filteredCards: filtered});
// 
//           // setFilteredFilms(
//           //     films.filter((film) => film.title.search(regex) >= 0)
//           // );
//         } else {
//           // If the query is null then return blank
// 
//           this.setState({filteredCards:[]})
//         }
//     };


    getSavedCards() {
        try {

            this.setState({
                loading: true
            });

            let uri = Memory().env == "LIVE" ? Global.URL_GET_SAVEDCARDS : Global.URL_GET_SAVEDCARDS_DEV;
            let params = new FormData();
            params.append("token", this.state.userToken);
            params.append("user_id", this.state.userId);
            params.append("format", "json");
            
            console.log(TAG + " callgetSavedCardsAPI uri " + uri);
            console.log(TAG + " callgetSavedCardsAPI params " + JSON.stringify(params));

            WebService.callServicePost(uri, params, this.handleGetSavedCards);
        } catch (error) {
            console.log(TAG + " callgetSavedCardsAPI error " + error);
            this.setState({
                loading: false,
                first_loading: false
            });
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }

        
    }

    handleGetSavedCards = (response, isError) => {
        console.log(TAG + " callgetSavedCardsAPI Response " + JSON.stringify(response));
        console.log(TAG + " callgetSavedCardsAPI isError " + isError);

        if (!isError) {
            var result = response;
            if (result != undefined && result != null) {
                if(result.status == "success") {
                    if(result.data != null) {
                        for(i = 0; i < result.data.length; i ++) {
                            result.data[i].saved_card_index = true;
                        }

                        // result.data.push({
                        //     amazon_pay_index: true
                        // });
                        // result.data.push({
                        //     paypal_pay_index: true
                        // });
                        // if(Platform.OS == "ios") {
                        //     result.data.push({
                        //         apple_pay_index: true
                        //     });
                        // } else if(Platform.OS == "android") {
                        //     result.data.push({
                        //         google_pay_index: true
                        //     });
                        // }
                        result.data.push({
                            new_card_index: true
                        });

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
                        console.log(TAG, 'cardNumbers', tmpCardNumbers);
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
        console.log(text + "    " + JSON.stringify(card_valid_data))
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

    saveCard() {
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
            console.log(TAG + " callAddCreditCardAPI error " + error);
            this.setState({
                loading: false,
                first_loading: false
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
                    this.setState({
                        first_loading: true,
                        cards_list: []
                    }, () => this.getSavedCards())
                    EventRegister.emit(Constants.EVENT_ADD_CREDIT_CARD, '');
                } else {
                    Alert.alert("Your card is not saved. Please try again", "");
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

    deleteCardConfirm = (item)=>{
        Alert.alert(
            Constants.DELETE_CARD_ALERT_TITLE,
            Constants.DELETE_CARD_ALERT_MESSAGE,
            [
              {text: 'Cancel', onPress: () => console.log('Ask me later pressed')},
              {text: 'OK', onPress: () => this.deleteCard(item)},
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
                    this.setState({
                        first_loading: true,
                        cards_list: []
                    }, () => this.getSavedCards())
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
                    for(i = 0; i < cards_list.length; i ++) {
                        if(cards_list[i].paymentProfileId == this.state.selected_card.paymentProfileId) {
                            cards_list[i].default = true;
                        } else {
                            cards_list[i].default = false;
                        }
                    }
                    this.setState({
                        selected_card: null,
                        cards_list: cards_list
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

    add_button_action = () => {
        if(this.state.add_button_status) {
            this.setState({
                add_button_status: false,
                card_number: '',
                card_holder_first_name: '',
                card_holder_last_name: '',
                card_expiry_year: '',
                card_cvv: '',

                card_type: '', 
                CardValid: false,
            })
        } else {
            this.setState({
                add_button_status: true
            })
        }
    }

    _renderCardItem = (item, index) => {
        return(
            <View style = {{width: '100%', alignItems: 'center'}}>
            {
                item.saved_card_index == true &&
                <View style = {{width: '100%', justifyContent:'center', alignItems: 'center'}}>
                    <View style = {[stylesGlobal.credit_card_view]} onPress={() => this.setDefaultCard(item)} activeOpacity = {Global.activeOpacity}>
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
                                        <Text style={[styles.action_button_text, stylesGlobal.font]}>Default</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style = {[styles.action_button]} onPress={()=>this.deleteCardConfirm(item)}>
                                        <Image style={{width: 25, height: 25, resizeMode:'contain',}} source={require('../icons/ic_delete.png')}/>
                                        <Text style={[styles.action_button_text, stylesGlobal.font]}>Delete</Text>
                                    </TouchableOpacity>
                                </View>
                                {/* <View style = {{height: '100%', justifyContent:'flex-end', }}>
                                    <Text style={[{color:'#777778', fontSize:14}, stylesGlobal.font]}>CVV</Text>
                                    <TextInput style={[{color:'#777778', fontSize: 14, width: 50, height: 30, marginTop: 5, backgroundColor: Colors.white, borderRadius: 5, borderWidth: 1, borderColor: Colors.gray}, stylesGlobal.font]} placeholder = {'CVV'} keyboardType = {'number-pad'} maxLength={4} onChangeText = {(text) => this.setState({selected_card_cvv: text})}>
                                        {this.state.selected_card_cvv}
                                    </TextInput>
                                </View> */}
                                <View style = {{height: '100%', justifyContent: 'flex-end', alignItems: 'flex-end'}}>
                                    <Text style={[{color:'#777778',fontSize:14},stylesGlobal.font]}>MONTH/YEAR</Text>
                                    <View style = {{flexDirection: 'row', alignItems: 'center', marginTop: 10,}}>
                                        <Text style={[{color: '#777778', fontSize:14,},stylesGlobal.font]}>{"EXPIRES: "}</Text>
                                        <Text style={[{color: '#efefef', fontSize:22, textShadowColor:'#929292', textShadowOffset:{width: 1, height: 1}, textShadowRadius:1}, stylesGlobal.font_bold]}>{"XX/XX"}</Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                    </View>
                </View>
            }
            {
                item.amazon_pay_index == true &&
                <View style = {{width: '100%', justifyContent:'center', alignItems: 'center'}}>
                    <View style = {styles.credit_card_view} activeOpacity = {Global.activeOpacity}>
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
                    </View>
                </View>
            }
            {
                item.apple_pay_index == true &&
                <View style = {{width: '100%', justifyContent:'center', alignItems: 'center'}}>
                    <View style = {styles.credit_card_view} activeOpacity = {Global.activeOpacity} onPress = {() => this.apple_pay()}>
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
                    </View>
                </View>
            }
            {
                item.google_pay_index == true &&
                <View style = {{width: '100%', justifyContent:'center', alignItems: 'center'}}>
                    <View style = {styles.credit_card_view} activeOpacity = {Global.activeOpacity} >
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
                    </View>
                    <View style={{width: '100%', height: 50, marginTop: 20, justifyContent: 'center', alignItems: 'center'}}></View>
                </View>
            }
            {
                item.paypal_pay_index == true &&
                <View style = {{width: '100%', justifyContent:'center', alignItems: 'center'}}>
                    <View style = {styles.credit_card_view} activeOpacity = {Global.activeOpacity} onPress = {() => this.paypal_pay()}>
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
                    </View>
                </View>
            }
            {
                item.new_card_index == true &&
                <View style = {{width: '100%', justifyContent:'center', alignItems: 'center'}}>
                    <View style = {styles.credit_card_view}>
                        <View style = {{width: '100%', height: '100%', justifyContent: 'space-between', padding: 10}}>
                            <View style = {{width: '100%',  zIndex: 100}}>
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
                                        

                                        {/* <Autocomplete */}
                                        {/*   autoCapitalize="none" */}
                                        {/*   autoCorrect={false} */}
                                        {/*   style={{width: '100%', height: '100%', zIndex: 11, opacity: 1}} */}
                                        {/*   containerStyle={[{width: '100%', margin: 0, padding: 0}, stylesGlobal.font, ]} */}
                                        {/*   // Data to show in suggestion */}
                                        {/*   data={this.state.filteredCards} */}
                                        {/*   // Default value if you want to set something in input */}
                                        {/*   defaultValue={ */}
                                        {/*     */}
                                        {/*     this.state.card_number */}
                                        {/*   } */}
                                        {/*   // Onchange of the text changing the state of the query */}
                                        {/*   // Which will trigger the findFilm method */}
                                        {/*   // To show the suggestions */}
                                        {/*     onChangeText={(text) => {this.findCard(text); this.setState({card_number: text}); this.onChangeCardNumberText(text)}} */}
                                        {/*     placeholder="1234 5678 9012 3456" */}
                                        {/*     keyboardType = 'number-pad'  */}
                                        {/*     flatListProps={{ */}
                                        {/*         keyboardShouldPersistTaps: 'always', */}
                                        {/*         renderItem: ({item, index}) => ( */}
                                        {/*             // For the suggestion view */}
                                        {/*             <TouchableOpacity */}
                                        {/*                 key={index} */}
                                        {/*                 style={{zIndex: 101, opacity: 1}} */}
                                        {/*                 onPress={() => { */}
                                        {/*                     this.setState({card_number: item, filteredCards: []}); */}
                                        {/*                     this.onChangeCardNumberText(item) */}
                                        {/*                 }} */}
                                        {/*             > */}
                                        {/*               <View style={{ width: '100%', backgroundColor: 'white', zIndex: 100, height: 30}}> */}
                                        {/*                   <Text style={{ */}
                                        {/*                     fontSize: 15, */}
                                        {/*                     paddingTop: 5, */}
                                        {/*                     paddingBottom: 5, */}
                                        {/*                     margin: 2, */}
                                        {/*                     }}> */}
                                        {/*                       {item} */}
                                        {/*                   </Text> */}
                                        {/*               </View> */}
                                        {/*                */}
                                        {/*             </TouchableOpacity> */}
                                        {/*           ) */}
                                        {/*     }} */}
                                        {/*     listContainerStyle={{ */}
                                        {/*         left: 0, */}
                                        {/*         opacity: 1, */}
                                        {/*         right: 0, */}
                                        {/*         backgroundColor: 'white', */}
                                        {/*         zIndex: 100, */}
                                        {/*       }} */}
                                        {/* /> */}


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
                                            autoCompleteType={'cc-number'} 
                                            textContentType={'creditCardNumber'} 
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
                                    {/*     <TextInput style = {[{width:'100%',paddingTop:5 ,paddingLeft: 5, height:'100%'},styles.expiry_text, stylesGlobal.font]} keyboardType = {Platform.OS === 'ios' ? 'ascii-capable' : 'visible-password'}  autoCorrect = {false} textContentType = "oneTimeCode" placeholder = 'Last Name' onChangeText = {(text) => this.setState({card_holder_last_name: text})}>{this.state.card_holder_last_name}</TextInput> */}
                                    {/* </View> */}
                                </View>
                            </View>
                            <View style = {{width: '100%',  flexDirection: 'row', justifyContent: 'space-between'}}>
                                <View style = {{flex: 1, flexDirection: 'row', justifyContent: 'space-between'}}>
                                    <View style = {{width: '30%'}}>
                                        <Text style={[styles.new_card_input_title_text, {marginTop:10},stylesGlobal.font]}> CVV:</Text>
                                        <View style = {{width: '100%', height: 30, marginTop:5,}}>
                                            <TextInput
                                                placeholder='3~4 digits'
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
                                    <TouchableOpacity style={[styles.button_style, stylesGlobal.shadow_style]} onPress={() => this.saveCard()}>
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
                <SafeAreaView style={{flex:0,backgroundColor:Colors.black}} />
                <SafeAreaView style={styles.container}>
                {
                    this.state.loading && <ProgressIndicator/>
                }
                    <View style = {styles.card_view}>
                    
                        <View style={styles.title_header}>
                            <Text style={[styles.headText, stylesGlobal.font]}>PAYMENT</Text>
                        </View>
                        
                        <View style = {{ flex: 1, width: '100%'}}>
                        <ScrollView style = {{width: '100%'}}>
                            <KeyboardAwareFlatList 
                                ListHeaderComponent = {this.state.pulldown_loading && <PullDownIndicator/>}
                                ListFooterComponent={this.state.displayLoadMoreView == true ? footerView : null}
                                extraData={this.state}
                                // pagingEnabled={false}
                                showsHorizontalScrollIndicator={false}
                                showsVerticalScrollIndicator={false}
                                data={this.state.cards_list}
                                keyExtractor={(item, index) => index.toString()}
                                style = {{width: '100%', paddingVertical: 20}}
                                numColumns = {this.state.is_portrait ? 1 : 2}
                                key = {this.state.is_portrait ? 1 : 2}
                                renderItem={({ item, index }) => (
                                    <View key = {index} style = {{width: this.state.is_portrait ? '100%' : '50%', alignItems: 'center'}}>
                                        {this._renderCardItem(item, index)}
                                    </View>
                                )}
                                onMomentumScrollBegin={() => { this.onEndReachedCalledDuringMomentum = false; }}
                                onEndReachedThreshold={0.5}
                            >
                            </KeyboardAwareFlatList>
                            </ScrollView>
                        </View>
                        
                    </View>
                </SafeAreaView>
            </Fragment>
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
        justifyContent: 'center'
    },
    card_view: {
        width: '90%',
        height: '90%',
        alignItems: 'center',
        backgroundColor: Colors.white,
        borderRadius: 10,
        shadowColor: Colors.white,
        shadowOffset: {
            width: 0,
            height: 0
        },
        shadowRadius: 7,
        shadowOpacity: 7.0,
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
    },
     itemText: {
        fontSize: 15,
        paddingTop: 5,
        paddingBottom: 5,
        margin: 2,
    },
    // title_header: { 
    //     width: '100%', 
    //     height: 40, 
    //     justifyContent: 'center', 
    //     alignItems: 'center', 
    //     backgroundColor: Colors.card_titlecolor 
    // },
    // headText: {
    //     color: Colors.gold,
    //     fontSize: 18,
    //     // fontWeight: 'bold'
    // },
    // input_component_view: {
    //     width: '100%', 
    //     marginBottom: 5, 
    // },
    // input_title_text: {
    //     color: Colors.black,
    //     fontSize: 14,
    //     marginBottom: 3,
    // },
    // input_text_view: {
    //     width: '100%', 
    //     height: 40, 
    //     marginBottom: 5,
    //     borderColor: Colors.black,
    //     borderWidth: 0.5, 
    //     paddingLeft: 5, 
    //     paddingRight: 5
    // },
    // button_style: {
    //     width: 100, 
    //     height: 30, 
    //     marginRight: 20, 
    //     justifyContent: 'center', 
    //     alignItems: 'center', 
    //     backgroundColor: Colors.gold, 
    //     borderRadius: 5
    // },
    // action_button: {
    //     // width: 60, 
    //     height: 50, 
    //     alignItems: 'center', 
    //     justifyContent: 'space-between', 
    //     marginRight: 10,
    //     marginTop: 5
    // },
    // action_button_text: {
    //     color: Colors.black, 
    //     fontSize: 12
    // }
});
