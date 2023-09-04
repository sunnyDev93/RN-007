import React, { Component } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    Dimensions,
    StyleSheet,
    Platform,
    Image,
} from "react-native";
import { EventRegister } from 'react-native-event-listeners'
import { Colors } from "../consts/Colors";
import { Constants } from "../consts/Constants";
import Moment from "moment/moment";
import { extendMoment } from "moment-range";
const { width } = Dimensions.get("window");
import { ImageCompressor } from './ImageCompressorClass'
import { stylesGlobal } from '../consts/StyleSheet'


var imageSize = 60;
var imagePadding = 10;
var cardPadding = 10;
var messageWidth = width - imageSize - imagePadding * 3;
var TAG = "RowRecentMessage";
export default class RowRecentMessage extends Component {
    constructor(props) {
        super(props);
        this.state = {
            showComment: false,
            showPicker: false,
            commentValue: ""
        };
    }

    UNSAFE_componentWillMount() {
        this.listener = EventRegister.addEventListener(Constants.EVENT_PROFILE_IMAGE_UPDATED, () => {
            console.log(TAG, "EVENT_PROFILE_IMAGE_UPDATED event called");
        })
    }

    componentWillUnmount() {
        EventRegister.removeEventListener(this.listener)
    }

    render() {
        var data = this.props.data;

        let onlineStatus = undefined;

        if(data.last_loginedin && data.last_loginedin != null && data.last_loginedin != "")
        {
            var current_date = new Date().toISOString();
            const moment = extendMoment(Moment);

            const diff_dates = moment.range(data.last_loginedin, current_date);
            if(diff_dates.diff('minutes') <= 5)
            {
                onlineStatus = "Online";
            } 
            else if (diff_dates.diff('days') <= 7)
            {
                onlineStatus = "Last seen " + moment(data.last_loginedin).fromNow();
            }else{
                onlineStatus = "hide";
                //return <></>;
            }
        }

        


         // console.log(TAG, 'RowRecentMessage data ======   ', data);
        return (
            <TouchableOpacity
                onPress={() => {
                    this.props.onPressItem(data);
                    // if (data.role === 'group') {
                    //     var group = {
                    //         groupId: data.userId,
                    //         groupName: data.n,
                    //         groupImage: data.imgpath,
                    //         groupMember: data.member,
                    //         groupCreatedBy: data.createdby,
                    //     };
                    //     this.props.screenProps.navigate("GroupChat", {
                    //         group: group,
                    //         refreshList: this.props.refreshList,
                    //         messageId: data.message_id
                    //     });
                    // } else {
                    //     var user = {
                    //         first_name: data.first_name,
                    //         last_name: data.last_name,
                    //         slug: data.slug,
                    //         imgpath: data.imgpath,
                    //         filename: data.filename,
                    //         id: data.userId,
                    //         imageUri: data.imgpath
                    //     };
                    //     this.props.screenProps.navigate("UserChat", {
                    //         user: user,
                    //         refreshList: this.props.refreshList,
                    //         messageId: data.message_id
                    //     });
                    // }
                }}
            >
                {this.renderRecentRow(onlineStatus)}
            </TouchableOpacity>
        );
    }


    replaceImageUrlsInText = (source) => {
        if(!source)
            return "";
        let msgText = source.replaceAll("http://www.007percent.com", "https://www.the007percent.com");
          msgText = msgText.replaceAll("http://www.dev.007percent.com", "https://www.the007percent.com");
          msgText = msgText.replaceAll("http://chat.007percent.com", "https://www.the007percent.com");
          msgText = msgText.replaceAll("http://chat.dev.007percent.com", "https://www.the007percent.com");
        return msgText;
    }

    /**
         * display recent message row
         */
    renderRecentRow(onlineStatus) {
        var data = this.props.data;
        var first_name = data.first_name;
        console.log(first_name);
        var id = data.id;
        var last_name = data.last_name;
        var slug = data.slug;
        var filename = data.filename;
        var message_id = data.message_id;
        var message = data.m;
        var created_at = data.created_at;
        var is_login = data.is_login;
        var status_message = data.status_message;
        var type = data.type;
        var is_text = data.is_text;
        var notification_type = data['notification-type'];
        var status = data.status;
        var fullName = first_name + " " + last_name;
        var mesage_date = data.t; // Number(data.t) * 1000;
        var url = data.imgpath;
        var is_old = data.is_old;

        var newMsgCnt = "";
        if(data.newMsgCnt > 0)
            newMsgCnt = data.newMsgCnt.toString();
        //newMsgCnt = newMsgCnt + "00";
        if(newMsgCnt.length > 2)
        {
            newMsgCnt = newMsgCnt.substring(0, 1);
            newMsgCnt = newMsgCnt + "..";
        }
        if (data.role === 'group') {
            url = "";
            fullName = first_name;
        }
        return (
            <View style={styles.container}>
                <TouchableOpacity
                    onPress={() => {
                        if (data.id === this.props.userId) {
                            this.props.screenProps.navigate("MyProfile", {
                                refreshProfileImage: this.props.refreshProfileImage
                            });
                        } else {
                            this.props.screenProps.navigate("ProfileDetail", {
                                slug: slug
                            });
                        }
                        // if (data.role === 'group') {
                        //     this.props.screenProps.navigate("GroupDetail", {
                        //         groupId: data.userId,
                        //         groupName: data.n,
                        //         groupImage: data.imgpath,
                        //         groupMember: data.member,
                        //         groupCreatedBy: data.createdby,
                        //         refreshList: this.props.refreshList,
                        //     });
                        // } else {
                        //     if (data.id === this.props.userId) {
                        //         this.props.screenProps.navigate("MyProfile", {
                        //             refreshProfileImage: this.props.refreshProfileImage
                        //         });
                        //     } else {
                        //         this.props.screenProps.navigate("ProfileDetail", {
                        //             slug: slug
                        //         });
                        //     }
                        // }
                    }}
                >
                    {data.role === 'group' ? this.renderGroupImageView(data) :
                        <View style={styles.userImageContainer}>
                            <ImageCompressor uri={url} style={styles.userImage} />
                        </View>
                    }
                </TouchableOpacity>
                <View style={styles.messageContainer}>
                    <View style={styles.titleContainer}>
                        <View style={styles.nameContainer}>
                            <Text style={[styles.name, stylesGlobal.font]}>{fullName}</Text>
                            {/* {this.getUserStatusFromType(status)} */}
                        </View>
                        <Text style={[styles.date, stylesGlobal.font]}>
                            {Moment.utc(mesage_date).local().format("hh:mm A") + " | " + Moment.utc(mesage_date).local().format("DD MMM YYYY")}
                        </Text>
                    </View>
                    <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                        {this.displayMessage(data)}
                        {newMsgCnt.length > 0 && 
                            <View style={{backgroundColor: 'red', borderRadius: 20, width: 20, height: 20, alignItems: 'center', justifyContent: 'center',flexDirection: 'row'}}>
                                <Text style={{color: 'white', fontSize: 14, }}>{newMsgCnt}</Text>
                            </View>
                        }
                    </View>

{/*                     {onlineStatus && */}
{/*                         <> */}
{/*                             { */}
{/*                                 onlineStatus === "Online" ?  */}
{/*                                     <Text style={[styles.date, stylesGlobal.font]}> */}
{/*                                         {onlineStatus} */}
{/*                                     </Text> */}
{/*                                 : */}
{/*                                     <Text style={[styles.date, stylesGlobal.font,{color: 'gray'}]}> */}
{/*                                         {onlineStatus} */}
{/*                                     </Text> */}
{/*  */}
{/*                             } */}
{/*                         </> */}
{/*                     } */}
                </View>
            </View>
        );
    }
    /**
           * display group icon
           */
    renderGroupImageView = (data) => {
        var url1 = null;
        var url2 = null;
        var url3 = null;
        var groupImages = [];
        var count = 0;
        if (data.imgpath != undefined && data.imgpath != null) {
            groupImages = data.imgpath.split('||IMAGE||');
            count = groupImages.length;
            if (count > 1) {
                url1 = groupImages[0]
                if (count > 1) {
                    url2 = groupImages[1]
                }
                if (count > 2) {
                    url3 = groupImages[2]
                }
            }
        }
        return (
            <View>
                {count <= 1 ?
                    <View style={[styles.userImageContainer, { backgroundColor: Colors.gold }]}>
                        <Image
                            style={[styles.userImage, {
                                backgroundColor: Colors.transparent,
                                width: imageSize - 10,
                                height: imageSize - 10,
                                margin: 5,
                                overflow: 'hidden',
                            }]}
                            source={require("../icons/icon_default_group.png")}
                            default={require("../icons/icon_default_group.png")}
                        />
                    </View>
                    :
                    <View style={{
                        backgroundColor: Colors.green,
                        width: imageSize,
                        height: imageSize,
                        borderRadius: imageSize / 2,
                        overflow: 'hidden',
                        flexDirection: 'column'
                    }}>
                        <View style={[styles.leftHalfCircler, { position: 'absolute', top: 0, left: 0 }]}>
                            <ImageCompressor
                                uri={url1}
                                style={styles.leftHalfCircler}
                            />
                        </View>
                        <View style={[styles.rightHalfCircle, { position: 'absolute', top: 0, right: 0 }]}>
                            {count < 3 ? <ImageCompressor
                                uri={url2}
                                style={styles.rightHalfCircle}
                            /> : null}
                            {count > 2 ? <ImageCompressor
                                uri={url2}
                                style={styles.secondImage}
                            /> : null}

                            {count > 2 ? <ImageCompressor
                                uri={url3}
                                style={styles.thirdImage}
                            /> : null}
                        </View>
                    </View>
                }
            </View>
        );
    }

    unicodeToChar = (text) => {
        return text.replace(/\\u[\dA-F]{4}/gi,
            function (match) {
                return String.fromCharCode(parseInt(match.replace(/\\u/g, ''), 16));
            });
    };
    /**
           * display message
           */
    displayMessage = (data) => {
        var messageText = "";

        var str = this.replaceImageUrlsInText(data.m);
        try {
            messageText = decodeURIComponent(this.unicodeToChar(str));
            let newData = messageText.split('<br>');
            var newMessage = "";
            let length = newData.length;
            newData.map((i, j) => {
                if (j == 0) {
                    newMessage = i
                } else {
                    newMessage = newMessage + "\n" + i
                }
            });
            messageText = this.replaceImageUrlsInText(newMessage);
        } catch (error) {
            messageText = this.replaceImageUrlsInText(str);
        }
        if (data.type == "new_group") {
            return (
                <Text style={[styles.message, stylesGlobal.font]} multiline={false} numberOfLines={1}></Text>
            );
        } else if (data.type == "deleted_message") {
            return (
                <Text style={[styles.message, stylesGlobal.font]} multiline={false} numberOfLines={1}>{messageText}</Text>
            );
        } else if (data.type == "kickuser") {
            return (
                <Text style={[styles.message, stylesGlobal.font]} multiline={false} numberOfLines={1}>{messageText}</Text>
            );
        } else if (data.type == "image") {
            return (
                <Text style={[styles.message, stylesGlobal.font]} multiline={false} numberOfLines={1}>Image</Text>
            );
        } else if (data.type == "text") {
            return (
                <View style={{flex: 1, flexDirection: 'row'}}>
                    <Text style={[styles.message, stylesGlobal.font, {flex: 1, flexWrap: 'wrap', }]} >
                        {messageText}
                    </Text>
                </View>
                
            );
        } else if (data.type == "smiley") {
            return (
                <Text style={[styles.message, stylesGlobal.font]} multiline={false} numberOfLines={1}>{messageText}</Text>
            );
        }
        else if (data.type == "video") {
            return (
                <Text style={[styles.message, stylesGlobal.font]} multiline={false} numberOfLines={1}>Video</Text>
            );
        }
        else if (data.type == "file") {
            return (
                <Text style={[styles.message, stylesGlobal.font]} multiline={false} numberOfLines={1}>File</Text>
            );
        }
        else {
            return (
                <Text style={[styles.message, stylesGlobal.font]} multiline={false} numberOfLines={1}>Attachment</Text>
            );
        }
    };
    /**
           * display user status
           */
    getUserStatusFromType = (status) => {
        if (status == "available") {
            return (
                <Image
                    style={styles.type}
                    source={require("../icons/img-chat-online.png")}
                />
            );
        } else if (status == "away") {
            return (
                <Image
                    style={styles.type}
                    source={require("../icons/img-chat-away.png")}
                />
            );
        } else if (status == "busy") {
            return (
                <Image
                    style={styles.type}
                    source={require("../icons/img-chat-busy.png")}
                />
            );
        }
        else if (status == "offline") {
            return (
                <Image
                    style={styles.type}
                    source={require("../icons/img-chat-offline.png")}
                />
            );
        }
        else if (status == "invisible") {
            return (
                <Image
                    style={styles.type}
                    source={require("../icons/img-chat-online.png")}
                />
            );
        }
        else {
            return (
                <Image
                    style={styles.type}
                    source={require("../icons/img-chat-online.png")}
                />
            );
        }
    };
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: Colors.white,
        padding: cardPadding,
        flexDirection: "row",
        borderBottomColor: Colors.gray,
        borderBottomWidth: 1
    },
    userImageContainer: {
        backgroundColor: Colors.gray,
        width: imageSize,
        height: imageSize,
        borderRadius: imageSize / 2,
        // overflow: 'hidden',
    },
    userImage: {
        overflow: 'hidden',
        backgroundColor: Colors.white,
        borderRadius: imageSize / 2,
        width: imageSize,
        height: imageSize
    },
    userImageCirle: {
        position: 'absolute',
        top: -(imageSize / 2),
        bottom: -(imageSize / 2),
        right: -(imageSize / 2),
        left: -(imageSize / 2),
        borderRadius: imageSize / 2 + imageSize / 4,
        borderWidth: (imageSize / 2),
        borderColor: Colors.white
    },
    messageContainer: {
        flexDirection: "column",
        marginLeft: cardPadding
    },
    titleContainer: {
        width: messageWidth,
        paddingBottom: 1,
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 1,
    },
    nameContainer: {
        flex: 1,
        flexDirection: "row",
        marginRight: 10
    },
    name: {
        fontSize: 15,
        color: Colors.black,
        backgroundColor: Colors.transparent
    },
    type: {
        width: 10,
        height: 10,
        marginLeft: 5,
        marginRight: 5,
        marginTop: 5
    },
    date: {
        fontSize: 13,
        color: Colors.gold,
        backgroundColor: Colors.transparent,
        marginLeft: 10
    },
    message: {
        fontSize: 14,
        color: Colors.gray,
        marginTop: 2,
    },
    leftHalfCircler: {
        backgroundColor: Colors.gray,
        width: imageSize / 2,
        height: imageSize,
        overflow: 'hidden',
        borderTopLeftRadius: imageSize / 2,
        borderTopRightRadius: 0,
        borderBottomLeftRadius: imageSize / 2,
        borderBottomRightRadius: 0,
    },
    rightHalfCircle: {
        backgroundColor: Colors.gray,
        width: imageSize / 2,
        height: imageSize,
        overflow: 'hidden',
        borderTopLeftRadius: 0,
        borderTopRightRadius: imageSize / 2,
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: imageSize / 2,
    },
    secondImage: {
        backgroundColor: Colors.gray,
        width: imageSize / 2,
        height: imageSize / 2,
        overflow: 'hidden',
        borderTopLeftRadius: 0,
        borderTopRightRadius: imageSize / 2,
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
    },
    thirdImage: {
        backgroundColor: Colors.gray,
        width: imageSize / 2,
        height: imageSize / 2,
        overflow: 'hidden',
        borderTopLeftRadius: 0,
        borderTopRightRadius: 0,
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: imageSize / 2,
    }
});
