import React, { Component, Fragment } from "react"
import {
    View,
    Text,
    TouchableOpacity,
    Image,
    ScrollView,
    Dimensions,
    Alert,
    Platform,
    TextInput,
    SafeAreaView,
    Keyboard,
    FlatList
} from "react-native"
import { Colors } from "../consts/Colors";
import { Constants } from "../consts/Constants"
import { ImageCompressor } from "./ImageCompressorClass";
import { stylesGlobal, STICKY_HEADER_HEIGHT } from "../consts/StyleSheet"
import ImagePicker from "react-native-image-picker";
import CustomPopupView from "../customview/CustomPopupView";
import ImageResizer from "react-native-image-resizer";
import MultipleImagePicker from "@baronha/react-native-multiple-image-picker";
import axios from "axios";
import Video from 'react-native-video-player';

const { height, width } = Dimensions.get("window");
import ActionButton from "react-native-action-button";
import WebService from "../core/WebService";
import * as Global from "../consts/Global";
import Memory from "../core/Memory";
import BannerView from "../customview/BannerView";

const isIos = Platform.OS === "ios"
const isIphoneX = isIos && (Dimensions.get("window").height === 812 || Dimensions.get("window").height === 896);
const bottomPadding = isIphoneX ? 24 : 0;

import ProgressIndicator from "./ProgressIndicator";
import AsyncStorage from "@react-native-community/async-storage";


const cardWidth = width / 2;
const imageSize = cardWidth - 6;

var TAG = "ShowAlbumImage";
let isRefresh = false;
let image_upload_status = 0;
export default class ShowAlbumImage extends Component {

    state = {
        showModel: false,
        loading: false,
        dataSource: [],
        displayImages: false,
        searchText: "",
        userImagePath: "",
        userImageName: "",
        tempGalleryUrls: [],
        category_array: Global.category_array_others,
        is_portrait: true,
    }

    UNSAFE_componentWillMount() {
        this.refreshProfileImage();
        this.clearData();

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
    }
    /**
     * clear data and refresh list data
     */
    clearData = () => {
        this.setState({
            loading: false,
            dataSource: [],
            tempGalleryUrls: []
        })
        this.callGetAlbumImageAPI();
    }
    /**
     * call get album Image  API
     */
    callGetAlbumImageAPI = () => {
        try {
            this.setState({ loading: true });
            let uri = Memory().env == "LIVE" ? Global.URL_GET_ALBUM_IMAGE + this.props.route.params.albumData.id : Global.URL_GET_ALBUM_IMAGE_DEV + this.props.route.params.albumData.id
            let params = new FormData();
            params.append("format", "json");
            params.append("user_id", this.props.route.params.userId);
            params.append("token", this.props.route.params.userToken);
            console.log(TAG + " callGetAlbumImageAPI uri " + uri);
            console.log(TAG + " callGetAlbumImageAPI params " + JSON.stringify(params));
            WebService.callServicePost(uri, params, this.handleGetAlbumImageResponse);
        } catch (error) {
            this.setState({ loading: false });
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(error.replace(/<\/?[^>]+>/gi, "").replace(/\\n/g, "").replace(/\"/g, ""));
            }
        }
    };

    /**
     * Handle Upload Image API
     */
    handleGetAlbumImageResponse = (response, isError) => {
        // console.log(TAG + " callGetAlbumImageAPI Response " + JSON.stringify(response));
        console.log(TAG + " callGetAlbumImageAPI isError " + isError);

        if (!isError) {
            var result = response;
            if (result != undefined && result != null) {
                var tempGalleryUrls = [];
                console.log(TAG, 'handleGetAlbumImageResponse result', JSON.stringify(result))
                for (var i = 0; i < result.data.albumImages.length; i++) {
                    tempGalleryUrls.push({
                        id: "id_" + i,
                        filetype: result.data.albumImages[i].filetype,
                        image: { uri: result.data.albumImages[i].imgpath + result.data.albumImages[i].filename }
                    })

                    console.log(TAG, 'image url = ', result.data.albumImages[i].imgpath + result.data.albumImages[i].filename)
                }
                this.setState({
                    dataSource: result.data.albumImages,
                    displayImages: true,
                    tempGalleryUrls: tempGalleryUrls
                })
            }
        } else {
            if (response != undefined && response != null && response.length > 0) {
                Alert.alert(response.replace(/<\/?[^>]+>/gi, "").replace(/\\n/g, "").replace(/\"/g, ""));
            }
        }
        this.setState({ loading: false });
    };

    /**
     * call Upload Image  API
     */
    //callUploadImageAPI = (image_uri) => {
    callUploadImageAPI = (objFile) => {
        try {
            this.setState({ loading: true });
            let uri = Memory().env == "LIVE" ? Global.URL_UPLOAD_ALBUM_IMAGE : Global.URL_UPLOAD_ALBUM_IMAGE_DEV;
            const params = new FormData();
            params.append("album_image", {
                uri: objFile.uri,
                name: objFile.filename,
                type: objFile.filetype,
            });
            params.append("format", "json");
            params.append("user_id", this.props.route.params.userId);
            params.append("token", this.props.route.params.userToken);
            params.append("hdn_album_id", this.props.route.params.albumData.id.toString());
            console.log(TAG + " callUploadImageAPI uri " + uri);
            console.log(TAG + " callUploadImageAPI params " + JSON.stringify(params));
            WebService.callServicePostWithFormData(uri, params, this.handleUploadImageResponse);
        } catch (error) {
            // this.setState({ loading: false });
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(error.replace(/<\/?[^>]+>/gi, "").replace(/\\n/g, "").replace(/\"/g, ""));
            }
        }
    };

    // /**
    //  * Handle Upload Image API
    //  */
    handleUploadImageResponse = (response, isError) => {
        console.log(TAG + " callUploadImageAPI Response " + JSON.stringify(response));
        console.log(TAG + " callUploadImageAPI isError " + isError);
        image_upload_status = image_upload_status - 1;
        if (!isError) {
            var result = response;
            if (result != undefined && result != null) {
                console.log(TAG, " handleUploadImageResponse image_upload_status 1: ", image_upload_status);
                if (image_upload_status == 0) {
                    isRefresh = true;
                    this.clearData();
                }
            }

        } else {
            console.log(TAG, " handleUploadImageResponse image_upload_status 2: ", image_upload_status);
            if (response != undefined && response != null && response.length > 0) {
                Alert.alert(response.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
        if (image_upload_status == 0) {
            this.setState({ loading: false });
        }   
    };

    /**
     * call Delete Image API
     */
    callDeleteAlbumAPI = async (fileId) => {
        try {
            let uri = Memory().env == "LIVE" ? Global.URL_REMOVE_ALBUM_IMAGE : Global.URL_REMOVE_ALBUM_IMAGE_DEV

            let params = new FormData();

            this.setState({
                loading: true
            });
            params.append("format", "json");
            params.append("user_id", this.props.route.params.userId);
            params.append("token", this.props.route.params.userToken);
            params.append("file_id", fileId);
            params.append("album_id", this.props.route.params.albumData.id);

            const data = {
                "format": "json",
                "user_id": this.props.route.params.userId,
                "token": this.props.route.params.userToken,
                "file_id": fileId,
                "album_id": this.props.route.params.albumData.id
            }

            console.log(TAG + " callDeleteAlbumAPI uri " + uri);
            console.log(
                TAG + " callDeleteAlbumAPI params " + JSON.stringify(params)
            );

            WebService.callServicePost(
                uri,
                data,
                this.handleDeleteImageResponse
            );

        } catch (error) {
            this.setState({
                loading: false
            });
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(error.replace(/<\/?[^>]+>/gi, "").replace(/\\n/g, "").replace(/\"/g, ""));
            }
        }
    };
    /**
     * Handle Delete Image API
     */
    handleDeleteImageResponse = (response, isError) => {
        console.log(TAG + " callDeleteAlbumAPI Response " + response);
        console.log(TAG + " callDeleteAlbumAPI isError " + isError);

        if (!isError) {
            var result = response;
            if (result != undefined && result != null) {
                isRefresh = true;
                this.clearData()
            }
        } else {
            if (response != undefined && response != null && response.length > 0) {
                Alert.alert(response.replace(/<\/?[^>]+>/gi, "").replace(/\\n/g, "").replace(/\"/g, ""));
            }
        }
        this.setState({
            loading: false
        });
    };


    /**
     * call Set Cover Image API
     */
    callCoverImageAlbumAPI = async (fileId) => {
        try {
            let uri = Memory().env == "LIVE" ? Global.URL_SET_COVER_ALBUM_IMAGE : Global.URL_SET_COVER_ALBUM_IMAGE_DEV

            let params = new FormData();

            this.setState({
                loading: true
            });
            // params.append("format", "json");
            // params.append("user_id", this.props.route.params.userId);
            // params.append("token", this.props.route.params.userToken);
            // params.append("file_id", fileId);
            // params.append("album_id", this.props.route.params.albumData.id);

            const data = {
                "format": "json",
                "user_id": this.props.route.params.userId,
                "token": this.props.route.params.userToken,
                "file_id": fileId,
                "album_id": this.props.route.params.albumData.id
            }

            console.log(TAG + " callCoverImageAlbumAPI uri " + uri);
            console.log(
                TAG + " callCoverImageAlbumAPI params " + JSON.stringify(data)
            );

            WebService.callServicePost(
                uri,
                data,
                this.handleCoverImageResponse
            );

        } catch (error) {
            this.setState({
                loading: false
            });
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(error.replace(/<\/?[^>]+>/gi, "").replace(/\\n/g, "").replace(/\"/g, ""));
            }
        }
    };
    /**
     * Handle Cover Image API
     */
    handleCoverImageResponse = (response, isError) => {
        console.log(TAG + " callCoverImageAlbumAPI Response " + JSON.stringify(response));
        console.log(TAG + " callCoverImageAlbumAPI isError " + isError);

        if (!isError) {
            var result = response;
            if (result != undefined && result != null) {
                isRefresh = true;
                this.clearData()
            }
        } else {
            if (response != undefined && response != null && response.length > 0) {
                Alert.alert(response.replace(/<\/?[^>]+>/gi, "").replace(/\\n/g, "").replace(/\"/g, ""));
            }
        }
        this.setState({
            loading: false
        });
    };


    /**
     * call Set Visibility Image API
     */
    callVisibilityImageAlbumAPI = async (fileId, visibility) => {
        try {
            let uri = Memory().env == "LIVE" ? Global.URL_VISIBILITY_ALBUM_IMAGE : Global.URL_VISIBILITY_ALBUM_IMAGE_DEV

            let params = new FormData();

            this.setState({
                loading: true
            });
            params.append("format", "json");
            params.append("user_id", this.props.route.params.userId);
            params.append("token", this.props.route.params.userToken);
            params.append("file_id", fileId);
            params.append("visibility", visibility);

            console.log(TAG + " callDeleteAlbumAPI uri " + uri);
            console.log(TAG + " callDeleteAlbumAPI params " + JSON.stringify(params));

            WebService.callServicePost(
                uri,
                params,
                this.handleVisibilityImageResponse
            );

        } catch (error) {
            this.setState({
                loading: false
            });
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(error.replace(/<\/?[^>]+>/gi, "").replace(/\\n/g, "").replace(/\"/g, ""));
            }
        }
    };
    /**
     * Handle Visibility Image API
     */
    handleVisibilityImageResponse = (response, isError) => {
        console.log(TAG + " callDeleteAlbumAPI Response " + response);
        console.log(TAG + " callDeleteAlbumAPI isError " + isError);

        if (!isError) {
            var result = response;

            if (result != undefined && result != null) {
                isRefresh = true;
                this.clearData()
            }
        } else {
            if (response != undefined && response != null && response.length > 0) {
                Alert.alert(response.replace(/<\/?[^>]+>/gi, "").replace(/\\n/g, "").replace(/\"/g, ""));
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
                <SafeAreaView style={styles.container}>
                    {this.renderHeaderView()}
                    {this.renderBannerView()}
                    {this.state.displayImages == false ? null : !this.state.dataSource.length ? null : this.renderMainView()}
                    {this.state.loading == false ? this.showUploadButton() : null}
                    {this.state.loading == true ? <ProgressIndicator /> : null}
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
                Alert.alert(error.replace(/<\/?[^>]+>/gi, "").replace(/\\n/g, "").replace(/\"/g, ""));
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

    handleEditComplete = () => {
        searchText = this.state.searchText.trim();
        this.setState({
            searchText: searchText,
        });
        if (searchText.length > 0) {
            this.props.navigation.navigate("Dashboard", { selected_screen: "members", search_text: searchText });
        }
    };

    renderPopupView = () => {
        return (
            <CustomPopupView
                showModel={this.state.showModel}
                openMyAccountScreen={(show_myaccount, myaccount_initial_tab) => { this.props.navigation.navigate("Dashboard", { selected_screen: "myaccount", myaccount_initial_tab: myaccount_initial_tab }) }}
                logoutUser={this.logoutUser}
                closeDialog={() => { this.setState({ showModel: false }) }}
                prop_navigation={this.props.navigation}
            >

            </CustomPopupView>
        );
    }
    /**
     * cdisplay top header
     */
    renderHeaderView = () => {
        let imageUrl = this.state.userImagePath + Constants.THUMB_FOLDER + this.state.userImageName;
        return (
            <View style={stylesGlobal.headerView}>
                <TouchableOpacity style={stylesGlobal.header_backbuttonview_style} onPress={() => {
                    if (isRefresh) {
                        this.props.route.params.getDataAgain()
                    }
                    this.props.navigation.goBack();
                }}
                >
                    <Image style={stylesGlobal.header_backbuttonicon_style} source={require("../icons/icon_back.png")} />
                </TouchableOpacity>
                <TouchableOpacity style={stylesGlobal.header_logoview_style} onPress={() => this.props.navigation.navigate("Dashboard", { logoclick: true })}>
                    <Image style={stylesGlobal.header_logo_style} source={require("../icons/logo_new.png")} />
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
                        autoCapitalize="sentences"
                        onSubmitEditing={this.handleEditComplete}
                        keyboardType="ascii-capable"
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
                            <Image style={stylesGlobal.header_searchicon_style} source={require("../icons/connection-delete.png")} />
                        }
                        {
                            this.state.searchText == "" &&
                            <Image style={stylesGlobal.header_searchicon_style} source={require("../icons/dashboard_search.png")} />
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

    renderMainView = () => {
        return (
            <View style={{ flex: 1, }}>
                <FlatList
                    style={{ width: "100%", }}
                    columnWrapperStyle={{ width: "100%" }}
                    extraData={this.state}
                    numColumns={this.state.is_portrait ? 2 : 4}
                    key={this.state.is_portrait ? 2 : 4}
                    keyExtractor={(item, index) => index.toString()}
                    data={this.state.dataSource}
                    renderItem={({ item, index }) => {
                        return (
                            <View style={{ alignItems: "center", justifyContent: "center", width: this.state.is_portrait ? "50%" : "25%", aspectRatio: 1 }}>
                                {this.renderAlbumItem(item, index)}
                            </View>
                        )
                    }}
                />
            </View>
        );
    }
    /**
      * display album list
      */
    // renderAlbumList = () => {


    //     var len = this.state.dataSource.length;

    //     tempGalleryUrls = [];
    //     for (var i = 0; i < len; i++) {
    //         tempGalleryUrls.push({
    //             id: "id_" + i,
    //             image: { uri: this.state.dataSource[i].imgpath + this.state.dataSource[i].filename }
    //         })
    //     }

    //     var views = [];
    //     for (var i = 0; i < this.state.dataSource.length; i += 2) {

    //         views.push(
    //             <View key={i}>
    //                 <View style={{ flexDirection: "row" }}>
    //                     {this.state.dataSource[i] ? this.renderAlbumItem(0, this.state.dataSource[i], i) : null}
    //                     {this.state.dataSource[i + 1] ? this.renderAlbumItem(1, this.state.dataSource[i + 1], (i + 1)) : null}
    //                 </View>
    //             </View>
    //         )
    //     }


    //     return (
    //         <ScrollView>
    //             {views}
    //         </ScrollView>
    //     );
    // }

    /**
    * display album row data
    */
    renderAlbumItem = (data, index) => {


        console.log(TAG, 'album item', data);
        var url = data.imgpath + data.filename;
        var urlToShow = data.imgpath + data.filename;
        var isVideo = data.filetype.includes('video');
        // console.log(TAG, " urlToShow ", urlToShow);
        var id = data.fileid;
        var isCover = data.is_album_cover;
        var visibility = data.file_visibility;
        var selected_category = 0;
        for (i = 0; i < this.state.category_array.length; i++) {
            if (visibility.toString() == this.state.category_array[i].value.toString()) {
                selected_category = i
                break;
            }
        }
        var show_visibility = data.show_visibility;

        return (
            <TouchableOpacity style={styles.containerRow} onPress={() => {
                this.props.navigation.navigate("ImageZoom", {
                    index: index,
                    tempGalleryUrls: this.state.tempGalleryUrls
                });
            }}>
                {isVideo ? 
                    <View style={{overflow:'hidden', width: '100%', height: '100%'}}>
                        <View style={{position: 'absolute', width: '100%', height: '100%', zIndex: 1000}}></View>
                        <Video
                            ref={ref => this._video = ref}
                            videoWidth={300}
                            videoHeight={300}
                            disableFullscreen
                            autoplay
                            muted
                            loop
                            video={{uri: url}}
                            resizeMode='cover'
                            onLoad={() => {
                                this._video.seek(0);
                                this._video.resume();
                            }}
                            onPlayPress={() => {
                                this._video.resume();
                            }}
                        />
                    </View >
                    :
                    <ImageCompressor style={{ width: "100%", height: "100%" }} uri={urlToShow} default={require("../icons/Background-Placeholder_Camera.png")} />
                
                }
                

                {
                    show_visibility &&
                    <View style={[styles.visibility_container_view, { paddingLeft: 5, paddingTop: 5, paddingRight: 5 }]}>
                        {
                            this.state.category_array.map((item, index) =>
                                <TouchableOpacity style={[styles.visibility_button, selected_category == index ? { backgroundColor: Colors.gold } : { backgroundColor: Colors.black }]}
                                    onPress={() => {
                                        this.callVisibilityImageAlbumAPI(id, item.value.toString())
                                        // this.setState({show_visibility: false, selected_category: index})
                                    }}
                                >
                                    <Image style={{ width: 20, height: 20, marginLeft: 8 }} resizeMethod={"contain"} source={item.icon_path} />
                                    <Text style={[styles.visibility_text, stylesGlobal.font, { marginLeft: 5 }]}>{item.label}</Text>
                                </TouchableOpacity>
                            )
                        }
                    </View>
                }
                <View style={styles.viewRow}>
                    <TouchableOpacity style={styles.iconView}
                        onPress={() => {
                            Alert.alert(Constants.DELETE_ALERT_TITLE, Constants.DELETE_ALERT_MESSAGE,
                                [
                                    {
                                        text: "Yes", onPress: () => {
                                            this.callDeleteAlbumAPI(id)
                                        }
                                    },
                                    {
                                        text: "No", onPress: () => {

                                        }
                                    }],
                                { cancelable: false })

                        }}>

                        <Image style={styles.ageIcon} source={require("../icons/ic_delete.png")} />
                    </TouchableOpacity>

                    {isCover == 1 ?
                        <TouchableOpacity style={styles.submitGold}
                            onPress={() => {

                            }}>
                            <Text style={[styles.submitTextWhite, stylesGlobal.font]}>{"Set as album cover"}</Text>
                        </TouchableOpacity>
                        :

                        <TouchableOpacity style={styles.submitWhite} onPress={() => {
                            this.callCoverImageAlbumAPI(id)
                        }}>
                            <Text style={[styles.submitTextGold, stylesGlobal.font]}>{"Set as album cover"}</Text>
                        </TouchableOpacity>
                    }
                </View>
            </TouchableOpacity>
        );
    }
    /**
    * display upload button
    */
    showUploadButton = () => {
        return (
            <ActionButton
                buttonColor={Colors.gold}
                title="New Task"
                style={{ position: "absolute", right: 10, bottom: 50 }}
                onPress={() => { this.showImagePicker() }}
            />
        );
    }

    /**
    * display image picker view
    */


    showImagePicker = async () => {
        var options = {
            title: "Select Image",
            mediaType: "photo",
            quality: 1.0,
            allowsEditing: false,
            noData: true,
            storageOptions: {
                skipBackup: true,
                path: "images"
            }
        };
        let files = [];
        try{
            const response = await MultipleImagePicker.openPicker(options);
            if (response != null && response != undefined) {

                console.log(TAG, 'file choosing picker result = ', response)
                for (let i = 0; i < response.length; i++) {
                    var newwidth = 0, newheight = 0;
                    if (response[i].width > 2000 || response[i].height > 2000) {
                        if (response[i].width > response[i].height) {
                            newwidth = 2000;
                            newheight = response[i].height * 2000 / response[i].width;
                        } else {
                            newheight = 2000;
                            newwidth = response[i].width * 2000 / response[i].height;
                        }
                        let source = await ImageResizer.createResizedImage(response[i].path, newwidth, newheight, "JPEG", 90);
                        const tmpData = {
                            'uri': source.uri,
                            'filetype': response[i].mime,
                            'filename': response[i].fileName
                        }
                        //uris.push(source.uri);
                        console.log('ffffffff', tmpData)
                        files.push(tmpData);
                    } else {
                        const tmpData = {
                            'uri': response[i].path,
                            'filetype': response[i].mime,
                            'filename': response[i].fileName
                        }
                        //uris.push(source.uri);

                        console.log('feeeeee', tmpData)
                        files.push(tmpData);
                    }
                }
            }
            image_upload_status = files.length;
            console.log(TAG, " image_upload_status : ", image_upload_status, files);
            for (let i = 0; i < files.length; i++) {
                this.callUploadImageAPI(files[i]);
            }
        }catch(e){
            console.log(TAG, e.message, MultipleImagePicker.openPicker)
        }
    }
}

const styles = {
    container: {
        backgroundColor: Colors.white,
        flex: 1,
    },
    submitTextWhite: {
        color: Colors.white,
        backgroundColor: Colors.transparent,
        textAlign: "center",
        fontSize: 8,
        fontWeight: "bold"
    },
    submitGold: {
        padding: 3,
        borderRadius: 4,
        backgroundColor: Colors.gold,
        borderWidth: 1,
        borderColor: Colors.transparent,
        alignItems: "center",
        justifyContent: "center",
        alignSelf: "center",
        height: 20
    },
    submitTextGold: {
        color: Colors.gold,
        backgroundColor: Colors.transparent,
        textAlign: "center",
        fontSize: 8,
        fontWeight: "bold"
    },
    submitWhite: {
        padding: 3,
        borderRadius: 4,
        backgroundColor: Colors.white,
        borderWidth: 1,
        borderColor: Colors.gold,
        alignItems: "center",
        justifyContent: "center",
        alignSelf: "center",
        height: 20
    },
    ageIcon: {
        width: 20,
        height: 20,
        marginRight: 5,
        resizeMode: "contain"
        // tintColor: Colors.white,
    },
    containerRow: {
        width: "100%",
        aspectRatio: 1,
        padding: 2,
    },
    iconView: {
        height: 30,
        width: 30,
        marginRight: 5,
        justifyContent: "center",
        alignContent: "center",
        alignItems: "center",
    },
    viewRow: {
        width: "100%",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "flex-end",
        backgroundColor: Colors.black,
        position: "absolute",
        bottom: 0,
        left: 2,
        paddingRight: 10,
        opacity: 0.80
    },


    visibility_container_view: {
        // width: 120, 
        // height: 75, 
        position: "absolute",
        justifyContent: "space-between",
        // padding: 5, 
        zIndex: 10,
        left: 3,
        bottom: 28,
        backgroundColor: "#ffffff",
        borderRadius: 3,
        borderColor: "#000000",
        borderWidth: 1
    },
    visibility_button: {
        width: 120,
        height: 30,
        flexDirection: "row",
        alignItems: "center",
        borderRadius: 3,
        borderColor: "#000000",
        borderWidth: 1,
        marginBottom: 3
    },
    visibility_text: {
        fontSize: 11,
        color: Colors.white
    },
}
