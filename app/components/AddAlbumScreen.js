import React, { Component, Fragment } from 'react'

import {
    Alert,
    View,
    Dimensions,
    Text,
    TextInput,
    TouchableOpacity,
    Image,
    ScrollView,
    Platform,
    SafeAreaView,
    Keyboard,
    FlatList
} from 'react-native'
import * as ValidationUtils from "../utils/ValidationUtils";
import WebService from "../core/WebService";
import { Colors } from "../consts/Colors";
import * as Global from "../consts/Global";
import ProgressIndicator from "./ProgressIndicator";
import { Constants } from "../consts/Constants";
import { stylesGlobal, STICKY_HEADER_HEIGHT } from '../consts/StyleSheet'
import Memory from '../core/Memory'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { ImageCompressor } from './ImageCompressorClass';
import CustomPopupView from "../customview/CustomPopupView";
import BannerView from "../customview/BannerView";
import AsyncStorage from '@react-native-community/async-storage';
import ModalDropdown from '../custom_components/react-native-modal-dropdown/ModalDropdown';

const { width, height } = Dimensions.get('window')
const cardWidth = (width - 20) / 3;
const imageSize = cardWidth - 5;
var TAG = "AddAlbumScreen";
var cateArray = []

const isIos = Platform.OS === 'ios'
const isIphoneX = isIos && (Dimensions.get('window').height === 812 || Dimensions.get('window').height === 896);
const bottomPadding = isIphoneX ? 24 : 0;

export default class AddAlbumScreen extends Component {
    constructor(props) {
        super(props)

        this.state = {
            showModel: false,
            album_id: '',
            valueEventTitle: '',
            loading: false,
            isEdit: false,
            selected_category: Global.selected_category,
            category_array: Global.category_array_others,

            searchText: '',
            addbutton_click: false,

            dataSource: [],
            selected_category_direct: 0, // used in change visibility from album directly
            is_portrait: true,
        };
    }

    async UNSAFE_componentWillMount() {

        this.refreshProfileImage();

        if (Dimensions.get("window").width < Dimensions.get("window").height) {
            this.setState({
                is_portrait: true,
            })
        } else {
            this.setState({
                is_portrait: false,
            })
        }

        Dimensions.addEventListener("change", () => {
            if (Dimensions.get("window").width < Dimensions.get("window").height) {
                this.setState({
                    is_portrait: true,
                })
            } else {
                this.setState({
                    is_portrait: false,
                })
            }
        })

        try {

            var userId = await AsyncStorage.getItem(Constants.KEY_USER_ID);
            var userToken = await AsyncStorage.getItem(Constants.KEY_USER_TOKEN);
            var userSlug = await AsyncStorage.getItem(Constants.KEY_USER_SLUG);

            this.setState({
                userId: userId,
                userToken: userToken,
                userSlug: userSlug,
            }, () => this.callGetAlbumAPI());

        } catch (error) {
            console.log("error: " + error)
        }
    }

    componentWillUnmount() {
        Dimensions.removeEventListener('change');
    }

    getDataAgain = () => {
        this.callGetAlbumAPI()
    }

    /**
     * display pre data of album in edit mode
     */
    setData = (data) => {

        this.setState({
            album_id: data.id,
            valueEventTitle: data.album_name,
            isEdit: true,
        })
        for (i = 0; i < this.state.category_array.length; i++) {
            if (this.state.category_array[i].value.toString() == data.visibility.toString()) {
                this.setState({
                    selected_category: i
                })
                break;
            }
        }
    }

    clearData() {
        this.setState({
            valueEventTitle: '',
            isEdit: false,
            selected_category: Global.selected_category,

        })
    }

    callGetAlbumAPI = async () => {
        try {
            this.setState({
                loading: true
            });

            let uri = Memory().env == "LIVE" ? Global.URL_GET_ALBUM : Global.URL_GET_ALBUM_DEV
            let params = new FormData();
            params.append("token", this.state.userToken);
            params.append("user_id", this.state.userId);
            params.append("format", "json");

            console.log(TAG + " callGetAlbumAPI uri " + uri);
            console.log(TAG + " callGetAlbumAPI params " + JSON.stringify(params));

            WebService.callServicePost(
                uri,
                params,
                this.handleGetAlbumResponse
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
     * Handle Get Schedule API
     */
    handleGetAlbumResponse = (response, isError) => {
        // console.log(TAG + " handleGetAlbumResponse Response " + JSON.stringify(response));
        console.log(TAG + " handleGetAlbumResponse isError " + isError);

        if (!isError) {
            var result = response;
            if (result != undefined && result != null) {
                if (result.data != undefined && result.data != null) {
                    if (result.data.albumList != undefined && result.data.albumList != null) {


                        console.log('-------  handleGetAlbumResponse   ');


                        let dataSource = result.data.albumList;
                        this.setState({
                            dataSource: dataSource,
                        }, () => {
                            if(this.props.route.params.move2Album)
                                {
                                    console.log('******** go to the pagewwwwwwww', JSON.stringify(this.props.route.params.albumData))

                                    if(dataSource && dataSource.length > 0)
                                    {
                                        var senderItem = dataSource.filter((item, index) => (item.id == this.props.route.params.albumData.album_id));
                                        if(senderItem.length > 0)
                                        {

                                            console.log(TAG, ' -----albumdata----', JSON.stringify(senderItem[0]))
                                            this.props.navigation.navigate('ShowAlbumImage', {
                                                userId: this.state.userId,
                                                userToken: this.state.userToken,
                                                getDataAgain: this.getDataAgain,
                                                albumData: senderItem[0]
                                            })
                                        }
                                    }

                                    
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
        this.setState({
            loading: false
        });
    };

    /**
     * call Album API
     */
    callAlbumAPI = async () => {
        if (ValidationUtils.isEmptyOrNull(this.state.valueEventTitle.trim())) {
            Alert.alert(Constants.EMPTY_ALBUM_NAME, "");
            return;
        }

        try {
            this.setState({ loading: true });
            let uri;
            if (this.state.isEdit) {
                uri = Memory().env == "LIVE" ? Global.URL_UPDATE_ALBUMS : Global.URL_UPDATE_ALBUMS_DEV;
            } else {
                uri = Memory().env == "LIVE" ? Global.URL_ADD_ALBUMS : Global.URL_ADD_ALBUMS_DEV
            }

            let params = new FormData();
            params.append("format", "json");
            params.append("user_id", this.state.userId);
            params.append("token", this.state.userToken);
            params.append("album_name", this.state.valueEventTitle.trim());
            params.append("visibility", this.state.category_array[this.state.selected_category].value);

            if (this.state.isEdit) {
                params.append("hdn_album_id", this.state.album_id);
            }

            console.log(TAG + " callAlbumAPI uri " + uri);
            console.log(TAG + " callAlbumAPI params " + JSON.stringify(params));
            WebService.callServicePost(uri, params, this.handleResponse);
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
     * handle redit or add album API response
     */
    handleResponse = (response, isError) => {
        // console.log(TAG + " callAlbumAPI Response " + JSON.stringify(response));
        console.log(TAG + " callAlbumAPI isError " + isError);
        if (!isError) {
            var result = response;
            if (result != undefined && result != null) {
                var dataSource = this.state.dataSource;
                this.clearData();
                this.setState({
                    addbutton_click: false
                }),
                    this.callGetAlbumAPI();
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

    callDeleteAlbumAPI = async (album_id) => {
        try {

            this.setState({
                loading: true,
                album_id: album_id,
            });

            let uri = Memory().env == "LIVE" ? Global.URL_DELETE_ALBUMS : Global.URL_DELETE_ALBUMS_DEV
            let params = new FormData();
            params.append("token", this.state.userToken);
            params.append("user_id", this.state.userId);
            params.append("format", "json");
            params.append("album_id", album_id);

            console.log(TAG + " callDeleteAlbumAPI uri " + uri);
            console.log(TAG + " callDeleteAlbumAPI params " + JSON.stringify(params));

            WebService.callServicePost(
                uri,
                params,
                this.handleDeleteAlbumResponse
            );
        } catch (error) {
            this.setState({
                loading: false
            });
            console.error(error);
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    };
    /**
     * Handle Delete Album API
     */
    handleDeleteAlbumResponse = (response, isError) => {
        console.log(TAG + " callDeleteAlbumAPI Response " + response);
        console.log(TAG + " callDeleteAlbumAPI isError " + isError);
        if (!isError) {
            var result = response;
            if (result != undefined && result != null) {
                var dataSource = this.state.dataSource;
                for (i = 0; i < dataSource.length; i++) {
                    if (dataSource[i].id == this.state.album_id) {
                        dataSource.splice(i, 1);
                        this.clearData();
                        break;
                    }
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


    render() {
        return (
            <Fragment>
                <SafeAreaView style={{ flex: 0, backgroundColor: Colors.black }} />
                <SafeAreaView style={{ flex: 1, backgroundColor: Colors.black }}>
                    {this.renderHeaderView()}
                    {this.renderBannerView()}
                    {this.renderPopupView()}
                    <View style={styles.card_view}>
                        <View style={{ alignItems: 'center', width: '100%', height: 40, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.card_titlecolor }}>
                            <Text style={[styles.headText, stylesGlobal.font]}>{"GALLERY"}</Text>
                        </View>
                        <KeyboardAwareScrollView style={{ flex: 1 }}
                            extraScrollHeight={20}
                            enableAutomaticScroll={true}
                            keyboardShouldPersistTaps = "handled"
                            keyboardDismissMode="on-drag">
                            {this.renderForm()}
                            {this.state.loading == true ? <ProgressIndicator /> : null}
                        </KeyboardAwareScrollView>
                    </View>
                </SafeAreaView>
            </Fragment>
        );
    }

    renderBannerView = () => {
        return (
            <BannerView
                screenProps={this.props.navigation}
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

            this.props.navigation.navigate("SignInScreen", { isGettingData: false });
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
            this.props.navigation.navigate('Dashboard', { selected_screen: "members", search_text: searchText });
        }
    };

    renderPopupView = () => {
        return (
            <CustomPopupView
                showModel={this.state.showModel}
                openMyAccountScreen={(show_myaccount, myaccount_initial_tab) => { this.props.navigation.navigate('Dashboard', { selected_screen: "myaccount", myaccount_initial_tab: myaccount_initial_tab }) }}
                logoutUser={this.logoutUser}
                closeDialog={() => { this.setState({ showModel: false }) }}
                prop_navigation={this.props.navigation}
            >
            </CustomPopupView>
        );
    }

    /**
     * display top header view
     */
    renderHeaderView = () => {
        let imageUrl = this.state.userImagePath + Constants.THUMB_FOLDER + this.state.userImageName;
        return (
            <View style={stylesGlobal.headerView}>
                <TouchableOpacity style={stylesGlobal.header_backbuttonview_style} onPress={() => { this.props.route.params.getDataAgain(); this.props.navigation.goBack(); }}>
                    <Image style={stylesGlobal.header_backbuttonicon_style} source={require("../icons/icon_back.png")} />
                </TouchableOpacity>
                <TouchableOpacity style={stylesGlobal.header_logoview_style} onPress={() => this.props.navigation.navigate('Dashboard', { logoclick: true })}>
                    <Image
                        style={stylesGlobal.header_logo_style}
                        source={require("../icons/logo_new.png")}
                    />
                </TouchableOpacity>
                <View style={stylesGlobal.header_searchview_style}>
                    <TextInput
                        ref="searchTextInput"
                        autoCorrect={false}
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
                        if (this.state.searchText == "") {
                            this.refs.searchTextInput.focus();
                        } else {
                            Keyboard.dismiss();
                            this.setState({
                                searchText: ""
                            })
                        }
                    }}
                    >
                        {
                            this.state.searchText != "" &&
                            <Image
                                style={stylesGlobal.header_searchicon_style}
                                source={require("../icons/connection-delete.png")}
                            />
                        }
                        {
                            this.state.searchText == "" &&
                            <Image
                                style={stylesGlobal.header_searchicon_style}
                                source={require("../icons/dashboard_search.png")}
                            />
                        }
                    </TouchableOpacity>
                </View>
                <TouchableOpacity style={stylesGlobal.header_avatarview_style} onPress={() => this.setState({ showModel: true })}>
                    <View style={stylesGlobal.header_avatarsubview_style}>
                        <ImageCompressor style={stylesGlobal.header_avatar_style} uri={imageUrl} />
                    </View>
                </TouchableOpacity>
            </View>
        );
    };

    /**
     * display edit or add album form view
     */
    renderForm = () => {
        return (
            <View style={{ flex: 1 }}>
                {
                    !this.state.addbutton_click &&
                    <View style={{ width: '100%', alignItems: 'flex-end', marginTop: 10, marginBottom: 10, }}>
                        <TouchableOpacity style={[{ width: 80, height: 30, marginRight: 10, backgroundColor: Colors.gold, borderRadius: 5, justifyContent: 'center', alignItems: 'center' }, stylesGlobal.shadow_style]}
                            onPress={() => this.setState({ addbutton_click: true })}
                        >
                            <Text style={[stylesGlobal.font, { fontSize: 14, color: Colors.white }]}>{"Add"}</Text>
                        </TouchableOpacity>
                    </View>
                }
                {
                    this.state.addbutton_click &&
                    <View style={{ width: '100%', paddingLeft: 10, paddingRight: 10 }}>
                        <View style={{ width: '100%', justifyContent: 'center', flexDirection: 'row' }}>
                            <View style={[styles.headView, { flex: 1 }]}>
                                <Text style={[styles.headingText, stylesGlobal.font_bold]}><Text style={{ color: Colors.red }}>{"*"}</Text>{"Album name"}</Text>
                                <TextInput
                                    ref='valueEventTitle'
                                    multiline={true}
                                    returnKeyType='default'
                                    numberOfLines={1}
                                    underlineColorAndroid="transparent"
                                    autoCapitalize='sentences'
                                    onChangeText={value => {
                                        this.setState({ valueEventTitle: value })
                                    }}
                                    value={this.state.valueEventTitle}
                                    style={[styles.textInputText, stylesGlobal.font, { flex: 1 }]}
                                    onSubmitEditing={(event) => {

                                    }}
                                    keyboardType='ascii-capable'
                                ></TextInput>
                            </View>
                            <View style={{ width: 80, justifyContent: 'flex-end', alignItems: 'center' }}>
                                <ModalDropdown
                                    dropdownStyle={{ height: 35 * 5 + 5 * 6, paddingLeft: 5, paddingTop: 5, paddingRight: 5, backgroundColor: '#ffffff', borderRadius: 3, borderColor: '#000000', borderWidth: 1 }}
                                    defaultIndex={0}
                                    options={this.state.category_array}
                                    onSelect={(index) => {
                                        this.setState({
                                            selected_category: index
                                        })
                                    }}
                                    renderButton={() => {
                                        return (
                                            <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                                                <Image style={[styles.ageIcon, { width: 30, height: 30, resizeMode: 'contain' }]} source={this.state.category_array[this.state.selected_category].icon_path} />
                                                <Text style={[stylesGlobal.font, { fontSize: 11 }]}>{this.state.category_array[this.state.selected_category].label}</Text>
                                            </View>
                                        )
                                    }}
                                    renderRow={(item, index, highlighted) => {
                                        return (
                                            <View style={[styles.visibility_button, this.state.selected_category == index ? { backgroundColor: Colors.gold } : { backgroundColor: Colors.black }]}>
                                                <Image style={{ width: 20, height: 20, marginLeft: 8 }} resizeMode={'contain'} source={item.icon_path} />
                                                <Text style={[styles.visibility_text, stylesGlobal.font, { marginLeft: 5 }]}>{item.label}</Text>
                                            </View>
                                        )
                                    }}
                                />
                            </View>
                        </View>
                        {this.renderBottomButton()}
                    </View>
                }
                <View style={{ flex: 1 }}>
                    <FlatList
                        style={{ width: '100%', }}
                        columnWrapperStyle={{ width: '100%' }}
                        extraData={this.state}
                        numColumns={this.state.is_portrait ? 3 : 5}
                        key={this.state.is_portrait ? 3 : 5}
                        keyExtractor={(item, index) => index.toString()}
                        data={this.state.dataSource}
                        renderItem={({ item }) => {
                            return (
                                <View style={{ alignItems: 'center', justifyContent: 'center', width: this.state.is_portrait ? '33%' : '20%', aspectRatio: 1 }}>
                                    {this.renderAlbumItem(item)}
                                </View>
                            )
                        }}
                    />
                </View>
            </View>
        );
    }

    /**
     * display bottom cancel and save buttons
     */
    renderBottomButton = () => {
        let cancelButton = (<TouchableOpacity
            style={[styles.submitGold, { margin: 5 }, stylesGlobal.shadow_style]}
            underlayColor="#fff"
            onPress={() => {
                this.clearData();
                this.setState({
                    addbutton_click: false
                })
            }}
        >
            <Text style={[styles.submitTextWhite, stylesGlobal.font]}>Cancel</Text>
        </TouchableOpacity>);

        let saveButton = (<TouchableOpacity
            style={[styles.submitGold, { margin: 5 }, stylesGlobal.shadow_style]}
            underlayColor="#fff"
            onPress={() => this.callAlbumAPI()}
        >
            <Text style={[styles.submitTextWhite, stylesGlobal.font]}>Save</Text>
        </TouchableOpacity>);

        return (
            <View>
                <View style={{ alignItems: "center", flexDirection: 'row', justifyContent: 'center', margin: 40 }}>
                    {cancelButton}
                    {saveButton}
                </View>
            </View>
        );

    };

    /**
    *  display album row data
    */
    renderAlbumItem = (data) => {
        console.log(TAG, "thumnail path ", data,  data.imgpath + data.filename);
        var url = '';
        if (data.imgpath != null && data.filename != null) {
           // url = data.imgpath + Constants.THUMB_FOLDER + data.filename;
             url = data.imgpath + data.filename;
        }
        let current_icon_path = "";
        for (let i = 0; i < this.state.category_array.length; i++) {
            if (this.state.category_array[i].value == data.visibility) {
                // defaultIndex = i;
                current_icon_path = this.state.category_array[i].icon_path;
                break;
            }
        }

        return (
            <TouchableOpacity style={styles.containerRow} onPress={() => {
                this.props.navigation.navigate('ShowAlbumImage', {
                    userId: this.state.userId,
                    userToken: this.state.userToken,
                    getDataAgain: this.getDataAgain,
                    albumData: data
                })
            }}>
                <View style={styles.image}>
                    {
                        url == null &&
                        <Image style={styles.image} resizeMode={"contain"} source={require("../icons/Background-Placeholder_Camera.png")} />
                    }

                    {
                        url != null &&
                        <ImageCompressor style={[styles.image, styles.thumnailImage]} uri={url} resizeMode={"cover"} default={require('../icons/Background-Placeholder_Camera.png')} />
                    }
                </View>
                <View style={{ width: '100%', position: 'absolute', bottom: 0, left: 0, marginLeft: 2}}>
                    <View style={styles.titleView}>
                        <Text style={[{ color: Colors.white }, stylesGlobal.font]} numberOfLines={1}>{data.album_name}</Text>
                    </View>
                    <View style={styles.viewRow}>
                        <ModalDropdown
                            style={styles.iconView}
                            dropdownStyle={{ height: 30 * 5 + 5 * 6, paddingLeft: 5, paddingTop: 5, paddingRight: 5, backgroundColor: '#ffffff', borderRadius: 3, borderColor: '#000000', borderWidth: 1 }}
                            defaultIndex={0}
                            options={this.state.category_array}
                            onSelect={(index) => {
                                var valueEventTitle = "";
                                var selected_category = 0;
                                var album_id = 0;
                                var dataSource = this.state.dataSource;
                                for (let i = 0; i < dataSource.length; i++) {
                                    if (dataSource[i].id == data.id) {
                                        valueEventTitle = dataSource[i].album_name;
                                        selected_category = index;
                                        album_id = dataSource[i].id;
                                        dataSource[i].visibility = this.state.category_array[index].value;
                                        break;
                                    }
                                }
                                this.setState({
                                    dataSource: dataSource,
                                    valueEventTitle: valueEventTitle,
                                    selected_category: selected_category,
                                    album_id: album_id,
                                    isEdit: true
                                }, () => this.callAlbumAPI());

                            }}
                            renderButton={() => {
                                return (
                                    <View style={styles.iconView}>
                                        <Image style={[styles.ageIcon, { width: 20, height: 20, resizeMode: 'contain' }]} source={current_icon_path} />
                                    </View>
                                )
                            }}
                            renderRow={(item, index, highlighted) => {
                                return (
                                    <View style={[styles.visibility_button, { width: 100, height: 30 }, data.visibility == this.state.category_array[index].value ? { backgroundColor: Colors.gold } : { backgroundColor: Colors.black }]}>
                                        <Image style={{ width: 20, height: 20, marginLeft: 8 }} resizeMode={'contain'} source={item.icon_path} />
                                        <Text style={[styles.visibility_text, stylesGlobal.font, { marginLeft: 5, fontSize: 10 }]}>{item.label}</Text>
                                    </View>
                                )
                            }}
                        />
                        <TouchableOpacity style={styles.iconView}
                            onPress={() => {
                                this.setData(data);
                                this.setState({
                                    addbutton_click: true
                                })
                            }}>
                            <Image style={[styles.ageIcon, { width: 20, height: 20, resizeMode: 'contain' }]} source={require("../icons/ic_edit.png")}
                            />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.iconView}
                            onPress={() => Alert.alert(Constants.DELETE_ALBUM_TITLE, Constants.DELETE_ALBUM_MESSAGE_PREFFIX + " '" + data.album_name + "' and all of its images?",
                                [{
                                    text: 'Yes', onPress: () => {
                                        this.callDeleteAlbumAPI(data.id)
                                    }
                                }
                                    , {
                                    text: 'No', onPress: () => {
                                    }
                                }],
                                { cancelable: false })}>
                            <Image style={[styles.ageIcon, { width: 20, height: 20 }]} resizeMode={"contain"} source={require("../icons/ic_delete.png")} />
                        </TouchableOpacity>
                    </View>
                </View>
            </TouchableOpacity>
        );
    }
}

const styles = {
    container: {
        flex: 1,
        padding: 10,
        width: '100%',
        height: '100%',
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
    textInputText: {
        color: Colors.black,
        marginTop: 3,
        padding: 5,
        justifyContent: 'center',
        backgroundColor: Colors.white,
        textAlignVertical: "center",
        fontSize: 13,
        height: 40,
        borderColor: Colors.black,
        borderWidth: 1,
        borderRadius: 2,
    },
    headText: {
        color: Colors.gold,
        fontSize: 20,
    },
    headView: {
        marginTop: 9,
    },
    headingText: {
        color: Colors.black,
        fontSize: 14,
    },
    submitTextWhite: {
        color: Colors.white,
        textAlign: "center",
        fontSize: 14,
    },
    submitGold: {
        // padding: 10,
        // paddingHorizontal: 15,
        paddingVertical: 10,
        width: 120,
        backgroundColor: Colors.gold,
        borderRadius: 5,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'center',
        marginTop: 0,
        marginBottom: 20
    },
    image: {
        width: '100%',
        height: '100%',
    },
    thumnailImage:{
        aspectRatio: 1/1,
        objectFit: 'cover',
        width: '100%'
    },
    iconView: {
        height: 30,
        width: 30,
        marginRight: 5,
        marginLeft: -5,
        justifyContent: 'center',
        alignContent: 'center',
        alignItems: 'center'
    },
    containerRow: {
        width: '100%',
        aspectRatio: 1,
        padding: 2
    },
    titleView: {
        justifyContent: 'flex-start',
        backgroundColor: Colors.black,
        padding: 2,
        opacity: 0.80,
        width: '100%',
    },
    viewRow: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        backgroundColor: Colors.black,
        // padding: 5,
        // marginLeft: 2,
        opacity: 0.80,
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
