
import PushNotification from 'react-native-push-notification';
import PushNotificationIOS from '@react-native-community/push-notification-ios';
import {Platform} from 'react-native'

import notifee from '@notifee/react-native';


class LocalNotificationService {

    configure = (onOpenNotification) => {
        PushNotification.configure({
            onRegister: function (token) {
                console.log("[LocalNotificationService] onRegister: ", token);
            },
            onNotification: function (notification) {
                console.log("[LocalNotificationService] onNotification: ", notification);
                if(!notification?.data) {
                    return;
                }
                notification.userInteraction = true;
                onOpenNotification(Platform.OS == "ios" ? notification.data.item : notification.data);
                if(Platform.OS == 'ios') {
                    // (required) Called when a remote is received or opened, or local notification is opened
                    notification.finish(PushNotificationIOS.FetchResult.NoData);
                }
            },
            // IOS ONLY (optional): default: all - Permissions to register.
            permissions: {
                alert: true,
                badge: true,
                sound: true,
            },
            // Should the initial notification be popped automatically
            // default: true
            popInitialNotification: true,
            /**
             * (optional) default: true
             * - Specified if permissions (ios) and token (android and ios) will requested or not,
             * - if not, you must call PushNotificationsHandler.requestPermissions() later
             * - if you are not using remote notification or do not have Firebase installed, use this:
             *     requestPermissions: Platform.OS === 'ios'
             */
            requestPermissions: true,
        });
    }

    unregister = () => {
        PushNotification.unregister()
    }

    showNotification = async    (id, title, message, image, data = {}, options = {}) => {
        if (Platform.OS === "ios") {
            notifee.displayNotification({
              title: title,
              body: message,
              ios: {
                 foregroundPresentationOptions: {
                      badge: true,
                      sound: true,
                      banner: true,
                      list: true,
                },
                attachments: [
                  
                  {
                    // Remote image
                    url: image,
                  },
                ],
              },
            });
        } else{
            try {
                const channelId = await notifee.createChannel({
                  id: "important",
                  name: "New message arrived",
                  badge: true,
                });
                notifee.displayNotification({
                  title: title,
                  body: message,
                  android: {
                    channelId,
                    // smallIcon: image,
                    largeIcon: image,
                    foregroundPresentationOptions: {
                      badge: true,
                      sound: true,
                      banner: true,
                      list: true,
                    },
                    // badgeIconType: AndroidBadgeIconType.SMALL,
                  },
                });
              } catch (e) {
                console.log("notification on android exception ", e);
              }
        }
        

        // PushNotificationIOS.localNotification({
        //     // Android only property
        //     //...this.buildAndroidNotification(id, title, message, data, options),
        //     //ios and android properties
        //     ...this.buildIOSNotification(id, title, message, data, options),
        //     //ios and android properties
        //     title: title || '',
        //     message: message || '',
        //     playSound: options.playSound || false,
        //     soundName: options.soundName || 'default',
        //     bigPictureUrl: 'https://yt3.googleusercontent.com/ytc/AL5GRJVhQ4VfaYk7tLNMPDyNkgjTqWKnOXhA-NQZ1FFDUA=s176-c-k-c0x00ffffff-no-rj'
        //     userInteraction: false //Boolean: if the notification was opened by the user from the notification center
        // });
    }

    buildAndroidNotification = (id, title, message, data = {}, options = {}) => {
        return {
            id: id,
            autoCancel: true,
            largeIcon: options.largeIcon || 'ic_launcher',
            smallIcon: options.smallIcon || 'ic_notification',
            bigText: message || '',
            subText: title || '',
            vibrate: options.vibrate || true,
            vibration: options.vibration || 300,
            priority: options.priority || "high",
            importance: options.importance || "hight",
            data: data
        }
    }

    buildIOSNotification = (id, title, message, data = {}, options = {}) => {
        return {
            alertAction: options.alertAction || 'view',
            category: options.category || "",
            userInfo: {
                id: id,
                item: data,
                image: 'https://yt3.googleusercontent.com/ytc/AL5GRJVhQ4VfaYk7tLNMPDyNkgjTqWKnOXhA-NQZ1FFDUA=s176-c-k-c0x00ffffff-no-rj'
            }
        }
    }

    cancellAllLocalNotifications = () => {
        if(Platform.OS == 'ios') {
            PushNotificationIOS.removeAllDeliveredNotifications();
        } else {
            PushNotification.cancelAllLocalNotifications();
        }
    }

    removeDeliveredNotificationByID = (notificationId) => {
        console.log("[LocalNotificationService] removeDeliveredNotificationByID: ", notificationId);
        PushNotification.cancelLocalNotifications({id: `${notificationId}`})
    }

    setIconNotificationBadge = (count, pageNum) => {
        console.log('LocalNotificationService', 'setIconNotificationBadge', count);
        PushNotificationIOS.setApplicationIconBadgeNumber(count) //set number to 0
    }
}

export const localNotificationService = new LocalNotificationService()