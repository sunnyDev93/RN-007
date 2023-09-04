import React, { Component } from "react";
import {
    Alert,
    StyleSheet,
    SafeAreaView,
    View,
    TouchableOpacity,
    Image,
    Text,
    Dimensions,
    Linking,
    ScrollView,
    TextInput,
    Platform,
    Modal
} from "react-native";
import { EventRegister } from 'react-native-event-listeners'
import { ImageCompressor } from './ImageCompressorClass'
import { Colors } from "../consts/Colors";
import { Constants } from "../consts/Constants";
import { stylesGlobal, STICKY_HEADER_HEIGHT } from '../consts/StyleSheet'
import Memory from '../core/Memory';
import * as Global from "../consts/Global";
import WebService from "../core/WebService";
import ProgressIndicator from "./ProgressIndicator";
import Moment from "moment/moment";
import moment from 'moment';
import Carousel from 'react-native-snap-carousel';
import AsyncStorage from '@react-native-community/async-storage';
import { extendMoment } from "moment-range";
import ModalDropdown from '../custom_components/react-native-modal-dropdown/ModalDropdown';
// import RNIap, {
//     InAppPurchase,
//     PurchaseError,
//     SubscriptionPurchase,
//     acknowledgePurchaseAndroid,
//     consumePurchaseAndroid,
//     finishTransaction,
//     finishTransactionIOS,
//     purchaseErrorListener,
//     purchaseUpdatedListener,
// } from 'react-native-iap';

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

var TAG = "Subscription";

export default class SavedCards extends React.Component {

    constructor(props) {
        super(props)

        this.state = {
            saved_password: "", // saved password
            userId: "",
            userToken: "",
            userSlug: "",
            userEmail: "",
            userImagePath: "",
            userImageName: "",
            member_plan: "",
            is_verified: "",

            entries: Global.entries,
            selected_entry: Global.entries[0],
            change_profile_type_popup: false,
            change_profile_type_message: "",

            suspend_account_popup: false,
            delete_account_popup: false,

            renew_plan: false,

            subscribedPlan: [],
            allPlans: [],
            currentPlan: null,
            plan_list: [],

            futurePlan: "0",
            futureCount: 0,

            products: null, // in app purchase product
            purchase_processing: false,  // when processing purchase, after purchase or before purchase it's false, during purchase it's true

            inapppurchase_type: "", //upgrade, renew

            current_date: new Date(new Date(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate(), new Date().getUTCHours(), new Date().getUTCMinutes(), new Date().getUTCSeconds())),
            // current date with date type variable

            renew_item: null,
            renew_type: "", // "renew_member_plan", "purchase_member_plan"

            active_plan_item: null, //item when activate now

            inapppurchase_response: null,

            account_password: "", // used for account setting

            is_portrait: true,
            screen_width: Dimensions.get("window").width

        }

    }

    async UNSAFE_componentWillMount() {

        this.getData();
        if (Dimensions.get("window").width < Dimensions.get("window").height) {
            this.setState({
                is_portrait: true,
                screen_width: Dimensions.get("window").width
            })
        } else {
            this.setState({
                is_portrait: false,
                screen_width: Dimensions.get("window").height
            })
        }

        Dimensions.addEventListener("change", () => {
            if (Dimensions.get("window").width < Dimensions.get("window").height) {
                this.setState({
                    is_portrait: true,
                    screen_width: Dimensions.get("window").width
                })
            } else {
                this.setState({
                    is_portrait: false,
                    screen_width: Dimensions.get("window").height
                })
            }
        })

        try {
            const result = await initConnection();
            // await RNIap.flushFailedPurchasesCachedAsPendingAndroid();
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
                    console.log('purchaseUpdatedListener', purchase)
                    const receipt = purchase.transactionReceipt;
                    if (receipt) {
                        try {
                            if (Platform.OS === 'ios') {
                                if (this.state.purchase_processing) {
                                    this.setState({
                                        inapppurchase_response: purchase
                                    })
                                    if (this.state.inapppurchase_type == "upgrade") { // when upgrade membership
                                        this.upgrade_memberplan(receipt);
                                    } else if (this.state.inapppurchase_type == "renew") { // when renew plan
                                        this.renew_plan(this.state.renew_item, this.state.renew_type, receipt);
                                    } else if (this.state.inapppurchase_type == "activate_now") { // when activate now
                                        this.callActivateNowAPICall(this.state.active_plan_item, receipt);
                                    }

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
                })

                purchaseErrorSubscription = purchaseErrorListener((error) => {
                    console.log('purchaseErrorListener', error);
                    this.setState({
                        loading: false,
                        purchase_processing: false
                    });
                    if (error != null && error.code == "E_USER_CANCELLED") {

                    } else {
                        Alert.alert("Your payment did not go through.", "");
                    }
                },
                );
            }
        } catch (err) {
            console.log(err.code, err.message);
        }

        this.listenerProfileChange = EventRegister.addEventListener(Constants.EVENT_UPGRADE_PROFILE, async (data) => {

            if (Platform.OS === 'ios') {
                if (this.state.purchase_processing) {

                    if (this.state.inapppurchase_type == "upgrade") { // when upgrade membership
                        if (data == 'cancel') {
                            this.setState({ loading: false })
                        } else {
                            this.handleReponseUpgradePayment();
                        }

                    } else if (this.state.inapppurchase_type == "renew") { // when renew plan
                        //this.renew_plan(this.state.renew_item, this.state.renew_type, receipt);
                        console.log(TAG, 'Subscription', 'renew');
                    } else if (this.state.inapppurchase_type == "activate_now") { // when activate now
                        //this.callActivateNowAPICall(this.state.active_plan_item, receipt);
                        console.log(TAG, 'Subscription', 'activate_now');
                    }

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
        })
    }

    handleReponseUpgradePayment = () => {
        AsyncStorage.setItem(Constants.KEY_MEMBER_PLAN, String(this.state.upgrade_member_id));
        this.props.setPaymentCheck(false);
        this.getData();
    }

    componentWillUnmount() {
        // console.log("-----------------------------  membership screen unmounted");
        try {
            if (purchaseUpdateSubscription) {
                purchaseUpdateSubscription.remove();
                purchaseUpdateSubscription = null;
            }
            if (purchaseErrorSubscription) {
                purchaseErrorSubscription.remove();
                purchaseErrorSubscription = null;
            }
            if (this.listenerProfileChange) {
                this.listenerProfileChange.remove();
                this.listenerProfileChange = null;
            }
            RNIap.endConnection();
        } catch (error) {
            console.log("membership screen unmount error: ", error)
        }
    }

    getDataAgain = () => {
        this.getData();
    }

    /**
       * get async storage data
       */
    getData = async () => {
        try {
            var saved_password = await AsyncStorage.getItem(Constants.KEY_USER_PASSWORD);
            var userId = await AsyncStorage.getItem(Constants.KEY_USER_ID);
            var userToken = await AsyncStorage.getItem(Constants.KEY_USER_TOKEN);
            var userSlug = await AsyncStorage.getItem(Constants.KEY_USER_SLUG);
            var userEmail = await AsyncStorage.getItem(Constants.KEY_USER_EMAIL);
            var userFirstName = await AsyncStorage.getItem(Constants.KEY_USER_FIRST_NAME);
            var userLastName = await AsyncStorage.getItem(Constants.KEY_USER_LAST_NAME);
            var userImagePath = await AsyncStorage.getItem(Constants.KEY_USER_IMAGE_URL);
            var userImageName = await AsyncStorage.getItem(Constants.KEY_USER_IMAGE_NAME);
            var member_plan = await AsyncStorage.getItem(Constants.KEY_MEMBER_PLAN);
            var is_verified = await AsyncStorage.getItem(Constants.KEY_IS_VERIFIED);
            var auto_renew = await AsyncStorage.getItem(Constants.KEY_AUTO_RENEW);
            if (auto_renew == "1") {
                this.setState({
                    renew_plan: true
                })
            } else {
                this.setState({
                    renew_plan: false
                })
            }
            this.setState({
                saved_password: saved_password,
                userId: userId,
                userToken: userToken,
                userSlug: userSlug,
                userEmail: userEmail,
                userImagePath: userImagePath,
                userImageName: userImageName,
                showModel: false,
                member_plan: member_plan,
                is_verified: is_verified,

                futurePlan: "0",
                futureCount: 0,
                upgrade_status: "",

            }, () => this.getSubscription());
        } catch (error) {
            // Error retrieving data
        }
    };

    getSubscription() {
        try {

            this.setState({
                loading: true
            });

            let uri = Memory().env == "LIVE" ? Global.URL_GET_SUBCRIPTION : Global.URL_GET_SUBCRIPTION_DEV;
            let params = new FormData();
            params.append("token", this.state.userToken);
            params.append("user_id", this.state.userId);
            params.append("format", "json");

            console.log(TAG + " callGetSubscriptionAPI uri " + uri);
            console.log(TAG + " callGetSubscriptionAPI params " + JSON.stringify(params));

            WebService.callServicePost(uri, params, this.handleGetSubscription);
        } catch (error) {
            console.log(TAG + " callGetSubscriptionAPI error " + error);
            this.setState({
                loading: false
            });
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    }

    handleGetSubscription = (response, isError) => {
        // console.log(TAG + " callGetSubscriptionAPI Response " + JSON.stringify(response));
        console.log(TAG + " callGetSubscriptionAPI isError " + isError);

        if (!isError) {
            var result = response;
            if (result != undefined && result != null) {
                if (result.status == "success") {
                    var subscribedPlan = result.data.subscribedPlan;
                    var allPlans = result.data.allPlans;
                    var plan_list = [];
                    var futureCount = 0;
                    if (subscribedPlan != null) {
                        for (i = 0; i < subscribedPlan.length; i++) {
                            if (subscribedPlan[i].status == "2") {
                                futureCount = futureCount + 1;
                            }
                            for (j = 0; j < Global.entries.length; j++) {
                                if (subscribedPlan[i].plan_id == Global.entries[j].type) {
                                    subscribedPlan[i].background = Global.entries[j].background;
                                    subscribedPlan[i].tag = Global.entries[j].tag;
                                    subscribedPlan[i].res_type = "subscribedPlan";
                                    // subscribedPlan[i].description = subscribedPlan[i].description.replace(" ", '').replace("\r", '').replace("\n", '');
                                    break;
                                }
                            }
                            plan_list.push(subscribedPlan[i]);
                        }
                    }
                    var futurePlan = "";
                    if (this.state.member_plan == "1") {
                        futurePlan = "2";
                        this.setState({
                            futurePlan: "2",
                            upgrade_status: "upgrade"
                        })
                    } else if (this.state.member_plan == "2") {
                        futurePlan = "1";
                        this.setState({
                            futurePlan: "1",
                            upgrade_status: "downgrade"
                        })
                    } else if (this.state.member_plan == "7") {
                        futurePlan = "4";
                        this.setState({
                            futurePlan: "4",
                            upgrade_status: "upgrade"
                        })
                    } else if (this.state.member_plan == "4") {
                        futurePlan = "7";
                        this.setState({
                            futurePlan: "7",
                            upgrade_status: "downgrade"
                        })
                    }

                    if (allPlans != null) {
                        for (i = 0; i < allPlans.length; i++) {
                            for (j = 0; j < Global.entries.length; j++) {
                                if (allPlans[i].id == Global.entries[j].type) {
                                    allPlans[i].background = Global.entries[j].background;
                                    allPlans[i].tag = Global.entries[j].tag;
                                    allPlans[i].res_type = "allPlans";
                                    // allPlans[i].description = allPlans[i].description.replace("\r", '').replace("\n", '');
                                    break;
                                }
                            }
                            if (futureCount == 0 && (futurePlan == "1" || futurePlan == "2" || futurePlan == "4" || futurePlan == "7") && allPlans[i].id == futurePlan) {
                                

                                if(this.state.follower_need_upgrade)
                                    {
                                        plan_list.unshift(allPlans[i]);
                                    }else{
                                        plan_list.push(allPlans[i]);
                                    }
                                
                            }
                        }
                    }

                    console.log(TAG , 'plan_list', plan_list);
                    this.setState({
                        subscribedPlan: subscribedPlan,
                        allPlans: allPlans,
                        futureCount: futureCount,
                        plan_list: plan_list
                    })
                    // console.log("===========================", JSON.stringify(plan_list))
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

    set_renew_plan() {

        try {

            this.setState({
                loading: true,
                renew_plan: !this.state.renew_plan
            });

            let uri = Memory().env == "LIVE" ? Global.URL_AUTO_RENEW_PLAN : Global.URL_AUTO_RENEW_PLAN_DEV;
            let params = new FormData();
            params.append("token", this.state.userToken);
            params.append("user_id", this.state.userId);
            params.append("format", "json");
            if (this.state.renew_plan) {
                params.append("auto_renew_status", 0);
            } else {
                params.append("auto_renew_status", 1);
            }

            console.log(TAG + " callRenewPlanAPI uri " + uri);
            console.log(TAG + " callRenewPlanAPI params " + JSON.stringify(params));

            WebService.callServicePost(uri, params, this.handleAutoRenewPlan);
            this.setState({
                renew_plan: !this.state.renew_plan
            });
        } catch (error) {
            console.log(TAG + " callRenewPlanAPI error " + error);
            this.setState({
                loading: false
            });
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    }

    handleAutoRenewPlan = (response, isError) => {
        console.log(TAG + " callRenewPlanAPI Response " + JSON.stringify(response));
        console.log(TAG + " callRenewPlanAPI isError " + isError);

        if (!isError) {
            var result = response;
            if (result != undefined && result != null) {
                if (result.status.toUpperCase() == "success".toUpperCase()) {
                    try {
                        if (this.state.renew_plan) {
                            AsyncStorage.setItem(Constants.KEY_AUTO_RENEW, "1");
                        } else {
                            AsyncStorage.setItem(Constants.KEY_AUTO_RENEW, "0");
                        }
                    } catch (error) {

                    }
                } else {
                    this.setState({
                        renew_plan: !this.state.renew_plan
                    });
                }
            }
        } else {
            this.setState({
                renew_plan: !this.state.renew_plan
            });
            if (response != undefined && response != null && response.length > 0) {
                Alert.alert(response.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }

        this.setState({
            loading: false
        });
    }

    memberchange_confirm(upgrading_plan) {

        if (this.state.upgrade_status == "upgrade") {
            this.setState({
                upgrade_member_id: upgrading_plan.id
            })
            this.setState({
                loading: true,
                inapppurchase_type: "upgrade"
            });

            var upgradeData = {
                params: null,
                userID: this.state.userId,
                userToken: this.state.userToken,
                operation: 'upgrade',
                memberType: upgrading_plan.id,
            }
            if(Platform.OS === "android")
            {
                if (upgrading_plan.id == '2' ||
                    upgrading_plan.id == '5' ||
                    upgrading_plan.id == '4') {
                    ;
                    this.setState({
                        purchase_processing: true
                    }, () => this.props.screenProps.navigate("SignupPaymentScreen", upgradeData))
                } else {
                    this.upgrade_memberplan(null);
                }
            }else{
                if(upgrading_plan.id == "2") { // generous
                    requestSubscription('com.007.007PercentApp.membershipgenerous');
                    this.setState({
                        purchase_processing: true
                    })
                } else if(upgrading_plan.id == "5") { // connector
                    requestSubscription('com.007.007PercentApp.membershipconnector');
                    this.setState({
                        purchase_processing: true
                    })
                } else if(upgrading_plan.id == "4") { // vipfan
                    requestSubscription('com.007.007PercentApp.membershipvipfan');
                    this.setState({
                        purchase_processing: true
                    })
                } else {
                    this.upgrade_memberplan(null);
                }
            }
            
            
        } else {
            this.setState({
                downgrade_member_id: upgrading_plan.id
            })
            Alert.alert(
                Constants.CHANGE_PLAN_ALERT_TITLE,
                Constants.DOWNGRADE_PLAN_ALERT_MESSAGE,
                [
                    { text: 'Cancel', onPress: () => console.log('Ask me later pressed') },
                    { text: 'OK', onPress: () => this.downgrade_memberplan() },
                ],
                { cancelable: false },
            );
        }
    }


    downgrade_memberplan() {
        try {

            this.setState({
                loading: true,
            });

            let uri = Memory().env == "LIVE" ? Global.URL_DOWNGRADE_MEMBERPLAN : Global.URL_DOWNGRADE_MEMBERPLAN_DEV;
            let params = new FormData();
            params.append("token", this.state.userToken);
            params.append("user_id", this.state.userId);
            params.append("format", "json");
            params.append("plan_id", this.state.downgrade_member_id);

            console.log(TAG + " calldowngrade_memberplanAPI uri " + uri);
            console.log(TAG + " calldowngrade_memberplanAPI params " + JSON.stringify(params));

            WebService.callServicePost(uri, params, this.handleDownGradeMemberPlan);
        } catch (error) {
            console.log(TAG + " calldowngrade_memberplanAPI error " + error);
            this.setState({
                loading: false
            });
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    }

    handleDownGradeMemberPlan = (response, isError) => {
        console.log(TAG + " calldowngrade_memberplanAPI Response " + JSON.stringify(response));
        console.log(TAG + " calldowngrade_memberplanAPI isError " + isError);

        if (!isError) {
            var result = response;
            if (result != undefined && result != null) {
                if (result.status.toUpperCase() == "success".toUpperCase()) {
                    AsyncStorage.setItem(Constants.KEY_MEMBER_PLAN, String(this.state.downgrade_member_id));
                    this.getData();
                } else {
                    this.setState({
                        loading: false
                    });
                    Alert.alert(result.msg, "");
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

    upgrade_memberplan = async (purchase_receipt) => {
        try {

            this.setState({
                loading: true,
            });

            //let uri = Memory().env == "LIVE" ? Global.URL_UPGRADE_MEMBERPLAN : Global.URL_UPGRADE_MEMBERPLAN_DEV;// paypal work
            let uri = Memory().env == "LIVE" ? Global.URL_UPGRADE_MEMBERPLAN : Global.URL_UPGRADE_MEMBERPLAN_DEV;
            if(Platform.OS === "android")
                uri = Memory().env == "LIVE" ? Global.URL_UPGRADE_MEMBERPLAN_PAYPAL : Global.URL_UPGRADE_MEMBERPLAN_PAYPAL_DEV;
            // let params = new FormData();
            // params.append("token", this.state.userToken);
            // params.append("user_id", this.state.userId);
            // params.append("format", "json");
            // params.append("plan_id", this.state.upgrade_member_id);
            // params.append("is_success", 1);
            // if (purchase_receipt != null) {
            //     params.append("receipt", purchase_receipt);
            // }

            const data = {
                token: this.state.userToken,
                user_id: this.state.userId,
                format: 'json',
                plan_id: this.state.upgrade_member_id,
                is_success: 1,
            }
            if (purchase_receipt != null) {
                data['receipt'] = purchase_receipt;
            }

            console.log(TAG + " callupgrade_memberplanAPI uri " + uri);
            console.log(TAG + " callupgrade_memberplanAPI params " + JSON.stringify(data));

            WebService.callServicePost(uri, data, this.handleUpGradeMemberPlan);
        } catch (error) {
            console.log(TAG + " callupgrade_memberplanAPI error " + error);
            this.setState({
                loading: false
            });
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    }

    handleUpGradeMemberPlan = async (response, isError) => {
        console.log(TAG + " callupgrade_memberplanAPI Response " + JSON.stringify(response));
        console.log(TAG + " callupgrade_memberplanAPI isError " + isError);

        if (!isError) {
            var result = response;
            if (result != undefined && result != null) {
                if (result.status.toUpperCase() == "success".toUpperCase()) {
                    AsyncStorage.setItem(Constants.KEY_MEMBER_PLAN, String(this.state.upgrade_member_id));
                    if (this.state.inapppurchase_response != null) {
                        const ackResult = await finishTransactionIOS(this.state.inapppurchase_response.transactionId);
                        this.setState({
                            inapppurchase_response: null
                        })
                    }
                    this.props.setPaymentCheck(false);
                    this.getData();
                } else {
                    this.setState({
                        loading: false
                    });
                    Alert.alert(result.msg, "");
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

    purchase_member_plan = async (item, renew_type) => {
        this.setState({
            renew_item: item,
            renew_type: "renew_member_plan",
            inapppurchase_type: "renew",
            loading: true
        })
        if (item.plan_id == "2") { // generous
            requestSubscription('com.007.007PercentApp.membershipgenerous');
            this.setState({
                purchase_processing: true
            })
        } else if (item.plan_id == "5") { // connector
            requestSubscription('com.007.007PercentApp.membershipconnector');
            this.setState({
                purchase_processing: true
            })
        } else if (item.plan_id == "4") { // vipfan
            requestSubscription('com.007.007PercentApp.membershipvipfan');
            this.setState({
                purchase_processing: true
            })
        } else {
            this.renew_plan(item, "renew_member_plan");
        }
    }

    renew_plan = async (item, renew_type, purchase_receipt) => {

        try {

            this.setState({
                loading: true,
            });

            let uri = Memory().env == "LIVE" ? Global.URL_RENEW_PLAN : Global.URL_RENEW_PLAN_DEV;
            let params = new FormData();
            params.append("token", this.state.userToken);
            params.append("user_id", this.state.userId);
            params.append("format", "json");
            if (renew_type == "renew_member_plan") {
                params.append("renew_member_plan", 1);
                params.append("member_plan", item.plan_id);
            } else if (renew_type == "purchase_member_plan") {
                params.append("member_plan", item.id);
            }
            if (purchase_receipt != null) {
                params.append("receipt", purchase_receipt);
            }

            console.log(TAG + " callRenewPlanAPI uri " + uri);
            console.log(TAG + " callRenewPlanAPI params " + JSON.stringify(params));

            WebService.callServicePost(uri, params, this.handleRenewPlan);
        } catch (error) {
            console.log(TAG + " callRenewPlanAPI error " + error);
            this.setState({
                loading: false
            });
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    }

    handleRenewPlan = async (response, isError) => {
        console.log(TAG + " callRenewPlanAPI Response " + JSON.stringify(response));
        console.log(TAG + " callRenewPlanAPI isError " + isError);

        if (!isError) {
            var result = response;
            if (result != undefined && result != null) {
                if (result.status.toUpperCase() == "success".toUpperCase()) {
                    if (this.state.inapppurchase_response != null) {
                        const ackResult = await finishTransactionIOS(this.state.inapppurchase_response.transactionId);
                        this.setState({
                            inapppurchase_response: null
                        })
                    }
                    this.props.setPaymentCheck(false);
                    this.getSubscription();
                } else {
                    this.setState({
                        loading: false
                    });
                    Alert.alert(result.msg, "");
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

    activiate_plan(item) {
        this.setState({
            active_plan_item: item,
            inapppurchase_type: "activate_now",
            loading: true
        })
        if (item.plan_id == "2") { // generous
            requestSubscription('com.007.007PercentApp.membershipgenerous');
            this.setState({
                purchase_processing: true
            })
        } else if (item.plan_id == "5") { // connector
            requestSubscription('com.007.007PercentApp.membershipconnector');
            this.setState({
                purchase_processing: true
            })
        } else if (item.plan_id == "4") { // vipfan
            requestSubscription('com.007.007PercentApp.membershipvipfan');
            this.setState({
                purchase_processing: true
            })
        } else {
            this.callActivateNowAPICall(item, null);
        }
    }

    callActivateNowAPICall(item, purchase_receipt) {
        try {
            this.setState({
                loading: true,
            });

            let uri = Memory().env == "LIVE" ? Global.URL_MEMBER_PLAN_ACTIVE : Global.URL_MEMBER_PLAN_ACTIVE_DEV;
            let params = new FormData();
            params.append("token", this.state.userToken);
            params.append("user_id", this.state.userId);
            params.append("format", "json");
            params.append("future_plan_id", item.plan_id);
            if (purchase_receipt != null) {
                params.append("receipt", purchase_receipt);
            }

            console.log(TAG + " callActivatePlanAPI uri " + uri);
            console.log(TAG + " callActivatePlanAPI params " + JSON.stringify(params));

            WebService.callServicePost(uri, params, this.handleActivatePlan);
        } catch (error) {
            console.log(TAG + " callActivatePlanAPI error " + error);
            this.setState({
                loading: false
            });
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }

    }

    handleActivatePlan = async (response, isError) => {
        console.log(TAG + " callActivatePlanAPI Response " + JSON.stringify(response));
        console.log(TAG + " callActivatePlanAPI isError " + isError);

        if (!isError) {
            var result = response;
            if (result != undefined && result != null) {
                if (result.status.toUpperCase() == "success".toUpperCase()) {
                    if (this.state.inapppurchase_response != null) {
                        const ackResult = await finishTransactionIOS(this.state.inapppurchase_response.transactionId);
                        this.setState({
                            inapppurchase_response: null
                        })
                    }
                    this.setState({
                        loading: false
                    });
                    this.props.setPaymentCheck(false);
                    this.getSubscription();
                } else {
                    Alert.alert(result.msg, "");
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

    getDaysDifference = (startDate_string, endDate_string) => {
        var endDate_date = Moment(endDate_string);
        var startDate_date = this.state.current_date;
        if (startDate_string != "") {
            startDate_date = Moment(startDate_string);
        }
        const moment = extendMoment(Moment);
        const diff_dates = moment.range(startDate_date, endDate_date);

        return diff_dates.diff('days');
    }

    resortplans = () => {
        console.log(TAG, 'revert plans');
        
        this.setState({
            follower_need_upgrade: true
        });
       
    }
    restore_purchase = async () => {
        this.setState({
            loading: true
        });
        try {
            const result = await RNIap.initConnection();
            const purchases = await RNIap.getAvailablePurchases()
            if (purchases && purchases.length > 0) {
                var restore_exist = false
                for (i = 0; j < purchases.length; i++) {
                    if (this.state.member_plan == "2" && purchases[i].productId == "com.007.007PercentApp.membership.generous") {
                        restore_exist = true;
                        break;
                    }
                    if (this.state.member_plan == "5" && purchases[i].productId == "com.007.007PercentApp.membership.connector") {
                        restore_exist = true;
                        break;
                    }
                    if (this.state.member_plan == "4" && purchases[i].productId == "com.007.007PercentApp.membership.vipfan") {
                        restore_exist = true;
                        break;
                    }
                }
                if (restore_exist) {
                    // call membership paid api
                    this.getSubscription();
                    Alert.alert("Your membership payment has been restored.", "");
                } else {
                    Alert.alert("You have no any purchased. Please get a membership plan.", "");
                }
            } else {
                Alert.alert("You have no any purchased. Please get a membership plan.", "");
            }
        } catch (err) {
            console.log("---------------", err)
            Alert.alert("There is an error in restore purchase.", "");
        }
        this.setState({
            loading: false
        });
    }

    requestProfileTypeChange = async () => {
        try {
            this.setState({
                loading: true,
            });

            let uri = Memory().env == "LIVE" ? Global.URL_CHANGE_PROFILE_TYPE : Global.URL_CHANGE_PROFILE_TYPE_DEV;
            let params = new FormData();
            params.append("token", this.state.userToken);
            params.append("user_id", this.state.userId);
            params.append("format", "json");
            params.append("message", this.state.change_profile_type_message);
            params.append("toProfile", this.state.selected_entry.name);

            for (j = 0; j < Global.entries.length; j++) {
                if (this.state.subscribedPlan[0].URL_MEMBER_PLAN_ACTIVE_DEV == Global.entries[j].type) {
                    params.append("fromProfile", Global.entries[j].name);
                }
            }

            console.log(TAG + " callProfileTypeChange uri " + uri);
            console.log(TAG + " callProfileTypeChange params " + JSON.stringify(params));

            WebService.callServicePost(uri, params, this.handleRequestProfileTypeChange);
        } catch (error) {
            console.log(TAG + " callProfileTypeChange error " + error);
            this.setState({
                loading: false
            });
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    }

    handleRequestProfileTypeChange = async (response, isError) => {
        console.log(TAG + " callProfileTypeChange Response " + JSON.stringify(response));
        console.log(TAG + " callProfileTypeChange isError " + isError);
        if (!isError) {
            var result = response;
            if (result != undefined && result != null) {
                if (result.success.toString() == "1") {
                    this.setState({
                        change_profile_type_popup: false,
                        change_profile_type_message: ""
                    })
                    Alert.alert("Your change request has been sent to your Membership manager, who will get back to you soon. Thank you for being a part of The 0.07%.", "");
                } else {
                    Alert.alert("Please try again.", "");
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

    suspendAccount = async () => {
        try {
            this.setState({
                loading: true,
            });

            let uri = Memory().env == "LIVE" ? Global.URL_SUSPEND_ACCOUNT : Global.URL_SUSPEND_ACCOUNT_DEV;
            let params = new FormData();
            params.append("token", this.state.userToken);
            params.append("user_id", this.state.userId);
            params.append("format", "json");

            console.log(TAG + " callSuspendAccountAPI uri " + uri);
            console.log(TAG + " callSuspendAccountAPI params " + JSON.stringify(params));

            WebService.callServicePost(uri, params, this.handleSuspendAccount);
        } catch (error) {
            console.log(TAG + " callSuspendAccountAPI error " + error);
            this.setState({
                loading: false
            });
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    }

    handleSuspendAccount = async (response, isError) => {
        console.log(TAG + " callSuspendAccountAPI Response " + JSON.stringify(response));
        console.log(TAG + " callSuspendAccountAPI isError " + isError);
        if (!isError) {
            var result = response;
            if (result != undefined && result != null) {
                if (result.status.toUpperCase() == "success".toUpperCase()) {
                    try {
                        await AsyncStorage.setItem(Constants.KEY_USER_ID, "");
                        await AsyncStorage.setItem(Constants.KEY_USER_TOKEN, "");

                        this.props.screenProps.navigate("SignInScreen", { isGettingData: false });
                    } catch (error) {
                        console.log(TAG + " logoutUser error " + error);
                    }
                } else {
                    Alert.alert("Please try again.", "");
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

    deleteAccount = async () => {
        if (this.state.account_password != this.state.saved_password) {
            Alert.alert(Constants.ACCOUNT_PASSWORD_NOT_MATCH, "");
            return;
        }
        try {
            this.setState({
                loading: true,
            });

            let uri = Memory().env == "LIVE" ? Global.URL_DELETE_ACCOUNT : Global.URL_DELETE_ACCOUNT_DEV;
            let params = new FormData();
            params.append("token", this.state.userToken);
            params.append("user_id", this.state.userId);
            params.append("format", "json");

            console.log(TAG + " callDeleteAccountAPI uri " + uri);
            console.log(TAG + " callDeleteAccountAPI params " + JSON.stringify(params));

            WebService.callServicePost(uri, params, this.handleDeletedAccount);
        } catch (error) {
            console.log(TAG + " callDeleteAccountAPI error " + error);
            this.setState({
                loading: false
            });
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    }

    handleDeletedAccount = async (response, isError) => {
        console.log(TAG + " callDeleteAccountAPI Response " + JSON.stringify(response));
        console.log(TAG + " callDeleteAccountAPI isError " + isError);
        if (!isError) {
            var result = response;
            if (result != undefined && result != null) {
                if (result.status.toUpperCase() == "success".toUpperCase()) {
                    try {
                        await AsyncStorage.setItem(Constants.KEY_USER_ID, "");
                        await AsyncStorage.setItem(Constants.KEY_USER_TOKEN, "");
                        this.props.screenProps.navigate("SignInScreen", { isGettingData: false });
                    } catch (error) {
                        console.log(TAG + " logoutUser error " + error);
                    }
                } else {
                    Alert.alert("Please try again.", "");
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


    _renderItem = ({ item, index }) => {
        var avatar_url = this.state.userImagePath + Constants.THUMB_FOLDER + this.state.userImageName;
        return (
            <View key={index} style={{ width: '100%', flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <View style={styles.card_view}>
                    <Image style={{ width: this.state.screen_width * 0.4, height: this.state.screen_width * 0.4, position: 'absolute', right: -14, top: -10, zIndex: 10 }} source={{ uri: item.tag }}></Image>
                    <View style={{ width: '100%', height: 30, borderTopLeftRadius: 10, borderTopRightRadius: 10, overflow: 'hidden' }}>
                        <Image style={{ width: '100%', height: '100%' }} source={{ uri: item.background }} />
                    </View>
                    <ScrollView style={{ width: '100%', }} contentContainerStyle={{ flexGrow: 1 }}>
                        <View style={{ width: '100%', alignItems: 'center', height: '100%', }}>
                            {
                                item.res_type == "subscribedPlan" &&
                                <View style={{ width: '100%', height: '100%', alignItems: 'center' }}>
                                    <View style={{ width: '100%', height: '100%', alignItems: "center", }}>
                                        <View style={{ width: '100%', alignItems: "center", }}>
                                            <View style={{ width: this.state.screen_width * 0.3, height: this.state.screen_width * 0.3, marginTop: 30, borderRadius: this.state.screen_width * 0.3, overflow: 'hidden' }}>
                                                <ImageCompressor style={{ width: this.state.screen_width * 0.3, height: this.state.screen_width * 0.3 }} uri={avatar_url} />
                                            </View>
                                            <View style={{ width: '100%', alignItems: 'center', justifyContent: 'space-around', marginTop: 15 }}>
                                                <View style={{ width: '100%', alignItems: 'center', }}>
                                                    <Text style={[{ fontSize: 20, color: Colors.gold, fontWeight: '500' }, stylesGlobal.font]}>{item.membership_plan_name}</Text>
                                                </View>
                                                <View style={{ width: '90%', alignItems: 'center', marginTop: 15 }}>
                                                    <Text style={[styles.content_text, stylesGlobal.font, { fontSize: 16 }]}>{parseFloat(item.price) == 0 ? "Free" : "$" + item.price}</Text>
                                                    <Text style={[styles.content_text, stylesGlobal.font, { fontSize: 16, marginTop: 5, textAlign: 'center' }]}>{item.description}</Text>
                                                </View>
                                            </View>
                                        </View>
                                        <View style={{ width: '100%', height: 1, backgroundColor: "#a27a30", marginVertical: 15 }} />
                                        <View style={{ flexGrow: 1, width: '100%', alignItems: "center", justifyContent: 'space-between', marginBottom: 20 }}>
                                            <View style={{ width: '90%', alignItems: 'center', justifyContent: 'center', marginBottom: 5 }}>
                                                <Text style={[styles.content_text, stylesGlobal.font, { marginBottom: 10 }]}>{parseInt(item.contact_person_per_day) >= 9999 ? "Unlimited" : item.contact_person_per_day} Contacts / Month</Text>
                                                <Text style={[styles.content_text, stylesGlobal.font, { marginBottom: 10 }]}>
                                                    {(this.state.member_plan != '4' && this.state.member_plan != '7' && this.state.member_plan != '8') &&
                                                        "Member since"
                                                    }
                                                    {(this.state.is_verified == '0' || this.state.member_plan == '4' || this.state.member_plan == '7' || this.state.member_plan == '8') &&
                                                        "User since"
                                                    }
                                                    : {item.status == "2" ? "-" : Moment(item.start_date).format("MMM DD, YYYY")}
                                                </Text>
                                                {/* {
                                            this.getDaysDifference("", item.end_date) > 0  && 
                                            <Text style = {[styles.content_text, stylesGlobal.font, {marginBottom: 10}]}>Subscription End: {item.status == "2" ? "-" : Moment(item.end_date).format("MMM DD, YYYY")}</Text>
                                            
                                        } */}

                                                {/* {
                                            item.status == "2" &&
                                            <Text style = {[styles.content_text, stylesGlobal.font, {marginBottom: 15}]}>Remaning: {this.getDaysDifference(item.start_date, item.end_date)} Days</Text>
                                        }
                                        {
                                            item.status != "2" &&
                                            <Text style = {[styles.content_text, stylesGlobal.font, {marginBottom: 15}]}>Remaning: {this.getDaysDifference("", item.end_date) > 0 ? this.getDaysDifference("", item.end_date) : "0"} Days</Text>
                                        }    */}
                                            </View>

                                            <View style={{ width: '100%', alignItems: 'center' }}>
                                                <View style={{ width: '100%', justifyContent: 'center', flexDirection: 'row', marginTop: 15 }}>
                                                    <View style={{ height: 50, top: 10, left: 0 }}>
                                                        {
                                                            // item.status == "1" && 
                                                            <View style={styles.member_status_view}>
                                                                <Text style={[{ fontSize: 15, paddingLeft: 25, paddingRight: 25 }, stylesGlobal.font]}>{"Active"}</Text>
                                                            </View>
                                                        }
                                                        {/* {
                                                        item.status == "2" &&
                                                        <TouchableOpacity style = {styles.member_status_view} onPress = {() => this.activiate_plan(item)}>
                                                            <Text style = {[{fontSize:15}, stylesGlobal.font]}>{"Activate Now"}</Text>
                                                        </TouchableOpacity>
                                                    }
                                                    {
                                                        item.status == "3" &&
                                                        <View style = {styles.member_status_view}>
                                                            <Text style = {[{fontSize:15}, stylesGlobal.font]}>{"Newly Registered"}</Text>
                                                        </View>
                                                    }
                                                    {
                                                        item.status == "0" &&
                                                        // <View style = {styles.member_status_view}>
                                                        //     <Text style = {[styles.member_status_text, stylesGlobal.font]}>{"Expired"}</Text>
                                                        // </View>
                                                        <View style={styles.member_status_view}>
                                                            <Text style={[{fontSize:15}, stylesGlobal.font]}>{"Expired"}</Text>
                                                        </View>
                                                    } */}
                                                    </View>
                                                    {/* {
                                                (item.status == "0" || (Moment(item.end_date) < this.state.current_date)) &&
                                                <TouchableOpacity style = {[{paddingVertical: 10, paddingHorizontal: 20, backgroundColor: Colors.gold, borderRadius: 5}, stylesGlobal.shadow_style]} onPress = {() => this.renew_plan(item, "renew_member_plan")}>
                                                    <Text style = {[styles.button_text, stylesGlobal.font]}>{"Renew"}</Text>
                                                </TouchableOpacity>
                                            }
                                            {
                                                (this.state.member_plan == "2" || this.state.member_plan == "5" || this.state.member_plan == "4") &&
                                                <TouchableOpacity style = {[{paddingVertical: 10, paddingHorizontal: 20, backgroundColor: Colors.gold, borderRadius: 5, marginLeft: 10}, stylesGlobal.shadow_style]} onPress = {() => this.restore_purchase()}>
                                                    <Text style = {[styles.button_text, stylesGlobal.font]}>{"Restore Purchase"}</Text>
                                                </TouchableOpacity>
                                            } */}
                                                </View>
                                            </View>
                                        </View>
                                    </View>
                                </View>
                            }
                            {
                                item.res_type == "allPlans" &&
                                <View style={{ width: '100%', alignItems: 'center' }}>
                                    <View style={{ width: '100%', alignItems: "center", justifyContent: 'center' }}>
                                        <View style={{ width: this.state.screen_width * 0.3, height: this.state.screen_width * 0.3, marginTop: 30, borderRadius: this.state.screen_width * 0.3, overflow: 'hidden' }}>
                                            <ImageCompressor style={{ width: this.state.screen_width * 0.3, height: this.state.screen_width * 0.3 }} uri={avatar_url} />
                                        </View>
                                        <View style={{ width: '100%', alignItems: 'center', justifyContent: 'space-around' }}>
                                            <View style={{ width: '100%', alignItems: 'center', marginTop: 10, marginBottom: 15 }}>
                                                <Text style={[{ fontSize: 20, color: Colors.gold, fontWeight: '500' }, stylesGlobal.font]}>{item.name.toUpperCase() == "Generous".toUpperCase() ? "Gentleman" : item.name}</Text>
                                            </View>
                                            <View style={{ width: '90%', alignItems: 'center' }}>
                                                <Text style={[styles.content_text, stylesGlobal.font, { fontSize: 16 }]}>{item.price == "0.00" ? "Free" : "$" + item.price}</Text>
                                                <Text style={[styles.content_text, stylesGlobal.font, { fontSize: 16, marginTop: 5, textAlign: 'center' }]}>{item.description}</Text>
                                            </View>
                                        </View>
                                    </View>
                                    <View style={{ width: '100%', height: 1, backgroundColor: "#a27a30", marginVertical: 15 }} />
                                    <View style={{ width: '100%', alignItems: "center", justifyContent: 'center' }}>
                                        <View style={{ width: '90%', alignItems: 'center', justifyContent: 'center' }}>
                                            <View style={{ width: '90%', alignItems: 'center', }}>
                                                <Text style={[styles.content_text, stylesGlobal.font, { marginBottom: 15 }]}>{parseInt(item.contact_person_per_day) >= 9999 ? "Unlimited" : item.contact_person_per_day} Contacts / Month</Text>
                                                {
                                                    parseInt(item.add_coin_every_month) > 0 && <Text style={[styles.content_text, stylesGlobal.font, { marginBottom: 15 }]}>{item.add_coin_every_month} Additional Gold Coins Every Month</Text>
                                                }
                                            </View>
                                        </View>
                                        <View style={{ width: '100%', alignItems: 'center', marginVertical: 20 }}>
                                            <TouchableOpacity style={[{ paddingVertical: 10, paddingHorizontal: 30, backgroundColor: Colors.gold, borderRadius: 5, marginTop: 5 }, stylesGlobal.shadow_style]}
                                                onPress={() => this.memberchange_confirm(item)}
                                            >
                                                <Text style={[styles.button_text, stylesGlobal.font]}>{this.state.upgrade_status == "upgrade" ? "Upgrade" : "Downgrade"}</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </View>
                            }
                        </View>
                    </ScrollView>
                </View>
            </View>
        )
    }

    render() {
        return (
            <SafeAreaView style={styles.container}>
                {
                    this.state.loading && <ProgressIndicator />
                }
                {
                    this.state.change_profile_type_popup &&
                    <Modal
                        animationType="fade"
                        transparent={true}
                        // closeOnClick={true}
                        visible={this.state.change_profile_type_popup}
                        onRequestClose={() => this.setState({ change_profile_type_popup: false })}
                        supportedOrientations={['portrait', 'landscape']}
                    >
                        <View style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' }}>
                            <View style={stylesGlobal.popup_bg_blur_view}></View>
                            <View style={stylesGlobal.popup_main_container}>
                                <View style={stylesGlobal.popup_title_view}>
                                    <Text style={[stylesGlobal.popup_title_text, stylesGlobal.font]}>{"Change Membership"}</Text>
                                    <View style={{ flexDirection: 'row' }}>
                                        {
                                            !this.state.is_portrait &&
                                            <TouchableOpacity style={[stylesGlobal.common_button, stylesGlobal.shadow_style]} onPress={() => this.requestProfileTypeChange()}>
                                                <Text style={[styles.button_text, stylesGlobal.font]}>{"Request Change"}</Text>
                                            </TouchableOpacity>
                                        }
                                        <TouchableOpacity style={stylesGlobal.popup_cancel_button} onPress={() => {
                                            this.setState({
                                                change_profile_type_popup: false,
                                                selected_entry: this.state.entries[0],
                                                change_profile_type_message: "",
                                            })
                                        }}>
                                            <Image style={stylesGlobal.cancel_delete_image} source={require("../icons/connection-delete.png")} />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                                {/* <View style = {{width: '100%', paddingHorizontal: 10, paddingVertical: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomColor: Colors.gray, borderBottomWidth: 1}}>
                                <Text style = {[{fontSize: 16, color: Colors.black}, stylesGlobal.font_semibold]}>{"Change Membership"}</Text>
                                <View style = {{flexDirection: 'row', alignItems: 'center'}}>
                                {
                                    !this.state.is_portrait &&
                                    <TouchableOpacity style = {[styles.account_manage_button, stylesGlobal.shadow_style]} onPress = {() => this.requestProfileTypeChange()}>
                                        <Text style = {[styles.button_text, stylesGlobal.font]}>{"Request Change"}</Text>
                                    </TouchableOpacity>
                                }
                                    <TouchableOpacity style = {{padding: 5, marginStart: 10}} onPress = {() => {
                                        this.setState({
                                            change_profile_type_popup: false,
                                            selected_entry: this.state.entries[0],
                                            change_profile_type_message: "",
                                        })
                                    }}>
                                        <Image style = {stylesGlobal.cancel_delete_image} source={require("../icons/connection-delete.png")}/>
                                    </TouchableOpacity>
                                </View>
                                
                            </View> */}
                                <View style={[stylesGlobal.popup_desc_container, { flexDirection: this.state.is_portrait ? 'column' : 'row' }]}>
                                    <View style={{ width: this.state.is_portrait ? '100%' : '50%', paddingEnd: this.state.is_portrait ? 0 : 5 }}>
                                        <Text style={[stylesGlobal.popup_desc_text, stylesGlobal.font]}>{"Select your new desired Profile Type:"}</Text>
                                        <ModalDropdown
                                            style={{ width: '100%', height: 30, marginTop: 10 }}
                                            dropdownStyle={{ width: Dimensions.get('screen').width * 0.9 - 20, height: 30 * this.state.entries.length }}
                                            defaultIndex={0}
                                            options={this.state.entries}
                                            onSelect={(index) => {
                                                this.setState({
                                                    selected_entry: this.state.entries[index]
                                                })
                                            }}
                                            renderButton={() => {
                                                return (
                                                    <View style={{ width: '100%', height: 30, alignItems: 'center', flexDirection: 'row', borderColor: Colors.gray, borderWidth: 0.5, borderRadius: 5 }}>
                                                        <View style={{ height: '100%', aspectRatio: 1, marginLeft: 10, marginRight: 10 }}>
                                                            <Image style={{ width: '100%', height: '100%' }} source={{ uri: this.state.selected_entry.badge }}></Image>
                                                        </View>
                                                        <Text style={[styles.content_text, { color: Colors.black }, stylesGlobal.font]}>{this.state.selected_entry.name}</Text>
                                                    </View>
                                                )
                                            }}
                                            renderRow={(item, member_type_index, highlighted) => {
                                                return (
                                                    <View style={{ width: '100%', height: 30, flexDirection: 'row', alignItems: 'center', backgroundColor: this.state.selected_entry.type == item.type ? Colors.gold : Colors.black }}>
                                                        <View style={{ height: '100%', aspectRatio: 1, marginLeft: 10, marginRight: 10 }}>
                                                            <Image style={{ width: '100%', height: '100%' }} source={{ uri: item.badge }}></Image>
                                                        </View>
                                                        <Text style={[styles.LabelTextStyle, { fontSize: 15, color: Colors.white }, stylesGlobal.font]}>{item.name}</Text>
                                                    </View>
                                                )
                                            }}
                                        />
                                    </View>
                                    <View style={{ width: this.state.is_portrait ? '100%' : '50%', marginTop: this.state.is_portrait ? 10 : 0, paddingStart: this.state.is_portrait ? 0 : 5 }}>
                                        <Text style={[{ fontSize: 14, color: Colors.black, marginBottom: 10 }, stylesGlobal.font]}>{Constants.CHANGE_ACCOUNT_EXPLAIN}</Text>
                                        <TextInput style={[stylesGlobal.popup_textinput, { marginTop: 0 }, stylesGlobal.font]}
                                            multiline={true}
                                            textAlignVertical={'top'}
                                            autoCapitalize='sentences'
                                            // autoCorrect = {true} 
                                            underlineColorAndroid="transparent"
                                            returnKeyType='default'
                                            blurOnSubmit={false}
                                            autoFocus={false}
                                            defaultValue=""
                                            keyboardType={Platform.OS === 'ios' ? 'ascii-capable' : 'visible-password'}
                                            placeholder={"Description"}
                                            onChangeText={(text) => this.setState({ change_profile_type_message: text })}
                                        >
                                            {this.state.change_profile_type_message}
                                        </TextInput>
                                    </View>
                                </View>
                                {
                                    this.state.is_portrait &&
                                    <View style={stylesGlobal.popup_button_container}>
                                        <TouchableOpacity style={[stylesGlobal.common_button, stylesGlobal.shadow_style]} onPress={() => this.requestProfileTypeChange()}>
                                            <Text style={[stylesGlobal.popup_button_text, stylesGlobal.font]}>{"Request Change"}</Text>
                                        </TouchableOpacity>
                                    </View>
                                }
                            </View>
                        </View>
                    </Modal>
                }
                {
                    this.state.suspend_account_popup &&
                    <Modal
                        animationType="fade"
                        transparent={true}
                        // closeOnClick={true}
                        visible={this.state.suspend_account_popup}
                        onRequestClose={() => this.setState({ suspend_account_popup: false })}
                        supportedOrientations={['portrait', 'landscape']}
                    >
                        <View style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' }}>
                            <View style={stylesGlobal.popup_bg_blur_view}></View>
                            <View style={[stylesGlobal.popup_main_container, { paddingBottom: this.state.is_portrait ? 0 : 20 }]}>
                                <View style={stylesGlobal.popup_title_view}>
                                    <Text style={[stylesGlobal.popup_title_text, stylesGlobal.font]}>{Constants.SUSPEND_ACCOUNT_TITLE}</Text>
                                    <View style={{ flexDirection: 'row' }}>
                                        {
                                            !this.state.is_portrait &&
                                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                <TouchableOpacity style={[stylesGlobal.common_button, { marginEnd: 10 }, stylesGlobal.shadow_style]} onPress={() => this.suspendAccount()}>
                                                    <Text style={[stylesGlobal.popup_button_text, stylesGlobal.font]}>{"Suspend"}</Text>
                                                </TouchableOpacity>
                                                <TouchableOpacity style={[stylesGlobal.common_button, stylesGlobal.shadow_style]} onPress={() => this.setState({ suspend_account_popup: false })}>
                                                    <Text style={[stylesGlobal.popup_button_text, stylesGlobal.font]}>{"Cancel"}</Text>
                                                </TouchableOpacity>
                                            </View>
                                        }
                                        <TouchableOpacity style={stylesGlobal.popup_cancel_button} onPress={() => this.setState({ suspend_account_popup: false })}>
                                            <Image style={stylesGlobal.cancel_delete_image} source={require("../icons/connection-delete.png")} />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                                <View style={[stylesGlobal.popup_desc_container, { flexDirection: this.state.is_portrait ? 'column' : 'row' }]}>
                                    <Text style={[{ fontSize: 14, color: Colors.black, }, stylesGlobal.font]}>{Constants.SUSPEND_ACCOUNT_MESSAGE}</Text>
                                </View>
                                {
                                    this.state.is_portrait &&
                                    <View style={stylesGlobal.popup_button_container}>
                                        <TouchableOpacity style={[stylesGlobal.common_button, { marginEnd: 10 }, stylesGlobal.shadow_style]} onPress={() => this.suspendAccount()}>
                                            <Text style={[stylesGlobal.popup_button_text, stylesGlobal.font]}>{"Suspend"}</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={[stylesGlobal.common_button, stylesGlobal.shadow_style]} onPress={() => this.setState({ suspend_account_popup: false })}>
                                            <Text style={[stylesGlobal.popup_button_text, stylesGlobal.font]}>{"Cancel"}</Text>
                                        </TouchableOpacity>
                                    </View>
                                }
                            </View>
                        </View>
                    </Modal>
                }
                {
                    this.state.delete_account_popup &&
                    <Modal
                        animationType="fade"
                        transparent={true}
                        // closeOnClick={true}
                        visible={this.state.delete_account_popup}
                        onRequestClose={() => this.setState({ delete_account_popup: false })}
                        supportedOrientations={['portrait', 'landscape']}
                    >
                        <View style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' }}>
                            <View style={stylesGlobal.popup_bg_blur_view}></View>
                            <View style={[stylesGlobal.popup_main_container, { paddingBottom: this.state.is_portrait ? 0 : 20 }]}>
                                <View style={stylesGlobal.popup_title_view}>
                                    <Text style={[stylesGlobal.popup_title_text, stylesGlobal.font]}>{Constants.DELETE_ACCOUNT_TITLE}</Text>
                                    {/* <Text style = {[{fontSize: 16, color: Colors.black}, stylesGlobal.font_semibold]}>{Constants.DELETE_ACCOUNT_TITLE}</Text> */}
                                    <View style={{ flexDirection: 'row' }}>
                                        {
                                            !this.state.is_portrait &&
                                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                <TouchableOpacity style={[stylesGlobal.common_button, { marginEnd: 10 }, stylesGlobal.shadow_style]} onPress={() => this.deleteAccount()}>
                                                    <Text style={[stylesGlobal.popup_button_text, stylesGlobal.font]}>{"Delete Account"}</Text>
                                                </TouchableOpacity>
                                                <TouchableOpacity style={[stylesGlobal.common_button, stylesGlobal.shadow_style]} onPress={() => this.setState({ delete_account_popup: false, account_password: "" })}>
                                                    <Text style={[stylesGlobal.popup_button_text, stylesGlobal.font]}>{"Cancel"}</Text>
                                                </TouchableOpacity>
                                            </View>
                                        }
                                        <TouchableOpacity style={stylesGlobal.popup_cancel_button} onPress={() => this.setState({ delete_account_popup: false, account_password: "" })}>
                                            <Image style={stylesGlobal.cancel_delete_image} source={require("../icons/connection-delete.png")} />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                                <View style={[stylesGlobal.popup_desc_container]}>
                                    <Text style={[{ fontSize: 14, color: Colors.black }, stylesGlobal.font]}>{Constants.DELETE_ACCOUNT_MESSAGE}</Text>
                                    <Text style={[{ fontSize: 14, color: Colors.black, marginTop: 10 }, stylesGlobal.font]}>{Constants.DELETE_ACCOUNT_PASSWORD}</Text>
                                    <TextInput style={[stylesGlobal.popup_textinput, { marginTop: 5, height: 35 }, stylesGlobal.font]} secureTextEntry={true} onChangeText={(text) => this.setState({ account_password: text })}>{this.state.account_password}</TextInput>
                                </View>
                                {/* <View style = {{width: '100%', paddingHorizontal: 10, paddingVertical: 10, borderBottomColor: Colors.gray, borderBottomWidth: 1, marginBottom: 15}}>
                                <Text style = {[{fontSize: 14, color: Colors.black}, stylesGlobal.font]}>{Constants.DELETE_ACCOUNT_MESSAGE}</Text>
                                <Text style = {[{fontSize: 14, color: Colors.black, marginTop: 10}, stylesGlobal.font]}>{Constants.DELETE_ACCOUNT_PASSWORD}</Text>
                                <TextInput style = {[{width: '100%', height: 35, fontSize: 14, color: Colors.black, borderWidth: 1, borderColor: Colors.gray, borderRadius: 5, padding: 5, marginTop: 5}, stylesGlobal.font]} secureTextEntry = {true} onChangeText = {(text) => this.setState({account_password: text})}>{this.state.account_password}</TextInput>
                            </View> */}
                                {
                                    this.state.is_portrait &&
                                    <View style={stylesGlobal.popup_button_container}>
                                        <TouchableOpacity style={[stylesGlobal.common_button, { marginEnd: 10 }, stylesGlobal.shadow_style]} onPress={() => this.deleteAccount()}>
                                            <Text style={[stylesGlobal.popup_button_text, stylesGlobal.font]}>{"Delete Account"}</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={[stylesGlobal.common_button, stylesGlobal.shadow_style]} onPress={() => this.setState({ delete_account_popup: false, account_password: "" })}>
                                            <Text style={[stylesGlobal.popup_button_text, stylesGlobal.font]}>{"Cancel"}</Text>
                                        </TouchableOpacity>
                                    </View>
                                }
                            </View>
                        </View>
                    </Modal>
                }
                <View style={[stylesGlobal.title_header, { justifyContent: 'space-between', flexDirection: 'row', marginTop: 5, borderTopLeftRadius: 0, borderTopRightRadius: 0 }]}>
                    <TouchableOpacity onPress={() => this.refs._carousal.snapToPrev(animated = true, fireCallback = null)}>
                        <Image style={{ height: '60%', width: 50, tintColor: Colors.gold, resizeMode: 'contain' }} source={require('../icons/signup_left.png')} />
                    </TouchableOpacity>
                    <Text style={[stylesGlobal.headText, stylesGlobal.font]}>{"SELECT PROFILE"}</Text>
                    <TouchableOpacity onPress={() => this.refs._carousal.snapToNext(animated = true, fireCallback = null)}>
                        <Image style={{ height: '60%', width: 50, tintColor: Colors.gold, resizeMode: 'contain' }} source={require('../icons/signup_right.png')} />
                    </TouchableOpacity>
                </View>
                <View style={{ width: '100%', marginVertical: 5, justifyContent: 'flex-end', flexDirection: 'row' }}>
                    <TouchableOpacity style={[styles.account_manage_button, stylesGlobal.shadow_style]} onPress={() =>
                        this.setState({ change_profile_type_popup: true })
                    }>
                        <Text style={[styles.button_text, stylesGlobal.font]}>{"Change Profile Type"}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.account_manage_button, stylesGlobal.shadow_style]} onPress={() => this.setState({ suspend_account_popup: true })}>
                        <Text style={[styles.button_text, stylesGlobal.font]}>{"Suspend"}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.account_manage_button, stylesGlobal.shadow_style]} onPress={() => this.setState({ delete_account_popup: true })}>
                        <Text style={[styles.button_text, stylesGlobal.font]}>{"Delete"}</Text>
                    </TouchableOpacity>
                </View>
                {
                    this.state.plan_list.length > 0 &&
                    <Carousel
                        ref={'_carousal'}
                        data={this.state.plan_list}
                        renderItem={this._renderItem}
                        sliderWidth={Dimensions.get('screen').width}
                        itemWidth={this.state.screen_width * .85}
                        inactiveSlideScale={0.9}
                        inactiveSlideOpacity={0.6}
                        contentContainerStyle={{ justifyContent: 'center', alignItems: 'center', }}
                    />
                }
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

    },
    card_view: {
        width: '100%',
        height: '95%',
        // marginTop: 20,
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
    checkbox_view: {
        width: 25,
        height: 25,
        marginLeft: 20
    },
    content_text: {
        fontSize: 14,
        color: "#a27a30"
    },
    button_text: {
        fontSize: 14,
        color: Colors.white,
    },
    member_status_view: {
        paddingVertical: 5,
        paddingHorizontal: 10,
        marginLeft: 10,
        marginTop: 5,
        backgroundColor: Colors.gold,
        borderRadius: 5,
        alignItems: 'center',
        justifyContent: 'center'
    },
    member_status_text: {
        fontSize: 14,
        color: Colors.black
    },
    account_manage_button: {
        paddingVertical: 10,
        paddingHorizontal: 15,
        backgroundColor: Colors.gold,
        marginEnd: 10,
        borderRadius: 5
    }
});
