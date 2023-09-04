import React, { Component,Fragment } from "react";
import { Colors } from "../consts/Colors";
import { stylesGlobal, STICKY_HEADER_HEIGHT } from '../consts/StyleSheet'
import {Calendar} from 'react-native-calendars';
import {
    Alert,
    Platform,
    StyleSheet,
    Text,
    View,
    TextInput,
    TouchableOpacity,
    SafeAreaView,
    Dimensions,
    Image,
    Keyboard,
    KeyboardAvoidingView,
    StatusBar,
    Modal,
    ImageBackground

} from "react-native";

export default class CustomCalendarView extends React.Component {
    constructor() {
        super();
        this.setState({});
    }

    render(){
        return(
<View
        style={[
            {
            position: "absolute",
            left: 0,
            top: 0,
            right: 0,
            bottom: 0,
            zIndex: 200,
            elevation: 200,
            alignItems: "center",
            },
        ]}
        >
        <View
            style={{
            width: "100%",
            height: "100%",
            position: "absolute",
            backgroundColor: Colors.black,
            opacity: 0.3,
            }}
        />
        <View
            style={{
            width: "70%",
            height: "100%",
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 10 ,
            }}
        >
            <View
            style={[{
                width: "100%",
                borderRadius: 10,
                backgroundColor: Colors.white,
                overflow: "hidden",
                
            },
            stylesGlobal.shadow_style,
        ]}
            >              
                <View style={{margin: 10, justifyContent: 'center', alignItems: 'center'}}>
                    <View style={{position:'absolute', right: 0, top: 0}}>
                        <TouchableOpacity
                            underlayColor="#fff"
                            onPress={() => {
                                this.props.onClosed();
                            }}
                        >
                            <ImageBackground style={{width: 20, height: 20, justifyContent: 'center', alignItems: 'center'}} source={require('../icons/connection-delete.png')}>
                            
                            </ImageBackground>
                        </TouchableOpacity>
                        
                    </View>

                        <View style={{width: '95%', marginTop: 20, justifyContent: 'center', alignItems: 'center'}}>
                        {this.props.selectedDate&& <Calendar
                            style={{width: '100%'}}
                            // Initially visible month. Default = now
                            current={this.props.selectedDate}
                            // Minimum date that can be selected, dates before minDate will be grayed out. Default = undefined
                            
                            //markedDates={{[this.props.selectedDate]:{selected: true, selectedColor: 'green'}}}
                            markedDates={{[this.props.selectedDate]:{selected: true, selectedColor: 'green'}}}
                            hideArrows={true}
                            
                            />}
                            
                        </View>
                    
                </View>
            </View>
        </View>
    </View>
        );
    }
}
