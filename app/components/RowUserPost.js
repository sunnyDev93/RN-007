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
import { EventRegister } from 'react-native-event-listeners';
import { ImageCompressor } from './ImageCompressorClass';
import { Colors } from "../consts/Colors";
import { Constants } from "../consts/Constants";
import Moment from "moment/moment";
import { stylesGlobal } from '../consts/StyleSheet';
import Memory from '../core/Memory';
import Video from 'react-native-video-player';
import * as Global from "../consts/Global";
import { convertEmojimessagetoString, convertStringtoEmojimessage } from "../utils/Util";
import ModalDropdown from '../custom_components/react-native-modal-dropdown/ModalDropdown';
import InvisibleBlurView from "../customview/InvisibleBlurView";

var { width, height } = Dimensions.get("window");
width = width > height ? height : width;
var TAG = "RowUserPost";
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
export default class RowUserPost extends Component {
    constructor(props) {
        super(props);
        this.state = {
            showPicker: false,
            emojiSelectedIndex: 0,
            category_array: Global.category_array_all,
            is_verified: this.props.is_verified,
            sharePost: false,
        }
    }

    async UNSAFE_componentWillMount() {
        this.listener = EventRegister.addEventListener(Constants.EVENT_PROFILE_IMAGE_UPDATED, () => {
            console.log(TAG, "EVENT_PROFILE_IMAGE_UPDATED event called");
        })
        if (this.props.data.shared_by_user_id != null && this.props.data.user_info != null) {
            this.setState({
                sharePost: true,
            })
        } else {
            this.setState({
                sharePost: false,
            })
        }
    }

    componentWillUnmount() {
        EventRegister.removeEventListener(this.listener)
    }

    render() {

        return (
            <View>
                {
                    this.state.sharePost ? this.renderShareView(this.props.data) : this.renderChildView(this.props.data)
                }
            </View>
        );
    }

    displayDeleteDialog = (postId, postVisibility) => {
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
    /** 
    * display share view
    */
    renderShareView = (data) => {
        if (data.user_info == null) {
            return null;
        } else if (data.activity_type == "11") {
            return null;
        }
        var visibility = data.user_info.visibility;
        var selected_category_share = 0;
        var userUrl = "";
        var fullName = "";
        var slug = "";
        var postId = data.id;
        if (data.shared_by_user_id != null && data.user_info != null) {  ////  if shared post
            userUrl = data.user_info.imgpath + Constants.THUMB_FOLDER + data.user_info.filename;
            fullName = data.user_info.first_name + " " + data.user_info.last_name;
            slug = data.user_info.slug;
            visibility = data.visibility;
            for (i = 0; i < this.state.category_array.length; i++) {
                if (visibility.toString() == this.state.category_array[i].value.toString()) {
                    selected_category_share = i
                    break;
                }
            }
        }
        return (
            <View style={styles.sharePostContainer}>
                <View>
                    <TouchableOpacity style={{ flexDirection: "row" }}
                        onPress={() => {
                            if (data.user_id === this.props.userId) {
                                this.props.screenProps.navigate("MyProfile", {
                                    refreshProfileImage: this.props.refreshProfileImage
                                });
                            } else {
                                this.props.screenProps.navigate("ProfileDetail", {
                                    slug: slug
                                });
                            }
                        }}
                    >
                        <View style={{ flexDirection: 'row', flex: 1 }}>
                            <View style={styles.userImageContainer}>
                                <ImageCompressor style={styles.userImage} uri={userUrl} />
                                <View style={styles.userCircleView} />
                            </View>
                            <View style={styles.nameContainer}>
                                <Text style={[styles.name, stylesGlobal.font]}>{fullName}</Text>
                                <Text style={[styles.type, stylesGlobal.font]}>{"Shared Post"}</Text>
                            </View>
                        </View>
                        {
                            data.user_info.id != this.props.userId &&
                            <View style={{ flexDirection: 'row' }}>
                                <View style={styles.settingView}>
                                    <Image style={styles.event_property_icon_style} source={this.state.category_array[selected_category_share].icon_path} />
                                </View>
                                {
                                    this.state.is_verified == "1" &&
                                    <TouchableOpacity style={styles.menuView} onPress={() => { this.props.showReportFlag(this.props.data.id); }}>
                                        <Image style={styles.rowImageStyle} source={require("../icons/menu_icon.png")} />
                                    </TouchableOpacity>
                                }
                            </View>
                        }
                        {
                            data.user_info.id == this.props.userId &&
                            <View style={{ flexDirection: 'row' }}>
                                <ModalDropdown
                                    style={{ marginRight: 10 }}
                                    dropdownStyle={styles.visibility_dropdown_view}
                                    defaultIndex={0}
                                    options={this.state.category_array}
                                    onSelect={(index) => {
                                        this.props.callChangePostVisibilityAPI(postId, this.state.category_array[index].value.toString());
                                    }}
                                    renderButton={() => {
                                        return (
                                            <View style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}>
                                                <Image style={{ width: 25, height: 25, resizeMode: 'contain' }} source={this.state.category_array[selected_category_share].icon_path} />
                                            </View>
                                        )
                                    }}
                                    renderRow={(item, index, highlighted) => {
                                        return (
                                            <View style={[styles.visibility_button, selected_category_share == index ? { backgroundColor: Colors.gold } : { backgroundColor: Colors.black }]}>
                                                <Image style={{ width: 20, height: 20, marginLeft: 8 }} resizeMode={'contain'} source={item.icon_path} />
                                                <Text style={[styles.visibility_text, stylesGlobal.font, { marginLeft: 5 }]}>{item.label}</Text>
                                            </View>
                                        )
                                    }}
                                />
                                <TouchableOpacity style={styles.deleteButton}
                                    onPress={() => {
                                        this.displayDeleteDialog(postId, this.state.category_array[selected_category_share].value);
                                    }}
                                >
                                    <Image style={[styles.event_property_icon_style, { width: 30, height: 30 }]} source={require("../icons/ic_delete.png")} />
                                </TouchableOpacity>
                            </View>
                        }
                    </TouchableOpacity>
                    <View style={styles.separator} />
                </View>

                <View >
                    {this.renderChildView(data)}
                </View>
                {
                    data.is_hidden && this.state.sharePost &&
                    <InvisibleBlurView style={{ borderRadius: 10, overflow: 'hidden' }}>
                        <TouchableOpacity style={{ alignItems: 'center', justifyContent: 'center' }} onPress={() => this.props.displayInvisiblePopup(data)}>
                            <Image style={stylesGlobal.hidden_lock_image} source={require("../icons/signin_password.png")}></Image>
                            <Text style={[{ fontSize: 14, color: Colors.gold, marginTop: 5 }, stylesGlobal.font]}>{"Invisible"}</Text>
                        </TouchableOpacity>
                    </InvisibleBlurView>
                }
            </View>
        )
    }

    /** 
    * display child view
    */
    renderChildView = (data) => {

        var title = data.activity_text;
        var activityType = data.activity_type;
        //var url = data.media_url;
        var url = data.media_url ;//+ Constants.THUMB_FOLDER + data.media_name;

       
        var userUrl = data.profile_imgpath + Constants.THUMB_FOLDER + data.profile_filename;
        var fullName = data.first_name + " " + data.last_name;
        var slug = data.slug;
        var typeTitle = data.type_title;
        var date = data.activity_datetime;

        var fromDate = data.from_date;

        var toDate = data.to_date;
        var fromTime = data.from_time;
        var toTime = data.to_time;
        var vanueAddress = data.venue_address;

        var visibility = data.visibility;
        var selected_category_child = 0;
        var postId = data.id;
        for (i = 0; i < this.state.category_array.length; i++) {
            if (visibility.toString() == this.state.category_array[i].value.toString()) {
                selected_category_child = i
                break;
            }
        }

        return (
            <View style={this.state.sharePost ? styles.childContainer : styles.container}>
                <TouchableOpacity style={{ flexDirection: "row" }}
                    onPress={() => {
                        if (data.user_id === this.props.userId) {
                            this.props.screenProps.navigate("MyProfile", {
                                refreshProfileImage: this.props.refreshProfileImage
                            });
                        } else {
                            this.props.screenProps.navigate("ProfileDetail", {
                                slug: slug
                            });
                        }
                    }}
                >
                    <View style={{ flexDirection: 'row', flex: 1 }}>

                        <View style={styles.userImageContainer}>
                            <ImageCompressor style={styles.userImage} uri={userUrl} />
                        </View>
                        <View style={styles.nameContainer}>
                            <Text style={[styles.name, stylesGlobal.font]}>{fullName}</Text>
                            <Text style={[styles.type, stylesGlobal.font]}>{typeTitle}</Text>
                        </View>

                    </View>
                    {
                        !this.state.sharePost && (data.user_id != this.props.userId) &&
                        <View style={{ flexDirection: 'row' }}>
                            <View style={styles.settingView}>
                                <Image style={styles.event_property_icon_style} source={this.state.category_array[selected_category_child].icon_path} />
                            </View>
                            {
                                this.state.is_verified == "1" &&
                                <TouchableOpacity style={styles.menuView} onPress={() => { this.props.showReportFlag(this.props.data.id); }}>
                                    <Image style={styles.rowImageStyle} source={require("../icons/menu_icon.png")} />
                                </TouchableOpacity>
                            }
                        </View>
                    }
                    {
                        !this.state.sharePost && (data.user_id == this.props.userId) &&
                        <View style={{ flexDirection: 'row' }}>
                            <ModalDropdown
                                style={{ marginRight: 10 }}
                                dropdownStyle={styles.visibility_dropdown_view}
                                defaultIndex={0}
                                options={this.state.category_array}
                                onSelect={(index) => {
                                    this.props.callChangePostVisibilityAPI(postId, this.state.category_array[index].value.toString());
                                }}
                                renderButton={() => {
                                    return (
                                        <View style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}>
                                            <Image style={{ width: 25, height: 25, resizeMode: 'contain' }} source={this.state.category_array[selected_category_child].icon_path} />
                                        </View>
                                    )
                                }}
                                renderRow={(item, index, highlighted) => {
                                    return (
                                        <View style={[styles.visibility_button, selected_category_child == index ? { backgroundColor: Colors.gold } : { backgroundColor: Colors.black }]}>
                                            <Image style={{ width: 20, height: 20, marginLeft: 8 }} resizeMode={'contain'} source={item.icon_path} />
                                            <Text style={[styles.visibility_text, stylesGlobal.font, { marginLeft: 5 }]}>{item.label}</Text>
                                        </View>
                                    )
                                }}
                            />

                            <TouchableOpacity style={styles.deleteButton} onPress={() => { this.displayDeleteDialog(postId, this.state.category_array[selected_category_child].value); }}>
                                <Image style={[styles.event_property_icon_style, { width: 30, height: 30 }]} source={require("../icons/ic_delete.png")} />
                            </TouchableOpacity>
                        </View>
                    }
                </TouchableOpacity>

                <View style={styles.separator} />

                <TouchableOpacity onPress={() => { this.redirectToDetailScreen() }}>
                    {title != "" ? <Text style={[styles.title, stylesGlobal.font]}>{convertStringtoEmojimessage(title)}</Text> : null}
                </TouchableOpacity>

                {this.renderImageVideoFile(data)}

                <Text style={[styles.dateTextStyle, { marginTop: 5 }, stylesGlobal.font]}>{Moment(date).utc().format('DD MMM YYYY')}</Text>
                {(activityType == "15" || activityType == "16" || activityType == "17" || activityType == "18" || activityType == "19") ? null : this.renderTimeDateRow(date, fromDate, toDate, fromTime, toTime, vanueAddress)}
                
                
                {(activityType == "15" || activityType == "16" || activityType == "17" || activityType == "18" || activityType == "19") &&
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Image source={require('../icons/calendar.png')} style={[styles.event_property_icon_style, { marginTop: 10 }]} />
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', marginTop: 10, }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <View style={[stylesGlobal.date_view, { marginLeft: 5 }]}>
                                <Text style={[styles.rowTextStyle, stylesGlobal.font, { marginLeft: 0 }]}>{Moment(fromDate).format("DD MMM YYYY")}</Text>
                            </View>
                            <Text style={[styles.rowTextStyle, stylesGlobal.font]}>{Moment(fromDate).format("ddd")}</Text>
                        </View>

                        <Text style={[styles.rowTextStyle, stylesGlobal.font]}>THRU</Text>

                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10, }}>
                            <View style={[stylesGlobal.date_view, { marginLeft: 5 }]}>
                                <Text style={[styles.rowTextStyle, stylesGlobal.font, { marginLeft: 0 }]}>{Moment(toDate).format("DD MMM YYYY")}</Text>
                            </View>
                            <Text style={[styles.rowTextStyle, stylesGlobal.font]}>{Moment(toDate).format("ddd")}</Text>
                        </View>
                    </View>
                </View>
                }
                {data.venue_address && 
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Image source={require('../icons/pin.png')} style={[styles.event_property_icon_style2   , { marginTop: 0 }]} />
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', marginTop: 0, marginRight: 10, paddingRight: 10 }}>
                            <Text style={[styles.rowTextStyle, stylesGlobal.font, { marginLeft: 5, flexWrap: 'wrap', marginRight: 10, flex: 1, flexShrink: 1 }]}>{data.venue_address}</Text>
                        </View>
                      
                    </View>
                }

                


                
                {this.renderLikeCommentView(data)}
                {
                    data.is_hidden && !this.state.sharePost &&
                    <InvisibleBlurView style={{ borderRadius: 10, overflow: 'hidden' }}>
                        <TouchableOpacity style={{ alignItems: 'center', justifyContent: 'center' }} onPress={() => this.props.displayInvisiblePopup(data)}>
                            <Image style={stylesGlobal.hidden_lock_image} source={require("../icons/signin_password.png")}></Image>
                            <Text style={[{ fontSize: 14, color: Colors.gold, marginTop: 5 }, stylesGlobal.font]}>{"Invisible"}</Text>
                        </TouchableOpacity>
                    </InvisibleBlurView>
                }
            </View>
        );
    }

    removeSubString = (substr, src) => {
        return src.replace(substr, "");
    }

    /** 
    * display image ,video base on type
    */
    renderImageVideoFile = (data) => {
        var activityType = data.activity_type;
        //var url = data.media_url;
        var url = data.media_url ;//+ Constants.THUMB_FOLDER + data.media_name;
        var fromDate = data.from_date;
        var toDate = data.to_date;
        let imageView = (
            <TouchableOpacity onPress={() => { this.redirectToDetailScreen() }}>
                <ImageCompressor
                    uri={url}
                    style={this.state.sharePost ? styles.childFitImage : styles.fitImage}
                    default={require("../icons/Background-Placeholder_Camera.png")}
                />
            </TouchableOpacity >
        );

        let videoView = (
            <View style={{ borderRadius: 10, overflow: 'hidden' }}>
                <Video
                    ref={ref => this._video = ref}
                    videoWidth={width * 0.8}
                    videoHeight={width * 0.8}
                    autoplay
                    video={{ uri: url }}
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

        let travelplanView = (
            < TouchableOpacity style={{ padding: 10, paddingLeft: 0 }} onPress={() => { this.redirectToDetailScreen() }}>
                {/* <View style={{flexDirection:'row', alignItems:'center'}}>
                    <Image source={require('../icons/pin.png')} style={styles.event_property_icon_style} />
                    <Text style={[styles.rowTextStyle, stylesGlobal.font, {marginLeft: 5}]}>{data.venue_address}</Text>
                </View> */}
                <ImageCompressor
                    uri={url}
                    style={this.state.sharePost ? styles.childFitImage : styles.fitImage}
                    default={require("../icons/Background-Placeholder_Camera.png")}
                />


                
            </TouchableOpacity >
        );
        return (
            <View>
                {activityType == "1" && null}
                {activityType == "2" && imageView}
                {activityType == "3" && videoView}
                {activityType == "4" && imageView}
                {activityType == "5" && imageView}
                {activityType == "6" && imageView}
                {activityType == "7" && imageView}
                {activityType == "8" && imageView}
                {activityType == "9" && imageView}
                {activityType == "10" && imageView}
                {activityType == "11" && imageView}
                {activityType == "12" && imageView}
                {activityType == "13" && imageView}
                {activityType == "14" && imageView}
                {activityType == "15" && travelplanView}
                {activityType == "16" && travelplanView}
                {activityType == "17" && travelplanView}
                {activityType == "18" && travelplanView}
                {activityType == "19" && travelplanView}
            </View>
        );
    }

    /** 
    * display time date info
    */
    renderTimeDateRow(date, fromDate, toDate, fromTime, toTime, vanueAddress) {
        
        return (

            <View style={{ marginTop: 5, marginRight: 10 }}>
                {
                    fromDate != null ? <View style={styles.viewRowContainer}>
                        <View style={styles.viewRowImageConainer}>
                            <Image style={styles.event_property_icon_style} source={require("../icons/calendar.png")} />
                        </View>
                        <View style={[stylesGlobal.date_view, { marginLeft: 5, }]}>
                            <Text style={[styles.rowTextStyle, stylesGlobal.font, { marginLeft: 0 }]}>
                                { Moment(fromDate).utc().format('DD MMM YYYY')}
                            </Text>
                        </View>
                        <Text style={[styles.rowTextStyle, stylesGlobal.font, { color: '#000000', }]}>({Moment(fromDate).format('ddd')})</Text>
                        {/* <Text style={[styles.rowTextStyle, stylesGlobal.font]}>
                        {Moment(fromDate).format('DD/MMM/YYYY') + " - " + Moment(toDate).format('DD/MMM/YYYY')}
                    </Text> */}
                    </View> : null
                }
                {
                    fromTime != null ? <View style={styles.viewRowContainer}>
                        <View style={styles.viewRowImageConainer}>
                            <Image style={styles.event_property_icon_style} source={require("../icons/clock.png")} />
                        </View>
                        <Text style={[styles.rowTextStyle, stylesGlobal.font]}>{fromTime.toUpperCase() + " - " + toTime.toUpperCase()}</Text>
                    </View> : null
                }
                {/* {   
                vanueAddress != null ? <View style={styles.viewRowContainer}>
                    <View style={styles.viewRowImageConainer}>
                        <Image style={styles.event_property_icon_style} source={require("../icons/pin.png")}/>
                    </View>
                    <Text style={[styles.rowTextStyle, { paddingRight: 5 }, stylesGlobal.font]}>{vanueAddress}</Text>
                </View> : null
            } */}
            </View>
        );
    }

    /** 
    * display like unlike share  info
    */
    renderLikeCommentView(data) {

        //console.log('hhhhhh', JSON.stringify(data));

        var isLike = data.is_likes == 1;
        var totalLikes = data.total_likes;
        if (totalLikes == null || totalLikes == undefined) {
            totalLikes = 0;
        }

        var likes;
        if (data.is_likes == 1) {
            likes = " " + totalLikes;
        } else {
            likes = " " + totalLikes;
        }
        var totalCommetns = data.total_comments;
        var comments = totalCommetns;
        if (comments == null || comments == undefined) {
            comments = 0;
        }
        return (
            <View>
                <View style={styles.viewRowContainer}>
                    <View style={[styles.viewRowContainer, { flex: 1, paddingBottom: 0, paddingTop: 0 }]}>
                        <TouchableOpacity style={[styles.viewRowContainer, { flex: 0.9, paddingBottom: 0, paddingTop: 0 }]}
                            onPress={() => {
                                if (this.state.is_verified == "1") {
                                    this.props.likeUnLikeFeed(data);
                                }
                            }}
                        >
                            
                            <View style={styles.viewRowImageConainer}>
                                <Image style={styles.event_property_icon_style} source={require("../icons/ic_like.png")} />
                            </View>
                            <Text style={[styles.rowTextStyle, { marginRight: 2}, stylesGlobal.font]}>{likes}</Text>
                            <Text style={[styles.rowTextStyle, { marginLeft: 1 }, stylesGlobal.font]}>{"Like"}{totalLikes == 1 ? "" : "s"}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.viewRowContainer, { flex: 1.2, paddingBottom: 0, paddingTop: 0 }]}
                            onPress={() => {
                                if (this.state.is_verified == "1") {
                                    this.props.addCommentNumber(data);
                                    // this.props.screenProps.navigate("FeedComment", {
                                    //     activityId: data.id,
                                    //     activityUserId: data.user_id,
                                    //     totalComment: data.total_comments,
                                    //     refreshFeedCommentCount: this.props.refreshFeedCommentCount
                                    // });
                                }
                            }}
                        >

                            
                            <View style={[styles.viewRowImageConainer]}>
                                <Image style={styles.event_property_icon_style} source={require("../icons/ic_commet.png")} />
                            </View>
                            <Text style={[styles.rowTextStyle, { marginLeft: 1, marginRight: 2}, stylesGlobal.font]}>{comments}</Text>
                            <Text style={[styles.rowTextStyle, { marginLeft: 1 }, stylesGlobal.font]}>{comments == 1 ? " Comment" : "Comments"}</Text>
                        </TouchableOpacity>
                        {
                            this.state.sharePost ? null :
                                <TouchableOpacity style={[styles.viewRowContainer, { flex: 0.7, paddingBottom: 0, paddingTop: 0 }]}
                                    onPress={() => {
                                        if (this.state.is_verified == "1") {
                                            Alert.alert(Constants.SHARE_POST_OWN_TIMELINE, "",
                                                [
                                                    { text: 'No', onPress: null },
                                                    { text: 'Yes', onPress: () => this.props.shareFeed(data) }
                                                ]
                                            )

                                        }
                                    }
                                    }
                                >
                                    <View style={[styles.viewRowImageConainer]}>
                                        <Image style={styles.event_property_icon_style} source={require("../icons/ic_share.png")} />
                                    </View>
                                    <Text style={[styles.rowTextStyle, { marginLeft: 1 }, stylesGlobal.font]}>Share</Text>
                                </TouchableOpacity>
                        }
                    </View>
                </View>
            </View>
        );
    }

    updateRecentChatList = () => {

    };


    redirectToDetailScreen = () => {
        let data = this.props.data;
        //var url = data.media_url;
        var url = this.removeSubString(`${Constants.THUMB_FOLDER}/`, data.media_url) ;//+ Constants.THUMB_FOLDER + data.media_name;
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
        console.log(TAG, "openEventDetailView");
        var event_category = "";
        if (activity_type == 15 || activity_type == 16 || activity_type == 17 || activity_type == 18 || activity_type == 19) {
            event_category = "travel";
        } else {
            event_category = "party";
        }
        this.props.screenProps.navigate("EventDetail", {
            eventId: eventId,
            loadAfterDeletingEvent: this.props.refreshEventData,
            refreshEventData: this.props.refreshEventData,
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
        borderRadius: 50 / 2
    },
    userImage: {
        overflow: 'visible',
        backgroundColor: Colors.white,
        borderRadius: 50 / 2,
        width: 50,
        height: 50
    },
    userCircleView: {
        position: 'absolute',
        top: -(24),
        bottom: -(24),
        right: -(24),
        left: -(24),
        borderRadius: 36,
        borderWidth: (24),
        borderColor: Colors.transparent
    },
    nameContainer: {
        flexDirection: "column",
        marginLeft: 8,
        alignSelf: 'center'
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
        // backgroundColor: Colors.transparent,
        marginTop: 5,
        marginBottom: 10
    },
    childFitImage: {
        width: width - 2 * (10 + 10 + 10 + 10 + 10),
        height: width - 2 * (10 + 10 + 10 + 10 + 10),
        borderRadius: 10,
        minHeight: width * 0.7,
        overflow: 'hidden',
        backgroundColor: Colors.gray
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
    fitImage: {
        width: width - 2 * (10 + 10 + 10 + 10),
        height: width - 2 * (10 + 10 + 10 + 10),
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
    event_property_icon_style: {
        width: 25,
        height: 25,
        resizeMode: 'contain'
    },
    event_property_icon_style2: {
        width: 27,
        height: 27,
        resizeMode: 'contain'
    },
    rowImageStyle: {
        tintColor: Colors.gold

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
        // position: 'absolute',
        // right: 0,
        justifyContent: 'center',
        alignItems: 'center'
    },

    deleteButton: {
        height: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    settingView: {
        position: 'absolute',
        right: 30,
        justifyContent: 'center',
        alignItems: 'center',
        width: 40,
        height: 40,
        alignContent: 'center'
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
    visibility_dropdown_view: {
        height: 35 * 6 + 5 * 7,
        paddingLeft: 5,
        paddingTop: 5,
        paddingRight: 5,
        backgroundColor: '#ffffff',
        borderRadius: 3,
        borderColor: '#000000',
        borderWidth: 1
    }
});
