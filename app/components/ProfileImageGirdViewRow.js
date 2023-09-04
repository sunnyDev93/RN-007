import React, { Component } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    Dimensions,
    StyleSheet,
    Platform,
    Image,
} from "react-native";
import { Colors } from "../consts/Colors";

const { width } = Dimensions.get("window");
import * as Global from "../consts/Global";
import {stylesGlobal} from '../consts/StyleSheet'

var TAG = "ProfileImageGirdViewRow";

var card_margin = 15;
var card_padding = 10;

export default class ProfileImageGirdViewRow extends Component {
    constructor(props) {
        super(props);
        this.state = {
            cardWidth: 0
        }
    }

    UNSAFE_componentWillMount() {
        if(Dimensions.get("window").width < Dimensions.get("window").height) {
            this.setState({
                cardWidth: (Dimensions.get("window").width - card_margin * 2 - card_padding * 2) * 0.32
            })
        } else {
            this.setState({
                cardWidth: (Dimensions.get("window").width - card_margin * 2 - card_padding * 2) * 0.14
            })
        }
        Dimensions.addEventListener("change", () => {
            if(Dimensions.get("window").width < Dimensions.get("window").height) {
                this.setState({
                    cardWidth: (Dimensions.get("window").width - card_margin * 2 - card_padding * 2) * 0.32
                })
            } else {
                this.setState({
                    cardWidth: (Dimensions.get("window").width - card_margin * 2 - card_padding * 2) * 0.14
                })
            }
        })
    }

    render() {
        var data = this.props.data;
        var url = data.imgpath + data.filename;
        var isPrivate = this.props.isPrivateAlbum;//(data.visibility.toString() === Global.visibility_invitee.toString());
        
        return (
            <TouchableOpacity style={{backgroundColor: Colors.white, width: this.state.cardWidth, aspectRatio: 1}} 
                onPress={() => {
                    if(!this.props.isPrivateAlbum)
                        this.showLargeImage()
                }
            }>
                <Image
                    style={{width: '100%', height: '100%', resizeMode: 'cover'}}
                    source={{ uri: url.toString() }}
                    defaultSource={require("../icons/Background-Placeholder_Camera.png")}
                />
                {
                    // (isPrivate && !this.props.isMyImage) ? <View
                    //     style={[styles.blurView]}>
                    //     <TouchableOpacity style={styles.emptyAddView}
                    //         onPress={() => {
                    //             this.props.requestAccess(data.id);
                    //         }}
                    //     >
                    //         <Text style={[styles.emptyAddText, stylesGlobal.font]}>{"Request Access"}</Text>
                    //     </TouchableOpacity>
                    // </View> : null
                    isPrivate ? <View style={[styles.blurView]}>
                        <Image style={[stylesGlobal.hidden_lock_image, {width: 30, height: 30}]} source={require("../icons/signin_password.png")}></Image>
                    </View> : null
                }
            </TouchableOpacity>
        );
    }
    /** 
        * display large image
        */
    showLargeImage = () => {
        var isPrivate = (this.props.data.visibility.toString() == Global.visibility_invitee.toString());
        if (!isPrivate || this.props.isMyImage) {
            this.props.screenProps.navigate("ImageZoom", {
                index: this.props.isMyImage ? this.props.index : this.props.isPrivateAlbum ? this.props.index - 1 : this.props.index,
                tempGalleryUrls: this.props.tempGalleryUrls
            });

        }
    }
}

const styles = StyleSheet.create({
    blurView: {
        width: '100%',
        height: '100%',
        backgroundColor: Colors.white,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'absolute',
        top: 0,
        left: 0,
        opacity: 0.90,
    },
    emptyAddView: {
        backgroundColor: Colors.gold,
        padding: 5,
        borderRadius: 5,
        width: 90
    },
    emptyAddText: {
        fontSize: 10,
        textAlign: 'center',
        color: Colors.white
    }
});
