import React, { Component } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    Dimensions,
    StyleSheet,
    Platform,
    Image,
    TextInput
} from "react-native";
import {stylesGlobal} from '../consts/StyleSheet';

const { width, height } = Dimensions.get("window");
import { Colors } from "../consts/Colors";
import Emojis from '../customview/Emojis';
import {convertEmojimessagetoString, convertStringtoEmojimessage} from "../utils/Util";
import AsyncStorage from '@react-native-community/async-storage';
import { Constants } from "../consts/Constants";

export default class EventsCommentsRow extends Component {
    constructor(props) {
        super(props);
        this.state = {
            userId: "",
            userSlug: "",
            showPicker: false,
            new_reply_comment_text: "",
        };
    }

    UNSAFE_componentWillMount = async() => {
        try {
            var userId = await AsyncStorage.getItem(Constants.KEY_USER_ID);
            var userSlug = await AsyncStorage.getItem(Constants.KEY_USER_SLUG);
            this.setState({
                userId: userId,
                userSlug: userSlug
            })
        } catch(error) {
            console.log(error)
        }
    }

    gotoProfileScreen = async(data) => {
        if(data.slug == this.state.userSlug) {
            this.props.navigation.navigate("MyProfile", {
                refreshProfileImage: this.refreshProfileImage
            });
        } else {
            this.props.navigation.navigate("ProfileDetail", {slug: data.slug })
        }
    }

    refreshProfileImage = async() => {

    }

    render() {
        var data = this.props.data;
        var url = data.imgpath + data.filename;
        var fullName = data.first_name + " " + data.last_name;
        var comment = convertStringtoEmojimessage(data.comment_text);
        var showReply = data.showReply;
        var replied_comments = data.reply;
        return (
            <View style={styles.containerRow}>
                <TouchableOpacity onPress = {() => this.gotoProfileScreen(this.props.data)}>
                    <Image
                        style={styles.userImage}
                        source={{ uri: url }}
                        defaultSource={require("../icons/Background-Placeholder_Camera.png")}
                    />
                </TouchableOpacity>
                <View style={{ marginLeft: 10, justifyContent: "center" , flex:1}}>
                    <View style={styles.nameContainer}>
                        <Text style={[styles.name, stylesGlobal.font_bold]}>{fullName}</Text>
                    </View>

                    <View style={[styles.nameContainer, { marginTop: 1, marginBottom: 1 , flex:1}]}>
                        <Text style={[styles.commentValue, stylesGlobal.font]}>{comment}</Text>
                    </View>
                    <View style={[styles.nameContainer, { marginTop: 5, marginBottom: 5 , flex: 1, flexDirection: 'row'}]}>
                        <TouchableOpacity onPress = {() => this.props.showReplyInput(data.id)}>
                            <Text style={[styles.replyButtonText, stylesGlobal.font]}>{showReply ? "Cancel" : "Reply"}</Text>
                        </TouchableOpacity>
                    {
                        this.props.user_slug == data.slug &&
                        <View style = {{flexDirection: 'row'}}>
                            <View style = {{width: 1, height: '100%', backgroundColor: Colors.gold, marginLeft: 5, marginRight: 5}}/>
                            <TouchableOpacity onPress = {() => this.props.deleteComment(data)}>
                                <Text style={[styles.replyButtonText, stylesGlobal.font]}>{"Delete"}</Text>
                            </TouchableOpacity>
                        </View>
                    }
                    </View>
                {
                    showReply &&
                    <View style = {{width: '100%'}}>
                        <TextInput
                            underlineColorAndroid="transparent"
                            returnKeyType={"done"}
                            style={[styles.commentTextInput, stylesGlobal.font]}
                            onChangeText={text => this.setState({ new_reply_comment_text: text })}
                            defaultValue=""
                            multiline={true}
                            autoCapitalize='sentences'
                            autoCorrect = {false}
                            placeholder={"Reply to " + data.first_name}
                            // keyboardType='ascii-capable'
                        />

                        <View style={{ alignItems: "flex-end", marginRight: 5 }}>
                            <TouchableOpacity
                                style={[{
                                    paddingTop: 5,
                                    paddingBottom: 5,
                                    paddingLeft: 15,
                                    paddingRight: 15,
                                    backgroundColor: Colors.gold,
                                    borderRadius: 5
                                }, stylesGlobal.shadow_style]} onPress = {() => { this.props.sendReplyComment(data, convertEmojimessagetoString(this.state.new_reply_comment_text)) }}
                            >
                                <Text style={[styles.rowTextStyle, { color: Colors.white, marginLeft: 0 }, stylesGlobal.font,]}>{"Post"}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                }
                {
                    replied_comments != null && replied_comments.length > 0 && replied_comments.map((item, index) => 
                    <View key = {index} style={[styles.containerRow, { marginLeft: 0,}]}>
                        <TouchableOpacity onPress = {() => this.gotoProfileScreen(item)}>
                            <Image
                                style={styles.userImage}
                                source={{ uri: item.imgpath + item.filename }}
                                defaultSource={require("../icons/Background-Placeholder_Camera.png")}
                            />
                        </TouchableOpacity>
                        <View style={{ marginLeft: 10, justifyContent: "center" , flex:1}}>
                            <View style={styles.nameContainer}>
                                <Text style={[styles.name, stylesGlobal.font_bold]}>{item.first_name + " " + item.last_name}</Text>
                            </View>
                            <View style={[styles.nameContainer, { marginTop: 1, marginBottom: 1 , flex:1}]}>
                                <Text style={[styles.commentValue, stylesGlobal.font]}>{convertStringtoEmojimessage(item.comment_text)}</Text>
                            </View>
                        {
                            this.props.user_slug == item.slug &&
                            <TouchableOpacity style = {{marginTop: 5}} onPress = {() => this.props.deleteComment(item)}>
                                <Text style={[styles.replyButtonText, stylesGlobal.font]}>{"Delete"}</Text>
                            </TouchableOpacity>
                        }
                        </View>
                    </View>
                    )
                }
                </View>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    containerRow: {
        backgroundColor: Colors.white,
        // marginLeft: 10,
        flexDirection: "row",
        width: '100%',
        marginVertical: 7
    },
    userImage: {
        resizeMode: "cover",
        backgroundColor: Colors.white,
        width: 40,
        height: 40,
        borderRadius:20,
    },
    nameContainer: {
        marginTop: 1,
        flexDirection: "row"
    },
    name: {
        fontSize: 12,
        backgroundColor: Colors.transparent,
    },
    commentValue: {
        fontSize: 10,
        backgroundColor: Colors.transparent,
        color: Colors.black,
        flexWrap: 'wrap'
    },
    replyButtonText: {
        fontSize: 12,
        color: Colors.gold,
    },
    rowTextStyle: {
        color: Colors.black,
        fontSize: 10,
        marginLeft: 5,
        backgroundColor: Colors.transparent
    },
    commentTextInput: {
        flex: 1,
        // width: '100%',
        borderWidth: 0.5,
        borderRadius: 1,
        borderColor: Colors.gray,
        borderRadius: 5,
        // shadowOffset: { width: 1, height: 1 },
        // shadowOpacity: 0.6,
        // shadowRadius: 2,
        margin: 5,
        shadowColor: Colors.black,
        backgroundColor: "#FFFFFF",
        color: Colors.gray,
        fontSize: 12,
        padding: 5,
        height: 30
    }
});
