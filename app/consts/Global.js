import { Platform } from 'react-native';
// export const BASE_URL = "https://www.007percent.com/";
// export const MD5_BASE_URL = "www.007percent.com/cometchat/";
// export const BASE_URL_DEV = "https://old-dev.007percent.com/";
// export const MD5_BASE_URL_DEV = "www.dev.007percent.com/cometchat/";
export const itemSkus = Platform.select({
    ios: [
        'com.007.007PercentApp.membershipgenerous',
        'com.007.007PercentApp.membershipconnector',
        'com.007.007PercentApp.membershipvipfan'
    ],
    android: [
        ''
    ]
});

export const APPSTORE_URL = "https://apps.apple.com/app/0-07/id1302071480";
export const BASE_URL = "https://api.007percent.com/api/";
//"http://192.168.0.149:3300/api/";//"https://api.007percent.com/api/";  //"http://192.168.0.149:3300/api/";//"https://api.007percent.com/api/";
// "https://api.007percent.com/api/";//"https://api.007percent.com/api/";//http://127.0.0.1:3300/api/
export const MD5_BASE_URL = "https://the007percent.com/cometchat/";
// export const BASE_URL_DEV = "https://dev.007percent.com/";
export const BASE_URL_DEV = "https://test.007percent.com/api/"; //"http://192.168.0.149:3300/api/";//"https://test.007percent.com/api/"; //"http://192.168.0.149:3300/api/"; //"https://test.007percent.com/api/";//"http://192.168.0.149:3300/api/";//"https://test.007percent.com/api/";//"http://127.0.0.1:3300/api/";//"http://192.168.1.10:3300/api/"
export const MD5_BASE_URL_DEV = "https://dev.007percent.com/cometchat/";

export const BASE_PAGE_URL = "https://www.007percent.com/";
export const BASE_PAGE_URL2 = "https//www.the007percent.com/";

export const PAYPAL_API = "https://api.sandbox.paypal.com/";
export const PAYPAL_API_SANDBOX = "https://api.sandbox.paypal.com/";
export const PAYPAL_CLIENTID = "AUOMOgukeSElVlv7CTIItKkh9PJeBY7amrgdGQZv9NfBHt6Ty0xMSVmRlpjsMmwdJZdpr9gR2-JgOqkJ";
export const PAYPAL_CLIENTID_SANDBOX = "AUOMOgukeSElVlv7CTIItKkh9PJeBY7amrgdGQZv9NfBHt6Ty0xMSVmRlpjsMmwdJZdpr9gR2-JgOqkJ";
export const PAYPAL_SECRETEKEY = "EDtUsbBAUxcSlElmb_urqX7ihujvNHFkjOwKqurWlCprSBZff_PR10mqi760pSLPeg-0zPAEsk42NVo6";
export const PAYPAL_SECRETEKEY_SANDBOX = "EDtUsbBAUxcSlElmb_urqX7ihujvNHFkjOwKqurWlCprSBZff_PR10mqi760pSLPeg-0zPAEsk42NVo6";
export const PAYPAL_REDIRECT_URL = "https://007percent.com/paypal"

export const URL_PROFILE_TYPES = BASE_URL + "register";
export const URL_PROFILE_TYPES_DEV = BASE_URL_DEV + "register";
//export const TERMS_AND_CONDITIONS_URL = BASE_PAGE_URL + "page/disclaimers";
export const TERMS_AND_CONDITIONS_URL = "https://www.the007percent.com/page/disclaimers";
export const ABOUTUS_URL = "https://www.the007percent.com/page/about-007";
export const URL_LOGIN = BASE_URL + "login";
export const URL_REGISTERTYPE = BASE_URL + 'register?type=2';
export const URL_REGISTER = BASE_URL + 'signup';
export const URL_FORGOTPASSWORD = BASE_URL + 'forgot-password';
export const URL_MY_PROFILE_DETAIL = BASE_URL + "profile/";
export const URL_EVENT_DETAIL = BASE_URL + "event/view/";
export const URL_EVENT_CANCEL = BASE_URL + "event-cancel/";
export const URL_EVENT_REMOVE = BASE_URL + "remove-event/";
export const URL_EVENT_JOIN = BASE_URL + "event/add-attend";
export const URL_EVENT_RSVP = BASE_URL + "event-rsvp";
export const URL_GENERATE_QR_CODE = BASE_URL + "generate-qr-code/";
export const URL_ADD_EVENT_COMMENT = BASE_URL + "event-discussion/add/";
export const URL_ACCEPT_REJECT = BASE_URL + "connection/action";
export const URL_CONNECT_REQUEST = BASE_URL + "connect-request";
export const URL_FILTER_OPTION = BASE_URL + "search?";
export const URL_RECENT_CHAT = BASE_URL + "messages";
export const URL_GET_MESSAGE = BASE_URL + "get/message";
export const URL_ADD_MESSAGE = BASE_URL + "message/add";
export const URL_GET_CHATLIST = BASE_URL + "get-user-chatlist";
export const URL_INVITE_USER = BASE_URL + "refer-friends";
export const URL_INVITEE_NON_MEMBER = BASE_URL + "send-email-sms"

export const TERMS_AND_CONDITIONS_URL_DEV = BASE_URL_DEV + "page/disclaimers";
export const URL_LOGIN_DEV = BASE_URL_DEV + "login";
export const URL_REGISTERTYPE_DEV = BASE_URL_DEV + 'register?type=2';
export const URL_REGISTER_DEV = BASE_URL_DEV + 'signup';
export const URL_FORGOTPASSWORD_DEV = BASE_URL_DEV + 'forgot-password';
export const URL_MY_PROFILE_DETAIL_DEV = BASE_URL_DEV + "profile/";
export const URL_EVENT_DETAIL_DEV = BASE_URL_DEV + "event/view/";
export const URL_EVENT_CANCEL_DEV = BASE_URL_DEV + "event-cancel/";
export const URL_EVENT_REMOVE_DEV = BASE_URL_DEV + "remove-event/";
export const URL_EVENT_JOIN_DEV = BASE_URL_DEV + "event/add-attend";
export const URL_EVENT_RSVP_DEV = BASE_URL_DEV + "event-rsvp";
export const URL_GENERATE_QR_CODE_DEV = BASE_URL_DEV + "generate-qr-code/";
export const URL_ADD_EVENT_COMMENT_DEV = BASE_URL_DEV + "event-discussion/add/";
export const URL_ACCEPT_REJECT_DEV = BASE_URL_DEV + "connection/action";
export const URL_CONNECT_REQUEST_DEV = BASE_URL_DEV + "connect-request";
export const URL_FILTER_OPTION_DEV = BASE_URL_DEV + "search?";
export const URL_RECENT_CHAT_DEV = BASE_URL_DEV + "messages";
export const URL_GET_MESSAGE_DEV = BASE_URL_DEV + "get/message";
export const URL_ADD_MESSAGE_DEV = BASE_URL_DEV + "message/add";
export const URL_GET_CHATLIST_DEV = BASE_URL_DEV + "get-user-chatlist";
export const URL_INVITE_USER_DEV = BASE_URL_DEV + "refer-friends";
export const URL_INVITEE_NON_MEMBER_DEV = BASE_URL_DEV + "send-email-sms"

//TODO provide block user end point
export const URL_GET_BLOCKUSER = BASE_URL + "";
export const URL_ADD_ATTACHMENT = BASE_URL + "message/attachment";
export const URL_GET_STICKER = BASE_URL + "get/stiker";
export const URL_GET_PROFILE_INFO = BASE_URL + "profile-info";
export const URL_SEND_EVENT_INVITATION = BASE_URL + "event-invite-user";

export const URL_SEND_EVENT_IMPORT = BASE_URL + "event-import-user";
export const URL_SEND_EVENT_IMPORT_DEV = BASE_URL_DEV + "event-import-user";

export const URL_SEND_EMAIL_OTP = BASE_URL + "sendotp";
export const URL_SEND_EMAIL_OTP_DEV = BASE_URL_DEV + "sendotp";


export const URL_CREATE_EVENT = BASE_URL + "create/event";
export const URL_EDIT_EVENT = BASE_URL + "edit/event/";
export const URL_CREATE_TRAVEL = BASE_URL + "create/travel";
export const URL_EDIT_TRAVEL = BASE_URL + "edit/event/";
export const URL_ADD_SUCCESS = BASE_URL + "add-success";
export const URL_ADD_SCHEDULE = BASE_URL + "add-schedule";
export const URL_EDIT_SCHEDULE = BASE_URL + "update-schedule";
export const URL_DELETE_SCHEDULE = BASE_URL + "delete-schedule";
export const URL_GET_SUCCESS = BASE_URL + "success";
export const URL_DELETE_SUCCESS_TIMELINE = BASE_URL + "delete-success";
export const URL_UPDATE_SUCCESS = BASE_URL + "update-success";
export const URL_GET_ALBUM = BASE_URL + "albums";
export const URL_ADD_ALBUMS = BASE_URL + "add-album";
export const URL_DELETE_ALBUMS = BASE_URL + "delete-album";
export const URL_UPDATE_ALBUMS = BASE_URL + "update-album";
export const URL_UPLOAD_ALBUM_IMAGE = BASE_URL + "upload-album-images";
export const URL_GET_ALBUM_IMAGE = BASE_URL + "album/";
export const URL_INVITE_USER_TO_EVENTS = BASE_URL + "ajax-invite-evnt-user";
export const URL_REMOVE_ALBUM_IMAGE = BASE_URL + "remove-album-image";
export const URL_SET_COVER_ALBUM_IMAGE = BASE_URL + "set-album-cover";
export const URL_VISIBILITY_ALBUM_IMAGE = BASE_URL + "album-file-visibility";
export const URL_UPLOAD_EVENT_IMAGE = BASE_URL + "upload-event-image";
export const URL_FAVOURITE_ACTION = BASE_URL + "favorite-action";
export const URL_REQUEST_ALBUMS = BASE_URL + "request-albums";
export const URL_REPORT_USERS = BASE_URL + "report";
export const URL_BLOCK_USERS = BASE_URL + "report-block";
export const URL_LIKE_FEED_TIME_LINE = BASE_URL + "dashboard/feedsLike";
export const URL_UNLIKE_FEED_TIME_LINE = BASE_URL + "dashboard/feedsUnlike";
export const URL_SHARE_FEED_TIME_LINE = BASE_URL + "front/MyActivities/shareActivity";
export const URL_GET_FEED_TIME_LINE_COMMENTS = BASE_URL + "front/MyActivities/getActivityComments";
export const URL_SEND_FEED_TIME_LINE_COMMENTS = BASE_URL + "dashboard/feedsComment";
export const URL_LIKE_FEED_TIME_LINE_COMMENTS = BASE_URL + "front/MyActivities/commentLike";
export const URL_UNLIKE_FEED_TIME_LINE_COMMENTS = BASE_URL + "front/MyActivities/commentUnlike";
export const URL_CHANGE_POST_VISIBILITY = BASE_URL + "activity-visibility";
export const URL_DELETE_POST = BASE_URL + "delete-post";
export const URL_UPLOAD_PROFILE_IMAGE = BASE_URL + "updateProfileImage";
export const URL_UPLOAD_PROFILE_IMAGE_App = BASE_URL + "updateProfileImageApp";
export const URL_UPLOAD_COVER_IMAGE = BASE_URL + "update-profile-background";
export const URL_UNFRIEND = BASE_URL + "connection/action";

export const URL_RECENT_CHAT_LIST = MD5_BASE_URL + "cometchat_receive.php"
export const URL_GROUP_CREATE = MD5_BASE_URL + "cometchat_receive.php?action=createchatroom&callback=";
export const URL_GROUP_BUDDY_LIST = MD5_BASE_URL + "cometchat_receive.php?callback=";
export const URL_GROUP_MEMBER = MD5_BASE_URL + "cometchat_receive.php?action=getchatroomusers&callback=";
export const URL_GROUP_MEMBER_ADD = MD5_BASE_URL + "modules/chatrooms/chatrooms.php?action=inviteusers&embed=mobileapp&basedata=";
export const URL_GROUP_DELETE = MD5_BASE_URL + "cometchat_receive.php?action=deletechatroom&callback=";
export const URL_GROUP_RENAME = MD5_BASE_URL + "modules/chatrooms/chatrooms.php?action=renamechatroom";
export const URL_GROUP_KICK_USER = MD5_BASE_URL + "cometchat_receive.php?action=kickUser&callback=";
export const URL_GROUP_MESSAGE_SEND = MD5_BASE_URL + "modules/chatrooms/chatrooms.php?action=sendmessage&callback=";
export const URL_GROUP_MESSAGE_DELETE = MD5_BASE_URL + "cometchat_receive.php?action=deleteChatroomMessage&callback=";
export const URL_GROUP_MESSAGE_LIST = MD5_BASE_URL + "cometchat_receive.php?action=updateChatroomMessages&callback=";
export const URL_SINGLE_MESSAGE_SEND = MD5_BASE_URL + "cometchat_send.php?callback=";
export const URL_SINGLE_STICKER_SEND = MD5_BASE_URL + "plugins/stickers/index.php?action=sendSticker&chatroommode=0&caller=&callback=";
export const URL_SINGLE_MESSAGE_LIST = MD5_BASE_URL + "cometchat_receive.php?callback=";
export const URL_COMETCHAT_RELOGIN = MD5_BASE_URL + "cometchat_receive.php?callback="



export const URL_GET_BLOCKUSER_DEV = BASE_URL_DEV + "";
export const URL_ADD_ATTACHMENT_DEV = BASE_URL_DEV + "message/attachment";
export const URL_GET_STICKER_DEV = BASE_URL_DEV + "get/stiker";
export const URL_GET_PROFILE_INFO_DEV = BASE_URL_DEV + "profile-info";
export const URL_SEND_EVENT_INVITATION_DEV = BASE_URL_DEV + "event-invite-user";

export const URL_CREATE_EVENT_DEV = BASE_URL_DEV + "create/event";
export const URL_EDIT_EVENT_DEV = BASE_URL_DEV + "edit/event/";
export const URL_CREATE_TRAVEL_DEV = BASE_URL_DEV + "create/travel";
export const URL_EDIT_TRAVEL_DEV = BASE_URL_DEV + "edit/event/";
export const URL_ADD_SUCCESS_DEV = BASE_URL_DEV + "add-success";
export const URL_ADD_SCHEDULE_DEV = BASE_URL_DEV + "add-schedule";
export const URL_EDIT_SCHEDULE_DEV = BASE_URL_DEV + "update-schedule";
export const URL_DELETE_SCHEDULE_DEV = BASE_URL_DEV + "delete-schedule";
export const URL_GET_SUCCESS_DEV = BASE_URL_DEV + "success";
export const URL_DELETE_SUCCESS_TIMELINE_DEV = BASE_URL_DEV + "delete-success";
export const URL_UPDATE_SUCCESS_DEV = BASE_URL_DEV + "update-success";
export const URL_GET_ALBUM_DEV = BASE_URL_DEV + "albums";
export const URL_ADD_ALBUMS_DEV = BASE_URL_DEV + "add-album";
export const URL_DELETE_ALBUMS_DEV = BASE_URL_DEV + "delete-album";
export const URL_UPDATE_ALBUMS_DEV = BASE_URL_DEV + "update-album";
export const URL_UPLOAD_ALBUM_IMAGE_DEV = BASE_URL_DEV + "upload-album-images";
export const URL_GET_ALBUM_IMAGE_DEV = BASE_URL_DEV + "album/";
export const URL_INVITE_USER_TO_EVENTS_DEV = BASE_URL_DEV + "ajax-invite-evnt-user";
export const URL_REMOVE_ALBUM_IMAGE_DEV = BASE_URL_DEV + "remove-album-image";
export const URL_SET_COVER_ALBUM_IMAGE_DEV = BASE_URL_DEV + "set-album-cover";
export const URL_VISIBILITY_ALBUM_IMAGE_DEV = BASE_URL_DEV + "album-file-visibility";
export const URL_UPLOAD_EVENT_IMAGE_DEV = BASE_URL_DEV + "upload-event-image";
export const URL_FAVOURITE_ACTION_DEV = BASE_URL_DEV + "favorite-action";
export const URL_REQUEST_ALBUMS_DEV = BASE_URL_DEV + "request-albums";
export const URL_REPORT_USERS_DEV = BASE_URL_DEV + "report";
export const URL_BLOCK_USERS_DEV = BASE_URL_DEV + "report-block";
export const URL_LIKE_FEED_TIME_LINE_DEV = BASE_URL_DEV + "dashboard/feedsLike";
export const URL_UNLIKE_FEED_TIME_LINE_DEV = BASE_URL_DEV + "dashboard/feedsUnlike";
export const URL_SHARE_FEED_TIME_LINE_DEV = BASE_URL_DEV + "front/MyActivities/shareActivity";
export const URL_GET_FEED_TIME_LINE_COMMENTS_DEV = BASE_URL_DEV + "front/MyActivities/getActivityComments";
export const URL_SEND_FEED_TIME_LINE_COMMENTS_DEV = BASE_URL_DEV + "dashboard/feedsComment";
export const URL_LIKE_FEED_TIME_LINE_COMMENTS_DEV = BASE_URL_DEV + "front/MyActivities/commentLike";
export const URL_UNLIKE_FEED_TIME_LINE_COMMENTS_DEV = BASE_URL_DEV + "front/MyActivities/commentUnlike";
export const URL_CHANGE_POST_VISIBILITY_DEV = BASE_URL_DEV + "activity-visibility";
export const URL_DELETE_POST_DEV = BASE_URL_DEV + "delete-post";
export const URL_UPLOAD_PROFILE_IMAGE_DEV = BASE_URL_DEV + "updateProfileImage";
export const URL_UPLOAD_PROFILE_IMAGE_DEV_App = BASE_URL_DEV + "updateProfileImageApp";
export const URL_UPLOAD_COVER_IMAGE_DEV = BASE_URL_DEV + "update-profile-background";
export const URL_UNFRIEND_DEV = BASE_URL_DEV + "connection/action";

export const URL_RECENT_CHAT_LIST_DEV = MD5_BASE_URL_DEV + "cometchat_receive.php"
export const URL_GROUP_CREATE_DEV = MD5_BASE_URL_DEV + "cometchat_receive.php?action=createchatroom&callback=";
export const URL_GROUP_BUDDY_LIST_DEV = MD5_BASE_URL_DEV + "cometchat_receive.php?callback=";
export const URL_GROUP_MEMBER_DEV = MD5_BASE_URL_DEV + "cometchat_receive.php?action=getchatroomusers&callback=";
export const URL_GROUP_MEMBER_ADD_DEV = MD5_BASE_URL_DEV + "modules/chatrooms/chatrooms.php?action=inviteusers&embed=mobileapp&basedata=";
export const URL_GROUP_DELETE_DEV = MD5_BASE_URL_DEV + "cometchat_receive.php?action=deletechatroom&callback=";
export const URL_GROUP_RENAME_DEV = MD5_BASE_URL_DEV + "modules/chatrooms/chatrooms.php?action=renamechatroom";
export const URL_GROUP_KICK_USER_DEV = MD5_BASE_URL_DEV + "cometchat_receive.php?action=kickUser&callback=";
export const URL_GROUP_MESSAGE_SEND_DEV = MD5_BASE_URL_DEV + "modules/chatrooms/chatrooms.php?action=sendmessage&callback=";
export const URL_GROUP_MESSAGE_DELETE_DEV = MD5_BASE_URL_DEV + "cometchat_receive.php?action=deleteChatroomMessage&callback=";
export const URL_GROUP_MESSAGE_LIST_DEV = MD5_BASE_URL_DEV + "cometchat_receive.php?action=updateChatroomMessages&callback=";
export const URL_SINGLE_MESSAGE_SEND_DEV = MD5_BASE_URL_DEV + "cometchat_send.php?callback=";
export const URL_SINGLE_STICKER_SEND_DEV = MD5_BASE_URL_DEV + "plugins/stickers/index.php?action=sendSticker&chatroommode=0&caller=&callback=";
export const URL_SINGLE_MESSAGE_LIST_DEV = MD5_BASE_URL_DEV + "cometchat_receive.php?callback=";
export const URL_COMETCHAT_RELOGIN_DEV = MD5_BASE_URL_DEV + "cometchat_receive.php?callback="

//pagination APIs
export const URL_MY_CONNECTION = BASE_URL + "ajax-connection/";
export const URL_SEARCH = BASE_URL + "search/filter/data/";
export const URL_EVENT_LIST = BASE_URL + "search/event-filter/data/";
export const URL_JOIN_EVENTS = BASE_URL + "ajax-invitation-event/";
export const URL_JOIN_TRAVEL = BASE_URL + "ajax-invitation-travel/";
export const URL_MY_EVENTS = BASE_URL + "ajax-my-events/";
export const URL_MY_TRAVEL = BASE_URL + "front/Event/ajaxMyTravel/";
export const URL_PAST_EVENTS = BASE_URL + "ajax-past-events/";
export const URL_OPEN_INVITATION = BASE_URL + "member-parties/";
export const URL_OPEN_TRAVEL = BASE_URL + "member-travel/";
export const URL_GUEST_LIST = BASE_URL + "ajax-waitlist/";
export const URL_GUEST_LIST_COUNT = BASE_URL + "attendance/event/";
export const URL_INVITE_SEARCH_USER = BASE_URL + "ajax-invite-search-user/";
export const URL_GET_TRAVEL_PLAN = BASE_URL + "ajax-schedule/";
export const URL_GET_FEEDS = BASE_URL + "get-feeds/";
export const URL_USER_ACTIVITIES = BASE_URL + "ajax-user-activities/";
export const URL_FRIEND_CONNECTION = BASE_URL + "ajax-connection/";
export const URL_MY_TIMELINE = BASE_URL + "ajax-my-activities/";
export const URL_MY_FAVORITE_LIST = BASE_URL + "get-favorite/"

export const URL_MY_CONNECTION_DEV = BASE_URL_DEV + "ajax-connection/";
export const URL_SEARCH_DEV = BASE_URL_DEV + "search/filter/data/";
export const URL_EVENT_LIST_DEV = BASE_URL_DEV + "search/event-filter/data/";
export const URL_JOIN_EVENTS_DEV = BASE_URL_DEV + "ajax-invitation-event/";
export const URL_JOIN_TRAVEL_DEV = BASE_URL_DEV + "ajax-invitation-travel/";
export const URL_MY_EVENTS_DEV = BASE_URL_DEV + "ajax-my-events/";
export const URL_MY_TRAVEL_DEV = BASE_URL_DEV + "front/Event/ajaxMyTravel/";
export const URL_PAST_EVENTS_DEV = BASE_URL_DEV + "ajax-past-events/";
export const URL_OPEN_INVITATION_DEV = BASE_URL_DEV + "member-parties/";
export const URL_OPEN_TRAVEL_DEV = BASE_URL_DEV + "member-travel/";
export const URL_GUEST_LIST_DEV = BASE_URL_DEV + "ajax-waitlist/";
export const URL_GUEST_LIST_COUNT_DEV = BASE_URL_DEV + "attendance/event/";
export const URL_INVITE_SEARCH_USER_DEV = BASE_URL_DEV + "ajax-invite-search-user/";
export const URL_GET_TRAVEL_PLAN_DEV = BASE_URL_DEV + "ajax-schedule/";
export const URL_GET_FEEDS_DEV = BASE_URL_DEV + "get-feeds/";
export const URL_USER_ACTIVITIES_DEV = BASE_URL_DEV + "ajax-user-activities/";
export const URL_FRIEND_CONNECTION_DEV = BASE_URL_DEV + "ajax-connection/";
export const URL_MY_TIMELINE_DEV = BASE_URL_DEV + "ajax-my-activities/";
export const URL_MY_FAVORITE_LIST_DEV = BASE_URL_DEV + "get-favorite/";

export const URL_HOST_INVITE_ACCEPT = BASE_URL + "ajax-invite-action/";
export const URL_HOST_INVITE_ACCEPT_DEV = BASE_URL_DEV + "ajax-invite-action/";
export const URL_HOST_INVITE_RESEND = BASE_URL + "ajax-invite-evnt-user/";
export const URL_HOST_INVITE_RESEND_DEV = BASE_URL_DEV + "ajax-invite-evnt-user/";
export const URL_GET_BIRTHDAY = BASE_URL + "get-birthday";
export const URL_GET_BIRTHDAY_DEV = BASE_URL_DEV + "get-birthday";
export const URL_SAVE_NOTES = BASE_URL + "save-connection-note/";
export const URL_SAVE_NOTES_DEV = BASE_URL_DEV + "save-connection-note/";
export const URL_PROFILE_RATING = BASE_URL + "add-profile-rating";
export const URL_PROFILE_RATING_DEV = BASE_URL_DEV + "add-profile-rating";
export const URL_GIFTS_CATEGORY = BASE_URL + "browse-category";
export const URL_GIFTS_CATEGORY_DEV = BASE_URL_DEV + "browse-category";
export const URL_GIFTS_LIST = BASE_URL + "ajax-virtual-product/";
export const URL_GIFTS_LIST_DEV = BASE_URL_DEV + "ajax-virtual-product/";
export const URL_GIFT_FAVORITE = BASE_URL + "wishlist-action";
export const URL_GIFT_FAVORITE_DEV = BASE_URL_DEV + "wishlist-action";
export const URL_GIFT_DETAIL = BASE_URL + "product/";
export const URL_GIFT_DETAIL_DEV = BASE_URL_DEV + "product/";
export const URL_SENDGIFT = BASE_URL + "send-product";
export const URL_SENDGIFT_DEV = BASE_URL_DEV + "send-product";
export const URL_BUYGIFT = BASE_URL + "checkout/";
export const URL_BUYGIFT_DEV = BASE_URL_DEV + "checkout/";
export const URL_RESENDINVITE_NOSIGNUP = BASE_URL + "ajax-nonmember-invite-evnt-user";
export const URL_RESENDINVITE_NOSIGNUP_DEV = BASE_URL_DEV + "ajax-nonmember-invite-evnt-user";
export const URL_DELETE_NONMEMBER = BASE_URL + "ajax-confirm-invite-action";
export const URL_DELETE_NONMEMBER_DEV = BASE_URL_DEV + "ajax-confirm-invite-action";
export const URL_SEEMORE_COMMENTS = BASE_URL + "get-comments/";
export const URL_SEEMORE_COMMENTS_DEV = BASE_URL_DEV + "get-comments/";
export const URL_REPLY_COMMENTS = BASE_URL + "event-discussion/reply/";
export const URL_REPLY_COMMENTS_DEV = BASE_URL_DEV + "event-discussion/reply/";
export const URL_DELETE_COMMENT = BASE_URL + "event-discussion/delete-reply/";
export const URL_DELETE_COMMENT_DEV = BASE_URL_DEV + "event-discussion/delete-reply/";
export const URL_GET_TRANSACTION_HISTORY = BASE_URL + "ajax-transaction-history/";
export const URL_GET_TRANSACTION_HISTORY_DEV = BASE_URL_DEV + "ajax-transaction-history/";
export const URL_UPDATE_PASSWORD = BASE_URL + "update-password";
export const URL_UPDATE_PASSWORD_DEV = BASE_URL_DEV + "update-password";
export const URL_GET_SAVEDCARDS = BASE_URL + "ajax-saved-cards";
export const URL_GET_SAVEDCARDS_DEV = BASE_URL_DEV + "ajax-saved-cards";
export const URL_ADD_CREDITCARD = BASE_URL + "add-credit-card";
export const URL_ADD_CREDITCARD_DEV = BASE_URL_DEV + "add-credit-card";
export const URL_GET_DELETE_CARD = BASE_URL + "delete-credit-card";
export const URL_GET_DELETE_CARD_DEV = BASE_URL_DEV + "delete-credit-card";
export const URL_GET_MAKE_DEFAULT_CARD = BASE_URL + "default-payment-method";
export const URL_GET_MAKE_DEFAULT_CARD_DEV = BASE_URL_DEV + "default-payment-method";
export const URL_EMAIL_NOTIFICATION = BASE_URL + "email-notification";
export const URL_EMAIL_NOTIFICATION_DEV = BASE_URL_DEV + "email-notification";
export const URL_GET_SUBCRIPTION = BASE_URL + "subscription";
export const URL_GET_SUBCRIPTION_DEV = BASE_URL_DEV + "subscription";
export const URL_UPLOAD_DOCUMENT = BASE_URL + "upload-documents";
export const URL_UPLOAD_DOCUMENT_DEV = BASE_URL_DEV + "upload-documents";
export const URL_UPDATE_NETWORTH = BASE_URL + "update-networth";
export const URL_UPDATE_NETWORTH_DEV = BASE_URL_DEV + "update-networth";
export const URL_GET_ALBUMREQUEST = BASE_URL + "album-request/";
export const URL_GET_ALBUMREQUEST_DEV = BASE_URL_DEV + "album-request/";
export const URL_ALBUM_REQUEST_ACTION = BASE_URL + "album-request-action";
export const URL_ALBUM_REQUEST_ACTION_DEV = BASE_URL_DEV + "album-request-action";
export const URL_GET_FAVORITE_LIST = BASE_URL + "favorite";
export const URL_GET_FAVORITE_LIST_DEV = BASE_URL_DEV + "favorite";
export const URL_AUTO_RENEW_PLAN = BASE_URL + "auto-renew-plan-status";
export const URL_AUTO_RENEW_PLAN_DEV = BASE_URL_DEV + "auto-renew-plan-status";
export const URL_GIFTS_SENT = BASE_URL + "ajax-sent-gifts/";
export const URL_GIFTS_SENT_DEV = BASE_URL_DEV + "ajax-sent-gifts/";
export const URL_GIFTS_RECEIVED = BASE_URL + "ajax-rcvd-real-gifts/";
export const URL_GIFTS_RECEIVED_DEV = BASE_URL_DEV + "ajax-rcvd-real-gifts/";
export const URL_GIFTS_PURCHASED = BASE_URL + "ajax-buy-gifts/";
export const URL_GIFTS_PURCHASED_DEV = BASE_URL_DEV + "ajax-buy-gifts/";
export const URL_GET_FANS_LIST_ROSESENT_LENGTH = BASE_URL + "my-followes";
export const URL_GET_FANS_LIST_ROSESENT_LENGTH_DEV = BASE_URL_DEV + "my-followes";
export const URL_GET_FANS = BASE_URL + "ajax-follower/";
export const URL_GET_FANS_DEV = BASE_URL_DEV + "ajax-follower/";
export const URL_GET_LISTS_CATEGORY_MEMBERS = BASE_URL + "connection-group/";
export const URL_GET_LISTS_CATEGORY_MEMBERS_DEV = BASE_URL_DEV + "connection-group/";
export const URL_REMOVE_LISTS_CATEGORY = BASE_URL + "remove/connection-group";
export const URL_REMOVE_LISTS_CATEGORY_DEV = BASE_URL_DEV + "remove/connection-group";
export const URL_UPDATE_LISTS_CATEGORY = BASE_URL + "edit/connection-group";
export const URL_UPDATE_LISTS_CATEGORY_DEV = BASE_URL_DEV + "edit/connection-group";
export const URL_MYLIST_MEMBER_SEARCH = BASE_URL + "ajax-search-mylist";
export const URL_MYLIST_MEMBER_SEARCH_DEV = BASE_URL_DEV + "ajax-search-mylist";
export const URL_MYLIST_ADD_LIST_MEMBER_SEARCH = BASE_URL + "add/connection-group";
export const URL_MYLIST_ADD_LIST_MEMBER_SEARCH_DEV = BASE_URL_DEV + "add/connection-group";
export const URL_GET_FOLLOWING_LIST = BASE_URL + "ajax-following/";
export const URL_GET_FOLLOWING_LIST_DEV = BASE_URL_DEV + "ajax-following/";
export const URL_ROSE_SEND = BASE_URL + "send-rose";
export const URL_ROSE_SEND_DEV = BASE_URL_DEV + "send-rose";
export const URL_GET_ROSE_SENT = BASE_URL + "sent-rose/";
export const URL_GET_ROSE_SENT_DEV = BASE_URL_DEV + "sent-rose/";
export const URL_GET_ROSE_RECEIVED = BASE_URL + "received-rose/";
export const URL_GET_ROSE_RECEIVED_DEV = BASE_URL_DEV + "received-rose/";
export const URL_SEND_VERIFICATION_EMAIL = BASE_URL + "resend-mail";
export const URL_SEND_VERIFICATION_EMAIL_DEV = BASE_URL_DEV + "resend-mail";
export const URL_PURCHASE_GOLDCOIN = BASE_URL + "process-gold-coins-payment";
export const URL_PURCHASE_GOLDCOIN_DEV = BASE_URL_DEV + "process-gold-coins-payment";
export const URL_CHANGE_MEMBERPLAN = BASE_URL + "process-change-plan-payment";
export const URL_CHANGE_MEMBERPLAN_DEV = BASE_URL_DEV + "process-change-plan-payment";
export const URL_DOWNGRADE_MEMBERPLAN = BASE_URL + "change-membership-plan";
export const URL_DOWNGRADE_MEMBERPLAN_DEV = BASE_URL_DEV + "change-membership-plan";
export const URL_UPGRADE_MEMBERPLAN = BASE_URL + "process-change-plan-app-payment";
export const URL_UPGRADE_MEMBERPLAN_DEV = BASE_URL_DEV + "process-change-plan-app-payment";
export const URL_UPGRADE_MEMBERPLAN_PAYPAL = BASE_URL + "process-change-plan-app-payment-paypal";
export const URL_UPGRADE_MEMBERPLAN_PAYPAL_DEV = BASE_URL_DEV + "process-change-plan-app-payment-paypal";
export const URL_RENEW_PLAN = BASE_URL + "buy-membership-plan";
export const URL_RENEW_PLAN_DEV = BASE_URL_DEV + "buy-membership-plan";
export const URL_MEMBER_PLAN_ACTIVE = BASE_URL + "activate-futured-membership-plan";
export const URL_MEMBER_PLAN_ACTIVE_DEV = BASE_URL_DEV + "activate-futured-membership-plan";
export const URL_INVITE_EVENTS = BASE_URL + "ajax-uninvited-event";
export const URL_INVITE_EVENTS_DEV = BASE_URL_DEV + "ajax-uninvited-event";
export const URL_IMPORT_EVENTS = BASE_URL + "import-my-events";
export const URL_IMPORT_EVENTS_DEV = BASE_URL_DEV + "import-my-events";
export const URL_IMPORT_EVENT_GUESTS = BASE_URL + "import-event-guests";
export const URL_IMPORT_EVENT_GUESTS_DEV = BASE_URL_DEV + "import-event-guests";
export const URL_DETERMINE_CATEGORY_EVENT = BASE_URL + "my-event";
export const URL_DETERMINE_CATEGORY_EVENT_DEV = BASE_URL_DEV + "my-event";
export const URL_DETERMINE_CATEGORY_TRAVEL = BASE_URL + "my-travel";
export const URL_DETERMINE_CATEGORY_TRAVEL_DEV = BASE_URL_DEV + "my-travel";
export const URL_LOGOUT = BASE_URL + "logout";
export const URL_LOGOUT_DEV = BASE_URL_DEV + "logout";
export const URL_GET_NOTIFICATIONS = BASE_URL + "ajax-notification";
export const URL_GET_NOTIFICATIONS_DEV = BASE_URL_DEV + "ajax-notification";
export const URL_DELETE_NOTIFICATION = BASE_URL + "remove-notification/";
export const URL_DELETE_NOTIFICATION_DEV = BASE_URL_DEV + "remove-notification/";

export const URL_GET_NOTIFICATION_COUNT = BASE_URL + "notification-badgenums";
export const URL_GET_NOTIFICATION_COUNT_DEV = BASE_URL_DEV + "notification-badgenums";
export const URL_READ_NOTIFICATIONS = BASE_URL + "notification-read-bytype";
export const URL_READ_NOTIFICATIONS_DEV = BASE_URL_DEV + "notification-read-bytype";
export const URL_ACCEPT_DECLINE_GIFT = BASE_URL + "accept-decline-gift";
export const URL_ACCEPT_DECLINE_GIFT_DEV = BASE_URL_DEV + "accept-decline-gift";
export const URL_PROFILE_VISIT = BASE_URL + "profile-visit";
export const URL_PROFILE_VISIT_DEV = BASE_URL_DEV + "profile-visit";
export const URL_GET_REFER_FRIEND = BASE_URL + "ajax-refer-friends/";
export const URL_GET_REFER_FRIEND_DEV = BASE_URL_DEV + "ajax-refer-friends/";
export const URL_REFER_FRIEND = BASE_URL + "refer-friends";
export const URL_REFER_FRIEND_DEV = BASE_URL_DEV + "refer-friends";
export const URL_TOPLIST_GOLDCOINS = BASE_URL + "top-goldcoins-list";
export const URL_TOPLIST_GOLDCOINS_DEV = BASE_URL_DEV + "top-goldcoins-list";
export const URL_TOPLIST_NETWEALTH = BASE_URL + "top-networth-list";
export const URL_TOPLIST_NETWEALTH_DEV = BASE_URL_DEV + "top-networth-list";
export const URL_TOPLIST_ROSERECEIVED = BASE_URL + "top-roses-list";
export const URL_TOPLIST_ROSERECEIVED_DEV = BASE_URL_DEV + "top-roses-list";
export const URL_TOPLIST_FOLLOWED = BASE_URL + "top-followed-list";
export const URL_TOPLIST_FOLLOWED_DEV = BASE_URL_DEV + "top-followed-list";
export const URL_FOLLOW_REQUEST = BASE_URL + "follow-request";
export const URL_FOLLOW_REQUEST_DEV = BASE_URL_DEV + "follow-request";
export const URL_GETRECENTLOGIN = BASE_URL + "recent-login";
export const URL_GETRECENTLOGIN_DEV = BASE_URL_DEV + "recent-login";
export const URL_MEMBERSHIP_INAPPPURCHASE = BASE_URL + "process-in-app-purchase";
export const URL_MEMBERSHIP_INAPPPURCHASE_DEV = BASE_URL_DEV + "process-in-app-purchase";
export const URL_MYLIST_REMOVE_MEMBER_FROM_LIST = BASE_URL + "remove/connection-users";
export const URL_MYLIST_REMOVE_MEMBER_FROM_LIST_DEV = BASE_URL_DEV + "remove/connection-users";
export const URL_CHANGE_PROFILE_TYPE = BASE_URL + "change-profile-feedback";
export const URL_CHANGE_PROFILE_TYPE_DEV = BASE_URL_DEV + "change-profile-feedback";
export const URL_SUSPEND_ACCOUNT = BASE_URL + "suspend-user";
export const URL_SUSPEND_ACCOUNT_DEV = BASE_URL_DEV + "suspend-user";
export const URL_DELETE_ACCOUNT = BASE_URL + "delete-user";
export const URL_DELETE_ACCOUNT_DEV = BASE_URL_DEV + "delete-user";
export const URL_PAYMENT_CHECK = BASE_URL + "is-payment-failed";
export const URL_PAYMENT_CHECK_DEV = BASE_URL_DEV + "is-payment-failed";
export const URL_APPSTORE_VERSION_CHECK = BASE_URL + "get-appstore-version";
export const URL_APPSTORE_VERSION_CHECK_DEV = BASE_URL_DEV + "get-appstore-version";
export const URL_PROFILE_STATUS = BASE_URL + "calc-profile-percentage";
export const URL_PROFILE_STATUS_DEV = BASE_URL_DEV + "calc-profile-percentage";
export const URL_GET_NEW_NOTIFICATIONS = BASE_URL + "header-notification";
export const URL_GET_NEW_NOTIFICATIONS_DEV = BASE_URL_DEV + "header-notification";
export const URL_SEND_REMINDERS = BASE_URL + "send-reminders";
export const URL_SEND_REMINDERS_DEV = BASE_URL_DEV + "send-reminders";
// get chat list urls
export const URL_GET_CHAT_TOKEN = BASE_URL + "get-chat-auth";
export const URL_GET_CHAT_TOKEN_DEV = BASE_URL_DEV + "get-chat-auth";
export const URL_GET_CHAT_USER_INFO = BASE_URL + "get-chat-user-info";
export const URL_GET_CHAT_USER_INFO_DEV = BASE_URL_DEV + "get-chat-user-info";
export const URL_GET_CHAT_USERS_INFO = BASE_URL + "get-chat-users-info";
export const URL_GET_CHAT_USERS_INFO_DEV = BASE_URL_DEV + "get-chat-users-info";
export const URL_GET_OLD_MESSAGE = BASE_URL + "get-old-messages";
export const URL_GET_OLD_MESSAGE_DEV = BASE_URL_DEV + "get-old-messages";
export const URL_GET_OLD_RECENT_CHATLIST = BASE_URL + "get-old-recent-chatlist";
export const URL_GET_OLD_RECENT_CHATLIST_DEV = BASE_URL_DEV + "get-old-recent-chatlist";


export const URL_CHAT_REQUEST_ACTION = BASE_URL + "chat-request-action";
export const URL_CHAT_REQUEST_ACTION_DEV = BASE_URL_DEV + "chat-request-action";

export const URL_CAHT_SEND_GOLD = BASE_URL + "send-gold-coins-chat";
export const URL_CAHT_SEND_GOLD_DEV = BASE_URL_DEV + "send-gold-coins-chat";
export const URL_GET_CHAT_REQUEST = BASE_URL + "get-chat-request";
export const URL_GET_CHAT_REQUEST_DEV = BASE_URL_DEV + "get-chat-request";
export const URL_SEND_CHAT_REQUEST = BASE_URL + "send-chat-request";
export const URL_SEND_CHAT_REQUEST_DEV = BASE_URL_DEV + "send-chat-request";

export const URL_SAVE_NEW_MESSAGE = BASE_URL + "save-new-message";
export const URL_SAVE_NEW_MESSAGE_DEV = BASE_URL_DEV + "save-new-message";

export const URL_SEND_MESSAGE_NOTIFICATION = BASE_URL + "send-message-notification";
export const URL_SEND_MESSAGE_NOTIFICATION_DEV = BASE_URL_DEV + "send-message-notification";
export const URL_SEND_MESSAGE_NOTIFICATION_APP = BASE_URL + "send-message-notification-app";
export const URL_SEND_MESSAGE_NOTIFICATION_APP_DEV = BASE_URL_DEV + "send-message-notification-app";

export const URL_UPDATE_CHAT_COST = BASE_URL + "update-chat-cost";
export const URL_UPDATE_CHAT_COST_DEV = BASE_URL_DEV + "update-chat-cost";

//signuppaymentscreen
export const URL_CHANGE_MEMBERPLAN_PAYPAL = BASE_URL + "process-change-plan-payment-paypal";
export const URL_CHANGE_MEMBERPLAN_PAYPAL_DEV = BASE_URL_DEV + "process-change-plan-payment-paypal";
export const URL_REGISTER_MEMBERPLAN = BASE_URL + "register-membership-plan";
export const URL_REGISTER_MEMBERPLAN_DEV = BASE_URL_DEV + "register-membership-plan";

//add coins
export const URL_PURCHASE_GOLDCOIN_PAYPAL = BASE_URL + "process-gold-coins-payment-paypal";
export const URL_PURCHASE_GOLDCOIN_PAYPAL_DEV = BASE_URL_DEV + "process-gold-coins-payment-paypal";
export const URL_UPDATE_GOLD_COINS = BASE_URL + "update-gold-coins";
export const URL_UPDATE_GOLD_COINS_DEV = BASE_URL_DEV + "update-gold-coins";

//sell coins
export const URL_SELL_GOLD_COINS_PAYPAL = BASE_URL + "sell-gold-coins-paypal";
export const URL_SELL_GOLD_COINS_PAYPAL_DEV = BASE_URL_DEV + "sell-gold-coins-paypal";

// Send Gold Coin to access other Album
export const URL_SEND_GOLD_TO_OTHER_ALBUM = BASE_URL + "send-gold-coins";
export const URL_SEND_GOLD_TO_OTHER_ALBUM_DEV = BASE_URL_DEV + "send-gold-coins";
// /update-chat-cost
// /update-chat-cost
export const CHAT_AUTH_TOKEN = ""
//// document type
export const documentType = [];
///////// google map key
export const GOOGLE_MAP_KEY = "AIzaSyCAgeMU4Pm6HG2pujS3IxBfnYkNEyLsSmc";  //// key from 007project
// export const GOOGLE_MAP_KEY = "AIzaSyCPfjo3Mbmsr0l2_CmFxM_VxrDkEiswcto";   //// key get from my previous client


//phone number verification
export const URL_SEND_PHONE_OTP = BASE_URL + "send-phone-otp";
export const URL_SEND_PHONE_OTP_DEV = BASE_URL_DEV + "send-phone-otp";

export const URL_CHECK_PHONE_OTP = BASE_URL + "check-phone-otp";
export const URL_CHECK_PHONE_OTP_DEV = BASE_URL_DEV + "check-phone-otp";


export const activeOpacity = 1.0;
export const visibility_public = 1;
export const visibility_member = 0;
export const visibility_invitee = 2;
export const visibility_favorite = 3;
export const visibility_private = 4;
export const visibility_member_favorite = 5;

export const category_array_birthday = [
    {
        label: 'Message',
        value: 0,
        icon_path: require('../icons/ic_tab_messages.png')
    }, {
        label: 'Rose',
        value: 1,
        icon_path: require('../icons/Icons_Rose.png')
    }, {
        label: 'Gift',
        value: 2,
        icon_path: require('../icons/ic_tab_gift.png')
    }, {
        label: 'Gold Coin',
        value: 3,
        icon_path: require('../icons/goldCoin10New.png')
    }
]

export const category_array_all = [
    {
        label: 'Private',
        value: 4,
        icon_path: require('../icons/privateVisibility.png')
    }, {
        label: 'Invitees',
        value: 2,
        icon_path: require('../icons/inviteesVisibility.png')
    }, {
        label: 'Favorites',
        value: 3,
        icon_path: require('../icons/favoriteVisibility.png')
    }, {
        label: 'Member',
        value: 0,
        icon_path: require('../icons/memberVisibility.png')
    }, {
        label: 'Members\n& Favorites',
        value: 5,
        icon_path: require('../icons/memberfavoriteVisibility.png')
    }, {
        label: 'Public',
        value: 1,
        icon_path: require('../icons/publicVisibility.png')
    }
];

export const category_array_event_trip = [
    {
        label: 'Invitees',
        value: 2,
        icon_path: require('../icons/inviteesVisibility.png')
    }, {
        label: 'Favorites',
        value: 3,
        icon_path: require('../icons/favoriteVisibility.png')
    }, {
        label: 'Member',
        value: 0,
        icon_path: require('../icons/memberVisibility.png')
    }, {
        label: 'Members\n& Favorites',
        value: 5,
        icon_path: require('../icons/memberfavoriteVisibility.png')
    }, {
        label: 'Public',
        value: 1,
        icon_path: require('../icons/publicVisibility.png')
    }
];

export const category_array_others = [
    {
        label: 'Private',
        value: 4,
        icon_path: require('../icons/privateVisibility.png')
    }, {
        label: 'Favorites',
        value: 3,
        icon_path: require('../icons/favoriteVisibility.png')
    }, {
        label: 'Member',
        value: 0,
        icon_path: require('../icons/memberVisibility.png')
    }, {
        label: 'Members\n& Favorites',
        value: 5,
        icon_path: require('../icons/memberfavoriteVisibility.png')
    }, {
        label: 'Public',
        value: 1,
        icon_path: require('../icons/publicVisibility.png')
    }
];

export const selected_category = 2;

import images from "../images";

export const entriesMain = [
    {
        name: "RICH",
        image: images.rich,
        profile_text: "Member with assets at $30 million and above",
        cost: "FREE",
        includes: 'Unlimited New Member Chats per Month\nIndividually Approved',
        tag: images.richTag,
        background: images.bg1,
        badge: images.richBadge,
        avatar: images.richAvatar,
        type: "1"
    },
    {
        name: "GENEROUS",
        profile_text: "Gentlemen",
        cost: "$ 49.99/ Month",
        includes: 'Unlimited New Member Chats per Month\n10 Gold Coins on Registration\n3 Additional Gold Coins every month Individually Approved',
        image: images.gentleman,
        tag: images.gentlemanTag,
        background: images.bg2,
        badge: images.gentlemanBadge,
        avatar: images.gentlemanAvatar,
        type: "2"
    },

    {
        name: "MODEL",
        image: images.model,
        profile_text: "Active model with authentic portfolio",
        cost: "FREE",
        includes: 'Unlimited New Member Chats per Month\nIndividually Approved',
        tag: images.modelTag,
        background: images.bg3,
        badge: images.modelBadge,
        avatar: images.modelAvatar,
        type: "3"
    },

    {
        name: "CONNECTOR",
        image: images.typeConnector,
        profile_text: "Prominent social relationships and excellent at building links",
        cost: "$ 29.99/ Month",
        // cost: "FREE",
        includes: 'Unlimited New Member Chats per Month\nIndividually Approved',
        tag: images.connectorTag,
        background: images.bg4,
        badge: images.connectorBadge,
        avatar: images.connectorAvatar,
        type: "5"
    },

    {
        name: "FAMOUS",
        image: images.famousNew,
        profile_text: "Must Be notable figure in respective field",
        cost: "FREE",
        includes: 'Unlimited New Member Chats per Month\nIndividually Approved',
        tag: images.famousTag,
        background: images.bg5,
        badge: images.famousBadge,
        avatar: images.famousAvatar,
        type: "6"
    },
    {
        name: "NONE",
        image: images.typeNone,
        profile_text: "I AM NOT ONE OF THESE",
        cost: "",
        includes: '',
        tag: images.famousTag,
        background: images.bg8,
        badge: images.famousBadge,
        type: "0"
    },
];

export const entriesFan = [
    {
        name: "VIP FAN",
        image: images.vipfan,
        profile_text: "Privileged Access",
        cost: "$ 9.99/ MONTH",
        // cost: "FREE",
        includes: 'Cannot Chat with Members',
        tag: images.vipfanTag,
        background: images.bg6,
        badge: images.vipfanBadge,
        avatar: images.vipAvatar,
        type: "4"
    },
    {
        name: "FAN",
        profile_text: "Follow the Stars",
        cost: "FREE",
        includes: 'Cannot Chat with Members',
        image: images.fan,
        tag: images.fanTag,
        background: images.bg7,
        badge: images.fanBadge,
        avatar: images.fanAvatar,
        type: "7"
    },
    {
        name: "NONE",
        image: images.typeGoback,
        profile_text: "BACK TO MEMBER PROFILES",
        cost: "",
        includes: '',
        tag: images.famousTag,
        background: images.bg8,
        badge: images.famousBadge,
        type: "0"
    },
];

export const entries = [
    {
        name: "RICH",
        image: images.rich,
        profile_text: "Member with assets at $30 million and above",
        cost: "FREE",
        includes: 'Unlimited New Member Chats per Month\nIndividually Approved',
        tag: images.richTag,
        background: images.bg1,
        badge: images.richBadge,
        avatar: images.richAvatar,
        type: "1"
    },
    {
        name: "GENEROUS",
        profile_text: "Gentlemen",
        cost: "$ 49.99/ Month",
        includes: 'Unlimited New Member Chats per Month\n10 Gold Coins on Registration\n3 Additional Gold Coins every month Individually Approved',
        image: images.gentleman,
        tag: images.gentlemanTag,
        background: images.bg2,
        badge: images.gentlemanBadge,
        avatar: images.gentlemanAvatar,
        type: "2"
    },

    {
        name: "MODEL",
        image: images.model,
        profile_text: "Active model with authentic portfolio",
        cost: "FREE",
        includes: 'Unlimited New Member Chats per Month\nIndividually Approved',
        tag: images.modelTag,
        background: images.bg3,
        badge: images.modelBadge,
        avatar: images.modelAvatar,
        type: "3"
    },

    {
        name: "CONNECTOR",
        image: images.typeConnector,
        profile_text: "Prominent social relationships and excellent at building links",
        cost: "$ 29.99/ Month",
        includes: 'Unlimited New Member Chats per Month\nIndividually Approved',
        tag: images.connectorTag,
        background: images.bg4,
        badge: images.connectorBadge,
        avatar: images.connectorAvatar,
        type: "5"
    },

    {
        name: "FAMOUS",
        image: images.famousNew,
        profile_text: "Must Be notable figure in respective field",
        cost: "FREE",
        includes: 'Unlimited New Member Chats per Month\nIndividually Approved',
        tag: images.famousTag,
        background: images.bg5,
        badge: images.famousBadge,
        avatar: images.famousAvatar,
        type: "6"
    },

    {
        name: "VIP FAN",
        image: images.vipfan,
        profile_text: "Privileged Access",
        cost: "$ 9.99/ MONTH",
        // cost: "FREE",
        includes: 'Cannot Chat with Members',
        tag: images.vipfanTag,
        background: images.bg6,
        badge: images.vipfanBadge,
        avatar: images.vipAvatar,
        type: "4"
    },
    {
        name: "FOLLOWER",
        profile_text: "Follow the Stars",
        cost: "FREE",
        includes: 'Cannot Chat with Members',
        image: images.fan,
        tag: images.fanTag,
        background: images.bg7,
        badge: images.fanBadge,
        avatar: images.fanAvatar,
        type: "7"
    }
];

export const entriesAll = [
    {
        name: "RICH",
        image: images.rich,
        profile_text: "Wealthy individuals with assets of >$30 million USD",
        cost: "FREE",
        includes: '100 New Member Chats per Month\nIndividually Approved',
        tag: images.richTag,
        background: images.bg1,
        badge: images.richBadge,
        avatar: images.richAvatar,
        type: "1"
    },
    {
        name: "GENTLEMAN",
        profile_text: "Rich members with senior party hosting and message privileges",
        // cost: "$ 49.99/ Month",
        cost: "FREE",
        includes: 'Unlimited New Member Chats per Month\n10 Gold Coins on Registration\nIndividually Approved',
        image: images.gentleman,
        tag: images.gentlemanTag,
        background: images.bg2,
        badge: images.gentlemanBadge,
        avatar: images.gentlemanAvatar,
        type: "2"
    },

    {
        name: "MODEL",
        image: images.model,
        profile_text: "Active model with authentic portfolio",
        cost: "FREE",
        includes: 'Unlimited New Member Chats per Month\nIndividually Approved',
        tag: images.modelTag,
        background: images.bg3,
        badge: images.modelBadge,
        avatar: images.modelAvatar,
        type: "3"
    },

    {
        name: "CONNECTOR",
        image: images.typeConnector,
        profile_text: "Prominent social relationships and excellent at building links",
        // cost: "$ 29.99/ Month",
        cost: "FREE",
        includes: 'Unlimited New Member Chats per Month\nIndividually Approved',
        tag: images.connectorTag,
        background: images.bg4,
        badge: images.connectorBadge,
        avatar: images.connectorAvatar,
        type: "5"
    },
    {
        name: "FAMOUS",
        image: images.famousNew,
        profile_text: "Internationally notable figure in respective field",
        cost: "FREE",
        includes: 'Unlimited New Member Chats per Month\nIndividually Approved',
        tag: images.famousTag,
        background: images.bg5,
        badge: images.famousBadge,
        avatar: images.famousAvatar,
        type: "6"
    },

    {
        name: "VIP FAN",
        image: images.vipfan,
        profile_text: "Privileged Access to communicate with Members",
        // cost: "$ 9.99/ MONTH",
        cost: "FREE",
        includes: '100 New Member Chats per Month',
        tag: images.vipfanTag,
        background: images.bg6,
        badge: images.vipfanBadge,
        avatar: images.vipAvatar,
        type: "4"
    },
    {
        name: "FAN",
        profile_text: "Follow the Stars.",
        cost: "FREE",
        includes: 'Cannot Chat with Members',
        image: images.fan,
        tag: images.fanTag,
        background: images.bg7,
        badge: images.fanBadge,
        avatar: images.fanAvatar,
        type: "7"
    },
    {
        name: "Alumni",
        tag: images.alumniTag,
        type: "8"
    }
];

export default { gift_category_selected: true };

export const profile_status_view_flag = false;

export const first_running = true;


