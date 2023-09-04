import React, {Component} from "react";
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import SellCoins from "./SellCoins";
import SellCoinsCard from "./SellCoinsCard";

const SellCoinStack = createStackNavigator();

export default class SellGoldCoinNavigator extends Component {

    constructor(props) {
        super(props);
        
    }

    render() {
        return (
            // <NavigationContainer>
                <SellCoinStack.Navigator screenOptions = {{headerShown: false}}>
                    <SellCoinStack.Screen name = "SellCoins" component = {SellCoins}/>
                    <SellCoinStack.Screen name = "SellCoinsCard" component = {SellCoinsCard}/>
                </SellCoinStack.Navigator>
            // </NavigationContainer>
        );
    }
}
