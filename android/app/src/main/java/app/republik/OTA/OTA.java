package app.republik.OTA;

import android.app.Activity;
import android.content.Context;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.widget.Toast;

import com.facebook.react.ReactApplication;
import com.facebook.react.bridge.JSBundleLoader;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.ReactInstanceManager;
import com.facebook.react.bridge.ReactMethod;

import java.io.File;
import java.lang.reflect.Field;

public class OTA extends ReactContextBaseJavaModule {

    public static String getJSBundleFile (Context context, String bundleAssetName) {
        File packageBundleFile = OTA.getCurrentPackageBundleFile(context);

        if (packageBundleFile != null && packageBundleFile.exists()) {
            Log.d("ReactNative", "Update found!!");
            return packageBundleFile.getAbsolutePath();
        } else {
            Log.d("ReactNative", "There has not been any downloaded updates");
            return "assets://" + bundleAssetName;
        }
    }

    public static File getCurrentPackageBundleFile(Context reactContext) {
        String exteralStorage = reactContext.getFilesDir().getAbsolutePath();
        File slotAActiveFile = new File(exteralStorage + "/ota/A/active");
        File slotBActiveFile = new File(exteralStorage + "/ota/B/active");

        if (slotAActiveFile.exists()) {
            return new File(exteralStorage + "/ota/A/main.jsbundle");
        }

        if (slotBActiveFile.exists()) {
            return new File(exteralStorage + "/ota/B/main.jsbundle");
        }

        return null;
    }

    public OTA(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    public String getName() {
        return "OTA";
    }

    // Use reflection to find and set the appropriate fields on ReactInstanceManager. See #556 for a proposal for a less brittle way
    // to approach this.
    private void setJSBundle(ReactInstanceManager instanceManager, String latestJSBundleFile) throws IllegalAccessException {
        try {
            JSBundleLoader latestJSBundleLoader;
            if (latestJSBundleFile.toLowerCase().startsWith("assets://")) {
                latestJSBundleLoader = JSBundleLoader.createAssetLoader(getReactApplicationContext(), latestJSBundleFile, false);
            } else {
                latestJSBundleLoader = JSBundleLoader.createFileLoader(latestJSBundleFile);
            }

            Field bundleLoaderField = instanceManager.getClass().getDeclaredField("mBundleLoader");
            bundleLoaderField.setAccessible(true);
            bundleLoaderField.set(instanceManager, latestJSBundleLoader);
        } catch (Exception e) {
            throw new IllegalAccessException("Could not setJSBundle");
        }
    }

    @ReactMethod
    public void restartApp() {
        try {
            // #1) Get the ReactInstanceManager instance, which is what includes the
            //     logic to reload the current React context.
            final ReactInstanceManager instanceManager = resolveInstanceManager();
            if (instanceManager == null) {
                return;
            }

            File latestJSBundleFile = OTA.getCurrentPackageBundleFile(getReactApplicationContext());
            String latestJSBundlePath = latestJSBundleFile.getAbsolutePath();

            // #2) Update the locally stored JS bundle file path
            setJSBundle(instanceManager, latestJSBundlePath);


            // #3) Get the context creation method and fire it on the UI thread (which RN enforces)
            new Handler(Looper.getMainLooper()).post(new Runnable() {
                @Override
                public void run() {
                    try {
                        // We don't need to resetReactRootViews anymore
                        // due the issue https://github.com/facebook/react-native/issues/14533
                        // has been fixed in RN 0.46.0
                        //resetReactRootViews(instanceManager);

                        instanceManager.recreateReactContextInBackground();
//                        mCodePush.initializeUpdateAfterRestart();
                    } catch (Exception e) {

                    }
                }
            });

        } catch (Exception e) {

        }
    }

    private ReactInstanceManager resolveInstanceManager() throws NoSuchFieldException, IllegalAccessException {
        final Activity currentActivity = getCurrentActivity();
        if (currentActivity == null) {
            return null;
        }

        ReactApplication reactApplication = (ReactApplication) currentActivity.getApplication();
        ReactInstanceManager instanceManager = reactApplication.getReactNativeHost().getReactInstanceManager();

        return instanceManager;
    }
}
