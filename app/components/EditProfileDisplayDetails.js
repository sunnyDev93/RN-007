import React, { Component } from "react";
import {
	StyleSheet,
	Text,
	View,
	TextInput,
	TouchableOpacity,
	Image,
	Dimensions
} from "react-native";
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import { Dropdown } from 'react-native-material-dropdown';
import DateTimePicker from "react-native-modal-datetime-picker";
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import CountryPicker, { getAllCountries } from 'react-native-country-picker-modal';
import Geocoder from "react-native-geocoder";
import Moment from "moment/moment";
import AutoComplete from 'react-native-autocomplete-input';
import Icon from 'react-native-vector-icons/Feather'
import { AsYouType, parseNumber, parsePhoneNumberFromString, formatNumber  } from 'libphonenumber-js';
import RNPickerSelect from 'react-native-picker-select';
import AsyncStorage from '@react-native-community/async-storage';
import * as ValidationUtils from "../utils/ValidationUtils";
import { Colors } from "../consts/Colors";
import { Constants } from "../consts/Constants";
import { stylesGlobal } from '../consts/StyleSheet';
import { removeCountryCode } from "../utils/Util";
import * as Global from "../consts/Global";
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
			valueSocial: '',
			valueDateOfBirth: '',
			valueLocation: '',
			valuePhone: '',
			valueTemp: '',

			valueAboutMe: '',
			valueThingsIlike: '',
			languageList: [],
			selectedLanguageList: [],
			showLanguageDialog: false,
			callingCode: "1",
			countryName: 'US',
			emptyField: '',
			query: '',

			isDateTimePickerVisible: false,

			language_view_height: 0,

			selected_row: '',
			show_visibility: false,
			selected_category: 0,
			selected_category_avatar: 2,
			selected_category_last_name: 2,
			selected_category_email: 2,
			selected_category_dob: 2,
			selected_category_location: 2,
			selected_category_eyecolor: 2,
			selected_category_skincolor: 2,
			selected_category_haircolor: 2,
			selected_category_height: 2,
			selected_category_weight: 2,
			selected_category_ethinicity: 2,
			selected_category_maritalstatus: 2,
			selected_category_body: 2,
			selected_category_about_me: 2,
			selected_category_things_i_likes: 2,
			selected_category_social: 2,
			category_array: Global.category_array_others,
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
			heightAboutMe: 0,
			heightThingsLike: 0,
			isDobEditable: true,
			phoneNumber: "",
			profileImageSize: Dimensions.get("window").width < Dimensions.get("window").height ? (Dimensions.get("window").width - 20) * 0.75 : (Dimensions.get("window").height - 20) * 0.75,
		};
	}
	/**
	* get profile info data
	*/
	componentDidMount() {
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

		var social = "";
		if (this.props.profileInfo.profileData.social_media != undefined && this.props.profileInfo.profileData.social_media != null) {
			social = this.props.profileInfo.profileData.social_media;
		}

		var phone = "";
		if (this.props.profileInfo.profileData.phone != undefined && this.props.profileInfo.profileData.phone != null) {
			phone = this.props.profileInfo.profileData.phone;
		}

		var address = "";
		if (this.props.profileInfo.profileData.address != undefined && this.props.profileInfo.profileData.address != null) {
			address = this.props.profileInfo.profileData.address;
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
		for (i = 0; i < customFieldsData.length; i++) {
			for (j = 0; j < customFieldsData[i].length; j++) {
				customFieldsData[i][j].label = customFieldsData[i][j].value
			}
			if (customFieldsData[i][0].field_name_key == "eye_color") {
				this.setState({
					eye_color_array: customFieldsData[i],
				})
			} else if (customFieldsData[i][0].field_name_key == "skin_color") {
				this.setState({
					skin_color_array: customFieldsData[i],
				})
			} else if (customFieldsData[i][0].field_name_key == "hair_color") {
				this.setState({
					hair_color_array: customFieldsData[i],
				})
			} else if (customFieldsData[i][0].field_name_key == "height") {
				this.setState({
					height_array: customFieldsData[i],
				})
			} else if (customFieldsData[i][0].field_name_key == "weight") {
				this.setState({
					weight_array: customFieldsData[i],
				})
			} else if (customFieldsData[i][0].field_name_key == "ethnicity") {
				this.setState({
					ethnicity_array: customFieldsData[i],
				})
			} else if (customFieldsData[i][0].field_name_key == "marital_status") {
				this.setState({
					marital_status_array: customFieldsData[i],
				})
			} else if (customFieldsData[i][0].field_name_key == "body") {
				this.setState({
					body_array: customFieldsData[i],
				})
			} else if (customFieldsData[i][0].field_name_key == "languages_known") {
				this.setState({
					languages_known_array: customFieldsData[i],
				})
			}
		}
		let selectedLanguageList = [];
		const languages_known = this.props.profileInfo.userCustomFields.languages_known;
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
			valueSocial: social,
			valuePhone: phone,
			valueLocation: address,
			valueTemp: '',
			valueAboutMe: aboutMe,
			valueThingsIlike: thingnILike,
			languageList: customFieldsData.languages_known,
			selectedLanguageList: languages_known == undefined ? [] : languages_known.split(', '),
			showLanguageDialog: false,
		})
		if (this.props.profileInfo.profileData.dob_verified_on != null && this.props.profileInfo.profileData.dob_verified_on != undefined) {
			this.setState({ isDobEditable: false });
		} else {
			this.setState({ isDobEditable: true });
		}
		if (this.props.profileInfo.profileData.dob) {
			this.setState({
				valueDateOfBirth: Moment(this.props.profileInfo.profileData.dob).format("MM/DD/YYYY"),
			})
		} else {
			this.setState({
				valueDateOfBirth: Moment(new Date()).format("MM/DD/YYYY"),
			})
		}
		if (phone != null && phone != "") {
			var phone_class = null;
			if (phone.charAt(0) != '+') {
				phone = '+' + phone;
			}
			phone_class = parsePhoneNumberFromString(phone);
			if (phone_class) {
				this.setState({
					valuePhone: phone_class.nationalNumber,
					callingCode: phone_class.countryCallingCode,
					countryName: phone_class.country
				})
			}
		}
		this.onGeoCodeSearchFunc(address)

		this.setUpInitailData();

		if (this.props.profileInfo.other_fields.last_name != null) {
			for (i = 0; i < this.state.category_array.length; i++) {
				if (this.state.category_array[i].value.toString() == this.props.profileInfo.other_fields.last_name) {
					this.setState({
						selected_category_last_name: i
					})
					break;
				}
			}
		}

		if (this.props.profileInfo.other_fields.email != null) {
			for (i = 0; i < this.state.category_array.length; i++) {
				if (this.state.category_array[i].value.toString() == this.props.profileInfo.other_fields.email) {
					this.setState({
						selected_category_email: i
					})
					break;
				}
			}
		}

		if (this.props.profileInfo.other_fields.age != null) {
			for (i = 0; i < this.state.category_array.length; i++) {
				if (this.state.category_array[i].value.toString() == this.props.profileInfo.other_fields.age) {
					this.setState({
						selected_category_dob: i
					})
					break;
				}
			}
		}

		if (this.props.profileInfo.other_fields.location != null) {
			for (i = 0; i < this.state.category_array.length; i++) {
				if (this.state.category_array[i].value.toString() == this.props.profileInfo.other_fields.location) {
					this.setState({
						selected_category_location: i
					})
					break;
				}
			}
		}
		if (this.props.profileInfo.other_fields.about_me != null) {
			for (i = 0; i < this.state.category_array.length; i++) {
				if (this.state.category_array[i].value.toString() == this.props.profileInfo.other_fields.about_me) {
					this.setState({
						selected_category_about_me: i
					})
					break;
				}
			}
		}
		if (this.props.profileInfo.other_fields.things_i_likes != null) {
			for (i = 0; i < this.state.category_array.length; i++) {
				if (this.state.category_array[i].value.toString() == this.props.profileInfo.other_fields.things_i_likes) {
					this.setState({
						selected_category_things_i_likes: i
					})
					break;
				}
			}
		}
		if (this.props.profileInfo.other_fields.social_media != null) {
			for (i = 0; i < this.state.category_array.length; i++) {
				if (this.state.category_array[i].value.toString() == this.props.profileInfo.other_fields.social_media) {
					this.setState({
						selected_category_social: i
					})
					break;
				}
			}
		}


		if (this.props.profileInfo.visibility["1"] != null) {
			for (i = 0; i < this.state.category_array.length; i++) {
				if (this.state.category_array[i].value.toString() == this.props.profileInfo.visibility["1"]) {
					this.setState({
						selected_category_eyecolor: i
					})
					break;
				}
			}
		}
		if (this.props.profileInfo.visibility["2"] != null) {
			for (i = 0; i < this.state.category_array.length; i++) {
				if (this.state.category_array[i].value.toString() == this.props.profileInfo.visibility["2"]) {
					this.setState({
						selected_category_skincolor: i
					})
					break;
				}
			}
		}
		if (this.props.profileInfo.visibility["3"] != null) {
			for (i = 0; i < this.state.category_array.length; i++) {
				if (this.state.category_array[i].value.toString() == this.props.profileInfo.visibility["3"]) {
					this.setState({
						selected_category_haircolor: i
					})
					break;
				}
			}
		}
		if (this.props.profileInfo.visibility["7"] != null) {
			for (i = 0; i < this.state.category_array.length; i++) {
				if (this.state.category_array[i].value.toString() == this.props.profileInfo.visibility["7"]) {
					this.setState({
						selected_category_height: i
					})
					break;
				}
			}
		}
		if (this.props.profileInfo.visibility["8"] != null) {
			for (i = 0; i < this.state.category_array.length; i++) {
				if (this.state.category_array[i].value.toString() == this.props.profileInfo.visibility["8"]) {
					this.setState({
						selected_category_weight: i
					})
					break;
				}
			}
		}
		if (this.props.profileInfo.visibility["13"] != null) {
			for (i = 0; i < this.state.category_array.length; i++) {
				if (this.state.category_array[i].value.toString() == this.props.profileInfo.visibility["13"]) {
					this.setState({
						selected_category_ethinicity: i
					})
					break;
				}
			}
		}
		if (this.props.profileInfo.visibility["21"] != null) {
			for (i = 0; i < this.state.category_array.length; i++) {
				if (this.state.category_array[i].value.toString() == this.props.profileInfo.visibility["21"]) {
					this.setState({
						selected_category_maritalstatus: i
					})
					break;
				}
			}
		}
		if (this.props.profileInfo.visibility["22"] != null) {
			for (i = 0; i < this.state.category_array.length; i++) {
				if (this.state.category_array[i].value.toString() == this.props.profileInfo.visibility["22"]) {
					this.setState({
						selected_category_body: i
					})
					break;
				}
			}
		}

		if (this.props.profileInfo.visibility["24"] != null) {
			for (i = 0; i < this.state.category_array.length; i++) {
				if (this.state.category_array[i].value.toString() == this.props.profileInfo.visibility["24"]) {
					this.setState({
						selected_category_avatar: i
					})
					break;
				}
			}
		}
		this.locationRef.setAddressText(address);
	}
	/**
	* display yprofile info data
	*/
	setUpInitailData = async () => {
		profileDetail = this.props.profileInfo;
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

		var exist = false;
		for (var index = 0; index < customFieldsData.length; index++) {
			if (customFieldsData[index][0].field_name_key == "eye_color") {
				if (profileDetail.userCustomFields.eye_color) {
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
					if (!exist) {
						this.setState({
							selected_eye_color_value: customFieldsData[index][0].value
						});
					}
				}
			} else if (customFieldsData[index][0].field_name_key == "skin_color") {
				if (profileDetail.userCustomFields.skin_color) {
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
					if (!exist) {
						this.setState({
							selected_skin_color_value: customFieldsData[index][0].value
						});
					}
				}
			} else if (customFieldsData[index][0].field_name_key == "hair_color") {
				if (profileDetail.userCustomFields.hair_color) {
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
					if (!exist) {
						this.setState({
							selected_hair_color_value: customFieldsData[index][0].value
						});
					}
				}
			} else if (customFieldsData[index][0].field_name_key == "height") {
				if (profileDetail.userCustomFields.height) {
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
					if (!exist) {
						this.setState({
							selected_height_value: customFieldsData[index][0].value
						});
					}
				}
			} else if (customFieldsData[index][0].field_name_key == "weight") {
				if (profileDetail.userCustomFields.weight) {
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
					if (!exist) {
						this.setState({
							selected_weight_value: customFieldsData[index][0].value
						});
					}
				}
			} else if (customFieldsData[index][0].field_name_key == "ethnicity") {
				if (profileDetail.userCustomFields.ethnicity) {
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
					if (!exist) {
						this.setState({
							selected_ethnicity_value: customFieldsData[index][0].value
						});
					}
				}
			} else if (customFieldsData[index][0].field_name_key == "marital_status") {
				if (profileDetail.userCustomFields.marital_status) {
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
					if (!exist) {
						this.setState({
							selected_marital_status_value: customFieldsData[index][0].value
						});
					}
				}
			} else if (customFieldsData[index][0].field_name_key == "body") {
				if (profileDetail.userCustomFields.body) {
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
					if (!exist) {
						this.setState({
							selected_body_value: customFieldsData[index][0].value
						});
					}
				}
			}
		}
		let selectedLanguage = profileDetail.userCustomFields.languages_known.split(', ');

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
			social_media: this.state.valueSocial,
			dob: this.state.valueDateOfBirth,
			// phone: this.state.callingCode + this.state.valuePhone.trim(),
			address: address,
			eye_color: selected_eye_color == -1 ? this.state.eye_color_array[0].id : this.state.eye_color_array[selected_eye_color].id,
			skin_color: selected_skin_color == -1 ? this.state.skin_color_array[0].id : this.state.skin_color_array[selected_skin_color].id,
			hair_color: selected_hair_color == -1 ? this.state.hair_color_array[0].id : this.state.hair_color_array[selected_hair_color].id,
			height: selected_height == -1 ? this.state.height_array[0].id : this.state.height_array[selected_height].id,
			weight: selected_weight == -1 ? this.state.weight_array[0].id : this.state.weight_array[selected_weight].id,
			ethnicity: selected_ethnicity == -1 ? this.state.ethnicity_array[0].id : this.state.ethnicity_array[selected_ethnicity].id,
			marital_status: selected_marital_status == -1 ? this.state.marital_status_array[0].id : this.state.marital_status_array[selected_marital_status].id,
			body: selected_body == -1 ? this.state.body_array[0].id : this.state.body_array[selected_body].id,
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
				"22": this.state.category_array[this.state.selected_category_body].value,
				"24": this.state.category_array[this.state.selected_category_avatar].value
			},
			other_field: {
				last_name: this.state.category_array[this.state.selected_category_last_name].value,
				email: this.state.category_array[this.state.selected_category_email].value,
				age: this.state.category_array[this.state.selected_category_dob].value,
				location: this.state.category_array[this.state.selected_category_location].value,
				about_me: this.state.category_array[this.state.selected_category_about_me].value,
				things_i_likes: this.state.category_array[this.state.selected_category_things_i_likes].value,
				social_media: this.state.category_array[this.state.selected_category_social].value,
			}
		};
		if (this.state.valuePhone.trim() == "") {
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
		this.setState({ valueDateOfBirth: Moment(date).format("MM/DD/YYYY"), isDateTimePickerVisible: false });
	};


	render() {
		return (
			<View style={styles.container} >
				<DateTimePicker
					isVisible={this.state.isDateTimePickerVisible}
					onConfirm={this.handleDatePicked}
					onCancel={this.hideDateTimePicker}
					date={this.state.valueDateOfBirth !== 'Invalid date' ? new Date(this.state.valueDateOfBirth) : new Date()}
					mode={"date"}
				/>
				{
					this.setPersonalDetails()
				}
			</View>
		);
	}

	renderBannerView = () => {
		return (
			<BannerView
				screenProps={this.props.rootNavigation}
			/>
		)
	}

	setPersonalDetails = () => {
		const { member_plan } = this.props.profileInfo.profileData;
		return (
			<View style={{ flex: 1 }}>
				<KeyboardAwareScrollView  keyboardShouldPersistTaps = "handled" style={{ padding: 10 }} extraScrollHeight={100} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps='always'>
					<View style={[stylesGlobal.cardView, { width: Dimensions.get('screen').width * 0.9, padding: 0, }]}>
						<View style={stylesGlobal.title_header}>
							<Text style={[stylesGlobal.headText, stylesGlobal.font]}>PERSONAL DETAILS</Text>
						</View>
						<View style={{ padding: 20 }}>
							<View style={styles.avatarView}>
								<View style={{ flexDirection: 'row', alignItems: 'center' }}>
									<Text style={[styles.headingText, stylesGlobal.font]}>Profile Image</Text>
									<ModalDropdown
										dropdownStyle={{ height: 35 * 5 + 5 * 6, padding: 5, backgroundColor: '#ECEBE8', borderRadius: 3, borderColor: '#000000', borderWidth: 1 }}
										defaultIndex={this.state.selected_category_avatar}
										options={this.state.category_array}
										onSelect={(index) => {
											this.setState({
												selected_category_avatar: index
											})
										}}
										renderButton={() => {
											return (
												<View style={{ justifyContent: 'center', alignItems: 'center' }}>
													<Image style={[styles.ageIcon, { width: 30, height: 30, resizeMode: 'contain' }]} source={this.state.category_array[this.state.selected_category_avatar].icon_path} />
												</View>
											)
										}}
										renderRow={(item, index, highlighted) => {
											return (
												<View style={[styles.visibility_button, this.state.selected_category_avatar == index ? { backgroundColor: Colors.gold } : { backgroundColor: Colors.black }]}>
													<Image style={{ width: 20, height: 20, marginLeft: 8 }} resizeMode={'contain'} source={item.icon_path} />
													<Text style={[styles.visibility_text, stylesGlobal.font, { marginLeft: 5 }]}>{item.label}</Text>
												</View>
											)
										}}
									/>
								</View>
								<View style={[styles.bottomView, { marginTop: 5 }]}></View>
							</View>

							<View style={styles.headView}>
								<View style={{ flexDirection: 'row', alignItems: 'center' }}>
									<Text style={[styles.headingText, stylesGlobal.font]}>First Name</Text>
									<Image style={{ width: 30, height: 30 }} resizeMode={'contain'} source={require('../icons/publicVisibility_greyscale.png')} />
								</View>
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
									editable={!this.props.profileInfo.profileData.is_verified}
									selectTextOnFocus={!this.props.profileInfo.profileData.is_verified}
									value={this.state.valueFirstName}
									style={[styles.textInputText, stylesGlobal.font, this.props.profileInfo.profileData.is_verified && {backgroundColor: "#EEE"}]}
									onSubmitEditing={(event) => {
										//this.refs.valueLastName.focus();
									}}
									keyboardType='ascii-capable'

								/>
							</View>

							<View style={styles.headView}>
								<View style={{ flexDirection: 'row', alignItems: 'center' }}>
									<Text style={[styles.headingText, stylesGlobal.font]}>Last Name</Text>
									<ModalDropdown
										dropdownStyle={{ height: 35 * 5 + 5 * 6, padding: 5, backgroundColor: '#ECEBE8', borderRadius: 3, borderColor: '#000000', borderWidth: 1 }}
										defaultIndex={this.state.selected_category_last_name}
										options={this.state.category_array}
										onSelect={(index) => {
											this.setState({
												selected_category_last_name: index
											})
										}}
										renderButton={() => {
											return (
												<View style={{ justifyContent: 'center', alignItems: 'center' }}>
													<Image style={[styles.ageIcon, { width: 30, height: 30, resizeMode: 'contain' }]} source={this.state.category_array[this.state.selected_category_last_name].icon_path} />
												</View>
											)
										}}
										renderRow={(item, index, highlighted) => {
											return (
												<View style={[styles.visibility_button, this.state.selected_category_last_name == index ? { backgroundColor: Colors.gold } : { backgroundColor: Colors.black }]}>
													<Image style={{ width: 20, height: 20, marginLeft: 8 }} resizeMode={'contain'} source={item.icon_path} />
													<Text style={[styles.visibility_text, stylesGlobal.font, { marginLeft: 5 }]}>{item.label}</Text>
												</View>
											)
										}}
									/>
								</View>
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
									editable={!this.props.profileInfo.profileData.is_verified}
									selectTextOnFocus={!this.props.profileInfo.profileData.is_verified}
									style={[styles.textInputText, stylesGlobal.font, this.props.profileInfo.profileData.is_verified && {backgroundColor: "#EEE"}]}
									onSubmitEditing={(event) => {
										//this.refs.valueEmail.focus();
									}}
									keyboardType='ascii-capable'
								></TextInput>
							</View>
							<View style={[styles.headView, { backgroundColor: Colors.white }]}>
								<View style={{ flexDirection: 'row', alignItems: 'center' }}>
									<Text style={[styles.headingText, stylesGlobal.font]}>Gender</Text>
									<Image style={{ width: 30, height: 30 }} resizeMode={'contain'} source={require('../icons/publicVisibility_greyscale.png')} />
								</View>
								<View style={{ borderColor: '#000000', borderWidth: 1, borderRadius: 4, padding: 2, paddingHorizontal: 10, height: 40, justifyContent: 'center', textAlignVertical: 'center' }}>
									<RNPickerSelect
										items={this.state.gender_array}
										style={{ ...pickerSelectStyles }}
										placeholder={{
											// label: 'Select a gender...',
											// value: null,
										}}
										value={this.state.selected_gender_value}
										onValueChange={(value, index) => {
											selected_gender = index;
											if (index == 0) {
												this.setState({
													selected_gender_value: null
												})
											} else {
												this.setState({
													selected_gender_value: this.state.gender_array[index].value
												})
											}
										}}										
									/>
								</View>
							</View>

							<View style={styles.headView}>
								<View style={{ flexDirection: 'row', alignItems: 'center' }}>
									<Text style={[styles.headingText, stylesGlobal.font]}>Email</Text>
									<ModalDropdown
										dropdownStyle={{ height: 35 * 5 + 5 * 6, padding: 5, backgroundColor: '#ECEBE8', borderRadius: 3, borderColor: '#000000', borderWidth: 1 }}
										defaultIndex={this.state.selected_category_email}
										options={this.state.category_array}
										onSelect={(index) => {
											this.setState({
												selected_category_email: index
											})
										}}
										renderButton={() => {
											return (
												<View style={{ justifyContent: 'center', alignItems: 'center' }}>
													<Image style={[styles.ageIcon, { width: 30, height: 30, resizeMode: 'contain' }]} source={this.state.category_array[this.state.selected_category_email].icon_path} />
												</View>
											)
										}}
										renderRow={(item, index, highlighted) => {
											return (
												<View style={[styles.visibility_button, this.state.selected_category_email == index ? { backgroundColor: Colors.gold } : { backgroundColor: Colors.black }]}>
													<Image style={{ width: 20, height: 20, marginLeft: 8 }} resizeMode={'contain'} source={item.icon_path} />
													<Text style={[styles.visibility_text, stylesGlobal.font, { marginLeft: 5 }]}>{item.label}</Text>
												</View>
											)
										}}
									/>
								</View>
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

							<View style={styles.headView}>
								<View style={{ width: '100%', flexDirection: 'row', alignItems: 'center' }}>
									<Text style={[styles.headingText, stylesGlobal.font.fontFamily, { marginBottom: 0 }]}>Date of Birth</Text>
									<ModalDropdown
										dropdownStyle={{ height: 35 * 5 + 5 * 6, padding: 5, backgroundColor: '#ECEBE8', borderRadius: 3, borderColor: '#000000', borderWidth: 1 }}
										defaultIndex={this.state.selected_category_dob}
										options={this.state.category_array}
										member_plan={member_plan}
										onSelect={(index) => {
											if (member_plan == 3 || member_plan == 5 || member_plan == 6) {
												if (index > 1) {
													this.setState({
														selected_category_dob: index
													})
												}
											}
											else {
												this.setState({
													selected_category_dob: index
												})
											}
										}}
										renderButton={() => {
											return (
												<View style={{ justifyContent: 'center', alignItems: 'center' }}>
													<Image style={[styles.ageIcon, { width: 30, height: 30, resizeMode: 'contain' }]} source={this.state.category_array[this.state.selected_category_dob].icon_path} />
												</View>
											)
										}}
										renderRow={(item, index, highlighted) => {
											return (
												<>
													{(member_plan == 3 || member_plan == 5 || member_plan == 6) && index < 2 ?
														<View style={[styles.visibility_button, { backgroundColor: Colors.black }]}>
															{index == 0 && <Image style={{ width: 20, height: 20, marginLeft: 8 }} resizeMode={'contain'} source={require('../icons/privateVisibility_dark.png')} />}
															{index == 1 && <Image style={{ width: 20, height: 20, marginLeft: 8 }} resizeMode={'contain'} source={require('../icons/favoriteVisibility_dark.png')} />}
															<Text style={[styles.visibility_text, stylesGlobal.font, { marginLeft: 5 }]}>{item.label}</Text>
														</View> :
														<View style={[styles.visibility_button, this.state.selected_category_dob == index ? { backgroundColor: Colors.gold } : { backgroundColor: Colors.black }]}>
															<Image style={{ width: 20, height: 20, marginLeft: 8 }} resizeMode={'contain'} source={item.icon_path} />
															<Text style={[styles.visibility_text, stylesGlobal.font, { marginLeft: 5 }]}>{item.label}</Text>
														</View>
													}
												</>
											)
										}}
									/>
								</View>
								<TouchableOpacity style={{ flex: 1 }} disabled={!this.state.isDobEditable} onPress={() => {
									if (this.state.isDobEditable) {
										this.showDateTimePicker()
									}
								}}>
									<TextInput
										keyboardType={"numeric"}
										onChangeText={(text) => {
											const val = text.length === 2 && !text.includes("/")
												? `${text.substring(0, 2)}/${text.substring(2)}`
												: text.length === 5 ? text + '/' : text;
											this.setState({ valueDateOfBirth: val })
										}}
										value={this.state.valueDateOfBirth}
										onBlur={() => {
											this.setState({ valueDateOfBirth: Moment(this.state.valueDateOfBirth).format("MM/DD/YYYY") })
										}}
										maxLength={10}
										defaultValue=""
										multiline={false}
										placeholder={'(mm/dd/yyyy)'}
										placeholderTextColor={Colors.black}
										autoCapitalize='none'
										underlineColorAndroid="transparent"
										style={[styles.textInputText, stylesGlobal.font, !this.state.isDobEditable && {backgroundColor: "#EEE"}]}
										editable={this.state.isDobEditable}
										selectTextOnFocus={this.state.isDobEditable}
										contextNenuHidden={this.state.isDobEditable}
									/>
								</TouchableOpacity>
							</View>

							<View style={styles.headView}>
								<View style={{ width: '100%', flexDirection: 'row', alignItems: 'center' }}>
									<Text style={[styles.headingText, stylesGlobal.font.fontFamily, { marginBottom: 0 }]}>Instagram</Text>
									<ModalDropdown
										dropdownStyle={{ height: 35 * 5 + 5 * 6, padding: 5, backgroundColor: '#ECEBE8', borderRadius: 3, borderColor: '#000000', borderWidth: 1 }}
										defaultIndex={this.state.selected_category_social}
										options={this.state.category_array}
										onSelect={(index) => {
											this.setState({
												selected_category_social: index
											})
										}}
										renderButton={() => {
											return (
												<View style={{ justifyContent: 'center', alignItems: 'center' }}>
													<Image style={[styles.ageIcon, { width: 30, height: 30, resizeMode: 'contain' }]} source={this.state.category_array[this.state.selected_category_social].icon_path} />
												</View>
											)
										}}
										renderRow={(item, index, highlighted) => {
											return (
												<View style={[styles.visibility_button, this.state.selected_category_social == index ? { backgroundColor: Colors.gold } : { backgroundColor: Colors.black }]}>
													<Image style={{ width: 20, height: 20, marginLeft: 8 }} resizeMode={'contain'} source={item.icon_path} />
													<Text style={[styles.visibility_text, stylesGlobal.font, { marginLeft: 5 }]}>{item.label}</Text>
												</View>
											)
										}}
									/>
								</View>
								<TextInput
									ref='valueSocial'
									multiline={false}
									returnKeyType='done'
									numberOfLines={1}
									underlineColorAndroid="transparent"
									autoCapitalize='sentences'
									onChangeText={value => {
										this.setState({ valueSocial: value })
									}}
									value={this.state.valueSocial}
									style={[styles.textInputText, stylesGlobal.font]}
									onSubmitEditing={(event) => {
										// this.refs.valuePhone.focus();
									}}
								></TextInput>
							</View>

							{this.renderLocation('Location', this.state.valueLocation, 'valueLocation')}

							<View style={styles.headView}>
								<View style={{ flexDirection: "row", alignItems: 'center' }}>
									<Text style={[styles.headingText, stylesGlobal.font, { marginLeft: 5 }]}>Phone</Text>
									<Image style={{ width: 30, height: 30 }} resizeMode={'contain'} source={require('../icons/publicVisibility_greyscale.png')} />
								</View>
								<View style={{ flexDirection: 'row', alignItems: 'center' }}>
									{/* <CountryPicker onSelect={(value) => { */}
									{/* 	this.setState({ callingCode: value.callingCode, countryName: value.cca2, valuePhone: "" }) */}
									{/* }} */}
									{/* 	countryCode={this.state.countryName} */}
									{/* 	withFlag={true} */}
									{/* 	withCallingCode={true} */}
									{/* /> */}
									{/* <View style = {{flexDirection:'row', alignItems: 'center', width: '90%'}}> */}
{/* 									<Text style={[{ fontSize: 13, marginLeft: 2, marginTop: 3 }, stylesGlobal.font]}>+{this.state.callingCode}-</Text> */}
{/* 									<TextInput */}
{/* 										ref='valuePhone' */}
{/* 										multiline={false} */}
{/* 										returnKeyType='done' */}
{/* 										keyboardType='phone-pad' */}
{/* 										numberOfLines={1} */}
{/* 										underlineColorAndroid="transparent" */}
{/* 										autoCapitalize='sentences' */}
{/* 										onChangeText={value => { */}
{/* 											this.setState({ valuePhone: removeCountryCode(value) }) */}
{/* 										}} */}
{/* 										value={removeCountryCode(this.state.valuePhone)} */}
{/* 										style={[styles.textInputText, stylesGlobal.font, { flexGrow: 1 }]} */}
{/* 										onSubmitEditing={(event) => { */}
{/* 											//this.refs.valueNetWorthAnnualy.focus(); */}
{/*  */}
{/* 										}} */}
{/* 									></TextInput> */}
									{/* </View> */}

									<View style={{marginLeft: 10, marginRight: 10, flexDirection: 'row', alignItems: 'center'}}>
		                                <CountryPicker onSelect={(value) => {
		                                    this.setState({ callingCode: value.callingCode, countryName: value.cca2, valuePhone: "" })
		                                }}
		                                    countryCode={this.state.countryName}
		                                    withFlag={true}
		                                    withCallingCode={true}
		                                />
		                                <Image style={{ width: 10, height: 10, resizeMode: 'contain', marginRight: 20 }} source={require('../icons/down_arrow.png')} />
		                            </View>
		                            {/* <View style = {{flexDirection:'row', alignItems: 'center', width: '90%'}}> */}
		                            <Text style={[{fontSize: 16,  marginLeft: 2, qkemarginTop: 3 }, stylesGlobal.font]}>+{this.state.callingCode}</Text>
		                            <TextInput
		                                ref='phoneInput'
		                                multiline={false}
		                                returnKeyType='done'
		                                keyboardType='phone-pad'
		                                numberOfLines={1}
		                                underlineColorAndroid="transparent"
		                                autoCapitalize='sentences'
		                                onChangeText={value => {
		                                    const num = parsePhoneNumberFromString(value, this.state.countryName)

		                                    let reg = /^[0-9]/
		                                    if (!!num && this.state.phoneNumber.length > value.length && !reg.test(this.state.phoneNumber[this.state.phoneNumber.length - 1])){
		                                      let phone = num.nationalNumber.split('')
		                                      phone.pop()
		                                      phone = phone.join('')
		                                      this.setState({phoneNumber: phone})
		                                    } else {
		                                      this.setState({phoneNumber: new AsYouType(this.state.countryName).input(value)})
		                                    }

		                                  //  this.setState({ phoneNumber: numPhone})
		                                }}
		                                value={removeCountryCode(this.state.phoneNumber)}
		                                style={[styles.textInputText, stylesGlobal.font, { flexGrow: 1, marginLeft: 10}]}
		                                onSubmitEditing={(event) => {
		                                    //this.refs.valueNetWorthAnnualy.focus();

		                                }}
		                            ></TextInput>
									
								</View>
							</View>

							<View style={[styles.headView, { backgroundColor: Colors.white }]}>
								<View style={{ flexDirection: 'row', alignItems: 'center' }}>
									<Text style={[styles.headingText, stylesGlobal.font]}>Weight</Text>
									<ModalDropdown
										dropdownStyle={{ height: 35 * 5 + 5 * 6, padding: 5, backgroundColor: '#ffffff', borderRadius: 3, borderColor: '#000000', borderWidth: 1 }}
										defaultIndex={this.state.selected_category_weight}
										options={this.state.category_array}
										member_plan={member_plan}
										onSelect={(index) => {
											if (member_plan == 3 || member_plan == 5 || member_plan == 6) {
												if (index > 1) {
													this.setState({
														selected_category_weight: index
													})
												}
											}
											else {
												this.setState({
													selected_category_weight: index
												})
											}
										}}
										renderButton={() => {
											return (
												<View style={{ justifyContent: 'center', alignItems: 'center' }}>
													<Image style={[styles.ageIcon, { width: 30, height: 30, resizeMode: 'contain' }]} source={this.state.category_array[this.state.selected_category_weight].icon_path} />
												</View>
											)
										}}
										renderRow={(item, index, highlighted) => {
											return (
												<>
													{(member_plan == 3 || member_plan == 5 || member_plan == 6) && index < 2 ?
														<View style={[styles.visibility_button, { backgroundColor: Colors.black }]}>
															{index == 0 && <Image style={{ width: 20, height: 20, marginLeft: 8 }} resizeMode={'contain'} source={require('../icons/privateVisibility_dark.png')} />}
															{index == 1 && <Image style={{ width: 20, height: 20, marginLeft: 8 }} resizeMode={'contain'} source={require('../icons/favoriteVisibility_dark.png')} />}
															<Text style={[styles.visibility_text, stylesGlobal.font, { marginLeft: 5 }]}>{item.label}</Text>
														</View> :
														<View style={[styles.visibility_button, this.state.selected_category_weight == index ? { backgroundColor: Colors.gold } : { backgroundColor: Colors.black }]}>
															<Image style={{ width: 20, height: 20, marginLeft: 8 }} resizeMode={'contain'} source={item.icon_path} />
															<Text style={[styles.visibility_text, stylesGlobal.font, { marginLeft: 5 }]}>{item.label}</Text>
														</View>
													}
												</>
											)
										}}
									/>
								</View>
								<View style={styles.menu_button}>
									<RNPickerSelect
										items={this.state.weight_array}
										style={{ ...pickerSelectStyles }}
										placeholder={{
											// label: 'Select a weight...',
											// value: null,
										}}
										value={this.state.selected_weight_value}
										onValueChange={(value, index) => {
											selected_weight = index;
											if (index == 0) {
												this.setState({
													selected_weight_value: null
												})
											} else {
												this.setState({
													selected_weight_value: this.state.weight_array[index].value
												})
											}
										}}
									/>
								</View>
							</View>

							<View style={[styles.headView, { backgroundColor: Colors.white }]}>
								<View style={{ flexDirection: 'row', alignItems: 'center' }}>
									<Text style={[styles.headingText, stylesGlobal.font]}>Height</Text>
									<ModalDropdown
										dropdownStyle={{ height: 35 * 5 + 5 * 6, paddingLeft: 5, paddingTop: 5, paddingRight: 5, backgroundColor: '#ffffff', borderRadius: 3, borderColor: '#000000', borderWidth: 1 }}
										defaultIndex={this.state.selected_category_height}
										options={this.state.category_array}
										member_plan={member_plan}
										onSelect={(index) => {
											if (member_plan == 3 || member_plan == 5 || member_plan == 6) {
												if (index > 1) {
													this.setState({
														selected_category_height: index
													})
												}
											}
											else {
												this.setState({
													selected_category_height: index
												})
											}
										}}
										renderButton={() => {
											return (
												<View style={{ justifyContent: 'center', alignItems: 'center' }}>
													<Image style={[styles.ageIcon, { width: 30, height: 30, resizeMode: 'contain' }]} source={this.state.category_array[this.state.selected_category_height].icon_path} />
												</View>
											)
										}}
										renderRow={(item, index, highlighted) => {
											return (
												<>
													{(member_plan == 3 || member_plan == 5 || member_plan == 6) && index < 2 ?
														<View style={[styles.visibility_button, { backgroundColor: Colors.black }]}>
															{index == 0 && <Image style={{ width: 20, height: 20, marginLeft: 8 }} resizeMode={'contain'} source={require('../icons/privateVisibility_dark.png')} />}
															{index == 1 && <Image style={{ width: 20, height: 20, marginLeft: 8 }} resizeMode={'contain'} source={require('../icons/favoriteVisibility_dark.png')} />}
															<Text style={[styles.visibility_text, stylesGlobal.font, { marginLeft: 5 }]}>{item.label}</Text>
														</View> :
														<View style={[styles.visibility_button, this.state.selected_category_height == index ? { backgroundColor: Colors.gold } : { backgroundColor: Colors.black }]}>
															<Image style={{ width: 20, height: 20, marginLeft: 8 }} resizeMode={'contain'} source={item.icon_path} />
															<Text style={[styles.visibility_text, stylesGlobal.font, { marginLeft: 5 }]}>{item.label}</Text>
														</View>
													}
												</>
											)
										}}
									/>
								</View>
								<View style={styles.menu_button}>
									<RNPickerSelect
										items={this.state.height_array}
										style={{ ...pickerSelectStyles }}
										placeholder={{
											// label: 'Select a height...',
											// value: null,
										}}
										value={this.state.selected_height_value}
										onValueChange={(value, index) => {
											selected_height = index;
											if (index == 0) {
												this.setState({
													selected_height_value: null
												})
											} else {
												this.setState({
													selected_height_value: this.state.height_array[index].value
												})
											}
										}}
									/>
								</View>
							</View>

							<View style={[styles.headView, { backgroundColor: Colors.white }]}>
								<View style={{ flexDirection: 'row', alignItems: 'center' }}>
									<Text style={[styles.headingText, stylesGlobal.font]}>Eye Color</Text>
									<ModalDropdown
										dropdownStyle={{ height: 35 * 5 + 5 * 6, paddingLeft: 5, paddingTop: 5, paddingRight: 5, backgroundColor: '#ffffff', borderRadius: 3, borderColor: '#000000', borderWidth: 1 }}
										defaultIndex={this.state.selected_category_eyecolor}
										options={this.state.category_array}
										onSelect={(index) => {
											this.setState({
												selected_category_eyecolor: index
											})
										}}
										renderButton={() => {
											return (
												<View style={{ justifyContent: 'center', alignItems: 'center' }}>
													<Image style={[styles.ageIcon, { width: 30, height: 30, resizeMode: 'contain' }]} source={this.state.category_array[this.state.selected_category_eyecolor].icon_path} />
												</View>
											)
										}}
										renderRow={(item, index, highlighted) => {
											return (
												<View style={[styles.visibility_button, this.state.selected_category_eyecolor == index ? { backgroundColor: Colors.gold } : { backgroundColor: Colors.black }]}>
													<Image style={{ width: 20, height: 20, marginLeft: 8 }} resizeMode={'contain'} source={item.icon_path} />
													<Text style={[styles.visibility_text, stylesGlobal.font, { marginLeft: 5 }]}>{item.label}</Text>
												</View>
											)
										}}
									/>
								</View>
								<RNPickerSelect
									items={this.state.eye_color_array}
									style={{ ...pickerSelectStyles }}
									placeholder={{
										// label: 'Select a skin color...',
										// value: null,
									}}
									value={this.state.selected_eye_color_value}
									onValueChange={(value, index) => {
										selected_skin_color = index;
										if (index == 0) {
											this.setState({
												selected_eye_color_value: null
											})
										} else {
											this.setState({
												selected_eye_color_value: this.state.eye_color_array[index].value
											})
										}
									}}
								/>
								<View style={[styles.bottomView, { marginTop: 5 }]}></View>
							</View>

							<View style={[styles.headView, { backgroundColor: Colors.white }]}>
								<View style={{ flexDirection: 'row', alignItems: 'center' }}>
									<Text style={[styles.headingText, stylesGlobal.font]}>Skin Color</Text>
									<ModalDropdown
										dropdownStyle={{ height: 35 * 5 + 5 * 6, paddingLeft: 5, paddingTop: 5, paddingRight: 5, backgroundColor: '#ffffff', borderRadius: 3, borderColor: '#000000', borderWidth: 1 }}
										defaultIndex={this.state.selected_category_skincolor}
										options={this.state.category_array}
										onSelect={(index) => {
											this.setState({
												selected_category_skincolor: index
											})
										}}
										renderButton={() => {
											return (
												<View style={{ justifyContent: 'center', alignItems: 'center' }}>
													<Image style={[styles.ageIcon, { width: 30, height: 30, resizeMode: 'contain' }]} source={this.state.category_array[this.state.selected_category_skincolor].icon_path} />
												</View>
											)
										}}
										renderRow={(item, index, highlighted) => {
											return (
												<View style={[styles.visibility_button, this.state.selected_category_skincolor == index ? { backgroundColor: Colors.gold } : { backgroundColor: Colors.black }]}>
													<Image style={{ width: 20, height: 20, marginLeft: 8 }} resizeMode={'contain'} source={item.icon_path} />
													<Text style={[styles.visibility_text, stylesGlobal.font, { marginLeft: 5 }]}>{item.label}</Text>
												</View>
											)
										}}
									/>
								</View>
								<RNPickerSelect
									items={this.state.skin_color_array}
									style={{ ...pickerSelectStyles }}
									placeholder={{
										// label: 'Select a skin color...',
										// value: null,
									}}
									value={this.state.selected_skin_color_value}
									onValueChange={(value, index) => {
										selected_skin_color = index;
										if (index == 0) {
											this.setState({
												selected_skin_color_value: null
											})
										} else {
											this.setState({
												selected_skin_color_value: this.state.skin_color_array[index].value
											})
										}
									}}
								/>
								<View style={[styles.bottomView, { marginTop: 5 }]}></View>
							</View>

							<View style={[styles.headView, { backgroundColor: Colors.white }]}>
								<View style={{ flexDirection: 'row', alignItems: 'center' }}>
									<Text style={[styles.headingText, stylesGlobal.font]}>Hair Color</Text>
									<ModalDropdown
										dropdownStyle={{ height: 35 * 5 + 5 * 6, paddingLeft: 5, paddingTop: 5, paddingRight: 5, backgroundColor: '#ffffff', borderRadius: 3, borderColor: '#000000', borderWidth: 1 }}
										defaultIndex={this.state.selected_category_haircolor}
										options={this.state.category_array}
										onSelect={(index) => {
											this.setState({
												selected_category_haircolor: index
											})
										}}
										renderButton={() => {
											return (
												<View style={{ justifyContent: 'center', alignItems: 'center' }}>
													<Image style={[styles.ageIcon, { width: 30, height: 30, resizeMode: 'contain' }]} source={this.state.category_array[this.state.selected_category_haircolor].icon_path} />
												</View>
											)
										}}
										renderRow={(item, index, highlighted) => {
											return (
												<View style={[styles.visibility_button, this.state.selected_category_haircolor == index ? { backgroundColor: Colors.gold } : { backgroundColor: Colors.black }]}>
													<Image style={{ width: 20, height: 20, marginLeft: 8 }} resizeMode={'contain'} source={item.icon_path} />
													<Text style={[styles.visibility_text, stylesGlobal.font, { marginLeft: 5 }]}>{item.label}</Text>
												</View>
											)
										}}
									/>
								</View>
								<RNPickerSelect
									items={this.state.hair_color_array}
									style={{ ...pickerSelectStyles }}
									placeholder={{
										// label: 'Select a hair color...',
										// value: null,
									}}
									value={this.state.selected_hair_color_value}
									onValueChange={(value, index) => {
										selected_hair_color = index;
										if (index == 0) {
											this.setState({
												selected_hair_color_value: null
											})
										} else {
											this.setState({
												selected_hair_color_value: this.state.hair_color_array[index].value
											})
										}
									}}
								/>
								<View style={[styles.bottomView, { marginTop: 5 }]}></View>
							</View>

							<View style={[styles.headView, { backgroundColor: Colors.white }]}>
								<View style={{ flexDirection: 'row', alignItems: 'center' }}>
									<Text style={[styles.headingText, stylesGlobal.font]}>Ethinicity</Text>
									<ModalDropdown
										dropdownStyle={{ height: 35 * 5 + 5 * 6, paddingLeft: 5, paddingTop: 5, paddingRight: 5, backgroundColor: '#ffffff', borderRadius: 3, borderColor: '#000000', borderWidth: 1 }}
										defaultIndex={this.state.selected_category_ethinicity}
										options={this.state.category_array}
										onSelect={(index) => {
											this.setState({
												selected_category_ethinicity: index
											})
										}}
										renderButton={() => {
											return (
												<View style={{ justifyContent: 'center', alignItems: 'center' }}>
													<Image style={[styles.ageIcon, { width: 30, height: 30, resizeMode: 'contain' }]} source={this.state.category_array[this.state.selected_category_ethinicity].icon_path} />
												</View>
											)
										}}
										renderRow={(item, index, highlighted) => {
											return (
												<View style={[styles.visibility_button, this.state.selected_category_ethinicity == index ? { backgroundColor: Colors.gold } : { backgroundColor: Colors.black }]}>
													<Image style={{ width: 20, height: 20, marginLeft: 8 }} resizeMode={'contain'} source={item.icon_path} />
													<Text style={[styles.visibility_text, stylesGlobal.font, { marginLeft: 5 }]}>{item.label}</Text>
												</View>
											)
										}}
									/>
								</View>
								<RNPickerSelect
									items={this.state.ethnicity_array}
									style={{ ...pickerSelectStyles }}
									placeholder={{
										// label: 'Select a height...',
										// value: null,
									}}
									value={this.state.selected_ethnicity_value}
									onValueChange={(value, index) => {
										selected_ethnicity = index;
										if (index == 0) {
											this.setState({
												selected_ethnicity_value: null
											})
										} else {
											this.setState({
												selected_ethnicity_value: this.state.ethnicity_array[index].value
											})
										}
									}}
								/>
								<View style={[styles.bottomView, { marginTop: 5 }]}></View>
							</View>

							<View style={[styles.headView, { backgroundColor: Colors.white }]}>
								<View style={{ flexDirection: 'row' }}>
									<Text style={[styles.headingText, stylesGlobal.font]}>Marital Status</Text>
									<ModalDropdown
										dropdownStyle={{ height: 35 * 5 + 5 * 6, paddingLeft: 5, paddingTop: 5, paddingRight: 5, backgroundColor: '#ffffff', borderRadius: 3, borderColor: '#000000', borderWidth: 1 }}
										defaultIndex={this.state.selected_category_maritalstatus}
										options={this.state.category_array}
										onSelect={(index) => {
											this.setState({
												selected_category_maritalstatus: index
											})
										}}
										renderButton={() => {
											return (
												<View style={{ justifyContent: 'center', alignItems: 'center' }}>
													<Image style={[styles.ageIcon, { width: 30, height: 30, resizeMode: 'contain' }]} source={this.state.category_array[this.state.selected_category_maritalstatus].icon_path} />
												</View>
											)
										}}
										renderRow={(item, index, highlighted) => {
											return (
												<View style={[styles.visibility_button, this.state.selected_category_maritalstatus == index ? { backgroundColor: Colors.gold } : { backgroundColor: Colors.black }]}>
													<Image style={{ width: 20, height: 20, marginLeft: 8 }} resizeMode={'contain'} source={item.icon_path} />
													<Text style={[styles.visibility_text, stylesGlobal.font, { marginLeft: 5 }]}>{item.label}</Text>
												</View>
											)
										}}
									/>
								</View>
								<RNPickerSelect
									items={this.state.marital_status_array}
									style={{ ...pickerSelectStyles }}
									placeholder={{
										// label: 'Select a height...',
										// value: null,
									}}
									value={this.state.selected_marital_status_value}
									onValueChange={(value, index) => {
										selected_marital_status = index;
										if (index == 0) {
											this.setState({
												selected_marital_status_value: null
											})
										} else {
											this.setState({
												selected_marital_status_value: this.state.marital_status_array[index].value
											})
										}
									}}
								/>
								<View style={[styles.bottomView, { marginTop: 5 }]}></View>
							</View>

							<View style={[styles.headView, { backgroundColor: Colors.white }]}>
								<View style={{ flexDirection: 'row' }}>
									<Text style={[styles.headingText, stylesGlobal.font]}>Body</Text>
									<ModalDropdown
										dropdownStyle={{ height: 35 * 5 + 5 * 6, paddingLeft: 5, paddingTop: 5, paddingRight: 5, backgroundColor: '#ffffff', borderRadius: 3, borderColor: '#000000', borderWidth: 1 }}
										defaultIndex={this.state.selected_category_body}
										member_plan={member_plan}
										options={this.state.category_array}
										onSelect={(index) => {
											if (member_plan == 3 || member_plan == 5 || member_plan == 6) {
												if (index > 1) {
													this.setState({
														selected_category_body: index
													})
												}
											}
											else {
												this.setState({
													selected_category_body: index
												})
											}
										}}
										renderButton={() => {
											return (
												<View style={{ justifyContent: 'center', alignItems: 'center' }}>
													<Image style={[styles.ageIcon, { width: 30, height: 30, resizeMode: 'contain' }]} source={this.state.category_array[this.state.selected_category_body].icon_path} />
												</View>
											)
										}}
										renderRow={(item, index, highlighted) => {
											return (
												<>
													{(member_plan == 3 || member_plan == 5 || member_plan == 6) && index < 2 ?
														<View style={[styles.visibility_button, { backgroundColor: Colors.black }]}>
															{index == 0 && <Image style={{ width: 20, height: 20, marginLeft: 8 }} resizeMode={'contain'} source={require('../icons/privateVisibility_dark.png')} />}
															{index == 1 && <Image style={{ width: 20, height: 20, marginLeft: 8 }} resizeMode={'contain'} source={require('../icons/favoriteVisibility_dark.png')} />}
															<Text style={[styles.visibility_text, stylesGlobal.font, { marginLeft: 5 }]}>{item.label}</Text>
														</View> :
														<View style={[styles.visibility_button, this.state.selected_category_body == index ? { backgroundColor: Colors.gold } : { backgroundColor: Colors.black }]}>
															<Image style={{ width: 20, height: 20, marginLeft: 8 }} resizeMode={'contain'} source={item.icon_path} />
															<Text style={[styles.visibility_text, stylesGlobal.font, { marginLeft: 5 }]}>{item.label}</Text>
														</View>
													}
												</>
											)
										}}
									/>
								</View>
								<RNPickerSelect
									items={this.state.body_array}
									style={{ ...pickerSelectStyles }}
									placeholder={{
										// label: 'Select a height...',
										// value: null,
									}}
									value={this.state.selected_body_value}
									onValueChange={(value, index) => {
										selected_body = index;
										if (index == 0) {
											this.setState({
												selected_body_value: null
											})
										} else {
											this.setState({
												selected_body_value: this.state.body_array[index].value
											})
										}
									}}
								/>
								<View style={[styles.bottomView, { marginTop: 5 }]}></View>
							</View>

						</View>
					</View>

					<View style={[stylesGlobal.cardView, { width: Dimensions.get('screen').width * 0.9, marginTop: 15, }]}>
						<View style={[styles.headView, { height: 40 + 200 }]}>
							<View style={{ flexDirection: 'row', alignItems: 'center' }}>
								<Text style={[styles.headingText, stylesGlobal.font]}>About Me</Text>
								<ModalDropdown
									dropdownStyle={{ height: 35 * 5 + 5 * 6, paddingLeft: 5, paddingTop: 5, paddingRight: 5, backgroundColor: '#ffffff', borderRadius: 3, borderColor: '#000000', borderWidth: 1 }}
									defaultIndex={this.state.selected_category_about_me}
									options={this.state.category_array}
									onSelect={(index) => {
										this.setState({
											selected_category_about_me: index
										})
									}}
									renderButton={() => {
										return (
											<View style={{ justifyContent: 'center', alignItems: 'center' }}>
												<Image style={[styles.ageIcon, { width: 30, height: 30, resizeMode: 'contain' }]} source={this.state.category_array[this.state.selected_category_about_me].icon_path} />
											</View>
										)
									}}
									renderRow={(item, index, highlighted) => {
										return (
											<View style={[styles.visibility_button, this.state.selected_category_about_me == index ? { backgroundColor: Colors.gold } : { backgroundColor: Colors.black }]}>
												<Image style={{ width: 20, height: 20, marginLeft: 8 }} resizeMode={'contain'} source={item.icon_path} />
												<Text style={[styles.visibility_text, stylesGlobal.font, { marginLeft: 5 }]}>{item.label}</Text>
											</View>
										)
									}}
								/>
							</View>
							<TextInput
								ref='valueAboutMe'
								blurOnSubmit={false}
								autoFocus={false}
								// style={[styles.multiLineTextInput, stylesGlobal.font]}
								style={[styles.textInputText, stylesGlobal.font, { height: 200 }]}
								onChangeText={value => { this.setState({ valueAboutMe: value }) }}
								value={this.state.valueAboutMe}
								defaultValue=""
								multiline={true}
								autoCapitalize='sentences'
								returnKeyType='default'
								underlineColorAndroid="transparent"
								onSubmitEditing={(event) => {

								}}
								// onContentSizeChange={(event) => {
								// 	//if(event.nativeEvent.contentSize.height < 80)
								// 	{
								// 		this.setState({
								// 			//valueAboutMe: event.nativeEvent.text,
								// 			heightAboutMe: event.nativeEvent.contentSize.height
								// 		})
								// 	}

								// }}
								keyboardType='ascii-capable'
							></TextInput>
						</View>


						{this.renderLanguageView('Languages Known', this.state.selectedLanguageList)}
						<View style={[styles.headView, { height: 240 }]}>
							<View style={{ flexDirection: 'row', alignItems: 'center' }}>
								<Text style={[styles.headingText, stylesGlobal.font]}>Things I Like</Text>
								<ModalDropdown
									dropdownStyle={{ height: 35 * 5 + 5 * 6, padding: 5, backgroundColor: '#E8C26B', borderRadius: 3, borderColor: '#000000', borderWidth: 1 }}
									defaultIndex={this.state.selected_category_things_i_likes}
									options={this.state.category_array}
									onSelect={(index) => {
										this.setState({
											selected_category_things_i_likes: index
										})
									}}
									renderButton={() => {
										return (
											<View style={{ justifyContent: 'center', alignItems: 'center' }}>
												<Image style={[styles.ageIcon, { width: 30, height: 30, resizeMode: 'contain' }]} source={this.state.category_array[this.state.selected_category_things_i_likes].icon_path} />
											</View>
										)
									}}
									renderRow={(item, index, highlighted) => {
										return (
											<View style={[styles.visibility_button, this.state.selected_category_things_i_likes == index ? { backgroundColor: Colors.gold } : { backgroundColor: Colors.black }]}>
												<Image style={{ width: 20, height: 20, marginLeft: 8 }} resizeMode={'contain'} source={item.icon_path} />
												<Text style={[styles.visibility_text, stylesGlobal.font, { marginLeft: 5 }]}>{item.label}</Text>
											</View>
										)
									}}
								/>
							</View>
							<TextInput
								ref='valueThingsIlike'
								underlineColorAndroid="transparent"
								blurOnSubmit={false}
								autoFocus={false}
								// style={[styles.multiLineTextInput, stylesGlobal.font]}
								style={[styles.textInputText, stylesGlobal.font, { height: 200 }]}
								onChangeText={value => { this.setState({ valueThingsIlike: value }) }}
								value={this.state.valueThingsIlike}
								defaultValue=""
								placeholder={"Type on here"}
								multiline={true}
								autoCapitalize='sentences'
								returnKeyType='default'
								onSubmitEditing={(event) => {

								}}
								// onContentSizeChange={(event) => {
								// 	//if(event.nativeEvent.contentSize.height < 80)
								// 	{
								// 		this.setState({
								// 			//valueAboutMe: event.nativeEvent.text,
								// 			heightThingsLike: event.nativeEvent.contentSize.height
								// 		})
								// 	}

								// }}
								keyboardType='ascii-capable'
							></TextInput>
						</View>
					</View>
				</KeyboardAwareScrollView>
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
			<View style={{ marginTop: 9, minHeight: 65 }}>
				<View style={{ flexDirection: 'row', alignItems: 'center' }}>
					<Text style={[styles.headingText, stylesGlobal.font]}>{headerText}</Text>
					<ModalDropdown
						dropdownStyle={{ height: 35 * 5 + 5 * 6, padding: 5, backgroundColor: '#ECEBE8', borderRadius: 3, borderColor: '#000000', borderWidth: 1 }}
						defaultIndex={this.state.selected_category_location}
						options={this.state.category_array}
						onSelect={(index) => {
							this.setState({
								selected_category_location: index
							})
						}}
						renderButton={() => {
							return (
								<View style={{ justifyContent: 'center', alignItems: 'center' }}>
									<Image style={[styles.ageIcon, { width: 30, height: 30, resizeMode: 'contain' }]} source={this.state.category_array[this.state.selected_category_location].icon_path} />
								</View>
							)
						}}
						renderRow={(item, index, highlighted) => {
							return (
								<View style={[styles.visibility_button, this.state.selected_category_location == index ? { backgroundColor: Colors.gold } : { backgroundColor: Colors.black }]}>
									<Image style={{ width: 20, height: 20, marginLeft: 8 }} resizeMode={'contain'} source={item.icon_path} />
									<Text style={[styles.visibility_text, stylesGlobal.font, { marginLeft: 5 }]}>{item.label}</Text>
								</View>
							)
						}}
					/>
				</View>
				{this.getGoogleAutoCompleteView()}
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
		navigator.geolocation = require('@react-native-community/geolocation');
		return <View style={{ width: '100%', flexDirection: 'row', borderWidth: 1, borderColor: Colors.black, borderRadius: 5, overflow: 'hidden', marginTop: 5 }}>
			<GooglePlacesAutocomplete
				ref={(instance) => { this.locationRef = instance }}
				placeholder=''
				minLength={3} // minimum length of text to search
				autoFocus={false}
				fetchDetails={false}
				returnKeyType={'done'}
				value={this.state.valueLocation}
				getDefaultValue={() => this.state.valueLocation}
				listViewDisplayed={false}  // true/false/undefined
				renderDescription={(row) => row.description}
				onPress={(data, details) => {
					this.onGeoCodeSearchFunc(data.description)
				}}
				onSubmitEditing={() => {
					this.onGeoCodeSearchFunc(location);
				}}
				query={query}
				styles={{
					textInputContainer: {
						flex: 1,
						height: 40,
						backgroundColor: Colors.white,
					},
					textInput: [{
						marginLeft: 0,
						marginRight: 0,
						paddingLeft: 5,
						marginTop: 0,
						height: 40,
						backgroundColor: Colors.transparent,
						color: Colors.black,
						fontSize: 13,
					}, stylesGlobal.font],
					container: {
						backgroundColor: Colors.white,
					},
					predefinedPlacesDescription: [{
						color: Colors.black,
						fontSize: 13,
					}, stylesGlobal.font],
					description: [{ fontSize: 13, }, stylesGlobal.font]
				}}
				currentLocation={false}
				currentLocationLabel="Current location"
				nearbyPlacesAPI="GooglePlacesSearch"
				keyboardShouldPersistTaps="always"
				keepResultsAfterBlur={true}
				textInputProps={{
					onChangeText: (text) => {
						location = text;
					}
				}}
			/>
		</View>
	};

	/**
	 * get google place data of selected place
	 */
	onGeoCodeSearchFunc = (data) => {

		Geocoder.geocodeAddress(data).then(res => {

			this.setState({
				locationInfo: res,
				valueLocation: data,
				loading: false
			}, () => {
				location = data
				if (res.length > 0 && res[0] != undefined) {
					this.locationRef.setAddressText(res[0].formattedAddress);
				}
			})
		}).catch(err => {
			this.setState({
				valueLocation: data,
				loading: false
			}, () => {
				location = data
			})
		})
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

		return (
			<View style={[{ marginTop: 9, minHeight: 65, backgroundColor: Colors.white, zIndex: 10 }]}>
				<View style={{ width: '100%', flexDirection: 'row', alignItems: 'center' }}>
					<Text style={[styles.headingText, stylesGlobal.font]}>{headerText}</Text>
					<Image style={{ width: 30, height: 30 }} resizeMode={'contain'} source={require('../icons/publicVisibility_greyscale.png')} />
				</View>
				<View style={{ width: '100%', borderWidth: 1, borderColor: Colors.black, borderRadius: 4, marginTop: 10, }}>
					<View style={{ width: '100%', padding: 5, paddingBottom: 0, flexDirection: 'row', flexWrap: 'wrap' }}>
						{
							this.state.selectedLanguageList.map((item, index) =>
								<View key={index} style={{ marginRight: 10, borderColor: Colors.black, borderWidth: 1, flexDirection: 'row', alignItems: 'center', borderColor: 'gray', borderRadius: 4, padding: 3, marginBottom: 3 }}>
									<Text style={[{ marginHorizontal: 5, }, stylesGlobal.font]}>{item}</Text>
									<TouchableOpacity onPress={() => {
										const { selectedLanguageList } = this.state;
										// const index_remove = selectedLanguageList.indexOf(selectedLanguageList[index]);
										selectedLanguageList.splice(index, 1)
										this.setState({ selectedLanguageList });
										console.log(selectedLanguageList)
									}}>
										<Icon size={20} color='gray' name="x" />
									</TouchableOpacity>
								</View>
							)
						}
					</View>

					<AutoComplete
						autoCorrect={false}
						containerStyle={{
							zIndex: 20
						}}
						inputContainerStyle={{
							borderWidth: 0,
							paddingLeft: 5
						}}

						data={query === '' ? [] : data}
						defaultValue={query}
						renderTextInput={() => (
							<TextInput style={[{ color: Colors.black, fontSize: 13, paddingTop: 5, paddingBottom: 5 }, stylesGlobal.font]} placeholder={'Type Languages here.'} onChangeText={text => this.setState({ query: text })}>{this.state.query}</TextInput>
						)}
						listStyle={{ height: 150, borderWidth: 0, backgroundColor: 'transparent' }}
						keyExtractor={(item, index) => index}
						renderItem={({ item, index }) => (
							<TouchableOpacity key={index} style={{ backgroundColor: Colors.black, paddingTop: 5, paddingBottom: 5 }}
								onPress={() => {
									const { selectedLanguageList } = this.state;
									selectedLanguageList.push(item.value);
									this.setState({ query: '', selectedLanguageList });
								}} >
								<Text style={[{ color: Colors.white, fontSize: 13, paddingTop: 5 }, stylesGlobal.font]}>
									{item.value}
								</Text>
							</TouchableOpacity>
						)}
					/>
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
		const { selectedLanguageList } = this.state;
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
			if (!map.has(item.value)) {
				map.set(item.value, true);    // set any value to Map
				result.push(item);
			}
		}

		return result
	}
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		paddingBottom: 10,
		backgroundColor: Colors.black,
		alignItems: 'center'
	},
	avatarView: {
		marginTop: 9,
		marginBottom: 20,
	},
	headView: {
		marginTop: 9,
		marginBottom: 20,
		height: 65
	},
	headingText: {
		width: '90%',
		color: Colors.black,
		fontWeight: 'bold',
		backgroundColor: Colors.transparent,
		fontSize: 14,
	},
	bottomView: {
		backgroundColor: Colors.gray,
		height: 1,
	},
	textInputText: {
		color: Colors.yellow,
		marginTop: 3,
		padding: 2,
		paddingHorizontal: 10,
		justifyContent: 'center',
		backgroundColor: Colors.white,
		textAlignVertical: "center",
		fontSize: 13,
		height: 40,
		borderColor: Colors.black,
		borderWidth: 1,
		borderRadius: 4
	},
	TextLabelContainerStyle: {
		flexDirection: 'row',
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
	menu_button: {
		marginTop: 2,
		borderColor: '#000000',
		borderWidth: 1,
		borderRadius: 4,
		padding: 2,
		paddingHorizontal: 10,
		height: 40,
		justifyContent: 'center',
		textAlignVertical: 'center'
	}
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
		fontFamily: 'raleway',
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
		fontFamily: 'raleway',
	},
});
