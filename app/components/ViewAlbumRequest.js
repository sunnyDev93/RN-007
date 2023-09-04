import React, { Component } from "react";
import {
    Alert,
    StyleSheet,
    SafeAreaView,
    View,
    TouchableOpacity,
    Text,
    ScrollView,
    Modal,
    Image,
    TextInput,
    Platform,
} from "react-native";

import { ImageCompressor } from './ImageCompressorClass'
import { Colors } from "../consts/Colors";
import { Constants } from "../consts/Constants";
import { stylesGlobal, STICKY_HEADER_HEIGHT } from '../consts/StyleSheet'
import Memory from '../core/Memory';
import * as Global from "../consts/Global";
import WebService from "../core/WebService";
import ProgressIndicator from "./ProgressIndicator";
import Moment from "moment/moment";
import AsyncStorage from '@react-native-community/async-storage';


var TAG = "ViewAlbumRequest";
var isFirsTime = true;

export default class ViewAlbumRequest extends React.Component {

    constructor(props) {
        isFirsTime = true;
        super(props)

        this.state = {
            userId: "",
            userToken: "",
            userSlug: "",
            userImagePath: "",
            userImageName: "",
            member_plan: "",
            is_verified: "",
            page_number: 0,
            album_request_list: [],
            selected_request: null,
            more_load: true,

            show_setFee_dlg: true,
            charge_amount: "",
            coin_amount_error: false,
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

            }, () => this.getAlbumRequest());
        } catch (error) {
            // Error retrieving data
        }

    };

    getAlbumRequest() {
        try {
            this.setState({
                loading: true
            });

            let uri = Memory().env == "LIVE" ? Global.URL_GET_ALBUMREQUEST + this.state.page_number : Global.URL_GET_ALBUMREQUEST_DEV + this.state.page_number;
            let params = new FormData();
            params.append("token", this.state.userToken);
            params.append("user_id", this.state.userId);
            params.append("format", "json");
            console.log(TAG + " callGetAlbumRequest uri " + uri);
            console.log(TAG + " callGetAlbumRequest params " + JSON.stringify(params));
            WebService.callServicePost(uri, params, this.handleGetAlbumRequest);
        } catch (error) {
            console.log(TAG + " callGetAlbumRequest error " + error);
            this.setState({
                loading: false
            });
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    }

    handleGetAlbumRequest = (response, isError) => {
        // console.log(TAG + " callGetAlbumRequest Response " + JSON.stringify(response));
        console.log(TAG + " callGetAlbumRequest isError " + isError);
        if (!isError) {
            var result = response;
            if (result != undefined && result != null) {
                if (result.status == "success") {
                    let current_requests = [];
                    let other_requests = [];
                    this.setState({ album_request_list: [] });
                    for (i = 0; i < result.data.length; i++) {
                        result.data[i].profile_image_path = result.data[i].imgpath + Constants.THUMB_FOLDER + result.data[i].filename;
                        if (result.data[i].user_id == this.state.userId) {
                            current_requests.push(result.data[i]);
                        } else {
                            other_requests.push(result.data[i]);
                        }
                    }
                    this.setState({
                        album_request_list: [...this.state.album_request_list, ...other_requests],
                        page_number: this.state.page_number + 1
                    });
                    this.setState({ album_request_list: [...this.state.album_request_list, ...current_requests] });
                    if (result.data.length < 12) {
                        this.setState({
                            more_load: false
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
            loading: false
        });
    }

    refreshProfileImage() {

    }

    goto_profile(item) {
        if (item.user_id == this.state.userId) {
            this.props.screenProps.navigate("MyProfile", {
                refreshProfileImage: this.refreshProfileImage
            });
        } else {
            this.props.screenProps.navigate("ProfileDetail", {
                slug: item.slug
            })
        }
    }

    action_request = (item, type) => {
        try {
            this.setState({ coin_amount_error: false, loading: true, selected_request: item });
            let uri = Memory().env == "LIVE" ? Global.URL_ALBUM_REQUEST_ACTION : Global.URL_ALBUM_REQUEST_ACTION_DEV;
            let params = new FormData();
            params.append("token", this.state.userToken);
            params.append("user_id", this.state.userId);
            params.append("format", "json");
            if (type == "reject") {
                params.append("access_coin", "0");
                params.append("type", "reject");
            } else {
                params.append("type", "accept");
                params.append("access_coin", this.state.charge_amount);
            }
            params.append("id", item.id);
            params.append("req_user_id", item.user_id);
            params.append("albums", item.album_id);
            console.log(TAG + " callAlbumRequest uri " + uri);
            console.log(TAG + " callAlbumRequest params " + JSON.stringify(params));
            WebService.callServicePost(uri, params, this.handleAlbumRequest);
        } catch (error) {
            console.log(TAG + " callAlbumRequest error " + error);
            this.setState({ loading: false });
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    }

    handleAlbumRequest = (response, isError) => {
        console.log(TAG + " callAlbumRequest Response " + JSON.stringify(response));
        console.log(TAG + " callAlbumRequest isError " + isError);
        if (!isError) {
            var result = response;
            if (result != undefined && result != null) {
                if (result.status == "success") {
                    this.setState({
                        show_setFee_dlg: false,
                        show_fee_success_dlg: false,
                    })
                    this.getAlbumRequest();
                    // if (this.state.selected_request != null) {
                    //     var album_request_list = this.state.album_request_list;
                    //     for (i = 0; i < album_request_list.length; i++) {
                    //         if (album_request_list[i].id == this.state.selected_request.id) {
                    //             album_request_list.splice(i, 1);
                    //             break;
                    //         }
                    //     }
                    //     this.setState({
                    //         album_request_list: album_request_list,
                    //         show_setFee_dlg: false,
                    //         show_fee_success_dlg: true,
                    //     })
                    // }
                }
            }
        } else {
            if (response != undefined && response != null && response.length > 0) {
                Alert.alert(response.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
        this.setState({ loading: false });
    }

    isCloseToBottom = ({ layoutMeasurement, contentOffset, contentSize }) => {
        const paddingToBottom = 10;
        return layoutMeasurement.height + contentOffset.y >=
            contentSize.height - paddingToBottom;
    };

    isCloseToTop = ({ layoutMeasurement, contentOffset, contentSize }) => {
        return contentOffset.y <= -10
    };

    scrollToTop() {
        if (this._scrollView) {
            this._scrollView.scrollTo({ x: 0, y: 0, animated: true })
        }
    }

    clear_fee_states() {
        this.setState({
            charge_amount: ""
        })
    }

    renderFeeSuccessDlg() {
        let item = this.state.selected_request;
        return (
            <Modal
                animationType="fade"
                transparent={true}
                visible={this.state.show_fee_success_dlg}
                onRequestClose={() => this.setState({ show_fee_success_dlg: false })}
                supportedOrientations={['portrait', 'landscape']}
            >
                <View style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' }}>
                    <View style={stylesGlobal.popup_bg_blur_view}></View>
                    <View style={stylesGlobal.popup_main_container}>
                        <View style={stylesGlobal.popup_title_view}>
                            <Text style={[stylesGlobal.popup_title_text, stylesGlobal.font]}>You granted {item.first_name} {item.last_name} access to ${item.album_name}album{parseInt(this.state.charge_amount) == 0 ? "." : `for ${this.state.charge_amount} Gold Coin${parseInt(this.state.charge_amount) > 1 ? "s" : ""} per month.`}</Text>
                            <View style={{ flexDirection: 'row' }}>
                                <TouchableOpacity style={stylesGlobal.popup_cancel_button} onPress={() => {
                                    this.setState({ show_fee_success_dlg: false }); this.clear_fee_states();
                                }}>
                                    <Image style={stylesGlobal.cancel_delete_image} source={require("../icons/connection-delete.png")} />
                                </TouchableOpacity>
                            </View>
                        </View>
                        <View style={stylesGlobal.popup_button_container}>
                            <TouchableOpacity style={[stylesGlobal.common_button, stylesGlobal.shadow_style]} onPress={() => { this.setState({ show_fee_success_dlg: false }); this.clear_fee_states(); }}>
                                <Text style={[stylesGlobal.popup_button_text, stylesGlobal.font]}>{"OK"}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        )
    }

    renderSetFeeDlg() {
        let item = this.state.selected_request;
        if (item == null || item == undefined) {
            return;
        } else {
            return (
                <Modal
                    animationType="fade"
                    transparent={true}
                    visible={this.state.show_setFee_dlg}
                    onRequestClose={() => this.setState({ show_setFee_dlg: false })}
                    supportedOrientations={['portrait', 'landscape']}
                >
                    <View style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' }}>
                        <View style={stylesGlobal.popup_bg_blur_view}></View>
                        <View style={stylesGlobal.popup_main_container}>
                            <View style={stylesGlobal.popup_title_view}>
                                <Text style={[stylesGlobal.popup_title_text, stylesGlobal.font]}>{"How much would you like to charge "}{item.first_name}{" "}{item.last_name}{" to view the album "}{`'${item.album_name}' ?`}</Text>
                                <View style={{ flexDirection: 'row' }}>
                                    <TouchableOpacity style={stylesGlobal.popup_cancel_button} onPress={() => {
                                        this.setState({
                                            show_setFee_dlg: false,
                                        })
                                    }}>
                                        <Image style={stylesGlobal.cancel_delete_image} source={require("../icons/connection-delete.png")} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                            <View style={[stylesGlobal.popup_desc_container]}>
                                <View style={{ width: 100, margin: 5, flexDirection: "row", }}>
                                    <TextInput style={[{ borderRadius: 4, borderWidth: 1, width: 80, height: 25, padding: 3, fontSize: 15 }, stylesGlobal.font]}
                                        multiline={true}
                                        placeholder={"0"}
                                        keyboardType="number-pad"
                                        onChangeText={(text) => this.setState({ charge_amount: text.toString() })}
                                    >
                                    </TextInput>
                                    <Image style={{ width: 20, height: 20, resizeMode: "contain", marginLeft: 20 }} source={require("../icons/TurningCoin.gif")} />
                                </View>
                                {
                                    this.state.coin_amount_error &&
                                    <Text style={{ color: Colors.red }}>Please input coin amount as correctly!</Text>
                                }
                            </View>
                            <View style={stylesGlobal.popup_button_container}>
                                <TouchableOpacity style={[stylesGlobal.common_button, stylesGlobal.shadow_style]} onPress={() => { this.state.charge_amount == "" ? this.setState({ coin_amount_error: true }) : this.action_request(item, "accept") }}>
                                    <Text style={[stylesGlobal.popup_button_text, stylesGlobal.font]}>{"Set and Allow access"}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>
            )
        }
    }


//item.user_id != this.state.userId && !item.status, item
    gotoAlbum = (item) => {
        // if(!isRedirect)
        //     return ;

        // {"access_coin": null, 
        //"album_id": 290, 
        //"album_name": "Mine", 
        //"approve_date": null, 
        //"filename": "1613668005_1723_23.png", 
        //"filename1": "1669311535083_1290_75.png",
        // "first_name": "ksg",
        // "first_name1": "Richard", 
        //"id": 88,/

        // "imgpath": "https://cdn1.007percent.com/uploads/profile/", 
        //"imgpath1": "https://cdn1.007percent.com/uploads/profile/",
        // "is_verified1": 1, 
        //"last_name": "ksg", 
        //"last_name1": "Stewart", 
        //"member_plan1": 2, 
        //"paid": null, 
        //"profile_image_path": "https://cdn1.007percent.com/uploads/profile/thumb_300x300/1613668005_1723_23.png", 
        //"reject_date": null,
        // "request_date": "2023-01-31T12:51:19.000Z", 
        //"slug": "ksg-ksg", 
        //"slug1": "richard-stewart92", 
        //"status": false,
        // "user_id": 1723}

        console.log(TAG, 'gotoAlbum ', item);
        // this.props.screenProps.navigate('ShowAlbumImage', {
        //             userId: this.state.userId,
        //             userToken: this.state.userToken,
        //             //getDataAgain: this.getDataAgain,
        //             albumData: data
        //         })
        // 

        this.props.screenProps.navigate("MyProfile", {senderPage: "viewalbumrequest", senderData: item});
    }
    render() {
        return (
            <SafeAreaView style={styles.container}>
                {
                    this.state.loading && <ProgressIndicator />
                }
                {
                    this.state.show_fee_success_dlg && this.renderFeeSuccessDlg()
                }
                {
                    this.state.show_setFee_dlg && this.renderSetFeeDlg()
                }
                <View style={[stylesGlobal.cardView, { width: '90%', height: '90%', padding: 0, margin: 0 }]}>
                    <View style={{ width: '100%', height: '100%', alignItems: 'center' }}>
                        <View style={stylesGlobal.title_header}>
                            <Text style={[stylesGlobal.headText, stylesGlobal.font]}>ALBUM VIEW REQUESTS</Text>
                        </View>
                        {
                            !this.state.loading && this.state.album_request_list.length == 0 &&
                            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                                <Text style={[stylesGlobal.empty_cardView_text, stylesGlobal.font,]}>{"No Requests yet"}</Text>
                            </View>
                        }
                        {
                            this.state.album_request_list.length > 0 &&
                            <ScrollView
                                ref={(c) => { this._scrollView = c; }}
                                style={{ width: '95%', height: '100%', paddingBottom: 30 }}
                                scrollEventThrottle={0}
                                onScroll={({ nativeEvent }) => {
                                    if (this.isCloseToBottom(nativeEvent)) {
                                        if (this.state.more_load) {
                                            this.getAlbumRequest();
                                        }
                                    }
                                    if (this.isCloseToTop(nativeEvent)) {
                                        this.setState({
                                            album_request_list: [],
                                            page_number: 0,
                                            more_load: true,
                                        }, () => this.getAlbumRequest())
                                    }
                                }}
                            >
                                {
                                    this.state.album_request_list.map((item, index) =>
                                        // <View key={index} style={{ flex: 1, padding: 5, flexDirection: 'row', marginTop: 5, borderColor: Colors.black, borderWidth: 0.5 }}>
                                        //     <TouchableOpacity onPress={() => this.goto_profile(item)}>
                                        //         <ImageCompressor style={{ width: 100, height: 100 }} uri={item.profile_image_path} />
                                        //     </TouchableOpacity>
                                        //     <View style={{ flex: 1, paddingLeft: 5 }}>
                                        //         <View style={{ width: '100%', height: '60%', justifyContent: 'space-around', alignItems: 'flex-start' }}>
                                        //             <Text style={[{ fontSize: 14, color: Colors.black }, stylesGlobal.font]}><Text style={{ color: Colors.gold }}>{item.first_name + " " + item.last_name}</Text> request to view {item.album_name}</Text>
                                        //             <Text style={[{ fontSize: 12, color: Colors.black }, stylesGlobal.font]}>{Moment(item.request_date).format("DD MMM YYYY")}</Text>
                                        //         </View>
                                        //         <View style={{ width: '100%', height: '40%', flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' }}>
                                        //             <TouchableOpacity style={[styles.button_style, stylesGlobal.shadow_style]} onPress={() => this.setState({ show_setFee_dlg: true, selected_request: item, coin_amount_error: false })}>
                                        //                 <Text style={[{ fontSize: 14, color: Colors.white }, stylesGlobal.font]}>Accept</Text>
                                        //             </TouchableOpacity>
                                        //             <TouchableOpacity style={[styles.button_style, { marginLeft: 10 }, stylesGlobal.shadow_style]} onPress={() => this.action_request(item, "reject")}>
                                        //                 <Text style={[{ fontSize: 14, color: Colors.white }, stylesGlobal.font]}>Reject</Text>
                                        //             </TouchableOpacity>
                                        //         </View>
                                        //     </View>
                                        // </View>
                                        {
                                            

                                        return(
                                            <>
                                                <View key={index} style={[styles.component_view, { flexDirection: 'row', }]}>
                                                    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }} >
                                                        {/* <Image style={{ width: 40, height: 40, }} resizeMode={'contain'} source={require("../icons/ic_tab_dashbord.png")} /> */}
                                                        <TouchableOpacity style={{ marginLeft: 0, marginRight: 2 }} onPress={() => this.goto_profile(item)}>
                                                            {
                                                                item.user_id == this.state.userId && <ImageCompressor style={{ width: 60, height: 60, }} uri={item.imgpath1 + Constants.THUMB_FOLDER + item.filename1} />
                                                            }
                                                            {
                                                                item.user_id != this.state.userId && <ImageCompressor style={{ width: 60, height: 60, }} uri={item.profile_image_path} />
                                                            }
                                                        </TouchableOpacity>
                                                        <TouchableOpacity style={{ flex: 1, justifyContent: 'center', paddingLeft: 8, lineHeigt: 10, }} onPress={() => this.gotoAlbum(item)}>
                                                            {
                                                                item.user_id == this.state.userId && item.status && <Text style={[{ fontSize: 14, color: Colors.black, flex: 1 }, stylesGlobal.font]}>You have access to {item.first_name1 + " " + item.last_name1}'s <Text style={{ color: Colors.gold }}>{item.album_name}</Text> album{parseInt(item.access_coin) > 0 ? ` for ${item.access_coin} Gold Coin${parseInt(item.access_coin) > 1 ? "s" : ""} per month.` : "."}{"\n"}Status: Granted</Text>
                                                            }
                                                            {
                                                                item.user_id == this.state.userId && !item.status && <Text style={[{ fontSize: 14, color: Colors.black,  flex: 1 }, stylesGlobal.font]}>You request to view {item.first_name1 + " " + item.last_name1}'s <Text style={{ color: Colors.gold }}>{item.album_name}</Text> album.{"\n"}Status: Waiting for an approval</Text>
                                                            }
                                                            {
                                                                item.user_id != this.state.userId && item.status && <Text style={[{ fontSize: 14, color: Colors.black }, stylesGlobal.font]}>{item.first_name + " " + item.last_name} has access to <Text style={{ color: Colors.gold }}>{item.album_name}</Text> album{parseInt(item.access_coin) > 0 ? ` for ${item.access_coin} Gold Coin${parseInt(item.access_coin) > 1 ? "s" : ""} per month.` : "."}{"\n"}Status: Granted</Text>
                                                            }
                                                            {
                                                                item.user_id != this.state.userId && !item.status && <Text style={[{ fontSize: 14, color: Colors.black }, stylesGlobal.font]}>{item.first_name + " " + item.last_name} requested to view <Text style={{ color: Colors.gold }}>{item.album_name}</Text> album.{"\n"}Status: Requested</Text>
                                                            }
                                                            <Text style={[{ fontSize: 10, color: Colors.black, marginTop: 1 }, stylesGlobal.font]}>{Moment(item.request_date).format("DD MMM YYYY")}</Text>
                                                        </TouchableOpacity>
                                                    </View>
                                                    <View style={{ alignItems: 'center', marginLeft: 5 }}>
                                                        {
                                                            item.user_id == this.state.userId && <TouchableOpacity style={[styles.button_style, stylesGlobal.shadow_style]} onPress={() => this.action_request(item, "reject")}>
                                                                <Text style={[{ fontSize: 12, color: Colors.white }, stylesGlobal.font]}>{item.status ? "Unsubscribe" : "Cancel"}</Text>
                                                            </TouchableOpacity>
                                                        }
                                                        {item.user_id != this.state.userId  && !item.status && 
                                                             <View>
                                                                <TouchableOpacity style={[styles.button_style, stylesGlobal.shadow_style]} onPress={() => {
                                                                    //(4,7,8)
                                                                    //(member_plan1 != 4 && member_plan1 != 7 && member_plan1 != 8) && is_verified1 = 1
                                                                    if((item.member_plan1 != 4 && item.member_plan1 != 7 && item.member_plan1 != 8) && item.is_verified1 === 1)
                                                                        this.setState({ show_setFee_dlg: true, selected_request: item, coin_amount_error: false });
                                                                    else {
                                                                        this.setState({charge_amount: '0'}, () => {
                                                                             this.action_request(item, "accept");
                                                                        })
                                                                       
                                                                    }

                                                                }}>
                                                                    <Text style={[{ fontSize: 12, color: Colors.white }, stylesGlobal.font]}>{"Allow Access"}</Text>
                                                                </TouchableOpacity>
                                                                <TouchableOpacity style={[styles.button_style, stylesGlobal.shadow_style]} onPress={() => {
                                                                    this.action_request(item, "reject");
                                                                }}>
                                                                    <Text style={[{ fontSize: 12, color: Colors.white }, stylesGlobal.font]}>{"Reject Access"}</Text>
                                                                </TouchableOpacity>
                                                            </View>
                                                        }
                                                        {
                                                            item.user_id != this.state.userId && item.status && <TouchableOpacity style={[styles.button_style, stylesGlobal.shadow_style]} onPress={() => {
                                                                this.action_request(item, "reject");
                                                            }}>
                                                                <Text style={[{ fontSize: 12, color: Colors.white }, stylesGlobal.font]}>{"Revoke Access"}</Text>
                                                            </TouchableOpacity>
                                                        }
                                                    </View>
                                                </View>
                                            </>

                                            )

                                        
                                    
                                        }

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
    button_style: {
        width: 80,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.gold,
        borderRadius: 5,
        marginTop: 4,
        marginBottom: 4,
    },
    component_view: {
        width: '100%',
        marginTop: 15,
        borderBottomWidth: 0.5,
        borderColor: Colors.black,
        paddingLeft: 5,
        paddingRight: 5,
        paddingBottom: 10,
        flexDirection: 'row',
        alignItems: 'center'
    },
});
