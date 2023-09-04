import React, { Component } from "react";
import { StyleSheet, View, StatusBar, Platform, Dimensions } from "react-native";


const isIos = Platform.OS === 'ios';
const isIphoneX = isIos && (Dimensions.get('window').height === 812 || Dimensions.get('window').height === 896);

let STATUS_BAR_HEIGHT = 0;
if (isIos && isIphoneX) {
    STATUS_BAR_HEIGHT = 30;
} else if (isIos) {
    STATUS_BAR_HEIGHT = 20;
} else {
    STATUS_BAR_HEIGHT = StatusBar.currentHeight
}

const MyStatusBar = ({ backgroundColor, ...props }) => (
    
    <View style={[styles.statusBar, { backgroundColor }]}>
        <StatusBar translucent backgroundColor={backgroundColor} {...props} />
    </View>
);

const styles = StyleSheet.create({
    statusBar: {
        height: STATUS_BAR_HEIGHT
    }
});

export default MyStatusBar;