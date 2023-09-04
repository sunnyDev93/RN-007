import React, {Component} from "react";
import {
    Alert,
    Dimensions,
    Image,
    Platform,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
    ScrollView
} from "react-native";
import {EventRegister} from 'react-native-event-listeners'
import Carousel from 'react-native-snap-carousel';
import {Colors} from "../consts/Colors";
import {Constants} from "../consts/Constants";
import {stylesGlobal} from '../consts/StyleSheet';
import { ImageCompressor } from './ImageCompressorClass';
import images from "../images";
import * as Global from "../consts/Global";
import stylesSliderEntry, {
    sliderWidth,
    itemWidth
} from "../styles/SliderEntry.style";
import stylesSlider, { colors } from "../styles/index.style";
import AsyncStorage from '@react-native-community/async-storage';

var {height, width} = Dimensions.get('window');


var TAG = "SelectRoleScreen";

export default class SelectRoleScreen extends React.Component {

    constructor(props) {
        super(props)

        this.state = {
            initialIndex: -1,
            userImagePath: "",
            userImageName: "",
            showModel: false,
            entries: Global.entriesMain,
            entriesFan: Global.entriesFan,
            typeChange: false,

            rich_gentleman_note: "Note: Nobody can see your exact net worth, only the net worth group which you fall into. Please supply proof in order to get your account activated. If you only can/want to prove a lower net worth that you actually have, then specify that number instead. The minimum net worth to join .007% is US$ 30M."
            
        }
    }

    UNSAFE_componentWillMount() {
        this.setState({
            selected_entries: this.state.entries
        })
        if(this.props.route.params) {
            if(this.props.route.params.typeChange) {
                this.setState({
                    typeChange: this.props.route.params.typeChange
                })
            }
        }
    }

    async componentDidMount() {
        var self = this;
        setTimeout(function() {
            self.refs._carousal.snapToItem(2, animated = true);
        }, 100)
        setTimeout(function() {
            self.refs._carousal.snapToItem(0, animated = true);
        }, 300)
        this.getData();
        
    }

    componentWillUnmount() {
        EventRegister.removeEventListener(this.listener)
    }

    /**
     * get async storage data
     */
    getData = async () => {
        try {

            let userId = await AsyncStorage.getItem(Constants.KEY_USER_ID);
            let userToken = await AsyncStorage.getItem(Constants.KEY_USER_TOKEN);
            let userSlug = await AsyncStorage.getItem(Constants.KEY_USER_SLUG);
            let userFirstName = await AsyncStorage.getItem(Constants.KEY_USER_FIRST_NAME);
            let userLastName = await AsyncStorage.getItem(Constants.KEY_USER_LAST_NAME);
            let userImagePath = await AsyncStorage.getItem(Constants.KEY_USER_IMAGE_URL);
            let userImageName = await AsyncStorage.getItem(Constants.KEY_USER_IMAGE_NAME);

            this.setState({
                userId: userId,
                userToken: userToken,
                userSlug: userSlug,
                userImagePath: userImagePath,
                userImageName: userImageName,
                showModel: false,
            });
        } catch (error) {
            // Error retrieving data
        }

    };
    
    signUp = (type, name, ribbon) => {
        // var type = '0';
        // if(name == "RICH") {
        //     type = "1"
        // } else if(name == "GENEROUS") {
        //     type = "2"
        // } else if(name == "MODEL") {
        //     type = "3"
        // } else if(name == "CONNECTOR") {
        //     type = "5"
        // } else if(name == "FAMOUS") {
        //     type = "6"
        // } else if(name == "VIP FAN") {
        //     type = "4"
        // } else if(name == "FAN") {
        //     type = "7"
        // }
        this.props.navigation.navigate("SignUpScreen", {type: type, name: name, ribbon: ribbon})
    }

    getRibbonImage = (item) => {


        return (
                <View style={styles.ribbon}>
                    <Image style={{ width: '100%', height: '100%', resizeMode: 'contain' }} source={{ uri: item.tag }} />
                </View>
            );
    }
    
    _renderItem = ({item, index}) => {

        console.log('swipe to select  ---->   ', JSON.stringify(item));
        return (
            <View  key={JSON.stringify(item)} style={{width: '100%', alignItems: 'center',flex: 1, paddingTop: 10}}>
                {item.name !== 'NONE'
                    ?
                    <View style={{
                        backgroundColor: Colors.white, 
                        width: '95%', 
                        borderColor: Colors.gold, 
                        maxHeight: '100%', 
                        borderRadius: 10, 
                        borderWidth: 1, 
                        marginTop: 6, 
                        alignItems: 'center', 
                        zIndex: 10,
                        
                        overflow: 'visible',}}>
                        {this.getRibbonImage(item)}
                        <View style={{width: '100%', borderRadius: 10, overflow: 'hidden'}}>
                            <ImageCompressor style={{width: '100%', height: 30}} uri={item.background}/>
                            {/* <Image style={{width: '100%'}} source={item.background}/> */}
                            <ScrollView style = {{width: '100%'}}>
                                <TouchableOpacity style = {{width: '100%', alignItems: 'center', paddingBottom: 20}} activeOpacity={1.0} onPress={() => { this.signUp(item.type, item.name, item.tag) }}>
                                    <ImageCompressor style={{justifyContent: 'center', alignItems: 'center', width: 120, height: 120, resizeMode: 'contain', marginTop: 30}} uri={item.image}/>
                                    {/* <Image style={{justifyContent: 'center', alignItems: 'center', width: 120, height: 120, resizeMode: 'contain', marginTop: 30}} source={item.image}/> */}
                                    <Text style={[{fontSize: 14, color: '#E2C377', marginTop: 20}, stylesGlobal.font_semibold]}>P R O F I L E  T Y P E</Text>
                                    <Text style={[{fontSize: 18, color: 'black', marginTop: 5}, stylesGlobal.font_semibold]}>{item.name}</Text>
                                    <Text style={[{textAlign: 'center', paddingHorizontal: 30,}, stylesGlobal.font]}>{item.profile_text}</Text>
                                    <View style={{width: '100%', borderTopWidth: 1, borderBottomWidth: 1, borderColor: "black", marginVertical: 30, paddingVertical: 10, justifyContent: 'center', alignItems: 'center',}}>
                                        <Text style={[{fontSize: 14, color: '#E2C377', marginTop: 5}, stylesGlobal.font_semibold]}>M O N T H L Y  C O S T</Text>
                                        <Text style={[{color: 'black'}, stylesGlobal.font]}>{item.cost}</Text>
                                    </View>
                                    <Text style={[{ fontSize: 14, marginTop: 5, color: '#E2C377', marginTop: 5}, stylesGlobal.font_semibold]}>I N C L U D E S</Text>
                                    <Text style={[{textAlign: 'center', paddingHorizontal: 30, color: 'black', paddingBottom: 20, paddingTop: 10}, stylesGlobal.font]}>{ item.includes ? item.includes.replace('<br>', '\n') : '' }</Text>
                                    <TouchableOpacity onPress={() => {
                                        this.signUp(item.type, item.name, item.tag)
                                    }}
                                        style={[{backgroundColor: '#E2C377', justifyContent: 'center', alignItems: 'center', borderRadius: 20, width: '90%', height: 40,}, stylesGlobal.shadow_style]}>
                                        <Text style={[{color: 'white', fontWeight: '400'}, stylesGlobal.font]}>SIGN UP</Text>
                                    </TouchableOpacity>
                                </TouchableOpacity>
                            </ScrollView>
                        </View>
                        
                    </View>
                    
                    :

                    <View style={{backgroundColor: Colors.white, width: '95%', maxHeight: '100%', borderColor: Colors.gold, borderRadius: 10, borderWidth: 1, marginTop: 6, alignItems: 'center', overflow: 'hidden',}}>
                    <Image style={{width: '100%',}} source={item.background}/>
                    <ScrollView style = {{width: '100%'}}>
                        <TouchableOpacity 
                            onPress={() => {
                                this.setState({
                                    typeChange: !this.state.typeChange, 
                                }, () => {
                                    var self = this;
                                    setTimeout(function() {
                                        self.refs._carousal.snapToItem(0, animated = true)
                                    }, 100)
                                })
                            }}
                            activeOpacity={1}
                            style={{
                                backgroundColor: Colors.white,
                                width: '100%',
                                height: 500,
                                maxHeight: '90%',
                                borderRadius: 10,
                                marginTop: 6,
                                alignItems: 'center',
                                overflow: 'hidden',
                            }}
                        >
                            {/* <Image style={{width: '100%',}} source={item.background}/> */}
                            <Image style={{justifyContent: 'center', alignItems: 'center', width: 150, height: 150, resizeMode: 'contain', marginTop: 30}} source={item.image}/>
                            <Text style={[{color: 'black', fontSize: 16, textAlign: 'center', marginTop: 20}, stylesGlobal.font]}>{item.profile_text}</Text>
                        </TouchableOpacity>
                    </ScrollView>
                    </View>
                }
                {item.name !== 'NONE'
                    ?
                    <Image style={{width: 120, height: 120, marginRight: 3, position: 'absolute', top: 0, right: -5, resizeMode: 'contain'}} source={item.tag}/>
                    :
                    null
                }
            </View>
        )
    }

    render() {
        let fan_itemToRender = (
            <Carousel
                // initialNumToRender={0}
                ref={'_carousal'}
                data={this.state.entriesFan}
                renderItem={this._renderItem}
                sliderWidth={sliderWidth}
                itemWidth={itemWidth}
                activeSlideAlignment = {'center'}
                inactiveSlideScale={0.94}
                firstItem = {0}
                containerCustomStyle={stylesSlider.slider}
                contentContainerCustomStyle={stylesSlider.sliderContentContainer}
            />
        )

        let rich_itemToRender = (
            <Carousel
                // initialNumToRender={0}
                ref={'_carousal'}
                data={this.state.entries}
                renderItem={this._renderItem}
                sliderWidth={sliderWidth}
                itemWidth={itemWidth}
                activeSlideAlignment = {'center'}
                inactiveSlideScale={0.94}
                firstItem = {0}
                containerCustomStyle={stylesSlider.slider}
                contentContainerCustomStyle={stylesSlider.sliderContentContainer}
            />
        )
       
        return (
            <SafeAreaView style={styles.container}>
                {this.renderHeaderView()}
                <View style={{ alignItems: 'center', width: '85%', height: 40, flexDirection: 'row', marginBottom: 10, borderRadius: 5, justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.card_titlecolor }}>
                    <TouchableOpacity onPress = {() => this.refs._carousal.snapToPrev(animated = true, )}>
                        <Image style = {{height: '60%', width: 50, tintColor: Colors.gold, resizeMode: 'contain'}} source = {require('../icons/signup_left.png')}/>
                    </TouchableOpacity>
                    <Text style={[styles.headText, stylesGlobal.font]}>Swipe to Select</Text>
                    <TouchableOpacity onPress = {() => this.refs._carousal.snapToNext(animated = true, )}>
                        <Image style = {{height: '60%', width: 50, tintColor: Colors.gold, resizeMode: 'contain'}} source = {require('../icons/signup_right.png')}/>
                    </TouchableOpacity>
                </View>
                {
                    console.log("typeChange",this.state.typeChange)
                }
            {
                this.state.typeChange ?  fan_itemToRender :  rich_itemToRender 
            }
            </SafeAreaView>
        );
    }

    renderHeaderView = () => {
        return (
            <View style = {{width: '100%'}}>
                <View style={[stylesGlobal.headerView, {justifyContent: 'flex-start'}]}>
                    <TouchableOpacity style={stylesGlobal.header_backbuttonview_style} onPress={() => this.props.navigation.goBack()}>
                        <Image style = {stylesGlobal.header_backbuttonicon_style} source={require("../icons/icon_back.png")}/>
                    </TouchableOpacity>
                    <TouchableOpacity style={stylesGlobal.header_logoview_style} onPress = {() => this.props.navigation.navigate("SignInScreen")}>
                        <Image
                            style={stylesGlobal.header_logo_style}
                            source={require("../icons/logo_new.png")}
                        />
                    </TouchableOpacity>
                </View>
            </View>
        );
    };


}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 20,
        width: "100%",
        height: "100%",
        backgroundColor: Colors.black,
        alignItems: 'center',
        justifyContent: 'center'
    },
       headText: {
        color: Colors.gold,
        fontSize: 20,
    },
    ribbon: {
        width: 150,
        height: 150,
        position: "absolute",
        right: -15,
        zIndex: 20,
        elevation: 3,
        top: -11
        
    },
});
