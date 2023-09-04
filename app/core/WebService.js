import { Constants } from "../consts/Constants";
import * as Global from "../consts/Global";
import axios from "axios/index";

export default class WebService {
    // Static Common Method to Call POST Web Services
    //  "Content-Type": "multipart/form-data"
    static getPlaceDetails = (address, callBackFunction) => {
        // fetch('https://maps.googleapis.com/maps/api/geocode/json?address=' + address + '&key=AIzaSyBMglXHgoZYBU_eZQy90pHX7K2VgDbzWqw')
        fetch('https://maps.googleapis.com/maps/api/geocode/json?address=' + address + '&key=' + Global.GOOGLE_MAP_KEY)
            .then((response) => response.json())
            .then((responseJson) => {
                // console.log(' ADDRESS GEOCODE is responseJson!! => ' + JSON.stringify(responseJson));
                if (responseJson.results != undefined && responseJson.results != null && responseJson.results.length) {
                    let result = responseJson.results[0];
                    let position =
                    {
                        lat: result.geometry.location.lat,
                        lng: result.geometry.location.lng
                    }
                    let countryCode = "";
                    let country = "";
                    let adminArea = "";
                    let locality = "";
                    let postalCode = "";
                    let address_components = result.address_components;
                    address_components.map((item, j) => {
                        if (item.types.indexOf("country") != -1) {
                            countryCode = item.short_name;
                            country = item.long_name;
                        }
                        if (item.types.indexOf("postal_code") != -1) {
                            postalCode = item.long_name;
                        }
                        if (item.types.indexOf("administrative_area_level_1") != -1) {
                            adminArea = item.long_name;
                        }

                        if (item.types.indexOf("locality") != -1) {
                            locality = item.long_name;
                        }

                    })
                    let place = [];
                    place.push({
                        position: position,
                        countryCode: countryCode,
                        country: country,
                        adminArea: adminArea,
                        locality: locality,
                        postalCode: postalCode
                    })
                    callBackFunction(place, false);
                } else {
                    // console.log('ANo data found => ');
                    callBackFunction(Constants.DATA_UNDEFINDED, false);
                }
            }).catch(error => {
                if (error.message == Constants.ERROR_NETWORK_REQUEST_FAILED) {
                    //callBackFunction(Constants.NO_INTERNET, true);
                    callBackFunction(Constants.NO_INTERNET2, true);
                } else if (error.message == Constants.AUTHENTICATE_ERROR) {
                    //callBackFunction(Constants.NO_INTERNET, true);
                    callBackFunction(Constants.ERROR_401, true);
                } else if (error.message == Constants.INTERNAL_ERROR) {
                    //callBackFunction(Constants.NO_INTERNET, true);
                    callBackFunction(Constants.ERROR_5xx, true);
                } else {
                    callBackFunction(error, true);
                }
            }).done();
    };

    static callServicePostWithFormData = (URL, apiBody, callBackFunction) => {
        // console.log(">>>URL", URL, apiBody)
        fetch(URL, {
            method: "POST",
            headers: {
                "Content-Type": "multipart/form-data",
                'Accept': 'application/json'
            },
            body: apiBody,
        })
            .then(response => {
                console.log('responseData>>', "responseData success", response);
                return response.json();
            })
            .then(responseData => {
                console.log('responseData>>', "responseData success");
                //console.log('responseData>>', responseData);
                callBackFunction(responseData, responseData.isError);
            })
            .catch(error => {
                console.log("URL:" + URL + ": callServicePostWithFormData :", error);
                if (error.message == Constants.ERROR_COMETCHAT_LOGOUT) {
                    callBackFunction(Constants.ERROR_MESSAGE_COMETCHAT_LOGOUT, true);
                } else if (error.message == Constants.AUTHENTICATE_ERROR) {
                    //callBackFunction(Constants.NO_INTERNET, true);
                    callBackFunction(Constants.ERROR_401, true);
                } else if (error.message == Constants.INTERNAL_ERROR) {
                    //callBackFunction(Constants.NO_INTERNET, true);
                    callBackFunction(Constants.ERROR_5xx, true);
                } else if (error.message == Constants.ERROR_NETWORK_REQUEST_FAILED) {
                    //callBackFunction(Constants.NO_INTERNET, true);
                    callBackFunction(Constants.NO_INTERNET2, true);
                } else if (typeof error == String(undefined)) {
                    callBackFunction(Constants.DATA_UNDEFINDED, true);
                } else {
                    callBackFunction(error, true);
                }
            });
    }

    static callServicePostWithBodyData = (URL, apiBody, callBackFunction) => {

        fetch(URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(apiBody)
        })
            .then(response => {
                return response.json();
            })
            .then(responseData => {
                callBackFunction(responseData, responseData.isError);
            })
            .catch(error => {
                console.log("URL:" + URL + ": callServicePostWithBodyData :", error);
                if (error.message == Constants.ERROR_COMETCHAT_LOGOUT) {
                    callBackFunction(Constants.ERROR_MESSAGE_COMETCHAT_LOGOUT, true);
                } else if (error.message == Constants.AUTHENTICATE_ERROR) {
                    //callBackFunction(Constants.NO_INTERNET, true);
                    callBackFunction(Constants.ERROR_401, true);
                } else if (error.message == Constants.INTERNAL_ERROR) {
                    //callBackFunction(Constants.NO_INTERNET, true);
                    callBackFunction(Constants.ERROR_5xx, true);
                } else if (error.message == Constants.ERROR_NETWORK_REQUEST_FAILED) {
                    //callBackFunction(Constants.NO_INTERNET, true);
                    callBackFunction(Constants.NO_INTERNET2, true);
                } else if (typeof error == String(undefined)) {
                    callBackFunction(Constants.DATA_UNDEFINDED, true);
                } else {
                    callBackFunction(error, true);
                }
            });
    }

    static callServiceGet = (URL, callBackFunction) => {
        fetch(URL, {
            method: "GET",
        })
            .then(response => {
                return response.json();
            })
            .then(responseData => {
                console.log('responseData>>',responseData);
                callBackFunction(responseData, responseData.isError);
            })
            .catch(error => {
                console.log("URL:" + URL + ": callServiceGet error :" + error.message);
                if (error.message == Constants.ERROR_COMETCHAT_LOGOUT) {
                    callBackFunction(Constants.ERROR_MESSAGE_COMETCHAT_LOGOUT, true);
                } else if (error.message == Constants.AUTHENTICATE_ERROR) {
                    //callBackFunction(Constants.NO_INTERNET, true);
                    callBackFunction(Constants.ERROR_401, true);
                } else if (error.message == Constants.INTERNAL_ERROR) {
                    //callBackFunction(Constants.NO_INTERNET, true);
                    callBackFunction(Constants.ERROR_5xx, true);
                } else if (error.message == Constants.ERROR_NETWORK_REQUEST_FAILED) {
                    //callBackFunction(Constants.NO_INTERNET, true);
                    callBackFunction(Constants.NO_INTERNET2, true);
                } else if (typeof error == String(undefined)) {
                    callBackFunction(Constants.DATA_UNDEFINDED, true);
                } else {
                    callBackFunction(error, true);
                }
            });
    };

    //  "Content-Type": "multipart/form-data"
    static callServicePost = (URL, apiBody, callBackFunction) => {



        fetch(URL, {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json"
            },
           body: JSON.stringify(apiBody)
        })
        .then(response => {
            return response.text();
        })
        .then(responseData => {

            try {
                let tmpJson = JSON.parse(responseData);
                console.log('responseData>>>>>>>>>>>>>', URL, "responseData success");
                // console.log('responseData>>', responseData);
                callBackFunction(tmpJson, responseData.isError);
            } catch(e){
                console.log('callServicePost error in parsing json = ', e, responseData);
                callBackFunction(e.message, true);
            }
            
        })
        .catch(error => {
            console.log("URL:" + URL + ": callServicePost error :", error, error.message);
            if (error.message == Constants.ERROR_COMETCHAT_LOGOUT) {
                callBackFunction(Constants.ERROR_MESSAGE_COMETCHAT_LOGOUT, true);
            } else if (error.message == Constants.AUTHENTICATE_ERROR) {
                //callBackFunction(Constants.NO_INTERNET, true);
                callBackFunction(Constants.ERROR_401, true);
            } else if (error.message == Constants.INTERNAL_ERROR) {
                //callBackFunction(Constants.NO_INTERNET, true);
                callBackFunction(Constants.ERROR_5xx, true);
            } else if (error.message == Constants.ERROR_NETWORK_REQUEST_FAILED) {
                //callBackFunction(Constants.NO_INTERNET, true);
                callBackFunction(Constants.NO_INTERNET2, true);
            } else if (typeof error == String(undefined)) {
                callBackFunction(Constants.DATA_UNDEFINDED, true);
            } else {
                callBackFunction(error.message, true);
            }
        });
    };

    //  "Content-Type": "multipart/form-data"
    static callServicePostFormData = (URL, apiBody, callBackFunction) => {
        fetch(URL, {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "multipart/form-data"
            },
            body: (apiBody)
        })
            .then(response => {
                return response.json();
            })
            .then(responseData => {
                console.log('responseData>>', "responseData success");
                // console.log('responseData>>', responseData);
                callBackFunction(responseData, responseData.isError);
            })
            .catch(error => {
                console.log("URL:" + URL + ": callServicePostFormData :", error);
                if (error.message == Constants.ERROR_COMETCHAT_LOGOUT) {
                    callBackFunction(Constants.ERROR_MESSAGE_COMETCHAT_LOGOUT, true);
                } else if (error.message == Constants.AUTHENTICATE_ERROR) {
                    //callBackFunction(Constants.NO_INTERNET, true);
                    callBackFunction(Constants.ERROR_401, true);
                } else if (error.message == Constants.INTERNAL_ERROR) {
                    //callBackFunction(Constants.NO_INTERNET, true);
                    callBackFunction(Constants.ERROR_5xx, true);
                } else if (error.message == Constants.ERROR_NETWORK_REQUEST_FAILED) {
                    callBackFunction(Constants.NO_INTERNET2, true);
                    //callBackFunction(Constants.NO_INTERNET, true);
                } else if (typeof error == String(undefined)) {
                    callBackFunction(Constants.DATA_UNDEFINDED, true);
                } else {
                    callBackFunction(error, true);
                }
            });
    };

    static callCommentPost = (URL, apiBody, callBackFunction) => {
        const data = apiBody['_parts'];
        fetch(URL, {
            method: "POST",
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "token": data[0][1],
                "user_id": data[1][1],
                "format": "json",
                "comment": data[3][1]
            })
        })
            .then(response => {
                return response.json();
            })
            .then(responseData => {
                console.log('responseData>>', "responseData success");
                // console.log('responseData>>', responseData);
                callBackFunction(responseData, responseData.isError);
            })
            .catch(error => {
                console.log("URL:" + URL + ":callCommentPost:", error);
                if (error.message == Constants.ERROR_COMETCHAT_LOGOUT) {
                    callBackFunction(Constants.ERROR_MESSAGE_COMETCHAT_LOGOUT, true);
                } else if (error.message == Constants.AUTHENTICATE_ERROR) {
                    //callBackFunction(Constants.NO_INTERNET, true);
                    callBackFunction(Constants.ERROR_401, true);
                } else if (error.message == Constants.INTERNAL_ERROR) {
                    //callBackFunction(Constants.NO_INTERNET, true);
                    callBackFunction(Constants.ERROR_5xx, true);
                } else if (error.message == Constants.ERROR_NETWORK_REQUEST_FAILED) {
                    //callBackFunction(Constants.NO_INTERNET, true);
                    callBackFunction(Constants.NO_INTERNET2, true);
                } else if (typeof error == String(undefined)) {
                    callBackFunction(Constants.DATA_UNDEFINDED, true);
                } else {
                    callBackFunction(error, true);
                }
            });
    };

    static callChatUserServicePost = async (URL, apiBody) => {
        return fetch(URL, {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json"
            },
            body: JSON.stringify(apiBody)
        })
            .then(response => {
                return response.json();
            })
            .catch(error => {
                console.log(" URS : ", URL, " callChatUserServicePost : ", error);
                if (error.message === Constants.ERROR_COMETCHAT_LOGOUT) {
                    callBackFunction(Constants.ERROR_MESSAGE_COMETCHAT_LOGOUT, true);
                } else if (error.message == Constants.AUTHENTICATE_ERROR) {
                    //callBackFunction(Constants.NO_INTERNET, true);
                    callBackFunction(Constants.ERROR_401, true);
                } else if (error.message == Constants.INTERNAL_ERROR) {
                    //callBackFunction(Constants.NO_INTERNET, true);
                    callBackFunction(Constants.ERROR_5xx, true);
                } else if (error.message === Constants.ERROR_NETWORK_REQUEST_FAILED) {
                    //callBackFunction(Constants.NO_INTERNET, true);
                    callBackFunction(Constants.NO_INTERNET2, true);
                } else if (typeof error === String(undefined) || error.startsWith("SyntaxError")) {
                    callBackFunction(Constants.DATA_UNDEFINDED, true);
                } else {
                    callBackFunction(error, true);
                }
                return {};
            });
    };

    static callCometChatServicePost = (URL, apiBody, callBackFunction) => {

        fetch(URL, {
            method: "POST",
            headers: {
                Accept: "application/json",
            },
            body: apiBody
        })
            .then(response => {
                // console.log("WEBCALL URL " + URL);
                if (response.status == 200) {
                    // console.log("WEBCALL condition 1 ");
                    return {
                        response: response._bodyText,
                        isError: false
                    };
                } else {
                    // console.log("WEBCALL condition 2 ");
                    return {
                        response: response.toString(),
                        isError: true
                    };
                }
            })
            .then(responseData => {
                // console.log("WEBCALL condition 3 ");
                //{"logout":1,"loggedout":1}
                callBackFunction(responseData.response, responseData.isError);
            })
            .catch(error => {
                // console.log("WEBCALL condition 4");
                // console.log("WEBCALL Error " + error);
                // console.log("WEBCALL Error name " + error.name);
                // console.log("WEBCALL Error message " + error.message);
                //Cannot read property 'logout' of undefined
                if (error.message === Constants.ERROR_COMETCHAT_LOGOUT) {
                    callBackFunction(Constants.ERROR_MESSAGE_COMETCHAT_LOGOUT, true);
                } else if (error.message == Constants.AUTHENTICATE_ERROR) {
                    //callBackFunction(Constants.NO_INTERNET, true);
                    callBackFunction(Constants.ERROR_401, true);
                } else if (error.message == Constants.INTERNAL_ERROR) {
                    //callBackFunction(Constants.NO_INTERNET, true);
                    callBackFunction(Constants.ERROR_5xx, true);
                } else if (error.message === Constants.ERROR_NETWORK_REQUEST_FAILED) {
                    //callBackFunction(Constants.NO_INTERNET, true);
                    callBackFunction(Constants.NO_INTERNET2, true);
                } else if (typeof error === String(undefined) || error.startsWith("SyntaxError")) {
                    callBackFunction(Constants.DATA_UNDEFINDED, true);
                } else {
                    callBackFunction(error, true);
                }
            })
            .done();
    };

    static apiCallRequestAddTag = (URL, apiBody, callBackFunction) => {

        axios.post(URL, apiBody, {
            headers: {
                Accept: "application/json",
            }
        }, timeout = 10000).then(response => {
            //   console.log("ApiCallRequestAddTag Success" + JSON.stringify(response.data) + response.status)
            if (response.status === 200)
                callBackFunction(response.data, false);
            else
                callBackFunction(response.data, true);
        }).catch(error => {
            console.log("URL", URL, " apiCallRequestAddTag Error :", error)
            if (error.response.status === 401) {
                callBackFunction(error, true);
            } else if (error.message == Constants.AUTHENTICATE_ERROR) {
                //callBackFunction(Constants.NO_INTERNET, true);
                callBackFunction(Constants.ERROR_401, true);
            } else if (error.message == Constants.INTERNAL_ERROR) {
                //callBackFunction(Constants.NO_INTERNET, true);
                callBackFunction(Constants.ERROR_5xx, true);
            } else if (!error.status) {
                callBackFunction(error, true);
            } else if (error.response !== undefined || error.response !== null) {
                callBackFunction(error, true);
            } else {
                callBackFunction(error, true);
            }
        });
    }

    static apiCallGeneralPost = async (URL, apiBody) => {
        try {
            return await fetch(URL, {
                method: "POST",
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                }
            })
                .then(res => res.json())
                .then((resJSON) => {
                    console.log(" apiCallGeneralPost ", URL, " response : ", JSON.stringify(resJSON));
                    return resJSON;
                })
                .catch((error) => {
                    console.log(" apiCallGeneralPost ", URL, " error : ", error);
                    return false
                })
        } catch (error) {
            if (error.message === Constants.ERROR_COMETCHAT_LOGOUT) {
                    callBackFunction(Constants.ERROR_MESSAGE_COMETCHAT_LOGOUT, true);
                } else if (error.message == Constants.AUTHENTICATE_ERROR) {
                    //callBackFunction(Constants.NO_INTERNET, true);
                    callBackFunction(Constants.ERROR_401, true);
                } else if (error.message == Constants.INTERNAL_ERROR) {
                    //callBackFunction(Constants.NO_INTERNET, true);
                    callBackFunction(Constants.ERROR_5xx, true);
                } else if (error.message === Constants.ERROR_NETWORK_REQUEST_FAILED) {
                    //callBackFunction(Constants.NO_INTERNET, true);
                    callBackFunction(Constants.NO_INTERNET2, true);
                } else if (typeof error === String(undefined) || error.startsWith("SyntaxError")) {
                    callBackFunction(Constants.DATA_UNDEFINDED, true);
                } else {
                    callBackFunction(error, true);
                }
        }
    }
}
