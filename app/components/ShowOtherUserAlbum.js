import React, { Component, Fragment } from 'react'
import {
    View,
    FlatList,
    TouchableOpacity,
    Image,
    Text,
    Dimensions,
    Alert,
    ScrollView,
    Platform,
    SafeAreaView,
    Modal,
    TextInput
} from 'react-native'

import { ImageCompressor } from './ImageCompressorClass'
import { Colors } from "../consts/Colors";
import * as Global from "../consts/Global";
import WebService from "../core/WebService";
import ProgressIndicator from "./ProgressIndicator";
import { stylesGlobal, STICKY_HEADER_HEIGHT } from '../consts/StyleSheet'
import { Constants } from '../consts/Constants';
import Memory from '../core/Memory';
import BannerView from "../customview/BannerView";
import CustomPopupView from "../customview/CustomPopupView"
import AsyncStorage from '@react-native-community/async-storage';
var TAG = "ShowOtherUserAlbum";
export default class ShowOtherUserAlbum extends Component {

    constructor(props) {
        super(props);
        this.state = {
            loading: false,
            dataSource: [],
            is_editable: 0,
            is_portrait: true,
            show_send_coin: false,
            selected_album: null,
            showModel: false,
            userImageName: '',
            userImagePath: '',

        }
    }

    UNSAFE_componentWillMount() {
        this.clearStateData();
        this.getData();


        this.callGetAlbumAPI();
        if (Dimensions.get("window").width < Dimensions.get("window").height) {
            this.setState({
                is_portrait: true,
            })
        } else {
            this.setState({
                is_portrait: false,
            })
        }

        Dimensions.addEventListener("change", () => {
            if (Dimensions.get("window").width < Dimensions.get("window").height) {
                this.setState({
                    is_portrait: true,
                })
            } else {
                this.setState({
                    is_portrait: false,
                })
            }
        })
    }


    clearStateData = () => {
        this.setState({
            loading: false,
            dataSource: [],
            is_editable: 0,
            is_portrait: true,
            show_send_coin: false,
            selected_album: null,
            showModel: false,
            userImageName: '',
            userImagePath: '',
            userCoins: 0.

        });
    }

    getData = async () => {
        try {
            
            var userImagePath = await AsyncStorage.getItem(Constants.KEY_USER_IMAGE_URL);
            var userImageName = await AsyncStorage.getItem(Constants.KEY_USER_IMAGE_NAME);

            var userId = await AsyncStorage.getItem(Constants.KEY_USER_ID);
            var userToken = await AsyncStorage.getItem(Constants.KEY_USER_TOKEN);
            var member_plan = await AsyncStorage.getItem(Constants.KEY_MEMBER_PLAN);
            var userSlug = await AsyncStorage.getItem(Constants.KEY_USER_SLUG);
            var userCoin = await AsyncStorage.getItem(Constants.KEY_GOLD_COINS);

          
          

        
            this.setState({
               
                userImageName: userImageName,
                userImagePath: userImagePath,
                userId: userId,
                userToken: userToken,
                userSlug: userSlug,
            
                member_plan: member_plan,
                userCoins: Number(userCoin)

              
            });


            this.callGetProfileInfoAPI();
        } catch (error) {

        }
        
    };

     /*
     * call get profile list
     */
    callGetProfileInfoAPI = async () => {
        try {
            let uri = Memory().env == "LIVE" ? Global.URL_GET_PROFILE_INFO : Global.URL_GET_PROFILE_INFO_DEV;
            let params = new FormData();
            params.append("token", this.state.userToken);
            params.append("user_id", this.state.userId);
            params.append("format", "json");
            console.log(TAG + " callGetProfileInfoAPI uri " + uri);
            console.log(TAG + " callGetProfileInfoAPI params " + JSON.stringify(params));
            WebService.callServicePost(uri, params, this.handleProfileInfoResponse );
        } catch (error) {
            console.log(TAG + " callGetProfileInfoAPI error " + error);
        }
    };

    /**
    * handle profile info API response
    */
    handleProfileInfoResponse = (response, isError) => {
        //console.log(TAG + " callGetProfileInfoAPI Response " + JSON.stringify(response));
        console.log(TAG + " isError " + isError);
        if (!isError) {
            var result = response;
            if (typeof result != undefined && result != null) {
                if (typeof result.data != undefined && result.data != null) {
                    var mData = result.data;
                    profileInfo = mData;
                    // console.log(profileInfo.userCustomFields.languages_known);
                    if (typeof mData.customFields != undefined && mData.customFields != null) {
                        customFieldsData = mData.customFields;
                        // console.log(TAG + " profileInfo " + JSON.stringify(profileInfo));
                        // console.log(profileInfo)
                    }
                    if (typeof mData.profileData != undefined && mData.profileData != null) {

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
    };



    componentWillUnmount() {
        Dimensions.removeEventListener('change');
    }

    /**
     * call Get Schedule API
     */
    callGetAlbumAPI = async () => {
        try {
            let uri = Memory().env == "LIVE" ? Global.URL_GET_ALBUM + '/' + this.props.route.params.slug : Global.URL_GET_ALBUM_DEV + '/' + this.props.route.params.slug
            let params = new FormData();
            this.setState({ loading: true });
            params.append("token", this.props.route.params.userToken);
            params.append("user_id", this.props.route.params.userId);
            params.append("format", "json");
            console.log(TAG + " callGetAlbumAPI uri " + uri);
            console.log(TAG + " callGetAlbumAPI params " + JSON.stringify(params));
            WebService.callServicePost(uri, params, this.handleGetAlbumResponse);
        } catch (error) {
            this.setState({
                loading: false
            });
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    };
    /**
     * Handle Get Schedule API
     */
    handleGetAlbumResponse = (response, isError) => {
        console.log(TAG + " handleGetAlbumResponse Response " + JSON.stringify(response));
        console.log(TAG + " handleGetAlbumResponse isError " + isError);

        if (!isError) {
            let result = response;
            if (result != undefined && result != null) {
                if (result.data != undefined && result.data != null) {
                    if (result.data.albumList != undefined && result.data.albumList != null) {
                        this.setState({ dataSource: result.data.albumList, is_editable: result.data.isEditable });
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
    };

    /**
     * call album request access API
     */
    callAlbumRequestAccessAPI = async (albumId) => {
        try {
            this.setState({ loading: true });
            let uri = Memory().env == "LIVE" ? Global.URL_REQUEST_ALBUMS : Global.URL_REQUEST_ALBUMS_DEV
            // let params = new FormData();
            // params.append("token", this.props.route.params.userToken);
            // params.append("user_id", this.props.route.params.userId);
            // params.append("format", "json");
            // params.append("albums", albumId);

            const params = {
                'token' : this.props.route.params.userToken,
                'user_id' : this.props.route.params.userId,
                'format' : 'json',
                'albums' : albumId
            }
            console.log(TAG + " callAlbumRequestAccessAPI uri " + uri);
            console.log(TAG + " callAlbumRequestAccessAPI params " + JSON.stringify(params));
            WebService.callServicePost(uri, params, this.handleAlbumRequestAccessResponse);
        } catch (error) {
            this.setState({ loading: false });
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    };

    /**
     * Handle album requst access API
     */
    handleAlbumRequestAccessResponse = (response, isError) => {
        console.log(TAG + " Response " + response);
        console.log(TAG + " isError " + isError);

        if (!isError) {
            var result = response;

            if (result != undefined && result != null) {
                console.log(TAG + " callAlbumRequestAccessAPI result " + JSON.stringify(result));



                this.callGetAlbumAPI();
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

    send_gold_action(action, album) {
        // console.log("album", album, this.props.route.params);
        this.setState({ show_fee_success_dlg: false });
        if (action == "Send") {
            this.sendGoldToAccessAlbumApi(album);
        } else if (action == "Buy Gold") {
            //this.props.navigation.navigate('Dashboard', { selected_screen: "myaccount", myaccount_initial_tab: "buy_goldcoin"})
            this.props.navigation.navigate('Dashboard', { selected_screen: "myaccount", myaccount_initial_tab: "buy_goldcoin" })
        }
    }

    sendGoldToAccessAlbumApi = async (album) => {
        try {
            this.setState({ loading: true });
            let uri = Memory().env == "LIVE" ? Global.URL_SEND_GOLD_TO_OTHER_ALBUM : Global.URL_SEND_GOLD_TO_OTHER_ALBUM_DEV
            let params = new FormData();
            params.append("token", this.props.route.params.userToken);
            params.append("user_id", this.props.route.params.userId);
            params.append("format", "json");
            params.append("slug", this.props.route.params.slug);
            params.append("num_of_coins", album.access.access_coin);
            params.append("accessId", album.access.id);
            console.log(TAG + " sendGoldToAccessAlbumApi uri " + uri);
            console.log(TAG + " sendGoldToAccessAlbumApi params " + JSON.stringify(params));
            WebService.callServicePost(uri, params, this.handleSendGoldToAccessAlbumResponse
            );
        } catch (error) {
            this.setState({ loading: false, show_send_coin: false });
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    };

    /**
     * Handle album requst access API
     */
    handleSendGoldToAccessAlbumResponse = async (response, isError) => {
        console.log(TAG + " Response " + response);
        console.log(TAG + " isError " + isError);
        let success_flag = false;
        if (!isError) {
            var result = response;
            if (result != undefined && result != null) {
                console.log(TAG + " handleSendGoldToAccessAlbumResponse result " + JSON.stringify(result));
                if (result.status) {
                    await this.callGetAlbumAPI();
                    success_flag = true;
                }
            }
        }
        if (!success_flag) {
            if (response != undefined && response != null && response.length > 0) {
                Alert.alert(response.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
        this.setState({ loading: false, show_send_coin: false });
    };

    render() {
        return (
            <Fragment>
                <SafeAreaView style={{ flex: 0, backgroundColor: Colors.black }} />
                <SafeAreaView style={{ flex: 1, backgroundColor: Colors.white }}>
                    {
                        this.state.show_send_coin && this.renderSendGoldCoin()
                    }
                    {this.renderHeaderView()}
                    {this.renderBannerView()}
                    {this.renderPopupView()}
                    {this.state.loading == false && this.renderMainView()}
                    {this.state.loading == true && <ProgressIndicator />}
                </SafeAreaView>
            </Fragment>
        );
    }



    renderSendGoldCoin() {
        let album = this.state.selected_album;
        return (
            <Modal
                animationType="fade"
                transparent={true}
                visible={this.state.show_send_coin}
                onRequestClose={() => this.setState({ show_send_coin: false })}
                supportedOrientations={['portrait', 'landscape']}
            >
                <View style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' }}>
                    <View style={stylesGlobal.popup_bg_blur_view}></View>
                    <View style={stylesGlobal.popup_main_container}>
                        <View style={stylesGlobal.popup_title_view}>
                            <Text style={[stylesGlobal.popup_title_text, stylesGlobal.font]}>{"Send Gold"}</Text>
                            <View style={{ flexDirection: 'row' }}>
                                <TouchableOpacity style={stylesGlobal.popup_cancel_button} onPress={() => {
                                    this.setState({ show_send_coin: false });
                                }}>
                                    <Image style={stylesGlobal.cancel_delete_image} source={require("../icons/connection-delete.png")} />
                                </TouchableOpacity>
                            </View>
                        </View>
                        <View style={[stylesGlobal.popup_desc_container]}>
                            <Text style={[stylesGlobal.popup_button_text, stylesGlobal.font, { color: Colors.black }]}>{"Your album access has been granted!. Process for "}{`${album.access.access_coin.toString()}`}{" gold coins per month?"}</Text>
                        </View>
                        <View style={stylesGlobal.popup_button_container}>
                            
                            {
                                this.state.userCoins >= album.access.access_coin ? 
                                    <TouchableOpacity style={[stylesGlobal.common_button, stylesGlobal.shadow_style]} onPress={() => { this.send_gold_action("Send", album) }}>
                                        <Text style={[stylesGlobal.popup_button_text, stylesGlobal.font]}>{"Send Gold"}</Text>
                                    </TouchableOpacity>
                                :
                                    <TouchableOpacity style={[stylesGlobal.common_button, stylesGlobal.shadow_style, { marginLeft: 5 }]} onPress={() => { this.send_gold_action("Buy Gold", album); }}>
                                        <Text style={[stylesGlobal.popup_button_text, stylesGlobal.font]}>{"Buy Gold"}</Text>
                                    </TouchableOpacity>
                                }
                            
                        </View>
                    </View>
                </View>
            </Modal>
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

    /**
    * diplay top header
    */
    renderHeaderView = () => {
//         return (
//             <View style={stylesGlobal.headerView}>
//                 <TouchableOpacity style={stylesGlobal.header_backbuttonview_style} onPress={() => this.props.navigation.goBack()}>
//                     <Image style={stylesGlobal.header_backbuttonicon_style} source={require("../icons/icon_back.png")} />
//                 </TouchableOpacity>
//             </View>
// 
//         );

        let imageUrl = this.props.route.params.avatarUrl;
        

        return (
            <View style={[stylesGlobal.headerView]}>
                <TouchableOpacity style={stylesGlobal.header_backbuttonview_style} onPress={() => {
                    if (this.props.route.params.refreshFavorite != undefined) {
                        this.props.route.params.refreshFavorite(this.state.isMyFav);
                    }
                    this.props.navigation.goBack();
                }}
                >
                    <Image style={stylesGlobal.header_backbuttonicon_style} source={require("../icons/icon_back.png")} />
                </TouchableOpacity>
                <TouchableOpacity style={stylesGlobal.header_logoview_style} onPress={() => this.props.navigation.navigate('Dashboard', { logoclick: true })}>
                    <Image
                        style={stylesGlobal.header_logo_style}
                        source={require("../icons/logo_new.png")}
                    />
                </TouchableOpacity>
                <View style={stylesGlobal.header_searchview_style}>
                    <TextInput
                        ref="searchTextInput"
                        autoCorrect={false}
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
                    <TouchableOpacity style={stylesGlobal.header_searchiconview_style} onPress={() => {
                        if (this.state.searchText == "") {
                            this.refs.searchTextInput.focus();
                        } else {
                            Keyboard.dismiss();
                            this.setState({
                                searchText: ""
                            })
                        }
                    }}
                    >
                        {
                            this.state.searchText != "" &&
                            <Image
                                style={stylesGlobal.header_searchicon_style}
                                source={require("../icons/connection-delete.png")}
                            />
                        }
                        {
                            this.state.searchText == "" &&
                            <Image
                                style={stylesGlobal.header_searchicon_style}
                                source={require("../icons/dashboard_search.png")}
                            />
                        }
                    </TouchableOpacity>
                </View>
                <TouchableOpacity style={stylesGlobal.header_avatarview_style} onPress={() => this.showPopupView()}>
                    <View style={stylesGlobal.header_avatarsubview_style}>
                        <ImageCompressor style={stylesGlobal.header_avatar_style} uri={imageUrl} />
                    </View>
                </TouchableOpacity>
            </View>
        );
    };

    showPopupView = () => {
        this.setState({
            showModel: true
        })
    }
    hidePopupView = () => {
        this.setState({
            showModel: false
        })
    }
    logoutUser = async () => {
        this.hidePopupView()
        try {
            await AsyncStorage.setItem(Constants.KEY_USER_ID, "");
            await AsyncStorage.setItem(Constants.KEY_USER_TOKEN, "");
            this.props.navigation.navigate("SignInScreen", { isGettingData: false });
        } catch (error) {
            console.log(TAG + " logoutUser error " + error);
        }
    }

     renderPopupView = () => {
        return (
            <CustomPopupView
                showModel={this.state.showModel}
                openMyAccountScreen={(show_myaccount, myaccount_initial_tab) => { this.props.navigation.navigate('Dashboard', { selected_screen: "myaccount", myaccount_initial_tab: myaccount_initial_tab }) }}
                logoutUser={this.logoutUser}
                closeDialog={() => { this.setState({ showModel: false }) }}
                prop_navigation={this.props.navigation}
            >

            </CustomPopupView>
        );
    }

    renderBannerView = () => {
        return (
            <BannerView screenProps={this.props.navigation} />
        )
    }

    renderMainView = () => {
        return (
            <View style={{ flex: 1 }}>
                <FlatList
                    style={{ width: '100%', }}
                    columnWrapperStyle={{ width: '100%' }}
                    extraData={this.state}
                    numColumns={this.state.is_portrait ? 3 : 5}
                    key={this.state.is_portrait ? 3 : 5}
                    keyExtractor={(item, index) => index.toString()}
                    data={this.state.dataSource}
                    renderItem={({ item }) => {
                        return (
                            <View style={{ alignItems: 'center', justifyContent: 'center', width: this.state.is_portrait ? '33%' : '20%', aspectRatio: 1 }}>
                                {this.renderAlbumItem(item)}
                            </View>
                        )
                    }}
                />
            </View>
        );
    }
    /**
     * diplay album row data
     */
    renderAlbumItem = (data) => {
        // console.log(data.access, " : showotheruseralbum renderAlbumItem ---+++ ");

        console.log('data = ', data);

        if (!data) {
            return null;
        }
        var url = '';
        // var isPrivate = (data.visibility.toString() !== Global.visibility_invitee.toString());
        let isPrivate = (data.visibility.toString() === Global.visibility_private.toString());
        if (data.imgpath != null && data.filename != null) {
            // url = data.imgpath + Constants.THUMB_FOLDER + data.filename;
            url = data.imgpath + data.filename;
        }
        let request_button_text = "Request Access";
        // if (isPrivate && data.access != null && data.access != undefined) {
        //     if (data.access.status == 0) {
        //         request_button_text = "Cancel";
        //     } else if (data.access.status == 1) {
        //         if (data.access.paid == null) {
        //             request_button_text = "Send Gold Coin";
        //         } else if (data.access.paid) {
        //             isPrivate = false;
        //         }
        //     }
        // }


        var is_hidden = data.is_hidden && !this.state.is_editable && !data.is_access;
        if(data.is_hidden && data.access.status == 1)
            is_hidden = is_hidden && data.access.access_coin
        // && value.access.access_coin;
        var access_id = undefined;
        if(data.access){
           access_id = data.access.id;
        }
        if(data.status && !data.is_paid)
        {
            request_button_text = "Send Gold Coin";
        } else if(access_id) {
            
            request_button_text = "Request Sent";
        }


        

        var accessCoin = 0;
        if(data.access)
            accessCoin = data.access.access_coin ? Number(data.access.access_coin) : 0;
    

        return (
            <TouchableOpacity style={styles.containerRow}
                onPress={() => {
                    if (!is_hidden) {
                        this.props.navigation.navigate('ShowOtherUserAlbumImages', {
                            userId: this.props.route.params.userId,
                            userToken: this.props.route.params.userToken,
                            id: this.props.route.params.id,
                            slug: this.props.route.params.slug,
                            albumData: data
                        })
                    } else {
                        //Alert.alert('No Access Available')
                    }
                }}>
                <View style={styles.image}>
                    <ImageCompressor style={styles.image} uri={url} />
                </View>
                {
                    (is_hidden) && 
                    (<>
                        <View style={styles.blurView}>
                            <TouchableOpacity style={styles.emptyAddView}
                                onPress={() => {
                                    if (request_button_text == "Request Access") {
                                        this.callAlbumRequestAccessAPI(data.id);
                                    } else if (request_button_text == "Cancel") {
                                        // Cancel request access
                                    } else if (request_button_text == "Send Gold Coin") {
                                        this.setState({
                                            show_send_coin: true,
                                            selected_album: data,
                                        })
                                    }
                                }}
                            >
                                <Text style={[styles.emptyAddText, stylesGlobal.font]}>{request_button_text}</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.titleView}>
                            <Text style={[{ color: Colors.white }, stylesGlobal.font]} numberOfLines={1}>{data.album_name}</Text>
                        </View>
                    </>
                    )
                }
                
            </TouchableOpacity>
        );

    }
}

const styles = {
    container: {
        backgroundColor: Colors.black,
        flex: 1,
    },
    containerRow: {
        width: '100%',
        aspectRatio: 1,
        padding: 2
    },
    image: {
        width: '100%',
        height: '100%',
    },
    blurView: {
        width: '100%',
        height: '100%',
        backgroundColor: Colors.green,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'absolute',
        top: 0,
        left: 0,
        opacity: 0.90,
    },
    emptyAddView: {
        backgroundColor: Colors.gold,
        padding: 5,
        borderRadius: 5,
        width: 90
    },
    emptyAddText: {
        fontSize: 10,
        textAlign: 'center',
        color: Colors.black
    },
    titleView: {
        justifyContent: 'flex-start',
        backgroundColor: Colors.black,
        position: 'absolute',
        bottom: 0,
        left: 2,
        padding: 2,
        opacity: 0.80,
        width: '100%',
    },
    blurView: {
        width: '100%',
        height: '100%',
        backgroundColor: Colors.white,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'absolute',
        top: 0,
        left: 0,
        opacity: 0.90,
    },
}
