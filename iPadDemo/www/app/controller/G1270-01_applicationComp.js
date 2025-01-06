/// <reference path="../reference.d.ts" />
/*
    修正履歴
    2020/11/19 インシデント対応 ITI本夛
    振込先口座の登録番号削除の際、登録番号でなく配列のインデックスに基づいて処理がされているため修正。
 */
App.controller('applicationCompController', ['$scope', '$controller', '$location', 'appConst', 'AppBizCom', 'logicCom', 'AppCom', 'logFileSend', 'slsDelete',
    function ($scope, $controller, $location, appConst, AppBizCom, logicCom, AppCom, logFileSend, slsDelete) {
        // エラーモーダルコントローラー継承
        $controller('errorInfoModalCtrl', { $scope: $scope });
        /** 画面ID. */
        var PAGE_THIS_ID = 'G1270-01';
        /** 送信成功画面ID. */
        var PAGE_SUCCESS_ID = 'G1270-02';
        /** 送信成功画面名. */
        var PAGE_SUCCESS_NAME = 'applicationCompSendSuccess';
        /** 送信失敗画面ID. */
        var PAGE_FAILED_ID = 'G1270-03';
        /** 送信失敗画面名. */
        var PAGE_FAILED_NAME = 'applicationCompSendFailed';
        /**
         * 初期表示
         *
         * @returns void
         */
        $scope.sendInit = function () {
            new Promise((resolve, reject) => {
                // 受付NO通番の取得
                searchRrcptNoTubn((rcptNoTubn) => {
                    // 成功
                    return resolve(rcptNoTubn);
                }, (error) => {
                    // 失敗
                    return reject(error);
                });
            }).then((rcptNoTubn) => {
                return new Promise((resolve, reject) => {
                    try {
                        var applyInfo = AppBizCom.DataHolder.getNotifInfo(); // 申込データ（事務手続き）
                        var eFormInfo = AppBizCom.DataHolder.getEFormInfo(); // 申込データ（電子帳票）
                        if (applyInfo) {
                            // SUBIF008-SENDの作成（事務手続き）
                            var subifSend = createSubif008Send(rcptNoTubn);
                            return resolve({
                                subifSend: subifSend,
                                type: '2'
                            });
                        }
                        else if (eFormInfo) {
                            // SUBIF009-SENDの作成（電子帳票）
                            var subifSend = createSubif009Send(rcptNoTubn);
                            return resolve({
                                subifSend: subifSend,
                                type: '3'
                            });
                        }
                    }
                    catch (error) {
                        // 失敗
                        return reject({
                            msg: 'SUBIF-SEND作成エラー',
                            param: error,
                        });
                    }
                });
            }).then((result) => {
                return new Promise((resolve) => {
                    // 申込データSLS保存
                    saveSlsApplyInfo(result.type, result.subifSend, (key) => {
                        // 成功
                        return resolve({
                            subifSend: result.subifSend,
                            type: result.type,
                            key: key
                        });
                    }, (error, key) => {
                        // 失敗
                        logicCom.errorLog(error.msg, error.param);
                        return resolve({
                            subifSend: result.subifSend,
                            type: result.type,
                            key: key
                        });
                    });
                });
            }).then((result) => {
                return new Promise((resolve) => {
                    // 申込データ送信（マルチパート変換、サーバ送信、SLSデータ削除）
                    sendToServer(result.subifSend, result.type, result.key, () => {
                        // 成功
                        return resolve();
                    }, (error) => {
                        // エラー（エラーとはしない）
                        return resolve(error);
                    });
                });
            }).then((error) => {
                return new Promise((resolve) => {
                    // ログファイル送信
                    sendLog(() => {
                        // 成功
                        return resolve(error);
                    });
                });
            }).then((error) => {
                // 成功
                if (error) {
                    // 申込完了（未送信案件あり）
                    logicCom.callbackLog(PAGE_THIS_ID, PAGE_FAILED_ID, '申込完了（未送信案件あり）', error);
                    $location.path(PAGE_FAILED_NAME);
                }
                else {
                    // 申込完了
                    $location.path(PAGE_SUCCESS_NAME);
                    logicCom.callbackLog(PAGE_THIS_ID, PAGE_SUCCESS_ID, '申込完了');
                }
                return $scope.$apply();
            }).catch((error) => {
                // 失敗（システムエラー発生）
                if (error && error.msg && error.param) {
                    logicCom.errorLog(error.msg, error.param);
                }
                else {
                    logicCom.errorLog('システムエラー', error);
                }
                $scope.openErrorInfo(AppBizCom.Msg.getMsg('KKAP-CM000-06E'), AppBizCom.Msg.getMsg('KKAP-CM000-07E'));
            });
        };
        /**
         * ログファイル送信
         *
         * @param {() => void} successCallback - 成功時のコールバック関数
         * @returns void
         */
        var sendLog = function (successCallback) {
            logFileSend.logFileSend(() => {
                // 成功
                return successCallback();
            }, (RESULT_CODE) => {
                // サーバ応答結果エラー
                var errorMsg;
                if (RESULT_CODE == appConst.SUBIF010.RESULT_CODE.RECV_ERROR) {
                    // ログデータ受信処理エラー
                    errorMsg = 'ログファイル送信機能でログデータ受信エラー';
                }
                else if (RESULT_CODE == appConst.SUBIF010.RESULT_CODE.OFFLINE) {
                    // オフライン中
                    errorMsg = 'ログファイル送信機能でサービス時間外エラー';
                }
                else {
                    // その他エラー
                    errorMsg = 'ログファイル送信機能でその他エラー';
                }
                logicCom.warnLog(errorMsg, { RESULT_CODE: RESULT_CODE });
                return successCallback();
            }, (error) => {
                // 通信エラー、タイムアウト
                logicCom.warnLog('ログファイル送信機能で通信エラー', error);
                return successCallback();
            }, (error) => {
                // ログ削除エラー
                logicCom.warnLog('ログファイル送信機能でログ削除エラー', error);
                return successCallback();
            });
        };
        /**
         * 申込データSLS保存
         *
         * @param {string} type - 申込区分
         * @param {any} subifSend - サブインターフェース（申込データ）
         * @param {(key: string) => void} successCallback - 成功時のコールバック関数
         * @param {(error: { msg: string, param: any }, key: string) => void} errorCallback - 失敗時のコールバック関数
         * @returns void
         */
        var saveSlsApplyInfo = function (type, subifSend, successCallback, errorCallback) {
            var time = AppCom.Date.getCurrentTimeMillis();
            var key = time + type;
            new Promise((resolve, reject) => {
                // SLS保存
                AppCom.ClientSls.setObject(time, type, subifSend, () => {
                    // 成功
                    logicCom.infoLog('SLSデータ保存', { time: time, type: type });
                    return resolve();
                }, (error) => {
                    // 失敗
                    return reject({
                        msg: 'SLSデータ保存エラー',
                        param: error
                    });
                });
            }).then(() => {
                return new Promise((resolve, reject) => {
                    // SLS件数取得（事務手続き）
                    logicCom.getSLSLength('2', (len) => {
                        // 成功
                        return resolve(len);
                    }, (error) => {
                        // 失敗
                        return reject({
                            msg: 'SLS件数取得エラー',
                            param: error
                        });
                    });
                });
            }).then((sumLen) => {
                return new Promise((resolve, reject) => {
                    // SLS件数取得（電子帳票）
                    logicCom.getSLSLength('3', (len) => {
                        // 成功
                        return resolve(len + sumLen);
                    }, (error) => {
                        // 失敗
                        return reject({
                            msg: 'SLS件数取得エラー',
                            param: error
                        });
                    });
                });
            }).then((slsNum) => {
                return new Promise((resolve) => {
                    // バッジ更新権限確認
                    cordova.plugins.notification.badge.hasPermission(function (granted) {
                        // バッジ権限確認
                        if (granted) {
                            // バッジ件数更新
                            cordova.plugins.notification.badge.set(slsNum, 
                            // バッジ件数更新
                            () => {
                                return resolve();
                            });
                        }
                        else {
                            return resolve();
                        }
                    });
                });
            }).then(() => {
                // 成功
                return successCallback(key);
            }).catch((error) => {
                // 失敗
                return errorCallback(error, key);
            });
        };
        /**
         * 申込データSLS削除
         *
         * @param {string} key - SLSキー
         * @param {() => void} successCallback - 成功時のコールバック関数
         * @param {(error: {msg: string, param: any}) => void} errorCallback - 失敗時のコールバック関数
         * @returns void
         */
        var deleteSlsApplyInfo = function (key, successCallback, errorCallback) {
            // SLSデータ削除
            slsDelete.targetSlsDelete([key], () => {
                // 成功
                return successCallback();
            }, (error) => {
                // 失敗
                return errorCallback({
                    msg: 'SLSデータ削除エラー',
                    param: error,
                });
            });
        };
        /**
         * 「SUBIF009-SEND：電子帳票申込データ送信」を作成
         *
         * @param {any} applyInfo - 申込データ（電子帳票）
         * @param {number} rcptNoTubn - 受付NO通番
         * @returns {any} SUBIF - SUBIF009-SEND：電子帳票申込データ送信
         */
        var createSubif009Send = function (rcptNoTubn) {
            var eFormInfo = AppBizCom.DataHolder.getEFormInfo(); // 申込データ（電子帳票）
            var imageData = AppBizCom.DataHolder.getImageData(); // 画像データ
            var EIGYOIN_JOHO = eFormInfo.EIGYOIN_JOHO || {}; // 営業員情報
            var MOSKM_HSK = eFormInfo.MOSKM_HSK || {}; // 申し込み補足情報
            var CHOHYO = eFormInfo.CHOHYO || {}; // 電子帳票
            var UKE_JOHO = eFormInfo.UKE_JOHO || {}; // 受付場所情報
            var KYAK_JOHO = eFormInfo.KYAK_JOHO || {}; // 受付場所情報
            var serviceTime = AppBizCom.DataHolder.getServiceTime(); // サービス時間情報
            var GYOMU_DATE = serviceTime.GYOMU_DATE; // 業務日付
            // SUBIF009-SEND：電子帳票申込データ送信
            var SUBIF = {};
            // UUID
            SUBIF.UUID = MOSKM_HSK.UUID || '';
            // 申込日時
            SUBIF.MOSKM_NICHJ = AppCom.Date.getCurrentTimeMillis().replace(/-|:|\.| /g, '');
            // 受付No
            SUBIF.RECP_NO = SUBIF.UUID + GYOMU_DATE.replace(/-/g, '') + ('0000' + rcptNoTubn).slice(-4);
            // 緯度
            SUBIF.IDO = MOSKM_HSK.IDO || '';
            // 経度
            SUBIF.KEIDO = MOSKM_HSK.KEIDO || '';
            // 社員ID
            SUBIF.PROPER_C = EIGYOIN_JOHO.PROPER_C || '';
            // 受付者店部課コード
            SUBIF.UKETSUKE_MISE_C = EIGYOIN_JOHO.UKETSUKE_MISE_C || '';
            // 受付者係コード 
            SUBIF.UKETSUKE_KAKARI_C = EIGYOIN_JOHO.UKETSUKE_KAKARI_C || '';
            // 店部課コード
            SUBIF.MISE_C = KYAK_JOHO.MISE_C || '';
            // 客コード
            SUBIF.KYAK_CIF_C = KYAK_JOHO.KYAK_CIF_C || '';
            // 受付場所区分
            SUBIF.UKTKBASY_K = UKE_JOHO.UKTKBASY_K || '';
            // 帳票ID
            SUBIF.CHOHYO_ID = CHOHYO.CHOHYO_ID || '';
            // 電子帳票書面画像
            SUBIF.DOC_GAZO = imageData.DOC_GAZO || '';
            // ストローク情報
            SUBIF.INK_DATA = imageData.SYM_STRK || '';
            return SUBIF;
        };
        /**
         * 「SUBIF008-SEND：事務手続き申込データ送信」を作成
         *
         * @param {any} applyInfo - 申込データ（事務手続き）
         * @param {number} rcptNoTubn - 受付NO通番
         * @returns {any} SUBIF - SUBIF008-SEND：事務手続き申込データ送信
         */
        var createSubif008Send = function (rcptNoTubn) {
            // 共通領域データ取得
            var applyInfo = AppBizCom.DataHolder.getNotifInfo(); // 申込データ（事務手続き）
            var offerMynumberData = AppBizCom.DataHolder.getPersonInfo(); // 申込データ（特定個人情報）
            var imageData = AppBizCom.DataHolder.getImageData(); // 画像データ
            var apageJumpFlg = AppBizCom.DataHolder.getFlowControlFlg(); // 画面遷移制御フラグ情報            
            // M0-2021-10-023 特定管理口座区分表示不備対応 開始 20211029
            var customer = AppBizCom.DataHolder.getCustomer(); // 既契約顧客情報
            // M0-2021-10-023 特定管理口座区分表示不備対応 終了 20211029
            // 申込データ
            var EIGYOIN_JOHO = applyInfo.EIGYOIN_JOHO || {}; // 営業員情報
            var KYAK_JOHO = applyInfo.KYAK_JOHO || {}; // お客さま情報
            var MOSKM_HSK = applyInfo.MOSKM_HSK || {}; // 申し込み補足情報
            var UKE_JOHO = applyInfo.UKE_JOHO || {}; // 受付場所情報
            var MNSYSEIRY_JOHO = applyInfo.MNSYSEIRY_JOHO || {}; // 番号確認書類情報
            var HONIN_KAKNIN_SY_JOHO = applyInfo.HONIN_KAKNIN_SY_JOHO || {}; // 本人確認書類情報
            var JIMU_JOHO = applyInfo.JIMU_JOHO || {}; // 事務手続き情報
            var PIN_JOHO = applyInfo.PIN_JOHO || {}; // 暗証番号情報
            var EIGYOIN_KAKNIN_JOHO = applyInfo.EIGYOIN_KAKNIN_JOHO || {}; // 営業員確認情報
            var KAKNIN_SY_CHK_JOHO = applyInfo.KAKNIN_SY_CHK_JOHO || {}; // 確認書類チェック情報
            // 画面遷移制御フラグ情報
            var INPUT_FLG_CONTROL = apageJumpFlg.INPUT_FLG_CONTROL || {}; // 入力画面遷移制御
            var serviceTime = AppBizCom.DataHolder.getServiceTime(); // サービス時間情報
            var GYOMU_DATE = serviceTime.GYOMU_DATE; // 業務日付
            // SUBIF008-SEND：事務手続き申込データ送信
            var SUBIF = {};
            // UUID
            SUBIF.UUID = MOSKM_HSK.UUID || '';
            // 申込日時
            SUBIF.MOSKM_NICHJ = AppCom.Date.getCurrentTimeMillis().replace(/-|:|\.| /g, '');
            // 受付No
            SUBIF.RECP_NO = SUBIF.UUID + GYOMU_DATE.replace(/-/g, '') + ('0000' + rcptNoTubn).slice(-4);
            // 緯度
            SUBIF.IDO = MOSKM_HSK.IDO || '';
            // 経度
            SUBIF.KEIDO = MOSKM_HSK.KEIDO || '';
            // 社員ID
            SUBIF.PROPER_C = EIGYOIN_JOHO.PROPER_C || '';
            // 受付者店部課コード
            SUBIF.UKETSUKE_MISE_C = EIGYOIN_JOHO.UKETSUKE_MISE_C || '';
            // 受付者係コード 
            SUBIF.UKETSUKE_KAKARI_C = EIGYOIN_JOHO.UKETSUKE_KAKARI_C || '';
            // 店部課コード
            SUBIF.MISE_C = KYAK_JOHO.MISE_C || '';
            // 客コード
            SUBIF.KYAK_CIF_C = KYAK_JOHO.KYAK_CIF_C || '';
            // 受付場所区分
            SUBIF.UKTKBASY_K = UKE_JOHO.UKTKBASY_K || '';
            // 個人番号確認書類区分
            SUBIF.MNSYSEIRY_K = MNSYSEIRY_JOHO.MNSYSEIRY_K || '';
            // 個人番号（CBC暗号化）
            if (MNSYSEIRY_JOHO.MNSYSEIRY_K && offerMynumberData.MYNO) {
                var myno = MNSYSEIRY_JOHO.MNSYSEIRY_K + offerMynumberData.MYNO;
                SUBIF.MYNO = AppCom.Encrypt.encryptAES128CBC(myno) || '';
            }
            else {
                SUBIF.MYNO = '';
            }
            // 本人確認書類区分（1種類目）
            if (HONIN_KAKNIN_SY_JOHO.HONIN_KAKNIN_SY_K_1) {
                var codeMstData = AppBizCom.MstData.getCodeMstDataByCd('HONIN_KAKNIN_SY', HONIN_KAKNIN_SY_JOHO.HONIN_KAKNIN_SY_K_1);
                var stm4 = codeMstData ? codeMstData.STM4 : '';
                SUBIF.HONIN_KAKNIN_SY_K_1 = stm4 || '';
            }
            else {
                SUBIF.HONIN_KAKNIN_SY_K_1 = '';
            }
            // 本人確認書類郵送区分（1種類目）
            SUBIF.HONIN_KAKNIN_SY_YUSO_K_1 = HONIN_KAKNIN_SY_JOHO.HONIN_KAKNIN_SY_YUSO_K_1 || '';
            // 本人確認書類区分（2種類目）
            if (HONIN_KAKNIN_SY_JOHO.HONIN_KAKNIN_SY_K_2) {
                var codeMstData = AppBizCom.MstData.getCodeMstDataByCd('HONIN_KAKNIN_SY', HONIN_KAKNIN_SY_JOHO.HONIN_KAKNIN_SY_K_2);
                var stm4 = codeMstData ? codeMstData.STM4 : '';
                SUBIF.HONIN_KAKNIN_SY_K_2 = stm4 || '';
            }
            else {
                SUBIF.HONIN_KAKNIN_SY_K_2 = '';
            }
            // 本人確認書類郵送区分（2種類目）
            SUBIF.HONIN_KAKNIN_SY_YUSO_K_2 = HONIN_KAKNIN_SY_JOHO.HONIN_KAKNIN_SY_YUSO_K_2 || '';
            // 変更後情報
            SUBIF.HNKATO = {};
            // 変更後情報.顧客姓（漢字）
            SUBIF.HNKATO.KYAKNM_SEI_KNJ =
                JIMU_JOHO.KYAKNM_SEI_KNJ
                    ? AppCom.StringUtil.utf16ToBase64(JIMU_JOHO.KYAKNM_SEI_KNJ)
                    : '';
            // 変更後情報.顧客名（漢字）
            SUBIF.HNKATO.KYAKNM_MEI_KNJ =
                JIMU_JOHO.KYAKNM_MEI_KNJ
                    ? AppCom.StringUtil.utf16ToBase64(JIMU_JOHO.KYAKNM_MEI_KNJ)
                    : '';
            // 変更後情報.顧客姓（カナ）
            SUBIF.HNKATO.KYAKNM_SEI_KANA = JIMU_JOHO.KYAKNM_SEI_KANA || '';
            // 変更後情報.顧客名（カナ）
            SUBIF.HNKATO.KYAKNM_MEI_KANA = JIMU_JOHO.KYAKNM_MEI_KANA || '';
            // 変更後情報.地域コード
            SUBIF.HNKATO.TIIKI_C = JIMU_JOHO.TIIKI_C || '';
            // 変更後情報.郵便番号 
            SUBIF.HNKATO.YUBINNO = JIMU_JOHO.YUBINNO || '';
            // 変更後情報.顧客住所漢字
            // if (JIMU_JOHO.KYAK_ADDR_FLAG == '1') {
            //     // 直接入力の場合
            //     var codeMstData: any = AppBizCom.MstData.getCodeMstDataByCd('TDFKN_C', JIMU_JOHO.KYAK_ADDR_TDHKN);
            //     var msy: string = codeMstData ? codeMstData.MSY : '';
            //     SUBIF.HNKATO.KYAK_ADDR_KNJ = AppCom.StringUtil.utf16ToBase64(msy + (JIMU_JOHO.KYAK_ADDR_KNJ || ''));
            // } else {
            SUBIF.HNKATO.KYAK_ADDR_KNJ =
                JIMU_JOHO.KYAK_ADDR_KNJ
                    ? AppCom.StringUtil.utf16ToBase64(JIMU_JOHO.KYAK_ADDR_KNJ)
                    : '';
            // }
            // 変更後情報.顧客住所フリガナ
            // if (JIMU_JOHO.KYAK_ADDR_FLAG == '1') {
            //     // 直接入力の場合
            //     var codeMstData: any = AppBizCom.MstData.getCodeMstDataByCd('TDFKN_C', JIMU_JOHO.KYAK_ADDR_TDHKN);
            //     var stm1: string = codeMstData ? codeMstData.STM1 : '';
            //     SUBIF.HNKATO.KYAK_ADDR_KANA = stm1 + JIMU_JOHO.KYAK_ADDR_KANA || '';
            // } else {
            SUBIF.HNKATO.KYAK_ADDR_KANA = JIMU_JOHO.KYAK_ADDR_KANA || '';
            // }
            // 変更後情報.補足住所漢字
            SUBIF.HNKATO.KYAK_HOSK_ADDR_KNJ =
                JIMU_JOHO.KYAK_HOSK_ADDR_KNJ
                    ? AppCom.StringUtil.utf16ToBase64(JIMU_JOHO.KYAK_HOSK_ADDR_KNJ)
                    : '';
            // 変更後情報.補足住所フリガナ
            SUBIF.HNKATO.KYAK_HOSK_ADDR_KANA = JIMU_JOHO.KYAK_HOSK_ADDR_KANA || '';
            // 変更後情報.建物名漢字
            SUBIF.HNKATO.KYAK_HOUSENM_KNJ =
                JIMU_JOHO.KYAK_HOUSENM_KNJ
                    ? AppCom.StringUtil.utf16ToBase64(JIMU_JOHO.KYAK_HOUSENM_KNJ)
                    : '';
            // 変更後情報.建物名フリガナ
            SUBIF.HNKATO.KYAK_HOUSENM_KANA = JIMU_JOHO.KYAK_HOUSENM_KANA || '';
            // 変更後情報.転居日元号
            SUBIF.HNKATO.TNKY_GNGO = JIMU_JOHO.TNKY_GNGO || '';
            // 変更後情報.転居日
            SUBIF.HNKATO.TNKYYMD = JIMU_JOHO.TNKYYMD || '';
            // 変更後情報.年初住所
            if (JIMU_JOHO.NENSY_JSY) {
                var codeMstData = AppBizCom.MstData.getCodeMstDataByCd('TDFKN_C', JIMU_JOHO.NENSY_JSY);
                var stm2 = codeMstData ? codeMstData.STM2 : '';
                SUBIF.HNKATO.NENSY_JSY = stm2 || '';
            }
            else {
                SUBIF.HNKATO.NENSY_JSY = '';
            }
            // 変更後情報.自宅電話番号
            if (JIMU_JOHO.TELNO1 && JIMU_JOHO.TELNO2 && JIMU_JOHO.TELNO3) {
                SUBIF.HNKATO.TELNO = JIMU_JOHO.TELNO1 + '-' + JIMU_JOHO.TELNO2 + '-' + JIMU_JOHO.TELNO3;
            }
            else {
                SUBIF.HNKATO.TELNO = '';
            }
            // 変更後情報.登録抹消（自宅電話番号）
            SUBIF.HNKATO.TELNO_DEL = JIMU_JOHO.TELNO_DEL || '';
            // 変更後情報.携帯電話番号
            if (JIMU_JOHO.MOBILE_TELNO1 && JIMU_JOHO.MOBILE_TELNO2 && JIMU_JOHO.MOBILE_TELNO3) {
                SUBIF.HNKATO.MOBILE_TELNO = JIMU_JOHO.MOBILE_TELNO1 + '-' + JIMU_JOHO.MOBILE_TELNO2 + '-' + JIMU_JOHO.MOBILE_TELNO3;
            }
            else {
                SUBIF.HNKATO.MOBILE_TELNO = '';
            }
            // 変更後情報.登録抹消（携帯電話番号）
            SUBIF.HNKATO.MOBILE_TELNO_DEL = JIMU_JOHO.MOBILE_TELNO_DEL || '';
            // 変更後情報.FAX番号
            if (JIMU_JOHO.FAXNO1 && JIMU_JOHO.FAXNO2 && JIMU_JOHO.FAXNO3) {
                SUBIF.HNKATO.FAXNO = JIMU_JOHO.FAXNO1 + '-' + JIMU_JOHO.FAXNO2 + '-' + JIMU_JOHO.FAXNO3;
            }
            else {
                SUBIF.HNKATO.FAXNO = '';
            }
            // 変更後情報.登録抹消（FAX番号）
            SUBIF.HNKATO.FAXNO_DEL = JIMU_JOHO.FAXNO_DEL || '';
            // 変更後情報.日興MRF累積投資口座申込
            SUBIF.HNKATO.NIKKO_MRF = JIMU_JOHO.NIKKO_MRF || '';
            // 変更後情報.日興カード申込区分
            SUBIF.HNKATO.NIKKO_CARD = JIMU_JOHO.NIKKO_CARD || '';
            // 変更後情報.日興イージートレード申込区分
            SUBIF.HNKATO.NIKKO_EZ = JIMU_JOHO.NIKKO_EZ || '';
            // 変更後情報.外国証券取引口座申込
            SUBIF.HNKATO.GAIK_SYKN_KOZA = JIMU_JOHO.GAIK_SYKN_KOZA || '';
            // 変更後情報.特定口座申込区分
            SUBIF.HNKATO.TKTEI_KOZA_MSKM = JIMU_JOHO.TKTEI_KOZA_MSKM || '';
            // 変更後情報.特定口座勘定区分
            SUBIF.HNKATO.TKTEI_KOZA_AC = JIMU_JOHO.TKTEI_KOZA_AC || '';
            // 変更後情報.特定口座源徴区分
            SUBIF.HNKATO.TKTEI_KOZA_GNSN = JIMU_JOHO.TKTEI_KOZA_GNSN || '';
            // 変更後情報.特定口座変更予約
            SUBIF.HNKATO.TKTEI_KOZA_YYK = JIMU_JOHO.TKTEI_KOZA_YYK || '';
            // 変更後情報.特定口座年初住所
            if (JIMU_JOHO.TKTEI_KOZA_NENSY_JSY) {
                var codeMstData = AppBizCom.MstData.getCodeMstDataByCd('TDFKN_C', JIMU_JOHO.TKTEI_KOZA_NENSY_JSY);
                var stm2 = codeMstData ? codeMstData.STM2 : '';
                SUBIF.HNKATO.TKTEI_KOZA_NENSY_JSY = stm2 || '';
            }
            else {
                SUBIF.HNKATO.TKTEI_KOZA_NENSY_JSY = '';
            }
            // 変更後情報.特定管理口座申込
            // M0-2021-10-023 特定管理口座区分表示不備対応 開始 20211029
            var tkteiKozaNotExist = (customer.TKTEI_KOZA_OPENYMD === '00000000') ? true : false;
            var tkteiKozaSelected = JIMU_JOHO.TKTEI_KOZA_MSKM;
            if (tkteiKozaNotExist && tkteiKozaSelected == '1') {
                // 特定口座が未開設かつ申込[1]選択されている場合「1:申し込む」を設定
                SUBIF.HNKATO.TKTEI_KANRI_KOZA_MSKM = '1';
            }
            else {
                SUBIF.HNKATO.TKTEI_KANRI_KOZA_MSKM = JIMU_JOHO.TKTEI_KANRI_KOZA_MSKM || '';
            }
            // M0-2021-10-023 特定管理口座区分表示不備対応 終了 20211029
            // 変更後情報.加入者情報拡張登録
            SUBIF.HNKATO.KANYUSY_EXP_TORK_K = JIMU_JOHO.KANYUSY_EXP_TORK_K || '';
            // 変更後情報.NISA口座開設
            SUBIF.HNKATO.NISA_KOZA_MSKM = JIMU_JOHO.NISA_KOZA_MSKM || '';
            // 変更後情報.株式数比例配分方式申込
            SUBIF.HNKATO.HIREIHAIBUN = JIMU_JOHO.HIREIHAIBUN || '';
            // 変更後情報.個人番号告知
            SUBIF.HNKATO.MYNO_KOKUCHI = JIMU_JOHO.MYNO_KOKUCHI || '';
            // 振込先口座変更フラグ
            SUBIF.KOZA_F = '0';
            // 振込先口座-登録
            if (JIMU_JOHO.KOZA && JIMU_JOHO.KOZA.length) {
                for (var i = 0, length = JIMU_JOHO.KOZA.length; i < length; i++) {
                    var koza = JIMU_JOHO.KOZA[i];
                    if (koza.KOZA_TORK_NO == '20' && INPUT_FLG_CONTROL.BK_KOZA_ADD_F == '1') {
                        // 変更後情報.振込先口座-登録No_登録_銀行
                        SUBIF.HNKATO.KOZA_TORK_NO_ADD_BK = koza.KOZA_TORK_NO;
                        // 変更後情報.振込先口座-金融機関コード_登録_銀行
                        SUBIF.HNKATO.KOZA_BK_C_ADD_BK = koza.KOZA_BK_C_ADD_BK;
                        // 変更後情報.振込先口座-支店コード_登録_銀行
                        SUBIF.HNKATO.KOZA_MISE_C_ADD_BK = koza.KOZA_MISE_C_ADD_BK;
                        // 変更後情報.振込先口座-預金種目_登録_銀行
                        SUBIF.HNKATO.KOZA_YOKNKND_ADD_BK = koza.KOZA_YOKNKND_ADD_BK;
                        // 変更後情報.振込先口座-口座番号_登録_銀行
                        SUBIF.HNKATO.KOZA_KOZA_CD_ADD_BK = koza.KOZA_KOZA_CD_ADD_BK;
                        // 振込先口座変更フラグ
                        SUBIF.KOZA_F = '1';
                    }
                    else if (koza.KOZA_TORK_NO == '30' && INPUT_FLG_CONTROL.YUCH_KOZA_ADD_F == '1') {
                        // 変更後情報.振込先口座-登録No_登録_郵貯
                        SUBIF.HNKATO.KOZA_TORK_NO_ADD_YUCH = koza.KOZA_TORK_NO;
                        // 変更後情報.振込先口座-記号_登録_郵貯
                        SUBIF.HNKATO.KOZA_BK_C_ADD_YUCH = koza.KOZA_BK_C_ADD_YUCH;
                        // 変更後情報.振込先口座-通帳番号_登録_郵貯
                        SUBIF.HNKATO.KOZA_KOZA_CD_ADD_YUCH = koza.YUCH_BK_KOZA_CD_ADD_YUCH;
                        // 振込先口座変更フラグ
                        SUBIF.KOZA_F = '1';
                    }
                }
            }
            // 変更後情報.振込先口座-登録No_登録_郵貯
            if (!SUBIF.HNKATO.KOZA_TORK_NO_ADD_YUCH) {
                SUBIF.HNKATO.KOZA_TORK_NO_ADD_YUCH = '';
            }
            // 変更後情報.振込先口座-記号_登録_郵貯
            if (!SUBIF.HNKATO.KOZA_BK_C_ADD_YUCH) {
                SUBIF.HNKATO.KOZA_BK_C_ADD_YUCH = '';
            }
            // 変更後情報.振込先口座-通帳番号_登録_郵貯
            if (!SUBIF.HNKATO.KOZA_KOZA_CD_ADD_YUCH) {
                SUBIF.HNKATO.KOZA_KOZA_CD_ADD_YUCH = '';
            }
            // 変更後情報.振込先口座-登録No_登録_銀行
            if (!SUBIF.HNKATO.KOZA_TORK_NO_ADD_BK) {
                SUBIF.HNKATO.KOZA_TORK_NO_ADD_BK = '';
            }
            // 変更後情報.振込先口座-金融機関コード_登録_銀行
            if (!SUBIF.HNKATO.KOZA_BK_C_ADD_BK) {
                SUBIF.HNKATO.KOZA_BK_C_ADD_BK = '';
            }
            // 変更後情報.振込先口座-支店コード_登録_銀行
            if (!SUBIF.HNKATO.KOZA_MISE_C_ADD_BK) {
                SUBIF.HNKATO.KOZA_MISE_C_ADD_BK = '';
            }
            // 変更後情報.振込先口座-預金種目_登録_銀行
            if (!SUBIF.HNKATO.KOZA_YOKNKND_ADD_BK) {
                SUBIF.HNKATO.KOZA_YOKNKND_ADD_BK = '';
            }
            // 変更後情報.振込先口座-口座番号_登録_銀行
            if (!SUBIF.HNKATO.KOZA_KOZA_CD_ADD_BK) {
                SUBIF.HNKATO.KOZA_KOZA_CD_ADD_BK = '';
            }
            // 振込先口座-削除
            if (INPUT_FLG_CONTROL.KOZA_DEL_F && INPUT_FLG_CONTROL.KOZA_DEL_F.length) {
                for (var i = 0, length = INPUT_FLG_CONTROL.KOZA_DEL_F.length; i < length; i++) {
                    var kozaDelF = INPUT_FLG_CONTROL.KOZA_DEL_F[i];
                    if (kozaDelF == '1') {
                        // 振込先口座変更フラグ
                        SUBIF.KOZA_F = '1';
                    }
                }
            }
            // 2020/11/19 インシデント対応 追加開始
            // 振込先口座-削除
            if (JIMU_JOHO.DEL_KOZA_TORK_NO_LIST && JIMU_JOHO.DEL_KOZA_TORK_NO_LIST.length > 0) {
                // 削除フラグ(固定値)
                var kozaDelFlag = '1';
                // 登録Noに合わせてフラグを設定
                for (var i = 0; i < JIMU_JOHO.DEL_KOZA_TORK_NO_LIST.length; i++) {
                    var delKozaTorkNo = JIMU_JOHO.DEL_KOZA_TORK_NO_LIST[i];
                    // 変更後情報.振込先口座-登録No_削除01
                    if ('01' == delKozaTorkNo) {
                        SUBIF.HNKATO.KOZA_TORK_NO_DEL01 = kozaDelFlag;
                    }
                    else if ('02' == delKozaTorkNo) {
                        SUBIF.HNKATO.KOZA_TORK_NO_DEL02 = kozaDelFlag;
                    }
                    else if ('03' == delKozaTorkNo) {
                        SUBIF.HNKATO.KOZA_TORK_NO_DEL03 = kozaDelFlag;
                    }
                    else if ('04' == delKozaTorkNo) {
                        SUBIF.HNKATO.KOZA_TORK_NO_DEL04 = kozaDelFlag;
                    }
                    else if ('05' == delKozaTorkNo) {
                        SUBIF.HNKATO.KOZA_TORK_NO_DEL05 = kozaDelFlag;
                    }
                    else if ('06' == delKozaTorkNo) {
                        SUBIF.HNKATO.KOZA_TORK_NO_DEL06 = kozaDelFlag;
                    }
                    else if ('07' == delKozaTorkNo) {
                        SUBIF.HNKATO.KOZA_TORK_NO_DEL07 = kozaDelFlag;
                    }
                    else if ('08' == delKozaTorkNo) {
                        SUBIF.HNKATO.KOZA_TORK_NO_DEL08 = kozaDelFlag;
                    }
                    else if ('09' == delKozaTorkNo) {
                        SUBIF.HNKATO.KOZA_TORK_NO_DEL09 = kozaDelFlag;
                    }
                }
            }
            // 2020/11/19 インシデント対応 追加終了
            // 変更後情報.振込先口座-登録No_削除01
            if (!SUBIF.HNKATO.KOZA_TORK_NO_DEL01) {
                SUBIF.HNKATO.KOZA_TORK_NO_DEL01 = '';
            }
            // 変更後情報.振込先口座-登録No_削除02
            if (!SUBIF.HNKATO.KOZA_TORK_NO_DEL02) {
                SUBIF.HNKATO.KOZA_TORK_NO_DEL02 = '';
            }
            // 変更後情報.振込先口座-登録No_削除03
            if (!SUBIF.HNKATO.KOZA_TORK_NO_DEL03) {
                SUBIF.HNKATO.KOZA_TORK_NO_DEL03 = '';
            }
            // 変更後情報.振込先口座-登録No_削除04
            if (!SUBIF.HNKATO.KOZA_TORK_NO_DEL04) {
                SUBIF.HNKATO.KOZA_TORK_NO_DEL04 = '';
            }
            // 変更後情報.振込先口座-登録No_削除05
            if (!SUBIF.HNKATO.KOZA_TORK_NO_DEL05) {
                SUBIF.HNKATO.KOZA_TORK_NO_DEL05 = '';
            }
            // 変更後情報.振込先口座-登録No_削除06
            if (!SUBIF.HNKATO.KOZA_TORK_NO_DEL06) {
                SUBIF.HNKATO.KOZA_TORK_NO_DEL06 = '';
            }
            // 変更後情報.振込先口座-登録No_削除07
            if (!SUBIF.HNKATO.KOZA_TORK_NO_DEL07) {
                SUBIF.HNKATO.KOZA_TORK_NO_DEL07 = '';
            }
            // 変更後情報.振込先口座-登録No_削除08
            if (!SUBIF.HNKATO.KOZA_TORK_NO_DEL08) {
                SUBIF.HNKATO.KOZA_TORK_NO_DEL08 = '';
            }
            // 変更後情報.振込先口座-登録No_削除09
            if (!SUBIF.HNKATO.KOZA_TORK_NO_DEL09) {
                SUBIF.HNKATO.KOZA_TORK_NO_DEL09 = '';
            }
            // 変更後情報.利金・分配金支払方法（包括）預り金入金
            SUBIF.HNKATO.SUKN_HKT_AZKR = JIMU_JOHO.SUKN_HKT_AZKR || '';
            // 変更後情報.利金・分配金支払方法（包括）登録銀行
            SUBIF.HNKATO.SUKN_HKT_TRKNO = JIMU_JOHO.SUKN_HKT_TRKNO || '';
            // 変更後情報.利金・分配金支払方法（銘柄）
            SUBIF.HNKATO.SUKN_HKT_K = JIMU_JOHO.SUKN_HKT_MEIG_K || '';
            // 変更後情報.外証の円貨利金分配金預り金入金
            SUBIF.HNKATO.GAIK_SYKN_YEN_SUKN_AZKR = JIMU_JOHO.GAIK_SYKN_YEN_SUKN_AZKR || '';
            // 変更後情報.外証の円貨利金分配金振込銀行
            SUBIF.HNKATO.GAIK_SYKN_YEN_SUKN_BK = JIMU_JOHO.GAIK_SYKN_YEN_SUKN_BK || '';
            // 変更後情報.累投（株投型）分配金買付停止区分
            SUBIF.HNKATO.RUITOU_SUKN_KAIT_TEIS_K = JIMU_JOHO.RUITOU_SUKN_KAIT_TEIS_K || '';
            // 変更後情報.累投（株投型）分配金入金先変更
            SUBIF.HNKATO.RUITOU_SUKN_TRKNO = JIMU_JOHO.RUITOU_SUKN_TRKNO || '';
            // 変更後情報.配当金受領方式申込区分
            SUBIF.HNKATO.HAITKN_SYKN_UKTR_MSKM = JIMU_JOHO.HAITKN_SYKN_UKTR_MSKM || '';
            // 変更後情報.配当金受領方式（全銘柄振込先指定方式）
            SUBIF.HNKATO.AMEIG_FURIKOMI = JIMU_JOHO.AMEIG_FURIKOMI || '';
            // 日興カード暗証番号（ECB暗号化）
            if (PIN_JOHO.NIKKO_CARD_PIN) {
                SUBIF.NIKKO_CARD_PIN = AppCom.Encrypt.encryptAES128ECB(PIN_JOHO.NIKKO_CARD_PIN) || '';
            }
            else {
                SUBIF.NIKKO_CARD_PIN = '';
            }
            // 日興カード申込確認区分
            SUBIF.NIKKO_CARD_MSKM_K = PIN_JOHO.NIKKO_CARD_MSKM_K || '';
            // 本人確認書類（1種類目）読み取り可能確認区分
            SUBIF.HONIN_KAKNIN_SY1_YMTR_K = KAKNIN_SY_CHK_JOHO.HONIN_KAKNIN_SY1_YMTR_K || '';
            // 本人確認書類（1種類目）写り込み確認区分
            SUBIF.HONIN_KAKNIN_SY1_UTRK_K = KAKNIN_SY_CHK_JOHO.HONIN_KAKNIN_SY1_UTRK_K || '';
            // 本人確認書類（1種類目）自動塗りつぶし確認区分
            SUBIF.HONIN_KAKNIN_SY1_NRTB_K = KAKNIN_SY_CHK_JOHO.HONIN_KAKNIN_SY1_NRTB_K || '';
            // 本人確認書類（1種類目）新旧情報記載確認区分
            SUBIF.HONIN_KAKNIN_SY1_SINKYU_K = KAKNIN_SY_CHK_JOHO.HONIN_KAKNIN_SY1_SINKYU_K || '';
            // 本人確認書類（2種類目）読み取り可能確認区分
            SUBIF.HONIN_KAKNIN_SY2_YMTR_K = KAKNIN_SY_CHK_JOHO.HONIN_KAKNIN_SY2_YMTR_K || '';
            // 本人確認書類（2種類目）写り込み確認区分
            SUBIF.HONIN_KAKNIN_SY2_UTRK_K = KAKNIN_SY_CHK_JOHO.HONIN_KAKNIN_SY2_UTRK_K || '';
            // 本人確認書類（2種類目）新旧情報記載確認区分
            SUBIF.HONIN_KAKNIN_SY2_SINKYU_K = KAKNIN_SY_CHK_JOHO.HONIN_KAKNIN_SY2_SINKYU_K || '';
            // 自動塗りつぶし解除区分
            SUBIF.JIDO_NRTBS_KJY = KAKNIN_SY_CHK_JOHO.JIDO_NRTBS_KJY || '';
            // 本人確認書類（1種類目）個人番号記載確認区分
            SUBIF.HONIN_KAKNIN_SY1_MYNO_K = KAKNIN_SY_CHK_JOHO.HONIN_KAKNIN_SY1_MYNO_K || '';
            // 本人確認書類（2種類目）個人番号記載確認区分
            SUBIF.HONIN_KAKNIN_SY2_MYNO_K = KAKNIN_SY_CHK_JOHO.HONIN_KAKNIN_SY2_MYNO_K || '';
            // 交付方式
            SUBIF.KOFU_HSK = EIGYOIN_JOHO.KOFU_HSK || '';
            // 営業員備考
            SUBIF.EIGYOIN_BIKO =
                EIGYOIN_JOHO.EIGYOIN_BIKO
                    ? AppCom.StringUtil.utf16ToBase64(EIGYOIN_JOHO.EIGYOIN_BIKO)
                    : '';
            // 氏名変更時の関係書類の再受入れ確認区分
            SUBIF.SAIUKEIRE_K = EIGYOIN_KAKNIN_JOHO.SAIUKEIRE_K || '';
            // 氏名変更時の外貨振込先口座名再登録確認区分
            SUBIF.GAIKA_KOZA_SAITRK_K = EIGYOIN_KAKNIN_JOHO.GAIKA_KOZA_SAITRK_K || '';
            // 氏名変更時の拡張登録変更確認区分
            SUBIF.EXPTRKHNK_K = EIGYOIN_KAKNIN_JOHO.EXPTRKHNK_K || '';
            // 氏名変更時のマル優・特別マル優確認区分
            SUBIF.NM_MARUYU_K = EIGYOIN_KAKNIN_JOHO.NM_MARUYU_K || '';
            // 氏名変更時の届出印確認区分
            SUBIF.SEAL_K = EIGYOIN_KAKNIN_JOHO.SEAL_K || '';
            // 氏名変更時の配当金受領方式確認区分
            SUBIF.HAITKN_K = EIGYOIN_KAKNIN_JOHO.HAITKN_K || '';
            // 住所変更時の送付先変更確認区分
            SUBIF.SENDSK_HNK_K = EIGYOIN_KAKNIN_JOHO.SENDSK_HNK_K || '';
            // 住所変更時のマル優・特別マル優確認区分
            SUBIF.JYS_MARUYU_K = EIGYOIN_KAKNIN_JOHO.JYS_MARUYU_K || '';
            // 住所変更時の拡張登録変更確認区分
            SUBIF.JYS_EXPTRKHNK_K = EIGYOIN_KAKNIN_JOHO.JYS_EXPTRKHNK_K || '';
            // おなまえ変更フラグ
            SUBIF.KYAKNM_F = INPUT_FLG_CONTROL.KYAKNM_F || '';
            // ご住所変更フラグ
            SUBIF.KYAK_ADDR_F = INPUT_FLG_CONTROL.KYAK_ADDR_F || '';
            // 電話番号変更フラグ
            SUBIF.TELNO_F = INPUT_FLG_CONTROL.TELNO_F || '';
            // 日興MRF変更フラグ
            SUBIF.NIKKO_MRF_F = INPUT_FLG_CONTROL.NIKKO_MRF_F || '';
            // 日興カード変更フラグ
            SUBIF.NIKKO_CARD_F = INPUT_FLG_CONTROL.NIKKO_CARD_F || '';
            // 日興EZ変更フラグ
            SUBIF.NIKKO_EZ_F = INPUT_FLG_CONTROL.NIKKO_EZ_F || '';
            // 外国証券取引口座変更フラグ
            SUBIF.GAIK_SYKN_KOZA_F = INPUT_FLG_CONTROL.GAIK_SYKN_KOZA_F || '';
            // 特定口座変更フラグ
            SUBIF.TKTEI_KOZA_F = INPUT_FLG_CONTROL.TKTEI_KOZA_F || '';
            // 特定管理口座変更フラグ
            // M0-2021-10-023 特定管理口座区分表示不備対応 開始 20211029
            if (tkteiKozaNotExist && tkteiKozaSelected == '1') {
                // 特定口座が未開設かつ申込[1]選択されている場合「1:変更あり」を設定
                SUBIF.TKTEI_KANRI_KOZA_F = '1';
            }
            else {
                SUBIF.TKTEI_KANRI_KOZA_F = INPUT_FLG_CONTROL.TKTEI_KANRI_KOZA_F || '';
            }
            // M0-2021-10-023 特定管理口座区分表示不備対応 終了 20211029
            // 加入者情報拡張登録変更フラグ
            SUBIF.KANYUSY_EXP_F = INPUT_FLG_CONTROL.KANYUSY_EXP_F || '';
            // NISA口座開設フラグ
            SUBIF.NISA_KOZA_F = INPUT_FLG_CONTROL.NISA_KOZA_F || '';
            // 個人番号告知フラグ
            SUBIF.MYNO_KOKUCHI_F = INPUT_FLG_CONTROL.MYNO_KOKUCHI_F || '';
            // 振込先口座変更フラグ
            SUBIF.KOZA_F = SUBIF.KOZA_F || '';
            // 利金・分配金支払方法（包括）変更フラグ
            SUBIF.SUKN_HKT_F = INPUT_FLG_CONTROL.SUKN_HKT_F || '';
            // 利金・分配金支払方法（銘柄）変更フラグ
            SUBIF.SUKN_HKT_MEIG_F = INPUT_FLG_CONTROL.SUKN_HKT_MEIG_F || '';
            // 外国証券の円貨利金分配金振込銀行変更フラグ
            SUBIF.GAIK_SYKN_YEN_F = INPUT_FLG_CONTROL.GAIK_SYKN_YEN_F || '';
            // 累投（株投型）分配金買付停止変更フラグ
            SUBIF.RUITOU_SUKN_KAIT_TEIS_F = INPUT_FLG_CONTROL.RUITOU_SUKN_KAIT_TEIS_F || '';
            // 配当金受領方式変更フラグ
            SUBIF.HAITKN_SYKN_UKTR_F = INPUT_FLG_CONTROL.HAITKN_SYKN_UKTR_F || '';
            // 本人確認書類1種類目画像1
            if (imageData.HONIN_KAKNIN_SY1_GAZO1) {
                SUBIF.HONIN_KAKNIN_SY1_GAZO1 = imageData.HONIN_KAKNIN_SY1_GAZO1;
            }
            else {
                SUBIF.HONIN_KAKNIN_SY1_GAZO1 = '';
            }
            // 本人確認書類1種類目画像2
            if (imageData.HONIN_KAKNIN_SY1_GAZO2) {
                SUBIF.HONIN_KAKNIN_SY1_GAZO2 = imageData.HONIN_KAKNIN_SY1_GAZO2;
            }
            else {
                SUBIF.HONIN_KAKNIN_SY1_GAZO2 = '';
            }
            // 本人確認書類1種類目画像3
            if (imageData.HONIN_KAKNIN_SY1_GAZO3) {
                SUBIF.HONIN_KAKNIN_SY1_GAZO3 = imageData.HONIN_KAKNIN_SY1_GAZO3;
            }
            else {
                SUBIF.HONIN_KAKNIN_SY1_GAZO3 = '';
            }
            // 本人確認書類2種類目画像1
            if (imageData.HONIN_KAKNIN_SY2_GAZO1) {
                SUBIF.HONIN_KAKNIN_SY2_GAZO1 = imageData.HONIN_KAKNIN_SY2_GAZO1;
            }
            else {
                SUBIF.HONIN_KAKNIN_SY2_GAZO1 = '';
            }
            // 本人確認書類2種類目画像2
            if (imageData.HONIN_KAKNIN_SY2_GAZO2) {
                SUBIF.HONIN_KAKNIN_SY2_GAZO2 = imageData.HONIN_KAKNIN_SY2_GAZO2;
            }
            else {
                SUBIF.HONIN_KAKNIN_SY2_GAZO2 = '';
            }
            // 本人確認書類2種類目画像3
            if (imageData.HONIN_KAKNIN_SY2_GAZO3) {
                SUBIF.HONIN_KAKNIN_SY2_GAZO3 = imageData.HONIN_KAKNIN_SY2_GAZO3;
            }
            else {
                SUBIF.HONIN_KAKNIN_SY2_GAZO3 = '';
            }
            // 署名画像
            if (imageData.SYM_GAZO) {
                SUBIF.SYM_GAZO = imageData.SYM_GAZO;
            }
            else {
                SUBIF.SYM_GAZO = '';
            }
            // ストローク情報
            SUBIF.SYM_STRK = imageData.SYM_STRK || '';
            return SUBIF;
        };
        /**
         * 受付NO通番の取得
         *
         * @param {(rcptNoTubn: number) => void} successCallback - 成功時のコールバック関数
         * @param {(error: {msg: string, param: any}) => void} errorCallback - 失敗時のコールバック関数
         * @returns void
         */
        var searchRrcptNoTubn = function (successCallback, errorCallback) {
            // DBオブジェクト
            var logDb = AppCom.ClientDb.open();
            new Promise((resolve, reject) => {
                // 受付NO通番取得
                var sql = 'SELECT RCPT_NO_TUBN FROM KR_RCPT_NO_KNR';
                AppCom.ClientDb.execSQL(logDb, sql, [], (resultSet) => {
                    // 成功
                    var row = resultSet.rows.item(0);
                    if (row) {
                        return resolve(row.RCPT_NO_TUBN);
                    }
                    else {
                        return reject({
                            msg: '受付NO通番取得結果0件エラー',
                            param: '',
                        });
                    }
                }, (error) => {
                    // 失敗
                    return reject({
                        msg: '受付NO通番取得エラー',
                        param: error,
                    });
                });
            }).then((rcptNoTubn) => {
                return new Promise((resolve, reject) => {
                    // 受付NO通番カウントアップ
                    var sql = 'UPDATE KR_RCPT_NO_KNR SET RCPT_NO_TUBN = ?';
                    var increment = rcptNoTubn + 1;
                    AppCom.ClientDb.execSQL(logDb, sql, [increment], () => {
                        // 成功
                        return resolve(increment);
                    }, (error) => {
                        // 失敗
                        return reject({
                            msg: '受付NO通番カウントアップエラー',
                            param: error,
                        });
                    });
                });
            }).then((rcptNoTubn) => {
                // 成功
                return successCallback(rcptNoTubn);
            }).catch((error) => {
                // 失敗
                return errorCallback(error);
            });
        };
        /**
         * 「SUBIF-SEND：申込データ送信」REDOSサーバ送信機能
         *
         * @param {string} type - 申込区分
         * @param {any} formData - SUBIF-SEND：申込データ送信
         * @param {() => void} successCallback - 成功時のコールバック関数
         * @param {(error: { msg: string, param: any}) => void } errorCallback - 失敗時のコールバック関数
         * @returns void
         */
        var sendSubif = function (type, formData, successCallback, errorCallback) {
            var SUBIF_CONST = type == '2' ? appConst.SUBIF008 : appConst.SUBIF009;
            // REDOSサーバに申込データ送信
            AppCom.Http.post(SUBIF_CONST.PATH, formData, (subifRecv, status) => {
                if (status != appConst.HTTP_OK) {
                    // 通信エラー
                    return errorCallback({
                        msg: '申込データ送信通信エラー',
                        param: { data: subifRecv, status: status },
                    });
                }
                if (subifRecv.RESULT_CODE == SUBIF_CONST.RESULT_CODE.OK) {
                    // 成功
                    return successCallback();
                }
                else if (subifRecv.RESULT_CODE == SUBIF_CONST.RESULT_CODE.OFFLINE) {
                    // サービス時間外
                    return errorCallback({
                        msg: '申込データ送信サービス時間外エラー',
                        param: { data: subifRecv, status: status },
                    });
                }
                else if (subifRecv.RESULT_CODE == SUBIF_CONST.RESULT_CODE.OTHER_ERROR) {
                    // その他エラー
                    return errorCallback({
                        msg: '申込データ送信その他エラー',
                        param: { data: subifRecv, status: status },
                    });
                }
                else {
                    // 通信エラー
                    return errorCallback({
                        msg: '申込データ送信通信エラー',
                        param: { data: subifRecv, status: status },
                    });
                }
            }, (subifRecv, status) => {
                // 通信エラー
                return errorCallback({
                    msg: '申込データ送信通信エラー',
                    param: { data: subifRecv, status: status },
                });
            }, true);
        };
        /**
         * 申込データ送信（マルチパート変換、サーバ送信、SLSデータ削除）
         *
         * @param {any} subifSend - サブインターフェース
         * @param {string} type - 申込区分
         * @param {string} key - SLSキー
         * @param {() => void} successCallback - 成功時のコールバック関数
         * @param {(error: { msg: string, param: any }) => void} errorCallback - 失敗時のコールバック関数
         * @returns void
         */
        var sendToServer = function (subifSend, type, key, successCallback, errorCallback) {
            new Promise((resolve, reject) => {
                try {
                    // マルチパート変換
                    var formData = conversionMultipart(subifSend);
                    return resolve(formData);
                }
                catch (error) {
                    // 失敗
                    return reject({
                        msg: 'サブインターフェースマルチパート変換エラー',
                        param: error,
                    });
                }
            }).then((formData) => {
                return new Promise((resolve, reject) => {
                    // REDOSサーバにSUBIF送信
                    sendSubif(type, formData, () => {
                        // 成功
                        return resolve();
                    }, (error) => {
                        // 失敗
                        return reject(error);
                    });
                });
            }).then(() => {
                return new Promise((resolve, reject) => {
                    // 申込データSLS削除
                    deleteSlsApplyInfo(key, () => {
                        return resolve();
                    }, (error) => {
                        // 失敗
                        return reject(error);
                    });
                });
            }).then(() => {
                // 成功
                return successCallback();
            }).catch((error) => {
                // 失敗
                return errorCallback(error);
            });
        };
        /**
         * 申込データ送信（SLSデータ取得、マルチパート変換、サーバ送信、SLSデータ削除）
         *
         * @param {string} key - SLSキー
         * @param {() => void} successCallback - 成功時のコールバック関数
         * @param {(error: { msg: string, param: any }) => void} errorCallback - 失敗時のコールバック関数
         * @returns void
         */
        var sendApplyInfo = function (key, successCallback, errorCallback) {
            new Promise((resolve, reject) => {
                // SLSデータを取得
                logicCom.getSLSDatas([key], (data) => {
                    // 成功
                    if (!data || !data.length) {
                        return reject({
                            msg: 'SLSデータ取得0件エラー',
                            param: '',
                        });
                    }
                    else {
                        return resolve({
                            subifSend: data[0][1],
                            type: key.slice(-1)
                        });
                    }
                }, (error) => {
                    // 失敗
                    return reject({
                        msg: 'SLSデータ取得エラー',
                        param: error,
                    });
                });
            }).then((subifInfo) => {
                return new Promise((resolve, reject) => {
                    try {
                        // マルチパート変換
                        var formData = conversionMultipart(subifInfo.subifSend);
                        return resolve({
                            formData: formData,
                            type: subifInfo.type
                        });
                    }
                    catch (error) {
                        // 失敗
                        return reject({
                            msg: 'サブインターフェースマルチパート変換エラー',
                            param: error,
                        });
                    }
                });
            }).then((subifInfo) => {
                return new Promise((resolve, reject) => {
                    // REDOSサーバにSUBIF送信
                    sendSubif(subifInfo.type, subifInfo.formData, () => {
                        // 成功
                        return resolve();
                    }, (error) => {
                        // 失敗
                        return reject(error);
                    });
                });
            }).then(() => {
                return new Promise((resolve, reject) => {
                    // 申込データSLS削除
                    deleteSlsApplyInfo(key, () => {
                        return resolve();
                    }, (error) => {
                        // 失敗
                        return reject(error);
                    });
                });
            }).then(() => {
                // 成功
                return successCallback();
            }).catch((error) => {
                // 失敗
                return errorCallback(error);
            });
        };
        $scope.sendApplyInfo = sendApplyInfo;
        /**
         * マルチパート変換（SUBIF-SEND：申込データ送信）
         *
         * @param {string} type - 申込区分
         * @param {any} subIf - SUBIF-SEND：申込データ送信
         * @returns {any} formData - マルチパート変換後 SUBIF-SEND：申込データ送信
         */
        var conversionMultipart = function (subIf) {
            var formData = new FormData();
            // 本人確認書類1種類目画像1
            if (subIf.HONIN_KAKNIN_SY1_GAZO1) {
                formData.append('HONIN_KAKNIN_SY1_GAZO1', subIf.HONIN_KAKNIN_SY1_GAZO1);
            }
            delete subIf.HONIN_KAKNIN_SY1_GAZO1;
            // 本人確認書類1種類目画像2
            if (subIf.HONIN_KAKNIN_SY1_GAZO2) {
                formData.append('HONIN_KAKNIN_SY1_GAZO2', subIf.HONIN_KAKNIN_SY1_GAZO2);
            }
            delete subIf.HONIN_KAKNIN_SY1_GAZO2;
            // 本人確認書類1種類目画像3
            if (subIf.HONIN_KAKNIN_SY1_GAZO3) {
                formData.append('HONIN_KAKNIN_SY1_GAZO3', subIf.HONIN_KAKNIN_SY1_GAZO3);
            }
            delete subIf.HONIN_KAKNIN_SY1_GAZO3;
            // 本人確認書類2種類目画像1
            if (subIf.HONIN_KAKNIN_SY2_GAZO1) {
                formData.append('HONIN_KAKNIN_SY2_GAZO1', subIf.HONIN_KAKNIN_SY2_GAZO1);
            }
            delete subIf.HONIN_KAKNIN_SY2_GAZO1;
            // 本人確認書類2種類目画像2
            if (subIf.HONIN_KAKNIN_SY2_GAZO2) {
                formData.append('HONIN_KAKNIN_SY2_GAZO2', subIf.HONIN_KAKNIN_SY2_GAZO2);
            }
            delete subIf.HONIN_KAKNIN_SY2_GAZO2;
            // 本人確認書類2種類目画像3
            if (subIf.HONIN_KAKNIN_SY2_GAZO3) {
                formData.append('HONIN_KAKNIN_SY2_GAZO3', subIf.HONIN_KAKNIN_SY2_GAZO3);
            }
            delete subIf.HONIN_KAKNIN_SY2_GAZO3;
            // 署名画像
            if (subIf.SYM_GAZO) {
                formData.append('SYM_GAZO', subIf.SYM_GAZO);
            }
            delete subIf.SYM_GAZO;
            // ストローク情報（事務手続き）
            if (subIf.SYM_STRK) {
                formData.append('SYM_STRK', subIf.SYM_STRK);
            }
            delete subIf.SYM_STRK;
            // 電子帳票書面画像
            if (subIf.DOC_GAZO) {
                formData.append('DOC_GAZO', subIf.DOC_GAZO);
            }
            delete subIf.DOC_GAZO;
            // ストローク情報（電子帳票）
            if (subIf.INK_DATA) {
                formData.append('INK_DATA', subIf.INK_DATA);
            }
            delete subIf.INK_DATA;
            // SUBIF-SEND：申込データ送信
            formData.append('JSON', JSON.stringify(subIf));
            return formData;
        };
    }]);
