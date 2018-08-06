#if __has_include(<React/RCTEventEmitter.h>)
#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>
#elif __has_include("RCTEventEmitter.h")
#import "RCTBridgeModule.h"
#import "RCTEventEmitter.h"
#else
#import "React/RCTBridgeModule.h"
#import "React/RCTEventEmitter.h"
#endif

#import <Foundation/Foundation.h>

@interface OTA : RCTEventEmitter <RCTBridgeModule>

+ (NSURL *)bundleURL;
+ (void)clearBundle;
- (void)reloadBundle;

@end
