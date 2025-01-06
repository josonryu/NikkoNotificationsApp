/// <reference path="../reference.d.ts" />
App
    .service('AppBizCamera', ['logicCom', 'XmlSerializerUtil', 'AppComWindow',  function (logicCom, XmlSerializerUtil, AppComWindow) {
    // 運転免許書OCR初期化済みフラグ
    var ocrInited = false;
    // カメラスキャナ初期化済みフラグ
    var scanInited = false;
    var imagePath = cordova.file.dataDirectory + 'camera/imagebase64.txt';
    var settingsPath = cordova.file.dataDirectory + 'camera/settings.xml';
    /**
     * 運転免許書OCRプラグインの初期化を行う。
     *
     * @param {successCallback} successCallback - 成功時のコールバック関数
     * @param {errorCallback} errorCallback - 失敗時のコールバック関数
     *
     */
    this.initCamOcr = function (successCallback, errorCallback) {
        // 何もしない
        ocrInited = true;
        successCallback();
    };
    /**
     * 運転免許書OCRプラグインのカメラ起動を行う。
     *
     * @param {successCallback} successCallback - 成功時のコールバック関数
     * @param {errorCallback} errorCallback - 失敗時のコールバック関数
     * @param {cancelCallback} cancelCallback - キャンセル時のコールバック関数
     *
     */
    this.startCamOcr = function (successCallback, errorCallback, cancelCallback) {
        return this.startCamScan(successCallback, errorCallback, cancelCallback);
        // new Promise((resolve, reject) => {
        //     // プラグイン初期化
        //     try {
        //         // PDLCameraOcr.prepareResource(function () {
        //         //     // 初期化済みとする
        //             ocrInited = true;
        //         //     return resolve();
        //         // }, function (error) {
        //         //     return reject(error);
        //         // });
        //     }
        //     catch (error) {
        //         return reject(error);
        //     }
        // }).then(() => {
        //     return new Promise((resolve, reject) => {
        //         try {
        //             return resolve({});
        //             PDLCameraOcr.captureOnce2(function (camInfo) {
        //                 // successCallback
        //                 return resolve(camInfo);
        //             }, function (error) {
        //                 if ((-3001 == error.code) || (-4003 == error.code) || (-4004 == error.code)) {
        //                     // リトライ可能なエラーの場合はシステムエラーとしない
        //                     var xhr = new XMLHttpRequest();
        //                     xhr.onload = function () {
        //                         var reader = new FileReader();
        //                         reader.onloadend = function () {
        //                             // successCallback
        //                             var camInfo = {
        //                                 mode: 0,
        //                                 cardType: -1,
        //                                 // 画像データは再撮影を促すイメージを設定
        //                                 image: reader.result.replace(RegExp('data:;base64,', 'g'), '')
        //                             };
        //                             return resolve(camInfo);
        //                         };
        //                         reader.readAsDataURL(xhr.response);
        //                     };
        //                     xhr.open('GET', 'images/NoImage.jpg');
        //                     xhr.responseType = 'blob';
        //                     xhr.send();
        //                 }
        //                 else {
        //                     // errorCallback
        //                     return reject(error);
        //                 }
        //             }, function () {
        //                 // cancelCallback
        //                 var error = "cancelCallback";
        //                 return reject(error);
        //             });
        //         }
        //         catch (error) {
        //             errorCallback(error);
        //         }
        //     });
        // }).then((camInfo) => {
        //     return new Promise((resolve, reject) => {
        //         // プラグイン終了
        //         try {
        //             // PDLCameraOcr.deinitResource(function () {
        //                 return resolve(camInfo);
        //             // }, function (error) {
        //             //     return reject(error);
        //             // });
        //         }
        //         catch (error) {
        //             reject(error);
        //         }
        //     });
        // }).then((camInfo) => {
        //     // 成功
        //     return successCallback(camInfo);
        // }).catch((error) => {
        //     if (error == "cancelCallback") {
        //         // キャンセル
        //         return cancelCallback();
        //     }
        //     else {
        //         // 失敗
        //         return errorCallback(error);
        //     }
        // });
    };
    /**
     * 運転免許書OCRラグインの終了を行う。
     *
     * @param {successCallback} successCallback - 成功時のコールバック関数
     * @param {errorCallback} errorCallback - 失敗時のコールバック関数
     *
     */
    this.deinitCamOcr = function (successCallback, errorCallback) {
        // 何もしない
        successCallback();
    };
    /**
     * カメラスキャナプラグインの初期化を行う。
     *
     * @param {successCallback} successCallback - 成功時のコールバック関数
     * @param {errorCallback} errorCallback - 失敗時のコールバック関数
     *
     */
    this.initCamScan = function (successCallback, errorCallback) {
        // 何もしない
        scanInited = true;
        successCallback();
    };
    this.launchCameraApp = function (successCallback, errorCallback) {
        if (window.Windows && Windows.ApplicationModel.FullTrustProcessLauncher) {
            try {
                AppComWindow.exitFullScreen(function () {
                    Windows.ApplicationModel.FullTrustProcessLauncher.launchFullTrustProcessForCurrentAppAsync();
                    const checkCameraStatus = function () {
                        self.getCamSettings(function (settings) {
                            if (settings && settings['CameraScreenStatus'] === '0') {
                                return successCallback();
                            }
                            setTimeout(checkCameraStatus, 500);
                        }, errorCallback);
                    }
                    setTimeout(checkCameraStatus, 500);
                }, errorCallback);
            } catch (error) {
                AppComWindow.enterFullScreen();
                errorCallback(error);
            }
        } else {
            errorCallback();
        }
    };
    this.getScanInfo = function (successCallback, errorCallback, cancelCallback) {
        var tryGetScanInfo = function () {
            self.getCamSettings(function (settings) {
                if (settings) {
                    var { CameraScreenStatus, ImageFileExists, ScanPhotoMode, CameraScanErrorCode } = settings;
                    if (CameraScreenStatus === '0' && ImageFileExists !== '0' && CameraScanErrorCode !== '1') {
                        setTimeout(tryGetScanInfo, 500);
                    } else if (ImageFileExists === '0') {
                        return logicCom.readFileTxtData(imagePath, (image) => {
                            return successCallback({ mode: Number(ScanPhotoMode), image });
                        }, (error) => {
                            return errorCallback(error);
                        });
                    } else if (CameraScanErrorCode === '1') {
                        return cancelCallback();
                    } else if (CameraScreenStatus === '1') {
                        return errorCallback();
                    } else {
                        return errorCallback();
                    }
                } else {
                    return errorCallback();
                }
            }, function () { });
        }
        tryGetScanInfo();
    };
    this.clearCamInfo = function (successCallback, errorCallback) {
        new Promise((resolve, reject) => {
            logicCom.fileDelete(imagePath, function () {
                return resolve();
            }, function () {
                return resolve();
            });
        }).then(() => {
            return new Promise((resolve, reject) => {
                logicCom.fileDelete(settingsPath, function () {
                    return resolve();
                }, function () {
                    return resolve();
                });
            })
        }).then(() => {
            return successCallback();
        }).catch((error) => {
            return errorCallback(error);
        });
    };
    /**
     * カメラスキャナプラグインのカメラ起動を行う。
     *
     * @param {successCallback} successCallback - 成功時のコールバック関数
     * @param {errorCallback} errorCallback - 失敗時のコールバック関数
     * @param {cancelCallback} cancelCallback - キャンセル時のコールバック関数
     *
     */
    this.startCamScan = function (successCallback, errorCallback, cancelCallback) {
        new Promise((resolve, reject) => {
            // インジケーター表示
            $('main').addClass('loadingCircle_blur');
            $('body').append('<div id="overlay"></div>');
            $('#overlay').append('<img class="loadingCircle" src="./images/loadingCircle.svg" draggable="false"></img>');
            self.launchCameraApp(function () {
                return resolve();
            }, function (error) {
                return reject(error);
            });
        })
        .then(() => {
            return new Promise((resolve, reject) => {
                self.getScanInfo(function (camInfo) {
                    // successCallback
                    return resolve(camInfo);
                }, function (error) {
                    // errorCallback
                    return reject(error);
                }, function () {
                    // cancelCallback
                    var error = "cancelCallback";
                    return reject(error);
                });
            });
        }).then((camInfo) => {
            // 成功
            return successCallback(camInfo);
        }).catch((error) => {
            if (error == "cancelCallback") {
                // キャンセル
                return cancelCallback();
            }
            else {
                // 失敗
                return errorCallback(error);
            }
        }).finally(() => {
            // インジケータ削除
            $('#overlay').remove();
            $('main').removeClass('loadingCircle_blur');
            AppComWindow.enterFullScreen();
            self.deinitCamScan(() => { }, () => { });
        });
        // new Promise((resolve, reject) => {
        //     // プラグイン初期化
        //     try {
        //         PDLCameraScan.prepareResource(function () {
        //             // 初期化済みとする
        //             ocrInited = true;
        //             return resolve();
        //         }, function (error) {
        //             return reject(error);
        //         });
        //     }
        //     catch (error) {
        //         return reject(error);
        //     }
        // }).then(() => {
        //     return new Promise((resolve, reject) => {
        //         try {
        //             PDLCameraScan.captureOnce2(function (camInfo) {
        //                 // successCallback
        //                 return resolve(camInfo);
        //             }, function (error) {
        //                 // errorCallback
        //                 return reject(error);
        //             }, function () {
        //                 // cancelCallback
        //                 var error = "cancelCallback";
        //                 return reject(error);
        //             });
        //         }
        //         catch (error) {
        //             errorCallback(error);
        //         }
        //     });
        // }).then((camInfo) => {
        //     return new Promise((resolve, reject) => {
        //         // プラグイン終了
        //         try {
        //             PDLCameraScan.deinitResource(function () {
        //                 return resolve(camInfo);
        //             }, function (error) {
        //                 return reject(error);
        //             });
        //         }
        //         catch (error) {
        //             reject(error);
        //         }
        //     });
        // }).then((camInfo) => {
        //     // 成功
        //     return successCallback(camInfo);
        // }).catch((error) => {
        //     if (error == "cancelCallback") {
        //         // キャンセル
        //         return cancelCallback();
        //     }
        //     else {
        //         // 失敗
        //         return errorCallback(error);
        //     }
        // });
    };
    /**
     * カメラスキャナラグインの終了を行う。
     *
     * @param {successCallback} successCallback - 成功時のコールバック関数
     * @param {errorCallback} errorCallback - 失敗時のコールバック関数
     *
     */
    this.deinitCamScan = function (successCallback, errorCallback) {
        self.clearCamInfo(successCallback, errorCallback);
    };
    this.getCamSettings = function (successCallback, errorCallback) {
        new Promise((resolve, reject) => {
            logicCom.existsFile(settingsPath, (isExists) => {
                if (isExists) {
                    return resolve();
                } else {
                    return successCallback();
                }
            });
        }).then(() => {
            return new Promise((resolve, reject) => {
                logicCom.readFileTxtData(settingsPath, (xmlString) => {
                    return resolve(xmlString);
                }, (error) => {
                    return reject(error);
                });
            });
        }).then((xmlString) => {
            return new Promise((resolve, reject) => {
                if (!xmlString)
                    return reject();
                var xmlDoc = XmlSerializerUtil.deserialize(xmlString);
                if (!xmlDoc)
                    return reject();
                var xmlObj = {};
                var rootElement = xmlDoc.documentElement;
                for (let i = 0; i < rootElement.children.length; i++) {
                    const child = rootElement.children[i];
                    const elementName = child.nodeName;
                    const elementValue = child.textContent || null;
                    xmlObj[elementName] = elementValue;
                }
                return successCallback(xmlObj);
            });
        }).catch((error) => {
            return errorCallback(error);
        });
    };
    this.setCamSettings = function (settings, successCallback, errorCallback) {
        self.getCamSettings(function (settings) {
            if (settings) {
                
            }
            setTimeout(tryExitFullScreen, 300);
        }, function () { });
    }
    var self = this;
}])