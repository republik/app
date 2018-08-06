#import "OTA.h"

@implementation OTA

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


@end
