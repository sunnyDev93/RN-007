import React from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    ScrollView,
    Image,
    FlatList,
    Dimensions,
    Modal
} from 'react-native';
import WebService from "../core/WebService";
import { EventRegister } from 'react-native-event-listeners';
import { Constants } from "../consts/Constants";
import { Colors } from "../consts/Colors";
import { stylesGlobal } from "../consts/StyleSheet";
import * as GlobalStyleSheet from "../consts/StyleSheet";
import * as Global from "../consts/Global";
import Memory from '../core/Memory';
import AsyncStorage from '@react-native-community/async-storage';
import ProgressIndicator from "../components/ProgressIndicator";
import { ImageCompressor } from '../components/ImageCompressorClass';

var TAG = "InviteUserToEventView"

export default class InviteUserToEventView extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            userId: "",
            userToken: "",
            userSlug: "",
            userFirstName: "",
            userLastName: "",
            userImagePath: "",
            userImageName: "",
            user_email: "",

            is_portrait: true,
            screen_height: Dimensions.get('screen').height,
        }
        this.onEndReachedCalledDuringMomentum = true;
    }

    async UNSAFE_componentWillMount() {

        try {
            let userFirstName = await AsyncStorage.getItem(Constants.KEY_USER_FIRST_NAME);
            let userLastName = await AsyncStorage.getItem(Constants.KEY_USER_LAST_NAME);
            let userImagePath = await AsyncStorage.getItem(Constants.KEY_USER_IMAGE_URL);
            let userImageName = await AsyncStorage.getItem(Constants.KEY_USER_IMAGE_NAME);
            var userId = await AsyncStorage.getItem(Constants.KEY_USER_ID);
            var userToken = await AsyncStorage.getItem(Constants.KEY_USER_TOKEN);
            var userSlug = await AsyncStorage.getItem(Constants.KEY_USER_SLUG);
            var user_email = await AsyncStorage.getItem(Constants.KEY_USER_EMAIL);

            this.setState({
                userId: userId,
                userToken: userToken,
                userSlug: userSlug,
                userFirstName: userFirstName,
                userLastName: userLastName,
                userImagePath: userImagePath,
                userImageName: userImageName,
                user_email: user_email,
            })

            if (Dimensions.get("window").width < Dimensions.get("window").height) {
                this.setState({
                    is_portrait: true,
                    screen_height: Dimensions.get('screen').height,
                })
            } else {
                this.setState({
                    is_portrait: false,
                    screen_height: Dimensions.get('screen').width,
                })
            }

            Dimensions.addEventListener("change", () => {
                if (Dimensions.get("window").width < Dimensions.get("window").height) {
                    this.setState({
                        is_portrait: true,
                        screen_height: Dimensions.get('screen').height,
                    })
                } else {
                    this.setState({
                        is_portrait: false,
                        screen_height: Dimensions.get('screen').width,
                    })
                }
            })

        } catch (error) {
            // Error retrieving data
            console.log(TAG + ' getData  error  ' + error);
        }

    }

    async componentDidMount() {


    }

    componentWillUnmount() {
        Dimensions.removeEventListener('change');
    }


    render() {
        return (
            <Modal
                animationType="fade"
                transparent={true}
                // closeOnClick={true}
                visible={this.state.showModel}
                onRequestClose={() => this.setState({ showModel: false })}
                supportedOrientations={['portrait', 'landscape']}
            >
                <View style={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                    <View style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, opacity: 0.3, backgroundColor: Colors.black }}></View>
                    <View style={{ width: '90%', height: this.state.is_portrait ? this.state.screen_height / 1.5 : this.state.screen_height / 3.5, padding: 20, backgroundColor: Colors.white, borderRadius: 5 }}>
                        <View style={{ width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Text style={[{ fontSize: 18, color: Colors.black }, stylesGlobal.font]}>Invite {this.props.invited_user.first_name + " " + this.props.invited_user.last_name} to</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', }}>
                                {
                                    !this.state.is_portrait &&
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginEnd: 20 }}>
                                        {
                                            this.props.invite_event_list.length > 0 &&
                                            <TouchableOpacity style={[{ paddingVertical: 10, paddingHorizontal: 20, minWidth: 60, backgroundColor: Colors.gold, borderRadius: 5, justifyContent: 'center', alignItems: 'center' }, stylesGlobal.shadow_style]}
                                                onPress={() => this.props.callInviteUserToEvent()}
                                            >
                                                <Text style={[{ fontSize: 14, color: Colors.white }, stylesGlobal.font]}>Invite</Text>
                                            </TouchableOpacity>
                                        }
                                        {
                                            this.props.invite_event_list.length == 0 &&
                                            <TouchableOpacity style={[{ paddingVertical: 10, paddingHorizontal: 20, minWidth: 60, backgroundColor: Colors.gold, borderRadius: 5, marginLeft: 15, justifyContent: 'center', alignItems: 'center' }, stylesGlobal.shadow_style]}
                                                onPress={() => {

                                                    this.props.screenProps.navigate("CreateEvent", {
                                                        user_id: this.state.userId,
                                                        token: this.state.userToken,
                                                        data: null,
                                                        isCopy: false,
                                                        loadAfterDeletingEvent: () => null,
                                                        type: 'create_event'
                                                    })
                                                }}
                                            >
                                                <Text style={[{ fontSize: 14, color: Colors.white }, stylesGlobal.font]}>Host a Party</Text>
                                            </TouchableOpacity>
                                        }
                                    </View>
                                }
                                <TouchableOpacity style={{ width: 15, height: 15 }}
                                    onPress={() => this.props.close_view()}
                                >
                                    <Image style={{ width: '100%', height: '100%', tintColor: Colors.gold }} source={require('../icons/connection-delete.png')} />
                                </TouchableOpacity>
                            </View>
                        </View>
                        {
                            this.props.invite_event_list.length > 0 &&
                            <View style={{ width: '100%', flex: 1, marginTop: 10 }}>
                                <View style={{ width: '100%', height: '100%', borderWidth: 0.5, borderColor: Colors.gray }}>
                                    <FlatList
                                        ListHeaderComponent={this.state.pulldown_loading && <PullDownIndicator />}
                                        ListFooterComponent={this.state.displayLoadMoreView == true ? footerView : null}
                                        extraData={this.props}
                                        // pagingEnabled={false}
                                        showsHorizontalScrollIndicator={false}
                                        showsVerticalScrollIndicator={false}
                                        data={this.props.invite_event_list}
                                        keyExtractor={(item, index) => index.toString()}
                                        style={{ width: '100%' }}
                                        numColumns={this.state.is_portrait ? 1 : 2}
                                        key={this.state.is_portrait ? 1 : 2}
                                        renderItem={({ item, index }) => (
                                            <View key={index} style={{ width: this.state.is_portrait ? '100%' : '50%', alignItems: 'center' }}>
                                                <TouchableOpacity key={index} style={{ width: '100%', height: 80, flexDirection: 'row', alignItems: 'center', marginBottom: 10, paddingHorizontal: 10, paddingVertical: 5 }}
                                                    onPress={() => {
                                                        console.log("item>>>>>>>>>>>>>>>>>>", item);
                                                        this.props.selectUserforInvite(item, index)
                                                    }}
                                                >
                                                    <View style={{ width: 20, height: 20, marginRight: 10 }}>

                                                        {item.check ? (
                                                            <>
                                                                {console.log(">>>>>>>>>>>>Checked")}
                                                                <Image source={require('../icons/checked.png')} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', resizeMode: 'contain',  tintColor: item.invitation_id != null ? Colors.gray : '' }} />
                                                            </>
                                                        ) : (
                                                            <Image source={require('../icons/square.png')} style={{ width: '100%', height: '100%', resizeMode: 'contain'  }} />
                                                        )
                                                        }
                                                        {/* <Image source={require('../icons/square.png')}  style={{width: '100%', height: '100%', resizeMode:'contain'}}/> */}
                                                        {/*                                            
                                            {
                                                item.check &&
                                                <Image source={require('../icons/checked.png')} style={{position:'absolute', top: 0, left: 0, width: '100%', height: '100%', resizeMode:'contain', tintColor: item.invitation_id != null ? Colors.gray : null}}/>
                                            } */}
                                                    </View>
                                                    <View style={{ height: '100%', aspectRatio: 1, marginRight: 10 }}>
                                                        <ImageCompressor
                                                            style={{ width: '100%', height: '100%', borderRadius: 5, overflow: 'hidden' }}
                                                            uri={item.event_image_path + item.event_image_name}
                                                        />
                                                    </View>
                                                    <Text style={[{ flex: 1, fontSize: 14, color: Colors.black }, stylesGlobal.font,]} abbreviation >{item.title}</Text>
                                                </TouchableOpacity>
                                            </View>
                                        )}
                                        onMomentumScrollBegin={() => { this.onEndReachedCalledDuringMomentum = false; }}
                                        onEndReachedThreshold={0.5}
                                    />
                                </View>
                            </View>
                        }
                        {
                            this.props.invite_event_list.length == 0 &&
                            <View style={{ width: '100%', padding: 20 }}>
                                <Text style={[{ fontSize: 14, color: Colors.black }, stylesGlobal.font,]} >{"You are not currently hosting any event."}</Text>
                            </View>
                        }
                        {
                            this.state.is_portrait &&
                            <View style={{ width: '100%', flexDirection: 'row', justifyContent: 'flex-end', marginTop: 20 }}>
                                {
                                    this.props.invite_event_list.length > 0 &&
                                    <TouchableOpacity style={[{ paddingVertical: 10, paddingHorizontal: 20, minWidth: 60, backgroundColor: Colors.gold, borderRadius: 5, justifyContent: 'center', alignItems: 'center' }, stylesGlobal.shadow_style]}
                                        onPress={() => this.props.callInviteUserToEvent()}
                                    >
                                        <Text style={[{ fontSize: 14, color: Colors.white }, stylesGlobal.font]}>Invite</Text>
                                    </TouchableOpacity>
                                }
                                {
                                    this.props.invite_event_list.length == 0 &&
                                    <TouchableOpacity style={[{ paddingVertical: 10, paddingHorizontal: 20, minWidth: 60, backgroundColor: Colors.gold, borderRadius: 5, marginLeft: 15, justifyContent: 'center', alignItems: 'center' }, stylesGlobal.shadow_style]}
                                        onPress={() => {

                                            this.props.screenProps.navigate("CreateEvent", {
                                                user_id: this.state.userId,
                                                token: this.state.userToken,
                                                data: null,
                                                isCopy: false,
                                                loadAfterDeletingEvent: () => null,
                                                type: 'create_event'
                                            })
                                        }}
                                    >
                                        <Text style={[{ fontSize: 14, color: Colors.white }, stylesGlobal.font]}>Host a Party</Text>
                                    </TouchableOpacity>
                                }
                            </View>
                        }
                    </View>
                </View>
            </Modal>
        );
    }
}


const styles = StyleSheet.create({


});

