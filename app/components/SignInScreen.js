import React, { Component } from "react";
import {
    Alert,
    Platform,
    StyleSheet,
    Text,
    View,
    Image,
    ImageBackground,
    TextInput,
    TouchableOpacity,
    Dimensions,
    TouchableHighlight,
    SafeAreaView,
    Keyboard,
    Linking
} from "react-native";
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import { EventRegister } from 'react-native-event-listeners';
// import FCM, {FCMEvent} from 'react-native-fcm';
import axios from 'axios'
import AsyncStorage from '@react-native-community/async-storage';
import analytics from '@react-native-firebase/analytics';
import * as ValidationUtils from "../utils/ValidationUtils";
import { Constants } from "../consts/Constants";
import ProgressIndicator from "./ProgressIndicator";
import WebService from "../core/WebService";
import { Colors } from "../consts/Colors";
import * as Global from "../consts/Global";
import { stylesGlobal } from '../consts/StyleSheet'
import Memory from '../core/Memory';
import images from "../images";

var TAG = "SignInScreen";
const { width, height } = Dimensions.get('window')
let autoLoginNumber = 3;
export default class SignInScreen extends React.Component {
    constructor(props, defaultProps) {
        super(props, defaultProps);
        this.state = {
            username: "",
            password: "",
            userId: "",
            userToken: "",
            deviceToken: "",
            loading: false,
            isGettingData: false,
            isInterNet: false,
            placeholder: '',
            forgot_password_popup: false,
            login_dialog_y: 0,
            loginCnt: 0,
            web_link_object: null, // used when open app from web link
        };
    }

    componentDidMount() {
        //Memory().env = "LIVE";
         //Memory().env = "DEV";
        // this.getDocumentType();
        this.getProfileType();
        this.setState({
            isGettingData: true
        }, () => {
            setTimeout(() => {
                this.getData();
            }, 3000);

        });

        this.screenInitListener = this.props.navigation.addListener('focus', this.init_screen.bind(this));
        this.listenerEventWebLink = EventRegister.addEventListener(Constants.EVENT_WEB_LINK, (data) => {
            this.setState({
                web_link_object: data
            })
        })
    }



    init_screen() {
console.log('ddddddddddddddddd', this.props);
        if(this.props.route && this.props.route.params && this.props.route.params.login_email)
            this.setState({username: this.props.route.params.login_email});

        if (this.props.route.params) {
                this.setState({

                isGettingData: this.props.route.params.isGettingData
            }, () => { 
                if( this.props.route.params.isGettingData)
                    AsyncStorage.setItem("MyRecentChatList", "");
            })
        }


        if (this.props.navigation.state) {

            //var email = await AsyncStorage.getItem(Constants.KEY_USER_EMAIL);


            

            if (this.props.navigation.state.params) {
                this.setState({

                    isGettingData: this.props.navigation.state.params.isGettingData
                }, () => { 
                    if( this.props.navigation.state.params.isGettingData)
                        AsyncStorage.setItem("MyRecentChatList", "");
                })
            }
        }
    }

    componentWillUnmount() {
        this.screenInitListener();
        EventRegister.removeEventListener(this.listenerEventWebLink);
    }

    getProfileType = () => {
        try {
            //let uri = Memory().env == "LIVE" ? Global.URL_PROFILE_TYPES : Global.URL_PROFILE_TYPES_DEV;
            let uri = Global.URL_PROFILE_TYPES_DEV;
            let params = new FormData();
            params.append("format", "json");
            console.log(TAG + " GetProfileType uri " + uri);
            console.log(TAG + "GetProfileType params ", JSON.stringify(params));
            WebService.callServicePost(uri, params, this.handleGetProfileTypeResponse);
        } catch (error) {

        }
    }

    handleGetProfileTypeResponse = (response, isError) => {
        console.log("GetProfileType Response " + JSON.stringify(response));
        console.log("GetProfileType isError " + isError);
        if (!isError) {
            var result = response;
            if (result != undefined && result != null) {
                if (result.status == "success") {
                    if (result.data != null && result.data.length > 0) {
                        Global.entries = [];
                        Global.entriesMain = [];
                        Global.entriesFan = [];
                        Global.entriesAll = [];
                        for (var index = 0; index < result.data.length; index++) {

                            let badgeImagePath = "";
                            let  avatarImagePath = "";
                            switch(result.data[index].id)
                            {
                                case "1": // rich
                                badgeImagePath = images.richBadge;
                                avatarImagePath = images.richAvatar;
                                break;
                                case "2": // "Gentleman"
                                badgeImagePath = images.gentlemanBadge;
                                avatarImagePath = images.gentlemanAvatar;
                                break;
                                case "3": // model
                                badgeImagePath = images.modelBadge;
                                avatarImagePath = images.modelAvatar;
                                break;
                                case "5": // "Connector"
                                badgeImagePath = images.connectorBadge;
                                avatarImagePath = images.connectorAvatar;
                                break;
                                case "6": // "Famous"
                                badgeImagePath = images.famousBadge;
                                avatarImagePath = images.famousAvatar;
                                break;
                                case "4": // "vip fan"
                                badgeImagePath = images.vipfanBadge;
                                avatarImagePath = images.vipfanAvatar;
                                break;
                                case "7": // "General Public"
                                badgeImagePath = images.fanBadge;
                                avatarImagePath = images.fanAvatar;
                                break;
                                case "8": // "Alumni"
                                badgeImagePath = images.alumniBadge;
                                avatarImagePath = images.alumniAvatar;
                                break;
                            }

                            let imagePath = result.data[index].default_male_image_path + Constants.THUMB_FOLDER + result.data[index].default_male_image_name;
                            if(result.data[index].default_gender === "female")
                                imagePath = result.data[index].default_female_image_path + Constants.THUMB_FOLDER + result.data[index].default_female_image_name;
                            Global.entriesAll.push({
                                id: result.data[index].id,
                                name: result.data[index].name,
                                image: imagePath,
                                profile_text: result.data[index].description,
                                cost: parseFloat(result.data[index].price) == 0 ? "FREE" : "$ " + result.data[index].price + "/ Month",
                                includes: result.data[index].includes,
                                tag: result.data[index].ribbon_image_path + result.data[index].ribbon_image_name,
                                background: result.data[index].topbg_image_path + result.data[index].topbg_image_name,
                                //badge: result.data[index].icon_image_path + result.data[index].icon_image_name,
                                badge: badgeImagePath,
                                avatar: result.data[index].avatar_image_path + Constants.THUMB_FOLDER + result.data[index].avatar_image_name,
                                // avatar: avatarImagePath,
                                type: result.data[index].id
                            })
                            if (result.data[index].user_type != "8") {
                                Global.entries.push({
                                    id: result.data[index].id,
                                    name: result.data[index].name,
                                    image: imagePath,
                                    profile_text: result.data[index].description,
                                    cost: parseFloat(result.data[index].price) == 0 ? "FREE" : "$ " + result.data[index].price + "/ Month",
                                    includes: result.data[index].includes,
                                    tag: result.data[index].ribbon_image_path + result.data[index].ribbon_image_name,
                                    background: result.data[index].topbg_image_path + result.data[index].topbg_image_name,
                                    // badge: result.data[index].icon_image_path + result.data[index].icon_image_name,
                                    badge: badgeImagePath,
                                    avatar: result.data[index].avatar_image_path + Constants.THUMB_FOLDER + result.data[index].avatar_image_name,
                                     // avatar: avatarImagePath,
                                    type: result.data[index].id
                                });
                                console.log('selected profile = ', index, result.data[index].is_member, result.data[index])
                                if (result.data[index].is_member === "1") {
                                    Global.entriesMain.push({
                                        id: result.data[index].id,
                                        name: result.data[index].name,
                                        image: imagePath,
                                        profile_text: result.data[index].description,
                                        cost: parseFloat(result.data[index].price) == 0 ? "FREE" : "$ " + result.data[index].price + "/ Month",
                                        includes: result.data[index].includes,
                                        tag: result.data[index].ribbon_image_path + result.data[index].ribbon_image_name,
                                        background: result.data[index].topbg_image_path + result.data[index].topbg_image_name,
                                        // badge: result.data[index].icon_image_path + result.data[index].icon_image_name,
                                        badge: badgeImagePath,
                                        avatar: result.data[index].avatar_image_path + Constants.THUMB_FOLDER  + result.data[index].avatar_image_name,
                                         // avatar: avatarImagePath,
                                        type: result.data[index].id
                                    })
                                } else {
                                    Global.entriesFan.push({
                                        id: result.data[index].id,
                                        name: result.data[index].name,
                                        image: imagePath,
                                        profile_text: result.data[index].description,
                                        cost: parseFloat(result.data[index].price) == 0 ? "FREE" : "$ " + result.data[index].price + "/ Month",
                                        includes: result.data[index].includes,
                                        tag: result.data[index].ribbon_image_path + result.data[index].ribbon_image_name,
                                        background: result.data[index].topbg_image_path + result.data[index].topbg_image_name,
                                        // badge: result.data[index].icon_image_path + result.data[index].icon_image_name,
                                        badge: badgeImagePath,
                                        avatar: result.data[index].avatar_image_path + Constants.THUMB_FOLDER + result.data[index].avatar_image_name,
                                         // avatar: avatarImagePath,
                                        type: result.data[index].id
                                    })
                                }
                            }
                        }
                        Global.entriesMain.push({
                            name: "NONE",
                            image: images.typeNone,
                            profile_text: "I AM NOT ONE OF THESE",
                            cost: "",
                            includes: '',
                            tag: images.famousTag,
                            background: images.bg8,
                            badge: images.famousBadge,
                            type: "0"
                        })
                        Global.entriesFan.push({
                            name: "NONE",
                            image: images.typeGoback,
                            profile_text: "BACK TO MEMBER PROFILES",
                            cost: "",
                            includes: '',
                            tag: images.famousTag,
                            background: images.bg8,
                            badge: images.famousBadge,
                            type: "0"
                        })
                    }
                }
            }
        } else {
            if (response != undefined && response != null && response.length > 0) {
                Alert.alert(response.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    }

    getDocumentType = async () => {
        try {
            var uri = Global.URL_REGISTER_DEV
            let params = new FormData();
            params.append("format", "json");
            console.log(TAG + " GetDocumentType uri " + uri);
            console.log(TAG + "GetDocumentType params>>>", JSON.stringify(params));
            WebService.callServicePost(uri, params, this.handleGetDocumentTypeResponse);
        } catch (error) {

        }
    }

    handleGetDocumentTypeResponse = (response, isError) => {
        // console.log("GetDocumentType Response " + JSON.stringify(response));
        console.log("GetDocumentType isError " + isError);
        if (!isError) {
            var result = response;
            if (result != undefined && result != null) {
                if (result.data && result.data.config.length > 0) {
                    for (i = 0; i < result.data.config.length; i++) {
                        var item = {
                            id: result.data.config[i].id,
                            member_plan: result.data.config[i].member_plan,
                            document_type: JSON.parse(result.data.config[i].meta_value).document_type
                        }
                        Global.documentType.push(item)
                    }
                }
            }
        } else {
            if (response != undefined && response != null && response.length > 0) {
                Alert.alert(response.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    }

    /**
    * get user stored information
    */
    getData = async () => {
        try {
            var email = await AsyncStorage.getItem(Constants.KEY_USER_EMAIL);
            var password = await AsyncStorage.getItem(Constants.KEY_USER_PASSWORD);
            var userId = await AsyncStorage.getItem(Constants.KEY_USER_ID);
            var userToken = await AsyncStorage.getItem(Constants.KEY_USER_TOKEN);
            var userIsFan = await AsyncStorage.getItem(Constants.KEY_USER_IS_FAN);
            var deviceToken = await AsyncStorage.getItem(Constants.FIREBASE_ID);
            Memory().env = "LIVE";
            

            if (userIsFan !== null) {
                console.log(TAG + " userIsFan " + userIsFan);
            } else {
                console.log(TAG + " userIsFan null");
            }

            if (email !== null) {
                //this.setState({ username: email });
            } else {
                console.log(TAG + " email null");
            }

            if (password !== null) {
                console.log(TAG + " password " + password);
                //this.setState({ password: password });
            } else {
                console.log(TAG + " password null");
            }

            if (userId !== null) {
                //this.setState({ userId: userId });
            } else {
               // this.setState({ userId: "" });
            }

            if (userToken !== null) {
                //this.setState({ userToken: userToken });
            } else {
               // this.setState({ userToken: "" });
            }

            if (deviceToken !== null) {
               // this.setState({ deviceToken: deviceToken });
            } else {
               // this.setState({ deviceToken: "" });
            }

            this.setState({
                username: email != null ? email : '',
                password: password != null ? password : '',
                userId: userId != null ? userId : '',
                userToken: userToken != null ? userToken : '',
                deviceToken: deviceToken != null ? deviceToken : ''
            }, () => {this.goToSignInScreen()})
            console.log(TAG + " device token:", deviceToken);

        } catch (error) {
            // Error retrieving data
            console.log(error)
        }
       // this.goToSignInScreen();
    };

    callAutoLoginAPIs = () => {
        if (!this.state.isGettingData) {
            this.setState({ loading: true });
        }
        try {
            let uri = Memory().env == "LIVE" ? Global.BASE_URL + "profile" : Global.BASE_URL_DEV + "profile";
            let params = new FormData();
            params.append("user_id", this.state.userId);
            params.append("token", this.state.userToken);
            params.append("format", "json");
            params.append("device_token", this.state.deviceToken);
            console.log(TAG + " callAutoLoginAPIs uri " + uri);
            console.log(TAG + " callAutoLoginAPIs params", JSON.stringify(params));
            WebService.callServicePost(uri, params, this.handleAutoLogInResponse);
        } catch (error) {
            this.setState({ loading: false });
            console.warn("catch1" + error);
            if (error != undefined && error != null && error.length > 0) {
                console.warn("catch1_If" + error);
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    };

    handleAutoLogInResponse = async (response, isError) => {
         //console.log("auto login Response " + JSON.stringify(response));
        console.log("auto signin isError " + isError);
        if (!isError) {
            var result = response;
            if (result != undefined && result != null) {
                if (result.status == "success") {

                    this.setState({loginCnt:0});

                    this.setState({
                        loading: false,
                        // isGettingData: false
                    });
                    // this.setState({ isGettingData: false });
                    await AsyncStorage.setItem('last_server', Memory().env);
                    //AsyncStorage.setItem("MyRecentChatList", "");
                    this.props.navigation.navigate("Dashboard", { web_link_object: this.state.web_link_object });
                    this.setState({
                        web_link_object: null
                    })
                } else {
                    if (Memory().env == "DEV") {
                        Memory().env = "LIVE";
                        
                        
                        //Alert.alert(Constants.INVALID_USERNAME_PASSWORD, "");

                        if(this.state.loginCnt > 1){
                            Alert.alert(Constants.INVALID_USERNAME_PASSWORD, "");
                            this.setState({
                            loading: false,
                            isGettingData: false
                        });
                        }else{
                            this.setState({loginCnt:this.state.loginCnt +1 }, () => this.callAutoLoginAPIs());
                        }
                    } else {
                        Memory().env = "DEV";
                        
                        if(this.state.loginCnt > 1){
                            Alert.alert(Constants.INVALID_USERNAME_PASSWORD, "");
                            this.setState({
                            loading: false,
                            isGettingData: false
                        });
                        }else{
                            this.setState({loginCnt:this.state.loginCnt + 1}, () => this.callAutoLoginAPIs());
                        }
                    }
                    
                }
            } else {
                this.setState({
                    loading: false,
                    isGettingData: false
                });
                autoLoginNumber = autoLoginNumber - 1;
                if (autoLoginNumber == 0) {
                    Alert.alert(Constants.NO_INTERNET, "");
                }
            }
        } else {
            this.setState({
                loading: false,
                isGettingData: false
            });
            autoLoginNumber = autoLoginNumber - 1;
            // if (autoLoginNumber == 0) {
            //     Alert.alert(Constants.NO_INTERNET, "");
            // }

            if (response != undefined && response != null && response.length > 0) {
                Alert.alert(response.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    }

    callForgotPasswordAPI = async () => {
        try {
            // let uri = Memory().env == "LIVE" ? Global.URL_FORGOTPASSWORD : Global.URL_FORGOTPASSWORD_DEV;
            let uri = Global.URL_FORGOTPASSWORD
            // let uri = Global.URL_FORGOTPASSWORD_DEV
            let params = new FormData();
            params.append("format", "json");
            params.append("username", this.state.username);

            console.log(TAG + " callForgotPasswordAPIs uri " + uri);
            console.log(TAG + " callForgotPasswordAPIs params " + JSON.stringify(params));

            WebService.callServicePost(uri, params, this.handleForgotPasswordResponse);
        } catch (error) {
            this.setState({
                loading: false
            });
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    };

    handleForgotPasswordResponse = (response, isError) => {
        this.setState({ loading: false });
        // console.log(" callForgotPasswordAPIs Response " + JSON.stringify(response));
        console.log(" callForgotPasswordAPIs isError " + isError);
        if (!isError) {
            var result = response;
            if (result != undefined && result != null) {
                if (typeof result.status != undefined && result.status != null) {
                    if (result.status == "error") {
                        Alert.alert(result.msg.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""))
                    } else {
                        Alert.alert("An email with a link to reset your password has been sent to you. Please check your email and follow the link.", "");
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

    /**
     * go to next screen
     */
    goToSignInScreen = () => {
        try {
            if (this.state.userToken != "") {

                this.setState({loginCnt:1});
                this.callAutoLoginAPIs();
            } else {
                this.setState({ isGettingData: false })
            }
        } catch (error) {
            // Error retrieving data
            console.log(error)
        }
    };

    render() {
        return (
            <View style={styles.container}>
                {
                    this.state.loading && <ProgressIndicator />
                }
                {
                    this.state.forgot_password_popup && this.renderForgotPassword()
                }
                {
                    this.renderSignInView()
                }
            </View>
        )

    }

    renderForgotPassword = () => {
        return (
            <View style={{ width: '100%', height: '100%', position: 'absolute', alignItems: 'center', justifyContent: 'center', zIndex: 10, elevation: 10 }}>
                <View style={{ width: '100%', height: '100%', position: 'absolute', backgroundColor: Colors.black, opacity: 0.7 }} />
                <View style={{ width: '90%', backgroundColor: Colors.white, borderRadius: 10, overflow: 'hidden' }}>
                    <View style={stylesGlobal.title_header}>
                        <Text style={[stylesGlobal.headText, stylesGlobal.font]}>{"FORGOT PASSWORD"}</Text>
                        <TouchableOpacity style={{ height: '100%', aspectRatio: 1, position: 'absolute', right: 0, top: 0, justifyContent: 'center', alignItems: 'center' }}
                            onPress={() => this.setState({ forgot_password_popup: false })}
                        >
                            <Image style={stylesGlobal.cancel_delete_image} source={require("../icons/connection-delete.png")} />
                        </TouchableOpacity>
                    </View>
                    <View style={{ width: '100%', paddingVertical: 30, alignItems: 'center' }}>
                        <Text style={[styles.text_button, stylesGlobal.font, { width: '80%', textAlign: 'center' }]}>{Constants.FORGOT_PASSWORD_MESSAGE}</Text>
                        <View style={{ width: '90%' }}>
                            <TextInput
                                underlineColorAndroid="transparent"
                                returnKeyType={'done'}
                                placeholder="Email Address"
                                autoCorrect={false}
                                keyboardType={"email-address"}
                                autoCapitalize='none'
                                style={[{ width: '100%', height: 40, fontSize: 15, paddingHorizontal: 5, color: Colors.black, marginTop: 20, borderWidth: 1, borderColor: Colors.black, borderRadius: 5 }, stylesGlobal.font]}
                                onChangeText={(text) => this.setState({ username: text })}
                                value={this.state.username}
                            />
                            <TouchableOpacity style={[{ width: '100%', height: 40, marginTop: 20, backgroundColor: Colors.gold, alignItems: 'center', justifyContent: 'center', borderRadius: 5 }, stylesGlobal.shadow_style]}
                                onPress={() => {
                                    Keyboard.dismiss()
                                    if (ValidationUtils.isEmptyOrNull(this.state.username)) {
                                        Alert.alert(Constants.EMPTY_EMAIL_ID);
                                    } else if (!ValidationUtils.isEmailValid(this.state.username)) {
                                        Alert.alert(Constants.INVALID_EMAIL_ID);
                                    } else {
                                        this.setState({
                                            loading: true
                                        });
                                        this.callForgotPasswordAPI();
                                    }
                                }}
                            >
                                <Text style={[{ fontSize: 16, color: Colors.white }, stylesGlobal.font]}>{"Submit"}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </View>
        )
    }

    onPressOutside = () => {
        Keyboard.dismiss()
        this.setState({ placeholder: '' })
    }

    renderSignInView = () => {
        return (
            <View style={styles.container} >
                <View style={{ position: 'absolute', width: '100%', aspectRatio: 1, left: 0, bottom: 0 }}>
                    <Image style={{ width: '100%', height: '100%', resizeMode: 'cover', }} source={require("../icons/launch.jpg")}></Image>
                </View>
                <KeyboardAwareScrollView keyboardShouldPersistTaps = "handled" contentContainerStyle={{ width: '100%', flexDirection: "column", alignItems: 'center', marginTop: 15 }} extraScrollHeight={100} enableOnAndroid={true} >
                    <View style={styles.input_area_view}>
                        <View style={{ width: '100%', alignItems: 'center', justifyContent: 'center' }}>
                            <Text style={[styles.subtitle, stylesGlobal.font]}>{Constants.SIGN_IN_TITLE_FIRST}</Text>
                        </View>
                        <View style={{ width: '100%', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', marginTop: 15, }}>
                            <Text style={[styles.subtitle, stylesGlobal.font]}>{Constants.SIGN_IN_TITLE_SECOND}</Text>
                            <View style={{ width: '65%', aspectRatio: 4, marginLeft: 10 }}>
                                <Image style={{ width: '100%', height: '100%', resizeMode: 'contain' }} source={require("../icons/logo_new.png")} />
                            </View>
                        </View>
                    </View>
                    <View style={[styles.input_area_view,]}>
                        <View style={{ width: '100%', alignItems: 'center', justifyContent: 'center' }}>
                            <Text style={[styles.subtitle, stylesGlobal.font]}>{Constants.SIGN_IN_BOTTOM_BANNER}</Text>
                        </View>
                        <View style={{ width: '80%', marginTop: 10, alignItems: 'center' }}>
                            <Text style={[styles.signin_contents, stylesGlobal.font, { marginBottom: 0 }]}>{Constants.SIGN_IN_BOTTOM_CONTENTS}</Text>
                            {/* <Text style={[styles.signin_contents, stylesGlobal.font]}>{Constants.SIGN_IN_CONTENTS_FIRST}</Text>
                            <Text style={[styles.signin_contents, stylesGlobal.font]}>{Constants.SIGN_IN_CONTENTS_SECOND}</Text>
                            <Text style={[styles.signin_contents, stylesGlobal.font, {marginBottom: 0}]}>{Constants.SIGN_IN_CONTENTS_THIRD}</Text> */}
                        </View>
                    </View>
                    {
                        this.state.isGettingData &&
                        <View style={{ width: '100%', marginTop: 20, alignItems: 'center' }}>
                            <Image style={{ width: 50, height: 50 }} resizeMode={'contain'} source={require("../icons/loader.gif")} />
                            <Text style={[{ fontSize: 18, color: Colors.white }, stylesGlobal.font]}>{"Loading"}</Text>
                        </View>
                    }
                    {
                        !this.state.isGettingData &&
                        <View style={{ width: '100%', alignItems: 'center' }} onLayout={event => this.setState({ login_dialog_y: event.nativeEvent.layout.y })}>
                            <View style={styles.input_area_view}>
                                <Text style={[styles.text_button, stylesGlobal.font_bold, { marginBottom: 20 }]}>{"Member Area"}</Text>
                                <View style={styles.input_view}>
                                    <View style={styles.input_icon_view}>
                                        <Image source={require("../icons/signin_username.png")} style={styles.input_icon} />
                                    </View>
                                    <View style={{ flex: 1, marginRight: 10 }}>
                                        <TextInput
                                            underlineColorAndroid="transparent"
                                            returnKeyType={"next"}
                                            placeholder="Email"
                                            onFocus={() => this.setState({ placeholder: 'username' })}
                                            placeholderTextColor={Colors.gray}
                                            autoCorrect={false}
                                            keyboardType={"email-address"}
                                            autoCapitalize='none'
                                            style={[styles.usernameTextInput, { color: this.state.placeholder === 'username' ? Colors.black : Colors.gold }, stylesGlobal.font]}
                                            onChangeText={username => this.setState({ username })}
                                            value={this.state.username}
                                            defaultValue=""
                                            multiline={false}
                                            textContentType={"username"}
                                            onSubmitEditing={event => {
                                                this.refs.InputPassword.focus();
                                            }}
                                        />
                                    </View>
                                </View>
                                <View style={[styles.input_view, { marginTop: 20 }]}>
                                    <View style={styles.input_icon_view}>
                                        <Image source={require("../icons/signin_password.png")} style={styles.input_icon} />
                                    </View>
                                    <View style={{ flex: 1, marginRight: 20 }}>
                                        <TextInput
                                            underlineColorAndroid="transparent"
                                            ref="InputPassword"
                                            password={true}
                                            multiline={false}
                                            onFocus={() => this.setState({ placeholder: 'password' })}
                                            placeholder="Password"
                                            placeholderTextColor={Colors.gray}
                                            defaultValue=""
                                            autoCorrect={false}
                                            secureTextEntry={true}
                                            returnKeyType={"done"}
                                            autoCapitalize='none'
                                            style={[styles.usernameTextInput, { color: this.state.placeholder === 'password' ? Colors.black : Colors.gold }, stylesGlobal.font]}
                                            onChangeText={password => this.setState({ password })}
                                            value={this.state.password}
                                            keyboardType='ascii-capable'
                                            textContentType={"password"}
                                        />
                                    </View>
                                </View>
                                <View style={{ width: '100%', height: 40, paddingHorizontal: 10, marginTop: 20 }}>
                                    <TouchableOpacity style={[{ backgroundColor: Colors.gold, flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 5 }, stylesGlobal.shadow_style]}
                                        onPress={() =>
                                            this.signInButtonPressed(
                                                this.state.username.trim(),
                                                this.state.password.trim()
                                            )
                                        }
                                    >
                                        <Text style={[{ fontSize: 16, color: Colors.white }, stylesGlobal.font_bold]}>Login</Text>
                                    </TouchableOpacity>
                                </View>
                                <View style={{ justifyContent: "center", marginTop: 20, }}>
                                    <TouchableOpacity style={{ flexDirection: 'row' }} onPress={() => this.signUpButtonClick()}>
                                        <Text style={[styles.text_button, stylesGlobal.font_bold]}>or </Text>
                                        <View style={{ borderBottomColor: Colors.black, borderBottomWidth: 1 }}>
                                            <Text style={[styles.text_button, stylesGlobal.font_bold]}>Create a Profile</Text>
                                        </View>
                                    </TouchableOpacity>

                                </View>
                                <View style={{ width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, }}>
                                    <TouchableOpacity style={{}} onPress={() => Linking.openURL(Global.ABOUTUS_URL)}>
                                        <View style={{ borderBottomColor: Colors.black, borderBottomWidth: 1, margin: 10 }}>
                                            <Text style={[styles.text_button, { fontSize: 12 }, stylesGlobal.font_bold]}>{Constants.ABOUT_US}</Text>
                                        </View>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={{}} onPress={() => this.setState({ forgot_password_popup: true })}>
                                        <View style={{ borderBottomColor: Colors.black, borderBottomWidth: 1, margin: 10 }}>
                                            <Text style={[styles.text_button, { fontSize: 12 }, stylesGlobal.font_bold]}>{Constants.FORGOT_PASSWORD}</Text>
                                        </View>
                                    </TouchableOpacity>
                                </View>
                            </View>
                            <View style={{ width: '90%', marginTop: 40, marginBottom: 20, alignItems: 'center' }}>
                                <Text style={[{ fontSize: 12, textAlign: 'center', color: 'white', }, stylesGlobal.font_bold]} onPress={() => {
                                    Linking.openURL(Global.TERMS_AND_CONDITIONS_URL)
                                }}>{Constants.SIGN_IN_COPYWRITE_TITLE}</Text>
                                <Text style={[{ fontSize: 12, textAlign: 'center', color: 'white', marginTop: 15 }, stylesGlobal.font]}>{Constants.SIGN_IN_COPYWRITE_CONTENTS}</Text>
                            </View>
                        </View>
                    }
                </KeyboardAwareScrollView>
            </View>
        );
    }

    /** Handle SignInButton Press
     *
     * @param username
     * @param password
     */
    signInButtonPressed = (username, password) => {
        Keyboard.dismiss()
        if (ValidationUtils.isEmptyOrNull(username)) {
            Alert.alert(Constants.EMPTY_USER_NAME);
        } else if (!ValidationUtils.isEmailValid(username)) {
            Alert.alert(Constants.INVALID_USER_NAME);
        } else if (ValidationUtils.isEmptyOrNull(password)) {
            Alert.alert(Constants.EMPTY_PASSWORD);
        } else {
            this.setState({loginCnt:1}, () => this.callLoginAPIs());
        }
    };

    /** Handle LoginAPI Call
     *
     * @returns {Promise<void>}
     */

    callLoginAPIs = async () => {
        try {
            this.setState({ loading: true });
            let uri = Memory().env == "LIVE" ? Global.BASE_URL + "login" : Global.BASE_URL_DEV + "login";
            let params = new FormData();
            params.append("username", this.state.username);
            params.append("password", this.state.password);
            params.append("format", "json");
            params.append("device_token", this.state.deviceToken);
            console.log(TAG + " callLoginAPIs uri " + uri);
            console.log(TAG + " callLoginAPIs params>>> ", JSON.stringify(params));
            WebService.callServicePost(uri, params, this.handleSignInResponse);
        } catch (error) {
            this.setState({ loading: false });
            console.log("catch1" + error);
            if (error != undefined && error != null && error.length > 0) {
                console.log("catch1_If" + error);
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    };
    /*
    *
        @param isError
    */
    handleSignInResponse = async (response, isError) => {
        // console.log("signin Response " + JSON.stringify(response));
        console.log('sigin state', this.state.loginCnt);
        console.log("signin isError " + isError);
        this.setState({ loading: false });
        if (!isError) {
            var result = response;
            if (result != undefined && result != null) {
                if (typeof result.status != undefined && result.status != null) {
                    if (result.status == "error") {
                        if (Memory().env == "DEV") {
                            Memory().env = "LIVE";
                            
                            // 
                            // 
                            if(this.state.loginCnt > 1){
                                Alert.alert(Constants.INVALID_USERNAME_PASSWORD, "");
                                this.setState({ loading: false });
                            }else{
                                this.setState({loginCnt:this.state.loginCnt + 1}, () => this.callLoginAPIs());
                            }
                            
                           
                        } else {
                            Memory().env = "DEV";
                            if(this.state.loginCnt > 1){
                                Alert.alert(Constants.INVALID_USERNAME_PASSWORD, "");
                                this.setState({ loading: false });
                            }else{
                                this.setState({loginCnt:this.state.loginCnt + 1}, () => this.callLoginAPIs());
                            }
                            
                        }
                    } else {

                        this.setState({loginCnt: 0});
                        if (result.data != undefined && result.data != null) {
                            var mData = result.data;
                            if (mData.user_id != undefined && mData.user_id != null && mData.user_id != "") {
                                try {
                                    var md5 = require('md5');
                                    var prfixUrl = Memory().env == "LIVE" ? Global.MD5_BASE_URL : Global.MD5_BASE_URL_DEV;
                                    let prefixMD5 = md5(prfixUrl);
                                    var userUrl = prefixMD5 + "USER_" + mData.user_id + "/cometchat/"
                                    let userChannelMD5 = md5(userUrl);
                                    var userChannelId = "";

                                    if (Platform.OS === 'ios') {
                                        userChannelId = "C_" + userChannelMD5 + "i";
                                    } else {
                                        userChannelId = "C_" + userChannelMD5 + "a";
                                    }
                                    try {
//                                        FCM.subscribeToTopic(userChannelId);
                                    } catch (error) {
                                        console.log(TAG, "fcm >>>>error:", error);
                                    }

                                    AsyncStorage.setItem(Constants.KEY_USER_GENDER, mData.gender);
                                    AsyncStorage.setItem(Constants.KEY_USER_EMAIL, this.state.username);
                                    AsyncStorage.setItem(Constants.KEY_USER_PASSWORD, this.state.password);
                                    AsyncStorage.setItem(Constants.KEY_USER_ID, mData.user_id);

                                    if (mData.slug != undefined && mData.slug != null) {
                                        AsyncStorage.setItem(Constants.KEY_USER_SLUG, mData.slug);
                                    }

                                    if (mData.token != undefined && mData.token != null) {
                                        AsyncStorage.setItem(Constants.KEY_USER_TOKEN, mData.token);
                                    }

                                    if (mData.is_fan != undefined && mData.is_fan != null) {
                                        AsyncStorage.setItem(Constants.KEY_USER_IS_FAN, mData.is_fan);
                                    }

                                    if (mData.first_name != undefined && mData.first_name != null) {
                                        AsyncStorage.setItem(Constants.KEY_USER_FIRST_NAME, mData.first_name);
                                    }

                                    if (mData.last_name != undefined && mData.last_name != null) {
                                        AsyncStorage.setItem(Constants.KEY_USER_LAST_NAME, mData.last_name);
                                    }

                                    if (mData.address != undefined && mData.address != null) {
                                        AsyncStorage.setItem(Constants.KEY_USER_ADDRESS, mData.address);
                                    }

                                    if (mData.profile_imgpath != undefined && mData.profile_imgpath != null) {
                                        AsyncStorage.setItem(Constants.KEY_USER_IMAGE_URL, mData.profile_imgpath);
                                    }

                                    if (mData.profile_filename != undefined && mData.profile_filename != null) {
                                        AsyncStorage.setItem(Constants.KEY_USER_IMAGE_NAME, mData.profile_filename);
                                    }
                                    AsyncStorage.setItem(Constants.KEY_MEMBER_PLAN, mData.member_plan);
                                    AsyncStorage.setItem(Constants.KEY_IS_VERIFIED, mData.is_verified);
                                    AsyncStorage.setItem(Constants.KEY_CHAT_MODAL, "true");

                                    let dashboard_data = await AsyncStorage.getItem(Constants.KEY_DASHBOARD_DATA);
                                    if (dashboard_data != null && dashboard_data != "") {
                                        let dashboard_json = JSON.parse(dashboard_data);
                                        if (dashboard_json.userProfileInfo != null && dashboard_json.userProfileInfo.username == this.state.username) {

                                        } else {
                                            await AsyncStorage.setItem(Constants.KEY_DASHBOARD_DATA, "");

                                        }
                                    } else {
                                        await AsyncStorage.setItem(Constants.KEY_DASHBOARD_DATA, "");

                                    }
                                    await AsyncStorage.setItem('last_server', Memory().env);
                                    AsyncStorage.setItem("MyRecentChatList", "");
                                    this.props.navigation.navigate("Dashboard", { web_link_object: this.state.web_link_object });
                                    this.setState({
                                        web_link_object: null
                                    })
                                } catch (error) {
                                    console.log(TAG, "condition error " + error);
                                }
                            } else {
                                Alert.alert(Constants.INVALID_USERNAME_PASSWORD);
                            }
                            this.setState({
                                loading: false
                            });
                        }
                    }
                } else {
                    if (result != undefined && result != null && result.length > 0) {
                        Alert.alert(result.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
                    }
                    this.setState({
                        loading: false
                    });
                }
            }
        } else {
            if (response != undefined && response != null && response.length > 0) {
                Alert.alert(response.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
            this.setState({
                loading: false
            });
        }
    };

    /**  SignUp Button Click
     *
     */
    signUpButtonClick = () => {
        Keyboard.dismiss()
        this.props.navigation.navigate("SelectRoleScreen");
    };

    /**remove 0 index view from stack so splash screen not display after pressback button of sign in screen and app will exist
     *
     * @param routeName
     * @private
     */
    _navigateTo = routeName => {
        this.props.navigation.navigate(routeName)
    };
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: "100%",
        backgroundColor: Colors.black,
        height: "100%",
        justifyContent: 'center',
    },
    background_image: {
        flex: 1,
        width: '100%',
    },
    logoImage: {
        width: 100,
        height: 100 / 4,
        resizeMode: 'contain',
    },
    subtitle: {
        marginTop: height * 0.01,
        color: Colors.black,
        fontSize: 18,
        textAlign: 'center',
    },
    signin_contents: {
        color: Colors.black,
        fontSize: 12,
        backgroundColor: "transparent",
        textAlign: 'center',
        marginBottom: 10,
    },
    input_area_view: {
        backgroundColor: Colors.white,
        justifyContent: 'center',
        alignItems: 'center',
        width: '90%',
        // marginTop: 20,
        marginTop: height * 0.03,
        borderRadius: 10,
        paddingVertical: 20,
        shadowColor: "rgba(255,255,255,.4)",
        shadowOpacity: .8,
        shadowRadius: 3,
        elevation: 1
    },
    input_view: {
        flexDirection: "row",
        alignItems: 'center',
        backgroundColor: 'white',
        height: 50,
        marginHorizontal: 10,
        borderWidth: 1,
        borderColor: '#565456'
    },
    input_icon_view: {
        justifyContent: "center",
        alignItems: "center",
        height: '100%',
        width: 50,
        borderRightWidth: 1,
        borderColor: '#565456',
        backgroundColor: Colors.white
    },
    input_icon: {
        width: 20,
        height: 20,
        resizeMode: 'contain',
        // tintColor: Colors.gold
    },
    usernameTextInput: {
        borderBottomColor: "#FFFFFF",
        borderBottomWidth: 1,
        fontSize: 15,
        height: 35,
        paddingLeft: 5,
        paddingVertical: 0
    },
    text_button_row: {
        borderBottomColor: Colors.white,
        borderBottomWidth: 1
    },
    text_button: {
        fontSize: 16,
        fontWeight: null,
        color: Colors.black,
    }
});
