import React, { useCallback } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    ScrollView,
    Image,
    FlatList,
    Dimensions,
    Linking,
    Alert,
} from 'react-native';
import AsyncStorage from "@react-native-community/async-storage";
import { EventRegister } from "react-native-event-listeners";
import VersionInfo from "react-native-version-info";

import WebService from "../core/WebService";
import { Constants } from "../consts/Constants";
import { Colors } from "../consts/Colors";
import { stylesGlobal } from "../consts/StyleSheet";
import * as GlobalStyleSheet from "../consts/StyleSheet";
import * as Global from "../consts/Global";
import Memory from '../core/Memory';
import ProgressIndicator from "../components/ProgressIndicator";
import { ImageCompressor } from '../components/ImageCompressorClass';

var TAG = "DashboardPopupView";
var profile_status_view_flag = false;

export default class DashboardPopupView extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            userId: "",
            userToken: "",
            userSlug: "",
            userFirstName: "",
            userLastName: "",
            userImagePath: "",
            userImageName: "",
            user_email: "",

            is_portrait: true,
            screen_height: Dimensions.get('screen').height,

            payment_failed_view: false,
            profile_status_view: false,
            profile_percentage: 20,

            bar_image: require('../icons/20_percent.png'),
            appstoreVersion: "3.0.2",
            skip_now: false,
        }
        this.onEndReachedCalledDuringMomentum = true;
    }

    async UNSAFE_componentWillMount() {
        // console.log(typeof VersionInfo.appVersion);
        // console.log(VersionInfo.buildVersion);
        // console.log(VersionInfo.bundleIdentifier);
        try {
            let userFirstName = await AsyncStorage.getItem(Constants.KEY_USER_FIRST_NAME);
            let userLastName = await AsyncStorage.getItem(Constants.KEY_USER_LAST_NAME);
            let userImagePath = await AsyncStorage.getItem(Constants.KEY_USER_IMAGE_URL);
            let userImageName = await AsyncStorage.getItem(Constants.KEY_USER_IMAGE_NAME);
            var userId = await AsyncStorage.getItem(Constants.KEY_USER_ID);
            var userToken = await AsyncStorage.getItem(Constants.KEY_USER_TOKEN);
            var userSlug = await AsyncStorage.getItem(Constants.KEY_USER_SLUG);
            var user_email = await AsyncStorage.getItem(Constants.KEY_USER_EMAIL);

            this.setState({
                userId: userId,
                userToken: userToken,
                userSlug: userSlug,
                userFirstName: userFirstName,
                userLastName: userLastName,
                userImagePath: userImagePath,
                userImageName: userImageName,
                user_email: user_email,
            })

            if (Dimensions.get("window").width < Dimensions.get("window").height) {
                this.setState({
                    is_portrait: true,
                    screen_height: Dimensions.get('screen').height,
                })
            } else {
                this.setState({
                    is_portrait: false,
                    screen_height: Dimensions.get('screen').width,
                })
            }

            Dimensions.addEventListener("change", () => {
                if (Dimensions.get("window").width < Dimensions.get("window").height) {
                    this.setState({
                        is_portrait: true,
                        screen_height: Dimensions.get('screen').height,
                    })
                } else {
                    this.setState({
                        is_portrait: false,
                        screen_height: Dimensions.get('screen').width,
                    })
                }
            })
            this.getAppstoreVersion();
            // this.getPaymentStatus();
            // this.getProfileStatus();
        } catch (error) {
            // Error retrieving data
            console.log(TAG + ' getData  error  ' + error);
        }
    }

    async componentDidMount() {
    }

    componentWillUnmount() {
        Dimensions.removeEventListener('change');
    }

    getAppstoreVersion = () => {
        try {
            let uri = Memory().env == "LIVE" ? Global.URL_APPSTORE_VERSION_CHECK : Global.URL_APPSTORE_VERSION_CHECK_DEV;
            console.log(TAG + " getAppstoreVersion uri " + uri);
            WebService.callServicePost(uri, {}, this.handleAppstoreVersionResponse);
        } catch (error) {
        }
    }

    /**
    * handle delete post  API response
    */
    handleAppstoreVersionResponse = (response, isError) => {
        // console.log(TAG + " getAppstoreVersion Response " + JSON.stringify(response));
        console.log(TAG + " getAppstoreVersion isError " + isError);
        if (!isError) {
            var result = response;
            if (typeof result != undefined && result != null) {
                if (result.status == "success") {
                    this.setState({ appstoreVersion: result.version });
                }
            }
        } else {
            if (response != undefined && response != null && response.length > 0) {
                Alert.alert(response.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    };

    getPaymentStatus = async () => {
        try {
            let uri = Memory().env == "LIVE" ? Global.URL_PAYMENT_CHECK : Global.URL_PAYMENT_CHECK_DEV;
            let params = {
                "token": this.state.userToken,
                "user_id": this.state.userId,
                "format": "json"
            };
            console.log(TAG + " callPaymentStatusAPI uri " + uri);
            console.log(TAG + " callPaymentStatusAPI params " + JSON.stringify(params));
            WebService.callServicePost(uri, params, this.handlePaymentStatusResponse);
        } catch (error) {
        }
    }

    /**
    * handle delete post  API response
    */
    handlePaymentStatusResponse = (response, isError) => {
        // console.log(TAG + " callPaymentStatusAPI Response " + JSON.stringify(response));
        console.log(TAG + " callPaymentStatusAPI isError " + isError);
        if (!isError) {
            var result = response;
            if (typeof result != undefined && result != null) {
                if (result.status == "success") {
                    if (result.payment_failed) {
                        this.setState({
                            payment_failed_view: true
                        })
                    } else {
                        this.setState({
                            payment_failed_view: false
                        })
                    }
                }
            }
        } else {
            if (response != undefined && response != null && response.length > 0) {
                Alert.alert(response.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    };

    getProfileStatus = async () => {
        try {
            let uri = Memory().env == "LIVE" ? Global.URL_PROFILE_STATUS : Global.URL_PROFILE_STATUS_DEV;
            let params = {
                "token": this.state.userToken,
                "user_id": this.state.userId,
                "format": "json"
            };
            console.log(TAG + " callProfileStatusAPI uri " + uri);
            console.log(TAG + " callProfileStatusAPI params " + JSON.stringify(params));
            WebService.callServicePost(uri, params, this.handleProfileStatusResponse);
        } catch (error) {
        }
    }

    /**
    * handle delete post  API response
    */
    handleProfileStatusResponse = (response, isError) => {
        // console.log(TAG + " callProfileStatusAPI Response " + JSON.stringify(response));
        console.log(TAG + " callProfileStatusAPI isError " + isError);
        if (!isError) {
            var result = response;
            if (typeof result != undefined && result != null) {
                if (result.status == "success") {
                    console.log(" ++++++++ handleProfileStatusResponse : result.percentage : ", result.percentage);
                    if (result.percentage == 100) {
                        this.setState({
                            profile_status_view: false,
                            bar_image: require('../icons/100_percent.png')
                        })
                    } else {
                        this.setState({ bar_image: require('../icons/20_percent.png') });
                        if (result.percentage == 20) {
                            this.setState({
                                bar_image: require('../icons/20_percent.png')
                            })
                        } else if (result.percentage == 40) {
                            this.setState({
                                bar_image: require('../icons/40_percent.png')
                            })
                        } else if (result.percentage == 60) {
                            this.setState({
                                bar_image: require('../icons/60_percent.png')
                            })
                        } else if (result.percentage == 80) {
                            this.setState({
                                bar_image: require('../icons/80_percent.png')
                            })
                        }
                        this.setState({
                            profile_status_view: true,
                            profile_percentage: result.percentage
                        })
                    }
                }
            }
        } else {
            if (response != undefined && response != null && response.length > 0) {
                Alert.alert(response.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    };

    refreshProfileImage = async () => {

    }

    setPaymentCheckFailed = async (status) => {
        this.setState({ payment_failed_view: status });
    }

    checkProfileStatus = () => {
        // console.log(" this.getProfileStatus(); ---- ", Global.profile_status_view_flag);
        this.getProfileStatus();
    }

    rednerUpdatePopup() {
        return (
            <View style={[{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, zIndex: 200, elevation: 200, alignItems: 'center' }]}>
                <View style={{ width: '100%', height: '100%', position: 'absolute', backgroundColor: Colors.black, opacity: 0.3 }} />
                <View style={{ width: '80%', height: '100%', alignItems: 'center', justifyContent: 'center', paddingHorizontal: this.state.is_portrait ? 10 : 0 }}>
                    <View style={{ width: this.state.is_portrait ? '100%' : '90%', borderRadius: 10, backgroundColor: Colors.white, overflow: 'hidden' }}>
                        <View style={{ width: '100%', padding: 20, borderBottomColor: Colors.lightGray, borderBottomWidth: 1 }}>
                            <Text style={[{ fontSize: 16, color: Colors.black }, stylesGlobal.font]}>{`You're missing out`}</Text>
                        </View>
                        <View style={{ width: '100%', padding: 20, borderBottomColor: Colors.lightGray, borderBottomWidth: 1 }}>
                            <Text style={[{ fontSize: 14, color: Colors.black }, stylesGlobal.font]}>{"Update your the 0.007% app for newest features."}</Text>
                        </View>
                        <View style={{ padding: 10, width: "100%" }}>
                            <View style={{ flexDirection: "row", justifyContent: "flex-end" }}>
                                <TouchableOpacity style={[stylesGlobal.common_button, stylesGlobal.shadow_style, { marginLeft: 10 }]}
                                    onPress={() => {
                                        Linking.canOpenURL(Global.APPSTORE_URL).then(supported => {
                                            console.log("dashboardpopup linking supported :", supported)
                                            if (supported) {
                                                Linking.openURL(Global.APPSTORE_URL);
                                            } else {
                                                console.log(" Dashboardpupup dont support url");
                                            }
                                        });
                                    }}
                                >
                                    <Text style={[{ fontSize: 14, color: Colors.white }, stylesGlobal.font]}>{"Update"}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[stylesGlobal.common_button, stylesGlobal.shadow_style, { marginLeft: 10 }]}
                                    onPress={() => { this.setState({ skip_now: true }); }}
                                >
                                    <Text style={[{ fontSize: 14, color: Colors.white }, stylesGlobal.font]}>{"Dismiss"}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </View>
            </View>

        )
    }

    compare(){
        let appVersion = parseInt(VersionInfo.appVersion.replace(".", ""));
        let appstoreVersion = parseInt(this.state.appstoreVersion.repeat(".", ""));
        if ( appVersion < appstoreVersion ) {
            return true;
        } else {
            return false;
        }
    }

    render() {
        if (this.state.payment_failed_view) {
            return (
                <View style={[{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, zIndex: 200, elevation: 200, alignItems: 'center' }]}>
                    <View style={{ width: '100%', height: '100%', position: 'absolute', backgroundColor: Colors.black, opacity: 0.3 }} />
                    {
                        this.compare() && !this.state.skip_now && this.rednerUpdatePopup()
                    }
                    <View style={{ width: '80%', height: '100%', alignItems: 'center', justifyContent: 'center', paddingHorizontal: this.state.is_portrait ? 10 : 0 }}>
                        <View style={{ width: this.state.is_portrait ? '100%' : '90%', borderRadius: 10, backgroundColor: Colors.white, overflow: 'hidden' }}>
                            <View style={{ width: '100%', padding: 20, borderBottomColor: Colors.lightGray, borderBottomWidth: 1 }}>
                                <Text style={[{ fontSize: 16, color: Colors.black }, stylesGlobal.font]}>{this.state.userFirstName + ", One More Step"}</Text>
                            </View>
                            <View style={{ width: '100%', padding: 20, borderBottomColor: Colors.lightGray, borderBottomWidth: 1 }}>
                                <Text style={[{ fontSize: 14, color: Colors.black }, stylesGlobal.font]}>{"You have limited access because you have not completed your profile payment"}</Text>
                            </View>
                            <View style={{ padding: 20, alignItems: 'flex-end' }}>
                                <TouchableOpacity style={[stylesGlobal.common_button, stylesGlobal.shadow_style]} onPress={() => {
                                    this.setState({
                                        payment_failed_view: false,
                                        profile_status_view: false
                                    })
                                    this.props.jumpToDashboardTab(true, "susbscription", true);
                                }}>
                                    <Text style={[{ fontSize: 14, color: Colors.white }, stylesGlobal.font]}>{"Complete Payment"}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                        {/* <View style={{ width: this.state.is_portrait ? '100%' : '40%', borderRadius: 10, backgroundColor: Colors.white, alignItems: 'center' }}>
                            <View style={{ width: '100%', aspectRatio: 3.2, marginTop: -10, overflow: 'visible' }}>
                                <TouchableOpacity onPress={() => this.setState({ profile_status_view: false, payment_failed_view: false })}>
                                    <Image style={{ width: '100%', height: '100%' }} source={require('../icons/00-percent.png')} />
                                </TouchableOpacity>
                            </View>
                            <View style={{ width: '100%', alignItems: 'center' }}>
                                <Text style={[{ fontSize: 16, color: Colors.gold }, stylesGlobal.font]}>{this.state.profile_percentage == 100 ? "CONGRATULATIONS!" : "Get 1 Free Gold Coin"}</Text>
                                <Text style={[{ fontSize: 16, color: Colors.black, marginTop: 0 }, stylesGlobal.font]}>{this.state.profile_percentage == 100 ? "You have unlocked 1 Free Coin" : "Finish your profile to unlock!"}</Text>
                            </View>
                            <View style={{ width: this.state.is_portrait ? '40%' : '15%', aspectRatio: 0.8, marginTop: 15 }}>
                                <Image source={require('../icons/TurningCoin.gif')} style={{ width: '100%', height: '100%', resizeMode: 'contain' }} />
                            </View>
                            <Text style={[{ fontSize: 14, color: Colors.gold, marginTop: 15 }, stylesGlobal.font]}>{"Your profile is " + this.state.profile_percentage + "% complete."}</Text>
                            <View style={{ width: '90%', aspectRatio: 4 }}>
                                <Image style={{ width: '100%', height: '100%', resizeMode: 'contain' }} source={this.state.bar_image}></Image>
                            </View>
                            <View style={{ width: '90%', paddingBottom: 20, flexDirection: 'row', justifyContent: 'center' }}>
                                <TouchableOpacity style={[stylesGlobal.common_button, stylesGlobal.shadow_style, { width: '99%', marginLeft: 2 }]}
                                    onPress={() => {
                                        if (this.state.profile_percentage == 100) {
                                            this.setState({ profile_status_view: false })
                                        } else {
                                            this.setState({ profile_status_view: false })
                                            this.props.rootNavigation.navigate('EditProfile', { efreshAction: this.refreshProfileImage() })
                                        }
                                    }}>
                                    <Text style={[{ fontSize: 14, color: Colors.white, textAlign: 'center' }, stylesGlobal.font]}>{"Keep Going!"}</Text>
                                </TouchableOpacity>
                            </View>
                        </View> */}
                    </View>
                </View>
            );
        }
        else if (this.state.profile_percentage < 100 && this.state.profile_status_view) {
            Global.profile_status_view_flag = true;
            return (
                <View style={[{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, zIndex: 200, elevation: 200, alignItems: 'center' }]}>
                    <View style={{ width: '100%', height: '100%', position: 'absolute', backgroundColor: Colors.black, opacity: 0.3 }} />
                    {
                        this.compare() && !this.state.skip_now && this.rednerUpdatePopup()
                    }
                    <View style={{ width: '80%', height: '100%', alignItems: 'center', justifyContent: 'center', paddingHorizontal: this.state.is_portrait ? 10 : 0 }}>
                        <View style={{ width: this.state.is_portrait ? '100%' : '40%', borderRadius: 10, backgroundColor: Colors.white, alignItems: 'center' }}>
                            <View style={{ width: '100%', aspectRatio: 3.2, marginTop: -10, overflow: 'visible' }}>
                                <TouchableOpacity onPress={() => this.setState({ profile_status_view: false })}>
                                    {/* <Image style={{ width: '100%', height: '100%' }} source={require('../icons/00-percent.png')} /> */}
                                </TouchableOpacity>
                            </View>
                            <View style={{ width: '100%', alignItems: 'center' }}>
                                <Text style={[{ fontSize: 16, color: Colors.gold }, stylesGlobal.font]}>{this.state.profile_percentage == 100 ? "CONGRATULATIONS!" : "Get 1 Free Gold Coin"}</Text>
                                <Text style={[{ fontSize: 16, color: Colors.black, marginTop: 0 }, stylesGlobal.font]}>{this.state.profile_percentage == 100 ? "You have unlocked 1 Free Coin" : "Finish your profile to unlock!"}</Text>
                            </View>
                            <View style={{ width: this.state.is_portrait ? '40%' : '15%', aspectRatio: 0.8, marginTop: 15 }}>
                                <Image source={require('../icons/TurningCoin.gif')} style={{ width: '100%', height: '100%', resizeMode: 'contain' }} />
                            </View>
                            <Text style={[{ fontSize: 14, color: Colors.gold, marginTop: 15 }, stylesGlobal.font]}>{"Your profile is " + this.state.profile_percentage + "% complete."}</Text>
                            <View style={{ width: '90%', aspectRatio: 4 }}>
                                <Image style={{ width: '100%', height: '100%', resizeMode: 'contain' }} source={this.state.bar_image}></Image>
                            </View>
                            <View style={{ width: '90%', paddingBottom: 20, flexDirection: 'row', justifyContent: 'center' }}>
                                <TouchableOpacity style={[stylesGlobal.common_button, stylesGlobal.shadow_style, { width: '99%', marginLeft: 2 }]}
                                    onPress={() => {
                                        if (this.state.profile_percentage == 100) {
                                            this.setState({ profile_status_view: false })
                                        } else {
                                            this.setState({ profile_status_view: false })
                                            this.props.rootNavigation.navigate('EditProfile', { efreshAction: this.refreshProfileImage() })
                                        }
                                    }}>
                                    <Text style={[{ fontSize: 14, color: Colors.white, textAlign: 'center' }, stylesGlobal.font]}>{"Keep Going!"}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </View>
            );
        } else if (this.compare() && !this.state.skip_now) {
            console.log(VersionInfo.appVersion, this.state.appstoreVersion);
            return (
                <View style={[{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, zIndex: 200, elevation: 200, alignItems: 'center' }]}>
                    {
                        this.rednerUpdatePopup()
                    }
                </View>
            )
        } else {
            return null;
        }
    }
}


const styles = StyleSheet.create({
    
});

