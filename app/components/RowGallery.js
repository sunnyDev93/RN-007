import React, { Component } from "react";
import {
    View,
    Image,
    TouchableOpacity,
    Dimensions,
    StyleSheet,
    Platform
} from "react-native";
import { Colors } from "../consts/Colors";

const { width } = Dimensions.get("window");
const imageWidth = width / 3;
var TAG = "RowGallery";
export default class RowGallery extends Component {
    /** 
 * display gallery image
 */
    render() {
        var data = this.props.data;
        var url = data.imgpath + data.filename;

        return (
            <TouchableOpacity
                activeOpacity={1}
                onPress={() => {

                }}
            >
                <View style={styles.itemContainer}>
                    <Image
                        source={{ uri: url }}
                        style={styles.image}
                        defaultSource={require("../icons/Background-Placeholder_Camera.png")}
                    />
                </View>
            </TouchableOpacity>
        );
    }
}
const styles = StyleSheet.create({
    itemContainer: {
        justifyContent: "flex-end",
        borderRadius: 5,
        padding: 10,
        height: 150
    },
    image: {
        resizeMode: "cover",
        width: imageWidth,
        height: imageWidth,
        backgroundColor: Colors.gray
    }
});
