var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
/// <reference path="../reference.d.ts" />
/*
    修正履歴
    2021/05/27 【ｉＰａｄ口座開設・事務手続きアプリ】ｉＯＳ１４対応のバージョンアップ　CAC大橋
   「正確な位置情報」の一時権限請求を追加
 */
App.controller('splashController', ['$scope', '$location', '$controller', '$interval', '$timeout', 'appConst', 'AppCom', 'AppBizCom', 'logicCom', 'AppComWindow', 'dbInfoConst', 'slsDelete', 'logFileSend', 'APP_MODE', 'APL_KBN', 'APL_NAME', 'CURRENT_CONFIG', 'TEST_CONFIG',
    function ($scope, $location, $controller, $interval, $timeout, appConst, AppCom, AppBizCom, logicCom, AppComWindow, dbInfoConst, slsDelete, logFileSend, APP_MODE, APL_KBN, APL_NAME, CURRENT_CONFIG, TEST_CONFIG) {
        // 共通部分制御を継承
        $controller('errorInfoModalCtrl', { $scope: $scope });
        AppComWindow.enterFullScreen();
        AppComWindow.lockScreenOrientation();
        
        // マスタファイル定義
        var MAST_FILE = {
            END_FILE_NAME: 'end.txt',
            DB: {
                // DBファイル名
                FILE_NAME: 'apl.db',
                // コピー元アプリDBファイル格納ディレクトリ
                SRC_DIR: cordova.file.applicationDirectory + 'www/pre_copy_file/db/',
                // コピー先アプリDBファイル格納ディレクトリ(ルートディレクトリ)
                TARGET_ROOT_DIR: cordova.file.dataDirectory + 'Library/',
                // コピー先アプリDBファイル格納ディレクトリ
                TARGET_DIR: cordova.file.dataDirectory + 'Library/LocalDatabase/',
                TARGET_BASE_DIR: cordova.file.dataDirectory,
                // コピー先アプリDB格納ディレクトリ作成
                CREATE_DIR: 'LocalDatabase'
            },
            IMG: {
                // コピー元アプリ画像ファイル格納ディレクトリ
                SRC_DIR: cordova.file.applicationDirectory + 'www/pre_copy_file/img/',
                // コピー先アプリ画像ファイル格納ディレクトリ(ルートディレクトリ)
                TARGET_ROOT_DIR: cordova.file.dataDirectory + 'Documents/',
                // 画像ファイル格納ディレクトリ(imgフォルダ格納先)
                TARGET_IMG_DIR: cordova.file.dataDirectory + 'Documents/NoCloud/appBizFile/',
                // 画像ファイル格納ディレクトリ
                TARGET_DIR: cordova.file.dataDirectory + 'Documents/NoCloud/appBizFile/img/',
                // コピー先ディレクトリ作成
                CREATE_DIR: 'NoCloud/appBizFile/img',
                // コピー先ディレクトリコピー
                COPY_DIR: 'img'
            },
            LOG: {
                // エンドファイル名
                END_FILE_NAME: 'logend.txt',
                // ログDBファイル名
                FILE_NAME: 'aplLog.db',
            }
        };
        /** 画面. */
        var PAGE_ID_MAIN = 'G1030-01';
        var PAGE_ID_NEXT = 'G1040-01';
        var PAGE_NM_NEXT = 'homeMenu';
        /** システムエラー. */
        var ERR_SYSTEM = {
            TITLE: AppBizCom.Msg.getMsg('KKAP-CM000-06E', []),
            CONTENTS: AppBizCom.Msg.getMsg('KKAP-CM000-07E', [])
        };
        /** ログイン可能時間外. */
        var ERR_LOGIN_TIME = {
            TITLE: AppBizCom.Msg.getMsg('KKAP-CM000-11E', []),
            CONTENTS: '',
        };
        /** サービス時間外. */
        var ERR_SERVICE_TIME = {
            TITLE: AppBizCom.Msg.getMsg('KKAP-CM000-13E', []),
            CONTENTS: '',
        };
        /** ダウンロードエラー. */
        var ERR_DOWNLOAD = {
            TITLE: AppBizCom.Msg.getMsg('KKAP-SF001-15E', []),
            CONTENTS: AppBizCom.Msg.getMsg('KKAP-SF001-16E', [])
        };
        /** 経路エラー. */
        var ERR_ROUTE = {
            TITLE: AppBizCom.Msg.getMsg('KKAP-SF001-01E', []),
            CONTENTS: AppBizCom.Msg.getMsg('KKAP-SF001-02E', [APL_NAME]),
        };
        /** 通信エラー. */
        var ERR_NETWORK = {
            TITLE: AppBizCom.Msg.getMsg('KKAP-SF001-09E', []),
            CONTENTS: AppBizCom.Msg.getMsg('KKAP-SF001-10E', [APL_NAME]),
        };
        /** カメラ設定エラー. */
        var ERR_CAMERA = {
            TITLE: AppBizCom.Msg.getMsg('KKAP-SF001-03E', []),
            CONTENTS: AppBizCom.Msg.getMsg('KKAP-SF001-04E', []),
        };
        /** GPS設定エラー. */
        var ERR_GPS = {
            TITLE: AppBizCom.Msg.getMsg('KKAP-SF001-05E', []),
            CONTENTS: AppBizCom.Msg.getMsg('KKAP-SF001-06E', []),
        };
        /** 通知設定エラー. */
        var ERR_NOTIFICATION = {
            TITLE: AppBizCom.Msg.getMsg('KKAP-SF001-07E', []),
            CONTENTS: AppBizCom.Msg.getMsg('KKAP-SF001-08E', []),
        };
        /** OSバージョンエラー. */
        var ERR_OS_VERSION = {
            TITLE: AppBizCom.Msg.getMsg('KKAP-SF001-11E', []),
            CONTENTS: AppBizCom.Msg.getMsg('KKAP-SF001-12E', []),
        };
        /** アプリバージョンエラー. */
        var ERR_APP_VERSION = {
            TITLE: AppBizCom.Msg.getMsg('KKAP-SF001-13E', []),
            CONTENTS: AppBizCom.Msg.getMsg('KKAP-SF001-14E', [APL_NAME]),
        };
        /** OSバージョン警告. */
        var ERR_OS_VERSION_WARN = {
            TITLE: AppBizCom.Msg.getMsg('KKAP-SF001-01W', []),
            CONTENTS: '',
        };
        var clientDb;
        var responseWaitTimer;
        var cameraInterval;
        /** 受付通番退避用. */
        var tempRcptNo;
        /**
         * アプリ起動処理を実行する
         */
        $scope.init = function () {
            var stopper = true;
            AppCom.App.getAppVersion((appVer) => {
                // 成功
                appVer;
            }, (error) => {
                // 失敗
                return reject([ERR_SYSTEM, 'アプリバージョン取得エラー', error]);
            });

            new Promise((resolve, reject) => {
                // ロゴアニメーション開始
                $('.splashAnimation_logo').bind('animationend', () => {
                    // スプラッシュ画面のアニメーション終了と待ち合わせ（一定時間待ち合わせ）
                    if (stopper) {
                        stopper = false;
                        return resolve();
                    }
                });
            }).then(() => {
                return new Promise((resolve, reject) => {
                    logicCom.createDirectory(cordova.file.dataDirectory, "www/pre_copy_file/db/", () => {
                        // 成功
                        return resolve();
                    }, (error) => {
                        // システムエラー
                        return reject([ERR_SYSTEM, 'ディレクトリ作成失敗', error]);
                    });
                });
            }).then(() => {
                return new Promise((resolve, reject) => {
                    logicCom.createDirectory(cordova.file.dataDirectory, "Library/LocalDatabase/", () => {
                        // 成功
                        return resolve();
                    }, (error) => {
                        // システムエラー
                        return reject([ERR_SYSTEM, 'ディレクトリ作成失敗', error]);
                    });
                });
            }).then(() => {
                return new Promise((resolve, reject) => {
                    logicCom.createDirectory(cordova.file.dataDirectory, "www/pre_copy_file/img/", () => {
                        // 成功
                        return resolve();
                    }, (error) => {
                        // システムエラー
                        return reject([ERR_SYSTEM, 'ディレクトリ作成失敗', error]);
                    });
                });
            }).then(() => {
                return new Promise((resolve, reject) => {
                    logicCom.createDirectory(cordova.file.dataDirectory, "Documents/NoCloud/appBizFile/img/", () => {
                        // 成功
                        return resolve();
                    }, (error) => {
                        // システムエラー
                        return reject([ERR_SYSTEM, 'ディレクトリ作成失敗', error]);
                    });
                });
            }).then(() => {
                return new Promise((resolve, reject) => {
                    // ログ共通部品の初期化
                    logDbFileOperation(() => {
                        // 成功
                        return resolve();
                    }, (error) => {
                        // 失敗
                        return reject(error);
                    });
                });
            // }).then(() => {
            //     return new Promise((resolve, reject) => {
            //         // 経路チェック
            //         checkRoute(() => {
            //             // 成功
            //             return resolve();
            //         }, (error) => {
            //             // 失敗
            //             return reject(error);
            //         });
            //     });
            // }).then(() => {
            //     return new Promise((resolve, reject) => {
            //         // 期限切れ申込データの削除
            //         slsDelete.deleteExpiredSlsData((keys) => {
            //             // 成功
            //             if (keys && keys.length) {
            //                 logicCom.infoLog('期限切れSLSデータ削除', { keys: keys });
            //             }
            //             return resolve();
            //         }, (error) => {
            //             // システムエラー
            //             return reject([ERR_SYSTEM, '期限切れSLSデータ削除エラー', error]);
            //         });
            //     });
            // }).then(() => {
            //     return new Promise((resolve, reject) => {
            //         // 端末状況の確認
            //         checkTermStatus(() => {
            //             // 成功
            //             return resolve();
            //         }, (error) => {
            //             // 失敗
            //             return reject(error);
            //         });
            //     });
            // }).then(() => {
            //     return new Promise((resolve, reject) => {
            //         // ログイン可能時間／バージョンチェック
            //         loginTimeAndVersionCheck(() => {
            //             // 成功
            //             return resolve();
            //         }, (error) => {
            //             // 失敗
            //             return reject(error);
            //         });
            //     });
            }).then(() => {
                return new Promise((resolve, reject) => {
                    // マスタDBコピー
                    dbFileOperation(() => {
                        // 成功
                        return resolve();
                    }, (error) => {
                        // 失敗
                        return reject(error);
                    });
                });
            }).then(() => {
                return new Promise((resolve, reject) => {
                    // 詳細リンク画像コピー
                    imageFileOperation(() => {
                        // 成功
                        return resolve();
                    }, (error) => {
                        // 失敗
                        return reject(error);
                    });
                });
            // }).then(() => {
            //     return new Promise((resolve, reject) => {
            //         // マスタデータ最新化
            //         masterDataUpdate(() => {
            //             // 成功
            //             return resolve();
            //         }, (error) => {
            //             // 失敗
            //             return reject(error);
            //         });
            //     });
            }).then(() => {
                return new Promise((resolve, reject) => {
                    // 共通領域コードマスタ初期化
                    AppBizCom.MstData.setCodeMstData(() => {
                        // 成功
                        return resolve();
                    }, function (error) {
                        // 失敗
                        return reject([ERR_SYSTEM, '業務コードマスタ更新エラー', error]);
                    });
                });
            }).then(() => {
                return new Promise((resolve, reject) => {
                    // 受付NO通番リセット
                    resetReceptionNumber(() => {
                        // 成功
                        return resolve();
                    }, (error) => {
                        // 失敗
                        return reject(error);
                    });
                });
            // }).then(() => {
            //     return new Promise((resolve, reject) => {
            //         // ログファイル送信
            //         logFileSend.logFileSend(() => {
            //             // 成功
            //             return resolve();
            //         }, (RESULT_CODE) => {
            //             // サーバ応答結果エラー
            //             switch (RESULT_CODE) {
            //                 case appConst.SUBIF010.RESULT_CODE.RECV_ERROR:
            //                     // ログデータ受信処理エラー
            //                     logicCom.warnLog('ログファイル送信機能でログデータ受信エラー', { RESULT_CODE: RESULT_CODE });
            //                     return resolve();
            //                 case appConst.SUBIF010.RESULT_CODE.OFFLINE:
            //                     // オフライン中
            //                     logicCom.warnLog('ログファイル送信機能でサービス時間外エラー', { RESULT_CODE: RESULT_CODE });
            //                     return resolve();
            //                 default:
            //                     // その他エラー
            //                     logicCom.warnLog('ログファイル送信機能でその他エラー', { RESULT_CODE: RESULT_CODE });
            //                     return resolve();
            //             }
            //         }, (error) => {
            //             // 通信エラー、タイムアウト
            //             logicCom.warnLog('ログファイル送信機能で通信エラー', error);
            //             return resolve();
            //         }, (error) => {
            //             // ログ削除エラー
            //             logicCom.warnLog('ログファイル送信機能でログ削除エラー', error);
            //             return resolve();
            //         });
            //     });
            }).then(() => {
                return new Promise((resolve, reject) => {
                    // ロゴモーション終了
                    try {
                        $('.splashAnimation_logo').addClass('.splashAnimation_logo-complete');
                        $('.splashAnimation_backGround').addClass('.splashAnimation_backGround-complete');
                        $('.splashAnimation_loadingCircle').remove();
                        $('.splashAnimation_loadingInfoText').remove();
                        $('.splashAnimation_logo').bind('animationend', () => {
                            return resolve();
                        });
                    }
                    catch (error) {
                        return reject([ERR_SYSTEM, 'ロゴモーション終了処理エラー', error]);
                    }
                });
            }).then(() => {
                return new Promise((resolve, reject) => {
                    // ホームメニュー画面に遷移
                    try {
                        logicCom.callbackLog(PAGE_ID_MAIN, PAGE_ID_NEXT, 'ホームメニュー画面遷移');
                        $location.path(PAGE_NM_NEXT);
                        $scope.$applyAsync();
                        AppBizCom.InputAssistant.handwritePanelClassInit();
                        AppBizCom.NumKeyboard.keyboardClassInit();
                    }
                    catch (error) {
                        return reject([ERR_SYSTEM, 'ホームメニュー画面遷移エラー', error]);
                    }
                });
            }).catch((error) => {
                if (Array.isArray(error)) {
                    // エラーログと画面を表示
                    logicCom.errorLog(error[1], error[2]);
                    $scope.openErrorInfo(error[0].TITLE, error[0].CONTENTS);
                }
                else {
                    // ハンドリングしていないエラー
                    logicCom.errorLog(error.message, error.stack);
                    $scope.openErrorInfo(ERR_SYSTEM.TITLE, ERR_SYSTEM.CONTENTS);
                }
            });
        };
        /**
         * 経路チェック
         */
        var checkRoute = function (successCallBack, errorCallBack) {
            // 既に起動された状態で起動イベントを検知させる
            window.handleOpenURL = function (url) {
                localStorage.setItem('launchURL', url);
                location.href = window.rootURL;
            };
            var url = localStorage.getItem('launchURL');
            localStorage.removeItem('launchURL');
            var filePath = cordova.file.applicationStorageDirectory + 'Library/Preferences/';
            var fileName = 'appMode.txt';
            var attribute = {};
            new Promise((resolve, reject) => {
                // 業務共通領域の情報をクリア
                AppBizCom.DataHolder.setLoginInfo({}); // ログイン者属性の設定
                AppBizCom.DataHolder.setNotifInfo({}); // 申込データ(事務手続き)情報
                AppBizCom.DataHolder.setEFormInfo({}); // 申込データ(電子帳票)情報
                AppBizCom.DataHolder.setImageData({}); // 画像データ情報
                AppBizCom.DataHolder.clearRouteInfo(); // ルーティング情報をクリア
                AppBizCom.DataHolder.setCustomer({}); // 既契約顧客情報
                AppBizCom.DataHolder.setServiceTime({}); // サービス時間情報
                AppBizCom.DataHolder.setCodeMaster({}); // コードマスタ情報
                AppBizCom.DataHolder.setFlowControlFlg({}); // 画面遷移制御フラグ情報
                AppBizCom.DataHolder.setPersonInfo({}); // 申込データ(特定個人情報)
                AppBizCom.DataHolder.setLocation({}); // 位置情報
                // 01-2022-06-224 本人確認書類撮影画面のガード対応 開始 20221031
                AppBizCom.DataHolder.setOcrData({}); // OCR結果データ
                // 01-2022-06-224 本人確認書類撮影画面のガード対応 終了 20221031
                if (!url) {
                    // URLスキームから呼び出されていない
                    return reject([ERR_ROUTE, 'URLスキームから呼び出されていない', {}]);
                }
                // URLスキームパラメータ形式チェック
                var pattern = /^[a-z]+:\/\/\?[a-zA-Z]+\=[0-9]{7}\&[a-zA-Z]+\=[0-9]{4}\&[a-zA-Z]+\=[0-9]{4}\&[a-zA-Z]+\=.*$/g;
                var isFormat = url.match(pattern);
                if (!isFormat) {
                    // URLスキームの形式が不正
                    return reject([ERR_ROUTE, 'URLスキームの形式が不正', { 'URL': url }]);
                }
                var param = url.split('?')[1];
                var params = param.split('&');
                var paramCnt = params.length;
                if (paramCnt != 4) {
                    // URLスキームのパラメータ数が不正
                    return reject([ERR_ROUTE, 'URLスキームのパラメータ数が不正', { 'パラメータ数': paramCnt, 'URL': url }]);
                }
                for (var i = 0; i < paramCnt; i++) {
                    var item = params[i];
                    var items = item.split('=');
                    attribute[items[0]] = items[1];
                }
                if (!attribute.syainID || !attribute.tenbukaC || !attribute.kakariC || !attribute.appMode
                    || !(attribute.appMode == APP_MODE.PRODUCT || attribute.appMode == APP_MODE.TEST)) {
                    // URLスキームのパラメータ名が不正
                    return reject([ERR_ROUTE, 'URLスキームのパラメータ名が不正', { 'パラメータ名': attribute, 'URL': url }]);
                }
                // モードファイルの存在を確認
                logicCom.existsFile(filePath + fileName, (isExists) => {
                    resolve(isExists);
                });
            }).then((isExistFile) => {
                return new Promise((resolve, reject) => {
                    var isCreateFile = false;
                    // 既にモードファイルが存在する場合は作成しない
                    if (isExistFile)
                        return resolve(isCreateFile);
                    // モードファイルを作成
                    logicCom.saveFileTxtData(filePath, fileName, attribute.appMode, () => {
                        // 成功
                        isCreateFile = true;
                        return resolve(isCreateFile);
                    }, (error) => {
                        // システムエラー
                        return reject([ERR_ROUTE, 'APモードファイルの作成に失敗', error]);
                    });
                });
            }).then((isCreateFile) => {
                return new Promise((resolve, reject) => {
                    // モードファイルを作成した場合は読み取らない
                    if (isCreateFile)
                        return resolve(attribute.appMode);
                    // モードファイルの読み取り
                    logicCom.readFileTxtData(filePath + fileName, (appMode) => {
                        // 成功
                        return resolve(appMode);
                    }, (error) => {
                        // システムエラー
                        return reject([ERR_SYSTEM, 'APモードファイルの読み取りに失敗', error]);
                    });
                });
            }).then((appMode) => {
                return new Promise((resolve, reject) => {
                    if (appMode != attribute.appMode) {
                        // URLスキームのアプリモードが不正
                        return reject([ERR_ROUTE, 'URLスキームのアプリモードが不正', { 'アプリ': appMode, 'URLスキーム': attribute.appMode }]);
                    }
                    if (appMode == APP_MODE.TEST) {
                        // テストモード起動
                        CURRENT_CONFIG.API_URL = TEST_CONFIG.API_URL;
                        CURRENT_CONFIG.CRYPTO_KEY_CBC = TEST_CONFIG.CRYPTO_KEY_CBC;
                        CURRENT_CONFIG.CRYPTO_KEY_ECB = TEST_CONFIG.CRYPTO_KEY_ECB;
                        CURRENT_CONFIG.INITIAL_VECTOR = TEST_CONFIG.INITIAL_VECTOR;
                        logicCom.infoLog('テストモードでアプリを起動');
                    }
                    else {
                        // 本番モード起動
                        logicCom.infoLog('本番モードでアプリを起動');
                    }
                    // ログイン者データの設定
                    var loginInfo = {
                        PROPER_C: attribute.syainID,
                        UKETSUKE_MISE_C: attribute.tenbukaC,
                        UKETSUKE_KAKARI_C: attribute.kakariC // 受付者係コード
                    };
                    AppBizCom.DataHolder.setLoginInfo(loginInfo);
                    // 成功
                    return successCallBack();
                });
            }).catch((error) => {
                // 失敗
                return errorCallBack(error);
            });
        };
        /**
         * 端末状況確認
         *
         * @param {callback} successCallBack - 成功時のコールバック関数
         * @param {callback} errorCallBack   - 失敗時のコールバック関数
         */
        var checkTermStatus = function (successCallBack, errorCallBack) {
            // ネットワーク状態確認
            new Promise((resolve, reject) => {
                // 端末設定確認
                if (AppCom.Device.getNetworkStatus() == Connection.NONE) {
                    // 失敗
                    return reject([ERR_NETWORK, 'ネットワーク設定エラー', { Connection: Connection.NONE }]);
                }
                // サーバ通信確認
                AppCom.Http.post(appConst.SUBIF001.PATH, {}, (data, status) => {
                    // 成功
                    return resolve();
                }, (data, status) => {
                    // 失敗
                    var result = { data: data, status: status };
                    return reject([ERR_NETWORK, 'ネットワーク通信エラー', result]);
                });
                // 01-2021-04-430 【ｉＰａｄ口座開設・事務手続きアプリ】ｉＯＳ１４対応のバージョンアップ 開始 20210720
                // バッジ使用許可請求
            }).then(() => {
                return new Promise((resolve, reject) => {
                    AppCom.Device.requestBadgeAuthorization(() => {
                        // バッジ使用許可請求成功
                        return resolve();
                    }, function (error) {
                        // バッジ使用許可請求失敗
                        return resolve();
                    });
                    // バッジ使用許可確認
                });
            }).then(() => {
                return new Promise((resolve, reject) => {
                    // 01-2021-04-430 【ｉＰａｄ口座開設・事務手続きアプリ】ｉＯＳ１４対応のバージョンアップ 終了 20210720
                    AppCom.Device.isBadgeNotificationAvailable(() => {
                        // バッジ使用可
                        return resolve();
                    }, (status) => {
                        // バッジ使用不可
                        return resolve();
                    }, function (error) {
                        // バッジ確認エラー
                        return resolve();
                    });
                    // SLS件数取得（事務手続き)
                });
            }).then(() => {
                return new Promise((resolve, reject) => {
                    logicCom.getSLSLength('2', (len) => {
                        // 成功
                        return resolve(len);
                    }, (error) => {
                        // 失敗
                        return reject([ERR_SYSTEM, 'SLS件数取得エラー', error]);
                    });
                    // SLS件数取得（電子帳票）
                });
            }).then((sumLen) => {
                return new Promise((resolve, reject) => {
                    logicCom.getSLSLength('3', (len) => {
                        // 成功
                        return resolve(sumLen + len);
                    }, (error) => {
                        // 失敗
                        return reject([ERR_SYSTEM, 'SLS件数取得エラー', error]);
                    });
                    // バッジ件数設定
                });
            }).then((len) => {
                return new Promise((resolve, reject) => {
                    cordova.plugins.notification.badge.hasPermission(function (granted) {
                        // バッチアクセス権限確認
                        if (granted) {
                            // 許可
                            cordova.plugins.notification.badge.set(len, () => {
                                // バッジ件数更新
                                return resolve();
                            });
                        }
                        else {
                            // 不許可
                            return resolve();
                        }
                    });
                    // GPS状態確認
                });
            }).then(() => {
                return new Promise((resolve, reject) => {
                    AppCom.Device.isGpsAvailable((available) => {
                        return resolve(available);
                    });
                    // GPS許可要求
                });
            }).then((available) => {
                return new Promise((resolve, reject) => {
                    // GPS使用可
                    if (available)
                        return resolve();
                    // GPSの使用許可を要求
                    AppCom.Device.requestGpsAuthorization(() => {
                        // GPS使用可
                        return resolve();
                    }, function (status) {
                        // GPS使用不可
                        return reject([ERR_GPS, 'GPS使用不可エラー', { permissionStatus: status }]);
                    }, function (error) {
                        // システムエラー
                        return reject([ERR_GPS, 'GPS設定確認エラー', error]);
                    });
                    // 01-2021-04-430 【ｉＰａｄ口座開設・事務手続きアプリ】ｉＯＳ１４対応のバージョンアップ 開始 20210527
                    // 「正確な位置情報」の一時権限要求
                });
            }).then(() => {
                return new Promise((resolve, reject) => {
                    // 「正確な位置情報」の一時権限要求
                    AppCom.Device.requestFullAccuracyAuthorization(() => {
                        // 「正確な位置情報」使用可
                        return resolve();
                    }, function (status) {
                        // 「正確な位置情報」使用不可
                        return reject([ERR_GPS, '「正確な位置情報」使用不可エラー', { locationAccuracyAuthorization: status }]);
                    }, function (error) {
                        // システムエラー
                        return reject([ERR_GPS, '「正確な位置情報」設定確認エラー', error]);
                    });
                    // 01-2021-04-430 【ｉＰａｄ口座開設・事務手続きアプリ】ｉＯＳ１４対応のバージョンアップ 終了 20210527
                    // カメラ状態確認
                });
            }).then(() => {
                return new Promise((resolve, reject) => {
                    $scope.$on('$destroy', function () {
                        // cameraIntervalタイマーをクリアする
                        if (angular.isDefined(cameraInterval)) {
                            $interval.cancel(cameraInterval);
                            cameraInterval = undefined;
                        }
                        PDLCameraScan.deinitResource(function () { }, function () { });
                        PDLCameraOcr.deinitResource(function () { }, function () { });
                    });
                    AppCom.Device.isCameraAvailable((result) => {
                        // 成功
                        return resolve(result);
                    }, (error) => {
                        // 失敗
                        return reject([ERR_CAMERA, 'カメラ使用可否状態確認エラー', error]);
                    });
                    // カメラプラグイン初期化
                });
            }).then((result) => {
                return new Promise((resolve, reject) => {
                    if (result == cordova.plugins.diagnostic.permissionStatus.GRANTED) {
                        // カメラ使用可
                        // カメラプレビュー起動中にURL連携で再起動した場合の考慮
                        // ステータスバーを表示
                        // StatusBar.show();
                        // カメラプレビューキャンセル
                        PDLCameraScan.cancelCaptureOnce(function () {
                            PDLCameraOcr.cancelCaptureOnce(function () {
                                return resolve();
                            }, function () {
                                return resolve();
                            });
                        }, function () {
                            PDLCameraOcr.cancelCaptureOnce(function () {
                                return resolve();
                            }, function () {
                                return resolve();
                            });
                        });
                    }
                    else if (result == cordova.plugins.diagnostic.permissionStatus.NOT_REQUESTED) {
                        // カメラ初期化処理
                        PDLCameraScan.prepareResource(function () { }, function () { });
                        cameraInterval = $interval(function () {
                            AppCom.Device.isCameraAvailable(function (result) {
                                if (result == cordova.plugins.diagnostic.permissionStatus.GRANTED) {
                                    // カメラ使用許可確認後、GPS使用可否状態を確認する
                                    $interval.cancel(cameraInterval);
                                    return resolve();
                                }
                                else if (result == cordova.plugins.diagnostic.permissionStatus.DENIED) {
                                    // カメラエラー
                                    $interval.cancel(cameraInterval);
                                    return reject([ERR_CAMERA, 'カメラ使用可否状態設定エラー', { 'permissionStatus': result }]);
                                }
                            });
                        }, 1000);
                    }
                    else {
                        // カメラエラー
                        return reject([ERR_CAMERA, 'カメラ使用可否状態設定エラー', { 'permissionStatus': result }]);
                    }
                });
            }).then(() => {
                // 成功
                return successCallBack();
            }).catch((error) => {
                // 失敗
                return errorCallBack(error);
            });
        };
        /**
         * ログイン可能時間／バージョンチェック
         *
         * @param successCallBack - 成功時のコールバック関数
         * @param errorCallBack - 失敗時のコールバック関数
         */
        function loginTimeAndVersionCheck(successCallBack, errorCallBack) {
            return __awaiter(this, void 0, void 0, function* () {
                // ログイン時間帯・バージョン確認要求IFの生成
                new Promise((resolve, reject) => {
                    var SUBIF002 = {
                        OS_VERSION: '',
                        APP_VERSION: '',
                        APL_KBN: '' // アプリ区分
                    };
                    // iOSバージョンの設定
                    SUBIF002.OS_VERSION = AppCom.Device.getIosVer();
                    // アプリ区分の設定
                    SUBIF002.APL_KBN = APL_KBN;
                    // アプリバージョンの設定
                    AppCom.App.getAppVersion((appVer) => {
                        // 成功
                        SUBIF002.APP_VERSION = appVer;
                        return resolve(SUBIF002);
                    }, (error) => {
                        // 失敗
                        return reject([ERR_SYSTEM, 'アプリバージョン取得エラー', error]);
                    });
                    // ログイン可能時間・バージョンチェック
                }).then((SUBIF002) => {
                    return new Promise((resolve, reject) => {
                        AppCom.Http.post(appConst.SUBIF002.PATH, SUBIF002, (data, status) => {
                            if (status == appConst.HTTP_OK) {
                                // 成功
                                return resolve(data);
                            }
                            else {
                                // HTTP通信エラー
                                return reject([ERR_NETWORK, 'ログイン可能時間・バージョンチェックでHTTP通信エラー', { data: data, status: status }]);
                            }
                        }, (data, status) => {
                            // HTTP通信エラー
                            return reject([ERR_NETWORK, 'ログイン可能時間・バージョンチェックでHTTP通信エラー', { data: data, status: status }]);
                        });
                        // サービス時間情報の設定
                    });
                }).then((data) => {
                    return new Promise((resolve, reject) => {
                        switch (Number(data.RESULT_CODE)) {
                            case appConst.SUBIF002.RESULT_CODE.OK:
                                // 各種確認結果正常
                                return resolve(data);
                            case appConst.SUBIF002.RESULT_CODE.OS_VER_WARN:
                                // OSバージョン警告
                                logicCom.warnLog('OSバージョンチェック警告', data);
                                ERR_OS_VERSION_WARN.CONTENTS = AppBizCom.Msg.getMsg('KKAP-SF001-02W', [data.OS_VERSION]);
                                $scope.openErrorInfoCloseable(ERR_OS_VERSION_WARN.TITLE, ERR_OS_VERSION_WARN.CONTENTS, () => {
                                    return resolve(data);
                                });
                                break;
                            case appConst.SUBIF002.RESULT_CODE.OS_VER_ERROR:
                                // OSバージョンチェックエラー
                                return reject([ERR_OS_VERSION, 'OSバージョンチェックエラー', data]);
                            case appConst.SUBIF002.RESULT_CODE.AP_VER_ERROR:
                                // アプリバージョンチェックエラー
                                return reject([ERR_APP_VERSION, 'アプリバージョンチェックエラー', data]);
                            case appConst.SUBIF002.RESULT_CODE.OFFLINE:
                                // オフライン中
                                ERR_LOGIN_TIME.CONTENTS = AppBizCom.Msg.getMsg('KKAP-CM000-12E', [APL_NAME, formatTime('H:MM', data.SERVICE_START_TIME), formatTime('H:MM', data.LOGIN_END_TIME)]);
                                return reject([ERR_LOGIN_TIME, 'ログイン可能時間チェックエラー', data]);
                            case appConst.SUBIF002.RESULT_CODE.OTHER_ERROR:
                                // その他エラー
                                return reject([ERR_SYSTEM, 'ログイン可能時間・バージョンチェックでその他エラー', data]);
                        }
                        // サービス時間情報を業務共通領域に保存
                    });
                }).then((data) => {
                    return new Promise((resolve, reject) => {
                        var serviceTimeJoho = {
                            SRVC_KS_ZKK: formatTime('HH:MM:SS', data.SERVICE_START_TIME),
                            LOGIN_SYRY_ZKK: formatTime('HH:MM:SS', data.LOGIN_END_TIME),
                            SRVC_SYRY_ZKK: formatTime('HH:MM:SS', data.SERVICE_END_TIME),
                            GYOMU_DATE: data.TODAY_BUSINESS_DAY.replace(/-/g, ''),
                        };
                        AppBizCom.DataHolder.setServiceTime(serviceTimeJoho);
                        // サービス時間外エラーメッセージ作成
                        ERR_SERVICE_TIME.CONTENTS = AppBizCom.Msg.getMsg('KKAP-CM000-14E', [APL_NAME, formatTime('H:MM', data.SERVICE_START_TIME), formatTime('H:MM', data.SERVICE_END_TIME)]);
                        // 成功
                        return successCallBack();
                    });
                }).catch((error) => {
                    // 失敗
                    return errorCallBack(error);
                });
            });
        }
        ;
        /**
         * マスタデータ更新処理
         * @param {callback} successCallBack - 成功時のコールバック関数
         * @param {callback} errorCallBack   - 失敗時のコールバック関数
         */
        var masterDataUpdate = function (successCallBack, errorCallBack) {
            // マスタデータ更新処理SQL作成
            var sqlInfos = [];
            // 画像データ保存データ作成
            var imageInfos = [];
            // INSERTデータ数
            var insertDataCount = 0;
            // UPDATEデータ数
            var updateDataCount = 0;
            // DELETEデータ数
            var deleteDataCount = 0;
            // データベースを開く
            clientDb = clientDb || AppCom.ClientDb.open();
            // マスタデータ取得処理
            new Promise((resolve, reject) => {
                // SQLを実行
                var clientDb = AppCom.ClientDb.open();
                AppCom.ClientDb.execSQL(clientDb, dbInfoConst.MAST_DATA.SEARCH_SQL, [], (result) => {
                    // 成功
                    return resolve(result);
                }, (error) => {
                    // システムエラー
                    return reject([ERR_SYSTEM, 'マスタ情報SQL取得エラー', error]);
                });
            }).then((result) => {
                return new Promise((resolve, reject) => {
                    // HTTP通信処理実施
                    if (result.rows.length <= 0) {
                        // データが無いので、処理成功時処理
                        return successCallBack();
                    }
                    // SQLデータ取得
                    var identityArray = [];
                    for (var i = 0, len = result.rows.length; i < len; i++) {
                        var oneRow = result.rows.item(i);
                        var oneParam = {};
                        // 識別ID
                        oneParam.IDENTITY_ID = oneRow.SIKB_ID;
                        // 最終更新日時情報
                        oneParam.LAST_UPDATE_DATE = oneRow.DB_UPDJI2;
                        // 日付のスラッシュをハイフンに変換
                        oneParam.LAST_UPDATE_DATE = oneParam.LAST_UPDATE_DATE.replace(/[\/]/g, '-');
                        identityArray.push(oneParam);
                    }
                    // 送信パラメータの設定
                    var httpParam = {};
                    // 各識別IDごとのデータを格納する配列
                    httpParam.MASTER_DATA_LAST_UPDATE_INFO = identityArray;
                    // スコープ破棄時にサーバからの応答待ちタイマをキャンセルする
                    $scope.$on('$destroy', function () {
                        if (angular.isDefined(responseWaitTimer)) {
                            $timeout.cancel(responseWaitTimer);
                            responseWaitTimer = undefined;
                        }
                    });
                    // サーバからの応答が5分以内に完了しなければエラーとする
                    responseWaitTimer = $timeout(function () {
                        responseWaitTimer = undefined;
                        var error = { data: 'timeout', status: -1 };
                        return reject([ERR_NETWORK, 'マスタデータ更新HTTP通信エラー', error]);
                    }, 300000);
                    // マスタデータ更新要求(サーバ側)
                    AppCom.Http.post(appConst.SUBIF003.PATH, httpParam, (data, status) => {
                        // 応答受診時にサーバからの応答待ちタイマをキャンセルする
                        // タイマが無効の場合は既にタイマが発火したという事のため何もしない
                        if (angular.isDefined(responseWaitTimer)) {
                            $timeout.cancel(responseWaitTimer);
                            responseWaitTimer = undefined;
                            // 成功
                            var result = { data: data, status: status };
                            return resolve(result);
                        }
                    }, (data, status) => {
                        // 応答受診時にサーバからの応答待ちタイマをキャンセルする
                        // タイマが無効の場合は既にタイマが発火したという事のため何もしない
                        if (angular.isDefined(responseWaitTimer)) {
                            $timeout.cancel(responseWaitTimer);
                            responseWaitTimer = undefined;
                            // システムエラー
                            var error = { data: data, status: status };
                            return reject([ERR_NETWORK, 'マスタデータ更新HTTP通信エラー', error]);
                        }
                    });
                    // SQL作成
                });
            }).then((result) => {
                return new Promise((resolve, reject) => {
                    // ステータスコードが正常以外
                    if (result.status != appConst.HTTP_OK) {
                        // HTTP通信エラー
                        return reject([ERR_NETWORK, 'マスタデータ更新HTTP通信エラー', result]);
                    }
                    // 確認結果コード値取得
                    var resultCode = result.data.RESULT_CODE;
                    // 確認結果コード値が正常以外
                    if (resultCode != appConst.SUBIF003.RESULT_CODE.OK) {
                        // マスタデータ取得処理エラー(システムエラーも同様)
                        if (resultCode == appConst.SUBIF003.RESULT_CODE.OFFLINE) {
                            // サービス時間チェックエラー
                            return reject([ERR_SERVICE_TIME, 'サービス時間チェックエラー', result]);
                        }
                        else {
                            // ダウンロードエラー
                            return reject([ERR_DOWNLOAD, 'マスタデータダウンロードエラー', result]);
                        }
                    }
                    // マスタデータ更新情報取得
                    var masterDataInfos = result.data.MASTER_DATA_UPDATE_DATA;
                    for (var i = 0, len_i = masterDataInfos.length; i < len_i; i++) {
                        var oneRecord = masterDataInfos[i];
                        var identityId = oneRecord.IDENTITY_ID;
                        var oneTable = dbInfoConst[identityId];
                        // データ区分が画像の場合
                        if (oneTable.DATA_KBN == 2) {
                            // 画像の場合は、UPDATEのみ
                            if ('UPDATE_DATA' in oneRecord) {
                                // BASE64データ取得
                                var updateData = oneRecord.UPDATE_DATA;
                                // 最終更新日時
                                var lastUpdateDate = oneRecord.UPDATE_DATE;
                                // 画像ファイル名取得
                                var imageName = oneRecord.IMAGE_NAME;
                                // 画像データ保存データ保存
                                imageInfos.push({
                                    identityId: identityId,
                                    fileName: imageName,
                                    base64Data: updateData,
                                    updateDate: lastUpdateDate
                                });
                            }
                        }
                        else {
                            // INSERTデータ存在確認
                            if ('INSERT_DATA' in oneRecord) {
                                // DELETEデータ作成
                                var deleteData = oneRecord.DELETE_DATA;
                                // INSERTデータ作成
                                var insertData = oneRecord.INSERT_DATA;
                                for (var j = 0, len_j = insertData.length; j < len_j; j++) {
                                    var oneData = insertData[j];
                                    var deleteSqlParam = [];
                                    var deleteSqlInfo = [oneTable.DELETE_SQL];
                                    for (var k = 0, len_k = oneTable.COLUMN_KEY.length; k < len_k; k++) {
                                        var columnName = oneTable.COLUMN_KEY[k];
                                        deleteSqlParam.push(oneData[columnName]);
                                    }
                                    deleteSqlInfo[1] = deleteSqlParam;
                                    sqlInfos.push(deleteSqlInfo);
                                    var sqlParam = [];
                                    var insertSqlInfo = [oneTable.INSERT_SQL];
                                    for (var k = 0, len_k = oneTable.COLUMN.length; k < len_k; k++) {
                                        var columnName = oneTable.COLUMN[k].name;
                                        sqlParam.push(oneData[columnName]);
                                    }
                                    insertSqlInfo[1] = sqlParam;
                                    sqlInfos.push(insertSqlInfo);
                                    insertDataCount++;
                                }
                            }
                            // UPDATEデータ存在確認
                            if ('UPDATE_DATA' in oneRecord) {
                                // UPDATEデータ作成
                                var updateData = oneRecord.UPDATE_DATA;
                                for (var j = 0, len_j = updateData.length; j < len_j; j++) {
                                    var oneData = updateData[j];
                                    var deleteSqlParam = [];
                                    var deleteSqlInfo = [oneTable.DELETE_SQL];
                                    for (var k = 0, len_k = oneTable.COLUMN_KEY.length; k < len_k; k++) {
                                        var columnName = oneTable.COLUMN_KEY[k];
                                        deleteSqlParam.push(oneData[columnName]);
                                    }
                                    deleteSqlInfo[1] = deleteSqlParam;
                                    sqlInfos.push(deleteSqlInfo);
                                    var insertSqlParam = [];
                                    var insertSqlInfo = [oneTable.INSERT_SQL];
                                    for (var k = 0, len_k = oneTable.COLUMN.length; k < len_k; k++) {
                                        var columnName = oneTable.COLUMN[k].name;
                                        insertSqlParam.push(oneData[columnName]);
                                    }
                                    insertSqlInfo[1] = insertSqlParam;
                                    sqlInfos.push(insertSqlInfo);
                                    updateDataCount++;
                                }
                            }
                            // DELETEデータ存在確認
                            if ('DELETE_DATA' in oneRecord) {
                                // DELETEデータ作成
                                var deleteData = oneRecord.DELETE_DATA;
                                for (var j = 0, len_j = deleteData.length; j < len_j; j++) {
                                    var oneData = deleteData[j];
                                    var deleteSqlParam = [];
                                    var deleteSqlInfo = [oneTable.DELETE_SQL];
                                    for (var k = 0, len_k = oneTable.COLUMN_KEY.length; k < len_k; k++) {
                                        var columnName = oneTable.COLUMN_KEY[k];
                                        deleteSqlParam.push(oneData[columnName]);
                                    }
                                    deleteSqlInfo[1] = deleteSqlParam;
                                    sqlInfos.push(deleteSqlInfo);
                                    deleteDataCount++;
                                }
                            }
                            // マスタデータ情報更新
                            var masterDataTable = dbInfoConst.MAST_DATA;
                            // 識別ID,最終更新日時
                            var sqlParam = [oneRecord.UPDATE_DATE, identityId];
                            // SQLセット
                            sqlInfos.push([masterDataTable.UPDATE_SQL, sqlParam]);
                        }
                    }
                    // 画像保存処理(複数ファイル)
                    logicCom.saveFileBase64DataBat(MAST_FILE.IMG.TARGET_DIR, imageInfos, () => {
                        // 成功
                        return resolve();
                    }, (error) => {
                        // システムエラー
                        return reject([ERR_SYSTEM, '画像保存処理エラー', error]);
                    });
                    // SQL実行
                });
            }).then(() => {
                return new Promise((resolve, reject) => {
                    // マスタデータ情報更新
                    var masterDataTable = dbInfoConst.MAST_DATA;
                    for (var i = 0, len = imageInfos.length; i < len; i++) {
                        var oneImageInfo = imageInfos[i];
                        // 識別ID,最終更新日時
                        var sqlParam = [oneImageInfo.updateDate, oneImageInfo.identityId];
                        // SQLセット
                        sqlInfos.push([masterDataTable.UPDATE_SQL, sqlParam]);
                    }
                    // SQL実行分割用変数
                    // SQL実行数
                    var sqlExecLength = sqlInfos.length;
                    // 現在実行中SQLカウント
                    var sqlNowExecCount = 0;
                    // SQL実行処理(分割対応)
                    var sqlExecFunc = function () {
                        // SQLを実行
                        // 今回実行するSQLをコピーする
                        var nowTurnSqlInfo = sqlInfos.slice(sqlNowExecCount, sqlNowExecCount + dbInfoConst.ONE_SQL_EXEC_COUNT);
                        // マスタデータ取得処理(大量SQL発行型)
                        AppCom.ClientDb.execSQLBat(clientDb, nowTurnSqlInfo, () => {
                            // 成功
                            // 実行数カウントをインクリメント
                            sqlNowExecCount += dbInfoConst.ONE_SQL_EXEC_COUNT;
                            // まだ実行するSQLが存在する場合
                            if (sqlNowExecCount <= sqlExecLength) {
                                // 次のターンのSQL処理を実行
                                return sqlExecFunc();
                            }
                            else {
                                return resolve();
                            }
                        }, (error) => {
                            // システムエラー
                            return reject([ERR_SYSTEM, 'マスタデータSQL実行エラー', error]);
                        });
                    };
                    // SQL処理を実行
                    sqlExecFunc();
                    // 更新結果をログ出力
                });
            }).then(() => {
                return new Promise((resolve, reject) => {
                    var insertMsg = 'INSERT:' + insertDataCount + ' ';
                    var updateMsg = 'UPDATE:' + updateDataCount + ' ';
                    var deleteMsg = 'DELETE:' + deleteDataCount + ' ';
                    var imageMsg = '画像ファイル:' + imageInfos.length;
                    logicCom.infoLog(insertMsg + updateMsg + deleteMsg + imageMsg);
                    return resolve();
                    // 成功
                });
            }).then(() => {
                return new Promise((resolve, reject) => {
                    return successCallBack();
                    // 失敗
                });
            }).catch((error) => {
                return errorCallBack(error);
            });
        };
        /**
         * マスタデータDBコピー処理
         * @param {callback} successCallBack - 成功時のコールバック関数
         * @param {callback} errorCallBack   - 失敗時のコールバック関数
         */
        var dbFileOperation = function (successCallBack, errorCallBack) {
            var isExistsEndFile = true;
            // ディレクトリ作成（既に存在する場合は再作成しない）
            new Promise((resolve, reject) => {
                logicCom.createDirectory(MAST_FILE.DB.TARGET_ROOT_DIR, MAST_FILE.DB.CREATE_DIR, () => {
                    // 成功
                    return resolve();
                }, (error) => {
                    // システムエラー
                    return reject([ERR_SYSTEM, 'DBディレクトリ作成失敗', error]);
                });
                // 利用領域のエンドファイル存在確認
            }).then(() => {
                return new Promise((resolve, reject) => {
                    logicCom.existsFile(MAST_FILE.DB.TARGET_DIR + MAST_FILE.END_FILE_NAME, (isExists) => {
                        isExistsEndFile = isExists;
                        return resolve(isExists);
                    });
                    // エンドファイルを読み取り（利用領域）
                });
            }).then((isExists) => {
                return new Promise((resolve, reject) => {
                    // 利用領域のエンドファイルが存在しない場合は読み取らない
                    if (!isExists)
                        return resolve();
                    logicCom.readFileTxtData(MAST_FILE.DB.TARGET_DIR + MAST_FILE.END_FILE_NAME, (versionUse) => {
                        // 成功
                        return resolve(versionUse);
                    }, (error) => {
                        // システムエラー
                        return reject([ERR_SYSTEM, 'アプリ利用領域のDBエンドファイル読み取りエラー', error]);
                    });
                    // エンドファイルを読み取り（配布領域）
                });
            }).then((versionUse) => {
                return new Promise((resolve, reject) => {
                    var isCopy = true;
                    // 利用領域のエンドファイルを読み取っていない場合は、配布領域も読み取らない
                    if (!versionUse)
                        return resolve(isCopy);
                    logicCom.readFileTxtData(MAST_FILE.DB.SRC_DIR + MAST_FILE.END_FILE_NAME, (versionDistribute) => {
                        if (versionUse == versionDistribute) {
                            // DBバージョン変更なし
                            logicCom.infoLog('DBバージョン変更なし[' + versionUse + ']');
                            isCopy = false;
                            return resolve(isCopy);
                        }
                        else {
                            // DBバージョン変更あり
                            logicCom.infoLog('DBバージョン変更あり[' + versionUse + ' => ' + versionDistribute + ']');
                            return resolve(isCopy);
                        }
                    }, (error) => {
                        // システムエラー
                        return reject([ERR_SYSTEM, 'アプリ配布領域のDBエンドファイル読み取りエラー', error]);
                    });
                    // アプリ使用領域のマスタテーブルから受付NO通番を退避
                });
            }).then((isCopy) => {
                return new Promise((resolve, reject) => {
                    // アプリ初回インストール、またはアプリアップデート且つDBのバージョンに変更がない場合は実施しない
                    if (!isExistsEndFile || (isExistsEndFile && !isCopy))
                        return resolve(isCopy);
                    // データベースオープン
                    clientDb = AppCom.ClientDb.open();
                    selectRcptNo((result) => {
                        // 成功
                        tempRcptNo = result;
                        return resolve(isCopy);
                    }, (error) => {
                        // 失敗
                        return reject(error);
                    });
                    // データベースクローズ
                });
            }).then((isCopy) => {
                return new Promise((resolve, reject) => {
                    // データベースがオープンされていない場合は実施しない
                    if (!clientDb)
                        return resolve(isCopy);
                    AppCom.ClientDb.close(clientDb, () => {
                        // 成功
                        clientDb = undefined;
                        return resolve(isCopy);
                    }, (error) => {
                        // 失敗
                        reject([ERR_SYSTEM, 'データベースクローズエラー', error]);
                    });
                    // エンドファイルコピー
                });
            }).then((isCopy) => {
                return new Promise((resolve, reject) => {
                    // ファイルコピーが必要ない場合は実施しない
                    if (!isCopy)
                        return resolve(isCopy);
                    logicCom.fileCopy(MAST_FILE.DB.SRC_DIR + MAST_FILE.END_FILE_NAME, MAST_FILE.DB.TARGET_DIR, MAST_FILE.END_FILE_NAME, () => {
                        // 成功
                        logicCom.infoLog('DBエンドファイルコピー完了');
                        return resolve(isCopy);
                    }, (error) => {
                        // システムエラー
                        return reject([ERR_SYSTEM, 'DBエンドファイルコピーエラー', error]);
                    });
                    // DBファイルコピー
                });
            }).then((isCopy) => {
                return new Promise((resolve, reject) => {
                    // ファイルコピーが必要ない場合は実施しない
                    if (!isCopy)
                        return resolve(isCopy);
                    logicCom.fileCopy(MAST_FILE.DB.SRC_DIR + MAST_FILE.DB.FILE_NAME, MAST_FILE.DB.TARGET_BASE_DIR, MAST_FILE.DB.FILE_NAME, () => {
                        // 成功
                        logicCom.infoLog('DBファイルコピー完了');
                        return resolve();
                    }, (error) => {
                        // システムエラー
                        return reject([ERR_SYSTEM, 'DBファイルコピーエラー', error]);
                    });
                    //　退避した受付NO通番をアプリ使用領域のマスタテーブルに上書き
                });
            }).then((isCopy) => {
                return new Promise((resolve, reject) => {
                    // 退避した受付NO通番が存在しない場合は実施しない
                    if (!tempRcptNo)
                        return resolve();
                    // データベースオープン
                    clientDb = AppCom.ClientDb.open();
                    updateRcptNo(() => {
                        // 成功
                        return resolve();
                    }, (error) => {
                        // エラー
                        return reject(error);
                    });
                    // 成功
                });
            }).then(() => {
                return new Promise((resolve, reject) => {
                    return successCallBack();
                    // 失敗
                });
            }).catch((error) => {
                return errorCallBack(error);
            });
        };
        /**
         * マスタデータ画像ディレクトリコピー処理
         * @param {callback} successCallBack - 成功時のコールバック関数
         * @param {callback} errorCallBack - 失敗時のコールバック関数
         */
        var imageFileOperation = function (successCallBack, errorCallBack) {
            // ディレクトリ作成処理
            new Promise((resolve, reject) => {
                logicCom.createDirectory(MAST_FILE.IMG.TARGET_ROOT_DIR, MAST_FILE.IMG.CREATE_DIR, () => {
                    // 成功
                    return resolve();
                }, (error) => {
                    // システムエラー
                    return reject([ERR_SYSTEM, '画像ディレクトリ作成失敗', error]);
                });
                // 利用領域のエンドファイル存在確認
            }).then(() => {
                return new Promise((resolve, reject) => {
                    logicCom.existsFile(MAST_FILE.IMG.TARGET_DIR + MAST_FILE.END_FILE_NAME, (isExists) => {
                        return resolve(isExists);
                    });
                    // エンドファイルを読み取り（利用領域）
                });
            }).then((isExists) => {
                return new Promise((resolve, reject) => {
                    // 利用領域のエンドファイルが存在しない場合は読み取らない
                    if (!isExists)
                        return resolve();
                    logicCom.readFileTxtData(MAST_FILE.IMG.TARGET_DIR + MAST_FILE.END_FILE_NAME, (versionUse) => {
                        // 成功
                        return resolve(versionUse);
                    }, (error) => {
                        // システムエラー
                        return reject([ERR_SYSTEM, 'アプリ利用領域の画像エンドファイル読み取りエラー', error]);
                    });
                    // エンドファイルを読み取り（配布領域）
                });
            }).then((versionUse) => {
                return new Promise((resolve, reject) => {
                    var isCopy = true;
                    // 利用領域のエンドファイルを読み取っていない場合は、配布領域も読み取らない
                    if (!versionUse)
                        return resolve(isCopy);
                    logicCom.readFileTxtData(MAST_FILE.IMG.SRC_DIR + MAST_FILE.END_FILE_NAME, (versionDistribute) => {
                        if (versionUse == versionDistribute) {
                            // DBバージョン変更なし
                            logicCom.infoLog('画像バージョン変更なし[' + versionUse + ']');
                            isCopy = false;
                            return resolve(isCopy);
                        }
                        else {
                            // DBバージョン変更あり
                            logicCom.infoLog('画像バージョン変更あり[' + versionUse + ' => ' + versionDistribute + ']');
                            return resolve(isCopy);
                        }
                    }, (error) => {
                        // システムエラー
                        return reject([ERR_SYSTEM, 'アプリ配布領域の画像エンドファイル読み取りエラー', error]);
                    });
                    // 画像ディレクトリ削除
                });
            }).then((isCopy) => {
                return new Promise((resolve, reject) => {
                    // ファイルコピーが必要ない場合は実施しない
                    if (!isCopy)
                        return resolve(isCopy);
                    logicCom.directoryDelete(MAST_FILE.IMG.TARGET_DIR, () => {
                        // 成功
                        return resolve(isCopy);
                    }, (error) => {
                        // システムエラー
                        return reject([ERR_SYSTEM, '画像ディレクトリ削除エラー', error]);
                    });
                    // 画像ファイルコピー処理
                });
            }).then((isCopy) => {
                return new Promise((resolve, reject) => {
                    // ファイルコピーが必要ない場合は実施しない
                    if (!isCopy)
                        return resolve();
                    logicCom.directoryCopy(MAST_FILE.IMG.SRC_DIR, MAST_FILE.IMG.TARGET_IMG_DIR, MAST_FILE.IMG.COPY_DIR, () => {
                        // 成功
                        logicCom.infoLog('画像ディレクトリコピー完了');
                        return resolve();
                    }, (error) => {
                        // システムエラー
                        return reject([ERR_SYSTEM, '画像ファイル・ディレクトリ作成エラー', error]);
                    });
                    // 成功
                });
            }).then(() => {
                return new Promise((resolve, reject) => {
                    return successCallBack();
                    // 失敗
                });
            }).catch((error) => {
                return errorCallBack(error);
            });
        };
        /**
         * 受付NO通番リセット
         *
         * @param successCallBack - 成功時のコールバック関数
         * @param errorCallBack   - 失敗時のコールバック関数
         */
        var resetReceptionNumber = function (successCallBack, errorCallBack) {
            // 業務日付
            clientDb = AppCom.ClientDb.open();
            var serviceTime = AppBizCom.DataHolder.getServiceTime();
            var GYOMU_DATE = serviceTime.GYOMU_DATE;
            // 当日営業日が変わったら通番をリセット
            var sql = `
            UPDATE KR_RCPT_NO_KNR
            SET DB_UPDJI2 = ?,
                RCPT_NO_TUBN = 0
            WHERE DB_UPDJI2 != ?`;
            // SQL実行
            AppCom.ClientDb.execSQL(clientDb, sql, [GYOMU_DATE, GYOMU_DATE], () => {
                // 成功
                return successCallBack();
            }, (error) => {
                // システムエラー
                return errorCallBack([ERR_SYSTEM, '受付NO通番リセットSQLエラー', error]);
            });
        };
        /**
         * 受付NO通番取得
         *
         * @param successCallBack - 成功時のコールバック関数
         * @param errorCallBack   - 失敗時のコールバック関数
         */
        var selectRcptNo = function (successCallBack, errorCallBack) {
            // 受付NO通番取得
            var sql = `
                SELECT DB_UPDJI1,
                    DB_UPDJI2,
                    RCPT_NO_TUBN 
                FROM KR_RCPT_NO_KNR`;
            // SQL実行
            AppCom.ClientDb.execSQL(clientDb, sql, [], (result) => {
                // 成功
                var row = result.rows.item(0);
                if (row) {
                    // 取得結果あり
                    return successCallBack(row);
                }
                else {
                    // 取得結果無し
                    return errorCallBack([ERR_SYSTEM, '受付NO通番取得0件エラー', result.rows.length]);
                }
            }, (error) => {
                // システムエラー
                return errorCallBack([ERR_SYSTEM, '受付NO通番取得SQLエラー', error]);
            });
        };
        /**
         * 受付NO通番更新
         *
         * @param successCallBack - 成功時のコールバック関数
         * @param errorCallBack   - 失敗時のコールバック関数
         */
        var updateRcptNo = function (successCallBack, errorCallBack) {
            // 受付NO通番を上書き
            var sql = `
            UPDATE KR_RCPT_NO_KNR
            SET DB_UPDJI1 = ?,
                DB_UPDJI2 = ?,
                RCPT_NO_TUBN = ?`;
            // SQL実行
            AppCom.ClientDb.execSQL(clientDb, sql, [tempRcptNo.DB_UPDJI1, tempRcptNo.DB_UPDJI2, tempRcptNo.RCPT_NO_TUBN], () => {
                // 成功
                return successCallBack();
            }, (error) => {
                // システムエラー
                return errorCallBack([ERR_SYSTEM, '受付NO通番リセットSQLエラー', error]);
            });
        };
        /**
         * 時刻をフォーマットする
         * @param format - フォーマット（HH、MM、SSSを指定可）
         * @param time   - HH24mi形式の時刻を指定
         */
        var formatTime = function (format, time) {
            var result = format.replace('HH', time.substr(0, 2))
                .replace('H', String(Number(time.substr(0, 2))))
                .replace('MM', time.substr(2, 2))
                .replace('M', String(Number(time.substr(2, 2))))
                .replace('SS', '00')
                .replace('S', '0');
            return result;
        };
        /**
         * ログDBコピー処理
         * @param {callback} successCallBack - 成功時のコールバック関数
         * @param {callback} errorCallBack   - 失敗時のコールバック関数
         */
        var logDbFileOperation = function (successCallBack, errorCallBack) {
            var isExistsEndFile = false;
            // ディレクトリ作成（既に存在する場合は再作成しない）
            new Promise((resolve, reject) => {
                logicCom.createDirectory(MAST_FILE.DB.TARGET_ROOT_DIR, MAST_FILE.DB.CREATE_DIR, () => {
                    // 成功
                    return resolve();
                }, (error) => {
                    // システムエラー
                    return reject([ERR_SYSTEM, 'DBディレクトリ作成失敗', error]);
                });
                // 利用領域のログエンドファイル存在確認
            }).then(() => {
                return new Promise((resolve, reject) => {
                    logicCom.existsFile(MAST_FILE.DB.TARGET_DIR + MAST_FILE.LOG.END_FILE_NAME, (isExists) => {
                        isExistsEndFile = isExists;
                        return resolve(isExists);
                    });
                    // ログエンドファイルを読み取り（利用領域）
                });
            }).then((isExists) => {
                return new Promise((resolve, reject) => {
                    // 利用領域のログエンドファイルが存在しない場合は読み取らない
                    if (!isExists)
                        return resolve();
                    logicCom.readFileTxtData(MAST_FILE.DB.TARGET_DIR + MAST_FILE.LOG.END_FILE_NAME, (versionUse) => {
                        // 成功
                        return resolve(versionUse);
                    }, (error) => {
                        // システムエラー
                        return reject([ERR_SYSTEM, 'アプリ利用領域のログDBエンドファイル読み取りエラー', error]);
                    });
                    // ログエンドファイルを読み取り（配布領域）
                });
            }).then((versionUse) => {
                return new Promise((resolve, reject) => {
                    var isCopy = true;
                    // 利用領域のログエンドファイルを読み取っていない場合は、配布領域も読み取らない
                    if (!versionUse)
                        return resolve(isCopy);
                    logicCom.readFileTxtData(MAST_FILE.DB.SRC_DIR + MAST_FILE.LOG.END_FILE_NAME, (versionDistribute) => {
                        if (versionUse == versionDistribute) {
                            // ログDBバージョン変更なし
                            isCopy = false;
                            return resolve(isCopy);
                        }
                        else {
                            // ログDBバージョン変更あり
                            return resolve(isCopy);
                        }
                    }, (error) => {
                        // システムエラー
                        return reject([ERR_SYSTEM, 'アプリ配布領域のログDBエンドファイル読み取りエラー', error]);
                    });
                    // ログエンドファイルコピー
                });
            }).then((isCopy) => {
                return new Promise((resolve, reject) => {
                    // ファイルコピーが必要ない場合は実施しない
                    if (!isCopy)
                        return resolve(isCopy);
                    logicCom.fileCopy(MAST_FILE.DB.SRC_DIR + MAST_FILE.LOG.END_FILE_NAME, MAST_FILE.DB.TARGET_DIR, MAST_FILE.LOG.END_FILE_NAME, () => {
                        // 成功
                        return resolve(isCopy);
                    }, (error) => {
                        // システムエラー
                        return reject([ERR_SYSTEM, 'ログDBエンドファイルコピーエラー', error]);
                    });
                    // ログDB削除
                });
            }).then((isCopy) => {
                return new Promise((resolve, reject) => {
                    // ファイルコピーが必要ない場合、またはそもそもログDBが存在しない場合は実施しない
                    if (!isExistsEndFile || (isExistsEndFile && !isCopy))
                        return resolve();
                    window.sqlitePlugin.deleteDatabase({ name: 'aplLog.db', location: 'default' }, () => {
                        // 成功
                        return resolve();
                    }, (error) => {
                        // システムエラー
                        return reject([ERR_SYSTEM, 'ログDB削除エラー', error]);
                    });
                    // 成功：ログDB初期化
                });
            }).then(() => {
                return new Promise((resolve, reject) => {
                    // ログ共通部品の初期化
                    AppCom.Log.init(() => {
                        // 成功
                        return successCallBack();
                    }, (error) => {
                        // 失敗
                        return errorCallBack([ERR_SYSTEM, 'ログ共通部品初期化エラー', error]);
                    });
                    // 失敗
                });
            }).catch((error) => {
                // ログ共通部品の初期化
                AppCom.Log.init(() => {
                    // 成功
                    return errorCallBack(error);
                }, () => {
                    // 失敗
                    return errorCallBack(error);
                });
            });
        };
    }]);
