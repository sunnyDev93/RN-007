import React, { Component } from 'react'
import { View, Platform, Image } from 'react-native'
import FastImage from 'react-native-fast-image'
import FitImage from 'react-native-fit-image'
import { Colors } from '../consts/Colors'

export class ImageCompressor extends React.Component {

    constructor(props) {
        super(props)

        this.state = {
            showImageView: true
        }
    }

    render() {
        return (
            <View style={[{borderRadius: 10, overflow: 'visible'}, this.props.style ]}>
            {
                (this.props.uri != undefined && this.props.uri != null && this.props.uri != "" && this.props.uri.length > 0 
                    && (this.props.uri.indexOf("http://") > -1 || this.props.uri.indexOf("https://") > -1) ) &&
                <FastImage
                    source={{ uri: this.props.uri }}
                    style={{width: '100%', height: '100%'}}
                    resizeMode={FastImage.resizeMode.cover}
                    blurRadius={10}
                    onLoadStart={() => {
                        this.setState({
                            showImageView: true
                        })
                    }}
                    
                    onLoad={(e) => {
                        this.setState({
                            showImageView: false
                        })
                    }}
                    onError={() => {
                        this.setState({
                            showImageView: true
                        })
                    }}
                />
            }
            {
                this.state.showImageView &&
                <Image
                    source={this.props.default ? this.props.default : require('../icons/Background-Placeholder_Camera.png')}
                    style={[{ position: 'absolute', resizeMode: 'contain', width: '100%', height: '100%', backgroundColor: Colors.empty_background }]}
                ></Image>
            }
            </View>
        );
    } 
}
