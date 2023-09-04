import React, { Component, Fragment, } from "react";
import {
    StyleSheet,
    Text,
    View,
    Image,
    FlatList,
    TouchableOpacity,
    Dimensions,
    SafeAreaView,
    TextInput,
    Keyboard,
    ScrollView,
    Alert,
    Modal
} from "react-native";
const { height, width } = Dimensions.get("window");
import Icon from "react-native-vector-icons/Feather";
import {debounce} from 'lodash'
import MultiSlider from "@ptomasroos/react-native-multi-slider";
import Accordion from 'react-native-collapsible/Accordion'
import PhoneInput from 'react-native-phone-input'
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { selectContact, selectContactPhone, selectContactEmail } from 'react-native-select-contact';
import AsyncStorage from '@react-native-community/async-storage';

import RowInviteFriend from "./RowInviteFriend";
import WebService from "../core/WebService";
import { stylesGlobal, STICKY_HEADER_HEIGHT } from '../consts/StyleSheet'
import { Constants } from "../consts/Constants";
import { Colors } from "../consts/Colors";
import * as Global from "../consts/Global";
import ProgressIndicator from "./ProgressIndicator";
import Checkbox from '../customview/CheckBoxCus'
import CustomSlider from '../customview/CustomeSlider'
import Memory from '../core/Memory'
import { ImageCompressor } from './ImageCompressorClass'
import CustomPopupView from "../customview/CustomPopupView"
import * as ValidationUtils from "../utils/ValidationUtils";
import ModalDropdown from "../custom_components/react-native-modal-dropdown/ModalDropdown";
import BannerView from "../customview/BannerView";
import CheckboxCus from '../customview/CheckBoxInviteFriend';

var TAG = "InviteFriendScreen";

export default class InviteFriendScreen extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            userId: "",
            userToken: "",
            loading: false,
            eventId: "",
            hostId: "",
            page_number: 1,
            dataConnections: [],
            global_dataConnections: [],
            isLoadMoreMyConnection: true,
            displayLoadMoreLoader: false,
            selectedContactList: [],
            inviteList: [],
            searchText:'',
            activeSections:[0],
            isFiltering: false,  // check if filter screen is open or closed.
            isFilterCall: false, // check if filter is set up or not.
            isReset:false, //check if reset is called or show all members

            ageValues:[0,60],
            distanValues:[0,100],
            heightValues:[30, 229],
            weightValues:[5, 145],
            networthValues:[0,4],
            accountType:[],
            nonAccountType:[],
            hairColor: [],
            eyeColor: [],
            skinColor:[],
            bodyType:[],
            ethnicityType:[],
            maritalType:[],
            genderType:[],
            showNetworth: false,

            rowInvitation:[{name: '', email: '', phoneNumber: '', selected_user_role_index: 0, selected_gender_index: 0}],
            showInvitationPopUp: false,

            showPhoneEmailSelectPopUp: false,
            selected_contact: null,

            user_role: Global.entries,
            user_gender: [{type: "Male", image: require('../icons/signup_male.png')}, {type: "Female", image: require('../icons/signup_female.png')}],

            action_invite_list: false, 

            isCopy: this.props.route.params.isCopy,
            invite_action_complete: false, // true after invite someone

            filter_apply_button_click: false,
            invite_members_popup: false,
			checked: false
        };
        // this.onChangeTextDelayed = debounce(() => this.searchUser(), 1000);
        // this.setState({ searchText, page_number: 1}, () => this.searchUser())
    }

    UNSAFE_componentWillMount() {
        this.initData(); 
    }
    
    initData = () => {
        this.clearStateData();
        this.getData();
    
    }
    /**
    * clear state data
    */
    clearStateData = () => {
        this.setState({
            userId: "",
            userToken: "",
            userGender:'',
            loading: false,
            eventId: "",
            hostId: "",
            dataConnections: [],
            isLoadMoreMyConnection: true,
            displayLoadMoreLoader: false,
            selectedContactList: [],
            inviteList: [],
            activeSections:[0],
            ageValues:[0,60],
            distanValues:[0,100],
            heightValues:[30, 229],
            weightValues:[5, 145],
            networthValues:[0,4],
            accountType:[],
            nonAccountType:[],
            hairColor: [],
            eyeColor: [],
            skinColor:[],
            bodyType:[],
            ethnicityType:[],
            maritalType:[],
            genderType:[],
            showNetworth: false,
            showModel:false,

            rowInvitation: [{name: '', email: '', phoneNumber: '', selected_user_role_index: 0, selected_gender_index: 0}],
            showInvitationPopUp: false,
            user_role: Global.entries,
            user_gender: [{type: "Male", image: require('../icons/signup_male.png')}, {type: "Female", image: require('../icons/signup_female.png')}],

            action_invite_list: false, //// true when user action to invite list
            selected_invite_user: null, // use when invite a guest

            filter_apply_button_click: false,
        });
    };
    /**
     * get async storage data
     */
    getData = async () => {
        try {
            
            var userId = await AsyncStorage.getItem(Constants.KEY_USER_ID);
            var userToken = await AsyncStorage.getItem(Constants.KEY_USER_TOKEN);
            var userGender = await AsyncStorage.getItem(Constants.KEY_USER_GENDER);
            var userImageName = await AsyncStorage.getItem(Constants.KEY_USER_IMAGE_NAME);
            var userImagePath = await AsyncStorage.getItem(Constants.KEY_USER_IMAGE_URL);
            
            var eventId = this.props.route.params.eventId;
            var hostId = "";
            if(this.props.route.params.hostId) {
                hostId = this.props.route.params.hostId;
            }
            
            var inviteList = [];
            if (typeof this.props.route.params.inviteList != undefined && this.props.route.params.inviteList != null) {
                inviteList = this.props.route.params.inviteList;
            }
            var ageValues = [0,60];
            // var ageValuesJSON = await AsyncStorage.getItem('ageValues1');
            // if (ageValuesJSON != null) {
            //     ageValues =  await JSON.parse(ageValuesJSON);
            // }
            var distanValues = [0,100];
            // var distanValuesJSON = await AsyncStorage.getItem('distanValues1');
            // if (distanValuesJSON != null) {
            //     distanValues =  await JSON.parse(distanValuesJSON);
            // }
            var heightValues = [30,229];
            // var heightValuesJSON = await AsyncStorage.getItem('heightValues1');
            // if (heightValuesJSON != null) {
            //     heightValues =  await JSON.parse(heightValuesJSON);
            // }
            var weightValues = [5,145];
            // var weightValuesJSON = await AsyncStorage.getItem('weightValues1');
            // if (weightValuesJSON != null ) {
            //     weightValues =  await JSON.parse(weightValuesJSON);
            // }
            var networthValues = [0,4];
            // var networthValuesJSON = await AsyncStorage.getItem('networthValues1');
            // if (networthValuesJSON != null ) {
            //     networthValues =  await JSON.parse(networthValuesJSON);
            // }
            var accountType = userGender == "female" ? ["1", "2", "4", "5" ] : []
            // var accountTypeJSON = await AsyncStorage.getItem('accountType1');
            // if (accountTypeJSON != null ) {
            //     accountType =  await JSON.parse(accountTypeJSON);
            // }
            var showNetworth;
            if (accountType.includes('1') || accountType.includes('2')) {
                showNetworth = true;
            } else {
                showNetworth = false;
            }
            var nonAccountType = [];
            // var nonAccountTypeJSON = await AsyncStorage.getItem('nonAccountType1');
            // if (nonAccountTypeJSON != null ) {
            //     nonAccountType =  await JSON.parse(nonAccountTypeJSON);
            // }
            var hairColor = [];
            // var hairColorJSON = await AsyncStorage.getItem('hairColor1');
            // if (hairColorJSON != null ) {
            //     hairColor =  await JSON.parse(hairColorJSON);
            // }
            var eyeColor = [];
            // var eyeColorJSON = await AsyncStorage.getItem('eyeColor1');
            // if (eyeColorJSON != null ) {
            //     eyeColor =  await JSON.parse(eyeColorJSON);
            // }
            var skinColor = [];
            // var skinColorJSON = await AsyncStorage.getItem('skinColor1');
            // if (skinColorJSON != null ) {
            //     skinColor =  await JSON.parse(skinColorJSON);
            // }
            var bodyType = [];
            // var bodyTypeJSON = await AsyncStorage.getItem('bodyType1');
            // if (bodyTypeJSON != null ) {
            //     bodyType =  await JSON.parse(bodyTypeJSON);
            // }
            var ethnicityType = [];
            // var ethnicityTypeJSON = await AsyncStorage.getItem('ethnicityType1');
            // if (ethnicityTypeJSON != null) {
            //     ethnicityType =  await JSON.parse(ethnicityTypeJSON);
            // }
            var maritalType = [];
            // var maritalTypeJSON = await AsyncStorage.getItem('maritalType1');
            // if (maritalTypeJSON != null) {
            //     maritalType =  await JSON.parse(maritalTypeJSON);
            // }
            var genderType = [];
            // var genderTypeJSON = await AsyncStorage.getItem('genderType1');
            // if (genderTypeJSON != null) {
            //     genderType =  await JSON.parse(genderTypeJSON);
            // }
            
            this.setState({
                userId: userId,
                userToken: userToken,
                eventId: eventId,
                hostId: hostId,
                inviteList: inviteList,
                ageValues,
                distanValues,
                heightValues,
                weightValues,
                networthValues,
                accountType,
                nonAccountType,
                hairColor,
                eyeColor,
                skinColor,
                bodyType,
                ethnicityType,
                maritalType,
                genderType,
                userGender,
                showNetworth,
                userImageName,
                userImagePath,
                showModel:false,

                rowInvitation: [{name: '', email: '', phoneNumber: '', selected_user_role_index: 0, selected_gender_index: 0}],
                showInvitationPopUp: false,
                // selectedContactList: inviteList
            });
            if(this.props.route.params.isCopy) {
                this.setState({
                    loading: true
                })
                if(!this.state.action_invite_list) {
                    var selectedContactList = [];
                    for(i = 0; i < inviteList.length; i ++) {
                        let newItem = {
                            key: inviteList[i].id,
                            userImage: inviteList[i].imgpath + Constants.THUMB_FOLDER + inviteList[i].filename,
                            name: inviteList[i].first_name + " " + inviteList[i].last_name
                        }
                        selectedContactList.push(newItem);
                    }
                    this.setState({
                        selectedContactList: selectedContactList
                    })
                }
                var dataConnections = inviteList;
                for(i = 0; i < dataConnections.length; i ++) {
                    dataConnections[i].check = true;
                }
                this.setState({
                    global_dataConnections: dataConnections,
                    dataConnections: dataConnections,
                    loading: false
                })
                
            } else {
                this.callMyConnectionsListAPI(true);
            }
            
        } catch (error) {
            console.log(error)
            // Error retrieving data
        }
    };

    /*
    * call get connection list API and display content
    */
    clearStateDataForSearch=()=>{
        this.setState({
            userId: "",
            userToken: "",
            userGender:'',
            loading: false,
            page_number: 1,
            // eventId: "",
            dataConnections: [],
            isLoadMoreMyConnection: true,
            displayLoadMoreLoader: false,
            showModel: false,
            rowInvitation: [{name: '', email: '', phoneNumber: '', selected_user_role_index: 0, selected_gender_index: 0}],
            noteInvitation:'',
            showInvitationPopUp: false,
        });
    }

    searchUser = () => {
        var temp = [];
        if(this.props.route.params.isCopy) {
            for(i = 0; i < this.state.global_dataConnections.length; i ++) {
                if(this.state.global_dataConnections[i].first_name.toLowerCase().indexOf(this.state.searchText.toLowerCase()) > -1 || this.state.global_dataConnections[i].last_name.toLowerCase().indexOf(this.state.searchText.toLowerCase()) > -1) {
                    temp.push(this.state.global_dataConnections[i])
                }
            }
            this.setState({
                dataConnections: temp
            })
        } else {
            if(this.state.filter_apply_button_click) {
                this.callMyConnectionsListAPI(true);
            } else {
                this.callMyConnectionsListAPI(false);
            }
        }
    }

    callMyConnectionsListAPI = async (isFirstTime, search_type) => {
        try {
            if (isFirstTime) {
                this.setState({
                    loading: true,
                    displayLoadMoreLoader: false
                });
            } else {
                this.setState({
                    displayLoadMoreLoader: true,
                });
            }
            
            let uri = Memory().env == "LIVE" ? Global.URL_SEARCH + this.state.page_number : Global.URL_SEARCH_DEV + this.state.page_number;
            const eyeColor = this.state.eyeColor.join(",")
            const skinColor = this.state.skinColor.join(",");
            const hairColor = this.state.hairColor.join(",");
            const ethnicity = this.state.ethnicityType.join(",");
            const maritalStatus = this.state.maritalType.join(",");
            const body = this.state.bodyType.join(",");
            let miles = "";
            if (this.state.distanValues[0] == 0 && this.state.distanValues[1] == 100) {
                miles = "";
            } else {
                miles = this.state.distanValues[0] + "-" + this.state.distanValues[1];
            }
            let age = "";
            if (this.state.ageValues[0] == 0 && this.state.ageValues[1] == 60) {
                age = "";
            } else {
                age = this.state.ageValues[0] + "-" + this.state.ageValues[1];
            }
            let height = "";
            if (this.state.heightValues[0] == 30 && this.state.heightValues[1] == 229) {
                height = "";
            } else {
                height = this.state.heightValues[0] + "-" + this.state.heightValues[1];
            }
            let weight = "";
            if (this.state.weightValues[0] == 5 && this.state.weightValues[1] == 145) {
                weight = "";
            } else {
                weight = this.state.weightValues[0] + "-" + this.state.weightValues[1];
            }
            var search_text = "";
            if(search_type == "shows_all_member") {
                search_text = "";
            } else if(search_type == "reset") {
                search_text = this.state.searchText;
            }else{
                search_text = this.state.searchText;

            }
            // var jsonData = {
            //     eyeColor,
            //     skinColor,
            //     hairColor,
            //     ethnicity,
            //     maritalStatus,
            //     body,
            //     recordPerPage:'',
            //     userType:this.state.accountType,
            //     age,
            //     miles,
            //     networth:'',
            //     connection:'',
            //     gender:this.state.genderType,
            //     height,
            //     weight,
            //     page: this.state.page_number,
            //     keyword: search_text
            // }
            var jsonData = null;
            if(this.state.filter_apply_button_click) {
                jsonData = {
                    eyeColor,
                    skinColor,
                    hairColor,
                    ethnicity,
                    maritalStatus,
                    body,
                    recordPerPage: '',
                    userType: this.state.accountType,
                    age,
                    miles,
                    networth:'',
                    connection:'',
                    gender:this.state.genderType,
                    height,
                    weight,
                    page: this.state.page_number,
                    keyword: search_text
                }
            } else {
                jsonData = {
                    eyeColor: "",
                    skinColor: "",
                    hairColor: "",
                    ethnicity: "",
                    maritalStatus: "",
                    body: "",
                    recordPerPage: '',
                    userType: isFirstTime ? this.state.accountType : [],
                    age: "",
                    miles: "",
                    networth: '',
                    connection: '',
                    gender: [],
                    height: "",
                    weight: "",
                    page: this.state.page_number,
                    keyword: search_text
                }
            }
            let params = new FormData();
            params.append("token", this.state.userToken);
            params.append("user_id", this.state.userId);
            params.append("format", "json");
            params.append("data", JSON.stringify(jsonData));

            console.log(TAG + " callMyConnectionsListAPI uri " + uri);
            console.log(TAG + " callMyConnectionsListAPI params " + JSON.stringify(params));

            WebService.callServicePost(
                uri,
                params,
                this.handleGetMyConnectionResponse
            );
        } catch (error) {
            console.log(error)
            this.setState({
                loading: false,
                displayLoadMoreLoader: false
            });
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    };

    /**
    * handle get conneciton list API response
    */
    handleGetMyConnectionResponse = (response, isError) => {
        // console.log(TAG + " callMyConnectionsListAPI search Response " + JSON.stringify(response));
        console.log(TAG + " callMyConnectionsListAPI search isError " + isError);
        
        if (!isError) {
            var result = response;
            if (typeof result != undefined && result != null) {
                if (typeof result.data.result != undefined && result.data.result != null) {
                    // if(this.props.route.params.isCopy) {
                    //     if(!this.state.action_invite_list) {
                    //         var selectedContactList = [];
                    //         for(i = 0; i < this.state.inviteList.length; i ++) {
                    //             let newItem = {
                    //                 key: this.state.inviteList[i].id,
                    //                 userImage: this.state.inviteList[i].imgpath + Constants.THUMB_FOLDER + this.state.inviteList[i].filename,
                    //                 name: this.state.inviteList[i].first_name + " " + this.state.inviteList[i].last_name
                    //             }
                    //             selectedContactList.push(newItem);
                    //         }
                    //         this.setState({
                    //             selectedContactList: selectedContactList
                    //         })
                    //     }
                    // }
                    var mData = result.data.result;
                    //console.log("mData",mData);
                    if(mData.length > 0) {
                        var index = 0;
                        var exist = false;
                        while(index < mData.length) {
                            // exist = false;
                            // for(j = 0; j < this.state.dataConnections.length; j ++) {
                            //     if(mData[index].user_id == this.state.dataConnections[j].user_id) {
                            //         exist = true;
                            //         break;
                            //     }
                            // }
                            // if(exist) {
                            //     mData.splice(index, 1);
                            // } else {
                            //     let id = this.findIndexToDelete(mData[index]);
                            //     if (id > -1 && id !== undefined) {
                            //         mData[index].check = true;
                            //     } else {
                            //         mData[index].check = false;
                            //     }

                            //     var inviteList = this.state.inviteList;
                            //     for(ii = 0; ii < inviteList.length; ii ++) {
                            //         if(inviteList[ii].id == mData[index].id) {
                            //             mData[index].invited = true;
                            //             break;
                            //         } else {
                            //             mData[index].invited = false;
                            //         }
                            //     }

                            //     var selectedContactList = this.state.selectedContactList;
                            //     for(ii = 0; ii < selectedContactList.length; ii ++) {
                            //         if(selectedContactList[ii].key == mData[index].id) {
                            //             mData[index].check = true;
                            //             break;
                            //         } else {
                            //             mData[index].check = false;
                            //         }
                            //     }

                            //     index ++;
                            // }

                            if(mData[index].user_id == this.state.hostId) {
                                mData.splice(index, 1);
                                continue;
                            }
                            let id = this.findIndexToDelete(mData[index]);
                            if (id > -1 && id !== undefined) {
                                mData[index].check = true;
                            } else {
                                mData[index].check = false;
                            }

                            var inviteList = this.state.inviteList;
                            for(ii = 0; ii < inviteList.length; ii ++) {
                                if(inviteList[ii].id == mData[index].id) {
                                    mData[index].invited = true;
                                    break;
                                } else {
                                    mData[index].invited = false;
                                }
                            }

                            var selectedContactList = this.state.selectedContactList;
                            for(ii = 0; ii < selectedContactList.length; ii ++) {
                                if(selectedContactList[ii].key == mData[index].id) {
                                    mData[index].check = true;
                                    break;
                                } else {
                                    mData[index].check = false;
                                }
                            }

                            index ++;
                        }

                        this.setState({
                            isLoadMoreMyConnection: true,
                            page_number: this.state.page_number + 1,
                        })
                    } else {
                        this.setState({
                            isLoadMoreMyConnection: false,
                        })
                    }
                    if(this.state.displayLoadMoreLoader) {
                        //console.log("this.state.displayLoadMoreLoader",this.state.displayLoadMoreLoader);
                        this.setState({
                            dataConnections: [...this.state.dataConnections, ...mData]
                        })
                        //console.log("dataConnections if",this.state.dataConnections)
                    } else {
                        this.setState({
                            dataConnections: mData
                        })
                        //console.log("dataConnections else",this.state.dataConnections)
                    }
                }
            }
        } else {
            if (response != undefined && response != null && response.length > 0) {
                Alert.alert(response.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
        this.setState({
            loading: false,
            displayLoadMoreLoader: false
        });

    };

    /**
    * call send invitation API
    */
    callSendInvitationAPI = () => {
        try {
            this.setState({ loading: true });
            let uri = Memory().env == "LIVE" ? Global.URL_SEND_EVENT_INVITATION: Global.URL_SEND_EVENT_INVITATION_DEV;
            let params = new FormData();
            params.append("token", this.state.userToken);
            params.append("user_id", this.state.userId);
            params.append("format", "json");
            params.append("event_id", this.state.eventId);
            params.append("host_id", this.state.hostId); // used for guest invite 
            if(this.state.selected_invite_user == null) {
                for (var i = 0; i < this.state.selectedContactList.length; i++) {
                    params.append("data[" + i + "]", this.state.selectedContactList[i].key);
                }
            } else {
                params.append("data[0]", this.state.selected_invite_user.id);
            }
            console.log(TAG + " callSendInvitationAPI uri " + uri);
            console.log(TAG + " callSendInvitationAPI params " + JSON.stringify(params));
            WebService.callServicePost( uri, params, this.handleSendInvitationResponse );
        } catch (error) {
            console.log(TAG + " callSendInvitationAPI error " + error);
            this.setState({ loading: false });
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    };

    /**
    * handle send invitaiton API response
    */
    handleSendInvitationResponse = (response, isError) => {
        // console.log(TAG + "callSendInvitationAPI Response " + JSON.stringify(response));
        console.log(TAG + "callSendInvitationAPI isError " + isError);
        if (!isError) {
            var result = response;
            if (typeof result != "undefined" && result != null) {
                if(result.m_f_exceeded == 1) {
                    Alert.alert(result.msg, "");
                } else {
					const {userId, hostId, selected_invite_user} = this.state;
                    this.setState({
                        invite_members_popup: userId == hostId ? (selected_invite_user == null ? true : false) : true,
                        invite_action_complete: true
                    })
                    if(selected_invite_user == null) {
                        if ( this.state.selectedContactList.length > 0 ) {
                            this.setState({
                                invite_members_popup: true
                            })      
                        }
                        // const { eventId, goToEventScreen, refreshListData } = this.props.route.params;
                        // if (goToEventScreen) {
                        //     this.props.navigation.goBack();
                        //     goToEventScreen()
                        // } else {
                        //     console.log(TAG, "c2")
                        //     if(this.props.route.params.loadAfterDeletingEvent) {
                        //         this.props.route.params.loadAfterDeletingEvent(false);
                        //     }
                        //     this.props.route.params.refreshListData();                            
                        // }
                    } else {
                        // console.log(TAG + "callSendInvitationAPI ", this.state.hostId, this.state.invite_members_popup);
                        var dataConnections = this.state.dataConnections;
                        for(i = 0; i < dataConnections.length; i ++) {
                            if(dataConnections[i].id == selected_invite_user.id) {
                                dataConnections[i].invited = true;
                                dataConnections[i].check = false;
                                break;
                            }
                        }
                        var selectedContactList = this.state.selectedContactList;
                        var index = -1;
                        for(i = 0; i < selectedContactList.length; i ++) {
                            if(selectedContactList[i].key == selected_invite_user.id) {
                                index = i;
                                break;
                            }
                        }
                        if(index > -1) {
                            selectedContactList.splice(index, 1);
                        }                        
                        this.setState({
                            dataConnections: dataConnections,
                            selectedContactList: selectedContactList,
                            selected_invite_user: null
                        })
                        // if(userId != hostId) {
                        // 	this.props.navigation.goBack();
                        // }
                    }
                }
            }
        } else {
            if (response != undefined && response != null && response.length > 0) {
                Alert.alert(response.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
            
            const { eventId, goToEventScreen } = this.props.route.params;
            if (goToEventScreen) {
                this.props.navigation.goBack();
                goToEventScreen();
            } else {
                if(this.props.route.params.loadAfterDeletingEvent) {
                    this.props.route.params.loadAfterDeletingEvent(false);
                }
                this.props.navigation.goBack();
            }
        }
        this.setState({
            messageLoader: false,
            loading: false
        });
    };

    callCreateGroupAPI = async () => {
        try {
            this.setState({
                loading: true
            });
            var timeStamp = Math.floor(Date.now() / 1000);
            let uri = Memory().env == "LIVE" ? Global.URL_GROUP_CREATE + Constants.CALL_BACK_FUNCTION : Global.URL_GROUP_CREATE_DEV + Constants.CALL_BACK_FUNCTION
            let params = new FormData();
            params.append("token", this.state.userToken);
            params.append("user_id", this.state.userId);
            params.append("format", "json");
            params.append("basedata", this.state.userId);
            params.append("name", this.props.route.params.eventName);
            params.append("type", "2");
            params.append("password", "");

            console.log(TAG + " callCreateGroupAPI uri " + uri);
            console.log(TAG + " callCreateGroupAPI params " + JSON.stringify(params));

            WebService.callCometChatServicePost(uri, params, this.handlCreateGroupResponse);
        } catch (error) {
            console.log(TAG + " callCreateGroupAPI error " + error);
            this.setState({
                loading: false
            });
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    };

    handlCreateGroupResponse = (response, isError) => {
        console.log(TAG + " callCreateGroupAPI result " + JSON.stringify(response));
        console.log(TAG + " callCreateGroupAPI isError " + isError);

        if (!isError) {
            var result = response;
            if (result != undefined && result != null) {                
                var jsonString = result;
                var startPrfix = Constants.CALL_BACK_FUNCTION_PREFIX;
                if (jsonString != undefined && jsonString != null && jsonString.startsWith(startPrfix)) {
                    jsonString = jsonString.substring(startPrfix.length, jsonString.length - 1)
                }
                var groupData = JSON.parse(jsonString);
                // if (typeof groupData != undefined
                //     && groupData != null
                //     && typeof groupData.loggedout != undefined
                //     && groupData.loggedout != null
                // ) {
                //     //TODO manage loggedout from cometchat apis
                //     this.showReloginDialog()
                // } else {
                    if (groupData.id != undefined && groupData.id != null) {
                        this.callAddMemberAPI(groupData.id, groupData.n)
                    } else {
                        this.setState({
                            loading: false
                        });
                    }
                //}

            } else {
                this.setState({
                    loading: false
                });
            }
        } else {
            this.setState({
                loading: false
            });
            if (response != undefined && response != null && response.length > 0) {
                if (response === Constants.ERROR_MESSAGE_COMETCHAT_LOGOUT) {
                    // //TODO manage loggedout from cometchat apis
                    // this.showReloginDialog()
                } else {
                    Alert.alert(response.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
                }
            }
        }

    };
    
    callAddMemberAPI = async (groupId, groupName) => {
        try {
            this.setState({
                loading: true
            });
            let uri = Memory().env == "LIVE" ? Global.URL_GROUP_MEMBER_ADD + this.state.userId + "&callbackfn=mobileapp" : Global.URL_GROUP_MEMBER_ADD_DEV + this.state.userId + "&callbackfn=mobileapp"
            let params = new FormData();

            params.append("token", this.state.userToken);
            params.append("user_id", this.state.userId);
            params.append("format", "json");
            params.append("basedata", this.state.userId);
            params.append("roomid", groupId);
            params.append("roomname", groupName);
            params.append("cometchat_user_search", "");
            params.append("callbackfn", "mobileapp");
            params.append("inviteid", "");

            for (var i = 0; i < this.state.selectedContactList.length; i++) {
                params.append("invite[" + i + "]", this.state.selectedContactList[i].key);
            }

            console.log(TAG + " callAddMemberAPI uri " + uri);
            console.log(TAG + " callAddMemberAPI params " + JSON.stringify(params));

            WebService.callCometChatServicePost(uri, params, this.handlAddMemberResponse);
        } catch (error) {
            console.log(TAG + " callAddMemberAPI error " + error);
            this.setState({
                loading: false
            });
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    };

    /**
    * handle add member ingroup API response
    */
    handlAddMemberResponse = (response, isError) => {
        console.log(TAG + " callAddMemberAPI result " + JSON.stringify(response));
        console.log(TAG + " callAddMemberAPI isError " + isError);

        if (!isError) {
            var result = response;
            if (result != undefined && result != null) {
                console.log(TAG + " callAddMemberAPI result " + JSON.stringify(result));
                this.props.route.params.refreshList(true);
                this.props.navigation.goBack();
            }
        } else {
            this.setState({
                loading: false
            });
            if (response != undefined && response != null && response.length > 0) {
                if (response === Constants.ERROR_MESSAGE_COMETCHAT_LOGOUT) {
                    // //TODO manage loggedout from cometchat apis
                    // this.showReloginDialog()
                } else {
                    Alert.alert(response.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
                }
            }
        }
    };
    
    callInviteNoneMemberAPI = async () => {        
        var rowInvitation = [];
        // const rowInvitation = this.state.rowInvitation;
        var error_type = "";
        for (let index = 0; index < this.state.rowInvitation.length; index++) {
            if ( !ValidationUtils.isEmptyOrNull(this.state.rowInvitation[index].name.trim()) && (!ValidationUtils.isEmptyOrNull(this.state.rowInvitation[index].phoneNumber.trim()) || ValidationUtils.isEmailValid(this.state.rowInvitation[index].email.trim())) ) {
                rowInvitation.push(this.state.rowInvitation[index]);                
            }
        }
        if (rowInvitation.length == 0) {
            Alert.alert(Constants.WARNING_ALERT_TITLE, Constants.NONINVITE_EMPTY);
            return;
        }
        try {
            this.setState({
                loading: true
            });
            let uri = Memory().env == "LIVE" ? Global.URL_INVITEE_NON_MEMBER : Global.URL_INVITEE_NON_MEMBER_DEV;
            let params = new FormData();

            params.append("token", this.state.userToken);
            params.append("user_id", this.state.userId);
            params.append("format", "json");
            params.append("event_id", this.state.eventId);
            let aryEmail = [];
            let aryName = [];
            let aryPhone = [];
            let aryMemberType = [];
            let aryGender = [];
            
            for (let index = 0; index < rowInvitation.length; index++) {
                const element = rowInvitation[index];
                aryEmail.push(element.email);
                aryName.push(element.name);
                aryPhone.push(element.phoneNumber);
                aryMemberType.push(this.state.user_role[element.selected_user_role_index].type);
                if(element.selected_gender_index == 0) {
                    aryGender.push("1");
                } if(element.selected_gender_index == 1) {
                    aryGender.push("2");
                }
            }
            params.append("pemail", JSON.stringify(aryEmail));
            params.append("pname", JSON.stringify(aryName));
            params.append("pphone", JSON.stringify(aryPhone));
            params.append("pmembertype", JSON.stringify(aryMemberType));
            params.append("pgender", JSON.stringify(aryGender));

            console.log(TAG + " callInviteNoneMemberAPI uri " + uri);
            console.log(TAG + " callInviteNoneMemberAPI params " + JSON.stringify(params));

            WebService.callServicePost(uri, params, this.handleInviteNoneMember);
        } catch (error) {
            console.log(TAG + " callInviteNoneMemberAPI error " + error);
            this.setState({
                loading: false
            });
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    };

    /**
    * handle add member ingroup API response
    */
    handleInviteNoneMember = (response, isError) => {
        console.log(TAG + " callInviteNoneMemberAPI Response " + response);
        console.log(TAG + " callInviteNoneMemberAPI isError " + isError);

        if (!isError) {
            var result = response;
            this.setState({
                showInvitationPopUp: false, 
                rowInvitation: [{name: '', email: '', phoneNumber: '', selected_user_role_index: 0, selected_gender_index: 0}],
            })
            if(result.status == 1) {
                Alert.alert(Constants.SENT_INVITE_SUCCESS, "");
            } else {
                Alert.alert(result.error_msg[0]);
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

    showPopupView = () => {
        this.setState({
            showModel: true
        })
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

    /** render PopUp Menu
     *
     * @returns {*}
     */
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

    getDataAgain = (refresh) => {
        if (refresh) {
            this.getData(refresh);
        }
    }

    async clear_filter() {
        // try {
        //     await AsyncStorage.removeItem('ageValues1');
        //     await AsyncStorage.removeItem('distanValues1');
        //     await AsyncStorage.removeItem('heightValues1');
        //     await AsyncStorage.removeItem('weightValues1');
        //     await AsyncStorage.removeItem('accountType1');
        //     await AsyncStorage.removeItem('noneAccountType1');
        //     await AsyncStorage.removeItem('hairColor1');
        //     await AsyncStorage.removeItem('eyeColor1');
        //     await AsyncStorage.removeItem('skinColor1');
        //     await AsyncStorage.removeItem('bodyType1');
        //     await AsyncStorage.removeItem('ethnicityType1');
        //     await AsyncStorage.removeItem('maritalType1');
        //     await AsyncStorage.removeItem('ageValues1');
        //     await AsyncStorage.removeItem('genderType1');
        // } catch(err){
        //     console.log(err)
        // }
        this.setState({

            loading: false,
            // eventId: "",
            isLoadMoreMyConnection: true,
            displayLoadMoreLoader: false,
            // selectedContactList: [],
            // inviteList: [],
            activeSections:[0],
            ageValues:[0,60],
            distanValues:[0,100],
            heightValues:[30, 229],
            weightValues:[5, 145],
            networthValues:[0,4],
            accountType:[],
            nonAccountType:[],
            hairColor: [],
            eyeColor: [],
            skinColor:[],
            bodyType:[],
            ethnicityType:[],
            maritalType:[],
            genderType:[],
            showNetworth: false,
            showModel:false,

            rowInvitation: [{name: '', email: '', phoneNumber: '', selected_user_role_index: 0, selected_gender_index: 0}],
            showInvitationPopUp: false,
            page_number: 1
        }, () => this.callMyConnectionsListAPI(true))
        
    }

    async show_all_member() {
        // try {
        //     await AsyncStorage.removeItem('ageValues1');
        //     await AsyncStorage.removeItem('distanValues1');
        //     await AsyncStorage.removeItem('heightValues1');
        //     await AsyncStorage.removeItem('weightValues1');
        //     await AsyncStorage.removeItem('accountType1');
        //     await AsyncStorage.removeItem('noneAccountType1');
        //     await AsyncStorage.removeItem('hairColor1');
        //     await AsyncStorage.removeItem('eyeColor1');
        //     await AsyncStorage.removeItem('skinColor1');
        //     await AsyncStorage.removeItem('bodyType1');
        //     await AsyncStorage.removeItem('ethnicityType1');
        //     await AsyncStorage.removeItem('maritalType1');
        //     await AsyncStorage.removeItem('ageValues1');
        //     await AsyncStorage.removeItem('genderType1');
        // } catch(err){
        //     console.log(err)
        // }
        var searchType = "";
        if(this.state.isReset){
            searchType = "reset";
            this.setState({isReset:false})
            console.log("Reset called",searchType);
        }else{
            searchType="shows_all_member"
            console.log("Show all members called",searchType);

        }

        this.setState({

            loading: false,
            eventId: "",
            isLoadMoreMyConnection: true,
            displayLoadMoreLoader: false,
            // selectedContactList: [],
            // inviteList: [],
            activeSections:[0],
            ageValues:[0,60],
            distanValues:[0,100],
            heightValues:[30, 229],
            weightValues:[5, 145],
            networthValues:[0,4],
            accountType:[],
            nonAccountType:[],
            hairColor: [],
            eyeColor: [],
            skinColor:[],
            bodyType:[],
            ethnicityType:[],
            maritalType:[],
            genderType:[],
            showNetworth: false,
            showModel:false,

            rowInvitation: [{name: '', email: '', phoneNumber: '', selected_user_role_index: 0, selected_gender_index: 0}],
            showInvitationPopUp: false,

            //searchText: search_Text,
            page_number: 1
        }, () => this.callMyConnectionsListAPI(true, searchType))
    }

    /**
    * handle event detai lAPI response
    */
    goToGuestListPage = async () => {
        try {
            let event_id = this.state.eventId;
            this.setState({ loading: true });
            let uri = Memory().env == "LIVE" ? Global.URL_EVENT_DETAIL + event_id : Global.URL_EVENT_DETAIL_DEV + event_id
            let params = new FormData();
            params.append("token", this.state.userToken);
            params.append("user_id", this.state.userId);
            params.append("format", "json");
            params.append("data", "");
            console.log(TAG + " callEventDetailAPI uri " + uri);
            console.log(TAG + " callEventDetailAPI params " + JSON.stringify(params));
            WebService.callServicePost(uri, params, this.handleEventDetailResponse);
        } catch (error) {
            this.setState({ loading: false, commentLoading: false });
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    };

    handleEventDetailResponse = (response, isError) => {
        // console.log(TAG + " callEventDetailAPI Response " + JSON.stringify(response));
        console.log(TAG + " callEventDetailAPI isError " + isError);
        if (!isError) {
            var result = response;
            if (result != undefined && result != null) {
                if (result.data != undefined && result.data != null) {
                    eventDetailData = result.data;
                    this.props.navigation.navigate("GuestList", {
                        user_id: this.state.userId,
                        token: this.state.userToken,
                        eventId: this.state.eventId,
                        inviteList: eventDetailData.invite,
                        loadAfterDeletingEvent: this.props.loadAfterDeletingOrEditingEvent,
                        ishosted: true,
                        eventDetailData: eventDetailData,
                    })
                }
            }
        } else {
            if (response != undefined && response != null && response.length > 0) {
                Alert.alert(response.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
        this.setState({ loading: false });
    };

    render() {
        const count = this.state.selectedContactList.length;
        return (
            // <Fragment>
            //     <SafeAreaView style={{backgroundColor:Colors.black,flex:0}}/>
            <SafeAreaView style={styles.container} onStartShouldSetResponder = {() => Keyboard.dismiss()}>
                {this.renderHeaderView()}
                {this.renderBannerView()}
                {this.renderPopupView()}
                {
                    !this.props.route.params.isCopy &&
                    <TouchableOpacity
                        style={{
                            width:width-30,
                            backgroundColor: Colors.gold,
                            alignSelf:'center',
                            marginTop: 10,
                            height:50,
                            backgroundColor:Colors.gold,
                            alignItems:'center',
                            justifyContent:'center',
                            borderTopLeftRadius:15,
                            borderTopRightRadius:15,
                            borderBottomLeftRadius: this.state.isFiltering ? 0 : 15,
                            borderBottomRightRadius: this.state.isFiltering ? 0 : 15,
                            marginBottom:this.state.isFiltering ? 0 : 15,
                        }}
                        onPress={() => this.setState({isFiltering: !this.state.isFiltering})}
                    >
                        <Text style={[{color:Colors.black, fontSize:17,}, stylesGlobal.font_bold]}>{"Search Filter"}</Text>
                        <Icon name={this.state.isFiltering ? 'chevron-up' : 'chevron-down'} color='#000' size={20} style={{ position:'absolute', right:20,}}/>
                    </TouchableOpacity>
                }
                {
                    this.state.invite_members_popup &&
                    <Modal
                        animationType="fade"
                        transparent={true}
                        // closeOnClick={true}
                        visible={this.state.suspend_account_popup}
                        onRequestClose={() => this.setState({suspend_account_popup: false})}
                        supportedOrientations={['portrait', 'landscape']}
                    >
                        <View style = {{width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center'}}>
                            <View style = {stylesGlobal.popup_bg_blur_view}></View>
                            <View style = {[stylesGlobal.popup_main_container, {paddingBottom:0}]}>
                                <View style = {[stylesGlobal.popup_desc_container, {flexDirection:'column'}]}>
                                    {this.state.userId != this.state.hostId ? 
                                        <>
                                            <Text style = {[{fontSize: 14, color: Colors.black,paddingBottom:7}, stylesGlobal.font]}>{Constants.BRING_A_MEMBER_HEADER} </Text>
                                            <Text style = {[{fontSize: 14, color: Colors.black,paddingBottom:0}, stylesGlobal.font]}>{Constants.BRING_A_MEMBER_NOTE}</Text>
                                        </> : 
                                        <Text style = {[{fontSize: 14, color: Colors.black,paddingBottom:0}, stylesGlobal.font]}>{count + (count == 1 ? " invitation sent" : "  invitations sent")}</Text>
                                    }
                                </View>
                                <View style = {stylesGlobal.popup_button_container}>
                                    <TouchableOpacity style = {[stylesGlobal.common_button, stylesGlobal.shadow_style, {marginRight: 5}]} 
                                        onPress = {() => {
                                            this.setState({invite_members_popup: false});
                                        }}> 
                                        <Text style = {[stylesGlobal.popup_button_text, stylesGlobal.font]}>{"Invite more friends"}</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style = {[stylesGlobal.common_button, stylesGlobal.shadow_style]} 
                                        onPress = { async() => {
                                            this.setState({invite_members_popup: false});
                                            await this.goToGuestListPage();
                                        }}> 
                                        <Text style = {[stylesGlobal.popup_button_text, stylesGlobal.font]}>{"OK"}</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </Modal>
                }
                {this.state.isFiltering ? this.renderFilterView() : null}
                {this.renderMainView()}
                {/* {this.state.showInvitationPopUp && this.renderInvitationPopUp()}
                {this.state.showPhoneEmailSelectPopUp && this.renderPhoneEmailSelectPopUp()} */} 
                {this.state.loading == true && <ProgressIndicator /> }
            </SafeAreaView>
            // </Fragment>
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
    * display top header
    */
    renderHeaderView = () => {
        let imageUrl = this.state.userImagePath + Constants.THUMB_FOLDER + this.state.userImageName;
        return (
            <View style={[stylesGlobal.headerView]}>
                <TouchableOpacity style={stylesGlobal.header_backbuttonview_style} 
                    onPress={async() => {
                        const { eventId, goToEventScreen, refreshListData } = this.props.route.params;
                        if (goToEventScreen) {
                            this.props.navigation.goBack();
                            goToEventScreen();
                        } else {
                            if(this.state.invite_action_complete && refreshListData) {
                                refreshListData();
                            }
                            await this.goToGuestListPage();
                            // this.props.navigation.goBack();
                        }
                    }}
                >
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
                        onChangeText = {(searchText)=>this.setState({ searchText, page_number: 1}, () => this.searchUser())}
                        value={this.state.searchText}
                        defaultValue=""
                        multiline={false}
                        autoCapitalize='sentences'
                        placeholder="Search members..."
                        keyboardType='ascii-capable'
                    />
                    <TouchableOpacity style={stylesGlobal.header_searchiconview_style} onPress = {() => {
                        if(this.state.searchText == "") {
                            this.refs.searchTextInput.focus();
                        } else {
                            Keyboard.dismiss();
                            this.setState({
                                searchText: "",
                            });
                            if(this.props.route.params.isCopy) {
                                this.setState({
                                    dataConnections: this.state.global_dataConnections
                                })
                            } else {
                                this.setState({ 
                                    searchText: "", 
                                    page_number: 1
                                }, () => this.searchUser())
                            }
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
                <TouchableOpacity style={stylesGlobal.header_avatarview_style} onPress={() => this.showPopupView()}>
                    <View style={stylesGlobal.header_avatarsubview_style}>
                        <ImageCompressor style = {stylesGlobal.header_avatar_style} uri={imageUrl}/>
                    </View>
                </TouchableOpacity>
            </View>
        )


    };

    renderMainView = () => {
        return (
            <View style={{  width: "100%", flex: 1}}>
            {
                this.renderConnectionsList()
            }
            </View>
        );
    };

    add_guest_list = (data) => {
        var dataConnections = this.state.dataConnections;
        this.setState(data, () => {
            for(i = 0; i < this.state.selectedContactList.length; i ++) {
                for(j = 0; j < dataConnections.length; j ++) {
                    if(this.state.selectedContactList[i].key == dataConnections[j].id ) {
                        dataConnections[j].check = true;
                        break;
                    }
                }
            }
           
            this.setState({
                dataConnections: dataConnections,
            })
        });
    }

    isCloseToTop = ({layoutMeasurement, contentOffset, contentSize}) => {
        const paddingToBottom = 10;
        return contentOffset.y <= -40
    };

    isCloseToBottom = ({layoutMeasurement, contentOffset, contentSize}) => {
        const paddingToBottom = 10;
        return layoutMeasurement.height + contentOffset.y >=
          contentSize.height - paddingToBottom;
    };

    renderConnectionsList = () => {

        let emptyView = (
            <View style={styles.emptyView}>
                <View style={stylesGlobal.empty_cardView}>
                    <Text style={[{width: '80%'}, stylesGlobal.empty_cardView_text, stylesGlobal.font]}>
                        {"Your current search and filters do not match any records."}
                    </Text> 
                    <TouchableOpacity style = {[{paddingHorizontal: 15, paddingVertical: 10, marginTop: 15, borderRadius: 5, backgroundColor: Colors.gold}, stylesGlobal.shadow_style]} onPress = {() => this.show_all_member()}>
                        <Text style = {[{color: Colors.white, fontSize: 15,}, stylesGlobal.font]}>{"Show all Members"}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
        
        let footerView = (
            <View style={{backgroundColor: Colors.black, height: 50, justifyContent: 'center', alignItems: 'center'}}>
                <ProgressIndicator />
            </View>
        );


        return (
            <View style={{backgroundColor: Colors.black, flex: 1, width: '100%', height: '100%'}} onTouchStart = {() => this.setState({isFiltering: false})}>
            {
                this.state.selectedContactList.length > 0 &&
                <View style = {{width: '100%'}}>
                    <FlatList
                        renderItem={({ item, index }) => (
                            <View style={{marginHorizontal: 10}}>
                                <View style={{width: 60, height: 60, borderRadius: 30, overflow: 'hidden'}}>
                                    <Image style={{width: 60, height: 60, resizeMode: 'contain'}} source={{uri:item.userImage, cache:'force-cache'}} defaultSource={require("../icons/Background-Placeholder_Camera.png")}/>
                                </View>
                                {/* <Text style={{color:Colors.black,marginBottom:20,width:70,textAlign:'center'}} numberOfLines={1} >{item.name}</Text> */}
                                <TouchableOpacity style={{position:'absolute', top:0, right:0, width: 20, height: 20, borderRadius:10, overflow:'hidden', backgroundColor: Colors.white, justifyContent: 'center', alignItems: 'center'}}
                                    onPress={()=>{
                                        this.setState({action_invite_list: true,})
                                        this.deleteSelected(index, item.key);
                                    }}
                                >
                                    <Image style={{width:'80%', height:'80%', resizeMode:'contain', tintColor: Colors.gold}}source={require('../icons/connection-delete.png')}/>
                                </TouchableOpacity>
                            </View>
                        )}
                        data={this.state.selectedContactList}
                        showsHorizontalScrollIndicator={false}
                        extraData={this.state}
                        bounces={false}
                        alwaysBounceHorizontal={true}
                        alwaysBounceVertical={false}
                        showsVerticalScrollIndicator={false}
                        horizontal={true}
                    />
                </View>
            }
			{
                this.state.userId == this.state.hostId &&
                <View style={{flexDirection:'row', justifyContent: 'flex-end', alignItems: 'center', marginVertical:10}}>
					{/* <CheckboxCus */}
     {/*                    text='Select All' */}
     {/*                    white={true} */}
     {/*                    checked={this.state.checked} */}
     {/*                    style={{paddingVertical:10, paddingHorizontal:15, borderRadius:5, alignItems:'center', marginLeft: 15}} */}
     {/*                    onPress={() => { */}
     {/*                        let temp = [...this.state.dataConnections]; */}
     {/*                        let selectedList = []; */}
     {/*                        if(!this.state.checked == false) { */}
     {/*                            selectedList = []; */}
     {/*                        } */}
     {/*                        temp.forEach((item, index) => { */}
     {/*                            if(!this.state.checked) { */}
     {/*                                if(!item.invited) { */}
     {/*                                    let newItem={ */}
     {/*                                        key: item.id, */}
     {/*                                        userImage: item.imgpath + Constants.THUMB_FOLDER + item.filename, */}
     {/*                                        name: item.first_name + " " + item.last_name */}
     {/*                                    } */}
     {/*                                    selectedList.push(newItem); */}
     {/*                                } */}
     {/*                            } */}
     {/*                            item.check = !this.state.checked; */}
     {/*                        }); */}
     {/*                        this.setState({checked: !this.state.checked, dataConnections: temp, selectedContactList: selectedList}); */}
     {/*                    }} */}
     {/*                /> */}
                    <TouchableOpacity style={{backgroundColor:Colors.gold, paddingVertical:10, paddingHorizontal:15, borderRadius:5, minWidth:50, minHeight: 40, alignItems:'center', marginRight: 15}}
                        onPress={() => {
                            if (this.state.selectedContactList.length > 0) {
                                this.callSendInvitationAPI();
                                // this.callCreateGroupAPI();
                            } else {
                                Alert.alert(Constants.SELECT_AT_LEAST_ONE_MEMBER);
                            }
                        }}
                    >
                        <Text style={[stylesGlobal.font, {color:Colors.white}]}>{"Invite selected"}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={{backgroundColor:Colors.gold, paddingVertical:10, paddingHorizontal:15, borderRadius:5, minWidth:50, minHeight: 40, alignItems:'center', marginRight: 15}}
                        onPress={() => {
                            const { eventId, goToEventScreen } = this.props.route.params;
                            this.props.navigation.goBack();
                            if (goToEventScreen) {
                                goToEventScreen();
                            }
                        }}
                    >
                        <Text style={[stylesGlobal.font, {color:Colors.white}]}>{"Cancel"}</Text>
                    </TouchableOpacity>
                </View>
			}
            {
                this.state.dataConnections.length === 0 && !this.state.loading ? emptyView : 
                <FlatList
                    // contentContainerStyle={{alignSelf:'center'}}
                    ListFooterComponent={this.state.displayLoadMoreLoader == true ? footerView : null}
                    extraData={this.state}
                    // pagingEnabled={false}
                    showsHorizontalScrollIndicator={false}
                    showsVerticalScrollIndicator={false}
                    data={this.state.dataConnections}
                    keyExtractor={(item, index) => index.toString()}
                    style = {{width: '100%'}}
                    numColumns = {1}
                    key = {1}
                    renderItem={({ item, index }) => (
                        <View key = {index} style = {{width: '100%', alignItems: 'center'}}>
                            <RowInviteFriend
                                data={item}
                                screenProps={this.props.navigation}
                                index={index}
                                refreshList={this.updateRecentChatList}
                                onItemPress={this.onItemPress}
                                myUserId={this.state.userId}
																hostId={this.state.hostId}
                                refreshProfileImage={this.refreshProfileImage}
                                slectedList={this.state.selectedContactList}
                                isCopy = {
                                    
                                    this.props.route.params.isCopy}
                                invite_user = {this.invite_user}
                            />
                        </View>
                        
                    )}
                    onEndReachedThreshold={1}
                    onScroll={({nativeEvent}) => {
                        if(this.isCloseToTop(nativeEvent)) {
                            // if(this.props.route.params.isCopy) {
                            //     return;
                            // }
                            this.setState({
                                loading:true,
                                page_number: 1
                            }, () => {
                                setTimeout(() => {
                                    return this.setState({
                                        loading: false

                                    })
                                }, 1000);
                                // this.searchUser(this.state.searchText);
                               // this.callMyConnectionsListAPI(true);
                            })
                        }
                        if(this.isCloseToBottom(nativeEvent)) {
                            if(this.props.route.params.isCopy) {
                                return;
                            }
                            if (this.state.isLoadMoreMyConnection && !this.state.displayLoadMoreLoader ) {
                                this.setState({
                                    displayLoadMoreLoader: true,
                                }, () => {
                                    this.callMyConnectionsListAPI(false);
                                })
                            }
                        }
                    }}
                />
            }   
            </View>
        );
    };

    renderFilterView = () => {
        const sections = ['Account Type', 'Demographic', 'Physical Appearance', 'Marital Status']
        return(
            <View style = {{maxHeight: '80%', borderBottomLeftRadius:15, borderBottomRightRadius:15, margin:15, marginTop:0, zIndex: 10, overflow: 'hidden', backgroundColor: Colors.white}}>
                <ScrollView >
                    <Accordion
                        expandMultiple={true}
                        activeSections={this.state.activeSections}
                        sections={sections}
                        renderHeader={this._renderHeader}
                        renderContent={this._rnederContent}
                        onChange={this._updateSection}
                        underlayColor='white'
                    />
                    <View style={{width:'100%', justifyContent:'center', flexDirection: 'row', marginTop: 20}}>
                        <TouchableOpacity style={[{backgroundColor:Colors.gold, borderRadius:10, alignItems:'center', justifyContent:'center', height:40, paddingHorizontal: 15}, stylesGlobal.shadow_style]}
                            onPress={async () => {
                                try {
                                    await AsyncStorage.removeItem('ageValues1');
                                    await AsyncStorage.removeItem('distanValues1');
                                    await AsyncStorage.removeItem('heightValues1');
                                    await AsyncStorage.removeItem('weightValues1');
                                    await AsyncStorage.removeItem('accountType1');
                                    await AsyncStorage.removeItem('noneAccountType1');
                                    await AsyncStorage.removeItem('hairColor1');
                                    await AsyncStorage.removeItem('eyeColor1');
                                    await AsyncStorage.removeItem('skinColor1');
                                    await AsyncStorage.removeItem('bodyType1');
                                    await AsyncStorage.removeItem('ethnicityType1');
                                    await AsyncStorage.removeItem('maritalType1');
                                    await AsyncStorage.removeItem('ageValues1');
                                    await AsyncStorage.removeItem('genderType1');
                                } catch(err){
                                    console.log(err)
                                }
                                this.setState({
                                isFiltering: false,
                                isReset:true,
                                filter_apply_button_click: false
                                } ,() =>this.show_all_member())
                            }}
                        >
                            <Text style={stylesGlobal.font}>{"Reset Filters"}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[{backgroundColor:Colors.gold, borderRadius:10, alignItems:'center', justifyContent:'center', height:40, paddingHorizontal: 15, marginLeft: 15}, stylesGlobal.shadow_style]}
                            onPress={async () => {
                                // this.searchUser()
                                // this.setState({isFiltering: false})
                                this.setState({
                                    page_number: 1,
                                    isFiltering: false,
                                    filter_apply_button_click: true
                                }, () => this.callMyConnectionsListAPI(true))
                            }}
                        >
                            <Text style={stylesGlobal.font}>{"Apply"}</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={{height:30}}></View>
                </ScrollView>
            </View>
        )
    }


    _renderHeader = (section, index, isActive, sections) => {
        if (index == 0) {
            return <View style={{height:0, backgroundColor:Colors.gold}}/>
        }
        return(
            <View style={{height:50, backgroundColor:Colors.gold, alignItems:'center', justifyContent:'center', borderTopLeftRadius:15, borderTopRightRadius:15, flexDirection:'row', borderBottomColor:'#fff', borderBottomWidth:1,}}>
                <Text style={[{fontSize:17,}, stylesGlobal.font_bold]}>{section}</Text>
                <Icon name={isActive ? 'chevron-up' : 'chevron-down'} color='#000' size={20} style={{position:'absolute', right:20,}}/>
            </View>
        )
    }

    _checkboxPressed = (text, type, stateValue) => {
        const temp = stateValue;
        if (temp.includes(text)) {
            const index = temp.indexOf(text);
            if (index > -1) {
                temp.splice(index, 1);
            }
        } else {
            temp.push(text)
        }
        switch (type) {
            case 'accountType':
                let showNetworth;
                if (temp.includes('1') || temp.includes('2')) {
                    showNetworth = true
                } else {
                    showNetworth = false
                }
                this.setState({accountType:temp, showNetworth})
                // AsyncStorage.setItem('accountType1', JSON.stringify(temp))
                //     .then(json => console.log('success'))
                //     .catch(error => console.log('error!'))
                break;
            case 'gender':
                this.setState({genderType:temp})
                // AsyncStorage.setItem('genderType1', JSON.stringify(temp))
                //     .then(json => console.log('success'))
                //     .catch(error => console.log('error!'))
                break;
            case 'hair':
                this.setState({hairColor:temp})
                // AsyncStorage.setItem('hairColor1', JSON.stringify(temp))
                //     .then(json => console.log('success'))
                //     .catch(error => console.log('error!'))
                break;
            case 'eye':
                this.setState({eyeColor:temp})
                // AsyncStorage.setItem('eyeColor1', JSON.stringify(temp))
                //     .then(json => console.log('success'))
                //     .catch(error => console.log('error!'))
                break;
            case 'skin':
                this.setState({skinColor:temp})
                // AsyncStorage.setItem('skinColor1', JSON.stringify(temp))
                //     .then(json => console.log('success'))
                //     .catch(error => console.log('error!'))
                break;
            case 'body':
                this.setState({bodyType:temp})
                // AsyncStorage.setItem('bodyType1', JSON.stringify(temp))
                //     .then(json => console.log('success'))
                //     .catch(error => console.log('error!'))
                break;
            case 'ethinic':
                this.setState({ethnicityType:temp});
                // AsyncStorage.setItem('ethnicityType1', JSON.stringify(temp))
                //     .then(json => console.log('success'))
                //     .catch(error => console.log('error!'))
                break;
            case 'marital':
                this.setState({maritalType:temp})
                // AsyncStorage.setItem('maritalType1', JSON.stringify(temp))
                //     .then(json => console.log('success'))
                //     .catch(error => console.log('error!'))
            case 'nonaccountType':
                this.setState({nonAccountType: temp})
                // AsyncStorage.setItem('noneAccountType1', JSON.stringify(temp))
                //     .then(json => console.log('success'))
                //     .catch(error => console.log('error!'))
            default:
                break;
        }
    }

    _rnederContent = (section, index) => {
        const {accountType,genderType,hairColor, eyeColor,skinColor,bodyType, ethnicityType,maritalType, nonAccountType} = this.state;
        switch (index) {
            case 0:
                return(
                    <View>
                        <View style={{flexDirection:'row', paddingVertical:15}}>
                            <View style={{flex:1}}>
                                <Checkbox text='Rich' checked={accountType.includes('1')} onPress={() => this._checkboxPressed('1', 'accountType', accountType)}/>
                                <Checkbox text='Model' checked={accountType.includes('3')} onPress={() => this._checkboxPressed('3', 'accountType', accountType)}/>
                                <Checkbox text='Famous' checked={accountType.includes('6')} onPress={() => this._checkboxPressed('6', 'accountType', accountType)}/>
                            </View>
                            <View style={{flex:1}}>
                                <Checkbox text='Gentlemen' checked={accountType.includes('2')} onPress={() => this._checkboxPressed('2', 'accountType', accountType)}/>
                                <Checkbox text='Connectors' checked={accountType.includes('5')} onPress={() => this._checkboxPressed('5', 'accountType', accountType)}/>
                            </View>
                        </View>
                        <View style={{backgroundColor:'#000', height:1}}></View>
                        <View style={{flexDirection:'row', paddingVertical:15}}>
                            <View style={{flex:1}}>
                                <Checkbox text='Fan' checked={accountType.includes('7')} disabled={false} onPress={() => this._checkboxPressed('7', 'accountType', accountType)}/>
                                <Checkbox text='Alumni' checked={accountType.includes('8')} disabled={false} onPress={() => this._checkboxPressed('8', 'accountType', accountType)}/>
                                {/* <Checkbox text='Applicants' checked={nonAccountType.includes('Applicants')} disabled={true} onPress={() => this._checkboxPressed('Applicants', 'nonaccountType', nonAccountType)}/> */}
                            </View>
                            <View style={{flex:1}}>
                            <Checkbox text='VIP Fan' checked={accountType.includes('4')} disabled={false} onPress={() => this._checkboxPressed('4', 'accountType', accountType)}/>
                                {/* <Checkbox text='Alumni' checked={nonAccountType.includes('Alumni')} disabled={true} onPress={() => this._checkboxPressed('Alumni', 'nonaccountType', nonAccountType)}/> */}
                            </View>
                        </View>
                        <View style={{
                            paddingVertical:15
                        }}>
                            <CustomSlider
                                onValueChange={(values) => {
                                    this.setState({
                                        distanValues: values,
                                        page_number: 1
                                    }, () => this.callMyConnectionsListAPI(true))

                                    AsyncStorage.setItem('distanValues1', JSON.stringify(values))
                                        .then(json => console.log('success'))
                                        .catch(error => console.log('error!'))
                                }}
                                values={this.state.distanValues}
                                min={0}
                                max={100}
                                text='Miles'
                            />
                        </View>
                    </View>
                )
                break;
            case 1:
                return(
                    <View style={{
                        alignItems:'center',
                        paddingVertical:15
                    }}>
                        <View style={{flexDirection:'row', paddingVertical:15, justifyContent:'center', marginRight:15}}>
                            <Checkbox text='Female' checked={genderType.includes('Female')} onPress={() => this._checkboxPressed('Female', 'gender', genderType)}/>
                            <Checkbox text='Male' checked={genderType.includes('Male')} onPress={() => this._checkboxPressed('Male', 'gender', genderType)}/>
                        </View>
                        <CustomSlider
                            onValueChange={(values) => {
                                this.setState({
                                    ageValues: values,
                                    page_number: 1
                                }, () => this.callMyConnectionsListAPI(true))
                                
                                AsyncStorage.setItem('ageValues1', JSON.stringify(values))
                                        .then(json => console.log('success'))
                                        .catch(error => console.log('error!'))
                            }}
                            values={this.state.ageValues}
                            min={0}
                            max={60}
                            text='Age'
                        />
                        {this.state.showNetworth &&
                        <View style={{alignItems:'center', marginTop:25}}>
                            <View style={{flexDirection:'row'}}>
                                <Text style={[{marginRight:0, marginTop:-15}, stylesGlobal.font]}>N/A</Text>
                                <MultiSlider
                                    snapped={true}
                                    values={this.state.networthValues}
                                    sliderLength={250}
                                    min={0}
                                    max={4}
                                    customMarker={() => (
                                        <View style={{backgroundColor:Colors.gold, width:12, height:12, borderRadius:6, borderWidth:1, borderColor:'#000'}}>
                                        </View>
                                    )}
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
                                    markerContainerStyle={{
                                        width: 50,
                                        height: 50,
                                        backgroundColor:Colors.gold,
                                        borderWidth:1,
                                        borderColor:'#000'
                                    }}
                                    onValuesChangeFinish={(values) => {
                                        this.setState({
                                            networthValues: values,
                                            page_number: 1
                                        }, () => this.callMyConnectionsListAPI(true))
                                        
                                        AsyncStorage.setItem('networthValues1', JSON.stringify(values))
                                            .then(json => console.log('success'))
                                            .catch(error => console.log('error!'))
                                    }}
                                />
                                <Text style={[{marginLeft:0, marginTop:-15}, stylesGlobal.font]}>1B</Text>
                            </View>
                            <View style={{marginTop:-20, alignItems:'center'}}>
                                <View style={{width:250, flexDirection:'row', justifyContent:'space-evenly'}}>
                                    <Text style={[{color:Colors.gold}, stylesGlobal.font_semibold]}>{this.calNetworth(this.state.networthValues[0])}</Text>
                                    <Text style={[{color:Colors.gold}, stylesGlobal.font_semibold]}>{this.calNetworth(this.state.networthValues[1])}</Text>
                                </View>
                                <Text style={stylesGlobal.font}>Networth</Text>
                            </View>
                        </View>}
                    </View>
                )
            case 2:
                return(
                    <View>
                        <View style={{flexDirection:'row', paddingVertical:15}}>
                            <View style={{flex:1}}>
                                <Checkbox text='Black Hair' checked={hairColor.includes('12')} onPress={() => this._checkboxPressed('12', 'hair', hairColor)}/>
                                <Checkbox text='Brown Hair' checked={hairColor.includes('14')} onPress={() => this._checkboxPressed('14', 'hair', hairColor)}/>
                                <Checkbox text='Red Hair' checked={hairColor.includes('16')} onPress={() => this._checkboxPressed('16', 'hair', hairColor)}/>
                            </View>
                            <View style={{flex:1}}>
                                <Checkbox text='Blonde Hair' checked={hairColor.includes('13')} onPress={() => this._checkboxPressed('13', 'hair', hairColor)}/>
                                <Checkbox text='Grey Hair' checked={hairColor.includes('15')} onPress={() => this._checkboxPressed('15', 'hair', hairColor)}/>
                                <Checkbox text='Other' checked={hairColor.includes('17')} onPress={() => this._checkboxPressed('17', 'hair', hairColor)}/>
                            </View>
                        </View>
                        <View style={{backgroundColor:'#000', height:1}}></View>
                        <View style={{flexDirection:'row', paddingVertical:15}}>
                            <View style={{flex:1}}>
                                <Checkbox text='Black Eyes' checked={eyeColor.includes('1')} onPress={() => this._checkboxPressed('1', 'eye', eyeColor)}/>
                                <Checkbox text='Brown Eyes' checked={eyeColor.includes('3')} onPress={() => this._checkboxPressed('3', 'eye', eyeColor)}/>
                                <Checkbox text='Ohter' checked={eyeColor.includes('5')} onPress={() => this._checkboxPressed('5', 'eye', eyeColor)}/>
                            </View>
                            <View style={{flex:1}}>
                                <Checkbox text='Blue Eyes' checked={eyeColor.includes('2')} onPress={() => this._checkboxPressed('2', 'eye', eyeColor)}/>
                                <Checkbox text='Green Eyes' checked={eyeColor.includes('4')} onPress={() => this._checkboxPressed('4', 'eye', eyeColor)}/>
                                {/* <Checkbox text='Hazel Eyes' checked={eyeColor.includes('Hazel')} onPress={() => this._checkboxPressed('Hazel', 'eye', eyeColor)}/> */}
                            </View>
                        </View>
                        <View style={{backgroundColor:'#000', height:1}}></View>
                        <View style={{flexDirection:'row', paddingVertical:15}}>
                            <View style={{flex:1}}>
                                {/* <Checkbox text='Fair Skin' checked={skinColor.includes('7')} onPress={() => this._checkboxPressed('7', 'skin', skinColor)}/> */}
                                <Checkbox text='Black Skin' checked={skinColor.includes('7')} onPress={() => this._checkboxPressed('7', 'skin', skinColor)}/>
                                <Checkbox text='Olive Skin' checked={skinColor.includes('9')} onPress={() => this._checkboxPressed('9', 'skin', skinColor)}/>
                            </View>
                            <View style={{flex:1}}>
                            <Checkbox text='White Skin' checked={skinColor.includes('8')} onPress={() => this._checkboxPressed('8', 'skin', skinColor)}/>
                            <Checkbox text='Medium Skin' checked={skinColor.includes('553')} onPress={() => this._checkboxPressed('553', 'skin', skinColor)}/>

                                {/* <Checkbox text='Brown Skin' checked={skinColor.includes('Brown Skin')} onPress={() => this._checkboxPressed('Brown Skin', 'skin', skinColor)}/> */}
                            </View>
                        </View>
                        <View style={{backgroundColor:'#000', height:1}}></View>
                        <View style={{paddingVertical:15}}>
                            <CustomSlider
                                onValueChange={(values) => {
                                    this.setState({
                                        heightValues: values,
                                        page_number: 1
                                    }, () => this.callMyConnectionsListAPI(true))
                                    
                                    AsyncStorage.setItem('heightValues1', JSON.stringify(values))
                                        .then(json => console.log('success'))
                                        .catch(error => console.log('error!'))
                                }}
                                values={this.state.heightValues}
                                min={30}
                                max={229}
                                text='Height (cm)'
                            />
                        </View>
                        <View style={{paddingVertical:15}}>
                            <CustomSlider
                                onValueChange={(values) => {
                                    this.setState({
                                        weightValues: values,
                                        page_number: 1
                                    }, () => this.callMyConnectionsListAPI(true))
                                    
                                    AsyncStorage.setItem('weightValues1', JSON.stringify(values))
                                        .then(json => console.log('success'))
                                        .catch(error => console.log('error!'))
                                }}
                                values={this.state.weightValues}
                                min={5}
                                max={145}
                                text='Weight (kg)'
                            />
                        </View>
                        <View style={{flexDirection:'row', paddingVertical:15}}>
                            <View style={{flex:1}}>
                                <Checkbox text='Slim' checked={bodyType.includes('530')} onPress={() => this._checkboxPressed('530', 'body', bodyType)}/>
                                <Checkbox text='Medium' checked={bodyType.includes('552')} onPress={() => this._checkboxPressed('552', 'body', bodyType)}/>
                            </View>
                            <View style={{flex:1}}>
                                <Checkbox text='Curvy' checked={bodyType.includes('532')} onPress={() => this._checkboxPressed('532', 'body', bodyType)}/>
                                <Checkbox text='Athletic' checked={bodyType.includes('534')} onPress={() => this._checkboxPressed('534', 'body', bodyType)}/>
                            </View>
                        </View>
                        <View style={{backgroundColor:'#000', height:1}}></View>
                        <View style={{flexDirection:'row', paddingVertical:15}}>
                            <View style={{flex:1}}>
                                <Checkbox text='Black' checked={ethnicityType.includes('457')} onPress={() => this._checkboxPressed('457', 'ethinic', ethnicityType)}/>
                                <Checkbox text='Asian' checked={ethnicityType.includes('459')} onPress={() => this._checkboxPressed('459', 'ethinic', ethnicityType)}/>
                                <Checkbox text='Middle Eastern' checked={ethnicityType.includes('466')} onPress={() => this._checkboxPressed('466', 'ethinic', ethnicityType)}/>
                                <Checkbox text='Pacific Islander' checked={ethnicityType.includes('467')} onPress={() => this._checkboxPressed('467', 'ethinic', ethnicityType)}/>
                                <Checkbox text='Other' checked={ethnicityType.includes('524')} onPress={() => this._checkboxPressed('524', 'ethinic', ethnicityType)}/>

                            </View>
                            <View style={{flex:1}}>
                                <Checkbox text='Latino' checked={ethnicityType.includes('464')} onPress={() => this._checkboxPressed('464', 'ethinic', ethnicityType)}/>
                                <Checkbox text='East India' checked={ethnicityType.includes('465')} onPress={() => this._checkboxPressed('465', 'ethinic', ethnicityType)}/>
                                <Checkbox text='American Indian' checked={ethnicityType.includes('469')} onPress={() => this._checkboxPressed('469', 'ethinic', ethnicityType)}/>
                                <Checkbox text='White' checked={ethnicityType.includes('523')} onPress={() => this._checkboxPressed('523', 'ethinic', ethnicityType)}/>
                            </View>
                        </View>
                    </View>
                )
            case 3:
                    return(
                        <View>
                            <View style={{flexDirection:'row', paddingVertical:15}}>
                                <View style={{flex:1}}>
                                    <Checkbox text='Single' checked={maritalType.includes('529')} onPress={() => this._checkboxPressed('529', 'marital', maritalType)}/>
                                    <Checkbox text='Widowed' checked={maritalType.includes('550')} onPress={() => this._checkboxPressed('550', 'marital', maritalType)}/>
                                    <Checkbox text='Divorced' checked={maritalType.includes('520')} onPress={() => this._checkboxPressed('520', 'marital', maritalType)}/>
                                </View>
                                <View style={{flex:1}}>
                                    <Checkbox text='Separated' checked={maritalType.includes('521')} onPress={() => this._checkboxPressed('521', 'marital', maritalType)}/>
                                    <Checkbox text='Married' checked={maritalType.includes('522')} onPress={() => this._checkboxPressed('522', 'marital', maritalType)}/>
                                    <Checkbox text='Open' checked={maritalType.includes('551')} onPress={() => this._checkboxPressed('551', 'marital', maritalType)}/>
                                </View>
                            </View>
                        </View>
                    )
            default:
                break;
        }
        return(
            <View>
                <Text></Text>
            </View>
        )
    }

    selectContact = async(invite_index) => {
        
        await selectContact()
        .then(async(selection) => {
            if (!selection) {
                this.setState({
                    selected_invite_index: -1
                })
                return null;
            }

            console.log(selection)

            this.setState({
                selected_invite_index: invite_index
            })
            
            if(selection.phones.length > 0) {
                for(i = 0; i < selection.phones.length; i ++) {
                    if(i == 0) {
                        selection.phones[i].selected = true;
                    } else {
                        selection.phones[i].selected = false;
                    }
                }
            }
            if(selection.emails.length > 0) {
                for(i = 0; i < selection.emails.length; i ++) {
                    if(i == 0) {
                        selection.emails[i].selected = true;
                    } else {
                        selection.emails[i].selected = false;
                    }
                }
            }
            if(selection.phones.length > 1 || selection.emails.length > 1) {
                this.setState({
                    selected_contact: selection,
                    showPhoneEmailSelectPopUp: true,
                })
            } else {
                var rowInvitation = this.state.rowInvitation;
                var contact_name = "";
                var contact_email = "";
                var contact_phoneNumber = "";
                if(selection.name) {
                    contact_name = selection.name;
                }
                if(selection.phones.length > 0) {
                    contact_phoneNumber = selection.phones[0].number;
                } 
                if(selection.emails.length > 0) {
                    contact_email = selection.emails[0].address;
                } 
                rowInvitation[invite_index].name = contact_name;
                rowInvitation[invite_index].email = contact_email;
                rowInvitation[invite_index].phoneNumber = contact_phoneNumber;
                this.setState({
                    rowInvitation: rowInvitation
                })
            }
            // this.renderPhoneEmailSelectPopUp();
        }); 
    }

    renderPhoneEmailSelectPopUp = () => {
        return (
            <View style={{ position:'absolute', width: '100%', height: '100%', top:0, left:0, zIndex: 10, justifyContent: 'flex-end', alignItems: 'center' }}>
                <View onStartShouldSetResponder = {() => this.setState({showPhoneEmailSelectPopUp: false})}
                    style={{position:'absolute', width: '100%', height: '100%', top:0, left:0, backgroundColor:Colors.black, opacity:0.3,}}/>
                <View style={{width: '95%', maxHeight: height-100, backgroundColor:Colors.white, alignItems:'center', paddingHorizontal:15, borderRadius:10, justifyContent:'center', marginBottom: 30,}}>
                    <TouchableOpacity style = {{position: 'absolute', top: 20, right: 20, width: 15, height: 15, zIndex: 20}} onPress = {() => this.setState({showPhoneEmailSelectPopUp: false})}>
                        <Image style = {{width: '100%', height: '100%', tintColor: Colors.gold}} source={require('../icons/connection-delete.png')}/>
                    </TouchableOpacity>
                    <Text style={[stylesGlobal.font, {fontSize:15,  textAlign:'center', marginTop: 30}]}>
                        Select Phone Number and Email
                    </Text>
                    <View style={{width: '90%', height:1, backgroundColor:Colors.gray, marginVertical:10}} />
                    <View style = {{width: '100%',}}>
                        <Text style={[stylesGlobal.font, {fontSize: 15, }]}>Name</Text>
                        <View style = {{width: '100%', alignItems: 'flex-end'}}>
                            <View style = {{width: '90%', flexDirection: 'row', alignItems: 'center'}}>
                                <Text style={[stylesGlobal.font, {fontSize: 14,  textAlign:'center', width: 60}]}>name</Text>
                                <Text style={[{paddingLeft:10, borderRadius:3, borderWidth:1, borderColor:Colors.gray, width:'70%', marginTop:10, paddingVertical:5, fontSize:12}, stylesGlobal.font]}>{this.state.selected_contact.name}</Text>
                                <View style = {{marginLeft: 10, width: 20, height: 20}}>
                                
                                </View>
                            </View>
                        </View>
                    </View>
                    <View style = {{width: '100%', marginTop: 10}}>
                        <Text style={[stylesGlobal.font, {fontSize: 15, }]}>Phone Number</Text>
                    {
                        this.state.selected_contact.phones.map((item, index) =>
                        <TouchableOpacity key = {index} style = {{width: '100%', alignItems: 'flex-end'}} onPress = {() => {
                                var selected_contact = this.state.selected_contact;
                                for(i = 0; i < selected_contact.phones.length; i ++) {
                                    if(i == index) {
                                        selected_contact.phones[i].selected = true;
                                    } else {
                                        selected_contact.phones[i].selected = false;
                                    }
                                }
                                this.setState({
                                    selected_contact: selected_contact
                                })
                            }}
                        >
                            <View style = {{width: '90%', flexDirection: 'row', alignItems: 'center'}}>
                                <Text style={[stylesGlobal.font, {fontSize: 14,  textAlign:'center', width: 60}]}>{item.type}</Text>
                                <PhoneInput
                                    disabled = {true}
                                    value = {item.number}
                                    style={{
                                        flex: 1,
                                        paddingLeft:10,
                                        borderRadius:3,
                                        borderWidth:1,
                                        borderColor:Colors.gray,
                                        marginTop:10,
                                        paddingVertical:5,
                                    }}
                                    flagStyle={{
                                        width:25,
                                        height:15
                                    }}
                                    textStyle={[stylesGlobal.font, {fontSize:12}]}
                                />
                                <View style = {{marginLeft: 10, width: 20, height: 20}}>
                                {
                                    item.selected &&
                                    <Image source={require('../icons/checked.png')} style={{width: '100%', height: '100%', resizeMode: 'contain'}}/>
                                }
                                </View>
                            </View>
                        </TouchableOpacity>
                        )
                    }
                    </View>
                    <View style = {{width: '100%', marginTop: 10}}>
                        <Text style={[stylesGlobal.font, {fontSize: 15, }]}>Email</Text>
                    {
                        this.state.selected_contact.emails.map((item, index) =>
                        <TouchableOpacity key = {index} style = {{width: '100%', alignItems: 'flex-end'}} onPress = {() => {
                                var selected_contact = this.state.selected_contact;
                                for(i = 0; i < selected_contact.emails.length; i ++) {
                                    if(i == index) {
                                        selected_contact.emails[i].selected = true;
                                    } else {
                                        selected_contact.emails[i].selected = false;
                                    }
                                }
                                this.setState({
                                    selected_contact: selected_contact
                                })
                            }}
                        >
                            <View style = {{width: '90%', flexDirection: 'row', alignItems: 'center'}}>
                                <Text style={[stylesGlobal.font, {fontSize: 14,  textAlign:'center', width: 60}]}>{item.type}</Text>
                                <Text style={[{paddingLeft:10, borderRadius:3, borderWidth:1, borderColor:Colors.gray, width:'70%', marginTop:10, paddingVertical:5, fontSize:12}, stylesGlobal.font]}>{item.address}</Text>
                                <View style = {{marginLeft: 10, width: 20, height: 20}}>
                                {
                                    item.selected &&
                                    <Image source={require('../icons/checked.png')} style={{width: '100%', height: '100%', resizeMode: 'contain'}}/>
                                }
                                </View>
                            </View>
                        </TouchableOpacity>
                        )
                    }
                    </View>
                    <View style={{width:'100%', height:1, backgroundColor:Colors.gold, marginVertical:10}} />
                    <TouchableOpacity style={[{paddingHorizontal:10, paddingVertical:10, backgroundColor:Colors.gold, borderRadius:3, marginBottom:20, width:'50%', alignItems:'center' }, stylesGlobal.shadow_style]}
                        onPress={() => {
                            if(this.state.selected_invite_index > -1) {
                                var rowInvitation = this.state.rowInvitation;
                                var selected_contact = this.state.selected_contact;
                                var contact_name = "";
                                var contact_email = "";
                                var contact_phoneNumber = "";
                                if(selected_contact.name) {
                                    contact_name = selected_contact.name;
                                }
                                for(i = 0; i < selected_contact.phones.length; i ++) {
                                    if(selected_contact.phones[i].selected) {
                                        contact_phoneNumber = selected_contact.phones[i].number;
                                        break;
                                    } 
                                }
                                for(i = 0; i < selected_contact.emails.length; i ++) {
                                    if(selected_contact.emails[i].selected) {
                                        contact_email = selected_contact.emails[i].address;
                                        break;
                                    } 
                                }
                                rowInvitation[this.state.selected_invite_index].name = contact_name;
                                rowInvitation[this.state.selected_invite_index].email = contact_email;
                                rowInvitation[this.state.selected_invite_index].phoneNumber = contact_phoneNumber;
                                this.setState({
                                    showPhoneEmailSelectPopUp: false, 
                                    rowInvitation: rowInvitation,
                                    selected_invite_index: -1
                                })
                            }
                            
                        }}
                    >
                        <Text style={[ stylesGlobal.font,{color:Colors.white, fontSize:12}]}>Select</Text>
                    </TouchableOpacity>
                </View>
            </View>
        )
    }

    renderInvitationPopUp = () => {
        var rowInvitation = this.state.rowInvitation;
        
        return (
            <View style={{ position:'absolute', width:width, height:height, top:0, left:0, zIndex: 10, alignItems: 'center' }}>
                <View
                    onStartShouldSetResponder={() => this.setState({showInvitationPopUp:false, rowInvitation: [{name:'', email:'', phoneNumber:'', selected_user_role_index: 0, selected_gender_index: 0}]})}
                    style={{position:'absolute', width:width, height:height, top:0, left:0, backgroundColor:Colors.black, opacity:0.3,}}/>
                <View style={{width: '95%', maxHeight: height-100, backgroundColor:Colors.white, alignItems:'center', paddingHorizontal:15, borderRadius:10, justifyContent:'center'}}>
                    <TouchableOpacity style = {{position: 'absolute', top: 20, right: 20, width: 15, height: 15, zIndex: 20}} onPress = {() => this.setState({showInvitationPopUp: false, rowInvitation: [{name:'', email:'', phoneNumber:'', selected_user_role_index: 0, selected_gender_index: 0}]})}>
                        <Image style = {{width: '100%', height: '100%', tintColor: Colors.gold}} source={require('../icons/connection-delete.png')}/>
                    </TouchableOpacity>
                    
                    <KeyboardAwareScrollView keyboardShouldPersistTaps = "handled" style = {{width: '100%'}} contentContainerStyle={{ alignItems:'center', }} extraScrollHeight={this.state.rowInvitation.length * 95 + 150 - height + 180}>
                        <View style = {{width: '100%', alignItems: 'center'}}>
                            <Image style={{width: 30, height:30, marginTop: 15, resizeMode:'contain'}} source={require('../icons/crown.png')}/>
                            <Text style={[stylesGlobal.invite_view_header_text, stylesGlobal.font]}>{Constants.INVITE_FRIEND_VIEW_HEADER}</Text>
                            <TouchableOpacity style = {[stylesGlobal.invite_view_submit_button, stylesGlobal.shadow_style]} onPress={() => this.selectContact(0)}>
                                <Text style = {[stylesGlobal.invite_view_submit_button_text, stylesGlobal.font]}>{"Import From Contacts"}</Text>
                            </TouchableOpacity>
                            <View style={{width:'100%', height:1, backgroundColor:Colors.gray, marginTop:20}} />
                            {this.renderInviteRows()}
                            
                            <View style = {{width: '100%', alignItems: 'center', justifyContent: 'center', borderTopColor: Colors.gray, borderTopWidth: 1}}>
                                <TouchableOpacity style={{flexDirection: 'row', alignItems: 'center', marginTop: 10}}
                                    onPress={() => {
                                        // this.selectContact();
                                        rowInvitation.push({name:'', email:'', phoneNumber:'', selected_user_role_index: 0, selected_gender_index: 0});
                                        this.setState({rowInvitation});
                                    }}
                                >
                                    <Image style = {{width: 20, height: 20, resizeMode: 'contain', tintColor: Colors.gold, marginRight: 15,}} source={require("../icons/connection-add.png")}/>
                                    <Text style={[ stylesGlobal.font, {color: Colors.black, fontSize: 12}]}>ADD ANOTHER REFERRAL</Text>
                                </TouchableOpacity>
                            </View>

                            <View style={{width:'100%', height:1, backgroundColor:Colors.gold, marginVertical:10}} />
                            
                            <TouchableOpacity style={[{paddingHorizontal:10, paddingVertical:10, backgroundColor:Colors.gold, borderRadius:3, marginBottom:20, width:'70%', alignItems:'center'}, stylesGlobal.shadow_style]}
                                onPress={() => {
                                    this.callInviteNoneMemberAPI();
                                    this.setState({showInvitationPopUp: false, rowInvitation:[{name: '', email: '', phoneNumber: '', selected_user_role_index: 0, selected_gender_index: 0}]})
                                }}
                            >
                                <Text style={[ stylesGlobal.font,{color:Colors.white, fontSize:12}]}>Invite your friends</Text>
                            </TouchableOpacity>
                        </View>
                    </KeyboardAwareScrollView>
                </View>
            </View>
        )
    }

    // render rows for invitation none members
    renderInviteRows = () => {
       
        let p = [];
        const {rowInvitation} = this.state;
        for (let index = rowInvitation.length - 1; index >= 0; index--) {
            const element = rowInvitation[index];
            console.log(";;;;;;;;" + this.state.rowInvitation[index].selected_user_role_index);
            p.push(
                <View key={index} style={{flexDirection: 'row', width: '100%', marginBottom: 20, justifyContent: 'center'}}>
                    <View style={{width: '100%', alignItems:'center', justifyContent: 'center',}}>
                        <View style={{width: '100%', alignItems: 'center', justifyContent: 'space-around', flexDirection: 'row'}}>
                            <View style = {{width: '50%', }}>
                                <Text style = {[{fontSize: 12, color: Colors.black}, stylesGlobal.font]}>Name</Text>
                                <View style = {{width: '100%', height: 30, flexDirection: 'row', alignItems: 'center', borderRadius: 3, borderWidth: 0.5, borderColor: Colors.gray,}}>
                                    <TextInput
                                        placeholder='Friend Name'
                                        value={element.name}
                                        style={[{
                                            flex: 1,
                                            paddingLeft: 10,
                                            paddingVertical: 5,
                                            fontSize: 12
                                        }, stylesGlobal.font]}
                                        onChangeText={text => {
                                            rowInvitation[index].name = text;
                                            this.setState({rowInvitation})
                                        }}
                                    />
                                    <TouchableOpacity style = {{height: '100%', aspectRatio: 1, marginLeft: 10}} onPress={() => { this.selectContact(index); }}>
                                        <Image style = {{width: '90%', height: '90%'}} source = {require("../icons/select_from_contact.jpg")}></Image>
                                    </TouchableOpacity>
                                </View>
                            </View>
                            <View style = {{width: '45%', }}>
                                <Text style = {[{fontSize: 12, color: Colors.black}, stylesGlobal.font]}>Email Address</Text>
                                <TextInput
                                    placeholder='Email'
                                    value={element.email}
                                    style={[{
                                        paddingLeft: 10,
                                        borderRadius: 3,
                                        borderWidth: 1,
                                        borderColor: Colors.gray,
                                        width: '100%', 
                                        height: 30,
                                        paddingVertical: 5,
                                        fontSize: 12
                                    }, stylesGlobal.font]}
                                    onChangeText={text => {
                                        rowInvitation[index].email = text;
                                        this.setState({rowInvitation})
                                    }}
                                />
                            </View>
                        </View>
                        <View style={{width: '100%', alignItems: 'center', justifyContent: 'space-around', flexDirection: 'row',  marginTop:10,}}>
                            <View style = {{flex: 1 }}>
                                <Text style = {[{fontSize: 12, color: Colors.black}, stylesGlobal.font]}>Phone Number</Text>
                                <PhoneInput
                                    ref='phone'
                                    value = {element.phoneNumber}
                                    onChangePhoneNumber={text => {
                                        rowInvitation[index].phoneNumber = text;
                                        this.setState({rowInvitation})
                                    }}
                                    onSelectCountry={(country)=> {
                                        console.log(country)
                                    }}
                                    style={{
                                        paddingLeft: 10,
                                        borderRadius: 3,
                                        borderWidth: 1,
                                        borderColor: Colors.gray,
                                        width: '100%', 
                                        height: 30,
                                        paddingVertical: 5,
                                    }}
                                    flagStyle={{
                                        width: 25,
                                        height: 15
                                    }}
                                    textStyle={[stylesGlobal.font, {fontSize: 12}]}
                                />
                            </View>
                            <View style = {{width: 80, marginLeft: 10 }}>
                                <Text style = {[{fontSize: 12, color: Colors.black}, stylesGlobal.font]}>Member Type</Text>
                                <ModalDropdown 
                                    style = {{width: '100%', height: 30, borderRadius: 3, borderWidth: 1, borderColor:Colors.gray,}}
                                    dropdownStyle = {{width: 160, height: 30 * this.state.user_role.length}}
                                    defaultIndex = {0}
                                    options = {this.state.user_role}
                                    onSelect = {(member_type_index) => {
                                        rowInvitation[index].selected_user_role_index = member_type_index;
                                        this.setState({rowInvitation})
                                    }}
                                    renderButton = {() => {

                                        return (
                                                    <View style={[{ width: '100%', height: 30, resizeMode: 'cover', alignItems: 'center', flexDirection: 'row', paddingHorizontal: 2, paddingVertical: 2, justifyContent: 'center'}]}>
                                                        <Image style={{ width: '100%', height: '100%', position: 'absolute', borderRadius: 5 }} source={{ uri: member_type_item.background }}></Image>
                                                        <View style={{width: '100%', height: '100%', flexDirection: 'row', alignItems: 'center'}}>
                                                            <View style={{ height: '100%', aspectRatio: 1, marginRight: 10 }}>
                                                                <Image style={{ width: '100%', height: '100%' }} source={{ uri: member_type_item.badge }}></Image>
                                                            </View>
                                                            <Text style={[{ fontSize: 12, color: Colors.white }, stylesGlobal.font]}>{member_type_item.name}</Text>
                                                        </View>
                                                        
                                                    </View>
                                                )  
                                        // return (
                                        //     <View style = {[{width: '100%', height: '100%', resizeMode: 'cover', alignItems: 'center', flexDirection: 'row',}]}>
                                        //         <View style = {{height: '100%', aspectRatio: 1, marginRight: 5}}>
                                        //             <Image style = {{width: '100%', height: '100%'}} source = {this.state.user_role[this.state.rowInvitation[index].selected_user_role_index].badge}></Image>
                                        //         </View>
                                        //         {/* <Text style = {[{fontSize: 10, color: Colors.black}, stylesGlobal.font]}>{this.state.user_role[this.state.rowInvitation[index].selected_user_role_index].name}</Text> */}
                                        //     </View>
                                        // )
                                    }}
                                    renderRow = {(member_type_item, member_type_index, highlighted) => {
                                        // return (
                                        //     <View style = {[{width: '100%', height: 30, resizeMode: 'cover', alignItems: 'center', flexDirection: 'row', marginHorizontal: 10}]}>
                                        //         <View style = {{height: '100%', aspectRatio: 1, marginRight: 10}}>
                                        //             <Image style = {{width: '100%', height: '100%'}} source = {member_type_item.badge}></Image>
                                        //         </View>
                                        //         <Text style = {[{fontSize: 12, color: Colors.black}, stylesGlobal.font]}>{member_type_item.name}</Text>
                                        //     </View>
                                        // )
                                        return (
                                                <View style={[{ width: '100%', height: 30, resizeMode: 'cover', alignItems: 'center', flexDirection: 'row', paddingHorizontal: 2, paddingVertical: 2, justifyContent: 'center'}]}>
                                                    <Image style={{ width: '100%', height: '100%', position: 'absolute', borderRadius: 5 }} source={{ uri: member_type_item.background }}></Image>
                                                    <View style={{width: '100%', height: '100%', flexDirection: 'row', alignItems: 'center'}}>
                                                        <View style={{ height: '100%', aspectRatio: 1, marginRight: 10 }}>
                                                            <Image style={{ width: '100%', height: '100%' }} source={{ uri: member_type_item.badge }}></Image>
                                                        </View>
                                                        <Text style={[{ fontSize: 12, color: Colors.white }, stylesGlobal.font]}>{member_type_item.name}</Text>
                                                    </View>
                                                    
                                                </View>
                                            )
                                    }}
                                />
                            </View>
                            <View style = {{width: 50, marginLeft: 10 }}>
                                <Text style = {[{fontSize: 12, color: Colors.black}, stylesGlobal.font]}>Gender</Text>
                                <ModalDropdown 
                                    style = {{width: '100%', height: 30, borderRadius: 3, borderWidth: 1, borderColor:Colors.gray,}}
                                    dropdownStyle = {{width: 100, height: 60}}
                                    defaultIndex = {0}
                                    options = {this.state.user_gender}
                                    onSelect = {(gender_index) => {
                                        rowInvitation[index].selected_gender_index = gender_index;
                                        this.setState({rowInvitation})
                                    }}
                                    renderButton = {() => {
                                        return (
                                            <View style = {[{width: '100%', height: '100%', resizeMode: 'cover', alignItems: 'center', flexDirection: 'row',}]}>
                                                <View style = {{height: '100%', aspectRatio: 1, marginRight: 5, justifyContent: 'center', alignItems: 'center'}}>
                                                    <Image style = {{width: '60%', height: '60%', resizeMode: 'contain'}} source = {this.state.user_gender[this.state.rowInvitation[index].selected_gender_index].image}></Image>
                                                </View>
                                                {/* <Text style = {[{fontSize: 10, color: Colors.black}, stylesGlobal.font]}>{this.state.user_gender[this.state.rowInvitation[index].selected_gender_index].type}</Text> */}
                                            </View>
                                        )
                                    }}
                                    renderRow = {(gender_type_item, gender_index, highlighted) => {
                                        return (
                                            <View style = {[{width: '100%', height: 30, resizeMode: 'cover', alignItems: 'center', flexDirection: 'row', marginHorizontal: 10}]}>
                                                <View style = {{height: '100%', aspectRatio: 1, marginRight: 10, justifyContent: 'center', alignItems: 'center'}}>
                                                    <Image style = {{width: '60%', height: '60%', resizeMode: 'contain'}} source = {gender_type_item.image}></Image>
                                                </View>
                                                <Text style = {[{fontSize: 12, color: Colors.black}, stylesGlobal.font]}>{gender_type_item.type}</Text>
                                            </View>
                                        )
                                    }}
                                />
                            </View>
                        </View>
                    </View>
                </View>
            )
        }
        return p;
        
    }

    calNetworth = (index) => {
        switch (index) {
            case 0:
                return 'N/A'
                break;
            case 1:
                return '>$30M'
                break;
            case 2:
                return '>$100M'
                break;
            case 3:
                return '>$500M'
                break;
            case 4:
                return '>$1B'
                break
            default:
                break;
            return ''
        }
    }

    _updateSection = activeSections => {
        this.setState({activeSections})
    }
    /**
           * display connection list
           */
    


    findIndexToDelete=data=>{
        for (var i = 0; i < this.state.selectedContactList.length; i ++) {
            if (this.state.selectedContactList[i].key == data.id) {
                return i;
            }
        }
        return -1;
    }
    /**
            * item click
            */
    onItemPress = (data) => {
        // console.warn("onItemPress called")
        this.state.dataConnections.map((item) => {
            if (item.id === data.id) {
                item.check = !item.check
                if (item.check === true) {
                    let newItem={
                        key: data.id,
                        userImage: data.imgpath + Constants.THUMB_FOLDER + data.filename,
                        name: data.first_name + " " + data.last_name
                    }
                    this.state.selectedContactList.push(newItem);
                } else if (item.check === false) {
                    let i = this.findIndexToDelete(data);
                    if (i != -1) {
                        this.state.selectedContactList.splice(i, 1)
                    }
                }
            }
        })
        this.setState({ 
            selectedContactList: this.state.selectedContactList 
        })
        
    }

    invite_user = (data) => {
        this.setState({
            selected_invite_user: data
        }, () => {
            this.setState({ loading: true });
            let uri = Memory().env == "LIVE" ? Global.URL_SEND_EVENT_INVITATION: Global.URL_SEND_EVENT_INVITATION_DEV;
            let params = new FormData();
            params.append("token", this.state.userToken);
            params.append("user_id", this.state.userId);
            params.append("format", "json");
            params.append("event_id", this.state.eventId);
            params.append("host_id", this.state.hostId); // used for guest invite 
            if(this.state.selected_invite_user == null) {
                    for (var i = 0; i < this.state.selectedContactList.length; i++) {
                            params.append("data[" + i + "]", this.state.selectedContactList[i].key);
                    }
            } else {
                    params.append("data[0]", this.state.selected_invite_user.id);
            }
            
            console.log(TAG + " callSendInvitationAPI uri " + uri);
            console.log(TAG + " callSendInvitationAPI params " + JSON.stringify(params));

            WebService.callServicePost(
                    uri,
                    params,
                    this.handleSendInvitationResponse
            );
        })
    }

    deleteSelected=(i,key)=>{
        this.state.dataConnections.map((item) => {
           if(item.id === key) {
            item.check = !item.check
           }
        })
        this.state.selectedContactList.splice(i, 1)
        this.setState({ 
            selectedContactList: this.state.selectedContactList 
        })
    }


    updateRecentChatList = (isRefresh) => {
        if (isRefresh) {
        }
    };

}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: "100%",
        height: "100%",
        backgroundColor: Colors.black
    },
    emptyView: {
        flex: 1,
        width: "100%",
        height: "100%",
        alignItems: "center",
        justifyContent: "center",
    },
    cardView: {
        width: width * 0.80,
        backgroundColor: Colors.white,
        margin: 12,
        borderRadius: 10,
        paddingTop:5,paddingBottom:20,paddingHorizontal:10,
        shadowColor: Colors.white,
        shadowOffset: {
            width: 0,
            height: 0
        },
        shadowRadius: 7,
        shadowOpacity: 7.0
    },
});

