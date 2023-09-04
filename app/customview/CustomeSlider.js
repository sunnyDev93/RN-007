import React, {Component} from 'react';
import {View, Text, Dimensions} from 'react-native'
import MultiSlider from "@ptomasroos/react-native-multi-slider";
import {Colors} from '../consts/Colors'
import {stylesGlobal} from '../consts/StyleSheet'

export default class CustomSlider extends Component {

    constructor(props) {
        super(props);
        this.state = {
            bar_lengh: 0,
            is_portrait: true
        }
    }

    UNSAFE_componentWillMount() {
        if(Dimensions.get("window").width < Dimensions.get("window").height) {
            this.setState({
                is_portrait: true,
                bar_lengh: Dimensions.get("window").width * 0.6
            })
        } else {
            this.setState({
                is_portrait: false,
                bar_lengh: Dimensions.get("window").width * 0.5 * 0.6
            })
        }
        
        Dimensions.addEventListener("change", () => {
            if(Dimensions.get("window").width < Dimensions.get("window").height) {
                this.setState({
                    is_portrait: true,
                    bar_lengh: Dimensions.get("window").width * 0.6
                })
            } else {
                this.setState({
                    is_portrait: false,
                    bar_lengh: Dimensions.get("window").width * 0.5 * 0.6
                })
            }
        })
    }

    _renderMarker = () => {
        return (
            <View style={{
                backgroundColor:Colors.gold,
                width:12,
                height:12,
                borderRadius:6,
                borderWidth:1,
                borderColor:'#000'
            }}>
            </View>
        )
    }
   
    render() {
        return (
            <View style={{alignItems:'center'}}>
                <View style={{flexDirection:'row'}}>
                    <Text style={[{marginRight:0, marginTop:-3, width: 30, textAlign: 'right'}, stylesGlobal.font]}>{this.props.min}</Text>
                    <MultiSlider 
                        values={this.props.values}
                        sliderLength={this.state.bar_lengh}
                        min={this.props.min}
                        max={this.props.max}
                        customMarker={this._renderMarker}
                        markerOffsetY={3}
                        trackStyle={{
                            height:6,
                            backgroundColor:'transparent',
                            borderRadius:3,
                            borderWidth:1,
                            borderColor:'#000'
                        }}
                        selectedStyle={{
                            backgroundColor:Colors.gold
                        }}
                        onValuesChangeFinish={this.props.onValueChange}
                    />
                    <Text style={[{marginLeft:0, marginTop:-3, width: 30}, stylesGlobal.font]}>{this.props.max}</Text>
                </View>
                <View style={{ alignItems:'center'}}>
                    <View style={{width:'100%', flexDirection:'row', justifyContent:'space-evenly', paddingHorizontal: 30}}>
                        <Text style={[{color:Colors.gold, }, stylesGlobal.font_semibold]}>{'Min: '.concat(this.props.values[0])}</Text>
                        <Text style={[{color:Colors.gold, }, stylesGlobal.font_semibold]}>{'Max: '.concat(this.props.values[1])}</Text>
                    </View>
                    <Text style={[{marginTop: 10}, stylesGlobal.font]}>{this.props.text}</Text>
                </View>
            </View>
            
        )
    }
}