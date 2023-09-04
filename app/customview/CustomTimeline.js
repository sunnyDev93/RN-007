"use strict";
import React, {Component} from "react";
import {
    Animated,
    Easing,
    StyleSheet,
    Image,
    View,
    Text,
    FlatList
} from "react-native";
import {Colors} from "../consts/Colors";
import {stylesGlobal} from '../consts/StyleSheet'
import * as Global from "../consts/Global";
import {convertEmojimessagetoString, convertStringtoEmojimessage} from "../utils/Util";


let defaultCircleSize = 18;
let defaultCircleColor = Colors.gold;
let defaultLineWidth = 6;
let defaultLineColor = Colors.gold;
let defaultTimeTextColor = Colors.black;
let defaultDotColor = Colors.black;

export default class CustomTimeline extends Component {
    constructor(props) {
        super(props);

        this.state = {
            data: this.props.data,
            host: this.props.host,
            x: 0,
            width: 0
        };
    }

    UNSAFE_componentWillReceiveProps(nextProps) {
        this.setState({
            data: nextProps.data,
        });
    }

    render() {
        return (
            <View style={styles.container}>
            {
                this.renderRow({"year": "", "description": "", visibility: "1"}, 0)
            }
            {
                this.state.data.map( (item, index) => this.renderRow(item, index) )
            }
            </View>
        );
    }

    /** render CutomTimeLine Single Row of  a user profile
     *
     * @param rowData
     * @param sectionID
     * @param rowID
     * @returns {*}
     */
    renderRow = (rowData, rowID) => {
        return (
            <View key = {rowID} style = {{flex: 1, flexDirection: 'row'}}>
                <Text style={[styles.title, stylesGlobal.font, {width: 50}]}>{rowData.year}</Text>
                <View style={[styles.rowContainer, rowData.year == "" && {height: 20}]}>
                    {this.renderEvent(rowData)}
                    {rowData.year != "" && this.renderCircle()}
                </View>
            </View>
        )
    };

    renderEvent = (rowData) => {
        let isLast = this.state.data.slice(-1)[0] === rowData;
        let lineColor = isLast ? defaultLineColor : defaultLineColor;
        var opStyle = {
            borderColor: lineColor,
            borderLeftWidth: defaultLineWidth,
            borderRightWidth: 0,
            marginLeft: 20,
            paddingLeft: 20,
            backgroundColor: Colors.transparent
        };

        return (
            <View style={[styles.details, opStyle]}
                onLayout={evt => {
                    if (!this.state.x && !this.state.width) {
                        var {x, width} = evt.nativeEvent.layout;
                        this.setState({x, width});
                    }
                }}
            >
                <View style={{flex: 1, paddingBottom: 10}}>
                    {this.renderDetail(rowData)}
                </View>
            </View>
        );
    };

    renderDetail = (rowData,) => {
        
        let title = (
            <View style = {{flex: 1}}>
                <Text style={[styles.description, stylesGlobal.font]}>{convertStringtoEmojimessage(rowData.description)}</Text>
            </View>
        );
        return (
            <View style={styles.container}>
            {
                !(!this.state.host && rowData.visibility.toString() == Global.visibility_private.toString()) &&
                title
            }
            {
                !this.state.host && rowData.visibility.toString() == Global.visibility_private.toString() &&
                <View style = {{flex: 1, height: 50, justifyContent: 'center', alignItems: 'center', flexDirection: 'row'}}>
                    <Image  style={{width: 30, height: 30, marginRight: 10, resizeMode: 'contain'}} source={require("../icons/signin_password.png")}/>
                    <Text style={[styles.description, stylesGlobal.font]}>Private</Text>
                </View>
            }
            </View>
        )
    };

    renderCircle = () => {
        var circleStyle = {
            width: this.state.x ? (defaultCircleSize + 2) : 0,
            height: this.state.x ? (defaultCircleSize + 2) : 0,
            borderRadius: (defaultCircleSize + 2) / 2,
            backgroundColor: defaultCircleColor,
            left: this.state.x - defaultCircleSize / 2 + defaultLineWidth / 2
        };
        let dotStyle = {
            height: defaultCircleSize,
            width: defaultCircleSize,
            borderRadius: defaultCircleSize / 2,
            backgroundColor: defaultDotColor
        };
        return (
            <View style={[styles.circle, circleStyle, this.props.circleStyle]}>
                <Image style = {{width: '100%', height: '100%', resizeMode: 'contain'}} source = {require("../icons/timeline_dot.png")}></Image>
            </View>
        );
    };
}

let styles = StyleSheet.create({
    container: {
        flex: 1
    },
    listview: {
        flex: 1
    },
    rowContainer: {
        flex: 1,
        minHeight: 30
    },
    time: {
        textAlign: "right",
        color: defaultTimeTextColor
    },
    circle: {
        width: 16,
        height: 16,
        borderRadius: 10,
        position: "absolute",
        left: -8,
        alignItems: "center",
        justifyContent: "center"
    },
    title: {
        fontSize: 16,
        // fontWeight: "bold",
        color: Colors.black
    },
    details: {
        flex: 1,
        borderLeftWidth: defaultLineWidth,
        flexDirection: "column",
        paddingBottom: 20
    },
    description: {
        // marginTop: 10,
        color: Colors.black
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: defaultDotColor
    }
});
