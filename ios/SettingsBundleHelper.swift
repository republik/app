//
//  SettingsBundleHelper.swift
//  orbitingapp
//
//  Created by Diego Muracciole on 6/26/18.
//

import Foundation
class SettingsBundleHelper {
  struct SettingsBundleKeys {
    static let BuildVersionKey = "build_preference"
    static let AppVersionKey = "version_preference"
  }
  
  class func setVersionAndBuildNumber() {
    let version: String = Bundle.main.object(forInfoDictionaryKey: "CFBundleShortVersionString") as! String
    UserDefaults.standard.set(version, forKey: "version_preference")
    let build: String = Bundle.main.object(forInfoDictionaryKey: "CFBundleVersion") as! String
    UserDefaults.standard.set(build, forKey: "build_preference")
  }
}
