import React, { Component, Fragment } from 'react'
import { View, Image, Text, TouchableOpacity, SafeAreaView, Dimensions } from 'react-native'
import { Colors } from "../consts/Colors";
import { stylesGlobal, STICKY_HEADER_HEIGHT } from '../consts/StyleSheet'
// import Gallery from '../custom_components/react-native-photo-gallery';
import Gallery from '../custom_components/react-native-image-gallery/Gallery';
import {Pagination} from "../custom_components/react-native-image-gallery/Pagination"

var TAG = "ImageZoomScreen";
export default class ImageZoomScreen extends Component {

    constructor(props) {
        super(props)
        this.state = {
            currentIndex: 0,
            images: [],
            showImage: false,
            is_portrait: true,
        }
    }

    UNSAFE_componentWillMount() {
        
        var initalIndex = this.props.route.params.index;
        var imageUrls = this.props.route.params.tempGalleryUrls;
        for(var i = 0; i < imageUrls.length; i ++) {
            imageUrls[i].source = imageUrls[i].image
        }
        
        this.setState({
            currentIndex: initalIndex,
            images: imageUrls,
            showImage: true
        })
        console.log(initalIndex)

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

    goTo = index => {
        // this.sendCurrentImageInfo(this.props.data[index]);
        this.setState({ currentIndex: index, initalIndex: index });
        // this.swiper.scrollToIndex({
        //   animated: true,
        //   index: index
        // });
    };


    render() {
        return (
            <Fragment>
                <SafeAreaView style={{flex:0,backgroundColor:Colors.black}}/>
                <SafeAreaView style={styles.container}>
                    <View style = {[stylesGlobal.headerView, {zIndex: 10, position: 'absolute', top: 0, left: 0, right: 0}]}>
                        <View style = {{flex: 1, flexDirection: 'row', alignItems: 'center'}}>
                            <TouchableOpacity
                                style={stylesGlobal.header_backbuttonview_style}
                                onPress={() => {
                                    this.props.navigation.goBack();
                                }}
                            >
                                <Image style = {stylesGlobal.header_backbuttonicon_style} source={require("../icons/icon_back.png")}/>
                            </TouchableOpacity>
                            <TouchableOpacity style={stylesGlobal.header_logoview_style} onPress = {() => this.props.navigation.navigate('Dashboard', {logoclick: true})}>
                                <Image style={stylesGlobal.header_logo_style} source={require("../icons/logo_new.png")}/>
                            </TouchableOpacity>
                        </View>
                        <View style = {{width: 100, height: '100%', alignItems: 'center', justifyContent: 'flex-end', flexDirection: 'row'}}>
                            <Text style={[styles.pageTitle, stylesGlobal.font]}>{this.state.currentIndex + 1} of {this.state.images.length}</Text>
                        </View>
                    </View>
                {
                    this.state.showImage &&
                    // <Gallery
                    //     data={this.state.images}
                    //     initialPaginationSize={this.state.images.length}
                    //     initialNumToRender={this.state.currentIndex}
                    //     initialIndex={this.state.currentIndex}
                    //     pageSwipe={this.pageSwipe}
                    // />
                    <View style = {{flex: 1}}>
                        <Gallery
                            images={this.state.images}
                            initialPage = {this.state.currentIndex}
                            onPageScroll = {(event) => this.setState({currentIndex: event.position})}
                        />
                        {/* <Pagination */}
                        {/*     index={this.state.currentIndex} */}
                        {/*     data={this.state.images} */}
                        {/*     initialPaginationSize={this.state.images.length || 10} */}
                        {/*     goTo={this.goTo} */}
                        {/* /> */}
                    </View>
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
}

const styles = {
    container: {
        flex: 1,
        backgroundColor: 'black',
        
    },
    pageTitle: {
        fontSize: 13,
        color: Colors.white,
        backgroundColor: Colors.transparent
    }
}