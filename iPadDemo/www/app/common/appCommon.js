/// <reference path="../reference.d.ts" />
/*
    修正履歴
    2021/05/27 【ｉＰａｄ口座開設・事務手続きアプリ】ｉＯＳ１４対応のバージョンアップ　CAC大橋
   「正確な位置情報」の一時権限請求を追加
 */
App
    .factory('AppCom', ['AppComLog', 'AppComDevice', 'AppComClientDb', 'AppComClientSls', 'AppComDate', 'AppComApp', 'AppComStringUtil', 'AppComEncrypt', 'AppComHttp',
    function (AppComLog, AppComDevice, AppComClientDb, AppComClientSls, AppComDate, AppComApp, AppComStringUtil, AppComEncrypt, AppComHttp) {
        return {
            Log: AppComLog,
            Device: AppComDevice,
            ClientDb: AppComClientDb,
            ClientSls: AppComClientSls,
            Http: AppComHttp,
            Date: AppComDate,
            App: AppComApp,
            StringUtil: AppComStringUtil,
            Encrypt: AppComEncrypt,
        };
    }])
    .service('AppComLog', ['AppComDevice', 'AppComClientDb', 'AppComHttp', 'AppComDate', 'LOG_LEVEL_SETTING', 'LOG_LEVEL_ORDER', 'appConst', 'APL_KBN', 'AppComStringUtil',
    function (AppComDevice, AppComClientDb, AppComHttp, AppComDate, LOG_LEVEL_SETTING, LOG_LEVEL_ORDER, appConst, APL_KBN, AppComStringUtil) {
        /** ログDB接続オブジェクト．*/
        var logDb = null;
        /**
         * ログをDBに書き込む機能．
         *
         * @param {string} proper   - 社員ID
         * @param {string} shop     - 受付者店部課コード
         * @param {string} section  - 受付者係コード
         * @param {string} msgLevel - メッセージレベル(E：ERROR；I：INFO；W：WARINGなど)
         * @param {string} msg      - メッセージ内容（エラーメッセージ、タップボタン名など）
         * @param {string} action   - アクションログ内容
         * @param {string} ido      - 緯度
         * @param {string} keido    - 経度
         * @return void
         */
        var _writeLog = function (proper, shop, section, msgLevel, msg, action, ido, keido) {
            // メッセージレベル未指定の場合は即時．処理を終了．
            if (!msgLevel)
                return;
            var logLvlSetting = LOG_LEVEL_ORDER[LOG_LEVEL_SETTING];
            var logLvlTarget = LOG_LEVEL_ORDER[msgLevel];
            // パラメータのメッセージレベルが指定出力レベルより低い場合は即時，処理を終了する．
            if (!logLvlSetting || !logLvlTarget || logLvlSetting > logLvlTarget)
                return;
            var time = AppComDate.getCurrentTimeMillis().replace(/[\D]/g, '');
            // アプリ区分
            var aplKbn = APL_KBN;
            var sql = `
            INSERT INTO LOG(
                PROPER_CD,
                UKETSUKE_MISE_CD,
                UKETSUKE_KAKARI_CD,
                LOG_TIME,
                IDO,
                KEIDO,
                APL_KBN,
                LEVEL,
                MESSAGE,
                ACTION)
            VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
            var params = [
                proper || 'NoUser',
                shop || '0000',
                section || '0000',
                time,
                ido || null,
                keido || null,
                aplKbn,
                msgLevel,
                msg || '-',
                action || '-'
            ];
            // DBにログを書き込む．
            AppComClientDb.execSQL(logDb, sql, params, function () { }, function () { });
        };
        return {
            /**
             * ログ共通部品を初期化する．
             *
             * ・ログDBの接続オブジェクトを生成する．
             * ・ログTBLが存在しない場合，クリエイトする．
             * ・既にログTBLが存在する場合は，クリエイトしない．
             *
             * @param {callback} successCallback - 成功時のコールバック関数
             * @param {callback} errorCallback   - 失敗時のコールバック関数
             * @return void
             */
            init: function (successCallback, errorCallback) {
                // ログDB接続オブジェクトを初期化．
                if (!logDb)
                    logDb = AppComClientDb.openTarget('aplLog.db', 'default');
                // ログDBにTBLが存在しない場合は，クリエイトするSQL文．
                var sql = `
                CREATE TABLE IF NOT EXISTS LOG (
                    PROPER_CD	        TEXT NOT NULL,
                    UKETSUKE_MISE_CD	TEXT NOT NULL,
                    UKETSUKE_KAKARI_CD	TEXT NOT NULL,
                    LOG_TIME	        TEXT NOT NULL,
                    IDO	                TEXT,
                    KEIDO	            TEXT,
                    APL_KBN	            TEXT NOT NULL,
                    LEVEL	            TEXT NOT NULL,
                    MESSAGE	            TEXT NOT NULL,
                    ACTION	            TEXT NOT NULL,
                    PRIMARY KEY(PROPER_CD, LOG_TIME)
                )`;
                // ログDBにTBLをクリエイト．
                AppComClientDb.execSQL(logDb, sql, [], successCallback, errorCallback);
            },
            /**
             * ログをDBに書き込む機能(GPSなし)．
             *
             * ・メッセージレベル未指定の場合は，ログを出力しない．
             * ・ログのDB書き込みに失敗してもエラーとしない．
             * ・パラメータのメッセージレベルが指定出力レベル未満の場合は，ログを書き込まない．
             * ・社員IDの指定が，空文字／NULL／undefinedの場合，'NoUser'を書き込む．
             * ・受付者店部課コードの指定が，空文字／NULL／undefinedの場合，'0000'を書き込む．
             * ・受付者係コードの指定が，空文字／NULL／undefinedの場合，'000000'を書き込む．
             * ・メッセージ内容の指定が，空文字／NULL／undefinedの場合，半角ハイフンを書き込む．
             * ・アクションログ内容の指定が，空文字／NULL／undefinedの場合，半角ハイフンを書き込む．
             * ・DBのログ作成日時は，iPadの現在時間を書き込む．
             * ・DBの緯度／経度は，NULLを書き込む．
             *
             * @param {string} proper   - 社員ID
             * @param {string} shop     - 受付者店部課コード
             * @param {string} section  - 受付者係コード
             * @param {string} msgLevel - メッセージレベル(E：ERROR；I：INFO；W：WARINGなど)
             * @param {string} msg      - メッセージ内容（エラーメッセージ、タップボタン名など）
             * @param {string} action   - アクションログ内容
             * @return void
             */
            writeLog: function (proper, shop, section, msgLevel, msg, action) {
                _writeLog(proper, shop, section, msgLevel, msg, action, null, null);
            },
            /**
             * ログをDBに書き込む機能(GPS出力あり)．
             *
             * ・メッセージレベル未指定の場合は，ログを出力しない．
             * ・ログのDB書き込みに失敗してもエラーとしない．
             * ・パラメータのメッセージレベルが指定出力レベル未満の場合は，ログを書き込まない．
             * ・社員IDの指定が，空文字／NULL／undefinedの場合，'NoUser'を書き込む．
             * ・受付者店部課コードの指定が，空文字／NULL／undefinedの場合，'0000'を書き込む．
             * ・受付者係コードの指定が，空文字／NULL／undefinedの場合，'000000'を書き込む．
             * ・メッセージ内容の指定が，空文字／NULL／undefinedの場合，半角ハイフンを書き込む．
             * ・アクションログ内容の指定が，空文字／NULL／undefinedの場合，半角ハイフンを書き込む．
             * ・緯度／経度の指定が，空文字／undefinedの場合，NULLを書き込む．
             * ・DBのログ作成日時は，iPadの現在時間を書き込む．
             *
             * @param {string} proper   - 社員ID
             * @param {string} shop     - 受付者店部課コード
             * @param {string} section  - 受付者係コード
             * @param {string} msgLevel - メッセージレベル(E：ERROR；I：INFO；W：WARINGなど)
             * @param {string} msg      - メッセージ内容（エラーメッセージ、タップボタン名など）
             * @param {string} action   - アクションログ内容
             * @param {string} ido      - 緯度
             * @param {string} keido    - 経度
             * @return void
             */
            writeLogWithGps: function (proper, shop, section, msgLevel, msg, action, ido, keido) {
                _writeLog(proper, shop, section, msgLevel, msg, action, ido, keido);
            },
            /**
             * iPadのログをReDOSサーバに送信する．
             *
             * ・ログが存在しない場合は即時，正常終了する．
             * ・DBからログを取得後，ReDOSサーバに送信する．
             *
             * @param {callback} successCallback - 成功時のコールバック関数
             * @param {callback} errorCallback   - 失敗時のコールバック関数
             * @return void
             */
            uploadLog: function (successCallback, errorCallback) {
                var time = AppComDate.getCurrentTimeMillis().replace(/[\D]/g, '');
                var uuid = AppComDevice.getUuid();
                var sql = `
                SELECT PROPER_CD,
                    UKETSUKE_MISE_CD,
                    UKETSUKE_KAKARI_CD,
                    LOG_TIME, IDO, KEIDO, APL_KBN,
                    LEVEL, MESSAGE,
                    ACTION
                FROM LOG
                WHERE LOG_TIME <= ?
                ORDER BY PROPER_CD,
                    UKETSUKE_MISE_CD,
                    UKETSUKE_KAKARI_CD,
                    LOG_TIME`;
                // DBからログを取得．
                AppComClientDb.execSQL(logDb, sql, [time], function (resultSet) {
                    var count = resultSet.rows.length;
                    // 取得結果なしの場合は即時，正常終了．
                    if (count == 0)
                        return successCallback({ RESULT_CODE: 1 }, '', '');
                    // ＩＦを作成．
                    var subif010Send = {
                        TODAY: time,
                        UUID: uuid,
                        LOG_DATA: [],
                    };
                    // ユーザごとにログをグルーピング．
                    var current = {
                        PROPER_CD: '',
                        UKETSUKE_MISE_CD: '',
                        UKETSUKE_KAKARI_CD: '',
                        LOG_RECORD: [],
                    };
                    for (var i = 0; i < count; i++) {
                        var row = resultSet.rows.item(i);
                        if (current.PROPER_CD != row.PROPER_CD
                            || current.UKETSUKE_MISE_CD != row.UKETSUKE_MISE_CD
                            || current.UKETSUKE_KAKARI_CD != row.UKETSUKE_KAKARI_CD) {
                            // 別ユーザのグルーピングを開始．
                            current = {
                                PROPER_CD: row.PROPER_CD,
                                UKETSUKE_MISE_CD: row.UKETSUKE_MISE_CD,
                                UKETSUKE_KAKARI_CD: row.UKETSUKE_KAKARI_CD,
                                LOG_RECORD: [],
                            };
                            subif010Send.LOG_DATA.push(current);
                        }
                        // アクションログをBASE64に変換
                        var action = AppComStringUtil.utf16ToBase64(row.ACTION);
                        // ログを登録．
                        current.LOG_RECORD.push({
                            LOG_TIME: row.LOG_TIME,
                            IDO: row.IDO,
                            KEIDO: row.KEIDO,
                            APL_KBN: row.APL_KBN,
                            LEVEL: row.LEVEL,
                            MESSAGE: row.MESSAGE,
                            ACTION: action,
                        });
                    }
                    // ReDOSサーバにログを送信．
                    AppComHttp.post(appConst.SUBIF010.PATH, subif010Send, function (subif010Recv, status) {
                        successCallback(subif010Recv, status, time);
                    }, function (data, status) {
                        errorCallback(data, status, time);
                    });
                }, errorCallback);
            },
            /**
             * REDOSサーバに送信したログをiPadから削除する．
             *
             * ・削除対象日時以前のログを削除する．
             * ・削除対象日時が未指定の場合は即時，正常終了する．
             *
             * @param {datetime} datetime        - 削除対象日時（yyyyMMddHHmmssSSS or yyyy-MM-dd HH:mm:ss.SSS）
             * @param {callback} successCallback - 成功時のコールバック関数
             * @param {callback} errorCallback   - 失敗時のコールバック関数
             * @return void
             */
            deleteLog: function (datetime, successCallback, errorCallback) {
                // 削除対象日時が未指定の場合は即時，正常終了．
                if (!datetime)
                    return successCallback();
                var time = datetime.replace(/[\D]/g, '');
                var sql = `
                DELETE FROM LOG 
                WHERE LOG_TIME <= ?`;
                // ログを削除．
                AppComClientDb.execSQL(logDb, sql, [time], successCallback, errorCallback);
            },
            consoleLog: function (fileName, msg, param) {
                if (LOG_LEVEL_ORDER[LOG_LEVEL_SETTING] === 1) {
                    console.log('Debug:（' + fileName + '）　' + msg);
                    param && console.dir(param);
                }
            },
        };
    }])
    .factory('AppComDevice', ['$filter', function ($filter) {
        var getGpsOption = {
            enableHighAccuracy: false,
            timeout: 1000,
            maximumAge: 0
        };
        return {
            /**
             * 端末側のIOSバージョンを取得する。
             *
             * @return {string} IOSバージョン
             */
            getIosVer: function () {
                return device.version;
            },
            /**
             * 端末側のインターネット接続情報を取得する。
             * 取得結果は下記となる。
             * ・Connection.UNKNOWN
             * ・Connection.ETHERNET
             * ・Connection.WIFI
             * ・Connection.CELL_2G
             * ・Connection.CELL_3G
             * ・Connection.CELL_4G
             * ・Connection.CELL
             * ・Connection.NONE
             *
             * @return {number} インターネット接続情報
             */
            getNetworkStatus: function () {
                return navigator.connection.type;
            },
            /**
             * カメラの使用可否状態を取得する。
             *
             * @param {successCallback} successCallback - 成功時のコールバック関数
             * @param {errorCallback} errorCallback - 失敗時のコールバック関数
             */
            isCameraAvailable: function (successCallback, errorCallback) {
                cordova.plugins.diagnostic.getCameraAuthorizationStatus(successCallback, errorCallback);
            },
            /**
             * GPSの使用許可ダイアログを表示します。
             *
             * @param {grantedCallback} grantedCallback - GPS使用権限付与時のコールバック関数
             * @param {deniedCallback} deniedCallback - GPS使用権限否定時のコールバック関数
             * @param {errorCallback} errorCallback - システムエラー時のコールバック関数
             */
            requestGpsAuthorization: function (grantedCallback, deniedCallback, errorCallback) {
                cordova.plugins.diagnostic.getLocationAuthorizationStatus(function (currentStatus) {
                    if (currentStatus == cordova.plugins.diagnostic.permissionStatus.NOT_REQUESTED) {
                        cordova.plugins.diagnostic.requestLocationAuthorization(function (requestedStatus) {
                            if (requestedStatus == cordova.plugins.diagnostic.permissionStatus.GRANTED_WHEN_IN_USE) {
                                angular.isFunction(grantedCallback) && grantedCallback();
                            }
                            else {
                                angular.isFunction(deniedCallback) && deniedCallback(requestedStatus);
                            }
                        }, errorCallback, cordova.plugins.diagnostic.locationAuthorizationMode.WHEN_IN_USE);
                    }
                    else if (currentStatus == cordova.plugins.diagnostic.permissionStatus.GRANTED_WHEN_IN_USE
                        || currentStatus == cordova.plugins.diagnostic.permissionStatus.GRANTED) {
                        angular.isFunction(grantedCallback) && grantedCallback();
                    }
                    else {
                        angular.isFunction(deniedCallback) && deniedCallback(currentStatus);
                    }
                }, errorCallback);
            },
            /**
             * GPSの使用可否状態を取得する。
             *
             * @param {callback} callback - 成功時のコールバック関数 (GPSの使用可の場合コールバック関数パラメータ true)
             */
            isGpsAvailable: function (callback) {
                cordova.plugins.diagnostic.isLocationAvailable(function (available) {
                    angular.isFunction(callback) && callback(available);
                }, function (error) {
                    angular.isFunction(callback) && callback(false);
                });
            },
            /**
             * GPS情報を取得する。
             *
             * @param {successCallback} successCallback - 成功時のコールバック関数
             * @param {errorCallback} errorCallback - 失敗時のコールバック関数
             */
            getDeolocation: function (successCallback, errorCallback) {
                navigator.geolocation.getCurrentPosition(function (position) {
                    var result = { coords: { latitude: "", longitude: "" } };
                    result.coords.latitude = $filter('number')(position.coords.latitude, 13);
                    result.coords.longitude = $filter('number')(position.coords.longitude, 13);
                    angular.isFunction(successCallback) && successCallback(result);
                }, errorCallback, getGpsOption);
            },
            /**
             * 端末側のアプリのUUIDを取得する。
             *
             * @return {string} UUID
             */
            getUuid: function () {
                return device.uuid;
            },
            /**
             * バッジ通知の使用可否状態を取得する。
             *
             * @param {grantedCallback} grantedCallback - バッジ通知権限付与時のコールバック関数
             * @param {deniedCallback} deniedCallback - バッジ通知権限否定時のコールバック関数
             * @param {errorCallback} errorCallback - システムエラー時のコールバック関数
             */
            isBadgeNotificationAvailable: function (grantedCallback, deniedCallback, errorCallback) {
                cordova.plugins.notification.badge.requestPermission((granted) => {
                    if (granted) {
                        cordova.plugins.diagnostic.getRemoteNotificationTypes((types) => {
                            if (types.badge) {
                                angular.isFunction(grantedCallback) && grantedCallback();
                            }
                            else {
                                angular.isFunction(deniedCallback) && deniedCallback(types);
                            }
                        }, (err) => {
                            angular.isFunction(errorCallback) && errorCallback(err);
                        });
                    }
                    else {
                        angular.isFunction(deniedCallback) && deniedCallback('denied');
                    }
                });
                // 01-2021-04-430 【ｉＰａｄ口座開設・事務手続きアプリ】ｉＯＳ１４対応のバージョンアップ 開始 20210527
            },
            /**
             * バッジ通知の使用許可を取得する。
             *
             * @param {grantedCallback} grantedCallback - バッジ使用許可請求成功時のコールバック関数
             * @param {deniedCallback} deniedCallback - バッジ使用許可請求失敗時のコールバック関数
             */
            requestBadgeAuthorization: function (grantedCallback, deniedCallback) {
                cordova.plugins.diagnostic.requestRemoteNotificationsAuthorization({
                    successCallback: function () {
                        angular.isFunction(grantedCallback) && grantedCallback();
                    },
                    errorCallback: function (err) {
                        angular.isFunction(deniedCallback) && deniedCallback(err);
                    },
                    types: [
                        cordova.plugins.diagnostic.remoteNotificationType.ALERT,
                        cordova.plugins.diagnostic.remoteNotificationType.SOUND,
                        cordova.plugins.diagnostic.remoteNotificationType.BADGE
                    ],
                    omitRegistration: false
                });
            },
            /**
             * 「正確な位置情報」の一時権限請求のポップアップダイアログを表示します。
             *
             * @param {grantedCallback} grantedCallback - 「正確な位置情報」使用権限付与時のコールバック関数
             * @param {deniedCallback} deniedCallback - 「正確な位置情報」使用権限否定時のコールバック関数
             * @param {errorCallback} errorCallback - システムエラー時のコールバック関数
             */
            requestFullAccuracyAuthorization: function (grantedCallback, deniedCallback, errorCallback) {
                // IOS14以上のみチェック実施
                var tmpOsVer = this.getIosVer().split('.');
                if (tmpOsVer[0] < 14) {
                    // IOS14未満はスキップ
                    angular.isFunction(grantedCallback) && grantedCallback();
                }
                else {
                    cordova.plugins.diagnostic.getLocationAccuracyAuthorization(function (currentStatus) {
                        if (currentStatus == cordova.plugins.diagnostic.locationAccuracyAuthorization.REDUCED) {
                            cordova.plugins.diagnostic.requestTemporaryFullAccuracyAuthorization('full', function (requestedStatus) {
                                if (requestedStatus == cordova.plugins.diagnostic.locationAccuracyAuthorization.FULL) {
                                    angular.isFunction(grantedCallback) && grantedCallback();
                                }
                                else {
                                    angular.isFunction(deniedCallback) && deniedCallback(requestedStatus);
                                }
                            }, errorCallback);
                        }
                        else if (currentStatus == cordova.plugins.diagnostic.locationAccuracyAuthorization.FULL) {
                            angular.isFunction(grantedCallback) && grantedCallback();
                        }
                        else {
                            angular.isFunction(deniedCallback) && deniedCallback(currentStatus);
                        }
                    }, errorCallback);
                }
                // 01-2021-04-430 【ｉＰａｄ口座開設・事務手続きアプリ】ｉＯＳ１４対応のバージョンアップ 終了 20210527
            }
        };
    }])
    .service('AppComClientDb', function () {
    /**
     * 指定Sqliteデータベースを開く機能を提供する。
     *
     * @param {string} nm - DB名
     * @param {string} locat - DB場所
     * @return {any} DB接続
     */
    this.openTarget = function (nm, locat) {
        return window.sqlitePlugin.openDatabase({ name: nm, location: locat });
    };
    /**
     * 業務用Sqliteデータベースを開く機能を提供する。
     *
     * @return {any} DB接続
     */
    this.open = function () {
        return self.openTarget('apl.db', 'default');
    };
    /**
     * 指定Sqliteデータベースを閉じる機能を提供する。
     *
     * @param {any} db - DB接続
     * @param {successCallback} successCallback - 成功時のコールバック関数
     * @param {errorCallback} errorCallback - 失敗時のコールバック関数
     */
    this.close = function (db, successCallback, errorCallback) {
        db.close(successCallback, errorCallback);
    };
    /**
     * sql実行する機能を提供する。
     *
     * @param {any} db - DB接続
     * @param {string} sqlBase - SQL文
     * @param {string} sqlParams - SQL文のパラメータ
     * @param {successCallback} successCallback - 成功時のコールバック関数
     * @param {errorCallback} errorCallback - 失敗時のコールバック関数
     */
    this.execSQL = function (db, sqlBase, sqlParams, successCallback, errorCallback) {
        db.executeSql(sqlBase, sqlParams, successCallback, errorCallback);
    };
    /**
     * バッチ方式でsql実行する機能を提供する。
     *
     * @param {any} db - DB接続
     * @param {Array} sqlList - SQL文及びパラメータ
     * @param {successCallback} successCallback - 成功時のコールバック関数
     * @param {errorCallback} errorCallback - 失敗時のコールバック関数
     */
    this.execSQLBat = function (db, sqlList, successCallback, errorCallback) {
        db.sqlBatch(sqlList, successCallback, errorCallback);
    };
    var self = this;
})
    .factory('AppComClientSls', [function () {
        return {
            /**
             * キーと値（Object）をSLSに格納する。
             *
             * @param {string} time - 端末時刻「 yyyy-MM-dd HH:mm:ss.sss 」
             * @param {string} type - 申込種別 1:口座開設、2:事務手続き、3:電子帳票。
             * @param {Object} value - 値
             * @param {successCallback} successCallback - 成功時のコールバック関数
             * @param {errorCallback} errorCallback - 失敗時のコールバック関数
             */
            setObject: function (time, type, value, successCallback, errorCallback) {
                var key = time + type;
                sls.setItem(successCallback, errorCallback, key, JSON.stringify(value));
            },
            /**
             * SLSから指定したキーに対する値（Object）を取得する。
             * ・指定したキーが存在しない場合、{}(空オブジェクト)を返す。
             *
             * @param {string} key - キー
             * @param {successCallback} successCallback - 成功時のコールバック関数
             * @param {errorCallback} errorCallback - 失敗時のコールバック関数
             */
            getObject: function (key, successCallback, errorCallback) {
                sls.getItem(function (result) {
                    successCallback(JSON.parse(result || '{}'));
                }, errorCallback, key);
            },
            /**
             * SLSに指定したキーのデータを削除する。
             *
             * @param {string} key - キー
             * @param {successCallback} successCallback - 成功時のコールバック関数
             * @param {errorCallback} errorCallback - 失敗時のコールバック関数
             */
            removeItem: function (key, successCallback, errorCallback) {
                sls.removeItem(successCallback, errorCallback, key);
            },
            /**
             * SLSに格納しているデータの件数を取得する。
             *
             * @param {successCallback} successCallback - 成功時のコールバック関数
             * @param {errorCallback} errorCallback - 失敗時のコールバック関数
             */
            getKeyLength: function (successCallback, errorCallback) {
                sls.length(successCallback, errorCallback);
            },
            /**
             * SLSに指定したindexのデータのキーを取得する。
             *
             * @param {number} index - SLSに格納されたデータのindex（※int型。nullや不正値の場合は0番目のキー名、存在しない場合は空文字を返却する）
             * @param {successCallback} successCallback - 成功時のコールバック関数
             * @param {errorCallback} errorCallback - 失敗時のコールバック関数
             */
            getKey: function (index, successCallback, errorCallback) {
                sls.key(successCallback, errorCallback, index);
            }
        };
    }])
    .factory('AppComHttp', ['$http', 'CURRENT_CONFIG', 'AppComDate', 'AppComEncrypt', function ($http, CURRENT_CONFIG, AppComDate, AppComEncrypt) {
        return {
            /**
             * AngularJSの$httpサービスのpostメソッドを使用し、アプリ側のデータをサーバ側の指定したURLに転送する。
             *
             * @param {string} apiUrl - リクエスト先のURL
             * @param {FormData | string | object } params - 暗号化済み送信データ
             * @param {Function} successCallback - 成功時のコールバック関数
             * @param {Function} errorCallback - 失敗時のコールバック関数
             */
            post: function (apiUrl, params, successCallback, errorCallback, isMultiPart = false) {
                if (!angular.isFunction(successCallback) || !angular.isFunction(errorCallback)) {
                    throw new Error('「REDOSサーバへの通信機能」のコールバック関数はFunctionではない');
                }
                var config = {
                    // ヘッダー
                    headers: {
                        'Accept': 'application/json'
                    },
                    type: 'post',
                    scriptCharset: 'utf-8',
                };
                // アプリ側の現在時刻(ミリ秒まで)を取得する ・フォーマット：yyyy-MM-dd HH:mm:ss.sss
                var nowTime = AppComDate.getCurrentTimeMillis();
                // Authorization情報を暗号化する
                config.headers['Authorization'] = AppComEncrypt.encryptAES128ECB(nowTime);
                config.headers['Content-Type'] = isMultiPart ? undefined : 'application/json; charset=UTF-8';
                $http.post(CURRENT_CONFIG.API_URL + apiUrl, params, config).then(function (result) {
                    // よって、安全のためにもiPad側でレスポンスのContent-Typeがapplication/jsonでは無かった場合、強制的にレスポンスコードを200以外に書き換えるといった対応が必要になるかと思います。
                    if (result.headers('content-type').indexOf('application/json') === -1) {
                        try {
                            // ログ用DB開く、テーブル作成
                            var db = window.sqlitePlugin.openDatabase({ name: 'aplLog.db', location: 'default' });
                            db.executeSql('CREATE TABLE IF NOT EXISTS LOG (PROPER_CD TEXT NOT NULL, UKETSUKE_MISE_CD TEXT NOT NULL, UKETSUKE_KAKARI_CD TEXT NOT NULL, LOG_TIME TEXT NOT NULL, IDO TEXT, KEIDO TEXT, APL_KBN TEXT NOT NULL, LEVEL TEXT NOT NULL, MESSAGE TEXT NOT NULL, ACTION TEXT NOT NULL, PRIMARY KEY(PROPER_CD, LOG_TIME))', [], function () {
                                var logTime = nowTime.replace(/[\D]/g, '');
                                db.executeSql('INSERT INTO LOG(PROPER_CD, UKETSUKE_MISE_CD, UKETSUKE_KAKARI_CD, LOG_TIME, IDO, KEIDO, APL_KBN, LEVEL, MESSAGE, ACTION) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', ['noUser', '000', '0000', logTime, null, null, '2', 'E', 'レスポンスのContent-Typeがapplication/jsonではない', '-'], function () {
                                    errorCallback(result.data, 500);
                                }, function () {
                                    errorCallback(result.data, 500);
                                });
                            }, function () {
                                errorCallback(result.data, 500);
                            });
                        }
                        catch (e) {
                            // エラー無視
                            errorCallback(result.data, 500);
                        }
                    }
                    else {
                        successCallback(result.data, result.status);
                    }
                }, function (result) {
                    errorCallback(result.data, result.status);
                });
            }
        };
    }])
    .factory('AppComDate', ['$filter', 'appConst', function ($filter, appConst) {
        /**
         * チェック対象文字列が半角数字かをチェックする。
         *
         * @param {string} chkStr - チェック対象文字列
         * @return {boolean} チェック結果--true：半角数字；false：半角数字以外の文字が含まれている
         */
        var isNum = function (chkStr) {
            // チェック対象文字列がnull または ""(ブランク)の場合、チェック結果がfalse。
            if (chkStr == null || chkStr == "") {
                return false;
            }
            else {
                // チェック対象文字列が半角数字の場合、チェック結果がtrue。
                if (chkStr.match(/^[0-9]+$/)) {
                    return true;
                }
                else {
                    return false;
                }
            }
        };
        var minGengo = 1;
        var maxGengo = 5;
        return {
            /**
             * アプリ側の現在日付を取得する。
             * ・フォーマット：yyyy-MM-dd
             *
             * @return {string} 現在日付(yyyy-MM-dd)
             */
            getCurrentDate: function () {
                return $filter('date')(new Date(), "yyyy-MM-dd");
            },
            /**
             * アプリ側の現在時刻(ミリ秒まで)を取得する。
             * ・フォーマット：yyyy-MM-dd HH:mm:ss.sss
             *
             * @return {string} 現在時刻(yyyy-MM-dd HH:mm:ss.sss)
             */
            getCurrentTimeMillis: function () {
                return $filter('date')(new Date(), "yyyy-MM-dd HH:mm:ss.sss");
            },
            /**
             * アプリ端末側の現在時刻(分まで)を取得する。
             * ・フォーマット：yyyy-MM-dd HHmm
             *
             * @return {string} 現在時刻(yyyy-MM-dd HHmm)
             */
            getCurrentTimeMinute: function () {
                return $filter('date')(new Date(), "yyyy-MM-dd HHmm");
            },
            /**
             * チェック対象文字列が実日付かをチェックする。
             *
             * @param {string} strYear - 年
             * @param {string} strMonth - 月
             * @param {string} strDay - 日
             * @return {boolean} チェック結果--true：実日付；false：実日付ではない
             */
            isDate: function (strYear, strMonth, strDay) {
                // すべての入力パラメータが半角数字の場合、処理続行する。
                if (isNum(strYear) && isNum(strMonth) && isNum(strDay)) {
                    // 日付変換を行う。
                    var dt = new Date(strYear, strMonth - 1, strDay);
                    // 変換結果の年月日と入力パラメータの年月日が一致する場合、チェック結果にtrueをセットし、リターンする。
                    if (dt.getFullYear() == strYear && dt.getMonth() == strMonth - 1 && dt.getDate() == strDay) {
                        return true;
                    }
                    else {
                        return false;
                    }
                }
                else {
                    return false;
                }
            },
            /**
             * 和暦を西暦へ変換処理する。
             *
             * @param {string} strGengo - 元号
             * @param {string} strYear - 年
             * @param {string} strMonth - 月
             * @param {string} strDay - 日
             * @return {string} 変換結果--true : YYYY-MM-DD；false : undefined
             */
            convertDate: function (strGengo, strYear, strMonth, strDay) {
                var seirekiYmd;
                if (isNum(strGengo) && isNum(strYear) && isNum(strMonth) && isNum(strDay) && (minGengo <= strGengo && maxGengo >= strGengo)) {
                    // 業務共通領域「コードマスタ情報」から年月日情報の開始年月日と終了年月日を取得する
                    var startYmd = appConst.gengo["gengo" + strGengo].start;
                    var endYmd = appConst.gengo["gengo" + strGengo].end;
                    // 開始年月日の年を取得する
                    var startYear = parseInt(startYmd.substring(0, 4));
                    // 計算した年
                    var retYear = String(startYear + parseInt(strYear) - 1);
                    if (this.isDate(retYear, strMonth, strDay)) {
                        // 西暦年月日を設定する
                        seirekiYmd = retYear + ("00" + strMonth).substr(-2) + ("00" + strDay).substr(-2);
                        if (startYmd <= seirekiYmd && seirekiYmd <= endYmd) {
                            // フォーマット
                            seirekiYmd = retYear + "-" + ("00" + strMonth).substr(-2) + "-" + ("00" + strDay).substr(-2);
                            return seirekiYmd;
                        }
                        else {
                            seirekiYmd = undefined;
                            return seirekiYmd;
                        }
                    }
                    else {
                        return seirekiYmd;
                    }
                }
                else {
                    return seirekiYmd;
                }
            },
            // 01-2022-03-250 ＮＩＳＡ成年年齢引き下げ対応（9月対応 開設年齢引下げ）開始 20220920
            nisaStartDate: function () {
                var nisastartdate = appConst.nisaFlagStartDate;
                return nisastartdate;
            }
        };
    }])
    .factory('AppComEncrypt', ['CURRENT_CONFIG',
    function (CURRENT_CONFIG) {
        return {
            /**
             * 指定した文字列にAES-128-CBC共通鍵方式による暗号化を行い、結果を返却する。
             *
             * @param {string} strEncrypt -  暗号化前文字列
             */
            encryptAES128CBC: function (strEncrypt) {
                if (!angular.isString(strEncrypt)) {
                    throw new Error('暗号化文字列が文字列ではない。');
                }
                var creptoKey = CryptoJS.enc.Utf8.parse(CURRENT_CONFIG.CRYPTO_KEY_CBC);
                var strEncrypted = CryptoJS.enc.Utf8.parse(strEncrypt);
                var ivHex = CryptoJS.enc.Hex.parse(CURRENT_CONFIG.INITIAL_VECTOR);
                var options = { iv: ivHex, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 };
                var encrypted = CryptoJS.AES.encrypt(strEncrypted, creptoKey, options);
                return encrypted.toString();
            },
            /**
             * 指定した文字列にAES-128-ECB共通鍵方式による暗号化を行い、結果を返却する。
             *
             * @param {string} strEncrypt -  暗号化前文字列
             */
            encryptAES128ECB: function (strEncrypt) {
                if (!angular.isString(strEncrypt)) {
                    throw new Error('暗号化文字列が文字列ではない。');
                }
                var creptoKey = CryptoJS.enc.Utf8.parse(CURRENT_CONFIG.CRYPTO_KEY_ECB);
                var strEncrypted = CryptoJS.enc.Utf8.parse(strEncrypt);
                var options = { mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.Pkcs7 };
                var encrypted = CryptoJS.AES.encrypt(strEncrypted, creptoKey, options);
                return encrypted.toString();
            },
        };
    }])
    .factory('AppComApp', function () {
    return {
        /**
         * アプリバージョンを取得する。
         *
         * @param {successCallback} successCallback - 成功時のコールバック関数
         * @param {errorCallback} errorCallback - 失敗時のコールバック関数
         */
        getAppVersion: function (successCallback, errorCallback) {
            cordova.getAppVersion.getVersionNumber(successCallback, errorCallback);
        }
    };
})
    .factory('AppComStringUtil', ['stringUtilConst', function (stringUtilConst) {
        var BOM = 0xFEFF;
        /**
         * 文字をマップに従い変換する機能。
         *
         * 渡された文字列、マップに値が設定されていない場合、文字列をそのまま返却する。
         *
         * @param {string} word - 変換対象の文字列
         * @param {any}    map  - 変換マップ
         */
        function convertChar(word, map) {
            if (!word || !map || !Object.keys(map).length)
                return word;
            var result = '';
            var list = word.match(stringUtilConst.REGEXP);
            var length = list.length;
            var i = 0;
            while (i < length) {
                // 文字を取得
                var current = list[i];
                // 濁点付きの半角カナを取得
                var target = current + list[i + 1];
                if (target in map) {
                    current = target;
                    i = i + 1;
                }
                // 文字を変換
                result += map[current] || current;
                i = i + 1;
            }
            return result;
        }
        return {
            /**
             * 文字列を半角から全角に変換する機能。
             *
             * 渡された文字列に値が設定されていない場合、そのまま返却する。
             *
             * @param  {string}  word         - 変換前文字列
             * @param  {boolean} isConvertKAN - カナ変換フラグ(デフォルト：false[カナ変換無効])
             * @return {string}  result       - 変換後文字列
             */
            hanToZen(word, isConvertKAN = false) {
                var result = convertChar(word, stringUtilConst.HALF_STR);
                if (isConvertKAN) {
                    // カナ文字を変換
                    result = convertChar(result, stringUtilConst.HALF_KANA);
                }
                return result;
            },
            /**
             * 文字列を全角から半角に変換する機能。
             *
             * 渡された文字列に値が設定されていない場合、そのまま返却する。
             *
             * @param  {string}  word         - 変換前文字列
             * @param  {boolean} isConvertKAN - カナ変換フラグ(デフォルト：false[カナ変換無効])
             * @return {string}  result       - 変換後文字列
             */
            zenToHan(word, isConvertKAN = true) {
                var result = convertChar(word, stringUtilConst.FULL_STR);
                if (isConvertKAN) {
                    // カナ文字を変換
                    result = convertChar(result, stringUtilConst.FULL_KANA);
                }
                return result;
            },
            /**
            * 文字化けを変換する機能。
            *
            * 渡された文字列に値が設定されていない場合、そのまま返却する。
            *
            * @param  {string}  str         - 変換前文字列
            * @return {string}  result      - 変換後文字列
            */
            utf16ToBase64(str) {
                var u16Array = new Uint16Array(str.length + 1);
                if (str.length != 0) {
                    u16Array[0] = BOM;
                }
                for (var i = 0; i < str.length; i++) {
                    u16Array[i + 1] = str.charCodeAt(i);
                }
                return window.btoa(String.fromCharCode.apply(null, new Uint8Array(u16Array.buffer)));
            },
            /**
             * 文字列を小カナから大カナに変換する機能。
             *
             * 渡された文字列に値が設定されていない場合、そのまま返却する。
             *
             * @param  {string}  word         - 変換前文字列
             * @return {string}  result       - 変換後文字列
             */
            smallToLarge(word) {
                return convertChar(word, stringUtilConst.SMALL_KANA);
            }
        };
    }]);
