import React, { Component, Fragment } from 'react'
import { Alert, View, Image, Text, TouchableOpacity, SafeAreaView, Dimensions, Modal, Pressable, Button } from 'react-native'
import { Constants } from "../consts/Constants";
import { Colors } from "../consts/Colors";
import { stylesGlobal, STICKY_HEADER_HEIGHT } from '../consts/StyleSheet'
//import {launchCamera, launchImageLibrary} from 'react-native-image-picker';
import ImagePicker from 'react-native-image-picker';
import * as Global from "../consts/Global";
import WebService from "../core/WebService";
import ProgressIndicator from "./ProgressIndicator";
import Memory from '../core/Memory';
import AsyncStorage from '@react-native-community/async-storage';
import { CropView } from 'react-native-image-crop-tools';
import axios from 'axios';
import { EventRegister } from 'react-native-event-listeners'

const FormData = require('form-data');

var RNFS = require('react-native-fs');

var TAG = "ProfileFullImageScreen";
export default class ProfileFullImageScreen extends Component {

    constructor(props) {
        super(props)
        this.state = {
            userId: "",
            userToken: "",
            currentIndex: 0,
            images: this.props.route.params.tempGalleryUrls,
            origin_image_url: this.props.route.params.tempGalleryUrls[0].image.uri,
            show_image_url: this.props.route.params.tempGalleryUrls[0].image.uri,
            type: this.props.route.params.type,
            loading: false,
            loaded: false,
            show_editview: false,
            image_saved: false,
            image_changed: false,

            set_image_type: '',
            isVisible: false,
            profileImage: null

        }
    }

    UNSAFE_componentWillMount() {
        this.getData();
    }

    getData = async () => {
        try {
            var userId = await AsyncStorage.getItem(Constants.KEY_USER_ID);
            var userToken = await AsyncStorage.getItem(Constants.KEY_USER_TOKEN);
            var hash_key = await AsyncStorage.getItem(Constants.KEY_HASH_KEY);
            this.setState({
                userId: userId,
                userToken: userToken,
            });

        } catch (error) {
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }

        this.callMyProfileDetailAPI();
    };

    onLoad(dataUri) {
        if (dataUri !== undefined) {
            this.setState({ loaded: true });
        }
    }


    getDataAgain = async () => {
        this.callMyProfileDetailAPI();
    }

    callMyProfileDetailAPI = async () => {
        try {
            let uri = Memory().env == "LIVE" ? Global.URL_MY_PROFILE_DETAIL : Global.URL_MY_PROFILE_DETAIL_DEV;
            let params = new FormData();
            params.append("token", this.state.userToken);
            params.append("user_id", this.state.userId);
            params.append("format", "json");
            console.log(TAG + " callMyProfileDetailAPI uri " + uri);
            console.log(TAG + " callMyProfileDetailAPI params " + JSON.stringify(params));
            WebService.callServicePost(uri, params, this.handleGetMyprofileDetailResponse);
        } catch (error) {
            this.setState({ loading: false });
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    };
    handleGetMyprofileDetailResponse = async (response, isError) => {
        // console.log(TAG + " callMyProfileDetailAPI result " + JSON.stringify(response));
        console.log(TAG + " callMyProfileDetailAPI isError " + isError);
        if (!isError) {
            var result = response;
            if (result != undefined && result != null && result.data != undefined && result.data != null) {
                if (result.data.userProfileInfo.imgpath != undefined && result.data.userProfileInfo.imgpath != null) {
                    let userImagePath = result.data.userProfileInfo.imgpath;
                    AsyncStorage.setItem(Constants.KEY_USER_IMAGE_URL, userImagePath);
                    this.setState({
                        userImagePath: userImagePath
                    })
                }

                if (result.data.userProfileInfo.filename != undefined && result.data.userProfileInfo.filename != null) {
                    let userImageName = result.data.userProfileInfo.filename;
                    AsyncStorage.setItem(Constants.KEY_USER_IMAGE_NAME, userImageName);
                    this.setState({
                        userImageName: userImageName
                    })
                }
                this.setState({
                    dataMyProfile: result.data
                });
                await AsyncStorage.setItem(Constants.KEY_MY_PROFILE, JSON.stringify(result.data))
                // this.callGetConnectionList()
            } else {
                this.setState({
                    loading: false
                });
            }
        } else {
            if (response != undefined && response != null && response.length > 0) {
                Alert.alert(response.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
            this.setState({
                loading: false
            });
        }
    };

    render() {
        return (
            <Fragment>

                <SafeAreaView style={{ flex: 0, backgroundColor: Colors.black }} />
                <SafeAreaView style={{ backgroundColor: Colors.black, flex: 1 }}>
                    <View style={[stylesGlobal.headerView,]}>
                        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                            <TouchableOpacity style={stylesGlobal.header_backbuttonview_style}
                                onPress={() => {
                                    if (this.props.route.params && this.props.route.params.getDataAgain && this.state.image_saved) {
                                        this.props.route.params.getDataAgain(true);
                                    }
                                    this.props.navigation.goBack();
                                }}
                            >
                                <Image style={stylesGlobal.header_backbuttonicon_style} source={require("../icons/icon_back.png")} />
                            </TouchableOpacity>
                            <TouchableOpacity style={stylesGlobal.header_logoview_style} onPress={() => this.props.navigation.navigate('Dashboard', { logoclick: true })}>
                                <Image
                                    style={stylesGlobal.header_logo_style}
                                    source={require("../icons/logo_new.png")}
                                />
                            </TouchableOpacity>
                        </View>
                        <View style={{ flex: 1, height: '100%', alignItems: 'center', justifyContent: 'flex-end', flexDirection: 'row' }}>
                            {
                                this.state.image_changed &&
                                <TouchableOpacity style={styles.rightMenu} onPress={() => this.saveImage()}>
                                    <Text style={[styles.pageTitle, stylesGlobal.font]}>Save</Text>
                                </TouchableOpacity>
                            }
                            <TouchableOpacity style={[styles.rightMenu]} onPress={() => {
                                if (this.state.show_editview) {
                                    this.setState({ show_editview: false });
                                } else {
                                    this.setState({ set_Image_type: 'profile' }, () => { this.showimagePicker() });
                                }
                            }}>
                                <Text style={[styles.pageTitle, stylesGlobal.font]}>{this.state.show_editview ? "Revert" : "Change"}</Text>

                            </TouchableOpacity>
                            <TouchableOpacity style={styles.rightMenu}
                                onPress={() => {
                                    if (this.state.show_editview) {
                                        this.saveImage();
                                    } else {
                                        this.setState({
                                            show_editview: true
                                        })
                                    }
                                }
                                }>
                                <Text style={[styles.pageTitle, stylesGlobal.font]}>{this.state.show_editview ? "Save" : "Edit"}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                    {/* {
                    !this.state.show_editview &&
                    <Gallery
                        data={this.state.images}
                        initialPaginationSize={this.state.images.length}
                        initialNumToRender={this.state.currentIndex}
                        initialIndex={this.state.currentIndex}
                        pageSwipe={this.pageSwipe}
                    />
                } */}
                    {
                        !this.state.show_editview &&
                        <View style={{ flex: 1 }}>
                            <Image style={{ width: '100%', height: '100%', resizeMode: 'contain' }} source={{ uri: this.state.show_image_url }}></Image>
                        </View>
                    }
                    {
                        this.state.show_editview &&
                        <View style={{ flex: 1, width: '100%', }}>
                            <View style={{ width: '100%', flexDirection: 'row', justifyContent: 'space-between', position: 'absolute', left: 0, top: 0, zIndex: 10, elevation: 10 }}>
                                <TouchableOpacity style={{ padding: 10, marginStart: 20 }} onPress={() => this.refs.cropViewRef.rotateImage(false)}>
                                    <Image style={{ width: 20, height: 20, resizeMode: 'contain' }} source={require("../icons/rotate_left.png")}></Image>
                                </TouchableOpacity>
                                <TouchableOpacity style={{ padding: 10, marginEnd: 20 }} onPress={() => this.refs.cropViewRef.rotateImage(true)}>
                                    <Image style={{ width: 20, height: 20, resizeMode: 'contain' }} source={require("../icons/rotate_right.png")}></Image>
                                </TouchableOpacity>
                            </View>
                            <View style={{ flex: 1 }}>
                                <CropView
                                    sourceUrl={this.state.show_image_url}
                                    style={{ width: '100%', height: '100%' }}
                                    ref={'cropViewRef'}
                                    onImageCrop={(res) => {
                                        this.setState({
                                            show_image_url: res.uri,
                                            show_editview: false
                                        }, () => {
                                            if (this.state.type == "cover_image") {
                                                this.callUploadCoverImageAPI();
                                            } else {
                                                this.callUploadProfileImageAppAPI(res);
                                            }
                                        })
                                    }}
                                    keepAspectRatio
                                    aspectRatio={this.state.type == "cover_image" ? { width: 3, height: 1 } : { width: 1, height: 1 }}
                                />
                            </View>
                        </View>
                    }
                    {
                        this.state.loading && <ProgressIndicator />
                    }
                </SafeAreaView>
            </Fragment>
        );
    }
    /**
        * update page index
        */
    pageSwipe = (index) => {
        this.setState({
            currentIndex: index
        })
    }

    // showImagePicker = () => {
    //     if(this.state.show_editview) {
    //         this.setState({
    //             show_editview: false,
    //             show_image_url: this.state.origin_image_url
    //         })
    //         return;
    //     }
    //     var options = {
    //         title: 'Select Image',
    //         mediaType: 'photo',
    //         quality: 1.0,
    //         allowsEditing: false,
    //         noData: true,
    //         storageOptions: {
    //             skipBackup: true,
    //             path: 'images'
    //         }
    //     };

    //     ImagePicker.showImagePicker(options, (response) => {
    //         console.log('Response = ', response.type);

    //         if (response.didCancel) {
    //             console.log('User cancelled image picker');
    //         } else if (response.error) {
    //             console.log('ImagePicker Error: ', response.error);
    //         } else if (response.customButton) {
    //             console.log('User tapped custom button: ', response.customButton);
    //         } else {
    //             console.log(TAG, "showImagePicker response==>" + JSON.stringify(response))
    //             let source = { uri: response.uri };
    //             this.setState({
    //                 // images: [{
    //                 //     id: response.uri,
    //                 //     image: { uri: response.uri },
    //                 //     thumb: { uri: response.uri}
    //                 // }],
    //                 show_image_url: response.uri,
    //                 image_changed: true,
    //                 show_editview: false
    //             })
    //         }
    //     });
    // }
    showCameraPicker = (image_type) => {
        console.log(">>>>>>profile", image_type);
        var options = {
            title: 'Select Image',
            mediaType: 'photo',
            quality: 1.0,
            allowsEditing: false,
            noData: true,
            storageOptions: {
                skipBackup: true,
                path: 'images'
            }

        };
        this.setState({ isVisible: !this.state.isVisible })
        ImagePicker.launchCamera(options, (response) => {
            console.log('Response = ', response.type);

            if (response.didCancel) {
                console.log('User cancelled image picker');
            } else if (response.error) {
                console.log('ImagePicker Error: ', response.error);
            } else if (response.customButton) {
                console.log('User tapped custom button: ', response.customButton);
            } else {
                //console.log(TAG, "showImagePicker response==>" + JSON.stringify(response))
                let source = response.assets[0];
                console.log(TAG, "source " + response.assets[0].uri)
                this.setState({
                    // images: [{
                    //     id: response.uri,
                    //     image: { uri: response.uri },
                    //     thumb: { uri: response.uri}
                    // }],
                    profileImage: source,
                    show_image_url: response.assets[0].uri,
                    image_changed: true,
                    show_editview: false
                })
            }
        });
    }

    showimagePicker = (image_type) => {
        console.log(">>>>>>profile", image_type);
        var options = {
            title: 'Select Image',
            mediaType: 'photo',
            quality: 1.0,
            allowsEditing: false,
            noData: true,
            storageOptions: {
                skipBackup: true,
                path: 'images'
            }
        };
        ImagePicker.showImagePicker(options, (response) => {
            console.log('Response = ', response.type);
            if (response.didCancel) {
                console.log('User cancelled image picker');
            } else if (response.error) {
                console.log('ImagePicker Error: ', response.error);
            } else if (response.customButton) {
                console.log('User tapped custom button: ', response.customButton);
            } else {
                //console.log(TAG, "showImagePicker response==>" + JSON.stringify(response))
                //let source = response.assets[0];
                let source = { uri: response.uri };
                // console.log(TAG,"source " + response.assets[0].uri)
                // this.callUploadProfileImageAppAPI(source)
                this.setState({
                    // images: [{
                    //     id: response.uri,
                    //     image: { uri: response.uri },
                    //     thumb: { uri: response.uri}
                    // }],
                    profileImage: response,
                    //show_image_url: response.assets[0].uri,
                    show_image_url: response.uri,
                    image_changed: true,
                    show_editview: false,
                    isVisible: !this.state.isVisible
                })
            }
        });


        // ImagePicker.launchImageLibrary(options, (response) => {

        // });
    }

    saveImage = () => {
        console.log(TAG, 'saveImage', this.refs.cropViewRef)
        if (this.state.show_editview) {
            if (Platform.OS === 'ios')
                this.refs.cropViewRef.saveImage(100);
            else
                this.refs.cropViewRef.saveImage(true, 100);
        } else {
            if (this.state.type == "cover_image") {
                this.callUploadCoverImageAPI();
            } else {
                this.callUploadProfileImageAppAPI(this.state.profileImage);
            }
        }
    }
    // /**
    //      * call Upload Profile Image  API
    //      */
    // callUploadProfileImageAPI = () => {
    //     try {
    //         this.setState({
    //             loading: true
    //         });

    //         let uri = Memory().env == "LIVE" ? Global.URL_UPLOAD_PROFILE_IMAGE : Global.URL_UPLOAD_PROFILE_IMAGE_DEV
    //         let params = new FormData();

    //         params.append("format", "json");
    //         params.append("user_id", this.state.userId);
    //         params.append("token", this.state.userToken);
    //         params.append("key", this.state.hash_key);

    //         var localUriNamePart = this.state.image_uri.split('/');
    //         var fileName = localUriNamePart[localUriNamePart.length - 1];
    //         var localUriTypePart = this.state.image_uri.split('.');
    //         var fileType = localUriTypePart[localUriTypePart.length - 1];
    //         var doc_image = {
    //              uri: upload_data.image_uri,
    //             // // type: `image/${fileType}`,
    //             name: fileName
    //         };

    //         params.append("profile_image", {
    //             uri: this.state.show_image_url,
    //             type: 'image/jpeg',
    //             name: fileName
    //         });

    //         console.log(TAG + " callUploadProfileImageAPI uri " + uri);
    //         console.log(TAG + " callUploadProfileImageAPI params " + JSON.stringify(params));

    //         WebService.callServicePost(
    //             uri,
    //             params,
    //             this.handleUploadProfileImageResponse
    //         );

    //     } catch (error) {
    //         this.setState({
    //             loading: false
    //         });
    //         if (error != undefined && error != null && error.length > 0) {
    //             Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
    //         }
    //     }
    // }

    createFormData = (photo, body = {}) => {
        const data = new FormData();

        console.log(TAG, 'createFormData', JSON.stringify(photo));

        data.append('profile_image', {
            name: photo.fileName,
            type: photo.type,
            uri: Platform.OS === 'ios' ? photo.uri.replace('file://', '') : photo.uri,
        });
        data.append("user_id", this.state.userId);
        data.append("token", this.state.userToken);


        Object.keys(body).forEach((key) => {
            data.append(key, body[key]);
        });

        return data;
    };

    handleUploadPhoto = () => {
        try {
            let uri = Memory().env == "LIVE" ? Global.URL_UPLOAD_PROFILE_IMAGE_DEV_App : Global.URL_UPLOAD_PROFILE_IMAGE_DEV_App

            WebService.callServicePostFormData(
                uri,

                this.createFormData(this.state.profileImage, { userId: '123' }),
                this.handleUploadProfileImageAppResponse
            );

        } catch (error) {
            console.log(error);
            this.setState({
                loading: false
            });
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    }

    /**
         * call Upload Profile Image  API
         */
    callUploadProfileImageAppAPI = async (photo) => {

        this.setState({ loading: true });
        let uri = Memory().env == "LIVE" ? Global.URL_UPLOAD_PROFILE_IMAGE_DEV_App : Global.URL_UPLOAD_PROFILE_IMAGE_DEV_App//"http://192.168.0.149:3300/api/updateProfileImageApp"

        var localUriNamePart = photo.uri.split('/');
        var fileName = localUriNamePart[localUriNamePart.length - 1];
        const data = new FormData();
        data.append('profile_image', {
            name: fileName,
            type: photo.type,
            uri: photo.uri,
            // uri: Platform.OS === 'ios' ? photo.uri.replace('file://', '') : photo.uri,
        });
        data.append("user_id", this.state.userId);
        data.append("token", this.state.userToken);
        console.log(TAG, 'callUploadProfileImageAppAPI uri', JSON.stringify(uri));
        console.log(TAG, 'callUploadProfileImageAppAPI params', JSON.stringify(data));
        await axios.post(uri, data, {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'multipart/form-data',
            }
        })
            // .then(res => res.json())
            .then((resp) => {this.handleUploadProfileImageAppResponse(resp)})
            .catch(error => console.error(TAG, '', error));
    }
    /**
    * Handle Upload Profile Image API
    */
    handleUploadProfileImageAppResponse = async (response, isError) => {
        console.log(TAG + " callUploadProfileImageAPI result " + JSON.stringify(response.data));
        console.log("new URL" + JSON.stringify(response.data.updated_file))
        //this.getData();
        // console.log(TAG + " callUploadProfileImageAPI isError " + isError);
        // {"status":"success","updated_file_id":1630,"updated_file":"https://cdn1.007percent.com/uploads/profile/1649513077065_945_78.jpg"}
        if (!isError) {
            var result = response.data;
            var filename = result.updated_file.split('uploads/profile/').pop()
            console.log(">Filename", filename);
            var profileData = await AsyncStorage.getItem(Constants.KEY_MY_PROFILE);
            AsyncStorage.getItem(Constants.KEY_MY_PROFILE)
                .then(data => {
                    // the string value read from AsyncStorage has been assigned to data
                    console.log(data);
                    // transform it back to an object
                    data = JSON.parse(data);
                    // Decrement
                    console.log(data);
                    //save the value to AsyncStorage again
                    AsyncStorage.setItem(data.userProfileInfo.filename, filename);
                }).done();
            console.log("async storage>>>", profileData);
            // await AsyncStorage.setItem(Constants.KEY_MY_PROFILE, JSON.stringify(result.updated_file))
            if (result != undefined && result != null) {
                if (result.status != "success") {
                    Alert.alert(response.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
                } else {
                    if (this.props.route.params && this.props.route.params.getDataAgain) {
                        this.props.route.params.getDataAgain(true);
                    }
                    this.props.navigation.goBack();

                    await AsyncStorage.setItem(Constants.KEY_USER_IMAGE_NAME, filename);

                    EventRegister.emit(Constants.EVENT_PROFILE_IMAGE_UPDATED);
                    // alert('heoo');
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
     * Handle Upload Profile Image API
     */
    handleUploadProfileImageResponse = (response, isError) => {
        console.log(TAG + " callUploadProfileImageAPI result " + JSON.stringify(response));
        console.log(TAG + " callUploadProfileImageAPI isError " + isError);

        if (!isError) {
            var result = response;
            if (result != undefined && result != null) {
                if (result.status != "success") {
                    Alert.alert(result.msg.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""))
                } else {
                    if (this.props.route.params && this.props.route.params.getDataAgain) {
                        this.props.route.params.getDataAgain(true);
                    }
                    this.props.navigation.goBack();
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
         * call Upload Cvoer Image  API
         */
    callUploadCoverImageAPI = () => {
        try {
            this.setState({
                loading: true
            });

            let uri = Memory().env == "LIVE" ? Global.URL_UPLOAD_COVER_IMAGE : Global.URL_UPLOAD_COVER_IMAGE_DEV

            let params = new FormData();

            params.append("format", "json");
            params.append("user_id", this.state.userId);
            params.append("token", this.state.userToken);
            params.append("photoimg", {
                uri: this.state.show_image_url,
                type: 'image/jpeg',
                name: 'testPhotoName.jpg'
            });

            console.log(TAG + " callUploadCoverImageAPI uri " + uri);
            console.log(TAG + " callUploadCoverImageAPI params " + JSON.stringify(params));

            WebService.callServicePost(
                uri,
                params,
                this.handleUploadCoverImageResponse
            );

        } catch (error) {
            this.setState({
                loading: false
            });
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    }

    /**
     * Handle Upload Cover Image API
     */
    handleUploadCoverImageResponse = (response, isError) => {
        console.log(TAG + " Response " + response);
        console.log(TAG + " isError " + isError);

        if (!isError) {
            var result = response;
            if (result != undefined && result != null) {
                console.log(TAG + " callUploadCoverImageAPI result " + JSON.stringify(result));
                if (result.status != "success") {
                    Alert.alert(result.msg.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""))
                } else {
                    if (this.props.route.params && this.props.route.params.getDataAgain) {
                        this.props.route.params.getDataAgain(true);
                    }
                    this.props.navigation.goBack();
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
};

const styles = {
    container: {
        flex: 1,
        backgroundColor: Colors.black,

    },
    pageTitle: {
        fontSize: 14,
        color: Colors.gold,
        backgroundColor: Colors.transparent
    },
    rightMenu: {
        marginRight: 10
    }
}
