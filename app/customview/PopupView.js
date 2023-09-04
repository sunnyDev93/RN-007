import React from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Image,
  FlatList,
  Dimensions,
} from "react-native";
import WebService from "../core/WebService";
import { EventRegister } from "react-native-event-listeners";
import { Constants } from "../consts/Constants";
import { Colors } from "../consts/Colors";
import { stylesGlobal } from "../consts/StyleSheet";
import * as GlobalStyleSheet from "../consts/StyleSheet";
import * as Global from "../consts/Global";
import Memory from "../core/Memory";
import AsyncStorage from "@react-native-community/async-storage";
import ProgressIndicator from "../components/ProgressIndicator";
import { ImageCompressor } from "../components/ImageCompressorClass";

var TAG = "DashboardPopupView";

export default class PopupView extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      userId: "",
      userToken: "",
      userSlug: "",
      userFirstName: "",
      userLastName: "",
      userImagePath: "",
      userImageName: "",
      user_email: "",

      is_portrait: true,
      screen_height: Dimensions.get("screen").height,

      payment_failed_view: false,
      profile_status_view: false,
      profile_percentage: 100,
    };
    this.onEndReachedCalledDuringMomentum = true;
  }

  async componentDidMount() {
    try {
      let userFirstName = await AsyncStorage.getItem(
        Constants.KEY_USER_FIRST_NAME
      );
      let userLastName = await AsyncStorage.getItem(
        Constants.KEY_USER_LAST_NAME
      );
      let userImagePath = await AsyncStorage.getItem(
        Constants.KEY_USER_IMAGE_URL
      );
      let userImageName = await AsyncStorage.getItem(
        Constants.KEY_USER_IMAGE_NAME
      );
      var userId = await AsyncStorage.getItem(Constants.KEY_USER_ID);
      var userToken = await AsyncStorage.getItem(Constants.KEY_USER_TOKEN);
      var userSlug = await AsyncStorage.getItem(Constants.KEY_USER_SLUG);
      var user_email = await AsyncStorage.getItem(Constants.KEY_USER_EMAIL);

      this.setState({
        userId: userId,
        userToken: userToken,
        userSlug: userSlug,
        userFirstName: userFirstName,
        userLastName: userLastName,
        userImagePath: userImagePath,
        userImageName: userImageName,
        user_email: user_email,
      });

      if (Dimensions.get("window").width < Dimensions.get("window").height) {
        this.setState({
          is_portrait: true,
          screen_height: Dimensions.get("screen").height,
        });
      } else {
        this.setState({
          is_portrait: false,
          screen_height: Dimensions.get("screen").width,
        });
      }

      Dimensions.addEventListener("change", () => {
        if (Dimensions.get("window").width < Dimensions.get("window").height) {
          this.setState({
            is_portrait: true,
            screen_height: Dimensions.get("screen").height,
          });
        } else {
          this.setState({
            is_portrait: false,
            screen_height: Dimensions.get("screen").width,
          });
        }
      });

      this.getPaymentStatus();
      this.getProfileStatus();
    } catch (error) {
      // Error retrieving data
      console.log(TAG + " getData  error  " + error);
    }
  }

  componentWillUnmount() {
    Dimensions.removeEventListener("change");
  }

  getPaymentStatus = async () => {
    try {
      let uri =
        Memory().env == "LIVE"
          ? Global.URL_PAYMENT_CHECK
          : Global.URL_PAYMENT_CHECK_DEV;
      let params = new FormData();
      params.append("token", this.state.userToken);
      params.append("user_id", this.state.userId);
      params.append("format", "json");

      console.log(TAG + " callPaymentStatusAPI uri " + uri);
      console.log(
        TAG + " callPaymentStatusAPI params " + JSON.stringify(params)
      );

      WebService.callServicePost(uri, params, this.handlePaymentStatusResponse);
    } catch (error) {}
  };

  /**
   * handle delete post  API response
   */
  handlePaymentStatusResponse = (response, isError) => {
    console.log(
      TAG + " callPaymentStatusAPI Response " + JSON.stringify(response)
    );
    console.log(TAG + " callPaymentStatusAPI isError " + isError);

    if (!isError) {
      var result = response;
      if (typeof result != undefined && result != null) {
        if (result.status == "success") {
          if (result.payment_failed) {
            this.setState({
              payment_failed_view: true,
            });
          } else {
            this.setState({
              payment_failed_view: false,
            });
          }
        }
      }
    } else {
      if (response != undefined && response != null && response.length > 0) {
        Alert.alert(response.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
      }
    }
  };

  getProfileStatus = async () => {
    try {
      let uri =
        Memory().env == "LIVE"
          ? Global.URL_PROFILE_STATUS
          : Global.URL_PROFILE_STATUS_DEV;
      let params = new FormData();
      params.append("token", this.state.userToken);
      params.append("user_id", this.state.userId);
      params.append("format", "json");

      console.log(TAG + " callProfileStatusAPI uri " + uri);
      console.log(
        TAG + " callProfileStatusAPI params " + JSON.stringify(params)
      );

      WebService.callServicePost(uri, params, this.handleProfileStatusResponse);
    } catch (error) {}
  };

  /**
   * handle delete post  API response
   */
  handleProfileStatusResponse = (response, isError) => {
    console.log(
      TAG + " callProfileStatusAPI Response " + JSON.stringify(response)
    );
    console.log(TAG + " callProfileStatusAPI isError " + isError);

    if (!isError) {
      var result = response;
      if (typeof result != undefined && result != null) {
        if (result.status == "success") {
          if (result.percentage == 100) {
            this.setState({
              profile_status_view: false,
            });
          } else {
            if (result.percentage == 20) {
              this.setState({
                bar_image: require("../icons/20_percent.png"),
              });
            } else if (result.percentage == 40) {
              this.setState({
                bar_image: require("../icons/40_percent.png"),
              });
            } else if (result.percentage == 60) {
              this.setState({
                bar_image: require("../icons/60_percent.png"),
              });
            } else if (result.percentage == 80) {
              this.setState({
                bar_image: require("../icons/80_percent.png"),
              });
            }
            this.setState({
              profile_status_view: true,
              profile_bar_popup: true,
              profile_percentage: result.percentage,
            });
          }
        }
      }
    } else {
      if (response != undefined && response != null && response.length > 0) {
        Alert.alert(response.replace(/<\/?[^>]+>/gi, '').replace(/\\n/g, '').replace(/\"/g, ""));
      }
    }
  };

  setPaymentCheckFailed = async (status) => {
    this.setState({
      payment_failed_view: status,
    });
  };

  render() {
    if (true) {
      return (
        <View
          style={[
            {
              position: "absolute",
              left: 0,
              top: 0,
              right: 0,
              bottom: 0,
              zIndex: 200,
              elevation: 200,
              alignItems: "center",
            },
          ]}
        >
          <View
            style={{
              width: "100%",
              height: "100%",
              position: "absolute",
              backgroundColor: Colors.black,
              opacity: 0.3,
            }}
          />
          <View
            style={{
              width: "80%",
              height: "100%",
              alignItems: "center",
              justifyContent: "center",
              paddingHorizontal: this.state.is_portrait ? 10 : 0,
            }}
          >
            <View
              style={{
                width: this.state.is_portrait ? "100%" : "90%",
                borderRadius: 10,
                backgroundColor: Colors.white,
                overflow: "hidden",
              }}
            >
              <View
                style={{
                  width: "100%",
                  padding: 20,
                  borderBottomColor: Colors.lightGray,
                  borderBottomWidth: 1,
                }}
              >
                <Text
                  style={[
                    { fontSize: 16, color: Colors.black },
                    stylesGlobal.font,
                  ]}
                >
                  {"Upgrade Your Account"}
                </Text>
              </View>
              <View
                style={{
                  width: "100%",
                  padding: 20,
                  borderBottomColor: Colors.lightGray,
                  borderBottomWidth: 1,
                }}
              >
                <Text
                  style={[
                    { fontSize: 14, color: Colors.black },
                    stylesGlobal.font,
                  ]}
                >
                  {
                    "Please upgrade your account to message the Inner Circle of The 0.07% "
                  }
                </Text>
              </View>
              <View style={{ padding: 20, alignItems: "flex-end" }}>
                <TouchableOpacity
                  style={[
                    stylesGlobal.common_button,
                    stylesGlobal.shadow_style,
                  ]}
                  onPress={() => {
                    this.props.navigation.push("Dashboard", {
                      selected_screen: "myaccount",
                      myaccount_initial_tab: true,
                    });
                    console.log(this.props, "111111111111");
                  }}
                >
                  <Text
                    style={[
                      { fontSize: 16, color: Colors.white },
                      stylesGlobal.font,
                    ]}
                  >
                    {"OK"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      );
    } else {
      return null;
    }
  }
}

const styles = StyleSheet.create({});
