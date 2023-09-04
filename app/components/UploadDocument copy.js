import React, { Component } from "react";
import {
    Alert,
    StyleSheet,
    SafeAreaView,
    View,
    TouchableOpacity,
    Image,
    Text,
    ScrollView
} from "react-native";

import { Colors } from "../consts/Colors";
import { Constants } from "../consts/Constants";
import { stylesGlobal, STICKY_HEADER_HEIGHT } from '../consts/StyleSheet';
import ImagePicker from 'react-native-image-picker';
import Memory from '../core/Memory';
import * as Global from "../consts/Global";
import WebService from "../core/WebService";
import ProgressIndicator from "./ProgressIndicator";
import ActionSheet from 'react-native-actionsheet';
import DocumentPicker from 'react-native-document-picker';
import ImageResizer from 'react-native-image-resizer';
import AsyncStorage from '@react-native-community/async-storage';
import { ImageCompressor } from './ImageCompressorClass'


var TAG = "UploadDocument";

var imagepicker_options = {
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

export default class UploadDocument extends React.Component {

    constructor(props) {

        super(props)

        this.state = {
            explain_text: "Every member is verified in person to ensure you only find qualified people inside; that's why we need proof. Please provide scans of the following documents.",
            doc_images: [],
            proofID_doc: null,
            assets_doc: null,
            model_doc: null,
            article_doc: null,
            connection_doc: null,

            userId: "",
            userToken: "",
            userSlug: "",
            userImagePath: "",
            userImageName: "",
            member_plan: "0",
            is_verified: "0",
            hash_key: "",
            user_email: ""
        }

    }

    UNSAFE_componentWillMount() {
        this.getData();
        
    }

    componentWillUnmount() {

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
            var hash_key = await AsyncStorage.getItem(Constants.KEY_HASH_KEY);
            var user_email = await AsyncStorage.getItem(Constants.KEY_USER_EMAIL);

            this.setState({
                userId: userId,
                userToken: userToken,
                userSlug: userSlug,
                userImagePath: userImagePath,
                userImageName: userImageName,
                member_plan: member_plan,
                is_verified: is_verified,
                hash_key: hash_key,
                user_email: user_email
            }, () => this.getUploadedDocment());
        } catch (error) {
            // Error retrieving data
        }
    };

    getUploadedDocment() {
        try {
            this.setState({
                loading: true,
            });

            let uri = Memory().env == "LIVE" ? Global.URL_UPLOAD_DOCUMENT + "?email=" + this.state.user_email + "&key=" + this.state.hash_key : Global.URL_UPLOAD_DOCUMENT_DEV + "?email=" + this.state.user_email + "&key=" + this.state.hash_key ;
            let params = new FormData();
            params.append("token", this.state.userToken);
            params.append("user_id", this.state.userId);
            params.append("key", this.state.hash_key);
            params.append("format", "json");

            console.log(TAG + " callGetUploadDocumentAPI uri " + uri);
            console.log(TAG + " callGetUploadDocumentAPI params " + JSON.stringify(params));

            WebService.callServicePost(uri, params, this.handleGetUploadDocument);
        } catch (error) {
            console.log(TAG + " callUploadDocumentAPI error " + error);
            this.setState({
                loading: false
            });
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    }

    handleGetUploadDocument = (response, isError) => {
        console.log(TAG + " callGetUploadDocumentAPI Response " + JSON.stringify(response));
        console.log(TAG + " callGetUploadDocumentAPI isError " + isError);
        
        if (!isError) {
            var result = response;
            if (result != undefined && result != null) {
                if(result.status.toUpperCase() == "success".toUpperCase()) {
                    if (result.data.documentType != null) {
                        var index = 0;
                        var localUriTypePart = [];
                        var fileType = "";
                        for(i = 0; i < result.data.documentType.length; i ++) {
                            index = parseInt(result.data.documentType[i], 10);
                            if(isNaN(index)) {
                                continue;
                            }
                            if(result.data.documents[index] != null) {
                                localUriTypePart = result.data.documents[index].filename.split('.');
                                fileType = localUriTypePart[localUriTypePart.length - 1];
                                if(index == 0) {
                                    this.setState({
                                        proofID_doc: {
                                            uri: result.data.documents[index].doc_path + result.data.documents[index].filename,
                                            image_type: (fileType.toLowerCase() == "jpg" || fileType.toLowerCase() == "jpeg" || fileType.toLowerCase() == "png") ? true : false 
                                        }
                                    })
                                } else if(index == 2) {
                                    this.setState({
                                        assets_doc: {
                                            uri: result.data.documents[index].doc_path + result.data.documents[index].filename, 
                                            image_type: (fileType.toLowerCase() == "jpg" || fileType.toLowerCase() == "jpeg" || fileType.toLowerCase() == "png") ? true : false 
                                        },
                                    })
                                } else if(index == 3) {
                                    this.setState({
                                        model_doc: {
                                            uri: result.data.documents[index].doc_path + result.data.documents[index].filename, 
                                            image_type: (fileType.toLowerCase() == "jpg" || fileType.toLowerCase() == "jpeg" || fileType.toLowerCase() == "png") ? true : false 
                                        },
                                    })
                                }  else if(index == 5) {
                                    this.setState({
                                        article_doc: {
                                            uri: result.data.documents[index].doc_path + result.data.documents[index].filename, 
                                            image_type: (fileType.toLowerCase() == "jpg" || fileType.toLowerCase() == "jpeg" || fileType.toLowerCase() == "png") ? true : false 
                                        },
                                    })
                                } else if(index == 4) {
                                    this.setState({
                                        connection_doc: {
                                            uri: result.data.documents[index].doc_path + result.data.documents[index].filename, 
                                            image_type: (fileType.toLowerCase() == "jpg" || fileType.toLowerCase() == "jpeg" || fileType.toLowerCase() == "png") ? true : false 
                                        },
                                    })
                                }
                            }
                        }
                    }
                } else {
                    
                }
            }
        } else { 

            if (response != undefined && response != null && response.length > 0) {
                Alert.alert(response.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }

            // Alert.alert(Constants.NO_INTERNET, "");
            // if (response != undefined && response != null && response.length > 0) {
            //     Alert.alert(response.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            // }
        }

        this.setState({
            loading: false
        });
    }

    lunchCamera = () => {
        ImagePicker.launchCamera(imagepicker_options, (response) => {
            console.log('Response = ', response.type);

            if (response.didCancel) {
                console.log('User cancelled image picker');
            } else if (response.error) {
                console.log('ImagePicker Error: ', response.error);
            } else if (response.customButton) {
                console.log('User tapped custom button: ', response.customButton);
            } else {
                let source = { uri: response.uri };
                Image.getSize(source.uri, (width, height) => {
                    var newwidth = 0, newheight = 0;
                    if(width > 2000 || height > 2000) {
                        if(width > height) {
                            newwidth = 2000;
                            newheight = height * 2000 / width
                        } else {
                            newheight = 2000;
                            newwidth = width * 2000 / height
                        }
                        ImageResizer.createResizedImage(source.uri, newwidth, newheight, 'JPEG', 90)
                        .then(({uri}) => {
                            this.setState({
                                doc_images: []
                            }, () => this.upload_document(uri))
                        })
                        .catch(err => {
                            console.log(err);
                            
                        });
                    } else {
                        this.setState({
                            doc_images: []
                        }, () => this.upload_document(source.uri))
                    }
                });
            }
        });
    }

    lunchImageLibrary = () => {
        ImagePicker.launchImageLibrary(imagepicker_options, (response) => {
            console.log('Response = ', response.type);

            if (response.didCancel) {
                console.log('User cancelled image picker');
            } else if (response.error) {
                console.log('ImagePicker Error: ', response.error);
            } else if (response.customButton) {
                console.log('User tapped custom button: ', response.customButton);
            } else {
                let source = { uri: response.uri };
                Image.getSize(source.uri, (width, height) => {
                    var newwidth = 0, newheight = 0;
                    if(width > 2000 || height > 2000) {
                        if(width > height) {
                            newwidth = 2000;
                            newheight = height * 2000 / width
                        } else {
                            newheight = 2000;
                            newwidth = width * 2000 / height
                        }
                        ImageResizer.createResizedImage(source.uri, newwidth, newheight, 'JPEG', 90)
                        .then(({uri}) => {
                            this.setState({
                                doc_images: []
                            }, () => this.upload_document(uri))
                        })
                        .catch(err => {
                            console.log(err);
                        });
                    } else {
                        this.setState({
                            doc_images: []
                        }, () => this.upload_document(source.uri))
                    }
                });
            }
        });
    }

    lunchDocumentPicker = async() => {
        try {
            const response = await DocumentPicker.pick({
              type: [DocumentPicker.types.allFiles],
            });
            console.log(
                response.uri,
                response.type, // mime type
                response.name,
                response.size
            );
            this.setState({
                doc_images: []
            }, () => this.upload_document(response.uri))

        } catch (err) {
            if (DocumentPicker.isCancel(err)) {
                // User cancelled the picker, exit any dialogs or menus and move on
            } else {
                throw err;
            }
        }
    }

    upload_document(image_uri) {
        
        try {
            this.setState({
                loading: true,
            });

            let uri = Memory().env == "LIVE" ? Global.URL_UPLOAD_DOCUMENT + "?email=" + this.state.user_email + "&key=" + this.state.hash_key : Global.URL_UPLOAD_DOCUMENT_DEV + "?email=" + this.state.user_email + "&key=" + this.state.hash_key ;
            let params = new FormData();
            params.append("token", this.state.userToken);
            params.append("user_id", this.state.userId);
            params.append("key", this.state.hash_key);
            params.append("format", "json");

            var localUriNamePart = image_uri.split('/');
            var fileName = localUriNamePart[localUriNamePart.length - 1];
            var localUriTypePart = image_uri.split('.');
            var fileType = localUriTypePart[localUriTypePart.length - 1];
            var doc_image = {
                uri: image_uri,
                // type: `image/${fileType}`,
                name: fileName
            };
            if(this.state.image_type == "proofID") {
                this.setState({
                    proofID_doc: {
                        uri: image_uri, 
                        image_type: (fileType.toLowerCase() == "jpg" || fileType.toLowerCase() == "jpeg" || fileType.toLowerCase() == "png") ? true : false 
                    },
                })
                params.append('document_1[]', doc_image);
                params.append('documentUploadType[]', 0);
            } else if(this.state.image_type == "assets") {
                this.setState({
                    assets_doc: {
                        uri: image_uri, 
                        image_type: (fileType.toLowerCase() == "jpg" || fileType.toLowerCase() == "jpeg" || fileType.toLowerCase() == "png") ? true : false 
                    },
                })
                params.append('document_1[]', doc_image);
                params.append('documentUploadType[]', 2);
            } else if(this.state.image_type == "model") {
                this.setState({
                    model_doc: {
                        uri: image_uri, 
                        image_type: (fileType.toLowerCase() == "jpg" || fileType.toLowerCase() == "jpeg" || fileType.toLowerCase() == "png") ? true : false 
                    },
                })
                params.append('document_1[]', doc_image);
                params.append('documentUploadType[]', 3);
            } else if(this.state.image_type == "article") {
                this.setState({
                    article_doc: {
                        uri: image_uri, 
                        image_type: (fileType.toLowerCase() == "jpg" || fileType.toLowerCase() == "jpeg" || fileType.toLowerCase() == "png") ? true : false 
                    },
                })
                params.append('document_1[]', doc_image);
                params.append('documentUploadType[]', 5);
            } else if(this.state.image_type == "connection") {
                this.setState({
                    connection_doc: {
                        uri: image_uri, 
                        image_type: (fileType.toLowerCase() == "jpg" || fileType.toLowerCase() == "jpeg" || fileType.toLowerCase() == "png") ? true : false 
                    },
                })
                params.append('document_1[]', doc_image).uri;
                params.append('documentUploadType[]', 4);
            }
                
            console.log(TAG + " callUploadDocumentAPI uri " + uri);
            console.log(TAG + " callUploadDocumentAPI params " + JSON.stringify(params));

            WebService.callServicePostWithFormData(uri, params, this.handleUploadDocument);
        } catch (error) {
            console.log(TAG + " callUploadDocumentAPI error " + error);
            this.setState({
                loading: false
            });
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    }

    handleUploadDocument = (response, isError) => {
        console.log(TAG + " callUploadDocumentAPI Response " + JSON.stringify(response));
        console.log(TAG + " callUploadDocumentAPI isError " + isError);
        
        if (!isError) {
            var result = response;
            if (result != undefined && result != null) {
                if(result.status.toUpperCase() == "success".toUpperCase()) {
                    Alert.alert(Constants.UPLOAD_DOC_SUCCESS, "");
                } else {
                    Alert.alert(Constants.NO_INTERNET, "");
                }
            }
        } else { 

            if (response != undefined && response != null && response.length > 0) {
                Alert.alert(response.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
            
            // Alert.alert(Constants.NO_INTERNET, "");
            // if (response != undefined && response != null && response.length > 0) {
            //     Alert.alert(response.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            // }
        }

        this.setState({
            loading: false
        });
    }


    render() {
        return (
            <SafeAreaView style={styles.container}>
            {
                this.state.loading && <ProgressIndicator/>
            }
                <ActionSheet
                    ref={o => this.ActionSheet = o}
                    title={'Choose an Image'}
                    options={['Take Photo...', 'Choose from Library...', 'Choose From Files...', "Cancel"]}
                    cancelButtonIndex={3}
                    onPress={(index) => {
                        console.log(TAG, "index " + index)
                        if (index == 0) {
                            this.lunchCamera();
                        } else if (index == 1) {
                            this.lunchImageLibrary();
                        } else if (index == 2) {
                            this.lunchDocumentPicker();
                        }
                    }}
                />
                <View style = {styles.card_view}>
                    <View style = {{flex: 1, width: '100%', alignItems: 'center'}}>
                        <View style={styles.title_header}>
                            <Text style={[styles.headText, stylesGlobal.font]}>{'CREDENTIALS'}</Text>
                        </View>
                        <View style = {{flex: 1, alignItems: 'center'}}>
                            <ScrollView style = {{width: '100%'}}>
                                <View style = {{width: '100%', marginVertical: 30, paddingHorizontal: 20}}>
                                    <Text style = {[styles.title_text, stylesGlobal.font]}>{this.state.explain_text}</Text>
                                </View>
                            {
                                this.state.member_plan != "7" && this.state.member_plan != "4" && 
                                <TouchableOpacity style = {styles.component_view} onPress={() =>  {this.setState({image_type: "proofID"}); this.ActionSheet.show()}}>
                                    <View style = {{width: 180}}>
                                        <Text style = {[styles.title_text, stylesGlobal.font]}>{'Photo ID'}</Text>
                                    </View>
                                    <View style = {{height: '100%', aspectRatio: 1}}>
                                        <Image style = {{width: '100%', height: '100%', resizeMode: 'contain'}} source = {require('../icons/signup_upload.png')}></Image>
                                    </View>
                                    <View style = {styles.file_checkbox}>
                                        <Image source={require('../icons/square.png')}  style={{width:20, height:20, resizeMode:'contain'}}/>
                                    {
                                        this.state.proofID_doc != null && 
                                        <Image source={require('../icons/checked.png')} style={{position:'absolute', top: 0, left:0, width:20, height:25, resizeMode:'contain'}}/>
                                    }
                                    </View>
                                    <View style = {styles.doc_image_view}>
                                    {
                                        this.state.proofID_doc != null && this.state.proofID_doc.image_type &&
                                        <Image style = {{width: '100%', height: '100%', resizeMode: 'cover'}} source = {{uri: this.state.proofID_doc.uri}}></Image>
                                    }
                                    {
                                        this.state.proofID_doc != null && !this.state.proofID_doc.image_type &&
                                        <Image style = {{width: '100%', height: '100%', resizeMode: 'contain'}} source = {require("../icons/document_empty.png")}></Image>
                                    }
                                    </View>
                                </TouchableOpacity>
                            }
                            {
                                (this.state.member_plan == "1" || this.state.member_plan == "2") &&
                                <TouchableOpacity style = {styles.component_view} onPress={() =>  {this.setState({image_type: "assets"}); this.ActionSheet.show()}}>
                                    <View style = {{width: 180}}>
                                        <Text style = {[styles.title_text, stylesGlobal.font]}>{'Proof of Assets'}</Text>
                                    </View>
                                    <View style = {{height: '100%', aspectRatio: 1}}>
                                        <Image style = {{width: '100%', height: '100%', resizeMode: 'contain'}} source = {require('../icons/signup_upload.png')}></Image>
                                    </View>
                                    <View style = {styles.file_checkbox}>
                                        <Image source={require('../icons/square.png')}  style={{width:20, height:20, resizeMode:'contain'}}/>
                                    {
                                        this.state.assets_doc != null && 
                                        <Image source={require('../icons/checked.png')} style={{position:'absolute', top: 0, left:0, width:20, height:25, resizeMode:'contain'}}/>
                                    }
                                    </View>
                                    <View style = {styles.doc_image_view}>
                                    {
                                        this.state.assets_doc != null && this.state.assets_doc.image_type &&
                                        <Image style = {{width: '100%', height: '100%', resizeMode: 'cover'}} source = {{uri: this.state.assets_doc.uri}}></Image>
                                    }
                                    {
                                        this.state.assets_doc != null && !this.state.assets_doc.image_type &&
                                        <Image style = {{width: '100%', height: '100%', resizeMode: 'contain'}} source = {require("../icons/document_empty.png")}></Image>
                                    }
                                    </View>
                                </TouchableOpacity>
                            }
                            {
                                (this.state.member_plan == "3") &&
                                <TouchableOpacity style = {styles.component_view} onPress={() =>  {this.setState({image_type: "model"}); this.ActionSheet.show()}}>
                                    <View style = {{width: 180}}>
                                        <Text style = {[styles.title_text, stylesGlobal.font]}>{'Modeling Publication'}</Text>
                                    </View>
                                    <View style = {{height: '100%', aspectRatio: 1}} >
                                        <Image style = {{width: '100%', height: '100%', resizeMode: 'contain'}} source = {require('../icons/signup_upload.png')}></Image>
                                    </View>
                                    <View style = {styles.file_checkbox}>
                                        <Image source={require('../icons/square.png')}  style={{width:20, height:20, resizeMode:'contain'}}/>
                                    {
                                        this.state.model_doc != null && 
                                        <Image source={require('../icons/checked.png')} style={{position:'absolute', top: 0, left:0, width:20, height:25, resizeMode:'contain'}}/>
                                    }
                                    </View>
                                    <View style = {styles.doc_image_view}>
                                    {
                                        this.state.model_doc && this.state.model_doc.image_type &&
                                        <Image style = {{width: '100%', height: '100%', resizeMode: 'cover'}} source = {{uri: this.state.model_doc.uri}}></Image>
                                    }
                                    {
                                        this.state.model_doc && !this.state.model_doc.image_type &&
                                        <Image style = {{width: '100%', height: '100%', resizeMode: 'contain'}} source = {require("../icons/document_empty.png")}></Image>
                                    }
                                    </View>
                                </TouchableOpacity>
                            }
                            {
                                (this.state.member_plan == "6") &&
                                <TouchableOpacity style = {styles.component_view} onPress={() =>  {this.setState({image_type: "article"}); this.ActionSheet.show()}}>
                                    <View style = {{width: 180}}>
                                        <Text style = {[styles.title_text, stylesGlobal.font]}>{'Recent Newspaper Article'}</Text>
                                    </View>
                                    <View style = {{height: '100%', aspectRatio: 1}}>
                                        <Image style = {{width: '100%', height: '100%', resizeMode: 'contain'}} source = {require('../icons/signup_upload.png')}></Image>
                                    </View>
                                    <View style = {styles.file_checkbox}>
                                        <Image source={require('../icons/square.png')}  style={{width:20, height:20, resizeMode:'contain'}}/>
                                    {
                                        this.state.article_doc != null && 
                                        <Image source={require('../icons/checked.png')} style={{position:'absolute', top: 0, left:0, width:20, height:25, resizeMode:'contain'}}/>
                                    }
                                    </View>
                                    <View style = {styles.doc_image_view}>
                                    {
                                        this.state.article_doc != null && this.state.article_doc.image_type &&
                                        <Image style = {{width: '100%', height: '100%', resizeMode: 'cover'}} source = {{uri: this.state.article_doc.uri}}></Image>
                                    }
                                    {
                                        this.state.article_doc != null && !this.state.article_doc.image_type &&
                                        <Image style = {{width: '100%', height: '100%', resizeMode: 'contain'}} source = {require("../icons/document_empty.png")}></Image>
                                    }
                                    </View>
                                </TouchableOpacity>
                            }
                            {
                                (this.state.member_plan == "5") &&
                                <TouchableOpacity style = {styles.component_view} onPress={() =>  {this.setState({image_type: "connection"}); this.ActionSheet.show()}}>
                                    <View style = {{width: 180}}>
                                        <Text style = {[styles.title_text, stylesGlobal.font]}>{'Explanation of Connections'}</Text>
                                    </View>
                                    <View style = {{height: '100%', aspectRatio: 1}}>
                                        <Image style = {{width: '100%', height: '100%', resizeMode: 'contain'}} source = {require('../icons/signup_upload.png')}></Image>
                                    </View>
                                    <View style = {styles.file_checkbox}>
                                        <Image source={require('../icons/square.png')}  style={{width:20, height:20, resizeMode:'contain'}}/>
                                    {
                                        this.state.connection_doc != null && 
                                        <Image source={require('../icons/checked.png')} style={{position:'absolute', top: 0, left:0, width:20, height:25, resizeMode:'contain'}}/>
                                    }
                                    </View>
                                    <View style = {styles.doc_image_view}>
                                    {
                                        this.state.connection_doc != null && this.state.connection_doc.image_type &&
                                        <Image style = {{width: '100%', height: '100%', resizeMode: 'cover'}} source = {{uri: this.state.connection_doc.uri}}></Image>
                                    }
                                    {
                                        this.state.connection_doc != null && !this.state.connection_doc.image_type &&
                                        <Image style = {{width: '100%', height: '100%', resizeMode: 'contain'}} source = {require("../icons/document_empty.png")}></Image>
                                    }
                                    </View>
                                </TouchableOpacity>
                            }
                            </ScrollView>
                        </View>
                    </View>
                </View>
            </SafeAreaView>
        );
    }
 

}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: "100%",
        height: "100%",
        backgroundColor: Colors.black,
        alignItems: 'center',
        justifyContent: 'center'
    },
    card_view: {
        width: '90%',
        height: '90%',
        alignItems: 'center',
        backgroundColor: Colors.white,
        borderRadius: 10,
        shadowColor: Colors.white,
        shadowOffset: {
            width: 0,
            height: 0
        },
        shadowRadius: 7,
        shadowOpacity: 7.0,
    },
    title_header: { 
        width: '100%', 
        height: 40, 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: Colors.card_titlecolor,
        borderTopRightRadius: 10,
        borderTopLeftRadius: 10,
        overflow: 'hidden'
    },
    headText: {
        color: Colors.gold,
        fontSize: 20,
        // fontWeight: 'bold'
    },
    component_view: {
        width: '95%', 
        height: 25,
        marginBottom: 30,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center'
    },
    title_text: {
        fontSize: 14, 
        color: Colors.black,
    },
    text_input_style: {
        width: '100%', 
        height: 40, 
        marginTop: 10, 
        borderColor: Colors.black, 
        borderWidth: 0.5, 
        borderRadius: 3, 
        paddingLeft: 5
    },
    button_style: {
        // width: '50%',
        // height: 40,
        marginTop: 30,
        backgroundColor: Colors.gold,
        borderRadius: 5,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal:30,
        paddingVertical:10
    },
    button_text: {
        fontSize: 14,
        color: Colors.white,
        
    },
    file_checkbox: {
        width: 20, 
        height: '100%', 
        justifyContent: 'center', 
        marginLeft: 10,
    },
    doc_image_view: {
        width: 40,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginStart: 10
    }
});
