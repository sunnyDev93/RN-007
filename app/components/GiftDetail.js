import React, { Component } from "react";
import {
    SafeAreaView,
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    Image,
    TextInput,
    Dimensions, Alert,
    FlatList,
    Keyboard
} from "react-native";
import { EventRegister } from 'react-native-event-listeners'
import { ImageCompressor } from './ImageCompressorClass'
import { Colors } from "../consts/Colors";
import { Constants } from "../consts/Constants";
import { stylesGlobal, STICKY_HEADER_HEIGHT } from '../consts/StyleSheet'
import CustomPopupView from "../customview/CustomPopupView"
import { ScrollView } from "react-native-gesture-handler";
import ProgressIndicator from "./ProgressIndicator";
import Memory from '../core/Memory';
import * as Global from "../consts/Global";
import WebService from "../core/WebService";
import BannerView from "../customview/BannerView";
import AsyncStorage from '@react-native-community/async-storage';


var {width, height} = Dimensions.get('window');

var TAG = "GiftDetailScreen";
var isFirsTime = true;
var userId = '';
var userToken = '';


export default class GiftDetail extends React.Component {

    constructor(props) {
        isFirsTime = true;
        super(props)

        this.state = {
            loading: false,
            initialIndex: -1,
            userImagePath: "",
            userImageName: "",
            showModel: false,
            selected_gift: null,
            selected_gift_item: this.props.route.params.item,
            numberofgift: this.props.route.params.numberofgift,
            receiver: this.props.route.params.receiver,

            send_modal_show: false,
            
            sender_search_text: '',

            person_list: [],

            searchText: '',

            senderlist_page_number: 1,

            sender_button_show: true,
        }
    }

    UNSAFE_componentWillMount() {
        this.getData();
        this.listener = EventRegister.addEventListener(Constants.EVENT_PROFILE_IMAGE_UPDATED, () => {
            console.log(TAG,"EVENT_PROFILE_IMAGE_UPDATED event called");
            this.refreshProfileImage();
        })
    }

    componentDidMount() {

    }

    componentWillUnmount() {
        EventRegister.removeEventListener(this.listener)
    }
    /**
       * get async storage data
       */
    getData = async () => {
        try {

            userId = await AsyncStorage.getItem(Constants.KEY_USER_ID);
            userToken = await AsyncStorage.getItem(Constants.KEY_USER_TOKEN);
            var userSlug = await AsyncStorage.getItem(Constants.KEY_USER_SLUG);
            var userFirstName = await AsyncStorage.getItem(Constants.KEY_USER_FIRST_NAME);
            var userLastName = await AsyncStorage.getItem(Constants.KEY_USER_LAST_NAME);
            var userImagePath = await AsyncStorage.getItem(Constants.KEY_USER_IMAGE_URL);
            var userImageName = await AsyncStorage.getItem(Constants.KEY_USER_IMAGE_NAME);

            console.log(TAG + " getData userId " + userId);
            console.log(TAG + " getData userToken " + userToken);
            console.log(TAG + " getData userSlug " + userSlug);

            this.setState({
                userId: userId,
                userToken: userToken,
                userSlug: userSlug,
                userImagePath: userImagePath,
                userImageName: userImageName,
                showModel: false,
            });
            if(this.props.route.params != null) {
                if(this.props.route.params.src_screen == 'mygift') {
                    this.setState({
                        sender_button_show: false
                    })
                }
            }
        } catch (error) {
            // Error retrieving data
        }

        this.getGiftDetail();

    };

    getGiftDetail = async() => {
        try {
            this.setState({
                loading: true
            });
            let uri = Memory().env == "LIVE" ? Global.URL_GIFT_DETAIL + this.state.selected_gift_item.id : Global.URL_GIFT_DETAIL_DEV + this.state.selected_gift_item.id;

            let params = new FormData();
            params.append("token", this.state.userToken);
            params.append("user_id", this.state.userId);
            params.append("format", "json");
            
            console.log(TAG + " callgiftDetailAPI uri " + uri);
            console.log(TAG + " callgiftDetailAPI params " + JSON.stringify(params));

            WebService.callServicePost(
                uri,
                params,
                this.handleGiftDetailResponse
            );
        } catch (error) {
            console.log(error)
            this.setState({
                loading: false
            });
            Alert.alert(JSON.stringify(error), "");
        }
    }

    handleGiftDetailResponse = (response, isError) => {
        console.log(TAG + " callgiftDetailAPI result " + JSON.stringify(response));
        if (!isError) {
            try {
                var result = response;
                if (typeof result != "undefined" && result != undefined && result != null) {
                    if(result.status == "success") {
                        this.setState({
                            selected_gift: result.data
                        }, () => this.main_scrollview.scrollTo({x: 0, y: 0, animated: true}))
                    }
                }
            } catch (error) {
                Alert.alert(JSON.stringify(error), "");
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

    search_person = async() => {
        Keyboard.dismiss();
        if(this.state.loading) {
            return;
        }
        try {
            this.setState({
                loading: true
            });
            let uri = Memory().env == "LIVE" ? Global.URL_SEARCH + this.state.senderlist_page_number : Global.URL_SEARCH_DEV + this.state.senderlist_page_number;
            var jsonData = {
                eyeColor: '',
                skinColor: '',
                hairColor: '',
                ethnicity: '',
                maritalStatus: '',
                body: '',
                recordPerPage: '',
                userType: '',
                age: '',
                miles: '',
                networth: '',
                connection: '',
                gender: '',
                height: '',
                weight: '',
                page: this.state.senderlist_page_number,
                keyword: this.state.sender_search_text
            }
            let params = new FormData();
            params.append("token", this.state.userToken);
            params.append("user_id", this.state.userId);
            params.append("format", "json");
            params.append("data", JSON.stringify(jsonData));

            console.log(TAG + " callsearchpersonAPI uri " + uri);
            console.log(TAG + " callsearchpersonAPI params " + JSON.stringify(params));

            WebService.callServicePost(
                uri,
                params,
                this.handleGiftSenderSearchResponse
            );
        } catch (error) {
            console.log(error)
            this.setState({
                loading: false
            });
            Alert.alert(JSON.stringify(error), "");
        }
    }

    handleGiftSenderSearchResponse = (response, isError) => {
        if (!isError) {
            try {
                var result = response;
                if (typeof result != "undefined" && result != undefined && result != null) {
                    console.log(TAG + " callsearchpersonAPI result " + JSON.stringify(response));
                    var person_list = this.state.person_list;
                    var person_list_response = result.data.result;
                    for(i = 0; i < person_list_response.length; i ++) {
                        person_list_response[i].selected = false;
                        var exist = false;
                        for(j = 0; j < person_list.length; j ++) {
                            if(person_list_response[i].user_id == person_list[j].user_id) {
                                exist = true;
                                break;
                            }
                        }
                        if(!exist) {
                            person_list.push(person_list_response[i])
                        }
                    }
                    
                    this.setState({
                        person_list: person_list,
                    })
                }
            } catch (error) {
                Alert.alert(JSON.stringify(error), "");
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

    select_person(index) {
        var person_list = this.state.person_list;
        for(i = 0; i < person_list.length; i ++) {
            if(i == index) {
                person_list[i].selected = true;
            } else {
                person_list[i].selected = false;
            }
        }
        this.setState({
            person_list: person_list
        })
    }

    like_button_click = async() => {

        try {
            this.setState({
                loading: true
            });
            let uri = Memory().env == "LIVE" ? Global.URL_GIFT_FAVORITE : Global.URL_GIFT_FAVORITE_DEV;

            let params = new FormData();
            params.append("token", this.state.userToken);
            params.append("user_id", this.state.userId);
            params.append("format", "json");
            params.append("product_id", this.state.selected_gift.product_id);
            if(this.state.selected_gift.wishlist_id == null) {
                params.append("type", "add");
            } else {
                params.append("type", "remove");
            }

            console.log(TAG + " callgiftfavoriteAPI uri " + uri);
            console.log(TAG + " callgiftfavoriteAPI params " + JSON.stringify(params));

            WebService.callServicePost(
                uri,
                params,
                this.handleGiftFavoriteResponse
            );
        } catch (error) {
            console.log(error)
            this.setState({
                loading: false
            });
            Alert.alert(JSON.stringify(error), "");
        }
    }

    handleGiftFavoriteResponse = (response, isError) => {
        if (!isError) {
            try {
                var result = response;
                if (typeof result != "undefined" && result != undefined && result != null) {
                    console.log(TAG + " callgiftfavoriteAPI result " + JSON.stringify(response));
                    if(this.state.selected_fav_index != -1) {
                        var selected_gift = this.state.selected_gift;
                        if(selected_gift.wishlist_id == null) {
                            selected_gift.wishlist_id = "0"
                        } else {
                            selected_gift.wishlist_id = null
                        }
                        this.setState({
                            selected_gift: selected_gift,
                        })
                    }
                }
            } catch (error) {
                Alert.alert(JSON.stringify(error), "");
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

    gift_click = (index) => {
        this.setState({
            selected_gift_item: this.state.selected_gift.similar_item[index]
        }, () => this.getGiftDetail())
    }

    buyButtonAction() {
        var gift_item = {
            "id": this.state.selected_gift.orderDetails.id,
            "title": this.state.selected_gift.orderDetails.title,
            "image_path": this.state.selected_gift.orderDetails.image_path,
            "image_name": this.state.selected_gift.orderDetails.image_name,
            "gold_coin": this.state.selected_gift.orderDetails.gold_coin,
            "type": this.state.selected_gift.orderDetails.type,
            "status": this.state.selected_gift.orderDetails.status,
            "slug": "",
            "wishlist_id": this.state.selected_gift.orderDetails.wishlist_id
        }
        this.props.navigation.navigate("GiftBuy", {selected_gift: gift_item})
    }

    close_sender_modal() {
        this.setState({
            send_modal_show: false,
            sender_search_text: '',
            person_list: []
        })
    }

    sendButtonAction() {
        if(this.state.receiver != null) {
            var gift_item = {
                id: this.state.selected_gift.orderDetails.id,
                title: this.state.selected_gift.orderDetails.title,
                image_path: this.state.selected_gift.orderDetails.image_path,
                image_name: this.state.selected_gift.orderDetails.image_name,
                gold_coin: this.state.selected_gift.orderDetails.gold_coin,
                type: this.state.selected_gift.orderDetails.type,
                status: this.state.selected_gift.orderDetails.status,
                slug: "",
                wishlist_id: this.state.selected_gift.wishlist_id
            }
            this.props.navigation.navigate("GiftSend", {selected_gift: gift_item, numberofgift: this.state.numberofgift, receiver: this.state.receiver})
        } else {
            this.setState({
                send_modal_show: true,
            })
        }
    }

    checkoutButtonAction() {
        var receiver = null;
        var person_list = this.state.person_list;
        for(i = 0; i < person_list.length; i ++) {
            if(person_list[i].selected) {
                receiver = person_list[i];
            }
        }
        if(receiver == null) {
            Alert.alert(Constants.SELECT_GIFT_RECEIVER, "");
            return;
        }
        this.setState({
            send_modal_show: false
        })
        var gift_item = {
            "id": this.state.selected_gift.orderDetails.id,
            "title": this.state.selected_gift.orderDetails.title,
            "image_path": this.state.selected_gift.orderDetails.image_path,
            "image_name": this.state.selected_gift.orderDetails.image_name,
            "gold_coin": this.state.selected_gift.orderDetails.gold_coin,
            "type": this.state.selected_gift.orderDetails.type,
            "status": this.state.selected_gift.orderDetails.status,
            "slug": "",
            "wishlist_id": this.state.selected_gift.orderDetails.wishlist_id
        }
        this.props.navigation.navigate("GiftSend", {selected_gift: gift_item, numberofgift: this.state.numberofgift, receiver: receiver})

    }
 
    _renderPersonItem = ({item, index})=>{
        let imagURL = item.imgpath + Constants.THUMB_FOLDER + item.filename;
        return(
            <TouchableOpacity style = {[{width: '100%', height: 80, alignItems: 'center', flexDirection: "row"}, item.selected ? {backgroundColor: Colors.gold} : null]}
                onPress = {() => this.select_person(index)}    
            >
                <View style={{height: '100%', aspectRatio: 1, marginLeft: 10, justifyContent: 'center', alignItems: 'center'}}>
                    <ImageCompressor
                        style={{width: 70, height: 70, borderRadius: 5, overflow: 'hidden'}}
                        uri={imagURL}
                    />
                </View>
                <Text style = {[{fontSize: 16, marginLeft: 10}, stylesGlobal.font, item.selected ? {color: Colors.white} : {color: Colors.black}]}>{item.first_name} {item.last_name}</Text>
            </TouchableOpacity>
        )
    }

    render() {
        return (
            <SafeAreaView style={styles.container} onStartShouldSetResponder={() => Keyboard.dismiss()}>
                {this.renderHeaderView()}
                {this.renderBannerView()}
                {this.renderPopupView()}
            {
                this.state.send_modal_show && this.state.selected_gift != null &&
                <View style = {{position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, zIndex: 5, backgroundColor: Colors.black, opacity: 0.3}}></View>
            }
            {
                this.state.send_modal_show && this.state.selected_gift != null &&
                <View style = {{position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, zIndex: 10, alignItems: 'center', justifyContent: 'center'}}>
                    <View style = {{width: '90%', height: height * 0.7, backgroundColor: Colors.white, borderRadius: 5, alignItems: 'center'}}>
                        <TouchableOpacity style = {{position: 'absolute', right: 10, top: 10, width: 20, height: 20, zIndex: 10}} onPress = {() => this.close_sender_modal()}>
                            <Image style = {{width: '100%', height: '100%'}} resizeMode = {'contain'} source = {require('../icons/gift_sendmodal_close.png')}/>
                        </TouchableOpacity>
                        <View style = {{width: '100%', height: 120, flexDirection: 'row', alignItems: 'center', borderBottomColor: '#808080', borderBottomWidth: 0.5, paddingLeft: 10, paddingRight: 10}}>
                            <Image style = {{width: 80, height: 50}} resizeMode = {'cover'} source = {{url: (this.state.selected_gift.orderDetails.image_path + this.state.selected_gift.orderDetails.image_name)}}></Image>
                            <View style = {{height: '100%', justifyContent: 'center', marginLeft: 10}}>
                                <Text style = {[{color: Colors.black, fontSize: 16,}, stylesGlobal.font]}>Whom would you like to {"\n"}gift this to?</Text>
                                <View style = {{marginTop: 10, flexDirection: 'row', alignItems: 'center'}}>
                                    <Text style = {[styles.rowText, stylesGlobal.font]}>Value: </Text>
                                    <Text style = {[styles.rowText, stylesGlobal.font, {color: Colors.gold}]}>{parseInt(this.state.selected_gift.orderDetails.gold_coin.toString(), 10) * this.state.numberofgift}</Text>
                                    <Image style = {{width: 25, height: '100%', marginLeft: 5}} resizeMode = {'contain'} source={require("../icons/TurningCoin.gif")}></Image>
                                </View>
                            </View>
                        </View>
                        <View style = {{width: '100%', height: height * 0.7 - 120 - 60, borderBottomColor: '#808080', borderBottomWidth: 0.5, paddingLeft: 10, paddingRight: 10}}>
                            <TextInput style = {[{width: '100%', height: 40, marginTop: 10, borderRadius: 5, borderColor: '#404040', borderWidth: 0.5, paddingLeft: 5}, stylesGlobal.font]}
                                onChangeText = {(text) => this.setState({sender_search_text: text})}
                                placeholder = {'Search ...'}
                                returnKeyType = {'search'}
                                onSubmitEditing = {() => {
                                    this.setState({
                                        senderlist_page_number: 1
                                    }, () => this.search_person())
                                }}
                            >
                                {this.state.sender_search_text}
                            </TextInput>
                            <View style = {{width: '100%', height: height * 0.7 - 120 - 60 - 40 - 10, paddingTop: 10, paddingBottom: 10}}>
                                <FlatList style = {{width: '100%', height: '100%'}}
                                    extraData={this.state}
                                    // key = {this.state.person_list.length}
                                    pagingEnabled={false}
                                    showsHorizontalScrollIndicator={false}
                                    showsVerticalScrollIndicator={false}
                                    data={this.state.person_list}
                                    keyExtractor={(item, index) => index}
                                    renderItem={( item, index ) => this._renderPersonItem(item, index)}
                                    onScroll={({nativeEvent}) => {
                                        if(nativeEvent.layoutMeasurement.height + nativeEvent.contentOffset.y >= nativeEvent.contentSize.height - 20) {
                                            if(!this.state.loading) {
                                                this.setState({
                                                    senderlist_page_number: this.state.senderlist_page_number + 1
                                                }, () => this.search_person())
                                            }
                                        }
                                    }}
                                />
                            </View>
                            
                        </View>
                        <View style = {{width: '100%', height: 60, alignItems: "flex-end", justifyContent: 'center'}}>
                            <TouchableOpacity style = {[{width: 120, height: 40, marginRight: 20, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.gold, borderRadius: 5}, stylesGlobal.shadow_style]}
                                onPress = {() => this.checkoutButtonAction()}
                            >
                                <Text style = {[styles.rowText, stylesGlobal.font, {color: Colors.white}]}>Select</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            }
            {
                this.state.selected_gift != null &&
                <View style = {{flex: 1, padding: 15}}>
                    <ScrollView style = {{width: '100%'}} showsVerticalScrollIndicator = {false} ref = {(ref) => this.main_scrollview = ref}>
                        <View style = {[styles.cardView, {paddingTop: 0}]}>
                            <View style={[stylesGlobal.title_header, {marginBottom: 20}]}>
                                <Text style={[stylesGlobal.headText, stylesGlobal.font]}>GIFT DETAIL</Text>
                            </View>
                            <TouchableOpacity style = {{width: width - 15 * 2 - 10 * 2, height: width - 15 * 2 - 10 * 2}}
                                onPress={() => {
                                    this.props.navigation.navigate("ImageZoom", {
                                        index: 0,
                                        tempGalleryUrls: [{
                                            // id: this.state.selected_gift.image,
                                            // image: { uri: this.state.selected_gift.image }
                                            id: this.state.selected_gift.orderDetails.image_path + this.state.selected_gift.orderDetails.image_name,
                                            image: { uri: this.state.selected_gift.orderDetails.image_path + this.state.selected_gift.orderDetails.image_name }
                                        }]
                                    })
                                }}    
                            >
                                <ImageCompressor
                                    uri={this.state.selected_gift.orderDetails.image_path + this.state.selected_gift.orderDetails.image_name }
                                    style={{ width: width - 15 * 2 - 10 * 2, height: width - 15 * 2 - 10 * 2, borderRadius: 5, overflow: 'hidden'}}
                                />
                            </TouchableOpacity>
                            <Text
                                style={[stylesGlobal.titleText, stylesGlobal.font_bold]}
                                numberOfLines={1}
                            >
                                {this.state.selected_gift.orderDetails.title}
                            </Text>
                            <View style = {{width: '100%', paddingLeft: 5, paddingRight: 5, marginTop: 20, }}>
                                <View style = {{width: '100%', height: 40, justifyContent: 'center', alignItems: 'center', backgroundColor: '#666666', flexDirection: 'row'}}>
                                    <Text style = {[styles.rowText, stylesGlobal.font]}>Value: </Text>
                                    <Text style = {[styles.rowText, stylesGlobal.font, {color: Colors.gold}]}>{parseInt(this.state.selected_gift.orderDetails.gold_coin.toString(), 10) * this.state.numberofgift}</Text>
                                    <Image style = {{width: 25, height: '100%', marginLeft: 5}} resizeMode = {'contain'} source={require("../icons/TurningCoin.gif")}></Image>
                                </View>
                            </View>
                            <View style = {{width: '100%', alignItems: 'center', justifyContent: 'center', marginTop: 20}}>
                                <TouchableOpacity style = {{width: 50, height: 50}} onPress = {() => this.like_button_click()}>
                                {
                                    this.state.selected_gift.wishlist_id != null &&
                                    <Image style = {{width: '100%', height: '100%'}} source={require( "../icons/full_favorite_red.png")}></Image>
                                }
                                {
                                    this.state.selected_gift.wishlist_id == null &&
                                    <Image style = {{width: '100%', height: '100%'}} source={require( "../icons/full_favorite_black.png")}></Image>
                                } 
                                </TouchableOpacity>
                            </View>
                        {
                            this.state.sender_button_show &&
                            <View style = {{width: '100%', alignItems: 'center', justifyContent: 'center', marginTop: 20, flexDirection: 'row'}}>
                                <TouchableOpacity style = {[styles.button, stylesGlobal.shadow_style, {marginRight: 30}]} onPress = {() => this.sendButtonAction()}>
                                    <Text style = {[styles.buttonText, stylesGlobal.font]}>Send</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style = {[styles.button, stylesGlobal.shadow_style]} onPress = {() => this.buyButtonAction()}>
                                    <Text style = {[styles.buttonText, stylesGlobal.font]}>Buy</Text>
                                </TouchableOpacity>
                            </View>
                        }
                            <View style = {{width: '100%', height: 1, marginTop: 20, backgroundColor: '#666666'}}/>
                            <View style = {{width: '100%', paddingLeft: 5, paddingRight: 5, marginTop: 30}}>
                                <View style = {{width: 150, height: 40, alignItems: 'center', justifyContent: 'center', borderTopLeftRadius: 10, borderTopRightRadius: 10, backgroundColor: '#666666', borderColor: Colors.black, borderWidth: 1}}>
                                    <Text style = {[styles.rowText, stylesGlobal.font, {color: Colors.white}]}>Description</Text>
                                </View>
                                <View style = {{width: '100%', padding: 15, borderColor: Colors.gray, borderWidth: 1}}>
                                    <Text style = {[{width: '100%', fontSize: 12, color: Colors.black}, stylesGlobal.font]} multiline = {true}>{this.state.selected_gift.orderDetails.description}</Text>
                                </View>
                            </View>
                        </View>
                        <View style = {styles.cardView}>
                            <Text style = {[styles.rowText, stylesGlobal.font]}>You May Also Like</Text>
                            <ScrollView horizontal={true} style = {{marginTop: 20, marginBottom: 20, width: '100%', paddingLeft: 10, paddingRight: 10}} showsHorizontalScrollIndicator = {false}>
                            {
                                this.state.selected_gift.similar_item.map((item, index) => 
                                <View key = {index} style = {{width: 200, marginRight: 15, alignItems: 'center'}}>
                                    <TouchableOpacity onPress = {() => this.gift_click(index)}>
                                        <ImageCompressor
                                            uri={item.image_path + item.image_name}
                                            style={{ width: 200, height: 200, borderRadius: 5, overflow: 'hidden'}}
                                        />
                                    </TouchableOpacity>
                                    <Text style = {[{fontSize: 12, color: Colors.black, marginTop: 10}, stylesGlobal.font]}>{item.name}</Text>
                                    <View style = {{width: 150, height: 40, marginTop: 20, justifyContent: 'center', alignItems: 'center', backgroundColor: '#666666', flexDirection: 'row'}}>
                                        <Text style = {[styles.rowText, stylesGlobal.font, {color: Colors.gold}]}>{item.gold_coin}</Text>
                                        <Image style = {{width: 25, height: '100%', marginLeft: 5}} resizeMode = {'contain'} source={require("../icons/goldCoin10New.png")}></Image>
                                    </View>
                                </View>
                                )
                            }
                            </ScrollView>
                        </View>
                    </ScrollView>  
                </View>
            }
            {
                this.state.loading && <ProgressIndicator/>
            }   
            </SafeAreaView>
        );
    }

    renderBannerView = () => {
        return (
            <BannerView
                screenProps = {this.props.navigation}
            />
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
    /** render PopUp Menu
    *
    * @returns {*}
    */

    renderPopupView = () => {
        return (
            <CustomPopupView
                showModel={this.state.showModel}
                openMyAccountScreen={(show_myaccount, myaccount_initial_tab) => {this.props.navigation.navigate('Dashboard', {selected_screen: "myaccount", myaccount_initial_tab: myaccount_initial_tab})}}
                logoutUser={this.logoutUser}
                closeDialog={() => { this.setState({ showModel: false }) }}
                prop_navigation = {this.props.navigation}
            >
            </CustomPopupView>
        )
    }
    
    refreshProfileImage = async () => {
        try {
            var userImagePath = await AsyncStorage.getItem(Constants.KEY_USER_IMAGE_URL);
            var userImageName = await AsyncStorage.getItem(Constants.KEY_USER_IMAGE_NAME);
            this.setState({
                userImagePath: userImagePath,
                userImageName: userImageName
            });
        } catch (error) {
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    }

    logoutUser = async () => {
        this.hidePopupView()
        try {
            await AsyncStorage.setItem(Constants.KEY_USER_ID, "");
            await AsyncStorage.setItem(Constants.KEY_USER_TOKEN, "");
            
            this.props.navigation.navigate("SignInScreen", {isGettingData: false});
        } catch (error) {
            console.log(TAG + " logoutUser error " + error);
        }
    }

    hidePopupView = () => {
        this.setState({
            showModel: false
        })
    }

    showPopupView = () => {
        this.setState({
            showModel: true
        })
    }

    handleEditComplete = () => {
        searchText = this.state.searchText.trim();
        this.setState({
            searchText: searchText,
        });
        if (searchText.length > 0) {
            this.props.navigation.navigate('Dashboard', {selected_screen: "members", search_text: searchText});
        }
    };


    /**
   * display top header
   */
    renderHeaderView = () => {

        let imageUrl = this.state.userImagePath + Constants.THUMB_FOLDER + this.state.userImageName;
        return (
            <View style={[stylesGlobal.headerView]}>
                <TouchableOpacity style={stylesGlobal.header_backbuttonview_style} onPress={() => this.props.navigation.goBack()}>
                    <Image style = {stylesGlobal.header_backbuttonicon_style} source={require("../icons/icon_back.png")}/>
                </TouchableOpacity>
                <TouchableOpacity style={stylesGlobal.header_logoview_style} onPress = {() => this.props.navigation.navigate('Dashboard', {logoclick: true})}>
                    <Image
                        style={stylesGlobal.header_logo_style}
                        source={require("../icons/logo_new.png")}
                    />
                </TouchableOpacity>
                <View style={stylesGlobal.header_searchview_style}>
                    <TextInput
                        ref = "searchTextInput"
                        autoCorrect = {false}
                        underlineColorAndroid="transparent"
                        returnKeyType={"search"}
                        style={[stylesGlobal.header_searchtextview_style, stylesGlobal.font]}
                        onChangeText={searchText => this.setState({ searchText })}
                        value={this.state.searchText}
                        defaultValue=""
                        multiline={false}
                        autoCapitalize='sentences'
                        onSubmitEditing={this.handleEditComplete}
                        keyboardType='ascii-capable'
                        placeholder="Search members..."
                    />
                    <TouchableOpacity style={stylesGlobal.header_searchiconview_style} onPress = {() => {
                        if(this.state.searchText == "") {
                            this.refs.searchTextInput.focus();
                        } else {
                            Keyboard.dismiss();
                            this.setState({
                                searchText: ""
                            })
                        }}}
                    >
                    {
                        this.state.searchText != "" &&
                        <Image
                            style = {stylesGlobal.header_searchicon_style}
                            source={require("../icons/connection-delete.png")}
                        />
                    }
                    {
                        this.state.searchText == "" &&
                        <Image
                            style = {stylesGlobal.header_searchicon_style}
                            source={require("../icons/dashboard_search.png")}
                        />
                    }
                    </TouchableOpacity>
                </View>
                <TouchableOpacity style={stylesGlobal.header_avatarview_style} onPress={() => this.showPopupView()}>
                    <View style={stylesGlobal.header_avatarsubview_style}>
                        <ImageCompressor style = {stylesGlobal.header_avatar_style} uri={imageUrl}/>
                    </View>
                </TouchableOpacity>
            </View>
        );
    };




}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.black,
    },
    cardView: {
        width: '100%', 
        backgroundColor: Colors.white, 
        borderRadius: 10, 
        marginBottom: 15, 
        paddingTop: 20, 
        paddingBottom: 20, 
        alignItems: 'center'
    },
    fitImage: {
        borderRadius: 10,
        minHeight: width * 0.6,
        overflow: 'hidden',
        backgroundColor: Colors.white,
        aspectRatio: 1
    },
    fitImageView: {
        borderRadius: 10,
        borderColor: Colors.white,
        borderWidth: 3,
        overflow: 'hidden',
        aspectRatio: 1
    },
    rowText: {
        color: Colors.black,
        fontSize: 14,
        backgroundColor: Colors.transparent
    },
    labelIcon: {
        width: 20,
        height: 20,
        resizeMode: 'contain',
        marginRight: 5,
        marginLeft: 5,
    },
    button: {
        padding: 10,
        backgroundColor: Colors.gold,
        borderRadius: 5,
        paddingLeft: 20,
        paddingRight: 20
    },
    buttonText: {
        color: Colors.white,
        fontSize: 14,
        textAlign: "center",
    }, 

    countButton: {
        width: 40, 
        height: 40, 
        
        alignItems: 'center', 
        justifyContent: 'center', 
        backgroundColor:Colors.gold,
    },
    count_textview: {
        width: '60%', 
        height: 40, 
        borderWidth: 1, 
        borderColor: Colors.gold, 
        textAlign: 'center', 
        marginLeft: 2, 
        marginRight: 2
    }
});
