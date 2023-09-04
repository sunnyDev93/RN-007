import React, { Component } from "react";
import {
    Alert,
    StyleSheet,
    SafeAreaView,
    View,
    TouchableOpacity,
    Image,
    Text,
    ScrollView,
    TextInput,
    Linking
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
import Tooltip from 'react-native-walkthrough-tooltip';
import moment from "moment";
import { number } from "card-validator";
//import { TestScheduler } from "jest";

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
            upload_data: { image_uri: null, update_net_worth: 0, gold_coins_to_charge: 0 },
            proofID_doc: [],
            assets_doc: [],
            model_doc: [],
            article_doc: [],
            connection_doc: [],
            networthupdate: [],
            showToolTip_gold_coins: false,


            userId: "",
            userToken: "",
            userSlug: "",
            userImagePath: "",
            userImageName: "",
            member_plan: "0",
            is_verified: "0",
            hash_key: "",
            user_email: "",
            net_worth: 0,
            documentTypeId: "",



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
            var net_worth = await AsyncStorage.getItem(Constants.KEY_NET_WORTH);
            var proofID_fileName = await AsyncStorage.getItem(Constants.KEY_PROOFID_DOC_NAME + "_" + userId);
            var assets_fileName = await AsyncStorage.getItem(Constants.KEY_ASSETS_DOC_NAME + "_" + userId);
            var model_fileName = await AsyncStorage.getItem(Constants.KEY_MODEL_DOC_NAME + "_" + userId);
            var article_fileName = await AsyncStorage.getItem(Constants.KEY_ARTICLE_DOC_NAME + "_" + userId);
            var connection_fileName = await AsyncStorage.getItem(Constants.KEY_CONNECTION_DOC_NAME + "_" + userId);

            this.setState({
                userId: userId,
                userToken: userToken,
                userSlug: userSlug,
                userImagePath: userImagePath,
                userImageName: userImageName,
                member_plan: member_plan,
                is_verified: is_verified,
                hash_key: hash_key,
                user_email: user_email,
                net_worth: net_worth,
                assets_fileName: assets_fileName ? assets_fileName : '',
                model_fileName: model_fileName ? model_fileName : '',
                proofID_fileName: proofID_fileName ? proofID_fileName : '',
                article_fileName: article_fileName ? article_fileName : '',
                connection_fileName: connection_fileName ? connection_fileName : '',
                proofID_doc: [],
                assets_doc: [],
                model_doc: [],
                article_doc: [],
                connection_doc: [],


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


            let uri = Memory().env == "LIVE" ? Global.URL_UPLOAD_DOCUMENT + "?email=" + this.state.user_email + "&key=" + this.state.hash_key : Global.URL_UPLOAD_DOCUMENT_DEV + "?email=" + this.state.user_email + "&key=" + this.state.hash_key;

            let params = new FormData();
            params.append("token", this.state.userToken);
            params.append("user_id", this.state.userId);
            params.append("key", this.state.hash_key);
            params.append("format", "json");

            console.log(TAG + " callGetUploadDocumentAPI uri " + uri);
            console.log(TAG + " callGetUploadDocumentAPI uploaded-data-params " + JSON.stringify(params));

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
        console.log(TAG + " callGetUploadDocumentAPI Response1 " + JSON.stringify(response));
        console.log(TAG + " callGetUploadDocumentAPI isError " + isError);
        if (!isError) {
            var result = response;
            if (result != undefined && result != null) {
                if (result.status.toUpperCase() == "success".toUpperCase()) {
                    if (result.data.documentType != null) {
                        var index = 0;
                        var localUriTypePart = [];
                        var fileType = "";
                        this.setState((preStates) => {
                            preStates["upload_data"]["update_net_worth"] = JSON.stringify(result.data.profileData.networth_amount);
                            preStates["documentTypeId"] = result.data.documentType[1];
                            preStates["upload_data"]["gold_coins_to_charge"] = JSON.stringify(result.data.profileData.user_chat_cost);

                            return preStates;
                        });

                        this.setState({
                            networthupdate: result.data.networthupdate && result.data.networthupdate.length ? result.data.networthupdate[0] : null
                        })
                        for (i = 0; i < result.data.documentType.length; i++) {

                            index = parseInt(result.data.documentType[i], 10);
                            if (isNaN(index)) {
                                continue;
                            }



                            if (Object.entries(result.data.documents[index]).length && result.data.documents[index] != null) {
                                var keys = Object.keys(result.data.documents[index]);
                                keys.forEach((key) => {
                                    var doc = result.data.documents[index][key];

                                    localUriTypePart = doc.filename ? doc.filename.split('.') : '';
                                    fileType = localUriTypePart[localUriTypePart.length - 1];
                                    if (index == 0) {
                                        this.setState({
                                            proofID_doc: [...this.state.proofID_doc, {
                                                received_time: doc.upload_datetime ? moment(doc.upload_datetime).format('D MMM YYYY') : '',
                                                reviewed_time: doc.upload_datetime ? moment(doc.upload_datetime).format('D MMM YYYY') : '',
                                                accepted_time: doc.upload_datetime ? moment(doc.upload_datetime).format('D MMM YYYY') : '',
                                                uri: doc.doc_path + doc.filename,
                                                file_type: fileType,
                                                image_type: (fileType.toLowerCase() == "jpg" || fileType.toLowerCase() == "jpeg" || fileType.toLowerCase() == "png") ? true : false,
                                                image_fileName: this.state.proofID_fileName != '' ? this.state.proofID_fileName : doc.filename,

                                            }]
                                        })
                                    } else if (index == 2) {

                                        this.setState({
                                            assets_doc: [...this.state.assets_doc, {
                                                uri: doc.doc_path + doc.filename,
                                                file_type: fileType,
                                                image_type: (fileType.toLowerCase() == "jpg" || fileType.toLowerCase() == "jpeg" || fileType.toLowerCase() == "png") ? true : false,
                                                image_fileName: this.state.assets_fileName != '' ? this.state.assets_fileName : doc.filename,

                                            }],

                                        })

                                    } else if (index == 3) {
                                        this.setState({
                                            model_doc: [...this.state.model_doc, {
                                                uri: doc.doc_path + doc.filename,
                                                file_type: fileType,
                                                image_type: (fileType.toLowerCase() == "jpg" || fileType.toLowerCase() == "jpeg" || fileType.toLowerCase() == "png") ? true : false,
                                                image_fileName: this.state.model_fileName != '' ? this.state.model_fileName : doc.filename,


                                            }],
                                        })

                                    } else if (index == 5) {
                                        this.setState({
                                            article_doc: [...this.article_doc, {
                                                uri: doc.doc_path + doc.filename,
                                                file_type: fileType,
                                                image_type: (fileType.toLowerCase() == "jpg" || fileType.toLowerCase() == "jpeg" || fileType.toLowerCase() == "png") ? true : false,
                                                image_fileName: this.state.article_fileName ? this.state.article_fileName : doc.filename,


                                            }],
                                        })
                                    } else if (index == 4) {
                                        this.setState({
                                            connection_doc: [...this.state.connection_doc, {
                                                uri: doc.doc_path + doc.filename,
                                                file_type: fileType,
                                                image_type: (fileType.toLowerCase() == "jpg" || fileType.toLowerCase() == "jpeg" || fileType.toLowerCase() == "png") ? true : false,
                                                image_fileName: this.state.connection_fileName != '' ? this.state.connection_fileName : doc.filename,


                                            }],
                                        })
                                    }
                                });

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
                    if (width > 2000 || height > 2000) {
                        if (width > height) {
                            newwidth = 2000;
                            newheight = height * 2000 / width
                        } else {
                            newheight = 2000;
                            newwidth = width * 2000 / height
                        }
                        ImageResizer.createResizedImage(source.uri, newwidth, newheight, 'JPEG', 90)
                            .then(({ uri }) => {
                                this.setState({
                                    doc_images: [],
                                    upload_data: {
                                        image_uri: uri
                                    }
                                }, () => this.upload_document(this.state.upload_data))
                            })
                            .catch(err => {
                                console.log(err);

                            });
                    } else {
                        this.setState({
                            doc_images: [],

                            upload_data: {
                                image_uri: source.uri
                            }
                        }, () => this.upload_document(this.state.upload_data))
                    }
                });
            }
        });
    }


    lunchImageLibrary = () => {
        ImagePicker.launchImageLibrary(imagepicker_options, (response) => {
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
                    if (width > 2000 || height > 2000) {
                        if (width > height) {
                            newwidth = 2000;
                            newheight = height * 2000 / width
                        } else {
                            newheight = 2000;
                            newwidth = width * 2000 / height
                        }
                        ImageResizer.createResizedImage(source.uri, newwidth, newheight, 'JPEG', 90)
                            .then(({ uri }) => {
                                this.setState({
                                    doc_images: [],
                                    upload_data: {
                                        image_uri: uri
                                    }
                                }, () => this.upload_document(this.state.upload_data))
                            })
                            .catch(err => {
                                console.log(err);
                            });
                    } else {
                        this.setState({
                            doc_images: [],
                            upload_data: {
                                image_uri: source.uri
                            }
                        }, () => this.upload_document(this.state.upload_data))
                    }
                });
            }
        });
    }

    lunchDocumentPicker = async () => {
        try {
            const response = await DocumentPicker.pick({
                type: [DocumentPicker.types.allFiles],
            });
            console.log("pdf",
                "URL", response[0].uri,
                "type", response[0].type, // mime type
                "name", response[0].name,
                "size", response[0].size);
            let source = { uri: response.uri }

            this.setState({
                doc_images: [],

                upload_data: {
                    image_uri: source.uri
                }
            }, () => this.upload_document(this.state.upload_data))

        } catch (err) {
            if (DocumentPicker.isCancel(err)) {
                // User cancelled the picker, exit any dialogs or menus and move on
            } else {
                throw err;
            }
        }
    }

    async upload_document(upload_data) {

        try {
            this.setState({
                loading: true,
            });
            let uri = Memory().env == "LIVE" ? Global.URL_UPLOAD_DOCUMENT + "?email=" + this.state.user_email + "&key=" + this.state.hash_key : Global.URL_UPLOAD_DOCUMENT_DEV + "?email=" + this.state.user_email + "&key=" + this.state.hash_key;
            let params = new FormData();
            params.append("token", this.state.userToken);
            params.append("user_id", this.state.userId);
            params.append("key", this.state.hash_key);
            params.append("format", "json");

            var localUriNamePart = upload_data.image_uri.split('/');
            var fileName = localUriNamePart[localUriNamePart.length - 1];
            var localUriTypePart = upload_data.image_uri.split('.');
            var fileType = localUriTypePart[localUriTypePart.length - 1];
            var doc_image = {
                uri: upload_data.image_uri,
                type: `image/${fileType}`,
                name: fileName
            };
            if (this.state.image_type == "proofID") {
                this.setState({
                    proofID_doc: [...this.state.proofID_doc, {
                        uri: upload_data.image_uri,
                        file_type: fileType,
                        image_type: (fileType.toLowerCase() == "jpg" || fileType.toLowerCase() == "jpeg" || fileType.toLowerCase() == "png" || fileType.toLowerCase() == "pdf") ? true : false,

                    }],
                })
                await AsyncStorage.setItem(Constants.KEY_PROOFID_DOC_NAME + "_" + this.state.userId, doc_image.name);
                params.append('document_1[]', doc_image);
                params.append('documentUploadType[]', 0);
            } else if (this.state.image_type == "assets") {
                this.setState({
                    assets_doc: [...this.state.assets_doc, {
                        uri: upload_data.image_uri,
                        image_type: (fileType.toLowerCase() == "jpg" || fileType.toLowerCase() == "jpeg" || fileType.toLowerCase() == "png" || fileType.toLowerCase() == "pdf") ? true : false,

                    }],
                })

                await AsyncStorage.setItem(Constants.KEY_ASSETS_DOC_NAME + "_" + this.state.userId, doc_image.name);
                params.append('document_1[]', doc_image);
                params.append('documentUploadType[]', 2);

            } else if (this.state.image_type == "model") {

                this.setState({
                    model_doc: [...this.state.model_doc, {
                        uri: upload_data.image_uri,
                        image_type: (fileType.toLowerCase() == "jpg" || fileType.toLowerCase() == "jpeg" || fileType.toLowerCase() == "png" || fileType.toLowerCase() == "pdf") ? true : false,

                    }]
                })
                await AsyncStorage.setItem(Constants.KEY_MODEL_DOC_NAME + "_" + this.state.userId, doc_image.name);
                params.append('document_1[]', doc_image);
                params.append('documentUploadType[]', 3);
            } else if (this.state.image_type == "article") {
                this.setState({
                    article_doc: [...this.state.article_doc, {
                        uri: upload_data.image_uri,
                        image_type: (fileType.toLowerCase() == "jpg" || fileType.toLowerCase() == "jpeg" || fileType.toLowerCase() == "png" || fileType.toLowerCase() == "pdf") ? true : false,

                    }],
                })
                await AsyncStorage.setItem(Constants.KEY_ARTICLE_DOC_NAME + "_" + this.state.userId, doc_image.name);
                params.append('document_1[]', doc_image);
                params.append('documentUploadType[]', 5);
            } else if (this.state.image_type == "connection") {
                this.setState({
                    connection_doc: [...this.state.article_doc, {
                        uri: upload_data.image_uri,
                        image_type: (fileType.toLowerCase() == "jpg" || fileType.toLowerCase() == "jpeg" || fileType.toLowerCase() == "png" || fileType.toLowerCase() == "pdf") ? true : false,

                    }],
                })
                await AsyncStorage.setItem(Constants.KEY_CONNECTION_DOC_NAME + "_" + this.state.userId, doc_image.name);
                params.append('document_1[]', doc_image);
                params.append('documentUploadType[]', 4);
            }
            console.log(TAG + " callUploadDocumentAPI uri " + uri);
            console.log(TAG + " callUploadDocumentAPI upload-params " + JSON.stringify(params));

            WebService.callServicePostWithFormData(uri, params, this.handleUploadDocument);
            //WebService.apiCallRequestAddTag(uri, params, this.handleUploadDocument);
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
        console.log(TAG + " callUploadDocumentAPI Response test" + JSON.stringify(response));
        console.log(TAG + " callUploadDocumentAPI isError " + isError);

        if (!isError) {
            var result = response;
            if (result != undefined && result != null) {
                if (result.status.toUpperCase() == "success".toUpperCase()) {
                    Alert.alert(Constants.UPLOAD_DOC_SUCCESS, "");
                    this.getData();
                } else {
                    if(response.msg)
                    {
                        Alert.alert(response.msg.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
                    }else{
                        Alert.alert(Constants.UNKNOWN_MSG, "");
                        //UNKNOWN_MSG
                    }
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

    update_chat_cost(upload_data) {
        try {
            this.setState({
                loading: true,
            });

            let uri = Memory().env == "LIVE" ? Global.URL_UPDATE_CHAT_COST : Global.URL_UPDATE_CHAT_COST_DEV;
            let params = {
                "token": this.state.userToken,
                "user_id": this.state.userId,
                "user_chat_cost": upload_data.gold_coins_to_charge,
                "format": "json"
            };
            console.log(TAG + " callUpdateChatCost uri " + uri);
            console.log(TAG + " callUpdateChatCost update-chat-cost " + JSON.stringify(params));

            WebService.callServicePostWithBodyData(uri, params, this.handleUpdateChatCost);
        } catch (error) {
            console.log(TAG + " callUpdateChatCost error " + error);
            this.setState({
                loading: false
            });
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    }

    handleUpdateChatCost = (response, isError) => {
        // console.log(TAG + " callUpdateChatCost Response " + JSON.stringify(response));
        console.log(TAG + " callUpdateChatCost isError " + isError);
        if (!isError) {
            var result = response;
            if (result != undefined && result != null) {
                if (result.status.toUpperCase() == "success".toUpperCase()) {
                    Alert.alert(Constants.UPLOAD_NET_WORTH_SUCCESS, "");
                    this.getData();
                } else {
                    if(response.msg)
                    {
                        Alert.alert(response.msg.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
                    }else{
                        Alert.alert(Constants.UNKNOWN_MSG, "");
                        //UNKNOWN_MSG
                    }
                }
            }
        } else {
            if (response != undefined && response != null && response.length > 0) {
                Alert.alert(response.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
            // Alert.alert(Constants.NO_INTERNET, "");
        }
        this.setState({
            loading: false
        });
    }

    update_networth(upload_data) {
        try {
            this.setState({ loading: true, });
            let uri = Memory().env == "LIVE" ? Global.URL_UPDATE_NETWORTH : Global.URL_UPDATE_NETWORTH_DEV;
            let params = {
                "token": this.state.userToken,
                "user_id": this.state.userId,
                "networth_amount": upload_data.update_net_worth,
                "format": "json"
            }
            console.log(TAG + " callUploadDocumentAPI uri " + uri);
            console.log(TAG + " callUploadDocumentAPI update-networth " + JSON.stringify(params));
            WebService.callServicePostWithBodyData(uri, params, this.handleUpdateNetworth);
        } catch (error) {
            console.log(TAG + " callUploadDocumentAPI error " + error);
            this.setState({ loading: false });
            if (error != undefined && error != null && error.length > 0) {
                Alert.alert(error.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
            }
        }
    }

    handleUpdateNetworth = (response, isError) => {
        // console.log(TAG + " callUploadDocumentAPI Response " + JSON.stringify(response));
        console.log(TAG + " callUploadDocumentAPI isError " + isError);
        if (!isError) {
            var result = response;
            if (result != undefined && result != null) {
                if (result.status.toUpperCase() == "success".toUpperCase()) {
                    Alert.alert(Constants.UPLOAD_NET_WORTH_SUCCESS, "");
                    this.getData();
                } else {
                    if(response.msg)
                    {
                        Alert.alert(response.msg.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
                    }else{
                        Alert.alert(Constants.UNKNOWN_MSG, "");
                        //UNKNOWN_MSG
                    }
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
        this.setState({loading: false});
    }

    renderClickableImageCard = (source, lbl, uri) => {
        return (
            <TouchableOpacity
                style={{ justifyContent: 'center', alignItems: 'center', paddingLeft: 15, paddingRight: 15, }}
                onPress={() => 
                    {
                        this.props.screenProps.navigate("ImageZoom", {
                            index: 0,
                            tempGalleryUrls: [{
                                id: uri,
                                image: { uri: uri }
                            }]
                        });
                    }
                    // Linking.openURL(uri)
                }
            >
                <Image style={{ width: 80, height: 80, resizeMode: 'contain' }} source={source}></Image>
                <Text style={[stylesGlobal.font, { fontSize: 12, marginTop: 10 }]}>{lbl}</Text>
            </TouchableOpacity>
        )
    }
    renderUploadedFile = (item) => {

        if (item.image_type) {
            return this.renderClickableImageCard({ uri: item.uri }, item.file_type, item.uri);
        } else {
            if (item.file_type.toLowerCase() === "zip") {
                return this.renderClickableImageCard(require("../icons/zip.png"), item.file_type, item.uri);

            } else if (item.file_type.toLowerCase() === 'pdf') {
                return this.renderClickableImageCard(require("../icons/fa_pdf.png"), item.file_type, item.uri);
            }
        }
        return this.renderClickableImageCard(require("../icons/document_empty.png"), item.file_type, item.uri);
    }

    renderRecentIdPhotos = (items) => {
        if (items.length == 0) return (<></>);
        var newProofs = items.slice(0, 3);

        return (
            <View style={{ width: '90%', flexDirection: 'row', justifyContent: 'flex-start', alignContent: 'center', overflow: 'hidden' }}>
                {
                    newProofs.map((item, key) => {
                        return (<View key={key}>
                            {
                                this.renderUploadedFile(item)
                            }
                        </View>
                        );
                    })
                }
            </View>
        );
    }

    render() {
        return (
            <SafeAreaView style={styles.container}>
                {
                    this.state.loading && <ProgressIndicator />
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
                <View style={styles.card_view}>
                    <View style={{ flex: 1, width: '100%', alignItems: 'center' }}>
                        <View style={styles.title_header}>
                            <Text style={[styles.headText, stylesGlobal.font]}>{'CREDENTIALS'}</Text>
                        </View>
                        <View style={{ flex: 1, alignItems: 'center' }}>
                            <ScrollView     >
                                <View style={{ width: '100%', marginTop: 30, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center' }}>
                                    <Text style={[styles.title_text, stylesGlobal.font_semibold, { textAlign: 'center', paddingBottom: 5 }]}>{this.state.explain_text}</Text>
                                    <Text style={[stylesGlobal.font, { fontSize: 12, color: Colors.greyDark, margin: "1%" }]}>{'File formats accepted: .jpg, .pdf, .png'}</Text>
                                </View>
                                {
                                    this.state.member_plan != "7" && this.state.member_plan != "4" &&
                                    <View>
                                        <View style={{ width: '100%', alignItems: 'center', justifyContent: 'center', marginTop: 30 }}>
                                            <Text style={[stylesGlobal.titleText, stylesGlobal.font_bold]} numberOfLines={1}>{'YOUR PHOTO ID'}</Text>
                                        </View>
                                        <View style={{ width: '95%', alignSelf: 'center', height: 1, backgroundColor: Colors.black, marginVertical: 15 }} />
                                        <View style={{ width: '100%', alignItems: 'center', justifyContent: 'center' }}>
                                            {
                                                this.state.proofID_doc.length > 0 &&
                                                <View>
                                                    <Image style={{ height: 35, resizeMode: 'contain' }} source={require('../icons/verify_checkmark.png')}></Image>
                                                    <Text style={[stylesGlobal.font_semibold, { fontSize: 18, color: Colors.black, textAlign: 'center', margin: "1%" }]} numberOfLines={1}>{'ID Submitted'}</Text>
                                                    {/* {
                                                        this.state.proofID_doc[0] && this.state.proofID_doc[0].received_time && 
                                                        <Text style = {[stylesGlobal.font,{fontSize: 12, color: Colors.greyDark, textAlign: 'center', margin: "1%",fontStyle: 'italic'}] }>{'Received '+this.state.proofID_doc[0].received_time}</Text>
                                                    }
                                                    {
                                                        this.state.proofID_doc[0] && this.state.proofID_doc[0].reviewed_time && 
                                                        <Text style = {[stylesGlobal.font,{fontSize: 12, color: Colors.greyDark, textAlign: 'center', margin: "1%",fontStyle:"italic"}]}>{'Reviewed '+this.state.proofID_doc[0].reviewed_time}</Text>
                                                    } */}
                                                    {
                                                        this.state.proofID_doc[0] && this.state.proofID_doc[0].accepted_time &&
                                                        <Text style={[stylesGlobal.font, { fontSize: 12, color: Colors.greyDark, textAlign: 'center', margin: "1%", fontStyle: 'italic' }]}>{'Accepted ' + this.state.proofID_doc[0].accepted_time}</Text>
                                                    }
                                                </View>
                                            }
                                        </View>
                                        <View style={{ width: '100%', alignItems: 'center', justifyContent: 'center', marginTop: 15 }}>
                                            <TouchableOpacity onPress={() => { this.setState({ image_type: "proofID" }); this.ActionSheet.show() }}>
                                                <View style={{ marginBottom: 5 }}>
                                                    <Image style={{ height: 30, resizeMode: 'contain' }} source={require('../icons/signup_upload.png')}></Image>
                                                </View>
                                            </TouchableOpacity>
                                            <Text style={[stylesGlobal.font_semibold, { fontSize: 18, color: Colors.black, textAlign: 'center', margin: "1%", }]} numberOfLines={1}>{'Upload Documents'}</Text>

                                            <View style={{ marginBottom: 5 }}>
                                                <Text style={[stylesGlobal.font, { fontSize: 12, color: Colors.greyDark, textAlign: 'center', margin: "1%", fontStyle: 'italic' }]}>{'Click to icon above to upload photo ID'}</Text>
                                            </View>
                                            <View style={{ width: '100%', justifyContent: 'center', flexDirection: 'row', marginTop: 10 }}>
                                                {
                                                    this.renderRecentIdPhotos(this.state.proofID_doc)
                                                }
                                            </View>

                                        </View>
                                    </View>
                                }
                                {

                                    //this.state.member_plan == "1" || this.state.member_plan == "2" &&  
                                    this.state.member_plan != "3" && this.state.member_plan != "4" && this.state.member_plan != "5" && this.state.member_plan != "6" && this.state.member_plan != "7" && this.state.member_plan != "" &&
                                    <View>

                                        <View style={{ width: '100%', alignItems: 'center', justifyContent: 'center', marginTop: 30 }}>
                                            <Text style={[stylesGlobal.titleText, stylesGlobal.font_bold]} numberOfLines={1}>{'YOUR NET WORTH'}</Text>
                                        </View>
                                        <View style={{ width: '95%', alignSelf: 'center', height: 1, backgroundColor: Colors.black, marginVertical: 15 }} />
                                        <Text style={[stylesGlobal.font_semibold, { fontSize: 18, color: Colors.black, textAlign: 'center', margin: "1%" }]} numberOfLines={1}>{'Net Worth Declaration'}</Text>
                                        <View style={{ marginBottom: 5 }}>
                                            <Text style={[stylesGlobal.font, { fontSize: 12, color: Colors.greyDark, textAlign: 'center', margin: "1%", fontStyle: "italic" }]}>{'Write in the amount of net worth you would like us to verify'}</Text>
                                        </View>

                                        <View>
                                            <View style={{ width: '100%', alignItems: 'center' }}>
                                                <TextInput style={[styles.text_input_style, stylesGlobal.font]}
                                                    //secureTextEntry = {true} 
                                                    returnKeyType={"done"}
                                                    blurOnSubmit={false}
                                                    placeholder={"XX million"}
                                                    value={this.state.upload_data.update_net_worth && this.state.upload_data.update_net_worth !== 'null' ? this.state.upload_data.update_net_worth : ''}
                                                    onChangeText={(text) => this.setState((preStates) => {
                                                        preStates["upload_data"]["update_net_worth"] = text
                                                        return preStates;
                                                    })}
                                                />
                                            </View>
                                            <View style={{ width: '100%', alignItems: 'center' }}>
                                                <TouchableOpacity style={[styles.button_style, stylesGlobal.shadow_style]} onPress={() => this.update_networth(this.state.upload_data)}>
                                                    <Text style={[styles.button_text, stylesGlobal.font]}>{"Update"}</Text>
                                                </TouchableOpacity>
                                            </View>
                                            {(this.state.networthupdate && !this.state.networthupdate.is_approved) &&
                                                <View style={[{ width: '100%', alignItems: 'center', marginTop: 10 }]}>
                                                    <Text style={[stylesGlobal.font, { fontSize: 12, fontStyle: "italic", color: Colors.greyDark, textAlign: 'center', }]}>US${this.state.networthupdate.networth_amount}M(Update Under Review)</Text>
                                                </View>
                                            }




                                        </View>
                                        <View style={{ width: '100%', alignItems: 'center', justifyContent: 'center', marginTop: 15 }}>
                                            <TouchableOpacity onPress={() => { this.setState({ image_type: "assets" }); this.ActionSheet.show() }}>
                                                <View style={{ marginBottom: 5 }}>
                                                    <Image style={{ height: 35, resizeMode: 'contain' }} source={require('../icons/signup_upload.png')}></Image>
                                                </View>
                                            </TouchableOpacity>
                                            <Text style={[stylesGlobal.font_semibold, { fontSize: 18, color: Colors.black, textAlign: 'center', margin: "1%" }]} numberOfLines={1}>{'Upload Documents'}</Text>

                                            <View style={{ marginBottom: 5 }}>
                                                <Text style={[stylesGlobal.font, { fontSize: 12, color: Colors.greyDark, textAlign: 'center', margin: "1%", fontStyle: "italic" }]}>{'Click to icon above to upload proof of net worth'}</Text>
                                            </View>
                                            <View style={{ width: '100%', justifyContent: 'center', flexDirection: 'row', marginTop: 10 }}>
                                                {
                                                    this.renderRecentIdPhotos(this.state.assets_doc)
                                                }
                                            </View>
                                        </View>
                                    </View>
                                }
                                {
                                    this.state.member_plan == "3" &&
                                    <View>


                                        <View style={{ width: '100%', alignItems: 'center', justifyContent: 'center', marginTop: 30 }}>
                                            <Text style={[stylesGlobal.titleText, stylesGlobal.font_bold]} numberOfLines={1}>{'MODEl PUBLICATION'}</Text>
                                        </View>
                                        <View style={{ width: '95%', alignSelf: 'center', height: 1, backgroundColor: Colors.black, marginVertical: 15 }} />

                                        <View style={{ width: '100%', alignItems: 'center', justifyContent: 'center', marginTop: 15 }}>
                                            <TouchableOpacity onPress={() => { this.setState({ image_type: "model" }); this.ActionSheet.show() }}>
                                                <View style={{ marginBottom: 5 }}>
                                                    <Image style={{ height: 35, resizeMode: 'contain' }} source={require('../icons/signup_upload.png')}></Image>
                                                </View>
                                            </TouchableOpacity>
                                            <Text style={[stylesGlobal.font_semibold, { fontSize: 18, color: Colors.black, textAlign: 'center', margin: "1%" }]} numberOfLines={1}>{'Upload Documents'}</Text>

                                            <View style={{ marginBottom: 5 }}>
                                                <Text style={[stylesGlobal.font, { fontSize: 12, color: Colors.greyDark, textAlign: 'center', margin: "1%", fontStyle: "italic" }]}>{'Click to icon above to upload your model publication'}</Text>
                                            </View>
                                            <View style={{ width: '100%', justifyContent: 'center', flexDirection: 'row', marginTop: 10 }}>
                                                {
                                                    this.renderRecentIdPhotos(this.state.model_doc)
                                                }
                                            </View>


                                        </View>
                                    </View>
                                }
                                {
                                    this.state.member_plan == "5" &&
                                    <View>
                                        <View style={{ width: '100%', alignItems: 'center', justifyContent: 'center', marginTop: 30 }}>
                                            <Text style={[stylesGlobal.titleText, stylesGlobal.font_bold]} numberOfLines={1}>{'YOUR CONNECTIONS'}</Text>
                                        </View>
                                        <View style={{ width: '95%', alignSelf: 'center', height: 1, backgroundColor: Colors.black, marginVertical: 15 }} />

                                        <View style={{ width: '100%', alignItems: 'center', justifyContent: 'center', marginTop: 15 }}>
                                            <TouchableOpacity onPress={() => { this.setState({ image_type: "connection" }); this.ActionSheet.show() }}>
                                                <View style={{ marginBottom: 5 }}>
                                                    <Image style={{ height: 35, resizeMode: 'contain' }} source={require('../icons/signup_upload.png')}></Image>
                                                </View>
                                            </TouchableOpacity>
                                            <Text style={[stylesGlobal.font_semibold, { fontSize: 18, color: Colors.black, textAlign: 'center', margin: "1%" }]} numberOfLines={1}>{'Upload Documents'}</Text>

                                            <View style={{ marginBottom: 5 }}>
                                                <Text style={[stylesGlobal.font, { fontSize: 12, color: Colors.greyDark, textAlign: 'center', margin: "1%", fontStyle: "italic" }]}>{'Click to icon above to upload proof of your connections '}</Text>
                                            </View>
                                            <View style={{ width: '100%', justifyContent: 'center', flexDirection: 'row', marginTop: 10 }}>
                                                {
                                                    this.renderRecentIdPhotos(this.state.connection_doc)
                                                }
                                            </View>


                                        </View>
                                    </View>
                                }
                                {
                                    this.state.member_plan == "6" &&
                                    <View>
                                        <View style={{ width: '100%', alignItems: 'center', justifyContent: 'center', marginTop: 30 }}>
                                            <Text style={[stylesGlobal.titleText, stylesGlobal.font_bold]} numberOfLines={1}>{'RECENT ARTICLE'}</Text>
                                        </View>
                                        <View style={{ width: '95%', alignSelf: 'center', height: 1, backgroundColor: Colors.black, marginVertical: 15 }} />

                                        <View style={{ width: '100%', alignItems: 'center', justifyContent: 'center', marginTop: 15 }}>
                                            <TouchableOpacity onPress={() => { this.setState({ image_type: "article" }); this.ActionSheet.show() }}>
                                                <View style={{ marginBottom: 5 }}>
                                                    <Image style={{ height: 35, resizeMode: 'contain' }} source={require('../icons/signup_upload.png')}></Image>
                                                </View>
                                            </TouchableOpacity>
                                            <Text style={[stylesGlobal.font_semibold, { fontSize: 18, color: Colors.black, textAlign: 'center', margin: "1%" }]} numberOfLines={1}>{'Upload Documents'}</Text>

                                            <View style={{ marginBottom: 5 }}>
                                                <Text style={[stylesGlobal.font, { fontSize: 12, color: Colors.greyDark, textAlign: 'center', margin: "1%", fontStyle: "italic" }]}>{'Click to icon above to upload your article '}</Text>
                                            </View>
                                            <View style={{ width: '100%', justifyContent: 'center', flexDirection: 'row', marginTop: 10 }}>
                                                {
                                                    this.renderRecentIdPhotos(this.state.article_doc)
                                                }
                                            </View>


                                        </View>
                                    </View>
                                }

                                {
                                    this.state.member_plan != "7" && this.state.member_plan != "4" && this.state.member_plan != "8" &&
                                    <View style={{ marginBottom: '10%' }}>

                                        <View style={{ width: '100%', alignItems: 'center', justifyContent: 'center', marginTop: 30 }}>
                                            <Text style={[stylesGlobal.titleText, stylesGlobal.font_bold]} numberOfLines={1}>{'CONTACT PREFERENCE'}</Text>
                                        </View>
                                        <View style={{ width: '95%', alignSelf: 'center', height: 1, backgroundColor: Colors.black, marginVertical: 15 }} />
                                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                                            <Text style={[stylesGlobal.font_semibold, { fontSize: 18, color: Colors.black, textAlign: 'center', margin: "1%" }]} numberOfLines={1}>{'Gold Coins To Collect From Fans'}</Text>
                                            <Tooltip
                                                isVisible={this.state.showToolTip_gold_coins}
                                                content={
                                                    <View style={{ paddingVertical: 15, paddingHorizontal: 15, backgroundColor: Colors.tooltip_background }}>
                                                        <Text style={[{ fontSize: 13, color: Colors.black }, stylesGlobal.font]}>{Constants.CREDENTIAL_GOLD_COINS_TOOLTIP}</Text>
                                                    </View>
                                                }
                                                onClose={() => this.setState({ showToolTip_gold_coins: false })}
                                                placement="top"
                                                backgroundColor={'rgba(0,0,0,0.2)'}
                                                // topAdjustment={Platform.OS === 'android' ? -StatusBar.currentHeight : 0}
                                                arrowSize={{ width: 0, height: 0 }}>
                                                <TouchableOpacity
                                                    style={{ width: 20, height: 20, marginHorizontal: 5 }}
                                                    onPress={() => this.setState({ showToolTip_gold_coins: true })}
                                                >
                                                    <Image style={{ width: '100%', height: '100%', resizeMode: 'contain' }} source={require('../icons/tooltip.png')} />
                                                </TouchableOpacity>
                                            </Tooltip>
                                        </View>
                                        <View style={{ marginBottom: 5 }}>
                                            <Text style={[stylesGlobal.font, { fontSize: 12, color: Colors.greyDark, textAlign: 'center', margin: "1%", fontStyle: "italic" }]}>{'How many gold coins would you like a fan to be charged to message you?'}</Text>
                                        </View>
                                        <View>
                                            <View style={{ width: '100%', alignItems: 'center' }}>
                                                <TextInput style={[styles.text_input_style, stylesGlobal.font]}
                                                    returnKeyType={"done"}
                                                    blurOnSubmit={false}
                                                    placeholder={'0'}
                                                    value={this.state.upload_data.gold_coins_to_charge ? this.state.upload_data.gold_coins_to_charge : ''}
                                                    onChangeText={(text) => this.setState((preStates) => {
                                                        preStates["upload_data"]["gold_coins_to_charge"] = text
                                                        return preStates;
                                                    })}
                                                />
                                            </View>

                                            <View style={{ width: '100%', alignItems: 'center' }}>
                                                <TouchableOpacity style={[styles.button_style, stylesGlobal.shadow_style]} onPress={() => { this.update_chat_cost(this.state.upload_data) }}>
                                                    <Text style={[styles.button_text, stylesGlobal.font]}>{"Save Preferences"}</Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    </View>
                                }
                                {/* {
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
                                        this.state.proofID_doc.length > 0 && 
                                        <Image source={require('../icons/checked.png')} style={{position:'absolute', top: 0, left:0, width:20, height:25, resizeMode:'contain'}}/>
                                    }
                                    </View>
                                    <View style = {styles.doc_image_view}>
                                    {
                                        this.state.proofID_doc.length > 0 && this.state.proofID_doc.image_type &&
                                        <Image style = {{width: '100%', height: '100%', resizeMode: 'cover'}} source = {{uri: this.state.proofID_doc.uri}}></Image>
                                    }
                                    {
                                        this.state.proofID_doc.length > 0 && !this.state.proofID_doc.image_type &&
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
                                        this.state.assets_doc.length > 0 && 
                                        <Image source={require('../icons/checked.png')} style={{position:'absolute', top: 0, left:0, width:20, height:25, resizeMode:'contain'}}/>
                                    }
                                    </View>
                                    <View style = {styles.doc_image_view}>
                                    {
                                        this.state.assets_doc.length > 0 && this.state.assets_doc[0].image_type &&
                                        <Image style = {{width: '100%', height: '100%', resizeMode: 'cover'}} source = {{uri: this.state.assets_doc.uri}}></Image>
                                    }
                                    {
                                        this.state.assets_doc.length > 0 && !this.state.assets_doc[0].image_type &&
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
                            } */}
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
        width: '50%',
        height: 40,
        marginTop: 10,
        borderColor: Colors.black,
        borderWidth: 0.5,
        borderRadius: 3,
        textAlign: 'center'
    },
    button_style: {
        width: '50%',
        // height: 40,
        marginTop: 10,
        backgroundColor: Colors.gold,
        borderRadius: 5,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 30,
        paddingVertical: 10
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
        width: 50,
        height: 60,
        justifyContent: 'center',
        alignItems: 'center',

    }
    // model_image_view: {
    //     width: 50,
    //     height: 60,
    //     justifyContent: 'left',
    //     alignItems: 'center',
    //     marginStart: 10
    // }
});
