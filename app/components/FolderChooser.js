import React, { Component, Fragment } from "react";
import {
    Platform,
    StyleSheet,
    Text,
    View,
    TextInput,
    ScrollView,
    Dimensions,
    Image,
    TouchableOpacity,
    Alert,
    SafeAreaView,
    Linking,
    Keyboard,
    KeyboardAvoidingView,
    Modal
} from "react-native";

import { stylesGlobal, STICKY_HEADER_HEIGHT } from '../consts/StyleSheet';

import { writeFile, readFile, readDir, DocumentDirectoryPath, DownloadDirectoryPath, LibraryDirectoryPath } from 'react-native-fs';
import { Colors } from "../consts/Colors";
const { width, height } = Dimensions.get("window");


var TAG = "FolderChooser";


export default class FolderChooser extends React.Component {



    getChildFolders() {
        let resChilds = [];

        return resChilds
    }


    constructor(props) {
        super(props);
        this.state = {
            currentFolder: [],
            currentChilds:[],
            // currentPath: 'root',
            // childList: ['root', DocumentDirectoryPath, DownloadDirectoryPath, LibraryDirectoryPath],
            // rootName: 'root',
            // initialChilds: [DocumentDirectoryPath, DownloadDirectoryPath, LibraryDirectoryPath]
        }
    }



    
    UNSAFE_componentWillMount(){
        console.log(TAG);

        this.setState({
            currentFolder:[],
            currentChilds: [
                {
                    uri: DocumentDirectoryPath,
                    name: this.getDirectoryName(DocumentDirectoryPath),
                    parentUri: '',
                },
                {
                    uri: DownloadDirectoryPath,
                    name: this.getDirectoryName(DownloadDirectoryPath),
                    parentUri: '',
                },
                {
                    uri: LibraryDirectoryPath,
                    name: this.getDirectoryName(LibraryDirectoryPath),
                    parentUri: '',
                }
            ]
        })
    }


    getDirectoryName(path){
        if(!path || path == "")
            return "";
        var words = path.split('/');
        if(words.length > 0)
            return words[words.length - 1];
        return path;
    }

    generatePathByNames(){
        let res = "";
        this.state.currentFolder.forEach(item => {
            res += item.name + "/";
        });
        if(res === "")
            res = "/";
        return res;
    }

    selectedFolder(item) {

    }

    async openFolder(folderItem) {
        console.log(TAG, 'open folder  ', folderItem.name);
        
        const readFilesAndDir = await readDir(folderItem.uri);
        const dirs = readFilesAndDir.filter(item => item.isDirectory());
        if(dirs && dirs.length > 0)
        {
            

            var tmpChilds = dirs.map(item => {
                return {uri: item.path, name: item.name};
            });

            this.setState({
                currentChilds: tmpChilds,
            });



        }else{


            this.setState({
                currentChilds: [{name: '.', uri: '/'}],
            });
        }
        console.log(JSON.stringify(dirs));
    }

 
    gotoRoot(){
        this.setState({
            currentFolder:[],
            currentChilds: [
                {
                    uri: DocumentDirectoryPath,
                    name: this.getDirectoryName(DocumentDirectoryPath),
                    parentUri: '',
                },
                {
                    uri: DownloadDirectoryPath,
                    name: this.getDirectoryName(DownloadDirectoryPath),
                    parentUri: '',
                },
                {
                    uri: LibraryDirectoryPath,
                    name: this.getDirectoryName(LibraryDirectoryPath),
                    parentUri: '',
                }
            ]
        })
    }

   

    async upTo(){
        console.log(TAG, 'upto', this.state.currentFolder);
        if( this.state.currentFolder.length > 0)
        {
            await this.openFolder(this.state.currentFolder[this.state.currentFolder.length - 1]);
        }else {
                this.setState({
                    currentFolder: [], 
                    currentChilds: [
                        {
                            uri: DocumentDirectoryPath,
                            name: this.getDirectoryName(DocumentDirectoryPath),
                            parentUri: '',
                        },
                        {
                            uri: DownloadDirectoryPath,
                            name: this.getDirectoryName(DownloadDirectoryPath),
                            parentUri: '',
                        },
                        {
                            uri: LibraryDirectoryPath,
                            name: this.getDirectoryName(LibraryDirectoryPath),
                            parentUri: '',
                        }
                    ]
                });
        }
        
    }

     renderRootItems(folderItem, index){
        let folderName = folderItem.name
        return (
            <TouchableOpacity key={index} onPress={() => {
                if(folderItem.name === '.')
                    return;
                this.setState({currentFolder: [...this.state.currentFolder, folderItem]}, async () => {await this.openFolder(folderItem)});
                }}>
                <View style={styles.directoryItem}>
                    <Text>{folderName}</Text>
                </View>
            </TouchableOpacity>
            )
    }


    render()
    {
        let filteredChilds = this.state.currentChilds.filter(item => item.uri && item.uri.length > 0);
        return(
            <View style={{width: '100%', padding: 10, }} >
                <View style={{marginBottom: 5}}><Text style={[stylesGlobal.font, {fontSize: 15}]}> Please select folder to save the file </Text></View>
                <View style={{marginBottom: 5}}><Text style={[stylesGlobal.font, {fontSize: 15, fontWeight: 'bold'}]}>{this.generatePathByNames()} </Text></View>
                <View style={{width: '100%', justifyContent: 'center', height: 200, marginTop: 5}}>
                    <ScrollView>
                        {this.state.currentFolder.length > 0 && 
                             <TouchableOpacity onPress={() => this.gotoRoot()}>
                                <View style={[styles.directoryItem, {borderColor: '#bbb'} ]}>
                                    <Text>Go to root</Text>
                                </View>
                            </TouchableOpacity>
                        }
                       
                        <TouchableOpacity onPress={() => {
                            if( this.state.currentFolder.length > 0)
                            {
                                var tmp = this.state.currentFolder.slice(0, this.state.currentFolder.length - 1);
                                this.setState({currentFolder: tmp}, async () => { await this.upTo()});
                            }
                        }
                            
                        }>
                            <View style={[styles.directoryItem, {borderColor: '#bbb'}]}>
                                {/* <Text>{this.generatePathByNames()}</Text> */}
                                <Text>..</Text>
                            </View>
                        </TouchableOpacity>
                        {
                            filteredChilds.map((item, index) => this.renderRootItems(item, index))
                        }
                    </ScrollView>
                    
                </View>
            </View>
        )
    }
}

const styles = {
    directoryItem: {
        borderWidth: 1,
        borderRadius: 5,
        padding: 5,
        marginBottom: 5,
        borderColor: Colors.gold
    }
}