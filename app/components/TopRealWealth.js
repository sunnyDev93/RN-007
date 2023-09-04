import React, { Component } from "react";
import {
    Alert,
    StyleSheet,
    SafeAreaView,
    View,
    TouchableOpacity,
    Image,
    TextInput,
    Keyboard,
    ScrollView,
    Text,
    Dimensions
} from "react-native";

import { ImageCompressor } from './ImageCompressorClass'
import { Colors } from "../consts/Colors";
import { Constants } from "../consts/Constants";
import { stylesGlobal, STICKY_HEADER_HEIGHT } from '../consts/StyleSheet';
import Memory from "../core/Memory";
import * as Global from "../consts/Global";
import WebService from "../core/WebService";
import ProgressIndicator from "./ProgressIndicator";
import Moment from "moment/moment";
import AsyncStorage from '@react-native-community/async-storage';


var {height, width} = Dimensions.get('window');

var TAG = "TopRealWealth";

export default class TopRealWealth extends React.Component {

    constructor(props) {

        super(props)

        this.state = {

            userId: "",
            userToken: "",
            userSlug: "",
            userImagePath: "",
            userImageName: "",
            showModel: false,
            member_plan: '',
            is_verified: '0',

            searchText: '',

            dataMyProfile: null,

            loading: false,

            member_list: [],
            my_rank: null
            
        }

    }

    UNSAFE_componentWillMount() {
        this.getData();
       
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
                showModel: false,
                member_plan: member_plan,
                is_verified: is_verified,


            }, () => {
                this.getTopList();
                this.callMyProfileDetailAPI();
            });
        } catch (error) {
            // Error retrieving data
        }

    };


    isCloseToBottom = ({layoutMeasurement, contentOffset, contentSize}) => {
        const paddingToBottom = 10;
        return layoutMeasurement.height + contentOffset.y >=
          contentSize.height - paddingToBottom;
    };

    isCloseToTop = ({layoutMeasurement, contentOffset, contentSize}) => {
        const paddingToBottom = 10;
        return contentOffset.y <= -10
    };

    getTopList() {
        try {

            this.setState({
                loading: true,
            });
            var uri = Memory().env == "LIVE" ? Global.URL_TOPLIST_NETWEALTH : Global.URL_TOPLIST_NETWEALTH_DEV;
            
            let params = new FormData();
            params.append("token", this.state.userToken);
            params.append("user_id", this.state.userId);
            params.append("format", "json");
                                    
            console.log(TAG + " callGetMyTopListAPI uri " + uri);
            console.log(TAG + " callGetMyTopListAPI params " + JSON.stringify(params));

            WebService.callServicePost(uri, params, this.handleGetTopListAPI);
        } catch (error) {
            console.log(TAG + " callGetMyTopListAPI error " + error);
            this.setState({
                loading: false,
            });
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    }

    handleGetTopListAPI = (response, isError) => {
        console.log(TAG + " callGetMyTopListAPI Response " + JSON.stringify(response));
        console.log(TAG + " callGetMyTopListAPI isError " + isError);

        if (!isError) {
            var result = response;
            if (result != undefined && result != null) {
                if(result.status == "success") {
                    if(result.data != null) {
                        var member_list = [];
                        var my_rank = null;
                        var my_rank_exist = false;
                        for(i = 0; i < result.data.length; i ++) {
                            if(i < 7) {
                                member_list.push(result.data[i]);
                                if(result.data[i].id == this.state.userId) {
                                    my_rank_exist = true
                                }
                            } else {
                                if(my_rank_exist) {
                                    break;
                                }
                            }
                            if(result.data[i].id == this.state.userId) {
                                if(i < 7) {
                                    my_rank = null
                                } else {
                                    result.data[i].rank = i;
                                    my_rank = result.data[i];
                                    break;
                                }
                            }
                        }
                        this.setState({
                            member_list: member_list,
                            my_rank: my_rank
                        })
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
        });
    }

    callMyProfileDetailAPI = async () => {
        try {
            console.log('callmyprofle')
            let uri = Memory().env == "LIVE" ? Global.URL_MY_PROFILE_DETAIL :Global.URL_MY_PROFILE_DETAIL_DEV

            let params = new FormData();
            params.append("token", this.state.userToken);
            params.append("user_id", this.state.userId);
            params.append("format", "json");

            WebService.callServicePost(
                uri,
                params,
                this.handleGetMyprofileDetailResponse
            );
        } catch (error) {
            
        }
    };
    /**
    * handle my profile API response
    */
    handleGetMyprofileDetailResponse = (response, isError) => {
        if (!isError) {
            var result = response;
            if (result != undefined && result != null) {
                if (result.data != undefined && result.data != null) {
                    this.setState({
                        dataMyProfile: result.data,
                    });
                    
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
    };

    render() {
        return (
            <SafeAreaView style={styles.container}>
            {
                this.state.loading && <ProgressIndicator/>
            }
                <View style = {{width: '100%', height: 100, justifyContent: 'center', alignItems: 'center',}}>
                    <View style = {{width: '93%', height: '93%', position: 'absolute', zIndex: 5}}>
                        <Image style = {{width: '100%', height: '100%', resizeMode: 'contain'}} source={require("../icons/toplist-real-wealth.png")}/> 
                    </View>
                </View>
            {
                !this.state.loading && this.state.member_list.length == 0 &&
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    {this.empty_cardview("No Members")}
                </View>
            }
            {
                !this.state.loading && this.state.member_list.length > 0 &&
                 <View style = {{flex: 1, width: '100%', alignItems: 'center',}}>
                    <View style = {{flex: 1, width: '90%',}}>
                        <ScrollView style = {{width: '100%', height: '100%', marginTop: 10}}
                            scrollEventThrottle={0}
                            onScroll={({nativeEvent}) => {
                                if(this.isCloseToTop(nativeEvent)) {
                                    this.getTopList();
                                }
                                if(this.isCloseToBottom(nativeEvent)) {
                                    
                                }
                            }}
                        >
                        {
                            this.state.member_list.map((item, index) => 
                            <View key = {index} style = {{width: '100%', alignItems: 'center'}}>
                            {
                                this._renderPersons(item, index)
                            }    
                            </View>
                            )
                        }
                        {
                            this.state.my_rank != null &&
                            <View style = {{width: '100%', justifyContent: 'center', flexDirection: 'row', alignItems: 'center', marginBottom: 10, paddingVertical: 10}}>
                                <View style = {{width: 5, height: 5, borderRadius: 5, backgroundColor: Colors.white, marginRight: 15}}/>
                                <View style = {{width: 5, height: 5, borderRadius: 5, backgroundColor: Colors.white, marginRight: 15}}/>
                                <View style = {{width: 5, height: 5, borderRadius: 5, backgroundColor: Colors.white,}}/>
                            </View>
                        }
                        {
                            this.state.my_rank != null &&
                            this._renderPersons(this.state.my_rank, -1)
                        } 
                            <View style = {{width: '100%', marginBottom: 10, justifyContent: 'space-around', alignItems: 'center', backgroundColor: Colors.white, borderRadius: 5}}>
                                <View style = {{height: 60, width: '100%', marginVertical: 15}}>
                                    <Image style = {{width: '100%', height: '100%', resizeMode: 'contain'}} source={require("../icons/toplist-sidepanel-wealth.png")}/>
                                </View>
                                <Text style = {[styles.component_text, stylesGlobal.font, {marginBottom: 10}]}>Show Off Your Real Wealth</Text>
                                <Text style = {[styles.component_text, stylesGlobal.font, {marginBottom: 10, fontSize: 12}]}>Prove a Higher Net Worth</Text>
                                <TouchableOpacity style = {[stylesGlobal.common_button, stylesGlobal.shadow_style, {marginBottom: 15}]} 
                                    onPress = {() => 
                                        this.props.navigation.navigate('Dashboard', { selected_screen: "myaccount", myaccount_initial_tab: "upload_document" })
                                        // this.props.navigation.navigate('EditProfile', {
                                        //     profileDetail: this.state.dataMyProfile,
                                        //     refreshAction: this.getDataAgain
                                        // })
                                    }
                                >
                                    <Text style = {[styles.component_text, stylesGlobal.font, {color: Colors.white}]}>Edit Net Worth</Text>
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </View>
                </View> 
            }
            </SafeAreaView>
        );
    }

    empty_cardview = (empty_text) => {
        return (
            <View style = {[styles.cardView, {height: '90%', justifyContent: 'center', alignItems: 'center'}]}>
                <Text style={[styles.empty_text, stylesGlobal.font, ]}>{empty_text}</Text>
            </View>
        )
    }

    _renderPersons = (item, index) => {
        var imageUrl = item.imgpath + Constants.THUMB_FOLDER + item.filename;
        
        return(
            <View style={[styles.person_view, index == -1 || item.id == this.state.userId ? {backgroundColor: Colors.gold} : null]} activeOpacity = {Global.activeOpacity} onPress = {() => this.gift_detail(item)}>
                <View style = {{width: '30%', height: '90%', justifyContent: 'center', alignItems: 'center'}}>
                {
                    index != -1 && index == 0 &&
                    <View style = {[styles.seal_view, ]}>
                        <Image style = {{width: '100%', height: '100%', resizeMode: 'contain',}} source={require("../icons/toplist-seal-gold.png")}/>
                    </View>
                }
                {
                    index != -1 && index == 1 &&
                    <View style = {styles.seal_view}>
                        <Image style = {{width: '100%', height: '100%', resizeMode: 'contain',}} source={require("../icons/toplist-seal-silver.png")}/>
                    </View>
                }
                {
                    index != -1 && index == 2 &&
                    <View style = {styles.seal_view}>
                        <Image style = {{width: '100%', height: '100%', resizeMode: 'contain',}} source={require("../icons/toplist-seal-bronze.png")}/>
                    </View>
                }
                    <Text style = {[styles.component_text, {textAlign:'center'}, stylesGlobal.font_bold,]}>{index == -1 || item.id == this.state.userId ? "Your\nRank\n#" + (index == -1 ? (this.state.my_rank.rank + 1) : (index + 1)) : "Rank\n#" + (index + 1)}</Text>
                </View>
                <View style = {{width: '30%', height: '90%', justifyContent: 'center', alignItems: 'center'}}>
                    <TouchableOpacity onPress = {() => {
                        if (item.id === this.state.userId) {
                            this.props.navigation.navigate("MyProfile", {
                                refreshProfileImage: this.refreshProfileImage
                            });
                        } else {
                            this.props.navigation.navigate("ProfileDetail", {
                                slug: item.slug
                            });
                        }
                    }}>
                        <ImageCompressor
                            uri={imageUrl}
                            style={{width: width * 0.9 * 0.3 > 90 ? 90 : width * 0.9 * 0.3, height: width * 0.9 * 0.3 > 90 ? 90 : width * 0.9 * 0.3, borderRadius: width * 0.9 * 0.3 > 90 ? 90 / 2 : width * 0.9 * 0.3 / 2}}
                            default = {require('../icons/Background-Placeholder_Camera.png')}
                        />
                    </TouchableOpacity>
                </View>
                <View style = {{width: '30%', height: '90%', justifyContent: 'center'}}>
                    <Text style = {[styles.component_text, {color: index == -1 || item.id == this.state.userId ? Colors.black : Colors.gold}, stylesGlobal.font]} numberOfLines = {1} renderTruncatedFooter = {() => null}>{item.first_name + " " + item.last_name}</Text>
                    <View style = {styles.coin_view}>
                        <Image source={require('../icons/toplist-smallicons-wealth.png')} style={{width: 30, height: 30, resizeMode:'contain'}} />
                        <View style = {{marginTop: 5}}>
                            <Text style = {[styles.component_text, stylesGlobal.font]}>{"Net Worth:"}</Text>
                            <Text style = {[styles.component_text, stylesGlobal.font]}>{item.networth_amount != null && item.networth_amount != "" ? item.networth_amount : "$0"}</Text>
                        </View>
                    </View>
                </View>
            </View>
        )
    }

     /**
    * get profile info API again
    */
    getDataAgain = (refresh) => {
        if (refresh) {
            this.getData();
        }
    }
 
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: "100%",
        height: "100%",
        backgroundColor: Colors.black
    },
    cardView: {
        width: width * 0.8,
        backgroundColor: Colors.white,
        margin: 12, //cardMargin,
        borderRadius: 10,
        paddingTop:5,
        paddingBottom:20,
        paddingHorizontal:10,
        shadowColor: Colors.white,
        shadowOffset: {
            width: 0,
            height: 0
        },
        shadowRadius: 7,
        shadowOpacity: 7.0
    },
    person_view: {
        width: '100%',
        height: 100,
        borderRadius: 5,
        backgroundColor: Colors.white,
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        marginBottom: 10
    },
    seal_view: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute', 
        left: 0, 
        right: 0
    },
    component_text: {
        fontSize: 13,
        color: Colors.black,
    },
    coin_view: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    fitImage: {
        borderRadius: 10,
        width: width * 0.9 * 0.3 - 20,
        height: width * 0.8 - 20,
        overflow: 'hidden',
        // backgroundColor: Colors.gray,
        aspectRatio: 1
    },
    fitImageView: {
        borderRadius: 10,
        borderColor: Colors.white,
        borderWidth: 3,
        overflow: 'hidden',
        aspectRatio: 1
    },
    toplist_title: {
        color: Colors.black,
        fontSize: 16,
        fontWeight: '600'
    },
    empty_text: {
        color: Colors.black,
        fontSize: 14,
        textAlign: "center"
    },
});
