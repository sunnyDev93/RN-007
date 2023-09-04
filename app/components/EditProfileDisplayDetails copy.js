import React, { Component } from "react";
import {
    StyleSheet,
    Text,
    View,
    TextInput,
    TouchableOpacity,
    Image,
} from "react-native";
import * as ValidationUtils from "../utils/ValidationUtils";
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import { Dropdown } from 'react-native-material-dropdown';
import { Colors } from "../consts/Colors";
import DateTimePicker from "react-native-modal-datetime-picker";
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import CountryPicker, { getAllCountries } from 'react-native-country-picker-modal';
import Geocoder from "react-native-geocoder";
import Moment from "moment/moment";
import { Constants } from "../consts/Constants";
import {stylesGlobal} from '../consts/StyleSheet';
import AutoComplete from 'react-native-autocomplete-input';
import Icon from 'react-native-vector-icons/Feather'
import {removeCountryCode} from "../utils/Util";
import * as Global from "../consts/Global";
import { parseNumber, parsePhoneNumberFromString } from 'libphonenumber-js';
import RNPickerSelect from 'react-native-picker-select';
import AsyncStorage from '@react-native-community/async-storage';
import ModalDropdown from '../custom_components/react-native-modal-dropdown/ModalDropdown';

var TAG = "EditProfileDisplayDetails";

var selected_eye_color = 0;
var selected_skin_color = 0;
var selected_hair_color = 0;
var selected_height = 0;
var selected_weight = 0;
var selected_ethnicity = 0;
var selected_marital_status = 0;
var selected_body = 0;
var selected_bust_chest = 0;
var selected_waist = 0;
var selected_hip_inseam = 0;
var selected_gender = 0;
var selected_net_worth = 0;
var profileDetail;


var valueFirstName;
var valueLastName;
var valueEmail;
var valuePhone;
var valueNetWorthAnnualy;
var valueMessageGoldCoin;
var valueFirstName;
var cardPadding = 10;
var isHidden = true;
let location = "";

export default class EditProfileDisplayDetails extends React.Component {

    constructor() {
        super();

        this.state = {
            eye_color_array: [],
            skin_color_array: [],
            hair_color_array: [],
            height_array: [],
            weight_array: [],
            ethnicity_array: [],
            marital_status_array: [],
            body_array: [],
            languages_known_array: [],
            bust_chest_array: [],
            waist_array: [],
            hip_inseam_array: [],
            gender_array: [{
                label: 'Male',
                value: 'Male',
            }, {
                label: 'Female',
                value: 'Female',
            }],
            valueFirstName: '',
            valueLastName: '',
            valueEmail: '',
            valueDateOfBirth: '',
            valueLocation: '',
            valuePhone: '',
            valueNetWorthAnnualy: '',
            valueTemp: '',
            valueMessageGoldCoin: '',
            valueAboutMe: '',
            valueThingsIlike: '',
            languageList: [],
            selectedLanguageList: [],
            showLanguageDialog: false,
            callingCode: "1",
            countryName: 'US',
            emptyField:'',
            query:'',

            isDateTimePickerVisible: false,

            language_view_height: 0,

            selected_row: '',
            show_visibility: false,
            selected_category: 0,
            selected_category_dob: 0,
            selected_category_phone: 0,
            selected_category_location: 0,
            selected_category_eyecolor: 0,
            selected_category_skincolor: 0,
            selected_category_haircolor: 0,
            selected_category_height: 0,
            selected_category_weight: 0,
            selected_category_ethinicity: 0,
            selected_category_maritalstatus: 0,
            selected_category_body: 0,
            selected_category_aboutme: 0,
            selected_category_thingsilike: 0,
            category_array: Global.category_array_others,
            visibility_view_y: 0,
            visibility_view_y_dob: 0,
            visibility_view_y_phone: 0,
            visibility_view_y_location: 0,
            visibility_view_y_eyecolor: 0,
            visibility_view_y_skincolor: 0,
            visibility_view_y_haircolor: 0,
            visibility_view_y_height: 0,
            visibility_view_y_weight: 0,
            visibility_view_y_ethinicity: 0,
            visibility_view_y_maritalstatus: 0,
            visibility_view_y_body: 0,
            visibility_view_y_aboutme: 0,
            visibility_view_y_thingsilike: 0,

            searchText: "",
            member_plan: '',

            selected_gender_value: '',
            selected_eye_color_value: '',
            selected_skin_color_value: '',
            selected_hair_color_value: '',
            selected_height_value: '',
            selected_weight_value: '',
            selected_ethnicity_value: '',
            selected_marital_status_value: '',
            selected_body: '',
        };
    }
    /**
    * get profile info data
    */
    async UNSAFE_componentWillMount() {

        var firstName = "";
        if (this.props.profileInfo.profileData.first_name != undefined && this.props.profileInfo.profileData.first_name != null) {
            firstName = this.props.profileInfo.profileData.first_name;
        }

        var lastName = "";
        if (this.props.profileInfo.profileData.last_name != undefined && this.props.profileInfo.profileData.last_name != null) {
            lastName = this.props.profileInfo.profileData.last_name;
        }

        var email = "";
        if (this.props.profileInfo.profileData.email != undefined && this.props.profileInfo.profileData.email != null) {
            email = this.props.profileInfo.profileData.email;
        }

        var phone = "";
        if (this.props.profileInfo.profileData.phone != undefined && this.props.profileInfo.profileData.phone != null) {
            phone = this.props.profileInfo.profileData.phone;
        }

        var address = "";
        if (this.props.profileInfo.profileData.address != undefined && this.props.profileInfo.profileData.address != null) {
            address = this.props.profileInfo.profileData.address;
        }

        var netWorth = "";
        if (this.props.profileInfo.profileData.networth_amount != undefined && this.props.profileInfo.profileData.networth_amount != null) {
            netWorth = this.props.profileInfo.profileData.networth_amount;
        }

        var messageGoldCoint = "";
        if (this.props.profileInfo.profileData.user_chat_cost != undefined && this.props.profileInfo.profileData.user_chat_cost != null) {
            messageGoldCoint = this.props.profileInfo.profileData.user_chat_cost;
        }

        var aboutMe = "";
        if (this.props.profileInfo.profileData.general_info != undefined && this.props.profileInfo.profileData.general_info != null) {
            aboutMe = this.props.profileInfo.profileData.general_info;
        }

        var thingnILike = "";
        if (this.props.profileInfo.profileData.things_i_like != undefined && this.props.profileInfo.profileData.things_i_like != null) {
            thingnILike = this.props.profileInfo.profileData.things_i_like;
        }
        
        var lang_custom_index = 0
        let customFieldsData = this.props.profileInfo.customFields
        for(i = 0; i < customFieldsData.length; i ++) {
            for(j = 0; j < customFieldsData[i].length; j ++) {
                customFieldsData[i][j].label = customFieldsData[i][j].value
            }
            if(customFieldsData[i][0].field_name_key == "eye_color") {
                this.setState({
                    eye_color_array: customFieldsData[i],
                })
            } else if(customFieldsData[i][0].field_name_key == "skin_color") {
                this.setState({
                    skin_color_array: customFieldsData[i],
                })
            } else if(customFieldsData[i][0].field_name_key == "hair_color") {
                this.setState({
                    hair_color_array: customFieldsData[i],
                })
            } else if(customFieldsData[i][0].field_name_key == "height") {
                this.setState({
                    height_array: customFieldsData[i],
                })
            } else if(customFieldsData[i][0].field_name_key == "weight") {
                this.setState({
                    weight_array: customFieldsData[i],
                })
            } else if(customFieldsData[i][0].field_name_key == "ethnicity") {
                this.setState({
                    ethnicity_array: customFieldsData[i],
                })
            } else if(customFieldsData[i][0].field_name_key == "marital_status") {
                this.setState({
                    marital_status_array: customFieldsData[i],
                })
            } else if(customFieldsData[i][0].field_name_key == "body") {
                this.setState({
                    body_array: customFieldsData[i],
                })
            } else if(customFieldsData[i][0].field_name_key == "languages_known") {
                this.setState({
                    languages_known_array: customFieldsData[i],
                })
            }
        }
        this.setState({
            // // eye_color_array: customFieldsData.eye_color,
            // eye_color_array: customFieldsData[0],
            // // skin_color_array: customFieldsData.skin_color,
            // skin_color_array: customFieldsData[1],
            // // hair_color_array: customFieldsData.hair_color,
            // hair_color_array: customFieldsData[2],
            // // height_array: customFieldsData.height,
            // height_array: customFieldsData[3],
            // // weight_array: customFieldsData.weight,
            // weight_array: customFieldsData[4],
            // // ethnicity_array: customFieldsData.ethnicity,
            // ethnicity_array: customFieldsData[5],
            // // marital_status_array: customFieldsData.marital_status,
            // marital_status_array: customFieldsData[6],
            // // body_array: customFieldsData.body,
            // body_array: customFieldsData[7],
            // // languages_known_array: customFieldsData.languages_known,
            // languages_known_array: customFieldsData[8],

            bust_chest_array: customFieldsData.bust_chest,
            waist_array: customFieldsData.waist,
            hip_inseam_array: customFieldsData.hip_inseam,
            valueFirstName: firstName,
            valueLastName: lastName,
            valueEmail: email,
            valuePhone: phone,
            
            valueLocation: address,
            
            valueNetWorthAnnualy: netWorth,
            valueMessageGoldCoin: messageGoldCoint,
            valueTemp: '',
            valueAboutMe: aboutMe,
            valueThingsIlike: thingnILike,
            languageList: customFieldsData.languages_known,
            selectedLanguageList: this.props.profileInfo.userCustomFields.languages_known.split(', '),
            showLanguageDialog: false,

        })
        if(this.props.profileInfo.profileData.dob) {
            this.setState({
                valueDateOfBirth: Moment(this.props.profileInfo.profileData.dob).format("MM/DD/YYYY"),
            })
        } else {
            this.setState({
                valueDateOfBirth: Moment(new Date()).format("MM/DD/YYYY"),
            })
        }
        if(phone != null && phone != "") {
            var phone_class = null;
            if(phone.charAt(0) != '+') {
                phone = '+' + phone;
            }
            phone_class = parsePhoneNumberFromString(phone);
            
            if(phone_class) {
                this.setState({
                    valuePhone: phone_class.nationalNumber,
                    callingCode: phone_class.countryCallingCode,
                    countryName: phone_class.country
                })
            }
        }

        this.onGeoCodeSearchFunc(address)

        this.setUpInitailData();

        if(this.props.profileInfo.other_fields.age != null) {
            for(i = 0; i < this.state.category_array.length; i ++) {
                if(this.state.category_array[i].value.toString() == this.props.profileInfo.other_fields.age) {
                    this.setState({
                        selected_category_dob: i
                    })
                    break;
                }
            }
        } 
        if(this.props.profileInfo.other_fields.location != null) {
            for(i = 0; i < this.state.category_array.length; i ++) {
                if(this.state.category_array[i].value.toString() == this.props.profileInfo.other_fields.location) {
                    this.setState({
                        selected_category_location: i
                    })
                    break;
                }
            }
        } 
        if(this.props.profileInfo.other_fields.about_me != null) {
            for(i = 0; i < this.state.category_array.length; i ++) {
                if(this.state.category_array[i].value.toString() == this.props.profileInfo.other_fields.about_me) {
                    this.setState({
                        selected_category_aboutme: i
                    })
                    break;
                }
            }
        } 
        if(this.props.profileInfo.other_fields.things_i_likes != null) {
            for(i = 0; i < this.state.category_array.length; i ++) {
                if(this.state.category_array[i].value.toString() == this.props.profileInfo.other_fields.things_i_likes) {
                    this.setState({
                        selected_category_thingsilike: i
                    })
                    break;
                }
            }
        } 
        if(this.props.profileInfo.visibility["1"] != null) {
            for(i = 0; i < this.state.category_array.length; i ++) {
                if(this.state.category_array[i].value.toString() == this.props.profileInfo.visibility["1"]) {
                    this.setState({
                        selected_category_eyecolor: i
                    })
                    break;
                }
            }
        } 
        if(this.props.profileInfo.visibility["2"] != null) {
            for(i = 0; i < this.state.category_array.length; i ++) {
                if(this.state.category_array[i].value.toString() == this.props.profileInfo.visibility["2"]) {
                    this.setState({
                        selected_category_skincolor: i
                    })
                    break;
                }
            }
        } 
        if(this.props.profileInfo.visibility["3"] != null) {
            for(i = 0; i < this.state.category_array.length; i ++) {
                if(this.state.category_array[i].value.toString() == this.props.profileInfo.visibility["3"]) {
                    this.setState({
                        selected_category_haircolor: i
                    })
                    break;
                }
            }
        } 
        if(this.props.profileInfo.visibility["7"] != null) {
            for(i = 0; i < this.state.category_array.length; i ++) {
                if(this.state.category_array[i].value.toString() == this.props.profileInfo.visibility["7"]) {
                    this.setState({
                        selected_category_height: i
                    })
                    break;
                }
            }
        } 
        if(this.props.profileInfo.visibility["8"] != null) {
            for(i = 0; i < this.state.category_array.length; i ++) {
                if(this.state.category_array[i].value.toString() == this.props.profileInfo.visibility["8"]) {
                    this.setState({
                        selected_category_weight: i
                    })
                    break;
                }
            }
        } 
        if(this.props.profileInfo.visibility["13"] != null) {
            for(i = 0; i < this.state.category_array.length; i ++) {
                if(this.state.category_array[i].value.toString() == this.props.profileInfo.visibility["13"]) {
                    this.setState({
                        selected_category_ethinicity: i
                    })
                    break;
                }
            }
        } 
        if(this.props.profileInfo.visibility["21"] != null) {
            for(i = 0; i < this.state.category_array.length; i ++) {
                if(this.state.category_array[i].value.toString() == this.props.profileInfo.visibility["21"]) {
                    this.setState({
                        selected_category_maritalstatus: i
                    })
                    break;
                }
            }
        } 
        if(this.props.profileInfo.visibility["22"] != null) {
            for(i = 0; i < this.state.category_array.length; i ++) {
                if(this.state.category_array[i].value.toString() == this.props.profileInfo.visibility["22"]) {
                    this.setState({
                        selected_category_body: i
                    })
                    break;
                }
            }
        } 

        try {
            var member_plan = await AsyncStorage.getItem(Constants.KEY_MEMBER_PLAN);
            this.setState({
                member_plan: member_plan,
            });
        } catch (error) {
            // Error retrieving data
        }

    }
    /**
    * display yprofile info data
    */
    setUpInitailData = () => {
        profileDetail = this.props.profileInfo;
        // let {customFieldsData = {}} = this.props
        // if (!customFieldsData) {
        //     customFieldsData = {}
        // }
        let customFieldsData = this.props.profileInfo.customFields
        if (typeof profileDetail.profileData.gender != "undefined" && profileDetail.profileData.gender != undefined && profileDetail.profileData.gender != null) {
            for (var i = 0; i < this.state.gender_array.length; i++) {
                if (this.state.gender_array[i].value.toLowerCase() == profileDetail.profileData.gender.toLowerCase()) {
                    selected_gender = i;
                    this.setState({
                        selected_gender_value: this.state.gender_array[i].value
                    })
                }
            }
        }

        // if (typeof profileDetail.userCustomFields.eye_color != "undefined" && profileDetail.userCustomFields.eye_color != undefined && profileDetail.userCustomFields.eye_color != null) {
        //     var exist = false;
        //     for (var i = 0; i < customFieldsData[0].length; i++) {
        //         if (customFieldsData[0][i].id.toLowerCase() == profileDetail.userCustomFields.eye_color.toLowerCase()) {
        //             selected_eye_color = i;
        //             this.setState({
        //                 selected_eye_color_value: customFieldsData[0][i].value
        //             });
        //             exist = true;
        //         }
        //     }
        //     if(!exist) {
        //         this.setState({
        //             selected_eye_color_value: customFieldsData[0][0].value
        //         });
        //     }
        // }

        // if (typeof profileDetail.userCustomFields.skin_color != "undefined" && profileDetail.userCustomFields.skin_color != undefined && profileDetail.userCustomFields.skin_color != null) {
        //     var exist = false;
        //     for (var i = 0; i < customFieldsData[1].length; i++) {
        //         if (customFieldsData[1][i].value.toLowerCase() == profileDetail.userCustomFields.skin_color.toLowerCase()) {
        //             selected_skin_color = i;
        //             this.setState({
        //                 selected_skin_color_value: customFieldsData[1][i].value
        //             });
        //             exist = true;
        //         }
        //     }
        //     if(!exist) {
        //         this.setState({
        //             selected_skin_color_value: customFieldsData[1][0].value
        //         });
        //     }
        // }

        // if (typeof profileDetail.userCustomFields.hair_color != "undefined" && profileDetail.userCustomFields.hair_color != undefined && profileDetail.userCustomFields.hair_color != null) {
        //     var exist = false;
        //     for (var i = 0; i < customFieldsData[2].length; i++) {
        //         if (customFieldsData[2][i].value.toLowerCase() == profileDetail.userCustomFields.hair_color.toLowerCase()) {
        //             selected_hair_color = i;
        //             this.setState({
        //                 selected_hair_color_value: customFieldsData[2][i].value
        //             });
        //             exist = true;
        //         }
        //     }
        //     if(!exist) {
        //         this.setState({
        //             selected_hair_color_value: customFieldsData[2][0].value
        //         });
        //     }
        // }

        // if (typeof profileDetail.userCustomFields.height != "undefined" && profileDetail.userCustomFields.height != undefined && profileDetail.userCustomFields.height != null) {
        //     var exist = false;
        //     for (var i = 0; i < customFieldsData[3].length; i++) {
        //         if (customFieldsData[3][i].value.toLowerCase() == profileDetail.userCustomFields.height.toLowerCase()) {
        //             selected_height = i;
        //             this.setState({
        //                 selected_height_value: customFieldsData[3][i].value
        //             });
        //             exist = true;
        //         }
        //     }
        //     if(!exist) {
        //         this.setState({
        //             selected_height_value: customFieldsData[3][0].value
        //         });
        //     }
        // }

        // if (typeof profileDetail.userCustomFields.weight != "undefined" && profileDetail.userCustomFields.weight != undefined && profileDetail.userCustomFields.weight != null) {
        //     var exist = false;
        //     for (var i = 0; i < customFieldsData[4].length; i++) {
        //         if (customFieldsData[4][i].value.toLowerCase() == profileDetail.userCustomFields.weight.toLowerCase()) {
        //             selected_weight = i;
        //             this.setState({
        //                 selected_weight_value: customFieldsData[4][i].value
        //             });
        //             exist = true;
        //         }
        //     }
        //     if(!exist) {
        //         this.setState({
        //             selected_weight_value: customFieldsData[4][0].value
        //         });
        //     }
        // }

        // if (typeof profileDetail.userCustomFields.ethnicity != "undefined" && profileDetail.userCustomFields.ethnicity != undefined && profileDetail.userCustomFields.ethnicity != null) {
        //     var exist = false;
        //     for (var i = 0; i < customFieldsData[5].length; i++) {
        //         if (customFieldsData[5][i].value.toLowerCase() == profileDetail.userCustomFields.ethnicity.toLowerCase()) {
        //             selected_ethnicity = i;
        //             this.setState({
        //                 selected_ethnicity_value: customFieldsData[5][i].value
        //             });
        //             exist = true;
        //         }
        //     }
        //     if(!exist) {
        //         this.setState({
        //             selected_ethnicity_value: customFieldsData[5][0].value
        //         });
        //     }
        // }

        // if (typeof profileDetail.userCustomFields.marital_status != "undefined" && profileDetail.userCustomFields.marital_status != undefined && profileDetail.userCustomFields.marital_status != null) {
        //     var exist = false;
        //     for (var i = 0; i < customFieldsData[6].length; i++) {
        //         if (customFieldsData[6][i].value.toLowerCase() == profileDetail.userCustomFields.marital_status.toLowerCase()) {
        //             selected_marital_status = i;
        //             this.setState({
        //                 selected_marital_status_value: customFieldsData[6][i].value
        //             });
        //             exist = true;
        //         }
        //     }
        //     if(!exist) {
        //         this.setState({
        //             selected_marital_status_value: customFieldsData[6][0].value
        //         });
        //     }
        // }

        // if (typeof profileDetail.userCustomFields.body != "undefined" && profileDetail.userCustomFields.body != undefined && profileDetail.userCustomFields.body != null) {
        //     var exist = false;
        //     for (var i = 0; i < customFieldsData[7].length; i++) {
        //         if (customFieldsData[7][i].value.toLowerCase() == profileDetail.userCustomFields.body.toLowerCase()) {
        //             selected_body = i;
        //             this.setState({
        //                 selected_body_value: customFieldsData[7][i].value
        //             });
        //             exist = true;
        //         }
        //     }
        //     if(!exist) {
        //         this.setState({
        //             selected_body_value: customFieldsData[7][0].value
        //         });
        //     }
        // }
        var exist = false;
        for(var index = 0; index < customFieldsData.length; index ++) {
            if(customFieldsData[index][0].field_name_key == "eye_color") {
                for (var i = 0; i < customFieldsData[index].length; i++) {
                    exist = false;
                    if (customFieldsData[index][i].value.toLowerCase() == profileDetail.userCustomFields.eye_color.toLowerCase()) {
                        selected_eye_color = i;
                        this.setState({
                            selected_eye_color_value: customFieldsData[index][i].value
                        });
                        exist = true;
                        break;
                    }
                }
                if(!exist) {
                    this.setState({
                        selected_eye_color_value: customFieldsData[index][0].value
                    });
                }
            } else if(customFieldsData[index][0].field_name_key == "skin_color") {
                for (var i = 0; i < customFieldsData[index].length; i++) {
                    exist = false;
                    if (customFieldsData[index][i].value.toLowerCase() == profileDetail.userCustomFields.skin_color.toLowerCase()) {
                        selected_skin_color = i;
                        this.setState({
                            selected_skin_color_value: customFieldsData[index][i].value
                        });
                        exist = true;
                        break;
                    }
                }
                if(!exist) {
                    this.setState({
                        selected_skin_color_value: customFieldsData[index][0].value
                    });
                }
            } else if(customFieldsData[index][0].field_name_key == "hair_color") {
                for (var i = 0; i < customFieldsData[index].length; i++) {
                    exist = false;
                    if (customFieldsData[index][i].value.toLowerCase() == profileDetail.userCustomFields.hair_color.toLowerCase()) {
                        selected_hair_color = i;
                        this.setState({
                            selected_hair_color_value: customFieldsData[index][i].value
                        });
                        exist = true;
                        break;
                    }
                }
                if(!exist) {
                    this.setState({
                        selected_hair_color_value: customFieldsData[index][0].value
                    });
                }
            } else if(customFieldsData[index][0].field_name_key == "height") {
                for (var i = 0; i < customFieldsData[index].length; i++) {
                    exist = false;
                    if (customFieldsData[index][i].value.toLowerCase() == profileDetail.userCustomFields.height.toLowerCase()) {
                        selected_height = i;
                        this.setState({
                            selected_height_value: customFieldsData[index][i].value
                        });
                        exist = true;
                        break;
                    }
                }
                if(!exist) {
                    this.setState({
                        selected_height_value: customFieldsData[index][0].value
                    });
                }
            } else if(customFieldsData[index][0].field_name_key == "weight") {
                for (var i = 0; i < customFieldsData[index].length; i++) {
                    exist = false;
                    if (customFieldsData[index][i].value.toLowerCase() == profileDetail.userCustomFields.weight.toLowerCase()) {
                        selected_weight = i;
                        this.setState({
                            selected_weight_value: customFieldsData[index][i].value
                        });
                        exist = true;
                        break;
                    }
                }
                if(!exist) {
                    this.setState({
                        selected_weight_value: customFieldsData[index][0].value
                    });
                }
            } else if(customFieldsData[index][0].field_name_key == "ethnicity") {
                for (var i = 0; i < customFieldsData[index].length; i++) {
                    exist = false;
                    if (customFieldsData[index][i].value.toLowerCase() == profileDetail.userCustomFields.ethnicity.toLowerCase()) {
                        selected_ethnicity = i;
                        this.setState({
                            selected_ethnicity_value: customFieldsData[index][i].value
                        });
                        exist = true;
                        break;
                    }
                }
                if(!exist) {
                    this.setState({
                        selected_ethnicity_value: customFieldsData[index][0].value
                    });
                }
            } else if(customFieldsData[index][0].field_name_key == "marital_status") {
                for (var i = 0; i < customFieldsData[index].length; i++) {
                    exist = false;
                    if (customFieldsData[index][i].value.toLowerCase() == profileDetail.userCustomFields.marital_status.toLowerCase()) {
                        selected_marital_status = i;
                        this.setState({
                            selected_marital_status_value: customFieldsData[index][i].value
                        });
                        exist = true;
                        break;
                    }
                }
                if(!exist) {
                    this.setState({
                        selected_marital_status_value: customFieldsData[index][0].value
                    });
                }
            } else if(customFieldsData[index][0].field_name_key == "body") {
                for (var i = 0; i < customFieldsData[index].length; i++) {
                    exist = false;
                    if (customFieldsData[index][i].value.toLowerCase() == profileDetail.userCustomFields.body.toLowerCase()) {
                        selected_body = i;
                        this.setState({
                            selected_body_value: customFieldsData[index][i].value
                        });
                        exist = true;
                        break;
                    }
                }
                if(!exist) {
                    this.setState({
                        selected_body_value: customFieldsData[index][0].value
                    });
                }
            }
        }
        let selectedLanguage = profileDetail.userCustomFields.languages_known.split(', ');
        // let selectedLanguage = [];
        // let newdata = profileDetail.userCustomFields.languages_known.split(', ');
        // if (typeof profileDetail.userCustomFields.languages_known != "undefined"
        //     && profileDetail.userCustomFields.languages_known != undefined
        //     && profileDetail.userCustomFields.languages_known != null) {
        //     for (var i = 0; i < this.props.customFieldsData.languages_known.length; i++) {
        //         if (newdata.indexOf(this.props.customFieldsData.languages_known[i].value) > -1) {
        //             selectedLanguage.push(
        //                 this.props.customFieldsData.languages_known[i].value
        //             )
        //         }
        //     }
        // }

        selected_bust_chest = 0;
        selected_waist = 0;
        selected_hip_inseam = 0;

        this.setState({
            selectedLanguageList: selectedLanguage
        })


    }

    /**
* refresh profile info
*/
    updateProfileInfo = () => {
        let address = this.state.valueLocation.trim();
        if (ValidationUtils.isEmptyOrNull(address)) {
            address = location;
        } 
        
        var jsonData = {
            first_name: this.state.valueFirstName.trim(),
            last_name: this.state.valueLastName.trim(),
            gender: selected_gender == -1 ? null : this.state.gender_array[selected_gender].value.toLowerCase(),
            email: this.state.valueEmail.trim(),
            dob: this.state.valueDateOfBirth,
            // phone: this.state.callingCode + this.state.valuePhone.trim(),
            address: address,
            eye_color: selected_eye_color == -1 ? this.state.eye_color_array[0].id : this.state.eye_color_array[selected_eye_color].id,
            skin_color: selected_skin_color == -1 ? this.state.skin_color_array[0].id :this.state.skin_color_array[selected_skin_color].id,
            hair_color: selected_hair_color == -1 ? this.state.hair_color_array[0].id : this.state.hair_color_array[selected_hair_color].id,
            height: selected_height == -1 ? this.state.height_array[0].id : this.state.height_array[selected_height].id,
            weight: selected_weight == -1 ? this.state.weight_array[0].id : this.state.weight_array[selected_weight].id,
            ethnicity: selected_ethnicity == -1 ? this.state.ethnicity_array[0].id :this.state.ethnicity_array[selected_ethnicity].id,
            marital_status: selected_marital_status == -1 ? this.state.marital_status_array[0].id : this.state.marital_status_array[selected_marital_status].id,
            body: selected_body == -1 ? this.state.body_array[0].id : this.state.body_array[selected_body].id,
            networth_amount: this.state.valueNetWorthAnnualy.trim(),
            user_chat_cost: this.state.valueMessageGoldCoin.trim(),
            general_info: this.state.valueAboutMe.trim(),
            languages_known_tags: this.state.selectedLanguageList,
            things_i_like: this.state.valueThingsIlike.trim(),

            field: {
                "1": this.state.category_array[this.state.selected_category_eyecolor].value,
                "2": this.state.category_array[this.state.selected_category_skincolor].value,
                "3": this.state.category_array[this.state.selected_category_haircolor].value,
                "7": this.state.category_array[this.state.selected_category_height].value,
                "8": this.state.category_array[this.state.selected_category_weight].value,
                "13": this.state.category_array[this.state.selected_category_ethinicity].value,
                "14": this.state.category_array[this.state.selected_category_maritalstatus].value,
                "22": this.state.category_array[this.state.selected_category_body].value
            },
            other_field: {
                about_me: this.state.category_array[this.state.selected_category_aboutme].value,
                things_i_likes: this.state.category_array[this.state.selected_category_thingsilike].value,
                age: this.state.category_array[this.state.selected_category_dob].value,
                location: this.state.category_array[this.state.selected_category_location].value
            }
        };
        if(this.state.valuePhone.trim() == "") {
            jsonData.phone = "";
        } else {
            jsonData.phone = "+" + this.state.callingCode + this.state.valuePhone.trim();
        }
        return jsonData;
    };

    showDateTimePicker = () => {
        this.setState({ isDateTimePickerVisible: true });
    };
    
    hideDateTimePicker = () => {
        this.setState({ isDateTimePickerVisible: false });
    };
    
    handleDatePicked = date => {
        this.setState({ valueDateOfBirth: Moment(date).format("MM/DD/YYYY") });
        this.hideDateTimePicker();
    };

    visibility_show_set(type) {

        if(type == "firstname") {
            
        } else if(type == "lastname") {
            
        } else if(type == "gender") {
            
        } else if(type == "email") {
            
        } else if(type == "dob") {
            this.setState({
                show_visibility: true,
                visibility_view_y: this.state.visibility_view_y_dob,
                selected_category: this.state.selected_category_dob,
                selected_row: 'dob',
                
            })
        } else if(type == "location") {
            this.setState({
                show_visibility: true,
                visibility_view_y: this.state.visibility_view_y_location,
                selected_category: this.state.selected_category_location,
                selected_row: 'location',
            })
        } else if(type == "phone") {
            
        } else if(type == "eyecolor") {
            this.setState({
                show_visibility: true,
                visibility_view_y: this.state.visibility_view_y_eyecolor,
                selected_category: this.state.selected_category_eyecolor,
                selected_row: 'eyecolor',
            })
        } else if(type == "skincolor") {
            this.setState({
                show_visibility: true,
                visibility_view_y: this.state.visibility_view_y_skincolor,
                selected_category: this.state.selected_category_skincolor,
                selected_row: 'skincolor',
            })
        } else if(type == "haircolor") {
            this.setState({
                show_visibility: true,
                visibility_view_y: this.state.visibility_view_y_haircolor,
                selected_category: this.state.selected_category_haircolor,
                selected_row: 'haircolor',
            })
        } else if(type == "height") {
            this.setState({
                show_visibility: true,
                visibility_view_y: this.state.visibility_view_y_height,
                selected_category: this.state.selected_category_height,
                selected_row: 'height',
            })
        } else if(type == "weight") {
            this.setState({
                show_visibility: true,
                visibility_view_y: this.state.visibility_view_y_weight,
                selected_category: this.state.selected_category_weight,
                selected_row: 'weight',
            })
        } else if(type == "ethinicity") {
            this.setState({
                show_visibility: true,
                visibility_view_y: this.state.visibility_view_y_ethinicity,
                selected_category: this.state.selected_category_ethinicity,
                selected_row: 'ethinicity',
            })
        } else if(type == "maritalstatus") {
            this.setState({
                show_visibility: true,
                visibility_view_y: this.state.visibility_view_y_maritalstatus,
                selected_category: this.state.selected_category_maritalstatus,
                selected_row: 'maritalstatus',
            })
        } else if(type == "body") {
            this.setState({
                show_visibility: true,
                visibility_view_y: this.state.visibility_view_y_body,
                selected_category: this.state.selected_category_body,
                selected_row: 'body',
            })
        } else if(type == "aboutme") {
            this.setState({
                show_visibility: true,
                visibility_view_y: this.state.visibility_view_y_aboutme,
                selected_category: this.state.selected_category_aboutme,
                selected_row: 'aboutme',
            })
        } else if(type == "thingsilike") {
            this.setState({
                show_visibility: true,
                visibility_view_y: this.state.visibility_view_y_thingsilike,
                selected_category: this.state.selected_category_thingsilike,
                selected_row: 'thingsilike',
            })
        } else if(type == "all") {
            this.setState({
                show_visibility: false
            })
        } 
    }

    render() {
        return (
            <View style={styles.container} >
                
                <DateTimePicker
                    isVisible={this.state.isDateTimePickerVisible}
                    onConfirm={this.handleDatePicked}
                    onCancel={this.hideDateTimePicker}
                    date={new Date(this.state.valueDateOfBirth)}
                    mode = {"date"}
                />
                {/* {this.props.type == 1 ? this.setPersonalDetails() : null}
                {this.props.type == 2 ? this.setAboutMe() : null}
                {this.props.type == 3 ? this.setThingsILike() : null} */}

                {this.setPersonalDetails()}

                {/* <MultiPickerMaterialDialog
                    title={'Select Languages'}
                    items={(this.state.languageList || []).map((row, index) => ({ value: index, label: row.value }))}
                    visible={this.state.showLanguageDialog}
                    colorAccent={Colors.gold}
                    selectedItems={this.state.selectedLanguageList}
                    onCancel={() => this.setState({ showLanguageDialog: false })}
                    onOk={result => {
                        if (result.selectedItems.length < 1) {
                            Alert.alert(Constants.SELECT_LANGUAGE)
                        } else {
                            this.setState({ showLanguageDialog: false });
                            this.setState({ selectedLanguageList: result.selectedItems });
                        }
                    }}
                /> */}
            </View>
        );
    }

    renderBannerView = () => {
        return (
            <BannerView
                screenProps = {this.props.rootNavigation}
            />
        )
    }

    /** render DatePicker
     *150
     * @returns {*}
     */
    // renderDatePicker = () => {
    //     return (
    //         <DatePicker
    //             ref="dateref"
    //             style={{ width: 150, height: 30 }}
    //             date={this.state.valueDateOfBirth}
    //             mode="date"
    //             showIcon={false}
    //             hideText={true}
    //             format="DD/MM/YYYY"
    //             minDate="1980-05-01"
    //             maxDate="2018-01-01"
    //             confirmBtnText="Confirm"
    //             cancelBtnText="Cancel"
    //             onDateChange={(date) => {
    //                 this.setState({ valueDateOfBirth: date });
    //             }}
    //         />

    //     );
    // }
    /**
     * display Personal Details of an User
     */

    
    setPersonalDetails = () => {
        return (
            <View onStartShouldSetResponder={() => this.visibility_show_set("all")}>
                <KeyboardAwareScrollView style={{ margin: 10, marginBottom:20 }} keyboardShouldPersistTaps = "handled" extraScrollHeight={100} showsVerticalScrollIndicator = {false}>
                {
                    this.state.show_visibility &&
                    <View style = {[styles.visibility_container_view, {right: 0, top: this.state.visibility_view_y, paddingLeft: 5, paddingTop: 5, paddingRight: 5}]}>
                    {
                        this.state.category_array.map((item, index) =>
                        <TouchableOpacity style = {[styles.visibility_button, this.state.selected_category == index ? {backgroundColor: Colors.gold} : {backgroundColor: Colors.black}]} 
                            onPress = {() => {
                                if(this.state.selected_row == "dob") {
                                    this.setState({
                                        selected_category_dob: index
                                    })
                                } else if(this.state.selected_row == "location") {
                                    this.setState({
                                        selected_category_location: index
                                    })
                                } else if(this.state.selected_row == "eyecolor") {
                                    this.setState({
                                        selected_category_eyecolor: index
                                    })
                                } else if(this.state.selected_row == "skincolor") {
                                    this.setState({
                                        selected_category_skincolor: index
                                    })
                                } else if(this.state.selected_row == "haircolor") {
                                    this.setState({
                                        selected_category_haircolor: index
                                    })
                                } else if(this.state.selected_row == "height") {
                                    this.setState({
                                        selected_category_height: index
                                    })
                                } else if(this.state.selected_row == "weight") {
                                    this.setState({
                                        selected_category_weight: index
                                    })
                                } else if(this.state.selected_row == "ethinicity") {
                                    this.setState({
                                        selected_category_ethinicity: index
                                    })
                                } else if(this.state.selected_row == "maritalstatus") {
                                    this.setState({
                                        selected_category_maritalstatus: index
                                    })
                                } else if(this.state.selected_row == "body") {
                                    this.setState({
                                        selected_category_body: index
                                    })
                                } else if(this.state.selected_row == "aboutme") {
                                    this.setState({
                                        selected_category_aboutme: index
                                    })
                                } else if(this.state.selected_row == "thingsilike") {
                                    this.setState({
                                        selected_category_thingsilike: index
                                    })
                                }
                                this.setState({
                                    show_visibility: false,
                                })
                            }}
                        >
                            <Image style = {{width: 20, height:20, marginLeft: 8}} resizeMode = {'contain'} source={item.icon_path}/>
                            <Text style = {[styles.visibility_text, stylesGlobal.font, {marginLeft: 5}]}>{item.label}</Text>
                        </TouchableOpacity>
                        )
                    }
                    </View>
                }

                    <View style={styles.headView}>
                        <Text style={[styles.headingText, stylesGlobal.font]}>First Name</Text>
                        <View style = {{flexDirection: 'row'}}>
                            <View style = {{width: '90%'}}>
                                <TextInput
                                    ref='valueFirstName'
                                    multiline={false}
                                    returnKeyType='done'
                                    numberOfLines={1}
                                    underlineColorAndroid="transparent"
                                    autoCapitalize='sentences'
                                    onChangeText={value => {
                                        this.setState({ valueFirstName: value })
                                    }}
                                    value={this.state.valueFirstName}
                                    style={[styles.textInputText, stylesGlobal.font]}
                                    onSubmitEditing={(event) => {
                                        //this.refs.valueLastName.focus();
                                    }}
                                    keyboardType='ascii-capable'
                                ></TextInput>
                            </View>
                            <Image style = {{width: 30, height:30}} resizeMode = {'contain'} source={require('../icons/publicVisibility_greyscale.png')}/>
                        </View>

                        <View style={[styles.bottomView, { marginTop: 5 }]}></View>

                    </View>


                    <View style={styles.headView}>
                        <Text style={[styles.headingText, stylesGlobal.font]}>Last Name</Text>
                        <View style = {{flexDirection: 'row'}}>
                            <View style = {{width: '90%'}}>
                                <TextInput
                                    ref='valueLastName'
                                    multiline={false}
                                    returnKeyType='done'
                                    numberOfLines={1}
                                    underlineColorAndroid="transparent"
                                    autoCapitalize='sentences'
                                    onChangeText={value => {
                                        this.setState({ valueLastName: value })
                                    }}
                                    value={this.state.valueLastName}
                                    style={[styles.textInputText, stylesGlobal.font]}
                                    onSubmitEditing={(event) => {
                                        //this.refs.valueEmail.focus();
                                    }}
                                    keyboardType='ascii-capable'
                                ></TextInput>
                            </View>
                            <Image style = {{width: 30, height:30}} resizeMode = {'contain'} source={require('../icons/publicVisibility_greyscale.png')}/>
                        </View>

                        <View style={[styles.bottomView, { marginTop: 5 }]}></View>

                    </View>
                    <View style={[styles.headView, { backgroundColor: Colors.white }]} onLayout = {(event) => {
                            
                        }}
                    >
                        <Text style={[styles.headingText, stylesGlobal.font]}>Gender</Text>
                        <View style = {{flexDirection: 'row'}}>
                            <View style = {{width: '90%', justifyContent: 'center'}}>
                                <RNPickerSelect
                                    items = {this.state.gender_array}
                                    style = {{...pickerSelectStyles}}
                                    placeholder={{
                                        label: 'Select a gender...',
                                        value: null,
                                    }}
                                    value = {this.state.selected_gender_value}
                                    onValueChange={(value, index) => {
                                        selected_gender = index - 1;
                                        if(index == 0) {
                                            this.setState({
                                                selected_gender_value: null
                                            })
                                        } else {
                                            this.setState({
                                                selected_gender_value: this.state.gender_array[index - 1].value
                                            })
                                        }
                                    }}
                                />
                            </View>
                            {/* <TouchableOpacity onPress = {() => this.visibility_show_set("gender")}>
                                <Image style = {{width: 30, height:30}} resizeMode = {'contain'} source={this.state.visibility_gender == 0 ? require('../icons/publicVisibility.png') : require('../icons/memberVisibility.png')}/>
                            </TouchableOpacity> */}
                            <Image style = {{width: 30, height:30}} resizeMode = {'contain'} source={require('../icons/publicVisibility_greyscale.png')}/>
                        </View>
                        <View style={[styles.bottomView, { marginTop: 5 }]}></View>
                    </View>

                    <View style={styles.headView}>
                        <Text style={[styles.headingText, stylesGlobal.font]}>Email</Text>
                        <View style = {{flexDirection: 'row'}}>
                            <View style = {{width: '90%'}}>
                                <TextInput
                                    ref='valueEmail'
                                    multiline={false}
                                    returnKeyType='done'
                                    keyboardType='email-address'
                                    numberOfLines={1}
                                    underlineColorAndroid="transparent"
                                    autoCapitalize='sentences'
                                    onChangeText={value => {
                                        this.setState({ valueEmail: value })
                                    }}
                                    value={this.state.valueEmail}
                                    style={[styles.textInputText, stylesGlobal.font]}
                                    onSubmitEditing={(event) => {
                                        // this.refs.valuePhone.focus();
                                    }}
                                ></TextInput>
                            </View>
                            <Image style = {{width: 30, height:30}} resizeMode = {'contain'} source={require('../icons/memberVisibility_greyscale.png')}/>
                        </View>

                        <View style={[styles.bottomView, { marginTop: 5 }]}></View>

                    </View>

                    {/* <TouchableOpacity onPress={() => {
                        this.refs.dateref.onPressDate()
                    }}>
                        {this.renderTextView('Date of Birth', this.state.valueDateOfBirth)}
                        {this.renderDatePicker()}
                    </TouchableOpacity> */}
                    <View style={{marginTop: 9}} onLayout = {(event) => {
                            this.setState({
                                visibility_view_y_dob: event.nativeEvent.layout.y,
                            })
                        }}
                    >
                        <Text style={[styles.headingText, stylesGlobal.font]}>Date of Birth</Text>
                        <View style = {{flexDirection: 'row'}}>
                            <View style = {{width: '90%'}}>
                                <TouchableOpacity onPress = {() => this.setState({isDateTimePickerVisible: true})}>
                                    <Text style={[styles.textInputText, { marginTop: 5 }, stylesGlobal.font]}>
                                        {this.state.valueDateOfBirth}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                            {/* <TouchableOpacity onPress = {() => this.visibility_show_set("dob")}>
                                <Image style = {{width: 30, height: 30}} resizeMode = {'contain'} source={this.state.category_array[this.state.selected_category_dob].icon_path}/>
                            </TouchableOpacity> */}
                            <ModalDropdown 
                                dropdownStyle = {{height: 35 * 5 + 5 * 6, paddingLeft: 5, paddingTop: 5, paddingRight: 5, backgroundColor: '#ffffff', borderRadius: 3, borderColor: '#000000', borderWidth: 1}}
                                defaultIndex = {this.state.selected_category_dob}
                                options = {this.state.category_array}
                                onSelect = {(index) => {
                                    this.setState({
                                        selected_category_dob: index
                                    })
                                }}
                                renderButton = {() => {
                                    return (
                                        <View style={{justifyContent: 'center', alignItems: 'center'}}>
                                            <Image style={[styles.ageIcon, { width: 30, height: 30, resizeMode: 'contain'}]} source={this.state.category_array[this.state.selected_category_dob].icon_path}/>
                                        </View>
                                    )
                                }}
                                renderRow = {(item, index, highlighted) => {
                                    return (
                                        <View style = {[styles.visibility_button, this.state.selected_category_dob == index ? {backgroundColor: Colors.gold} : {backgroundColor: Colors.black}]}>
                                            <Image style = {{width: 20, height:20, marginLeft: 8}} resizeMode = {'contain'} source={item.icon_path}/> 
                                            <Text style = {[styles.visibility_text, stylesGlobal.font, {marginLeft: 5}]}>{item.label}</Text>
                                        </View>
                                    )
                                }}
                            />
                        </View>
                        <View style={styles.bottomView}></View>
                    </View>

                    {this.renderLocation('Location', this.state.valueLocation, 'valueLocation')}


                    <View style={styles.headView} onLayout = {(event) => {
                            this.setState({
                                visibility_view_y_phone: event.nativeEvent.layout.y,
                            })
                        }}
                    >
                        <View style={{flexDirection:"row", alignItems:'center'}}>
                            <CountryPicker onSelect={(value)=> {
                                console.log("-----------------:", value);
                                    this.setState({callingCode: value.callingCode, countryName: value.cca2, valuePhone: ""})
                                }}
                                countryCode = {this.state.countryName}
                                withFlag = {true}
                                withCallingCode = {true}
                                // cca2={this.state.countryName}
                                // filterable={true}
                                // closeable={true}
                                // translation='eng'
                                // showCallingCode={true}
                                // width={10}
                            />
                            <Text style={[styles.headingTextPhone, stylesGlobal.font, {marginLeft: 5}]}>Phone</Text>
                        </View>
                        <View style={{flexDirection:'row',alignItems:'center'}}>
                            <View style = {{width: '90%', flexDirection:'row', alignItems: 'center'}}>
                                {/* <Text style={[{fontSize:13,marginLeft:2,marginTop:3}, stylesGlobal.font]}>+{result[0].callingCode}-</Text> */}
                                <Text style={[{fontSize:13,marginLeft:2,marginTop:3}, stylesGlobal.font]}>+{this.state.callingCode}-</Text>
                                <TextInput
                                    ref='valuePhone'
                                    multiline={false}
                                    returnKeyType='done'
                                    keyboardType='phone-pad'
                                    numberOfLines={1}
                                    underlineColorAndroid="transparent"
                                    autoCapitalize='sentences'
                                    onChangeText={value => {
                                        this.setState({ valuePhone: removeCountryCode(value) })
                                    }}
                                    value={removeCountryCode(this.state.valuePhone)}
                                    style={[styles.textInputTextPhone, stylesGlobal.font]}
                                    onSubmitEditing={(event) => {
                                        //this.refs.valueNetWorthAnnualy.focus();

                                    }}
                                ></TextInput>
                            </View>
                            
                            <Image style = {{width: 30, height:30}} resizeMode = {'contain'} source={require('../icons/memberVisibility_greyscale.png')}/>
                        </View>
                        <View style={[styles.bottomView, { marginTop: 5 }]}></View>
                    </View>
                    <View style={[styles.headView, { backgroundColor: Colors.white }]} onLayout = {(event) => {
                            this.setState({
                                visibility_view_y_eyecolor: event.nativeEvent.layout.y,
                            })
                        }}
                    >
                        <Text style={[styles.headingText, stylesGlobal.font]}>Eye Color</Text>
                        <View style = {{flexDirection: 'row'}}>
                            <View style = {{width: '90%', justifyContent: 'center'}}>
                                <RNPickerSelect
                                    items = {this.state.eye_color_array}
                                    style = {{...pickerSelectStyles}}
                                    placeholder={{
                                        label: 'Select a eye color...',
                                        value: null,
                                    }}
                                    value = {this.state.selected_eye_color_value}
                                    onValueChange={(value, index) => {
                                        selected_eye_color = index - 1;
                                        if(index == 0) {
                                            this.setState({
                                                selected_eye_color_value: null
                                            })
                                        } else {
                                            this.setState({
                                                selected_eye_color_value: this.state.eye_color_array[index - 1].value
                                            })
                                        }
                                    }}
                                />
                            </View>
                            {/* <TouchableOpacity onPress = {() => this.visibility_show_set("eyecolor")}>
                                <Image style = {{width: 30, height: 30}} resizeMode = {'contain'} source={this.state.category_array[this.state.selected_category_eyecolor].icon_path}/>
                            </TouchableOpacity> */}
                            <ModalDropdown 
                                dropdownStyle = {{height: 35 * 5 + 5 * 6, paddingLeft: 5, paddingTop: 5, paddingRight: 5, backgroundColor: '#ffffff', borderRadius: 3, borderColor: '#000000', borderWidth: 1}}
                                defaultIndex = {this.state.selected_category_eyecolor}
                                options = {this.state.category_array}
                                onSelect = {(index) => {
                                    this.setState({
                                        selected_category_eyecolor: index
                                    })
                                }}
                                renderButton = {() => {
                                    return (
                                        <View style={{justifyContent: 'center', alignItems: 'center'}}>
                                            <Image style={[styles.ageIcon, { width: 30, height: 30, resizeMode: 'contain'}]} source={this.state.category_array[this.state.selected_category_eyecolor].icon_path}/>
                                        </View>
                                    )
                                }}
                                renderRow = {(item, index, highlighted) => {
                                    return (
                                        <View style = {[styles.visibility_button, this.state.selected_category_eyecolor == index ? {backgroundColor: Colors.gold} : {backgroundColor: Colors.black}]}>
                                            <Image style = {{width: 20, height:20, marginLeft: 8}} resizeMode = {'contain'} source={item.icon_path}/> 
                                            <Text style = {[styles.visibility_text, stylesGlobal.font, {marginLeft: 5}]}>{item.label}</Text>
                                        </View>
                                    )
                                }}
                            />
                        </View>
                        <View style={[styles.bottomView, { marginTop: 5 }]}></View>
                    </View>

                    <View style={[styles.headView, { backgroundColor: Colors.white }]} onLayout = {(event) => {
                            this.setState({
                                visibility_view_y_skincolor: event.nativeEvent.layout.y,
                            })
                        }}
                    >
                        <Text style={[styles.headingText, stylesGlobal.font]}>Skin Color</Text>
                        <View style = {{flexDirection: 'row'}}>
                            <View style = {{width: '90%', justifyContent: 'center'}}>
                                <RNPickerSelect
                                    items = {this.state.skin_color_array}
                                    style = {{...pickerSelectStyles}}
                                    placeholder={{
                                        label: 'Select a skin color...',
                                        value: null,
                                    }}
                                    value = {this.state.selected_skin_color_value}
                                    onValueChange={(value, index) => {
                                        selected_skin_color = index - 1;
                                        if(index == 0) {
                                            this.setState({
                                                selected_skin_color_value: null
                                            })
                                        } else {
                                            this.setState({
                                                selected_skin_color_value: this.state.skin_color_array[index - 1].value
                                            })
                                        }
                                    }}
                                />
                            </View>
                            {/* <TouchableOpacity onPress = {() => this.visibility_show_set("skincolor")}>
                                <Image style = {{width: 30, height: 30}} resizeMode = {'contain'} source={this.state.category_array[this.state.selected_category_skincolor].icon_path}/>
                            </TouchableOpacity> */}
                            <ModalDropdown 
                                dropdownStyle = {{height: 35 * 5 + 5 * 6, paddingLeft: 5, paddingTop: 5, paddingRight: 5, backgroundColor: '#ffffff', borderRadius: 3, borderColor: '#000000', borderWidth: 1}}
                                defaultIndex = {this.state.selected_category_skincolor}
                                options = {this.state.category_array}
                                onSelect = {(index) => {
                                    this.setState({
                                        selected_category_skincolor: index
                                    })
                                }}
                                renderButton = {() => {
                                    return (
                                        <View style={{justifyContent: 'center', alignItems: 'center'}}>
                                            <Image style={[styles.ageIcon, { width: 30, height: 30, resizeMode: 'contain'}]} source={this.state.category_array[this.state.selected_category_skincolor].icon_path}/>
                                        </View>
                                    )
                                }}
                                renderRow = {(item, index, highlighted) => {
                                    return (
                                        <View style = {[styles.visibility_button, this.state.selected_category_skincolor == index ? {backgroundColor: Colors.gold} : {backgroundColor: Colors.black}]}>
                                            <Image style = {{width: 20, height:20, marginLeft: 8}} resizeMode = {'contain'} source={item.icon_path}/> 
                                            <Text style = {[styles.visibility_text, stylesGlobal.font, {marginLeft: 5}]}>{item.label}</Text>
                                        </View>
                                    )
                                }}
                            />
                        </View>
                        <View style={[styles.bottomView, { marginTop: 5 }]}></View>
                    </View>

                    <View style={[styles.headView, { backgroundColor: Colors.white }]} onLayout = {(event) => {
                            this.setState({
                                visibility_view_y_haircolor: event.nativeEvent.layout.y,
                            })
                        }}
                    >
                        <Text style={[styles.headingText, stylesGlobal.font]}>Hair Color</Text>
                        <View style = {{flexDirection: 'row'}}>
                            <View style = {{width: '90%', justifyContent: 'center'}}>
                                <RNPickerSelect
                                    items = {this.state.hair_color_array}
                                    style = {{...pickerSelectStyles}}
                                    placeholder={{
                                        label: 'Select a hair color...',
                                        value: null,
                                    }}
                                    value = {this.state.selected_hair_color_value}
                                    onValueChange={(value, index) => {
                                        selected_hair_color = index - 1;
                                        if(index == 0) {
                                            this.setState({
                                                selected_hair_color_value: null
                                            })
                                        } else {
                                            this.setState({
                                                selected_hair_color_value: this.state.hair_color_array[index - 1].value
                                            })
                                        }
                                    }}
                                />
                            </View>
                            {/* <TouchableOpacity onPress = {() => this.visibility_show_set("haircolor")}>
                                <Image style = {{width: 30, height: 30}} resizeMode = {'contain'} source={this.state.category_array[this.state.selected_category_haircolor].icon_path}/>
                            </TouchableOpacity> */}
                            <ModalDropdown 
                                dropdownStyle = {{height: 35 * 5 + 5 * 6, paddingLeft: 5, paddingTop: 5, paddingRight: 5, backgroundColor: '#ffffff', borderRadius: 3, borderColor: '#000000', borderWidth: 1}}
                                defaultIndex = {this.state.selected_category_haircolor}
                                options = {this.state.category_array}
                                onSelect = {(index) => {
                                    this.setState({
                                        selected_category_haircolor: index
                                    })
                                }}
                                renderButton = {() => {
                                    return (
                                        <View style={{justifyContent: 'center', alignItems: 'center'}}>
                                            <Image style={[styles.ageIcon, { width: 30, height: 30, resizeMode: 'contain'}]} source={this.state.category_array[this.state.selected_category_haircolor].icon_path}/>
                                        </View>
                                    )
                                }}
                                renderRow = {(item, index, highlighted) => {
                                    return (
                                        <View style = {[styles.visibility_button, this.state.selected_category_haircolor == index ? {backgroundColor: Colors.gold} : {backgroundColor: Colors.black}]}>
                                            <Image style = {{width: 20, height:20, marginLeft: 8}} resizeMode = {'contain'} source={item.icon_path}/> 
                                            <Text style = {[styles.visibility_text, stylesGlobal.font, {marginLeft: 5}]}>{item.label}</Text>
                                        </View>
                                    )
                                }}
                            />
                        </View>
                        <View style={[styles.bottomView, { marginTop: 5 }]}></View>
                    </View>

                    <View style={[styles.headView, { backgroundColor: Colors.white }]} onLayout = {(event) => {
                            this.setState({
                                visibility_view_y_height: event.nativeEvent.layout.y,
                            })
                        }}
                    >
                        <Text style={[styles.headingText, stylesGlobal.font]}>Height</Text>
                        <View style = {{flexDirection: 'row'}}>
                            <View style = {{width: '90%', justifyContent: 'center'}}>
                                <RNPickerSelect
                                    items = {this.state.height_array}
                                    style = {{...pickerSelectStyles}}
                                    placeholder={{
                                        label: 'Select a height...',
                                        value: null,
                                    }}
                                    value = {this.state.selected_height_value}
                                    onValueChange={(value, index) => {
                                        selected_height = index - 1;
                                        if(index == 0) {
                                            this.setState({
                                                selected_height_value: null
                                            })
                                        } else {
                                            this.setState({
                                                selected_height_value: this.state.height_array[index - 1].value
                                            })
                                        }
                                    }}
                                />
                            </View>
                            {/* <TouchableOpacity onPress = {() => this.visibility_show_set("height")}>
                                <Image style = {{width: 30, height: 30}} resizeMode = {'contain'} source={this.state.category_array[this.state.selected_category_height].icon_path}/>
                            </TouchableOpacity> */}
                            <ModalDropdown 
                                dropdownStyle = {{height: 35 * 5 + 5 * 6, paddingLeft: 5, paddingTop: 5, paddingRight: 5, backgroundColor: '#ffffff', borderRadius: 3, borderColor: '#000000', borderWidth: 1}}
                                defaultIndex = {this.state.selected_category_height}
                                options = {this.state.category_array}
                                onSelect = {(index) => {
                                    this.setState({
                                        selected_category_height: index
                                    })
                                }}
                                renderButton = {() => {
                                    return (
                                        <View style={{justifyContent: 'center', alignItems: 'center'}}>
                                            <Image style={[styles.ageIcon, { width: 30, height: 30, resizeMode: 'contain'}]} source={this.state.category_array[this.state.selected_category_height].icon_path}/>
                                        </View>
                                    )
                                }}
                                renderRow = {(item, index, highlighted) => {
                                    return (
                                        <View style = {[styles.visibility_button, this.state.selected_category_height == index ? {backgroundColor: Colors.gold} : {backgroundColor: Colors.black}]}>
                                            <Image style = {{width: 20, height:20, marginLeft: 8}} resizeMode = {'contain'} source={item.icon_path}/> 
                                            <Text style = {[styles.visibility_text, stylesGlobal.font, {marginLeft: 5}]}>{item.label}</Text>
                                        </View>
                                    )
                                }}
                            />
                        </View>
                        <View style={[styles.bottomView, { marginTop: 5 }]}></View>
                    </View>

                    <View style={[styles.headView, { backgroundColor: Colors.white }]} onLayout = {(event) => {
                            this.setState({
                                visibility_view_y_weight: event.nativeEvent.layout.y,
                            })
                        }}
                    >
                        <Text style={[styles.headingText, stylesGlobal.font]}>Weight</Text>
                        <View style = {{flexDirection: 'row'}}>
                            <View style = {{width: '90%', justifyContent: 'center'}}>
                                <RNPickerSelect
                                    items = {this.state.weight_array}
                                    style = {{...pickerSelectStyles}}
                                    placeholder={{
                                        label: 'Select a height...',
                                        value: null,
                                    }}
                                    value = {this.state.selected_weight_value}
                                    onValueChange={(value, index) => {
                                        selected_weight = index - 1;
                                        if(index == 0) {
                                            this.setState({
                                                selected_weight_value: null
                                            })
                                        } else {
                                            this.setState({
                                                selected_weight_value: this.state.weight_array[index - 1].value
                                            })
                                        }
                                    }}
                                />
                            </View>
                            {/* <TouchableOpacity onPress = {() => this.visibility_show_set("weight")}>
                                <Image style = {{width: 30, height: 30}} resizeMode = {'contain'} source={this.state.category_array[this.state.selected_category_weight].icon_path}/>
                            </TouchableOpacity> */}
                            <ModalDropdown 
                                dropdownStyle = {{height: 35 * 5 + 5 * 6, paddingLeft: 5, paddingTop: 5, paddingRight: 5, backgroundColor: '#ffffff', borderRadius: 3, borderColor: '#000000', borderWidth: 1}}
                                defaultIndex = {this.state.selected_category_weight}
                                options = {this.state.category_array}
                                onSelect = {(index) => {
                                    this.setState({
                                        selected_category_weight: index
                                    })
                                }}
                                renderButton = {() => {
                                    return (
                                        <View style={{justifyContent: 'center', alignItems: 'center'}}>
                                            <Image style={[styles.ageIcon, { width: 30, height: 30, resizeMode: 'contain'}]} source={this.state.category_array[this.state.selected_category_weight].icon_path}/>
                                        </View>
                                    )
                                }}
                                renderRow = {(item, index, highlighted) => {
                                    return (
                                        <View style = {[styles.visibility_button, this.state.selected_category_weight == index ? {backgroundColor: Colors.gold} : {backgroundColor: Colors.black}]}>
                                            <Image style = {{width: 20, height:20, marginLeft: 8}} resizeMode = {'contain'} source={item.icon_path}/> 
                                            <Text style = {[styles.visibility_text, stylesGlobal.font, {marginLeft: 5}]}>{item.label}</Text>
                                        </View>
                                    )
                                }}
                            />
                        </View>
                        <View style={[styles.bottomView, { marginTop: 5 }]}></View>
                    </View>

                    <View style={[styles.headView, { backgroundColor: Colors.white }]} onLayout = {(event) => {
                            this.setState({
                                visibility_view_y_ethinicity: event.nativeEvent.layout.y,
                            })
                        }}
                    >
                        <Text style={[styles.headingText, stylesGlobal.font]}>Ethinicity</Text>
                        <View style = {{flexDirection: 'row'}}>
                            <View style = {{width: '90%', justifyContent: 'center'}}>
                                <RNPickerSelect
                                    items = {this.state.ethnicity_array}
                                    style = {{...pickerSelectStyles}}
                                    placeholder={{
                                        label: 'Select a height...',
                                        value: null,
                                    }}
                                    value = {this.state.selected_ethnicity_value}
                                    onValueChange={(value, index) => {
                                        selected_ethnicity = index - 1;
                                        if(index == 0) {
                                            this.setState({
                                                selected_ethnicity_value: null
                                            })
                                        } else {
                                            this.setState({
                                                selected_ethnicity_value: this.state.ethnicity_array[index - 1].value
                                            })
                                        }
                                    }}
                                />
                            </View>
                            {/* <TouchableOpacity onPress = {() => this.visibility_show_set("ethinicity")}>
                                <Image style = {{width: 30, height: 30}} resizeMode = {'contain'} source={this.state.category_array[this.state.selected_category_ethinicity].icon_path}/>
                            </TouchableOpacity> */}
                            <ModalDropdown 
                                dropdownStyle = {{height: 35 * 5 + 5 * 6, paddingLeft: 5, paddingTop: 5, paddingRight: 5, backgroundColor: '#ffffff', borderRadius: 3, borderColor: '#000000', borderWidth: 1}}
                                defaultIndex = {this.state.selected_category_ethinicity}
                                options = {this.state.category_array}
                                onSelect = {(index) => {
                                    this.setState({
                                        selected_category_ethinicity: index
                                    })
                                }}
                                renderButton = {() => {
                                    return (
                                        <View style={{justifyContent: 'center', alignItems: 'center'}}>
                                            <Image style={[styles.ageIcon, { width: 30, height: 30, resizeMode: 'contain'}]} source={this.state.category_array[this.state.selected_category_ethinicity].icon_path}/>
                                        </View>
                                    )
                                }}
                                renderRow = {(item, index, highlighted) => {
                                    return (
                                        <View style = {[styles.visibility_button, this.state.selected_category_ethinicity == index ? {backgroundColor: Colors.gold} : {backgroundColor: Colors.black}]}>
                                            <Image style = {{width: 20, height:20, marginLeft: 8}} resizeMode = {'contain'} source={item.icon_path}/> 
                                            <Text style = {[styles.visibility_text, stylesGlobal.font, {marginLeft: 5}]}>{item.label}</Text>
                                        </View>
                                    )
                                }}
                            />
                        </View>
                        <View style={[styles.bottomView, { marginTop: 5 }]}></View>
                    </View>

                    <View style={[styles.headView, { backgroundColor: Colors.white }]} onLayout = {(event) => {
                            this.setState({
                                visibility_view_y_maritalstatus: event.nativeEvent.layout.y,
                            })
                        }}
                    >
                        <Text style={[styles.headingText, stylesGlobal.font]}>Marital Status</Text>
                        <View style = {{flexDirection: 'row'}}>
                            <View style = {{width: '90%', justifyContent: 'center'}}>
                                <RNPickerSelect
                                    items = {this.state.marital_status_array}
                                    style = {{...pickerSelectStyles}}
                                    placeholder={{
                                        label: 'Select a height...',
                                        value: null,
                                    }}
                                    value = {this.state.selected_marital_status_value}
                                    onValueChange={(value, index) => {
                                        selected_marital_status = index - 1;
                                        if(index == 0) {
                                            this.setState({
                                                selected_marital_status_value: null
                                            })
                                        } else {
                                            this.setState({
                                                selected_marital_status_value: this.state.marital_status_array[index - 1].value
                                            })
                                        }
                                    }}
                                />
                            </View>
                            {/* <TouchableOpacity onPress = {() => this.visibility_show_set("maritalstatus")}>
                                <Image style = {{width: 30, height: 30}} resizeMode = {'contain'} source={this.state.category_array[this.state.selected_category_maritalstatus].icon_path}/>
                            </TouchableOpacity> */}
                            <ModalDropdown 
                                dropdownStyle = {{height: 35 * 5 + 5 * 6, paddingLeft: 5, paddingTop: 5, paddingRight: 5, backgroundColor: '#ffffff', borderRadius: 3, borderColor: '#000000', borderWidth: 1}}
                                defaultIndex = {this.state.selected_category_maritalstatus}
                                options = {this.state.category_array}
                                onSelect = {(index) => {
                                    this.setState({
                                        selected_category_maritalstatus: index
                                    })
                                }}
                                renderButton = {() => {
                                    return (
                                        <View style={{justifyContent: 'center', alignItems: 'center'}}>
                                            <Image style={[styles.ageIcon, { width: 30, height: 30, resizeMode: 'contain'}]} source={this.state.category_array[this.state.selected_category_maritalstatus].icon_path}/>
                                        </View>
                                    )
                                }}
                                renderRow = {(item, index, highlighted) => {
                                    return (
                                        <View style = {[styles.visibility_button, this.state.selected_category_maritalstatus == index ? {backgroundColor: Colors.gold} : {backgroundColor: Colors.black}]}>
                                            <Image style = {{width: 20, height:20, marginLeft: 8}} resizeMode = {'contain'} source={item.icon_path}/> 
                                            <Text style = {[styles.visibility_text, stylesGlobal.font, {marginLeft: 5}]}>{item.label}</Text>
                                        </View>
                                    )
                                }}
                            />
                        </View>
                        <View style={[styles.bottomView, { marginTop: 5 }]}></View>
                    </View>

                    <View style={[styles.headView, { backgroundColor: Colors.white }]} onLayout = {(event) => {
                            this.setState({
                                visibility_view_y_body: event.nativeEvent.layout.y,
                            })
                        }}
                    >
                        <Text style={[styles.headingText, stylesGlobal.font]}>Body</Text>
                        <View style = {{flexDirection: 'row'}}>
                            <View style = {{width: '90%', justifyContent: 'center'}}>
                                <RNPickerSelect
                                    items = {this.state.body_array}
                                    style = {{...pickerSelectStyles}}
                                    placeholder={{
                                        label: 'Select a height...',
                                        value: null,
                                    }}
                                    value = {this.state.selected_body_value}
                                    onValueChange={(value, index) => {
                                        selected_body = index - 1;
                                        if(index == 0) {
                                            this.setState({
                                                selected_body_value: null
                                            })
                                        } else {
                                            this.setState({
                                                selected_body_value: this.state.body_array[index - 1].value
                                            })
                                        }
                                    }}
                                />
                            </View>
                            {/* <TouchableOpacity onPress = {() => this.visibility_show_set("body")}>
                                <Image style = {{width: 30, height: 30}} resizeMode = {'contain'} source={this.state.category_array[this.state.selected_category_body].icon_path}/>
                            </TouchableOpacity> */}
                            <ModalDropdown 
                                dropdownStyle = {{height: 35 * 5 + 5 * 6, paddingLeft: 5, paddingTop: 5, paddingRight: 5, backgroundColor: '#ffffff', borderRadius: 3, borderColor: '#000000', borderWidth: 1}}
                                defaultIndex = {this.state.selected_category_body}
                                options = {this.state.category_array}
                                onSelect = {(index) => {
                                    this.setState({
                                        selected_category_body: index
                                    })
                                }}
                                renderButton = {() => {
                                    return (
                                        <View style={{justifyContent: 'center', alignItems: 'center'}}>
                                            <Image style={[styles.ageIcon, { width: 30, height: 30, resizeMode: 'contain'}]} source={this.state.category_array[this.state.selected_category_body].icon_path}/>
                                        </View>
                                    )
                                }}
                                renderRow = {(item, index, highlighted) => {
                                    return (
                                        <View style = {[styles.visibility_button, this.state.selected_category_body == index ? {backgroundColor: Colors.gold} : {backgroundColor: Colors.black}]}>
                                            <Image style = {{width: 20, height:20, marginLeft: 8}} resizeMode = {'contain'} source={item.icon_path}/> 
                                            <Text style = {[styles.visibility_text, stylesGlobal.font, {marginLeft: 5}]}>{item.label}</Text>
                                        </View>
                                    )
                                }}
                            />
                        </View>
                        <View style={[styles.bottomView, { marginTop: 5 }]}></View>
                    </View>
                {
                    (this.state.member_plan == '1' || this.state.member_plan == '2') && 
                    <View style={[styles.headView]}>
                        <Text style={[styles.headingText, stylesGlobal.font]}>Net Worth Amount</Text>
                        <View style = {{flexDirection: 'row'}} onStartShouldSetResponder = {() => {this.refs.valueNetWorthAnnualy.focus()}}>
                            <TextInput
                                ref='valueNetWorthAnnualy'
                                multiline={false}
                                returnKeyType='done'
                                keyboardType='numeric'
                                numberOfLines={1}
                                underlineColorAndroid="transparent"
                                autoCapitalize='sentences'
                                onChangeText={value => {
                                    this.setState({ valueNetWorthAnnualy: value })
                                }}
                                value={this.state.valueNetWorthAnnualy}
                                style={[stylesGlobal.font, {color: Colors.black, marginTop: 1, backgroundColor: Colors.white, fontSize: 13, height: 26, width: 80}]}
                                onSubmitEditing={(event) => {
                                    //  this.refs.valueMessageGoldCoin.focus();

                                }}
                            ></TextInput>
                            <View style = {{height: 26, justifyContent: 'center', marginTop: 1, marginLeft: 2}}>
                                <Text style = {[stylesGlobal.font, {fontSize: 13, color: Colors.black,}]}>Million USD</Text>
                            </View>
                        </View>
                        <View style={[styles.bottomView, { marginTop: 5 }]}></View>

                    </View>
                }
                {
                    this.state.member_plan != '4' && this.state.member_plan != '7' && this.state.member_plan != '8' && 
                    <View style={styles.headView}>
                        <Text style={[styles.headingText, stylesGlobal.font]}>Charge Non-Members Gold Coins for Messaging Me</Text>
                        <TextInput
                            ref='valueMessageGoldCoin'
                            multiline={false}
                            returnKeyType='done'
                            keyboardType='number-pad'
                            numberOfLines={1}
                            underlineColorAndroid="transparent"
                            autoCapitalize='sentences'
                            onChangeText={value => {
                                this.setState({ valueMessageGoldCoin: value })
                            }}
                            value={this.state.valueMessageGoldCoin}
                            style={[styles.textInputText, stylesGlobal.font]}
                            onSubmitEditing={(event) => {

                            }}

                        ></TextInput>

                        <View style={[styles.bottomView, { marginTop: 5 }]}></View>

                    </View>
                }
                    <View style={{ marginTop: 5, }} onLayout = {(event) => {
                            this.setState({
                                visibility_view_y_aboutme: event.nativeEvent.layout.y,
                            })
                        }}
                    >
                    <View style={[styles.headView, {height: 180}]}>
                        <Text style={[styles.headingText, stylesGlobal.font]}>About Me</Text>
                        <View style = {{flexDirection: 'row'}}>
                            <View style = {{width: '90%'}}>
                                <TextInput
                                    ref='valueAboutMe'
                                    blurOnSubmit={false}
                                    autoFocus={false}
                                    style={[styles.multiLineTextInput, stylesGlobal.font]}
                                    onChangeText={value => { this.setState({ valueAboutMe: value }) }}
                                    value={this.state.valueAboutMe}
                                    defaultValue=""
                                    multiline={true}
                                    autoCapitalize='sentences'
                                    returnKeyType='default'
                                    underlineColorAndroid="transparent"
                                    onSubmitEditing={(event) => {

                                    }}
                                    keyboardType='ascii-capable'
                                ></TextInput>
                            </View>
                            {/* <TouchableOpacity onPress = {() => this.visibility_show_set("aboutme")}>
                                <Image style = {{width: 30, height: 30}} resizeMode = {'contain'} source={this.state.category_array[this.state.selected_category_aboutme].icon_path}/>
                            </TouchableOpacity> */}
                            <ModalDropdown 
                                dropdownStyle = {{height: 35 * 5 + 5 * 6, paddingLeft: 5, paddingTop: 5, paddingRight: 5, backgroundColor: '#ffffff', borderRadius: 3, borderColor: '#000000', borderWidth: 1}}
                                defaultIndex = {this.state.selected_category_aboutme}
                                options = {this.state.category_array}
                                onSelect = {(index) => {
                                    this.setState({
                                        selected_category_aboutme: index
                                    })
                                }}
                                renderButton = {() => {
                                    return (
                                        <View style={{justifyContent: 'center', alignItems: 'center'}}>
                                            <Image style={[styles.ageIcon, { width: 30, height: 30, resizeMode: 'contain'}]} source={this.state.category_array[this.state.selected_category_aboutme].icon_path}/>
                                        </View>
                                    )
                                }}
                                renderRow = {(item, index, highlighted) => {
                                    return (
                                        <View style = {[styles.visibility_button, this.state.selected_category_aboutme == index ? {backgroundColor: Colors.gold} : {backgroundColor: Colors.black}]}>
                                            <Image style = {{width: 20, height:20, marginLeft: 8}} resizeMode = {'contain'} source={item.icon_path}/> 
                                            <Text style = {[styles.visibility_text, stylesGlobal.font, {marginLeft: 5}]}>{item.label}</Text>
                                        </View>
                                    )
                                }}
                            />
                        </View>
                        <View style={[styles.bottomView, { marginTop: 5 }]}></View>
                    </View>
                </View>

                {this.renderLanguageView('Languages Known', this.state.selectedLanguageList)}

                <View style = {{ marginBottom: 25}} onLayout = {(event) => {
                            this.setState({
                                visibility_view_y_thingsilike: event.nativeEvent.layout.y,
                            })
                        }}
                    >
                    <View style={[styles.headView, {height: 180}]}>
                        <Text style={[styles.headingText, stylesGlobal.font]}>Things I Like</Text>
                        <View style = {{flexDirection: 'row'}}>
                            <View style = {{width: '90%'}}>
                                <TextInput
                                    ref='valueThingsIlike'
                                    underlineColorAndroid="transparent"
                                    blurOnSubmit={false}
                                    autoFocus={false}
                                    style={[styles.multiLineTextInput, stylesGlobal.font]}
                                    onChangeText={value => { this.setState({ valueThingsIlike: value }) }}
                                    value={this.state.valueThingsIlike}
                                    defaultValue=""
                                    placeholder = {"Type on here"}
                                    multiline={true}
                                    autoCapitalize='sentences'
                                    returnKeyType='default'
                                    onSubmitEditing={(event) => {

                                    }}
                                    keyboardType='ascii-capable'
                                ></TextInput>
                            </View>
                            {/* <TouchableOpacity onPress = {() => this.visibility_show_set("thingsilike")}>
                                <Image style = {{width: 30, height: 30}} resizeMode = {'contain'} source={this.state.category_array[this.state.selected_category_thingsilike].icon_path}/>
                            </TouchableOpacity> */}
                            <ModalDropdown 
                                dropdownStyle = {{height: 35 * 5 + 5 * 6, paddingLeft: 5, paddingTop: 5, paddingRight: 5, backgroundColor: '#ffffff', borderRadius: 3, borderColor: '#000000', borderWidth: 1}}
                                defaultIndex = {this.state.selected_category_thingsilike}
                                options = {this.state.category_array}
                                onSelect = {(index) => {
                                    this.setState({
                                        selected_category_thingsilike: index
                                    })
                                }}
                                renderButton = {() => {
                                    return (
                                        <View style={{justifyContent: 'center', alignItems: 'center'}}>
                                            <Image style={[styles.ageIcon, { width: 30, height: 30, resizeMode: 'contain'}]} source={this.state.category_array[this.state.selected_category_thingsilike].icon_path}/>
                                        </View>
                                    )
                                }}
                                renderRow = {(item, index, highlighted) => {
                                    return (
                                        <View style = {[styles.visibility_button, this.state.selected_category_thingsilike == index ? {backgroundColor: Colors.gold} : {backgroundColor: Colors.black}]}>
                                            <Image style = {{width: 20, height:20, marginLeft: 8}} resizeMode = {'contain'} source={item.icon_path}/> 
                                            <Text style = {[styles.visibility_text, stylesGlobal.font, {marginLeft: 5}]}>{item.label}</Text>
                                        </View>
                                    )
                                }}
                            />
                        </View>
                        <View style={[styles.bottomView, { marginTop: 5 }]}></View>
                    </View>
                </View>

                </KeyboardAwareScrollView>

            </View>
        );
    };



    /**
    * display About Me Details of an User
    */
    setAboutMe = () => {
        return (
            <View style={{ margin: 10, }}>

                <View style={styles.headView}>
                    <Text style={[styles.headingText, stylesGlobal.font]}>About Me</Text>
                    <View style = {{flexDirection: 'row'}}>
                        <View style = {{width: '90%'}}>
                            <TextInput
                                ref='valueAboutMe'
                                blurOnSubmit={false}
                                autoFocus={false}
                                style={[styles.multiLineTextInput, stylesGlobal.font]}
                                onChangeText={value => { this.setState({ valueAboutMe: value }) }}
                                value={this.state.valueAboutMe}
                                defaultValue=""
                                multiline={true}
                                autoCapitalize='sentences'
                                returnKeyType='default'
                                underlineColorAndroid="transparent"
                                onSubmitEditing={(event) => {

                                }}
                                keyboardType='ascii-capable'
                            ></TextInput>
                        </View>
                        <TouchableOpacity onPress = {() => this.setState({show_visibility_aboutme: true})}>
                            <Image style = {{width: 30, height:30}} resizeMode = {'contain'} source={this.state.visibility_aboutme == 0 ? require('../icons/publicVisibility.png') : require('../icons/memberVisibility.png')}/>
                        </TouchableOpacity>
                    </View>
                    <View style={[styles.bottomView, { marginTop: 5 }]}></View>
                </View>
                {this.renderLanguageView('Language Known', this.state.selectedLanguageList)}

            </View>
        );
    };


    /**
     * display ThingsILike  of an User
     */
    setThingsILike = () => {
        return (
            <View style={{ margin: 10, flex: 1 }} onStartShouldSetResponder={() => this.visibility_show_set("all")}>
                <View style={styles.headView}>
                    <Text style={[styles.headingText, stylesGlobal.font]}>Things I Like</Text>
                    <View style = {{flexDirection: 'row'}}>
                        <View style = {{width: '90%'}}>
                            <TextInput
                                ref='valueThingsIlike'
                                underlineColorAndroid="transparent"
                                blurOnSubmit={false}
                                autoFocus={false}
                                style={[styles.multiLineTextInput, stylesGlobal.font]}
                                onChangeText={value => { this.setState({ valueThingsIlike: value }) }}
                                value={this.state.valueThingsIlike}
                                defaultValue=""
                                multiline={true}
                                autoCapitalize='sentences'
                                returnKeyType='default'
                                onSubmitEditing={(event) => {

                                }}
                                keyboardType='ascii-capable'
                            ></TextInput>
                        </View>
                        <TouchableOpacity onPress = {() => this.setState({show_visibility_thingsilike: true})}>
                            <Image style = {{width: 30, height:30}} resizeMode = {'contain'} source={this.state.visibility_thingsilike == 0 ? require('../icons/publicVisibility.png') : require('../icons/memberVisibility.png')}/>
                        </TouchableOpacity>
                    </View>
                    <View style={[styles.bottomView, { marginTop: 5 }]}></View>
                </View>
            </View>
        );
    };


    /**
     * display TextInput View
     */
    renderTextInput = (headerText, stateValue, stateName, inputType, isMultiline, returnType, ownReference, nextRefs) => {
        var type = 'ascii-capable';
        if (inputType == 2) {
            type = 'numeric';
        } else if (inputType == 3) {
            type = 'email-address'
        }
        return (

            <View style={styles.headView}>
                <Text style={[styles.headingText, stylesGlobal.font]}>{headerText}</Text>
                <TextInput
                    ref={refs => ownReference = refs}
                    multiline={isMultiline}
                    returnKeyType={returnType}
                    keyboardType={type}
                    numberOfLines={1}
                    underlineColorAndroid="transparent"
                    autoCapitalize='sentences'
                    onChangeText={value => {
                        this.setState({ [stateName]: value })
                    }}
                    value={stateValue}
                    style={[styles.textInputText, stylesGlobal.font]}
                    onSubmitEditing={(event) => {
                        nextRefs.focus();

                    }}
                ></TextInput>


                <View style={[styles.bottomView, { marginTop: 5 }]}></View>

            </View>

        );

    }

    /**
     * display Location View
     */
    renderLocation = (headerText, stateValue, stateName) => {
        return (
            <View style={{marginTop: 9, minHeight: 65}} onLayout = {(event) => {
                    this.setState({
                        visibility_view_y_location: event.nativeEvent.layout.y,
                    })
                }}
            >
                <Text style={[styles.headingText, stylesGlobal.font]}>{headerText}</Text>
                <View style = {{flexDirection: 'row'}}>
                    <View style = {{width: '90%'}}>
                        {this.getGoogleAutoCompleteView()}
                    </View>
                    {/* <TouchableOpacity onPress = {() => this.visibility_show_set("location")}>
                        <Image style = {{width: 30, height: 30}} resizeMode = {'contain'} source={this.state.category_array[this.state.selected_category_location].icon_path}/>
                    </TouchableOpacity> */}
                    <ModalDropdown 
                        dropdownStyle = {{height: 35 * 5 + 5 * 6, paddingLeft: 5, paddingTop: 5, paddingRight: 5, backgroundColor: '#ffffff', borderRadius: 3, borderColor: '#000000', borderWidth: 1}}
                        defaultIndex = {this.state.selected_category_location}
                        options = {this.state.category_array}
                        onSelect = {(index) => {
                            this.setState({
                                selected_category_location: index
                            })
                        }}
                        renderButton = {() => {
                            return (
                                <View style={{justifyContent: 'center', alignItems: 'center'}}>
                                    <Image style={[styles.ageIcon, { width: 30, height: 30, resizeMode: 'contain'}]} source={this.state.category_array[this.state.selected_category_location].icon_path}/>
                                </View>
                            )
                        }}
                        renderRow = {(item, index, highlighted) => {
                            return (
                                <View style = {[styles.visibility_button, this.state.selected_category_location == index ? {backgroundColor: Colors.gold} : {backgroundColor: Colors.black}]}>
                                    <Image style = {{width: 20, height:20, marginLeft: 8}} resizeMode = {'contain'} source={item.icon_path}/> 
                                    <Text style = {[styles.visibility_text, stylesGlobal.font, {marginLeft: 5}]}>{item.label}</Text>
                                </View>
                            )
                        }}
                    />
                </View>
                <View style={styles.bottomView}></View>
            </View>

        );

    }


    /** render AutoCompleteTextView
     *
     * @returns {*}
     */
    getGoogleAutoCompleteView = () => {
        const query = {
            key: Global.GOOGLE_MAP_KEY,
            types: "geocode|establishment",
            language: 'en',
        };

        return <GooglePlacesAutocomplete
            placeholder=''
            minLength={3} // minimum length of text to search
            autoFocus={false}
            fetchDetails={false}
            returnKeyType={'done'}
            getDefaultValue={() => this.state.valueLocation}
            listViewDisplayed={false}  // true/false/undefined
            // fetchDetails={false}
            renderDescription={(row) => row.description}
            onPress={(data) => {
                this.onGeoCodeSearchFunc(data.description)
            }}
            onSubmitEditing = {() => {
                this.onGeoCodeSearchFunc(location);
            }}
            query={query}
            styles={{
                textInputContainer: {
                    width: '100%',
                    backgroundColor: Colors.white,
                    borderTopWidth: 0,
                    borderBottomWidth: 0
                },
                textInput: [{
                    marginLeft: 0,
                    marginRight: 0,
                    paddingLeft: 5,
                    height: 26,
                    backgroundColor: Colors.transparent,
                    color: Colors.black,
                    fontSize: 13
                }, stylesGlobal.font],
                container:{
                    backgroundColor: Colors.white,
                    zIndex: 100,
                },
                listView: {
                    // position: 'absolute',
                    backgroundColor: Colors.white,
                    
                },
                predefinedPlacesDescription: [{
                    color: Colors.black,
                    fontSize: 13,
                }, stylesGlobal.font, {zIndex: 20}],
                description: [{fontSize: 13,}, stylesGlobal.font]
            }}
            currentLocation={false}
            currentLocationLabel="Current location"
            nearbyPlacesAPI="GooglePlacesSearch"
            textInputProps={{
                onChangeText: (text) => {
                    location = text;
                    this.setState({
                        valueLocation: text
                    })
                }
            }}
        />
    };

    /**
     * get google place data of selected place
     */
    onGeoCodeSearchFunc = (data) => {
        // Geocoder.geocodeAddress(data).then(res => {
        //     console.log(TAG, " onGeoCodeSearchFunc res" + JSON.stringify(res))
        //     this.setState({
        //         // countryName:res[0].countryCode,
        //         locationInfo: res,
        //         valueLocation: data,
        //         loading: false
        //     }, () => {
        //         location = data
        //     })
        // }).catch(err => {
        //     console.log(TAG, " onGeoCodeSearchFunc err " + err)
        //     this.setState({
        //         valueLocation: data,
        //         loading: false
        //     }, () => {
        //         location = data
        //     })
        // })
        this.setState({
            valueLocation: data,
            loading: false
        }, () => {
            location = data
        })
    }

    /**
     * display TextView View
     */
    renderTextView = (headerText, stateValue) => {
        return (

            <View style={styles.headView}>
                <Text style={[styles.headingText, stylesGlobal.font]}>{headerText}</Text>
                <Text
                    style={[styles.textInputText, { marginTop: 5 }, stylesGlobal.font]}
                >{this.state.valueDateOfBirth}</Text>
                <View style={styles.bottomView}></View>
            </View>

        );

    }
    renderlanguageRow = (index) => {
        let p = []
        for (let i = 0; i < 3; i++) {
            const j = index * 3 + i;
            const value = this.state.selectedLanguageList[j];
            p.push(
                <View
                    key={j}
                    style={{
                        marginRight: 10,
                        borderColor:Colors.black,
                        borderWidth: 1,
                        flexDirection:'row',
                        alignItems:'center',
                        borderColor:'gray', borderWidth:1, borderRadius:4
                    }}
                >
                    <Text style={[{marginHorizontal:5,}, stylesGlobal.font]}>{value}</Text>
                    <TouchableOpacity onPress={() => {
                        const {selectedLanguageList} = this.state;
                        const i = selectedLanguageList.indexOf(value);
                        selectedLanguageList.splice(i,1);
                        this.setState({selectedLanguageList});
                    }}>
                        <Icon size={15} color='gray' name="x" />
                    </TouchableOpacity>
                </View>
            )
        }
        return p;
    }
    renderlanguagelist = () => {
        const len = this.state.selectedLanguageList.length;
        const row = Math.floor(len / 3);
        const lev = len % 3;
        let p = [];
        for (let index = 0; index < row; index++) {
            // console.log(index)
            p.push(
                <View key = {index} style={{flexDirection:'row',paddingVertical:2}}>
                    {this.renderlanguageRow(index)}
                </View>
            )
        }
        if (lev === 2) {
            const value = this.state.selectedLanguageList[len - 1];
            const value1 = this.state.selectedLanguageList[len - 2];
            p.push(
                <View key = {value} style={{flexDirection:'row', paddingVertical:2}}>
                    <View style={{marginRight: 10, borderColor:Colors.black, borderWidth: 1, flexDirection:'row', alignItems:'center', borderColor:'gray', borderWidth:1, borderRadius:4, padding:3}}>
                        <Text style={[{marginHorizontal:5, fontSize: 13}, stylesGlobal.font]}>{value1}</Text>
                        <TouchableOpacity onPress={() => {
                            const {selectedLanguageList} = this.state;
                            const i = selectedLanguageList.indexOf(value1);
                            selectedLanguageList.splice(i, 1);
                            this.setState({selectedLanguageList});
                        }}>
                            <Icon size={20} style = {{marginLeft: 3}} color='gray' name="x" />
                        </TouchableOpacity>
                    </View>
                    <View style={{marginRight: 10, borderColor:Colors.black, borderWidth: 1, flexDirection:'row', alignItems:'center', borderColor:'gray', borderWidth:1, borderRadius:4, padding:3}}>
                        <Text style={[{marginHorizontal:5,fontSize: 13}, stylesGlobal.font]}>{value}</Text>
                        <TouchableOpacity onPress={() => {
                            const {selectedLanguageList} = this.state;
                            const i = selectedLanguageList.indexOf(value);
                            selectedLanguageList.splice(i,1);
                            this.setState({selectedLanguageList});
                        }}>
                            <Icon size={20} style = {{marginLeft: 3}} color='gray' name="x" />
                        </TouchableOpacity>
                    </View>
                </View>
            )
        } else if (lev === 1) {
            const value = this.state.selectedLanguageList[len - 1];
            p.push(
                <View key = {value} style={{flexDirection:'row', paddingVertical:2}}>
                    <View style={{marginRight: 10, flexDirection:'row', alignItems:'center', borderColor:'gray', borderWidth:1, borderRadius:4, padding:3}}>
                        <Text style={[{marginHorizontal:5, fontSize: 13}, stylesGlobal.font]}>{value}</Text>
                        <TouchableOpacity onPress={() => {
                            const {selectedLanguageList} = this.state;
                            const i = selectedLanguageList.indexOf(value);
                            selectedLanguageList.splice(i, 1);
                            this.setState({selectedLanguageList});
                        }}>
                            <Icon size={20} style = {{marginLeft: 3}} color='gray' name="x" />
                        </TouchableOpacity>
                    </View>
                </View>
            )
        }
        return p;
    }
    /**
    * display DropDown View
    */
    renderLanguageView = (headerText) => {
        let values = "";
        (this.state.selectedLanguageList || []).map((item, j) => {
            values = values + " " + item.label + ",";
        })
        if (values.trim().endsWith(",")) {
            values = values.substring(0, values.length - 1)
        }
        const { query } = this.state;
        const data = this._filterData(query);
        // const len = this.state.selectedLanguageList.length;
        // const row = len / 3;
        // const lev = len % 3;
        return (
            <View style={[{marginTop: 9, minHeight: 65, backgroundColor: Colors.white, zIndex: 10}]} onStartShouldSetResponder={() => this.visibility_show_set("all")}>
                <Text style={[styles.headingText, stylesGlobal.font]}>{headerText}</Text>
                {/* <TouchableOpacity style={{ height: 38, justifyContent: 'center', borderBottomColor: Colors.gray, borderBottomWidth: 1 }}
                    onPress={() => {
                        this.setState({ showLanguageDialog: true })
                    }}
                >
                    <Text style={[{ fontSize: 12, textAlign: 'left', paddingLeft: 4, paddingRight: 4, backgroundColor: Colors.transparent }, stylesGlobal.font]}
                    >{values}</Text>
                </TouchableOpacity> */}
                <View style = {{flexDirection: 'row'}}>
                    <View style={{borderWidth:1, borderColor:Colors.black, marginTop:10, width: '90%'}}>
                        <View style={{padding:10, paddingBottom:0,}}>
                            {this.renderlanguagelist()}
                        </View>
                        
                        <AutoComplete
                            autoCorrect={false}
                            containerStyle={{
                                zIndex: 20
                            }}
                            inputContainerStyle={{
                                borderWidth:0,
                                paddingLeft:5
                            }}
                            
                            data={query === '' ? [] : data}
                            defaultValue={query}
                            renderTextInput = {() => (
                                <TextInput style = {[{color:Colors.black, fontSize: 13, paddingTop: 5, paddingBottom: 5}]} placeholder={'Type Languages here.'} onChangeText={text => this.setState({query: text})}>{this.state.query}</TextInput>
                            )}
                            listStyle = {{height: 150, borderWidth: 0, backgroundColor: 'transparent'}}
                            keyExtractor={(item, index) => index}
                            renderItem={ ({item, index}) => (
                                <TouchableOpacity key={index} style={{backgroundColor:Colors.black, paddingTop: 5, paddingBottom: 5}}
                                    onPress={() => {
                                        const {selectedLanguageList} = this.state;
                                        selectedLanguageList.push(item.value);
                                        this.setState({query:'', selectedLanguageList});
                                    }} >
                                    <Text style={[{color:Colors.white, fontSize: 13}, stylesGlobal.font]}>
                                        {item.value}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                    <Image style = {{width: 30, height:30}} resizeMode = {'contain'} source={require('../icons/publicVisibility_greyscale.png')}/>
                </View>
            </View>
        );
    }

    _filterData = (query) => {
        const data = [];
        for (let k = 0; k < this.props.profileInfo.allLanguageKnown.length; k++) {
            const e = this.props.profileInfo.allLanguageKnown[k];
            data.push(e);
        }
        const {selectedLanguageList} = this.state;
        for (let index = 0; index < selectedLanguageList.length; index++) {
            const element = selectedLanguageList[index];
            for (let j = 0; j < data.length; j++) {
                const ele = data[j];
                if (ele.value == element) {
                    data.splice(j, 1);
                }
            }
        }
        const filtered = data.filter((value, index, ary) => {
            if (query === '') {
                return false;
            }
            const str = value.value;
            if (str.includes(query)) {
                return true;
            } else {
                return false;
            }
        })
        const result = [];
        const map = new Map();
        for (const item of filtered) {
            if(!map.has(item.value)){
                map.set(item.value, true);    // set any value to Map
                result.push(item);
            }
        }

        return result
    }

        /**
     * display DropDown View
     */
    renderDropDown = (headerText, dataForInput = [], selectionMethod, selectedValue) => {
        if (!Array.isArray(dataForInput)) {
           dataForInput = []
        }
        let val = ''
        if(dataForInput[selectedValue] && dataForInput[selectedValue].value) {
            val = dataForInput[selectedValue].value
        }
        return (

            <View style={[styles.headView, { backgroundColor: Colors.white }]} onLayout = {(event) => {
                    if(headerText == "Eye Color") {
                        this.setState({
                            visibility_view_y_eyecolor: event.nativeEvent.layout.y,
                        })
                    } else if(headerText == "Skin Color") {
                        this.setState({
                            visibility_view_y_skincolor: event.nativeEvent.layout.y,
                        })
                    } else if(headerText == "Hair Color") {
                        this.setState({
                            visibility_view_y_haircolor: event.nativeEvent.layout.y,
                        })
                    } else if(headerText == "Height") {
                        this.setState({
                            visibility_view_y_height: event.nativeEvent.layout.y,
                        })
                    } else if(headerText == "Weight") {
                        this.setState({
                            visibility_view_y_weight: event.nativeEvent.layout.y,
                        })
                    } else if(headerText == "Ethinicity") {
                        this.setState({
                            visibility_view_y_ethinicity: event.nativeEvent.layout.y,
                        })
                    } else if(headerText == "Marital Status") {
                        this.setState({
                            visibility_view_y_maritalstatus: event.nativeEvent.layout.y,
                        })
                    } else if(headerText == "Body") {
                        this.setState({
                            visibility_view_y_body: event.nativeEvent.layout.y,
                        })
                    }
                }}
            >
                <Text style={[styles.headingText, stylesGlobal.font]}>{headerText}</Text>
                <View style = {{flex: 1, flexDirection: 'row'}}>
                    <View style = {{width: '90%'}}>
                        <Dropdown
                            ref={this.typographyRef}
                            inputContainerStyle={{ borderBottomColor: 'transparent' }}
                            containerStyle={styles.viewCenterText}
                            value={val}
                            onChangeText={selectionMethod}
                            label={''}
                            data={dataForInput}
                            fontSize={12}
                            labelFontSize={13}
                            baseColor={Colors.black}
                            textColor={Colors.black}
                            labelHeight={18}
                        />
                    </View>
                {
                    headerText == "Gender" &&
                    /*
                    <TouchableOpacity onPress = {() => this.visibility_show_set("gender")}>
                        <Image style = {{width: 30, height:30}} resizeMode = {'contain'} source={this.state.visibility_gender == 0 ? require('../icons/publicVisibility.png') : require('../icons/memberVisibility.png')}/>
                    </TouchableOpacity>
                    */
                   <Image style = {{width: 30, height:30}} resizeMode = {'contain'} source={require('../icons/publicVisibility_greyscale.png')}/>
                }
                {
                    headerText == "Eye Color" &&
                    <TouchableOpacity onPress = {() => this.visibility_show_set("eyecolor")}>
                        <Image style = {{width: 30, height: 30}} resizeMode = {'contain'} source={this.state.category_array[this.state.selected_category_eyecolor].icon_path}/>
                    </TouchableOpacity>
                }
                {
                    headerText == "Skin Color" &&
                    <TouchableOpacity onPress = {() => this.visibility_show_set("skincolor")}>
                        <Image style = {{width: 30, height: 30}} resizeMode = {'contain'} source={this.state.category_array[this.state.selected_category_skincolor].icon_path}/>
                    </TouchableOpacity>
                }
                {
                    headerText == "Hair Color" &&
                    <TouchableOpacity onPress = {() => this.visibility_show_set("haircolor")}>
                        <Image style = {{width: 30, height: 30}} resizeMode = {'contain'} source={this.state.category_array[this.state.selected_category_haircolor].icon_path}/>
                    </TouchableOpacity>
                }
                {
                    headerText == "Height" &&
                    <TouchableOpacity onPress = {() => this.visibility_show_set("height")}>
                        <Image style = {{width: 30, height: 30}} resizeMode = {'contain'} source={this.state.category_array[this.state.selected_category_height].icon_path}/>
                    </TouchableOpacity>
                }
                {
                    headerText == "Weight" &&
                    <TouchableOpacity onPress = {() => this.visibility_show_set("weight")}>
                        <Image style = {{width: 30, height: 30}} resizeMode = {'contain'} source={this.state.category_array[this.state.selected_category_weight].icon_path}/>
                    </TouchableOpacity>
                }
                {
                    headerText == "Ethinicity" &&
                    <TouchableOpacity onPress = {() => this.visibility_show_set("ethinicity")}>
                        <Image style = {{width: 30, height: 30}} resizeMode = {'contain'} source={this.state.category_array[this.state.selected_category_ethinicity].icon_path}/>
                    </TouchableOpacity>
                }
                {
                    headerText == "Marital Status" &&
                    <TouchableOpacity onPress = {() => this.visibility_show_set("maritalstatus")}>
                        <Image style = {{width: 30, height: 30}} resizeMode = {'contain'} source={this.state.category_array[this.state.selected_category_maritalstatus].icon_path}/>
                    </TouchableOpacity>
                }
                {
                    headerText == "Body" &&
                    <TouchableOpacity onPress = {() => this.visibility_show_set("body")}>
                        <Image style = {{width: 30, height: 30}} resizeMode = {'contain'} source={this.state.category_array[this.state.selected_category_body].icon_path}/>
                    </TouchableOpacity>
                }
                </View>
            </View>
        );
    }

}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingBottom: 10,
        backgroundColor: Colors.white
    },
    headView: {
        marginTop: 9,
        height: 65
    },
    headingText: {
        color: Colors.black,
        fontWeight: 'bold',
        backgroundColor: Colors.transparent,
        fontSize: 14,
    },
    headingTextPhone: {
        color: Colors.black,
        fontWeight: 'bold',
        backgroundColor: Colors.transparent,
        fontSize: 14,
        // marginLeft:10,
        // marginTop:5
    },
    bottomView: {
        backgroundColor: Colors.gray,
        height: 1,
        marginTop: 1
    },
    viewCenterText: {
        padding: 5,
        justifyContent: 'center',
        backgroundColor: Colors.white,
        borderBottomColor: Colors.gray,
        borderBottomWidth: 1,
        borderRadius: 2,
        height: 34,
    },
    textInputText: {
        color: Colors.black,
        marginTop: 1,
        backgroundColor: Colors.white,
        flex: 1,
        fontSize: 13,
        height: 26
    },
    textInputTextPhone: {
        color: Colors.black,
        marginTop: 1,
        backgroundColor: Colors.white,
        flex: 1,
        fontSize: 13,
        height: 26,
        marginTop:2
    },

    multiLineTextInput: {
        color: Colors.black,
        fontSize: 13,
        marginTop: 1,
        backgroundColor: Colors.white,
        minHeight: 150,
        maxHeight: 150,
        alignContent: 'center',
    },
    subView: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: Colors.black,
        height: 250,
        paddingLeft: 10,
        paddingBottom: 10,
        paddingRight: 10
    },

    visibility_container_view: {
        position: 'absolute', 
        justifyContent: 'space-between', 
        zIndex: 10, 
        backgroundColor: '#ffffff', 
        borderRadius: 3, 
        borderColor: '#000000', 
        borderWidth: 1
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
});

const pickerSelectStyles = StyleSheet.create({
    inputIOS: {
        justifyContent: 'center',
        backgroundColor: Colors.white,
        // borderRadius: 4,
        // borderBottomColor: Colors.black,
        // borderBottomWidth: 1,
        height: 26,
        color: Colors.black,
        fontSize: 13,
        fontFamily:'raleway',
        margin: 0
    },
    inputAndroid: {
        justifyContent: 'center',
        backgroundColor: Colors.white,
        // borderRadius: 4,
        // borderBottomColor: Colors.black,
        // borderBottomWidth: 1,
        height: 26,
        color: Colors.black,
        fontSize: 13,
        fontFamily:'raleway',
    }, 
});
