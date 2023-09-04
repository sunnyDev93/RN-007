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
    Keyboard
} from "react-native";
import * as ValidationUtils from "../utils/ValidationUtils";
import { Constants } from "../consts/Constants";
import ProgressIndicator from "./ProgressIndicator";
import WebService from "../core/WebService";
import * as Global from "../consts/Global";
import { Colors } from "../consts/Colors";
import {stylesGlobal} from '../consts/StyleSheet'
import Memory from '../core/Memory';
import AsyncStorage from '@react-native-community/async-storage';

var TAG = "ForgotPassword";
var deviceToken = '';

export default class ForgotPassword extends Component {
    constructor(props) {
        super(props);

        this.state = {
            forgotPassword: "",
            loading: false,
        };
    }

    UNSAFE_componentWillMount() {
        this.setState({
            forgotPassword: this.props.route.params.email,
            loading: false,
        })
        this.getData();
    }

    /**
     * get user stored information
     */
    getData = async () => {
        try {
            console.log(TAG + " getData");
            deviceToken = await AsyncStorage.getItem(Constants.FIREBASE_ID);
        } catch (error) {
            // Error retrieving data
        }
    };

    render() {
        return (
            <View style={styles.container}>

                <ImageBackground
                    style={styles.container}
                    source={require("../icons/launch.jpg")}
                >
                    <View style={{ flex: 1, flexDirection: "column" }}>
                        <Image
                            style={styles.logoImage}
                            source={require("../icons/logo_new.png")}
                        />

                        <Text style={[styles.memberNotText, stylesGlobal.font]}>{Constants.FORGOT_PASSWORD}</Text>
                        <Text style={[styles.titleText, stylesGlobal.font]}>{Constants.FORGET_PWD_TITLE}</Text>


                        <View style={[styles.rowView, { marginTop: 30 }]}>

                            <View style={{ flex: 1, marginRight: 20, marginLeft: 20 }}>
                                <TextInput
                                    placeholder={'Enter Email Address'}
                                    placeholderTextColor={Colors.white}
                                    underlineColorAndroid="transparent"
                                    returnKeyType={"done"}
                                    keyboardType={"email-address"}
                                    autoCapitalize='none'
                                    style={[styles.usernameTextInput, stylesGlobal.font]}
                                    onChangeText={forgotPassword => this.setState({ forgotPassword })}
                                    value={this.state.forgotPassword}
                                    defaultValue=""
                                    multiline={false}
                                />
                            </View>
                        </View>


                        <TouchableOpacity style = {[{alignSelf: "center", padding: 20, marginTop: 30, backgroundColor: Colors.gold, borderRadius: 5}, stylesGlobal.shadow_style]}
                            onPress={() =>
                                this.forgotPasswordButtonPressed(
                                    this.state.forgotPassword
                                )
                            }
                        >
                            <Image
                                style={styles.nextButton}
                                source={require("../icons/iconlogin.png")}
                            />
                        </TouchableOpacity>


                    </View>

                    <View style={styles.bottomView}>
                        <View style={{ height: 1, backgroundColor: "#ffffff" }} />
                        <Text style={[styles.memberNotText, stylesGlobal.font]}>{Constants.RETURN_LOGIN_PAGE}</Text>
                        <TouchableOpacity style={[{backgroundColor:Colors.gold, width:"40%", height:40, alignItems:'center',
                                alignSelf: "center", marginBottom: 30, justifyContent:'center', borderRadius: 5}, stylesGlobal.shadow_style]}
                            onPress={this.backLoginClick}>
                            {/* <Image
                                style={styles.singUpButton}
                                source={require("../icons/iconforgotLogin.png")}
                            /> */}
                            <Text style={[{fontSize:16,fontWeight:'bold',color:Colors.white}, stylesGlobal.font]}>Login Now</Text>
                        </TouchableOpacity>
                    </View>


                    {this.state.loading == true ? <ProgressIndicator /> : null}
                </ImageBackground>
            </View>
        );
    }


    /** Handle ForgetPassword API Call
     *
     * @returns {Promise<void>}
     */

    callForgotPasswordAPI = async () => {

        try {

            let uri = Memory().env == "LIVE" ? Global.URL_FORGOTPASSWORD : Global.URL_FORGOTPASSWORD_DEV;
            let params = new FormData();
            params.append("format", "json");
            params.append("username", this.state.forgotPassword);

            console.log(TAG + " callGetMembersAPIs uri " + uri);
            console.log(TAG + " callGetMembersAPIs params " + JSON.stringify(params));

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


    /** CallBack Function to Handle Forget Password API
     *
     * @param response
     * @param isError
     */
    handleForgotPasswordResponse = (response, isError) => {
        this.setState({
            loading: false
        });

        console.log("Response " + response);
        console.log("isError " + isError);

        if (!isError) {
            var result = response;

            if (result != undefined && result != null) {
                console.log(TAG + " forgetPasswordAPI result " + JSON.stringify(result));
                if (typeof result.status != undefined && result.status != null) {
                    if (result.status == "error") {
                        Alert.alert(result.msg.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""))
                    } else {
                        this.props.navigation.goBack()
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


    /** Handle forgotPasswordButtonPressed
     *
     * @param username
     * @param password
     */
    forgotPasswordButtonPressed = (forgotPassword) => {
        Keyboard.dismiss()

        const { navigate } = this.props.navigation;

        if (ValidationUtils.isEmptyOrNull(forgotPassword)) {
            Alert.alert(Constants.EMPTY_EMAIL_ID);
        } else if (!ValidationUtils.isEmailValid(forgotPassword)) {
            Alert.alert(Constants.INVALID_EMAIL_ID);
        } else {
            this.setState({
                loading: true
            });
            this.callForgotPasswordAPI();
        }
    };


    /**  LoginBack Button Click
     *
     */
    backLoginClick = () => {
        Keyboard.dismiss()
        this.props.navigation.goBack()
    };

}
const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: "100%",
        height: "100%",
        resizeMode:'contain'
    },
    logoImage: {
        alignSelf: "center",
        marginTop: 50,
        marginBottom: 30,
        width:282,
        height:282 /4,
        resizeMode:'contain'
    },
    titleText: {
        paddingLeft: 30,
        paddingRight: 30,
        color: "#ffffff",
        alignItems: "center",
        textAlign: "center",
        fontSize: 15,
        backgroundColor: "transparent"
    },
    rowView: {
        flexDirection: "row",
        alignItems: "center"
    },
    usernameTextInput: {
        borderBottomColor: "#FFFFFF",
        borderBottomWidth: 1,
        color: "#FFFFFF",
        fontSize: 15,
        height: 35
    },
    nextButton: {
        alignSelf: "center",
        // marginTop: 30
    },
    memberNotText: {
        color: "#FFFFFF",
        fontSize: 20,
        marginBottom: 10,
        marginTop: 10,
        alignSelf: "center",
        alignItems: "center",
        backgroundColor: "transparent"
    },
    singUpButton: {
        alignSelf: "center",
        marginBottom: 10,
        alignItems: "center"
    },
    bottomView: {
        position: "absolute",
        bottom: 0,
        backgroundColor: Colors.transparent,
        width: "100%"
    },
});
