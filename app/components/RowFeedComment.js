import React, { Component } from "react";
import {
    Alert,
    View,
    Text,
    TouchableOpacity,
    Dimensions,
    StyleSheet,
    Image,
    TextInput,
    ActivityIndicator,
    Keyboard,
} from "react-native";

import WebService from "../core/WebService";
import { ImageCompressor } from './ImageCompressorClass'
import { Colors } from "../consts/Colors";
import { Constants } from "../consts/Constants";
import Moment from "moment/moment";
import * as Global from "../consts/Global";
import {stylesGlobal} from '../consts/StyleSheet';
import Memory from '../core/Memory';
import {convertEmojimessagetoString, convertStringtoEmojimessage} from "../utils/Util";

const { width } = Dimensions.get("window");
var imagePadding = 10;
var cardPadding = 10;
var imageSize = 40;
var replyImageSize = 30;
var rowWidth = width;
var commentWidth = width - imageSize - imagePadding - cardPadding - cardPadding;
var replyWidth = commentWidth - replyImageSize - imagePadding;
var TAG = "RowFeedComment";
export default class RowFeedComment extends Component {
    constructor(props) {
        super(props);
        this.state = {
            showReply: false,
            replyLoader: false,
            replyText: "",
        }
    }

    unicodeToChar = (text) => {
        return text.replace(/\\u[\dA-F]{4}/gi,
            function (match) {
                return String.fromCharCode(parseInt(match.replace(/\\u/g, ''), 16));
            });
    };

    render() {
        var data = this.props.data;
        return (
            <View style={{ backgroundColor: Colors.white }}>
                {this.renderLeftRow()}
            </View>
        );
    }
    /**
  * display other user message
  */
    renderLeftRow = () => {
        var data = this.props.data;
        var fullName = data.first_name + " " + data.last_name;
        var commentDate = data.datetime;
        var userImage = data.imgpath + Constants.THUMB_FOLDER + data.filename;
        var str = data.comment_text;
        var commentText = str;
        try {convertStringtoEmojimessage
            commentText = convertStringtoEmojimessage(str);
            // commentText = decodeURIComponent(this.unicodeToChar(str));
        } catch (error) {
            console.log(TAG + 'error : ' + error)
            commentText = str;
        }
        var totalLikes = data.total_likes;
        var likes;
        if (data.is_liked == 1) {
            likes = "Unlike " + totalLikes;
        } else {
            likes = "Like " + totalLikes;
        }

        return (
            <View style={styles.containerRow}>
                <TouchableOpacity style={styles.userImageContainer}
                    onPress={() => {
                        if (this.props.userId == data.comment_by_userid) {
                            this.props.navigation.navigate("MyProfile", {
                                refreshProfileImage: this.refreshProfileImage
                            });
                        } else {
                            this.props.navigation.navigate("ProfileDetail", {
                                slug: data.slug
                            })
                        }
                    }}
                >
                    <ImageCompressor uri={userImage} style={styles.userImage}/>
                </TouchableOpacity>
                <View style={styles.commentContain}>
                    <TouchableOpacity 
                        onPress={() => {
                            if (this.props.userId == data.comment_by_userid) {
                                this.props.navigation.navigate("MyProfile", {
                                    refreshProfileImage: this.refreshProfileImage
                                });
                            } else {
                                this.props.navigation.navigate("ProfileDetail", {
                                    slug: data.slug
                                })
                            }
                        }}
                    >
                        <Text style={[styles.name, stylesGlobal.font]}>{fullName}</Text>
                    </TouchableOpacity>
                    <Text style={[styles.date, stylesGlobal.font]}>{Moment.utc(commentDate).local().format("DD MMM YYYY, hh:mm A")}</Text>
                    <Text style={[styles.comment, stylesGlobal.font]}>{commentText}</Text>

                    <View style={[styles.viewRowContainer, { flex: 0.8, paddingBottom: 0, paddingTop: 0, marginTop: 5 }]}>
                        <TouchableOpacity
                            style={[styles.viewRowContainer, { flex: 0.9, paddingBottom: 0, paddingTop: 0 }]}
                            onPress={() => {
                                this.props.likeUnLikeFeed(data);
                            }}
                        >
                            <Text style={[styles.rowTextStyle, { marginLeft: 1 }, stylesGlobal.font]}>
                                {totalLikes}
                            </Text>
                            <View style={styles.viewRowImageConainer}>
                                <Image
                                    style={styles.rowImageStyle}
                                    source={require("../icons/ic_like.png")}
                                />
                            </View>
                            <Text style={[styles.rowTextStyle, { marginLeft: 1 }, stylesGlobal.font]}>
                                {data.is_liked == 1 ? "Unlike" : "Like"}
                            </Text>
                        </TouchableOpacity>

                        {/* <TouchableOpacity
                            style={[styles.viewRowContainer, { flex: 1.2, paddingBottom: 0, paddingTop: 0 }]}
                            onPress={() => {
                                this.setState({
                                    showReply: !this.state.showReply
                                })
                            }}
                        >
                            <Text style={[styles.rowTextStyle, { marginLeft: 1 }, stylesGlobal.font]}>Reply</Text>
                        </TouchableOpacity> */}
                    </View>

                    {this.state.showReply == true ?
                        <View style={[styles.replyContainer]}>
                            <View style={{ flex: 4, backgroundColor: Colors.transparent }}>
                                <TextInput
                                    ref='commentTextInput'
                                    underlineColorAndroid="transparent"
                                    blurOnSubmit={false}
                                    autoFocus={false}
                                    returnKeyType={"send"}
                                    style={[styles.replyTextInput, stylesGlobal.font]}
                                    onChangeText={replyText => this.setState({ replyText })}
                                    value={this.state.replyText}
                                    defaultValue=""
                                    multiline={false}
                                    autoCapitalize='sentences'
                                    placeholder="Post your reply here ..."
                                    onSubmitEditing={this.sendReply}
                                    // keyboardType='ascii-capable'
                                />

                            </View>
                            {
                                this.state.replyLoader == false ?
                                    <View style={{ flex: 0.5, backgroundColor: Colors.transparent }}>
                                        <TouchableOpacity
                                            style={styles.sendButton}
                                            onPress={() => {
                                                Keyboard.dismiss()
                                                this.sendReply();
                                            }}
                                        >
                                            <Image style = {{width: '100%', height: '100%', resizeMode: 'contain'}} source={require("../icons/chat_send.png")}/>
                                        </TouchableOpacity>
                                    </View>
                                    : null
                            }

                            {
                                this.state.replyLoader == true ?
                                    <View style={{flex: 0.5, backgroundColor: Colors.transparent, justifyContent: 'center', alignItems: 'center',}}>
                                        <ActivityIndicator
                                            animating={true}
                                            color='#cfae45'
                                            size="large"
                                            style={{ width: 30, height: 30, }} />
                                    </View>
                                    : null
                            }
                        </View>
                        : null}
                    {data.comments_reply.length > 0 ? this.renderCommentReplyList() : null}
                </View>

            </View>
        );

    };
    /**
  * display comment reply info
  */

    renderCommentReplyList = () => {
        var replyList = this.props.data.comments_reply;

        var len = replyList.length;

        var views = [];
        for (var i = 0; i < len; i += 1) {

            views.push(
                <View key={i}>
                    <View style={{ flexDirection: 'row' }}>
                        {this.renderReply(replyList[i])}
                    </View>
                </View>
            )
        }
        return (
            <View>
                {views}
            </View>
        );
    };
    /**
  * display comment reply info
  */
    renderReply = (replyData) => {
        var fullName = replyData.first_name + " " + replyData.last_name;
        var commentDate = replyData.datetime;
        var userImage = replyData.imgpath + Constants.THUMB_FOLDER + replyData.filename;
        var str = replyData.comment_text;
        var replyText = str;
        try {
            replyText = convertStringtoEmojimessage(str);
            // replyText = decodeURIComponent(this.unicodeToChar(str));
        } catch (error) {
            console.log(TAG + 'error : ' + error)
            replyText = str;
        }
        var totalLikes = replyData.total_likes;
        var likes;
        if (replyData.is_liked == 1) {
            likes = "Unlike " + totalLikes;
        } else {
            likes = "Like " + totalLikes;
        }

        return (
            <View style={styles.replyContainerRow}>
                <View style={styles.replayUserImageContainer}>
                    <ImageCompressor
                        uri={userImage}
                        style={styles.replyUserImage}
                    />
                </View>
                <View style={styles.replyCommentContain}>

                    <Text style={[styles.name, stylesGlobal.font]}>{fullName}</Text>
                    <Text style={[styles.date, stylesGlobal.font]}>{Moment.utc(commentDate).local().format("MMM DD, YYYY, hh:mm A")}</Text>
                    <Text style={[styles.comment, stylesGlobal.font]}>{replyText}</Text>

                    <View
                        style={[styles.viewRowContainer, { flex: 0.8, paddingBottom: 0, paddingTop: 0, marginTop: 5 }]}
                    >
                        <TouchableOpacity
                            style={[styles.viewRowContainer, { flex: 0.9, paddingBottom: 0, paddingTop: 0 }]}
                            onPress={() => {
                                this.props.likeUnLikeFeed(replyData);
                            }}
                        >
                            <Text
                                style={[styles.rowTextStyle, { marginLeft: 1 }, stylesGlobal.font]}
                            >
                                {likes}
                            </Text>
                            <View
                                style={styles.viewRowImageConainer}
                            >
                                <Image
                                    style={styles.rowImageStyle}
                                    source={require("../icons/ic_like.png")}
                                />
                            </View>
                        </TouchableOpacity>

                    </View>

                </View>
            </View>
        );

    }
    /**
  * send reply button click
  */
    sendReply = () => {
        Keyboard.dismiss()
        var replyText = this.state.replyText.trim();
        this.setState({
            replyText: replyText
        });
        if (replyText.length > 0) {
            this.callSendReplyAPI(replyText, this.props.data.id);
        } else {
            Alert.alert(Constants.ENTER_REPLY)
        }
    };

    /**
    * call send reply API
    */

    callSendReplyAPI = async (comment, parentId) => {
        try {
            this.setState({
                replyLoader: true
            });
            let uri = Memory().env == "LIVE" ? Global.URL_SEND_FEED_TIME_LINE_COMMENTS : Global.URL_SEND_FEED_TIME_LINE_COMMENTS_DEV


            let params = new FormData();
            params.append("token", this.props.userToken);
            params.append("user_id", this.props.userId);
            params.append("format", "json");
            params.append("pid", parentId);
            params.append("activity_id", this.props.activityId);
            // params.append("activity_user_id", "1");
            params.append("activity_user_id", this.props.data.comment_by_userid);
            params.append("comment", comment);


            console.log(TAG + " callSendReplyAPI uri " + uri);
            console.log(TAG + " callSendReplyAPI params " + JSON.stringify(params));

            WebService.callServicePost(
                uri,
                params,
                this.handleSendReplyResponse
            );
        } catch (error) {
            console.log(TAG + " callSendReplyAPI error " + error);
            this.setState({
                replyLoader: false
            });
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    };
    /**
      * handle send reply API response
      */
    handleSendReplyResponse = (response, isError) => {
        console.log(TAG + " callSendReplyAPI Response " + JSON.stringify(response));
        console.log(TAG + " callSendReplyAPI isError " + isError);

        if (!isError) {
            var result = response;
            if (typeof result != "undefined" && result != null) {
                if (result.status == "success") {
                    this.setState({
                        totalComment: result.total_comment,
                    });
                    this.props.refreshReplyContent(this.state.totalComment);
                } else {
                    Alert.alert(result.msg, "")
                }
                this.setState({
                    replyText: "",
                });
                
            }
        } else {
            if (response != undefined && response != null && response.length > 0) {
                Alert.alert(response.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
        this.setState({
            replyLoader: false,
            showReply: false
        });
    };
}

const styles = StyleSheet.create({
    containerRow: {
        backgroundColor: Colors.transparent,
        flexDirection: 'row',
        width: width,
        paddingLeft: cardPadding,
        paddingRight: cardPadding,
        paddingTop: cardPadding / 2,
        paddingBottom: cardPadding / 2
    },
    userImageContainer: {
        backgroundColor: Colors.gray,
        width: imageSize,
        height: imageSize,
        borderRadius: imageSize / 2,
        alignItems: 'center',
        overflow: 'hidden',
    },
    userImage: {
        backgroundColor: Colors.white,
        borderRadius: imageSize / 2,
        width: imageSize,
        height: imageSize,
        overflow: 'hidden',
    },
    commentContain: {
        flexDirection: 'column',
        marginLeft: imagePadding,
        backgroundColor: Colors.transparent,
        width: commentWidth
    },
    name: {
        fontWeight: 'bold',
        fontSize: 16,
        color: Colors.gray,
        backgroundColor: Colors.transparent
    },
    date: {
        fontSize: 10,
        color: Colors.gray,
        backgroundColor: Colors.transparent
    },
    comment: {
        fontSize: 15,
        color: Colors.black,
        backgroundColor: Colors.transparent
    },
    likeReply: {
        fontSize: 8,
        color: Colors.gold
    },
    likeImageStyle: {
        width: 10,
        height: 10,
        marginLeft: 5,
        marginRight: 5,
    },
    nameContainer: {
        marginTop: 5,
        flexDirection: "row",
    },
    viewRowContainer: {
        flexDirection: "row",
        backgroundColor: Colors.transparent,
        paddingBottom: 5,
        paddingTop: 5,
        alignItems: "center"
    },
    rowTextStyle: {
        color: Colors.gold,
        fontSize: 13,
        marginRight: 5,
        backgroundColor: Colors.transparent
    },
    rowImageStyle: {
        width: 25,
        height: 25,
        resizeMode: 'contain',
        tintColor: Colors.gold
    },
    replyContainer: {
        width: commentWidth,
        flexDirection: "row",
        backgroundColor: Colors.transparent,
        marginTop: 5,
        marginBottom: 5,
        height: 30,
        justifyContent: 'center',
        alignItems: "center"
    },
    replyTextInput: {
        flex: 1,
        height: 30,
        borderColor: Colors.gray,
        borderWidth: 1,
        fontSize: 10,
        borderRadius: 1,
        backgroundColor: Colors.white,
        paddingLeft: 5,
        paddingRight: 5,
        color: Colors.black,
    },
    commentTextInput: {
        borderWidth: 0.5,
        borderRadius: 1,
        borderColor: Colors.gray,
        shadowOffset: { width: 1, height: 1 },
        shadowOpacity: 0.6,
        shadowRadius: 2,
        margin: 5,
        shadowColor: Colors.black,
        backgroundColor: "#FFFFFF",
        color: Colors.gray,
        fontSize: 13,
        padding: 5,
        height: 40,
        alignContent: 'center'
    },
    sendButton: {
        height: 50,
        alignItems: 'center',
        backgroundColor: Colors.transparent,
        justifyContent: 'center'
    },
    replyContainerRow: {
        backgroundColor: Colors.transparent,
        flexDirection: 'row',
        width: commentWidth,
        paddingTop: cardPadding / 2,
        paddingBottom: cardPadding / 2
    },
    replayUserImageContainer: {
        backgroundColor: Colors.gray,
        width: replyImageSize,
        height: replyImageSize,
        borderRadius: replyImageSize / 2,
        alignItems: 'center',
        overflow: 'hidden',
    },
    replyUserImage: {
        backgroundColor: Colors.white,
        borderRadius: replyImageSize / 2,
        width: replyImageSize,
        height: replyImageSize,
        overflow: 'hidden',
    },
    replyCommentContain: {
        flexDirection: 'column',
        marginLeft: imagePadding,
        backgroundColor: Colors.transparent,
        width: replyWidth
    },
});
