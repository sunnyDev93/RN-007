import React, { Component } from "react";
import {
    Image,
    View
} from "react-native";
import Emojis from '../customview/Emojis';
import Moment from "moment/moment";
import { extendMoment } from "moment-range";
import Memory from '../core/Memory';
import WebService from "../core/WebService";
import * as Global from "../consts/Global";
import { Platform, PermissionsAndroid } from 'react-native'
import GeoLocation from '@react-native-community/geolocation'
import {stylesGlobal} from '../consts/StyleSheet';
import { ImageCompressor } from '../components/ImageCompressorClass'

const TAG = 'Utils';


export const TimeCompare = (serverTime, timezone = "EST") => {
    var date = new Date().toLocaleString('en-US', {timeZone: timezone });
    var dateTime = Moment(date).format("DD MMM YYYY HH:mm:ss");
    serverTime = Moment(serverTime).utc().format('DD MMM YYYY HH:mm:ss') ;
    return serverTime >= dateTime;
}

export const StringFormat = () => {
    if (!String.prototype.format) {
        String.prototype.format = function () {
            var args = arguments;
            return this.replace(/{(\d+)}/g, function (match, number) {
                return typeof args[number] != 'undefined'
                    ? args[number]
                    : match
                    ;
            });
        };
    }
}


export const StringStartsWith = () => {
    if (typeof String.prototype.startsWith != 'function') {
        // see below for better implementation!
        String.prototype.startsWith = function (str) {
            return this.indexOf(str) === 0;
        };
    }
}

export const getProfileSubStr = (userProfileInfo) => {
    const { member_plan, type: userType = '', networth_amount = 0, age, fans } = userProfileInfo || {}
    let subText = ''
    switch (String(member_plan)) {
        // 1: Rich, 2: Generous, 3: Model, 4: VIP Fan, 5: connector, 6: Famous, 7: fan, 8:Alumni, 9: Applicant
        case String(1):
            //todo: show net worth (networth_amount)
            // subText = `Net Worth $${networth_amount || 0}`
            break
        case String(2):
            break;
        case String(3):
            // if(age != null && age != 0) {
            //     subText = `Age ${age || 0}`
            // }
            break;
        case String(4):
            break;
        case String(7):
            break;
        case String(8):
            // subText = `Age ${age || 0}`
            break
        case String(6):
            if(fans != null && fans != 0) {
                subText = `Fans ${fans || 0}`
            }
            break
        case String(5):
            // todo: acc. to card in trello need to show number of people whoe favourited him/her
            // subText = `Age ${age || 0}`
            break
    }
    return subText
}

export const removeCountryCode = (phoneNumber) => {
    return String(phoneNumber).replace(/^\+[0-9]{1}/,'')
}

export const convertEmojimessagetoString = (messageText) => {
    var index = 0;
    var emojiexist = false;
    while(index < messageText.length) {
        emojiexist = false;
        for(let j = 1; j < 4; j ++) {
            if(index + j < messageText.length) {
                let char = messageText.substring(index, index + j)
                for (let k = 0; k < Emojis.emojis.length; k++) {
                    let emoji = Emojis.emojis[k];
                    if(emoji.emoji == char) {
                        emojiexist = true;
                        messageText = messageText.substring(0, index) + " " + char + " " + messageText.substring(index + j, messageText.length)
                        index += j;
                        break;
                    }
                }
                if(emojiexist) {
                    break;
                }
            }
        }
        if(!emojiexist) {
            index ++
        }
    }

    let newHtml = [];
    newHtml = messageText.split(' ')
    var message = '';
    newHtml.map((item) => {
        let char = item;
        if (char.trim().length > 0) {
            let isEmoji = false;
            let unicode = char;
            for (let i = 0; i < Emojis.emojis.length; i++) {
                let emoji = Emojis.emojis[i];
                if (emoji.emoji === char) {
                    unicode = " :" + emoji.name + ": ";
                    isEmoji = true
                    break;
                }
            }
            if (isEmoji) {
                message = message + " " + unicode;
            } else {
                message = message + " " + char;
            }
        } else {
            message = message + " " + char;
        }
    })
    return message.substring(1);
}

export const convertStringtoEmojimessage = (messageText) => {

    let newHtml = [];
    newHtml = messageText.split(' ')
    var message = '';
    newHtml.map((item) => {
        let char = item;
        
        if (char.trim().length > 0) {
            let isEmoji = false;
            let emoji_value = null;
            for (let i = 0; i < Emojis.emojis.length; i++) {
                let emoji = Emojis.emojis[i];
                if(char.substring(0, 1) == ":" && char.substring(char.length - 1) == ":") {
                    if (emoji.name === char.substring(1, char.length - 1)) {
                        emoji_value = emoji.emoji;
                        isEmoji = true
                        break;
                    }
                }
            }

            if (isEmoji) {
                message = message + emoji_value;
            } else {
                message = message + " " + char;
            }
        } else {
            // message = message + " " + char;
        }
    })
    return message.substring(1);
}

export const getUserAge = (dob) => {
    if (dob != undefined && dob != null && dob != 0 && dob != "Not Set" && dob != "") {
        var age = parseInt(Moment(new Date()).format("YYYY"), 10) - parseInt(Moment(dob).format("YYYY"), 10);
        if(!isNaN(age) && age != 0) {
            if(new Date(dob).getMonth() > new Date().getMonth()) {
                age -= 1;
            } else if( new Date(dob).getMonth() == new Date().getMonth()) {
                if(new Date(dob).getDate() > new Date().getDate()) {
                    age -= 1;
                }
            }
            return age;
        } else {
            return 0;
        }
    } else {
        return 0;
    }
}

export const getRecentLoginTimeFrame = (last_lognedin) => {
    if(!last_lognedin)
        return "A long time ago";
    var last_login_text = ""; 
    const moment = extendMoment(Moment);
    var current_date = new Date().toISOString();
    var days = Math.round((moment(current_date) - moment(last_lognedin)) / 86400000);
    if(days > 7 && days <= 31) last_login_text = "Recently";
    else if(days > 31 && days <= 365) last_login_text = "A while ago";
    else if(days > 365) last_login_text = "A long time ago"; 
    else last_login_text = moment(last_lognedin).fromNow();

//     if(last_lognedin != null && last_lognedin != "") {
//         var last_login_date = Moment(last_lognedin).format();
//         //var current_date = new Date(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate(), new Date().getUTCHours(), new Date().getUTCMinutes(), new Date().getUTCSeconds());
//         var current_date = new Date().toISOString();
//         const moment = extendMoment(Moment);
//         const diff_dates = moment.range(last_lognedin, current_date);
// 
//         //console.log('Utils etRecentLoginTimeFrame', current_date, new Date().getUTCHours())
//         if(diff_dates.diff('years') > 0) {
//             last_login_text = diff_dates.diff('years');
//             if(diff_dates.diff('years') > 1) {
//                 last_login_text += " years ago";
//             } else {
//                 last_login_text += " year ago";
//             }
//         } else if(diff_dates.diff('months') > 0) {
//             last_login_text = diff_dates.diff('months');
//             if(diff_dates.diff('months') > 1) {
//                 last_login_text += " months ago";
//             } else {
//                 last_login_text += " month ago";
//             }
//         } else if(diff_dates.diff('weeks') > 0) {
//             last_login_text = diff_dates.diff('weeks');
//             if(diff_dates.diff('weeks') > 1) {
//                 last_login_text += " weeks ago";
//             } else {
//                 last_login_text += " week ago";
//             }
//         } else if(diff_dates.diff('days') > 0) {
//             if(diff_dates.diff('days') > 1) {
//                 last_login_text += diff_dates.diff('days') + " days ago"
//             } else {
//                 last_login_text += "yesterday";
//             }
//         } else if(diff_dates.diff('hours') > 0) {
//             if(diff_dates.diff('hours') > 12) {
//                 last_login_text += "today";
//             } else if(diff_dates.diff('hours') > 1) {
//                 last_login_text += diff_dates.diff('hours') + " hours ago";
//             } else {
//                 last_login_text += diff_dates.diff('hours') + " hour ago";
//             }
//         } else if(diff_dates.diff('minutes') > 0) {
//             last_login_text = diff_dates.diff('minutes');
//             if(diff_dates.diff('minutes') > 1) {
//                 last_login_text += " minutes ago";
//             } else {
//                 last_login_text += " minute ago";
//             }
//         } else if(diff_dates.diff('seconds') > 0) {
//             last_login_text = moment(last_lognedin).fromNow();
//             // last_login_text = diff_dates.diff('seconds');
//             // if(diff_dates.diff('seconds') > 1) {
//             //     last_login_text += " seconds ago";
//             // } else {
//             //     last_login_text += " second ago";
//             // }
//         } else {
//             last_login_text = " today 222";
//         }
//     } else {
//         last_login_text = " today 333";
//     }
    
    return last_login_text;
}

export const getEventsForInvite = async(invited_user, userId, userToken) => {
    
    let uri = Memory().env == "LIVE" ? Global.URL_INVITE_EVENTS : Global.URL_INVITE_EVENTS_DEV

    let params = new FormData();
    params.append("token", userToken);
    params.append("user_id", userId);
    params.append("format", "json");
    params.append("receiver_id", invited_user.user_id);

    console.log(" callGetEventListAPI uri " + uri);
    console.log(" callGetEventListAPI params " + JSON.stringify(params));
    
    const response  = await fetch(uri, {method: "POST", body: params})
    if(response.status == 200) {
        const jRes = await response.json()
        console.log(" callGetEventListAPI response:  " + JSON.stringify(jRes));
        if(jRes.status == "success") {
            var event_endDateTime = "";
            var events = [];
            if (jRes.data.events.length > 0) {
                jRes.data.events.map((i, j) => {
                    event_endDateTime = Moment(i.to_date).format('MM/DD/YYYY') + " " + i.to_time;
                    if(new Date(event_endDateTime) > new Date()) {
                        if(i.invitation_id == null) {
                            i.check = false;
                        } else {
                            i.check = true;
                        }
                        events.push(i);
                    }
                });
            }
            jRes.data.events = events;
        }
        return jRes
    } else {
        return {"status": "error", "msg": "network_error"};
    }
}

export const callInviteUserToEvent = async(invited_user, invite_event_list, userId, userToken) => {
    
    let uri = Memory().env == "LIVE" ? Global.URL_INVITE_USER_TO_EVENTS : Global.URL_INVITE_USER_TO_EVENTS_DEV

    let params = new FormData();
    params.append("token", userToken);
    params.append("user_id", userId);
    params.append("format", "json");
    params.append("userId", invited_user.user_id);
    var index = 0
    for (var i = 0; i < invite_event_list.length; i++) {
        if(invite_event_list[i].check) {
            console.log(">>>:invite_event_list",invite_event_list[i].id);
            params.append("event[" + index + "]", invite_event_list[i].id);
            index ++;
        }
    }
    console.log(" callInviteUserToEventAPI uri " + uri);
    console.log(" callInviteUserToEventAPI params " + JSON.stringify(params));

    const response  = await fetch(uri, {
        method: "POST",
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json"
        },
        body: JSON.stringify(params)
    });
    if(response.status == 200) {
        const jRes = await response.json()
        console.log(" callInviteUserToEventAPI response:  " + JSON.stringify(jRes));
        
        return jRes
    } else {
        return {"status": "error", "msg": "network_error"};
    }
}

export const callFavoriteMember = async(data, userId, userToken) => {

    let uri = Memory().env == "LIVE" ? Global.URL_FAVOURITE_ACTION : Global.URL_FAVOURITE_ACTION_DEV

    let params = {
        "token": userToken,
        "user_id": userId,
        "format": "json",
        "req_user_id": data.user_id,
        "type":"add",
    }
    if (data.st != null) {
        if (data.st == 0) {
            params.type = "add";
        } else {
            params.type = "remove";
        }
    } else {
        if (data.favorite_id == null) {
            params.type = "add";
        } else {
            params.type = "remove";
        }
    }

    console.log(" callFavoriteMembertAPI uri " + uri);
    console.log(" callFavoriteMembertAPI params " + JSON.stringify(params));

    const response  = await fetch(uri, {
        method: "POST", 
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json"
        },
        body: JSON.stringify(params)
    })
    console.log('callFavoriteMembertAPI response code', response.status);
    if(response.status == 200) {
        const jRes = await response.json()
        console.log(" callFavoriteMembertAPI response:  " + JSON.stringify(jRes));
        
        return jRes
    } else {
        console.log(TAG, 'callFavoriteMembertAPI reponse error', response.json());
        return {"status": "error", "msg": "network_error"};
    }
}

export const callFollowRequest = async(data, userId, userToken) => {

    let uri = Memory().env == "LIVE" ? Global.URL_FOLLOW_REQUEST : Global.URL_FOLLOW_REQUEST_DEV ;
    let params = {
        "token": userToken,
        "user_id": userId,
        "format": "json"
    };
    if(data.following_id) {
        params.type = "unfollow";
    } else {
        params.type = "follow";
    }
    params.request_id = data.user_id;
    params.requestUserId = data.user_id;

    console.log(" callFollowRequestAPI uri " + uri);
    console.log(" callFollowRequestAPI params " + JSON.stringify(params));

    try{
        const response  = await fetch(uri, {
            method: "POST", 
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json"
            },
            body: JSON.stringify(params)});
        console.log(" callFollowRequestAPI result", response);
        if(response.status == 200) {
            const jRes = await response.json()
            console.log(" callFollowRequestAPI response:  " + JSON.stringify(jRes));
            
            return jRes
        } else {
            return {"status": "error", "msg": "network_error"};
        }
    }catch(e)
    {
        console.log(" callFollowRequestAPI exception ", e);    
    }
    
    
};

export const getUserLocation = async (successCallback, errorCallBack, options) => {

   

    let geolocationConroller
    if (Platform.OS == 'android') {
        geolocationConroller = GeoLocation
        const alreadyGranted = PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION)
        let granted = alreadyGranted
        
        if (!granted) {
            const permissionResult = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION)
            granted = permissionResult === PermissionsAndroid.RESULTS.GRANTED
        }
        if (!granted) { return;  }
    } else {
        // iOS Platform
        await GeoLocation.setRNConfiguration({ authorizationLevel: "whenInUse" });
        geolocationConroller = GeoLocation
        await geolocationConroller.requestAuthorization()
    }

    console.log("android permission is granted")
    geolocationConroller.getCurrentPosition(successCallback, errorCallBack, options)

}

export const getRibbonImage = (data) => {
       
    var imagePath = null;
    for(i = 0; i < Global.entriesAll.length; i ++) {
        if(data.member_plan.toString() == Global.entriesAll[i].type.toString()) {
            imagePath = Global.entriesAll[i].tag;
            break;
        }
    }
// 
// 
//     console.log('!!!!!!-------------->>>>>   ', data);

    if(data.profileBadge )
    {

        console.log('utilss =====   ', data.profileBadge);
        return (
            <View style={[ stylesGlobal.ribbon]}>
                <Image style={{width: '100%', height: '100%', resizeMode: 'contain'}} source={{uri: data.profileBadge}} />
            </View>
        );
    }else{
        if(data.is_verified == "1" || data.member_plan == "4" || data.member_plan == "7") {
            return (
                <View style={[ stylesGlobal.ribbon]}>
                    <Image style={{width: '100%', height: '100%', resizeMode: 'contain'}} source={{uri: imagePath}} />
                </View>
            );
        } else {
            return (
                <View style={stylesGlobal.ribbon}>
                    <Image style={{width: '100%', height: '100%', resizeMode: 'contain'}} source={require("../icons/Profile-Badges-Applicant.png")} />
                </View>
            );
        }
//             if(data.user_id) {
//                 if(data.is_verified)
//                 {
//                     imagePath = null;
//                     for(i = 0; i < Global.entriesAll.length; i ++) {
//                         if(data.membership.toString() == Global.entriesAll[i].type.toString()) {
//                             imagePath = Global.entriesAll[i].tag;
//                             break;
//                         }
//                     }
//                     return (
//                         <View style={[ stylesGlobal.ribbon]}>
//                             <Image style={{width: '100%', height: '100%', resizeMode: 'contain'}} source={{uri: imagePath}} />
//                         </View>
//                     );
//                 }
//                     
//                 else 
//                     return (
//                         <View style={stylesGlobal.ribbon}>
//                             <Image style={{width: '100%', height: '100%', resizeMode: 'contain'}} source={require("../icons/Profile-Badges-Applicant.png")} />
//                         </View>
//                     );
//             } else
//             {
//                 imagePath = null;
//                 for(i = 0; i < Global.entriesAll.length; i ++) {
//                     if(data.member_type.toString() == Global.entriesAll[i].type.toString()) {
//                         imagePath = Global.entriesAll[i].tag;
//                         break;
//                     }
//                 }
// 
//                 return (
//                     <View style={[ stylesGlobal.ribbon]}>
//                         <Image style={{width: '100%', height: '100%', resizeMode: 'contain'}} source={{uri: imagePath}} />
//                     </View>
//                 );
//             }
    } 


        

  
}
