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
const imageWidth = 80;
var TAG = "RowAddedYouAsFavourite";
export default class RowAddedYouAsFavourite extends Component {

    UNSAFE_componentWillMount() {
        this.listener = EventRegister.addEventListener(Constants.EVENT_PROFILE_IMAGE_UPDATED, () => {
            console.log(TAG,"EVENT_PROFILE_IMAGE_UPDATED event called");
        })
    }
    
    componentWillUnmount() {
        EventRegister.removeEventListener(this.listener)
    }
    
    /** 
    * display user info
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
                <View
                    style={{
                        flex: 1,
                        width: "100%",
                        height: 0.6,
                        backgroundColor: Colors.black,
                        marginBottom: 5
                    }}
                />
            </TouchableOpacity>
        );
    }
}
const styles = StyleSheet.create({
    container: {
        backgroundColor: Colors.white,
        flexDirection: "row",
        flex: 1,
        marginTop: 5,
        marginBottom: 5,
        alignItems: 'center'
    },
    imageContainer: {
        width: imageWidth,
        height: imageWidth,
        backgroundColor: Colors.gray,
        alignSelf: "center",
        borderRadius: imageWidth / 2,
        overflow: 'hidden',
    },
    image: {
        width: imageWidth,
        height: imageWidth,
        overflow: 'visible',
        backgroundColor: Colors.gray,
        borderRadius: 6,
    },
    roundCornerView: {
        position: 'absolute',
        top: -(6),
        bottom: -(6),
        right: -(6),
        left: -(6),
        borderRadius: 9,
        borderWidth: (6),
        borderColor: Colors.white
    },
    name: {
        color: Colors.gold,
        fontSize: 14,
        marginLeft: 10,
        backgroundColor: Colors.transparent,
        // marginTop: 5
    }
});
