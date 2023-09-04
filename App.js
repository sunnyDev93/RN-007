
import React, {useEffect, useRef, useState} from 'react';
import { View, AppState, Linking, Alert } from 'react-native';
import {fcmService} from './app/utils/FCMService';
import {localNotificationService} from './app/utils/LocalNotificationService';
import RootNavigator from "./app/components/RootNavigator";
import MyStatusBar from "./app/components/MyStatusBar";
import {Colors} from "./app/consts/Colors";
import AsyncStorage from '@react-native-community/async-storage';
import {Constants} from "./app/consts/Constants";
import * as Global from "./app/consts/Global";
import { EventRegister } from 'react-native-event-listeners';
import Memory from './app/core/Memory';
import WebService from "./app/core/WebService";
import * as RootNavigation from './app/utils/ReactNavigation';
import {StatusContext} from './app/context';
import Moment from "moment/moment";
// import SplashScreen from 'react-native-splash-screen';
var Url = require('url-parse');

export default function App() {

    const appState = useRef(AppState.currentState);
    const [appStateVisible, setAppStateVisible] = useState("foreground");
    const [appCurrentScreen, setAppCurrentScreen] = useState("");

    const TAG = "APP ROUTE";

     async function setNotificationBadge(data) {
        console.log(TAG, 'setNotificationBadge', data, appStateVisible)
            var notificationCount = {
                post: 0,
                member: 0,
                event: 0,
                travel: 0,
                gift: 0,
                chat: 0
            };
            try{
                let post_new = await AsyncStorage.getItem('POST');
                if (post_new == null) {
                    post_new = 0;
                }
                notificationCount.post = parseInt(post_new, 10);

                let member_new = await AsyncStorage.getItem('MEMBER');
                if (member_new == null) {
                    member_new = 0;
                }
                notificationCount.member = parseInt(member_new, 10);

                let event_new = await AsyncStorage.getItem('EVENT');
                if (event_new == null) {
                    event_new = 0;
                }
                notificationCount.event = parseInt(event_new, 10);

                let travel_new = await AsyncStorage.getItem('TRAVEL');
                if (travel_new == null) {
                    travel_new = 0;
                }
                notificationCount.travel = parseInt(travel_new, 10);

                let gift_new = await AsyncStorage.getItem('GIFT');
                if (gift_new == null) {
                    gift_new = 0;
                }
                notificationCount.gift = parseInt(gift_new, 10);

                let chat_new = await AsyncStorage.getItem('CHAT');
                if (chat_new == null) {
                    chat_new = 0;
                }
                notificationCount.chat = parseInt(chat_new, 10);
            }catch(e){
                console.log(TAG, 'setNotificationBadge', e.message)
            }
            

            const pageNum = parseInt(data.toPage);
            
            switch (pageNum) {
                case 1:
                    notificationCount.post = notificationCount.post + 1;
                    await AsyncStorage.setItem('POST', `${notificationCount.post}`);
                    EventRegister.emit("dashbard_refresh_whole_page", '');
                    break;
                case 2:
                    notificationCount.member = notificationCount.member + 1;
                    await AsyncStorage.setItem('MEMBER', `${notificationCount.member}`);
                    break;
                case 3:
                    notificationCount.event = notificationCount.event + 1;
                    await AsyncStorage.setItem('EVENT', `${notificationCount.event}`);
                    EventRegister.emit("eventlistscreen_refresh_whole_page", '');
                    break;
                case 4:
                    notificationCount.travel = notificationCount.travel + 1;
                    await AsyncStorage.setItem('TRAVEL', `${notificationCount.travel}`);
                    EventRegister.emit("eventlistscreen_refresh_whole_page", '');
                    break;
                case 5:
                    notificationCount.gift = notificationCount.gift + 1;
                    await AsyncStorage.setItem('GIFT', `${notificationCount.gift}`);
                    break;
                case 6:
                    notificationCount.chat = notificationCount.chat + 1;
                    await AsyncStorage.setItem('CHAT', `${notificationCount.chat}`);
                    break;
                case 7:
                    notificationCount.post = notificationCount.post + 1;
                    await AsyncStorage.setItem('POST', `${notificationCount.post}`);
                    EventRegister.emit("dashbard_refresh_whole_page", '');
                    break;
                default:
                    break;
            }
            EventRegister.emit(Constants.EVENT_NOTIFICATION_CHANGED, '');

            localNotificationService.setIconNotificationBadge(
                notificationCount.post + 
                notificationCount.member + 
                notificationCount.event +
                notificationCount.travel + 
                notificationCount.gift + 
                notificationCount.chat);
        }
  
    useEffect(() => {
        fcmService.registerAppWithFCM();
        fcmService.register(onRegister, onNotification, onOpenNotification);
        localNotificationService.configure(onOpenNotification);

        if(!this.dailyTimer)
    	{
            console.log('created dailyTimer');
    		this.dailyTimer = setInterval(() => {
    			const targetTime = Moment("12:30", "HH:mm");
    			const currentTime = Moment(Moment().format("HH:mm"), "HH:mm");

    			const diff_dates = Moment.range(targetTime, currentTime);
    			if(diff_dates.diff('minutes') < 1)
				{
					if(!this.refreshedToday)
					{
						//refresh
						EventRegister.emit("dashbard_refresh_whole_page", '');
						EventRegister.emit("eventlistscreen_refresh_whole_page", '');
						
						this.refreshedToday = true;
					}
					

				}

				if(diff_dates.diff('minutes') > 1)
				{
					this.refreshedToday = false;
				}
            }, 1000 * 30);

    	}
        
        function onRegister(token) {
            console.log('[App] onRegister: ', token);
            AsyncStorage.setItem(Constants.FIREBASE_ID, token);
        }

        function onNotification(notify, data) {
            console.log('[App] onNotification notification: ', notify);
            console.log('[App] onNotification data: ', data);

            const options = {
                soundName: 'default',
                playSound: true
            }

            // || RootNavigation.getCurrentRoute() != "UserChat"
            
            if(appState.current === "active") {
                localNotificationService.showNotification(
                    0,
                    notify.title,
                    notify.body,
                    notify.image,
                    notify,
                    options
                );
            }


            setNotificationBadge(data);
        }

        function onOpenNotification(notify) {
            console.log('[App] onOpenNotification: ', notify);
            if(notify) {
                const routeName = RootNavigation.getCurrentRoute();
                if(routeName == "Dashboard") {
                    EventRegister.emit(Constants.EVENT_GOTODASHBOARD, '');
                } else {
                    if(notify.toPage && Number(notify.toPage) == 6)
                    {
                        RootNavigation.navigate('Dashboard', {logoclick: true, selected_screen: "chat"});
                    }
                    
                }
            }
            
        }

       

        AppState.addEventListener('change', async(state) => this.handleAppStateChange(state));

        Linking.getInitialURL().then((url) => {
            if (url) {
              this.handleOpenURL(url)
            } else {
                console.log("======================", "url is false")
            }
        }).catch(err => {
            console.log("====================  url error:", err)
        })
        Linking.addEventListener('url', this.handleOpenURL);

        return () => {
            console.log('[App] unRegister:------- ');
            fcmService.unRegister();
            localNotificationService.unregister();
            AppState.removeEventListener('change', handleAppStateChange);
        }

    }, [])

    handleOpenURL = async(url) => {
        const routeName = RootNavigation.getCurrentRoute();
        var url_split = [];
        if(typeof(url) == 'string') {
            url_split = url.split('/');
        } else if(typeof(url) == 'object') {
            url_split = url.url.split('/');
        }
        for(var i = 0; i < url_split.length; i ++) {
            if(url_split[i] == 'event' && (i + 1) < url_split.length && url_split[i + 1] == "view") { // new invitation link
                if(url_split[i + 2] != null) {
                    if(routeName == "SignInScreen") { // app running from close
                        EventRegister.emit(Constants.EVENT_WEB_LINK, {web_link_type: 'new_invitation', id: url_split[i + 2]});
                    } else if(routeName == "EventDetail") { // app running from background
                        EventRegister.emit(Constants.EVENT_EVENT_REFRESH, url_split[i + 2]);
                    } else { // app running from background
                        RootNavigation.navigate("EventDetail", {
                            eventId: url_split[i + 2],
                            loadAfterDeletingEvent: () => {},
                            refreshEventData: () => {},
                        });
                    }
                }
                break;
            }
        }
    }

    handleAppStateChange = (nextAppState) => {
        if(appState.current.match(/inactive|background/) && nextAppState == "active") {
            setAppStateVisible("foreground");
            this.callGetNotificationCountAPI();
        } else {
            //localNotificationService.setIconNotificationBadge(10);
            
            setAppStateVisible("background");
        }
        appState.current = nextAppState;
        // setAppStateVisible(appState.current);
         console.log("=================AppState", appStateVisible);
    }

    callGetNotificationCountAPI = async () => {
        try {

            var userId = await AsyncStorage.getItem(Constants.KEY_USER_ID);
            var userToken = await AsyncStorage.getItem(Constants.KEY_USER_TOKEN);
            if(userId == "" || userId == null ||  userId == undefined || userToken == "" || userToken == null || userToken == undefined) {
                return;
            }
            let uri = Memory().env == "LIVE" ? Global.URL_GET_NOTIFICATION_COUNT : Global.URL_GET_NOTIFICATION_COUNT_DEV;

            let params = new FormData();
            params.append("token", userToken);
            params.append("user_id", userId);
            params.append("format", "json");

            console.log(TAG + " callGetNotificationCountAPI uri " + uri);
            console.log(TAG + " callGetNotificationCountAPI params " + JSON.stringify(params));

            WebService.callServicePost(
                uri,
                params,
                this.handleGetNotificationCountResponse
            );
        } catch (error) {
            console.log("1111111111111111111111111111" + error);
           
        }
    };

    /** Handle send rose Data
     *
     * @param response
     * @param isError
     */

    handleGetNotificationCountResponse = async(response, isError) => {
        console.log(TAG + " callGetNotificationCountAPI result " + JSON.stringify(response));
        console.log(TAG + " callGetNotificationCountAPI isError " + isError);
        if (!isError) {
            try {
                var result = response;
                
                var notificationCount = {
                    post: 0,
                    member: 0,
                    event: 0,
                    travel: 0,
                    gift: 0,
                    chat: 0
                }
                if (result != null) {
                    if (result.status == "success") {
                        var notificationCount = {
                            post: 0,
                            member: 0,
                            event: 0,
                            travel: 0,
                            gift: 0,
                            chat: 0
                        }
                        var post_count = 0;
                        var profile_count = 0;
                        if(result.data != null) {
                            if(result.data.length > 0) {
                                for(i = 0; i < result.data.length; i ++) {
                                    if(result.data[i].notify_type == "1") {
                                        post_count = parseInt(result.data[i].count, 10);
                                    } else if(result.data[i].notify_type == "2") {
                                        notificationCount.member = parseInt(result.data[i].count, 10);
                                    } else if(result.data[i].notify_type == "3") {
                                        notificationCount.event = parseInt(result.data[i].count, 10);
                                    } else if(result.data[i].notify_type == "4") {
                                        notificationCount.travel = parseInt(result.data[i].count, 10);
                                    } else if(result.data[i].notify_type == "5") {
                                        notificationCount.gift = parseInt(result.data[i].count, 10);
                                    } else if(result.data[i].notify_type == "6") {
                                        notificationCount.chat = parseInt(result.data[i].count, 10);
                                    } else if(result.data[i].notify_type == "7") {
                                        profile_count = parseInt(result.data[i].count, 10);
                                    } 
                                }
                                notificationCount.post = post_count + profile_count;

                            } 

                            await AsyncStorage.setItem('POST', `${notificationCount.post}`);
                            await AsyncStorage.setItem('MEMBER', `${notificationCount.member}`);
                            await AsyncStorage.setItem('EVENT', `${notificationCount.event}`);
                            await AsyncStorage.setItem('TRAVEL', `${notificationCount.travel}`);
                            await AsyncStorage.setItem('GIFT', `${notificationCount.gift}`);
                            await AsyncStorage.setItem('CHAT', `${notificationCount.chat}`);
                            if(result.data.length > 0) {
                                EventRegister.emit(Constants.EVENT_NOTIFICATION_CHANGED, '');
                            }
                            let ttt = await AsyncStorage.getItem('POST');
                            console.log(TAG, 'handleGetNotificationCountResponse', 'POST', ttt);
                            localNotificationService.setIconNotificationBadge(
                                notificationCount.post + 
                                notificationCount.member + 
                                notificationCount.event + 
                                notificationCount.travel + 
                                notificationCount.gift + 
                                notificationCount.chat);
                        }
                    } else {
                        
                    }
                }
            } catch (error) {
                console.log(error)
            }
        } else {
            if (response != undefined && response != null && response.length > 0) {
                Alert.alert(response.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
            
        }
    };


    return (
        <StatusContext.Provider value={{refresh: 1}}>
            <View style={{ flex: 1, flexDirection: "column" }}>
                <MyStatusBar backgroundColor={Colors.black} barStyle="light-content" />
                <RootNavigator
                    ref={nav => {this.navigator = nav}}
                    // screenProps={{notificationCount}}
                />
            </View>
        </StatusContext.Provider>
        
    )

}
