package app.republik.firebase;

import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;

import java.util.ArrayList;
import java.util.List;

/**
 * This class is needed as a wrapper to instantiate an object of @{@link NoPlayRNFirebaseModule}
 * instead of @{@link io.invertase.firebase.RNFirebaseModule}
 */
@SuppressWarnings("unused")
public class NoPlayRNFirebasePackage extends io.invertase.firebase.RNFirebasePackage {

  /**
   * @see @{@link io.invertase.firebase.RNFirebasePackage}
   */
  @Override
  public List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {
    List<NativeModule> modules = new ArrayList<>();
    modules.add(new NoPlayRNFirebaseModule(reactContext));
    return modules;
  }

}
