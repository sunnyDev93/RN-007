import React, { Component } from "react";
import {
    Alert,
    View,
    Text,
    Dimensions,
    StyleSheet,
    Image,
    Linking,
    TouchableOpacity,
} from "react-native";
import HTML from 'react-native-render-html';
import { ImageCompressor } from './ImageCompressorClass'
import Emojis from '../customview/Emojis';
import { Colors } from "../consts/Colors";
import { Constants } from "../consts/Constants";
import Moment from "moment/moment";
import Memory from "../core/Memory";
import { stylesGlobal } from '../consts/StyleSheet'

const { width } = Dimensions.get("window");
var imagePadding = 10;
var TAG = "RowChat";
var textMaxWidth = width * 0.5


export default class RowChat extends Component {
    constructor(props) {
        super(props);
    }

    unicodeToChar = (text) => {
        return text.replace(/\\u[\dA-F]{4}/gi,
            function (match) {
                if (match != null && match != undefined && match != "") {
                    return String.fromCharCode(parseInt(match.replace(/\\u/g, ''), 16));
                }
            });
    };

    render() {
        var data = this.props.data;
        var isSection = false;
        var isRight = false;

        if (data.type === "section") {
            isSection = true;
        } else {
            isRight = (data.self === 1);
        }
        return (
            <View style={{ width: '100%', padding: 10 }}>
                {isSection ? this.renderSectionView() : isRight ? this.renderRightRow() : this.renderLeftRow()}
            </View>

        );
    }
    /**
    *  display section view
    */
    renderSectionView = () => {
        var data = this.props.data;
        return (
            <View style={styles.SectionHeaderView}>
                <View style={styles.SectionHeaderTitle}>
                    <Text style={[styles.SectionHeaderStyle, stylesGlobal.font]} userSelect='auto' selectable={true} selectionColor='blue'> {data.message} </Text>
                </View>
            </View>
        );
    }
    /**
    *  display other user message
    */
    renderLeftRow = () => {
        var data = this.props.data;
        var mesage_date = data.sent; // Number(data.sent) * 1000;
        var userImage = data.imgpath;

        return (
            <View style={{ flexDirection: 'row' }}>
                <View style={{ flexDirection: 'row', width: width / 2 }}>
                    <View style={styles.userImageContainer}>
                        <ImageCompressor style={styles.userImage} uri={userImage} />
                    </View>
                    {this.renderTextMessageView(data)}
                    <Text style={[{ fontSize: 12, alignSelf: 'flex-end', marginLeft: 2, color: Colors.gray, backgroundColor: Colors.transparent }, stylesGlobal.font]}>
                        {Moment.utc(mesage_date).local().format("hh:mm A")}
                    </Text>
                </View>
            </View>
        );
    };
    /**
    *  display  my message
    */
    renderRightRow = () => {
        var data = this.props.data;
        var mesage_date = data.sent; // Number(data.sent) * 1000;
        var userImage = data.imgpath + data.filename;
        var read = data.is_read;
        // console.log( data, " RowChat js read", data.is_read);
        return (
            <View style={{ alignItems: 'flex-end', marginTop: 10 }}>
                <View style={{ flexDirection: 'row' }}>
                    <Text style={[{ marginRight: 2, fontSize: 12, alignSelf: 'flex-end', color: Colors.gray, backgroundColor: Colors.transparent }, stylesGlobal.font]}>
                        {Moment.utc(mesage_date).local().format("hh:mm A")}
                    </Text>
                    {this.renderTextMessageView(data)}
                    <Image style={{ height: 20, width: 20, marginRight: 2, alignSelf: 'flex-end', tintColor: Colors.gold }} source={read == 1 ? require("../icons/ic_done_all.png") : require("../icons/ic_done.png")} defaultSource={require("../icons/ic_done.png")} />
                </View>
            </View>
        );
    };

    /**
    *  manage message data
    */
    manageMessageData = (item) => {
        item.type = "text";
        item.first_name = "";
        item.last_name = "";
        item.slug = "";
        //item.imgpath = "";


        if(item.message)
        {
            if (item.message.indexOf(Constants.SMILY_PREFIX) != -1) {
                item.message = this.parceSimleyMessage(item.message);
                item.type = "smiley";
            } else if (item.message.startsWith(Constants.SMILY_PREFIX)) {
                item.message = this.parceSimleyMessage(item.message);
                item.type = "smiley";
            } else if (item.message.startsWith(Constants.OTHER_FILE_GROUP_PREFIX)) {
                item.type = "file";
            } else if (item.message.startsWith(Constants.OTHER_FILE_PREFIX)) {
                item.type = "file";
            } else if (item.message.startsWith(Constants.DELETE_MESSAGE_PREFIX)) {
                item.type = "deleted_message";
            } else if (item.message.startsWith(Constants.MEDIA_FILE_PREFIX)) {
                item.type = "file";
            } else if (item.message.startsWith(Constants.KICKUSER_FILE_PREFIX)) {
                item.type = "kickuser";
            }
        }
        
        
        return item;
    }
    /**
    *  display parce smiley data
    */
    parceSimleyMessage = (HtmlCode) => {
        let message = '';
        let newHtml = [];
        newHtml = HtmlCode.split(/(<img.*?>)/g)
        newHtml.map((item) => {
            let word = item.trim();
            if (word.startsWith("<img ")) {
                let data = word.split('title="')[1].split('\">')[0].toLocaleLowerCase();
                let unicode;
                for (let i = 0; i < Emojis.emojis.length; i++) {
                    let emoji = Emojis.emojis[i];
                    if (emoji.name == data) {
                        unicode = emoji.emoji
                        break;
                    }
                    else if (data == "e mail" && emoji.name == "email") {
                        unicode = emoji.emoji
                        break;
                    }
                }
                message = message + " " + unicode;
            } else {
                message = message + " " + word;
            }
        })
        return message.trim();
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
    *  display message content
    */
    renderTextMessageView = (data2) => {
        var data = this.manageMessageData(data2); 
        var str = data.message;
        var messageText = "";
        try {
            if (data.type == "text") {
                messageText = str.replace('\"', '"');
                messageText = this.replaceImageUrlsInText(messageText.replace(/<br>/g, "\n"));
            }
        } catch (error) {
            // console.log( "renderTextMessageView data eror: ", data.attachment_field);
            if (data.attachment_field != undefined && data.attachment_field != null) {
                messageText = this.replaceImageUrlsInText(data.attachment_field);
                data.type = "image";
            } else {
                console.log(TAG + ' renderTextMessageView error : ' + error);
                messageText = this.replaceImageUrlsInText(str);
            }
        }

        if (data.type == "text") {
            return (
                <View style={[{ borderRadius: 10, alignItems: 'center', maxWidth: textMaxWidth, padding: 5, marginRight: 3 }, data.self == 1 ? { backgroundColor: Colors.gold } : { backgroundColor: '#fffad9' }]}>
                    <Text style={[styles.messageText, stylesGlobal.font, data.self == 1 ? { color: Colors.white } : { color: '#9f9d9e' }]}  userSelect='auto' selectable={true} selectionColor='blue' >{messageText}</Text>
                </View>
            );
        } else if (data.type == "smiley") {
            return (
                <View style={[{ borderRadius: 10, alignItems: 'center', maxWidth: textMaxWidth, padding: 5, marginRight: 3 }, data.self == 1 ? { backgroundColor: Colors.gold } : { backgroundColor: '#fffad9' }]}>
                    <Text style={[styles.messageText, stylesGlobal.font, data.self == 1 ? { color: Colors.white } : { color: '#9f9d9e' }]}  userSelect='auto' selectable={true} selectionColor='blue'>{messageText}</Text>
                </View>
            );
        } else if (data.type == "image") {
            if (messageText.indexOf("https://") <= -1) {
                if (data.attachment_field != null && data.attachment_field != undefined) {
                    messageText = data.attachment_field;
                }
            }
            return (
                // <ImageCompressor style={{ width: textMaxWidth, height: textMaxWidth }} uri={messageText} />
                <View style={{ backgroundColor: Colors.transparent, borderRadius: 10, maxWidth: textMaxWidth, marginRight: 3 }}>
                    <TouchableOpacity
                        onPress={() => {
                            this.props.navigation.navigate("ImageZoom", {
                                index: 0,
                                tempGalleryUrls: [{
                                    id: messageText,
                                    image: { uri: messageText },
                                    thumb: { uri: messageText + Constants.THUMB_FOLDER }
                                }]
                            })
                        }}
                    >
                        <ImageCompressor style={{ width: textMaxWidth, height: textMaxWidth }} uri={messageText} />
                    </TouchableOpacity>
                </View>
            );
        } else if (data.type == "video") {
            return (
                <View style={{ backgroundColor: Colors.transparent, borderRadius: 10, maxWidth: textMaxWidth, marginRight: 3 }}>
                    <ImageCompressor style={{ width: textMaxWidth, height: textMaxWidth }} uri={messageText} />
                </View>
            );
        } else if (data.type == "other" || data.type == "file") {
            let regex = new RegExp("(<img>)([^<]+)(<\/>)", "g");
            try {
                if (Memory().env == "LIVE") {
                    messageText = messageText.replace('src="/cometchat/', 'src="https://the007percent.com/cometchat/');
                } else {
                    messageText = messageText.replace('src="/cometchat/', 'src="https://dev.007percent.com/cometchat/');
                }
            } catch (error) {
                console.log("data.type == other || data.type == file error : ", error);
            }
            messageText = messageText.replace('style="max-height:170px;"', '');
            messageText = messageText.replace("<div style='display:none;'>has sent a file</div><br/>", '');
            return (
                <View style={{ ...styles.renderTextMessageView, backgroundColor: data.self == 1 ? Colors.gold : '#fffad9' }}>
                    <HTML html={messageText} baseFontStyle={[{ fontSize: 15 }, data.self == 1 ? { color: Colors.white } : { color: '#9f9d9e' }]} imagesMaxWidth={textMaxWidth} containerStyle={{ maxWidth: textMaxWidth, resizeMode: 'contain' }} onLinkPress={(evt, href) => {
                        if (href != null) {
                            if (href.startsWith("//")) {
                                href = href.substring(2, href.length)
                            }
                            if (!href.startsWith("http://")) {
                                href = "http://" + href;
                            }
                            console.log(TAG, " file href " + href);
                            Linking.canOpenURL(href).then(supported => {
                                if (supported) {
                                    Linking.openURL(href).catch(err => console.error('An error occurred', err));
                                } else {
                                    Alert.alert(Constants.OPENING_CHATFILE + href);
                                }
                            });
                        }
                    }} />
                </View>
            );
        } else {
            return (
                <HTML html={messageText} baseFontStyle={[{ fontSize: 15 }, data.self == 1 ? { color: Colors.white } : { color: '#9f9d9e' }]} onLinkPress={(evt, href) => {
                    if (href != null) {
                        if (href.startsWith("//")) {
                            href = href.substring(2, href.length)
                        }
                        if (!href.startsWith("http://")) {
                            href = "http://" + href;
                        }
                        console.log(TAG, " file href " + href);
                        Linking.canOpenURL(href).then(supported => {
                            if (supported) {
                                Linking.openURL(href).catch(err => console.error('An error occurred', err));
                            } else {
                                Alert.alert(Constants.OPENING_CHATFILE + href);
                            }
                        });
                    }
                }} />
            );
        }
    };

}

const styles = StyleSheet.create({
    renderTextMessageView: {
        borderRadius: 10,
        justifyContent: 'center',
        maxWidth: textMaxWidth,
        padding: 5,
        marginRight: 3
    },
    messageText: {
        fontSize: 15,
        color: Colors.white,
        backgroundColor: Colors.transparent,
    },
    userImageContainer: {
        backgroundColor: Colors.gray,
        alignSelf: 'flex-end',
        borderRadius: 40 / 2,
        width: 40,
        height: 40,
        marginRight: 5,
        overflow: 'hidden',
    },
    userImage: {
        // overflow: 'hidden',
        backgroundColor: Colors.transparent,
        borderRadius: 40 / 2,
        width: 40,
        height: 40
    },
    SectionHeaderView: {
        backgroundColor: Colors.transparent,
        flexDirection: 'row',
        justifyContent: 'center'
    },
    SectionHeaderTitle: {
        width: 85,
        backgroundColor: Colors.gray,
        borderRadius: 4,
        justifyContent: 'center',
        alignItems: 'center',
    },
    SectionHeaderStyle: {
        backgroundColor: Colors.transparent,
        fontSize: 10,
        color: Colors.white,
        paddingTop: 5,
        paddingBottom: 5,
    },
});
