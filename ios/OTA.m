#if __has_include(<React/RCTAssert.h>)
#import <React/RCTAssert.h>
#import <React/RCTBridgeModule.h>
#import <React/RCTConvert.h>
#import <React/RCTEventDispatcher.h>
#import <React/RCTRootView.h>
#import <React/RCTUtils.h>
#else // back compatibility for RN version < 0.40
#import "RCTAssert.h"
#import "RCTBridgeModule.h"
#import "RCTConvert.h"
#import "RCTEventDispatcher.h"
#import "RCTRootView.h"
#import "RCTUtils.h"
#endif

#import "OTA.h"

@interface OTA () <RCTBridgeModule, RCTFrameUpdateObserver>
@end

@implementation OTA

RCT_EXPORT_MODULE();

- (NSArray<NSString *> *)supportedEvents
{
  return @[@"restartApp"];
}

- (void)reloadBundle
{
  NSURL *downloadedBundleUrl = [OTA downloadedBundleURL];
  
  // This needs to be async dispatched because the bridge is not set on init
  // when the app first starts, therefore rollbacks will not take effect.
  dispatch_async(dispatch_get_main_queue(), ^{
    // If the current bundle URL is using http(s), then assume the dev
    // is debugging and therefore, shouldn't be redirected to a local
    // file (since Chrome wouldn't support it). Otherwise, update
    // the current bundle URL to point at the latest update
  
    if (![super.bridge.bundleURL.scheme hasPrefix:@"http"]) {
      [super.bridge setValue:[downloadedBundleUrl absoluteString] forKey:@"bundleURL"];
    }
    
    [super.bridge reload];
  });
}

+ (NSURL *)binaryBundleURL {
  return [[NSBundle mainBundle] URLForResource:@"main"
                                 withExtension:@"jsbundle"
                                  subdirectory:nil];
}

+ (NSURL *)downloadedBundleURL {
  BOOL isDir = NO;

  NSString *documentPath = [NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES) lastObject];
  NSString *slotAActivePath = [documentPath stringByAppendingString:@"/ota/A/active"];
  NSString *slotBActivePath = [documentPath stringByAppendingString:@"/ota/B/active"];
  
  BOOL slotAActiveExists = [[NSFileManager defaultManager] fileExistsAtPath:slotAActivePath isDirectory:&isDir];
  BOOL slotBActiveExists = [[NSFileManager defaultManager] fileExistsAtPath:slotBActivePath isDirectory:&isDir];
  
  if (slotAActiveExists) {
    NSString *slotABundlePath = [documentPath stringByAppendingString:@"/ota/A/main.jsbundle"];
    return [[NSURL alloc] initFileURLWithPath:slotABundlePath];
  }
  
  if (slotBActiveExists) {
    NSString *slotBBundlePath = [documentPath stringByAppendingString:@"/ota/B/main.jsbundle"];
    return [[NSURL alloc] initFileURLWithPath:slotBBundlePath];
  }
  
  return nil;
}

+ (NSURL *)bundleURL {
  NSURL *downloadedBundleUrl = [self downloadedBundleURL];

  if (downloadedBundleUrl) {
    return downloadedBundleUrl;
  } else {
    return [self binaryBundleURL];
  }
}

+ (void)clearBundle {
  BOOL isDir = NO;

  NSString *documentPath = [NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES) lastObject];
  NSString *slotABundlePath = [documentPath stringByAppendingString:@"/ota/A/main.jsbundle"];
  NSString *slotBBundlePath = [documentPath stringByAppendingString:@"/ota/B/main.jsbundle"];
  
  BOOL slotABundleExists = [[NSFileManager defaultManager] fileExistsAtPath:slotABundlePath isDirectory:&isDir];
  BOOL slotBBundleExists = [[NSFileManager defaultManager] fileExistsAtPath:slotBBundlePath isDirectory:&isDir];
  
  if (slotABundleExists) {
    [[NSFileManager defaultManager] removeItemAtPath:slotABundlePath error:NULL];
  }
  
  if (slotBBundleExists) {
    [[NSFileManager defaultManager] removeItemAtPath:slotBBundlePath error:NULL];
  }
}

@synthesize pauseCallback;
@synthesize paused;

- (void)didUpdateFrame:(RCTFrameUpdate *)update {
  
}

RCT_EXPORT_METHOD(restartApp)
{
  [self reloadBundle];
  return;
}

@end
