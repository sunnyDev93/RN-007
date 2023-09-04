import React, {Component} from "react";
import {
    View,
    Text,
    TouchableOpacity,
    Dimensions,
    StyleSheet,
    Platform,
    Image,
} from "react-native";

import {ImageCompressor} from './ImageCompressorClass'
import {Constants} from "../consts/Constants";
import {stylesGlobal} from '../consts/StyleSheet'
import {Colors} from "../consts/Colors";
import Moment from "moment/moment";
import * as Global from "../consts/Global";
import {convertEmojimessagetoString, convertStringtoEmojimessage} from "../utils/Util";

const {width} = Dimensions.get("window");
var imageSize = 80;
var imagePadding = 10;
var cardPadding = 10;
var messageWidth = width - imageSize - imagePadding * 3;
var TAG = "RowEventInvite";

var temp = false;

export default class RowEventInvite extends Component {
    constructor(props) {
        super(props);
        this.state = {
            showComment: false,
            showPicker: false,
            commentValue: ""
        };
    }

    render() {

        return (
            <TouchableOpacity activeOpacity = {Global.activeOpacity}
                onPress={() => {
                    if(this.props.data.invitation_id == null) {
                        this.props.onItemPress(this.props.data);
                    }
                }}
            >
                {this.renderEventItem()}
            </TouchableOpacity>
        );
    }
/** 
  * display event info
  */
    renderEventItem = () => {
        const data = this.props.data;

        return (
            <View style = {{width: '100%'}}>
                <View style={styles.container}>
                    <View style={styles.userImageContainer}>
                        <ImageCompressor
                            style={styles.userImage}
                            uri={data.event_image_path + Constants.THUMB_FOLDER + data.event_image_name}
                        />
                    </View>
                    <View style = {{flex: 1, justifyContent: 'center', paddingLeft: 10}}>
                        <Text style={[styles.name, stylesGlobal.font, {marginBottom: 10}]}>{convertStringtoEmojimessage(data.title)}</Text>
                        <View style = {{flexDirection: 'row', alignItems: 'center'}}>
                            <View style={[{paddingVertical: 5, paddingHorizontal: 15, backgroundColor: Colors.gold, borderRadius: 5, alignItems: 'center', justifyContent: 'center'}]}>
                                <Text style={[{fontSize: 12}, stylesGlobal.font]}>{data.from_date == "" ? "" : Moment(data.from_date).format("DD MMM YYYY")}</Text>
                            </View>
                            <Text style={[{fontSize: 12, marginLeft: 5}, stylesGlobal.font]}>{data.from_date == "" ? "" : Moment(data.from_date).format("ddd")}</Text>
                        {
                            data.event_category_name != null && data.event_category_name.toUpperCase() == 'Travel' &&
                            <View style = {{flexDirection: 'row', alignItems: 'center'}}>
                                <Text style={[{fontSize: 12, color: Colors.black, marginLeft: 5, marginRight: 5}, stylesGlobal.font]}>-</Text>
                                <View style={[{paddingVertical: 5, paddingHorizontal: 15, backgroundColor: Colors.gold, borderRadius: 5, alignItems: 'center', justifyContent: 'center'}]}>
                                    <Text style={[{fontSize: 12}, stylesGlobal.font]}>{data.to_date == "" ? "" : Moment(data.to_date).format("DD MMM YYYY")}</Text>
                                </View>
                                <Text style={[{fontSize: 12}, stylesGlobal.font]}>{data.to_date == "" ? "" : Moment(data.to_date).format("ddd")}</Text>
                            </View>
                        }
                        </View>
                    </View>
                {
                    this.props.data.invitation_id != null &&
                    <View style={[{paddingVertical: 5, paddingHorizontal: 15, backgroundColor: Colors.gold, borderRadius: 5, alignSelf: 'center' }]}>
                        <Text style={[{fontSize: 12,}, stylesGlobal.font]}>Already Invited</Text>
                    </View>
                }
                {
                    this.props.data.invitation_id == null &&
                    <View style = {{width: 20, height: 20, alignSelf: 'center', marginRight: 10}}>
                        <Image style={{width: '100%', height: '100%', resizeMode: 'contain'}} source={require('../icons/square.png')}/>
                    {
                        data.check === true &&
                        <Image style={{width: '100%', height: '100%', position: 'absolute', left: 0, top: 0, resizeMode: 'contain'}} source={require('../icons/checked.png')}/>
                    }
                    </View>
                }
                </View>
                <View style={styles.separator}/>
            </View>
        );
    };
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        backgroundColor: Colors.white,
        // padding: cardPadding,
        flexDirection: "row",
    },
    userImageContainer: {
        backgroundColor: Colors.gray,
        width: imageSize,
        height: imageSize,
        borderRadius: imageSize / 2
    },
    userImage: {
        backgroundColor: Colors.white,
        borderRadius: imageSize / 2,
        width: imageSize,
        height: imageSize
    },
    name: {
        fontSize: 13,
        color: Colors.black,
        backgroundColor: Colors.transparent,
        
    },
    separator: {
        height: 1,
        width: "100%",
        marginVertical: 10,
        backgroundColor: Colors.black
    }
});
