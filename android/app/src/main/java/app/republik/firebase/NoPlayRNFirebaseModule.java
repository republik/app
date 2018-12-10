package app.republik.firebase;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.DialogInterface;
import android.content.SharedPreferences;
import android.preference.PreferenceManager;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactMethod;
import com.google.android.gms.common.ConnectionResult;
import com.google.android.gms.common.GoogleApiAvailability;

import io.invertase.firebase.RNFirebaseModule;

/**
 * This class is introduced to prevent the repeated appearance of a prompt
 * to install the Google Play Services package if it is missing.
 */
public class NoPlayRNFirebaseModule extends RNFirebaseModule {

    private static final String TAG = "RNFirebase";
    private static final String NO_PLAY_PREF_KEY = "acceptNoPlayLimitations";

    public NoPlayRNFirebaseModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    public String getName() {
        return TAG;
    }

    @Override
    @ReactMethod
    public void promptForPlayServices() {
        SharedPreferences sharedPreferences =
                PreferenceManager.getDefaultSharedPreferences(getReactApplicationContext());
        boolean acceptLimitations = sharedPreferences.getBoolean(NO_PLAY_PREF_KEY, false);

        if (!acceptLimitations) {

            GoogleApiAvailability gapi = GoogleApiAvailability.getInstance();
            int status = gapi.isGooglePlayServicesAvailable(getReactApplicationContext());

            if (status != ConnectionResult.SUCCESS && gapi.isUserResolvableError(status)) {
                Activity activity = getCurrentActivity();
                if (activity != null) {
                    AlertDialog.Builder builder = new AlertDialog.Builder(activity);
                    builder.setMessage("«Google Play Services» ist auf diesem Gerät nicht installiert. Benachrichtigungen und Anmelden per App funktionieren deshalb nicht.")
                            .setPositiveButton("OK", new DialogInterface.OnClickListener() {
                                @Override
                                public void onClick(DialogInterface dialog, int which) {
                                    SharedPreferences.Editor editor = sharedPreferences.edit();
                                    editor.putBoolean(NO_PLAY_PREF_KEY, true);
                                    editor.apply();
                                }
                            })
                            .show();
                }
            }

        }

    }

}
