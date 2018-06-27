/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "AppDelegate.h"
#import <CodePush/CodePush.h>
#import <React/RCTPushNotificationManager.h>

#import <React/RCTLinkingManager.h>
#import <React/RCTBundleURLProvider.h>
#import <React/RCTRootView.h>
#import "ReactNativeConfig.h"
#import "SplashScreen.h"

@implementation AppDelegate

-(void)setupSettings
{
  NSDictionary *env = ReactNativeConfig.env;
  NSString *appVersion = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"CFBundleShortVersionString"];
  NSString *buildNumber = [[NSBundle mainBundle] objectForInfoDictionaryKey:(NSString *)kCFBundleVersionKey];
  NSString *applicationUrl = [[NSUserDefaults standardUserDefaults] stringForKey:@"application_url"];
  NSString *graphQLUrl = [[NSUserDefaults standardUserDefaults] stringForKey:@"graphql_url"];
  NSString *wsUrl = [[NSUserDefaults standardUserDefaults] stringForKey:@"ws_url"];
  NSString *assetsUrl = [[NSUserDefaults standardUserDefaults] stringForKey:@"assets_url"];
  
  [[NSUserDefaults standardUserDefaults] setObject:appVersion forKey:@"version_preference"];
  [[NSUserDefaults standardUserDefaults] setObject:buildNumber forKey:@"build_preference"];
  [[NSUserDefaults standardUserDefaults] setObject:[env objectForKey:@"ENV"] forKey:@"environment_preference"];
  
  if ([applicationUrl length] == 0) {
    [[NSUserDefaults standardUserDefaults] setObject:[env objectForKey:@"FRONTEND_BASE_URL"] forKey:@"application_url"];
  }
  
  if ([graphQLUrl length] == 0) {
    [[NSUserDefaults standardUserDefaults] setObject:[env objectForKey:@"API_URL"] forKey:@"graphql_url"];
  }
  
  if ([wsUrl length] == 0) {
    [[NSUserDefaults standardUserDefaults] setObject:[env objectForKey:@"API_WS_URL"] forKey:@"ws_url"];
  }
  
  if ([assetsUrl length] == 0) {
    [[NSUserDefaults standardUserDefaults] setObject:[env objectForKey:@"ASSETS_SERVER_BASE_URL"] forKey:@"assets_url"];
  }
}

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  
  [self setupSettings];

  NSURL *jsCodeLocation;

  
    #ifdef DEBUG
        jsCodeLocation = [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index" fallbackResource:nil];
    #else
        jsCodeLocation = [CodePush bundleURL];
    #endif

  RCTRootView *rootView = [[RCTRootView alloc] initWithBundleURL:jsCodeLocation
                                                      moduleName:@"orbitingapp"
                                               initialProperties:nil
                                                   launchOptions:launchOptions];
  rootView.backgroundColor = [[UIColor alloc] initWithRed:1.0f green:1.0f blue:1.0f alpha:1];

  self.window = [[UIWindow alloc] initWithFrame:[UIScreen mainScreen].bounds];
  UIViewController *rootViewController = [UIViewController new];
  rootViewController.view = rootView;
  self.window.rootViewController = rootViewController;
  [self.window makeKeyAndVisible];
  [SplashScreen show];
  return YES;
}

// Required to register for notifications
- (void)application:(UIApplication *)application didRegisterUserNotificationSettings:(UIUserNotificationSettings *)notificationSettings
{
  [RCTPushNotificationManager didRegisterUserNotificationSettings:notificationSettings];
}
// Required for the register event.
- (void)application:(UIApplication *)application didRegisterForRemoteNotificationsWithDeviceToken:(NSData *)deviceToken
{
  [RCTPushNotificationManager didRegisterForRemoteNotificationsWithDeviceToken:deviceToken];
}
// Required for the notification event. You must call the completion handler after handling the remote notification.
- (void)application:(UIApplication *)application didReceiveRemoteNotification:(NSDictionary *)userInfo
fetchCompletionHandler:(void (^)(UIBackgroundFetchResult))completionHandler
{
  [RCTPushNotificationManager didReceiveRemoteNotification:userInfo fetchCompletionHandler:completionHandler];
}
// Required for the registrationError event.
- (void)application:(UIApplication *)application didFailToRegisterForRemoteNotificationsWithError:(NSError *)error
{
  [RCTPushNotificationManager didFailToRegisterForRemoteNotificationsWithError:error];
}
// Required for the localNotification event.
- (void)application:(UIApplication *)application didReceiveLocalNotification:(UILocalNotification *)notification
{
  [RCTPushNotificationManager didReceiveLocalNotification:notification];
}

// Deep linking setup
- (BOOL)application:(UIApplication *)application openURL:(NSURL *)url
  sourceApplication:(NSString *)sourceApplication annotation:(id)annotation
{
  return [RCTLinkingManager application:application openURL:url
                      sourceApplication:sourceApplication annotation:annotation];
}

// Only if your app is using [Universal Links](https://developer.apple.com/library/prerelease/ios/documentation/General/Conceptual/AppSearch/UniversalLinks.html).
- (BOOL)application:(UIApplication *)application continueUserActivity:(NSUserActivity *)userActivity
 restorationHandler:(void (^)(NSArray * _Nullable))restorationHandler
{
  return [RCTLinkingManager application:application
                   continueUserActivity:userActivity
                     restorationHandler:restorationHandler];
}

@end
