import React, { Component } from "react";
import {
    View,
    Text,
    Image,
    TouchableOpacity,
    Dimensions,
    StyleSheet,
    Platform
} from "react-native";
import { EventRegister } from 'react-native-event-listeners'
import { Colors } from "../consts/Colors";
import { Constants } from "../consts/Constants";
import { ImageCompressor } from './ImageCompressorClass'
import {stylesGlobal} from '../consts/StyleSheet'
const { width } = Dimensions.get("window");
const imageWidth = width / 3;
var TAG = "RowNewMemberRegister";
export default class RowNewMemberRegister extends Component {
    componentWillMount() {
        this.listener = EventRegister.addEventListener(Constants.EVENT_PROFILE_IMAGE_UPDATED, () => {
            console.log(TAG,"EVENT_PROFILE_IMAGE_UPDATED event called");
        })
    }
    
    componentWillUnmount() {
        EventRegister.removeEventListener(this.listener)
    }
    
    /** 
       * display new member data
       */
    render() {
        var data = this.props.data;
        var fullName = data.first_name + " " + data.last_name;
        var url = data.imgpath + Constants.THUMB_FOLDER + data.filename;
        var slug = data.slug;

        return (
            <TouchableOpacity
                activeOpacity={1}
                onPress={() => {
                    if (data.user_id === this.props.userId) {
                        this.props.screenProps.navigate("MyProfile",{
                            refreshProfileImage:this.refreshProfileImage
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
                        <ImageCompressor
                            uri={url}
                            style={styles.image}
                        />
                        {/* <View style={styles.roundCornerView} /> */}
                    </View>

                    <Text style={[styles.name, stylesGlobal.font]}>{fullName}</Text>
                </View>
            </TouchableOpacity>
        );
    }
}
const styles = StyleSheet.create({
    container: {
        backgroundColor: Colors.white,
        padding: 15,
        alignItems: 'center',
        marginTop: 10
    },
    imageContainer: {
        flex: 1,
        width: imageWidth,
        height: imageWidth,
        backgroundColor: Colors.white,
        alignSelf: "center",
        borderRadius: 10,
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
    }
});
