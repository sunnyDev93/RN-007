import React from 'react';
import {
    StyleSheet, 
    Text, 
    View, 
    Modal, 
    TouchableOpacity,
    Platform, 
    Dimensions, 
    Image, 
    Alert, 
    Linking, 
    ScrollView,
    FlatList
} from 'react-native';
import { EventRegister } from 'react-native-event-listeners';
import { ImageCompressor } from '../components/ImageCompressorClass';
import { Constants } from "../consts/Constants";
import { Colors } from "../consts/Colors";
import { stylesGlobal, STICKY_HEADER_HEIGHT } from "../consts/StyleSheet";
import WebService from "../core/WebService";
import * as Global from "../consts/Global";
import Memory from '../core/Memory';
import AsyncStorage from '@react-native-community/async-storage';
import { isIphoneX, getBottomSpace } from '../custom_components/react-native-iphone-x-helper';
import ProgressIndicator from "../components/ProgressIndicator";

const imageWidth = 60;
const isIos = Platform.OS === 'ios'
const { width, height } = Dimensions.get("window")
var myProfileData;
var containerWidth = 250
var TAG = "InvisiblePopupView"

export default class InvisiblePopupView extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            userFirstName: "",
            userLastName: "",
            userImagePath: "",
            userImageName: "",
            userId: "",
            userToken: "",
            userSlug: "",
            notification_array: [],

            loading: false,
            selected_item: null,

            is_portrait: true,

            showModel: false,
            private_desc: "This is a Private Post. You can request visibility from the Member.",
			// invitees_desc: "Only visible to Personal Invitees of the Host.",
            invitees_desc: "This post is only visible for Individually authorized Friends.",
            invitees_desc_2: "This event is only visibile to Personal Invitees",
			members_desc: "Only visible to Approved Members of The 0.07%. If you think you qualify to be a member of our inner circle, please apply to change your Profile Type.",
			favorites_desc: "Only visible to Favorites of the original author.",
			notActive_desc: "You cannot see this because your Profile is not approved yet. Please verify that you have: \n - verified your email address (followed the link on the _verification email_ sent to you) \n - completed you _Profile_ including images and descriptions \n - uploaded your _credentials_ proving that you meet the Profile Type requirements \n Once you have done all of that, you can _follow up_ with your Membership Manager.",
            is_verified: "",
            member_plan: "",
						popup_desc: ""
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
            var is_verified = await AsyncStorage.getItem(Constants.KEY_IS_VERIFIED);
            var member_plan = await AsyncStorage.getItem(Constants.KEY_MEMBER_PLAN);
            
            this.setState({
                userId: userId,
                userToken: userToken,
                userSlug: userSlug,
                userFirstName: userFirstName,
                userLastName: userLastName,
                userImagePath: userImagePath,
                userImageName: userImageName,
                is_verified: is_verified,
                member_plan: member_plan,
            })
            
        } catch (error) {
            // Error retrieving data
            console.log('getData  error  ' + error);
        }
    }

    componentWillUnmount() {
        
    }

    

    displayPopup = async(data, isFeed) => {
			let description;
			const {member_plan, is_verified, invitees_desc, invitees_desc_2, favorites_desc, private_desc, notActive_desc} = this.state
			let typeData = -1;
			if((member_plan == "1" && member_plan == "2" || member_plan == "3" || member_plan == "5" || member_plan == "6") && is_verified == "0") {		// member but not active
				description = notActive_desc
			}
			else {
				if(data.visibility == 0 || data.visibility == "0") {	// member
					if(member_plan == "4" || member_plan == "7") {	// vip fan, fan
						description = this.state.members_desc;
					}
                    //typeData = 0;
				}
				else if(data.visibility == 2 || data.visibility == "2") {		// invitee
                    if(isFeed)
					   description = invitees_desc;
                    else 
                        description = invitees_desc_2;
                    //typeData = 1;
				}
				else if(data.visibility == 3 || data.visibility == "3" || data.visibility == 5 || data.visibility == "5") {		// favorite, member & favorite
					description = favorites_desc;
                    //typeData = 2;
				}
				else if(data.visibility == 4 || data.visibility == "4") {		// prviate
					description = private_desc;
                    //typeData = 3;
				}
			}

            if(member_plan === "4" || member_plan === "7" || member_plan === "8")
                typeData = 1;


        this.setState({
            showModel: true,
			popup_desc: description,
            type_data2show: typeData
        })
    }


    render() {
        return (

            <Modal
                animationType="fade"
                transparent={true}
                // closeOnClick={true}
                visible={this.state.showModel}
                onRequestClose={() => this.setState({showModel: false})}
                supportedOrientations={['portrait', 'landscape']}
            >
                <View style = {{width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center'}}>
                    <View style = {stylesGlobal.popup_bg_blur_view}></View>
                    <View style = {[stylesGlobal.popup_main_container]}>
                        <View style = {stylesGlobal.popup_title_view}>
                        {
                            (this.state.member_plan == "7" || this.state.is_verified != "1") &&
                            <Text style = {[stylesGlobal.popup_title_text, stylesGlobal.font]}>{"You are not a Member yet"}</Text>
                        }
                        {
                            !(this.state.member_plan == "7" || this.state.is_verified != "1") &&
                            <Text style = {[stylesGlobal.popup_title_text, stylesGlobal.font]}>{"You can't see this post"}</Text>
                        }    
                            <TouchableOpacity style = {stylesGlobal.popup_cancel_button} onPress = {() => this.setState({showModel: false})}>
                                <Image style = {stylesGlobal.cancel_delete_image} source={require('../icons/connection-delete.png')}/>
                            </TouchableOpacity>
                        </View>
                        <View style = {[stylesGlobal.popup_desc_container,]}>
                        	<Text style = {[stylesGlobal.popup_desc_text, stylesGlobal.font]}>{this.state.popup_desc}</Text>
                        </View>
                        <View style = {stylesGlobal.popup_button_container}>

                            {this.state.type_data2show == 1 && 
                                <TouchableOpacity style = {[styrhkdtjddlqslek.lesGlobal.common_button, {marginEnd: 10}, stylesGlobal.shadow_style]} onPress = {() => 
                                    {
                                        this.setState({
                                            showModel: false
                                        })
                                        if(this.props.openMyAccountScreen) {
                                            this.props.openMyAccountScreen(true, "susbscription")
                                        }
                                    }}
                                >
                                    <Text style = {[stylesGlobal.popup_button_text, stylesGlobal.font]}>{"Go to Upgrade"}</Text>
                                </TouchableOpacity>
                            }
                            
                            <TouchableOpacity style = {[stylesGlobal.common_button,, stylesGlobal.shadow_style]}
                                onPress = {() => 
                                    this.setState({
                                        showModel: false
                                    })
                                }
                            >
                                <Text style = {[stylesGlobal.popup_button_text, stylesGlobal.font]}>{"Cancel"}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

        );
    }
}
const styles = StyleSheet.create({

});

