import { Alert as NativeAlert } from 'react-native';

const defaultButtons = (resolve, reject) => [
  {
    text: 'OK',
    onPress: () => {
      resolve();
      
    },
  },
];

const AsyncAlert = (title, msg, getButtons = defaultButtons) =>
  new Promise((resolve, reject) => {
    NativeAlert.alert(title, msg, getButtons(resolve, reject), { cancelable: false });
  });

export default AsyncAlert;