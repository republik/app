package app.republik;

import android.app.Application;

import app.republik.OTA.OTA;
import app.republik.OTA.OTAPackage;
import app.republik.CustomWebView.CustomWebViewPackage;
import android.content.Context;
import com.facebook.react.ReactApplication;
import com.rnziparchive.RNZipArchivePackage;
import com.RNFetchBlob.RNFetchBlobPackage;
import com.guichaguri.trackplayer.TrackPlayer;

// react-native link: react-native-notifications is not used on Android

import com.facebook.react.bridge.ReactApplicationContext;
import com.learnium.RNDeviceInfo.RNDeviceInfo;
import com.psykar.cookiemanager.CookieManagerPackage;
import io.invertase.firebase.RNFirebasePackage;
import io.invertase.firebase.messaging.RNFirebaseMessagingPackage;
import io.invertase.firebase.notifications.RNFirebaseNotificationsPackage;
import com.lugg.ReactNativeConfig.ReactNativeConfigPackage;
import app.republik.BuildConfig;

import org.devio.rn.splashscreen.SplashScreenReactPackage;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.react.shell.MainReactPackage;
import com.facebook.soloader.SoLoader;

import java.io.File;
import java.util.Arrays;
import java.util.List;

public class MainApplication extends Application implements ReactApplication {
  private final ReactNativeHost mReactNativeHost = new ReactNativeHost(this) {

    @Override
    protected String getJSBundleFile() {
        Context context = getApplicationContext();
        String bundleAssetName = this.getBundleAssetName();
        return OTA.getJSBundleFile(context, bundleAssetName);
    }

    @Override
    public boolean getUseDeveloperSupport() {
      return BuildConfig.DEBUG;
    }

    @Override
    protected List<ReactPackage> getPackages() {
      return Arrays.<ReactPackage>asList(
          new MainReactPackage(),
          new RNZipArchivePackage(),
          new RNFetchBlobPackage(),
          new TrackPlayer(),
          new OTAPackage(),
          new SplashScreenReactPackage(),
          new RNFirebasePackage(),
          new RNDeviceInfo(),
          new CookieManagerPackage(),
          new ReactNativeConfigPackage(),
          new RNFirebaseMessagingPackage(),
          new RNFirebaseNotificationsPackage(),
          new CustomWebViewPackage()
      );
    }

    @Override
    protected String getJSMainModuleName() {
      return "index";
    }
  };

  @Override
  public ReactNativeHost getReactNativeHost() {
    return mReactNativeHost;
  }

  @Override
  public void onCreate() {
    super.onCreate();
    SoLoader.init(this, /* native exopackage */ false);
  }
}
