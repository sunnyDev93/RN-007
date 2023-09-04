import React, { Component } from 'react';
import { Text, TouchableOpacity } from 'react-native'
import { Colors } from '../consts/Colors'
import { stylesGlobal } from '../consts/StyleSheet'

export default class Button extends Component {
    render() {
        return (
            <TouchableOpacity style={[{ width: 150, paddingVertical: 10, backgroundColor: Colors.gold, borderRadius: 5, marginTop: 10, marginRight: 10, justifyContent: 'center', alignItems: 'center' }, stylesGlobal.shadow_style]}
                onPress={this.props.onPress}
            >
                <Text style={{ color: 'white', fontSize: 15, fontWeight: '500', fontFamily: 'raleway' }}>{this.props.text}</Text>
            </TouchableOpacity>
        );
    }
}