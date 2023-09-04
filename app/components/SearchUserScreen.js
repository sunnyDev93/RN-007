import React, { Component } from "react";
import {
    Platform,
    StyleSheet,
    View,
    FlatList,
    Image,
    TouchableOpacity,
    TextInput,
    Text,
    Keyboard,
    Dimensions,
    Alert
} from "react-native";

import DialogInput from "../customview/DialogInput";
import RowFindFriend from "./RowFindFriend";
import RowConnection from "./RowConnection";
import WebService from "../core/WebService";
import { Constants } from "../consts/Constants";
import { Colors } from "../consts/Colors";
import * as Global from "../consts/Global";
import ProgressIndicator from "./ProgressIndicator";
import CustomPopupView from "../customview/CustomPopupView";
import { ImageCompressor } from './ImageCompressorClass';
import { stylesGlobal } from '../consts/StyleSheet'
import Memory from '../core/Memory'
import BannerView from "../customview/BannerView";
import AsyncStorage from '@react-native-community/async-storage';
import InviteUserToEventView from "../customview/InviteUserToEventView";
import {getEventsForInvite, callInviteUserToEvent, callFavoriteMember, callFollowRequest} from "../utils/Util";

const { height, width } = Dimensions.get("window");
const isIos = Platform.OS === 'ios'
const isIphoneX = isIos && (Dimensions.get('window').height === 812 || Dimensions.get('window').height === 896);
const bottomPadding = isIphoneX ? 36 : 0;


var eyeColor = "";
var skinColor = "";
var hairColor = "";
var ethnicity = "";
var maritalStatus = "";
var body = "";
var recordPerPage = "60";
var userType = [];
var connection = "";
var gender = [];

var pageNumber = 1;
let timeStamp = 0;

var TAG = "SearchUserScreen";
export default class SearchUserScreen extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            showModel: false,
            userId: "",
            userToken: "",
            is_verified: '0',
            loading: true,
            searchText: "",
            dataSearchUsersList: [],
            displaySearchUsers: false,
            isLoadMoreSearchUser: true,
            displayLoadMoreView: false,
            displayLoadMoreLoader: false,

            selected_member: null, // used for fav and follow

            invite_event_view: false, // invite user to event view
            invite_event_list: [],
            invited_user: null,

            search_count: 0, // used when search from type username
        };

        this.onEndReachedCalledDuringMomentum = true;
    }

    UNSAFE_componentWillMount() {
        this.refreshProfileImage()
        this.getData();
    }


    /**
      * get asysn storage data
      */
    getData = async () => {
        try {
            pageNumber = 1;
            var userId = await AsyncStorage.getItem(Constants.KEY_USER_ID);
            var userToken = await AsyncStorage.getItem(Constants.KEY_USER_TOKEN);
            var is_verified = await AsyncStorage.getItem(Constants.KEY_IS_VERIFIED);

           
            var searchText = this.props.route.params.searchText;
            this.setState({
                userId: userId,
                userToken: userToken,
                is_verified: is_verified,
                searchText: searchText,
                search_count: 0,
            }, () => this.callSearchUserListAPI(true));
            
        } catch (error) {
            // Error retrieving data
        }
    };

    /*
  * call get guest list API and display content
  */
    callSearchUserListAPI = async (isFirstTime) => {
        try {
            if (isFirstTime) {
                this.setState({
                    loading: true,
                    displayLoadMoreView: false,
                    displayLoadMoreLoader: false
                });
            }
            else {
                this.setState({
                    displayLoadMoreLoader: true,
                });
            }

            let uri = Memory().env == "LIVE" ? Global.URL_SEARCH + pageNumber : Global.URL_SEARCH_DEV + pageNumber

            var netWorth = "0-6";
            var age = "18-60";
            var withIn = "0-100";
            var height = "0-78";
            var weight = "0-61";

            if (userType != null && userType.length < 1) {
                userType = null;
            }
            var jsonData = {
                eyeColor: eyeColor,
                skinColor: skinColor,
                hairColor: hairColor,
                ethnicity: ethnicity,
                maritalStatus: maritalStatus,
                body: body,
                recordPerPage: recordPerPage,
                userType: userType,
                age: age,
                miles: withIn,
                networth: netWorth,
                connection: connection,
                gender: gender,
                height: height,
                weight: weight,
                page: pageNumber,
                keyword: this.state.searchText
            };


            let params = new FormData();
            params.append("token", this.state.userToken);
            params.append("user_id", this.state.userId);
            params.append("format", "json");
            params.append("data", JSON.stringify(jsonData));

            this.setState({
                search_count: this.state.search_count + 1
            })

            console.log(TAG + " callSearchUserListAPI uri " + uri);
            console.log(TAG + " callSearchUserListAPI params " + JSON.stringify(params));

            WebService.callServicePost(
                uri,
                params,
                this.handleSearchUserListResponse
            );
        } catch (error) {
            this.setState({
                loading: false,
                displayLoadMoreView: false,
                displayLoadMoreLoader: false
            });
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    };
    /**
       * handle search uer list API response
       */
    handleSearchUserListResponse = (response, isError) => {
        console.log(TAG + " callSearchUserListAPI Response " + JSON.stringify(response));
        console.log(TAG + " callSearchUserListAPI isError " + isError);

        if (!isError) {
            var result = response;

            if (typeof result != undefined && result != null) {
                if (typeof result.data != undefined && result.data != null) {
                    var mData = result.data.result;
                    if (mData != undefined && mData != null) {
                        mData.map((i, j) => {
                            i.is_connection_request = false;
                        });

                        this.setState({
                            isLoadMoreSearchUser: true,
                        }, () => {
                            pageNumber = pageNumber + 1
                        });
                        if(!this.state.displayLoadMoreView) {
                            this.setState({
                                dataSearchUsersList: mData,
                            });
                        } else {
                            var dataSearchUsersList = this.state.dataSearchUsersList;
                            dataSearchUsersList = [dataSearchUsersList, ...mData];
                            this.setState({
                                dataSearchUsersList: dataSearchUsersList
                            })
                        }
                        this.setState({
                            displaySearchUsers: true,
                            displayLoadMoreView: false,
                            displayLoadMoreLoader: false,
                            isLoadMoreSearchUser: false
                        }, () => {
                            if(this.state.dataSearchUsersList.length > 0) {
                                this.flatListRef.scrollToIndex({animated: true, index: 0});
                            }
                        });
                    }
                }
            }
        } else {
            if (response != undefined && response != null && response.length > 0) {
                Alert.alert(response.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
        if(this.state.search_count > 0) {
            this.setState({
                search_count: this.state.search_count - 1,
            }, () => {
                if(this.state.search_count == 0) {
                    this.setState({
                        loading: false
                    })
                }}
            )
        } else {
            this.setState({
                loading: false
            })
        }
        this.setState({
            displayLoadMoreView: false,
            displayLoadMoreLoader: false
        });

    };


    render() {
        let emptyView = (
            <View style={styles.emptyView}>
                <View style={[styles.cardView, { height: height * 0.7, justifyContent: 'center', alignItems: 'center', }]}>
                    <Text style={[{width: '80%', color:Colors.black, backgroundColor: Colors.transparent, fontSize: 15, textAlign: 'center'}, stylesGlobal.font]}>Your current search and filters do not match any records.</Text>
                </View>
            </View>
        );

        return (
            <View style={{flex: 1, backgroundColor: Colors.black, width: "100%", height: "100%", paddingBottom: bottomPadding}}>
                {this.renderHeaderView()}
                {this.renderBannerView()}
                {this.renderPopupView()}
                {this.state.displaySearchUsers == false ? null : !this.state.dataSearchUsersList.length ? emptyView : this.renderMainView()}
                {this.state.loading == true ? <ProgressIndicator /> : null}
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
            </View>
        );
    }

    renderBannerView = () => {
        return (
            <BannerView
                screenProps = {this.props.navigation}
            />
        )
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
        console.log(TAG + " handleEditComplete searchText " + searchText);
        this.setState({
            searchText: searchText,
        }, () => {
            pageNumber = 1;
            this.callSearchUserListAPI(true)
        });
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
                <TouchableOpacity style={stylesGlobal.header_backbuttonview_style} onPress={() => this.props.navigation.goBack()}>
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
                    <TouchableOpacity style={stylesGlobal.header_searchiconview_style} onPress={() => {
                        if(this.state.searchText == "") {
                            this.refs.searchTextInput.focus();
                        } else {
                            this.setState({searchText: ""}, () => {
                                pageNumber = 1;
                                Keyboard.dismiss();
                                this.callSearchUserListAPI(true)
                            })}}
                        }
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

    renderMainView = () => {
        return (
            <View style={{ flex: 1, width: "100%", height: "100%", alignItems: 'center' }}>
                {this.state.displaySearchUsers == true ? this.renderSearchUsersList : null}
            </View>
        );
    };
    /**
     * display search result data
     */
    get renderSearchUsersList() {

        let footerView = (
            <View style={{backgroundColor: Colors.black, height: 50, justifyContent: 'center', alignItems: 'center'}}>
            {
                this.state.displayLoadMoreLoader == false ? null :
                <Image style = {{width: 50, height: 50}} resizeMode = {'contain'} source={require("../icons/loader.gif")}/>
            }
            </View>
        );

        return (
            <View style={{ flex: 1, marginLeft: 10, marginRight: 10 }}>
                <FlatList
                    ref={(ref) => { this.flatListRef = ref; }}
                    ListFooterComponent={this.state.displayLoadMoreView == true ? footerView : null}
                    extraData={this.state}
                    pagingEnabled={false}
                    showsHorizontalScrollIndicator={false}
                    showsVerticalScrollIndicator={false}
                    data={this.state.dataSearchUsersList}
                    keyExtractor={(item, index) => index.toString()}
                    renderItem={({ item, index }) => (
                        <RowConnection
                            data={item}
                            screenProps={this.props.navigation}
                            is_verified = {item.is_verified}
                            myUserId={this.state.userId}
                            messageButton={true}
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
                                    var myList = this.state.dataSearchUsersList
                                    for(i = 0; i < myList.length; i ++) {
                                        if(myList[i].id == this.state.selected_member.id) {
                                            if(myList[i].following_id) {
                                                myList[i].following_id = null;
                                            } else {
                                                myList[i].following_id = "1";
                                            }
                                            break;
                                        }
                                    }
                                    this.setState({
                                        dataSearchUsersList: myList,
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
                                    var myList = this.state.dataSearchUsersList
                                    for(i = 0; i < myList.length; i ++) {
                                        if(myList[i].id == this.state.selected_member.id) {
                                            if(myList[i].favorite_id) {
                                                myList[i].favorite_id = null;
                                            } else {
                                                myList[i].favorite_id = "1";
                                            }
                                            break;
                                        }
                                    }
                                    this.setState({
                                        dataSearchUsersList: myList,
                                        selected_member: null
                                    })
                                }
                            }}
                            inviteButton = {async(item) => {
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
                        />
                    )}
                    onMomentumScrollBegin={() => { this.onEndReachedCalledDuringMomentum = false; }}
                    onEndReachedThreshold={0.5}
                    onEndReached={({ distanceFromEnd }) => {
                        if (!this.onEndReachedCalledDuringMomentum && this.state.isLoadMoreSearchUser) {
                            this.onEndReachedCalledDuringMomentum = true;
                            this.setState({
                                displayLoadMoreView: true,
                            }, () => {
                                this.getNextSearchUserRecords(), this.setState({
                                    displayLoadMoreLoader: true
                                })
                            })
                        }
                    }}
                    onScroll = {async(e) => {
                        if(e.nativeEvent.contentOffset.y < -80) {
                            pageNumber = 1;
                            this.callSearchUserListAPI(true)
                        }
                    }}
                />
            </View>
        );
    };

    /**
     * auto load pre next data
     */
    getNextSearchUserRecords = () => {

        if (!this.state.loading && !this.state.displayLoadMoreLoader) {
            if (this.state.isLoadMoreSearchUser) {
                this.callSearchUserListAPI(false);
            } else {
                this.setState({
                    isLoadMoreSearchUser: false,
                    displayLoadMoreView: false,
                    displayLoadMoreLoader: false
                })
            }
        }
    }
}

const styles = StyleSheet.create({
    emptyView: {
        backgroundColor: Colors.black,
        justifyContent: "center",
        flex: 1,
        width: "100%",
        height: "100%",
        alignItems: "center",
        alignContent: "center",
        flexDirection: "row"
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
