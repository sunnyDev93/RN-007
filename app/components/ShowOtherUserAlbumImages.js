import React, { Component, Fragment } from 'react'
import { View, 
    Text, 
    TouchableOpacity, 
    Image, 
    ScrollView, 
    Dimensions, 
    Alert, 
    Platform,
    FlatList,
    SafeAreaView
} from 'react-native'
import { Colors } from "../consts/Colors";
import { Constants } from '../consts/Constants'
import { ImageCompressor } from './ImageCompressorClass'
import { stylesGlobal, STICKY_HEADER_HEIGHT } from '../consts/StyleSheet'

const { height, width } = Dimensions.get("window");
import WebService from "../core/WebService";
import * as Global from "../consts/Global";
import ProgressIndicator from "./ProgressIndicator";
import Memory from '../core/Memory';
import BannerView from "../customview/BannerView";

var TAG = "ShowOtherUserAlbumImages";

export default class ShowOtherUserAlbumImages extends Component {

    constructor(props) {
        super(props);
        this.state = {
            loading: false,
            dataSource: [],
            tempGalleryUrls: [],

            is_portrait: true,
        }
    }

    UNSAFE_componentWillMount() {
        this.clearData()
        if(Dimensions.get("window").width < Dimensions.get("window").height) {
            this.setState({
                is_portrait: true,
            })
        } else {
            this.setState({
                is_portrait: false,
            })
        }

        Dimensions.addEventListener("change", () => {
            if(Dimensions.get("window").width < Dimensions.get("window").height) {
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

    componentWillUnmount() {
        Dimensions.removeEventListener('change');
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
    callGetAlbumImageAPI = async (response) => {
        try {
            this.setState({
                loading: true
            });

            let uri = Memory().env == "LIVE" ? Global.URL_GET_ALBUM_IMAGE + this.props.route.params.albumData.id + '/' +
                this.props.route.params.slug : Global.URL_GET_ALBUM_IMAGE_DEV + this.props.route.params.albumData.id + '/' +
                this.props.route.params.slug
            let params = new FormData();

            params.append("format", "json");
            params.append("user_id", this.props.route.params.userId);
            params.append("token", this.props.route.params.userToken);

            console.log(TAG + " callGetAlbumImageAPI uri " + uri);
            console.log(TAG + " callGetAlbumImageAPI params " + JSON.stringify(params));

            WebService.callServicePost(
                uri,
                params,
                this.handleGetAlbumImageResponse
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
     * Handle Upload Image API
     */
    handleGetAlbumImageResponse = (response, isError) => {

        console.log(TAG + " callGetAlbumImageAPIResponse " + JSON.stringify(response));
        console.log(TAG + " callGetAlbumImageAPI isError " + isError);

        if (!isError) {
            var result = response;
            if (result != undefined && result != null) {
                var tempGalleryUrls = [];
                for (var i = 0; i < result.data.albumImages.length; i++) {
                    tempGalleryUrls.push({
                        id: "id_" + i,
                        image: { uri: result.data.albumImages[i].imgpath + Constants.THUMB_FOLDER + result.data.albumImages[i].filename }
                    })
                }
                this.setState({
                    dataSource: result.data.albumImages,
                    tempGalleryUrls: tempGalleryUrls
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


    render() {
        return (
            <Fragment>
                <SafeAreaView style={{ flex: 0, backgroundColor: Colors.black }}/>
                <SafeAreaView style={{ flex: 1, backgroundColor: Colors.white }}>
                    {this.renderHeaderView()}
                    {this.renderBannerView()}
                    {this.state.loading == false && this.renderMainView()}
                    {this.state.loading == true && <ProgressIndicator /> }
                </SafeAreaView>
            </Fragment>
        );
    }

    renderBannerView = () => {
        return (
            <BannerView screenProps = {this.props.navigation} />
        )
    }

    /**
       * diplay top header
       */
    renderHeaderView = () => {
        return (
            <View style={stylesGlobal.headerView}>
                <TouchableOpacity style={stylesGlobal.header_backbuttonview_style} onPress={() => this.props.navigation.goBack()}>
                    <Image style = {stylesGlobal.header_backbuttonicon_style} source={require("../icons/icon_back.png")}/>
                </TouchableOpacity>
            </View>

        );
    };

    renderMainView = () => {
        return (
            <View style={{ flex: 1, }}>
                <FlatList
                    style = {{width: '100%',}}
                    columnWrapperStyle = {{width: '100%'}}
                    extraData={this.state}
                    numColumns = {this.state.is_portrait ? 2 : 4}
                    key = {this.state.is_portrait ? 2 : 4}
                    keyExtractor={(item, index) => index.toString()}
                    data={this.state.dataSource}
                    renderItem={({item, index}) => {
                        return (
                            <View style={{alignItems:'center', justifyContent:'center', width: this.state.is_portrait ? '50%' : '25%', aspectRatio: 1}}>
                                {this.renderAlbumItem(item, index)}
                            </View>
                        )
                    }}
                />
            </View>
        );
    }
  

    /**
   * diplay album row data
   */
    renderAlbumItem = (data, index) => {

        var urlToShow = data.imgpath + Constants.THUMB_FOLDER + data.filename;
        return (
            <TouchableOpacity style={styles.containerRow} onPress={() => {
                this.props.navigation.navigate("ImageZoom", {
                    index: index,
                    tempGalleryUrls: this.state.tempGalleryUrls
                });
            }}>
                <ImageCompressor
                    style={{
                        width: '100%',
                        height: '100%'
                    }}
                    uri={urlToShow}
                />

            </TouchableOpacity>
        );
    }

}

const styles = {
    container: {
        backgroundColor: Colors.black,
        flex: 1,
    },
    containerRow: {
        width: '100%',
        aspectRatio: 1,
        padding: 2,
    },
}
