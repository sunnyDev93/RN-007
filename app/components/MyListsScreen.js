import React, { Component } from "react";
import {
    Alert,
    Platform,
    StyleSheet,
    SafeAreaView,
    View,
    TouchableOpacity,
    Image,
    TextInput,
    Keyboard,
    ScrollView,
    Text,
    Dimensions,
    FlatList
} from "react-native";

import { ImageCompressor } from './ImageCompressorClass'
import { Colors } from "../consts/Colors";
import RowConnection from "./RowConnection";
import { Constants } from "../consts/Constants";
import { stylesGlobal, STICKY_HEADER_HEIGHT } from '../consts/StyleSheet';
import Memory from "../core/Memory";
import * as Global from "../consts/Global";
import WebService from "../core/WebService";
import ProgressIndicator from "./ProgressIndicator";
import PullDownIndicator from "./PullDownIndicator";
import Moment from "moment/moment";
import AsyncStorage from '@react-native-community/async-storage';
import InviteUserToEventView from "../customview/InviteUserToEventView";
import {getEventsForInvite, callInviteUserToEvent, callFavoriteMember, callFollowRequest} from "../utils/Util";

var {height, width} = Dimensions.get('window');

var TAG = "MyListsScreen";

export default class MyListsScreen extends React.Component {

    constructor(props) {

        super(props)

        this.state = {
            overlayview_height: 250,
            userId: "",
            userToken: "",
            userSlug: "",
            userImagePath: "",
            userImageName: "",
            showModel: false,
            member_plan: '',
            is_verified: '0',

            searchText: '',

            get_my_list_first_time: true,

            connection_category_list: [],
            member_list: [],
            left_menu_clicked: true,
            total_length: 0,
            viewall_page_number: 0,
            perpage_count: 10,
            selected_member: null, // use for favorite and remove action
            selected_category_item: null,  /*************
                                            selected_category_item.id == -1: Fan, 
                                            selected_category_item.id == -2: My Favorite, selected_category_item.id == -3: Favorited me
                                            selected_category_item.id == -4: Rose Sent, selected_category_item.id == -8: Rose Received, 
                                            selected_category_item.id == -5: Gift sent, selected_category_item.id == -6: Gift Received, selected_category_item.id == -7: Gift Purchased, 
                                            selected_category_item.id == -9: visited my profile
                                            selected_category_item.id == -10: My Wish List
                                             **********/
            selected_list_header_text: "",

            new_list_category_name: "",
            updated_name: "",

            member_search_list: [],
            member_search_text: '',
            membersearchlist_page_number: 1,
            membersearchlist_perpage_count: 10,
            member_search_more_load: true,

            add_connectionlist_view: false,
            add_member_to_connectionlist_view: false,
            update_connectionlistname_view: false,
            delete_connectionlist_view: false,

            invite_guest: false, // use when invite guest from import from my list
            eventId: 0, // use when invite guest
            inviteList: [], // use when invite guest, invited guests list from guest list screen
            selectedContactList: [], // use when invite guest
            selected_invite_user: null, // use when invite guest
            selected_invite_list: [], // use for showing invite list on top

            invite_event_list: [], // invite user to event
            invite_event_view: false,

            screen_height: Dimensions.get('screen').height,
            is_portrait: true,
        }

        this.onEndReachedCalledDuringMomentum = true;

    }

    UNSAFE_componentWillMount = async() => {
        this.getData();
       
        if(this.props.invite_guest == true) {
            this.setState({
                invite_guest: true,
                eventId: this.props.eventId,
                inviteList: this.props.inviteList
            })
        } else {
            this.setState({
                invite_guest: false,
                eventId: 0,
                inviteList: []
            })
        }

        if(Dimensions.get("window").width < Dimensions.get("window").height) {
            this.setState({
                is_portrait: true,
                screen_height: Dimensions.get("window").height,
                left_menu_clicked: true,
            })
        } else {
            this.setState({
                is_portrait: false,
                screen_height: Dimensions.get("window").width,
                left_menu_clicked: false,
            })
        }

        Dimensions.addEventListener("change", () => {
            if(Dimensions.get("window").width < Dimensions.get("window").height) {
                this.setState({
                    is_portrait: true,
                    screen_height: Dimensions.get("window").height
                })
            } else {
                this.setState({
                    is_portrait: false,
                    screen_height: Dimensions.get("window").width
                })
            }
        })
        
    }

    componentWillUnmount() {
        Dimensions.removeEventListener('change');
    }

    /**
       * get async storage data
       */
    getData = async () => {
        try {

            var userId = await AsyncStorage.getItem(Constants.KEY_USER_ID);
            var userToken = await AsyncStorage.getItem(Constants.KEY_USER_TOKEN);
            var userSlug = await AsyncStorage.getItem(Constants.KEY_USER_SLUG);
            var userFirstName = await AsyncStorage.getItem(Constants.KEY_USER_FIRST_NAME);
            var userLastName = await AsyncStorage.getItem(Constants.KEY_USER_LAST_NAME);
            var userImagePath = await AsyncStorage.getItem(Constants.KEY_USER_IMAGE_URL);
            var userImageName = await AsyncStorage.getItem(Constants.KEY_USER_IMAGE_NAME);
            var member_plan = await AsyncStorage.getItem(Constants.KEY_MEMBER_PLAN);
            var is_verified = await AsyncStorage.getItem(Constants.KEY_IS_VERIFIED);
            this.setState({
                userId: userId,
                userToken: userToken,
                userSlug: userSlug,
                userImagePath: userImagePath,
                userImageName: userImageName,
                showModel: false,
                member_plan: member_plan,
                is_verified: is_verified,
                selected_list_header_text: "Friend List",
            }, () => { this.getMyList(true); });
        } catch (error) {
            // Error retrieving data
        }

    };

    getMyList() {
        try {
            this.setState({
                loading: true,
                more_load: false,
                total_length: 0
            });
            let uri = Memory().env == "LIVE" ? Global.URL_GET_LISTS_CATEGORY_MEMBERS : Global.URL_GET_LISTS_CATEGORY_MEMBERS_DEV;
            let params = new FormData();
            params.append("token", this.state.userToken);
            params.append("user_id", this.state.userId);
            params.append("format", "json");
            params.append("page", this.state.viewall_page_number);
                                    
            console.log(TAG + " callGetMyListAPI uri " + uri);
            console.log(TAG + " callGetMyListAPI params " + JSON.stringify(params));

            WebService.callServicePost(uri, params, this.handleGetMyListAPI);
        } catch (error) {
            console.log(TAG + " callGetMyListAPI error " + error);
            this.setState({
                loading: false,
            });
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    }

    handleGetMyListAPI = (response, isError) => {
        console.log(TAG + " callGetMyListAPI Response " + JSON.stringify(response));
        console.log(TAG + " callGetMyListAPI isError " + isError);
        if (!isError) {
            var result = response;
            if (result != undefined && result != null) {
                if(result.status == "success") {
                    if(result.data != null ) {
                        for(i = 0; i < result.data.group.length; i ++) {
                            result.data.group[i].page_number = 0;
                            result.data.group[i].selected = false;
                        }
                        this.setState({
                            connection_category_list: result.data.group,
                            member_list: [],
                            viewall_page_number: 0,
                            get_my_list_first_time: false
                        })

                        if( result.data.group && result.data.group.length > 0)
                        {

                            result.data.group[0].selected = true;

                            this.setState({
                                selected_category_item: result.data.group[0],
                            }, () => this.show_members_list());
                        }else {
                            this.setState({
                                loading: false,
                                more_load: false,
                                total_length: 0
                            });
                        }
                        
                        // if(result.data.member.length == 0) {
                        //     this.setState({
                        //         more_load: false,
                        //         total_length: result.data.total,
                        //         loading: false,
                        //         connection_category_list: result.data.group,
                        //     })
                        //     if(result.data.group == null || result.data.group.length == 0) {
                        //         this.setState({
                        //             selected_category_item: null
                        //         })
                        //     } else {
                        //         this.setState({
                        //             selected_category_item: result.data.group[0]
                        //         })
                        //     }
                        // } else {
                        //     if(this.state.get_my_list_first_time) {
                        //         this.setState({
                        //             connection_category_list: result.data.group,
                        //             member_list: [],
                        //             viewall_page_number: 0,
                        //             get_my_list_first_time: false
                        //         })
                        //         result.data.group[0].selected = true;
                        //         this.setState({
                        //             selected_category_item: result.data.group[0],
                        //         }, () => this.show_members_list())
                        //     } else {
                        //         for(i = 0; i < result.data.member.length; i ++) {
                        //             result.data.member[i].selected = true;
                        //             result.data.member[i].invited = false;
                        //             for(j = 0; j < this.state.inviteList.length; j ++) {
                        //                 if(result.data.member[i].id == this.state.inviteList[j].id) {
                        //                     result.data.member[i].invited = true;
                        //                     break;
                        //                 }
                        //             }
                        //         }
                        //         if(this.state.invite_guest) {
                        //             var selected_invite_list = this.state.selected_invite_list;
                        //             for(i = 0; i < result.data.member.length; i ++) {
                        //                 if(result.data.member[i].invited == false) {
                        //                     selected_invite_list.push({
                        //                         id: result.data.member[i].id,
                        //                         userImage: result.data.member[i].imgpath + Constants.THUMB_FOLDER + result.data.member[i].filename,
                        //                         name: result.data.member[i].first_name + " " + result.data.member[i].last_name
                        //                     });
                        //                 }
                        //             }
                        //             this.setState({
                        //                 selected_invite_list: selected_invite_list,
                        //                 left_menu_clicked: false,
                        //             })
                        //         }
                        //         this.setState({
                        //             more_load: true,
                        //             viewall_page_number: this.state.viewall_page_number + 1,
                        //             connection_category_list: result.data.group,
                        //             member_list: [...this.state.member_list, ...result.data.member],
                        //             total_length: result.data.total,
                        //             loading: false,
                        //         })
                        //     }
                        // }
                    }
                }    
            }
        } else {
            this.setState({
                loading: false,
            });
            if (response != undefined && response != null && response.length > 0) {
                Alert.alert(response.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    }

    isCloseToBottom = ({layoutMeasurement, contentOffset, contentSize}) => {
        const paddingToBottom = 10;
        return layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;
    };

    isCloseToTop = ({layoutMeasurement, contentOffset, contentSize}) => {
        const paddingToBottom = 10;
        return contentOffset.y <= -10
    };

    viewall_members = () => {
        if(this.state.selected_category_item == null) {
            this.setState({
                left_menu_clicked: false,
            })
        } else {
            this.setState({
                viewall_page_number: 0,
                member_list: [],
                left_menu_clicked: false,
                selected_category_item: null
            }, () => this.getMyList())
        }
    }

    show_members_list = () => {
        try {

            this.setState({
                loading: true,
                more_load: false,
                total_length: 0
            });
            let uri = Memory().env == "LIVE" ? Global.URL_GET_LISTS_CATEGORY_MEMBERS + this.state.selected_category_item.id : Global.URL_GET_LISTS_CATEGORY_MEMBERS_DEV + this.state.selected_category_item.id;
            let params = new FormData();
            params.append("token", this.state.userToken);
            params.append("user_id", this.state.userId);
            params.append("format", "json");
            params.append("page", this.state.selected_category_item.page_number);
            params.append("perPage", this.state.perpage_count);                                    
            console.log(TAG + " callShowMemberListAPI uri " + uri);
            console.log(TAG + " callShowMemberListAPI params " + JSON.stringify(params));
            WebService.callServicePost(uri, params, this.handleShowMemberListAPI);
        } catch (error) {
            console.log(TAG + " callShowMemberListAPI error " + error);
            this.setState({
                loading: false,
            });
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    }

    handleShowMemberListAPI = (response, isError) => {
        // console.log(TAG + " callShowMemberListAPI Response " + JSON.stringify(response));
        console.log(TAG + " callShowMemberListAPI isError " + isError);
        if (!isError) {
            var result = response;
            if (result != undefined && result != null) {
                if(result.status == "success") {
                    if(result.data != null) {
                        if(result.data.member.length == 0) {
                            this.setState({ more_load: false });
                        } else {
                            var selected_category_item = this.state.selected_category_item;
                            selected_category_item.page_number = selected_category_item.page_number + 1;
                            this.setState({
                                more_load: true,
                                selected_category_item: selected_category_item,
                            })
                        }
                        for(i = 0; i < result.data.member.length; i ++) {
                            result.data.member[i].selected = false;
                            result.data.member[i].invited = false;
                            for(j = 0; j < this.state.inviteList.length; j ++) {
                                if(result.data.member[i].id == this.state.inviteList[j].id) {
                                    result.data.member[i].invited = true;
                                    break;
                                }
                            }
                            for(j = 0; j < this.state.selected_invite_list.length; j ++) {
                                if(result.data.member[i].id == this.state.selected_invite_list[j].id) {
                                    result.data.member[i].selected = true;
                                    break;
                                }
                            }
                        }
                        // if(this.state.invite_guest) {
                        //     var selected_invite_list = this.state.selected_invite_list;
                        //     for(i = 0; i < result.data.member.length; i ++) {
                        //         if(result.data.member[i].invited == false) {
                        //             selected_invite_list.push({
                        //                 id: result.data.member[i].id,
                        //                 userImage: result.data.member[i].imgpath + Constants.THUMB_FOLDER + result.data.member[i].filename,
                        //                 name: result.data.member[i].first_name + " " + result.data.member[i].last_name
                        //             });
                        //         }
                        //     }
                        //     this.setState({
                        //         selected_invite_list: selected_invite_list
                        //     })
                        // }
                        this.setState({
                            member_list: [...this.state.member_list, ...result.data.member],
                            total_length: result.data.total,
                        })
                    }
                }    
            }
        } else {
            if (response != undefined && response != null && response.length > 0) {
                Alert.alert(response.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
        this.setState({ loading: false });
    }

    search_person = () => {
       
        try {
            this.setState({
                loading: true,
            });

            let uri = Memory().env == "LIVE" ? Global.URL_MYLIST_MEMBER_SEARCH : Global.URL_MYLIST_MEMBER_SEARCH_DEV;
            let params = new FormData();
            params.append("token", this.state.userToken);
            params.append("user_id", this.state.userId);
            params.append("format", "json");
            var data = {
                keyword: this.state.member_search_text,
                page: this.state.membersearchlist_page_number
                // recordPerPage: this.state.membersearchlist_perpage_count
            }
            params.append("data", JSON.stringify(data));                                    
            console.log(TAG + " callSearchPersonAPI uri " + uri);
            console.log(TAG + " callSearchPersonAPI params " + JSON.stringify(params));
            WebService.callServicePost(uri, params, this.handleSearchPersonRresponse);
        } catch (error) {
            console.log(TAG + " callSearchPersonAPI error " + error);
            this.setState({ loading: false });
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    }

    handleSearchPersonRresponse = (response, isError) => {
        // console.log(TAG + " callSearchPersonAPI Response " + JSON.stringify(response));
        console.log(TAG + " callSearchPersonAPI isError " + isError);
        if (!isError) {
            if(response.status == "success") {
                if(response.data.result != null) {
                    if(response.data.result.length == 0) {
                        this.setState({
                            member_search_more_load: false
                        })
                    } else {
                        var group_id_str = ""
                        for(i = 0; i < response.data.result.length; i ++) {
                            response.data.result[i].profile_image = response.data.result[i].imgpath + Constants.THUMB_FOLDER + response.data.result[i].filename;
                            response.data.result[i].selected = false;
                            response.data.result[i].exist_in_current_group = false;
                            if(response.data.result[i].group_id != null) {
                                console.log(response.data.result[i].group_id + "     " + this.state.selected_category_item.id)
                                group_id_str = response.data.result[i].group_id;
                                if(group_id_str.includes(this.state.selected_category_item.id) > 0) {
                                    response.data.result[i].exist_in_current_group = true;
                                }
                            } 
                        }
                        this.setState({
                            member_search_list: [...this.state.member_search_list, ...response.data.result],
                            member_search_more_load: true,
                            membersearchlist_page_number: this.state.membersearchlist_page_number + 1
                        })
                    }
                    
                } else {
                    this.setState({
                        member_search_more_load: false
                    })
                }
            } else {
                Alert.alert(response.msg.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
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

    add_list_category = () => {
        if(this.state.new_list_category_name == "") {
            Alert.alert(Constants.EMPTY_LISTNAME, "");
            return;
        }
        // if(this.state.member_search_list.length == 0) {
        //     Alert.alert(Constants.EMPTY_MEMBERLIST, '');
        //     return;
        // }
        try {
            this.setState({ loading: true });
            let uri = Memory().env == "LIVE" ? Global.URL_MYLIST_ADD_LIST_MEMBER_SEARCH : Global.URL_MYLIST_ADD_LIST_MEMBER_SEARCH_DEV;
            let params = new FormData();
            params.append("token", this.state.userToken);
            params.append("user_id", this.state.userId);
            params.append("format", "json");
            // params.append("group_id", this.state.selected_category_item.id);
            params.append("group_name", this.state.new_list_category_name);
            var users = [];
            var total_length = 0;
            for(i = 0; i < this.state.member_search_list.length; i ++) {
                if(this.state.member_search_list[i].selected) {
                    users.push(this.state.member_search_list[i].user_id);
                    total_length ++;
                }
            }
            this.setState({ total_length: total_length });
            params.append("users", JSON.stringify(users));                                    
            console.log(TAG + " callAddCategoryAPI uri " + uri);
            console.log(TAG + " callAddCategoryAPI params " + JSON.stringify(params));
            WebService.callServicePost(uri, params, this.handleAddCategoryRresponse);
        } catch (error) {
            console.log(TAG + " callAddCategoryAPI error " + error);
            this.setState({ loading: false });
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    }

    handleAddCategoryRresponse = (response, isError) => {
        // console.log(TAG + " callAddCategoryAPI Response " + JSON.stringify(response));
        console.log(TAG + " callAddCategoryAPI isError " + isError);
        if (!isError) {
            if(response.status == "success") {
                if(response.data.group != null) {
                    response.data.group.page_number = 0;
                    response.data.group.selected = true;
                    var connection_category_list = this.state.connection_category_list;
                    for(i = 0; i < connection_category_list.length; i ++) {
                        connection_category_list[i].selected = false;
                    }                    
                    connection_category_list.push(response.data.group);
                    if ( response.data.users == undefined || response.data.users == null ) {
                        this.setState({member_search_list: []});
                    } else {
                        this.setState({member_search_list: response.data.users});
                    }
                    this.setState({
                        connection_category_list: connection_category_list,
                        selected_category_item: response.data.group,
                        member_list: [],
                        left_menu_clicked: false,
                        new_list_category_name: '',
                        member_search_text: '',
                        member_search_more_load: true,
                        membersearchlist_page_number: 1,
                        add_connectionlist_view: false,
                        more_load: false
                    });
                } else {
                    this.setState({
                        left_menu_clicked: false,
                        new_list_category_name: '',
                        member_search_list: [],
                        member_search_text: '',
                        member_search_more_load: true,
                        membersearchlist_page_number: 1,
                        add_connectionlist_view: false
                    });
                }
            } else {
                Alert.alert(response.msg.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        } else {
            if (response != undefined && response != null && response.length > 0) {
                Alert.alert(response.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
        this.setState({ loading: false });
    };

    add_member_to_category = () => {
        try {
            this.setState({ loading: true });
            let uri = Memory().env == "LIVE" ? Global.URL_MYLIST_ADD_LIST_MEMBER_SEARCH : Global.URL_MYLIST_ADD_LIST_MEMBER_SEARCH_DEV;
            let params = new FormData();
            params.append("token", this.state.userToken);
            params.append("user_id", this.state.userId);
            params.append("format", "json");
            params.append("group_id", this.state.selected_category_item.id);
            params.append("group_name", this.state.selected_category_item.group_name);
            var users = [];
            for(i = 0; i < this.state.member_search_list.length; i ++) {
                if(this.state.member_search_list[i].selected) {
                    users.push(this.state.member_search_list[i].user_id);
                }
            }
            if(users.length == 0) {
                this.setState({
                    loading: false,
                });
                Alert.alert(Constants.EMPTY_MEMBERLIST, "");
                return;
            }
            params.append("users", JSON.stringify(users));


            const data = {
                token: this.state.userToken,
                user_id: this.state.userId,
                format: 'json',
                group_id: this.state.selected_category_item.id,
                group_name: this.state.selected_category_item.group_name,
                users: JSON.stringify(users)
            }
                                    
            console.log(TAG + " callAddMemberCategoryAPI uri " + uri);
            console.log(TAG + " callAddMemberCategoryAPI params " + JSON.stringify(data));

            WebService.callServicePost(uri, data, this.handleAddMemberCategoryRresponse);
        } catch (error) {
            console.log(TAG + " callAddMemberCategoryAPI error " + error);
            this.setState({
                loading: false,
            });
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    }

    handleAddMemberCategoryRresponse = (response, isError) => {
        console.log(TAG + " callAddMemberCategoryAPI Response " + JSON.stringify(response));
        console.log(TAG + " callAddMemberCategoryAPI isError " + isError);
        if (!isError) {
            if(response.status == "success") {
                if(response.data.users != null) {
                    this.setState({
                        member_list: [...this.state.member_list, ...response.data.users],
                    })
                } 
                this.setState({
                    member_search_list: [],
                    member_search_text: '',
                    member_search_more_load: true,
                    add_member_to_connectionlist_view: false
                })
                
            } else {
                Alert.alert(response.msg.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
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

    update_category_name = () => {
        if(this.state.updated_name == "") {
            Alert.alert(Constants.EMPTY_LISTNAME, "");
            return;
        }
        try {
            this.setState({
                loading: true,
                update_connectionlistname_view: false,
            });

            let uri = Memory().env == "LIVE" ? Global.URL_UPDATE_LISTS_CATEGORY : Global.URL_UPDATE_LISTS_CATEGORY_DEV;
            let params = new FormData();
            params.append("token", this.state.userToken);
            params.append("user_id", this.state.userId);
            params.append("format", "json");
            params.append("group_id", this.state.selected_category_item.id);
            params.append("group_name", this.state.updated_name);
                                    
            console.log(TAG + " callUpdateCategoryAPI uri " + uri);
            console.log(TAG + " callUpdateCategoryAPI params " + JSON.stringify(params));

            WebService.callServicePost(uri, params, this.handleUpdateCategoryRresponse);
        } catch (error) {
            console.log(TAG + " callUpdateCategoryAPI error " + error);
            this.setState({
                loading: false,
            });
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    }

    handleUpdateCategoryRresponse = (response, isError) => {
        console.log(TAG + " callUpdateCategoryAPI Response " + JSON.stringify(response));
        console.log(TAG + " callUpdateCategoryAPI isError " + isError);
        if (!isError) {
            if(response.status == "success") {
                var connection_category_list = this.state.connection_category_list;
                var selected_category_item = this.state.selected_category_item;
                for(i = 0; i < connection_category_list.length; i ++) {
                    if(connection_category_list[i].id == this.state.selected_category_item.id) {
                        connection_category_list[i].group_name = this.state.updated_name;
                        selected_category_item.group_name = this.state.updated_name;
                        break;
                    }
                }
               
                this.setState({
                    connection_category_list: connection_category_list,
                    selected_category_item: null,
                    updated_name: "",
                    delete_connectionlist_view: false
                })
            } else {
                Alert.alert(response.msg.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
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

    remove_connection_category = () => {
        try {
            this.setState({
                loading: true,
                delete_connectionlist_view: false
            });

            let uri = Memory().env == "LIVE" ? Global.URL_REMOVE_LISTS_CATEGORY : Global.URL_REMOVE_LISTS_CATEGORY_DEV;
            let params = new FormData();
            params.append("token", this.state.userToken);
            params.append("user_id", this.state.userId);
            params.append("format", "json");
            params.append("group_id", this.state.selected_category_item.id);
                                    
            console.log(TAG + " callRemoveCategoryAPI uri " + uri);
            console.log(TAG + " callRemoveCategoryAPI params " + JSON.stringify(params));

            WebService.callServicePost(uri, params, this.handleRemoveCategoryRresponse);
        } catch (error) {
            console.log(TAG + " callRemoveCategoryAPI error " + error);
            this.setState({
                loading: false,
            });
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    }

    handleRemoveCategoryRresponse = (response, isError) => {
        console.log(TAG + " callRemoveCategoryAPI Response " + JSON.stringify(response));
        console.log(TAG + " callRemoveCategoryAPI isError " + isError);
        if (!isError) {
            if(response.status == "success") {
                var remove_index = -1;
                var connection_category_list = this.state.connection_category_list;
                for(i = 0; i < connection_category_list.length; i ++) {
                    if(connection_category_list[i].id == this.state.selected_category_item.id) {
                        remove_index = i;
                        break;
                    }
                }
                if(remove_index != -1) {
                    connection_category_list.splice(remove_index, 1);
                    if(connection_category_list.length == 0) {
                        this.setState({
                            selected_category_item: null,
                            member_list: [],
                            left_menu_clicked: false,
                        })
                    } else {
                        connection_category_list[0].selected = true;
                        connection_category_list[0].page_number = 0;
                        this.setState({
                            selected_category_item: connection_category_list[0],
                            member_list: [],
                            left_menu_clicked: false,
                        }, () => this.show_members_list())
                    }
                    this.setState({
                        connection_category_list: connection_category_list,
                    })
                }
            } else {
                Alert.alert(response.msg.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
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

    select_guest = (data) => {
        var member_list = this.state.member_list;
        var index = 0;
        for(index = 0; index < member_list.length; index ++) {
            if(member_list[index].id == data.id) {
                member_list[index].selected = !member_list[index].selected;
                break;
            }
        }

        var selected_invite_list = this.state.selected_invite_list;
        if(member_list[index].selected) {
            selected_invite_list.push({
                id: member_list[index].id,
                userImage: member_list[index].imgpath + Constants.THUMB_FOLDER + member_list[index].filename,
                name: member_list[index].first_name + " " + member_list[index].last_name
            })
        } else {
            for(i = 0; i < selected_invite_list.length; i ++) {
                if(selected_invite_list[i].id == data.id) {
                    selected_invite_list.splice(i, 1);
                    break;
                }
            }
        }
        
        this.setState({
            member_list: member_list,
            selected_invite_list: selected_invite_list
        })
    }

    callSendInvitationAPI = () => {
        try {
            this.setState({
                loading: true
            });
            let uri = Memory().env == "LIVE" ? Global.URL_SEND_EVENT_INVITATION : Global.URL_SEND_EVENT_INVITATION_DEV

            let params = new FormData();
            params.append("token", this.state.userToken);
            params.append("user_id", this.state.userId);
            params.append("format", "json");
            params.append("event_id", this.state.eventId);

            for (var i = 0; i < this.state.selectedContactList.length; i++) {
                params.append("data[" + i + "]", this.state.selectedContactList[i].id);
            }
            console.log(TAG + " callSendInvitationAPI uri " + uri);
            console.log(TAG + " callSendInvitationAPI params " + JSON.stringify(params));

            WebService.callServicePost(
                uri,
                params,
                this.handleSendInvitationResponse
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
           * handle send invitaiton API response
           */
    handleSendInvitationResponse = (response, isError) => {
        console.log(TAG + "callSendInvitationAPI Response " + JSON.stringify(response));
        console.log(TAG + "callSendInvitationAPI isError " + isError);

        if (!isError) {
            var result = response;
            if (typeof result != "undefined" && result != null) {
                if(this.state.selected_invite_user == null) {
                    this.props.screenProps.goBack();
                } else {
                    var member_list = this.state.member_list;
                    for(i = 0; i < member_list.length; i ++) {
                        if(member_list[i].id == this.state.selected_invite_user.id) {
                            member_list[i].selected = false;
                            member_list[i].invited = true;
                            break;
                        }
                    }
                    var selected_invite_list = this.state.selected_invite_list;
                    for(i = 0; i < selected_invite_list.length; i ++) {
                        if(selected_invite_list[i].id == this.state.selected_invite_user.id) {
                            selected_invite_list.splice(i, 1);
                            break;
                        }
                    }
                    this.setState({
                        member_list: member_list,
                        selected_invite_user: null,
                        selected_invite_list: selected_invite_list
                    })
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

    invite_user = (data) => {
        var selectedContactList = [];
        selectedContactList.push(data);
        this.setState({
            selectedContactList: selectedContactList,
            selected_invite_user: data
        }, () => this.callSendInvitationAPI())
    }

    removeFromList = async(removed_user) => {
        try {
            this.setState({
                loading: true,
                selected_member: removed_user
            });
            let uri = Memory().env == "LIVE" ? Global.URL_MYLIST_REMOVE_MEMBER_FROM_LIST : Global.URL_MYLIST_REMOVE_MEMBER_FROM_LIST_DEV

            let params = new FormData();
            params.append("token", this.state.userToken);
            params.append("user_id", this.state.userId);
            params.append("format", "json");
            params.append("users", JSON.stringify([removed_user.user_id]));
            params.append("group_id", this.state.selected_category_item.id);

            console.log(TAG + " callRemoveFromListAPI uri " + uri);
            console.log(TAG + " callRemoveFromListAPI params " + JSON.stringify(params));
           
            WebService.callServicePost(
                uri,
                params,
                this.handleRemoveFromListResponse
            );
        } catch (error) {
            console.log(error)
            this.setState({
                loading: false,
                selected_member: null
            });
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    }

    handleRemoveFromListResponse = (response, isError) => {
        console.log(TAG + "callRemoveFromListAPI Response " + JSON.stringify(response));
        console.log(TAG + "callRemoveFromListAPI isError " + isError);

        if (!isError) {
            if(response.status == "success") {
                var member_list = this.state.member_list;
                var index = 0;
                for(index = 0; index < member_list.length; index ++) {
                    if(member_list[index].user_id == this.state.selected_member.user_id) {
                        member_list.splice(index, 1);
                        break;
                    }
                }
                this.setState({
                    member_list: member_list,
                    selected_member: null
                })
            } else {
                Alert.alert(response.msg.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
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
   
    render() {
        return (
            <SafeAreaView style={styles.container}>
            {
                this.state.loading && <ProgressIndicator/>
            }
                <View style={{ alignItems: 'center', width: '100%', height: 40, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.card_titlecolor, borderRadius: 3 }}>
                {
                    this.state.selected_category_item == null &&
                    <Text style={[{color:Colors.gold, fontSize:20}, stylesGlobal.font]}>{"FRIEND LIST"}</Text>
                }
                {
                    this.state.selected_category_item != null && 
                    <Text style={[{color:Colors.gold, fontSize:20}, stylesGlobal.font]}>{this.state.selected_category_item.group_name}</Text>
                } 
                {
                    this.state.selected_category_item != null &&  
                    <View style = {{position: 'absolute', height: '100%', right: 0, flexDirection: 'row', alignItems: 'center', paddingRight: 10}}>
                    {
                        !this.state.eventId &&
                        <View style = {{flexDirection: 'row', alignItems: 'center',}}>
                            <TouchableOpacity style = {styles.side_menu_edit_button}
                                onPress = {() => {
                                    this.setState({
                                        add_member_to_connectionlist_view: true,
                                        membersearchlist_page_number: 1,
                                        member_search_list: []
                                    }, () => this.search_person())
                                }}
                            >
                                <Image style = {styles.side_menu_edit_image} source={require("../icons/connection-add.png")}/>
                            </TouchableOpacity>
                            <TouchableOpacity style = {styles.side_menu_edit_button}
                                onPress = {() => {
                                    this.setState({
                                        updated_name: this.state.selected_category_item.group_name,
                                        update_connectionlistname_view: true
                                    })
                                }}
                            >
                                <Image style = {[styles.side_menu_edit_image, {width: 17, height: 17}]} source={require("../icons/ic_edit.png")}/>
                            </TouchableOpacity>
                            <TouchableOpacity style = {styles.side_menu_edit_button}
                                onPress = {() => {
                                    this.setState({delete_connectionlist_view: true})
                                }}
                            >
                                <Image style = {styles.side_menu_edit_image} source={require("../icons/connection-delete.png")}/>
                            </TouchableOpacity>
                        </View>
                    }
                    </View>
                }
                 </View>
                <TouchableOpacity style = {{width: 40, height: 40, position: 'absolute', top: this.state.is_portrait ? 100 : 50, left: 0, zIndex: 10, backgroundColor: Colors.gold, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.gold}}
                    onPress = {() => this.setState({left_menu_clicked: !this.state.left_menu_clicked})}
                >
                    <Image style = {{width: 15, height: 15, resizeMode: 'contain', tintColor: Colors.black}} source={this.state.left_menu_clicked ? require("../icons/mylist_left_arrow.png") : require("../icons/mylist_right_arrow.png")}/>
                </TouchableOpacity>
            {
                this.state.left_menu_clicked &&
                <View style = {{width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, zIndex: 10}}>
                    <View style = {{width: '100%', height: '100%', position: 'absolute', top: 0, left: 0}} onStartShouldSetResponder={() => this.setState({left_menu_clicked: false})}></View>
                    <View style = {{width: 200, maxHeight: this.state.is_portrait ? this.state.screen_height * 2 / 3 - 50 : this.state.screen_height * 2 / 3 , position: 'absolute', top: this.state.is_portrait ? 100 : 50, left: 40, borderWidth: 0.5, borderColor: Colors.gray, backgroundColor: Colors.black, zIndex: 10}}>
                        <ScrollView style = {{width: '100%'}}>
                            <View style = {{width: '100%', height: 40, backgroundColor: '#2d3032', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingLeft: 10, paddingRight: 10}}>
                                <View style = {{flexDirection: 'row', flex: 1, alignItems: 'center'}} onPress = {() => this.viewall_members()}>
                                    <Text style = {[styles.side_menu_header_font, stylesGlobal.font_bold]}>{"FRIEND LISTS"}</Text>
                                </View>
                            {
                                !this.state.eventId &&
                                <TouchableOpacity style = {styles.side_menu_edit_button} onPress = {() => this.setState({add_connectionlist_view: true})}>
                                    <Image style = {styles.side_menu_edit_image} source={require("../icons/connection-add.png")}/>
                                </TouchableOpacity>
                            }
                            </View>
                        {
                            this.state.connection_category_list.map((item, index) => 
                            <View key = {index} style = {{width: '100%', height: 40, backgroundColor: Colors.black, paddingLeft: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}}>
                                <TouchableOpacity style = {{flex: 1, height: '100%', flexDirection: 'row', alignItems: 'center',  marginRight: 10}} 
                                    onPress = {() => {
                                        if(this.state.selected_category_item == null) {
                                            var connection_category_list = this.state.connection_category_list;
                                            connection_category_list[index].page_number = 0;
                                            for(i = 0; i < connection_category_list.length; i ++) {
                                                if(i == index) {
                                                    connection_category_list[i].selected = true;
                                                } else {
                                                    connection_category_list[i].selected = false;
                                                }
                                            }
                                            this.setState({
                                                connection_category_list: connection_category_list,
                                                selected_category_item: item,
                                                member_list: [],
                                                left_menu_clicked: false
                                            }, () => this.show_members_list())
                                        } else {
                                            if(this.state.selected_category_item.id == item.id) {
                                                this.setState({
                                                    left_menu_clicked: false
                                                })
                                            } else {
                                                var connection_category_list = this.state.connection_category_list;
                                                connection_category_list[index].page_number = 0;
                                                for(i = 0; i < connection_category_list.length; i ++) {
                                                    if(i == index) {
                                                        connection_category_list[i].selected = true;
                                                    } else {
                                                        connection_category_list[i].selected = false;
                                                    }
                                                }
                                                this.setState({
                                                    connection_category_list: connection_category_list,
                                                    selected_category_item: item,
                                                    member_list: [],
                                                    left_menu_clicked: false
                                                }, () => this.show_members_list())
                                            } 
                                        }
                                    }}
                                >
                                    <Image style = {{width: 15, height: 15, resizeMode: 'contain', tintColor: Colors.white}} source={require("../icons/my_list_subcategory.png")}/>
                                    <Text style = {[styles.side_menu_sub_font, stylesGlobal.font]}>{item.group_name}</Text>
                                </TouchableOpacity>
                            {
                                !this.state.eventId &&
                                <View style = {{flexDirection: 'row', alignItems: 'center',}}>
                                    <TouchableOpacity style = {styles.side_menu_edit_button} 
                                        onPress = {() => {
                                            if(this.state.selected_category_item == null) {
                                                var connection_category_list = this.state.connection_category_list;
                                                connection_category_list[index].page_number = 0;
                                                for(i = 0; i < connection_category_list.length; i ++) {
                                                    if(i == index) {
                                                        connection_category_list[i].selected = true;
                                                    } else {
                                                        connection_category_list[i].selected = false;
                                                    }
                                                }
                                                this.setState({
                                                    connection_category_list: connection_category_list,
                                                    selected_category_item: connection_category_list[index],
                                                    member_list: [],
                                                    add_member_to_connectionlist_view: true
                                                }, () => this.show_members_list())
                                            } else {
                                                if(this.state.selected_category_item.id == item.id) {
                                                    this.setState({add_member_to_connectionlist_view: true})
                                                } else {
                                                    var connection_category_list = this.state.connection_category_list;
                                                    connection_category_list[index].page_number = 0;
                                                    for(i = 0; i < connection_category_list.length; i ++) {
                                                        if(i == index) {
                                                            connection_category_list[i].selected = true;
                                                        } else {
                                                            connection_category_list[i].selected = false;
                                                        }
                                                    }
                                                    this.setState({
                                                        connection_category_list: connection_category_list,
                                                        selected_category_item: connection_category_list[index],
                                                        member_list: [],
                                                        add_member_to_connectionlist_view: true
                                                    }, () => this.show_members_list())
                                                }
                                            }
                                            this.setState({
                                                membersearchlist_page_number: 1,
                                                member_search_list: []
                                            }, () => this.search_person())
                                        }}
                                    >
                                        <Image style = {styles.side_menu_edit_image} source={require("../icons/connection-add.png")}/>
                                    </TouchableOpacity>
                                    <TouchableOpacity style = {styles.side_menu_edit_button} 
                                        onPress = {() => {
                                            if(this.state.selected_category_item == null) {
                                                var connection_category_list = this.state.connection_category_list;
                                                connection_category_list[index].page_number = 0;
                                                for(i = 0; i < connection_category_list.length; i ++) {
                                                    if(i == index) {
                                                        connection_category_list[i].selected = true;
                                                    } else {
                                                        connection_category_list[i].selected = false;
                                                    }
                                                }
                                                this.setState({
                                                    connection_category_list: connection_category_list,
                                                    selected_category_item: connection_category_list[index],
                                                    member_list: [],
                                                    updated_name: connection_category_list[index].group_name,
                                                    update_connectionlistname_view: true
                                                }, () => this.show_members_list())
                                            } else {
                                                if(this.state.selected_category_item.id == item.id) {
                                                    this.setState({
                                                        updated_name: this.state.selected_category_item.group_name,
                                                        update_connectionlistname_view: true
                                                    })
                                                } else {
                                                    var connection_category_list = this.state.connection_category_list;
                                                    connection_category_list[index].page_number = 0;
                                                    for(i = 0; i < connection_category_list.length; i ++) {
                                                        if(i == index) {
                                                            connection_category_list[i].selected = true;
                                                        } else {
                                                            connection_category_list[i].selected = false;
                                                        }
                                                    }
                                                    this.setState({
                                                        connection_category_list: connection_category_list,
                                                        selected_category_item: connection_category_list[index],
                                                        member_list: [],
                                                        updated_name: connection_category_list[index].group_name,
                                                        update_connectionlistname_view: true
                                                    }, () => this.show_members_list())
                                                }
                                            }
                                        }}
                                    >
                                        <Image style = {[styles.side_menu_edit_image, {width: 17, height: 17}]} source={require("../icons/ic_edit.png")}/>
                                    </TouchableOpacity>
                                    <TouchableOpacity style = {styles.side_menu_edit_button} 
                                        onPress = {() => {
                                            if(this.state.selected_category_item == null) {
                                                var connection_category_list = this.state.connection_category_list;
                                                connection_category_list[index].page_number = 0;
                                                for(i = 0; i < connection_category_list.length; i ++) {
                                                    if(i == index) {
                                                        connection_category_list[i].selected = true;
                                                    } else {
                                                        connection_category_list[i].selected = false;
                                                    }
                                                }
                                                this.setState({
                                                    connection_category_list: connection_category_list,
                                                    selected_category_item: connection_category_list[index],
                                                    member_list: [],
                                                    delete_connectionlist_view: true
                                                }, () => this.show_members_list())
                                            } else {
                                                if(this.state.selected_category_item.id == item.id) {
                                                    this.setState({delete_connectionlist_view: true})
                                                } else {
                                                    var connection_category_list = this.state.connection_category_list;
                                                    connection_category_list[index].page_number = 0;
                                                    for(i = 0; i < connection_category_list.length; i ++) {
                                                        if(i == index) {
                                                            connection_category_list[i].selected = true;
                                                        } else {
                                                            connection_category_list[i].selected = false;
                                                        }
                                                    }
                                                    this.setState({
                                                        connection_category_list: connection_category_list,
                                                        selected_category_item: connection_category_list[index],
                                                        member_list: [],
                                                        delete_connectionlist_view: true
                                                    }, () => this.show_members_list())
                                                }
                                            }
                                        }}
                                    >
                                        <Image style = {styles.side_menu_edit_image} source={require("../icons/connection-delete.png")}/>
                                    </TouchableOpacity>
                                </View>
                            }
                            </View>
                            )
                        }
                         </ScrollView>  
                    </View>
                </View>
            }
            {
                this.state.add_connectionlist_view &&
                <View style = {{position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, alignItems: 'center', zIndex: 20}}>
                    <View style = {{position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, opacity: 0.3, backgroundColor: Colors.black}}></View>
                    <View style = {{width: '90%', marginTop: 30, backgroundColor: Colors.white, borderRadius: 5}}>
                        <TouchableOpacity style = {{position: 'absolute', top: 20, right: 20, width: 15, height: 15, zIndex: 20}} 
                            onPress = {() => {
                                this.setState({
                                    new_list_category_name: '',
                                    member_search_list: [],
                                    member_search_text: '',
                                    member_search_more_load: true,
                                    membersearchlist_page_number: 1,
                                    add_connectionlist_view: false
                                })
                            }}
                        >
                            <Image style = {{width: '100%', height: '100%', tintColor: Colors.gold}} source={require('../icons/connection-delete.png')}/>
                        </TouchableOpacity>
                        <View style = {{width: '100%', padding: 20}}>
                            <Text style = {[{fontSize: 18, color: Colors.black}, stylesGlobal.font]}>Create a New Friend List</Text>
                        </View>
                        <View style = {{width: '100%', padding: 20, borderTopColor: Colors.gray, borderTopWidth: 0.5, alignItems: 'center'}}>
                            <TextInput style = {[{fontSize: 14, color: Colors.black, width: '90%', height: 35, padding: 5, borderWidth: 0.5, borderColor: Colors.gray, borderRadius: 5}, stylesGlobal.font]} 
                                placeholder = 'Friend List Name' 
                                placeholderTextColor={Colors.gray}
                                autoCorrect = {false}
                                onChangeText = {(text) => this.setState({new_list_category_name: text})}
                            >{this.state.new_list_category_name}</TextInput>
                            <TextInput style = {[{fontSize: 14, color: Colors.black, width: '90%', height: 35, padding: 5, borderWidth: 0.5, borderColor: Colors.gray, borderRadius: 5, marginTop: 10}, stylesGlobal.font]}
                                placeholder = 'Search Friend' 
                                placeholderTextColor={Colors.gray}
                                autoCorrect = {false}
                                onChangeText = {(text) => this.setState({member_search_text: text})}
                                returnKeyType = {'search'}
                                onSubmitEditing = {() => {
                                    this.setState({
                                        membersearchlist_page_number: 1,
                                        member_search_list: []
                                    }, () => this.search_person())
                                }}
                            >{this.state.member_search_text}</TextInput>
                        </View>
                        <View style = {{width: '100%', height: this.state.overlayview_height, paddingLeft: 20, paddingRight: 20,}}>
                            <View style = {{width: '100%', height: '100%', borderWidth: 0.5, borderColor: Colors.gray}}>
                                <ScrollView style = {{width: '100%'}}
                                    scrollEventThrottle={0}
                                    onScroll={({nativeEvent}) => {
                                        if(this.isCloseToTop(nativeEvent)) {
                                            this.setState({
                                                member_search_list: [],
                                                membersearchlist_page_number: 1,
                                                member_search_more_load: true
                                            }, () => this.search_person())
                                        }
                                        if(this.isCloseToBottom(nativeEvent)) {
                                            if(this.state.member_search_more_load) {
                                                this.search_person();
                                            }
                                        }
                                    }}
                                >
                                {
                                    this.state.member_search_list.map((item, index) => 
                                    <TouchableOpacity key = {index} style = {{width: '100%', height: 80, flexDirection: 'row', alignItems: 'center', marginBottom: 10, paddingHorizontal: 10, paddingVertical: 5}}
                                        onPress = {() => {
                                            var member_search_list = this.state.member_search_list;
                                            member_search_list[index].selected = !member_search_list[index].selected;
                                            this.setState({
                                                member_search_list: member_search_list
                                            })
                                        }}
                                    >
                                        <View style = {{width: 20, height: 20, marginRight: 10}}>
                                            <Image source={require('../icons/square.png')}  style={{width: '100%', height: '100%', resizeMode:'contain'}}/>
                                        {
                                            item.selected &&
                                            <Image source={require('../icons/checked.png')} style={{position:'absolute', top: 0, left: 0, width: '100%', height: '100%', resizeMode:'contain'}}/>
                                        }
                                        </View>
                                        <View style = {{height: '100%', aspectRatio: 1, marginRight: 10}}>
                                            <ImageCompressor
                                                style={{width: '100%', height: '100%', borderRadius: 5, overflow: 'hidden'}}
                                                uri={item.profile_image}
                                            />
                                        </View>
                                        <Text style = {[{fontSize: 14, color: Colors.black}, stylesGlobal.font, ]}>{item.first_name} {item.last_name}</Text>
                                    </TouchableOpacity>
                                    )
                                }
                                </ScrollView>
                            </View>
                        </View>
                        <View style = {{width: '100%', padding: 20, flexDirection: 'row', justifyContent: 'flex-end'}}>
                            <TouchableOpacity style = {[{paddingVertical: 10, paddingHorizontal: 20, minWidth: 60, backgroundColor: Colors.gold, borderRadius: 5, justifyContent: 'center', alignItems: 'center'}, stylesGlobal.shadow_style]} 
                                onPress = {() => this.add_list_category()}
                            >
                                <Text style = {[{fontSize: 14, color: Colors.white}, stylesGlobal.font]}>Save</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style = {[{paddingVertical: 10, paddingHorizontal: 20, minWidth: 60, backgroundColor: Colors.gold, borderRadius: 5, marginLeft: 15, justifyContent: 'center', alignItems: 'center'}, stylesGlobal.shadow_style]} 
                                onPress = {() => {
                                    this.setState({
                                        new_list_category_name: '',
                                        member_search_list: [],
                                        member_search_text: '',
                                        member_search_more_load: true,
                                        membersearchlist_page_number: 1,
                                        add_connectionlist_view: false
                                    })
                                }}
                            >
                                <Text style = {[{fontSize: 14, color: Colors.white}, stylesGlobal.font]}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            }
            {
                this.state.add_member_to_connectionlist_view &&
                <View style = {{position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, alignItems: 'center', zIndex: 20}}>
                    <View style = {{position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, opacity: 0.3, backgroundColor: Colors.black}}></View>
                    <View style = {{width: '90%', marginTop: 30, backgroundColor: Colors.white, borderRadius: 5}}>
                        <TouchableOpacity style = {{position: 'absolute', top: 20, right: 20, width: 15, height: 15, zIndex: 20}} 
                            onPress = {() => {
                                this.setState({
                                    member_search_list: [],
                                    member_search_text: '',
                                    member_search_more_load: true,
                                    membersearchlist_page_number: 1,
                                    add_member_to_connectionlist_view: false
                                })
                            }}
                        >
                            <Image style = {{width: '100%', height: '100%', tintColor: Colors.gold}} source={require('../icons/connection-delete.png')}/>
                        </TouchableOpacity>
                        <View style = {{width: '100%', padding: 20}}>
                            {/* <Text style = {[{fontSize: 18, color: Colors.black}, stylesGlobal.font]}>Add to My List.</Text> */}
                            <Text style = {[{fontSize: 18, color: Colors.black}, stylesGlobal.font]}>Add to List '{this.state.selected_category_item.group_name}'</Text>
                        </View>
                        <View style = {{width: '100%', padding: 20, borderTopColor: Colors.gray, borderTopWidth: 0.5, alignItems: 'center'}}>
                            <TextInput style = {[{fontSize: 14, color: Colors.black, width: '90%', height: 35, padding: 5, borderWidth: 0.5, borderColor: Colors.gray, borderRadius: 5}, stylesGlobal.font]} placeholder = 'Search...' 
                                autoCorrect = {false}
                                onChangeText = {(text) => this.setState({member_search_text: text})}
                                returnKeyType = {'search'}
                                onSubmitEditing = {() => {
                                    this.setState({
                                        membersearchlist_page_number: 1,
                                        member_search_list: []
                                    }, () => this.search_person())
                                }}
                            >{this.state.member_search_text}</TextInput>
                        </View>
                        <View style = {{width: '100%', height: this.state.overlayview_height, paddingLeft: 20, paddingRight: 20,}}>
                            <View style = {{width: '100%', height: '100%', borderWidth: 0.5, borderColor: Colors.gray}}>
                                <ScrollView style = {{width: '100%'}}
                                    scrollEventThrottle={0}
                                    onScroll={({nativeEvent}) => {
                                        if(this.isCloseToTop(nativeEvent)) {
                                            this.setState({
                                                member_search_list: [],
                                                membersearchlist_page_number: 1,
                                                member_search_more_load: true
                                            }, () => this.search_person())
                                        }
                                        if(this.isCloseToBottom(nativeEvent)) {
                                            if(this.state.member_search_more_load) {
                                                this.search_person();
                                            }
                                        }
                                    }}
                                >
                                {
                                    this.state.member_search_list.map((item, index) => 
                                    <TouchableOpacity key = {index} style = {{width: '100%', height: 80, flexDirection: 'row', alignItems: 'center', marginBottom: 10, paddingHorizontal: 10, paddingVertical: 5}}
                                        onPress = {() => {
                                            var member_search_list = this.state.member_search_list;
                                            if(!member_search_list[index].exist_in_current_group) {
                                                member_search_list[index].selected = !member_search_list[index].selected;
                                            }
                                            this.setState({
                                                member_search_list: member_search_list
                                            })
                                        }}
                                    >
                                        <View style = {{width: 20, height: 20, marginRight: 10}}>
                                            <Image source={require('../icons/square.png')}  style={{width: '100%', height: '100%', resizeMode:'contain'}}/>
                                        {
                                            (item.selected || item.exist_in_current_group) &&
                                            <Image source={require('../icons/checked.png')} style={{position:'absolute', top: 0, left: 0, width: '100%', height: '100%', resizeMode:'contain', tintColor: item.exist_in_current_group ? Colors.gray :'' }}/>
                                        }
                                        </View>
                                        <View style = {{height: '100%', aspectRatio: 1, marginRight: 10}}>
                                            <ImageCompressor
                                                style={{width: '100%', height: '100%', borderRadius: 5, overflow: 'hidden'}}
                                                uri={item.profile_image}
                                            />
                                        </View>
                                        <Text style = {[{fontSize: 14, color: Colors.black}, stylesGlobal.font, ]}>{item.first_name} {item.last_name}</Text>
                                    </TouchableOpacity>
                                    )
                                }
                                </ScrollView>
                            </View>
                        </View>
                        <View style = {{width: '100%', padding: 20, flexDirection: 'row', justifyContent: 'flex-end'}}>
                            <TouchableOpacity style = {[{paddingVertical: 10, paddingHorizontal: 20, minWidth: 60, backgroundColor: Colors.gold, borderRadius: 5, justifyContent: 'center', alignItems: 'center'}, stylesGlobal.shadow_style]} 
                                onPress = {() => this.add_member_to_category()}
                            >
                                <Text style = {[{fontSize: 14, color: Colors.white}, stylesGlobal.font]}>Save</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style = {[{paddingVertical: 10, paddingHorizontal: 20, minWidth: 60, backgroundColor: Colors.gold, borderRadius: 5, marginLeft: 15, justifyContent: 'center', alignItems: 'center'}, stylesGlobal.shadow_style]} 
                                onPress = {() => {
                                    this.setState({
                                        member_search_list: [],
                                        member_search_text: '',
                                        member_search_more_load: true,
                                        membersearchlist_page_number: 1,
                                        add_member_to_connectionlist_view: false
                                    })
                                }}
                            >
                                <Text style = {[{fontSize: 14, color: Colors.white}, stylesGlobal.font]}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            }
            {
                this.state.update_connectionlistname_view &&
                <View style = {{position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, alignItems: 'center', zIndex: 10}}>
                    <View style = {{position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, opacity: 0.3, backgroundColor: Colors.black}}></View>
                    <View style = {{width: '90%', marginTop: 30, backgroundColor: Colors.white, borderRadius: 5}}>
                        <TouchableOpacity style = {{position: 'absolute', top: 20, right: 20, width: 15, height: 15, zIndex: 20}} 
                            onPress = {() => this.setState({update_connectionlistname_view: false})}
                        >
                            <Image style = {{width: '100%', height: '100%', tintColor: Colors.gold}} source={require('../icons/connection-delete.png')}/>
                        </TouchableOpacity>
                        <View style = {{width: '100%', padding: 20}}>
                            <Text style = {[{fontSize: 18, color: Colors.black}, stylesGlobal.font]}>Rename List '{this.state.selected_category_item.group_name}'</Text>
                        </View>
                        <View style = {{width: '100%', padding: 20, borderTopColor: Colors.gray, borderTopWidth: 0.5, borderBottomColor: Colors.gray, borderBottomWidth: 0.5, alignItems: 'center'}}>
                            <TextInput style = {[{fontSize: 14, color: Colors.black, width: '90%', height: 35, padding: 5, borderWidth: 0.5, borderColor: Colors.gray, borderRadius: 5}, stylesGlobal.font]} onChangeText = {(text) => this.setState({updated_name: text})}>{this.state.updated_name}</TextInput>
                        </View>
                        <View style = {{width: '100%', padding: 20, flexDirection: 'row', justifyContent: 'flex-end'}}>
                            <TouchableOpacity style = {[{paddingVertical: 10, paddingHorizontal: 20, minWidth: 60, backgroundColor: Colors.gold, borderRadius: 5, justifyContent: 'center', alignItems: 'center'}, stylesGlobal.shadow_style]} 
                                onPress = {() => this.update_category_name()}
                            >
                                <Text style = {[{fontSize: 14, color: Colors.white}, stylesGlobal.font]}>Save</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style = {[{paddingVertical: 10, paddingHorizontal: 20, minWidth: 60, backgroundColor: Colors.gold, borderRadius: 5, marginLeft: 15, justifyContent: 'center', alignItems: 'center'}, stylesGlobal.shadow_style]} 
                                onPress = {() => this.setState({update_connectionlistname_view: false})}
                            >
                                <Text style = {[{fontSize: 14, color: Colors.white}, stylesGlobal.font]}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            }
            {
                this.state.delete_connectionlist_view &&
                <View style = {{position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, alignItems: 'center', zIndex: 10}}>
                    <View style = {{position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, opacity: 0.3, backgroundColor: Colors.black}}></View>
                    <View style = {{width: '90%', marginTop: 30, backgroundColor: Colors.white, borderRadius: 5}}>
                        <TouchableOpacity style = {{position: 'absolute', top: 20, right: 20, width: 15, height: 15, zIndex: 20}} 
                            onPress = {() => this.setState({delete_connectionlist_view: false})}
                        >
                            <Image style = {{width: '100%', height: '100%', tintColor: Colors.gold}} source={require('../icons/connection-delete.png')}/>
                        </TouchableOpacity>
                        <View style = {{width: '100%', padding: 20}}>
                            <Text style = {[{fontSize: 18, color: Colors.black}, stylesGlobal.font]}>Delete List '{this.state.selected_category_item.group_name}'.</Text>
                        </View>
                        <View style = {{width: '100%', padding: 20, borderTopColor: Colors.gray, borderTopWidth: 0.5, borderBottomColor: Colors.gray, borderBottomWidth: 0.5}}>
                            <Text style = {[{fontSize: 14, color: Colors.black}, stylesGlobal.font]}>This Friend List will be removed. Are you sure?</Text>
                        </View>
                        <View style = {{width: '100%', padding: 20, flexDirection: 'row', justifyContent: 'flex-end'}}>
                            <TouchableOpacity style = {[{paddingVertical: 10, paddingHorizontal: 20, minWidth: 60, backgroundColor: Colors.gold, borderRadius: 5, justifyContent: 'center', alignItems: 'center'}, stylesGlobal.shadow_style]} 
                                onPress = {() => this.remove_connection_category()}
                            >
                                <Text style = {[{fontSize: 14, color: Colors.white}, stylesGlobal.font]}>Yes</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style = {[{paddingVertical: 10, paddingHorizontal: 20, minWidth: 60, backgroundColor: Colors.gold, borderRadius: 5, marginLeft: 15, justifyContent: 'center', alignItems: 'center'}, stylesGlobal.shadow_style]} 
                                onPress = {() => this.setState({delete_connectionlist_view: false})}
                            >
                                <Text style = {[{fontSize: 14, color: Colors.white}, stylesGlobal.font]}>No</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            }
            {
                this.state.invite_event_view && 
                <InviteUserToEventView
                    screenProps = {this.props.screenProps}
                    invited_user = {this.state.selected_member}
                    invite_event_list = {this.state.invite_event_list}
                    close_view = {() => this.setState({invite_event_view: false})}
                    selectUserforInvite = {(item, index) => {
                        if(item.invitation_id == null) {
                            var invite_event_list = this.state.invite_event_list;
                            invite_event_list[index].check = !invite_event_list[index].check;
                            this.setState({
                                invite_event_list: invite_event_list
                            })
                        }
                    }}
                    callInviteUserToEvent = {async() => {
                        var exist = false
                        for (var i = 0; i < this.state.invite_event_list.length; i++) {
                            if(this.state.invite_event_list[i].check) {
                                exist = true;
                                break;
                            }
                        }
                        if(!exist) {
                            Alert.alert(Constants.INVITE_EVENT_SELECTION, "");
                            return;
                        }
                        this.setState({
                            loading: true
                        });
                        const response = await callInviteUserToEvent(this.state.selected_member, this.state.invite_event_list, this.state.userId, this.state.userToken);
                        if(response.status == "success") {
                            Alert.alert(Constants.INVITED_USER_SUCCESS + this.state.selected_member.first_name + " " + this.state.selected_member.last_name, "");
                        }
                        this.setState({
                            loading: false,
                            invite_event_view: false,
                            selected_member: null
                        })
                    }}
                />
            }
            {
                this.state.selected_invite_list.length > 0 &&
                <View style = {{width: '100%', marginTop: 10}}>
                    <FlatList
                        renderItem={({ item, index }) => (
                            <View style={{marginHorizontal: 10, }}>
                                <View style={{width: 60, height: 60, borderRadius:30, overflow:'hidden'}}>
                                    <Image style={{width: 60, height: 60, resizeMode: 'contain'}} source={{uri:item.userImage, cache:'force-cache'}} defaultSource={require("../icons/Background-Placeholder_Camera.png")}/>
                                </View>
                                {/* <Text style={{color:Colors.black,marginBottom:20,width:70,textAlign:'center'}} numberOfLines={1} >{item.name}</Text> */}
                                <TouchableOpacity style={{position:'absolute', top:0, right:0, width: 20, height: 20, borderRadius:10, overflow:'hidden', backgroundColor: Colors.white, justifyContent: 'center', alignItems: 'center'}}
                                    onPress = {() => {
                                        this.setState({action_invite_list: true,})
                                        this.select_guest(item);
                                    }}
                                >
                                    <Image style={{width:'80%', height:'80%', resizeMode:'contain', tintColor: Colors.gold}} source={require('../icons/connection-delete.png')}/>
                                </TouchableOpacity>
                            </View>
                        )}
                        data={this.state.selected_invite_list}
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
                this.state.invite_guest &&
                <View style = {{width: '100%', marginVertical: 10, flexDirection: 'row', justifyContent: 'flex-end'}}>
                    <TouchableOpacity
                        style={{
                            backgroundColor:Colors.gold,
                            paddingVertical:10,
                            paddingHorizontal:15,
                            borderRadius:5,
                            minWidth:100,
                            alignItems:'center',
                            marginRight: 20
                        }}
                        onPress={() => {
                            if (this.state.selected_invite_list.length > 0) {
                                this.setState({
                                    selectedContactList: this.state.selected_invite_list
                                }, () => this.callSendInvitationAPI())
                            } else {
                                Alert.alert(Constants.SELECT_AT_LEAST_ONE_MEMBER);
                            }
                        }}
                    >
                        <Text style={[stylesGlobal.font, {color:Colors.white, fontSize:15}]}>Invite selected</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={{
                            backgroundColor:Colors.gold,
                            paddingVertical:10,
                            paddingHorizontal:15,
                            borderRadius:5,
                            minWidth:100,
                            alignItems:'center',
                            marginRight: 20
                        }}
                        onPress={() => {
                            this.props.screenProps.goBack();
                        }}
                    >
                        <Text style={[stylesGlobal.font, {color:Colors.white, fontSize:15}]}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            }
            {
                !this.state.loading && this.state.member_list.length == 0 && this.state.selected_category_item == null &&
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    {this.empty_cardview("You have not created any Friend Lists yet.", "add_new_list")}
                </View>
            }
            {
                !this.state.loading && this.state.member_list.length == 0 && this.state.selected_category_item != null && 
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    {this.empty_cardview("This Friend List does not have any members yet.", "add_new_members")}
                </View>
            }
            {
                this.state.member_list.length > 0 &&
                <View style={{ flex: 1, marginTop: 10 }}>
                    <FlatList
                        ListHeaderComponent = {this.state.pulldown_loading && <PullDownIndicator/>}
                        ListFooterComponent={this.state.displayLoadMoreView == true ? footerView : null}
                        extraData={this.state}
                        // pagingEnabled={false}
                        showsHorizontalScrollIndicator={false}
                        showsVerticalScrollIndicator={false}
                        data={this.state.member_list}
                        keyExtractor={(item, index) => index.toString()}
                        style = {{width: '100%'}}
                        // columnWrapperStyle = {{width: '50%'}}
                        numColumns = {this.state.is_portrait ? 1 : 2}
                        key = {this.state.is_portrait ? 1 : 2}
                        renderItem={({ item, index }) => (
                            <View key = {index} style = {{width: this.state.is_portrait ? '100%' : '50%', alignItems: 'center'}}>
                                <RowConnection
                                    data={item}
                                    screenProps={this.props.screenProps}
                                    myUserId={this.state.userId}
                                    is_verified = {this.state.is_verified}
                                    invite_guest = {this.state.invite_guest}
                                    messageButton={true}
                                    inviteButton = {async(item) => { // invite user to event
                                        this.setState({
                                            selected_member: item,
                                            loading: true
                                        })
                                        const response = await getEventsForInvite(item, this.state.userId, this.state.userToken);
                                        this.setState({
                                            loading: false
                                        })
                                        if(response.status == "success") {
                                            this.setState({
                                                invite_event_list: response.data.events,
                                                invite_event_view: true
                                            })
                                        }
                                    }}
                                    followPress = {async(item) => {
                                        this.setState({
                                            selected_member: item,
                                            loading: true
                                        })
                                        const response = await callFollowRequest(item, this.state.userId, this.state.userToken);
                                        this.setState({
                                            loading: false
                                        })
                                        if(response.status == "success") {
                                            var member_list = this.state.member_list;
                                            for(i = 0; i < member_list.length; i ++) {
                                                if(member_list[i].id == this.state.selected_member.id) {
                                                    if(member_list[i].following_id) {
                                                        member_list[i].following_id = null;
                                                    } else {
                                                        member_list[i].following_id = "1";
                                                    }
                                                    break;
                                                }
                                            }
                                            this.setState({
                                                member_list: member_list,
                                                selected_member: null
                                            })
                                        }
                                    }}
                                    favoritePress = {async(item) => {
                                        this.setState({
                                            selected_member: item,
                                            loading: true
                                        })
                                        const response = await callFavoriteMember(item, this.state.userId, this.state.userToken);
                                        this.setState({
                                            loading: false
                                        })
                                        if(response.status == "success") {
                                            var member_list = this.state.member_list;
                                            for(i = 0; i < member_list.length; i ++) {
                                                if(member_list[i].id == this.state.selected_member.id) {
                                                    if(member_list[i].st != null) {
                                                        if(member_list[i].st == 0) {
                                                            member_list[i].st = "1";
                                                        } else {
                                                            member_list[i].st = 0;
                                                        }
                                                    } else {
                                                        if(member_list[i].favorite_id) {
                                                            member_list[i].favorite_id = null;
                                                        } else {
                                                            member_list[i].favorite_id = "1";
                                                        }
                                                    }
                                                    break;
                                                }
                                            }
                                            this.setState({
                                                member_list: member_list,
                                                selected_member: null
                                            })
                                        }
                                    }}
                                    select_guest = {this.select_guest}
                                    invite_user = {this.invite_user} // when invite user from import from list function
                                    removeFromList = {this.removeFromList}
                                />
                            </View>
                        )}
                        onMomentumScrollBegin={() => { this.onEndReachedCalledDuringMomentum = false; }}
                        onEndReachedThreshold={0.5}
                        onEndReached={({ distanceFromEnd }) => {
                            console.log("end reached")
                            if (!this.onEndReachedCalledDuringMomentum ) {
                                if(this.state.more_load && !this.state.loading) {
                                    this.onEndReachedCalledDuringMomentum = true;
                                    if(this.state.selected_category_item == null) {
                                        this.getMyList()
                                    } else {
                                        this.show_members_list();
                                    }
                                }
                            }
                        }}
                        onScroll = {async({nativeEvent}) => {
                            if(this.isCloseToTop(nativeEvent)) {
                                if(this.state.selected_category_item == null) {
                                    this.setState({
                                        member_list: [],
                                        viewall_page_number: 0,
                                        total_length: 0,
                                        more_load: true
                                    }, () => this.getMyList())
                                } else {
                                    var selected_category_item = this.state.selected_category_item;
                                    selected_category_item.page_number = 0
                                    this.setState({
                                        member_list: [],
                                        selected_category_item: selected_category_item,
                                        total_length: 0,
                                    }, () => this.show_members_list())
                                }
                            }
                        }}
                    />
                    {/* <ScrollView style = {{width: '100%', height: '100%', marginTop: 10}}
                        scrollEventThrottle={0}
                        onScroll={({nativeEvent}) => {
                            if(this.isCloseToTop(nativeEvent)) {
                                if(this.state.selected_category_item == null) {
                                    this.setState({
                                        member_list: [],
                                        viewall_page_number: 0,
                                        total_length: 0,
                                        more_load: true
                                    }, () => this.getMyList())
                                } else {
                                    var selected_category_item = this.state.selected_category_item;
                                    selected_category_item.page_number = 0
                                    this.setState({
                                        member_list: [],
                                        selected_category_item: selected_category_item,
                                        total_length: 0,
                                    }, () => this.show_members_list())
                                }
                            }
                            if(this.isCloseToBottom(nativeEvent)) {
                                if(this.state.more_load && !this.state.loading) {
                                    if(this.state.selected_category_item == null) {
                                        this.getMyList()
                                    } else {
                                        this.show_members_list();
                                    }
                                }
                            }
                        }}
                    >
                    {
                        this.state.member_list.map((item, index) => 
                        <View key = {index} style = {{width: '100%', alignItems: 'center'}}>
                            <RowConnection
                                data={item}
                                screenProps={this.props.screenProps}
                                myUserId={this.state.userId}
                                is_verified = {this.state.is_verified}
                                invite_guest = {this.state.invite_guest}
                                messageButton={true}
                                inviteButton = {async(item) => { // invite user to event
                                    this.setState({
                                        selected_member: item,
                                        loading: true
                                    })
                                    const response = await getEventsForInvite(item, this.state.userId, this.state.userToken);
                                    this.setState({
                                        loading: false
                                    })
                                    if(response.status == "success") {
                                        this.setState({
                                            invite_event_list: response.data.events,
                                            invite_event_view: true
                                        })
                                    }
                                }}
                                followPress = {async(item) => {
                                    this.setState({
                                        selected_member: item,
                                        loading: true
                                    })
                                    const response = await callFollowRequest(item, this.state.userId, this.state.userToken);
                                    this.setState({
                                        loading: false
                                    })
                                    if(response.status == "success") {
                                        var member_list = this.state.member_list;
                                        for(i = 0; i < member_list.length; i ++) {
                                            if(member_list[i].id == this.state.selected_member.id) {
                                                if(member_list[i].following_id) {
                                                    member_list[i].following_id = null;
                                                } else {
                                                    member_list[i].following_id = "1";
                                                }
                                                break;
                                            }
                                        }
                                        this.setState({
                                            member_list: member_list,
                                            selected_member: null
                                        })
                                    }
                                }}
                                favoritePress = {async(item) => {
                                    this.setState({
                                        selected_member: item,
                                        loading: true
                                    })
                                    const response = await callFavoriteMember(item, this.state.userId, this.state.userToken);
                                    this.setState({
                                        loading: false
                                    })
                                    if(response.status == "success") {
                                        var member_list = this.state.member_list;
                                        for(i = 0; i < member_list.length; i ++) {
                                            if(member_list[i].id == this.state.selected_member.id) {
                                                if(member_list[i].st != null) {
                                                    if(member_list[i].st == 0) {
                                                        member_list[i].st = "1";
                                                    } else {
                                                        member_list[i].st = 0;
                                                    }
                                                } else {
                                                    if(member_list[i].favorite_id) {
                                                        member_list[i].favorite_id = null;
                                                    } else {
                                                        member_list[i].favorite_id = "1";
                                                    }
                                                }
                                                break;
                                            }
                                        }
                                        this.setState({
                                            member_list: member_list,
                                            selected_member: null
                                        })
                                    }
                                }}
                                select_guest = {this.select_guest}
                                invite_user = {this.invite_user} // when invite user from import from list function
                                removeFromList = {this.removeFromList}
                            />
                        </View>
                        )
                    }
                    </ScrollView> */}
                </View>
            }
            </SafeAreaView>
        );
    }

    empty_cardview = (empty_text, type) => {
        return (
            <View style = {stylesGlobal.empty_cardView}>
                <Text style={[stylesGlobal.empty_cardView_text, stylesGlobal.font, ]}>{empty_text}</Text>
            
            {
                type == "add_new_list" &&
                <TouchableOpacity style = {[stylesGlobal.common_button, stylesGlobal.shadow_style, {marginTop: 10}]} onPress = {() => this.setState({add_connectionlist_view: true})}>
                    <Text style = {[stylesGlobal.empty_cardView_text, stylesGlobal.font, {color: Colors.white}]}>Add New List</Text>
                </TouchableOpacity>
            }
            {
                type == "add_new_members" &&
                <TouchableOpacity style = {[stylesGlobal.common_button, stylesGlobal.shadow_style, {marginTop: 10}]} onPress = {() => this.setState({add_member_to_connectionlist_view: true})}>
                    <Text style = {[stylesGlobal.empty_cardView_text, stylesGlobal.font, {color: Colors.white}]}>Add New Members</Text>
                </TouchableOpacity>
            }
            </View>
        )
    }

    /**
    * get profile info API again
    */
    getDataAgain = (refresh) => {
        if (refresh) {
            this.getData();
        }
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: "100%",
        height: "100%",
        backgroundColor: Colors.black
    },
    rowText: {
        color: Colors.black,
        fontSize: 14,
        backgroundColor: Colors.transparent
    },
    labelIcon: {
        width: 25,
        height: 25,
        resizeMode: 'contain',
        marginRight: 5,
        marginLeft: 5,
    },
    button: {
        paddingVertical: 10,
        paddingHorizontal: 15,
        backgroundColor: Colors.gold,
        borderRadius: 5,
    },
    buttonText: {
        color: Colors.black,
        fontSize: 14,
    }, 
    buttonText_white: {
        color: Colors.white,
        fontSize: 14,
    }, 
    empty_text: {
        color: Colors.black,
        fontSize: 14,
        textAlign: "center"
    },
    side_menu_header_font: {
        fontSize: 14, 
        color: Colors.gold, 
        marginLeft: 10
    },
    side_menu_sub_font: {
        fontSize: 14, 
        color: Colors.white, 
        marginLeft: 10
    },
    side_menu_edit_image: {
        width: 12, 
        height: 12, 
        resizeMode: 'contain', 
        tintColor: Colors.gold
    },
    side_menu_edit_button: {
        padding: 5
    }
});
