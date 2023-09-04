import React, {Component} from 'react'
import {Image, TouchableOpacity, Text, View} from 'react-native'
import {Colors} from '../consts/Colors'
import {stylesGlobal} from '../consts/StyleSheet'

export default class CheckBoxInviteFriend extends Component {
    static defaultProps ={
        disabled:false
    }
    render() {
        return(
            <View style={[{marginVertical:5, }, this.props.style]}>
                <TouchableOpacity
                    disabled={this.props.disabled}
                    style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'center'}}
                    onPress= {this.props.onPress}
                >
                    <View style = {{width: 20, height: 20, marginRight: 15}}>
                        <Image 
                            source={require('../icons/checkbox.png')}
                            style={{width: '100%', height: '100%', }}
                        />
                        {this.props.checked &&
                        <Image 
                            source={require('../icons/checked.png')}
                            style={{width: '100%', height: '100%', position:'absolute', left: 0, bottom: 0}}
                        />
                        }
                    </View>
                    <Text style={[this.props.disabled? {color: 'gray'} : this.props.checked ? {color: Colors.gold} : {color:'#000'} , stylesGlobal.font, this.props.white? {color:'#fff'} : {color:'#000'}]}>{this.props.text}</Text>
                </TouchableOpacity>
            </View>
        )
    }
}