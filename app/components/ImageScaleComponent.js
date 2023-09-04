import React, { Component } from 'react'
import { View, Image, ActivityIndicator, Dimensions } from 'react-native'
import FastImage from 'react-native-fast-image'

var TAG = "ImageScaleComponent";
export default class ImageScaleComponent extends Component {

    constructor(props) {
        super(props)
        console.log(TAG, " uri " + this.props.uri);
        this.state = {
            showPlaceHolder: true,
            showProgressBar: true,
            showImageView: true
        }
    }

    render() {
        return (
            <View>
                {/* {
                    this.state.showImageView ?
                        <FastImage
                            style={[this.props.style]}
                            source={{
                                uri: this.props.uri,
                                priority: FastImage.priority.high,
                            }}
                            resizeMode={FastImage.resizeMode.contain}
                            onLoadStart={() => {
                                console.log("onLoadStart")
                                this.setState({
                                    showPlaceHolder: true,
                                    showProgressBar: true,
                                    showImageView: true
                                })
                            }}
                            onProgress={(e) => {
                                console.log(`onProgress - ${e.nativeEvent.loaded / e.nativeEvent.total}`)
                            }}
                            onLoad={(e) => {
                                console.log("onLoad", e.nativeEvent)
                                this.setState({
                                    showPlaceHolder: false,
                                    showProgressBar: false,
                                    showImageView: true
                                })
                            }}
                            onError={() => {
                                console.log("onError")
                                this.setState({
                                    showPlaceHolder: true,
                                    showProgressBar: false,
                                    showImageView: false
                                })
                            }}
                            onLoadEnd={() => {
                                console.log("onLoadEnd")
                            }}
                        />
                        : null
                }


                {
                    this.state.showPlaceHolder ?
                        <Image
                            style={[
                                this.props.style, {
                                    position: 'absolute',
                                }]}
                            resizeMode={"contain"}
                            source={require('../icons/icon_profile_default.png')}
                        /> :
                        null
                }


                {
                    this.state.showProgressBar ?
                        <View style={[
                            this.props.style, {
                                position: 'absolute',
                                backgroundColor: '#00000000',
                                justifyContent: 'center',
                                alignItems: 'center'
                            }]}>

                            <ActivityIndicator
                                animating={true}
                                color='#cfae45'
                                size="large" />

                        </View> :

                        null
                } */}


            </View>
        );
    }

}




