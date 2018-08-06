package app.republik;

import android.app.Application;

import app.republik.CustomWebView.CustomWebViewPackage;
import com.facebook.react.ReactApplication;
import com.RNFetchBlob.RNFetchBlobPackage;
import guichaguri.trackplayer.TrackPlayer;

import com.learnium.RNDeviceInfo.RNDeviceInfo;
import com.psykar.cookiemanager.CookieManagerPackage;
import io.invertase.firebase.RNFirebasePackage;
import io.invertase.firebase.messaging.RNFirebaseMessagingPackage;
import io.invertase.firebase.notifications.RNFirebaseNotificationsPackage;
import com.lugg.ReactNativeConfig.ReactNativeConfigPackage;
import app.republik.BuildConfig;

import android.util.Log;
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
        File packageBundleFile = this.getCurrentPackageBundleFile();

        if (packageBundleFile.exists()) {
            Log.d("ReactNative", "Update found!!");
            return packageBundleFile.getAbsolutePath();

        } else {
            Log.d("ReactNative", "There has not been any downloaded updates");
            // There has not been any downloaded updates.
            return "assets://" + this.getBundleAssetName();
        }
    }

    private File getCurrentPackageBundleFile() {
        String exteralStorage = getApplicationContext().getFilesDir().getAbsolutePath();
        return new File(exteralStorage + "/latest.jsbundle");
    }

    @Override
    public boolean getUseDeveloperSupport() {
      return BuildConfig.DEBUG;
    }

    @Override
    protected List<ReactPackage> getPackages() {
      return Arrays.<ReactPackage>asList(
          new MainReactPackage(),
            new RNFetchBlobPackage(),
            new TrackPlayer(),
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
