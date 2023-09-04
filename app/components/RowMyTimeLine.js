import React, { Component } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    Dimensions,
    StyleSheet,
    Platform,
    Image, 
    KeyboardAvoidingView,
    TextInput,
    Alert
} from "react-native";
import { EventRegister } from 'react-native-event-listeners'
import { ImageCompressor } from './ImageCompressorClass';
import * as Global from "../consts/Global";
import { Colors } from "../consts/Colors";
import { Constants } from "../consts/Constants";
import {stylesGlobal} from '../consts/StyleSheet';
import Moment from "moment/moment";
import Memory from '../core/Memory';
import Video from 'react-native-video-player';
import {convertEmojimessagetoString, convertStringtoEmojimessage} from "../utils/Util";


const { width } = Dimensions.get("window");

var TAG = "RowMyTimeLine";
//activity_type==1 , 
//activity_type==2 , Added a photo
//activity_type==3 , Added a video
//activity_type==4 , is hosting a party
//activity_type==5 , added group
//activity_type==6 , added discussion topic
//activity_type==7 , Added a photo
//activity_type==8 , Added a video
//activity_type==9 , Changed profile picture
//activity_type==10 , updated party
//activity_type==11 , Canceled party
//activity_type==12 , deleted party
//activity_type==13 , Invited Friends
//activity_type==14 , shared post
//activity_type==15 , is going a trip
//activity_type==16 , is hosing a trip
//activity_type==17 , canceled trip
//activity_type==18 , updated trip
//activity_type==19 , deleted trip
export default class RowMyTimeLine extends Component {
    constructor(props) {
        super(props);
        this.state = {
            commentValue: '',
            emojiSelectedIndex: 0,

            show_visibility: false,
            category_array: Global.category_array_all,
        }
    }

    render() {
        var data = this.props.data;
        var sharePost = false;
        if (data.shared_by_user_id != null && data.user_info != null) {
            sharePost = true;
        }

        return (
            <View onStartShouldSetResponder = {() => this.setState({show_visibility: false})}>
                {
                    sharePost ? this.renderShareView(data) : this.renderChildView(data)
                }
            </View>
        );
    }
    /** 
       * display share view data
       */
    renderShareView = (data) => {
        return (
            <View style={styles.sharePostContainer} >
                {this.renderShareUser(data.user_info)}
                <View >
                    {this.renderChildView(data)}
                </View>
            </View>
        )
    }
    /** 
       * display child view data
       */
    renderChildView = (data) => {
        var sharePost = false;
        if (data.shared_by_user_id != null && data.user_info != null) {
            sharePost = true;
        }

        var title = convertStringtoEmojimessage(data.activity_text);
        var url = data.media_url ;//+ Constants.THUMB_FOLDER + data.media_name;
        var userUrl = data.profile_imgpath + Constants.THUMB_FOLDER + data.profile_filename;

        var fullName = data.first_name + " " + data.last_name;
        var slug = data.slug;
        var typeTitle = data.type_title;
        var date = data.activity_datetime;

        var activityType = data.activity_type;
        var fromDate = data.from_date;
        var toDate = data.to_date;
        var fromTime = data.from_time;
        var toTime = data.to_time;
        var vanueAddress = data.venue_address;
        var visibility = this.props.data.visibility;
        var selected_category = 0;
        for(i = 0; i < this.state.category_array.length; i ++) {
            if(visibility.toString() == this.state.category_array[i].value.toString()) {
                selected_category = i
                break;
            }
        }
        
       
        return (
            <View style={sharePost ? styles.childContainer : styles.container}>
            {
                this.state.show_visibility &&  //////  have to consider post is event/trip or others
                <View style = {[styles.visibility_container_view, {right: 20, top: 0, paddingLeft: 5, paddingTop: 5, paddingRight: 5}]}>
                {
                    this.state.category_array.map((item, index) =>
                    <TouchableOpacity style = {[styles.visibility_button, selected_category == index ? {backgroundColor: Colors.gold} : {backgroundColor: Colors.black}]} 
                        onPress = {() => {
                            this.props.callChangePostVisibilityAPI(this.props.data.id, item.value.toString());
                            this.setState({show_visibility: false})
                        }}>
                        <Image style = {{width: 20, height:20, marginLeft: 8}} resizeMethod = {'contain'} source={item.icon_path}/>
                        <Text style = {[styles.visibility_text, stylesGlobal.font, {marginLeft: 5}]}>{item.label}</Text>
                    </TouchableOpacity>
                    )
                }
                </View>
            }
                <TouchableOpacity style={{ flexDirection: "row" }}
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
                    <View style={styles.userImageContainer}>
                        <ImageCompressor
                            uri={userUrl}
                            style={styles.userImage}
                        />
                    </View>

                    <View style={styles.nameContainer}>
                        <Text style={[styles.name, stylesGlobal.font]}>{fullName}</Text>
                        <Text style={[styles.type, stylesGlobal.font]}>{typeTitle}</Text>
                    </View>

                    {!sharePost ?

                        <TouchableOpacity style={styles.settingView} onPress={() => {this.setState({show_visibility: true})}}>
                            <Image style={styles.rowImageStyle} source={this.state.category_array[selected_category].icon_path}/>
                        </TouchableOpacity>
                        : null}


                    {!sharePost ? <TouchableOpacity style={styles.deleteButton}
                        onPress={() => {
                            this.displayDeleteDialog(this.props.data.id, this.props.data.visibility);
                        }}
                        >
                        {/* <Icon name="md-trash" style={styles.deleteIcon} /> */}
                        <Image
                            style={[styles.rowImageStyle, {width: 30, height: 30}]}
                            source={require("../icons/ic_delete.png")}
                        />
                    </TouchableOpacity> : null}

                </TouchableOpacity>

                <View style={styles.separator} />
                {title != "" ? <Text style={[styles.title, stylesGlobal.font]}>{title}</Text> : null}
                {this.renderImageVideoFile(data)}

                <Text style={[styles.rowTextStyle, { marginTop: 5 }, stylesGlobal.font]}>
                    {Moment(date).format('DD MMM YYYY')}
                </Text>
                {(activityType == "15" || activityType == "16" || activityType == "17" || activityType == "18" || activityType == "19") ? null : this.renderTimeDateRow(date, fromDate, toDate, fromTime, toTime, vanueAddress)}
                {this.renderLikeCommentView(data)}
            </View>
        );
    }
    /** 
        * display image ,video base on type
        */
    renderImageVideoFile = (data) => {
        var sharePost = false;
        if (data.shared_by_user_id != null && data.user_info != null) {
            sharePost = true;
        }
        var activityType = data.activity_type;
        if (activityType == "15") {
            console.log(data)
        }
        var url = data.media_url ;//+ Constants.THUMB_FOLDER + data.media_name;
        var fromDate = data.from_date;
        var toDate = data.to_date;
        let imageView = (
            < TouchableOpacity onPress={() => { this.redirectToDetailScreen() }}>
                <ImageCompressor
                    uri={url}
                    style={sharePost ? styles.childFitImage : styles.fitImage}
                />
            </TouchableOpacity >
        );
        let videoView = (
            <View style={{borderRadius:10, overflow:'hidden'}}>
                <Video
                    ref={ref => this._video = ref}
                    videoWidth={width * 0.8}
                    videoHeight={width * 0.8}
                    disableFullscreen
                    autoplay
                    video={{uri: url}}
                    resizeMode='contain'
                    onLoad={() => {
                        this._video.seek(0);
                        this._video.pause();
                    }}
                    onPlayPress={() => {
                        this._video.resume();
                    }}
                />
            </View >
        );
        let travelplanView =(
            < TouchableOpacity onPress={() => {this.redirectToDetailScreen()}}
                style={{padding:10, paddingLeft: 0}}
            >
                <View style={{flexDirection:'row', alignItems:'center'}}>
                    <Image source={require('../icons/pin.png')} style={styles.rowImageStyle}/>
                    <Text style={[styles.rowTextStyle, { marginTop: 5 }, stylesGlobal.font]}>{data.venue_address}</Text>
                </View>
                <View style={{flexDirection:'row', marginTop:10, alignItems:'center'}}>
                    <Image source={require('../icons/calendar.png')} style={styles.rowImageStyle}/>
                    <View style={[stylesGlobal.date_view, {marginLeft: 5}]}>
                        <Text style={[styles.rowTextStyle, { marginLeft: 0 }, stylesGlobal.font]}>{Moment(fromDate).format("DD MMM YYYY")}</Text>
                    </View>
                    <Text style={[styles.rowTextStyle, stylesGlobal.font, ]}>{Moment(fromDate).format('ddd')}</Text>

                    <Text style={[styles.rowTextStyle, { marginTop: 5 }, stylesGlobal.font]}>THRU</Text>

                    <View style={[stylesGlobal.date_view, {marginLeft: 5}]}>
                        <Text style={[styles.rowTextStyle, { marginLeft: 0 }, stylesGlobal.font]}>{Moment(toDate).format("DD MMM YYYY")}</Text>
                    </View>
                    <Text style={[styles.rowTextStyle, stylesGlobal.font, ]}>{Moment(toDate).format('ddd')}</Text>
                </View>
            </TouchableOpacity >
        );
        return (
            <View>
                {activityType == "1" ? null : null}
                {activityType == "2" ? imageView : null}
                {activityType == "3" ? videoView : null}
                {activityType == "4" ? imageView : null}
                {activityType == "5" ? imageView : null}
                {activityType == "6" ? imageView : null}
                {activityType == "7" ? imageView : null}
                {activityType == "8" ? videoView : null}
                {activityType == "9" ? imageView : null}
                {activityType == "10" ? imageView : null}
                {activityType == "11" ? imageView : null}
                {activityType == "12" ? imageView : null}
                {activityType == "13" ? imageView : null}
                {activityType == "14" ? imageView : null}
                {activityType == "15" ? travelplanView : null} 
                {activityType == "16" ? travelplanView : null} 
                {activityType == "17" ? travelplanView : null} 
                {activityType == "18" ? travelplanView : null} 
                {activityType == "19" ? travelplanView : null} 
            </View>
        );
    }

    /** 
       * display share user data
       */
    renderShareUser = (data) => {
        var userUrl = data.imgpath + Constants.THUMB_FOLDER + data.filename;
        var fullName = data.first_name + " " + data.last_name;
        var slug = data.slug;
        var visibility = this.props.data.visibility;
        var selected_category = 0;
        for(i = 0; i < this.state.category_array.length; i ++) {
            if(visibility.toString() == this.state.category_array[i].value.toString()) {
                selected_category = i
                break;
            }
        }

        return (
            <View>
            {
                this.state.show_visibility &&  //////  have to consider post is event/trip or others
                <View style = {[styles.visibility_container_view, {right: 20, top: 0, paddingLeft: 5, paddingTop: 5, paddingRight: 5, zIndex: 100}]}>
                {
                    this.state.category_array.map((item, index) =>
                    <TouchableOpacity style = {[styles.visibility_button, selected_category == index ? {backgroundColor: Colors.gold} : {backgroundColor: Colors.black}]} 
                        onPress = {() => {
                            this.props.callChangePostVisibilityAPI(this.props.data.id, item.value.toString());
                            this.setState({show_visibility: false})
                        }}>
                        <Image style = {{width: 20, height:20, marginLeft: 8}} resizeMethod = {'contain'} source={item.icon_path}/>
                        <Text style = {[styles.visibility_text, stylesGlobal.font, {marginLeft: 5}]}>{item.label}</Text>
                    </TouchableOpacity>
                    )
                }
                </View>
            }
                <TouchableOpacity style={{ flexDirection: "row" }}
                    onPress={() => {
                        if (data.id === this.props.userId) {
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
                    <View style={styles.userImageContainer}>

                        <ImageCompressor
                            uri={userUrl}
                            style={styles.userImage}
                        />

                    </View>
                    <View style={styles.nameContainer}>
                        <Text style={[styles.name, stylesGlobal.font]}>{fullName}</Text>
                        <Text style={[styles.type, stylesGlobal.font]}>Shared Post</Text>
                    </View>

                    <TouchableOpacity style={styles.settingView} onPress={() => {this.setState({show_visibility: true})}}>
                        <Image style={styles.rowImageStyle} source={this.state.category_array[selected_category].icon_path}/>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.deleteButton}
                        onPress={() => {
                            this.displayDeleteDialog(this.props.data.id, this.props.data.visibility);
                        }}
                    >
                        <Image
                            style={styles.rowImageStyle}
                            source={require("../icons/ic_delete.png")}
                        />
                    </TouchableOpacity>
                </TouchableOpacity>

                <View style={styles.separator} />
            </View>
        );
    }
    /** 
       * display time date data
       */
    renderTimeDateRow(date, fromDate, toDate, fromTime, toTime, vanueAddress) {
        return (

            <View style={{ marginTop: 5, marginRight: 10 }}>
                {fromDate != null ? <View
                    style={styles.viewRowContainer}
                >
                    <View style={styles.viewRowImageConainer}>
                        <Image
                            style={styles.rowImageStyle}
                            source={require("../icons/calendar.png")}
                        />
                    </View>
                    <View style={[stylesGlobal.date_view, {marginLeft:5}]}>
                        <Text style={[styles.rowTextStyle, stylesGlobal.font, {marginLeft: 0}]}>
                            {Moment(fromDate).format('DD MMM YYYY')}
                        </Text>
                    </View>
                    <Text style={[styles.rowTextStyle, stylesGlobal.font,]}>{Moment(fromDate).format('ddd')}</Text>
                    {/* <Text style={[styles.rowTextStyle, stylesGlobal.font]}>
                        {Moment(fromDate).format('MM/DD/YYYY') + " - " + Moment(toDate).format('MM/DD/YYYY')}
                    </Text> */}
                </View> : null}


                {fromTime != null ? <View
                    style={styles.viewRowContainer}
                >
                    <View style={styles.viewRowImageConainer}>
                        <Image
                            style={styles.rowImageStyle}
                            source={require("../icons/clock.png")}
                        />
                    </View>
                    <Text style={[styles.rowTextStyle, stylesGlobal.font]}>
                        {fromTime.toUpperCase() + " - " + toTime.toUpperCase()}
                    </Text>
                </View> : null}

                {vanueAddress != null ? <View
                    style={styles.viewRowContainer}
                >
                    <View
                        style={styles.viewRowImageConainer}
                    >
                        <Image
                            style={styles.rowImageStyle}
                            source={require("../icons/pin.png")}
                        />
                    </View>
                    <Text
                        style={[styles.rowTextStyle, { paddingRight: 5 }, stylesGlobal.font]}
                    >
                        {vanueAddress}
                    </Text>
                </View> : null}

            </View>
        );
    }

    /** 
       * display like and comment data
       */
    renderLikeCommentView(data) {
        var sharePost = false;
        if (data.shared_by_user_id != null && data.user_info != null) {
            sharePost = true;
        }
        var isLike = data.is_likes == 1;
        var totalLikes = data.total_likes;
        if(totalLikes == null || totalLikes == undefined) {
            totalLikes = 0;
        }
        var totalCommetns = data.total_comments;
        var likes;
        if (data.is_likes == 1) {
            likes = " " + totalLikes;
        } else {
            likes = " " + totalLikes;
        }
        var comments = totalCommetns;
        if(comments == null || comments == undefined) {
            comments = 0;
        }
        return (
            <View>
                <View style={[styles.viewRowContainer, {marginTop: 5}]}>
                    <View style={[styles.viewRowContainer, { flex: 1, paddingBottom: 0, paddingTop: 0 }]}>
                        <TouchableOpacity
                            style={[styles.viewRowContainer, { flex: 0.9, paddingBottom: 0, paddingTop: 0 }]}
                            onPress={() => {
                                this.props.likeUnLikeFeed(data);
                            }}
                        >
                            <Text style={[styles.rowTextStyle, { marginLeft: 1 }, stylesGlobal.font]}>
                                {likes}
                            </Text>
                            <View style={styles.viewRowImageConainer}>
                                <Image
                                    style={styles.rowImageStyle}
                                    source={require("../icons/ic_like.png")}
                                />
                            </View>
                            <Text style={[styles.rowTextStyle, { marginLeft: 1 }, stylesGlobal.font]}>
                                {data.is_likes == 1 ? " Unlike" : "Like"}
                            </Text>

                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.viewRowContainer, { flex: 1.2, paddingBottom: 0, paddingTop: 0 }]}
                            onPress={() => {
                                this.props.screenProps.navigate("FeedComment", {
                                    activityId: data.id,
                                    activityUserId: data.user_id,
                                    totalComment: data.total_comments,
                                    refreshFeedCommentCount: this.props.refreshFeedCommentCount
                                });
                            }}
                        >

                            <Text style={[styles.rowTextStyle, { marginLeft: 1 }, stylesGlobal.font]}>
                                {comments}
                            </Text>
                            <View style={[styles.viewRowImageConainer]}>
                                <Image
                                    style={styles.rowImageStyle}
                                    source={require("../icons/ic_commet.png")}
                                />
                            </View>
                            <Text style={[styles.rowTextStyle, { marginLeft: 1 }, stylesGlobal.font]}>
                                {" Comment"}
                            </Text>
                        </TouchableOpacity>
                        {
                            sharePost ? null :
                                <TouchableOpacity
                                    style={[styles.viewRowContainer, { flex: 0.7, paddingBottom: 0, paddingTop: 0 }]}
                                    onPress={() => {
                                        this.props.shareFeed(data)
                                    }}
                                >
                                    <View
                                        style={[styles.viewRowImageConainer]}
                                    >
                                        <Image
                                            style={styles.rowImageStyle}
                                            source={require("../icons/ic_share.png")}
                                        />
                                    </View>
                                    <Text
                                        style={[styles.rowTextStyle, { marginLeft: 1 }, stylesGlobal.font]}
                                    >
                                        Share
                                    </Text>
                                </TouchableOpacity>
                        }

                    </View>
                    {/* <View style={{ flex: 0.2 }}>
                    </View> */}
                </View>
            </View>
        );
    }

    _emojiSelected(emoji) {

        this.setState({

            commentValue: this.state.commentValue + emoji
        })

    }

    displayDeleteDialog = (postId, postVisibility) => {
        console.log(TAG, "displayDeleteDialog postId==>" + postId);
        console.log(TAG, "displayDeleteDialog postVisibility==>" + postVisibility);
        Alert.alert(Constants.LABEL_DELETE_POST_ALERT_TITLE, Constants.LABEL_DELETE_POST_ALERT_MESSAGE,
            [
                {
                    text: 'Yes', onPress: () => {
                        this.props.callDeletePostAPI(postId, postVisibility)
                    }
                },
                {
                    text: 'No', onPress: () => {

                    }
                }],
            { cancelable: false })
    }

    redirectToDetailScreen = () => {
        let data = this.props.data;
        var sharePost = false;
        if (data.shared_by_user_id != null && data.user_info != null) {
            sharePost = true;
        }
        var url = data.media_url + Constants.THUMB_FOLDER + data.media_name;


        switch (data.activity_type) {
            case "1":
                console.log(TAG, "redirectToDetailScreen " + data.type_title)
                break;
            case "2":
                console.log(TAG, "redirectToDetailScreen " + data.type_title)
                this.openImageZoomView(url, data.activity_type);
                break;
            case "3":
                console.log(TAG, "redirectToDetailScreen " + data.type_title)
                this.openImageZoomView(url, data.activity_type);
                break;
            case "4":
                console.log(TAG, "redirectToDetailScreen " + data.type_title)
                this.openEventDetailView(data.activity_id, data.activity_type)
                break;
            case "5":
                console.log(TAG, "redirectToDetailScreen " + data.type_title)
                this.openImageZoomView(url, data.activity_type);
                break;
            case "6":
                console.log(TAG, "redirectToDetailScreen " + data.type_title)
                this.openImageZoomView(url, data.activity_type);
                break;
            case "7":
                console.log(TAG, "redirectToDetailScreen " + data.type_title)
                this.openImageZoomView(url, data.activity_type);
                break;
            case "8":
                console.log(TAG, "redirectToDetailScreen " + data.type_title)
                this.openImageZoomView(url, data.activity_type);
                break;
            case "9":
                console.log(TAG, "redirectToDetailScreen " + data.type_title)
                this.openImageZoomView(url, data.activity_type);
                break;
            case "10":
                console.log(TAG, "redirectToDetailScreen " + data.type_title)
                this.openEventDetailView(data.activity_id, data.activity_type)
                break;
            case "11":
                console.log(TAG, "redirectToDetailScreen " + data.type_title)
                this.openEventDetailView(data.activity_id, data.activity_type)
                break;
            case "12":
                console.log(TAG, "redirectToDetailScreen " + data.type_title)
                this.openImageZoomView(url, data.activity_type);
                break;
            case "13":
                console.log(TAG, "redirectToDetailScreen " + data.type_title)
                this.openEventDetailView(data.activity_id, data.activity_type)
                break;
            case "14":
                console.log(TAG, "redirectToDetailScreen " + data.type_title)
                this.openImageZoomView(url, data.activity_type);
                break;
            case "15":
                console.log(TAG, "redirectToDetailScreen " + data.type_title)
                this.openEventDetailView(data.activity_id, data.activity_type)
                break;
            case "16":
                console.log(TAG, "redirectToDetailScreen " + data.type_title)
                this.openEventDetailView(data.activity_id, data.activity_type)
                break;
            case "17":
                console.log(TAG, "redirectToDetailScreen " + data.type_title)
                this.openEventDetailView(data.activity_id, data.activity_type)
                break;
            case "18":
                console.log(TAG, "redirectToDetailScreen " + data.type_title)
                this.openEventDetailView(data.activity_id, data.activity_type)
                break;
            case "19":
                console.log(TAG, "redirectToDetailScreen " + data.type_title)
                this.openEventDetailView(data.activity_id, data.activity_type)
                break;
        }

    }


    openImageZoomView = (url, activity_type) => {
        this.props.screenProps.navigate("ImageZoom", {
            index: 0,
            tempGalleryUrls: [{
                id: url,
                image: { uri: url }
            }]
        });
    }

    openEventDetailView = (eventId, activity_type) => {
        console.log(TAG, "openEventDetailView")
        var event_category = "";
        if(activity_type == 15 || activity_type == 16 || activity_type == 17 || activity_type == 18 || activity_type == 19) {
            event_category = "travel";
        } else {
            event_category = "party";
        }
        this.props.screenProps.navigate("EventDetail", {
            eventId: eventId,
            loadAfterDeletingEvent: this.props.refreshEventData,
            refreshEventData:this.props.refreshEventData,
            EventCategory: event_category
        });
    }
}

const styles = StyleSheet.create({
    sharePostContainer: {
        backgroundColor: Colors.white,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: Colors.gray,
        padding: 10,
        margin: 10
    },
    childContainer: {
        backgroundColor: Colors.white,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: Colors.gray,
        padding: 10,
    },
    container: {
        backgroundColor: Colors.white,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: Colors.gray,
        padding: 10,
        margin: 10
    },
    userImageContainer: {
        backgroundColor: Colors.gray,
        width: 60,
        height: 60,
        borderRadius: 30
    },
    userImage: {
        overflow: 'hidden',
        backgroundColor: Colors.white,
        width: 60,
        height: 60,
        borderRadius: 30
    },
    nameContainer: {
        flexDirection: "column",
        marginLeft: 8,
    },
    name: {
        fontSize: 14,
        backgroundColor: Colors.transparent,
        color: Colors.gold
    },
    type: {
        fontSize: 13,
        marginTop: 2,
        backgroundColor: Colors.transparent,
        color: Colors.black
    },
    separator: {
        height: 1,
        marginTop: 10,
        marginBottom: 10,
        width: "100%",
        backgroundColor: Colors.gold
    },
    title: {
        color: Colors.gold,
        fontSize: 15,
        backgroundColor: Colors.transparent,
        marginTop: 5,
        marginBottom: 10
    },
    childFitImage: {
        width: width - 2 * (10 + 10 + 10 + 10),
        height: width - 2 * (10 + 10 + 10 + 10),
        borderRadius: 10,
        minHeight: width * 0.7,
        overflow: 'hidden',
        backgroundColor: Colors.gray
    },
    fitImage: {
        width: width - 2 * (10 + 10 + 10),
        height: width - 2 * (10 + 10 + 10),
        borderRadius: 10,
        minHeight: width * 0.8,
        overflow: 'hidden',
        backgroundColor: Colors.gray
    },
    viewRowContainer: {
        flexDirection: "row",
        backgroundColor: Colors.transparent,
        paddingBottom: 5,
        paddingTop: 5,
        alignItems: "center"
    },
    viewRowImageConainer: {
        width: 25,
        alignContent: "center",
        backgroundColor: Colors.transparent,
        alignItems: "center"
    },
    rowImageStyle: {
        width: 25,
        height: 25,
        resizeMode: 'contain'
    },
    rowTextStyle: {
        color: Colors.black,
        fontSize: 13,
        marginLeft: 5,
        backgroundColor: Colors.transparent
    },
    dateTextStyle: {
        color: Colors.black,
        fontSize: 11,
        marginLeft: 5,
        backgroundColor: Colors.transparent
    },
    deleteButton: {
        height: 40,
        position: 'absolute',
        right: 0,
        justifyContent: 'center',
        alignItems: 'center',
    },
    settingView: {
        position: 'absolute',
        right: 40,
        justifyContent: 'center',
        alignItems: 'center',
        width: 40,
        height: 40,
        alignContent: 'center'
    },
    settingButton: {
        paddingRight: 8,
        paddingLeft: 8,
        paddingBottom: 4,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    settingIcon: {
        fontSize: 26,
    },
    deleteIcon: {
        fontSize: 28,
    },
    visibility_container_view: {
        position: 'absolute', 
        justifyContent: 'space-between', 
        zIndex: 10, 
        backgroundColor: '#ffffff', 
        borderRadius: 3, 
        borderColor: '#000000', 
        borderWidth: 1
    },
    visibility_text: {
        fontSize: 14,
        color: Colors.white
    },
    visibility_button: {
        width: 120, 
        height: 35, 
        flexDirection: 'row', 
        alignItems: 'center', 
        borderRadius: 3, 
        borderColor: '#000000', 
        borderWidth: 1,
        marginBottom: 5
    },
});