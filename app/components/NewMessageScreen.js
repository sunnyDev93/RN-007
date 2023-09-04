import React, { Component } from "react";
import {
    Alert,
    Platform,
    StyleSheet,
    View,
    FlatList,
    Image,
    TouchableOpacity,
    TextInput,
    Text,
    ActivityIndicator,
    Dimensions,
    Keyboard,
    SafeAreaView,
} from "react-native";
const { height, width } = Dimensions.get("window");
import RowNewMessage from "./RowNewMessage";
import WebService from "../core/WebService";
import { Constants } from "../consts/Constants";
import { Consts } from "../consts/Consts";
import { Colors } from "../consts/Colors";
import * as Global from "../consts/Global";
import ProgressIndicator from "./ProgressIndicator";
import { stylesGlobal } from '../consts/StyleSheet'
import Memory from '../core/Memory';
import BannerView from "../customview/BannerView";
import AsyncStorage from '@react-native-community/async-storage';

var imageSize = 60;
var cardPadding = 10;
var searchText = "";
var recordPerPage = "60";
var connection = "";
var pageNumber = 0;
var array_Connections_list = [];

var TAG = "NewMessageScreen";
export default class NewMessageScreen extends React.Component {

    constructor(props) {
        super(props);
        type = this.props.type;
        this.state = {
            userId: "",
            userToken: "",
            loading: true,
            openSearchBar: true,
            searchText: "",
            searchApply: false,
            dataConnectionList: array_Connections_list,
            displayConnectionList: false,
            isLoadMoreConnections: true,
            displayLoadMoreView: false,
            displayLoadMoreLoader: false,

            chat_help_show: "false",
            member_plan: '0',
        };
    }

    UNSAFE_componentWillMount = async() => {
        console.log(TAG + " componentWillMount ");
        // try {
        //     var chat_help_show = await AsyncStorage.getItem(Constants.KEY_CHAT_MODAL);
        //     this.setState({
        //         chat_help_show: chat_help_show
        //     })
        // } catch(error) {

        // }
        pageNumber = 0;
        this.clearStateData();
        this.getData();
    }

    componentDidMount() {
        this.refs.searchTextInput.focus();
    }


    /**
    *  clear state data
    */
    clearStateData = () => {
        
        array_Connections_list = [];
        this.setState({
            userId: "",
            userToken: "",
            loading: true,
            dataConnectionList: array_Connections_list,
            displayConnectionList: false,
            isLoadMoreConnections: true,
            displayLoadMoreView: false,
            displayLoadMoreLoader: false,
        });
    };
    /**
    *  get asysnc storage data
    */
    getData = async () => {
        
        try {
            var userId = await AsyncStorage.getItem(Constants.KEY_USER_ID);
            var userToken = await AsyncStorage.getItem(Constants.KEY_USER_TOKEN);
            var member_plan = await AsyncStorage.getItem(Constants.KEY_MEMBER_PLAN);
            this.setState({
                userId: userId,
                userToken: userToken,
                member_plan: member_plan
            });
            
            if (this.state.searchApply) {
                this.callSearchFriendListAPI(true);
            } else {
                this.callMyConnectionsListAPI(true);
            }

        } catch (error) {
            // Error retrieving data
        }
    };

    /*
     * call get connection list API and display content
     */
    callMyConnectionsListAPI = async (isFirstTime) => {
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

            let uri = Memory().env == "LIVE" ? Global.URL_MY_CONNECTION + pageNumber : Global.URL_MY_CONNECTION_DEV + pageNumber
            let params = new FormData();
            params.append("token", this.state.userToken);
            params.append("user_id", this.state.userId);
            params.append("format", "json");

            console.log(TAG + " callMyConnectionsListAPI uri " + uri);
            console.log(TAG + " callMyConnectionsListAPI params " + JSON.stringify(params));

            WebService.callServicePost(
                uri,
                params,
                this.handleMyConnectionListResponse
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
    *  handle my connection API response
    */
    handleMyConnectionListResponse = (response, isError) => {
        console.log(TAG + " callMyConnectionsListAPI Response " + response);
        console.log(TAG + " callMyConnectionsListAPI isError " + isError);

        if (!isError) {
            var result = response;
            if (typeof result != undefined && result != null) {
                if (typeof result.data != undefined && result.data != null) {
                    var mData = result.data;
                    var mConnectionRequest = result['connection-request'];
                    if (mConnectionRequest != undefined && mConnectionRequest != null) {
                        mConnectionRequest.map((i, j) => {
                            i.is_connection_request = true;
                            array_Connections_list.push(i);
                        });
                    }
                    if (mData.length > 0) {
                        mData.map((i, j) => {
                            i.is_connection_request = false;
                            array_Connections_list.push(i);
                        });

                        this.setState({
                            isLoadMoreConnections: true,
                        }, () => {
                            pageNumber = pageNumber + 1
                        });
                    } else {
                        this.setState({
                            isLoadMoreConnections: false
                        });
                    }
                    if (array_Connections_list.length > 0) {
                        this.setState({
                            dataConnectionList: array_Connections_list,
                            displayConnectionList: true,
                            displayLoadMoreView: false,
                            displayLoadMoreLoader: false
                        });
                    } else {
                        array_Connections_list = [];
                        this.setState({
                            displayConnectionList: false,
                            displayLoadMoreView: false,
                            displayLoadMoreLoader: false
                        });
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
            displayLoadMoreView: false,
            displayLoadMoreLoader: false
        });
    };


    /*
    * call get connection list API and display content
    */
    callSearchFriendListAPI = async (isFirstTime) => {
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

            var netWorth = "0-4";
            var age = "18-60";
            var withIn = "0-100";
            var height = "0-78";
            var weight = "0-61";

            

            var jsonData = {
                // recordPerPage: recordPerPage,
                // age: age,
                // miles: withIn,
                // networth: netWorth,
                // connection: connection,
                // height: height,
                // weight: weight,
                eyeColor: '',
                skinColor: '',
                hairColor: '',
                ethnicity: '',
                maritalStatus: '',
                body: '',
                recordPerPage: '',
                userType: '',
                age: '',
                miles: '',
                networth: '',
                connection: '',
                gender: '',
                height: '',
                weight: '',

                page: pageNumber,
                keyword: this.state.searchText
            };


            let params = new FormData();
            params.append("token", this.state.userToken);
            params.append("user_id", this.state.userId);
            params.append("format", "json");
            params.append("data", JSON.stringify(jsonData));

            console.log(TAG + " callSearchFriendListAPI uri " + uri);
            console.log(TAG + " callSearchFriendListAPI params " + JSON.stringify(params));

            WebService.callServicePost(
                uri,
                params,
                this.handleSearchFriendResponse
            );
        } catch (error) {
            console.log(TAG + " callSearchFriendListAPI error " + error);
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
    *  handle search connection API response
    */
    handleSearchFriendResponse = (response, isError) => {
        console.log(TAG + " Response " + response);
        console.log(TAG + " isError " + isError);

        if (!isError) {
            var result = response;


            if (result != undefined && result != null) {
                console.log(TAG + " callSearchFriendListAPI result " + JSON.stringify(result));
                if (result.data != undefined && result.data != null && result.data.result != undefined && result.data.result != null) {
                    var mData = result.data.result;

                    if (mData.length > 0) {
                        mData.map((i, j) => {
                            i.is_connection_request = false;
                            array_Connections_list.push(i);
                        });

                        this.setState({
                            isLoadMoreConnections: true,
                        }, () => {
                            pageNumber = pageNumber + 1
                        });

                    } else {
                        this.setState({
                            isLoadMoreConnections: false
                        });
                    }

                    if (array_Connections_list.length > 0) {
                        console.log(TAG + " This is render data now " + array_Connections_list.length);
                        this.setState({
                            dataConnectionList: array_Connections_list,
                            displayConnectionList: true,
                            displayLoadMoreView: false,
                            displayLoadMoreLoader: false
                        });
                    } else {
                        console.log(TAG + " This is render data now11 ");
                        array_Connections_list = [];
                        this.setState({
                            displayConnectionList: false,
                            displayLoadMoreView: false,
                            displayLoadMoreLoader: false
                        });
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
            displayLoadMoreView: false,
            displayLoadMoreLoader: false
        });
    };

    render() {

        let emptyView = (
            <View style={styles.emptyView}>
                <Text style={[{width: width, color: Colors.black, fontSize: 14, textAlign:'center'}, stylesGlobal.font]}>{"No Results"}</Text>
            </View>
        );

        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: Colors.black }}>
                {this.renderHeaderView()}
                {this.renderBannerView()}
                {/* {this.renderGroupCreateView()} */}
                {this.state.loading == true ? null : !this.state.dataConnectionList.length ? emptyView : this.renderMainView()}
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
    *  display top header
    */
    renderHeaderView = () => {

        return (
            <View style={stylesGlobal.headerView}>
                <TouchableOpacity style={stylesGlobal.header_backbuttonview_style} onPress={() => this.props.navigation.goBack()}>
                    <Image style = {stylesGlobal.header_backbuttonicon_style} source={require("../icons/icon_back.png")}/>
                </TouchableOpacity>
                <TouchableOpacity style={stylesGlobal.header_logoview_style} onPress = {() => this.props.navigation.navigate('Dashboard', {logoclick: true})}>
                    <Image
                        style={stylesGlobal.header_logo_style}
                        source={require("../icons/logo_new.png")}
                    />
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
                        placeholder="Search members..."
                        onSubmitEditing={this.handleEditComplete}
                        keyboardType='ascii-capable'
                    />
                    <TouchableOpacity style={stylesGlobal.header_searchiconview_style} onPress = {() => {
                        if(this.state.searchText == "") {
                            this.refs.searchTextInput.focus();
                        } else {
                            Keyboard.dismiss();
                            this.setState({
                                searchText: ""
                            }, () => this.handleEditComplete())
                        }}}
                    >
                    {
                        this.state.searchText != "" &&
                        <Image
                            style = {stylesGlobal.header_searchicon_style}
                            source={require("../icons/connection-delete.png")}
                        />
                    }
                    {
                        this.state.searchText == "" &&
                        <Image
                            style = {stylesGlobal.header_searchicon_style}
                            source={require("../icons/dashboard_search.png")}
                        />
                    }
                    </TouchableOpacity>
                </View>
                {/* <TouchableOpacity style={stylesGlobal.header_avatarview_style} onPress={() => this.closeSearchEditor()}>
                    <View style={stylesGlobal.header_avatarsubview_style}>
                        <Image style={{ tintColor: Colors.gold, width: 30, height: 30 }} source={require("../icons/ic_close_white.png")}/>
                    </View>
                </TouchableOpacity> */}

            </View>
        );
    };
    /**
    *  display group create view
    */
    renderGroupCreateView = () => {
        return (
            <View>
                <TouchableOpacity
                    onPress={() => {
                        const { navigate } = this.props.navigation;
                        navigate("CreateGroup", {
                            refreshList: this.updateRecentChatList
                        });
                    }}
                >
                    <View style={styles.groupContainer}>

                        <View style={styles.userImageContainer}>
                            <Image
                                style={styles.userImage}
                                source={require("../icons/icon_create_group.png")}
                            />
                        </View>


                        <Text style={[styles.name, stylesGlobal.font]}>New Group</Text>
                    </View>
                </TouchableOpacity>
                <View style={styles.separator} />
            </View>
        )
    }
    renderMainView = () => {
        return (
            <View style={{ flex: 1, width: "100%", height: "100%" }}>
                {this.state.displayConnectionList == true
                    ? this.renderConnectionList
                    : null}
            </View>
        );
    };
    /**
    *  display userlist
    */
    get renderConnectionList() {
        let footerView = (
            <View style={{backgroundColor: Colors.white, height: 50, justifyContent: 'center', alignItems: 'center'}}>
                {this.state.displayLoadMoreLoader == false ? null :
                    <ActivityIndicator
                        animating={true}
                        color={Colors.gold}
                        size="large"
                        style={{ width: 30, height: 30, }} />
                }

            </View>
        );

        return (
            <View style={{ flex: 1 }}>
                <FlatList
                    ListFooterComponent={this.state.displayLoadMoreView == true ? footerView : null}
                    extraData={this.state}
                    pagingEnabled={false}
                    showsHorizontalScrollIndicator={false}
                    showsVerticalScrollIndicator={false}
                    data={this.state.dataConnectionList}
                    keyExtractor={(item, index) => index}
                    renderItem={({ item, index }) => (
                        <RowNewMessage
                            data={item}
                            screenProps={this.props.navigation}
                            index={index}
                            memmber_plan = {this.state.member_plan}
                            refreshList={this.updateRecentChatList}
                            userId={this.state.userId}
                            refreshProfileImage={this.refreshProfileImage}
                            chatUserList={this.props.route.params.chatUserList}
                        />
                    )}
                    onEndReachedThreshold={1}
                    onEndReached={({ distanceFromEnd }) => {
                        if (this.state.isLoadMoreConnections) {
                            this.setState({
                                displayLoadMoreView: true,
                            }, () => {
                                this.getNextConnectionRecords(), this.setState({
                                    displayLoadMoreLoader: true
                                })
                            })
                        }
                    }}
                />
            </View>
        );
    };

    refreshProfileImage = async () => {

    }
    /**
    *  auto load next record
    */
    getNextConnectionRecords = () => {

        if (!this.state.loading && !this.state.displayLoadMoreLoader) {
            console.log("getNextConnectionRecords called");
            if (this.state.isLoadMoreConnections) {
                console.log("getNextConnectionRecords called 1");
                if (this.state.searchApply) {
                    this.callSearchFriendListAPI(false);
                } else {
                    this.callMyConnectionsListAPI(false);
                }
            } else {
                console.log("getNextConnectionRecords called 3");
                this.setState({
                    isLoadMoreConnections: false,
                    displayLoadMoreView: false,
                    displayLoadMoreLoader: false
                })
            }
        }

    }
    /**
    *  open searc hview
    */
    openSearchEditor = () => {
        this.setState({
            openSearchBar: true,
            searchText: ""
        }, () => {
            this.refs.searchTextInput.focus();
        });
    };
    /**
    *  close search view
    */
    closeSearchEditor = () => {
        if (this.state.searchText.trim().length != 0) {
            this.setState({
                ...this.state,
                openSearchBar: true,
                searchText: ""
            }, () => {
                
                this.handleEditComplete();
            });
        }
    };
    /**
    *  search button click
    */
    handleEditComplete = () => {
        searchText = this.state.searchText.trim().toLowerCase();
        
        this.setState({
            searchText: searchText,
        });
        if (searchText.length == 0) {
            pageNumber = 0;
            this.setState({
                searchApply: false
            });
        } else {
            pageNumber = 1;
            this.setState({
                searchApply: true
            });
        }
        this.clearStateData();
        this.getData();
    };
    /**
    *  refresh list data
    */
    updateRecentChatList = (isRefresh) => {
        console.log(TAG, "updateRecentChatList isRefresh " + isRefresh)
        if (isRefresh) {
            this.props.navigation.goBack();
            this.props.route.params.refreshList(true);
        }
    };
}

const styles = StyleSheet.create({
    emptyView: {
        backgroundColor: Colors.white,
        justifyContent: "center",
        flex: 1,
        width: "100%",
        height: "100%",
        alignItems: "center",
        alignContent: "center",
    },
    groupContainer: {
        backgroundColor: Colors.white,
        padding: cardPadding,
        flexDirection: "row"
    },
    userImageContainer: {
        backgroundColor: Colors.gold,
        width: imageSize,
        height: imageSize,
        borderRadius: imageSize / 2,
        justifyContent: 'center',
        alignItems: 'center'
    },
    userImage: {
        resizeMode: "cover",
        backgroundColor: Colors.transparent,
        width: imageSize / 2,
        height: imageSize / 2,
        tintColor: Colors.white
    },
    separator: {
        height: 5,
        width: "100%",
        backgroundColor: Colors.gold
    },
    name: {
        fontSize: 15,
        color: Colors.black,
        backgroundColor: Colors.transparent,
        marginLeft: 10,
        alignSelf: "center"
    },
});
