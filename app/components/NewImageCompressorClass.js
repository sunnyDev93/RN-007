import React, { Component } from 'react'
import { View } from 'react-native'
import FastImage from 'react-native-fast-image'
import FitImage from 'react-native-fit-image'

export const NewImageCompressor = (props) => {
    return (
        <View>
            <FastImage
                source={{
                    uri: props.uri,
                }}
                style={[props.style]}
                resizeMode={FastImage.resizeMode.contain}
            />
        </View>
    );
}
