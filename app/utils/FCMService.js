
import messaging from '@react-native-firebase/messaging'
import {Platform} from 'react-native'

class FCMService {

    register = (onRegister, onNotification, onOpenNotification) => {
        this.checkPermission(onRegister)
        this.createNotificationListeners(onRegister, onNotification, onOpenNotification)
    }

    registerAppWithFCM = async() => {
        if(Platform.OS === "ios") {
            //await messaging().registerDeviceForRemoteMessages();
            await messaging().setAutoInitEnabled(true);
        }
    }

    checkPermission = (onRegister) => {
        messaging().hasPermission()
        .then(enabled => {
            if(enabled) {
                //User has permission
                this.getToken(onRegister)
            } else {
                //User haven't permission
                this.requestPermission(onRegister)
            }
        }).catch(error => {
            console.log("[FCMService] Permission rejected ", error)
        })
    }

    getToken = (onRegister) => {
        messaging().getToken()
        .then(fcmToken => {
            if(fcmToken) {
                console.log("[FCMService] device token: ", fcmToken)
                onRegister(fcmToken)
            } else {
                console.log("[FCMService] User haven't device token")
            }
        }).catch(error => {
            console.log("[FCMService] getToken error ", error)
        })
    }

    requestPermission = (onRegister) => {
        messaging().requestPermission()
        .then(() => {
            this.getToken(onRegister)
        }).catch(error => {
            console.log("[FCMService] Request Permission rejected ", error)
        })
    }

    deleteToken = () => {
        messaging().deleteToken()
        .catch(error => {
            console.log("[FCMService] Delete token error ", error)
        })
    }

    createNotificationListeners = (onRegister, onNotification, onOpenNotification) => {
        //when the application is running, but in the background
        messaging().onNotificationOpenedApp(remoteMessage => {
            console.log("[FCMService] onNotificationOpenedApp Notification caused app to open from background")
            if(remoteMessage) {
                const notification = remoteMessage.notification
                onOpenNotification(notification)
                // this.removeDeliveredNotification(notification.notificationId)
            }
        })

        // when app is opened from a quit state
        messaging().getInitialNotification()
        .then(remoteMessage => {
            console.log("[FCMService] getInitialNotification Notification caused app to open from quit state")
            if(remoteMessage) {
                const notification = remoteMessage.notification
                onOpenNotification(notification)
                // this.removeDeliveredNotification(notification.notificationId)
            }
        })

        //background state messages
        messaging().setBackgroundMessageHandler(async remoteMessage => {
            console.log("[FCMService] A new FCM message arrived in background", JSON.stringify(remoteMessage));
            //console.log("Message handled in the background!", remoteMessage);
            // {"messageId":"1684956940907524","data":{"toPage":"1","fcm_options":{"image":"https://yt3.googleusercontent.com/ytc/AL5GRJVhQ4VfaYk7tLNMPDyNkgjTqWKnOXhA-NQZ1FFDUA=s176-c-k-c0x00ffffff-no-rj"}},"contentAvailable":true,"mutableContent":true,"notification":{"ios":{"badge":2},"title":"ok","sound":"1","body":"hello"}}
            if(remoteMessage) {
                let notification = null
                if(Platform.OS == "ios") {
                    notification = remoteMessage.notification;
                    notification.image = remoteMessage.data.fcm_options.image;
                } else {
                    notification = remoteMessage.notification;
                    notification.image = notification.android.imageUrl;
                }   
                
                // onNotification(notification);
                onNotification(notification, remoteMessage.data);
            }
            
        })

        //Foreground state messages
        this.messageListener = messaging().onMessage(async remoteMessage => {
            console.log("[FCMService] A new FCM message arrived!", JSON.stringify(remoteMessage))
            if(remoteMessage) {
                let notification = null
                if(Platform.OS == "ios") {
                    notification = remoteMessage.notification;
                    notification.image = remoteMessage.data.fcm_options.image;
                } else {
                    notification = remoteMessage.notification;
                    notification.image = notification.android.imageUrl;
                }
                
                // onNotification(notification);
                onNotification(notification, remoteMessage.data);
            }
        });

        // notifications().onNotification(notification => {
        //     console.log('FCMService onNotification', notification)
        // });

        //Triggered when have new token
        messaging().onTokenRefresh(fcmToken => {
            console.log("[FCMService] New token refresh: ", fcmToken)
            onRegister(fcmToken)
        })
    }

    unRegister = () => {
        this.messageListener();
        

    }

}

export const fcmService = new FCMService()