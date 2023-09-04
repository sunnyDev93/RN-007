package com.the007.the007percentapp;

import android.os.Bundle;

import com.facebook.react.ReactActivity;
import com.facebook.react.ReactPackage;
import com.facebook.react.shell.MainReactPackage;

import org.devio.rn.splashscreen.SplashScreen;

import java.util.Arrays;
import java.util.List;

import io.invertase.firebase.messaging.ReactNativeFirebaseMessagingPackage;

public class MainActivity extends ReactActivity {

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  @Override
  protected void onCreate(Bundle savedInstanceState) {
//    SplashScreen.show(this);  // here
    super.onCreate(savedInstanceState);
  }

  @Override
  protected String getMainComponentName() {
    return "The007Percent";
  }

  protected List<ReactPackage> getPackages() {
    return Arrays.asList(
      new MainReactPackage(),
      new ReactNativeFirebaseMessagingPackage()
    );
  }

}
