import React, {Component} from "react";
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';


import SignInScreen from "./SignInScreen";
import SignUpScreen from "./SignUpScreen";
import SelectRoleScreen from "./SelectRoleScreen";
import ForgotPassword from "./ForgotPassword";
import TabNavigatorClass from "./TabNavigatorClass";
import EventDetail from "./EventDetailsScreen";
import MyProfile from "./MyProfileScreen";
import SearchUser from "./SearchUserScreen";
import CreateEvent from "./CreateEventScreen";
import CreateTravelScreen from "./CreateTravelScreen";
import GuestList from "./GuestListScreen";
import InviteFriend from "./InviteFriendScreen";
import ImportGuestEvent from "./ImportGuestEvent";
import ImportGuestList from "./ImportGuestList";
import ProfileDetail from "./ProfileDetailScreen";
import InviteUserToEvents from "./InviteUserToEventsScreen";
import UserTimeLine from "./UserTimeLineScreen";
import AddAlbum from "./AddAlbumScreen";
import ImageZoom from "./ImageZoomScreen";
import ShowAlbumImage from "./ShowAlbumImage";
import AddSuccessTimeline from "./AddSuccessTimelineScreen";
import AddTravelPlan from "./AddTravelPlanScreen";
import GiftBuy from "./GiftBuy";
import GiftDetail from "./GiftDetail";
import UserChat from "./UserChatScreen";
import MyListsNavigation from "./MyListsNavigation";
import TopMembers from "./TopMembers";
import FeedComment from "./FeedCommentScreen";
import ReferredFriend from "./ReferredFriend";
import MyWishListScreen from "./MyWishListScreen";
import EditProfile from "./EditProfileScreen";
import MyAccountScreen from "./MyAccountScreen";
import NewMessage from "./NewMessageScreen";
import FriendConnection from "./FriendConnectionScreen";
import ShowOtherUserAlbum from "./ShowOtherUserAlbum";
import ShowOtherUserAlbumImages from "./ShowOtherUserAlbumImages";
import MyTimeLine from "./MyTimeLineScreen";
import Payment from "./Payment";
import ProfileFullImage from "./ProfileFullImageScreen";
import GiftList from "./GiftListScreen";
import GiftSend from "./GiftSend";
import DeepLinking from "../utils/DeepLinking";
import {navigationRef} from '../utils/ReactNavigation';
import SignupPaymentScreen from "./SignupPaymentScreen";
import Subscription from './Subscription';
import MyRecentMessagesScreen from './MyRecentMessagesScreen';
// import MyListGiftReceived from './MyListGiftReceived';
const Stack = createStackNavigator();

export default class RouteNavigator extends Component {

    constructor(props) {
        super(props);
        
    }

    render() {
        return (
            <NavigationContainer ref = {navigationRef}>
                <Stack.Navigator screenOptions = {{headerShown: false, gestureEnabled: false}} options={{gestureEnabled: false}}>
                    <Stack.Screen name = "SignInScreen" component = {SignInScreen}  options={{gestureEnabled: false}}/>
                    <Stack.Screen name = "SignUpScreen" component = {SignUpScreen}  options={{gestureEnabled: false}}/>
                    <Stack.Screen name = "SignupPaymentScreen" component = {SignupPaymentScreen}  options={{gestureEnabled: false}}/>
                    <Stack.Screen name = "SelectRoleScreen" component = {SelectRoleScreen}  options={{gestureEnabled: false}}/>
                    <Stack.Screen name = "ForgotPassword" component = {ForgotPassword}  options={{gestureEnabled: false}}/>
                    <Stack.Screen name = "Dashboard" component = {TabNavigatorClass}  options={{gestureEnabled: false}}/>
                    <Stack.Screen name = "EventDetail" component = {EventDetail}  options={{gestureEnabled: false}}/>
                    <Stack.Screen name = "MyProfile" component = {MyProfile}  options={{gestureEnabled: false}}/>
                    <Stack.Screen name = "SearchUser" component = {SearchUser}  options={{gestureEnabled: false}}/>
                    <Stack.Screen name = "CreateEvent" component = {CreateEvent}  options={{gestureEnabled: false}}/>
                    <Stack.Screen name = "CreateTravelScreen" component = {CreateTravelScreen}  options={{gestureEnabled: false}}/>
                    <Stack.Screen name = "GuestList" component = {GuestList}  options={{gestureEnabled: false}}/>
                    <Stack.Screen name = "InviteFriend" component = {InviteFriend}  options={{gestureEnabled: false}}/>
                    <Stack.Screen name = "ImportGuestEvent" component = {ImportGuestEvent}  options={{gestureEnabled: false}}/>
                    <Stack.Screen name = "ImportGuestList" component = {ImportGuestList}  options={{gestureEnabled: false}}/>
                    <Stack.Screen name = "ProfileDetail" component = {ProfileDetail}  options={{gestureEnabled: false}}/>
                    <Stack.Screen name = "InviteUserToEvents" component = {InviteUserToEvents}  options={{gestureEnabled: false}}/>
                    <Stack.Screen name = "UserTimeLine" component = {UserTimeLine}  options={{gestureEnabled: false}}/>
                    <Stack.Screen name = "AddAlbum" component = {AddAlbum}  options={{gestureEnabled: false}}/>
                    <Stack.Screen name = "ImageZoom" component = {ImageZoom}  options={{gestureEnabled: false}}/>
                    <Stack.Screen name = "ShowAlbumImage" component = {ShowAlbumImage}  options={{gestureEnabled: false}}/>
                    <Stack.Screen name = "AddSuccessTimeline" component = {AddSuccessTimeline}  options={{gestureEnabled: false}}/>
                    <Stack.Screen name = "AddTravelPlan" component = {AddTravelPlan}  options={{gestureEnabled: false}}/>
                    <Stack.Screen name = "GiftBuy" component = {GiftBuy}  options={{gestureEnabled: false}}/>
                    <Stack.Screen name = "GiftDetail" component = {GiftDetail}  options={{gestureEnabled: false}}/>
                    <Stack.Screen name = "UserChat" component = {UserChat} options={{gestureEnabled: false}}/>
                    <Stack.Screen name = "MyListsNavigation" component = {MyListsNavigation}  options={{gestureEnabled: false}}/>
                    <Stack.Screen name = "TopMembers" component = {TopMembers}  options={{gestureEnabled: false}}/>
                    <Stack.Screen name = "FeedComment" component = {FeedComment}  options={{gestureEnabled: false}}/>
                    <Stack.Screen name = "ReferredFriend" component = {ReferredFriend}  options={{gestureEnabled: false}}/>
                    <Stack.Screen name = "MyWishListScreen" component = {MyWishListScreen}  options={{gestureEnabled: false}}/>
                    <Stack.Screen name = "EditProfile" component = {EditProfile}  options={{gestureEnabled: false}}/>
                    <Stack.Screen name = "MyAccountScreen" component = {MyAccountScreen}  options={{gestureEnabled: false}}/>
                    <Stack.Screen name = "NewMessage" component = {NewMessage}  options={{gestureEnabled: false}}/>
                    <Stack.Screen name = "FriendConnection" component = {FriendConnection}  options={{gestureEnabled: false}}/>
                    <Stack.Screen name = "ShowOtherUserAlbum" component = {ShowOtherUserAlbum}  options={{gestureEnabled: false}}/>
                    <Stack.Screen name = "ShowOtherUserAlbumImages" component = {ShowOtherUserAlbumImages}  options={{gestureEnabled: false}}/>
                    <Stack.Screen name = "MyTimeLine" component = {MyTimeLine}  options={{gestureEnabled: false}}/>
                    <Stack.Screen name = "Payment" component = {Payment}  options={{gestureEnabled: false}}/>
                    <Stack.Screen name = "ProfileFullImage" component = {ProfileFullImage}  options={{gestureEnabled: false}}/>
                    <Stack.Screen name = "GiftList" component = {GiftList}  options={{gestureEnabled: false}}/>
                    <Stack.Screen name = "GiftSend" component = {GiftSend}  options={{gestureEnabled: false}}/>
                    {/* <Stack.Screen name = "MyGiftScreen" component = {MyListGiftReceived} /> */}
                    

                    <Stack.Screen name = "MyRecentMessagesScreen" component = {MyRecentMessagesScreen}/>
                    
                </Stack.Navigator>
            </NavigationContainer>
        );
    }
}

