import React, { Component } from "react";
import {
    Alert,
    StyleSheet,
    SafeAreaView,
    View,
    TouchableOpacity,
    TextInput,
    Text,
} from "react-native";

import { Colors } from "../consts/Colors";
import { Constants } from "../consts/Constants";
import { stylesGlobal, STICKY_HEADER_HEIGHT } from '../consts/StyleSheet'
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import Memory from '../core/Memory';
import * as Global from "../consts/Global";
import WebService from "../core/WebService";
import ProgressIndicator from "./ProgressIndicator";
import AsyncStorage from '@react-native-community/async-storage';


var TAG = "ChangePassword";

export default class ChangePassword extends React.Component {

    constructor(props) {
        super(props)

        this.state = {
            current_password: "",
            new_password: "",
            confirm_password: "",

        }

    }

    UNSAFE_componentWillMount() {
        this.getData();
        
    }

    componentWillUnmount() {

    }

    /**
       * get async storage data
       */
    getData = async () => {
        
        try {
            var email = await AsyncStorage.getItem(Constants.KEY_USER_EMAIL);
            var userId = await AsyncStorage.getItem(Constants.KEY_USER_ID);
            var userToken = await AsyncStorage.getItem(Constants.KEY_USER_TOKEN);
            var userSlug = await AsyncStorage.getItem(Constants.KEY_USER_SLUG);
            var userFirstName = await AsyncStorage.getItem(Constants.KEY_USER_FIRST_NAME);
            var userLastName = await AsyncStorage.getItem(Constants.KEY_USER_LAST_NAME);
            var userImagePath = await AsyncStorage.getItem(Constants.KEY_USER_IMAGE_URL);
            var userImageName = await AsyncStorage.getItem(Constants.KEY_USER_IMAGE_NAME);
            var member_plan = await AsyncStorage.getItem(Constants.KEY_MEMBER_PLAN);
            var is_verified = await AsyncStorage.getItem(Constants.KEY_IS_VERIFIED);

            console.log(TAG + " getData userId " + userId);
            console.log(TAG + " getData userToken " + userToken);
            console.log(TAG + " getData userSlug " + userSlug);

            this.setState({
                email: email,
                userId: userId,
                userToken: userToken,
                userSlug: userSlug,
                userImagePath: userImagePath,
                userImageName: userImageName,
                showModel: false,
                member_plan: member_plan,
                is_verified: is_verified,

            });
        } catch (error) {
            // Error retrieving data
        }

    };

    update_password() {
        if(this.state.current_password == "") {
            Alert.alert(Constants.CURRENT_PASSWORD, "");
            return;
        }
        if(this.state.new_password.length < 6) {
            Alert.alert(Constants.INVALID_PASSWORD_LENGTH, "");
            return;
        }
        if(this.state.new_password != this.state.confirm_password) {
            Alert.alert(Constants.PASSWORD_MATCH, "");
            return;
        }
        try {

            this.setState({
                loading: true
            });

            let uri = Memory().env == "LIVE" ? Global.URL_UPDATE_PASSWORD : Global.URL_UPDATE_PASSWORD_DEV;
            let params = new FormData();
            params.append("token", this.state.userToken);
            params.append("user_id", this.state.userId);
            params.append("format", "json");
            params.append("current_password", this.state.current_password);
            params.append("password", this.state.new_password);
            params.append("confirm_password", this.state.confirm_password);
            params.append("username", this.state.email);
            
            console.log(TAG + " callUpdatePasswordAPI uri " + uri);
            console.log(TAG + " callUpdatePasswordAPI params " + JSON.stringify(params));

            WebService.callServicePost(uri, params, this.handleUpdatePassword);
        } catch (error) {
            console.log(TAG + " callUpdatePasswordAPI error " + error);
            this.setState({
                loading: false
            });
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    }

    handleUpdatePassword = (response, isError) => {
        console.log(TAG + " callUpdatePasswordAPI Response " + JSON.stringify(response));
        console.log(TAG + " callUpdatePasswordAPI isError " + isError);

        if (!isError) {
            var result = response;
            if (result != undefined && result != null) {
                if(result.status == "success") {
                    
                    this.setState({
                        current_password: "",
                        new_password: "",
                        confirm_password: "",
                    })
                    Alert.alert(Constants.PASSWORD_UPDATE_SUCCESS, "");
                } else {
                    //Alert.alert(Constants.NO_INTERNET, "");
                    if(response.msg)
                    {
                        Alert.alert(response.msg, "");
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

        this.setState({
            loading: false
        });
    }


    render() {
        return (
            <SafeAreaView style={styles.container}>
            {
                this.state.loading && <ProgressIndicator/>
            }
                <View style = {styles.card_view}>
                    <View style={styles.title_header}>
                        <Text style={[styles.headText, stylesGlobal.font]}>{"CHANGE PASSWORD"}</Text>
                    </View>
                    <KeyboardAwareScrollView style = {{flex:1, width: '100%'}}
                        contentContainerStyle={{flexGrow : 1, alignItems : 'center', justifyContent: 'center'}}
                        extraScrollHeight={100}
                        enableAutomaticScroll={true}
                        keyboardShouldPersistTaps = "handled"
                        keyboardDismissMode="on-drag"
                    >
                        <View style = {{width: '100%', height: '100%', alignItems: 'center',}}>
                            <View style = {styles.component_view}>
                                <Text style = {[styles.title_text, stylesGlobal.font]}>{"Current Password"}</Text>
                                <TextInput style = {[styles.text_input_style, stylesGlobal.font]} 
                                    secureTextEntry = {true} 
                                    returnKeyType={"done"}
                                    blurOnSubmit={false} 
                                    placeholder = {"Current Password"} 
                                    value = {this.state.current_password}
                                    onChangeText = {(text) => this.setState({current_password: text})}
                                    textContentType = {'password'}
                                    autoCompleteType = {'password'}
                                />
                            </View>
                            <View style = {styles.component_view}>
                                <Text style = {[styles.title_text, stylesGlobal.font]}>{"New Password"}</Text>
                                <TextInput style = {[styles.text_input_style, stylesGlobal.font]} 
                                    secureTextEntry = {true} 
                                    textContentType = {"newPassword"} 
                                    returnKeyType={"done"}
                                    blurOnSubmit={false} 
                                    placeholder = {"New Password"} 
                                    onChangeText = {(text) => this.setState({new_password: text})}
                                >
                                    {this.state.new_password}
                                </TextInput>
                            </View>
                            <View style = {styles.component_view}>
                                <Text style = {[styles.title_text, stylesGlobal.font]}>{"Confirm Password"}</Text>
                                <TextInput style = {[styles.text_input_style, stylesGlobal.font]} 
                                    secureTextEntry = {true} 
                                    textContentType = {"newPassword"} 
                                    returnKeyType={"done"}
                                    blurOnSubmit={false} 
                                    placeholder = {"Confirm Password"} 
                                    onChangeText = {(text) => this.setState({confirm_password: text})}
                                >
                                    {this.state.confirm_password}
                                </TextInput>
                            </View>
                            <View style = {{width: '100%', flex: 1, justifyContent: 'flex-start', alignItems: 'center', marginTop: 20, marginBottom: 18}}>
                                <TouchableOpacity style = {[styles.button_style, stylesGlobal.shadow_style]} onPress = {() => this.update_password()}>
                                    <Text style = {[styles.button_text, stylesGlobal.font]}>{"Update"}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </KeyboardAwareScrollView>
                </View>
            </SafeAreaView>
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
    component_view: {
        width: '95%', 
        marginTop: 20
    },
    title_text: {
        fontSize: 14, 
        color: Colors.black
    },
    text_input_style: {
        width: '100%', 
        height: 40, 
        marginTop: 10, 
        borderColor: Colors.black, 
        borderWidth: 0.5, 
        borderRadius: 3, 
        paddingLeft: 5
    },
    button_style: {
        // width: '50%',
        // height: 40,
        backgroundColor: Colors.gold,
        borderRadius: 5,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal:30,
        paddingVertical:10
    },
    button_text: {
        fontSize: 14,
        color: Colors.white,
        
    }
});
