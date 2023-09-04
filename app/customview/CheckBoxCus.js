import React, {Component} from 'react'
import {Image, TouchableOpacity, Text, View} from 'react-native'
import {Colors} from '../consts/Colors'
import {stylesGlobal} from '../consts/StyleSheet'

export default class CheckBox extends Component {
    static defaultProps ={
        disabled:false
    }
    render() {
        return(
            <View style={[{marginVertical:5, marginLeft:30, flexDirection:'row'}, this.props.style]}>
                <TouchableOpacity
                    disabled={this.props.disabled}
                    style={{width:30}}
                    onPress= {this.props.onPress}
                >
                    <Image 
                        source={require('../icons/checkbox.png')}
                        style={{width:20, height:20, position:'absolute', left:0, bottom:0}}
                    />
                    {this.props.checked &&
                    <Image 
                        source={require('../icons/checked.png')}
                        style={{width:20, height:20, position:'absolute', left:3, bottom:5}}
                    />
                    }
                </TouchableOpacity>
                <Text style={[this.props.disabled? {color: 'gray'} : this.props.checked ? {color: Colors.gold} : {color:'#000'} , stylesGlobal.font]}>{this.props.text}</Text>
            </View>
        )
    }
}