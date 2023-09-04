import React, { Component } from "react";
import {
    SafeAreaView,
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    Image,
    TextInput,
    Dimensions, 
    Alert,
    Keyboard,
    FlatList,
    ScrollView
} from "react-native";
import { EventRegister } from 'react-native-event-listeners'
import { ImageCompressor } from './ImageCompressorClass'
import { Colors } from "../consts/Colors";
import { Constants } from "../consts/Constants";
import { stylesGlobal, STICKY_HEADER_HEIGHT } from '../consts/StyleSheet'
import HeaderView from "../customview/HeaderView";
import CustomPopupView from "../customview/CustomPopupView";
import NotificationPopupView from "../customview/NotificationPopupView";
import ProgressIndicator from "./ProgressIndicator";
import Memory from '../core/Memory';
import * as Global from "../consts/Global";
import WebService from "../core/WebService";
import ScrollableTabView, {
    ScrollableTabBar
} from "react-native-scrollable-tab-view";
import BannerView from "../customview/BannerView";
import AsyncStorage from '@react-native-community/async-storage';


var TAG = "GiftsScreen";
const cardMargin = 12;


export default class GiftsScreen extends React.Component {

    constructor(props) {
        super(props)

        this.state = {
            is_verified: "0",
            userImagePath: "",
            userImageName: "",
            showModel: false,
            showNotificationModel: false,
            category_list: [],

            searchText: '',

            gift_category_selected: true,

            gifts_list: [],
            more_load: true,

            send_modal_show: false,
            coincount_price: [],
            numberofgift: [],
            selected_gift_index: 0,
            sender_search_text: '',
            search_person_loading: false, // used to search persone to send gift

            selected_gift_category: null,
            // selected_gift_category: this.props.item,

            person_list: [],
            receiver: null,

            giftlist_page_number: 1,
            senderlist_page_number: 1,

            selected_fav_index: -1,
            initialIndex: 0,
            is_portrait: true,
            card_width: Dimensions.get('window').width * 0.8,
            screen_height: Dimensions.get('window').height
        }

        this.onEndReachedCalledDuringMomentumUser = true;
    }

    async UNSAFE_componentWillMount() {
        
        if(Dimensions.get("window").width < Dimensions.get("window").height) {
            this.setState({
                is_portrait: true,
                card_width: Dimensions.get('window').width * 0.8,
                screen_height: Dimensions.get('window').height
            })
        } else {
            this.setState({
                is_portrait: false,
                card_width: Dimensions.get('window').height * 0.8,
                screen_height: Dimensions.get('window').width
            })
        }        
        Dimensions.addEventListener("change", () => {
            if(Dimensions.get("window").width < Dimensions.get("window").height) {
                this.setState({
                    is_portrait: true,
                    card_width: Dimensions.get('window').width * 0.8,
                    screen_height: Dimensions.get('window').height
                })
            } else {
                this.setState({
                    is_portrait: false,
                    card_width: Dimensions.get('window').height * 0.8,
                    screen_height: Dimensions.get('window').width
                })
            }
        })
        this.listener = EventRegister.addEventListener(Constants.EVENT_PROFILE_IMAGE_UPDATED, () => {
            console.log(TAG,"EVENT_PROFILE_IMAGE_UPDATED event called");
            this.refreshProfileImage();
        })
        this.listenerGiftCategory = EventRegister.addEventListener(Constants.GIFT_CATEGORY_CHANGED, () => {
            console.log(TAG,"EVENT_gift category change event called");
            if(Global.gift_category_selected) {
                if(this.state.is_verified == "1") {
                    this.setState({
                        gift_category_selected: true
                    })
                    // this.getGiftCategory();
                }
            } else {
                console.log("fafafafafafafafsaf")
            }
        })
    }

    componentDidMount() {
        this.getData();
    }
    
    componentWillUnmount() {
        EventRegister.removeEventListener(this.listener);
        EventRegister.removeEventListener(this.listenerGiftCategory);
    }

    initReceiver() {
        
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
            var is_verified = await AsyncStorage.getItem(Constants.KEY_IS_VERIFIED);
            this.setState({
                userId: userId,
                userToken: userToken,
                userSlug: userSlug,
                userImagePath: userImagePath,
                userImageName: userImageName,
                showModel: false,
                is_verified: is_verified
            }, () => {
                if(this.state.is_verified == "1") {
                    this.getGiftCategory();
                }
            });
        } catch (error) {
            console.log(error)
        }
    };

    getGiftCategory = async() => {
        try {
            this.setState({
                loading: true
            });
            let uri = Memory().env == "LIVE" ? Global.URL_GIFTS_CATEGORY : Global.URL_GIFTS_CATEGORY_DEV

            let params = new FormData();
            params.append("token", this.state.userToken);
            params.append("user_id", this.state.userId);
            params.append("format", "json");

            console.log(TAG + " callgiftcategoryAPI uri " + uri);
            console.log(TAG + " callgiftcategoryAPI params " + JSON.stringify(params));

            WebService.callServicePost(
                uri,
                params,
                this.handleGiftCategoryResponse
            );
        } catch (error) {
            console.log(error)
            this.setState({
                loading: false
            });
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    }

    handleGiftCategoryResponse = (response, isError) => {
        console.log(TAG + " callGiftCategoryAPI result " + JSON.stringify(response));
        if (!isError) {
            try {
                var result = response;
                if (typeof result != "undefined" && result != undefined && result != null) {
                    this.setState({
                        category_list: result.data.category
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

    getGiftsList = async() => {
        try {
            this.setState({
                loading: true,
            });
            let uri = Memory().env == "LIVE" ? Global.URL_GIFTS_LIST + this.state.giftlist_page_number : Global.URL_GIFTS_LIST_DEV + this.state.giftlist_page_number

            let params = new FormData();
            params.append("token", this.state.userToken);
            params.append("user_id", this.state.userId);
            params.append("format", "json");
            params.append("keyword", "");
            params.append("category", this.state.selected_gift_category.id);
            // params.append("category", "10,11,12,13");
            params.append("goldCoins", "10-10000");

            console.log(TAG + " callgiftlistAPI uri " + uri);
            console.log(TAG + " callgiftlistAPI params " + JSON.stringify(params));

            WebService.callServicePost(
                uri,
                params,
                this.handleGiftListResponse
            );
        } catch (error) {
            console.log(error)
            this.setState({
                loading: false
            });
            Alert.alert(JSON.stringify(error), "");
        }
    }

    handleGiftListResponse = (response, isError) => {
        console.log(TAG + " callgiftlistAPI result " + JSON.stringify(response));
        if (!isError) {
            try {
                var result = response;
                if (typeof result != "undefined" && result != undefined && result != null) {
                    var gifts_list = [];
                    var coincount_price = [];
                    var numberofgift = [];
                    if(result.data.length > 0) {
                        this.setState({
                            more_load: true
                        })
                        if(this.state.giftlist_page_number == 1) {
                            this.setState({
                                gifts_list: result.data
                            }, () => {
                                
                                for (i = 0; i < this.state.gifts_list.length; i ++) {
                                    coincount_price.push('1  ' + this.state.gifts_list[i].gold_coin);
                                    numberofgift.push(1);
                                }
                                this.setState({
                                    coincount_price: coincount_price,
                                    numberofgift: numberofgift
                                })
                            });
                        } else {
                            gifts_list = this.state.gifts_list;
                            coincount_price = this.state.coincount_price;
                            numberofgift = this.state.numberofgift;

                            var exist = false;
                            for (i = 0; i < result.data.length; i ++) {
                                exist = false;
                                for(j = 0; j < gifts_list.length; j ++) {
                                    if(result.data[i].id == gifts_list[j].id) {
                                        exist = true;
                                        break;
                                    }
                                }
                                if(!exist) {
                                    gifts_list.push(result.data[i]);
                                    coincount_price.push('1  ' + result.data[i].gold_coin);
                                    numberofgift.push(1);
                                }
                            }
                            
                            this.setState({
                                gifts_list: gifts_list,
                                coincount_price: coincount_price,
                                numberofgift: numberofgift
                            })
                        }
                    } else {
                        this.setState({
                            more_load: false
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
            params.append("product_id", this.state.gifts_list[index].id);
            if(this.state.gifts_list[index].wishlist_id == null) {
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
                        var gifts_list = this.state.gifts_list;
                        if(gifts_list[this.state.selected_fav_index].wishlist_id == null) {
                            gifts_list[this.state.selected_fav_index].wishlist_id = "0"
                        } else {
                            gifts_list[this.state.selected_fav_index].wishlist_id = null
                        }
                        this.setState({
                            gifts_list: gifts_list,
                            selected_fav_index: -1
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

    sendButtonAction(index) {
        this.setState({
            person_list: [],
            send_modal_show: true,
            selected_gift_index: index
        })
        this.search_person();
    }

    buyButtonAction(index) {
        this.props.rootNavigation.navigate("GiftBuy", {selected_gift: this.state.gifts_list[index]})
    }

    plus_button(index) {
        var coin_count = this.state.gifts_list[index].gold_coin;
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
        var coin_count = this.state.gifts_list[index].gold_coin;
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
        this.props.rootNavigation.navigate("GiftSend", {selected_gift: this.state.gifts_list[this.state.selected_gift_index], numberofgift: this.state.numberofgift[this.state.selected_gift_index], receiver: receiver})

    }

    search_person = async() => {
        // if(this.state.search_person_loading) {
        //     return;
        // }
        try {
            this.setState({
                search_person_loading: true
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
                search_person_loading: false
            });
            Alert.alert(JSON.stringify(error), "");
        }
    }

    handleGiftSenderSearchResponse = (response, isError) => {
        console.log(TAG + " callsearchpersonAPI result " + JSON.stringify(response));
        if (!isError) {
            try {
                var result = response;
                if (typeof result != "undefined" && result != undefined && result != null) {
                    if(result.status == "success") {
                        var person_list = this.state.person_list;
                        if(this.state.senderlist_page_number == 1) {
                            person_list = [];
                        }
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
                            send_modal_show: true
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
            search_person_loading: false
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

    updateCategoryTabContent(data) {
        this.setState({
            initialIndex: data.i
        });
        if(!this.state.gift_category_selected) {
            this.setState({
                gifts_list: [],
                selected_gift_category: this.state.category_list[data.i],
                giftlist_page_number: 1,
            }, () => this.getGiftsList())
        }
    }

    updateGiftListTabContent(data) {
        this.setState({
            gifts_list: [],
            selected_gift_category: this.state.category_list[data.i],
            giftlist_page_number: 1,
            initialIndex: data.i
        }, () => this.getGiftsList())
    }

    isCloseToTop = ({layoutMeasurement, contentOffset, contentSize}) => {
        const paddingToBottom = 10;
        return contentOffset.y <= -10
    };
    
    _renderItemGiftCategory = (item, index)=>{
        // var imageUrl = item.image_url + Constants.THUMB_FOLDER + item.image_name;
        var imageUrl = item.image_url + item.image_name;
        return(
            <View style = {[styles.cardView, {flex: 1, width: this.state.card_width, height: '100%' }]}>
                <TouchableOpacity style = {{ width: '100%', height: '100%'}} activeOpacity = {Global.activeOpacity} 
                    onPress = {() => {
                        this.setState({
                            selected_gift_category: item, receiver: null, gift_category_selected: false
                        }, () => this.getGiftsList())
                    }}
                >
                    <View style={styles.fitImageView}>
                        <ImageCompressor
                            uri={imageUrl}
                            style={styles.fitImage}
                            default = {require('../icons/Background-Placeholder_Camera.png')}
                        />
                    </View>
                    <View style = {{flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center'}}>
                        <Text style={[stylesGlobal.titleText, stylesGlobal.font_bold]} numberOfLines={1} >
                            {item.title}
                        </Text>
                        <View style = {{width: '100%', alignItems: 'center', marginTop: 25}}>
                            <View style = {[{width: '70%', paddingVertical: 10, backgroundColor: Colors.gold, borderRadius: 5, alignItems: 'center'}, stylesGlobal.shadow_style]}>
                                <Text style = {[{fontSize: 16, color: Colors.white}, stylesGlobal.font]}>{"See Products"}</Text>
                            </View>
                        </View>
                    </View>
                </TouchableOpacity>
            </View>
        )
    }

    _renderItemGiftList = ({item, index}) => {
        // var imageUrl = item.imgpath + Constants.THUMB_FOLDER + item.filename;
        var imageUrl = item.image_path + item.image_name;
        return(
            <TouchableOpacity activeOpacity = {Global.activeOpacity} style={[styles.cardView, {width: this.state.card_width, }]} onPress = {() => {
                this.props.rootNavigation.navigate("GiftDetail", {item: this.state.gifts_list[index], numberofgift: this.state.numberofgift[index], receiver: this.state.receiver})
            }}>
                <View style={styles.fitImageView}>
                    <ImageCompressor uri={imageUrl} style={styles.fitImage} default = {require('../icons/Background-Placeholder_Camera.png')}/>
                    <TouchableOpacity style = {{width: 65, height: 65, position: 'absolute', zIndex: 10, right: 0, bottom: 0}} onPress = {() => this.like_button_click(index)}>
                    {
                        item.wishlist_id != null &&
                        <Image style = {{width: '100%', height: '100%'}} source={require( "../icons/full_favorite_red.png")}></Image>
                    }
                    {
                        item.wishlist_id == null &&
                        <Image style = {{width: '100%', height: '100%'}} source={require( "../icons/full_favorite_black.png")}></Image>
                    } 
                    </TouchableOpacity>
                </View>
                <Text style={[stylesGlobal.titleText, stylesGlobal.font_bold]} numberOfLines={1}>
                    {item.title}
                </Text>
                <View style = {{width: '100%', flexDirection: 'row', marginTop: 10}}>
                    <View style = {{width: '65%'}}>
                        <View style = {{width: '100%', flexDirection: 'row', alignItems: 'center', marginBottom: 5}}>
                            <Text style={[styles.rowText, stylesGlobal.font_bold]}>{"Gold Coin Value: "}</Text>
                            <Text style={[styles.rowText, stylesGlobal.font]}>{item.gold_coin}</Text>
                            <Image style = {styles.labelIcon} source={require("../icons/TurningCoin.gif")}></Image>
                        </View>
                        <View style = {{width: '100%', flexDirection: 'row', alignItems: 'center', marginBottom: 5}}>
                            <Text style={[styles.rowText, stylesGlobal.font_bold]}>{"Type: "}</Text>
                            <Text style={[styles.rowText, stylesGlobal.font]}>{item.type == "0" ? "Real Gift" : "Virtual Gift"}</Text>
                        </View>
                    </View>
                    <View style = {{width: '30%', justifyContent: 'flex-end', alignItems: 'center'}}>
                        
                    </View>
                </View>
            {/* {
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
            } */}
                <View style = {{width: '100%', marginTop: 20, justifyContent: 'center', flexDirection: 'row'}}>
                    <TouchableOpacity style = {[styles.button, stylesGlobal.shadow_style]} onPress = {() => this.sendButtonAction(index)}>
                        <Text style = {[styles.buttonText, stylesGlobal.font]}>{"Send"}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style = {[styles.button, stylesGlobal.shadow_style, {marginLeft: 15}]} onPress = {() => this.buyButtonAction(index)}>
                        <Text style = {[styles.buttonText, stylesGlobal.font]}>{"Buy"}</Text>
                    </TouchableOpacity>
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
            <SafeAreaView style={styles.container}>
                <HeaderView
                    ref = "header_view"
                    logoClick = {() => this.props.jumpToDashboardTab()}
                    screenProps = {this.props.rootNavigation}
                    setSearchText = {(text) => this.setState({searchText: text})}
                    handleEditComplete = {() => this.handleEditComplete()}
                    showNotificationPopupView = {() => { this.refs.refNotificationPopupView.getData(); this.setState({ showNotificationModel: true }) }}
                    showPopupView = {() => this.setState({ showModel: true })}
                />
                <BannerView screenProps = {this.props.rootNavigation} jumpToEventTab={this.props.jumpToEventTab} jumpToTravelTab={this.props.jumpToTravelTab} />
                <CustomPopupView
                    showModel = {this.state.showModel}
                    openMyAccountScreen = {this.props.jumpToDashboardTab}
                    logoutUser={this.logoutUser}
                    closeDialog={() => { this.setState({ showModel: false }) }}
                    prop_navigation = {this.props.rootNavigation}
                >
                </CustomPopupView>
                <NotificationPopupView
                    ref = "refNotificationPopupView"
                    showModel = {this.state.showNotificationModel}
                    openNotificationScreen = {this.props.jumpToDashboardTab}
                    closeDialog={() => { this.setState({ showNotificationModel: false }) }}
                    prop_navigation = {this.props.rootNavigation}
                >
                </NotificationPopupView>
            {
                this.state.is_verified != 1 &&
                <View style = {{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
                    <View style = {{ width: '70%', flexDirection: 'row', justifyContent: 'center', alignItems: 'center'}}>
                        <Image  style={{width: 40, height: 40, resizeMode: 'contain'}} source={require("../icons/signin_password.png")}/>
                        <Text style = {[{fontSize: 14, color: Colors.gold, textAlign: 'center', marginLeft: 10}, stylesGlobal.font]}>{Constants.NOT_APPROVED_MESSAGE}</Text>
                    </View>
                </View>
            }
            {
                this.state.send_modal_show &&
                <View style = {{position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, zIndex: 5, backgroundColor: Colors.black, opacity: 0.3}}></View>
            }
            {
                this.state.send_modal_show &&
                <View style = {{position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, zIndex: 10, alignItems: 'center', justifyContent: 'center'}}>
                    <View style = {{width: '90%', height: this.state.is_portrait ? '70%' : '90%', backgroundColor: Colors.white, borderRadius: 5, alignItems: 'center'}}>
                        {/* <TouchableOpacity style = {{position: 'absolute', right: 10, top: 10, width: 20, height: 20, zIndex: 10}} onPress = {() => this.close_sender_modal()}>
                            <Image style = {{width: '100%', height: '100%'}} resizeMode = {'contain'} source = {require('../icons/gift_sendmodal_close.png')}/>
                        </TouchableOpacity> */}
                        <View style = {{width: '100%', flexDirection: 'row', alignItems: 'center', borderBottomColor: '#808080', borderBottomWidth: 0.5, padding: 10}}>
                            <View style = {{ flex: 1, flexDirection: 'row', alignItems: 'center'}}>
                                <Image style = {{width: 80, height: 50}} resizeMode = {'cover'} source = {{url: (this.state.gifts_list[this.state.selected_gift_index].image_path + this.state.gifts_list[this.state.selected_gift_index].image_name)}}></Image>
                                <View style = {{flex: 1, justifyContent: 'space-evenly', marginLeft: 10}}>
                                    <Text style = {[{color: Colors.black, fontSize: 16,}, stylesGlobal.font]} multiline = {true}>{"Whom would you like to gift this to?"}</Text>
                                    <View style = {{marginTop: 10, flexDirection: 'row', alignItems: 'center'}}>
                                        <Text style = {[styles.rowText, stylesGlobal.font]}>{"Value: "}</Text>
                                        <Text style = {[styles.rowText, stylesGlobal.font, {color: Colors.gold}]}>{parseInt(this.state.gifts_list[this.state.selected_gift_index].gold_coin.toString(), 10) * this.state.numberofgift[this.state.selected_gift_index]}</Text>
                                        <Image style = {{width: 25, height: '100%', marginLeft: 5}} resizeMode = {'contain'} source={require("../icons/goldCoin10New.png")}></Image>
                                    </View>
                                </View>
                            </View>
                        {
                            !this.state.is_portrait &&
                            <View style = {{flex: 1, flexDirection: 'row', alignItems: 'center', marginLeft: 15}}>
                                <TextInput style = {[{flex: 1, height: 40, borderRadius: 5, borderColor: '#404040', borderWidth: 0.5, paddingHorizontal: 5}, stylesGlobal.font]}
                                    onChangeText = {(text) => 
                                        this.setState({
                                            sender_search_text: text
                                        }, () => {
                                            this.setState({
                                                senderlist_page_number: 1
                                            }, () => this.search_person())
                                        })
                                    }
                                    placeholder = {'Search ...'}
                                    returnKeyType = {'search'}
                                    autoCorrect = {false}
                                    // onSubmitEditing = {() => {
                                    //     this.setState({
                                    //         senderlist_page_number: 1
                                    //     }, () => this.search_person())
                                    // }}
                                ></TextInput>
                                <TouchableOpacity style = {[stylesGlobal.common_button, stylesGlobal.shadow_style, {marginStart: 10}]}
                                    onPress = {() => this.checkoutButtonAction()}
                                >
                                    <Text style = {[styles.rowText, stylesGlobal.font, {color: Colors.white}]}>{"Select"}</Text>
                                </TouchableOpacity>
                            </View>
                        }
                            <View style = {{height: '100%', justifyContent: 'flex-start'}}>
                                <TouchableOpacity style = {{width: 20, height: 20, zIndex: 10, marginTop: 10, marginHorizontal: 10}} onPress = {() => this.close_sender_modal()}>
                                    <Image style = {{width: '100%', height: '100%'}} resizeMode = {'contain'} source = {require('../icons/gift_sendmodal_close.png')}/>
                                </TouchableOpacity>
                            </View>
                        </View>
                        <View style = {{flex: 1, width: '100%', borderBottomColor: '#808080', borderBottomWidth: 0.5, paddingLeft: 10, paddingRight: 10}}>
                        {
                            this.state.is_portrait &&
                            <TextInput style = {[{width: '100%', height: 40, marginTop: 10, borderRadius: 5, borderColor: '#404040', borderWidth: 0.5, paddingLeft: 5}, stylesGlobal.font]}
                                onChangeText = {(text) => {
                                    this.setState({
                                        sender_search_text: text
                                    }, () => {
                                        this.setState({
                                            senderlist_page_number: 1
                                        }, () => this.search_person())
                                    })
                                }}
                                placeholder = {'Search ...'}
                                returnKeyType = {'search'}
                                autoCorrect = {false}
                                // onSubmitEditing = {() => {
                                //     this.setState({
                                //         senderlist_page_number: 1
                                //     }, () => this.search_person())
                                // }}
                            >
                                {this.state.sender_search_text}
                            </TextInput>
                        }
                            <View style = {{flex: 1, width: '100%', paddingVertical: 10}}>
                            {
                                this.state.search_person_loading &&
                                <ProgressIndicator/>
                            }
                                <FlatList style = {{width: '100%', height: '100%'}}
                                    extraData={this.state}
                                    pagingEnabled={false}
                                    showsHorizontalScrollIndicator={false}
                                    showsVerticalScrollIndicator={false}
                                    data={this.state.person_list}
                                    keyExtractor={(item, index) => index.toString()}
                                    numColumns = {this.state.is_portrait ? 1 : 2}
                                    key = {this.state.is_portrait ? 1 : 2}
                                    renderItem={( item, index ) => (
                                        <View key = {index} style = {{width: this.state.is_portrait ? '100%' : '50%', alignItems: 'center'}}>
                                        {
                                            this._renderPersonItem(item, index)
                                        }
                                        </View>
                                    )}
                                    onMomentumScrollBegin={() => { this.onEndReachedCalledDuringMomentumUser = false; }}
                                    onEndReachedThreshold={0.5}
                                    onEndReached={({ distanceFromEnd }) => {
                                        if (!this.onEndReachedCalledDuringMomentumUser ) {
                                            this.onEndReachedCalledDuringMomentumUser = true;
                                            if(this.state.more_load) {
                                                this.setState({
                                                    senderlist_page_number: this.state.senderlist_page_number + 1
                                                }, () => this.search_person())
                                            }
                                        }
                                    }}
                                    onScroll = {async({nativeEvent}) => {
                                        if(this.isCloseToTop(nativeEvent)) {
                                            this.setState({
                                                person_list: [],
                                                senderlist_page_number: 1,
                                                more_load: true
                                            }, () => this.search_person())
                                        }
                                    }}
                                />
                                {/* <FlatList style = {{width: '100%', height: '100%'}}
                                    extraData={this.state}
                                    // key = {this.state.person_list.length}
                                    pagingEnabled={false}
                                    showsHorizontalScrollIndicator={false}
                                    showsVerticalScrollIndicator={false}
                                    data={this.state.person_list}
                                    keyExtractor={(item, index) => index.toString()}
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
                                /> */}
                            </View>
                        </View>
                    {
                        this.state.is_portrait &&
                        <View style = {{width: '100%', height: 60, alignItems: "flex-end", justifyContent: 'center', paddingHorizontal: 20}}>
                            <TouchableOpacity style = {[stylesGlobal.common_button, stylesGlobal.shadow_style]}
                                onPress = {() => this.checkoutButtonAction()}
                            >
                                <Text style = {[styles.rowText, stylesGlobal.font, {color: Colors.white}]}>{"Select"}</Text>
                            </TouchableOpacity>
                        </View>
                    }
                    </View>
                </View>
            }
            {
                this.state.category_list.length > 0 && this.setGiftCategoryUpperTabBar()
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
                screenProps = {this.props.rootNavigation}
            />
        )
    }

    setGiftCategoryUpperTabBar = () => {
        return (
            <ScrollableTabView
                style={{ height: 50 }}
                tabBarBackgroundColor={Colors.black}
                tabBarActiveTextColor={Colors.gold}
                tabBarTextStyle = {stylesGlobal.font}
                locked = {false}
                ref='scrollableTab'
                tabBarUnderlineStyle={{ backgroundColor: Colors.gold }}
                tabBarInactiveTextColor={Colors.gold}
                onChangeTab={(data) => data.i != data.from && this.updateCategoryTabContent(data)}
                renderTabBar={() => <ScrollableTabBar />}
                // initialPage = {this.state.initialIndex}
                // page={this.state.initialIndex}
            >
            {
                this.state.gift_category_selected && this.state.category_list.map((item, index) => 
                <View key = {index} tabLabel = {item.title.toUpperCase()} style = {{flex: 1, width: '100%', alignItems: 'center'}}>
                {
                    this._renderItemGiftCategory(item, index)
                }
                </View>
                )
            }
            {
                !this.state.gift_category_selected && this.state.category_list.map((item, index) => 
                <View key = {index} tabLabel = {item.title.toUpperCase()} style = {{ flex: 1, width: '100%', alignItems: 'center'}}>
                {
                    this.state.gifts_list.length > 0 &&
                    <FlatList
                        extraData={this.state}
                        pagingEnabled={false}
                        showsHorizontalScrollIndicator={false}
                        showsVerticalScrollIndicator={false}
                        data={this.state.gifts_list}
                        keyExtractor={(subitem, subindex) => subindex.toString()}
                        renderItem={( subitem, subindex ) => this._renderItemGiftList(subitem, subindex)}
                        onScroll={({nativeEvent}) => {
                            if(nativeEvent.layoutMeasurement.height + nativeEvent.contentOffset.y >= nativeEvent.contentSize.height - 20 && this.state.more_load) {
                                if(!this.state.loading) {
                                    this.setState({
                                        giftlist_page_number: this.state.giftlist_page_number + 1
                                    }, () => this.getGiftsList())
                                }
                            }
                        }}
                    />
                }
                </View>
                )
            }
            </ScrollableTabView>
        );
    };

    /**
        * get profile info API again
        */
    getDataAgain = (refresh) => {
        if (refresh) {
            this.getData();
        }
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
        this.setState({
            showModel: false
        })
        try {
            await AsyncStorage.setItem(Constants.KEY_USER_ID, "");
            await AsyncStorage.setItem(Constants.KEY_USER_TOKEN, "");
            
            this.props.rootNavigation.navigate("SignInScreen", {isGettingData: false});
        } catch (error) {
            console.log(TAG + " logoutUser error " + error);
        }
    }

    handleEditComplete = () => {
        searchText = this.state.searchText.trim();
        this.setState({
            searchText: searchText,
        }, () => {
            if (this.state.searchText.length > 0) {
                this.props.jumpToSearchTab(this.state.searchText);
                // this.props.rootNavigation.navigate("SearchUser", {
                //     searchText: this.state.searchText
                // });
            }
        });
    };

}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.black,
    },
    cardView: {
        // width: width * 0.80,
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
        width: '100%',
        height: '100%',
        borderRadius: 10,
        overflow: 'hidden',
    },
    fitImageView: {
        width: '100%',
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
