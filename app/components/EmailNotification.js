import React, { Component } from "react";
import {
    Alert,
    StyleSheet,
    SafeAreaView,
    View,
    TouchableOpacity,
    Image,
    ScrollView,
    Text
} from "react-native";

import { Colors } from "../consts/Colors";
import { Constants } from "../consts/Constants";
import { stylesGlobal, STICKY_HEADER_HEIGHT } from '../consts/StyleSheet'
import Memory from '../core/Memory';
import * as Global from "../consts/Global";
import WebService from "../core/WebService";
import ProgressIndicator from "./ProgressIndicator";
import AsyncStorage from '@react-native-community/async-storage';
import images from "../images";


var TAG = "EmailNotification";
var isFirsTime = true;

export default class EmailNotification extends React.Component {

    constructor(props) {
        isFirsTime = true;
        super(props)

        this.state = {

            post: false, // when change email setting then true
            push: false, //when change app setting then true
            looked_at_me: 1,
            looked_at_me_push: 1,
            favorited_me: 1,
            favorited_me_push: 1,
            messaged_me: 1,
            messaged_me_push: 1,
            invited_me_personally: 1,
            invited_me_personally_push: 1,
            member_parties_and_trips: 1,
            member_parties_and_trips_push: 1,
            posts_parties_and_trips: 1,
            posts_parties_and_trips_push: 1,
            member_status_updates_and_posts: 1,
            member_status_updates_and_posts_push: 1,
            reactions_to_my_posts: 1,
            reactions_to_my_posts_push: 1,
            rsvps_for_my_parties_and_trips: 1,
            rsvps_for_my_parties_and_trips_push: 1,
            payments_and_credits: 1,
            payments_and_credits_push: 1,
            new_features_in_app_and_web: 1,
            new_features_in_app_and_web_push: 1,
            special_offers: 1,
            special_offers_push: 1,
            received_gifts_and_roses: 1,
            received_gifts_and_roses_push: 1,
            member_and_favorites_birthday: 1,
            member_and_favorites_birthday_push: 1,
            follow_me: 1,
            follow_me_push: 1,
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
                member_plan: member_plan,
                is_verified: is_verified,

                initial_tab: 1,
            });
        } catch (error) {
            // Error retrieving data
            return;
        }

        this.getEmailNotificationInitial()

    };

    getEmailNotificationInitial() {
        try {

            this.setState({
                loading: true
            });

            let uri = Memory().env == "LIVE" ? Global.URL_EMAIL_NOTIFICATION : Global.URL_EMAIL_NOTIFICATION_DEV;
            let params = new FormData();
            params.append("token", this.state.userToken);
            params.append("user_id", this.state.userId);
            params.append("format", "json");
                        
            console.log(TAG + " callGetEmailNotificationAPI uri " + uri);
            console.log(TAG + " callGetEmailNotificationAPI params " + JSON.stringify(params));

            WebService.callServicePost(uri, params, this.handleGetEmailNotification);
        } catch (error) {
            console.log(TAG + " callGetEmailNotificationAPI error " + error);
            this.setState({
                loading: false
            });
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    }

    handleGetEmailNotification = (response, isError) => {
        console.log(TAG + " callGetEmailNotificationAPI Response " + JSON.stringify(response));
        console.log(TAG + " callGetEmailNotificationAPI isError " + isError);

        if (!isError) {
            var result = response;
            if (result != undefined && result != null) {
                if(result.status == "success") {
                    if(result.data.length > 0) {
                        var index = 0;
                        for(index = 0; index < result.data.length; index ++) {
                            if(result.data[index].notification_setting_type == "1") {
                                if(result.data[index].looked_at_me != null) {
                                    this.setState({
                                        looked_at_me: result.data[index].looked_at_me
                                    })
                                }
                                if(result.data[index].favorited_me != null) {
                                    this.setState({
                                        favorited_me: result.data[index].favorited_me
                                    })
                                } 
                                if(result.data[index].messaged_me != null) {
                                    this.setState({
                                        messaged_me: result.data[index].messaged_me
                                    })
                                }
                                if(result.data[index].invited_me_personally != null) {
                                    this.setState({
                                        invited_me_personally: '1'
                                    })
                                }
                                if(result.data[index].member_parties_and_trips != null) {
                                    this.setState({
                                        member_parties_and_trips: result.data[index].member_parties_and_trips
                                    })
                                }
                                if(result.data[index].posts_parties_and_trips != null) {
                                    this.setState({
                                        posts_parties_and_trips: result.data[index].posts_parties_and_trips
                                    })
                                }
                                if(result.data[index].member_status_updates_and_posts != null) {
                                    this.setState({
                                        member_status_updates_and_posts: result.data[index].member_status_updates_and_posts
                                    })
                                } 
                                if(result.data[index].reactions_to_my_posts != null) {
                                    this.setState({
                                        reactions_to_my_posts: result.data[index].reactions_to_my_posts
                                    })
                                }
                                if(result.data[index].rsvps_for_my_parties_and_trips != null) {
                                    this.setState({
                                        rsvps_for_my_parties_and_trips: result.data[index].rsvps_for_my_parties_and_trips
                                    })
                                }
                                if(result.data[index].payments_and_credits != null) {
                                    this.setState({
                                        payments_and_credits: result.data[index].payments_and_credits
                                    })
                                }
                                if(result.data[index].new_features_in_app_and_web != null) {
                                    this.setState({
                                        new_features_in_app_and_web: result.data[index].new_features_in_app_and_web
                                    })
                                }
                                if(result.data[index].special_offers != null) {
                                    this.setState({
                                        special_offers: result.data[index].special_offers
                                    })
                                }
                                if(result.data[index].received_gifts_and_roses != null) {
                                    this.setState({
                                        received_gifts_and_roses: '1'
                                    })
                                }
                                if(result.data[index].member_and_favorites_birthday != null) {
                                    this.setState({
                                        member_and_favorites_birthday: result.data[index].member_and_favorites_birthday
                                    })
                                }
                                if(result.data[index].follow_me != null) {
                                    this.setState({
                                        follow_me: result.data[index].follow_me
                                    })
                                }
                            } else if(result.data[index].notification_setting_type == "2") {
                                if(result.data[index].looked_at_me != null) {
                                    this.setState({
                                        looked_at_me_push: result.data[index].looked_at_me
                                    })
                                }
                                if(result.data[index].favorited_me != null) {
                                    this.setState({
                                        favorited_me_push: result.data[index].favorited_me
                                    })
                                } 
                                if(result.data[index].messaged_me != null) {
                                    this.setState({
                                        messaged_me_push: result.data[index].messaged_me
                                    })
                                }
                                if(result.data[index].invited_me_personally != null) {
                                    this.setState({
                                        invited_me_personally_push: '1'
                                    })
                                }
                                if(result.data[index].member_parties_and_trips != null) {
                                    this.setState({
                                        member_parties_and_trips_push: result.data[index].member_parties_and_trips
                                    })
                                }
                                if(result.data[index].posts_parties_and_trips != null) {
                                    this.setState({
                                        posts_parties_and_trips_push: result.data[index].posts_parties_and_trips
                                    })
                                }
                                if(result.data[index].member_status_updates_and_posts != null) {
                                    this.setState({
                                        member_status_updates_and_posts_push: result.data[index].member_status_updates_and_posts
                                    })
                                } 
                                if(result.data[index].reactions_to_my_posts != null) {
                                    this.setState({
                                        reactions_to_my_posts_push: result.data[index].reactions_to_my_posts
                                    })
                                }
                                if(result.data[index].rsvps_for_my_parties_and_trips != null) {
                                    this.setState({
                                        rsvps_for_my_parties_and_trips_push: result.data[index].rsvps_for_my_parties_and_trips
                                    })
                                }
                                if(result.data[index].payments_and_credits != null) {
                                    this.setState({
                                        payments_and_credits_push: result.data[index].payments_and_credits
                                    })
                                }
                                if(result.data[index].new_features_in_app_and_web != null) {
                                    this.setState({
                                        new_features_in_app_and_web_push: result.data[index].new_features_in_app_and_web
                                    })
                                }
                                if(result.data[index].special_offers != null) {
                                    this.setState({
                                        special_offers_push: result.data[index].special_offers
                                    })
                                }
                                if(result.data[index].received_gifts_and_roses != null) {
                                    this.setState({
                                        received_gifts_and_roses_push: '1'
                                    })
                                }
                                if(result.data[index].member_and_favorites_birthday != null) {
                                    this.setState({
                                        member_and_favorites_birthday_push: result.data[index].member_and_favorites_birthday
                                    })
                                }
                                if(result.data[index].follow_me != null) {
                                    this.setState({
                                        follow_me_push: result.data[index].follow_me
                                    })
                                }
                            }
                        }
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

    save_notification_setting() {
        if(!this.state.push && !this.state.post) {
            return;
        }
        try {

            this.setState({
                loading: true
            });

            let uri = Memory().env == "LIVE" ? Global.URL_EMAIL_NOTIFICATION : Global.URL_EMAIL_NOTIFICATION_DEV;
            let params = new FormData();
            params.append("token", this.state.userToken);
            params.append("user_id", this.state.userId);
            params.append("format", "json");
            params.append("post", this.state.post);
            params.append("push", this.state.push);
            params.append("looked_at_me", this.state.looked_at_me);
            params.append("looked_at_me_push", this.state.looked_at_me_push);
            params.append("favorited_me", this.state.favorited_me);
            params.append("favorited_me_push", this.state.favorited_me_push);
            params.append("messaged_me", this.state.messaged_me);
            params.append("messaged_me_push", this.state.messaged_me_push);
            params.append("invited_me_personally", '1');
            params.append("invited_me_personally_push", '1');
            params.append("posts_parties_and_trips", this.state.posts_parties_and_trips);
            params.append("posts_parties_and_trips_push", this.state.posts_parties_and_trips_push);
            params.append("member_status_updates_and_posts", this.state.member_status_updates_and_posts);
            params.append("member_status_updates_and_posts_push", this.state.member_status_updates_and_posts_push);
            params.append("reactions_to_my_posts", this.state.reactions_to_my_posts);
            params.append("reactions_to_my_posts_push", this.state.reactions_to_my_posts_push);
            params.append("rsvps_for_my_parties_and_trips", this.state.rsvps_for_my_parties_and_trips);
            params.append("rsvps_for_my_parties_and_trips_push", this.state.rsvps_for_my_parties_and_trips_push);
            params.append("payments_and_credits", this.state.payments_and_credits);
            params.append("payments_and_credits_push", this.state.payments_and_credits_push);
            params.append("new_features_in_app_and_web", this.state.new_features_in_app_and_web);
            params.append("new_features_in_app_and_web_push", this.state.new_features_in_app_and_web_push);
            params.append("special_offers", this.state.special_offers);
            params.append("special_offers_push", this.state.special_offers_push);
            params.append("received_gifts_and_roses", '1');
            params.append("received_gifts_and_roses_push", '1');
            params.append("member_and_favorites_birthday", this.state.member_and_favorites_birthday);
            params.append("member_and_favorites_birthday_push", this.state.member_and_favorites_birthday_push);
            params.append("follow_me", this.state.follow_me);
            params.append("follow_me_push", this.state.follow_me_push);
                        
            console.log(TAG + " callSaveEmailNotificationAPI uri " + uri);
            console.log(TAG + " callSaveEmailNotificationAPI params " + JSON.stringify(params));

            WebService.callServicePost(uri, params, this.handleSaveEmailNotification);
        } catch (error) {
            console.log(TAG + " callSaveEmailNotificationAPI error " + error);
            this.setState({
                loading: false
            });
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    }

    handleSaveEmailNotification = (response, isError) => {
        console.log(TAG + " callGetEmailNotificationAPI Response " + JSON.stringify(response));
        console.log(TAG + " callGetEmailNotificationAPI isError " + isError);

        if (!isError) {
            var result = response;
            if (result != undefined && result != null) {
                if(result.status == "success") {
                    this.setState({
                        post: false,
                        push: false
                    })
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

    render() {
        return (
            <SafeAreaView style={styles.container}>
            {
                this.state.loading && <ProgressIndicator/>
            }
                <View style = {styles.card_view}>
                    <View style = {{width: '100%', height: '100%', alignItems: 'center'}}>
                        <View style={styles.title_header}>
                            <Text style={[styles.headText, stylesGlobal.font]}>NOTIFICATION SETTINGS</Text>
                        </View>
                        <View style = {{width: '100%', flex: 1}}>
                            <ScrollView style = {{width: '100%', height: '100%'}}>
                                <View style = {styles.component_view}>

                                    <View style={{width: 20,}}></View>

                                    <View style = {{flex: 1}}>

                                    </View>
                                    <View style = {styles.check_view}>
                                        <View style = {styles.email_app_check_view}>
                                            <Text style = {[styles.title_text, stylesGlobal.font_semibold]}>Email</Text>
                                        </View>
                                        <View style = {styles.email_app_check_view}>
                                            <Text style = {[styles.title_text, stylesGlobal.font_semibold]}>App</Text>
                                        </View>
                                    </View>
                                </View>
                                <View style = {styles.component_view}>
                                    <View style={styles.prevImageView}>
                                        <Image source={images.notiLookedAtMe} style={{width: '100%', height: '100%', resizeMode:'contain'}}/>
                                    </View>
                                    <View style = {{flex: 1}}>
                                        <Text style = {[styles.title_text, stylesGlobal.font]}>Looked at me</Text>
                                    </View>
                                    <View style = {styles.check_view}>
                                        <View style = {styles.email_app_check_view}>
                                            <TouchableOpacity style = {styles.check_box_touch} onPress = {() => {
                                                if(this.state.looked_at_me == "0") {
                                                    this.setState({
                                                        looked_at_me: "1", 
                                                    }, () => this.save_notification_setting());
                                                } else {
                                                    this.setState({
                                                        looked_at_me: "0", 
                                                    }, () => this.save_notification_setting());
                                                };
                                                this.setState({
                                                    post: true
                                                })
                                            }}>
                                                <Image source={require('../icons/square.png')} style={{width: '100%', height: '100%', resizeMode:'contain'}}/>
                                            {
                                                this.state.looked_at_me == '1' &&
                                                <Image source={require('../icons/checked.png')} style={{position:'absolute', top: 0, left: 0, width: '100%', height: '100%', resizeMode:'contain'}}/>
                                            }
                                            </TouchableOpacity>
                                        </View>
                                        <View style = {styles.email_app_check_view}>
                                            <TouchableOpacity style = {styles.check_box_touch} onPress = {() => {
                                                if(this.state.looked_at_me_push == "0") {
                                                    this.setState({
                                                        looked_at_me_push: "1", 
                                                    }, () => this.save_notification_setting());
                                                } else {
                                                    this.setState({
                                                        looked_at_me_push: "0", 
                                                    }, () => this.save_notification_setting());
                                                };
                                                this.setState({
                                                    push: true
                                                })
                                            }}>
                                                <Image source={require('../icons/square.png')} style={{width: '100%', height: '100%', resizeMode:'contain'}}/>
                                            {
                                                this.state.looked_at_me_push == '1' &&
                                                <Image source={require('../icons/checked.png')} style={{position:'absolute', top: 0, left: 0, width: '100%', height: '100%', resizeMode:'contain'}}/>
                                            }
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </View>
                                <View style = {styles.component_view}>
                                    <View style={styles.prevImageView}>
                                        <Image source={images.notiFavoriedMe} style={{width: '100%', height: '100%', resizeMode:'contain'}}/>
                                    </View>
                                    <View style = {{flex: 1}}>
                                        <Text style = {[styles.title_text, stylesGlobal.font]}>Favorited Me</Text>
                                    </View>
                                    <View style = {styles.check_view}>
                                        <View style = {styles.email_app_check_view}>
                                            <TouchableOpacity style = {styles.check_box_touch} onPress = {() => {
                                                if(this.state.favorited_me == "0") {
                                                    this.setState({
                                                        favorited_me: "1", 
                                                    }, () => this.save_notification_setting());
                                                } else {
                                                    this.setState({
                                                        favorited_me: "0", 
                                                    }, () => this.save_notification_setting());
                                                };
                                                this.setState({
                                                    post: true
                                                })
                                            }}>
                                                <Image source={require('../icons/square.png')} style={{width: '100%', height: '100%', resizeMode:'contain'}}/>
                                            {
                                                this.state.favorited_me == '1' &&
                                                <Image source={require('../icons/checked.png')} style={{position:'absolute', top: 0, left: 0, width: '100%', height: '100%', resizeMode:'contain'}}/>
                                            }
                                            </TouchableOpacity>
                                        </View>
                                        <View style = {styles.email_app_check_view}>
                                            <TouchableOpacity style = {styles.check_box_touch} onPress = {() => {
                                                if(this.state.favorited_me_push == "0") {
                                                    this.setState({
                                                        favorited_me_push: "1", 
                                                    }, () => this.save_notification_setting());
                                                } else {
                                                    this.setState({
                                                        favorited_me_push: "0", 
                                                    }, () => this.save_notification_setting());
                                                };
                                                this.setState({
                                                    push: true
                                                })
                                            }}>
                                                <Image source={require('../icons/square.png')} style={{width: '100%', height: '100%', resizeMode:'contain'}}/>
                                            {
                                                this.state.favorited_me_push == '1' &&
                                                <Image source={require('../icons/checked.png')} style={{position:'absolute', top: 0, left: 0, width: '100%', height: '100%', resizeMode:'contain'}}/>
                                            }
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </View>
                                <View style = {styles.component_view}>
                                    <View style={styles.prevImageView}>
                                        <Image source={images.notiMessagedMe} style={{width: '100%', height: '100%', resizeMode:'contain'}}/>
                                    </View>
                                    <View style = {{flex: 1}}>
                                        <Text style = {[styles.title_text, stylesGlobal.font]}>Messaged Me</Text>
                                    </View>
                                    <View style = {styles.check_view}>
                                        <View style = {styles.email_app_check_view}>
                                            <TouchableOpacity style = {styles.check_box_touch} onPress = {() => {
                                                if(this.state.messaged_me == "0") {
                                                    this.setState({
                                                        messaged_me: "1", 
                                                    }, () => this.save_notification_setting());
                                                } else {
                                                    this.setState({
                                                        messaged_me: "0", 
                                                    }, () => this.save_notification_setting());
                                                };
                                                this.setState({
                                                    post: true
                                                })
                                            }}>
                                                <Image source={require('../icons/square.png')} style={{width: '100%', height: '100%', resizeMode:'contain'}}/>
                                            {
                                                this.state.messaged_me == '1' &&
                                                <Image source={require('../icons/checked.png')} style={{position:'absolute', top: 0, left: 0, width: '100%', height: '100%', resizeMode:'contain'}}/>
                                            }
                                            </TouchableOpacity>
                                        </View>
                                        <View style = {styles.email_app_check_view}>
                                            <TouchableOpacity style = {styles.check_box_touch} onPress = {() => {
                                                if(this.state.messaged_me_push == "0") {
                                                    this.setState({
                                                        messaged_me_push: "1", 
                                                    }, () => this.save_notification_setting());
                                                } else {
                                                    this.setState({
                                                        messaged_me_push: "0", 
                                                    }, () => this.save_notification_setting());
                                                };
                                                this.setState({
                                                    push: true
                                                })
                                            }}>
                                                <Image source={require('../icons/square.png')} style={{width: '100%', height: '100%', resizeMode:'contain'}}/>
                                            {
                                                this.state.messaged_me_push == '1' &&
                                                <Image source={require('../icons/checked.png')} style={{position:'absolute', top: 0, left: 0, width: '100%', height: '100%', resizeMode:'contain'}}/>
                                            }
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </View>
                                <View style = {[styles.component_view, {backgroundColor: '#00000005'}]}>
                                    <View style={styles.prevImageView}>
                                        <Image source={images.notiInvitedMe} style={{width: '100%', height: '100%', resizeMode:'contain'}}/>
                                    </View>
                                    <View style = {{flex: 1}}>
                                        <Text style = {[styles.title_text, stylesGlobal.font]}>Invited Me Personally</Text>
                                    </View>
                                    <View style = {styles.check_view}>
                                        <View style = {styles.email_app_check_view}>
                                            <TouchableOpacity style = {styles.check_box_touch} disabled={true} onPress = {() => {
                                                if(this.state.invited_me_personally == "0") {
                                                    this.setState({
                                                        invited_me_personally: "1", 
                                                    }, () => this.save_notification_setting());
                                                } else {
                                                    this.setState({
                                                        invited_me_personally: "0", 
                                                    }, () => this.save_notification_setting());
                                                };
                                                this.setState({
                                                    post: true
                                                })
                                            }}>
                                                <Image source={require('../icons/square.png')} style={{width: '100%', height: '100%', resizeMode:'contain'}}/>
                                            {
                                                this.state.invited_me_personally == '1' &&
                                                <Image source={require('../icons/checked.png')} style={{position:'absolute', top: 0, left: 0, width: '100%', height: '100%', resizeMode:'contain'}}/>
                                            }
                                            </TouchableOpacity>
                                        </View>
                                        <View style = {styles.email_app_check_view}>
                                            <TouchableOpacity style = {styles.check_box_touch} disabled={true}  onPress = {() => {
                                                if(this.state.invited_me_personally_push == "0") {
                                                    this.setState({
                                                        invited_me_personally_push: "1", 
                                                    }, () => this.save_notification_setting());
                                                } else {
                                                    this.setState({
                                                        invited_me_personally_push: "0", 
                                                    }, () => this.save_notification_setting());
                                                };
                                                this.setState({
                                                    push: true
                                                })
                                            }}>
                                                <Image source={require('../icons/square.png')} style={{width: '100%', height: '100%', resizeMode:'contain'}}/>
                                            {
                                                this.state.invited_me_personally_push == '1' &&
                                                <Image source={require('../icons/checked.png')} style={{position:'absolute', top: 0, left: 0, width: '100%', height: '100%', resizeMode:'contain'}}/>
                                            }
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </View>
                                <View style = {styles.component_view}>
                                    <View style={styles.prevImageView}>
                                        <Image source={images.notiPartyTrip} style={{width: '100%', height: '100%', resizeMode:'contain'}}/>
                                    </View>
                                    <View style = {{flex: 1}}>
                                        <Text style = {[styles.title_text, stylesGlobal.font]}>Member Parties {'&'} Trips</Text>
                                    </View>
                                    <View style = {styles.check_view}>
                                        <View style = {styles.email_app_check_view}>
                                            <TouchableOpacity style = {styles.check_box_touch} onPress = {() => {
                                                if(this.state.member_parties_and_trips == "0") {
                                                    this.setState({
                                                        member_parties_and_trips: "1", 
                                                    }, () => this.save_notification_setting());
                                                } else {
                                                    this.setState({
                                                        member_parties_and_trips: "0", 
                                                    }, () => this.save_notification_setting());
                                                };
                                                this.setState({
                                                    post: true
                                                })
                                            }}>
                                                <Image source={require('../icons/square.png')} style={{width: '100%', height: '100%', resizeMode:'contain'}}/>
                                            {
                                                this.state.member_parties_and_trips == '1' &&
                                                <Image source={require('../icons/checked.png')} style={{position:'absolute', top: 0, left: 0, width: '100%', height: '100%', resizeMode:'contain'}}/>
                                            }
                                            </TouchableOpacity>
                                        </View>
                                        <View style = {styles.email_app_check_view}>
                                            <TouchableOpacity style = {styles.check_box_touch} onPress = {() => {
                                                if(this.state.member_parties_and_trips_push == "0") {
                                                    this.setState({
                                                        member_parties_and_trips_push: "1", 
                                                    }, () => this.save_notification_setting());
                                                } else {
                                                    this.setState({
                                                        member_parties_and_trips_push: "0", 
                                                    }, () => this.save_notification_setting());
                                                };
                                                this.setState({
                                                    push: true
                                                })
                                            }}>
                                                <Image source={require('../icons/square.png')} style={{width: '100%', height: '100%', resizeMode:'contain'}}/>
                                            {
                                                this.state.member_parties_and_trips_push == '1' &&
                                                <Image source={require('../icons/checked.png')} style={{position:'absolute', top: 0, left: 0, width: '100%', height: '100%', resizeMode:'contain'}}/>
                                            }
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </View>
                                <View style = {styles.component_view}>
                                    <View style={styles.prevImageView}>
                                        <Image source={images.notiParties} style={{width: '100%', height: '100%', resizeMode:'contain'}}/>
                                    </View>
                                    <View style = {{flex: 1}}>
                                        <Text style = {[styles.title_text, stylesGlobal.font]}>Post on Parties {'&'} Trips</Text>
                                    </View>
                                    <View style = {styles.check_view}>
                                        <View style = {styles.email_app_check_view}>
                                            <TouchableOpacity style = {styles.check_box_touch} onPress = {() => {
                                                if(this.state.posts_parties_and_trips == "0") {
                                                    this.setState({
                                                        posts_parties_and_trips: "1", 
                                                    }, () => this.save_notification_setting());
                                                } else {
                                                    this.setState({
                                                        posts_parties_and_trips: "0", 
                                                    }, () => this.save_notification_setting());
                                                };
                                                this.setState({
                                                    post: true
                                                })
                                            }}>
                                                <Image source={require('../icons/square.png')} style={{width: '100%', height: '100%', resizeMode:'contain'}}/>
                                            {
                                                this.state.posts_parties_and_trips == '1' &&
                                                <Image source={require('../icons/checked.png')} style={{position:'absolute', top: 0, left: 0, width: '100%', height: '100%', resizeMode:'contain'}}/>
                                            }
                                            </TouchableOpacity>
                                        </View>
                                        <View style = {styles.email_app_check_view}>
                                            <TouchableOpacity style = {styles.check_box_touch} onPress = {() => {
                                                if(this.state.posts_parties_and_trips_push == "0") {
                                                    this.setState({
                                                        posts_parties_and_trips_push: "1", 
                                                    }, () => this.save_notification_setting());
                                                } else {
                                                    this.setState({
                                                        posts_parties_and_trips_push: "0", 
                                                    }, () => this.save_notification_setting());
                                                };
                                                this.setState({
                                                    push: true
                                                })
                                            }}>
                                                <Image source={require('../icons/square.png')} style={{width: '100%', height: '100%', resizeMode:'contain'}}/>
                                            {
                                                this.state.posts_parties_and_trips_push == '1' &&
                                                <Image source={require('../icons/checked.png')} style={{position:'absolute', top: 0, left: 0, width: '100%', height: '100%', resizeMode:'contain'}}/>
                                            }
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </View>
                                <View style = {styles.component_view}>
                                    <View style={styles.prevImageView}>
                                        <Image source={images.notiMemberStatus} style={{width: '100%', height: '100%', resizeMode:'contain'}}/>
                                    </View>
                                    <View style = {{flex: 1, flexDirection: 'row'}}>
                                        <Text style = {[styles.title_text, stylesGlobal.font, ]}>Member Status Update / Posts</Text>
                                    </View>
                                    <View style = {styles.check_view}>
                                        <View style = {styles.email_app_check_view}>
                                            <TouchableOpacity style = {styles.check_box_touch} onPress = {() => {
                                                if(this.state.member_status_updates_and_posts == "0") {
                                                    this.setState({
                                                        member_status_updates_and_posts: "1", 
                                                    }, () => this.save_notification_setting());
                                                } else {
                                                    this.setState({
                                                        member_status_updates_and_posts: "0", 
                                                    }, () => this.save_notification_setting());
                                                };
                                                this.setState({
                                                    post: true
                                                })
                                            }}>
                                                <Image source={require('../icons/square.png')} style={{width: '100%', height: '100%', resizeMode:'contain'}}/>
                                            {
                                                this.state.member_status_updates_and_posts == '1' &&
                                                <Image source={require('../icons/checked.png')} style={{position:'absolute', top: 0, left: 0, width: '100%', height: '100%', resizeMode:'contain'}}/>
                                            }
                                            </TouchableOpacity>
                                        </View>
                                        <View style = {styles.email_app_check_view}>
                                            <TouchableOpacity style = {styles.check_box_touch} onPress = {() => {
                                                if(this.state.member_status_updates_and_posts_push == "0") {
                                                    this.setState({
                                                        member_status_updates_and_posts_push: "1", 
                                                    }, () => this.save_notification_setting());
                                                } else {
                                                    this.setState({
                                                        member_status_updates_and_posts_push: "0", 
                                                    }, () => this.save_notification_setting());
                                                };
                                                this.setState({
                                                    push: true
                                                })
                                            }}>
                                                <Image source={require('../icons/square.png')} style={{width: '100%', height: '100%', resizeMode:'contain'}}/>
                                            {
                                                this.state.member_status_updates_and_posts_push == '1' &&
                                                <Image source={require('../icons/checked.png')} style={{position:'absolute', top: 0, left: 0, width: '100%', height: '100%', resizeMode:'contain'}}/>
                                            }
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </View>
                                <View style = {styles.component_view}>
                                    <View style={styles.prevImageView}>
                                        <Image source={images.notiReactions} style={{width: '100%', height: '100%', resizeMode:'contain'}}/>
                                    </View>
                                    <View style = {{flex: 1}}>
                                        <Text style = {[styles.title_text, stylesGlobal.font]}>Reactions to My Posts</Text>
                                    </View>
                                    <View style = {styles.check_view}>
                                        <View style = {styles.email_app_check_view}>
                                            <TouchableOpacity style = {styles.check_box_touch} onPress = {() => {
                                                if(this.state.reactions_to_my_posts == "0") {
                                                    this.setState({
                                                        reactions_to_my_posts: "1", 
                                                    }, () => this.save_notification_setting());
                                                } else {
                                                    this.setState({
                                                        reactions_to_my_posts: "0", 
                                                    }, () => this.save_notification_setting());
                                                };
                                                this.setState({
                                                    post: true
                                                })
                                            }}>
                                                <Image source={require('../icons/square.png')} style={{width: '100%', height: '100%', resizeMode:'contain'}}/>
                                            {
                                                this.state.reactions_to_my_posts == '1' &&
                                                <Image source={require('../icons/checked.png')} style={{position:'absolute', top: 0, left: 0, width: '100%', height: '100%', resizeMode:'contain'}}/>
                                            }
                                            </TouchableOpacity>
                                        </View>
                                        <View style = {styles.email_app_check_view}>
                                            <TouchableOpacity style = {styles.check_box_touch} onPress = {() => {
                                                if(this.state.reactions_to_my_posts_push == "0") {
                                                    this.setState({
                                                        reactions_to_my_posts_push: "1", 
                                                    }, () => this.save_notification_setting());
                                                } else {
                                                    this.setState({
                                                        reactions_to_my_posts_push: "0", 
                                                    }, () => this.save_notification_setting());
                                                };
                                                this.setState({
                                                    push: true
                                                })
                                            }}>
                                                <Image source={require('../icons/square.png')} style={{width: '100%', height: '100%', resizeMode:'contain'}}/>
                                            {
                                                this.state.reactions_to_my_posts_push == '1' &&
                                                <Image source={require('../icons/checked.png')} style={{position:'absolute', top: 0, left: 0, width: '100%', height: '100%', resizeMode:'contain'}}/>
                                            }
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </View>
                                <View style = {styles.component_view}>
                                    <View style={styles.prevImageView}>
                                        <Image source={images.notiRsvpForParties} style={{width: '100%', height: '100%', resizeMode:'contain'}}/>
                                    </View>
                                    <View style = {{flex: 1}}>
                                        <Text style = {[styles.title_text, stylesGlobal.font]}>RSVPs for My Parties {'&'} Trips</Text>
                                    </View>
                                    <View style = {styles.check_view}>
                                        <View style = {styles.email_app_check_view}>
                                            <TouchableOpacity style = {styles.check_box_touch} onPress = {() => {
                                                if(this.state.rsvps_for_my_parties_and_trips == "0") {
                                                    this.setState({
                                                        rsvps_for_my_parties_and_trips: "1", 
                                                    }, () => this.save_notification_setting());
                                                } else {
                                                    this.setState({
                                                        rsvps_for_my_parties_and_trips: "0", 
                                                    }, () => this.save_notification_setting());
                                                };
                                                this.setState({
                                                    post: true
                                                })
                                            }}>
                                                <Image source={require('../icons/square.png')} style={{width: '100%', height: '100%', resizeMode:'contain'}}/>
                                            {
                                                this.state.rsvps_for_my_parties_and_trips == '1' &&
                                                <Image source={require('../icons/checked.png')} style={{position:'absolute', top: 0, left: 0, width: '100%', height: '100%', resizeMode:'contain'}}/>
                                            }
                                            </TouchableOpacity>
                                        </View>
                                        <View style = {styles.email_app_check_view}>
                                            <TouchableOpacity style = {styles.check_box_touch} onPress = {() => {
                                                if(this.state.rsvps_for_my_parties_and_trips_push == "0") {
                                                    this.setState({
                                                        rsvps_for_my_parties_and_trips_push: "1", 
                                                    }, () => this.save_notification_setting());
                                                } else {
                                                    this.setState({
                                                        rsvps_for_my_parties_and_trips_push: "0", 
                                                    }, () => this.save_notification_setting());
                                                };
                                                this.setState({
                                                    push: true
                                                })
                                            }}>
                                                <Image source={require('../icons/square.png')} style={{width: '100%', height: '100%', resizeMode:'contain'}}/>
                                            {
                                                this.state.rsvps_for_my_parties_and_trips_push == '1' &&
                                                <Image source={require('../icons/checked.png')} style={{position:'absolute', top: 0, left: 0, width: '100%', height: '100%', resizeMode:'contain'}}/>
                                            }
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </View>
                                <View style = {styles.component_view}>
                                    <View style={styles.prevImageView}>
                                        <Image source={images.notiPayments} style={{width: '100%', height: '100%', resizeMode:'contain'}}/>
                                    </View>
                                    <View style = {{flex: 1}}>
                                        <Text style = {[styles.title_text, stylesGlobal.font]}>Payments {'&'} Credits</Text>
                                    </View>
                                    <View style = {styles.check_view}>
                                        <View style = {styles.email_app_check_view}>
                                            <TouchableOpacity style = {styles.check_box_touch} onPress = {() => {
                                                if(this.state.payments_and_credits == "0") {
                                                    this.setState({
                                                        payments_and_credits: "1", 
                                                    }, () => this.save_notification_setting());
                                                } else {
                                                    this.setState({
                                                        payments_and_credits: "0", 
                                                    }, () => this.save_notification_setting());
                                                };
                                                this.setState({
                                                    post: true
                                                })
                                            }}>
                                                <Image source={require('../icons/square.png')} style={{width: '100%', height: '100%', resizeMode:'contain'}}/>
                                            {
                                                this.state.payments_and_credits == '1' &&
                                                <Image source={require('../icons/checked.png')} style={{position:'absolute', top: 0, left: 0, width: '100%', height: '100%', resizeMode:'contain'}}/>
                                            }
                                            </TouchableOpacity>
                                        </View>
                                        <View style = {styles.email_app_check_view}>
                                            <TouchableOpacity style = {styles.check_box_touch} onPress = {() => {
                                                if(this.state.payments_and_credits_push == "0") {
                                                    this.setState({
                                                        payments_and_credits_push: "1", 
                                                    }, () => this.save_notification_setting());
                                                } else {
                                                    this.setState({
                                                        payments_and_credits_push: "0", 
                                                    }, () => this.save_notification_setting());
                                                };
                                                this.setState({
                                                    push: true
                                                })
                                            }}>
                                                <Image source={require('../icons/square.png')} style={{width: '100%', height: '100%', resizeMode:'contain'}}/>
                                            {
                                                this.state.payments_and_credits_push == '1' &&
                                                <Image source={require('../icons/checked.png')} style={{position:'absolute', top: 0, left: 0, width: '100%', height: '100%', resizeMode:'contain'}}/>
                                            }
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </View>
                                <View style = {styles.component_view}>
                                    <View style={styles.prevImageView}>
                                        <Image source={images.notiNewFeatures} style={{width: '100%', height: '100%', resizeMode:'contain'}}/>
                                    </View>
                                    <View style = {{flex: 1}}>
                                        <Text style = {[styles.title_text, stylesGlobal.font]}>New Features in App/Web</Text>
                                    </View>
                                    <View style = {styles.check_view}>
                                        <View style = {styles.email_app_check_view}>
                                            <TouchableOpacity style = {styles.check_box_touch} onPress = {() => {
                                                if(this.state.new_features_in_app_and_web == "0") {
                                                    this.setState({
                                                        new_features_in_app_and_web: "1", 
                                                    }, () => this.save_notification_setting());
                                                } else {
                                                    this.setState({
                                                        new_features_in_app_and_web: "0", 
                                                    }, () => this.save_notification_setting());
                                                };
                                                this.setState({
                                                    post: true
                                                })
                                            }}>
                                                <Image source={require('../icons/square.png')} style={{width: '100%', height: '100%', resizeMode:'contain'}}/>
                                            {
                                                this.state.new_features_in_app_and_web == '1' &&
                                                <Image source={require('../icons/checked.png')} style={{position:'absolute', top: 0, left: 0, width: '100%', height: '100%', resizeMode:'contain'}}/>
                                            }
                                            </TouchableOpacity>
                                        </View>
                                        <View style = {styles.email_app_check_view}>
                                            <TouchableOpacity style = {styles.check_box_touch} onPress = {() => {
                                                if(this.state.new_features_in_app_and_web_push == "0") {
                                                    this.setState({
                                                        new_features_in_app_and_web_push: "1", 
                                                    }, () => this.save_notification_setting());
                                                } else {
                                                    this.setState({
                                                        new_features_in_app_and_web_push: "0", 
                                                    }, () => this.save_notification_setting());
                                                };
                                                this.setState({
                                                    push: true
                                                })
                                            }}>
                                                <Image source={require('../icons/square.png')} style={{width: '100%', height: '100%', resizeMode:'contain'}}/>
                                            {
                                                this.state.new_features_in_app_and_web_push == '1' &&
                                                <Image source={require('../icons/checked.png')} style={{position:'absolute', top: 0, left: 0, width: '100%', height: '100%', resizeMode:'contain'}}/>
                                            }
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </View>
                                <View style = {styles.component_view}>
                                    <View style={styles.prevImageView}>
                                        <Image source={images.notiSpecialOfferes} style={{width: '100%', height: '100%', resizeMode:'contain'}}/>
                                    </View>
                                    <View style = {{flex: 1}}>
                                        <Text style = {[styles.title_text, stylesGlobal.font]}>Special Offers</Text>
                                    </View>
                                    <View style = {styles.check_view}>
                                        <View style = {styles.email_app_check_view}>
                                            <TouchableOpacity style = {styles.check_box_touch} onPress = {() => {
                                                if(this.state.special_offers == "0") {
                                                    this.setState({
                                                        special_offers: "1", 
                                                    }, () => this.save_notification_setting());
                                                } else {
                                                    this.setState({
                                                        special_offers: "0", 
                                                    }, () => this.save_notification_setting());
                                                };
                                                this.setState({
                                                    post: true
                                                })
                                            }}>
                                                <Image source={require('../icons/square.png')} style={{width: '100%', height: '100%', resizeMode:'contain'}}/>
                                            {
                                                this.state.special_offers == '1' &&
                                                <Image source={require('../icons/checked.png')} style={{position:'absolute', top: 0, left: 0, width: '100%', height: '100%', resizeMode:'contain'}}/>
                                            }
                                            </TouchableOpacity>
                                        </View>
                                        <View style = {styles.email_app_check_view}>
                                            <TouchableOpacity style = {styles.check_box_touch} onPress = {() => {
                                                if(this.state.special_offers_push == "0") {
                                                    this.setState({
                                                        special_offers_push: "1", 
                                                    }, () => this.save_notification_setting());
                                                } else {
                                                    this.setState({
                                                        special_offers_push: "0", 
                                                    }, () => this.save_notification_setting());
                                                };
                                                this.setState({
                                                    push: true
                                                })
                                            }}>
                                                <Image source={require('../icons/square.png')} style={{width: '100%', height: '100%', resizeMode:'contain'}}/>
                                            {
                                                this.state.special_offers_push == '1' &&
                                                <Image source={require('../icons/checked.png')} style={{position:'absolute', top: 0, left: 0, width: '100%', height: '100%', resizeMode:'contain'}}/>
                                            }
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </View>
                                <View style = {[styles.component_view, {backgroundColor: '#00000005'}]}>
                                    <View style={styles.prevImageView}>
                                        <Image source={images.notiReceivedGifts} style={{width: '100%', height: '100%', resizeMode:'contain'}}/>
                                    </View>
                                    <View style = {{flex: 1}}>
                                        <Text style = {[styles.title_text, stylesGlobal.font]}>Received Gifts / Roses</Text>
                                    </View>
                                    <View style = {styles.check_view}>
                                        <View style = {styles.email_app_check_view}>
                                            <TouchableOpacity style = {styles.check_box_touch} disabled={true}  onPress = {() => {
                                                if(this.state.received_gifts_and_roses == "0") {
                                                    this.setState({
                                                        received_gifts_and_roses: "1", 
                                                    }, () => this.save_notification_setting());
                                                } else {
                                                    this.setState({
                                                        received_gifts_and_roses: "0", 
                                                    }, () => this.save_notification_setting());
                                                };
                                                this.setState({
                                                    post: true
                                                })
                                            }}>
                                                <Image source={require('../icons/square.png')} style={{width: '100%', height: '100%', resizeMode:'contain'}}/>
                                            {
                                                this.state.received_gifts_and_roses == '1' &&
                                                <Image source={require('../icons/checked.png')} style={{position:'absolute', top: 0, left: 0, width: '100%', height: '100%', resizeMode:'contain'}}/>
                                            }
                                            </TouchableOpacity>
                                        </View>
                                        <View style = {styles.email_app_check_view}>
                                            <TouchableOpacity style = {styles.check_box_touch} disabled={true}  onPress = {() => {
                                                if(this.state.received_gifts_and_roses_push == "0") {
                                                    this.setState({
                                                        received_gifts_and_roses_push: "1", 
                                                    }, () => this.save_notification_setting());
                                                } else {
                                                    this.setState({
                                                        received_gifts_and_roses_push: "0", 
                                                    }, () => this.save_notification_setting());
                                                };
                                                this.setState({
                                                    push: true
                                                })
                                            }}>
                                                <Image source={require('../icons/square.png')} style={{width: '100%', height: '100%', resizeMode:'contain'}}/>
                                            {
                                                this.state.received_gifts_and_roses_push == '1' &&
                                                <Image source={require('../icons/checked.png')} style={{position:'absolute', top: 0, left: 0, width: '100%', height: '100%', resizeMode:'contain'}}/>
                                            }
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </View>
                                <View style = {styles.component_view}>
                                    <View style={styles.prevImageView}>
                                        <Image source={images.notiMemberFav} style={{width: '100%', height: '100%', resizeMode:'contain'}}/>
                                    </View>
                                    <View style = {{flex: 1}}>
                                        <Text style = {[styles.title_text, stylesGlobal.font]}>Member {'&'} Favorites Birthdays</Text>
                                    </View>
                                    <View style = {styles.check_view}>
                                        <View style = {styles.email_app_check_view}>
                                            <TouchableOpacity style = {styles.check_box_touch} onPress = {() => {
                                                if(this.state.member_and_favorites_birthday == "0") {
                                                    this.setState({
                                                        member_and_favorites_birthday: "1", 
                                                    }, () => this.save_notification_setting());
                                                } else {
                                                    this.setState({
                                                        member_and_favorites_birthday: "0", 
                                                    }, () => this.save_notification_setting());
                                                };
                                                this.setState({
                                                    post: true
                                                })
                                            }}>
                                                <Image source={require('../icons/square.png')} style={{width: '100%', height: '100%', resizeMode:'contain'}}/>
                                            {
                                                this.state.member_and_favorites_birthday == '1' &&
                                                <Image source={require('../icons/checked.png')} style={{position:'absolute', top: 0, left: 0, width: '100%', height: '100%', resizeMode:'contain'}}/>
                                            }
                                            </TouchableOpacity>
                                        </View>
                                        <View style = {styles.email_app_check_view}>
                                            <TouchableOpacity style = {styles.check_box_touch} onPress = {() => {
                                                if(this.state.member_and_favorites_birthday_push == "0") {
                                                    this.setState({
                                                        member_and_favorites_birthday_push: "1", 
                                                    }, () => this.save_notification_setting());
                                                } else {
                                                    this.setState({
                                                        member_and_favorites_birthday_push: "0", 
                                                    }, () => this.save_notification_setting());
                                                };
                                                this.setState({
                                                    push: true
                                                })
                                            }}>
                                                <Image source={require('../icons/square.png')} style={{width: '100%', height: '100%', resizeMode:'contain'}}/>
                                            {
                                                this.state.member_and_favorites_birthday_push == '1' &&
                                                <Image source={require('../icons/checked.png')} style={{position:'absolute', top: 0, left: 0, width: '100%', height: '100%', resizeMode:'contain'}}/>
                                            }
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </View>
                                <View style = {styles.component_view}>
                                    <View style={styles.prevImageView}>
                                        <Image source={images.notiFollowedMe} style={{width: '100%', height: '100%', resizeMode:'contain'}}/>
                                    </View>
                                    <View style = {{flex: 1}}>
                                        <Text style = {[styles.title_text, stylesGlobal.font]}>Followed Me</Text>
                                    </View>
                                    <View style = {styles.check_view}>
                                        <View style = {styles.email_app_check_view}>
                                            <TouchableOpacity style = {styles.check_box_touch} onPress = {() => {
                                                if(this.state.follow_me == "0") {
                                                    this.setState({
                                                        follow_me: "1", 
                                                    }, () => this.save_notification_setting());
                                                } else {
                                                    this.setState({
                                                        follow_me: "0", 
                                                    }, () => this.save_notification_setting());
                                                };
                                                this.setState({
                                                    post: true
                                                })
                                            }}>
                                                <Image source={require('../icons/square.png')} style={{width: '100%', height: '100%', resizeMode:'contain'}}/>
                                            {
                                                this.state.follow_me == '1' &&
                                                <Image source={require('../icons/checked.png')} style={{position:'absolute', top: 0, left: 0, width: '100%', height: '100%', resizeMode:'contain'}}/>
                                            }
                                            </TouchableOpacity>
                                        </View>
                                        <View style = {styles.email_app_check_view}>
                                            <TouchableOpacity style = {styles.check_box_touch} onPress = {() => {
                                                if(this.state.follow_me_push == "0") {
                                                    this.setState({
                                                        follow_me_push: "1", 
                                                    }, () => this.save_notification_setting());
                                                } else {
                                                    this.setState({
                                                        follow_me_push: "0", 
                                                    }, () => this.save_notification_setting());
                                                };
                                                this.setState({
                                                    push: true
                                                })
                                            }}>
                                                <Image source={require('../icons/square.png')} style={{width: '100%', height: '100%', resizeMode:'contain'}}/>
                                            {
                                                this.state.follow_me_push == '1' &&
                                                <Image source={require('../icons/checked.png')} style={{position:'absolute', top: 0, left: 0, width: '100%', height: '100%', resizeMode:'contain'}}/>
                                            }
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </View>
                            </ScrollView>
                        </View>
                        {/* <TouchableOpacity style = {[styles.button_style, stylesGlobal.shadow_style]} onPress = {() => this.save_notification_setting()}> */}
                        {/*     <Text style = {[styles.button_text, stylesGlobal.font]}>Save</Text> */}
                        {/* </TouchableOpacity> */}
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
    card_view: {
        width: '90%',
        height: '90%',
        alignItems: 'center',
        backgroundColor: Colors.white,
        borderRadius: 10,
        shadowColor: Colors.white,
        shadowOffset: {
            width: 0,
            height: 0
        },
        shadowRadius: 7,
        shadowOpacity: 7.0,
    },
    title_header: { 
        width: '100%', 
        height: 40, 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: Colors.card_titlecolor,
        borderTopRightRadius: 10,
        borderTopLeftRadius: 10,
        overflow: 'hidden'
    },
    headText: {
        color: Colors.gold,
        fontSize: 20,
        // fontWeight: 'bold'
    },
    component_view: {
        width: '100%', 
        paddingLeft: 20,
        paddingRight: 10, 
        marginTop: 20,
        flexDirection: 'row',
        alignItems: 'center',
        height: 30,
    },
    prevImageView:{
        width: 20,
        height: 20,
        marginRight: 10,
    },
    check_view: {
        flexDirection: 'row', 
        alignItems: 'center',
        width: 80,
    },
    email_app_check_view: {
        width: '50%',
        justifyContent: 'center',
        alignItems: 'center'
    },
    check_box_touch: {
        width: 20, 
        height: 20
    },
    title_text: {
        fontSize: 14, 
        color: Colors.black,
        flexWrap: 'wrap',
        
    },
    text_input_style: {
        width: '100%', 
        height: 40, 
        marginTop: 10, 
        borderColor: Colors.black, 
        borderWidth: 0.5, 
        borderRadius: 3, 
        paddingLeft: 5
    },
    button_style: {
        // width: '50%',
        // height: 40,
        marginVertical: 15,
        backgroundColor: Colors.gold,
        borderRadius: 5,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal:30,
        paddingVertical:10
    },
    button_text: {
        fontSize: 14,
        color: Colors.white,
        
    }
});
