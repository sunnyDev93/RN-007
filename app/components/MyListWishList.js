import React, { Component } from "react";
import {
    Alert,
    StyleSheet,
    SafeAreaView,
    View,
    TouchableOpacity,
    ScrollView,
    Text,
    Dimensions,
    Image,
    TextInput,
    FlatList,
    Keyboard,
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

var TAG = "MyListWishList";

export default class MyListWishList extends React.Component {

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
            loading: true,
            more_load: false,
            more_load_person: false,
            gift_senderlist_page_number: 1,
            gift_sender_person_list: [],

            member_list: [],
            total_length: 0,
            viewall_page_number: 0,
            send_gift_modal_show: false,
            selected_send_gift_index: [],

            selected_fav_gift_index: -1,
            is_portrait: true,
            screen_height: Dimensions.get("window").height,
        }

        this.onEndReachedCalledDuringMomentumGift = true;
        this.onEndReachedCalledDuringMomentumUser = true;

    }

    UNSAFE_componentWillMount() {
        this.getData();

        if(Dimensions.get("window").width < Dimensions.get("window").height) {
            this.setState({
                is_portrait: true,
                screen_height: Dimensions.get("window").height,
            })
        } else {
            this.setState({
                is_portrait: false,
                screen_height: Dimensions.get("window").width,
            })
        }

        Dimensions.addEventListener("change", () => {
            if(Dimensions.get("window").width < Dimensions.get("window").height) {
                this.setState({
                    is_portrait: true,
                    screen_height: Dimensions.get("window").height,
                })
            } else {
                this.setState({
                    is_portrait: false,
                    screen_height: Dimensions.get("window").width,
                })
            }
        })
    }

    componentWillUnmount() {
        Dimensions.removeEventListener('change');
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

            }, () => this.getMywishList());
        } catch (error) {
            // Error retrieving data
        }

    };

    getMywishList = async() => {
        try {
            this.setState({
                loading: true
            });
            var uri = Memory().env == "LIVE" ? Global.BASE_URL + this.state.userSlug + "/wishlist-items/" + this.state.viewall_page_number : Global.BASE_URL_DEV + this.state.userSlug + "/wishlist-items/" + this.state.viewall_page_number;

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
        console.log(TAG + " callWishListAPI isError " + isError);
        if (!isError) {
            try {
                var result = response;
                if (typeof result != "undefined" && result != undefined && result != null) {
                    if(result.data == null) {
                        return
                    }
                    if(result.data.products == null) {
                        return
                    }
                    if(result.data.products.length > 0) {
                        this.setState({
                            member_list: [...this.state.member_list, ...result.data.products],
                        });
                        if(result.data.length > 0) {
                            this.setState({
                                more_load: true,
                                viewall_page_number: this.state.viewall_page_number + 1
                            })
                        } else {
                            this.setState({
                                more_load: false
                            })
                        }
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
        this.setState({
            // send_gift_modal_show: true,
            selected_send_gift_index: index
        })
        this.search_giftsent_person();
    }

    buyButtonAction(index) {
        this.props.screenProps.navigate("GiftBuy", {selected_gift: this.state.member_list[index]})
    }

    close_sender_modal() {
        this.setState({
            send_gift_modal_show: false,
            sender_gift_search_text: '',
            person_list: []
        })
    }

    _renderGiftSendPersonItem = ({item, index})=>{
        let imagURL = item.imgpath + Constants.THUMB_FOLDER + item.filename;
        return(
            <TouchableOpacity style = {[{width: '100%', height: 80, alignItems: 'center', flexDirection: "row"}, item.selected ? {backgroundColor: Colors.gold} : null]}
                onPress = {() => this.select_person(index)}    
            >
                <View style={{height: '100%', aspectRatio: 1, marginLeft: 10, justifyContent: 'center', alignItems: 'center'}}>
                    <ImageCompressor style={{width: 70, height: 70, borderRadius: 5, overflow: 'hidden'}} uri={imagURL}/>
                </View>
                <Text style = {[{fontSize: 16, marginLeft: 10}, stylesGlobal.font, item.selected ? {color: Colors.white} : {color: Colors.black}]}>{item.first_name} {item.last_name}</Text>
            </TouchableOpacity>
        )
    }

    search_giftsent_person = async() => {
        Keyboard.dismiss();
        if(this.state.loading) {
            return;
        }
        try {
            this.setState({
                loading: true
            });
            let uri = Memory().env == "LIVE" ? Global.URL_SEARCH + this.state.gift_senderlist_page_number : Global.URL_SEARCH_DEV + this.state.gift_senderlist_page_number;
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
                page: this.state.gift_senderlist_page_number,
                keyword: this.state.sender_gift_search_text
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
        console.log(TAG + " callsearchpersonAPI isError " + isError);
        console.log(TAG + " callsearchpersonAPI result " + JSON.stringify(response));
        if (!isError) {
            try {
                var result = response;
                if (typeof result != "undefined" && result != undefined && result != null) {
                    if(result.status == "success") {
                        var gift_sender_person_list = this.state.gift_sender_person_list;
                        var person_list_response = result.data.result;
                        if(person_list_response.length > 0) {
                            for(i = 0; i < person_list_response.length; i ++) {
                                person_list_response[i].selected = false;
                                var exist = false;
                                for(j = 0; j < gift_sender_person_list.length; j ++) {
                                    if(person_list_response[i].user_id == gift_sender_person_list[j].user_id) {
                                        exist = true;
                                        break;
                                    }
                                }
                                if(!exist) {
                                    gift_sender_person_list.push(person_list_response[i])
                                }
                            }
                            
                            this.setState({
                                gift_sender_person_list: gift_sender_person_list,
                                gift_senderlist_page_number: this.state.gift_senderlist_page_number + 1,
                            })
                        } else {
                            this.setState({
                                more_load_person: false
                            })
                        }
                        this.setState({
                            send_gift_modal_show: true,
                        })
                    }
                }
            } catch (error) {
                console.log(error)
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
        var gift_sender_person_list = this.state.gift_sender_person_list;
        for(i = 0; i < gift_sender_person_list.length; i ++) {
            if(i == index) {
                gift_sender_person_list[i].selected = true;
            } else {
                gift_sender_person_list[i].selected = false;
            }
        }
        this.setState({
            gift_sender_person_list: gift_sender_person_list
        })
    }

    checkoutButtonAction() {
        var receiver = null;
        var gift_sender_person_list = this.state.gift_sender_person_list;
        for(i = 0; i < gift_sender_person_list.length; i ++) {
            if(gift_sender_person_list[i].selected) {
                receiver = gift_sender_person_list[i];
            }
        }
        if(receiver == null) {
            Alert.alert(Constants.SELECT_GIFT_RECEIVER, "");
            return;
        }
        this.setState({
            send_gift_modal_show: false
        })
        this.props.screenProps.navigate("GiftSend", {selected_gift: this.state.member_list[this.state.selected_send_gift_index], numberofgift: 1, receiver: receiver})

    }

    isCloseToBottom = ({layoutMeasurement, contentOffset, contentSize}) => {
        const paddingToBottom = 10;
        return layoutMeasurement.height + contentOffset.y >=
          contentSize.height - paddingToBottom;
    };

    isCloseToTop = ({layoutMeasurement, contentOffset, contentSize}) => {
        const paddingToBottom = 10;
        return contentOffset.y <= -10
    };

    gift_detail(item) {
        var gift_item = {
            "id": item.vg_product_id,
            "title": item.title,
            "image_path": item.image_path,
            "image_name": item.image_name,
            "gold_coin": item.gold_coin,
            "type": "0",
            "status": "1",
            "slug": "",
            "wishlist_id": ""
        }
        this.props.screenProps.navigate("GiftDetail", {item: gift_item, numberofgift: 1, receiver: null, src_screen: "mygift"});
    }

    like_wishlist_gift = async(index) => {
        try {
            this.setState({
                loading: true
            });
            let uri = Memory().env == "LIVE" ? Global.URL_GIFT_FAVORITE : Global.URL_GIFT_FAVORITE_DEV;

            let params = new FormData();
            params.append("token", this.state.userToken);
            params.append("user_id", this.state.userId);
            params.append("format", "json");
            params.append("product_id", this.state.member_list[index].id);
            if(this.state.member_list[index].wishlist_id == null) {
                params.append("type", "add");
            } else {
                params.append("type", "remove");
            }

            console.log(TAG + " callgiftfavoriteAPI uri " + uri);
            console.log(TAG + " callgiftfavoriteAPI params " + JSON.stringify(params));
            this.setState({
                selected_fav_gift_index: index
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
                        if(this.state.selected_fav_gift_index != -1) {
                            var member_list = this.state.member_list;
                            member_list.splice(this.state.selected_fav_gift_index, 1);
                            this.setState({
                                member_list: member_list,
                                selected_fav_gift_index: -1
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

    _renderMyWishListItem = (item, index) => {
        var imageUrl = item.image_path + item.image_name;
        return(
            <TouchableOpacity style={[stylesGlobal.cardView, {padding: 10}]} onPress = {() => {
                this.props.screenProps.navigate("GiftDetail", {item: item, numberofgift: 1, receiver: null})
            }}>
                <View style={styles.fitImageView}>
                    <ImageCompressor style={styles.fitImage} uri={imageUrl}/>
                
                    <TouchableOpacity style = {{width: 65, height: 65, position: 'absolute', right: 0, bottom: 0, zIndex: 10}} onPress = {() => this.like_wishlist_gift(index)}>
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
                <Text style={[stylesGlobal.titleText, stylesGlobal.font]} numberOfLines={1}>
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
                <View style = {{width: '100%', marginTop: 20, justifyContent: 'center', flexDirection: 'row'}}>
                    <TouchableOpacity style = {[styles.button, stylesGlobal.shadow_style]} onPress = {() => this.sendButtonAction(index)}>
                        <Text style = {[styles.buttonText_white, stylesGlobal.font]}>{"Send"}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style = {[styles.button, stylesGlobal.shadow_style, {marginLeft: 15}]} onPress = {() => this.buyButtonAction(index)}>
                        <Text style = {[styles.buttonText_white, stylesGlobal.font]}>{"Buy"}</Text>
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        )
    }

    render() {
        return (
            <SafeAreaView style={styles.container}>
            {
                this.state.loading && <ProgressIndicator/>
            }
            { ////  send gift selection user modal
                this.state.send_gift_modal_show &&
                <View style = {{position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, zIndex: 20, alignItems: 'center', justifyContent: 'center'}}>
                    <View style = {{position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, backgroundColor: Colors.black, opacity: 0.3}}></View>
                    <View style = {{width: '90%', height: this.state.is_portrait ? '70%' : '90%', backgroundColor: Colors.white, borderRadius: 5, alignItems: 'center'}}>
                        <View style = {{width: '100%', flexDirection: 'row', alignItems: 'center', borderBottomColor: '#808080', borderBottomWidth: 0.5, padding: 10}}>
                            <View style = {{ flex: 1, flexDirection: 'row', alignItems: 'center'}}>
                                <Image style = {{width: 80, height: 50}} resizeMode = {'cover'} source = {{url: (this.state.member_list[this.state.selected_send_gift_index].image_path + this.state.member_list[this.state.selected_send_gift_index].image_name)}}></Image>
                                <View style = {{ flex: 1, justifyContent: 'space-evenly', marginLeft: 10}}>
                                    <Text style = {[{ color: Colors.black, fontSize: 14,}, stylesGlobal.font]} multiline = {true}>{"Whom would you like to gift this to?"}</Text>
                                    <View style = {{flexDirection: 'row', alignItems: 'center'}}>
                                        <Text style = {[styles.rowText, stylesGlobal.font]}>{"Value: "}</Text>
                                        <Text style = {[styles.rowText, stylesGlobal.font, {color: Colors.gold}]}>{parseInt(this.state.member_list[this.state.selected_send_gift_index].gold_coin.toString(), 10)}</Text>
                                        <Image style = {{width: 25, aspectRatio: 1, marginLeft: 5, resizeMode: 'contain'}} source={require("../icons/goldCoin10New.png")}></Image>
                                    </View>
                                </View>
                            </View>
                        {
                            !this.state.is_portrait &&
                            <View style = {{flex: 1, flexDirection: 'row', alignItems: 'center', marginLeft: 15}}>
                                <TextInput style = {[{flex: 1, height: 40, borderRadius: 5, borderColor: '#404040', borderWidth: 0.5, paddingHorizontal: 5}, stylesGlobal.font]}
                                    onChangeText = {(text) => this.setState({sender_gift_search_text: text})}
                                    placeholder = {'Search ...'}
                                    returnKeyType = {'search'}
                                    autoCorrect = {false}
                                    onSubmitEditing = {() => {
                                        this.setState({
                                            gift_senderlist_page_number: 1
                                        }, () => this.search_giftsent_person())
                                    }}
                                ></TextInput>
                                <TouchableOpacity style = {[stylesGlobal.common_button, stylesGlobal.shadow_style, {marginStart: 10}]}
                                    onPress = {() => this.checkoutButtonAction()}
                                >
                                    <Text style = {[styles.rowText, stylesGlobal.font, {color: Colors.white}]}>{"Send"}</Text>
                                </TouchableOpacity>
                            </View>
                        }
                            <View style = {{height: '100%', justifyContent: 'flex-start'}}>
                                <TouchableOpacity style = {{width: 20, height: 20, zIndex: 10, marginTop: 10, marginHorizontal: 10}} onPress = {() => this.close_sender_modal()}>
                                    <Image style = {{width: '100%', height: '100%'}} resizeMode = {'contain'} source = {require('../icons/gift_sendmodal_close.png')}/>
                                </TouchableOpacity>
                            </View>
                        </View>
                        <View style = {{flex: 1, width: '100%', borderBottomColor: '#808080', borderBottomWidth: 0.5, paddingHorizontal: 10}}>
                        {
                            this.state.is_portrait &&
                            <TextInput style = {[{width: '100%', height: 40, marginTop: 10, borderRadius: 5, borderColor: '#404040', borderWidth: 0.5, paddingLeft: 5}, stylesGlobal.font]}
                                onChangeText = {(text) => this.setState({sender_gift_search_text: text})}
                                placeholder = {'Search ...'}
                                returnKeyType = {'search'}
                                autoCorrect = {false}
                                onSubmitEditing = {() => {
                                    this.setState({
                                        gift_senderlist_page_number: 1
                                    }, () => this.search_giftsent_person())
                                }}
                            >
                                {this.state.sender_gift_search_text}
                            </TextInput>
                        }
                            <View style = {{flex: 1, width: '100%', paddingVertical: 10}}>
                                <FlatList style = {{width: '100%', height: '100%'}}
                                    extraData={this.state}
                                    // key = {this.state.person_list.length}
                                    pagingEnabled={false}
                                    showsHorizontalScrollIndicator={false}
                                    showsVerticalScrollIndicator={false}
                                    data={this.state.gift_sender_person_list}
                                    keyExtractor={(item, index) => index.toString()}
                                    numColumns = {this.state.is_portrait ? 1 : 2}
                                    key = {this.state.is_portrait ? 1 : 2}
                                    renderItem={( item, index ) => (
                                        <View key = {index} style = {{width: this.state.is_portrait ? '100%' : '50%', alignItems: 'center'}}>
                                        {
                                            this._renderGiftSendPersonItem(item, index)
                                        }
                                        </View>
                                    )}
                                    onMomentumScrollBegin={() => { this.onEndReachedCalledDuringMomentumUser = false; }}
                                    onEndReachedThreshold={0.5}
                                    onEndReached={({ distanceFromEnd }) => {
                                        if (!this.onEndReachedCalledDuringMomentumUser ) {
                                            this.onEndReachedCalledDuringMomentumUser = true;
                                            if(this.state.more_load) {
                                                this.search_giftsent_person();
                                            }
                                        }
                                    }}
                                    onScroll = {async({nativeEvent}) => {
                                        if(this.isCloseToTop(nativeEvent)) {
                                            this.setState({
                                                gift_sender_person_list: [],
                                                gift_senderlist_page_number: 1,
                                                more_load: true
                                            }, () => this.search_giftsent_person())
                                        }
                                    }}
                                    // onScroll={({nativeEvent}) => {
                                    //     if(nativeEvent.layoutMeasurement.height + nativeEvent.contentOffset.y >= nativeEvent.contentSize.height - 20) {
                                    //         if(!this.state.loading) {
                                    //             this.search_giftsent_person();
                                    //         }
                                    //     }
                                    // }}
                                />
                            </View>
                            
                        </View>
                    {
                        this.state.is_portrait &&
                        <View style = {{width: '100%', height: 60, alignItems: "flex-end", justifyContent: 'center'}}>
                            <TouchableOpacity style = {[stylesGlobal.common_button, stylesGlobal.shadow_style]}
                                onPress = {() => this.checkoutButtonAction()}
                            >
                                <Text style = {[styles.rowText, stylesGlobal.font, {color: Colors.white}]}>{"Send"}</Text>
                            </TouchableOpacity>
                        </View>
                    }
                    </View>
                </View>
            }
            {
                !this.state.loading && this.state.member_list.length == 0 &&
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <View style = {stylesGlobal.empty_cardView}>
                        <Text style={[stylesGlobal.empty_cardView_text, stylesGlobal.font, ]}>{"The Wish List is empty"}</Text>
                    </View>
                </View>
            }
            {
                this.state.member_list.length > 0 &&
                <View style={{ flex: 1, marginTop: 10 }}>
                    <FlatList
                        ListHeaderComponent = {this.state.pulldown_loading && <PullDownIndicator/>}
                        ListFooterComponent={this.state.displayLoadMoreView == true ? footerView : null}
                        extraData={this.state}
                        showsHorizontalScrollIndicator={false}
                        showsVerticalScrollIndicator={false}
                        data={this.state.member_list}
                        keyExtractor={(item, index) => index.toString()}
                        style = {{width: '100%'}}
                        numColumns = {this.state.is_portrait ? 1 : 2}
                        key = {this.state.is_portrait ? 1 : 2}
                        renderItem={({ item, index }) => (
                            <View key = {index} style = {{width: this.state.is_portrait ? '100%' : '50%', alignItems: 'center'}}>
                            {
                                this._renderMyWishListItem(item, index)
                            }
                            </View>
                        )}
                        onMomentumScrollBegin={() => { this.onEndReachedCalledDuringMomentumGift = false; }}
                        onEndReachedThreshold={0.5}
                        onEndReached={({ distanceFromEnd }) => {
                            if (!this.onEndReachedCalledDuringMomentumGift ) {
                                this.onEndReachedCalledDuringMomentumGift = true;
                                if(this.state.more_load) {
                                    this.getMywishList();
                                }
                            }
                        }}
                        onScroll = {async({nativeEvent}) => {
                            if(this.isCloseToTop(nativeEvent)) {
                                this.setState({
                                    member_list: [],
                                    viewall_page_number: 0,
                                    more_load: true
                                }, () => this.getMywishList())
                            }
                        }}
                    />
                </View>
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
        backgroundColor: Colors.black
    },
    fitImageView: {
        borderRadius: 10,
        borderColor: Colors.white,
        borderWidth: 3,
        overflow: 'hidden',
        width: '100%',
        aspectRatio: 1
    },
    fitImage: {
        borderRadius: 10,
        width: '100%',
        height: '100%',
        overflow: 'hidden',
    },
    rowText: {
        color: Colors.black,
        fontSize: 14,
        backgroundColor: Colors.transparent
    },
    button: {
        paddingVertical: 10,
        paddingHorizontal: 15,
        backgroundColor: Colors.gold,
        borderRadius: 5,
    },
    buttonText: {
        color: Colors.black,
        fontSize: 14,
    },
    buttonText_white: {
        color: Colors.white,
        fontSize: 14,
    },
    labelIcon: {
        width: 25,
        height: 25,
        resizeMode: 'contain',
        marginRight: 5,
        marginLeft: 5,
    },
});
