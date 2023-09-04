import React, { Component } from "react";
import {
    Platform,
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    Image,
    SafeAreaView,
    Dimensions,
    Alert,
    TextInput,
    Linking,
    ScrollView,
    Modal
} from "react-native";

import { stylesGlobal } from '../consts/StyleSheet';
import AutoComplete from 'react-native-autocomplete-input'



var TAG = "AutoCompleteInput";
export default class AutoCompleteInput extends React.Component {
    constructor(props) {

      super(props);

      this.state = {
        filteredCards:[],
        card_number:'',
      }
    }

    UNSAFE_componentWillMount() {

    }

    findCard(query){
      // Method called every time when we change the value of the input
        if (query) {
          // Making a case insensitive regular expression
          const regex = new RegExp(`${query.trim()}`, 'i');
          // Setting the filtered film array according the query

          var filtered = this.props.cardNumbers.filter((item) => item.search(regex) >= 0);

          this.setState({filteredCards: filtered});

          // setFilteredFilms(
          //     films.filter((film) => film.title.search(regex) >= 0)
          // );
        } else {
          // If the query is null then return blank

          this.setState({filteredCards:[]})
        }
    }
    render() {
        return (
          <AutoComplete
            autoCapitalize="none"
            autoCorrect={false}
            style={{width: '100%', height: '100%', zIndex: 11, opacity: 1}}
            containerStyle={[{width: '100%', margin: 0, padding: 0}, stylesGlobal.font, ]}
            // Data to show in suggestion
            data={this.state.filteredCards}
            // Default value if you want to set something in input
            defaultValue={
             
              this.state.card_number
            }
            // Onchange of the text changing the state of the query
            // Which will trigger the findFilm method
            // To show the suggestions
              onChangeText={(text) => {this.findCard(text); this.setState({card_number: text}); this.props.onChangeText(text)}}
              placeholder="1234 5678 9012 3456"
              keyboardType = 'number-pad' 
              flatListProps={{
                  keyboardShouldPersistTaps: 'always',
                  renderItem: ({item, index}) => (
                      // For the suggestion view
                      <TouchableOpacity
                          key={index}
                          style={{zIndex: 101, opacity: 1}}
                          onPress={() => {
                              this.setState({card_number: item, filteredCards: []});
                              this.props.onChangeText(item)
                          }}
                      >
                        <View style={{ width: '100%', backgroundColor: 'white', zIndex: 100, height: 30}}>
                            <Text style={{
                              fontSize: 15,
                              paddingTop: 5,
                              paddingBottom: 5,
                              margin: 2,
                              }}>
                                {item}
                            </Text>
                        </View>
                        
                      </TouchableOpacity>
                    )
              }}
              listContainerStyle={{
                  left: 0,
                  opacity: 1,
                  right: 0,
                  backgroundColor: 'white',
                  zIndex: 100,
                }}
          />
          )
        

    }
}


const styles = StyleSheet.create({
});