import React, { Component } from 'react';
import {
    StyleSheet,
    View,
    ActivityIndicator,
    Image
} from 'react-native';

export default class PulllDownIndicator extends React.Component {
/**
    * common activity indicator view
    */
    render() {
        return (
            <View style={[styles.container, this.props.extraStyle]}>
                {/* <View style={[styles.container, ]}></View> */}
                {/* <ActivityIndicator
                    animating={true}
                    color='#cfae45'
                    size="large"
                    style={styles.activityIndicator} /> */}
                <Image style = {{width: 50, height: 50}} resizeMode = {'contain'} source={require("../icons/loader.gif")}/>
            </View>
        );
    }
}

PulllDownIndicator.defaultProps = {
    extraStyle: {}
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        height: 80,
        justifyContent: 'center',
        alignItems: 'center',
        // backgroundColor: '#000000',
        // opacity: 0.3
    },
    activityIndicator: {
        width: 30,
        height: 30,
    },
});
