import React, { Component } from "react";
import {
    Alert,
    StyleSheet,
    SafeAreaView,
    View,
    TouchableOpacity,
    Image,
    Text,
    ScrollView
} from "react-native";

import { Colors } from "../consts/Colors";
import { Constants } from "../consts/Constants";
import { stylesGlobal, STICKY_HEADER_HEIGHT } from '../consts/StyleSheet';
import Memory from '../core/Memory';
import * as Global from "../consts/Global";
import WebService from "../core/WebService";
import ProgressIndicator from "./ProgressIndicator";
import Moment from "moment/moment";
import AsyncStorage from '@react-native-community/async-storage';


var TAG = "TransactionHistory";

export default class TransactionHistory extends React.Component {

    constructor(props) {
        super(props)

        this.state = {
            rose_data: {},
            trans_history_array: [],
            history_page: 0,
            more_load: true, // if there is history row then true else false
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

            }, () => this.getTransactionHistory());
            
        } catch (error) {
            // Error retrieving data
            return;
        }
    };

    isCloseToBottom = ({layoutMeasurement, contentOffset, contentSize}) => {
        const paddingToBottom = 10;
        return layoutMeasurement.height + contentOffset.y >=
          contentSize.height - paddingToBottom;
    };

    isCloseToTop = ({layoutMeasurement, contentOffset, contentSize}) => {
        const paddingToBottom = 10;
        console.log(contentOffset.y)
        return contentOffset.y <= -10
    };

    getTransactionHistory() {
        
        try {

            this.setState({
                loading: true
            });

            let uri = Memory().env == "LIVE" ? Global.URL_GET_TRANSACTION_HISTORY + this.state.history_page : Global.URL_GET_TRANSACTION_HISTORY_DEV + this.state.history_page;
            let params = new FormData();
            params.append("token", this.state.userToken);
            params.append("user_id", this.state.userId);
            params.append("format", "json");
            
            console.log(TAG + " callgetTransactionHistoryAPI uri " + uri);
            console.log(TAG + " callgetTransactionHistoryAPI params " + JSON.stringify(params));

            WebService.callServicePost(uri, params, this.handleGetTransactionHistory);
        } catch (error) {
            console.log(TAG + " callgetTransactionHistoryAPI error " + error);
            this.setState({
                loading: false
            });
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }

        
    }

    handleGetTransactionHistory = (response, isError) => {
        console.log(TAG + " callgetTransactionHistoryAPI Response " + JSON.stringify(response));
        console.log(TAG + " callgetTransactionHistoryAPI isError " + isError);

        if (!isError) {
            var result = response;
            if (result != undefined && result != null) {
                if(result.status == "success") {
                    var trans_array = result.data.transactions;
                    for(i = 0; i < trans_array.length; i ++) {
                        trans_array[i].data = JSON.parse(trans_array[i].data);
                    }
                    this.setState({
                        trans_history_array: [...this.state.trans_history_array, ...trans_array],
                        history_page: this.state.history_page + 1,
                        rose_data: result.data.rose_data
                    });
                    if(trans_array.length < 20) {
                        this.setState({
                            more_load: false
                        })
                    }
                }
            }
            this.setState({
                loading: false
            });
        } else {
            this.setState({
                loading: false
            });
            if (response != undefined && response != null && response.length > 0) {
                Alert.alert(response.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    }

    refreshProfileImage() {

    }

    go_opponent_profile(item) {
        if(item.data.gold_coin_sent_id == this.state.userId) {
            this.props.screenProps.navigate("MyProfile", {
                refreshProfileImage: this.refreshProfileImage
            });
        } else {
            this.props.screenProps.navigate("ProfileDetail", {
                slug: item.data.slug
            })
        }
    }

    scrollToTop() {
        if(this._scrollView) {
            this._scrollView.scrollTo({x: 0, y: 0, animated: true})
        }
    }

    render() {
        return (
            <SafeAreaView style={styles.container}>
            {
                this.state.loading && <ProgressIndicator/>
            }
                <View style = {[stylesGlobal.cardView, {width: '90%', height: '90%', padding: 0, margin: 0}]}>
                    <View style = {{width: '100%', height: '100%', alignItems: 'center'}}>
                        <View style={stylesGlobal.title_header}>
                            <Text style={[stylesGlobal.headText, stylesGlobal.font]}>TRANSACTION HISTORY</Text>
                        </View>
                    {
                        !this.state.loading && this.state.trans_history_array.length == 0 &&
                        <View style = {{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
                            <Text style = {[stylesGlobal.empty_cardView_text, stylesGlobal.font]}>No Transaction History yet.</Text>
                        </View>
                    }
                    {
                        this.state.trans_history_array.length > 0 &&
                        <ScrollView 
                            ref={(c) => { this._scrollView = c; }}
                            style = {{flex: 1, width: '95%'}}
                            scrollEventThrottle={0}
                            onScroll={({nativeEvent}) => {
                                if(this.isCloseToBottom(nativeEvent)) {
                                    if(this.state.more_load && this.state.loading != true) {
                                        this.setState({
                                            loading: true
                                        }, () => this.getTransactionHistory())
                                    }
                                }
                                if(this.isCloseToTop(nativeEvent)) {
                                    this.setState({
                                        rose_data: {},
                                        trans_history_array: [],
                                        history_page: 0,
                                        more_load: true,
                                        loading: true
                                    }, () => this.getTransactionHistory())
                                }
                            }}
                        >
                        {
                            this.state.trans_history_array.map((item, index) => 
                            <View key = {index} style = {{flex: 1}}>
                            {
                                item.trans_type == "goldcoins_plan" &&
                                <View key = {index} style = {styles.component_view}>
                                    <Image style = {{width: 25, height: 25,}} resizeMode = {'contain'} source={require("../icons/TurningCoin.gif")}></Image>
                                    <View style = {{flex: 1, height: '100%', flexDirection: 'row', justifyContent: 'space-around', marginLeft: 5}}>
                                        <View style = {{flex: 1, height: '100%'}}>
                                            <View style = {{flex: 1, flexDirection: 'row', flexWrap: 'wrap'}}>
                                                <Text style = {[{fontSize: 14, color: Colors.black}, stylesGlobal.font]}>Purchased gold coins </Text>
                                            </View>
                                            <Text style = {[{fontSize: 10, color: Colors.black, marginTop: 5}, stylesGlobal.font]}>{Moment(new Date(parseInt(item.trans_timestamp.toString(), 10) * 1000)).format("DD MMM YYYY (ddd) hh:mm a")}</Text>
                                        </View>
                                        <View style = {{flexDirection: 'row', height: '100%', marginLeft: 5, alignItems: 'center'}}>
                                            <Text style = {[{fontSize: 24, color: Colors.black}, stylesGlobal.font]}>-</Text>
                                            <Image style = {{width: 25, height: 25,}} resizeMode = {'contain'} source={require("../icons/transaction_dollar.png")}></Image>
                                            <Text style = {[{fontSize: 14, color: Colors.black}, stylesGlobal.font]}>{Number(item.trans_amount)}</Text>
                                        </View>
                                    </View>
                                </View>
                            }
                            {
                                item.trans_type == "membership_plan" &&
                                <View key = {index} style = {styles.component_view}>
                                    <Image style = {{width: 25, height: 25,}} resizeMode = {'contain'} source={require("../icons/TurningCoin.gif")}></Image>
                                    <View style = {{flex: 1, height: '100%', flexDirection: 'row', justifyContent: 'space-around', marginLeft: 5}}>
                                        <View style = {{flex: 1, height: '100%'}}>
                                            <View style = {{flex: 1, flexDirection: 'row', flexWrap: 'wrap'}}>
                                                <Text style = {[{fontSize: 14, color: Colors.black}, stylesGlobal.font]}>Purchased membership plan </Text>
                                            </View>
                                            <Text style = {[{fontSize: 10, color: Colors.black, marginTop: 5}, stylesGlobal.font]}>{Moment(new Date(parseInt(item.trans_timestamp.toString(), 10) * 1000)).format("DD MMM YYYY (ddd) hh:mm a")}</Text>
                                            {/* <Text style = {[{fontSize: 10, color: Colors.black, marginTop: 5}, stylesGlobal.font]}>{Moment(new Date(parseInt(item.trans_timestamp.toString(), 10))).format("DD MMM YYYY hh:mm:ss")}</Text> */}
                                        </View>
                                        <View style = {{flexDirection: 'row', height: '100%', marginLeft: 5, alignItems: 'center'}}>
                                            <Text style = {[{fontSize: 24, color: Colors.black}, stylesGlobal.font]}>-</Text>
                                            <Image style = {{width: 25, height: 25,}} resizeMode = {'contain'} source={require("../icons/transaction_dollar.png")}></Image>
                                            <Text style = {[{fontSize: 14, color: Colors.black}, stylesGlobal.font]}>{Number(item.trans_amount)}</Text>
                                        </View>
                                    </View>
                                </View>
                            }
                            {
                                item.trans_type == "referal" &&
                                <View key = {index} style = {styles.component_view}>
                                    <Image style = {{width: 25, height: 25,}} resizeMode = {'contain'} source={require("../icons/TurningCoin.gif")}></Image>
                                    <View style = {{flex: 1, height: '100%', flexDirection: 'row', justifyContent: 'space-around', marginLeft: 5}}>
                                        <View style = {{flex: 1, height: '100%'}}>
                                            <View style = {{flex: 1, flexDirection: 'row', flexWrap: 'wrap'}}>
                                                <Text style = {[{fontSize: 14, color: Colors.black}, stylesGlobal.font]}>Referred </Text>
                                                <TouchableOpacity onPress = {() => this.go_opponent_profile(item)}>
                                                    <Text style = {[{fontSize: 14, color: Colors.gold}, stylesGlobal.font]}>{item.data.full_name}</Text>
                                                </TouchableOpacity>
                                            </View>
                                            <Text style = {[{fontSize: 10, color: Colors.black, marginTop: 5}, stylesGlobal.font]}>{Moment(new Date(parseInt(item.trans_timestamp.toString(), 10) * 1000)).format("DD MMM YYYY (ddd) hh:mm a")}</Text>
                                        </View>
                                        <View style = {{flexDirection: 'row', height: '100%', marginLeft: 5, alignItems: 'center'}}>
                                            <Text style = {[{fontSize: 24, color: Colors.black}, stylesGlobal.font]}>+</Text>
                                            <Image style = {{width: 25, height: 25,}} resizeMode = {'contain'} source={require("../icons/TurningCoin.gif")}></Image>
                                            <Text style = {[{fontSize: 14, color: Colors.black}, stylesGlobal.font]}>{Number(item.trans_amount)}</Text>
                                        </View>
                                    </View>
                                </View>
                            }
                            {
                                item.trans_type == "send_rose" &&
                                <View key = {index} style = {styles.component_view}>
                                    <Image style = {{width: 25, height: 25,}} resizeMode = {'contain'} source={require("../icons/TurningCoin.gif")}></Image>
                                    <View style = {{flex: 1, height: '100%', flexDirection: 'row', justifyContent: 'space-around', marginLeft: 5}}>
                                        <View style = {{flex: 1, height: '100%'}}>
                                            <View style = {{flex: 1, flexDirection: 'row', flexWrap: 'wrap'}}>
                                                <Text style = {[{fontSize: 14, color: Colors.black}, stylesGlobal.font]}>Sent {Number(item.trans_amount)} {this.state.rose_data.title}{Number(item.trans_amount)>1 && "s"} to </Text>
                                                <TouchableOpacity onPress = {() => this.go_opponent_profile(item)}>
                                                    <Text style = {[{fontSize: 14, color: Colors.gold}, stylesGlobal.font]}>{item.data.full_name}</Text>
                                                </TouchableOpacity>
                                            </View>
                                            <Text style = {[{fontSize: 10, color: Colors.black, marginTop: 5}, stylesGlobal.font]}>{Moment(new Date(parseInt(item.trans_timestamp.toString(), 10) * 1000)).format("DD MMM YYYY (ddd) hh:mm a")}</Text>
                                        </View>
                                        <View style = {{flexDirection: 'row', height: '100%', marginLeft: 5, alignItems: 'center'}}>
                                            <Text style = {[{fontSize: 24, color: Colors.black}, stylesGlobal.font]}>-</Text>
                                            <Image style = {{width: 25, height: 25,}} resizeMode = {'contain'} source={require("../icons/TurningCoin.gif")}></Image>
                                            <Text style = {[{fontSize: 14, color: Colors.black}, stylesGlobal.font]}>{Number(item.trans_amount)}</Text>
                                        </View>
                                    </View>
                                </View>
                            }
                            {
                                item.trans_type == "admin-add-coins" &&
                                <View key = {index} style = {styles.component_view}>
                                    <Image style = {{width: 25, height: 25,}} resizeMode = {'contain'} source={require("../icons/TurningCoin.gif")}></Image>
                                    <View style = {{flex: 1, height: '100%', flexDirection: 'row', justifyContent: 'space-around', marginLeft: 5}}>
                                        <View style = {{flex: 1, height: '100%'}}>
                                            <View style = {{flex: 1, flexDirection: 'row', flexWrap: 'wrap'}}>
                                                <Text style = {[{fontSize: 14, color: Colors.black}, stylesGlobal.font]}>Add gold coins from admin</Text>
                                            </View>
                                            <Text style = {[{fontSize: 10, color: Colors.black, marginTop: 5}, stylesGlobal.font]}>{Moment(new Date(parseInt(item.trans_timestamp.toString(), 10) * 1000)).format("DD MMM YYYY (ddd) hh:mm a")}</Text>
                                        </View>
                                        <View style = {{flexDirection: 'row', height: '100%', marginLeft: 5, alignItems: 'center'}}>
                                            <Text style = {[{fontSize: 24, color: Colors.black}, stylesGlobal.font]}>+</Text>
                                            <Image style = {{width: 25, height: 25,}} resizeMode = {'contain'} source={require("../icons/transaction_dollar.png")}></Image>
                                            <Text style = {[{fontSize: 14, color: Colors.black}, stylesGlobal.font]}>{Number(item.trans_amount)}</Text>
                                        </View>
                                    </View>
                                </View>
                            }
                            {
                                item.trans_type == "gold-coin-sent" &&
                                <View key = {index} style = {styles.component_view}>
                                    <Image style = {{width: 25, height: 25,}} resizeMode = {'contain'} source={require("../icons/TurningCoin.gif")}></Image>
                                    <View style = {{flex: 1, height: '100%', flexDirection: 'row', justifyContent: 'space-around', marginLeft: 5}}>
                                        <View style = {{flex: 1, height: '100%'}}>
                                            <View style = {{flex: 1, flexDirection: 'row', flexWrap: 'wrap'}}>
                                                <Text style = {[{fontSize: 14, color: Colors.black}, stylesGlobal.font]}>You have sent gold coin to </Text>
                                                <TouchableOpacity onPress = {() => this.go_opponent_profile(item)}>
                                                    <Text style = {[{fontSize: 14, color: Colors.gold}, stylesGlobal.font]}>{item.data.full_name}</Text>
                                                </TouchableOpacity>
                                            </View>
                                            <Text style = {[{fontSize: 10, color: Colors.black, marginTop: 5}, stylesGlobal.font]}>{Moment(new Date(parseInt(item.trans_timestamp.toString(), 10) * 1000)).format("DD MMM YYYY (ddd) hh:mm a")}</Text>
                                        </View>
                                        <View style = {{flexDirection: 'row', height: '100%', marginLeft: 5, alignItems: 'center'}}>
                                            <Text style = {[{fontSize: 24, color: Colors.black}, stylesGlobal.font]}>-</Text>
                                            <Image style = {{width: 25, height: 25,}} resizeMode = {'contain'} source={require("../icons/TurningCoin.gif")}></Image>
                                            <Text style = {[{fontSize: 14, color: Colors.black}, stylesGlobal.font]}>{Number(item.trans_amount)}</Text>
                                        </View>
                                    </View>
                                </View>
                            }
                            {
                                item.trans_type == "gold-coin-receive" &&
                                <View key = {index} style = {styles.component_view}>
                                    <Image style = {{width: 25, height: 25,}} resizeMode = {'contain'} source={require("../icons/TurningCoin.gif")}></Image>
                                    <View style = {{flex: 1, height: '100%', flexDirection: 'row', justifyContent: 'space-around', marginLeft: 5}}>
                                        <View style = {{flex: 1, height: '100%'}}>
                                            <View style = {{flex: 1, flexDirection: 'row', flexWrap: 'wrap'}}>
                                                <Text style = {[{fontSize: 14, color: Colors.black}, stylesGlobal.font]}>You received gold coin from </Text>
                                                <TouchableOpacity onPress = {() => this.go_opponent_profile(item)}>
                                                    <Text style = {[{fontSize: 14, color: Colors.gold}, stylesGlobal.font]}>{item.data.full_name}</Text>
                                                </TouchableOpacity>
                                            </View>
                                            <Text style = {[{fontSize: 10, color: Colors.black, marginTop: 5}, stylesGlobal.font]}>{Moment(new Date(parseInt(item.trans_timestamp.toString(), 10) * 1000)).format("DD MMM YYYY (ddd) hh:mm a")}</Text>
                                        </View>
                                        <View style = {{flexDirection: 'row', height: '100%', marginLeft: 5, alignItems: 'center'}}>
                                            <Text style = {[{fontSize: 24, color: Colors.black}, stylesGlobal.font]}>+</Text>
                                            <Image style = {{width: 25, height: 25,}} resizeMode = {'contain'} source={require("../icons/TurningCoin.gif")}></Image>
                                            <Text style = {[{fontSize: 14, color: Colors.black}, stylesGlobal.font]}>{Number(item.trans_amount)}</Text>
                                        </View>
                                    </View>
                                </View>
                            }
                            </View>
                            )
                        }
                        </ScrollView>
                    }
                    </View>
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
    component_view: {
        width: '100%', 
        
        borderBottomWidth: 0.5,
        borderBottomColor: Colors.black,
        paddingLeft: 10,
        paddingRight: 10,
        paddingTop: 20,
        paddingBottom: 20,
        flexDirection: 'row',
        alignItems: 'center'
    },
    title_text: {
        fontSize: 14, 
        color: Colors.black
    },
    
});
