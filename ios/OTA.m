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
  NSString *documentPath = [NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES) lastObject];
  NSString *bundlePath = [documentPath stringByAppendingString:@"/latest.jsbundle"];
  // This needs to be async dispatched because the bridge is not set on init
  // when the app first starts, therefore rollbacks will not take effect.
  dispatch_async(dispatch_get_main_queue(), ^{
    // If the current bundle URL is using http(s), then assume the dev
    // is debugging and therefore, shouldn't be redirected to a local
    // file (since Chrome wouldn't support it). Otherwise, update
    // the current bundle URL to point at the latest update
  
    if (![super.bridge.bundleURL.scheme hasPrefix:@"http"]) {
      [super.bridge setValue:bundlePath forKey:@"bundleURL"];
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
  NSString *documentPath = [NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES) lastObject];
  NSString *bundlePath = [documentPath stringByAppendingString:@"/latest.jsbundle"];
  BOOL isDir = NO;
  BOOL exists = [[NSFileManager defaultManager] fileExistsAtPath:bundlePath isDirectory:&isDir];
  if (!exists) {
    return nil;
  } else {
    return [[NSURL alloc] initFileURLWithPath:bundlePath];
  }
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
  NSString *documentPath = [NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES) lastObject];
  NSString *bundlePath = [documentPath stringByAppendingString:@"/latest.jsbundle"];
  BOOL isDir = NO;
  BOOL exists = [[NSFileManager defaultManager] fileExistsAtPath:bundlePath isDirectory:&isDir];
  if (exists) {
    [[NSFileManager defaultManager] removeItemAtPath:bundlePath error:NULL];
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
