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
import ProgressIndicator from "./ProgressIndicator";
import Memory from '../core/Memory';
import * as Global from "../consts/Global";
import WebService from "../core/WebService";
import BannerView from "../customview/BannerView";
import AsyncStorage from '@react-native-community/async-storage';


var {height, width} = Dimensions.get('window');

var TAG = "MyWishListScreen";
var userId = '';
var userToken = '';
const cardMargin = 12;


export default class MyWishListScreen extends React.Component {

    constructor(props) {
        super(props)

        this.state = {
            userImagePath: "",
            userImageName: "",
            showModel: false,
            
            entries: [],

            searchText: '',

            send_modal_show: false,
            coincount_price: [],
            numberofgift: [],
            selected_gift_index: 0,
            sender_search_text: '',

            selected_gift_category_id: '',

            person_list: [],
            receiver: null,

            wishlist_page_number: 0,
            senderlist_page_number: 1,

            selected_fav_index: -1,

            more_load: true,
            total_count: 0
        }
    }

    UNSAFE_componentWillMount() {
        
        this.listener = EventRegister.addEventListener(Constants.EVENT_PROFILE_IMAGE_UPDATED, () => {
            console.log(TAG,"EVENT_PROFILE_IMAGE_UPDATED event called");
            this.refreshProfileImage();
        })
        if(this.props.route.params && this.props.route.params.receiver) {
            this.setState({
                receiver: this.props.route.params.receiver,
            })
        }

        this.getData();
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

            this.setState({
                userId: userId,
                userToken: userToken,
                userSlug: userSlug,
                userImagePath: userImagePath,
                userImageName: userImageName,
                showModel: false,
            }, () => this.getWishList());
        } catch (error) {
            // Error retrieving data
        }

    };

    getWishList = async() => {
        try {
            this.setState({
                loading: true
            });
            var uri = "";
            if(this.state.receiver) {
                uri = Memory().env == "LIVE" ? Global.BASE_URL + this.state.receiver.slug + "/wishlist-items/" + this.state.wishlist_page_number : Global.BASE_URL_DEV + this.state.receiver.slug + "/wishlist-items/" + this.state.wishlist_page_number
            } else {
                uri = Memory().env == "LIVE" ? Global.BASE_URL + this.state.userSlug + "/wishlist-items/" + this.state.wishlist_page_number : Global.BASE_URL_DEV + this.state.userSlug + "/wishlist-items/" + this.state.wishlist_page_number
            }

            let params = new FormData();
            params.append("token", this.state.userToken);
            params.append("user_id", this.state.userId);
            params.append("format", "json");
            params.append("data", JSON.stringify({keyword: "", category: "", goldCoins: ""}));

            console.log(TAG + " callWishListAPI uri " + uri);
            console.log(TAG + " callWishListAPI params " + JSON.stringify(params));

            WebService.callServicePost(
                uri,
                params,
                this.handleWishListResponse
            );
        } catch (error) {
            console.log(error)
            this.setState({
                loading: false
            });
            Alert.alert(error, "");
        }
    }

    handleWishListResponse = (response, isError) => {
        console.log(TAG + " callWishListAPI result " + JSON.stringify(response));
        if (!isError) {
            try {
                var result = response;
                if (typeof result != "undefined" && result != undefined && result != null) {

                    var entries = [];
                    var coincount_price = [];
                    var numberofgift = [];
                    if(result.data == null) {
                        return
                    }
                    if(result.data.products == null) {
                        return
                    }
                    if(result.data.products.length > 0) {
                        if(this.state.wishlist_page_number == 0) {
                            this.setState({
                                entries: result.data.products
                            }, () => {
                                
                                for (i = 0; i < this.state.entries.length; i ++) {
                                    coincount_price.push('1  ' + this.state.entries[i].gold_coin);
                                    numberofgift.push(1);
                                }
                                this.setState({
                                    coincount_price: coincount_price,
                                    numberofgift: numberofgift
                                })
                            });
                        } else {
                            entries = this.state.entries;
                            coincount_price = this.state.coincount_price;
                            numberofgift = this.state.numberofgift;

                            var exist = false;
                            for (i = 0; i < result.data.products.length; i ++) {
                                exist = false;
                                for(j = 0; j < entries.length; j ++) {
                                    if(result.data.products[i].id == entries[j].id) {
                                        exist = true;
                                        break;
                                    }
                                }
                                if(!exist) {
                                    entries.push(result.data.products[i]);
                                    coincount_price.push('1  ' + result.data.products[i].gold_coin);
                                    numberofgift.push(1);
                                }
                            }
                            this.setState({
                                entries: entries,
                                coincount_price: coincount_price,
                                numberofgift: numberofgift
                            })
                        }
                    } 
                    if(result.data.products.length < 20) {
                        this.setState({
                            more_load: false
                        })
                    }
                }
            } catch (error) {
                Alert.alert(error, "");
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


    like_button_click = async(index) => {
        try {
            this.setState({
                loading: true
            });
            let uri = Memory().env == "LIVE" ? Global.URL_GIFT_FAVORITE : Global.URL_GIFT_FAVORITE_DEV;

            let params = new FormData();
            params.append("token", this.state.userToken);
            params.append("user_id", this.state.userId);
            params.append("format", "json");
            params.append("product_id", this.state.entries[index].id);
            if(this.state.entries[index].wishlist_id == null) {
                params.append("type", "add");
            } else {
                params.append("type", "remove");
            }

            console.log(TAG + " callgiftfavoriteAPI uri " + uri);
            console.log(TAG + " callgiftfavoriteAPI params " + JSON.stringify(params));
            this.setState({
                selected_fav_index: index
            })
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
            Alert.alert(error, "");
        }
    }

    handleGiftFavoriteResponse = (response, isError) => {
        console.log(TAG + " callgiftfavoriteAPI result " + JSON.stringify(response));
        if (!isError) {
            try {
                var result = response;
                if (typeof result != "undefined" && result != undefined && result != null) {
                    if(result.status == "success") {
                        if(this.state.selected_fav_index != -1) {
                            var entries = this.state.entries;
                            entries.splice(this.state.selected_fav_index, 1);
                            this.setState({
                                entries: entries,
                                selected_fav_index: -1
                            })
                        }
                    } else {
                        Alert.alert(response.msg.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
                    }
                }
            } catch (error) {
                Alert.alert(error, "");
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

    sendButtonAction(index) {
        if(this.state.receiver != null) {
            
            this.props.navigation.navigate("GiftSend", {selected_gift: this.state.entries[index], numberofgift: this.state.numberofgift[index], receiver: this.state.receiver})
        } else {
            this.setState({
                send_modal_show: true,
                selected_gift_index: index
            })
        }
    }

    buyButtonAction(index) {
        this.props.navigation.navigate("GiftBuy", {selected_gift: this.state.entries[index]})
    }

    plus_button(index) {
        var coin_count = this.state.entries[index].gold_coin;
        var coincount_price = this.state.coincount_price;
        var numberofgift = this.state.numberofgift;
        numberofgift[index] = numberofgift[index] + 1;
        coincount_price[index] = numberofgift[index] + "  " + coin_count * numberofgift[index];
        this.setState({
            coincount_price: coincount_price,
            numberofgift: numberofgift
        })

    }

    minus_button(index) {
        var coin_count = this.state.entries[index].gold_coin;
        var coincount_price = this.state.coincount_price;
        var numberofgift = this.state.numberofgift;
        if(numberofgift[index] > 0) {
            numberofgift[index] = numberofgift[index] - 1;
            if(numberofgift[index] > 0) {
                coincount_price[index] = numberofgift[index] + "  " + coin_count * numberofgift[index];
            } else {
                coincount_price[index] = '';
            }
            this.setState({
                coincount_price: coincount_price,
                numberofgift: numberofgift
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
        this.props.navigation.navigate("GiftSend", {selected_gift: this.state.entries[this.state.selected_gift_index], numberofgift: this.state.numberofgift[this.state.selected_gift_index], receiver: receiver})

    }

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
            Alert.alert(error, "");
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
                Alert.alert(error, "");
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

    close_sender_modal() {
        this.setState({
            send_modal_show: false,
            sender_search_text: '',
            person_list: []
        })
    }

    isCloseToBottom = ({layoutMeasurement, contentOffset, contentSize}) => {
        const paddingToBottom = 10;
        return layoutMeasurement.height + contentOffset.y >=
          contentSize.height - paddingToBottom;
    };

    isCloseToTop = ({layoutMeasurement, contentOffset, contentSize}) => {
        const paddingToBottom = 10;
        console.log(contentOffset.y)
        return contentOffset.y <= -40
    };

    _renderItem=({item, index})=>{
        // var imageUrl = item.imgpath + Constants.THUMB_FOLDER + item.filename;
        var imageUrl = item.image_path + item.image_name;
        return(
                <TouchableOpacity style={[styles.cardView]} onPress = {() => {
                    this.props.navigation.navigate("GiftDetail", {item: this.state.entries[index], numberofgift: this.state.numberofgift[index], receiver: this.state.receiver})
                }}>

                    <View style={styles.fitImageView}>
                        <ImageCompressor
                            uri={imageUrl}
                            style={styles.fitImage}
                        />
                    {
                        !this.state.receiver &&
                        <TouchableOpacity style = {{width: 65, height: 65, position: 'absolute', zIndex: 10, right: -5, bottom: -5}} onPress = {() => this.like_button_click(index)}>
                        {
                            item.wishlist_id != null &&
                            <Image style = {{width: '100%', height: '100%'}} source={require( "../icons/full_favorite_red.png")}></Image>
                        }
                        {
                            item.wishlist_id == null &&
                            <Image style = {{width: '100%', height: '100%'}} source={require( "../icons/full_favorite_black.png")}></Image>
                        } 
                        </TouchableOpacity>
                    }
                    </View>
                    <Text
                        style={[stylesGlobal.titleText, stylesGlobal.font]}
                        numberOfLines={1}
                    >
                        {item.title}
                    </Text>
                    <View style = {{width: '100%', flexDirection: 'row', marginTop: 10}}>
                        <View style = {{width: '65%'}}>
                            <View style = {{width: '100%', flexDirection: 'row', alignItems: 'center', marginBottom: 5}}>
                                <Text style={[styles.rowText, stylesGlobal.font]}>Gold Coins: {item.gold_coin}</Text>
                                <Image style = {styles.labelIcon} source={require("../icons/goldCoin10New.png")}></Image>
                            </View>
                            <Text style={[styles.rowText, stylesGlobal.font]}>Type: {item.type == "0" ? "Real Gift" : "Virtual Gift"}</Text>
                        </View>
                        <View style = {{width: '30%', justifyContent: 'flex-end', alignItems: 'center'}}>
                            
                        </View>
                    </View>
                {
                    item.coin_pack &&
                    <View style = {{width: '100%', height: 40, marginTop: 20, justifyContent: 'center', alignItems: 'center', flexDirection: 'row'}}>
                        <TouchableOpacity style = {[styles.countButton, {borderTopLeftRadius: 5, borderBottomLeftRadius: 5}]} onPress = {() => this.minus_button(index)}>
                            <Text style={[{color:Colors.white,fontSize: 24,fontWeight:'bold'},stylesGlobal.font]}>
                                - 
                            </Text>
                        </TouchableOpacity>
                        <TextInput style = {[styles.count_textview, stylesGlobal.font, {fontSize:18}]} editable = {false}>
                            {this.state.coincount_price[index]}
                        </TextInput>
                        <TouchableOpacity style = {[styles.countButton, {borderTopRightRadius: 5, borderBottomRightRadius: 5}]} onPress = {() => this.plus_button(index)}>
                            <Text style={[{color:Colors.white,fontSize: 24,fontWeight:'bold'},stylesGlobal.font]}>
                                + 
                            </Text>
                        </TouchableOpacity>
                    </View>
                }
                    <View style = {{width: '100%', marginTop: 20, justifyContent: 'center', flexDirection: 'row'}}>
                        <TouchableOpacity style = {[styles.button, stylesGlobal.shadow_style]} onPress = {() => this.sendButtonAction(index)}>
                            <Text style = {[styles.buttonText, stylesGlobal.font]}>Send</Text>
                        </TouchableOpacity>
                    {
                        !this.state.receiver &&
                        <TouchableOpacity style = {[styles.button, stylesGlobal.shadow_style, {marginLeft: 15}]} onPress = {() => this.buyButtonAction(index)}>
                            <Text style = {[styles.buttonText, stylesGlobal.font]}>Buy</Text>
                        </TouchableOpacity>
                    }
                        
                    </View>
                </TouchableOpacity>
        )
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
                <View style={[stylesGlobal.title_header, {borderTopRightRadius: 0, borderTopLeftRadius: 0,}]}>
                    <Text style={[stylesGlobal.headText, stylesGlobal.font]}>{this.state.receiver ? this.state.receiver.first_name + " " + this.state.receiver.last_name + "'s Wish List" : "My Wish List"}</Text>
                </View>
            {
                this.state.send_modal_show &&
                <View style = {{position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, zIndex: 5, backgroundColor: Colors.black, opacity: 0.3}}></View>
            }
            {
                this.state.send_modal_show &&
                <View style = {{position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, zIndex: 10, alignItems: 'center', justifyContent: 'center'}}>
                    <View style = {{width: '90%', height: height * 0.7, backgroundColor: Colors.white, borderRadius: 5, alignItems: 'center'}}>
                        <TouchableOpacity style = {{position: 'absolute', right: 10, top: 10, width: 20, height: 20, zIndex: 10}} onPress = {() => this.close_sender_modal()}>
                            <Image style = {{width: '100%', height: '100%'}} resizeMode = {'contain'} source = {require('../icons/gift_sendmodal_close.png')}/>
                        </TouchableOpacity>
                        <View style = {{width: '100%', height: 120, flexDirection: 'row', alignItems: 'center', borderBottomColor: '#808080', borderBottomWidth: 0.5, paddingLeft: 10, paddingRight: 10}}>
                            <Image style = {{width: 80, height: 50}} resizeMode = {'cover'} source = {{url: (this.state.entries[this.state.selected_gift_index].image_path + this.state.entries[this.state.selected_gift_index].image_name)}}></Image>
                            <View style = {{height: '100%', justifyContent: 'center', marginLeft: 10}}>
                                <Text style = {[{color: Colors.black, fontSize: 16,}, stylesGlobal.font]}>Whom would you like to {"\n"}gift this to?</Text>
                                <View style = {{marginTop: 10, flexDirection: 'row', alignItems: 'center'}}>
                                    <Text style = {[styles.rowText, stylesGlobal.font]}>Value: </Text>
                                    <Text style = {[styles.rowText, stylesGlobal.font, {color: Colors.gold}]}>{parseInt(this.state.entries[this.state.selected_gift_index].gold_coin.toString(), 10) * this.state.numberofgift[this.state.selected_gift_index]}</Text>
                                    <Image style = {{width: 25, height: '100%', marginLeft: 5}} resizeMode = {'contain'} source={require("../icons/goldCoin10New.png")}></Image>
                                </View>
                            </View>
                        </View>
                        <View style = {{width: '100%', height: height * 0.7 - 120 - 60, borderBottomColor: '#808080', borderBottomWidth: 0.5, paddingLeft: 10, paddingRight: 10}}>
                            <TextInput style = {[{width: '100%', height: 40, marginTop: 10, borderRadius: 5, borderColor: '#404040', borderWidth: 0.5, paddingLeft: 5}, stylesGlobal.font]}
                                onChangeText = {(text) => this.setState({sender_search_text: text})}
                                placeholder = {'Search ...'}
                                returnKeyType = {'search'}
                                autoCorrect = {false}
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
                this.state.entries.length > 0 &&
                <View style={{ flex: 1, alignItems: 'center' }}>
                    <FlatList
                        extraData={this.state}
                        // key = {this.state.entries.length}
                        pagingEnabled={false}
                        showsHorizontalScrollIndicator={false}
                        showsVerticalScrollIndicator={false}
                        data={this.state.entries}
                        keyExtractor={(item, index) => index.toString()}
                        renderItem={( item, index ) => this._renderItem(item, index)}
                        onScroll={({nativeEvent}) => {
                            if(this.isCloseToBottom(nativeEvent)) {
                                if(this.state.more_load) {
                                    this.setState({
                                        wishlist_page_number: this.state.wishlist_page_number + 1
                                    }, () => this.getGiftsList())
                                }
                            }
                        }}
                    />
                </View>
            }
            {
                !this.state.loading && this.state.entries.length == 0 && 
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <View style={[styles.cardView, {height: '80%', justifyContent: 'center', alignItems: 'center'}]}>
                        <Text style={[stylesGlobal.empty_cardView_text, stylesGlobal.font]}>{"The Wish List is empty"}</Text>
                    </View>
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
        width: width * 0.8,
        backgroundColor: Colors.white,
        margin: cardMargin,
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
    fitImage: {
        borderRadius: 10,
        width: width * 0.80 - 20,
        height: width * 0.80 - 20,
        overflow: 'hidden',
        backgroundColor: Colors.white,
        aspectRatio: 1
    },
    fitImageView: {
        borderRadius: 10,
        borderColor: Colors.white,
        borderWidth: 3,
        // overflow: 'hidden',
        aspectRatio: 1
    },
    rowText: {
        color: Colors.black,
        fontSize: 14,
        backgroundColor: Colors.transparent
    },
    labelIcon: {
        width: 25,
        height: 25,
        resizeMode: 'contain',
        marginRight: 5,
        marginLeft: 5,
    },
    button: {
        padding: 10,
        backgroundColor: Colors.gold,
        borderRadius: 5,
        borderWidth: 1,
        borderColor: Colors.transparent,
        paddingLeft: 20,
        paddingRight: 20
    },
    buttonText: {
        color: Colors.white,
        fontSize: 14,
        backgroundColor: Colors.transparent,
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
