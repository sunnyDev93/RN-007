import React, { Component } from 'react'
import {View, Dimensions, Text, TextInput, TouchableOpacity, Image, Alert, Platform, FlatList, SafeAreaView, Keyboard, StyleSheet} from 'react-native'
import * as ValidationUtils from "../utils/ValidationUtils";
import WebService from "../core/WebService";
import { Colors } from "../consts/Colors";
import ProgressIndicator from "./ProgressIndicator";
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
const { width, height } = Dimensions.get('window')
import * as Global from "../consts/Global";
import { Constants } from "../consts/Constants";
import { stylesGlobal, STICKY_HEADER_HEIGHT } from '../consts/StyleSheet'
import CustomPopupView from "../customview/CustomPopupView";
import { ImageCompressor } from './ImageCompressorClass';
import Memory from '../core/Memory';
import RNPickerSelect from 'react-native-picker-select';
import {convertEmojimessagetoString, convertStringtoEmojimessage} from "../utils/Util";
import BannerView from "../customview/BannerView";
import AsyncStorage from '@react-native-community/async-storage';
import Moment from "moment/moment";
import { extendMoment } from "moment-range";
import ModalDropdown from '../custom_components/react-native-modal-dropdown/ModalDropdown';

var TAG = "AddSuccessTimelineScreen";


const isIos = Platform.OS === 'ios'
const isIphoneX = isIos && (Dimensions.get('window').height === 812 || Dimensions.get('window').height === 896);

export default class AddSuccessTimelineScreen extends Component {

    constructor(props) {
        super(props);
        this.state = {
            showModel: false,
            success_id: '',
            userId: this.props.route.params.userId,
            userToken: this.props.route.params.userToken,
            dob: this.props.route.params.dob,
            valueEventTitle: '',
            selected_category: Global.selected_category,
            selected_year: "",
            valueEventDescription: '',
            valueStartDateOfEvent: '',
            loading: false,
            category_array: Global.category_array_others,

            timelineData: [],
            deleting_id: '',
            isEdit: false,

            selected_year_orign: "",
            selected_category_origin: Global.selected_category,
            valueEventDescription_origin: '',

            addbutton_click: this.props.route.params.addTimeline ? true : false,

            searchText: '',

            travel_yearlist: [],

            userImagePath: "",
            userImageName: "",
        };
    }

    async UNSAFE_componentWillMount() {
        var dob_date = Moment(this.state.dob).format();
        var current_date = new Date(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate(), new Date().getUTCHours(), new Date().getUTCMinutes(), new Date().getUTCSeconds());
        const moment = extendMoment(Moment);
        const diff_dates = moment.range(dob_date, current_date);
        let current_year = new Date().getUTCFullYear();
        var travel_yearlist = [];
        for(i = current_year - diff_dates.diff('years'); i < current_year + 10; i ++) {
            travel_yearlist.push({
                label: i.toString(),
                value: i.toString()
            })
        }
        this.setState({
            travel_yearlist: travel_yearlist
        })
        this.refreshProfileImage();
        this.callGetSuccessTimelineAPI();
       
        
    }
    /**
     * display pre timeline data
     */
    setData = async (data) => {
        this.setState({
            success_id: data.id
        })

        for(i = 0; i < this.state.category_array.length; i ++) {
            if(data.visibility == this.state.category_array[i].value) {
                this.setState({
                    selected_category: i,
                    selected_category_origin: i
                })
                break;
            }
        }
        
        this.setState({
            selected_year: data.year,
            valueEventDescription: convertStringtoEmojimessage(data.description),

            selected_year_orign: data.year,
            valueEventDescription_origin: convertStringtoEmojimessage(data.description),
        })
    }

    clearData() {
        this.setState({
            valueEventTitle: '',
            selected_category: Global.selected_category,
            selected_year: "",
            valueEventDescription: '',
            valueStartDateOfEvent: '',
            loading: false,

            deleting_id: '',
            isEdit: false,

            selected_year_orign: "",
            selected_category_origin: Global.selected_category,
            valueEventDescription_origin: '',

        })
    }

    /**
      * haldel save button click
      */
    saveButtonPress = () => {
        var year = this.state.selected_year;
        var description = this.state.valueEventDescription.trim();

        if (ValidationUtils.isEmptyOrNull(year)) {
            Alert.alert(Constants.EMPTY_TRAVEL_YEAR);
            return;
        }
        else if (ValidationUtils.isEmptyOrNull(description)) {
            Alert.alert(Constants.EMPTY_TRAVEL_DESCRIPTION);
            return;
        }

        this.callSuccessAPI();
    }

    callGetSuccessTimelineAPI = async () => {
        try {
            this.setState({
                loading: true
            });

            let uri = Memory().env == "LIVE" ? Global.URL_GET_SUCCESS : Global.URL_GET_SUCCESS_DEV
            let params = new FormData();
            params.append("token", this.state.userToken);
            params.append("user_id", this.state.userId);
            params.append("format", "json");

            console.log(TAG + " callGetSuccessTimelineAPI uri " + uri);
            console.log(TAG + " callGetSuccessTimelineAPI params " + JSON.stringify(params));
            WebService.callServicePost(
                uri,
                params,
                this.handleGetSuccessTimelineResponse
            );
        } catch (error) {
            this.setState({
                loading: false
            });
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    };

    /**
     * Handle Get Success Timeline API
     */
    handleGetSuccessTimelineResponse = (response, isError) => {
        console.log(TAG + " callGetSuccessTimelineAPI Response " + JSON.stringify(response));
        console.log(TAG + " callGetSuccessTimelineAPI isError " + isError);

        if (!isError) {
            var result = response;
            if (result != undefined && result != null) {
                if (result.data != undefined && result.data != null) {
                    
                    this.setState({
                        timelineData: result.data
                    });
                }
            }
        } else {
            if (response != undefined && response != null && response.length > 0) {
                Alert.alert(response.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
        this.setState({
            loading: false
        });
    };


    /**
     * call Success API
     */
    callSuccessAPI = async () => {

        try {

            this.setState({
                loading: true
            });
            let uri;
            if (this.state.isEdit) {
                uri = Memory().env == "LIVE" ?  Global.URL_UPDATE_SUCCESS : Global.URL_UPDATE_SUCCESS_DEV;
            }
            else {
                uri = Memory().env == "LIVE" ? Global.URL_ADD_SUCCESS : Global.URL_ADD_SUCCESS_DEV;
            }


            let params = new FormData();

            params.append("format", "json");
            params.append("user_id", this.state.userId);
            params.append("token", this.state.userToken);
            params.append("year", this.state.selected_year);
            params.append("description", convertEmojimessagetoString(this.state.valueEventDescription.trim()));
            params.append("visibility", this.state.category_array[this.state.selected_category].value);

            if (this.state.isEdit) {
                params.append("hdn_success_id", this.state.success_id);
            }

            console.log(TAG + " callSucessAPI uri " + uri);
            console.log(TAG + " callSucessAPI params " + JSON.stringify(params));

            WebService.callServicePost(
                uri,
                params,
                this.handleResponse
            );
        } catch (error) {
            this.setState({
                loading: false
            });
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    };

    /**
     * haldel success time edit or add API response
     */
    handleResponse = (response, isError) => {
        console.log(TAG + " callSucessAPI Response " + JSON.stringify(response));
        console.log(TAG + " callSucessAPI isError " + isError);
        if (!isError) {
            var result = response;
            if (result != undefined && result != null) {
                var timelineData = this.state.timelineData;
                if(this.state.isEdit) {
                    var index = 0;
                    for(index = 0; index < timelineData.length; index ++) {
                        if(this.state.success_id == timelineData[index].id) {
                            break;
                        }
                    }
                    timelineData.splice(index, 1);
                    timelineData.splice(index, 0, result.data);
                } else {
                    timelineData.splice(0, 0, result.data);
                }
                this.setState({
                    timelineData: timelineData
                })
                this.clearData();
                this.setState({
                    addbutton_click: false
                })
            }
        } else {
            if (response != undefined && response != null && response.length > 0) {
                Alert.alert(response.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
        this.setState({
            loading: false
        });
    };

    callDeleteSuccessTimelineAPI = async (success_id) => {
        try {

            this.setState({
                loading: true
            });

            this.setState({
                deleting_id: success_id
            })

            let uri = Memory().env == "LIVE" ? Global.URL_DELETE_SUCCESS_TIMELINE : Global.URL_DELETE_SUCCESS_TIMELINE_DEV
            let params = new FormData();
            params.append("token", this.props.route.params.userToken);
            params.append("user_id", this.props.route.params.userId);
            params.append("format", "json");
            params.append("success_id", success_id);

            console.log(TAG + " callDeleteSuccessTimelineAPI uri " + uri);
            console.log(TAG + " callDeleteSuccessTimelineAPI params " + JSON.stringify(params));

            WebService.callServicePost(
                uri,
                params,
                this.handleDeleteSuccessTimelineResponse
            );
        } catch (error) {
            this.setState({
                loading: false
            });
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    };
    /**
     * Handle Delete Sucess Timeline API
     */
    handleDeleteSuccessTimelineResponse = (response, isError) => {
        console.log(TAG + " callDeleteSuccessTimelineAPI Response " + JSON.stringify(response));
        console.log(TAG + " callDeleteSuccessTimelineAPI isError " + isError);

        if (!isError) {
            var result = response;
            if (result != undefined && result != null) {
                let timelineData = this.state.timelineData;
                for(i = 0; i < timelineData.length; i ++) {
                    if(timelineData[i].id == this.state.deleting_id) {
                        timelineData.splice(i, 0);
                        break;
                    }
                }
                this.setState({
                    timelineData: timelineData
                })
            }
        } else {
            if (response != undefined && response != null && response.length > 0) {
                Alert.alert(response.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
        this.setState({
            loading: false
        });
    };

    go_backaction() {

        var data_changed = false;
        if(this.state.selected_year_orign != this.state.selected_year) {
            data_changed = true;
        }
        if(this.state.selected_category_origin != this.state.selected_category) {
            data_changed = true;
        }
        if(this.state.valueEventDescription_origin != this.state.valueEventDescription) {
            data_changed = true;
        }
        
        if(data_changed) {
            Alert.alert(Constants.SAVE_DATA_ALERT_TITLE, Constants.SAVE_DATA_ALERT_MESSAGE,
            [
                {text: "No", onPress: () => this.props.navigation.goBack()},
                {text: "Yes", onPress: () => this.saveButtonPress()}
            ],
            { cancelable: true })
        } else {
            this.props.route.params.getDataAgain();
            this.props.navigation.goBack();
        }
    }

    refreshProfileImage = async () => {
        try {
            var userImagePath = await AsyncStorage.getItem(Constants.KEY_USER_IMAGE_URL);
            var userImageName = await AsyncStorage.getItem(Constants.KEY_USER_IMAGE_NAME);
            this.setState({
                userImagePath: userImagePath,
                userImageName: userImageName
            });
        } catch (error) {
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    }

    hidePopupView = () => {
        this.setState({
            showModel: false
        })
    }
    
    logoutUser = async () => {
        this.hidePopupView()
        try {
            await AsyncStorage.setItem(Constants.KEY_USER_ID, "");
            await AsyncStorage.setItem(Constants.KEY_USER_TOKEN, "");
            this.props.navigation.navigate("SignInScreen", {isGettingData: false});
        } catch (error) {
            console.log(TAG + " logoutUser error " + error);
        }
    }

    handleEditCompleteSearchText = () => {
        searchText = this.state.searchText.trim();
        this.setState({
            searchText: searchText,
        });
        if (searchText.length > 0) {
            this.props.navigation.navigate('Dashboard', {selected_screen: "members", search_text: searchText});
        }
    };

    renderPopupView = () => {
        return (
            <CustomPopupView
                showModel={this.state.showModel}
                openMyAccountScreen={(show_myaccount, myaccount_initial_tab) => {this.props.navigation.navigate('Dashboard', {selected_screen: "myaccount", myaccount_initial_tab: myaccount_initial_tab})}}
                logoutUser={this.logoutUser}
                closeDialog={() => { this.setState({ showModel: false }) }}
                prop_navigation = {this.props.navigation}
            >

            </CustomPopupView>
        );
    }

    /**
     * display top header
     */
    renderHeaderView = () => {
        let imageUrl = this.state.userImagePath + Constants.THUMB_FOLDER + this.state.userImageName;
        return (
            <View style={stylesGlobal.headerView}>
                <TouchableOpacity style={stylesGlobal.header_backbuttonview_style} onPress={() => this.go_backaction()}>
                    <Image style = {stylesGlobal.header_backbuttonicon_style} source={require("../icons/icon_back.png")}/>
                </TouchableOpacity>
                <TouchableOpacity style={stylesGlobal.header_logoview_style} onPress = {() => this.props.navigation.navigate('Dashboard', {logoclick: true})}>
                    <Image style={stylesGlobal.header_logo_style} source={require("../icons/logo_new.png")}/>
                </TouchableOpacity>
                <View style={stylesGlobal.header_searchview_style}>
                    <TextInput
                        ref = "searchTextInput"
                        autoCorrect = {false}
                        underlineColorAndroid="transparent"
                        returnKeyType={"search"}
                        style={[stylesGlobal.header_searchtextview_style, stylesGlobal.font]}
                        onChangeText={searchText => this.setState({ searchText })}
                        value={this.state.searchText}
                        defaultValue=""
                        multiline={false}
                        autoCapitalize='sentences'
                        onSubmitEditing={this.handleEditCompleteSearchText}
                        keyboardType='ascii-capable'
                        placeholder="Search members..."
                    />
                    <TouchableOpacity style={stylesGlobal.header_searchiconview_style} onPress = {() => {
                        if(this.state.searchText == "") {
                            this.refs.searchTextInput.focus();
                        } else {
                            Keyboard.dismiss();
                            this.setState({
                                searchText: ""
                            })
                        }}}
                    >
                    {
                        this.state.searchText != "" &&
                        <Image style = {stylesGlobal.header_searchicon_style} source={require("../icons/connection-delete.png")}/>
                    }
                    {
                        this.state.searchText == "" &&
                        <Image style = {stylesGlobal.header_searchicon_style} source={require("../icons/dashboard_search.png")}/>
                    }
                    </TouchableOpacity>
                </View>
                <TouchableOpacity style={stylesGlobal.header_avatarview_style} onPress={() => this.setState({ showModel: true })}>
                    <View style={stylesGlobal.header_avatarsubview_style}>
                        <ImageCompressor style = {stylesGlobal.header_avatar_style} uri={imageUrl}/>
                    </View>
                </TouchableOpacity>
            </View>
        );
    };

    renderFlatList = () => {
        return (
            <View style={{flex: 1, height: height - STICKY_HEADER_HEIGHT, paddingBottom: isIphoneX ? 22 : 2}}>
                <FlatList
                    extraData = {this.state}
                    pagingEnabled={false}
                    showsHorizontalScrollIndicator={false}
                    showsVerticalScrollIndicator={false}
                    data={this.state.timelineData}
                    keyExtractor={(item, index) => index.toString()}
                    renderItem={({ item }, index) => this.showRowsToUser(item, index)}
                />
            </View>
        );

    }

    showRowsToUser = (rowData, index) => {
        return this.renderSuccessTimelineRow(rowData, index)
    }


    /**
    *  display timeline row data
    */
    renderSuccessTimelineRow = (rowData, index) => {
        var selected_category = 0;
        for(i = 0; i < this.state.category_array.length; i ++) {
            if(rowData.visibility.toString() == this.state.category_array[i].value.toString()) {
                selected_category = i;
                break;
            }
        }
        return (
            <View key={index}>
                <View style={[styles.infoCardContainer]}>
                    <View style={{ flexDirection: "row", justifyContent: 'space-between', flex: 1 }}>
                        <View style = {{flex: 1}}>
                            <View style = {{flexDirection: 'row', paddingTop: 5, alignItems: 'center'}}>
                                <Image source={require('../icons/calendar.png')} style={{width: 20, height: 20, resizeMode:'contain'}} />
                                <View style={[{paddingVertical: 5, paddingHorizontal: 10, marginLeft: 10, backgroundColor: Colors.gold, borderRadius: 5, alignItems: 'center', justifyContent: 'center'}]}>
                                    <Text style={[{color: Colors.black, fontSize: 12}, stylesGlobal.font]}>{rowData.year}</Text>
                                </View>
                            </View>
                            <View style = {{flexDirection: 'row', alignItems: 'center', marginTop: 5}}>
                                <Image source={require('../icons/pin.png')} style={{width: 20, height: 20, resizeMode:'contain'}} />
                                <Text style={[{color: Colors.black, fontSize: 12, fontWeight: '500', marginLeft: 5}, stylesGlobal.font]}>{convertStringtoEmojimessage(rowData.description)}</Text>
                            </View>
                        </View>
                        <View style = {{width: '40%', height: '100%', flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center'}}>
                            <View style = {{alignItems: 'center', justifyContent: 'center', marginRight: 10}}>
                                <Image style={[styles.ageIcon, { width: 30, height: 30, resizeMode: "contain"}]} source={this.state.category_array[selected_category].icon_path}/>
                                <Text style={[{color: Colors.black, fontSize: 10, fontWeight: '500',}, stylesGlobal.font]}>{this.state.category_array[selected_category].label}</Text>
                            </View>
                            <TouchableOpacity style={{alignItems: 'center', justifyContent: 'center', marginRight: 5}}
                                onPress={() => {
                                    this.setData(rowData);
                                    this.setState({
                                        addbutton_click: true,
                                        isEdit: true,
                                        selected_year: rowData.year
                                    })
                                }}>
                                <Image style={[styles.ageIcon, { width: 30, height: 30, resizeMode: "contain"}]} source={require("../icons/ic_edit.png")} />
                                <Text style={[{color: Colors.black, fontSize: 10, fontWeight: '500'}, stylesGlobal.font]}>Edit</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={{alignItems: 'center', justifyContent: 'center'}}
                                onPress={() => Alert.alert('Delete Timeline Confirmation', 'Are you sure you want to delete timeline?', [{
                                            text: 'Yes',
                                            onPress: () => this.callDeleteSuccessTimelineAPI(rowData.id)
                                        }, {
                                            text: 'No', onPress: () => {
                                        }
                                    }],
                                    { cancelable: false })}
                            >
                                <Image style={[styles.ageIcon, { width: 30, height: 30, resizeMode: 'contain'}]} source={require("../icons/ic_delete.png")}/>
                                <Text style={[{color: Colors.black, fontSize: 10, fontWeight: '500'}, stylesGlobal.font]}>Delete</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </View>
        );
    };


    render() {

        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: Colors.black }}>
                {this.renderHeaderView()}
                {this.renderBannerView()}
                {this.renderPopupView()}
                <View style={styles.card_view}>
                    <View style={{ alignItems: 'center', width: '100%', height: 40, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.card_titlecolor }}>
                        <Text style={[styles.headText, stylesGlobal.font]}>SUCCESS TIMELINE</Text>
                    </View>
                    <KeyboardAwareScrollView style={styles.container}
                        extraScrollHeight={20}
                        keyboardShouldPersistTaps = "handled"
                        enableAutomaticScroll={true}
                        keyboardDismissMode="on-drag">

                        <View style={styles.container}>
                        {
                            !this.state.addbutton_click &&
                            <View style = {{width: '100%', alignItems: 'flex-end', marginTop: 10, marginBottom: 10}}>
                                <TouchableOpacity style = {[{width: 80, height: 30, marginRight: 10, backgroundColor: Colors.gold, borderRadius: 5, justifyContent: 'center', alignItems: 'center'}, stylesGlobal.shadow_style]}
                                    onPress = {() => this.setState({addbutton_click: true})}
                                >
                                    <Text style = {[stylesGlobal.font, {fontSize: 14, color: Colors.white}]}>Add</Text>
                                </TouchableOpacity>
                            </View>
                        }
                        {
                            this.state.addbutton_click &&
                            <View style = {{width: '100%'}}>
                                <View style = {{width: '100%', flexDirection: 'row', justifyContent: 'space-between'}}>
                                    <View style={[styles.headView, {flex: 1}]}>
                                        <Text style={[styles.headingText, { marginBottom: 2 }, stylesGlobal.font]}><Text style = {{color: Colors.red}}>*</Text>Year</Text>
                                        <RNPickerSelect
                                            items = {this.state.travel_yearlist}
                                            style = {{...pickerSelectStyles}}
                                            placeholder={{
                                                label: 'Select a year...',
                                                value: this.state.selected_year,
                                            }}
                                            value = {this.state.props_event_title}
                                            onValueChange={(value, index) => {
                                                this.setState({ selected_year: value })
                                            }}
                                        />
                                    </View>
                                    <View style = {{width: 80, justifyContent: 'flex-end', alignItems: 'center'}}>
                                        <ModalDropdown 
                                            dropdownStyle = {{height: 35 * 5 + 5 * 6, paddingLeft: 5, paddingTop: 5, paddingRight: 5, backgroundColor: '#ffffff', borderRadius: 3, borderColor: '#000000', borderWidth: 1}}
                                            defaultIndex = {0}
                                            options = {this.state.category_array}
                                            onSelect = {(index) => {
                                                this.setState({
                                                    selected_category: index
                                                })
                                            }}
                                            renderButton = {() => {
                                                return (
                                                    <View style={{justifyContent: 'center', alignItems: 'center'}}>
                                                        <Image style={[styles.ageIcon, { width: 30, height: 30, resizeMode: 'contain'}]} source={this.state.category_array[this.state.selected_category].icon_path}/>
                                                        <Text style = {[stylesGlobal.font, {fontSize: 11}]}>{this.state.category_array[this.state.selected_category].label}</Text>
                                                    </View>
                                                )
                                            }}
                                            renderRow = {(item, index, highlighted) => {
                                                return (
                                                    <View style = {[styles.visibility_button, this.state.selected_category == index ? {backgroundColor: Colors.gold} : {backgroundColor: Colors.black}]}>
                                                        <Image style = {{width: 20, height:20, marginLeft: 8}} resizeMode = {'contain'} source={item.icon_path}/> 
                                                        <Text style = {[styles.visibility_text, stylesGlobal.font, {marginLeft: 5}]}>{item.label}</Text>
                                                    </View>
                                                )
                                            }}
                                        />
                                    </View>
                                </View>
                                

                                <View style={styles.headView}>
                                    <Text style={[styles.headingText, { marginBottom: 2 }, stylesGlobal.font]}><Text style = {{color: Colors.red}}>*</Text>Description</Text>
                                    <TextInput
                                        ref='valueEventDescription'
                                        multiline={true}
                                        returnKeyType='default'
                                        numberOfLines={1}
                                        underlineColorAndroid="transparent"
                                        autoCapitalize='sentences'
                                        onChangeText={value => {
                                            this.setState({ valueEventDescription: value })
                                        }}
                                        value={this.state.valueEventDescription}
                                        style={[styles.textInputText, stylesGlobal.font]}
                                        onSubmitEditing={(event) => {

                                        }}
                                    ></TextInput>
                                </View>

                                {this.renderBottomButton()}
                            </View>
                        }
                        {
                            this.renderFlatList()
                        }

                        </View>
                    </KeyboardAwareScrollView>
                </View>
                {this.state.loading == true ? <ProgressIndicator /> : null}
            </SafeAreaView>
        );
    }

    renderBannerView = () => {
        return (
            <BannerView
                screenProps = {this.props.navigation}
            />
        )
    }

    /**
     * display bottom cancel and save button
     */
    renderBottomButton = () => {
        let cancelButton = (<TouchableOpacity
            style={[styles.submitGold, { margin: 5 }, stylesGlobal.shadow_style]}
            underlayColor="#fff"
            onPress={() => {
                this.clearData();
                this.setState({
                    addbutton_click: false,
                })
            }}
        >
            <Text style={[styles.submitTextWhite, stylesGlobal.font]}>Cancel</Text>
        </TouchableOpacity>);

        let saveButton = (<TouchableOpacity
            style={[styles.submitGold, { margin: 5 }, stylesGlobal.shadow_style]}
            underlayColor="#fff"
            onPress={() => this.saveButtonPress()}
        >
            <Text style={[styles.submitTextWhite, stylesGlobal.font]}>Save</Text>
        </TouchableOpacity>);

        return (
            <View>
                <View style={{alignItems: "center", flexDirection: 'row', justifyContent: 'center', margin: 20}}>
                    {cancelButton}
                    {saveButton}
                </View>
            </View>
        );

    };

}

const styles = {
    container: {
        flex: 1,
        width: "100%",
        height: "100%",
        padding: 5,
        borderRadius: 10,
        backgroundColor: Colors.white
    },
    card_view: {
        flex: 1,
        borderRadius: 10,
        backgroundColor: Colors.white,
        marginLeft: 10,
        marginRight: 10,
        marginBottom: 10,
        overflow: 'hidden'
    },
    headText: {
        color: Colors.gold,
        fontSize: 20,
        // fontWeight: 'bold'
    },
    headView: {
        marginTop: 10,
    },
    headingText: {
        color: Colors.black,
        fontWeight: 'bold',
        backgroundColor: Colors.transparent,
        fontSize: 14,
    },
    textInputText: {
        color: Colors.black,
        marginTop: 3,
        padding: 5,
        justifyContent: 'center',
        backgroundColor: Colors.white,
        textAlignVertical: "center",
        fontSize: 13,
        borderColor: Colors.black,
        borderWidth: 1,
        borderRadius: 2,
        height: 40,
    },
    viewCenterText: {
        padding: 5,
        justifyContent: 'center',
        backgroundColor: Colors.white,
        borderColor: Colors.black,
        borderRadius: 2,
        borderWidth: 1,
        height: 40,
    },
    submitTextWhite: {
        color: Colors.white,
        backgroundColor: Colors.transparent,
        textAlign: "center",
        fontSize: 14,
    },
    submitTextGold: {
        color: Colors.gold,
        backgroundColor: Colors.transparent,
        textAlign: "center",
        fontSize: 14,
    },
    submitWhite: {
        paddingVertical: 10,
        width: 120,
        backgroundColor: Colors.white,
        borderRadius: 5,
        borderWidth: 1,
        borderColor: Colors.gold,
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'center',
        marginTop: 0,
        marginBottom: 20
    },
    submitGold: {
        paddingVertical: 10,
        width: 120,
        backgroundColor: Colors.gold,
        borderRadius: 5,
        borderWidth: 1,
        borderColor: Colors.transparent,
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'center',
        marginTop: 0,
        marginBottom: 20
    },

    infoCardContainer: {
        flex: 1,
        borderRadius: 3,
        paddingBottom: 5,
        paddingTop: 5,
        borderBottomColor: Colors.gray,
        borderBottomWidth: 1
    },
    ageIcon: {
        width: 20,
        height: 20,
    },
    ageText: {
        fontSize: 14,
        backgroundColor: Colors.transparent,
        color: Colors.gray
    },
    iconView: {
        height: 30,
        width: 30,
        marginRight: 5,
        justifyContent: 'center',
        alignContent: 'center',
        alignItems: 'center'
    },

    visibility_container_view: {
        position: 'absolute', 
        justifyContent: 'space-between', 
        zIndex: 10, 
        backgroundColor: '#ffffff', 
        borderRadius: 3, 
        borderColor: '#000000', 
        borderWidth: 1
    },
    visibility_button: {
        width: 120, 
        height: 35, 
        flexDirection: 'row', 
        alignItems: 'center', 
        borderRadius: 3, 
        borderColor: '#000000', 
        borderWidth: 1,
        marginBottom: 5
    },
    visibility_text: {
        fontSize: 14,
        color: Colors.white
    },
}

const pickerSelectStyles = StyleSheet.create({
    inputIOS: {
        padding: 5,
        justifyContent: 'center',
        backgroundColor: Colors.white,
        borderColor: Colors.black,
        borderRadius: 4,
        borderWidth: 1,
        height: 40,
        color: Colors.black,
        fontSize: 13,
        fontFamily:'raleway',
    },
    inputAndroid: {
        padding: 5,
        justifyContent: 'center',
        backgroundColor: Colors.white,
        borderColor: Colors.black,
        borderRadius: 4,
        borderWidth: 1,
        height: 40,
        color: Colors.black,
        fontSize: 13,
        fontFamily:'raleway',
    }, 
});
