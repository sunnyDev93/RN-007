import React, { Component, Fragment } from 'react';
import {
    Platform,
    StyleSheet,
    Text,
    View,
    Image,
    TextInput,
    Dimensions,
    Alert,
    TouchableOpacity,
    Linking,
    ScrollView,
    SafeAreaView,
    Modal,
    KeyboardAvoidingView
    // FlatList,
    // ImageBackground,
    // Pressable,
    // Button
} from 'react-native';
import { TouchableOpacity as TouchableOpacity2 } from 'react-native-gesture-handler';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import DateTimePicker from "react-native-modal-datetime-picker";
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import Geocoder from "react-native-geocoder";
import ImagePicker from 'react-native-image-picker';
import ImageResizer from 'react-native-image-resizer';
import AsyncStorage from '@react-native-community/async-storage'; 
import PhoneInput from "react-native-phone-number-input";
import { removeCountryCode } from "../utils/Util";

import CountryPicker, { getAllCountries } from 'react-native-country-picker-modal';

import { AsYouType, parseNumber, parsePhoneNumberFromString, formatNumber  } from 'libphonenumber-js';
// import ModalPickerImage from './ModalPickerImage';
// import * as RNIap from 'react-native-iap';
import RNIap, {
    InAppPurchase,
    PurchaseError,
    SubscriptionPurchase,
    acknowledgePurchaseAndroid,
    consumePurchaseAndroid,
    finishTransaction,
    finishTransactionIOS,
    purchaseErrorListener,
    purchaseUpdatedListener,
    initConnection,
    endConnection,
    clearProductsIOS,
    clearTransactionIOS,
    getProducts,
    flushFailedPurchasesCachedAsPendingAndroid,
    requestSubscription

} from 'react-native-iap';
// import * as IAP from 'react-native-iap';
import { getParentsTagsRecursively } from 'react-native-render-html/src/HTMLUtils';

import * as ValidationUtils from "../utils/ValidationUtils";
import ProgressIndicator from "./ProgressIndicator";
import { Constants } from "../consts/Constants";
import { Colors } from "../consts/Colors";
import { stylesGlobal, STICKY_HEADER_HEIGHT } from '../consts/StyleSheet'
import WebService from "../core/WebService";
import * as Global from "../consts/Global";
import Moment from "moment/moment";
import moment from 'moment';
import Memory from '../core/Memory';
import images from "../images";
import { isIphoneX, getBottomSpace } from '../custom_components/react-native-iphone-x-helper';


var deviceToken = '';
const genderLabel = 'Gender';
const birthDateLabel = 'Birthday (mm/dd/yyyy)';
var location = "";
var TAG = "SignUpScreen";

 let purchaseUpdateSubscription;
 let purchaseErrorSubscription;
// 1 & 2 net or bdate
/*
    documentType:
        0: Valid proof of ID(proofID)
        1:
        2: proof of assets(assets)
        3: modeling publication(modeling)
        4: recent article(article)
*/

export default class SignUpScreen extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            loading: false,
            userId: "",
            memberTypes: [],
            isSecure: true,
            imageSource: '',
            firstname: "",
            lastname: "",
            password: "",
            email: "",
            netWorthValue: "",
            gender: 'Gender',
            valueDateOfBirth: "",
            isCheckTermConditions: false,
            set_Image_type: '',
            searchedAdress: '',
            isDateTimePickerVisible: false,
            gender_box_show: false,
            gender_view_y: 0,

            // entries: Global.entries,

            selected_entry: {},
            selected_entries: Global.entries,
            type_view_y: 0,
            type_box_show: false,

            doc_images: [],
            doc_image_type: [],
            proofID_doc: "",
            assets_doc: "",
            model_doc: "",
            article_doc: "",
            connection_doc: "",

            rich_gentleman_note: "Note: The minimum Net Worth to join The 0.07% as profile type “Rich” is $30M. Please supply proof (Brokerage account statement / certified Personal Financial Statement) to get your account activated. If you do not meet the eligibility criteria, feel free to select a different Profile Type.",

            signup_success: false,
            purchase_status: 0, // if success in app purchase then 1, fail: 0
            purchase_processing: false, // when start purchase it's true

            inapppurchase_response: null, // used for in app purchase verify
            isVisible: false, //state of modal default false  
            is_portrait: true,
            screen_width: Dimensions.get("window").width,

            verificationDigit: null,
            verified_email: "",
            verified_phone: '',
            phone: '',
            pickerData: null,
            visibleModalCountryFlag: false,
            countryName: "US",
            callingCode: "1",
            phoneNumber: "",
            verificationPhoneDigit: null,
        };

        this.onPressFlag = this.onPressFlag.bind(this);
        this.selectCountry = this.selectCountry.bind(this);
       
    }

    async UNSAFE_componentWillMount() {
        //Memory().env = "LIVE";
        // Memory().env = "DEV";
        if (Dimensions.get("window").width < Dimensions.get("window").height) {
            this.setState({
                is_portrait: true,
                screen_width: Dimensions.get("window").width,
            })
        } else {
            this.setState({
                is_portrait: false,
                screen_width: Dimensions.get("window").height,
            })
        }
        Dimensions.addEventListener("change", () => {
            if (Dimensions.get("window").width < Dimensions.get("window").height) {
                this.setState({
                    is_portrait: true,
                    screen_width: Dimensions.get("window").width,
                })
            } else {
                this.setState({
                    is_portrait: false,
                    screen_width: Dimensions.get("window").height,
                })
            }
        })
        for (i = 0; i < this.state.selected_entries.length; i++) {
            if (this.state.selected_entries[i].type == this.props.route.params.type) {
                this.setState({
                    selected_entry: this.state.selected_entries[i],
                }, () => console.log(TAG, 'selected_entry', this.state.selected_entry));
                break;
            }
        }
        this.getData();
    }

    async componentDidMount() {

         this.setState({
          pickerData: this.phone.getPickerData(),
        });


        try {
            console.log('test', initConnection); //  by prev inapp purchase
            const result = await initConnection();
            console.log('test    ', result);

            
                await flushFailedPurchasesCachedAsPendingAndroid();
            if (Platform.OS == "ios") {

            

            await clearProductsIOS();
            await clearTransactionIOS();
            }
            if (result) {
                try {
                    const products = await getProducts(Global.itemSkus);
                    console.log(Global.itemSkus)
                    console.log(products)
                    this.setState({ products });
                } catch (err) {
                    console.warn(err); // standardized err.code and err.message available
                }
                purchaseUpdateSubscription = purchaseUpdatedListener(async (purchase) => {
                    //console.log(TAG, 'purchaseUpdatedListener result = ', JSON.stringify(purchase));
                    if (this.state.signup_success) {
                        const receipt = purchase.transactionReceipt;
                        if (receipt) {
                            try {
                                if (Platform.OS === 'ios') {
                                    console.log("purchase success")
                                    if (this.state.purchase_processing) {
                                        this.setState({
                                            inapppurchase_response: purchase
                                        })
                                        await this.callMembershipPaidAPI(1, receipt);
                                        const ackResult = finishTransactionIOS(purchase.transactionId);
                                        this.setState({
                                            purchase_processing: false
                                        })
                                    }
                                } else if (Platform.OS === 'android') {
                                    //   // If consumable (can be purchased again)
                                    //   consumePurchaseAndroid(purchase.purchaseToken);
                                    //   // If not consumable
                                    //   acknowledgePurchaseAndroid(purchase.purchaseToken);
                                }
                            } catch (ackErr) {
                                console.log('ackErr', ackErr);
                            }
                        } else {
                            console.log("receipt error")
                        }
                    }
                })
                purchaseErrorSubscription = purchaseErrorListener((error) => {
                    console.log(TAG, 'purchaseErrorListener result = ', JSON.stringify(error))
                    if (this.state.signup_success) {
                        console.log('purchaseErrorListener', error);
                        this.setState({
                            loading: false,
                            purchase_processing: false
                        });
                        if (error != null && error.code == "E_USER_CANCELLED") {
                            Alert.alert("To continue with your profile selection, please proceed to membership fee payment.", "");
                        } else {
                            Alert.alert("Your payment did not go through.", "");
                        }
                        this.callMembershipPaidAPI(0, null);
                    }
                });
            }                                //  by prev inapp purchase end
        } catch (err) {
            console.log(err.code, err.message);
        }


       
    }

    onPressFlag() {
        // this.myCountryPicker.open();
        this.setState({visibleModalCountryFlag: true});
      }

      selectCountry(country) {
        this.phone.selectCountry(country.iso2);
      }

    componentWillUnmount() {
        if (purchaseUpdateSubscription) {                //  by prev inapp purchase
            purchaseUpdateSubscription.remove();
            purchaseUpdateSubscription = null;
        }
        if (purchaseErrorSubscription) {
            purchaseErrorSubscription.remove();
            purchaseErrorSubscription = null;
        }
        endConnection();                           //  by prev inapp purchase end
    }

    /**
    * get user stored information
    */
    getData = async () => {
        try {
            deviceToken = await AsyncStorage.getItem(Constants.FIREBASE_ID);
            console.log(TAG + " getData ::: " + deviceToken);

            let tmpEnv = await AsyncStorage.getItem('last_server');
            if(tmpEnv && tmpEnv != "")
                Memory().env = tmpEnv;
        } catch (error) {
            // Error retrieving data
        }
    };

    /**
    * display top header
    */
    renderHeaderView = () => {
        return (
            <View style={[stylesGlobal.headerView, { justifyContent: 'flex-start' }]}>
                <TouchableOpacity style={stylesGlobal.header_backbuttonview_style} onPress={() => this.props.navigation.goBack()}>
                    <Image style={stylesGlobal.header_backbuttonicon_style} source={require("../icons/icon_back.png")} />
                </TouchableOpacity>
                <TouchableOpacity style={stylesGlobal.header_logoview_style} onPress={() => this.props.navigation.navigate("SignInScreen")}>
                    <Image style={stylesGlobal.header_logo_style} source={require("../icons/logo_new.png")} />
                </TouchableOpacity>
            </View>
        );
    };

    renderCountryFlagModal = () => {
        // console.log('renderCountryFlagModal  = ', this.state.pickerData);
        return (
            <Modal
               animationType="fade"
                transparent={true}
                // closeOnClick={true}
               
                supportedOrientations={['portrait', 'landscape']}
               visible={this.state.visibleModalCountryFlag}
               onRequestClose={() => this.setState({ visibleModalCountryFlag: false })}
            >
                <KeyboardAvoidingView style={{ flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center'}} behavior={Platform.OS == "ios" ? "padding" : null} keyboardVerticalOffset={isIphoneX() ? getBottomSpace() + 15 : 18} enabled>
                    <View style={stylesGlobal.popup_bg_blur_view}></View>
                    <View style={stylesGlobal.popup_main_container}>
                        <View style={stylesGlobal.popup_title_view}>
                            <Text style={[stylesGlobal.popup_title_text, stylesGlobal.font]}>{"Select Country"}</Text>
                            <TouchableOpacity style={stylesGlobal.popup_cancel_button} onPress={() => this.setState({ visibleModalCountryFlag: false })}>
                                <Image style={stylesGlobal.cancel_delete_image} source={require('../icons/connection-delete.png')} />
                            </TouchableOpacity>
                        </View>
                        <View style={[stylesGlobal.popup_desc_container, {height: '80%'}]}>
                            <ScrollView 
                                    style={{width: "100%", height: '100%'}}
                                    ref="countriesScrollView"
                                >
                                    {this.state.pickerData && 
                                        this.state.pickerData.map((item, index) => {
                                            return <Text>{item.label}</Text>
                                        })
                                    }
                                </ScrollView>
                        </View>
                    </View>
                </KeyboardAvoidingView>
                   
            </Modal>
            )
    }

    render() {
        return (
            <Fragment>
                <SafeAreaView style={{ flex: 0, backgroundColor: Colors.black }} />
                <SafeAreaView style={{ flex: 1, backgroundColor: Colors.black }}>
                    <View style={styles.ParentViewContainerStyle} onStartShouldSetResponder={() => this.setState({ type_box_show: false, gender_box_show: false })}>
                        {this.renderHeaderView()}
                        <Image style={{
                            width: this.state.screen_width * 0.4,
                            height: this.state.screen_width * 0.4,
                            position: 'absolute',
                            zIndex: 10,
                            top: STICKY_HEADER_HEIGHT - 13, right: 3,
                            resizeMode: 'contain'
                        }} source={{ uri: this.state.selected_entry.tag }} />
                        <View style={{ flex: 1, marginLeft: 20, marginRight: 20, backgroundColor: Colors.white, borderRadius: 5, overflow: 'hidden' }}>
                            <View style={{ alignItems: 'center', width: '100%', height: 40, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.card_titlecolor }}>
                                <Text style={[styles.headText, stylesGlobal.font]}>{"Create Profile"}</Text>
                            </View>
                            <KeyboardAwareScrollView style={{ flex: 1, paddingLeft: 20, paddingRight: 20, }} extraScrollHeight={100} keyboardShouldPersistTaps='handled'>
                                {this.renderProfilePhoto()}
                                {this.renderSignUpForm()}
                                {this.renderUploadForm()}
                                {this.renderTermsAndConditionView()}
                            </KeyboardAwareScrollView>
                        </View>
                    </View>
                    {
                        this.renderSignUpButton()
                    }
                    {this.state.loading == true && <ProgressIndicator />}
                </SafeAreaView>
            </Fragment>
        );
    }

    showDateTimePicker = () => {
        this.setState({ isDateTimePickerVisible: true });
    };

    hideDateTimePicker = () => {
        this.setState({ isDateTimePickerVisible: false });
    };

    handleDatePicked = date => {
        this.setState({ valueDateOfBirth: Moment(date).format("MM/DD/YYYY") });
        console.log(Moment(date).format("MM/DD/YYYY"))
        this.hideDateTimePicker();
    };

    renderSignUpForm = () => {
        return (
            <View>
                <DateTimePicker
                    isVisible={this.state.isDateTimePickerVisible}
                    onConfirm={this.handleDatePicked}
                    onCancel={this.hideDateTimePicker}
                    date={this.state.valueDateOfBirth == birthDateLabel ? new Date(moment("06/15/1980", "MM/DD/YYYY")) : new Date(moment(this.state.valueDateOfBirth, "MM/DD/YYYY"))}
                    mode={"date"}
                />
                {
                    this.state.type_box_show &&
                    <View style={{ position: 'absolute', zIndex: 10, top: this.state.type_view_y, left: 0, right: 0, backgroundColor: Colors.white, padding: 5, paddingBottom: 0, borderColor: Colors.black, borderWidth: 0.5, borderRadius: 5 }}>
                        {
                            this.state.selected_entries.map((item, index) =>
                                <TouchableOpacity key={index} style={[styles.type_button_view,]}
                                    onPress={() => {
                                        this.setState({
                                            type_box_show: false,
                                        })
                                        if (this.state.selected_entry != item) {
                                            this.setState({
                                                selected_entry: item,
                                                doc_images: [],
                                                proofID_doc: "",
                                                assets_doc: "",
                                                model_doc: "",
                                                article_doc: "",
                                                connection_doc: "",
                                                doc_images: []
                                            }, () =>  console.log(TAG, 'selected_entry222', this.state.selected_entry))
                                        }
                                    }}
                                >
                                    <View style={[{ width: '100%', height: '100%', resizeMode: 'cover', alignItems: 'center', flexDirection: 'row' }, this.state.selected_entry.type == item.type ? { backgroundColor: Colors.gold } : { backgroundColor: Colors.black }]}>
                                        <View style={{ height: '100%', aspectRatio: 1, marginLeft: 10, marginRight: 10 }}>
                                            <Image style={{ width: '100%', height: '100%', resizeMode: 'contain' }} source={item.badge }></Image>
                                        </View>
                                        <Text style={[styles.LabelTextStyle, { fontSize: 15, color: Colors.white }, stylesGlobal.font]}>{item.name}</Text>
                                    </View>
                                </TouchableOpacity>
                            )
                        }
                    </View>
                }
                {
                    (this.state.selected_entry.type == "2" || this.state.selected_entry.type == "5" || this.state.selected_entry.type == "4") &&
                    <View style={{ width: '100%', height: 40, alignItems: 'center', justifyContent: 'center', marginTop: 20 }}>
                        <Text style={[{ fontSize: 16, color: Colors.gold, }, stylesGlobal.font_semibold]}>{"Membership fee  " + this.state.selected_entry.cost}</Text>
                    </View>
                }
                <View style={[styles.ViewContainerStyle, { borderColor: Colors.black, borderWidth: 0.5, borderRadius: 5, marginTop: 20 }]} onLayout={event => this.setState({ type_view_y: event.nativeEvent.layout.y })}>
                    <View style={[styles.TextLabelContainerStyle, { alignItems: 'flex-end', }]}>
                        <TouchableOpacity style={[{ alignItems: 'center', justifyContent: 'space-between', flex: 1, height: 40, flexDirection: 'row' }]}
                            onPress={() => {
                                this.setState({ type_box_show: !this.state.type_box_show, gender_box_show: false })
                            }}
                        >
                            <View style={{ height: '100%', flexDirection: 'row', alignItems: 'center' }}>
                                <Text style={[styles.LabelTextStyle, { fontSize: 13, backgroundColor: Colors.transparent, paddingLeft: 5, color: Colors.gold }, stylesGlobal.font]}>{"Member Type:  "}<Text style={{ color: Colors.black }}>{this.state.selected_entry.name}</Text></Text>
                                <View style={{ height: '100%', aspectRatio: 1, marginLeft: 5 }}>
                                    <Image style={{ width: '100%', height: '100%', resizeMode: 'contain' }} source={this.state.selected_entry.badge}></Image>
                                </View>
                            </View>
                            <Image style={{ width: 20, height: 20, resizeMode: 'contain', marginRight: 20 }} source={require('../icons/down_arrow.png')} />
                        </TouchableOpacity>
                    </View>
                </View>
                <View style={[styles.ViewContainerStyle, { backgroundColor: Colors.transparent }]}>
                    <View style={[styles.TextLabelContainerStyle, { alignItems: 'flex-end', }]}>
                        <TextInput
                            placeholderTextColor={Colors.gray}
                            placeholder='First Name'
                            onChangeText={firstname => this.setState({ firstname })}
                            value={this.state.firstname}
                            returnKeyType={"next"}
                            autoCapitalize='none'
                            defaultValue=""
                            multiline={false}
                            underlineColorAndroid="transparent"
                            style={[styles.TextInputStyle, stylesGlobal.font]}
                            onSubmitEditing={event => {
                                this.refs.InputLastName.focus();
                            }}
                            keyboardType='ascii-capable'
                        />
                    </View>
                </View>
                <View style={[styles.ViewContainerStyle, { backgroundColor: Colors.transparent, }]}>
                    <View style={[styles.TextLabelContainerStyle, { alignItems: 'flex-end', }]}>
                        <TextInput
                            ref="InputLastName"
                            placeholderTextColor={Colors.gray}
                            placeholder='Last Name'

                            onChangeText={lastname => this.setState({ lastname })}
                            value={this.state.lastname}
                            returnKeyType={"next"}
                            autoCapitalize='none'
                            defaultValue=""
                            multiline={false}
                            underlineColorAndroid="transparent"
                            style={[styles.TextInputStyle, stylesGlobal.font]}
                            onSubmitEditing={event => {
                                if (this.props.route.params.type == '1' || this.props.route.params.type == '2') {
                                    this.refs.InputNetWorth.focus();
                                } else {
                                    this.refs.InputEmail.focus();
                                }
                            }}
                            keyboardType='ascii-capable'
                        />
                    </View>
                </View>
                {
                    this.state.gender_box_show &&
                    <View style={{ position: 'absolute', zIndex: 10, top: this.state.gender_view_y + 40 + 10, left: 0, width: 150, height: 75, backgroundColor: '#ffffff', padding: 5, borderColor: '#000000', borderWidth: 0.5, borderRadius: 5 }}>
                        <TouchableOpacity style={[styles.gender_button_view, this.state.gender == "Female" ? { backgroundColor: Colors.gold } : { backgroundColor: '#000000' }]}
                            onPress={() => this.setState({
                                gender: "Female",
                                gender_box_show: false
                            })}
                        >
                            <View style={styles.gender_button_icon_view}>
                                <Image style={{ width: '100%', height: '70%', resizeMode: 'contain' }} source={require('../icons/signup_female.png')}></Image>
                            </View>
                            <View style={styles.gender_button_text_view}>
                                <Text style={[styles.LabelTextStyle, { fontSize: 15, color: '#ffffff', marginLeft: 10 }]}>Female</Text>
                            </View>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.gender_button_view, { marginTop: 5 }, this.state.gender == "Male" ? { backgroundColor: Colors.gold } : { backgroundColor: '#000000' }]}
                            onPress={() => this.setState({
                                gender: "Male",
                                gender_box_show: false
                            })}
                        >
                            <View style={styles.gender_button_icon_view}>
                                <Image style={{ width: '100%', height: '70%', resizeMode: 'contain' }} source={require('../icons/signup_male.png')}></Image>
                            </View>
                            <View style={styles.gender_button_text_view}>
                                <Text style={[styles.LabelTextStyle, { fontSize: 15, color: '#ffffff', marginLeft: 10 }]}>Male</Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                }
                <View style={{ flexDirection: 'row', alignItems: 'flex-end', backgroundColor: Colors.transparent }} onLayout={event => this.setState({ gender_view_y: event.nativeEvent.layout.y })}>
                    <View style={[styles.ViewContainerStyle, { flex: 1 }]}>
                        <View style={[styles.TextLabelContainerStyle, { alignItems: 'flex-end', borderWidth: 0, marginRight: 5 }]}>
                            <TouchableOpacity style={[{
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                borderColor: Colors.black,
                                borderWidth: 0.5,
                                flex: 1,
                                height: 40,
                                borderRadius: 5,
                                flexDirection: 'row'
                            }]}
                                onPress={() => {
                                    this.setState({ gender_box_show: !this.state.gender_box_show, type_box_show: false })
                                }}
                            >
                                <View style={{ alignItems: 'center', flexDirection: 'row' }}>
                                    <Text style={[styles.LabelTextStyle, { fontSize: 13, backgroundColor: Colors.transparent, paddingLeft: 5 }, stylesGlobal.font]}>{this.state.gender}</Text>
                                    {
                                        this.state.gender == "Female" &&
                                        <View style={{ height: '60%', aspectRatio: 1, marginLeft: 5 }}>
                                            <Image style={{ width: '100%', height: '100%', resizeMode: 'contain' }} source={require('../icons/signup_female.png')}></Image>
                                        </View>
                                    }
                                    {
                                        this.state.gender == "Male" &&
                                        <View style={{ height: '60%', aspectRatio: 1, marginLeft: 5 }}>
                                            <Image style={{ width: '100%', height: '100%', resizeMode: 'contain' }} source={require('../icons/signup_male.png')}></Image>
                                        </View>
                                    }
                                </View>
                                <Image style={{ width: 20, height: 20, resizeMode: 'contain', marginRight: 10 }} source={require('../icons/down_arrow.png')} />
                            </TouchableOpacity>
                        </View>
                    </View>
                    {this.state.selected_entry.type == '1' || this.state.selected_entry.type == '2' ?
                        <View style={[styles.ViewContainerStyle, { flex: 1.3, backgroundColor: Colors.transparent }]}>
                            <View style={[styles.TextLabelContainerStyle, { alignItems: 'center', justifyContent: 'center' }]}>
                                <TextInput
                                    ref="InputNetWorth"
                                    returnKeyType={"done"}
                                    keyboardType={"numeric"}
                                    onChangeText={netWorthValue => this.setState({ netWorthValue })}
                                    value={this.state.netWorthValue}
                                    defaultValue=""
                                    multiline={false}
                                    placeholderTextColor={Colors.gray}
                                    placeholder='Net Worth (million USD)'

                                    autoCapitalize='none'
                                    underlineColorAndroid="transparent"
                                    style={[styles.TextInputStyle, stylesGlobal.font]}
                                    onSubmitEditing={event => {
                                        this.refs.InputEmail.focus();
                                    }}
                                />
                                <Text style={[styles.LabelTextStyle, { fontSize: 13, backgroundColor: Colors.transparent, paddingLeft: 5 }, stylesGlobal.font]}> million USD</Text>
                            </View>
                        </View>
                        :
                        <View style={[styles.ViewContainerStyle, { flex: 1, backgroundColor: Colors.transparent }]}>
                            <View style={[styles.TextLabelContainerStyle, { alignItems: 'center', justifyContent: 'center', borderWidth: 0 }]}>
                                <TextInput
                                    keyboardType={"numeric"}
                                    onChangeText={(text) => {
                                        const val = text.length === 2 && !text.includes("/")
                                            ? `${text.substring(0, 2)}/${text.substring(2)}`
                                            : text.length === 5 ? text + '/' : text;
                                        this.setState({ valueDateOfBirth: val })
                                    }}
                                    value={this.state.valueDateOfBirth}
                                    onBlur={() => {
                                        this.setState({ valueDateOfBirth: Moment(this.state.valueDateOfBirth).format("MM/DD/YYYY") })
                                    }}
                                    maxLength={10}
                                    defaultValue=""
                                    multiline={false}
                                    placeholderTextColor={Colors.gray}
                                    placeholder={birthDateLabel}

                                    autoCapitalize='none'
                                    underlineColorAndroid="transparent"
                                    style={[styles.TextInputStyle, stylesGlobal.font]}
                                />
                            </View>
                        </View>
                    }
                    {this.state.selected_entry.type == '1' || this.state.selected_entry.type == '2' ? <View style={{ width: 20 }} /> :
                        <View style={{ width: 30, height: 40, justifyContent: 'center', alignItems: 'center' }}>
                            <TouchableOpacity
                                onPress={() => {
                                    this.setState({ isDateTimePickerVisible: true })
                                }}
                            >
                                <Image
                                    style={{ height: 20, width: 20 }}
                                    onPress={() => alert('')}
                                    source={require("../icons/calendar.png")}
                                />
                            </TouchableOpacity>
                        </View>
                    }
                </View>
                {/* <View style={[styles.ViewContainerStyle, { backgroundColor: Colors.transparent, marginTop: 5 }]}> */}
                <View style={[{ flexDirection: 'row', marginTop: 5 }]}>
                    <View style={{ height: 40, justifyContent: 'center' }}>
                    </View>
                    {this.getGoogleAutoCompleteView()}
                </View>
                {/* </View> */}
                <View style={[styles.ViewContainerStyle, { backgroundColor: Colors.transparent, }]}>
                    <View style={[styles.TextLabelContainerStyle, { alignItems: 'flex-end', }]}>
                        <TextInput
                            ref="InputEmail"
                            returnKeyType={"next"}
                            keyboardType={"email-address"}
                            onChangeText={email => {this.setState({ email,  verificationDigit: null});}}
                            value={this.state.email}
                            defaultValue=""
                            multiline={false}
                            placeholderTextColor={Colors.gray}
                            placeholder='Email'
                            autoCapitalize='none'
                            underlineColorAndroid="transparent"
                            style={[styles.TextInputStyle, stylesGlobal.font]}
                            onSubmitEditing={event => {
                                this.refs.InputPassword.focus();
                            }}
                        />
                    </View>
                </View>

                
               
                {
                    (this.state.verified_email != this.state.email || this.state.verified_email == "") &&
                    <View style={[styles.ViewContainerStyle, { backgroundColor: Colors.transparent, marginBottom: 3}]}>
                        <View style={[styles.TextLabelContainerStyle, { alignItems: 'flex-end', flexDirection: "row" }]}>
                            {
                                this.state.verificationDigit != null &&
                                <TextInput
                                    ref="InputEmailVerificationDigit"
                                    returnKeyType={"next"}
                                    keyboardType={"number-pad"}
                                    onChangeText={(verificationDigit) => this.setState({ verificationDigit })}
                                    value={this.state.verificationDigit}
                                    defaultValue=""
                                    multiline={false}
                                    placeholderTextColor={Colors.gray}
                                    placeholder='6 digit'
                                    autoCapitalize='none'
                                    underlineColorAndroid="transparent"
                                    style={[styles.TextInputStyle, stylesGlobal.font, { marginRight: 10 }]}
                                    onSubmitEditing={event => {
                                        this.refs.phoneInput.focus();
                                    }}
                                />
                            }
                            <TouchableOpacity style={[stylesGlobal.common_button, stylesGlobal.shadow_style, { height: 40 }, this.state.verificationDigit == null ? { width: "100%" } : { width: "50%" }]}
                                onPress={() => {
                                    if (this.state.verificationDigit == null) {
                                        this.callSendOtpAPI();
                                    } else if (this.state.verificationDigit != null) {
                                        this.callCheckOtpAPI();
                                    }
                                }}
                            >
                                <Text style={[stylesGlobal.font, stylesGlobal.popup_button_text, { textAlign: "center" }]}>{"Verify Email"}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                }

                <View style={[styles.ViewContainerStyle, { backgroundColor: Colors.transparent, }]}>
                    <View style={[styles.TextLabelContainerStyle, { alignItems: 'flex-end', }]}>
                        <View style={[styles.TextInputStyle, {
                            paddingTop: 0,
                            paddingBottom: 0,
                            paddingLeft: 0,
                            flexDirection: 'row',
                            alignItems: 'center'
                           }]}>
                            <View style={{marginLeft: 10, marginRight: 10, flexDirection: 'row', alignItems: 'center'}}>
                                <CountryPicker onSelect={(value) => {
                                    this.setState({ callingCode: value.callingCode, countryName: value.cca2, valuePhone: "" })
                                }}
                                    countryCode={this.state.countryName}
                                    withFlag={true}
                                    withCallingCode={true}
                                />
                                <Image style={{ width: 10, height: 10, resizeMode: 'contain', marginRight: 20 }} source={require('../icons/down_arrow.png')} />
                            </View>
                            {/* <View style = {{flexDirection:'row', alignItems: 'center', width: '90%'}}> */}
                            <Text style={[{fontSize: 16,  marginLeft: 2, qkemarginTop: 3 }, stylesGlobal.font]}>+{this.state.callingCode}</Text>
                            <TextInput
                                ref='phoneInput'
                                multiline={false}
                                returnKeyType='done'
                                keyboardType='phone-pad'
                                numberOfLines={1}
                                underlineColorAndroid="transparent"
                                autoCapitalize='sentences'
                                placeholder='(optional)'
                                onChangeText={value => {
                                    const num = parsePhoneNumberFromString(value, this.state.countryName)

                                    let reg = /^[0-9]/
                                    if (!!num && this.state.phoneNumber.length > value.length && !reg.test(this.state.phoneNumber[this.state.phoneNumber.length - 1])){
                                      let phone = num.nationalNumber.split('')
                                      phone.pop()
                                      phone = phone.join('')
                                      this.setState({phoneNumber: phone, verificationPhoneDigit: null})
                                    } else {
                                      this.setState({phoneNumber: new AsYouType(this.state.countryName).input(value), verificationPhoneDigit: null})
                                    }

                                  //  this.setState({ phoneNumber: numPhone})
                                }}
                                value={removeCountryCode(this.state.phoneNumber)}
                                style={[styles.textInputText, stylesGlobal.font, { flexGrow: 1, marginLeft: 10}]}
                                onSubmitEditing={(event) => {
                                    //this.refs.valueNetWorthAnnualy.focus();

                                }}
                            ></TextInput>
                            {/* </View> */}
                        </View>
                    </View>
                </View>
                {/* <View style={[styles.ViewContainerStyle, { backgroundColor: Colors.transparent, }]}> */}
                {/*     <View style={[styles.TextLabelContainerStyle, { alignItems: 'flex-end', }]}> */}
{/*                          <PhoneInput */}
{/*                           ref={(ref) => { */}
{/*                             this.phone = ref; */}
{/*                           }} */}
{/*                           onPressFlag={this.onPressFlag} */}
{/*                         /> */}
{/*  */}
{/*                         { */}
{/*                             this.renderCountryFlagModal() */}
{/*                         } */}
{/*                        */}
                {/*         <View style={[styles.TextInputStyle, { */}
                {/*             paddingTop: 0, */}
                {/*             paddingBottom: 0, */}
                {/*             paddingLeft: 0, */}
                {/*            }]}> */}
                {/*              */}
                {/*             <PhoneInput */}
                {/*                 ref="phoneInput" */}
                {/*                 defaultValue={this.state.phoneNumber + 'ffff'} */}
                {/*                 defaultCode="US" */}
                {/*                 layout="first" */}
                {/*                  */}
                {/*                 onChangeText={(text) => { */}
                {/*                   this.setState({phoneNumber: text}); */}
                {/*                 }} */}
                {/*                 onChangeFormattedText={(text) => { */}
                {/*                   this.setState({phoneNumberFormated: text}); */}
                {/*                 }} */}
                {/*                  containerStyle={styles.phoneNumberView} */}
                {/*                 textContainerStyle={{ paddingVertical: 0, width: '100%'}} */}
                {/*                 withShadow */}
                {/*                  mask={'([00]) [0] [0000]-[0000]'} */}
                {/*               /> */}
                {/*         </View> */}
                {/*     </View> */}
                {/* </View> */}


                {
                    (this.state.verified_phone != this.state.phoneNumber || this.state.verified_phone == "") &&
                    <View style={[styles.ViewContainerStyle, { backgroundColor: Colors.transparent, marginBottom: 3}]}>
                        <View style={[styles.TextLabelContainerStyle, { alignItems: 'flex-end', flexDirection: "row" }]}>
                            {
                                this.state.verificationPhoneDigit != null &&
                                <TextInput
                                    ref="InputPhoneVerificationDigit"
                                    returnKeyType={"next"}
                                    keyboardType={"number-pad"}
                                    onChangeText={(verificationPhoneDigit) => this.setState({ verificationPhoneDigit })}
                                    value={this.state.verificationPhoneDigit}
                                    defaultValue=""
                                    multiline={false}
                                    placeholderTextColor={Colors.gray}
                                    placeholder='6 digit'
                                    autoCapitalize='none'
                                    underlineColorAndroid="transparent"
                                    style={[styles.TextInputStyle, stylesGlobal.font, { marginRight: 10 }]}
                                    onSubmitEditing={event => {
                                        this.refs.InputPassword.focus();
                                    }}
                                />
                            }
                            <TouchableOpacity style={[stylesGlobal.common_button, stylesGlobal.shadow_style, { height: 40 }, this.state.verificationPhoneDigit == null ? { width: "100%" } : { width: "50%" }]}
                                onPress={() => {
                                    if (this.state.verificationPhoneDigit == null) {
                                        this.callSendPhoneOtpAPI();
                                    } else if (this.state.verificationPhoneDigit != null) {
                                        this.callCheckPhoneOtpAPI();
                                    }
                                }}
                            >
                                <Text style={[stylesGlobal.font, stylesGlobal.popup_button_text, { textAlign: "center" }]}>{"Verify Phone Number"}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                }

                

             

                <View style={[styles.ViewContainerStyle, { backgroundColor: Colors.transparent, }]}>
                    <View style={[styles.TextLabelContainerStyle, { alignItems: 'flex-end', }]}>
                        <TextInput
                            returnKeyType={"done"}
                            ref="InputPassword"
                            password={true}
                            multiline={false}
                            defaultValue=""
                            onChangeText={password => this.setState({ password })}
                            value={this.state.password}
                            secureTextEntry={this.state.isSecure}
                            placeholderTextColor={Colors.gray}
                            placeholder='Password'
                            autoCapitalize='none'
                            underlineColorAndroid="transparent"
                            style={[styles.TextInputStyle, , stylesGlobal.font]}
                            onSubmitEditing={event => {
                            }}
                            keyboardType='ascii-capable'
                        />
                        <TouchableOpacity
                            onPress={() => {
                                this.setState({ isSecure: !this.state.isSecure })
                            }}
                            style={{ position: 'absolute', width: 40, height: 40, right: 0, alignItems: 'center', justifyContent: 'center' }}>
                            <Image style={styles.iconPasswordStyle}
                                source={require('../icons/ic_register_password_show.png')} />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        );
    };

    /**
    * google auto compleat view
    */
    onGeoCodeSearchFunc = (data) => {
        console.log(TAG, 'onGeoCodeSearchFunc started', data);
        Geocoder.geocodeAddress(data).then(res => {
            console.log(TAG, ' res... ' + JSON.stringify(res))
            this.setState({
                locationInfo: res,
                searchedAdress: data,
                loading: false
            }, () => {
                location = data
            })
        }).catch(err => {
            console.log(TAG, " onGeoCodeSearchFunc err " + err)
            this.setState({
                searchedAdress: data,
                loading: false
            }, () => {
                location = data
            })
        })
    };

    getGoogleAutoCompleteView = () => {
        const query = {
            key: Global.GOOGLE_MAP_KEY,
            types: "geocode|establishment",
            language: 'en',
        };

        return <GooglePlacesAutocomplete
            placeholder='Primary Residence'
            placeholderTextColor={Colors.black}
            minLength={3} // minimum length of text to search
            autoFocus={false}
            fetchDetails={false}
            returnKeyType={'done'}
            getDefaultValue={() => this.state.searchedAdress}
            listViewDisplayed={false}  // true/false/undefined
            // fetchDetails={false}
            renderDescription={(row) => row.description}
            onFail={error => console.error(error)}
            onPress={(data, details) => {

                this.onGeoCodeSearchFunc(data.description);
                this.refs.InputEmail.focus();
            }}
            onSubmitEditing={() => {
                this.onGeoCodeSearchFunc(location);
                this.refs.InputEmail.focus();
            }}
            query={query}
            styles={{
                textInputContainer: {
                    width: '100%',
                    backgroundColor: Colors.white,

                    height: 40,
                    borderRadius: 4,

                },
                textInput: [{
                    marginLeft: 0,
                    marginRight: 0,
                    paddingLeft: 5,
                    marginTop: 0,
                    height: 40,
                    backgroundColor: Colors.transparent,
                    color: Colors.black,
                    fontSize: 13,
                    borderRadius: 4,
                    color: Colors.black,
                    paddingTop: 10,
                    paddingBottom: 5,
                }, stylesGlobal.font],
                container: {
                    borderRadius: 4,
                    borderWidth: 0.5,
                    borderColor: Colors.black,
                },
                listView: {
                    backgroundColor: Colors.white,
                    borderColor: Colors.black,
                    borderRadius: 4,
                    borderLeftWidth: 0.5,
                    borderBottomWidth: 0.5,
                    borderRightWidth: 0.5,
                },
                predefinedPlacesDescription: [{
                    color: Colors.black,
                    fontSize: 13,
                }, stylesGlobal.font],
                description: [{ fontSize: 13, }, stylesGlobal.font]
            }}
            currentLocation={false}
            currentLocationLabel="Current location"
            nearbyPlacesAPI="GooglePlacesSearch"
            textInputProps={{
                onChangeText: (text) => {
                    location = text
                }
            }}
        />
    };

    renderUploadForm = () => {
        return (
            <View style={{ width: '100%', marginTop: 20, alignItems: 'center' }}>
                {
                    this.state.selected_entry.type != 7 && this.state.selected_entry.type != 4 &&
                    <TouchableOpacity style={{ height: 25, flexDirection: 'row', alignItems: 'center', marginBottom: 20, marginTop: 10 }}
                        onPress={() => {
                            // this.setState({ isVisible: true});
                            this.setState({ set_Image_type: "proofID" }, () => { this.showImagePicker("proofID") })
                        }} >
                        <View style={{ width: 180 }}>
                            <Text style={[styles.LabelTextStyle, stylesGlobal.font]}>Upload Photo ID</Text>
                        </View>
                        <View style={{ height: '100%', aspectRatio: 1 }}>
                            <Image style={{ width: '100%', height: '100%', resizeMode: 'contain' }} source={require('../icons/signup_upload.png')}></Image>
                        </View>
                        <View style={styles.file_checkbox}>
                            <Image source={require('../icons/square.png')} style={{ width: 20, height: 20, resizeMode: 'contain' }} />
                            {
                                this.state.proofID_doc != "" &&
                                <Image source={require('../icons/checked.png')} style={{ position: 'absolute', top: 0, left: 0, width: 20, height: 25, resizeMode: 'contain' }} />
                            }
                        </View>
                    </TouchableOpacity>
                }
                {
                    (this.state.selected_entry.type == 1 || this.state.selected_entry.type == 2) &&
                    <TouchableOpacity style={{ height: 25, flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}
                        onPress={() => {
                            this.setState({ set_Image_type: "assets" }, () => { this.showImagePicker("assets") })
                        }} >
                        <View style={{ width: 180 }}>
                            <Text style={[styles.LabelTextStyle, stylesGlobal.font]}>Upload Proof of Net Worth</Text>
                        </View>
                        <View style={{ height: '100%', aspectRatio: 1 }}>
                            <Image style={{ width: '100%', height: '100%', resizeMode: 'contain' }} source={require('../icons/signup_upload.png')}></Image>
                        </View>
                        <View style={styles.file_checkbox}>
                            <Image source={require('../icons/square.png')} style={{ width: 20, height: 20, resizeMode: 'contain' }} />
                            {
                                this.state.assets_doc != "" &&
                                <Image source={require('../icons/checked.png')} style={{ position: 'absolute', top: 0, left: 0, width: 20, height: 25, resizeMode: 'contain' }} />
                            }
                        </View>
                    </TouchableOpacity>
                }
                {
                    (this.state.selected_entry.type == 3) &&
                    <TouchableOpacity style={{ height: 25, flexDirection: 'row', alignItems: 'center', marginBottom: 20 }} onPress={() => this.showImagePicker("model")}>
                        <View style={{ width: 180 }}>
                            <Text style={[styles.LabelTextStyle, stylesGlobal.font]}>Modeling Publication</Text>
                        </View>
                        <View style={{ height: '100%', aspectRatio: 1 }}>
                            <Image style={{ width: '100%', height: '100%', resizeMode: 'contain' }} source={require('../icons/signup_upload.png')}></Image>
                        </View>
                        <View style={styles.file_checkbox}>
                            <Image source={require('../icons/square.png')} style={{ width: 20, height: 20, resizeMode: 'contain' }} />
                            {
                                this.state.model_doc != "" &&
                                <Image source={require('../icons/checked.png')} style={{ position: 'absolute', top: 0, left: 0, width: 20, height: 25, resizeMode: 'contain' }} />
                            }
                        </View>
                    </TouchableOpacity>
                }
                {
                    (this.state.selected_entry.type == 6) &&
                    <TouchableOpacity style={{ height: 25, flexDirection: 'row', alignItems: 'center', marginBottom: 20 }} onPress={() => this.showImagePicker("article")}>
                        <View style={{ width: 180 }}>
                            <Text style={[styles.LabelTextStyle, stylesGlobal.font]}>Recent Newspaper Article</Text>
                        </View>
                        <View style={{ height: '100%', aspectRatio: 1 }}>
                            <Image style={{ width: '100%', height: '100%', resizeMode: 'contain' }} source={require('../icons/signup_upload.png')}></Image>
                        </View>
                        <View style={styles.file_checkbox}>
                            <Image source={require('../icons/square.png')} style={{ width: 20, height: 20, resizeMode: 'contain' }} />
                            {
                                this.state.article_doc != "" &&
                                <Image source={require('../icons/checked.png')} style={{ position: 'absolute', top: 0, left: 0, width: 20, height: 25, resizeMode: 'contain' }} />
                            }
                        </View>
                    </TouchableOpacity>
                }
                {
                    (this.state.selected_entry.type == 5) &&
                    <TouchableOpacity style={{ height: 25, flexDirection: 'row', alignItems: 'center', marginBottom: 20 }} onPress={() => this.showImagePicker("connection")}>
                        <View style={{ width: 180 }}>
                            <Text style={[styles.LabelTextStyle, stylesGlobal.font]}>Explanation of Connections</Text>
                        </View>
                        <View style={{ height: '100%', aspectRatio: 1 }}>
                            <Image style={{ width: '100%', height: '100%', resizeMode: 'contain' }} source={require('../icons/signup_upload.png')}></Image>
                        </View>
                        <View style={styles.file_checkbox}>
                            <Image source={require('../icons/square.png')} style={{ width: 20, height: 20, resizeMode: 'contain' }} />
                            {
                                this.state.connection_doc != "" &&
                                <Image source={require('../icons/checked.png')} style={{ position: 'absolute', top: 0, left: 0, width: 20, height: 25, resizeMode: 'contain' }} />
                            }
                        </View>
                    </TouchableOpacity>
                }
                {
                    (this.state.selected_entry.type == 1 || this.state.selected_entry.type == 2) &&
                    <View style={{ width: '100%', marginBottom: 20 }}>
                        <Text style={[{ color: Colors.black, fontSize: 12 }, stylesGlobal.font]}>{this.state.rich_gentleman_note}</Text>
                    </View>
                }
            </View>
        )
    };

    /**
    * display terms and condition button
    */
    renderTermsAndConditionView = () => {
        return (
            //Terms of Service and Privacy Policy
            <View style={{ width: '100%', alignItems: 'center' }}>
                <TouchableOpacity style={{
                    height: 50,
                    backgroundColor: Colors.transparent,
                    marginTop: 20,
                    marginBottom: 16,
                    flexDirection: 'row', paddingLeft: 5, paddingRight: 20
                }}
                    onPress={() => this.setState({
                        isCheckTermConditions: !this.state.isCheckTermConditions
                    })}
                >
                    {/* <Image
                        style={{ width: 20, height: 20, marginRight: 5 }}
                        source={this.state.isCheckTermConditions ? require('../icons/ic_check_box.png') : require('../icons/ic_check_box_outline_blank.png')}
                    /> */}
                    <Image source={require('../icons/square.png')} style={{ width: 20, height: 20, marginRight: 5, resizeMode: 'contain' }} />
                    {
                        this.state.isCheckTermConditions &&
                        <Image source={require('../icons/checked.png')} style={{ position: 'absolute', top: 0, left: 5, width: 20, height: 20, resizeMode: 'contain' }} />
                    }
                    <Text style={[{ paddingTop: 2, color: Colors.black, fontSize: 13, alignContent: 'center', textAlign: 'center', textAlignVertical: 'center', marginLeft: 10 }, stylesGlobal.font]}>
                        <Text>I agree to the </Text>
                        <Text style={[{ fontSize: 13, color: Colors.gold }, stylesGlobal.font]}
                            onPress={() => {
                                console.log(TAG, "Global.TERMS_AND_CONDITIONS_URL " + Global.TERMS_AND_CONDITIONS_URL)
                                Linking.openURL(Global.TERMS_AND_CONDITIONS_URL)
                            }} >Terms of Use</Text>
                        {/* <Text style={stylesGlobal.font}> and </Text>
                        <Text style={[{ fontSize: 13, color: Colors.gold }, stylesGlobal.font]}
                            onPress={() => {
                                console.log(TAG, "Global.TERMS_AND_CONDITIONS_URL " + Global.TERMS_AND_CONDITIONS_URL)
                                Linking.openURL(Global.TERMS_AND_CONDITIONS_URL)
                            }} >Privacy Policy</Text> */}
                    </Text>
                </TouchableOpacity>
            </View>
        );
    };

    /**
    * sing up button click
    */
    renderSignUpButton = () => {
        return (
            <View style={{ width: '100%', alignItems: 'center' }}>
                <TouchableOpacity style={[{
                    height: 40, width: '100%',
                    backgroundColor: Colors.gold, justifyContent: 'center', alignItems: 'center',
                },]}
                    onPress={() => { this.signUpButtonPressed() }}
                >
                    <Text style={[{ color: Colors.white, fontSize: 16 }, stylesGlobal.font]}>Apply</Text>
                </TouchableOpacity>
            </View>
        );
    };

    /**
    * display image picker view
    */
    showImagePicker = (image_type) => {
        console.log(TAG, "showImagePicker image_type = : ", image_type);
        var options = {
            title: 'Select Image',
            mediaType: 'photo',
            quality: 1.0,
            allowsEditing: false,
            noData: true,
            storageOptions: {
                skipBackup: true,
                path: 'images'
            }
        };
        //this.setState({ isVisible: !this.state.isVisible });
        ImagePicker.showImagePicker(options, (response) => {
            //launchImageLibrary(options, (response) => {
            console.log(TAG, " ImagePicker.showImagePicker Response = ", response);
            if (response.didCancel) {
                console.log("User cancelled image picker");
            } else if (response.error) {
                console.log("ImagePicker Error: ", response.error);
            } else if (response.customButton) {
                console.log("User tapped custom button: ", response.customButton);
            } else {
                console.log(TAG, " ImagePicker.showImagePicker source : ", response.uri);
                let source = { uri: response.uri };
                // You can also display the image using data:
                // let source = { uri: 'data:image/jpeg;base64,' + response.data };
                Image.getSize(source.uri, (width, height) => {
                    var newwidth = 0, newheight = 0;
                    if (width > 2000 || height > 2000) {
                        if (width > height) {
                            newwidth = 2000;
                            newheight = height * 2000 / width
                        } else {
                            newheight = 2000;
                            newwidth = width * 2000 / height
                        }
                        ImageResizer.createResizedImage(source.uri, newwidth, newheight, 'JPEG', 90)
                            .then(({ uri }) => {
                                if (image_type == "profile") {
                                    this.setState({ imageSource: uri });
                                } else if (image_type == "proofID") {
                                    var doc_images = this.state.doc_images;
                                    doc_images.push(uri);
                                    this.setState({
                                        proofID_doc: uri,
                                        doc_images: doc_images
                                    })
                                } else if (image_type == "assets") {
                                    var doc_images = this.state.doc_images;
                                    doc_images.push(uri);
                                    this.setState({
                                        assets_doc: uri,
                                        doc_images: doc_images
                                    })
                                } else if (image_type == "model") {
                                    var doc_images = this.state.doc_images;
                                    doc_images.push(uri);
                                    this.setState({
                                        model_doc: uri,
                                        doc_images: doc_images
                                    })
                                } else if (image_type == "article") {
                                    var doc_images = this.state.doc_images;
                                    doc_images.push(uri);
                                    this.setState({
                                        article_doc: uri,
                                        doc_images: doc_images
                                    })
                                } else if (image_type == "connection") {
                                    var doc_images = this.state.doc_images;
                                    doc_images.push(uri);
                                    this.setState({
                                        connection_doc: uri,
                                        doc_images: doc_images
                                    })
                                }
                                this.setState({ isVisible: false });
                            })
                            .catch(err => {
                                console.log(err);

                            });
                    } else {
                        if (image_type == "profile") {
                            this.setState({
                                imageSource: source.uri
                            });
                        } else if (image_type == "proofID") {
                            var doc_images = this.state.doc_images;
                            doc_images.push(source.uri);
                            this.setState({
                                proofID_doc: source.uri,
                                doc_images: doc_images
                            })
                        } else if (image_type == "assets") {
                            var doc_images = this.state.doc_images;
                            doc_images.push(source.uri);
                            this.setState({
                                assets_doc: source.uri,
                                doc_images: doc_images
                            })
                        } else if (image_type == "model") {
                            var doc_images = this.state.doc_images;
                            doc_images.push(source.uri);
                            this.setState({
                                model_doc: source.uri,
                                doc_images: doc_images
                            })
                        } else if (image_type == "article") {
                            var doc_images = this.state.doc_images;
                            doc_images.push(source.uri);
                            this.setState({
                                article_doc: source.uri,
                                doc_images: doc_images
                            })
                        } else if (image_type == "connection") {
                            var doc_images = this.state.doc_images;
                            doc_images.push(source.uri);
                            this.setState({
                                connection_doc: source.uri,
                                doc_images: doc_images
                            })
                        }
                        this.setState({ isVisible: false });
                    }
                });
            }
        });

    };

    // showCameraPicker = (image_type) => {
    //     console.log(">>>>>>profile", image_type);
    //     var options = {
    //         title: 'Select Image',
    //         mediaType: 'photo',
    //         quality: 1.0,
    //         allowsEditing: false,
    //         noData: true,
    //         storageOptions: {
    //             skipBackup: true,
    //             path: 'images'
    //         }
    //     };
    //     //this.setState({ isVisible: !this.state.isVisible })
    //     /**
    //     * The first arg is the options object for customization (it can also be null or omitted for default options),
    //     * The second arg is the callback which sends object: response (more info below in README)
    //     */
    //     ImagePicker.launchCamera(options, (response) => {
    //         console.log('Response = ', response);
    //         if (response.didCancel) {
    //             console.log('User cancelled image picker');
    //         } else if (response.error) {
    //             console.log('ImagePicker Error: ', response.error);
    //         } else if (response.customButton) {
    //             console.log('User tapped custom button: ', response.customButton);
    //         } else {
    //             console.log(TAG, "source " + source.uri);
    //             let source = { uri: response.uri };
    //             // console.log(TAG, "source " + response.assets[0].uri);                
    //             // You can also display the image using data:
    //             // let source = { uri: 'data:image/jpeg;base64,' + response.data };
    //             Image.getSize(response.assets[0].uri, (width, height) => {
    //                 var newwidth = 0, newheight = 0;
    //                 if (width > 2000 || height > 2000) {
    //                     if (width > height) {
    //                         newwidth = 2000;
    //                         newheight = height * 2000 / width
    //                     } else {
    //                         newheight = 2000;
    //                         newwidth = width * 2000 / height
    //                     }
    //                     ImageResizer.createResizedImage(source.uri, newwidth, newheight, 'JPEG', 90)
    //                         .then(({ uri }) => {
    //                             if (image_type == "profile") {
    //                                 this.setState({ imageSource: uri });
    //                             } else if (image_type == "proofID") {
    //                                 var doc_images = this.state.doc_images;
    //                                 doc_images.push(uri);
    //                                 this.setState({
    //                                     proofID_doc: uri,
    //                                     doc_images: doc_images
    //                                 })
    //                             } else if (image_type == "assets") {
    //                                 var doc_images = this.state.doc_images;
    //                                 doc_images.push(uri);
    //                                 this.setState({
    //                                     assets_doc: uri,
    //                                     doc_images: doc_images
    //                                 })
    //                             } else if (image_type == "model") {
    //                                 var doc_images = this.state.doc_images;
    //                                 doc_images.push(uri);
    //                                 this.setState({
    //                                     model_doc: uri,
    //                                     doc_images: doc_images
    //                                 })
    //                             } else if (image_type == "article") {
    //                                 var doc_images = this.state.doc_images;
    //                                 doc_images.push(uri);
    //                                 this.setState({
    //                                     article_doc: uri,
    //                                     doc_images: doc_images
    //                                 })
    //                             } else if (image_type == "connection") {
    //                                 var doc_images = this.state.doc_images;
    //                                 doc_images.push(uri);
    //                                 this.setState({
    //                                     connection_doc: uri,
    //                                     doc_images: doc_images
    //                                 })
    //                             }
    //                         })
    //                         .catch(err => {
    //                             console.log(err);

    //                         });
    //                 } else {
    //                     if (image_type == "profile") {
    //                         this.setState({
    //                             imageSource: source.uri
    //                         });
    //                     } else if (image_type == "proofID") {
    //                         var doc_images = this.state.doc_images;
    //                         doc_images.push(source.uri);
    //                         this.setState({
    //                             proofID_doc: source.uri,
    //                             doc_images: doc_images
    //                         })
    //                     } else if (image_type == "assets") {
    //                         var doc_images = this.state.doc_images;
    //                         doc_images.push(source.uri);
    //                         this.setState({
    //                             assets_doc: source.uri,
    //                             doc_images: doc_images
    //                         })
    //                     } else if (image_type == "model") {
    //                         var doc_images = this.state.doc_images;
    //                         doc_images.push(source.uri);
    //                         this.setState({
    //                             model_doc: source.uri,
    //                             doc_images: doc_images
    //                         })
    //                     } else if (image_type == "article") {
    //                         var doc_images = this.state.doc_images;
    //                         doc_images.push(source.uri);
    //                         this.setState({
    //                             article_doc: source.uri,
    //                             doc_images: doc_images
    //                         })
    //                     } else if (image_type == "connection") {
    //                         var doc_images = this.state.doc_images;
    //                         doc_images.push(source.uri);
    //                         this.setState({
    //                             connection_doc: source.uri,
    //                             doc_images: doc_images
    //                         })
    //                     }
    //                 }
    //             });
    //         }
    //     });
    // };

    /**
    * display image view
    */
    renderProfilePhoto = () => {
        return (
            <View style={{ alignItems: 'center', width: '100%', marginTop: 20 }}>
                {/* <TouchableOpacity style={[styles.profilePhotoCircle, {width: this.state.screen_width * 0.6, aspectRatio: 1, borderRadius: this.state.screen_width * 0.6 / 2}]} onPress={() => this.showImagePicker("profile")}> */}
                <TouchableOpacity style={[styles.profilePhotoCircle, { width: this.state.screen_width * 0.6, aspectRatio: 1, borderRadius: this.state.screen_width * 0.6 / 2 }]}
                    onPress={() => {
                        //this.showImagePicker("test");
                        this.setState({ set_Image_type: "profile" }, () => { this.showImagePicker("profile") });
                        //this.setState({ isVisible: true})
                    }}  >
                    {
                        this.state.imageSource == "" &&
                        <View style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' }}>
                            <Image style={{ width: '50%', height: '50%' }} resizeMode={'contain'} source={require("../icons/ic_register_profile_camera.png")} />
                            <Text style={[styles.LabelProfilePictureFileFormatTextStyle, stylesGlobal.font]}>Click to Upload Profile Picture</Text>
                        </View>
                    }
                    {
                        this.state.imageSource != "" &&
                        <Image style={{ width: '100%', height: '100%', resizeMode: 'cover' }} source={{ uri: this.state.imageSource }} />
                    }
                </TouchableOpacity>
            </View>
        );
    }

    /**
    * sing up button click
    */
    signUpButtonPressed = async () => {
        if (ValidationUtils.isEmptyOrNull(this.state.firstname.trim())) {
            Alert.alert(Constants.EMPTY_FIRST_NAME, "");
            return;
        }
        if (ValidationUtils.isEmptyOrNull(this.state.lastname.trim())) {
            Alert.alert(Constants.EMPTY_LAST_NAME, "");
            return;
        }
        if (this.state.gender == genderLabel) {
            Alert.alert(Constants.EMPTY_GENDER, "")
            return;
        }
        if (this.state.selected_entry.type == '1' || this.state.selected_entry.type == '2') {
            if (ValidationUtils.isEmptyOrNull(this.state.netWorthValue)) {
                Alert.alert(Constants.EMPTY_NETWORTH, "")
                return
            }
        } else {
            if (this.state.valueDateOfBirth == birthDateLabel) {
                Alert.alert(Constants.EMPTY_DATE_OF_BIRTH, "");
                return;
            } else {
                var age_permit = false;
                var age = parseInt(Moment(new Date()).format("YYYY"), 10) - parseInt(Moment(this.state.valueDateOfBirth).format("YYYY"), 10);
                if (!isNaN(age) && age != 0) {
                    if (new Date(this.state.valueDateOfBirth).getMonth() > new Date().getMonth()) {
                        age -= 1;
                    } else if (new Date(this.state.valueDateOfBirth).getMonth() == new Date().getMonth()) {
                        if (new Date(this.state.valueDateOfBirth).getDate() > new Date().getDate()) {
                            age -= 1;
                        }
                    }
                    if (age > 17) {
                        age_permit = true
                    }
                }
                if (!age_permit) {
                    Alert.alert(Constants.LIMIT_AGE, "");
                    return;
                }
            }
        }
        if (ValidationUtils.isEmptyOrNull(this.state.searchedAdress.trim())) {
            Alert.alert(Constants.EMPTY_RESIDENCE, "");
            return;
        }
        if (!ValidationUtils.isEmailValid(this.state.email.trim())) {
            Alert.alert(Constants.INVALID_EMAIL_ID, "");
            return;
        }
        if (this.state.email != this.state.verified_email) {
            Alert.alert(Constants.UNVERIFIED_EMAIL_ID, "");
            return;
        }
        // if(ValidationUtils.isEmptyOrNull(this.state.phoneNumber.trim()))
        // {
        //     Alert.alert(Constants.INVALID_PHONE_NUMBER, "");
        //     return;
        // }
        // if(this.state.phoneNumber != this.state.verified_phone) {
        //     Alert.alert(Constants.UNVERIFIED_PHONE_NUMBER, "");
        //     return;
        // }
        if (ValidationUtils.isEmptyOrNull(this.state.password.trim())) {
            Alert.alert(Constants.EMPTY_PASSWORD, "");
            return;
        }
        if (ValidationUtils.isEmptyOrNull(this.state.proofID_doc) && this.state.selected_entry.type !== '7') {
            Alert.alert(Constants.EMPTY_PROOFID_PICTURE, "",
                [
                    {
                        text: 'OK', onPress: () => {
                            this.showImagePicker("proofID");
                        }
                    },
                ],
                { cancelable: false }
            )
            return;
        }
        if (!this.state.isCheckTermConditions) {
            Alert.alert(Constants.ACCEPT_TERMS_CONDITIONS, "");
            return;
        }


        this.callPostSignUpAPIs();
    };

    /** Handle SignUp API Call
    *
    * @returns {Promise<void>}
    */
    callPostSignUpAPIs = async () => {
        try {
            this.setState({ loading: true });
            let uri = Memory().env == "LIVE" ? Global.URL_REGISTER + "?member_plan=" + this.state.selected_entry.type : Global.URL_REGISTER_DEV + "?member_plan=" + this.state.selected_entry.type;
            let params = new FormData();
            params.append("format", "json");
            params.append("member_plan", this.state.selected_entry.type);
            params.append("first_name", this.state.firstname);
            params.append("last_name", this.state.lastname);
            params.append("email", this.state.email);
            if(ValidationUtils.isEmptyOrNull(this.state.phoneNumber.trim()))
            {
                params.append("phone", this.state.phoneNumber);
            }
            params.append("password", this.state.password);
            params.append("retype_password", this.state.password);
            params.append("city", this.state.searchedAdress);
            params.append("device_token", deviceToken);
            //TODO Change Request
            params.append("terms_accepted", '1');
            if (this.state.selected_entry.type == '1' || this.state.selected_entry.type == '2') {
                params.append("networth_amount", this.state.netWorthValue);
            } else {
                params.append("networth_amount", "");
            }
            if (this.state.selected_entry.type == '1' || this.state.selected_entry.type == '2') {
                params.append("dob", "");
            } else {
                params.append("dob", this.state.valueDateOfBirth);
            }
            if (this.state.gender == genderLabel) {
                params.append("gender", '');
            } else {
                params.append("gender", this.state.gender.toLowerCase());
            }
            if (this.state.imageSource != "") {
                params.append('profile_pic', {
                    uri: this.state.imageSource,
                    type: 'image/jpeg',
                    name: 'testPhotoName.jpg'
                });
            }

            if (this.state.proofID_doc != "") {
                var localUriNamePart = this.state.proofID_doc.split('/');
                var fileName = localUriNamePart[localUriNamePart.length - 1];
                var doc_image = {
                    uri: this.state.proofID_doc,
                    type: 'image/jpeg',
                    name: fileName + '.jpg'
                };
                params.append('documents[]', doc_image);
                params.append('documentUploadType[]', 0);
            }
            if (this.state.assets_doc != "") {
                var localUriNamePart = this.state.assets_doc.split('/');
                var fileName = localUriNamePart[localUriNamePart.length - 1];
                var doc_image = {
                    uri: this.state.assets_doc,
                    type: 'image/jpeg',
                    name: fileName + '.jpg'
                };
                params.append('documents[]', doc_image);
                params.append('documentUploadType[]', 2);
            }
            if (this.state.model_doc != "") {
                var localUriNamePart = this.state.model_doc.split('/');
                var fileName = localUriNamePart[localUriNamePart.length - 1];
                var doc_image = {
                    uri: this.state.model_doc,
                    type: 'image/jpeg',
                    name: fileName + '.jpg'
                };
                params.append('documents[]', doc_image);
                params.append('documentUploadType[]', 3);
            }
            if (this.state.article_doc != "") {
                var localUriNamePart = this.state.article_doc.split('/');
                var fileName = localUriNamePart[localUriNamePart.length - 1];
                var doc_image = {
                    uri: this.state.article_doc,
                    type: 'image/jpeg',
                    name: fileName + '.jpg'
                };
                params.append('documents[]', doc_image);
                params.append('documentUploadType[]', 4);
            }
            if (this.state.connection_doc != "") {
                var localUriNamePart = this.state.connection_doc.split('/');
                var fileName = localUriNamePart[localUriNamePart.length - 1];
                var doc_image = {
                    uri: this.state.connection_doc,
                    type: 'image/jpeg',
                    name: fileName + '.jpg'
                };
                params.append('documents[]', doc_image);
                params.append('documentUploadType[]', 4);
            }
            console.log(TAG + " callSignUpAPIs uri " + uri);
            console.log(TAG + " callSignUpAPIs params " + JSON.stringify(params));
            WebService.callServicePostWithFormData(uri, params, this.handlePostSignUpResponse);
        } catch (error) {
            console.log(error)
            this.setState({
                loading: false
            });
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert("Error occured. Please try again.", "");
            }
        }
    };

    handlePostSignUpResponse = (response, isError) => {
        console.log(TAG + "callSignUpAPIs Response " + JSON.stringify(response));
        console.log(TAG + "callSignUpAPIs isError " + isError);
        if (!isError) {
            var result = response;
            if (result != undefined && result != null) {
                if (typeof result.status != undefined && result.status != null) {
                    if (result.status == "success") {
                        this.setState({
                            userId: result.data.id,
                            signup_success: true
                        })
                        let params = this.getSignInData();
                        let sendData = {
                            params: params,
                            userID: result.data.id,
                            userToken: null,
                            operation: 'signup',
                            memberType: this.state.selected_entry.type,
                        }

                        if(Platform.OS === "android")
                        {
                            if (this.state.selected_entry.type == '2' ||                     // by me paypal payment
                                this.state.selected_entry.type == '5' ||
                                this.state.selected_entry.type == '4') {

                                this.setState({
                                    loading: false
                                }, () => this.props.navigation.navigate("SignupPaymentScreen", sendData));

                            } else {
                                this.setState({
                                    loading: false
                                }, () => this.signIn());
                            }                                                            //  by me paypal payment ended
                        }else{
                            console.log("selected member:", JSON.stringify(this.state.selected_entry))       //  by prev inapp purchase
                            if(this.state.selected_entry.type == "2") { // generous
                                this.setState({
                                    purchase_processing: true
                                }, () => requestSubscription('com.007.007PercentApp.membershipgenerous'))
                                //RNIap.requestSubscription('com.007.007PercentApp.membershipgenerous'))
                                //com.007.007PercentApp.membershipgenerous
                                //com.007.007PercentApp.membershipgenerous
                            } else if(this.state.selected_entry.type == "5") { // connector
                                this.setState({
                                    purchase_processing: true
                                }, () => requestSubscription('com.007.007PercentApp.membershipconnector'))
                            } else if(this.state.selected_entry.type == "4") { // vipfan
                                this.setState({
                                    purchase_processing: true
                                }, () => requestSubscription('com.007.007PercentApp.membershipvipfan'))
                            } else {
                                this.signIn();
                            }                                                                                //  by prev inapp purchase
                        }

                    } else {
                        this.setState({
                            loading: false
                        });
                        if(response.msg)
                        {
                            Alert.alert(response.msg.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
                        }else{
                            Alert.alert(Constants.UNKNOWN_MSG, "");
                            //UNKNOWN_MSG
                        }
                    }
                } else {
                    this.setState({
                        loading: false
                    });

                }
            }
        } else {
            this.setState({
                loading: false
            });
            if (response != undefined && response != null && response.length > 0) {
                Alert.alert(response.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    };

    callMembershipPaidAPI = async (purchase_status, purchase_receipt) => {
        try {
            // this.setState({
            //     loading: true
            // });
            let uri = Memory().env == "LIVE" ? Global.URL_MEMBERSHIP_INAPPPURCHASE : Global.URL_MEMBERSHIP_INAPPPURCHASE_DEV;
            // let params = new FormData();
            // params.append("user_id", this.state.userId);
            // params.append("plan_id", this.state.selected_entry.type);
            // params.append("is_success", purchase_status);
            // params.append("format", "json");
            // if (purchase_status == 1 && purchase_receipt != null) {
            //     params.append("receipt", purchase_receipt);
            // }


            const data = {
                user_id: this.state.userId,
                plan_id: this.state.selected_entry.type,
                // user_id: 2305,
                // plan_id: '2',
                is_success: purchase_status,
                format: 'json'
            }
            if (purchase_status == 1 && purchase_receipt != null) {
                data["receipt"] = purchase_receipt;
            }

            this.setState({
                purchase_status: purchase_status
            })

            console.log(TAG + " callMembershipPaidAPI uri " + uri);
            console.log(TAG + " callMembershipPaidAPI params " + JSON.stringify(data));

            WebService.callServicePost(uri, data, this.handleMembershipPaid);
        } catch (error) {
            console.log(TAG + " callMembershipPaidAPI error " + error);
            this.setState({
                loading: false
            });
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    }

    handleMembershipPaid = async (response, isError) => {
        console.log(TAG + " callMembershipPaidAPI Response " + JSON.stringify(response));
        console.log(TAG + " callMembershipPaidAPI isError " + isError);

        if (!isError) {
            var result = response;
            if (result != undefined && result != null) {
                if (result.status == "success") {
                    if (this.state.purchase_status == 1 && result.payment_status == "success") {
                        if (this.state.inapppurchase_response != null) {
                            const ackResult = await finishTransactionIOS(this.state.inapppurchase_response.transactionId);
                            this.setState({
                                inapppurchase_response: null
                            })
                            // console.log("ackresult: ", ackResult);
                        }
                        this.signIn();
                    } else {
                        this.setState({
                            loading: false
                        });
                    }
                } else {
                    if(response.msg)
                    {
                        Alert.alert(response.msg.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
                    }else{
                        Alert.alert(Constants.UNKNOWN_MSG, "");
                        //UNKNOWN_MSG
                    }
                    this.setState({
                        loading: false
                    });
                }
            }
        } else {
            this.setState({
                loading: false
            });
            if (response != undefined && response != null && response.length > 0) {
                Alert.alert(response.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    }

    getSignInData = () => {
        var username = this.state.email;
        var password = this.state.password;
        // let uri = Memory().env == "LIVE" ? Global.BASE_URL + "login" : Global.BASE_URL_DEV + "login"
        let uri = Global.BASE_URL_DEV + "login"

        let params = new FormData();
        params.append("username", username);
        params.append("password", password);
        params.append("format", "json");
        params.append("device_token", deviceToken);

        let retObj = {
            uri: uri,
            params: params
        };
        return retObj;
    }

    signIn = () => {
        this.setState({
            loading: true
        });
        var username = this.state.email;
        var password = this.state.password;
        // let uri = Memory().env == "LIVE" ? Global.BASE_URL + "login" : Global.BASE_URL_DEV + "login"
        let uri =  Global.BASE_URL_DEV + "login"
        try {
            let params = new FormData();
            params.append("username", username);
            params.append("password", password);
            params.append("format", "json");
            params.append("device_token", deviceToken);
            // console.log(TAG + " callLoginAPIs uri " + uri);
            // console.log("callLoginAPIs params>>>",params);
            WebService.callServicePost(uri, params, this.handleSignInResponse);
        } catch (error) {
            this.setState({
                loading: false
            });
            // console.warn("catch1"+error);

            if (error != undefined && error != null && error.length > 0) {
                console.warn("catch1_If" + error);
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));


            }
        }
    };

    handleSignInResponse = async (response, isError) => {
        this.setState({ loading: false });
        console.log(TAG + "callLoginAPIs Response " + JSON.stringify(response));
        console.log(TAG + "callLoginAPIs isError " + isError);
        if (!isError) {
            var result = response;
            if (result != undefined && result != null) {
                console.log(TAG + " callLoginAPIs result " + JSON.stringify(result));
                if (typeof result.status != undefined && result.status != null) {
                    if (result.status == "error") {
                        if (Memory().env == "DEV") {
                            Memory().env = "LIVE";
                            
                            // Alert.alert(Constants.INVALID_USERNAME_PASSWORD, "");
                            // this.setState({ loading: false });
                            this.signIn();
                        } else {
                            Memory().env = "DEV";
                            
                            this.signIn();
                        }
                    } else {
                        if (result.data != undefined && result.data != null) {
                            var mData = result.data;
                            console.log(TAG + " result " + result.msg);
                            if (mData.user_id != undefined && mData.user_id != null && mData.user_id != "") {
                                try {
                                    var md5 = require('md5');
                                    // var prfixUrl = Memory().env == "LIVE" ? Global.MD5_BASE_URL : Global.MD5_BASE_URL_DEV;
                                    var prfixUrl = Global.MD5_BASE_URL_DEV;
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

                                    await AsyncStorage.setItem('last_server', Memory().env);

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
    };

    //phone verification

    handleSendPhoneOtpAPI = (response, isError) => {
        console.log(TAG + "callSendPhoneOtpAPI Response " + JSON.stringify(response));
        console.log(TAG + "callSendPhoneOtpAPI isError " + isError);

        if (!isError) {
            var result = response;
            if (result != undefined && result != null) {
                // console.log(TAG + " callSendOtpAPI result " + JSON.stringify(result));
                if (typeof result.status != undefined && result.status != null) {
                    if (result.status == "success") {
                        this.setState({ verificationPhoneDigit: "" });
                        Alert.alert(`A 6-digit code has been sent to your phone. Please retrieve it and enter it on the following screen.`);
                        
                    } else {
                        console.log(TAG, 'callSendPhoneOtpAPI Response has some errors, ', JSON.stringify(response));
                        // if(result.msg === "This Email is already register")
                        // {
                        //     Alert.alert("Duplicated email", 
                        //     "This email is already associated with an account. Would you like to sign in instead?",
                        //     [
                        //         {  
                        //             text: 'Cancel',  
                        //             onPress: () => {
                        //                 this.refs.InputEmail.focus();
                        //             },  
                        //             style: 'cancel',  
                        //         },  
                        //         {text: 'OK', onPress: async () =>  {
                        //             console.log('safdsfadf', this.state.email);
                        //             // await AsyncStorage.setItem(Constants.KEY_USER_EMAIL, this.state.email);
                        //             this.props.navigation.navigate("SignInScreen", {login_email: this.state.email})
                        //         }},  
                        //     ]);
                        // }
                        
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
        this.setState({ loading: false });

    }

    callSendPhoneOtpAPI = () => {
        if(!this.state.phoneNumber || this.state.phoneNumber === "")
        {
            Alert.alert("Please input your email");
            return;
        }

        this.setState({ loading: true });
        // let uri = Memory().env == "LIVE" ? Global.BASE_URL + "sendotp" : Global.BASE_URL_DEV + "sendotp"
        let uri = Global.URL_SEND_PHONE_OTP_DEV;
        try {
            // let params = new FormData();
            // params.append("phone", this.state.email);
            // params.append("format", "json");
            // params.append("device_token", deviceToken);

            const params = {
                "phone": this.state.phoneNumber,
                "format": "json",
                "device_token": deviceToken,
            }
            console.log(TAG + " callSendPhoneOtpAPI uri " + uri);
            console.log(TAG, "callSendPhoneOtpAPI params>>>",params);
            WebService.callServicePost(uri, params, this.handleSendPhoneOtpAPI);
        } catch (error) {
            this.setState({ loading: false });
            if (error != undefined && error != null && error.length > 0) {
                console.warn("catch1_If" + error);
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }

    }



    // Email Verification
    callSendOtpAPI = () => {

        if(!this.state.email || this.state.email === "")
        {
            Alert.alert("Please input your email");
            return;
        }

        this.setState({ loading: true });
        // let uri = Memory().env == "LIVE" ? Global.BASE_URL + "sendotp" : Global.BASE_URL_DEV + "sendotp"
        let uri = Global.URL_SEND_EMAIL_OTP_DEV;
        try {
            // let params = new FormData();
            // params.append("email", this.state.email);
            // params.append("format", "json");
            // params.append("device_token", deviceToken);

            let params = {
                email: this.state.email,
                format: "json",
                device_token: deviceToken,
                first_name: this.state.firstname.trim()
            }
            // console.log(TAG + " callSendOtpAPI uri " + uri);
            // console.log(TAG, "callSendOtpAPI params>>>",params);
            WebService.callServicePost(uri, params, this.handleSendOtpAPI);
        } catch (error) {
            this.setState({ loading: false });
            if (error != undefined && error != null && error.length > 0) {
                console.warn("catch1_If" + error);
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    };

    handleSendOtpAPI = (response, isError) => {
        console.log(TAG + "callSendOtpAPI Response " + JSON.stringify(response));
        console.log(TAG + "callSendOtpAPI isError " + isError);
        if (!isError) {
            var result = response;
            if (result != undefined && result != null) {
                // console.log(TAG + " callSendOtpAPI result " + JSON.stringify(result));
                if (typeof result.status != undefined && result.status != null) {
                    if (result.status == "success") {
                        this.setState({ verificationDigit: "" });
                        Alert.alert(`A 6-digit code has been sent to your email. Please retrieve it and enter it on the following screen.`);
                        
                    } else {
                        if(result.msg === "This Email is already register")
                        {
                            Alert.alert("Duplicated email", 
                            "This email is already associated with an account. Would you like to sign in instead?",
                            [
                                {  
                                    text: 'Cancel',  
                                    onPress: () => {
                                        this.refs.InputEmail.focus();
                                    },  
                                    style: 'cancel',  
                                },  
                                {text: 'OK', onPress: async () =>  {
                                    console.log('safdsfadf', this.state.email);
                                    // await AsyncStorage.setItem(Constants.KEY_USER_EMAIL, this.state.email);
                                    this.props.navigation.navigate("SignInScreen", {login_email: this.state.email})
                                }},  
                            ]);
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
        this.setState({ loading: false });
    };

    handleCheckPhoneOtpAPI = (response, isError) => {
        console.log(TAG + "callCheckPhoneOtpAPI Response " + JSON.stringify(response));
        console.log(TAG + "callCheckPhoneOtpAPI isError " + isError);
        if (!isError) {
            var result = response;
            if (result != undefined && result != null) {
                // console.log(TAG + " callCheckOtpAPI result " + JSON.stringify(result));
                if (typeof result.status != undefined && result.status != null) {
                    if (result.status == "success") {
                        Alert.alert(`Your phone number has been verified successfully.`);
                        this.setState({
                            verified_phone: this.state.phoneNumber,
                            verificationPhoneDigit: null
                        });
                    } else {
                        Alert.alert(`Please enter the 6-digit code that was sent to your Phone.`);
                        this.setState({ verificationPhoneDigit: "" });
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
        this.setState({ loading: false });
    }

    callCheckPhoneOtpAPI = () => {
        this.setState({ loading: true });
        // let uri = Memory().env == "LIVE" ? Global.BASE_URL + "checkotp" : Global.BASE_URL_DEV + "checkotp"
        let uri = Global.URL_CHECK_PHONE_OTP_DEV;
        try {
            // let params = new FormData();
            // params.append("email", this.state.email);
            // params.append("emailotp", this.state.verificationDigit);
            // params.append("format", "json");
            // params.append("device_token", deviceToken);
            const params = {
                "user_phone": this.state.phoneNumber,
                "phone_verification_code": this.state.verificationPhoneDigit,
                "format": "json",
                "device_token": deviceToken
            }
            // console.log(TAG + " callSendOtpAPI uri " + uri);
            // console.log(TAG, "callSendOtpAPI params>>>",params);
            WebService.callServicePost(uri, params, this.handleCheckPhoneOtpAPI);
        } catch (error) {
            this.setState({ loading: false });
            if (error != undefined && error != null && error.length > 0) {
                console.warn("catch1_If" + error);
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    }

    callCheckOtpAPI = () => {
        this.setState({ loading: true });
        // let uri = Memory().env == "LIVE" ? Global.BASE_URL + "checkotp" : Global.BASE_URL_DEV + "checkotp"
        let uri = Global.BASE_URL_DEV + "checkotp"
        try {
            let params = new FormData();
            params.append("email", this.state.email);
            params.append("emailotp", this.state.verificationDigit);
            params.append("format", "json");
            params.append("device_token", deviceToken);
            // console.log(TAG + " callSendOtpAPI uri " + uri);
            // console.log(TAG, "callSendOtpAPI params>>>",params);
            WebService.callServicePost(uri, params, this.handleCheckOtpAPI);
        } catch (error) {
            this.setState({ loading: false });
            if (error != undefined && error != null && error.length > 0) {
                console.warn("catch1_If" + error);
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    };

    handleCheckOtpAPI = (response, isError) => {
        console.log(TAG + "callCheckOtpAPI Response " + JSON.stringify(response));
        console.log(TAG + "callCheckOtpAPI isError " + isError);
        if (!isError) {
            var result = response;
            if (result != undefined && result != null) {
                // console.log(TAG + " callCheckOtpAPI result " + JSON.stringify(result));
                if (typeof result.status != undefined && result.status != null) {
                    if (result.status == "success") {
                        Alert.alert(`Your email has been verified successfully.`);
                        this.setState({
                            verified_email: this.state.email,
                            verificationDigit: null,
                        });
                    } else {
                        Alert.alert(`Please enter the 6-digit code that was sent to your Email.`);
                        this.setState({ verificationDigit: "" });
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
        this.setState({ loading: false });
    };

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
    phoneNumberView: {
        width: '100%',
        
        backgroundColor: 'white'
      },
});