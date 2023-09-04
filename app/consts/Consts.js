import React from "react";

export default class Consts {
  static API_URLS = {
    GOOGLE_PHOTO_API_BASE: "https://maps.googleapis.com/maps/api/place/photo?",
    GOOGLE_SEARCH_API_BASE:
      "https://maps.googleapis.com/maps/api/place/details/json?",
    FACEBOOK_URL: {
      parameters: {
        fields: {
          string:
            "email,name,picture.redirect(false).type(large),location,hometown,friends.limit(5000)"
        }
      }
    }
  };

  static BACKEND = {
    GET_PEOPLE_URL: Consts.BACKEND_BASE,
    CLIENT_KEY: "d2VidWk6d2VidWlzZWNyZXQ=",
    OAUTH_ACCESS_TOKEN:
      Consts.BACKEND_BASE +
      "oauth/token?username=top7backendadmin&password=inno@top7backendadmin&grant_type=password",

    SYNC_USER_INFO: Consts.BACKEND_BASE + "api/syncuserinfo",
    UPDATE_USER_INFO: Consts.BACKEND_BASE + "api/updateuser",
    GET_ALL_CITY: Consts.BACKEND_BASE + "api/getallcity",
    LEADERBOARD: Consts.BACKEND_BASE + "api/leaderBoard",
    FRIENDS_RANK: Consts.BACKEND_BASE + "api/friendsrank",
    PLACE_DETAILS: Consts.BACKEND_BASE + "api/getplacedetails"
  };

  static GUEST_USER = {
    isGuest: "true",
    id: "guestUser",
    name: "Guest User",
    picture: {
      data: {
        is_silhouette: true,
        url:
          "https://scontent.xx.fbcdn.net/v/t1.0-1/s200x200/10354686_10150004552801856_220367501106153455_n.jpg?oh=8eba33d5cd9b44273f78c1511e2d6359&oe=59D7DD50"
      }
    },
    status: null,
    city: null,
    gender: null,
    dateOfBirth: null,
    lists: null,
    friendsList: null,
    expert: false
  };

  /**
   * This little function returns just the 'th' string :P
   *
   */
  static getTHString = number => {
    switch (number) {
      case 1:
        return "st";
        break;
      case 2:
        return "nd";
        break;
      case 3:
        return "rd";
        break;
      default:
        return "th";
        break;
    }
  };

}
