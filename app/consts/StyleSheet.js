import { Platform, Dimensions, LogBox } from 'react-native'
import { Colors } from './Colors'

const isIos = Platform.OS === 'ios';
const isIphoneX = isIos && (Dimensions.get('window').height === 812 || Dimensions.get('window').height === 896);
export const STICKY_HEADER_HEIGHT = 54;
const topPosition = 15;
const leftPosition = 12;

const tabViewHeight = isIphoneX ? (49 + 34) : 49;
const tabPaddingBottom = isIphoneX ? 20 : 0;
const tabimageSize = isIphoneX ? 38 : 36;

const { height, width } = Dimensions.get("window");

export const stylesGlobal = {
    headerView: {
        flexDirection: "row",
        height: STICKY_HEADER_HEIGHT,
        backgroundColor: Colors.black,
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingLeft: 10,
        paddingTop: 0,
        paddingRight: 10,
        // paddingTop:isIphoneX?30:0
    },

    leftLogo: {
        position: "absolute",
        left: 55,
        top: 7,
    },
    newSearchView: {
        height: 34,
        top: 10,
        right: 16,
        left: 124,
        position: "absolute",
        borderWidth: 1,
        borderRadius: 5,
        borderColor: Colors.gold,
        shadowColor: Colors.black,
        backgroundColor: Colors.gold,
    },
    newSearchTextInput: {
        position: "absolute",
        backgroundColor: Colors.gold,
        color: Colors.black,
        fontSize: 13,
        padding: 5,
        height: 32,
        right: 32,
        left: 0,
    },
    newSearchButton: {
        position: "absolute",
        right: 1,
        width: 30,
        height: 34,
        top: 0,
        right: 0,
        justifyContent: 'center',
        alignItems: 'center'
    },
    separatorView: {
        position: "absolute",
        right: 44,
        top: 10,
        width: 1,
        height: 34,
        backgroundColor: Colors.black
    },
    profileIcon: {
        position: "absolute",
        right: 10,
        top: 9,
        paddingTop: 0,
        paddingLeft: 5,
        paddingRight: 5,
        paddingBottom: 0,
    },
    leftMenu: {
        position: "absolute",
        left: leftPosition,
        top: 5,
        paddingTop: 8,
        paddingLeft: 10,
        paddingRight: 20,
        paddingBottom: 10,
    },
    rightMenuSearchButton: {
        position: "absolute",
        right: 4,
        top: 10,
        paddingTop: 8,
        paddingLeft: 8,
        paddingRight: 8,
        paddingBottom: 8,
    },
    rightMenuClearButton: {
        position: "absolute",
        right: 0,
        top: 0,
        width: 34,
        height: 34,
        justifyContent: 'center',
        alignItems: 'center'
    },
    filterMenu: {
        position: "absolute",
        right: 4,
        top: 10,
        paddingTop: 8,
        paddingLeft: 2,
        paddingRight: 6,
        paddingBottom: 8,
    },
    rightMenuSearch: {
        position: "absolute",
        right: 10,
        top: topPosition,
        paddingTop: 5,
        paddingLeft: 8,
        paddingRight: 8,
        paddingBottom: 5
    },
    rightMenu: {
        position: "absolute",
        right: leftPosition,
        top: topPosition,
        paddingTop: 5,
        paddingLeft: 10,
        paddingRight: 10,
        paddingBottom: 5,
    },
    centerLogo: {
        marginTop: 7,
        alignSelf: "center",
    },
    searchTextInput: {
        right: isIphoneX ? 25 : 55,
        left: isIphoneX ? 25 : 55,
        top: isIphoneX ? 34 : 10,
        position: "absolute",
        borderWidth: 1,
        borderRadius: 5,
        borderColor: Colors.gold,
        margin: 5,
        shadowColor: Colors.black,
        backgroundColor: Colors.gold,
        color: Colors.black,
        fontSize: 13,
        padding: 5,
        height: 30
    },
    fixedSection: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 10,
        height: STICKY_HEADER_HEIGHT,
        flexDirection: "column",
        justifyContent: "center"
    },
    chatProfileIconView: {
        height: 34,
        top: 10,
        right: 16,
        left: 54,
        position: "absolute",
        flexDirection: 'row'
    },

    // styles for event and travel detail...
    subViewDetail: {
        flex: 1,
        marginHorizontal: 10,
        // marginBottom: 10,
        // marginBottom:isIphoneX? 34+15 : 15,
        backgroundColor: 'white',
        borderRadius: 10,
        overflow: 'hidden'
    },
    titleText: {
        color: Colors.gold,
        fontSize: 18,
        marginTop: 25,
    },
    descriptionText: {
        color: Colors.black,
        fontSize: 15,
        marginTop: 10,
    },
    locationText: {
        color: Colors.black,
        fontSize: 15,
        fontWeight: '500',
        marginLeft: 20,
        marginRight: 10,
    },
    font: {
        fontFamily: Platform.OS == "ios" ? 'raleway' : "raleway_regular",
    },
    descriptionTextInput: {
        fontFamily: Platform.OS == "ios" ? 'raleway' : "raleway_regular",
        minHeight: 200,
    },
    font_bold: {
        fontFamily: Platform.OS == "ios" ? 'raleway' : 'raleway_bold',
        fontWeight: Platform.OS == 'ios' ? 'bold' : null
    },
    font_semibold: {
        fontFamily: Platform.OS == "ios" ? 'raleway' : 'raleway_semibold',
        fontWeight: Platform.OS == 'ios' ? '500' : null
    },
    shadow_style: {
        shadowColor: '#000000',
        shadowOffset: {
            width: -2, 
            height: 2
        },
        shadowOpacity: 0.5,
        shadowRadius: 1,
        borderColor: Platform.OS == "android" ? "#00000044" : Colors.gold, 
        borderLeftWidth: Platform.OS == "android" ? 2 : 0, 
        borderBottomWidth: Platform.OS == "android" ? 2 : 0, 
        elevation: Platform.OS == "android" ? 6 : 0
    },
    header_backbuttonview_style: {
        width: STICKY_HEADER_HEIGHT * 0.6,
        height: STICKY_HEADER_HEIGHT * 0.4,
        justifyContent: 'center',
        alignItems: 'center'
    },
    header_backbuttonicon_style: {
        width: '100%',
        height: '100%',
        resizeMode: 'contain'
    },
    header_rightmenuview_style: {
        width: STICKY_HEADER_HEIGHT * 0.6,
        height: STICKY_HEADER_HEIGHT * 0.4,
        justifyContent: 'center',
        alignItems: 'center'
    },
    header_rightmenuicon_style: {
        width: '100%',
        height: "80%",
        resizeMode: 'contain'
    },
    header_logoview_style: {
        width: STICKY_HEADER_HEIGHT * 0.4 * 4.4,
        height: STICKY_HEADER_HEIGHT * 0.4
    },
    header_logo_style: {
        height: '100%',
        width: '100%',
        resizeMode: 'contain'
    },
    header_searchview_style: {
        flex: 1,
        height: STICKY_HEADER_HEIGHT * 0.7,
        flexDirection: 'row',
        marginLeft: 5,
        marginRight: 5,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.gold,
        borderRadius: 5,
        overflow: 'hidden'
    },
    header_searchtextview_style: {
        flex: 1,
        height: '100%',
        color: Colors.black,
        fontSize: 13,
        padding: 5
    },
    header_searchiconview_style: {
        height: '100%',
        aspectRatio: 1,
        alignItems: 'center',
        justifyContent: 'center',
        borderLeftColor: Colors.black,
        borderLeftWidth: 1
    },
    header_searchicon_style: {
        tintColor: Colors.black,
        width: '40%',
        height: '40%',
        resizeMode: 'contain'
    },
    header_avatarview_style: {
        width: STICKY_HEADER_HEIGHT * 0.9,
        height: STICKY_HEADER_HEIGHT * 0.9,
        justifyContent: 'center',
        alignItems: 'center'
    },
    header_avatarsubview_style: {
        width: STICKY_HEADER_HEIGHT * 0.75,
        height: STICKY_HEADER_HEIGHT * 0.75,
        borderRadius: STICKY_HEADER_HEIGHT * 0.75,
        backgroundColor: Colors.black,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center'
    },
    header_avatar_style: {
        width: STICKY_HEADER_HEIGHT * 0.75,
        height: STICKY_HEADER_HEIGHT * 0.75,

    },
    header_inviteButton: {
        width: 100,
        height: 30,
        backgroundColor: Colors.gold,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 12,
    },

    title_header: { //// grey header in each card
        width: '100%',
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.card_titlecolor,
        borderTopRightRadius: 10,
        borderTopLeftRadius: 10,
        overflow: 'hidden'
    },
    headText: {  //grey header text in each card
        color: Colors.gold,
        fontSize: 20,
        // fontWeight: 'bold'
    },

    tab_bar_view: {
        width: '100%',
        height: tabViewHeight,
        backgroundColor: Colors.black,
        paddingBottom: tabPaddingBottom,
        borderTopWidth: 2,
        borderTopColor: Colors.gold,
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center'
    },
    tab_icon: {
        width: tabimageSize,
        height: tabimageSize,
        opacity: 0.5,
        marginBottom: -5
    },

    date_view: {
        paddingVertical: 5,
        paddingHorizontal: 10,
        backgroundColor: Colors.gold,
        borderRadius: 5,
        alignItems: 'center',
        justifyContent: 'center'
    },
    common_button: {
        paddingVertical: 10,
        paddingHorizontal: 10,
        backgroundColor: Colors.gold,
        borderRadius: 5
    },
    ribbon: {
        width: '50%',
        aspectRatio: 1,
        position: "absolute",
        right: 0,
        top: 0,
        resizeMode: 'contain',
        zIndex: 10,
    },
    ribbon2: {
        width: '65%',
        aspectRatio: 1,
        position: "absolute",
        right: -18,
        top: -19,
        resizeMode: 'contain',
        zIndex: 10,
    }, 
    cardView_container: {
        width: '85%',
        paddingVertical: 12,
        paddingHorizontal: 15,
    },
    cardView: {
        width: '100%',
        backgroundColor: Colors.white,
        // margin: 12, //cardMargin,
        borderRadius: 10,
        padding: 20,
        shadowColor: Colors.white,
        shadowOffset: {
            width: 0,
            height: 0
        },
        shadowRadius: 7,
        shadowOpacity: 7.0
    },
    empty_cardView: {
        width: '80%',
        height: '90%',
        backgroundColor: Colors.white,
        margin: 12, //cardMargin,
        borderRadius: 10,
        paddingTop: 5,
        paddingBottom: 20,
        paddingHorizontal: 10,
        shadowColor: Colors.white,
        shadowOffset: {
            width: 0,
            height: 0
        },
        shadowRadius: 7,
        shadowOpacity: 7.0,
        justifyContent: 'center',
        alignItems: 'center'
    },
    empty_cardView_text: {
        color: Colors.black,
        fontSize: 14,
        textAlign: "center"
    },
    card_profile_fitImage: {
        // width: width * 0.8 * 0.8,
        // height: width * 0.8 * 0.8,
        // borderRadius: width * 0.8 * 0.8 / 2
        width: '100%',
        aspectRatio: 1,
        borderRadius: 200,
        overflow: 'hidden',
    },
    card_profile_fitImageView: {
        // width: width * 0.8 * 0.8 + width * 0.06,
        // height: width * 0.8 * 0.8 + width * 0.05,
        width: '87.5%',
        aspectRatio: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: '3%'
    },
    card_favorite_button: {
        // width: width * 0.15, 
        // height: width * 0.15, 
        // borderRadius: width * 0.15 / 2,
        width: '25%',
        aspectRatio: 1,
        // borderRadius: 200,
        position: 'absolute',
        // bottom: width * 0.025, 
        // right: width * 0.025, 
        bottom: '2%',
        right: '2%',
        overflow: 'hidden'
    },
    credit_card_view: {
        width: '95%',
        // aspectRatio: 1.6,
        height: 220,
        marginBottom: 10,
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
        borderWidth: 0.5,
        borderColor: Colors.gray,
        shadowColor: Colors.white,
        shadowOffset: {
            width: 0,
            height: 0
        },
        shadowRadius: 7,
        shadowOpacity: 7.0,

    },
    cancel_delete_image: {
        width: 12,
        height: 12,
        resizeMode: 'contain',
    },
    // non member invite popup window
    invite_popup_container_view: {
        position: 'absolute',
        width: width,
        height: height,
        top: 0,
        left: 0,
        zIndex: 11,
        alignItems: 'center'
    },
    invite_popup_main_view: {
        width: '95%',
        maxHeight: height - 100,
        backgroundColor: Colors.white,
        alignItems: 'center',
        paddingHorizontal: 15,
        borderRadius: 10,
        justifyContent: 'center'
    },
    invite_popup_crown_image: {
        width: 40,
        height: 40,
        resizeMode: 'contain'
    },
    invite_view_header_text: {
        fontSize: 15,
        textAlign: 'center',
        marginTop: 10
    },
    invite_row_view: {
        width: '100%',
        // alignItems: 'center', 
        justifyContent: 'space-between',
        flexDirection: 'row',
        marginTop: 20
    },
    invite_view_submit_button: {
        width: '70%',
        paddingVertical: 10,
        backgroundColor: Colors.gold,
        borderRadius: 5,
        alignItems: 'center',
        marginTop: 20
    },
    invite_view_submit_button_text: {
        color: Colors.white,
        fontSize: 14
    },
    invite_view_input_view: {
        width: '100%',
        height: 30,
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 3,
        borderWidth: 1,
        borderColor: Colors.gray,
        marginTop: 5
    },
    invite_view_input_text: {
        flex: 1,
        paddingLeft: 10,
        paddingVertical: 5,
        fontSize: 12
    },
    invite_view_gender_view: {
        width: '100%',
        height: 30,
        borderRadius: 3,
        borderWidth: 1,
        borderColor: Colors.gray,
        marginTop: 5
    },
    hidden_lock_image: {
        width: 40,
        height: 40,
        resizeMode: 'contain'
    },

    // general popup message box
    popup_bg_blur_view: {
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
        right: 0,
        backgroundColor: Colors.black,
        opacity: 0.3
    },
    popup_main_container: {
        width: '90%',
        borderRadius: 5,
        backgroundColor: Colors.white
    },
    popup_title_view: {
        width: '100%',
        padding: 20,
        flexDirection: 'row',
        // alignItems: 'center', 
        justifyContent: 'space-between',
        borderBottomColor: Colors.gray,
        borderBottomWidth: 0.5
    },
    popup_title_text: {
        flex: 1,
        fontSize: 18,
        color: Colors.black,
        
    },
    popup_cancel_button: {
        padding: 5,
        marginStart: 10
    },
    popup_desc_container: {
        width: '100%',
        padding: 20,
        borderBottomColor: Colors.gray,
        borderBottomWidth: 0.5,
    },
    popup_desc_text: {
        fontSize: 14,
        color: Colors.black
    },
    popup_textinput: {
        width: '100%',
        height: 120,
        borderRadius: 5,
        borderColor: Colors.gray,
        borderWidth: 0.5,
        fontSize: 14,
        padding: 10,
        marginTop: 10
    },
    popup_button_container: {
        width: '100%',
        padding: 20,
        flexDirection: 'row',
        justifyContent: 'flex-end'
    },
    popup_button_text: {
        fontSize: 14,
        color: Colors.white
    }
}