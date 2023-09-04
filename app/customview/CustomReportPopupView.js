import React from 'react';
import {
    Alert, 
    StyleSheet, 
    Text, 
    View, 
    Modal, 
    TextInput, 
    TouchableOpacity,
    Dimensions,
    Image
} from 'react-native';

import { Constants } from "../consts/Constants";
import { Colors } from "../consts/Colors";
import {stylesGlobal} from '../consts/StyleSheet';
import AsyncStorage from '@react-native-community/async-storage';

const { width, height } = Dimensions.get("window")

var TAG = "CustomPopupView"
export default class CustomReportPopupView extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            reportText: "",
            is_portrait: true,
        };
    }

    async UNSAFE_componentWillMount() {
        
        if(Dimensions.get("window").width < Dimensions.get("window").height) {
            this.setState({
                is_portrait: true,
                screen_width: Dimensions.get("window").width
            })
        } else {
            this.setState({
                is_portrait: false,
                screen_width: Dimensions.get("window").height
            })
        }

        Dimensions.addEventListener("change", () => {
            if(Dimensions.get("window").width < Dimensions.get("window").height) {
                this.setState({
                    is_portrait: true,
                    screen_width: Dimensions.get("window").width
                })
            } else {
                this.setState({
                    is_portrait: false,
                    screen_width: Dimensions.get("window").height
                })
            }
        })
    }

    sendReport = async() => {
        if (this.state.reportText.trim() == "") {
            Alert.alert(Constants.ENTER_REASON, "");
        } else {
            this.setState({reportText:''})
            this.props.closeDialog()
            this.props.callAPI(this.state.reportText) 
        }
    }

    closeDialog = () => {
        this.setState({reportText:''});
        this.props.closeDialog()
    }

    render() {
        return (
            <Modal
                animationType="fade"
                transparent={true}
                closeOnClick={true}
                visible={this.props.showModel}
                onRequestClose={() => {
                    this.props.closeDialog();
                }}
                supportedOrientations={['portrait', 'landscape']}
            >
                <View style = {{width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center'}}>
                    <View style = {stylesGlobal.popup_bg_blur_view}></View>
                    <View style = {[stylesGlobal.popup_main_container, {paddingBottom: this.state.is_portrait ? 0 : 20}]}>
                        <View style = {stylesGlobal.popup_title_view}>
                            <Text style = {[stylesGlobal.popup_title_text, stylesGlobal.font]}>{"Report"}</Text>
                            <View style = {{flexDirection: 'row'}}>
                            {
                                !this.state.is_portrait &&
                                <View style = {{flexDirection: 'row', alignItems: 'center'}}>
                                    <TouchableOpacity style = {[stylesGlobal.common_button, {marginEnd: 10}, stylesGlobal.shadow_style]} onPress = {() => this.sendReport()}>
                                        <Text style = {[stylesGlobal.popup_button_text, stylesGlobal.font]}>{"Send"}</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style = {[stylesGlobal.common_button, stylesGlobal.shadow_style]} onPress = {() => this.closeDialog()}>
                                        <Text style = {[stylesGlobal.popup_button_text, stylesGlobal.font]}>{"Cancel"}</Text>
                                    </TouchableOpacity>
                                </View>
                            }
                                <TouchableOpacity style = {stylesGlobal.popup_cancel_button} onPress = {() => this.closeDialog()}>
                                    <Image style = {stylesGlobal.cancel_delete_image} source={require("../icons/connection-delete.png")}/>
                                </TouchableOpacity>
                            </View>
                        </View>
                        <View style = {[stylesGlobal.popup_desc_container]}>
                            <Text style = {[{fontSize: 14, color: Colors.black}, stylesGlobal.font]}>{"Enter a reason for reporting"}</Text>
                            <TextInput style = {[stylesGlobal.popup_textinput, {marginTop: 5}, stylesGlobal.font]} 
                                keyboardType='ascii-capable' 
                                textAlignVertical = {'top'} 
                                multiline = {true}
                                autoCapitalize='sentences'
                                onChangeText = {(text) => this.setState({reportText: text})}
                            >
                                {this.state.reportText}
                            </TextInput>
                        </View>
                    {
                        this.state.is_portrait &&
                        <View style = {stylesGlobal.popup_button_container}>
                            <TouchableOpacity style = {[stylesGlobal.common_button, {marginEnd: 10}, stylesGlobal.shadow_style]} onPress = {() => this.sendReport()}>
                                <Text style = {[stylesGlobal.popup_button_text, stylesGlobal.font]}>{"Send"}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style = {[stylesGlobal.common_button, stylesGlobal.shadow_style]} onPress = {() => this.closeDialog()}>
                                <Text style = {[stylesGlobal.popup_button_text, stylesGlobal.font]}>{"Cancel"}</Text>
                            </TouchableOpacity>
                        </View>
                    }
                    </View>
                </View>
                {/* <View style={{
                    backgroundColor: '#f9f9f9', marginTop: 100, margin: 20, borderRadius: 5,
                    borderWidth: 1, borderColor: '#ffffff'
                }}>

                    <Text style={[{ color: Colors.black, fontSize: 18, marginLeft: 16, marginRight: 16, marginTop: 10, marginBottom: 10, }, stylesGlobal.font]}>{"Enter a reason for reporting"}</Text>

                    <TextInput
                        ref='valueEventDescription'
                        underlineColorAndroid="transparent"
                        blurOnSubmit={false}
                        autoFocus={false}
                        style={[styles.textInputText, stylesGlobal.font]}
                        onChangeText={value => {
                            this.setState({ reportText: value })
                        }}
                        value={this.state.reportText}
                        defaultValue=""
                        multiline={true}
                        placeholder={''}
                        returnKeyType='default'
                        autoCapitalize='sentences'
                        onSubmitEditing={(event) => {

                        }}
                        keyboardType='ascii-capable'
                    ></TextInput>

                    <View style={{ alignItems: "center", flexDirection: 'row', justifyContent: 'center', margin: 20 }}>
                        <TouchableOpacity
                            style={[styles.sendGold, { margin: 10 }, stylesGlobal.shadow_style]}
                            underlayColor="#fff"
                            onPress={() =>
                            {
                                this.setState({reportText:''})
                                this.props.closeDialog()
                            }

                            }
                        >
                            <Text style={[styles.sendTextWhite, stylesGlobal.font]}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.sendGold, { margin: 10 }, stylesGlobal.shadow_style]}
                            underlayColor="#fff"
                            onPress={() => {
                                if (!this.state.isSpam && this.state.reportText.trim().length <= 0) {
                                    Alert.alert(Constants.ENTER_REASON)
                                } else {
                                    //TODO Make API call here
                                    {
                                        this.setState({reportText:''})
                                        this.props.closeDialog()
                                        this.props.callAPI(this.state.reportText) }
                                }
                            }}
                        >
                            <Text style={[styles.sendTextWhite, stylesGlobal.font]}>Send</Text>
                        </TouchableOpacity>
                    </View>
                </View> */}

            </Modal>

        );
    }

    /**
   * display submit button
   */
    renderBottomButton = () => {
        let cancelButton = (<TouchableOpacity
            style={[styles.sendGold, { margin: 10 }, stylesGlobal.shadow_style]}
            underlayColor="#fff"
            onPress={() =>
            {
                this.setState({reportText:''})
                this.props.closeDialog()
            }

            }
        >
            <Text style={[styles.sendTextWhite, stylesGlobal.font]}>Cancel</Text>
        </TouchableOpacity>);

        let sendButton = (<TouchableOpacity
            style={[styles.sendGold, { margin: 10 }, stylesGlobal.shadow_style]}
            underlayColor="#fff"
            onPress={() => {
                if (!this.state.isSpam && this.state.reportText.trim().length <= 0) {
                    Alert.alert(Constants.ENTER_REASON)
                } else {
                    //TODO Make API call here
                    {
                        this.setState({reportText:''})
                        this.props.closeDialog()
                        this.props.callAPI(this.state.reportText) }
                }
            }}
        >
            <Text style={[styles.sendTextWhite, stylesGlobal.font]}>Send</Text>
        </TouchableOpacity>);

        return (
            <View>

                <View style={{ alignItems: "center", flexDirection: 'row', justifyContent: 'center', margin: 20 }}>
                    {cancelButton}
                    {sendButton}
                </View>
            </View>
        );

    };
}
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.black
    },
    textInputText: {
        color: Colors.black,
        padding: 10,
        justifyContent: 'center',
        backgroundColor: Colors.white,
        textAlignVertical: "center",
        fontSize: 13,
        borderColor: Colors.black,
        borderWidth: 1,
        borderRadius: 2,
        minHeight: 100,
        maxHeight: 100,
        marginLeft: 16,
        marginRight: 16,

    },
    submitWhite: {
        padding: 10,
        width: width * 0.25,
        backgroundColor: Colors.white,
        borderRadius: 5,
        borderWidth: 1,
        borderColor: Colors.gold,
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'center',
    },
    sendGold: {
        padding: 10,
        width: width * 0.25,
        backgroundColor: Colors.gold,
        borderRadius: 5,
        borderWidth: 1,
        borderColor: Colors.transparent,
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'center',
    },
    sendTextWhite: {
        color: Colors.white,
        backgroundColor: Colors.transparent,
        textAlign: "center",
        fontSize: 13,
        // fontWeight: 'bold'
    },
    submitTextGold: {
        color: Colors.gold,
        backgroundColor: Colors.transparent,
        textAlign: "center",
        fontSize: 12,
        fontWeight: 'bold'
    },
    radioView: {
        backgroundColor: Colors.transparent,
        flexDirection: 'row',
        marginLeft: 14,
        marginRight: 16,
        marginTop: 8,
    },
    radioIcon: {
        fontSize: 24,
        marginRight: 6
    },
    radioText: {
        color: Colors.black,
        fontSize: 16,
        marginTop: 3
    }
});

