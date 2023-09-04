import React, { Component } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    Dimensions,
    StyleSheet,
    Image
} from "react-native";
import { EventRegister } from 'react-native-event-listeners'
import { ImageCompressor } from './ImageCompressorClass'
import { Colors } from "../consts/Colors";
import { Constants } from "../consts/Constants";
import Moment from "moment/moment";
import {stylesGlobal} from '../consts/StyleSheet';
import Video from 'react-native-video-player';
import {convertEmojimessagetoString, convertStringtoEmojimessage} from "../utils/Util";

const { width } = Dimensions.get("window");
var TAG = "RowUserTimeLine";
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
export default class RowUserTimeLine extends Component {
    constructor(props) {
        super(props);
        this.state = {
            emojiSelectedIndex: 0,
        }
    }

    UNSAFE_componentWillMount() {
        this.listener = EventRegister.addEventListener(Constants.EVENT_PROFILE_IMAGE_UPDATED, () => {
            console.log(TAG,"EVENT_PROFILE_IMAGE_UPDATED event called");
        })
    }
    
    componentWillUnmount() {
        EventRegister.removeEventListener(this.listener)
    }

    render() {
        var data = this.props.data;
        var sharePost = false;
        if (data.shared_by_user_id != null && data.user_info != null) {
            sharePost = true;
        }

        return (
            <View>
                {
                    sharePost ? this.renderShareView(data) : this.renderChildView(data)
                }
            </View>
        );
    }
    /** 
       * display share uer info
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
       * display child view info
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
        //console.log(TAG,"activity_type==>"+data.activity_type);
        return (
            <View style={sharePost ? styles.childContainer : styles.container}>

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
                    {!sharePost ? <TouchableOpacity style={styles.menuView}
                        onPress={() => {
                         
                            this.props.showReportFlag(this.props.data.id);
                        }}
                    >
                        <Image
                            style={[styles.rowImageStyle, {width: 15, height: 15}]}
                            source={require("../icons/menu_icon.png")}
                        />
                    </TouchableOpacity> : null}
                </TouchableOpacity>

                <View style={styles.separator} />

                {title != "" ? <Text style={[styles.title, stylesGlobal.font]}>{title}</Text> : null}
                {this.renderImageVideoFile(data)}


                <Text style={[styles.dateTextStyle, { marginTop: 5 }, stylesGlobal.font]}>{Moment.utc(date).local().format('DD MMM YYYY')}</Text>
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
        var url = data.media_url;// + Constants.THUMB_FOLDER + data.media_name;
        var fromDate = data.from_date;
        var toDate = data.to_date;
        let imageView = (
            < TouchableOpacity onPress={() => {
                this.redirectToDetailScreen()
            }}>
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
                    <Image source={require('../icons/pin.png')} style={styles.rowImageStyle} />
                    <Text style={[styles.rowTextStyle, stylesGlobal.font, { marginLeft: 0}]}>{data.venue_address}</Text>
                </View>
                <View style={{flexDirection:'row', marginTop:10, alignItems:'center'}}>
                    <Image source={require('../icons/calendar.png')} style={styles.rowImageStyle} />
                    <View style={[stylesGlobal.date_view, {marginLeft: 5}]}>
                        <Text style={[styles.rowTextStyle, stylesGlobal.font, {marginLeft: 0}]}>{Moment(fromDate).local().format("DD MMM YYYY")}</Text>
                    </View>
                    <Text style={[styles.rowTextStyle, stylesGlobal.font, ]}>{Moment(fromDate).format('ddd')}</Text>

                    <Text style={[styles.rowTextStyle, { marginLeft: 5}, stylesGlobal.font]}>THRU</Text>

                    <View style={[stylesGlobal.date_view, {marginLeft: 5}]}>
                        <Text style={[styles.rowTextStyle, stylesGlobal.font, {marginLeft: 5}]}>{Moment(toDate).local().format("DD MMM YYYY")}</Text>
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

    renderShareUser = (data) => {
        var userUrl = data.imgpath + Constants.THUMB_FOLDER + data.filename;
        var fullName = data.first_name + " " + data.last_name;
        var slug = data.slug;
        return (
            <View>
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

                    <TouchableOpacity style={styles.menuView}
                        onPress={() => {
                            this.props.showReportFlag(this.props.data);
                        }}
                    >
                        <Image
                            style={styles.rowImageStyle}
                            source={require("../icons/menu_icon.png")}
                        />
                    </TouchableOpacity>
                </TouchableOpacity>

                <View style={styles.separator} />
            </View>
        );
    }
    /** 
       * display time date info
       */
    renderTimeDateRow(date, fromDate, toDate, fromTime, toTime, vanueAddress) {
        return (

            <View style={{ marginTop: 5, marginRight: 10 }}>
                {fromDate != null ? <View
                    style={styles.viewRowContainer}
                >
                    <View
                        style={styles.viewRowImageConainer}
                    >
                        <Image
                            style={styles.rowImageStyle}
                            source={require("../icons/calendar.png")}
                        />
                    </View>
                    <View style={[stylesGlobal.date_view, {marginLeft: 5}]}>
                        <Text style={[styles.rowTextStyle, stylesGlobal.font, {marginLeft: 0}]}>
                            {Moment(fromDate).format('DD MMM YYYY')}
                        </Text>
                    </View>
                    <Text style={[styles.rowTextStyle, stylesGlobal.font, {color: '#000000'}]}>{Moment(fromDate).format('ddd')}</Text>
                    {/* <Text
                        style={[styles.rowTextStyle, stylesGlobal.font]}
                    >
                        {Moment.utc(fromDate).local().format('MM/DD/YYYY') + " - " + Moment.utc(toDate).local().format('MM/DD/YYYY')}
                    </Text> */}
                </View> : null}


                {fromTime != null ? <View
                    style={styles.viewRowContainer}
                >
                    <View
                        style={styles.viewRowImageConainer}
                    >
                        <Image
                            style={styles.rowImageStyle}
                            source={require("../icons/clock.png")}
                        />
                    </View>
                    <Text
                        style={[styles.rowTextStyle, stylesGlobal.font]}
                    >
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
       * display like unlike view
       */
    renderLikeCommentView(data) {
        var sharePost = false;
        if (data.shared_by_user_id != null && data.user_info != null) {
            sharePost = true;
        }
        var isLike = data.is_likes == 1;
        var totalLikes = data.total_likes;
        var likes;
        if (data.is_likes == 1) {
            likes = " " + totalLikes;
        } else {
            likes = " " + totalLikes;
        }
        var totalCommetns = data.total_comments;
        var comments = totalCommetns;
        if(comments == null || comments == undefined) {
            comments = 0;
        }
        return (
            <View>
                <View style={styles.viewRowContainer}>
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
                                    <View style={[styles.viewRowImageConainer]}>
                                        <Image
                                            style={styles.rowImageStyle}
                                            source={require("../icons/ic_share.png")}
                                        />
                                    </View>
                                    <Text style={[styles.rowTextStyle, { marginLeft: 1 }, stylesGlobal.font]}>
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
        width: 50,
        height: 50,
        borderRadius: 25
    },
    userImage: {
        overflow: 'hidden',
        backgroundColor: Colors.white,
        borderRadius: 25,
        width: 50,
        height: 50
    },
    nameContainer: {
        flexDirection: "column",
        marginLeft: 8
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
        marginTop: 5,
        marginBottom: 5,
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
        width: width - 2 * (10 + 10 + 10 ),
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
        margin: 5,
        backgroundColor: Colors.transparent
    },
    menuView: {
        width: 35, height: 35,
        backgroundColor: Colors.transparent,
        position: 'absolute',
        right: 0,
        justifyContent: 'center',
        alignItems: 'center'
    }
});