import React, { Component } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    Dimensions,
    StyleSheet,
} from "react-native";
import { EventRegister } from 'react-native-event-listeners';
import { Colors } from "../consts/Colors";
import { Constants } from "../consts/Constants";
import { ImageCompressor } from './ImageCompressorClass';
import {stylesGlobal} from '../consts/StyleSheet';
import Moment from "moment/moment";
import { extendMoment } from "moment-range";
import { getRecentLoginTimeFrame} from "../utils/Util";

var { width, height } = Dimensions.get("window");
width = width > height ? height : width;
const imageWidth = width / 3;
var TAG = "RowRecentLogin";

export default class RowRecentLogin extends Component {

    UNSAFE_componentWillMount() {
        this.listener = EventRegister.addEventListener(Constants.EVENT_PROFILE_IMAGE_UPDATED, () => {
            console.log(TAG,"EVENT_PROFILE_IMAGE_UPDATED event called");
        })
    }
    
    componentWillUnmount() {
        EventRegister.removeEventListener(this.listener)
    }

    getLastLoginTime() {
        var data = this.props.data;
        var last_login_text = ""; 
        if(data.last_lognedin != null && data.last_lognedin != "") {
            var last_login_date = new Date(data.last_lognedin);
            var current_date = new Date(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate(), new Date().getUTCHours(), new Date().getUTCMinutes(), new Date().getUTCSeconds());
            const moment = extendMoment(Moment);
            const diff_dates = moment.range(last_login_date, current_date);
            if(diff_dates.diff('years') > 0) {
                last_login_text = diff_dates.diff('years');
                if(diff_dates.diff('years') > 1) {
                    last_login_text += " years ago";
                } else {
                    last_login_text += " year ago";
                }
            } else if(diff_dates.diff('months') > 0) {
                last_login_text = diff_dates.diff('months');
                if(diff_dates.diff('months') > 1) {
                    last_login_text += " months ago";
                } else {
                    last_login_text += " month ago";
                }
            } else if(diff_dates.diff('weeks') > 0) {
                last_login_text = diff_dates.diff('weeks');
                if(diff_dates.diff('weeks') > 1) {
                    last_login_text += " weeks ago";
                } else {
                    last_login_text += " week ago";
                }
            } else if(diff_dates.diff('days') > 0) {
                if(diff_dates.diff('days') > 1) {
                    last_login_text += diff_dates.diff('days') + " days ago"
                } else {
                    last_login_text += "yesterday";
                }
            } else if(diff_dates.diff('hours') > 0) {
                if(diff_dates.diff('hours') > 12) {
                    last_login_text += "today";
                } else if(diff_dates.diff('hours') > 1) {
                    last_login_text += diff_dates.diff('hours') + " hours ago";
                } else {
                    last_login_text += diff_dates.diff('hours') + " hour ago";
                }
            } else if(diff_dates.diff('minutes') > 0) {
                last_login_text = diff_dates.diff('minutes');
                if(diff_dates.diff('minutes') > 1) {
                    last_login_text += " minutes ago";
                } else {
                    last_login_text += " minute ago";
                }
            } else if(diff_dates.diff('seconds') > 0) {
                last_login_text = diff_dates.diff('seconds');
                if(diff_dates.diff('seconds') > 1) {
                    last_login_text += " seconds ago";
                } else {
                    last_login_text += " second ago";
                }
            }
        }
        return last_login_text;
    }
    
/** 
  * display discover feature account info
  */
    render() {
        var data = this.props.data;
				var traveling = this.props.traveling;
        var fullName = data.first_name + " " + data.last_name;
        var url = data.imgpath + Constants.THUMB_FOLDER + data.filename;
        var slug = data.slug;
        var last_login_text = getRecentLoginTimeFrame(data.last_lognedin);

        return (
            <TouchableOpacity
                activeOpacity={1}
                onPress={() => {
                    if (data.user_id === this.props.userId) {
                        this.props.screenProps.navigate("MyProfile",{
                            refreshProfileImage:this.props.refreshProfileImage
                        });
                    } else {
                        this.props.screenProps.navigate("ProfileDetail", {
                            slug: slug
                        });
                    }
                }}
            >
                <View style={styles.container}>
                    <View style={styles.imageContainer}>
                        <ImageCompressor uri={url} style={styles.image}/>
                    </View>
                    <Text style={[styles.name, stylesGlobal.font]}>{fullName}</Text>
										{traveling && <Text style={[styles.recent_login_text, stylesGlobal.font]}>{data.traveling_address}</Text>}
										{traveling && <Text style={[styles.recent_login_text, stylesGlobal.font]}>{Moment(data.from_date).format('DD MMM YYYY')} - {Moment(data.to_date).format('DD MMM YYYY')}</Text>}
                    {!traveling && <Text style={[styles.recent_login_text, stylesGlobal.font]}>{last_login_text}</Text>}
                </View>
            </TouchableOpacity>
        );
    }
}
const styles = StyleSheet.create({
    container: {
        // backgroundColor: Colors.white,
        padding: 15,
        alignItems: 'center',
        marginTop: 10
    },
    imageContainer: {
        flex: 1,
        width: imageWidth,
        height: imageWidth,
        // backgroundColor: Colors.white,
        alignSelf: "center",
        borderRadius: imageWidth / 2,
        overflow: 'hidden',
    },
    image: {
        width: imageWidth,
        height: imageWidth,
        overflow: 'hidden',
        backgroundColor: Colors.gray,
        borderRadius: 10,
    },
    roundCornerView: {
        position: 'absolute',
        top: -(10),
        bottom: -(10),
        right: -(10),
        left: -(10),
        borderRadius: 15,
        borderWidth: (10),
        borderColor: Colors.white
    },
    name: {
        color: Colors.gold,
        fontSize: 13,
        backgroundColor: Colors.transparent,
        marginTop: 5
    },
    recent_login_text: {
        color: Colors.black,
        fontSize: 11,
        backgroundColor: Colors.transparent,
    }
});
