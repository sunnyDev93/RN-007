import React, {Component} from "react";
import {
  ActivityIndicator,
  Platform,
  Image,
  View,
  ScrollView,
  Dimensions
} from "react-native";
import PhotoView from "react-native-photo-view";
import PropTypes from "prop-types";

// const Slide = ({ item }) => {
  export default class Slide extends Component {
    constructor(props) {
      super(props);
      this.state = {
        load_image: false,
        width: Dimensions.get("window").width,
        height: Dimensions.get("window").height
      }
    }

    UNSAFE_componentWillMount() {
      if(Dimensions.get("window").width < Dimensions.get("window").height) {
          this.setState({
              is_portrait: true,
              width: Dimensions.get("window").width,
              height: Dimensions.get("window").height
          })
      } else {
          this.setState({
              is_portrait: false,
              width: Dimensions.get("window").height,
              height: Dimensions.get("window").width
          })
      }
      Dimensions.addEventListener("change", () => {
          if(Dimensions.get("window").width < Dimensions.get("window").height) {
              this.setState({
                  is_portrait: true,
                  width: Dimensions.get("window").width,
                  height: Dimensions.get("window").height
              })
          } else {
              this.setState({
                  is_portrait: false,
                  width: Dimensions.get("window").height,
                  height: Dimensions.get("window").width
              })
          }
      })
    }

    render() {
      const inside = {
        width: this.state.width,
        height: this.state.height
      };

      return (
        <View
          style={[
            styles.slideC,
            {
              width: this.state.width,
              height: this.state.height,
            }
          ]}
        >
          {/* <ActivityIndicator style={styles.loader} /> */}
          {
            this.state.load_image &&
            <View style = {{zIndex: 100, elevation: 10, position: 'absolute'}}>
              <Image style = {[{width: 50, height: 50, zIndex: 10,}]} resizeMode = {'contain'} source={require("../../../icons/loader.gif")}/>
            </View>
          }
          {Platform.OS === "android" ? (
            <PhotoView
              source={this.props.item.image}
              maximumZoomScale={3}
              zoomScale={1}
              androidScaleType="centerInside"
              resizeMode="contain"
              style={[styles.scrollViewC, inside]}
            />
          ) : (
            <ScrollView
              maximumZoomScale={4}
              zoomScale={1}
              style={[{ flex: 1}, inside]}
              contentContainerStyle={styles.scrollViewContainer}
              showsVerticalScrollIndicator={false}
            >
              <Image
                onLoadStart = {() => this.setState({load_image: true})} onLoadEnd = {() => this.setState({load_image: false})}
                source={this.props.item.image}
                accessible={true}
                style={inside}
                resizeMode="contain"
              />
            </ScrollView>
          )}
          {this.props.item.overlay}
        </View>
      );
    }
}

// Slide.propTypes = {
//   item: PropTypes.object.isRequired
// };

const styles = {
  slideC: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollViewC: {
    alignItems: "center",
    top: Platform.OS === "android" ? -32 : 70,
    justifyContent: "center"
  },
  // loader: {
  //   position: "absolute",
  //   top: this.state.height / 2 - 10,
  //   left: this.state.width / 2 - 10
  // }
};

// export { Slide };
