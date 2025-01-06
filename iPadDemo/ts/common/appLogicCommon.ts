/// <reference path="../reference.d.ts" />

App
// 「業務共通ラッパー」
.factory('logicCom', ['$rootScope', '$q', '$location', 'appConst', 'appDefine', 'AppCom', 'AppBizCom', 'AppBizCodeMstData', 'LOG_LEVEL', 'serviceTimeCheck', 'timeOutCheck',
    function($rootScope, $q, $location, appConst, appDefine, AppCom, AppBizCom, AppBizCodeMstData, LOG_LEVEL, serviceTimeCheck, timeOutCheck) {

    // ※※※ プライベートメソッド START ※※※ //
    // 「APPLGC-C0001~09：ログ出力」
    /**
     * アクションログ出力．
     * @param  {string}  fromId    - 遷移元画面ID
     * @param  {string}  toId      - 遷移先画面ID
     * @param  {string}  info      - ログに出力する内容（ボタン名）
     * @param  {any}     action    - ログに出力する値（json形式でログに出力）
     * @param  {boolean} outputGps - ログ緯度経度出力実施フラグ(デフォルト：false[GPS無効])
     * @returns void
     */
    var writeActionLog = (fromId: string, toId: string, name: string, msgLevel:string, msgId: string, action: {}, outputGps:boolean = false) : void => {
        var json: string = jsonParse(action);
        var msgParam: string[] = [fromId, toId, name];
        var msg = AppBizCom.Msg.getMsg(msgId, msgParam);
        writeBizLog(msgLevel, msg, json, outputGps);
    };

    /**
     * アプリケーションログ出力．
     * @param {string}  msgLevel  - ログレベル区分（I：info；E：error；W：warn；D：debug）
     * @param {string}  msg       - ログに出力する内容（説明）
     * @param {any}     param     - ログに出力するオブジェクト（json形式でログに出力）
     * @param {boolean} outputGps - ログ緯度経度出力実施フラグ(デフォルト：false[GPS無効])
     */
    var writeAplLog = (msgLevel: string, msg: string, param: any, outputGps: boolean = false) : void => {
        var json: string = jsonParse(param);
        writeBizLog(msgLevel, msg, json, outputGps);
    };

    /**
     * JSONを文字列に変換する．
     * @param  {any} action - JSONオブジェクト
     * @return {string} json - 変換結果
     */
    var jsonParse = (action: any) : string => {
        // JSONを文字列に変換．
        var convUndef: any = function(k, v) { if (v === undefined) { return 'undefined'; } return v; };
        // undefinedの場合，値を文字列を'undefined'に変換．
        var json: string = action === undefined ? '-' :  JSON.stringify(action, convUndef);
        // オブジェクトがない場合，固定値'-'を設定．
        json = json == '{}' ? '-' : json;
        return json;
    };

    /**
     * ログ出力する．
     * @param {string}  msgLevel  - ログレベル区分（I：info；E：error；W：warn；D：debug）
     * @param {string}  msg       - ログに出力する内容（説明）
     * @param {string}  action    - アクションログに出力する内容（説明）
     * @param {boolean} outputGps - ログ緯度経度出力実施フラグ(デフォルト：false[GPS無効])
     */
    var writeBizLog = (msgLevel: string, msg: string, action: string, outputGps: boolean = false) : void => {
    　  // ログイン者データの取得．
        var loginInfo: any    = AppBizCom.DataHolder.getLoginInfo();
        var proper   : string = loginInfo.PROPER_C;
        var shop     : string = loginInfo.UKETSUKE_MISE_C;
        var section  : string = loginInfo.UKETSUKE_KAKARI_C;

        // ログイン者データの社員IDに値が存在しない場合，ログイン者無しの値を設定する．
        if (!proper) {
            var proper : string = 'NoUser';
            var shop   : string = '0000';
            var section: string = '0000';
        }

        if (!outputGps) {
            // GPSなし
            return AppCom.Log.writeLog(proper, shop, section, msgLevel, msg, action);
        }
        
        // 位置情報の取得を試みる．
        AppCom.Device.getDeolocation(function (result: any) {
            // 成功した場合．
            var location = {
                IDO  : result.coords.latitude,
                KEIDO: result.coords.longitude,}
                AppBizCom.DataHolder.setLocation(location);
            AppCom.Log.writeLogWithGps(proper, shop, section, msgLevel, msg, action, location.IDO, location.KEIDO);
            
        }, function (e: any) {
            // 失敗した場合．
            var location = AppBizCom.DataHolder.getLocation();
            AppCom.Log.writeLogWithGps(proper, shop, section, LOG_LEVEL.WARNING, '「APPCOM-0002：端末情報共通のGPS情報を取得」処理失敗', e);
            setTimeout(() => {
                AppCom.Log.writeLogWithGps(proper, shop, section, msgLevel, msg, action, location.IDO, location.KEIDO);
            }, 10);
        });
    };

    // 「APPLGC-C011：SLS格納情報キー取得」
    /**
     * SLSに格納されているkeyを配列で取得
     * @param  {string} type - 申込種別 1:口座開設、2:事務手続き、3:電子帳票。
     * @param  {any} onSuccess - 成功時コールバック。[key]の配列を引数に設定する
     * @param  {any} onError - 失敗時コールバック。エラー発生したときの情報を引数に設定する
     * @returns void
     */
    var getSLSKeys = (type: string, onSuccess: any, onError: any): void => {
        var keys: Array<string> = [];
        var startIndex: number = 0;
        var getKeyWhileTaken = function(targetIndex) {
            // ① 成功した場合
            var onGetKeySuccess = function(key) {
                writeAplLog(LOG_LEVEL.DEBUG, 'APPLGC-C011(getSLSKeys)メソッドのgetKey処理成功。', key);
                // Ⅰ. アプリ業務共通「APPBIZ-C008：入力チェック機能」の「AppBizInputCheck.isEmpty」メソッドを呼び出す。
                // パラメータに、「1) 」で取得したキーを指定する。
                if (AppBizCom.InputCheck.isEmpty(key) == false) {
                    // ⅱ. チェック結果「false：空文字列ではない」の場合
                    // A) 「1) 」で取得したキーの末尾1文字と、入力パラメータ「No1：申込種別」を比較する。
                    var tmpType: string = key.slice(-1);
                    // B) 出力パラメータ「No4：キー配列」に、「1) 」で取得したキーが既に存在するか確認する。
                    if (String(type) === tmpType && keys.indexOf(key) < 0) {
                        // ・ 出力パラメータ「No4：キー配列」に、「1) 」で取得したキーを追加する。
                        // key が保存されていない場合、保存する
                        keys.push(key);
                    }
                    // C) 「1) 」の処理に移る。
                    getKeyWhileTaken(++targetIndex);
                } else {
                    // ⅰ. チェック結果「true：空文字列」の場合
                    // A) 入力パラメータ「No2：成功時のコールバック関数」を実行する。
                    // パラメータに、出力パラメータ「No4：キー配列」を指定する。
                    onSuccess(keys);
                }
            };
            // ② 失敗した場合
            var onGetKeyError = function(error) {
                writeAplLog(LOG_LEVEL.DEBUG, 'APPLGC-C011(getSLSKeys)メソッドのgetKey処理失敗。', error);
                // エラー時、そのとき渡された値をコールバックで返却する
                onError(error);
            };
            // 1) アプリ基盤共通「APPCOM-0004：クライアントSLS共通」の「AppComClientSls.getKey」メソッドを呼び出す。
            // パラメータに、インデックスを指定する。インデックスは0から開始し、繰り返し実行する毎にカウントアップ（プラス１）する。
            AppCom.ClientSls.getKey(targetIndex, onGetKeySuccess, onGetKeyError);
        };
        getKeyWhileTaken(startIndex);
    };

    // 「APPLGC-C015：ファイルシステムエラーコード情報返却」
    /**
     * FileSystem用エラーコード情報返却
     * @param error FileSystemからのエラーコード
     */
    var fileSystemErrorHandler = (error:any) : any => {
        var errorDescriptionTable = {
            1: {
            "name": "NOT_FOUND_ERR",
            "description": "A required file or directory could not be found at the time an operation was processed. For example, a file did not exist but was being opened."
            },
            2: {
            "name": "SECURITY_ERR",
            "description": "Access to the files were denied for one of the following reasons:\nThe files might be unsafe for access within a Web application.\nToo many calls are being made on file resources.\nOther unspecified security error code or situations."
            },
            4: {
            "name": "NOT_READABLE_ERR",
            "description": "The file or directory cannot be read, typically due to permission problems that occur after a reference to a file has been acquired (for example, the file or directory is concurrently locked by another application)."
            },
            5: {
            "name": "ENCODING_ERR",
            "description": "The URL is malformed. Make sure that the URL is complete and valid."
            },
            6: {
            "name": "NO_MODIFICATION_ALLOWED_ERR",
            "description": "The state of the underlying file system prevents any writing to a file or a directory."
            },
            7: {
            "name": "INVALID_STATE_ERR",
            "description": "The operation cannot be performed on the current state of the interface object. For example, the state that was cached in an interface object has changed since it was last read from disk."
            },
            9: {
            "name": "INVALID_MODIFICATION_ERR",
            "description": "The modification requested is not allowed. For example, the app might be trying to move a directory into its own child or moving a file into its parent directory without changing its name."
            },
            10: {
            "name": "QUOTA_EXCEEDED_ERR",
            "description": "Either there's not enough remaining storage space or the storage quota was reached and the user declined to give more space to the database. To ask for more storage, see Managing HTML5 Offline Storage."
            },
            11: {
            "name": "TYPE_MISMATCH_ERR",
            "description": "The app looked up an entry, but the entry found is of the wrong type. For example, the app is asking for a directory, when the entry is really a file."
            },
            12: {
            "name": "PATH_EXISTS_ERR",
            "description": "The file or directory with the same path already exists."
            }
        }
        var returnResult = {
            'errorCode': error.code
        };
        // エラーコードが存在している
        if(error.code in errorDescriptionTable){
            var errorDescription = errorDescriptionTable[error.code];
            returnResult['name'] = errorDescription.name;
            returnResult['description'] = errorDescription.description;
        }
        return returnResult;
    }

    // 「APPLGC-C040：BASE64文字列Blob変換」
    /**
     * BASE64形式データのBlob型変換
     * @param  {string} base64Data - BASE64形式データ
     * @param  {string} contentType - BASE64形式データのコンテンツタイプ
     * @return {any} blob - BASE64データのBlob型
     */
    var base64ToBlob = (base64Data:string, contentType:string) : any => {
        contentType = contentType || 'image/png';
        var sliceSize : number = 512;

        var byteCharacters = atob(base64Data);
        var byteArrays = [];

        for (var offset:number = 0; offset < byteCharacters.length; offset += sliceSize) {
            var slice = byteCharacters.slice(offset, offset + sliceSize);
            var byteNumbers = new Array(slice.length);
            for (var i = 0; i < slice.length; i++) {
                byteNumbers[i] = slice.charCodeAt(i);
            }
            var byteArray = new Uint8Array(byteNumbers);
            byteArrays.push(byteArray);
        }

        var blob = new Blob(byteArrays, {type: contentType});
        return blob;
    }

    /**
     * 合成画像設定処理
     * @param {HTMLImageElement} fillImage - 手動マスク画像
     * @param {HTMLImageElement} orgImage - マスク対象画像
     */
    var conmbinedImage = (fillImage: HTMLImageElement, orgImage: HTMLImageElement): any => {
        var BASE64_HEAD: string = 'data:image/jpeg;base64,';
        var regExpDelete: RegExp = new RegExp(BASE64_HEAD, 'g');

        var setHeight: number = orgImage.height;
        var setWidth: number = orgImage.width;

        // 画像を結合
        var canvas: HTMLCanvasElement = document.createElement('canvas');
        canvas.height = setHeight;
        canvas.width = setWidth;
        var context: CanvasRenderingContext2D = canvas.getContext('2d');
        context.clearRect(0, 0, setWidth, setWidth);
        context.drawImage(orgImage, 0, 0, setWidth, setHeight);
        context.drawImage(fillImage, 0, 0, setWidth, setHeight);
        var img: string = canvas.toDataURL('image/jpeg');

        context.beginPath();
        canvas.height = 0;
        canvas.width = 0;

        // 共通領域に設定
        return img.replace(regExpDelete, '');
    }
    // ※※※ プライベートメソッド END ※※※ //

    // ※※※ パブリックメソッド START ※※※ //
    return {

        // 「APPLGC-C001：ボタンタップログ」
        /**
         * ボタンタップログ(正常処理)出力．
         * @param  {string}  fromId    - 遷移元画面ID
         * @param  {string}  toId      - 遷移先画面ID
         * @param  {string}  name      - ボタン名
         * @param  {any}     action    - ログに出力する値（json形式でログに出力）
         * @param  {boolean} outputGps - ログ緯度経度出力実施フラグ(デフォルト：false[GPS無効])
         * @returns void
         */
        btnTapLog : (fromId: string, toId: string, name: string, action: string, outputGps: boolean = false) : void => {
            writeActionLog(fromId, toId, name, LOG_LEVEL.INFO, 'BTN-TAP-LOG', action, outputGps);
        },

        // 「APPLGC-C002：ボタンタップログ」
        /**
         * ボタンタップログ(入力チェックエラー)出力．
         * @param  {string}  fromId    - 遷移元画面ID
         * @param  {string}  toId      - 遷移先画面ID
         * @param  {string}  name      - ボタン名
         * @param  {any}     action    - ログに出力する値（json形式でログに出力）
         * @param  {boolean} outputGps - ログ緯度経度出力実施フラグ(デフォルト：false[GPS無効])
         * @returns void
         */
        btnTapErrLog : (fromId: string, toId: string, name: string, action: string, outputGps: boolean = false) : void => {
            writeActionLog(fromId, toId, name, LOG_LEVEL.WARNING, 'BTN-TAP-ERR-LOG', action, outputGps);
        },

        // 「APPLGC-C003：ボタンタップログ」
        /**
         * ボタンタップログ(エラー)出力．
         * @param  {string}  fromId    - 遷移元画面ID
         * @param  {string}  toId      - 遷移先画面ID
         * @param  {string}  name      - ボタン名
         * @param  {any}     action    - ログに出力する値（json形式でログに出力）
         * @param  {boolean} outputGps - ログ緯度経度出力実施フラグ(デフォルト：false[GPS無効])
         * @returns void
         */
        btnTapNextPageErrLog : (fromId: string, toId: string, name: string, action: string, outputGps: boolean = false) : void => {
            writeActionLog(fromId, toId, name, LOG_LEVEL.ERROR, 'BTN-TAP-ERR-LOG', action, outputGps);
        },

        // 「APPLGC-C004：コールバックログ」
        /**
         * コールバックログ(正常処理)出力．
         * @param  {string}  fromId    - 遷移元画面ID
         * @param  {string}  toId      - 遷移先画面ID
         * @param  {string}  name      - コールバック名
         * @param  {any}     param     - ログに出力する値（json形式でログに出力）
         * @param  {boolean} outputGps - ログ緯度経度出力実施フラグ(デフォルト：false[GPS無効])
         * @returns void
         */
        callbackLog : (fromId: string, toId: string, name: string, param: string, outputGps: boolean = false) : void => {
            writeActionLog(fromId, toId, name, LOG_LEVEL.INFO, 'CALLBACK-LOG', param, outputGps);
        },

        // 「APPLGC-C005：コールバックログ」
        /**
         * コールバックログ(異常終了)出力．
         * @param  {string}        fromId    - 遷移元画面ID
         * @param  {string}        toId      - 遷移先画面ID
         * @param  {string}        name      - コールバック名
         * @param  {Array<string>} msgId     - メッセージコード
         * @param  {any}           param     - ログに出力する値（json形式でログに出力）
         * @param  {boolean}       outputGps - ログ緯度経度出力実施フラグ(デフォルト：false[GPS無効])
         * @returns void
         */
        callbackErrLog : (fromId: string, toId: string, name: string, msgId: Array<string>, param: string, outputGps: boolean = false) : void => {
            var json: string = jsonParse(param);
            var msgParam: any = [fromId, toId, name, msgId];
            var msg = AppBizCom.Msg.getMsg('CALLBACK-ERR-LOG', msgParam);
            writeBizLog(LOG_LEVEL.ERROR, msg, json, outputGps);
        },

        // 「APPLGC-C006：アプリケーションログ出力（debug）」
        /**
         * アプリケーションログ出力（debug）．
         * @param  {string}  msg       - メッセージ部に出力する
         * @param  {any}     param     - ログに出力する値（json形式でログに出力）
         * @param  {boolean} outputGps - ログ緯度経度出力実施フラグ(デフォルト：false[GPS無効])
         * @returns void
         */
        debugLog : (msg: string, param: string, outputGps: boolean = false) : void => {
            writeAplLog(LOG_LEVEL.DEBUG, msg, param, outputGps);
        },
        // 「APPLGC-C007：アプリケーションログ出力（info）」
        /**
         * アプリケーションログ出力（info）．
         * @param  {string}  msg       - メッセージ部に出力する
         * @param  {any}     param     - ログに出力する値（json形式でログに出力）
         * @param  {boolean} outputGps - ログ緯度経度出力実施フラグ(デフォルト：false[GPS無効])
         * @returns void
         */
        infoLog : (msg: string, param: string, outputGps: boolean = false) : void => {
            writeAplLog(LOG_LEVEL.INFO, msg, param, outputGps);
        },

        // 「APPLGC-C008：アプリケーションログ出力（warn）」
        /**
         * アプリケーションログ出力（warn）．
         * @param  {string}  msg       - メッセージ部に出力する
         * @param  {any}     param     - ログに出力する値（json形式でログに出力）
         * @param  {boolean} outputGps - ログ緯度経度出力実施フラグ(デフォルト：false[GPS無効])
         * @returns void
         */
        warnLog : (msg: string, param: string, outputGps: boolean = false) : void => {
            writeAplLog(LOG_LEVEL.WARNING, msg, param, outputGps);
        },

        // 「APPLGC-C009：アプリケーションログ出力（error）」
        /**
         * アプリケーションログ出力（error）．
         * @param  {string}  msg       - メッセージ部に出力する
         * @param  {any}     param     - ログに出力する値（json形式でログに出力）
         * @param  {boolean} outputGps - ログ緯度経度出力実施フラグ(デフォルト：false[GPS無効])
         * @returns void
         */
        errorLog : (msg: string, param: string, outputGps: boolean = false) : void => {
            writeAplLog(LOG_LEVEL.ERROR, msg, param, outputGps);
        },

        // 「APPLGC-C010：SLS格納情報数取得」
        /**
         * SLSに格納されている指定種別のkeyの数を取得
         * @param  {string} type - 申込種別 1:口座開設、2:事務手続き、3:電子帳票。
         * @param  {any} onSuccess - 成功時コールバック。[key]の数を引数に設定する、ない場合「0」件を渡す
         * @param  {any} onError - 失敗時コールバック。エラー発生したときの情報を引数に設定する
         * @returns void
         */
        getSLSLength: (type: string, onSuccess: any, onError: any): void => {
            // ①　成功した場合
            var onGetKeyLengthSuccess = function(keys) {
                writeAplLog(LOG_LEVEL.DEBUG, 'APPLGC-C010(getSLSLength)メソッドのgetSLSKeys処理成功。', keys);
                // Ⅰ. 出力パラメータ「No3：件数」に、「1) 」で取得したキー配列の件数を設定する。
                var len: number = keys.length;
                // Ⅱ. 入力パラメータ「No2：成功時のコールバック関数」を実行する。
                // パラメータに、出力パラメータ「No3：件数」を指定する。
                onSuccess(len);
            };
            // ② 失敗した場合
            var onGetKeyLengthError = function(error) {
                writeAplLog(LOG_LEVEL.DEBUG, 'APPLGC-C010(getSLSLength)メソッドのgetSLSKeys処理失敗。', error);
                // Ⅰ. 出力パラメータ「No5：エラー内容」に、「1) 」で取得したエラー内容を設定する。
                // Ⅱ. 入力パラメータ「No3：失敗時のコールバック関数」を実行する。
                // パラメータに、出力パラメータ「No5：エラー内容」を指定する。
                onError(error);
            };
            // 1) アプリ業務共通「APPLGC-C011：SLS格納情報キー取得」の「logicCom.getSLSKeys」メソッドを呼び出す。
            // パラメータに、入力パラメータ「No1：申込種別」を指定する。
            getSLSKeys(type, onGetKeyLengthSuccess, onGetKeyLengthError);
        },

        // 「APPLGC-C011：SLS格納情報キー取得」
        /**
         * SLSに格納されているkeyを配列で取得
         * @param  {string} type - 申込種別 1:口座開設、2:事務手続き、3:電子帳票。
         * @param  {any} onSuccess - 成功時コールバック。[key]の配列を引数に設定する
         * @param  {any} onError - 失敗時コールバック。エラー発生したときの情報を引数に設定する
         * @returns void
         */
        getSLSKeys: (type: string, onSuccess: any, onError: any): void => {
            getSLSKeys(type, onSuccess, onError);
        },

        // 「APPLGC-C012：SLS格納情報取得」
        /**
         * SLSのデータ取得
         * @param  {Array<string>} keys - SLSデータ取得対象のkey配列
         * @param  {any} onSuccess - 成功時コールバック。[key, slsdata]の配列を引数に設定する
         * @param  {any} onError - 失敗時コールバック。エラー発生したときの[key, エラー時コールバック引数]を引数に設定する
         * @returns void
         */
        getSLSDatas: (keys: Array<string>, onSuccess: any, onError: any): void => {
            var promises: Array<any> = [];
            var len: number = keys.length;
            // 1) 入力パラメータ「No1：キー配列」から1件ずつキーを取得する。
            for(var i: number = 0; i < len; i++) {
                // data取得同期処理用promise生成
                var getDataPromise = function() {
                    var d: any = $q.defer();
                    var key: any = keys[i];
                    // Ⅰ. 成功した場合
                    var onGetDataSuccess = function(data) {
                        writeAplLog(LOG_LEVEL.DEBUG, 'APPLGC-C012(getSLSDatas)メソッドのgetObject処理成功。', {});
                        // ⅰ. 「① 」で取得したデータを確認する。
                        // ・ 出力パラメータ「No4：SLS格納情報」に、キーとデータのペアを登録する。
                        d.resolve([key, data]);
                    };
                    // Ⅱ. 失敗した場合
                    var onGetDataError = function(error) {
                        writeAplLog(LOG_LEVEL.DEBUG, 'APPLGC-C012(getSLSDatas)メソッドのgetObject処理失敗。', error);
                        // ⅰ. 出力パラメータ「No5：エラー内容」に、キーとエラー内容のペアを設定する。
                        d.reject([key, error]);
                    };
                    // ① アプリ基盤共通「APPCOM-0004：クライアントSLS共通」の「getObject」メソッドを呼び出す。
                    // パラメータに、「1) 」で取得したキーを指定する。
                    AppCom.ClientSls.getObject(key, onGetDataSuccess, onGetDataError);
                    return d.promise;
                };
                promises.push(getDataPromise());
            }
            // 同期待機
            $q.all(promises).then(function(data) {
                // ※ 全てのキーを取得し終えたら「2) 」の処理に移る。
                // 2) 入力パラメータ「No2：成功時のコールバック関数」を実行する。
                // パラメータに、出力パラメータ「No4：SLS格納情報」を指定する。
                // resolveで渡された値の配列をコールバックで返却する
                onSuccess(data);
            }, function(error) {
                // Ⅱ. 失敗した場合
                // ⅱ. 入力パラメータ「No3：失敗時のコールバック関数」を実行する。
                // パラメータに、出力パラメータ「No5：エラー内容」を指定する。
                // rejectされた時点でエラーとなり、そのとき渡された値をコールバックで返却する
                onError(error);
            });
        },

        // 「APPLGC-C013：SLS格納情報削除」
        /**
         * SLSのデータ削除
         * @param  {Array<string>} keys - 削除するSLSデータのkey配列
         * @param  {any} onSuccess - 削除成功時のコールバック。引数なし
         * @param  {any} onError - 削除失敗時のコールバック。エラー発生したときの情報を引数に設定する
         */
        deleteSlsData: (keys: Array<string>, onSuccess: any, onError: any): void => {
            var index: number = 0;
            var deleteData = function(targetIndex) {
                // Ⅰ. 成功した場合
                var onDeleteDataSuccess = function() {
                    writeAplLog(LOG_LEVEL.DEBUG, 'APPLGC-C013(deleteSlsData)メソッドのremoveItem処理成功。', {});
                    index++;
                    if (keys.length > index) {
                        // ⅰ. 「1) 」の処理に移る。
                        deleteData(index);
                    } else {
                        // ※ 全てのキーを取得し終えたら「2) 」の処理に移る。
                        // 2) アプリ基盤共通「APPCOM-0004：AppComClientSls」の「getKeyLength」メソッドを呼び出す。
                        AppCom.ClientSls.getKeyLength(function(keyLength) {
                            writeAplLog(LOG_LEVEL.DEBUG, 'APPLGC-C013(deleteSlsData)メソッドのgetKeyLength処理成功。', keyLength);
                            // ① 成功した場合
                            // Ⅰ. 「cordova-plugin-badge」プラグインの「notification.badge.set」メソッドを呼び出す。
                            // パラメータに、「2) 」で取得した件数を指定する。
                            // バッジ更新権限確認
                            cordova.plugins.notification.badge.hasPermission(function (granted: boolean) {
                                if (granted) {
                                    // バッジ表示件数を更新
                                    cordova.plugins.notification.badge.set(keyLength, function() {});
                                }
                                // Ⅱ. 入力パラメータ「No2：成功時のコールバック関数」を実行する。
                                onSuccess();
                            });
                        }, function(error) {
                            writeAplLog(LOG_LEVEL.DEBUG, 'APPLGC-C013(deleteSlsData)メソッドのgetKeyLength処理失敗。', error);
                            // ② 失敗した場合
                            // Ⅰ. 出力パラメータ「No4：エラー内容」に、「2) 」で取得したエラー内容を設定する。
                            // ⅰ. 入力パラメータ「No3：失敗時のコールバック関数」を実行する。
                            // パラメータに、出力パラメータ「No4：エラー内容」を指定する。
                            onError(error);
                        })
                    }
                };
                // Ⅱ. 失敗した場合
                var onDeleteDataError = function(error) {
                    writeAplLog(LOG_LEVEL.DEBUG, 'APPLGC-C013(deleteSlsData)メソッドのremoveItem処理失敗。', error);
                    // ⅰ. 出力パラメータ「No4：エラー内容」に、「① 」で取得したエラー内容を設定する。
                    // ⅱ. アプリ基盤共通「APPCOM-0004：AppComClientSls」の「getKeyLength」メソッドを呼び出す。
                    AppCom.ClientSls.getKeyLength(function(keyLength) {
                        writeAplLog(LOG_LEVEL.DEBUG, 'APPLGC-C013(deleteSlsData)メソッドのgetKeyLength処理成功。', keyLength);
                        // A) 成功した場合
                        // a) 「cordova-plugin-badge」プラグインの「notification.badge.set」メソッドを呼び出す。
                        // パラメータに、「ⅱ. 」で取得した件数を指定する。
                        // バッジ更新権限確認
                        cordova.plugins.notification.badge.hasPermission(function (granted: boolean) {
                            if (granted) {
                                // バッジ表示件数を更新
                                cordova.plugins.notification.badge.set(keyLength, function() {});
                            }
                            // b) 入力パラメータ「No3：失敗時のコールバック関数」を実行する。
                            // パラメータに、出力パラメータ「No4：エラー内容」を指定する。
                            onError(error);
                        });
                    }, function(error) {
                        writeAplLog(LOG_LEVEL.DEBUG, 'APPLGC-C013(deleteSlsData)メソッドのgetKeyLength処理失敗。', error);
                        // B) 失敗した場合
                        // a) 出力パラメータ「No4：エラー内容」に、「ⅱ. 」で取得したエラー内容を設定する。
                        // b) 入力パラメータ「No3：失敗時のコールバック関数」を実行する。
                        // パラメータに、出力パラメータ「No4：エラー内容」を指定する。
                        onError(error);
                    })
                };
                // 1) 入力パラメータ「No1：キー配列」から1件ずつキーを取得する。
                // ① アプリ基盤共通「APPCOM-0004：AppComClientSls」の「removeItem」メソッドを呼び出す。
                // パラメータに、「1) 」で取得したキーを指定する。
                AppCom.ClientSls.removeItem(keys[targetIndex], onDeleteDataSuccess, onDeleteDataError);
            };
            deleteData(index);
        },

        // 「APPLGC-C020：ファイル存在確認」
        /**
         * ファイル・フォルダ存在確認
         * @param  {string} path - 存在確認対象パス(ファイル・ディレクトリ)
         * @param  {any} callback - 処理完了時コールバック
         */
        existsFile : (path:string, callback:any) : void => {
            // ファイル存在時コールバック処理
            var fileExistsFunc = function(fs){
                callback(true);
            };
            // ファイル存在しない場合のコールバック処理
            var fileNotExistsFunc = function(e){
                callback(false);
            };
            // ファイル操作処理
            (<any>window).resolveLocalFileSystemURL(path, fileExistsFunc, fileNotExistsFunc);
            return;
        },

        // 「APPLGC-C021：ディレクトリ作成処理」
        /**
         * フォルダ作成処理
         * フォルダが既に存在しても、新たに作成する事はない。
         * @param  {string} path - 作成対象対象ディレクトリルートパス
         * @param  {string} dirName - ディレクトリルートパス配下に作成するディレクトリパス
         * @param  {any} successCallback - 処理成功時コールバック
         * @param  {any} errorCallback - 処理成功時コールバック
         */
        createDirectory : (path:string, dirName:string, successCallback:any, errorCallback:any) : void => {
            // ファイルシステム取得成功時コールバック処理
            var successFunc = function(fs){
                // ファイルシステム取得オプション
                var options = {
                    exclusive: false,
                    create: true
                };
                var createDir = function (dirEntry, folders) {
                    if (folders[0] == '.' || folders[0] == '') {
                        folders = folders.slice(1);
                    }
                    if(folders.length <= 0){
                        // 作成実施完了
                        successCallback();
                        return;
                    }
                    // 次の階層のディレクトリを取得
                    dirEntry.getDirectory(folders[0], options, function(dirEntry) {
                        // 作成するディレクトリが存在する場合
                        if (0 < folders.length) {
                            // ディレクトリ作成処理を再帰的に呼び出す
                            createDir(dirEntry, folders.slice(1));
                        }
                        else{
                            // 作成実施完了
                            successCallback();
                        }
                    }, errorFunc);
                };
                var dirArray = dirName.split('/');
                if (dirArray[0] == '.' || dirArray[0] == '') {
                    dirArray = dirArray.slice(1);
                }
                // ディレクトリ作成処理
                createDir(fs, dirArray);
            };
            // ファイルシステム取得失敗時のコールバック処理
            var errorFunc = function(e){
                // ファイルシステムエラーコード情報取得
                var error = fileSystemErrorHandler(e);
                // 作成エラー返却
                errorCallback(error);
            };
            // ファイル操作処理
            (<any>window).resolveLocalFileSystemURL(path, successFunc, errorFunc);
            return;
        },

        // 「APPLGC-C022：ファイルコピー処理」
        /**
         * ファイルコピー処理
         * @param  {string} srcFilePath - コピー元ファイルパス
         * @param  {string} dstDirPath - コピー先ディレクトリパス
         * @param  {string} dstFileName - コピー先格納ファイル名
         * @param  {any} successCallback - 処理成功時コールバック
         * @param  {any} errorCallback - 処理成功時コールバック
         */
        fileCopy : (srcFilePath:string, dstDirPath:string, dstFileName:string, successCallback:any, errorCallback:any) : void => {
            var fileSystemSource : any;
            var fileSystemTarget : any;
            // コピー元ファイルシステム処理成功時
            var srcFsSuccessFunc = function(fsSrc){
                fileSystemSource = fsSrc;
                // コピー先ディレクトリ ファイルシステム取得
                (<any>window).resolveLocalFileSystemURL(dstDirPath, dstFsSuccessFunc, dstFsErrorFunc);
            };
            // コピー元ファイルシステム処理失敗時
            var srcFsErrorFunc = function(e){
                // ファイルシステムエラーコード情報取得
                var error = fileSystemErrorHandler(e);
                // コピー処理エラー返却
                errorCallback(error);
            };
            // コピー先ディレクトリ　ファイルシステム処理成功時
            var dstFsSuccessFunc = function(fsTarget){
                fileSystemTarget = fsTarget;
                fileSystemSource.copyTo(fileSystemTarget, dstFileName, function(){
                    // コピー処理成功のため、処理を返す
                    successCallback();
                }, dstFsErrorFunc);
            };
            // コピー先ディレクトリ　ファイルシステム処理失敗時
            var dstFsErrorFunc = function(e){
                // 既にファイルが存在している場合(ファイルシステムエラーコード：12)
                if(e.code == 12){
                    // DBファイルを削除してからコピーを実施
                    fileSystemTarget.getFile(dstFileName, {create: false},
                        function(fileEntry) {
                            fileEntry.remove(function() {
                                // 再度コピーを実施
                                dstFsSuccessFunc(fileSystemTarget);
                            }, srcFsErrorFunc);
                    }, srcFsErrorFunc);
                    return;
                }
                // ファイルシステムエラーコード情報取得
                var error = fileSystemErrorHandler(e);
                // コピー処理エラー返却
                errorCallback(error);
            };
            // コピー元アプリDB ファイルシステム取得
            (<any>window).resolveLocalFileSystemURL(srcFilePath, srcFsSuccessFunc, srcFsErrorFunc);
        },

        // 「APPLGC-C023：ディレクトリ削除」
        /**
         * ディレクトリ削除
         * @param  {string} deleteDirPath - 削除ディレクトリパス
         * @param  {any} successCallback - 処理成功時コールバック
         * @param  {any} errorCallback - 処理成功時コールバック
         */
        directoryDelete : (deleteDirPath:string, successCallback:any, errorCallback:any) : void => {
            var fileSystemDelete : any;
            // 削除ディレクトリ ファイルシステム処理成功時
            var srcFsSuccessFunc = function(fsSrc){
                fileSystemDelete = fsSrc;
                // ディレクトリ削除(再帰的削除)
                fileSystemDelete.removeRecursively(deleteSuccessFunc, deleteErrorFunc)
            };
            // 削除ディレクトリ ファイルシステム処理失敗時
            var srcFsErrorFunc = function(e){
                // ファイルシステムエラーコード情報取得
                var error = fileSystemErrorHandler(e);
                // コピー処理エラー返却
                errorCallback(error);
            };
            // 削除処理成功時
            var deleteSuccessFunc = function(){
                // コピー処理成功のため、処理を返す
                successCallback();
            };
            // 削除処理失敗時
            var deleteErrorFunc = function(e){
                // ファイルシステムエラーコード情報取得
                var error = fileSystemErrorHandler(e);
                // コピー処理エラー返却
                errorCallback(error);
            };
            // 削除ディレクトリ ファイルシステム取得
            (<any>window).resolveLocalFileSystemURL(deleteDirPath, srcFsSuccessFunc, srcFsErrorFunc);
        },

        // 「APPLGC-C024：ディレクトリコピー」
        /**
         * ディレクトリコピー
         * @param  {string} srcDirPath - コピー元ディレクトリパス
         * @param  {string} dstDirPath - コピー先ディレクトリパス
         * @param  {string} dstDirName - コピー先格納ディレクトリ名
         * @param  {any} successCallback - 処理成功時コールバック
         * @param  {any} errorCallback - 処理成功時コールバック
         */
        directoryCopy : (srcDirPath:string, dstDirPath:string, dstDirName:string, successCallback:any, errorCallback:any) : void => {
            var fileSystemSource : any;
            var fileSystemTarget : any;
            // コピー元ファイルシステム処理成功時
            var srcFsSuccessFunc = function(fsSrc){
                fileSystemSource = fsSrc;
                // コピー先ディレクトリ ファイルシステム取得
                (<any>window).resolveLocalFileSystemURL(dstDirPath, dstFsSuccessFunc, dstFsErrorFunc);
            };
            // コピー元ファイルシステム処理失敗時
            var srcFsErrorFunc = function(e){
                // ファイルシステムエラーコード情報取得
                var error = fileSystemErrorHandler(e);
                // コピー処理エラー返却
                errorCallback(error);
            };
            // コピー先ディレクトリ　ファイルシステム処理成功時
            var dstFsSuccessFunc = function(fsTarget){
                fileSystemTarget = fsTarget;
                fileSystemSource.copyTo(fileSystemTarget, dstDirName, function(){
                    // コピー処理成功のため、処理を返す
                    successCallback();
                }, dstFsErrorFunc);
            };
            // コピー先ディレクトリ　ファイルシステム処理失敗時
            var dstFsErrorFunc = function(e){
                // ファイルシステムエラーコード情報取得
                var error = fileSystemErrorHandler(e);
                // コピー処理エラー返却
                errorCallback(error);
            };
            // コピー元 ファイルシステム取得
            (<any>window).resolveLocalFileSystemURL(srcDirPath, srcFsSuccessFunc, srcFsErrorFunc);
        },

        // 「APPLGC-C025：テキストファイル保存」
        /**
         * TXTデータのファイル保存処理
         * @param  {string} dirPath - 保存先ファイルパス
         * @param  {string} fileName - 保存先ファイル名
         * @param  {string} txtData - TXT保存文字列
         * @param  {any} successCallback - 処理成功時コールバック
         * @param  {any} errorCallback - 処理成功時コールバック
         */
        saveFileTxtData : (dirPath:string, fileName:string, txtData:string, successCallback:any, errorCallback:any) : void => {
            var strSrc = [txtData];
            // TXT形式データのBlob型変換
            var dataBlob = new Blob(strSrc, {type: 'text/plain'});

            (<any>window).resolveLocalFileSystemURL(dirPath, function(dir) {
                // ファイルシステムオプション
                var options = {
                    exclusive: false,
                    create: true
                };
                dir.getFile(fileName, options, function(file) {
                    file.createWriter(function(fileWriter) {
                        fileWriter.write(dataBlob);
                        // 処理成功
                        successCallback();
                    }, function(e){
                        // ファイルシステムエラーコード情報取得
                        var error = fileSystemErrorHandler(e);
                        // 処理失敗
                        errorCallback(error);
                    });
                });
            }, function(e){
                // ファイルシステムエラーコード情報取得
                var error = fileSystemErrorHandler(e);
                // 処理失敗
                errorCallback(error);
            });
        },

        // 「APPLGC-C026：テキストファイル読込」
        /**
         * TXTデータのファイル読取り処理
         * @param  {string} filePath - TXTデータファイルパス
         * @param  {any} successCallback - 処理成功時コールバック
         * @param  {any} errorCallback - 処理成功時コールバック
         */
        readFileTxtData : (filePath:string, successCallback:any, errorCallback:any) : void => {

            (<any>window).resolveLocalFileSystemURL(filePath, function(fileEntry) {
                // ファイルシステムオプション
                var options = {
                    exclusive: false,
                    create: true
                };
                fileEntry.file(
                    function(file) {
                        var reader = new FileReader();
                        reader.onloadend = function(e) {
                            // 処理成功
                            successCallback(this.result);
                        };
                        reader.readAsText(file);
                    },
                    function(e){
                        // ファイルシステムエラーコード情報取得
                        var error = fileSystemErrorHandler(e);
                        // 処理失敗
                        errorCallback(error);
                    }
                );
            }, function(e){
                // ファイルシステムエラーコード情報取得
                var error = fileSystemErrorHandler(e);
                // 処理失敗
                errorCallback(error);
            });
        },

        // 「APPLGC-C027：BASE64画像ファイル保存」
        /**
         * BASE64形式画像データのファイル保存処理(複数ファイル用)
         * @param  {string} dirPath - 保存先ファイルパス
         * @param  {Array<number>} filesInfo - 保存するファイルの配列データ {"fileName":xxx, "base64Data":yyy, "contentType":zzz}の形式で配列データを格納
         * @param  {string} base64Data - BASE64形式データ
         * @param  {any} successCallback - 処理成功時コールバック
         * @param  {any} errorCallback - 処理成功時コールバック
         */
        saveFileBase64DataBat : (dirPath:string, filesInfo:Array<number>, successCallback:any, errorCallback:any) : void => {
            // ファイル数
            var fileCount = filesInfo.length;
            // 処理する画像ファイルが無い場合は処理終了
            if(fileCount <= 0){
                successCallback(true);
                return;
            }
            // 保存済みファイル数カウント
            var createFileCount = 0;
            (<any>window).resolveLocalFileSystemURL(dirPath, function (dir) {
                // ファイルシステムオプション
                var options = {
                    exclusive: false,
                    create: true
                };
                var createFunc = function(){
                    var oneInfo : any = filesInfo[createFileCount];
                    // ファイル名からcontentTypeを判断
                    var contentType = 'image/png';
                    var fileNameSep = oneInfo.fileName.split('.');
                    var fileIdentity = fileNameSep.pop();
                    // JPEGの場合のcontentType
                    if (fileIdentity == 'jpg' || fileIdentity == 'jpeg') {
                        contentType = 'image/jpg';
                    }
                    // BASE64形式データのBlob型変換
                    var dataBlob = base64ToBlob(oneInfo.base64Data, contentType);
                    dir.getFile(oneInfo.fileName, options,
                        function (file) {
                            file.createWriter(
                                function (fileWriter) {
                                    fileWriter.write(dataBlob);
                                    createFileCount++;
                                    // 画像が全てそろった場合
                                    if (fileCount <= createFileCount) {
                                        // 処理作成完了
                                        successCallback(true);
                                    }
                                    else {
                                        // 次の画像作成
                                        createFunc();
                                    }
                                },
                                function (e) {
                                    // ファイルシステムエラーコード情報取得
                                    var error = fileSystemErrorHandler(e);
                                    // 処理失敗
                                    errorCallback(error);
                                }
                            );
                        },
                        function(e){
                            // ファイルシステムエラーコード情報取得
                            var error = fileSystemErrorHandler(e);
                            // 処理失敗
                            errorCallback(error);
                        }
                    );

                };
                createFunc();
            }, function (e) {
                // ファイルシステムエラーコード情報取得
                var error = fileSystemErrorHandler(e);
                // 処理失敗
                errorCallback(error);
            });
        },

        // 「APPLGC-C041：合成画像設定処理」
        /**
         * 合成画像設定処理
         * @param  {any} imgList - 合成画像リスト
         * @param  {number} i - カウンタ
         * @param  {function} callback - コールバック関数
         */
        setConmbinedImage : (imgList: any, i: number, callback: any): void => {

            var fillImage: HTMLImageElement = new Image();
            var orgImage: HTMLImageElement = new Image();

            // 一度に合成処理を走らせると大量にメモリを消費するため、１書面づつ合成する
            new Promise((resolve, reject) => {
                if (imgList.length < 1) {
                    return resolve();
                }
                // １書面目の画像合成
                fillImage.onload = function () {
                    orgImage.onload = function () {

                        // 共通領域に設定
                        var comDataImageData: any = AppBizCom.DataHolder.getImageData();
                        comDataImageData[imgList[0]['dest']] = conmbinedImage(fillImage, orgImage);
                        AppBizCom.DataHolder.setImageData(comDataImageData);
                        return resolve();
                    }
                    orgImage.src = imgList[0]['org'];
                }
                fillImage.src = imgList[0]['filled'];

            }).then(() => {
                return new Promise((resolve, reject) => {
                    if (imgList.length < 2) {
                        return resolve();
                    }
                    // ２書面目の画像合成
                    fillImage.onload = function () {
                        orgImage.onload = function () {

                            // 共通領域に設定
                            var comDataImageData: any = AppBizCom.DataHolder.getImageData();
                            comDataImageData[imgList[1]['dest']] = conmbinedImage(fillImage, orgImage);
                            AppBizCom.DataHolder.setImageData(comDataImageData);
                            return resolve();
                        }
                        orgImage.src = imgList[1]['org'];
                    }
                    fillImage.src = imgList[1]['filled'];
                })
            }).then(() => {
                return new Promise((resolve, reject) => {
                    if (imgList.length < 3) {
                        return resolve();
                    }
                    // ３書面目の画像合成
                    fillImage.onload = function () {
                        orgImage.onload = function () {

                            // 共通領域に設定
                            var comDataImageData: any = AppBizCom.DataHolder.getImageData();
                            comDataImageData[imgList[2]['dest']] = conmbinedImage(fillImage, orgImage);
                            AppBizCom.DataHolder.setImageData(comDataImageData);
                            return resolve();
                        }
                        orgImage.src = imgList[2]['org'];
                    }
                    fillImage.src = imgList[2]['filled'];
                })
            }).then(() => {
                callback();
            });
        },

        // 「APPLGC-C042：自動マスク処理」
        /**
         * 自動マスク処理
         * @param {number} idDocType - 1:運転免許証 2:個人番号カード
         * @param {number} frontBackType - 1:表面 2:裏面
         */
        autoMask : (idDocType: number, surface:number): void => {
            // キャンバス要素追加
            var canvas: HTMLCanvasElement = document.createElement('canvas');
            canvas.id = 'canvas';
            canvas.width = 1014;
            canvas.height = 634;
            canvas.hidden = true;
            var parent: HTMLElement = document.getElementById('main-div-area');
            parent.appendChild(canvas);

            var fillImageClass: any = new AppBizImageFillMask('canvas');
            // 自動マスク画像作成
            fillImageClass.autoMask(idDocType, surface);
            // BASE64で取得
            var base64Data: string = fillImageClass.getImageData();
            // BASE64のヘッダーは不要
            var BASE64_HEAD_PNG: string = 'data:image/png;base64,';
            var regExpDelete: RegExp = new RegExp(BASE64_HEAD_PNG, 'g');
            // 塗りつぶし済み画像をセット
            var imageBase64: string = typeof(base64Data) != 'undefined'? base64Data.replace(regExpDelete, '') : appConst.NO_INPUT_VALUE;
            // 共通領域定義 申込みデータ 項目名定数取得
            var d: any = appDefine.imageData;
            // 共通領域定義 申込みデータ取得
            var comDataImageData: any = AppBizCom.DataHolder.getImageData();
            // 共通領域へ保存
            if(surface === 1){
                // 自動塗りつぶし画像1
                comDataImageData[d.AUTO_FILL_GAZO1] = imageBase64;
            }else{
                // 自動塗りつぶし画像2
                comDataImageData[d.AUTO_FILL_GAZO2] = imageBase64;
            }
            AppBizCom.DataHolder.setImageData(comDataImageData);

            // キャンバス要素削除
            canvas.width = 0;
            canvas.height = 0;
            parent.removeChild(canvas);
        },

        // 「APPLGC-C050：選択済み番号確認書類情報取得」

        // 「APPLGC-C052：選択済み本人確認書類情報取得」

        // 「APPLGC-C060：OCR結果設定」
        /**
         * カメラOCRから取得した結果を共通領域へ格納する
         * 住所から郵便番号を逆検索する場合、非同期になるため終了時処理のコールバックが必要
         * 
         * @param {any} ocrResult - カメラOCRから取得した結果
         * @param {any} onSuccess - 逆検索取得で成功した場合の処理
         * @param {any} onError - 逆検索取得で失敗した場合の処理
         * @returns void
         * */
        setOcrResult2DataHolder:(ocrResult: any, onSuccess: any, onError: any): void => {
            var c: any = appConst.CARD_TYPE;
            var d: any = appDefine.ocrResultData;
            var ocrValues: any = {};
            
            if (!(ocrResult.cardType == 2 || ocrResult.cardType == 4 || ocrResult.cardType == 5 || ocrResult.cardType == 6)) {
                ocrValues[d.SIMEI_SEI] = undefined; // 顧客姓（漢字）
                ocrValues[d.SIMEI_MEI] = undefined; // 顧客名（漢字）
                ocrValues[d.KANA_SEI] = undefined; // 顧客姓（カナ）
                ocrValues[d.KANA_MEI] = undefined; // 顧客名（カナ）
                ocrValues[d.GNGO_K] = undefined; // 元号
                ocrValues[d.SEINEN_Y] = undefined; // 生年月日(年)
                ocrValues[d.SEINEN_M] = undefined; // 生年月日(月)
                ocrValues[d.SEINEN_D] = undefined; // 生年月日(日)
                ocrValues[d.YBN_BNG_3] = undefined; // 郵便番号（3桁）
                ocrValues[d.YBN_BNG_4] = undefined; // 郵便番号（4桁）
                AppBizCom.DataHolder.setOcrData(ocrValues);
                return onSuccess();
            }

            var sep: string = appConst.OCR_SEPALATE_CHAR; //'　';

            // 氏名の取得
            var split_wk: any = [undefined, undefined];
            // 氏名:苗字名前を分割して設定
            if (AppBizCom.InputCheck.isEmpty(ocrResult.name.text) == false
                && ocrResult.name.text.match(sep)) {
                split_wk = ocrResult.name.text.split(sep);
                split_wk[0] = split_wk[0].substring(0, 20);
                split_wk[1] = split_wk[1].substring(0, 20);
            }
            ocrValues[d.SIMEI_SEI] = split_wk[0]; // 顧客姓（漢字）
            ocrValues[d.SIMEI_MEI] = split_wk[1]; // 顧客名（漢字）

            // 氏名カナの取得
            var unknownCheck: string = appConst.OCR_UNKNOWN_CHAR; //'？';
            split_wk = [undefined, undefined];
            if(ocrResult.cardType == c.MY_NUMBER_FRONT || ocrResult.cardType == c.DRIVERS_LICENSE_FRONT){
                // 氏名カナ:苗字名前を分割して設定
                if (AppBizCom.InputCheck.isEmpty(ocrResult.nameKana.text) == false
                    && ocrResult.nameKana.text.match(sep)) {
                    if (!ocrResult.nameKana.text.match(unknownCheck)) {
                        // 不明文字がヒットしない場合は分割する
                        split_wk = ocrResult.nameKana.text.split(sep);
                        split_wk[0] = split_wk[0].substring(0, 30);
                        split_wk[1] = split_wk[1].substring(0, 30);
                    }
                }
            }
            ocrValues[d.KANA_SEI] = split_wk[0]; // 顧客姓（カナ）
            ocrValues[d.KANA_MEI] = split_wk[1]; // 顧客名（カナ）

            // 生年月日の取得
            var gengo: string = undefined;
            // 誕生日:元号yy年mm月dd日を分割して設定
            var birthday: string = ocrResult.birthday.text;
            split_wk = [undefined, undefined, undefined];
            if (AppBizCom.InputCheck.isEmpty(ocrResult.birthday.text) == false) {
                if (ocrResult.birthday.text.match(appConst.OCR_GANNEN)) {
                    // 元年変換処理
                    birthday = ocrResult.birthday.text.replace(appConst.OCR_GANNEN, appConst.OCR_YEAR_ONE);
                }
                split_wk = birthday.match(/[0-9]+/gi);
            }
            if(AppBizCom.InputCheck.isEmpty(split_wk) || split_wk.length != 3){
                ocrValues[d.GNGO_K] = undefined ; // 元号
                ocrValues[d.SEINEN_Y] = undefined ; // 生年月日(年)
                ocrValues[d.SEINEN_M] = undefined ; // 生年月日(月)
                ocrValues[d.SEINEN_D] = undefined ; // 生年月日(日)
            }else{
                ocrValues[d.SEINEN_Y] = AppBizCom.InputCheck.isEmpty(split_wk[0]) ? split_wk[0] : parseInt(split_wk[0]).toString() ; // 生年月日(年)
                ocrValues[d.SEINEN_M] = AppBizCom.InputCheck.isEmpty(split_wk[1]) ? split_wk[1] : parseInt(split_wk[1]).toString() ; // 生年月日(月)
                ocrValues[d.SEINEN_D] = AppBizCom.InputCheck.isEmpty(split_wk[2]) ? split_wk[2] : parseInt(split_wk[2]).toString() ; // 生年月日(日)

                // 元号はコードマスタから取得して変換する
                var mst: any = AppBizCodeMstData.getCodeMstDataByKbn('GNGO_K');
                var len: number = mst.length;
                for(var i: number = 0; i<len; i++){
                    // 和暦
                    if (birthday.match(mst[i].MSY)) {
                        gengo = mst[i].CD;
                        break;
                    }
                }
                // 西暦
                if(AppBizCom.InputCheck.isEmpty(gengo)){
                    gengo = mst[5].CD;
                }
                ocrValues[d.GNGO_K] = gengo; // 元号区分
            }

            // 共通領域へ保存する
            AppBizCom.DataHolder.setOcrData(ocrValues);

            // 郵便番号の取得
            // 郵便番号:取得した住所から逆検索を行い共通領域へ保存する
            var address: string = ocrResult.address.text;
            if(AppBizCom.InputCheck.isEmpty(address)){
                ocrValues[d.YBN_BNG_3] = undefined; // 郵便番号（3桁）
                ocrValues[d.YBN_BNG_4] = undefined; // 郵便番号（4桁）

                // 共通領域へ保存する
                AppBizCom.DataHolder.setOcrData(ocrValues);
                onSuccess();
                return;
            }else{
                address = AppBizCom.InputCheck.isEmpty(address) ? '' : address;
                AppBizCom.AddSearch.searchFromAdd(address, 
                function(result: any){
                    ocrValues[d.YBN_BNG_3] = result.zipcodeUp; // 郵便番号（3桁）
                    ocrValues[d.YBN_BNG_4] = result.zipcodeDown; // 郵便番号（4桁）
                
                    // 共通領域へ保存する
                    AppBizCom.DataHolder.setOcrData(ocrValues);
                    onSuccess();
                },
                function(error: any){
                    error.address = address;
                    onError(error);
                });
            }
        },

// 01-2022-06-224 本人確認書類撮影画面のガード対応 開始 20221031
        // 「APPLGC-C063：OCR結果設定(事務手続き)」
        /**
         * (事務手続き用)カメラOCRから取得した結果を共通領域へ格納する
         * 
         * @param {any} ocrResult - カメラOCRから取得した結果
         * @param {any} callback - 処理完了時コールバック
         * @returns void
         * */
        setOcrResult2DataHolderJimu:(ocrResult: any, callback: any): void => {
            var d: any = appDefine.ocrResultData;
            var ocrValues: any = {};

            // 撮影モードの取得
            ocrValues[d.MODE] = ocrResult.mode;
            
            // カードタイプ(本人確認書類の種別)の取得
            ocrValues[d.CARD_TYPE] = ocrResult.cardType;
            
            // 共通領域へ保存する
            AppBizCom.DataHolder.setOcrData(ocrValues);
            return callback();
        },
// 01-2022-06-224 本人確認書類撮影画面のガード対応 終了 20221031

        // 「APPLGC-C061：カメラプレビュー表示」
        /**
         * カメラプレビュー時の画面表示に切り替えます。
         * @param  {any} divId - 表示OFFにする画面のdivのID
         * @param  {any} modalId - 表示OFFにするモーダルのdivのID
         * @param  {any} camId - 表示ONにするカメラ用divのID
         * @returns void
         */
        change2CameraPreview : (divId:any, modalId:any, camId:any):void => {
            StatusBar.hide();
            // display属性に"none"を指定することで、デフォルト時の画面を非表示にしています。
            $('#' + divId).css('display', 'none');
            if (modalId) {
                $('#' + modalId).css('display', 'none');
                $('.modal-backdrop').css('display', 'none');
                $('body').removeClass('is-modal-open');
            }

            $("body").addClass("body-trans");
            // display属性に"inherit"を指定することで、カメラプレビュー時の画面を表示しています。
            $('#' + camId).css('display', 'inherit');
            $('.residece-main').css('display', 'inherit');
        },

        // 「APPLGC-C062：カメラプレビュー表示終了」
        /**
         * デフォルト時の画面表示に切り替えます。
         * @param  {any} divId - 表示ONにする画面のdivのID
         * @param  {any} modalId - 表示ONにするモーダルのdivのID
         * @param  {any} camId - 表示OFFにするカメラ用divのID
         * @returns void
         */
        change2DefaultView : (divId:any, modalId:any, camId:any):void => {
            StatusBar.show();
            // display属性に"inherit"を指定することで、デフォルト時の画面を表示しています。
            if (modalId) {
                $('.modal-backdrop').css('display', 'inherit');
                $('body').addClass('is-modal-open');
                $('#' + modalId).css('display', 'inherit');
            } else if ($('.modal-backdrop')) {
                $('.modal-backdrop').remove();
            }

            $('#' + divId).css('display', 'inherit');
            $("body").removeClass("body-trans");
            // display属性に"none"を指定することで、カメラプレビュー時の画面を非表示にしています。
            $('#' + camId).css('display', 'none');
            $('.residece-main').css('display', 'none');
        },

        // 「APPLGC-C070：画面遷移」
        /**
         * 画面遷移共通処理
         * @param  {string} path - 遷移先パス
         * @param  {string} onSuccess - 成功時コールバック
         * @param  {string} onError - 失敗時コールバック
         * @param  {any} onConnectionError - 通信エラー時コールバック
         * @param  {string} isShowIndicator - インジケータ表示フラグ
         */
        locationPath : (path: string, onSuccess: any, onError: any, onConnectionError: any, isShowIndicator: boolean = true): void => {

            // アプリ起動時のパスを判別
            if (timeOutCheck.getTimeStartCounter()) {
                var status = timeOutCheck.checkTimeOut(timeOutCheck.getTimeStartCounter());
                // 自動ログアウト時間チェックするかを判別
                if (status == false) {
                    return onError();
                } else {
                    timeOutCheck.setTimeStartCounter(new Date());
                }
            }

            // サービス時間チェック
            serviceTimeCheck.checkServiceTime((): void => {
                // ログ出力
                writeAplLog(LOG_LEVEL.DEBUG, 'locationPath > checkServiceTime コールバック：サービス時間内', undefined, false);
                onSuccess();  
                // 画面遷移処理
                setTimeout(() => {
                    $rootScope.$apply(function(){
                        $location.path(path);
                    });
                }, 50);
            },
            (): void => {
                // ログ出力
                writeAplLog(LOG_LEVEL.WARNING, 'locationPath > checkServiceTime コールバック：サービス時間外', undefined, false);
                onError();
            }, onConnectionError, isShowIndicator)
        },

    }
    // ※※※ パブリックメソッド END ※※※ //
}])


// APPLGC-C032 類似文字チェック
.factory('chkSimilar', ['AppBizCom','chkSimilarConst',  function (AppBizCom, chkSimilarConst) {

    // 類似文字チェックモーダルの一行の最大文字数
    var LINE_LENGTH = chkSimilarConst.LINE_LENGTH;

    // 類似文字チェックタイプ
    var SIMILAR_CHECK_TYPE =  chkSimilarConst.SIMILAR_CHECK_TYPE;

    // 類似文字定義
    var SIMILAR_CHAR_DEFINE = chkSimilarConst.SIMILAR_CHAR_DEFINE;

    /**
     * 入力文字に対して誤入力が発生しやすい文字表示対象文字定義リストを返却する
     * @param {number} chkType - 類似文字チェックタイプ
     * @param {any} checkTypeList - 入力文字に対して誤入力が発生しやすい文字表示対象文字定義リスト
     * @return {any} checkTypeList - Object型
     */
    var createDefineList = (chkType: number, checkTypeList: any): any => {

        if (checkTypeList == undefined) checkTypeList = {};
        if (checkTypeList[chkType]) return;

        // 類似文字チェックタイプ定義でループ
        var checktargetDefine = {};

        // 類似文字定義グループでループ
        for (var j = 0; j < SIMILAR_CHAR_DEFINE.length; j++) {

            // 類似文字定義グループを類似文字チェックタイプで絞る
            var chkGroup: Array<any> = SIMILAR_CHAR_DEFINE[j].filter(item => item.type & chkType)

            // 類似文字定義グループの件数が１件を超える場合のみ、類似チェック対象になる。
            if (chkGroup.length > 1) {
                // 類似文字定義グループをorderbyでソートする（昇順）
                var sortedChkGroup =  angular.copy(chkGroup.sort((a, b) => a.orderby - b.orderby));
                var groupList = [];

                // 入力文字に対して誤入力が発生しやすい文字表示対象文字定義リストを作成
                sortedChkGroup.forEach((item, index) => {

                    // 変換可能文字リスト
                    item.editAbleList = sortedChkGroup.reduce((list, currVal, currIndex) => {
                        index !== currIndex && list.push(currVal);
                        return list;
                    }, []);

                    // 類似文字定義グループ（変換可能文字リスト＋自分）
                    // item.group = groupList;
                    groupList.push(item);

                    checktargetDefine[item.target] = item;
                });
            }
        }

        checkTypeList[chkType] = checktargetDefine;
        return checkTypeList;
    };

    /**
     * 渡された文字列が類似文字が含まれるかをチェックする。
     *
     * @param {string|Array<string>} chkStr - チェック対象文字列
     * @param {any} checktargetDefine - 入力チェックエラーメッセージ表示対象文字
     * @return {Array} チェック結果
     */
    var chkSimilarChar = function (chkStr: string|Array<string>, checktargetDefine: any): any[] {
        var chkList: Array<any> = undefined;

        // （絵文字対応）対象文字列を配列に変更する
        if (!Array.isArray(chkStr)) {
            chkStr = AppBizCom.EmojiUtil.toArray(chkStr);
        }

        if (chkStr.length > 0) {
            chkList = [];
            
            // 文字単位でループ
            for (var i = 0; i < chkStr.length; i++) {
                var chkChar = chkStr[i];
                var similarDefine = checktargetDefine[chkChar];
                similarDefine != undefined && chkList.push({ charIdx: i, similarDefine: similarDefine })
            }
        }

        return chkList && chkList.length > 0 ? chkList: undefined;
    };

    // 類似文字チェックタイプ最大値
    var maxTypeForCheck: number = 0;

    // 入力文字に対して誤入力が発生しやすい文字表示対象文字定義リスト
    var checkTypeList = {};
    Object.keys(SIMILAR_CHECK_TYPE).forEach(type => {
        maxTypeForCheck = maxTypeForCheck + SIMILAR_CHECK_TYPE[type];
        checkTypeList = createDefineList(SIMILAR_CHECK_TYPE[type], checkTypeList);
    });

    return {

        /**
         * 入力文字に対して誤入力が発生しやすい文字チェックを実施した結果を返却する
         * @param {string} id - 対象項目HTML id
         * @param {Array<string>} inputCharList - チェック対象文字列の配列
         * @param {number} chkType - 類似文字チェックタイプ
         * @throws chkTypeは定義されていない類似文字チェックタイプ時、エラー
         * @throws inputCharListが数列ではない時、エラー
         * @return {any} charCheckResult - チェック結果オブジェクト　類似文字がない場合、undefined
         */
        charCheckResults: function (id: string, inputCharList: Array<string>, chkType: number): any {

            // inputCharListチェック
            if (!angular.isArray(inputCharList)) {
                throw new Error('チェック対象文字列の配列不正');
            }

            // chkTypeチェック
            if (!angular.isNumber(chkType) || chkType < 1 || chkType > maxTypeForCheck) {
                throw new Error('類似文字チェックタイプ不正');
            }

            // 類似文字チェックリスト
            var checkTargetDefine = checkTypeList[chkType];
            if (checkTargetDefine == undefined){
                checkTargetDefine = createDefineList(chkType, checkTypeList);
            }

            var charCheckResult = undefined;

            // 対象文字定義リストが空の場合、undefinedを返却
            if (Object.keys(checkTargetDefine).length == 0) {
                return charCheckResult;
            }

            // 行数を計算する
            var ChkRows = Math.ceil(inputCharList.length / LINE_LENGTH);
            var chkResult = chkSimilarChar(inputCharList, checkTargetDefine);

            // モーダル中のチェックテーブルを作成
            if (chkResult != undefined) {
                
                var formatResult = [];
                var newResult = [];
                var parentI: number, childI: number;

                // チェック結果リストを作成
                for (var i = 0; i < inputCharList.length; i++) {
                    formatResult.push({ char: inputCharList[i], similarDefine: undefined, editable: false });
                }

                // チェック結果リストに類似文字対象を設定
                for (var j = 0; j < chkResult.length; j++) {
                    formatResult[chkResult[j].charIdx].similarDefine = chkResult[j].similarDefine;
                    formatResult[chkResult[j].charIdx].editable = true;
                    if (j == 0) {
                        childI = chkResult[j].charIdx;
                    }
                }

                // チェック結果リストを行最大字数で分割（２次元配列になる）
                for (var k = 0; k < ChkRows; k++) {
                    newResult.push(formatResult.slice(LINE_LENGTH * k, LINE_LENGTH * (k + 1)));
                }

                // 第一番目の文字indexを取得して、選択をする（行：parentI、列：childI）
                parentI = Math.ceil((childI + 1) / LINE_LENGTH) - 1;
                if (childI >= LINE_LENGTH) {
                    childI = childI % LINE_LENGTH;
                }

                charCheckResult = { id: id, newResult: newResult, parentI: parentI, childI: childI, chkType: chkType };
            }

            return charCheckResult;
        },

        /**
         * 類似文字チェックタイプ
         * @readonly
         * @enum {number}
         * @property {number} KANA         - カナ（氏名・補足住所・建物名）
         * @property {number} EMAIL        - メールアドレス
         * @property {number} FULL_ALL     - カナ・メールアドレス以外
         */
        SIMILAR_CHECK_TYPE: SIMILAR_CHECK_TYPE,
    }
}])

// 「APPLGC-C014：一括入力チェック」
.factory('AppLgcMultiCheck', ['AppBizInputCheck', 'AppBizEmojiUtil', 'AppBizMsg', 'chkSimilar',
    function(AppBizInputCheck, AppBizEmojiUtil, AppBizMsg, chkSimilar) {

    /**---------------------------------------------------------------
     * チェックタイプによってチェックリストを取得
     *
     * @param {any} chkObj - チェック対象オブジェクト（入力値が含まれている画面項目定義）
     * @param {string} type - チェックタイプ 可能値: 'allChk', 'valChangChk', 'onBlurChk'
     * @return {Array<any>} - チェックリスト
     */
    var getCheckList = (chkObj: any, type: string): Array<any> => {
        if (!Array.isArray(chkObj[type]) || chkObj[type].length == 0) {
            throw new Error(chkObj.name + '項目のチェックリストが存在しません。');
        }
        return chkObj[type];
    }
    /**---------------------------------------------------------------
     * メッソドチェック
     *
     * @param {any} func - チェック対象
     * @return {boolean} - チェック結果 true: メッソド, false: メッソドではない
     */
    var chkFunction = (func: any): boolean => {
        return func && angular.isFunction(func);
    }
    /**---------------------------------------------------------------
     * 類似文字確認済みチェック
     *
     * @param {any} chkObj - チェック対象オブジェクト（入力値が含まれている画面項目定義）
     * @return {boolean} - チェック結果 true: 類似文字確認されていない, false: 類似文字確認済み
     */
    var linkCheck = (chkObj: any): any => {
        var errFlg: boolean = false;
        var tmpId: string = chkObj.id + 'Similar';
        if (chkObj.similarType && ($('#' + tmpId).is(':visible'))) {
            errFlg = true;
            showErr(chkObj.id, chkObj.errAreaId, '', '', false);
        }
        return errFlg;
    }
    /**---------------------------------------------------------------
     * 複数項目一括チェック
     *
     * @param {any} chkObjs - 複数項目のチェック対象オブジェクト（入力値が含まれている画面項目定義）
     * @param {any} inputObjs - 画面入力値オブジェクト
     * @return {Array<any>} - チェック結果 [ エラーフラグ, 入力チェック結果 ]
     */
    var multiInputCheck = (chkObjs: any, inputObjs: any): any => {
        if (typeof(chkObjs) !== 'object' || chkObjs == null || Object.keys(chkObjs).length == 0 || 
            typeof(inputObjs) !== 'object' || inputObjs == null) {
            throw new Error('APPLGC-C014(multiInputCheck)メソッドのパラメータが存在しません。');
        }
        var errFlg: boolean = false; // チェック結果: エラーフラグ
        var msgParam: any = {}; // チェック結果: 詳細

        for (var target in chkObjs) {
            var chkObj: any = chkObjs[target];
            // 画面中に表示されている場合、該当項目の入力値を取得し、入力項目定義に追加
            if ($('#' + chkObj.id).is(':visible')) {
                chkObj.val = (inputObjs[target])? inputObjs[target] : undefined;
            } else {
                continue;
            }

            msgParam[target] = {};

            // 該当項目の単項目チェック
            var result: Array<any> = inputCheck(chkObj, 'allChk');

            // 該当項目の類似文字確認済みチェック
            var linkChkErr: boolean = false;
            if (chkObj.similarType) {
                linkChkErr = linkCheck(chkObj);
            }

            errFlg = errFlg || result[0] || linkChkErr;
            msgParam[target].chkErr = result[0]
            msgParam[target].chkResult = result[1];
            linkChkErr && (msgParam[target].linkChkErr = linkChkErr);
        }
        return [errFlg, msgParam];
    }
    /**---------------------------------------------------------------
     * 一項目一括チェック
     *
     * @param {any} chkObj - チェック対象オブジェクト（入力値が含まれている画面項目定義）
     * @param {string} type - チェックタイプ
     * @return {Array<any>} - チェック結果 [ エラーフラグ, 入力チェック結果, 類似文字チェック結果 ]
     */
    var inputCheck = (chkObj: any, type: string): any => {
        if (typeof(chkObj) !== 'object' || chkObj == null || Object.keys(chkObj).length == 0 || !type) {
            throw new Error('APPLGC-C014(inputCheck)メソッドのパラメータが存在しません。');
        }
        var errFlg: boolean = false; // エラーフラグ
        var msgId: Array<string> =[]; // エラーメッセージコード

        var msgParam: any = {}; // 入力チェック結果
        var similarCharParam: any = {}; // 類似文字チェック結果

        // チェックタイプによって、チェックリストを取得
        var chkList: Array<any> = getCheckList(chkObj, type); // 画面項目定義.チェックリスト
        var chkId: string = chkObj.id; // 画面項目定義.画面項目ID
        var chkName: string = chkObj.name; // 画面項目定義.画面項目名
        var chkErrAreaId: string = chkObj.errAreaId; // 画面項目定義.エラーメッセージ表示用画面項目ID
        var chkTypeSelect: string = chkObj.typeSelect; // 画面項目定義.必須チェックエラータイプ
        var chkVal: string = chkObj.val; // 画面項目定義.エラーメッセージ表示用画面項目ID（文字列化）
        var chkValArray: Array<string> = AppBizEmojiUtil.toArray(String(chkVal));
         // チェック優先順位ループ
        for (var i = 0; i < chkList.length; i++) {
            var chkItem: any = chkList[i];
            var subList: Array<any> = (!Array.isArray(chkItem)) ? [chkItem] : chkItem;
             // 各単項目チェックループ
            for (var j = 0; j < subList.length; j++) {
                var subItem: any = subList[j];

                // メッソドチェックだったら、実行して結果を取得
                var isFunc: boolean = chkFunction(subItem);
                if (isFunc) {
                    var funcRes: any = subItem();
                    if (funcRes && funcRes.errId) {
                        msgId.push(funcRes.errId);
                        !(funcRes.noMsgShow) && showErr(chkId, chkErrAreaId, funcRes.errId, funcRes.errMsg);
                    }
                    continue;
                }

                // 単項目チェックだったら、実行して結果を取得
                switch (subItem) {
                    case 'isEmpty':
                        // 必須チェック
                        if (AppBizInputCheck.isEmpty(chkVal)) {
                            var errId: string = chkTypeSelect? 'KKAP-CM000-02E': 'KKAP-CM000-01E';
                            msgId.push(errId);
                            var errMsg: string = AppBizMsg.getMsg(errId, [chkName]);
                            showErr(chkId, chkErrAreaId, errId, errMsg);
                        }
                        break;
                    case 'hasForbidChar':
                        // 禁止文字チェック
                        if (!AppBizInputCheck.isEmpty(chkVal) && AppBizInputCheck.hasForbidChar(chkVal)) {
                            var errId: string = 'KKAP-CM000-08E';
                            msgId.push(errId);
                            var errMsg: string = AppBizMsg.getMsg(errId, [chkName]);
                            showErr(chkId, chkErrAreaId, errId, errMsg);
                        }
                        break;
                    case 'isFullHurigana':
                        // 全角カナチェック
                        if (!AppBizInputCheck.isEmpty(chkVal) && !AppBizInputCheck.isFullHurigana(chkVal)) {
                            var errId: string = 'KKAP-CM000-03E';
                            msgId.push(errId);
                            var errMsg: string = AppBizMsg.getMsg(errId, [chkName, '全角カナ']);
                            showErr(chkId, chkErrAreaId, errId, errMsg);
                        }
                        break;
                    // 入力画面で実装、共通処理を廃棄（START)
                    // case 'isAccountMailAddr':
                    //     // メール（アカウント）チェック
                    //     if (!AppBizInputCheck.isEmpty(chkVal) && !AppBizInputCheck.isAccountMailAddr(chkVal)) {
                    //         var errId: string = 'KKAP-CM000-03E';
                    //         msgId.push(errId);
                    //         var errMsg: string = AppBizMsg.getMsg(errId, [chkName, 'メール（アカウント）']);
                    //         showErr(chkId, chkErrAreaId, errId, errMsg);
                    //     }
                    //     break;
                    // case 'isDomainMailAddr':
                    //     // メール（ドメイン）チェック
                    //     if (!AppBizInputCheck.isEmpty(chkVal) && !AppBizInputCheck.isDomainMailAddr(chkVal)) {
                    //         var errId: string = 'KKAP-CM000-03E';
                    //         msgId.push(errId);
                    //         var errMsg: string = AppBizMsg.getMsg(errId, [chkName, 'メール（ドメイン）']);
                    //         showErr(chkId, chkErrAreaId, errId, errMsg);
                    //     }
                    //     break;
                    // 入力画面で実装、共通処理を廃棄（END)
                    case 'isFullString':
                        // 全角チェック
                        if (!AppBizInputCheck.isEmpty(chkVal) && !AppBizInputCheck.isFullString(chkValArray)) {
                            var errId: string = 'KKAP-CM000-03E';
                            msgId.push(errId);
                            var errMsg: string = AppBizMsg.getMsg(errId, [chkName, '全角']);
                            showErr(chkId, chkErrAreaId, errId, errMsg);
                        }
                        break;
                    case 'isNum':
                        // 半角数字チェック
                        if (!AppBizInputCheck.isEmpty(chkVal) && !AppBizInputCheck.isNum(String(chkVal))) {
                            var errId: string = 'KKAP-CM000-03E';
                            msgId.push(errId);
                            var errMsg: string = AppBizMsg.getMsg(errId, [chkName, '数字']);
                            showErr(chkId, chkErrAreaId, errId, errMsg);
                        }
                        break;
                    case 'chkMaxLength':
                        if (typeof(chkObj.length) !== 'number' || chkObj.length <= 0) {
                           throw new Error('APPLGC-C014(inputCheck)メソッドの桁数チェックのパラメータが不正。');
                        }
                        // 最大桁数チェック
                        if (!AppBizInputCheck.isEmpty(chkVal) && AppBizInputCheck.chkMaxLength(String(chkVal), chkObj.length) == 1) {
                            var errId: string = 'KKAP-CM000-09E';
                            msgId.push(errId);
                            var errMsg: string = AppBizMsg.getMsg(errId, [chkName, chkObj.length]);
                            showErr(chkId, chkErrAreaId, errId, errMsg);
                        }
                        break;
                    case 'chkSameLength':
                        if (typeof(chkObj.length) !== 'number' || chkObj.length <= 0) {
                           throw new Error('APPLGC-C014(inputCheck)メソッドの桁数チェックのパラメータが不正。');
                        }
                        // 桁数一致チェック
                        if (!AppBizInputCheck.isEmpty(chkVal) && AppBizInputCheck.chkMaxLength(String(chkVal), chkObj.length) != 0) {
                            var errId: string = 'KKAP-CM000-04E';
                            msgId.push(errId);
                            var errMsg: string = AppBizMsg.getMsg(errId, [chkName, chkObj.length]);
                            showErr(chkId, chkErrAreaId, errId, errMsg);
                        }
                        break;
                    case 'hasSimilar':
                        // 類似文字チェック（単項目のみ）
                        if (!AppBizInputCheck.isEmpty(chkVal)) {
                            similarCharParam = chkSimilar.charCheckResults(chkId, chkValArray, chkObj.similarType);
                        }
                        break;
                }
            }
            if (msgId.length > 0) {
                break;
            }
        }
        if (msgId.length != 0) {
            errFlg = true;
            msgParam = {value: chkVal, msgId: msgId};
        } else {
            msgParam = {value: chkVal};
        }
        if (typeof(similarCharParam) === 'object' && similarCharParam != null && Object.keys(similarCharParam).length != 0) {
            return [errFlg, msgParam, similarCharParam];
        } else {
            return [errFlg, msgParam];
        }
   }
    /**---------------------------------------------------------------
     * エラーメッセージ表示
     *
     * @param {string} chkId - 画面項目定義.画面項目ID
     * @param {string} chkErrAreaId - 画面項目定義.エラーメッセージ表示用画面項目ID
     * @param {string} errId - エラーコード
     * @param {string} errMsg - エラーメッセージ
     * @param {boolean} kbn - 表示区分 true: 背景色を赤にし、エラーメッセージを表示(default), false: 背景色のみを赤にする
     */
    var showErr = (chkId: string, chkErrAreaId:string, errId: string, errMsg: string, kbn: boolean = true): void => {
        var errAreaId: string = chkErrAreaId ? chkErrAreaId: chkId;
        kbn && AppBizMsg.showErrorMsgText(errAreaId, errMsg, errId);
        kbn && AppBizMsg.showErrorItem(errAreaId);
        !kbn && AppBizMsg.showErrorBlock(errAreaId);
    }
    
    return {
        /**---------------------------------------------------------------
         * 複数項目一括チェック（パブリックメソッド）
         *
         * @param {any} chkObjs - 複数項目のチェック対象オブジェクト
         * @param {any} inputObjs - 画面入力値オブジェクト
         * @return {Array<any>} - チェック結果 [ エラーフラグ, 入力チェック結果 ]
         */
        multiInputCheck: (chkObjs: any, inputObjs: any): any => {
            return multiInputCheck(chkObjs, inputObjs);
        },
        /**---------------------------------------------------------------
         * 一項目一括チェック（パブリックメソッド）
         *
         * @param {any} chkObj - チェック対象オブジェクト（入力値が含まれている画面項目定義）
         * @param {string} type - チェックタイプ
         * @return {Array<any>} - チェック結果 [ エラーフラグ, 入力チェック結果, 類似文字チェック結果 ]
         */
        inputCheck: (chkObj: any, type: string): any => {
            return inputCheck(chkObj, type);
        },
    }
}])

// 「APPLGC-C071：共通領域データを割り当てる処理」
.factory('AppLgcApplyAssign', function() {

    /**---------------------------------------------------------------
     * 共通領域データを割り当てる処理
     *
     * @param {any} applyDefine - 共通領域定義オブジェクト
     * @param {any} targetObj - 入力テータオブジェクト
     * @return {any} - 割り当てる結果 or undefined
     */
    var objAssign = (applyDefine: any, targetObj: any): any => {
        if (!targetObj || !applyDefine) {
            throw new Error('APPLGC-C071(objAssign)メソッドのパラメータが存在しません。');
        }
        var result: any = {};
        for (var prop in targetObj) {
            if (targetObj.hasOwnProperty(prop) && applyDefine.hasOwnProperty(prop)) {
                var value: any = targetObj[prop];
                var define: any = applyDefine[prop];
                if (typeof(value) === 'object' && value != null && Object.keys(value).length != 0) {
                    if (Array.isArray(value) && value.length != 0 && Array.isArray(define)) {
                        var tmpLen: number = (define.length > value.length) ? value.length : define.length;
                        result[prop] = [];
                        for (var i: number = 0; i < tmpLen; i++) {
                            var tmpItem = objAssign(define[i], value[i]);
                            (tmpItem != undefined) && result[prop].push(tmpItem);
                        }
                        if (result[prop].length == 0) {
                            delete result[prop];
                        }
                    }
                    if (Array.isArray(value) && value.length != 0 && !Array.isArray(define)) {
                        result[prop] = angular.copy(value);
                    }
                    if (!Array.isArray(value)) {
                        result[prop] = objAssign(define, value);
                    }
                }
                if (typeof(value) !== 'object' && value != undefined) { // 注意: 各項目は「undefined」で初期化する
                    result[define] = value;
                }
            }
        }
        return (Object.keys(result).length == 0) ? undefined : result;
    }

    return {
        /**---------------------------------------------------------------
         * 共通領域データを割り当てる処理（パブリックメソッド）
         *
         * @param {any} applyDefine - 共通領域定義オブジェクト
         * @param {any} targetObj - 入力テータオブジェクト
         * @return {any} - 割り当てる結果
         */
        objAssign: (applyDefine: any, targetObj: any): any => {
            var result = objAssign(applyDefine, targetObj);
            if (undefined == result) {
                throw new Error('APPLGC-C071(objAssign)メソッドのパラメータがあっていないため、undifinedの結果が出ました。');
            }
            return result;
        },
    }
})
.factory('serviceTimeCheck', ['$controller', 'AppBizCom', 'appConst', 'APL_NAME', 'LOG_LEVEL', 'AppComLog',
    function ($controller, AppBizCom, appConst, APL_NAME, LOG_LEVEL, AppComLog) {

    return {

        /**
         * SFJ-27：サービス時間チェック機能
         * 
         * @param  {(result: boolean) => void} onSuccess - 成功時コールバック。
         * @param  {(error: any) => void} onError - 失敗時コールバック。
         * @param  {any} onConnectionError - 通信エラー時コールバック。
         * @param  {boolean} isShowIndicator - インジケータ表示フラグ
         */
        checkServiceTime (onSuccess: (result: boolean) => void, onError: (error: any) => void, onConnectionError: any, isShowIndicator: boolean = true): void {

        　  // ログイン者データの取得．
            var loginInfo: any    = AppBizCom.DataHolder.getLoginInfo();
            var proper   : string = loginInfo.PROPER_C;
            var shop     : string = loginInfo.UKETSUKE_MISE_C;
            var section  : string = loginInfo.UKETSUKE_KAKARI_C;

            //サービス時間チェック機能呼び出し
            AppBizCom.CheckServTime.checkServiceTime(function () {

                onSuccess(true);

            }, function (error: any) {

                // 共通機能の継承
                var scope: any = {};
                $controller('errorInfoModalCtrl', { $scope: scope });

                if (typeof error == "object" && 'RESULT_CODE' in error) {

                    if (error.RESULT_CODE == appConst.SUBIF001.RESULT_CODE.OFFLINE) {

                        // サービス時間の開始と終了を取得
                        var serviceTime: any = AppBizCom.DataHolder.getServiceTime();
                        var SRVC_KS_ZKK: string = serviceTime.SRVC_KS_ZKK;
                        var serviceSta: string = Number(SRVC_KS_ZKK.substr(0, 2)) + ':' + SRVC_KS_ZKK.substr(3, 2);
                        var SRVC_SYRY_ZKK: string = serviceTime.SRVC_SYRY_ZKK;
                        var serviceEnd: string = Number(SRVC_SYRY_ZKK.substr(0, 2)) + ':' + SRVC_SYRY_ZKK.substr(3, 2);

                        // サービス時間外メッセージの定義
                        var ERR_SERVICE_TIME = {
                            TITLE: AppBizCom.Msg.getMsg('KKAP-CM000-13E', []),
                            CONTENTS: AppBizCom.Msg.getMsg('KKAP-CM000-14E', [APL_NAME, serviceSta, serviceEnd]),
                        };

                        // errorログ出力
                        AppComLog.writeLog(proper, shop, section, LOG_LEVEL.ERROR, ERR_SERVICE_TIME.TITLE, error);

                        // サービス時間モーダルの表示
                        scope.openErrorInfo(ERR_SERVICE_TIME.TITLE, ERR_SERVICE_TIME.CONTENTS);

                    } else if (error.RESULT_CODE == appConst.SUBIF001.RESULT_CODE.OTHER_ERROR) {

                        /** システムエラー. */
                        var ERR_SYSTEM = {
                            TITLE: AppBizCom.Msg.getMsg('KKAP-CM000-06E', []),
                            CONTENTS: AppBizCom.Msg.getMsg('KKAP-CM000-07E', [])
                        };

                        // サービス時間外モーダル表示
                        scope.openErrorInfo(ERR_SYSTEM.TITLE, ERR_SYSTEM.CONTENTS);

                        // errorログ出力
                        AppComLog.writeLog(proper, shop, section, LOG_LEVEL.ERROR, ERR_SYSTEM.TITLE, error);

                    }

                } else {

                    // 通信エラーメッセージの定義
                    var ERR_NETWORK = {
                        TITLE: AppBizCom.Msg.getMsg('KKAP-SF001-09E', []),
                        CONTENTS: AppBizCom.Msg.getMsg('KKAP-SF004-04E', []),
                    };

                    // errorログ出力
                    AppComLog.writeLog(proper, shop, section, LOG_LEVEL.WARNING, 'HTTP通信エラー', error);

                    // 通信エラーモーダル表示
                    return scope.openErrorInfoCloseable(ERR_NETWORK.TITLE, ERR_NETWORK.CONTENTS, onConnectionError);
                }

                onError(false);

            }, isShowIndicator);
        }
    }
}])

// スクロールインデックス(共通処理)
.service('AppBizNaviScroll', [function () {
    // .scrollArea
    var scrollElem;
    var headerElem;
    var footerElem;
    // <main> ...</main>
    var mainEl;
    // blockAreaのscopeオブジェクト
    var tmpScop;
    // ボディの上端に対して現在の要素の距離
    var offsets = [];
    // 要素のid
    var targetNaviIDs = [];
    // <nav> ...</nav>
    var navElem;
    // [{target: 該当要素のid navinm: 該当要素の名称 id: 該当要素のid+"Link"} ...]
    // [{target: navCustomerName navinm: "おなまえ" id: navCustomerNameLink} ...]
    var originList;
    //[{s:ボディの上端に対して現在の要素上端の距離 e:ボディの上端に対して現在の要素下端の距離 i:該当要素のid},...]
    var subOffsets = [];
    // 上記配列が設定されたフラグ
    var subOffsetOver = false;
    var currentId;

    // touchmoveイベントが実行されたフラグ
    var moved = false;

    var addactive = function (id) {
        angular.element(document.querySelectorAll('.nav li > a')).parent('.active').removeClass('active');
        angular.element(document.querySelector('.nav li > #' + id + 'Link')).parent('li').addClass('active');
    };
    var navIndex = function () {
        moved = false;
        if (subOffsetOver) {
            return;
        }
        for (var i = 0; i < originList.length; i++) {
            var tmpId = originList[i].target;
            var tmpElemT = $('#' + tmpId + 'Link').offset().top;
            var tmpElemH = document.getElementById(tmpId + 'Link').offsetHeight;
            subOffsets.push({ 's': tmpElemT, 'e': tmpElemT + tmpElemH, 'i': tmpId });
        }
        subOffsetOver = true;
    }
    var scrollMove = function (e) {
        moved = true;
        for (var i = 0; i < subOffsets.length; i++) {
            if (e.pageY > subOffsets[i].s && e.pageY < subOffsets[i].e) {
                (currentId != subOffsets[i].i) && self.gotoAnchor(subOffsets[i].i);
                currentId = subOffsets[i].i;
            }
        }
    }
    var scrollToID = function () {
        mainEl = scrollElem[0];
        var scrollTop = mainEl.scrollTop;
        var maxScroll = mainEl.scrollHeight;

        var tmpElem = angular.element(document.querySelectorAll('.nav li.active > a'));
        var activeId = (tmpElem.length > 0) ? tmpElem.attr('target') : '';
        if (scrollTop + mainEl.clientHeight >= maxScroll - 1) {
            addactive(targetNaviIDs[targetNaviIDs.length - 1]);
        } else {
            for (var i = offsets.length; i--;) {
                if (activeId != targetNaviIDs[i]
                    && scrollTop >= offsets[i]
                    && (!offsets[i + 1]) || scrollTop < offsets[i + 1]) {
                    addactive(targetNaviIDs[i]);
                }
            }
        }
    };
    var hideNav = function (e) {
        var tmpTar = $(e.target).parents('.nav-fixed');
        if (tmpScop && tmpTar && tmpTar.length == 0) {
            $(document).off('touchmove');
            $(mainEl).css({ '-webkit-overflow-scrolling': 'touch' });
            tmpScop.itemSelected = false;
            tmpScop.$applyAsync();
        }
    };
    this.init = function (scope, list, offset) {
        if (offset === void 0) { offset = 120; }
        tmpScop = scope;
        scrollElem = document.querySelectorAll('.scrollArea');
        mainEl = scrollElem[0];
        angular.element(scrollElem).bind('scroll', scrollToID);
        angular.element(scrollElem).bind('touchstart', hideNav);

        headerElem = document.querySelector('#headerElem');
        angular.element(headerElem).bind('touchstart', hideNav);
        footerElem = document.querySelector('#footerElem');
        angular.element(footerElem).bind('touchstart', hideNav);

        navElem = document.querySelector('#navBar');
        angular.element(navElem).bind('touchstart', navIndex);
        angular.element(navElem).bind('touchmove', scrollMove);

        self.calculate(list, offset);
        originList = list;
    };
    this.deinit = function () {
        angular.element(scrollElem).unbind('scroll', scrollToID);
        angular.element(scrollElem).unbind('touchstart', hideNav);
        angular.element(headerElem).unbind('touchstart', hideNav);
        angular.element(footerElem).unbind('touchstart', hideNav);
        angular.element(navElem).unbind('touchstart', navIndex);
        angular.element(navElem).unbind('touchmove', scrollMove);
        scrollElem = null;
        headerElem = null;
        footerElem = null;
        mainEl = null;
        navElem = null;
    };
    this.calculate = function (list, offset) {
        if (offset === void 0) { offset = 120; }
        var clientHeight = scrollElem[0].clientHeight;
        var maxScroll = scrollElem[0].scrollHeight;
        offsets = [];
        targetNaviIDs = [];
        var newObj = {};
        for (var i = 0; i < list.length; i++) {
            var tmpId = list[i].target;
            var tmpElem = document.getElementById(tmpId);
            var tmpOffset = (i == 0) ? 150 : offset;
            if (tmpElem) {
                offsets.push(tmpElem.offsetTop - tmpOffset);
                targetNaviIDs.push(tmpId);
            }
        }
        tmpScop.$applyAsync();
        scrollToID();
    };
    this.gotoAnchor = function (id, type = false) {
        var scrollV = offsets[targetNaviIDs.findIndex(function (val) { return val === id; })] + 1;
        !moved && type && $(mainEl).animate({ scrollTop: scrollV }, 400, function () { });
        !type && $(mainEl).scrollTop(scrollV);
    };
    this.navToggle = function () {
        var scrollArea = document.getElementsByClassName('scrollArea')[0];
        if (!tmpScop.itemSelected) {
            $(window).on('touchmove.noScroll', function (e) { e.preventDefault(); });
            $('.scrollArea').css({ '-webkit-overflow-scrolling': 'auto' });
        } else {
            $(window).off('.noScroll');
            $('.scrollArea').css({ '-webkit-overflow-scrolling': 'touch' });
        }
        tmpScop.itemSelected = !tmpScop.itemSelected;
        tmpScop.$applyAsync();
    }
    var self = this;
}])