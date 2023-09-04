import React from 'react';
import {
    StyleSheet, Text, View, Modal, TextInput, TouchableOpacity,
    ActivityIndicator, Platform, KeyboardAvoidingView, Dimensions, Image, Keyboard,
    TouchableWithoutFeedback, Alert, Linking
} from 'react-native';
import WebService from "../core/WebService";
import { EventRegister } from 'react-native-event-listeners';
import { Constants } from "../consts/Constants";
import { Colors } from "../consts/Colors";
import { stylesGlobal } from "../consts/StyleSheet";
import * as GlobalStyleSheet from "../consts/StyleSheet";
import * as Global from "../consts/Global";
import Memory from '../core/Memory';
import AsyncStorage from '@react-native-community/async-storage';

var TAG = "BannerView"

export default class BannerView extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            banner_action: "",
            screenProps: this.props.screenProps,

            userId: "",
            userToken: "",
            userSlug: "",
            userFirstName: "",
            userLastName: "",
            userImagePath: "",
            userImageName: "",
            user_email: "",

        }
    }

    async UNSAFE_componentWillMount() {
        
        try {
            let userFirstName = await AsyncStorage.getItem(Constants.KEY_USER_FIRST_NAME);
            let userLastName = await AsyncStorage.getItem(Constants.KEY_USER_LAST_NAME);
            let userImagePath = await AsyncStorage.getItem(Constants.KEY_USER_IMAGE_URL);
            let userImageName = await AsyncStorage.getItem(Constants.KEY_USER_IMAGE_NAME);
            var userId = await AsyncStorage.getItem(Constants.KEY_USER_ID);
            var userToken = await AsyncStorage.getItem(Constants.KEY_USER_TOKEN);
            var userSlug = await AsyncStorage.getItem(Constants.KEY_USER_SLUG);
            var user_email = await AsyncStorage.getItem(Constants.KEY_USER_EMAIL);
            // let saved_banner_action = await AsyncStorage.getItem(Constants.KEY_BANNER_ACTION);

            this.setState({
                userId: userId,
                userToken: userToken,
                userSlug: userSlug,
                userFirstName: userFirstName,
                userLastName: userLastName,
                userImagePath: userImagePath,
                userImageName: userImageName,
                user_email: user_email,
                // banner_action: saved_banner_action
            })

            // this.initBannerData();
        } catch (error) {
            // Error retrieving data
            console.log(TAG + ' getData  error  ' + error);
        }
        
    }

    async componentDidMount() {
        this.listener = EventRegister.addEventListener(Constants.EVENT_BANNER_CHANGED, (data) => {
            console.log(TAG, "EVENT_BANNER_CHANGED event called");
            this.setState({
                banner_action: data
            })
        })
    }

    componentWillUnmount() {
        EventRegister.removeEventListener(this.listener);
    }

    initBannerData = async () => {
        try {
            var userId = await AsyncStorage.getItem(Constants.KEY_USER_ID);
            var userToken = await AsyncStorage.getItem(Constants.KEY_USER_TOKEN);

            let uri = Memory().env == "LIVE" ? Global.BASE_URL : Global.BASE_URL_DEV;

            let params = new FormData();
            params.append("token", userToken);
            params.append("user_id", userId);
            params.append("format", "json");

            console.log(TAG + " callGetNearMePeopleAPI uri " + uri);
            console.log(TAG + " callGetNearMePeopleAPI params " + JSON.stringify(params));

            WebService.callServicePost(
                uri,
                params,
                this.handleGetNearMePeopleResponse
            );

        } catch (error) {
            
        }

    };

    /**
* handle get near me people API response
*/
    handleGetNearMePeopleResponse = async(response, isError) => {
        console.log(TAG + "callGetNearMePeopleAPI Response " + JSON.stringify(response));
        // console.log(TAG + "callGetNearMePeopleAPI isError " + isError);

        if (!isError) {
            var result = response;

            if (typeof result != undefined && result != null) {
                if (typeof result.data != undefined && result.data != null) {
                    try {
                        var mData = result.data;
                        var saved_banner_action = "";
                        if (mData.banner_msg.action != undefined && mData.banner_msg.action != null) {
                            saved_banner_action = mData.banner_msg.action;
                            AsyncStorage.setItem(Constants.KEY_IS_VERIFIED, "0");
                        } else {
                            saved_banner_action = "";
                            AsyncStorage.setItem(Constants.KEY_IS_VERIFIED, "1");
                        }
                        this.setState({
                            banner_action: saved_banner_action,
                        })
                        // EventRegister.emit(Constants.EVENT_BANNER_CHANGED, saved_banner_action);
                        // AsyncStorage.setItem(Constants.KEY_BANNER_ACTION, saved_banner_action);

                        // let is_special_server = mData.userProfileInfo.is_special;
                        // let is_special_storage = await AsyncStorage.getItem(Constants.KEY_IS_SPECIAL);
                        // if(is_special_server == null) {
                        //     is_special_server = "0";
                        // }
                        // if(is_special_storage == null) {
                        //     is_special_storage = "0";
                        // }
                        // if(is_special_storage != is_special_server) {
                        //     AsyncStorage.setItem(Constants.KEY_IS_SPECIAL, mData.userProfileInfo.is_special);
                        //     EventRegister.emit(Constants.EVENT_SPECIAL_INVITE_PRIVILEGE_CHANGED, saved_banner_action);
                        // }
                    } catch(error) {

                    }
                }
            }
        } else {
            if (response != undefined && response != null && response.length > 0) {
                Alert.alert(response.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    }

    resend_verificationemail = async () => {
        try {
            
            let uri = Memory().env == "LIVE" ? Global.URL_SEND_VERIFICATION_EMAIL + "?a=" + this.state.user_email : Global.URL_SEND_VERIFICATION_EMAIL_DEV + "?a=" + this.state.user_email

            console.log(TAG + " callVerificationEmailAPI uri " + uri);

            WebService.callServiceGet(
                uri,
                this.handleVerificationEmailResponse
            );
        } catch (error) {
            
            console.log(error)
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    }

    handleVerificationEmailResponse = (response, isError) => {

        console.log(TAG + " callVerificationEmailAPI result " + JSON.stringify(response));
        console.log(TAG + " callVerificationEmailAPI isError " + isError);

        if (!isError) {
            if (response != undefined && response != null) {
                if (response.status == "success") {
                    Alert.alert(Constants.EMAIL_VERIFICATION_RESENT, "");
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
        } else {
            if (response != undefined && response != null && response.length > 0) {
                Alert.alert(response.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    };

    upload_document() {
        this.props.screenProps.navigate("MyAccountScreen", {initial_tab: 'upload_document'});
    }

    payment_verify = () => {
        Alert.alert("For purchasing please go to the 007percent.com website", "",
            [
                {text: 'OK', onPress: () => {
                    let link = "https://007percent.com/my-account";
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
        )
        // this.props.screenProps.navigate("MyAccountScreen", {initial_tab: 'add_card'});
    }

    renew_account = () => {
        this.props.screenProps.navigate("MyAccountScreen");
    }

    render() {
        if(this.state.banner_action == "" || this.state.banner_action == null) {
            return null;
        }
        return (
            <View style={{width: '100%', backgroundColor: Colors.white, marginBottom: 15, padding: 15, borderColor: Colors.gold, borderTopWidth: 3, borderBottomWidth: 3}}>
                {
                    this.state.banner_action == "verify_email" &&
                    <View style = {{width: '100%', alignItems: 'center', justifyContent: 'center'}}>
                        <Text style = {[{fontSize: 14, color: Colors.black}, stylesGlobal.font]}>You only have limited access as your email is not verified.</Text>
                        <TouchableOpacity style = {[{paddingHorizontal: 15, paddingVertical: 10, backgroundColor: Colors.gold, borderRadius: 5, marginTop: 5}, stylesGlobal.shadow_style]} onPress = {() => this.resend_verificationemail()}>
                            <Text style = {[{fontSize: 14, color: Colors.black, color: Colors.white}, stylesGlobal.font]}>Re-send Verification Email</Text>
                        </TouchableOpacity>
                    </View>
                }
                {
                    this.state.banner_action == "uploading_credential" &&
                    <View style = {{width: '100%', flexDirection: 'row', flexWrap: 'wrap'}}>
                        {/* <Text style = {[{fontSize: 14, color: Colors.black}, stylesGlobal.font]}>You have only limited access while your application is under review. Please finalize <Text onPress = {() => this.upload_document()} style = {{color: Colors.gold}}>uploading your credentials</Text> to help us approve you as a full member.</Text> */}
                        <Text style = {[{fontSize: 14, color: Colors.black}, stylesGlobal.font]}>
                        Your 0.07% member application is currently under review. You have limited access until you are fully approved.
                        </Text>

                    </View>
                }
                {
                    this.state.banner_action == "update_payment" &&
                    <View style = {{width: '100%', flexDirection: 'row', flexWrap: 'wrap'}}>
                        <Text style = {[{fontSize: 14, color: Colors.black}, stylesGlobal.font]}>We don't seem to have a card on file. Please <Text onPress = {() => this.payment_verify()} style = {{color: Colors.gold}}>update your payment</Text> method to help us process payments for this profile.</Text>
                    </View>
                }
                {
                    this.state.banner_action == "under_review" &&
                    <View style = {{width: '100%', flexDirection: 'row', flexWrap: 'wrap'}}>
                        {/* <Text style = {[{fontSize: 14, color: Colors.black}, stylesGlobal.font]}>You have only limited access as your account is under review, you will notified as soon as your account review is complete.</Text> */}
                        <Text style = {[{fontSize: 14, color: Colors.black}, stylesGlobal.font]}>Your 0.07% member application is currently under review. You have limited access until you are fully approved.</Text>
                    </View>
                }
                {
                    this.state.banner_action == "renew_account" &&
                    <View style = {{width: '100%', flexDirection: 'row', flexWrap: 'wrap'}}>
                        <Text style = {[{fontSize: 14, color: Colors.black}, stylesGlobal.font]}>You have only limited access as your account is not renewed. Please renew your account <Text onPress = {() => this.renew_account()} style = {{color: Colors.gold}}>here</Text>.</Text>
                    </View>
                }
                {
                    this.state.banner_action == "renew_subscription" &&
                    <View style = {{width: '100%', flexDirection: 'row', flexWrap: 'wrap'}}>
                        <Text style = {[{fontSize: 14, color: Colors.black}, stylesGlobal.font]}>You have only limited access as your account is expired. Please <Text onPress = {() => this.renew_account()} style = {{color: Colors.gold}}>renew</Text> your account.</Text>
                    </View>
                }   
            </View>
        );
    }
}


const styles = StyleSheet.create({
  

});

