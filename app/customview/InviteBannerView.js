import React from 'react';
import {
    StyleSheet, Text, View, Modal, TextInput, TouchableOpacity,
    ActivityIndicator, Platform, KeyboardAvoidingView, Dimensions, Image, Keyboard,
    TouchableWithoutFeedback, Alert, Linking
} from 'react-native';
import WebService from "../core/WebService";
import { EventRegister } from 'react-native-event-listeners';
import { Constants } from "../consts/Constants";
import { Colors } from "../consts/Colors";
import { stylesGlobal } from "../consts/StyleSheet";
import * as GlobalStyleSheet from "../consts/StyleSheet";
import * as Global from "../consts/Global";
import Memory from '../core/Memory';
import AsyncStorage from '@react-native-community/async-storage';

var TAG = "InviteBannerView"

export default class InviteBannerView extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            invitation_list: [],
            screenProps: this.props.screenProps,

            userId: "",
            userToken: "",
            userSlug: "",
            userFirstName: "",
            userLastName: "",
            userImagePath: "",
            userImageName: "",
            user_email: "",

        }
    }

    async UNSAFE_componentWillMount() {
        
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

        } catch (error) {
            // Error retrieving data
            console.log(TAG + ' getData  error  ' + error);
        }
        
    }

    async componentDidMount() {
        this.listener = EventRegister.addEventListener(Constants.EVENT_BANNER_INVITATION, async(data) => {

            let post_count = await AsyncStorage.getItem('POST');
            let member_count = await AsyncStorage.getItem('MEMBER');
            let event_count = await AsyncStorage.getItem('EVENT');
            let travel_count = await AsyncStorage.getItem('TRAVEL');
            let gift_count = await AsyncStorage.getItem('GIFT');
            let chat_count = await AsyncStorage.getItem('CHAT');

            var post_count_int = post_count == null ? 0 : parseInt(post_count, 10);
            var member_count_int = member_count == null ? 0 : parseInt(member_count, 10);
            var event_count_int = event_count == null ? 0 : parseInt(event_count, 10);
            var travel_count_int = travel_count == null ? 0 : parseInt(travel_count, 10);
            var gift_count_int = gift_count == null ? 0 : parseInt(gift_count, 10);
            var chat_count_int = chat_count == null ? 0 : parseInt(chat_count, 10);
            
            // var all_new_noti_count = post_count_int + member_count_int + event_count_int + travel_count_int + gift_count_int;
            var all_new_noti_count = event_count_int + travel_count_int;
            if(all_new_noti_count == 0) {
                this.setState({
                    invitation_list: []
                })
                return;
            }
            var noti_list = [];
            if(data != null || data != "") {
                noti_list = JSON.parse(data);
            }
            
            var invitation_list = [];
            var index = 0;
            while (index < all_new_noti_count && index < noti_list.length) {
                if(noti_list[index].notification_type == "2") {
                    invitation_list.push(noti_list[index]);
                    break;
                }
                index ++
            }

            this.setState({
                invitation_list: invitation_list
            })
        })
    }

    componentWillUnmount() {
        EventRegister.removeEventListener(this.listener);
    }

    removeItem = async(index) => {
        var invitation_list = this.state.invitation_list;
        invitation_list.splice(index, 1);
        this.setState({
            invitation_list: invitation_list
        })
        await AsyncStorage.setItem('EVENT', "0");
        await AsyncStorage.setItem('TRAVEL', "0");
    }

    callEventDetailAPI = async (item, index) => {

        this.props.screenProps.navigate("EventDetail", {
            // screenProps: this.props.screenProps,
            eventId: item.object_id,
            response_invite : () => {
                if(this.state.invitation_list.length > 0){
                    let array = [...this.state.invitation_list];
                    let index_array = array.indexOf(item);
                    if ( index_array != -1 ) {
                        array.splice(index_array, 1);
                        this.setState({invitation_list:array})
                    }
                }
            },
            // loadAfterDeletingEvent: this.props.loadAfterDeletingEvent,
            // refreshEventData: this.renderDataAgain,
            // EventCategory:this.props.EventCategory,
            // tab_type: this.props.type,
            // invite_code: item.invite_code
        });
        // this.props.setLoading(true);
        // try {
        //     let uri = Memory().env == "LIVE" ? Global.URL_EVENT_DETAIL + item.object_id : Global.URL_EVENT_DETAIL_DEV + item.object_id;
        //     let params = new FormData();
        //     params.append("token", this.state.userToken);
        //     params.append("user_id", this.state.userId);
        //     params.append("format", "json");
        //     params.append("data", "");

        //     console.log(TAG + " callEventDetailAPI uri " + uri);
        //     console.log(TAG + " callEventDetailAPI params " + JSON.stringify(params));

        //     WebService.callServicePost(uri, params, this.handleEventDetailResponse);
        // } catch (error) {
        //     this.props.setLoading(false);
        //     if (error != undefined && error != null && error.length > 0) {
        //         Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
        //     }
        // }
    };

    /**
    * handle event detai lAPI response
    */
    handleEventDetailResponse = async(response, isError) => {
        console.log(TAG + " callEventDetailAPI Response " + JSON.stringify(response));
        if (!isError) {
            var result = response;
            if (result != undefined && result != null) {
                if(result.status == "success") {
                    if (result.data != undefined && result.data != null) {
                        if(result.data.info.cate_id == "10") { //  travel
                            if(this.props.jumpToTravelTab) {
                                this.props.jumpToTravelTab(1);
                            } else {
                                this.props.screenProps.navigate('Dashboard', {selected_screen: "travel"});
                            }
                        } else { // party
                            if(this.props.jumpToEventTab) {
                                this.props.jumpToEventTab(1);
                            } else {
                                this.props.screenProps.navigate('Dashboard', {selected_screen: "event"});
                            }
                        }
                        this.setState({
                            invitation_list: []
                        })
                        await AsyncStorage.setItem('EVENT', "0");
                        await AsyncStorage.setItem('TRAVEL', "0");
                    }
                } else {
                    // Alert.alert(Constants.NO_EVENT_MESSAGE, "");
                }
            }
        } else {
            if (response != undefined && response != null && response.length > 0) {
                Alert.alert(response.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
        this.props.setLoading(false);
    };

    openEvent = async(item, index) => {
        // var invitation_list = this.state.invitation_list;
        // invitation_list.splice(index, 1);
        // this.setState({
        //     invitation_list: invitation_list
        // })
        // this.props.screenProps.navigate("EventDetail", {
        //     screenProps: this.props.screenProps,
        //     eventId: item.object_id,
        //     loadAfterDeletingEvent: () => {},
        //     refreshEventData: () => {},
        //     EventCategory: item.class_type == "3" ?  "travel" : "party",
        //     // tab_type: this.props.type,
        //     // invite_code: item.invite_code
        // }); 
        
        if(item.class_type == "3") {
            if(this.props.jumpToTravelTab) {
                this.props.jumpToTravelTab(1);
            } else {
                this.props.screenProps.navigate('Dashboard', {selected_screen: "travel"});
            }
        } else {
            if(this.props.jumpToEventTab) {
                this.props.jumpToEventTab(1);
            } else {
                this.props.screenProps.navigate('Dashboard', {selected_screen: "event"});
            }
        }
        this.setState({
            invitation_list: []
        })
        await AsyncStorage.setItem('EVENT', "0");
        await AsyncStorage.setItem('TRAVEL', "0");
    }

    render() {
        if(this.state.invitation_list == null || this.state.invitation_list == []) {
            return null;
        }
        return (
            <View style = {{width: '100%'}}>
            {
                this.state.invitation_list.map((item, index) => 
                <View key = {index} style={{width: '100%', backgroundColor: Colors.white, marginBottom: 15, padding: 15, borderColor: Colors.gold, borderTopWidth: 3, borderBottomWidth: 3, flexDirection: 'row', alignItems: 'center', justifyContent: 'center'}}>
                    <View style = {{flex: 1}}>
                        <Text style = {[{fontSize: 14, color: Colors.black}, stylesGlobal.font]}>You have new personal Party/Trip Invitations. Please review and RSVP <Text onPress = {() => this.callEventDetailAPI(item, index)} style = {{color: Colors.gold}}>here</Text>.</Text>
                    </View>
                    <TouchableOpacity onPress = {() => this.removeItem(index)}>
                        <Image style = {{width: 15, height: 15, resizeMode: 'contain'}} source={require("../icons/connection-delete.png")}/>
                    </TouchableOpacity> 
                </View>
                )
            }                
            </View>
        );
    }
}


const styles = StyleSheet.create({
  

});

