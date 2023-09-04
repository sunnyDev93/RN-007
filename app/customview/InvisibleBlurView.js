import React, {Component} from 'react';
import {View, Text, TouchableOpacity} from 'react-native'
import { Colors } from '../consts/Colors'
import { stylesGlobal } from '../consts/StyleSheet';
import { BlurView, VibrancyView } from "@react-native-community/blur";


export default class InvisibleBlurView extends Component {
    render() {
        return(
            // <BlurView
            //     style={{position: 'absolute', top: 0, left: 0, bottom: 0, right: 0, alignItems: 'center', justifyContent: 'center'}}
            //     blurType="light"
            //     blurAmount={50}
            //     overlayColor = {'#ffffff'}
            // >
            // {
            //     (this.props.children)
            // }
            // </BlurView>
            <View style={[{position: 'absolute', top: 0, left: 0, bottom: 0, right: 0, alignItems: 'center', justifyContent: 'center'}, this.props.style]}>
                <View style={{position: 'absolute', top: 0, left: 0, bottom: 0, right: 0, backgroundColor: Colors.white, opacity: 0.97}}/> 
            {
                (this.props.children)
            }
            </View>
        );
    }
}